# 网络

<!--introduced_in=v0.10.0-->
<!--lint disable maximum-line-length-->

> 稳定性：2 - 稳定

`net` 模块提供了一个异步网络 API，可用于创建基于流的 TCP 或 [IPC](#net_ipc_support) 服务器 ([`net.createServer()`][]) 和客户端 ([`net.createConnection()`][])。

可以通过如下方式使用：

```js
const net = require('net');
```

## IPC 支持

`net` 模块支持 在 Windows 上使用命名管道 IPC ，及在其他操作系统上使用 UNIX 域套接字。

### 为 IPC 连接识别路径

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] 和 [`socket.connect()`][] 使用 `path` 参数来识别 IPC 端点。

在 UNIX 系统上，本地域也被称作 UNIX 域。 The path is a filesystem pathname. 它会在 `sizeof(sockaddr_un.sun_path) - 1` 处被截断，具体长度会根据不同的操作系统而介于 91 和 107 个字节之间。 在 Linux 系统上的典型值是 107，在 macOS 系统上的典型值是 103。 该路径受到与创建文件时相同的命名约定和权限检查的影响。 If the UNIX domain socket (that is visible as a file system path) is created and used in conjunction with one of Node.js' API abstractions such as [`net.createServer()`][], it will be unlinked as part of [`server.close()`][]. On the other hand, if it is created and used outside of these abstractions, the user will need to manually remove it. The same applies when the path was created by a Node.js API but the program crashes abruptly. In short, a UNIX domain socket once successfully created will be visible in the filesystem, and will persist until unlinked.

在 Windows 系统上，本地域是通过命名管道实现的。 The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe\`. 路径中允许任何字符，但后面的字符可能会对管道名称进行处理，例如，解析 `..` 序列。 Despite how it might look, the pipe namespace is flat. Pipes will *not persist*. They are removed when the last reference to them is closed. Unlike UNIX domain sockets, Windows will close and remove the pipe when the owning process exits.

JavaScript string escaping requires paths to be specified with extra backslash escaping such as:

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

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} 自动设为 [`'connection'`][] 事件的监听器。
* 返回：{net.Server}

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

当发生错误时会发出此事件。 和 [`net.Socket`][] 不同，除非手动调用了 [`server.close()`][]，[`'close'`][] 事件 **不会** 在此事件后被直接发出。 请参阅关于 [`server.listen()`][] 讨论时的示例。

### 事件：'listening'
<!-- YAML
added: v0.1.90
-->

当在调用 [`server.listen()`][] 后绑定了服务器时会发出此事件。

### server.address()
<!-- YAML
added: v0.1.90
-->

* Returns: {Object|string}

Returns the bound `address`, the address `family` name, and `port` of the server as reported by the operating system if listening on an IP socket (useful to find which port was assigned when getting an OS-assigned address): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

对于监听管道或 UNIX 域套接字的服务器，名字会被作为字符串返回。

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

* `callback` {Function} Called when the server is closed
* 返回：{net.Server}

停止服务器接受新的连接，并保持现有连接。 This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. 当发生 `'close'` 事件时，可选的 `callback` 将被调用。 Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### server.connections
<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> 稳定性：0 - 已弃用：改为使用 [`server.getConnections()`][]。

在服务器端的并发连接数。

当通过 [`child_process.fork()`][] 向子进程发送套接字时，其值为 `null`。 To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)
<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* 返回：{net.Server}

异步获取服务器上的并发连接数。 当套接字被发送给子进程时工作。

回调函数应当接受两个参数：`err` 和 `count`。

### server.listen()

开启一个服务器来监听连接。 A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

可能的调用方式包括：

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] 适用于 [IPC](#net_ipc_support) 服务器
* <a href="#net_server_listen_port_host_backlog_callback">
  <code>server.listen([port[, host[, backlog]]][, callback])</code></a>
for TCP servers

此函数为异步的。 当服务器开始监听时，会发出 [`'listening'`][] 事件。 最后一个参数 `callback` 会被作为 [`'listening'`][] 事件的监听器添加。

所有 `listen()` 方法可以接受一个 `backlog` 参数来指定待连接队列的最大长度。 实际的长度将由操作系统的 sysctl 设置决定，例如：Linux 系统上的 `tcp_max_syn_backlog` 和 `somaxconn`。 此参数的默认值为 511 (而不是 512)。

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. Otherwise, an `ERR_SERVER_ALREADY_LISTEN` error will be thrown.

在监听时一个常见的错误就是 `EADDRINUSE`。 This happens when another server is already listening on the requested `port`/`path`/`handle`. 解决这个问题的一种方法就是在特定时间后重试：

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

开始一个服务器来监听给定 `handle` 上的连接，该 handle 已被绑定到端口，UNIX 域套接字，或 Windows 命名管道上。

`handle` 对象可以是一个服务器，套接字 (任何含有底层 `_handle` 成员的套接字)，或包含有效文件描述符 `fd` 的对象。

Listening on a file descriptor is not supported on Windows.

#### server.listen(options[, callback])
<!-- YAML
added: v0.11.14
-->

* `options` {Object} 必填。 支持如下属性：
  * `port` {number}
  * `host` {string}
  * `path` {string} 如果指定了 `port`，此选项会被忽略。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
  * `backlog` {number} [`server.listen()`][] 函数的通用参数。
  * `exclusive` {boolean} **默认值：** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Default:** `false`
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Default:** `false`
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

If `port` is specified, it behaves the same as
<a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. 否则，如果指定了 `path`，该方法的行为和 [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] 一样。 如果以上的参数都未指定，则会抛出错误。

如果 `exclusive` 的值为 `false` (默认值)，则集群的所有进程会使用同样的底层句柄，允许共享连接处理任务。 当 `exclusive` 的值为 `true` 时，不会共享句柄，尝试共享端口将会导致错误。 监听独立端口的示例如下。

```js
server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
```

Starting an IPC server as root may cause the server path to be inaccessible for unprivileged users. Using `readableAll` and `writableAll` will make the server accessible for all users.

#### server.listen(path\[, backlog\]\[, callback\])
<!-- YAML
added: v0.1.90
-->

* `path` {string} 服务器应当监听的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
* `backlog` {number} [`server.listen()`][] 函数的通用参数。
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

Start an [IPC](#net_ipc_support) server listening for connections on the given `path`.

#### server.listen(\[port[, host[, backlog]]\]\[, callback\])
<!-- YAML
added: v0.1.90
-->
* `port` {number}
* `host` {string}
* `backlog` {number} [`server.listen()`][] 函数的通用参数。
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

开始一个监听给定 `port` 和 `host` 上连接的 TCP 服务器。

如果未提供 `port` 参数或其值为 0，操作系统会随意分配一个未被使用的端口，该端口可在发出 [`'listening'`][] 事件后通过 `server.address().port` 来获取。

如果未提供 `host` 参数，当 IPv6 可用时，服务器会接受在 [未指定 IPv6 地址](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) 上的连接，否则会接受 [未指定 IPv4 地址](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) 上的连接。

In most operating systems, listening to the [unspecified IPv6 address](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) may cause the `net.Server` to also listen on the [unspecified IPv4 address](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`).

### server.listening
<!-- YAML
added: v5.7.0
-->

* {boolean} Indicates whether or not the server is listening for connections.

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

Opposite of `unref()`, calling `ref()` on a previously `unref`ed server will *not* let the program exit if it's the only server left (the default behavior). If the server is `ref`ed calling `ref()` again will have no effect.

### server.unref()
<!-- YAML
added: v0.9.1
-->

* 返回：{net.Server}

Calling `unref()` on a server will allow the program to exit if this is the only active server in the event system. If the server is already `unref`ed calling `unref()` again will have no effect.

## 类：net.Socket
<!-- YAML
added: v0.3.4
-->

此类为 TCP 套接字或流式 [IPC](#net_ipc_support) 端点的抽象 (在 Windows 平台上使用命名管道，在其他系统上使用 UNIX 域套接字)。 A `net.Socket` is also a [duplex stream](stream.html#stream_class_stream_duplex), so it can be both readable and writable, and it is also an [`EventEmitter`][].

`net.Socket` 可被用户创建，同时可被用于和服务器交互。 例如：它由 [`net.createConnection()`][] 返回，因此用户可以使用它和服务器通信。

它还可以由 Node.js 创建，并在接收到连接时传递给用户。 例如：它被传递给在 [`net.Server`][] 上发出的 [`'connection'`][] 事件的监听器，这样用户就可以使用它和客户端交互。

### new net.Socket([options])
<!-- YAML
added: v0.3.4
-->

* `options` {Object} Available options are:
  * `fd` {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
  * `allowHalfOpen` {boolean} 指示是否允许半打开的 TCP 连接。 请参阅 [`net.createServer()`][] 和 [`'end'`][] 事件以获取更多信息。 **默认:** `false`.
  * `readable` {boolean} 当接收了 `fd` 参数时，允许读取套接字，否则忽略之。 **默认:** `false`.
  * `writable` {boolean} 当接收了 `fd` 参数时，允许写入套接字，否则忽略之。 **默认:** `false`.
* 返回：{net.Socket}

创建一个新的套接字对象。

新创建的套接字可能是 TCP 套接字或流媒体 [IPC](#net_ipc_support) 端点，具体取决于它通过 [`connect()`][`socket.connect()`] 连接到哪里。

### 事件：'close'
<!-- YAML
added: v0.1.90
-->

* `hadError` {boolean} `true` if the socket had a transmission error.

在套接字完全关闭后发出此事件。 The argument `hadError` is a boolean which says if the socket was closed due to a transmission error.

### 事件：'connect'
<!-- YAML
added: v0.1.90
-->

当成功建立了套接字连接时发出此事件。 请参阅 [`net.createConnection()`][]。

### 事件：'data'
<!-- YAML
added: v0.1.90
-->

* {Buffer|string}

当收到数据时发出此事件。 `data` 参数是一个 `Buffer` 或 `String`。 Encoding of data is set by [`socket.setEncoding()`][].

注意：如果在 `Socket` 发出 `'data'` 事件时没有监听器，**数据将丢失**。

### 事件：'drain'
<!-- YAML
added: v0.1.90
-->

当写入缓冲区为空时发出此事件。 它可被用于控制上传。

See also: the return values of `socket.write()`.

### 事件：'end'
<!-- YAML
added: v0.1.90
-->

当套接字的另一端发送一个 FIN 包的时候会发出此事件，因此会结束套接字的读取端。

默认情况下 (`allowHalfOpen` 的值为 `false`)，一旦写出其待写入队列，套接字将会发送回一个 FIN 包，并销毁其文件描述符。 然而，如果 `allowHalfOpen` 的值被设为 `true`，套接字将不会自动通过调用 [`end()`][`socket.end()`] 结束其写入端，以允许用户写入任意数量的数据。 用户必须显式调用 [`end()`][`socket.end()`] 来关闭连接 (即：发送回一个 FIN 包)。

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

### Event: 'ready'
<!-- YAML
added: v9.11.0
-->

Emitted when a socket is ready to be used.

Triggered immediately after `'connect'`.

### 事件：'timeout'
<!-- YAML
added: v0.1.90
-->

当套接字由于闲置而超时时会发出此事件。 它只是通知套接字空闲。 用户必须手动关闭套接字。

See also: [`socket.setTimeout()`][].

### socket.address()
<!-- YAML
added: v0.1.90
-->

* 返回：{Object}

Returns the bound `address`, the address `family` name and `port` of the socket as reported by the operating system: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### socket.bufferSize
<!-- YAML
added: v0.3.8
-->

`net.Socket` 具有该属性，`socket.write()` 工作时需要它。 它可被用于帮助用户快速启动。 计算机无法一直跟上写入套接字的数据量 - 网络连接速度可能太慢了。 Node.js 会在内部对写入到套接字的数据排队，并在可能的时候将其发送出去。 (其内部实现是对套接字的文件描述符进行轮询以确认它是否为可写状态)。

这种内部缓冲的结果是可能造成内存的增长。 此属性显示即将被写入的当前缓冲的字符数。 (字符数大致等于要写入的字节数，但缓冲区中可能包含字符串，而字符串是惰性编码的，因此具体的字节数未知。)

对于面临大量或持续增长的 `bufferSize` 的用户而言，应在程序中使用 [`socket.pause()`][] 和 [`socket.resume()`][] 来控制数据流。

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

* [`socket.connect(options[, connectListener])`][`socket.connect(options)`]
* [`socket.connect(path[, connectListener])`][`socket.connect(path)`] for [IPC](#net_ipc_support) connections.
* [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] for TCP connections.
* 返回：{net.Socket} 套接字本身。

此函数为异步的。 当连接建立时，会发出 [`'connect'`][] 事件。 如果连接存在问题，将会发出 [`'error'`][] 事件，而不是 [`'connect'`][] 事件，同时错误会被传递给 [`'error'`][] 事件的监听器。 如果提供了最后一个参数 `connectListener` ，它将被作为 [`'connect'`][] 事件的监听器添加 **一次**。

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
* `connectListener` {Function} [`socket.connect()`][] 方法的通用参数。 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动一个到给定套接字的连接。 通常不需要此方法，应该通过 [`net.createConnection()`][] 来创建并打开套接字。 只有在实现自定义套接字时使用此方法。

对于 TCP 连接，可用的 `options` 包括：

* `port` {number} 必填。 套接字应连接到的端口。
* `host` {string} 套接字应连接到的主机。 **默认值：** `'localhost'`.
* `localAddress` {string} 套接字连接的本地地址。
* `localPort` {number} 套接字连接的本地端口。
* `family` {number}: Version of IP stack, can be either `4` or `6`. **Default:** `4`.
* `hints` {number} 可选的 [`dns.lookup()` hints][]。
* `lookup` {Function} 自定义查找函数。 **默认值：** [`dns.lookup()`][].

对于 [IPC](#net_ipc_support) 连接，可用的 `options` 包括：

* `path` {string} 必填。 客户端应连接到的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。 如果提供，则上文中针对 TCP 的选项将被忽略。

#### socket.connect(path[, connectListener])

* `path` {string} 客户端应连接到的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
* `connectListener` {Function} [`socket.connect()`][] 方法的通用参数。 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 [IPC](#net_ipc_support) 连接。

相当于使用 `{ path: path }` 作为 `options` 调用 [`socket.connect(options[, connectListener])`][`socket.connect(options)`] 的别名。

#### socket.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

* `port` {number} 客户端应连接到的端口。
* `host` {string} 客户端应连接到的主机。
* `connectListener` {Function} [`socket.connect()`][] 方法的通用参数。 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 TCP 连接。

相当于使用 `{port: port, host: host}` 作为 `options` 调用 [`socket.connect(options[, connectListener])`][`socket.connect(options)`] 的别名。

### socket.connecting
<!-- YAML
added: v6.1.0
-->

If `true`, [`socket.connect(options[, connectListener])`][`socket.connect(options)`] was called and has not yet finished. It will stay `true` until the socket becomes connected, then it is set to `false` and the `'connect'` event is emitted.  Note that the [`socket.connect(options[, connectListener])`][`socket.connect(options)`] callback is a listener for the `'connect'` event.

### socket.destroy([exception])
<!-- YAML
added: v0.1.90
-->

* `exception` {Object}
* 返回：{net.Socket}

确保在此套接字上没有更多的 I/O 活动。 只有在发生错误时才有必要 (解析错误等)。

如果指定了 `exception`，将会发出 [`'error'`][] 事件，同时该事件的所有监听器将会收到 `exception` 作为参数。

### socket.destroyed

* {boolean} Indicates if the connection is destroyed or not. 一旦连接被销毁，就不能再使用它传输任何数据。

### socket.end(\[data\]\[, encoding\][, callback])
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Only used when data is `string`. **默认值:**`‘utf8'`。
* `callback` {Function} Optional callback for when the socket is finished.
* 返回：{net.Socket} 套接字本身。

半关闭套接字。 即：它发送一个 FIN 数据包。 服务器可能仍会发送一些数据。

如果指定了 `data`，这就等同于调用 `socket.write(data, encoding)` 后再调用[`socket.end()`][]。

### socket.localAddress
<!-- YAML
added: v0.9.6
-->

代表远程客户端连接的本地 IP 地址字符串。 例如：对于监听 `'0.0.0.0'` 的服务器，如果客户端连接到 `'192.168.1.1'`，则 `socket.localAddress` 的值会是 `'192.168.1.1'`。

### socket.localPort
<!-- YAML
added: v0.9.6
-->

代表本地端口的数字。 For example, `80` or `21`.

### socket.pause()

* 返回：{net.Socket} 套接字本身。

暂停数据读取。 也就是说，不会发出 [`'data'`][] 事件。 在控制上传时非常有用。

### socket.pending
<!-- YAML
added: v10.16.0
-->

* {boolean}

This is `true` if the socket is not connected yet, either because `.connect()` has not yet been called or because it is still in the process of connecting (see [`socket.connecting`][]).

### socket.ref()
<!-- YAML
added: v0.9.1
-->

* 返回：{net.Socket} 套接字本身。

Opposite of `unref()`, calling `ref()` on a previously `unref`ed socket will *not* let the program exit if it's the only socket left (the default behavior). If the socket is `ref`ed calling `ref` again will have no effect.

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

代表远程端口的数字。 For example, `80` or `21`.

### socket.resume()

* 返回：{net.Socket} 套接字本身。

在调用 [`socket.pause()`][] 后恢复读取。

### socket.setEncoding([encoding])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string}
* 返回：{net.Socket} 套接字本身。

设置套接字的编码为 [Readable 流](stream.html#stream_class_stream_readable)。 See [`readable.setEncoding()`][] for more information.

### socket.setKeepAlive(\[enable\]\[, initialDelay\])
<!-- YAML
added: v0.1.92
-->

* `enable` {boolean} **Default:** `false`
* `initialDelay` {number} **Default:** `0`
* 返回：{net.Socket} 套接字本身。

启用/禁用长连接功能，并在首个长连接探针被发送到闲置套接字之前选择性的设置初始延迟。

设置 `initialDelay` (毫秒) 来设置收到的最后一个数据包和首个长连接探针之间的延迟。 Setting `0` for `initialDelay` will leave the value unchanged from the default (or previous) setting.

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

* `timeout` {number}
* `callback` {Function}
* 返回：{net.Socket} 套接字本身。

当套接字在 `timeout` 毫秒内无活动时将其设置为超时状态。 默认情况下，`net.Socket` 没有超时。

当空闲超时被触发时，套接字将会收到一个 [`'timeout'`][] 事件，但连接并不会被断开。 用户必须手动调用 [`socket.end()`][] 或 [`socket.destroy()`][] 来结束连接。

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

Calling `unref()` on a socket will allow the program to exit if this is the only active socket in the event system. If the socket is already `unref`ed calling `unref()` again will have no effect.

### socket.write(data\[, encoding\]\[, callback\])
<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer|Uint8Array}
* `encoding` {string} Only used when data is `string`. **Default:** `utf8`.
* `callback` {Function}
* 返回：{boolean}

通过套接字发送数据。 The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.

如果全部数据都被成功刷新到内核缓冲区，则返回 `true`。 如果全部或部分数据在用户内存中排队，则返回 `false`。 当缓冲区再次空闲时将会发出 [`'drain'`][] 事件。

当数据最终被写出时，可选的 `callback` 参数将被执行 - 这可能不会立即发生。

See `Writable` stream [`write()`](stream.html#stream_writable_write_chunk_encoding_callback) method for more information.

## net.connect()

[`net.createConnection()`][`net.createConnection()`] 的别名。

可能的调用方式包括：

* [`net.connect(options[, connectListener])`][`net.connect(options)`]
* [`net.connect(path[, connectListener])`][`net.connect(path)`] 针对 [IPC](#net_ipc_support) 的连接。
* [`net.connect(port[, host][, connectListener])`][`net.connect(port, host)`] 针对 TCP 的连接。

### net.connect(options[, connectListener])
<!-- YAML
added: v0.7.0
-->
* `options` {Object}
* `connectListener` {Function}

[`net.createConnection(options[, connectListener])`][`net.createConnection(options)`] 的别名。

### net.connect(path[, connectListener])
<!-- YAML
added: v0.1.90
-->
* `path` {string}
* `connectListener` {Function}

[`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] 的别名。

### net.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->
* `port` {number}
* `host` {string}
* `connectListener` {Function}

[`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] 的别名。

## net.createConnection()

一个创建新的 [`net.Socket`][] 的工厂函数，通过 [`socket.connect()`][] 立即初始化连接，然后返回启动连接的 `net.Socket`。

当连接建立时，在返回的套接字上会发出 [`'connect'`][] 事件。 如果提供了最后一个参数 `connectListener`，它将被作为 [`'connect'`][] 事件的监听器添加 **一次**。

可能的调用方式包括：

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] 针对 [IPC](#net_ipc_support) 的连接。
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] 针对 TCP 的连接。

The [`net.connect()`][] function is an alias to this function.

### net.createConnection(options[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `options` {Object} 必填。 将被传递给 [`new net.Socket([options])`][`new net.Socket(options)`] 调用和 [`socket.connect(options[, connectListener])`][`socket.connect(options)`] 方法。
* `connectListener` {Function} [`net.createConnection()`][] 函数的通用参数。 如果提供，将被作为返回套接字上 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

关于可用的 options，请参阅 [`new net.Socket([options])`][`new net.Socket(options)`] 和 [`socket.connect(options[, connectListener])`][`socket.connect(options)`]。

其他选项：

* 在创建套接字之后，但开始连接之前，如果设置了 `timeout` {number} ，它将被用于调用 [`socket.setTimeout(timeout)`][]。

如下是一个在 [`net.createServer()`][] 部分的响应服务器的客户端范例：

```js
const net = require('net');
const client = net.createConnection({ port: 8124 }, () => {
  // 'connect' listener
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

### net.createConnection(path[, connectListener])
<!-- YAML
added: v0.1.90
-->

* `path` {string} 套接字应连接到的路径。 将被传递到 [`socket.connect(path[, connectListener])`][`socket.connect(path)`]。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
* `connectListener` {Function} [`net.createConnection()`][] 函数的通用参数，在正在初始化套接字的 `'connect'` 事件上的 "once" 监听器。 将被传递到 [`socket.connect(path[, connectListener])`][`socket.connect(path)`]。
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

初始化一个 [IPC](#net_ipc_support) 连接。

此函数在所有选项都为默认值的情况下创建一个新的 [`net.Socket`][]，立刻通过 [`socket.connect(path[, connectListener])`][`socket.connect(path)`] 初始化连接，然后返回启动连接的 `net.Socket`。

### net.createConnection(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

* `port` {number} 套接字应连接到的端口。 将被传递给 [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]。
* `host` {string} 套接字应连接到的主机。 将被传递给 [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`]。 **默认值：** `'localhost'`.
* `connectListener` {Function} [`net.createConnection()`][] 函数的通用参数，在正在初始化套接字的 `'connect'` 事件上的 "once" 监听器。 将被传递给 [`socket.connect(path[, connectListener])`][`socket.connect(port, host)`]。
* 返回：{net.Socket} 用于启动连接的新创建的套接字。

初始化一个 TCP 连接。

此函数在所有选项都为默认值的情况下创建一个新的 [`net.Socket`][]，并通过 [`socket.connect(port[, host][, connectListener])`][`socket.connect(port, host)`] 立即初始化连接，最后返回开启连接的 `net.Socket`。

## net.createServer(\[options\]\[, connectionListener\])
<!-- YAML
added: v0.5.0
-->

* `options` {Object}
  * `allowHalfOpen` {boolean} 指示是否允许半打开的 TCP 连接。 **默认:** `false`.
  * `pauseOnConnect` {boolean} 指明在传入连接上是否暂停套接字。 **默认:** `false`.
* `connectionListener` {Function} 自动设为 [`'connection'`][] 事件的监听器。
* 返回：{net.Server}

创建一个新的 TCP 或 [IPC](#net_ipc_support) 服务器。

如果 `allowHalfOpen` 的值被设置为 `true`，当套接字的另一端发送了一个 FIN 数据包时，服务器只有在 [`socket.end()`][] 被显式调用时才会发回一个 FIN 数据包，直到此时连接才会半关闭 (不可读但可写)。 请参阅 [`'end'`][] 事件和 [RFC 1122](https://tools.ietf.org/html/rfc1122) (4.2.2.13 部分) 以获取更多信息。

如果 `pauseOnConnect` 的值设置为 `true`，则和每个接入连接相关的套接字将被暂停，且不能从其句柄读取数据。 这就允许在进程之间传递连接，而不需要原始进程读取任何数据。 要想从已暂停的套接字读取数，请调用 [`socket.resume()`][]。

The server can be a TCP server or an [IPC](#net_ipc_support) server, depending on what it [`listen()`][`server.listen()`] to.

这里是一个 TCP 响应服务器的例子，它监听端口 8124 上的连接：

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

To listen on the socket `/tmp/echo.sock` the third line from the last would just be changed to:

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

* `input` {string}
* 返回：{integer}

测试输入是否为 IP 地址。 Returns `0` for invalid strings, returns `4` for IP version 4 addresses, and returns `6` for IP version 6 addresses.

## net.isIPv4(input)
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* 返回：{boolean}

Returns `true` if input is a version 4 IP address, otherwise returns `false`.

## net.isIPv6(input)
<!-- YAML
added: v0.3.0
-->

* `input` {string}
* 返回：{boolean}

Returns `true` if input is a version 6 IP address, otherwise returns `false`.
