# Net

<!--introduced_in=v0.10.0-->

<!--lint disable maximum-line-length-->

> درجة الإستقرار: 2 - مستقر

The `net` module provides an asynchronous network API for creating stream-based TCP or [IPC](#net_ipc_support) servers ([`net.createServer()`][]) and clients ([`net.createConnection()`][]).

It can be accessed using:

```js
const net = require('net');
```

## IPC Support

The `net` module supports IPC with named pipes on Windows, and UNIX domain sockets on other operating systems.

### Identifying paths for IPC connections

[`net.connect()`][], [`net.createConnection()`][], [`server.listen()`][] and [`socket.connect()`][] take a `path` parameter to identify IPC endpoints.

On UNIX, the local domain is also known as the UNIX domain. The path is a filesystem pathname. It gets truncated to `sizeof(sockaddr_un.sun_path) - 1`, which varies on different operating system between 91 and 107 bytes. The typical values are 107 on Linux and 103 on macOS. The path is subject to the same naming conventions and permissions checks as would be done on file creation. If the UNIX domain socket (that is visible as a file system path) is created and used in conjunction with one of Node.js' API abstractions such as [`net.createServer()`][], it will be unlinked as part of [`server.close()`][]. On the other hand, if it is created and used outside of these abstractions, the user will need to manually remove it. The same applies when the path was created by a Node.js API but the program crashes abruptly. In short, a UNIX domain socket once successfully created will be visible in the filesystem, and will persist until unlinked.

On Windows, the local domain is implemented using a named pipe. The path *must* refer to an entry in ``\\?\pipe\` or``\\.\pipe`. Any characters are permitted, but the latter may do some processing of pipe names, such as resolving`..` sequences. Despite how it might look, the pipe namespace is flat. Pipes will *not persist*. They are removed when the last reference to them is closed. Unlike UNIX domain sockets, Windows will close and remove the pipe when the owning process exits.

JavaScript string escaping requires paths to be specified with extra backslash escaping such as:

```js
net.createServer().listen(
  path.join('\\\\?\\pipe', process.cwd(), 'myctl'));
```

## Class: net.Server

<!-- YAML
added: v0.1.90
-->

This class is used to create a TCP or [IPC](#net_ipc_support) server.

### new net.Server(\[options\]\[, connectionListener\])

* `options` {Object} See [`net.createServer([options][, connectionListener])`][`net.createServer()`].
* `connectionListener` {Function} Automatically set as a listener for the [`'connection'`][] event.
* Returns: {net.Server}

`net.Server` is an [`EventEmitter`][] with the following events:

### Event: 'close'

<!-- YAML
added: v0.5.0
-->

Emitted when the server closes. Note that if connections exist, this event is not emitted until all connections are ended.

### Event: 'connection'

<!-- YAML
added: v0.1.90
-->

* {net.Socket} The connection object

Emitted when a new connection is made. `socket` is an instance of `net.Socket`.

### Event: 'error'

<!-- YAML
added: v0.1.90
-->

* {Error}

Emitted when an error occurs. Unlike [`net.Socket`][], the [`'close'`][] event will **not** be emitted directly following this event unless [`server.close()`][] is manually called. See the example in discussion of [`server.listen()`][].

### Event: 'listening'

<!-- YAML
added: v0.1.90
-->

Emitted when the server has been bound after calling [`server.listen()`][].

### server.address()

<!-- YAML
added: v0.1.90
-->

* Returns: {Object|string}

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

Don't call `server.address()` until the `'listening'` event has been emitted.

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* `callback` {Function} Called when the server is closed
* Returns: {net.Server}

Stops the server from accepting new connections and keeps existing connections. This function is asynchronous, the server is finally closed when all connections are ended and the server emits a [`'close'`][] event. The optional `callback` will be called once the `'close'` event occurs. Unlike that event, it will be called with an `Error` as its only argument if the server was not open when it was closed.

### server.connections

<!-- YAML
added: v0.2.0
deprecated: v0.9.7
-->

> Stability: 0 - Deprecated: Use [`server.getConnections()`][] instead.

The number of concurrent connections on the server.

This becomes `null` when sending a socket to a child with [`child_process.fork()`][]. To poll forks and get current number of active connections, use asynchronous [`server.getConnections()`][] instead.

### server.getConnections(callback)

<!-- YAML
added: v0.9.7
-->

* `callback` {Function}
* Returns: {net.Server}

Asynchronously get the number of concurrent connections on the server. Works when sockets were sent to forks.

Callback should take two arguments `err` and `count`.

### server.listen()

Start a server listening for connections. A `net.Server` can be a TCP or an [IPC](#net_ipc_support) server depending on what it listens to.

Possible signatures:

* [`server.listen(handle[, backlog][, callback])`][`server.listen(handle)`]
* [`server.listen(options[, callback])`][`server.listen(options)`]
* [`server.listen(path[, backlog][, callback])`][`server.listen(path)`] for [IPC](#net_ipc_support) servers
* [ `server.listen([port[, host[, backlog]]][, callback])`](#net_server_listen_port_host_backlog_callback) for TCP servers

This function is asynchronous. When the server starts listening, the [`'listening'`][] event will be emitted. The last parameter `callback` will be added as a listener for the [`'listening'`][] event.

All `listen()` methods can take a `backlog` parameter to specify the maximum length of the queue of pending connections. The actual length will be determined by the OS through sysctl settings such as `tcp_max_syn_backlog` and `somaxconn` on Linux. The default value of this parameter is 511 (not 512).

All [`net.Socket`][] are set to `SO_REUSEADDR` (see [`socket(7)`][] for details).

The `server.listen()` method can be called again if and only if there was an error during the first `server.listen()` call or `server.close()` has been called. Otherwise, an `ERR_SERVER_ALREADY_LISTEN` error will be thrown.

One of the most common errors raised when listening is `EADDRINUSE`. This happens when another server is already listening on the requested `port`/`path`/`handle`. One way to handle this would be to retry after a certain amount of time:

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
* `backlog` {number} Common parameter of [`server.listen()`][] functions
* `callback` {Function} Common parameter of [`server.listen()`][] functions
* Returns: {net.Server}

Start a server listening for connections on a given `handle` that has already been bound to a port, a UNIX domain socket, or a Windows named pipe.

The `handle` object can be either a server, a socket (anything with an underlying `_handle` member), or an object with an `fd` member that is a valid file descriptor.

Listening on a file descriptor is not supported on Windows.

#### server.listen(options[, callback])

<!-- YAML
added: v0.11.14
-->

* `options` {Object} Required. Supports the following properties: 
  * `port` {number}
  * `host` {string}
  * `path` {string} Will be ignored if `port` is specified. See [Identifying paths for IPC connections](#net_identifying_paths_for_ipc_connections).
  * `backlog` {number} Common parameter of [`server.listen()`][] functions.
  * `exclusive` {boolean} **Default:** `false`
  * `readableAll` {boolean} For IPC servers makes the pipe readable for all users. **Default:** `false`
  * `writableAll` {boolean} For IPC servers makes the pipe writable for all users. **Default:** `false`
* `callback` {Function} Common parameter of [`server.listen()`][] functions.
* Returns: {net.Server}

If `port` is specified, it behaves the same as <a href="#net_server_listen_port_host_backlog_callback">
<code>server.listen([port[, host[, backlog]]][, callback])</code></a>. Otherwise, if <code>path</code> is specified, it behaves the same as [<code>server.listen(path[, backlog][, callback])</code>][<code>server.listen(path)</code>]. If none of them is specified, an error will be thrown.</p> 

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
    <code>path</code> {string} Path the server should listen to. See <a href="#net_identifying_paths_for_ipc_connections">Identifying paths for IPC connections</a>.
  </li>
  <li>
    <code>backlog</code> {number} Common parameter of [<code>server.listen()</code>][] functions.
  </li>
  <li>
    <code>callback</code> {Function} Common parameter of [<code>server.listen()</code>][] functions.
  </li>
  <li>
    Returns: {net.Server}
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
    <code>backlog</code> {number} Common parameter of [<code>server.listen()</code>][] functions.
  </li>
  <li>
    <code>callback</code> {Function} Common parameter of [<code>server.listen()</code>][] functions.
  </li>
  <li>
    Returns: {net.Server}
  </li>
</ul>

<p>
  Start a TCP server listening for connections on the given <code>port</code> and <code>host</code>.
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
    Returns: {net.Server}
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
    Returns: {net.Server}
  </li>
</ul>

<p>
  Calling <code>unref()</code> on a server will allow the program to exit if this is the only active server in the event system. If the server is already <code>unref</code>ed calling <code>unref()</code> again will have no effect.
</p>

<h2>
  Class: net.Socket
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
    <code>options</code> {Object} Available options are: <ul>
      <li>
        <code>fd</code> {number} If specified, wrap around an existing socket with the given file descriptor, otherwise a new socket will be created.
      </li>
      <li>
        <code>allowHalfOpen</code> {boolean} Indicates whether half-opened TCP connections are allowed. See [<code>net.createServer()</code>][] and the [<code>'end'</code>][] event for details. <strong>Default:</strong> <code>false</code>.
      </li>
      <li>
        <code>readable</code> {boolean} Allow reads on the socket when an <code>fd</code> is passed, otherwise ignored. <strong>Default:</strong> <code>false</code>.
      </li>
      <li>
        <code>writable</code> {boolean} Allow writes on the socket when an <code>fd</code> is passed, otherwise ignored. <strong>Default:</strong> <code>false</code>.
      </li>
    </ul>
  </li>
  <li>
    Returns: {net.Socket}
  </li>
</ul>

<p>
  Creates a new socket object.
</p>

<p>
  The newly created socket can be either a TCP socket or a streaming <a href="#net_ipc_support">IPC</a> endpoint, depending on what it [<code>connect()</code>][<code>socket.connect()</code>] to.
</p>

<h3>
  Event: 'close'
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
  Emitted once the socket is fully closed. The argument <code>hadError</code> is a boolean which says if the socket was closed due to a transmission error.
</p>

<h3>
  Event: 'connect'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  Emitted when a socket connection is successfully established. See [<code>net.createConnection()</code>][].
</p>

<h3>
  Event: 'data'
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
  Emitted when data is received. The argument <code>data</code> will be a <code>Buffer</code> or <code>String</code>. Encoding of data is set by [<code>socket.setEncoding()</code>][].
</p>

<p>
  Note that the <strong>data will be lost</strong> if there is no listener when a <code>Socket</code> emits a <code>'data'</code> event.
</p>

<h3>
  Event: 'drain'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  Emitted when the write buffer becomes empty. Can be used to throttle uploads.
</p>

<p>
  See also: the return values of <code>socket.write()</code>.
</p>

<h3>
  Event: 'end'
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
  Event: 'error'
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
  Emitted when an error occurs. The <code>'close'</code> event will be called directly following this event.
</p>

<h3>
  Event: 'lookup'
</h3>

<!-- YAML
added: v0.11.3
changes:

  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5598
    description: The `host` parameter is supported now.
-->

<p>
  Emitted after resolving the hostname but before connecting. Not applicable to UNIX sockets.
</p>

<ul>
  <li>
    <code>err</code> {Error|null} The error object. See [<code>dns.lookup()</code>][].
  </li>
  <li>
    <code>address</code> {string} The IP address.
  </li>
  <li>
    <code>family</code> {string|null} The address type. See [<code>dns.lookup()</code>][].
  </li>
  <li>
    <code>host</code> {string} The hostname.
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
  Event: 'timeout'
</h3>

<!-- YAML
added: v0.1.90
-->

<p>
  Emitted if the socket times out from inactivity. This is only to notify that the socket has been idle. The user must manually close the connection.
</p>

<p>
  See also: [<code>socket.setTimeout()</code>][].
</p>

<h3>
  socket.address()
</h3>

<!-- YAML
added: v0.1.90
-->

<ul>
  <li>
    Returns: {Object}
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
  <code>net.Socket</code> has the property that <code>socket.write()</code> always works. This is to help users get up and running quickly. The computer cannot always keep up with the amount of data that is written to a socket - the network connection simply might be too slow. Node.js will internally queue up the data written to a socket and send it out over the wire when it is possible. (Internally it is polling on the socket's file descriptor for being writable).
</p>

<p>
  The consequence of this internal buffering is that memory may grow. This property shows the number of characters currently buffered to be written. (Number of characters is approximately equal to the number of bytes to be written, but the buffer may contain strings, and the strings are lazily encoded, so the exact number of bytes is not known.)
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
  The amount of received bytes.
</p>

<h3>
  socket.bytesWritten
</h3>

<!-- YAML
added: v0.5.3
-->

<p>
  The amount of bytes sent.
</p>

<h3>
  socket.connect()
</h3>

<p>
  Initiate a connection on a given socket.
</p>

<p>
  Possible signatures:
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
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  This function is asynchronous. When the connection is established, the [<code>'connect'</code>][] event will be emitted. If there is a problem connecting, instead of a [<code>'connect'</code>][] event, an [<code>'error'</code>][] event will be emitted with the error passed to the [<code>'error'</code>][] listener. The last parameter <code>connectListener</code>, if supplied, will be added as a listener for the [<code>'connect'</code>][] event <strong>once</strong>.
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
    <code>connectListener</code> {Function} Common parameter of [<code>socket.connect()</code>][] methods. Will be added as a listener for the [<code>'connect'</code>][] event once.
  </li>
  <li>
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Initiate a connection on a given socket. Normally this method is not needed, the socket should be created and opened with [<code>net.createConnection()</code>][]. Use this only when implementing a custom Socket.
</p>

<p>
  For TCP connections, available <code>options</code> are:
</p>

<ul>
  <li>
    <code>port</code> {number} Required. Port the socket should connect to.
  </li>
  <li>
    <code>host</code> {string} Host the socket should connect to. <strong>Default:</strong> <code>'localhost'</code>.
  </li>
  <li>
    <code>localAddress</code> {string} Local address the socket should connect from.
  </li>
  <li>
    <code>localPort</code> {number} Local port the socket should connect from.
  </li>
  <li>
    <code>family</code> {number}: Version of IP stack, can be either <code>4</code> or <code>6</code>. <strong>Default:</strong> <code>4</code>.
  </li>
  <li>
    <code>hints</code> {number} Optional [<code>dns.lookup()</code> hints][].
  </li>
  <li>
    <code>lookup</code> {Function} Custom lookup function. <strong>Default:</strong> [<code>dns.lookup()</code>][].
  </li>
</ul>

<p>
  For <a href="#net_ipc_support">IPC</a> connections, available <code>options</code> are:
</p>

<ul>
  <li>
    <code>path</code> {string} Required. Path the client should connect to. See <a href="#net_identifying_paths_for_ipc_connections">Identifying paths for IPC connections</a>. If provided, the TCP-specific options above are ignored.
  </li>
</ul>

<h4>
  socket.connect(path[, connectListener])
</h4>

<ul>
  <li>
    <code>path</code> {string} Path the client should connect to. See <a href="#net_identifying_paths_for_ipc_connections">Identifying paths for IPC connections</a>.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of [<code>socket.connect()</code>][] methods. Will be added as a listener for the [<code>'connect'</code>][] event once.
  </li>
  <li>
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Initiate an <a href="#net_ipc_support">IPC</a> connection on the given socket.
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
    <code>port</code> {number} Port the client should connect to.
  </li>
  <li>
    <code>host</code> {string} Host the client should connect to.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of [<code>socket.connect()</code>][] methods. Will be added as a listener for the [<code>'connect'</code>][] event once.
  </li>
  <li>
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Initiate a TCP connection on the given socket.
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
    Returns: {net.Socket}
  </li>
</ul>

<p>
  Ensures that no more I/O activity happens on this socket. Only necessary in case of errors (parse error or so).
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
    <code>encoding</code> {string} Only used when data is <code>string</code>. <strong>Default:</strong> <code>'utf8'</code>.
  </li>
  <li>
    <code>callback</code> {Function} Optional callback for when the socket is finished.
  </li>
  <li>
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Half-closes the socket. i.e., it sends a FIN packet. It is possible the server will still send some data.
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
  The numeric representation of the local port. For example, <code>80</code> or <code>21</code>.
</p>

<h3>
  socket.pause()
</h3>

<ul>
  <li>
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Pauses the reading of data. That is, [<code>'data'</code>][] events will not be emitted. Useful to throttle back an upload.
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
    Returns: {net.Socket} The socket itself.
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
  The string representation of the remote IP address. For example, <code>'74.125.127.100'</code> or <code>'2001:4860:a005::68'</code>. Value may be <code>undefined</code> if the socket is destroyed (for example, if the client disconnected).
</p>

<h3>
  socket.remoteFamily
</h3>

<!-- YAML
added: v0.11.14
-->

<p>
  The string representation of the remote IP family. <code>'IPv4'</code> or <code>'IPv6'</code>.
</p>

<h3>
  socket.remotePort
</h3>

<!-- YAML
added: v0.5.10
-->

<p>
  The numeric representation of the remote port. For example, <code>80</code> or <code>21</code>.
</p>

<h3>
  socket.resume()
</h3>

<ul>
  <li>
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Resumes reading after a call to [<code>socket.pause()</code>][].
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
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Set the encoding for the socket as a <a href="stream.html#stream_class_stream_readable">Readable Stream</a>. See [<code>readable.setEncoding()</code>][] for more information.
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
    Returns: {net.Socket} The socket itself.
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
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Disables the Nagle algorithm. By default TCP connections use the Nagle algorithm, they buffer data before sending it off. Setting <code>true</code> for <code>noDelay</code> will immediately fire off data each time <code>socket.write()</code> is called.
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
    Returns: {net.Socket} The socket itself.
  </li>
</ul>

<p>
  Sets the socket to timeout after <code>timeout</code> milliseconds of inactivity on the socket. By default <code>net.Socket</code> do not have a timeout.
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
  If <code>timeout</code> is 0, then the existing idle timeout is disabled.
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
    Returns: {net.Socket} The socket itself.
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
    Returns: {boolean}
  </li>
</ul>

<p>
  Sends data on the socket. The second parameter specifies the encoding in the case of a string — it defaults to UTF8 encoding.
</p>

<p>
  Returns <code>true</code> if the entire data was flushed successfully to the kernel buffer. Returns <code>false</code> if all or part of the data was queued in user memory. [<code>'drain'</code>][] will be emitted when the buffer is again free.
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
  Possible signatures:
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
  Possible signatures:
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
    <code>options</code> {Object} Required. Will be passed to both the [<code>new net.Socket([options])</code>][<code>new net.Socket(options)</code>] call and the [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>] method.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of the [<code>net.createConnection()</code>][] functions. If supplied, will be added as a listener for the [<code>'connect'</code>][] event on the returned socket once.
  </li>
  <li>
    Returns: {net.Socket} The newly created socket used to start the connection.
  </li>
</ul>

<p>
  For available options, see [<code>new net.Socket([options])</code>][<code>new net.Socket(options)</code>] and [<code>socket.connect(options[, connectListener])</code>][<code>socket.connect(options)</code>].
</p>

<p>
  Additional options:
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
    <code>path</code> {string} Path the socket should connect to. Will be passed to [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(path)</code>]. See <a href="#net_identifying_paths_for_ipc_connections">Identifying paths for IPC connections</a>.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of the [<code>net.createConnection()</code>][] functions, an "once" listener for the <code>'connect'</code> event on the initiating socket. Will be passed to [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(path)</code>].
  </li>
  <li>
    Returns: {net.Socket} The newly created socket used to start the connection.
  </li>
</ul>

<p>
  Initiates an <a href="#net_ipc_support">IPC</a> connection.
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
    <code>port</code> {number} Port the socket should connect to. Will be passed to [<code>socket.connect(port[, host][, connectListener])</code>][<code>socket.connect(port, host)</code>].
  </li>
  <li>
    <code>host</code> {string} Host the socket should connect to. Will be passed to [<code>socket.connect(port[, host][, connectListener])</code>][<code>socket.connect(port, host)</code>]. <strong>Default:</strong> <code>'localhost'</code>.
  </li>
  <li>
    <code>connectListener</code> {Function} Common parameter of the [<code>net.createConnection()</code>][] functions, an "once" listener for the <code>'connect'</code> event on the initiating socket. Will be passed to [<code>socket.connect(path[, connectListener])</code>][<code>socket.connect(port, host)</code>].
  </li>
  <li>
    Returns: {net.Socket} The newly created socket used to start the connection.
  </li>
</ul>

<p>
  Initiates a TCP connection.
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
        <code>allowHalfOpen</code> {boolean} Indicates whether half-opened TCP connections are allowed. <strong>Default:</strong> <code>false</code>.
      </li>
      <li>
        <code>pauseOnConnect</code> {boolean} Indicates whether the socket should be paused on incoming connections. <strong>Default:</strong> <code>false</code>.
      </li>
    </ul>
  </li>
  <li>
    <code>connectionListener</code> {Function} Automatically set as a listener for the [<code>'connection'</code>][] event.
  </li>
  <li>
    Returns: {net.Server}
  </li>
</ul>

<p>
  Creates a new TCP or <a href="#net_ipc_support">IPC</a> server.
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
  Test this by using <code>telnet</code>:
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
  Use <code>nc</code> to connect to a UNIX domain socket server:
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
    Returns: {integer}
  </li>
</ul>

<p>
  Tests if input is an IP address. Returns <code>0</code> for invalid strings, returns <code>4</code> for IP version 4 addresses, and returns <code>6</code> for IP version 6 addresses.
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
    Returns: {boolean}
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
    Returns: {boolean}
  </li>
</ul>

<p>
  Returns <code>true</code> if input is a version 6 IP address, otherwise returns <code>false</code>.
</p>