# Eventi

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") periodically emit named events that cause Function objects ("listeners") to be called.

Per esempio: un object [`net.Server`][] emette un evento ogni volta che un peer si connette ad esso; un [`fs.ReadStream`][] emette un evento quando viene aperto il file; uno [stream](stream.html) emette un evento ogni volta che i dati sono disponibili per la lettura.

Tutti gli object che emettono eventi sono istanze della classe `EventEmitter`. Questi object espongono una funzione `eventEmitter.on()` la quale consente che una o più funzioni vengano allegate agli eventi con nome emessi dagli object. Generalmente, i nomi degli eventi sono stringhe con notazione camel-case tuttavia è possibile utilizzare qualsiasi property key di JavaScript valida.

Nel momento in cui l'object `EventEmitter` emette un evento, tutte le funzioni allegate a quello specifico evento vengono chiamate _in maniera sincrona_. Qualsiasi valore restituito dai listener chiamati viene _ignorato_ e verrà scartato.

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

Il metodo `eventEmitter.emit()` consente di passare un set arbitrario di argomenti alle funzioni listener. It is important to keep in mind that when an ordinary listener function is called by the `EventEmitter`, the standard `this` keyword is intentionally set to reference the `EventEmitter` to which the listener is attached.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', function(a, b) {
  console.log(a, b, this);
  // Prints:
  //   a b MyEmitter {
  //     domain: null,
  //     _events: { event: [Function] },
  //     _eventsCount: 1,
  //     _maxListeners: undefined }
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

## Gestione degli eventi solo una volta

Nel momento in cui un listener viene registrato utilizzando il metodo `eventEmitter.on()`, quel listener verrà invocato _ogni volta_ che l'evento con nome viene emesso.

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

Se un `EventEmitter` _non_ possiede almeno un listener registrato per l'evento `'error'`, ed un evento `'error'` viene emesso, l'errore viene generato, viene stampata una stack trace, e il processo Node.js si conclude.

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('whoops!'));
// Genera e causa il crash di Node.js
```

Per impedire l'arresto anomalo del processo di Node.js è possibile utilizzare il modulo [`domain`][]. (Nota, tuttavia, che il modulo `domain` è stato deprecato.)

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

All EventEmitters emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

### Event: 'newListener'
<!-- YAML
added: v0.1.26
-->

* `eventName`{any} Il nome dell'evento sottoposto al listening
* `listener` {Function} La funzione dell'event handler

L'istanza `EventEmitter` emetterà il proprio event `'newListener'` *prima* che venga aggiunto un listener al suo array di listener interno.

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

### Event: 'removeListener'
<!-- YAML
added: v0.9.3
changes:
  - version: v6.1.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/6394
    description: For listeners attached using `.once()`, the `listener` argument
                 now yields the original listener function.
-->

* `eventName` {any} Il nome dell'evento
* `listener` {Function} La funzione dell'event handler

L'evento `'removeListener'` viene emesso *dopo* l'eliminazione del `listener`.

### EventEmitter.listenerCount(emitter, eventName)
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Stabilità: 0 - Deprecato: Utilizza [`emitter.listenerCount()`][] al suo posto.

Un metodo di classe che restituisce il numero di listener per un determinato `eventName` registrato su un `emitter` specifico.

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

Da notare che questo non è un limite rigido. L'istanza `EventEmitter` permetterà di aggiungere ulteriori listener ma produrrà un trace warning su stderr indicante che è stata rilevata una "possibile perdita di memoria di EventEmitter". Per ogni singolo `EventEmitter`, si possono utilizzare i metodi `emitter.getMaxListeners()` e `emitter.setMaxListeners()` per evitare temporaneamente questo avviso:

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // fai operazione
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

Il flag [`--trace-warnings`][] della command line può essere utilizzato per mostrare la stack trace di tali avvisi.

L'avviso emesso può essere ispezionato con [`process.on('warning')`][] e avrà le proprietà aggiuntive `emitter`, `type` e `count`, che si riferiscono rispettivamente all'istanza dell'event emitter, al nome dell'evento e al numero di listener allegati. La sua proprietà `name` è impostata su `'MaxListenersExceededWarning'`.

### emitter.addListener(eventName, listener)
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `listener` {Function}

Alias per `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `...args` {any}

Chiama in maniera sincrona ognuno dei listener registrati per l'evento con nome `eventName`, nell'ordine di registrazione, passando gli argomenti forniti a ciascuno.

Restituisce `true` se l'evento ha avuto listener, `false` in caso contrario.

### emitter.eventNames()
<!-- YAML
added: v6.0.0
-->

Restituisce un array che elenca gli eventi per i quali l'emitter ha registrato i listener. I valori nell'array saranno stringhe o Symbol.

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

Restituisce il valore corrente massimo di listener per l'`EventEmitter` che è impostato dall'[`emitter.setMaxListeners(n)`][] o di default in [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)
<!-- YAML
added: v3.2.0
-->

* `eventName`{any} Il nome dell'evento sottoposto al listening

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
- `eventName` {any}

Restituisce una copia dell'array dei listener per l'evento con nome `eventName`.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
console.log(util.inspect(server.listeners('connection')));
// Stampa: [ [Function] ]
```

### emitter.on(eventName, listener)
<!-- YAML
added: v0.1.101
-->

* `eventName` {any} Il nome dell'evento.
* `listener` {Function} La funzione callback

Aggiunge la funzione `listener` alla fine dell'array dei listener per l'evento con nome `eventName`. Non viene effettuato nessun controllo per verificare se il `listener` sia già stato aggiunto. Molteplici chiamate passanti la stessa combinazione di `eventName` e `listener` comporteranno che il `listener` verrà aggiunto, e chiamato, più volte.

```js
server.on('connection', (stream) => {
  console.log('someone connected!');
});
```

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

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

### emitter.once(eventName, listener)
<!-- YAML
added: v0.3.0
-->

* `eventName` {any} Il nome dell'evento.
* `listener` {Function} La funzione callback

Aggiunge una funzione `listener` **one-time** per l'evento con nome `eventName`. La volta successiva in cui viene attivato `eventName`, il listener viene eliminato e poi invocato.

```js
server.once('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

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

### emitter.prependListener(eventName, listener)
<!-- YAML
added: v6.0.0
-->

* `eventName` {any} Il nome dell'evento.
* `listener` {Function} La funzione callback

Aggiunge la funzione `listener` *all'inizio* dell'array dei listener per l'evento con nome `eventName`. Non viene effettuato nessun controllo per verificare se il `listener` sia già stato aggiunto. Molteplici chiamate passanti la stessa combinazione di `eventName` e `listener` comporteranno che il `listener` verrà aggiunto, e chiamato, più volte.

```js
server.prependListener('connection', (stream) => {
  console.log('someone connected!');
});
```

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.prependOnceListener(eventName, listener)
<!-- YAML
added: v6.0.0
-->

* `eventName` {any} Il nome dell'evento.
* `listener` {Function} La funzione callback

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. La volta successiva in cui viene attivato `eventName`, il listener viene eliminato, e poi invocato.

```js
server.prependOnceListener('connection', (stream) => {
  console.log('Ah, we have our first user!');
});
```

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.removeAllListeners([eventName])
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}

Rimuove tutti i listeners, oppure quelli dell'`eventName` specificato.

Da notare che eliminare listener aggiunti in un altro punto del codice è una cattiva prassi, in particolare nei casi in cui l'istanza `EventEmitter` è stata creata da qualche altro componente o modulo (es. socket o file stream).

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.removeListener(eventName, listener)
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `listener` {Function}

Rimuove il `listener` specificato dall'array del listener per l'evento con nome `eventName`.

```js
const callback = (stream) => {
  console.log('someone connected!');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

`removeListener` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener` must be called multiple times to remove each instance.

Da notare che una volta che viene emesso un evento, tutti i listener allegati ad esso al momento dell'emissione verranno chiamati in ordine. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Subsequent events will behave as expected.

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

Poiché i listener vengono gestiti utilizzando un array interno, chiamare questo modificherà gli indici di posizione di ciascun listener registrato *in seguito* all'eliminazione del listener. Ciò non avrà nessun impatto sull'ordine in cui i listener vengono chiamati, ma indica che qualsiasi copia dell'array del listener restituita dal metodo `emitter.listeners()` dovrà essere ricreata.

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

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.

### emitter.setMaxListeners(n)
<!-- YAML
added: v0.3.5
-->
- `n` {integer}

Di default gli EventEmitter stamperanno un avviso nel caso in cui vengano aggiunti più di `10` listener per un particolare evento. Questa è un'utile impostazione predefinita che contribuisce a trovare perdite di memoria. Ovviamente, non tutti gli eventi dovrebbero essere limitati a soli 10 listener. Il metodo `emitter.setMaxListeners()` consente di modificare i limiti per questa specifica istanza di `EventEmitter`. Il valore può essere impostato su `Infinity` (o `0`) per indicare un numero illimitato di listener.

Restituisce un riferimento all' `EventEmitter`, in modo che le chiamate possano essere concatenate.
