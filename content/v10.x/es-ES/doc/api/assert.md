# Aserción

<!--introduced_in=v0.1.21-->

> Estability: 2 - Estable

El módulo `assert` provee un conjunto simple de pruebas de aserción que pueden ser usados para probar invariantes.

Existe un modo `strict` y un modo `legacy`, pero se recomiendo utilizar solo el [`strict mode`][].

Para mayor información acerca de las comparaciones de igualdad utilizadas vea la [MDN's guide on equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Clase: assert.AssertionError

Una subclase de `Error` que indica un fallo en una afirmación. Todos los errores arrojados por el módulo `assert` serán instancias de la clase `AssertionError`.

### new assert.AssertionError(opciones)
<!-- YAML
added: v0.1.21
-->
* `opciones` {Object}
  * `message` {string} si se proporciona, el mensaje de error se establecerá a este valor.
  * `actual` {any} La propiedad `actual` en la instancia de error va a contener este valor. Utilizado internamente para la entrada de error `actual` en el caso p. ej., [`assert.strictEqual()`] es utilizado.
  * `expected` {any} La propiedad `expected` en la instancia de error va a contener este valor. Utilizado internamente para la entrada de error `expected` en el caso p. ej., [`assert.strictEqual()`] es utilizado.
  * `operator` {string} La propiedad `operator` en la instancia de error va a contener este valor. Utilizado internamente para indicar qué operación fue utilizada para la comparación (o que función de afirmación desencadenó el error).
  * `stackStartFn` {Function} Si se proporcionada, el stack trace generado removerá todos los marcos hasta la función proporcionada.

Una subclase de `Error` que indica el fallo de una afirmación.

Todas las instancias contienen la propiedades integradas de `Error` (`message` y `name`) y:

* `actual` {any} Establecer al valor actual en el caso, p. ej., [`assert.strictEqual()`] es utilizado.
* `expected` {any} Establecer al valor esperado en el caso que, p. ej., [`assert.strictEqual()`] es utilizado.
* `generatedMessage` {boolean} Indica si el mensaje fue generado automáticamente (`true`) o no.
* `code` {string} Esto siempre está establecido a la string `ERR_ASSERTION` para indicar que el error es en realidad un error de afirmación.
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

Al utilizar el `strict mode`, cualquier función `assert` utilizará la igualdad utilizada en el modo de función estricta. Por lo tanto, [`assert.deepEqual()`][] trabajará, por ejemplo, al igual que [`assert.deepStrictEqual()`][].

Además de eso, los mensajes de error que involucran objetos, producen un error diff en lugar de mostrar ambos objetos. Ese no es el caso para el modo legado.

Se puede acceder a él utilizando:

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

Se puede acceder a él utilizando:

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

Pruebas para igualdad profunda entre los parámetros `actual` y `expected`. Los valores primitivos son comparados con la [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Sólo se consideran las [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). La implementación de [`assert.deepEqual()`][] no realiza una prueba de [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) de objetos o de propiedades [`Symbol`][] enumerables propias. Para tales comprobaciones, considere usar [`assert.deepStrictEqual()`][] en su lugar. [`assert.deepEqual()`][] puede obtener resultados potencialmente sorprendentes. El siguiente ejemplo no arroja un `AssertionError` porque la propiedades en el objeto [`RegExp`][] no son enumerables:

```js
// ADVERTENCIA: ¡Esto no arroja un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Se hace una excepción para [`Map`][] y para [`Set`][]. `Map`s y `Set`s tienen sus artículos contenidos comparados también, como se esperaba.

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

Si los valores no son iguales, se arroja un `AssertionError` con una propiedad `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar de `AssertionError`.

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

Pruebas para igualdad profunda entre los parámetros `actual` y `expected`. Igualdad "profunda" significa que las propiedades enumerables "propias" de objetos secundarios son evaluadas recursivamente también por las siguientes reglas.

### Detalles de compración

* Los valor primitivos son comparados utilizando la [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue), usada por [`Object.is()`][].
* Las [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) de objetos deben ser las mismas.
* Los [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) de objetos son comparados utilizando la [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Sólo se consideran las [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* [`Error`][] los nombres y los mensajes siempre son comparados, incluso si no son propiedades innumerables.
* Las propiedades [`Symbol`][] enumerables propias también son comparadas.
* [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) son comparados como objetos y como valores desenvueltos.
* Las propiedades `Object` son comparadas sin orden.
* Las claves de `Map` y los artículos de `Set` son comparados sin orden.
* La recursión se detiene cuando ambos lados difieren o cuando ambos lados encuentran una referencia circular.
* La comparación de [`WeakMap`][] y [`WeakSet`][] no depende de sus valores. Vea abajo para más detalles.

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

Si los valores no son iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar de `AssertionError`.

## assert.doesNotReject(asyncFn\[, error\]\[, message\])
<!-- YAML
added: v10.0.0
-->
* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. Si la función no devuelve una promesa, `assert.doesNotReject()` devolverá una `Promise` rechazada con un error [`ERR_INVALID_RETURN_VALUE`][]. En ambos casos se omitirá el controlador de errores.

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

Si se especifica, el `error` puede ser una función de [`Class`][], de [`RegExp`][] o una validación. Vea [`assert.throws()`][] para más detalles.

Aparte de la naturaleza asíncrona de esperar, la finalización se comporta igual a [`assert.doesNotThrow()`][].

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

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. En su lugar, considere añadir un comentario al lado de la ruta de código específica que no deba arrojar y mantenga los mensajes de error lo más expresivos posibles.

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

Si se arroja un error y es el del mismo tipo que el especificado por el parámetro `error`, entonces se arroja un `AssertionError`. Si el error es de un tipo diferente, o si el parámetro `error` no está definido, el error se propaga de nuevo a la persona que llama.

Si se especifica, el `error` puede ser una función de [`Class`][], de [`RegExp`][] o una validación. Vea [`assert.throws()`][] para más detalles.

Lo siguiente, por ejemplo, arrojará el [`TypeError`][] porque no hay un tipo de error de coincidencia en la afirmación:
```js
assert.doesNotThrow(
   () => {
     throw new TypeError('Wrong value');
   },   
SyntaxError 
);
```

Sin embargo, lo siguiente resultará en un `AssertionError` con el mensaje 'Se obtuvo una excepción no deseada...':
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
  /Wrong value/,
  'Whoops'
);
// Arroja: AssertionError: Se obtuvo una excepción no deseada: Ups
```

## assert.equal(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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
// AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Si los valores no son iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar de `AssertionError`.

## assert.fail([message])<!-- YAML
added: v0.1.21
-->* `mensaje` {string|Error} **Predeterminado:** `'Failed'`

Arroja un `AssertionError` con el mensaje de error proporcionado o un mensaje de error predeterminado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar del `AssertionError`.

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

## assert.fail(actual, expected[, message[, operator[, stackStartFn]]])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18418
    description: Calling `assert.fail()` with more than one argument is
                 deprecated and emits a warning.
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}
* `operador` {string} **Predeterminado:** `'!='`
* `stackStartFn` {Function} **Default:** `assert.fail`

> Estabilidad: 0 - Obsoleto: Use `assert.fail([message])` u otras   funciones de afirmación en su lugar.

Si el `message` es falsy, el mensaje de error es establecido como los valores de `actual` y `expected`, separados por el `operator` proporcionado. Si sólo se proporcionan los dos argumentos `actual` y `expected`, el `operator` se colocará por defecto en `'!='`. Si el `message` es proporcionado como tercer argumento, será utilizado como el mensaje de error y los otros argumentos se almacenarán como propiedades del objeto arrojado. If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). Si no se proporciona ningún argumento, el mensaje predeterminado `Failed` será utilizado.

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

En los últimos tres casos `actual`, `expected` y `operator` no tienen influencia en el mensaje de error.

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

## assert.ifError(value)<!-- YAML
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
-->* `value` {any}

Arroja `value` si el `value` está `undefined` o `null`. Esto es útil al probar el argumento `error` en callbacks. El stack trace contiene todos los fotogramas del error pasado a `ifError()` incluyendo los potenciales nuevos fotogramas para `ifError()` mismo.

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

## assert.notDeepEqual(actual, expected[, message])<!-- YAML
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
-->* `actual` {any}
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

Si los valores son profundamente iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar de `AssertionError`.

## assert.notDeepStrictEqual(actual, expected[, message])<!-- YAML
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
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Pruebas por desigualdades profundas estrictas. Opuesto de [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

Si los valores son profunda y estrictamente iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces será arrojado en lugar del `AssertionError`.

## assert.notEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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

Si los valores son iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si e parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces será arrojado en lugar del `AssertionError`.

## assert.notStrictEqual(actual, esperado[, mensaje])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Prueba la desigualdad estricta entre los parámetros `actual` y `expected` como se determina por la [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Entrada idéntica pasada a notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

Si los valores son estrictamente iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar de `AssertionError`.

## assert.ok(value[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->* `value` {any}
* `message` {string|Error}

Prueba si el `value` es truthy. Es equivalente a `assert.equal(!!value, true, message)`.

Si el valor `value` no es truthy, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` está `undefined`, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces se arrojará en lugar de `AssertionError`. Si no se pasan argumentos en absoluto `mensaje` se establecerá a la cadena: ``'Ningún argumento de valor pasado a `assert.ok()`'``.

¡Tenga en cuenta de que en `repl` el mensaje de error será diferente al arrojado en un archivo! Vea abajo para más detalles.

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

## assert.rejects(asyncFn\[, error\]\[, message\])<!-- YAML
added: v10.0.0
-->* `asyncFn` {Function|Promise}
* `error` {RegExp|Function|Object|Error}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. Si la función no devuelve una promesa, `assert.rejects()` devolverá una `Promise` rechazada con un error [`ERR_INVALID_RETURN_VALUE`][]. En ambos casos se omitirá el controlador de errores.

Aparte de la naturaleza asíncrona de esperar, la finalización se comporta igual a [`assert.throws()`][].

Si se especifica, el `error` puede ser [`Class`][], [`RegExp`][], una función de validación, un objeto en el cual cada propiedad será probada o una instancia de error en la cual cada propiedad será probada para incluir el `message` innumerable y propiedades de `name`.

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

Note que el `error` no puede ser una string. Si se proporciona una string como segundo argumento, entonces se asume que el `error` se omitirá y que la string será utilizada para el `message` en su lugar. Esto puede conducir a errores fáciles de perder. Por favor, lea el ejemplo en [`assert.throws()`][] cuidadosamente si se considera usar una string como segundo argumento.

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

Prueba la igualdad estricta entre los parámetros `actual` y `expected` como se determina por la [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

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

Si los valores no son estrictamente iguales, se arroja un `AssertionError` con una propiedad de `message` establecida igual al valor del parámetro `message`. Si el parámetro `message` no está definido, un mensaje de error predeterminado es asignado. Si el parámetro `message` es una instancia de un [`Error`][], entonces será arrojado en lugar del `AssertionError`.

## assert.throws(fn\[, error\]\[, message\])<!-- YAML
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
-->* `fn` {Function}
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

El uso de una expresión regular ejecuta `.toString` en el objeto error y por lo tanto también incluirá el nombre del error.

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

Note que el `error` no puede ser una string. Si se proporciona una string como segundo argumento, entonces se asume que el `error` se omitirá y que la string será utilizada para el `message` en su lugar. Esto puede conducir a errores fáciles de perder. El uso del mismo mensaje que el mensaje de error arrojado va a resultar en un error `ERR_AMBIGUOUS_ARGUMENT`. Por favor, lea el ejemplo a continuación cuidadosamente si se considera usar una string como segundo argumento:
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
