# HTTP

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Для использования сервера и клиента HTTP необходимо подключить `require('http')`.

Интерфейсы HTTP в Node.js разработаны для поддержки многих функций протокола, которые обычно были сложны в использовании. Особенно больших сообщений, которые, возможно, закодированы фрагментами. Интерфейс никогда не сохраняет в буфере целиком запросы и ответы, так пользователи имеют возможность потоковой передачи данных.

Заголовки HTTP сообщений представлены объектом такого типа:
```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Ключи в нижнем регистре. Значения не меняются.

Чтобы поддерживать полный спектр возможных приложений HTTP, HTTP API Node.js находится на очень низком уровне. Он имеет дело только с обработкой потока и парсингом сообщения. Он разбирает сообщение на заголовки и основную часть, но не разбирает фактические заголовки и основные части сообщений.

Для более подробной информации, как обрабатывать дублированные заголовки, смотрите [`message.headers`][].

Необработанные заголовки - как они были получены - сохраняются в свойство `rawHeaders`, которое является массивом `[key, value, key2, value2, ...]`. Например, предыдущий объект заголовка сообщения может иметь список `rawHeaders` вроде следующего:
```js
[ 'ConTent-Length', '123456',
  'content-LENGTH', '123',
  'content-type', 'text/plain',
  'CONNECTION', 'keep-alive',
  'Host', 'mysite.com',
  'accepT', '*/*' ]
```

## Class: `http.Agent`<!-- YAML
added: v0.3.4
-->`Agent` отвечает за управление сохранением и повторным использованием соединения для клиентов HTTP. Он поддерживает очередь ожидающих запросов для данного хоста и порта, повторно используя одно соединение сокета для каждого, пока очередь не закончится, и в этот момент сокет либо разрушается, либо помещается в пул, где он сохраняется для повторного использования для запросов на тот же хост и порт. Будет ли он разрушен или помещен в пул, зависит от [опции](#http_new_agent_options) `keepAlive`.

Соединения, помещенные в пул, имеют включенные для них TCP Keep-Alive, но серверы все еще могут закрывать незанятые соединения, в случае чего они могут быть удалены из пула, а при новом HTTP запросе для этого хоста и порта будет создаваться новое соединение. Также серверы могут отказать в разрешении нескольких запросов через одно и то же соединение, в этом случае соединение должно быть переделано для каждого запроса и не может быть объединено. `Agent` по-прежнему будет отправлять запросы на этот сервер, но каждый из них будет выполняться по новому соединению.

Когда соединение закрывается клиентом или сервером, оно удаляется из пула. Любые неиспользуемые сокеты в пуле будут отключены, чтобы не поддерживать процесс Node.js при отсутствии ожидающих запросов. (see [`socket.unref()`][]).

Рекомендуется [`уничтожать()`][] экземпляр `Agent`, когда он больше не используется, поскольку неиспользуемые сокеты потребляют ресурсы ОС.

Sockets are removed from an agent when the socket emits either a `'close'` event or an `'agentRemove'` event. When intending to keep one HTTP request open for a long time without keeping it in the agent, something like the following may be done:

```js
http.get(options, (res) => {
  // Do stuff
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

An agent may also be used for an individual request. Предоставляя `{agent: false}` в качестве опции для функций `http.get()` или `http.request()`, разовое использование `Agent` с параметрами по умолчанию будет использоваться для подключения клиента.

`agent:false`:

```js
http.get({
  hostname: 'localhost',
  port: 80,
  path: '/',
  agent: false  // Create a new agent just for this one request
}, (res) => {
  // Do stuff with response
});
```

### `new Agent([options])`<!-- YAML
added: v0.3.4
-->* `options` {Object} Set of configurable options to set on the agent. Может иметь следующие поля:
  * `keepAlive` {boolean} Держите сокеты поблизости даже при отсутствии ожидающих запросов, чтобы их можно было использовать для будущих запросов без необходимости восстановления TCP-соединения. Not to be confused with the `keep-alive` value of the `Connection` header. The `Connection: keep-alive` header is always sent when using an agent except when the `Connection` header is explicitly specified or when the `keepAlive` and `maxSockets` options are respectively set to `false` and `Infinity`, in which case `Connection: close` will be used. **Default:** `false`.
  * `keepAliveMsecs` {number} When using the `keepAlive` option, specifies the [initial delay](net.html#net_socket_setkeepalive_enable_initialdelay) for TCP Keep-Alive packets. Игнорируется, если для параметра `keepAlive` установлено значение `false` или `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Максимальное количество разрешенных сокетов на один хост. Each request will use a new socket until the maximum is reached. **Default:** `Infinity`.
  * `maxFreeSockets` {number} Максимальное количество сокетов, которые остаются открытыми в свободном состоянии. Уместно, только если `keepAlive` установлено на `true`. **Default:** `256`.
  * `timeout` {number} Socket timeout in milliseconds. This will set the timeout when the socket is created.

`options` in [`socket.connect()`][] are also supported.

По умолчанию [`http.globalAgent`][], который используется [`http.request()`][], имеет все эти значения установленными на соответствующие значения по умолчанию.

To configure any of them, a custom [`http.Agent`][] instance must be created.

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### `agent.createConnection(options[, callback])`<!-- YAML
added: v0.11.4
-->* `options` {Object} Параметры, содержащие детали подключения. Для просмотра формата параметров проверьте [`net.createConnection()`][]
* `callback` {Function} Функция обратного вызова, которая получает созданный сокет
* Returns: {stream.Duplex}

Создает сокет/поток, который будет использоваться для HTTP запросов.

По умолчанию эта функция схожа с [`net.createConnection()`][]. Однако пользовательские агенты могут переопределить этот метод в случае, если необходима большая гибкость.

Сокет/поток может быть предоставлен одним из двух способов: путем возврата сокета/потока из этой функции или путем передачи сокета/потока в `callback`.

This method is guaranteed to return an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

`callback` имеет сигнатуру `(err, stream)`.

### `agent.keepSocketAlive(socket)`<!-- YAML
added: v8.1.0
-->* `socket` {stream.Duplex}

Called when `socket` is detached from a request and could be persisted by the `Agent`. Поведение по умолчанию:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Этот метод может быть переопределен с помощью особого подкласса `Agent`. Если этот метод возвращает ложное значение, сокет будет уничтожен вместо сохранения его для использования со следующим запросом.

The `socket` argument can be an instance of {net.Socket}, a subclass of
{stream.Duplex}.

### `agent.reuseSocket(socket, request)`<!-- YAML
added: v8.1.0
-->* `socket` {stream.Duplex}
* `request` {http.ClientRequest}

Вызывается, когда `socket` подключается к `request` после сохранения из-за опций keep-alive. Поведение по умолчанию:

```js
socket.ref();
```

Этот метод может быть переопределен с помощью особого подкласса `Agent`.

The `socket` argument can be an instance of {net.Socket}, a subclass of
{stream.Duplex}.

### `agent.destroy()`<!-- YAML
added: v0.11.4
-->Уничтожает любые сокеты, которые в настоящее время используются агентом.

Обычно это делать не нужно. However, if using an agent with `keepAlive` enabled, then it is best to explicitly shut down the agent when it will no longer be used. В противном случае сокеты могут оставаться открытыми в течение довольно длительного времени, прежде чем сервер завершит их работу.

### `agent.freeSockets`<!-- YAML
added: v0.11.4
-->* {Object}

Объект, который содержит массивы сокетов, в настоящее время ожидающих использования агентом при включенном `keepAlive`. Не изменять.

### `agent.getName(options)`
<!-- YAML
added: v0.11.4
-->

* `options` {Object} A set of options providing information for name generation
  * `host` {string} A domain name or IP address of the server to issue the request to
  * `port` {number} Порт удаленного сервера
  * `localAddress` {string} Локальный интерфейс для привязки к сетевым подключениям при выдаче запроса
  * `family` {integer} Must be 4 or 6 if this doesn't equal `undefined`.
* Возвращает: {string}

Получите уникальное имя для набора параметров запроса, чтобы определить, можно ли повторно использовать соединение. For an HTTP agent, this returns `host:port:localAddress` or `host:port:localAddress:family`. For an HTTPS agent, the name includes the CA, cert, ciphers, and other HTTPS/TLS-specific options that determine socket reusability.

### `agent.maxFreeSockets`<!-- YAML
added: v0.11.7
-->* {number}

По умолчанию установлено на 256. Для агентов с включенным `keepAlive` это устанавливает максимальное количество сокетов, которые останутся открытыми в свободном состоянии.

### `agent.maxSockets`<!-- YAML
added: v0.3.6
-->* {number}

By default set to `Infinity`. Определяет, сколько одновременных сокетов агент может открыть для каждого источника. Origin is the returned value of [`agent.getName()`][].

### `agent.requests`<!-- YAML
added: v0.5.9
-->* {Object}

Объект, содержащий очереди запросов, которые еще не были назначены сокетам. Не изменять.

### `agent.sockets`
<!-- YAML
added: v0.3.6
-->

* {Object}

Объект, содержащий массивы сокетов, которые в настоящее время используются агентом. Не изменять.

## Class: `http.ClientRequest`<!-- YAML
added: v0.1.17
-->* Extends: {Stream}

Этот объект создается внутри и возвращается из [`http.request()`][]. It represents an _in-progress_ request whose header has already been queued. The header is still mutable using the [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][] API. The actual header will be sent along with the first data chunk or when calling [`request.end()`][].

Чтобы получить ответ, добавьте слушатель для [`'response'`][] к объекту запроса. [`'response'`][] будет сгенерирован из объекта запроса после получения заголовков ответа. Событие [`'response'`][] выполняется с одним аргументом, который является экземпляром [`http.IncomingMessage`][].

Во время события [`'response'`][] можно добавлять слушатели к объекту ответа; особенно для прослушивания события `'data'`.

Если обработчик [`'response'`][] не добавлен, то ответ будет полностью отброшен. However, if a [`'response'`][] event handler is added, then the data from the response object **must** be consumed, either by calling `response.read()` whenever there is a `'readable'` event, or by adding a `'data'` handler, or by calling the `.resume()` method. Пока данные не будут использованы, событие `'end'` не будет запущено. Кроме того, до тех пор, пока данные не будут прочитаны, они будут использовать память, что в конечном итоге может привести к ошибке «процесса нехватки памяти».

Unlike the `request` object, if the response closes prematurely, the `response` object does not emit an `'error'` event but instead emits the `'aborted'` event.

Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

### Event: `'abort'`<!-- YAML
added: v1.4.1
-->Генерируется, когда запрос был прерван клиентом. Это событие генерируется только при первом вызове `abort()`.

### Event: `'connect'`<!-- YAML
added: v0.7.0
-->* `response` {http.IncomingMessage}
* `socket` {stream.Duplex}
* `head` {Buffer}

Генерируется каждый раз, когда сервер отвечает на запрос методом `CONNECT`. If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

A client and server pair demonstrating how to listen for the `'connect'` event:

```js
const http = require('http');
const net = require('net');
const { URL } = require('url');

// Create an HTTP tunneling proxy
const proxy = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
proxy.on('connect', (req, clientSocket, head) => {
  // Connect to an origin server
  const { port, hostname } = new URL(`http://${req.url}`);
  const serverSocket = net.connect(port || 80, hostname, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
                    'Proxy-agent: Node.js-Proxy\r\n' +
                    '\r\n');
    serverSocket.write(head);
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);
  });
});

// Now that proxy is running
proxy.listen(1337, '127.0.0.1', () => {

  // Make a request to a tunneling proxy
  const options = {
    port: 1337,
    host: '127.0.0.1',
    method: 'CONNECT',
    path: 'www.google.com:80'
  };

  const req = http.request(options);
  req.end();

  req.on('connect', (res, socket, head) => {
    console.log('got connected!');

    // Make a request over an HTTP tunnel
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

### Event: `'continue'`<!-- YAML
added: v0.3.2
-->Генерируется, когда сервер отправляет HTTP-ответ '100 Continue', обычно потому, что запрос содержал 'Expect: 100-continue'. Это является инструкцией о том, что клиент должен отправить тело запроса.

### Event: `'information'`<!-- YAML
added: v10.0.0
-->* `info` {Object}
  * `httpVersion` {string}
  * `httpVersionMajor` {integer}
  * `httpVersionMinor` {integer}
  * `statusCode` {integer}
  * `statusMessage` {string}
  * `headers` {Object}
  * `rawHeaders` {string[]}

Emitted when the server sends a 1xx intermediate response (excluding 101 Upgrade). The listeners of this event will receive an object containing the HTTP version, status code, status message, key-value headers object, and array with the raw header names followed by their respective values.

```js
const http = require('http');

const options = {
  host: '127.0.0.1',
  port: 8080,
  path: '/length_request'
};

// Make a request
const req = http.request(options);
req.end();

req.on('information', (info) => {
  console.log(`Got information prior to main response: ${info.statusCode}`);
});
```

101 Upgrade statuses do not fire this event due to their break from the traditional HTTP request/response chain, such as web sockets, in-place TLS upgrades, or HTTP 2.0. To be notified of 101 Upgrade notices, listen for the [`'upgrade'`][] event instead.

### Event: `'response'`<!-- YAML
added: v0.1.0
-->* `response` {http.IncomingMessage}

Генерируется, когда получен ответ на этот запрос. Это событие создается только раз.

### Event: `'socket'`<!-- YAML
added: v0.5.3
-->* `socket` {stream.Duplex}

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### Event: `'timeout'`<!-- YAML
added: v0.7.8
-->Emitted when the underlying socket times out from inactivity. This only notifies that the socket has been idle. The request must be aborted manually.

See also: [`request.setTimeout()`][].

### Event: `'upgrade'`<!-- YAML
added: v0.1.94
-->* `response` {http.IncomingMessage}
* `socket` {stream.Duplex}
* `head` {Buffer}

Создается каждый раз, когда сервер отвечает на запрос с обновлением. If this event is not being listened for and the response status code is 101 Switching Protocols, clients receiving an upgrade header will have their connections closed.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

A client server pair demonstrating how to listen for the `'upgrade'` event.

```js
const http = require('http');

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
server.on('upgrade', (req, socket, head) => {
  socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
               'Upgrade: WebSocket\r\n' +
               'Connection: Upgrade\r\n' +
               '\r\n');

  socket.pipe(socket); // echo back
});

// Now that server is running
server.listen(1337, '127.0.0.1', () => {

  // make a request
  const options = {
    port: 1337,
    host: '127.0.0.1',
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

### `request.abort()`<!-- YAML
added: v0.3.8
-->Помечает запрос как прерывание. Вызов этого приведет к удалению оставшихся данных в ответе и разрушению сокета.

### `request.aborted`<!-- YAML
added: v0.11.14
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/20230
    description: The `aborted` property is no longer a timestamp number.
-->* {boolean}

The `request.aborted` property will be `true` if the request has been aborted.

### `request.connection`<!-- YAML
added: v0.3.0
deprecated: v13.0.0
-->> Стабильность: 0 - устарело. Use [`request.socket`][].

* {stream.Duplex}

See [`request.socket`][].

### `request.end([data[, encoding]][, callback])`<!-- YAML
added: v0.1.90
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ClientRequest`.
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Возвращает: {this}

Завершает отправку запроса. Если какие-либо части тела не будут отправлены, он сбросит их в поток. Если запрос разбит на части, будут посланы завершающие `'0\r\n\r\n'`.

Если указан параметр `data`, то это эквивалентно вызову [`request.write(data, encoding)`][], за которым следует `request.end(callback)`.

Если указан `callback`, он будет вызываться при завершении потока запроса.

### `request.finished`<!-- YAML
added: v0.0.1
deprecated: v13.4.0
-->> Стабильность: 0 - устарело. Use [`request.writableEnded`][].

* {boolean}

The `request.finished` property will be `true` if [`request.end()`][] has been called. `request.end()` will automatically be called if the request was initiated via [`http.get()`][].

### `request.flushHeaders()`<!-- YAML
added: v1.6.0
-->Flushes the request headers.

For efficiency reasons, Node.js normally buffers the request headers until `request.end()` is called or the first chunk of request data is written. It then tries to pack the request headers and data into a single TCP packet.

That's usually desired (it saves a TCP round-trip), but not when the first data is not sent until possibly much later. `request.flushHeaders()` bypasses the optimization and kickstarts the request.

### `request.getHeader(name)`<!-- YAML
added: v1.6.0
-->* `name` {string}
* Returns: {any}

Reads out a header on the request. The name is case-insensitive. The type of the return value depends on the arguments provided to [`request.setHeader()`][].

```js
request.setHeader('content-type', 'text/html');
request.setHeader('Content-Length', Buffer.byteLength(body));
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
const contentType = request.getHeader('Content-Type');
// 'contentType' is 'text/html'
const contentLength = request.getHeader('Content-Length');
// 'contentLength' is of type number
const cookie = request.getHeader('Cookie');
// 'cookie' is of type string[]
```

### `request.maxHeadersCount`

* {number} **Default:** `2000`

Limits maximum response headers count. If set to 0, no limit will be applied.

### `request.path`<!-- YAML
added: v0.4.0
-->* {string} The request path.

### `request.removeHeader(name)`
<!-- YAML
added: v1.6.0
-->

* `name` {string}

Removes a header that's already defined into headers object.

```js
request.removeHeader('Content-Type');
```

### `request.reusedSocket`<!-- YAML
added: v13.0.0
-->* {boolean} Whether the request is send through a reused socket.

When sending request through a keep-alive enabled agent, the underlying socket might be reused. But if server closes connection at unfortunate time, client may run into a 'ECONNRESET' error.

```js
const http = require('http');

// Server has a 5 seconds keep-alive timeout by default
http
  .createServer((req, res) => {
    res.write('hello\n');
    res.end();
  })
  .listen(3000);

setInterval(() => {
  // Adapting a keep-alive agent
  http.get('http://localhost:3000', { agent }, (res) => {
    res.on('data', (data) => {
      // Do nothing
    });
  });
}, 5000); // Sending request on 5s interval so it's easy to hit idle timeout
```

By marking a request whether it reused socket or not, we can do automatic error retry base on it.

```js
const http = require('http');
const agent = new http.Agent({ keepAlive: true });

function retriableRequest() {
  const req = http
    .get('http://localhost:3000', { agent }, (res) => {
      // ...
    })
    .on('error', (err) => {
      // Check if retry is needed
      if (req.reusedSocket && err.code === 'ECONNRESET') {
        retriableRequest();
      }
    });
}

retriableRequest();
```

### `request.setHeader(name, value)`
<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {any}

Sets a single header value for headers object. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`request.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
request.setHeader('Content-Type', 'application/json');
```

или

```js
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
```

### `request.setNoDelay([noDelay])`<!-- YAML
added: v0.5.9
-->* `noDelay` {boolean}

После того, как сокет назначен и подключен, будет вызван [`socket.setNoDelay()`][].

### `request.setSocketKeepAlive([enable][, initialDelay])`<!-- YAML
added: v0.5.9
-->* `enable` {boolean}
* `initialDelay` {number}

После того, как сокет назначен и подключен, будет вызван [`socket.setKeepAlive()`][].

### `request.setTimeout(timeout[, callback])`<!-- YAML
added: v0.5.9
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/8895
    description: Consistently set socket timeout only when the socket connects.
-->* `timeout` {number} Миллисекунды до истечения срока запроса.
* `callback` {Function} Опциональная функция, вызываемая по истечении времени ожидания. Same as binding to the `'timeout'` event.
* Возвращает: {http.ClientRequest}

После того, как сокет назначен и подключен, будет вызван [`socket.setTimeout()`][].

### `request.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

Reference to the underlying socket. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` may also be accessed via `request.connection`.

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
  // Consume response object
});
```

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `request.writableEnded`<!-- YAML
added: v12.9.0
-->* {boolean}

Is `true` after [`request.end()`][] has been called. This property does not indicate whether the data has been flushed, for this use [`request.writableFinished`][] instead.

### `request.writableFinished`<!-- YAML
added: v12.7.0
-->* {boolean}

Is `true` if all data has been flushed to the underlying system, immediately before the [`'finish'`][] event is emitted.

### `request.write(chunk[, encoding][, callback])`<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Возвращает: {boolean}

Посылает часть тела. By calling this method many times, a request body can be sent to a server — in that case it is suggested to use the `['Transfer-Encoding', 'chunked']` header line when creating the request.

Аргумент `encoding` является опциональным и применяется только тогда, когда `chunk` является строкой. По умолчанию на `'utf8'`.

The `callback` argument is optional and will be called when this chunk of data is flushed, but only if the chunk is non-empty.

Возвращает `true`, если все данные были успешно сброшены в буфер ядра. Возвращает `false`, если данные полностью или частично были поставлены в очередь в памяти пользователя. `'drain'` будет выдан, когда буфер снова освободиться.

When `write` function is called with empty string or buffer, it does nothing and waits for more input.

## Class: `http.Server`<!-- YAML
added: v0.1.17
-->* Extends: {net.Server}

### Event: `'checkContinue'`<!-- YAML
added: v0.3.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Выдается каждый раз при получении запроса HTTP `Expect: 100-continue`. Если это событие не прослушивается, сервер автоматически ответит `100 Continue` в зависимости от ситуации.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

When this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Event: `'checkExpectation'`<!-- YAML
added: v5.5.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Генерируется каждый раз при получении запроса с HTTP-заголовком `Expect`, где значение не равно `100-continue`. Если это событие не прослушивается, сервер автоматически ответит `417 Expectation Failed` в зависимости от ситуации.

When this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Event: `'clientError'`<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4557
    description: The default action of calling `.destroy()` on the `socket`
                 will no longer take place if there are listeners attached
                 for `'clientError'`.
  - version: v9.4.0
    pr-url: https://github.com/nodejs/node/pull/17672
    description: The `rawPacket` is the current buffer that just parsed. Adding
                 this buffer to the error object of `'clientError'` event is to
                 make it possible that developers can log the broken packet.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/25605
    description: The default behavior will return a 431 Request Header
                 Fields Too Large if a HPE_HEADER_OVERFLOW error occurs.
-->* `exception` {Error}
* `socket` {stream.Duplex}

Если клиентское соединение выдает событие `'error'`, оно будет перенаправлено сюда. Слушатель этого события отвечает за закрытие/разрушение базового сокета. For example, one may wish to more gracefully close the socket with a custom HTTP response instead of abruptly severing the connection.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Default behavior is to try close the socket with a HTTP '400 Bad Request', or a HTTP '431 Request Header Fields Too Large' in the case of a [`HPE_HEADER_OVERFLOW`][] error. If the socket is not writable it is immediately destroyed.

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

When the `'clientError'` event occurs, there is no `request` or `response` object, so any HTTP response sent, including response headers and payload, *must* be written directly to the `socket` object. Необходимо убедиться, что ответ является правильно отформатированным ответным сообщением HTTP.

`err` is an instance of `Error` with two extra columns:

* `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
* `rawPacket`: the raw packet of current request.

### Event: `'close'`<!-- YAML
added: v0.1.4
-->Генерируется при завершении работы сервера.

### Event: `'connect'`<!-- YAML
added: v0.7.0
-->* `request` {http.IncomingMessage} Аргументы для HTTP запроса, как в событии [`'request'`][]
* `socket` {stream.Duplex} Network socket between the server and client
* `head` {Buffer} Первый пакет туннельного потока (может быть пустым)

Генерируется каждый раз, когда клиент запрашивает метод HTTP `CONNECT`. Если это событие не прослушивается, то клиенты, запрашивающие метод `CONNECT`, закроют свои соединения.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### Event: `'connection'`<!-- YAML
added: v0.1.0
-->* `socket` {stream.Duplex}

This event is emitted when a new TCP stream is established. `socket` is typically an object of type [`net.Socket`][]. Usually users will not want to access this event. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` can also be accessed at `request.connection`.

This event can also be explicitly emitted by users to inject connections into the HTTP server. In that case, any [`Duplex`][] stream can be passed.

If `socket.setTimeout()` is called here, the timeout will be replaced with `server.keepAliveTimeout` when the socket has served a request (if `server.keepAliveTimeout` is non-zero).

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### Event: `'request'`<!-- YAML
added: v0.1.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Генерируется каждый раз, когда есть запрос. There may be multiple requests per connection (in the case of HTTP Keep-Alive connections).

### Event: `'upgrade'`<!-- YAML
added: v0.1.94
changes:
  - version: v10.0.0
    pr-url: v10.0.0
    description: Not listening to this event no longer causes the socket
                 to be destroyed if a client sends an Upgrade header.
-->* `request` {http.IncomingMessage} Аргументы для HTTP запроса, как в событии [`'request'`][]
* `socket` {stream.Duplex} Network socket between the server and client
* `head` {Buffer} Первый пакет обновленного потока (может быть пустым)

Генерируется каждый раз, когда клиент запрашивает обновление HTTP. Listening to this event is optional and clients cannot insist on a protocol change.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### `server.close([callback])`<!-- YAML
added: v0.1.90
-->* `callback` {Function}

Останавливает сервер от принятия новых подключений. Смотрите [`net.Server.close()`][].

### `server.headersTimeout`<!-- YAML
added: v11.3.0
-->* {number} **Default:** `60000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in [`server.timeout`][] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See [`server.timeout`][] for more information on how timeout behavior can be customized.

### `server.listen()`

Starts the HTTP server listening for connections. Этот метод идентичен [`server.listen()`][] от [`net.Server`][].

### `server.listening`<!-- YAML
added: v5.7.0
-->* {boolean} Indicates whether or not the server is listening for connections.

### `server.maxHeadersCount`<!-- YAML
added: v0.7.0
-->* {number} **Default:** `2000`

Limits maximum incoming headers count. If set to 0, no limit will be applied.

### `server.setTimeout([msecs][, callback])`<!-- YAML
added: v0.9.12
changes:
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27558
    description: The default timeout changed from 120s to 0 (no timeout).
-->* `msecs` {number} **Default:** 0 (no timeout)
* `callback` {Function}
* Возвращает: {http.Server}

Устанавливает значение времени ожидания и генерирует событие `'timeout'` на объект Сервера, передавая сокет в качестве аргумента, если возникает тайм-аут.

Если на объекте Сервера есть слушатель события `'timeout'`, он будет вызываться с сокетом времени ожидания в качестве аргумента.

By default, the Server does not timeout sockets. However, if a callback is assigned to the Server's `'timeout'` event, timeouts must be handled explicitly.

### `server.timeout`<!-- YAML
added: v0.9.12
changes:
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27558
    description: The default timeout changed from 120s to 0 (no timeout).
-->* {number} Timeout in milliseconds. **Default:** 0 (no timeout)

Количество миллисекунд бездействия до предположительного истечения времени ожидания сокета.

A value of `0` will disable the timeout behavior on incoming connections.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### `server.keepAliveTimeout`<!-- YAML
added: v8.0.0
-->* {number} Timeout in milliseconds. **Default:** `5000` (5 seconds).

The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: `http.ServerResponse`<!-- YAML
added: v0.1.17
-->* Extends: {Stream}

Этот объект создается внутренне сервером HTTP, а не пользователем. Он передается в качестве второго параметра событию [`'request'`][].

### Event: `'close'`<!-- YAML
added: v0.6.7
-->Indicates that the underlying connection was terminated.

### Event: `'finish'`<!-- YAML
added: v0.3.6
-->Генерируется, когда ответ был отправлен. Если более конкретно, то это событие генерируется, когда последний сегмент заголовков и тела ответа был передан операционной системе для передачи через сеть. Это не означает, что клиент еще ничего не получил.

### `response.addTrailers(headers)`<!-- YAML
added: v0.3.0
-->* `headers` {Object}

Этот метод добавляет в ответ конечные заголовки HTTP (заголовок, но в конце сообщения).

Trailers will **only** be emitted if chunked encoding is used for the response; if it is not (e.g. if the request was HTTP/1.0), they will be silently discarded.

HTTP requires the `Trailer` header to be sent in order to emit trailers, with a list of the header fields in its value. Например,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Попытка установить имя поля заголовка или значение, содержащее недопустимые символы, приведет к выводу [`TypeError`][].

### `response.connection`<!-- YAML
added: v0.3.0
deprecated: v13.0.0
-->> Стабильность: 0 - устарело. Use [`response.socket`][].

* {stream.Duplex}

See [`response.socket`][].

### `response.cork()`<!-- YAML
added: v13.2.0
-->See [`writable.cork()`][].

### `response.end([data[, encoding]][, callback])`<!-- YAML
added: v0.1.90
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ServerResponse`.
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Возвращает: {this}

Этот метод сообщает серверу, что все заголовки и тело ответа отправлены; этот сервер должен считать это сообщение завершенным. Этот метод - `response.end()` - ДОЛЖЕН вызываться при каждом ответе.

If `data` is specified, it is similar in effect to calling [`response.write(data, encoding)`][] followed by `response.end(callback)`.

Если указан `callback`, он будет вызываться при завершении потока запроса.

### `response.finished`<!-- YAML
added: v0.0.2
deprecated: v13.4.0
-->> Стабильность: 0 - устарело. Use [`response.writableEnded`][].

* {boolean}

The `response.finished` property will be `true` if [`response.end()`][] has been called.

### `response.flushHeaders()`<!-- YAML
added: v1.6.0
-->Flushes the response headers. See also: [`request.flushHeaders()`][].

### `response.getHeader(name)`<!-- YAML
added: v0.4.0
-->* `name` {string}
* Returns: {any}

Считывает заголовок, который уже был поставлен в очередь, но не отправлен клиенту. The name is case-insensitive. The type of the return value depends on the arguments provided to [`response.setHeader()`][].

```js
response.setHeader('Content-Type', 'text/html');
response.setHeader('Content-Length', Buffer.byteLength(body));
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
const contentType = response.getHeader('content-type');
// contentType is 'text/html'
const contentLength = response.getHeader('Content-Length');
// contentLength is of type number
const setCookie = response.getHeader('set-cookie');
// setCookie is of type string[]
```

### `response.getHeaderNames()`<!-- YAML
added: v7.7.0
-->* Returns: {string[]}

Returns an array containing the unique names of the current outgoing headers. All header names are lowercase.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### `response.getHeaders()`<!-- YAML
added: v7.7.0
-->* Возвращает: {Object}

Returns a shallow copy of the current outgoing headers. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. This means that typical `Object` methods such as `obj.toString()`, `obj.hasOwnProperty()`, and others are not defined and *will not work*.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

### `response.hasHeader(name)`
<!-- YAML
added: v7.7.0
-->

* `name` {string}
* Возвращает: {boolean}

Returns `true` if the header identified by `name` is currently set in the outgoing headers. The header name matching is case-insensitive.

```js
const hasContentType = response.hasHeader('content-type');
```

### `response.headersSent`<!-- YAML
added: v0.9.3
-->* {boolean}

Логическое значение (только для чтения). True, если заголовки были отправлены, в противном случае false.

### `response.removeHeader(name)`<!-- YAML
added: v0.4.0
-->* `name` {string}

Удаляет заголовок, который стоит в очереди для скрытой отправки.

```js
response.removeHeader('Content-Encoding');
```

### `response.sendDate`<!-- YAML
added: v0.7.5
-->* {boolean}

При значении true заголовок Date будет автоматически сгенерирован и отправлен в ответе, если его еще нет в заголовках. По умолчанию на true.

Это должно быть отключено только для тестирования; HTTP требует заголовок Date в ответах.

### `response.setHeader(name, value)`
<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {any}

Устанавливает одно значение заголовка для неявных заголовков. Если этот заголовок уже существует в заголовках, которые подлежат отправке, его значение будет заменено. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`response.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
response.setHeader('Content-Type', 'text/html');
```

или

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Попытка установить имя поля заголовка или значение, содержащее недопустимые символы, приведет к выводу [`TypeError`][].

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// Returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

If [`response.writeHead()`][] method is called and this method has not been called, it will directly write the supplied header values onto the network channel without caching internally, and the [`response.getHeader()`][] on the header will not yield the expected result. If progressive population of headers is desired with potential future retrieval and modification, use [`response.setHeader()`][] instead of [`response.writeHead()`][].

### `response.setTimeout(msecs[, callback])`<!-- YAML
added: v0.9.12
-->* `msecs` {number}
* `callback` {Function}
* Возвращает: {http.ServerResponse}

Устанавливает значение времени ожидания Сокета на `msecs`. Если предусмотрен обратный вызов, то он добавляется в качестве слушателя для события `'timeout'` объекта ответа.

Если к запросу, ответу или серверу не добавлен прослушиватель `'timeout'`, то сокеты уничтожаются по истечении времени ожидания. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

### `response.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

Reference to the underlying socket. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. The `socket` may also be accessed via `response.connection`.

```js
const http = require('http');
const server = http.createServer((req, res) => {
  const ip = res.socket.remoteAddress;
  const port = res.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `response.statusCode`<!-- YAML
added: v0.4.0
-->* {number} **Default:** `200`

При использовании неявных заголовков (без явного вызова [`response.writeHead()`][]) это свойство контролирует код состояния, который будет отправлен клиенту при сбросе заголовков.

```js
response.statusCode = 404;
```

После того, как заголовок ответа был отправлен клиенту, это свойство указывает код состояния, который был отправлен.

### `response.statusMessage`<!-- YAML
added: v0.11.8
-->* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

```js
response.statusMessage = 'Not found';
```

После того, как заголовок ответа был отправлен клиенту, это свойство указывает на сообщение о состоянии, которое было отправлено.

### `response.uncork()`<!-- YAML
added: v13.2.0
-->See [`writable.uncork()`][].

### `response.writableEnded`<!-- YAML
added: v12.9.0
-->* {boolean}

Is `true` after [`response.end()`][] has been called. This property does not indicate whether the data has been flushed, for this use [`response.writableFinished`][] instead.

### `response.writableFinished`<!-- YAML
added: v12.7.0
-->* {boolean}

Is `true` if all data has been flushed to the underlying system, immediately before the [`'finish'`][] event is emitted.

### `response.write(chunk[, encoding][, callback])`<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string} **Default:** `'utf8'`
* `callback` {Function}
* Возвращает: {boolean}

Если этот метод вызывается, а [`response.writeHead()`][] не был вызван, то он переключится в режим неявного заголовка и очистит данные неявных заголовков.

Отправляет часть тела ответа. Этот метод может вызываться несколько раз, чтобы обеспечить последовательность частей тела.

In the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses _must not_ include a message body.

`chunk` может быть строкой или буфером. Если `chunk` является строкой, второй параметр указывает, как кодировать его в поток байтов. `callback` will be called when this chunk of data is flushed.

This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Возвращает `true`, если все данные были успешно сброшены в буфер ядра. Возвращает `false`, если данные полностью или частично были поставлены в очередь в памяти пользователя. `'drain'` будет выдан, когда буфер снова освободиться.

### `response.writeContinue()`<!-- YAML
added: v0.3.0
-->Посылает клиенту сообщение HTTP/1.1 100 Continue, которое указывает, что тело запроса должно быть отправлено. See the [`'checkContinue'`][] event on `Server`.

### `response.writeHead(statusCode[, statusMessage][, headers])`<!-- YAML
added: v0.1.30
changes:
  - version: v11.10.0
    pr-url: https://github.com/nodejs/node/pull/25974
    description: Return `this` from `writeHead()` to allow chaining with
                 `end()`.
  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/6291
    description: A `RangeError` is thrown if `statusCode` is not a number in
                 the range `[100, 999]`.
-->* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}
* Возвращает: {http.ServerResponse}

Отправляет заголовок ответа на запрос. Код статуса - 3-значный код статуса HTTP вроде `404`. Последние аргументы - `headers` - являются заголовками ответа. При желании в качестве второго аргумента можно задать удобочитаемый человеком `statusMessage`.

Returns a reference to the `ServerResponse`, so that calls can be chained.

```js
const body = 'hello world';
response
  .writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/plain'
  })
  .end(body);
```

Этот метод может быть вызван лишь один раз на сообщение и только перед вызовом [`response.end()`][].

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

If this method is called and [`response.setHeader()`][] has not been called, it will directly write the supplied header values onto the network channel without caching internally, and the [`response.getHeader()`][] on the header will not yield the expected result. If progressive population of headers is desired with potential future retrieval and modification, use [`response.setHeader()`][] instead.

```js
// Returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

`Content-Length` is given in bytes not characters. Вышеприведенный пример работает, потому что строка `'hello world'` содержит только однобайтовые символы. Если тело содержит символы более высокого кода, тогда следует использовать `Buffer.byteLength()` для определения количества байтов в данной кодировке. And Node.js does not check whether `Content-Length` and the length of the body which has been transmitted are equal or not.

Попытка установить имя поля заголовка или значение, содержащее недопустимые символы, приведет к выводу [`TypeError`][].

### `response.writeProcessing()`<!-- YAML
added: v10.0.0
-->Sends a HTTP/1.1 102 Processing message to the client, indicating that the request body should be sent.

## Class: `http.IncomingMessage`<!-- YAML
added: v0.1.17
changes:
  - version: v13.1.0
    pr-url: https://github.com/nodejs/node/pull/30135
    description: The `readableHighWaterMark` value mirrors that of the socket.
-->* Extends: {stream.Readable}

Объект `IncomingMessage` создается с помощью [`http.Server`][] или [`http.ClientRequest`][] и передается в качестве первого аргумента событиям [`'request'`][] и [`'response'`][] соответственно. It may be used to access response status, headers and data.

### Event: `'aborted'`<!-- YAML
added: v0.3.8
-->Emitted when the request has been aborted.

### Event: `'close'`<!-- YAML
added: v0.4.2
-->Указывает, что базовое соединение было закрыто.

### `message.aborted`<!-- YAML
added: v10.1.0
-->* {boolean}

The `message.aborted` property will be `true` if the request has been aborted.

### `message.complete`<!-- YAML
added: v0.3.0
-->* {boolean}

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

### `message.destroy([error])`<!-- YAML
added: v0.3.0
-->* `error` {Error}

Вызывает `destroy()` на сокет, который получил `IncomingMessage`. If `error` is provided, an `'error'` event is emitted on the socket and `error` is passed as an argument to any listeners on the event.

### `message.headers`<!-- YAML
added: v0.1.5
-->* {Object}

Объект заголовков запроса/ответа.

Пары ключ-значение имен заголовков и значений. Имена заголовков в нижнем регистре.

```js
// Печатает что-то вроде:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

В зависимости от имени заголовка, дубликаты в необработанных заголовках обрабатываются следующими способами:

* Duplicates of `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, `server`, or `user-agent` are discarded.
* `set-cookie` всегда массив. Дубликаты добавляются в массив.
* For duplicate `cookie` headers, the values are joined together with '; '.
* Для всех других заголовков значения соединяются с помощью ', '.

### `message.httpVersion`<!-- YAML
added: v0.1.1
-->* {string}

В случае запроса сервера - версия HTTP, отправленная клиентом. В случае ответа клиента - версия HTTP подключенного сервера. Возможно, `'1.1'` или `'1.0'`.

Также `message.httpVersionMajor` является первым целым числом, а `message.httpVersionMinor` - вторым.

### `message.method`<!-- YAML
added: v0.1.1
-->* {string}

**Действителен только для запроса, полученного от [`http.Server`][].**

Метод запроса в качестве строки. Только для чтения. Examples: `'GET'`, `'DELETE'`.

### `message.rawHeaders`<!-- YAML
added: v0.11.6
-->* {string[]}

Список необработанных заголовков запроса/ответа в том виде, в котором они были получены.

The keys and values are in the same list. It is *not* a list of tuples. Таким образом, даже четные смещения являются ключевыми значениями, а нечетные смещения - сопутствующими.

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

### `message.rawTrailers`<!-- YAML
added: v0.11.6
-->* {string[]}

Необработанные ключи трейлера и значения запроса/ответа в том виде, как они были получены. Заполняется только в событии `'end'`.

### `message.setTimeout(msecs[, callback])`<!-- YAML
added: v0.5.9
-->* `msecs` {number}
* `callback` {Function}
* Возвращает: {http.IncomingMessage}

Вызывает `message.connection.setTimeout(msecs, callback)`.

### `message.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

Объект [`net.Socket`][], связанный с подключением.

С поддержкой HTTPS используйте [`request.socket.getPeerCertificate()`][], чтобы получить детали аутентификации клиента.

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `message.statusCode`<!-- YAML
added: v0.1.1
-->* {number}

**Действителен только для ответа, полученного от [`http.ClientRequest`][].**

Трехзначный код состояния ответа HTTP. Например, `404`.

### `message.statusMessage`<!-- YAML
added: v0.11.10
-->* {string}

**Действителен только для ответа, полученного от [`http.ClientRequest`][].**

Сообщение о статусе ответа HTTP (фраза причины). E.G. `OK` or `Internal Server
Error`.

### `message.trailers`<!-- YAML
added: v0.3.0
-->* {Object}

Объект трейлеров запроса/ответа. Заполняется только в событии `'end'`.

### `message.url`<!-- YAML
added: v0.1.90
-->* {string}

**Действителен только для запроса, полученного от [`http.Server`][].**

Запросите URL-строку. Содержит только URL, который присутствует в текущем HTTP-запросе. Если запрос:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

To parse the URL into its parts:

```js
new URL(request.url, `http://${request.headers.host}`);
```

When `request.url` is `'/status?name=ryan'` and `request.headers.host` is `'localhost:3000'`:

```console
$ node
> new URL(request.url, `http://${request.headers.host}`)
URL {
  href: 'http://localhost:3000/status?name=ryan',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  username: '',
  password: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/status',
  search: '?name=ryan',
  searchParams: URLSearchParams { 'name' => 'ryan' },
  hash: ''
}
```

## `http.METHODS`<!-- YAML
added: v0.11.8
-->* {string[]}

Список методов HTTP, которые поддерживаются парсером.

## `http.STATUS_CODES`<!-- YAML
added: v0.1.22
-->* {Object}

Коллекция всех стандартных кодов состояния ответа HTTP и краткое описание каждого из них. Например, `http.STATUS_CODES[404] === 'Not Found'`.

## `http.createServer([options][, requestListener])`<!-- YAML
added: v0.1.13
changes:
  - version: v13.8.0
    pr-url: https://github.com/nodejs/node/pull/31448
    description: The `insecureHTTPParser` option is supported now.
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30570
    description: The `maxHeaderSize` option is supported now.
  - version: v9.6.0, v8.12.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: The `options` argument is supported now.
-->* `options` {Object}
  * `IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to be used. Useful for extending the original `IncomingMessage`. **Default:** `IncomingMessage`.
  * `ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to be used. Useful for extending the original `ServerResponse`. **Default:** `ServerResponse`.
  * `insecureHTTPParser` {boolean} Use an insecure HTTP parser that accepts invalid HTTP headers when `true`. Using the insecure parser should be avoided. See [`--insecure-http-parser`][] for more information. **Default:** `false`
  * `maxHeaderSize` {number} Optionally overrides the value of [`--max-http-header-size`][] for requests received by this server, i.e. the maximum length of request headers in bytes. **Default:** 8192 (8KB).
* `requestListener` {Function}

* Возвращает: {http.Server}

Возвращает новый экземпляр [`http.Server`][].

`requestListener` является функцией, которая автоматически добавляется к событию [`'request'`][].

## `http.get(options[, callback])`
## `http.get(url[, options][, callback])`<!-- YAML
added: v0.3.6
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `url` {string | URL}
* `options` {Object} Accepts the same `options` as [`http.request()`][], with the `method` always set to `GET`. Properties that are inherited from the prototype are ignored.
* `callback` {Function}
* Возвращает: {http.ClientRequest}

Поскольку большинство запросов являются запросами GET без тел, Node.js предоставляет этот удобный метод. Единственная разница между этим методом и [`http.request()`][] состоит в том, что он устанавливает метод на GET и автоматически вызывает `req.end()`. The callback must take care to consume the response data for reasons stated in [`http.ClientRequest`][] section.

The `callback` is invoked with a single argument that is an instance of [`http.IncomingMessage`][].

JSON fetching example:

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
    // Consume response data to free up memory
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

## `http.globalAgent`<!-- YAML
added: v0.5.9
-->* {http.Agent}

Глобальный экземпляр `Agent`, который используется в качестве значения по умолчанию для всех HTTP-запросов клиента.

## `http.maxHeaderSize`<!-- YAML
added: v11.6.0
-->* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

This can be overridden for servers and client requests by passing the `maxHeaderSize` option.

## `http.request(options[, callback])`
## `http.request(url[, options][, callback])`<!-- YAML
added: v0.3.6
changes:
  - version: v13.8.0
    pr-url: https://github.com/nodejs/node/pull/31448
    description: The `insecureHTTPParser` option is supported now.
  - version: v13.3.0
    pr-url: https://github.com/nodejs/node/pull/30570
    description: The `maxHeaderSize` option is supported now.
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `url` {string | URL}
* `options` {Object}
  * `agent` {http.Agent | boolean} Controls [`Agent`][] behavior. Possible values:
    * `undefined` (по умолчанию): используйте [`http.globalAgent`][] для этого хоста и порта.
    * Объект `Agent`: явно используйте переданное в `Agent`.
    * `false`: приводит к использованию нового `Agent` со значениями по умолчанию.
  * `auth` {string} Базовая аутентификация, т.е. `'user:password'` для вычисления заголовка Авторизации.
  * `createConnection` {Function} Функция, создающая сокет/поток, который используется для запроса, когда не применяется опция `agent`. Может быть использовано, чтобы избежать создания пользовательского класса `Agent`, просто чтобы переопределить функцию по умолчанию `createConnection`. Для более подробной информации смотрите [`agent.createConnection()`][]. Any [`Duplex`][] stream is a valid return value.
  * `defaultPort` {number} Default port for the protocol. **Default:** `agent.defaultPort` if an `Agent` is used, else `undefined`.
  * `family` {number} IP address family to use when resolving `host` or `hostname`. Допустимые значения: `4` или `6`. Если не указано, будут использоваться оба значения IP как v4, так и v6.
  * `headers` {Object} Объект, содержащий заголовки запроса.
  * `host` {string} Доменное имя или IP-адрес сервера, на который нужно отправить запрос. **Default:** `'localhost'`.
  * `hostname` {string} Псевдоним для `host`. To support [`url.parse()`][], `hostname` will be used if both `host` and `hostname` are specified.
  * `insecureHTTPParser` {boolean} Use an insecure HTTP parser that accepts invalid HTTP headers when `true`. Using the insecure parser should be avoided. See [`--insecure-http-parser`][] for more information. **Default:** `false`
  * `localAddress` {string} Локальный интерфейс для привязки сетевых подключений.
  * `lookup` {Function} Custom lookup function. **Default:** [`dns.lookup()`][].
  * `maxHeaderSize` {number} Optionally overrides the value of [`--max-http-header-size`][] for requests received from the server, i.e. the maximum length of response headers in bytes. **Default:** 8192 (8KB).
  * `method` {string} Строка, определяющая метод HTTP-запроса. **Default:** `'GET'`.
  * `path` {string} Путь запроса. Should include query string if any. Например, `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future. **Default:** `'/'`.
  * `port` {number} Порт удаленного сервера. **Default:** `defaultPort` if set, else `80`.
  * `protocol` {string} Протокол для использования. **Default:** `'http:'`.
  * `setHost` {boolean}: Specifies whether or not to automatically add the `Host` header. Defaults to `true`.
  * `socketPath` {string} Unix Domain Socket (cannot be used if one of `host` or `port` is specified, those specify a TCP Socket).
  * `timeout` {number}: A number specifying the socket timeout in milliseconds. Это установит тайм-аут перед подключением сокета.
* `callback` {Function}
* Возвращает: {http.ClientRequest}

Node.js поддерживает несколько подключений на сервер для выполнения HTTP-запросов. Эта функция позволяет осуществлять запросы прозрачно.

`url` can be a string or a [`URL`][] object. If `url` is a string, it is automatically parsed with [`new URL()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

If both `url` and `options` are specified, the objects are merged, with the `options` properties taking precedence.

Дополнительный параметр `callback` будет добавлен в качестве одноразового слушателя для события [`'response'`][].

`http.request()` возвращает экземпляр класса [`http.ClientRequest`][]. Экземпляр `ClientRequest` является записываемым потоком. Если необходимо загрузить файл с POST-запросом, пишите в объект `ClientRequest`.

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

// Write data to request body
req.write(postData);
req.end();
```

In the example `req.end()` was called. With `http.request()` one must always call `req.end()` to signify the end of the request - even if there is no data being written to the request body.

Если во время запроса обнаруживается какая-либо ошибка (например, с разрешением DNS, ошибками на уровне TCP или фактическими ошибками синтаксического анализа HTTP), в возвращаемом объекте запроса генерируется событие `'error'`. Как и со всеми событиями `'error'`, если нет зарегистрированных слушателей, будет выдана ошибка.

Есть несколько специальных заголовков, которые следует отметить.

* Отправка 'Connection: keep-alive' уведомит Node.js о том, что соединение с сервером должно сохраняться до следующего запроса.

* Отправка заголовка 'Content-Length' отключит фрагментированную кодировку по умолчанию.

* Отправка заголовка 'Expect' немедленно отправит заголовки запроса. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `'continue'` event should be set. See RFC 2616 Section 8.2.3 for more information.

* Отправка заголовка авторизации будет переопределять использование опции `auth` для вычисления базовой аутентификации.

Example using a [`URL`][] as `options`:

```js
const options = new URL('http://abc:xyz@example.com');

const req = http.request(options, (res) => {
  // ...
});
```

In a successful request, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` any number of times, on the `res` object (`'data'` will not be emitted at all if the response body is empty, for instance, in most redirects)
  * `'end'` on the `res` object
* `'close'`

In the case of a connection error, the following events will be emitted:

* `'socket'`
* `'error'`
* `'close'`

In the case of a premature connection close before the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'error'` with an error with message `'Error: socket hang up'` and code `'ECONNRESET'`
* `'close'`

In the case of a premature connection close after the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` any number of times, on the `res` object
* (connection closed here)
* `'aborted'` on the `res` object
* `'close'`
* `'close'` on the `res` object

If `req.abort()` is called before the connection succeeds, the following events will be emitted in the following order:

* `'socket'`
* (`req.abort()` called here)
* `'abort'`
* `'error'` with an error with message `'Error: socket hang up'` and code `'ECONNRESET'`
* `'close'`

If `req.abort()` is called after the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` any number of times, on the `res` object
* (`req.abort()` called here)
* `'abort'`
* `'aborted'` on the `res` object
* `'close'`
* `'close'` on the `res` object

Setting the `timeout` option or using the `setTimeout()` function will not abort the request or do anything besides add a `'timeout'` event.
