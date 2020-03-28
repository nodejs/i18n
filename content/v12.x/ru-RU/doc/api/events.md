# События

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

Например: объект [`net.Server`][] создает событие каждый раз, когда пир подключается к нему; [`fs.ReadStream`][] создает событие при открытии файла; [stream](stream.html) создает событие каждый раз, когда данные доступны для чтения.

Все объекты, которые создают события, являются экземплярами класса `EventEmitter`. Эти объекты выставляют функцию `eventEmitter.on()`, что позволяет прикрепить одну или несколько функций к именованным событиям, которые созданы объектом. Обычно имена событий являются строками в стиле camel-case, но может быть использован любой допустимый ключ свойства JavaScript.

When the `EventEmitter` object emits an event, all of the functions attached to that specific event are called _synchronously_. Any values returned by the called listeners are _ignored_ and will be discarded.

Следующий пример показывает простой экземпляр `EventEmitter` с одним слушателем. Метод `eventEmitter.on()` используется для регистрации слушателей, когда метод `eventEmitter.emit()` используется для запуска события.

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
myEmitter.emit('event');
```

## Передача аргументов и `this` слушателям

Метод `eventEmitter.emit()` позволяет передачу произвольного набора аргументов функциям слушателя. Keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', function(a, b) {
  console.log(a, b, this, this === myEmitter);
  // Prints:
  //   a b MyEmitter {
  //     domain: null,
  //     _events: { event: [Function] },
  //     _eventsCount: 1,
  //     _maxListeners: undefined } true
});
myEmitter.emit('event', 'a', 'b');
```

Можно использовать ES6 Стрелочные функции в качестве слушателей, однако при этом ключевое слово `this` больше не будет ссылаться на экземпляр `EventEmitter`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // Печатает: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## Асинхронный против Синхронный

`EventEmitter` вызывает всех слушателей синхронно в порядке, в котором они были зарегистрированы. This ensures the proper sequencing of events and helps avoid race conditions and logic errors. При необходимости функции слушателя могут переключаться в асинхронный режим работы с помощью методов `setImmediate()` или `process.nextTick()`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log("это происходит асинхронно");
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Обработка событий только один раз

When a listener is registered using the `eventEmitter.on()` method, that listener will be invoked _every time_ the named event is emitted.

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.on("событие", () => {
  console.log(++m);
});
myEmitter.emit("событие");
// Печатает: 1
myEmitter.emit("событие");
// Печатает: 2
```

С помощью метода `eventEmitter.once()` можно зарегистрировать слушателя, который вызывается только один раз для определенного события. Once the event is emitted, the listener is unregistered and *then* called.

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.once("событие", () => {
  console.log(++m);
});
myEmitter.emit("событие");
// Печатает: 1
myEmitter.emit("событие");
// Игнорируется
```

## События ошибок

Когда в экземпляре `EventEmitter` возникает ошибка, типичным действием является создание события `'error'`. В Node.js такие случаи рассматриваются как особые.

If an `EventEmitter` does _not_ have at least one listener registered for the `'error'` event, and an `'error'` event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error("упс!"));
// Выводит и сбрасывает Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note, however, that the `domain` module is deprecated.)

Лучше всего, чтобы слушатели всегда добавлялись для событий `'error'`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error("упс! произошла ошибка);
});
myEmitter.emit('error', new Error("упс!"));
// Печатает: упс! произошла ошибка
```

## Capture Rejections of Promises

> Stability: 1 - captureRejections is experimental.

Using `async` functions with event handlers is problematic, because it can lead to an unhandled rejection in case of a thrown exception:

```js
const ee = new EventEmitter();
ee.on('something', async (value) => {
  throw new Error('kaboom');
});
```

The `captureRejections` option in the `EventEmitter` constructor or the global setting change this behavior, installing a `.then(undefined, handler)` handler on the `Promise`. This handler routes the exception asynchronously to the [`Symbol.for('nodejs.rejection')`](#events_emitter_symbol_for_nodejs_rejection_err_eventname_args) method if there is one, or to [`'error'`](#events_error_events) event handler if there is none.

```js
const ee1 = new EventEmitter({ captureRejections: true });
ee1.on('something', async (value) => {
  throw new Error('kaboom');
});

ee1.on('error', console.log);

const ee2 = new EventEmitter({ captureRejections: true });
ee2.on('something', async (value) => {
  throw new Error('kaboom');
});

ee2[Symbol.for('nodejs.rejection')] = console.log;
```

Setting `EventEmitter.captureRejections = true` will change the default for all new instances of `EventEmitter`.

```js
EventEmitter.captureRejections = true;
const ee1 = new EventEmitter();
ee1.on('something', async (value) => {
  throw new Error('kaboom');
});

ee1.on('error', console.log);
```

The `'error'` events that are generated by the `captureRejections` behavior do not have a catch handler to avoid infinite error loops: the recommendation is to **not use `async` functions as `'error'` event handlers**.

## Class: `EventEmitter`
<!-- YAML
added: v0.1.26
changes:
  - version: v12.16.0
    pr-url: https://github.com/nodejs/node/pull/27867
    description: Added captureRejections option.
-->

Класс `EventEmitter` определяется и предоставляется модулем `events`:

```js
const EventEmitter = require('events');
```

All `EventEmitter`s emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

It supports the following option:

* `captureRejections` {boolean} It enables [automatic capturing of promise rejection](#events_capture_rejections_of_promises). Default: `false`.

### Событие: 'newListener'
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol} Имя события, которое прослушивается
* `listener` {Function} Функция обработчика события

The `EventEmitter` instance will emit its own `'newListener'` event *before* a listener is added to its internal array of listeners.

Слушателям, зарегистрированным для события `'newListener'`, будет передано имя события и ссылка на добавляемого слушателя.

The fact that the event is triggered before adding the listener has a subtle but important side effect: any *additional* listeners registered to the same `name` *within* the `'newListener'` callback will be inserted *before* the listener that is in the process of being added.

```js
const myEmitter = new MyEmitter();
// Сделайте это только один раз, чтобы мы не попали в бесконечный цикл
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // Вставьте нового слушателя перед
    myEmitter.on('event', () => {
      console.log('B');
    });
  }
});
myEmitter.on('event', () => {
  console.log('A');
});
myEmitter.emit('event');
// Печатает:
//   B
//   A
```

### Event: `'removeListener'`
<!-- YAML
added: v0.9.3
changes:
  - version: v6.1.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/6394
    description: For listeners attached using `.once()`, the `listener` argument
                 now yields the original listener function.
-->

* `eventName` {string|symbol} Имя события
* `listener` {Function} Функция обработчика события

The `'removeListener'` event is emitted *after* the `listener` is removed.

### `EventEmitter.listenerCount(emitter, eventName)`
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Стабильность: 0 - Устарело: Вместо этого используйте [`emitter.listenerCount()`][].

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} Имя события

Метод класса, который возвращает количество слушателей для данного `eventName`, зарегистрированных на данном `emitter`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Печатает: 2
```

### `EventEmitter.defaultMaxListeners`
<!-- YAML
added: v0.11.2
-->

По умолчанию для любого события можно зарегистрировать максимум `10` слушателей. Этот лимит можно изменить для отдельных экземпляров `EventEmitter` с помощью метода [`emitter.setMaxListeners(n)`][]. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. Однако вызов [`emitter.setMaxListeners(n)`][] все еще имеет приоритет над `EventEmitter.defaultMaxListeners`.

This is not a hard limit. Экземпляр `EventEmitter` позволит добавить больше слушателей, но выведет предупреждение трассировки в stderr, указывающее, что обнаружена "возможная утечка памяти EventEmitter". Чтобы временно избежать этого предупреждения, можно использовать методы `emitter.getMaxListeners()` и `emitter.setMaxListeners()` для каждого отдельного `EventEmitter`:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // делайте, что необходимо
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

Флаг командной строки [`--trace-warnings`][] может использоваться для отображения трассировки стека для подобных предупреждений.

Созданное предупреждение можно проверить с помощью [`process.on('warning')`][], оно будет иметь дополнительные свойства `emitter`, `type` и `count`, которые ссылаются на экземпляр генератора события, имя события и количество подключенных слушателей соответственно. Its `name` property is set to `'MaxListenersExceededWarning'`.

### `emitter.addListener(eventName, listener)`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}

Другое название для `emitter.on(eventName, listener)`.

### `emitter.emit(eventName[, ...args])`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `...args` {any}
* Возвращает: {boolean}

Синхронно вызывает каждого из слушателей, зарегистрированных для события с именем `eventName`, в том порядке, в котором они были зарегистрированы, передавая каждому из них предоставленные аргументы.

Если событие имело слушателей, то возвращает `true`, в противном случае - `false`.

```js
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

// First listener
myEmitter.on('event', function firstListener() {
  console.log('Helloooo! first listener');
});
// Second listener
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`event with parameters ${arg1}, ${arg2} in second listener`);
});
// Third listener
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`event with parameters ${parameters} in third listener`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// Helloooo! first listener
// event with parameters 1, 2 in second listener
// event with parameters 1, 2, 3, 4, 5 in third listener
```

### `emitter.eventNames()`
<!-- YAML
added: v6.0.0
-->

* Возвращает: {Array}

Возвращает массив, где перечислены события, для которых генератор зарегистрировал слушателей. The values in the array will be strings or `Symbol`s.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Печатает: [ 'foo', 'bar', Symbol(symbol) ]
```

### `emitter.getMaxListeners()`
<!-- YAML
added: v1.0.0
-->

* Возвращает: {integer}

Возвращает текущее максимальное значение слушателя для `EventEmitter`, которое может быть установлено с помощью [`emitter.setMaxListeners(n)`][] или быть значением по умолчанию [`EventEmitter.defaultMaxListeners`][].

### `emitter.listenerCount(eventName)`
<!-- YAML
added: v3.2.0
-->

* `eventName` {string|symbol} Имя события, которое прослушивается
* Возвращает: {integer}

Возвращает количество слушателей, прослушивающих событие с именем `eventName`.

### `emitter.listeners(eventName)`
<!-- YAML
added: v0.1.26
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6881
    description: For listeners attached using `.once()` this returns the
                 original listeners instead of wrapper functions now.
-->

* `eventName` {string|symbol}
* Returns: {Function[]}

Возвращает копию массива слушателей для события с именем `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Печатает: [ [Function] ]
```

### `emitter.off(eventName, listener)`
<!-- YAML
added: v10.0.0
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Возвращает: {EventEmitter}

Alias for [`emitter.removeListener()`][].

### `emitter.on(eventName, listener)`
<!-- YAML
added: v0.1.101
-->

* `eventName` {string|symbol} Имя события.
* `listener` {Function} Функция обратного вызова
* Возвращает: {EventEmitter}

Добавляет функцию `listener` в конец массива слушателей для события с именем `eventName`. Не делается никаких проверок, чтобы увидеть, был ли уже добавлен `listener`. Несколько вызовов, передающих одну и ту же комбинацию `eventName` и `listener`, приведут к добавлению и множественным вызовам `listener`.

```js
server.on('connection', (stream) => {
  console.log("кто-то подключился!");
});
```

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

По умолчанию слушатели события вызываются в том порядке, в котором они были добавлены. Метод `emitter.prependListener()` может быть использован в качестве альтернативы для добавления слушателя события в начало массива слушателей.

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Печатает:
//   b
//   a
```

### `emitter.once(eventName, listener)`
<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} Имя события.
* `listener` {Function} Функция обратного вызова
* Возвращает: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName`. В следующий раз, когда срабатывает `eventName`, этот слушатель удаляется и затем вызывается.

```js
server.once('connection', (stream) => {
  console.log("У нас есть наш первый пользователь!");
});
```

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

По умолчанию слушатели события вызываются в том порядке, в котором они были добавлены. Метод `emitter.prependOnceListener()` может быть использован в качестве альтернативы для добавления слушателя события в начало массива слушателей.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Печатает:
//   b
//   a
```

### `emitter.prependListener(eventName, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} Имя события.
* `listener` {Function} Функция обратного вызова
* Возвращает: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. Не делается никаких проверок, чтобы увидеть, был ли уже добавлен `listener`. Несколько вызовов, передающих одну и ту же комбинацию `eventName` и `listener`, приведут к добавлению и множественным вызовам `listener`.

```js
server.prependListener('connection', (stream) => {
  console.log("кто-то подключился!");
});
```

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

### `emitter.prependOnceListener(eventName, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} Имя события.
* `listener` {Function} Функция обратного вызова
* Возвращает: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. В следующий раз, когда срабатывает `eventName`, этот слушатель удаляется и затем вызывается.

```js
server.prependOnceListener('connection', (stream) => {
  console.log("У нас есть наш первый пользователь!");
});
```

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

### `emitter.removeAllListeners([eventName])`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* Возвращает: {EventEmitter}

Удаляет все слушатели или слушатели с указанным `eventName`.

It is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

### `emitter.removeListener(eventName, listener)`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Возвращает: {EventEmitter}

Удаляет указанный `listener` из массива слушателей для события с именем `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Subsequent events will behave as expected.

```js
const myEmitter = new MyEmitter();

const callbackA = () => {
  console.log('A');
  myEmitter.removeListener('event', callbackB);
};

const callbackB = () => {
  console.log('B');
};

myEmitter.on('event', callbackA);

myEmitter.on('event', callbackB);

// callbackA удаляет слушателя callbackB, но он все еще будет вызван.
// Внутренний массив слушателей во время создания [callbackA, callbackB]
myEmitter.emit('event');
// Печатает:
//   A
//   B

// callbackB теперь удален.
// Внутренний массив слушателей [callbackA]
myEmitter.emit('event');
// Печатает:
//   A
```

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. Это не повлияет на порядок, в котором вызываются слушатели, но это означает, что любые копии массива слушателей, возвращаемые методом `emitter.listeners()`, нужно будет создать заново.

When a single function has been added as a handler multiple times for a single event (as in the example below), `removeListener()` will remove the most recently added instance. In the example the `once('ping')` listener is removed:

```js
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

### `emitter.setMaxListeners(n)`
<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Возвращает: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. Это полезное значение по умолчанию, которое помогает обнаружить утечки памяти. Очевидно, что не все события должны быть ограничены 10 слушателями. Метод `emitter.setMaxListeners()` позволяет изменять лимит для этого определенного экземпляра `EventEmitter`. Значение может быть установлено на `Бесконечность` (или `0`) для указания неограниченного количества слушателей.

Возвращает ссылку на `EventEmitter`, так что эти вызовы могут быть привязаны.

### `emitter.rawListeners(eventName)`
<!-- YAML
added: v9.4.0
-->

* `eventName` {string|symbol}
* Returns: {Function[]}

Returns a copy of the array of listeners for the event named `eventName`, including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// Logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// Logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// Will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// Logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```

### `emitter[Symbol.for('nodejs.rejection')](err, eventName[, ...args])`
<!-- YAML
added: v12.16.0
-->

> Stability: 1 - captureRejections is experimental.

* `err` Error
* `eventName` {string|symbol}
* `...args` {any}

The `Symbol.for('nodejs.rejection')` method is called in case a promise rejection happens when emitting an event and [`captureRejections`](#events_capture_rejections_of_promises) is enabled on the emitter. It is possible to use [`events.captureRejectionSymbol`](#events_events_capturerejectionsymbol) in place of `Symbol.for('nodejs.rejection')`.

```js
const { EventEmitter, captureRejectionSymbol } = require('events');

class MyClass extends EventEmitter {
  constructor() {
    super({ captureRejections: true });
  }

  [captureRejectionSymbol](err, event, ...args) {
    console.log('rejection happened for', event, 'with', err, ...args);
    this.destroy(err);
  }

  destroy(err) {
    // Tear the resource down here.
  }
}
```

## `events.once(emitter, name)`
<!-- YAML
added: v11.13.0
-->

* `emitter` {EventEmitter}
* `name` {string}
* Возвращает: {Promise}

Creates a `Promise` that is fulfilled when the `EventEmitter` emits the given event or that is rejected when the `EventEmitter` emits `'error'`. The `Promise` will resolve with an array of all the arguments emitted to the given event.

This method is intentionally generic and works with the web platform [EventTarget](https://dom.spec.whatwg.org/#interface-eventtarget) interface, which has no special `'error'` event semantics and does not listen to the `'error'` event.

```js
const { once, EventEmitter } = require('events');

async function run() {
  const ee = new EventEmitter();

  process.nextTick(() => {
    ee.emit('myevent', 42);
  });

  const [value] = await once(ee, 'myevent');
  console.log(value);

  const err = new Error('kaboom');
  process.nextTick(() => {
    ee.emit('error', err);
  });

  try {
    await once(ee, 'myevent');
  } catch (err) {
    console.log('error happened', err);
  }
}

run();
```

## events.captureRejections
<!-- YAML
added: v12.16.0
-->

> Stability: 1 - captureRejections is experimental.

Value: {boolean}

Change the default `captureRejections` option on all new `EventEmitter` objects.

## events.captureRejectionSymbol
<!-- YAML
added: v12.16.0
-->

> Stability: 1 - captureRejections is experimental.

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom [rejection handler](#events_emitter_symbol_for_nodejs_rejection_err_eventname_args).

## events.on(emitter, eventName)
<!-- YAML
added: v12.16.0
-->

* `emitter` {EventEmitter}
* `eventName` {string|symbol} Имя события, которое прослушивается
* Returns: {AsyncIterator} that iterates `eventName` events emitted by the `emitter`

```js
const { on, EventEmitter } = require('events');

(async () => {
  const ee = new EventEmitter();

  // Emit later on
  process.nextTick(() => {
    ee.emit('foo', 'bar');
    ee.emit('foo', 42);
  });

  for await (const event of on(ee, 'foo')) {
    // The execution of this inner block is synchronous and it
    // processes one event at a time (even with await). Do not use
    // if concurrent execution is required.
    console.log(event); // prints ['bar'] [42]
  }
})();
```

Returns an `AsyncIterator` that iterates `eventName` events. It will throw if the `EventEmitter` emits `'error'`. It removes all listeners when exiting the loop. The `value` returned by each iteration is an array composed of the emitted event arguments.
