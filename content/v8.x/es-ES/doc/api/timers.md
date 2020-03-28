# Temporizadores

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `timer` expone una API global para la programación de llamadas a funciones en algún punto en el futuro. Debido a que las funciones de temporizadores son objetos globales, no hay necesidad de llamar a `require('timers')` para utilizar la API.

Las funciones de temporizadores dentro de Node.js implementan una API similar a la API de temporizadores provista por los Navegadores Web, pero estas utilizan una implementación interna distinta, construida alrededor del [Bucle de Eventos de Node.js](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick).

## Clase: Immediate

Este objeto es creado internamente y es devuelto por [`setImmediate()`][]. Puede ser pasado a [`clearImmediate()`][] para cancelar las acciones programadas.

## Clase: Timeout

Este objeto es creado internamente y devuelto por [`setTimeout()`][] y [`setInterval()`][]. Puede ser pasado a [`clearTimeout()`][] o [`clearInterval()`][] (respectivamente) para cancelar las acciones programadas.

Por defecto, cuando se programa un temporizador utilizando [`setTimeout()`][] o [`setInterval()`][], el bucle de eventos de Node.js continuará ejecutándose mientras dicho temporizador esté activo. Cada uno de los objetos de `Timeout` devuelto por estas funciones exporta, a su vez, las funciones `timeout.ref()` y `timeout.unref()`, las cuales pueden ser usadas para controlar este comportamiento predeterminado.

### timeout.ref()

<!-- YAML
added: v0.9.1
-->

Cuando es llamada, solicita que el bucle de eventos de Node.js *no* se detenga mientras que el `Timeout` se encuentre activo. Llamar a `timeout.ref()` múltiples veces no tendrá ningún efecto.

*Nota*: Por defecto, todos los objetos de `Timeout` son "ref'd" (referenciados), por lo que normalmente es innecesario llamar a `timeout.ref()`, a menos que `timeout.unref()` haya sido llamado previamente.

Devuelve una referencia al `Timeout`.

### timeout.unref()

<!-- YAML
added: v0.9.1
-->

Cuando es llamada, el objeto de `Timeout` no requerirá que el bucle de eventos de Node.js permanezca activo. Si no hay otras actividades que mantengan ejecutándose al bucle de eventos, el proceso puede finalizar antes de que la callback del objeto de `Timeout` sea invocada. Llamar múltiples veces a `timeout.unref()` no tendrá ningún efecto.

*Nota*: Llamar a `timeout.unref()` crea un temporizador interno que activará el bucle de eventos de Node.js. Crear muchos de estos, puede afectar de manera negativa el rendimiento de la aplicación de Node.js.

Devuelve una referencia al `Timeout`.

## Programación de Temporizadores

Un temporizador en Node.js es un constructo interno que llama a determinada función luego de que ha pasado un cierto tiempo. Cuando la función de un temporizador es llamada, la misma varía dependiendo de cuál fue el método utilizado para crear el temporizador y qué otros trabajos se encuentra realizando el bucle de eventos de Node.js.

### setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

* `callback` {Function} La función a ser llamada al final de la actual vuelta del [Bucle de Eventos de Node.js](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick).
* `...args` {any} Argumentos opcional a pasar cuando se llama al `callback`.

Schedules the "immediate" execution of the `callback` after I/O events' callbacks. Devuelve un `Immediate` para el uso con [`clearImmediate()`][].

Cuando se realizan múltiples llamadas a `setImmediate()`, las funciones `callback` son puestas en cola para ser ejecutadas en el orden en el que fueron creadas. Toda la cola de callbacks es procesada con cada iteración del bucle de eventos. Si un temporizador inmediato es puesto en la cola desde dentro de una callback en ejecución, dicho temporizador no se disparará hasta la siguiente iteración del bucle de eventos.

Si `callback` no es una función, se arrojará un [`TypeError`][].

*Note*: This method has a custom variant for promises that is available using [`util.promisify()`][]:

```js
const util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

setImmediatePromise('foobar').then((value) => {
  // valor === 'foobar' (el pasar valores es opcional)
  // Esto se ejecuta después de todos las callbacks I/O.
});

// o con una función asincrónica
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

* `callback` {Function} La función a ser llamada cuando el temporizador finalice su ejecución.
* `delay` {number} El número de milisegundos a esperar antes de llamar a la `callback`.
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.

Programa la ejecución repetida de `callback` cada `delay` (tantos) milisegundos. Devuelve un `Timeout` para el uso con [`clearInterval()`][].

Cuando `delay` sea mayor que `2147483647` o menor que `1`, el `delay` será establecido como `1`.

Si `callback` no es una función, se arrojará un [`TypeError`][].

### setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La función a llamar cuando el temporizador transcurre.
* `delay` {number} El número de milisegundos a esperar antes de llamar a la `callback`.
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.

Programa la ejecución de una `callback` de una sola ocasión tras `delay` milisegundos. Devuelve un `Timeout` para el uso con [`clearTimeout()`][].

Probablemente, la `callback` no será invocada en los exactos `delay` milisegundos que se especificó. Node.js no da garantías sobre el uso exacto del tiempo en cuanto a la activación de las callbacks, ni sobre su orden. La callback será llamada tan precisamente como sea posible, de acuerdo al tiempo especificado.

*Nota*: Cuando `delay` sea mayor que `2147483647` o menor que `1`, el `delay` será establecido como `1`.

Si `callback` no es una función, se arrojará un [`TypeError`][].

*Note*: This method has a custom variant for promises that is available using [`util.promisify()`][]:

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

### clearImmediate(immediate)

<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} Un objeto de `Immediate`, tal como es devuelto por [`setImmediate()`][].

Cancela un objeto `Immediate` creado por [`setImmediate()`][].

### clearInterval(timeout)

<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un objeto de `Timeout`, tal como es devuelto por [`setInterval()`][].

Cancela un objeto `Timeout` creado por [`setInterval()`][].

### clearTimeout(timeout)

<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un objeto de `Timeout`, tal como es devuelto por [`setTimeout()`][].

Cancela un objeto `Timeout` creado por [`setTimeout()`][].