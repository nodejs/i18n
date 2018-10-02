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

El método `eventEmitter.emit()` permite un conjunto arbitrario de argumentos para que sean pasados a las funciones escuchadoras. Es importante tener en mente que cuando una función listener ordinaria es llamada, la palabra clave estándar `this` está intencionalmente establecida para referenciar a la instancia `EventEmitter` a la cual el listener está adjunto.

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

El `EventEmitter` llama a todos los oyentes sincrónicamente en el orden en que se registraron. Esto es importante para asegurar la secuenciación de eventos propia y para evitar condiciones de raza o errores lógicos. Cuando sea apropiado, las funciones listener puede cambiar a un modo asincrónico de operación utilizando los métodos `setImmediate()` o `process.nextTick()`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('this happens asynchronously');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Manejar eventos sólo una vez

Cuando se registra a un listener utilizando el método `eventEmitter.on()`, ese listener será invocado *cada vez* que se emita el nombre del evento.

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

Con el uso del método `eventEmitter.once()` es posible registrar a un listener que sea llamado como máximo una vez para un evento particular. Once the event is emitted, the listener is unregistered and *then* called.

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

Si un `EventEmitter` *no* tiene al menos un listener registrado para el evento `'error'`, y se emite un evento `'error'`, se arroja el error, se imprime un stack trace y el proceso Node.js se cierra.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Arroja y detiene a Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note que, sin embargo, el módulo `domain` ha sido desaprobado.)

Como la mejor práctica, los listeners deben siempre ser añadidos para los eventos de `'error'`.

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

Todos los `EventEmitter`s emiten el evento `'newListener'` cuando se añaden nuevos listeners y `'removeListener'` cuando se eliminan listeners existentes.

### Evento: 'newListener'

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol} El nombre del evento hacia el que se dirige la escucha
- `listener` {Function} La función manejadora de evento

La instancia `EventEmitter` emitirá su propio evento `'newListener'` *antes* de que se añada a un listener a su array interno de listeners.

A los listeners registrados para el evento `'newListener'` se les pasará el nombre del evento y una referencia al listener que se está añadiendo.

El hecho de que el evento es desencadenado antes de que se añada el listener tiene un sutil pero importante efecto secundario: cualquier listener *adicional* registrado al mismo `name` *dentro* del callback `'newListener'` será insertado *antes* que el listener que está en proceso de ser añadido.

```js
const myEmitter = new MyEmitter();
// Solo haga esto una vez para que no entremos en un bucle infinito
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // Inserte un nuevo oyente en frente
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

- `eventName` {string|symbol} El nombre del evento
- `listener` {Function} La función manejadora del evento

El evento `'removeListener'` es emitido *después* de que se elimine el `listener`.

### EventEmitter.listenerCount(emitter, eventName)

<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`emitter.listenerCount()`][] en su lugar.

Un método de clase que devuelva el número de listeners para el `eventName` dado registrado en el `emitter` dado.

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

Por defecto, pueden registrarse un máximo de `10` listeners por cada evento. Este límite puede cambiar para instancias de `EventEmitter` individuales utilizando el método [`emitter.setMaxListeners(n)`][]. Para cambiar el predeterminado por *todas* las instancias de `EventEmitter`, se puede utilizar la propiedad `EventEmitter.defaultMaxListeners`. Si este valor no es un número positivo, se arrojará un `TypeError`.

Tome precaución al configurar el `EventEmitter.defaultMaxListeners` debido a que los cambios afectan a *todas* las instancias de `EventEmitter`, incluyendo a aquellas creadas antes de que se haya hecho el cambio. Sin embargo, el llamar a [`emitter.setMaxListeners(n)`][] todavía tiene precedencia sobre `EventEmitter.defaultMaxListeners`.

Note que esto no es un límite fuerte. La instancia `EventEmitter` permitirá que se añadan más listeners, pero dará salida a una advertencia de trace a stderr, indicando que una "posible fuga de memoria del EventEmitter" ha sido detectada. Para cualquier `EventEmitter`, los métodos `emitter.getMaxListeners()` y `emitter.setMaxListeners()` pueden usarse para evitar temporalmente esta advertencia:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // haga cosas
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

La bandera de línea de comando [`--trace-warnings`][] puede utilizarse para mostrar el stack trace para dichas advertencias.

La advertencia emitida puede ser inspeccionada con [`process.on('warning')`][] y hará que las propiedades adicionales `emitter`, `type` y `count` se refieran a la instancia del emisor del evento, al nombre del evento y al número de listeners adjuntos, respectivamente. Su propiedad `name` se establece a `'MaxListenersExceededWarning'`.

### emitter.addListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `listener` {Function}

Alias para `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `...args` {any}
- Devuelve: {boolean}

Sincrónicamente llama a cada uno de los listeners registrados para el evento llamado `eventName`, en el orden en que se registraron, pasando los argumentos suministrados a cada uno.

Devuelve `true` si el evento tiene listeners, `false` si lo contrario.

### emitter.eventNames()

<!-- YAML
added: v6.0.0
-->

- Devuelve: {Array}

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

- Devuelve: {integer}

Devuelve el valor actual de listener máximo para el `EventEmitter`, el cual es establecido por [`emitter.setMaxListeners(n)`][] o se predetermina a [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)

<!-- YAML
added: v3.2.0
-->

- `eventName` {string|symbol} El nombre del evento hacia el que se dirige la escucha
- Devuelve: {integer}

Devuelve el número de listeners que escuchan el evento llamado `eventName`.

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
- Devuelve: {Function[]}

Devuelve una copia del array de listeners para el evento llamado `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Imprime: [ [Function] ]
```

### emitter.off(eventName, listener)

<!-- YAML
added: v10.0.0
-->

- `eventName` {string|symbol}
- `listener` {Function}
- Devuelve: {EventEmitter}

Alias para [`emitter.removeListener()`][].

### emitter.on(eventName, listener)

<!-- YAML
added: v0.1.101
-->

- `eventName` {string|symbol} El nombre del evento.
- `listener` {Function} La función callback
- Devuelve: {EventEmitter}

Añade la función `listener` al final del array de listeners para el evento llamado `eventName`. No se hacen verificaciones para ver si el `listener` ya ha sido añadido. Múltiples llamadas que pasen la misma combinación de `eventName` y `listener` resultarán en que se añada el `listener`, y sea llamado múltiples veces.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
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

### emitter.once(eventName, listener)

<!-- YAML
added: v0.3.0
-->

- `eventName` {string|symbol} El nombre del evento.
- `listener` {Function} La función callback
- Devuelve: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName`. La siguiente vez que se desencadene el `eventName`, se elimina el listener y luego se invoca.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
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

### emitter.prependListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

- `eventName` {string|symbol} El nombre del evento.
- `listener` {Function} La función callback
- Devuelve: {EventEmitter}

Añade la función `listener` al *comienzo* del array de listeners para el evento llamado `eventName`. No se hacen verificaciones para ver si el `listener` ya ha sido añadido. Múltiples llamadas que pasen la misma combinación de `eventName` y `listener` resultarán en que se añada el `listener` y sea llamado múltiples veces.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.prependOnceListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

- `eventName` {string|symbol} El nombre del evento.
- `listener` {Function} La función callback
- Devuelve: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. La siguiente vez que se desencadene el `eventName`, se eliminará el listener y luego se invoca.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.removeAllListeners([eventName])

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- Devuelve: {EventEmitter}

Elimina a todos los listeners, o a aquellos del `eventName` especificado.

Note que es una mala práctica eliminar listeners añadidos en otro lugar en el código, particularmente cuando la instancia `EventEmitter` fue creada por otro componente o módulo (p. ej. sockets o streams de archivo).

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.removeListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `listener` {Function}
- Devuelve: {EventEmitter}

Elimina el `listener` especificado del array del listener para el evento llamado `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener()` eliminará, como máximo, una instancia de un listener del array de listener. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

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

Devuelve una referencia para el `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.setMaxListeners(n)

<!-- YAML
added: v0.3.5
-->

- `n` {integer}
- Devuelve: {EventEmitter}

Por efecto, los `EventEmitter`s imprimirán una advertencia si más de `10` listeners son añadidos para un evento particular. Esta es una predeterminación útil que ayuda a encontrar fugas de memoria. Obviamente, no todos los eventos deben estar limitados a sólo 10 listeners. The `emitter.setMaxListeners()` method allows the limit to be modified for this specific `EventEmitter` instance. El valor puede establecerse a `Infinity` (o `0`) para indicar un número ilimitado de listeners.

Devuelve una referencia al `EventEmitter`, para que las llamadas puedan ser encadenadas.

### emitter.rawListeners(eventName)

<!-- YAML
added: v9.4.0
-->

- `eventName` {string|symbol}
- Devuelve: {Function[]}

Devuelve una copia del array de listeners para el evento llamado `eventName`, incluyendo cualquier envoltura (como las creadas por `.once()`).

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