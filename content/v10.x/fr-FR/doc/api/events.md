# Events

<!--introduced_in=v0.10.0-->

> Stabilité: 2 - stable

<!--type=module-->

Une grande partie de l'API centrale de Node.js est bâtie autour d'une architecture asynchrone idiomatique orientée évènement, dans laquelle certains types d'objets (appelés « émetteurs » (emitters)) émettent des événements nommés, qui entrainent l'appel d'objets de type `fonction` (alors apppelés « écouteurs » (listeners)).

Par exemple : un objet [net `. Server`] [] émet un événement chaque fois qu’un pair s'y connecte ; un [`fs. ReadStream`] [] émet un événement lorsque le fichier est ouvert ; un [flux (stream)](stream.html) émet émet un événement chaque fois que des données sont disponibles pour lecture.

Tous les objets qui émettent des événements sont des instances de la classe `EventEmitter`. Ces objets exposent une fonction `eventEmitter.on()` qui permet d'attacher une ou plusieurs fonctions aux événements nommés émis par l’objet. En général, les noms d’événements sont des chaînes de caractères écrites en camelCase mais n’importe quel nom de propriété JavaScript valide peut être utilisé.

Lorsque l’objet `EventEmitter` émet un événement, toutes les fonctions attachées à cet événement particulier sont appelées *de façon synchrone*. Toutes les valeurs retournées par les auditeurs (listeners) appelés sont *ignorées* et ne seront pas propagées.

L’exemple suivant montre une simple instance d'`EventEmitter` avec un seul écouteur (listener). La méthode `eventEmitter.on()` est utilisée pour abonner des écouteurs (listeners), tandis que la méthode `eventEmitter.emit()` est utilisée pour déclencher l’événement.

```js
const EventEmitter = require('events');

class MonEmetteur extends EventEmitter {}

const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', () => {
  console.log("un évènement s'est produit !");
});
monEmetteur.emit('evenement');
```

## Passage d'arguments et de `this` aux écouteurs (listeners)

La méthode `eventEmitter.emit()` permet de passer un ensemble arbitraire d’arguments aux fonctions écouteurs (listeners). Il est important de garder à l’esprit que lorsqu’une fonction écouteur (listener) ordinaire est appelée, le mot clé standard `this` référence intentionnellement l’instance d'`EventEmitter` à laquelle l'écouteur (listener) est attaché.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', function(a, b) {
  console.log(a, b, this, this === monEmetteur);
  // Affiche:
  //   a b MonEmetteur {
  //     domain: null,
  //     _events: { evenement: [Function] },
  //     _eventsCount: 1,
  //     _maxListeners: undefined } true
});
monEmetteur.emit('evenement', 'a', 'b');
```

Il est possible d’utiliser les fonctions fléchées (arrow functions) ES6 comme écouteurs (listeners), cependant, si vous le faites, le mot clé `this` ne référencera plus l’instance d'`EventEmitter` :

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', (a, b) => {
  console.log(a, b, this);
  // Affiche: a b {}
});
monEmetteur.emit('evenement', 'a', 'b');
```

## Mode Asynchrone vs. Mode Synchrone

L'`EventEmitter` appelle tous les écouteurs (listeners) de façon synchrone dans l’ordre dans lequel ils ont été enregistrés. Ceci est important pour garantir l'ordre correct de la séquence d'événements, et pour éviter les erreurs dues à des accès concurrents ou les erreurs de logique. Lorsque cela est approprié, les fonctions écouteurs (listeners) peuvent basculer vers un mode de fonctionnement asynchrone en utilisant les méthodes `setImmediate()` ou `process.nextTick()` :

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', (a, b) => {
  setImmediate(() => {
    console.log('ceci se produit de manière asynchrone');
  });
});
monEmetteur.emit('evenement', 'a', 'b');
```

## Ne gérer les évènements qu'une seule fois

Lorsqu’un écouteur (listener) est enregistré à l’aide de la méthode `eventEmitter.on()`, cet écouteur (listener) sera appelé à *chaque fois* que cet événement sera émis.

```js
const monEmetteur = new MonEmetteur();
let m = 0;
monEmetteur.on('evenement', () => {
  console.log(++m);
});
monEmetteur.emit('evenement');
// Affiche : 1
monEmetteur.emit('evenement');
// Affiche : 2
```

En employant la méthode `eventEmitter.once()`, il est possible d’abonner un écouteur (listener) qui sera appelé au plus une fois pour un événement particulier. Une fois l'évènement émis, l'écouteur est d'abord désabonné et *ensuite* appelé.

```js
const monEmetteur = new MonEmetteur();
let m = 0;
monEmetteur.once('evenement', () => {
  console.log(++m);
});
monEmetteur.emit('evenement');
// Affiche : 1
monEmetteur.emit('evenement');
// Ignoré
```

## Evènements « error »

Lorsqu'une erreur se produit au sein d'une instance d'`EventEmitter`, il est habituelle que soit émis un évènement `« error »`. Ceux-ci sont traités comme des cas spéciaux en Node.js.

Si un `EventEmitter` n'a *pas* au moins un écouteur (listener) abonné à l'évènement `« error »`, et si un évènement `« error »` est émis, une erreur est lancée, une trace de la pile d'appel est affichée, et le processus Node.js s'arrête.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.emit('error', new Error('whoops!'));
// Lève une erreur et crashe Node.js
```

Pour éviter de crasher le processus Node.js le module [`domain`][] peut être utilisé. (Notez, cependant, que le module `domain` a été déprécié.)

La bonne pratique reconnue est de toujours abonner des écouteurs (listeners) aux évènements `« error »`.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('error', (err) => {
  console.error("whoops! une erreur s'est produite");
});
monEmetteur.emit('error', new Error('whoops!'));
// Affiche : whoops! une erreur s’est produite
```

## Classe : EventEmitter

<!-- YAML
added: v0.1.26
-->

La classe `EventEmitter` est définie et exposée par le module `events` :

```js
const EventEmitter = require('events');
```

Tous les `EventEmitter`s émettent l’événement `« newListener »` lors de l’ajout de nouveaux écouteurs (listener) et `« removeListener »` lorsque les écouteurs (listeners) existants sont supprimés.

### Event : « newListener »

<!-- YAML
added: v0.1.26
-->

- `eventName` {string|symbol} le nom de l’événement auquel l'écouteur (listener) s'est abonné
- `listener` {Function} La fonction gestionnaire d'évènement

L’instance d'`EventEmitter` émettra son propre évènement `« newListener »` *avant* qu'un écouteur (listener) soit ajouté à son tableau interne d'écouteurs.

Les écouteurs (listeners) s'étant abonnés à l’événement `« newListener »` recevront le nom de l’événement et une référence à l’écouteur (listener) ajouté.

The fact that the event is triggered before adding the listener has a subtle but important side effect: any *additional* listeners registered to the same `name` *within* the `'newListener'` callback will be inserted *before* the listener that is in the process of being added.

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