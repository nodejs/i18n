# Util

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

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

Takes an `async` function (or a function that returns a Promise) and returns a function following the error-first callback style, i.e. taking a `(err, value) => ...` callback as the last argument. In the callback, the first argument will be the rejection reason (or `null` if the Promise resolved), and the second argument will be the resolved value.

For example:

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

*Nota*:

* El callback es ejecutado asincrónicamente, y tendrá un stack trace limitado. If the callback throws, the process will emit an [`'uncaughtException'`][] event, and if not handled will exit.

* Since `null` has a special meaning as the first argument to a callback, if a wrapped function rejects a `Promise` with a falsy value as a reason, the value is wrapped in an `Error` with the original value stored in a field named `reason`.
  
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

* `section` {string} Una string identificando la porción de la aplicación para la cual la función `debuglog` está siendo creada.
* Retorna: {Function} La función de registro

El método `util.debuglog()` es utilizado para crear una función que condicionalmente escribe mensajes de depuración para `stderr` basándose en la existencia de la variable de entorno `NODE_DEBUG`. Si el nombre de la `section` aparece dentro del valor de esa variable de entorno, entonces la función devuelta opera de manera similar a [`console.error()`][]. Si no, entonces la función retornada es un no-op.

For example:

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

Si este programa se ejecuta con `NODE_DEBUG=foo` en el entorno, entonces el resultado será algo como:

```txt
FOO 3245: hello from foo [123]
```

donde `3245` es la identificación del proceso. Si no es ejecutado con ese conjunto de variables de entorno, entonces no imprimirá nada.

Múltiples nombres de la `section` separados con comas pueden ser especificados en la variable de entorno `NODE_DEBUG`. Por ejemplo: `NODE_DEBUG=fs,net,tls`.

## util.deprecate(function, string)

<!-- YAML
added: v0.8.0
-->

El método `util.deprecate()` envuelve a la `function` o clase dada de tal manera que es marcada como desaprobada.

<!-- eslint-disable prefer-rest-params -->

```js
const util = require('util');

exports.puts = util.deprecate(function() {
  for (let i = 0, len = arguments.length; i < len; ++i) {
    process.stdout.write(arguments[i] + '\n');
  }
}, 'util.puts: Use console.log instead');
```

Cuando sea llamada, `util.deprecate()` devolverá una función que va a emitir una `DeprecationWarning` usando el evento `process.on('warning')`. Por defecto, esta advertencia será emitida e impresa en `stderr` exactamente una vez, la primera vez que sea llamada. Luego de que se emite la advertencia, se llama a la `function` envuelta.

Si las banderas de línea de comandos `--no-deprecation` o `--nowarnings` son usadas, o si la propiedad `process.noDeprecation` está establecida como `true` *antes* de la primera advertencia de desaprobación, el método `util.deprecate()` no hace nada.

Si las banderas de línea de comandos `--trace-deprecation` o `--trace-warnings` están establecidas, o la propiedad `process.traceDeprecation` está establecida como `true`, una advertencia y un stack trace son impresos a `stderr` la primera vez que la función desaprobada sea llamada.

Si la bandera de línea de comandos `--throw-deprecation` está establecida, o la propiedad `process.throwDeprecation` está establecida en `true`, entonces una excepción va a ser arrojada cuando la función desaprobada sea llamada.

La bandera de línea de comandos `--throw-deprecation` y la propiedad `process.throwDeprecation` tienen prioridad sobre `--trace-deprecation` y `process.traceDeprecation`.

## util.format(format[, ...args])

<!-- YAML
added: v0.5.3
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* `format` {string} Un formato de string parecido a `printf`.

El método `util.format()` retorna una string con formato usando el primer argumento como un formato parecido a `printf`.

El primer argumento es una string que contiene cero o más tokens de *placeholder*. Cada token de placeholder es reemplazado con el valor convertido del argumento correspondiente. Los placeholders soportados son:

* `%s` - String.
* `%d` - Número (valor entero o punto flotante).
* `%i` - Entero.
* `%f` - Valor de coma flotante.
* `%j` - JSON. Reemplazado con la string `'[Circular]'` si el argumento contiene referencias circulares.
* `%o` - Objeto. Una representación de string de un objeto con formato de objeto de JavaScript genérico. Similar a `util.inspect()` con las opciones `{ showHidden: true, depth: 4, showProxy: true }`. Esto mostrará el objeto completo, incluyendo los símbolos no enumerables y las propiedades.
* `%O` - Objeto. Una representación de string de un objeto con formato de objeto de JavaScript genérico. Similar a `util.inspect()` sin opciones. Esto mostrará el objeto completo, incluyendo los símbolos no enumerables y las propiedades.
* `%%` - signo de porcentaje individual (`'%'`). Esto no consume un argumento.

Si el placeholder no tiene un argumento correspondiente, no es reemplazado.

```js
util.format('%s:%s', 'foo');
// Retorna: 'foo:%s'
```

Si hay más argumentos pasados al método `util.format()` que el número de placeholders, los argumentos extra son coaccionados en strings, luego concatenados a la string retornada, cada uno delimitado por un espacio. Argumentos excesivos cuyos `typeof` sean `'object'` o `'symbol'` (excepto `null`), serán transformados por `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

Si el primer argumento no es una string, entonces `util.format()` devuelve una string que es la concatenación de todos los argumentos separados por espacios. Cada argumento es convertido a una string utilizando `util.inspect()`.

```js
util.format(1, 2, 3); // '1 2 3'
```

Si solo un argumento es pasado a `util.format()`, este es devuelto tal como está, sin ningún formato.

```js
util.format('%% %s'); // '%% %s'
```

## util.getSystemErrorName(err)

<!-- YAML
added: v8.12.0
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

*Note*: Usage of `util.inherits()` is discouraged. Please use the ES6 `class` and `extends` keywords to get language level inheritance support. Also note that the two styles are [semantically incompatible](https://github.com/nodejs/node/issues/4179).

* `constructor` {Function}
* `superConstructor` {Function}

Inherit the prototype methods from one [constructor](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Object/constructor) into another. El prototipo del `constructor` se establecerá en un nuevo objeto creado a partir de `superConstructor`.

Como una conveniencia adicional, `superConstructor` será accesible por medio de la propiedad `constructor.super_`.

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

Ejemplo de ES6 utilizando `class` y `extends`

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

<!-- YAML
added: v0.3.0
changes:

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

* `object` {any} Cualquier primitivo de JavaScript u Objeto.
* `opciones` {Object} 
  * `showHidden` {boolean} Si es `true`, los símbolos no enumerables y las propiedades de `object` serán incluídos en el resultado formateado. **Default:**`false`.
  * `depth` {number} Especifica el número de veces a repetir mientras se formatea el `object`. Esto es útil para inspeccionar objetos grandes y complicados. Por defecto es `2`. Para hacer que se repita indefinidamente pase `null`.
  * `colors` {boolean} Si es `true`, el output va a ser diseñado con códigos de colores ANSI. Los colores son personalizables, vea [Customizing `util.inspect` colors][]. **Default:**`false`.
  * `customInspect` {boolean} Si es `false`, entonces no se llamarán las funciones `inspect(depth, opts)` personalizadas exportadas en el `object` que se está inspeccionando. **Predeterminado:** `true`.
  * `showProxy` {boolean} Si `true`, entonces los objetos y funciones que son objetos `Proxy` serán analizados para mostrar sus objetos `target` y `handler`. **Predeterminado:** `false`.
  * `maxArrayLength` {number} Especifica el número máximo de los elementos array y `TypedArray` a incluir al formatear. Set to `null` to show all array elements. Set to `0` or negative to show no array elements. **Predeterminado:** `100`.
  * `breakLength` {number} La longitud en la cual las claves de un objeto son divididas a través de múltiples líneas. Establecer en `Infinity` para formatear un objeto como una sola línea. **Predeterminado:** `60` para compatibilidad con versiones anteriores.

El método `util.inspect()` devuelve una representación de string del `objeto` que es principalmente útil para depuración. Se pueden pasar `options` adicionales que alteran ciertos aspectos de la string formateada.

El siguiente ejemplo inspecciona todas las propiedades del objeto `util`:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

Los valores pueden proporcionar sus propias funciones `inspect(depth, opts)` personalizadas, cuando son llamadas estas reciben el `depth` actual en una inspección recursiva, así como también el objeto de opción pasado a `util.inspect()`.

### Personalización de colores `util.inspect`

<!-- type=misc -->

El output de color (si está habilitado) de `util.inspect` es globalmente personalizable a través de las propiedades `util.inspect.styles` y `util.inspect.colors`.

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

Los códigos de colores predeterminados son: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` y `yellow`. También hay códigos `bold`, `italic`, `underline` e `inverse`.

El estilo de color usa códigos de control ANSI que pueden no ser soportados en todas las terminales.

### Funciones de inspección personalizadas en Objetos

<!-- type=misc -->

Objects may also define their own `[util.inspect.custom](depth, opts)` (or the equivalent but deprecated `inspect(depth, opts)`) function that `util.inspect()` will invoke and use the result of when inspecting the object:

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

Las funciones personalizas de `[util.inspect.custom](depth, opts)` usualmente devuelven una string, pero pueden devolver un valor de cualquier tipo, que será formateado de acuerdo a `util.inspect()`.

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
-->

Un Símbolo que puede ser utilizado para declarar funciones de inspección personalizadas, vea [Funciones de inspección personalizadas en Objetos](#util_custom_inspection_functions_on_objects).

### util.inspect.defaultOptions

<!-- YAML
added: v6.4.0
-->

El valor `defaultOptions` permite la personalización de las opciones predeterminadas utilizadas por `util.inspect`. Esto es útil para funciones como `console.log` o `util.format` que implícitamente llaman a `util.inspect`. Debería ser establecido en un objeto conteniendo una o más opciones [`util.inspect()`][] válidas. También se admite establecer directamente propiedades de opciones.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // registra el array truncado
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // registra el array completo
```

## util.promisify(original)

<!-- YAML
added: v8.0.0
-->

* `original` {Function}
* Devuelve: {Function}

Takes a function following the common error-first callback style, i.e. taking a `(err, value) => ...` callback as the last argument, and returns a version that returns promises.

Por ejemplo:

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

If there is an `original[util.promisify.custom]` property present, `promisify` will return its value, see [Custom promisified functions](#util_custom_promisified_functions).

`promisify()` assumes that `original` is a function taking a callback as its final argument in all cases. If `original` is not a function, `promisify()` will throw an error. If `original` is a function but its last argument is not an error-first callback, it will still be passed an error-first callback as its last argument.

### Funciones promisificadas personalizadas

Using the `util.promisify.custom` symbol one can override the return value of [`util.promisify()`][]:

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

This can be useful for cases where the original function does not follow the standard format of taking an error-first callback as the last argument.

For example, with a function that takes in `(foo, onSuccessCallback, onErrorCallback)`:

```js
doSomething[util.promisify.custom] = (foo) => {
  return new Promise((resolve, reject) => {
    doSomething(foo, resolve, reject);
  });
};
```

If `promisify.custom` is defined but is not a function, `promisify()` will throw an error.

### util.promisify.custom

<!-- YAML
added: v8.0.0
-->

* {symbol}

A Symbol that can be used to declare custom promisified variants of functions, see [Custom promisified functions](#util_custom_promisified_functions).

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

Per the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/), the encodings supported by the `TextDecoder` API are outlined in the tables below. For each encoding, one or more aliases may be used.

Diferentes configuraciones de construcción de Node.js soportan diferentes conjuntos de codificaciones. While a very basic set of encodings is supported even on Node.js builds without ICU enabled, support for some encodings is provided only when Node.js is built with ICU and using the full ICU data (see [Internationalization](intl.html)).

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

*Note*: The `'iso-8859-16'` encoding listed in the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) is not supported.

### nuevo TextDecoder([encoding[, options]])

* `encoding` {string} Identifies the `encoding` that this `TextDecoder` instance supports. **Predeterminado:** `'utf-8'`.
* `options` {Object} 
  * `fatal` {boolean} `true` si las fallas de decodificación son fatales. This option is only supported when ICU is enabled (see [Internationalization](intl.html)). **Predeterminado:** `false`.
  * `ignoreBOM` {boolean} When `true`, the `TextDecoder` will include the byte order mark in the decoded result. When `false`, the byte order mark will be removed from the output. This option is only used when `encoding` is `'utf-8'`, `'utf-16be'` or `'utf-16le'`. **Predeterminado:** `false`.

Crea una nueva instancia `TextDecoder`. The `encoding` may specify one of the supported encodings or an alias.

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or Typed Array instance containing the encoded data.
* `options` {Object} 
  * `stream` {boolean} `true` si pedazos adicionales de datos son esperados. **Predeterminado:** `false`.
* Devuelve: {string}

Decodifica el `input` y devuelve un string. If `options.stream` is `true`, any incomplete byte sequences occurring at the end of the `input` are buffered internally and emitted after the next call to `textDecoder.decode()`.

If `textDecoder.fatal` is `true`, decoding errors that occur will result in a `TypeError` being thrown.

### textDecoder.encoding

* {string}

La codificación soportada por la instancia `TextDecoder`.

### textDecoder.fatal

* {boolean}

The value will be `true` if decoding errors result in a `TypeError` being thrown.

### textDecoder.ignoreBOM

* {boolean}

The value will be `true` if the decoding result will include the byte order mark.

## Clase: util.TextEncoder

<!-- YAML
added: v8.3.0
-->

Una implementación de la API `TextDecoder` del [Estándar de Codificación WHATWG](https://encoding.spec.whatwg.org/). All instances of `TextEncoder` only support UTF-8 encoding.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} El texto para codificar. **Predeterminado:** un string vacío.
* Devuelve: {Uint8Array}

UTF-8 encodes the `input` string and returns a `Uint8Array` containing the encoded bytes.

### textEncoder.encoding

* {string}

La codificación soportada por la instancia `TextEncoder`. Siempre configurado para `'utf-8'`.

## APIs Desaprobadas

Las siguientes APIs han sido desaprobadas y ya no deberían ser usadas. Las aplicaciones y módulos existentes deberían actualizarse para encontrar enfoques alternativos.

### util.\_extend(target, source)

<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Object.assign()`] en su lugar.

El método `util._extend()` nunca fue pensado para ser utilizado fuera de los módulos internos de Node.js. La comunidad lo encontró y lo utilizó de todas maneras.

Está desaprobado y no debería utilizarse en códigos nuevos. JavaScript viene con funcionabilidades incorporadas muy similares por medio de [`Object.assign()`].

### util.debug(string)

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Utilice [`console.error()`][] en su lugar.

* `string` {string} El mensaje para imprimir en `stderr`

Predecesor desaprobado de `console.error`.

### util.error([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Utilice [`console.error()`][] en su lugar.

* `...strings` {string} El mensaje para imprimir en `stderr`

Predecesor desaprobado de `console.error`.

### util.isArray(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Alias interno para [`Array.isArray`][].

Devuelve `true` si el `object` dado es un `Array`. De lo contrario, devuelve `false`.

```js
const util = require('util');

util.isArray([]);
// Devuelve: true
util.isArray(new Array());
// Devuelve: true
util.isArray({});
// Devuelve: false
```

### util.isBoolean(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Devuelve `true` si el `object` dado es un `Boolean`. De lo contrario, retorna `false`.

```js
const util = require('util');

util.isBoolean(1);
// Devuelve: false
util.isBoolean(0);
// Devuelve: false
util.isBoolean(false);
// Devuelve: true
```

### util.isBuffer(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.isBuffer()`][] en su lugar.

* `object` {any}

Devuelve `true` si el `object` dado es un `Buffer`. De lo contrario, retorna `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Devuelve: false
util.isBuffer([]);
// Devuelve: false
util.isBuffer(Buffer.from('hello world'));
// Devuelve: true
```

### util.isDate(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Devuelve `true` si el `object` dado es una `Date`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isDate(new Date());
// Devuelve: true
util.isDate(Date());
// false (sin 'new' devuelve un String)
util.isDate({});
// Devuelve: false
```

### util.isError(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Devuelve `true` si el `object` dado es un [`Error`][]. De lo contrario, devuelve `false`.

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

### util.isFunction(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Devuelve `true` si el `object` dado es una `Function`. De lo contrario, devuelve `false`.

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

### util.isNull(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Devuelve `true` si el `object` es estrictamente `null`. De lo contrario, devuelve `false`.

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

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `object` dado es `null` o `undefined`. De lo contrario, devuelve `false`.

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

> Estabilidad: 0 - Desaprobado

* `object` {any}

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

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `objeto` dado es estrictamente un `Object` **y** no una `Function`. De otra manera, devuelve `false`.

```js
const util = require('util');

util.isObject(5);
// Devuelve: false
util.isObject(null);
// Devuelve: false
util.isObject({});
// Devuelve: true
util.isObject(function() {});
// Devuelve: false
```

### util.isPrimitive(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `object` dado es un tipo primitivo. De lo contrario, devuelve `false`.

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
util.isPrimitive(() = {});
// Devuelve: false
util.isPrimitive(/^$/);
// Devuelve: false
util.isPrimitive(new Date());
// Devuelve: false
```

### util.isRegExp(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `object` dado es una `RegExp`. De lo contrario, devuelve `false`.

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

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `object` dado es una `string`. De lo contrario, devuelve `false`.

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

### util.isSymbol(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `object` dado es un `Symbol`. De lo contrario, devuelve `false`.

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

> Estabilidad: 0 - Desaprobado

* `object` {any}

Devuelve `true` si el `object` dado es `undefined`. De lo contrario, devuelve `false`.

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

### util.log(string)

<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice un módulo de terceros en su lugar.

* `string` {string}

El método `util.log()` imprime la `string` dada en `stdout` con una marca de tiempo incluída.

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Utilice [`console.log()`][] en su lugar.

Predecesor desaprobado de `console.log`.

### util.puts([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Utilice [`console.log()`][] en su lugar.

Predecesor desaprobado de `console.log`.