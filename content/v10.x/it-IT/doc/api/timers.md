# Timers

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `timer` espone un'API globale per la programmazione delle funzioni da chiamare in futuro. Dato che le funzioni timer sono globali, non è necessario chiamare `require('timers')` per usare l'API.

The timer functions within Node.js implement a similar API as the timers API provided by Web Browsers but use a different internal implementation that is built around [the Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/).

## Class: Immediate

Questo object viene creato internamente e restituito da [`setImmediate()`][]. Lo si può passare a [`clearImmediate()`][] per cancellare le azioni programmate.

Da impostazione predefinita, quando si programma una immediate, l'event loop di Node.js continuerà a funzionare finché l'imediate è attiva. L’`Immediate` object restituito da [`setImmediate()`][] esporta entrambe le funzioni `Immediate.ref()` e `Immediate.unref()` che possono essere utilizzate per controllare questo comportamento predefinito.

### immediate.ref()
<!-- YAML
added: v9.7.0
-->

* Restituisce: {Immediate} un riferimento a `immediate`

When called, requests that the Node.js event loop *not* exit so long as the `Immediate` is active. Calling `immediate.ref()` multiple times will have no effect.

By default, all `Immediate` objects are "ref'ed", making it normally unnecessary to call `immediate.ref()` unless `immediate.unref()` had been called previously.

### immediate.unref()
<!-- YAML
added: v9.7.0
-->

* Restituisce: {Immediate} un riferimento a `immediate`

When called, the active `Immediate` object will not require the Node.js event loop to remain active. If there is no other activity keeping the event loop running, the process may exit before the `Immediate` object's callback is invoked. Calling `immediate.unref()` multiple times will have no effect.

## Class: Timeout

Questo object viene creato internamente ed è restituito da [`setTimeout()`][] e [`setInterval()`][]. It can be passed to either [`clearTimeout()`][] or [`clearInterval()`][] in order to cancel the scheduled actions.

Da impostazione predefinita, quando un timer viene programmato utilizzando [`setTimeout()`][] oppure [`setInterval()`][], l'event loop di Node.js continuerà a funzionare finché il timer sarà attivo. Ognuno dei `Timeout` object restituiti da queste funzioni esporta sia le funzioni `timeout.ref()` che `timeout.unref()` che possono essere utilizzate per controllare questo comportamento predefinito.

### timeout.ref()
<!-- YAML
added: v0.9.1
-->

* Restituisce: {Timeout} un riferimento a `timeout`

Quando viene chiamata, è necessario che l'event loop di Node.js *non* venga chiuso finché `Timeout` è attivo. Chiamare `timeout.ref()` molteplici volte non avrà alcun effetto.

By default, all `Timeout` objects are "ref'ed", making it normally unnecessary to call `timeout.ref()` unless `timeout.unref()` had been called previously.

### timeout.refresh()
<!-- YAML
added: v10.2.0
-->

* Restituisce: {Timeout} un riferimento a `timeout`

Sets the timer's start time to the current time, and reschedules the timer to call its callback at the previously specified duration adjusted to the current time. This is useful for refreshing a timer without allocating a new JavaScript object.

Using this on a timer that has already called its callback will reactivate the timer.

### timeout.unref()
<!-- YAML
added: v0.9.1
-->

* Restituisce: {Timeout} un riferimento a `timeout`

Quando viene chiamato, il `Timeout` object attivo non richiederà che l'event loop di Node.js rimanga attivo. Se non c'è nessun altra attività che mantiene in esecuzione l'event loop, il processo potrebbe chiudersi prima che il callback dell'object `Timeout` sia richiamato. Chiamare `timeout.unref()` molteplici volte non avrà alcun effetto.

Calling `timeout.unref()` creates an internal timer that will wake the Node.js event loop. Crearne troppi può influire negativamente sulle prestazioni dell'applicazione Node.js.

## Programmazione Timer

Un timer in Node.js è un costrutto interno che chiama una determinata funzione dopo un certo periodo di tempo. Quando viene richiamata la funzione timer varia a seconda di quale metodo è stato usato per creare il timer e quali altri lavori sta svolgendo l'event loop di Node.js.

### setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

* `callback` {Function} The function to call at the end of this turn of [the Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/)
* `...args` {any} Argomenti facoltativi da passare quando viene chiamato il `callback`.
* Returns: {Immediate} for use with [`clearImmediate()`][]

Programma l'esecuzione "immediata" del `callback` dopo gli Input e Output dei callback degli eventi.

Quando si effettuano chiamate multiple a `setImmediate()`, le funzioni `callback` vengono messe in attesa per l'esecuzione nell'ordine in cui sono state create. L'intera coda dei callback viene elaborata ad ogni iterazione dell'event loop. Se un timer immediato è messo in coda dall'interno di un callback in esecuzione, tale timer non verrà attivato fino alla prossima iterazione dell'event loop.

Se `callback` non è una funzione, verrà generato un [`TypeError`][].

This method has a custom variant for promises that is available using [`util.promisify()`][]:

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
* Returns: {Timeout} for use with [`clearInterval()`][]

Pianifica esecuzioni ripetute di `callback` ogni `delay` millisecondi.

Quando `delay` è maggiore di `2147483647` o inferiore a `1`, il `delay` verrà impostato su `1`.

Se `callback` non è una funzione, verrà generato un [`TypeError`][].

### setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La funzione da chiamare quando il timer trascorre.
* `delay` {number} Il numero di millisecondi da aspettare prima di chiamare il `callback`.
* `...args` {any} Argomenti facoltativi da passare quando viene chiamato il `callback`.
* Returns: {Timeout} for use with [`clearTimeout()`][]

Pianifica l'esecuzione di un unico `callback` dopo `delay` millisecondi.

Probabilmente il `callback` non verrà chiamato esattamente in `delay` millisecondi. No.js non fornisce garanzie circa l'esatta tempistica di esecuzione dei callback, né sull'ordine con cui vengono eseguiti. Il callback sarà invocato il più vicino possibile al tempo specificato.

When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

Se `callback` non è una funzione, verrà generato un [`TypeError`][].

This method has a custom variant for promises that is available using [`util.promisify()`][]:

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
