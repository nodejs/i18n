# Xác nhận (Assert)

<!--introduced_in=v0.10.0-->

> Tính ổn định: 2 - Stable

Mô-đun `assert` cung cấp một tập các thí nghiệm xác nhận đơn giản dùng để kiểm tra các bất biến.

Mặc dù có sẵn chế độ `strict` và `legacy`, nhưng chúng tôi khuyến nghị chỉ sử dụng [`strict mode`][].

Để biết thêm thông tin về các so sánh bình đằng được sử dụng, tham khảo thêm [hướng dẫn MDN về sự giống nhau và các so sánh bình đẳng](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Chế độ nghiêm ngặt (Strict mode)
<!-- YAML
added: V8.13.0
changes:
  - version: V8.13.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Added strict mode to the assert module.
-->

When using the `strict mode`, any `assert` function will use the equality used in the strict function mode. So [`assert.deepEqual()`][] will, for example, work the same as [`assert.deepStrictEqual()`][].

Nó có thể truy cập bằng cách sử dụng:

```js
const assert = require('assert').strict;
```

## Chế độ Legacy

> Tính ổn định: 0 - Không chấp thuận: Sử dụng chế độ nghiêm ngặt thay thế.

Khi truy cập trực tiếp `assert` thay vì truy cập thuộc tính `strict`, [Abstract Equality Comparison (So sánh đẳng thức trừu tượng)](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) sẽ được dùng cho các hàm không chứa "strict", ví dụ như [`assert.deepEqual()`][].

Nó có thể truy cập bằng cách sử dụng:

```js
const assert = require('assert');
```

Chúng tôi khuyến nghị sử dụng [`strict mode`][] thay vì [So sánh đẳng thức trừu tượng](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison), vì thông thường kết quả trả về sẽ không như mong đợi. Điều này đặc biệt đúng khi các quy tắc so sánh là sai, ví dụ như trong [`assert.deepEqual()`][]:

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

Cách gọi khác của [`assert.ok()`][].

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

**Chế độ nghiêm ngặt (Strict mode)**

Cách gọi khác của [`assert.deepStrictEqual()`][].

**Chế độ Legacy**

> Tính ổn định: 0 - Không chấp thuận: Sử dụng [`assert.deepStrictEqual()`][] thay thế.

Thử nghiệm các thông số cho đẳng thức sâu giữa `actual` và `expected`. Giá trị ban đầu được so sánh với [So sánh đẳng thức trừu tượng](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Chỉ xem xét [thuộc tính "own" có thể đếm được](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). The [`assert.deepEqual()`][] implementation does not test the [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) of objects, attached symbols, or non-enumerable properties — for such checks, consider using [`assert.deepStrictEqual()`][] instead. This can lead to some potentially surprising results. For example, the following example does not throw an `AssertionError` because the properties on the [`RegExp`][] object are not enumerable:

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

[`Map`][] và [`Set`][] là có ngoại lệ. Bởi vì Map và Set đã so sánh các hạng mục bao hàm trong nó như mong đợi.

Đẳng thức "deep" (sâu) nghĩa rằng các thuộc tính "own" của các đối tượng con cũng sẽ được đánh giá:

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

Nếu như các giá trị không thỏa mãn bằng nhau, nó sẽ hiển thị`AssertionError` với thuộc tính `message` có giá trị bằng với thuộc tính `message`. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định.

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

### Chi tiết so sánh

* Primitive values are compared using the [Strict Equality Comparison](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) ( `===` ).
* Set values and Map keys are compared using the [SameValueZero](https://tc39.github.io/ecma262/#sec-samevaluezero) comparison. (Which means they are free of the [caveats](#assert_caveats)).
* [Các loại thẻ gắn](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) của đối tượng cần giống nhau.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) của các đối tượng được so sánh sử dụng [So sánh đẳng thức nghiêm ngặt](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Chỉ xem xét [thuộc tính "own" có thể đếm được](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* [`Error`][] messages are always compared, even though this property is non-enumerable.
* [Các lớp bọc đối tượng](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) được so sánh như là các đối tượng và giá trị không bọc.
* Object properties are compared unordered.
* Map keys and Set items are compared unordered.
* Quá trình đệ quy dừng khi hai bên khác nhau hoặc hai bên gặp phải tham chiếu vòng tròn.

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

Nếu các giá trị không được cân bằng, `AssertionError` được trả ra với thuộc tính `message` có giá trị của thông số `message`. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định.

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

Xác nhận hàm `block` không gửi đi kết quả lỗi. See [`assert.throws()`][] for more details.

Hãy nhớ: Việc sử dụng `assert.doesNotThrow()` không thực sự hữu ích vì nó không có lợi ích gì từ việc bắt lỗi sau đó tiếp tục lại gửi đi. Thay vào đó, hãy xem xét việc thêm các nhận xét cạnh các đoạn mã cụ thể đáng lẽ không nên gửi đi và giữ các thông báo lỗi càng chi tiết rõ ràng càng tốt.

Khi gọi `assert.doesNotThrow()`, nó sẽ gọi ngay lập tức hàm `block`.

Khi phát hiện có lỗi, nó sẽ được chỉ định cùng loại từ tham số `error`, sau đó gửi đi `AssertionError`. Nếu đó là một lỗi khác, hoặc tham số `error` không được xác định, thì lỗi đó sẽ truyền lại cho trình gọi.

Trong ví dụ dưới đây sẽ trả giá trị [`TypeError`][] vì không có loại lỗi nào tương tự trong bộ phận xác nhận:

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

Nếu đưa ra `AssertionError` và giá trị được cung cấp cho tham số `message`, giá trị của `message` sẽ được thêm vào thông báo `AssertionError`:

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

**Chế độ nghiêm ngặt (Strict mode)**

Cách gọi khác của [`assert.strictEqual()`][].

**Chế độ Legacy**

> Tính ổn định: 0 - Không chấp thuận: Sử dụng [`assert.strictEqual()`][] thay thế.

Thử nghiệm nhanh, sử dụng [So sánh đẳng thức trừu tượng](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ) để so sánh giữa các tham số `actual` và `expected`.

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

Nếu như các giá trị không thỏa mãn bằng nhau, nó sẽ hiển thị`AssertionError` với thuộc tính `message` có giá trị bằng với thuộc tính `message`. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định.

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

Ví dụ sử dụng dưới đây của `stackStartFunction` dành cho việc cắt bớt dấu vết ngăn lớp dị thường:
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

**Chế độ nghiêm ngặt (Strict mode)**

Cách gọi khác của [`assert.notDeepStrictEqual()`][].

**Chế độ Legacy**

> Tính ổn định: 0 - Không chấp thuận: Sử dụng [`assert.notDeepStrictEqual()`][] thay thế.

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

If the values are deeply equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định.

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

If the values are deeply and strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned.

## assert.notEqual(actual, expected[, message])
<!-- YAML
added: v0.1.21
-->
* `actual` {any}
* `expected` {any}
* `message` {any}

**Chế độ nghiêm ngặt (Strict mode)**

An alias of [`assert.notStrictEqual()`][].

**Chế độ Legacy**

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

If the values are equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định.

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

If the values are strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned.

## assert.ok(value[, message])
<!-- YAML
added: v0.1.21
-->
* `value` {any}
* `message` {any}

Tests if `value` is truthy. It is equivalent to `assert.equal(!!value, true, message)`.

If `value` is not truthy, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is `undefined`, a default error message is assigned.

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

If the values are not strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned.

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

Expects the function `block` to throw an error.

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

Note that `error` can not be a string. If a string is provided as the second argument, then `error` is assumed to be omitted and the string will be used for `message` instead. This can lead to easy-to-miss mistakes. Please read the example below carefully if using a string as the second argument gets considered:
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
