# Aserción

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `assert` provee un conjunto simple de pruebas de aserción que pueden ser usados para probar invariantes.

Existe un modo `strict` y un modo `legacy`, pero se recomiendo utilizar solo el [`strict mode`][].

Para mayor información acerca de las comparaciones de igualdad utilizadas vea la [MDN's guide on equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Modo estricto
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

Puede ser accedido utilizando:

```js
const assert = require('assert').strict;
```

## Modo legado

> Estabilidad: 0 - Obsoleto: Utilice el modo estricto en su lugar.

Al acceder a `assert` directamente en lugar de utilizar la propiedad `strict`, la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) será utilizada para cualquier función sin el "strict" en su nombre, como [`assert.deepEqual()`][].

Puede ser accedido utilizando:

```js
const assert = require('assert');
```

Se recomienda usar el [`strict mode`][] en su lugar ya que la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) a menudo puede obtener resultados sorprendentes. Esto es especialmente verdadero para [`assert.deepEqual()`][], en donde las reglas de comparación son poco exigentes:

```js
// ADVERTENCIA: ¡Esto no arroja un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

Un alias de [`assert.ok()`][].

## assert.deepEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: Set and Map content is also compared
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
* `expected`{any}
* `message` {any}

**Modo estricto**

Un alias de [`assert.deepStrictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.deepStrictEqual()`][] en su lugar.

Pruebas para igualdad profunda entre los parámetros `actual` y `expected`. Los valores primitivos son comparados con la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Sólo se consideran las [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects, attached symbols, or non-enumerable properties — for such checks, consider using [`assert.deepStrictEqual()`][] instead. This can lead to some potentially surprising results. For example, the following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
// ADVERTENCIA: ¡Esto no arroja un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Se hace una excepción para [`Map`][] y para [`Set`][]. Maps y Sets tienen sus artículos contenidos comparados también, como se esperaba.

Igualdad "profunda" significa que las propiedades enumerables "propias" de objetos secundarios también son evaluadas:

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
 // OK, objeto es igual a si mismo
assert.deepEqual(obj1, obj2); 
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
 // los valores de b son diferentes

assert.deepEqual(obj1, obj3);
 // OK, los objetos son iguales

 assert.deepEqual(obj1, obj4); // AssertionError: { a: { b: 1 } } deepEqual {} // Los prototipos son ignorados
```

Si los valores no son iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.deepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
changes:
  - version: v8.5.0
    pr-url: https://github.com/nodejs/node/pull/15001
    description: Error names and messages are now properly compared
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12142
    description: Set and Map content is also compared
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
* `message` {any}

Generally identical to `assert.deepEqual()` with a few exceptions:

### Detalles de compración

* Primitive values are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).
* Set values and Map keys are compared using the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison. (Which means they are free of the [caveats](#assert_caveats)).
* Las [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) de objetos deben ser las mismas.
* Los [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) de objetos son comparados utilizando la [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Sólo se consideran las [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) son comparados como objetos y como valores desenvueltos.
* Las propiedades Object son comparadas sin orden.
* Las claves de Map y los artículos de Set son comparados sin orden.
* La recursión se detiene cuando ambos lados difieren o cuando ambos lados encuentran una referencia circular.

```js
const assert = require('assert').strict;

assert.deepEqual({ a: 1 }, { a: '1' });
// OK, because 1 == '1'

assert.deepStrictEqual({ a: 1 }, { a: '1' });
// AssertionError: { a: 1 } deepStrictEqual { a: '1' }
// because 1 !== '1' using strict equality

// The following objects don't have own properties
const date = new Date();
const object = {};
const fakeDate = {};

Object.setPrototypeOf(fakeDate, Date.prototype);

assert.deepEqual(object, fakeDate);
// OK, doesn't check [[Prototype]]
assert.deepStrictEqual(object, fakeDate);
// AssertionError: {} deepStrictEqual Date {}
// Different [[Prototype]]

assert.deepEqual(date, fakeDate);
// OK, doesn't check type tags
assert.deepStrictEqual(date, fakeDate);
// AssertionError: 2017-03-11T14:25:31.849Z deepStrictEqual Date {}
// Different type tags

assert.deepStrictEqual(new Number(1), new Number(2));
// Fails because the wrapped number is unwrapped and compared as well.
assert.deepStrictEqual(new String('foo'), Object('foo'));
// OK because the object and the string are identical when unwrapped.
```

Si los valores no son iguales, se arroja un `AssertionError` con una propiedad `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.doesNotReject(block\[, error\]\[, message\])
<!-- YAML
added: V8.13.0
-->
* `block` {Function}
* `error` {RegExp|Function}
* `message` {any}

Awaits for the promise returned by function `block` to complete and not be rejected. See [`assert.rejects()`][] for more details.

When `assert.doesNotReject()` is called, it will immediately call the `block` function, and awaits for completion.

Besides the async nature to await the completion behaves identical to [`assert.doesNotThrow()`][].

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
assert.doesNotReject(
  () => Promise.reject(new TypeError('Wrong value')),
  SyntaxError
).then(() => {
  // ...
});
```

## assert.doesNotThrow(block\[, error\]\[, message\])
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
* `block` {Function}
* `error` {RegExp|Function}
* `message` {any}

Afirma que la función `block` no arroja un error. Véase [`assert.throws()`][] para más información.

Por favor, note: El uso de `assert.doesNotThrow()` no es realmente útil porque hay muy poco beneficio por coger un rechazo y luego devolverlo. En su lugar, considere añadir un comentario al lado de la ruta de código específica que no deba arrojar y mantenga los mensajes de error lo más expresivos posibles.

Cuando `assert.doesNotThrow()` es llamado, llamará inmediatamente a la función `block`.

Si se arroja un error y es el del mismo tipo que el especificado por el parámetro `error`, entonces se arroja un `AssertionError`. Si el error es de un tipo diferente, o si el parámetro `error` no está definido, el error se propaga de nuevo a la persona que llama.

Lo siguiente, por ejemplo, arrojará el [`TypeError`][] porque no hay un tipo de error de coincidencia en la afirmación:

```js
assert.doesNotThrow(
   () => {
     throw new TypeError('Wrong value');
   },   
SyntaxError 
);
```

Sin embargo, lo siguiente resultará en un `AssertionError` con el mensaje 'Se obtuvo una excepción no deseada (TypeError)..':

```js
assert.doesNotThrow(
   () => {
     throw new TypeError('Wrong value');
   },   
TypeError 
);
```

Si se arroja un `AssertionError` y se provee un valor para el parámetro `message`, el valor de `message` será agregado al mensaje de `AssertionError`:

```js
assert.doesNotThrow(
   () => {
     throw new TypeError('Wrong value');
   },   
TypeError,   
'Whoops'
 );
// Arroja: AssertionError: Se obtuvo una excepción no deseada (TypeError). Ups
```

## assert.equal(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Modo estricto**

Un alias de [`assert.strictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.strictEqual()`][] en su lugar.

Prueba la igualdad superficial y coercitiva entre los parámetros `actual` y `expected` usando la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

```js
const assert = require('assert');

assert.equal(1, 1);
// OK, 1 == 1
assert.equal(1, '1');
// OK, 1 == '1'

assert.equal(1, 2);
// AssertionError: 1 == 2
assert.equal({ a: { b: 1 } }, { a: { b: 1 } });
//AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Si los valores no son iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.fail(message)
## assert.fail(actual, expected[, message[, operator[, stackStartFunction]]])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}
* `operador` {string} **Predeterminado:** `'!='`
* `stackStartFunction` {Function} **Predeterminado:** `assert.fail`

Arroja un `AssertionError`. Si el `message` es falso, el mensaje de error es colocado como los valores de `actual` y `expected` separado por los `operator` proporcionados. If just the two `actual` and `expected` arguments are provided, `operator` will default to `'!='`. If `message` is provided only it will be used as the error message, the other arguments will be stored as properties on the thrown object. Si `stackStartFunction` es proporcionado, todos los marcos de pila sobre la función serán removidos de la pila de llamadas (ver [`Error.captureStackTrace`]).

```js
const assert = require('assert').strict;

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: fail

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: whoops
```

*Note*: In the last two cases `actual`, `expected`, and `operator` have no influence on the error message.

```js
assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'
```

Caso ejemplo de `stackStartFunction` al truncar la pila de llamadas de excepciones:
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
-->
* `value` {any}

Arroja `value` si `value` es verdadero. Esto es útil cuando se evalúan los argumentos `error` en llamadas de retorno.

```js
const assert = require('assert').strict;

assert.ifError(null);
// OK
assert.ifError(0);
// OK
assert.ifError(1);
// Throws 1
assert.ifError('error');
// Throws 'error'
assert.ifError(new Error());
// Throws Error
```

## assert.notDeepEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

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
// OK: obj1 y obj2 no son profundamente iguales

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 y obj4 no son profundamente iguales
```

Si los valores son profundamente iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Pruebas por desigualdades profundas estrictas. Opuesto de [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepEqual({ a: 1 }, { a: '1' });
// AssertionError: { a: 1 } notDeepEqual { a: '1' }

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

Si los valores son profunda y estrictamente iguales, un `AssertionError` es arrojado con una propiedad `message` colocada igual al valor del parámetro `message`. Si el parámetro `message` es indefinido, un mensaje predeterminado de error es asignado.

## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Modo estricto**

Un alias de [`assert.notStrictEqual()`][].

**Modo legado**

> Estabilidad: 0 - Obsoleto: Use [`assert.notStrictEqual()`][] en su lugar.

Prueba la desigualdad superficial y coercitiva con la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `!=` ).

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1');
// AssertionError: 1 != '1'
```

Si los valores son iguales, un `AssertionError` es arrojado con una propiedad `message` colocada igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.notStrictEqual(actual, esperado[, mensaje])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Tests strict inequality as determined by the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `!==` ).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError: 1 !== 1

assert.notStrictEqual(1, '1');
// OK
```

Si los valores son estrictamente iguales, un `AssertionError` es arrojado con una propiedad `message` colocada igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Prueba si `value` es verdadero. Es equivalente a `assert.equal(!!value, true, message)`.

Si `value` no es verdadero, un `AssertionError` es arrojado con una propiedad `message` colocada igual al valor del parámetro `message`. Si el parámetro `message` es `undefined`, un mensaje de error predeterminado es asignado.

```js
const assert = require('assert').strict;

assert.ok(true);
// OK
assert.ok(1);
// OK
assert.ok(false);
// throws "AssertionError: false == true"
assert.ok(0);
// throws "AssertionError: 0 == true"
assert.ok(false, 'it\'s false');
// throws "AssertionError: it's false"
```

## assert.strictEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Tests strict equality as determined by the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError: 1 === 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError: 1 === '1'
```

Si los valores no son estrictamente iguales, se arroja `AssertionError` con una propiedad `message` establecida igual al parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado.

## assert.rejects(block\[, error\]\[, message\])
<!-- YAML
added: V8.13.0
-->
* `block` {Function}
* `error` {RegExp|Function|Object}
* `message` {any}

Awaits for promise returned by function `block` to be rejected.

When `assert.rejects()` is called, it will immediately call the `block` function, and awaits for completion.

Besides the async nature to await the completion behaves identical to [`assert.throws()`][].

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

Si se especifica, el `message` será el mensaje proporcionado por el `AssertionError` si el bloque falla al rechazar.

```js
(async () => {
  await assert.rejects(
    async () => {
      throw new Error('Wrong value');
    },
    Error
  );
})();
```

```js
assert.rejects(
  () => Promise.reject(new Error('Wrong value')),
  Error
).then(() => {
  // ...
});
```

## assert.throws(block\[, error\]\[, message\])
<!-- YAML
added: v0.1.21
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/23223
    description: The `error` parameter can now be an object as well.
  - version: v4.2.0
    pr-url: https://github.com/nodejs/node/pull/3276
    description: The `error` parameter can now be an arrow function.
-->
* `block` {Function}
* `error` {RegExp|Function|object}
* `message` {any}

Espera que la función `block` arroje un error.

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

Si se especifica, el `message` será el mensaje proporcionado por el `AssertionError` si el bloque falla al arrojar.

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

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
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

Objeto error / instancia error personalizada:

```js
assert.throws(
  () => {
    const err = new TypeError('Wrong value');
    err.code = 404;
    throw err;
  },
  {
    name: 'TypeError',
    message: 'Wrong value'
    // Note that only properties on the error object will be tested!
  }
);
```

Note que el `error` no puede ser una string. Si se proporciona una string como segundo argumento, entonces se asume que el `error` se omitirá y que la string será utilizada para el `message` en su lugar. Esto puede conducir a errores fáciles de perder. Please read the example below carefully if using a string as the second argument gets considered:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// El segundo argumento es una string y la función de entrada arrojo un Error.
// In that case both cases do not throw as neither is going to try to
// match for the error message thrown by the input function!
assert.throws(throwingFirst, 'Second');
assert.throws(throwingSecond, 'Second');

// The string is only used (as message) in case the function does not throw:
assert.throws(notThrowing, 'Second');
// AssertionError [ERR_ASSERTION]: Missing expected exception: Second

// If it was intended to match for the error message do this instead:
assert.throws(throwingSecond, /Second$/);
// Does not throw because the error messages match.
assert.throws(throwingFirst, /Second$/);
// Throws a error:
// Error: First
//     at throwingFirst (repl:2:9)
```

Debido a la confusa notación, se recomiendo no utilizar una string como segundo argumento. Esto puede llevar a errores difíciles de conseguir.

## Advertencias

For the following cases, consider using ES2015 [`Object.is()`][], which uses the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison.

```js
const a = 0;
const b = -a;
assert.notStrictEqual(a, b);
// AssertionError: 0 !== -0
// Strict Equality Comparison doesn't distinguish between -0 and +0...
assert(!Object.is(a, b));
// but Object.is() does!

const str1 = 'foo';
const str2 = 'foo';
assert.strictEqual(str1 / 1, str2 / 1);
// AssertionError: NaN === NaN
// Strict Equality Comparison can't be used to check NaN...
assert(Object.is(str1 / 1, str2 / 1));
// but Object.is() can!
```

For more information, see [MDN's guide on equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).
