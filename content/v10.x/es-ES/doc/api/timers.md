# Temporizadores

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `timer` expone una API global para la programación de funciones que podrán ser llamadas en algún período futuro de tiempo. Debido a que las funciones de temporizadores son globales, no es necesario llamar a `require('timers')` para utilizar la API.

Las funciones temporizadoras incluidas en Node.js, implementan una API similiar a la API disponible en los navegadores WEB, pero cambia la implementación interna, ya que esta está basada en el [Event Loop de Node.js](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick).

## Clase: Immediete

Este objeto se crea internamente y se retorna desde [`setImmediate()`][]. Se puede pasar a [`clearImmediate()`][] con el fin de cancelar las acciones programadas.

Por defecto, cuando una immediate es asignada, el Event Loop de Node.js seguirá corriendo mientras la immediate permanezca activa. El objeto immediate, retornado por [`setImmediate()`][] contiene las funciones `immediate.ref()` y `immediate.unref()` que pueden ser utilizadas para controlar el comportamiento predeterminado de este.

### immediate.ref()

<!-- YAML
added: v9.7.0
-->

* Retorna: {Immediate} una referencia a `immediate`

Cuando esta función es llamada, se solicita que el Event Loop de Node.js *no* se detenga mientras la `Immediate` permanezca activa. Llamar a `immediate.ref()` multiples veces, no tendrá efecto.

De forma predeterminada, todos los objetos de `inmediato` son "ref'ed", lo que es normalmente innecesario llamar `immediate.ref()` a menos que `immediate.unref()` haya sido llamado previamente.

### immediate.unref()

<!-- YAML
added: v9.7.0
-->

* Retorna: {Immediate} una referencia a `immediate`

Cuando se llama, el objeto `immediate` activo no requerirá del Event Loop de Node.js para permanecer activo. Si no hay ninguna otra actividad manteniendo al Event Loop corriendo, el proceso podría salir antes de que se invoque el método callback del objeto `immediate`. Llamar a `immediate.unref()` multiples veces, no tendrá efecto.

## Clase: Timeout

Este objeto se crea internamente y se retorna desde [`setImmediate()`][]. Se puede pasar a [`clearTimeout()`] [] o [[`clearInterval()`]] con el fin de cancelar las acciones programadas.

Por defecto, cuando un temporizador es usado mediante [[`setTimeout()`]] o [[`setInterval()`]], el Event Loop de Node.js seguirá funcionando mientras el temporizador esté activo. Cada uno de los objetos `Timeout` returnados por estas funciones, contienen los métodos `timeout.ref()` y `timeout.unref()` que pueden ser utilizados para controlar el comportamiento predeterminado de este.

### timeout.ref()

<!-- YAML
added: v0.9.1
-->

* Retorna: {Timeout} una referencia a `timeout`

Cuando esta función es llamada, se solicita que el Event Loop de Node.js *no* se detenga mientras la `Timeout` permanezca activa. Llamar a `timeout.ref()` multiples veces, no tendrá efecto.

De forma predeterminada, todos los objetos de `Tiemout` son "ref'ed", lo que es normalmente innecesario llamar `timeout.ref()` a menos que `timeout.unref()` haya sido llamado previamente.

### timeout.unref()

<!-- YAML
added: v0.9.1
-->

* Retorna: {Timeout} una referencia a `timeout`

Cuando se llama, el objeto `Timeout` activo no requerirá del Event Loop de Node.js para permanecer activo. Si no hay ninguna otra actividad manteniendo al Event Loop corriendo, el proceso podría salir antes de que se invoque el método callback del objeto `Timeout`. Llamar a `timeout.ref()` multiples veces, no tendrá efecto.

Llamar a `timeout.unref()` crea un contador interno que activará el Event Loop de Node.js. Crear demasiados objetos, puede impactar negativamente en la performance de la aplicación de Node.js.

## Programación de Temporizadores

Un temporizador en Node.js es un constructor interno que llama a una función dada después de cierto periodo de tiempo. Cuando se llama a una función del temporizador, varía dependiendo de cuál método fue utilizado para crear el temporizador y qué otros trabajo está haciendo el bucle de evento de Node.js.

### setImmediate(callback[, ...args])

<!-- YAML
added: v0.9.1
-->

* `callback` {Function} La función para llamar al final de este turno del [Bucle de Evento de Node.js](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.
* Devuelve: {Immediate} para el uso con [`clearImmediate()`][]

Programa la ejecución "inmediata" del `callback` después de los callbacks de los eventos I/O.

Cuando se hacen múltiples llamadas a `setImmediate()`, las funciones `callback` son puestas en cola de ejecución en el orden en el cual son creados. La cola completa del callback es procesada cada iteración del bucle del evento. Si se pone en cola un temporizador inmediato desde dentro de un callback en ejecución, ese temporizador no será activado hasta la siguiente iteración del bucle del evento.

Si `callback` no es una función, se arrojará un [`TypeError`][].

Este método tiene una variante personalizada para promesas que está disponible utilizando [`util.promisify()`][]:

```js
const util = require('util');
const setImmediatePromise = util.promisify(setImmediate);

setImmediatePromise('foobar').then((value) => {
  // value === 'foobar' (passing values is optional)
  // This is executed after all I/O callbacks.
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

* `callback` {Function} The function to call when the timer elapses.
* `delay` {number} The number of milliseconds to wait before calling the `callback`.
* `...args` {any} Optional arguments to pass when the `callback` is called.
* Returns: {Timeout} for use with [`clearInterval()`][]

Schedules repeated execution of `callback` every `delay` milliseconds.

When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

If `callback` is not a function, a [`TypeError`][] will be thrown.

### setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

* `callback` {Function} The function to call when the timer elapses.
* `delay` {number} The number of milliseconds to wait before calling the `callback`.
* `...args` {any} Optional arguments to pass when the `callback` is called.
* Returns: {Timeout} for use with [`clearTimeout()`][]

Schedules execution of a one-time `callback` after `delay` milliseconds.

The `callback` will likely not be invoked in precisely `delay` milliseconds. Node.js makes no guarantees about the exact timing of when callbacks will fire, nor of their ordering. The callback will be called as close as possible to the time specified.

When `delay` is larger than `2147483647` or less than `1`, the `delay` will be set to `1`.

If `callback` is not a function, a [`TypeError`][] will be thrown.

Este método tiene una variante personalizada para promesas que está disponible utilizando [`util.promisify()`][]:

```js
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(40, 'foobar').then((value) => {
  // value === 'foobar' (passing values is optional)
  // This is executed after about 40 milliseconds.
});
```

## Cancelling Timers

The [`setImmediate()`][], [`setInterval()`][], and [`setTimeout()`][] methods each return objects that represent the scheduled timers. These can be used to cancel the timer and prevent it from triggering.

It is not possible to cancel timers that were created using the promisified variants of [`setImmediate()`][], [`setTimeout()`][].

### clearImmediate(immediate)

<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} An `Immediate` object as returned by [`setImmediate()`][].

Cancels an `Immediate` object created by [`setImmediate()`][].

### clearInterval(timeout)

<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} A `Timeout` object as returned by [`setInterval()`][].

Cancels a `Timeout` object created by [`setInterval()`][].

### clearTimeout(timeout)

<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} A `Timeout` object as returned by [`setTimeout()`][].

Cancels a `Timeout` object created by [`setTimeout()`][].