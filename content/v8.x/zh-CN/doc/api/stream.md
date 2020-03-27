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

* [Readable](#stream_class_stream_readable) - 可读取数据的流 (例如：[`fs.createReadStream()`][])。
* [Writable](#stream_class_stream_writable) - 可写入数据的流 (例如：[`fs.createWriteStream()`][])。
* [Duplex](#stream_class_stream_duplex) - 可读写数据的流 (例如：[`net.Socket`][])。
* [Transform](#stream_class_stream_transform) - 在读写过程中可更改或转换数据的 Duplex 流 (例如：[`zlib.createDeflate()`][])。

### 对象模式

由 Node.js API 创建的所有流都只适用于字符串和 `Buffer` (或 `Uint8Array`) 对象。 然而，对于流的实现，仍有可能和其他类型的 JavaScript 值 (不包含 `null`，其在流中具有特殊用途) 协同工作。 这些流会以 “对象模式” 进行操作。

在创建流时，使用 `objectMode` 选项会将流实例切换到对象模式。 尝试将现有流切换到对象模式是不安全的。

### 缓冲

<!--type=misc-->

[Writable](#stream_class_stream_writable) 和 [Readable](#stream_class_stream_readable) 的流都会将数据保存到内部缓冲区，该缓冲区可分别使用 `writable._writableState.getBuffer()` 或 `readable._readableState.buffer` 进行访问。

可能被缓冲的数据量要取决于传递给流构造函数的 `highWaterMark` 选项。 对于正常的流，`highWaterMark` 选项指定了 [字节总数](#stream_highwatermark_discrepancy_after_calling_readable_setencoding)。 对于以对象模式操作的流，`highWaterMark` 指定了对象总数。

当其实现调用 [`stream.push(chunk)`](#stream_readable_push_chunk_encoding) 时，数据将在 Readable 流中缓冲。 如果流的消费者没有调用 [`stream.read()`](#stream_readable_read_size)，数据将会一直处于内部队列中，直到它被消费为止。

一旦内部读取缓冲区的总大小达到 `highWaterMark` 指定的阈值，该流会暂时停止从底层资源中读取数据，直到当前被缓存的数据被消费为止 (这就是说，流会停止调用内部的 `readable._read()` 方法来填充读取缓冲区)。

当 [`writable.write(chunk)`](#stream_writable_write_chunk_encoding_callback) 方法被重复调用时，数据被缓冲到 Writable 流中。 当内部写入缓冲区的总大小低于由 `highWaterMark` 设定的阈值时，对 `writable.write()` 的调用将会返回 `true`。 一旦内部缓冲区的大小达到或超过 `highWaterMark`，将会返回 `false`。

`stream` API，尤其是 [`stream.pipe()`] 方法的一个关键目标就是，将数据的缓冲限制在可接受的水平，以便不同速度的源和目标流不会过度消耗可用内存。

由于 [Duplex](#stream_class_stream_duplex) 和 [Transform](#stream_class_stream_transform) 都是 Readable 且 Writable 的流，所以它们各自维护 *两个* 独立的内部读写缓冲区，这样就使得它们在维护适当和高效的数据流时，读取和写入操作可以各自独立运作。 For example, [`net.Socket`][] instances are [Duplex](#stream_class_stream_duplex) streams whose Readable side allows consumption of data received *from* the socket and whose Writable side allows writing data *to* the socket. 因为相比于收到的数据，写入端的数据可能会以更快或较慢的速度写入到套接字，所以读取和写入端的彼此独立操作 (和缓冲) 就变得很重要了。

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

  // the end event indicates that the entire body has been received
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

[Writable](#stream_class_stream_writable) 流 (例如示例中的 `res`) 暴露了像 `write()` 和 `end()` 这样的将数据写入流的方法。

当数据可从流中读取时，[Readable](#stream_class_stream_readable) 流使用 [`EventEmitter`][] API 来通知应用程序代码。 可用的数据可通过多种方式从流中读取。

[Writable](#stream_class_stream_writable) 和 [Readable](#stream_class_stream_readable) 流都使用 [`EventEmitter`][] API，并以不同方式和当前流的状态通信。

[Duplex](#stream_class_stream_duplex) 和 [Transform](#stream_class_stream_transform) 流都是既 [Writable](#stream_class_stream_writable) 也 [Readable](#stream_class_stream_readable) 的。

向流中写入数据或消费数据的应用程序不需要直接实现 stream 接口，因此在一般情况下没有必要调用 `require('stream')`。

希望实现新类型的流的开发人员可以参考 [流开发人员 API](#stream_api_for_stream_implementers) 部分。

### 可写入的流

可写入的流是可将数据写入的 *目标* 的一个抽象。

[Writable](#stream_class_stream_writable) 流的示例包括：

* [客户端的 HTTP 请求](http.html#http_class_http_clientrequest)
* [服务器端的 HTTP 响应](http.html#http_class_http_serverresponse)
* [fs 的写入流](fs.html#fs_class_fs_writestream)
* [zlib 流](zlib.html)
* [crypto 流](crypto.html)
* [TCP 套接字](net.html#net_class_net_socket)
* [子进程 stdin](child_process.html#child_process_subprocess_stdin)
* [`process.stdout`][], [`process.stderr`][]

*注意*：这些例子中的部分实际上是实现了 [Writable](#stream_class_stream_writable) 接口的 [Duplex](#stream_class_stream_duplex) 流。

所有 [Writable](#stream_class_stream_writable) 流实现了由 `stream.Writable` 类定义的接口。

尽管 [Writable](#stream_class_stream_writable) 流的具体实例可能会有所差别，但所有的 Writable 流都遵循相同的基本使用模式，正如下面示例所示：

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
-->

当流及其底层的资源 (例如：文件描述符) 被关闭时，会发出 `'close'` 事件。 该事件表明将不会触发更多事件，也不会发生进一步的计算。

不是所有的 Writable 流都会发出 `'close'` 事件。

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

*注意*：当发出 `'error'` 事件时，流尚未被关闭。

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
  console.error('All writes are now complete.');
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
  console.error('something is piping into the writer');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### 事件：'unpipe'
<!-- YAML
added: v0.9.4
-->

* `src` {stream.Readable} 被 [unpiped][`stream.unpipe()`] 可写流管道的来源流

当在一个 [Readable](#stream_class_stream_readable) 流上调用 [`stream.unpipe()`][] 方法，且将此 [Writable](#stream_class_stream_writable) 流从目的地集合中移除时，会发出 `'unpipe'` 事件。

This is also emitted in case this [Writable](#stream_class_stream_writable) stream emits an error when a [Readable](#stream_class_stream_readable) stream pipes into it.

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.error('Something has stopped piping into the writer.');
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

##### writable.end(\[chunk\]\[, encoding\][, callback])
<!-- YAML
added: v0.9.4
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {string|Buffer|Uint8Array|any} 可选的要写入的数据。 对于没有以对象模式运作的流，`chunk` 可能是一个字符串，`Buffer`，或者 `Uint8Array`。 对于对象模式的流，`chunk` 可以是任何 JavaScript 值，但不能为 `null`。
* `encoding` {string} 当 `chunk` 为字符串时的编码
* `callback` {Function} 可选的当流结束时的回调函数

调用 `writable.end()` 方法表明没有更多数据会被写入到 [Writable](#stream_class_stream_writable) 流。 可选的 `chunk` 和 `encoding` 参数允许在关闭流之前再写入最后一个额外的数据块。 如果提供了这两个参数，`callback` 函数会作为监听器添加到 [`'finish'`][] 事件。

在调用 [`stream.end()`](#stream_writable_end_chunk_encoding_callback) 后调用 [`stream.write()`](#stream_writable_write_chunk_encoding_callback) 方法会引发错误。

```js
// write 'hello, ' and then end with 'world!'
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

`writable.setDefaultEncoding()` 方法为 [Writable](#stream_class_stream_writable) 流设置默认的 `encoding`。

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

如果在一个流上对 [`writable.cork()`][] 方法进行多次调用，则必须对 `writable.uncork()` 进行同样次数的调用，以刷新缓冲的数据。

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

##### writable.writableHighWaterMark
<!-- YAML
added: v8.10.0
-->

返回在构造此 `Writable` 流时传入的 `highWaterMark` 值。

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

当流尚未被排空时，调用 `write()` 将会缓冲 `chunk`，并返回 false。 一旦所有当前缓冲的数据块被排空 (被操作系统接受并传输)，将会发出 `'drain'` 事件。 建议一旦 write() 返回 false，在发出 `'drain'` 事件之前，不应再写入任何数据块。 当允许在一个尚未排空的流上调用 `write()` 时，Node.js 将会缓冲所有被写入的数据块，直到达到最大内存占用，这时它会无条件终止。 甚至在其终止之前，高内存占用会导致垃圾回收器的性能变差及过高的 RSS (即使内存不再需要时，通常也不会被释放回系统)。 如果远程对等方不读取数据，TCP 套接字永不会排空，因此向一个不会排空的套接字写入可能会导致可被远程利用的漏洞。

当流不排空时写入数据所导致的问题对于 [Transform](#stream_class_stream_transform) 而言尤为严重，这是因为 `Transform` 流在默认情况下会被暂停，直到它们被连入管道，或者当 `'data'` 或 `'readable'` 事件处理程序被添加为止。

如果将被写入的数据可以按需生成或获取，则建议将逻辑封装到 [Readable](#stream_class_stream_readable) 中，并使用 [`stream.pipe()`][]。 然而，如果要优先调用 `write()`，则可以通过使用 [`'drain'`][] 事件来顾及背压 (backpressure)，并避免和内存相关的问题。

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
  console.log('write completed, do more writes now');
});
```

对象模式的 Writable 流会一直忽略 `encoding` 参数。

##### writable.destroy([error])
<!-- YAML
added: v8.0.0
-->

* 返回：{this}

销毁流，并发出接收的错误。 在此调用后，可写入数据的流已结束。 实现者不应重写此方法，而是实现 [`writable._destroy`](#stream_writable_destroy_err_callback)。

### Readable 流

Readable 流是对提供可供消费数据的 *来源* 的一种抽象。

Readable 流的示例包括：

* [客户端的 HTTP 响应](http.html#http_class_http_incomingmessage)
* [服务器端的 HTTP 请求](http.html#http_class_http_incomingmessage)
* [fs 读取流](fs.html#fs_class_fs_readstream)
* [zlib 流](zlib.html)
* [crypto 流](crypto.html)
* [TCP 套接字](net.html#net_class_net_socket)
* [子进程 stdout 和 stderr](child_process.html#child_process_subprocess_stdout)
* [`process.stdin`][]

所有的 [Readable](#stream_class_stream_readable) 流都实现了由 `stream.Readable` 类定义的接口。

#### 两种模式

Readable 流以两种模式之一运作：流动模式 (flowing) 和 暂停模式 (paused)。

当处于流动模式时，数据从底层系统中自动读取，并通过 [`EventEmitter`][] 接口来使用事件，从而为应用程序尽量快的提供数据。

当处于暂停模式时，必须显式调用 [`stream.read()`](#stream_readable_read_size) 方法从流中读取数据块。

所有 [Readable](#stream_class_stream_readable) 流都开始于暂停模式，并通过以下方法切换到流动模式：

* 添加一个 [`'data'`][] 事件处理程序。
* 调用 [`stream.resume()`](#stream_readable_resume) 方法。
* 调用 [`stream.pipe()`][] 方法发送数据给 [Writable](#stream_class_stream_writable) 流。

Readable 流可通过如下方法切换回暂停模式：

* 如果未指定管道目的地，则调用 [`stream.pause()`](#stream_readable_pause) 方法。
* If there are pipe destinations, by removing all pipe destinations. Multiple pipe destinations may be removed by calling the [`stream.unpipe()`][] method.

一个需要记住的重要概念就是：在提供了消费或忽略数据的机制之前，Readable 流不会产生数据。 如果消费机制被禁用或移除，Readable 流将会 *尝试* 停止生成数据。

*Note*: For backwards compatibility reasons, removing [`'data'`][] event handlers will **not** automatically pause the stream. 同时，如果有管道目的地，则在那些目的地排空并请求更多数据时，调用 [`stream.pause()`](#stream_readable_pause) 将不会保证流 *保持* 暂停。

*注意*：如果一个 [Readable](#stream_class_stream_readable) 流被切换为流动模式，同时没有能处理数据的可用消费者，数据将会丢失。 例如，当 `readable.resume()` 方法被调用，且在 `'data'` 事件中没有附加的监听器时，或者从流中移除 `'data'` 事件处理程序时，这种情况将会发生。

#### 三种状态

Readable 流的 "两种模式" 操作是对在 Readable 流的实现中，更为复杂的内部状态管理的简化抽象。

尤其特殊的是，在任意给定的时间点，每一个 Readable 流都处于以下三种状态之一：

* `readable._readableState.flowing = null`
* `readable._readableState.flowing = false`
* `readable._readableState.flowing = true`

当 `readable._readableState.flowing` 的值为 `null` 时，不会提供消耗流数据的机制，因此流不会生成其数据。 当处于这个状态时，为 `'data'` 事件附加监听器，调用 `readable.pipe()` 方法，或调用 `readable.resume()` 方法，将会把 `readable._readableState.flowing` 的值切换为 `true`，从而导致在生成数据时，Readable 流会开始主动发出事件。

调用 `readable.pause()`，`readable.unpipe()`，或接收 "背压" 时，将会导致 `readable._readableState.flowing` 的值被设置为 `false`，并会临时暂停事件流动，但 *不会* 停止生成数据。 当处于这个状态时，为 `'data'` 事件附加监听器将不会导致 `readable._readableState.flowing` 的值被切换为 `true`。

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// flowing is now false

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // will not emit 'data'
pass.resume(); // must be called to make 'data' being emitted
```

当 `readable._readableState.flowing` 的值为 `false` 时，数据可能会堆积在流的内部缓冲区中。

#### 选择一种方法

Readable 流 API 在不同的 Node.js 版本中不断演化，并提供了消费流数据的多种方法。 In general, developers should choose *one* of the methods of consuming data and *should never* use multiple methods to consume data from a single stream.

对于大多数用户而言，建议使用 `readable.pipe()` 方法，其原因在于该方法的实现提供了消费流数据的最简易方式。 需要对数据传输和生成进行细粒度控制的开发人员可以使用 [`EventEmitter`][] 和 `readable.pause()`/`readable.resume()` API。

#### 类：stream.Readable
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

##### 事件：'close'
<!-- YAML
added: v0.9.4
-->

当流及其底层的资源 (例如：文件描述符) 被关闭时，会发出 `'close'` 事件。 该事件表明将不会触发更多事件，也不会发生进一步的计算。

并非所有 [Readable](#stream_class_stream_readable) 流会发出 `'close'` 事件。

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

*注意*：在数据被完全消费之前，**不会发出** `'end'` 事件。 要想发出此事件，可以将流切换到流动模式，或重复调用 [`stream.read()`](#stream_readable_read_size) ，直到所有数据都被消费了为止。

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

`'error'` 事件可由实现 Readable 的流在任何时候发出。 通常情况下，当由于底层内部错误导致底层流无法生成数据，或当流的实现试图推送无效的数据块时，会发出 'error' 事件。

监听器回调函数会接收一个 `Error` 对象。

##### 事件：'readable'
<!-- YAML
added: v0.9.4
-->

当流中有数据可读取时，会发出 `'readable'` 事件。 在有些情况下，为 `'readable'` 事件附加监听器将会导致一些数据被读取到内部缓冲区。

```javascript
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  // there is some data to read now
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

*注意*：一般而言，`readable.pipe()` 和 `'data'` 事件机制比 `'readable'` 事件更容易理解。 但是，处理 `'readable'` 事件可能会导致吞吐量增加。

##### readable.isPaused()
<!-- YAML
added: v0.11.14
-->

* 返回：{boolean}

`readable.isPaused()` 方法返回 Readable 的当前运作状态。 它主要被 `readable.pipe()` 方法的底层机制所使用。 在大多数典型情况下，没有理由直接使用这个方法。

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

##### readable.pipe(destination[, options])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 写入数据的目的地
* `options` {Object} Pipe options
  * `end` {boolean} 当读取器结束时，结束写入器。 **Default:** `true`.

`readable.pipe()` 方法会将一个 [Writable](#stream_class_stream_writable) 流附加到 `readable`，并将导致它会自动切换到流动模式，同时将其所有数据推送到附加的 [Writable](#stream_class_stream_writable)。 数据流将被自动管理，这样即使 Readable 流的速度更快，目的地 Writable 流也不会超负荷。

如下示例通过管道将 `readable` 中的所有数据传输到名为 `file.txt` 的文件。

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt'
readable.pipe(writable);
```
可以将多个 Writable 流附加到一个 Readable 流上。

`readable.pipe()` 方法返回一个 *destination* 流的引用，这就使得可以建立链式管道流：

```js
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

默认情况下，当来源 Readable 流发出 [`'end'`][] 事件时，目的地 Writable 流会调用 [`stream.end()`](#stream_writable_end_chunk_encoding_callback)。这样目的地将不再可写。 要想禁用此默认行为，应将 `end` 选项设置为 `false`，这样就会导致目的地流保持开启，正如如下示例所示：

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('Goodbye\n');
});
```

一个重要的警告就是，在处理过程中如果 Readable 流发出错误，Writable 目的地 *不会自动被关闭*。 如果发生错误，就有必要 *手动* 关闭每一个流，以防止内存泄漏。

*注意*：无论指定的选项如何，[`process.stderr`][] 和 [`process.stdout`][] Writable 流从不会被关闭，直到 Node.js 进程退出为止。

##### readable.readableHighWaterMark
<!-- YAML
added: v8.10.0
-->

返回构造此 `Readable` 时传入的 `highWaterMark` 值。

##### readable.read([size])
<!-- YAML
added: v0.9.4
-->

* `size` {number} 指定要读取数据量的可选参数。
* 返回：{string|Buffer|null}

`readable.read()` 方法从内部缓冲区拉取并返回一些数据。 如果没有可读数据，则返回 `null`。 默认情况下会以 `Buffer` 对象的形式返回，除非已通过 `readable.setEncoding()` 方法指定编码或流以对象模式运作。

可选的 `size` 参数指定了要读取的特定字节数。 如果 `size` 个字节不可读，则返回 `null`，*除非* 流已到末尾，在这种情况下，在内部缓冲区保留的数据将被返回。

如果未指定 `size` 参数，则内部缓冲区中的所有数据将被返回。

`readable.read()` 方法应仅对以暂停模式运作的 Readable 流调用。 在流动模式下，在内部缓冲区被完全排空之前，`readable.read()` 将被自动调用。

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`Received ${chunk.length} bytes of data.`);
  }
});
```

以对象模式运作的 Readable 流，无论 `size` 参数的值如何，会一直从对 [`readable.read(size)`](#stream_readable_read_size) 的调用返回单一项目。

*注意*：如果 `readable.read()` 方法返回一个数据块，也会发出 `'data'` 事件。

*注意*：在 [`'end'`][] 事件结束后调用 [`stream.read([size])`](#stream_readable_read_size) 将会返回 `null`。 不会抛出运行时错误。

##### readable.resume()
<!-- YAML
added: v0.9.4
-->

* 返回：{this}

`readable.resume()` 方法会导致以显式方式暂停的 Readable 流会恢复发出 [`'data'`][] 事件，并将流切换到流动模式。

正如如下示例所示，`readable.resume()` 方法可被用于完全消费流中的数据，而无需对数据进行任何处理。

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('Reached the end, but did not read anything.');
  });
```

##### readable.setEncoding(encoding)
<!-- YAML
added: v0.9.4
-->

* `encoding` {string} 要使用的编码。
* 返回：{this}

`readable.setEncoding()` 方法为从 Readable 流读取的数据设置字符编码。

默认情况下，不会分配编码，同时流数据会以 `Buffer` 对象的方式返回。 设置编码会导致流数据将以指定编码的字符串，而不是 `Buffer` 对象的方式返回。 例如：调用 `readable.setEncoding('utf8')` 将会导致输出数据以 UTF-8 数据的形式解析，并以字符串的方式传递。 调用 `readable.setEncoding('hex')` 将会导致数据以十六进制字符串格式编码。

Readable 流将会正确处理在流中传递的多字节字符，如果只是以 `Buffer` 对象的形式拉取流中数据则会导致它不能被正确解码。

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('got %d characters of string data', chunk.length);
});
```

##### readable.unpipe([destination])
<!-- YAML
added: v0.9.4
-->

* `destination` {stream.Writable} 可选的将要从管道中移除的流

`readable.unpipe()` 方法将之前用 [`stream.pipe()`][] 方法附加的 Writable 流断开。

如未指定 `destination`，则会断开 *所有* 管道。

如果指定了 `destination`，但没有为其设定管道，则此方法不执行任何操作。

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// All the data from readable goes into 'file.txt',
// but only for the first second
readable.pipe(writable);
setTimeout(() => {
  console.log('Stop writing to file.txt');
  readable.unpipe(writable);
  console.log('Manually close the file stream');
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

*注意*：在发出 [`'end'`][] 事件后，不能调用 `stream.unshift(chunk)`，否则会抛出运行时错误。

经常使用 `stream.unshift()` 的开发人员应该考虑改为使用 [Transform](#stream_class_stream_transform) 流。 请参阅 [流开发人员 API](#stream_api_for_stream_implementers) 部分以获取更多信息。

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
        // remove the readable listener before unshifting
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

*Note*: Unlike [`stream.push(chunk)`](#stream_readable_push_chunk_encoding), `stream.unshift(chunk)` will not end the reading process by resetting the internal reading state of the stream. 如果在读取 (例如：在自定义流中的 [`stream._read()`](#stream_readable_read_size_1) 实现) 时调用了 `readable.unshift()`，将会导致不可预料的结果。 在调用 `readable.unshift()` 后立即调用 [`stream.push('')`](#stream_readable_push_chunk_encoding) 将会正确的重置读取状态，但最好的办法就是在读取过程中避免调用 `readable.unshift()`。

##### readable.wrap(stream)
<!-- YAML
added: v0.9.4
-->

* `stream` {Stream} "旧式" 可读流

Node.js v0.10 之前的版本没有实现当前版本定义的 `stream` 模块的全部 API。 (请参阅 [兼容性](#stream_compatibility_with_older_node_js_versions) 以获取更多信息。)

当使用一个可以发出 [`'data'`][] 事件，且具有 [`stream.pause()`](#stream_readable_pause) 方法的旧版本 Node.js 库时，作为参考，可以使用 `readable.wrap()` 方法来创建一个 [Readable](#stream_class_stream_readable) 流，该流会使用旧的流作为其数据源。

很少需要使用 `readable.wrap()` ，但仍旧提供了该方法，以便于和旧的 Node.js 应用程序及库进行交互。

例如：

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // etc.
});
```

##### readable.destroy([error])
<!-- YAML
added: v8.0.0
-->

销毁流并发出 `'error'` 事件。 在此调用后，可读流将会释放所有内部资源。 实现者不应重写此方法，而应实现 [`readable._destroy`](#stream_readable_destroy_err_callback)。

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

Duplex 流是实现了 [Readable](#stream_class_stream_readable) 和 [Writable](#stream_class_stream_writable) 接口的流。

Duplex 流的例子包括：

* [TCP 套接字](net.html#net_class_net_socket)
* [zlib 流](zlib.html)
* [crypto 流](crypto.html)

#### 类：stream.Transform
<!-- YAML
added: v0.9.4
-->

<!--type=class-->

Transform 流是输出和输入以某种方式关联的 [Duplex](#stream_class_stream_duplex) 流。 就像所有 [Duplex](#stream_class_stream_duplex) 流一样，Transform 流实现了 [Readable](#stream_class_stream_readable) 和 [Writable](#stream_class_stream_writable) 接口。

Transform 流的例子包括：

* [zlib 流](zlib.html)
* [crypto 流](crypto.html)

##### transform.destroy([error])
<!-- YAML
added: v8.0.0
-->

销毁流并发出 `'error'` 事件。 在此调用之后，转换流会释放任何内部资源。 实现者不应重写此方法，而应实现 [`readable._destroy`](#stream_readable_destroy_err_callback)。 `Transform` 中默认的 `_destroy` 实现也会发出 `'close'` 事件。

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

<table>
  <thead>
    <tr>
      <th>
        <p>用例</p>
      </th>
      <th>
        <p>类</p>
      </th>
      <th>
        <p>需要实现的方法</p>
      </th>
    </tr>
  </thead>
  <tr>
    <td>
      <p>只读</p>
    </td>
    <td>
      <p>[Readable](#stream_class_stream_readable)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>只写</p>
    </td>
    <td>
      <p>[Writable](#stream_class_stream_writable)</p>
    </td>
    <td>
      <p><code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>读写</p>
    </td>
    <td>
      <p>[Duplex](#stream_class_stream_duplex)</p>
    </td>
    <td>
      <p><code>[_read][stream-_read]</code>, <code>[_write][stream-_write]</code>, <code>[_writev][stream-_writev]</code>, <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
  <tr>
    <td>
      <p>对写入的数据进行操作，然后读取结果</p>
    </td>
    <td>
      <p>[Transform](#stream_class_stream_transform)</p>
    </td>
    <td>
      <p><code>[_transform][stream-_transform]</code>, <code>[_flush][stream-_flush]</code>, <code>[_final][stream-_final]</code></p>
    </td>
  </tr>
</table>

*Note*: The implementation code for a stream should *never* call the "public" methods of a stream that are intended for use by consumers (as described in the [API for Stream Consumers](#stream_api_for_stream_consumers) section). 这样做的后果就会导致在消费流的应用程序代码中的副作用。

### 简化的构建
<!-- YAML
added: v1.2.0
-->

在很多简单的情况下，可以不依赖继承来构建流。 这可以通过直接创建 `stream.Writable`, `stream.Readable`, `stream.Duplex` 或 `stream.Transform` 的实例，并将适合的方法作为构造函数选项传递。

例如：

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### 实现一个 Writable 流

`stream.Writable` 类继承并实现了 [Writable](#stream_class_stream_writable) 流。

自定义 Writable 流 *必须* 调用 `new stream.Writable([options])` 构造器，并实现 `writable._write()` 方法。 还 *可以* 实现 `writable._writev()` 方法。

#### 构造器：new stream.Writable([options])

* `options` {Object}
  * `highWaterMark` {number} 当 [`stream.write()`](#stream_writable_write_chunk_encoding_callback) 开始返回 `false` 时的缓冲区级别。 **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `decodeStrings` {boolean} 在传递给 [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) 之前，是否将字符串解码到缓冲区。 **Default:** `true`.
  * `objectMode` {boolean} [`stream.write(anyObj)`](#stream_writable_write_chunk_encoding_callback) 是否为合法操作。 如果流的实现支持，则当被设置时，就可能写入 JavaScript 值，而不是字符串，`Buffer` 或 `Uint8Array`。 **默认:** `false`.
  * `write` {Function} [`stream._write()`](#stream_writable_write_chunk_encoding_callback_1) 方法的实现。
  * `writev` {Function} [`stream._writev()`](#stream_writable_writev_chunks_callback) 方法的实现。
  * `destroy` {Function} [`stream._destroy()`](#stream_writable_destroy_err_callback) 方法的实现。
  * `final` {Function} [`stream._final()`](#stream_writable_final_callback) 方法的实现。

例如：

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

* `chunk` {Buffer|string|any} 将被写入的数据块。 将会 **一直** 是缓冲区，除非 `decodeStrings` 选项被设置为 `false`，或当流以对象模式运作时。
* `encoding` {string} 如果数据块为字符串，则 `encoding` 为该字符串的字符编码。 如果数据块为 `Buffer`，或者当流以对象模式运作时，可以忽略 `encoding`。
* `callback` {Function} 对提供的数据块处理结束后调用此函数 (有可选的 error 参数)。

所有 Writable 流的实现都必须提供一个 [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) 方法来将数据发送给底层资源。

*注意*：[Transform](#stream_class_stream_transform) 流提供了它们自己的 [`writable._write()`](#stream_writable_write_chunk_encoding_callback_1) 实现。

*注意*：此函数不能由应用程序代码直接调用。 它应由子类实现，且仅被内部 Writable 类的方法调用。

必须调用 `callback` 方法，以发出写入成功结束，或失败并出错的消息。 如果调用失败，则传递给 `callback` 的首个参数必须为 `Error` 对象，如果写入成功，则首个参数为 `null`。

在调用 `writable._write()` 和 `callback` 之间，所有对 `writable.write()` 的调用将会导致将被写入的数据被缓存。 When the `callback` is invoked, the stream might emit a [`'drain'`][] event. 如果流的实现有能力一次性处理多块数据，则应实现 `writable._writev()` 方法。

如果在构造函数的选项中设定了 `decodeStrings` 属性，则 `chunk` 可以是字符串，而不是 Buffer，`encoding` 则是字符串的字符编码。 这是为支持一些能对某些特定字符数据编码进行优化处理的实现。 如果 `decodeStrings` 属性被显式设定为 `false`，就可以安全的忽略 `encoding` 参数，`chunk` 会保留传递给 `.write()` 的同样对象。

`writable._write()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### writable.\_writev(chunks, callback)

* `chunks` {Array} 将被写入的数据块。 每个数据块都具有如下格式：`{ chunk: ..., encoding: ... }`。
* `callback` {Function} 对提供的数据块处理结束时要调用的回调函数 (具有可选的 error 参数)。

*注意*：此函数不能由应用程序代码直接调用。 它应由子类实现，且仅被内部 Writable 类的方法调用。

在具有一次性处理多块数据能力的流的实现中，除了实现 `writable._write()` 之外，还应实现 `writable._writev()` 方法。 如果实现了，将会调用该方法并将在写入队列中缓存的所有数据块传递给它。

`writable._writev()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### writable.\_destroy(err, callback)
<!-- YAML
added: v8.0.0
-->

* `err` {Error} 可能的错误。
* `callback` {Function} 具有可选 error 参数的回调函数。

`_destroy()` 方法被 [`writable.destroy()`](#stream_writable_destroy_error) 所调用。 It can be overridden by child classes but it **must not** be called directly.

#### writable.\_final(callback)
<!-- YAML
added: v8.0.0
-->

* `callback` {Function} 结束写入任何剩余数据时调用此函数 (具有可选的 error 参数)。

`_final()` 方法 **不能** 被直接调用。 它可被子类实现，如果是这样，它仅被内部 Writable 类的方法调用。

在流关闭前，此可选函数将被调用，它将会延迟 `finish` 事件，直到 `callback` 被调用为止。 这将有助于在流结束前关闭资源并将已缓存数据写入。

#### 写入时错误

建议对于在 `writable._write()` 和 `writable._writev()` 方法处理过程中发生的错误，应通过调用回调函数报告，并将错误作为首个参数传递。 这将导致 Writable 流发出一个 `'error'` 事件。 在 `writable._write()` 中抛出 Error 将会导致不可预料和不一致的行为，具体取决于流是如何被使用的。 使用回调函数能确保一致且可预测的错误处理。

If a Readable stream pipes into a Writable stream when Writable emits an error, the Readable stream will be unpiped.

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

如下演示了一个相当简单 (也有点毫无意义) 的自定义 Writable 流的实现。 虽然这个特定的 Writable 流实例并没有任何实际用途，但示例中演示了自定义 [Writable](#stream_class_stream_writable) 流实例中的每个所需元素：

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    super(options);
    // ...
  }

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

解码缓冲区是一个通用任务，例如，当使用输入为字符串的转换器时。 当使用多字节字符编码，例如 UTF-8 时，这个过程并不简单。 如下示例展示了当使用 `StringDecoder` 和 [Writable](#stream_class_stream_writable) 时，如何解码多字节字符串。

```js
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

class StringWritable extends Writable {
  constructor(options) {
    super(options);
    const state = this._writableState;
    this._decoder = new StringDecoder(state.defaultEncoding);
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

`stream.Readable` 类继承并实现了 [Readable](#stream_class_stream_readable) 流。

Custom Readable streams *must* call the `new stream.Readable([options])` constructor and implement the `readable._read()` method.

#### new stream.Readable([options])

* `options` {Object}
  * `highWaterMark` {number} 在停止从底层资源中读取之前，能存储在内部缓冲区中的最大 [字节数](#stream_highwatermark_discrepancy_after_calling_readable_setencoding)。 **Default:** `16384` (16kb), or `16` for `objectMode` streams.
  * `encoding` {string} 如果指定，则会使用指定的编码将缓冲区解码为字符串。 **Default:** `null`.
  * `objectMode` {boolean} 此流是否应以对象流方式运作。 这就意味着 [`stream.read(n)`](#stream_readable_read_size) 返回单个值，而不是大小为 n 的 Buffer。 **默认:** `false`.
  * `read` {Function} [`stream._read()`](#stream_readable_read_size_1) 方法的实现。
  * `destroy` {Function} [`stream._destroy()`](#stream_readable_destroy_err_callback) 方法的实现。

例如：

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

#### readable.\_read(size)

* `size` {number} 通过异步方式读取的字节数

*注意*：此函数不能由应用程序代码直接调用。 它应由子类实现，且仅被内部 Readable 类的方法调用。

所有 Readable 流的实现都必须提供 `readable._read()` 方法的实现，以便从底层资源中获取数据。

当调用 `readable._read()` 时，如果在资源中有可用数据，该实现应开始使用 [`this.push(dataChunk)`](#stream_readable_push_chunk_encoding) 方法将数据压入到读取队列中。 `_read()` 应继续从资源中读取并推送数据，直到 `readable.push()` 返回 `false` 为止。 当 `_read()` 在停止后再次被调用时，它将会恢复推送额外数据到队列中。

*Note*: Once the `readable._read()` method has been called, it will not be called again until the [`readable.push()`](#stream_readable_push_chunk_encoding) method is called.

建议提供 `size` 参数。 在某些实现中， "读取" 是返回数据的单一操作，这时可以使用 `size` 参数来决定有多少数据需要获取。 在其他的实现中，可以忽略此参数，并在数据可用时简单的提供数据。 在调用 [`stream.push(chunk)`](#stream_readable_push_chunk_encoding) 之前，没有必要 "等到" 有 `size` 个字节可用时再进行调用。

`readable._read()` 具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### readable.\_destroy(err, callback)
<!-- YAML
added: v8.0.0
-->

* `err` {Error} 可能的错误。
* `callback` {Function} 具有可选 error 参数的回调函数。

`_destroy()` 方法被 [`readable.destroy()`](#stream_readable_destroy_error) 所调用。 It can be overridden by child classes but it **must not** be called directly.

#### readable.push(chunk[, encoding])
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11608
    description: The `chunk` argument can now be a `Uint8Array` instance.
-->

* `chunk` {Buffer|Uint8Array|string|null|any} 要压入读取队列的数据块。 对于以非对象模式运作的流，`chunk` 必须为字符串, `Buffer` 或 `Uint8Array`。 对于对象模式的流，`chunk` 可以是任何 JavaScript 值。
* `encoding` {string} 字符串块的编码。 必须是一个有效的 Buffer 编码，例如：`'utf8'` 或 `'ascii'`
* 返回：{boolean} 如果额外的数据块可用被继续压入，则返回 `true`；否则返回 `false`。

当 `chunk` 是一个 `Buffer`, `Uint8Array` 或 `字符串` 时，`chunk` 参数中的数据将被添加到内部队列，以便流用户可以消费。 如果把 `null` 传递给 `chunk` 参数就传递了流结尾 (EOF) 的信号，之后数据不能再被写入。

当 Readable 流以暂停模式运作时，在发出 [`'readable'`][] 事件时，通过 `readable.push()` 添加的数据可以通过调用 [`readable.read()`](#stream_readable_read_size) 方法来读取。

当 Readable 流以流动模式运作时，通过 `readable.push()` 添加的数据可以通过发出 `'data'` 事件来传递。

`readable.push()` 方法被设计为尽可能的灵活。 例如：当包装一个提供某种形式的暂停/继续机制的较低级别的源及数据回调函数时，低级别源可由自定义的 Readable 实例来包装，正如如下例子所示：

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
*注意*：`readable.push()` 方法应仅由 Readable 流的实现者调用，且仅在 `readable._read()` 方法中被调用。

For streams not operating in object mode, if the `chunk` parameter of `readable.push()` is `undefined`, it will be treated as empty string or buffer. See [`readable.push('')`][] for more information.

#### 读取时错误

建议在 `readable._read()` 方法的处理过程中发生的错误应使用 `'error'` 事件进行发送，而不是将错误抛出。 在 `readable._read()` 中抛出错误会导致不可预料和不一致的行为，具体取决于流是以流动模式还是暂停模式运作的。 使用 `'error'` 事件能确保一致的，且可预测的错误处理。
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

#### 一个计数流的示例<!--type=example-->如下是一个 Readable 流的示例，该流以升序方式发送 1 到 1,000,000 之间的数字，然后结束。

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
      const str = '' + i;
      const buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}
```

### 实现一个 Duplex 流

[Duplex](#stream_class_stream_duplex) 流是实现了 [Readable](#stream_class_stream_readable) 和 [Writable](#stream_class_stream_writable) 的流，例如 TCP 套接字连接。

由于 JavaScript 不支持多重继承，因此可以通过继承 `stream.Duplex` 类来实现 [Duplex](#stream_class_stream_duplex) 流 (而不是同时继承 `stream.Readable` *和* `stream.Writable` 类)。

*注意*：`stream.Duplex` 类的原型继承自 `stream.Readable`，并寄生自 `stream.Writable`，由于重写了 `stream.Writable` 的 [`Symbol.hasInstance`][] 方法， `instanceof` 对于这两个基础类都可用。

Custom Duplex streams *must* call the `new stream.Duplex([options])` constructor and implement *both* the `readable._read()` and `writable._write()` methods.

#### new stream.Duplex(options)<!-- YAML
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14636
    description: The `readableHighWaterMark` and `writableHighWaterMark` options
                 are supported now.
-->* `options` {Object} Passed to both Writable and Readable constructors. 同时含有如下字段：
  * `allowHalfOpen` {boolean} If set to `false`, then the stream will automatically end the writable side when the readable side ends. **Default:** `true`.
  * `readableObjectMode` {boolean} Sets `objectMode` for readable side of the stream. Has no effect if `objectMode` is `true`. **默认:** `false`.
  * `writableObjectMode` {boolean} Sets `objectMode` for writable side of the stream. Has no effect if `objectMode` is `true`. **默认:** `false`.
  * `readableHighWaterMark` {number} 为流的读取端设置 `highWaterMark`。 如果提供了 `highWaterMark`，则不产生任何效果。
  * `writableHighWaterMark` {number} 为流的写入端设置 `highWaterMark`。 如果提供了 `highWaterMark`，则不产生任何效果。

例如：

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

如下演示了一个简单的 Duplex 流的示例，该流包装了一个可将数据写入，和将数据读取的假设的较低级别源对象，尽管它使用了和 Node.js 流不兼容的 API。 如下示例演示了一个 Duplex 流的简单例子。它将写入数据通过 [Writable](#stream_class_stream_writable) 接口进行缓冲，并通过 [Readable](#stream_class_stream_readable) 接口读取回来。

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

Duplex 流的最重要特性就是，尽管存在于同一个单一对象实例中，Readable 端和 Writable 端以相对独立的方式运作。

#### 对象模式的 Duplex 流

对于 Duplex 流，可以分别在 Readable 端或 Writable 端分别通过 `readableObjectMode` 和 `writableObjectMode` 选项来设置 `objectMode` 。

在如下示例中，例如，一个新的 Transform 流 (它是一种 [Duplex](#stream_class_stream_duplex) 流) 被创建，它含有以对象模式运作的 Writable 端，该端接受 JavaScript 数字，这些数字会在 Readable 端被转换为十六进制字符串。

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

[Transform](#stream_class_stream_transform) 流是一个 [Duplex](#stream_class_stream_duplex) 流，其中的输出是将输入通过某种方式计算得到的。 例子包括进行压缩，加密，和解密数据的 [zlib](zlib.html) 流或 [crypto](crypto.html) 流。

*Note*: There is no requirement that the output be the same size as the input, the same number of chunks, or arrive at the same time. 例如：一个 Hash 流在输入结束时将只含有一个单一的输出块。 `zlib` 流产生的输出将会比输入更小或更大。

`stream.Transform` 继承并实现了 [Transform](#stream_class_stream_transform) 流。

`stream.Transform` 类原型继承自 `stream.Duplex`，且实现了它自己版本的 `writable._write()` 和 `readable._read()` 方法。 Custom Transform implementations *must* implement the [`transform._transform()`](#stream_transform_transform_chunk_encoding_callback) method and *may* also implement the [`transform._flush()`](#stream_transform_flush_callback) method.

*Note*: Care must be taken when using Transform streams in that data written to the stream can cause the Writable side of the stream to become paused if the output on the Readable side is not consumed.

#### new stream.Transform([options])

* `options` {Object} Passed to both Writable and Readable constructors. 同时含有如下字段：
  * `transform` {Function} [`stream._transform()`](#stream_transform_transform_chunk_encoding_callback) 方法的实现。
  * `flush` {Function} [`stream._flush()`](#stream_transform_flush_callback) 方法的实现。

例如：

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

*注意*：此函数不能由应用程序代码直接调用。 它应由子类实现，且仅被内部 Readable 类的方法调用。

在某些情况下，转换操作可能需要在流的尾部发送额外的数据。 例如：`zlib` 压缩流会存储一定量的，用于优化压缩输出的内部状态。 然而，当流结束时，该额外数据需要被刷新，以便完成压缩数据。

Custom [Transform](#stream_class_stream_transform) implementations *may* implement the `transform._flush()` method. 当没有更多的可供消费的写入数据，但在发出 [`'end'`][] 事件之前，该方法就会被调用，以发出 [Readable](#stream_class_stream_readable) 流结尾的信号。

在 `transform._flush()` 的实现中，`readable.push()` 方法可能会被酌情调用零次或多次。 当刷新操作完成时，必须调用 `callback` 函数。

`transform._flush()` 方法具有下划线前缀，这是因为它是定义它的类的内部方法，因此不应被用户程序直接调用。

#### transform.\_transform(chunk, encoding, callback)

* `chunk` {Buffer|string|any} 将被转换的数据块。 将会 **一直** 是缓冲区，除非 `decodeStrings` 选项被设置为 `false`，或当流以对象模式运作时。
* `encoding` {string} 如果数据块为字符串，则这是编码类型。 如果数据块为缓冲区，则 encoding 为特殊的值 - 'buffer'，在这种情况下忽略它。
* `callback` {Function} 在提供的 `chunk` 被处理后要调用的回调函数 (具有可选的 error 参数和数据)。

*注意*：此函数不能由应用程序代码直接调用。 它应由子类实现，且仅被内部 Readable 类的方法调用。

所有 Transform 流的实现都必须提供一个 `_transform()` 方法来接受输入并产生输出。 `transform._transform()` 的实现会处理写入的字节，计算输出，并使用 `readable.push()` 方法传递输出到可读部分。

`transform.push()` 方法可能会被调用零次或多次，以从单一输入数据块生成输出，具体取决于需要多少数据来产生输出数据块。

可能从任何给定的输入数据块都无法生成任何输出。

只有在当前数据块被完全消费时，才能调用 `callback` 函数。 如果在处理输入时发生错误，传递给 `callback` 的首个参数必须是一个 `Error` 对象，否则该参数为 `null`。 如果将第二个参数传递给 `callback`，它将被传递给 `readable.push()` 方法。 换言之，如下是等同的：

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

`stream.PassThrough` 类是 [Transform](#stream_class_stream_transform) 流的一个无关紧要的实现，它只是简单的将输入字节传递到输出端。 它的主要目的就是用于示例和测试，但在有些情况下 `stream.PassThrough` 可被用做新型流的组成部分。

## 附注<!--type=misc-->### 和旧版本 Node.js 的兼容性

<!--type=misc-->

在 Node.js v0.10 版本之前，Readable 流接口更简单，但即不怎么强大，也不太有用。

* 无需等待调用 [`stream.read()`](#stream_readable_read_size) 方法，会立即发出 [`'data'`][] 事件。 对于需要完成一定量的工作才能决定如何处理数据的应用程序，需要将读取的数据存储到缓冲区中，这样数据就不会丢失。
* [`stream.pause()`](#stream_readable_pause) 方法只是建议性的，而不能提供保证。 This meant that it was still necessary to be prepared to receive [`'data'`][] events *even when the stream was in a paused state*.

在 Node.js v0.10 中，增加了 [Readable](#stream_class_stream_readable) 类。 出于对较旧版本 Node.js 程序的向后兼容性考虑，当添加了 [`'data'`][] 事件处理程序，或调用 [`stream.resume()`](#stream_readable_resume) 方法时，Readable 流会切换为 "流动模式"。 其效果就是，即使当没有使用新的 [`stream.read()`](#stream_readable_read_size) 方法和 [`'readable'`][] 事件时，也无需担心丢失 [`'data'`][] 数据块。

尽管大多数应用程序将会正常运行，但这会在如下条件下引入边缘案例：

* 未添加 [`'data'`][] 事件监听器。
* 从未调用 [`stream.resume()`](#stream_readable_resume) 方法。
* 流没有通过管道传输到任何可写入目的地。

例如：考虑如下代码：

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // we add an 'end' method, but never consume the data
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

在 Node.js v0.10 版本之前，收到的消息数据会被简单的丢弃。 然而，在 Node.js v0.10 版本之后，套接字会永远保持暂停。

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

除了将新的 Readable 流切换为流动模式外，可通过使用 [`readable.wrap()`][`stream.wrap()`] 方法 将 pre-v0.10 风格的流包装在 Readable 类之中。


### `readable.read(0)`

在某些情况下，有必要触发刷新底层可读流机制，而无需实际消费任何数据。 在这些情况下，可以调用 `readable.read(0)`，它会一直返回 `null`。

如果内部读取缓冲区低于 `highWaterMark`，同时流当前未进行读取，则调用 `stream.read(0)` 会触发对低级方法 [`stream._read()`](#stream_readable_read_size_1) 的调用。

尽管大多数应用程序几乎从不需要这样做，但在 Node.js 中，有些情况下需要这样做，尤其是在 Readable 流对应的类的内部。

### `readable.push('')`

不推荐使用 `readable.push('')`。

压入一个零字节字符串，`Buffer` 或 `Uint8Array` 到非对象模式的流中具有有趣的副作用。 因为它 *是* 对 [`readable.push()`](#stream_readable_push_chunk_encoding) 的调用，该调用会终止读取过程。 然而，由于参数为空字符串，不会有数据被添加到可读缓冲区，这样用户就没有数据可以消费。

### 调用 `readable.setEncoding()` 后 `highWaterMark` 的差异

使用 `readable.setEncoding()` 将会改变 `highWaterMark` 在非对象模式下的运作行为。

通常，当前缓冲区的大小是比照 `highWaterMark` 并以 _字节_ 为单位来测量的。 然而，在调用 `setEncoding()` 后，比较函数将会以 _字符_ 为单位来开始测量缓冲区大小。

通常情况下，如果编码为 `latin1` 或 `ascii` ，这不会有问题。 但是当处理可能包含多字节字符的字符串时，建议留意这种行为。
