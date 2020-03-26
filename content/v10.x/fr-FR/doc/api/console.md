# Console

<!--introduced_in=v0.10.13-->

> Stabilité: 2 - stable

Le module `console` fournit une console de débogage simple, similaire au mécanisme de console JavaScript fourni par les navigateurs web.

Le module exporte deux composants spécifiques :

* Une classe `Console` avec des méthodes telles que `console.log()`, `console.error()` et `console.warn()`, qui peut être utilisée pour écrire dans n’importe quel flux Node.js.
* Une instance globale `console` configurée pour écrire dans [`process.stdout`][] et [`process.stderr`][]. L'instance globale `console` peut être utilisée sans appeler `require('console')`.

***Warning***: The global console object's methods are neither consistently synchronous like the browser APIs they resemble, nor are they consistently asynchronous like all other Node.js streams. Voir la [note sur les processus I/O](process.html#process_a_note_on_process_i_o) pour plus d’informations.

Exemple d’utilisation de l'instance globale `console` :

```js
console.log('hello world');
// Prints: hello world, to stdout
console.log('hello %s', 'world');
// Prints: hello world, to stdout
console.error(new Error('Whoops, something bad happened'));
// Prints: [Error: Whoops, something bad happened], to stderr

const name = 'Will Robinson';
console.warn(`Danger ${name}! Danger!`);
// Prints: Danger Will Robinson! Danger!, to stderr
```

Exemple d’utilisation de la classe `Console` :

```js
const out = getStreamSomehow();
const err = getStreamSomehow();
const myConsole = new console.Console(out, err);

myConsole.log('hello world');
// Prints: hello world, to out
myConsole.log('hello %s', 'world');
// Prints: hello world, to out
myConsole.error(new Error('Whoops, something bad happened'));
// Prints: [Error: Whoops, something bad happened], to err

const name = 'Will Robinson';
myConsole.warn(`Danger ${name}! Danger!`);
// Prints: Danger Will Robinson! Danger!, to err
```

## Classe : Console
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: Errors that occur while writing to the underlying streams
                 will now be ignored by default.
-->

<!--type=class-->

La classe `Console` peut-être utilisée pour créer un simple logger ayant des flux de sortie configurables et est accessible en utilisant soit `require('console').Console`, soit `console.Console` (ou leurs équivalents déstructurés) :

```js
const { Console } = require('console');
```

```js
const { Console } = console;
```

### new Console(stdout\[, stderr\]\[, ignoreErrors\])
### new Console(options)
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9744
    description: The `ignoreErrors` option was introduced.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19372
    description: The `Console` constructor now supports an `options` argument,
                 and the `colorMode` option was introduced.
-->

* `options` {Object}
  * `stdout` {stream.Writable}
  * `stderr` {stream.Writable}
  * `ignoreErrors` {boolean} Ignore errors when writing to the underlying streams. **Par défaut :** `true`.
  * `colorMode` {boolean|string} Définit la prise en charge des couleurs pour cette instance de `Console`. Définir à `true` active le support des couleurs lors de l'inspection des valeurs, définir à `'auto'` rendra le support des couleurs dépendant de la valeur de la propriété `isTTY` et de la valeur retournée par `getColorDepth()` sur le flux respectif. **Default:** `'auto'`.

Crée une nouvelle `Console` avec une ou deux instances de flux accessibles en écriture. `stdout` est un flux accessible en écriture pour écrire des sorties de log ou d'information. `stderr` est utilisé pour des sorties d'avertissement ou d'erreur. Si `stderr` n’est pas fourni, `stdout` est utilisé en tant que `stderr`.

```js
const output = fs.createWriteStream('./stdout.log');
const errorOutput = fs.createWriteStream('./stderr.log');
// custom simple logger
const logger = new Console({ stdout: output, stderr: errorOutput });
// use it like console
const count = 5;
logger.log('count: %d', count);
// in stdout.log: count 5
```

L'instance globale `console` est une `Console` spéciale dont la sortie est envoyée à [`process.stdout`][] et [`process.stderr`][]. Cela équivaut à l’appel :

```js
new Console({ stdout: process.stdout, stderr: process.stderr });
```

### console.assert(value[, ...message])
<!-- YAML
added: v0.1.101
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17706
    description: The implementation is now spec compliant and does not throw
                 anymore.
-->
* `value` {any} La valeur testée comme étant vraie.
* `...message` {any} Tous les arguments en plus de `valeur` sont utilisés comme message d’erreur.

Un simple test d'assertion qui vérifie si la `valeur` est effectivement vraie. If it is not, `Assertion failed` is logged. If provided, the error `message` is formatted using [`util.format()`][] by passing along all message arguments. The output is used as the error message.

```js
console.assert(true, 'does nothing');
// OK
console.assert(false, 'Whoops %s work', 'didn\'t');
// Assertion failed: Whoops didn't work
```

Calling `console.assert()` with a falsy assertion will only cause the `message` to be printed to the console without interrupting execution of subsequent code.

### console.clear()
<!-- YAML
added: v8.3.0
-->

Lorsque `stdout` est un terminal, appeler `console.clear()` tentera de vider le terminal. Lorsque `stdout` n’est pas un terminal, cette méthode ne fait rien.

The specific operation of `console.clear()` can vary across operating systems and terminal types. Pour la plupart des systèmes d’exploitation Linux, `console.clear()` fonctionne de manière similaire à la commande shell `clear`. Sous Windows, `console.clear()` effacera uniquement la sortie dans la fenêtre courante de terminal pour l'exécutable Node.js.

### console.count([label])
<!-- YAML
added: v8.3.0
-->

* `label` {string} le libellé d’affichage pour le compteur. **Par défaut :** `'default'`.

Maintient un compteur interne spécifique à `label` et écrit dans `stdout` le nombre de fois où `console.count()` a été appelé avec le `label` donné.
```js
> console.count()
default: 1
undefined
> console.count('default')
default: 2
undefined
> console.count('abc')
abc: 1
undefined
> console.count('xyz')
xyz: 1
undefined
> console.count('abc')
abc: 2
undefined
> console.count()
default: 3
undefined
>
```

### console.countReset([label])<!-- YAML
added: v8.3.0
-->* `label` {string} le libellé d’affichage pour le compteur. **Par défaut :** `'default'`.

Réinitialise le compteur interne spécifique à `label`.
```js
> console.count('abc');
abc: 1
undefined
> console.countReset('abc');
undefined
> console.count('abc');
abc: 1
undefined
>
```

### console.debug(data[, ...args])<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17033
    description: "`console.debug` is now an alias for `console.log`."
-->* `data` {any}
* `...args` {any}

La fonction `console.debug()` est un alias de [`console.log()`][].

### console.dir(obj[, options])<!-- YAML
added: v0.1.101
-->* `obj` {any}
* `options` {Object}
  * `showHidden` {boolean} Si `true`, alors les propriétés non énumérables et de type symbole de l'objet seront aussi montrées. **Par défaut :** `false`.
  * `depth` {number} Indique à [`util.inspect()`][] le nombre de récursions à effectuer lors du formatage de l'objet. Utile pour inspecter des objets volumineux et complexes. `null` supprime la limite du nombre de récursions. **Par défaut :** `2`.
  * `colors` {boolean} Si `true`, la sortie sera stylée avec les codes couleur ANSI. Les couleurs sont personnalisables ; voir [customizing `util.inspect()` colors][]. **Par défaut :** `false`.

Utilise [`util.inspect()`][] sur `obj` et écrit la chaîne de retour dans `stdout`. Cette fonction contourne toute fonction personnalisée `inspect()` définie sur `obj`.

### console.dirxml(...data)<!-- YAML
added: v8.0.0
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/17152
    description: "`console.dirxml` now calls `console.log` for its arguments."
-->* `...data` {any}

This method calls `console.log()` passing it the arguments received. Please note that this method does not produce any XML formatting.

### console.error(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Écrit dans `stderr` avec une nouvelle ligne. Plusieurs arguments peuvent être transmis, le premier servant de message primaire et tous les autres de valeurs de substitution, à la manière de printf(3) (tous les arguments sont passés à [`util.format()`][]).

```js
const code = 5;
console.error('error #%d', code);
// Prints: error #5, to stderr
console.error('error', code);
// Prints: error 5, to stderr
```

Si aucun élément de formatage (par exemple `%d`) n'est trouvé dans la première chaîne, [`util.inspect()`][] est appelé pour chaque argument et les valeurs de chaînes résultantes sont concaténées. Voir [`util.format()`][] pour plus d’informations.

### console.group([...label])<!-- YAML
added: v8.5.0
-->* `...label` {any}

Augmente l'indentation des lignes suivantes de deux espaces.

Si un ou plusieurs `label`(s) sont fournis, ceux sont imprimées en premier sans l’indentation supplémentaire.

### console.groupCollapsed()<!-- YAML
  added: v8.5.0
-->Un alias de [`console.group()`][].

### console.groupEnd()
<!-- YAML
added: v8.5.0
-->

Réduit l'indentation des lignes suivantes de deux espaces.

### console.info(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

La fonction `console.info()` est un alias de [`console.log()`][].

### console.log(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

Écrit dans `stdout` avec une nouvelle ligne. Plusieurs arguments peuvent être transmis, le premier servant de message primaire et tous les autres de valeurs de substitution, à la manière de printf(3) (tous les arguments sont passés à [`util.format()`][]).

```js
const count = 5;
console.log('count: %d', count);
// Prints: count: 5, to stdout
console.log('count:', count);
// Prints: count: 5, to stdout
```

Voir [`util.format()`][] pour plus d’informations.

### console.table(tabularData[, properties])<!-- YAML
added: v10.0.0
-->* `tabularData` {any}
* `properties` {string[]} Autres propriétés pour la construction du tableau.

Try to construct a table with the columns of the properties of `tabularData` (or use `properties`) and rows of `tabularData` and log it. Falls back to just logging the argument if it can’t be parsed as tabular.

```js
// These can't be parsed as tabular data
console.table(Symbol());
// Symbol()

console.table(undefined);
// undefined

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
// ┌─────────┬─────┬─────┐
// │ (index) │  a  │  b  │
// ├─────────┼─────┼─────┤
// │    0    │  1  │ 'Y' │
// │    1    │ 'Z' │  2  │
// └─────────┴─────┴─────┘

console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }], ['a']);
// ┌─────────┬─────┐
// │ (index) │  a  │
// ├─────────┼─────┤
// │    0    │  1  │
// │    1    │ 'Z' │
// └─────────┴─────┘
```

### console.time([label])<!-- YAML
added: v0.1.104
-->* `label` {string} **Default:** `'default'`

Démarre un timer qui peut servir à calculer la durée dune opération. Les timers sont identifiés par un `label` unique. Utilisez le même `label` quand vous appelez [`console.timeEnd()`][] pour arrêter le timer et écrire le temps écoulé en millisecondes dans `stdout`. Les durées des timers sont précises jusque sous la milliseconde.

### console.timeEnd([label])<!-- YAML
added: v0.1.104
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5901
    description: This method no longer supports multiple calls that don’t map
                 to individual `console.time()` calls; see below for details.
-->* `label` {string} **Default:** `'default'`

Arrête un timer précédemment démarré en appelant [`console.time()`][] et écrit le résultat dans `stdout` :

```js
console.time('100-elements');
for (let i = 0; i < 100; i++) {}
console.timeEnd('100-elements');
// prints 100-elements: 225.438ms
```

### console.timeLog(\[label\]\[, ...data\])<!-- YAML
added: v10.7.0
-->* `label` {string} **Default:** `'default'`
* `...data` {any}

For a timer that was previously started by calling [`console.time()`][], prints the elapsed time and other `data` arguments to `stdout`:

```js
console.time('process');
const value = expensiveProcess1(); // Returns 42
console.timeLog('process', value);
// Prints "process: 365.227ms 42".
doExpensiveProcess2(value);
console.timeEnd('process');
```

### console.trace(\[message\]\[, ...args\])<!-- YAML
added: v0.1.104
-->* `message` {any}
* `...args` {any}

Prints to `stderr` the string `'Trace: '`, followed by the [`util.format()`][] formatted message and stack trace to the current position in the code.

```js
console.trace('Show me');
// Prints: (stack trace will vary based on where trace is called)
//  Trace: Show me
//    at repl:2:9
//    at REPLServer.defaultEval (repl.js:248:27)
//    at bound (domain.js:287:14)
//    at REPLServer.runBound [as eval] (domain.js:300:12)
//    at REPLServer.<anonymous> (repl.js:412:12)
//    at emitOne (events.js:82:20)
//    at REPLServer.emit (events.js:169:7)
//    at REPLServer.Interface._onLine (readline.js:210:10)
//    at REPLServer.Interface._line (readline.js:549:8)
//    at REPLServer.Interface._ttyWrite (readline.js:826:14)
```

### console.warn(\[data\]\[, ...args\])<!-- YAML
added: v0.1.100
-->* `data` {any}
* `...args` {any}

La fonction `console.warn()` est un alias pour [`console.error()`][].

## Méthodes spécifiques à l'inspecteur
Les méthodes suivantes sont présentées par le moteur V8 dans l'API générale, mais n'affichent rien à moins d'être utilisées en conjonction avec l'[inspecteur](debugger.html) (option `--inspect`).

### console.markTimeline([label])<!-- YAML
added: v8.0.0
-->* `label` {string} **Default:** `'default'`

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.markTimeline()` method is the deprecated form of [`console.timeStamp()`][].

### console.profile([label])<!-- YAML
added: v8.0.0
-->* `label` {string}

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. La méthode `console.profile()` démarre un profilage CPU JavaScript avec un label optionnel, jusqu'à l'appel de [`console.profileEnd()`][]. Le profil est alors ajouté au panneau **Profiles** de l'inspecteur.
```js
console.profile('MyLabel');
// Some code
console.profileEnd('MyLabel');
// Adds the profile 'MyLabel' to the Profiles panel of the inspector.
```

### console.profileEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string}

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. Arrête la session de profilage CPU Javascript courante si une a été démarrée et écrit le rapport dans le panneau **Profiles** de l'inspecteur. Voir [`console.profile()`][] pour un exemple.

If this method is called without a label, the most recently started profile is stopped.

### console.timeStamp([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string}

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.timeStamp()` method adds an event with the label `'label'` to the **Timeline** panel of the inspector.

### console.timeline([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} **Default:** `'default'`

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. La méthode `console.timeline()` est la forme obsolète de [`console.time()`][].

### console.timelineEnd([label])
<!-- YAML
added: v8.0.0
-->
* `label` {string} **Default:** `'default'`

Cette méthode n'affiche rien à moins d'être utilisée dans l'inspecteur. The `console.timelineEnd()` method is the deprecated form of [`console.timeEnd()`][].
