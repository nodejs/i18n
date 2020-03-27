# 网络

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`net` 模块提供了一个异步网络 API，可用于创建基于流的 TCP 或 [IPC](#net_ipc_support) 服务器 ([`net.createServer()`][]) 和客户端 ([`net.createConnection()`][])。

它可以通过如下方式访问：

```js
const net = require('net');
```

## IPC 支持

`net` 模块支持 在 Windows 上使用命名管道 IPC ，及在其他操作系统上使用 UNIX 域套接字。

### 为 IPC 连接识别路径

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] 和 [`socket.connect()`][] 使用 `path` 参数来识别 IPC 端点。

在 UNIX 系统上，本地域也被称作 UNIX 域。 这里的 path 参数是一个文件系统路径名。 它会在 `sizeof(sockaddr_un.sun_path) - 1` 处被截断，具体长度会根据不同的操作系统而介于 91 和 107 个字节之间。 在 Linux 系统上的典型值是 107，在 macOS 系统上的典型值是 103。 该路径受到与创建文件时相同的命名约定和权限检查的影响。 它将在文件系统中可见，并将 *持续到取消链接的时候为止*。

在 Windows 系统上，本地域是通过命名管道实现的。 The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe\`. 路径中允许任何字符，但后面的字符可能会对管道名称进行处理，例如，解析 `..` 序列。 尽管如此，管道名称空间是扁平的。 管道将 *不会持续*，当最后一个引用关闭时，它们将被删除。 不要忘记 JavaScript 字符串转义需要通过双反斜杠来指定路径，例如：

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

当通过 [`child_process.fork()`][] 向子进程发送套接字时，其值为 `null`。 若要轮询子进程，并获取当前活跃连接数，请使用异步的 [`server.getConnections()`][] 方法。

### server.getConnections(callback)
<!-- YAML
added: v0.9.7
-->

* 返回：{net.Server}

异步获取服务器上的并发连接数。 当套接字被发送给子进程时工作。

回调函数应当接受两个参数：`err` 和 `count`。

### server.listen()

开启一个服务器来监听连接。 `net.Server` 可能会是 TCP 或 [IPC](#net_ipc_support) 服务器，具体取决于它在监听谁。

可能的调用方式包括：

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] 适用于 [IPC](#net_ipc_support) 服务器
* [`server.listen([port][, host][, backlog][, callback])`][`server.listen(port, host)`] 适用于 TCP 服务器

此函数为异步的。 当服务器开始监听时，会发出 [`'listening'`][] 事件。 最后一个参数 `callback` 会被作为 [`'listening'`][] 事件的监听器添加。

所有 `listen()` 方法可以接受一个 `backlog` 参数来指定待连接队列的最大长度。 实际的长度将由操作系统的 sysctl 设置决定，例如：Linux 系统上的 `tcp_max_syn_backlog` 和 `somaxconn`。 此参数的默认值为 511 (而不是 512)。


*注意*：

* 所有的 [`net.Socket`][] 被设置为 `SO_REUSEADDR` (请参阅 [socket(7)](http://man7.org/linux/man-pages/man7/socket.7.html) 以获取更多细节)。

* `server.listen()` 方法可被多次调用。 随后的每个调用都会使用提供的选项 *重新打开* 服务器。

在监听时一个常见的错误就是 `EADDRINUSE`。 当另一个服务器已经在监听正在请求的 `port` / `path` / `handle` 时，会发生这种错误。 解决这个问题的一种方法就是在特定时间后重试：

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

*注意*：在 Windows 系统上不支持对文件描述符的监听。

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
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

如果指定了 `port`，则该方法的行为和 [`server.listen([port][, hostname][, backlog][, callback])`][`server.listen(port, host)`] 一样。 否则，如果指定了 `path`，该方法的行为和 [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] 一样。 如果以上的参数都未指定，则会抛出错误。

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

* `path` {string} 服务器应当监听的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
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

如果未提供 `port` 参数或其值为 0，操作系统会随意分配一个未被使用的端口，该端口可在发出 [`'listening'`][] 事件后通过 `server.address().port` 来获取。

如果未提供 `host` 参数，当 IPv6 可用时，服务器会接受在 [未指定 IPv6 地址](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) 上的连接，否则会接受 [未指定 IPv4 地址](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`) 上的连接。

*注意*：在大多数操作系统上，监听 [未指定 IPv6 地址](https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address) (`::`) 会导致 `net.Server` 同时监听 [未指定 IPv4 地址](https://en.wikipedia.org/wiki/0.0.0.0) (`0.0.0.0`)。

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

此类为 TCP 套接字或流式 [IPC](#net_ipc_support) 端点的抽象 (在 Windows 平台上使用命名管道，在其他系统上使用 UNIX 域套接字)。 `net.Socket` 同时也是一个 [duplex 流](stream.html#stream_class_stream_duplex)，因此它可被读写，同时它也是一个 [`EventEmitter`][]。

`net.Socket` 可被用户创建，同时可被用于和服务器交互。 例如：它由 [`net.createConnection()`][] 返回，因此用户可以使用它和服务器通信。

它还可以由 Node.js 创建，并在接收到连接时传递给用户。 例如：它被传递给在 [`net.Server`][] 上发出的 [`'connection'`][] 事件的监听器，这样用户就可以使用它和客户端交互。

### new net.Socket([options])
<!-- YAML
added: v0.3.4
-->

创建一个新的套接字对象。

* `options` {Object} Available options are:
  * `fd`: {number} 如果指定，使用给定的文件描述符来包装现有的套接字，否则将会创建一个新的套接字。
  * `allowHalfOpen` {boolean} 指示是否允许半打开的 TCP 连接。 请参阅 [`net.createServer()`][] 和 [`'end'`][] 事件以获取更多信息。 **默认:** `false`.
  * `readable` {boolean} 当接收了 `fd` 参数时，允许读取套接字，否则忽略之。 **默认:** `false`.
  * `writable` {boolean} 当接收了 `fd` 参数时，允许写入套接字，否则忽略之。 **默认:** `false`.
* 返回：{net.Socket}

新创建的套接字可能是 TCP 套接字或流媒体 [IPC](#net_ipc_support) 端点，具体取决于它通过 [`connect()`][`socket.connect()`] 连接到哪里。

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

* [socket.connect(options[, connectListener])][`socket.connect(options)`]
* [socket.connect(path[, connectListener])][`socket.connect(path)`] 针对 [IPC](#net_ipc_support) 的连接。
* \[socket.connect(port[, host\]\[, connectListener\])][`socket.connect(port, host)`] 针对 TCP 的连接。
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

返回 `socket`。

#### socket.connect(path[, connectListener])

* `path` {string} 客户端应连接到的路径。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
* `connectListener` {Function} [`socket.connect()`][] 方法的通用参数。 将被作为 [`'connect'`][] 事件的监听器添加一次。
* 返回：{net.Socket} 套接字本身。

启动给定套接字上的 [IPC](#net_ipc_support) 连接。

相当于使用 `{ path: path }` 作为 `options` 调用 [`socket.connect(options[, connectListener])`][`socket.connect(options)`] 的别名。

返回 `socket`。

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

返回 `socket`。

### socket.connecting
<!-- YAML
added: v6.1.0
-->

如果其值为 `true` - 表示 [`socket.connect(options[, connectListener])`][`socket.connect(options)`] 被调用但尚未完成。 在发出 `connect` 事件和/或调用 [`socket.connect(options[, connectListener])`][`socket.connect(options)`] 的回调函数之前，其值将被设为 `false`。

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

如果在事件系统中此套接字为唯一活跃的套接字，在套接字上调用 `unref` 将允许程序退出。 如果已经在套接字上调用过 `unref`，再次调用 `unref` 将不会产生任何影响。

### socket.write(data\[, encoding\]\[, callback\])
<!-- YAML
added: v0.1.90
-->

通过套接字发送数据。 The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.

如果全部数据都被成功刷新到内核缓冲区，则返回 `true`。 如果全部或部分数据在用户内存中排队，则返回 `false`。 当缓冲区再次空闲时将会发出 [`'drain'`][] 事件。

当数据最终被写出时，可选的 `callback` 参数将被执行 - 这可能不会立即发生。

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
[

`net.createConnection(options[, connectListener])`][`net.createConnection(options)`] 的别名。

### net.connect(path[, connectListener])
<!-- YAML
added: v0.1.90
-->

[`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] 的别名。

### net.connect(port\[, host\]\[, connectListener\])
<!-- YAML
added: v0.1.90
-->

[`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] 的别名。

## net.createConnection()

一个创建新的 [`net.Socket`][] 的工厂函数，通过 [`socket.connect()`][] 立即初始化连接，然后返回启动连接的 `net.Socket`。

当连接建立时，在返回的套接字上会发出 [`'connect'`][] 事件。 如果提供了最后一个参数 `connectListener`，它将被作为 [`'connect'`][] 事件的监听器添加 **一次**。

可能的调用方式包括：

* [`net.createConnection(options[, connectListener])`][`net.createConnection(options)`]
* [`net.createConnection(path[, connectListener])`][`net.createConnection(path)`] 针对 [IPC](#net_ipc_support) 的连接。
* [`net.createConnection(port[, host][, connectListener])`][`net.createConnection(port, host)`] 针对 TCP 的连接。

*注意*：[`net.connect()`][] 函数是此函数的别名。

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

创建一个新的 TCP 或 [IPC](#net_ipc_support) 服务器。

* `options` {Object}
  * `allowHalfOpen` {boolean} 指示是否允许半打开的 TCP 连接。 **默认:** `false`.
  * `pauseOnConnect` {boolean} 指明在传入连接上是否暂停套接字。 **默认:** `false`.
* `connectionListener` {Function} 自动设为 [`'connection'`][] 事件的监听器。
* 返回：{net.Server}

如果 `allowHalfOpen` 的值被设置为 `true`，当套接字的另一端发送了一个 FIN 数据包时，服务器只有在 [`socket.end()`][] 被显式调用时才会发回一个 FIN 数据包，直到此时连接才会半关闭 (不可读但可写)。 请参阅 [`'end'`][] 事件和 [RFC 1122](https://tools.ietf.org/html/rfc1122) (4.2.2.13 部分) 以获取更多信息。

如果 `pauseOnConnect` 的值设置为 `true`，则和每个接入连接相关的套接字将被暂停，且不能从其句柄读取数据。 这就允许在进程之间传递连接，而不需要原始进程读取任何数据。 要想从已暂停的套接字读取数，请调用 [`socket.resume()`][]。

服务器可以是 TCP 服务器或 [IPC](#net_ipc_support) 服务器，具体取决于它通过 [`listen()`][`server.listen()`] 监听哪里。

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
