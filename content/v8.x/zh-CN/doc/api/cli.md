# 命令行选项

<!--introduced_in=v5.9.1-->

<!--type=misc-->

Node.js 提供了各式各样的 CLI 选项。 These options expose built-in debugging, multiple ways to execute scripts, and other helpful runtime options.

要将此文档在终端中以手册页的形式查看，运行 `man node`。

## 概要

`node [options] [V8 options] [script.js | -e "script" | -] [--] [arguments]`

`node debug [script.js | -e "script" | <host>:<port>] …`

`node --v8-options`

不附加参数运行以启动 [REPL](repl.html)。

*有关 `node debug` 的更多信息，请参阅 [调试器](debugger.html) 文档。*

## 选项

### `-v`, `--version`

<!-- YAML
added: v0.1.3
-->

打印 node 的版本。

### `-h`, `--help`

<!-- YAML
added: v0.1.3
-->

打印 node 的命令行选项。 The output of this option is less detailed than this document.

### `-e`, `--eval "脚本"`

<!-- YAML
added: v0.5.2
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

将跟随的参数作为 JavaScript 执行。 The modules which are predefined in the REPL can also be used in `script`.

*Note*: On Windows, using `cmd.exe` a single quote will not work correctly because it only recognizes double `"` for quoting. In Powershell or Git bash, both `'` and `"` are usable.

### `-p`, `--print "脚本"`

<!-- YAML
added: v0.6.4
changes:

  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5348
    description: Built-in libraries are now available as predefined variables.
-->

等价于 `-e` 但打印结果。

### `-c`, `--check`

<!-- YAML
added:

  - v5.0.0
  - v4.2.0
-->

对脚本进行语法检查但不执行。

### `-i`, `--interactive`

<!-- YAML
added: v0.7.7
-->

Opens the REPL even if stdin does not appear to be a terminal.

### `-r`, `--require 模块`

<!-- YAML
added: v1.6.0
-->

启动时预加载指定模块。

Follows `require()`'s module resolution rules. `module` 可能是到文件的路径，或一个 node 模块名。

### `--inspect[=[主机:]端口]`

<!-- YAML
added: v6.3.0
-->

Activate inspector on host:port. 默认是 127.0.0.1:9229。

V8 inspector integration allows tools such as Chrome DevTools and IDEs to debug and profile Node.js instances. The tools attach to Node.js instances via a tcp port and communicate using the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer).

### `--inspect-brk[=[主机:]端口]`

<!-- YAML
added: v7.6.0
-->

Activate inspector on host:port and break at start of user script. 默认的 主机:端口 是 127.0.0.1:9229。

### `--inspect-port=[主机:]端口`

<!-- YAML
added: v7.6.0
-->

Set the host:port to be used when the inspector is activated. Useful when activating the inspector by sending the `SIGUSR1` signal.

默认主机是 127.0.0.1。

### `--no-deprecation`

<!-- YAML
added: v0.8.0
-->

禁用弃用警告。

### `--trace-deprecation`

<!-- YAML
added: v0.8.0
-->

打印对弃用的堆栈追踪。

### `--throw-deprecation`

<!-- YAML
added: v0.11.14
-->

为弃用抛出错误。

### `--pending-deprecation`

<!-- YAML
added: v8.0.0
-->

发出待定的弃用警告。

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `--no-warnings`

<!-- YAML
added: v6.0.0
-->

禁用所有进程警告 (包括弃用)。

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

打印对进程警告的堆栈追踪(包括弃用)。

### `--redirect-warnings=文件`

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

打印 V8 的命令行选项。

*Note*: V8 options allow words to be separated by both dashes (`-`) or underscores (`_`).

例如，`--stack-trace-limit` 等价于 `--stack_trace_limit`。

### `--tls-cipher-list=列表`

<!-- YAML
added: v4.0.0
-->

Specify an alternative default TLS cipher list. (Requires Node.js to be built with crypto support. (Default))

### `--enable-fips`

<!-- YAML
added: v6.0.0
-->

启动时启用 FIPS 兼容的加密。 (Requires Node.js to be built with `./configure --openssl-fips`)

### `--force-fips`

<!-- YAML
added: v6.0.0
-->

启动时强制 FIPS 兼容的加密。 (Cannot be disabled from script code.) (Same requirements as `--enable-fips`)

### `--openssl-config=文件`

<!-- YAML
added: v6.9.0
-->

启动时加载一个 OpenSSL 配置文件。 Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure --openssl-fips`.

### `--use-openssl-ca`, `--use-bundled-ca`

<!-- YAML
added: v7.5.0
-->

Use OpenSSL's default CA store or use bundled Mozilla CA store as supplied by current Node.js version. The default store is selectable at build-time.

Using OpenSSL store allows for external modifications of the store. For most Linux and BSD distributions, this store is maintained by the distribution maintainers and system administrators. OpenSSL CA store location is dependent on configuration of the OpenSSL library but this can be altered at runtime using environment variables.

The bundled CA store, as supplied by Node.js, is a snapshot of Mozilla CA store that is fixed at release time. 在所有受支持的平台上都相同。

参见 `SSL_CERT_DIR` 和 `SSL_CERT_FILE`。

### `--icu-data-dir=文件`

<!-- YAML
added: v0.11.15
-->

指定 ICU 数据加载路径。 (overrides `NODE_ICU_DATA`)

### `-`

<!-- YAML
added: v8.0.0
-->

Alias for stdin, analogous to the use of - in other command line utilities, meaning that the script will be read from stdin, and the rest of the options are passed to that script.

### `--`

<!-- YAML
added: v7.5.0
-->

表示 node 选项的结束。 将剩余的参数传递给脚本。 If no script filename or eval/print script is supplied prior to this, then the next argument will be used as a script filename.

### `--max-http-header-size=size`

<!-- YAML
added: v8.15.0
-->

Specify the maximum size, in bytes, of HTTP headers. Defaults to 8KB.

## 环境变量

### `NODE_DEBUG=模块[,…]`

<!-- YAML
added: v0.1.32
-->

`','`-separated list of core modules that should print debug information.

### `NODE_PATH=路径[:…]`

<!-- YAML
added: v0.1.32
-->

`':'`-separated list of directories prefixed to the module search path.

*Note*: On Windows, this is a `';'`-separated list instead.

### `NODE_DISABLE_COLORS=1`

<!-- YAML
added: v0.3.0
-->

当设置为 `1` 时 REPL 中不会使用颜色。

### `NODE_ICU_DATA=文件`

<!-- YAML
added: v0.11.15
-->

Data path for ICU (Intl object) data. Will extend linked-in data when compiled with small-icu support.

### `NODE_NO_WARNINGS=1`

<!-- YAML
added: v7.5.0
-->

当设置为 `1` 时，线程警告会被禁用。

### `NODE_NO_HTTP2=1`

<!-- YAML
added: v8.8.0
-->

When set to `1`, the `http2` module is suppressed.

### `NODE_OPTIONS=选项...`

<!-- YAML
added: v8.0.0
-->

一个用空格分隔的命令行选项列表。 `options...` are interpreted as if they had been specified on the command line before the actual command line (so they can be overridden). Node will exit with an error if an option that is not allowed in the environment is used, such as `-p` or a script file.

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

允许的 V8 选项有：

- `--abort-on-uncaught-exception`
- `--max-old-space-size`
- `--perf-basic-prof`
- `--perf-prof`
- `--stack-trace-limit`

### `NODE_PENDING_DEPRECATION=1`

<!-- YAML
added: v8.0.0
-->

当设置为 `1` 时，发送待定弃用警告。

*Note*: Pending deprecations are generally identical to a runtime deprecation with the notable exception that they are turned *off* by default and will not be emitted unless either the `--pending-deprecation` command line flag, or the `NODE_PENDING_DEPRECATION=1` environment variable, is set. Pending deprecations are used to provide a kind of selective "early warning" mechanism that developers may leverage to detect deprecated API usage.

### `NODE_PRESERVE_SYMLINKS=1`

<!-- YAML
added: v7.1.0
-->

When set to `1`, instructs the module loader to preserve symbolic links when resolving and caching modules.

### `NODE_REPL_HISTORY=文件`

<!-- YAML
added: v3.0.0
-->

Path to the file used to store the persistent REPL history. The default path is `~/.node_repl_history`, which is overridden by this variable. Setting the value to an empty string (`''` or `' '`) disables persistent REPL history.

### `NODE_EXTRA_CA_CERTS=文件`

<!-- YAML
added: v7.3.0
-->

When set, the well known "root" CAs (like VeriSign) will be extended with the extra certificates in `file`. The file should consist of one or more trusted certificates in PEM format. A message will be emitted (once) with [`process.emitWarning()`](process.html#process_process_emitwarning_warning_type_code_ctor) if the file is missing or malformed, but any errors are otherwise ignored.

Note that neither the well known nor extra certificates are used when the `ca` options property is explicitly specified for a TLS or HTTPS client or server.

### `OPENSSL_CONF=文件`

<!-- YAML
added: v7.7.0
-->

启动时加载一个 OpenSSL 配置文件。 Among other uses, this can be used to enable FIPS-compliant crypto if Node.js is built with `./configure
--openssl-fips`.

If the [`--openssl-config`][] command line option is used, the environment variable is ignored.

### `SSL_CERT_DIR=目录`

<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's directory containing trusted certificates.

*Note*: Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `SSL_CERT_FILE=文件`

<!-- YAML
added: v7.7.0
-->

If `--use-openssl-ca` is enabled, this overrides and sets OpenSSL's file containing trusted certificates.

*Note*: Be aware that unless the child environment is explicitly set, this environment variable will be inherited by any child processes, and if they use OpenSSL, it may cause them to trust the same CAs as node.

### `NODE_REDIRECT_WARNINGS=文件`

<!-- YAML
added: v8.0.0
-->

When set, process warnings will be emitted to the given file instead of printing to stderr. The file will be created if it does not exist, and will be appended to if it does. If an error occurs while attempting to write the warning to the file, the warning will be written to stderr instead. This is equivalent to using the `--redirect-warnings=file` command-line flag.

### `UV_THREADPOOL_SIZE=尺寸`

Set the number of threads used in libuv's threadpool to `size` threads.

Asynchronous system APIs are used by Node.js whenever possible, but where they do not exist, libuv's threadpool is used to create asynchronous node APIs based on synchronous system APIs. 使用线程池的 Node.js API 有：

- all `fs` APIs, other than the file watcher APIs and those that are explicitly synchronous
- `crypto.pbkdf2()`
- `crypto.randomBytes()`, unless it is used without a callback
- `crypto.randomFill()`
- `dns.lookup()`
- all `zlib` APIs, other than those that are explicitly synchronous

Because libuv's threadpool has a fixed size, it means that if for whatever reason any of these APIs takes a long time, other (seemingly unrelated) APIs that run in libuv's threadpool will experience degraded performance. In order to mitigate this issue, one potential solution is to increase the size of libuv's threadpool by setting the `'UV_THREADPOOL_SIZE'` environment variable to a value greater than `4` (its current default value). For more information, see the [libuv threadpool documentation](http://docs.libuv.org/en/latest/threadpool.html).