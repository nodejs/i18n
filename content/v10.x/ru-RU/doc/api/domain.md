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

**Этот модуль ожидает статуса устаревания**. После завершения замены API этот модуль будет полностью устаревшим. Большинство конечных пользователей **не** должны иметь причину использовать этот модуль. Пользователи, которые обязательно должны иметь функциональные возможности, предоставляемые доменами, могут в настоящее время полагаться на него, но должны ожидать перехода на другое решение в будущем.

Домены предоставляют способ обработки несколько различных операций ввода-вывода как одной группы. Если какой-либо из отправителей событий или обратных вызовов, зарегистрированных в домене, выдает событие `'error'` или выводит ошибку, то объект домена будет уведомлен, вместо того, чтобы потерять контекст ошибки в обработчике `process.on('uncaughtException')` или немедленно завершить программу с кодом ошибки.

## Внимание: не игнорируйте ошибки!

<!-- type=misc -->

Domain error handlers are not a substitute for closing down a process when an error occurs.

By the very nature of how [`throw`][] works in JavaScript, there is almost never any way to safely "pick up where it left off", without leaking references, or creating some other sort of undefined brittle state.

Самый безопасный способ отреагировать на возникшую ошибку - закрыть процесс. Of course, in a normal web server, there may be many open connections, and it is not reasonable to abruptly shut those down because an error was triggered by someone else.

Лучшее решение - отправить ответ об ошибке на запрос, вызвавший ошибку, позволяя остальным завершиться в свое обычное время, и прекратить прослушивание новых запросов в этом рабочем процессе.

Таким образом, использование `domain` выполняется вместе с модулем кластера, потому что основной процесс может породить новый рабочий процесс, когда рабочий процесс сталкивается с ошибкой. Для программ Node.js, которые масштабируются на несколько устройств, конечный прокси-сервер или служба реестра может записывать сбой и реагировать соответствующим образом.

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

Используя контекст домена и гибкость разделения нашей программы на несколько рабочих процессов, мы можем реагировать соответствующим образом и обрабатывать ошибки более безопасно.

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

Каждый раз, когда объект `Error` маршрутизируется через домен, к нему добавляется несколько дополнительных полей.

* `error.domain` Домен, который первым обработал ошибку.
* `error.domainEmitter` Генератор событий, который создал событие `'error'` с объектом ошибки.
* `error.domainBound` Функция обратного вызова, которая была связана с доменом и передала ошибку в качестве первого аргумента.
* `error.domainThrown` Логическое значение, указывающее, была ли ошибка выдана, создана или передана связанной функции обратного вызова.

## Неявная связь

<!--type=misc-->

If domains are in use, then all **new** `EventEmitter` objects (including Stream objects, requests, responses, etc.) will be implicitly bound to the active domain at the time of their creation.

Additionally, callbacks passed to lowlevel event loop requests (such as to `fs.open()`, or other callback-taking methods) will automatically be bound to the active domain. Если они сброшены, то домен поймает ошибку.

In order to prevent excessive memory usage, `Domain` objects themselves are not implicitly added as children of the active domain. Если бы они были, то было бы очень легко предотвратить помещение объектов запросов и ответов в "мусор".

To nest `Domain` objects as children of a parent `Domain` they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the `Domain`'s `'error'` event, but does not register the `EventEmitter` on the `Domain`. Неявные связи отвечают только за выданные ошибки и события `'error'`.

## Явные связи

<!--type=misc-->

Иногда используемый домен не тот, который должен использоваться для конкретного генератора событий. Или генератор событий мог быть создан в контексте одного домена, но вместо этого он должен быть связан с другим доменом.

Например, для HTTP-сервера можно использовать один домен, но, возможно, мы хотели бы иметь отдельный домен для каждого запроса.

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

`Domain` is a child class of [`EventEmitter`][]. Для обработки пойманных им ошибок, прослушайте его событие `'error'`.

### domain.members

* {Array}

Массив таймеров и генераторов событий, которые были явно добавлены в домен.

### domain.add(emitter)

* `emitter` {EventEmitter|Timer} генератор или таймер, который будет добавлен в домен

Явно добавляет генератор в домен. Если какой-либо обработчик событий, вызванный генератором, выдает ошибку или генератор создает событие `'error'`, он будет направлен в событие `'error'` домена; тот же принцип, что и с неявной связью.

Это также работает с таймерами, которые возвращаются из [`setInterval()`][] и [`setTimeout()`][]. If their callback function throws, it will be caught by the domain `'error'` handler.

If the Timer or `EventEmitter` was already bound to a domain, it is removed from that one, and bound to this one instead.

### domain.bind(callback)

* `callback` {Function} Функция обратного вызова
* Возвращает: {Function} Связанная функция

Возвращенная функция будет оборачивать указанную функцию обратного вызова. Когда вызывается возращенная функция, любые выданные ошибки будут направляться в доменное событие `'error'`.

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

The `exit()` method exits the current domain, popping it off the domain stack. Каждый раз, когда выполнение переключается на контекст другой цепочки асинхронных вызовов, важно убедиться, что текущий домен закрыт. The call to `exit()` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit()` will exit any domains nested within this domain.

Calling `exit()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.intercept(callback)

* `callback` {Function} Функция обратного вызова
* Возвращает: {Function} Перехваченная функция

Этот метод почти идентичен [`domain.bind(callback)`][]. Но в дополнение к перехвату выданных ошибок он также перехватывает объекты [`Error`][], отправленные функции в качестве первого аргумента.

Таким образом, обычный шаблон `if (err) return callback(err);` можно заменить одним обработчиком ошибок в одном месте.

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

Противоположно [`domain.add(emitter)`][]. Удаляет обработку домена из указанного генератора.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Запустите предоставленную функцию в контексте домена, неявно связывая все генераторы событий, таймеры и запросы низкого уровня, созданные в этом контексте. Аргументы опционально могут передаваться в функцию.

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

В этом примере показано как вместо сбоя программы срабатывает обработчик `d.on('error')`.

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
