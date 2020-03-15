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

## Класс: http.Agent<!-- YAML
added: v0.3.4
-->`Agent` отвечает за управление сохранением и повторным использованием соединения для клиентов HTTP. Он поддерживает очередь ожидающих запросов для данного хоста и порта, повторно используя одно соединение сокета для каждого, пока очередь не закончится, и в этот момент сокет либо разрушается, либо помещается в пул, где он сохраняется для повторного использования для запросов на тот же хост и порт. Будет ли он разрушен или помещен в пул, зависит от [опции](#http_new_agent_options) `keepAlive`.

Соединения, помещенные в пул, имеют включенные для них TCP Keep-Alive, но серверы все еще могут закрывать незанятые соединения, в случае чего они могут быть удалены из пула, а при новом HTTP запросе для этого хоста и порта будет создаваться новое соединение. Также серверы могут отказать в разрешении нескольких запросов через одно и то же соединение, в этом случае соединение должно быть переделано для каждого запроса и не может быть объединено. `Agent` по-прежнему будет отправлять запросы на этот сервер, но каждый из них будет выполняться по новому соединению.

Когда соединение закрывается клиентом или сервером, оно удаляется из пула. Любые неиспользуемые сокеты в пуле будут отключены, чтобы не поддерживать процесс Node.js при отсутствии ожидающих запросов. (смотрите [socket.unref()](net.html#net_socket_unref)).

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
  agent: false  // create a new agent just for this one request
}, (res) => {
  // Do stuff with response
});
```

### new Agent([options])<!-- YAML
added: v0.3.4
-->* `options` {Object} Set of configurable options to set on the agent. Может иметь следующие поля:
  * `keepAlive` {boolean} Держите сокеты поблизости даже при отсутствии ожидающих запросов, чтобы их можно было использовать для будущих запросов без необходимости восстановления TCP-соединения. **По умолчанию:** `false`.
  * `keepAliveMsecs` {number} При использовании параметра `keepAlive` указывает [начальную задержку](net.html#net_socket_setkeepalive_enable_initialdelay) для TCP Keep-Alive пакетов. Игнорируется, если для параметра `keepAlive` установлено значение `false` или `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Максимальное количество разрешенных сокетов на один хост. **Default:** `Infinity`.
  * `maxFreeSockets` {number} Максимальное количество сокетов, которые остаются открытыми в свободном состоянии. Уместно, только если `keepAlive` установлено на `true`. **Default:** `256`.

По умолчанию [`http.globalAgent`][], который используется [`http.request()`][], имеет все эти значения установленными на соответствующие значения по умолчанию.

To configure any of them, a custom [`http.Agent`][] instance must be created.

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### agent.createConnection(options[, callback])<!-- YAML
added: v0.11.4
-->* `options` {Object} Параметры, содержащие детали подключения. Для просмотра формата параметров проверьте [`net.createConnection()`][]
* `callback` {Function} Функция обратного вызова, которая получает созданный сокет
* Возвращает: {net.Socket}

Создает сокет/поток, который будет использоваться для HTTP запросов.

По умолчанию эта функция схожа с [`net.createConnection()`][]. Однако пользовательские агенты могут переопределить этот метод в случае, если необходима большая гибкость.

Сокет/поток может быть предоставлен одним из двух способов: путем возврата сокета/потока из этой функции или путем передачи сокета/потока в `callback`.

`callback` имеет сигнатуру `(err, stream)`.

### agent.keepSocketAlive(socket)<!-- YAML
added: v8.1.0
-->* `socket` {net.Socket}

Вызывается, когда `socket` отсоединен от запроса и может быть сохранен Агентом. Поведение по умолчанию:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Этот метод может быть переопределен с помощью особого подкласса `Agent`. Если этот метод возвращает ложное значение, сокет будет уничтожен вместо сохранения его для использования со следующим запросом.

### agent.reuseSocket(socket, request)<!-- YAML
added: v8.1.0
-->* `socket` {net.Socket}
* `request` {http.ClientRequest}

Вызывается, когда `socket` подключается к `request` после сохранения из-за опций keep-alive. Поведение по умолчанию:

```js
socket.ref();
```

Этот метод может быть переопределен с помощью особого подкласса `Agent`.

### agent.destroy()<!-- YAML
added: v0.11.4
-->Уничтожает любые сокеты, которые в настоящее время используются агентом.

Обычно это делать не нужно. However, if using an agent with `keepAlive` enabled, then it is best to explicitly shut down the agent when it will no longer be used. В противном случае сокеты могут оставаться открытыми в течение довольно длительного времени, прежде чем сервер завершит их работу.

### agent.freeSockets<!-- YAML
added: v0.11.4
-->* {Object}

Объект, который содержит массивы сокетов, в настоящее время ожидающих использования агентом при включенном `keepAlive`. Не изменять.

### agent.getName(options)
<!-- YAML
added: v0.11.4
-->

* `options` {Object} A set of options providing information for name generation
  * `host` {string} Доменное имя или IP-адрес сервера, на который нужно отправить запрос
  * `port` {number} Порт удаленного сервера
  * `localAddress` {string} Локальный интерфейс для привязки к сетевым подключениям при выдаче запроса
  * `family` {integer} Must be 4 or 6 if this doesn't equal `undefined`.
* Возвращает: {string}

Получите уникальное имя для набора параметров запроса, чтобы определить, можно ли повторно использовать соединение. For an HTTP agent, this returns `host:port:localAddress` or `host:port:localAddress:family`. For an HTTPS agent, the name includes the CA, cert, ciphers, and other HTTPS/TLS-specific options that determine socket reusability.

### agent.maxFreeSockets<!-- YAML
added: v0.11.7
-->* {number}

По умолчанию установлено на 256. Для агентов с включенным `keepAlive` это устанавливает максимальное количество сокетов, которые останутся открытыми в свободном состоянии.

### agent.maxSockets<!-- YAML
added: v0.3.6
-->* {number}

По умолчанию установлено на бесконечность. Определяет, сколько одновременных сокетов агент может открыть для каждого источника. Origin is the returned value of [`agent.getName()`][].

### agent.requests<!-- YAML
added: v0.5.9
-->* {Object}

Объект, содержащий очереди запросов, которые еще не были назначены сокетам. Не изменять.

### agent.sockets
<!-- YAML
added: v0.3.6
-->

* {Object}

Объект, содержащий массивы сокетов, которые в настоящее время используются агентом. Не изменять.

## Класс: http.ClientRequest<!-- YAML
added: v0.1.17
-->Этот объект создается внутри и возвращается из [`http.request()`][]. Он представляет собой запрос _in-progress_, заголовок которого уже поставлен в очередь. The header is still mutable using the [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][] API. The actual header will be sent along with the first data chunk or when calling [`request.end()`][].

Чтобы получить ответ, добавьте слушатель для [`'response'`][] к объекту запроса. [`'response'`][] будет сгенерирован из объекта запроса после получения заголовков ответа. Событие [`'response'`][] выполняется с одним аргументом, который является экземпляром [`http.IncomingMessage`][].

Во время события [`'response'`][] можно добавлять слушатели к объекту ответа; особенно для прослушивания события `'data'`.

Если обработчик [`'response'`][] не добавлен, то ответ будет полностью отброшен. However, if a [`'response'`][] event handler is added, then the data from the response object **must** be consumed, either by calling `response.read()` whenever there is a `'readable'` event, or by adding a `'data'` handler, or by calling the `.resume()` method. Пока данные не будут использованы, событие `'end'` не будет запущено. Кроме того, до тех пор, пока данные не будут прочитаны, они будут использовать память, что в конечном итоге может привести к ошибке «процесса нехватки памяти».

*Note*: Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

Запрос реализует интерфейс [Writable Stream](stream.html#stream_class_stream_writable). Это [`EventEmitter`][] со следующими событиями:

### Событие: 'abort'<!-- YAML
added: v1.4.1
-->Генерируется, когда запрос был прерван клиентом. Это событие генерируется только при первом вызове `abort()`.

### Событие: 'connect'<!-- YAML
added: v0.7.0
-->* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Генерируется каждый раз, когда сервер отвечает на запрос методом `CONNECT`. Если это событие не прослушивается, клиенты, получающие метод `CONNECT`, закроют свои соединения.

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

### Событие: 'continue'<!-- YAML
added: v0.3.2
-->Генерируется, когда сервер отправляет HTTP-ответ '100 Continue', обычно потому, что запрос содержал 'Expect: 100-continue'. Это является инструкцией о том, что клиент должен отправить тело запроса.

### Событие: 'response'<!-- YAML
added: v0.1.0
-->* `response` {http.IncomingMessage}

Генерируется, когда получен ответ на этот запрос. Это событие создается только раз.

### Событие: 'socket'<!-- YAML
added: v0.5.3
-->* `socket` {net.Socket}

Генерируется после назначения сокета на этот запрос.

### Event: 'timeout'<!-- YAML
added: v0.7.8
-->Emitted when the underlying socket times out from inactivity. This only notifies that the socket has been idle. The request must be aborted manually.

See also: [`request.setTimeout()`][]

### Событие: 'upgrade'<!-- YAML
added: v0.1.94
-->* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Создается каждый раз, когда сервер отвечает на запрос с обновлением. Если это событие не прослушивается, клиенты, получающие обновленный заголовок, закроют свои соединения.

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
-->Помечает запрос как прерывание. Вызов этого приведет к удалению оставшихся данных в ответе и разрушению сокета.

### request.aborted<!-- YAML
added: v0.11.14
-->Если запрос был прерван, это значение будет временем, когда запрос был прерван, в миллисекундах с 1 января 1970 года 00:00:00 UTC.

### request.connection<!-- YAML
added: v0.3.0
-->* {net.Socket}

See [`request.socket`][]

### request.end(\[data[, encoding]\]\[, callback\])<!-- YAML
added: v0.1.90
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Завершает отправку запроса. Если какие-либо части тела не будут отправлены, он сбросит их в поток. Если запрос разбит на части, будут посланы завершающие `'0\r\n\r\n'`.

Если указан параметр `data`, то это эквивалентно вызову [`request.write(data, encoding)`][], за которым следует `request.end(callback)`.

Если указан `callback`, он будет вызываться при завершении потока запроса.

### request.flushHeaders()<!-- YAML
added: v1.6.0
-->Сброс заголовков запроса.

For efficiency reasons, Node.js normally buffers the request headers until `request.end()` is called or the first chunk of request data is written. It then tries to pack the request headers and data into a single TCP packet.

That's usually desired (it saves a TCP round-trip), but not when the first data is not sent until possibly much later. `request.flushHeaders()` bypasses the optimization and kickstarts the request.

### request.getHeader(name)<!-- YAML
added: v1.6.0
-->* `name` {string}
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
-->* `noDelay` {boolean}

После того, как сокет назначен и подключен, будет вызван [`socket.setNoDelay()`][].

### request.setSocketKeepAlive(\[enable\]\[, initialDelay\])<!-- YAML
added: v0.5.9
-->* `enable` {boolean}
* `initialDelay` {number}

После того, как сокет назначен и подключен, будет вызван [`socket.setKeepAlive()`][].

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
-->* {net.Socket}

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
-->* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Посылает часть тела. By calling this method many times, a request body can be sent to a server — in that case it is suggested to use the `['Transfer-Encoding', 'chunked']` header line when creating the request.

Аргумент `encoding` является опциональным и применяется только тогда, когда `chunk` является строкой. По умолчанию на `'utf8'`.

Аргумент `callback` является опциональным и будет вызываться при сбросе этого фрагмента данных.

Возвращает `true`, если все данные были успешно сброшены в буфер ядра. Возвращает `false`, если данные полностью или частично были поставлены в очередь в памяти пользователя. `'drain'` будет выдан, когда буфер снова освободиться.

## Класс: http.Server<!-- YAML
added: v0.1.17
-->This class inherits from [`net.Server`][] and has the following additional events:

### Событие: 'checkContinue'<!-- YAML
added: v0.3.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Выдается каждый раз при получении запроса HTTP `Expect: 100-continue`. Если это событие не прослушивается, сервер автоматически ответит `100 Continue` в зависимости от ситуации.

Обработка этого события включает вызов [`response.writeContinue()`][], если клиент должен продолжать отправлять тело запроса, или генерирование соответствующего ответа HTTP (например, 400 Bad Request), если клиент не должен продолжать отправлять тело запроса.

Обратите внимание, что когда это событие создается и обрабатывается, событие [`'request'`][] не будет сгенерировано.

### Событие: 'checkExpectation'<!-- YAML
added: v5.5.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Генерируется каждый раз при получении запроса с HTTP-заголовком `Expect`, где значение не равно `100-continue`. Если это событие не прослушивается, сервер автоматически ответит `417 Expectation Failed` в зависимости от ситуации.

Обратите внимание, что когда это событие создается и обрабатывается, событие [`'request'`][] не будет сгенерировано.

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
-->* `exception` {Error}
* `socket` {net.Socket}

Если клиентское соединение выдает событие `'error'`, оно будет перенаправлено сюда. Слушатель этого события отвечает за закрытие/разрушение базового сокета. For example, one may wish to more gracefully close the socket with a custom HTTP response instead of abruptly severing the connection.

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

Когда возникает событие `'clientError'`, то отсутствует объект `request` или `response`, поэтому любой отправленный HTTP-ответ, включая заголовки ответа и полезную нагрузку, *должен* быть записан непосредственно в объект `socket`. Необходимо убедиться, что ответ является правильно отформатированным ответным сообщением HTTP.

`err` is an instance of `Error` with two extra columns:

+ `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
+ `rawPacket`: the raw packet of current request.

### Событие: 'close'<!-- YAML
added: v0.1.4
-->Генерируется при завершении работы сервера.

### Событие: 'connect'<!-- YAML
added: v0.7.0
-->* `request` {http.IncomingMessage} Аргументы для HTTP запроса, как в событии [`'request'`][]
* `socket` {net.Socket} Сетевой сокет между сервером и клиентом
* `head` {Buffer} Первый пакет туннельного потока (может быть пустым)

Генерируется каждый раз, когда клиент запрашивает метод HTTP `CONNECT`. Если это событие не прослушивается, то клиенты, запрашивающие метод `CONNECT`, закроют свои соединения.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### Событие: 'connection'<!-- YAML
added: v0.1.0
-->* `socket` {net.Socket}

This event is emitted when a new TCP stream is established. `socket` is typically an object of type [`net.Socket`][]. Usually users will not want to access this event. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` can also be accessed at `request.connection`.

*Note*: This event can also be explicitly emitted by users to inject connections into the HTTP server. In that case, any [`Duplex`][] stream can be passed.

### Событие: 'request'<!-- YAML
added: v0.1.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Генерируется каждый раз, когда есть запрос. Обратите внимание, что может быть несколько запросов на соединение (в случае соединений HTTP Keep-Alive).

### Событие: 'upgrade'<!-- YAML
added: v0.1.94
-->* `request` {http.IncomingMessage} Аргументы для HTTP запроса, как в событии [`'request'`][]
* `socket` {net.Socket} Сетевой сокет между сервером и клиентом
* `head` {Buffer} Первый пакет обновленного потока (может быть пустым)

Генерируется каждый раз, когда клиент запрашивает обновление HTTP. Если это событие не прослушивается, то клиенты, запрашивающие обновление, закроют свои соединения.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### server.close([callback])<!-- YAML
added: v0.1.90
-->* `callback` {Function}

Останавливает сервер от принятия новых подключений. Смотрите [`net.Server.close()`][].

### server.listen()

Starts the HTTP server listening for connections. Этот метод идентичен [`server.listen()`][] от [`net.Server`][].

### server.listening<!-- YAML
added: v5.7.0
-->* {boolean}

Логическое значение, указывающее прослушивает ли сервер соединения или нет.

### server.maxHeadersCount<!-- YAML
added: v0.7.0
-->* {number} **Default:** `2000`

Limits maximum incoming headers count. If set to 0 - no limit will be applied.

### server.headersTimeout<!-- YAML
added: v8.14.0
-->* {number} **Default:** `40000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in \[server.timeout\]\[\] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See \[server.timeout\]\[\] for more information on how timeout behaviour can be customised.

### server.setTimeout(\[msecs\]\[, callback\])<!-- YAML
added: v0.9.12
-->* `msecs` {number} **Default:** `120000` (2 minutes)
* `callback` {Function}

Устанавливает значение времени ожидания и генерирует событие `'timeout'` на объект Сервера, передавая сокет в качестве аргумента, если возникает тайм-аут.

Если на объекте Сервера есть слушатель события `'timeout'`, он будет вызываться с сокетом времени ожидания в качестве аргумента.

По умолчанию значение времени ожидания сервера составляет 2 минуты, и сокеты автоматически удаляются, если это время истекает. However, if a callback is assigned to the Server's `'timeout'` event, timeouts must be handled explicitly.

Возвращает `server`.

### server.timeout<!-- YAML
added: v0.9.12
-->* {number} Timeout in milliseconds. **Default:** `120000` (2 minutes).

Количество миллисекунд бездействия до предположительного истечения времени ожидания сокета.

A value of `0` will disable the timeout behavior on incoming connections.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### server.keepAliveTimeout<!-- YAML
added: v8.0.0
-->* {number} Timeout in milliseconds. **Default:** `5000` (5 seconds).

The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

*Note*: The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Класс: http.ServerResponse<!-- YAML
added: v0.1.17
-->Этот объект создается внутренне сервером HTTP, а не пользователем. Он передается в качестве второго параметра событию [`'request'`][].

Ответ реализует, но не наследует, интерфейс [Writable Stream](stream.html#stream_class_stream_writable). Это [`EventEmitter`][] со следующими событиями:

### Событие: 'close'<!-- YAML
added: v0.6.7
-->Указывает, что основное соединение было прервано до того, как [`response.end()`][] было вызвано или может быть сброшено.

### Событие: 'finish'<!-- YAML
added: v0.3.6
-->Генерируется, когда ответ был отправлен. Если более конкретно, то это событие генерируется, когда последний сегмент заголовков и тела ответа был передан операционной системе для передачи через сеть. Это не означает, что клиент еще ничего не получил.

После этого события на объекте ответа больше не будет сгенерировано ни одного события.

### response.addTrailers(headers)<!-- YAML
added: v0.3.0
-->* `headers` {Object}

Этот метод добавляет в ответ конечные заголовки HTTP (заголовок, но в конце сообщения).

Трейлеры будут отправляться, **только** если для ответа используется фрагментированная кодировка; если это не так (например, если запрос был HTTP/1.0), они будут отброшены в тихом режиме.

Note that HTTP requires the `Trailer` header to be sent in order to emit trailers, with a list of the header fields in its value. Например,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Попытка установить имя поля заголовка или значение, содержащее недопустимые символы, приведет к выводу [`TypeError`][].


### response.connection<!-- YAML
added: v0.3.0
-->* {net.Socket}

See [`response.socket`][].

### response.end(\[data\]\[, encoding\][, callback])<!-- YAML
added: v0.1.90
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}

Этот метод сообщает серверу, что все заголовки и тело ответа отправлены; этот сервер должен считать это сообщение завершенным. Этот метод - `response.end()` - ДОЛЖЕН вызываться при каждом ответе.

Если указан параметр `data`, то это эквивалентно вызову [`response.write(data, encoding)`][], за которым следует `response.end(callback)`.

Если указан `callback`, он будет вызываться при завершении потока запроса.

### response.finished<!-- YAML
added: v0.0.2
-->* {boolean}

Логическое значение, которое указывает, был ли завершен ответ. Начинается со значением `false`. После выполнения [`response.end()`][] значение будет `true`.

### response.getHeader(name)<!-- YAML
added: v0.4.0
-->* `name` {string}
* Возвращает: {string}

Считывает заголовок, который уже был поставлен в очередь, но не отправлен клиенту. Обратите внимание, что имя не чувствительно к регистру.

Пример:

```js
const contentType = response.getHeader('content-type');
```

### response.getHeaderNames()<!-- YAML
added: v7.7.0
-->* Возвращает: {Array}

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
-->* Возвращает: {Object}

Returns a shallow copy of the current outgoing headers. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

*Note*: The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. This means that typical `Object` methods such as `obj.toString()`, `obj.hasOwnProperty()`, and others are not defined and *will not work*.

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
-->* {boolean}

Логическое значение (только для чтения). True, если заголовки были отправлены, в противном случае false.

### response.removeHeader(name)<!-- YAML
added: v0.4.0
-->* `name` {string}

Удаляет заголовок, который стоит в очереди для скрытой отправки.

Пример:

```js
response.removeHeader('Content-Encoding');
```

### response.sendDate<!-- YAML
added: v0.7.5
-->* {boolean}

При значении true заголовок Date будет автоматически сгенерирован и отправлен в ответе, если его еще нет в заголовках. По умолчанию на true.

Это должно быть отключено только для тестирования; HTTP требует заголовок Date в ответах.

### response.setHeader(name, value)
<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {string | string[]}

Устанавливает одно значение заголовка для неявных заголовков. Если этот заголовок уже существует в заголовках, которые подлежат отправке, его значение будет заменено. Use an array of strings here to send multiple headers with the same name.

Пример:

```js
response.setHeader('Content-Type', 'text/html');
```

или

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Попытка установить имя поля заголовка или значение, содержащее недопустимые символы, приведет к выводу [`TypeError`][].

Когда заголовки установлены с помощью [`response.setHeader()`][], они будут объединены с любым из заголовков, переданных в [`response.writeHead()`][], с заданным приоритетом заголовков, передаваемых в [`response.writeHead()`][].

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
-->* `msecs` {number}
* `callback` {Function}

Устанавливает значение времени ожидания Сокета на `msecs`. Если предусмотрен обратный вызов, то он добавляется в качестве слушателя для события `'timeout'` объекта ответа.

Если к запросу, ответу или серверу не добавлен прослушиватель `'timeout'`, то сокеты уничтожаются по истечении времени ожидания. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

Возвращает `response`.

### response.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

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
-->* {number}

При использовании неявных заголовков (без явного вызова [`response.writeHead()`][]) это свойство контролирует код состояния, который будет отправлен клиенту при сбросе заголовков.

Пример:

```js
response.statusCode = 404;
```

После того, как заголовок ответа был отправлен клиенту, это свойство указывает код состояния, который был отправлен.

### response.statusMessage<!-- YAML
added: v0.11.8
-->* {string}

При использовании неявных заголовков (без явного вызова [`response.writeHead()`][]) это свойство контролирует сообщение о состоянии, которое будет отправлено клиенту при сбросе заголовков. Если оставить это как `undefined`, то будет использовано стандартное сообщение для кода состояния.

Пример:

```js
response.statusMessage = 'Not found';
```

После того, как заголовок ответа был отправлен клиенту, это свойство указывает на сообщение о состоянии, которое было отправлено.

### response.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->* `chunk` {string|Buffer}
* `encoding` {string} **По умолчанию:** `'utf8'`
* `callback` {Function}
* Возвращает: {boolean}

Если этот метод вызывается, а [`response.writeHead()`][] не был вызван, то он переключится в режим неявного заголовка и очистит данные неявных заголовков.

Отправляет часть тела ответа. Этот метод может вызываться несколько раз, чтобы обеспечить последовательность частей тела.

Обратите внимание, что в модуле `http` тело ответа опускается, когда запрос является запросом HEAD. Точно так же ответы `204` и `304` _не должны_ включать тело сообщения.

`chunk` может быть строкой или буфером. Если `chunk` является строкой, второй параметр указывает, как кодировать его в поток байтов. `callback` will be called when this chunk of data is flushed.

*Примечание*: Это необработанное тело HTTP и не имеет ничего общего с многочастными высокоуровневыми кодировками тела, которые могут быть использованы.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Возвращает `true`, если все данные были успешно сброшены в буфер ядра. Возвращает `false`, если данные полностью или частично были поставлены в очередь в памяти пользователя. `'drain'` будет выдан, когда буфер снова освободиться.

### response.writeContinue()<!-- YAML
added: v0.3.0
-->Посылает клиенту сообщение HTTP/1.1 100 Continue, которое указывает, что тело запроса должно быть отправлено. Смотрите событие [`'checkContinue'`][] на `Server`.

### response.writeHead(statusCode\[, statusMessage\]\[, headers\])<!-- YAML
added: v0.1.30
changes:
  - version: v5.11.0, v4.4.5
    pr-url: https://github.com/nodejs/node/pull/6291
    description: A `RangeError` is thrown if `statusCode` is not a number in
                 the range `[100, 999]`.
-->* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Отправляет заголовок ответа на запрос. Код статуса - 3-значный код статуса HTTP вроде `404`. Последние аргументы - `headers` - являются заголовками ответа. При желании в качестве второго аргумента можно задать удобочитаемый человеком `statusMessage`.

Пример:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Этот метод может быть вызван лишь один раз на сообщение и только перед вызовом [`response.end()`][].

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

Когда заголовки установлены с помощью [`response.setHeader()`][], они будут объединены с любым из заголовков, переданных в [`response.writeHead()`][], с заданным приоритетом заголовков, передаваемых в [`response.writeHead()`][].

```js
// returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Обратите внимание, что Content-Length (длина содержимого) задается в байтах, а не в символах. Вышеприведенный пример работает, потому что строка `'hello world'` содержит только однобайтовые символы. Если тело содержит символы более высокого кода, тогда следует использовать `Buffer.byteLength()` для определения количества байтов в данной кодировке. И Node.js не проверяет, равны ли длина содержимого и длина тела, которое было передано.

Попытка установить имя поля заголовка или значение, содержащее недопустимые символы, приведет к выводу [`TypeError`][].

## Класс: http.IncomingMessage<!-- YAML
added: v0.1.17
-->Объект `IncomingMessage` создается с помощью [`http.Server`][] или [`http.ClientRequest`][] и передается в качестве первого аргумента событиям [`'request'`][] и [`'response'`][] соответственно. Может использоваться для доступа к статусу ответа, заголовкам и данным.

Он реализует интерфейс [Readable Stream](stream.html#stream_class_stream_readable), а также следующие дополнительные события, методы и свойства.

### Событие: 'aborted'<!-- YAML
added: v0.3.8
-->Emitted when the request has been aborted.

### Событие: 'close'<!-- YAML
added: v0.4.2
-->Указывает, что базовое соединение было закрыто. Так же как `'end'`, это событие происходит только один раз на ответ.

### message.aborted<!-- YAML
added: v8.13.0
-->* {boolean}

The `message.aborted` property will be `true` if the request has been aborted.

### message.complete<!-- YAML
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

### message.destroy([error])<!-- YAML
added: v0.3.0
-->* `error` {Error}

Вызывает `destroy()` на сокет, который получил `IncomingMessage`. Если задан `error`, генерируется событие `'error'`, а `error` передается в качестве аргумента любым слушателям события.

### message.headers<!-- YAML
added: v0.1.5
-->* {Object}

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

В зависимости от имени заголовка, дубликаты в необработанных заголовках обрабатываются следующими способами:

* Дубликаты `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after` или `user-agent` отбрасываются.
* `set-cookie` всегда массив. Дубликаты добавляются в массив.
* Для всех других заголовков значения соединяются с помощью ', '.

### message.httpVersion<!-- YAML
added: v0.1.1
-->* {string}

В случае запроса сервера - версия HTTP, отправленная клиентом. В случае ответа клиента - версия HTTP подключенного сервера. Возможно, `'1.1'` или `'1.0'`.

Также `message.httpVersionMajor` является первым целым числом, а `message.httpVersionMinor` - вторым.

### message.method<!-- YAML
added: v0.1.1
-->* {string}

**Действителен только для запроса, полученного от [`http.Server`][].**

Метод запроса в качестве строки. Только для чтения. Пример: `'GET'`, `'DELETE'`.

### message.rawHeaders<!-- YAML
added: v0.11.6
-->* {Array}

Список необработанных заголовков запроса/ответа в том виде, в котором они были получены.

Обратите внимание, что ключи и значения находятся в одном списке. Это *не* список кортежей. Таким образом, даже четные смещения являются ключевыми значениями, а нечетные смещения - сопутствующими.

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
-->* {Array}

Необработанные ключи трейлера и значения запроса/ответа в том виде, как они были получены. Заполняется только в событии `'end'`.

### message.setTimeout(msecs, callback)<!-- YAML
added: v0.5.9
-->* `msecs` {number}
* `callback` {Function}

Вызывает `message.connection.setTimeout(msecs, callback)`.

Возвращает `message`.

### message.socket<!-- YAML
added: v0.3.0
-->* {net.Socket}

Объект [`net.Socket`][], связанный с подключением.

С поддержкой HTTPS используйте [`request.socket.getPeerCertificate()`][], чтобы получить детали аутентификации клиента.

### message.statusCode<!-- YAML
added: v0.1.1
-->* {number}

**Действителен только для ответа, полученного от [`http.ClientRequest`][].**

Трехзначный код состояния ответа HTTP. Например, `404`.

### message.statusMessage<!-- YAML
added: v0.11.10
-->* {string}

**Действителен только для ответа, полученного от [`http.ClientRequest`][].**

Сообщение о статусе ответа HTTP (фраза причины). Например, `OK` или `Internal Server Error`.

### message.trailers<!-- YAML
added: v0.3.0
-->* {Object}

Объект трейлеров запроса/ответа. Заполняется только в событии `'end'`.

### message.url<!-- YAML
added: v0.1.90
-->* {string}

**Действителен только для запроса, полученного от [`http.Server`][].**

Запросите URL-строку. Содержит только URL, который присутствует в текущем HTTP-запросе. Если запрос:

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
-->* {Array}

Список методов HTTP, которые поддерживаются парсером.

## http.STATUS_CODES<!-- YAML
added: v0.1.22
-->* {Object}

Коллекция всех стандартных кодов состояния ответа HTTP и краткое описание каждого из них. Например, `http.STATUS_CODES[404] === 'Not Found'`.

## http.createServer([requestListener])<!-- YAML
added: v0.1.13
-->- `requestListener` {Function}

* Возвращает: {http.Server}

Возвращает новый экземпляр [`http.Server`][].

`requestListener` является функцией, которая автоматически добавляется к событию [`'request'`][].

## http.get(options[, callback])<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->* `options` {Object | string | URL} Принимает те же `options`, что и [`http.request()`][], с параметром `method`, всегда установленным на `GET`. Properties that are inherited from the prototype are ignored.
* `callback` {Function}
* Возвращает: {http.ClientRequest}

Поскольку большинство запросов являются запросами GET без тел, Node.js предоставляет этот удобный метод. Единственная разница между этим методом и [`http.request()`][] состоит в том, что он устанавливает метод на GET и автоматически вызывает `req.end()`. Обратите внимание, что обратный вызов должен позаботиться о том, чтобы использовать данные ответа по причинам, указанным в разделе [`http.ClientRequest`][].

`callback` вызывается с одним аргументом, который является экземпляром [`http.IncomingMessage`][]

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
-->* {http.Agent}

Глобальный экземпляр `Agent`, который используется в качестве значения по умолчанию для всех HTTP-запросов клиента.

## http.maxHeaderSize<!-- YAML
added: v8.15.0
-->* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

## http.request(options[, callback])
<!-- YAML
added: v0.3.6
changes:
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `options` {Object | string | URL}
  * `protocol` {string} Протокол для использования. **Default:** `http:`.
  * `host` {string} Доменное имя или IP-адрес сервера, на который нужно отправить запрос. **Default:** `localhost`.
  * `hostname` {string} Псевдоним для `host`. Предпочтительно использовать `hostname` вместо `host` для поддержания [`url.parse()`][].
  * `family` {number} Семейство IP-адресов для использования при разрешении `host` и `hostname`. Допустимые значения: `4` или `6`. Если не указано, будут использоваться оба значения IP как v4, так и v6.
  * `port` {number} Порт удаленного сервера. **Default:** `80`.
  * `localAddress` {string} Локальный интерфейс для привязки сетевых подключений.
  * `socketPath` {string} Сокет домена Unix (используйте либо host:port, либо socketPath).
  * `method` {string} Строка, определяющая метод HTTP-запроса. **Default:** `'GET'`.
  * `path` {string} Путь запроса. Should include query string if any. Например, `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future. **Default:** `'/'`.
  * `headers` {Object} Объект, содержащий заголовки запроса.
  * `auth` {string} Базовая аутентификация, т.е. `'user:password'` для вычисления заголовка Авторизации.
  * `agent` {http.Agent | boolean} Controls [`Agent`][] behavior. Возможные значения:
   * `undefined` (по умолчанию): используйте [`http.globalAgent`][] для этого хоста и порта.
   * Объект `Agent`: явно используйте переданное в `Agent`.
   * `false`: приводит к использованию нового `Agent` со значениями по умолчанию.
  * `createConnection` {Function} Функция, создающая сокет/поток, который используется для запроса, когда не применяется опция `agent`. Может быть использовано, чтобы избежать создания пользовательского класса `Agent`, просто чтобы переопределить функцию по умолчанию `createConnection`. Для более подробной информации смотрите [`agent.createConnection()`][]. Any [`Duplex`][] stream is a valid return value.
  * `timeout` {number}: A number specifying the socket timeout in milliseconds. Это установит тайм-аут перед подключением сокета.
* `callback` {Function}
* Возвращает: {http.ClientRequest}

Node.js поддерживает несколько подключений на сервер для выполнения HTTP-запросов. Эта функция позволяет осуществлять запросы прозрачно.

`options` can be an object, a string, or a [`URL`][] object. Если в качестве значения `options` выступает строка, то этот аргумент автоматически подвергается парсингу при помощи [`url.parse()`][]. Если это объект [`URL`][], то он будет автоматически преобразован в обычный объект `options`.

Дополнительный параметр `callback` будет добавлен в качестве одноразового слушателя для события [`'response'`][].

`http.request()` возвращает экземпляр класса [`http.ClientRequest`][]. Экземпляр `ClientRequest` является записываемым потоком. Если необходимо загрузить файл с POST-запросом, пишите в объект `ClientRequest`.

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

Если во время запроса обнаруживается какая-либо ошибка (например, с разрешением DNS, ошибками на уровне TCP или фактическими ошибками синтаксического анализа HTTP), в возвращаемом объекте запроса генерируется событие `'error'`. Как и со всеми событиями `'error'`, если нет зарегистрированных слушателей, будет выдана ошибка.

Есть несколько специальных заголовков, которые следует отметить.

* Отправка 'Connection: keep-alive' уведомит Node.js о том, что соединение с сервером должно сохраняться до следующего запроса.

* Отправка заголовка 'Content-Length' отключит фрагментированную кодировку по умолчанию.

* Отправка заголовка 'Expect' немедленно отправит заголовки запроса. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `continue` event should be set. Для более подробной информации смотрите RFC2616 раздел 8.2.3.

* Отправка заголовка авторизации будет переопределять использование опции `auth` для вычисления базовой аутентификации.

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
