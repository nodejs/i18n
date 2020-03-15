# Timers

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `timer` espone un'API globale per la programmazione delle funzioni da chiamare in futuro. Dato che le funzioni timer sono globali, non è necessario chiamare `require('timers')` per usare l'API.

Le funzioni timer all'interno di Node.js implementano un API simile all'API timer fornita dai Browser Web ma utilizzano un'implementazione interna differente che è costruita attorno al [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick).

## Class: Immediate

Questo object viene creato internamente e restituito da [`setImmediate()`][]. Lo si può passare a [`clearImmediate()`][] per cancellare le azioni programmate.

## Class: Timeout

Questo object viene creato internamente ed è restituito da [`setTimeout()`][] e [`setInterval()`][]. It can be passed to [`clearTimeout()`][] or [`clearInterval()`][] (respectively) in order to cancel the scheduled actions.

Da impostazione predefinita, quando un timer viene programmato utilizzando [`setTimeout()`][] oppure [`setInterval()`][], l'event loop di Node.js continuerà a funzionare finché il timer sarà attivo. Ognuno dei `Timeout` object restituiti da queste funzioni esporta sia le funzioni `timeout.ref()` che `timeout.unref()` che possono essere utilizzate per controllare questo comportamento predefinito.

### timeout.ref()
<!-- YAML
added: v0.9.1
-->

Quando viene chiamata, è necessario che l'event loop di Node.js *non* venga chiuso finché `Timeout` è attivo. Chiamare `timeout.ref()` molteplici volte non avrà alcun effetto.

*Note*: By default, all `Timeout` objects are "ref'd", making it normally unnecessary to call `timeout.ref()` unless `timeout.unref()` had been called previously.

Returns a reference to the `Timeout`.

### timeout.unref()
<!-- YAML
added: v0.9.1
-->

Quando viene chiamato, il `Timeout` object attivo non richiederà che l'event loop di Node.js rimanga attivo. Se non c'è nessun altra attività che mantiene in esecuzione l'event loop, il processo potrebbe chiudersi prima che il callback dell'object `Timeout` sia richiamato. Chiamare `timeout.unref()` molteplici volte non avrà alcun effetto.

*Note*: Calling `timeout.unref()` creates an internal timer that will wake the Node.js event loop. Crearne troppi può influire negativamente sulle prestazioni dell'applicazione Node.js.

Returns a reference to the `Timeout`.

## Programmazione Timer

Un timer in Node.js è un costrutto interno che chiama una determinata funzione dopo un certo periodo di tempo. Quando viene richiamata la funzione timer varia a seconda di quale metodo è stato usato per creare il timer e quali altri lavori sta svolgendo l'event loop di Node.js.

### setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

* `callback`{Function} La funzione da chiamare alla fine di questo turno del [Event Loop di Node.js](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
* `...args` {any} Argomenti facoltativi da passare quando viene chiamato il `callback`.

Programma l'esecuzione "immediata" del `callback` dopo gli Input e Output dei callback degli eventi. Returns an `Immediate` for use with [`clearImmediate()`][].

Quando si effettuano chiamate multiple a `setImmediate()`, le funzioni `callback` vengono messe in attesa per l'esecuzione nell'ordine in cui sono state create. L'intera coda dei callback viene elaborata ad ogni iterazione dell'event loop. Se un timer immediato è messo in coda dall'interno di un callback in esecuzione, tale timer non verrà attivato fino alla prossima iterazione dell'event loop.

Se `callback` non è una funzione, verrà generato un [`TypeError`][].

*Note*: This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

setImmediatePromise('foobar').then((value) => {
  // value === 'foobar' (passare dei valori è facoltativo)
  // Questo viene eseguito dopo tutti i callback I/O.
});

// or with async function
async function timerExample() {
  console.log('Before I/O callbacks');
  await setImmediatePromise();
  console.log('After I/O callbacks');
}
timerExample();
```

### setInterval(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La funzione da chiamare quando il timer trascorre.
* `delay` {number} Il numero di millisecondi da aspettare prima di chiamare il `callback`.
* `...args` {any} Argomenti facoltativi da passare quando viene chiamato il `callback`.

Pianifica esecuzioni ripetute di `callback` ogni `delay` millisecondi. Returns a `Timeout` for use with [`clearInterval()`][].

Quando `delay` è maggiore di `2147483647` o inferiore a `1`, il `delay` verrà impostato su `1`.

Se `callback` non è una funzione, verrà generato un [`TypeError`][].

### setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La funzione da chiamare quando il timer trascorre.
* `delay` {number} Il numero di millisecondi da aspettare prima di chiamare il `callback`.
* `...args` {any} Argomenti facoltativi da passare quando viene chiamato il `callback`.

Pianifica l'esecuzione di un unico `callback` dopo `delay` millisecondi. Returns a `Timeout` for use with [`clearTimeout()`][].

Probabilmente il `callback` non verrà chiamato esattamente in `delay` millisecondi. No.js non fornisce garanzie circa l'esatta tempistica di esecuzione dei callback, né sull'ordine con cui vengono eseguiti. Il callback sarà invocato il più vicino possibile al tempo specificato.

*Note*: When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

Se `callback` non è una funzione, verrà generato un [`TypeError`][].

*Note*: This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(40, 'foobar').then((value) => {
  // value === 'foobar' (passare dei valori è facoltativo)
  // Questo viene eseguito dopo circa 40 millisecondi.
});
```

## Cancellazione Timer

Ognuno dei metodi [`setImmediate()`][], [`setInterval()`][], e [`setTimeout()`][] restituisce oggetti che rappresentano i timer programmati. Questi possono essere usati per cancellare il timer e impedirne l'attivazione.

It is not possible to cancel timers that were created using the promisified variants of [`setImmediate()`][], [`setTimeout()`][].

### clearImmediate(immediate)
<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} Un `immediate` object come restituito da [`setImmediate()`][].

Cancella un `Immediate` object creato da [`setImmediate()`][].

### clearInterval(timeout)
<!-- YAML
added: v0.0.1
-->

* `timeout`{Timeout} Un `Timeout` object come restituito da [`setInterval()`][].

Cancella un `Timeout` object creato da [`setInterval()`][].

### clearTimeout(timeout)
<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un `Timeout` object come restituito da [`setTimeout()`][].

Cancella un `Timeout` object creato da [`setTimeout()`][].
