# Opzioni della Command Line

<!--introduced_in=v5.9.1-->

<!--type=misc-->

Node.js viene fornito con una varietà di opzioni CLI. Queste opzioni espongono il debugging (o debug) integrato, diversi modi per eseguire gli script e altre opzioni runtime utili.

Per visualizzare questa documentazione come la pagina di un manuale all'interno di un terminale, esegui `man node`.

## Sinossi

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

Esegui senza argomenti per avviare il [REPL](repl.html).

*Per maggiori informazioni su `node debug`, vedi la documentazione sul [debugger](debugger.html).*

## Opzioni

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

Se viene passato questo flag, si può ancora impostare il comportamento in modo da non eseguire l'arresto tramite [`process.setUncaughtExceptionCaptureCallback()`][] (e attraverso l'uso del modulo `domain` che lo utilizza).

### `--enable-fips`

<!-- YAML
added: v6.0.0
-->

Abilita la crittografia conforme al FIPS all'avvio. (Richiede che Node.js sia compilato con `./configure --openssl-fips`.)

### `--experimental-modules`

<!-- YAML
added: v8.5.0
-->

Abilita i moduli di supporto e di caching del modulo ES sperimentale.

### `--experimental-repl-await`

<!-- YAML
added: v10.0.0
-->

Abilita il supporto della parola chiave sperimentale top-level `await` all'interno del REPL.

### `--experimental-vm-modules`

<!-- YAML
added: v9.6.0
-->

Abilita il supporto del modulo ES sperimentale nel modulo `vm`.

### `--force-fips`

<!-- YAML
added: v6.0.0
-->

Forza la crittografia conforme al FIPS all'avvio. (Non può essere disabilitato dallo script code.) (Stessi requisiti di `--enable-fips`.)

### `--icu-data-dir=file`

<!-- YAML
added: v0.11.15
-->

Specifica il percorso di caricamento dei dati ICU. (`NODE_ICU_DATA` viene sottoposto all'override.)

### `--inspect-brk[=[host:]port]`

<!-- YAML
added: v7.6.0
-->

Attiva l'inspector su `host:port` e si interrompe all'inizio dello user script. `host:port` predefinito è `127.0.0.1:9229`.

### `--inspect-port=[host:]port`

<!-- YAML
added: v7.6.0
-->

Imposta l'`host:port` da utilizzare quando viene attivato l'inspector. Utile all'attivazione dell'inspector inviando il segnale `SIGUSR1`.

L'host predefinito è `127.0.0.1`.

### `--inspect[=[host:]port]`

<!-- YAML
added: v6.3.0
-->

Attiva l'inspector su `host:port`. L'impostazione predefinita è `127.0.0.1:9229`.

L'integrazione del V8 Inspector consente agli strumenti come Chrome DevTools e gli IDE di eseguire il debug e creare il profilo delle istanze Node.js. Gli strumenti si collegano alle istanze Node.js tramite una porta tcp e comunicano tramite il [Protocollo Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/).

### `--napi-modules`

<!-- YAML
added: v7.10.0
-->

Quest'opzione è un no-op (no operation). È mantenuta per la compatibilità.

### `--no-deprecation`

<!-- YAML
added: v0.8.0
-->

Silenzia gli avvisi di deprecazione.

### `--no-force-async-hooks-checks`

<!-- YAML
added: v9.0.0
-->

Disabilita i controlli runtime per `async_hooks`. Questi saranno comunque abilitati dinamicamente quando verrà abilitato `async_hooks`.

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

Le deprecazioni in attesa sono generalmente identiche alle deprecazioni in fase di esecuzione con l'eccezione notevole che sono *disattivate* di default e non verranno emesse a meno che non venga impostato il flag `--pending-deprecation` della command line o la variabile di ambiente `NODE_PENDING_DEPRECATION=1`. Le deprecazioni in attesa vengono utilizzate per fornire un tipo di meccanismo selettivo di "avviso rapido" che gli sviluppatori potrebbero sfruttare per rilevare l'utilizzo dell'API deprecata/obsoleta.

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

### `--tls-cipher-list=list`

<!-- YAML
added: v4.0.0
-->

Specifica un elenco crittografico TLS predefinito alternativo. Necessita che Node.js sia costruito con supporto crittografico (predefinito).

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

Utilizza il Mozilla CA store in bundle fornito dalla versione attuale di Node.js oppure il CA store predefinito di OpenSSL. Lo store predefinito è selezionabile in fase di build.

Il CA store in bundle, fornito da Node.js, è uno snapshot del Mozilla CA store che viene corretto al momento del rilascio. È identico su tutte le piattaforme supportate.

L'utilizzo dell'OpenSSL store consente modifiche esterne dello store stesso. Per la maggior parte delle distribuzioni Linux e BSD, questo store è gestito dai responsabili della distribuzione e dagli amministratori del sistema. La posizione dell'OpenSSL CA store dipende dalla configurazione della libreria OpenSSL, ma può essere modificata in fase di esecuzione utilizzando le variabili di ambiente.

Vedi `SSL_CERT_DIR` e `SSL_CERT_FILE`.

### `--v8-options`

<!-- YAML
added: v0.1.3
-->

Stampa le opzioni della command line di V8.

Le opzioni di V8 consentono alle parole di essere separate sia dai trattini (`-`) che dai trattini bassi (`_`).

Ad esempio, `--stack-trace-limit` equivale a `--stack_trace_limit`.

### `--v8-pool-size=num`

<!-- YAML
added: v5.10.0
-->

Imposta la dimensione del thread pool di V8 che verrà utilizzata per allocare i processi in background.

Se impostata su `0` allora V8 sceglierà una dimensione appropriata del thread pool in base al numero di processori online.

Se il valore fornito è maggiore del valore massimo di V8, allora verrà scelto il valore più grande.

### `--zero-fill-buffers`

<!-- YAML
added: v6.0.0
-->

Azzera automaticamente tutte le istanze [`Buffer`][] e [`SlowBuffer`][] appena allocate.

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

Evaluate the following argument as JavaScript. The modules which are predefined in the REPL can also be used in `script`.

On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.

### `-h`, `--help`

<!-- YAML
added: v0.1.3
-->

Print node command line options. The output of this option is less detailed than this document.

### `-i`, `--interactive`

<!-- YAML
added: v0.7.7
-->

Opens the REPL even if stdin does not appear to be a terminal.

### `-p`, `--print "script"`

<!-- YAML
added: v0.6.4
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Identical to `-e` but prints the result.

### `-r`, `--require module`

<!-- YAML
added: v1.6.0
-->

Preload the specified module at startup.

Follows `require()`'s module resolution rules. `module` may be either a path to a file, or a node module name.

### `-v`, `--version`

<!-- YAML
added: v0.1.3
-->

Print node's version.

## Environment Variables

### `NODE_DEBUG=module[,…]`

<!-- YAML
added: v0.1.32
-->

`','`-separated list of core modules that should print debug information.

### `NODE_DISABLE_COLORS=1`

<!-- YAML
added: v0.3.0
-->

When set to `1` colors will not be used in the REPL.

### `NODE_EXTRA_CA_CERTS=file`

<!-- YAML
added: v7.3.0
-->

When set, the well known "root" CAs (like VeriSign) will be extended with the extra certificates in `file`. The file should consist of one or more trusted certificates in PEM format. A message will be emitted (once) with [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor) if the file is missing or malformed, but any errors are otherwise ignored.

Note that neither the well known nor extra certificates are used when the `ca` options property is explicitly specified for a TLS or HTTPS client or server.

### `NODE_ICU_DATA=file`

<!-- YAML
added: v0.11.15
-->

Data path for ICU (`Intl` object) data. Will extend linked-in data when compiled with small-icu support.

### `NODE_NO_WARNINGS=1`

<!-- YAML
added: v6.11.0
-->

When set to `1`, process warnings are silenced.

### `NODE_OPTIONS=options...`

<!-- YAML
added: v8.0.0
-->

A space-separated list of command line options. `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node.js will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

Node options that are allowed are:

- `--enable-fips`
- `--force-fips`
- `--icu-data-dir`
- `--inspect-brk`
- `--inspect-port`
- `--inspect`
- `--no-deprecation`
- `--no-warnings`
- `--openssl-config`
- `--redirect-warnings`
- `--require`, `-r`
- `--throw-deprecation`
- `--tls-cipher-list`
- `--trace-deprecation`
- `--trace-events-categories`
- `--trace-events-enabled`
- `--trace-event-file-pattern`
- `--trace-sync-io`
- `--trace-warnings`
- `--track-heap-objects`
- `--use-bundled-ca`
- `--use-openssl-ca`
- `--v8-pool-size`
- `--zero-fill-buffers`

V8 options that are allowed are:

- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PATH=path[:…]`

<!-- YAML
added: v0.1.32
-->

`':'`-separated list of directories prefixed to the module search path.

On Windows, this is a `';'`-separated list instead.

### `NODE_PENDING_DEPRECATION=1`

<!-- YAML
added: v8.0.0
-->

When set to `1`, emit pending deprecation warnings.

Le deprecazioni in attesa sono generalmente identiche alle deprecazioni in fase di esecuzione con l'eccezione notevole che sono *disattivate* di default e non verranno emesse a meno che non venga impostato il flag `--pending-deprecation` della command line o la variabile di ambiente `NODE_PENDING_DEPRECATION=1`. Le deprecazioni in attesa vengono utilizzate per fornire un tipo di meccanismo selettivo di "avviso rapido" che gli sviluppatori potrebbero sfruttare per rilevare l'utilizzo dell'API deprecata/obsoleta.

### `NODE_PRESERVE_SYMLINKS=1`

<!-- YAML
added: v7.1.0
-->

When set to `1`, instructs the module loader to preserve symbolic links when resolving and caching modules.

### `NODE_REDIRECT_WARNINGS=file`

<!-- YAML
added: v8.0.0
-->

When set, process warnings will be emitted to the given file instead of printing to stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead. This is equivalent to using the `--redirect-warnings=file` command-line flag.

### `NODE_REPL_HISTORY=file`

<!-- YAML
added: v3.0.0
-->

Path to the file used to store the persistent REPL history. The default path is `~/.node_repl_history`, which is overridden by this variable. Setting the value to an empty string (`''` or `' '`) disables persistent REPL history.

### `OPENSSL_CONF=file`

<!-- YAML
added: v6.11.0
-->

Load an OpenSSL configuration file on startup. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
--openssl-fips`.

If the [`--openssl-config`][] command line option is used, the environment variable is ignored.

### `SSL_CERT_DIR=dir`

<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's directory containing trusted certificates.

Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=file`

<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's file containing trusted certificates.

Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `UV_THREADPOOL_SIZE=size`

Set the number of threads used in libuv's threadpool to `size` threads.

Asynchronous system APIs are used by Node.js whenever possible, but where they do not exist, libuv's threadpool is used to create asynchronous node APIs based on synchronous system APIs. Node.js APIs that use the threadpool are:

- all `fs` APIs, other than the file watcher APIs and those that are explicitly synchronous
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, unless it is used without a callback
- `crypto.randomFill()`
- `dns.lookup()`
- all `zlib` APIs, other than those that are explicitly synchronous

Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value greater than `4` (its current default value). For more information, see the [libuv threadpool documentation](http://docs.libuv.org/en/latest/threadpool.html).