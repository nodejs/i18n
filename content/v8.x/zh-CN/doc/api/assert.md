# 断言 (Assert)

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`assert`模块提供了一组简单的断言测试，可用来测试不变量。

有` strict `（严格）和 ` legacy `（老版本）模式, 建议只使用 [` strict 模式 `] []。

更多关于平等性的对比，可以参考 [MDN 上 JavaScript 中的相等性判断](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)。

## Strict 模式
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

可以通过如下方式使用：

```js
const assert = require('assert').strict;
```

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
* `value` {any}
* `message` {any}

[`assert.ok()`][]的别名。

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

**Strict 模式**

[`assert.deepStrictEqual()`] 的别名。

**Legacy 模式**

> 稳定性：0 - 已弃用：改为使用 [`assert.deepStrictEqual()`][]。

测试 `actual` 和 `expected` 参数之间是否深度相等。 将原始值与 [Abstract Equality Comparison（抽象等式比较）](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ) 进行比较。

仅考虑 [可枚举的 “own” 属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)。 [`assert.deepEqual()`] 的实现不测试对象的 [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots)，附加的符号，或不可枚举的属性 - 对这些类型的测试，考虑使用[`assert.deepStrictEqual()`][]。 这可能会导致不可预期的结果。 以下示例不会抛出 `AssertionError`， 因为 [`RegExp`] 对象上的属性是不可枚举的类型：

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

针对 [`Map`][] 和 [`Set`][] 的例外。 因为 Map 和 Set 也比较了它们包含的项目。

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

如果两个值不相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

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

通常与`assert.deepEqual()`相同，但有一些例外：

### 比较的详细说明

* 使用 [严格相等比较法](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `==＝` ) 对原始值进行比较。
* 使用 [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) 来比较Set值和Map键值。 (这意味着在比较它们时不会出现[警告](#assert_caveats))。
* 对象的 [类型标签](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) 应该相同。
* 对象的 [`[[原型]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) 使用 [严格相等比较法](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) 进行比较。
* 仅考虑 [可枚举的 “own” 属性](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties)。
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* [对象包装器](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) 会分别以对象以及解包装后值的方式进行比较。
* Object properties are compared unordered.
* Map keys and Set items are compared unordered.
* 当两边的值不相同或遇到循环引用时，递归会停止。

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

如果两个值不相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

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

断言 `block` 函数不会抛出错误。 请参考 [`assert.throws()`][] 以获取更多详细信息。

请注意，使用 `assert.doesNotThrow()` 实际上没有用处，因为通过捕获一个错误并再抛出这个错误一次，并没有任何好处。 相反，考虑在不应抛出的特定代码路径旁边添加注释，并尽可能保持错误消息清晰的表达性。

当 `assert.doesNotThrow()` 被调用时，它会立即调用 `block` 函数。

如果一个错误被抛出，并且它与 `error` 参数所指定的类型相同，那么会抛出 `AssertionError`。 如果错误是不同的类型，或者 `error` 参数未定义，则将错误返回调用方。

下面这个示例会抛出 [`TypeError`][]， 因为在断言部分没有可匹配的错误类型：

```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

然而，下面的示例会抛出带有错误信息 - “得到不想要的异常 (TypeError)...” 的 `AssertionError` ：

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
//AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

如果两个值不相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

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

抛出一个 `AssertionError` 错误. 如果 `message` 是虚值，错误消息被设置为由提供的 `operator` 分隔的 `actual` 和 `expected` 的值。 如果只提供了 `actual` 和 `expected` 两个参数，则 `operator` 的默认值是 `'!='`。 如果 `message` 是被提供的唯一参数，它将被作为错误消息，其它参数将作为属性存储在被抛出的对象上。 如果提供了 `stackStartFunction`， 所有在这个函数之上的栈帧将被从追溯栈中移除。（请参见 [`Error.captureStackTrace`] ）。

```js
const assert = require('assert').strict;

assert.fail(1, 2, undefined, '>');
// AssertionError [ERR_ASSERTION]: 1 > 2

assert.fail(1, 2, 'fail');
// AssertionError [ERR_ASSERTION]: fail

assert.fail(1, 2, 'whoops', '>');
// AssertionError [ERR_ASSERTION]: whoops
```

*注意*：在后两种情况中，`actual`， `expected` 和 `operator` 对错误消息没有影响。

```js
assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail('a', 'b');
// AssertionError [ERR_ASSERTION]: 'a' != 'b'
```

使用 `stackStartFunction` 截断异常的追溯栈的示例：
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

如果 `value` 为真值，抛出`value`。 当在回调函数中测试 `error` 参数时，这一点很有用。

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
// OK: obj1 and obj2 are not deeply equal

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK: obj1 and obj4 are not deeply equal
```

如果两个值深度相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

## assert.notDeepStrictEqual(actual, expected[, message])
<!-- YAML
added: v1.2.0
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

测试深度严格不相等。 与 [`assert.deepStrictEqual()`][] 相反。

```js
const assert = require('assert').strict;

assert.notDeepEqual({ a: 1 }, { a: '1' });
// AssertionError: { a: 1 } notDeepEqual { a: '1' }

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

如果两个值深度严格相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

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

如果两个值相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

## assert.notStrictEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

使用 [严格相等比较法](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `!==` ) 测试严格不相等性。

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError: 1 !== 1

assert.notStrictEqual(1, '1');
// OK
```

如果两个值严格相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数值。 如果 `message` 参数未定义，则赋予默认错误消息。

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

测试 `value` 是否为真值。 它和 `assert.equal(!!value, true, message)` 功能完全一样。

如果 `value` 不是真值，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

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

使用 [严格相等比较法](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ) 测试严格相等性。

```js
const assert = require('assert').strict;

assert.strictEqual(1, 2);
// AssertionError: 1 === 2

assert.strictEqual(1, 1);
// OK

assert.strictEqual(1, '1');
// AssertionError: 1 === '1'
```

如果两个值不是严格相等，会抛出一个带有 `message` 属性的 `AssertionError`， 其中该属性的值等于传入的 `message` 参数的值。 如果 `message` 参数未定义，则赋予默认错误消息。

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

如果指定的话，假如block拒绝失败，`message` 会是由 `AssertionError` 提供的消息。

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

期望 `block` 函数抛出一个错误。

If specified, `error` can be a constructor, [`RegExp`][], a validation function, or an object where each property will be tested for.

如果指定的话，假如block抛出失败，`message` 会是由 `AssertionError` 提供的消息。

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

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /value/
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

自定义error对象或error实例：

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

注意， `error` 不能是一个字符串。 如果提供一个字符串作为第二个参数，那么会认为 `error` 被省略了，并且这个字符串会代替 `message`。 这会导致不容易被发现的错误。 Please read the example below carefully if using a string as the second argument gets considered:
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

由于令人困惑的表示方法，建议不要使用字符串作为第二个参数。 这可能会导致难以发现的错误。

## 注意事项

在如下情况中，请考虑使用ES2015中的 [`Object.is()`][]，它会使用[SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero)来进行比较。

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

请参考[MDN上关于相等比较和等同性的指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)以获取更多信息。
