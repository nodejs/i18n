# 跟踪

<!--introduced_in=v7.7.0-->

跟踪事件提供了一种集中跟踪 V8，Node 核心，以及用户空间代码生成信息的机制。

当启动 Node.js 应用程序时，可通过传递 `--trace-events-enabled` 标志来启用跟踪。

可以通过使用 `--trace-event-categories` 标志以及随后的用逗号分隔的类别名，来指定记录跟踪的类别集。 默认情况下，将启用 `node`, `node.async_hooks`, 和 `v8` 类别。

```txt
node --trace-events-enabled --trace-event-categories v8,node,node.async_hooks server.js
```

在启用跟踪的情况下运行 Node.js 将生成日志文件，这些文件可以在 [`chrome://tracing`](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) 选项卡中打开。

The logging file is by default called `node_trace.${rotation}.log`, where `${rotation}` is an incrementing log-rotation id. The filepath pattern can be specified with `--trace-event-file-pattern` that accepts a template string that supports `${rotation}` and `${pid}`. 例如：

```txt
node --trace-events-enabled --trace-event-file-pattern '${pid}-${rotation}.log' server.js
```

Starting with Node 10.0.0, the tracing system uses the same time source as the one used by `process.hrtime()` however the trace-event timestamps are expressed in microseconds, unlike `process.hrtime()` which returns nanoseconds.
