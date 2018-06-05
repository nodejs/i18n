# 如何为 Node.js 项目编写测试

## 什么是测试？

在 Node.js 核心中，大多数测试都是 JavaScript 程序，它执行 Node.js 提供的功能并检查其行为是否符合预期。 成功时, 测试应与代码 ` 0 ` 一起退出。 如果存在以下情况, 测试将失败:

- 它通过将 ` exitCode ` 设置为非零数字来退出。 
  - 这通常是通过断言抛出一个未捕获的 Error 来完成的。
  - 有时，使用 `process.exit(code)` 可能是适当的。
- 它从不退出。 在这种情况下，测试运行程序最终将终止测试，因为它设置了最大时间限制。

在以下情况下添加测试:

- 添加新功能。
- 修复回归和 bug。
- 扩展测试覆盖率。

## 测试结构

让我们从 Node.js 测试套件分析这个基本测试：

```javascript
'use strict';                                                          // 1
const common = require('../common');                                   // 2


// 此测试确保 http-parser 可以处理 http 标头中的 UTF-8 字符            // 5
                                                 
const assert = require('assert');                                      // 7
const http = require('http');                                          // 8

const server = http.createServer(common.mustCall((req, res) => {       // 10
  res.end('ok');                                                       // 11
}));                                                                   // 12
server.listen(0, () => {                                               // 13
  http.get({                                                           // 14
    port: server.address().port,                                       // 15
    headers: {'Test': 'Düsseldorf'}                                    // 16
  }, common.mustCall((res) => {                                        // 17
    assert.strictEqual(res.statusCode, 200);                           // 18
    server.close();                                                    // 19
  }));                                                                 // 20
});                                                                    // 21
```

### **1-2 行**

```javascript
'use strict';
const common = require('../common');
```

第一行启用严格模式。 所有的测试应该在严格模式下进行，除非测试的性质需要在非严格模式下运行。

第二行是加载 `common` 模块。 `common` 模块是一个为测试提供实用工具的帮助模块。

即使测试不使用 `common` 模块的函数和属性，测试仍然应该在任何其他模块之前引入 `common` 模块。 This is because the `common` module includes code that will cause a test to fail if the test leaks variables into the global space. In situations where a test uses no functions or other properties exported by `common`, include it without assigning it to an identifier:

```javascript
require('../common');
```

### **4-5 行**

```javascript
// 此测试可确保 http 分析器可以处理 http 标头中的 UTF-8 字符。
```

测试应该以一个包含它是什么的简短说明的注释开始。

### **7-8 行**

```javascript
const assert = require('assert');
const http = require('http');
```

The test checks functionality in the `http` module.

Most tests use the `assert` module to confirm expectations of the test.

The require statements are sorted in \[ASCII\]\[\] order (digits, upper case, `_`, lower case).

### **10-21 行**

This is the body of the test. This test is simple, it just tests that an HTTP server accepts `non-ASCII` characters in the headers of an incoming request. Interesting things to notice:

- If the test doesn't depend on a specific port number, then always use 0 instead of an arbitrary value, as it allows tests to run in parallel safely, as the operating system will assign a random port. If the test requires a specific port, for example if the test checks that assigning a specific port works as expected, then it is ok to assign a specific port number.
- The use of `common.mustCall` to check that some callbacks/listeners are called.
- The HTTP server closes once all the checks have run. This way, the test can exit gracefully. Remember that for a test to succeed, it must exit with a status code of 0.

## 一般建议

### Timers

Avoid timers unless the test is specifically testing timers. There are multiple reasons for this. Mainly, they are a source of flakiness. For a thorough explanation go [here](https://github.com/nodejs/testing/issues/27).

In the event a test needs a timer, consider using the `common.platformTimeout()` method. It allows setting specific timeouts depending on the platform. For example:

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

will create a 4-second timeout on most platforms but a longer timeout on slower platforms.

### *common* API

Make use of the helpers from the `common` module as much as possible. Please refer to the [common file documentation](https://github.com/nodejs/node/tree/master/test/common) for the full details of the helpers.

#### common.mustCall

One interesting case is `common.mustCall`. The use of `common.mustCall` may avoid the use of extra variables and the corresponding assertions. Let's explain this with a real test from the test suite.

```javascript
'use strict';
require('../common');
const assert = require('assert');
const http = require('http');

let request = 0;
let response = 0;
process.on('exit', function() {
  assert.equal(request, 1, 'http server "request" callback was not called');
  assert.equal(response, 1, 'http request "response" callback was not called');
});

const server = http.createServer(function(req, res) {
  request++;
  res.end();
}).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, function(res) {
    response++;
    res.resume();
    server.close();
  });
});
```

This test could be greatly simplified by using `common.mustCall` like this:

```javascript
'use strict';
const common = require('../common');
const http = require('http');

const server = http.createServer(common.mustCall(function(req, res) {
  res.end();
})).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, common.mustCall(function(res) {
    res.resume();
    server.close();
  }));
});

```

#### Countdown 模块

The common [Countdown module](https://github.com/nodejs/node/tree/master/test/common#countdown-module) provides a simple countdown mechanism for tests that require a particular action to be taken after a given number of completed tasks (for instance, shutting down an HTTP server after a specific number of requests).

```javascript
const Countdown = require('../common/countdown');

const countdown = new Countdown(2, function() {
  console.log('.');
});

countdown.dec();
countdown.dec(); // countdown 回调将被立即调用
```

### Flags

Some tests will require running Node.js with specific command line flags set. To accomplish this, add a `// Flags:` comment in the preamble of the test followed by the flags. For example, to allow a test to require some of the `internal/*` modules, add the `--expose-internals` flag. A test that would require `internal/freelist` could start like this:

```javascript
'use strict';

// Flags: --expose-internals

require('../common');
const assert = require('assert');
const freelist = require('internal/freelist');
```

### Assertions

When writing assertions, prefer the strict versions:

- `assert.strictEqual()` over `assert.equal()`
- `assert.deepStrictEqual()` over `assert.deepEqual()`

When using `assert.throws()`, if possible, provide the full error message:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // Instead of something like /Wrong value/
);
```

### ES.Next features

For performance considerations, we only use a selected subset of ES.Next features in JavaScript code in the `lib` directory. However, when writing tests, for the ease of backporting, it is encouraged to use those ES.Next features that can be used directly without a flag in \[all maintained branches\]\[\]. \[node.green\]\[\] lists available features in each release.

例如：

- `let` and `const` over `var`
- Template literals over string concatenation
- Arrow functions when appropriate

## Naming Test Files

Test files are named using kebab casing. The first component of the name is `test`. The second is the module or subsystem being tested. The third is usually the method or event name being tested. Subsequent components of the name add more information about what is being tested.

For example, a test for the `beforeExit` event on the `process` object might be named `test-process-before-exit.js`. If the test specifically checked that arrow functions worked correctly with the `beforeExit` event, then it might be named `test-process-before-exit-arrow-functions.js`.

## Imported Tests

### Web Platform Tests

Some of the tests for the WHATWG URL implementation (named `test-whatwg-url-*.js`) are imported from the \[Web Platform Tests Project\]\[\]. These imported tests will be wrapped like this:

```js
/* eslint-disable */
/* WPT Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/

// Test code

/* eslint-enable */
```

To improve tests that have been imported this way, please send a PR to the upstream project first. When the proposed change is merged in the upstream project, send another PR here to update Node.js accordingly. Be sure to update the hash in the URL following `WPT Refs:`.