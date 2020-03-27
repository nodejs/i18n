# Temporizadores

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `timer` expone una API global para la programación de llamadas a funciones en algún punto en el futuro. Debido a que las funciones de temporizadores son objetos globales, no hay necesidad de llamar a `require('timers')` para utilizar la API.

The timer functions within Node.js implement a similar API as the timers API provided by Web Browsers but use a different internal implementation that is built around the Node.js [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#setimmediate-vs-settimeout).

## Class: `Immediate`

Este objeto es creado internamente y es devuelto por [`setImmediate()`][]. Puede ser pasado a [`clearImmediate()`][] para cancelar las acciones programadas.

By default, when an immediate is scheduled, the Node.js event loop will continue running as long as the immediate is active. The `Immediate` object returned by [`setImmediate()`][] exports both `immediate.ref()` and `immediate.unref()` functions that can be used to control this default behavior.

### `immediate.hasRef()`
<!-- YAML
added: v11.0.0
-->

* Devuelve: {boolean}

If true, the `Immediate` object will keep the Node.js event loop active.

### `immediate.ref()`
<!-- YAML
added: v9.7.0
-->

* Retorna: {Immediate} una referencia a `immediate`

When called, requests that the Node.js event loop *not* exit so long as the `Immediate` is active. Calling `immediate.ref()` multiple times will have no effect.

By default, all `Immediate` objects are "ref'ed", making it normally unnecessary to call `immediate.ref()` unless `immediate.unref()` had been called previously.

### `immediate.unref()`
<!-- YAML
added: v9.7.0
-->

* Retorna: {Immediate} una referencia a `immediate`

When called, the active `Immediate` object will not require the Node.js event loop to remain active. If there is no other activity keeping the event loop running, the process may exit before the `Immediate` object's callback is invoked. Llamar a `immediate.unref()` multiples veces, no tendrá efecto.

## Class: `Timeout`

Este objeto es creado internamente y devuelto por [`setTimeout()`][] y [`setInterval()`][]. It can be passed to either [`clearTimeout()`][] or [`clearInterval()`][] in order to cancel the scheduled actions.

Por defecto, cuando se programa un temporizador utilizando [`setTimeout()`][] o [`setInterval()`][], el bucle de eventos de Node.js continuará ejecutándose mientras dicho temporizador esté activo. Cada uno de los objetos de `Timeout` devuelto por estas funciones exporta, a su vez, las funciones `timeout.ref()` y `timeout.unref()`, las cuales pueden ser usadas para controlar este comportamiento predeterminado.

### `timeout.hasRef()`
<!-- YAML
added: v11.0.0
-->

* Devuelve: {boolean}

If true, the `Timeout` object will keep the Node.js event loop active.

### `timeout.ref()`
<!-- YAML
added: v0.9.1
-->

* Retorna: {Timeout} una referencia a `timeout`

When called, requests that the Node.js event loop *not* exit so long as the `Timeout` is active. Llamar múltiples veces a `timeout.ref()` no tendrá ningún efecto.

By default, all `Timeout` objects are "ref'ed", making it normally unnecessary to call `timeout.ref()` unless `timeout.unref()` had been called previously.

### `timeout.refresh()`
<!-- YAML
added: v10.2.0
-->

* Retorna: {Timeout} una referencia a `timeout`

Sets the timer's start time to the current time, and reschedules the timer to call its callback at the previously specified duration adjusted to the current time. This is useful for refreshing a timer without allocating a new JavaScript object.

Using this on a timer that has already called its callback will reactivate the timer.

### `timeout.unref()`
<!-- YAML
added: v0.9.1
-->

* Retorna: {Timeout} una referencia a `timeout`

Cuando es llamada, el objeto de `Timeout` no requerirá que el bucle de eventos de Node.js permanezca activo. Si no hay otras actividades que mantengan ejecutándose al bucle de eventos, el proceso puede finalizar antes de que la callback del objeto de `Timeout` sea invocada. Llamar múltiples veces a `timeout.unref()` no tendrá ningún efecto.

Calling `timeout.unref()` creates an internal timer that will wake the Node.js event loop. Crear muchos de estos, puede afectar de manera negativa el rendimiento de la aplicación de Node.js.

## Programación de Temporizadores

Un temporizador en Node.js es un constructo interno que llama a determinada función luego de que ha pasado un cierto tiempo. Cuando la función de un temporizador es llamada, la misma varía dependiendo de cuál fue el método utilizado para crear el temporizador y qué otros trabajos se encuentra realizando el bucle de eventos de Node.js.

### `setImmediate(callback[, ...args])`
<!-- YAML
added: v0.9.1
-->

* `callback` {Function} The function to call at the end of this turn of the Node.js [Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/#setimmediate-vs-settimeout)
* `...args` {any} Argumentos opcionales a ser pasados cuando la `callback` sea llamada.
* Devuelve: {Immediate} para el uso con [`clearImmediate()`][]

Schedules the "immediate" execution of the `callback` after I/O events' callbacks.

Cuando se realizan múltiples llamadas a `setImmediate()`, las funciones `callback` son puestas en cola para ser ejecutadas en el orden en el que fueron creadas. Toda la cola de callbacks es procesada con cada iteración del bucle de eventos. Si un temporizador inmediato es puesto en la cola desde dentro de una callback en ejecución, dicho temporizador no se disparará hasta la siguiente iteración del bucle de eventos.

Si `callback` no es una función, se arrojará un [`TypeError`][].

This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

setImmediatePromise('foobar').then((value) => {
  // valor === 'foobar' (el pasar valores es opcional)
  // Esto se ejecuta después de todos las callbacks I/O.
});

// Or with async function
async function timerExample() {
  console.log('Before I/O callbacks');
  await setImmediatePromise();
  console.log('After I/O callbacks');
}
timerExample();
```

### `setInterval(callback, delay[, ...args])`
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La función a ser llamada cuando el temporizador finalice su ejecución.
* `delay` {number} El número de milisegundos a esperar antes de llamar a la `callback`.
* `...args` {any} Argumentos opcionales a ser pasados cuando la `callback` sea llamada.
* Devuelve: {Timeout} para el uso con [`clearInterval()`][]

Programa la ejecución repetida de `callback` cada `delay` (tantos) milisegundos.

Cuando `delay` sea mayor que `2147483647` o menor que `1`, el `delay` será establecido como `1`. Non-integer delays are truncated to an integer.

Si `callback` no es una función, se arrojará un [`TypeError`][].

### `setTimeout(callback, delay[, ...args])`
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La función a ser llamada cuando el temporizador finalice su ejecución.
* `delay` {number} El número de milisegundos a esperar antes de llamar a la `callback`.
* `...args` {any} Argumentos opcionales a ser pasados cuando la `callback` sea llamada.
* Devuelve: {Timeout} para el uso con [`clearTimeout()`][]

Programa la ejecución de una `callback` de una sola ocasión tras `delay` milisegundos.

Probablemente, la `callback` no será invocada en los exactos `delay` milisegundos que se especificó. Node.js no da garantías sobre el uso exacto del tiempo en cuanto a la activación de las callbacks, ni sobre su orden. La callback será llamada tan precisamente como sea posible, de acuerdo al tiempo especificado.

When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`. Non-integer delays are truncated to an integer.

Si `callback` no es una función, se arrojará un [`TypeError`][].

This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(40, 'foobar').then((value) => {
  // valor === 'foobar' (el pasar valores es opcional)
  // Esto se ejecuta después de alrededor de 40 milisegundos.
});
```

## Cancelación de Temporizadores

Los métodos [`setImmediate()`][], [`setInterval()`][] y [`setTimeout()`][] devuelven objetos que representan los temporizadores programados. Estos pueden ser utilizados para cancelar el temporizador y evitar que se dispare.

It is not possible to cancel timers that were created using the promisified variants of [`setImmediate()`][], [`setTimeout()`][].

### `clearImmediate(immediate)`
<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} Un objeto de `Immediate`, tal como es devuelto por [`setImmediate()`][].

Cancela un objeto `Immediate` creado por [`setImmediate()`][].

### `clearInterval(timeout)`
<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un objeto de `Timeout`, tal como es devuelto por [`setInterval()`][].

Cancela un objeto de `Timeout` creado por [`setInterval()`][].

### `clearTimeout(timeout)`
<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un objeto de `Timeout`, tal como es devuelto por [`setTimeout()`][].

Cancela un objeto de `Timeout` creado por [`setTimeout()`][].
