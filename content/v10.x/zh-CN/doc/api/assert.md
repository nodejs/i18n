# 断言 (Assert)

<!--introduced_in=v0.1.21-->

> 稳定性：2 - 稳定

`assert`模块提供了一组简单的断言测试，可用来测试不变量。

有` strict `（严格）和 ` legacy `（老版本）模式, 建议只使用 [` strict 模式 `] []。

更多关于平等性的对比，可以参考 [MDN 上 JavaScript 中的相等性判断](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)。

## Class: assert.AssertionError

`Error` 的子类，表示断言失败。 所有被 `assert` 模块抛出的错误都是 `AssertionError` 类的实例。

### new assert.AssertionError(options)
<!-- YAML
added: v0.1.21
-->
* `options` {Object}
  * `message` {string} 如果有此参数，错误信息会被设为此值。
  * `actual` {any} 错误实例的 `actual` 参数会包含此值。 在内部里用于 `actual` （实际上的）错误输入，例如在 [`assert.strictEqual()`] 中。
  * `expected` {any} 错误实例的 `expected` 参数会包含此值。 在内部里用于 `expected`（预期）错误输入，例如在 [`assert.strictEqual()`] 中。
  * `operator` {string} 错误实例的 `operator` 参数会包含此值。 在内部用于表示判断用的是哪个运算符（或者哪个断言函数触发了错误）。
  * `stackStartFn` {Function} 如果提供，生成的堆栈跟踪会移掉此函数之前的所有帧。

`Error` 的子类，表示断言失败。

所有实例都包含内置` Error `属性（` message ` 和 ` name `）和：

* `actual` {any} 设置为 actual （实际）值，比如在用 [`assert.strictEqual()`]时。
* `expected` {any} 设置为 expected（预期）值，比如在用 [`assert.strictEqual()`]时。
* `generatedMessage` {boolean} 表示信息是否是自动生成（是则 `true`）。
* `code` {string} 始终被设置为 `ERR_ASSERTION` 字符串，来表明错误是断言错误。
* ` operator ` {string} 设置为传入的运算符值。

```js
const assert = require('assert');

// 生成 AssertionError 来对比错误信息：
const { message } = new assert.AssertionError({
  actual: 1,
  expected: 2,
  operator: 'strictEqual'
});

// 验证错误输出
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

## Strict 模式
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

当使用 `strict 模式` 时，任何 `assert` 函数都会使用严格函数模式的等式。 例如，[`assert.deepEqual()`] 会等同于 [`assert.deepStrictEqual()`]。

除此之外，涉及对象的错误信息会产生一个错误差异比较，而不是展示两个对象。 Legacy 模式则不会这样。

可以通过如下方式使用：

```js
const assert = require('assert').strict;
```

错误差异比较的示例：

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

使用 `NODE_DISABLE_COLORS` 环境变量可以停用颜色。 请注意，这也会停用REPL中的颜色。

## Legacy 模式

> 稳定性：0 - 已弃用：改为使用Strict模式。

当直接访问 `assert`， 而不是通过 `strict` 属性访问时，[Abstract Equality Comparison（抽象等式比较）](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) 将被用于任何名称中没有“strict”的函数， 例如[`assert.deepEqual()`]。

可以通过如下方式使用：

```js
const assert = require('assert');
```

建议使用 [`strict 模式`]， 而不使用 [Abstract Equality Comparison（抽象等式比较）](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ， 因为后者通常会产生意想不到的结果。 这尤其适用于在比较规则宽松的地方，例如 [`assert.deepEqual()`]：

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

## assert(value[, message])
<!-- YAML
added: v0.5.9
-->
* `value` {any} The input that is checked for being truthy.
* `message` {string|Error}

[`assert.ok()`][]的别名。

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

**Strict 模式**

[`assert.deepStrictEqual()`] 的别名。

**Legacy 模式**

> 稳定性：0 - 已弃用：改为使用 [`assert.deepStrictEqual()`][]。

测试 `actual` 和 `expected` 参数之间是否深度相等。 将原始值与 [Abstract Equality Comparison（抽象等式比较）](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ) 进行比较。

仅考虑 [可枚举的 “own” 属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)。 [`assert.deepEqual()`] 的实现不测试对象的 [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) 或可枚举的自身[`Symbol`]属性。 对于此类检查，考虑使用[`assert.deepStrictEqual()`]。 [`assert.deepEqual()`] 可能会产生意想不到的结果。 以下示例不会抛出 `AssertionError`， 因为 [`RegExp`] 对象上的属性是不可枚举的类型：

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

针对 [`Map`][] 和 [`Set`][] 的例外。 因为 `Map` 和 `Set` 也比较了它们包含的项目。

“深度”相等意味着子对象的可枚举的“own”属性也会被比较：

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

如果两个值不相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

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

测试 `actual` 和 `expected` 参数之间是否深度相等。 “深度”相等意味着子对象中可枚举的“own”属性也会按以下规则进行递归比较。

### 比较的详细说明

* 原始值使用 [等值比较法](https://tc39.github.io/ecma262/#sec-samevalue) 进行比较，该方法被[`Object.is()`][] 使用。
* 对象的 [类型标签](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) 应该相同。
* 对象的 [`[[原型]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) 使用 [严格相等比较法](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) 进行比较。
* 仅考虑 [可枚举的 “own” 属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)。
* [`Error`][] 的名称和信息也会比较，即使不是可枚举的属性。
* 可枚举的自身 [`Symbol`][] 属性也会比较。
* [对象包装器](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) 会分别以对象以及解包装后值的方式进行比较。
* `对象` 属性的比较是无序的。
* `Map` 键和 `Set` 项目的比较是无序的。
* 当两边的值不相同或遇到循环引用时，递归会停止。
* [`WeakMap`][] 和 [`WeakSet`][] 的比较不依赖于它们的值。 请参阅下文了解更多详情。

```js
const assert = require('assert').strict;

// This fails because 1 !== '1'.
assert.deepStrictEqual({ a: 1 }, { a: '1' });
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
//   {
// -   a: 1
// +   a: '1'
//   }

// The following objects don't have own properties
const date = new Date();
const object = {};
const fakeDate = {};
Object.setPrototypeOf(fakeDate, Date.prototype);

// Different [[Prototype]]:
assert.deepStrictEqual(object, fakeDate);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - {}
// + Date {}

// Different type tags:
assert.deepStrictEqual(date, fakeDate);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - 2018-04-26T00:49:08.604Z
// + Date {}

assert.deepStrictEqual(NaN, NaN);
// OK, because of the SameValue comparison

// Different unwrapped numbers:
assert.deepStrictEqual(new Number(1), new Number(2));
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - [Number: 1]
// + [Number: 2]

assert.deepStrictEqual(new String('foo'), Object('foo'));
// OK because the object and the string are identical when unwrapped.

assert.deepStrictEqual(-0, -0);
// OK

// Different zeros using the SameValue Comparison:
assert.deepStrictEqual(0, -0);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
// - 0
// + -0

const symbol1 = Symbol();
const symbol2 = Symbol();
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 });
// OK, because it is the same symbol on both objects.
assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol2]: 1 });
// AssertionError [ERR_ASSERTION]: Input objects not identical:
// {
//   [Symbol()]: 1
// }

const weakMap1 = new WeakMap();
const weakMap2 = new WeakMap([[{}, {}]]);
const weakMap3 = new WeakMap();
weakMap3.unequal = true;

assert.deepStrictEqual(weakMap1, weakMap2);
// OK, because it is impossible to compare the entries

// Fails because weakMap3 has a property that weakMap1 does not contain:
assert.deepStrictEqual(weakMap1, weakMap3);
// AssertionError: Input A expected to strictly deep-equal input B:
// + expected - actual
//   WeakMap {
// -   [items unknown]
// +   [items unknown],
// +   unequal: true
//   }
```

如果两个值不相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

## assert.doesNotReject(asyncFn\[, error\]\[, message\])
<!-- YAML
added: v10.0.0
-->
* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. 如果一个函数没有返回promise，`assert.doesNotReject()` 会返回一个被拒绝的 `Promise` 并携带一个 [`ERR_INVALID_RETURN_VALUE`][] 值的错误。 无论那种情况，都跳过错误处理程序。

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

如果指定的话，`error` 可以是一个 [`Class`][]，[`RegExp`][] 或 验证函数。 请参考 [`assert.throws()`][] 以获取更多详细信息。

除了 await 的异步特性，完成行为与 [`assert.doesNotThrow()`][]完全相同。

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

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. 相反，考虑在不应抛出的特定代码路径旁边添加注释，并尽可能保持错误消息清晰的表达性。

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

如果一个错误被抛出，并且它与 `error` 参数所指定的类型相同，那么会抛出 `AssertionError`。 如果错误是不同的类型，或者 `error` 参数未定义，则将错误返回调用方。

如果指定的话，`error` 可以是一个 [`Class`][]，[`RegExp`][] 或 验证函数。 请参考 [`assert.throws()`][] 以获取更多详细信息。

下面这个示例会抛出 [`TypeError`][]， 因为在断言部分没有可匹配的错误类型：
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

然而，下面的示例会抛出带有错误信息 -“得到不想要的异常。。。”的 `AssertionError` ：
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  TypeError
);
```

如果 `AssertionError` 被抛出，并且提供一个值给 `message` 参数，那么 `message` 的值会被添加在 `AssertionError` 信息中：
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  /Wrong value/,
  'Whoops'
);
// Throws: AssertionError: Got unwanted exception: Whoops
```

## assert.equal(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

**Strict 模式**

[`assert.strictEqual()`][] 的别名。

**Legacy 模式**

> 稳定性：0 - 已弃用：改为使用 [`assert.strictEqual()`][]。

浅测试，使用 [抽象相等比较法](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ) 比较 `actual` 和 `expected` 之间的强制相等性。

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

如果两个值不相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

## assert.fail([message])<!-- YAML
added: v0.1.21
-->* `message` {string|Error} **Default:** `'Failed'`

抛出 `AssertionError`，并带上提供的错误信息或默认的错误信息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

```js
const assert = require('assert').strict;

assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail(new TypeError('need array'));
// TypeError: need array
```

使用 `assert.fail()` 并带上多个参数的方法可行，但已被废弃。 请参阅下文了解更多详情。

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

> 稳定性：0 - 已弃用：改为使用  `assert.fail([message])` 或其它断言函数。

如果 `message` 是虚值，错误消息被设置为由提供的 `operator` 分隔的 `actual` 和 `expected` 的值。 如果只提供了 `actual` 和 `expected` 两个参数，则 `operator` 的默认值是 `'!='`。 如果 `message` 被当做第三个参数提供，它将被作为错误消息，其它参数将作为各种属性存储在被抛出的对象上。 If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). 如果没有提供任何参数，将使用默认消息 `Failed`。

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

在后三种情形中，`actual`， `expected` 和 `operator` 对错误消息没有影响。

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

如果 `value` 不是 `undefined` 或 `null`，则抛出 `value`。 当在回调函数中测试 `error` 参数时，这一点很有用。 追溯栈包含传递给 `ifError()` 的错误中的所有帧，`ifError()` 包含它自身潜在的新帧。

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

// Create some random error frames.
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

**Strict 模式**

[`assert.notDeepStrictEqual()`][] 的别名。

**Legacy 模式**

> 稳定性：0 - 已弃用：改为使用 [`assert.notDeepStrictEqual()`][]。

用于深度非相等测试。 与 [`assert.deepEqual()`][] 相反。

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

如果两个值深度相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

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

测试深度严格不相等。 与 [`assert.deepStrictEqual()`][] 相反。

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

如果两个值深度严格相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

## assert.notEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

**Strict 模式**

[`assert.notStrictEqual()`][] 的别名。

**Legacy 模式**

> 稳定性：0 - 已弃用：改为使用 [`assert.notStrictEqual()`][]。

浅测试，使用 [抽象相等比较法](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `!=` ) 比较强制非相等性。

```js
const assert = require('assert');

assert.notEqual(1, 2);
// OK

assert.notEqual(1, 1);
// AssertionError: 1 != 1

assert.notEqual(1, '1');
// AssertionError: 1 != '1'
```

如果两个值相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

## assert.notStrictEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

测试由 [等值比较法](https://tc39.github.io/ecma262/#sec-samevalue) 确定的 `actual` 和 `expected` 参数之间的严格不相等性。

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Identical input passed to notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

如果两个值严格相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

## assert.ok(value[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->* `value` {any}
* `message` {string|Error}

测试 `value` 是否为真值。 它和 `assert.equal(!!value, true, message)` 功能完全一样。

如果 `value` 不是真值，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。 如果没有传入任何参数，`message` 会被设定为如下字符串：``‘无参数值传入 `assert.ok()`'``。

注意，在 `repl` 中，错误消息将与在文件中被抛出的不同。 请参阅下文了解更多详情。

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

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. 如果这个函数没有返回promise，`assert.rejects()` 会返回一个被拒绝的 `Promise` 并携带一个 [`ERR_INVALID_RETURN_VALUE`][] 错误。 无论哪种情况，都跳过错误处理程序。

除了 await 的异步特性，完成行为与 [`assert.throws()`][] 完全相同。

如果指定的话，`error` 可以是一个 [`Class`][]，[`RegExp`][] ，验证函数。每个属性都将被测试的对象，或测试一个 error 的实例中的每个属性，包括不可枚举的 `message` 和 `name` 属性。

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

注意， `error` 不能是一个字符串。 如果提供一个字符串作为第二个参数，那么会认为 `error` 被省略了，并且这个字符串会代替 `message`。 这会导致不容易被发现的错误。 如果考虑使用字符串作为第二个参数，请仔细阅读 [`assert.throws()`][] 中的示例。

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

测试由 [等值比较法](https://tc39.github.io/ecma262/#sec-samevalue) 确定的 `actual` 和 `expected` 参数之间的严格相等性。

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

如果两个值不是严格相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。 如果 `message` 参数是 [`Error`][] 的实例，则会抛出它而不是 `AssertionError`。

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

使用构造函数验证instanceof：

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  Error
);
```

使用 [`RegExp`][] 验证错误消息：

使用正则表达式在error对象上运行 `.toString`，因此也将包含error名称。

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/
);
```

自定义错误验证：

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

注意， `error` 不能是一个字符串。 如果提供一个字符串作为第二个参数，那么会认为 `error` 被省略了，并且这个字符串会代替 `message`。 这会导致不容易被发现的错误。 如果使用被抛出的错误信息，会导致产生 `ERR_AMBIGUOUS_ARGUMENT` 错误。 如果考虑使用字符串作为第二个参数，请仔细阅读下面的示例。
```js
function throwingFirst() {
  throw new Error('First');
}
function throwingSecond() {
  throw new Error('Second');
}
function notThrowing() {}

// The second argument is a string and the input function threw an Error.
// The first case will not throw as it does not match for the error message
// thrown by the input function!
assert.throws(throwingFirst, 'Second');
// In the next example the message has no benefit over the message from the
// error and since it is not clear if the user intended to actually match
// against the error message, Node.js thrown an `ERR_AMBIGUOUS_ARGUMENT` error.
assert.throws(throwingSecond, 'Second');
// Throws an error:
// TypeError [ERR_AMBIGUOUS_ARGUMENT]

// The string is only used (as message) in case the function does not throw:
assert.throws(notThrowing, 'Second');
// AssertionError [ERR_ASSERTION]: Missing expected exception: Second

// If it was intended to match for the error message do this instead:
assert.throws(throwingSecond, /Second$/);
// Does not throw because the error messages match.
assert.throws(throwingFirst, /Second$/);
// Throws an error:
// Error: First
//     at throwingFirst (repl:2:9)
```

由于令人困惑的表示方法，建议不要使用字符串作为第二个参数。 这可能会导致难以发现的错误。
