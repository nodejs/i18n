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

Instruye al cargador del módulo para preservar los enlaces simbólicos al resolver y almacenar caché en los módulos.

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

La bandera de línea de comando `--preserve-symlinks` indica a Node.js utilizar la ruta symlink para módulos en lugar de la ruta real, permitiendo que se encuentren las dependencias de pares enlazadas simbólicamente.

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

Imprime un stack trace cada vez que un I/O sincrónico es detectado después del primer turno del bucle de evento.

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

Use bundled Mozilla CA store as supplied by current Node.js version or use OpenSSL's default CA store. El almacén por defecto es seleccionable en el tiempo de construcción.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. Es idéntico en todas las plataformas soportadas.

El uso del almacén OpenSSL permite modificaciones externas del almacén. Para la mayoría de las distribuciones Linux y BSD, este almacén es mantenido por los mantenedores de distribución y los administradores de sistema. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

Vea `SSL_CERT_DIR` y `SSL_CERT_FILE`.

### `--v8-options`

<!-- YAML
added: v0.1.3
-->

Imprime opciones de línea de comando V8.

Las opciones V8 permiten que se separen las palabras con guiones (`-`) o con guiones bajos (`_`).

Por ejemplo, `--stack-trace-limit` es equivalente a `--stack_trace_limit`.

### `--v8-pool-size=num`

<!-- YAML
added: v5.10.0
-->

Set V8's thread pool size which will be used to allocate background jobs.

If set to `0` then V8 will choose an appropriate size of the thread pool based on the number of online processors.

Si el valor proporcionado es mayor que el máximo del V8, entonces se escogerá el mayor valor.

### `--zero-fill-buffers`

<!-- YAML
added: v6.0.0
-->

Rellena con zeros automáticamente todos las instancias [`Buffer`][] y [`SlowBuffer`][] recién asignadas.

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

Comprueba la sintaxis del script sin ejecutarlo.

### `-e`, `--eval "script"`

<!-- YAML
added: v0.5.2
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Evalúa el siguiente argumento como JavaScript. Los módulos que son predefinidos en el REPL también pueden ser usados en `script`.

On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. En Powershell o Git bash, `'` y `"` se pueden utilizar.

### `-h`, `--help`

<!-- YAML
added: v0.1.3
-->

Imprime opciones de línea de comando de nodo. La salida de esta opción es menos detallada que este documento.

### `-i`, `--interactive`

<!-- YAML
added: v0.7.7
-->

Abre el REPL incluso si no parece que stdin sea un terminal.

### `-p`, `--print "script"`

<!-- YAML
added: v0.6.4
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Idéntico a `-e` pero imprime el resultado.

### `-r`, `--require module`

<!-- YAML
added: v1.6.0
-->

Precarga el módulo especificado en el inicio.

Sigue las reglas de resolución del módulo `require()`'. `module` puede ser una ruta a un archivo o un nombre del módulo de nodo.

### `-v`, `--version`

<!-- YAML
added: v0.1.3
-->

Imprime la versión de node.

## Variables de Entorno

### `NODE_DEBUG=module[,…]`

<!-- YAML
added: v0.1.32
-->

Lista separada con `','` de módulos core que deben imprimir información de depuración.

### `NODE_DISABLE_COLORS=1`

<!-- YAML
added: v0.3.0
-->

Cuando se establece a `1`, no se utilizarán colores en el REPL.

### `NODE_EXTRA_CA_CERTS=file`

<!-- YAML
added: v7.3.0
-->

When set, the well known "root" CAs (like VeriSign) will be extended with the extra certificates in `file`. El archivo debería consistir de uno o más certificados de confianza en el formato PEM. Se emitirá un mensaje (una vez) con [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor) si falta el archivo o está malformado, pero cualquier error es ignorado.

Tenga en cuenta que ni los certificados bien conocidos ni los extra se utilizan cuando la propiedad de opciones `ca` está explícitamente especificada para un servidor o cliente TLS o HTTPS.

### `NODE_ICU_DATA=file`

<!-- YAML
added: v0.11.15
-->

La ruta de datos para los datos ICU (objeto `Intl`). Extenderá los datos enlazados cuando se compilen con soporte de icu pequeño.

### `NODE_NO_WARNINGS=1`

<!-- YAML
added: v6.11.0
-->

Cuando se establece a `1`, se silencian las advertencias de proceso.

### `NODE_OPTIONS=options...`

<!-- YAML
added: v8.0.0
-->

Una lista separada con espacios de opciones de línea de comando. `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node.js se cerrará con un error si se utiliza una opción que no está permitida en el entorno, como `-p` o un archivo script.

Las opciones de Node que están permitidas son:

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

Las opciones de V8 que están permitidas son:

- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PATH=path[:…]`

<!-- YAML
added: v0.1.32
-->

Una lista separada con `':'` de directorios con prefijo a la ruta de búsqueda del módulo.

En Windows, es una lista separada con `';'` en su lugar.

### `NODE_PENDING_DEPRECATION=1`

<!-- YAML
added: v8.0.0
-->

Cuando se establece a `1`, emite advertencias de desaprobación pendientes.

Las desaprobaciones pendientes son generalmente idénticas a una desaprobación de tiempo de ejecución, con la notable excepción de que se *apagan* por defecto y no serán emitidas a menos que se establezca la bandera de línea de comando `--pending-deprecation` o la variable de entorno `NODE_PENDING_DEPRECATION=1`. Las desaprobaciones pendientes son utilizadas para proporcionar un tipo de mecanismo de "advertencia temprana" selectivo que los desarrolladores pueden aprovechar para detectar usos de API desaprobados.

### `NODE_PRESERVE_SYMLINKS=1`

<!-- YAML
added: v7.1.0
-->

Cuando se establece a `1`, indica al cargador del módulo para preservar enlaces simbólicos al resolver y almacenar caché en los módulos.

### `NODE_REDIRECT_WARNINGS=file`

<!-- YAML
added: v8.0.0
-->

Cuando se establece, se emitirán advertencias de proceso al archivo dado en lugar de imprimirlas en stderr. El archivo será creado si no existe, y se adjuntará si existe. Si ocurre un error al intentar escribir la advertencia al archivo, la advertencia será escrita en stderr en su lugar. Esto es equivalente a utilizar la bandera de línea de comando `--redirect-warnings=file`.

### `NODE_REPL_HISTORY=file`

<!-- YAML
added: v3.0.0
-->

Ruta al archivo utilizado para almacenar el historial REPL persistente. La ruta por defecto es `~/.node_repl_history`, la cual es anulada por esta variable. Configurar el valor a una string vacía (`''` o `' '`) inhabilita el historial REPL persistente.

### `OPENSSL_CONF=file`

<!-- YAML
added: v6.11.0
-->

Carga un archivo de configuración OpenSSL en el inicio. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
--openssl-fips`.

Si la opción de línea de comando [`--openssl-config`][] es usada, la variable de entorno se ignora.

### `SSL_CERT_DIR=dir`

<!-- YAML
added: v7.7.0
-->

Si `--use-openssl-ca` está habilitado, esto lo anula y establece el directorio de OpenSSL que contiene certificados de confianza.

Tenga en cuenta que a menos de que el entorno secundario sea establecido explícitamente, esta variable de entorno será heredado por cualquier proceso secundario, y si usan OpenSSL, puede llevarlos a confiar en los mismos CAs como nodo.

### `SSL_CERT_FILE=file`

<!-- YAML
added: v7.7.0
-->

Si `--use-openssl-ca` está habilitado, esto lo anula y establece el archivo de OpenSSL que contiene certificados de confianza.

Tenga en cuenta que a menos de que el entorno secundario sea establecido explícitamente, esta variable de entorno será heredado por cualquier proceso secundario, y si usan OpenSSL, puede llevarlos a confiar en los mismos CAs como nodo.

### `UV_THREADPOOL_SIZE=size`

Set the number of threads used in libuv's threadpool to `size` threads.

Las APIs de sistema asincrónicas son utilizadas por Node.js cada vez que es posible, pero donde ellas no existan el threadpool de libuv es utilizado para crear APIs de nodo asincrónicas basadas en APIs de sistema sincrónicas. APIs de Node.js que utilizan el threadpool son:

- todas las APIs `fs`, distintas a las APIs observadoras de archivo y aquellas que son explícitamente sincrónicas
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, a menos que sea usada sin un callback
- `crypto.randomFill()`
- `dns.lookup()`
- todas las APIs `zlib`, distintas de aquellas que son explícitamente sincrónicas

Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value greater than `4` (its current default value). Para mayor información, vea la [documentación del threadpool libuv](http://docs.libuv.org/en/latest/threadpool.html).