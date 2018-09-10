# Tiempo de desempeño API

<!--introduced_in=v8.5.0-->

> Estabilidad: 1 - Experimental

El Tiempo de Rendimiento API proporciona una implementación de la especificación [Tiempo de rendimiento de W3C](https://w3c.github.io/performance-timeline/). El propósito de la API es el de apoyar la colección de métricas de rendimiento de alta resolución. Este es el mismo Performance API que es implementado en navegadores Web modernos.

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

## Clase: Performance

<!-- YAML
added: v8.5.0
-->

### performance.clearMarks([name])

<!-- YAML
added: v8.5.0
-->

* `name` {string}

Si `name` no es proporcionado, esto elimina todos los objetos `PerformanceMark` del Tiempo de Rendimiento. Si se proporciona `name`, esto elimina solo la marca nombrada.

### performance.mark([name])

<!-- YAML
added: v8.5.0
-->

* `name` {string}

Crea una nueva entrada `PerformanceMark` en el Tiempo de Rendimiento. `PerformanceMark` es una subclase de `PerformanceEntry` cuya `performanceEntry.entryType` siempre es `'mark'`, y cuya `performanceEntry.duration` es siempre `0`. Las marcas de rendimiento son usadas para marcar momentos específicos significativos en el Tiempo de Rendimiento.

### performance.measure(name, startMark, endMark)

<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `startMark` {string}
* `endMark` {string}

Crea una nueva entrada `PerformanceMeasure` en el Tiempo de Rendimiento. `PerformanceMeasure` es una subclase de `PerformanceEntry`, cuya `performanceEntry.entryType` siempre es `'measure'`, y cuya `performanceEntry.duration` mide el número de milisegundos transcurridos desde `startMark` y `endMark`.

El argumento `startMark` puede identificar cualquier `PerformanceMark` *existente* en el Tiempo de Rendimiento, o *puede* identificar cualquiera de las propiedades timestamp proporcionadas por la clase `PerformanceNodeTiming`. Si el nombre `startMark` no existe, entonces `startMark` es establecido como [`timeOrigin`][] por defecto.

El argumento `endMark` debe especificar cualquier `PerformanceMark` *existente* en el Tiempo de Rendimiento o cualquiera de las propiedades timestamp proporcionadas por la clase `PerformanceNodeTiming`. Si el nombre `endMark` no existe, se producirá un error.

### performance.nodeTiming

<!-- YAML
added: v8.5.0
-->

* {PerformanceNodeTiming}

Una instancia de la clase `PerformanceNodeTiming` que proporciona métricas de rendimiento para objetivos operacionales específicos de Node.js.

### performance.now()

<!-- YAML
added: v8.5.0
-->

* Devuelve: {number}

Devuelve la timestamp de alta resolución en milisegundos actual, donde 0 representa el inicio del proceso `node` actual.

### performance.timeOrigin

<!-- YAML
added: v8.5.0
-->

* {number}

El [`timeOrigin`][] especifica la timestamp de alta resolución en milisegundos en la cual el proceso `node` actual comenzó, medido en tiempo Unix.

### performance.timerify(fn)

<!-- YAML
added: v8.5.0
-->

* `fn` {Function}

Envuelve una función dentro de una nueva función que mide el tiempo de ejecución de la función envuelta. Un `PerformanceObserver` debe ser suscrito al tipo de evento `'function'` en orden para los detalles de sincronización para ser accedido.

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

// Una entrada para el tiempo de rendimiento será creada envuelta();
```

## Clase: PerformanceEntry

<!-- YAML
added: v8.5.0
-->

### performanceEntry.duration

<!-- YAML
added: v8.5.0
-->

* {number}

El número total de milisegundos transcurridos para esta entrada. Este valor no será significativo para todos los tipos de Entradas de Rendimiento.

### performanceEntry.name

<!-- YAML
added: v8.5.0
-->

* {string}

El nombre de la entrada de rendimiento.

### performanceEntry.startTime

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos marcando el inicio de la Entrada de Rendimiento.

### performanceEntry.entryType

<!-- YAML
added: v8.5.0
-->

* {string}

El tipo de la entrada de rendimiento. Actualmente puede ser uno de los siguientes: `'node'`, `'mark'`, `'measure'`, `'gc'`, `'function'`, o `'http2'`.

### performanceEntry.kind

<!-- YAML
added: v8.5.0
-->

* {number}

Cuando `performanceEntry.entryType` es igual a `'gc'`, la propiedad `performance.kind` identifica el tipo de operación de recolección de basura que ocurrió. El valor puede ser uno de los siguientes:

* `perf_hooks.constants.NODE_PERFORMANCE_GC_MAJOR`
* `perf_hooks.constants.NODE_PERFORMANCE_GC_MINOR`
* `perf_hooks.constants.NODE_PERFORMANCE_GC_INCREMENTAL`
* `perf_hooks.constants.NODE_PERFORMANCE_GC_WEAKCB`

## Clase: PerformanceNodeTiming expande PerformanceEntry

<!-- YAML
added: v8.5.0
-->

Proporciona detalles de tiempo para el propio Node.js.

### performanceNodeTiming.bootstrapComplete

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el proceso de Node.js completó el bootstrapping. Si el bootstrapping no ha terminado aún, la propiedad tiene el valor de -1.

### performanceNodeTiming.clusterSetupEnd

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el procesamiento del cluster terminó. Si el procesamiento de cluster no ha terminado aún, la propiedad tiene el valor de -1.

### performanceNodeTiming.clusterSetupStart

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el procesamiento del cluster comenzó. Si el procesamiento del cluster no ha comenzado, la propiedad tiene el valor de -1.

### performanceNodeTiming.loopExit

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el bucle del evento Node.js cerró. Si el bucle del evento aún no ha cerrado, la propiedad tiene el valor de -1. Solo no puede tener un valor de -1 en un manejador del evento [`'exit'`][].

### performanceNodeTiming.loopStart

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el bucle del evento Node.js comenzó. Si el bucle del evento no ha comenzado (p. e.j., en la primera señal del script principal), la propiedad tiene el valor de -1.

### performanceNodeTiming.moduleLoadEnd

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual la carga del módulo principal terminó.

### performanceNodeTiming.moduleLoadStart

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual la carga del módulo principal comenzó.

### performanceNodeTiming.nodeStart

<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el proceso Node.js fue iniciado.

### performanceNodeTiming.preloadModuleLoadEnd

<!-- YAML
added: v8.5.0
-->

* {number}

The high resolution millisecond timestamp at which preload module load ended.

### performanceNodeTiming.preloadModuleLoadStart

<!-- YAML
added: v8.5.0
-->

* {number}

The high resolution millisecond timestamp at which preload module load started.

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

## Class: PerformanceObserver

### new PerformanceObserver(callback)

<!-- YAML
added: v8.5.0
-->

* `callback` {Function} 
  * `list` {PerformanceObserverEntryList}
  * `observer` {PerformanceObserver}

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

The `callback` is invoked when a `PerformanceObserver` is notified about new `PerformanceEntry` instances. The callback receives a `PerformanceObserverEntryList` instance and a reference to the `PerformanceObserver`.

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
  * `entryTypes` {string[]} An array of strings identifying the types of `PerformanceEntry` instances the observer is interested in. If not provided an error will be thrown.
  * `buffered` {boolean} If true, the notification callback will be called using `setImmediate()` and multiple `PerformanceEntry` instance notifications will be buffered internally. If `false`, notifications will be immediate and synchronous. **Default:** `false`.

Subscribes the `PerformanceObserver` instance to notifications of new `PerformanceEntry` instances identified by `options.entryTypes`.

When `options.buffered` is `false`, the `callback` will be invoked once for every `PerformanceEntry` instance:

```js
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

const obs = new PerformanceObserver((list, observer) => {
  // called three times synchronously. list contains one item
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
  // called once. list contains three items
});
obs.observe({ entryTypes: ['mark'], buffered: true });

for (let n = 0; n < 3; n++)
  performance.mark(`test${n}`);
```

## Class: PerformanceObserverEntryList

<!-- YAML
added: v8.5.0
-->

The `PerformanceObserverEntryList` class is used to provide access to the `PerformanceEntry` instances passed to a `PerformanceObserver`.

### performanceObserverEntryList.getEntries()

<!-- YAML
added: v8.5.0
-->

* Returns: {PerformanceEntry[]}

Returns a list of `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime`.

### performanceObserverEntryList.getEntriesByName(name[, type])

<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `type` {string}
* Returns: {PerformanceEntry[]}

Returns a list of `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime` whose `performanceEntry.name` is equal to `name`, and optionally, whose `performanceEntry.entryType` is equal to `type`.

### performanceObserverEntryList.getEntriesByType(type)

<!-- YAML
added: v8.5.0
-->

* `type` {string}
* Returns: {PerformanceEntry[]}

Returns a list of `PerformanceEntry` objects in chronological order with respect to `performanceEntry.startTime` whose `performanceEntry.entryType` is equal to `type`.

## Examples

### Measuring the duration of async operations

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
  observer.disconnect();
});
obs.observe({ entryTypes: ['measure'], buffered: true });

setTimeout(() => {}, 1000);
```

### Measuring how long it takes to load dependencies

The following example measures the duration of `require()` operations to load dependencies:

<!-- eslint-disable no-global-assign -->

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
});
obs.observe({ entryTypes: ['function'], buffered: true });

require('some-module');
```