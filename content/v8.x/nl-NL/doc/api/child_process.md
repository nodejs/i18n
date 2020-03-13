# Sub-proces

<!--introduced_in=v0.10.0-->

> Stabiliteit: 2 - stabiel

De `child_process` module biedt de mogelijkheid om sub-processen te verspreiden op een manier die vergelijkbaar is met, maar niet gelijk aan, popen(3). Dit vermogen wordt voornamelijk verzorgd door de functie [`child_process.spawn()`][]:

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

Als standaard, worden kanalen voor `stdin`, `stdout`, en `stderr` tot stand gebracht tussen het bovenliggende Node.js proces en het verspreide sub-proces. Deze kanalen hebben beperkte (en platform-specifieke) capaciteit. Als het sub-proces boven die grens naar stdout schrijft, zonder dat de output vastgelegd wordt, zal het sub- proces het wachten op de kanaal buffer blokkeren om meer data te accepteren. Dit is identiek aan het gedrag van de kanalen in de shell. Gebruik de `{ stdio: 'ignore' }` optie als de output niet wordt verbruikt.

De [`child_process.spawn()`][] methode verspreidt het kind proces asynchroon, zonder de Node.js gebeurtenislus te blokkeren. De [`child_process.spawnSync()`][] functie biedt vergelijkbare functionaliteit op synchrone wijze, die de gebeurtenislus blokkeert totdat het verspreide proces stopt of wordt uitgeschakeld.

Voor het gemak, biedt de `child_process` module een aantal synchrone en asynchrone alternatieven voor [`child_process.spawn()`][] en [`child_process.spawnSync()`][]. *Houd er rekening mee dat al deze alternatieven bovenop [`child_process.spawn()`][] of [`child_process.spawnSync()`][] worden geïmplementeerd.*

  * [`child_process.exec()`][]: spawns a shell and runs a command within that shell, passing the `stdout` and `stderr` to a callback function when complete.
  * [`child_process.execFile()`][]: similar to [`child_process.exec()`][] except that it spawns the command directly without first spawning a shell by default.
  * [`child_process.fork()`][]: spawns a new Node.js process and invokes a specified module with an IPC communication channel established that allows sending messages between parent and child.
  * [`child_process.execSync()`][]: a synchronous version of [`child_process.exec()`][] that *will* block the Node.js event loop.
  * [`child_process.execFileSync()`][]: a synchronous version of [`child_process.execFile()`][] that *will* block the Node.js event loop.

Voor bepaalde use-cases, zoals het automatiseren van shell scripts, kunnen de [synchronous counterparts](#child_process_synchronous_process_creation) handiger zijn. Echter, in vele gevallen kunnen de synchrone methoden een aanzienlijke invloed hebben op prestatie als gevolg van het vertragen van de gebeurtenislus, terwijl verspreide processen voltooien.

## Asynchronous Process Creation

De [`child_process.spawn()`][], [`child_process.fork()`][], [`child_process.exec()`][], en [`child_process.execFile()`][] methoden volgen ieder het idiomatische asynchrone programmeringspatroon die typisch zijn voor andere Node.js API's.

Al deze methoden retourneren een [`ChildProcess`][] instantie. Deze objecten implementeren de Node.js [`EventEmitter`][] API, waardoor het ouder-proces luisteraar functies kan registreren die worden opgeroepen als bepaalde gebeurtenissen optreden gedurende de levenscyclus van het kind-proces.

De [`child_process.exec()`][] en [`child_process.execFile()`][] methoden staan bovendien toe een optionele `callback` functie te specificeren die aangeroepen wordt als het kind-proces wordt beëindigd.

### Verspreiden `.bat` en `.cmd` bestanden op Windows

Het belang van onderscheid tussen [`child_process.exec()`][] en [`child_process.execFile()`][] kan variëren op basis van het platform. Op Unix-type besturingssystemen (Unix, Linux, macOS) kan [`child_process.execFile()`][] efficiënter zijn omdat het niet als standaard een shell verspreidt. Op Windows zullen echter de `.bat` en `.cmd` bestanden niet op zichzelf uitvoerbaar zijn zonder een terminal, en kunnen daarom niet worden gelanceerd met behulp van [`child_process.execFile()`][]. Als het systeem op Windows draait, kunnen `.bat` en `.cmd` bestanden worden aangeroepen met behulp van de `shell` optie set, met [`child_process.exec()`][], of door het verspreiden van `cmd.exe` en de `.bat` of `.cmd` bestanden door te geven als een argument (wat ook is wat de `shell` optie en [`child_process.exec()`][] doen). In ieder geval moeten spaties worden genoteerd als de bestandsnaam van het script die bevat.

```js
// Alleen op Windows ...
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
// OF...
const { exec } = require('child_process');
exec('my.bat', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

// Script met spaties in de bestandsnaam:
const bat = spawn('"my script.cmd"', ['a', 'b'], { shell: true });
// or:
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

* `command` {string} De uit te voeren opdracht, met argumenten gescheiden door spaties.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces. **Default:** `null`.
  * `env` {Object} Omgeving belangrijkste paren. **Default:** `null`.
  * `encoding` {string} **Default:** `'utf8'`
  * `shell` {string} Shell om de opdracht mee uit te voeren. Zie [Shell Requirements](#child_process_shell_requirements) en [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` op UNIX, `process.env.ComSpec` op Windows.
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Grootste hoeveelheid gegevens in bytes dat is toegestaan op stdout of stderr. Bij overschrijding, wordt het subproces afgesloten. Zie waarschuwing op [`maxBuffer` en Unicode][]. **Standaard:** `200 * 1024`.
  * `killSignal` {string|integer} **Standaard:** `'SIGTERM'`
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in (zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in (zie setgid(2)).
  * `windowsHide` {boolean} Verberg het subprocess consolevenster dat normaal zou worden gecreëerd op Windows systemen. **Standaard:** `false`.
* `callback` {Function} called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Retourneert: {ChildProcess}

Verspreidt een shell en voert dan de `command` uit binnen deze shell, terwijl alle gegenereerde output wordt gebufferd. De `command` string doorgegeven aan de exec functie wordt direct verwerkt door de shell en speciale tekens (variëren gebaseerd op [shell](https://en.wikipedia.org/wiki/List_of_command-line_interpreters)) moeten dienovereenkomstig worden behandeld:
```js
exec('"/path/to/test file/test.sh" arg1 arg2');
//Double quotes are used so that the space in the path is not interpreted as
//multiple arguments

exec('echo "The \\$HOME variable is $HOME"');
//The $HOME variable is escaped in the first instance, but not in the second
```

*Note*: Never pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

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

Als een `callback` functie wordt geleverd, wordt het met de argumenten `(error, stdout, stderr)` genoemd. Als het succesvol is, zal `error` `null` zijn. Bij een fout, zal `error` een instantie van [`Error`][] zijn. De `error.code` eigenschap zal de uitgangscode van het kind proces zijn, terwijl `error.signal` zal worden ingesteld als signaal dat het proces heeft beëindigd. Elke uitgangscode behalve `0` wordt als fout beschouwd.

De `stdout` en `stderr` argumenten doorgegeven aan de callback zal de stdout en stderr output van het kind proces bevatten. Als standaard zal Node.js de output als UTF-8 decoderen, en strings aan de callback doorgeven. De `encoding` optie kan worden gebruikt om de tekencodering te specificeren die is gebruikt om de stdout en stderr output te decoderen. Als `encoding` een `'buffer'` is, of een niet-herkende tekencodering, zullen in plaats daarvan `Buffer` objecten aan de callback worden doorgegeven.

Als de `timeout` groter is dan `0`, zal de ouder het signaal geïdentificeerd door de `killSignal` eigenschap sturen (de standaard is `'SIGTERM'`) als het kind langer loopt dan `timeout` milliseconden.

*Note*: Unlike the exec(3) POSIX system call, `child_process.exec()` does not replace the existing process and uses a shell to execute the command.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `stdout` and `stderr` properties. In case of an error, a rejected promise is returned, with the same `error` object given in the callback, but with an additional two properties `stdout` and `stderr`.

For example:

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

* `file` {string} De naam of het pad van het te draaien uitvoerbare bestand.
* `args` {string[]} Lijst van string-argumenten.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces.
  * `env` {Object} Omgeving belangrijkste paren.
  * `encoding` {string} **Default:** `'utf8'`
  * `timeout` {number} **Default:** `0`
  * `maxBuffer` {number} Grootste hoeveelheid gegevens in bytes dat is toegestaan op stdout of stderr. Bij overschrijding, wordt het subproces afgesloten. Zie waarschuwing op [`maxBuffer` en Unicode][]. **Standaard:** `200 * 1024`.
  * `killSignal` {string|integer} **Standaard:** `'SIGTERM'`
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in (zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in (zie setgid(2)).
  * `windowsHide` {boolean} Verberg het subprocess consolevenster dat normaal zou worden gecreëerd op Windows systemen. **Standaard:** `false`.
  * `windowsVerbatimArguments` {boolean} Er wordt geen citeren of ontsnappen van argumenten gedaan op Windows. Genegeerd op Unix. **Standaard:** `false`.
  * `shell` {boolean|string} Als het `true` is, draait `command` binnen een shell. Gebruikt `'/bin/sh'` op UNIX, en `process.env.ComSpec` op Windows. Er kan een andere shell worden gespecificeerd als een string. Zie [Shell Requirements](#child_process_shell_requirements) en [Default Windows Shell](#child_process_default_windows_shell). **Standaard:** `false` (geen shell).
* `callback` {Function} Called with the output when process terminates.
  * `error` {Error}
  * `stdout` {string|Buffer}
  * `stderr` {string|Buffer}
* Retourneert: {ChildProcess}

De `child_process.execFile()` functie is vergelijkbaar met het [`child_process.exec()`][], behalve dat er niet als standaard een shell wordt verspreid. In plaats daarvan, wordt de gespecificeerde uitvoerbare `file` direct verspreidt als een nieuw proces, wat het íéts efficiënter maakt dan het [`child_process.exec()`][].

Dezelfde opties als [`child_process.exec()`][] worden ondersteund. Omdat er geen shell wordt verspreid, wordt gedrag als I/O omleidingen en bestand globbing niet ondersteund.

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
  als (error) {
    werpt fout;
  }
  console.log(stdout);
});
```

De `stdout` en `stderr` argumenten doorgegeven aan de callback zullen de stdout en stderr output van het kind proces bevatten. Als standaard zal Node.js de output als UTF-8 decoderen, en strings aan de callback doorgeven. De `encoding` optie kan worden gebruikt om de tekencodering te specificeren die is gebruikt om de stdout en stderr output te decoderen. Als `encoding` een `'buffer'` is, of een niet-herkende tekencodering, zullen in plaats daarvan `Buffer` objecten aan de callback worden doorgegeven.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `stdout` and `stderr` properties. In case of an error, a rejected promise is returned, with the same `error` object given in the callback, but with an additional two properties `stdout` and `stderr`.

```js
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
async function getVersion() {
  const { stdout } = await execFile('node', ['--version']);
  console.log(stdout);
}
getVersion();
```

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

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

* `modulePath` {string} De module om het sub-proces te laten draaien.
* `args` {Array} List of string arguments.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces.
  * `env` {Object} Omgeving belangrijkste paren.
  * `execPath` {string} Uitvoerbaar gebruikt voor het maken van het sub-proces.
  * `execArgv` {Array} List of string arguments passed to the executable. **Standaard:** `process.execArgv`.
  * `silent` {boolean} Als het `true` is, zal stdin, stdout, en stderr van het onderliggende proces worden doorgesluisd naar de ouder, anders zal het worden overgenomen van het hoofd-proces, zie de `'pipe'` en `'inherit'` opties voor [`child_process.spawn()`][]'s [`stdio`][] voor meer informatie. **Standaard:** `false`.
  * `stdio` {Array|string} Zie [`child_process.spawn()`][]'s [`stdio`][]. Als deze optie wordt gegeven, dan verwerpt het `silent`. Als de array variant wordt gebruikt, dan moet het precies één object met de waarde `'ipc'` bevatten, of er wordt een fout geworpen. Bijvoorbeeld `[0, 1, 2, 'ipc']`.
  * `windowsVerbatimArguments` {boolean} Er wordt geen citeren of ontsnappen van argumenten gedaan op Windows. Genegeerd op Unix. **Standaard:** `false`.
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in (zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in (zie setgid(2)).
* Retourneert: {ChildProcess}

De `child_process.fork()` methode is een speciaal geval van een [`child_process.spawn()`][] specifiek gebruikt voor het verdelen van nieuwe Node.js processen. Zoals met [`child_process.spawn()`][], wordt een [`ChildProcess`][] object geretourneerd. Het geretourneerde [`ChildProcess`][] zal een aanvullend communicatiekanaal ingebouwd hebben dat het mogelijk maakt berichten tussen het hoofd- en het sub-proces door te geven. Zie [`subprocess.send()`][] voor meer informatie.

Het is belangrijk om in gedachten te houden dat verspreide Node.js sub-processen onafhankelijk zijn van het hoofd-proces, met uitzondering van het IPC-communicatiekanaal dat is gevestigd tussen de twee. Ieder proces heeft zijn eigen geheugen, met hun eigen V8-instanties. Vanwege de aanvullende hulpmiddel-toewijzingen die nodig zijn, is het niet aanbevolen een groot aantal Node.js sub-processen te verspreiden.

Als standaard zal een `child_process.fork()` nieuwe Node.js instanties verspreiden met behulp van het [`process.execPath`][] van het hoofd-proces. De `execPath` eigenschap in het `options` object maakt het mogelijk een alternatief uitvoeringspad te gebruiken.

Node.js processen die gelanceerd zijn met een aangepast `execPath` zullen met het hoofd-proces communiceren met behulp van de file descriptor (fd) die wordt geïdentificeerd met behulp van de omgevingsvariabele `NODE_CHANNEL_FD` op het sub-proces.

*Note*: Unlike the fork(2) POSIX system call, `child_process.fork()` does not clone the current process.

*Note*: The `shell` option available in [`child_process.spawn()`][] is not supported by `child_process.fork()` and will be ignored if set.

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

* `command` {string} De te draaien opdracht.
* `args` {Array} List of string arguments.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces.
  * `env` {Object} Omgeving belangrijkste paren.
  * `argv0` {string} Stel uitdrukkelijk de waarde in van `argv[0]` verzonden naar het subproces. Dit zal worden ingesteld op `command` als het niet wordt opgegeven.
  * `stdio` {Array|string} stdio configuratie van het subproces (zie [`options.stdio`][`stdio`]).
  * `detached` {boolean} Bereid kind voor om onafhankelijk van het hoofdproces te draaien. Specifiek gedrag hangt af van het platform, zie [`options.detached`][]).
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in (zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in (zie setgid(2)).
  * `shell` {boolean|string} Als het `true` is, draait `command` binnen een shell. Gebruikt `'/bin/sh'` op UNIX, en `process.env.ComSpec` op Windows. Er kan een andere shell worden gespecificeerd als een string. Zie [Shell Requirements](#child_process_shell_requirements) en [Default Windows Shell](#child_process_default_windows_shell). **Standaard:** `false` (geen shell).
  * `windowsVerbatimArguments` {boolean} Er wordt geen citeren of ontsnappen van argumenten gedaan op Windows. Genegeerd op Unix. Dit wordt automatisch op `true` ingesteld als de `shell` wordt gespecificeerd. **Standaard:** `false`.
  * `windowsHide` {boolean} Verberg het subprocess consolevenster dat normaal zou worden gecreëerd op Windows systemen. **Standaard:** `false`.
* Retourneert: {ChildProcess}

De `child_process.spawn()` methode verspreidt een nieuw proces met behulp van het gegeven `command`, met opdrachtlijn-argumenten in `args`. Als dit overgeslagen wordt, zal `args` standaard naar een lege array worden gezet.

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

Een derde argument kan worden gebruikt voor het opgeven van aanvullende opties, met deze standaardinstellingen:

```js
const defaults = {
  cwd: undefined,
  env: process.env
};
```

Gebruik `cwd` om een werkmap te specificeren waaruit het proces is verspreid. Als dit niet is aangegeven, zal het standaard de actuele werkmap overnemen.

Gebruik `env` om omgevingsvariabelen te specificeren die zichtbaar zullen zijn aan het nieuwe proces, de standaard is [`process.env`][].

Voorbeeld van het draaien van de `ls -lh /usr`, het vastleggen van `stdout`, `stderr`, en de afsluitcode:

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


Voorbeeld: Een zeer uitvoerige manier om `ps ax | grep ssh` te draaien

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
    console.log(`ps proces afesloten met code ${code}`);
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
    console.log(`grep proces afgesloten met code ${code}`);
  }
});
```


Voorbeeld van zoeken naar gefaald `spawn`:

```js
const { spawn } = require('child_process');
const subprocess = spawn('bad_command');

subprocess.on('error', (err) => {
  console.log('Subproces starten gefaald.');
});
```

*Note*: Certain platforms (macOS, Linux) will use the value of `argv[0]` for the process title while others (Windows, SunOS) will use `command`.

*Note*: Node.js currently overwrites `argv[0]` with `process.execPath` on startup, so `process.argv[0]` in a Node.js child process will not match the `argv0` parameter passed to `spawn` from the parent, retrieve it with the `process.argv0` property instead.

#### options.detached
<!-- YAML
added: v0.7.10
-->

In Windows maakt de instelling `options.detached` naar `true` het voor het subproces mogelijk om door te blijven draaien nadat het bovenliggende proces afsluit. Het subproces zal zijn eigen console-venster hebben. *Eenmaal ingeschakeld voor een subproces, kan het niet worden uitgeschakeld*.

Op niet-Windows platforms, zal het subproces leider worden gemaakt van een nieuwe procesgroep en sessie als `options.detached` is ingesteld op `true`. Let er hierbij op dat subprocessen door kunnen blijven draaien nadat het hoofdproces afsluit, ongeacht of ze zijn losgekoppeld. Zie setsid(2) voor meer informatie.

Als standaard zal het hoofdproces wachten tot het losgekoppelde subproces afsluit. Om te voorkomen dat het hoofdproces wacht op een gegeven `subprocess`, gebruik de `subprocess.unref()` methode. Door dit te doen zal de gebeurtenislus van het hoofdproces het subproces niet in de referentietelling toevoegen, waardoor het hoofdproces onafhankelijk van het subproces kan afsluiten, tenzij er een gevestigd IPC-kanaal is tussen het sub- en hoofdproces.

Bij gebruik van de `detached` optie om een langlopend proces te starten, zal het proces niet in de achtergrond blijven draaien nadat het hoofdproces afsluit, tenzij het is voorzien van een `stdio` configuratie wat niet gekoppeld is aan het hoofdproces. Als de `stdio` van het hoofdproces is geërfd, zal het subproces gekoppeld blijven aan de heersende terminal.

Voorbeeld van een langlopend proces, door ontkoppelen en ook het negeren van de `stdio` bestandsdescriptors van het hoofdproces, om beëindiging van het hoofdproces te negeren:

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
  detached: true,
  stdio: 'ignore'
});

subprocess.unref();
```

Als alternatief kan men ook de subproces output doorsturen naar bestanden:

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

De `options.stdio` optie wordt gebruikt voor het configureren van de leidingen die zijn gevestigd tussen het hoofdproces en subproces. De stdin, stdout en stderr van het subproces worden standaard omgeleid naar de overeenkomstige [`subprocess.stdin`][], [`subprocess.stdout`][], en [`subprocess.stderr`][] streams op het [`ChildProcess`][] object. Dit is gelijk aan het instellen van de `options.stdio` gelijk aan `['pipe', 'pipe', 'pipe']`.

Voor het gemak, is `options.stdio` wellicht een van de volgende strings:

* `'pipe'` - gelijk aan `['pipe', 'pipe', 'pipe']` (de standaard)
* `'ignore'` - gelijk aan `['ignore', 'ignore', 'ignore']`
* `'inherit'` - gelijk aan `[process.stdin, process.stdout, process.stderr]` of `[0,1,2]`

Anders is de waarde van `options.stdio` een array waarbij elke index overeenkomt met een fd in het kind. De fds 0, 1, en 2 komen overeen met, respectievelijk, stdin, stdout, en stderr. Aanvullende fds kunnen worden gespecificeerd om extra leidingen tussen het hoofdproces en subproces te creëren. De waarde is een van de volgenden:

1. `'pipe'` - Creëer een leiding tussen het subproces en het hoofdproces. The parent end of the pipe is exposed to the parent as a property on the `child_process` object as [`subprocess.stdio[fd]`][`stdio`]. Pipes created for fds 0 - 2 are also available as [`subprocess.stdin`][], [`subprocess.stdout`][] and [`subprocess.stderr`][], respectively.
2. `'ipc'` - Create an IPC channel for passing messages/file descriptors between parent and child. A [`ChildProcess`][] may have at most *one* IPC stdio file descriptor. Setting this option enables the [`subprocess.send()`][] method. If the child is a Node.js process, the presence of an IPC channel will enable [`process.send()`][], [`process.disconnect()`][], [`process.on('disconnect')`][], and [`process.on('message')`] within the child.

   Accessing the IPC channel fd in any way other than [`process.send()`][] or using the IPC channel with a child process that is not a Node.js instance is not supported.
3. `'ignore'` - Geeft Node.js als instructie de fd in het onderliggende proces te negeren. While Node.js will always open fds 0 - 2 for the processes it spawns, setting the fd to `'ignore'` will cause Node.js to open `/dev/null` and attach it to the child's fd.
4. {Stream} object - Share a readable or writable stream that refers to a tty, file, socket, or a pipe with the child process. The stream's underlying file descriptor is duplicated in the child process to the fd that corresponds to the index in the `stdio` array. Note that the stream must have an underlying descriptor (file streams do not until the `'open'` event has occurred).
5. Positive integer - The integer value is interpreted as a file descriptor that is currently open in the parent process. It is shared with the child process, similar to how {Stream} objects can be shared.
6. `null`, `undefined` - Gebuik standaardwaarde. For stdio fds 0, 1, and 2 (in other words, stdin, stdout, and stderr) a pipe is created. For fd 3 and up, the default is `'ignore'`.

Voorbeeld:

```js
const { spawn } = require('child_process');

// Subproces zal bovenliggende stdios gebruiken
spawn('prg', [], { stdio: 'inherit' });

// Verspreid subproces terwijl het alleen stderr deelt
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// Open een extra fd=4, om te communiceren met programma's die een
// startd-style interface presenteren.
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

*It is worth noting that when an IPC channel is established between the parent and child processes, and the child is a Node.js process, the child is launched with the IPC channel unreferenced (using `unref()`) until the child registers an event handler for the [`process.on('disconnect')`][] event or the [`process.on('message')`][] event. Hierdoor kan het subproces normaal afsluiten zonder dat het proces open wordt gehouden door het open IPC-kanaal.*

See also: [`child_process.exec()`][] and [`child_process.fork()`][]

## Synchrone Proces Creatie

The [`child_process.spawnSync()`][], [`child_process.execSync()`][], and [`child_process.execFileSync()`][] methods are **synchronous** and **WILL** block the Node.js event loop, pausing execution of any additional code until the spawned process exits.

Het blokkeren van oproepen zoals deze zijn meestal nuttig voor het vereenvoudigen van algemene-functie scriptingtaken en voor het vergemakkelijken van het laden/verwerken van toepassingsconfiguratie bij het opstarten.

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

* `file` {string} De naam of het pad van het te draaien uitvoerbare bestand.
* `args` {string[]} Lijst van string-argumenten.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces.
  * `input` {string|Buffer|Uint8Array} De waarde die naar het verspreide proces zal worden doorgegeven als stdin. Het leveren van deze waarde zal `stdio[0]`overschrijven.
  * `stdio` {string|Array} De stdio configuratie van het subproces. `stderr` standaard zal de uitvoer naar het hoofdproces stderr zijn tenzij `stdio` is opgegeven. **Default:** `'pipe'`.
  * `env` {Object} Omgeving belangrijkste paren.
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in (zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in (zie setgid(2)).
  * `timeout` {number} de maximale tijd, in milliseconden, waarin het proces mag draaien. **Standaard:** `undefined`.
  * `killSignal` {string|integer} De signaalwaarde die gebruikt moet worden wanneer het verspreide proces zal worden afgesloten. **Standaard:** `'SIGTERM'`.
  * `maxBuffer` {number} Grootste hoeveelheid gegevens in bytes dat is toegestaan op stdout of stderr. Bij overschrijding, wordt het subproces afgesloten. Zie waarschuwing op [`maxBuffer` en Unicode][]. **Standaard:** `200 * 1024`.
  * `encoding` {string} De codering die wordt gebruikt voor alle stdio invoeren en uitvoeren. **Standaard:** `'buffer'`.
  * `windowsHide` {boolean} Verberg het subprocess consolevenster dat normaal zou worden gecreëerd op Windows systemen. **Standaard:** `false`.
  * `shell` {boolean|string} Als het `true` is, draait `command` binnen een shell. Gebruikt `'/bin/sh'` op UNIX, en `process.env.ComSpec` op Windows. Er kan een andere shell worden gespecificeerd als een string. Zie [Shell Requirements](#child_process_shell_requirements) en [Default Windows Shell](#child_process_default_windows_shell). **Standaard:** `false` (geen shell).
* Retourneert: {Buffer|string} De stdout van de opdracht.

De `child_process.execFileSync()` methode is over het algemeen identiek aan [`child_process.execFile()`][] met de uitzondering dat de methode niet zal retourneren totdat het subproces volledig is afgesloten. Wanneer een time-out is opgetreden en `killSignal` is verzonden, zal de methode niet retourneren totdat het proces volledig is afgesloten.

*Note*: If the child process intercepts and handles the `SIGTERM` signal and does not exit, the parent process will still wait until the child process has exited.

If the process times out or has a non-zero exit code, this method ***will*** throw an [`Error`][] that will include the full result of the underlying [`child_process.spawnSync()`][].

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

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

* `command` {string} De te draaien opdracht.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces.
  * `input` {string|Buffer|Uint8Array} De waarde die naar het verspreide proces zal worden doorgegeven als stdin. Het leveren van deze waarde zal `stdio[0]`overschrijven.
  * `stdio` {string|Array} De stdio configuratie van het subproces. `stderr` standaard zal de uitvoer naar het hoofdproces stderr zijn tenzij `stdio` is opgegeven. **Default:** `'pipe'`.
  * `env` {Object} Omgeving belangrijkste paren.
  * `shell` {string} Shell om de opdracht mee uit te voeren. Zie [Shell Requirements](#child_process_shell_requirements) en [Default Windows Shell](#child_process_default_windows_shell). **Default:** `'/bin/sh'` op UNIX, `process.env.ComSpec` op Windows.
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in. (Zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in. (Zie setuid(2)).
  * `timeout` {number} de maximale tijd, in milliseconden, waarin het proces mag draaien. **Standaard:** `undefined`.
  * `killSignal` {string|integer} De signaalwaarde die gebruikt moet worden wanneer het verspreide proces zal worden afgesloten. **Standaard:** `'SIGTERM'`.
  * `maxBuffer` {number} Grootste hoeveelheid gegevens in bytes dat is toegestaan op stdout of stderr. Bij overschrijding, wordt het subproces afgesloten. Zie waarschuwing op [`maxBuffer` en Unicode][]. **Standaard:** `200 * 1024`.
  * `encoding` {string} De codering die wordt gebruikt voor alle stdio invoeren en uitvoeren. **Standaard:** `'buffer'`.
  * `windowsHide` {boolean} Verberg het subprocess consolevenster dat normaal zou worden gecreëerd op Windows systemen. **Standaard:** `false`.
* Retourneert: {Buffer|string} De stdout van de opdracht.

De `child_process.execFileSync()` methode is over het algemeen identiek aan [`child_process.execFile()`][] met de uitzondering dat de methode niet zal retourneren totdat het subproces volledig is afgesloten. Wanneer een time-out is opgetreden en `killSignal` is verzonden, zal de methode niet retourneren totdat het proces volledig is afgesloten. *Let hierbij op dat het subproces het `SIGTERM` signaal onderschept en verwerkt en niet afsluit, zal het hoofdproces nog steeds wachten totdat het subproces is afgesloten.*

Als er binnen het proces een time-out optreedt of geen afsluitcode van nul heeft, ***zal*** deze methode werpen. Het [`Fout`][] object zal het hele resultaat bevatten van [`child_process.spawnSync()`][]

*Note*: Never pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

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

* `command` {string} De te draaien opdracht.
* `args` {Array} List of string arguments.
* `options` {Object}
  * `cwd` {string} Actuele werkfolder van het sub-proces.
  * `input` {string|Buffer|Uint8Array} De waarde die naar het verspreide proces zal worden doorgegeven als stdin. Het leveren van deze waarde zal `stdio[0]`overschrijven.
  * `stdio` {string|Array} De stdio configuratie van het subproces.
  * `env` {Object} Omgeving belangrijkste paren.
  * `uid` {number} Stelt de gebruikersindentiteit van het proces in (zie setuid(2)).
  * `gid` {number} Stelt de groepsidentiteit van het proces in (zie setgid(2)).
  * `timeout` {number} de maximale tijd, in milliseconden, waarin het proces mag draaien. **Standaard:** `undefined`.
  * `killSignal` {string|integer} De signaalwaarde die gebruikt moet worden wanneer het verspreide proces zal worden afgesloten. **Standaard:** `'SIGTERM'`.
  * `maxBuffer` {number} Grootste hoeveelheid gegevens in bytes dat is toegestaan op stdout of stderr. Bij overschrijding, wordt het subproces afgesloten. Zie waarschuwing op [`maxBuffer` en Unicode][]. **Standaard:** `200 * 1024`.
  * `encoding` {string} De codering die wordt gebruikt voor alle stdio invoeren en uitvoeren. **Standaard:** `'buffer'`.
  * `shell` {boolean|string} Als het `true` is, draait `command` binnen een shell. Gebruikt `'/bin/sh'` op UNIX, en `process.env.ComSpec` op Windows. Er kan een andere shell worden gespecificeerd als een string. Zie [Shell Requirements](#child_process_shell_requirements) en [Default Windows Shell](#child_process_default_windows_shell). **Standaard:** `false` (geen shell).
  * `windowsVerbatimArguments` {boolean} Er wordt geen citeren of ontsnappen van argumenten gedaan op Windows. Genegeerd op Unix. Dit wordt automatisch op `true` ingesteld als de `shell` wordt gespecificeerd. **Standaard:** `false`.
  * `windowsHide` {boolean} Verberg het subprocess consolevenster dat normaal zou worden gecreëerd op Windows systemen. **Standaard:** `false`.
* Retourneert: {Object}
  * `pid` {number} Pid van het subproces.
  * `output` {Array} Array van resultaten van stdio uitvoer.
  * `stdout` {Buffer|string} De inhoud van `output[1]`.
  * `stderr` {Buffer|string} De inhoud van `output[2]`.
  * `status` {number} De exit code van het subproces.
  * `signaal` {string} Het signaal dat gebruikt wordt om het subproces af te sluiten.
  * `fout` {Error} Het foutobject als het subproces mislukt of is verlopen.

De `child_process.spawnSync()` methode is over het algemeen identiek aan [`child_process.spawn()`][] met de uitzondering dat de methode niet zal retourneren totdat het subproces volledig is afgesloten. Wanneer een time-out is opgetreden en `killSignal` is verzonden, zal de methode niet retourneren totdat het proces volledig is afgesloten. Let erop dat als het subproces het `SIGTERM` signaal onderschept en verwerkt, en niet afsluit, het bovenliggende proces zal wachten tot het onderliggende proces is afgesloten.

*Note*: If the `shell` option is enabled, do not pass unsanitized user input to this function. Any input containing shell metacharacters may be used to trigger arbitrary command execution.

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

*Note*: The `'exit'` event may or may not fire after an error has occurred. When listening to both the `'exit'` and `'error'` events, it is important to guard against accidentally invoking handler functions multiple times.

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

*Note*: The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

<a name="child_process_child_channel"></a>

### subprocess.channel
<!-- YAML
added: v7.1.0
-->

* {Object} A pipe representing the IPC channel to the child process.

The `subprocess.channel` property is a reference to the child's IPC channel. If no IPC channel currently exists, this property is `undefined`.

<a name="child_process_child_connected"></a>

### subprocess.connected
<!-- YAML
added: v0.7.2
-->

* {boolean} Set to `false` after `subprocess.disconnect()` is called.

The `subprocess.connected` property indicates whether it is still possible to send and receive messages from a child process. When `subprocess.connected` is `false`, it is no longer possible to send or receive messages.

<a name="child_process_child_disconnect"></a>

### subprocess.disconnect()
<!-- YAML
added: v0.7.2
-->

Closes the IPC channel between parent and child, allowing the child to exit gracefully once there are no other connections keeping it alive. After calling this method the `subprocess.connected` and `process.connected` properties in both the parent and child (respectively) will be set to `false`, and it will be no longer possible to pass messages between the processes.

The `'disconnect'` event will be emitted when there are no messages in the process of being received. This will most often be triggered immediately after calling `subprocess.disconnect()`.

Note that when the child process is a Node.js instance (e.g. spawned using [`child_process.fork()`]), the `process.disconnect()` method can be invoked within the child process to close the IPC channel as well.

<a name="child_process_child_kill_signal"></a>

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

<a name="child_process_child_pid"></a>

### subprocess.pid
<!-- YAML
added: v0.1.90
-->

* {number} Integer

Returns the process identifier (PID) of the child process.

Voorbeeld:

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`Spawned child pid: ${grep.pid}`);
grep.stdin.end();
```

<a name="child_process_child_send_message_sendhandle_options_callback"></a>

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
  * `keepOpen` - A Boolean value that can be used when passing instances of `net.Socket`. When `true`, the socket is kept open in the sending process. **Standaard:** `false`.
* `callback` {Function}
* Retourneert: {boolean}

When an IPC channel has been established between the parent and child ( i.e. when using [`child_process.fork()`][]), the `subprocess.send()` method can be used to send messages to the child process. When the child process is a Node.js instance, these messages can be received via the [`process.on('message')`][] event.

*Note*: The message goes through serialization and parsing. The resulting message might not be the same as what is originally sent.

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

There is a special case when sending a `{cmd: 'NODE_foo'}` message. Messages containing a `NODE_` prefix in the `cmd` property are reserved for use within Node.js core and will not be emitted in the child's [`process.on('message')`][] event. Rather, such messages are emitted using the `process.on('internalMessage')` event and are consumed internally by Node.js. Applications should avoid using such messages or listening for `'internalMessage'` events as it is subject to change without notice.

The optional `sendHandle` argument that may be passed to `subprocess.send()` is for passing a TCP server or socket object to the child process. The child will receive the object as the second argument passed to the callback function registered on the [`process.on('message')`][] event. Any data that is received and buffered in the socket will not be sent to the child.

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

*Note*: This function uses [`JSON.stringify()`][] internally to serialize the `message`.

<a name="child_process_child_stderr"></a>

### subprocess.stderr
<!-- YAML
added: v0.1.90
-->

* {stream.Readable}

A `Readable Stream` that represents the child process's `stderr`.

If the child was spawned with `stdio[2]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stderr` is an alias for `subprocess.stdio[2]`. Both properties will refer to the same value.

<a name="child_process_child_stdin"></a>

### subprocess.stdin
<!-- YAML
added: v0.1.90
-->

* {stream.Writable}

A `Writable Stream` that represents the child process's `stdin`.

*Note that if a child process waits to read all of its input, the child will not continue until this stream has been closed via `end()`.*

If the child was spawned with `stdio[0]` set to anything other than `'pipe'`, then this will be `null`.

`subprocess.stdin` is an alias for `subprocess.stdio[0]`. Both properties will refer to the same value.

<a name="child_process_child_stdio"></a>

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

<a name="child_process_child_stdout"></a>

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
