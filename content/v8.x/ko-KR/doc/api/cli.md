# 커맨드 라인 옵션

<!--introduced_in=v5.9.1-->
<!--type=misc-->

Node.js에는 다양한 CLI 옵션이 있습니다. 옵션에는 빌트인 디버깅, 스크립트를 실행하는 여러가지 방법, 유용한 런타임 옵션을 나타냅니다.

터미널에서 이 설명서 매뉴얼 페이지를 보려면, `man node`를 실행하세요.


## 개요

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

인수 없이 실행하면 [REPL](repl.html)을 시작 합니다.

_`node debug`에 대 한 자세한 내용은 [디버거](debugger.html) 문서를 참조 하세요._


## 옵션

### `-v`, `--version`
<!-- YAML
added: v0.1.3
-->

Node 버전을 출력합니다.


### `-h`, `--help`
<!-- YAML
added: v0.1.3
-->

Node 커맨드 라인 옵션을 출력합니다. 이 옵션의 출력은 이 문서를 보다 덜 자세합니다.


### `-e`, `--eval "script"`
<!-- YAML
added: v0.5.2
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

뒤의 인수를 JavaScript로 평가합니다. `script`에서 REPL에 미리 정의 된 모듈도 사용할 수 있습니다.

*Note*: On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.


### `-p`, `--print "script"`
<!-- YAML
added: v0.6.4
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

`-e`와 동일하지만 결과를 출력합니다.


### `-c`, `--check`
<!-- YAML
added:
  - v5.0.0
  - v4.2.0
-->

스크립트를 실행하지 않고 구문 검사 합니다.


### `-i`, `--interactive`
<!-- YAML
added: v0.7.7
-->

Stdin이 터미널로 보이지 않는 경우에도 REPL을 엽니다.


### `-r`, `--require module`
<!-- YAML
added: v1.6.0
-->

시작할 때 지정된 모듈을 미리 로드 합니다.

`require()`의 모듈 해석 규칙을 따릅니다. `module`은 파일 경로이거나 node 모듈 이름일 수 있습니다.


### `--inspect[=[host:]port]`
<!-- YAML
added: v6.3.0
-->

host:port에 인스팩터를 활성화합니다. 기본값은 127.0.0.1:9229입니다.

V8 인스펙터 통합을 통해 Chrome DevTools 및 IDE와 같은 도구가 Node.js 인스턴스를 디버그하고 프로파일링 할 수 있습니다. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer).


### `--inspect-brk[=[host:]port]`
<!-- YAML
added: v7.6.0
-->

host:port에 인스팩터를 활성화하고, 유저 스크립트의 시작에서 중단(break)합니다. host:port의 기본값은 127.0.0.1:9229입니다.


### `--inspect-port=[host:]port`
<!-- YAML
added: v7.6.0
-->

인스팩터 활성화에 사용되는 host:port를 설정합니다. `SIGUSR1`신호를 보내 인스팩터를 활성화할 때 유용합니다.

호스트의 기본값은 127.0.0.1입니다.


### `--no-deprecation`
<!-- YAML
added: v0.8.0
-->

폐지 예정 경고를 무시합니다.


### `--trace-deprecation`
<!-- YAML
added: v0.8.0
-->

Print stack traces for deprecations.


### `--throw-deprecation`
<!-- YAML
added: v0.11.14
-->

Throw errors for deprecations.

### `--pending-deprecation`
<!-- YAML
added: v8.0.0
-->

보류중인 지원 중단 경고를 내보냅니다.

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `--no-warnings`
<!-- YAML
added: v6.0.0
-->

(폐지 예정을 포함한) 모든 프로세스 경고를 무시합니다.

### `--expose-http2`
<!-- YAML
added: v8.4.0
-->

Enable the experimental `'http2'` module.

### `--abort-on-uncaught-exception`
<!-- YAML
added: v0.10
-->

종료 하는 대신 디버거(`lldb`, `gdb`, `mdb` 등)를 사용한 사후 분석을 위한 핵심 파일을 생성하고 중단합니다.

### `--trace-warnings`
<!-- YAML
added: v6.0.0
-->

(폐지 예정을 포함한) 모든 프로세스 경고의 스택 트레이스를 출력합니다.

### `--redirect-warnings=file`
<!-- YAML
added: v8.0.0
-->

Write process warnings to the given file instead of printing to stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead.

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

Enables the collection of trace event tracing information.

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

Note, however, that using `--preserve-symlinks` can have other side effects. Specifically, symbolically linked *native* modules can fail to load if those are linked from more than one location in the dependency tree (Node.js would see those as two separate modules and would attempt to load the module multiple times, causing an exception to be thrown).

### `--track-heap-objects`
<!-- YAML
added: v2.4.0
-->

Track heap object allocations for heap snapshots.


### `--prof-process`
<!-- YAML
added: v5.2.0
-->

Process V8 profiler output generated using the V8 option `--prof`.


### `--v8-options`
<!-- YAML
added: v0.1.3
-->

Print V8 command line options.

*Note*: V8 options allow words to be separated by both dashes (`-`) or underscores (`_`).

For example, `--stack-trace-limit` is equivalent to `--stack_trace_limit`.

### `--tls-cipher-list=list`
<!-- YAML
added: v4.0.0
-->

Specify an alternative default TLS cipher list. (Requires Node.js to be built with crypto support. (Default))


### `--enable-fips`
<!-- YAML
added: v6.0.0
-->

시작할 때 FIPS 호환 암호화를 사용 합니다. (`./configure --openssl-fips`으로 Node.js를 빌드할 필요가 있습니다)


### `--force-fips`
<!-- YAML
added: v6.0.0
-->

시작할 때 FIPS 호환 암호화를 강제합니다. (스크립트 코드에서해제할 수 없습니다.) (`--enable-fips`와 요구 조건이 같습니다)


### `--openssl-config=file`
<!-- YAML
added: v6.9.0
-->

시작할 때 OpenSSL 설정 파일을 불러옵니다. Node.js가 `./configure --openssl-fips`로 빌드되었다면, FIPS 호환 암호화를 활성화하는 데 사용할 수 있습니다.

### `--use-openssl-ca`, `--use-bundled-ca`
<!-- YAML
added: v7.5.0
-->

Use OpenSSL's default CA store or use bundled Mozilla CA store as supplied by current Node.js version. The default store is selectable at build-time.

Using OpenSSL store allows for external modifications of the store. For most Linux and BSD distributions, this store is maintained by the distribution maintainers and system administrators. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. It is identical on all supported platforms.

See `SSL_CERT_DIR` and `SSL_CERT_FILE`.

### `--icu-data-dir=file`
<!-- YAML
added: v0.11.15
-->

ICU 데이터 로드 경로 지정 합니다. (`NODE_ICU_DATA`를 재정의합니다)


### `-`
<!-- YAML
added: v8.0.0
-->

Alias for stdin, analogous to the use of - in other command line utilities, meaning that the script will be read from stdin, and the rest of the options are passed to that script.


### `--`
<!-- YAML
added: v7.5.0
-->

노드 옵션의 끝을 나타냅니다. 인수의 나머지 부분을 스크립트에 넘깁니다. 스크립트 파일이름이 없거나 스크립트 eval/프린트가 이전에 있는 경우에 다음 인수는 스크립트 파일 이름으로 사용 됩니다.

### `--max-http-header-size=size`
<!-- YAML
added: v8.15.0
-->

Specify the maximum size, in bytes, of HTTP headers. Defaults to 8KB.

## 환경 변수

### `NODE_DEBUG=module[,…]`
<!-- YAML
added: v0.1.32
-->

`','`-separated list of core modules that should print debug information.


### `NODE_PATH=path[:…]`
<!-- YAML
added: v0.1.32
-->

모듈 탐색 경로의 앞에 붙일 `':'`로 구분된 디렉토리 리스트.

*Note*: On Windows, this is a `';'`-separated list instead.


### `NODE_DISABLE_COLORS=1`
<!-- YAML
added: v0.3.0
-->

When set to `1` colors will not be used in the REPL.


### `NODE_ICU_DATA=file`
<!-- YAML
added: v0.11.15
-->

Data path for ICU (Intl object) data. Will extend linked-in data when compiled with small-icu support.

### `NODE_NO_WARNINGS=1`
<!-- YAML
added: v7.5.0
-->

When set to `1`, process warnings are silenced.

### `NODE_NO_HTTP2=1`
<!-- YAML
added: v8.8.0
-->

When set to `1`, the `http2` module is suppressed.

### `NODE_OPTIONS=options...`
<!-- YAML
added: v8.0.0
-->

A space-separated list of command line options. `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

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

다음 V8 옵션이 허용됩니다.
- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PENDING_DEPRECATION=1`
<!-- YAML
added: v8.0.0
-->

`1`로 설정하면, 보류중인 지원 중단 경고를 내보냅니다.

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

Path to the file used to store the persistent REPL history. The default path is `~/.node_repl_history`, which is overridden by this variable. Setting the value to an empty string (`''` or `' '`) disables persistent REPL history.


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

시작할 때 OpenSSL 설정 파일을 불러옵니다. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
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

Asynchronous system APIs are used by Node.js whenever possible, but where they do not exist, libuv's threadpool is used to create asynchronous node APIs based on synchronous system APIs. Node.js APIs that use the threadpool are:

- all `fs` APIs, other than the file watcher APIs and those that are explicitly synchronous
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, unless it is used without a callback
- `crypto.randomFill()`
- `dns.lookup()`
- all `zlib` APIs, other than those that are explicitly synchronous

Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value greater than `4` (its current default value). For more information, see the [libuv threadpool documentation](http://docs.libuv.org/en/latest/threadpool.html).
