# Events

<!--introduced_in=v0.10.0-->

> Stabilité: 2 - stable

<!--type=module-->

Much of the Node.js core API is built around an idiomatic asynchronous event-driven architecture in which certain kinds of objects (called "emitters") periodically emit named events that cause Function objects ("listeners") to be called.

Par exemple : un objet [net `. Server`] [] émet un événement chaque fois qu’un pair s'y connecte ; un [`fs. ReadStream`] [] émet un événement lorsque le fichier est ouvert ; un [flux (stream)](stream.html) émet émet un événement chaque fois que des données sont disponibles pour lecture.

Tous les objets qui émettent des événements sont des instances de la classe `EventEmitter`. Ces objets exposent une fonction `eventEmitter.on()` qui permet d'attacher une ou plusieurs fonctions aux événements nommés émis par l’objet. En général, les noms d’événements sont des chaînes de caractères écrites en camelCase mais n’importe quel nom de propriété JavaScript valide peut être utilisé.

Lorsque l’objet `EventEmitter` émet un événement, toutes les fonctions attachées à cet événement particulier sont appelées _de façon synchrone_. Toutes les valeurs retournées par les écouteurs appelés sont _ignorées_ et ne seront pas propagées.

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

La méthode `eventEmitter.emit()` permet de passer un ensemble arbitraire d’arguments aux fonctions écouteurs. It is important to keep in mind that when an ordinary listener function is called by the `EventEmitter`, the standard `this` keyword is intentionally set to reference the `EventEmitter` to which the listener is attached.

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

L'`EventEmitter` appelle tous les écouteurs de façon synchrone dans l’ordre dans lequel ils ont été enregistrés. Ceci est important pour garantir l'ordre correct de la séquence d'événements, et pour éviter les erreurs dues à des accès concurrents ou les erreurs de logique. Lorsque cela est approprié, les fonctions écouteurs peuvent basculer vers un mode de fonctionnement asynchrone en utilisant les méthodes `setImmediate()` ou `process.nextTick()` :

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

Lorsqu’un écouteur est enregistré à l’aide de la méthode `eventEmitter.on()`, cet écouteur sera appelé à _chaque fois_ que cet événement sera émis.

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

En employant la méthode `eventEmitter.once()`, il est possible d’abonner un écouteur qui sera appelé au plus une fois pour un événement particulier. Une fois l'évènement émis, l'écouteur est d'abord désabonné et *ensuite* appelé.

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

Si un `EventEmitter` n'a _pas_ au moins un écouteur abonné à l'évènement `« error »`, et si un évènement `« error »` est émis, une erreur est lancée, une trace de la pile d'appel est affichée, et le processus Node.js s'arrête.

```js
const monEmetteur = new MonEmetteur();
monEmetteur.emit('error', new Error('whoops!'));
// Lève une erreur et crashe Node.js
```

Pour éviter de crasher le processus Node.js le module [`domain`][] peut être utilisé. (Notez, cependant, que le module `domain` a été déprécié.)

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

All EventEmitters emit the event `'newListener'` when new listeners are added and `'removeListener'` when existing listeners are removed.

### Event : « newListener »
<!-- YAML
added: v0.1.26
-->

* `eventName` {any} le nom de l’évènement écouté
* `listener` {Function} La fonction gestionnaire d'évènement

L’instance d'`EventEmitter` émettra son propre évènement `« newListener »` *avant* qu'un écouteur soit ajouté à son tableau interne d'écouteurs.

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

### Event: « removeListener »
<!-- YAML
added: v0.9.3
changes:
  - version: v6.1.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/6394
    description: For listeners attached using `.once()`, the `listener` argument
                 now yields the original listener function.
-->

* `eventName` {any} le nom de l’événement
* `listener` {Function} La fonction gestionnaire d'évènement

L’événement `« removeListener »` est émis *après* la suppression de l'`écouteur`.

### EventEmitter.listenerCount(emitter, eventName)
<!-- YAML
added: v0.9.12
deprecated: v4.0.0
-->

> Stabilité : 0 - obsolète : utilisez [`emitter.listenerCount()`] [] à la place.

Une méthode de classe qui retourne le nombre d’écouteurs abonnés, pour le nom d'évènement `eventName` donné, sur l'émetteur `emitter` donné.

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

Par défaut, un maximum de `10` écouteurs peut être abonné à un même événement. Cette limite peut être modifiée individuellement pour chaque instance d'`EventEmitter` en utilisant la méthode [`emitter.setMaxListeners(n)`][]. Pour modifier la valeur par défaut pour *toutes* les instances d'`EventEmitter`, la propriété `EventEmitter.defaultMaxListeners` peut être utilisée. Si cette valeur n’est pas un nombre positif, une `TypeError` sera levée.

Faites attention en affectant une valeur à `EventEmitter.defaultMaxListeners` car la modification affectera *toutes* les instance d'`EventEmitter`, y compris celles créées avant que la modification soit faite. Toutefois, appeler [`emitter.setMaxListeners(n)`] [] est toujours prioritaire sur `EventEmitter.defaultMaxListeners`.

Notez que ce n’est pas une limite stricte. L’instance d'`EventEmitter` permettra d'ajouter plus d'écouteurs mais enverra un avertissement vers stderr indiquant qu’une « possible fuite de mémoire d'EventEmitter » a été détectée. Pour chaque instance d'`EventEmitter`, les méthodes `emitter.getMaxListeners()` et `emitter.setMaxListeners()` peuvent être utilisées pour suspendre temporairement cet avertissement :

```js
emetteur.setMaxListeners(emetteur.getMaxListeners() + 1);
emetteur.once('evenement', () => {
  // faire quelque chose, puis :
  emetteur.setMaxListeners(Math.max(emetteur.getMaxListeners() - 1, 0));
});
```

Le flag [`--trace-avertissements`][] peut être utilisé en ligne de commande pour afficher la pile d'appel avec ces avertissements.

L’avertissement émis peut être inspecté avec [`process.on('warning')`][] et comportera les propriétés addtionnelles `emitter`, `type` et `count`, correspondant respectivement à l’instance d’EventEmitter, au nom de l’événement et au nombre d’écouteurs abonnés. Sa propriété `name` aura pour valeur `« MaxListenersExceededWarning »`.

### emitter.addListener(eventName, listener)
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `listener` {Function}

Alias pour `emitter.on(eventName, listener)`.

### emitter.emit(eventName[, ...args])
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `...args` {any}

Appelle de façon synchrone chacun des écouteurs abonnés à l'évènement nommé, `eventName`, dans l'ordre où ils ont été abonnés, en passant les arguments fournis à chacun.

Renvoie `true` si l’événement avait au moins un écouteur, `false` sinon.

### emitter.eventNames()
<!-- YAML
added: v6.0.0
-->

Retourne un tableau répertoriant les événements pour lesquels l’émetteur a abonné des écouteurs. Les valeurs du tableau seront de type String ou Symbol.

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

Retourne la valeur actuelle du maximum d'écouteurs pour l'instance d'`EventEmitter`, valeur qui soit a été affectée avec [`emitter.setMaxListeners(n)`][], soit est la valeur par défaut [`EventEmitter.defaultMaxListeners`][].

### emitter.listenerCount(eventName)
<!-- YAML
added: v3.2.0
-->

* `eventName` {any} le nom de l’évènement écouté

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
- `eventName` {any}

Retourne une copie du tableau d’écouteurs pour l’événement nommé `eventName`.

```js
serveur.on('connexion', (flux) => {
  console.log("une personne s'est connectée !");
});
console.log(util.inspect(serveur.listeners('connexion')));
// Affiche : [ [Function] ]
```

### emitter.on(eventName, listener)
<!-- YAML
added: v0.1.101
-->

* `eventName` {any} le nom de l’événement.
* `listener` {Function} la fonction de callback

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

### emitter.once(eventName, listener)
<!-- YAML
added: v0.3.0
-->

* `eventName` {any} le nom de l’événement.
* `listener` {Function} la fonction de callback

Ajoute un écouteur `listener` à **usage unique** pour l'évènement nommé `eventName`. Au prochain déclenchement de l'évènement `eventName`, cet écouteur est supprimé, puis appelé.

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

### emitter.prependListener(eventName, listener)
<!-- YAML
added: v6.0.0
-->

* `eventName` {any} le nom de l’événement.
* `listener` {Function} la fonction de callback

Ajoute la fonction `listener` *au début* du tableau d'écouteurs pour l’événement nommé `eventName`. Aucune vérification n'est effectuée pour voir si `listener` a déjà été ajouté. Plusieurs appels passant la même combinaison `eventName` / `listener` feront que `listener` sera ajouté, et donc appelé, à plusieurs reprises.

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

* `eventName` {any} le nom de l’événement.
* `listener` {Function} la fonction de callback

Adds a **one-time** `listener` function for the event named `eventName` to the *beginning* of the listeners array. Au prochain déclenchement de l'évènement `eventName`, cet écouteur est supprimé, puis appelé.

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
- `eventName` {any}

Supprime tous les écouteurs, ou ceux de l'évènement `eventName` spécifié.

Notez qu'il est considéré comme une mauvaise pratique de supprimer des écouteurs ajoutés ailleurs dans le code, en particulier lorsque l’instance d'`EventEmitter` a été créée par un autre composant ou module (p. ex. sockets ou flux de fichiers (streams)).

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.

### emitter.removeListener(eventName, listener)
<!-- YAML
added: v0.1.26
-->
- `eventName` {any}
- `listener` {Function}

Supprime l'écouteur `listener` spécifié du tableau d'écouteurs pour l'évènement nommé `eventName`.

```js
const callback = (flux) => {
  console.log("quelqu'un s'est connecté");
};
serveur.on('connexion', callback);
// ...
serveur.removeListener('connexion', callback);
```

`removeListener` will remove, at most, one instance of a listener from the listener array. If any single listener has been added multiple times to the listener array for the specified `eventName`, then `removeListener` must be called multiple times to remove each instance.

Notez qu'au déclenchement d'un évènement, tous les écouteurs qui lui sont abonnés au moment du déclenchement seront appelés dans l'ordre. This implies that any `removeListener()` or `removeAllListeners()` calls *after* emitting and *before* the last listener finishes execution will not remove them from `emit()` in progress. Subsequent events will behave as expected.

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

Comme les écouteurs sont gérés à l’aide d’un tableau interne, cet appel va changer l'index de position de chaque écouteur enregistré *après* l’écouteur supprimé. Cela n’affectera pas l’ordre dans lequel les écouteurs sont appelés, mais cela signifie que toutes les copies du tableau d'écouteurs, comme celles retournées par la méthode `emitter.listeners()`, devront être recréées.

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
- `n` {integer}

Par défaut, les instances d'EventEmitter afficheront un avertissement si plus de `10` écouteurs sont ajoutés pour un même événement. Il s’agit d’une valeur par défaut utile qui aide à trouver des fuites mémoire. Bien sûr, tous les évènements ne devrait pas être limités à 10 écouteurs. La méthode `emitter.setMaxListeners()` permet de modifier la limite pour l'instance d'`EventEmitter` sur laquelle elle est appelée. Il est possible d'affecter la valeur `Infinity` (ou `0`) pour indiquer un nombre illimité d'écouteurs.

Retourne une référence à l'instance d'`EventEmitter`, afin que les appels puissent être chaînés.
