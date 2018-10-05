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

Programa la ejecución "inmediata" de la `callback` después de las callbacks de los eventos I/O.

Cuando se hacen múltiples llamadas a `setImmediate()`, las funciones `callback` son puestas en cola de ejecución en el orden en el cual son creados. La cola completa de la callback es procesada cada iteración del bucle del evento. Si se pone en cola un temporizador inmediato desde dentro de una callback en ejecución, ese temporizador no será activado hasta la siguiente iteración del bucle del evento.

Si `callback` no es una función, se arrojará un [`TypeError`][].

Este método tiene una variante personalizada para promesas que está disponible utilizando [`util.promisify()`][]:

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

* `callback` {Function} La función a llamar cuando el temporizador transcurre.
* `delay` {number} El número de milisegundos a esperar antes de llamar al `callback`.
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.
* Devuelve: {Timeout} para el uso con [`clearInterval()`][]

Schedules repeated execution of `callback` every `delay` milliseconds.

Cuando `delay` es mayor que `2147483647` o menor que `1`, el `delay` será establecido a `1`.

Si `callback` no es una función, se arrojará un [`TypeError`][].

### setTimeout(callback, delay[, ...args])

<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La función a llamar cuando el temporizador transcurre.
* `delay` {number} El número de milisegundos a esperar antes de llamar al `callback`.
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.
* Devuelve: {Timeout} para el uso con [`clearTimeout()`][]

Schedules execution of a one-time `callback` after `delay` milliseconds.

The `callback` will likely not be invoked in precisely `delay` milliseconds. Node.js makes no guarantees about the exact timing of when callbacks will fire, nor of their ordering. La callback será llamada lo más cercano posible al tiempo especificado.

Cuando `delay` es mayor que `2147483647` o menor que `1`, el `delay` será establecido a `1`.

Si `callback` no es una función, se arrojará un [`TypeError`][].

Este método tiene una variante personalizada para promesas que está disponible utilizando [`util.promisify()`][]:

```js
const util = require('util');
const setTimeoutPromise = util.promisify(setTimeout);

setTimeoutPromise(40, 'foobar').then((value) => {
  // valor === 'foobar' (el pasar valores es opcional)
  // Esto se ejecuta después de alrededor de 40 milisegundos.
});
```

## Cancelación de Temporizadores

Cada uno de los métodos [`setImmediate()`][], [`setInterval()`][] y [`setTimeout()`][] devuelve objetos que representan los temporizadores programados. Estos pueden usarse para cancelar el temporizador y prevenir que se desencadene.

Si no es posible cancelar los temporizadores que fueron creados utilizando las variantes prometidas de [`setImmediate()`][], [`setTimeout()`][].

### clearImmediate(immediate)

<!-- YAML
added: v0.9.1
-->

* `immediate` {Immediate} Un objeto `Immediate` tal como lo devolvió [`setImmediate()`][].

Cancela un objeto `Immediate` creado por [`setImmediate()`][].

### clearInterval(timeout)

<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un objeto `Timeout` tal como lo devolvió [`setInterval()`][].

Cancela un objeto `Timeout` creado por [`setInterval()`][].

### clearTimeout(timeout)

<!-- YAML
added: v0.0.1
-->

* `timeout` {Timeout} Un objeto `Timeout` tal como lo devolvió [`setTimeout()`][].

Cancela un objeto `Timeout` creado por [`setTimeout()`][].