# Util

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

The `util` module is primarily designed to support the needs of Node.js' own internal APIs. However, many of the utilities are useful for application and module developers as well. Se puede acceder a él utilizando:

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

* `section` {string} A string identifying the portion of the application for which the `debuglog` function is being created.
* Retorna: {Function} La función de registro

The `util.debuglog()` method is used to create a function that conditionally writes debug messages to `stderr` based on the existence of the `NODE_DEBUG` environment variable. If the `section` name appears within the value of that environment variable, then the returned function operates similar to [`console.error()`][]. Si no, entonces la función retornada es un no-op.

For example:

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

If this program is run with `NODE_DEBUG=foo` in the environment, then it will output something like:

```txt
FOO 3245: hello from foo [123]
```

donde `3245` es la identificación del proceso. If it is not run with that environment variable set, then it will not print anything.

Multiple comma-separated `section` names may be specified in the `NODE_DEBUG` environment variable. Por ejemplo: `NODE_DEBUG=fs,net,tls`.

## util.deprecate(function, string)

<!-- YAML
added: v0.8.0
-->

The `util.deprecate()` method wraps the given `function` or class in such a way that it is marked as deprecated.

```js
const util = require('util');

exports.puts = util.deprecate(function() {
  for (let i = 0, len = arguments.length; i < len; ++i) {
    process.stdout.write(arguments[i] + '\n');
  }
}, 'util.puts: Use console.log instead');
```

When called, `util.deprecate()` will return a function that will emit a `DeprecationWarning` using the `process.on('warning')` event. By default, this warning will be emitted and printed to `stderr` exactly once, the first time it is called. After the warning is emitted, the wrapped `function` is called.

If either the `--no-deprecation` or `--no-warnings` command line flags are used, or if the `process.noDeprecation` property is set to `true` *prior* to the first deprecation warning, the `util.deprecate()` method does nothing.

If the `--trace-deprecation` or `--trace-warnings` command line flags are set, or the `process.traceDeprecation` property is set to `true`, a warning and a stack trace are printed to `stderr` the first time the deprecated function is called.

If the `--throw-deprecation` command line flag is set, or the `process.throwDeprecation` property is set to `true`, then an exception will be thrown when the deprecated function is called.

The `--throw-deprecation` command line flag and `process.throwDeprecation` property take precedence over `--trace-deprecation` and `process.traceDeprecation`.

## util.format(format[, ...args])<!-- YAML
added: v0.5.3
changes:

  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->

* `format` {string} Un formato de string parecido a `printf`.

The `util.format()` method returns a formatted string using the first argument as a `printf`-like format.

El primer argumento es una string que contiene cero o más tokens de *placeholder*. Each placeholder token is replaced with the converted value from the corresponding argument. Los placeholders soportados son:

* `%s` - String.
* `%d` - Número (valor entero o punto flotante).
* `%i` - Entero.
* `%f` - Valor de coma flotante.
* `%j` - JSON. Replaced with the string `'[Circular]'` if the argument contains circular references.
* `%o` - Objeto. A string representation of an object with generic JavaScript object formatting. Similar a `util.inspect()` con las opciones `{ showHidden: true, depth: 4, showProxy: true }`. Esto mostrará el objeto completo, incluyendo los símbolos no enumerables y las propiedades.
* `%O` - Objeto. A string representation of an object with generic JavaScript object formatting. Similar a `util.inspect()` sin opciones. Esto mostrará el objeto completo, incluyendo los símbolos no enumerables y las propiedades.
* `%%` - signo de porcentaje individual (`'%'`). Esto no consume un argumento.

If the placeholder does not have a corresponding argument, the placeholder is not replaced.

```js
util.format('%s:%s', 'foo');
// Retorna: 'foo:%s'
```

If there are more arguments passed to the `util.format()` method than the number of placeholders, the extra arguments are coerced into strings then concatenated to the returned string, each delimited by a space. Excessive arguments whose `typeof` is `'object'` or `'symbol'` (except `null`) will be transformed by `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

If the first argument is not a string then `util.format()` returns a string that is the concatenation of all arguments separated by spaces. Cada argumento es convertido a una string utilizando `util.inspect()`.

```js
util.format(1, 2, 3); // '1 2 3'
```

If only one argument is passed to `util.format()`, it is returned as it is without any formatting.

```js
util.format('%% %s'); // '%% %s'
```

## util.getSystemErrorName(err)<!-- YAML
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

## util.inherits(constructor, superConstructor)<!-- YAML
added: v0.3.0
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3455
    description: The `constructor` parameter can refer to an ES6 class now.
-->

*Note*: Usage of `util.inherits()` is discouraged. Please use the ES6 `class` and `extends` keywords to get language level inheritance support. Also note that the two styles are [semantically incompatible](https://github.com/nodejs/node/issues/4179).

* `constructor` {Function}
* `superConstructor` {Function}

Herede los métodos prototipo de un [constructor](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Object/constructor) a otro. The prototype of `constructor` will be set to a new object created from `superConstructor`.

As an additional convenience, `superConstructor` will be accessible through the `constructor.super_` property.

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

## util.inspect(object[, options])<!-- YAML
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
  * `showHidden` {boolean} If `true`, the `object`'s non-enumerable symbols and properties will be included in the formatted result. **Default:**`false`.
  * `depth` {number} Specifies the number of times to recurse while formatting the `object`. Esto es útil para inspeccionar objetos grandes y complicados. Por defecto es `2`. Para hacer que se repita indefinidamente pase `null`.
  * `colors` {boolean} If `true`, the output will be styled with ANSI color codes. Los colores son personalizables, vea [Customizing `util.inspect` colors][]. **Default:**`false`.
  * `customInspect` {boolean} If `false`, then custom `inspect(depth, opts)` functions exported on the `object` being inspected will not be called. **Predeterminado:** `true`.
  * `showProxy` {boolean} If `true`, then objects and functions that are `Proxy` objects will be introspected to show their `target` and `handler` objects. **Predeterminado:** `false`.
  * `maxArrayLength` {number} Specifies the maximum number of array and `TypedArray` elements to include when formatting. Set to `null` to show all array elements. Set to `0` or negative to show no array elements. **Predeterminado:** `100`.
  * `breakLength` {number} The length at which an object's keys are split across multiple lines. Set to `Infinity` to format an object as a single line. **Predeterminado:** `60` para compatibilidad con versiones anteriores.

The `util.inspect()` method returns a string representation of `object` that is primarily useful for debugging. Additional `options` may be passed that alter certain aspects of the formatted string.

El siguiente ejemplo inspecciona todas las propiedades del objeto `util`:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

Values may supply their own custom `inspect(depth, opts)` functions, when called these receive the current `depth` in the recursive inspection, as well as the options object passed to `util.inspect()`.

### Customizing `util.inspect` colors<!-- type=misc -->Color output (if enabled) of 

`util.inspect` is customizable globally via the `util.inspect.styles` and `util.inspect.colors` properties.

`util.inspect.styles` is a map associating a style name to a color from `util.inspect.colors`.

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

The predefined color codes are: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` and `yellow`. There are also `bold`, `italic`, `underline` and `inverse` codes.

Color styling uses ANSI control codes that may not be supported on all terminals.

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

Custom `[util.inspect.custom](depth, opts)` functions typically return a string but may return a value of any type that will be formatted accordingly by `util.inspect()`.

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Devuelve: "{ bar: 'baz' }"
```

### util.inspect.custom<!-- YAML
added: v6.6.0
-->A Symbol that can be used to declare custom inspect functions, see 

[Custom inspection functions on Objects](#util_custom_inspection_functions_on_objects).

### util.inspect.defaultOptions<!-- YAML
added: v6.4.0
-->The 

`defaultOptions` value allows customization of the default options used by `util.inspect`. This is useful for functions like `console.log` or `util.format` which implicitly call into `util.inspect`. It shall be set to an object containing one or more valid [`util.inspect()`][] options. Setting option properties directly is also supported.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // registra el array truncado
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // registra el array completo
```

## util.promisify(original)<!-- YAML
added: v8.0.0
-->

* `original` {Function}

* Devuelve: {Function}

Takes a function following the common error-first callback style, i.e. taking a `(err, value) => ...` callback as the last argument, and returns a version that returns promises.

For example:

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

Por ejemplo, con una función que tome `(foo, onSuccessCallback, onErrorCallback)`:

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

## Class: util.TextDecoder<!-- YAML
added: v8.3.0
-->An implementation of the 

[WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) `TextDecoder` API.

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

Las siguientes APIs han sido desaprobadas y ya no deberían ser usadas. Existing applications and modules should be updated to find alternative approaches.

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->> Stability: 0 - Deprecated: Use [

`Object.assign()`] instead.

The `util._extend()` method was never intended to be used outside of internal Node.js modules. La comunidad lo encontró y lo utilizó de todas maneras.

Está desaprobado y no debería ser usado en código nuevo. JavaScript comes with very similar built-in functionality through [`Object.assign()`].

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.error()`][] instead.

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

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated

* `object` {any}

Alias interno para [`Array.isArray`][].

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
-->> Stability: 0 - Deprecated

* `object` {any}

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

### util.isBuffer(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.isBuffer()`][] en su lugar.

* `object` {any}

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
-->> Stability: 0 - Deprecated

* `object` {any}

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

### util.isError(object)

<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

Devuelve `true` si el `object` dado es un [`Error`][]. De lo contrario, retorna `false`.

```js
const util = require('util');

util.isError(new Error());
// Devuelve: true
util.isError(new TypeError());
// Devuelve: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Devuelve: false
```

Tenga en cuenta que este método depende del comportamiento de `Object.prototype.toString()`. It is possible to obtain an incorrect result when the `object` argument manipulates `@@toStringTag`.

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
-->> Stability: 0 - Deprecated

* `object` {any}

Devuelve `true` si el `object` dado es una `Function`. De lo contrario, retorna `false`.

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

Devuelve `true` si el `object` es estrictamente `null`. De lo contrario, retorna `false`.

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

> Estabilidad: 0 - Desactualización

* `object` {any}

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

> Estabilidad: 0 - Desactualización

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

> Estabilidad: 0 - Desactualización

* `object` {any}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function`. De otra manera, devuelve `false`.

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

> Estabilidad: 0 - Desactualización

* `object` {any}

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
util.isPrimitive(() = {});
// Devuelve: false
util.isPrimitive(/^$/);
// Devuelve: false
util.isPrimitive(new Date());
// Devuelve: false
```

### util.isRegExp(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stability: 0 - Deprecated

* `object` {any}

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

### util.isString(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stability: 0 - Deprecated

* `object` {any}

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

### util.isSymbol(object)

<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Estabilidad: 0 - Desactualización

* `object` {any}

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

> Estabilidad: 0 - Desactualización

* `object` {any}

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
-->> Stability: 0 - Deprecated: Use a third party module instead.

* `string` {string}

The `util.log()` method prints the given `string` to `stdout` with an included timestamp.

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stability: 0 - Deprecated: Use [

`console.log()`][] instead.

Predecesor desaprobado de `console.log`.

### util.puts([...strings])

<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: En cambio, use [`console.log()`][].

Predecesor desaprobado de `console.log`.