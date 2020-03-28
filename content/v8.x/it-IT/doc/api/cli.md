# Opzioni della Command Line

<!--introduced_in=v5.9.1-->

<!--type=misc-->

Node.js viene fornito con una varietà di opzioni CLI. These options expose built-in debugging, multiple ways to execute scripts, and other helpful runtime options.

Per visualizzare questa documentazione come la pagina di un manuale all'interno di un terminale, esegui `man node`.

## Sinossi

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

Esegui senza argomenti per avviare il [REPL](repl.html).

*Per maggiori informazioni su `node debug`, vedi la documentazione sul [debugger](debugger.html).*

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

Valuta il seguente argomento come JavaScript. The modules which are predefined in the REPL can also be used in `script`.

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

Follows `require()`'s module resolution rules. `module` potrebbe essere il percorso per un file oppure il nome un node module.

### `--inspect[=[host:]port]`

<!-- YAML
added: v6.3.0
-->

Attiva l'inspector su host:port. L'impostazione predefinita è 127.0.0.1:9229.

V8 inspector integration allows tools such as Chrome DevTools and IDEs to debug and profile Node.js instances. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer).

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

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

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

Aborting instead of exiting causes a core file to be generated for post-mortem analysis using a debugger (such as `lldb`, `gdb`, and `mdb`).

### `--trace-warnings`

<!-- YAML
added: v6.0.0
-->

Stampa le stack trace per gli avvisi di processo (incluse le deprecazioni).

### `--redirect-warnings=file`

<!-- YAML
added: v8.0.0
-->

Scrive gli avvisi di processo sul file specificato invece di stamparli sullo stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead.

### `--trace-sync-io`

<!-- YAML
added: v2.1.0
-->

Prints a stack trace whenever synchronous I/O is detected after the first turn of the event loop.

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

A comma separated list of categories that should be traced when trace event tracing is enabled using `--trace-events-enabled`.

### `--trace-event-file-pattern`

<!-- YAML
added: v8.12.0
-->

Template string specifying the filepath for the trace event data, it supports `${rotation}` and `${pid}`.

### `--zero-fill-buffers`

<!-- YAML
added: v6.0.0
-->

Automatically zero-fills all newly allocated [Buffer](buffer.html#buffer_buffer) and [SlowBuffer](buffer.html#buffer_class_slowbuffer) instances.

### `--preserve-symlinks`

<!-- YAML
added: v6.3.0
-->

Instructs the module loader to preserve symbolic links when resolving and caching modules.

By default, when Node.js loads a module from a path that is symbolically linked to a different on-disk location, Node.js will dereference the link and use the actual on-disk "real path" of the module as both an identifier and as a root path to locate other dependency modules. In most cases, this default behavior is acceptable. However, when using symbolically linked peer dependencies, as illustrated in the example below, the default behavior causes an exception to be thrown if `moduleA` attempts to require `moduleB` as a peer dependency:

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

The `--preserve-symlinks` command line flag instructs Node.js to use the symlink path for modules as opposed to the real path, allowing symbolically linked peer dependencies to be found.

Da notare, tuttavia, che l'utilizzo di `--preserve-symlinks` può avere altri effetti collaterali. Specifically, symbolically linked *native* modules can fail to load if those are linked from more than one location in the dependency tree (Node.js would see those as two separate modules and would attempt to load the module multiple times, causing an exception to be thrown).

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

Abilita la crittografia conforme al FIPS all'avvio. (Requires Node.js to be built with `./configure --openssl-fips`)

### `--force-fips`

<!-- YAML
added: v6.0.0
-->

Forza la crittografia conforme al FIPS all'avvio. (Cannot be disabled from script code.) (Same requirements as `--enable-fips`)

### `--openssl-config=file`

<!-- YAML
added: v6.9.0
-->

Carica un file con configurazione OpenSSL all'avvio. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure --openssl-fips`.

### `--use-openssl-ca`, `--use-bundled-ca`

<!-- YAML
added: v7.5.0
-->

Use OpenSSL's default CA store or use bundled Mozilla CA store as supplied by current Node.js version. The default store is selectable at build-time.

L'utilizzo dell'OpenSSL store consente modifiche esterne dello store stesso. For most Linux and BSD distributions, this store is maintained by the distribution maintainers and system administrators. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. È identico su tutte le piattaforme supportate.

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

Alias for stdin, analogous to the use of - in other command line utilities, meaning that the script will be read from stdin, and the rest of the options are passed to that script.

### `--`

<!-- YAML
added: v7.5.0
-->

Indica la fine delle opzioni node. Passa gli argomenti restanti allo script. If no script filename or eval/print script is supplied prior to this, then the next argument will be used as a script filename.

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

Percorso dati per i dati ICU (Intl object). Will extend linked-in data when compiled with small-icu support.

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

Un elenco, separato da spazi, delle opzioni della command line. `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

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

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `NODE_PRESERVE_SYMLINKS=1`

<!-- YAML
added: v7.1.0
-->

When set to `1`, instructs the module loader to preserve symbolic links when resolving and caching modules.

### `NODE_REPL_HISTORY=file`

<!-- YAML
added: v3.0.0
-->

Percorso del file utilizzato per memorizzare la cronologia REPL persistente. The default path is `~/.node_repl_history`, which is overridden by this variable. Setting the value to an empty string (`''` or `' '`) disables persistent REPL history.

### `NODE_EXTRA_CA_CERTS=file`

<!-- YAML
added: v7.3.0
-->

When set, the well known "root" CAs (like VeriSign) will be extended with the extra certificates in `file`. The file should consist of one or more trusted certificates in PEM format. A message will be emitted (once) with [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor) if the file is missing or malformed, but any errors are otherwise ignored.

Note that neither the well known nor extra certificates are used when the `ca` options property is explicitly specified for a TLS or HTTPS client or server.

### `OPENSSL_CONF=file`

<!-- YAML
added: v7.7.0
-->

Carica un file con configurazione OpenSSL all'avvio. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
--openssl-fips`.

If the [`--openssl-config`][] command line option is used, the environment variable is ignored.

### `SSL_CERT_DIR=dir`

<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's directory containing trusted certificates.

*Note*: Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=file`

<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's file containing trusted certificates.

*Note*: Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `NODE_REDIRECT_WARNINGS=file`

<!-- YAML
added: v8.0.0
-->

When set, process warnings will be emitted to the given file instead of printing to stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead. This is equivalent to using the `--redirect-warnings=file` command-line flag.

### `UV_THREADPOOL_SIZE=size`

Imposta il numero di thread utilizzati nel threadpool di libuv per impostare il `size` dei thread.

Asynchronous system APIs are used by Node.js whenever possible, but where they do not exist, libuv's threadpool is used to create asynchronous node APIs based on synchronous system APIs. Le API di Node.js che utilizzano il threadpool sono:

- all `fs` APIs, other than the file watcher APIs and those that are explicitly synchronous
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, a meno che non venga utilizzato senza un callback
- `crypto.randomFill()`
- `dns.lookup()`
- tutte le API `zlib`, diverse dalle API che sono esplicitamente sincrone

Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value greater than `4` (its current default value). For more information, see the [libuv threadpool documentation](http://docs.libuv.org/en/latest/threadpool.html).