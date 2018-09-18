# Opciones de Línea de Comandos

<!--introduced_in=v5.9.1-->

<!--type=misc-->

Node.js viene con una variedad de opciones de CLI. Estas opciones exponen depuración integrada, múltiples formas para ejecutar secuencias de comandos y otras opciones útiles de tiempo de ejecución.

Para ver esta documentación como una página de manual en un terminal, ejecutar `man node`.

## Sinopsis

`node [options] [V8 options] [script.js | -e "script" |-] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

Ejecutar sin argumentos para iniciar la [REPL](repl.html).

*Para obtener más información sobre `node debug`, consulte la documentación del [debugger](debugger.html).*

## Opciones

### `-`

<!-- YAML
added: v8.0.0
-->

Alias para stdin, análogo al uso de - en otras utilidades de línea de comandos, lo que significa que el script lee de stdin, y el resto de las opciones se pasan al script.

### `--`

<!-- YAML
added: v6.11.0
-->

Indicar el final de las opciones de node. Pasar el resto de los argumentos al script. If no script filename or eval/print script is supplied prior to this, then the next argument will be used as a script filename.

### `--abort-on-uncaught-exception`

<!-- YAML
added: v0.10
-->

Aborting instead of exiting causes a core file to be generated for post-mortem analysis using a debugger (such as `lldb`, `gdb`, and `mdb`).

If this flag is passed, the behavior can still be set to not abort through [`process.setUncaughtExceptionCaptureCallback()`][] (and through usage of the `domain` module that uses it).

### `--enable-fips`

<!-- YAML
added: v6.0.0
-->

Habilita FIPS-compliant cripto al Inicio. (Requiere Node.js para ser construido con `./configure --openssl-fips`.)

### `--experimental-modules`

<!-- YAML
added: v8.5.0
-->

Habilita soporte y caché de módulos experimentales ES.

### `--experimental-repl-await`

<!-- YAML
added: v10.0.0
-->

Habilita la palabra clave `await` en REPL.

### `--experimental-vm-modules`

<!-- YAML
added: v9.6.0
-->

Habilita soporte y caché de módulos experimentales ES en el módulo `vm`.

### `--force-fips`

<!-- YAML
added: v6.0.0
-->

Fuerza cripto FIPS-compliant en inicio. (No puede se deshabilitado desde el código del script.) (Mismos requisitos que `--enable-fips`.)

### `--icu-data-dir=file`

<!-- YAML
added: v0.11.15
-->

Especifica la ruta de carga datos ICU. (Sobreescribe `NODE_ICU_DATA`.)

### `--inspect-brk[=[host:]port]`

<!-- YAML
added: v7.6.0
-->

Activar inspector en `host:port` e interrumpe al inicio del script de usuario. El `host:port` predeterminado es `127.0.0.1:9229`.

### `--inspect-port=[host:]port`

<!-- YAML
added: v7.6.0
-->

Establece el `host:port` para ser usado cuando el inspector está activado. Es útil al activar el inspector enviando la señal `SIGUSR1`.

El host predeterminado es `127.0.0.1`.

### `--inspect[=[host:]port]`

<!-- YAML
added: v6.3.0
-->

Activar el inspector en `host:port`. El predeterminado es `127.0.0.1:9229`.

La integración del inspector V8 permite que las herramientas como Chrome DevTools e IDEs depuren y perfilen instancias de Node.js. Las herramientas se adjuntan a las instancias de Node.js a través de un puerto tcp y se comunican utilizando el [Protocolo Chrome DevTools](https://chromedevtools.github.io/devtools-protocol/).

### `--napi-modules`

<!-- YAML
added: v7.10.0
-->

Esta opción es un no-op. Es mantenido para compatibilidad.

### `--no-deprecation`

<!-- YAML
added: v0.8.0
-->

Silencia las advertencias de desaprobación.

### `--no-force-async-hooks-checks`

<!-- YAML
added: v9.0.0
-->

Deshabilita las verificaciones de tiempo de ejecución para `async_hooks`. Estas seguirán estando habilitadas dinámicamente cuando `async_hooks` esté habilitado.

### `--no-warnings`

<!-- YAML
added: v6.0.0
-->

Silencia todas las advertencias del proceso (incluyendo las desaprobaciones).

### `--openssl-config=file`

<!-- YAML
added: v6.9.0
-->

Carga un archivo de configuración OpenSSL en el arranque. Entre otros usos, esto puede ser utilizado para habilitar la criptografía compatible con FIPS si Node.js se construye con `./configure --openssl-fips`.

### `--pending-deprecation`

<!-- YAML
added: v8.0.0
-->

Emite advertencias de desaprobación pendientes.

Las desaprobaciones pendientes son generalmente idénticas a una desaprobación de tiempo de ejecución, con la notable excepción de que se *apagan* por defecto y no serán emitidas a menos que se establezca la bandera de línea de comando `--pending-deprecation` o la variable de entorno `NODE_PENDING_DEPRECATION=1`. Las desaprobaciones pendientes son utilizadas para proporcionar un tipo de mecanismo de "advertencia temprana" selectivo que los desarrolladores pueden aprovechar para detectar usos de API desaprobados.

### `--preserve-symlinks`

<!-- YAML
added: v6.3.0
-->

Indica al cargador del módulo para preservar los enlaces simbólicos al resolver y almacenar caché en los módulos.

Por defecto, cuando Node.js carga un módulo desde una ruta que está simbólicamente enlazada a una locación diferente en el disco, Node.js desreferenciará el enlace y utilizará la "ruta real" actual del módulo en el disco como un identificador y como una ruta raíz para localizar otros módulos de dependencia. En la mayoría de los casos, este comportamiento por defecto es aceptado. Sin embargo, al utilizar dependencias de pares enlazadas simbólicamente, como se ilustra en el siguiente ejemplo, el comportamiento por defecto causa una excepción a ser arrojada si el `moduleA` intenta requerir al `moduleB` como una dependencia de pares:

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

La bandera de línea de comando `--preserve-symlinks` indica a Node.js a utilizar la ruta symlink para módulos en lugar de la ruta real, permitiendo que se encuentren las dependencias de pares enlazadas simbólicamente.

Note que, sin embargo, el uso de `--preserve-symlinks` puede tener otros efectos secundarios. Específicamente, los módulos *nativos* enlazados simbólicamente pueden fallar al cargar si están enlazadas desde más de una locación en el árbol de dependencia (Node.js podría verlos como dos módulos separados e intentaría cargar el módulo múltiples veces, causando que se arroje una excepción).

### `--prof-process`

<!-- YAML
added: v5.2.0
-->

Process V8 profiler output generated using the V8 option `--prof`.

### `--redirect-warnings=file`

<!-- YAML
added: v8.0.0
-->

Escribe advertencias de proceso al archivo dado en lugar de imprimirlo en stderr. El archivo será creado si no existe, y se adjuntará si existe. Si ocurre un error al intentar escribir una advertencia al archivo, la advertencia será escrita en stderr en su lugar.

### `--throw-deprecation`

<!-- YAML
added: v0.11.14
-->

Throw errors for deprecations.

### `--tls-cipher-list=list`

<!-- YAML
added: v4.0.0
-->

Especifica una lista de cifrado TLS predeterminada alternativa. Requiere que Node.js se construya con soporte criptográfico (por defecto).

### `--trace-deprecation`

<!-- YAML
added: v0.8.0
-->

Imprime stack traces para desaprobaciones.

### `--trace-event-categories`

<!-- YAML
added: v7.7.0
-->

A comma separated list of categories that should be traced when trace event tracing is enabled using `--trace-events-enabled`.

### `--trace-event-file-pattern`

<!-- YAML
added: v9.8.0
-->

Template string specifying the filepath for the trace event data, it supports `${rotation}` and `${pid}`.

### `--trace-events-enabled`

<!-- YAML
added: v7.7.0
-->

Enables the collection of trace event tracing information.

### `--trace-sync-io`

<!-- YAML
added: v2.1.0
-->

Imprime un stack trave cada vez que un I/O sincrónico es detectado después de el primer turno del bucle de evento.

### `--trace-warnings`

<!-- YAML
added: v6.0.0
-->

Imprime stack traces para advertencias de proceso (incluye desaprobaciones).

### `--track-heap-objects`

<!-- YAML
added: v2.4.0
-->

Track heap object allocations for heap snapshots.

### `--use-bundled-ca`, `--use-openssl-ca`

<!-- YAML
added: v6.11.0
-->

Use bundled Mozilla CA store as supplied by current Node.js version or use OpenSSL's default CA store. La tienda por defecto es seleccionable en el tiempo de construcción.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. Es idéntico en todas las plataformas soportadas.

Using OpenSSL store allows for external modifications of the store. For most Linux and BSD distributions, this store is maintained by the distribution maintainers and system administrators. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

See `SSL_CERT_DIR` and `SSL_CERT_FILE`.

### `--v8-options`

<!-- YAML
added: v0.1.3
-->

Print V8 command line options.

V8 options allow words to be separated by both dashes (`-`) or underscores (`_`).

For example, `--stack-trace-limit` is equivalent to `--stack_trace_limit`.

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

Syntax check the script without executing.

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

Las desaprobaciones pendientes son generalmente idénticas a una desaprobación de tiempo de ejecución, con la notable excepción de que se *apagan* por defecto y no serán emitidas a menos que se establezca la bandera de línea de comando `--pending-deprecation` o la variable de entorno `NODE_PENDING_DEPRECATION=1`. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

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