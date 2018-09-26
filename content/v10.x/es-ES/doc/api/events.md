# Eventos

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

<!--type=module-->

Gran parte de la API principal de Nodejs está construida alrededor de una arquitectura idiomática dirigida por eventos asíncronos en la cual ciertas clases de objetos (llamados "emisores") emiten eventos nombrados que causan ` Function ` objetos ("escuchadores") para ser llamados.

Para la instancia: a [`net.Server`][] el objeto emite un evento cada vez que un par se conecta a este; un [`fs.ReadStream`][] emite un evento cuando el archivo es abierto; un [stream](stream.html) emite un evento cuando la información está disponible para ser leida.

Todos los objetos que emiten eventos son instancia de la clase `EventEmitter`. Estos objetos exponen una función `eventEmitter.on()` que permite a una o más funciones ser anexadas a eventos emitidos por el objeto. Típicamente, los nombres de los eventos son cadenas en Minúsculas/Mayúsculas pero alguna propiedad válida de Javascript puede ser usada.

Cuando el objeto `EventEmitter` emite un evento, todos las funciones adjuntas a ese evento específico son llamadas *synchronously*. Cualquier valor retornado por los escuchadores es *ignorado* y será descartado.

El siguiente ejemplo muestra una simple instacia de `EventEmitter` con un solo escuchador. El método `eventEmitter.on()` es usado para registrar escuchadores, mientras el método `eventEmitter.emit()` es usado para desencadenar el evento.

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('an event occurred!');
});
myEmitter.emit('event');
```

## Pasando argumentos y `this` a escuchadores

El método `eventEmitter.emit()` permite un conjunto arbitrario de argumentos para que sean pasados a las funciones escuchadoras. Es importante mantener en mente que cuando una función oyente ordinaria es llamada, la palabra clave estándar `this` está intencionalmente establecida para referenciar a la instancia `EventEmitter` a la cual el oyente está adjunto.

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

Es posible usar funciones flecha de ES6 como escuchadores, sin embargo, cuando hacemos esto, la palabra reservada `this` ya no referenciará a la instancia `EventEmitter`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // Imprime: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## Asíncrono vs. Síncrono

El `EventEmitter` llama a todos los oyentes sincrónicamente en el orden en que se registraron. Esto es importante para asegurar la secuenciación de eventos propia y para evitar condiciones de raza o errores lógicos. Cuando sea apropiado, las funciones oyentes puede cambiar a un modo asincrónico de operación utilizando los métodos `setImmediate()` o `process.nextTick()`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('this happens asynchronously');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Manejando eventos sólo una vez

Cuando se registra a un oyente utilizando el método `eventEmitter.on()`, ese oyente será invocado *cada vez* que se emita el nombre del evento.

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

Con el uso del método `eventEmitter.once()` es posible registrar a un oyente que sea llamado como máximo una vez para un evento particular. Once the event is emitted, the listener is unregistered and *then* called.

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

Cuando un error ocurre dentro de una instancia de `EventEmitter`, la acción típica es que se emita un evento de `'error'`. Estos son tratados como casos especiales dentro de Node.js.

Si un `EventEmitter` *no* tiene al menos un oyente registrado para el evento `'error'`, y se emite un evento `'error'`, se arroja el error, se imprime un stack trace y el proceso Node.js se cierra.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Arroja y detiene a Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note que, sin embargo, el módulo `domain` ha sido desaprobado.)

Como la mejor práctica, los oyentes deben siempre ser añadidos para los eventos de `'error'`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error('whoops! there was an error');
});
myEmitter.emit('error', new Error('whoops!'));
// Imprime: whoops! there was an error
```

## Clase: EventEmitter

<!-- YAML
added: v0.1.26
-->

La clase `EventEmitter` es definida y expuesta por el módulo `events`:

```js
const EventEmitter = require('events');
```

Todos los `EventEmitter`s emiten el evento `'newListener'` cuando se añaden nuevos oyentes y `'removeListener'` cuando se eliminan oyentes existentes.

### Evento: 'newListener'

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol} El nombre del evento para el que está siendo escuchado
- `listener` {Function} La función manejadora de evento

La instancia `EventEmitter` emitirá su propio evento `'newListener'` *antes* de que se añada a un oyente a su array interno de oyentes.

Los oyentes registrados para el evento `'newListener'` se les pasarán el nombre del evento y una referencia al oyente que se está añadiendo.

El hecho de que el evento es desencadenado antes de que se añada el oyente tiene un sutil pero importante efecto secundario: cualquier oyente *adicional* registrado al mismo `name` *dentro* del callback `'newListener'` será insertado *antes* que el oyente que está en proceso de ser añadido.

```js
const myEmitter = new MyEmitter();
// Only do this once so we don't loop forever
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // Insert a new listener in front
    myEmitter.on('event', () => {
      console.log('B');
    });
  }
});
myEmitter.on('event', () => {
  console.log('A');
});
myEmitter.emit('event');
// Prints:
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

- `eventName` {string|symbol} The event name
- `listener` {Function} The event handler function

The `'removeListener'` event is emitted *after* the `listener` is removed.

### EventEmitter.listenerCount(emitter, eventName)

<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Stability: 0 - Deprecated: Use [`emitter.listenerCount()`][] instead.

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Prints: 2
```

### EventEmitter.defaultMaxListeners

<!-- YAML
added: v0.11.2
-->

By default, a maximum of `10` listeners can be registered for any single event. This limit can be changed for individual `EventEmitter` instances using the [`emitter.setMaxListeners(n)`][] method. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. However, calling [`emitter.setMaxListeners(n)`][] still has precedence over `EventEmitter.defaultMaxListeners`.

Note that this is not a hard limit. The `EventEmitter` instance will allow more listeners to be added but will output a trace warning to stderr indicating that a "possible EventEmitter memory leak" has been detected. For any single `EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to temporarily avoid this warning:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // do stuff
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

The [`--trace-warnings`][] command line flag can be used to display the stack trace for such warnings.

The emitted warning can be inspected with [`process.on('warning')`][] and will have the additional `emitter`, `type` and `count` properties, referring to the event emitter instance, the event’s name and the number of attached listeners, respectively. Its `name` property is set to `'MaxListenersExceededWarning'`.

### emitter.addListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `listener` {Function}

Alias for `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `...args` {any}
- Returns: {boolean}

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments to each.

Returns `true` if the event had listeners, `false` otherwise.

### emitter.eventNames()

<!-- YAML
added: v6.0.0
-->

- Returns: {Array}

Returns an array listing the events for which the emitter has registered listeners. The values in the array will be strings or `Symbol`s.

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// Prints: [ 'foo', 'bar', Symbol(symbol) ]
```

### emitter.getMaxListeners()

<!-- YAML
added: v1.0.0
-->

- Returns: {integer}

Returns the current max listener value for the `EventEmitter` which is either set by [`emitter.setMaxListeners(n)`][] or defaults to [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)

<!-- YAML
added: v3.2.0
-->

- `eventName` {string|symbol} The name of the event being listened for
- Returns: {integer}

Returns the number of listeners listening to the event named `eventName`.

### emitter.listeners(eventName)

<!-- YAML
added: v0.1.26
changes:

  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6881
    description: For listeners attached using `.once()` this returns the
                 original listeners instead of wrapper functions now.
-->

- `eventName` {string|symbol}
- Returns: {Function[]}

Returns a copy of the array of listeners for the event named `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Prints: [ [Function] ]
```

### emitter.off(eventName, listener)

<!-- YAML
added: v10.0.0
-->

- `eventName` {string|symbol}
- `listener` {Function}
- Returns: {EventEmitter}

Alias for [`emitter.removeListener()`][].

### emitter.on(eventName, listener)

<!-- YAML
added: v0.1.101
-->

- `eventName` {string|symbol} The name of the event.
- `listener` {Function} The callback function
- Returns: {EventEmitter}

Adds the `listener` function to the end of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

### emitter.once(eventName, listener)

<!-- YAML
added: v0.3.0
-->

- `eventName` {string|symbol} The name of the event.
- `listener` {Function} The callback function
- Returns: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName`. The next time `eventName` is triggered, this listener is removed and then invoked.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

By default, event listeners are invoked in the order they are added. The `emitter.prependOnceListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// Prints:
//   b
//   a
```

### emitter.prependListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

- `eventName` {string|symbol} The name of the event.
- `listener` {Function} The callback function
- Returns: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.prependOnceListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

- `eventName` {string|symbol} The name of the event.
- `listener` {Function} The callback function
- Returns: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. The next time `eventName` is triggered, this listener is removed, and then invoked.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.removeAllListeners([eventName])

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- Returns: {EventEmitter}

Removes all listeners, or those of the specified `eventName`.

Note that it is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.removeListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `listener` {Function}
- Returns: {EventEmitter}

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

Note that once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Subsequent events will behave as expected.

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

// callbackA removes listener callbackB but it will still be called.
// Internal listener array at time of emit [callbackA, callbackB]
myEmitter.emit('event');
// Prints:
//   A
//   B

// callbackB is now removed.
// Internal listener array [callbackA]
myEmitter.emit('event');
// Prints:
//   A
```

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. This will not impact the order in which listeners are called, but it means that any copies of the listener array as returned by the `emitter.listeners()` method will need to be recreated.

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.setMaxListeners(n)

<!-- YAML
added: v0.3.5
-->

- `n` {integer}
- Returns: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. This is a useful default that helps finding memory leaks. Obviously, not all events should be limited to just 10 listeners. The `emitter.setMaxListeners()` method allows the limit to be modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.rawListeners(eventName)

<!-- YAML
added: v9.4.0
-->

- `eventName` {string|symbol}
- Returns: {Function[]}

Returns a copy of the array of listeners for the event named `eventName`, including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Returns a new Array with a function `onceWrapper` which has a property
// `listener` which contains the original listener bound above
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// logs "log once" to the console and does not unbind the `once` event
logFnWrapper.listener();

// logs "log once" to the console and removes the listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// will return a new Array with a single function bound by `.on()` above
const newListeners = emitter.rawListeners('log');

// logs "log persistently" twice
newListeners[0]();
emitter.emit('log');
```