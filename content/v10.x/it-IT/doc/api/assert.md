# Assert

<!--introduced_in=v0.1.21-->

> Stabilità: 2 - Stable

Il modulo `assert` fornisce un semplice insieme di assertion test che possono essere utilizzati per verificare gli invariant.

Esistono una `strict` mode ed una `legacy` mode, anche se è consigliato utilizzare solo la [`strict mode`][].

Per ulteriori informazioni sui confronti di uguaglianza utilizzati, vedi la [guida MDN sui confronti di uguaglianza ed uniformità](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Classe: assert.AssertionError

Una sottoclasse di `Error` che indica il fallimento di un'assertion. Tutti gli errori generati dal modulo `assert` saranno istanze della classe `AssertionError`.

### nuova assert.AssertionError(options)
<!-- YAML
added: v0.1.21
-->
* `options` {Object}
  * `message` {string} Se fornito, il messaggio di errore verrà impostato su questo valore.
  * `actual` {any} La proprietà `actual` sull'istanza dell'errore contiene questo valore. Utilizzato internamente per l'input di errore `actual` nel caso in cui, ad esempio, sia usato [`assert.strictEqual()`].
  * `expected` {any} La proprietà `expected` sull'istanza dell'errore contiene questo valore. Utilizzato internamente per l'input di errore `expected` nel caso in cui, ad esempio, sia usato [`assert.strictEqual()`].
  * `operator` {string} La proprietà `operator` sull'istanza dell'errore contiene questo valore. Utilizzato internamente per indicare quale operazione è stata utilizzata per il confronto (o quale funzione assertion ha attivato l'errore).
  * `stackStartFn` {Function} Se fornito, la traccia dello stack generato rimuove tutti i frame fino alla funzione fornita.

Una sottoclasse di `Error` che indica il fallimento di un assertion.

Tutte le istanze contengono le proprietà integrate di `Error` (`message` e `name`) e:

* `actual` {any} Imposta sul valore actual nel caso in cui, ad esempio, venga utilizzato [`assert.strictEqual()`].
* `expected` {any} Imposta sul valore expected nel caso in cui, ad esempio, venga utilizzato [`assert.strictEqual()`].
* `generatedMessage` {boolean} Indica se il messaggio è stato generato automaticamente (`true`) oppure no.
* `code` {string} Questo è sempre impostato sulla stringa `ERR_ASSERTION` per indicare che l'errore è in realtà un'assertion error.
* `operator` {string} Imposta sul valore operator passato.

```js
const assert = require('assert');

// Genera un AssertionError per confrontare il messaggio di errore in un secondo momento:
const { message } = new assert.AssertionError({
  actual: 1,
  expected: 2,
  operator: 'strictEqual'
});

// Verifica l'output dell'errore:
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

## Strict mode
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

Quando si utilizza la `strict mode`, qualsiasi funzione `assert` utilizzerà l'uguaglianza utilizzata nella strict function mode. Quindi [`assert.deepEqual()`][] funzionerà, ad esempio, allo stesso modo di [`assert.deepStrictEqual()`][].

Oltre a questo, i messaggi di errore che coinvolgono gli objects generano un error diff invece di visualizzare entrambi gli objects. Questo non succede nella legacy mode.

Ci si può accedere utilizzando:

```js
const assert = require('assert').strict;
```

Esempio di error diff:

```js
const assert = require('assert').strict;

assert.deepEqual([[[1, 2, 3]], 4, 5], [[[1, 2, '3']], 4, 5]);
// AssertionError: Input A expected to strictly deep-equal input B:
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

Per disattivare i colori, utilizza la variabile di ambiente `NODE_DISABLE_COLORS`. Si prega di notare che questa disattiverà anche i colori nel REPL.

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
* `value` {any} The input that is checked for being truthy.
* `message` {string|Error}

Un alias di [`assert.ok()`][].

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

**Strict mode**

Un alias di [`assert.deepStrictEqual()`][].

**Legacy mode**

> Stabilità: 0 - Obsoleto: Utilizza invece [`assert.deepStrictEqual()`][].

Test per la deep equality tra i parametri `actual` ed `expected`. I valori primitivi sono confrontati con l'[Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Sono prese in considerazione solo [le proprietà "own" enumerabili](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). L'implementazione [`assert.deepEqual()`][] non verifica il [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) degli objects o le proprietà own [`Symbol`][] enumerabili. Per tali controlli invece prendere in considerazione l'utilizzo di [`assert.deepStrictEqual()`][]. [`assert.deepEqual()`][] può avere risultati potenzialmente sorprendenti. L'esempio seguente non lancia un `AssertionError` perché le proprietà sul [`RegExp`][] object non sono enumerabili:

```js
// ATTENZIONE: Questo non lancia un AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Viene fatta un'eccezione per [`Map`][] e [`Set`][]. I `Map` ed i `Set` hanno confrontato anche gli elementi al loro interno, come previsto.

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

Se i valori non sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà lanciato al posto di `AssertionError`.

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

Test per la deep equality tra i parametri `actual` ed `expected`. Per "deep" equality si intende che vengono valutate in modo ricorsivo anche le proprietà "own" enumerabili dei child objects in base alle seguenti regole.

### Dettagli di confronto

* I valori primitivi vengono confrontati utilizzando il [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue), utilizzato tramite [`Object.is()`][].
* [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) degli objects dovrebbero essere gli stessi.
* Il [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots)degli objects vengono confrontati utilizzando lo [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Sono prese in considerazione solo [le proprietà "own" enumerabili](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* Gli [`Error`][] name e message vengono sempre confrontati, anche se non si tratta di proprietà enumerabili.
* Anche le proprietà own [`Symbol`][] enumerabili vengono confrontate.
* Gli [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) vengono confrontati sia come objects che come valori che hanno subito l'unwrap.
* Le proprietà dell'`Object` vengono confrontate in modo non ordinato.
* Le `Map` key ed i `Set` item vengono confrontati in modo non ordinato.
* La ricorsione si interrompe quando entrambi i lati sono diversi oppure quando incontrano un riferimento circolare.
* I confronti [`WeakMap`][] e [`WeakSet`][] non si basano sui loro valori. Vedi sotto per ulteriori dettagli.

```js
const assert = require('assert').strict;

// Questo fallisce perché 1 !== '1'.
assert.deepStrictEqual({ a: 1 }, { a: '1' });
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
//   {
// -   a: 1
// +   a: '1'
//   }

// I seguenti objects non hanno proprietà proprie
const date = new Date();
const object = {};
const fakeDate = {};
Object.setPrototypeOf(fakeDate, Date.prototype);

// [[Prototype]] diverso:
assert.deepStrictEqual(object, fakeDate);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - {}
// + Date {}

// Type tags diversi:
assert.deepStrictEqual(date, fakeDate);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - 2018-04-26T00:49:08.604Z
// + Date {}

assert.deepStrictEqual(NaN, NaN);
// OK, a causa del SameValue comparison

// Numeri che hanno subito l'unwrap diversi:
assert.deepStrictEqual(new Number(1), new Number(2));
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - [Number: 1]
// + [Number: 2]

assert.deepStrictEqual(new String('foo'), Object('foo'));
// OK perché l'object e la stringa sono identici una volta che hanno subito l'unwrap.

assert.deepStrictEqual(-0, -0);
// OK

// Diversi zeri usando il SameValue Comparison:
assert.deepStrictEqual(0, -0);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - 0
// + -0

const symbol1 = Symbol();
const symbol2 = Symbol();
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 });
// OK, perché è lo stesso symbol su entrambi gli objects.
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol2]: 1 });
// AssertionError [ERR_ASSERTION]: Input objects non 
identici:
// {
//   [Symbol()]: 1
// }

const weakMap1 = new WeakMap();
const weakMap2 = new WeakMap([[{}, {}]]);
const weakMap3 = new WeakMap();
weakMap3.unequal = true;

assert.deepStrictEqual(weakMap1, weakMap2);
// OK, perché è impossibile confrontare le voci

// Fallisce perché weakMap3 ha una proprietà che weakMap1 non contiene:
assert.deepStrictEqual(weakMap1, weakMap3);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
//   WeakMap {
// -   [items unknown]
// +   [items unknown],
// +   unequal: true
//   }
```

Se i valori non sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà lanciato al posto di `AssertionError`.

## assert.doesNotReject(asyncFn\[, error\]\[, message\])
<!-- YAML
added: v10.0.0
-->
* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. Se la funzione non restituisce un promise, `assert.doesNotReject()` restituirà un `Promise` respinto con un errore [`ERR_INVALID_RETURN_VALUE`][]. In entrambi i casi viene saltato l'error handler.

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

Se specificato, l'`error` può essere una [`Class`][], un [`RegExp`][] oppure una funzione di convalida. Vedi [`assert.throws()`][] per maggiori dettagli.

Inoltre la natura asincrona di attendere il completamento si comporta in modo identico a [`assert.doesNotThrow()`][].

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

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. Invece, considera di aggiungere un commento accanto al percorso del codice specifico che non dovrebbe lanciare e che mantiene i messaggi di errore il più espressivi possibile.

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

Se viene generato un errore ed è dello stesso tipo specificato dal parametro `error`, allora viene generato un `AssertionError`. Se l'errore è di un tipo diverso o se il parametro dell'`error` è undefined (indefinito), l'errore viene propagato indietro al caller.

Se specificato, l'`error` può essere una [`Class`][], un [`RegExp`][] oppure una funzione di convalida. Vedi [`assert.throws()`][] per maggiori dettagli.

Il seguente codice, ad esempio, genererà il [`TypeError`][] perché non c'è un tipo di errore corrispondente nell'assertion:
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

Tuttavia, il seguente darà come risultato un `AssertionError` con il messaggio 'Got unwanted exception...' (C'è un'eccezione indesiderata):
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
  /Wrong value/,
  'Whoops'
);
// Genera: AssertionError: Ha un'eccezione indesiderata: Whoops
```

## assert.equal(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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
// AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Se i valori non sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà lanciato al posto di `AssertionError`.

## assert.fail([message])<!-- YAML
added: v0.1.21
-->* `message` {string|Error} **Default:** `'Failed'`

Genera un `AssertionError` con uno specifico messaggio di errore oppure un messaggio di errore predefinito. Se il parametro `message` è un'istanza di un [`Error`][] allora verrà generato al posto di `AssertionError`.

```js
const assert = require('assert').strict;

assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail(new TypeError('need array'));
// TypeError: need array
```

L'utilizzo di `assert.fail()` con più di due argomenti è possibile ma obsoleto. Vedi sotto per ulteriori dettagli.

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

> Stabilità: 0 - Obsoleto: Utilizza invece `assert.fail([message])` oppure altre funzioni assert.

Se il `message` è falso, il messaggio di errore viene impostato come vengono impostati i valori di `actual` ed `expected` separati dall'`operator` fornito. Se vengono specificati solo i due argomenti `actual` ed `expected`, l'`operator` sarà impostato in modo predefinito su `'!='`. Se il `message` viene fornito come terzo argomento, verrà utilizzato come messaggio di errore e gli altri argomenti verranno archiviati come proprietà dell'object generato. If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). Se non vengono forniti argomenti, verrà utilizzato il messaggio predefinito `Failed`.

```js
const assert = require('assert').strict;

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: fail

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: whoops

assert.fail(1, 2, new TypeError('need array'));
// TypeError: need array
```

Negli ultimi tre casi `actual`, `expected`, ed `operator` non hanno alcuna influenza sul messaggio di errore.

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

Genera `value` se `value` non è `undefined` o `null`. Questo è utile quando si verifica l'argomento `error` nei callback. Lo stacktrace contiene tutti i frames dall'errore passato ad `ifError()` inclusi i potenziali nuovi frames per `ifError()` stesso.

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

// Creare alcuni frames di errore casuali.
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
// OK

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK
```

Se i valori sono deep equal, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà lanciato al posto di `AssertionError`.

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

Test per la deep strict inequality. Opposto di [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

Se i valori sono deep strict equal, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà generato al posto di `AssertionError`.

## assert.notEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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

Se i valori sono uguali, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro di `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà generato al posto di `AssertionError`.

## assert.notStrictEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Verifica la strict inequality tra i parametri `actual` ed `expected` come determinato dal [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Identical input passed to notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

Se i valori sono strict equal, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà lanciato al posto di `AssertionError`.

## assert.ok(value[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->* `value` {any}
* `message` {string|Error}

Verifica se il `value` è vero. È equivalente a `assert.equal(!!value, true, message)`.

Se il `value` non è vero, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro di `message` è `undefined`, viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà lanciato al posto di `AssertionError`. Se non viene passato alcun argomento, il `message` verrà impostato sulla stringa: ``'No value argument passed to `assert.ok()`'``.

Tieni presente che nel `repl` il messaggio di errore sarà diverso da quello generato in un file! Vedi sotto per ulteriori dettagli.

```js
const assert = require('assert').strict;

assert.ok(true);
// OK
assert.ok(1);
// OK

assert.ok();
// AssertionError: No value argument passed to `assert.ok()`

assert.ok(false, 'it\'s false');
// AssertionError: it's false

// In the repl:
assert.ok(typeof 123 === 'string');
// AssertionError: false == true

// In a file (e.g. test.js):
assert.ok(typeof 123 === 'string');
// AssertionError: The expression evaluated to a falsy value:
//
//   assert.ok(typeof 123 === 'string')

assert.ok(false);
// AssertionError: The expression evaluated to a falsy value:
//
//   assert.ok(false)

assert.ok(0);
// AssertionError: The expression evaluated to a falsy value:
//
//   assert.ok(0)

// Using `assert()` works the same:
assert(0);
// AssertionError: The expression evaluated to a falsy value:
//
//   assert(0)
```

## assert.rejects(asyncFn\[, error\]\[, message\])<!-- YAML
added: v10.0.0
-->* `asyncFn` {Function|Promise}
* `error` {RegExp|Function|Object|Error}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. Se la funzione non restituisce un promise, `assert.rejects()` restituirà un `Promise` respinto con un errore [`ERR_INVALID_RETURN_VALUE`][]. In entrambi i casi viene saltato l'error handler.

Inoltre la natura asincrona di attendere il completamento si comporta in modo identico ad [`assert.throws()`][].

Se specificato, l'`error` può essere una [`Class`][], un [`RegExp`][], una funzione di convalida, un object in cui verrà testata ogni proprietà, oppure un'istanza di errore in cui verrà testata ogni proprietà per includere anche le proprietà non enumerabili `message` e `name`.

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

Da notare che `error` non può essere una stringa. Se viene fornita una stringa come secondo argomento, si presume che l'`error` venga omesso e che la stringa venga utilizzata per `message`. Questo può portare ad errori easy-to-miss (facili da perdere). Si prega di leggere attentamente l'esempio in [`assert.throws()`][] se si utilizza una stringa mentre viene considerato il secondo argomento.

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

Verifica la strict equality tra i parametri `actual` ed `expected` come determinato dal [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: Input A expected to strictly equal input B:
// + expected - actual
// - 1
// + 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError [ERR_ASSERTION]: Input A expected to strictly equal input B:
// + expected - actual
// - 1
// + '1'
```

Se i valori non sono strict equal, viene generato un `AssertionError` con una proprietà di `message` impostata uguale al valore del parametro di `message`. Se il parametro `message` è undefined (indefinito), viene assegnato un messaggio di errore predefinito. Se il parametro di `message` è un'istanza di un [`Error`][] allora verrà generato al posto di `AssertionError`.

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

L'utilizzo di un'espressione regolare esegue `.toString` sull'error object e di conseguenza includerà anche il l'error name.

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/
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

Da notare che `error` non può essere una stringa. Se viene fornita una stringa come secondo argomento, si presume che l'`error` venga omesso e che la stringa venga utilizzata per `message`. Questo può portare ad errori easy-to-miss (facili da perdere). Utilizzare lo stesso messaggio del messaggio di errore generato causerà un errore `ERR_AMBIGUOUS_ARGUMENT`. Si prega di leggere di leggere attentamente l'esempio seguente se si utilizza una stringa mentre viene considerato il secondo argomento:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// Il secondo argomento è una stringa e la funzione di input ha generato un errore.
// Il primo caso non verrà generato in quanto non corrisponde al messaggio di errore 
// generato dalla funzione di input!
assert.throws(throwingFirst, 'Second');
// Nel prossimo esempio il messaggio non ha alcun vantaggio sul messaggio proveniente 
// dall'errore e poiché non è chiaro se l'utente intendesse effettivamente farlo 
// corrispondere al messaggio di errore, Node.js ha generato un 
errore `ERR_AMBIGUOUS_ARGUMENT`.
assert.throws(throwingSecond, 'Second');
// Genera un errore:
// TypeError [ERR_AMBIGUOUS_ARGUMENT]

// La stringa viene utilizzata (come messaggio) solo nel caso in cui la funzione non viene eseguita:
assert.throws(notThrowing, 'Second');
// AssertionError [ERR_ASSERTION]: Missing expected exception: Second

// Se è stato ideato per corrispondere al messaggio di errore, allora fai questo:
assert.throws(throwingSecond, /Second$/);
// Non genera poiché i messaggi di errore corrispondono.
assert.throws(throwingFirst, /Second$/);
// Genera un errore:
// Error: First
//     at throwingFirst (repl:2:9)
```

A causa della notazione confusionaria, si raccomanda di non usare una stringa come secondo argomento. Ciò potrebbe portare ad errori difficult-to-sport (difficili da individuare).
