# Xác nhận (Assert)

<!--introduced_in=v0.1.21-->

> Tính ổn định: 2 - Stable

Mô-đun `assert` cung cấp một tập các thí nghiệm xác nhận đơn giản dùng để kiểm tra các bất biến.

Mặc dù có sẵn chế độ `strict` và `legacy`, nhưng chúng tôi khuyến nghị chỉ sử dụng [`strict mode`][].

Để biết thêm thông tin về các so sánh bình đằng được sử dụng, tham khảo thêm [hướng dẫn MDN về sự giống nhau và các so sánh bình đẳng](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness).

## Lớp: assert.AssertionError

Lớp con của `Error` biểu thị sự xác nhận thất bại. Tất cả các lỗi được tạo ra bởi mô-đun `assert` sẽ là thực thể của lớp `AssertionError`.

### new assert.AssertionError(options)
<!-- YAML
added: v0.1.21
-->
* `options` {Object}
  * Nếu hiển thị `message` {string}, thông báo lỗi sẽ được đặt giá trị này.
  * `actual` {any} Thuộc tính `actual` trong lỗi thực thể sẽ chứa giá trị này. Được sử dụng nội bộ trong trường hợp lỗi đầu vào `actual`. Ví dụ sử dụng trong [`assert.strictEqual()`].
  * `expected` {any} Thuộc tính `expected` trong lỗi thực thể sẽ chứa giá trị này. Được dùng nội bộ trong lỗi đầu vào `expected`. Ví dụ được sử dụng trong [`assert.strictEqual()`].
  * `operator` {string} Thuộc tính `operator` trong lỗi thực thể sẽ chứa giá trị này. Được dùng nội bộ để chỉ báo hoạt động nào được sử dụng để so sánh ( hoặc hàm xác nhận nào đã kích hoạt lỗi).
  * Nếu cung cấp `stackStartFn` {Function}, dấu vết ngăn xếp được tạo ra sẽ loại bỏ các khung lên đến hàm được cung cấp.

Lớp con của `Error` chỉ báo lỗi xác nhận.

Tất cả các thực thể bao hàm các thuộc tính `Error` đượctích hợp (`message` và `name`) và:

* `actual` {any} được đặt giá trị thực trong trường hợp ví dụ như [`assert.strictEqual()`] được sử dụng.
* `expected` {any} được đặt giá trị kỳ vọng trong trường hợp như [`assert.strictEqual()` được sử dụng.
* `generatedMessage` {boolean} cho biết thông báo có tự động tạo ra (`true`) hay không.
* `code` {string} luôn luôn được đặt trong chuỗi `ERR_ASSERTION` để chỉ ra lỗi thực sự là lỗi xác nhận.
* ` operator ` {string} được đặt giá trị toán tử được truyền vào.

```js
const assert = require('assert');

// Generate an AssertionError to compare the error message later:
const { message } = new assert.AssertionError({
  actual: 1,
  expected: 2,
  operator: 'strictEqual'
});

// Verify error output:
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

## Chế độ nghiêm ngặt (Strict mode)
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

Khi sử dụng `strict mode`, bất kỳ hàm `assert` nào sẽ dùng tính bình đẳng sử dụng trong chế độ hàm nghiêm ngặt. Vì vậy, theo một cách ví dụ, [`assert.deepEqual()`][] sẽ có chức năng làm việc giống như [`assert.deepStrictEqual()`][].

Trên hết, các thông báo lỗi liên quan đến các đối tượng tạo ra một so sánh sai số lỗi khác thay vì hiển thị cả hai đối tượng. Đó không phải là trường hợp cho chế độ Legacy.

Nó có thể truy cập bằng cách sử dụng:

```js
const assert = require('assert').strict;
```

Ví dụ về so sánh sai số lỗi:

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

Việc sử dụng `NODE_DISABLE_COLORS` biến môi trường để tắt các màu sắc. Xin chú ý, điều này cũng tắt các màu trong REPL.

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
* `value` {any} The input that is checked for being truthy.
* `message` {string|Error}

Cách gọi khác của [`assert.ok()`][].

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

**Chế độ nghiêm ngặt (Strict mode)**

Cách gọi khác của [`assert.deepStrictEqual()`][].

**Chế độ Legacy**

> Tính ổn định: 0 - Không chấp thuận: Sử dụng [`assert.deepStrictEqual()`][] thay thế.

Thử nghiệm các thông số cho đẳng thức sâu giữa `actual` và `expected`. Giá trị ban đầu được so sánh với [So sánh đẳng thức trừu tượng](https://tc39.github.io/ecma262/#sec-abstract-equality-comparison) ( `==` ).

Chỉ xem xét [thuộc tính "own" có thể đếm được](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties). Việc thực thi [`assert.deepEqual()`][] không kiểm tra các đối tượng của [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) hoặc các thuộc tính [`Symbol`][] có thể đếm được. Đối với việc kiểm tra như vậy, hãy cân nhắc sử dụng [`assert.deepStrictEqual()`][]. [`assert.deepEqual()`][] có thể mang lại kết quả không nghĩ tới. Các ví dụ sau đây sẽ không cho ra `AssertionError` bởi vì các thuộc tính trên đối tượng [`RegExp`][] không thể đếm được:

```js
// WARNING: This does not throw an AssertionError!
assert.deepEqual(/a/gi, new Date());
```

[`Map`][] và [`Set`][] là có ngoại lệ. Bởi vì `Map` và `Set` đã so sánh các hạng mục bao hàm trong nó như mong đợi.

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

Nếu như các giá trị không thỏa mãn bằng nhau, nó sẽ hiển thị`AssertionError` với thuộc tính `message` có giá trị bằng với thuộc tính `message`. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định. Nếu thông số `message` là một tham số của [`Error`][], thì kết quả nó trả ra sẽ không phải là `AssertionError`.

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

Thử nghiệm các thông số cho đẳng thức sâu giữa `actual` và `expected`. Đẳng thức "sâu" có nghĩa các thuộc tính "own" có thể đếm được của đối tượng con sẽ được đánh giá một cách đệ quy theo các quy tắc sau.

### Chi tiết so sánh

* Các giá trị ban đầu được tiến hành so sánh với [So sánh cùng giá trị](https://tc39.github.io/ecma262/#sec-samevalue), sử dụng bởi [`Object.is()`][].
* [Các loại thẻ gắn](https://tc39.github.io/ecma262/#sec-object.prototype.tostring) của đối tượng cần giống nhau.
* [`[[Prototype]]`](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots) của các đối tượng được so sánh sử dụng [So sánh đẳng thức nghiêm ngặt](https://tc39.github.io/ecma262/#sec-strict-equality-comparison).
* Chỉ xem xét [thuộc tính "own" có thể đếm được](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties).
* Các tên và thông báo [`Error`][] luôn được so sánh, kể cả chúng không phải là những thuộc tính có thể đếm được.
* Thuộc tính [`Symbol`][] có thể đếm được cũng sẽ được so sánh.
* [Các lớp bọc đối tượng](https://developer.mozilla.org/en-US/docs/Glossary/Primitive#Primitive_wrapper_objects_in_JavaScript) được so sánh như là các đối tượng và giá trị không bọc.
* Các thuộc tính `Object` được so sánh không theo trình tự.
* Các hạng mục như `Map` và `Set` được so sánh không theo thứ tự.
* Quá trình đệ quy dừng khi hai bên khác nhau hoặc hai bên gặp phải tham chiếu vòng tròn.
* Việc so sánh giữa [`WeakMap`][] và [`WeakSet`][] không dựa trên những giá trị của chúng. Tham khảo thêm giải thích chi tiết bên dưới.

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

Nếu như các giá trị không thỏa mãn bằng nhau, nó sẽ hiển thị`AssertionError` với thuộc tính `message` có giá trị bằng với thuộc tính `message`. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định. Nếu thông số `message` là một tham số của [`Error`][], thì kết quả nó trả ra sẽ không phải là `AssertionError`.

## assert.doesNotReject(asyncFn\[, error\]\[, message\])
<!-- YAML
added: v10.0.0
-->
* `asyncFn` {Function|Promise}
* `error` {RegExp|Function}
* `message` {string}

Awaits the `asyncFn` promise or, if `asyncFn` is a function, immediately calls the function and awaits the returned promise to complete. It will then check that the promise is not rejected.

If `asyncFn` is a function and it throws an error synchronously, `assert.doesNotReject()` will return a rejected `Promise` with that error. Nếu không có lời hứa nào phản hồi, `assert.doesNotReject()` sẽ trả về `Promise` bị từ chối với lỗi [`ERR_INVALID_RETURN_VALUE`][]. Trong cả hai trường hợp đều bỏ qua quy trình xử lý lỗi.

Using `assert.doesNotReject()` is actually not useful because there is little benefit in catching a rejection and then rejecting it again. Instead, consider adding a comment next to the specific code path that should not reject and keep error messages as expressive as possible.

Nói một cách rõ ràng hơn, `error` có thể thay thế bằng [`Class`][], [`RegExp`][] hoặc một hàm xác nhận. Tham khảo thêm [`assert.throws()`][].

Bên cạnh đó đặc tính đồng bộ nhằm chờ đợi việc hoàn thiện các hành vi tương đồng với [`assert.doesNotThrow()`][].

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

Using `assert.doesNotThrow()` is actually not useful because there is no benefit in catching an error and then rethrowing it. Thay vào đó, hãy xem xét việc thêm các nhận xét cạnh các đoạn mã cụ thể đáng lẽ không nên gửi đi và giữ các thông báo lỗi càng chi tiết rõ ràng càng tốt.

When `assert.doesNotThrow()` is called, it will immediately call the `fn` function.

Khi phát hiện có lỗi, nó sẽ được chỉ định cùng loại từ tham số `error`, sau đó gửi đi `AssertionError`. Nếu đó là một lỗi khác, hoặc tham số `error` không được xác định, thì lỗi đó sẽ truyền lại cho trình gọi.

Nói một cách rõ ràng hơn, `error` có thể thay thế bằng [`Class`][], [`RegExp`][] hoặc một hàm xác nhận. Tham khảo thêm [`assert.throws()`][].

Trong ví dụ dưới đây sẽ trả giá trị [`TypeError`][] vì không có loại lỗi nào tương tự trong bộ phận xác nhận:
```js
assert.doesNotThrow(
  () => {
    throw new TypeError('Wrong value');
  },
  SyntaxError
);
```

Tuy nhiên, trong phần tiếp theo sẽ trả kết quả cho `AssertionError` với thông báo 'Got unwanted exception...' (Nhận kết quả không mong muốn):
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
// AssertionError: { a: { b: 1 } } == { a: { b: 1 } }
```

Nếu như các giá trị không thỏa mãn bằng nhau, nó sẽ hiển thị`AssertionError` với thuộc tính `message` có giá trị bằng với thuộc tính `message`. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định. Nếu thông số `message` là một tham số của [`Error`][], thì kết quả nó trả ra sẽ không phải là `AssertionError`.

## assert.fail([message])<!-- YAML
added: v0.1.21
-->* `message` {string|Error} **Default:** `'Failed'`

Nó gửi về `AssertionError` với thông báo lỗi được cấp hoặc thông báo lỗi mặc định. Nếu tham số `message` là một thực thể của [`Error`][] thì nó sẽ được gửi về thay thế cho `AssertionError`.

```js
const assert = require('assert').strict;

assert.fail();
// AssertionError [ERR_ASSERTION]: Failed

assert.fail('boom');
// AssertionError [ERR_ASSERTION]: boom

assert.fail(new TypeError('need array'));
// TypeError: need array
```

Có thể sử dụng `assert.fail()` với hơn hai đối số nhưng sẽ không được chấp thuận. Tham khảo chi tiết bên dưới.

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

> Tính ổn định: 0 - Không chấp thuận. Sử dụng  `assert.fail([message])`  hoặc các hàm xác nhận thay thế.

Nếu `message` bị lỗi, thông báo lỗi sẽ được gắn các giá trị riêng biệt của `actual` và `expected` từ `operator` được cung cấp. Nếu cung cấp hai đối số `actual` và `expected`, `operator` sẽ mặc định giá trị là `'!='`. Nếu `message` được cấp như đối số thứ ba nó sẽ được dùng như một thông báo lỗi, và các đối số còn lại sẽ được lưu như các thuộc tính sau này cho đối tượng trả về. If `stackStartFn` is provided, all stack frames above that function will be removed from stacktrace (see [`Error.captureStackTrace`]). Nếu không cung cấp hàm đối số nào, nó sẽ mặc định dùng thông báo `Failed`.

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

Trong ba trường hợp cuối, `actual`, `expected`, và `operator` sẽ không có ảnh hưởng lên thông báo lỗi.

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

Throws `value` if `value` is not `undefined` or `null`. This is useful when testing the `error` argument in callbacks. The stack trace contains all frames from the error passed to `ifError()` including the potential new frames for `ifError()` itself.

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
// OK

assert.notDeepEqual(obj1, obj3);
// AssertionError: { a: { b: 1 } } notDeepEqual { a: { b: 1 } }

assert.notDeepEqual(obj1, obj4);
// OK
```

If the values are deeply equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định. Nếu thông số `message` là một tham số của [`Error`][], thì kết quả nó trả ra sẽ không phải là `AssertionError`.

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

Tests for deep strict inequality. Opposite of [`assert.deepStrictEqual()`][].

```js
const assert = require('assert').strict;

assert.notDeepStrictEqual({ a: 1 }, { a: '1' });
// OK
```

If the values are deeply and strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.notEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

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

If the values are equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

## assert.notStrictEqual(actual, expected[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17003
    description: Used comparison changed from Strict Equality to `Object.is()`
-->* `actual` {any}
* `expected` {any}
* `message` {string|Error}

Tests strict inequality between the `actual` and `expected` parameters as determined by the [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

```js
const assert = require('assert').strict;

assert.notStrictEqual(1, 2);
// OK

assert.notStrictEqual(1, 1);
// AssertionError [ERR_ASSERTION]: Identical input passed to notStrictEqual: 1

assert.notStrictEqual(1, '1');
// OK
```

If the values are strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. Nếu tham số `message` chưa được định nghĩa, thì sẽ được gắn với một thông báo lỗi mặc định. Nếu thông số `message` là một tham số của [`Error`][], thì kết quả nó trả ra sẽ không phải là `AssertionError`.

## assert.ok(value[, message])<!-- YAML
added: v0.1.21
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18319
    description: The `assert.ok()` (no arguments) will now use a predefined
                 error message.
-->* `value` {any}
* `message` {string|Error}

Tests if `value` is truthy. It is equivalent to `assert.equal(!!value, true, message)`.

If `value` is not truthy, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is `undefined`, a default error message is assigned. Nếu thông số `message` là một tham số của [`Error`][], thì kết quả nó trả ra sẽ không phải là `AssertionError`. If no arguments are passed in at all `message` will be set to the string: ``'No value argument passed to `assert.ok()`'``.

Be aware that in the `repl` the error message will be different to the one thrown in a file! Tham khảo chi tiết bên dưới.

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

If `asyncFn` is a function and it throws an error synchronously, `assert.rejects()` will return a rejected `Promise` with that error. If the function does not return a promise, `assert.rejects()` will return a rejected `Promise` with an [`ERR_INVALID_RETURN_VALUE`][] error. In both cases the error handler is skipped.

Besides the async nature to await the completion behaves identically to [`assert.throws()`][].

If specified, `error` can be a [`Class`][], [`RegExp`][], a validation function, an object where each property will be tested for, or an instance of error where each property will be tested for including the non-enumerable `message` and `name` properties.

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

Note that `error` cannot be a string. If a string is provided as the second argument, then `error` is assumed to be omitted and the string will be used for `message` instead. This can lead to easy-to-miss mistakes. Please read the example in [`assert.throws()`][] carefully if using a string as the second argument gets considered.

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

Tests strict equality between the `actual` and `expected` parameters as determined by the [SameValue Comparison](https://tc39.github.io/ecma262/#sec-samevalue).

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

If the values are not strictly equal, an `AssertionError` is thrown with a `message` property set equal to the value of the `message` parameter. If the `message` parameter is undefined, a default error message is assigned. If the `message` parameter is an instance of an [`Error`][] then it will be thrown instead of the `AssertionError`.

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

Using a regular expression runs `.toString` on the error object, and will therefore also include the error name.

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/
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

Note that `error` cannot be a string. If a string is provided as the second argument, then `error` is assumed to be omitted and the string will be used for `message` instead. This can lead to easy-to-miss mistakes. Using the same message as the thrown error message is going to result in an `ERR_AMBIGUOUS_ARGUMENT` error. Please read the example below carefully if using a string as the second argument gets considered:
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

Due to the confusing notation, it is recommended not to use a string as the second argument. This might lead to difficult-to-spot errors.
