# Performance Timing API

<!--introduced_in=v8.5.0-->

> Stability: 1 - Experimental

The Performance Timing API provides an implementation of the [W3C Performance Timeline](https://w3c.github.io/performance-timeline/) specification. The purpose of the API is to support collection of high resolution performance metrics. Questa è la stessa Performance API implementata nei moderni browser Web.

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

If `name` is not provided, removes all `PerformanceMark` objects from the Performance Timeline. Se `name` viene fornito, rimuove solo il segno nominato.

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

Crea un nuovo ingresso `PerformanceMark` nella Timeline Performance. A `PerformanceMark` is a subclass of `PerformanceEntry` whose `performanceEntry.entryType` is always `'mark'`, and whose `performanceEntry.duration` is always `0`. Performance marks are used to mark specific significant moments in the Performance Timeline.

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

Crea una nuova voce `PerformanceMeasure` nella Timeline Performance. A `PerformanceMeasure` is a subclass of `PerformanceEntry` whose `performanceEntry.entryType` is always `'measure'`, and whose `performanceEntry.duration` measures the number of milliseconds elapsed since `startMark` and `endMark`.

The `startMark` argument may identify any *existing* `PerformanceMark` in the Performance Timeline, or *may* identify any of the timestamp properties provided by the `PerformanceNodeTiming` class. If the named `startMark` does not exist, then `startMark` is set to [`timeOrigin`][] by default.

The `endMark` argument must identify any *existing* `PerformanceMark` in the Performance Timeline or any of the timestamp properties provided by the `PerformanceNodeTiming` class. If the named `endMark` does not exist, an error will be thrown.

### performance.nodeTiming

<!-- YAML
added: v8.5.0
-->

* {PerformanceNodeTiming}

An instance of the `PerformanceNodeTiming` class that provides performance metrics for specific Node.js operational milestones.

### performance.now()

<!-- YAML
added: v8.5.0
-->

* Restituisce: {number}

Returns the current high resolution millisecond timestamp, where 0 represents the start of the current `node` process.

### performance.timeOrigin

<!-- YAML
added: v8.5.0
-->

* {number}

The [`timeOrigin`][] specifies the high resolution millisecond timestamp at which the current `node` process began, measured in Unix time.

### performance.timerify(fn)

<!-- YAML
added: v8.5.0
-->

* `fn` {Function}

Wraps a function within a new function that measures the running time of the wrapped function. A `PerformanceObserver` must be subscribed to the `'function'` event type in order for the timing details to be accessed.

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

Il numero totale di millisecondi trascorsi per questo ingresso. This value will not be meaningful for all Performance Entry types.

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

The high resolution millisecond timestamp marking the starting time of the Performance Entry.

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

When `performanceEntry.entryType` is equal to `'gc'`, the `performance.kind` property identifies the type of garbage collection operation that occurred. Il valore può essere uno di:

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

The high resolution millisecond timestamp at which the Node.js process completed bootstrapping. If bootstrapping has not yet finished, the property has the value of -1.

### performanceNodeTiming.clusterSetupEnd

<!-- YAML
added: v8.5.0
-->

* {number}

Il timestamp ad alta risoluzione in millisecondi in cui è terminata l'elaborazione del cluster. If cluster processing has not yet ended, the property has the value of -1.

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

The high resolution millisecond timestamp at which the Node.js event loop exited. Se il ciclo degli eventi non è ancora terminato, la proprietà ha il valore di -1. Può avere solo un valore di non -1 in un handler dell'evento [`'exit'`] [].

### performanceNodeTiming.loopStart

<!-- YAML
added: v8.5.0
-->

* {number}

The high resolution millisecond timestamp at which the Node.js event loop started. If the event loop has not yet started (e.g., in the first tick of the main script), the property has the value of -1.

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

The high resolution millisecond timestamp at which the Node.js process was initialized.

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

The high resolution millisecond timestamp at which third\_party\_main processing ended. If third\_party\_main processing has not yet ended, the property has the value of -1.

### performanceNodeTiming.thirdPartyMainStart

<!-- YAML
added: v8.5.0
-->

* {number}

The high resolution millisecond timestamp at which third\_party\_main processing started. If third\_party\_main processing has not yet started, the property has the value of -1.

### performanceNodeTiming.v8Start

<!-- YAML
added: v8.5.0
-->

* {number}

The high resolution millisecond timestamp at which the V8 platform was initialized.

## Class: PerformanceObserver(callback)

<!-- YAML
added: v8.5.0
-->

* `callback` {Function} A `PerformanceObserverCallback` callback function.

`PerformanceObserver` objects provide notifications when new `PerformanceEntry` instances have been added to the Performance Timeline.

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

Because `PerformanceObserver` instances introduce their own additional performance overhead, instances should not be left subscribed to notifications indefinitely. Users should disconnect observers as soon as they are no longer needed.

### Callback: PerformanceObserverCallback(list, observer)

<!-- YAML
added: v8.5.0
-->

* `list` {PerformanceObserverEntryList}
* `observer` {PerformanceObserver}

The `PerformanceObserverCallback` is invoked when a `PerformanceObserver` is notified about new `PerformanceEntry` instances. The callback receives a `PerformanceObserverEntryList` instance and a reference to the `PerformanceObserver`.

### Classe: PerformanceObserverEntryList

<!-- YAML
added: v8.5.0
-->

The `PerformanceObserverEntryList` class is used to provide access to the `PerformanceEntry` instances passed to a `PerformanceObserver`.

#### performanceObserverEntryList.getEntries()

<!-- YAML
added: v8.5.0
-->

* Restituisce: {Array}

Returns a list of `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime`.

#### performanceObserverEntryList.getEntriesByName(name[, type])

<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `type` {string}
* Restituisce: {Array}

Returns a list of `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime` whose `performanceEntry.name` is equal to `name`, and optionally, whose `performanceEntry.entryType` is equal to `type`.

#### performanceObserverEntryList.getEntriesByType(type)

<!-- YAML
added: v8.5.0
-->

* `type` {string}
* Restituisce: {Array}

Returns a list of `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime` whose `performanceEntry.entryType` is equal to `type`.

### performanceObserver.disconnect()

<!-- YAML
added: v8.5.0
--> Disconnects the

`PerformanceObserver` instance from all notifications.

### performanceObserver.observe(options)

<!-- YAML
added: v8.5.0
-->

* `options` {Object} 
  * `entryTypes` {Array} An array of strings identifying the types of `PerformanceEntry` instances the observer is interested in. If not provided an error will be thrown.
  * `buffered` {boolean} If true, the notification callback will be called using `setImmediate()` and multiple `PerformanceEntry` instance notifications will be buffered internally. If `false`, notifications will be immediate and synchronous. **Default:** `false`.

Subscribes the `PerformanceObserver` instance to notifications of new `PerformanceEntry` instances identified by `options.entryTypes`.

When `options.buffered` is `false`, the `callback` will be invoked once for every `PerformanceEntry` instance:

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

The following example uses the [Async Hooks](async_hooks.html) and Performance APIs to measure the actual duration of a Timeout operation (including the amount of time it to execute the callback).

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

The following example measures the duration of `require()` operations to load dependencies:

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