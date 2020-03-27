# Cluster

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

一个 Node.js 单实例在一个线程中运行。 为了利用多核系统，用户有事想要启动 Node.js 集群来处理负载。

cluster 模块允许轻松创建所有服务器端口都共享的子进程。

```js
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers 可以共享任意 TCP 连接
  // 在这个例子中，它是一个 HTTP 服务器
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

运行中的 Node.js 程序将在所有 Worker 之间共享8000端口：

```txt
$ node server.js
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

请注意，在 Windows 中，还不能为 Worker 设置命名管道服务器。

## 工作原理

<!--type=misc-->

Worker 进程使用 [`child_process.fork()`][] 方法产生，它们可以通过 IPC 与父进程通信并来回传递服务器句柄。

cluster 模块支持两种分发传入连接的方法。

第一个(除 Windows 之外的所有平台的默认的那个)是轮询方法，master 进程侦听端口，接受新的连接并且通过轮询 Worker 的方式分发，通过一些内置的机制来避免重复加载Worker 进程。

第二种方法 master 进程创建侦听 socket 并将其发送给有关 Worker。 然后，Worker 直接接受传入的连接。

从理论上来讲，第二种方法的性能表现最好。 然而，在实践中，由于操作系统调度程序的反复无常，分发往往非常不平衡。 从以观察到的负载来看，总共8个进程当中，超过70%的连接仅在两个进程中结束。

因为 `server.listen()` 将大部分的工作都交给了 master 进程，在以下三种情况下，一个正常 Node.js 进程和一个 cluster Worker 进程之间的行为表现不同：

1. `server.listen({fd: 7})` Because the message is passed to the master, file descriptor 7 **in the parent** will be listened on, and the handle passed to the worker, rather than listening to the worker's idea of what the number 7 file descriptor references.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

*Note*: Node.js does not provide routing logic. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. As long as there are some workers still alive, the server will continue to accept connections. If no workers are alive, existing connections will be dropped and new connections will be refused. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Although a primary use case for the `cluster` module is networking, it can also be used for other use cases requiring worker processes.

## 类: Worker
<!-- YAML
added: v0.7.0
-->

A Worker object contains all public information and method about a worker. In the master it can be obtained using `cluster.workers`. In a worker it can be obtained using `cluster.worker`.

### 事件: 'disconnect'
<!-- YAML
added: v0.7.7
-->

Similar to the `cluster.on('disconnect')` event, but specific to this worker.

```js
cluster.fork().on('disconnect', () => {
  // Worker已经断开连接
});
```

### 事件: 'error'
<!-- YAML
added: v0.7.3
-->

This event is the same as the one provided by [`child_process.fork()`][].

Within a worker, `process.on('error')` may also be used.

### 事件：'exit'
<!-- YAML
added: v0.11.2
-->

* `code` {number} The exit code, if it exited normally.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

Similar to the `cluster.on('exit')` event, but specific to this worker.

```js
const worker = cluster.fork();
worker.on('exit', (code, signal) => {
  if (signal) {
    console.log(`worker was killed by signal: ${signal}`);
  } else if (code !== 0) {
    console.log(`worker exited with error code: ${code}`);
  } else {
    console.log('worker success!');
  }
});
```

### 事件：'listening'
<!-- YAML
added: v0.7.0
-->

* `address` {Object}

Similar to the `cluster.on('listening')` event, but specific to this worker.

```js
cluster.fork().on('listening', (address) => {
  // Worker is listening
});
```

It is not emitted in the worker.

### 事件：'message'
<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

Similar to the `cluster.on('message')` event, but specific to this worker.

Within a worker, `process.on('message')` may also be used.

See [`process` event: `'message'`][].

Here is an example using the message system. It keeps a count in the master process of the number of HTTP requests received by the workers:

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // Keep track of http requests
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // Count requests
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // Start workers and listen for messages containing notifyRequest
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

} else {

  // Worker processes have a http server.
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // notify master about the request
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```

### 事件: 'online'
<!-- YAML
added: v0.7.0
-->

Similar to the `cluster.on('online')` event, but specific to this worker.

```js
cluster.fork().on('online', () => {
  // Worker is online
});
```

It is not emitted in the worker.

### worker.disconnect()
<!-- YAML
added: v0.7.7
changes:
  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* Returns: {cluster.Worker} A reference to `worker`.

In a worker, this function will close all servers, wait for the `'close'` event on those servers, and then disconnect the IPC channel.

In the master, an internal message is sent to the worker causing it to call `.disconnect()` on itself.

Causes `.exitedAfterDisconnect` to be set.

Note that after a server is closed, it will no longer accept new connections, but connections may be accepted by any other listening worker. Existing connections will be allowed to close as usual. When no more connections exist, see [`server.close()`][], the IPC channel to the worker will close allowing it to die gracefully.

The above applies *only* to server connections, client connections are not automatically closed by workers, and disconnect does not wait for them to close before exiting.

Note that in a worker, `process.disconnect` exists, but it is not this function, it is [`disconnect`][].

Because long living server connections may block workers from disconnecting, it may be useful to send a message, so application specific actions may be taken to close them. It also may be useful to implement a timeout, killing a worker if the `'disconnect'` event has not been emitted after some time.

```js
if (cluster.isMaster) {
  const worker = cluster.fork();
  let timeout;

  worker.on('listening', (address) => {
    worker.send('shutdown');
    worker.disconnect();
    timeout = setTimeout(() => {
      worker.kill();
    }, 2000);
  });

  worker.on('disconnect', () => {
    clearTimeout(timeout);
  });

} else if (cluster.isWorker) {
  const net = require('net');
  const server = net.createServer((socket) => {
    // connections never end
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // initiate graceful close of any connections to server
    }
  });
}
```

### worker.exitedAfterDisconnect
<!-- YAML
added: v6.0.0
-->

* {boolean}

Set by calling `.kill()` or `.disconnect()`. Until then, it is `undefined`.

The boolean `worker.exitedAfterDisconnect` allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// kill worker
worker.kill();
```

### worker.id
<!-- YAML
added: v0.8.0
-->

* {number}

Each new worker is given its own unique id, this id is stored in the `id`.

While a worker is alive, this is the key that indexes it in cluster.workers

### worker.isConnected()
<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker is connected to its master via its IPC channel, `false` otherwise. A worker is connected to its master after it has been created. It is disconnected after the `'disconnect'` event is emitted.

### worker.isDead()
<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker's process has terminated (either because of exiting or being signaled). Otherwise, it returns `false`.

### worker.kill([signal='SIGTERM'])
<!-- YAML
added: v0.9.12
-->

* `signal` {string} Name of the kill signal to send to the worker process.

This function will kill the worker. In the master, it does this by disconnecting the `worker.process`, and once disconnected, killing with `signal`. In the worker, it does it by disconnecting the channel, and then exiting with code `0`.

Causes `.exitedAfterDisconnect` to be set.

This method is aliased as `worker.destroy()` for backwards compatibility.

Note that in a worker, `process.kill()` exists, but it is not this function, it is [`kill`][].

### worker.process
<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

All workers are created using [`child_process.fork()`][], the returned object from this function is stored as `.process`. In a worker, the global `process` is stored.

See: [Child Process module](child_process.html#child_process_child_process_fork_modulepath_args_options)

Note that workers will call `process.exit(0)` if the `'disconnect'` event occurs on `process` and `.exitedAfterDisconnect` is not `true`. This protects against accidental disconnection.

### worker.send(message\[, sendHandle\]\[, callback\])
<!-- YAML
added: v0.7.0
changes:
  - version: v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2620
    description: The `callback` parameter is supported now.
-->

* `message` {Object}
* `sendHandle` {Handle}
* `callback` {Function}
* 返回: {boolean}

Send a message to a worker or master, optionally with a handle.

In the master this sends a message to a specific worker. It is identical to [`ChildProcess.send()`][].

In a worker this sends a message to the master. It is identical to `process.send()`.

This example will echo back all messages from the master:

```js
if (cluster.isMaster) {
  const worker = cluster.fork();
  worker.send('hi there');

} else if (cluster.isWorker) {
  process.on('message', (msg) => {
    process.send(msg);
  });
}
```

### worker.suicide
<!-- YAML
added: v0.7.0
deprecated: v6.0.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/3747
    description: Accessing this property will now emit a deprecation warning.
-->

> Stability: 0 - Deprecated: Use [`worker.exitedAfterDisconnect`][] instead.

An alias to [`worker.exitedAfterDisconnect`][].

Set by calling `.kill()` or `.disconnect()`. Until then, it is `undefined`.

The boolean `worker.suicide` is used to distinguish between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.suicide === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// kill worker
worker.kill();
```

This API only exists for backwards compatibility and will be removed in the future.

## 事件：'disconnect'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Emitted after the worker IPC channel has disconnected. This can occur when a worker exits gracefully, is killed, or is disconnected manually (such as with worker.disconnect()).

There may be a delay between the `'disconnect'` and `'exit'` events. These events can be used to detect if the process is stuck in a cleanup or if there are long-living connections.

```js
cluster.on('disconnect', (worker) => {
  console.log(`The worker #${worker.id} has disconnected`);
});
```

## 事件: 'exit'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code` {number} The exit code, if it exited normally.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

When any of the workers die the cluster module will emit the `'exit'` event.

This can be used to restart the worker by calling `.fork()` again.

```js
cluster.on('exit', (worker, code, signal) => {
  console.log('worker %d died (%s). restarting...',
              worker.process.pid, signal || code);
  cluster.fork();
});
```

See [child_process event: 'exit'](child_process.html#child_process_event_exit).

## 事件: 'fork'
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

When a new worker is forked the cluster module will emit a `'fork'` event. This can be used to log worker activity, and create a custom timeout.

```js
const timeouts = [];
function errorMsg() {
  console.error('Something must be wrong with the connection ...');
}

cluster.on('fork', (worker) => {
  timeouts[worker.id] = setTimeout(errorMsg, 2000);
});
cluster.on('listening', (worker, address) => {
  clearTimeout(timeouts[worker.id]);
});
cluster.on('exit', (worker, code, signal) => {
  clearTimeout(timeouts[worker.id]);
  errorMsg();
});
```

## 事件: 'listening'
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}
* `address` {Object}

After calling `listen()` from a worker, when the `'listening'` event is emitted on the server a `'listening'` event will also be emitted on `cluster` in the master.

The event handler is executed with two arguments, the `worker` contains the worker object and the `address` object contains the following connection properties: `address`, `port` and `addressType`. This is very useful if the worker is listening on more than one address.

```js
cluster.on('listening', (worker, address) => {
  console.log(
    `A worker is now connected to ${address.address}:${address.port}`);
});
```

`addressType` 为下列之一：

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (unix domain socket)
* `'udp4'` 或 `'udp6'` (UDP v4 或 v6)

## 事件: 'message'
<!-- YAML
added: v2.5.0
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5361
    description: The `worker` parameter is passed now; see below for details.
-->

* `worker` {cluster.Worker}
* `message` {Object}
* `handle` {undefined|Object}

Emitted when the cluster master receives a message from any worker.

See [child_process event: 'message'](child_process.html#child_process_event_message).

Before Node.js v6.0, this event emitted only the message and the handle, but not the worker object, contrary to what the documentation stated.

If support for older versions is required but a worker object is not required, it is possible to work around the discrepancy by checking the number of arguments:

```js
cluster.on('message', (worker, message, handle) => {
  if (arguments.length === 2) {
    handle = message;
    message = worker;
    worker = undefined;
  }
  // ...
});
```

## 事件: 'online'
<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

After forking a new worker, the worker should respond with an online message. When the master receives an online message it will emit this event. The difference between `'fork'` and `'online'` is that fork is emitted when the master forks a worker, and 'online' is emitted when the worker is running.

```js
cluster.on('online', (worker) => {
  console.log('Yay, the worker responded after it was forked');
});
```

## 事件: 'setup'
<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

每当 `.setupMaster()` 被调用后触发。

The `settings` object is the `cluster.settings` object at the time `.setupMaster()` was called and is advisory only, since multiple calls to `.setupMaster()` can be made in a single tick.

If accuracy is important, use `cluster.settings`.

## cluster.disconnect([callback])
<!-- YAML
added: v0.7.7
-->

* `callback` {Function} 当所有的 Worker 都断开连接并且所有的句柄都关闭后调用。

Calls `.disconnect()` on each worker in `cluster.workers`.

When they are disconnected all internal handles will be closed, allowing the master process to die gracefully if no other event is waiting.

The method takes an optional callback argument which will be called when finished.

This can only be called from the master process.

## cluster.fork([env])
<!-- YAML
added: v0.6.0
-->

* `env` {Object} Key/value pairs to add to worker process environment.
* 返回：{cluster.Worker}

Spawn a new worker process.

This can only be called from the master process.

## cluster.isMaster
<!-- YAML
added: v0.8.1
-->

* {boolean}

True 表示当前进程为 master 进程。 这是通过 `process.env.NODE_UNIQUE_ID` 决定的。 如果 `process.env.NODE_UNIQUE_ID` 为 undefined, 则 `isMaster` 为 `true`。

## cluster.isWorker
<!-- YAML
added: v0.6.0
-->

* {boolean}

True 表示当前进程不是 master 进程 (它是 `cluster.isMaster` 的反面)。

## cluster.schedulingPolicy
<!-- YAML
added: v0.11.2
-->

The scheduling policy, either `cluster.SCHED_RR` for round-robin or `cluster.SCHED_NONE` to leave it to the operating system. This is a global setting and effectively frozen once either the first worker is spawned, or `cluster.setupMaster()` is called, whichever comes first.

`SCHED_RR` is the default on all operating systems except Windows. Windows will change to `SCHED_RR` once libuv is able to effectively distribute IOCP handles without incurring a large performance hit.

`cluster.schedulingPolicy` can also be set through the `NODE_CLUSTER_SCHED_POLICY` environment variable. Valid values are `'rr'` and `'none'`.

## cluster.settings
<!-- YAML
added: v0.7.1
changes:
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/18399
    description: The `cwd` option is supported now.
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/17412
    description: The `windowsHide` option is supported now.
  - version: 8.2.0
    pr-url: https://github.com/nodejs/node/pull/14140
    description: The `inspectPort` option is supported now.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* {Object}
  * `execArgv` {Array} List of string arguments passed to the Node.js executable. **默认值：** `process.execArgv`.
  * `exec` {string} File path to worker file. **Default:** `process.argv[1]`.
  * `args` {Array} String arguments passed to worker. **Default:** `process.argv.slice(2)`.
  * `cwd` {string} Current working directory of the worker process. **Default:** `undefined` (inherits from parent process).
  * `silent` {boolean} Whether or not to send output to parent's stdio. **默认:** `false`.
  * `stdio` {Array} Configures the stdio of forked processes. Because the cluster module relies on IPC to function, this configuration must contain an `'ipc'` entry. When this option is provided, it overrides `silent`.
  * `uid` {number} Sets the user identity of the process. (See setuid(2).)
  * `gid` {number} Sets the group identity of the process. (See setgid(2).)
  * `inspectPort` {number|Function} Sets inspector port of worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **默认:** `false`.

After calling `.setupMaster()` (or `.fork()`) this settings object will contain the settings, including the default values.

This object is not intended to be changed or set manually.

## cluster.setupMaster([settings])
<!-- YAML
added: v0.7.1
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7838
    description: The `stdio` option is supported now.
-->

* `settings` {Object} see [`cluster.settings`][]

`setupMaster` is used to change the default 'fork' behavior. Once called, the settings will be present in `cluster.settings`.

Note that:

* Any settings changes only affect future calls to `.fork()` and have no effect on workers that are already running.
* The *only* attribute of a worker that cannot be set via `.setupMaster()` is the `env` passed to `.fork()`.
* The defaults above apply to the first call only, the defaults for later calls is the current value at the time of `cluster.setupMaster()` is called.

例如：

```js
const cluster = require('cluster');
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'https'],
  silent: true
});
cluster.fork(); // https worker
cluster.setupMaster({
  exec: 'worker.js',
  args: ['--use', 'http']
});
cluster.fork(); // http worker
```

This can only be called from the master process.

## cluster.worker
<!-- YAML
added: v0.7.0
-->

* {Object}

A reference to the current worker object. Not available in the master process.

```js
const cluster = require('cluster');

if (cluster.isMaster) {
  console.log('I am master');
  cluster.fork();
  cluster.fork();
} else if (cluster.isWorker) {
  console.log(`I am worker #${cluster.worker.id}`);
}
```

## cluster.workers
<!-- YAML
added: v0.7.0
-->

* {Object}

A hash that stores the active worker objects, keyed by `id` field. Makes it easy to loop through all the workers. It is only available in the master process.

A worker is removed from cluster.workers after the worker has disconnected _and_ exited. The order between these two events cannot be determined in advance. However, it is guaranteed that the removal from the cluster.workers list happens before last `'disconnect'` or `'exit'` event is emitted.

```js
// Go through all workers
function eachWorker(callback) {
  for (const id in cluster.workers) {
    callback(cluster.workers[id]);
  }
}
eachWorker((worker) => {
  worker.send('big announcement to all workers');
});
```

Using the worker's unique id is the easiest way to locate the worker.

```js
socket.on('data', (id) => {
  const worker = cluster.workers[id];
});
```
