# Assert

<!--introduced_in=v0.10.0-->

> Stabiliteit: 2 - stabiel

De `assert` module biedt een simpele set bevestigingshulpmiddelen die kunnen worden gebruikt om invariabelen te testen.

Een `strict` en een `legacy` module bestaan, maar het is aanbevolen om alleen de [`strict mode`][] module te gebruiken.

Voor meer informatie over de gebruikte gelijkheidsvergelijkingen zie [MDN's guide on equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Strikte modus
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

Het kan worden bereikt met behulp van:

```js
const assert = require('assert').strict;
```

## Legacy modus

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief de strikte modus.

Bij het rechtstreeks binnengaan van `assert` in plaats van de `strict` eigenschap te gebruiken, zal de [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) worden gebruikt voor elke functie zonder "strikt" in de naam, zoals [`assert.deepEqual()`][].

Het kan worden bereikt met behulp van:

```js
const assert = require('assert');
```

Het is aanbevolen om als alternatief de [`strict mode`][] te gebruiken, omdat de [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) vaak verrassende resultaten levert. Dit is met name zo voor [`assert.deepEqual()`][], waar de vergelijkingsregels laks zijn:

```js
// WAARSCHUWING: Dit gooit geen AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

Een alias van [`assert.ok()`][].

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

**Strikte modus**

Een alias van [`assert.deepStrictEqual()`][].

**Legacy modus**

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief [`assert.deepStrictEqual()`][].

Test voor diepe gelijkheid tussen de `actual` en `expected` parameters. Primitieve waarden worden vergeleken met de [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Enkel [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) worden overwogen. The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects, attached symbols, or non-enumerable properties — for such checks, consider using [`assert.deepStrictEqual()`][] instead. This can lead to some potentially surprising results. For example, the following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
// WAARSCHUWING: Dit gooit geen AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Een uitzondering wordt gemaakt voor [`Map`][] en [`Set`][]. Maps en Sets hebben hun opgenomen items ook vergeleken, als verwacht.

"Diepe" gelijkheid betekent dat de telbare "eigen" eigenschappen van kind objecten ook worden geëvalueerd:

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
// OK, object is gelijk aan zichzelf

assert.deepEqual(obj1, obj2);
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
// waarden van b zijn verschillend

assert.deepEqual(obj1, obj3);
// OK, objecten zijn gelijk

assert.deepEqual(obj1, obj4);
// AssertionError: { a: { b: 1 } } deepEqual {}
// Prototypes worden genegeerd
```

Wanneer de waarden niet gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen.

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

### Vergelijkingsdetails

* Primitive values are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).
* Set values and Map keys are compared using the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison. (Which means they are free of the [caveats](#assert_caveats)).
* [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) van objecten moeten gelijk zijn.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) van objecten wordt vergeleken met behulp van de [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Enkel [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) worden overwogen.
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) worden zowel als object als oningepakte waarden vergeleken.
* Object eigenschappen worden ongeordend vergeleken.
* Map sleutels en Set items worden ongeordend vergeleken.
* Recursie stopt als beide zijden verschillen of beide zijden een circulaire verwijzing tegenkomen.

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

Wanneer de waarden niet gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, ingesteld gelijk aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen.

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

Beweert dat de functie `block` geen fout gooit. See [`assert.throws()`][] for more details.

Let op: Het gebruik van `assert.doesNotThrow()` is niet nuttig, want er is geen voordeel aan het vangen van een afwijzing om het vervolgens wéér te werpen. Als alternatief, overweeg het toevoegen van een opmerking naast het specifieke code pad wat niet zou moeten gooien en probeer de foutberichten zo expressief mogelijk te houden.

Wanneer `assert.doesNotThrow()` wordt aangeroepen, zal het onmiddellijk de `block` functie aanroepen.

Als een fout is geworpen en het is hetzelfde type als die is gespecificeerd door de `error` parameter, dan wordt een `AssertionError` geworpen. Wanneer de fout van een ander type is, of al de `error` parameter ongedefinieerd is, dan wordt de fout teruggegeven aan de aanroepfunctie.

Het volgende, bijvoorbeeld, zal de [`TypeError`][] gooien, want er is geen overeenkomstig fout type in de bewering:

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

Wanneer een `AssertionError` wordt geworpen, en de waarde voor de `message` parameter is opgegeven, dan zal de waarde van `message` worden toegevoegd aan het `AssertionError` bericht:

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

**Strikte modus**

Een alias van [`assert.strictEqual()`][].

**Legacy modus**

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief 0 - Deprecated: Use [`assert.strictEqual()`][].

Test ondiepe, dwangmatige gelijkheid tussen de `actual` en de `expected` parameters met behulp van de [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

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

Wanneer de waarden niet gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen.

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

Voorbeeld van gebruik van `stackStartFunction` om de stacktrace van de uitzondering af te korten:
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

**Strikte modus**

Een alias of [`assert.notDeepStrictEqual()`][].

**Legacy modus**

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief [`assert.notDeepStrictEqual()`][].

Test voor alle diepe ongelijkheid. Tegenovergestelde van [`assert.deepEqual()`][].

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
// AssertionError: { a: { b: 1 } } niet diep gelijk { a: { b: 1 } }

assert.notDeepEqual(obj1, obj2);
// OK: obj1 en obj2 zijn niet diep gelijk

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } niet diep gelijk { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 en obj4 zijn niet diep gelijk
```

Wanneer de waarden diep gelijk zijn, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen.

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Test op diep strikte ongelijkheid. Tegenovergestelde van [`assert.deepStrictEqual()`][].

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

**Strikte modus**

Een alias van [`assert.notStrictEqual()`][].

**Legacy modus**

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief [`assert.notStrictEqual()`][].

Test ondiepe, dwangmatige ongelijkheid met de [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `!=` ).

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1');
// AssertionError: 1 != '1'
```

If the values are equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen.

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

If the values are strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een standaard foutmelding toegewezen.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Test of `value` truthy is. Het is gelijkwaardig aan `assert.equal(!!value, true, message)`.

Als de `value` niet truthy is, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter `undefined` is, wordt er een standaard foutmelding toegewezen.

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

Wanneer de waarden niet strikt gelijk zijn, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een standaard foutmelding toegewezen.

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

Wanneer dit is gespecificeerd, zal `message` het bericht zijn wat verstrekt wordt door de `AssertionError` als het blok het niet afwijst.

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

Verwacht dat de functie `block` een fout werpt.

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

Wanneer dit is gespecificeerd, zal `message` het bericht zijn wat verstrekt wordt door de `AssertionError` als het blok het niet werpt.

Valideer instantie van met behulp van de constructor:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

Valideer foutmelding met behulp van [`RegExp`][]:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
);
```

Aangepaste fout validatie:

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

Aangepast fout-object / fout-instantie:

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

Note that `error` can not be a string. Wanneer een tekenreeks wordt verstrekt als tweede argument, dan wordt verondersteld dat `error` wordt weggelaten, en wordt als alternatief de tekenreeks voor `message` gebruikt. Dit kan leiden tot makkelijk te missen fouten. Please read the example below carefully if using a string as the second argument gets considered:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// Het tweede argument is een tekenreeks en de invoerfunctie heeft een Fout geworpen.
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

Vanwege de verwarrende notatie, is het aanbevolen de tekenreeks niet als tweede argument te gebruiken. Dit kan leiden tot moeilijk te vinden fouten.

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
