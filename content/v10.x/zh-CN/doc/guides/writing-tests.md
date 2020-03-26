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

## 目录结构

See [directory structure overview](https://github.com/nodejs/node/blob/master/test/README.md#test-directories) for outline of existing test & locations. When deciding on whether to expand an existing test file or create a new one, consider going through the files related to the subsystem. For example, look for `test-streams` when writing a test for `lib/streams.js`.

## 测试结构

让我们从 Node.js 测试套件分析这个基本测试：

```javascript
'use strict';                                                          // 1
const common = require('../common');                                   // 2
const fixtures = require('../common/fixtures');                        // 3

// This test ensures that the http-parser can handle UTF-8 characters  // 5
// in the http header.                                                 // 6

const assert = require('assert');                                      // 8
const http = require('http');                                          // 9

const server = http.createServer(common.mustCall((req, res) => {       // 11
  res.end('ok');                                                       // 12
}));                                                                   // 13
server.listen(0, () => {                                               // 14
  http.get({                                                           // 15
    port: server.address().port,                                       // 16
    headers: { 'Test': 'Düsseldorf' }                                  // 17
  }, common.mustCall((res) => {                                        // 18
    assert.strictEqual(res.statusCode, 200);                           // 19
    server.close();                                                    // 20
  }));                                                                 // 21
});                                                                    // 22
// ...                                                                 // 23
```

### **Lines 1-3**

```javascript
'use strict';
const common = require('../common');
const fixtures = require('../common/fixtures');
```

第一行启用严格模式。 所有的测试应该在严格模式下进行，除非测试的性质需要在非严格模式下运行。

第二行是加载 `common` 模块。 The [`common` module][] is a helper module that provides useful tools for the tests. Some common functionality has been extracted into submodules, which are required separately like the fixtures module here.

即使测试不使用 `common` 模块的函数和属性，测试仍然应该在任何其他模块之前引入 `common` 模块。 This is because the `common` module includes code that will cause a test to fail if the test leaks variables into the global space. In situations where a test uses no functions or other properties exported by `common`, include it without assigning it to an identifier:

```javascript
require('../common');
```

### **Lines 5-6**

```javascript
// 此测试可确保 http 分析器可以处理 http 标头中的 UTF-8 字符。
```

测试应该以一个包含它是什么的简短说明的注释开始。

### **Lines 8-9**

```javascript
const assert = require('assert');
const http = require('http');
```

该测试检查 `http` 模块的功能。

大多数测试使用 `assert` 模块来确认测试的期望。

The require statements are sorted in [ASCII](http://man7.org/linux/man-pages/man7/ascii.7.html) order (digits, upper case, `_`, lower case).

### **Lines 11-22**

这是测试的主体。 这个测试很简单，它仅仅测试 HTTP 服务器在传入的请求标头接受 `非ASCII字符`。 有趣的事情要注意：

- If the test doesn't depend on a specific port number, then always use 0 instead of an arbitrary value, as it allows tests to run in parallel safely, as the operating system will assign a random port. If the test requires a specific port, for example if the test checks that assigning a specific port works as expected, then it is ok to assign a specific port number.
- The use of `common.mustCall` to check that some callbacks/listeners are called.
- The HTTP server closes once all the checks have run. This way, the test can exit gracefully. Remember that for a test to succeed, it must exit with a status code of 0.

## 一般建议

### Timers

Avoid timers unless the test is specifically testing timers. There are multiple reasons for this. Mainly, they are a source of flakiness. For a thorough explanation go [here](https://github.com/nodejs/testing/issues/27).

In the event a test needs a timer, consider using the `common.platformTimeout()` method. It allows setting specific timeouts depending on the platform:

```javascript
const timer = setTimeout(fail, common.platformTimeout(4000));
```

will create a 4-second timeout on most platforms but a longer timeout on slower platforms.

### The *common* API

Make use of the helpers from the `common` module as much as possible. Please refer to the [common file documentation](https://github.com/nodejs/node/tree/master/test/common) for the full details of the helpers.

#### common.mustCall

一个有趣的例子是 `common.mustCall`. The use of `common.mustCall` may avoid the use of extra variables and the corresponding assertions. Let's explain this with a real test from the test suite.

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

const server = http.createServer((req, res) => {
  request++;
  res.end();
}).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, (res) => {
    response++;
    res.resume();
    server.close();
  });
});
```

使用 `common.mustCall` 可以像下面这样大大简化该测试：

```javascript
'use strict';
const common = require('../common');
const http = require('http');

const server = http.createServer(common.mustCall((req, res) => {
  res.end();
})).listen(0, function() {
  const options = {
    agent: null,
    port: this.address().port
  };
  http.get(options, common.mustCall((res) => {
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

#### Testing promises

When writing tests involving promises, it is generally good to wrap the `onFulfilled` handler, otherwise the test could successfully finish if the promise never resolves (pending promises do not keep the event loop alive). The `common` module automatically adds a handler that makes the process crash - and hence, the test fail - in the case of an `unhandledRejection` event. It is possible to disable it with `common.disableCrashOnUnhandledRejection()` if needed.

```javascript
const common = require('../common');
const assert = require('assert');
const fs = require('fs').promises;

// Wrap the `onFulfilled` handler in `common.mustCall()`.
fs.readFile('test-file').then(
  common.mustCall(
    (content) => assert.strictEqual(content.toString(), 'test2')
  ));
```

### 标记

一些测试需要在指定命令行标记设置的情况下运行Node.js。 若要完成此操作，在测试的序言中紧随标记的后面添加一个 `// Flags:` 注释。 例如，若要允许测试引入某些 `internal/*` 模块，请添加 `--expose-internals` 标记。 需要引入 `internal/freelist` 模块的测试可以像这样开始：

```javascript
'use strict';

// Flags: --expose-internals

require('../common');
const assert = require('assert');
const freelist = require('internal/freelist');
```

### 断言

在编写断言时，更喜欢严格的版本：

- `assert.strictEqual()` 替代 `assert.equal()`
- `assert.deepStrictEqual()` 替代 `assert.deepEqual()`

When using `assert.throws()`, if possible, provide the full error message:

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // Instead of something like /Wrong value/
);
```

### Console output

Output written by tests to stdout or stderr, such as with `console.log()` or `console.error()`, can be useful when writing tests, as well as for debugging them during later maintenance. The output will be suppressed by the test runner (`./tools/test.py`) unless the test fails, but will always be displayed when running tests directly with `node`. For failing tests, the test runner will include the output along with the failed test assertion in the test report.

Some output can help debugging by giving context to test failures. For example, when troubleshooting tests that timeout in CI. With no log statements, we have no idea where the test got hung up.

There have been cases where tests fail without `console.log()`, and then pass when its added, so be cautious about its use, particularly in tests of the I/O and streaming APIs.

Excessive use of console output is discouraged as it can overwhelm the display, including the Jenkins console and test report displays. Be particularly cautious of output in loops, or other contexts where output may be repeated many times in the case of failure.

In some tests, it can be unclear whether a `console.log()` statement is required as part of the test (message tests, tests that check output from child processes, etc.), or is there as a debug aide. If there is any chance of confusion, use comments to make the purpose clear.


### ES.Next 功能

出于性能考虑，我们在 `lib`目录的 JavaScript 代码中仅选择使用ES.Next的部分功能。 However, when writing tests, for the ease of backporting, it is encouraged to use those ES.Next features that can be used directly without a flag in [all maintained branches](https://github.com/nodejs/lts). [node.green](http://node.green/) lists available features in each release, such as:

- `let` 和 `const` 替代 `var`
- 模版字符串 替代 字符串拼接
- 适时使用箭头函数

## 测试文件命名

测试文件使用短横杆间隔(kebab casing)命名。 名称的第一个组成部分是 `test`。 名称的第二个组成部分是将要被测试的模块或者子系统。 第三部分通常是将要测试的方法或者事件名称。 名称的后续部分会添加更多关于被测试内容的信息。

例如，`process` 对象的 `beforeExit` 事件的测试可能被命名为 `test-process-before-exit.js`。 如果测试专门检查箭头函数是否与 `beforeExit` 事件正常工作，则它可能被命名为 `test-process-before-exit-arrow-functions.js`。

## Imported Tests

### Web Platform Tests

Some of the tests for the WHATWG URL implementation (named `test-whatwg-url-*.js`) are imported from the [Web Platform Tests Project](https://github.com/w3c/web-platform-tests/tree/master/url). These imported tests will be wrapped like this:

```js
/* The following tests are copied from WPT. Modifications to them should be
   upstreamed first. Refs:
   https://github.com/w3c/web-platform-tests/blob/8791bed/url/urlsearchparams-stringifier.html
   License: http://www.w3.org/Consortium/Legal/2008/04-testsuite-copyright.html
*/
/* eslint-disable */

// Test code

/* eslint-enable */
```

To improve tests that have been imported this way, please send a PR to the upstream project first. When the proposed change is merged in the upstream project, send another PR here to update Node.js accordingly. Be sure to update the hash in the URL following `WPT Refs:`.

## C++ Unit test

C++ code can be tested using [Google Test](https://github.com/google/googletest). Most features in Node.js can be tested using the methods described previously in this document. But there are cases where these might not be enough, for example writing code for Node.js that will only be called when Node.js is embedded.

### Adding a new test

The unit test should be placed in `test/cctest` and be named with the prefix `test` followed by the name of unit being tested. For example, the code below would be placed in `test/cctest/test_env.cc`:

```c++
#include "gtest/gtest.h"
#include "node_test_fixture.h"
#include "env.h"
#include "node.h"
#include "v8.h"

static bool called_cb = false;
static void at_exit_callback(void* arg);

class EnvTest : public NodeTestFixture { };

TEST_F(EnvTest, RunAtExit) {
  v8::HandleScope handle_scope(isolate_);
  v8::Local<v8::Context> context = v8::Context::New(isolate_);
  node::IsolateData* isolateData = node::CreateIsolateData(isolate_, uv_default_loop());
  Argv argv{"node", "-e", ";"};
  auto env = node::CreateEnvironment(isolateData, context, 1, *argv, 2, *argv);
  node::AtExit(env, at_exit_callback);
  node::RunAtExit(env);
  EXPECT_TRUE(called_cb);
}

static void at_exit_callback(void* arg) {
  called_cb = true;
}
```

Next add the test to the `sources` in the `cctest` target in node.gyp:

```console
'sources': [
  'test/cctest/test_env.cc',
  ...
],
```

Note that the only sources that should be included in the cctest target are actual test or helper source files. There might be a need to include specific object files that are compiled by the `node` target and this can be done by adding them to the `libraries` section in the cctest target.

The test can be executed by running the `cctest` target:

```console
$ make cctest
```

A filter can be applied to run single/multiple test cases:
```console
$ make cctest GTEST_FILTER=EnvironmentTest.AtExitWithArgument
```

`cctest` can also be run directly which can be useful when debugging:
```console
$ out/Release/cctest --gtest_filter=EnvironmentTest.AtExit*
```

### Node.js test fixture
There is a [test fixture](https://github.com/google/googletest/blob/master/googletest/docs/Primer.md#test-fixtures-using-the-same-data-configuration-for-multiple-tests) named `node_test_fixture.h` which can be included by unit tests. The fixture takes care of setting up the Node.js environment and tearing it down after the tests have finished.

It also contains a helper to create arguments to be passed into Node.js. It will depend on what is being tested if this is required or not.

### Test Coverage

To generate a test coverage report, see the [Test Coverage section of the Building guide](https://github.com/nodejs/node/blob/master/BUILDING.md#running-coverage).
