# Performance Timing API

<!--introduced_in=v8.5.0-->

> Stability: 1 - Experimental

Il Perfomance Timing API fornisce un'implementazione della specifica [W3C Performance Timeline](https://w3c.github.io/performance-timeline/). Lo scopo delle API è supportare la raccolta di metriche di prestazioni ad alta risoluzione. Questa è la stessa Performance API implementata nei moderni browser Web.

```js
const { performance } = require('perf_hooks');
performance.mark('A');
doSomeLongRunningProcess(() => {
  performance.mark('B');
  performance.measure('A to B', 'A', 'B');
  const measure = performance.getEntriesByName('A to B')[0];
  console.log(measure.duration);
  // Prints the number of milliseconds between Mark 'A' and Mark 'B'
});
```

## Classe: Perfomance
<!-- YAML
added: v8.5.0
-->

The `Performance` provides access to performance metric data. A single instance of this class is provided via the `performance` property.

### performance.clearEntries(name)
<!-- YAML
added: v8.11.2
-->

Remove all performance entry objects with `entryType` equal to `name` from the Performance Timeline.

### performance.clearFunctions([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

If `name` is not provided, removes all `PerformanceFunction` objects from the Performance Timeline. If `name` is provided, removes entries with `name`.

### performance.clearGC()
<!-- YAML
added: v8.5.0
-->

Remove all performance entry objects with `entryType` equal to `gc` from the Performance Timeline.

### performance.clearMarks([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

Se `name` non è fornito, rimuove tutti gli object ` PerformanceMark` dalla Performance Timeline. Se `name` viene fornito, rimuove solo il segno nominato.

### performance.clearMeasures([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

If `name` is not provided, removes all `PerformanceMeasure` objects from the Performance Timeline. If `name` is provided, removes only objects whose `performanceEntry.name` matches `name`.

### performance.getEntries()
<!-- YAML
added: v8.5.0
-->

* Restituisce: {Array}

Returns a list of all `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime`.

### performance.getEntriesByName(name[, type])
<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `type` {string}
* Restituisce: {Array}

Returns a list of all `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime` whose `performanceEntry.name` is equal to `name`, and optionally, whose `performanceEntry.entryType` is equal to `type`.

### performance.getEntriesByType(type)
<!-- YAML
added: v8.5.0
-->

* `type` {string}
* Restituisce: {Array}

Returns a list of all `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime` whose `performanceEntry.entryType` is equal to `type`.

### performance.mark([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

Crea un nuovo ingresso `PerformanceMark` nella Timeline Performance. Un `PerformanceMark` è una sottoclasse di `PerformanceEntry` il cui `performanceEntry.entryType` è sempre `'mark'` e il cui `performanceEntry.duration` è sempre `0`. I performance mark vengono utilizzati per contrassegnare specifici momenti significativi nella Performance Timeline.

### performance.maxEntries
<!-- YAML
added: v8.12.0
-->

Value: {number}

The maximum number of Performance Entry items that should be added to the Performance Timeline. This limit is not strictly enforced, but a process warning will be emitted if the number of entries in the timeline exceeds this limit.

Defaults to 150.

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
  performance.clearFunctions();
});
obs.observe({ entryTypes: ['function'] });

// A performance timeline entry will be created
wrapped();
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

Il tipo di perfomance entry. Current it may be one of: `'node'`, `'mark'`, `'measure'`, `'gc'`, or `'function'`.

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

### performanceNodeTiming.clusterSetupEnd
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è terminata l'elaborazione del cluster. Se l'elaborazione del cluster non è ancora terminata, la proprietà ha il valore di -1.

### performanceNodeTiming.clusterSetupStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è iniziata l'elaborazione del cluster. Se l'elaborazione del cluster non è ancora iniziata, la proprietà ha il valore di -1.

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

### performanceNodeTiming.moduleLoadEnd
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è terminato il caricamento del modulo principale.

### performanceNodeTiming.moduleLoadStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è iniziato il caricamento del modulo principale.

### performanceNodeTiming.nodeStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui il processo Node.js è stato inizializzato.

### performanceNodeTiming.preloadModuleLoadEnd
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è terminato il caricamento del modulo precarico.

### performanceNodeTiming.preloadModuleLoadStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è iniziato il caricamento del modulo precarico.

### performanceNodeTiming.thirdPartyMainEnd
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui l'elaborazione third\_party\_main è terminata. Se l'elaborazione third\_party\_main non è ancora terminata, la proprietà ha il valore di -1.

### performanceNodeTiming.thirdPartyMainStart
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è iniziata l'elaborazione third\_party\_main. Se l'elaborazione third\_party\_main non è ancora iniziata, la proprietà ha il valore di -1.

### performanceNodeTiming.v8Start
<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui la piattaforma V8 è stata inizializzata.


## Class: PerformanceObserver(callback)
<!-- YAML
added: v8.5.0
-->

* `callback` {Function} A `PerformanceObserverCallback` callback function.

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

### Callback: PerformanceObserverCallback(list, observer)
<!-- YAML
added: v8.5.0
-->

* `list` {PerformanceObserverEntryList}
* `observer` {PerformanceObserver}

The `PerformanceObserverCallback` is invoked when a `PerformanceObserver` is notified about new `PerformanceEntry` instances. Il callback riceve un'istanza `PerformanceObserverEntryList` e un riferimento a `PerformanceObserver`.

### Classe: PerformanceObserverEntryList
<!-- YAML
added: v8.5.0
-->

La classe `PerformanceObserverEntryList` viene utilizzata per fornire l'accesso alle istanze `PerformanceEntry` passate ad un `PerformanceObserver`.

#### performanceObserverEntryList.getEntries()
<!-- YAML
added: v8.5.0
-->

* Restituisce: {Array}

Restituisce un elenco di `PerformanceEntry` object in ordine cronologico per quanto riguarda il `performanceEntry.startTime`.

#### performanceObserverEntryList.getEntriesByName(name[, type])
<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `type` {string}
* Restituisce: {Array}

Restituisce un elenco di `PerformanceEntry` object in ordine cronologico per quanto riguarda il `performanceEntry.startTime` il cui `performanceEntry.name` è uguale a `name</0 >, e facoltativamente, il cui <code>performanceEntry.entryType` è uguale a `type`.

#### performanceObserverEntryList.getEntriesByType(type)
<!-- YAML
added: v8.5.0
-->

* `type` {string}
* Restituisce: {Array}

Restituisce un elenco di `PerformanceEntry` object in ordine cronologico per quanto riguarda il `performanceEntry.startTime` il cui `performanceEntry.entryType` è uguale a ` type`.

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
  * `entryTypes` {Array} An array of strings identifying the types of `PerformanceEntry` instances the observer is interested in. Se non viene fornito, verrà generato un errore.
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
  performance.clearMeasures();
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

// Monkey patch the require function
mod.Module.prototype.require =
  performance.timerify(mod.Module.prototype.require);
require = performance.timerify(require);

// Activate the observer
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`require('${entry[0]}')`, entry.duration);
  });
  obs.disconnect();
  // Free memory
  performance.clearFunctions();
});
obs.observe({ entryTypes: ['function'], buffered: true });

require('some-module');
```
