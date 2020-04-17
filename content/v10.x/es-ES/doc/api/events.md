# Eventos

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

Por ejemplo: un objeto [`net.Server`][] emite un evento cada vez que un par se conecta a este; un [`fs.ReadStream`][] emite un evento cuando el archivo es abierto; un [stream](stream.html) emite un evento cuando la información se encuentra disponible para ser leída.

Todos los objetos que emiten eventos son instancias de la clase `EventEmitter`. Estos objetos exponen una función `eventEmitter.on()` que permite a una o más funciones ser anexadas a eventos emitidos por el objeto. Típicamente, los nombres de los eventos son strings en Minúsculas/Mayúsculas pero cualquier propiedad válida de JavaScript puede ser usada.

Cuando el objeto `EventEmitter` emite un evento, todas las funciones adjuntas a ese objeto específico son llamadas *sincrónicamente*. Cualquier valor devuelto por las funciones listeners llamadas son *ignorados* y será descartado.

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

El método `eventEmitter.emit()` permite que un conjunto arbitrario de argumentos sea pasado a las funciones listeners. It is important to keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

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

El `EventEmitter` llama a todos los oyentes sincrónicamente en el orden en que se registraron. Esto es importante para asegurar la secuenciación de eventos propios y para evitar condiciones de raza o errores lógicos. Cuando sea apropiado, las funciones listener pueden cambiar a un modo de operación asíncrono usando los métodos `setImmediate()` o `process.nextTick()`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('Esto sucede asincronamente');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Manejar eventos sólo una vez

Cuando un listener es registrado usando el método `eventEmitter.on()`, ese listener será invocado *cada vez* que se emita el nombre del evento.

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

Usando el método `eventEmitter.once()`, es posible registrar a un listener que sea llamado como máximo una vez para un evento particular. Una vez el evento sea emitido, el listener deja de estar registrado y *luego* es llamado.

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

Si un `EventEmitter` *no* tiene al menos un listener registrado para el evento `'error'`, y se emite un evento `'error'`, se arroja el error, se imprime un stack trace, y el proceso Node.js se cierra.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Arroja y detiene a Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note, however, that the `domain` module is deprecated.)

Como la mejor práctica, los listeners deben siempre ser añadidos para los eventos de `'error'`.

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error('Ops! there was an error');
});
myEmitter.emit('error', new Error('whoops!'));
// Imprime: whoops! hubo un error
```

## Clase: EventEmitter

<!-- YAML
added: v0.1.26
-->

La clase `EventEmitter` es definida y expuesta por el módulo `events`:

```js
const EventEmitter = require('events');
```

All `EventEmitter`s emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

### Evento: 'newListener'

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol} El nombre del evento hacia el que se dirige la escucha
* `listener` {Function} La función manejadora de evento

La instancia `EventEmitter` emitirá su propio evento `'newListener'` *antes* de que se añada un listener a su array interno de listeners.

A los listeners registrados para el evento `'newListener'` se les pasará el nombre del evento y una referencia al listener que se está añadiendo.

El hecho de que el evento sea desencadenado antes de que se añada el listener, tiene un sútil pero importante efecto secundario: cualquier listener *additional* registrado al mismo `name` *dentro* del callback `'newListener'` será insertado *antes* que el listener que está en el proceso de ser añadido.

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

### Evento: 'removeListener'

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

El evento `'removeListener'` es emitido *después* de que se elimine el `listener`.

### EventEmitter.listenerCount(emitter, eventName)

<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} El nombre del evento

> Estabilidad: 0 - Desaprobado: Utilice [`emitter.listenerCount()`][] en su lugar.

Un método de clase que devuelve el número de funciones listeners para un dado `eventName` registrado en el `emitter` dado.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Imprime: 2
```

### EventEmitter.defaultMaxListeners

<!-- YAML
added: v0.11.2
-->

Por defecto, un máximo de `10` funciones listeners puede ser registrado para cada evento. Este límite puede ser cambiado para instancias `EventEmitter` usando el método [`emitter.setMaxListeners(n)`][]. Para cambiar el predeterminado por *todas* las instancias `EventEmitter`, la propiedad `EventEmitter.defaultMaxListeners` puede ser usada. If this value is not a positive number, a `TypeError` will be thrown.

Tome precaución al configurar el `EventEmitter.defaultMaxListeners` debido a que los cambios afectan a *todas* las instancias `EventEmitter`, incluyendo aquellas que fueran creadas antes de que el cambio fuera hecho. Sin embargo, llamar a [`emitter.setMaxListeners(n)`][] aún tiene precedencia sobre `EventEmitter.defaultMaxListeners`.

Note que esto no es un límite fuerte. La instancia `EventEmitter` permitirá que mas funciones listeners sean añadidas pero dará salida a una advertencia de tracer al stderr indicando que una "posible fuga de memoria del EventEmitter" ha sido detectada. Para cualquier `EventEmitter`, los métodos `emitter.getMaxListeners()` y `emitter.setMaxListeners()` pueden ser usados para temporalmente evitar esta advertencia:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // haga cosas
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

La bandera de línea de comando [`--trace-warnings`][] puede ser usada para mostrar el stack trace para dichas advertencias.

La advertencia emitida puede ser inspeccionada con [`process.on('warning')`][] y tendrá las propiedades adicionales `emitter`, `type` y `count`, refiriéndose a la instancia del emisor del evento, el nombre del evento y el número de listeners adjuntos, respectivamente. Su propiedad `name` se establece a `'MaxListenersExceededWarning'`.

### emitter.addListener(nombreDelEvento, listener)

<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* `listener` {Function}

Alias para `emitter.on(eventName, listener)`.

### emitter.emit(nombreDelEvento[, ...args])

<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* `...args` {any}
* Devuelve: {boolean}

Sincrónicamente llama a cada uno de los listeners registrados por el evento llamado `eventName`, en el orden en que se registraron, pasando los argumentos suministrados a cada uno.

Devuelve `true` si el evento tiene listeners, `false` si lo contrario.

### emitter.eventNames()

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

### emitter.getMaxListeners()

<!-- YAML
added: v1.0.0
-->

* Devuelve: {integer}

Devuelve el valor actual del máximo listener para el `EventEmitter` el cual es establecido por [`emitter.setMaxListeners(n)`][] o por defecto a [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(nombreDelEvento)

<!-- YAML
added: v3.2.0
-->

* `eventName` {string|symbol} El nombre del evento hacia el que se dirige la escucha
* Devuelve: {integer}

Devuelve el número de listeners que escuchan el evento llamado `eventName`.

### emitter.listeners(nombreDelEvento)

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

Devuelve una copia del array de listeners para el evento llamado `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Imprime: [ [Function] ]
```

### emitter.off(nombreDelEvento, listener)

<!-- YAML
added: v10.0.0
-->

* `nombreDelEvento` {string|symbol}
* `listener` {Function}
* Devuelve: {EventEmitter}

Alias para [`emitter.removeListener()`][].

### emitter.on(nombreDelEvento, listener)

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

### emitter.once(nombreDelEvento, listener)

<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Añade una función `listener` de **emisión única** para el evento nombrado `eventName`. La siguiente vez que se desencadene el `eventName`, se elimina el listener y luego se invoca.

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

### emitter.prependListener(nombreDelEvento, listener)

<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Añade la función `listener` al *comienzo* del array de listeners para el evento llamado `eventName`. Ninguna verificación es hecha para observar si la función `listener` ha sido añadida. Múltiples llamadas que pasan la misma combinación de `eventName` y `listener` resultarán en el`listener` siendo añadido, y llamado, múltiples veces.

```js
server.prependListener('connection', (stream) => {
  console.log('alguien conectado!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.prependOnceListener(nombreDelEvento, listener)

<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} El nombre del evento.
* `listener` {Function} La función callback
* Devuelve: {EventEmitter}

Añade una función `listener` de **emisión única** para el evento nombrado `eventName` al *inicio* del array de listeners. La siguiente vez que se desencadene el `eventName`, se eliminará el listener y luego se invoca.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, tenemos nuestro primer usuario!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.removeAllListeners([nombreDelEvento])

<!-- YAML
added: v0.1.26
-->

* `nombreDelEvento` {string|symbol}
* Devuelve: {EventEmitter}

Elimina a todos los listeners, o a aquellos del `eventName` especificado.

Note que es una mala práctica eliminar listeners añadidos en otro lugar en el código, particularmente cuando la instancia `EventEmitter` fue creada por otro componente o módulo (p. ej. sockets o streams de archivo).

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.removeListener(nombreDelEvento, listener)

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

Note que una vez que un evento haya sido emitido, todos los listeners adjuntos a él al momento de la emisión serán llamados en orden. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Los eventos subsecuentes se comportarán como se espera.

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

Debido a que los listeners son manejados utilizando un array interno, llamar a esto cambiará los índices de posición de cualquier listener registrado *después* de que el listener haya sido eliminado. Esto no afectará el orden en que se llamen a los listeners, pero significa que cualquier copia del array del listener devuelto por el método `emitter.listeners()` tendrá que ser recreado.

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

### emitter.setMaxListeners(n)

<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Devuelve: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. Esta es una predeterminación útil que ayuda a encontrar fugas de memoria. Obviamente, no todos los eventos deben estar limitados a sólo 10 listeners. El método `emitter.setMaxListeners()` permite la modificación del limite para esta instancia especifica del `EventEmitter`. El valor puede establecerse a `Infinity` (o `0`) para indicar un número ilimitado de listeners.

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.rawListeners(nombreDelEvento)

<!-- YAML
added: v9.4.0
-->

* `nombreDelEvento` {string|symbol}
* Devuelve: {Function[]}

Returns a copy of the array of listeners for the event named `eventName`, including any wrappers (such as those created by `.once()`).

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('log once'));

// Devuelve un Array nuevo con una función `onceWrapper`, la cual tiene una propiedad
// `listener`, la cual contiene al oyente original vinculado arriba
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// registra "log once" a la consola y no desvincula al evento `once`
logFnWrapper.listener();

// registra "log once" a la consola y elimina al listener
logFnWrapper();

emitter.on('log', () => console.log('log persistently'));
// devolverá un Array nuevo con una función simple vinculada por `.on()` arriba
const newListeners = emitter.rawListeners('log');

// registra a "log persistently" dos veces
newListeners[0]();
emitter.emit('log');
```

## events.once(emitter, name)

<!-- YAML
added: v10.16.0
-->

* `emitter` {EventEmitter}
* `name` {string}
* Devuelve: {Promise}

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