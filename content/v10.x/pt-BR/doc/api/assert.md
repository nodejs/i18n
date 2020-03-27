# Assert

<!--introduced_in=v0.1.21-->

> Estabilidade: 2 - estável

O módulo `assert` provê um simples conjunto de testes assertivos que podem ser usados para testar invariantes.

Existem os modos `strict` e o `legacy`, no entanto é recomendado usar apenas [`strict mode`][].

Para mais informações sobre as comparações de igualdade, veja [o guia MDN sobre comparações de igualdade e uniformidade](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Classe: assert.AssertionError

Uma subclasse de `Error` que indica a falha de uma asserção. Todos os erros disparados pelo módulo `assert` pertencerá a instâncias da classe `AssertionError`.

### new assert.AssertionError(options)
<!-- YAML
added: v0.1.21
-->
* `options` {Object}
  * `message` {string} Se fornecida, a mensagem de erro será preenchida com este valor.
  * `actual` {any} A propriedade `actual` na instância de erro conterá este valor. Usado internamente para o `actual` erro de entrada no caso e.g., [`assert.strictEqual()`] é usado.
  * `expected` {any} A propriedade `expected` na instância de erro conterá este valor. Usado internamente para o `expected` erro de entrada no caso e.g., [`assert.strictEqual()`] é usado.
  * `operator` {string} A propriedade `operator` na instância de erro conterá este valor. Usado internamente para indicar qual operação foi usada para comparação (ou qual função de asserção desencadeou o erro).
  * `stackStartFn` {Function} Se fornecido, o stack trace gerado irá remover todos os frames até a função fornecida.

Uma subclasse de `Error` que indica a falha de uma asserção.

Todas as instâncias contêm as propriedades `Erro` embutidas (`message` e `name`) e:

* `actual` {any} Define para o valor atual no caso, por exemplo, [`assert.strictEqual()`] é usado.
* `expected` {any} Define para o valor esperado no caso, por exemplo, [`assert.strictEqual()`] é usado.
* `generatedMessage` {boolean} Indica se a mensagem foi gerada automaticamente (`true`) ou não.
* `code` {string} Isso é sempre definido para a string `ERR_ASSERTION` para indicar que o erro é realmente um erro de asserção.
* `operador` {string} Define para o valor aprovado no operador.

```js
const assert = require('assert');

// Gera um AssertionError para comparar a mensagem de erro posteriormente:
const { message } = new assert.AssertionError({
  actual: 1,
  expected: 2,
  operator: 'strictEqual'
});

// Verifica a saída do erro:
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

## Modo Strict
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

Ao usar a função `strict mode`, qualquer função `assert` usará a igualdade usada no modo de função strict. Então [`assert.deepEqual()`][] irá, por exemplo, funcionar como [`assert.deepStrictEqual()`][].

Além disso, mensagens de erro que envolvem objetos produzem um erro de diff em vez de exibir ambos os objetos. Não é o caso do modo legacy.

Ele pode ser acessado usando:

```js
const assert = require('assert').strict;
```

Exemplo de erro diff:

```js
const assert = require('assert').strict;

assert.deepEqual([[[1, 2, 3]], 4, 5], [[[1, 2, '3']], 4, 5]);
// AssertionError: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual ... Lines skipped
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

Para desativar as cores, use a variável ambiental `NODE_DISABLE_COLORS`. Por favor, note que isso também desativará as cores no REPL.

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
* `value` {any} The input that is checked for being truthy.
* `message` {string|Error}

Um alias de [`assert.ok()`][].

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

**Modo Strict**

Um alias de [`assert.deepStrictEqual()`][].

**Modo Legacy**

> Estabilidade: 0 - Descontinuada: Use [`assert.deepStrictEqual()`][].

Testes para uma profunda igualdade entre os parâmetros `actual` e `expected`. Valores primitivos são comparados com [Comparação Abstrata de Igualdade](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Apenas [propriedades enumeradas "próprias"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) são consideradas. A implementação `assert.deepEqual()`][] não testa o [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) de objetos ou propriedades enumeradas próprias [`Symbol`][]. Para tais verificações, considere usar [`assert.deepStrictEqual()`][] em vez disso. [`assert.deepEqual()`][] pode ter resultados potencialmente surpreendentes. O exemplo a seguir não dispara um `AssertionError` porque as propriedades do objeto [`RegExp`][] não são enumeradas:

```js
// AVISO: Isso não dispara um AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Uma exceção é feita para [`Map`][] e [`Set`][]. `Map`s e `Set`s tem seus itens contidos também comparados, como esperado.

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

Se os valores não são iguais, uma `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`.

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

Testes para uma profunda igualdade entre os parâmetros `actual` e `expected`. A igualdade "Profunda" significa que as propriedades enumeradas "próprias" dos objetos secundários são avaliadas recursivamente também pelas seguintes regras.

### Detalhes de comparação

* Valores primitivos são comparados usando a [Comparação SameValue](https://tc39.github.io/ecma262/#sec-samevalue), usado por [`Object.is()`][].
* [Tipo de tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) dos objetos devem ser as mesmas.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) de objetos são comparados usando a [Comparação de Igualdade Strict](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Apenas [propriedades enumeradas "próprias"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) são consideradas.
* Nomes e mensagens de [`Error`][] são sempre comparados, mesmo que não sejam propriedades enumeradas.
* O próprio [`Symbol`][] das propriedades enumeradas também são comparados.
* [Agregadores de objetos](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) são comparados tanto como objetos e valores desagregados.
* Propriedades de `Object` são comparadas desordenadamente.
* Chaves `Map` e itens `Set` são comparados desordenadamente.
* A Recursão termina quando ambos os lados diferem ou ambos os lados encontram uma referência circular.
* A comparação [`WeakMap`][] e [`WeakSet`][] não depende de seus valores. Veja abaixo para mais detalhes.

```js
const assert = require('assert').strict;

// Isso falha porque 1 != '1'.
assert.deepStrictEqual({ a: 1 }, { a: '1' });
// AssertionError:  Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
//   {
// -   a: 1
// +   a: '1'
//   }

// Os objetos a seguir não possuem propriedades próprias
const date = new Date();
const object = {};
const fakeDate = {};
Object.setPrototypeOf(fakeDate, Date.prototype);

// Diferente [[Prototype]]:
assert.deepStrictEqual(object, fakeDate);
// AssertionError: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
// - {}
// + Date {}

//Tipos Diferentes de tags:
assert.deepStrictEqual(date, fakeDate);
// AssertionError: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
// - 2018-04-26T00:49:08.604Z
// + Date {}

assert.deepStrictEqual(NaN, NaN);
// OK, por causa da comparação SameValue

// Números desagregados diferentes:
assert.deepStrictEqual(new Number(1), new Number(2));
// AssertionError: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
// - [Number: 1]
// + [Number: 2]

assert.deepStrictEqual(new String('foo'), Object('foo'));
// OK porque o objeto e a string são idênticos quando são desagregados.

assert.deepStrictEqual(-0, -0);
// OK

// Diferentes zeros usando a comparação SameValue
assert.deepStrictEqual(0, -0);
// AssertionError: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
// - 0
// + -0

const symbol1 = Symbol();
const symbol2 = Symbol();
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 });
// OK, porque é o mesmo símbolo em ambos objetos.
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol2]: 1 });
// AssertionError [ERR_ASSERTION]: Objetos inseridos não são idênticos.
// {
//   [Symbol()]: 1
// }

const weakMap1 = new WeakMap();
const weakMap2 = new WeakMap([[{}, {}]]);
const weakMap3 = new WeakMap();
weakMap3.unequal = true;

assert.deepStrictEqual(weakMap1, weakMap2);
// OK, porque é impossível comparar as entradas.

// Falha porque weakMap3 tem uma propriedade que weakMap1 não contém:
assert.deepStrictEqual(weakMap1, weakMap3);
// AssertionError: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
//   WeakMap {
// -   [items unknown]
// +   [items unknown],
// +   unequal: true
//   }
```

Se os valores não são iguais, uma `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`.

## assert.doesNotReject(asyncFn\[, error\]\[, message\])
<!-- YAML
added: v10.0.0
-->
* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. Se a função não retornar uma promessa, `assert.doesNotReject()` retornará uma `promessa` rejeitada com um erro [`ERR_INVALID_RETURN_VALUE`[]. Em ambos os casos o erro handler foi ignorado.

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

Se especificado, `error` pode ser um [`Class`][], [`RegExp`][] ou uma função de validação. Veja [`assert.throws()`][] para mais detalhes.

Apesar da natureza assíncrona para aguardar a conclusão, comporta-se de forma idêntica para [`assert.doesNotThrow()`][].

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

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. Ao invés, considere adicionar um comentário ao lado do caminho específico do código que não deve lançar e manter mensagens de erro tão expressivas quanto possível.

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

Se um erro for lançado e for do mesmo tipo especificado pelo parâmetro `error`, então um `AssertionError` é lançado. Se o erro é de um tipo diferente, ou se o parâmetro `error` for indefinido, o erro é propagado de volta para o caller.

Se especificado, `error` pode ser um [`Class`][], [`RegExp`][] ou uma função de validação. Veja [`assert.throws()`][] para mais detalhes.

O seguinte, por exemplo, vai lançar o [`TypeError`][] porque não há tipo de erro correspondente na afirmação:
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

No entanto, o seguinte resultará em um `AssertionError` com a mensagem 'Existe exceção indesejada...':
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
  /Wrong value/,
  'Whoops'
);
// lança: AssertionError: Existe uma exceção indesejada: Whoops
```

## assert.equal(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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
// AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Se os valores não são iguais, uma `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`.

## assert.fail([message])<!-- YAML
added: v0.1.21
-->* `message` {string|Error} **Default:** `'Failed'`

Lança uma `AssertionError` com a mensagem de erro fornecida ou uma mensagem de erro padrão. Se o parâmetro `message` é uma instância de um [`Error`][] então ele será lançado em vez do `AssertionError`.

```js
const assert = require('assert').strict;

assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail(new TypeError('need array'));
// TypeError: need array
```

Usar `assert.fail()` com mais de dois argumentos é possível mas obsoleto. Veja abaixo para mais detalhes.

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
* `operator` {string} **Default:** `'!='`
* `stackStartFn` {Function} **Default:** `assert.fail`

> Estabilidade: 0 - Descontinuada: Use `assert.fail([message])` ou outra função assert em vez disso.

Se `a message` é falsa, a mensagem de erro é definida como os valores de `actual` e `expected` separados pelo provido `operator`. Se apenas os dois `actual` e `expected` argumentos são fornecidos, `operador` irá por padrão para `'!='`. Se `message` for fornecida como terceiro argumento, ela será usada como mensagem de erro e os outros argumentos serão armazenados como propriedades no objeto lançado. If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). Se não houver argumentos dados, a mensagem padrão `Failed` será usada.

```js
const assert = require('assert').strict;

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: falhou

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: whoops

assert.fail(1, 2, new TypeError('need array'));
// TypeError: necessita do array
```

Nos últimos três casos `actual`, `expected`, e `operator` não tem influência na mensagem de erro.

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

Lança `value` se `value` não é `undefined` ou `null`. Isto é útil quando estiver testando o argumento `error` em callbacks. O stack trace contém todos os frames do erro passado para `ifError()` incluindo os potenciais novos frames para o próprio `ifError()`.

```js
const assert = require('assert').strict;

assert.ifError(null);
// OK
assert.ifError(0);
// AssertionError [ERR_ASSERTION]: ifError got unwanted exception: 0
assert.ifError('error');
// AssertionError [ERR_ASSERTION]: ifError got unwanted exception: 'error'
assert.ifError(new Error());
// AssertionError [ERR_ASSERTION]: ifError got unwanted exception: Error

// Cria alguns error frames aleatórios.
let err;
(function errorFrame() {
  err = new Error('test error');
})();

(function ifErrorFrame() {
  assert.ifError(err);
})();
// AssertionError [ERR_ASSERTION]: ifError got unwanted exception: test error
//     at ifErrorFrame
//     at errorFrame
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
// OK

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK
```

Se os valores são iguais, um `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`.

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

Testes para profundas desigualdades strict. Oposto de [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

Se os valores são estritamente iguais, um `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Error`][] então ele será lançado em vez do `AssertionError`.

## assert.notEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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

Se os valores são iguais, um `AssertionError` é lançada com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`.

## assert.notStrictEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Testa uma desigualdade strict entre os parâmetros `actual` e `expected` como determinado pela [Comparação SameValue](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Entrada idêntica aprovada para notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

Se os valores são iguais, um `AssertionError` é lançado com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`.

## assert.ok(value[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->* `value` {any}
* `message` {string|Error}

Testa se `value` é verdadeiro. É equivalente a `assert.equal(!!value, true, message)`.

Se `value` não é verdadeiro, um `AssertionError` é lancao com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` é `undefined`, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Erro`][] então ele será lançado em vez do `AssertionError`. Se nenhum argumento for aprovado `mensagem` será definida para a string: ``'No value argument passed to `assert.ok()`'``.

Esteja ciente de que na `repl` a mensagem de erro será diferente da mensagem lançado em um arquivo! Veja abaixo para mais detalhes.

```js
const assert = require('assert').strict;

assert.ok(true);
// OK
assert.ok(1);
// OK

assert.ok();
// AssertionError: Nenhum argumento de valor aprovado para `assert.ok()`

assert.ok(false, 'it\'s false');
// AssertionError: é falso

// In the repl:
assert.ok(typeof 123 === 'string');
// AssertionError: false == true

// In a file (e.g. test.js):
assert.ok(typeof 123 === 'string');
// AssertionError: A expressão avaliada para um valor falso:
//
//   assert.ok(typeof 123 === 'string')

assert.ok(false);
// AssertionError: A expressão avaliada para um valor falso:
//
//   assert.ok(false)

assert.ok(0);
// AssertionError: A expressão avaliada para um valor falso:
//
//   assert.ok(0)

// Usando `assert()` funciona igual a:
assert(0);
// AssertionError: A expressão avaliada para um valor falso:
//
//   assert(0)
```

## assert.rejects(asyncFn\[, error\]\[, message\])<!-- YAML
added: v10.0.0
-->* `asyncFn` {Function|Promise}
* `error` {RegExp|Function|Object|Error}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. Se a função não retornar uma promessa, `assert.rejects()` retornará uma `Promise` rejeitada com um erro [`ERR_INVALID_RETURN_VALUE`[]. Em ambos os casos o erro handler é ignorado.

Apesar da natureza assíncrona para aguardar a conclusão, comporta-se de forma idêntica para [`assert.throws()`][].

Se especificado, `error` pode ser um [`Class`][], [`RegExp`][], uma função de validação, um objeto onde cada propriedade será testada, ou uma instância de erro onde cada propriedade será testada por incluir as propriedades não-enumeradas `message` e propriedades de `name`.

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

Note que `error` não pode ser uma string. Se uma string é fornecida como o segundo argumento, então `error` é presumido que será omitido e a string será usada para `message` em vez disso. Isto pode conduzir a erros fáceis de serem evitados. Por favor leia o exemplo em [`assert.throws()`][] cuidadosamente se usar uma string como o segundo argumento ela é considerada.

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

Testa uma desigualdade strict entre os parâmetros `actual` e `expected` como determinado pela [Comparação SameValue](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
// - 1
// + 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError [ERR_ASSERTION]: Espera-se que a entrada A corresponda estritamente à entrada igual B:
// + expected - actual
// - 1
// + '1'
```

Se os valores não são iguais, um `AssertionError` é lançado com uma `message` propriedade definida igual ao valor do parâmetro `message`. Se o parâmetro `message` não for definido, uma mensagem de erro padrão é atribuída. Se o parâmetro `message` é uma instância de um [`Error`][] então ele será lançado em vez do `AssertionError`.

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

Usando uma expressão regular executa `.toString` no objeto de erro, e assim também incluirá o nome de erro.

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/
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

Note que `error` não pode ser uma string. Se uma string é fornecida como o segundo argumento, então `error` é presumido que será omitido e a string será usada para `message` em vez disso. Isto pode conduzir a erros fáceis de serem evitados. Usando a mesma mensagem como a mensagem de erro lançada vai resultar em um erro `ERR_AMBIGUOUS_ARGUMENT`. Por favor leia o exemplo abaixo cuidadosamente se usar uma string como o segundo argumento ela é considerada:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// O segundo argumento é uma string e a função de entrada lançou um erro.
// O primeiro caso não lançará pois não corresponde à mensagem de erro
// lançada pela função de entrada!
assert.throws(throwingFirst, 'Second');
// No próximo exemplo, a mensagem não tem nenhum benefício sobre a mensagem do
// erro e desde que não está claro se o usuário pretendia realmente coincidir
// contra a mensagem de erro, o Node.js lançou um erro `ERR_AMBIGUOUS_ARGUMENT`.
assert.throws(throwingSecond, 'Second');
// Lança um erro:
// TypeError [ERR_AMBIGUOUS_ARGUMENT]

// A string é usada apenas (como mensagem) no caso da função não lançar:
assert.throws(notThrowing, 'Second');
// AssertionError [ERR_ASSERTION]: Exceção esperada ausente: Second

// Se foi destinado para coincidir à mensagem de erro, faça isso:
assert.throws(throwingSecond, /Second$/);
// Não lança porque as mensagens de erro coincidem.
assert.throws(throwingFirst, /Second$/);
// Lança um erro:
// Erro: Primeiro
//     em throwingFirst (repl:2:9)
```

Devido à notação confusa, é recomendado não usar uma string como o segundo argumento. Isto pode conduzir a erros difíceis de detectar.
