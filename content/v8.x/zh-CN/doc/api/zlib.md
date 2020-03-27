# Zlib

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`zlib` 模块提供了通过 Gzip 和 Deflate/Inflate 实现的压缩功能。 可以通过如下方式访问：

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

注意：除了那些使用 libuv 线程池明确进行同步操作的之外，所有 zlib API 在一些应用程序中会对性能产生意想不到的负面影响。请参阅 [`UV_THREADPOOL_SIZE`][] 文档以获得更多信息。

## 压缩 HTTP 请求和响应

`zlib` 模块可被用于实现在 [HTTP](https://tools.ietf.org/html/rfc7230#section-4.2) 协议中定义的，通过 `gzip` 和 `deflate` 支持的内容编码机制。

HTTP [` Accept-Encoding `] [] 头信息在 http 请求中用于标识客户端接受的压缩编码。 [`Content-Encoding`][] 头信息用于标识实际应用于消息的压缩编码。

*注意*：下面的示例被大大简化以演示基本概念。 使用 `zlib` 编码可能会很昂贵，因此其结果应被缓存。 关于在 `zlib` 中使用中的速度/内存/压缩的权衡，请参阅 [内存使用调优](#zlib_memory_usage_tuning) 以获取更多信息。

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

在默认情况下，`zlib` 中的方法在解压缩截断的数据时会抛出错误。 然而，如果已经知道数据不完整，或者只希望检查压缩文件的头部，可以通过更改用于解压输入数据中最后一块的 flushing 方法，来禁止默认的错误处理流程。

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

## 常量<!-- YAML
added: v0.5.8
--><!--type=misc-->在 `zlib.h` 中定义的所有常量也同样在 `require('zlib').constants` 中被定义。 In the normal course of operations, it will not be necessary to use these constants. 他们在文档中被记录，这样它们的存在不会让人觉得奇怪。 此部分几乎直接取自于 [zlib 文档](https://zlib.net/manual.html#Constants)。 See <https://zlib.net/manual.html#Constants> for more details.

*Note*: Previously, the constants were available directly from `require('zlib')`, for instance `zlib.Z_NO_FLUSH`. 目前仍可以从模块中直接访问常量，但此种访问操作应被视为已弃用。

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

## 类选项<!-- YAML
added: v0.11.1
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `dictionary` option can be an Uint8Array now.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6069
    description: The `finishFlush` option is supported now.
--><!--type=misc-->每个类以 `options` 对象作为参数。 所有选项均为可选的。

注意：有些选项只和压缩过程相关，在解压缩类中将被忽略。

* `flush` {integer} **Default:** `zlib.constants.Z_NO_FLUSH`
* `finishFlush` {integer} **Default:** `zlib.constants.Z_FINISH`
* `chunkSize` {integer} **Default:** `16 * 1024`
* `windowBits` {integer}
* `level` {integer} (仅和压缩相关)
* `memLevel` {integer} (仅和压缩相关)
* `strategy` {integer} (仅和压缩相关)
* `dictionary` {Buffer|TypedArray|DataView} (仅和 deflate/inflate 相关，默认为空字典)
* `info` {boolean} (如果为 `true`，返回包含 `buffer` 和 `engine` 的对象)

See the description of `deflateInit2` and `inflateInit2` at <https://zlib.net/manual.html#Advanced> for more information on these.

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
                 result in an `error` event.
  - version: v5.9.0
    pr-url: https://github.com/nodejs/node/pull/5120
    description: Multiple concatenated gzip file members are supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->解压缩 gzip 流。

## 类：zlib.Gzip<!-- YAML
added: v0.5.8
-->使用 gzip 压缩数据。

## 类：zlib.Inflate<!-- YAML
added: v0.5.8
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->解压缩 deflate 流。

## 类：zlib.InflateRaw<!-- YAML
added: v0.5.8
changes:
  - version: v6.8.0
    pr-url: https://github.com/nodejs/node/pull/8512
    description: Custom dictionaries are now supported by `InflateRaw`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2595
    description: A truncated input stream will now result in an `error` event.
-->解压缩原始 deflate 流。

## 类：zlib.Unzip<!-- YAML
added: v0.5.8
-->通过自动检测头信息来解压缩 Gzip- 或 Deflate-compressed 流。

## 类：zlib.Zlib
<!-- YAML
added: v0.5.8
-->

未经 `zlib` 模块导出。 由于它是 compressor/decompressor 类的基础类，因此记录于此。

### zlib.bytesRead<!-- YAML
added: v8.1.0
-->* {number}

`zlib.bytesRead` 属性指定在字节被处理 (压缩或解压缩，由派生的类而定) 之前， 引擎读取的字节数。

### zlib.close([callback])<!-- YAML
added: v0.9.4
-->关闭底层句柄。

### zlib.flush([kind], callback)<!-- YAML
added: v0.5.8
-->* `kind` **Default:** `zlib.constants.Z_FULL_FLUSH`

刷新待处理数据。 不要随便调用此方法，过早刷新会对压缩算法效率产生负面影响。

调用此方法仅仅会刷新内部 `zlib` 状态的数据，而不会在流级别上执行任何刷新。 恰恰相反，此方法的行为就像一个对 `.write()` 的正常调用，即：它将被加入其他待处理写入操作的队列之后，且只有从流中读取数据时才会产生输出。

### zlib.params(level, strategy, callback)<!-- YAML
added: v0.11.4
-->动态更新压缩级别和压缩策略。 只适用于 deflate 算法。

### zlib.reset()<!-- YAML
added: v0.7.0
-->将压缩器/解压缩器重置为出厂默认值。 只适用于 inflate 和 deflate 算法。

## zlib.constants<!-- YAML
added: v7.0.0
-->提供一个遍历 Zlib 相关常量的对象。

## zlib.createDeflate([options](#zlib_class_options))<!-- YAML
added: v0.5.8
-->根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [Deflate](#zlib_class_zlib_deflate) 对象。

## zlib.createDeflateRaw([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [DeflateRaw](#zlib_class_zlib_deflateraw) 对象。

*Note*: An upgrade of zlib from 1.2.8 to 1.2.11 changed behavior when windowBits is set to 8 for raw deflate streams. 如果 windowBits 的初始值为 8，zlib 会自动将其设为 9。 较新版本的 zlib 会抛出异常，由于将 `windowBits = 9` 传递给 zlib 实际上会导致压缩流在实际上只使用 8 位 window，所以 Node.js 恢复了将值从 8 升级到 9 的原始行为。

## zlib.createGunzip([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [Gunzip](#zlib_class_zlib_gunzip) 对象。

## zlib.createGzip([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [Gzip](#zlib_class_zlib_gzip) 对象。

## zlib.createInflate([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [Inflate](#zlib_class_zlib_inflate) 对象。

## zlib.createInflateRaw([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [InflateRaw](#zlib_class_zlib_inflateraw) 对象。

## zlib.createUnzip([options](#zlib_class_options))
<!-- YAML
added: v0.5.8
-->

根据给定的 [options](#zlib_class_options) 参数，创建并返回一个新的 [Unzip](#zlib_class_zlib_unzip) 对象。

## 便捷方法<!--type=misc-->所有这些方法都接受 [`Buffer`][]，[`TypedArray`][]，[`DataView`][] 或字符串作为首个参数，同时接受第二个可选参数并将其传递给 `zlib` 的类，且通过 `callback(error, result)` 的方式调用提供的回调函数。

每个这样的方法都有相对应的 `*Sync` 部分，该部分会接受相同的参数，但不含回调函数。

### zlib.deflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.deflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [Deflate](#zlib_class_zlib_deflate) 压缩一块数据。

### zlib.deflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.deflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [DeflateRaw](#zlib_class_zlib_deflateraw) 压缩一块数据。

### zlib.gunzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.gunzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [Gunzip](#zlib_class_zlib_gunzip) 解压缩一块数据。

### zlib.gzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.gzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [Gzip](#zlib_class_zlib_gzip) 压缩一块数据。

### zlib.inflate(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.inflateSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [Inflate](#zlib_class_zlib_inflate) 解压缩一块数据。

### zlib.inflateRaw(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.inflateRawSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [InflateRaw](#zlib_class_zlib_inflateraw) 解压缩一块数据。

### zlib.unzip(buffer[, options], callback)<!-- YAML
added: v0.6.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->### zlib.unzipSync(buffer[, options])<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `buffer` parameter can be any TypedArray or DataView now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12001
    description: The `buffer` parameter can be an Uint8Array now.
-->- `buffer` {Buffer|TypedArray|DataView|string}

通过 [Unzip](#zlib_class_zlib_unzip) 解压缩一块数据。
