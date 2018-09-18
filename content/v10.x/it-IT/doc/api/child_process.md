# Child Process

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> Stabilità: 2 - Stabile

Il modulo `child_process` offre la possibilità di generare processi child in modo simile, ma non identico, a quello di popen(3). Questa capacità è fornita principalmente dalla funzione [`child_process.spawn()`][]:

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

Di default, i pipe per `stdin`, `stdout`, ed `stderr` vengono stabiliti tra il processo parent di Node.js e il child generato. Questi pipe hanno capacità limitata (e specifica per ogni piattaforma). Se il processo child scrive su stdout eccedendo quel limite senza che l'output venga catturato, il processo child si interromperà in attesa che il buffer del pipe accetti più dati. Questo è identico al comportamento dei pipe nella shell. Utilizza l'opzione `{ stdio: 'ignore' }` se l'output non verrà utilizzato.

Il metodo [`child_process.spawn()`][] genera il processo child in modo asincrono, senza bloccare il ciclo degli eventi Node.js. La funzione [`child_process.spawnSync()`][] fornisce funzionalità equivalenti in un modo sincrono che interrompe il ciclo di eventi finché il processo generato non si conclude o viene chiuso.

Per comodità, il modulo `child_process` fornisce una manciata di alternative sincrone e asincrone a [`child_process.spawn()`][] e [`child_process.spawnSync()`][]. *Da notare che ognuna di queste alternative è implementata in cima a [`child_process.spawn()`][] o [`child_process.spawnSync()`][].*

    * [`child_process.exec()`][]: genera una shell ed esegue un comando al suo interno, 
      passando lo `stdout` e lo `stderr` a una funzione di callback quando è completa.
    * [`child_process.execFile()`][]: simile a [`child_process.exec()`][] eccetto che 
      genera il comando direttamente senza prima generare una shell di default.
    * [`child_process.fork()`][]: genera un nuovo processo Node.js e invoca un 
      modulo specificato con un canale di comunicazione IPC che consente
      di inviare messaggi tra parent e child.
    * [`child_process.execSync()`][]: una versione sincrona di
      [`child_process.exec()`][] che *interromperà* il ciclo di eventi di Node.js.
    * [`child_process.execFileSync()`][]: una versione sincrona di
      [`child_process.execFile()`][] che *interromperà* il ciclo di eventi di Node.js.
    

Per alcuni casi d'utilizzo, come l'automazione degli script della shell, le [controparti sincrone](#child_process_synchronous_process_creation) possono essere più convenienti. Tuttavia, in molti casi, i metodi sincroni possono avere un impatto significativo sulle prestazioni a causa dell'interruzione del ciclo degli eventi durante il completamento dei processi generati.

## Creazione di Processi Asincroni

I metodi [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], e [`child_process.execFile()`][] seguono tutti il modello di programmazione asincrona idiomatica tipico di altre API di Node.js.

Ciascun metodo restituisce un'istanza [`ChildProcess`][]. Questi objects implementano l'API Node.js [`EventEmitter`][], consentendo al processo parent di registrare le funzioni listener chiamate quando si verificano determinati eventi durante il ciclo del processo child.

I metodi [`child_process.exec()`][] e [`child_process.execFile()`][] consentono inoltre di specificare una funzione `callback` opzionale invocata al termine del processo child.

### Generare i file `.bat` e `.cmd` su Windows

L'importanza della distinzione tra [`child_process.exec()`][] e [`child_process.execFile()`][] può variare in base alla piattaforma. Sui sistemi operativi di tipo Unix (Unix, Linux, macOS) [`child_process.execFile()`][] può essere più efficiente perché non genera una shell di default. Su Windows, tuttavia, i file `.bat` e `.cmd` non sono eseguibili da soli senza un terminale e, pertanto, non possono essere avviati utilizzando [`child_process.execFile()`][]. Quando si eseguono su Windows, i file `.bat` e `.cmd` possono essere invocati usando [`child_process.spawn()`][] con il set di opzioni `shell`, con [`child_process.exec()`][], oppure generando `cmd.exe` e passando i file `.bat` o `.cmd` come argomento (che è ciò che fanno le opzioni `shell` e [`child_process.exec()`][]). In ogni caso, se il filename dello script contiene spazi, deve essere racchiuso tra le virgolette.

```js
// Solo su Windows ...
const { spawn } = require('child_process');
const bat = spawn('cmd.exe', ['/c', 'my.bat']);

bat.stdout.on('data', (data) => {
  console.log(data.toString());
});

bat.stderr.on('data', (data) => {
  console.log(data.toString());
});

bat.on('exit', (code) => {
  console.log(`Child exited with code ${code}`);
});
```

```js
// OPPURE...
const { exec } = require('child_process');
exec('my.bat', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

// Script con spazi nel filename:
const bat = spawn('"my script.cmd"', ['a', 'b'], { shell: true });
// oppure:
exec('"my script.cmd" a b', (err, stdout, stderr) => {
  // ...
});
```

### child_process.exec(command\[, options\]\[, callback\])

<!-- YAML
added: v0.1.90
changes:

  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
-->

* `command` {string} Il comando da eseguire, con argomenti separati dallo spazio.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child. **Default:** `null`.
  * `env` {Object} Coppie key-value dell'ambiente. **Default:** `null`.
  * `encoding` {string} **Default:** `'utf8'`
  * `shell` {string} La Shell con la quale eseguire il comando. Vedi [Requisiti della Shell](#child_process_shell_requirements) e [Shell Default di Windows](#child_process_default_windows_shell). **Default:** `'/bin/sh'` su UNIX, `process.env.ComSpec` su Windows.
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} La quantità maggiore di dati in byte consentiti su stdout o stderr. Se superata, il processo child viene concluso. Vedi avvertenze su [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `windowsHide` {boolean} Nasconde la finestra della console di sottoprocesso che verrebbe normalmente creata sui sistemi Windows. **Default:** `false`.
* `callback` {Function} chiamata con l'output al termine del processo. 
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Restituisce: {ChildProcess}

Genera una shell e successivamente esegue il `command` all'interno della shell stessa, eseguendo il buffer di qualsiasi output generato. La stringa `command` passata alla funzione exec viene elaborata direttamente dalla shell e i caratteri speciali (che variano in base alla [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) devono essere trattati di conseguenza:

```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// Le virgolette vengono utilizzate in modo che lo spazio nel percorso (path) non venga interpretato come
// più argomenti

exec('echo "The \\$HOME variable is $HOME"');
// La variabile $HOME è sottoposta all'escape nella prima istanza, ma non nella seconda
```

**Non passare mai l'input unsanitized user a questa funzione. Qualsiasi input contenente metacaratteri della shell può essere utilizzato per attivare l'esecuzione arbitraria dei comandi.**

```js
const { exec } = require('child_process');
exec('cat *.js bad_file | wc -l', (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
```

Se viene fornita una funzione `callback`, viene chiamata con gli argomenti `(error, stdout, stderr)`. In caso di successo, `error` sarà `null`. In caso di errore, `error` sarà un'istanza di [`Error`][]. La proprietà `error.code` sarà il valore di uscita del processo child mentre `error.signal` sarà impostato sul segnale che ha interrotto il processo. Qualsiasi valore di uscita diverso da `0` è considerato un errore.

Gli argomenti `stdout` e `stderr` passati al callback conterranno gli output stdout e stderr del processo child. Di default, Node.js decodificherà l'output come UTF-8 e passerà le stringhe al callback. L'opzione `encoding` può essere usata per specificare l'encoding (codifica) dei caratteri utilizzato per decodificare gli output stdout e stderr. Se `encoding` è `'buffer'`, oppure un econding dei caratteri non riconosciuto, allora i `Buffer` object saranno passati al callback.

Se `timeout` è maggiore di `0`, il parent invierà il segnale identificato dalla proprietà `killSignal` (il valore predefinito è `'SIGTERM'`) se il child esegue più di `timeout` millisecondi.

A differenza della chiamata di sistema POSIX exec(3), `child_process.exec()` non sostituisce il processo esistente e utilizza una shell per eseguire il comando.

Se questo metodo viene invocato come sua versione [`util.promisify()`][], restituisce un `Promise` per un `Object` con le proprietà `stdout` e `stderr`. In caso di errore (incluso qualsiasi errore che dia come risultato un valore di uscita diverso da 0), viene restituito un promise respinto, con lo stesso `error` object specificato nel callback, ma con altre due proprietà `stdout` e `stderr`.

```js
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function lsExample() {
  const { stdout, stderr } = await exec('ls');
  console.log('stdout:', stdout);
  console.log('stderr:', stderr);
}
lsExample();
```

### child_process.execFile(file\[, args\]\[, options\][, callback])

<!-- YAML
added: v0.1.91
changes:

  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
-->

* `file` {string} Il nome o il percorso del file eseguibile da avviare.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `encoding` {string} **Default:** `'utf8'`
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} La quantità massima di dati in byte consentiti su stdout o stderr. Se superata, il processo child viene concluso. Vedi avvertenze su [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `killSignal` {string|integer} **Default:** `'SIGTERM'`
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `windowsHide` {boolean} Nasconde la finestra della console di sottoprocesso che verrebbe normalmente creata sui sistemi Windows. **Default:** `false`.
  * `windowsVerbatimArguments` {boolean} Non viene eseguita nessuna citazione od escaping degli argomenti su Windows. Ignorato su Unix. **Default:** `false`.
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Utilizza `'/bin/sh'` su UNIX, e `process.env.ComSpec` su Windows. Una shell diversa può essere specificata come una stringa. Vedi [Requisiti della Shell](#child_process_shell_requirements) e [Shell Default di Windows](#child_process_default_windows_shell). **Default:** `false` (nessuna shell).
* `callback` {Function} Chiamata con l'output al termine del processo. 
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Restituisce: {ChildProcess}

La funzione `child_process.execFile()` è simile a [`child_process.exec()`][] eccetto per il fatto che non genera una shell di default. Piuttosto, il `file` eseguibile specificato viene generato direttamente come un nuovo processo rendendolo leggermente più efficiente di [`child_process.exec()`][].

Sono supportate le stesse opzioni di [`child_process.exec()`][]. Dal momento che non viene generata una shell, i comportamenti come il reindirizzamento I/O e il file globbing non sono supportati.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```

Gli argomenti `stdout` e `stderr` passati al callback conterranno gli output stdout e stderr del processo child. Di default, Node.js decodificherà l'output come UTF-8 e passerà le stringhe al callback. L'opzione `encoding` può essere usata per specificare l'encoding (codifica) dei caratteri utilizzato per decodificare gli output stdout e stderr. Se `encoding` è `'buffer'`, oppure un econding dei caratteri non riconosciuto, allora i `Buffer` object saranno passati al callback.

Se questo metodo viene invocato come sua versione [`util.promisify()`][], restituisce un `Promise` per un `Object` con le proprietà `stdout` e `stderr`. In caso di errore (incluso qualsiasi errore che dia come risultato un valore di uscita diverso da 0), viene restituito un promise respinto, con lo stesso `error` object specificato nel callback, ma con altre due proprietà `stdout` e `stderr`.

```js
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
async function getVersion() {
  const { stdout } = await execFile('node', ['--version']);
  console.log(stdout);
}
getVersion();
```

**Se l'opzione `shell` è abilitata, non passare l'input unsanitized user a questa funzione. Qualsiasi input contenente metacaratteri della shell può essere utilizzato per attivare l'esecuzione arbitraria dei comandi.**

### child_process.fork(modulePath\[, args\]\[, options\])

<!-- YAML
added: v0.5.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10866
    description: The `stdio` option can now be a string.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7811
    description: The `stdio` option is supported now.
-->

* `modulePath` {string} Il modulo da eseguire nel child.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `execPath` {string} Eseguibile utilizzato per creare il processo child.
  * `execArgv` {string[]} Elenco degli argomenti di string passati all'eseguibile. **Default:** `process.execArgv`.
  * `silent` {boolean} Se `true`, stdin, stdout e stderr del child verranno reindirizzati al parent tramite il piping, in caso contrario verranno ereditati dal parent, per maggiori dettagli vedi le opzioni `'pipe'` e `'inherit'` per lo [`stdio`][] di [`child_process.spawn()`][]. **Default:** `false`.
  * `stdio` {Array|string} Vedi lo [`stdio`][] di [`child_process.spawn()`][]. Quando viene fornita quest'opzione, esegue l'override di `silent`. Se viene utilizzata la variante dell'array, deve contenere esattamente un elemento con valore `'ipc'` oppure verrà generato un errore. Per esempio `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} Non viene eseguita nessuna citazione od escaping degli argomenti su Windows. Ignorato su Unix. **Default:** `false`.
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
* Restituisce: {ChildProcess}

Il metodo `child_process.fork()` è un caso speciale di [`child_process.spawn()`][] utilizzato specificamente per generare nuovi processi Node.js. Così come con [`child_process.spawn()`][], viene restituito un [`ChildProcess`][] object. Il [`ChildProcess`][] restituito avrà un canale di comunicazione aggiuntivo integrato che consente di passare i messaggi avanti e indietro tra parent e child. Vedi [`subprocess.send()`][] per i dettagli.

È importante tenere presente che i processi child di Node.js generati sono indipendenti dal parent con l'eccezione del canale di comunicazione IPC stabilito tra i due. Ogni processo ha la propria memoria, con le proprie istanze V8. A causa delle allocazioni aggiuntive richieste, non è consigliato generare un numero elevato di processi child di Node.js.

Di default, `child_process.fork()` genererà nuove istanze Node.js utilizzando il [`process.execPath`][] del processo parent. La proprietà `execPath` nell'`options` object consente di utilizzare un percorso di esecuzione alternativo.

I processi Node.js avviati con un `execPath` personalizzato comunicano con il processo parent utilizzando il file descriptor (fd) identificato utilizzando la variabile di ambiente `NODE_CHANNEL_FD` sul processo child.

A differenza della chiamata di sistema POSIX fork(2), `child_process.fork()` non clona il processo corrente.

L'opzione `shell` disponibile in [`child_process.spawn()`][] non è supportata da `child_process.fork()` e verrà ignorata se impostata.

### child_process.spawn(command\[, args\]\[, options\])

<!-- YAML
added: v0.1.90
changes:

  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7696
    description: The `argv0` option is supported now.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4598
    description: The `shell` option is supported now.
-->

* `command` {string} Il comando da eseguire.
* `args` {string[]} Elenco degli argomenti di string.
* `options` {Object} 
  * `cwd` {string} Attuale directory di lavoro del processo child.
  * `env` {Object} Coppie key-value dell'ambiente.
  * `argv0` {string} Imposta esplicitamente il valore di `argv[0]` inviato al processo child. Questo sarà impostato su `command` se non specificato.
  * `stdio` {Array|string} Configurazione stdio del child (vedi [`options.stdio`][`stdio`]).
  * `detached` {boolean} Prepara il child all'avvio indipendentemente dal suo processo parent. Il comportamento specifico dipende dalla piattaforma, vedi [`options.detached`][].
  * `uid` {number} Imposta l'identità dell'utente (user identity) del processo (vedi setuid(2)).
  * `gid` {number} Imposta l'identità di gruppo (group identity) del processo (vedi setgid(2)).
  * `shell` {boolean|string} Se `true`, esegue `command` all'interno di una shell. Utilizza `'/bin/sh'` su UNIX, e `process.env.ComSpec` su Windows. Una shell diversa può essere specificata come una stringa. Vedi [Requisiti della Shell](#child_process_shell_requirements) e [Shell Default di Windows](#child_process_default_windows_shell). **Default:** `false` (nessuna shell).
  * `windowsVerbatimArguments` {boolean} Non viene eseguita nessuna citazione od escaping degli argomenti su Windows. Ignorato su Unix. È impostato su `true` automaticamente quando la `shell` è specificata. **Default:** `false`.
  * `windowsHide` {boolean} Nasconde la finestra della console di sottoprocesso che verrebbe normalmente creata sui sistemi Windows. **Default:** `false`.
* Restituisce: {ChildProcess}

Il metodo `child_process.spawn()` genera un nuovo processo utilizzando il `command` dato, con gli argomenti della command line in `args`. Se omesso, `args` si imposta automaticamente su un array vuoto.

**Se l'opzione `shell` è abilitata, non passare l'input unsanitized user a questa funzione. Qualsiasi input contenente metacaratteri della shell può essere utilizzato per attivare l'esecuzione arbitraria dei comandi.**

Un terzo argomento può essere usato per specificare ulteriori opzioni, con questi valori di default:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Utilizza `cwd` per specificare la directory di lavoro dalla quale viene generato il processo. Se non specificata, l'impostazione predefinita consiste nell'ereditare l'attuale directory di lavoro.

Utilizza `env` per specificare le variabili di ambiente che saranno visibili per il nuovo processo, il valore predefinito è [`process.env`][].

I valori `undefined` in `env` saranno ignorati.

Esempio di esecuzione di `ls -lh /usr`, acquisizione di `stdout`, `stderr`, e del valore di uscita:

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

Esempio: Un modo molto elaborato per eseguire `ps ax | grep ssh`

```js
const { spawn } = require('child_process');
const ps = spawn('ps', ['ax']);
const grep = spawn('grep', ['ssh']);

ps.stdout.on('data', (data) => {
  grep.stdin.write(data);
});

ps.stderr.on('data', (data) => {
  console.log(`ps stderr: ${data}`);
});

ps.on('close', (code) => {
  if (code !== 0) {
    console.log(`ps process exited with code ${code}`);
  }
  grep.stdin.end();
});

grep.stdout.on('data', (data) => {
  console.log(data.toString());
});

grep.stderr.on('data', (data) => {
  console.log(`grep stderr: ${data}`);
});

grep.on('close', (code) => {
  if (code !== 0) {
    console.log(`grep process exited with code ${code}`);
  }
});
```

Esempio di controllo per `spawn` fallito:

```js
const { spawn } = require('child_process');
const subprocess = spawn('bad_command');

subprocess.on('error', (err) => {
  console.log('Failed to start subprocess.');
});
```

Alcune piattaforme (macOS, Linux) utilizzeranno il valore di `argv[0]` per il titolo del processo, mentre altri (Windows, SunOS) useranno `command`.

Attualmente Node.js sovrascrive `argv[0]` con `process.execPath` all'avvio, quindi il `process.argv[0]` all'interno di un processo child di Node.js non corrisponderà al parametro `argv0` passato a `spawn` dal parent, perciò va recuperato con la proprietà `process.argv0`.

#### options.detached

<!-- YAML
added: v0.7.10
-->

Su Windows, l'impostazione di `options.detached` su `true` consente al processo child di continuare ad essere eseguito dopo la chiusura del parent. Il child avrà la propria finestra della console. *Una volta abilitato per un processo child, non può essere disabilitato*.

Su piattaforme diverse da Windows, se `options.detached` è impostato su `true`, allora il processo child sarà reso il leader di un nuovo gruppo di processi e di sessione. Da notare che i processi child possono continuare ad essere eseguiti dopo che il parent si è concluso indipendentemente dal fatto che siano stati distaccati o meno. Vedi setsid(2) per maggiori informazioni.

Di default, il parent aspetterà che il child distaccato si concluda. Per prevenire che il parent attenda un dato `subprocess`, utilizza il metodo `subprocess.unref()`. Così facendo, il ciclo di eventi del parent non includerà il child nel suo reference count, consentendo al parent di concludere indipendentemente dal child, a meno che non vi sia un canale IPC stabilito tra child e parent.

Quando si utilizza l'opzione `detached` per avviare un processo di lunga durata, il processo non verrà eseguito in background dopo la conclusione del parent a meno che non sia fornito di una configurazione `stdio` che non sia collegata al parent. Se lo `stdio` del parent è ereditato, il child rimarrà collegato al terminale di controllo.

Esempio di un processo ad esecuzione prolungata, scollegando ed ignorando anche i file descriptor `stdio` del suo parent, in modo da ignorare la terminazione del parent stesso:

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

In alternativa, è possibile reindirizzare l'output del processo child all'interno dei file:

```js
const fs = require('fs');
const { spawn } = require('child_process');
const out = fs.openSync('./out.log', 'a');
const err = fs.openSync('./out.log', 'a');

const subprocess = spawn('prg', [], {
  detached: true,
  stdio: [ 'ignore', out, err ]
});

subprocess.unref();
```

#### options.stdio

<!-- YAML
added: v0.7.10
changes:

  - version: v3.3.1
    pr-url: https://github.com/nodejs/node/pull/2727
    description: The value `0` is now accepted as a file descriptor.
-->

L'opzione `options.stdio` viene utilizzata per configurare i pipe stabiliti tra i processi parent e child. Di default, lo stdin, lo stdout e lo stderr del child vengono reindirizzati ai corrispondenti stream [`subprocess.stdin`][], [`subprocess.stdout`][], e [`subprocess.stderr`][] sul [`ChildProcess`][] object. Ciò è equivalente all'impostazione di `options.stdio` uguale a `['pipe', 'pipe', 'pipe']`.

Per comodità, `options.stdio` potrebbe essere una delle seguenti stringhe:

* `'pipe'` - equivalente a `['pipe', 'pipe', 'pipe']` (il valore predefinito)
* `'ignore'` - equivalente a `['ignore', 'ignore', 'ignore']`
* `'inherit'` - equivalente a `[process.stdin, process.stdout, process.stderr]` oppure a `[0,1,2]`

In caso contrario, il valore di `options.stdio` è un array in cui ogni indice corrisponde a un file descriptor (fd) all'interno del child. I file descriptor (fd) 0, 1 e 2 corrispondono rispettivamente a stdin, stdout e stderr. È possibile specificare ulteriori file descriptor (fd) per creare pipe aggiuntivi tra parent e child. Il valore è uno dei seguenti:

1. `'pipe'` - Crea un pipe tra i processi child e parent. L'estremità parent del pipe è esposta al parent come una proprietà `child_process` object come un [`subprocess.stdio[fd]`][`stdio`]. I pipe creati per i file descriptor (fd) 0 - 2 sono anche disponibili, rispettivamente, come [`subprocess.stdin`][], [`subprocess.stdout`][] e [`subprocess.stderr`][].
2. `'ipc'` - Crea un canale IPC per far passare i messaggi/file descriptor tra parent e child. Un [`ChildProcess`][] può avere al massimo *un* file descriptor IPC stdio. L'impostazione di quest'opzione abilita il metodo [`subprocess.send()`][]. Se il child è un processo Node.js, la presenza di un canale IPC abiliterà i metodi [`process.send()`][] e [`process.disconnect()`][], nonché gli eventi [`'disconnect'`][] e [`'message'`][] all'interno del child stesso.
  
  L'accesso al file descriptor del canale IPC in un modo diverso dall'utilizzo di [`process.send()`][] oppure l'utilizzo del canale IPC con un processo child che non è un'istanza Node.js, non sono supportati.

3. `'ignore'` - Da a Node.js l'istruzione di ignorare il file descriptor all'interno del child. Sebbene Node.js aprirà sempre i file descriptor 0 - 2 per i processi che genera, l'impostazione del file descriptor su `'ignore'` farà in modo che Node.js apra `/dev/null` e lo colleghi al file descriptor del child.

4. {Stream} object - Condivide uno stream readable o writable che fa riferimento ad un tty, un file, un socket o un pipe con il processo child. Il file descriptor sottostante allo stream è duplicato nel processo child nel file descriptor corrispondente all'indice nell'array `stdio`. Da notare che lo stream deve avere un descriptor sottostante (gli stream dei file non entrano in azione finché non si verifica l'evento `'open'`).
5. Positive integer - Il valore integer (intero) viene interpretato come un file descriptor attualmente aperto nel processo parent. È condiviso con il processo child, in modo simile alla modalità di condivisione degli {Stream} object.
6. `null`, `undefined` - Utilizzano il valore predefinito. Per i file descriptor stdio 0, 1 e 2 (in altre parole, stdin, stdout e stderr) viene creato un pipe. Per i file descriptor 3 o superiori, l'impostazione predefinita è `'ignore'`.

Esempio:

```js
const { spawn } = require('child_process');

// Il child utilizzerà gli stdio del parent
spawn('prg', [], { stdio: 'inherit' });

// Genera un child che condivide solo stderr
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// Apre un extra fd = 4, per interagire con i programmi che presentano 
// un'interfaccia in stile startd.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

*Vale la pena notare che quando viene stabilito un canale IPC tra i processi parent e child, e il child è un processo Node.js, allora esso viene avviato con il canale IPC unreferenced (ovvero senza riferimento, utilizzando `unref()`) fino a quando registra un event handler per l'evento [`'disconnect'`][] o per l'evento [`'message'`][]. Ciò consente al child di concludersi normalmente senza che il processo venga tenuto aperto dal canale IPC aperto.*

Vedi anche: [`child_process.exec()`][] e [`child_process.fork()`][].

## Creazione di Processi Sincroni

I metodi [`child_process.spawnSync()`][], [`child_process.execSync()`][], e [`child_process.execFileSync()`][] sono **sincroni** e **bloccheranno** il ciclo di eventi di Node.js, interrompendo l'esecuzione di qualsiasi codice aggiuntivo fino alla chiusura del processo generato.

Blocking calls like these are mostly useful for simplifying general-purpose scripting tasks and for simplifying the loading/processing of application configuration at startup.

### child_process.execFileSync(file\[, args\]\[, options\])

<!-- YAML
added: v0.11.12
changes:

  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
  - version: v6.2.1, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6939
    description: The `encoding` option can now explicitly be set to `buffer`.
-->

* `file` {string} The name or path of the executable file to run.
* `args` {string[]} List of string arguments.
* `options` {Object} 
  * `cwd` {string} Current working directory of the child process.
  * `input` {string|Buffer|Uint8Array} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Child's stdio configuration. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Environment key-value pairs.
  * `uid` {number} Sets the user identity of the process (see setuid(2)).
  * `gid` {number} Sets the group identity of the process (see setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Default:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated. Vedi avvertenze su [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} The encoding used for all stdio inputs and outputs. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
  * `shell` {boolean|string} If `true`, runs `command` inside of a shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
* Returns: {Buffer|string} The stdout from the command.

The `child_process.execFileSync()` method is generally identical to [`child_process.execFile()`][] with the exception that the method will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited.

If the child process intercepts and handles the `SIGTERM` signal and does not exit, the parent process will still wait until the child process has exited.

If the process times out or has a non-zero exit code, this method ***will*** throw an [`Error`][] that will include the full result of the underlying [`child_process.spawnSync()`][].

**Se l'opzione `shell` è abilitata, non passare l'input unsanitized user a questa funzione. Qualsiasi input contenente metacaratteri della shell può essere utilizzato per attivare l'esecuzione arbitraria dei comandi.**

### child_process.execSync(command[, options])

<!-- YAML
added: v0.11.12
changes:

  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
-->

* `command` {string} The command to run.
* `options` {Object} 
  * `cwd` {string} Current working directory of the child process.
  * `input` {string|Buffer|Uint8Array} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Child's stdio configuration. `stderr` by default will be output to the parent process' stderr unless `stdio` is specified. **Default:** `'pipe'`.
  * `env` {Object} Environment key-value pairs.
  * `shell` {string} Shell to execute the command with. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` su UNIX, `process.env.ComSpec` su Windows.
  * `uid` {number} Sets the user identity of the process. (See setuid(2)).
  * `gid` {number} Sets the group identity of the process. (See setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Default:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated. Vedi avvertenze su [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} The encoding used for all stdio inputs and outputs. **Default:** `'buffer'`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Returns: {Buffer|string} The stdout from the command.

The `child_process.execSync()` method is generally identical to [`child_process.exec()`][] with the exception that the method will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited. *Note that if the child process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.*

If the process times out or has a non-zero exit code, this method ***will*** throw. The [`Error`][] object will contain the entire result from [`child_process.spawnSync()`][].

**Non passare mai l'input unsanitized user a questa funzione. Qualsiasi input contenente metacaratteri della shell può essere utilizzato per attivare l'esecuzione arbitraria dei comandi.**

### child_process.spawnSync(command\[, args\]\[, options\])

<!-- YAML
added: v0.11.12
changes:

  - version: v8.8.0
    pr-url: https://github.com/nodejs/node/pull/15380
    description: The `windowsHide` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10653
    description: The `input` option can now be a `Uint8Array`.
  - version: v6.2.1, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6939
    description: The `encoding` option can now explicitly be set to `buffer`.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4598
    description: The `shell` option is supported now.
-->

* `command` {string} The command to run.
* `args` {string[]} List of string arguments.
* `options` {Object} 
  * `cwd` {string} Current working directory of the child process.
  * `input` {string|Buffer|Uint8Array} The value which will be passed as stdin to the spawned process. Supplying this value will override `stdio[0]`.
  * `stdio` {string|Array} Child's stdio configuration.
  * `env` {Object} Environment key-value pairs.
  * `uid` {number} Sets the user identity of the process (see setuid(2)).
  * `gid` {number} Sets the group identity of the process (see setgid(2)).
  * `timeout` {number} In milliseconds the maximum amount of time the process is allowed to run. **Default:** `undefined`.
  * `killSignal` {string|integer} The signal value to be used when the spawned process will be killed. **Default:** `'SIGTERM'`.
  * `maxBuffer` {number} Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated. Vedi avvertenze su [`maxBuffer` and Unicode][]. **Default:** `200 * 1024`.
  * `encoding` {string} The encoding used for all stdio inputs and outputs. **Default:** `'buffer'`.
  * `shell` {boolean|string} If `true`, runs `command` inside of a shell. Uses `'/bin/sh'` on UNIX, and `process.env.ComSpec` on Windows. A different shell can be specified as a string. See [Shell Requirements](#child_process_shell_requirements) and [Default Windows Shell](#child_process_default_windows_shell). **Default:** `false` (no shell).
  * `windowsVerbatimArguments` {boolean} No quoting or escaping of arguments is done on Windows. Ignored on Unix. This is set to `true` automatically when `shell` is specified. **Default:** `false`.
  * `windowsHide` {boolean} Hide the subprocess console window that would normally be created on Windows systems. **Default:** `false`.
* Returns: {Object} 
  * `pid` {number} Pid of the child process.
  * `output` {Array} Array of results from stdio output.
  * `stdout` {Buffer|string} The contents of `output[1]`.
  * `stderr` {Buffer|string} The contents of `output[2]`.
  * `status` {number} The exit code of the child process.
  * `signal` {string} The signal used to kill the child process.
  * `error` {Error} The error object if the child process failed or timed out.

The `child_process.spawnSync()` method is generally identical to [`child_process.spawn()`][] with the exception that the function will not return until the child process has fully closed. When a timeout has been encountered and `killSignal` is sent, the method won't return until the process has completely exited. Note that if the process intercepts and handles the `SIGTERM` signal and doesn't exit, the parent process will wait until the child process has exited.

**Se l'opzione `shell` è abilitata, non passare l'input unsanitized user a questa funzione. Qualsiasi input contenente metacaratteri della shell può essere utilizzato per attivare l'esecuzione arbitraria dei comandi.**

## Class: ChildProcess

<!-- YAML
added: v2.2.0
-->

Instances of the `ChildProcess` class are [`EventEmitters`][`EventEmitter`] that represent spawned child processes.

Instances of `ChildProcess` are not intended to be created directly. Rather, use the [`child_process.spawn()`][], [`child_process.exec()`][], [`child_process.execFile()`][], or [`child_process.fork()`][] methods to create instances of `ChildProcess`.

### Event: 'close'

<!-- YAML
added: v0.7.7
-->

* `code` {number} The exit code if the child exited on its own.
* `signal` {string} The signal by which the child process was terminated.

The `'close'` event is emitted when the stdio streams of a child process have been closed. This is distinct from the [`'exit'`][] event, since multiple processes might share the same stdio streams.

### Event: 'disconnect'

<!-- YAML
added: v0.7.2
-->

The `'disconnect'` event is emitted after calling the [`subprocess.disconnect()`][] method in parent process or [`process.disconnect()`][] in child process. After disconnecting it is no longer possible to send or receive messages, and the [`subprocess.connected`][] property is `false`.

### Event: 'error'

* `err` {Error} The error.

The `'error'` event is emitted whenever:

1. The process could not be spawned, or
2. The process could not be killed, or
3. Sending a message to the child process failed.

The `'exit'` event may or may not fire after an error has occurred. When listening to both the `'exit'` and `'error'` events, it is important to guard against accidentally invoking handler functions multiple times.

See also [`subprocess.kill()`][] and [`subprocess.send()`][].

### Event: 'exit'

<!-- YAML
added: v0.1.90
-->

* `code` {number} The exit code if the child exited on its own.
* `signal` {string} The signal by which the child process was terminated.

The `'exit'` event is emitted after the child process ends. If the process exited, `code` is the final exit code of the process, otherwise `null`. If the process terminated due to receipt of a signal, `signal` is the string name of the signal, otherwise `null`. One of the two will always be non-null.

Note that when the `'exit'` event is triggered, child process stdio streams might still be open.

Also, note that Node.js establishes signal handlers for `SIGINT` and `SIGTERM` and Node.js processes will not terminate immediately due to receipt of those signals. Rather, Node.js will perform a sequence of cleanup actions and then will re-raise the handled signal.

See waitpid(2).

### Event: 'message'

<!-- YAML
added: v0.5.9
-->

* `message` {Object} A parsed JSON object or primitive value.
* `sendHandle` {Handle} A [`net.Socket`][] or [`net.Server`][] object, or undefined.

The `'message'` event is triggered when a child process uses [`process.send()`][] to send messages.

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

### subprocess.channel

<!-- YAML
added: v7.1.0
-->

* {Object} A pipe representing the IPC channel to the child process.

The `subprocess.channel` property is a reference to the child's IPC channel. If no IPC channel currently exists, this property is `undefined`.

### subprocess.connected

<!-- YAML
added: v0.7.2
-->

* {boolean} Set to `false` after `subprocess.disconnect()` is called.

The `subprocess.connected` property indicates whether it is still possible to send and receive messages from a child process. When `subprocess.connected` is `false`, it is no longer possible to send or receive messages.

### subprocess.disconnect()

<!-- YAML
added: v0.7.2
-->

Closes the IPC channel between parent and child, allowing the child to exit gracefully once there are no other connections keeping it alive. After calling this method the `subprocess.connected` and `process.connected` properties in both the parent and child (respectively) will be set to `false`, and it will be no longer possible to pass messages between the processes.

The `'disconnect'` event will be emitted when there are no messages in the process of being received. This will most often be triggered immediately after calling `subprocess.disconnect()`.

Note that when the child process is a Node.js instance (e.g. spawned using [`child_process.fork()`]), the `process.disconnect()` method can be invoked within the child process to close the IPC channel as well.

### subprocess.kill([signal])

<!-- YAML
added: v0.1.90
-->

* `signal` {string}

The `subprocess.kill()` method sends a signal to the child process. If no argument is given, the process will be sent the `'SIGTERM'` signal. See signal(7) for a list of available signals.

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

grep.on('close', (code, signal) => {
  console.log(
    `child process terminated due to receipt of signal ${signal}`);
});

// Send SIGHUP to process
grep.kill('SIGHUP');
```

The [`ChildProcess`][] object may emit an [`'error'`][] event if the signal cannot be delivered. Sending a signal to a child process that has already exited is not an error but may have unforeseen consequences. Specifically, if the process identifier (PID) has been reassigned to another process, the signal will be delivered to that process instead which can have unexpected results.

Note that while the function is called `kill`, the signal delivered to the child process may not actually terminate the process.

See kill(2) for reference.

Also note: on Linux, child processes of child processes will not be terminated when attempting to kill their parent. This is likely to happen when running a new process in a shell or with use of the `shell` option of `ChildProcess`, such as in this example:

```js
'use strict';
const { spawn } = require('child_process');

const subprocess = spawn(
  'sh',
  [
    '-c',
    `node -e "setInterval(() => {
      console.log(process.pid, 'is alive')
    }, 500);"`
  ], {
    stdio: ['inherit', 'inherit', 'inherit']
  }
);

setTimeout(() => {
  subprocess.kill(); // does not terminate the node process in the shell
}, 2000);
```

### subprocess.killed

<!-- YAML
added: v0.5.10
-->

* {boolean} Set to `true` after `subprocess.kill()` is used to successfully send a signal to the child process.

The `subprocess.killed` property indicates whether the child process successfully received a signal from `subprocess.kill()`. The `killed` property does not indicate that the child process has been terminated.

### subprocess.pid

<!-- YAML
added: v0.1.90
-->

* {integer}

Returns the process identifier (PID) of the child process.

Example:

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`Spawned child pid: ${grep.pid}`);
grep.stdin.end();
```

### subprocess.send(message\[, sendHandle[, options]\]\[, callback\])

<!-- YAML
added: v0.5.9
changes:

  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5283
    description: The `options` parameter, and the `keepOpen` option
                 in particular, is supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3516
    description: This method returns a boolean for flow control now.
  - version: v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2620
    description: The `callback` parameter is supported now.
-->

* `message` {Object}
* `sendHandle` {Handle}
* `options` {Object} The `options` argument, if present, is an object used to parameterize the sending of certain types of handles. `options` supports the following properties: 
  * `keepOpen` {boolean} A value that can be used when passing instances of `net.Socket`. When `true`, the socket is kept open in the sending process. **Default:** `false`.
* `callback` {Function}
* Returns: {boolean}

When an IPC channel has been established between the parent and child ( i.e. when using [`child_process.fork()`][]), the `subprocess.send()` method can be used to send messages to the child process. When the child process is a Node.js instance, these messages can be received via the [`'message'`][] event.

The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

For example, in the parent script:

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
  console.log('PARENT got message:', m);
});

// Causes the child to print: CHILD got message: { hello: 'world' }
n.send({ hello: 'world' });
```

And then the child script, `'sub.js'` might look like this:

```js
process.on('message', (m) => {
  console.log('CHILD got message:', m);
});

// Causes the parent to print: PARENT got message: { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

Child Node.js processes will have a [`process.send()`][] method of their own that allows the child to send messages back to the parent.

There is a special case when sending a `{cmd: 'NODE_foo'}` message. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`'message'`][] event. Rather, such messages are emitted using the `'internalMessage'` event and are consumed internally by Node.js. Applications should avoid using such messages or listening for `'internalMessage'` events as it is subject to change without notice.

The optional `sendHandle` argument that may be passed to `subprocess.send()` is for passing a TCP server or socket object to the child process. The child will receive the object as the second argument passed to the callback function registered on the [`'message'`][] event. Any data that is received and buffered in the socket will not be sent to the child.

The optional `callback` is a function that is invoked after the message is sent but before the child may have received it. The function is called with a single argument: `null` on success, or an [`Error`][] object on failure.

If no `callback` function is provided and the message cannot be sent, an `'error'` event will be emitted by the [`ChildProcess`][] object. This can happen, for instance, when the child process has already exited.

`subprocess.send()` will return `false` if the channel has closed or when the backlog of unsent messages exceeds a threshold that makes it unwise to send more. Otherwise, the method returns `true`. The `callback` function can be used to implement flow control.

#### Example: sending a server object

The `sendHandle` argument can be used, for instance, to pass the handle of a TCP server object to the child process as illustrated in the example below:

```js
const subprocess = require('child_process').fork('subprocess.js');

// Open up the server object and send the handle.
const server = require('net').createServer();
server.on('connection', (socket) => {
  socket.end('handled by parent');
});
server.listen(1337, () => {
  subprocess.send('server', server);
});
```

The child would then receive the server object as:

```js
process.on('message', (m, server) => {
  if (m === 'server') {
    server.on('connection', (socket) => {
      socket.end('handled by child');
    });
  }
});
```

Once the server is now shared between the parent and child, some connections can be handled by the parent and some by the child.

While the example above uses a server created using the `net` module, `dgram` module servers use exactly the same workflow with the exceptions of listening on a `'message'` event instead of `'connection'` and using `server.bind()` instead of `server.listen()`. This is, however, currently only supported on UNIX platforms.

#### Example: sending a socket object

Similarly, the `sendHandler` argument can be used to pass the handle of a socket to the child process. The example below spawns two children that each handle connections with "normal" or "special" priority:

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// Open up the server and send sockets to child. Use pauseOnConnect to prevent
// the sockets from being read before they are sent to the child process.
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {

  // If this is special priority
  if (socket.remoteAddress === '74.125.127.100') {
    special.send('socket', socket);
    return;
  }
  // This is normal priority
  normal.send('socket', socket);
});
server.listen(1337);
```

The `subprocess.js` would receive the socket handle as the second argument passed to the event callback function:

```js
process.on('message', (m, socket) => {
  if (m === 'socket') {
    if (socket) {
      // Check that the client socket exists.
      // It is possible for the socket to be closed between the time it is
      // sent and the time it is received in the child process.
      socket.end(`Request handled with ${process.argv[2]} priority`);
    }
  }
});
```

Once a socket has been passed to a child, the parent is no longer capable of tracking when the socket is destroyed. To indicate this, the `.connections` property becomes `null`. It is recommended not to use `.maxConnections` when this occurs.

It is also recommended that any `'message'` handlers in the child process verify that `socket` exists, as the connection may have been closed during the time it takes to send the connection to the child.

### subprocess.stderr

<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

A `Readable Stream` that represents the child process's `stderr`.

If the child was spawned with `stdio[2]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stderr` is an alias for `subprocess.stdio[2]`. Both properties will refer to the same value.

### subprocess.stdin

<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

A `Writable Stream` that represents the child process's `stdin`.

*Note that if a child process waits to read all of its input, the child will not continue until this stream has been closed via `end()`.*

If the child was spawned with `stdio[0]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdin` is an alias for `subprocess.stdio[0]`. Both properties will refer to the same value.

### subprocess.stdio

<!-- YAML
added: v0.7.10
-->

* {Array}

A sparse array of pipes to the child process, corresponding with positions in the [`stdio`][] option passed to [`child_process.spawn()`][] that have been set to the value `'pipe'`. Note that `subprocess.stdio[0]`, `subprocess.stdio[1]`, and `subprocess.stdio[2]` are also available as `subprocess.stdin`, `subprocess.stdout`, and `subprocess.stderr`, respectively.

In the following example, only the child's fd `1` (stdout) is configured as a pipe, so only the parent's `subprocess.stdio[1]` is a stream, all other values in the array are `null`.

```js
const assert = require('assert');
const fs = require('fs');
const child_process = require('child_process');

const subprocess = child_process.spawn('ls', {
  stdio: [
    0, // Use parent's stdin for child
    'pipe', // Pipe child's stdout to parent
    fs.openSync('err.out', 'w') // Direct child's stderr to a file
  ]
});

assert.strictEqual(subprocess.stdio[0], null);
assert.strictEqual(subprocess.stdio[0], subprocess.stdin);

assert(subprocess.stdout);
assert.strictEqual(subprocess.stdio[1], subprocess.stdout);

assert.strictEqual(subprocess.stdio[2], null);
assert.strictEqual(subprocess.stdio[2], subprocess.stderr);
```

### subprocess.stdout

<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

A `Readable Stream` that represents the child process's `stdout`.

If the child was spawned with `stdio[1]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdout` is an alias for `subprocess.stdio[1]`. Both properties will refer to the same value.

## `maxBuffer` and Unicode

The `maxBuffer` option specifies the largest number of bytes allowed on `stdout` or `stderr`. If this value is exceeded, then the child process is terminated. This impacts output that includes multibyte character encodings such as UTF-8 or UTF-16. For instance, `console.log('中文测试')` will send 13 UTF-8 encoded bytes to `stdout` although there are only 4 characters.

## Shell Requirements

The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows. On Windows, command line parsing should be compatible with `'cmd.exe'`.

## Default Windows Shell

Although Microsoft specifies `%COMSPEC%` must contain the path to `'cmd.exe'` in the root environment, child processes are not always subject to the same requirement. Thus, in `child_process` functions where a shell can be spawned, `'cmd.exe'` is used as a fallback if `process.env.ComSpec` is unavailable.