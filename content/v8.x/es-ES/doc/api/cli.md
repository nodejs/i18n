# Opciones de la Línea de Comandos

<!--introduced_in=v5.9.1-->

<!--type=misc-->

Node.js viene con una variedad de opciones de CLI. These options expose built-in debugging, multiple ways to execute scripts, and other helpful runtime options.

Para ver esta documentación como una página de manual en un terminal, ejecutar `man node`.

## Sinopsis

`node [options] [V8 options] [script.js | -e "script" |-] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

Ejecutar sin argumentos para iniciar el [REPL](repl.html).

*Para obtener más información acerca de `node debug`, por favor vea la documentación [debugger](debugger.html).*

## Opciones

### `-v`, `--version`

<!-- YAML
added: v0.1.3
-->

Imprime la versión de Node.

### `-h`, `--help`

<!-- YAML
added: v0.1.3
-->

Imprime las opciones de la línea de comando de node. La salida de esta opción es menos detallada que este documento.

### `-e`, `--eval "script"`

<!-- YAML
added: v0.5.2
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Evalúa el siguiente argumento como JavaScript. The modules which are predefined in the REPL can also be used in `script`.

*Note*: On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.

### `-p`, `--print "script"`

<!-- YAML
added: v0.6.4
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Idéntico a `-e` pero imprime el resultado.

### `-c`, `--check`

<!-- YAML
added:

  - v5.0.0
  - v4.2.0
-->

Revisa la sintaxis del script sin ejecutarlo.

### `-i`, `--interactive`

<!-- YAML
added: v0.7.7
-->

Abre el REPL aún si stdin no parece ser una terminal.

### `-r`, `--require module`

<!-- YAML
added: v1.6.0
-->

Precarga el módulo específico en el inicio.

Follows `require()`'s module resolution rules. `module` puede ser una ruta a un archivo, o un nombre del módulo de node.

### `--inspect[=[host:]port]`

<!-- YAML
added: v6.3.0
-->

Activar el inspector en host:port. El predeterminado es 127.0.0.1:9229.

V8 inspector integration allows tools such as Chrome DevTools and IDEs to debug and profile Node.js instances. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer).

### `--inspect-brk[=[host:]port]`

<!-- YAML
added: v7.6.0
-->

Activar inspector en host:port e interrumpe al inicio del script de usuario. El host:port predeterminado es 127.0.0.1:9229.

### `--inspect-port=[host:]port`

<!-- YAML
added: v7.6.0
-->

Establece el host:port para ser usado cuando el inspector está activado. Es útil al activar el inspector enviando la señal `SIGUSR1`.

El host predeterminado es 127.0.0.1.

### `--no-deprecation`

<!-- YAML
added: v0.8.0
-->

Silencia las advertencias de desaprobación.

### `--trace-deprecation`

<!-- YAML
added: v0.8.0
-->

Imprime stack traces para desaprobaciones.

### `--throw-deprecation`

<!-- YAML
added: v0.11.14
-->

Arroja errores para deprecaciones.

### `--pending-deprecation`

<!-- YAML
added: v8.0.0
-->

Emite advertencias de desaprobación pendientes.

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `--no-warnings`

<!-- YAML
added: v6.0.0
-->

Silencia todas las advertencias del proceso (incluyendo las desaprobaciones).

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

Imprime stack traces para advertencias de proceso (incluye desaprobaciones).

### `--redirect-warnings=file`

<!-- YAML
added: v8.0.0
-->

Escribe advertencias de proceso al archivo dado en lugar de imprimirlo en stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead.

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

Permite la recolección de información para el seguimiento de eventos.

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

Note que, sin embargo, el uso de `--preserve-symlinks` puede tener otros efectos secundarios. Specifically, symbolically linked *native* modules can fail to load if those are linked from more than one location in the dependency tree (Node.js would see those as two separate modules and would attempt to load the module multiple times, causing an exception to be thrown).

### `--track-heap-objects`

<!-- YAML
added: v2.4.0
-->

Haga un seguimiento de las asignaciones de los objetos del montículo para las fotos instantáneas del montículo.

### `--prof-process`

<!-- YAML
added: v5.2.0
-->

Procesar la salida del generador de perfiles de V8 generada con la opción V8.

### `--v8-options`

<!-- YAML
added: v0.1.3
-->

Imprime opciones de línea de comando V8.

*Note*: V8 options allow words to be separated by both dashes (`-`) or underscores (`_`).

Por ejemplo, `--stack-trace-limit` es equivalente a `--stack_trace_limit`.

### `--tls-cipher-list=list`

<!-- YAML
added: v4.0.0
-->

Especifica una lista de cifrado TLS predeterminada alternativa. (Requires Node.js to be built with crypto support. (Predeterminado))

### `--enable-fips`

<!-- YAML
added: v6.0.0
-->

Habilita FIPS-compliant cripto al Inicio. (Requires Node.js to be built with `./configure --openssl-fips`)

### `--force-fips`

<!-- YAML
added: v6.0.0
-->

Fuerza cripto FIPS-compliant en inicio. (Cannot be disabled from script code.) (Same requirements as `--enable-fips`)

### `--openssl-config=file`

<!-- YAML
added: v6.9.0
-->

Carga un archivo de configuración OpenSSL en el arranque. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure --openssl-fips`.

### `--use-openssl-ca`, `--use-bundled-ca`

<!-- YAML
added: v7.5.0
-->

Use OpenSSL's default CA store or use bundled Mozilla CA store as supplied by current Node.js version. El almacen predeterminado es seleccionable en el tiempo de construcción.

El uso del almacén OpenSSL permite modificaciones externas del almacén. For most Linux and BSD distributions, this store is maintained by the distribution maintainers and system administrators. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. Es idéntico en todas las plataformas soportadas.

Vea `SSL_CERT_DIR` y `SSL_CERT_FILE`.

### `--icu-data-dir=file`

<!-- YAML
added: v0.11.15
-->

Especifica la ruta de carga datos ICU. (sobreescribe `NODE_ICU_DATA`)

### `-`

<!-- YAML
added: v8.0.0
-->

Alias for stdin, analogous to the use of - in other command line utilities, meaning that the script will be read from stdin, and the rest of the options are passed to that script.

### `--`

<!-- YAML
added: v7.5.0
-->

Indicar el final de las opciones de node. Pasar el resto de los argumentos al script. If no script filename or eval/print script is supplied prior to this, then the next argument will be used as a script filename.

### `--max-http-header-size=size`

<!-- YAML
added: v8.15.0
-->

Specify the maximum size, in bytes, of HTTP headers. Defaults to 8KB.

## Variables de Entorno

### `NODE_DEBUG=module[,…]`

<!-- YAML
added: v0.1.32
-->

Lista separada con `','` de módulos core que deben imprimir información de depuración.

### `NODE_PATH=path[:…]`

<!-- YAML
added: v0.1.32
-->

Una lista separada con `':'` de directorios con prefijo a la ruta de búsqueda del módulo.

*Note*: On Windows, this is a `';'`-separated list instead.

### `NODE_DISABLE_COLORS=1`

<!-- YAML
added: v0.3.0
-->

Cuando se establece a `1`, no se utilizarán colores en el REPL.

### `NODE_ICU_DATA=file`

<!-- YAML
added: v0.11.15
-->

La ruta de datos para los datos ICU (objeto Inl). Will extend linked-in data when compiled with small-icu support.

### `NODE_NO_WARNINGS=1`

<!-- YAML
added: v7.5.0
-->

Cuando se establece a `1`, se silencian las advertencias de proceso.

### `NODE_NO_HTTP2=1`

<!-- YAML
added: v8.8.0
-->

When set to `1`, the `http2` module is suppressed.

### `NODE_OPTIONS=options...`

<!-- YAML
added: v8.0.0
-->

Una lista separada con espacios de opciones de línea de comando. `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

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

Las opciones de V8 que están permitidas son:

- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PENDING_DEPRECATION=1`

<!-- YAML
added: v8.0.0
-->

Cuando se establece a `1`, emite advertencias de desaprobación pendientes.

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

Ruta al archivo utilizado para almacenar el historial REPL persistente. The default path is `~/.node_repl_history`, which is overridden by this variable. Setting the value to an empty string (`''` or `' '`) disables persistent REPL history.

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

Carga un archivo de configuración OpenSSL en el arranque. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
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

Set the number of threads used in libuv's threadpool to `size` threads.

Asynchronous system APIs are used by Node.js whenever possible, but where they do not exist, libuv's threadpool is used to create asynchronous node APIs based on synchronous system APIs. APIs de Node.js que utilizan el threadpool son:

- all `fs` APIs, other than the file watcher APIs and those that are explicitly synchronous
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, a menos que sea usada sin un callback
- `crypto.randomFill()`
- `dns.lookup()`
- todas las APIs `zlib`, distintas de aquellas que son explícitamente sincrónicas

Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value greater than `4` (its current default value). For more information, see the [libuv threadpool documentation](http://docs.libuv.org/en/latest/threadpool.html).