# Events

<!--introduced_in=v0.10.0-->

> Stabilité: 2 - stable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") emit named events that cause `Function` objects ("listeners") to be called.

Par exemple : un objet [net `. Server`] [] émet un événement chaque fois qu’un pair s'y connecte ; un [`fs. ReadStream`] [] émet un événement lorsque le fichier est ouvert ; un [flux (stream)](stream.html) émet émet un événement chaque fois que des données sont disponibles pour lecture.

Tous les objets qui émettent des événements sont des instances de la classe `EventEmitter`. Ces objets exposent une fonction `eventEmitter.on()` qui permet d'attacher une ou plusieurs fonctions aux événements nommés émis par l’objet. En général, les noms d’événements sont des chaînes de caractères écrites en camelCase mais n’importe quel nom de propriété JavaScript valide peut être utilisé.

When the `EventEmitter` object emits an event, all of the functions attached to that specific event are called _synchronously_. Any values returned by the called listeners are _ignored_ and will be discarded.

L’exemple suivant montre une simple instance d'`EventEmitter` avec un seul écouteur. La méthode `eventEmitter.on()` est utilisée pour abonner des écouteurs, tandis que la méthode `eventEmitter.emit()` est utilisée pour déclencher l’événement.

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

La méthode `eventEmitter.emit()` permet de passer un ensemble arbitraire d’arguments aux fonctions écouteurs. Keep in mind that when an ordinary listener function is called, the standard `this` keyword is intentionally set to reference the `EventEmitter` instance to which the listener is attached.

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

Il est possible d’utiliser les fonctions fléchées (arrow functions) ES6 comme écouteurs, cependant, si vous le faites, le mot clé `this` ne référencera plus l’instance d'`EventEmitter` :

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', (a, b) => {
  console.log(a, b, this);
  // Affiche: a b {}
});
monEmetteur.emit('evenement', 'a', 'b');
```

## Mode Asynchrone vs. Mode Synchrone

L'`EventEmitter` appelle tous les écouteurs de façon synchrone dans l’ordre dans lequel ils ont été enregistrés. This ensures the proper sequencing of events and helps avoid race conditions and logic errors. Lorsque cela est approprié, les fonctions écouteurs peuvent basculer vers un mode de fonctionnement asynchrone en utilisant les méthodes `setImmediate()` ou `process.nextTick()` :

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

When a listener is registered using the `eventEmitter.on()` method, that listener will be invoked _every time_ the named event is emitted.

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

En employant la méthode `eventEmitter.once()`, il est possible d’abonner un écouteur qui sera appelé au plus une fois pour un événement particulier. Once the event is emitted, the listener is unregistered and *then* called.

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

Lorsqu'une erreur se produit au sein d'une instance d'`EventEmitter`, il est standard d'émettre un évènement `« error »`. Ceux-ci sont traités comme des cas spéciaux en Node.js.

If an `EventEmitter` does _not_ have at least one listener registered for the `'error'` event, and an `'error'` event is emitted, the error is thrown, a stack trace is printed, and the Node.js process exits.

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

La classe `EventEmitter` est définie et exposée par le module `events` :

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

* `eventName` {string|symbol} le nom de l’événement auquel l'écouteur s'est abonné
* `listener` {Function} La fonction gestionnaire d'évènement

The `EventEmitter` instance will emit its own `'newListener'` event *before* a listener is added to its internal array of listeners.

Les écouteurs s'étant abonnés à l’événement `« newListener »` recevront le nom de l’événement et une référence à l’écouteur ajouté.

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

### Event: `'removeListener'`
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

The `'removeListener'` event is emitted *after* the `listener` is removed.

### `EventEmitter.listenerCount(emitter, eventName)`
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Stabilité : 0 - obsolète : utilisez [`emitter.listenerCount()`] [] à la place.

* `emitter` {EventEmitter} The emitter to query
* `eventName` {string|symbol} le nom de l’événement

Une méthode de classe qui retourne le nombre d’écouteurs abonnés, pour le nom d'évènement `eventName` donné, sur l'émetteur `emitter` donné.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.on('evenement', () => {});
monEmetteur.on('evenement', () => {});
console.log(EventEmitter.listenerCount(monEmetteur, 'evenement'));
// Affiche : 2
```

### `EventEmitter.defaultMaxListeners`
<!-- YAML
added: v0.11.2
-->

Par défaut, un maximum de `10` écouteurs peut être abonné à un même événement. Cette limite peut être modifiée individuellement pour chaque instance d'`EventEmitter` en utilisant la méthode [`emitter.setMaxListeners(n)`][]. To change the default for *all* `EventEmitter` instances, the `EventEmitter.defaultMaxListeners` property can be used. If this value is not a positive number, a `TypeError` will be thrown.

Take caution when setting the `EventEmitter.defaultMaxListeners` because the change affects *all* `EventEmitter` instances, including those created before the change is made. Toutefois, appeler [`emitter.setMaxListeners(n)`] [] est toujours prioritaire sur `EventEmitter.defaultMaxListeners`.

This is not a hard limit. L’instance d'`EventEmitter` permettra d'ajouter plus d'écouteurs mais enverra un avertissement vers stderr indiquant qu’une « possible fuite de mémoire d'EventEmitter » a été détectée. Pour chaque instance d'`EventEmitter`, les méthodes `emitter.getMaxListeners()` et `emitter.setMaxListeners()` peuvent être utilisées pour suspendre temporairement cet avertissement :

```js
emetteur.setMaxListeners(emetteur.getMaxListeners() + 1);
emetteur.once('evenement', () => {
  // faire quelque chose, puis :
  emetteur.setMaxListeners(Math.max(emetteur.getMaxListeners() - 1, 0));
});
```

Le flag [`--trace-avertissements`][] peut être utilisé en ligne de commande pour afficher la pile d'appel avec ces avertissements.

L’avertissement émis peut être inspecté avec [`process.on('warning')`][] et comportera les propriétés addtionnelles `emitter`, `type` et `count`, correspondant respectivement à l’instance d’EventEmitter, au nom de l’événement et au nombre d’écouteurs abonnés. Sa propriété `name` aura pour valeur `« MaxListenersExceededWarning »`.

### `EventEmitter.errorMonitor`
<!-- YAML
added: v13.6.0
-->

This symbol shall be used to install a listener for only monitoring `'error'` events. Listeners installed using this symbol are called before the regular `'error'` listeners are called.

Installing a listener using this symbol does not change the behavior once an `'error'` event is emitted, therefore the process will still crash if no regular `'error'` listener is installed.

### `emitter.addListener(eventName, listener)`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}

Alias pour `emitter.on(eventName, listener)`.

### `emitter.emit(eventName[, ...args])`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `...args` {any}
* Returns: {boolean}

Appelle de façon synchrone chacun des écouteurs abonnés à l'évènement nommé, `eventName`, dans l'ordre où ils ont été abonnés, en passant les arguments fournis à chacun.

Renvoie `true` si l’événement avait au moins un écouteur, `false` sinon.

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

* Returns: {Array}

Retourne un tableau répertoriant les événements pour lesquels l’émetteur a abonné des écouteurs. Les valeurs du tableau seront de type String ou `Symbol`.

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

### `emitter.getMaxListeners()`
<!-- YAML
added: v1.0.0
-->

* Returns: {integer}

Retourne la valeur actuelle du maximum d'écouteurs pour l'instance d'`EventEmitter`, valeur qui soit a été affectée avec [`emitter.setMaxListeners(n)`][], soit est la valeur par défaut [`EventEmitter.defaultMaxListeners`][].

### `emitter.listenerCount(eventName)`
<!-- YAML
added: v3.2.0
-->

* `eventName` {string|symbol} le nom de l’événement auquel l'écouteur s'est abonné
* Returns: {integer}

Retourne le nombre d’écouteurs abonnés à l’événement nommé `eventName`.

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
* Returns: {Function[]}

Retourne une copie du tableau d’écouteurs pour l’événement nommé `eventName`.

```js
serveur.on('connexion', (flux) => {
  console.log("une personne s'est connectée !");
});
console.log(util.inspect(serveur.listeners('connexion')));
// Affiche : [ [Function] ]
```

### `emitter.off(eventName, listener)`
<!-- YAML
added: v10.0.0
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Returns: {EventEmitter}

Alias pour [`emitter.removeListener()`] [].

### `emitter.on(eventName, listener)`
<!-- YAML
added: v0.1.101
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Ajoute la fonction `listener` à la fin du tableau d'écouteurs pour l’événement nommé `eventName`. Aucune vérification n'est effectuée pour voir si `listener` a déjà été ajouté. Plusieurs appels passant la même combinaison `eventName` / `listener` feront que `listener` sera ajouté, et donc appelé, à plusieurs reprises.

```js
server.on('connexion', (flux) => {
  console.log("quelqu'un s'est connecté !");
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

Par défaut, les écouteurs sont appelés dans l'ordre dans lequel ils sont ajoutés. La méthode `emitter.prependListener()` peut être utilisée comme alternative pour ajouter l'écouteur au début du tableau d'écouteurs.

```js
const monEE = new EventEmitter();
monEE.on('foo', () => console.log('a'));
monEE.prependListener('foo', () => console.log('b'));
monEE.emit('foo');
// Affiche :
//   b
//   a
```

### `emitter.once(eventName, listener)`
<!-- YAML
added: v0.3.0
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName`. Au prochain déclenchement de l'évènement `eventName`, cet écouteur est supprimé, puis appelé.

```js
serveur.once('connexion', (flux) => {
  console.log('Ah, nous avons notre premier utilisateur !');
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

Par défaut, les écouteurs sont appelés dans l'ordre dans lequel ils sont ajoutés. La méthode `emitter.prependOnceListener()` peut être utilisée comme alternative pour ajouter l'écouteur au début du tableau d'écouteurs.

```js
const monEE = new EventEmitter();
monEE.on('foo', () => console.log('a'));
monEE.prependOnceListener('foo', () => console.log('b'));
monEE.emit('foo');
// Affiche :
//   b
//   a
```

### `emitter.prependListener(eventName, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Adds the `listener` function to the *beginning* of the listeners array for the event named `eventName`. Aucune vérification n'est effectuée pour voir si `listener` a déjà été ajouté. Plusieurs appels passant la même combinaison `eventName` / `listener` feront que `listener` sera ajouté, et donc appelé, à plusieurs reprises.

```js
server.prependListener('connexion', (flux) => {
  console.log("quelqu'un s'est connecté !");
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### `emitter.prependOnceListener(eventName, listener)`
<!-- YAML
added: v6.0.0
-->

* `eventName` {string|symbol} le nom de l’événement.
* `listener` {Function} la fonction de callback
* Returns: {EventEmitter}

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. Au prochain déclenchement de l'évènement `eventName`, cet écouteur est supprimé, puis appelé.

```js
serveur.prependOnceListener('connexion', (flux) => {
  console.log('Ah, nous avons notre premier utilisateur !');
});
```

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### `emitter.removeAllListeners([eventName])`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* Returns: {EventEmitter}

Supprime tous les écouteurs, ou ceux de l'évènement `eventName` spécifié.

It is bad practice to remove listeners added elsewhere in the code, particularly when the `EventEmitter` instance was created by some other component or module (e.g. sockets or file streams).

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### `emitter.removeListener(eventName, listener)`
<!-- YAML
added: v0.1.26
-->

* `eventName` {string|symbol}
* `listener` {Function}
* Returns: {EventEmitter}

Supprime l'écouteur `listener` spécifié du tableau d'écouteurs pour l'évènement nommé `eventName`.

```js
const callback = (flux) => {
  console.log("quelqu'un s'est connecté");
};
serveur.on('connexion', callback);
// ...
serveur.removeListener('connexion', callback);
```

`removeListener()` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener()` must be called multiple times to remove each instance.

Once an event has been emitted, all listeners attached to it at the time of emitting will be called in order. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Les déclenchements suivants de l'évènement se comporteront comme attendu.

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

Because listeners are managed using an internal array, calling this will change the position indices of any listener registered *after* the listener being removed. Cela n’affectera pas l’ordre dans lequel les écouteurs sont appelés, mais cela signifie que toutes les copies du tableau d'écouteurs, comme celles retournées par la méthode `emitter.listeners()`, devront être recréées.

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

### `emitter.setMaxListeners(n)`
<!-- YAML
added: v0.3.5
-->

* `n` {integer}
* Returns: {EventEmitter}

By default `EventEmitter`s will print a warning if more than `10` listeners are added for a particular event. Il s’agit d’une valeur par défaut utile qui aide à trouver des fuites mémoire. Bien sûr, tous les évènements ne devrait pas être limités à 10 écouteurs. La méthode `emitter.setMaxListeners()` permet de modifier la limite pour l'instance d'`EventEmitter` sur laquelle elle est appelée. Il est possible d'affecter la valeur `Infinity` (ou `0`) pour indiquer un nombre illimité d'écouteurs.

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### `emitter.rawListeners(eventName)`
<!-- YAML
added: v9.4.0
-->

* `eventName` {string|symbol}
* Returns: {Function[]}

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
* Renvoie : {Promise}

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

Value: {boolean}

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
* `eventName` {string|symbol} le nom de l’événement auquel l'écouteur s'est abonné
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
