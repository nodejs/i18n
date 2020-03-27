# 커맨드 라인 옵션

<!--introduced_in=v5.9.1-->
<!--type=misc-->

Node.js에는 다양한 CLI 옵션이 있습니다. 옵션에는 빌트인 디버깅, 스크립트를 실행하는 여러가지 방법, 유용한 런타임 옵션을 나타냅니다.

터미널에서 이 설명서 매뉴얼 페이지를 보려면, `man node`를 실행하세요.

## 개요

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node inspect [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

인수 없이 실행하면 [REPL](repl.html)을 시작 합니다.

_For more info about `node inspect`, please see the [debugger](debugger.html) documentation._

## 옵션
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

노드 옵션의 끝을 나타냅니다. 인수의 나머지 부분을 스크립트에 넘깁니다. 스크립트 파일이름이 없거나 스크립트 eval/프린트가 이전에 있는 경우에 다음 인수는 스크립트 파일 이름으로 사용 됩니다.

### `--abort-on-uncaught-exception`
<!-- YAML
added: v0.10
-->

종료 하는 대신 디버거(`lldb`, `gdb`, `mdb` 등)를 사용한 사후 분석을 위한 핵심 파일을 생성하고 중단합니다.

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

시작할 때 FIPS 호환 암호화를 사용 합니다. (Requires Node.js to be built with `./configure --openssl-fips`.)

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

시작할 때 FIPS 호환 암호화를 강제합니다. (Cannot be disabled from script code.) (Same requirements as `--enable-fips`.)

### `--icu-data-dir=file`
<!-- YAML
added: v0.11.15
-->

ICU 데이터 로드 경로 지정 합니다. (Overrides `NODE_ICU_DATA`.)

### `--inspect-brk[=[host:]port]`
<!-- YAML
added: v7.6.0
-->

Activate inspector on `host:port` and break at start of user script. Default `host:port` is `127.0.0.1:9229`.

### `--inspect-port=[host:]port`
<!-- YAML
added: v7.6.0
-->

Set the `host:port` to be used when the inspector is activated. `SIGUSR1`신호를 보내 인스팩터를 활성화할 때 유용합니다.

Default host is `127.0.0.1`.

See the [security warning](#inspector_security) below regarding the `host` parameter usage.

### `--inspect[=[host:]port]`
<!-- YAML
added: v6.3.0
-->

Activate inspector on `host:port`. Default is `127.0.0.1:9229`.

V8 인스펙터 통합을 통해 Chrome DevTools 및 IDE와 같은 도구가 Node.js 인스턴스를 디버그하고 프로파일링 할 수 있습니다. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

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

폐지 예정 경고를 무시합니다.

### `--no-force-async-hooks-checks`
<!-- YAML
added: v9.0.0
-->

Disables runtime checks for `async_hooks`. These will still be enabled dynamically when `async_hooks` is enabled.

### `--no-warnings`
<!-- YAML
added: v6.0.0
-->

(폐지 예정을 포함한) 모든 프로세스 경고를 무시합니다.

### `--openssl-config=file`
<!-- YAML
added: v6.9.0
-->

시작할 때 OpenSSL 설정 파일을 불러옵니다. Node.js가 `./configure --openssl-fips`로 빌드되었다면, FIPS 호환 암호화를 활성화하는 데 사용할 수 있습니다.

### `--pending-deprecation`
<!-- YAML
added: v8.0.0
-->

보류중인 지원 중단 경고를 내보냅니다.

Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

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

Write process warnings to the given file instead of printing to stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead.

### `--throw-deprecation`
<!-- YAML
added: v0.11.14
-->

Throw errors for deprecations.

### `--title=title`
<!-- YAML
added: v10.7.0
-->

Set `process.title` on startup.

### `--tls-cipher-list=list`
<!-- YAML
added: v4.0.0
-->

Specify an alternative default TLS cipher list. Requires Node.js to be built with crypto support (default).

### `--trace-deprecation`
<!-- YAML
added: v0.8.0
-->

Print stack traces for deprecations.

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

Prints a stack trace whenever synchronous I/O is detected after the first turn of the event loop.

### `--trace-warnings`
<!-- YAML
added: v6.0.0
-->

(폐지 예정을 포함한) 모든 프로세스 경고의 스택 트레이스를 출력합니다.

### `--track-heap-objects`
<!-- YAML
added: v2.4.0
-->

Track heap object allocations for heap snapshots.

### `--use-bundled-ca`, `--use-openssl-ca`
<!-- YAML
added: v6.11.0
-->

Use bundled Mozilla CA store as supplied by current Node.js version or use OpenSSL's default CA store. The default store is selectable at build-time.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. It is identical on all supported platforms.

Using OpenSSL store allows for external modifications of the store. For most Linux and BSD distributions, this store is maintained by the distribution maintainers and system administrators. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

See `SSL_CERT_DIR` and `SSL_CERT_FILE`.

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

스크립트를 실행하지 않고 구문 검사 합니다.

### `-e`, `--eval "script"`
<!-- YAML
added: v0.5.2
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

뒤의 인수를 JavaScript로 평가합니다. `script`에서 REPL에 미리 정의 된 모듈도 사용할 수 있습니다.

On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.

### `-h`, `--help`
<!-- YAML
added: v0.1.3
-->

Node 커맨드 라인 옵션을 출력합니다. 이 옵션의 출력은 이 문서를 보다 덜 자세합니다.

### `-i`, `--interactive`
<!-- YAML
added: v0.7.7
-->

Stdin이 터미널로 보이지 않는 경우에도 REPL을 엽니다.

### `-p`, `--print "script"`
<!-- YAML
added: v0.6.4
changes:
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

`-e`와 동일하지만 결과를 출력합니다.

### `-r`, `--require module`
<!-- YAML
added: v1.6.0
-->

시작할 때 지정된 모듈을 미리 로드 합니다.

`require()`의 모듈 해석 규칙을 따릅니다. `module`은 파일 경로이거나 node 모듈 이름일 수 있습니다.

### `-v`, `--version`
<!-- YAML
added: v0.1.3
-->

Node 버전을 출력합니다.

## 환경 변수

### `NODE_DEBUG=module[,…]`
<!-- YAML
added: v0.1.32
-->

`','`-separated list of core modules that should print debug information.

### `NODE_DEBUG_NATIVE=module[,…]`

`','`-separated list of core C++ modules that should print debug information.

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

This environment variable is ignored when `node` runs as setuid root or has Linux file capabilities set.

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

다음 V8 옵션이 허용됩니다.
- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PATH=path[:…]`
<!-- YAML
added: v0.1.32
-->

모듈 탐색 경로의 앞에 붙일 `':'`로 구분된 디렉토리 리스트.

On Windows, this is a `';'`-separated list instead.

### `NODE_PENDING_DEPRECATION=1`
<!-- YAML
added: v8.0.0
-->

`1`로 설정하면, 보류중인 지원 중단 경고를 내보냅니다.

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

When set, process warnings will be emitted to the given file instead of printing to stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead. This is equivalent to using the `--redirect-warnings=file` command-line flag.

### `NODE_REPL_HISTORY=file`
<!-- YAML
added: v3.0.0
-->

Path to the file used to store the persistent REPL history. The default path is `~/.node_repl_history`, which is overridden by this variable. Setting the value to an empty string (`''` or `' '`) disables persistent REPL history.

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

시작할 때 OpenSSL 설정 파일을 불러옵니다. Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
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
