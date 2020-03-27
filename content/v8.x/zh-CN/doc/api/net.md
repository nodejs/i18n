# 网络

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

它可以通过如下方式访问：

```js
const net = require('net');
```

## IPC 支持

The `net` module supports IPC with named pipes on Windows, and UNIX domain sockets on other operating systems.

### 为 IPC 连接识别路径

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

在 UNIX 系统上，本地域也被称作 UNIX 域。 这里的 path 参数是一个文件系统路径名。 It gets truncated to `sizeof(sockaddr_un.sun_path) - 1`, which varies on different operating system between 91 and 107 bytes. 在 Linux 系统上的典型值是 107，在 macOS 系统上的典型值是 103。 The path is subject to the same naming conventions and permissions checks as would be done on file creation. It will be visible in the filesystem, and will *persist until unlinked*.

在 Windows 系统上，本地域是通过命名管道实现的。 此路径 *必须* 引用在 `\\?\pipe` 或 `\\.\pipe` 中的条目。 路径中允许任何字符，但后面的字符可能会对管道名称进行处理，例如，解析 `..` 序列。 尽管如此，管道名称空间是扁平的。 管道将 *不会持续*，当最后一个引用关闭时，它们将被删除。 不要忘记 JavaScript 字符串转义需要通过双反斜杠来指定路径，例如：

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## 类：net.Server

<!-- YAML
added: v0.1.90
-->

这个类用于创建 TCP 或 [IPC](#net_ipc_support) 服务器。

### new net.Server(\[options\]\[, connectionListener\])

* 返回：{net.Server}

请参阅 [`net.createServer([options][, connectionListener])`][`net.createServer()`]。

`net.Server` 是一个含有如下事件的 [`EventEmitter`][]。

### 事件：'close'

<!-- YAML
added: v0.5.0
-->

当服务器关闭时发出。 注意如果存在连接，直到所有连接结束时才会发出此事件。

### 事件：'connection'

<!-- YAML
added: v0.1.90
-->

* {net.Socket} 连接对象

当创建了新连接时会发出此事件。 `socket` 是 `net.Socket` 的实例。

### 事件：'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

当发生错误时会发出此事件。 和 [`net.Socket`][] 不同，除非手动调用了 [`server.close()`][]，[`'close'`][] 事件 **不会** 在此事件后被直接发出。 See the example in discussion of [`server.listen()`][].

### 事件：'listening'

<!-- YAML
added: v0.1.90
-->

当在调用 [`server.listen()`][] 后绑定了服务器时会发出此事件。

### server.address()

<!-- YAML
added: v0.1.90
-->

如果在 IP 套接字上监听，则返回绑定的地址，地址系列名称，以及由操作系统返回的服务器端口。 当获取操作系统分配的地址时，此方法可用于获取分配的端口。 返回一个包含 `port`, `family`, 和 `address` 属性的对象：`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

对于监听管道或 UNIX 域套接字的服务器，名字会被作为字符串返回。

例如：

```js
const server = net.createServer((socket) => {
  socket.end('goodbye\n');
}).on('error', (err) => {
  // handle errors here
  throw err;
});

// grab an arbitrary unused port.
server.listen(() => {
  console.log('opened server on', server.address());
});
```

在发出 `'listening'` 事件之前，不要调用 `server.address()`。

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* 返回：{net.Server}

停止服务器接受新的连接，并保持现有连接。 此函数为异步的，当所有连接终止时服务器最终会被关闭，且服务器会发出 [`'close'`][] 事件。 当发生 `'close'` 事件时，可选的 `callback` 将被调用。 与该事件不同，如果服务器尚未被打开就要被关闭，它在被调用时会获取一个 Error 对象作为其唯一参数。

返回 `server`。

### server.connections

<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> 稳定性：0 - 已弃用：改为使用 [`server.getConnections()`][]。

在服务器端的并发连接数。

当通过 [`child_process.fork()`][] 向子进程发送套接字时，其值为 `null`。 To poll forks and get current number of active connections use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)

<!-- YAML
added: v0.9.7
-->

* 返回：{net.Server}

异步获取服务器上的并发连接数。 当套接字被发送给子进程时工作。

回调函数应当接受两个参数：`err` 和 `count`。

### server.listen()

开启一个服务器来监听连接。 A `net.Server` can be a TCP or a [IPC](#net_ipc_support) server depending on what it listens to.

可能的调用方式包括：

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* [`server.listen([port][, host][, backlog][, callback])`][`server.listen(port, host)`] for TCP servers

此函数为异步的。 When the server starts listening, the [`'listening'`][] event will be emitted. 最后一个参数 `callback` 会被作为 [`'listening'`][] 事件的监听器添加。

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. 此参数的默认值为 511 (而不是 512)。

*注意*：

* All [`net.Socket`][] are set to `SO_REUSEADDR` (See [socket(7)](http://man7.org/linux/man-pages/man7/socket.7.html) for details).

* `server.listen()` 方法可被多次调用。 随后的每个调用都会使用提供的选项 *重新打开* 服务器。

在监听时一个常见的错误就是 `EADDRINUSE`。 This happens when another server is already listening on the requested `port` / `path` / `handle`. One way to handle this would be to retry after a certain amount of time:

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

#### server.listen(handle\[, backlog\]\[, callback\])

<!-- YAML
added: v0.5.10
-->

* `handle` {Object}
* `backlog` {number} [`server.listen()`][] 函数的通用参数
* `callback` {Function} [`server.listen()`][] 函数的通用参数
* 返回： {net.Server}

Start a server listening for connections on a given `handle` that has already been bound to a port, a UNIX domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an underlying `_handle` member), or an object with an `fd` member that is a valid file descriptor.

*注意*：在 Windows 系统上不支持对文件描述符的监听。

#### server.listen(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `options` {Object} 必须的。 支持如下属性： 
  * `port` {number}
  * `host` {string}
  * `path` {string} 如果指定了 `port`，此选项会被忽略。 See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Common parameter of [`server.listen()`][] functions.
  * `exclusive` {boolean} **默认值：** `false`
* `callback` {Function} Common parameter of [`server.listen()`][] functions.
* 返回：{net.Server}

If `port` is specified, it behaves the same as [`server.listen([port][, hostname][, backlog][, callback])`][`server.listen(port, host)`]. Otherwise, if `path` is specified, it behaves the same as [`server.listen(path[, backlog][, callback])`][`server.listen(path)`]. 如果以上的参数都未指定，则会抛出错误。

如果 `exclusive` 的值为 `false` (默认值)，则集群的所有进程会使用同样的底层句柄，允许共享连接处理任务。 当 `exclusive` 的值为 `true` 时，不会共享句柄，尝试共享端口将会导致错误。 监听独立端口的示例如下。

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

#### server.listen(path\[, backlog\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `path` {string} 服务器应当监听的路径。 See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `backlog` {number} [`server.listen()`][] 函数的通用参数。
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

开始一个监听给定 `path` 上连接的 [IPC](#net_ipc_support) 服务器。

#### server.listen(\[port\]\[, host\]\[, backlog\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

* `port` {number}
* `host` {string}
* `backlog` {number} [`server.listen()`][] 函数的通用参数。
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

开始一个监听给定 `port` 和 `host` 上连接的 TCP 服务器。

If `port` is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using `server.address().port` after the [`'listening'`][] event has been emitted.

If `host` is omitted, the server will accept connections on the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) when IPv6 is available, or the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) otherwise.

*Note*: In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### server.listening

<!-- YAML
added: v5.7.0
-->

一个用于指示服务是是否在监听连接的布尔值。

### server.maxConnections

<!-- YAML
added: v0.2.0
-->

当服务器的连接数较多时，可通过设置此属性来拒绝连接。

不推荐在通过 [`child_process.fork()`][] 将套接字发送给子进程后使用此选项。

### server.ref()

<!-- YAML
added: v0.9.1
-->

* 返回：{net.Server}

和 `unref` 恰恰相反，如果当前服务器为唯一的服务器，在之前调用过 `unref` 的服务器上调用 `ref` 将 *不会* 使程序退出 (默认行为)。 如果已经在服务器上调用过 `ref`，再次调用 `ref` 将不会有任何影响。

### server.unref()

<!-- YAML
added: v0.9.1
-->

* 返回：{net.Server}

如果在事件系统中此服务器为唯一活跃的服务器，在服务器上调用 `unref` 将允许程序退出。 如果已经在服务器上调用过 `unref`，再次调用 `unref` 将不会产生任何影响。

## 类：net.Socket

<!-- YAML
added: v0.3.4
-->

This class is an abstraction of a TCP socket or a streaming [IPC](#net_ipc_support) endpoint (uses named pipes on Windows, and UNIX domain sockets otherwise). A `net.Socket` is also a [duplex stream](stream.html#stream_class_stream_duplex), so it can be both readable and writable, and it is also a [`EventEmitter`][].

A `net.Socket` can be created by the user and used directly to interact with a server. For example, it is returned by [`net.createConnection()`][], so the user can use it to talk to the server.

It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [`'connection'`][] event emitted on a [`net.Server`][], so the user can use it to interact with the client.

### new net.Socket([options])

<!-- YAML
added: v0.3.4
-->

创建一个新的套接字对象。

* `options` {Object} 可用的选项包括： 
  * `fd`: {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. See [`net.createServer()`][] and the [`'end'`][] event for details. **默认:** `false`.
  * `readable` {boolean} Allow reads on the socket when an `fd` is passed, otherwise ignored. **默认:** `false`.
  * `writable` {boolean} Allow writes on the socket when an `fd` is passed, otherwise ignored. **默认:** `false`.
* 返回：{net.Socket}

The newly created socket can be either a TCP socket or a streaming [IPC](#net_ipc_support) endpoint, depending on what it [`connect()`][`socket.connect()`] to.

### 事件：'close'

<!-- YAML
added: v0.1.90
-->

* `had_error` {boolean} `true` 如果套接字有传输错误。

在套接字完全关闭后发出此事件。 `had_error` 参数为布尔值，说明是否由于传输错误导致套接字被关闭。

### 事件：'connect'

<!-- YAML
added: v0.1.90
-->

当成功建立了套接字连接时发出此事件。 请参阅 [`net.createConnection()`][]。

### 事件：'data'

<!-- YAML
added: v0.1.90
-->

* {Buffer}

当收到数据时发出此事件。 `data` 参数是一个 `Buffer` 或 `String`。 数据编码由 `socket.setEncoding()` 设置。 (请参阅 [Readable Stream](stream.html#stream_class_stream_readable) 部分获取更多信息。)

注意：如果在 `Socket` 发出 `'data'` 事件时没有监听器，**数据将丢失**。

### 事件：'drain'

<!-- YAML
added: v0.1.90
-->

当写入缓冲区为空时发出此事件。 它可被用于控制上传。

请参阅：`socket.write()` 的返回值

### 事件：'end'

<!-- YAML
added: v0.1.90
-->

Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.

By default (`allowHalfOpen` is `false`) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. However, if `allowHalfOpen` is set to `true`, the socket will not automatically [`end()`][`socket.end()`] its writable side, allowing the user to write arbitrary amounts of data. The user must call [`end()`][`socket.end()`] explicitly to close the connection (i.e. sending a FIN packet back).

### 事件：'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

当发生错误时会发出此事件。 在此事件之后，`'close'` 事件将被调用。

### 事件：'lookup'

<!-- YAML
added: v0.11.3
changes:

  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

在解析主机名后和连接前发出此事件。 不适用于 UNIX 套接字。

* `err` {Error|null} 错误对象。 请参阅 [`dns.lookup()`][]。
* `address` {string} IP 地址。
* `family` {string|null} 地址类型。 请参阅 [`dns.lookup()`][]。
* `host` {string} 主机名。

### 事件：'timeout'

<!-- YAML
added: v0.1.90
-->

当套接字由于闲置而超时时会发出此事件。 它只是通知套接字空闲。 用户必须手动关闭套接字。

请参阅：[`socket.setTimeout()`][]

### socket.address()

<!-- YAML
added: v0.1.90
-->

返回操作系统报告的绑定地址，地址系列名，以及套接字端口号。 返回包含三个属性的对象，例如：`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize

<!-- YAML
added: v0.3.8
-->

`net.Socket` 具有该属性，`socket.write()` 工作时需要它。 它可被用于帮助用户快速启动。 计算机无法一直跟上写入套接字的数据量 - 网络连接速度可能太慢了。 Node.js 会在内部对写入到套接字的数据排队，并在可能的时候将其发送出去。 (其内部实现是对套接字的文件描述符进行轮询以确认它是否为可写状态)。

这种内部缓冲的结果是可能造成内存的增长。 此属性显示即将被写入的当前缓冲的字符数。 (字符数大致等于要写入的字节数，但缓冲区中可能包含字符串，而字符串是惰性编码的，因此具体的字节数未知。)

Users who experience large or growing `bufferSize` should attempt to "throttle" the data flows in their program with [`socket.pause()`][] and [`socket.resume()`][].

### socket.bytesRead

<!-- YAML
added: v0.5.3
-->

收到的字节数。

### socket.bytesWritten

<!-- YAML
added: v0.5.3
-->

发送的字节数。

### socket.connect()

启动一个到给定套接字的连接。

可能的调用方式包括：

* [socket.connect(options[, connectListener])][`socket.connect(options)`]
* [socket.connect(path[, connectListener])][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* \[socket.connect(port[, host\]\[, connectListener\])][`socket.connect(port, host)`] for TCP connections.
* 返回：{net.Socket} 套接字本身。

此函数为异步的。 When the connection is established, the [`'connect'`][] event will be emitted. If there is a problem connecting, instead of a [`'connect'`][] event, an [`'error'`][] event will be emitted with the error passed to the [`'error'`][] listener. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

#### socket.connect(options[, connectListener])

<!-- YAML
added: v0.1.90
changes:

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
* 返回： {net.Socket} 套接字本身。

启动一个到给定套接字的连接。 Normally this method is not needed, the socket should be created and opened with [`net.createConnection()`][]. Use this only when implementing a custom Socket.

对于 TCP 连接，可用的 `options` 包括：

* `port` {number} 必填。 套接字应连接到的端口。
* `host` {string} 套接字应连接到的主机。 **默认值：** `'localhost'`.
* `localAddress` {string} 套接字连接的本地地址。
* `localPort` {number} 套接字连接的本地端口。
* `family` {number}: Version of IP stack, can be either `4` or `6`. **默认值：** `4`.
* `hints` {number} 可选的 [`dns.lookup()` hints][]。
* `lookup` {Function} 自定义查找函数。 **默认值：** [`dns.lookup()`][].

对于 [IPC](#net_ipc_support) 连接，可用的 `options` 包括：

* `path` {string} 必填。 客户端应连接到的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。 If provided, the TCP-specific options above are ignored.

返回 `socket`。

#### socket.connect(path[, connectListener])

* `path` {string} 客户端应连接到的路径。 See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 [IPC](#net_ipc_support) 连接。

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{ path: path }` as `options`.

返回 `socket`。

#### socket.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} 客户端应连接到的端口。
* `host` {string} 客户端应连接到的主机。
* `connectListener` {Function} Common parameter of [`socket.connect()`][] methods. 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 TCP 连接。

Alias to [`socket.connect(options[, connectListener])`][`socket.connect(options)`] called with `{port: port, host: host}` as `options`.

返回 `socket`。

### socket.connecting

<!-- YAML
added: v6.1.0
-->

If `true` - [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and haven't yet finished. Will be set to `false` before emitting `connect` event and/or calling [`socket.connect(options[, connectListener])`][`socket.connect(options)`]'s callback.

### socket.destroy([exception])

<!-- YAML
added: v0.1.90
-->

* 返回：{net.Socket}

确保在此套接字上没有更多的 I/O 活动。 只有在发生错误时才有必要 (解析错误等)。

如果指定了 `exception`，将会发出 [`'error'`][] 事件，同时该事件的所有监听器将会收到 `exception` 作为参数。

### socket.destroyed

一个用于表示连接是否被销毁的布尔值。 一旦连接被销毁，就不能再使用它传输任何数据。

### socket.end(\[data\]\[, encoding\])

<!-- YAML
added: v0.1.90
-->

* 返回：{net.Socket} 套接字本身。

半关闭套接字。 即：它发送一个 FIN 数据包。 服务器可能仍会发送一些数据。

If `data` is specified, it is equivalent to calling `socket.write(data, encoding)` followed by [`socket.end()`][].

### socket.localAddress

<!-- YAML
added: v0.9.6
-->

代表远程客户端连接的本地 IP 地址字符串。 For example, in a server listening on `'0.0.0.0'`, if a client connects on `'192.168.1.1'`, the value of `socket.localAddress` would be `'192.168.1.1'`.

### socket.localPort

<!-- YAML
added: v0.9.6
-->

代表本地端口的数字。 例如：`80` 或 `21`。

### socket.pause()

* 返回：{net.Socket} 套接字本身。

暂停数据读取。 也就是说，不会发出 [`'data'`][] 事件。 在控制上传时非常有用。

### socket.ref()

<!-- YAML
added: v0.9.1
-->

* 返回：{net.Socket} 套接字本身。

和 `unref` 恰恰相反，如果当前套接字为仅存的套接字，在之前调用过 `unref` 的套接字上调用 `ref` 将 *不会* 使程序退出 (默认行为)。 如果已经在套接字上调用过 `ref`，再次调用 `ref` 将不会有任何影响。

### socket.remoteAddress

<!-- YAML
added: v0.5.10
-->

返回代表远程 IP 地址的字符串。 例如： `'74.125.127.100'` 或 `'2001:4860:a005::68'`。 如果套接字被销毁 (例如：如果客户端断开连接)，其值可能为 `undefined`。

### socket.remoteFamily

<!-- YAML
added: v0.11.14
-->

返回代表远程 IP 系列的字符串。 `'IPv4'` 或 `'IPv6'`。

### socket.remotePort

<!-- YAML
added: v0.5.10
-->

代表远程端口的数字。 例如：`80` 或 `21`。

### socket.resume()

* 返回：{net.Socket} 套接字本身。

在调用 [`socket.pause()`][] 后恢复读取。

### socket.setEncoding([encoding])

<!-- YAML
added: v0.1.90
-->

* 返回：{net.Socket} 套接字本身。

设置套接字的编码为 [Readable 流](stream.html#stream_class_stream_readable)。 请参阅 [`stream.setEncoding()`][] 获取更多信息。

### socket.setKeepAlive(\[enable\]\[, initialDelay\])

<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Default:** `false`
* `initialDelay` {number} **Default:** `0`
* 返回：{net.Socket} 套接字本身。

启用/禁用长连接功能，并在首个长连接探针被发送到闲置套接字之前选择性的设置初始延迟。

设置 `initialDelay` (毫秒) 来设置收到的最后一个数据包和首个长连接探针之间的延迟。 将 initialDelay 的值设置为 0 时，将保持该值的默认 (或之前的) 设置不变。

### socket.setNoDelay([noDelay])

<!-- YAML
added: v0.1.90
-->

* `noDelay` {boolean} **Default:** `true`
* 返回：{net.Socket} 套接字本身。

禁用 Nagle 算法。 在默认情况下，TCP 连接使用 Nagle 算法，它们在发送数据之前对其缓冲。 将 `noDelay` 的值设为 `true` 将会导致在每次 `socket.write()` 被调用时，立即发送数据。

### socket.setTimeout(timeout[, callback])

<!-- YAML
added: v0.1.90
-->

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

### socket.unref()

<!-- YAML
added: v0.9.1
-->

* 返回：{net.Socket} 套接字本身。

如果在事件系统中此套接字为唯一活跃的套接字，在套接字上调用 `unref` 将允许程序退出。 如果已经在套接字上调用过 `unref`，再次调用 `unref` 将不会产生任何影响。

### socket.write(data\[, encoding\]\[, callback\])

<!-- YAML
added: v0.1.90
-->

通过套接字发送数据。 The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.

如果全部数据都被成功刷新到内核缓冲区，则返回 `true`。 如果全部或部分数据在用户内存中排队，则返回 `false`。 当缓冲区再次空闲时将会发出 [`'drain'`][] 事件。

当数据最终被写出时，可选的 `callback` 参数将被执行 - 这可能不会立即发生。

## net.connect()

Aliases to [`net.createConnection()`][`net.createConnection()`].

可能的调用方式包括：

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] for TCP connections.

### net.connect(options[, connectListener])

<!-- YAML
added: v0.7.0
--> Alias to [

`net.createConnection(options[, connectListener])`][`net.createConnection(options)`].

### net.connect(path[, connectListener])

<!-- YAML
added: v0.1.90
-->

Alias to [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`].

### net.connect(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

Alias to [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`].

## net.createConnection()

A factory function, which creates a new [`net.Socket`][], immediately initiates connection with [`socket.connect()`][], then returns the `net.Socket` that starts the connection.

When the connection is established, a [`'connect'`][] event will be emitted on the returned socket. The last parameter `connectListener`, if supplied, will be added as a listener for the [`'connect'`][] event **once**.

可能的调用方式包括：

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] for [IPC](#net_ipc_support) connections.
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] for TCP connections.

*Note*: The [`net.connect()`][] function is an alias to this function.

### net.createConnection(options[, connectListener])

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
  //'connect' listener
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

要想连接到套接字 `/tmp/echo.sock`，第二行仅需要改为

```js
const client = net.createConnection({ path: '/tmp/echo.sock' });
```

### net.createConnection(path[, connectListener])

<!-- YAML
added: v0.1.90
-->

* `path` {string} 套接字应连接到的路径。 Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`]. 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(path)`].
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

初始化一个 [IPC](#net_ipc_support) 连接。

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(path[, connectListener])`][`socket.connect(path)`], then returns the `net.Socket` that starts the connection.

### net.createConnection(port\[, host\]\[, connectListener\])

<!-- YAML
added: v0.1.90
-->

* `port` {number} 套接字应连接到的端口。 Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`].
* `host` {string} 套接字应连接到的主机。 Will be passed to [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]. **默认值：** `'localhost'`.
* `connectListener` {Function} Common parameter of the [`net.createConnection()`][] functions, an "once" listener for the `'connect'` event on the initiating socket. Will be passed to [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`].
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

初始化一个 TCP 连接。

This function creates a new [`net.Socket`][] with all options set to default, immediately initiates connection with [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`], then returns the `net.Socket` that starts the connection.

## net.createServer(\[options\]\[, connectionListener\])

<!-- YAML
added: v0.5.0
-->

创建一个新的 TCP 或 [IPC](#net_ipc_support) 服务器。

* `options` {Object} 
  * `allowHalfOpen` {boolean} Indicates whether half-opened TCP connections are allowed. **默认:** `false`.
  * `pauseOnConnect` {boolean} Indicates whether the socket should be paused on incoming connections. **默认:** `false`.
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* 返回：{net.Server}

If `allowHalfOpen` is set to `true`, when the other end of the socket sends a FIN packet, the server will only send a FIN packet back when [`socket.end()`][] is explicitly called, until then the connection is half-closed (non-readable but still writable). See [`'end'`][] event and [RFC 1122](https://tools.ietf.org/html/rfc1122) (section 4.2.2.13) for more information.

If `pauseOnConnect` is set to `true`, then the socket associated with each incoming connection will be paused, and no data will be read from its handle. This allows connections to be passed between processes without any data being read by the original process. To begin reading data from a paused socket, call [`socket.resume()`][].

The server can be a TCP server or a [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

Here is an example of an TCP echo server which listens for connections on port 8124:

```js
const net = require('net');
const server = net.createServer((c) => {
  // 'connection' listener
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

要想监听 `/tmp/echo.sock` 上的套接字，上面的第三行需要改为

```js
server.listen('/tmp/echo.sock', () => {
  console.log('server bound');
});
```

使用 `nc` 连接到一个 UNIX 域套接字服务器：

```console
$ nc -U /tmp/echo.sock
```

## net.isIP(input)

<!-- YAML
added: v0.3.0
-->

测试输入是否为 IP 地址。 如果是无效字符串，则返回 0，如果为 IPv4 地址，则返回 4，如果为 IPv6 地址，则返回 6。

## net.isIPv4(input)

<!-- YAML
added: v0.3.0
-->

如果输入为 IPv4 地址，返回 true，否则返回 false。

## net.isIPv6(input)

<!-- YAML
added: v0.3.0
-->

如果输入为 IPv6 地址，返回 true，否则返回 false。