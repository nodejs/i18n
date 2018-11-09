# Eventi

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

<!--type=module-->

Gran parte della core API di Node.js è costruita intorno ad un'architettura event-driven idiomatica ed asincrona nella quale alcuni tipi di object (chiamati "emitter") emettono eventi con nome che determinano che i `Function` object ("listener") vengano chiamati.

Per esempio: un object [`net.Server`][] emette un evento ogni volta che un peer si connette ad esso; un [`fs.ReadStream`][] emette un evento quando viene aperto il file; uno [stream](stream.html) emette un evento ogni volta che i dati sono disponibili per la lettura.

Tutti gli object che emettono eventi sono istanze della class `EventEmitter`. Questi object espongono una funzione `eventEmitter.on()` la quale consente che una o più funzioni vengano allegate agli eventi con nome emessi dagli object. Generalmente, i nomi degli eventi sono stringhe con notazione a cammello tuttavia è possibile utilizzare qualsiasi proprietà key di JavaScript valida.

Nel momento in cui l'object `EventEmitter` emette un evento, tutte le funzioni allegate a quello specifico evento vengono chiamate *in maniera sincrona*. Qualsiasi valore restituito dai listener chiamati viene *ignorato* e verrà scartato.

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

Il metodo `eventEmitter.emit()` consente di passare un set arbitrario di argomenti alle funzioni listener. È importante tenere a mente che nel momento in cui viene chiamata una funzione listener ordinaria, la parola chiave standard `this` viene intenzionalmente impostata per fare riferimento all'istanza `EventEmitter` alla quale è allegato il listener.

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

È possibile utilizzare le Funzioni Arrow E26 come listener, tuttavia, facendo questo, la parola chiave `this` non si riferirà più all'istanza `EventEmitter`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // Stampa: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## Asincrono vs. Sincrono

L'`EventEmitter` chiama tutti i listener in maniera sincrona nell'ordine in cui sono stati registrati. Ciò è importante per assicurare la corretta sequenza degli eventi e per evitare condizioni di competizione o errori logici. Nei casi appropriati, è possibile passare le funzioni listener ad una modalità di operazione asincrona utilizzando i metodi `setImmediate()` o `process.nextTick()`:

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('this happens asynchronously');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## Gestione degli eventi di una sola volta

Nel momento in cui un listener viene registrato utilizzando il metodo `eventEmitter.on()`, quel listener verrà invocato *ogni volta* che l'evento con nome viene emesso.

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

Utilizzando il metodo `eventEmitter.once()`, è possibile registrare un listener che venga chiamato al massimo una volta per un evento particolare. Una volta che l'evento viene emesso, il listener viene eliminato dal registro e *poi* chiamato.

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

Se un `EventEmitter` *non* possiede almeno un listener registrato per l'event `'error'`, ed un event `'error'` viene emesso, l'errore viene generato, viene stampata una stack trace, e il processo Node.js si conclude.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Throws and crashes Node.js
```

Per impedire l'arresto anomalo del processo di Node.js è possibile utilizzare il [`domain`][] module. (Nota, tuttavia, che il `domain` module è stato deprecato.)

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

La class `EventEmitter` viene definita ed esposta dal module `events`:

```js
const EventEmitter = require('events');
```

Tutti gli `EventEmitter` emettono l'event `'newListener'` quando vengono aggiunti nuovi listener e `'removeListener'` quando vengono eliminati listener esistenti.

### Event: 'newListener'

<!-- YAML
added: v0.1.26
-->

- `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
- `listener` {Function} La funzione dell'event handler

L'istanza `EventEmitter` emetterà il proprio event `'newListener'` *prima* che venga aggiunto un listener al suo array di listener interno.

Ai listener registrati per l'event `'newListener'` verrà passato il nome dell'evento ed un riferimento al listener che viene aggiunto.

Il fatto che l'evento venga attivato prima dell'aggiunta del listener genera un sottile ma importante effetto collaterale: ogni listener *aggiuntivo* registrato allo stesso `name` *all'interno* della callback `'newListener'` verrà inserito *prima* del listener che è in procinto di essere aggiunto.

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

- `eventName` {string|symbol} Il nome dell'evento
- `listener` {Function} La funzione dell'event handler

L'event `'removeListener'` viene emesso *dopo* l'eliminazione del `listener`.

### EventEmitter.listenerCount(emitter, eventName)

<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

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

Di default, è possibile registrare un massimo di `10` listener per ogni singolo evento. Tale limite può essere modificato per istanze `EventEmitter` singole utilizzando il metodo [`emitter.setMaxListeners(n)`][]. Per modificare l'impostazione predefinita di *tutte* le istanze `EventEmitter`, è possibile utilizzare la proprietà `EventEmitter.defaultMaxListeners`. Se il valore non è un numero positivo, verrà generato un `TypeError`.

Prestare attenzione durante la configurazione dell'`EventEmitter.defaultMaxListeners` poiché la modifica influenza *tutte* le istanze `EventEmitter`, incluse quelle create precedentemente alla modifica. Tuttavia, chiamare [`emitter.setMaxListeners(n)`][] mantiene la precedenza su `EventEmitter.defaultMaxListeners`.

Da notare che questo non è un limite rigido. The `EventEmitter` instance will allow more listeners to be added but will output a trace warning to stderr indicating that a "possible EventEmitter memory leak" has been detected. Per ogni singolo `EventEmitter`, si possono utilizzare i metodi `emitter.getMaxListeners()` e `emitter.setMaxListeners()` per evitare temporaneamente questo avviso:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // do stuff
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

Il flag [`--trace-warnings`][] della command line può essere utilizzato per mostrare la stack trace di tali avvisi.

L'avviso emesso può essere ispezionato con [`process.on('warning')`][] e avrà le proprietà aggiuntive `emitter`, `type` e `count`, che si riferiscono rispettivamente all'istanza dell'event emitter, al nome dell'evento e al numero di listener allegati. La sua proprietà `name` è impostata su `'MaxListenersExceededWarning'`.

### emitter.addListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `listener` {Function}

Alias per `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `...args` {any}
- Restituisce: {boolean}

Chiama in maniera sincrona ognuno dei listener registrati per l'evento con nome `eventName`, nell'ordine di registrazione, passando gli argomenti forniti a ciascuno.

Restituisce `true` se l'evento ha avuto listener, `false` in caso contrario.

### emitter.eventNames()

<!-- YAML
added: v6.0.0
-->

- Restituisce: {Array}

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

### emitter.getMaxListeners()

<!-- YAML
added: v1.0.0
-->

- Restituisce: {integer}

Restituisce il valore corrente max di listener per l'`EventEmitter` che è impostato dall'[`emitter.setMaxListeners(n)`][] o di default in [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)

<!-- YAML
added: v3.2.0
-->

- `eventName`{string|symbol} Il nome dell'evento sottoposto al listening
- Restituisce: {integer}

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

- `eventName` {string|symbol}
- Restituisce: {Function[]}

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

- `eventName` {string|symbol}
- `listener` {Function}
- Restituisce: {EventEmitter}

Alias di [`emitter.removeListener()`][].

### emitter.on(eventName, listener)

<!-- YAML
added: v0.1.101
-->

- `eventName` {string|symbol} Il nome dell'evento.
- `listener` {Function} La funzione callback
- Restituisce: {EventEmitter}

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
- Restituisce: {EventEmitter}

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
- Restituisce: {EventEmitter}

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
- Restituisce: {EventEmitter}

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
- Restituisce: {EventEmitter}

Removes all listeners, or those of the specified `eventName`.

Note that it is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.removeListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol}
- `listener` {Function}
- Restituisce: {EventEmitter}

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
- Restituisce: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. This is a useful default that helps finding memory leaks. Obviously, not all events should be limited to just 10 listeners. The `emitter.setMaxListeners()` method allows the limit to be modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Returns a reference to the `EventEmitter`, so that calls can be chained.

### emitter.rawListeners(eventName)

<!-- YAML
added: v9.4.0
-->

- `eventName` {string|symbol}
- Restituisce: {Function[]}

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