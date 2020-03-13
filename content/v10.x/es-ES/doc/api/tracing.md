# Seguimiento de Eventos

<!--introduced_in=v7.7.0-->

> Estabilidad: 1 - Experimental

El Seguimiento de Eventos provee un mecanismo para centralizar el seguimiento de la información generado por la versión V8 del núcleo Node.js, y el código de espacio de usuario.

El seguimiento puede ser habilitado con la bandera de línea de comandos `--trace-event-categories` o al usar el módulo `trace_events`. La bandera de `--trace-event-categories` acepta una lista de nombres de categorías separados por comas.

Las categorías disponibles son:

* `node` - Un marcador de posición vacío.
* `node.async_hooks` - Permite la captura de rastros de datos detallados [`async_hooks`]. Los eventos [`async_hooks`] tienen un único `asyncId`y una propiedad `triggerAsyncId` `triggerId` especial.
* `node.bootstrap` - Permite la captura de los hitos bootstrap de Node.js.
* `node.fs.sync` - Permite la captura de datos de seguimientos para métodos de sincronización de archivos del sistema.
* `node.perf` - Enables capture of [Performance API](perf_hooks.html) measurements.
  * `node.perf.usertiming` - Permite la captura de solamente mediciones y marcas del rendimiento del API cronometrado por el usuario.
  * `node.perf.timerify` - Permite la captura de solamente mediciones API de la función timerify.
* `node.promises.rejections` - Enables capture of trace data tracking the number of unhandled Promise rejections and handled-after-rejections.
* `node.vm.script` - Enables capture of trace data for the `vm` module's `runInNewContext()`, `runInContext()`, and `runInThisContext()` methods.
* `v8` - The [V8](v8.html) son eventos recolectores de basura, compilan, y están relacionados con la ejecución.

Por defecto están activas las categorías `node`, `node.async_hooks`, y `v8`.

```txt
node --trace-event-categories v8,node,node.async_hooks server.js
```

Versiones anteriores de Node.js requerían del uso de la bandera `--trace-events-enabled` para permitir eventos de seguimiento. Este requisito ha sido removido. Sin embargo `--trace-events-enabled` flag *may* son aún usados y permiten las categorías`node`, `node.async_hooks`, y `v8` de forma predeterminada.

```txt
node --trace-events-enabled

// es equivalente a

node --trace-event-categories v8,node,node.async_hooks
```

Alternamente, los eventos de seguimiento pueden ser permitidos utilizando el módulo `trace_events`:

```js
const trace_events = require('trace_events');
const tracing = trace_events.createTracing({ categories: ['node.perf'] });
tracing.enable();  // Activa la captura de eventos de seguimiento para la categoría 'node.perf'

// realiza trabajo

tracing.disable();  // Desactiva la captura de eventos para la categoría 'node.perf'
```

Ejecutar Node.js con seguimiento habilitado producirá archivos de registro que pueden ser abiertos en la ventana de Chrome [`chrome://tracing`](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool).

El archivo de registro es llamado por defecto `node_trace.${rotation}.log`, donde `${rotation}` es una id ascendiente de la rotación de registros. El patrón de ruta de archivos puede ser específicado con `--trace-event-file-pattern` que acepte una plantilla de string que soporte `${rotation}` y `${pid}`:

```txt
node --trace-event-categories v8 --trace-event-file-pattern '${pid}-${rotation}.log' server.js
```

Empezando con Node.Js 10.0.0, el sistema de seguimiento utiliza las mismas fuentes de tiempo como las usadas por `process.hrtime()` sin embargo las marcas de tiempo son expresadas en microsegundos, a diferencia de `process.hrtime()` que devuelve nanosegundos.

## El módulo `trace_events`
<!-- YAML
added: v10.0.0
-->

### Objeto de `seguimiento`
<!-- YAML
added: v10.0.0
-->

El objeto de `seguimiento` es usado para habilitar o deshabilitar el seguimiento para conjuntos de categorías. Las instancias son creadas usando el método `trace_events.createTracing()`.

Cuando es creado, el objeto de `seguimiento` está deshabilitado. Llamar al método `tracing.enable()` añade categorías al conjunto de categorías de seguimiento de eventos. Llamar a `tracing.disable()` removerá las categorías del conjunto de categorías de seguimiento de eventos habilitadas.

#### `tracing.categories`
<!-- YAML
added: v10.0.0
-->

* {string}

Una lista separada por comas de categorías de seguimiento de eventos cubiertas por el objeto `Tracing`.

#### `tracing.disable()`
<!-- YAML
added: v10.0.0
-->

Deshabilita el objeto `Tracing`.

Only trace event categories *not* covered by other enabled `Tracing` objects and *not* specified by the `--trace-event-categories` flag will be disabled.

```js
const trace_events = require('trace_events');
const t1 = trace_events.createTracing({ categories: ['node', 'v8'] });
const t2 = trace_events.createTracing({ categories: ['node.perf', 'node'] });
t1.enable();
t2.enable();

// Imprime 'node,node.perf,v8'
console.log(trace_events.getEnabledCategories());

t2.disable(); // Solo deshabilita la emisión de eventos para la categoría 'node.perf'

// Imprime 'node,v8'
console.log(trace_events.getEnabledCategories());
```

#### `tracing.enable()`
<!-- YAML
added: v10.0.0
-->

Habilita a este objeto de `Tracing` para el conjunto de categorías cubiertos por el objeto `Tracing`.

#### `tracing.enabled`
<!-- YAML
added: v10.0.0
-->

* {boolean} `true` solo si el objeto `Tracing` ha sido habilitado.

### `trace_events.createTracing(options)`
<!-- YAML
added: v10.0.0
-->

* `opciones` {Object}
  * `categories` {string[]} Un conjunto de nombres de categorías de seguimiento. Los valores incluidos en el conjuntos son forzados a un string cuando sea posible. Un error saldrá cuando el valor no pueda ser forzado.
* Devuelve: {Tracing}

Crea y devuelve un objeto `Tracing` para el conjunto de `categories` dado.

```js
const trace_events = require('trace_events');
const categories = ['node.perf', 'node.async_hooks'];
const tracing = trace_events.createTracing({ categories });
tracing.enable();
// do stuff
tracing.disable();
```

### `trace_events.getEnabledCategories()`
<!-- YAML
added: v10.0.0
-->

* Devuelve: {string}

Devuelve una lista separada por comas de todas las categorías de seguimiento de eventos actualmente habilitadas. El actual conjunto de categorías de seguimiento de eventos habilitados está determinado por la *unión* de todos los objetos `Tracing` actualmente habilitados y cualquier categoría habilitada utilizando la bandera de `--trace-event-categories`.

Dado el archivo `test.js` inferior, el comando `node --trace-event-categories node.perf test.js` imprimirá `'node.async_hooks,node.perf'` a la consola.

```js
const trace_events = require('trace_events');
const t1 = trace_events.createTracing({ categories: ['node.async_hooks'] });
const t2 = trace_events.createTracing({ categories: ['node.perf'] });
const t3 = trace_events.createTracing({ categories: ['v8'] });

t1.enable();
t2.enable();

console.log(trace_events.getEnabledCategories());
```
