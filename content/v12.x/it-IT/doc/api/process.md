# Processo

<!-- introduced_in=v0.10.0 -->
<!-- type=global -->

Il `process` object è un `global` che fornisce informazioni riguardo al processo Node.js corrente e lo controlla. Come un global, è sempre disponibile per le applicazioni Node.js senza usare `require()`. It can also be explicitly accessed using `require()`:

```js
const process = require('process');
```

## Process Events

Il `process` object è un'istanza di [`EventEmitter`][].

### Event: `'beforeExit'`
<!-- YAML
added: v0.11.12
-->

L'evento `'beforeExit'` viene emesso quando Node.js svuota il suo ciclo degli eventi e non ha lavoro aggiuntivo da pianificare. Normalmente, il processo Node.js uscirà quando non c'è nessun lavoro programmato, ma un listener registrato sull'evento `'beforeExit'` può effettuare chiamate asincrone e quindi far proseguire il processo Node.js.

La funzione di callback del listener è invocata con il valore di [`process.exitCode`][] passato come unico argomento.

The `'beforeExit'` event is *not* emitted for conditions causing explicit termination, such as calling [`process.exit()`][] or uncaught exceptions.

The `'beforeExit'` should *not* be used as an alternative to the `'exit'` event unless the intention is to schedule additional work.

```js
process.on('beforeExit', (code) => {
  console.log('Process beforeExit event with code: ', code);
});

process.on('exit', (code) => {
  console.log('Process exit event with code: ', code);
});

console.log('This message is displayed first.');

// Prints:
// This message is displayed first.
// Process beforeExit event with code: 0
// Process exit event with code: 0
```

### Event: `'disconnect'`
<!-- YAML
added: v0.7.7
-->

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), l'evento `'disconnect'` verrà emesso quando il canale IPC è chiuso.

### Event: `'exit'`
<!-- YAML
added: v0.1.7
-->

* `code` {integer}

L'evento `'exit'` viene emesso quando il processo Node.js sta per uscire a causa di una delle seguenti circostanze:

* Il metodo `process.exit()` viene chiamato esplicitamente;
* Il ciclo degli eventi Node.js non ha più alcun lavoro aggiuntivo da eseguire.

Non c'è modo di impedire l'uscita del ciclo degli eventi a questo punto e una volta che tutti gli `'exit'` listener hanno terminato l'esecuzione, il processo Node.js terminerà.

The listener callback function is invoked with the exit code specified either by the [`process.exitCode`][] property, or the `exitCode` argument passed to the [`process.exit()`][] method.

```js
process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
});
```

Listener functions **must** only perform **synchronous** operations. Il processo Node.js si chiuderà immediatamente dopo aver chiamato i listener dell'evento `'exit'` causando l'interruzione di qualsiasi eventuale lavoro aggiuntivo ancora accodato nel ciclo degli eventi. Nell'esempio seguente, ad esempio, il timeout non si verificherà mai:

```js
process.on('exit', (code) => {
  setTimeout(() => {
    console.log('This will not run');
  }, 0);
});
```

### Event: `'message'`
<!-- YAML
added: v0.5.10
-->

* `message` { Object | boolean | number | string | null } a parsed JSON object or a serializable primitive value.
* `sendHandle` {net.Server|net.Socket} a [`net.Server`][] or [`net.Socket`][] object, or undefined.

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), l'evento `'message'` viene emesso ogni volta che un messaggio inviato da un parent process che utilizza [`childprocess.send ()`][] viene ricevuto dal child process.

Il messaggio passa attraverso la serializzazione e il parsing. The resulting message might not be the same as what is originally sent.

If the `serialization` option was set to `advanced` used when spawning the process, the `message` argument can contain data that JSON is not able to represent. See [Advanced Serialization for `child_process`][] for more details.

### Event: `'multipleResolves'`
<!-- YAML
added: v10.12.0
-->

* `type` {string} The resolution type. One of `'resolve'` or `'reject'`.
* `promise` {Promise} The promise that resolved or rejected more than once.
* `value` {any} The value with which the promise was either resolved or rejected after the original resolve.

The `'multipleResolves'` event is emitted whenever a `Promise` has been either:

* Resolved more than once.
* Rejected more than once.
* Rejected after resolve.
* Resolved after reject.

This is useful for tracking potential errors in an application while using the `Promise` constructor, as multiple resolutions are silently swallowed. However, the occurrence of this event does not necessarily indicate an error. For example, [`Promise.race()`][] can trigger a `'multipleResolves'` event.

```js
process.on('multipleResolves', (type, promise, reason) => {
  console.error(type, promise, reason);
  setImmediate(() => process.exit(1));
});

async function main() {
  try {
    return await new Promise((resolve, reject) => {
      resolve('First call');
      resolve('Swallowed resolve');
      reject(new Error('Swallowed reject'));
    });
  } catch {
    throw new Error('Failed');
  }
}

main().then(console.log);
// resolve: Promise { 'First call' } 'Swallowed resolve'
// reject: Promise { 'First call' } Error: Swallowed reject
//     at Promise (*)
//     at new Promise (<anonymous>)
//     at main (*)
// First call
```

### Event: `'rejectionHandled'`
<!-- YAML
added: v1.4.1
-->

* `promise` {Promise} L'ultima promise gestita.

L'evento `'rejectionHandled'` viene emesso ogni volta che una `Promise` è stata rifiutata e un error handler è stato collegato ad essa (usando, ad esempio [` promise.catch ()`][]) dopo un giro del ciclo di eventi Node.js.

Il `Promise` object sarebbe stato precedentemente emesso in un evento `'unhandledRejection'`, ma durante il processo di elaborazione ha ottenuto un rejection handler.

Non esiste la nozione di un livello superiore per una catena `Promise` in cui le rejection possono essere sempre gestite. Essendo di natura intrinsecamente asincrona, una `Promise` rejection può essere gestita in un momento futuro — probabilmente molto più tardi del ciclo di eventi necessario per l'evento `'unhandledRejection'` da emettere.

Un altro modo per affermare ciò è che, a differenza del codice sincrono in cui è presente un elenco sempre crescente di eccezioni non gestite, con le Promise può esserci un elenco crescente e in diminuzione di rejection non gestite.

Nel codice sincrono, l'evento `'uncaughtException'` viene emesso quando l'elenco di eccezioni non gestite aumenta.

In codice asincrono, l'evento `'unhandledRejection'` viene emesso quando l'elenco delle rejection non gestite aumenta e l'evento `'rejectionHandled'` viene emesso quando l'elenco delle rejection non gestite si riduce.

```js
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
  unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
  unhandledRejections.delete(promise);
});
```

In questo esempio, la `unhandledRejections` `Map` crescerà e si restringerà nel tempo, riflettendo le rejection che iniziano non gestite e quindi diventano gestite. È possibile registrare tali errori in un log degli errori, periodicamente (che è probabilmente meglio per un'applicazione di lunga durata) o all'uscita del processo (che è probabilmente più conveniente per gli script).

### Event: `'uncaughtException'`
<!-- YAML
added: v0.1.18
changes:
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26599
    description: Added the `origin` argument.
-->

* `err` {Error} The uncaught exception.
* `origin` {string} Indicates if the exception originates from an unhandled rejection or from synchronous errors. Can either be `'uncaughtException'` or `'unhandledRejection'`.

L'evento `'uncaughtException'` viene emesso quando un'eccezione JavaScript non rilevata rimbalza fino al ciclo degli eventi. By default, Node.js handles such exceptions by printing the stack trace to `stderr` and exiting with code 1, overriding any previously set [`process.exitCode`][]. L'aggiunta di un handler per l'evento `'uncaughtException'` sostituisce questo comportamento predefinito. Alternatively, change the [`process.exitCode`][] in the `'uncaughtException'` handler which will result in the process exiting with the provided exit code. Otherwise, in the presence of such handler the process will exit with 0.

```js
process.on('uncaughtException', (err, origin) => {
  fs.writeSync(
    process.stderr.fd,
    `Caught exception: ${err}\n` +
    `Exception origin: ${origin}`
  );
});

setTimeout(() => {
  console.log('This will still run.');
}, 500);

// Intentionally cause an exception, but don't catch it.
nonexistentFunc();
console.log('This will not run.');
```

#### Avviso: utilizzando `'uncaughtException'` correttamente

`'uncaughtException'` is a crude mechanism for exception handling intended to be used only as a last resort. The event *should not* be used as an equivalent to `On Error Resume Next`. Le eccezioni non gestite implicano intrinsecamente che un'applicazione è in uno stato indefinito. Il tentativo di riprendere il codice dell'applicazione senza il corretto ripristino dall'eccezione può causare ulteriori problemi inattesi e imprevedibili.

Le eccezioni lanciate dall'interno del gestore dell'evento non verranno catturate. Il processo, invece, uscirà con un codice di uscita diverso da zero e la traccia dello stack verrà stampata. Questo per evitare una ricorsione infinita.

Attempting to resume normally after an uncaught exception can be similar to pulling out the power cord when upgrading a computer. Nine out of ten times, nothing happens. But the tenth time, the system becomes corrupted.

L'uso corretto di `'uncaughtException'` consiste nell'eseguire la pulizia sincrona delle risorse allocate (ad esempio i file descriptor, gli handle, ecc.) prima di arrestare il processo. **It is not safe to resume normal operation after `'uncaughtException'`.**

To restart a crashed application in a more reliable way, whether `'uncaughtException'` is emitted or not, an external monitor should be employed in a separate process to detect application failures and recover or restart as needed.

### Event: `'unhandledRejection'`
<!-- YAML
added: v1.4.1
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Not handling `Promise` rejections is deprecated.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8223
    description: Unhandled `Promise` rejections will now emit
                 a process warning.
-->

* `reason` {Error|any} L'object con cui è stata rifiutata la promise (in genere un [`error`][] object).
* `promise` {Promise} The rejected promise.

The `'unhandledRejection'` event is emitted whenever a `Promise` is rejected and no error handler is attached to the promise within a turn of the event loop. Quando si programma con le Promise, le eccezioni sono incapsulate come "rejected promises". I rejection possono essere catturati e gestiti usando [`promise.catch()`][] e vengono propagati attraverso una `Promise` chain. L'evento `'unhandledRejection'` è utile per rilevare e tenere traccia delle promise che sono state respinte, le cui rejection non sono ancora state gestite.

```js
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

somePromise.then((res) => {
  return reportToUser(JSON.pasre(res)); // Note the typo (`pasre`)
}); // No `.catch()` or `.then()`
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

In questo caso di esempio, è possibile tenere traccia del rejection come errore dello sviluppatore, come in genere accade per altri eventi `'unhandledRejection'`. Per affrontare tali fallimentii, un [`.catch(() = >{ })`][`promise.catch()`] handler non operativo può essere collegato alla `resource.loaded`, che impedirebbe l'emissione dell'evento `'unhandledRejection'`.

### Event: `'warning'`
<!-- YAML
added: v6.0.0
-->

* `warning` {Error} Key properties of the warning are:
  * `name` {string} The name of the warning. **Default:** `'Warning'`.
  * `message` {string} Una descrizione fornita dal sistema dell'avviso.
  * `stack`{string} Una traccia dello stack nella posizione nel codice in cui è stato emesso l'avviso.

L'evento `'warning'` viene emesso ogni volta che Node.js emette un process warning.

Un process warning è simile a un errore laddove descrive condizioni eccezionali che vengono portate all'attenzione dell'utente. Tuttavia, gli avvisi non fanno parte del normale flusso di gestione degli errori di Node.js e JavaScript. Node.js can emit warnings whenever it detects bad coding practices that could lead to sub-optimal application performance, bugs, or security vulnerabilities.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);    // Stampa il nome dell'avviso
  console.warn(warning.message); // Stampa il messaggio dell'avviso
  console.warn(warning.stack);   // Stampa la traccia dello stack
});
```

Per impostazione predefinita, Node.js stamperà avvisi di processo su `stderr`. L'opzione della riga di comando `--no-warnings` può essere utilizzata per eliminare l'output della console predefinito ma l'evento `'warning'` verrà comunque emesso dal `process` object.

The following example illustrates the warning that is printed to `stderr` when too many listeners have been added to an event:

```console
$ node
> events.defaultMaxListeners = 1;
> process.on('foo', () => {});
> process.on('foo', () => {});
> (node:38638) MaxListenersExceededWarning: Rilevata possibile perdita di memoria EventEmitter. Aggiunti 2 foo listener. Usa emitter.setMaxListeners() per aumentare il limite
```

Al contrario, l'esempio seguente disattiva l'output di avviso predefinito e aggiunge un handler personalizzato all'evento `'warning'`:

```console
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

The `*-deprecation` command line flags only affect warnings that use the name `'DeprecationWarning'`.

#### Emissione di avvisi personalizzati

See the [`process.emitWarning()`](#process_process_emitwarning_warning_type_code_ctor) method for issuing custom or application-specific warnings.

### Eventi Segnale

<!--type=event-->
<!--name=SIGINT, SIGHUP, etc.-->

Gli Eventi Segnale verranno emessi quando il processo Node.js riceve un segnale. Please refer to signal(7) for a listing of standard POSIX signal names such as `'SIGINT'`, `'SIGHUP'`, etc.

Signals are not available on [`Worker`][] threads.

The signal handler will receive the signal's name (`'SIGINT'`, `'SIGTERM'`, etc.) as the first argument.

Il nome di ciascun evento sarà il nome comune in maiuscolo per il segnale (ad esempio `'SIGINT'` per i segnali `SIGINT`).

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

* `'SIGUSR1'` is reserved by Node.js to start the [debugger](debugger.html). It's possible to install a listener but doing so might interfere with the debugger.
* `'SIGTERM'` and `'SIGINT'` have default handlers on non-Windows platforms that reset the terminal mode before exiting with code `128 + signal number`. If one of these signals has a listener installed, its default behavior will be removed (Node.js will no longer exit).
* `'SIGPIPE'` is ignored by default. Può avere un listener installato.
* `'SIGHUP'` is generated on Windows when the console window is closed, and on other platforms under various similar conditions. See signal(7). Può avere un listener installato, tuttavia Node.js verrà terminato incondizionatamente da Windows circa 10 secondi dopo. Su piattaforme non Windows, il comportamento predefinito di `SIGHUP` è quello di terminare Node.js, ma una volta che il listener viene installato, il suo comportamento predefinito verrà rimosso.
* `'SIGTERM'` is not supported on Windows, it can be listened on.
* `'SIGINT'` from the terminal is supported on all platforms, and can usually be generated with `<Ctrl>+C` (though this may be configurable). It is not generated when terminal raw mode is enabled.
* `'SIGBREAK'` is delivered on Windows when `<Ctrl>+<Break>` is pressed, on non-Windows platforms it can be listened on, but there is no way to send or generate it.
* `'SIGWINCH'` is delivered when the console has been resized. Su Windows, ciò avverrà solo scrivendo sulla console quando il cursore viene spostato o quando un tty leggibile in modalità raw viene utilizzato.
* `'SIGKILL'` cannot have a listener installed, it will unconditionally terminate Node.js on all platforms.
* `'SIGSTOP'` cannot have a listener installed.
* `'SIGBUS'`, `'SIGFPE'`, `'SIGSEGV'` and `'SIGILL'`, when not raised artificially using kill(2), inherently leave the process in a state from which it is not safe to attempt to call JS listeners. Doing so might lead to the process hanging in an endless loop, since listeners attached using `process.on()` are called asynchronously and therefore unable to correct the underlying problem.

Windows does not support sending signals, but Node.js offers some emulation with [`process.kill()`][], and [`subprocess.kill()`][]. Sending signal `0` can be used to test for the existence of a process. Sending `SIGINT`, `SIGTERM`, and `SIGKILL` cause the unconditional termination of the target process.

## `process.abort()`
<!-- YAML
added: v0.7.0
-->

Il metodo `process.abort()` fa sì che il processo Node.js esca immediatamente e generi un file core.

This feature is not available in [`Worker`][] threads.

## `process.allowedNodeEnvironmentFlags`
<!-- YAML
added: v10.10.0
-->

* {Set}

The `process.allowedNodeEnvironmentFlags` property is a special, read-only `Set` of flags allowable within the [`NODE_OPTIONS`][] environment variable.

`process.allowedNodeEnvironmentFlags` extends `Set`, but overrides `Set.prototype.has` to recognize several different possible flag representations.  `process.allowedNodeEnvironmentFlags.has()` will return `true` in the following cases:

* Flags may omit leading single (`-`) or double (`--`) dashes; e.g., `inspect-brk` for `--inspect-brk`, or `r` for `-r`.
* Flags passed through to V8 (as listed in `--v8-options`) may replace one or more *non-leading* dashes for an underscore, or vice-versa; e.g., `--perf_basic_prof`, `--perf-basic-prof`, `--perf_basic-prof`, etc.
* Flags may contain one or more equals (`=`) characters; all characters after and including the first equals will be ignored; e.g., `--stack-trace-limit=100`.
* Flags *must* be allowable within [`NODE_OPTIONS`][].

When iterating over `process.allowedNodeEnvironmentFlags`, flags will appear only *once*; each will begin with one or more dashes. Flags passed through to V8 will contain underscores instead of non-leading dashes:

```js
process.allowedNodeEnvironmentFlags.forEach((flag) => {
  // -r
  // --inspect-brk
  // --abort_on_uncaught_exception
  // ...
});
```

The methods `add()`, `clear()`, and `delete()` of `process.allowedNodeEnvironmentFlags` do nothing, and will fail silently.

If Node.js was compiled *without* [`NODE_OPTIONS`][] support (shown in [`process.config`][]), `process.allowedNodeEnvironmentFlags` will contain what *would have* been allowable.

## `process.arch`
<!-- YAML
added: v0.5.0
-->

* {string}

The operating system CPU architecture for which the Node.js binary was compiled. Possible values are: `'arm'`, `'arm64'`, `'ia32'`, `'mips'`,`'mipsel'`, `'ppc'`, `'ppc64'`, `'s390'`, `'s390x'`, `'x32'`, and `'x64'`.

```js
console.log(`Questa architettura del processore è ${process.arch}`);
```

## `process.argv`
<!-- YAML
added: v0.1.27
-->

* {string[]}

La proprietà `process.argv` restituisce una array contenente gli argomenti della riga di comando passati al momento dell'avvio del processo Node.js. The first element will be [`process.execPath`][]. See `process.argv0` if access to the original value of `argv[0]` is needed. Il secondo elemento sarà il percorso del file JavaScript in esecuzione. Gli elementi rimanenti saranno argomenti aggiuntivi della riga di comando.

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

## `process.argv0`
<!-- YAML
added: v6.4.0
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

## `process.channel`
<!-- YAML
added: v7.1.0
-->

* {Object}

If the Node.js process was spawned with an IPC channel (see the [Child Process](child_process.html) documentation), the `process.channel` property is a reference to the IPC channel. If no IPC channel exists, this property is `undefined`.

## `process.chdir(directory)`
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

This feature is not available in [`Worker`][] threads.

## `process.config`
<!-- YAML
added: v0.7.7
-->

* {Object}

The `process.config` property returns an `Object` containing the JavaScript representation of the configure options used to compile the current Node.js executable. È lo stesso del file `config.gypi` prodotto durante l'esecuzione dello script `./configure`.

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
     napi_build_version: 5,
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
     v8_use_snapshot: 1
   }
}
```

The `process.config` property is **not** read-only and there are existing modules in the ecosystem that are known to extend, modify, or entirely replace the value of `process.config`.

## `process.connected`<!-- YAML
added: v0.7.2
-->* {boolean}

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), la proprietà `process.connected` verrà restituita `true` fino a quando il canale IPC è connesso e restituirà `false` dopo che `process.disconnect()` viene chiamato.

Una volta che `process.connected` è `false`, non è più possibile inviare messaggi tramite il canale IPC utilizzando `process.send()`.

## `process.cpuUsage([previousValue])`<!-- YAML
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

## `process.cwd()`<!-- YAML
added: v0.1.8
-->* Restituisce: {string}

Il metodo `process.cwd()` restituisce la directory di lavoro corrente del processo Node.js.

```js
console.log(`Current directory: ${process.cwd()}`);
```

## `process.debugPort`<!-- YAML
added: v0.7.2
-->* {number}

La porta utilizzata dal debugger di Node.js quando abilitata.

```js
process.debugPort = 5858;
```

## `process.disconnect()`
<!-- YAML
added: v0.7.2
-->

Se il processo Node.js viene generato con un canale IPC (consultare la documentazione [Child Process](child_process.html) e [Cluster](cluster.html)), ll metodo `process.disconnect()` chiuderà il canale IPC al parent process, permettendo al child process di eseguire l'uscita in modo corretto una volta che non ci sono altre connessioni che lo mantengono in vita.

The effect of calling `process.disconnect()` is the same as calling [`ChildProcess.disconnect()`][] from the parent process.

Se il processo Node.js non è stato generato con un canale IPC,`process.disconnect()` sarà `undefined`.

## `process.dlopen(modulo, filename[, i flag])`<!-- YAML
added: v0.1.16
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/12794
    description: Added support for the `flags` argument.
-->* `module` {Object}
* `filename` {string}
* `flags` {os.constants.dlopen} **Default:** `os.constants.dlopen.RTLD_LAZY`

The `process.dlopen()` method allows to dynamically load shared objects. It is primarily used by `require()` to load C++ Addons, and should not be used directly, except in special cases. In other words, [`require()`][] should be preferred over `process.dlopen()`, unless there are specific reasons.

The `flags` argument is an integer that allows to specify dlopen behavior. See the [`os.constants.dlopen`][] documentation for details.

If there are specific reasons to use `process.dlopen()` (for instance, to specify dlopen flags), it's often useful to use [`require.resolve()`][] to look up the module's path.

An important drawback when calling `process.dlopen()` is that the `module` instance must be passed. Functions exported by the C++ Addon will be accessible via `module.exports`.

The example below shows how to load a C++ Addon, named as `binding`, that exports a `foo` function. All the symbols will be loaded before the call returns, by passing the `RTLD_NOW` constant. In this example the constant is assumed to be available.

```js
const os = require('os');
process.dlopen(module, require.resolve('binding'),
               os.constants.dlopen.RTLD_NOW);
module.exports.foo();
```

## `process.emitWarning(warning[, options])`<!-- YAML
added: v8.0.0
-->* `warning` {string|Error} L'avviso da emettere.
* `options` {Object}
  * `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Default:** `'Warning'`.
  * `code` {string} Un identificativo univoco per l'istanza di avviso che viene emessa.
  * `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.
  * `detail` {string} Testo addizionale da includere con l'errore.

Il metodo `process.emitWarning()` può essere utilizzato per emettere avvisi di processo personalizzati o specifici dell'applicazione. These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

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

In this example, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`'warning'`](#process_event_warning) handler.

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

## `process.emitWarning(warning[, type[, code]][, ctor])`<!-- YAML
added: v6.0.0
-->* `warning` {string|Error} L'avviso da emettere.
* `type` {string} When `warning` is a `String`, `type` is the name to use for the *type* of warning being emitted. **Default:** `'Warning'`.
* `code` {string} Un identificativo univoco per l'istanza di avviso che viene emessa.
* `ctor` {Function} When `warning` is a `String`, `ctor` is an optional function used to limit the generated stack trace. **Default:** `process.emitWarning`.

Il metodo `process.emitWarning()` può essere utilizzato per emettere avvisi di processo personalizzati o specifici dell'applicazione. These can be listened for by adding a handler to the [`'warning'`](#process_event_warning) event.

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

In each of the previous examples, an `Error` object is generated internally by `process.emitWarning()` and passed through to the [`'warning'`](#process_event_warning) handler.

```js
process.on('warning', (warning) => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.code);
  console.warn(warning.stack);
});
```

If `warning` is passed as an `Error` object, it will be passed through to the `'warning'` event handler unmodified (and the optional `type`, `code` and `ctor` arguments will be ignored):

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

While process warnings use `Error` objects, the process warning mechanism is **not** a replacement for normal error handling mechanisms.

The following additional handling is implemented if the warning `type` is `'DeprecationWarning'`:

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

## `process.env`<!-- YAML
added: v0.1.27
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26544
    description: Worker threads will now use a copy of the parent thread’s
                 `process.env` by default, configurable through the `env`
                 option of the `Worker` constructor.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18990
    description: Implicit conversion of variable value to string is deprecated.
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

It is possible to modify this object, but such modifications will not be reflected outside the Node.js process, or (unless explicitly requested) to other [`Worker`][] threads. In other words, the following example would not work:

```console
$ node -e 'process.env.foo = "bar"' && echo $foo
```

Mentre il seguente sarà:

```js
rocess.env.foo = 'bar';
console.log(process.env.foo);
```

Assegnare una proprietà su `process.env` convertirà implicitamente il valore ad una stringa. **This behavior is deprecated.** Future versions of Node.js may throw an error when the value is not a string, number, or boolean.

```js
process.env.test = null;
console.log(process.env.test);
// => 'null'
process.env.test = undefined;
console.log(process.env.test);
// => 'undefined'
```

Usa `delete` per eliminare una proprietà da `process.env`.

```js
process.env.TEST = 1;
delete process.env.TEST;
console.log(process.env.TEST);
// => undefined
```

Sui sistemi operativi Windows, le variabili di ambiente non fanno distinzione tra maiuscole e minuscole.

```js
process.env.TEST = 1;
console.log(process.env.test);
// => 1
```

Unless explicitly specified when creating a [`Worker`][] instance, each [`Worker`][] thread has its own copy of `process.env`, based on its parent thread’s `process.env`, or whatever was specified as the `env` option to the [`Worker`][] constructor. Changes to `process.env` will not be visible across [`Worker`][] threads, and only the main thread can make changes that are visible to the operating system or to native add-ons.

## `process.execArgv`<!-- YAML
added: v0.7.7
-->* {string[]}

La proprietà `process.execArgv` restituisce l'insieme delle opzioni della riga di comando specifiche di Node.js passate all'avvio del processo Node.js. Queste opzioni non compaiono nell'array restituito dalla proprietà [`process.argv`][] e non includono l'eseguibile Node.js, il nome dello script o le opzioni che seguono il nome dello script. Queste opzioni sono utili per generare i child process con lo stesso ambiente di esecuzione del parent.

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

## `process.execPath`<!-- YAML
added: v0.1.100
-->* {string}

La proprietà `process.execPath` restituisce l'absolute pathname dell'eseguibile che ha avviato il processo Node.js.
```js
'/usr/local/bin/node'
```

## `process.exit([code])`<!-- YAML
added: v0.1.13
-->* `code` {integer} Il codice di uscita. **Default:** `0`.

Il metodo `process.exit()` indica a Node.js di terminare il processo in modo sincrono con uno stato di uscita di `code`. Se viene omesso `code`, exit utilizza il codice "success" `0` o il valore di `process.exitCode` se è stato impostato. Node.js will not terminate until all the [`'exit'`][] event listeners are called.

Per uscire con un codice 'failure':

```js
process.exit(1);
```

La shell che ha eseguito Node.js dovrebbe vedere il codice di uscita come `1`.

Calling `process.exit()` will force the process to exit as quickly as possible even if there are still asynchronous operations pending that have not yet completed fully, including I/O operations to `process.stdout` and `process.stderr`.

Nella maggior parte dei casi, in realtà non è necessario chiamare esplicitamente `process.exit()`. The Node.js process will exit on its own *if there is no additional work pending* in the event loop. La proprietà `process.exitCode` può essere impostata per indicare al processo quale codice di uscita utilizzare quando il processo esce in modo corretto.

For instance, the following example illustrates a *misuse* of the `process.exit()` method that could lead to data printed to stdout being truncated and lost:

```js
// Questo è un esempio di quello da *non* fare:
se (someConditionNotMet()) {
  printUsageToStdout();
  process.exit(1);
}
```

The reason this is problematic is because writes to `process.stdout` in Node.js are sometimes *asynchronous* and may occur over multiple ticks of the Node.js event loop. Calling `process.exit()`, however, forces the process to exit *before* those additional writes to `stdout` can be performed.

Rather than calling `process.exit()` directly, the code *should* set the `process.exitCode` and allow the process to exit naturally by avoiding scheduling any additional work for the event loop:

```js
// Come impostare correttamente il codice di uscita mentre si lascia che
// il processo esca in modo corretto.
se (someConditionNotMet()) {
  printUsageToStdout();
  process.exitCode = 1;
}
```

If it is necessary to terminate the Node.js process due to an error condition, throwing an *uncaught* error and allowing the process to terminate accordingly is safer than calling `process.exit()`.

In [`Worker`][] threads, this function stops the current thread rather than the current process.

## `process.exitCode`<!-- YAML
added: v0.11.8
-->* {integer}

Un numero che sarà il codice di uscita del processo, quando il processo o esce in modo corretto, o viene chiuso tramite [`process.exit()`][] senza specificare un codice.

Specificando un codice a [`process.exit(code)`][`process.exit()`] sovrascriverà qualsiasi impostazione precedente del `process.exitCode`.

## `process.getegid()`<!-- YAML
added: v2.0.0
-->Il metodo `process.getegid()` restituisce l'identità numerica effettiva del gruppo del processo Node.js. (See getegid(2).)

```js
se (process.getegid) {
  console.log(`Current gid: ${process.getegid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.geteuid()`<!-- YAML
added: v2.0.0
-->* Restituisce: {Object}

Il metodo `process.geteuid()` restituisce l'identità utente numerica effettiva del processo. (See geteuid(2).)

```js
se (process.geteuid) {
  console.log(`Current uid: ${process.geteuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getgid()`<!-- YAML
added: v0.1.31
-->* Restituisce: {Object}

Il metodo `process.getgid()` restituisce l'identità del gruppo numerico del processo. (See getgid(2).)

```js
se (process.getgid) {
  console.log(`Current gid: ${process.getgid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getgroups()`<!-- YAML
added: v0.9.4
-->* Returns: {integer[]}

Il metodo `process.getgroups()` restituisce un array con gli ID di gruppo supplementari. POSIX lascia non specificato se sia incluso l'ID di gruppo effettivo ma Node.js garantisce che esso lo sia sempre.

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.getuid()`<!-- YAML
added: v0.1.28
-->* Restituisce: {integer}

Il metodo `process.getuid()` restituisce l'identità numerica dell'utente del processo. (See getuid(2).)

```js
se (process.getuid) {
  console.log(`Current uid: ${process.getuid()}`);
}
```

This function is only available on POSIX platforms (i.e. not Windows or Android).

## `process.hasUncaughtExceptionCaptureCallback()`<!-- YAML
added: v9.3.0
-->* Restituisce: {boolean}

Indicates whether a callback has been set using [`process.setUncaughtExceptionCaptureCallback()`][].

## `process.hrtime([time])`<!-- YAML
added: v0.7.6
-->* `time` {integer[]} The result of a previous call to `process.hrtime()`
* Returns: {integer[]}

This is the legacy version of [`process.hrtime.bigint()`][] before `bigint` was introduced in JavaScript.

The `process.hrtime()` method returns the current high-resolution real time in a `[seconds, nanoseconds]` tuple `Array`, where `nanoseconds` is the remaining part of the real time that can't be represented in second precision.

`time` is an optional parameter that must be the result of a previous `process.hrtime()` call to diff with the current time. If the parameter passed in is not a tuple `Array`, a `TypeError` will be thrown. Passing in a user-defined array instead of the result of a previous call to `process.hrtime()` will lead to undefined behavior.

Questi tempi sono relativi a un tempo arbitrario nel passato e non correlato all'ora del giorno e quindi non soggetto a deriva dell'orologio. L'uso principale è per misurare le prestazioni tra intervalli:

```js
const NS_PER_SEC = 1e9;
const time = process.hrtime();
// [ 1800216, 25 ]

setTimeout(() => {
  const diff = process.hrtime(time);
  // [ 1, 552 ]

  console.log(`Benchmark took ${diff[0] * NS_PER_SEC + diff[1]} nanoseconds`);
  // Benchmark took 1000000552 nanoseconds
}, 1000);
```

## `process.hrtime.bigint()`<!-- YAML
added: v10.7.0
-->* Returns: {bigint}

The `bigint` version of the [`process.hrtime()`][] method returning the current high-resolution real time in nanoseconds as a `bigint`.

Unlike [`process.hrtime()`][], it does not support an additional `time` argument since the difference can just be computed directly by subtraction of the two `bigint`s.

```js
const start = process.hrtime.bigint();
// 191051479007711n

setTimeout(() => {
  const end = process.hrtime.bigint();
  // 191052633396993n

  console.log(`Benchmark took ${end - start} nanoseconds`);
  // Benchmark took 1154389282 nanoseconds
}, 1000);
```

## `process.initgroups(user, extraGroup)`
<!-- YAML
added: v0.9.4
-->

* `user`{string|number} Il nome utente o l'identificatore numerico.
* `extraGroup` {string|number} A group name or numeric identifier.

Il metodo `process.initgroups()` legge il file `/etc/group` e inizializza l'elenco di accesso al gruppo, utilizzando tutti i gruppi di cui l'utente è membro. Questa è un'operazione privilegiata che richiede che il processo Node.js abbia l'accesso `root` o la capacità `CAP_SETGID`.

Use care when dropping privileges:

```js
console.log(process.getgroups());         // [ 0 ]
process.initgroups('bnoordhuis', 1000);   // switch user
console.log(process.getgroups());         // [ 27, 30, 46, 1000, 0 ]
process.setgid(1000);                     // drop root gid
console.log(process.getgroups());         // [ 27, 30, 46, 1000 ]
```

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.kill(pid[, signal])`<!-- YAML
added: v0.0.6
-->* `pid` {number} Un ID di processo
* `signal` {string|number} Il segnale da inviare, come una stringa o come un numero. **Default:** `'SIGTERM'`.

Il metodo `process.kill()` invia il `signal` al processo identificato da `pid`.

I nomi dei segnali sono stringhe come `'SIGINT'` o `'SIGHUP'`. Vedi [Signal Events](#process_signal_events) e kill(2) per ulteriori informazioni.

Questo metodo lancerà un errore se il target `pid` non esiste. Come un caso speciale, un segnale di `0` può essere usato per verificare l'esistenza di un processo. Le piattaforme Windows lanceranno un errore se il `pid` viene utilizzato per eseguire il killing di un gruppo di processo.

Even though the name of this function is `process.kill()`, it is really just a signal sender, like the `kill` system call. The signal sent may do something other than kill the target process.

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

When `SIGUSR1` is received by a Node.js process, Node.js will start the debugger. See [Signal Events](#process_signal_events).

## `process.mainModule`<!-- YAML
added: v0.1.17
-->* {Object}

La proprietà `process.mainModule` fornisce un modo alternativo per recuperare [`require.main`][]. La differenza è che se il modulo principale cambia al momento dell'esecuzione, [`require.main`][] potrebbe ancora fare riferimento al modulo principale originale nei moduli che erano necessari prima che si verificasse la modifica. In generale, è sicuro supporre che i due si riferiscano allo stesso modulo.

Come con [`require.main`][], `process.mainModule` sarà `undefined` se non c'è nessun entry script.

## `process.memoryUsage()`<!-- YAML
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

The _heap_ is where objects, strings, and closures are stored. Variables are stored in the _stack_ and the actual JavaScript code resides in the _code segment_.

When using [`Worker`][] threads, `rss` will be a value that is valid for the entire process, while the other fields will only refer to the current thread.

## `process.nextTick(callback[, ...args])`<!-- YAML
added: v0.1.26
changes:
  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1077
    description: Additional arguments after `callback` are now supported.
-->* `callback` {Function}
* `...args` {any} Argomenti aggiuntivi da trasmettere quando si invoca la `callback`

`process.nextTick()` adds `callback` to the "next tick queue". This queue is fully drained after the current operation on the JavaScript stack runs to completion and before the event loop is allowed to continue. It's possible to create an infinite loop if one were to recursively call `process.nextTick()`. See the [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#process-nexttick) guide for more background.

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

This is important when developing APIs in order to give users the opportunity to assign event handlers *after* an object has been constructed but before any I/O has occurred:

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

## `process.noDeprecation`<!-- YAML
added: v0.8.0
-->* {boolean}

La proprietà `process.noDeprecation` indica se il `--no-deprecation` flag è impostato sul processo Node.js corrente. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.

## `process.pid`<!-- YAML
added: v0.1.15
-->* {integer}

La proprietà `process.pid` restituisce il PID del processo.

```js
console.log(`Questo processo è pid ${process.pid}`);
```

## `process.platform`<!-- YAML
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

The value `'android'` may also be returned if the Node.js is built on the Android operating system. However, Android support in Node.js [is experimental](https://github.com/nodejs/node/blob/master/BUILDING.md#androidandroid-based-devices-eg-firefox-os).

## `process.ppid`<!-- YAML
added:
  - v9.2.0
  - v8.10.0
  - v6.13.0
-->* {integer}

La proprietà `process.ppid` restituisce il PID del parent process corrente.

```js
console.log(`Il parent process è pid ${process.ppid}`);
```

## `process.release`<!-- YAML
added: v3.0.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3212
    description: The `lts` property is now supported.
-->* {Object}

The `process.release` property returns an `Object` containing metadata related to the current release, including URLs for the source tarball and headers-only tarball.

`process.release` contiene le seguenti proprietà:

* `name` {string} Un valore che sarà sempre `'node'` per Node.js. Per le versioni legacy di io.js, questo sarà `'io.js'`.
* `sourceUrl` {string} an absolute URL pointing to a _`.tar.gz`_ file containing the source code of the current release.
* `headersUrl`{string} an absolute URL pointing to a _`.tar.gz`_ file containing only the source header files for the current release. Questo file è significativamente più piccolo del file sorgente completo e può essere utilizzato per compilare i componenti aggiuntivi nativi di Node.js.
* `libUrl` {string} an absolute URL pointing to a _`node.lib`_ file matching the architecture and version of the current release. Questo file viene utilizzato per compilare i componenti aggiuntivi nativi di Node.js. _This property is only present on Windows builds of Node.js and will be missing on all other platforms._
* `lts` {string} a string label identifying the [LTS](https://github.com/nodejs/Release) label for this release. This property only exists for LTS releases and is `undefined` for all other release types, including _Current_ releases. Attualmente i valori validi sono:
  * `'Argon'` per la riga 4.x LTS che inizia con 4.2.0.
  * `'Boron'` per la riga 6.x LTS che inizia con 6.9.0.
  * `'Carbon'` per la riga 8.x LTS che inizia con 8.9.1.
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

## `process.report`<!-- YAML
added: v11.8.0
-->> Stabilità: 1 - Sperimentale

* {Object}

`process.report` is an object whose methods are used to generate diagnostic reports for the current process. Additional documentation is available in the [report documentation](report.html).

### `process.report.directory`<!-- YAML
added: v11.12.0
-->> Stabilità: 1 - Sperimentale

* {string}

Directory where the report is written. The default value is the empty string, indicating that reports are written to the current working directory of the Node.js process.

```js
console.log(`Report directory is ${process.report.directory}`);
```

### `process.report.filename`<!-- YAML
added: v11.12.0
-->> Stabilità: 1 - Sperimentale

* {string}

Filename where the report is written. If set to the empty string, the output filename will be comprised of a timestamp, PID, and sequence number. The default value is the empty string.

```js
console.log(`Report filename is ${process.report.filename}`);
```

### `process.report.getReport([err])`<!-- YAML
added: v11.8.0
-->> Stabilità: 1 - Sperimentale

* `err` {Error} A custom error used for reporting the JavaScript stack.
* Restituisce: {Object}

Returns a JavaScript Object representation of a diagnostic report for the running process. The report's JavaScript stack trace is taken from `err`, if present.

```js
const data = process.report.getReport();
console.log(data.header.nodeJsVersion);

// Similar to process.report.writeReport()
const fs = require('fs');
fs.writeFileSync(util.inspect(data), 'my-report.log', 'utf8');
```

Additional documentation is available in the [report documentation](report.html).

### `process.report.reportOnFatalError`<!-- YAML
added: v11.12.0
-->> Stabilità: 1 - Sperimentale

* {boolean}

If `true`, a diagnostic report is generated on fatal errors, such as out of memory errors or failed C++ assertions.

```js
console.log(`Report on fatal error: ${process.report.reportOnFatalError}`);
```

### `process.report.reportOnSignal`<!-- YAML
added: v11.12.0
-->> Stabilità: 1 - Sperimentale

* {boolean}

If `true`, a diagnostic report is generated when the process receives the signal specified by `process.report.signal`.

```js
console.log(`Report on signal: ${process.report.reportOnSignal}`);
```

### `process.report.reportOnUncaughtException`<!-- YAML
added: v11.12.0
-->> Stabilità: 1 - Sperimentale

* {boolean}

If `true`, a diagnostic report is generated on uncaught exception.

```js
console.log(`Report on exception: ${process.report.reportOnUncaughtException}`);
```

### `process.report.signal`<!-- YAML
added: v11.12.0
-->> Stabilità: 1 - Sperimentale

* {string}

The signal used to trigger the creation of a diagnostic report. Defaults to `'SIGUSR2'`.

```js
console.log(`Report signal: ${process.report.signal}`);
```

### `process.report.writeReport([filename][, err])`<!-- YAML
added: v11.8.0
-->> Stabilità: 1 - Sperimentale

* `filename` {string} Name of the file where the report is written. This should be a relative path, that will be appended to the directory specified in `process.report.directory`, or the current working directory of the Node.js process, if unspecified.
* `err` {Error} A custom error used for reporting the JavaScript stack.

* Returns: {string} Returns the filename of the generated report.

Writes a diagnostic report to a file. If `filename` is not provided, the default filename includes the date, time, PID, and a sequence number. The report's JavaScript stack trace is taken from `err`, if present.

```js
process.report.writeReport();
```

Additional documentation is available in the [report documentation](report.html).

## `process.resourceUsage()`<!-- YAML
added: v12.6.0
-->* Returns: {Object} the resource usage for the current process. All of these values come from the `uv_getrusage` call which returns a [`uv_rusage_t` struct](http://docs.libuv.org/en/v1.x/misc.html#c.uv_rusage_t).
  * `userCPUTime` {integer} maps to `ru_utime` computed in microseconds. It is the same value as [`process.cpuUsage().user`](#process_process_cpuusage_previousvalue).
  * `systemCPUTime` {integer} maps to `ru_stime` computed in microseconds. It is the same value as [`process.cpuUsage().system`](#process_process_cpuusage_previousvalue).
  * `maxRSS` {integer} maps to `ru_maxrss` which is the maximum resident set size used in kilobytes.
  * `sharedMemorySize` {integer} maps to `ru_ixrss` but is not supported by any platform.
  * `unsharedDataSize` {integer} maps to `ru_idrss` but is not supported by any platform.
  * `unsharedStackSize` {integer} maps to `ru_isrss` but is not supported by any platform.
  * `minorPageFault` {integer} maps to `ru_minflt` which is the number of minor page faults for the process, see [this article for more details](https://en.wikipedia.org/wiki/Page_fault#Minor).
  * `majorPageFault` {integer} maps to `ru_majflt` which is the number of major page faults for the process, see [this article for more details](https://en.wikipedia.org/wiki/Page_fault#Major). This field is not supported on Windows.
  * `swappedOut` {integer} maps to `ru_nswap` but is not supported by any platform.
  * `fsRead` {integer} maps to `ru_inblock` which is the number of times the file system had to perform input.
  * `fsWrite` {integer} maps to `ru_oublock` which is the number of times the file system had to perform output.
  * `ipcSent` {integer} maps to `ru_msgsnd` but is not supported by any platform.
  * `ipcReceived` {integer} maps to `ru_msgrcv` but is not supported by any platform.
  * `signalsCount` {integer} maps to `ru_nsignals` but is not supported by any platform.
  * `voluntaryContextSwitches` {integer} maps to `ru_nvcsw` which is the number of times a CPU context switch resulted due to a process voluntarily giving up the processor before its time slice was completed (usually to await availability of a resource). This field is not supported on Windows.
  * `involuntaryContextSwitches` {integer} maps to `ru_nivcsw` which is the number of times a CPU context switch resulted due to a higher priority process becoming runnable or because the current process exceeded its time slice. This field is not supported on Windows.

```js
console.log(process.resourceUsage());
/*
  Will output:
  {
    userCPUTime: 82872,
    systemCPUTime: 4143,
    maxRSS: 33164,
    sharedMemorySize: 0,
    unsharedDataSize: 0,
    unsharedStackSize: 0,
    minorPageFault: 2469,
    majorPageFault: 0,
    swappedOut: 0,
    fsRead: 0,
    fsWrite: 8,
    ipcSent: 0,
    ipcReceived: 0,
    signalsCount: 0,
    voluntaryContextSwitches: 79,
    involuntaryContextSwitches: 1
  }
*/
```

## `process.send(message[, sendHandle[, options]][, callback])`<!-- YAML
added: v0.5.9
-->* `message` {Object}
* `sendHandle` {net.Server|net.Socket}
* `options` {Object} used to parameterize the sending of certain types of handles.`options` supports the following properties:
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. Quando è `true`, il socket viene mantenuto aperto nel processo di invio. **Default:** `false`.
* `callback` {Function}
* Restituisce: {boolean}

Se Node.js viene generato con un canale IPC, il metodo `process.send()` può essere utilizzato per inviare messaggi al parent process. I messaggi saranno ricevuti come un evento [`'messagge'`][] sul [`ChildProcess`][] object del parent.

If Node.js was not spawned with an IPC channel, `process.send` will be `undefined`.

Il messaggio passa attraverso la serializzazione e il parsing. The resulting message might not be the same as what is originally sent.

## `process.setegid(id)`<!-- YAML
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

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.seteuid(id)`<!-- YAML
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

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setgid(id)`<!-- YAML
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

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setgroups(groups)`<!-- YAML
added: v0.9.4
-->* `groups` {integer[]}

Il metodo `process.setgroups()` imposta gli ID di gruppo supplementari per il processo Node.js. This is a privileged operation that requires the Node.js process to have `root` or the `CAP_SETGID` capability.

I `groups` array possono contenere ID di gruppi numerici, nomi di gruppi o entrambi.

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setuid(id)`<!-- YAML
added: v0.1.28
-->* `id` {integer | string}

Il metodo `process.setuid(id)` imposta l'identità dell'utente del processo. (Vedi setuid (2).) L'`id` può essere passato come un ID numerico o una stringa del nome utente. Se viene specificato un nome utente, il metodo si blocca durante la risoluzione dell'ID numerico associato.

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

This function is only available on POSIX platforms (i.e. not Windows or Android). This feature is not available in [`Worker`][] threads.

## `process.setUncaughtExceptionCaptureCallback(fn)`<!-- YAML
added: v9.3.0
-->* `fn` {Function|null}

The `process.setUncaughtExceptionCaptureCallback()` function sets a function that will be invoked when an uncaught exception occurs, which will receive the exception value itself as its first argument.

If such a function is set, the [`'uncaughtException'`][] event will not be emitted. If `--abort-on-uncaught-exception` was passed from the command line or set through [`v8.setFlagsFromString()`][], the process will not abort.

To unset the capture function, `process.setUncaughtExceptionCaptureCallback(null)` may be used. Calling this method with a non-`null` argument while another capture function is set will throw an error.

Using this function is mutually exclusive with using the deprecated [`domain`][] built-in module.

## `process.stderr`

* {Stream}

La proprietà `process.stderr` restituisce uno stream connesso a `stderr` (fd `2`). È un [`net.Socket`][] (che è un [Duplex](stream.html#stream_duplex_and_transform_streams) stream) a meno che fd `2` si riferisca a un file, nel qual caso è un [Writable](stream.html#stream_writable_streams) stream.

`process.stderr` differs from other Node.js streams in important ways. See [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.

## `process.stdin`

* {Stream}

La proprietà `process.stdin` restituisce uno stream connesso a `stdin` (fd `0`). È un [`net.Socket`][] (che è un [Duplex](stream.html#stream_duplex_and_transform_streams) stream) a meno che fd `0` si riferisca a un file, nel qual caso è un
Readable/2> stream.</p> 



```js
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  let chunk;
  // Use a loop to make sure we read all available data.
  while ((chunk = process.stdin.read()) !== null) {
    process.stdout.write(`data: ${chunk}`);
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end');
});
```


Come [Duplex](stream.html#stream_duplex_and_transform_streams) stream, `process.stdin` può anche essere utilizzato in modalità "old" compatibile con script scritti per Node.js precedenti alla v0.10. Per ulteriori informazioni consulta [Stream compatibility](stream.html#stream_compatibility_with_older_node_js_versions).

In "old" streams mode the `stdin` stream is paused by default, so one must call `process.stdin.resume()` to read from it. Nota anche che la chiamata a `process.stdin.resume()` stessa cambierebbe lo stream in modalità "old".



## `process.stdout`

* {Stream}

La proprietà `process.stdout` restituisce uno stream connesso a `stdout` (fd `1`). È un [`net.Socket`][] (che è un [Duplex](stream.html#stream_duplex_and_transform_streams) stream) a meno che fd `1` si riferisca a un file, nel qual caso è un [Writable](stream.html#stream_writable_streams) stream.

For example, to copy `process.stdin` to `process.stdout`:



```js
process.stdin.pipe(process.stdout);
```


`process.stdout` differs from other Node.js streams in important ways. See [note on process I/O](process.html#process_a_note_on_process_i_o) for more information.



### Una nota sull'I/O di processo

`process.stdout` e `process.stderr` si differenziano dagli altri Node.js stream in maniere consistenti:

1. They are used internally by [`console.log()`][] and [`console.error()`][], respectively.

2. Writes may be synchronous depending on what the stream is connected to and whether the system is Windows or POSIX:

   * Files: *synchronous* on Windows and POSIX
   * TTYs (Terminals): *asynchronous* on Windows, *synchronous* on POSIX
   * Pipes (and sockets): *synchronous* on Windows, *asynchronous* on POSIX

Questi comportamenti sono in parte dovuti a ragioni storiche, poiché modificarli creerebbe un'incompatibilità a ritroso, ma sono anche previsti da alcuni utenti.

Le scritture sincrone evitano problemi come l'output scritto con `console.log()` o `console.error()` inaspettatamente interlacciato, o non scritto affatto se `process.exit()` viene chiamato prima del completamento di una scrittura asincrona. Vedi [`process.exit()`][] per maggiori informazioni.

***Warning***: Synchronous writes block the event loop until the write has completed. Questo può essere quasi istantaneo nel caso di output ad un file, ma con un carico di sistema elevato, pipe che non vengono lette dal ricevente o aventi terminali o file system lenti, è possibile che il ciclo degli eventi sia bloccato abbastanza spesso e abbastanza a lungo da avere gravi impatti negativi sulle prestazioni. Questo potrebbe non essere un problema durante la scrittura su una sessione terminale interattiva, ma considera questo con particolare attentenzione quando si esegue la registrazione di produzione sugli output stream del processo.

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



## `process.throwDeprecation`<!-- YAML
added: v0.9.12
-->* {boolean}

The initial value of `process.throwDeprecation` indicates whether the `--throw-deprecation` flag is set on the current Node.js process. `process.throwDeprecation` is mutable, so whether or not deprecation warnings result in errors may be altered at runtime. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information.



```console
$ node --throw-deprecation -p "process.throwDeprecation"
true
$ node -p "process.throwDeprecation"
undefined
$ node
> process.emitWarning('test', 'DeprecationWarning');
undefined
> (node:26598) DeprecationWarning: test
> process.throwDeprecation = true;
true
> process.emitWarning('test', 'DeprecationWarning');
Thrown:
[DeprecationWarning: test] { name: 'DeprecationWarning' }
```




## `process.title`<!-- YAML
added: v0.1.104
-->* {string}

La proprietà `process.title` restituisce il titolo del processo corrente (cioè restituisce il valore corrente di `ps`). Assegnare un nuovo valore a `process.title` modifica il valore corrente di `ps`.

When a new value is assigned, different platforms will impose different maximum length restrictions on the title. Solitamente tali restrizioni sono piuttosto limitate. For instance, on Linux and macOS, `process.title` is limited to the size of the binary name plus the length of the command line arguments because setting the `process.title` overwrites the `argv` memory of the process. Node.js v0.8 allowed for longer process title strings by also overwriting the `environ` memory but that was potentially insecure and confusing in some (rather obscure) cases.



## `process.traceDeprecation`<!-- YAML
added: v0.8.0
-->* {boolean}

La proprietà `process.traceDeprecation` indica se il `--trace-deprecation` flag è impostato sul processo Node.js corrente. See the documentation for the [`'warning'` event](#process_event_warning) and the [`emitWarning()` method](#process_process_emitwarning_warning_type_code_ctor) for more information about this flag's behavior.



## `process.umask([mask])`<!-- YAML
added: v0.1.19
-->* `mask` {string|integer}

Il metodo `process.umask()` imposta o restituisce la mask di creazione della modalità file del processo Node.js. I child process ereditano la mask dal parent process. Invocato senza argomento, viene restituita la mask corrente, altrimenti la umask viene impostata sul valore dell'argomento e viene restituita la mask precedente.



```js
const newmask = 0o022;
const oldmask = process.umask(newmask);
console.log(
  `Changed umask from ${oldmask.toString(8)} to ${newmask.toString(8)}`
);
```


[`Worker`][] threads are able to read the umask, however attempting to set the umask will result in a thrown exception.



## `process.uptime()`<!-- YAML
added: v0.5.0
-->* Restituisce: {number}

Il metodo `process.uptime()` restituisce il numero di secondi in cui è in esecuzione il processo Node.js corrente.

The return value includes fractions of a second. Use `Math.floor()` to get whole seconds.



## `process.version`<!-- YAML
added: v0.1.3
-->* {string}

La proprietà `process.version` restituisce la stringa di versione Node.js.



```js
console.log(`Version: ${process.version}`);
```




## `process.versions`<!-- YAML
added: v0.2.0
changes:
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3102
    description: The `icu` property is now supported.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15785
    description: The `v8` property now includes a Node.js specific suffix.
-->* {Object}

La proprietà `process.versions` restituisce un object che elenca le stringhe di versione di Node.js e le sue dipendenze. `process.versions.modules` indica la corrente versione ABI, che viene aumentata ogni volta che viene modificata una C++ API. Node.js rifiuterà di caricare i moduli che sono stati compilati con una differente versione ABI del modulo.



```js
console.log(process.versions);
```


Genererà un object simile a:



```console
{ node: '11.13.0',
  v8: '7.0.276.38-node.18',
  uv: '1.27.0',
  zlib: '1.2.11',
  brotli: '1.0.7',
  ares: '1.15.0',
  modules: '67',
  nghttp2: '1.34.0',
  napi: '4',
  llhttp: '1.1.1',
  http_parser: '2.8.0',
  openssl: '1.1.1b',
  cldr: '34.0',
  icu: '63.1',
  tz: '2018e',
  unicode: '11.0' }
```




## Exit Codes

Node.js uscirà normalmente con un codice di stato `0` quando non ci saranno più operazioni asincrone in sospeso. I seguenti codici di stato sono utilizzati in altri casi:

* `1` **Uncaught Fatal Exception**: There was an uncaught exception, and it was not handled by a domain or an [`'uncaughtException'`][] event handler.

* `2`: Unused (reserved by Bash for builtin misuse)

* `3` **Internal JavaScript Parse Error**: The JavaScript source code internal in Node.js's bootstrapping process caused a parse error. Questo è estremamente raro e generalmente può accadere solo durante lo sviluppo di Node.js stesso.

* `4` **Internal JavaScript Evaluation Failure**: The JavaScript source code internal in Node.js's bootstrapping process failed to return a function value when evaluated. Questo è estremamente raro e generalmente può accadere solo durante lo sviluppo di Node.js stesso.

* `5` **Fatal Error**: There was a fatal unrecoverable error in V8. Generalmente un messaggio verrà stampato su stderr con il prefisso `FATAL ERROR`.

* `6` **Non-function Internal Exception Handler**: There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.

* `7` **Internal Exception Handler Run-Time Failure**: There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it. This can happen, for example, if an [`'uncaughtException'`][] or `domain.on('error')` handler throws an error.

* `8`: Unused. Nelle versioni precedenti di Node.js, il codice di uscita 8 indicava a volte un'eccezione non rilevata.

* `9` **Invalid Argument**: Either an unknown option was specified, or an option requiring a value was provided without a value.

* `10` **Internal JavaScript Run-Time Failure**: The JavaScript source code internal in Node.js's bootstrapping process threw an error when the bootstrapping function was called. Questo è estremamente raro e generalmente può accadere solo durante lo sviluppo di Node.js stesso.

* `12` **Invalid Debug Argument**: The `--inspect` and/or `--inspect-brk` options were set, but the port number chosen was invalid or unavailable.

* `>128` **Signal Exits**: If Node.js receives a fatal signal such as `SIGKILL` or `SIGHUP`, then its exit code will be `128` plus the value of the signal code. Questa è una pratica POSIX standard, poiché i codici di uscita sono definiti come interi a 7 bit e le uscite di segnale impostano il bit di ordine superiore e quindi contengono il valore del codice di segnale. For example, signal `SIGABRT` has value `6`, so the expected exit code will be `128` + `6`, or `134`.
