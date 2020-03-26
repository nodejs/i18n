# Утвердить

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Модуль `утвердить` обеспечивает простой набор тестов по утверждению, которые могут быть использованы для тестирования инвариантов.

Существуют `strict` и `legacy` режимы, хотя использовать рекомендуется только режим [`strict mode`][].

Для более подробной информации об используемых сравнениях равенства смотрите [ руководство MDN по сравнениям равенства](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Строгий режим
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

Это осуществляется с помощью:

```js
const assert = require('assert').strict;
```

## Режим совместимости

> Стабильность: 0 - устарело: вместо этого используйте строгий режим.

При доступе к `assert` напрямую, а не с помощью свойства `strict`, [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) будет использоваться для любой функции без «strict» в его имени, Например, [`assert.deepEqual()`] [].

Это осуществляется с помощью:

```js
const assert = require('assert');
```

Рекомендуется использовать [`строгий режим`] [], так как [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) часто может иметь неожиданные результаты. Это особенно верно для [`assert.deepEqual()`] [], где правила сравнения неточные:

```js
Предупреждение: Это не приводит к AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

Псевдоним [`assert.ok()`][].

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

**Строгий режим**

Псевдоним [`assert.deepStrictEqual()`][].

**Режим совместимости**

> Стабильность: 0 - устарело: вместо этого используйте [`assert.deepStrictEqual()`] [].

Тесты для глубокого равенства между `actual` и `expected` параметрами. Примитивные значения сравниваются с [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Считаются только [перечислимые свойства «own»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects, attached symbols, or non-enumerable properties — for such checks, consider using [`assert.deepStrictEqual()`][] instead. This can lead to some potentially surprising results. For example, the following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
Предупреждение: Это не приводит к AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Исключение сделано для [`Map`][] и [`Set`][]. Как и ожидается, содержимые элементы Maps и Sets тоже сравниваются.

«Глубокое» равенство означает, что перечислимые "собственные" свойства дочерних объектов также оцениваются:

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
// OK, объект равен самому себе

assert.deepEqual(obj1, obj2);
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
// значения b различны

assert.deepEqual(obj1, obj3);
// OK, объекты одинаковы

assert.deepEqual(obj1, obj4);
// AssertionError: { a: { b: 1 } } deepEqual {}
// Прототипы игнорируются
```

Если значения не равны, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` не определен, назначается сообщение об ошибке по умолчанию.

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

### Comparison details

* Primitive values are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).
* Set values and Map keys are compared using the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison. (Which means they are free of the [caveats](#assert_caveats)).
* [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) of objects should be the same.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Считаются только [перечислимые свойства «own»](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) are compared both as objects and unwrapped values.
* Object properties are compared unordered.
* Map keys and Set items are compared unordered.
* Recursion stops when both sides differ or both sides encounter a circular reference.

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

Если значения не равны, `AssertionError` появляется с `message` набор свойств равен значению параметра `message`. Если параметр `message` неопределенный, присваивается сообщение об ошибке по умолчанию.

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

Утверждается, что функция ` block ` не выдает ошибку. Для более подробной информации смотрите [`assert.throws()`][].

Please note: Using `assert.doesNotThrow()` is actually not useful because there is no benefit by catching an error and then rethrowing it. Instead, consider adding a comment next to the specific code path that should not throw and keep error messages as expressive as possible.

При вызове `assert.doesNotThrow()`, он немедленно вызовет функцию `block`.

Если возникает ошибка, и она того же типа, который указан параметром `error`, тогда выдается `AssertionError`. Если ошибка другая, или параметр `error` не определен, то ошибка возвращается обратно к вызывающему.

Например, следующее выдаст [`TypeError`][], потому что в утверждении нет соответствующего типа ошибки:

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

Однако следующее приведет к `AssertionError` с сообщением 'Получено нежелательное исключение (TypeError)..':

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  TypeError
);
```

Если выдается `AssertionError`, и значение указано для параметра `message`, значение `message` будет добавлено в сообщение `AssertionError`:

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  TypeError,
  'Whoops'
);
// Throws: AssertionError: Получено нежелательное исключение (TypeError). Упс
```

## assert.equal(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Строгий режим**

Псевдоним [`assert.strictEqual()`][].

**Режим совместимости**

> Стабильность: 0 - устарело: вместо этого используйте [`assert.strictEqual()`] [].

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
//AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Если значения не равны, `AssertionError` появляется с `message` набор свойств равен значению параметра `message`. Если параметр `message` неопределенный, присваивается сообщение об ошибке по умолчанию.

## assert.fail(message)
## assert.fail(actual, expected[, message[, operator[, stackStartFunction]]])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}
* `operator` {string} **Default:** `'!='`
* `stackStartFunction` {Function} **По умолчанию:** `assert.fail`

Выдается `AssertionError`. Если `message` ложно, сообщение об ошибке устанавливается как значения `actual` и `expected`, разделенные предоставленным `operator`. If just the two `actual` and `expected` arguments are provided, `operator` will default to `'!='`. If `message` is provided only it will be used as the error message, the other arguments will be stored as properties on the thrown object. Если указано `stackStartFunction`, все стековые фреймы выше этой функции будут удалены из трассировки стека (см. [`Error.captureStackTrace`]).

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

Пример использования `stackStartFunction` для усечения трассировки стека исключения:
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

Выдается `value`, если `value` истинно. Это полезно при тестировании аргумента `error` в функциях обратного вызова.

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

**Строгий режим**

Псевдоним [`assert.notDeepStrictEqual()`][].

**Режим совместимости**

> Стабильность: 0 - устарело: вместо этого используйте [`assert.notDeepStrictEqual()`] [].

Проверяется любое глубокое неравенство. Противоположность [`assert.deepEqual()`][].

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
// OK: obj1 и obj2 не глубоко равны

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 и obj4 не глубоко равны
```

Если значения глубоко равны, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` не определен, назначается сообщение об ошибке по умолчанию.

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Проверяется глубокое строгое неравенство. Противоположность [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepEqual({ a: 1 }, { a: '1' });
// AssertionError: { a: 1 } notDeepEqual { a: '1' }

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

Если значения глубоко и строго равны, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` не определен, назначается сообщение об ошибке по умолчанию.

## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Строгий режим**

An alias of [`assert.notStrictEqual()`][].

**Режим совместимости**

> Stability: 0 - Deprecated: Use [`assert.notStrictEqual()`][] instead.

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

Если значения равны, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` не определен, назначается сообщение об ошибке по умолчанию.

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

Если значения строго равны, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` не определен, назначается сообщение об ошибке по умолчанию.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Проверяется `value` на истинность. Это эквивалентно `assert.equal(!!value, true, message)`.

Если `value` не истинно, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` `undefined`, назначается сообщение об ошибке по умолчанию.

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

Если значения не строго равны, `AssertionError` выдается со свойством `message`, равным значению параметра `message`. Если параметр `message` не определен, назначается сообщение об ошибке по умолчанию.

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

If specified, `message` will be the message provided by the `AssertionError` if the block fails to reject.

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

Ожидается, что функция `block` выдаст ошибку.

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

If specified, `message` will be the message provided by the `AssertionError` if the block fails to throw.

Validate instanceof using constructor:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

Проверка сообщения об ошибке с помощью [`RegExp`][]:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
);
```

Пользовательская проверка на ошибку:

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

Custom error object / error instance:

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

Обратите внимание, что эта `error` не может быть строкой. Если строка указана в качестве второго аргумента, то `error` будет опущенной, и вместо этого строка будет использоваться для `message`. Это может привести к ошибкам, которые легко пропустить. Please read the example below carefully if using a string as the second argument gets considered:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// The second argument is a string and the input function threw an Error.
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

Due to the confusing notation, it is recommended not to use a string as the second argument. This might lead to difficult-to-spot errors.

## Предупреждения

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
