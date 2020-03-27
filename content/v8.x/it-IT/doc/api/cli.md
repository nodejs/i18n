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

_Per maggiori informazioni su `node debug`, vedi la documentazione sul [debugger](debugger.html)._


## Opzioni

### `-v`, `--version`
<!-- YAML
added: v0.1.3
-->

Stampa la versione del node.


### `-h`, `--help`
<!-- YAML
added: v0.1.3
-->

Stampa le opzioni della command line del node. L'output di questa opzione è meno dettagliato di questo documento.


### `-e`, `--eval "script"`
<!-- YAML
added: v0.5.2
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Valuta il seguente argomento come JavaScript. I moduli che sono predefiniti nel REPL possono essere utilizzati anche in `script`.

*Note*: On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.


### `-p`, `--print "script"`
<!-- YAML
added: v0.6.4
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Identico a `-e` ma stampa il risultato.


### `-c`, `--check`
<!-- YAML
added:
  - v5.0.0
  - v4.2.0
-->

La sintassi controlla lo script senza eseguirlo.


### `-i`, `--interactive`
<!-- YAML
added: v0.7.7
-->

Apre il REPL anche se stdin non sembra essere un terminale.


### `-r`, `--require module`
<!-- YAML
added: v1.6.0
-->

Pre-carica il modulo specificato all'avvio.

Seguono le regole di risoluzione del modulo di `require()`. `module` potrebbe essere il percorso per un file oppure il nome un node module.


### `--inspect[=[host:]port]`
<!-- YAML
added: v6.3.0
-->

Attiva l'inspector su host:port. L'impostazione predefinita è 127.0.0.1:9229.

L'integrazione del V8 Inspector consente agli strumenti come Chrome DevTools e gli IDE di eseguire il debug e creare il profilo delle istanze Node.js. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer).


### `--inspect-brk[=[host:]port]`
<!-- YAML
added: v7.6.0
-->

Attiva l'inspector su host:port e si interrompe all'inizio dello user script. host:port predefinito è 127.0.0.1:9229.


### `--inspect-port=[host:]port`
<!-- YAML
added: v7.6.0
-->

Imposta l'host:port da utilizzare quando viene attivato l'inspector. Utile all'attivazione dell'inspector inviando il segnale `SIGUSR1`.

L'host predefinito è 127.0.0.1.


### `--no-deprecation`
<!-- YAML
added: v0.8.0
-->

Silenzia gli avvisi di deprecazione.


### `--trace-deprecation`
<!-- YAML
added: v0.8.0
-->

Stampa le stack trace per le deprecazioni.


### `--throw-deprecation`
<!-- YAML
added: v0.11.14
-->

Genera gli errori per le deprecazioni.

### `--pending-deprecation`
<!-- YAML
added: v8.0.0
-->

Emette gli avvisi di deprecazione in attesa.

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Le deprecazioni in attesa vengono utilizzate per fornire un tipo di meccanismo selettivo di "avviso rapido" che gli sviluppatori potrebbero sfruttare per rilevare l'utilizzo dell'API deprecata/obsoleta.

### `--no-warnings`
<!-- YAML
added: v6.0.0
-->

Silenzia tutti gli avvisi di processo (incluse le deprecazioni).

### `--expose-http2`
<!-- YAML
added: v8.4.0
-->

Enable the experimental `'http2'` module.

### `--abort-on-uncaught-exception`
<!-- YAML
added: v0.10
-->

L'arresto, rispetto alla chiusura, genera un core file per l'analisi post-mortem mediante un debugger (come ad esempio `lldb`, `gdb`, e `mdb`).

### `--trace-warnings`
<!-- YAML
added: v6.0.0
-->

Stampa le stack trace per gli avvisi di processo (incluse le deprecazioni).

### `--redirect-warnings=file`
<!-- YAML
added: v8.0.0
-->

Scrive gli avvisi di processo sul file specificato invece di stamparli sullo stderr. Se il file non esiste verrà creato, invece se esiste verrà aggiunto. Se si verifica un errore durante il tentativo di scrittura dell'avviso sul file, questo verrà scritto sullo stderr.

### `--trace-sync-io`
<!-- YAML
added: v2.1.0
-->

Stampa una stack trace ogni volta che viene rilevato un I/O sincrono dopo il primo turno dell'event loop.

### `--force-async-hooks-checks`
<!-- YAML
added: v8.8.0
-->

Enables runtime checks for `async_hooks`. These can also be enabled dynamically by enabling one of the `async_hooks` hooks.

### `--trace-events-enabled`
<!-- YAML
added: v7.7.0
-->

Abilita la raccolta delle informazioni di tracciamento del trace event.

### `--trace-event-categories`
<!-- YAML
added: v7.7.0
-->

Un elenco, separato da virgole, di categorie che devono essere tracciate quando viene abilitato il tracciamento del trace event utilizzando `--trace-events-enabled`.

### `--trace-event-file-pattern`
<!-- YAML
added: v8.12.0
-->

Stringa di template che specifica il percorso del file per i dati del trace event, supporta `${rotation}` e `${pid}`.

### `--zero-fill-buffers`
<!-- YAML
added: v6.0.0
-->

Automatically zero-fills all newly allocated [Buffer](buffer.html#buffer_buffer) and [SlowBuffer](buffer.html#buffer_class_slowbuffer) instances.


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

### `--track-heap-objects`
<!-- YAML
added: v2.4.0
-->

Traccia le allocazioni degli heap object per gli heap snapshot.


### `--prof-process`
<!-- YAML
added: v5.2.0
-->

Elaborazione dell'output del profiler di V8 generato utilizzando l'opzione `--prof` di V8.


### `--v8-options`
<!-- YAML
added: v0.1.3
-->

Stampa le opzioni della command line di V8.

*Note*: V8 options allow words to be separated by both dashes (`-`) or underscores (`_`).

Ad esempio, `--stack-trace-limit` equivale a `--stack_trace_limit`.

### `--tls-cipher-list=list`
<!-- YAML
added: v4.0.0
-->

Specifica un elenco crittografico TLS predefinito alternativo. (Requires Node.js to be built with crypto support. (Default))


### `--enable-fips`
<!-- YAML
added: v6.0.0
-->

Abilita la crittografia conforme al FIPS all'avvio. (Richiede che Node.js sia compilato con `./configure --openssl-fips`)


### `--force-fips`
<!-- YAML
added: v6.0.0
-->

Forza la crittografia conforme al FIPS all'avvio. (Non può essere disabilitato dallo script code.) (Stessi requisiti di `--enable-fips`)


### `--openssl-config=file`
<!-- YAML
added: v6.9.0
-->

Carica un file con configurazione OpenSSL all'avvio. Tra gli altri usi, può essere utilizzato per abilitare la crittografia conforme al FIPS se Node.js è compilato con `./configure --openssl-fips`.

### `--use-openssl-ca`, `--use-bundled-ca`
<!-- YAML
added: v7.5.0
-->

Use OpenSSL's default CA store or use bundled Mozilla CA store as supplied by current Node.js version. The default store is selectable at build-time.

L'utilizzo dell'OpenSSL store consente modifiche esterne dello store stesso. Per la maggior parte delle distribuzioni Linux e BSD, questo store è gestito dai responsabili della distribuzione e dagli amministratori del sistema. La posizione dell'OpenSSL CA store dipende dalla configurazione della libreria OpenSSL, ma può essere modificata in fase di esecuzione utilizzando le variabili di ambiente.

Il CA store in bundle, fornito da Node.js, è uno snapshot del Mozilla CA store che viene corretto al momento del rilascio. È identico su tutte le piattaforme supportate.

Vedi `SSL_CERT_DIR` e `SSL_CERT_FILE`.

### `--icu-data-dir=file`
<!-- YAML
added: v0.11.15
-->

Specifica il percorso di caricamento dei dati ICU. (`nODE_ICU_DATA` viene sottoposto all'override)


### `-`
<!-- YAML
added: v8.0.0
-->

Alias per stdin, analogo all'uso di - in altre utility della command line, il che significa che lo script verrà letto da stdin e il resto delle opzioni verranno passate a tale script.


### `--`
<!-- YAML
added: v7.5.0
-->

Indica la fine delle opzioni node. Passa gli argomenti restanti allo script. Se prima di questa opzione non viene fornito nessuno script filename od un eval/print script, l'argomento successivo verrà utilizzato come script filename.

### `--max-http-header-size=size`
<!-- YAML
added: v8.15.0
-->

Specify the maximum size, in bytes, of HTTP headers. Defaults to 8KB.

## Variabili di Ambiente

### `NODE_DEBUG=module[,…]`
<!-- YAML
added: v0.1.32
-->

Elenco, separato da `','`, dei core module che dovrebbero stampare le informazioni di debug.


### `NODE_PATH=path[:…]`
<!-- YAML
added: v0.1.32
-->

Elenco, separato da `':'`, di directory precedute dal percorso di ricerca del modulo.

*Note*: On Windows, this is a `';'`-separated list instead.


### `NODE_DISABLE_COLORS=1`
<!-- YAML
added: v0.3.0
-->

Se impostato su `1`, non verranno utilizzati i colori nel REPL.


### `NODE_ICU_DATA=file`
<!-- YAML
added: v0.11.15
-->

Percorso dati per i dati ICU (Intl object). Estenderà i dati collegati quando saranno compilati con il supporto small-icu.

### `NODE_NO_WARNINGS=1`
<!-- YAML
added: v7.5.0
-->

Se impostato su `1`, gli avvisi di processo vengono silenziati.

### `NODE_NO_HTTP2=1`
<!-- YAML
added: v8.8.0
-->

When set to `1`, the `http2` module is suppressed.

### `NODE_OPTIONS=options...`
<!-- YAML
added: v8.0.0
-->

Un elenco, separato da spazi, delle opzioni della command line. Le `options...` sono interpretate come se fossero state specificate sulla command line prima dell'attuale command line (così da essere sovrascritte). Node will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

Node.js options that are allowed are:
- `--enable-fips`
- `--force-fips`
- `--icu-data-dir`
- `--inspect-brk`
- `--inspect-port`
- `--inspect`
- `--max-http-header-size`
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

Le opzioni di V8 consentite sono:
- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PENDING_DEPRECATION=1`
<!-- YAML
added: v8.0.0
-->

Se impostato su `1`, emette gli avvisi di deprecazione in attesa.

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Le deprecazioni in attesa vengono utilizzate per fornire un tipo di meccanismo selettivo di "avviso rapido" che gli sviluppatori potrebbero sfruttare per rilevare l'utilizzo dell'API deprecata/obsoleta.

### `NODE_PRESERVE_SYMLINKS=1`
<!-- YAML
added: v7.1.0
-->

Se impostato su `1`, dà istruzioni al module loader di conservare i collegamenti simbolici (symlink) durante la risoluzione ed il caching dei moduli.

### `NODE_REPL_HISTORY=file`
<!-- YAML
added: v3.0.0
-->

Percorso del file utilizzato per memorizzare la cronologia REPL persistente. Il percorso predefinito è `~/.node_repl_history`, che viene sovrascritto da questa variabile. L'impostazione del valore su una stringa vuota (`''` oppure `' '`) disabilita la cronologia REPL persistente.


### `NODE_EXTRA_CA_CERTS=file`
<!-- YAML
added: v7.3.0
-->

Quando è impostato, i ben noti "root" CA (come VeriSign) verranno estesi con i certificati aggiuntivi all'interno di `file`. Il file deve essere composto da uno o più certificati attendibili in formato PEM. Verrà emesso (una volta) un messaggio con [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor) se il file è assente o deformato, ma a parte ciò eventuali errori verranno ignorati.

Da notare che né i certificati conosciuti né i certificati aggiuntivi vengono utilizzati quando la proprietà `ca` delle opzioni viene specificata esplicitamente per un client o un server TLS o HTTPS.

### `OPENSSL_CONF=file`
<!-- YAML
added: v7.7.0
-->

Carica un file con configurazione OpenSSL all'avvio. Tra gli altri usi, può essere utilizzato per abilitare la crittografia conforme al FIPS se Node.js è compilato con `./configure
--openssl-fips`.

Se viene utilizzata l'opzione [`--openssl-config`][] della command line, la variabile di ambiente viene ignorata.

### `SSL_CERT_DIR=dir`
<!-- YAML
added: v7.7.0
-->

Se viene abilitato `--use-openssl-ca`, questo sovrascrive e imposta la directory di OpenSSL contenente i certificati attendibili.

*Note*: Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=file`
<!-- YAML
added: v7.7.0
-->

Se viene abilitato `--use-openssl-ca`, questo sovrascrive e imposta il file di OpenSSL contenente certificati attendibili.

*Note*: Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `NODE_REDIRECT_WARNINGS=file`
<!-- YAML
added: v8.0.0
-->

Se impostato, gli avvisi di processo verranno emessi sul file specificato invece di essere stampati sullo stderr. Se il file non esiste verrà creato, invece se esiste verrà aggiunto. Se si verifica un errore durante il tentativo di scrittura dell'avviso sul file, questo verrà scritto sullo stderr. È equivalente all'utilizzo del flag `--redirect-warnings=file` della command line.

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
