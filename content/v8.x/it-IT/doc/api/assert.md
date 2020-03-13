# Assert

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `assert` fornisce un semplice insieme di assertion test che possono essere utilizzati per verificare gli invariant.

Esistono una `strict` mode ed una `legacy` mode, anche se è consigliato utilizzare solo la [`strict mode`][].

Per ulteriori informazioni sui confronti di uguaglianza utilizzati, vedi la [guida MDN sui confronti di uguaglianza ed uniformità](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Strict mode
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

Ci si può accedere utilizzando:

```js
const assert = require('assert').strict;
```

## Legacy mode

> Stabilità: 0 - Obsoleto: Utilizza invece la strict mode.

Quando si accede direttamente all'`assert` invece di utilizzare la proprietà `strict`, verrà utilizzato l'[Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) per qualsiasi funzione senza "strict" nel suo nome, come ad esempio [`assert.deepEqual()`][].

Ci si può accedere utilizzando:

```js
const assert = require('assert');
```

Si raccomanda di utilizzare la [`strict mode`][] in quanto l'[Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) può avere spesso risultati sorprendenti. Questo è particolarmente vero per [`assert.deepEqual()`][], dove le regole di confronto sono negligenti:

```js
// ATTENZIONE: Questo non lancia un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any}
* `message` {any}

Un alias di [`assert.ok()`][].

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

Un alias di [`assert.deepStrictEqual()`][].

**Legacy mode**

> Stabilità: 0 - Obsoleto: Utilizza invece [`assert.deepStrictEqual()`][].

Test per la deep equality tra i parametri `actual` ed `expected`. I valori primitivi sono confrontati con l'[Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Sono prese in considerazione solo [le proprietà "own" enumerabili](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects, attached symbols, or non-enumerable properties — for such checks, consider using [`assert.deepStrictEqual()`][] instead. This can lead to some potentially surprising results. For example, the following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
// ATTENZIONE: Questo non lancia un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Viene fatta un'eccezione per [`Map`][] e [`Set`][]. I Map ed i Set hanno confrontato anche gli elementi al loro interno, come previsto.

Per "deep" equality si intende che vengono valutate anche le proprietà "own" enumerabili dei child objects:

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
// OK, l'object è uguale a se stesso

assert.deepEqual(obj1, obj2);
// AssertionError: { a: { b: 1 } } deepEqual { a: { b: 2 } }
// i valori di b sono diversi

assert.deepEqual(obj1, obj3);
// OK, gli objects sono uguali

assert.deepEqual(obj1, obj4);
// AssertionError: { a: { b: 1 } } deepEqual {}
// I prototipi (prototype) sono ignorati
```

Se i valori non sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

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

### Dettagli di confronto

* Primitive values are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).
* Set values and Map keys are compared using the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison. (Which means they are free of the [caveats](#assert_caveats)).
* [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) degli objects dovrebbero essere gli stessi.
* Il [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots)degli objects vengono confrontati utilizzando lo [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Sono prese in considerazione solo [le proprietà "own" enumerabili](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* Gli [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) vengono confrontati sia come objects che come valori che hanno subito l'unwrap.
* Le proprietà dell'Object vengono confrontate in modo non ordinato.
* Le Map key ed i Set item vengono confrontati in modo non ordinato.
* La ricorsione si interrompe quando entrambi i lati sono diversi oppure quando incontrano un riferimento circolare.

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

Se i valori non sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro di `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

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

Afferma che la funzione `block` non genera un errore. See [`assert.throws()`][] for more details.

Da notare: L'utilizzo di `assert.doesNotThrow()` in realtà non è utile perché non c'è alcun vantaggio nel rilevare un errore e dopo rilanciarlo. Invece, considera di aggiungere un commento accanto al percorso del codice specifico che non dovrebbe lanciare e che mantiene i messaggi di errore il più espressivi possibile.

Quando viene chiamato `assert.doesNotThrow()`, esso chiamerà immediatamente la funzione `block`.

Se viene generato un errore ed è dello stesso tipo specificato dal parametro `error`, allora viene generato un `AssertionError`. Se l'errore è di un tipo diverso o se il parametro dell'`error` è undefined (indefinito), l'errore viene propagato indietro al caller.

Il seguente codice, ad esempio, genererà il [`TypeError`][] perché non c'è un tipo di errore corrispondente nell'assertion:

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

Se viene generato un `AssertionError` e viene fornito un valore per il parametro di `message`, il valore di `message` verrà aggiunto al messaggio dell'`AssertionError`:

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

Un alias di [`assert.strictEqual()`][].

**Legacy mode**

> Stabilità: 0 - Obsoleto: Utilizza invece [`assert.strictEqual()`][].

Verifica l'uguaglianza superficiale e coercitiva tra i parametri `actual` ed `expected` utilizzando l'[Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

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

Se i valori non sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

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

Esempio d'uso di `stackStartFunction` per troncare lo stacktrace dell'eccezione:
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

**Strict mode**

Un alias di [`assert.notDeepStrictEqual()`][].

**Legacy mode**

> Stabilità: 0 - Obsoleto: Utilizza invece [`assert.notDeepStrictEqual()`][].

Test per qualsiasi deep inequality. Opposto di [`assert.deepEqual()`][].

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
// OK: obj1 ed obj2 non sono deep equal

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 ed obj4 non sono deep equal
```

Se i valori sono deep equal, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

Test per la deep strict inequality. Opposto di [`assert.deepStrictEqual()`][].

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

**Strict mode**

Un alias di [`assert.notStrictEqual()`][].

**Legacy mode**

> Stabilità: 0 - Obsoleto: Utilizza invece [`assert.notStrictEqual()`][].

Verifica l'inequality superficiale e coercitiva con l'[Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `!=` ).

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1');
// AssertionError: 1 != '1'
```

If the values are equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

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

If the values are strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Verifica se il `value` è vero. È equivalente a `assert.equal(!!value, true, message)`.

Se il `value` non è vero, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro di `message` è `undefined`, viene assegnato un messaggio di errore predefinito.

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

Se i valori non sono strict equal, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito.

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

Se specificato, `message` sarà il messaggio fornito da `AssertionError` se il block fallisce nel respingere.

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

Prevede che la funzione `block` generi un errore.

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

Se specificato, `message` sarà il messaggio fornito da `AssertionError` se il block fallisce nel generare.

Convalida instanceof utilizzando il constructor:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

Convalida il messsaggio d'errore utilizzando [`RegExp`][]:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
);
```

Convalida del custom error:

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

Note that `error` can not be a string. Se viene fornita una stringa come secondo argomento, si presume che l'`error` venga omesso e che la stringa venga utilizzata per `message`. Questo può portare ad errori easy-to-miss (facili da perdere). Please read the example below carefully if using a string as the second argument gets considered:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// Il secondo argomento è una stringa e la funzione di input ha generato un errore.
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

A causa della notazione confusionaria, si raccomanda di non usare una stringa come secondo argomento. Ciò potrebbe portare ad errori difficult-to-sport (difficili da individuare).

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
