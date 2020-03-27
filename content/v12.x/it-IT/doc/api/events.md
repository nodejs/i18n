# Eventi

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

Per esempio: un object [`net.Server`][] emette un evento ogni volta che un peer si connette ad esso; un [`fs.ReadStream`][] emette un evento quando viene aperto il file; uno [stream](stream.html) emette un evento ogni volta che i dati sono disponibili per la lettura.

Tutti gli object che emettono eventi sono istanze della classe `EventEmitter`. Questi object espongono una funzione `eventEmitter.on()` la quale consente che una o più funzioni vengano allegate agli eventi con nome emessi dagli object. Generalmente, i nomi degli eventi sono stringhe con notazione camel-case tuttavia è possibile utilizzare qualsiasi property key di JavaScript valida.

When the `EventEmitter` object emits an event, all of the functions attached to that specific event are called _synchronously_. Any values returned by the called listeners are _ignored_ and will be discarded.

L'esempio seguente mostra un'istanza `EventEmitter` semplice con un singolo listener. Il metodo `eventEmitter.on()` viene utilizzato per registrare i listener, mentre il metodo `eventEmitter.emit()` viene utilizzato per attivare l'evento.

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

Il metodo `eventEmitter.emit()` consente di passare un set arbitrario di argomenti alle funzioni listener. Keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

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

È possibile utilizzare le Funzioni Arrow E26 come listener, tuttavia, facendo ciò, la parola chiave `this` non si riferirà più all'istanza `EventEmitter`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // Stampa: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## Asincrono vs. Sincrono

L'`EventEmitter` chiama tutti i listener in maniera sincrona nell'ordine in cui sono stati registrati. This ensures the proper sequencing of events and helps avoid race conditions and logic errors. Nei casi appropriati, è possibile passare le funzioni listener ad una modalità di operazione asincrona utilizzando i metodi `setImmediate()` o `process.nextTick()`:

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

When a listener is registered using the `eventEmitter.on()` method, that listener will be invoked _every time_ the named event is emitted.

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

Utilizzando il metodo `eventEmitter.once()`, è possibile registrare un listener che venga chiamato al massimo una volta per un evento particolare. Once the event is emitted, the listener is unregistered and *then* called.

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

Quando si verifica un errore all'interno di un'istanza `EventEmitter`, l'azione tipica è l'emissione di un evento `'error'`. Questi vengono trattati come casi speciali all'interno di Node.js.

If an `EventEmitter` does _not_ have at least one listener registered for the `'error'` event, and an `'error'` event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits.

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

La classe `EventEmitter` viene definita ed esposta dal modulo `events`:

```js
const EventEmitter = require('events');
```

All `EventEmitter`s emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

It supports the following option:

* `captureRejections` {boolean} It enables [automatic capturing of promise rejection](#events_capture_rejections_of_promises). Default: `false`.

### Event: 'newListener'
<!-- YAML
added: v0.1.26
-->

* `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
* `listener` {Function} La funzione dell'event handler

The `EventEmitter` instance will emit its own `'newListener'` event *before* a listener is added to its internal array of listeners.

Ai listener registrati per l'event `'newListener'` verrà passato il nome dell'evento ed un riferimento al listener che viene aggiunto.

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

### Event: `'removeListener'`
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

The `'removeListener'` event is emitted *after* the `listener` is removed.

### `EventEmitter.listenerCount(emitter, eventName)`
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Stabilità: 0 - Deprecato: Utilizza [`emitter.listenerCount()`][] al suo posto.

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} Il nome dell'evento

Un metodo di classe che restituisce il numero di listener per un determinato `eventName` registrato su un `emitter` specifico.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Stampa: 2
```

### `EventEmitter.defaultMaxListeners`
<!-- YAML
added: v0.11.2
-->

Di default, è possibile registrare un massimo di `10` listener per ogni singolo evento. Tale limite può essere modificato per istanze `EventEmitter` singole utilizzando il metodo [`emitter.setMaxListeners(n)`][]. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. Tuttavia, chiamare [`emitter.setMaxListeners(n)`][] mantiene la precedenza su `EventEmitter.defaultMaxListeners`.

This is not a hard limit. L'istanza `EventEmitter` permetterà di aggiungere ulteriori listener ma produrrà un trace warning su stderr indicante che è stata rilevata una "possibile perdita di memoria di EventEmitter". Per ogni singolo `EventEmitter`, si possono utilizzare i metodi `emitter.getMaxListeners()` e `emitter.setMaxListeners()` per evitare temporaneamente questo avviso:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // fai operazione
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

Il flag [`--trace-warnings`][] della command line può essere utilizzato per mostrare la stack trace di tali avvisi.

L'avviso emesso può essere ispezionato con [`process.on('warning')`][] e avrà le proprietà aggiuntive `emitter`, `type` e `count`, che si riferiscono rispettivamente all'istanza dell'event emitter, al nome dell'evento e al numero di listener allegati. La sua proprietà `name` è impostata su `'MaxListenersExceededWarning'`.

### `emitter.addListener(eventName, listener)`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}

Alias per `emitter.on(eventName, listener)`.

### `emitter.emit(eventName[, ...args])`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `...args` {any}
* Restituisce: {boolean}

Chiama in maniera sincrona ognuno dei listener registrati per l'evento con nome `eventName`, nell'ordine di registrazione, passando gli argomenti forniti a ciascuno.

Restituisce `true` se l'evento ha avuto listener, `false` in caso contrario.

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

* Restituisce: {Array}

Restituisce un array che elenca gli eventi per i quali l'emitter ha registrato i listener. I valori nell'array saranno stringhe o `Symbol`.

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

### `emitter.getMaxListeners()`
<!-- YAML
added: v1.0.0
-->

* Restituisce: {integer}

Restituisce il valore corrente massimo di listener per l'`EventEmitter` che è impostato dall'[`emitter.setMaxListeners(n)`][] o di default in [`EventEmitter.defaultMaxListeners`][].

### `emitter.listenerCount(eventName)`
<!-- YAML
added: v3.2.0
-->

* `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
* Restituisce: {integer}

Restituisce il numero di listener sottoposti al listening dell'evento con nome `eventName`.

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
* Restituisce: {Function[]}

Restituisce una copia dell'array dei listener per l'evento con nome `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Stampa: [ [Function] ]
```

### `emitter.off(eventName, listener)`
<!-- YAML
added: v10.0.0
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Restituisce: {EventEmitter}

Alias di [`emitter.removeListener()`][].

### `emitter.on(eventName, listener)`
<!-- YAML
added: v0.1.101
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Aggiunge la funzione `listener` alla fine dell'array dei listener per l'evento con nome `eventName`. Non viene effettuato nessun controllo per verificare se il `listener` sia già stato aggiunto. Molteplici chiamate passanti la stessa combinazione di `eventName` e `listener` comporteranno che il `listener` verrà aggiunto, e chiamato, più volte.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

Di default, gli eventi listener vengono invocati nell'ordine in cui vengono aggiunti. Il metodo `emitter.prependListener()` può essere utilizzato come alternativa per aggiungere l'evento listener all'inizio dell'array dei listener.

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Stampa:
//   b
//   a
```

### `emitter.once(eventName, listener)`
<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName`. La volta successiva in cui viene attivato `eventName`, il listener viene eliminato e poi invocato.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

Di default, gli eventi listener vengono invocati nell'ordine in cui vengono aggiunti. Il metodo `emitter.prependListener()` può essere utilizzato come alternativa per aggiungere l'evento listener all'inizio dell'array dei listener.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Stampa:
//   b
//   a
```

### `emitter.prependListener(eventName, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. Non viene effettuato nessun controllo per verificare se il `listener` sia già stato aggiunto. Molteplici chiamate passanti la stessa combinazione di `eventName` e `listener` comporteranno che il `listener` verrà aggiunto, e chiamato, più volte.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### `emitter.prependOnceListener(eventName, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} Il nome dell'evento.
* `listener` {Function} La funzione callback
* Restituisce: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. La volta successiva in cui viene attivato `eventName`, il listener viene eliminato, e poi invocato.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### `emitter.removeAllListeners([eventName])`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* Restituisce: {EventEmitter}

Rimuove tutti i listeners, oppure quelli dell'`eventName` specificato.

It is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### `emitter.removeListener(eventName, listener)`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Restituisce: {EventEmitter}

Rimuove il `listener` specificato dall'array del listener per l'evento con nome `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Gli eventi successivi si comporteranno come previsto.

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

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. Ciò non avrà nessun impatto sull'ordine in cui i listener vengono chiamati, ma indica che qualsiasi copia dell'array del listener restituita dal metodo `emitter.listeners()` dovrà essere ricreata.

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

### `emitter.setMaxListeners(n)`
<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Restituisce: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. Questa è un'utile impostazione predefinita che contribuisce a trovare perdite di memoria. Ovviamente, non tutti gli eventi dovrebbero essere limitati a soli 10 listener. Il metodo `emitter.setMaxListeners()` consente di modificare i limiti per questa specifica istanza di `EventEmitter`. Il valore può essere impostato su `Infinity` (o `0`) per indicare un numero illimitato di listener.

Restituisce un riferimento all'`EventEmitter`, in modo che le chiamate possano essere concatenate.

### `emitter.rawListeners(eventName)`
<!-- YAML
added: v9.4.0
-->

* `eventName` {string|symbol}
* Restituisce: {Function[]}

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
* Restituisce: {Promise}

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
* `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
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
