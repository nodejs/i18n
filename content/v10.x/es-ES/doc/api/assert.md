# Afirmación

<!--introduced_in=v0.1.21-->

> Estabilidad: 2 - Estable

El módulo `assert` provee un conjunto simple de pruebas de aserción que pueden ser usados para probar invariantes.

Existe un modo `strict` y un modo `legacy`, pero se recomiendo utilizar solo el [`strict mode`][].

Para mayor información acerca de las comparaciones de igualdad utilizadas vea la [MDN's guide on equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Clase: assert.AssertionError

Una subclase de `Error` que indica un fallo en una afirmación. All errors thrown by the `assert` module will be instances of the `AssertionError` class.

### new assert.AssertionError(opciones)

<!-- YAML
added: v0.1.21
-->

* `opciones` {Object} 
  * `message` {string} If provided, the error message is going to be set to this value.
  * `actual` {any} The `actual` property on the error instance is going to contain this value. Internally used for the `actual` error input in case e.g., [`assert.strictEqual()`] is used.
  * `expected` {any} The `expected` property on the error instance is going to contain this value. Internally used for the `expected` error input in case e.g., [`assert.strictEqual()`] is used.
  * `operator` {string} The `operator` property on the error instance is going to contain this value. Internally used to indicate what operation was used for comparison (or what assertion function triggered the error).
  * `stackStartFn` {Function} If provided, the generated stack trace is going to remove all frames up to the provided function.

Una subclase de `Error` que indica la falla de una afirmación.

All instances contain the built-in `Error` properties (`message` and `name`) and:

* `actual` {any} Set to the actual value in case e.g., [`assert.strictEqual()`] is used.
* `expected` {any} Set to the expected value in case e.g., [`assert.strictEqual()`] is used.
* `generatedMessage` {boolean} Indicates if the message was auto-generated (`true`) or not.
* `code` {string} This is always set to the string `ERR_ASSERTION` to indicate that the error is actually an assertion error.
* `operator` {string}. Establecer en el valor del operador pasado.

```js
const assert = require('assert');

//Generar un AssertionError para comparar el mensaje después:
const { message } = new assert.AssertionError({
  actual: 1,
  expected: 2,
  operator: 'strictEqual'
});

//Verificar la salida del error:
try {
  assert.strictEqual(1, 2);
} catch (err) {
  assert(err instanceof assert.AssertionError);
  assert.strictEqual(err.message, message);
  assert.strictEqual(err.name, 'AssertionError [ERR_ASSERTION]');
  assert.strictEqual(err.actual, 1);
  assert.strictEqual(err.expected, 2);
  assert.strictEqual(err.code, 'ERR_ASSERTION');
  assert.strictEqual(err.operator, 'strictEqual');
  assert.strictEqual(err.generatedMessage, true);
}
```

## Modo estricto

<!-- YAML
added: v9.9.0
changes:

  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/17615
    description: Added error diffs to the strict mode
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

On top of that, error messages which involve objects produce an error diff instead of displaying both objects. Ese no es el caso para el modo legado.

Puede ser accedido utilizando:

```js
const assert = require('assert').strict;
```

Ejemplo de error diff:

```js
const assert = require('assert').strict;

assert.deepEqual ([[[1, 2, 3]], 4, 5], [[[1, 2, '3']], 4,5]);
// AssertionError: Input A se espera que la entrada sea estrictamente igual B:
// + esperado - actual ...  Lineas saltadas
//
//   [
//     [
// ...
//       2,
// -     3
// +     '3'
//     ],
// ...
//     5
//   ]
```

Para desactivar los colores, use la variable de entorno `NODE_DISABLE_COLORS`. Por favor, note que esto también desactivará los colores en el REPL.

## Modo legado

> Estabilidad: 0 - Obsoleto: Utilice el modo estricto en su lugar.

Al acceder a `assert` directamente en lugar de utilizar la propiedad `strict`, la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) será utilizada para cualquier función sin el "strict" en su nombre, como [`assert.deepEqual()`][].

Puede ser accedido utilizando:

```js
const assert = require('assert');
```

Se recomienda usar el [`strict mode`][] en su lugar ya que la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) a menudo puede obtener resultados sorprendentes. This is especially true for [`assert.deepEqual()`][], where the comparison rules are lax:

```js
// ADVERTENCIA: ¡Esto no arroja un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])

<!-- YAML
added: v0.5.9
-->

* `value` {any} The input that is checked for being truthy.
* `message` {string|Error}

Un alias de [`assert.ok()`][].

## assert.deepEqual(actual, expected[, message])

<!-- YAML
added: v0.1.21
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15001
    description: The `Error` names and messages are now properly compared
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: The `Set` and `Map` content is also compared
  - version: v6.4.0, v4.7.1
    pr-url: https://github.com/nodejs/node/pull/8002
    description: Typed array slices are handled correctly now.
  - version: v6.1.0, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6432
    description: Objects with circular references can be used as inputs now.
  - version: v5.10.1, v4.4.3
    pr-url: https://github.com/nodejs/node/pull/5910
    description: Handle non-`Uint8Array` typed arrays correctly.
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}

**Modo estricto**

Un alias de [`assert.deepStrictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.deepStrictEqual()`][] en su lugar.

Pruebas para igualdad profunda entre los parámetros `actual` y `expected`. Primitive values are compared with the [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Sólo se consideran las [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects or enumerable own [`Symbol`][] properties. For such checks, consider using [`assert.deepStrictEqual()`][] instead. [`assert.deepEqual()`][] puede obtener resultados potencialmente sorprendentes. The following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
// ADVERTENCIA: ¡Esto no arroja un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Se hace una excepción para [`Map`][] y para [`Set`][]. `Map`s and `Set`s have their contained items compared too, as expected.

Igualdad "profunda" significa que las propiedades enumerables "propias" de los objetos secundarios también son evaluadas:

```js
const assert = require('assert');

const obj1 = {
  a: {
    b: 1
  }
};
const obj2 = {
  a: {
    b: 2
  }
};
const obj3 = {
  a: {
    b: 1
  }
};
const obj4 = Object.create(obj1);

assert.deepEqual(obj1, obj1);
// OK

// Values of b are different:
assert.deepEqual(obj1, obj2);
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }

assert.deepEqual(obj1, obj3);
// OK

// Prototypes are ignored:
assert.deepEqual(obj1, obj4);
// AssertionError: { a: { b: 1 } } deepEqual {}
```

Si los valores no son iguales, un `AssertionError` es lanzado con un `message` indicando que la propiedad fue colocada al valor del parámetro del `message`. Si el parámetro `message` es indefinido, un error predeterminado es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.deepStrictEqual(actual, expected[, message])

<!-- YAML
added: v1.2.0
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15169
    description: Enumerable symbol properties are now compared.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15036
    description: The `NaN` is now compared using the
              [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero)
              comparison.
  - version: v8.5.0
    pr-url: https://github.com/nodejs/node/pull/15001
    description: The `Error` names and messages are now properly compared
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: The `Set` and `Map` content is also compared
  - version: v6.4.0, v4.7.1
    pr-url: https://github.com/nodejs/node/pull/8002
    description: Typed array slices are handled correctly now.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6432
    description: Objects with circular references can be used as inputs now.
  - version: v5.10.1, v4.4.3
    pr-url: https://github.com/nodejs/node/pull/5910
    description: Handle non-`Uint8Array` typed arrays correctly.
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Pruebas para igualdad profunda entre los parámetros `actual` y `expected`. "Deep" equality means that the enumerable "own" properties of child objects are recursively evaluated also by the following rules.

### Detalles de compración

* Primitive values are compared using the [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue), used by [`Object.is()`][].
* Las [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) de objetos deben ser las mismas.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Sólo se consideran las [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* [`Error`][] names and messages are always compared, even if these are not enumerable properties.
* Las propiedades [`Symbol`][] enumerables propias también son comparadas.
* [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) son comparados como objetos y como valores desenvueltos.
* Las propiedades `Object` son comparadas sin orden.
* Las claves de `Map` y los artículos de `Set` son comparados sin orden.
* Recursion stops when both sides differ or both sides encounter a circular reference.
* La comparación de [`WeakMap`][] y [`WeakSet`][] no depende de sus valores. See below for further details.

```js
const assert = require('assert').strict;

// Esto falla porque 1 !== '1'.
assert.deepStrictEqual({ a: 1 }, { a: '1' });
// AssertionError: Input A se espera que la entrada sea estrictamente igual B:
// + espera - actual
//   {
// -   a: 1
// +   a: '1'
//   }

// Los siguientes objetos no tienen propiedades propias
const date = new Date();
const object = {};
const fakeDate = {};
Object.setPrototypeOf(fakeDate, Date.prototype);

// Different [[Prototype]]:
assert.deepStrictEqual(object, fakeDate);
// AssertionError: Input A se espera que la entrada sea estrictamente igual B:
// + espera - actual
// - {}
// + Date {}

// Etiquetas de diferentes tipos:
assert.deepStrictEqual(date, fakeDate);
// AssertionError: Input A se espera que la entrada sea estrictamente igual 
B:
// + espera - actual
// - 2018-04-26T00:49:08.604Z
// + Date {}

assert.deepStrictEqual(NaN, NaN);
// Ok, debido a la comparación SameValue

// Diferentes números sin abrir:
assert.deepStrictEqual(nuevo Número(1), nuevo Número(2));
// AssertionError: Input A se espera que la entrada sea estrictamente igual 
B:
// + espera - actual
// - [Number: 1]
// + [Number: 2]

assert.deepStrictEqual(new String('foo'), Object('foo'));
// Ok porque el objeto y la cadena son idénticos cuando se desenvuelven.

assert.deepStrictEqual(-0, -0);
// Aceptar

// Diferentes ceros usando la Comparación SameValue:
verificar. eepStrictEqual(0, -0);
// AssertionError: Input A esperaba que la entrada B:
// + esperada - actual
// - 0
// + -0

const symbol1 = Symbol();
const symbol2 = Symbol();
assert. eepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 });
// OK, porque es el mismo símbolo en ambos objetos.
aserto. eepStrictEqual({ [symbol1]: 1 }, { [symbol2]: 1 });
// AssertionError [ERR_ASSERTION]: objetos de entrada no idénticos:
// {
// [Symbol()]: 1
// }

const weakMap1 = new WeakMap();
const weakMap2 = new WeakMap([[{}, {}]]);
const weakMap3 = new WeakMap();
weakMap3. nequal = true;

comprobante. eepStrictEqual(weakMap1, weakMap2);
// Vale, porque es imposible comparar las entradas

// Falla porque weakMap3 tiene una propiedad que weakMap1 no contiene:
aserto. eepStrictEqual(weakMap1, weakMap3);
// AssertionError: Input A expected to strictly deep-equal input B:
// + esperado - real
// WeakMap {
// - [items unknown]
// + [items unknown],
// + desigual: true
// }
```

Si los valores no son iguales, un `AssertionError` es lanzado con un `message` indicando que la propiedad fue colocada al valor del parámetro del `message`. Si el parámetro `message` es indefinido, un error predeterminado es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.doesNotReject(asyncFn\[, error\]\[, message\])

<!-- YAML
added: v10.0.0
-->

* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. If the function does not return a promise, `assert.doesNotReject()` will return a rejected `Promise` with an [`ERR_INVALID_RETURN_VALUE`][] error. In both cases the error handler is skipped.

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

If specified, `error` can be a [`Class`][], [`RegExp`][] or a validation function. Vea [`assert.throws()`][] para más detalles.

Besides the async nature to await the completion behaves identically to [`assert.doesNotThrow()`][].

```js
(async () => {
  await assert.doesNotReject(
    async () => {
      throw new TypeError('Wrong value');
    },
    SyntaxError
  );
})();
```

```js
assert.doesNotReject(Promise.reject(new TypeError('Wrong value')))
  .then(() => {
    // ...
  });
```

## assert.doesNotThrow(fn\[, error\]\[, message\])

<!-- YAML
added: v0.1.21
changes:

  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/2407
    description: The `message` parameter is respected now.
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3276
    description: The `error` parameter can now be an arrow function.
-->

* `fn` {Function}
* `error` {RegExp|Function}
* `message` {string}

Asserts that the function `fn` does not throw an error.

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. Instead, consider adding a comment next to the specific code path that should not throw and keep error messages as expressive as possible.

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

Si un error es arrojado y es del mismo tipo como el especificado por el parámetro `error`, entonces un `AssertionError` es arrojado. Si un error es de un tipo diferente, o si el parámetro `error` es indefinido, el error se propaga de nuevo a la persona que llama a la función.

If specified, `error` can be a [`Class`][], [`RegExp`][] or a validation function. Vea [`assert.throws()`][] para más detalles.

Lo siguiente, por ejemplo, arroja el [`TypeError`][] porque no hay un error de emparejamiento de tipos en la aserción:

<!-- eslint-disable no-restricted-syntax -->

```js
assert.doesNotThrow(
   () => {
     throw new TypeError('Wrong value');
   },   
SyntaxError 
);
```

However, the following will result in an `AssertionError` with the message 'Got unwanted exception...':

<!-- eslint-disable no-restricted-syntax -->

```js
assert.doesNotThrow(
   () => {
     throw new TypeError('Wrong value');
   },   
TypeError 
);
```

Si un 0>AssertionError</code> es arrojado y un valor es provisto por el parámetro `message`, el valor de `message` será agregado al mensaje de `AssertionError`:

<!-- eslint-disable no-restricted-syntax -->

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  /Wrong value/,
  'Whoops'
);
// Arroja: AssertionError: Se obtuvo una excepción no deseada: Ups
```

## assert.equal(actual, expected[, message])

<!-- YAML
added: v0.1.21
-->

* `actual` {any}
* `expected`{any}
* `message` {string|Error}

**Modo estricto**

Un alias de [`assert.strictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.strictEqual()`][] en su lugar.

Tests shallow, coercive equality between the `actual` and `expected` parameters using the [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

```js
const assert = require('assert');

assert.equal(1, 1);
// OK, 1 == 1
assert.equal(1, '1');
// OK, 1 == '1'

assert.equal(1, 2);
// AssertionError: 1 == 2
assert.equal({ a: { b: 1 } }, { a: { b: 1 } });
// AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Si los valores no son iguales, un `AssertionError` es lanzado con un `message` indicando que la propiedad fue colocada al valor del parámetro del `message`. Si el parámetro `message` es indefinido, un error predeterminado es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.fail([message])

<!-- YAML
added: v0.1.21
-->

* `message` {string|Error} **Default:** `'Failed'`

Throws an `AssertionError` with the provided error message or a default error message. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

```js
const assert = require('assert').strict;

assert.fail();
// AssertionError [ERR_ASSERTION]: Fallido

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail(new TypeError('need array'));
// TypeError: se necesita un array
```

El uso de `assert.fail()` con más de dos argumentos es posible, pero está obsoleto. Vea abajo para más detalles.

## assert.fail(actual, expected[, message[, operator[, stackStartFn]]])

<!-- YAML
added: v0.1.21
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18418
    description: Calling `assert.fail()` with more than one argument is
                 deprecated and emits a warning.
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}
* `operador` {string} **Predeterminado:** `'!='`
* `stackStartFn` {Function} **Default:** `assert.fail`

> Stability: 0 - Deprecated: Use `assert.fail([message])` or other assert functions instead.

If `message` is falsy, the error message is set as the values of `actual` and `expected` separated by the provided `operator`. If just the two `actual` and `expected` arguments are provided, `operator` will default to `'!='`. If `message` is provided as third argument it will be used as the error message and the other arguments will be stored as properties on the thrown object. If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). If no arguments are given, the default message `Failed` will be used.

```js
const assert = require('assert').strict;

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: fallido

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: ups

assert.fail(1, 2, new TypeError('need array'));
// TypeError: se necesita un array
```

In the last three cases `actual`, `expected`, and `operator` have no influence on the error message.

Example use of `stackStartFn` for truncating the exception's stacktrace:

```js
function suppressFrame() {
  assert.fail('a', 'b', undefined, '!==', suppressFrame);
}
suppressFrame();
// AssertionError [ERR_ASSERTION]: 'a' !== 'b'
//     at repl:1:1
//     at ContextifyScript.Script.runInThisContext (vm.js:44:33)
//     ...
```

## assert.ifError(value)

<!-- YAML
added: v0.1.97
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18247
    description: Instead of throwing the original error it is now wrapped into
                 an `AssertionError` that contains the full stack trace.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18247
    description: Value may now only be `undefined` or `null`. Before all falsy
                 values were handled the same as `null` and did not throw.
-->

* `value` {any}

Arroja `value` si el `value` está `undefined` o `null`. This is useful when testing the `error` argument in callbacks. The stack trace contains all frames from the error passed to `ifError()` including the potential new frames for `ifError()` itself.

```js
const assert = require('assert').strict;

assert.ifError(null);
// OK
assert.ifError(0);
// AssertionError [ERR_ASSERTION]: ifError obtuvo una excepción no deseada: 0
assert.ifError('error');
// AssertionError [ERR_ASSERTION]: ifError obtuvo una excepción no deseada: 'error'
assert.ifError(new Error());
// AssertionError [ERR_ASSERTION]: ifError obtuvo una excepción no deseada: Error

// Cree algunos marcos de error aleatorios.
let err;
(function errorFrame() {
  err = new Error('test error');
})();

(function ifErrorFrame() {
  assert.ifError(err);
})();
// AssertionError [ERR_ASSERTION]: ifError obtuvo una excepción no deseada: error de prueba
//     en ifErrorFrame
//     en errorFrame
```

## assert.notDeepEqual(actual, expected[, message])

<!-- YAML
added: v0.1.21
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15001
    description: The `Error` names and messages are now properly compared
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: The `Set` and `Map` content is also compared
  - version: v6.4.0, v4.7.1
    pr-url: https://github.com/nodejs/node/pull/8002
    description: Typed array slices are handled correctly now.
  - version: v6.1.0, v4.5.0
    pr-url: https://github.com/nodejs/node/pull/6432
    description: Objects with circular references can be used as inputs now.
  - version: v5.10.1, v4.4.3
    pr-url: https://github.com/nodejs/node/pull/5910
    description: Handle non-`Uint8Array` typed arrays correctly.
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}

**Modo estricto**

Un alias de [`assert.notDeepStrictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.notDeepStrictEqual()`][] en su lugar.

Realiza una prueba por cualquier desigualdad profunda. Opuesto de [`assert.deepEqual()`][].

```js
const assert = require('assert');

const obj1 = {
  a: {
    b: 1
  }
};
const obj2 = {
  a: {
    b: 2
  }
};
const obj3 = {
  a: {
    b: 1
  }
};
const obj4 = Object.create(obj1);

assert.notDeepEqual(obj1, obj1);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj2);
// OK

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK
```

Si los valores son profundamente iguales, un `AssertionError` es arrojado con una propiedad `message` colocada igual al valor del parámetro `message`. Si el parámetro `message` es indefinido, un error predeterminado es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.notDeepStrictEqual(actual, expected[, message])

<!-- YAML
added: v1.2.0
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15398
    description: The `-0` and `+0` are not considered equal anymore.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15036
    description: The `NaN` is now compared using the
              [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero)
              comparison.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15001
    description: The `Error` names and messages are now properly compared
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: The `Set` and `Map` content is also compared
  - version: v6.4.0, v4.7.1
    pr-url: https://github.com/nodejs/node/pull/8002
    description: Typed array slices are handled correctly now.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6432
    description: Objects with circular references can be used as inputs now.
  - version: v5.10.1, v4.4.3
    pr-url: https://github.com/nodejs/node/pull/5910
    description: Handle non-`Uint8Array` typed arrays correctly.
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Pruebas por desigualdades profundas estrictas. Opuesto de [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

If the values are deeply and strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Si el parámetro `message` es indefinido, un mensaje predeterminado de error es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.notEqual(actual, expected[, message])

<!-- YAML
added: v0.1.21
-->

* `actual` {any}
* `expected`{any}
* `message` {string|Error}

**Modo estricto**

Un alias de [`assert.notStrictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.notStrictEqual()`][] en su lugar.

Tests shallow, coercive inequality with the [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `!=` ).

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1');
// AssertionError: 1 != '1'
```

If the values are equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.notStrictEqual(actual, expected[, message])

<!-- YAML
added: v0.1.21
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Tests strict inequality between the `actual` and `expected` parameters as determined by the [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Entrada idéntica pasada a notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

If the values are strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Si el parámetro `message` es indefinido, un error predeterminado es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.ok(value[, message])

<!-- YAML
added: v0.1.21
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->

* `value` {any}
* `message` {string|Error}

Prueba si el `value` es truthy. Es equivalente a `assert.equal(!!value, true, message)`.

Si `value` no es verdadero, un `AssertionError` es arrojado con una propiedad `message` colocada igual al valor del parámetro `message`. Si el parámetro `message` es `undefined`, un mensaje de error predeterminado es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`. If no arguments are passed in at all `message` will be set to the string: ``'No value argument passed to `assert.ok()`'``.

Be aware that in the `repl` the error message will be different to the one thrown in a file! Vea abajo para más detalles.

```js
const assert = require('assert').strict;

assert.ok(true);
// OK
assert.ok(1);
// OK

assert.ok();
// AssertionError: No se pasó ningún argumento válido a `assert.ok()`

assert.ok(false, 'it\'s false');
// AssertionError: es falso

// In the repl:
assert.ok(typeof 123 === 'string');
// AssertionError: false == true

// In a file (e.g. test.js):
assert.ok(typeof 123 === 'string');
// AssertionError: Expresión evaluada a un valor falsy:
//
//   assert.ok(typeof 123 === 'string')

assert.ok(false);
// AssertionError: Expresión evaluada a un valor falsy:
//
//   assert.ok(false)

assert.ok(0);
// AssertionError: Expresión evaluada a un valor falsy:
//
//   assert.ok(0)

// El uso de `assert()` trabaja igual:
assert(0);
// AssertionError: Expresión evaluada a un valor falsy:
//
//   assert(0)
```

## assert.rejects(asyncFn\[, error\]\[, message\])

<!-- YAML
added: v10.0.0
-->

* `asyncFn` {Function|Promise}
* `error` {RegExp|Function|Object|Error}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. If the function does not return a promise, `assert.rejects()` will return a rejected `Promise` with an [`ERR_INVALID_RETURN_VALUE`][] error. In both cases the error handler is skipped.

Besides the async nature to await the completion behaves identically to [`assert.throws()`][].

If specified, `error` can be a [`Class`][], [`RegExp`][], a validation function, an object where each property will be tested for, or an instance of error where each property will be tested for including the non-enumerable `message` and `name` properties.

If specified, `message` will be the message provided by the `AssertionError` if the `asyncFn` fails to reject.

```js
(async () => {
  await assert.rejects(
    async () => {
      throw new TypeError('Wrong value');
    },
    {
      name: 'TypeError',
      message: 'Wrong value'
    }
  );
})();
```

```js
assert.rejects(
  Promise.reject(new Error('Wrong value')),
  Error
).then(() => {
  // ...
});
```

Note que el `error` no puede ser una string. Si una string es proporcionada como un segundo argumento, entonces se asume que el `error` es omitido y la string será usada para `message` en su lugar. Esto puede conducir a errores fáciles de perder. Please read the example in [`assert.throws()`][] carefully if using a string as the second argument gets considered.

## assert.strictEqual(actual, expected[, message])

<!-- YAML
added: v0.1.21
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->

* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Tests strict equality between the `actual` and `expected` parameters as determined by the [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: Se esperaba que input A fuese estrictamente igual a input B:
// + expected - actual
// - 1
// + 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError [ERR_ASSERTION]:Se esperaba que input A fuese estrictamente igual a input B:
// + expected - actual
// - 1
// + '1'
```

Si los valores no son estrictamente iguales, se arroja `AssertionError` con una propiedad `message` establecida igual al parámetro `message`. Si el parámetro `message` es indefinido, un mensaje predeterminado de error es asignado. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.throws(fn\[, error\]\[, message\])

<!-- YAML
added: v0.1.21
changes:

  - version: v10.2.0
    pr-url: https://github.com/nodejs/node/pull/20485
    description: The `error` parameter can be an object containing regular
                 expressions now.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/17584
    description: The `error` parameter can now be an object as well.
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3276
    description: The `error` parameter can now be an arrow function.
-->

* `fn` {Function}
* `error` {RegExp|Function|Object|Error}
* `message` {string}

Expects the function `fn` to throw an error.

If specified, `error` can be a [`Class`][], [`RegExp`][], a validation function, a validation object where each property will be tested for strict deep equality, or an instance of error where each property will be tested for strict deep equality including the non-enumerable `message` and `name` properties. When using an object, it is also possible to use a regular expression, when validating against a string property. See below for examples.

If specified, `message` will be appended to the message provided by the `AssertionError` if the `fn` call fails to throw or in case the error validation fails.

Custom validation object/error instance:

```js
const err = new TypeError('Wrong value');
err.code = 404;
err.foo = 'bar';
err.info = {
  nested: true,
  baz: 'text'
};
err.reg = /abc/i;

assert.throws(
  () => {
    throw err;
  },
  {
    name: 'TypeError',
    message: 'Wrong value',
    info: {
      nested: true,
      baz: 'text'
    }
    // Note that only properties on the validation object will be tested for.
    // Using nested objects requires all properties to be present. Otherwise
    // the validation is going to fail.
  }
);

// Using regular expressions to validate error properties:
assert.throws(
  () => {
    throw err;
  },
  {
    // The `name` and `message` properties are strings and using regular
    // expressions on those will match against the string. If they fail, an
    // error is thrown.
    name: /^TypeError$/,
    message: /Wrong/,
    foo: 'bar',
    info: {
      nested: true,
      // It is not possible to use regular expressions for nested properties!
      baz: 'text'
    },
    // The `reg` property contains a regular expression and only if the
    // validation object contains an identical regular expression, it is going
    // to pass.
    reg: /abc/i
  }
);

// Fails due to the different `message` and `name` properties:
assert.throws(
  () => {
    const otherErr = new Error('Not found');
    otherErr.code = 404;
    throw otherErr;
  },
  err // This tests for `message`, `name` and `code`.
);
```

Validación de instanceof utilizando el constructor:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

Validar mensaje de error usando [`RegExp`][]:

Using a regular expression runs `.toString` on the error object, and will therefore also include the error name.

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/
);
```

Validación de error personalidada:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  function(err) {
    if ((err instanceof Error) && /value/.test(err)) {
      return true;
    }
  },
  'unexpected error'
);
```

Note que el `error` no puede ser una string. Si una string es proporcionada como un segundo argumento, entonces se asume que el `error` es omitido y la string será usada para `message` en su lugar. Esto puede conducir a errores fáciles de perder. Using the same message as the thrown error message is going to result in an `ERR_AMBIGUOUS_ARGUMENT` error. Please read the example below carefully if using a string as the second argument gets considered:

<!-- eslint-disable no-restricted-syntax -->

```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// El segundo argumento es una string y la función de entrada arrojo un Error.
// ¡El primer caso no arrojará, ya que no coincide con el mensaje de error
// arrojado por la función de entrada!
assert.throws(throwingFirst, 'Second');
// En el siguiente ejemplo, el mensaje no tiene beneficio por encima del mensaje del
// error, y como no es claro si el usuario pretendía realmente coincidir
// con el mensaje de error, Node.js arrojó un
error `ERR_AMBIGUOUS_ARGUMENT`.
assert.throws(throwingSecond, 'Second');
// Arroja un error:
// TypeError [ERR_AMBIGUOUS_ARGUMENT]

// La string sólo es usada (como mensaje) en caso de que la función no arroje: assert.throws(notThrowing, 'Second');
// AssertionError [ERR_ASSERTION]: Hace falta la excepción esperada: Segundo

// Si se pretendía coincidir con el mensaje de error, haga esto en su lugar: assert.throws(throwingSecond, /Second$/);
// No arroja debido a que los mensajes de error coinciden.
assert.throws(throwingFirst, /Second$/);
// Arroja un error:
// Error: Primero
//     en throwingFirst (repl:2:9)
```

Debido a la confusa notación, se recomiendo no utilizar una string como segundo argumento. Esto puede llevar a errores difíciles de conseguir.