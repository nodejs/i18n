# Assert

<!--introduced_in=v0.10.0-->

> Stability: 2 - Stable

The `assert` module provides a simple set of assertion tests that can be used to
test invariants.

A `strict` and a `legacy` mode exist, while it is recommended to only use
[`strict mode`][].

For more information about the used equality comparisons see
[MDN's guide on equality comparisons and sameness][mdn-equality-guide].

## Strict mode
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in
the strict function mode. So [`assert.deepEqual()`][] will, for example, work the
same as [`assert.deepStrictEqual()`][].

It can be accessed using:

```js
const assert = require('assert').strict;
```

## Legacy mode

> Stability: 0 - Deprecated: Use strict mode instead.

When accessing `assert` directly instead of using the `strict` property, the
[Abstract Equality Comparison][] will be used for any function without "strict"
in its name, such as [`assert.deepEqual()`][].

It can be accessed using:

```js
const assert = require('assert');
```

It is recommended to use the [`strict mode`][] instead as the
[Abstract Equality Comparison][] can often have surprising results. This is
especially true for [`assert.deepEqual()`][], where the comparison rules are
lax:

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

An alias of [`assert.ok()`][].

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

**Strict mode**

An alias of [`assert.deepStrictEqual()`][].

**Legacy mode**

> Stability: 0 - Deprecated: Use [`assert.deepStrictEqual()`][] instead.

Tests for deep equality between the `actual` and `expected` parameters.
Primitive values are compared with the [Abstract Equality Comparison][]
( `==` ).

Only [enumerable "own" properties][] are considered. The
[`assert.deepEqual()`][] implementation does not test the
[`[[Prototype]]`][prototype-spec] of objects, attached symbols, or
non-enumerable properties — for such checks, consider using
[`assert.deepStrictEqual()`][] instead. This can lead to some
potentially surprising results. For example, the following example does not
throw an `AssertionError` because the properties on the [`RegExp`][] object are
not enumerable:

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

An exception is made for [`Map`][] and [`Set`][]. Maps and Sets have their
contained items compared too, as expected.

"Deep" equality means that the enumerable "own" properties of child objects
are evaluated also:

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
// OK, object is equal to itself

assert.deepEqual(obj1, obj2);
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
// values of b are different

assert.deepEqual(obj1, obj3);
// OK, objects are equal

assert.deepEqual(obj1, obj4);
// AssertionError: { a: { b: 1 } } deepEqual {}
// Prototypes are ignored
```

If the values are not equal, an `AssertionError` is thrown with a `message`
property set equal to the value of the `message` parameter. If the `message`
parameter is undefined, a default error message is assigned.

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

* Primitive values are compared using the [Strict Equality Comparison][]
  ( `===` ).
* Set values and Map keys are compared using the [SameValueZero][]
  comparison. (Which means they are free of the [caveats][]).
* [Type tags][Object.prototype.toString()] of objects should be the same.
* [`[[Prototype]]`][prototype-spec] of objects are compared using
  the [Strict Equality Comparison][].
* Only [enumerable "own" properties][] are considered.
* [`Error`][] messages are always compared, even though this property is
  non-enumerable.
* [Object wrappers][] are compared both as objects and unwrapped values.
* Object properties are compared unordered.
* Map keys and Set items are compared unordered.
* Recursion stops when both sides differ or both sides encounter a circular
  reference.

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

If the values are not equal, an `AssertionError` is thrown with a `message`
property set equal to the value of the `message` parameter. If the `message`
parameter is undefined, a default error message is assigned.

## assert.doesNotReject(block[, error][, message])
<!-- YAML
added: V8.13.0
-->
* `block` {Function}
* `error` {RegExp|Function}
* `message` {any}

Awaits for the promise returned by function `block` to complete and not be
rejected. See [`assert.rejects()`][] for more details.

When `assert.doesNotReject()` is called, it will immediately call the `block`
function, and awaits for completion.

Besides the async nature to await the completion behaves identical to
[`assert.doesNotThrow()`][].

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

## assert.doesNotThrow(block[, error][, message])
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

Asserts that the function `block` does not throw an error. See
[`assert.throws()`][] for more details.

Please note: Using `assert.doesNotThrow()` is actually not useful because there
is no benefit by catching an error and then rethrowing it. Instead, consider
adding a comment next to the specific code path that should not throw and keep
error messages as expressive as possible.

When `assert.doesNotThrow()` is called, it will immediately call the `block`
function.

If an error is thrown and it is the same type as that specified by the `error`
parameter, then an `AssertionError` is thrown. If the error is of a different
type, or if the `error` parameter is undefined, the error is propagated back
to the caller.

The following, for instance, will throw the [`TypeError`][] because there is no
matching error type in the assertion:

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

However, the following will result in an `AssertionError` with the message
'Got unwanted exception (TypeError)..':

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  TypeError
);
```

If an `AssertionError` is thrown and a value is provided for the `message`
parameter, the value of `message` will be appended to the `AssertionError`
message:

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

**Strict mode**

An alias of [`assert.strictEqual()`][].

**Legacy mode**

> Stability: 0 - Deprecated: Use [`assert.strictEqual()`][] instead.

Tests shallow, coercive equality between the `actual` and `expected` parameters
using the [Abstract Equality Comparison][] ( `==` ).

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

If the values are not equal, an `AssertionError` is thrown with a `message`
property set equal to the value of the `message` parameter. If the `message`
parameter is undefined, a default error message is assigned.

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

Throws an `AssertionError`. If `message` is falsy, the error message is set as
the values of `actual` and `expected` separated by the provided `operator`.
If just the two `actual` and `expected` arguments are provided, `operator` will
default to `'!='`. If `message` is provided only it will be used as the error
message, the other arguments will be stored as properties on the thrown object.
If `stackStartFunction` is provided, all stack frames above that function will
be removed from stacktrace (see [`Error.captureStackTrace`]).

```js
const assert = require('assert').strict;

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: fail

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: whoops
```

*Note*: In the last two cases `actual`, `expected`, and `operator` have no
influence on the error message.

```js
assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'
```

Example use of `stackStartFunction` for truncating the exception's stacktrace:
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

Throws `value` if `value` is truthy. This is useful when testing the `error`
argument in callbacks.

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

**Strict mode**

An alias of [`assert.notDeepStrictEqual()`][].

**Legacy mode**

> Stability: 0 - Deprecated: Use [`assert.notDeepStrictEqual()`][] instead.

Tests for any deep inequality. Opposite of [`assert.deepEqual()`][].

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
// OK: obj1 and obj2 are not deeply equal

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 and obj4 are not deeply equal
```

If the values are deeply equal, an `AssertionError` is thrown with a `message`
property set equal to the value of the `message` parameter. If the `message`
parameter is undefined, a default error message is assigned.

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Tests for deep strict inequality. Opposite of [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepEqual({ a: 1 }, { a: '1' });
// AssertionError: { a: 1 } notDeepEqual { a: '1' }

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

If the values are deeply and strictly equal, an `AssertionError` is thrown
with a `message` property set equal to the value of the `message` parameter. If
the `message` parameter is undefined, a default error message is assigned.

## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Strict mode**

An alias of [`assert.notStrictEqual()`][].

**Legacy mode**

> Stability: 0 - Deprecated: Use [`assert.notStrictEqual()`][] instead.

Tests shallow, coercive inequality with the [Abstract Equality Comparison][]
( `!=` ).

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1');
// AssertionError: 1 != '1'
```

If the values are equal, an `AssertionError` is thrown with a `message`
property set equal to the value of the `message` parameter. If the `message`
parameter is undefined, a default error message is assigned.

## assert.notStrictEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Tests strict inequality as determined by the [Strict Equality Comparison][]
( `!==` ).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError: 1 !== 1

assert.notStrictEqual(1, '1');
// OK
```

If the values are strictly equal, an `AssertionError` is thrown with a
`message` property set equal to the value of the `message` parameter. If the
`message` parameter is undefined, a default error message is assigned.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Tests if `value` is truthy. It is equivalent to
`assert.equal(!!value, true, message)`.

If `value` is not truthy, an `AssertionError` is thrown with a `message`
property set equal to the value of the `message` parameter. If the `message`
parameter is `undefined`, a default error message is assigned.

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

Tests strict equality as determined by the [Strict Equality Comparison][]
( `===` ).

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError: 1 === 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError: 1 === '1'
```

If the values are not strictly equal, an `AssertionError` is thrown with a
`message` property set equal to the value of the `message` parameter. If the
`message` parameter is undefined, a default error message is assigned.

## assert.rejects(block[, error][, message])
<!-- YAML
added: V8.13.0
-->
* `block` {Function}
* `error` {RegExp|Function|Object}
* `message` {any}

Awaits for promise returned by function `block` to be rejected.

When `assert.rejects()` is called, it will immediately call the `block`
function, and awaits for completion.

Besides the async nature to await the completion behaves identical to
[`assert.throws()`][].

If specified, `error` can be a constructor, [`RegExp`][], a validation
function, or an object where each property will be tested for.

If specified, `message` will be the message provided by the `AssertionError` if
the block fails to reject.

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

## assert.throws(block[, error][, message])
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

Expects the function `block` to throw an error.

If specified, `error` can be a constructor, [`RegExp`][], a validation
function, or an object where each property will be tested for.

If specified, `message` will be the message provided by the `AssertionError` if
the block fails to throw.

Validate instanceof using constructor:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

Validate error message using [`RegExp`][]:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
);
```

Custom error validation:

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

Note that `error` can not be a string. If a string is provided as the second
argument, then `error` is assumed to be omitted and the string will be used for
`message` instead. This can lead to easy-to-miss mistakes. Please read the
example below carefully if using a string as the second argument gets
considered:

<!-- eslint-disable no-restricted-syntax -->
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

Due to the confusing notation, it is recommended not to use a string as the
second argument. This might lead to difficult-to-spot errors.

## Caveats

For the following cases, consider using ES2015 [`Object.is()`][],
which uses the [SameValueZero][] comparison.

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

For more information, see
[MDN's guide on equality comparisons and sameness][mdn-equality-guide].

[`Error.captureStackTrace`]: errors.html#errors_error_capturestacktrace_targetobject_constructoropt
[`Map`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
[`Object.is()`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
[`RegExp`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
[`Set`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
[`TypeError`]: errors.html#errors_class_typeerror
[`assert.deepEqual()`]: #assert_assert_deepequal_actual_expected_message
[`assert.deepStrictEqual()`]: #assert_assert_deepstrictequal_actual_expected_message
[`assert.notDeepStrictEqual()`]: #assert_assert_notdeepstrictequal_actual_expected_message
[`assert.notStrictEqual()`]: #assert_assert_notstrictequal_actual_expected_message
[`assert.ok()`]: #assert_assert_ok_value_message
[`assert.rejects()`]: #assert_assert_rejects_block_error_message
[`assert.strictEqual()`]: #assert_assert_strictequal_actual_expected_message
[`assert.throws()`]: #assert_assert_throws_block_error_message
[`strict mode`]: #assert_strict_mode
[Abstract Equality Comparison]: https://tc39.github.io/ecma262/#sec-abstract-equality-comparison
[Object wrappers]: https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript
[Object.prototype.toString()]: https://tc39.github.io/ecma262/#sec-object.prototype.tostring
[SameValueZero]: https://tc39.github.io/ecma262/#sec-samevaluezero
[Strict Equality Comparison]: https://tc39.github.io/ecma262/#sec-strict-equality-comparison
[caveats]: #assert_caveats
[enumerable "own" properties]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties
[mdn-equality-guide]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
[prototype-spec]: https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
