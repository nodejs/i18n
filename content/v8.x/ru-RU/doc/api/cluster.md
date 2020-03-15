# Кластер

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Один экземпляр Node.js запускается в одном потоке. Чтобы воспользоваться многоядерной системой, пользователь иногда захочет запустить кластер процессов Node.js для обработки загрузки.

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

Пожалуйста, обратите внимание, что на Windows пока невозможно установить сервер с именованным каналом в рабочем процессе.

## Как это работает

<!--type=misc-->

Рабочие процессы создаются с помощью метода [`child_process.fork()`][], чтобы они могли сообщаться с родительским процессом через IPC и передавать обработчики сервера в оба направления.

Модуль кластера поддерживает два метода распределения входящих соединений.

Первый (тот, что по умолчанию на всех платформах, кроме Windows) - это циклический подход, при котором главный процесс слушает порт, принимает новые соединения и распределяет их между рабочими процессами по циклическому методу с некоторыми встроенными "умными" функциями, которые позволяют избежать перегрузки рабочего процесса.

Второй метод заключается в том, что основной процесс создает "прослушивающий" сокет и посылает его заинтересованным рабочим процессам. В этом случае рабочие процессы принимают входящие соединения напрямую.

Теоретически второй метод должен давать лучшие результаты. Однако на практике распределение становится очень несбалансированным из-за капризной работы планировщика задач операционной системы. Загрузки наблюдались, когда более 70% всех соединений заканчивались всего в двух процессах из восьми.

Поскольку `server.listen()` передает большую часть работы основному процессу, существует три случая, когда отличается поведение между обычным процессом Node.js и рабочим процессом кластера:

1. `server.listen({fd: 7})` Because the message is passed to the master, file descriptor 7 **in the parent** will be listened on, and the handle passed to the worker, rather than listening to the worker's idea of what the number 7 file descriptor references.
2. `server.listen(handle)` Listening on handles explicitly will cause the worker to use the supplied handle, rather than talk to the master process.
3. `server.listen(0)` Normally, this will cause servers to listen on a random port. However, in a cluster, each worker will receive the same "random" port each time they do `listen(0)`. In essence, the port is random the first time, but predictable thereafter. To listen on a unique port, generate a port number based on the cluster worker ID.

*Note*: Node.js does not provide routing logic. It is, therefore important to design an application such that it does not rely too heavily on in-memory data objects for things like sessions and login.

Because workers are all separate processes, they can be killed or re-spawned depending on a program's needs, without affecting other workers. Пока некоторые рабочие процессы существуют, сервер будет продолжать принимать соединения. Если нет выполняемых рабочих процессов, существующие соединения будут сброшены, и новые соединения будут отклонены. Node.js does not automatically manage the number of workers, however. It is the application's responsibility to manage the worker pool based on its own needs.

Хотя основной вариант использования для модуля `cluster` - работа в сети, он также может быть применен для других случаев использования, требующих рабочих процессов.

## Класс: Worker
<!-- YAML
added: v0.7.0
-->

Объект Worker содержит всю открытую информацию и методику о рабочем процессе. В основном процессе это можно получить через `cluster.workers`. В рабочем процессе это можно получить через `cluster.worker`.

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
* `signal` {string} Имя сигнала (например, `'SIGHUP'`), вызвавшего завершение процесса.

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

В рабочем процессе эта функция закроет все серверы, дождется события `'close'` на этих серверах, а затем отключит канал IPC.

В основном процессе внутреннее сообщение отправляется рабочему процессу, заставляя его вызвать `.disconnect()` на себя.

Приводит к установке `.exitedAfterDisconnect`.

Обратите внимание, что сервер после закрытия больше не будет принимать новые соединения, но они могут быть приняты любым другим слушающим рабочим процессом. Существующие соединения могут быть закрыты обычным способом. Когда больше нет подключений, см. [`server.close()`][], канал IPC к рабочему процессу закроется, позволяя серверу закрыться легко.

Вышеуказанное относится *только* к соединениям сервера, клиентские подключения не закрываются автоматически рабочими процессами, а отсоединение не ждет их закрытия перед выходом.

Обратите внимание, что в рабочем процессе есть `process.disconnect`, но это не обсуждаемая функция, а [`disconnect`][].

Так как длительные серверные соединения могут блокировать отключение рабочих процессов, может быть полезным послать сообщение, при котором в приложении совершаются особые действия, помогающие закрыть эти соединения. Также может быть полезно использовать таймаут, который прекратит рабочий процесс, если событие `'disconnect'` не было запущено в течение некоторого времени.

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

Каждый новый рабочий процесс получает свой уникальный идентификатор, этот идентификатор храниться в `id`.

Пока рабочий процесс запущен, этот идентификатор является ключом для индексирования данного процесса в cluster.workers

### worker.isConnected()
<!-- YAML
added: v0.11.14
-->

This function returns `true` if the worker is connected to its master via its IPC channel, `false` otherwise. A worker is connected to its master after it has been created. Они разъединяются после выполнения события `'disconnect'`.

### worker.isDead()
<!-- YAML
added: v0.11.14
-->

Эта функция возвращает `true`, если рабочий процесс был завершен (либо посредством простого выхода, либо по сигналу). В противном случае она возвращает `false`.

### worker.kill([signal='SIGTERM'])
<!-- YAML
added: v0.9.12
-->

* `signal` {string} Название сигнала завершения для отправки рабочему процессу.

Эта функция завершит рабочий процесс. В основном процессе она делает это путем отсоединения `worker.process`, а после отсоединения она завершает процесс с помощью `signal`. В рабочем процессе это происходит путем отсоединения канала и выходом с кодом `0`.

Приводит к установке `.exitedAfterDisconnect`.

Для обратной совместимости этот метод также называется `worker.destroy()`.

Обратите внимание, что в рабочем процессе имеется `process.kill()`, но это не обсуждаемая функция, а [`kill`][].

### worker.process
<!-- YAML
added: v0.7.0
-->

* {ChildProcess}

Все рабочие процессы создаются с помощью [`child_process.fork()`][], возвращаемый этой функцией объект хранится в `.process`. В рабочем процессе хранится глобальный `process`.

Смотрите: [Child Process module](child_process.html#child_process_child_process_fork_modulepath_args_options)

Обратите внимание, что рабочие процессы вызовут `process.exit(0)`, если происходит событие `'disconnect'` в `process` и `.exitedAfterDisconnect` не является `true`. Это защищает от случайного отсоединения.

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

В основном процессе отправляет сообщение конкретному рабочему процессу. Идентично [`ChildProcess.send()`][].

В рабочем процессе отправляет сообщение основному. Идентично `process.send()`.

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

Этот API существует только для обратной совместимости и будет удален в будущем.

## Событие: 'disconnect'
<!-- YAML
added: v0.7.9
-->

* `worker` {cluster.Worker}

Создается после отсоединения канала IPC рабочего процесса. Это может произойти, когда рабочий процесс выходит постепенно, завершается или отсоединяется вручную (например, с worker.disconnect()).

Может возникнуть задержка между событиями `'disconnect'` и `'exit'`. Эти события могут быть использованы для обнаружения, застрял ли процесс в очистке или имеются ли в наличии длительные соединения.

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
* `signal` {string} Имя сигнала (например, `'SIGHUP'`), вызвавшего завершение процесса.

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

До Node.js v6.0 это событие создавало только сообщение и отладчик, но не объект рабочего процесса, вопреки тому, что указано в документации.

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

После создания копии нового рабочего процесса, рабочий процесс должен ответить онлайн-сообщением. Когда основной процесс получает онлайн-сообщение, он выполняет данное событие. Разница между `'fork'` и `'online'` в том, что первое происходит, когда основной процесс создает копию рабочего, а второе создается при запуске рабочего процесса.

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

Объект `settings` является объектом `cluster.settings` в момент вызова `.setupMaster()` и носит рекомендательный характер, потому что за один раз можно сделать несколько вызовов `.setupMaster()`.

Если важна точность, используйте `cluster.settings`.

## cluster.disconnect([callback])
<!-- YAML
added: v0.7.7
-->

* `callback` {Function} Вызывается, когда все рабочие процессы отключены и обработчики закрыты.

Вызывает `.disconnect()` для каждого рабочего процесса в `cluster.workers`.

Когда они отключены, все внутренние отладчики будут закрыты, позволяя основному процессу завершиться нормально, если нет других ожидающих событий.

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

Истинно, если процесс является основным. Это определяется `process.env.NODE_UNIQUE_ID`. Если `process.env.NODE_UNIQUE_ID` не определен, тогда `isMaster` будет `true`.

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

Политика планирования: либо `cluster.SCHED_RR` для циклического подхода, либо `cluster.SCHED_NONE` - на усмотрение операционной системы. This is a global setting and effectively frozen once either the first worker is spawned, or `cluster.setupMaster()` is called, whichever comes first.

`SCHED_RR` установлено по умолчанию на всех операционных системах, кроме Windows. Windows перейдет на `SCHED_RR`, как только libuv сможет эффективно распределять обработчики IOCP без значительного снижения производительности.

`cluster.schedulingPolicy` можно также установить через переменную среды `NODE_CLUSTER_SCHED_POLICY`. Действительные значения: `'rr'` и `'none'`.

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
  * `stdio` {Array} Настраивает stdio процессов-потомков. Поскольку модуль кластера зависит от IPC для функционирования, эта конфигурация должна содержать запись `'ipc'`. Когда эта опция предоставляется, она отменяет `silent`.
  * `uid` {number} Устанавливает личность пользователя процесса. (См. setuid(2).)
  * `gid` {number} Устанавливает групповой идентификатор процесса. (См. setgid(2).)
  * `inspectPort` {number|Function} Sets inspector port of worker. This can be a number, or a function that takes no arguments and returns a number. By default each worker gets its own port, incremented from the master's `process.debugPort`.
  * `windowsHide` {boolean} Hide the forked processes console window that would normally be created on Windows systems. **По умолчанию:** `false`.

После вызова `.setupMaster()` (или `.fork()`) этот объект установок будет содержать настройки, включая значения по умолчанию.

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

`setupMaster` используется для изменения поведения 'fork' по умолчанию. С момента первого вызова настройки будут находиться в `cluster.settings`.

Примечание:

* Любые изменения настроек влияют только на последующие вызовы `.fork()` и не влияют на уже запущенные рабочие процессы.
* *единственный* атрибут рабочего процесса, который не может быть установлен через `.setupMaster()` - `env`, передаваемый `.fork()`.
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

Хеш, в котором хранятся активные объекты рабочего процесса, снабжен полем `id`. Позволяет легко заключать в циклы все рабочие процессы. Доступно только в основном процессе.

Рабочий процесс удаляется из cluster.workers после того, как он был отключен _и_ завершен. Невозможно заранее определить порядок между этими двумя событиями. Тем не менее гарантируется, что удаление из списка cluster.workers случится перед тем, как будет выполнено последнее из событий: `'disconnect'` или `'exit'`.

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
