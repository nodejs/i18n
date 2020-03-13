# Temporizadores

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

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

Cuando esta función es llamada, se solicita que el Event Loop de Node.js *no* se detenga mientras la `Timeout` permanezca activa. Llamar a `timeout.ref()` multiples veces, no tendrá efecto.

*Nota*: Por defecto, todos los objetos de `Timeout` son "ref'd" (referenciados), por lo que normalmente es innecesario llamar a `timeout.ref()`, a menos que `timeout.unref()` haya sido llamado previamente.

Devuelve una referencia al `Timeout`.

### timeout.unref()
<!-- YAML
added: v0.9.1
-->

Cuando se llama, el objeto `Timeout` activo no requerirá del Event Loop de Node.js para permanecer activo. Si no hay ninguna otra actividad manteniendo al Event Loop corriendo, el proceso podría salir antes de que se invoque el método callback del objeto `Timeout`. Llamar a `timeout.ref()` multiples veces, no tendrá efecto.

*Nota*: Llamar a `timeout.unref()` crea un temporizador interno que activará el bucle de eventos de Node.js. Crear demasiados objetos, puede impactar negativamente en la performance de la aplicación de Node.js.

Devuelve una referencia al `Timeout`.

## Programación de Temporizadores

Un temporizador en Node.js es un constructor interno que llama a una función dada después de cierto periodo de tiempo. Cuando se llama a una función del temporizador, varía dependiendo de cuál método fue utilizado para crear el temporizador y qué otros trabajo está haciendo el bucle de evento de Node.js.

### setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

* `callback` {Function} La función para llamar al final de este turno del [Bucle de Evento de Node.js](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick)
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.

Programa la ejecución "inmediata" de la `callback` después de las callbacks de los eventos I/O. Devuelve un `Immediate` para el uso con [`clearImmediate()`][].

Cuando se hacen múltiples llamadas a `setImmediate()`, las funciones `callback` son puestas en cola de ejecución en el orden en el cual son creados. La cola completa de la callback es procesada cada iteración del bucle del evento. Si se pone en cola un temporizador inmediato desde dentro de una callback en ejecución, ese temporizador no será activado hasta la siguiente iteración del bucle del evento.

Si `callback` no es una función, se arrojará un [`TypeError`][].

*Nota*: Este método tiene una variante personalizada para promesas que está disponible utilizando [`util.promisify()`][]:

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
* `delay` {number} El número de milisegundos a esperar antes de llamar al `callback`.
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.

Programa la ejecución repetida de `callback` cada `delay` (tantos) milisegundos. Devuelve un `Timeout` para el uso con [`clearInterval()`][].

Cuando `delay` es mayor que `2147483647` o menor que `1`, el `delay` será establecido a `1`.

Si `callback` no es una función, se arrojará un [`TypeError`][].

### setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

* `callback` {Function} La función a llamar cuando el temporizador transcurre.
* `delay` {number} El número de milisegundos a esperar antes de llamar al `callback`.
* `...args` {any} Argumentos opcionales a pasar cuando se llama al `callback`.

Programa la ejecución de una `callback` de una sola ocasión tras `delay` milisegundos. Devuelve un `Timeout` para el uso con [`clearTimeout()`][].

Probablemente, la `callback` no será invocada en los exactos `delay` milisegundos que se especificó. Node.js no garantiza el momento exacto de cuándo los callbacks se activarán, ni de su orden. La callback será llamada lo más cercano posible al tiempo especificado.

*Nota*: Cuando `delay` es mayor que `2147483647` o menor que `1`, el `delay` será establecido a `1`.

Si `callback` no es una función, se arrojará un [`TypeError`][].

*Nota*: Este método tiene una variante personalizada para promesas que está disponible utilizando [`util.promisify()`][]:

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
