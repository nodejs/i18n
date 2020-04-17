# 流

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

流是一个可用于处理 Node.js 中流数据的抽象接口。 The `stream` module provides an API for implementing the stream interface.

Node.js 提供了很多流对象。 例如：[向 HTTP 服务器发出的请求](http.html#http_class_http_incomingmessage) 和 [`process.stdout`][] 都是流的实例。

流可以是可读的，可写的，或可读写的。 所有的流都是 [`EventEmitter`][] 的实例。

To access the `stream` module:

```js
const stream = require('stream');
```

The `stream` module is useful for creating new types of stream instances. It is usually not necessary to use the `stream` module to consume streams.

## 本文档的组织结构

This document contains two primary sections and a third section for notes. The first section explains how to use existing streams within an application. The second section explains how to create new types of streams.

## 流的类型

在 Node.js 中有四种基本的流类型：

* [`Writable`][]: streams to which data can be written (for example, [`fs.createWriteStream()`][]).
* [`Readable`][]: streams from which data can be read (for example, [`fs.createReadStream()`][]).
* [`Duplex`][]: streams that are both `Readable` and `Writable` (for example, [`net.Socket`][]).
* [`Transform`][]: `Duplex` streams that can modify or transform the data as it is written and read (for example, [`zlib.createDeflate()`][]).

Additionally, this module includes the utility functions [`stream.pipeline()`][], [`stream.finished()`][] and [`stream.Readable.from()`][].

### 对象模式

All streams created by Node.js APIs operate exclusively on strings and `Buffer` (or `Uint8Array`) objects. It is possible, however, for stream implementations to work with other types of JavaScript values (with the exception of `null`, which serves a special purpose within streams). Such streams are considered to operate in "object mode".

在创建流时，使用 `objectMode` 选项会将流实例切换到对象模式。 尝试将现有流切换到对象模式是不安全的。

### 缓冲

<!--type=misc-->

Both [`Writable`][] and [`Readable`][] streams will store data in an internal buffer that can be retrieved using `writable.writableBuffer` or `readable.readableBuffer`, respectively.

The amount of data potentially buffered depends on the `highWaterMark` option passed into the stream's constructor. For normal streams, the `highWaterMark` option specifies a [total number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding). 对于以对象模式操作的流，`highWaterMark` 指定了对象总数。

Data is buffered in `Readable` streams when the implementation calls [`stream.push(chunk)`](#stream_readable_push_chunk_encoding). 如果流的消费者没有调用 [`stream.read()`](#stream_readable_read_size)，数据将会一直处于内部队列中，直到它被消费为止。

一旦内部读取缓冲区的总大小达到 `highWaterMark` 指定的阈值，该流会暂时停止从底层资源中读取数据，直到当前被缓存的数据被消费为止 (这就是说，流会停止调用内部的 `readable._read()` 方法来填充读取缓冲区)。

Data is buffered in `Writable` streams when the [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) method is called repeatedly. 当内部写入缓冲区的总大小低于由 `highWaterMark` 设定的阈值时，对 `writable.write()` 的调用将会返回 `true`。 一旦内部缓冲区的大小达到或超过 `highWaterMark`，将会返回 `false`。

A key goal of the `stream` API, particularly the [`stream.pipe()`][] method, is to limit the buffering of data to acceptable levels such that sources and destinations of differing speeds will not overwhelm the available memory.

Because [`Duplex`][] and [`Transform`][] streams are both `Readable` and `Writable`, each maintains *two* separate internal buffers used for reading and writing, allowing each side to operate independently of the other while maintaining an appropriate and efficient flow of data. For example, [`net.Socket`][] instances are [`Duplex`][] streams whose `Readable` side allows consumption of data received *from* the socket and whose `Writable` side allows writing data *to* the socket. Because data may be written to the socket at a faster or slower rate than data is received, each side should operate (and buffer) independently of the other.

## 用于流消费者的 API

<!--type=misc-->

几乎所有的 Node.js 应用程序，无论如何简单，都通过某种方式在使用流。 如下是一个在 Node.js 应用程序中使用流实现 HTTP 服务器的示例：

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // `req` is an http.IncomingMessage, which is a Readable Stream.
  // `res` is an http.ServerResponse, which is a Writable Stream.

  let body = '';
  // Get the data as utf8 strings.
  // If an encoding is not set, Buffer objects will be received.
  req.setEncoding('utf8');

  // Readable streams emit 'data' events once a listener is added.
  req.on('data', (chunk) => {
    body += chunk;
  });

  // The 'end' event indicates that the entire body has been received.
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // Write back something interesting to the user:
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

Writable streams are an abstraction for a *destination* to which data is written.

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

#### Class: `stream.Writable`
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: `'close'`
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

##### Event: `'drain'`
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
        // Last time!
        writer.write(data, encoding, callback);
      } else {
        // See if we should continue, or wait.
        // Don't pass the callback, because we're not done yet.
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // Had to stop early!
      // Write some more once it drains.
      writer.once('drain', write);
    }
  }
}
```

##### Event: `'error'`
<!-- YAML
added: v0.9.4
-->

* {Error}

当写入或在管道中传输数据出错时，会发出 `'error'` 事件。 当监听器回调函数被调用时，它会接收一个 0>Error</code> 参数。

The stream is not closed when the `'error'` event is emitted unless the [`autoDestroy`](#stream_constructor_new_stream_writable_options) option was set to `true` when creating the stream.

##### Event: `'finish'`
<!-- YAML
added: v0.9.4
-->

在 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 方法被调用，且所有数据被传递给底层系统后，会发出 `'finish'` 事件。

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`hello, #${i}!\n`);
}
writer.on('finish', () => {
  console.log('All writes are now complete.');
});
writer.end('This is the end\n');
```

##### Event: `'pipe'`
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

##### Event: `'unpipe'`
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

##### `writable.cork()`
<!-- YAML
added: v0.11.2
-->

`writable.cork()` 方法会强制把所有写入的数据都缓冲到内存中。 当调用 [`stream.uncork()`][] 或 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 方法时，缓冲区数据将被刷新。

The primary intent of `writable.cork()` is to accommodate a situation in which several small chunks are written to the stream in rapid succession. Instead of immediately forwarding them to the underlying destination, `writable.cork()` buffers all the chunks until `writable.uncork()` is called, which will pass them all to `writable._writev()`, if present. This prevents a head-of-line blocking situation where data is being buffered while waiting for the first small chunk to be processed. However, use of `writable.cork()` without implementing `writable._writev()` may have an adverse effect on throughput.

See also: [`writable.uncork()`][], [`writable._writev()`](#stream_writable_writev_chunks_callback).

##### `writable.destroy([error])`
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Optional, an error to emit with `'error'` event.
* 返回：{this}

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'` event (unless `emitClose` is set to `false`). After this call, the writable stream has ended and subsequent calls to `write()` or `end()` will result in an `ERR_STREAM_DESTROYED` error. This is a destructive and immediate way to destroy a stream. Previous calls to `write()` may not have drained, and may trigger an `ERR_STREAM_DESTROYED` error. Use `end()` instead of destroy if data should flush before close, or wait for the `'drain'` event before destroying the stream. Implementors should not override this method, but instead implement [`writable._destroy()`](#stream_writable_destroy_err_callback).

##### `writable.destroyed`
<!-- YAML
added: v8.0.0
-->

* {boolean}

Is `true` after [`writable.destroy()`](#stream_writable_destroy_error) has been called.

##### `writable.end([chunk[, encoding]][, callback])`
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

* `chunk` {string|Buffer|Uint8Array|any} 可选的要写入的数据。 For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} The encoding if `chunk` is a string
* `callback` {Function} 可选的当流结束时的回调函数
* 返回：{this}

Calling the `writable.end()` method signals that no more data will be written to the [`Writable`][]. 可选的 `chunk` 和 `encoding` 参数允许在关闭流之前再写入最后一个额外的数据块。 如果提供了这两个参数，`callback` 函数会作为监听器添加到 [`'finish'`][] 事件。

在调用 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 后调用 [`stream.write()`](#stream_writable_write_chunk_encoding_callback) 方法会引发错误。

```js
// Write 'hello, ' and then end with 'world!'.
const fs = require('fs');
const file = fs.createWriteStream('example.txt');
file.write('hello, ');
file.end('world!');
// Writing more now is not allowed!
```

##### `writable.setDefaultEncoding(encoding)`
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

##### `writable.uncork()`
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

##### `writable.writable`
<!-- YAML
added: v11.4.0
-->

* {boolean}

Is `true` if it is safe to call [`writable.write()`](#stream_writable_write_chunk_encoding_callback).

##### `writable.writableEnded`
<!-- YAML
added: v12.9.0
-->

* {boolean}

Is `true` after [`writable.end()`][] has been called. This property does not indicate whether the data has been flushed, for this use [`writable.writableFinished`][] instead.

##### `writable.writableCorked`
<!-- YAML
added: v12.16.0
-->

* {integer}

Number of times [`writable.uncork()`](#stream_writable_uncork) needs to be called in order to fully uncork the stream.

##### `writable.writableFinished`
<!-- YAML
added: v12.6.0
-->

* {boolean}

Is set to `true` immediately before the [`'finish'`][] event is emitted.

##### `writable.writableHighWaterMark`
<!-- YAML
added: v9.3.0
-->

* {number}

Return the value of `highWaterMark` passed when constructing this `Writable`.

##### `writable.writableLength`
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be written. The value provides introspection data regarding the status of the `highWaterMark`.

##### `writable.writableObjectMode`
<!-- YAML
added: v12.3.0
-->

* {boolean}

Getter for the property `objectMode` of a given `Writable` stream.

##### `writable.write(chunk[, encoding][, callback])`
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

* `chunk` {string|Buffer|Uint8Array|any} 可选的要写入的数据。 For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value other than `null`.
* `encoding` {string} 当 `chunk` 为字符串时的编码
* `callback` {Function} 当此数据块被刷新时的回调函数
* 返回：{boolean} 如果流需要等待发出 `'drain'` 事件后才能继续写入额外数据，则返回`false`；否则返回 `true`。

`writable.write()` 方法会向流中写入一些数据，并在数据被处理完毕后调用提供的 `callback`。 If an error occurs, the `callback` *may or may not* be called with the error as its first argument. 要想可靠的检测写入错误，请为 `'error'` 事件添加一个监听器。

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

Readable streams are an abstraction for a *source* from which data is consumed.

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

Adding a [`'readable'`][] event handler automatically make the stream to stop flowing, and the data to be consumed via [`readable.read()`](#stream_readable_read_size). If the [`'readable'`][] event handler is removed, then the stream will start flowing again if there is a [`'data'`][] event handler.

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
// readableFlowing is now false.

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok');  // Will not emit 'data'.
pass.resume();     // Must be called to make stream emit 'data'.
```

While `readable.readableFlowing` is `false`, data may be accumulating within the stream's internal buffer.

#### Choose One API Style

The `Readable` stream API evolved across multiple Node.js versions and provides multiple methods of consuming stream data. In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream. Specifically, using a combination of `on('data')`, `on('readable')`, `pipe()`, or async iterators could lead to unintuitive behavior.

对于大多数用户而言，建议使用 `readable.pipe()` 方法，其原因在于该方法的实现提供了消费流数据的最简易方式。 Developers that require more fine-grained control over the transfer and generation of data can use the [`EventEmitter`][] and `readable.on('readable')`/`readable.read()` or the `readable.pause()`/`readable.resume()` APIs.

#### Class: `stream.Readable`
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### Event: `'close'`
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

##### Event: `'data'`
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

##### Event: `'end'`
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

##### Event: `'error'`
<!-- YAML
added: v0.9.4
-->

* {Error}

The `'error'` event may be emitted by a `Readable` implementation at any time. 通常情况下，当由于底层内部错误导致底层流无法生成数据，或当流的实现试图推送无效的数据块时，会发出 'error' 事件。

监听器回调函数会接收一个 `Error` 对象。

##### Event: `'pause'`
<!-- YAML
added: v0.9.4
-->

The `'pause'` event is emitted when [`stream.pause()`](#stream_readable_pause) is called and `readableFlowing` is not `false`.

##### Event: `'readable'`
<!-- YAML
added: v0.9.4
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17979
    description: The `'readable'` is always emitted in the next tick after
                 `.push()` is called.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18994
    description: Using `'readable'` requires calling `.read()`.
-->

当流中有数据可读取时，会发出 `'readable'` 事件。 在有些情况下，为 `'readable'` 事件附加监听器将会导致一些数据被读取到内部缓冲区。

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // There is some data to read now.
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

```console
$ node test.js
readable: null
end
```

In general, the `readable.pipe()` and `'data'` event mechanisms are easier to understand than the `'readable'` event. However, handling `'readable'` might result in increased throughput.

If both `'readable'` and [`'data'`][] are used at the same time, `'readable'` takes precedence in controlling the flow, i.e. `'data'` will be emitted only when [`stream.read()`](#stream_readable_read_size) is called. The `readableFlowing` property would become `false`. If there are `'data'` listeners when `'readable'` is removed, the stream will start flowing, i.e. `'data'` events will be emitted without calling `.resume()`.

##### Event: `'resume'`
<!-- YAML
added: v0.9.4
-->

The `'resume'` event is emitted when [`stream.resume()`](#stream_readable_resume) is called and `readableFlowing` is not `true`.

##### `readable.destroy([error])`
<!-- YAML
added: v8.0.0
-->

* `error` {Error} Error which will be passed as payload in `'error'` event
* 返回：{this}

Destroy the stream. Optionally emit an `'error'` event, and emit a `'close'` event (unless `emitClose` is set to `false`). After this call, the readable stream will release any internal resources and subsequent calls to `push()` will be ignored. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback).

##### `readable.destroyed`
<!-- YAML
added: v8.0.0
-->

* {boolean}

Is `true` after [`readable.destroy()`](#stream_readable_destroy_error) has been called.

##### `readable.isPaused()`
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

##### `readable.pause()`
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

##### `readable.pipe(destination[, options])`
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
// All the data from readable goes into 'file.txt'.
readable.pipe(writable);
```

It is possible to attach multiple `Writable` streams to a single `Readable` stream.

The `readable.pipe()` method returns a reference to the *destination* stream making it possible to set up chains of piped streams:

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

One important caveat is that if the `Readable` stream emits an error during processing, the `Writable` destination *is not closed* automatically. If an error occurs, it will be necessary to *manually* close each stream in order to prevent memory leaks.

The [`process.stderr`][] and [`process.stdout`][] `Writable` streams are never closed until the Node.js process exits, regardless of the specified options.

##### `readable.read([size])`
<!-- YAML
added: v0.9.4
-->

* `size` {number} 指定要读取数据量的可选参数。
* 返回：{string|Buffer|null|any}

`readable.read()` 方法从内部缓冲区拉取并返回一些数据。 如果没有可读数据，则返回 `null`。 默认情况下会以 `Buffer` 对象的形式返回，除非已通过 `readable.setEncoding()` 方法指定编码或流以对象模式运作。

可选的 `size` 参数指定了要读取的特定字节数。 If `size` bytes are not available to be read, `null` will be returned *unless* the stream has ended, in which case all of the data remaining in the internal buffer will be returned.

如果未指定 `size` 参数，则内部缓冲区中的所有数据将被返回。

The `size` argument must be less than or equal to 1 GB.

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

The `while` loop is necessary when processing data with `readable.read()`. Only after `readable.read()` returns `null`, [`'readable'`][] will be emitted.

A `Readable` stream in object mode will always return a single item from a call to [`readable.read(size)`](#stream_readable_read_size), regardless of the value of the `size` argument.

If the `readable.read()` method returns a chunk of data, a `'data'` event will also be emitted.

Calling [`stream.read([size])`](#stream_readable_read_size) after the [`'end'`][] event has been emitted will return `null`. 不会抛出运行时错误。

##### `readable.readable`
<!-- YAML
added: v11.4.0
-->

* {boolean}

Is `true` if it is safe to call [`readable.read()`](#stream_readable_read_size).

##### `readable.readableEncoding`
<!-- YAML
added: v12.7.0
-->

* {null|string}

Getter for the property `encoding` of a given `Readable` stream. The `encoding` property can be set using the [`readable.setEncoding()`][] method.

##### `readable.readableEnded`
<!-- YAML
added: v12.9.0
-->

* {boolean}

Becomes `true` when [`'end'`][] event is emitted.

##### `readable.readableFlowing`
<!-- YAML
added: v9.4.0
-->

* {boolean}

This property reflects the current state of a `Readable` stream as described in the [Stream Three States](#stream_three_states) section.

##### `readable.readableHighWaterMark`
<!-- YAML
added: v9.3.0
-->

* {number}

Returns the value of `highWaterMark` passed when constructing this `Readable`.

##### `readable.readableLength`
<!-- YAML
added: v9.4.0
-->

* {number}

This property contains the number of bytes (or objects) in the queue ready to be read. The value provides introspection data regarding the status of the `highWaterMark`.

##### `readable.readableObjectMode`
<!-- YAML
added: v12.3.0
-->

* {boolean}

Getter for the property `objectMode` of a given `Readable` stream.

##### `readable.resume()`
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

##### `readable.setEncoding(encoding)`
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

##### `readable.unpipe([destination])`
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 可选的将要从管道中移除的流
* 返回：{this}

The `readable.unpipe()` method detaches a `Writable` stream previously attached using the [`stream.pipe()`][] method.

If the `destination` is not specified, then *all* pipes are detached.

如果指定了 `destination`，但没有为其设定管道，则此方法不执行任何操作。

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second.
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt.');
  readable.unpipe(writable);
  console.log('Manually close the file stream.');
  writable.end();
}, 1000);
```

##### `readable.unshift(chunk[, encoding])`
<!-- YAML
added: v0.9.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to unshift onto the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer`, `Uint8Array` or `null`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} 字符串块的编码。 Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.

Passing `chunk` as `null` signals the end of the stream (EOF) and behaves the same as `readable.push(null)`, after which no more data can be written. The EOF signal is put at the end of the buffer and any buffered data will still be flushed.

`readable.unshift()` 方法将数据块压回内部缓冲区。 此方法在特定情况下非常有用，例如当正在通过代码消费的流需要 "un-consume(撤销消费) " 一定量已被从源中拉取的数据时，这样数据就可被传递给其他方。

The `stream.unshift(chunk)` method cannot be called after the [`'end'`][] event has been emitted or a runtime error will be thrown.

Developers using `stream.unshift()` often should consider switching to use of a [`Transform`][] stream instead. 请参阅 [流开发人员 API](#stream_api_for_stream_implementers) 部分以获取更多信息。

```js
// Pull off a header delimited by \n\n.
// Use unshift() if we get too much.
// Call the callback with (error, header, stream).
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
        // Found the header boundary.
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // Remove the 'readable' listener before unshifting.
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // Now the body of the message can be read from the stream.
        callback(null, header, stream);
      } else {
        // Still reading the header.
        header += str;
      }
    }
  }
}
```

Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. This can cause unexpected results if `readable.unshift()` is called during a read (i.e. from within a [`stream._read()`](#stream_readable_read_size_1) implementation on a custom stream). Following the call to `readable.unshift()` with an immediate [`stream.push('')`](#stream_readable_push_chunk_encoding) will reset the reading state appropriately, however it is best to simply avoid calling `readable.unshift()` while in the process of performing a read.

##### `readable.wrap(stream)`
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

##### `readable[Symbol.asyncIterator]()`
<!-- YAML
added: v10.0.0
changes:
  - version: v11.14.0
    pr-url: https://github.com/nodejs/node/pull/26989
    description: Symbol.asyncIterator support is no longer experimental.
-->

* Returns: {AsyncIterator} to fully consume the stream.

```js
const fs = require('fs');

async function print(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  console.log(data);
}

print(fs.createReadStream('file')).catch(console.error);
```

If the loop terminates with a `break` or a `throw`, the stream will be destroyed. In other terms, iterating over a stream will consume the stream fully. The stream will be read in chunks of size equal to the `highWaterMark` option. In the code example above, data will be in a single chunk if the file has less then 64kb of data because no `highWaterMark` option is provided to [`fs.createReadStream()`][].

### Duplex 及 Transform 流

#### Class: `stream.Duplex`
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

#### Class: `stream.Transform`
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform streams are [`Duplex`][] streams where the output is in some way related to the input. Like all [`Duplex`][] streams, `Transform` streams implement both the [`Readable`][] and [`Writable`][] interfaces.

Examples of `Transform` streams include:

* [zlib 流](zlib.html)
* [crypto 流](crypto.html)

##### `transform.destroy([error])`
<!-- YAML
added: v8.0.0
-->

* `error` {Error}

Destroy the stream, and optionally emit an `'error'` event. After this call, the transform stream would release any internal resources. Implementors should not override this method, but instead implement [`readable._destroy()`](#stream_readable_destroy_err_callback). The default implementation of `_destroy()` for `Transform` also emit `'close'` unless `emitClose` is set in false.

### `stream.finished(stream[, options], callback)`
<!-- YAML
added: v10.0.0
-->

* `stream` {Stream} A readable and/or writable stream.
* `options` {Object}
  * `error` {boolean} If set to `false`, then a call to `emit('error', err)` is not treated as finished. **Default**: `true`.
  * `readable` {boolean} When set to `false`, the callback will be called when the stream ends even though the stream might still be readable. **Default**: `true`.
  * `writable` {boolean} When set to `false`, the callback will be called when the stream ends even though the stream might still be writable. **Default**: `true`.
* `callback` {Function} A callback function that takes an optional error argument.
* Returns: {Function} A cleanup function which removes all registered listeners.

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

rs.resume(); // Drain the stream.
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
rs.resume(); // Drain the stream.
```

`stream.finished()` leaves dangling event listeners (in particular `'error'`, `'end'`, `'finish'` and `'close'`) after `callback` has been invoked. The reason for this is so that unexpected `'error'` events (due to incorrect stream implementations) do not cause unexpected crashes. If this is unwanted behavior then the returned cleanup function needs to be invoked in the callback:

```js
const cleanup = finished(rs, (err) => {
  cleanup();
  // ...
});
```

### `stream.pipeline(...streams, callback)`
<!-- YAML
added: v10.0.0
-->

* `...streams` {Stream} Two or more streams to pipe between.
* `callback` {Function} Called when the pipeline is fully done.
  * `err` {Error}

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

`stream.pipeline()` will call `stream.destroy(err)` on all streams except:
* `Readable` streams which have emitted `'end'` or `'close'`.
* `Writable` streams which have emitted `'finish'` or `'close'`.

`stream.pipeline()` leaves dangling event listeners on the streams after the `callback` has been invoked. In the case of reuse of streams after failure, this can cause event listener leaks and swallowed errors.

### `stream.Readable.from(iterable, [options])`
<!-- YAML
added: v12.3.0
-->

* `iterable` {Iterable} Object implementing the `Symbol.asyncIterator` or `Symbol.iterator` iterable protocol.
* `options` {Object} Options provided to `new stream.Readable([options])`. By default, `Readable.from()` will set `options.objectMode` to `true`, unless this is explicitly opted out by setting `options.objectMode` to `false`.
* Returns: {stream.Readable}

A utility method for creating Readable Streams out of iterators.

```js
const { Readable } = require('stream');

async function * generate() {
  yield 'hello';
  yield 'streams';
}

const readable = Readable.from(generate());

readable.on('data', (chunk) => {
  console.log(chunk);
});
```

Calling `Readable.from(string)` or `Readable.from(buffer)` will not have the strings or buffers be iterated to match the other streams semantics for performance reasons.

## 流开发人员 API

<!--type=misc-->

`stream` 模块 API 被设计为更容易使用 JavaScript 的原型继承模型来实现流。

首先，流开发人员应声明一个新的 JavaScript 类，该类继承了四种基本流类 (`stream.Writable`, `stream.Readable`, `stream.Duplex`, 或 `stream.Transform`) 之一，且确保他们调用了适合的父类构造函数。
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor({ highWaterMark, ...options }) {
    super({
      highWaterMark,
      autoDestroy: true,
      emitClose: true
    });
    // ...
  }
}
```

When extending streams, keep in mind what options the user can and should provide before forwarding these to the base constructor. For example, if the implementation makes assumptions in regard to the `autoDestroy` and `emitClose` options, do not allow the user to override these. Be explicit about what options are forwarded instead of implicitly forwarding all options.

新的流类必须实现一个或多个特殊的方法，具体取决于被创建的流的类型，正如如下图表所示：

| 用例                | 类               | 需要实现的方法                                                                                                                                                                                                          |
| ----------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 只读                | [`Readable`][]  | [`_read()`](#stream_readable_read_size_1)                                                                                                                                                                        |
| 只写                | [`Writable`][]  | [`_write()`](#stream_writable_write_chunk_encoding_callback_1), [`_writev()`](#stream_writable_writev_chunks_callback), [`_final()`](#stream_writable_final_callback)                                            |
| 读写                | [`Duplex`][]    | [`_read()`](#stream_readable_read_size_1), [`_write()`](#stream_writable_write_chunk_encoding_callback_1), [`_writev()`](#stream_writable_writev_chunks_callback), [`_final()`](#stream_writable_final_callback) |
| 对写入的数据进行操作，然后读取结果 | [`Transform`][] | [`_transform()`](#stream_transform_transform_chunk_encoding_callback), [`_flush()`](#stream_transform_flush_callback), [`_final()`](#stream_writable_final_callback)                                             |

The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). Doing so may lead to adverse side effects in application code consuming the stream.

Avoid overriding public methods such as `write()`, `end()`, `cork()`, `uncork()`, `read()` and `destroy()`, or emitting internal events such as `'error'`, `'data'`, `'end'`, `'finish'` and `'close'` through `.emit()`. Doing so can break current and future stream invariants leading to behavior and/or compatibility issues with other streams, stream utilities, and user expectations.

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

Custom `Writable` streams *must* call the `new stream.Writable([options])` constructor and implement the `writable._write()` and/or `writable._writev()` method.

#### Constructor: `new stream.Writable([options])`<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18438
    description: Add `emitClose` option to specify if `'close'` is emitted on
                 destroy.
  - version: v11.2.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: Add `autoDestroy` option to automatically `destroy()` the
                 stream when it emits `'finish'` or errors.
-->* `options` {Object}
  * `highWaterMark` {number} 当 [`stream.write()`](#stream_writable_write_chunk_encoding_callback) 开始返回 `false` 时的缓冲区级别。 **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} Whether to encode `string`s passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback) to `Buffer`s (with the encoding specified in the [`stream.write()`](#stream_writable_write_chunk_encoding_callback) call) before passing them to [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1). Other types of data are not converted (i.e. `Buffer`s are not decoded into `string`s). Setting to false will prevent `string`s from being converted.  **Default:** `true`.
  * `defaultEncoding` {string} The default encoding that is used when no encoding is specified as an argument to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). **Default:** `'utf8'`.
  * `objectMode` {boolean} [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) 是否为合法操作。 When set, it becomes possible to write JavaScript values other than string, `Buffer` or `Uint8Array` if supported by the stream implementation. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `write` {Function} [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) 方法的实现。
  * `writev` {Function} [`stream._writev()`](#stream_writable_writev_chunks_callback) 方法的实现。
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_writable_destroy_err_callback) method.
  * `final` {Function} Implementation for the [`stream._final()`](#stream_writable_final_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Default:** `false`.
```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // Calls the stream.Writable() constructor.
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

#### `writable._write(chunk, encoding, callback)`<!-- YAML
changes:
  - version: v12.11.0
    pr-url: https://github.com/nodejs/node/pull/29639
    description: _write() is optional when providing _writev().
-->* `chunk` {Buffer|string|any} The `Buffer` to be written, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} 如果数据块为字符串，则 `encoding` 为该字符串的字符编码。 如果数据块为 `Buffer`，或者当流以对象模式运作时，可以忽略 `encoding`。
* `callback` {Function} 对提供的数据块处理结束后调用此函数 (有可选的 error 参数)。

All `Writable` stream implementations must provide a [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) and/or [`writable._writev()`](#stream_writable_writev_chunks_callback) method to send data to the underlying resource.

[`Transform`][] streams provide their own implementation of the [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1).

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

必须调用 `callback` 方法，以发出写入成功结束，或失败并出错的消息。 如果调用失败，则传递给 `callback` 的首个参数必须为 `Error` 对象，如果写入成功，则首个参数为 `null`。

All calls to `writable.write()` that occur between the time `writable._write()` is called and the `callback` is called will cause the written data to be buffered. When the `callback` is invoked, the stream might emit a [`'drain'`][] event. If a stream implementation is capable of processing multiple chunks of data at once, the `writable._writev()` method should be implemented.

If the `decodeStrings` property is explicitly set to `false` in the constructor options, then `chunk` will remain the same object that is passed to `.write()`, and may be a string rather than a `Buffer`. This is to support implementations that have an optimized handling for certain string data encodings. In that case, the `encoding` argument will indicate the character encoding of the string. Otherwise, the `encoding` argument can be safely ignored.

`writable._write()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### `writable._writev(chunks, callback)`

* `chunks` {Object[]} The chunks to be written. 每个数据块都具有如下格式：`{ chunk: ..., encoding: ... }`。
* `callback` {Function} 对提供的数据块处理结束时要调用的回调函数 (具有可选的 error 参数)。

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Writable` class methods only.

The `writable._writev()` method may be implemented in addition or alternatively to `writable._write()` in stream implementations that are capable of processing multiple chunks of data at once. 如果实现了，将会调用该方法并将在写入队列中缓存的所有数据块传递给它。

`writable._writev()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### `writable._destroy(err, callback)`<!-- YAML
added: v8.0.0
-->* `err` {Error} 可能的错误。
* `callback` {Function} A callback function that takes an optional error argument.

`_destroy()` 方法被 [`writable.destroy()`](#stream_writable_destroy_error) 所调用。 It can be overridden by child classes but it **must not** be called directly.

#### `writable._final(callback)`<!-- YAML
added: v8.0.0
-->* `callback` {Function} Call this function (optionally with an error argument) when finished writing any remaining data.

The `_final()` method **must not** be called directly. It may be implemented by child classes, and if so, will be called by the internal `Writable` class methods only.

This optional function will be called before the stream closes, delaying the `'finish'` event until `callback` is called. This is useful to close resources or write buffered data before a stream ends.

#### 写入时错误

Errors occurring during the processing of the [`writable._write()`][], [`writable._writev()`][] and [`writable._final()`][] methods must be propagated by invoking the callback and passing the error as the first argument. Throwing an `Error` from within these methods or manually emitting an `'error'` event results in undefined behavior.

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

#### `new stream.Readable([options])`<!-- YAML
changes:
  - version: v11.2.0
    pr-url: https://github.com/nodejs/node/pull/22795
    description: Add `autoDestroy` option to automatically `destroy()` the
                 stream when it emits `'end'` or errors.
-->* `options` {Object}
  * `highWaterMark` {number} The maximum [number of bytes](#stream_highwatermark_discrepancy_after_calling_readable_setencoding) to store in the internal buffer before ceasing to read from the underlying resource. **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} 如果指定，则会使用指定的编码将缓冲区解码为字符串。 **Default:** `null`.
  * `objectMode` {boolean} 此流是否应以对象流方式运作。 Meaning that [`stream.read(n)`](#stream_readable_read_size) returns a single value instead of a `Buffer` of size `n`. **Default:** `false`.
  * `emitClose` {boolean} Whether or not the stream should emit `'close'` after it has been destroyed. **Default:** `true`.
  * `read` {Function} [`stream._read()`](#stream_readable_read_size_1) 方法的实现。
  * `destroy` {Function} Implementation for the [`stream._destroy()`](#stream_readable_destroy_err_callback) method.
  * `autoDestroy` {boolean} Whether this stream should automatically call `.destroy()` on itself after ending. **Default:** `false`.
```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // Calls the stream.Readable(options) constructor.
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

#### `readable._read(size)`<!-- YAML
added: v0.9.4
-->* `size` {number} 通过异步方式读取的字节数

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

All `Readable` stream implementations must provide an implementation of the `readable._read()` method to fetch data from the underlying resource.

当调用 `readable._read()` 时，如果在资源中有可用数据，该实现应开始使用 [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding) 方法将数据压入到读取队列中。 `_read()` 应继续从资源中读取并推送数据，直到 `readable.push()` 返回 `false` 为止。 当 `_read()` 在停止后再次被调用时，它将会恢复推送额外数据到队列中。

Once the `readable._read()` method has been called, it will not be called again until more data is pushed through the [`readable.push()`](#stream_readable_push_chunk_encoding) method. Empty data such as empty buffers and strings will not cause `readable._read()` to be called.

建议提供 `size` 参数。 在某些实现中， "读取" 是返回数据的单一操作，这时可以使用 `size` 参数来决定有多少数据需要获取。 在其他的实现中，可以忽略此参数，并在数据可用时简单的提供数据。 在调用 [`stream.push(chunk)`](#stream_readable_push_chunk_encoding) 之前，没有必要 "等到" 有 `size` 个字节可用时再进行调用。

`readable._read()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### `readable._destroy(err, callback)`<!-- YAML
added: v8.0.0
-->* `err` {Error} 可能的错误。
* `callback` {Function} A callback function that takes an optional error argument.

`_destroy()` 方法被 [`readable.destroy()`](#stream_readable_destroy_error) 所调用。 It can be overridden by child classes but it **must not** be called directly.

#### `readable.push(chunk[, encoding])`<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->* `chunk` {Buffer|Uint8Array|string|null|any} Chunk of data to push into the read queue. For streams not operating in object mode, `chunk` must be a string, `Buffer` or `Uint8Array`. For object mode streams, `chunk` may be any JavaScript value.
* `encoding` {string} 字符串块的编码。 Must be a valid `Buffer` encoding, such as `'utf8'` or `'ascii'`.
* Returns: {boolean} `true` if additional chunks of data may continue to be pushed; `false` otherwise.

When `chunk` is a `Buffer`, `Uint8Array` or `string`, the `chunk` of data will be added to the internal queue for users of the stream to consume. Passing `chunk` as `null` signals the end of the stream (EOF), after which no more data can be written.

When the `Readable` is operating in paused mode, the data added with `readable.push()` can be read out by calling the [`readable.read()`](#stream_readable_read_size) method when the [`'readable'`][] event is emitted.

When the `Readable` is operating in flowing mode, the data added with `readable.push()` will be delivered by emitting a `'data'` event.

`readable.push()` 方法被设计为尽可能的灵活。 For example, when wrapping a lower-level source that provides some form of pause/resume mechanism, and a data callback, the low-level source can be wrapped by the custom `Readable` instance:

```js
// `_source` is an object with readStop() and readStart() methods,
// and an `ondata` member that gets called when it has data, and
// an `onend` member that gets called when the data is over.

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowLevelSourceObject();

    // Every time there's data, push it into the internal buffer.
    this._source.ondata = (chunk) => {
      // If push() returns false, then stop reading from source.
      if (!this.push(chunk))
        this._source.readStop();
    };

    // When the source ends, push the EOF-signaling `null` chunk.
    this._source.onend = () => {
      this.push(null);
    };
  }
  // _read() will be called when the stream wants to pull more data in.
  // The advisory size argument is ignored in this case.
  _read(size) {
    this._source.readStart();
  }
}
```

The `readable.push()` method is used to push the content into the internal buffer. It can be driven by the `readable._read()` method.

For streams not operating in object mode, if the `chunk` parameter of `readable.push()` is `undefined`, it will be treated as empty string or buffer. See [`readable.push('')`][] for more information.

#### 读取时错误

Errors occurring during processing of the [`readable._read()`][] must be propagated through the [`readable.destroy(err)`](#stream_readable_destroy_err_callback) method. Throwing an `Error` from within [`readable._read()`][] or manually emitting an `'error'` event results in undefined behavior.

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    const err = checkSomeErrorCondition();
    if (err) {
      this.destroy(err);
    } else {
      // Do some work.
    }
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

#### `new stream.Duplex(options)`<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both `Writable` and `Readable` constructors. 同时含有如下字段：
  * `allowHalfOpen` {boolean} If set to `false`, then the stream will automatically end the writable side when the readable side ends. **Default:** `true`.
  * `readableObjectMode` {boolean} Sets `objectMode` for readable side of the stream. Has no effect if `objectMode` is `true`. **Default:** `false`.
  * `writableObjectMode` {boolean} Sets `objectMode` for writable side of the stream. Has no effect if `objectMode` is `true`. **Default:** `false`.
  * `readableHighWaterMark` {number} Sets `highWaterMark` for the readable side of the stream. 如果提供了 `highWaterMark`，则不产生任何作用。
  * `writableHighWaterMark` {number} Sets `highWaterMark` for the writable side of the stream. 如果提供了 `highWaterMark`，则不产生任何作用。
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
    // The underlying source only deals with strings.
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

// All Transform streams are also Duplex Streams.
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // Coerce the chunk to a number if necessary.
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

#### `new stream.Transform([options])`

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

#### Events: `'finish'` and `'end'`

[`'finish'`][] 和 [`'end'`][] 事件分别来自于 `stream.Writable` 类和 `stream.Readable` 类。 当调用了 [`stream.end()`](#stream_writable_end_chunk_encoding_callback)，且 [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) 处理完所有的数据块后会发出 `'finish'` 事件。 在 [`transform._flush()`](#stream_transform_flush_callback) 中的回调函数被调用后，当所有数据输出之后，会发出 `'end'` 事件。

#### `transform._flush(callback)`

* `callback` {Function} A callback function (optionally with an error argument and data) to be called when remaining data has been flushed.

This function MUST NOT be called by application code directly. It should be implemented by child classes, and called by the internal `Readable` class methods only.

在某些情况下，转换操作可能需要在流的尾部发送额外的数据。 例如：`zlib` 压缩流会存储一定量的，用于优化压缩输出的内部状态。 然而，当流结束时，该额外数据需要被刷新，以便完成压缩数据。

Custom [`Transform`][] implementations *may* implement the `transform._flush()` method. This will be called when there is no more written data to be consumed, but before the [`'end'`][] event is emitted signaling the end of the [`Readable`][] stream.

在 `transform._flush()` 的实现中，`readable.push()` 方法可能会被酌情调用零次或多次。 当刷新操作完成时，必须调用 `callback` 函数。

`transform._flush()` 方法具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### `transform._transform(chunk, encoding, callback)`

* `chunk` {Buffer|string|any} The `Buffer` to be transformed, converted from the `string` passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback). If the stream's `decodeStrings` option is `false` or the stream is operating in object mode, the chunk will not be converted & will be whatever was passed to [`stream.write()`](#stream_writable_write_chunk_encoding_callback).
* `encoding` {string} 如果数据块为字符串，则这是编码类型。 If chunk is a buffer, then this is the special value `'buffer'`. Ignore it in that case.
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

#### Class: `stream.PassThrough`

The `stream.PassThrough` class is a trivial implementation of a [`Transform`][] stream that simply passes the input bytes across to the output. 它的主要目的就是用于示例和测试，但在有些情况下 `stream.PassThrough` 可被用做新型流的组成部分。

## 附注<!--type=misc-->### Streams Compatibility with Async Generators and Async Iterators

With the support of async generators and iterators in JavaScript, async generators are effectively a first-class language-level stream construct at this point.

Some common interop cases of using Node.js streams with async generators and async iterators are provided below.

#### Consuming Readable Streams with Async Iterators

```js
(async function() {
  for await (const chunk of readable) {
    console.log(chunk);
  }
})();
```

Async iterators register a permanent error handler on the stream to prevent any unhandled post-destroy errors.

#### Creating Readable Streams with Async Generators

We can construct a Node.js Readable Stream from an asynchronous generator using the `Readable.from()` utility method:

```js
const { Readable } = require('stream');

async function * generate() {
  yield 'a';
  yield 'b';
  yield 'c';
}

const readable = Readable.from(generate());

readable.on('data', (chunk) => {
  console.log(chunk);
});
```

#### Piping to Writable Streams from Async Iterators

In the scenario of writing to a writable stream from an async iterator, ensure the correct handling of backpressure and errors.

```js
const { once } = require('events');
const finished = util.promisify(stream.finished);

const writable = fs.createWriteStream('./file');

(async function() {
  for await (const chunk of iterator) {
    // Handle backpressure on write().
    if (!writable.write(chunk))
      await once(writable, 'drain');
  }
  writable.end();
  // Ensure completion without errors.
  await finished(writable);
})();
```

In the above, errors on `write()` would be caught and thrown by the `once()` listener for the `'drain'` event, since `once()` will also handle the `'error'` event. To ensure completion of the write stream without errors, it is safer to use the `finished()` method as above, instead of using the `once()` listener for the `'finish'` event. Under certain cases, an `'error'` event could be emitted by the writable stream after `'finish'` and as `once()` will release the `'error'` handler on handling the `'finish'` event, it could result in an unhandled error.

Alternatively, the readable stream could be wrapped with `Readable.from()` and then piped via `.pipe()`:

```js
const finished = util.promisify(stream.finished);

const writable = fs.createWriteStream('./file');

(async function() {
  const readable = Readable.from(iterator);
  readable.pipe(writable);
  // Ensure completion without errors.
  await finished(writable);
})();
```

Or, using `stream.pipeline()` to pipe streams:

```js
const pipeline = util.promisify(stream.pipeline);

const writable = fs.createWriteStream('./file');

(async function() {
  const readable = Readable.from(iterator);
  await pipeline(readable, writable);
})();
```<!--type=misc-->### 和旧版本 Node.js 的兼容性<!--type=misc-->Prior to Node.js 0.10, the `Readable` stream interface was simpler, but also less powerful and less useful.

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

  // We add an 'end' listener, but never consume the data.
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Prior to Node.js 0.10, the incoming message data would be simply discarded. However, in Node.js 0.10 and beyond, the socket remains paused forever.

在这种情况下的解决办法就是调用 [`stream.resume()`](#stream_readable_resume) 方法来开始数据流。

```js
// Workaround.
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // Start the flow of data, discarding it.
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

Pushing a zero-byte string, `Buffer` or `Uint8Array` to a stream that is not in object mode has an interesting side effect. Because it *is* a call to [`readable.push()`](#stream_readable_push_chunk_encoding), the call will end the reading process. 然而，由于参数为空字符串，不会有数据被添加到可读缓冲区，这样用户就没有数据可以消费。

### 调用 `readable.setEncoding()` 后 `highWaterMark` 的差异

使用 `readable.setEncoding()` 将会改变 `highWaterMark` 在非对象模式下的运作行为。

Typically, the size of the current buffer is measured against the `highWaterMark` in _bytes_. However, after `setEncoding()` is called, the comparison function will begin to measure the buffer's size in _characters_.

通常情况下，如果编码为 `latin1` 或 `ascii` ，这不会有问题。 但是当处理可能包含多字节字符的字符串时，建议留意这种行为。
