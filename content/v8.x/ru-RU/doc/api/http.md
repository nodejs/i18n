# HTTP

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Для использования сервера и клиента HTTP необходимо подключить `require('http')`.

The HTTP interfaces in Node.js are designed to support many features of the protocol which have been traditionally difficult to use. Особенно больших сообщений, которые, возможно, закодированы фрагментами. The interface is careful to never buffer entire requests or responses — the user is able to stream data.

Заголовки HTTP сообщений представлены объектом такого типа:

```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Ключи в нижнем регистре. Значения не меняются.

In order to support the full spectrum of possible HTTP applications, Node.js's HTTP API is very low-level. It deals with stream handling and message parsing only. It parses a message into headers and body but it does not parse the actual headers or the body.

Для более подробной информации, как обрабатывать дублированные заголовки, смотрите [`message.headers`][].

The raw headers as they were received are retained in the `rawHeaders` property, which is an array of `[key, value, key2, value2, ...]`. For example, the previous message header object might have a `rawHeaders` list like the following:

```js
[ 'ConTent-Length', '123456',
  'content-LENGTH', '123',
  'content-type', 'text/plain',
  'CONNECTION', 'keep-alive',
  'Host', 'mysite.com',
  'accepT', '*/*' ]
```

## Class: http.Agent<!-- YAML
added: v0.3.4
-->An 

`Agent` is responsible for managing connection persistence and reuse for HTTP clients. It maintains a queue of pending requests for a given host and port, reusing a single socket connection for each until the queue is empty, at which time the socket is either destroyed or put into a pool where it is kept to be used again for requests to the same host and port. Whether it is destroyed or pooled depends on the `keepAlive` [option](#http_new_agent_options).

Pooled connections have TCP Keep-Alive enabled for them, but servers may still close idle connections, in which case they will be removed from the pool and a new connection will be made when a new HTTP request is made for that host and port. Servers may also refuse to allow multiple requests over the same connection, in which case the connection will have to be remade for every request and cannot be pooled. The `Agent` will still make the requests to that server, but each one will occur over a new connection.

When a connection is closed by the client or the server, it is removed from the pool. Any unused sockets in the pool will be unrefed so as not to keep the Node.js process running when there are no outstanding requests. (смотрите [socket.unref()](net.html#net_socket_unref)).

It is good practice, to [`destroy()`][] an `Agent` instance when it is no longer in use, because unused sockets consume OS resources.

Sockets are removed from an agent when the socket emits either a `'close'` event or an `'agentRemove'` event. When intending to keep one HTTP request open for a long time without keeping it in the agent, something like the following may be done:

```js
http.get(options, (res) => {
  // Do stuff
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

An agent may also be used for an individual request. By providing `{agent: false}` as an option to the `http.get()` or `http.request()` functions, a one-time use `Agent` with default options will be used for the client connection.

`agent:false`:

```js
http.get({
  hostname: 'localhost',
  port: 80,
  path: '/',
  agent: false  // create a new agent just for this one request
}, (res) => {
  // Do stuff with response
});
```

### new Agent([options])<!-- YAML
added: v0.3.4
-->

* `options` {Object} Set of configurable options to set on the agent. Может иметь следующие поля:
  
  * `keepAlive` {boolean} Keep sockets around even when there are no outstanding requests, so they can be used for future requests without having to reestablish a TCP connection. **По умолчанию:** `false`.
  * `keepAliveMsecs` {number} When using the `keepAlive` option, specifies the [initial delay](net.html#net_socket_setkeepalive_enable_initialdelay) for TCP Keep-Alive packets. Ignored when the `keepAlive` option is `false` or `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Maximum number of sockets to allow per host. **Default:** `Infinity`.
  * `maxFreeSockets` {number} Maximum number of sockets to leave open in a free state. Уместно, только если `keepAlive` установлено на `true`. **Default:** `256`.

The default [`http.globalAgent`][] that is used by [`http.request()`][] has all of these values set to their respective defaults.

To configure any of them, a custom [`http.Agent`][] instance must be created.

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### agent.createConnection(options[, callback])<!-- YAML
added: v0.11.4
-->

* `options` {Object} Параметры, содержащие детали подключения. Check [`net.createConnection()`][] for the format of the options

* `callback` {Function} Функция обратного вызова, которая получает созданный сокет

* Возвращает: {net.Socket}

Создает сокет/поток, который будет использоваться для HTTP запросов.

По умолчанию эта функция схожа с [`net.createConnection()`][]. However, custom agents may override this method in case greater flexibility is desired.

A socket/stream can be supplied in one of two ways: by returning the socket/stream from this function, or by passing the socket/stream to `callback`.

`callback` имеет сигнатуру `(err, stream)`.

### agent.keepSocketAlive(socket)<!-- YAML
added: v8.1.0
-->

* `socket` {net.Socket}

Called when `socket` is detached from a request and could be persisted by the Agent. Поведение по умолчанию:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Этот метод может быть переопределен с помощью особого подкласса `Agent`. If this method returns a falsy value, the socket will be destroyed instead of persisting it for use with the next request.

### agent.reuseSocket(socket, request)<!-- YAML
added: v8.1.0
-->

* `socket` {net.Socket}

* `request` {http.ClientRequest}

Called when `socket` is attached to `request` after being persisted because of the keep-alive options. Поведение по умолчанию:

```js
socket.ref();
```

Этот метод может быть переопределен с помощью особого подкласса `Agent`.

### agent.destroy()<!-- YAML
added: v0.11.4
-->Destroy any sockets that are currently in use by the agent.

Обычно это делать не нужно. However, if using an agent with `keepAlive` enabled, then it is best to explicitly shut down the agent when it will no longer be used. Otherwise, sockets may hang open for quite a long time before the server terminates them.

### agent.freeSockets<!-- YAML
added: v0.11.4
-->

* {Object}

An object which contains arrays of sockets currently awaiting use by the agent when `keepAlive` is enabled. Не изменять.

### agent.getName(options)

<!-- YAML
added: v0.11.4
-->

* `опции` {Object} Набор опций, предоставляющих информацию для генерации имени 
  * `host` {string} Доменное имя или IP-адрес сервера, на который нужно отправить запрос
  * `port` {number} Порт удаленного сервера
  * `localAddress` {string} Local interface to bind for network connections when issuing the request
  * `family` {integer} Must be 4 or 6 if this doesn't equal `undefined`.
* Возвращает: {string}

Get a unique name for a set of request options, to determine whether a connection can be reused. For an HTTP agent, this returns `host:port:localAddress` or `host:port:localAddress:family`. For an HTTPS agent, the name includes the CA, cert, ciphers, and other HTTPS/TLS-specific options that determine socket reusability.

### agent.maxFreeSockets<!-- YAML
added: v0.11.7
-->

* {number}

По умолчанию установлено на 256. For agents with `keepAlive` enabled, this sets the maximum number of sockets that will be left open in the free state.

### agent.maxSockets<!-- YAML
added: v0.3.6
-->

* {number}

По умолчанию установлено на бесконечность. Determines how many concurrent sockets the agent can have open per origin. Origin is the returned value of [`agent.getName()`][].

### agent.requests<!-- YAML
added: v0.5.9
-->

* {Object}

An object which contains queues of requests that have not yet been assigned to sockets. Не изменять.

### agent.sockets

<!-- YAML
added: v0.3.6
-->

* {Object}

An object which contains arrays of sockets currently in use by the agent. Не изменять.

## Class: http.ClientRequest<!-- YAML
added: v0.1.17
-->This object is created internally and returned from [

`http.request()`][]. It represents an *in-progress* request whose header has already been queued. The header is still mutable using the [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][] API. The actual header will be sent along with the first data chunk or when calling [`request.end()`][].

Чтобы получить ответ, добавьте слушатель для [`'response'`][] к объекту запроса. [`'response'`][] will be emitted from the request object when the response headers have been received. The [`'response'`][] event is executed with one argument which is an instance of [`http.IncomingMessage`][].

During the [`'response'`][] event, one can add listeners to the response object; particularly to listen for the `'data'` event.

If no [`'response'`][] handler is added, then the response will be entirely discarded. However, if a [`'response'`][] event handler is added, then the data from the response object **must** be consumed, either by calling `response.read()` whenever there is a `'readable'` event, or by adding a `'data'` handler, or by calling the `.resume()` method. Пока данные не будут использованы, событие `'end'` не будет запущено. Also, until the data is read it will consume memory that can eventually lead to a 'process out of memory' error.

*Note*: Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

Запрос реализует интерфейс [Writable Stream](stream.html#stream_class_stream_writable). Это [`EventEmitter`][] со следующими событиями:

### Event: 'abort'<!-- YAML
added: v1.4.1
-->Emitted when the request has been aborted by the client. This event is only emitted on the first call to 

`abort()`.

### Событие: 'connect'<!-- YAML
added: v0.7.0
-->

* `response` {http.IncomingMessage}

* `socket` {net.Socket}

* `head` {Buffer}

Генерируется каждый раз, когда сервер отвечает на запрос методом `CONNECT`. If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

A client and server pair demonstrating how to listen for the `'connect'` event:

```js
const http = require('http');
const net = require('net');
const url = require('url');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
proxy.on('connect', (req, cltSocket, head) => {
  // connect to an origin server
  const srvUrl = url.parse(`http://${req.url}`);
  const srvSocket = net.connect(srvUrl.port, srvUrl.hostname, () => {
    cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    srvSocket.write(head);
    srvSocket.pipe(cltSocket);
    cltSocket.pipe(srvSocket);
  });
});

// now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {

  // make a request to a tunneling proxy
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    method: 'CONNECT',
    path: 'www.google.com:80'
  };

  const req = http.request(options);
  req.end();

  req.on('connect', (res, socket, head) => {
    console.log('got connected!');

    // make a request over an HTTP tunnel
    socket.write('GET / HTTP/1.1\r\n' +
                 'Host: www.google.com:80\r\n' +
                 'Connection: close\r\n' +
                 '\r\n');
    socket.on('data', (chunk) => {
      console.log(chunk.toString());
    });
    socket.on('end', () => {
      proxy.close();
    });
  });
});
```

### Event: 'continue'<!-- YAML
added: v0.3.2
-->Emitted when the server sends a '100 Continue' HTTP response, usually because the request contained 'Expect: 100-continue'. This is an instruction that the client should send the request body.

### Событие: 'response'<!-- YAML
added: v0.1.0
-->

* `response` {http.IncomingMessage}

Генерируется, когда получен ответ на этот запрос. This event is emitted only once.

### Событие: 'socket'<!-- YAML
added: v0.5.3
-->

* `socket` {net.Socket}

Генерируется после назначения сокета на этот запрос.

### Event: 'timeout'<!-- YAML
added: v0.7.8
-->Emitted when the underlying socket times out from inactivity. This only notifies that the socket has been idle. The request must be aborted manually.

See also: [`request.setTimeout()`][]

### Событие: 'upgrade'<!-- YAML
added: v0.1.94
-->

* `response` {http.IncomingMessage}

* `socket` {net.Socket}

* `head` {Buffer}

Создается каждый раз, когда сервер отвечает на запрос с обновлением. If this event is not being listened for, clients receiving an upgrade header will have their connections closed.

A client server pair demonstrating how to listen for the `'upgrade'` event.

```js
const http = require('http');

// Create an HTTP server
const srv = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
srv.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');

  socket.pipe(socket); // echo back
});

// now that server is running
srv.listen(1337, '127.0.0.1', () => {

  // make a request
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket'
    }
  };

  const req = http.request(options);
  req.end();

  req.on('upgrade', (res, socket, upgradeHead) => {
    console.log('got upgraded!');
    socket.end();
    process.exit(0);
  });
});
```

### request.abort()<!-- YAML
added: v0.3.8
-->Marks the request as aborting. Calling this will cause remaining data in the response to be dropped and the socket to be destroyed.

### request.aborted<!-- YAML
added: v0.11.14
-->If a request has been aborted, this value is the time when the request was aborted, in milliseconds since 1 January 1970 00:00:00 UTC.

### request.connection<!-- YAML
added: v0.3.0
-->

* {net.Socket}

See [`request.socket`][]

### request.end(\[data[, encoding]\]\[, callback\])<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer}

* `encoding` {string}

* `callback` {Function}

Завершает отправку запроса. If any parts of the body are unsent, it will flush them to the stream. If the request is chunked, this will send the terminating `'0\r\n\r\n'`.

If `data` is specified, it is equivalent to calling [`request.write(data, encoding)`][] followed by `request.end(callback)`.

If `callback` is specified, it will be called when the request stream is finished.

### request.flushHeaders()<!-- YAML
added: v1.6.0
-->Flush the request headers.

For efficiency reasons, Node.js normally buffers the request headers until `request.end()` is called or the first chunk of request data is written. It then tries to pack the request headers and data into a single TCP packet.

That's usually desired (it saves a TCP round-trip), but not when the first data is not sent until possibly much later. `request.flushHeaders()` bypasses the optimization and kickstarts the request.

### request.getHeader(name)<!-- YAML
added: v1.6.0
-->

* `name` {string}

* Возвращает: {string}

Reads out a header on the request. Обратите внимание, что имя не чувствительно к регистру.

Пример:

```js
const contentType = request.getHeader('Content-Type');
```

### request.removeHeader(name)

<!-- YAML
added: v1.6.0
-->

* `name` {string}

Removes a header that's already defined into headers object.

Пример:

```js
request.removeHeader('Content-Type');
```

### request.setHeader(name, value)

<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {string}

Sets a single header value for headers object. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name.

Пример:

```js
request.setHeader('Content-Type', 'application/json');
```

или

```js
request.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

### request.setNoDelay([noDelay])<!-- YAML
added: v0.5.9
-->

* `noDelay` {boolean}

Once a socket is assigned to this request and is connected [`socket.setNoDelay()`][] will be called.

### request.setSocketKeepAlive(\[enable\]\[, initialDelay\])<!-- YAML
added: v0.5.9
-->

* `enable` {boolean}

* `initialDelay` {number}

Once a socket is assigned to this request and is connected [`socket.setKeepAlive()`][] will be called.

### request.setTimeout(timeout[, callback])

<!-- YAML
added: v0.5.9
-->

* `timeout` {number} Миллисекунды до истечения срока запроса.
* `callback` {Function} Опциональная функция, вызываемая по истечении времени ожидания. То же, что и привязка к событию `timeout`.

If no socket is assigned to this request then [`socket.setTimeout()`][] will be called immediately. Otherwise [`socket.setTimeout()`][] will be called after the assigned socket is connected.

Возвращает `request`.

### request.socket<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Reference to the underlying socket. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. The `socket` may also be accessed via `request.connection`.

Пример:

```js
const http = require('http');
const options = {
  host: 'www.google.com',
};
const req = http.get(options);
req.end();
req.once('response', (res) => {
  const ip = req.socket.localAddress;
  const port = req.socket.localPort;
  console.log(`Your IP address is ${ip} and your source port is ${port}.`);
  // consume response object
});
```

### request.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->

* `chunk` {string|Buffer}

* `encoding` {string}

* `callback` {Function}

Посылает часть тела. By calling this method many times, a request body can be sent to a server — in that case it is suggested to use the `['Transfer-Encoding', 'chunked']` header line when creating the request.

Аргумент `encoding` является опциональным и применяется только тогда, когда `chunk` является строкой. По умолчанию на `'utf8'`.

The `callback` argument is optional and will be called when this chunk of data is flushed.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Возвращает `false`, если данные полностью или частично были поставлены в очередь в памяти пользователя. `'drain'` будет выдан, когда буфер снова освободиться.

## Class: http.Server<!-- YAML
added: v0.1.17
-->This class inherits from [

`net.Server`][] and has the following additional events:

### Событие: 'checkContinue'<!-- YAML
added: v0.3.0
-->

* `request` {http.IncomingMessage}

* `response` {http.ServerResponse}

Выдается каждый раз при получении запроса HTTP `Expect: 100-continue`. If this event is not listened for, the server will automatically respond with a `100 Continue` as appropriate.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Note that when this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Событие: 'checkExpectation'<!-- YAML
added: v5.5.0
-->

* `request` {http.IncomingMessage}

* `response` {http.ServerResponse}

Emitted each time a request with an HTTP `Expect` header is received, where the value is not `100-continue`. If this event is not listened for, the server will automatically respond with a `417 Expectation Failed` as appropriate.

Note that when this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Событие: 'clientError'<!-- YAML
added: v0.1.94
changes:

  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4557
    description: The default action of calling `.destroy()` on the `socket`
                 will no longer take place if there are listeners attached
                 for `clientError`.
  - version: v8.10.0
    pr-url: https://github.com/nodejs/node/pull/17672
    description: The rawPacket is the current buffer that just parsed. Adding
                 this buffer to the error object of clientError event is to make
                 it possible that developers can log the broken packet.
-->

* `exception` {Error}
* `socket` {net.Socket}

Если клиентское соединение выдает событие `'error'`, оно будет перенаправлено сюда. Listener of this event is responsible for closing/destroying the underlying socket. For example, one may wish to more gracefully close the socket with a custom HTTP response instead of abruptly severing the connection.

Default behavior is to close the socket with an HTTP '400 Bad Request' response if possible, otherwise the socket is immediately destroyed.

`socket` является объектом [`net.Socket`][], из которого возникла ошибка.

```js
const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});
server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);
```

When the `'clientError'` event occurs, there is no `request` or `response` object, so any HTTP response sent, including response headers and payload, *must* be written directly to the `socket` object. Care must be taken to ensure the response is a properly formatted HTTP response message.

`err` is an instance of `Error` with two extra columns:

* `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
* `rawPacket`: the raw packet of current request.

### Event: 'close'<!-- YAML
added: v0.1.4
-->Emitted when the server closes.

### Событие: 'connect'<!-- YAML
added: v0.7.0
-->

* `request` {http.IncomingMessage} Arguments for the HTTP request, as it is in the [`'request'`][] event

* `socket` {net.Socket} Сетевой сокет между сервером и клиентом

* `head` {Buffer} Первый пакет туннельного потока (может быть пустым)

Генерируется каждый раз, когда клиент запрашивает метод HTTP `CONNECT`. If this event is not listened for, then clients requesting a `CONNECT` method will have their connections closed.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### Событие: 'connection'<!-- YAML
added: v0.1.0
-->

* `socket` {net.Socket}

This event is emitted when a new TCP stream is established. `socket` is typically an object of type [`net.Socket`][]. Обычно пользователи не хотят получать доступ к этому событию. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` can also be accessed at `request.connection`.

*Note*: This event can also be explicitly emitted by users to inject connections into the HTTP server. In that case, any [`Duplex`][] stream can be passed.

### Событие: 'request'<!-- YAML
added: v0.1.0
-->

* `request` {http.IncomingMessage}

* `response` {http.ServerResponse}

Генерируется каждый раз, когда есть запрос. Note that there may be multiple requests per connection (in the case of HTTP Keep-Alive connections).

### Событие: 'upgrade'<!-- YAML
added: v0.1.94
-->

* `request` {http.IncomingMessage} Arguments for the HTTP request, as it is in the [`'request'`][] event

* `socket` {net.Socket} Сетевой сокет между сервером и клиентом

* `head` {Buffer} Первый пакет обновленного потока (может быть пустым)

Генерируется каждый раз, когда клиент запрашивает обновление HTTP. If this event is not listened for, then clients requesting an upgrade will have their connections closed.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### server.close([callback])<!-- YAML
added: v0.1.90
-->

* `callback` {Function}

Останавливает сервер от принятия новых подключений. Смотрите [`net.Server.close()`][].

### server.listen()

Starts the HTTP server listening for connections. Этот метод идентичен [`server.listen()`][] от [`net.Server`][].

### server.listening<!-- YAML
added: v5.7.0
-->

* {boolean}

A Boolean indicating whether or not the server is listening for connections.

### server.maxHeadersCount<!-- YAML
added: v0.7.0
-->

* {number} **Default:** `2000`

Limits maximum incoming headers count. If set to 0 - no limit will be applied.

### server.headersTimeout<!-- YAML
added: v8.14.0
-->

* {number} **Default:** `40000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in \[server.timeout\]\[\] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See \[server.timeout\]\[\] for more information on how timeout behaviour can be customised.

### server.setTimeout(\[msecs\]\[, callback\])<!-- YAML
added: v0.9.12
-->

* `msecs` {number} **Default:** `120000` (2 minutes)

* `callback` {Function}

Sets the timeout value for sockets, and emits a `'timeout'` event on the Server object, passing the socket as an argument, if a timeout occurs.

If there is a `'timeout'` event listener on the Server object, then it will be called with the timed-out socket as an argument.

By default, the Server's timeout value is 2 minutes, and sockets are destroyed automatically if they time out. However, if a callback is assigned to the Server's `'timeout'` event, timeouts must be handled explicitly.

Возвращает `server`.

### server.timeout<!-- YAML
added: v0.9.12
-->

* {number} Timeout in milliseconds. **Default:** `120000` (2 minutes).

The number of milliseconds of inactivity before a socket is presumed to have timed out.

A value of `0` will disable the timeout behavior on incoming connections.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### server.keepAliveTimeout<!-- YAML
added: v8.0.0
-->

* {number} Timeout in milliseconds. **Default:** `5000` (5 seconds).

The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: http.ServerResponse<!-- YAML
added: v0.1.17
-->This object is created internally by an HTTP server — not by the user. It is passed as the second parameter to the [

`'request'`][] event.

The response implements, but does not inherit from, the [Writable Stream](stream.html#stream_class_stream_writable) interface. Это [`EventEmitter`][] со следующими событиями:

### Event: 'close'<!-- YAML
added: v0.6.7
-->Indicates that the underlying connection was terminated before [

`response.end()`][] was called or able to flush.

### Event: 'finish'<!-- YAML
added: v0.3.6
-->Emitted when the response has been sent. More specifically, this event is emitted when the last segment of the response headers and body have been handed off to the operating system for transmission over the network. It does not imply that the client has received anything yet.

После этого события на объекте ответа больше не будет сгенерировано ни одного события.

### response.addTrailers(headers)<!-- YAML
added: v0.3.0
-->

* `headers` {Object}

This method adds HTTP trailing headers (a header but at the end of the message) to the response.

Trailers will **only** be emitted if chunked encoding is used for the response; if it is not (e.g. if the request was HTTP/1.0), they will be silently discarded.

Note that HTTP requires the `Trailer` header to be sent in order to emit trailers, with a list of the header fields in its value. Например,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

### response.connection<!-- YAML
added: v0.3.0
-->

* {net.Socket}

See [`response.socket`][].

### response.end(\[data\]\[, encoding\][, callback])<!-- YAML
added: v0.1.90
-->

* `data` {string|Buffer}

* `encoding` {string}

* `callback` {Function}

This method signals to the server that all of the response headers and body have been sent; that server should consider this message complete. Этот метод - `response.end()` - ДОЛЖЕН вызываться при каждом ответе.

If `data` is specified, it is equivalent to calling [`response.write(data, encoding)`][] followed by `response.end(callback)`.

If `callback` is specified, it will be called when the response stream is finished.

### response.finished<!-- YAML
added: v0.0.2
-->

* {boolean}

Логическое значение, которое указывает, был ли завершен ответ. Starts as `false`. После выполнения [`response.end()`][] значение будет `true`.

### response.getHeader(name)<!-- YAML
added: v0.4.0
-->

* `name` {string}

* Возвращает: {string}

Считывает заголовок, который уже был поставлен в очередь, но не отправлен клиенту. Обратите внимание, что имя не чувствительно к регистру.

Пример:

```js
const contentType = response.getHeader('content-type');
```

### response.getHeaderNames()<!-- YAML
added: v7.7.0
-->

* Возвращает: {Array}

Returns an array containing the unique names of the current outgoing headers. All header names are lowercase.

Пример:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### response.getHeaders()<!-- YAML
added: v7.7.0
-->

* Возвращает: {Object}

Returns a shallow copy of the current outgoing headers. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

*Note*: The object returned by the `response.getHeaders()` method *does not* prototypically inherit from the JavaScript `Object`. This means that typical `Object` methods such as `obj.toString()`, `obj.hasOwnProperty()`, and others are not defined and *will not work*.

Пример:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

### response.hasHeader(name)

<!-- YAML
added: v7.7.0
-->

* `name` {string}
* Возвращает: {boolean}

Returns `true` if the header identified by `name` is currently set in the outgoing headers. Note that the header name matching is case-insensitive.

Пример:

```js
const hasContentType = response.hasHeader('content-type');
```

### response.headersSent<!-- YAML
added: v0.9.3
-->

* {boolean}

Логическое значение (только для чтения). True, если заголовки были отправлены, в противном случае false.

### response.removeHeader(name)<!-- YAML
added: v0.4.0
-->

* `name` {string}

Удаляет заголовок, который стоит в очереди для скрытой отправки.

Пример:

```js
response.removeHeader('Content-Encoding');
```

### response.sendDate<!-- YAML
added: v0.7.5
-->

* {boolean}

When true, the Date header will be automatically generated and sent in the response if it is not already present in the headers. По умолчанию на true.

This should only be disabled for testing; HTTP requires the Date header in responses.

### response.setHeader(name, value)

<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {string | string[]}

Устанавливает одно значение заголовка для неявных заголовков. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name.

Пример:

```js
response.setHeader('Content-Type', 'text/html');
```

или

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

### response.setTimeout(msecs[, callback])<!-- YAML
added: v0.9.12
-->

* `msecs` {number}

* `callback` {Function}

Устанавливает значение времени ожидания Сокета на `msecs`. If a callback is provided, then it is added as a listener on the `'timeout'` event on the response object.

If no `'timeout'` listener is added to the request, the response, or the server, then sockets are destroyed when they time out. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

Возвращает `response`.

### response.socket<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Reference to the underlying socket. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. The `socket` may also be accessed via `response.connection`.

Пример:

```js
const http = require('http');
const server = http.createServer((req, res) => {
  const ip = res.socket.remoteAddress;
  const port = res.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

### response.statusCode<!-- YAML
added: v0.4.0
-->

* {number}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status code that will be sent to the client when the headers get flushed.

Пример:

```js
response.statusCode = 404;
```

After response header was sent to the client, this property indicates the status code which was sent out.

### response.statusMessage<!-- YAML
added: v0.11.8
-->

* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

Пример:

```js
response.statusMessage = 'Not found';
```

After response header was sent to the client, this property indicates the status message which was sent out.

### response.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->

* `chunk` {string|Buffer}

* `encoding` {string} **По умолчанию:** `'utf8'`

* `callback` {Function}
* Возвращает: {boolean}

If this method is called and [`response.writeHead()`][] has not been called, it will switch to implicit header mode and flush the implicit headers.

Отправляет часть тела ответа. This method may be called multiple times to provide successive parts of the body.

Note that in the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses *must not* include a message body.

`chunk` может быть строкой или буфером. If `chunk` is a string, the second parameter specifies how to encode it into a byte stream. `callback` will be called when this chunk of data is flushed.

*Note*: This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Возвращает `false`, если данные полностью или частично были поставлены в очередь в памяти пользователя. `'drain'` будет выдан, когда буфер снова освободиться.

### response.writeContinue()<!-- YAML
added: v0.3.0
-->Sends a HTTP/1.1 100 Continue message to the client, indicating that the request body should be sent. Смотрите событие [

`'checkContinue'`][] на `Server`.

### response.writeHead(statusCode\[, statusMessage\]\[, headers\])<!-- YAML
added: v0.1.30
changes:

  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/6291
    description: A `RangeError` is thrown if `statusCode` is not a number in
                 the range `[100, 999]`.
-->

* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Отправляет заголовок ответа на запрос. The status code is a 3-digit HTTP status code, like `404`. Последние аргументы - `headers` - являются заголовками ответа. Optionally one can give a human-readable `statusMessage` as the second argument.

Пример:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

This method must only be called once on a message and it must be called before [`response.end()`][] is called.

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Обратите внимание, что Content-Length (длина содержимого) задается в байтах, а не в символах. The above example works because the string `'hello world'` contains only single byte characters. If the body contains higher coded characters then `Buffer.byteLength()` should be used to determine the number of bytes in a given encoding. And Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

## Class: http.IncomingMessage<!-- YAML
added: v0.1.17
-->An 

`IncomingMessage` object is created by [`http.Server`][] or [`http.ClientRequest`][] and passed as the first argument to the [`'request'`][] and [`'response'`][] event respectively. It may be used to access response status, headers and data.

It implements the [Readable Stream](stream.html#stream_class_stream_readable) interface, as well as the following additional events, methods, and properties.

### Event: 'aborted'<!-- YAML
added: v0.3.8
-->Emitted when the request has been aborted.

### Event: 'close'<!-- YAML
added: v0.4.2
-->Indicates that the underlying connection was closed. Так же как 

`'end'`, это событие происходит только один раз на ответ.

### message.aborted<!-- YAML
added: v8.13.0
-->

* {boolean}

The `message.aborted` property will be `true` if the request has been aborted.

### message.complete<!-- YAML
added: v0.3.0
-->

* {boolean}

The `message.complete` property will be `true` if a complete HTTP message has been received and successfully parsed.

This property is particularly useful as a means of determining if a client or server fully transmitted a message before a connection was terminated:

```js
const req = http.request({
  host: '127.0.0.1',
  port: 8080,
  method: 'POST'
}, (res) => {
  res.resume();
  res.on('end', () => {
    if (!res.complete)
      console.error(
        'The connection was terminated while the message was still being sent');
  });
});
```

### message.destroy([error])<!-- YAML
added: v0.3.0
-->

* `error` {Error}

Вызывает `destroy()` на сокет, который получил `IncomingMessage`. If `error` is provided, an `'error'` event is emitted and `error` is passed as an argument to any listeners on the event.

### message.headers<!-- YAML
added: v0.1.5
-->

* {Object}

Объект заголовков запроса/ответа.

Пары ключ-значение имен заголовков и значений. Имена заголовков в нижнем регистре. Пример:

```js
// Печатает что-то вроде:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

Duplicates in raw headers are handled in the following ways, depending on the header name:

* Duplicates of `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, or `user-agent` are discarded.
* `set-cookie` всегда массив. Дубликаты добавляются в массив.
* Для всех других заголовков значения соединяются с помощью ', '.

### message.httpVersion<!-- YAML
added: v0.1.1
-->

* {string}

В случае запроса сервера - версия HTTP, отправленная клиентом. In the case of client response, the HTTP version of the connected-to server. Возможно, `'1.1'` или `'1.0'`.

Also `message.httpVersionMajor` is the first integer and `message.httpVersionMinor` is the second.

### message.method<!-- YAML
added: v0.1.1
-->

* {string}

**Действителен только для запроса, полученного от [`http.Server`][].**

Метод запроса в качестве строки. Только для чтения. Example: `'GET'`, `'DELETE'`.

### message.rawHeaders<!-- YAML
added: v0.11.6
-->

* {Array}

Список необработанных заголовков запроса/ответа в том виде, в котором они были получены.

Обратите внимание, что ключи и значения находятся в одном списке. It is *not* a list of tuples. So, the even-numbered offsets are key values, and the odd-numbered offsets are the associated values.

Имена заголовков не в нижнем регистре, а дубликаты не объединяются.

```js
// Печатает что-то вроде:
//
// [ 'user-agent',
//   'это неверно, потому что может быть только один',
//   'User-Agent',
//   'curl/7.22.0',
//   'Host',
//   '127.0.0.1:8000',
//   'ACCEPT',
//   '*/*' ]
console.log(request.rawHeaders);
```

### message.rawTrailers<!-- YAML
added: v0.11.6
-->

* {Array}

The raw request/response trailer keys and values exactly as they were received. Заполняется только в событии `'end'`.

### message.setTimeout(msecs, callback)<!-- YAML
added: v0.5.9
-->

* `msecs` {number}

* `callback` {Function}

Вызывает `message.connection.setTimeout(msecs, callback)`.

Возвращает `message`.

### message.socket<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Объект [`net.Socket`][], связанный с подключением.

With HTTPS support, use [`request.socket.getPeerCertificate()`][] to obtain the client's authentication details.

### message.statusCode<!-- YAML
added: v0.1.1
-->

* {number}

**Действителен только для ответа, полученного от [`http.ClientRequest`][].**

Трехзначный код состояния ответа HTTP. Например, `404`.

### message.statusMessage<!-- YAML
added: v0.11.10
-->

* {string}

**Действителен только для ответа, полученного от [`http.ClientRequest`][].**

Сообщение о статусе ответа HTTP (фраза причины). Например, `OK` или `Internal Server Error`.

### message.trailers<!-- YAML
added: v0.3.0
-->

* {Object}

Объект трейлеров запроса/ответа. Заполняется только в событии `'end'`.

### message.url<!-- YAML
added: v0.1.90
-->

* {string}

**Действителен только для запроса, полученного от [`http.Server`][].**

Запросите URL-строку. This contains only the URL that is present in the actual HTTP request. Если запрос:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

То `request.url` будет:

```js
'/status?name=ryan'
```

To parse the url into its parts `require('url').parse(request.url)` can be used. Пример:

```txt
$ node
> require('url').parse('/status?name=ryan')
Url {
  protocol: null,
  slashes: null,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  hash: null,
  search: '?name=ryan',
  query: 'name=ryan',
  pathname: '/status',
  path: '/status?name=ryan',
  href: '/status?name=ryan' }
```

To extract the parameters from the query string, the `require('querystring').parse` function can be used, or `true` can be passed as the second argument to `require('url').parse`. Пример:

```txt
$ node
> require('url').parse('/status?name=ryan', true)
Url {
  protocol: null,
  slashes: null,
  auth: null,
  host: null,
  port: null,
  hostname: null,
  hash: null,
  search: '?name=ryan',
  query: { name: 'ryan' },
  pathname: '/status',
  path: '/status?name=ryan',
  href: '/status?name=ryan' }
```

## http.METHODS<!-- YAML
added: v0.11.8
-->

* {Array}

Список методов HTTP, которые поддерживаются парсером.

## http.STATUS_CODES<!-- YAML
added: v0.1.22
-->

* {Object}

A collection of all the standard HTTP response status codes, and the short description of each. Например, `http.STATUS_CODES[404] === 'Not Found'`.

## http.createServer([requestListener])<!-- YAML
added: v0.1.13
-->

* `requestListener` {Function}

* Возвращает: {http.Server}

Возвращает новый экземпляр [`http.Server`][].

The `requestListener` is a function which is automatically added to the [`'request'`][] event.

## http.get(options[, callback])<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `options` {Object | string | URL} Accepts the same `options` as [`http.request()`][], with the `method` always set to `GET`. Properties that are inherited from the prototype are ignored.
* `callback` {Function}
* Возвращает: {http.ClientRequest}

Since most requests are GET requests without bodies, Node.js provides this convenience method. The only difference between this method and [`http.request()`][] is that it sets the method to GET and calls `req.end()` automatically. Note that the callback must take care to consume the response data for reasons stated in [`http.ClientRequest`][] section.

The `callback` is invoked with a single argument that is an instance of [`http.IncomingMessage`][]

Пример получения JSON:

```js
http.get('http://nodejs.org/dist/index.json', (res) => {
  const { statusCode } = res;
  const contentType = res.headers['content-type'];

  let error;
  if (statusCode !== 200) {
    error = new Error('Request Failed.\n' +
                      `Status Code: ${statusCode}`);
  } else if (!/^application\/json/.test(contentType)) {
    error = new Error('Invalid content-type.\n' +
                      `Expected application/json but received ${contentType}`);
  }
  if (error) {
    console.error(error.message);
    // consume response data to free up memory
    res.resume();
    return;
  }

  res.setEncoding('utf8');
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(rawData);
      console.log(parsedData);
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
```

## http.globalAgent<!-- YAML
added: v0.5.9
-->

* {http.Agent}

Global instance of `Agent` which is used as the default for all HTTP client requests.

## http.maxHeaderSize<!-- YAML
added: v8.15.0
-->

* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

## http.request(options[, callback])

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `опции` {Object | string | URL} 
  * `protocol` {string} Протокол для использования. **Default:** `http:`.
  * `host` {string} A domain name or IP address of the server to issue the request to. **Default:** `localhost`.
  * `hostname` {string} Псевдоним для `host`. To support [`url.parse()`][], `hostname` is preferred over `host`.
  * `family` {number} IP address family to use when resolving `host` and `hostname`. Допустимые значения: `4` или `6`. When unspecified, both IP v4 and v6 will be used.
  * `port` {number} Порт удаленного сервера. **Default:** `80`.
  * `localAddress` {string} Локальный интерфейс для привязки сетевых подключений.
  * `socketPath` {string} Unix Domain Socket (use one of host:port or socketPath).
  * `method` {string} Строка, определяющая метод HTTP-запроса. **Default:** `'GET'`.
  * `path` {string} Путь запроса. Should include query string if any. Например, `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future. **Default:** `'/'`.
  * `headers` {Object} Объект, содержащий заголовки запроса.
  * `auth` {string} Basic authentication i.e. `'user:password'` to compute an Authorization header.
  * `agent` {http.Agent | boolean} Controls [`Agent`][] behavior. Возможные значения: 
    * `undefined` (по умолчанию): используйте [`http.globalAgent`][] для этого хоста и порта.
    * Объект `Agent`: явно используйте переданное в `Agent`.
    * `false`: приводит к использованию нового `Agent` со значениями по умолчанию.
  * `createConnection` {Function} A function that produces a socket/stream to use for the request when the `agent` option is not used. This can be used to avoid creating a custom `Agent` class just to override the default `createConnection` function. See [`agent.createConnection()`][] for more details. Any [`Duplex`][] stream is a valid return value.
  * `timeout` {number}: A number specifying the socket timeout in milliseconds. Это установит тайм-аут перед подключением сокета.
* `callback` {Function}
* Возвращает: {http.ClientRequest}

Node.js поддерживает несколько подключений на сервер для выполнения HTTP-запросов. Эта функция позволяет осуществлять запросы прозрачно.

`options` can be an object, a string, or a [`URL`][] object. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

The optional `callback` parameter will be added as a one-time listener for the [`'response'`][] event.

`http.request()` returns an instance of the [`http.ClientRequest`][] class. Экземпляр `ClientRequest` является записываемым потоком. If one needs to upload a file with a POST request, then write to the `ClientRequest` object.

Пример:

```js
const postData = querystring.stringify({
  'msg': 'Hello World!'
});

const options = {
  hostname: 'www.google.com',
  port: 80,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// write data to request body
req.write(postData);
req.end();
```

Обратите внимание, что в примере был вызван `req.end()`. With `http.request()` one must always call `req.end()` to signify the end of the request - even if there is no data being written to the request body.

If any error is encountered during the request (be that with DNS resolution, TCP level errors, or actual HTTP parse errors) an `'error'` event is emitted on the returned request object. As with all `'error'` events, if no listeners are registered the error will be thrown.

Есть несколько специальных заголовков, которые следует отметить.

* Sending a 'Connection: keep-alive' will notify Node.js that the connection to the server should be persisted until the next request.

* Отправка заголовка 'Content-Length' отключит фрагментированную кодировку по умолчанию.

* Отправка заголовка 'Expect' немедленно отправит заголовки запроса. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `continue` event should be set. See RFC2616 Section 8.2.3 for more information.

* Sending an Authorization header will override using the `auth` option to compute basic authentication.

Example using a [`URL`][] as `options`:

```js
const { URL } = require('url');

const options = new URL('http://abc:xyz@example.com');

const req = http.request(options, (res) => {
  // ...
});
```

In a successful request, the following events will be emitted in the following order:

* `socket`
* `response` 
  * `data` any number of times, on the `res` object (`data` will not be emitted at all if the response body is empty, for instance, in most redirects)
  * `end` on the `res` object
* `close`

In the case of a connection error, the following events will be emitted:

* `socket`
* `error`
* `close`

If `req.abort()` is called before the connection succeeds, the following events will be emitted in the following order:

* `socket`
* (`req.abort()` called here)
* `abort`
* `close`
* `error` with an error with message `Error: socket hang up` and code `ECONNRESET`

If `req.abort()` is called after the response is received, the following events will be emitted in the following order:

* `socket`
* `response` 
  * `data` any number of times, on the `res` object
* (`req.abort()` called here)
* `abort`
* `close` 
  * `aborted` on the `res` object
  * `end` on the `res` object
  * `close` on the `res` object

Note that setting the `timeout` option or using the `setTimeout` function will not abort the request or do anything besides add a `timeout` event.