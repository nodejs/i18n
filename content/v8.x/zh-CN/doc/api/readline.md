# 逐行读取

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定的

The `readline` module provides an interface for reading data from a [Readable](stream.html#stream_readable_streams) stream (such as [`process.stdin`]) one line at a time. 它可以通过如下方式来访问：

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

*Note*: Once this code is invoked, the Node.js application will not terminate until the `readline.Interface` is closed because the interface waits for data to be received on the `input` stream.

## 类：Interface

<!-- YAML
added: v0.1.104
-->

Instances of the `readline.Interface` class are constructed using the `readline.createInterface()` method. Every instance is associated with a single `input` [Readable](stream.html#stream_readable_streams) stream and a single `output` [Writable](stream.html#stream_writable_streams) stream. The `output` stream is used to print prompts for user input that arrives on, and is read from, the `input` stream.

### 事件：'close'

<!-- YAML
added: v0.1.98
-->

当如下任何一种情况发生时会发出 `'close'` 事件：

* The `rl.close()` method is called and the `readline.Interface` instance has relinquished control over the `input` and `output` streams;
* `input` 流收到了 `'end'` 事件；
* `input` 流收到了 `<ctrl>-D` 以发出传输结束 (EOT) 的信号；
* The `input` stream receives `<ctrl>-C` to signal `SIGINT` and there is no `SIGINT` event listener registered on the `readline.Interface` instance.

调用监听器函数时并不传入任何参数。

The `readline.Interface` instance is finished once the `'close'` event is emitted.

### 事件：'line'

<!-- YAML
added: v0.1.98
-->

The `'line'` event is emitted whenever the `input` stream receives an end-of-line input (`\n`, `\r`, or `\r\n`). This usually occurs when the user presses the `<Enter>`, or `<Return>` keys.

The listener function is called with a string containing the single line of received input.

例如：

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
* `input` 流未暂停，但收到了 `SIGCONT` 事件。 (See events [`SIGTSTP`][] and [`SIGCONT`][])

调用监听器函数时并不传入任何参数。

例如：

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

The `'SIGCONT'` event is emitted when a Node.js process previously moved into the background using `<ctrl>-Z` (i.e. `SIGTSTP`) is then brought back to the foreground using fg(1p).

If the `input` stream was paused *before* the `SIGTSTP` request, this event will not be emitted.

调用监听器函数时并不传入任何参数。

例如：

```js
rl.on('SIGCONT', () => {
  // `prompt` will automatically resume the stream
  rl.prompt();
});
```

*注意*：`'SIGCONT'` 事件在 Windows 中 *不* 被支持。

### 事件：'SIGINT'

<!-- YAML
added: v0.3.0
-->

The `'SIGINT'` event is emitted whenever the `input` stream receives a `<ctrl>-C` input, known typically as `SIGINT`. If there are no `'SIGINT'` event listeners registered when the `input` stream receives a `SIGINT`, the `'pause'` event will be emitted.

调用监听器函数时并不传入任何参数。

例如：

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

The `'SIGTSTP'` event is emitted when the `input` stream receives a `<ctrl>-Z` input, typically known as `SIGTSTP`. If there are no `SIGTSTP` event listeners registered when the `input` stream receives a `SIGTSTP`, the Node.js process will be sent to the background.

When the program is resumed using fg(1p), the `'pause'` and `SIGCONT` events will be emitted. 这可被用来恢复 `input` 流。

The `'pause'` and `'SIGCONT'` events will not be emitted if the `input` was paused before the process was sent to the background.

调用监听器函数时并不传入任何参数。

例如：

```js
rl.on('SIGTSTP', () => {
  // This will override SIGTSTP and prevent the program from going to the
  // background.
  console.log('Caught SIGTSTP.');
});
```

*注意*：在 Windows 中 *不* 支持 `'SIGTSTP'` 事件。

### rl.close()

<!-- YAML
added: v0.1.98
-->

The `rl.close()` method closes the `readline.Interface` instance and relinquishes control over the `input` and `output` streams. When called, the `'close'` event will be emitted.

### rl.pause()

<!-- YAML
added: v0.3.4
-->

The `rl.pause()` method pauses the `input` stream, allowing it to be resumed later if necessary.

Calling `rl.pause()` does not immediately pause other events (including `'line'`) from being emitted by the `readline.Interface` instance.

### rl.prompt([preserveCursor])

<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} If `true`, prevents the cursor placement from being reset to `0`.

The `rl.prompt()` method writes the `readline.Interface` instances configured `prompt` to a new line in `output` in order to provide a user with a new location at which to provide input.

When called, `rl.prompt()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the prompt is not written.

### rl.question(query, callback)

<!-- YAML
added: v0.3.3
-->

* `query` {string} A statement or query to write to `output`, prepended to the prompt.
* `callback` {Function} A callback function that is invoked with the user's input in response to the `query`.

The `rl.question()` method displays the `query` by writing it to the `output`, waits for user input to be provided on `input`, then invokes the `callback` function passing the provided input as the first argument.

When called, `rl.question()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the `query` is not written.

示例用法：

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

*Note*: The `callback` function passed to `rl.question()` does not follow the typical pattern of accepting an `Error` object or `null` as the first argument. 调用 `callback`，并将提供的答案作为唯一参数。

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

The `rl.setPrompt()` method sets the prompt that will be written to `output` whenever `rl.prompt()` is called.

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

The `rl.write()` method will write either `data` or a key sequence identified by `key` to the `output`. The `key` argument is supported only if `output` is a [TTY](tty.html) text terminal.

如果指定了 `key`，则会忽略 `data`。

When called, `rl.write()` will resume the `input` stream if it has been paused.

If the `readline.Interface` was created with `output` set to `null` or `undefined` the `data` and `key` are not written.

例如：

```js
rl.write('Delete this!');
// Simulate Ctrl+u to delete the line written previously
rl.write(null, { ctrl: true, name: 'u' });
```

*Note*: The `rl.write()` method will write the data to the `readline` Interface's `input` *as if it were provided by the user*.

## readline.clearLine(stream, dir)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number} 
  * `-1` - 从光标向左
  * `1` - 从光标向右
  * `0` - 整行

The `readline.clearLine()` method clears current line of given [TTY](tty.html) stream in a specified direction identified by `dir`.

## readline.clearScreenDown(stream)

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}

The `readline.clearScreenDown()` method clears the given [TTY](tty.html) stream from the current position of the cursor down.

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
  * `output` {stream.Writable} 将逐行读取数据写入的 [Writable](stream.html#stream_writable_streams) 流。
  * `completer` {Function} 用于 Tab 自动补全的可选函数。
  * `terminal` {boolean} `true` if the `input` and `output` streams should be treated like a TTY, and have ANSI/VT100 escape codes written to it. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} 保留的最大历史记录行数。 To disable the history set this value to `0`. This option makes sense only if `terminal` is set to `true` by the user or by an internal `output` check, otherwise the history caching mechanism is not initialized at all. **默认值：** `30`.
  * `prompt` {string} 要使用的提示符。 **默认值：** `'> '`.
  * `crlfDelay` {number} If the delay between `\r` and `\n` exceeds `crlfDelay` milliseconds, both `\r` and `\n` will be treated as separate end-of-line input. `crlfDelay` will be coerced to a number no less than `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **默认值：** `100`.
  * `removeHistoryDuplicates` {boolean} If `true`, when a new input line added to the history list duplicates an older one, this removes the older line from the list. **默认:** `false`.

The `readline.createInterface()` method creates a new `readline.Interface` instance.

例如：

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

Once the `readline.Interface` instance is created, the most common case is to listen for the `'line'` event:

```js
rl.on('line', (line) => {
  console.log(`Received: ${line}`);
});
```

If `terminal` is `true` for this instance then the `output` stream will get the best compatibility if it defines an `output.columns` property and emits a `'resize'` event on the `output` if or when the columns ever change ([`process.stdout`][] does this automatically when it is a TTY).

### `completer` 函数的使用

The `completer` function takes the current line entered by the user as an argument, and returns an Array with 2 entries:

* 具有匹配条目的数组。
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

The `completer` function can be called asynchronously if it accepts two arguments:

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

The `readline.cursorTo()` method moves cursor to the specified position in a given [TTY](tty.html) `stream`.

## readline.emitKeypressEvents(stream[, interface])

<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

The `readline.emitKeypressEvents()` method causes the given [Readable](stream.html#stream_readable_streams) `stream` to begin emitting `'keypress'` events corresponding to received input.

Optionally, `interface` specifies a `readline.Interface` instance for which autocompletion is disabled when copy-pasted input is detected.

如果 `stream` 是 [TTY](tty.html) 流，则它必须处于原始模式。

*Note*: This is automatically called by any readline instance on its `input` if the `input` is a terminal. Closing the `readline` instance does not stop the `input` from emitting `'keypress'` events.

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

The `readline.moveCursor()` method moves the cursor *relative* to its current position in a given [TTY](tty.html) `stream`.

## 示例：Tiny CLI

The following example illustrates the use of `readline.Interface` class to implement a small command-line interface:

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

A common use case for `readline` is to consume input from a filesystem [Readable](stream.html#stream_readable_streams) stream one line at a time, as illustrated in the following example:

```js
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`Line from file: ${line}`);
});
```