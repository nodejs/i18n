# Кластер

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Один экземпляр Node.js запускается в одном потоке. To take advantage of multi-core systems, the user will sometimes want to launch a cluster of Node.js processes to handle the load.

The cluster module allows easy creation of child processes that all share server ports.

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
  // Рабочие процессы могут разделять любое соединение TCP 
  // В данном случае это HTTP-сервер
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

Теперь Node.js при запуске разделит порт 8000 между рабочими процессами:

```txt
$ node server.js
Основной процесс 3596 работает
Рабочий процесс 4324 запущен
Рабочий процесс 4520 запущен
Рабочий процесс 6056 запущен
Рабочий процесс 5644 запущен
```

Please note that on Windows, it is not yet possible to set up a named pipe server in a worker.

## Как это работает

<!--type=misc-->

The worker processes are spawned using the [`child_process.fork()`][] method, so that they can communicate with the parent via IPC and pass server handles back and forth.

The cluster module supports two methods of distributing incoming connections.

The first one (and the default one on all platforms except Windows), is the round-robin approach, where the master process listens on a port, accepts new connections and distributes them across the workers in a round-robin fashion, with some built-in smarts to avoid overloading a worker process.

The second approach is where the master process creates the listen socket and sends it to interested workers. The workers then accept incoming connections directly.

Теоретически второй метод должен давать лучшие результаты. In practice however, distribution tends to be very unbalanced due to operating system scheduler vagaries. Loads have been observed where over 70% of all connections ended up in just two processes, out of a total of eight.

Because `server.listen()` hands off most of the work to the master process, there are three cases where the behavior between a normal Node.js process and a cluster worker differs:

1. `server.listen({fd: 7})` Because the message is passed to the master, file descriptor 7 **in the parent** will be listened on, and the handle passed to the worker, rather than listening to the worker's idea of what the number 7 file descriptor references.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

*Note*: Node.js does not provide routing logic. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. As long as there are some workers still alive, the server will continue to accept connections. If no workers are alive, existing connections will be dropped and new connections will be refused. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Although a primary use case for the `cluster` module is networking, it can also be used for other use cases requiring worker processes.

## Класс: Worker

<!-- YAML
added: v0.7.0
-->

Объект Worker содержит всю открытую информацию и методику о рабочем процессе. В основном процессе это можно получить через `cluster.workers`. In a worker it can be obtained using `cluster.worker`.

### Событие: 'disconnect'

<!-- YAML
added: v0.7.7
-->

Аналогично событию `cluster.on('disconnect')`, но для данного конкретного рабочего процесса.

```js
cluster.fork().on('disconnect', () => {
  // Рабочий процесс отключился
});
```

### Событие: 'error'

<!-- YAML
added: v0.7.3
-->

Это то же самое событие, которое предоставляется [`child_process.fork()`][].

Within a worker, `process.on('error')` may also be used.

### Событие: 'exit'

<!-- YAML
added: v0.11.2
-->

* `code` {number} Код завершения, если процесс заканчивается нормально.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

Аналогично событию `cluster.on('exit')`, но для данного конкретного рабочего процесса.

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

### Событие: 'listening'

<!-- YAML
added: v0.7.0
-->

* `address` {Object}

Аналогично событию `cluster.on('listening')`, но для данного конкретного рабочего процесса.

```js
cluster.fork().on('listening', (address) => {
  // Рабочий процесс прослушивает
});
```

Не создается в рабочем процессе.

### Событие: 'message'

<!-- YAML
added: v0.7.0
-->

* `message` {Object}
* `handle` {undefined|Object}

Аналогично событию `cluster.on('message')`, но для данного конкретного рабочего процесса.

Within a worker, `process.on('message')` may also be used.

Смотрите [`process` event: `'message'`][].

Here is an example using the message system. It keeps a count in the master process of the number of HTTP requests received by the workers:

```js
const cluster = require('cluster');
const http = require('http');

if (cluster.isMaster) {

  // Отслеживание запросов http 
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // Подсчет запросов
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // Запуск рабочих процессов и прослушивание сообщений, содержащих notifyRequest
  const numCPUs = require('os').cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

} else {

  // Рабочие процессы имеют http-сервер.
  http.Server((req, res) => {
    res.writeHead(200);
    res.end('hello world\n');

    // уведомить основной процесс о запросе
    process.send({ cmd: 'notifyRequest' });
  }).listen(8000);
}
```

### Событие: 'online'

<!-- YAML
added: v0.7.0
-->

Аналогично событию `cluster.on('online')`, но для данного конкретного рабочего процесса.

```js
cluster.fork().on('online', () => {
  // Рабочий процесс online
});
```

Не создается в рабочем процессе.

### worker.disconnect()

<!-- YAML
added: v0.7.7
changes:

  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10019
    description: This method now returns a reference to `worker`.
-->

* Возвращает: {cluster.Worker} Ссылка на `worker`.

In a worker, this function will close all servers, wait for the `'close'` event on those servers, and then disconnect the IPC channel.

In the master, an internal message is sent to the worker causing it to call `.disconnect()` on itself.

Приводит к установке `.exitedAfterDisconnect`.

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
    // соединения никогда не завершаются
  });

  server.listen(8000);

  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      // инициируйте постепенное закрытие любых соединений с сервером
    }
  });
}
```

### worker.exitedAfterDisconnect

<!-- YAML
added: v6.0.0
-->

* {boolean}

Установка с помощью `.kill()` или `.disconnect()`. До тех пор, пока это `не определено`.

The boolean `worker.exitedAfterDisconnect` allows distinguishing between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.exitedAfterDisconnect === true) {
    console.log('Ох, это было запланировано - не надо волноваться');
  }
});

// завершите рабочий процесс
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

This function returns `true` if the worker is connected to its master via its IPC channel, `false` otherwise. A worker is connected to its master after it has been created. Они разъединяются после выполнения события `'disconnect'`.

### worker.isDead()

<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker's process has terminated (either because of exiting or being signaled). В противном случае она возвращает `false`.

### worker.kill([signal='SIGTERM'])

<!-- YAML
added: v0.9.12
-->

* `signal` {string} Name of the kill signal to send to the worker process.

Эта функция завершит рабочий процесс. In the master, it does this by disconnecting the `worker.process`, and once disconnected, killing with `signal`. In the worker, it does it by disconnecting the channel, and then exiting with code `0`.

Приводит к установке `.exitedAfterDisconnect`.

Для обратной совместимости этот метод также называется `worker.destroy()`.

Note that in a worker, `process.kill()` exists, but it is not this function, it is [`kill`][].

### worker.process

<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

All workers are created using [`child_process.fork()`][], the returned object from this function is stored as `.process`. In a worker, the global `process` is stored.

Смотрите: [Child Process module](child_process.html#child_process_child_process_fork_modulepath_args_options)

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
* Возвращает: {boolean}

Передается сообщение рабочему или основному процессу, опционально с обработчиком.

В основном процессе отправляет сообщение конкретному рабочему процессу. It is identical to [`ChildProcess.send()`][].

В рабочем процессе отправляет сообщение основному. It is identical to `process.send()`.

Этот пример вернет все сообщения от основного процесса:

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

> Стабильность: 0 - Устарело: Вместо этого используйте [`worker.exitedAfterDisconnect`][].

Псевдоним для [`worker.exitedAfterDisconnect`][].

Установка с помощью `.kill()` или `.disconnect()`. До тех пор, пока это `не определено`.

The boolean `worker.suicide` is used to distinguish between voluntary and accidental exit, the master may choose not to respawn a worker based on this value.

```js
cluster.on('exit', (worker, code, signal) => {
  if (worker.suicide === true) {
    console.log('Oh, it was just voluntary – no need to worry');
  }
});

// прекратить рабочий процесс
worker.kill();
```

This API only exists for backwards compatibility and will be removed in the future.

## Событие: 'disconnect'

<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Создается после отсоединения канала IPC рабочего процесса. This can occur when a worker exits gracefully, is killed, or is disconnected manually (such as with worker.disconnect()).

Может возникнуть задержка между событиями `'disconnect'` и `'exit'`. These events can be used to detect if the process is stuck in a cleanup or if there are long-living connections.

```js
cluster.on('disconnect', (worker) => {
  console.log(`Рабочий процесс #${worker.id} отсоединен`);
});
```

## Событие: 'exit'

<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}
* `code` {number} Код завершения, если процесс заканчивается нормально.
* `signal` {string} The name of the signal (e.g. `'SIGHUP'`) that caused the process to be killed.

Когда любой из рабочих процессов завершается, модуль кластера создает событие `'exit'`.

Это может быть использовано для перезапуска рабочего процесса с помощью повторного вызова `.fork()`.

```js
cluster.on('exit', (worker, code, signal) => {
  console.log('worker %d died (%s). restarting...',
              worker.process.pid, signal || code);
  cluster.fork();
});
```

Смотрите [child_process event: 'exit'](child_process.html#child_process_event_exit).

## Событие: 'fork'

<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

Когда создается копия нового рабочего процесса, модуль кластера создает событие `'fork'`. This can be used to log worker activity, and create a custom timeout.

```js
const timeouts = [];
function errorMsg() {
  console.error('Должно быть что-то не так с соединением ...');
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

## Событие: 'listening'

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
    `Рабочий процесс теперь подключен к ${address.address}:${address.port}`);
});
```

`addressType` является одним из:

* `4` (TCPv4)
* `6` (TCPv6)
* `-1` (доменной сокет unix)
* `'udp4'` или `'udp6'` (UDP v4 или v6)

## Событие: 'message'

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

Выполняется, когда кластер основного процесса получает сообщение от любого из рабочих процессов.

Смотрите [child_process event: 'message'](child_process.html#child_process_event_message).

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

## Событие: 'online'

<!-- YAML
added: v0.7.0
-->

* `worker` {cluster.Worker}

После создания копии нового рабочего процесса, рабочий процесс должен ответить онлайн-сообщением. Когда основной процесс получает онлайн-сообщение, он выполняет данное событие. The difference between `'fork'` and `'online'` is that fork is emitted when the master forks a worker, and 'online' is emitted when the worker is running.

```js
cluster.on('online', (worker) => {
  console.log('Yay, the worker responded after it was forked');
});
```

## Событие: 'setup'

<!-- YAML
added: v0.7.1
-->

* `settings` {Object}

Выполняется каждый раз, когда вызывается `.setupMaster()`.

The `settings` object is the `cluster.settings` object at the time `.setupMaster()` was called and is advisory only, since multiple calls to `.setupMaster()` can be made in a single tick.

Если важна точность, используйте `cluster.settings`.

## cluster.disconnect([callback])

<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Called when all workers are disconnected and handles are closed.

Вызывает `.disconnect()` для каждого рабочего процесса в `cluster.workers`.

When they are disconnected all internal handles will be closed, allowing the master process to die gracefully if no other event is waiting.

Метод принимает необязательный аргумент обратного вызова, который будет вызван при завершении.

Этот метод может быть вызван только из основного процесса.

## cluster.fork([env])

<!-- YAML
added: v0.6.0
-->

* `env` {Object} Пары ключ/значение для добавления в среду рабочего процесса.
* Возвращает: {cluster.Worker}

Создает новый рабочий процесс.

Этот метод может быть вызван только из основного процесса.

## cluster.isMaster

<!-- YAML
added: v0.8.1
-->

* {boolean}

Истинно, если процесс является основным. This is determined by the `process.env.NODE_UNIQUE_ID`. If `process.env.NODE_UNIQUE_ID` is undefined, then `isMaster` is `true`.

## cluster.isWorker

<!-- YAML
added: v0.6.0
-->

* {boolean}

Истинно, если процесс не является основным (это отрицание `cluster.isMaster`).

## cluster.schedulingPolicy

<!-- YAML
added: v0.11.2
-->

The scheduling policy, either `cluster.SCHED_RR` for round-robin or `cluster.SCHED_NONE` to leave it to the operating system. This is a global setting and effectively frozen once either the first worker is spawned, or `cluster.setupMaster()` is called, whichever comes first.

`SCHED_RR` установлено по умолчанию на всех операционных системах, кроме Windows. Windows will change to `SCHED_RR` once libuv is able to effectively distribute IOCP handles without incurring a large performance hit.

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
  * `execArgv` {Array} List of string arguments passed to the Node.js executable. **По умолчанию:** `process.execArgv`.
  * `exec` {string} File path to worker file. **По умолчанию:** `process.argv[1]`.
  * `args` {Array} String arguments passed to worker. **Default:** `process.argv.slice(2)`.
  * `cwd` {string} Current working directory of the worker process. **Default:** `undefined` (inherits from parent process).
  * `silent` {boolean} Whether or not to send output to parent's stdio. **По умолчанию:** `false`.
  * `stdio` {Array} Настраивает stdio процессов-потомков. Because the cluster module relies on IPC to function, this configuration must contain an `'ipc'` entry. Когда эта опция предоставляется, она отменяет `silent`.
  * `uid` {number} Устанавливает личность пользователя процесса. (См. setuid(2).)
  * `gid` {number} Устанавливает групповой идентификатор процесса. (См. setgid(2).)
  * `inspectPort` {number|Function} Sets inspector port of worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **По умолчанию:** `false`.

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

`setupMaster` используется для изменения поведения 'fork' по умолчанию. Once called, the settings will be present in `cluster.settings`.

Примечание:

* Any settings changes only affect future calls to `.fork()` and have no effect on workers that are already running.
* The *only* attribute of a worker that cannot be set via `.setupMaster()` is the `env` passed to `.fork()`.
* The defaults above apply to the first call only, the defaults for later calls is the current value at the time of `cluster.setupMaster()` is called.

Пример:

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

Этот метод может быть вызван только из основного процесса.

## cluster.worker

<!-- YAML
added: v0.7.0
-->

* {Object}

Ссылка на текущий объект рабочего процесса. Не доступно в основном процессе.

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

Хеш, в котором хранятся активные объекты рабочего процесса, снабжен полем `id`. Makes it easy to loop through all the workers. It is only available in the master process.

A worker is removed from cluster.workers after the worker has disconnected *and* exited. Невозможно заранее определить порядок между этими двумя событиями. However, it is guaranteed that the removal from the cluster.workers list happens before last `'disconnect'` or `'exit'` event is emitted.

```js
// Проверить все рабочие процессы
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