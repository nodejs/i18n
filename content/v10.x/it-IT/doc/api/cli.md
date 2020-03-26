# Opzioni della Command Line

<!--introduced_in=v5.9.1-->
<!--type=misc-->

Node.js viene fornito con una varietà di opzioni CLI. Queste opzioni espongono il debugging (o debug) integrato, diversi modi per eseguire gli script e altre opzioni runtime utili.

Per visualizzare questa documentazione come la pagina di un manuale all'interno di un terminale, esegui `man node`.

## Sinossi

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node inspect [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

Esegui senza argomenti per avviare il [REPL](repl.html).

_For more info about `node inspect`, please see the [debugger](debugger.html) documentation._

## Opzioni
<!-- YAML
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/23020
    description: Underscores instead of dashes are now allowed for
                 Node.js options as well, in addition to V8 options.
-->

All options, including V8 options, allow words to be separated by both dashes (`-`) or underscores (`_`).

For example, `--pending-deprecation` is equivalent to `--pending_deprecation`.

### `-`
<!-- YAML
added: v8.0.0
-->

Alias per stdin, analogo all'uso di - in altre utility della command line, il che significa che lo script verrà letto da stdin e il resto delle opzioni verranno passate a tale script.

### `--`
<!-- YAML
added: v6.11.0
-->

Indica la fine delle opzioni node. Passa gli argomenti restanti allo script. Se prima di questa opzione non viene fornito nessuno script filename od un eval/print script, l'argomento successivo verrà utilizzato come script filename.

### `--abort-on-uncaught-exception`
<!-- YAML
added: v0.10
-->

L'arresto, rispetto alla chiusura, genera un core file per l'analisi post-mortem mediante un debugger (come ad esempio `lldb`, `gdb`, e `mdb`).

If this flag is passed, the behavior can still be set to not abort through [`process.setUncaughtExceptionCaptureCallback()`][] (and through usage of the `domain` module that uses it).

### `--completion-bash`
<!-- YAML
added: v10.12.0
-->

Print source-able bash completion script for Node.js.
```console
$ node --completion-bash > node_bash_completion
$ source node_bash_completion
```

### `--enable-fips`
<!-- YAML
added: v6.0.0
-->

Abilita la crittografia conforme al FIPS all'avvio. (Requires Node.js to be built with `./configure --openssl-fips`.)

### `--experimental-modules`
<!-- YAML
added: v8.5.0
-->

Enable experimental ES module support and caching modules.

### `--experimental-repl-await`
<!-- YAML
added: v10.0.0
-->

Enable experimental top-level `await` keyword support in REPL.

### `--experimental-vm-modules`
<!-- YAML
added: v9.6.0
-->

Enable experimental ES Module support in the `vm` module.

### `--experimental-worker`
<!-- YAML
added: v10.5.0
-->

Enable experimental worker threads using the `worker_threads` module.

### `--force-fips`
<!-- YAML
added: v6.0.0
-->

Forza la crittografia conforme al FIPS all'avvio. (Cannot be disabled from script code.) (Same requirements as `--enable-fips`.)

### `--icu-data-dir=file`
<!-- YAML
added: v0.11.15
-->

Specifica il percorso di caricamento dei dati ICU. (Overrides `NODE_ICU_DATA`.)

### `--inspect-brk[=[host:]port]`
<!-- YAML
added: v7.6.0
-->

Activate inspector on `host:port` and break at start of user script. Default `host:port` is `127.0.0.1:9229`.

### `--inspect-port=[host:]port`
<!-- YAML
added: v7.6.0
-->

Set the `host:port` to be used when the inspector is activated. Utile all'attivazione dell'inspector inviando il segnale `SIGUSR1`.

Default host is `127.0.0.1`.

See the [security warning](#inspector_security) below regarding the `host` parameter usage.

### `--inspect[=[host:]port]`
<!-- YAML
added: v6.3.0
-->

Activate inspector on `host:port`. Default is `127.0.0.1:9229`.

L'integrazione del V8 Inspector consente agli strumenti come Chrome DevTools e gli IDE di eseguire il debug e creare il profilo delle istanze Node.js. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

<a id="inspector_security"></a>

#### Warning: binding inspector to a public IP:port combination is insecure

Binding the inspector to a public IP (including `0.0.0.0`) with an open port is insecure, as it allows external hosts to connect to the inspector and perform a [remote code execution](https://www.owasp.org/index.php/Code_Injection) attack.

If you specify a host, make sure that at least one of the following is true: either the host is not public, or the port is properly firewalled to disallow unwanted connections.

**More specifically, `--inspect=0.0.0.0` is insecure if the port (`9229` by default) is not firewall-protected.**

See the [debugging security implications](https://nodejs.org/en/docs/guides/debugging-getting-started/#security-implications) section for more information.

### `--loader=file`
<!-- YAML
added: v9.0.0
-->

Specify the `file` of the custom [experimental ECMAScript Module](esm.html#esm_loader_hooks) loader.

### `--max-http-header-size=size`
<!-- YAML
added: v10.15.0
-->

Specify the maximum size, in bytes, of HTTP headers. Defaults to 8KB.

### `--napi-modules`
<!-- YAML
added: v7.10.0
-->

This option is a no-op. It is kept for compatibility.

### `--no-deprecation`
<!-- YAML
added: v0.8.0
-->

Silenzia gli avvisi di deprecazione.

### `--no-force-async-hooks-checks`
<!-- YAML
added: v9.0.0
-->

Disables runtime checks for `async_hooks`. These will still be enabled dynamically when `async_hooks` is enabled.

### `--no-warnings`
<!-- YAML
added: v6.0.0
-->

Silenzia tutti gli avvisi di processo (incluse le deprecazioni).

### `--openssl-config=file`
<!-- YAML
added: v6.9.0
-->

Carica un file con configurazione OpenSSL all'avvio. Tra gli altri usi, può essere utilizzato per abilitare la crittografia conforme al FIPS se Node.js è compilato con `./configure --openssl-fips`.

### `--pending-deprecation`
<!-- YAML
added: v8.0.0
-->

Emette gli avvisi di deprecazione in attesa.

Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Le deprecazioni in attesa vengono utilizzate per fornire un tipo di meccanismo selettivo di "avviso rapido" che gli sviluppatori potrebbero sfruttare per rilevare l'utilizzo dell'API deprecata/obsoleta.

### `--preserve-symlinks`
<!-- YAML
added: v6.3.0
-->

Dà istruzioni al module loader di conservare i collegamenti simbolici (symlink) durante la risoluzione ed il caching dei moduli.

Di default, quando Node.js carica un modulo da un percorso che è collegato simbolicamente ad una diversa posizione sul disco, cancellerà il collegamento e utilizzerà l'effettivo "percorso reale" del modulo sul disco sia come identifier che come percorso root per individuare altri moduli delle dipendenze. Nella maggior parte dei casi, questo comportamento predefinito è accettabile. Tuttavia, quando si utilizzano dipendenze peer collegate simbolicamente, come illustrato nell'esempio seguente, il comportamento predefinito causa l'avvio di un'exception se `moduleA` tenta di richiedere `moduleB` come una dipendenza peer:

```text
{appDir}
 ├── app
 │   ├── index.js
 │   └── node_modules
 │       ├── moduleA -> {appDir}/moduleA
 │       └── moduleB
 │           ├── index.js
 │           └── package.json
 └── moduleA
     ├── index.js
     └── package.json
```

Il flag `--preserve-symlinks` della command line indica a Node.js di utilizzare per i moduli, al posto del percorso reale (real path), il percorso del collegamento simbolico (symlink path), permettendo di trovare le dipendenze peer collegate simbolicamente.

Da notare, tuttavia, che l'utilizzo di `--preserve-symlinks` può avere altri effetti collaterali. In particolare, i moduli *nativi* collegati simbolicamente non si caricano se collegati da più di una posizione nel dependency tree (Node.js li vedrebbe come due moduli separati e tenterebbe di caricare il modulo più volte, causando l'avvio di un'exception).

The `--preserve-symlinks` flag does not apply to the main module, which allows `node --preserve-symlinks node_module/.bin/<foo>` to work.  To apply the same behavior for the main module, also use `--preserve-symlinks-main`.

### `--preserve-symlinks-main`
<!-- YAML
added: v10.2.0
-->

Instructs the module loader to preserve symbolic links when resolving and caching the main module (`require.main`).

This flag exists so that the main module can be opted-in to the same behavior that `--preserve-symlinks` gives to all other imports; they are separate flags, however, for backward compatibility with older Node.js versions.

Note that `--preserve-symlinks-main` does not imply `--preserve-symlinks`; it is expected that `--preserve-symlinks-main` will be used in addition to `--preserve-symlinks` when it is not desirable to follow symlinks before resolving relative paths.

See `--preserve-symlinks` for more information.

### `--prof`
<!-- YAML
added: v2.0.0
-->

Generate V8 profiler output.

### `--prof-process`
<!-- YAML
added: v5.2.0
-->

Elaborazione dell'output del profiler di V8 generato utilizzando l'opzione `--prof` di V8.

### `--redirect-warnings=file`
<!-- YAML
added: v8.0.0
-->

Scrive gli avvisi di processo sul file specificato invece di stamparli sullo stderr. Se il file non esiste verrà creato, invece se esiste verrà aggiunto. Se si verifica un errore durante il tentativo di scrittura dell'avviso sul file, questo verrà scritto sullo stderr.

### `--throw-deprecation`
<!-- YAML
added: v0.11.14
-->

Genera gli errori per le deprecazioni.

### `--title=title`
<!-- YAML
added: v10.7.0
-->

Set `process.title` on startup.

### `--tls-cipher-list=list`
<!-- YAML
added: v4.0.0
-->

Specifica un elenco crittografico TLS predefinito alternativo. Requires Node.js to be built with crypto support (default).

### `--trace-deprecation`
<!-- YAML
added: v0.8.0
-->

Stampa le stack trace per le deprecazioni.

### `--trace-event-categories`
<!-- YAML
added: v7.7.0
-->

Un elenco, separato da virgole, di categorie che devono essere tracciate quando viene abilitato il tracciamento del trace event utilizzando `--trace-events-enabled`.

### `--trace-event-file-pattern`
<!-- YAML
added: v9.8.0
-->

Stringa di template che specifica il percorso del file per i dati del trace event, supporta `${rotation}` e `${pid}`.

### `--trace-events-enabled`
<!-- YAML
added: v7.7.0
-->

Abilita la raccolta delle informazioni di tracciamento del trace event.

### `--trace-sync-io`
<!-- YAML
added: v2.1.0
-->

Stampa una stack trace ogni volta che viene rilevato un I/O sincrono dopo il primo turno dell'event loop.

### `--trace-warnings`
<!-- YAML
added: v6.0.0
-->

Stampa le stack trace per gli avvisi di processo (incluse le deprecazioni).

### `--track-heap-objects`
<!-- YAML
added: v2.4.0
-->

Traccia le allocazioni degli heap object per gli heap snapshot.

### `--use-bundled-ca`, `--use-openssl-ca`
<!-- YAML
added: v6.11.0
-->

Use bundled Mozilla CA store as supplied by current Node.js version or use OpenSSL's default CA store. The default store is selectable at build-time.

Il CA store in bundle, fornito da Node.js, è uno snapshot del Mozilla CA store che viene corretto al momento del rilascio. È identico su tutte le piattaforme supportate.

L'utilizzo dell'OpenSSL store consente modifiche esterne dello store stesso. Per la maggior parte delle distribuzioni Linux e BSD, questo store è gestito dai responsabili della distribuzione e dagli amministratori del sistema. La posizione dell'OpenSSL CA store dipende dalla configurazione della libreria OpenSSL, ma può essere modificata in fase di esecuzione utilizzando le variabili di ambiente.

Vedi `SSL_CERT_DIR` e `SSL_CERT_FILE`.

### `--v8-options`
<!-- YAML
added: v0.1.3
-->

Stampa le opzioni della command line di V8.

### `--v8-pool-size=num`
<!-- YAML
added: v5.10.0
-->

Set V8's thread pool size which will be used to allocate background jobs.

If set to `0` then V8 will choose an appropriate size of the thread pool based on the number of online processors.

If the value provided is larger than V8's maximum, then the largest value will be chosen.

### `--zero-fill-buffers`
<!-- YAML
added: v6.0.0
-->

Automatically zero-fills all newly allocated [`Buffer`][] and [`SlowBuffer`][] instances.

### `-c`, `--check`
<!-- YAML
added:
  - v5.0.0
  - v4.2.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19600
    description: The `--require` option is now supported when checking a file.
-->

La sintassi controlla lo script senza eseguirlo.

### `-e`, `--eval "script"`
<!-- YAML
added: v0.5.2
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Valuta il seguente argomento come JavaScript. I moduli che sono predefiniti nel REPL possono essere utilizzati anche in `script`.

On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.

### `-h`, `--help`
<!-- YAML
added: v0.1.3
-->

Stampa le opzioni della command line del node. L'output di questa opzione è meno dettagliato di questo documento.

### `-i`, `--interactive`
<!-- YAML
added: v0.7.7
-->

Apre il REPL anche se stdin non sembra essere un terminale.

### `-p`, `--print "script"`
<!-- YAML
added: v0.6.4
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Identico a `-e` ma stampa il risultato.

### `-r`, `--require module`
<!-- YAML
added: v1.6.0
-->

Pre-carica il modulo specificato all'avvio.

Seguono le regole di risoluzione del modulo di `require()`. `module` potrebbe essere il percorso per un file oppure il nome un node module.

### `-v`, `--version`
<!-- YAML
added: v0.1.3
-->

Stampa la versione del node.

## Variabili di Ambiente

### `NODE_DEBUG=module[,…]`
<!-- YAML
added: v0.1.32
-->

Elenco, separato da `','`, dei core module che dovrebbero stampare le informazioni di debug.

### `NODE_DEBUG_NATIVE=module[,…]`

`','`-separated list of core C++ modules that should print debug information.

### `NODE_DISABLE_COLORS=1`
<!-- YAML
added: v0.3.0
-->

Se impostato su `1`, non verranno utilizzati i colori nel REPL.

### `NODE_EXTRA_CA_CERTS=file`
<!-- YAML
added: v7.3.0
-->

Quando è impostato, i ben noti "root" CA (come VeriSign) verranno estesi con i certificati aggiuntivi all'interno di `file`. Il file deve essere composto da uno o più certificati attendibili in formato PEM. Verrà emesso (una volta) un messaggio con [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor) se il file è assente o deformato, ma a parte ciò eventuali errori verranno ignorati.

Da notare che né i certificati conosciuti né i certificati aggiuntivi vengono utilizzati quando la proprietà `ca` delle opzioni viene specificata esplicitamente per un client o un server TLS o HTTPS.

This environment variable is ignored when `node` runs as setuid root or has Linux file capabilities set.

### `NODE_ICU_DATA=file`
<!-- YAML
added: v0.11.15
-->

Data path for ICU (`Intl` object) data. Estenderà i dati collegati quando saranno compilati con il supporto small-icu.

### `NODE_NO_WARNINGS=1`
<!-- YAML
added: v6.11.0
-->

Se impostato su `1`, gli avvisi di processo vengono silenziati.

### `NODE_OPTIONS=options...`
<!-- YAML
added: v8.0.0
-->

Un elenco, separato da spazi, delle opzioni della command line. Le `options...` sono interpretate come se fossero state specificate sulla command line prima dell'attuale command line (così da essere sovrascritte). Node.js will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

Node.js options that are allowed are:
- `--enable-fips`
- `--experimental-modules`
- `--experimental-repl-await`
- `--experimental-vm-modules`
- `--experimental-worker`
- `--force-fips`
- `--icu-data-dir`
- `--inspect`
- `--inspect-brk`
- `--inspect-port`
- `--loader`
- `--max-http-header-size`
- `--napi-modules`
- `--no-deprecation`
- `--no-force-async-hooks-checks`
- `--no-warnings`
- `--openssl-config`
- `--pending-deprecation`
- `--redirect-warnings`
- `--require`, `-r`
- `--throw-deprecation`
- `--title`
- `--tls-cipher-list`
- `--trace-deprecation`
- `--trace-event-categories`
- `--trace-event-file-pattern`
- `--trace-events-enabled`
- `--trace-sync-io`
- `--trace-warnings`
- `--track-heap-objects`
- `--use-bundled-ca`
- `--use-openssl-ca`
- `--v8-pool-size`
- `--zero-fill-buffers`

Le opzioni di V8 consentite sono:
- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PATH=path[:…]`
<!-- YAML
added: v0.1.32
-->

Elenco, separato da `':'`, di directory precedute dal percorso di ricerca del modulo.

On Windows, this is a `';'`-separated list instead.

### `NODE_PENDING_DEPRECATION=1`
<!-- YAML
added: v8.0.0
-->

Se impostato su `1`, emette gli avvisi di deprecazione in attesa.

Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Le deprecazioni in attesa vengono utilizzate per fornire un tipo di meccanismo selettivo di "avviso rapido" che gli sviluppatori potrebbero sfruttare per rilevare l'utilizzo dell'API deprecata/obsoleta.

### `NODE_PRESERVE_SYMLINKS=1`
<!-- YAML
added: v7.1.0
-->

Se impostato su `1`, dà istruzioni al module loader di conservare i collegamenti simbolici (symlink) durante la risoluzione ed il caching dei moduli.

### `NODE_REDIRECT_WARNINGS=file`
<!-- YAML
added: v8.0.0
-->

Se impostato, gli avvisi di processo verranno emessi sul file specificato invece di essere stampati sullo stderr. Se il file non esiste verrà creato, invece se esiste verrà aggiunto. Se si verifica un errore durante il tentativo di scrittura dell'avviso sul file, questo verrà scritto sullo stderr. È equivalente all'utilizzo del flag `--redirect-warnings=file` della command line.

### `NODE_REPL_HISTORY=file`
<!-- YAML
added: v3.0.0
-->

Percorso del file utilizzato per memorizzare la cronologia REPL persistente. Il percorso predefinito è `~/.node_repl_history`, che viene sovrascritto da questa variabile. L'impostazione del valore su una stringa vuota (`''` oppure `' '`) disabilita la cronologia REPL persistente.

### `NODE_TLS_REJECT_UNAUTHORIZED=value`

If `value` equals `'0'`, certificate validation is disabled for TLS connections. This makes TLS, and HTTPS by extension, insecure. The use of this environment variable is strongly discouraged.

### `NODE_V8_COVERAGE=dir`

When set, Node.js will begin outputting [V8 JavaScript code coverage](https://v8project.blogspot.com/2017/12/javascript-code-coverage.html) to the directory provided as an argument. Coverage is output as an array of [ScriptCoverage](https://chromedevtools.github.io/devtools-protocol/tot/Profiler#type-ScriptCoverage) objects:

```json
{
  "result": [
    {
      "scriptId": "67",
      "url": "internal/tty.js",
      "functions": []
    }
  ]
}
```

`NODE_V8_COVERAGE` will automatically propagate to subprocesses, making it easier to instrument applications that call the `child_process.spawn()` family of functions. `NODE_V8_COVERAGE` can be set to an empty string, to prevent propagation.

At this time coverage is only collected in the main thread and will not be output for code executed by worker threads.

### `OPENSSL_CONF=file`
<!-- YAML
added: v6.11.0
-->

Carica un file con configurazione OpenSSL all'avvio. Tra gli altri usi, può essere utilizzato per abilitare la crittografia conforme al FIPS se Node.js è compilato con `./configure
--openssl-fips`.

Se viene utilizzata l'opzione [`--openssl-config`][] della command line, la variabile di ambiente viene ignorata.

### `SSL_CERT_DIR=dir`
<!-- YAML
added: v7.7.0
-->

Se viene abilitato `--use-openssl-ca`, questo sovrascrive e imposta la directory di OpenSSL contenente i certificati attendibili.

Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=file`
<!-- YAML
added: v7.7.0
-->

Se viene abilitato `--use-openssl-ca`, questo sovrascrive e imposta il file di OpenSSL contenente certificati attendibili.

Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `UV_THREADPOOL_SIZE=size`

Imposta il numero di thread utilizzati nel threadpool di libuv per impostare il `size` dei thread.

Le API di sistema asincrone vengono utilizzate da Node.js ogni qual volta è possibile, ma lì dove non esistono viene utilizzato il threadpool di libuv per creare delle API di node asincrone basate sulle API di sistema sincrone. Le API di Node.js che utilizzano il threadpool sono:

- tutte le API `fs`, diverse dalle API file watcher e dalle API che sono esplicitamente sincrone
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, a meno che non venga utilizzato senza un callback
- `crypto.randomFill()`
- `dns.lookup()`
- tutte le API `zlib`, diverse dalle API che sono esplicitamente sincrone

Poiché il threadpool di libuv ha una dimensione fissa, ciò significa che se per qualsiasi ragione una di queste API occupa più tempo del previsto, le altre API (apparentemente non correlate) che vengono eseguite nel threadpool di libuv avranno prestazioni ridotte. Al fine di attenuare questo problema, una possibile soluzione sarebbe aumentare la dimensione del threadpool di libuv impostando la variabile di ambiente `'UV_THREADPOOL_SIZE'` su un valore maggiore di `4` (che è l'attuale valore predefinito). Per maggiori informazioni, vedi la [documentazione del threadpool di libuv](http://docs.libuv.org/en/latest/threadpool.html).
