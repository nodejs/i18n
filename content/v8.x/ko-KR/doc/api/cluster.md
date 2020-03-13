# 클러스터

<!--introduced_in=v0.10.0-->

> 안정성: 2 - 안정

하나의 Node.js 인스턴스는 싱글 스레드에서 동작합니다. 사용자는 다중코어 시스템을 활용하고 상황에따라 부하를 조절하기위해 Node.js의 클러스터 프로세스를 실행 할 수 있습니다.

클러스터 모듈은 서버 포트를 공유하는 자식 프로세스를 쉽게 생성할 수 있게 도와줍니다.

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
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

이제 Node.js는 8000번 포트를 worker들과 공유합니다.

```txt
$ node server.js
Master 3596 is running
Worker 4324 started
Worker 4520 started
Worker 6056 started
Worker 5644 started
```

만약 Windows를 사용하신다면, named pipe server를 worker에서 설정하는 것은 아직 불가능합니다.

## 작동 원리

<!--type=misc-->

worker 프로세스들은 [`child_process.fork()`][] 메소드를 통해 생성됩니다. 이 프로세스들은 IPC를 통해 부모프로세스와 통신할 수 있고 서버에 handle들은 주고 받을 수 있습니다.

클러스터 모듈은 연결시도를 분산하는 두가지 방법을 지원합니다.

첫번째(윈도우를 제외한 모든 플랫폼에서 기본설정)는 라운드 로빈 접근법입니다. master 프로세스는 port에서 사용자의 연결을 기다리고, 새로운 연결을 허용하고, worker들에게  이 연결들을 라운드 로빈 방식으로 분산합니다. worker 프로세스 과부하 방지가 내장되어있습니다.

두 번째는 master 프로세스들이 소켓을 생성하고 worker들에게 전송하고 worker들이 연결을 직접 허용하는 방식입니다.

두번째 방식이 이론적으로는 가장 좋은 성능을 내야합니다. 하지만 실제로는, 운영체제 스케쥴러의 변덕때문에 분산이 매우 불균등하게 이루어집니다. Loads have been observed where over 70% of all connections ended up in just two processes, out of a total of eight.

Because `server.listen()` hands off most of the work to the master process, there are three cases where the behavior between a normal Node.js process and a cluster worker differs:

1. `server.listen({fd: 7})` Because the message is passed to the master, file descriptor 7 **in the parent** will be listened on, and the handle passed to the worker, rather than listening to the worker's idea of what the number 7 file descriptor references.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

*Note*: Node.js does not provide routing logic. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. As long as there are some workers still alive, the server will continue to accept connections. If no workers are alive, existing connections will be dropped and new connections will be refused. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Although a primary use case for the `cluster` module is networking, it can also be used for other use cases requiring worker processes.

## Class: Worker
<!-- YAML
added: v0.7.0
-->

Worker 오브젝트는 worker에 관련된 public 메소드와 정보들을 가지고 있습니다. master에서는 `cluster.workers`를 worker에서는 `cluster.worker`를 사용해 Worker 오브젝트를 받아올 수 있습니다.

### Event: 'disconnect'
<!-- YAML
added: v0.7.7
-->

`cluster.on('disconnect')` event와 비슷하지만, 해당 worker 오브젝트에만 적용됩니다 .

```js
cluster.fork().on('disconnect', () => {
  // Worker가 종료되었습니다.
});
```

### Event: 'error'
<!-- YAML
added: v0.7.3
-->

이 이벤트는 [`child_process.fork()`][].로 얻어지는 것과 일치합니다.

worker 안에서는, `process.on('error')` 도 사용됩니다.

### Event: 'exit'
<!-- YAML
added: v0.11.2
-->

* `code` {number} exit code, 비정상적으로 종료된 경우 출력
* `signal` {string} '예시) `'SIGHUP'`' 프로세스를 종료하게된 원인 signal의 이름.

`cluster.on('exit')` event와 비슷하지만, 해당 worker 오브젝트에만 적용됩니다.

```js
const worker = cluster.fork();
worker.on('exit', (code, signal) => {
  if (signal) {
    console.log(`worker가 다음 signal에 의해 종료되었습니다.: ${signal}`);
  } else if (code !== 0) {
    console.log(`worker가 다음 에러 코드와 함께 종료되었습니다.: ${code}`);
  } else {
    console.log('worker success!');
  }
});
```

### Event: 'listening'
<!-- YAML
added: v0.7.0
-->

* `address` {Object}

`cluster.on('listening')` event와 비슷하지만, 해당 worker에만 적용됩니다.

```js
cluster.fork().on('listening', (address) => {
  // Worker is listening
});
```

worker 안에서 사용할 수 없습니다.

### Event: 'message'
<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

`cluster.on('message')` event와 비슷하지만, 해당 worker에만 적용됩니다.

worker 안에서는, `process.on('message')` 도 사용됩니다.

[`process` event: `'message'`][] 를 참고하세요.

Here is an example using the message system. It keeps a count in the master process of the number of HTTP requests received by the workers:

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // http 요청을 추적합니다.
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
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // master 에게 요청정보를 알려준다.
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```

### Event: 'online'
<!-- YAML
added: v0.7.0
-->

`cluster.on('online')` event와 비슷하지만, 해당 worker에만 사용할수 있습니다.

```js
cluster.fork().on('online', () => {
  // worker 가 동작중입니다.
});
```

worker 안에서 사용할 수 없습니다.

### worker.disconnect()
<!-- YAML
added: v0.7.7
changes:
  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* 리턴값: {cluster.Worker} A reference to `worker`.

In a worker, this function will close all servers, wait for the `'close'` event on those servers, and then disconnect the IPC channel.

master에서는, 내부 메세지가 worker에게 전송되어 worker 자신 스스로 `.disconnect()` 를 호출하도록 합니다.

실행 이후에 `.ExitedAfterDisconnect` 가 1로 설정됩니다.

중요. 서버가 종료된 이후 더이상 새로운 연결을 허가 하지 않습니다. 하지만 동작하고 있는 다른 worker에 의해 연결이 허가 될 수 있습니다. 기존연결을 정상적으로 허용 합니다. When no more connections exist, see [`server.close()`][], the IPC channel to the worker will close allowing it to die gracefully.

The above applies *only* to server connections, client connections are not automatically closed by workers, and disconnect does not wait for them to close before exiting.

중요. worker안에는 `process.disconnect` 가 존재합니다, 하지만 이것은 함수가 아니고 [`disconnect`][]입니다.

Because long living server connections may block workers from disconnecting, it may be useful to send a message, so application specific actions may be taken to close them. 타임아웃을 사용하는 것도 유용한 방법입니다. `'disconnect'` event가 일정 시간이 지난 후에도 발생하지 않을 경우 worker를 종료하는 것입니다.

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
    // 연결이 종료되지 않습니다.
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // 서버에 대한 모든 연결을 정상적으로 종료하기 위해 준비
    }
  });
}
```

### worker.exitedAfterDisconnect
<!-- YAML
added: v6.0.0
-->

* {boolean}

`.Kill()` 또는 `.disconnect()`를 호출 하여 1로 만듭니다. 그전까지는 `undefined` 값을 가지게 됩니다.

The boolean `worker.exitedAfterDisconnect` allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// worker를 kill
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

실행 이후에 `.ExitedAfterDisconnect` 가 1로 설정됩니다.

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
* Returns: {boolean}

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

`.Kill()` 또는 `.disconnect()`를 호출 하여 1로 만듭니다. 그전까지는 `undefined` 값을 가지게 됩니다.

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

## Event: 'disconnect'
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

## Event: 'exit'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code` {number} exit code, 비정상적으로 종료된 경우 출력
* `signal` {string} '예시) `'SIGHUP'`' 프로세스를 종료하게된 원인 signal의 이름.

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

## Event: 'fork'
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

## Event: 'listening'
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

The `addressType` is one of:

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (unix domain socket)
* `'udp4'` or `'udp6'` (UDP v4 or v6)

## Event: 'message'
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

## Event: 'online'
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

## Event: 'setup'
<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

Emitted every time `.setupMaster()` is called.

The `settings` object is the `cluster.settings` object at the time `.setupMaster()` was called and is advisory only, since multiple calls to `.setupMaster()` can be made in a single tick.

If accuracy is important, use `cluster.settings`.

## cluster.disconnect([callback])
<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Called when all workers are disconnected and handles are closed.

Calls `.disconnect()` on each worker in `cluster.workers`.

When they are disconnected all internal handles will be closed, allowing the master process to die gracefully if no other event is waiting.

The method takes an optional callback argument which will be called when finished.

This can only be called from the master process.

## cluster.fork([env])
<!-- YAML
added: v0.6.0
-->

* `env` {Object} Key/value pairs to add to worker process environment.
* Returns: {cluster.Worker}

Spawn a new worker process.

This can only be called from the master process.

## cluster.isMaster
<!-- YAML
added: v0.8.1
-->

* {boolean}

True if the process is a master. This is determined by the `process.env.NODE_UNIQUE_ID`. If `process.env.NODE_UNIQUE_ID` is undefined, then `isMaster` is `true`.

## cluster.isWorker
<!-- YAML
added: v0.6.0
-->

* {boolean}

True if the process is not a master (it is the negation of `cluster.isMaster`).

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
  * `execArgv` {Array} List of string arguments passed to the Node.js executable. **Default:** `process.execArgv`.
  * `exec` {string} File path to worker file. **Default:** `process.argv[1]`.
  * `args` {Array} String arguments passed to worker. **Default:** `process.argv.slice(2)`.
  * `cwd` {string} Current working directory of the worker process. **Default:** `undefined` (inherits from parent process).
  * `silent` {boolean} Whether or not to send output to parent's stdio. **Default:** `false`.
  * `stdio` {Array} Configures the stdio of forked processes. Because the cluster module relies on IPC to function, this configuration must contain an `'ipc'` entry. When this option is provided, it overrides `silent`.
  * `uid` {number} Sets the user identity of the process. (See setuid(2).)
  * `gid` {number} Sets the group identity of the process. (See setgid(2).)
  * `inspectPort` {number|Function} Sets inspector port of worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **Default:** `false`.

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

Example:

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
