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

该测试检查 `http` 模块的功能。

大多数测试使用 `assert` 模块来确认测试的期望。

require 语句以 \[ASCII\]\[\] 编码顺序(数字, 大写, `_` , 小写) 排序。

### **10-21 行**

这是测试的主体。 This test is simple, it just tests that an HTTP server accepts `non-ASCII` characters in the headers of an incoming request. Interesting things to notice:

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

一个有趣的例子是 `common.mustCall`. 使用 `common.mustCall` 可以避免使用额外的变量和相应的断言。 让我们用测试套件中的真实测试来解释这一点。

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

使用 `common.mustCall` 可以像下面这样大大简化该测试：

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

在使用 `assert.throws()` 时，如果可能，请提供完整的错误信息：

```js
assert.throws(
  () => {
    throw new Error('Wrong value');
  },
  /^Error: Wrong value$/ // Instead of something like /Wrong value/
);
```

### ES.Next 功能

出于性能考虑，我们在 `lib`目录的 JavaScript 代码中仅选择使用ES.Next的部分功能。 然而，当编写测试，为了便于移植，鼓励使用那些可以直接使用并且没有在 \[all maintained branches\]\[\] 中标记的 ES.Next 功能。 \[node.green\]\[\] 列出了每个版本中的可用功能。

例如：

- `let` 和 `const` 替代 `var`
- 模版字符串 替代 字符串拼接
- 适时使用箭头函数

## 测试文件命名

测试文件使用短横杆间隔(kebab casing)命名。 名称的第一个组成部分是 `test`。 名称的第二个组成部分是将要被测试的模块或者子系统。 第三部分通常是将要测试的方法或者事件名称。 名称的后续部分会添加更多关于被测试内容的信息。

例如，`process` 对象的 `beforeExit` 事件的测试可能被命名为 `test-process-before-exit.js`。 如果测试专门检查箭头函数是否与 `beforeExit` 事件正常工作，则它可能被命名为 `test-process-before-exit-arrow-functions.js`。

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