# Events

<!--introduced_in=v0.10.0-->

> Stabilité: 2 - stable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

For instance: a [`net.Server`][] object emits an event each time a peer connects to it; a [`fs.ReadStream`][] emits an event when the file is opened; a [stream](stream.html) emits an event whenever data is available to be read.

Tous les objets qui émettent des événements sont des instances de la classe `EventEmitter`. These objects expose an `eventEmitter.on()` function that allows one or more functions to be attached to named events emitted by the object. Typically, event names are camel-cased strings but any valid JavaScript property key can be used.

When the `EventEmitter` object emits an event, all of the functions attached to that specific event are called *synchronously*. Any values returned by the called listeners are *ignored* and will be discarded.

The following example shows a simple `EventEmitter` instance with a single listener. The `eventEmitter.on()` method is used to register listeners, while the `eventEmitter.emit()` method is used to trigger the event.

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

The `eventEmitter.emit()` method allows an arbitrary set of arguments to be passed to the listener functions. It is important to keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

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

It is possible to use ES6 Arrow Functions as listeners, however, when doing so, the `this` keyword will no longer reference the `EventEmitter` instance:

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', (a, b) => {
  console.log(a, b, this);
  // Affiche: a b {}
});
monEmetteur.emit('evenement', 'a', 'b');
```

## Mode Asynchrone vs. Mode Synchrone

The `EventEmitter` calls all listeners synchronously in the order in which they were registered. This is important to ensure the proper sequencing of events and to avoid race conditions or logic errors. When appropriate, listener functions can switch to an asynchronous mode of operation using the `setImmediate()` or `process.nextTick()` methods:

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

When a listener is registered using the `eventEmitter.on()` method, that listener will be invoked *every time* the named event is emitted.

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

Using the `eventEmitter.once()` method, it is possible to register a listener that is called at most once for a particular event. Once the event is emitted, the listener is unregistered and *then* called.

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

When an error occurs within an `EventEmitter` instance, the typical action is for an `'error'` event to be emitted. These are treated as special cases within Node.js.

If an `EventEmitter` does *not* have at least one listener registered for the `'error'` event, and an `'error'` event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.emit('error', new Error('whoops!'));
// Lève une erreur et crashe Node.js
```

To guard against crashing the Node.js process the [`domain`][] module can be used. (Note, however, that the `domain` module is deprecated.)

La bonne pratique reconnue est de toujours abonner des écouteurs aux évènements `« error »`.

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

All `EventEmitter`s emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

### Event : « newListener »

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol} le nom de l’évènement écouté
* `listener` {Function} La fonction gestionnaire d'évènement

The `EventEmitter` instance will emit its own `'newListener'` event *before* a listener is added to its internal array of listeners.

Listeners registered for the `'newListener'` event will be passed the event name and a reference to the listener being added.

The fact that the event is triggered before adding the listener has a subtle but important side effect: any *additional* listeners registered to the same `name` *within* the `'newListener'` callback will be inserted *before* the listener that is in the process of being added.

```js
const monEmetteur = new MonEmetteur();
// Ne faisons cette action qu'une seule fois pour éviter une boucle infinie
monEmetteur.once('newListener', (event, listener) => {
  if (event === 'evenement') {
    // Insérer un nouvel écouteur avant
    monEmetteur.on('evenement', () => {
      console.log('B');
    });
  }
});
monEmetteur.on('evenement', () => {
  console.log('A');
});
monEmetteur.emit('evenement');
// Affiche :
//   B
//   A
```

### Event: « removeListener »

<!-- YAML
added: v0.9.3
changes:

  - version: v6.1.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/6394
    description: For listeners attached using `.once()`, the `listener` argument
                 now yields the original listener function.
-->

* `eventName` {string|symbol} le nom de l’événement
* `listener` {Function} La fonction gestionnaire d'évènement

L’événement `« removeListener »` est émis *après* la suppression de l'`écouteur`.

### EventEmitter.listenerCount(emitter, eventName)

<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} le nom de l’événement

> Stabilité : 0 - obsolète : utilisez [`emitter.listenerCount()`][] à la place.

A class method that returns the number of listeners for the given `eventName` registered on the given `emitter`.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', () => {});
monEmetteur.on('evenement', () => {});
console.log(EventEmitter.listenerCount(monEmetteur, 'evenement'));
// Affiche : 2
```

### EventEmitter.defaultMaxListeners

<!-- YAML
added: v0.11.2
-->

By default, a maximum of `10` listeners can be registered for any single event. This limit can be changed for individual `EventEmitter` instances using the [`emitter.setMaxListeners(n)`][] method. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. However, calling [`emitter.setMaxListeners(n)`][] still has precedence over `EventEmitter.defaultMaxListeners`.

Notez que ce n’est pas une limite stricte. The `EventEmitter` instance will allow more listeners to be added but will output a trace warning to stderr indicating that a "possible EventEmitter memory leak" has been detected. For any single `EventEmitter`, the `emitter.getMaxListeners()` and `emitter.setMaxListeners()` methods can be used to temporarily avoid this warning:

```js
emetteur.setMaxListeners(emetteur.getMaxListeners() + 1);
emetteur.once('evenement', () => {
  // faire quelque chose, puis :
  emetteur.setMaxListeners(Math.max(emetteur.getMaxListeners() - 1, 0));
});
```

The [`--trace-warnings`][] command line flag can be used to display the stack trace for such warnings.

The emitted warning can be inspected with [`process.on('warning')`][] and will have the additional `emitter`, `type` and `count` properties, referring to the event emitter instance, the event’s name and the number of attached listeners, respectively. Sa propriété `name` aura pour valeur `« MaxListenersExceededWarning »`.

### emitter.addListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}

Alias pour `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `...args` {any}
* Returns: {boolean}

Synchronously calls each of the listeners registered for the event named `eventName`, in the order they were registered, passing the supplied arguments to each.

Renvoie `true` si l’événement avait au moins un écouteur, `false` sinon.

### emitter.eventNames()

<!-- YAML
added: v6.0.0
-->

* Returns: {Array}

Returns an array listing the events for which the emitter has registered listeners. Les valeurs du tableau seront de type String ou `Symbol`.

```js
const EventEmitter = require('events');
const monEE = new EventEmitter();
monEE.on('foo', () => {});
monEE.on('bar', () => {});

const sym = Symbol('symbole');
monEE.on(sym, () => {});

console.log(monEE.eventNames());
// Affiche : [ 'foo', 'bar', Symbol(symbole) ]
```

### emitter.getMaxListeners()

<!-- YAML
added: v1.0.0
-->

* Returns: {integer}

Returns the current max listener value for the `EventEmitter` which is either set by [`emitter.setMaxListeners(n)`][] or defaults to [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)

<!-- YAML
added: v3.2.0
-->

* `eventName` {string|symbol} le nom de l’évènement écouté
* Returns: {integer}

Retourne le nombre d’écouteurs abonnés à l’événement nommé `eventName`.

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
* Returns: {Function[]}

Retourne une copie du tableau d’écouteurs pour l’événement nommé `eventName`.

```js
serveur.on('connexion', (flux) => {
  console.log("une personne s'est connectée !");
});
console.log(util.inspect(serveur.listeners('connexion')));
// Affiche : [ [Function] ]
```

### emitter.off(eventName, listener)

<!-- YAML
added: v10.0.0
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Returns: {EventEmitter}

Alias pour [`emitter.removeListener()`] [].

### emitter.on(eventName, listener)

<!-- YAML
added: v0.1.101
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Adds the `listener` function to the end of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.on('connexion', (flux) => {
  console.log("quelqu'un s'est connecté !");
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

Par défaut, les écouteurs sont appelés dans l'ordre dans lequel ils sont ajoutés. The `emitter.prependListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```js
const monEE = new EventEmitter();
monEE.on('foo', () => console.log('a'));
monEE.prependListener('foo', () => console.log('b'));
monEE.emit('foo');
// Affiche :
//   b
//   a
```

### emitter.once(eventName, listener)

<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Ajoute un écouteur `listener` à **usage unique** pour l'évènement nommé `eventName`. The next time `eventName` is triggered, this listener is removed and then invoked.

```js
serveur.once('connexion', (flux) => {
  console.log('Ah, nous avons notre premier utilisateur !');
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

Par défaut, les écouteurs sont appelés dans l'ordre dans lequel ils sont ajoutés. The `emitter.prependOnceListener()` method can be used as an alternative to add the event listener to the beginning of the listeners array.

```js
const monEE = new EventEmitter();
monEE.on('foo', () => console.log('a'));
monEE.prependOnceListener('foo', () => console.log('b'));
monEE.emit('foo');
// Affiche :
//   b
//   a
```

### emitter.prependListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. No checks are made to see if the `listener` has already been added. Multiple calls passing the same combination of `eventName` and `listener` will result in the `listener` being added, and called, multiple times.

```js
server.prependListener('connexion', (flux) => {
  console.log("quelqu'un s'est connecté !");
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### emitter.prependOnceListener(eventName, listener)

<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. The next time `eventName` is triggered, this listener is removed, and then invoked.

```js
serveur.prependOnceListener('connexion', (flux) => {
  console.log('Ah, nous avons notre premier utilisateur !');
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### emitter.removeAllListeners([eventName])

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* Returns: {EventEmitter}

Supprime tous les écouteurs, ou ceux de l'évènement `eventName` spécifié.

Note that it is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### emitter.removeListener(eventName, listener)

<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Returns: {EventEmitter}

Removes the specified `listener` from the listener array for the event named `eventName`.

```js
const callback = (flux) => {
  console.log("quelqu'un s'est connecté");
};
serveur.on('connexion', callback);
// ...
serveur.removeListener('connexion', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Note that once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Les déclenchements suivants de l'évènement se comporteront comme attendu.

```js
const monEmetteur = new MonEmetteur();

const callbackA = () => {
  console.log('A');
  monEmetteur.removeListener('evenementt', callbackB);
};

const callbackB = () => {
  console.log('B');
};

monEmetteur.on('evenement', callbackA);

monEmetteur.on('evenement', callbackB);

// callbackA supprime l'écouteur callbackB, mais il sera quand même appelé.
// Le tableau d'écouteurs au moment du déclenchement : [callbackA, callbackB]
monEmetteur.emit('evenement');
// Affiche :
//   A
//   B

// callbackB est maintenant supprimé.
// Le tableau d'écouteurs : [callbackA]
monEmetteur.emit('evenement');
// Affiche :
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

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### emitter.setMaxListeners(n)

<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Returns: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. This is a useful default that helps finding memory leaks. Bien sûr, tous les évènements ne devrait pas être limités à 10 écouteurs. The `emitter.setMaxListeners()` method allows the limit to be modified for this specific `EventEmitter` instance. The value can be set to `Infinity` (or `0`) to indicate an unlimited number of listeners.

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### emitter.rawListeners(eventName)

<!-- YAML
added: v9.4.0
-->

* `eventName` {string|symbol}
* Returns: {Function[]}

Returns a copy of the array of listeners for the event named `eventName`, including any wrappers (such as those created by `.once()`).

```js
const emetteur = new EventEmitter();
emetteur.once('log', () => console.log('journalise une fois'));

// Renvoie un nouveau tableau avec une fonction`onceWrapper` qui comporte une propriété
// `listener` qui contient l'écouteur original lié ci-dessus
const ecouteurs = emetteur.rawListeners('log');
const logFnWrapper = ecouteurs[0];

// affiche "journalise une fois" dans la console sans détacher l'évènement `once`
logFnWrapper.listener();

// affiche "journalise une fois" dans la console et supprime l'écouteur
logFnWrapper();

emetteur.on('log', () => console.log('journalise toujours'));
// retournera un tableau avec une seule fonction abonnée par `.on()` ci-dessus
const nouveauxEcouteurs = emetteur.rawListeners('log');

// affiche "journalise toujours" deux fois
nouveauxEcouteurs[0]();
emetteur.emit('log');
```

## events.once(emitter, name)

<!-- YAML
added: v10.16.0
-->

* `emitter` {EventEmitter}
* `name` {string}
* Renvoie : {Promise}

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