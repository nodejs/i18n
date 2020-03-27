# 网络

<!--introduced_in=v0.10.0-->
<!--lint disable maximum-line-length-->

> 稳定性：2 - 稳定

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

可以通过如下方式访问：

```js
const net = require('net');
```

## IPC 支持

The `net` module supports IPC with named pipes on Windows, and Unix domain sockets on other operating systems.

### 为 IPC 连接识别路径

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

On Unix, the local domain is also known as the Unix domain. The path is a filesystem pathname. It gets truncated to an OS-dependent length of `sizeof(sockaddr_un.sun_path) - 1`. Typical values are 107 bytes on Linux and 103 bytes on macOS. If a Node.js API abstraction creates the Unix domain socket, it will unlink the Unix domain socket as well. For example, [`net.createServer()`][] may create a Unix domain socket and [`server.close()`][] will unlink it. But if a user creates the Unix domain socket outside of these abstractions, the user will need to remove it. The same applies when a Node.js API creates a Unix domain socket but the program then crashes. In short, a Unix domain socket will be visible in the filesystem and will persist until unlinked.

在 Windows 系统上，本地域是通过命名管道实现的。 The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe\`. 路径中允许任何字符，但后面的字符可能会对管道名称进行处理，例如，解析 `..` 序列。 Despite how it might look, the pipe namespace is flat. Pipes will *not persist*. They are removed when the last reference to them is closed. Unlike Unix domain sockets, Windows will close and remove the pipe when the owning process exits.

JavaScript string escaping requires paths to be specified with extra backslash escaping such as:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Class: `net.Server`
<!-- YAML
added: v0.1.90
-->

* Extends: {EventEmitter}

这个类用于创建 TCP 或 [IPC](#net_ipc_support) 服务器。

### `new net.Server([options][, connectionListener])`

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* 返回：{net.Server}

`net.Server` 是一个含有如下事件的 [`EventEmitter`][]。

### Event: `'close'`
<!-- YAML
added: v0.5.0
-->

当服务器关闭时发出。 If connections exist, this event is not emitted until all connections are ended.

### Event: `'connection'`
<!-- YAML
added: v0.1.90
-->

* {net.Socket} 连接对象

当创建了新连接时会发出此事件。 `socket` 是 `net.Socket` 的实例。

### Event: `'error'`
<!-- YAML
added: v0.1.90
-->

* {Error}

当发生错误时会发出此事件。 Unlike [`net.Socket`][], the [`'close'`][] event will **not** be emitted directly following this event unless [`server.close()`][] is manually called. See the example in discussion of [`server.listen()`][].

### Event: `'listening'`
<!-- YAML
added: v0.1.90
-->

当在调用 [`server.listen()`][] 后绑定了服务器时会发出此事件。

### `server.address()`
<!-- YAML
added: v0.1.90
-->

* 返回：{Object|string}

Returns the bound `address`, the address `family` name, and `port` of the server as reported by the operating system if listening on an IP socket (useful to find which port was assigned when getting an OS-assigned address): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

For a server listening on a pipe or Unix domain socket, the name is returned as a string.

```js
const server = net.createServer((socket) => {
  socket.end('goodbye\n');
}).on('error', (err) => {
  // Handle errors here.
  throw err;
});

// Grab an arbitrary unused port.
server.listen(() => {
  console.log('opened server on', server.address());
});
```

在发出 `'listening'` 事件之前，不要调用 `server.address()`。

### `server.close([callback])`
<!-- YAML
added: v0.1.90
-->

* `callback` {Function} Called when the server is closed.
* 返回：{net.Server}

停止服务器接受新的连接，并保持现有连接。 This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. 当发生 `'close'` 事件时，可选的 `callback` 将被调用。 Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### `server.connections`
<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> 稳定性：0 - 已弃用：改为使用 [`server.getConnections()`][]。

* {integer|null}

在服务器端的并发连接数。

当通过 [`child_process.fork()`][] 向子进程发送套接字时，其值为 `null`。 To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### `server.getConnections(callback)`
<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* 返回：{net.Server}

异步获取服务器上的并发连接数。 当套接字被发送给子进程时工作。

回调函数应当接受两个参数：`err` 和 `count`。

### `server.listen()`

开启一个服务器来监听连接。 A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

可能的调用方式包括：

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* <a href="#net_server_listen_port_host_backlog_callback">
  <code>server.listen([port[, host[, backlog]]][, callback])</code></a>
for TCP servers

此函数为异步的。 When the server starts listening, the [`'listening'`][] event will be emitted. 最后一个参数 `callback` 会被作为 [`'listening'`][] 事件的监听器添加。

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. 此参数的默认值为 511 (而不是 512)。

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. Otherwise, an `ERR_SERVER_ALREADY_LISTEN` error will be thrown.

在监听时一个常见的错误就是 `EADDRINUSE`。 This happens when another server is already listening on the requested `port`/`path`/`handle`. One way to handle this would be to retry after a certain amount of time:

```js
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(PORT, HOST);
    }, 1000);
  }
});
```

#### `server.listen(handle[, backlog][, callback])`
<!-- YAML
added: v0.5.10
-->

* `handle` {Object}
* `backlog` {number} [`server.listen()`][] 函数的通用参数
* `callback` {Function}
* 返回：{net.Server}

Start a server listening for connections on a given `handle` that has already been bound to a port, a Unix domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an underlying `_handle` member), or an object with an `fd` member that is a valid file descriptor.

Listening on a file descriptor is not supported on Windows.

#### `server.listen(options[, callback])`
<!-- YAML
added: v0.11.14
changes:
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/23798
    description: The `ipv6Only` option is supported.
-->

* `options` {Object} 必填。 支持如下属性：
  * `port` {number}
  * `host` {string}
  * `path` {string} 如果指定了 `port`，此选项会被忽略。 See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Common parameter of [`server.listen()`][] functions.
  * `exclusive` {boolean} **Default:** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Default:** `false`.
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Default:** `false`.
  * `ipv6Only` {boolean} For TCP servers, setting `ipv6Only` to `true` will disable dual-stack support, i.e., binding to host `::` won't make `0.0.0.0` be bound. **Default:** `false`.
* `callback` {Function}
functions.
* 返回：{net.Server}

If `port` is specified, it behaves the same as
<a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. Otherwise, if `path` is specified, it behaves the same as [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. 如果以上的参数都未指定，则会抛出错误。

如果 `exclusive` 的值为 `false` (默认值)，则集群的所有进程会使用同样的底层句柄，允许共享连接处理任务。 当 `exclusive` 的值为 `true` 时，不会共享句柄，尝试共享端口将会导致错误。 监听独立端口的示例如下。

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

Starting an IPC server as root may cause the server path to be inaccessible for unprivileged users. Using `readableAll` and `writableAll` will make the server accessible for all users.

#### `server.listen(path[, backlog][, callback])`
<!-- YAML
added: v0.1.90
-->

* `path` {string} 服务器应当监听的路径。 See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `backlog` {number} [`server.listen()`][] 函数的通用参数。
* `callback` {Function}.
* 返回：{net.Server}

Start an [IPC](#net_ipc_support) server listening for connections on the given `path`.

#### `server.listen([port[, host[, backlog]]][, callback])`
<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `backlog` {number} [`server.listen()`][] 函数的通用参数。
* `callback` {Function}.
* 返回：{net.Server}

开始一个监听给定 `port` 和 `host` 上连接的 TCP 服务器。

If `port` is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using `server.address().port` after the [`'listening'`][] event has been emitted.

If `host` is omitted, the server will accept connections on the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) when IPv6 is available, or the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) otherwise.

In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### `server.listening`
<!-- YAML
added: v5.7.0
-->

* {boolean} Indicates whether or not the server is listening for connections.

### `server.maxConnections`
<!-- YAML
added: v0.2.0
-->

* {integer}

当服务器的连接数较多时，可通过设置此属性来拒绝连接。

不推荐在通过 [`child_process.fork()`][] 将套接字发送给子进程后使用此选项。

### `server.ref()`
<!-- YAML
added: v0.9.1
-->

* 返回：{net.Server}

Opposite of `unref()`, calling `ref()` on a previously `unref`ed server will *not* let the program exit if it's the only server left (the default behavior). If the server is `ref`ed calling `ref()` again will have no effect.

### `server.unref()`
<!-- YAML
added: v0.9.1
-->

* 返回：{net.Server}

Calling `unref()` on a server will allow the program to exit if this is the only active server in the event system. If the server is already `unref`ed calling `unref()` again will have no effect.

## Class: `net.Socket`
<!-- YAML
added: v0.3.4
-->

* Extends: {stream.Duplex}

This class is an abstraction of a TCP socket or a streaming [IPC](#net_ipc_support) endpoint (uses named pipes on Windows, and Unix domain sockets otherwise). It is also an [`EventEmitter`][].

A `net.Socket` can be created by the user and used directly to interact with a server. For example, it is returned by [`net.createConnection()`][], so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [`'connection'`][] event emitted on a [`net.Server`][], so the user can use it to interact with the client.

### `new net.Socket([options])`
<!-- YAML
added: v0.3.4
-->

* `options` {Object} Available options are:
  * `fd` {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. See [`net.createServer()`][] and the [`'end'`][] event for details. **Default:** `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed, otherwise ignored. **Default:** `false`.
* 返回：{net.Socket}

创建一个新的套接字对象。

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### Event: `'close'`
<!-- YAML
added: v0.1.90
-->

* `hadError` {boolean} `true` if the socket had a transmission error.

在套接字完全关闭后发出此事件。 The argument `hadError` is a boolean which says if the socket was closed due to a transmission error.

### Event: `'connect'`
<!-- YAML
added: v0.1.90
-->

当成功建立了套接字连接时发出此事件。 请参阅 [`net.createConnection()`][]。

### Event: `'data'`
<!-- YAML
added: v0.1.90
-->

* {Buffer|string}

当收到数据时发出此事件。 `data` 参数是一个 `Buffer` 或 `String`。 Encoding of data is set by [`socket.setEncoding()`][].

The data will be lost if there is no listener when a `Socket` emits a `'data'` event.

### Event: `'drain'`
<!-- YAML
added: v0.1.90
-->

当写入缓冲区为空时发出此事件。 它可被用于控制上传。

请参阅：`socket.write()` 的返回值.

### Event: `'end'`
<!-- YAML
added: v0.1.90
-->

Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.

By default (`allowHalfOpen` is `false`) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. However, if `allowHalfOpen` is set to `true`, the socket will not automatically [`end()`][`socket.end()`] its writable side, allowing the user to write arbitrary amounts of data. The user must call [`end()`][`socket.end()`] explicitly to close the connection (i.e. sending a FIN packet back).

### Event: `'error'`
<!-- YAML
added: v0.1.90
-->

* {Error}

当发生错误时会发出此事件。 在此事件之后，`'close'` 事件将被调用。

### Event: `'lookup'`
<!-- YAML
added: v0.11.3
changes:
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

Emitted after resolving the host name but before connecting. Not applicable to Unix sockets.

* `err` {Error|null} 错误对象。 请参阅 [`dns.lookup()`][]。
* `address` {string} IP 地址。
* `family` {string|null} 地址类型。 请参阅 [`dns.lookup()`][]。
* `host` {string} The host name.

### Event: `'ready'`
<!-- YAML
added: v9.11.0
-->

Emitted when a socket is ready to be used.

Triggered immediately after `'connect'`.

### Event: `'timeout'`
<!-- YAML
added: v0.1.90
-->

当套接字由于闲置而超时时会发出此事件。 它只是通知套接字空闲。 用户必须手动关闭套接字。

请参阅：[`socket.setTimeout()`][].

### `socket.address()`
<!-- YAML
added: v0.1.90
-->

* 返回：{Object}

Returns the bound `address`, the address `family` name and `port` of the socket as reported by the operating system: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### `socket.bufferSize`
<!-- YAML
added: v0.3.8
-->

* {integer}

This property shows the number of characters buffered for writing. The buffer may contain strings whose length after encoding is not yet known. So this number is only an approximation of the number of bytes in the buffer.

`net.Socket` 具有该属性，`socket.write()` 工作时需要它。 它可被用于帮助用户快速启动。 The computer cannot always keep up with the amount of data that is written to a socket. The network connection simply might be too slow. Node.js 会在内部对写入到套接字的数据排队，并在可能的时候将其发送出去。

这种内部缓冲的结果是可能造成内存的增长。 Users who experience large or growing `bufferSize` should attempt to "throttle" the data flows in their program with [`socket.pause()`][] and [`socket.resume()`][].

### `socket.bytesRead`
<!-- YAML
added: v0.5.3
-->

* {integer}

收到的字节数。

### `socket.bytesWritten`
<!-- YAML
added: v0.5.3
-->

* {integer}

发送的字节数。

### `socket.connect()`

启动一个到给定套接字的连接。

可能的调用方式包括：

* [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
* [`socket.connect(path[, connectListener])`][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] for TCP connections.
* 返回：{net.Socket} 套接字本身。

此函数为异步的。 When the connection is established, the [`'connect'`][] event will be emitted. If there is a problem connecting, instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with the error passed to the [`'error'`][] listener. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

#### `socket.connect(options[, connectListener])`
<!-- YAML
added: v0.1.90
changes:
  - version: v12.10.0
    pr-url: https://github.com/nodejs/node/pull/25436
    description: Added `onread` option.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6021
    description: The `hints` option defaults to `0` in all cases now.
                 Previously, in the absence of the `family` option it would
                 default to `dns.ADDRCONFIG | dns.V4MAPPED`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/6000
    description: The `hints` option is supported now.
-->

* `options` {Object}
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动一个到给定套接字的连接。 Normally this method is not needed, the socket should be created and opened with [`net.createConnection()`][]. Use this only when implementing a custom Socket.

对于 TCP 连接，可用的 `options` 包括：

* `port` {number} 必填。 套接字应连接到的端口。
* `host` {string} 套接字应连接到的主机。 **Default:** `'localhost'`.
* `localAddress` {string} 套接字连接的本地地址。
* `localPort` {number} 套接字连接的本地端口。
* `family` {number}: Version of IP stack. Must be `4`, `6`, or `0`. The value `0` indicates that both IPv4 and IPv6 addresses are allowed. **Default:** `0`.
* `hints` {number} 可选的 [`dns.lookup()` hints][]。
* `lookup` {Function} 自定义查找函数。 **Default:** [`dns.lookup()`][].

对于 [IPC](#net_ipc_support) 连接，可用的 `options` 包括：

* `path` {string} 必填。 客户端应连接到的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。 If provided, the TCP-specific options above are ignored.

For both types, available `options` include:

* `onread` {Object} If specified, incoming data is stored in a single `buffer` and passed to the supplied `callback` when data arrives on the socket. This will cause the streaming functionality to not provide any data. The socket will emit events like `'error'`, `'end'`, and `'close'` as usual. Methods like `pause()` and `resume()` will also behave as expected.
  * `buffer` {Buffer|Uint8Array|Function} Either a reusable chunk of memory to use for storing incoming data or a function that returns such.
  * `callback` {Function} This function is called for every chunk of incoming data. Two arguments are passed to it: the number of bytes written to `buffer` and a reference to `buffer`. Return `false` from this function to implicitly `pause()` the socket. This function will be executed in the global context.

Following is an example of a client using the `onread` option:

```js
const net = require('net');
net.connect({
  port: 80,
  onread: {
    // Reuses a 4KiB Buffer for every read from the socket.
    buffer: Buffer.alloc(4 * 1024),
    callback: function(nread, buf) {
      // Received data is available in `buf` from 0 to `nread`.
      console.log(buf.toString('utf8', 0, nread));
    }
  }
});
```

#### `socket.connect(path[, connectListener])`

* `path` {string} 客户端应连接到的路径。 See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 [IPC](#net_ipc_support) 连接。

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{ path: path }` as `options`.

#### `socket.connect(port[, host][, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `port` {number} 客户端应连接到的端口。
* `host` {string} 客户端应连接到的主机。
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 TCP 连接。

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{port: port, host: host}` as `options`.

### `socket.connecting`
<!-- YAML
added: v6.1.0
-->

* {boolean}

If `true`, [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and has not yet finished. It will stay `true` until the socket becomes connected, then it is set to `false` and the `'connect'` event is emitted.  Note that the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] callback is a listener for the `'connect'` event.

### `socket.destroy([exception])`
<!-- YAML
added: v0.1.90
-->

* `exception` {Object}
* 返回：{net.Socket}

确保在此套接字上没有更多的 I/O 活动。 只有在发生错误时才有必要 (解析错误等)。

如果指定了 `exception`，将会发出 [`'error'`][] 事件，同时该事件的所有监听器将会收到 `exception` 作为参数。

### `socket.destroyed`

* {boolean} Indicates if the connection is destroyed or not. 一旦连接被销毁，就不能再使用它传输任何数据。

### `socket.end([data[, encoding]][, callback])`
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Only used when data is `string`. **Default:** `'utf8'`.
* `callback` {Function} Optional callback for when the socket is finished.
* 返回：{net.Socket} 套接字本身。

半关闭套接字。 即：它发送一个 FIN 数据包。 服务器可能仍会发送一些数据。

If `data` is specified, it is equivalent to calling `socket.write(data, encoding)` followed by [`socket.end()`][].

### `socket.localAddress`
<!-- YAML
added: v0.9.6
-->

* {string}

代表远程客户端连接的本地 IP 地址字符串。 For example, in a server listening on `'0.0.0.0'`, if a client connects on `'192.168.1.1'`, the value of `socket.localAddress` would be `'192.168.1.1'`.

### `socket.localPort`
<!-- YAML
added: v0.9.6
-->

* {integer}

代表本地端口的数字。 For example, `80` or `21`.

### `socket.pause()`

* 返回：{net.Socket} 套接字本身。

暂停数据读取。 也就是说，不会发出 [`'data'`][] 事件。 在控制上传时非常有用。

### `socket.pending`
<!-- YAML
added: v11.2.0
-->

* {boolean}

This is `true` if the socket is not connected yet, either because `.connect()` has not yet been called or because it is still in the process of connecting (see [`socket.connecting`][]).

### `socket.ref()`
<!-- YAML
added: v0.9.1
-->

* 返回：{net.Socket} 套接字本身。

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will *not* let the program exit if it's the only socket left (the default behavior). If the socket is `ref`ed calling `ref` again will have no effect.

### `socket.remoteAddress`
<!-- YAML
added: v0.5.10
-->

* {string}

返回代表远程 IP 地址的字符串。 例如： `'74.125.127.100'` 或 `'2001:4860:a005::68'`。 如果套接字被销毁 (例如：如果客户端断开连接)，其值可能为 `undefined`。

### `socket.remoteFamily`
<!-- YAML
added: v0.11.14
-->

* {string}

返回代表远程 IP 系列的字符串。 `'IPv4'` 或 `'IPv6'`。

### `socket.remotePort`
<!-- YAML
added: v0.5.10
-->

* {integer}

代表远程端口的数字。 For example, `80` or `21`.

### `socket.resume()`

* 返回：{net.Socket} 套接字本身。

在调用 [`socket.pause()`][] 后恢复读取。

### `socket.setEncoding([encoding])`
<!-- YAML
added: v0.1.90
-->

* `encoding` {string}
* 返回：{net.Socket} 套接字本身。

设置套接字的编码为 [Readable 流](stream.html#stream_class_stream_readable)。 See [`readable.setEncoding()`][] for more information.

### `socket.setKeepAlive([enable][, initialDelay])`
<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Default:** `false`
* `initialDelay` {number} **Default:** `0`
* 返回：{net.Socket} 套接字本身。

启用/禁用长连接功能，并在首个长连接探针被发送到闲置套接字之前选择性的设置初始延迟。

设置 `initialDelay` (毫秒) 来设置收到的最后一个数据包和首个长连接探针之间的延迟。 Setting `0` for `initialDelay` will leave the value unchanged from the default (or previous) setting.

### `socket.setNoDelay([noDelay])`
<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Default:** `true`
* 返回：{net.Socket} 套接字本身。

Enable/disable the use of Nagle's algorithm.

When a TCP connection is created, it will have Nagle's algorithm enabled.

Nagle's algorithm delays data before it is sent via the network. It attempts to optimize throughput at the expense of latency.

Passing `true` for `noDelay` or not passing an argument will disable Nagle's algorithm for the socket. Passing `false` for `noDelay` will enable Nagle's algorithm.

### `socket.setTimeout(timeout[, callback])`
<!-- YAML
added: v0.1.90
-->

* `timeout` {number}
* `callback` {Function}
* 返回：{net.Socket} 套接字本身。

当套接字在 `timeout` 毫秒内无活动时将其设置为超时状态。 默认情况下，`net.Socket` 没有超时。

当空闲超时被触发时，套接字将会收到一个 [`'timeout'`][] 事件，但连接并不会被断开。 The user must manually call [`socket.end()`][] or [`socket.destroy()`][] to end the connection.

```js
socket.setTimeout(3000);
socket.on('timeout', () => {
  console.log('socket timeout');
  socket.end();
});
```

如果 `timeout` 为 0，则现有的空闲超时会被禁用。

可选的 `callback` 参数将被作为一次性监听器添加到 [`'timeout'`][] 事件上。

### `socket.unref()`
<!-- YAML
added: v0.9.1
-->

* 返回：{net.Socket} 套接字本身。

Calling `unref()` on a socket will allow the program to exit if this is the only active socket in the event system. If the socket is already `unref`ed calling `unref()` again will have no effect.

### `socket.write(data[, encoding][, callback])`
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Only used when data is `string`. **Default:** `utf8`.
* `callback` {Function}
* 返回：{boolean}

通过套接字发送数据。 The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.

如果全部数据都被成功刷新到内核缓冲区，则返回 `true`。 如果全部或部分数据在用户内存中排队，则返回 `false`。 当缓冲区再次空闲时将会发出 [`'drain'`][] 事件。

The optional `callback` parameter will be executed when the data is finally written out, which may not be immediately.

See `Writable` stream [`write()`](stream.html#stream_writable_write_chunk_encoding_callback) method for more information.

## `net.connect()`

Aliases to [`net.createConnection()`][`net.createConnection()`].

可能的调用方式包括：

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] for TCP connections.

### `net.connect(options[, connectListener])`
<!-- YAML
added: v0.7.0
-->

* `options` {Object}
* `connectListener` {Function}
* 返回：{net.Socket}

Alias to [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### `net.connect(path[, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `path` {string}
* `connectListener` {Function}
* 返回：{net.Socket}

Alias to [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### `net.connect(port[, host][, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `connectListener` {Function}
* 返回：{net.Socket}

Alias to [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## `net.createConnection()`

A factory function, which creates a new [`net.Socket`][], immediately initiates connection with [`socket.connect()`][], then returns the `net.Socket` that starts the connection.

When the connection is established, a [`'connect'`][] event will be emitted on the returned socket. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

可能的调用方式包括：

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] for [IPC](#net_ipc_support) connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] for TCP connections.

The [`net.connect()`][] function is an alias to this function.

### `net.createConnection(options[, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `options` {Object} 必填。 Will be passed to both the [`new net.Socket([options])`][`new net.Socket(options)`] call and the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] method.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions. If supplied, will be added as a listener for the [`'connect'`][] event on the returned socket once.
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

For available options, see [`new net.Socket([options])`][`new net.Socket(options)`] and [`socket.connect(options[, connectListener])`][`socket.connect(options)`].

其他选项：

* `timeout` {number} If set, will be used to call [`socket.setTimeout(timeout)`][] after the socket is created, but before it starts the connection.

如下是一个在 [`net.createServer()`][] 部分的响应服务器的客户端范例：

```js
const net = require('net');
const client = net.createConnection({ port: 8124 }, () => {
  // 'connect' listener.
  console.log('connected to server!');
  client.write('world!\r\n');
});
client.on('data', (data) => {
  console.log(data.toString());
  client.end();
});
client.on('end', () => {
  console.log('disconnected from server');
});
```

To connect on the socket `/tmp/echo.sock` the second line would just be changed to:

```js
const client = net.createConnection({ path: '/tmp/echo.sock' });
```

### `net.createConnection(path[, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `path` {string} 套接字应连接到的路径。 Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

初始化一个 [IPC](#net_ipc_support) 连接。

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(path[, connectListener])`][`socket.connect(path)`], then returns the `net.Socket` that starts the connection.

### `net.createConnection(port[, host][, connectListener])`
<!-- YAML
added: v0.1.90
-->

* `port` {number} 套接字应连接到的端口。 Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} 套接字应连接到的主机。 Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **Default:** `'localhost'`.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

初始化一个 TCP 连接。

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], then returns the `net.Socket` that starts the connection.

## `net.createServer([options][, connectionListener])`
<!-- YAML
added: v0.5.0
-->

* `options` {Object}
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. **Default:** `false`.
  * `pauseOnConnect` {boolean} Indicates whether the socket should be paused on incoming connections. **Default:** `false`.
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* 返回：{net.Server}

创建一个新的 TCP 或 [IPC](#net_ipc_support) 服务器。

If `allowHalfOpen` is set to `true`, when the other end of the socket sends a FIN packet, the server will only send a FIN packet back when [`socket.end()`][] is explicitly called, until then the connection is half-closed (non-readable but still writable). See [`'end'`][] event and [RFC 1122](https://tools.ietf.org/html/rfc1122) (section 4.2.2.13) for more information.

If `pauseOnConnect` is set to `true`, then the socket associated with each incoming connection will be paused, and no data will be read from its handle. This allows connections to be passed between processes without any data being read by the original process. To begin reading data from a paused socket, call [`socket.resume()`][].

The server can be a TCP server or an [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

Here is an example of an TCP echo server which listens for connections on port 8124:

```js
const net = require('net');
const server = net.createServer((c) => {
  // 'connection' listener.
  console.log('client connected');
  c.on('end', () => {
    console.log('client disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});
```

可以通过 `telnet` 对其进行测试：

```console
$ telnet localhost 8124
```

To listen on the socket `/tmp/echo.sock` the third line from the last would just be changed to:

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

Use `nc` to connect to a Unix domain socket server:

```console
$ nc -U /tmp/echo.sock
```

## `net.isIP(input)`
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* 返回：{integer}

测试输入是否为 IP 地址。 Returns `0` for invalid strings, returns `4` for IP version 4 addresses, and returns `6` for IP version 6 addresses.

## `net.isIPv4(input)`
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* 返回：{boolean}

Returns `true` if input is a version 4 IP address, otherwise returns `false`.

## `net.isIPv6(input)`
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* 返回：{boolean}

Returns `true` if input is a version 6 IP address, otherwise returns `false`.
