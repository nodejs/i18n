# Параметры командной строки

<!--introduced_in=v5.9.1-->
<!--type=misc-->

Node.js поставляется с различными вариантами CLI. Эти параметры предоставляют встроенную отладку, несколько способов запуска сценариев и другие полезные параметры времени выполнения.

To view this documentation as a manual page in a terminal, run `man node`.

## Краткий обзор

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node inspect [script.js | -e "script" | <host>:<port>] …`

`узел --v8-опций`

Выполнить без аргументов, чтобы запустить [REPL](repl.html).

_For more info about `node inspect`, please see the [debugger](debugger.html) documentation._

## Опции
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

Alias for stdin, analogous to the use of - in other command line utilities, meaning that the script will be read from stdin, and the rest of the options are passed to that script.

### `--`
<!-- YAML
added: v6.11.0
-->

Укажите параметры конца узла. Передайте остальные аргументы сценарию. Если до этого ранее не указывалось имя сценария или сценарий eval/print, в таком случае следующий аргумент будет использован как имя сценария.

### `--abort-on-uncaught-exception`
<!-- YAML
added: v0.10
-->

Aborting instead of exiting causes a core file to be generated for post-mortem analysis using a debugger (such as `lldb`, `gdb`, and `mdb`).

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

Включите FIPS-совместимое шифрование при запуске. (Requires Node.js to be built with `./configure --openssl-fips`.)

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

Принудительно включается FIPS-совместимое шифрование при запуске. (Cannot be disabled from script code.) (Same requirements as `--enable-fips`.)

### `--icu-data-dir=file`
<!-- YAML
added: v0.11.15
-->

Задается путь загрузки данных ICU. (Overrides `NODE_ICU_DATA`.)

### `--inspect-brk[=[host:]port]`
<!-- YAML
added: v7.6.0
-->

Activate inspector on `host:port` and break at start of user script. Default `host:port` is `127.0.0.1:9229`.

### `--inspect-port=[host:]port`
<!-- YAML
added: v7.6.0
-->

Set the `host:port` to be used when the inspector is activated. Useful when activating the inspector by sending the `SIGUSR1` signal.

Default host is `127.0.0.1`.

See the [security warning](#inspector_security) below regarding the `host` parameter usage.

### `--inspect[=[host:]port]`
<!-- YAML
added: v6.3.0
-->

Activate inspector on `host:port`. Default is `127.0.0.1:9229`.

V8 inspector integration allows tools such as Chrome DevTools and IDEs to debug and profile Node.js instances. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

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

Тихое предупреждение об устаревании.

### `--no-force-async-hooks-checks`
<!-- YAML
added: v9.0.0
-->

Disables runtime checks for `async_hooks`. These will still be enabled dynamically when `async_hooks` is enabled.

### `--no-warnings`
<!-- YAML
added: v6.0.0
-->

Делает все процессные уведомления тихими (включая устаревшие версии).

### `--openssl-config=file`
<!-- YAML
added: v6.9.0
-->

Загрузка файла конфигурации OpenSSL при запуске. Среди прочего это может использоваться для включения FIPS-совместимого шифрования, если Node.js создан с `./configure --openssl-fips`.

### `--pending-deprecation`
<!-- YAML
added: v8.0.0
-->

Emit pending deprecation warnings.

Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `--preserve-symlinks`
<!-- YAML
added: v6.3.0
-->

Указывает загрузчику модулей сохранять символические ссылки при разрешении и кэшировании модулей.

По умолчанию, когда Node.Js загружает модуль из маршрута, который символически связан с другим местоположением на диске, Node.Js разыменовывает ссылку и использует текущий «реальный маршрут» дискового модуля как идентификатор и корневой маршрут, чтобы найти другие модули зависимостей. В большинстве случаев это поведение по умолчанию является приемлемым. Однако, как показано в нижеследующем примере, когда используются символически связанные парные зависимости, поведение по умолчанию вызывает исключение, если `moduleA` пытается запросить `moduleB` в качестве парной зависимости:

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

Флаг командной строки `--preserve-symlinks` указывает Node.js использовать путь символической ссылки в отличие от реального пути, что позволяет найти символически связанные парные зависимости.

Обратите внимание, что использование `--preserve-symlinks` может иметь другие побочные эффекты. В частности, *native* символически связанные модули могут неправильно загрузиться, если они связаны из более чем одного местоположения в дереве зависимостей (Node.js будет видеть их как два отдельным модуля и будет пытаться загрузить модуль несколько раз, вызывая исключение).

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

Process V8 profiler output generated using the V8 option `--prof`.

### `--redirect-warnings=file`
<!-- YAML
added: v8.0.0
-->

Запись процессных уведомлений в заданный файл вместо печати в stderr. Файл будет создан, если он не существует, и будет добавлен, если он существует. Если при попытке записать предупреждение в файл возникает ошибка, предупреждение вместо этого будет записано в stderr.

### `--throw-deprecation`
<!-- YAML
added: v0.11.14
-->

Формирование ошибок для устаревших версий.

### `--title=title`
<!-- YAML
added: v10.7.0
-->

Set `process.title` on startup.

### `--tls-cipher-list=list`
<!-- YAML
added: v4.0.0
-->

Задается альтернативный список шифров TLS по умолчанию. Requires Node.js to be built with crypto support (default).

### `--trace-deprecation`
<!-- YAML
added: v0.8.0
-->

Печать трассировок стека для устаревших версий.

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

Печатает трассировку стека каждый раз, когда обнаруживается синхронизированный ввод/вывод после первого запуска цикла событий.

### `--trace-warnings`
<!-- YAML
added: v6.0.0
-->

Печать трассировок стека для процессных уведомлений (включая устаревшие версии).

### `--track-heap-objects`
<!-- YAML
added: v2.4.0
-->

Отслеживание распределения групп объектов для групповых снепшотов.

### `--use-bundled-ca`, `--use-openssl-ca`
<!-- YAML
added: v6.11.0
-->

Use bundled Mozilla CA store as supplied by current Node.js version or use OpenSSL's default CA store. The default store is selectable at build-time.

Объединенное хранилище CA, предоставленное Node.js, является снепшотом хранилища Mozilla CA, исправленным во время запуска. Он идентичен на всех поддерживаемых платформах.

Использование хранилища OpenSSL допускает внешние модификации хранилища. Для большинства дистрибутивов Linux и BSD это хранилище поддерживается сопровождающими и системными администраторами. Расположение хранилища CA OpenSSL зависит от конфигурации библиотеки OpenSSL, но это может быть изменено с помощью переменных среды во время выполнения.

Смотрите `SSL_CERT_DIR` и `SSL_CERT_FILE`.

### `--v8-options`
<!-- YAML
added: v0.1.3
-->

Print V8 command line options.

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

Проверка синтаксиса сценария без выполнения.

### `-e`, `--eval "script"`
<!-- YAML
added: v0.5.2
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Оцените следующий аргумент как JavaScript. Модули, которые предопределены в REPL, также могут использоваться в `script`.

On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.

### `-h`, `--help`
<!-- YAML
added: v0.1.3
-->

Печать опций командной строки узла. Вывод этой опции менее подробен, чем этот документ.

### `-i`, `--interactive`
<!-- YAML
added: v0.7.7
-->

Открывает REPL, даже если stdin не является терминалом.

### `-p`, `--print "script"`
<!-- YAML
added: v0.6.4
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

Идентично `-e`, но печатает результат.

### `-r`, `--require module`
<!-- YAML
added: v1.6.0
-->

Предварительная загрузка указанного модуля при запуске.

Следует правилам разрешения модуля `require()`. `module` может быть путем к файлу или именем модуля узла.

### `-v`, `--version`
<!-- YAML
added: v0.1.3
-->

Печать версии узла.

## Переменные среды

### `NODE_DEBUG=module[,…]`
<!-- YAML
added: v0.1.32
-->

`','` - разделенный список основных модулей, которые должны печатать отладочную информацию.

### `NODE_DEBUG_NATIVE=module[,…]`

`','`-separated list of core C++ modules that should print debug information.

### `NODE_DISABLE_COLORS=1`
<!-- YAML
added: v0.3.0
-->

Если установлено значение `1`, цвета в REPL не будут использоваться.

### `NODE_EXTRA_CA_CERTS=file`
<!-- YAML
added: v7.3.0
-->

Когда установлено, хорошо известные "корневые" CA (такие как VeriSign) будут расширены с дополнительными сертификатами в `file`. Файл должен состоять из одного или нескольких доверенных сертификатов в формате PEM. Сообщение будет отправлено (один раз) с [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor), если файл отсутствует или имеет неправильный формат, но любые ошибки иначе игнорируются.

Обратите внимание, что ни известные ни дополнительные сертификаты не используются, когда свойство параметров `ca` явно указаны клиентом или сервером TLS или HTTPS.

This environment variable is ignored when `node` runs as setuid root or has Linux file capabilities set.

### `NODE_ICU_DATA=file`
<!-- YAML
added: v0.11.15
-->

Data path for ICU (`Intl` object) data. Расширит связанные данные при компиляции с поддержкой малого icu.

### `NODE_NO_WARNINGS=1`
<!-- YAML
added: v6.11.0
-->

Если установлено значение `1`, предупреждения процесса отключаются.

### `NODE_OPTIONS=options...`
<!-- YAML
added: v8.0.0
-->

A space-separated list of command line options. `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node.js will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

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

Опции v8, которые разрешены:
- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PATH=path[:…]`
<!-- YAML
added: v0.1.32
-->

`':'`- разделенный список директорий, предшествующих пути поиска модуля.

On Windows, this is a `';'`-separated list instead.

### `NODE_PENDING_DEPRECATION=1`
<!-- YAML
added: v8.0.0
-->

When set to `1`, emit pending deprecation warnings.

Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `NODE_PRESERVE_SYMLINKS=1`
<!-- YAML
added: v7.1.0
-->

When set to `1`, instructs the module loader to preserve symbolic links when resolving and caching modules.

### `NODE_REDIRECT_WARNINGS=file`
<!-- YAML
added: v8.0.0
-->

Если это установлено, процессные уведомления будут отправляться данному файлу, а не печататься в stderr. Файл будет создаваться, если он не существует, и будет добавляться, если он существует. Если при попытке записать предупреждение в файл произойдет ошибка, предупреждение вместо этого будет записано в stderr. Это эквивалентно использованию флага командной строки `--redirect-warnings=file`.

### `NODE_REPL_HISTORY=file`
<!-- YAML
added: v3.0.0
-->

Путь к файлу, который используется для хранения постоянной истории REPL. Путь по умолчанию - `~/.node_repl_history`, который переопределяется этой переменной. Установка значения в пустую строку (`''` или `' '`) отключает постоянную историю REPL.

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

Загрузка файла конфигурации OpenSSL при запуске. Среди прочего это может использоваться для включения FIPS-совместимого шифрования, если Node.js создан с `./configure
--openssl-fips`.

Если используется опция командной строки [`--openssl-config`][], переменная среда игнорируется.

### `SSL_CERT_DIR=dir`
<!-- YAML
added: v7.7.0
-->

Если включен `--use-openssl-ca`, это переопределяет и устанавливает каталог OpenSSL, содержащий доверенные сертификаты.

Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=file`
<!-- YAML
added: v7.7.0
-->

Если включен `--use-openssl-ca`, это переопределяет и устанавливает файл OpenSSL, содержащий доверительные сертификаты.

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
