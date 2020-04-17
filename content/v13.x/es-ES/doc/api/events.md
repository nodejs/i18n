# Eventos

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

Por ejemplo: un objeto [`net.Server`][] emite un evento cada vez que un par se conecta a este; un [`fs.ReadStream`][] emite un evento cuando el archivo es abierto; un [stream](stream.html) emite un evento cuando la información se encuentra disponible para ser leída.

Todos los objetos que emiten eventos son instancias de la clase `EventEmitter`. Estos objetos exponen una función `eventEmitter.on()` que permite a una o más funciones ser anexadas a eventos emitidos por el objeto. Típicamente, los nombres de los eventos son strings en Minúsculas/Mayúsculas pero cualquier propiedad válida de JavaScript puede ser usada.

When the `EventEmitter` object emits an event, all of the functions attached to that specific event are called _synchronously_. Any values returned by the called listeners are _ignored_ and will be discarded.

El siguiente ejemplo muestra una simple instancia `EventEmitter` con una sola función listener. El método `eventEmitter.on()` es usado para registrar listeners, mientras el método `eventEmitter.emit()` es usado para empezar el evento.

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('¡Un evento a ocurrido!');
});
myEmitter.emit('event');
```

## Pasar argumentos y `this` a los listeners

El método `eventEmitter.emit()` permite que un conjunto arbitrario de argumentos sea pasado a las funciones listeners. Keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', function(a, b) {
  console.log(a, b, this, this === myEmitter);
  // Imprime:
  //   a b MyEmitter {
  //     domain: null,
  //     _events: { event: [Function] },
  //     _eventsCount: 1,
  //     _maxListeners: undefined } true
});
myEmitter.emit('event', 'a', 'b');
```

Es posible usar funciones flecha de ES6 como listeners, sin embargo, cuando hacemos esto, la palabra reservada `this` ya no referenciará a la instancia `EventEmitter`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // Imprime: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## Asíncrono vs. Síncrono

El `EventEmitter` llama a todos los oyentes sincrónicamente en el orden en que se registraron. This ensures the proper sequencing of events and helps avoid race conditions and logic errors. Cuando sea apropiado, las funciones listener pueden cambiar a un modo de operación asíncrono usando los métodos `setImmediate()` o `process.nextTick()`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('Esto sucede asincronamente');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Manejando eventos solo una vez

When a listener is registered using the `eventEmitter.on()` method, that listener will be invoked _every time_ the named event is emitted.

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.on('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// Imprime: 1
myEmitter.emit('event');
// Imprime: 2
```

Usando el método `eventEmitter.once()`, es posible registrar a un listener que sea llamado como máximo una vez para un evento particular. Once the event is emitted, the listener is unregistered and *then* called.

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.once('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// Imprime: 1
myEmitter.emit('event');
// Ignorado
```

## Eventos de error

Cuando ocurre un error dentro de una instancia `EventEmitter`, la típica acción es que un evento `'error'` sea emitido. Estos son tratados como casos especiales dentro de Node.js.

If an `EventEmitter` does _not_ have at least one listener registered for the `'error'` event, and an `'error'` event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Arroja y detiene a Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note, however, that the `domain` module is deprecated.)

Como buena práctica, los listeners deben siempre ser añadidos para los eventos `'error'`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error('Ops! there was an error');
});
myEmitter.emit('error', new Error('whoops!'));
// Imprime: whoops! hubo un error
```

It is possible to monitor `'error'` events without consuming the emitted error by installing a listener using the symbol `errorMonitor`.

```js
const myEmitter = new MyEmitter();
myEmitter.on(EventEmitter.errorMonitor, (err) => {
  MyMonitoringTool.log(err);
});
myEmitter.emit('error', new Error('whoops!'));
// Still throws and crashes Node.js
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
  - version: v13.4.0
    pr-url: https://github.com/nodejs/node/pull/27867
    description: Added captureRejections option.
-->

La clase `EventEmitter` está definida y expuesta por el módulo `events`:

```js
const EventEmitter = require('events');
```

All `EventEmitter`s emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

It supports the following option:

* `captureRejections` {boolean} It enables [automatic capturing of promise rejection](#events_capture_rejections_of_promises). Default: `false`.

### Event: `'newListener'`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol} El nombre del evento que está siendo escuchado
* `listener` {Function} La función manejadora del evento

The `EventEmitter` instance will emit its own `'newListener'` event *before* a listener is added to its internal array of listeners.

A los listeners registrados para el evento `'newListener'` se les pasará el nombre del evento y una referencia al listener que se está añadiendo.

The fact that the event is triggered before adding the listener has a subtle but important side effect: any *additional* listeners registered to the same `name` *within* the `'newListener'` callback will be inserted *before* the listener that is in the process of being added.

```js
const myEmitter = new MyEmitter();
// Solo realizar esto una vez para que no entremos en un bucle infinito
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // Insertar un nuevo listener al frente
    myEmitter.on('event', () => {
      console.log('B');
    });
  }
});
myEmitter.on('event', () => {
  console.log('A');
});
myEmitter.emit('event');
// Imprime:
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

* `eventName` {string|symbol} El nombre del evento
* `listener` {Function} La función manejadora del evento

The `'removeListener'` event is emitted *after* the `listener` is removed.

### `EventEmitter.listenerCount(emitter, eventName)`
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: Usar [`emitter.listenerCount()`][] en su lugar.

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} El nombre del evento

Un método de clase que devuelve el número de funciones listeners para un dado `eventName` registrado en el `emitter` dado.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Imprime: 2
```

### `EventEmitter.defaultMaxListeners`
<!-- YAML
added: v0.11.2
-->

Por defecto, un máximo de `10` funciones listeners puede ser registrado para cada evento. Este límite puede ser cambiado para instancias `EventEmitter` usando el método [`emitter.setMaxListeners(n)`][]. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. Sin embargo, llamar a [`emitter.setMaxListeners(n)`][] aún tiene precedencia sobre `EventEmitter.defaultMaxListeners`.

This is not a hard limit. La instancia `EventEmitter` permitirá que mas funciones listeners sean añadidas pero dará salida a una advertencia de tracer al stderr indicando que una "posible fuga de memoria del EventEmitter" ha sido detectada. Para cualquier `EventEmitter`, los métodos `emitter.getMaxListeners()` y `emitter.setMaxListeners()` pueden ser usados para temporalmente evitar esta advertencia:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // haga cosas
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

La bandera de línea de comando [`--trace-warnings`][] puede ser usada para mostrar el stack trace para dichas advertencias.

La advertencia emitida puede ser inspeccionada con [`process.on('warning')`][] y tendrá las propiedades adicionales `emitter`, `type` y `count`, refiriéndose a la instancia del emisor del evento, el nombre del evento y el número de listeners adjuntos, respectivamente. Su propiedad `name` se establece a `'MaxListenersExceededWarning'`.

### `EventEmitter.errorMonitor`
<!-- YAML
added: v13.6.0
-->

This symbol shall be used to install a listener for only monitoring `'error'` events. Listeners installed using this symbol are called before the regular `'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an `'error'` event is emitted, therefore the process will still crash if no regular `'error'` listener is installed.

### `emitter.addListener(nombreDelEvento, listener)`
<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* `listener` {Function}

Alias para `emitter.on(eventName, listener)`.

### `emitter.emit(nombreDelEvento[, ...args])`
<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* `...args` {any}
* Devuelve: {boolean}

Sincrónicamente llama a cada uno de los listeners registrados por el evento llamado `eventName`, en el orden en que se registraron, pasando los argumentos suministrados a cada uno.

Devuelve `true` si el evento tiene listeners, de lo contrario `false`.

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

* Devuelve: {Array}

Devuelve un array que lista los eventos para los cuales el emisor ha registrado listeners. Los valores en el array serán strings o `Symbol`s.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Imprime: [ 'foo', 'bar', Symbol(symbol) ]
```

### `emitter.getMaxListeners()`
<!-- YAML
added: v1.0.0
-->

* Devuelve: {integer}

Devuelve el valor actual del máximo listener para el `EventEmitter` el cual es establecido por [`emitter.setMaxListeners(n)`][] o por defecto a [`EventEmitter.defaultMaxListeners`][].

### `emitter.listenerCount(nombreDelEvento)`
<!-- YAML
added: v3.2.0
-->

* `eventName` {string|symbol} El nombre del evento que está siendo escuchado
* Devuelve: {integer}

Devuelve el número de listeners que escuchan el evento llamado `eventName`.

### `emitter.listeners(nombreDelEvento)`
<!-- YAML
added: v0.1.26
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6881
    description: For listeners attached using `.once()` this returns the
                 original listeners instead of wrapper functions now.
-->

* `nombreDelEvento` {string|symbol}
* Devuelve: {Function[]}

Devuelve una copia del array de listeners por el evento llamado `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Imprime: [ [Function] ]
```

### `emitter.off(nombreDelEvento, listener)`
<!-- YAML
added: v10.0.0
-->

* `nombreDelEvento` {string|symbol}
* `listener` {Function}
* Devuelve: {EventEmitter}

Alias para [`emitter.removeListener()`][].

### `emitter.on(nombreDelEvento, listener)`
<!-- YAML
added: v0.1.101
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Añade la función `listener` al final del array de listeners para el evento llamado `eventName`. Ninguna verificación es hecha para observar si la función `listener` ha sido añadida. Múltiples llamadas que pasan la misma combinación de `eventName` y `listener` resultarán en el`listener` siendo añadido, y llamado, múltiples veces.

```js
server.on('connection', (stream) => {
  console.log('alguien conectado!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

Por defecto, los listeners del evento son invocados en el orden en que se añaden. El método `emitter.prependListener()` puede ser utilizado como una alternativa para añadir el listener del evento al comienzo del array de listeners.

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Imprime:
//   b
//   a
```

### `emitter.once(nombreDelEvento, listener)`
<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName`. La siguiente vez que se desencadene el `eventName`, se elimina el listener y luego se invoca.

```js
server.once('connection', (stream) => {
  console.log('Ah, tenemos nuestro primer usuario!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

Por defecto, los listeners del evento son invocados en el orden en que se añaden. El método `emitter.prependOnceListener()` puede ser utilizado como una alternativa para añadir el listener del evento al comienzo del array de listeners.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Imprime:
//   b
//   a
```

### `emitter.prependListener(nombreDelEvento, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. Ninguna verificación es hecha para observar si la función `listener` ha sido añadida. Múltiples llamadas que pasan la misma combinación de `eventName` y `listener` resultarán en el`listener` siendo añadido, y llamado, múltiples veces.

```js
server.prependListener('connection', (stream) => {
  console.log('conexión entrante!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### `emitter.prependOnceListener(nombreDelEvento, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. La siguiente vez que se desencadene el `eventName`, se eliminará el listener y luego se invoca.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, tenemos nuestro primer usuario!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### `emitter.removeAllListeners([nombreDelEvento])`
<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* Devuelve: {EventEmitter}

Elimina a todos los listeners, o a aquellos del `eventName` especificado.

It is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### `emitter.removeListener(nombreDelEvento, listener)`
<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* `listener` {Function}
* Devuelve: {EventEmitter}

Elimina el `listener` especificado del array del listener para el evento llamado `eventName`.

```js
const callback = (stream) => {
  console.log('Alguien se conectó!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Los eventos subsecuentes se comportarán como se espera.

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

// callbackA elimina al listener callbackB pero aún así será llamado.
// Array interno de listener al momento de la emisión [callbackA, callbackB]
myEmitter.emit('event');
// Imprime:
//   A
//   B

// callbackB ahora está eliminado.
// Array interno de listener [callbackA]
myEmitter.emit('event');
// Imprime:
//   A
```

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. Esto no afectará el orden en que se llamen a los listeners, pero significa que cualquier copia del array del listener devuelto por el método `emitter.listeners()` tendrá que ser recreado.

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

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### `emitter.setMaxListeners(n)`
<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Devuelve: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. Esta es una predeterminación útil que ayuda a encontrar fugas de memoria. Obviamente, no todos los eventos deben estar limitados a sólo 10 listeners. El método `emitter.setMaxListeners()` permite la modificación del limite para esta instancia especifica del `EventEmitter`. El valor puede establecerse a `Infinity` (o `0`) para indicar un número ilimitado de listeners.

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### `emitter.rawListeners(nombreDelEvento)`
<!-- YAML
added: v9.4.0
-->

* `nombreDelEvento` {string|symbol}
* Devuelve: {Function[]}

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
added: v13.4.0
-->

> Stability: 1 - captureRejections is experimental.

* `err` Error
* `nombreDelEvento` {string|symbol}
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
* Devuelve: {Promise}

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

## `events.captureRejections`
<!-- YAML
added: v13.4.0
-->

> Stability: 1 - captureRejections is experimental.

Valor: {boolean}

Change the default `captureRejections` option on all new `EventEmitter` objects.

## `events.captureRejectionSymbol`
<!-- YAML
added: v13.4.0
-->

> Stability: 1 - captureRejections is experimental.

Value: `Symbol.for('nodejs.rejection')`

See how to write a custom [rejection handler](#events_emitter_symbol_for_nodejs_rejection_err_eventname_args).

## `events.on(emitter, eventName)`
<!-- YAML
added: v13.6.0
-->

* `emitter` {EventEmitter}
* `eventName` {string|symbol} El nombre del evento que está siendo escuchado
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
