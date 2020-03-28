# Zlib

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定的

`zlib` 模块提供了通过 Gzip 和 Deflate/Inflate 实现的压缩功能。 它可以通过如下方式访问：

```js
const zlib = require('zlib');
```

压缩或解压缩流（例如文件）可以通过管道将源流数据通过 `zlib` 流，进而传输到目标流：

```js
const gzip = zlib.createGzip();
const fs = require('fs');
const inp = fs.createReadStream('input.txt');
const out = fs.createWriteStream('input.txt.gz');

inp.pipe(gzip).pipe(out);
```

也可以在一个单一步骤中压缩或解压缩数据：

```js
const input = '.................................';
zlib.deflate(input, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString('base64'));
  } else {
    // handle error
  }
});

const buffer = Buffer.from('eJzT0yMAAGTvBe8=', 'base64');
zlib.unzip(buffer, (err, buffer) => {
  if (!err) {
    console.log(buffer.toString());
  } else {
    // handle error
  }
});
```

## 线程池使用

Note that all zlib APIs except those that are explicitly synchronous use libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

## 压缩 HTTP 请求和响应

`zlib` 模块可被用于实现在 [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2) 协议中定义的，通过 `gzip` 和 `deflate` 支持的内容编码机制。

HTTP [` Accept-Encoding `] [] 头信息在 http 请求中用于标识客户端接受的压缩编码。 [`Content-Encoding`][] 头信息用于标识实际应用于消息的压缩编码。

*Note*: the examples given below are drastically simplified to show the basic concept. Using `zlib` encoding can be expensive, and the results ought to be cached. 关于在 `zlib` 中使用中的速度/内存/压缩的权衡，请参阅 [内存使用调优](#zlib_memory_usage_tuning) 以获取更多信息。

```js
// client request example
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
const request = http.get({ host: 'example.com',
                           path: '/',
                           port: 80,
                           headers: { 'Accept-Encoding': 'gzip,deflate' } });
request.on('response', (response) => {
  const output = fs.createWriteStream('example.com_index.html');

  switch (response.headers['content-encoding']) {
    // or, just use zlib.createUnzip() to handle both cases
    case 'gzip':
      response.pipe(zlib.createGunzip()).pipe(output);
      break;
    case 'deflate':
      response.pipe(zlib.createInflate()).pipe(output);
      break;
    default:
      response.pipe(output);
      break;
  }
});
```

```js
// server example
// Running a gzip operation on every request is quite expensive.
// It would be much more efficient to cache the compressed buffer.
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
http.createServer((request, response) => {
  const raw = fs.createReadStream('index.html');
  let acceptEncoding = request.headers['accept-encoding'];
  if (!acceptEncoding) {
    acceptEncoding = '';
  }

  // Note: This is not a conformant accept-encoding parser.
  // See https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
  if (/\bdeflate\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'deflate' });
    raw.pipe(zlib.createDeflate()).pipe(response);
  } else if (/\bgzip\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'gzip' });
    raw.pipe(zlib.createGzip()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(1337);
```

在默认情况下，`zlib` 中的方法在解压缩截断的数据时会抛出错误。 However, if it is known that the data is incomplete, or the desire is to inspect only the beginning of a compressed file, it is possible to suppress the default error handling by changing the flushing method that is used to decompress the last chunk of input data:

```js
// This is a truncated version of the buffer from the above examples
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  { finishFlush: zlib.constants.Z_SYNC_FLUSH },
  (err, buffer) => {
    if (!err) {
      console.log(buffer.toString());
    } else {
      // handle error
    }
  });
```

这不会更改在其他错误被抛出时的行为，例如：当输入数据含有无效格式时。 使用此方法，不能确定输入数据是否过早结束，或者缺少完整性检查，因此有必要手动检查解压结果是否有效。

## 内存使用调优

<!--type=misc-->

从 `zlib/zconf.h`，调整为 node.js 的用法：

Deflate 的内存要求是 (以字节为单位)：

<!-- eslint-disable semi -->

```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

That is: 128K for windowBits = 15 + 128K for memLevel = 8 (default values) plus a few kilobytes for small objects.

例如，要将默认内存要求从256K减少到128K，应将选项设置为：

```js
const options = { windowBits: 14, memLevel: 7 };
```

但是，这通常会降低压缩率。

Inflate的内存要求为 (以字节为单位) `1 << windowBits`。 That is, 32K for windowBits = 15 (default value) plus a few kilobytes for small objects.

这是对大小为 `chunkSize` (默认为 16K) 的单一内部输出 slab 缓冲区的补充。

`level` 设置对 `zlib` 压缩速度的影响最大。 级别越高压缩效果越好，但将需要更长时间来完成。 较低的级别会导致较低的压缩率，但速度会更快。

通常，较高的内存使用选项意味着 Node.js 必须减少对 `zlib` 的调用次数，其原因在于每次进行 `write` 操作时，它将能处理更多的数据。 因此，这是影响速度的另一个因素，其代价是更多内存的使用。

## 刷新

在压缩流上调用 [`.flush()`][] 将会使 `zlib` 返回尽量多的当前输出。 这可能是以降低压缩质量为代价的，但在需要尽快提供数据时非常有用。

在下面的示例中，`flush()` 用于将压缩过的部分 HTTP 响应信息写入到客户端：

```js
const zlib = require('zlib');
const http = require('http');

http.createServer((request, response) => {
  // For the sake of simplicity, the Accept-Encoding checks are omitted.
  response.writeHead(200, { 'content-encoding': 'gzip' });
  const output = zlib.createGzip();
  output.pipe(response);

  setInterval(() => {
    output.write(`The current time is ${Date()}\n`, () => {
      // The data has been passed to zlib, but the compression algorithm may
      // have decided to buffer the data for more efficient compression.
      // Calling .flush() will make the data available as soon as the client
      // is ready to receive it.
      output.flush();
    });
  }, 1000);
}).listen(1337);
```

## 常量

<!-- YAML
added: v0.5.8
-->

<!--type=misc-->

All of the constants defined in `zlib.h` are also defined on `require('zlib').constants`. In the normal course of operations, it will not be necessary to use these constants. They are documented so that their presence is not surprising. This section is taken almost directly from the [zlib documentation](https://zlib.net/manual.html#Constants). See <https://zlib.net/manual.html#Constants> for more details.

*Note*: Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. Accessing the constants directly from the module is currently still possible but should be considered deprecated.

允许的刷新值。

- `zlib.constants.Z_NO_FLUSH`
- `zlib.constants.Z_PARTIAL_FLUSH`
- `zlib.constants.Z_SYNC_FLUSH`
- `zlib.constants.Z_FULL_FLUSH`
- `zlib.constants.Z_FINISH`
- `zlib.constants.Z_BLOCK`
- `zlib.constants.Z_TREES`

压缩/解压缩函数的返回代码。 负值为错误，正值被用于特定但正常的事件。

- `zlib.constants.Z_OK`
- `zlib.constants.Z_STREAM_END`
- `zlib.constants.Z_NEED_DICT`
- `zlib.constants.Z_ERRNO`
- `zlib.constants.Z_STREAM_ERROR`
- `zlib.constants.Z_DATA_ERROR`
- `zlib.constants.Z_MEM_ERROR`
- `zlib.constants.Z_BUF_ERROR`
- `zlib.constants.Z_VERSION_ERROR`

压缩等级。

- `zlib.constants.Z_NO_COMPRESSION`
- `zlib.constants.Z_BEST_SPEED`
- `zlib.constants.Z_BEST_COMPRESSION`
- `zlib.constants.Z_DEFAULT_COMPRESSION`

压缩策略。

- `zlib.constants.Z_FILTERED`
- `zlib.constants.Z_HUFFMAN_ONLY`
- `zlib.constants.Z_RLE`
- `zlib.constants.Z_FIXED`
- `zlib.constants.Z_DEFAULT_STRATEGY`

## 类选项

<!-- YAML
added: v0.11.1
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an Uint8Array now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
-->

<!--type=misc-->

每个类以 `options` 对象作为参数。 所有选项均为可选的。

注意：有些选项只和压缩过程相关，在解压缩类中将被忽略。

- `flush` {integer} **Default:** `zlib.constants.Z_NO_FLUSH`
- `finishFlush` {integer} **Default:** `zlib.constants.Z_FINISH`
- `chunkSize` {integer} **Default:** `16 * 1024`
- `windowBits` {integer}
- `level` {integer} (仅和压缩相关)
- `memLevel` {integer} (仅和压缩相关)
- `strategy` {integer} (仅和压缩相关)
- `dictionary` {Buffer|TypedArray|DataView} (deflate/inflate only, empty dictionary by default)
- `info` {boolean} (如果为 `true`，返回包含 `buffer` 和 `engine` 的对象)

See the description of `deflateInit2` and `inflateInit2` at <https://zlib.net/manual.html#Advanced> for more information on these.

## 类：zlib.Deflate

<!-- YAML
added: v0.5.8
-->

使用 deflate 压缩数据。

## 类：zlib.DeflateRaw

<!-- YAML
added: v0.5.8
-->

使用 deflate 压缩数据，且不追加 `zlib` 头信息。

## 类：zlib.Gunzip

<!-- YAML
added: v0.5.8
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5883
    description: Trailing garbage at the end of the input stream will now
                 result in an `error` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->

解压缩 gzip 流。

## 类：zlib.Gzip

<!-- YAML
added: v0.5.8
-->

使用 gzip 压缩数据。

## 类：zlib.Inflate

<!-- YAML
added: v0.5.8
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->

解压缩 deflate 流。

## 类：zlib.InflateRaw

<!-- YAML
added: v0.5.8
changes:

  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->

解压缩原始 deflate 流。

## 类：zlib.Unzip

<!-- YAML
added: v0.5.8
-->

通过自动检测头信息来解压缩 Gzip- 或 Deflate-compressed 流。

## 类：zlib.Zlib

<!-- YAML
added: v0.5.8
-->

未经 `zlib` 模块导出。 由于它是 compressor/decompressor 类的基础类，因此记录于此。

### zlib.bytesRead

<!-- YAML
added: v8.1.0
-->

- {number}

The `zlib.bytesRead` property specifies the number of bytes read by the engine before the bytes are processed (compressed or decompressed, as appropriate for the derived class).

### zlib.close([callback])

<!-- YAML
added: v0.9.4
-->

关闭底层句柄。

### zlib.flush([kind], callback)

<!-- YAML
added: v0.5.8
-->

- `kind` **Default:** `zlib.constants.Z_FULL_FLUSH`

刷新待处理数据。 不要随便调用此方法，过早刷新会对压缩算法效率产生负面影响。

调用此方法仅仅会刷新内部 `zlib` 状态的数据，而不会在流级别上执行任何刷新。 恰恰相反，此方法的行为就像一个对 `.write()` 的正常调用，即：它将被加入其他待处理写入操作的队列之后，且只有从流中读取数据时才会产生输出。

### zlib.params(level, strategy, callback)

<!-- YAML
added: v0.11.4
-->

动态更新压缩级别和压缩策略。 只适用于 deflate 算法。

### zlib.reset()

<!-- YAML
added: v0.7.0
-->

将压缩器/解压缩器重置为出厂默认值。 只适用于 inflate 和 deflate 算法。

## zlib.constants

<!-- YAML
added: v7.0.0
-->

提供一个遍历 Zlib 相关常量的对象。

## zlib.createDeflate([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Deflate](#zlib_class_zlib_deflate) object with the given [options](#zlib_class_options).

## zlib.createDeflateRaw([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [DeflateRaw](#zlib_class_zlib_deflateraw) object with the given [options](#zlib_class_options).

*注意*：将 zlib 从 1.2.8 版本升级到 1.2.11 版本后，一旦在处理原始 deflate 流时 windowBits 被设定为8，则会更改 zlib 的行为。 如果 windowBits 的初始值为 8，zlib 会自动将其设为 9。 较新版本的 zlib 会抛出异常，由于将 `windowBits = 9` 传递给 zlib 实际上会导致压缩流在实际上只使用 8 位 window，所以 Node.js 恢复了将值从 8 升级到 9 的原始行为。

## zlib.createGunzip([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Gunzip](#zlib_class_zlib_gunzip) object with the given [options](#zlib_class_options).

## zlib.createGzip([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Gzip](#zlib_class_zlib_gzip) object with the given [options](#zlib_class_options).

## zlib.createInflate([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Inflate](#zlib_class_zlib_inflate) object with the given [options](#zlib_class_options).

## zlib.createInflateRaw([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [InflateRaw](#zlib_class_zlib_inflateraw) object with the given [options](#zlib_class_options).

## zlib.createUnzip([options](#zlib_class_options))

<!-- YAML
added: v0.5.8
-->

Creates and returns a new [Unzip](#zlib_class_zlib_unzip) object with the given [options](#zlib_class_options).

## 便捷方法

<!--type=misc-->

All of these take a [`Buffer`][], [`TypedArray`][], [`DataView`][], or string as the first argument, an optional second argument to supply options to the `zlib` classes and will call the supplied callback with `callback(error, result)`.

每个这样的方法都有相对应的 `*Sync` 部分，该部分会接受相同的参数，但不含回调函数。

### zlib.deflate(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.deflateSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [Deflate](#zlib_class_zlib_deflate).

### zlib.deflateRaw(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.deflateRawSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [DeflateRaw](#zlib_class_zlib_deflateraw).

### zlib.gunzip(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.gunzipSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Gunzip](#zlib_class_zlib_gunzip).

### zlib.gzip(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.gzipSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Compress a chunk of data with [Gzip](#zlib_class_zlib_gzip).

### zlib.inflate(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.inflateSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Inflate](#zlib_class_zlib_inflate).

### zlib.inflateRaw(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.inflateRawSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [InflateRaw](#zlib_class_zlib_inflateraw).

### zlib.unzip(buffer[, options], callback)

<!-- YAML
added: v0.6.0
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

### zlib.unzipSync(buffer[, options])

<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->

- `buffer` {Buffer|TypedArray|DataView|string}

Decompress a chunk of data with [Unzip](#zlib_class_zlib_unzip).