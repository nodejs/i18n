# Zlib

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

The `zlib` module provides compression functionality implemented using Gzip and Deflate/Inflate, as well as Brotli. 可以通过如下方式访问：

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

Note that all zlib APIs except those that are explicitly synchronous use libuv's threadpool. This can lead to surprising effects in some applications, such as subpar performance (which can be mitigated by adjusting the [pool size](cli.html#cli_uv_threadpool_size_size)) and/or unrecoverable and catastrophic memory fragmentation.

## 压缩 HTTP 请求和响应

The `zlib` module can be used to implement support for the `gzip`, `deflate` and `br` content-encoding mechanisms defined by [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2).

HTTP [` Accept-Encoding `] [] 头信息在 http 请求中用于标识客户端接受的压缩编码。 [`Content-Encoding`][] 头信息用于标识实际应用于消息的压缩编码。

The examples given below are drastically simplified to show the basic concept. Using `zlib` encoding can be expensive, and the results ought to be cached. See [Memory Usage Tuning](#zlib_memory_usage_tuning) for more information on the speed/memory/compression tradeoffs involved in `zlib` usage.

```js
// client request example
const zlib = require('zlib');
const http = require('http');
const fs = require('fs');
const request = http.get({ host: 'example.com',
                           path: '/',
                           port: 80,
                           headers: { 'Accept-Encoding': 'br,gzip,deflate' } });
request.on('response', (response) => {
  const output = fs.createWriteStream('example.com_index.html');

  switch (response.headers['content-encoding']) {
    case 'br':
      response.pipe(zlib.createBrotliDecompress()).pipe(output);
      break;
    // Or, just use zlib.createUnzip() to handle both of the following cases:
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
  } else if (/\bbr\b/.test(acceptEncoding)) {
    response.writeHead(200, { 'Content-Encoding': 'br' });
    raw.pipe(zlib.createBrotliCompress()).pipe(response);
  } else {
    response.writeHead(200, {});
    raw.pipe(response);
  }
}).listen(1337);
```

在默认情况下，`zlib` 中的方法在解压缩截断的数据时会抛出错误。 然而，如果已经知道数据不完整，或者只希望检查压缩文件的头部，可以通过更改用于解压输入数据中最后一块的 flushing 方法，来禁止默认的错误处理流程。

```js
// This is a truncated version of the buffer from the above examples
const buffer = Buffer.from('eJzT0yMA', 'base64');

zlib.unzip(
  buffer,
  // For Brotli, the equivalent is zlib.constants.BROTLI_OPERATION_FLUSH.
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

### For zlib-based streams

From `zlib/zconf.h`, modified to Node.js's usage:

Deflate 的内存要求是 (以字节为单位)：
```js
(1 << (windowBits + 2)) + (1 << (memLevel + 9))
```

That is: 128K for `windowBits` = 15 + 128K for `memLevel` = 8 (default values) plus a few kilobytes for small objects.

例如，要将默认内存要求从256K减少到128K，应将选项设置为：

```js
const options = { windowBits: 14, memLevel: 7 };
```

但是，这通常会降低压缩率。

Inflate的内存要求为 (以字节为单位) `1 << windowBits`。 That is, 32K for `windowBits` = 15 (default value) plus a few kilobytes for small objects.

这是对大小为 `chunkSize` (默认为 16K) 的单一内部输出 slab 缓冲区的补充。

`level` 设置对 `zlib` 压缩速度的影响最大。 级别越高压缩效果越好，但将需要更长时间来完成。 较低的级别会导致较低的压缩率，但速度会更快。

通常，较高的内存使用选项意味着 Node.js 必须减少对 `zlib` 的调用次数，其原因在于每次进行 `write` 操作时，它将能处理更多的数据。 因此，这是影响速度的另一个因素，其代价是更多内存的使用。

### For Brotli-based streams

There are equivalents to the zlib options for Brotli-based streams, although these options have different ranges than the zlib ones:

- zlib’s `level` option matches Brotli’s `BROTLI_PARAM_QUALITY` option.
- zlib’s `windowBits` option matches Brotli’s `BROTLI_PARAM_LGWIN` option.

See [below](#zlib_brotli_constants) for more details on Brotli-specific options.

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

## 常量<!-- YAML
added: v0.5.8
--><!--type=misc-->### zlib constants

在 `zlib.h` 中定义的所有常量也同样在 `require('zlib').constants` 中被定义。 In the normal course of operations, it will not be necessary to use these constants. 他们在文档中被记录，这样它们的存在不会让人觉得奇怪。 此部分几乎直接取自于 [zlib 文档](https://zlib.net/manual.html#Constants)。 See <https://zlib.net/manual.html#Constants> for more details.

Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. Accessing the constants directly from the module is currently still possible but is deprecated.

允许的刷新值。

* `zlib.constants.Z_NO_FLUSH`
* `zlib.constants.Z_PARTIAL_FLUSH`
* `zlib.constants.Z_SYNC_FLUSH`
* `zlib.constants.Z_FULL_FLUSH`
* `zlib.constants.Z_FINISH`
* `zlib.constants.Z_BLOCK`
* `zlib.constants.Z_TREES`

压缩/解压缩函数的返回代码。 负值为错误，正值被用于特定但正常的事件。

* `zlib.constants.Z_OK`
* `zlib.constants.Z_STREAM_END`
* `zlib.constants.Z_NEED_DICT`
* `zlib.constants.Z_ERRNO`
* `zlib.constants.Z_STREAM_ERROR`
* `zlib.constants.Z_DATA_ERROR`
* `zlib.constants.Z_MEM_ERROR`
* `zlib.constants.Z_BUF_ERROR`
* `zlib.constants.Z_VERSION_ERROR`

压缩等级。

* `zlib.constants.Z_NO_COMPRESSION`
* `zlib.constants.Z_BEST_SPEED`
* `zlib.constants.Z_BEST_COMPRESSION`
* `zlib.constants.Z_DEFAULT_COMPRESSION`

压缩策略。

* `zlib.constants.Z_FILTERED`
* `zlib.constants.Z_HUFFMAN_ONLY`
* `zlib.constants.Z_RLE`
* `zlib.constants.Z_FIXED`
* `zlib.constants.Z_DEFAULT_STRATEGY`

### Brotli constants<!-- YAML
added: v10.16.0
-->There are several options and other constants available for Brotli-based streams:

#### Flush operations

The following values are valid flush operations for Brotli-based streams:

* `zlib.constants.BROTLI_OPERATION_PROCESS` (default for all operations)
* `zlib.constants.BROTLI_OPERATION_FLUSH` (default when calling `.flush()`)
* `zlib.constants.BROTLI_OPERATION_FINISH` (default for the last chunk)
* `zlib.constants.BROTLI_OPERATION_EMIT_METADATA`
  * This particular operation may be hard to use in a Node.js context, as the streaming layer makes it hard to know which data will end up in this frame. Also, there is currently no way to consume this data through the Node.js API.

#### Compressor options

There are several options that can be set on Brotli encoders, affecting compression efficiency and speed. Both the keys and the values can be accessed as properties of the `zlib.constants` object.

The most important options are:

* `BROTLI_PARAM_MODE`
  * `BROTLI_MODE_GENERIC` (default)
  * `BROTLI_MODE_TEXT`, adjusted for UTF-8 text
  * `BROTLI_MODE_FONT`, adjusted for WOFF 2.0 fonts
* `BROTLI_PARAM_QUALITY`
  * Ranges from `BROTLI_MIN_QUALITY` to `BROTLI_MAX_QUALITY`, with a default of `BROTLI_DEFAULT_QUALITY`.
* `BROTLI_PARAM_SIZE_HINT`
  * Integer value representing the expected input size; defaults to `0` for an unknown input size.

The following flags can be set for advanced control over the compression algorithm and memory usage tuning:

* `BROTLI_PARAM_LGWIN`
  * Ranges from `BROTLI_MIN_WINDOW_BITS` to `BROTLI_MAX_WINDOW_BITS`, with a default of `BROTLI_DEFAULT_WINDOW`, or up to `BROTLI_LARGE_MAX_WINDOW_BITS` if the `BROTLI_PARAM_LARGE_WINDOW` flag is set.
* `BROTLI_PARAM_LGBLOCK`
  * Ranges from `BROTLI_MIN_INPUT_BLOCK_BITS` to `BROTLI_MAX_INPUT_BLOCK_BITS`.
* `BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING`
  * Boolean flag that decreases compression ratio in favour of decompression speed.
* `BROTLI_PARAM_LARGE_WINDOW`
  * Boolean flag enabling “Large Window Brotli” mode (not compatible with the Brotli format as standardized in [RFC 7932](https://www.rfc-editor.org/rfc/rfc7932.txt)).
* `BROTLI_PARAM_NPOSTFIX`
  * Ranges from `0` to `BROTLI_MAX_NPOSTFIX`.
* `BROTLI_PARAM_NDIRECT`
  * Ranges from `0` to `15 << NPOSTFIX` in steps of `1 << NPOSTFIX`.

#### Decompressor options

These advanced options are available for controlling decompression:

* `BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION`
  * Boolean flag that affects internal memory allocation patterns.
* `BROTLI_DECODER_PARAM_LARGE_WINDOW`
  * Boolean flag enabling “Large Window Brotli” mode (not compatible with the Brotli format as standardized in [RFC 7932](https://www.rfc-editor.org/rfc/rfc7932.txt)).

## Class: Options<!-- YAML
added: v0.11.1
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `dictionary` option can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an `Uint8Array` now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
--><!--type=misc-->Each zlib-based class takes an `options` object. 所有选项均为可选的。

注意：有些选项只和压缩过程相关，在解压缩类中将被忽略。

* `flush` {integer} **Default:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Default:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Default:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (仅和压缩相关)
* `memLevel` {integer} (仅和压缩相关)
* `strategy` {integer} (仅和压缩相关)
* `dictionary` {Buffer|TypedArray|DataView|ArrayBuffer} (deflate/inflate only, empty dictionary by default)
* `info` {boolean} (If `true`, returns an object with `buffer` and `engine`.)

See the description of `deflateInit2` and `inflateInit2` at <https://zlib.net/manual.html#Advanced> for more information on these.

## Class: BrotliOptions<!-- YAML
added: v10.16.0
--><!--type=misc-->Each Brotli-based class takes an `options` object. 所有选项均为可选的。

* `flush` {integer} **Default:** `zlib.constants.BROTLI_OPERATION_PROCESS`
* `finishFlush` {integer} **Default:** `zlib.constants.BROTLI_OPERATION_FINISH`
* `chunkSize` {integer} **Default:** `16 * 1024`
* `params` {Object} Key-value object containing indexed [Brotli parameters](#zlib_brotli_constants).

例如：

```js
const stream = zlib.createBrotliCompress({
  chunkSize: 32 * 1024,
  params: {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: fs.statSync(inputFile).size
  }
});
```

## Class: zlib.BrotliCompress<!-- YAML
added: v10.16.0
-->Compress data using the Brotli algorithm.

## Class: zlib.BrotliDecompress
<!-- YAML
added: v10.16.0
-->

Decompress data using the Brotli algorithm.

## 类：zlib.Deflate<!-- YAML
added: v0.5.8
-->使用 deflate 压缩数据。

## 类：zlib.DeflateRaw
<!-- YAML
added: v0.5.8
-->

使用 deflate 压缩数据，且不追加 `zlib` 头信息。

## 类：zlib.Gunzip<!-- YAML
added: v0.5.8
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5883
    description: Trailing garbage at the end of the input stream will now
                 result in an `'error'` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->解压缩 gzip 流。

## 类：zlib.Gzip<!-- YAML
added: v0.5.8
-->使用 gzip 压缩数据。

## 类：zlib.Inflate<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->解压缩 deflate 流。

## 类：zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `'error'` event.
-->解压缩原始 deflate 流。

## 类：zlib.Unzip<!-- YAML
added: v0.5.8
-->通过自动检测头信息来解压缩 Gzip- 或 Deflate-compressed 流。

## Class: zlib.ZlibBase<!-- YAML
added: v0.5.8
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/24939
    description: This class was renamed from `Zlib` to `ZlibBase`.
-->未经 `zlib` 模块导出。 由于它是 compressor/decompressor 类的基础类，因此记录于此。

This class inherits from [`stream.Transform`][], allowing `zlib` objects to be used in pipes and similar stream operations.

### zlib.bytesRead<!-- YAML
added: v8.1.0
deprecated: v10.0.0
-->> Stability: 0 - Deprecated: Use [`zlib.bytesWritten`][] instead.

* {number}

Deprecated alias for [`zlib.bytesWritten`][]. This original name was chosen because it also made sense to interpret the value as the number of bytes read by the engine, but is inconsistent with other streams in Node.js that expose values under these names.

### zlib.bytesWritten<!-- YAML
added: v10.0.0
-->* {number}

The `zlib.bytesWritten` property specifies the number of bytes written to the engine, before the bytes are processed (compressed or decompressed, as appropriate for the derived class).

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->* `callback` {Function}

关闭底层句柄。

### zlib.flush([kind, ]callback)<!-- YAML
added: v0.5.8
-->* `kind` **Default:** `zlib.constants.Z_FULL_FLUSH` for zlib-based streams, `zlib.constants.BROTLI_OPERATION_FLUSH` for Brotli-based streams.
* `callback` {Function}

刷新待处理数据。 不要随便调用此方法，过早刷新会对压缩算法效率产生负面影响。

调用此方法仅仅会刷新内部 `zlib` 状态的数据，而不会在流级别上执行任何刷新。 恰恰相反，此方法的行为就像一个对 `.write()` 的正常调用，即：它将被加入其他待处理写入操作的队列之后，且只有从流中读取数据时才会产生输出。

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->* `level` {integer}
* `strategy` {integer}
* `callback` {Function}

This function is only available for zlib-based streams, i.e. not Brotli.

动态更新压缩级别和压缩策略。 只适用于 deflate 算法。

### zlib.reset()<!-- YAML
added: v0.7.0
-->将压缩器/解压缩器重置为出厂默认值。 只适用于 inflate 和 deflate 算法。

## zlib.constants<!-- YAML
added: v7.0.0
-->提供一个遍历 Zlib 相关常量的对象。

## zlib.createBrotliCompress([options])<!-- YAML
added: v10.16.0
-->* `options` {brotli options}

Creates and returns a new [`BrotliCompress`][] object.

## zlib.createBrotliDecompress([options])
<!-- YAML
added: v10.16.0
-->

* `options` {brotli options}

Creates and returns a new [`BrotliDecompress`][] object.

## zlib.createDeflate([options])<!-- YAML
added: v0.5.8
-->* `options` {Object}

Creates and returns a new [`Deflate`][] object.

## zlib.createDeflateRaw([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`DeflateRaw`][] object.

An upgrade of zlib from 1.2.8 to 1.2.11 changed behavior when `windowBits` is set to 8 for raw deflate streams. zlib would automatically set `windowBits` to 9 if was initially set to 8. 较新版本的 zlib 会抛出异常，由于将 `windowBits = 9` 传递给 zlib 实际上会导致压缩流在实际上只使用 8 位 window，所以 Node.js 恢复了将值从 8 升级到 9 的原始行为。

## zlib.createGunzip([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Gunzip`][] object.

## zlib.createGzip([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Gzip`][] object.

## zlib.createInflate([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Inflate`][] object.

## zlib.createInflateRaw([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`InflateRaw`][] object.

## zlib.createUnzip([options])
<!-- YAML
added: v0.5.8
-->

* `options` {Object}

Creates and returns a new [`Unzip`][] object.

## 便捷方法<!--type=misc-->All of these take a [`Buffer`][], [`TypedArray`][], [`DataView`][], [`ArrayBuffer`][] or string as the first argument, an optional second argument to supply options to the `zlib` classes and will call the supplied callback with `callback(error, result)`.

每个这样的方法都有相对应的 `*Sync` 部分，该部分会接受相同的参数，但不含回调函数。

### zlib.brotliCompress(buffer[, options], callback)<!-- YAML
added: v10.16.0
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}
* `callback` {Function}

### zlib.brotliCompressSync(buffer[, options])
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}

Compress a chunk of data with [`BrotliCompress`][].

### zlib.brotliDecompress(buffer[, options], callback)
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}
* `callback` {Function}

### zlib.brotliDecompressSync(buffer[, options])
<!-- YAML
added: v10.16.0
-->
* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {brotli options}

Decompress a chunk of data with [`BrotliDecompress`][].

### zlib.deflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.deflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Compress a chunk of data with [`Deflate`][].

### zlib.deflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.deflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Compress a chunk of data with [`DeflateRaw`][].

### zlib.gunzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.gunzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`Gunzip`][].

### zlib.gzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.gzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Compress a chunk of data with [`Gzip`][].

### zlib.inflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.inflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`Inflate`][].

### zlib.inflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.inflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`InflateRaw`][].

### zlib.unzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}
* `callback` {Function}

### zlib.unzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16042
    description: The `buffer` parameter can be an `ArrayBuffer`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any `TypedArray` or `DataView`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an `Uint8Array` now.
-->* `buffer` {Buffer|TypedArray|DataView|ArrayBuffer|string}
* `options` {Object}

Decompress a chunk of data with [`Unzip`][].
