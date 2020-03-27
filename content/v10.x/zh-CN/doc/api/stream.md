# 流

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

流是一个可用于处理 Node.js 中流数据的抽象接口。 `stream` 模块提供了一个基本的 API，通过它可以轻松构建实现流接口的对象。

Node.js 提供了很多流对象。 例如：[向 HTTP 服务器发出的请求](http.html#http_class_http_incomingmessage) 和 [`process.stdout`][] 都是流的实例。

流可以是可读的，可写的，或可读写的。 所有的流都是 [`EventEmitter`][] 的实例。

可以通过如下方式访问 `stream` 模块：

```js
const stream = require('stream');
```

While it is important to understand how streams work, the `stream` module itself is most useful for developers that are creating new types of stream instances. Developers who are primarily *consuming* stream objects will rarely need to use the `stream` module directly.

## 本文档的组织结构

本文档分为两个主要部分，以及其他注意事项作为第三部分。 第一部分阐述了在应用程序中 *使用* 流时需要使用的 流 API 中的元素。 第二部分阐述了在 *实现* 新类型流时需要的 API 的元素。

## 流的类型

在 Node.js 中有四种基本的流类型：

* [`Writable`][] - streams to which data can be written (for example, [`fs.createWriteStream()`][]).
* [`Readable`][] - streams from which data can be read (for example, [`fs.createReadStream()`][]).
* [`Duplex`][] - streams that are both `Readable` and `Writable` (for example, [`net.Socket`][]).
* [`Transform`][] - `Duplex` streams that can modify or transform the data as it is written and read (for example, [`zlib.createDeflate()`][]).

Additionally, this module includes the utility functions [pipeline](#stream_stream_pipeline_streams_callback) and [finished](#stream_stream_finished_stream_callback).

### 对象模式

由 Node.js API 创建的所有流都只适用于字符串和 `Buffer` (或 `Uint8Array`) 对象。 然而，对于流的实现，仍有可能和其他类型的 JavaScript 值 (不包含 `null`，其在流中具有特殊用途) 协同工作。 这些流会以 “对象模式” 进行操作。

在创建流时，使用 `objectMode` 选项会将流实例切换到对象模式。 尝试将现有流切换到对象模式是不安全的。

### 缓冲

<!--type=misc-->

Both [`Writable`][] and [`Readable`][] streams will store data in an internal buffer that can be retrieved using `writable.writableBuffer` or `readable.readableBuffer`, respectively.

The amount of data potentially buffered depends on the `highWaterMark` option passed into the stream's constructor. 对于正常的流，`highWaterMark` 选项指定了 [字节总数](#stream_highwatermark_discrepancy_after_calling_readable_setencoding)。 对于以对象模式操作的流，`highWaterMark` 指定了对象总数。

Data is buffered in `Readable` streams when the implementation calls [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). 如果流的消费者没有调用 [`stream.read()`](#stream_readable_read_size)，数据将会一直处于内部队列中，直到它被消费为止。

一旦内部读取缓冲区的总大小达到 `highWaterMark` 指定的阈值，该流会暂时停止从底层资源中读取数据，直到当前被缓存的数据被消费为止 (这就是说，流会停止调用内部的 `readable._read()` 方法来填充读取缓冲区)。

Data is buffered in `Writable` streams when the [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) method is called repeatedly. 当内部写入缓冲区的总大小低于由 `highWaterMark` 设定的阈值时，对 `writable.write()` 的调用将会返回 `true`。 一旦内部缓冲区的大小达到或超过 `highWaterMark`，将会返回 `false`。

`stream` API，尤其是 [`stream.pipe()`] 方法的一个关键目标就是，将数据的缓冲限制在可接受的水平，以便不同速度的源和目标流不会过度消耗可用内存。

Because [`Duplex`][] and [`Transform`][] streams are both `Readable` and `Writable`, each maintains *two* separate internal buffers used for reading and writing, allowing each side to operate independently of the other while maintaining an appropriate and efficient flow of data. For example, [`net.Socket`][] instances are [`Duplex`][] streams whose `Readable` side allows consumption of data received *from* the socket and whose `Writable` side allows writing data *to* the socket. Because data may be written to the socket at a faster or slower rate than data is received, it is important for each side to operate (and buffer) independently of the other.

## 用于流消费者的 API

<!--type=misc-->

几乎所有的 Node.js 应用程序，无论如何简单，都通过某种方式在使用流。 如下是一个在 Node.js 应用程序中使用流实现 HTTP 服务器的示例：

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req is an http.IncomingMessage, which is a Readable Stream
  // res is an http.ServerResponse, which is a Writable Stream

  let body = '';
  // Get the data as utf8 strings.
  // If an encoding is not set, Buffer objects will be received.
  req.setEncoding('utf8');

  // Readable streams emit 'data' events once a listener is added
  req.on('data', (chunk) => {
    body += chunk;
  });

  // the 'end' event indicates that the entire body has been received
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // write back something interesting to the user:
      res.write(typeof data);
      res.end();
    } catch (er) {
      // uh oh! bad json!
      res.statusCode = 400;
      return res.end(`error: ${er.message}`);
    }
  });
});

server.listen(1337);

// $ curl localhost:1337 -d "{}"
// object
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// error: Unexpected token o in JSON at position 1
```

[`Writable`][] streams (such as `res` in the example) expose methods such as `write()` and `end()` that are used to write data onto the stream.

[`Readable`][] streams use the [`EventEmitter`][] API for notifying application code when data is available to be read off the stream. 可用的数据可通过多种方式从流中读取。

Both [`Writable`][] and [`Readable`][] streams use the [`EventEmitter`][] API in various ways to communicate the current state of the stream.

[`Duplex`][] and [`Transform`][] streams are both [`Writable`][] and [`Readable`][].

向流中写入数据或消费数据的应用程序不需要直接实现 stream 接口，因此在一般情况下没有必要调用 `require('stream')`。

希望实现新类型的流的开发人员可以参考 [流开发人员 API](#stream_api_for_stream_implementers) 部分。

### 可写入的流

可写入的流是可将数据写入的 *目标* 的一个抽象。

Examples of [`Writable`][] streams include:

* [客户端的 HTTP 请求](http.html#http_class_http_clientrequest)
* [服务器端的 HTTP 响应](http.html#http_class_http_serverresponse)
* [fs 的写入流](fs.html#fs_class_fs_writestream)
* [zlib 流](zlib.html)
* [crypto 流](crypto.html)
* [TCP 套接字](net.html#net_class_net_socket)
* [子进程 stdin](child_process.html#child_process_subprocess_stdin)
* [`process.stdout`][], [`process.stderr`][]

Some of these examples are actually [`Duplex`][] streams that implement the [`Writable`][] interface.

All [`Writable`][] streams implement the interface defined by the `stream.Writable` class.

While specific instances of [`Writable`][] streams may differ in various ways, all `Writable` streams follow the same fundamental usage pattern as illustrated in the example below:

```js
const myStream = getWritableStreamSomehow();
myStream.write('some data');
myStream.write('some more data');
myStream.end('done writing data');
```

#### 类：stream.Writable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### 事件：'close'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

当流及其底层的资源 (例如：文件描述符) 被关闭时，会发出 `'close'` 事件。 该事件表明将不会触发更多事件，也不会发生进一步的计算。

A [`Writable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### 事件：'drain'
<!-- YAML
added: v0.9.4
-->

如果对 [`stream.write(chunk)`](#stream_writable_write_chunk_encoding_callback) 的调用返回 `false`，则当可以继续写入数据到流时会发出 `'drain'` 事件。

```js
// Write the data to the supplied writable stream one million times.
// Be attentive to back-pressure.
function writeOneMillionTimes(writer, data, encoding, callback) {
  let i = 1000000;
  write();
  function write() {
    let ok = true;
    do {
      i--;
      if (i === 0) {
        // last time!
        writer.write(data, encoding, callback);
      } else {
        // see if we should continue, or wait
        // don't pass the callback, because we're not done yet.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // had to stop early!
      // write some more once it drains
      writer.once('drain', write);
    }
  }
}
```

##### 事件：'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

当写入或在管道中传输数据出错时，会发出 `'error'` 事件。 当监听器回调函数被调用时，它会接收一个 0>Error</code> 参数。

The stream is not closed when the `'error'` event is emitted.

##### 事件：'finish'
<!-- YAML
added: v0.9.4
-->

在 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 方法被调用，且所有数据被传递给底层系统后，会发出 `'finish'` 事件。

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`hello, #${i}!\n`);
}
writer.end('This is the end\n');
writer.on('finish', () => {
  console.log('All writes are now complete.');
});
```

##### 事件：'pipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} 通过管道流入到可写流的来源流

当在一个写入流上调用 [`stream.pipe()`][] 方法时，会发出 `'pipe'` 事件，并将此写入流添加到目的地集合。

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.log('Something is piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### 事件：'unpipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} 被 [unpiped][`stream.unpipe()`] 可写流管道的来源流

The `'unpipe'` event is emitted when the [`stream.unpipe()`][] method is called on a [`Readable`][] stream, removing this [`Writable`][] from its set of destinations.

This is also emitted in case this [`Writable`][] stream emits an error when a [`Readable`][] stream pipes into it.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.log('Something has stopped piping into the writer.');
  assert.equal(src, reader);
});
reader.pipe(writer);
reader.unpipe(writer);
```

##### writable.cork()
<!-- YAML
added: v0.11.2
-->

`writable.cork()` 方法会强制把所有写入的数据都缓冲到内存中。 当调用 [`stream.uncork()`][] 或 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 方法时，缓冲区数据将被刷新。

`writable.cork()` 的主要目的就是减少当向流中写入大量小块数据时，不会在内部缓冲区备份，从而对性能产生负面影响。 在这种情况下，实现了 `writable._writev()` 方法的流以更优化的方式对写入数据进行缓冲。

请参阅：[`writable.uncork()`][]。

##### writable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* `error` {Error}
* 返回：{this}

Destroy the stream, and emit the passed `'error'` and a `'close'` event. After this call, the writable stream has ended and subsequent calls to `write()` or `end()` will result in an `ERR_STREAM_DESTROYED` error. Implementors should not override this method, but instead implement [`writable._destroy()`](#stream_writable_destroy_err_callback).

##### writable.end(\[chunk\]\[, encoding\][, callback])
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `writable`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {string|Buffer|Uint8Array|any} 可选的要写入的数据。 对于没有以对象模式运作的流，`chunk` 可能是一个字符串，`Buffer`，或者 `Uint8Array`。 对于对象模式的流，`chunk` 可以是任何 JavaScript 值，但不能为 `null`。
* `encoding` {string} The encoding if `chunk` is a string
* `callback` {Function} 可选的当流结束时的回调函数
* 返回：{this}

Calling the `writable.end()` method signals that no more data will be written to the [`Writable`][]. 可选的 `chunk` 和 `encoding` 参数允许在关闭流之前再写入最后一个额外的数据块。 如果提供了这两个参数，`callback` 函数会作为监听器添加到 [`'finish'`][] 事件。

在调用 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 后调用 [`stream.write()`](#stream_writable_write_chunk_encoding_callback) 方法会引发错误。

```js
// write 'hello, ' and then end with 'world!'
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// writing more now is not allowed!
```

##### writable.setDefaultEncoding(encoding)
<!-- YAML
added: v0.11.15
changes:
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/5040
    description: This method now returns a reference to `writable`.
-->

* `encoding` {string} 新的默认编码
* 返回：{this}

The `writable.setDefaultEncoding()` method sets the default `encoding` for a [`Writable`][] stream.

##### writable.uncork()
<!-- YAML
added: v0.11.2
-->

`writable.uncork()` 方法会刷新自 [`stream.cork()`][] 被调用后所有缓存的数据。

当使用 [`writable.cork()`][] 和 `writable.uncork()` 来管理流的写入缓冲时，建议使用 `process.nextTick()` 延迟对 `writable.uncork()` 的调用。 通过这种方式，可以在给定的 Node.js 事件循环阶段中，将所有对 `writable.write()` 的调用进行批处理。

```js
stream.cork();
stream.write('some ');
stream.write('data ');
process.nextTick(() => stream.uncork());
```

If the [`writable.cork()`][] method is called multiple times on a stream, the same number of calls to `writable.uncork()` must be called to flush the buffered data.

```js
stream.cork();
stream.write('some ');
stream.cork();
stream.write('data ');
process.nextTick(() => {
  stream.uncork();
  // The data will not be flushed until uncork() is called a second time.
  stream.uncork();
});
```

同时请参阅：[`writable.cork()`][]。

##### writable.writable
<!-- YAML
added: v0.8.0
-->

* {boolean}

Is `true` if it is safe to call [`writable.write()`][].

##### writable.writableHighWaterMark
<!-- YAML
added: v9.3.0
-->

* {number}

返回在构造此 `Writable` 流时传入的 `highWaterMark` 值。

##### writable.writableLength
<!-- YAML
added: v9.4.0
-->

This property contains the number of bytes (or objects) in the queue ready to be written. The value provides introspection data regarding the status of the `highWaterMark`.

##### writable.write(chunk\[, encoding\]\[, callback\])
<!-- YAML
added: v0.9.4
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6170
    description: Passing `null` as the `chunk` parameter will always be
                 considered invalid now, even in object mode.
-->

* `chunk` {string|Buffer|Uint8Array|any} 可选的要写入的数据。 对于没有以对象模式运作的流，`chunk` 可能是一个字符串，`Buffer`，或者 `Uint8Array`。 对于对象模式的流，`chunk` 可以是任何 JavaScript 值，但不能为 `null`。
* `encoding` {string} 当 `chunk` 为字符串时的编码
* `callback` {Function} 当此数据块被刷新时的回调函数
* 返回：{boolean} 如果流需要等待发出 `'drain'` 事件后才能继续写入额外数据，则返回`false`；否则返回 `true`。

`writable.write()` 方法会向流中写入一些数据，并在数据被处理完毕后调用提供的 `callback`。 如果发生错误，则 *可能会/不会* 调用 `callback`，并将该错误作为第一个参数进行传递。 要想可靠的检测写入错误，请为 `'error'` 事件添加一个监听器。

当在接收了 `chunk` 后创建了流，如果内部缓冲区小于配置的 `highWaterMark`，则返回值为 `true`。 如果返回了 `false`，则在发出 [`'drain'`][] 事件之前，应当停止进一步尝试将数据写入到流中。

当流尚未被排空时，调用 `write()` 将会缓冲 `chunk`，并返回 false。 一旦所有当前缓冲的数据块被排空 (被操作系统接受并传输)，将会发出 `'drain'` 事件。 It is recommended that once `write()` returns false, no more chunks be written until the `'drain'` event is emitted. 当允许在一个尚未排空的流上调用 `write()` 时，Node.js 将会缓冲所有被写入的数据块，直到达到最大内存占用，这时它会无条件终止。 甚至在其终止之前，高内存占用会导致垃圾回收器的性能变差及过高的 RSS (即使内存不再需要时，通常也不会被释放回系统)。 如果远程对等方不读取数据，TCP 套接字永不会排空，因此向一个不会排空的套接字写入可能会导致可被远程利用的漏洞。

Writing data while the stream is not draining is particularly problematic for a [`Transform`][], because the `Transform` streams are paused by default until they are piped or a `'data'` or `'readable'` event handler is added.

If the data to be written can be generated or fetched on demand, it is recommended to encapsulate the logic into a [`Readable`][] and use [`stream.pipe()`][]. 然而，如果要优先调用 `write()`，则可以通过使用 [`'drain'`][] 事件来顾及背压 (backpressure)，并避免和内存相关的问题。

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// Wait for cb to be called before doing any other write.
write('hello', () => {
  console.log('Write completed, do more writes now.');
});
```

A `Writable` stream in object mode will always ignore the `encoding` argument.

### Readable 流

Readable 流是对提供可供消费数据的 *来源* 的一种抽象。

Examples of `Readable` streams include:

* [客户端的 HTTP 响应](http.html#http_class_http_incomingmessage)
* [服务器端的 HTTP 请求](http.html#http_class_http_incomingmessage)
* [fs 读取流](fs.html#fs_class_fs_readstream)
* [zlib 流](zlib.html)
* [crypto 流](crypto.html)
* [TCP 套接字](net.html#net_class_net_socket)
* [子进程 stdout 和 stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

All [`Readable`][] streams implement the interface defined by the `stream.Readable` class.

#### Two Reading Modes

`Readable` streams effectively operate in one of two modes: flowing and paused. These modes are separate from [object mode](#stream_object_mode). A [`Readable`][] stream can be in object mode or not, regardless of whether it is in flowing mode or paused mode.

* In flowing mode, data is read from the underlying system automatically and provided to an application as quickly as possible using events via the [`EventEmitter`][] interface.

* 当处于暂停模式时，必须显式调用 [`stream.read()`](#stream_readable_read_size) 方法从流中读取数据块。

All [`Readable`][] streams begin in paused mode but can be switched to flowing mode in one of the following ways:

* 添加一个 [`'data'`][] 事件处理程序。
* 调用 [`stream.resume()`](#stream_readable_resume) 方法。
* Calling the [`stream.pipe()`][] method to send the data to a [`Writable`][].

The `Readable` can switch back to paused mode using one of the following:

* 如果未指定管道目的地，则调用 [`stream.pause()`](#stream_readable_pause) 方法。
* If there are pipe destinations, by removing all pipe destinations. Multiple pipe destinations may be removed by calling the [`stream.unpipe()`][] method.

The important concept to remember is that a `Readable` will not generate data until a mechanism for either consuming or ignoring that data is provided. If the consuming mechanism is disabled or taken away, the `Readable` will *attempt* to stop generating the data.

For backward compatibility reasons, removing [`'data'`][] event handlers will **not** automatically pause the stream. Also, if there are piped destinations, then calling [`stream.pause()`](#stream_readable_pause) will not guarantee that the stream will *remain* paused once those destinations drain and ask for more data.

If a [`Readable`][] is switched into flowing mode and there are no consumers available to handle the data, that data will be lost. This can occur, for instance, when the `readable.resume()` method is called without a listener attached to the `'data'` event, or when a `'data'` event handler is removed from the stream.

Adding a [`'readable'`][] event handler automatically make the stream to stop flowing, and the data to be consumed via [`readable.read()`](#stream_readable_read_size). If the [`'readable'`] event handler is removed, then the stream will start flowing again if there is a [`'data'`][] event handler.

#### 三种状态

The "two modes" of operation for a `Readable` stream are a simplified abstraction for the more complicated internal state management that is happening within the `Readable` stream implementation.

Specifically, at any given point in time, every `Readable` is in one of three possible states:

* `readable.readableFlowing === null`
* `readable.readableFlowing === false`
* `readable.readableFlowing === true`

When `readable.readableFlowing` is `null`, no mechanism for consuming the stream's data is provided. Therefore, the stream will not generate data. While in this state, attaching a listener for the `'data'` event, calling the `readable.pipe()` method, or calling the `readable.resume()` method will switch `readable.readableFlowing` to `true`, causing the `Readable` to begin actively emitting events as data is generated.

Calling `readable.pause()`, `readable.unpipe()`, or receiving backpressure will cause the `readable.readableFlowing` to be set as `false`, temporarily halting the flowing of events but *not* halting the generation of data. While in this state, attaching a listener for the `'data'` event will not switch `readable.readableFlowing` to `true`.

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// readableFlowing is now false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok');  // will not emit 'data'
pass.resume();     // must be called to make stream emit 'data'
```

While `readable.readableFlowing` is `false`, data may be accumulating within the stream's internal buffer.

#### Choose One API Style

The `Readable` stream API evolved across multiple Node.js versions and provides multiple methods of consuming stream data. In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream. Specifically, using a combination of `on('data')`, `on('readable')`, `pipe()`, or async iterators could lead to unintuitive behavior.

对于大多数用户而言，建议使用 `readable.pipe()` 方法，其原因在于该方法的实现提供了消费流数据的最简易方式。 Developers that require more fine-grained control over the transfer and generation of data can use the [`EventEmitter`][] and `readable.on('readable')`/`readable.read()` or the `readable.pause()`/`readable.resume()` APIs.

#### 类：stream.Readable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### 事件：'close'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
-->

当流及其底层的资源 (例如：文件描述符) 被关闭时，会发出 `'close'` 事件。 该事件表明将不会触发更多事件，也不会发生进一步的计算。

A [`Readable`][] stream will always emit the `'close'` event if it is created with the `emitClose` option.

##### 事件：'data'
<!-- YAML
added: v0.9.4
-->

* `chunk` {Buffer|string|any} 数据块。 对于以非对象模式运作的流，数据块是字符串或 `Buffer`。 对于以对象模式运作的流，数据块可以是除 `null` 之外的任何 JavaScript 值。

当流放弃对数据块的所有权并将其传递给消费者时，会发出 `'data'` 事件。 当在流动模式下通过调用 `readable.pipe()`, `readable.resume()` 切换流时，或将监听器回调函数附加到 `'data'` 事件时，这种情况将会发生。 同时，当 `readable.read()` 方法被调用，同时有可用的块数据可以返回时，也会发出 `'data'` 事件。

将 `'data'` 事件监听器添加到一个未被显式暂停的流会将流切换到流动模式。 数据一旦可用就会立即被传递。

如果已经使用 `readable.setEncoding()` 方法指定了默认编码，监听器回调函数会接收以字符串形式传递的数据块；否则数据则会以 `Buffer` 形式传入。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
```

##### 事件：'end'
<!-- YAML
added: v0.9.4
-->

当没有更多数据可从流中消费时，会发出 `'end'` 事件。

The `'end'` event **will not be emitted** unless the data is completely consumed. This can be accomplished by switching the stream into flowing mode, or by calling [`stream.read()`](#stream_readable_read_size) repeatedly until all data has been consumed.

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
});
readable.on('end', () => {
  console.log('There will be no more data.');
});
```

##### 事件：'error'
<!-- YAML
added: v0.9.4
-->

* {Error}

The `'error'` event may be emitted by a `Readable` implementation at any time. 通常情况下，当由于底层内部错误导致底层流无法生成数据，或当流的实现试图推送无效的数据块时，会发出 'error' 事件。

监听器回调函数会接收一个 `Error` 对象。

##### 事件：'readable'
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: >
      The `'readable'` is always emitted in the next tick after `.push()`
      is called
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: Using `'readable'` requires calling `.read()`.
-->

当流中有数据可读取时，会发出 `'readable'` 事件。 在有些情况下，为 `'readable'` 事件附加监听器将会导致一些数据被读取到内部缓冲区。

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // there is some data to read now
  let data;

  while (data = this.read()) {
    console.log(data);
  }
});
```

当达到流中数据末尾，但在发出 `'end'` 事件之前，也会发出 `'readable'` 事件。

实际上，`'readable'` 事件表明流中有新的信息：有新数据可用，或已达到流的末尾。 在前者中，[`stream.read()`](#stream_readable_read_size) 将会返回可用的数据。 在后者中，[`stream.read()`](#stream_readable_read_size) 将会返回 `null`。 例如：在下面的示例中，`foo.txt` 是一个空文件：

```js
const fs = require('fs');
const rr = fs.createReadStream('foo.txt');
rr.on('readable', () => {
  console.log(`readable: ${rr.read()}`);
});
rr.on('end', () => {
  console.log('end');
});
```

运行此代码的输出为：

```txt
$ node test.js
readable: null
end
```

In general, the `readable.pipe()` and `'data'` event mechanisms are easier to understand than the `'readable'` event. However, handling `'readable'` might result in increased throughput.

If both `'readable'` and [`'data'`][] are used at the same time, `'readable'` takes precedence in controlling the flow, i.e. `'data'` will be emitted only when [`stream.read()`](#stream_readable_read_size) is called. The `readableFlowing` property would become `false`. If there are `'data'` listeners when `'readable'` is removed, the stream will start flowing, i.e. `'data'` events will be emitted without calling `.resume()`.

##### readable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Error which will be passed as payload in `'error'` event
* 返回：{this}

Destroy the stream, and emit `'error'` and `'close'`. After this call, the readable stream will release any internal resources and subsequent calls to `push()` will be ignored. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback).

##### readable.isPaused()
<!-- YAML
added: v0.11.14
-->

* 返回：{boolean}

The `readable.isPaused()` method returns the current operating state of the `Readable`. 它主要被 `readable.pipe()` 方法的底层机制所使用。 在大多数典型情况下，没有理由直接使用这个方法。

```js
const readable = new stream.Readable();

readable.isPaused(); // === false
readable.pause();
readable.isPaused(); // === true
readable.resume();
readable.isPaused(); // === false
```

##### readable.pause()
<!-- YAML
added: v0.9.4
-->

* 返回：{this}

`readable.pause()` 方法将导致处于流动模式的流停止发送 [`'data'`][] 事件，并从流动模式中切换出来。 任何可用的数据会保留在内部缓冲区中。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`Received ${chunk.length} bytes of data.`);
  readable.pause();
  console.log('There will be no additional data for 1 second.');
  setTimeout(() => {
    console.log('Now data will start flowing again.');
    readable.resume();
  }, 1000);
});
```

The `readable.pause()` method has no effect if there is a `'readable'` event listener.

##### readable.pipe(destination[, options])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 写入数据的目的地
* `options` {Object} Pipe options
  * `end` {boolean} 当读取器结束时，结束写入器。 **Default:** `true`.
* Returns: {stream.Writable} The *destination*, allowing for a chain of pipes if it is a [`Duplex`][] or a [`Transform`][] stream

The `readable.pipe()` method attaches a [`Writable`][] stream to the `readable`, causing it to switch automatically into flowing mode and push all of its data to the attached [`Writable`][]. The flow of data will be automatically managed so that the destination `Writable` stream is not overwhelmed by a faster `Readable` stream.

如下示例通过管道将 `readable` 中的所有数据传输到名为 `file.txt` 的文件。

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt'
readable.pipe(writable);
```
It is possible to attach multiple `Writable` streams to a single `Readable` stream.

`readable.pipe()` 方法返回一个 *destination* 流的引用，这就使得可以建立链式管道流：

```js
const fs = require('fs');
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

By default, [`stream.end()`](#stream_writable_end_chunk_encoding_callback) is called on the destination `Writable` stream when the source `Readable` stream emits [`'end'`][], so that the destination is no longer writable. To disable this default behavior, the `end` option can be passed as `false`, causing the destination stream to remain open:

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

One important caveat is that if the `Readable` stream emits an error during processing, the `Writable` destination *is not closed* automatically. 如果发生错误，就有必要 *手动* 关闭每一个流，以防止内存泄漏。

The [`process.stderr`][] and [`process.stdout`][] `Writable` streams are never closed until the Node.js process exits, regardless of the specified options.

##### readable.read([size])
<!-- YAML
added: v0.9.4
-->

* `size` {number} 指定要读取数据量的可选参数。
* Returns: {string|Buffer|null|any}

`readable.read()` 方法从内部缓冲区拉取并返回一些数据。 如果没有可读数据，则返回 `null`。 默认情况下会以 `Buffer` 对象的形式返回，除非已通过 `readable.setEncoding()` 方法指定编码或流以对象模式运作。

可选的 `size` 参数指定了要读取的特定字节数。 如果 `size` 个字节不可读，则返回 `null`，*除非* 流已到末尾，在这种情况下，在内部缓冲区保留的数据将被返回。

如果未指定 `size` 参数，则内部缓冲区中的所有数据将被返回。

The `readable.read()` method should only be called on `Readable` streams operating in paused mode. In flowing mode, `readable.read()` is called automatically until the internal buffer is fully drained.

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

Note that the `while` loop is necessary when processing data with `readable.read()`. Only after `readable.read()` returns `null`, [`'readable'`]() will be emitted.

A `Readable` stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. 不会抛出运行时错误。

##### readable.readable
<!-- YAML
added: v0.8.0
-->

* {boolean}

Is `true` if it is safe to call [`readable.read()`][].

##### readable.readableHighWaterMark
<!-- YAML
added: v9.3.0
-->

* {number}

Returns the value of `highWaterMark` passed when constructing this `Readable`.

##### readable.readableLength
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`.

##### readable.resume()
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: The `resume()` has no effect if there is a `'readable'` event
                 listening.
-->

* 返回：{this}

The `readable.resume()` method causes an explicitly paused `Readable` stream to resume emitting [`'data'`][] events, switching the stream into flowing mode.

The `readable.resume()` method can be used to fully consume the data from a stream without actually processing any of that data:

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

The `readable.resume()` method has no effect if there is a `'readable'` event listener.

##### readable.setEncoding(encoding)
<!-- YAML
added: v0.9.4
-->

* `encoding` {string} 要使用的编码。
* 返回：{this}

The `readable.setEncoding()` method sets the character encoding for data read from the `Readable` stream.

默认情况下，不会分配编码，同时流数据会以 `Buffer` 对象的方式返回。 设置编码会导致流数据将以指定编码的字符串，而不是 `Buffer` 对象的方式返回。 例如：调用 `readable.setEncoding('utf8')` 将会导致输出数据以 UTF-8 数据的形式解析，并以字符串的方式传递。 调用 `readable.setEncoding('hex')` 将会导致数据以十六进制字符串格式编码。

The `Readable` stream will properly handle multi-byte characters delivered through the stream that would otherwise become improperly decoded if simply pulled from the stream as `Buffer` objects.

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('Got %d characters of string data:', chunk.length);
});
```

##### readable.unpipe([destination])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 可选的将要从管道中移除的流
* 返回：{this}

The `readable.unpipe()` method detaches a `Writable` stream previously attached using the [`stream.pipe()`][] method.

如未指定 `destination`，则会断开 *所有* 管道。

如果指定了 `destination`，但没有为其设定管道，则此方法不执行任何操作。

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt.');
  readable.unpipe(writable);
  console.log('Manually close the file stream.');
  writable.end();
}, 1000);
```

##### readable.unshift(chunk)
<!-- YAML
added: v0.9.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|any} 要移回可读队列的数据块。 对于以非对象模式运作的流，`chunk` 必须为字符串, `Buffer` 或 `Uint8Array`。 对于对象模式的流，`chunk` 可以是任何 JavaScript 值，但不能为 `null`。

`readable.unshift()` 方法将数据块压回内部缓冲区。 此方法在特定情况下非常有用，例如当正在通过代码消费的流需要 "un-consume(撤销消费) " 一定量已被从源中拉取的数据时，这样数据就可被传递给其他方。

The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [`Transform`][] stream instead. 请参阅 [流开发人员 API](#stream_api_for_stream_implementers) 部分以获取更多信息。

```js
// Pull off a header delimited by \n\n
// use unshift() if we get too much
// Call the callback with (error, header, stream)
const { StringDecoder } = require('string_decoder');
function parseHeader(stream, callback) {
  stream.on('error', callback);
  stream.on('readable', onReadable);
  const decoder = new StringDecoder('utf8');
  let header = '';
  function onReadable() {
    let chunk;
    while (null !== (chunk = stream.read())) {
      const str = decoder.write(chunk);
      if (str.match(/\n\n/)) {
        // found the header boundary
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // remove the 'readable' listener before unshifting
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // now the body of the message can be read from the stream.
        callback(null, header, stream);
      } else {
        // still reading the header.
        header += str;
      }
    }
  }
}
```

Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. This can cause unexpected results if `readable.unshift()` is called during a read (i.e. from within a [`stream._read()`](#stream_readable_read_size_1) implementation on a custom stream). Following the call to `readable.unshift()` with an immediate [`stream.push('')`](#stream_readable_push_chunk_encoding) will reset the reading state appropriately, however it is best to simply avoid calling `readable.unshift()` while in the process of performing a read.

##### readable.wrap(stream)
<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} "旧式" 可读流
* 返回：{this}

Prior to Node.js 0.10, streams did not implement the entire `stream` module API as it is currently defined. (See [Compatibility](#stream_compatibility_with_older_node_js_versions) for more information.)

When using an older Node.js library that emits [`'data'`][] events and has a [`stream.pause()`](#stream_readable_pause) method that is advisory only, the `readable.wrap()` method can be used to create a [`Readable`][] stream that uses the old stream as its data source.

很少需要使用 `readable.wrap()` ，但仍旧提供了该方法，以便于和旧的 Node.js 应用程序及库进行交互。

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // etc.
});
```

##### readable\[Symbol.asyncIterator\]()
<!-- YAML
added: v10.0.0
-->

> 稳定性：1 - 实验中

* Returns: {AsyncIterator} to fully consume the stream.

```js
const fs = require('fs');

async function print(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const k of readable) {
    data += k;
  }
  console.log(data);
}

print(fs.createReadStream('file')).catch(console.log);
```

If the loop terminates with a `break` or a `throw`, the stream will be destroyed. In other terms, iterating over a stream will consume the stream fully. The stream will be read in chunks of size equal to the `highWaterMark` option. In the code example above, data will be in a single chunk if the file has less then 64kb of data because no `highWaterMark` option is provided to [`fs.createReadStream()`][].

### Duplex 及 Transform 流

#### 类：stream.Duplex
<!-- YAML
added: v0.9.4
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8834
    description: Instances of `Duplex` now return `true` when
                 checking `instanceof stream.Writable`.
-->

<!--type=class-->

Duplex streams are streams that implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Duplex` streams include:

* [TCP 套接字](net.html#net_class_net_socket)
* [zlib 流](zlib.html)
* [crypto 流](crypto.html)

#### 类：stream.Transform
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [`Duplex`][] streams where the output is in some way related to the input. Like all [`Duplex`][] streams, `Transform` streams implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Transform` streams include:

* [zlib 流](zlib.html)
* [crypto 流](crypto.html)

##### transform.destroy([error])
<!-- YAML
added: v8.0.0
-->
* `error` {Error}

销毁流并发出 `'error'` 事件。 在此调用之后，转换流会释放任何内部资源。 Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback). The default implementation of `_destroy()` for `Transform` also emit `'close'`.

### stream.finished(stream, callback)
<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} A readable and/or writable stream.
* `callback` {Function} 具有可选 error 参数的回调函数。

A function to get notified when a stream is no longer readable, writable or has experienced an error or a premature close event.

```js
const { finished } = require('stream');

const rs = fs.createReadStream('archive.tar');

finished(rs, (err) => {
  if (err) {
    console.error('Stream failed.', err);
  } else {
    console.log('Stream is done reading.');
  }
});

rs.resume(); // drain the stream
```

Especially useful in error handling scenarios where a stream is destroyed prematurely (like an aborted HTTP request), and will not emit `'end'` or `'finish'`.

The `finished` API is promisify-able as well;

```js
const finished = util.promisify(stream.finished);

const rs = fs.createReadStream('archive.tar');

async function run() {
  await finished(rs);
  console.log('Stream is done reading.');
}

run().catch(console.error);
rs.resume(); // drain the stream
```

### stream.pipeline(...streams[, callback])
<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Two or more streams to pipe between.
* `callback` {Function} 具有可选 error 参数的回调函数。

A module method to pipe between streams forwarding errors and properly cleaning up and provide a callback when the pipeline is complete.

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// Use the pipeline API to easily pipe a series of streams
// together and get notified when the pipeline is fully done.

// A pipeline to gzip a potentially huge tar file efficiently:

pipeline(
  fs.createReadStream('archive.tar'),
  zlib.createGzip(),
  fs.createWriteStream('archive.tar.gz'),
  (err) => {
    if (err) {
      console.error('Pipeline failed.', err);
    } else {
      console.log('Pipeline succeeded.');
    }
  }
);
```

The `pipeline` API is promisify-able as well:

```js
const pipeline = util.promisify(stream.pipeline);

async function run() {
  await pipeline(
    fs.createReadStream('archive.tar'),
    zlib.createGzip(),
    fs.createWriteStream('archive.tar.gz')
  );
  console.log('Pipeline succeeded.');
}

run().catch(console.error);
```

## 流开发人员 API

<!--type=misc-->

`stream` 模块 API 被设计为更容易使用 JavaScript 的原型继承模型来实现流。

首先，流开发人员应声明一个新的 JavaScript 类，该类继承了四种基本流类 (`stream.Writable`, `stream.Readable`, `stream.Duplex`, 或 `stream.Transform`) 之一，且确保他们调用了适合的父类构造函数。
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }
}
```

新的流类必须实现一个或多个特殊的方法，具体取决于被创建的流的类型，正如如下图表所示：

| 用例                | 类             | 需要实现的方法                                                                                                 |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| 只读                | [`Readable`]  | <code>[_read][stream-_read]</code>                                                                               |
| 只写                | [`Writable`]  | <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code>                           |
| 读写                | [`Duplex`]    | <code>[_read][stream-_read]</code>, <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code> |
| 对写入的数据进行操作，然后读取结果 | [`Transform`] | <code>[_transform][stream-_transform]</code>, <code>[_flush][stream-_flush]</code>, <code>[_final][stream-_final]</code>                          |

The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

### 简化的构建<!-- YAML
added: v1.2.0
-->在很多简单的情况下，可以不依赖继承来构建流。 这可以通过直接创建 `stream.Writable`, `stream.Readable`, `stream.Duplex` 或 `stream.Transform` 的实例，并将适合的方法作为构造函数选项传递。

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### 实现一个 Writable 流

The `stream.Writable` class is extended to implement a [`Writable`][] stream.

Custom `Writable` streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` method. 还 *可以* 实现 `writable._writev()` 方法。

#### 构造器：new stream.Writable([options])<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: >
      Add `emitClose` option to specify if `'close'` is emitted on destroy
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: >
      Add `autoDestroy` option to automatically `destroy()` the stream
      when it emits `'finish'` or errors
-->* `options` {Object}
  * `highWaterMark` {number} 当 [`stream.write()`](#stream_writable_write_chunk_encoding_callback) 开始返回 `false` 时的缓冲区级别。 **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether to encode `string`s passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback) to `Buffer`s (with the encoding specified in the [`stream.write()`](#stream_writable_write_chunk_encoding_callback) call) before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). Other types of data are not converted (i.e. `Buffer`s are not decoded into `string`s). Setting to false will prevent `string`s from being converted.  **Default:** `true`.
  * `defaultEncoding` {string} The default encoding that is used when no encoding is specified as an argument to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). **默认值:**`‘utf8'`。
  * `objectMode` {boolean} [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) 是否为合法操作。 如果流的实现支持，则当被设置时，就可能写入 JavaScript 值，而不是字符串，`Buffer` 或 `Uint8Array`。 **默认:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `write` {Function} [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) 方法的实现。
  * `writev` {Function} [`stream._writev()`](#stream_writable_writev_chunks_callback) 方法的实现。
  * `destroy` {Function} [`stream._destroy()`](#stream_writable_destroy_err_callback) 方法的实现。
  * `final` {Function} [`stream._final()`](#stream_writable_final_callback) 方法的实现。
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **默认:** `false`.
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor
    super(options);
    // ...
  }
}
```

或者，当使用 pre-ES6 风格的构造函数时：

```js
const { Writable } = require('stream');
const util = require('util');

function MyWritable(options) {
  if (!(this instanceof MyWritable))
    return new MyWritable(options);
  Writable.call(this, options);
}
util.inherits(MyWritable, Writable);
```

或者，使用简化的构造函数方法：

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  },
  writev(chunks, callback) {
    // ...
  }
});
```

#### writable.\_write(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The `Buffer` to be written, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} 如果数据块为字符串，则 `encoding` 为该字符串的字符编码。 如果数据块为 `Buffer`，或者当流以对象模式运作时，可以忽略 `encoding`。
* `callback` {Function} 对提供的数据块处理结束后调用此函数 (有可选的 error 参数)。

All `Writable` stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) method to send data to the underlying resource.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

必须调用 `callback` 方法，以发出写入成功结束，或失败并出错的消息。 如果调用失败，则传递给 `callback` 的首个参数必须为 `Error` 对象，如果写入成功，则首个参数为 `null`。

在调用 `writable._write()` 和 `callback` 之间，所有对 `writable.write()` 的调用将会导致将被写入的数据被缓存。 When the `callback` is invoked, the stream might emit a [`'drain'`][] event. 如果流的实现有能力一次性处理多块数据，则应实现 `writable._writev()` 方法。

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

`writable._write()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### writable.\_writev(chunks, callback)

* `chunks` {Object[]} The chunks to be written. 每个数据块都具有如下格式：`{ chunk: ..., encoding: ... }`。
* `callback` {Function} 对提供的数据块处理结束时要调用的回调函数 (具有可选的 error 参数)。

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

在具有一次性处理多块数据能力的流的实现中，除了实现 `writable._write()` 之外，还应实现 `writable._writev()` 方法。 如果实现了，将会调用该方法并将在写入队列中缓存的所有数据块传递给它。

`writable._writev()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### writable.\_destroy(err, callback)<!-- YAML
added: v8.0.0
-->* `err` {Error} 可能的错误。
* `callback` {Function} 具有可选 error 参数的回调函数。

`_destroy()` 方法被 [`writable.destroy()`](#stream_writable_destroy_error) 所调用。 It can be overridden by child classes but it **must not** be called directly.

#### writable.\_final(callback)<!-- YAML
added: v8.0.0
-->* `callback` {Function} 结束写入任何剩余数据时调用此函数 (具有可选的 error 参数)。

`_final()` 方法 **不能** 被直接调用。 It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. 这将有助于在流结束前关闭资源并将已缓存数据写入。

#### 写入时错误

建议对于在 `writable._write()` 和 `writable._writev()` 方法处理过程中发生的错误，应通过调用回调函数报告，并将错误作为首个参数传递。 This will cause an `'error'` event to be emitted by the `Writable`. Throwing an `Error` from within `writable._write()` can result in unexpected and inconsistent behavior depending on how the stream is being used. 使用回调函数能确保一致且可预测的错误处理。

If a `Readable` stream pipes into a `Writable` stream when `Writable` emits an error, the `Readable` stream will be unpiped.

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
});
```

#### Writable 流示例

The following illustrates a rather simplistic (and somewhat pointless) custom `Writable` stream implementation. While this specific `Writable` stream instance is not of any real particular usefulness, the example illustrates each of the required elements of a custom [`Writable`][] stream instance:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('chunk is invalid'));
    } else {
      callback();
    }
  }
}
```

#### Writable 流中的解码缓冲区

解码缓冲区是一个通用任务，例如，当使用输入为字符串的转换器时。 当使用多字节字符编码，例如 UTF-8 时，这个过程并不简单。 The following example shows how to decode multi-byte strings using `StringDecoder` and [`Writable`][].

```js
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

class StringWritable extends Writable {
  constructor(options) {
    super(options);
    this._decoder = new StringDecoder(options && options.defaultEncoding);
    this.data = '';
  }
  _write(chunk, encoding, callback) {
    if (encoding === 'buffer') {
      chunk = this._decoder.write(chunk);
    }
    this.data += chunk;
    callback();
  }
  _final(callback) {
    this.data += this._decoder.end();
    callback();
  }
}

const euro = [[0xE2, 0x82], [0xAC]].map(Buffer.from);
const w = new StringWritable();

w.write('currency: ');
w.write(euro[0]);
w.end(euro[1]);

console.log(w.data); // currency: €
```

### 实现一个 Readable 流

The `stream.Readable` class is extended to implement a [`Readable`][] stream.

Custom `Readable` streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])<!-- YAML
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: >
      Add `autoDestroy` option to automatically `destroy()` the stream
      when it emits `'end'` or errors
-->* `options` {Object}
  * `highWaterMark` {number} 在停止从底层资源中读取之前，能存储在内部缓冲区中的最大 [字节数](#stream_highwatermark_discrepancy_after_calling_readable_setencoding)。 **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} 如果指定，则会使用指定的编码将缓冲区解码为字符串。 **Default:** `null`.
  * `objectMode` {boolean} 此流是否应以对象流方式运作。 Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **默认:** `false`.
  * `read` {Function} [`stream._read()`](#stream_readable_read_size_1) 方法的实现。
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **默认:** `false`.
```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor
    super(options);
    // ...
  }
}
```

或者，当使用 pre-ES6 风格的构造函数时：

```js
const { Readable } = require('stream');
const util = require('util');

function MyReadable(options) {
  if (!(this instanceof MyReadable))
    return new MyReadable(options);
  Readable.call(this, options);
}
util.inherits(MyReadable, Readable);
```

或者，使用简化的构造函数方法：

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable.\_read(size)<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: call `_read()` only once per microtick
-->* `size` {number} 通过异步方式读取的字节数

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

当调用 `readable._read()` 时，如果在资源中有可用数据，该实现应开始使用 [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding) 方法将数据压入到读取队列中。 `_read()` 应继续从资源中读取并推送数据，直到 `readable.push()` 返回 `false` 为止。 当 `_read()` 在停止后再次被调用时，它将会恢复推送额外数据到队列中。

Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called. `readable._read()` is guaranteed to be called only once within a synchronous execution, i.e. a microtick.

建议提供 `size` 参数。 在某些实现中， "读取" 是返回数据的单一操作，这时可以使用 `size` 参数来决定有多少数据需要获取。 在其他的实现中，可以忽略此参数，并在数据可用时简单的提供数据。 在调用 [`stream.push(chunk)`](#stream_readable_push_chunk_encoding) 之前，没有必要 "等到" 有 `size` 个字节可用时再进行调用。

`readable._read()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### readable.\_destroy(err, callback)<!-- YAML
added: v8.0.0
-->* `err` {Error} 可能的错误。
* `callback` {Function} 具有可选 error 参数的回调函数。

`_destroy()` 方法被 [`readable.destroy()`](#stream_readable_destroy_error) 所调用。 It can be overridden by child classes but it **must not** be called directly.

#### readable.push(chunk[, encoding])<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->* `chunk` {Buffer|Uint8Array|string|null|any} 要压入读取队列的数据块。 对于以非对象模式运作的流，`chunk` 必须为字符串, `Buffer` 或 `Uint8Array`。 对于对象模式的流，`chunk` 可以是任何 JavaScript 值。
* `encoding` {string} 字符串块的编码。 Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continue to be pushed; `false` otherwise.

当 `chunk` 是一个 `Buffer`, `Uint8Array` 或 `字符串` 时，`chunk` 参数中的数据将被添加到内部队列，以便流用户可以消费。 如果把 `null` 传递给 `chunk` 参数就传递了流结尾 (EOF) 的信号，之后数据不能再被写入。

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

`readable.push()` 方法被设计为尽可能的灵活。 For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance:

```js
// source is an object with readStop() and readStart() methods,
// and an `ondata` member that gets called when it has data, and
// an `onend` member that gets called when the data is over.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowlevelSourceObject();

    // Every time there's data, push it into the internal buffer.
    this._source.ondata = (chunk) => {
      // if push() returns false, then stop reading from source
      if (!this.push(chunk))
        this._source.readStop();
    };

    // When the source ends, push the EOF-signaling `null` chunk
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read will be called when the stream wants to pull more data in
  // the advisory size argument is ignored in this case.
  _read(size) {
    this._source.readStart();
  }
}
```

The `readable.push()` method is intended be called only by `Readable` implementers, and only from within the `readable._read()` method.

For streams not operating in object mode, if the `chunk` parameter of `readable.push()` is `undefined`, it will be treated as empty string or buffer. See [`readable.push('')`][] for more information.

#### 读取时错误

建议在 `readable._read()` 方法的处理过程中发生的错误应使用 `'error'` 事件进行发送，而不是将错误抛出。 Throwing an `Error` from within `readable._read()` can result in unexpected and inconsistent behavior depending on whether the stream is operating in flowing or paused mode. 使用 `'error'` 事件能确保一致的，且可预测的错误处理。
```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    if (checkSomeErrorCondition()) {
      process.nextTick(() => this.emit('error', err));
      return;
    }
    // do some work
  }
});
```

#### 一个计数流的示例<!--type=example-->The following is a basic example of a `Readable` stream that emits the numerals from 1 to 1,000,000 in ascending order, and then ends.

```js
const { Readable } = require('stream');

class Counter extends Readable {
  constructor(opt) {
    super(opt);
    this._max = 1000000;
    this._index = 1;
  }

  _read() {
    const i = this._index++;
    if (i > this._max)
      this.push(null);
    else {
      const str = String(i);
      const buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}
```

### 实现一个 Duplex 流

A [`Duplex`][] stream is one that implements both [`Readable`][] and [`Writable`][], such as a TCP socket connection.

Because JavaScript does not have support for multiple inheritance, the `stream.Duplex` class is extended to implement a [`Duplex`][] stream (as opposed to extending the `stream.Readable` *and* `stream.Writable` classes).

The `stream.Duplex` class prototypically inherits from `stream.Readable` and parasitically from `stream.Writable`, but `instanceof` will work properly for both base classes due to overriding [`Symbol.hasInstance`][] on `stream.Writable`.

Custom `Duplex` streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both `Writable` and `Readable` constructors. 同时含有如下字段：
  * `allowHalfOpen` {boolean} If set to `false`, then the stream will automatically end the writable side when the readable side ends. **Default:** `true`.
  * `readableObjectMode` {boolean} Sets `objectMode` for readable side of the stream. Has no effect if `objectMode` is `true`. **默认:** `false`.
  * `writableObjectMode` {boolean} Sets `objectMode` for writable side of the stream. Has no effect if `objectMode` is `true`. **默认:** `false`.
  * `readableHighWaterMark` {number} 为流的读取端设置 `highWaterMark`。 如果提供了 `highWaterMark`，则不产生任何效果。
  * `writableHighWaterMark` {number} 为流的写入端设置 `highWaterMark`。 如果提供了 `highWaterMark`，则不产生任何效果。
```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

或者，当使用 pre-ES6 风格的构造函数时：

```js
const { Duplex } = require('stream');
const util = require('util');

function MyDuplex(options) {
  if (!(this instanceof MyDuplex))
    return new MyDuplex(options);
  Duplex.call(this, options);
}
util.inherits(MyDuplex, Duplex);
```

或者，使用简化的构造函数方法：

```js
const { Duplex } = require('stream');

const myDuplex = new Duplex({
  read(size) {
    // ...
  },
  write(chunk, encoding, callback) {
    // ...
  }
});
```

#### 一个 Duplex 流的示例

The following illustrates a simple example of a `Duplex` stream that wraps a hypothetical lower-level source object to which data can be written, and from which data can be read, albeit using an API that is not compatible with Node.js streams. The following illustrates a simple example of a `Duplex` stream that buffers incoming written data via the [`Writable`][] interface that is read back out via the [`Readable`][] interface.

```js
const { Duplex } = require('stream');
const kSource = Symbol('source');

class MyDuplex extends Duplex {
  constructor(source, options) {
    super(options);
    this[kSource] = source;
  }

  _write(chunk, encoding, callback) {
    // The underlying source only deals with strings
    if (Buffer.isBuffer(chunk))
      chunk = chunk.toString();
    this[kSource].writeSomeData(chunk);
    callback();
  }

  _read(size) {
    this[kSource].fetchSomeData(size, (data, encoding) => {
      this.push(Buffer.from(data, encoding));
    });
  }
}
```

The most important aspect of a `Duplex` stream is that the `Readable` and `Writable` sides operate independently of one another despite co-existing within a single object instance.

#### 对象模式的 Duplex 流

For `Duplex` streams, `objectMode` can be set exclusively for either the `Readable` or `Writable` side using the `readableObjectMode` and `writableObjectMode` options respectively.

In the following example, for instance, a new `Transform` stream (which is a type of [`Duplex`][] stream) is created that has an object mode `Writable` side that accepts JavaScript numbers that are converted to hexadecimal strings on the `Readable` side.

```js
const { Transform } = require('stream');

// All Transform streams are also Duplex Streams
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Coerce the chunk to a number if necessary
    chunk |= 0;

    // Transform the chunk into something else.
    const data = chunk.toString(16);

    // Push the data onto the readable queue.
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// Prints: 01
myTransform.write(10);
// Prints: 0a
myTransform.write(100);
// Prints: 64
```

### 实现一个 Transform 流

A [`Transform`][] stream is a [`Duplex`][] stream where the output is computed in some way from the input. 例子包括进行压缩，加密，和解密数据的 [zlib](zlib.html) 流或 [crypto](crypto.html) 流。

There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. For example, a `Hash` stream will only ever have a single chunk of output which is provided when the input is ended. A `zlib` stream will produce output that is either much smaller or much larger than its input.

The `stream.Transform` class is extended to implement a [`Transform`][] stream.

`stream.Transform` 类原型继承自 `stream.Duplex`，且实现了它自己版本的 `writable._write()` 和 `readable._read()` 方法。 Custom `Transform` implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

Care must be taken when using `Transform` streams in that data written to the stream can cause the `Writable` side of the stream to become paused if the output on the `Readable` side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both `Writable` and `Readable` constructors. 同时含有如下字段：
  * `transform` {Function} [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) 方法的实现。
  * `flush` {Function} [`stream._flush()`](#stream_transform_flush_callback) 方法的实现。
```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

或者，当使用 pre-ES6 风格的构造函数时：

```js
const { Transform } = require('stream');
const util = require('util');

function MyTransform(options) {
  if (!(this instanceof MyTransform))
    return new MyTransform(options);
  Transform.call(this, options);
}
util.inherits(MyTransform, Transform);
```

或者，使用简化的构造函数方法：

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### 事件：'finish' 和 'end'

[`'finish'`][] 和 [`'end'`][] 事件分别来自于 `stream.Writable` 类和 `stream.Readable` 类。 当调用了 [`stream.end()`](#stream_writable_end_chunk_encoding_callback)，且 [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) 处理完所有的数据块后会发出 `'finish'` 事件。 在 [`transform._flush()`](#stream_transform_flush_callback) 中的回调函数被调用后，当所有数据输出之后，会发出 `'end'` 事件。

#### transform.\_flush(callback)

* `callback` {Function} 当剩余数据被刷新时要调用的回调函数 (包含可选的 error 参数和数据)。

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

在某些情况下，转换操作可能需要在流的尾部发送额外的数据。 例如：`zlib` 压缩流会存储一定量的，用于优化压缩输出的内部状态。 然而，当流结束时，该额外数据需要被刷新，以便完成压缩数据。

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

在 `transform._flush()` 的实现中，`readable.push()` 方法可能会被酌情调用零次或多次。 当刷新操作完成时，必须调用 `callback` 函数。

`transform._flush()` 方法具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} The `Buffer` to be transformed, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} 如果数据块为字符串，则这是编码类型。 如果数据块为缓冲区，则 encoding 为特殊的值 - 'buffer'，在这种情况下忽略它。
* `callback` {Function} 在提供的 `chunk` 被处理后要调用的回调函数 (具有可选的 error 参数和数据)。

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Transform` stream implementations must provide a `_transform()` method to accept input and produce output. `transform._transform()` 的实现会处理写入的字节，计算输出，并使用 `readable.push()` 方法传递输出到可读部分。

`transform.push()` 方法可能会被调用零次或多次，以从单一输入数据块生成输出，具体取决于需要多少数据来产生输出数据块。

可能从任何给定的输入数据块都无法生成任何输出。

只有在当前数据块被完全消费时，才能调用 `callback` 函数。 如果在处理输入时发生错误，传递给 `callback` 的首个参数必须是一个 `Error` 对象，否则该参数为 `null`。 如果将第二个参数传递给 `callback`，它将被传递给 `readable.push()` 方法。 In other words, the following are equivalent:

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

`transform._transform()` 方法具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

`transform._transform()` is never called in parallel; streams implement a queue mechanism, and to receive the next chunk, `callback` must be called, either synchronously or asynchronously.

#### 类：stream.PassThrough

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. 它的主要目的就是用于示例和测试，但在有些情况下 `stream.PassThrough` 可被用做新型流的组成部分。

## 附注<!--type=misc-->### 和旧版本 Node.js 的兼容性<!--type=misc-->Prior to Node.js 0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

* Rather than waiting for calls to the [`stream.read()`](#stream_readable_read_size) method, [`'data'`][] events would begin emitting immediately. 对于需要完成一定量的工作才能决定如何处理数据的应用程序，需要将读取的数据存储到缓冲区中，这样数据就不会丢失。
* [`stream.pause()`](#stream_readable_pause) 方法只是建议性的，而不能提供保证。 This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

In Node.js 0.10, the [`Readable`][] class was added. For backward compatibility with older Node.js programs, `Readable` streams switch into "flowing mode" when a [`'data'`][] event handler is added, or when the [`stream.resume()`](#stream_readable_resume) method is called. 其效果就是，即使当没有使用新的 [`stream.read()`](#stream_readable_read_size) 方法和 [`'readable'`][] 事件时，也无需担心丢失 [`'data'`][] 数据块。

尽管大多数应用程序将会正常运行，但这会在如下条件下引入边缘案例：

* 未添加 [`'data'`][] 事件监听器。
* 从未调用 [`stream.resume()`](#stream_readable_resume) 方法。
* 流没有通过管道传输到任何可写入目的地。

例如：考虑如下代码：

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // we add an 'end' listener, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Prior to Node.js 0.10, the incoming message data would be simply discarded. However, in Node.js 0.10 and beyond, the socket remains paused forever.

在这种情况下的解决办法就是调用 [`stream.resume()`](#stream_readable_resume) 方法来开始数据流。

```js
// Workaround
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // start the flow of data, discarding it.
  socket.resume();
}).listen(1337);
```

In addition to new `Readable` streams switching into flowing mode, pre-0.10 style streams can be wrapped in a `Readable` class using the [`readable.wrap()`][`stream.wrap()`] method.

### `readable.read(0)`

在某些情况下，有必要触发刷新底层可读流机制，而无需实际消费任何数据。 在这些情况下，可以调用 `readable.read(0)`，它会一直返回 `null`。

如果内部读取缓冲区低于 `highWaterMark`，同时流当前未进行读取，则调用 `stream.read(0)` 会触发对低级方法 [`stream._read()`](#stream_readable_read_size_1) 的调用。

While most applications will almost never need to do this, there are situations within Node.js where this is done, particularly in the `Readable` stream class internals.

### `readable.push('')`

不推荐使用 `readable.push('')`。

压入一个零字节字符串，`Buffer` 或 `Uint8Array` 到非对象模式的流中具有有趣的副作用。 因为它 *是* 对 [`readable.push()`](#stream_readable_push_chunk_encoding) 的调用，该调用会终止读取过程。 然而，由于参数为空字符串，不会有数据被添加到可读缓冲区，这样用户就没有数据可以消费。

### 调用 `readable.setEncoding()` 后 `highWaterMark` 的差异

使用 `readable.setEncoding()` 将会改变 `highWaterMark` 在非对象模式下的运作行为。

通常，当前缓冲区的大小是比照 `highWaterMark` 并以 _字节_ 为单位来测量的。 然而，在调用 `setEncoding()` 后，比较函数将会以 _字符_ 为单位来开始测量缓冲区大小。

通常情况下，如果编码为 `latin1` 或 `ascii` ，这不会有问题。 但是当处理可能包含多字节字符的字符串时，建议留意这种行为。
