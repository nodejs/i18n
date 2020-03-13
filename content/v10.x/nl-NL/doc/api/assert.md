# Assert

<!--introduced_in=v0.1.21-->

> Stabiliteit: 2 - stabiel

De `assert` module biedt een simpele set bevestigingshulpmiddelen die kunnen worden gebruikt om invariabelen te testen.

Een `strict` en een `legacy` module bestaan, maar het is aanbevolen om alleen de [`strict mode`][] module te gebruiken.

Voor meer informatie over de gebruikte gelijkheidsvergelijkingen zie [MDN's guide on equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Klasse: assert.AssertionError

Een subklasse van `Error` die het falen van een bewering aangeeft. Alle fouten die door de `assert` module gegooid zijn, zullen instanties zijn van de `AssertionError` klasse.

### new assert.AssertionError(options)
<!-- YAML
added: v0.1.21
-->
* `options` {Object}
  * `message` {string} Indien aanwezig, zal het foutbericht op deze waarde worden ingesteld.
  * `actual` {any} De `actual` eigenschap van de fout instantie zal deze waarde bevatten. Intern gebruikt voor de `actual` fout input in het geval waar bijv. [`assert.strictEqual()`] is gebruikt.
  * `expected` {any} De `expected` eigenschap van de fout instantie zal deze waarde bevatten. Intern gebruikt voor de `expected` fout input waar bijv. [`assert.strictEqual()`] is gebruikt.
  * `operator` {string} De `operator` eigenschap van de fout instantie zal deze waarde bevatten. Intern gebruikt om aan te geven welke werkwijze werd gebruikt ter vergelijking (of welke bevestigingsfunctie de fout heeft veroorzaakt).
  * `stackStartFn` {Function} Indien aanwezig, de gegenereerde stack trace gaat alle frames verwijderen tot aan de verstrekte functie.

Een subklasse van `Error` die het falen van een bewering aangeeft.

Alle exemplaren bevatten de ingebouwde `Error` eigenschappen (`message` en `name`) en:

* `actual` {any} Instellen op de werkelijke waarde wanneer bijv. [`assert.strictEqual()`] wordt gebruikt.
* `expected` {any} Instellen op de verwachte waarde wanneer bijv. [`assert.strictEqual()`] wordt gebruikt.
* `generatedMessage` {boolean} Geeft aan of de boodschap automatisch was gegenereerd (`true`) of niet.
* `code` {string} Dit is altijd ingesteld op de tekenreeks `ERR_ASSERTION` om aan te geven dat de fout eigenlijk een fout in de bewering is.
* `operator` {string} Ingesteld op de doorgegeven in beheerderswaarde.

```js
const assert = require('assert');

// Genereer een AssertionError om de foutmelding later te vergelijken:
const { message } = new assert.AssertionError({
  actual: 1,
  expected: 2,
  operator: 'strictEqual'
});

// verifieer foutuitvoering :
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

## Strikte modus
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

Bij het gebruik van de `strict mode`, zal elke `assert` functie de gelijkheid gebruiken in de strikte functie modus. Dus zal [`assert.deepEqual()`][] bijvoorbeeld, hetzelfde werken als [`assert.deepStrictEqual()`][].

Bovendien zullen foutmeldingen die betrekking hebben op objecten een fout diff produceren, in plaats van beide objecten weer te geven. Dit is niet het geval voor de legacy modus.

Het kan worden bereikt met behulp van:

```js
const assert = require('assert').strict;
```

Voorbeeld fout diff:

```js
const assert = require('assert').strict;

assert.deepEqual([[[1, 2, 3]], 4, 5], [[[1, 2, '3']], 4, 5]);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual ... Regels overgeslagen
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

Om kleuren te deactiveren, gebruik de `NODE_DISABLE_COLORS` omgevingsvariabele. Houd er rekening mee dat dit ook de kleuren in de REPL zal deactiveren.

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
* `value` {any} The input that is checked for being truthy.
* `message` {string|Error}

Een alias van [`assert.ok()`][].

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

**Strikte modus**

Een alias van [`assert.deepStrictEqual()`][].

**Legacy modus**

> Stabiliteit: 0 - Afgekeurd: Gebruik als alternatief [`assert.deepStrictEqual()`][].

Test voor diepe gelijkheid tussen de `actual` en `expected` parameters. Primitieve waarden worden vergeleken met de [Abstract Equality Comparison](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Enkel [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) worden overwogen. De [`assert.deepEqual()`][] uitvoering test niet de [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects or enumerable own [`Symbol`][] eigenschappen. Voor dergelijke controles, kan men overwegen als alternatief [`assert.deepStrictEqual()`][] te gebruiken. [`assert.deepEqual()`][] kan onverwachte verrassende resultaten geven. Het volgende voorbeeld gooit geen `AssertionError` want de eigenschappen op het [`RegExp`][] object zijn niet telbaar:

```js
// WAARSCHUWING: Dit gooit geen AssertionError!
assert.deepEqual(/a/gi, new Date());
```

Een uitzondering wordt gemaakt voor [`Map`][] en [`Set`][]. `Map`s en `Set`s hebben hun opgenomen items ook vergeleken, als verwacht.

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

Wanneer de waarden niet gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

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

Test voor diepe gelijkheid tussen de `actual` en `expected` parameters. "Diepe" gelijkheid betekent dat de telbare "eigen" eigenschappen van kind objecten recursief ook door de volgende regels worden geëvalueerd.

### Vergelijkingsdetails

* Primitieve waarden worden vergeleken met behulp van de [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue), gebruikt door [`Object.is()`][].
* [Type tags](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) van objecten moeten gelijk zijn.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) van objecten wordt vergeleken met behulp van de [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Enkel [enumerable "own" properties](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties) worden overwogen.
* [`Error`][] namen en berichten worden altijd vergeleken, zelfs als deze geen telbare eigenschappen zijn.
* Telbaar eigen [`Symbol`][] eigenschappen worden ook vergeleken.
* [Object wrappers](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) worden zowel als object als oningepakte waarden vergeleken.
* `Object` eigenschappen worden ongeordend vergeleken.
* `Map` sleutels en `Set` items worden ongeordend vergeleken.
* Recursie stopt als beide zijden verschillen of beide zijden een circulaire verwijzing tegenkomen.
* [`WeakMap`][] en [`WeakSet`][] vergelijkingen steunen niet op hun waarden. Zie hieronder voor meer informatie.

```js
const assert = require('assert').strict;

// Dit faalt want 1 !== '1'.
assert.deepStrictEqual({ a: 1 }, { a: '1' });
// AssertionError: Invoer A verwacht om strikt diep-gelijk te zijn aan invoer B: 
// + verwacht - bestaand
//   {
// -   a: 1
// +   a: '1'
//   }

// De volgende objecten hebben geen eigenschappen
const datum = new Date();
const object = {};
const fakeDate = {};
Object.setPrototypeOf(fakeDate, Date.prototype);

// Verschillend [[Prototype]]:
assert.deepStrictEqual(object, fakeDate);
// AssertionError: Invoer A verwacht om strikt diep-gelijk te zijn aan invoer B.
// + verwacht - bestaand
// - {}
// + Date {}

// Verschillende typen labels:
assert.deepStrictEqual(date, fakeDate);
// AssertionError: Invoer A verwacht om strikt diep-gelijk te zijn aan invoer B:
// + verwacht - bestaand
// - 2018-04-26T00:49:08.604Z
// + Date {}

assert.deepStrictEqual(NaN, NaN);
// OK, vanwege de SameValue vergelijking

// Verschillende uitgepakte nummers:
assert.deepStrictEqual(nieuw Nummer(1), nieuw Nummer(2));
// AssertionError: Invoer A verwacht om strikt diep-gelijk te zijn aan invoer B:
// + verwacht - bestaand
// - [Nummer: 1]
// + [Nummer: 2]

assert.deepStrictEqual(new String('foo'), Object('foo'));
// OK want het object en de tekenreeks zijn identiek wanneer zij uitgepakt zijn.

assert.deepStrictEqual(-0, -0);
// OK

// Verschillende nullen gebruiken de SameValue Vergelijking:
assert.deepStrictEqual(0, -0);
// AssertionError: Invoer A verwacht om strikt diep-gelijk te zijn aan input B:
// + verwacht - bestaand
// - 0
// + -0

const symbol1 = Symbol();
const symbol2 = Symbol();
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 });
// OK, want het is hetzelfde symbool op beide objecten.
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol2]: 1 });
// AssertionError [ERR_ASSERTION]: Invoer objecten niet identiek:
// {
//   [Symbol()]: 1
// }

const weakMap1 = new WeakMap();
const weakMap2 = new WeakMap([[{}, {}]]);
const weakMap3 = new WeakMap();
weakMap3.unequal = true;

assert.deepStrictEqual(weakMap1, weakMap2);
// OK, want het is onmogelijk om de invoeren te vergelijken

// Faalt want weakMap3 heeft een eigenschap dat weakMap1 niet bevat:
assert.deepStrictEqual(weakMap1, weakMap3);
// AssertionError: Invoer A verwacht om strikt diep-gelijk invoer B:
// + verwacht - bestaand
//   WeakMap {
// -   [items unknown]
// +   [items unknown],
// +   unequal: true
//   }
```

Wanneer de waarden niet gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

## assert.doesNotReject(asyncFn\[, error\]\[, message\])
<!-- YAML
added: v10.0.0
-->
* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. Wanneer de functie geen belofte retourneert, zal `assert.doesNotReject()` een afgewezen `Promise` met een [`ERR_INVALID_RETURN_VALUE`][] fout retourneren. In beide gevallen wordt de foutafhandeling overgeslagen.

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

Wanneer dit is gespecificeerd, kan een `error` een [`Class`][], [`RegExp`][] of een valideringsfunctie zijn. Zie [`assert.throws()`][] voor meer details.

Naast de async aard te wachten op de voltooiing, gedraagt het zich identiek aan [`assert.doesNotThrow()`][].

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

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. Als alternatief, overweeg het toevoegen van een opmerking naast het specifieke code pad wat niet zou moeten gooien en probeer de foutberichten zo expressief mogelijk te houden.

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

Als een fout is geworpen en het is hetzelfde type als die is gespecificeerd door de `error` parameter, dan wordt een `AssertionError` geworpen. Wanneer de fout van een ander type is, of al de `error` parameter ongedefinieerd is, dan wordt de fout teruggegeven aan de aanroepfunctie.

Wanneer dit is gespecificeerd, kan een `error` een [`Class`][], [`RegExp`][] of een valideringsfunctie zijn. Zie [`assert.throws()`][] voor meer details.

Het volgende, bijvoorbeeld, zal de [`TypeError`][] gooien, want er is geen overeenkomstig fout type in de bewering:
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

Het volgende zal echter resulteren in een `AssertionError` met de boodschap 'Kreeg ongewenste uitzondering...':
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
  /Wrong value/,
  'Whoops'
);
// Gooit: AssertionError: Kreeg ongewenste uitzondering: Oeps
```

## assert.equal(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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
// AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Wanneer de waarden niet gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

## assert.fail([message])<!-- YAML
added: v0.1.21
-->* `message` {string|Error} **Default:** `'Failed'`

Werpt een `AssertionError` met de toegeleverde foutmelding of een standaard foutmelding. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

```js
const assert = require('assert').strict;

assert.fail();
// AssertionError [ERR_ASSERTION]: Gefaald

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail(new TypeError('need array'));
// TypeError: reeks benodigd
```

Het gebruik van `assert.fail()` met meer dan twee argumenten is mogelijk maar verouderd. Zie hieronder voor meer details.

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

> Stabiliteit: 0 - Afgekeurd: Gebruik `assert.fail([message])` of andere bevestigingsfuncties als alternatief.

Wanneer het `message` falsy is, wordt de foutmelding ingesteld als de waarden van `actual` en `expected` gescheiden door de verstrekte `operator`. Wanneer alleen de twee `actual` en `expected` argumenten zijn verstrekt, dan zal de `operator` naar de standaard `'!='` gaan. Wanneer `message` is verschaft als derde argument, zal het als foutmelding gebruikt worden en de andere argumenten worden dan opgeslagen als eigenschappen op het geworpen object. If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). Wanneer geen argumenten worden gegeven, dan wordt het standaard `Failed` bericht gebruikt.

```js
const assert = require('assert').strict;

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: mislukt

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: oeps

assert.fail(1, 2, new TypeError('need array'));
// TypeError: reeks nodig
```

In de laatste drie gevallen hebben `actual`, `expected`, en `operator` geen invloed op de foutmelding.

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

Werpt `value` wanneer `value` niet `undefined` is, of `null`. Dit is handig bij het testen van het `error` argument in callbacks. De stack trace bevat alle frames van de fout die is doorgegeven aan `ifError()` inclusief de potentiële nieuwe frames voor `ifError()` zelf.

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

// Creëer willekeurige fout frames.
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
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj2);
// OK

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK
```

Wanneer de waarden diep gelijk zijn, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

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

Test op diep strikte ongelijkheid. Tegenovergestelde van [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

Wanneer de waarden diep en strikt gelijk zijn, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een standaard foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

## assert.notEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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

Wanneer de waarden gelijk zijn, wordt er een `AssertionError` gegooid met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een standaard foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

## assert.notStrictEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Test strikte ongelijkheid tussen de `actual` en de `expected` parameters, als bepaald door de [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Identical input passed to notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

Wanneer de waarden diep gelijk zijn, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

## assert.ok(value[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->* `value` {any}
* `message` {string|Error}

Test of `value` truthy is. Het is gelijkwaardig aan `assert.equal(!!value, true, message)`.

Als de `value` niet truthy is, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter `undefined` is, wordt er een standaard foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`. Wanneer er geen enkel argument tot stand komt dan wordt het `message` ingesteld op de tekenreeks: ``'No value argument passed to `assert.ok()`'``.

Let op dat de foutmelding in de `repl` anders zal zijn dan de melding die in het bestand is geworpen! Zie hieronder voor meer details.

```js
const assert = require('assert').strict;

assert.ok(true);
// OK
assert.ok(1);
// OK

assert.ok();
// AssertionError: Geen waardeargument doorgegeven aan `assert.ok()`

assert.ok(false, 'it\'s false');
// AssertionError: it's false

// In the repl:
assert.ok(typeof 123 === 'string');
// AssertionError: false == true

// In a file (e.g. test.js):
assert.ok(typeof 123 === 'string');
// AssertionError: De uitdrukking is geëvalueerd op een falsy waarde:
//
//   assert.ok(typeof 123 === 'string')

assert.ok(false);
// AssertionError: De uitdrukking is geëvalueerd op een falsy waarde:
//
//   assert.ok(false)

assert.ok(0);
// AssertionError: De uitdrukking is geëvalueerd op een falsy waarde:
//
//   assert.ok(0)

// Using `assert()` werkt hetzelfde:
assert(0);
// AssertionError: De uitdrukking is geëvalueerd op een falsy waarde:
//
//   assert(0)
```

## assert.rejects(asyncFn\[, error\]\[, message\])<!-- YAML
added: v10.0.0
-->* `asyncFn` {Function|Promise}
* `error` {RegExp|Function|Object|Error}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. Wanneer de functie geen belofte retourneert, zal `assert.rejects()` een afgewezen `Promise` met een [`ERR_INVALID_RETURN_VALUE`][] fout retourneren. In beide gevallen wordt de foutafhandeling overgeslagen.

Naast de async aard te wachten op voltooiing, gedraagt het zich identiek aan [`assert.throws()`][].

Wanneer dit is gespecificeerd, kan de `error` een [`Class`][] zijn, een [`RegExp`][], een validatiefunctie, een object waarvoor iedere eigenschap getest wordt, of een foutvoorval waarbij iedere eigenschap wordt getest, inclusief de ontelbare `message` en `name` eigenschappen.

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

Let op dat `error` geen tekenreeks kan zijn. Wanneer een tekenreeks wordt verstrekt als tweede argument, dan wordt verondersteld dat `error` wordt weggelaten, en wordt als alternatief de tekenreeks voor `message` gebruikt. Dit kan leiden tot makkelijk te missen fouten. Lees alsjeblieft het voorbeeld in [`assert.throws()`][] nauwkeurig door, wanneer het gebruik van een tekenreeks als tweede argument wordt overwogen.

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

Test strikte gelijkheid tussen de `actual` en de `expected` parameters, als bepaald door de [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: Invoer A verwacht om strikt gelijk te zijn aan invoer B:
// + verwacht - werkelijk
// - 1
// + 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError [ERR_ASSERTION]: Invoer A verwacht om strikt gelijk te zijn aan invoer B:
// + verwacht - werkelijk
// - 1
// + '1'
```

Wanneer de waarden niet strikt gelijk zijn, wordt er een `AssertionError` geworpen met een `message` eigenschap, gelijkgesteld aan de waarde van de `message` parameter. Wanneer de `message` parameter onbepaald is, wordt er een standaard foutmelding toegewezen. Wanneer de `message` parameter een voorval is van een [`Error`][] dan zal die gegooid worden in plaats van de `AssertionError`.

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

Gebruik van een reguliere expressie draait `.toString` op het fout-object, en zal daarom ook de naam van de fout bevatten.

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/
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

Let op dat `error` geen tekenreeks kan zijn. Wanneer een tekenreeks wordt verstrekt als tweede argument, dan wordt verondersteld dat `error` wordt weggelaten, en wordt als alternatief de tekenreeks voor `message` gebruikt. Dit kan leiden tot makkelijk te missen fouten. Het gebruik van hetzelfde bericht als de geworpen foutmelding zal resulteren in een `ERR_AMBIGUOUS_ARGUMENT` fout. Lees alsjeblieft het voorbeeld hieronder nauwkeurig door, wanneer het gebruik van een tekenreeks als tweede argument wordt overwogen:
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// Het tweede argument is een tekenreeks en de invoerfunctie heeft een Fout geworpen.
// Het eerste voorval zal niet werpen omdat het niet overeenkomt met de foutmelding 
// geworpen door de invoerfunctie!
assert.throws(throwingFirst, 'Second');
// In het volgende voorbeeld heeft het bericht geen voordeel boven het bericht van de
// fout en omdat het niet duidelijk is of de gebruiker het heeft bedoeld om daadwerkelijk overeen te komen 
// met de foutmelding, Node.js heeft een `ERR_AMBIGUOUS_ARGUMENT` fout geworpen.
assert.throws(throwingSecond, 'Second');
// Werpt een fout:
// TypeError [ERR_AMBIGUOUS_ARGUMENT]

// De tekenreeks wordt alleen gebruikt (als bericht) in het geval dat de functie niet werpt:
assert.throws(notThrowing, 'Second');
// AssertionError [ERR_ASSERTION]: Mist verwachte uitzondering: Tweede

// Als bedoeld was om met het foutbericht overeen te komen, doe dit dan als alternatief:
assert.throws(throwingSecond, /Second$/);
// Werpt niet omdat de foutberichten overeenkomen.
assert.throws(throwingFirst, /Second$/);
// Throws an error:
// Error: First
//     at throwingFirst (repl:2:9)
```

Vanwege de verwarrende notatie, is het aanbevolen de tekenreeks niet als tweede argument te gebruiken. Dit kan leiden tot moeilijk te vinden fouten.
