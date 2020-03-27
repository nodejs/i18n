# Assert

<!--introduced_in=v0.10.0-->

> Estabilidade: 2 - estável

O módulo `assert` provê um simples conjunto de testes assertivos que podem ser usados para testar invariantes.

Existem os modos `strict` e o `legacy`, no entanto é recomendado usar apenas [`strict mode`][].

Para mais informações sobre as comparações de igualdade, veja [o guia MDN sobre comparações de igualdade e uniformidade](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Modo Strict
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

Ele pode ser acessado usando:

```js
const assert = require('assert').strict;
```

## Modo Legacy

> Estabilidade: 0 - Descontinuada: Use o modo strict.

Ao acessar `assert` diretamente em vez de usar a propriedade `strict`, a [Comparação Abstrata de Igualdade](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) será usada para qualquer função sem "strict" em seu nome, como [`assert.deepEqual()`][].

Ele pode ser acessado usando:

```js
const assert = require('assert');
```

É recomendado usar o [`strict mode`][] so invés do [Comparação Abstrata de Igualdade](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) que podem frequentemente ter resultados surpreendentes. Isto é especialmente verdadeiro para [`assert.deepEqual()`][], onde as regras de comparação são vagas:

```js
// AVISO: Isso não dispara um AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

Um alias de [`assert.ok()`][].

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
* `expected` {any}
* `message` {any}

**Modo Strict**

Um alias de [`assert.deepStrictEqual()`][].

**Modo Legacy**

> Estabilidade: 0 - Descontinuada: Use [`assert.deepStrictEqual()`][].

Testes para uma profunda igualdade entre os parâmetros `actual` e `expected`. Valores primitivos são comparados com [Comparação Abstrata de Igualdade](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Apenas [propriedades enumeradas "próprias"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) são consideradas. The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects, attached symbols, or non-enumerable properties — for such checks, consider using [`assert.deepStrictEqual()`][] instead. This can lead to some potentially surprising results. For example, the following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
// AVISO: Isso não dispara um AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Uma exceção é feita para [`Map`][] e [`Set`][]. Maps e Sets tem seus itens contidos também comparados, como esperado.

A igualdade "Profunda" significa que as propriedades enumeradas "próprias" propriedades dos objetos secundários também são avaliadas:

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
// OK, o objeto é igual a si mesmo

assert.deepEqual(obj1, obj2);
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
// valores de b são diferentes

assert.deepEqual(obj1, obj3);
// OK, objetos são iguais

assert.deepEqual(obj1, obj4);
// AssertionError: { a: { b: 1 } } deepEqual {}
// Protótipos são ignorados
```

Se os valores não são iguais, uma `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

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

### Detalhes de comparação

* Primitive values are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).
* Set values and Map keys are compared using the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison. (Which means they are free of the [caveats](#assert_caveats)).
* [Tipo de tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) dos objetos devem ser as mesmas.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) de objetos são comparados usando a [Comparação de Igualdade Strict](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Apenas [propriedades enumeradas "próprias"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) são consideradas.
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* [Agregadores de objetos](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) são comparados tanto como objetos e valores desagregados.
* Propriedades de Object são comparadas desordenadamente.
* Chaves Map e itens Set são comparados desordenadamente.
* A Recursão termina quando ambos os lados diferem ou ambos os lados encontram uma referência circular.

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

Se os valores não são iguais, uma `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

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

Afirma que a função `block` não lança um erro. See [`assert.throws()`][] for more details.

Por favor note: Usar `assert.doesNotThrow()` não é realmente útil porque há pouco benefício ao pegar um erro e depois lança-lo novamente. Ao invés, considere adicionar um comentário ao lado do caminho específico do código que não deve lançar e manter mensagens de erro tão expressivas quanto possível.

Quando `assert.doesNotThrow()` é chamado, ele chama imediatamente a função `block`.

Se um erro for lançado e for do mesmo tipo especificado pelo parâmetro `error`, então um `AssertionError` é lançado. Se o erro é de um tipo diferente, ou se o parâmetro `error` for indefinido, o erro é propagado de volta para o caller.

O seguinte, por exemplo, vai lançar o [`TypeError`][] porque não há tipo de erro correspondente na afirmação:

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

However, the following will result in an `AssertionError` with the message 'Got unwanted exception (TypeError)..':

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  TypeError
);
```

Se um `AssertionError` for lançado e um valor é fornecido para o parâmetro `message`, o valor de `message` será anexado a mensagem `AssertionError`:

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  TypeError,
  'Whoops'
);
// Throws: AssertionError: Got unwanted exception (TypeError). Whoops
```

## assert.equal(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Modo Strict**

Um alias de [`assert.strictEqual()`][].

**Modo Legacy**

> Estabilidade: 0 - Descontinuada: Use [`assert.strictEqual()`][].

Testes de igualdade superficial e coercitiva entre os parâmetros `actual` e `expected` usando o [Comparação de Igualdade abstrata](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) (` == `).

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

Se os valores não são iguais, uma `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

## assert.fail(message)
## assert.fail(actual, expected[, message[, operator[, stackStartFunction]]])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}
* `operator` {string} **Default:** `'!='`
* `stackStartFunction` {Function} **Default:** `assert.fail`

Throws an `AssertionError`. If `message` is falsy, the error message is set as the values of `actual` and `expected` separated by the provided `operator`. If just the two `actual` and `expected` arguments are provided, `operator` will default to `'!='`. If `message` is provided only it will be used as the error message, the other arguments will be stored as properties on the thrown object. If `stackStartFunction` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]).

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

Exemplo de uso de `stackStartFunction` para truncar a exceção da stacktrace:
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

Throws `value` if `value` is truthy. This is useful when testing the `error` argument in callbacks.

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

**Modo Strict**

Um alias de [`assert.notDeepStrictEqual()`][].

**Modo Legacy**

> Estabilidade: 0 - Descontinuada: Use [`assert.notDeepStrictEqual()`][].

Testes para qualquer desigualdade profunda. Oposto de [`assert.deepEqual()`][].

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
// OK: obj1 and obj2 não são profundamente iguais.

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 and obj4 não são profundamente iguais
```

Se os valores são iguais, um `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Testes para profundas desigualdades strict. Oposto de [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepEqual({ a: 1 }, { a: '1' });
// AssertionError: { a: 1 } notDeepEqual { a: '1' }

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

If the values are deeply and strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned.

## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Modo Strict**

Um alias de [`assert.notStrictEqual()`][].

**Modo Legacy**

> Estabilidade: 0 - Descontinuada: Use [`assert.notStrictEqual()`][].

Testes superficial, coerciva desigualdade com a [Comparação Abstrata de Igualdade](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1')
// AssertionError: 1 != '1'
```

If the values are equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

## assert.notStrictEqual(actual, expected[, message])
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

If the values are strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Testa se `value` é verdadeiro. É equivalente a `assert.equal(!!value, true, message)`.

Se `value` não é verdadeiro, um `AssertionError` é lancao com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` é `undefined`, uma mensagem de erro padrão é atribuída.

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

Se os valores não são iguais, um `AssertionError` é lançado com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída.

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

Se especificado, `message` será a mensagem fornecida pelo `AssertionError` se o bloco falhar em rejeitar.

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

Espera a função `block` para lançar um erro.

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

Se especificado, `message` será a mensagem fornecida pelo `AssertionError` se o bloco falhar em lançar.

Valide a instância do uso do construtor:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

Validar mensagem de erro usando [`RegExp`][]:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
);
```

Validação de erro personalizado:

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

Objeto de erro personalizado / instância de erro:

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

Note that `error` can not be a string. Se uma string é fornecida como o segundo argumento, então `error` é presumido que será omitido e a string será usada para `message` em vez disso. Isto pode conduzir a erros fáceis de serem evitados. Please read the example below carefully if using a string as the second argument gets considered:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// O segundo argumento é uma string e a função de entrada lançou um erro.
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

Devido à notação confusa, é recomendado não usar uma string como o segundo argumento. Isto pode conduzir a erros difíceis de detectar.

## Caveats

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
