# 网络

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> 稳定性：2 - 稳定

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

可以通过如下方式使用：

```js
const net = require('net');
```

## IPC 支持

The `net` module supports IPC with named pipes on Windows, and UNIX domain sockets on other operating systems.

### 为 IPC 连接识别路径

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

在 UNIX 系统上，本地域也被称作 UNIX 域。 The path is a filesystem pathname. It gets truncated to `sizeof(sockaddr_un.sun_path) - 1`, which varies on different operating system between 91 and 107 bytes. 在 Linux 系统上的典型值是 107，在 macOS 系统上的典型值是 103。 The path is subject to the same naming conventions and permissions checks as would be done on file creation. If the UNIX domain socket (that is visible as a file system path) is created and used in conjunction with one of Node.js' API abstractions such as [`net.createServer()`][], it will be unlinked as part of [`server.close()`][]. On the other hand, if it is created and used outside of these abstractions, the user will need to manually remove it. The same applies when the path was created by a Node.js API but the program crashes abruptly. In short, a UNIX domain socket once successfully created will be visible in the filesystem, and will persist until unlinked.

在 Windows 系统上，本地域是通过命名管道实现的。 The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe`. Any characters are permitted, but the latter may do some processing of pipe names, such as resolving`..` sequences. Despite how it might look, the pipe namespace is flat. Pipes will *not persist*. They are removed when the last reference to them is closed. Unlike UNIX domain sockets, Windows will close and remove the pipe when the owning process exits.

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
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* 返回：{net.Server}

`net.Server` 是一个含有如下事件的 [`EventEmitter`][]。

### 事件：'close'

<!-- YAML
added: v0.5.0
-->

当服务器关闭时发出。 Note that if connections exist, this event is not emitted until all connections are ended.

### 事件：'connection'

<!-- YAML
added: v0.1.90
-->

* {net.Socket} 连接对象

当创建了新连接时会发出此事件。 `socket` is an instance of `net.Socket`.

### 事件：'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

当发生错误时会发出此事件。 Unlike [`net.Socket`][], the [`'close'`][] event will **not** be emitted directly following this event unless [`server.close()`][] is manually called. See the example in discussion of [`server.listen()`][].

### 事件：'listening'

<!-- YAML
added: v0.1.90
-->

当在调用 [`server.listen()`][] 后绑定了服务器时会发出此事件。

### server.address()

<!-- YAML
added: v0.1.90
-->

* 返回：{Object|string}

Returns the bound `address`, the address `family` name, and `port` of the server as reported by the operating system if listening on an IP socket (useful to find which port was assigned when getting an OS-assigned address): `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

For a server listening on a pipe or UNIX domain socket, the name is returned as a string.

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

Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. 当发生 `'close'` 事件时，可选的 `callback` 将被调用。 Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### server.connections

<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> 稳定性：0 - 已弃用：改为使用 [`server.getConnections()`][]。

在服务器端的并发连接数。

This becomes `null` when sending a socket to a child with [`child_process.fork()`][]. To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)

<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* 返回：{net.Server}

异步获取服务器上的并发连接数。 Works when sockets were sent to forks.

回调函数应当接受两个参数：`err` 和 `count`。

### server.listen()

开启一个服务器来监听连接。 A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

可能的调用方式包括：

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* [ `server.listen([port[, host[, backlog]]][, callback])`](#net_server_listen_port_host_backlog_callback) for TCP servers

此函数为异步的。 When the server starts listening, the [`'listening'`][] event will be emitted. The last parameter `callback` will be added as a listener for the [`'listening'`][] event.

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

Listening on a file descriptor is not supported on Windows.

#### server.listen(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `options` {Object} 必须的。 支持如下属性： 
  * `port` {number}
  * `host` {string}
  * `path` {string} 如果指定了 `port`，此选项会被忽略。 请参阅 [识别 IPC 连接的路径](#net_identifying_paths_for_ipc_connections)。
  * `backlog` {number} [`server.listen()`][] 函数的通用参数。
  * `exclusive` {boolean} **默认值：** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **默认值：** `false`
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **默认值：** `false`
* `callback` {Function} [`server.listen()`][] 函数的通用参数。
* 返回：{net.Server}

If `port` is specified, it behaves the same as <a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. Otherwise, if <code>path</code> is specified, it behaves the same as [<code>server.listen(path[, backlog][, callback])</code>][<code>server.listen(path)</code>]. 如果以上的参数都未指定，则会抛出错误。</p> 

<p>
  If <code>exclusive</code> is <code>false</code> (default), then cluster workers will use the same underlying handle, allowing connection handling duties to be shared. When <code>exclusive</code> is <code>true</code>, the handle is not shared, and attempted port sharing results in an error. An example which listens on an exclusive port is shown below.
</p>

<pre><code class="js">server.listen({
  host: 'localhost',
  port: 80,
  exclusive: true
});
</code></pre>

<p>
  Starting an IPC server as root may cause the server path to be inaccessible for unprivileged users. Using <code>readableAll</code> and <code>writableAll</code> will make the server accessible for all users.
</p>

<h4>
  server.listen(path\[, backlog\]\[, callback\])
</h4>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>path</code> {string} 服务器应当监听的路径。 请参阅 <a href="#net_identifying_paths_for_ipc_connections">识别 IPC 连接的路径</a>。
  </li>
  <li>
    <code>backlog</code> {number} [<code>server.listen()</code>][] 函数的通用参数。
  </li>
  <li>
    <code>callback</code> {Function} [<code>server.listen()</code>][] 函数的通用参数。
  </li>
  <li>
    返回：{net.Server}
  </li>
</ul>

<p>
  Start an <a href="#net_ipc_support">IPC</a> server listening for connections on the given <code>path</code>.
</p>

<h4>
  server.listen(\[port[, host[, backlog]]\]\[, callback\])
</h4>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>port</code> {number}
  </li>
  <li>
    <code>host</code> {string}
  </li>
  <li>
    <code>backlog</code> {number} [<code>server.listen()</code>][] 函数的通用参数。
  </li>
  <li>
    <code>callback</code> {Function} [<code>server.listen()</code>][] 函数的通用参数。
  </li>
  <li>
    返回：{net.Server}
  </li>
</ul>

<p>
  开始一个监听给定 <code>port</code> 和 <code>host</code> 上连接的 TCP 服务器。
</p>

<p>
  If <code>port</code> is omitted or is 0, the operating system will assign an arbitrary unused port, which can be retrieved by using <code>server.address().port</code> after the [<code>'listening'</code>][] event has been emitted.
</p>

<p>
  If <code>host</code> is omitted, the server will accept connections on the <a href="https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address">unspecified IPv6 address</a> (<code>::</code>) when IPv6 is available, or the <a href="https://en.wikipedia.org/wiki/0.0.0.0">unspecified IPv4 address</a> (<code>0.0.0.0</code>) otherwise.
</p>

<p>
  In most operating systems, listening to the <a href="https://en.wikipedia.org/wiki/IPv6_address#Unspecified_address">unspecified IPv6 address</a> (<code>::</code>) may cause the <code>net.Server</code> to also listen on the <a href="https://en.wikipedia.org/wiki/0.0.0.0">unspecified IPv4 address</a> (<code>0.0.0.0</code>).
</p>

<h3>
  server.listening
</h3>

<!-- YAML
added: v5.7.0
-->

<ul>
  <li>
    {boolean} Indicates whether or not the server is listening for connections.
  </li>
</ul>

<h3>
  server.maxConnections
</h3>

<!-- YAML
added: v0.2.0
-->

<p>
  Set this property to reject connections when the server's connection count gets high.
</p>

<p>
  It is not recommended to use this option once a socket has been sent to a child with [<code>child_process.fork()</code>][].
</p>

<h3>
  server.ref()
</h3>

<!-- YAML
added: v0.9.1
-->

<ul>
  <li>
    返回：{net.Server}
  </li>
</ul>

<p>
  Opposite of <code>unref()</code>, calling <code>ref()</code> on a previously <code>unref</code>ed server will <em>not</em> let the program exit if it's the only server left (the default behavior). If the server is <code>ref</code>ed calling <code>ref()</code> again will have no effect.
</p>

<h3>
  server.unref()
</h3>

<!-- YAML
added: v0.9.1
-->

<ul>
  <li>
    返回：{net.Server}
  </li>
</ul>

<p>
  Calling <code>unref()</code> on a server will allow the program to exit if this is the only active server in the event system. If the server is already <code>unref</code>ed calling <code>unref()</code> again will have no effect.
</p>

<h2>
  类：net.Socket
</h2>

<!-- YAML
added: v0.3.4
-->

<p>
  This class is an abstraction of a TCP socket or a streaming <a href="#net_ipc_support">IPC</a> endpoint (uses named pipes on Windows, and UNIX domain sockets otherwise). A <code>net.Socket</code> is also a <a href="stream.html#stream_class_stream_duplex">duplex stream</a>, so it can be both readable and writable, and it is also an [<code>EventEmitter</code>][].
</p>

<p>
  A <code>net.Socket</code> can be created by the user and used directly to interact with a server. For example, it is returned by [<code>net.createConnection()</code>][], so the user can use it to talk to the server.
</p>

<p>
  It can also be created by Node.js and passed to the user when a connection is received. For example, it is passed to the listeners of a [<code>'connection'</code>][] event emitted on a [<code>net.Server</code>][], so the user can use it to interact with the client.
</p>

<h3>
  new net.Socket([options])
</h3>

<!-- YAML
added: v0.3.4
-->

<ul>
  <li>
    <code>options</code> {Object} 可用的选项包括： <ul>
      <li>
        <code>fd</code> {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
      </li>
      <li>
        <code>allowHalfOpen</code> {boolean} Indicates whether half-opened TCP connections are allowed. See [<code>net.createServer()</code>][] and the [<code>'end'</code>][] event for details. <strong>默认:</strong> <code>false</code>.
      </li>
      <li>
        <code>readable</code> {boolean} Allow reads on the socket when an <code>fd</code> is passed, otherwise ignored. <strong>默认:</strong> <code>false</code>.
      </li>
      <li>
        <code>writable</code> {boolean} Allow writes on the socket when an <code>fd</code> is passed, otherwise ignored. <strong>默认:</strong> <code>false</code>.
      </li>
    </ul>
  </li>
  <li>
    返回：{net.Socket}
  </li>
</ul>

<p>
  创建一个新的套接字对象。
</p>

<p>
  The newly created socket can be either a TCP socket or a streaming <a href="#net_ipc_support">IPC</a> endpoint, depending on what it [<code>connect()</code>][<code>socket.connect()</code>] to.
</p>

<h3>
  事件：'close'
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>hadError</code> {boolean} <code>true</code> if the socket had a transmission error.
  </li>
</ul>

<p>
  在套接字完全关闭后发出此事件。 The argument <code>hadError</code> is a boolean which says if the socket was closed due to a transmission error.
</p>

<h3>
  事件：'connect'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  当成功建立了套接字连接时发出此事件。 请参阅 [<code>net.createConnection()</code>][]。
</p>

<h3>
  事件：'data'
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    {Buffer|string}
  </li>
</ul>

<p>
  当收到数据时发出此事件。 The argument <code>data</code> will be a <code>Buffer</code> or <code>String</code>. Encoding of data is set by [<code>socket.setEncoding()</code>][].
</p>

<p>
  Note that the <strong>data will be lost</strong> if there is no listener when a <code>Socket</code> emits a <code>'data'</code> event.
</p>

<h3>
  事件：'drain'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  当写入缓冲区为空时发出此事件。 它可被用于控制上传。
</p>

<p>
  请参阅：<code>socket.write()</code> 的返回值.
</p>

<h3>
  事件：'end'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  Emitted when the other end of the socket sends a FIN packet, thus ending the readable side of the socket.
</p>

<p>
  By default (<code>allowHalfOpen</code> is <code>false</code>) the socket will send a FIN packet back and destroy its file descriptor once it has written out its pending write queue. However, if <code>allowHalfOpen</code> is set to <code>true</code>, the socket will not automatically [<code>end()</code>][<code>socket.end()</code>] its writable side, allowing the user to write arbitrary amounts of data. The user must call [<code>end()</code>][<code>socket.end()</code>] explicitly to close the connection (i.e. sending a FIN packet back).
</p>

<h3>
  事件：'error'
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    {Error}
  </li>
</ul>

<p>
  当发生错误时会发出此事件。 The <code>'close'</code> event will be called directly following this event.
</p>

<h3>
  事件：'lookup'
</h3>

<!-- YAML
added: v0.11.3
changes:

  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

<p>
  在解析主机名后和连接前发出此事件。 不适用于 UNIX 套接字。
</p>

<ul>
  <li>
    <code>err</code> {Error|null} 错误对象。 请参阅 [<code>dns.lookup()</code>][]。
  </li>
  <li>
    <code>address</code> {string} IP 地址。
  </li>
  <li>
    <code>family</code> {string|null} 地址类型。 请参阅 [<code>dns.lookup()</code>][]。
  </li>
  <li>
    <code>host</code> {string} 主机名。
  </li>
</ul>

<h3>
  Event: 'ready'
</h3>

<!-- YAML
added: v9.11.0
-->

<p>
  Emitted when a socket is ready to be used.
</p>

<p>
  Triggered immediately after <code>'connect'</code>.
</p>

<h3>
  事件：'timeout'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  当套接字由于闲置而超时时会发出此事件。 This is only to notify that the socket has been idle. 用户必须手动关闭套接字。
</p>

<p>
  请参阅：[<code>socket.setTimeout()</code>][].
</p>

<h3>
  socket.address()
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    返回：{Object}
  </li>
</ul>

<p>
  Returns the bound <code>address</code>, the address <code>family</code> name and <code>port</code> of the socket as reported by the operating system: <code>{ port: 12346, family: 'IPv4', address: '127.0.0.1' }</code>
</p>

<h3>
  socket.bufferSize
</h3>

<!-- YAML
added: v0.3.8
-->

<p>
  <code>net.Socket</code> 具有该属性，<code>socket.write()</code> 工作时需要它。 This is to help users get up and running quickly. The computer cannot always keep up with the amount of data that is written to a socket - the network connection simply might be too slow. Node.js will internally queue up the data written to a socket and send it out over the wire when it is possible. (Internally it is polling on the socket's file descriptor for being writable).
</p>

<p>
  这种内部缓冲的结果是可能造成内存的增长。 This property shows the number of characters currently buffered to be written. (Number of characters is approximately equal to the number of bytes to be written, but the buffer may contain strings, and the strings are lazily encoded, so the exact number of bytes is not known.)
</p>

<p>
  Users who experience large or growing <code>bufferSize</code> should attempt to "throttle" the data flows in their program with [<code>socket.pause()</code>][] and [<code>socket.resume()</code>][].
</p>

<h3>
  socket.bytesRead
</h3>

<!-- YAML
added: v0.5.3
-->

<p>
  收到的字节数。
</p>

<h3>
  socket.bytesWritten
</h3>

<!-- YAML
added: v0.5.3
-->

<p>
  发送的字节数。
</p>

<h3>
  socket.connect()
</h3>

<p>
  启动一个到给定套接字的连接。
</p>

<p>
  可能的调用方式包括：
</p>

<ul>
  <li>
    [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>]
  </li>
  <li>
    [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(path)</code>] for <a href="#net_ipc_support">IPC</a> connections.
  </li>
  <li>
    [<code>socket.connect(port[, host][, connectListener])</code>][<code>socket.connect(port, host)</code>] for TCP connections.
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  此函数为异步的。 When the connection is established, the [<code>'connect'</code>][] event will be emitted. If there is a problem connecting, instead of a [<code>'connect'</code>][] event, an [<code>'error'</code>][] event will be emitted with the error passed to the [<code>'error'</code>][] listener. The last parameter <code>connectListener</code>, if supplied, will be added as a listener for the [<code>'connect'</code>][] event <strong>once</strong>.
</p>

<h4>
  socket.connect(options[, connectListener])
</h4>

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

<ul>
  <li>
    <code>options</code> {Object}
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of [<code>socket.connect()</code>][] methods. 将被作为 [<code>'connect'</code>][] 事件的监听器添加一次。
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  启动一个到给定套接字的连接。 Normally this method is not needed, the socket should be created and opened with [<code>net.createConnection()</code>][]. Use this only when implementing a custom Socket.
</p>

<p>
  对于 TCP 连接，可用的 <code>options</code> 包括：
</p>

<ul>
  <li>
    <code>port</code> {number} 必填。 套接字应连接到的端口。
  </li>
  <li>
    <code>host</code> {string} 套接字应连接到的主机。 <strong>默认值：</strong> <code>'localhost'</code>.
  </li>
  <li>
    <code>localAddress</code> {string} 套接字连接的本地地址。
  </li>
  <li>
    <code>localPort</code> {number} 套接字连接的本地端口。
  </li>
  <li>
    <code>family</code> {number}: Version of IP stack, can be either <code>4</code> or <code>6</code>. <strong>默认值：</strong> <code>4</code>.
  </li>
  <li>
    <code>hints</code> {number} 可选的 [<code>dns.lookup()</code> hints][]。
  </li>
  <li>
    <code>lookup</code> {Function} 自定义查找函数。 <strong>默认值：</strong> [<code>dns.lookup()</code>][].
  </li>
</ul>

<p>
  对于 <a href="#net_ipc_support">IPC</a> 连接，可用的 <code>options</code> 包括：
</p>

<ul>
  <li>
    <code>path</code> {string} 必填。 客户端应连接到的路径。 请参阅 <a href="#net_identifying_paths_for_ipc_connections">识别 IPC 连接的路径</a>。 If provided, the TCP-specific options above are ignored.
  </li>
</ul>

<h4>
  socket.connect(path[, connectListener])
</h4>

<ul>
  <li>
    <code>path</code> {string} 客户端应连接到的路径。 请参阅 <a href="#net_identifying_paths_for_ipc_connections">识别 IPC 连接的路径</a>。
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of [<code>socket.connect()</code>][] methods. 将被作为 [<code>'connect'</code>][] 事件的监听器添加一次。
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  启动给定套接字上的 <a href="#net_ipc_support">IPC</a> 连接。
</p>

<p>
  Alias to [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>] called with <code>{ path: path }</code> as <code>options</code>.
</p>

<h4>
  socket.connect(port\[, host\]\[, connectListener\])
</h4>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>port</code> {number} 客户端应连接到的端口。
  </li>
  <li>
    <code>host</code> {string} 客户端应连接到的主机。
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of [<code>socket.connect()</code>][] methods. 将被作为 [<code>'connect'</code>][] 事件的监听器添加一次。
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  启动给定套接字上的 TCP 连接。
</p>

<p>
  Alias to [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>] called with <code>{port: port, host: host}</code> as <code>options</code>.
</p>

<h3>
  socket.connecting
</h3>

<!-- YAML
added: v6.1.0
-->

<p>
  If <code>true</code>, [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>] was called and has not yet finished. It will stay <code>true</code> until the socket becomes connected, then it is set to <code>false</code> and the <code>'connect'</code> event is emitted. Note that the [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>] callback is a listener for the <code>'connect'</code> event.
</p>

<h3>
  socket.destroy([exception])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>exception</code> {Object}
  </li>
  <li>
    返回：{net.Socket}
  </li>
</ul>

<p>
  确保在此套接字上没有更多的 I/O 活动。 Only necessary in case of errors (parse error or so).
</p>

<p>
  If <code>exception</code> is specified, an [<code>'error'</code>][] event will be emitted and any listeners for that event will receive <code>exception</code> as an argument.
</p>

<h3>
  socket.destroyed
</h3>

<ul>
  <li>
    {boolean} Indicates if the connection is destroyed or not. Once a connection is destroyed no further data can be transferred using it.
  </li>
</ul>

<h3>
  socket.end(\[data\]\[, encoding\][, callback])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>data</code> {string|Buffer|Uint8Array}
  </li>
  <li>
    <code>encoding</code> {string} Only used when data is <code>string</code>. <strong>默认值:</strong><code>‘utf8'</code>。
  </li>
  <li>
    <code>callback</code> {Function} Optional callback for when the socket is finished.
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  半关闭套接字。 即：它发送一个 FIN 数据包。 It is possible the server will still send some data.
</p>

<p>
  If <code>data</code> is specified, it is equivalent to calling <code>socket.write(data, encoding)</code> followed by [<code>socket.end()</code>][].
</p>

<h3>
  socket.localAddress
</h3>

<!-- YAML
added: v0.9.6
-->

<p>
  The string representation of the local IP address the remote client is connecting on. For example, in a server listening on <code>'0.0.0.0'</code>, if a client connects on <code>'192.168.1.1'</code>, the value of <code>socket.localAddress</code> would be <code>'192.168.1.1'</code>.
</p>

<h3>
  socket.localPort
</h3>

<!-- YAML
added: v0.9.6
-->

<p>
  代表本地端口的数字。 For example, <code>80</code> or <code>21</code>.
</p>

<h3>
  socket.pause()
</h3>

<ul>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  暂停数据读取。 也就是说，不会发出 [<code>'data'</code>][] 事件。 在控制上传时非常有用。
</p>

<h3>
  socket.pending
</h3>

<!-- YAML
added: v10.16.0
-->

<ul>
  <li>
    {boolean}
  </li>
</ul>

<p>
  This is <code>true</code> if the socket is not connected yet, either because <code>.connect()</code> has not yet been called or because it is still in the process of connecting (see [<code>socket.connecting</code>][]).
</p>

<h3>
  socket.ref()
</h3>

<!-- YAML
added: v0.9.1
-->

<ul>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  Opposite of <code>unref()</code>, calling <code>ref()</code> on a previously <code>unref</code>ed socket will <em>not</em> let the program exit if it's the only socket left (the default behavior). If the socket is <code>ref</code>ed calling <code>ref</code> again will have no effect.
</p>

<h3>
  socket.remoteAddress
</h3>

<!-- YAML
added: v0.5.10
-->

<p>
  返回代表远程 IP 地址的字符串。 For example, <code>'74.125.127.100'</code> or <code>'2001:4860:a005::68'</code>. Value may be <code>undefined</code> if the socket is destroyed (for example, if the client disconnected).
</p>

<h3>
  socket.remoteFamily
</h3>

<!-- YAML
added: v0.11.14
-->

<p>
  返回代表远程 IP 系列的字符串。 <code>'IPv4'</code> 或 <code>'IPv6'</code>。
</p>

<h3>
  socket.remotePort
</h3>

<!-- YAML
added: v0.5.10
-->

<p>
  代表远程端口的数字。 For example, <code>80</code> or <code>21</code>.
</p>

<h3>
  socket.resume()
</h3>

<ul>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  在调用 [<code>socket.pause()</code>][] 后恢复读取。
</p>

<h3>
  socket.setEncoding([encoding])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>encoding</code> {string}
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  设置套接字的编码为 <a href="stream.html#stream_class_stream_readable">Readable 流</a>。 See [<code>readable.setEncoding()</code>][] for more information.
</p>

<h3>
  socket.setKeepAlive(\[enable\]\[, initialDelay\])
</h3>

<!-- YAML
added: v0.1.92
-->

<ul>
  <li>
    <code>enable</code> {boolean} <strong>Default:</strong> <code>false</code>
  </li>
  <li>
    <code>initialDelay</code> {number} <strong>Default:</strong> <code>0</code>
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  Enable/disable keep-alive functionality, and optionally set the initial delay before the first keepalive probe is sent on an idle socket.
</p>

<p>
  Set <code>initialDelay</code> (in milliseconds) to set the delay between the last data packet received and the first keepalive probe. Setting <code>0</code> for <code>initialDelay</code> will leave the value unchanged from the default (or previous) setting.
</p>

<h3>
  socket.setNoDelay([noDelay])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>noDelay</code> {boolean} <strong>Default:</strong> <code>true</code>
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  禁用 Nagle 算法。 By default TCP connections use the Nagle algorithm, they buffer data before sending it off. Setting <code>true</code> for <code>noDelay</code> will immediately fire off data each time <code>socket.write()</code> is called.
</p>

<h3>
  socket.setTimeout(timeout[, callback])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>timeout</code> {number}
  </li>
  <li>
    <code>callback</code> {Function}
  </li>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  Sets the socket to timeout after <code>timeout</code> milliseconds of inactivity on the socket. 默认情况下，<code>net.Socket</code> 没有超时。
</p>

<p>
  When an idle timeout is triggered the socket will receive a [<code>'timeout'</code>][] event but the connection will not be severed. The user must manually call [<code>socket.end()</code>][] or [<code>socket.destroy()</code>][] to end the connection.
</p>

<pre><code class="js">socket.setTimeout(3000);
socket.on('timeout', () =&gt; {
  console.log('socket timeout');
  socket.end();
});
</code></pre>

<p>
  如果 <code>timeout</code> 为 0，则现有的空闲超时会被禁用。
</p>

<p>
  The optional <code>callback</code> parameter will be added as a one-time listener for the [<code>'timeout'</code>][] event.
</p>

<h3>
  socket.unref()
</h3>

<!-- YAML
added: v0.9.1
-->

<ul>
  <li>
    返回：{net.Socket} 套接字本身。
  </li>
</ul>

<p>
  Calling <code>unref()</code> on a socket will allow the program to exit if this is the only active socket in the event system. If the socket is already <code>unref</code>ed calling <code>unref()</code> again will have no effect.
</p>

<h3>
  socket.write(data\[, encoding\]\[, callback\])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>data</code> {string|Buffer|Uint8Array}
  </li>
  <li>
    <code>encoding</code> {string} Only used when data is <code>string</code>. <strong>Default:</strong> <code>utf8</code>.
  </li>
  <li>
    <code>callback</code> {Function}
  </li>
  <li>
    返回：{boolean}
  </li>
</ul>

<p>
  通过套接字发送数据。 The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.
</p>

<p>
  Returns <code>true</code> if the entire data was flushed successfully to the kernel buffer. 如果全部或部分数据在用户内存中排队，则返回 <code>false</code>。 当缓冲区再次空闲时将会发出 [<code>'drain'</code>][] 事件。
</p>

<p>
  The optional <code>callback</code> parameter will be executed when the data is finally written out - this may not be immediately.
</p>

<p>
  See <code>Writable</code> stream <a href="stream.html#stream_writable_write_chunk_encoding_callback"><code>write()</code></a> method for more information.
</p>

<h2>
  net.connect()
</h2>

<p>
  Aliases to [<code>net.createConnection()</code>][<code>net.createConnection()</code>].
</p>

<p>
  可能的调用方式包括：
</p>

<ul>
  <li>
    [<code>net.connect(options[, connectListener])</code>][<code>net.connect(options)</code>]
  </li>
  <li>
    [<code>net.connect(path[, connectListener])</code>][<code>net.connect(path)</code>] for <a href="#net_ipc_support">IPC</a> connections.
  </li>
  <li>
    [<code>net.connect(port[, host][, connectListener])</code>][<code>net.connect(port, host)</code>] for TCP connections.
  </li>
</ul>

<h3>
  net.connect(options[, connectListener])
</h3>

<!-- YAML
added: v0.7.0
-->

<ul>
  <li>
    <code>options</code> {Object}
  </li>
  <li>
    <code>connectListener</code> {Function}
  </li>
</ul>

<p>
  Alias to [<code>net.createConnection(options[, connectListener])</code>][<code>net.createConnection(options)</code>].
</p>

<h3>
  net.connect(path[, connectListener])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>path</code> {string}
  </li>
  <li>
    <code>connectListener</code> {Function}
  </li>
</ul>

<p>
  Alias to [<code>net.createConnection(path[, connectListener])</code>][<code>net.createConnection(path)</code>].
</p>

<h3>
  net.connect(port\[, host\]\[, connectListener\])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>port</code> {number}
  </li>
  <li>
    <code>host</code> {string}
  </li>
  <li>
    <code>connectListener</code> {Function}
  </li>
</ul>

<p>
  Alias to [<code>net.createConnection(port[, host][, connectListener])</code>][<code>net.createConnection(port, host)</code>].
</p>

<h2>
  net.createConnection()
</h2>

<p>
  A factory function, which creates a new [<code>net.Socket</code>][], immediately initiates connection with [<code>socket.connect()</code>][], then returns the <code>net.Socket</code> that starts the connection.
</p>

<p>
  When the connection is established, a [<code>'connect'</code>][] event will be emitted on the returned socket. The last parameter <code>connectListener</code>, if supplied, will be added as a listener for the [<code>'connect'</code>][] event <strong>once</strong>.
</p>

<p>
  可能的调用方式包括：
</p>

<ul>
  <li>
    [<code>net.createConnection(options[, connectListener])</code>][<code>net.createConnection(options)</code>]
  </li>
  <li>
    [<code>net.createConnection(path[, connectListener])</code>][<code>net.createConnection(path)</code>] for <a href="#net_ipc_support">IPC</a> connections.
  </li>
  <li>
    [<code>net.createConnection(port[, host][, connectListener])</code>][<code>net.createConnection(port, host)</code>] for TCP connections.
  </li>
</ul>

<p>
  The [<code>net.connect()</code>][] function is an alias to this function.
</p>

<h3>
  net.createConnection(options[, connectListener])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>options</code> {Object} 必填。 Will be passed to both the [<code>new net.Socket([options])</code>][<code>new net.Socket(options)</code>] call and the [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>] method.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of the [<code>net.createConnection()</code>][] functions. If supplied, will be added as a listener for the [<code>'connect'</code>][] event on the returned socket once.
  </li>
  <li>
    返回：{net.Socket} 用于启动连接的新创建的套接字。
  </li>
</ul>

<p>
  For available options, see [<code>new net.Socket([options])</code>][<code>new net.Socket(options)</code>] and [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>].
</p>

<p>
  其他选项：
</p>

<ul>
  <li>
    <code>timeout</code> {number} If set, will be used to call [<code>socket.setTimeout(timeout)</code>][] after the socket is created, but before it starts the connection.
  </li>
</ul>

<p>
  Following is an example of a client of the echo server described in the [<code>net.createServer()</code>][] section:
</p>

<pre><code class="js">const net = require('net');
const client = net.createConnection({ port: 8124 }, () =&gt; {
  // 'connect' listener
  console.log('connected to server!');
  client.write('world!\r\n');
});
client.on('data', (data) =&gt; {
  console.log(data.toString());
  client.end();
});
client.on('end', () =&gt; {
  console.log('disconnected from server');
});
</code></pre>

<p>
  To connect on the socket <code>/tmp/echo.sock</code> the second line would just be changed to:
</p>

<pre><code class="js">const client = net.createConnection({ path: '/tmp/echo.sock' });
</code></pre>

<h3>
  net.createConnection(path[, connectListener])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>path</code> {string} 套接字应连接到的路径。 Will be passed to [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(path)</code>]. 请参阅 <a href="#net_identifying_paths_for_ipc_connections">识别 IPC 连接的路径</a>。
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of the [<code>net.createConnection()</code>][] functions, an "once" listener for the <code>'connect'</code> event on the initiating socket. Will be passed to [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(path)</code>].
  </li>
  <li>
    返回：{net.Socket} 用于启动连接的新创建的套接字。
  </li>
</ul>

<p>
  初始化一个 <a href="#net_ipc_support">IPC</a> 连接。
</p>

<p>
  This function creates a new [<code>net.Socket</code>][] with all options set to default, immediately initiates connection with [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(path)</code>], then returns the <code>net.Socket</code> that starts the connection.
</p>

<h3>
  net.createConnection(port\[, host\]\[, connectListener\])
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    <code>port</code> {number} 套接字应连接到的端口。 Will be passed to [<code>socket.connect(port[, host][, connectListener])</code>][<code>socket.connect(port, host)</code>].
  </li>
  <li>
    <code>host</code> {string} 套接字应连接到的主机。 Will be passed to [<code>socket.connect(port[, host][, connectListener])</code>][<code>socket.connect(port, host)</code>]. <strong>默认值：</strong> <code>'localhost'</code>.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of the [<code>net.createConnection()</code>][] functions, an "once" listener for the <code>'connect'</code> event on the initiating socket. Will be passed to [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(port, host)</code>].
  </li>
  <li>
    返回：{net.Socket} 用于启动连接的新创建的套接字。
  </li>
</ul>

<p>
  初始化一个 TCP 连接。
</p>

<p>
  This function creates a new [<code>net.Socket</code>][] with all options set to default, immediately initiates connection with [<code>socket.connect(port[, host][, connectListener])</code>][<code>socket.connect(port, host)</code>], then returns the <code>net.Socket</code> that starts the connection.
</p>

<h2>
  net.createServer(\[options\]\[, connectionListener\])
</h2>

<!-- YAML
added: v0.5.0
-->

<ul>
  <li>
    <code>options</code> {Object} <ul>
      <li>
        <code>allowHalfOpen</code> {boolean} Indicates whether half-opened TCP connections are allowed. <strong>默认:</strong> <code>false</code>.
      </li>
      <li>
        <code>pauseOnConnect</code> {boolean} Indicates whether the socket should be paused on incoming connections. <strong>默认:</strong> <code>false</code>.
      </li>
    </ul>
  </li>
  <li>
    <code>connectionListener</code> {Function} Automatically set as a listener for the [<code>'connection'</code>][] event.
  </li>
  <li>
    返回：{net.Server}
  </li>
</ul>

<p>
  创建一个新的 TCP 或 <a href="#net_ipc_support">IPC</a> 服务器。
</p>

<p>
  If <code>allowHalfOpen</code> is set to <code>true</code>, when the other end of the socket sends a FIN packet, the server will only send a FIN packet back when [<code>socket.end()</code>][] is explicitly called, until then the connection is half-closed (non-readable but still writable). See [<code>'end'</code>][] event and <a href="https://tools.ietf.org/html/rfc1122">RFC 1122</a> (section 4.2.2.13) for more information.
</p>

<p>
  If <code>pauseOnConnect</code> is set to <code>true</code>, then the socket associated with each incoming connection will be paused, and no data will be read from its handle. This allows connections to be passed between processes without any data being read by the original process. To begin reading data from a paused socket, call [<code>socket.resume()</code>][].
</p>

<p>
  The server can be a TCP server or an <a href="#net_ipc_support">IPC</a> server, depending on what it [<code>listen()</code>][<code>server.listen()</code>] to.
</p>

<p>
  Here is an example of an TCP echo server which listens for connections on port 8124:
</p>

<pre><code class="js">const net = require('net');
const server = net.createServer((c) =&gt; {
  // 'connection' listener
  console.log('client connected');
  c.on('end', () =&gt; {
    console.log('client disconnected');
  });
  c.write('hello\r\n');
  c.pipe(c);
});
server.on('error', (err) =&gt; {
  throw err;
});
server.listen(8124, () =&gt; {
  console.log('server bound');
});
</code></pre>

<p>
  可以通过 <code>telnet</code> 对其进行测试：
</p>

<pre><code class="console">$ telnet localhost 8124
</code></pre>

<p>
  To listen on the socket <code>/tmp/echo.sock</code> the third line from the last would just be changed to:
</p>

<pre><code class="js">server.listen('/tmp/echo.sock', () =&gt; {
  console.log('server bound');
});
</code></pre>

<p>
  使用 <code>nc</code> 连接到一个 UNIX 域套接字服务器：
</p>

<pre><code class="console">$ nc -U /tmp/echo.sock
</code></pre>

<h2>
  net.isIP(input)
</h2>

<!-- YAML
added: v0.3.0
-->

<ul>
  <li>
    <code>input</code> {string}
  </li>
  <li>
    返回：{integer}
  </li>
</ul>

<p>
  测试输入是否为 IP 地址。 Returns <code>0</code> for invalid strings, returns <code>4</code> for IP version 4 addresses, and returns <code>6</code> for IP version 6 addresses.
</p>

<h2>
  net.isIPv4(input)
</h2>

<!-- YAML
added: v0.3.0
-->

<ul>
  <li>
    <code>input</code> {string}
  </li>
  <li>
    返回：{boolean}
  </li>
</ul>

<p>
  Returns <code>true</code> if input is a version 4 IP address, otherwise returns <code>false</code>.
</p>

<h2>
  net.isIPv6(input)
</h2>

<!-- YAML
added: v0.3.0
-->

<ul>
  <li>
    <code>input</code> {string}
  </li>
  <li>
    返回：{boolean}
  </li>
</ul>

<p>
  Returns <code>true</code> if input is a version 6 IP address, otherwise returns <code>false</code>.
</p>