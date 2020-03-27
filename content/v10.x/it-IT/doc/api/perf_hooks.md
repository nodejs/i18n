# Performance Timing API

<!--introduced_in=v8.5.0-->

> Stability: 1 - Experimental

Il Perfomance Timing API fornisce un'implementazione della specifica [W3C Performance Timeline](https://w3c.github.io/performance-timeline/). Lo scopo delle API è supportare la raccolta di metriche di prestazioni ad alta risoluzione. Questa è la stessa Performance API implementata nei moderni browser Web.

```js
const { PerformanceObserver, performance } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  console.log(items.getEntries()[0].duration);
  performance.clearMarks();
});
obs.observe({ entryTypes: ['measure'] });

performance.mark('A');
doSomeLongRunningProcess(() => {
  performance.mark('B');
  performance.measure('A to B', 'A', 'B');
});
```

## Classe: Perfomance
<!-- YAML
added: v8.5.0
-->

### performance.clearMarks([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

Se `name` non è fornito, rimuove tutti gli object ` PerformanceMark` dalla Performance Timeline. Se `name` viene fornito, rimuove solo il segno nominato.

### performance.mark([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

Crea un nuovo ingresso `PerformanceMark` nella Timeline Performance. Un `PerformanceMark` è una sottoclasse di `PerformanceEntry` il cui `performanceEntry.entryType` è sempre `'mark'` e il cui `performanceEntry.duration` è sempre `0`. I performance mark vengono utilizzati per contrassegnare specifici momenti significativi nella Performance Timeline.

### performance.measure(name, startMark, endMark)
<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `startMark` {string}
* `endMark` {string}

Crea una nuova voce `PerformanceMeasure` nella Timeline Performance. Una ` PerformanceMeasure` è una sottoclasse di `PerformanceEntry ` il cui `performanceEntry.entryType` è sempre `'measure'` e il cui `performanceEntry.duration` misura il numero di millisecondi trascorsi da `startMark` e `endMark`.

The `startMark` argument may identify any *existing* `PerformanceMark` in the Performance Timeline, or *may* identify any of the timestamp properties provided by the `PerformanceNodeTiming` class. Se lo `startMark` nominato non esiste, allora ` startMark` è impostato su [` timeOrigin`][] per impostazione predefinita.

L'argomento `endMark` deve identificare qualsiasi `PerformanceMark` *esistente* nella Perfomance Timeline o una qualsiasi delle proprietà timestamp fornite dalla classe `PerformanceNodeTiming`. Se il `endMark` nominato non esiste, verrà lanciato un errore.

### performance.nodeTiming
<!-- YAML
added: v8.5.0
-->

* {PerformanceNodeTiming}

Un'istanza della classe `PerformanceNodeTiming` che fornisce le metriche delle prestazioni per le milestone operative specifiche di Node.js.

### performance.now()
<!-- YAML
added: v8.5.0
-->

* Restituisce: {number}

Restituisce il timestamp corrente ad alta risoluzione in millisecondi, dove 0 rappresenta l'inizio del processo `node` corrente.

### performance.timeOrigin
<!-- YAML
added: v8.5.0
-->

* {number}

Il [`timeOrigin`][] specifica il timestamp ad alta risoluzione al millisecondo in cui è iniziato il processo `node` corrente, misurato in tempo Unix.

### performance.timerify(fn)
<!-- YAML
added: v8.5.0
-->

* `fn` {Function}

Esegue il wrapping di una funzione all'interno di una nuova funzione che misura il tempo di esecuzione della funzione che subisce il wrappling. Un `PerformanceObserver` deve essere sottoscritto al tipo di evento `'function'` per accedere ai dettagli relativi al tempo.

```js
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

function someFunction() {
  console.log('hello world');
}

const wrapped = performance.timerify(someFunction);

const obs = new PerformanceObserver((list) => {
  console.log(list.getEntries()[0].duration);
  obs.disconnect();
});
obs.observe({ entryTypes: ['function'] });

// Verrà creato un ingresso wrapped di Perfomance timeline
();
```

## Classe: PerfomanceEntry
<!-- YAML
added: v8.5.0
-->

### performanceEntry.duration
<!-- YAML
added: v8.5.0
-->

* {number}

Il numero totale di millisecondi trascorsi per questo ingresso. Questo valore non sarà significativo per tutti i tipi di Performance Entry.

### performanceEntry.name
<!-- YAML
added: v8.5.0
-->

* {string}

Il nome della perfomance entry.

### performanceEntry.startTime
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp in millisecondi ad alta risoluzione che segna l'ora di inizio della Performance Entry.

### performanceEntry.entryType
<!-- YAML
added: v8.5.0
-->

* {string}

Il tipo di perfomance entry. Currently it may be one of: `'node'`, `'mark'`, `'measure'`, `'gc'`, `'function'`, or `'http2'`.

### performanceEntry.kind
<!-- YAML
added: v8.5.0
-->

* {number}

Quando `performanceEntry.entryType` è uguale a `'gc'`, la proprietà ` performance.kind` identifica il tipo di operazione di garbage collection che si è verificata. Il valore può essere uno di:

* `perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR`
* `perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR`
* `perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL`
* `perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB`

## Classe: PerformanceNodeTiming extends PerformanceEntry
<!-- YAML
added: v8.5.0
-->

Fornisce i dettagli relativi al tempo per Node.js stesso.

### performanceNodeTiming.bootstrapComplete
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui il processo Node.js ha completato il bootstrapping. Se il bootstraping non è ancora terminato, la proprietà ha il valore di -1.

### performanceNodeTiming.loopExit
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è terminato il ciclo eventi Node.js. Se il ciclo degli eventi non è ancora terminato, la proprietà ha il valore di -1. Può avere solo un valore di non -1 in un handler dell'evento [`'exit'`] [].

### performanceNodeTiming.loopStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp in millisecondi ad alta risoluzione in cui è iniziato il ciclo di eventi Node.js. Se il ciclo degli eventi non è ancora iniziato (ad esempio, nella prima spunta dello script principale), la proprietà ha il valore di -1.

### performanceNodeTiming.nodeStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui il processo Node.js è stato inizializzato.

### performanceNodeTiming.v8Start
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui la piattaforma V8 è stata inizializzata.

## Classe: PerformanceObserver

### new PerformanceObserver(callback)
<!-- YAML
added: v8.5.0
-->

* `callback` {Function}
  * `list` {PerformanceObserverEntryList}
  * `observer` {PerformanceObserver}

Gli object `PerformanceObserver` forniscono notifiche quando nuove istanze `PerformanceEntry ` sono state aggiunte alla Performance Timeline.

```js
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

const obs = new PerformanceObserver((list, observer) => {
  console.log(list.getEntries());
  observer.disconnect();
});
obs.observe({ entryTypes: ['mark'], buffered: true });

performance.mark('test');
```
Poiché le istanze `PerformanceObserver` introducono il proprio overhead aggiuntivo delle prestazioni, le istanze non devono essere lasciate alle notifiche a tempo indeterminato. Gli utenti dovrebbero disconnettere gli osservatori non appena non sono più necessari.

The `callback` is invoked when a `PerformanceObserver` is notified about new `PerformanceEntry` instances. Il callback riceve un'istanza `PerformanceObserverEntryList` e un riferimento a `PerformanceObserver`.

### performanceObserver.disconnect()
<!-- YAML
added: v8.5.0
-->
Disconnette l'istanza 

`PerformanceObserver` da tutte le notifiche.

### performanceObserver.observe(options)
<!-- YAML
added: v8.5.0
-->
* `options` {Object}
  * `entryTypes` {string[]} An array of strings identifying the types of `PerformanceEntry` instances the observer is interested in. Se non viene fornito, verrà generato un errore.
  * `buffered` {boolean} Se true, la callback della notifica verrà chiamata utilizzando `setImmediate()` e più notifiche di istanza ` PerformanceEntry` verranno memorizzate internamente. Se `false`, le notifiche saranno immediate e sincrone. **Default:** `false`.

Sottoscrive l'istanza `PerformanceObserver` alle notifiche delle nuove istanze `PerformanceEntry` identificate da `options.entryTypes`.

Quando `options.buffered` è `false`, la `callback` verrà invocata una volta per ogni istanza `PerformanceEntry`:

```js
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

const obs = new PerformanceObserver((list, observer) => {
  // chiamato tre volte in modo sincrono. l'elenco contiente un elemento
});
obs.observe({ entryTypes: ['mark'] });

for (let n = 0; n < 3; n++)
  performance.mark(`test${n}`);
```

```js
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

const obs = new PerformanceObserver((list, observer) => {
  // chiamato una volta. l'elenco contiene tre elementi
});
obs.observe({ entryTypes: ['mark'], buffered: true });

for (let n = 0; n < 3; n++)
  performance.mark(`test${n}`);
```

## Classe: PerformanceObserverEntryList
<!-- YAML
added: v8.5.0
-->

La classe `PerformanceObserverEntryList` viene utilizzata per fornire l'accesso alle istanze `PerformanceEntry` passate ad un `PerformanceObserver`.

### performanceObserverEntryList.getEntries()
<!-- YAML
added: v8.5.0
-->

* Returns: {PerformanceEntry[]}

Restituisce un elenco di `PerformanceEntry` object in ordine cronologico per quanto riguarda il `performanceEntry.startTime`.

### performanceObserverEntryList.getEntriesByName(name[, type])
<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `type` {string}
* Returns: {PerformanceEntry[]}

Restituisce un elenco di `PerformanceEntry` object in ordine cronologico per quanto riguarda il `performanceEntry.startTime` il cui `performanceEntry.name` è uguale a `name</0 >, e facoltativamente, il cui <code>performanceEntry.entryType` è uguale a `type`.

### performanceObserverEntryList.getEntriesByType(type)
<!-- YAML
added: v8.5.0
-->

* `type` {string}
* Returns: {PerformanceEntry[]}

Restituisce un elenco di `PerformanceEntry` object in ordine cronologico per quanto riguarda il `performanceEntry.startTime` il cui `performanceEntry.entryType` è uguale a ` type`.

## Esempi

### Misurazione della durata delle operazioni asincrone

Nell'esempio seguente vengono utilizzati gli [Hook asincroni](async_hooks.html) e le Performance API per misurare la durata effettiva di un'operazione di timeout (compreso il tempo necessario per eseguire la callback).

```js
'use strict';
const async_hooks = require('async_hooks');
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

const set = new Set();
const hook = async_hooks.createHook({
  init(id, type) {
    if (type === 'Timeout') {
      performance.mark(`Timeout-${id}-Init`);
      set.add(id);
    }
  },
  destroy(id) {
    if (set.has(id)) {
      set.delete(id);
      performance.mark(`Timeout-${id}-Destroy`);
      performance.measure(`Timeout-${id}`,
                          `Timeout-${id}-Init`,
                          `Timeout-${id}-Destroy`);
    }
  }
});
hook.enable();

const obs = new PerformanceObserver((list, observer) => {
  console.log(list.getEntries()[0]);
  performance.clearMarks();
  observer.disconnect();
});
obs.observe({ entryTypes: ['measure'], buffered: true });

setTimeout(() => {}, 1000);
```

### Misurare il tempo necessario per caricare le dipendenze

L'esempio seguente misura la durata delle operazioni `require()` per caricare le dipendenze:
```js
'use strict';
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');
const mod = require('module');

// Monkey patch richiede la funzione
mod.Module.prototype.require =
  performance.timerify(mod.Module.prototype.require);
require = performance.timerify(require);

// Attiva l'observer
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`require('${entry[0]}')`, entry.duration);
  });
  obs.disconnect();
});
obs.observe({ entryTypes: ['function'], buffered: true });

require('some-module');
```
