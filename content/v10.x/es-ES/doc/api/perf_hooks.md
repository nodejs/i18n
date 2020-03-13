# API de Timing de Rendimiento

<!--introduced_in=v8.5.0-->

> Estabilidad: 1 - Experimental

La API de Timing de Rendimiento proporciona una implementación de la especificación de la [Línea de Tiempo de Rendimiento de W3C](https://w3c.github.io/performance-timeline/). El propósito de la API es apoyar la colección de métricas de rendimiento de alta resolución. Esta es la misma API de rendimiento implementada en los navegadores Web modernos.

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

Si `name` no es proporcionado, esto elimina todos los objetos `PerformanceMark` de la Línea de Tiempo de Rendimiento. Si se proporciona `name`, esto elimina solo la marca nombrada.

### performance.mark([name])
<!-- YAML
added: v8.5.0
-->

* `name` {string}

Crea una nueva entrada `PerformanceMark` en la Línea de Tiempo de Rendimiento. `PerformanceMark` es una subclase de `PerformanceEntry` cuya `performanceEntry.entryType` siempre es `'mark'`, y cuya `performanceEntry.duration` es siempre `0`. Las marcas de rendimiento son usadas para marcar momentos específicos significativos en la Línea de Tiempo de Rendimiento.

### performance.measure(name, startMark, endMark)
<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `startMark` {string}
* `endMark` {string}

Crea una nueva entrada `PerformanceMeasure` en la Línea de Tiempo de Rendimiento. `PerformanceMeasure` es una subclase de `PerformanceEntry`, cuya `performanceEntry.entryType` siempre es `'measure'`, y cuya `performanceEntry.duration` mide el número de milisegundos transcurridos desde `startMark` y `endMark`.

The `startMark` argument may identify any *existing* `PerformanceMark` in the Performance Timeline, or *may* identify any of the timestamp properties provided by the `PerformanceNodeTiming` class. Si el nombre `startMark` no existe, entonces `startMark` es establecido como [`timeOrigin`][] por defecto.

El argumento `endMark` debe especificar cualquier `PerformanceMark` *existente* en la Línea de Tiempo de Rendimiento o cualquiera de las propiedades timestamp proporcionadas por la clase `PerformanceNodeTiming`. Si el nombre `endMark` no existe, se producirá un error.

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

Envuelve una función dentro de una nueva función que mide el tiempo de ejecución de la función envuelta. Un `PerformanceObserver` debe ser suscrito al tipo de evento `'function'` para que los detalles de timing puedan ser accedidos.

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

## Clase: PerformanceNodeTiming extiende PerformanceEntry
<!-- YAML
added: v8.5.0
-->

Proporciona detalles de timing para el propio Node.js.

### performanceNodeTiming.bootstrapComplete
<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el proceso de Node.js completó el bootstrapping. Si el bootstrapping no ha terminado aún, la propiedad tiene el valor de -1.

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

### performanceNodeTiming.nodeStart
<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual el proceso Node.js fue iniciado.

### performanceNodeTiming.v8Start
<!-- YAML
added: v8.5.0
-->

* {number}

La timestamp de alta resolución en milisegundos en la cual la plataforma V8 fue iniciada.

## Clase: PerformanceObserver

### nuevo PerformanceObserver(callback)
<!-- YAML
added: v8.5.0
-->

* `callback` {Function}
  * `list` {PerformanceObserverEntryList}
  * `observer` {PerformanceObserver}

Los objetos `PerformanceObserver` proporcionan notificaciones cuando nuevas instancias `PerformanceEntry` han sido añadidas al Tiempo de Rendimiento.

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
Debido a que las instancias `PerformanceObserver` introducen su propia sobrecarga de rendimiento adicional, las instancias no deben quedar suscritas a las notificaciones indefinidamente. Los usuarios deben desconectar los observadores tan pronto como no sean necesitados.

El `callback` es invocado cuando un `PerformanceObserver` es notificado sobre nuevas instancias de `PerformanceEntry`. El callback recibe una instancia `PerformanceObserverEntryList` y una referencia al `PerformanceObserver`.

### performanceObserver.disconnect()
<!-- YAML
added: v8.5.0
-->
Desconecta la instancia 

`PerformanceObserver` de todas las notificaciones.

### performanceObserver.observe(options)
<!-- YAML
added: v8.5.0
-->
* `opciones` {Object}
  * `entryTypes` {string[]} Un array de strings identificando los tipos de instancias `PerformanceEntry` en las que está interesado el observador. Si no es proporcionado, se produce un error.
  * `buffered` {boolean} Si es true, la notificación del callback será llamada usando `setImmediate()` y múltiples notificaciones de instancia `PerformanceEntry` serán almacenadas internamente. Si es `false`, las notificaciones serán inmediatas y sincrónicas. **Predeterminado:** `false`.

Suscribe la instancia `PerformanceObserver` a las notificaciones de nuevas instancias `PerformanceEntry`, identificadas por `options.entryTypes`.

Cuando `options.buffered` es `false`, el `callback` será invocado una vez por cada instancia `PerformanceEntry`:

```js
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');

const obs = new PerformanceObserver((list, observer) => {
  // llamado tres veces de forma síncrona. la lista contiene un elemento
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
  // llamado una vez. la lista contiene tres elementos
});
obs.observe({ entryTypes: ['mark'], buffered: true });

for (let n = 0; n < 3; n++)
  performance.mark(`test${n}`);
```

## Clase: PerformanceObserverEntryList
<!-- YAML
added: v8.5.0
-->

La clase `PerformanceObserverEntryList` es usada para proporcionar acceso a las instancias `PerformanceEntry` pasadas a un `PerformanceObserver`.

### performanceObserverEntryList.getEntries()
<!-- YAML
added: v8.5.0
-->

* Devuelve: {PerformanceEntry[]}

Devuelve una lista de objetos `PerformanceEntry` en orden cronológico con respeto a `performanceEntry.startTime`.

### performanceObserverEntryList.getEntriesByName(name[, type])
<!-- YAML
added: v8.5.0
-->

* `name` {string}
* `type` {string}
* Devuelve: {PerformanceEntry[]}

Devuelve una lista de objetos `PerformanceEntry` en orden cronológico con respeto a `performanceEntry.startTime`, cuyo `performanceEntry.name` es igual a `name`, y opcionalmente, cuyo `performanceEntry.entryType` es igual a `type`.

### performanceObserverEntryList.getEntriesByType(type)
<!-- YAML
added: v8.5.0
-->

* `type` {string}
* Devuelve: {PerformanceEntry[]}

Devuelve una lista de objetos `PerformanceEntry` en orden cronológico con respeto a `performanceEntry.startTime`, cuyo `performanceEntry.entryType` es igual a `type`.

## Ejemplos

### Medir la duración de las operaciones asincrónicas

El siguiente ejemplo usa el [Async Hooks](async_hooks.html) y las APIs de Rendimiento para medir la verdadera duración de una operación Timeout (incluyendo la cantidad de tiempo para ejecutar el callback).

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

### Medir cuánto tiempo tarda la carga de dependencias

El siguiente ejemplo mide la duración de las operaciones `require()` para cargar las dependencias:
```js
'use strict';
const {
  performance,
  PerformanceObserver
} = require('perf_hooks');
const mod = require('module');

// Monkey patch que requiere función
mod.Module.prototype.require =
  performance.timerify(mod.Module.prototype.require);
require = performance.timerify(require);

// Activar el observer
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
