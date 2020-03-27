# 逐行读取

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`readline` 模块提供了一个可以从 [Readable](stream.html#stream_readable_streams) 流 (例如：[`process.stdin`]) 逐行读取数据的接口。 可以通过如下方式访问：

```js
const readline = require('readline');
```

如下的简单示例演示了 `readline` 模块的基本用法。

```js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What do you think of Node.js? ', (answer) => {
  // TODO: Log the answer in a database
  console.log(`Thank you for your valuable feedback: ${answer}`);

  rl.close();
});
```

Once this code is invoked, the Node.js application will not terminate until the `readline.Interface` is closed because the interface waits for data to be received on the `input` stream.

## 类：Interface
<!-- YAML
added: v0.1.104
-->

`readline.Interface` 类的实例可以通过 `readline.createInterface()` 方法来创建。 每个实例都和单一的 `input` [Readable](stream.html#stream_readable_streams) 流及单一的 `output` [Writable](stream.html#stream_writable_streams) 流相关联。 `output` 流用于为到达的用户输入打印提示符，并从 `input` 流进行读取。

### 事件：'close'
<!-- YAML
added: v0.1.98
-->

当如下任何一种情况发生时会发出 `'close'` 事件：

* `rl.close()` 方法被调用，且 `readline.Interface` 实例放弃了对 `input` 和 `output` 流的控制；
* `input` 流收到了 `'end'` 事件；
* `input` 流收到了 `<ctrl>-D` 以发出传输结束 (EOT) 的信号；
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `'SIGINT'` event listener registered on the `readline.Interface` instance.

调用监听器函数时并不传入任何参数。

一旦发出 `'close'` 事件，`readline.Interface` 实例就会结束。

### 事件：'line'
<!-- YAML
added: v0.1.98
-->

当 `input` 流接收到行尾结束输入 (`\n`, `\r`, 或 `\r\n`) 时会发出 `'line'` 事件。 通常当用户按下 `<Enter>`, 或 `<Return>` 键时这种情况会发生。

调用监听器函数时会同时传递包含接收到的那一行输入的字符串。

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### 事件：'pause'
<!-- YAML
added: v0.7.5
-->

当如下任何一种情况发生时会发出 `'pause'` 事件：

* `input` 流已暂停。
* The `input` stream is not paused and receives the `'SIGCONT'` event. (See events [`'SIGTSTP'`][] and [`'SIGCONT'`][].)

调用监听器函数时并不传入任何参数。

```js
rl.on('pause', () => {
  console.log('Readline paused.');
});
```

### 事件：'resume'
<!-- YAML
added: v0.7.5
-->

当 `input` 流恢复时，会发出 `'resume'` 事件。

调用监听器函数时并不传入任何参数。

```js
rl.on('resume', () => {
  console.log('Readline resumed.');
});
```

### 事件：'SIGCONT'
<!-- YAML
added: v0.7.5
-->

当之前通过使用 `<ctrl>-Z` (即：`SIGTSTP`) 移入后台的 Node.js 进程，又通过使用 fg(1p) 返回前台时，会发出 `'SIGCONT'` 事件。

如果 `input` 流在 `SIGTSTP` 请求 *之前* 被暂停，不会发出此事件。

调用监听器函数时并不传入任何参数。

```js
rl.on('SIGCONT', () => {
  // `prompt` will automatically resume the stream
  rl.prompt();
});
```

The `'SIGCONT'` event is _not_ supported on Windows.

### 事件：'SIGINT'
<!-- YAML
added: v0.3.0
-->

当 `input` 流接收到 `<ctrl>-C` 输入，也就是通常所说的 `SIGINT` 时，会发出 `'SIGINT'` 事件。 当 `input` 流接收到 `SIGINT` 时，如果没有注册 `'SIGINT'` 事件监听器，则会发出 `'pause'` 事件。

调用监听器函数时并不传入任何参数。

```js
rl.on('SIGINT', () => {
  rl.question('Are you sure you want to exit? ', (answer) => {
    if (answer.match(/^y(es)?$/i)) rl.pause();
  });
});
```

### 事件：'SIGTSTP'
<!-- YAML
added: v0.7.5
-->

当 `input` 流接收到一个 `<ctrl>-Z` 输入，也就是通常所说的 `SIGTSTP` 时，会发出 `'SIGTSTP'` 事件。 If there are no `'SIGTSTP'` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `'SIGCONT'` events will be emitted. 这可被用来恢复 `input` 流。

如果在进程被发送到后台之前 `input` 被暂停，则不会发出 `'pause'` 和 `'SIGCONT'` 事件。

调用监听器函数时并不传入任何参数。

```js
rl.on('SIGTSTP', () => {
  // This will override SIGTSTP and prevent the program from going to the
  // background.
  console.log('Caught SIGTSTP.');
});
```

The `'SIGTSTP'` event is _not_ supported on Windows.

### rl.close()
<!-- YAML
added: v0.1.98
-->

`rl.close()` 方法关闭了 `readline.Interface` 实例，且放弃了对 `input` 和 `output` 流的控制。 当被调用时，将会发出 `'close'` 事件。

Calling `rl.close()` does not immediately stop other events (including `'line'`) from being emitted by the `readline.Interface` instance.

### rl.pause()
<!-- YAML
added: v0.3.4
-->

`rl.pause()` 方法会暂停 `input` 流，并允许稍后在必要时恢复它。

调用 `rl.pause()` 并不会立即暂停由 `readline.Interface` 实例发出的其他事件 (包括 `'line'`)。

### rl.prompt([preserveCursor])
<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} 当其值为 `true` 时，防止将光标位置重置为 `0`。

`rl.prompt()` 方法将 `readline.Interface` 实例中配置的 `提示符` 写入到 `output` 中的一个新行，以便为用户提供一个可供输入的新位置。

当被调用时，如果 `input` 流已被暂停，`rl.prompt()` 将会恢复该流。

如果在 `readline.Interface` 被创建时，`output` 被设置为 `null` 或 `undefined`，则不会将提示符写入。

### rl.question(query, callback)
<!-- YAML
added: v0.3.3
-->

* `query` {string} 将被写入 `output` 的一个语句或查询，会被添加到提示符之前。
* `callback` {Function} 将随同用户输入一同被调用的回调函数，以响应 `query`。

`rl.question()` 方法通过将 `query` 写入到 `output` 来显示它，并等待用户在 `input` 上提供输入，然后将获得的输入作为首个参数来调用 `callback` 函数。

当被调用时，如果 `input` 流已被暂停，`rl.question()` 将会恢复该流。

如果在 `readline.Interface` 被创建时，`output` 被设置为 `null` 或 `undefined`，则不会将 `query` 写入。

示例用法：

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. 调用 `callback`，并将提供的答案作为唯一参数。

### rl.resume()
<!-- YAML
added: v0.3.4
-->

如果 `input` 流已被暂停，`rl.resume()` 将会恢复该流。

### rl.setPrompt(prompt)
<!-- YAML
added: v0.1.98
-->

* `prompt` {string}

`rl.setPrompt()` 方法设置了当 `rl.prompt()` 被调用时，将被写入到 `output` 的提示符。

### rl.write(data[, key])
<!-- YAML
added: v0.1.98
-->

* `data` {string}
* `key` {Object}
  * `ctrl` {boolean} 当值为 `true` 时表示 `<ctrl>`键。
  * `meta` {boolean} 当值为 `true` 时表示 `<Meta>` 键。
  * `shift` {boolean} 当值为 `true` 时表示 `<Shift>` 键。
  * `name` {string} 键的名称。

The `rl.write()` method will write either `data` or a key sequence identified by `key` to the `output`. 只有当 `output` 是 [TTY](tty.html) 文本终端时才支持 `key` 这个参数。

如果指定了 `key`，则会忽略 `data`。

当被调用时，如果 `input` 流已被暂停，`rl.write()` 将会恢复该流。

如果在 `readline.Interface` 被创建时，`output` 被设置为 `null` 或 `undefined`，则不会将 `data` 和 `key` 写入。

```js
rl.write('Delete this!');
// Simulate Ctrl+u to delete the line written previously
rl.write(null, { ctrl: true, name: 'u' });
```

The `rl.write()` method will write the data to the `readline` `Interface`'s `input` *as if it were provided by the user*.

### rl\[Symbol.asyncIterator\]()
<!-- YAML
added: v10.16.0
-->

> 稳定性：1 - 实验中

* Returns: {AsyncIterator}

Create an `AsyncIterator` object that iterates through each line in the input stream as a string. This method allows asynchronous iteration of `readline.Interface` objects through `for`-`await`-`of` loops.

Errors in the input stream are not forwarded.

If the loop is terminated with `break`, `throw`, or `return`, [`rl.close()`][] will be called. In other words, iterating over a `readline.Interface` will always consume the input stream fully.

A caveat with using this experimental API is that the performance is currently not on par with the traditional `'line'` event API, and thus it is not recommended for performance-sensitive applications. We expect this situation to improve in the future.

```js
async function processLineByLine() {
  const rl = readline.createInterface({
    // ...
  });

  for await (const line of rl) {
    // Each line in the readline input will be successively available here as
    // `line`.
  }
}
```

## readline.clearLine(stream, dir)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number}
  * `-1` - 从光标向左
  * `1` - 从光标向右
  * `0` - 整行

`readline.clearLine()` 方法会从 `dir` 指定的方向清除给定的 [TTY](tty.html) 流的当前行。

## readline.clearScreenDown(stream)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}

`readline.clearScreenDown()` 方法从当前光标位置向下清除给定的 [TTY](tty.html) 流。

## readline.createInterface(options)
<!-- YAML
added: v0.1.98
changes:
  - version: v8.3.0, 6.11.4
    pr-url: https://github.com/nodejs/node/pull/13497
    description: Remove max limit of `crlfDelay` option.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8109
    description: The `crlfDelay` option is supported now.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7125
    description: The `prompt` option is supported now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6352
    description: The `historySize` option can be `0` now.
-->

* `options` {Object}
  * `input` {stream.Readable} 要侦听的 [Readable](stream.html#stream_readable_streams) 流。 This option is *required*.
  * `output` {stream.Writable} The [Writable](stream.html#stream_writable_streams) stream to write readline data to.
  * `completer` {Function} 用于 Tab 自动补全的可选函数。
  * `terminal` {boolean} 如果 `input` 和 `output` 流应被视为 TTY，并将 ANSI/VT100 转义符写入其中，则值为 `true`。 **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} 保留的最大历史记录行数。 要禁用历史记录，将值设置为 `0`。 This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **Default:** `30`.
  * `prompt` {string} 要使用的提示符。 **默认值：** `'> '`.
  * `crlfDelay` {number} 如果 `\r` 和 `\n` 之间的延迟超过 `crlfDelay` 毫秒, `\r` 和 `\n` 将被视为单独的行尾结束输入。 `crlfDelay` will be coerced to a number no less than `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Default:** `100`.
  * `removeHistoryDuplicates` {boolean} 如果值为 `true`，则当一个添加到历史记录列表中的新输入行和旧的行重复时，将从列表中删除旧行。 **默认:** `false`.
  * `escapeCodeTimeout` {number} The duration `readline` will wait for a character (when reading an ambiguous key sequence in milliseconds one that can both form a complete key sequence using the input read so far and can take additional input to complete a longer key sequence). **Default:** `500`.

`readline.createInterface()` 方法创建一个新的 `readline.Interface` 实例。

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

一旦 `readline.Interface` 实例被创建，最常见的用例是监听 `'line'` 事件：

```js
rl.on('line', (line) => {
  console.log(`Received: ${line}`);
});
```

如果在这种情况下 `terminal` 的值为 `true`，则当它定义了一个 `output.columns` 属性时，`output` 流将会获得最佳兼容性，并且如果或当列发生变化时，`output` 会触发 `'resize'` 事件 (当它是 TTY 时，[`process.stdout`][] 会自动执行此操作)。

### `completer` 函数的使用

The `completer` function takes the current line entered by the user as an argument, and returns an `Array` with 2 entries:

* An `Array` with matching entries for the completion.
* 用于进行匹配的子字符串。

例如：`[[substr1, substr2, ...], originalsubstring]`。

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // show all completions if none found
  return [hits.length ? hits : completions, line];
}
```

如果 `completer` 函数接受两个参数，则可以对其进行异步调用：

```js
function completer(linePartial, callback) {
  callback(null, [['123'], linePartial]);
}
```

## readline.cursorTo(stream, x, y)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `x` {number}
* `y` {number}

在给定的 [TTY](tty.html) `流`，`readline.cursorTo()` 方法将光标移动到指定的位置。

## readline.emitKeypressEvents(stream[, interface])
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) stream to begin emitting `'keypress'` events corresponding to received input.

`interface` 可以选择性的指定 `readline.Interface` 实例，在该实例中当检测到复制粘贴时，将禁用自动完成。

如果 `stream` 是 [TTY](tty.html) 流，则它必须处于原始模式。

This is automatically called by any readline instance on its `input` if the `input` is a terminal. 关闭 `readline` 实例不会终止 `input` 发送 `'keypress'` 事件。

```js
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);
```

## readline.moveCursor(stream, dx, dy)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dx` {number}
* `dy` {number}

`readline.moveCursor()` 方法会从 *相对于* 给定的 [TTY](tty.html) `stream` 的当前位置移动光标。

## 示例：Tiny CLI

如下示例演示了如何使用 `readline.Interface` 类来实现一个小的命令行界面：

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'OHAI> '
});

rl.prompt();

rl.on('line', (line) => {
  switch (line.trim()) {
    case 'hello':
      console.log('world!');
      break;
    default:
      console.log(`Say what? I might have heard '${line.trim()}'`);
      break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
```

## 示例：逐行读取文件流

A common use case for `readline` is to consume an input file one line at a time. The easiest way to do so is leveraging the [`fs.ReadStream`][] API as well as a `for`-`await`-`of` loop:

```js
const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('input.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
}

processLineByLine();
```

Alternatively, one could use the [`'line'`][] event:

```js
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`Line from file: ${line}`);
});
```

Currently, `for`-`await`-`of` loop can be a bit slower. If `async` / `await` flow and speed are both essential, a mixed approach can be applied:

```js
const { once } = require('events');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

(async function processLineByLine() {
  try {
    const rl = createInterface({
      input: createReadStream('big-file.txt'),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      // Process the line.
    });

    await once(rl, 'close');

    console.log('File processed.');
  } catch (err) {
    console.error(err);
  }
})();
```
