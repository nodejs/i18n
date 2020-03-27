# Домен

<!-- YAML
changes:

  - version: v8.8.0
    description: Any `Promise`s created in VM contexts no longer have a
                 `.domain` property. Their handlers are still executed in the
                 proper domain, however, and `Promise`s created in the main
                 context still possess a `.domain` property.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12489
    description: Handlers for `Promise`s are now invoked in the domain in which
                 the first promise of a chain was created.
-->

<!--introduced_in=v0.10.0-->

> Стабильность: 0 - Устарело

**Этот модуль ожидает статуса устаревания**. Once a replacement API has been finalized, this module will be fully deprecated. Most end users should **not** have cause to use this module. Users who absolutely must have the functionality that domains provide may rely on it for the time being but should expect to have to migrate to a different solution in the future.

Domains provide a way to handle multiple different IO operations as a single group. If any of the event emitters or callbacks registered to a domain emit an `'error'` event, or throw an error, then the domain object will be notified, rather than losing the context of the error in the `process.on('uncaughtException')` handler, or causing the program to exit immediately with an error code.

## Внимание: не игнорируйте ошибки!

<!-- type=misc -->

Domain error handlers are not a substitute for closing down a process when an error occurs.

By the very nature of how [`throw`][] works in JavaScript, there is almost never any way to safely "pick up where it left off", without leaking references, or creating some other sort of undefined brittle state.

The safest way to respond to a thrown error is to shut down the process. Of course, in a normal web server, there may be many open connections, and it is not reasonable to abruptly shut those down because an error was triggered by someone else.

The better approach is to send an error response to the request that triggered the error, while letting the others finish in their normal time, and stop listening for new requests in that worker.

In this way, `domain` usage goes hand-in-hand with the cluster module, since the master process can fork a new worker when a worker encounters an error. For Node.js programs that scale to multiple machines, the terminating proxy or service registry can take note of the failure, and react accordingly.

Например, это нехорошая идея:

```js
// XXX ВНИМАНИЕ! ПЛОХАЯ ИДЕЯ!

const d = require('domain').create();
d.on('error', (er) => {
  // Ошибка не приведет к сбою процесса, но делает много хуже!
  // Хотя мы предотвратили перезагрузку аварийных процессов, мы все равно теряем 
  // ресурсы в большом объеме, когда это происходит.
  // Это не лучше, чем process.on('uncaughtException')!
  console.log(`error, but oh well ${er.message}`);
});
d.run(() => {
  require('http').createServer((req, res) => {
    handleRequest(req, res);
  }).listen(PORT);
});
```

By using the context of a domain, and the resilience of separating our program into multiple worker processes, we can react more appropriately, and handle errors with much greater safety.

```js
// Много лучше!

const cluster = require('cluster');
const PORT = +process.env.PORT || 1337;

if (cluster.isMaster) {
  // A more realistic scenario would have more than 2 workers,
  // and perhaps not put the master and worker in the same file.
  //
  // It is also possible to get a bit fancier about logging, and
  // implement whatever custom logic is needed to prevent DoS
  // attacks and other bad behavior.
  //
  // Смотрите параметры в документации кластера.
  //
  // Важно, что основной процесс делает очень мало,
  // повышая нашу устойчивость к неожиданным ошибкам.

  cluster.fork();
  cluster.fork();

  cluster.on('disconnect', (worker) => {
    console.error('disconnect!');
    cluster.fork();
  });

} else {
  // рабочий процесс
  //
  // Это место, куда мы помещаем наши ошибки!

  const domain = require('domain');

  // Смотрите документацию кластера для более подробной информации об использовании
  // рабочих процессов для обработки запросов. Как это работает, предостережения и т.д.

  const server = require('http').createServer((req, res) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);

      // We're in dangerous territory!
      // По определению произошло нечто неожиданное,
      // что мы, вероятно, не хотели.
      // Теперь может случиться что угодно! Будьте предельно осторожны!

      попробуйте {
        // убедитесь, что мы закроем в течение 30 секунд
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        // Но не оставляйте этот процесс открытым только для этого!
        killtimer.unref();

        // прекратите принимать новые запросы.
        server.close();

        // Пусть основной процесс знает, что мы мертвы. Это вызовет
        // "разъединение" в кластере основного процесса и после создаст
        // новый рабочий процесс.
        cluster.worker.disconnect();

        // попробуйте отправить ошибку на запрос, который вызвал проблему
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Oops, there was a problem!\n');
      } catch (er2) {
        // ну не так много мы можем сделать на данный момент.
        console.error(`Error sending 500! ${er2.stack}`);
      }
    });

    // Потому что req и res были созданы до того, как существовал этот домен,
    // мы без сомнения должны их добавить.
    // Смотрите объяснение неявной связи против явной связи ниже.
        // Теперь запустите функцию отладчика в домене.
    d.run(() => {
      handleRequest(req, res);
    });
  });
  server.listen(PORT);
}

// Эта часть не является важной. Просто пример маршрутизации.
// Put fancy application logic here.
function handleRequest(req, res) {
  switch (req.url) {
    case '/error':
      // Мы делаем некоторые асинхронные вещи, а затем...
      setTimeout(() => {
        // Упс!
        flerb.bark();
      }, timeout);
      break;
    default:
      res.end('ok');
  }
}
```

## Добавления к объектам Error

<!-- type=misc -->

Any time an `Error` object is routed through a domain, a few extra fields are added to it.

* `error.domain` Домен, который первым обработал ошибку.
* `error.domainEmitter` The event emitter that emitted an `'error'` event with the error object.
* `error.domainBound` The callback function which was bound to the domain, and passed an error as its first argument.
* `error.domainThrown` A boolean indicating whether the error was thrown, emitted, or passed to a bound callback function.

## Неявная связь

<!--type=misc-->

If domains are in use, then all **new** `EventEmitter` objects (including Stream objects, requests, responses, etc.) will be implicitly bound to the active domain at the time of their creation.

Additionally, callbacks passed to lowlevel event loop requests (such as to `fs.open()`, or other callback-taking methods) will automatically be bound to the active domain. If they throw, then the domain will catch the error.

In order to prevent excessive memory usage, `Domain` objects themselves are not implicitly added as children of the active domain. If they were, then it would be too easy to prevent request and response objects from being properly garbage collected.

To nest `Domain` objects as children of a parent `Domain` they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the `Domain`'s `'error'` event, but does not register the `EventEmitter` on the `Domain`. Неявные связи отвечают только за выданные ошибки и события `'error'`.

## Явные связи

<!--type=misc-->

Sometimes, the domain in use is not the one that ought to be used for a specific event emitter. Or, the event emitter could have been created in the context of one domain, but ought to instead be bound to some other domain.

For example, there could be one domain in use for an HTTP server, but perhaps we would like to have a separate domain to use for each request.

Это возможно посредством явной связи.

```js
// создайте домен верхнего уровня для сервера
const domain = require('domain');
const http = require('http');
const serverDomain = domain.create();

serverDomain.run(() => {
  // сервер создан в области действия serverDomain
  http.createServer((req, res) => {
    // req и res также созданы в области действия serverDomain
    // однако мы бы предпочли иметь отдельный домен для каждого запроса.
    // сначала создайте его и добавьте к нему req и res.
    const reqd = domain.create();
    reqd.add(req);
    reqd.add(res);
    reqd.on('error', (er) => {
      console.error('Error', er, req.url);
      try {
        res.writeHead(500);
        res.end('Error occurred, sorry.');
      } catch (er2) {
        console.error('Error sending 500', er2, req.url);
      }
    });
  }).listen(1337);
});
```

## domain.create()

* Возвращает: {Domain}

## Класс: домен

The `Domain` class encapsulates the functionality of routing errors and uncaught exceptions to the active `Domain` object.

`Domain` is a child class of [`EventEmitter`][]. To handle the errors that it catches, listen to its `'error'` event.

### domain.members

* {Array}

An array of timers and event emitters that have been explicitly added to the domain.

### domain.add(emitter)

* `emitter` {EventEmitter|Timer} генератор или таймер, который будет добавлен в домен

Явно добавляет генератор в домен. If any event handlers called by the emitter throw an error, or if the emitter emits an `'error'` event, it will be routed to the domain's `'error'` event, just like with implicit binding.

This also works with timers that are returned from [`setInterval()`][] and [`setTimeout()`][]. If their callback function throws, it will be caught by the domain `'error'` handler.

If the Timer or `EventEmitter` was already bound to a domain, it is removed from that one, and bound to this one instead.

### domain.bind(callback)

* `callback` {Function} Функция обратного вызова
* Возвращает: {Function} Связанная функция

The returned function will be a wrapper around the supplied callback function. When the returned function is called, any errors that are thrown will be routed to the domain's `'error'` event.

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // если выдает это, это также должно быть передано в домен
    return cb(er, data ? JSON.parse(data) : null);
  }));
}

d.on('error', (er) => {
  // где-то произошла ошибка.
  // если мы это сейчас бросим, это приведет к падению программы
  // с обычным номером строки и стековым сообщением.
});
```

### domain.enter()

The `enter()` method is plumbing used by the `run()`, `bind()`, and `intercept()` methods to set the active domain. It sets `domain.active` and `process.domain` to the domain, and implicitly pushes the domain onto the domain stack managed by the domain module (see [`domain.exit()`][] for details on the domain stack). The call to `enter()` delimits the beginning of a chain of asynchronous calls and I/O operations bound to a domain.

Calling `enter()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.exit()

The `exit()` method exits the current domain, popping it off the domain stack. Any time execution is going to switch to the context of a different chain of asynchronous calls, it's important to ensure that the current domain is exited. The call to `exit()` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit()` will exit any domains nested within this domain.

Calling `exit()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.intercept(callback)

* `callback` {Function} Функция обратного вызова
* Возвращает: {Function} Перехваченная функция

Этот метод почти идентичен [`domain.bind(callback)`][]. However, in addition to catching thrown errors, it will also intercept [`Error`][] objects sent as the first argument to the function.

In this way, the common `if (err) return callback(err);` pattern can be replaced with a single error handler in a single place.

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.intercept((data) => {
    // обратите внимание, что первый аргумент никогда не передается
    // обратному вызову, поскольку он считается аргументом "Error"
    // и, таким образом, перехватывается доменом.

    // если это выводит ошибку, это также будет передано домену,
    // так что логика обработки ошибок может быть перемещена в событие 'error'
    // в домене вместо того, чтобы постоянно повторяться
    // в программе.
    return cb(null, JSON.parse(data));
  }));
}

d.on('error', (er) => {
  // где-то произошла ошибка.
  // если мы это сейчас бросим, это приведет к падению программы
  // с обычным номером строки и стековым сообщением.
});
```

### domain.remove(emitter)

* `emitter` {EventEmitter|Timer} генератор или таймер, который будет удален из домена

Противоположно [`domain.add(emitter)`][]. Removes domain handling from the specified emitter.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Run the supplied function in the context of the domain, implicitly binding all event emitters, timers, and lowlevel requests that are created in that context. Optionally, arguments can be passed to the function.

Это самый основной способ использования домена.

```js
const domain = require('domain');
const fs = require('fs');
const d = domain.create();
d.on('error', (er) => {
  console.error('Caught error!', er);
});
d.run(() => {
  process.nextTick(() => {
    setTimeout(() => { // simulating some various async stuff
      fs.open('non-existent file', 'r', (er, fd) => {
        if (er) throw er;
        // продолжаем...
      });
    }, 100);
  });
});
```

In this example, the `d.on('error')` handler will be triggered, rather than crashing the program.

## Domains and Promises

As of Node.js 8.0.0, the handlers of Promises are run inside the domain in which the call to `.then()` or `.catch()` itself was made:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then((v) => {
    // running in d2
  });
});
```

A callback may be bound to a specific domain using [`domain.bind(callback)`][]:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then(p.domain.bind((v) => {
    // running in d1
  }));
});
```

Note that domains will not interfere with the error handling mechanisms for Promises, i.e. no `'error'` event will be emitted for unhandled `Promise` rejections.