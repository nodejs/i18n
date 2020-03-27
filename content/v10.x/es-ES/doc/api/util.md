# Util

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `util` está diseñado principalmente para soportar las necesidades de las APIs internas de Node.js. Sin embargo, muchas de las utilidades también son útiles para desarrolladores de aplicaciones y módulos. Se puede acceder a él utilizando:

```js
const util = require('util');
```

## util.callbackify(original)
<!-- YAML
added: v8.2.0
-->

* `original` {Function} Una función `async`
* Retorna: {Function} una función de estilo callback

Toma una función `async` (o una función que retorna una `Promise`) y retorna una función siguiendo el estilo de callback error-first, p. ej. tomando un callback `(err, value) => ...` como el último argumento. En el callback, el primer argumento va a ser la razón de rechazo (o `null` si la `Promise` se resolvió), y el segundo argumento va a ser el valor resuelto.

```js
const util = require('util');

async function fn() {
  return 'hello world';
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  if (err) throw err;
  console.log(ret);
});
```

Imprimirá:

```txt
hello world
```

El callback es ejecutado asincrónicamente, y va a tener un stack trace limitado. Si el callback arroja, el proceso va a emitir un evento [`'uncaughtException'`][], y si no es gestionado, saldrá.

Ya que `null` tiene un significado especial como el primer argumento para un callback, si una función envuelta rechaza una `Promise` con un valor falso como motivo, el valor es envuelto en un `Error` con el valor original almacenado en un campo llamado `reason`.

```js
function fn() {
  return Promise.reject(null);
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  // Cuando la Promise fue rechazada con `null` se envuelve con un Error y
  // el valor original es almacenado en `reason`.
  err && err.hasOwnProperty('reason') && err.reason === null;  // true
});
```

## util.debuglog(section)
<!-- YAML
added: v0.11.3
-->

* `section` {string} Un string identificando la porción de la aplicación para la cual la función `debuglog` está siendo creada.
* Retorna: {Function} La función de registro

El método `util.debuglog()` es utilizado para crear una función que condicionalmente escribe mensajes de depuración para `stderr` basándose en la existencia de la variable de entorno `NODE_DEBUG`. Si el nombre de la `section` aparece dentro del valor de esa variable de entorno, entonces la función retornada opera de manera similar a [`console.error()`][]. Si no, entonces la función retornada es una no-op.

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

Si el programa es ejecutado con `NODE_DEBUG=foo` en el entorno, entonces el resultado va a ser algo como:

```txt
FOO 3245: hello from foo [123]
```

donde `3245` es la identificación del proceso. Si no es ejecutado con ese grupo de variables de entorno, entonces no va a estampar nada.

La `section` también soporta wildcard:
```js
const util = require('util');
const debuglog = util.debuglog('foo-bar');

debuglog('hi there, it\'s foo-bar [%d]', 2333);
```

si es ejecutado con `NODE_DEBUG=foo*` en el entorno, entonces el resultado va a ser algo como:
```txt
FOO-BAR 3257: hola, es foo-bar [2333]
```

Múltiples nombres de `section` separados por coma pueden ser específicados en la variable de entorno `NODE_DEBUG`: `NODE_DEBUG=fs,net,tls`.

## util.deprecate(fn, msg[, code])
<!-- YAML
added: v0.8.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16393
    description: Deprecation warnings are only emitted once for each code.
-->

* `fn` {Function} La función que está siendo desaprobada.
* `msg` {string} Un mensaje de advertencia para mostrar cuando la función desaprobada es invocada.
* `code` {string} Un código de desaprobación. Vea la [lista de APIs desaprobadas](deprecations.html#deprecations_list_of_deprecated_apis) para una lista de códigos.
* Retorna: {Function} La función desaprobada se envolvió para emitir una advertencia.

El método `util.deprecate()` envuelve a `fn` (que puede ser una función o una clase) de tal manera, que es marcado como obsoleto.

```js
const util = require('util');

exports.obsoleteFunction = util.deprecate(() => {
  // Hacer algo aquí.
}, 'obsoleteFunction() está obsoleto. En cambio, use newShinyFunction().');
```

Cuando sea llamada, `util.deprecate()` va a retornar una función que va a emitir una `DeprecationWarning` usando el evento [`'warning'`][]. La advertencia va a ser emitida y estampada a `stderr` la primera vez que la función retornada sea llamada. Después de que la advertencia sea emitida, la función envuelta es llamada sin emitir una advertencia.

Si el mismo `código` opcional es suministrado en múltiples llamadas a `util.deprecate()`, la advertencia va a ser emitida solo una vez por ese `código`.

```js
const util = require('util');

const fn1 = util.deprecate(someFunction, someMessage, 'DEP0001');
const fn2 = util.deprecate(someOtherFunction, someOtherMessage, 'DEP0001');
fn1(); // emite una advertencia de desaprobación con el código DEP0001
fn2(); // no emite una advertencia de desaprobación porque tiene el mismo código
```

Si las banderas de línea de comando `--no-deprecation` o `--nowarnings` son usadas, o si la propiedad `process.noDeprecation` está establecida como `true` *antes* de la primera advertencia de desaprobación, el método `util.deprecate()` no hace nada.

Si las banderas de línea de comando `--trace-deprecation` o `--tracewarnings` están establecidas, o la propiedad `process.traceDeprecation` está establecida como `true`, una advertencia y un stack trace son estampados a `stderr` la primera vez que la función obsoleta sea llamada.

Si la bandera de línea de comando `--throw-deprecation` está establecida, o la propiedad `process.throwDeprecation` está establecida en `true`, entonces una excepción va a ser arrojada cuando la función obsoleta sea llamada.

La bandera de línea de comando `--throw-deprecation` y la propiedad `process.throwDeprecation` toman precedencia sobre `--trace-deprecation` y `process.traceDeprecation`.

## util.format(format[, ...args])
<!-- YAML
added: v0.5.3
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* `format` {string} Un formato de string parecido a `printf`.

El método `util.format()` retorna un string con formato usando el primer argumento como un formato parecido a `printf`.

El primer argumento es un string conteniendo cero o más tokens *placeholder*. Cada token placeholder es reemplazado con el valor convertido del argumento correspondiente. Los placeholders soportados son:

* `%s` - `String`.
* `%d` - `Number` (integer or floating point value) or `BigInt`.
* `%i` - Integer or `BigInt`.
* `%f` - Valor de coma flotante.
* `%j` - JSON. Reemplazado con la string `'[Circular]'` si el argumento contiene referencias circulares.
* `%o` - `Object`. Una representación de string de un objeto con formato de objeto de JavaScript genérico. Similar a `util.inspect()` con opciones `{ showHidden: true, showProxy: true }`. Esto va a mostrar el objeto completo incluyendo propiedades y proxies no enumerables.
* `%O` - `Object`. Una representación de string de un objeto con formato de objeto de JavaScript genérico. Similar a `util.inspect()` sin opciones. Esto va a mostrar el objeto completo no incluyendo propiedades y proxies no enumerables.
* `%%` - signo de porcentaje individual (`'%'`). Esto no consume un argumento.
* Retorna: {string} El string con formato

Si el placeholder no tiene un argumento correspondiente, el placeholder es reemplazado.

```js
util.format('%s:%s', 'foo');
// Retorna: 'foo:%s'
```

Si hay más argumentos pasados al método `util.format()` que el número de placeholders, los argumentos extra son coaccionados en strings, luego cocatenados a la string retornada, cada uno delimitado por un espacio. Argumentos excesivos cuyos `typeof` sea `'object'` o `'symbol'` (excepto `null`), serán transformados por `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

Si el primer argumento no es un string, entonces `util.format()` retorna un string que es la concatenación de todos los argumentos separados por espacios. Cada argumento es convertido a un string usando `util.inspect()`.

```js
util.format(1, 2, 3); // '1 2 3'
```

Si solo un argumento es pasado a `util.format()`, este es retornado tal como está, sin ningún formato.

```js
util.format('%% %s'); // '%% %s'
```

Por favor, tenga en cuenta que `util.format()` es un método sincrónico que es principalmente concebido como una herramienta de depuración. Algunos valores de entrada pueden tener una significativa recarga de rendimiento que puede bloquear el bucle de eventos. Use esta función con cuidado y nunca en una ruta de código caliente.

## util.formatWithOptions(inspectOptions, format[, ...args])
<!-- YAML
added: v10.0.0
-->

* `inspectOptions` {Object}
* `format` {string}

Esta función es idéntica a [`util.format()`][], excepto en que esta toma un argumento `inspectOptions` que especifica las opciones que son pasadas a [`util.inspect()`][].

```js
util.formatWithOptions({ colors: true }, 'See object %O', { foo: 42 });
// Retorna 'See object { foo: 42 }', donde `42` es coloreado como un número
// cuando es estampado a un terminal.
```

## util.getSystemErrorName(err)
<!-- YAML
added: v9.7.0
-->

* `err` {number}
* Devuelve: {string}

Retorna un nombre de string por un código de error numérico que viene de una API de Node.js. El mapeo entre códigos de error y nombres de error es dependiente de la plataforma. Vea [Errores Comunes del Sistema](errors.html#errors_common_system_errors) para los nombres de los errores comunes.

```js
fs.access('file/that/does/not/exist', (err) => {
  const name = util.getSystemErrorName(err.errno);
  console.error(name);  // ENOENT
});
```

## util.inherits(constructor, superConstructor)
<!-- YAML
added: v0.3.0
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3455
    description: The `constructor` parameter can refer to an ES6 class now.
-->

* `constructor` {Function}
* `superConstructor` {Function}

El uso de `util.inherits()` está desalentado. Por favor use la `clase` ES6 y `extienda` palabras clave para obtener soporte de herencia de nivel de lenguaje. También note que los dos estilos son [semánticamente incompatibles](https://github.com/nodejs/node/issues/4179).

Herede los métodos prototipo de un [constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor) a otro. El prototipo del `constructor` se establecerá a un nuevo objeto creado a partir de `superConstructor`.

Como una conveniencia adicional, `superConstructor` va a ser accesible por medio de la propiedad `constructor.super_`.

```js
const util = require('util');
const EventEmitter = require('events');

function MyStream() {
  EventEmitter.call(this);
}

util.inherits(MyStream, EventEmitter);

MyStream.prototype.write = function(data) {
  this.emit('data', data);
};

const stream = new MyStream();

console.log(stream instanceof EventEmitter); // true
console.log(MyStream.super_ === EventEmitter); // true

stream.on('data', (data) => {
  console.log(`Received data: "${data}"`);
});
stream.write('It works!'); // Received data: "It works!"
```

Ejemplo de ES6 usando `class` y `extends`:

```js
const EventEmitter = require('events');

class MyStream extends EventEmitter {
  write(data) {
    this.emit('data', data);
  }
}

const stream = new MyStream();

stream.on('data', (data) => {
  console.log(`Received data: "${data}"`);
});
stream.write('With ES6');
```

## util.inspect(object[, options])
## util.inspect(object[, showHidden[, depth[, colors]]])
<!-- YAML
added: v0.3.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/22788
    description: The `sorted` option is supported now.
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/20725
    description: Inspecting linked lists and similar objects is now possible
                 up to the maximum call stack size.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19259
    description: The `WeakMap` and `WeakSet` entries can now be inspected.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/17576
    description: The `compact` option is supported now.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8174
    description: Custom inspection functions can now return `this`.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7499
    description: The `breakLength` option is supported now.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6334
    description: The `maxArrayLength` option is supported now; in particular,
                 long arrays are truncated by default.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6465
    description: The `showProxy` option is supported now.
-->

* `object` {any} Cualquier JavaScript primitivo u `Object`.
* `opciones` {Object}
  * `showHidden` {boolean} Si `true`, los símbolos y propiedades no enumerables del `object` van a ser incluidos en el resultado formateado, así como también las entradas [`WeakMap`][] y [`WeakSet`][]. **Predeterminado:** `false`.
  * `depth` {number} Especifica el número de veces a repetir mientras se formatea el `object`. Esto es útil para inspeccionar objetos grandes y complicados. To make it recurse up to the maximum call stack size pass `Infinity` or `null`. **Default:** `2`.
  * `colors` {boolean} Si es `true`, el output va a ser diseñado con códigos de colores ANSI. Los colores son personalizables, vea [Customizing `util.inspect` colors][]. **Predeterminado:** `false`.
  * `customInspect` {boolean} Si `false`, entonces las funciones personalizadas `inspect(depth, opts)` no van a ser llamadas. **Predeterminado:** `true`.
  * `showProxy` {boolean} Si `true`, entonces los objetos y funciones que son objetos `Proxy` van a ser analizados para mostrar sus objetos `target` y `handler`. **Predeterminado:** `false`.
  * `maxArrayLength` {number} Especifica el número máximo de elementos de `Array`, [`TypedArray`][], [`WeakMap`][] and [`WeakSet`][] a incluir al formatear. Establecer a `null` o `Infinity` para mostrar todos los elementos. Establecer a `0` o negativo, para no mostrar ningún elemento. **Predeterminado:** `100`.
  * `breakLength` {number} La longitud en la cual las claves de un objeto son divididas a través de múltiples líneas. Establecer a `Infinity` para formatear un objeto como una sola línea. **Predeterminado:** `60` para compatibilidad con versiones anteriores.
  * `compact` {boolean} Establecer esto a `false` cambia la sangría predeterminada para usar un salto de línea por cada clave de objeto, en vez de alinear múltiples propiedades en una sola línea. Esto también romperá el texto que está por encima del tamaño `breakLength` en pedazos más pequeños y más fáciles de leer, y posicionará objetos igual que las arrays. Note que ningún texto va a ser reducido a por debajo de 16 caracteres, sin importar el tamaño del `breakLength`. Para más información, vea el ejemplo de abajo. **Predeterminado:** `true`.
  * `sorted` {boolean|Function} If set to `true` or a function, all properties of an object and Set and Map entries will be sorted in the returned string. If set to `true` the [default sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is going to be used. If set to a function, it is used as a [compare function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#Parameters).
* Devuelve: {string} La representación de un objeto pasado

El método `util.inspect()` devuelve una representación string del `object` que está destinado a la depuración. El output de `util.inspect` puede cambiar en cualquier momento y no se debe depender de él programáticamente. `options` adicionales pueden ser pasadas, ya que alteran ciertos aspectos del string con formato. `util.inspect()` va a usar el nombre del constructor y/o `@@toStringTag` para hacer una etiqueta identificable para un valor inspeccionado.

```js
class Foo {
  get [Symbol.toStringTag]() {
    return 'bar';
  }
}

class Bar {}

const baz = Object.create(null, { [Symbol.toStringTag]: { value: 'foo' } });

util.inspect(new Foo()); // 'Foo [bar] {}'
util.inspect(new Bar()); // 'Bar {}'
util.inspect(baz);       // '[foo] {}'
```

El siguiente ejemplo inspecciona todas las propiedades del objeto `util`:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

Los valores pueden proporcionar sus propias funciones personalizadas `inspect(depth, opts)`, cuando son llamadas estas reciben el `depth` actual en una inspección recursiva, así como también los objetos de opción pasados a `util.inspect()`.

El siguiente ejemplo resalta la diferencia con la opción `compact`:

```js
const util = require('util');

const o = {
  a: [1, 2, [[
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ' +
      'eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'test',
    'foo']], 4],
  b: new Map([['za', 1], ['zb', 'test']])
};
console.log(util.inspect(o, { compact: true, depth: 5, breakLength: 80 }));

// Esto va a estampar

// { a:
//   [ 1,
//     2,
//     [ [ 'Lorem ipsum dolor sit amet, consectetur [...]', // A long line
//           'test',
//           'foo' ] ],
//     4 ],
//   b: Map { 'za' => 1, 'zb' => 'test' } }

// Establecer `compact` como falso, cambia el output para que sea más amigable con el lector.
console.log(util.inspect(o, { compact: false, depth: 5, breakLength: 80 }));

// {
//   a: [
//     1,
//     2,
//     [
//       [
//         'Lorem ipsum dolor sit amet, consectetur ' +
//           'adipiscing elit, sed do eiusmod tempor ' +
//           'incididunt ut labore et dolore magna ' +
//           'aliqua.,
//         'test',
//         'foo'
//       ]
//     ],
//     4
//   ],
//   b: Map {
//     'za' => 1,
//     'zb' => 'test'
//   }
// }

// Establecer `breakLength` a p. ej 150 va a estampar el texto "Lorem ipsum" en una
// sola línea.
// Reducir el `breakLength` va a dividir el texto "Lorem ipsum" en pedazos 
// más pequeños.
```

Usar la opción `showHidden` permite inspeccionar las entradas [`WeakMap`][] and [`WeakSet`][]. Si hay más entradas que `maxArrayLength`, no hay ninguna garantía de cuales entradas son desplegadas. Esto significa, que recuperar la misma entrada [`WeakSet`][] dos veces puede resultar en un output diferente. Además de esto, cualquier ítem puede ser coleccionado en cualquier momento por el colector de basura, si no hay una referencia fuerte dejada para ese objeto. Por lo tanto, no hay garantía de obtener un output confiable.

```js
const { inspect } = require('util');

const obj = { a: 1 };
const obj2 = { b: 2 };
const weakSet = new WeakSet([obj, obj2]);

console.log(inspect(weakSet, { showHidden: true }));
// WeakSet { { a: 1 }, { b: 2 } }
```

The `sorted` option makes sure the output is identical, no matter of the properties insertion order:

```js
const { inspect } = require('util');
const assert = require('assert');

const o1 = {
  b: [2, 3, 1],
  a: '`a` comes before `b`',
  c: new Set([2, 3, 1])
};
console.log(inspect(o1, { sorted: true }));
// { a: '`a` comes before `b`', b: [ 2, 3, 1 ], c: Set { 1, 2, 3 } }
console.log(inspect(o1, { sorted: (a, b) => b.localeCompare(a) }));
// { c: Set { 3, 2, 1 }, b: [ 2, 3, 1 ], a: '`a` comes before `b`' }

const o2 = {
  c: new Set([2, 1, 3]),
  a: '`a` comes before `b`',
  b: [2, 3, 1]
};
assert.strict.equal(
  inspect(o1, { sorted: true }),
  inspect(o2, { sorted: true })
);
```

Por favor, tenga en cuenta que `util.inspect()` es un método sincrónico que es principalmente concebido como una herramienta de depuración. Algunos valores de entrada pueden tener una significativa recarga de rendimiento que puede bloquear el bucle de eventos. Use esta función con cuidado y nunca en una ruta de código caliente.

### Personalización de colores `util.inspect`

<!-- type=misc -->

El output de color (si está habilitado) de `util.inspect` es globalmente personalizable por medio de las propiedades `util.inspect.styles` y `util.inspect.colors`.

`util.inspect.styles` es un mapa que asocia un nombre de estilo con un color de `util.inspect.colors`.

Los estilos predeterminados y colores asociados son:

 * `number` - `yellow`
 * `boolean` - `yellow`
 * `string` - `green`
 * `date` - `magenta`
 * `regexp` - `red`
 * `null` - `bold`
 * `undefined` - `grey`
 * `special` - `cyan` (solo aplicado a funciones en este momento)
 * `name` - (sin estilo)

Los códigos de colores predefinidos son: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` y `yellow`. También hay códigos `bold`, `italic`, `underline` e `inverse`.

El estilo de color usa códigos de control ANSI que pueden no ser suportados en todos los terminales.

### Funciones de inspección personalizadas en Objetos

<!-- type=misc -->

Objects may also define their own [`[util.inspect.custom](depth, opts)`](#util_util_inspect_custom) (or the equivalent but deprecated `inspect(depth, opts)`) function, which `util.inspect()` will invoke and use the result of when inspecting the object:

```js
const util = require('util');

class Box {
  constructor(value) {
    this.value = value;
  }

  [util.inspect.custom](depth, options) {
    if (depth < 0) {
      return options.stylize('[Box]', 'special');
    }

    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1
    });

    // Cinco espacios rellenados porque ese es el tamaño de "Box< ".
    const padding = ' '.repeat(5);
    const inner = util.inspect(this.value, newOptions)
                      .replace(/\n/g, `\n${padding}`);
    return `${options.stylize('Box', 'special')}< ${inner} >`;
  }
}

const box = new Box(true);

util.inspect(box);
// Retorna: "Box< true >"
```

Las funciones personalizadas `[util.inspect.custom](depth, opts)` devuelven típicamente un string, pero pueden devolver un valor de cualquier tipo, al que `util.inspect()` le dará formato consecuentemente.

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Devuelve: "{ bar: 'baz' }"
```

### util.inspect.custom
<!-- YAML
added: v6.6.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/20857
    description: This is now defined as a shared symbol.
-->

* {symbol} that can be used to declare custom inspect functions.

In addition to being accessible through `util.inspect.custom`, this symbol is [registered globally](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for) and can be accessed in any environment as `Symbol.for('nodejs.util.inspect.custom')`.

```js
const inspect = Symbol.for('nodejs.util.inspect.custom');

class Password {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return 'xxxxxxxx';
  }

  [inspect]() {
    return `Password <${this.toString()}>`;
  }
}

const password = new Password('r0sebud');
console.log(password);
// Prints Password <xxxxxxxx>
```

See [Custom inspection functions on Objects](#util_custom_inspection_functions_on_objects) for more details.

### util.inspect.defaultOptions
<!-- YAML
added: v6.4.0
-->

El valor `defaultOptions` permite la personalización de la opción predeterminada usada por `util.inspect`. Esto es útil para funciones como `console.log` o `util.format` que implícitamente llaman a `util.inspect`. Debería ser establecido en un objeto conteniendo una o más opciones [`util.inspect()`][] válidas. Establecer directamente propiedades de opciones también está soportado.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // registra el array truncado
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // registra el array completo
```

## util.isDeepStrictEqual(val1, val2)
<!-- YAML
added: v9.0.0
-->

* `val1` {any}
* `val2` {any}
* Devuelve: {boolean}

Devuelve `true` si hay una estricta igualdad profunda entre `val1` and `val2`. De otra manera, devuelve `false`.

Vea [`assert.deepStrictEqual()`][] para más información sobre estricta igualdad profunda.

## util.promisify(original)
<!-- YAML
added: v8.0.0
-->

* `original` {Function}
* Devuelve: {Function}

Toma una función siguiendo el estilo común de callback de primero-error, i.e. tomar un callback `(err, value) => ...` como el último argumento, y devuelve una versión que devuelve promesas.

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.').then((stats) => {
  // Hacer algo con `stats`
}).catch((error) => {
  // Gestionar el error.
});
```

O, equivalentemente usando `async function`s:

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);

async function callStat() {
  const stats = await stat('.');
  console.log(`This directory is owned by ${stats.uid}`);
}
```

Si hay una propiedad `original[util.promisify.custom]` presente, `promisify` va a devolver su valor, vea [Funciones personalizadas promisificadas](#util_custom_promisified_functions).

`promisify()` asume que `original` es una función tomando un callback como su argumento final en todos los casos. Si `original` no es una función, `promisify()` va a arrojar un error. Si `original` es una función pero su último argumento no es un callback de primer error, aún así va a pasar un callback de primer error como su último argumento.

### Funciones promisificadas personalizadas

Al usar el símbolo `util.promisify.custom`, uno puede anular el valor de retorno de [`util.promisify()`][]:

```js
const util = require('util');

function doSomething(foo, callback) {
  // ...
}

doSomething[util.promisify.custom] = (foo) => {
  return getPromiseSomehow();
};

const promisified = util.promisify(doSomething);
console.log(promisified === doSomething[util.promisify.custom]);
// imprimir 'true'
```

Esto puede ser útil para casos donde la función original no siga un formato estándar para tomar un callback de primero-error como el último argumento.

Por ejemplo, con una función que toma `(foo, onSuccessCallback,
onErrorCallback)`:

```js
doSomething[util.promisify.custom] = (foo) => {
  return new Promise((resolve, reject) => {
    doSomething(foo, resolve, reject);
  });
};
```
Si `promisify.custom` está definido pero no es una función, `promisify()` va a arrojar un error.

### util.promisify.custom
<!-- YAML
added: v8.0.0
-->

* {symbol}

Un {symbol} que puede ser usado para declarar variantes promisificadas personalizadas de funciones, vea [Funciones personalizadas promisificadas](#util_custom_promisified_functions).

## Clase: util.TextDecoder
<!-- YAML
added: v8.3.0
-->

Una implementación de la API `TextDecoder` del [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/).

```js
const decoder = new TextDecoder('shift_jis');
let string = '';
let buffer;
while (buffer = getNextChunkSomehow()) {
  string += decoder.decode(buffer, { stream: true });
}
string += decoder.decode(); // end-of-stream
```

### Codificaciones Soportadas por WHATWG

Según el [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/), las codificaciones soportadas por la API `TextDecoder` están delineadas en las tablas a continuación. Para cada codificación, uno o más alias pueden ser usados.

Diferentes configuraciones de construcción de Node.js soportan diferentes conjuntos de codificaciones. Mientras que un conjunto de codificaciones bastante básico es soportado incluso en construcciones de Node.js sin tener ICU habilitado, el soporte para algunas codificaciones es provisto solo cuando Node.js es construido con ICU y usando los datos completos de ICU (vea [Internacionalización](intl.html)).

#### Codificaciones Soportadas Sin ICU

| Codificación | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

#### Codificaciones Soportadas por Defecto (Con ICU)

| Codificación | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### Codificaciones que Requieren los Datos Completos de ICU

| Codificación       | Alias                                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'ibm866'`         | `'866'`, `'cp866'`, `'csibm866'`                                                                                                                                                                                                    |
| `'iso-8859-2'`     | `'csisolatin2'`, `'iso-ir-101'`, `'iso8859-2'`, `'iso88592'`, `'iso_8859-2'`, `'iso_8859-2:1987'`, `'l2'`, `'latin2'`                                                                                                               |
| `'iso-8859-3'`     | `'csisolatin3'`, `'iso-ir-109'`, `'iso8859-3'`, `'iso88593'`, `'iso_8859-3'`, `'iso_8859-3:1988'`, `'l3'`, `'latin3'`                                                                                                               |
| `'iso-8859-4'`     | `'csisolatin4'`, `'iso-ir-110'`, `'iso8859-4'`, `'iso88594'`, `'iso_8859-4'`, `'iso_8859-4:1988'`, `'l4'`, `'latin4'`                                                                                                               |
| `'iso-8859-5'`     | `'csisolatincyrillic'`, `'cyrillic'`, `'iso-ir-144'`, `'iso8859-5'`, `'iso88595'`, `'iso_8859-5'`, `'iso_8859-5:1988'`                                                                                                              |
| `'iso-8859-6'`     | `'arabic'`, `'asmo-708'`, `'csiso88596e'`, `'csiso88596i'`, `'csisolatinarabic'`, `'ecma-114'`, `'iso-8859-6-e'`, `'iso-8859-6-i'`, `'iso-ir-127'`, `'iso8859-6'`, `'iso88596'`, `'iso_8859-6'`, `'iso_8859-6:1987'`                |
| `'iso-8859-7'`     | `'csisolatingreek'`, `'ecma-118'`, `'elot_928'`, `'greek'`, `'greek8'`, `'iso-ir-126'`, `'iso8859-7'`, `'iso88597'`, `'iso_8859-7'`, `'iso_8859-7:1987'`, `'sun_eu_greek'`                                                          |
| `'iso-8859-8'`     | `'csiso88598e'`, `'csisolatinhebrew'`, `'hebrew'`, `'iso-8859-8-e'`, `'iso-ir-138'`, `'iso8859-8'`, `'iso88598'`, `'iso_8859-8'`, `'iso_8859-8:1988'`, `'visual'`                                                                   |
| `'iso-8859-8-i'`   | `'csiso88598i'`, `'logical'`                                                                                                                                                                                                        |
| `'iso-8859-10'`    | `'csisolatin6'`, `'iso-ir-157'`, `'iso8859-10'`, `'iso885910'`, `'l6'`, `'latin6'`                                                                                                                                                  |
| `'iso-8859-13'`    | `'iso8859-13'`, `'iso885913'`                                                                                                                                                                                                       |
| `'iso-8859-14'`    | `'iso8859-14'`, `'iso885914'`                                                                                                                                                                                                       |
| `'iso-8859-15'`    | `'csisolatin9'`, `'iso8859-15'`, `'iso885915'`, `'iso_8859-15'`, `'l9'`                                                                                                                                                             |
| `'koi8-r'`         | `'cskoi8r'`, `'koi'`, `'koi8'`, `'koi8_r'`                                                                                                                                                                                          |
| `'koi8-u'`         | `'koi8-ru'`                                                                                                                                                                                                                         |
| `'macintosh'`      | `'csmacintosh'`, `'mac'`, `'x-mac-roman'`                                                                                                                                                                                           |
| `'windows-874'`    | `'dos-874'`, `'iso-8859-11'`, `'iso8859-11'`, `'iso885911'`, `'tis-620'`                                                                                                                                                            |
| `'windows-1250'`   | `'cp1250'`, `'x-cp1250'`                                                                                                                                                                                                            |
| `'windows-1251'`   | `'cp1251'`, `'x-cp1251'`                                                                                                                                                                                                            |
| `'windows-1252'`   | `'ansi_x3.4-1968'`, `'ascii'`, `'cp1252'`, `'cp819'`, `'csisolatin1'`, `'ibm819'`, `'iso-8859-1'`, `'iso-ir-100'`, `'iso8859-1'`, `'iso88591'`, `'iso_8859-1'`, `'iso_8859-1:1987'`, `'l1'`, `'latin1'`, `'us-ascii'`, `'x-cp1252'` |
| `'windows-1253'`   | `'cp1253'`, `'x-cp1253'`                                                                                                                                                                                                            |
| `'windows-1254'`   | `'cp1254'`, `'csisolatin5'`, `'iso-8859-9'`, `'iso-ir-148'`, `'iso8859-9'`, `'iso88599'`, `'iso_8859-9'`, `'iso_8859-9:1989'`, `'l5'`, `'latin5'`, `'x-cp1254'`                                                                     |
| `'windows-1255'`   | `'cp1255'`, `'x-cp1255'`                                                                                                                                                                                                            |
| `'windows-1256'`   | `'cp1256'`, `'x-cp1256'`                                                                                                                                                                                                            |
| `'windows-1257'`   | `'cp1257'`, `'x-cp1257'`                                                                                                                                                                                                            |
| `'windows-1258'`   | `'cp1258'`, `'x-cp1258'`                                                                                                                                                                                                            |
| `'x-mac-cyrillic'` | `'x-mac-ukrainian'`                                                                                                                                                                                                                 |
| `'gbk'`            | `'chinese'`, `'csgb2312'`, `'csiso58gb231280'`, `'gb2312'`, `'gb_2312'`, `'gb_2312-80'`, `'iso-ir-58'`, `'x-gbk'`                                                                                                                   |
| `'gb18030'`        |                                                                                                                                                                                                                                     |
| `'big5'`           | `'big5-hkscs'`, `'cn-big5'`, `'csbig5'`, `'x-x-big5'`                                                                                                                                                                               |
| `'euc-jp'`         | `'cseucpkdfmtjapanese'`, `'x-euc-jp'`                                                                                                                                                                                               |
| `'iso-2022-jp'`    | `'csiso2022jp'`                                                                                                                                                                                                                     |
| `'shift_jis'`      | `'csshiftjis'`, `'ms932'`, `'ms_kanji'`, `'shift-jis'`, `'sjis'`, `'windows-31j'`, `'x-sjis'`                                                                                                                                       |
| `'euc-kr'`         | `'cseuckr'`, `'csksc56011987'`, `'iso-ir-149'`, `'korean'`, `'ks_c_5601-1987'`, `'ks_c_5601-1989'`, `'ksc5601'`, `'ksc_5601'`, `'windows-949'`                                                                                      |

La codificación `'iso-8859-16'` listada en el [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/) no es soportada.

### nuevo TextDecoder([encoding[, options]])

* `encoding` {string} Identifica el `encoding` que esta instancia `TextDecoder` soporta. **Predeterminado:** `'utf-8'`.
* `opciones` {Object}
  * `fatal` {boolean} `true` si las fallas de decodificación son fatales. Esta opción es soportada solo cuando ICU está habilitado (vea [Internacionalización](intl.html)). **Predeterminado:** `false`.
  * `ignoreBOM` {boolean} Cuando sea `true`, el `TextDecoder` va a incluir la marca de orden de bytes en el resultado decodificado. Cuando sea `false`, la marca de orden de bytes va a ser removida del output. Esta opción es usada solo cuando `encoding` es `'utf-8'`, `'utf16be'` o `'utf-16le'`. **Predeterminado:** `false`.

Crea una nueva instancia `TextDecoder`. El `encoding` puede especificar una de las decodificaciones soportadas o un alias.

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} Una instancia `ArrayBuffer`, `DataView` o `Typed Array` conteniendo los datos codificados.
* `opciones` {Object}
  * `stream` {boolean} `true` si pedazos adicionales de datos son esperados. **Predeterminado:** `false`.
* Devuelve: {string}

Decodifica el `input` y devuelve un string. Si `options.stream` es `true`, las secuencias de bytes incompletas que ocurran al final del `input` son almacenadas internamente y emitidas después de la siguiente llamada a `textDecoder.decode()`.

Si `textDecoder.fatal` es `true`, decodificar errores que ocurran resultará en un `TypeError` siendo arrojado.

### textDecoder.encoding

* {string}

La codificación soportada por la instancia `TextDecoder`.

### textDecoder.fatal

* {boolean}

El valor será `true` si la decodificación de errores resulta en un `TypeError` siendo arrojado.

### textDecoder.ignoreBOM

* {boolean}

El valor será `true` si el resultado de la decodificación va a incluir la marca de orden de bytes.

## Clase: util.TextEncoder
<!-- YAML
added: v8.3.0
-->

Una implementación de la API `TextDecoder` del [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/). Todas las instancias de `TextEncoder` solo soportan codificación UTF-8.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} El texto para codificar. **Predeterminado:** un string vacío.
* Devuelve: {Uint8Array}

UTF-8 codifica el string `input` y devuelve un `Uint8Array` conteniendo los bytes codificados.

### textEncoder.encoding

* {string}

La codificación soportada por la instancia `TextEncoder`. Siempre configurado para `'utf-8'`.

## util.types
<!-- YAML
added: v10.0.0
-->

`util.types` proporciona un número de chequeos de tipo para diferentes clases de objetos incorporados. A diferencia de `instanceof` u `Object.prototype.toString.call(value)`, estos chequeos no inspeccionan propiedades del objeto que sean accesibles desde JavaScript (como su prototipo), y usualmente tienen la sobrecarga de llamar a C++.

El resultado generalmente no da ninguna garantía sobre qué tipos de propiedades o comportamientos expone un valor en JavaScript. Ellos son principalmente útiles para desarrolladores de complementos que prefieren hacer el chequeo de tipo en JavaScript.

### util.types.isAnyArrayBuffer(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia incorporada [`ArrayBuffer`][] o [`SharedArrayBuffer`][].

Ver también [`util.types.isArrayBuffer()`][] y [`util.types.isSharedArrayBuffer()`][].

```js
util.types.isAnyArrayBuffer(new ArrayBuffer());  // Devuelve true
util.types.isAnyArrayBuffer(new SharedArrayBuffer());  // Devuelve true
```

### util.types.isArgumentsObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto de `arguments`.
```js
function foo() {
  util.types.isArgumentsObject(arguments);  // Devuelve true
}
```

### util.types.isArrayBuffer(value)<!-- YAML
added: v10.0.0
-->* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`ArrayBuffer`][] incorporada. Esto *no* incluye instancias [`SharedArrayBuffer`][]. Usualmente, es deseable probar a ambos; Para eso, vea [`util.types.isAnyArrayBuffer()`][].

```js
util.types.isArrayBuffer(new ArrayBuffer());  // Devuelve true
util.types.isArrayBuffer(new SharedArrayBuffer());  // Devuelve false
```

### util.types.isAsyncFunction(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una [función asíncrona](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function). Tenga en cuenta que esto solo reporta lo que el motor JavaScript está viendo; en particular, el valor devuelto puede no ser igual al código fuente original si una herramienta de transpilación fue usada.

```js
util.types.isAsyncFunction(function foo() {});  // Devuelve false
util.types.isAsyncFunction(async function foo() {});  // Devuelve true
```

### util.types.isBigInt64Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a `BigInt64Array` instance.

```js
util.types.isBigInt64Array(new BigInt64Array());   // Returns true
util.types.isBigInt64Array(new BigUint64Array());  // Returns false
```

### util.types.isBigUint64Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is a `BigUint64Array` instance.

```js
util.types.isBigUint64Array(new BigInt64Array());   // Returns false
util.types.isBigUint64Array(new BigUint64Array());  // Returns true
```

### util.types.isBooleanObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto booleano, p. ej. creado por `new Boolean()`.

```js
util.types.isBooleanObject(false);  // Returns false
util.types.isBooleanObject(true);   // Returns false
util.types.isBooleanObject(new Boolean(false)); // Returns true
util.types.isBooleanObject(new Boolean(true));  // Returns true
util.types.isBooleanObject(Boolean(false)); // Returns false
util.types.isBooleanObject(Boolean(true));  // Returns false
```

### util.types.isBoxedPrimitive(value)<!-- YAML
added: v10.11.0
-->* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is any boxed primitive object, e.g. created by `new Boolean()`, `new String()` or `Object(Symbol())`.

For example:

```js
util.types.isBoxedPrimitive(false); // Returns false
util.types.isBoxedPrimitive(new Boolean(false)); // Returns true
util.types.isBoxedPrimitive(Symbol('foo')); // Returns false
util.types.isBoxedPrimitive(Object(Symbol('foo'))); // Returns true
util.types.isBoxedPrimitive(Object(BigInt(5))); // Returns true
```

### util.types.isDataView(value)<!-- YAML
added: v10.0.0
-->* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`DataView`][] incorporada.

```js
const ab = new ArrayBuffer(20);
util.types.isDataView(new DataView(ab));  // Devuelve true
util.types.isDataView(new Float64Array());  // Devuelve false
```

Ver también [`ArrayBuffer.isView()`][].

### util.types.isDate(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Date`][] incorporada.

```js
util.types.isDate(new Date());  // Devuelve true
```

### util.types.isExternal(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un valor `External` nativo.

### util.types.isFloat32Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Float32Array`][] incorporada.

```js
util.types.isFloat32Array(new ArrayBuffer());  // Devuelve false
util.types.isFloat32Array(new Float32Array());  // Devuelve  true
util.types.isFloat32Array(new Float64Array());  // Devuelve false
```

### util.types.isFloat64Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Float64Array`][] incorporada.

```js
util.types.isFloat64Array(new ArrayBuffer());  // Devuelve false
util.types.isFloat64Array(new Uint8Array());  // Devuelve  false
util.types.isFloat64Array(new Float64Array());  // Devuelve true
```

### util.types.isGeneratorFunction(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una función generadora. Tenga en cuenta que esto solo reporta lo que el motor JavaScript está viendo; en particular, el valor devuelto puede no ser igual al código fuente original si una herramienta de transpilación fue usada.

```js
util.types.isGeneratorFunction(function foo() {});  // Devuelve false
util.types.isGeneratorFunction(function* foo() {});  // Devuelve true
```

### util.types.isGeneratorObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto generador como se devuelve de una función generadora incorporada. Tenga en cuenta que esto solo reporta lo que el motor JavaScript está viendo; en particular, el valor devuelto puede no ser igual al código fuente original si una herramienta de transpilación fue usada.

```js
function* foo() {}
const generator = foo();
util.types.isGeneratorObject(generator);  // Devuelve true
```

### util.types.isInt8Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Int8Array`][] incorporada.

```js
util.types.isInt8Array(new ArrayBuffer());  // Devuelve false
util.types.isInt8Array(new Int8Array());  // Devuelve  true
util.types.isInt8Array(new Float64Array());  // Devuelve false
```

### util.types.isInt16Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Int16Array`][] incorporada.

```js
util.types.isInt16Array(new ArrayBuffer());  // Devuelve false
util.types.isInt16Array(new Int16Array());  // Devuelve true
util.types.isInt16Array(new Float64Array());  // Devuelve false
```

### util.types.isInt32Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Int32Array`][] incorporada.

```js
util.types.isInt32Array(new ArrayBuffer());  // Devuelve false
util.types.isInt32Array(new Int32Array());  // Devuelve true
util.types.isInt32Array(new Float64Array());  // Devuelve false
```

### util.types.isMap(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Map`][] incorporada.

```js
util.types.isMap(new Map());  // Devuelve true
```

### util.types.isMapIterator(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un iterador devuelto para una instancia [`Map`][] incorporada.

```js
const map = new Map();
util.types.isMapIterator(map.keys());  // Devuelve true
util.types.isMapIterator(map.values());  // Devuelve true
util.types.isMapIterator(map.entries());  // Devuelve true
util.types.isMapIterator(map[Symbol.iterator]());  // Devuelve true
```

### util.types.isModuleNamespaceObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Returns `true` if the value is an instance of a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects).
```js
import * as ns from './a.js';

util.types.isModuleNamespaceObject(ns);  // Returns true
```

### util.types.isNativeError(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia del tipo [`Error`][] incorporado.

```js
util.types.isNativeError(new Error());  // Devuelve true
util.types.isNativeError(new TypeError());  // Devuelve true
util.types.isNativeError(new RangeError());  // Devuelve true
```

### util.types.isNumberObject(value)<!-- YAML
added: v10.0.0
-->* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto número, p. ej. creado por `new Number()`.

```js
util.types.isNumberObject(0);  // Devuelve false
util.types.isNumberObject(new Number(0));   // Devuelve true
```

### util.types.isPromise(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una [`Promise`][] incorporada.

```js
util.types.isPromise(Promise.resolve(42));  // Devuelve true
```

### util.types.isProxy(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Proxy`][].

```js
const target = {};
const proxy = new Proxy(target, {});
util.types.isProxy(target);  // Devuelve false
util.types.isProxy(proxy);  // Devuelve true
```

### util.types.isRegExp(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto de expresión regular.

```js
util.types.isRegExp(/abc/);  // Devuelve true
util.types.isRegExp(new RegExp('abc'));  // Devuelve true
```

### util.types.isSet(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Set`][] incorporada.

```js
util.types.isSet(new Set());  // Devuelve true
```

### util.types.isSetIterator(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un iterador devuelto para una instancia [`Set`][] incorporada.

```js
const set = new Set();
util.types.isSetIterator(set.keys());  // Devuelve true
util.types.isSetIterator(set.values());  // Devuelve true
util.types.isSetIterator(set.entries());  // Devuelve true
util.types.isSetIterator(set[Symbol.iterator]());  // Devuelve true
```

### util.types.isSharedArrayBuffer(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`SharedArrayBuffer`][] incorporada. Esto *no* incluye a instancias [`ArrayBuffer`][]. Usualmente, es deseable probar a ambos; Para eso, vea [`util.types.isAnyArrayBuffer()`][].

```js
util.types.isSharedArrayBuffer(new ArrayBuffer());  // Devuelve false
util.types.isSharedArrayBuffer(new SharedArrayBuffer());  // Devuelve true
```

### util.types.isStringObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto de string, p. ej. creado por `new String()`.

```js
util.types.isStringObject('foo');  // Devuelve false
util.types.isStringObject(new String('foo'));   // Devuelve true
```

### util.types.isSymbolObject(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es un objeto de símbolo, creado al llamar a `Object()` en un `Symbol` primitivo.

```js
const symbol = Symbol('foo');
util.types.isSymbolObject(symbol);  // Devuelve false
util.types.isSymbolObject(Object(symbol));   // Devuelve true
```

### util.types.isTypedArray(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`TypedArray`][] incorporada.

```js
util.types.isTypedArray(new ArrayBuffer());  // Devuelve false
util.types.isTypedArray(new Uint8Array());  // Devuelve true
util.types.isTypedArray(new Float64Array());  // Devuelve true
```

Ver también [`ArrayBuffer.isView()`][].

### util.types.isUint8Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint8Array`][] incorporada.

```js
util.types.isUint8Array(new ArrayBuffer());  // Devuelve false
util.types.isUint8Array(new Uint8Array());  // Devuelve true
util.types.isUint8Array(new Float64Array());  // Devuelve false
```

### util.types.isUint8ClampedArray(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint8ClampedArray`][] incorporada.

```js
util.types.isUint8ClampedArray(new ArrayBuffer());  // Devuelve false
util.types.isUint8ClampedArray(new Uint8ClampedArray());  // Devuelve true
util.types.isUint8ClampedArray(new Float64Array());  // Devuelve false
```

### util.types.isUint16Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint16Array`][] incorporada.

```js
util.types.isUint16Array(new ArrayBuffer());  // Devuelve false
util.types.isUint16Array(new Uint16Array());  // Devuelve true
util.types.isUint16Array(new Float64Array());  // Devuelve false
```

### util.types.isUint32Array(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`Uint32Array`][] incorporada.

```js
util.types.isUint32Array(new ArrayBuffer());  // Devuelve false
util.types.isUint32Array(new Uint32Array());  // Devuelve true
util.types.isUint32Array(new Float64Array());  // Devuelve false
```

### util.types.isWeakMap(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WeakMap`][] incorporada.

```js
util.types.isWeakMap(new WeakMap());  // Devuelve true
```

### util.types.isWeakSet(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WeakSet`][] incorporada.

```js
util.types.isWeakSet(new WeakSet());  // Devuelve true
```

### util.types.isWebAssemblyCompiledModule(value)
<!-- YAML
added: v10.0.0
-->

* `value` {any}
* Devuelve: {boolean}

Devuelve `true` si el valor es una instancia [`WebAssembly.Module`][] incorporada.

```js
const module = new WebAssembly.Module(wasmBuffer);
util.types.isWebAssemblyCompiledModule(module);  // Devuelve true
```

## APIs Desaprobadas

The following APIs are deprecated and should no longer be used. Los módulos y aplicaciones existentes deberían ser actualizados para encontrar enfoques alternativos.

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->* `target` {Object}
* `source` {Object}

> Estabilidad: 0 - Desaprobado: Utilice [`Object.assign()`] en su lugar.

El método `util._extend()` nunca fue pensado para ser usado fuera de los módulos internos de Node.js. De todas maneras, la comunidad lo encontró y lo usó.

Está desaprobado y no debería ser usado en código nuevo. JavaScript viene con funcionabilidades incorporadas muy similares por medio de [`Object.assign()`].

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Estabilidad: 0 - Desaprobado: Utilice [`console.error()`][] en su lugar.

* `string` {string} El mensaje para imprimir en `stderr`

Predecesor desaprobado de `console.error`.

### util.error([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Estabilidad: 0 - Desaprobado: En cambio, use [`console.error()`][].

* `...strings` {string} El mensaje para imprimir en `stderr`

Predecesor desaprobado de `console.error`.

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use [`Array.isArray()`][].

* `object` {any}
* Devuelve: {boolean}

Alias para [`Array.isArray()`][].

Devuelve `true` si el `object` dado es un `Array`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isArray([]);
// Devuelve: true
util.isArray(new Array());
// Devuelve: true
util.isArray({});
// Devuelve: false
```

### util.isBoolean(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use `typeof value === 'boolean'`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Boolean`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isBoolean(1);
// Devuelve: false
util.isBoolean(0);
// Devuelve: false
util.isBoolean(false);
// Devuelve: true
```

### util.isBuffer(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.isBuffer()`][] en su lugar.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Buffer`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Devuelve: false
util.isBuffer([]);
// Devuelve: false
util.isBuffer(Buffer.from('hello world'));
// Devuelve: true
```

### util.isDate(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use [`util.types.isDate()`][].

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` es una `Date`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isDate(new Date());
// Devuelve: true
util.isDate(Date());
// false (sin 'new' devuelve un String)
util.isDate({});
// Devuelve: false
```

### util.isError(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use [`util.types.isNativeError()`][].

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un [`Error`][]. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isError(new Error());
// Devuelve: true
util.isError(new TypeError());
// Devuelve: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Devuelve: false
```

Tenga en cuenta que este método depende del comportamiento de `Object.prototype.toString()`. Es posible obtener un resultado incorrecto cuando el argumento del `object` manipula a `@@toStringTag`.

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Devuelve: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Devuelve: true
```

### util.isFunction(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use `typeof value === 'function'`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es una `Function`. De otra manera, devuelve `false`.

```js
const util = require('util');

function Foo() {}
const Bar = () => {};

util.isFunction({});
// Devuelve: false
util.isFunction(Foo);
// Devuelve: true
util.isFunction(Bar);
// Devuelve: true
```

### util.isNull(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use `value === null`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` es estrictamente `null`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isNull(0);
// Devuelve: false
util.isNull(undefined);
// Devuelve: false
util.isNull(null);
// Devuelve: true
```

### util.isNullOrUndefined(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: En cambio, use  `value === undefined || value === null`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es `null` o `undefined`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isNullOrUndefined(0);
// Devuelve: false
util.isNullOrUndefined(undefined);
// Devuelve: true
util.isNullOrUndefined(null);
// Devuelve: true
```

### util.isNumber(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: En cambio, use `typeof value === 'number'`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Number`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isNumber(false);
// Devuelve: false
util.isNumber(Infinity);
// Devuelve: true
util.isNumber(0);
// Devuelve: true
util.isNumber(NaN);
// Devuelve: true
```

### util.isObject(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: En cambio, use `value !== null && typeof value === 'object'`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es estrictamente un `Object` **y** no una `Function` (a pesar de que las funciones son objetos en JavaScript). De otra manera, devuelve `false`.

```js
const util = require('util');

util.isObject(5);
// Devuelve: false
util.isObject(null);
// Devuelve: false
util.isObject({});
// Devuelve: true
util.isObject(() => {});
// Devuelve: false
```

### util.isPrimitive(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: En cambio, use `(typeof value !== 'object' && typeof value !== 'function') || value === null`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es de un tipo primitivo. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isPrimitive(5);
// Devuelve: true
util.isPrimitive('foo');
// Devuelve: true
util.isPrimitive(false);
// Devuelve: true
util.isPrimitive(null);
// Devuelve: true
util.isPrimitive(undefined);
// Devuelve: true
util.isPrimitive({});
// Devuelve: false
util.isPrimitive(() => {});
// Devuelve: false
util.isPrimitive(/^$/);
// Devuelve: false
util.isPrimitive(new Date());
// Devuelve: false
```

### util.isRegExp(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Estabilidad: 0 - Desactualización

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `RegExp`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isRegExp(/some regexp/);
// Devuelve: true
util.isRegExp(new RegExp('another regexp'));
// Devuelve: true
util.isRegExp({});
// Devuelve: false
```

### util.isString(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: En cambio, use `typeof value === 'string'`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `string`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isString('');
// Devuelve: true
util.isString('foo');
// Devuelve: true
util.isString(String('foo'));
// Devuelve: true
util.isString(5);
// Devuelve: false
```

### util.isSymbol(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use `typeof value === 'symbol'`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es un `Symbol`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isSymbol(5);
// Devuelve: false
util.isSymbol('foo');
// Devuelve: false
util.isSymbol(Symbol('foo'));
// Devuelve: true
```

### util.isUndefined(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: En cambio, use `value === undefined`.

* `object` {any}
* Devuelve: {boolean}

Devuelve `true` si el `object` dado es `undefined`. De otra manera, devuelve `false`.

```js
const util = require('util');

const foo = undefined;
util.isUndefined(5);
// Devuelve: false
util.isUndefined(foo);
// Devuelve: true
util.isUndefined(null);
// Devuelve: false
```

### util.log(string)<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->> Estabilidad: 0 - Desaprobado: En cambio, use un módulo de terceros.

* `string` {string}

El método `util.log()` imprime el `string` dado a `stdout` con una marca de tiempo incluida.

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Estabilidad: 0 - Desaprobado: En cambio, use [`console.log()`][].

Predecesor desaprobado de `console.log`.

### util.puts([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Estabilidad: 0 - Desaprobado: En cambio, use [`console.log()`][].

Predecesor desaprobado de `console.log`.
