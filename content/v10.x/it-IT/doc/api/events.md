# Eventi

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

For instance: a [`net.Server`][] object emits an event each time a peer connects to it; a [`fs.ReadStream`][] emits an event when the file is opened; a [stream](stream.html) emits an event whenever data is available to be read.

Tutti gli object che emettono eventi sono istanze della classe `EventEmitter`. These objects expose an `eventEmitter.on()` function that allows one or more functions to be attached to named events emitted by the object. Typically, event names are camel-cased strings but any valid JavaScript property key can be used.

When the `EventEmitter` object emits an event, all of the functions attached to that specific event are called *synchronously*. Any values returned by the called listeners are *ignored* and will be discarded.

The following example shows a simple `EventEmitter` instance with a single listener. The `eventEmitter.on()` method is used to register listeners, while the `eventEmitter.emit()` method is used to trigger the event.

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
myEmitter.emit('event');
```

## Passaggio di argomenti e `this` ai listener

The `eventEmitter.emit()` method allows an arbitrary set of arguments to be passed to the listener functions. It is important to keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', function(a, b) {
  console.log(a, b, this, this === myEmitter);
  // Stampa:
  //   a b MyEmitter {
  //     domain: null,
  //     _events: { event: [Function] },
  //     _eventsCount: 1,
  //     _maxListeners: undefined } true
});
myEmitter.emit('event', 'a', 'b');
```

It is possible to use ES6 Arrow Functions as listeners, however, when doing so, the `this` keyword will no longer reference the `EventEmitter` instance:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // Stampa: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## Asincrono vs. Sincrono

The `EventEmitter` calls all listeners synchronously in the order in which they were registered. This is important to ensure the proper sequencing of events and to avoid race conditions or logic errors. When appropriate, listener functions can switch to an asynchronous mode of operation using the `setImmediate()` or `process.nextTick()` methods:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('this happens asynchronously');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Gestione degli eventi solo una volta

When a listener is registered using the `eventEmitter.on()` method, that listener will be invoked *every time* the named event is emitted.

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.on('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// Stampa: 1
myEmitter.emit('event');
// Stampa: 2
```

Using the `eventEmitter.once()` method, it is possible to register a listener that is called at most once for a particular event. Once the event is emitted, the listener is unregistered and *then* called.

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.once('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// Stampa: 1
myEmitter.emit('event');
// Ignorato
```

## Error event

When an error occurs within an `EventEmitter` instance, the typical action is for an `'error'` event to be emitted. These are treated as special cases within Node.js.

If an `EventEmitter` does *not* have at least one listener registered for the `'error'` event, and an `'error'` event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Genera e causa il crash di Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note, however, that the `domain` module is deprecated.)

Per una miglior pratica, è necessario aggiungere sempre dei listener per gli eventi `'error'`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error('whoops! there was an error');
});
myEmitter.emit('error', new Error('whoops!'));
// Stampa: whoops! there was an error
```

## Class: EventEmitter

<!-- YAML
added: v0.1.26
-->

La classe `EventEmitter` viene definita ed esposta dal modulo `events`:

```js
const EventEmitter = require('events');
```

All `EventEmitter`s emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

### Event: 'newListener'

<!-- YAML
added: v0.1.26
-->

* `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
* `listener` {Function} La funzione dell'event handler

The `EventEmitter` instance will emit its own `'newListener'` event *before* a listener is added to its internal array of listeners.

Listeners registered for the `'newListener'` event will be passed the event name and a reference to the listener being added.

The fact that the event is triggered before adding the listener has a subtle but important side effect: any *additional* listeners registered to the same `name` *within* the `'newListener'` callback will be inserted *before* the listener that is in the process of being added.

```js
const myEmitter = new MyEmitter();
// Fallo solo una volta per non andare in loop 
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // Aggiungi un nuovo listener prima 
    myEmitter.on('event', () => {
      console.log('B');
    });
  }
});
myEmitter.on('event', () => {
  console.log('A');
});
myEmitter.emit('event');
// Stampa:
//   B
//   A
```

### Event: 'removeListener'

<!-- YAML
added: v0.9.3
changes:

  - version: v6.1.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/6394
    description: For listeners attached using `.once()`, the `listener` argument
                 now yields the original listener function.
-->

* `eventName` {string|symbol} Il nome dell'evento
* `listener` {Function} La funzione dell'event handler

L'evento `'removeListener'` viene emesso *dopo* l'eliminazione del `listener`.

### EventEmitter.listenerCount(emitter, eventName)

<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} Il nome dell'evento

> Stabilità: 0 - Deprecato: Utilizza [`emitter.listenerCount()`][] al suo posto.

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Stampa: 2
```

### EventEmitter.defaultMaxListeners

<!-- YAML
added: v0.11.2
-->

By default, a maximum of `10` listeners can be registered for any single event. This limit can be changed for individual `EventEmitter` instances using the [`emitter.setMaxListeners(n)`][] method. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. However, calling [`emitter.setMaxListeners(n)`][] still has precedence over `EventEmitter.defaultMaxListeners`.

Da notare che questo non è un limite rigido. The `EventEmitter` instance will allow more listeners to be added but will output a trace warning to stderr indicating that a "possible EventEmitter memory leak" has been detected. For any single `EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to temporarily avoid this warning:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // fai operazione
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

The [`--trace-warnings`][] command line flag can be used to display the stack trace for such warnings.

The emitted warning can be inspected with [`process.on('warning')`][] and will have the additional `emitter`, `type` and `count` properties, referring to the event emitter instance, the event’s name and the number of attached listeners, respectively. La sua proprietà `name` è impostata su `'MaxListenersExceededWarning'`.

### emitter.addListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}

Alias per `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `...args` {any}
* Restituisce: {boolean}

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments to each.

Restituisce `true` se l'evento ha avuto listener, `false` in caso contrario.

### emitter.eventNames()

<!-- YAML
added: v6.0.0
-->

* Restituisce: {Array}

Returns an array listing the events for which the emitter has registered listeners. I valori nell'array saranno stringhe o `Symbol`.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Stampa: [ 'foo', 'bar', Symbol(symbol) ]
```

### emitter.getMaxListeners()

<!-- YAML
added: v1.0.0
-->

* Restituisce: {integer}

Returns the current max listener value for the `EventEmitter` which is either set by [`emitter.setMaxListeners(n)`][] or defaults to [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)

<!-- YAML
added: v3.2.0
-->

* `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
* Restituisce: {integer}

Restituisce il numero di listener sottoposti al listening dell'evento con nome `eventName`.

### emitter.listeners(eventName)

<!-- YAML
added: v0.1.26
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6881
    description: For listeners attached using `.once()` this returns the
                 original listeners instead of wrapper functions now.
-->

* `eventName` {string|symbol}
* Restituisce: {Function[]}

Restituisce una copia dell'array dei listener per l'evento con nome `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Stampa: [ [Function] ]
```

### emitter.off(eventName, listener)

<!-- YAML
added: v10.0.0
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Restituisce: {EventEmitter}

Alias di [`emitter.removeListener()`][].

### emitter.on(eventName, listener)

<!-- YAML
added: v0.1.101
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Adds the `listener` function to the end of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

Di default, gli eventi listener vengono invocati nell'ordine in cui vengono aggiunti. The `emitter.prependListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Stampa:
//   b
//   a
```

### emitter.once(eventName, listener)

<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Aggiunge una funzione `listener` **one-time** per l'evento con nome `eventName`. The next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

Di default, gli eventi listener vengono invocati nell'ordine in cui vengono aggiunti. The `emitter.prependOnceListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Stampa:
//   b
//   a
```

### emitter.prependListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.prependOnceListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. The next time `eventName` is triggered, this listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.removeAllListeners([eventName])

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* Restituisce: {EventEmitter}

Rimuove tutti i listeners, oppure quelli dell'`eventName` specificato.

Note that it is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.removeListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Restituisce: {EventEmitter}

Removes the specified `listener` from the listener array for the event named `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Note that once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Gli eventi successivi si comporteranno come previsto.

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

// callbackA elimina il listener callbackB tuttavia verrà ancora chiamata.
// Internal listener array al momento dell'emit [callbackA, callbackB]
myEmitter.emit('event');
// Stampa:
//   A
//   B

// callbackB viene ora eliminata.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Stampa:
//   A
```

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. This will not impact the order in which listeners are called, but it means that any copies of the listener array as returned by the `emitter.listeners()` method will need to be recreated.

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

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.setMaxListeners(n)

<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Restituisce: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. This is a useful default that helps finding memory leaks. Ovviamente, non tutti gli eventi dovrebbero essere limitati a soli 10 listener. The `emitter.setMaxListeners()` method allows the limit to be modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.rawListeners(eventName)

<!-- YAML
added: v9.4.0
-->

* `eventName` {string|symbol}
* Restituisce: {Function[]}

Returns a copy of the array of listeners for the event named `eventName`, including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Restituisce un nuovo Array con una funzione `onceWrapper` che ha una proprietà 
// `listener` che contiene la funzione binding originale del listener sopra 
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// registra "log once" alla console e non rimuove il binding dell'evento`once` 
logFnWrapper.listener();

// registra "log once" alla console ed elimina il listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// restituirà un nuovo Array con un singola funzione collegata tramite binding da `.on()` sopra
const newListeners = emitter.rawListeners('log');

// registra "log persistently" due volte
newListeners[0]();
emitter.emit('log');
```

## events.once(emitter, name)

<!-- YAML
added: v10.16.0
-->

* `emitter` {EventEmitter}
* `name` {string}
* Restituisce: {Promise}

Creates a `Promise` that is resolved when the `EventEmitter` emits the given event or that is rejected when the `EventEmitter` emits `'error'`. The `Promise` will resolve with an array of all the arguments emitted to the given event.

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