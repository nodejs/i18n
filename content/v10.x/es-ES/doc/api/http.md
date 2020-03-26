# HTTP

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

Para utilizar el servidor HTTP y el cliente, uno debe utilizar `require('http')`.

The HTTP interfaces in Node.js are designed to support many features of the protocol which have been traditionally difficult to use. En particular, mensajes grandes y potencialmente codificados en fragmentos. The interface is careful to never buffer entire requests or responses — the user is able to stream data.

Los encabezados de los mensajes HTTP se representan mediante un objeto como el siguiente:

```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Las llaves o identificadores se escriben en minúscula. Los valores no son modificados.

In order to support the full spectrum of possible HTTP applications, Node.js's HTTP API is very low-level. It deals with stream handling and message parsing only. It parses a message into headers and body but it does not parse the actual headers or the body.

Consulte la sección [`message.headers`][] para conocer detalles de como los encabezados duplicados son manejados.

The raw headers as they were received are retained in the `rawHeaders` property, which is an array of `[key, value, key2, value2, ...]`. For example, the previous message header object might have a `rawHeaders` list like the following:

```js
[ 'content-length', '123',
  'content-type', 'text/plain',
  'connection', 'keep-alive',
  'host', 'mysite.com',
  'accept', '*/*' ]
```

## Class: http.Agent<!-- YAML
added: v0.3.4
-->An 

`Agent` is responsible for managing connection persistence and reuse for HTTP clients. It maintains a queue of pending requests for a given host and port, reusing a single socket connection for each until the queue is empty, at which time the socket is either destroyed or put into a pool where it is kept to be used again for requests to the same host and port. Whether it is destroyed or pooled depends on the `keepAlive` [option](#http_new_agent_options).

Pooled connections have TCP Keep-Alive enabled for them, but servers may still close idle connections, in which case they will be removed from the pool and a new connection will be made when a new HTTP request is made for that host and port. Servers may also refuse to allow multiple requests over the same connection, in which case the connection will have to be remade for every request and cannot be pooled. The `Agent` will still make the requests to that server, but each one will occur over a new connection.

When a connection is closed by the client or the server, it is removed from the pool. Any unused sockets in the pool will be unrefed so as not to keep the Node.js process running when there are no outstanding requests. (see [`socket.unref()`]).

It is good practice, to [`destroy()`][] an `Agent` instance when it is no longer in use, because unused sockets consume OS resources.

Sockets are removed from an agent when the socket emits either a `'close'` event or an `'agentRemove'` event. When intending to keep one HTTP request open for a long time without keeping it in the agent, something like the following may be done:

```js
http.get(options, (res) => {
  // Hacer algo
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

Un agente también puede ser utilizado para una solicitud individual. By providing `{agent: false}` as an option to the `http.get()` or `http.request()` functions, a one-time use `Agent` with default options will be used for the client connection.

`agent:false`:

```js
http.get({
  hostname: 'localhost',
  port: 80,
  path: '/',
  agent: false  // crea un nuevo agente solo para esta petición
}, (res) => {
  // Hacer algo con la respuesta
});
```

### new Agent([options])<!-- YAML
added: v0.3.4
-->

* `options` {Object} Set of configurable options to set on the agent. Puede tener los siguientes campos:
  
  * `keepAlive` {boolean} Keep sockets around even when there are no outstanding requests, so they can be used for future requests without having to reestablish a TCP connection. Not to be confused with the `keep-alive` value of the `Connection` header. The `Connection: keep-alive` header is always sent when using an agent except when the `Connection` header is explicitly specified or when the `keepAlive` and `maxSockets` options are respectively set to `false` and `Infinity`, in which case `Connection: close` will be used. **Default:**`false`.
  * `keepAliveMsecs` {number} When using the `keepAlive` option, specifies the [initial delay](net.html#net_socket_setkeepalive_enable_initialdelay) for TCP Keep-Alive packets. Ignored when the `keepAlive` option is `false` or `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Maximum number of sockets to allow per host. Each request will use a new socket until the maximum is reached. **Default:** `Infinito`.
  * `maxFreeSockets` {number} Maximum number of sockets to leave open in a free state. Solo es relevante si `keepAlive` se establece a `true`. **Default:** `256`.
  * `timeout` {number} Socket timeout in milliseconds. This will set the timeout when the socket is created.

`options` in [`socket.connect()`][] are also supported.

The default [`http.globalAgent`][] that is used by [`http.request()`][] has all of these values set to their respective defaults.

Para configurar cualquiera de ellos, se deberá crear una instancia de [`http.Agent`][].

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### agent.createConnection(options[, callback])<!-- YAML
added: v0.11.4
-->

* `options` {Object} Opciones que contienen los detalles de conexión. Check [`net.createConnection()`][] for the format of the options

* `callback` {Function} Función de callback que recibe el socket creado

* Devuelve: {net.Socket}

Produce un socket/stream para ser utilizado para las solicitudes de HTTP.

Por defecto, esta función es la misma que [`net.createConnection()`][]. However, custom agents may override this method in case greater flexibility is desired.

A socket/stream can be supplied in one of two ways: by returning the socket/stream from this function, or by passing the socket/stream to `callback`.

`callback` tiene una firma de `(err, stream)`.

### agent.keepSocketAlive(socket)<!-- YAML
added: v8.1.0
-->

* `socket` {net.Socket}

Called when `socket` is detached from a request and could be persisted by the `Agent`. El comportamiento predeterminado es:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Este método puede ser anulado por una subclase de `Agent` particular. If this method returns a falsy value, the socket will be destroyed instead of persisting it for use with the next request.

### agent.reuseSocket(socket, request)<!-- YAML
added: v8.1.0
-->

* `socket` {net.Socket}

* `request` {http.ClientRequest}

Called when `socket` is attached to `request` after being persisted because of the keep-alive options. El comportamiento predeterminado es:

```js
socket.ref();
```

Este método puede ser anulado por una subclase de `Agent` particular.

### agent.destroy()<!-- YAML
added: v0.11.4
-->Destroy any sockets that are currently in use by the agent.

Generalmente, no es necesario hacer esto. However, if using an agent with `keepAlive` enabled, then it is best to explicitly shut down the agent when it will no longer be used. Otherwise, sockets may hang open for quite a long time before the server terminates them.

### agent.freeSockets<!-- YAML
added: v0.11.4
-->

* {Objeto}

An object which contains arrays of sockets currently awaiting use by the agent when `keepAlive` is enabled. No modificar.

### agent.getName(options)

<!-- YAML
added: v0.11.4
-->

* `options` {Object} Un conjunto de opciones que proporcionan información para la generación de nombres 
  * `host` {string} Un nombre de dominio o dirección IP del servidor al cual se emite la solicitud
  * `port` {number} Puerto del servidor remoto
  * `localAddress` {string} Local interface to bind for network connections when issuing the request
  * `family` {integer} Debe ser 4 o 6 si su valor no es igual a `undefined`.
* Devuelve: {string}

Get a unique name for a set of request options, to determine whether a connection can be reused. For an HTTP agent, this returns `host:port:localAddress` or `host:port:localAddress:family`. For an HTTPS agent, the name includes the CA, cert, ciphers, and other HTTPS/TLS-specific options that determine socket reusability.

### agent.maxFreeSockets<!-- YAML
added: v0.11.7
-->

* {number}

Por defecto, el valor es 256. For agents with `keepAlive` enabled, this sets the maximum number of sockets that will be left open in the free state.

### agent.maxSockets<!-- YAML
added: v0.3.6
-->

* {number}

By default set to `Infinity`. Determines how many concurrent sockets the agent can have open per origin. Origen es el valor devuelto de [`agent.getName()`][].

### agent.requests<!-- YAML
added: v0.5.9
-->

* {Object}

An object which contains queues of requests that have not yet been assigned to sockets. No modificar.

### agent.sockets

<!-- YAML
added: v0.3.6
-->

* {Object}

An object which contains arrays of sockets currently in use by the agent. No modificar.

## Class: http.ClientRequest<!-- YAML
added: v0.1.17
-->This object is created internally and returned from [

`http.request()`][]. It represents an *in-progress* request whose header has already been queued. The header is still mutable using the [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][] API. The actual header will be sent along with the first data chunk or when calling [`request.end()`][].

Para obtener la respuesta, agregue un listener de [`'response'`][] al objeto de la solicitud. [`'response'`][] will be emitted from the request object when the response headers have been received. The [`'response'`][] event is executed with one argument which is an instance of [`http.IncomingMessage`][].

During the [`'response'`][] event, one can add listeners to the response object; particularly to listen for the `'data'` event.

If no [`'response'`][] handler is added, then the response will be entirely discarded. However, if a [`'response'`][] event handler is added, then the data from the response object **must** be consumed, either by calling `response.read()` whenever there is a `'readable'` event, or by adding a `'data'` handler, or by calling the `.resume()` method. Hasta que los datos no sean consumidos, el evento `'end'` no se activará. Also, until the data is read it will consume memory that can eventually lead to a 'process out of memory' error.

Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

The request inherits from [Stream](stream.html#stream_stream), and additionally implements the following:

### Event: 'abort'<!-- YAML
added: v1.4.1
-->Emitted when the request has been aborted by the client. This event is only emitted on the first call to 

`abort()`.

### Evento: 'connect'<!-- YAML
added: v0.7.0
-->

* `response` {http.IncomingMessage}

* `socket` {net.Socket}

* `head` {Buffer}

Emitido cada vez que un servidor responde a una solicitud con un método `CONNECT` . If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

Un par de un servidor y cliente que demuestra cómo escuchar el evento: `'connect'` :

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
    host: '127.0.0.1',
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

### Event: 'information'<!-- YAML
added: v10.0.0
-->Emitted when the server sends a 1xx response (excluding 101 Upgrade). This event is emitted with a callback containing an object with a status code.

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

req.on('information', (res) => {
  console.log(`Got information prior to main response: ${res.statusCode}`);
});
```

101 Upgrade statuses do not fire this event due to their break from the traditional HTTP request/response chain, such as web sockets, in-place TLS upgrades, or HTTP 2.0. To be notified of 101 Upgrade notices, listen for the [`'upgrade'`][] event instead.

### Evento: 'response'<!-- YAML
added: v0.1.0
-->

* `response` {http.IncomingMessage}

Se emite cuando se recibe una respuesta para esta solicitud. This event is emitted only once.

### Evento: 'socket'<!-- YAML
added: v0.5.3
-->

* `socket` {net.Socket}

Se emite después de que un socket sea asignado a esta solicitud.

### Event: 'timeout'<!-- YAML
added: v0.7.8
-->Emitted when the underlying socket times out from inactivity. This only notifies that the socket has been idle. La solicitud debe ser abortada manualmente.

See also: [`request.setTimeout()`][].

### Evento: 'upgrade'<!-- YAML
added: v0.1.94
-->

* `response` {http.IncomingMessage}

* `socket` {net.Socket}

* `head` {Buffer}

Emitido cada vez que un servidor responde a una solicitud con una actualización. If this event is not being listened for and the response status code is 101 Switching Protocols, clients receiving an upgrade header will have their connections closed.

Un par de un servidor y cliente que demuestra cómo escuchar el evento `'upgrade'` .

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

See [`request.socket`][].

### request.end(\[data[, encoding]\]\[, callback\])<!-- YAML
added: v0.1.90
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ClientRequest`.
-->

* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Devuelve: {this}

Termina de enviar la solicitud. If any parts of the body are unsent, it will flush them to the stream. If the request is chunked, this will send the terminating `'0\r\n\r\n'`.

If `data` is specified, it is equivalent to calling [`request.write(data, encoding)`][] followed by `request.end(callback)`.

If `callback` is specified, it will be called when the request stream is finished.

### request.finished<!-- YAML
added: v0.0.1
-->

* {boolean}

The `request.finished` property will be `true` if [`request.end()`][] has been called. `request.end()` will automatically be called if the request was initiated via [`http.get()`][].

### request.flushHeaders()<!-- YAML
added: v1.6.0
-->Flush the request headers.

For efficiency reasons, Node.js normally buffers the request headers until `request.end()` is called or the first chunk of request data is written. It then tries to pack the request headers and data into a single TCP packet.

That's usually desired (it saves a TCP round-trip), but not when the first data is not sent until possibly much later. `request.flushHeaders()` bypasses the optimization and kickstarts the request.

### request.getHeader(name)<!-- YAML
added: v1.6.0
-->

* `name` {string}

* Returns: {any}

Lee una cabecera en la solicitud. Note that the name is case insensitive. The type of the return value depends on the arguments provided to [`request.setHeader()`][].

```js
request.setHeader('content-type', 'text/html');
request.setHeader('Content-Length', Buffer.byteLength(body));
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
const contentType = request.getHeader('Content-Type');
// contentType is 'text/html'
const contentLength = request.getHeader('Content-Length');
// contentLength is of type number
const cookie = request.getHeader('Cookie');
// cookie is of type string[]
```

### request.maxHeadersCount

* {number} **Predeterminado:** `2000`

Limits maximum response headers count. If set to 0, no limit will be applied.

### request.removeHeader(name)

<!-- YAML
added: v1.6.0
-->

* `name` {string}

Elimina a una cabecera que ya está definida dentro del objeto de cabeceras.

```js
request.removeHeader('Content-Type');
```

### request.setHeader(name, value)

<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {any}

Establece a un único valor de cabecera para el objeto de cabeceras. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`request.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
request.setHeader('Content-Type', 'application/json');
```

o

```js
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
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

### request.setTimeout(timeout[, callback])<!-- YAML
added: v0.5.9
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/8895
    description: Consistently set socket timeout only when the socket connects.
-->

* `timeout` {number} Milisegundos antes que se agote el tiempo de la solicitud.
* `callback` {Function} Función opcional que será llamada cuando ocurra un timeout. Igual a enlazar al evento `'timeout'` .
* Devuelve: {http.ClientRequest}

Once a socket is assigned to this request and is connected [`socket.setTimeout()`][] will be called.

### request.socket<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Referencia al socket subyacente. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` may also be accessed via `request.connection`.

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
  // consume objeto respuesta
});
```

### request.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->

* `chunk` {string|Buffer}

* `encoding` {string}

* `callback` {Function}
* Devuelve: {boolean}

Envía un fragmento del cuerpo. By calling this method many times, a request body can be sent to a server — in that case it is suggested to use the `['Transfer-Encoding', 'chunked']` header line when creating the request.

El argumento `encoding` es opcional y solo aplica cuando `chunk` es una string. Por defecto es `'utf8'`.

The `callback` argument is optional and will be called when this chunk of data is flushed, but only if the chunk is non-empty.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Devuelve como `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

When `write` function is called with empty string or buffer, it does nothing and waits for more input.

## Class: http.Server<!-- YAML
added: v0.1.17
-->This class inherits from [

`net.Server`][] and has the following additional events:

### Evento: 'checkContinue'<!-- YAML
added: v0.3.0
-->

* `request` {http.IncomingMessage}

* `response` {http.ServerResponse}

Se emite cada vez que se recibe una solicitud con un HTTP `Expect: 100-continue` . If this event is not listened for, the server will automatically respond with a `100 Continue` as appropriate.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

Note that when this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Evento: 'checkExpectation'<!-- YAML
added: v5.5.0
-->

* `request` {http.IncomingMessage}

* `response` {http.ServerResponse}

Emitted each time a request with an HTTP `Expect` header is received, where the value is not `100-continue`. If this event is not listened for, the server will automatically respond with a `417 Expectation Failed` as appropriate.

Note that when this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Evento: 'clientError'<!-- YAML
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
-->

* `exception` {Error}
* `socket` {net.Socket}

Si una conexión del cliente emite un evento `'error'`, será reenviado aquí. Listener of this event is responsible for closing/destroying the underlying socket. For example, one may wish to more gracefully close the socket with a custom HTTP response instead of abruptly severing the connection.

Default behavior is to close the socket with an HTTP '400 Bad Request' response if possible, otherwise the socket is immediately destroyed.

`socket` es el objeto [`net.Socket`][] desde el cual se originó el error.

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

`err` es una instancia de `Error` con dos columnas adicionales:

* `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
* `rawPacket`: el paquete crudo de la respuesta actual.

### Event: 'close'<!-- YAML
added: v0.1.4
-->Emitted when the server closes.

### Evento: 'connect'<!-- YAML
added: v0.7.0
-->

* `request` {http.IncomingMessage} Arguments for the HTTP request, as it is in the [`'request'`][] event

* `socket` {net.Socket} Socket de red entre el servidor y el cliente

* `head` {Buffer} El primer paquete del stream actualizado (puede estar vacío)

Se emite cada vez que un cliente solicita un método de HTTP `CONNECT` . If this event is not listened for, then clients requesting a `CONNECT` method will have their connections closed.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### Evento: 'connection'<!-- YAML
added: v0.1.0
-->

* `socket` {net.Socket}

Este evento se emite cuando se establece un stream TCP nuevo. `socket` is typically an object of type [`net.Socket`][]. Generalmente, los usuarios no querrán acceder a este evento. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` can also be accessed at `request.connection`.

This event can also be explicitly emitted by users to inject connections into the HTTP server. En ese caso, cualquier stream [`Duplex`][] puede ser pasado.

### Evento: 'request'<!-- YAML
added: v0.1.0
-->

* `request` {http.IncomingMessage}

* `response` {http.ServerResponse}

Se emite cada vez que hay una solicitud. Note that there may be multiple requests per connection (in the case of HTTP Keep-Alive connections).

### Evento: 'upgrade'<!-- YAML
added: v0.1.94
changes:

  - version: v10.0.0
    pr-url: v10.0.0
    description: Not listening to this event no longer causes the socket
                 to be destroyed if a client sends an Upgrade header.
-->

* `request` {http.IncomingMessage} Arguments for the HTTP request, as it is in the [`'request'`][] event
* `socket` {net.Socket} Socket de red entre el servidor y el cliente
* `head` {Buffer} El primer paquete del stream actualizado (puede estar vacío)

Se emite cada vez que un cliente solicita una actualización de HTTP. Listening to this event is optional and clients cannot insist on a protocol change.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### server.close([callback])<!-- YAML
added: v0.1.90
-->

* `callback` {Function}

No permite que el servidor acepte nuevas conexiones. Vea [`net.Server.close()`][].

### server.listen()

Inicia el servidor HTTP escuchando conexiones. Este método es idéntico a [`server.listen()`][] de [`net.Server`][].

### server.listening<!-- YAML
added: v5.7.0
-->

* {boolean} Indica si el servidor está o no está escuchando por conexiones.

### server.maxHeadersCount<!-- YAML
added: v0.7.0
-->

* {number} **Predeterminado:** `2000`

Limita al conteo máximo de cabeceras entrantes. If set to 0, no limit will be applied.

### server.headersTimeout<!-- YAML
added: v10.14.0
-->

* {number} **Predeterminado:** `40000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in \[server.timeout\]\[\] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See \[server.timeout\]\[\] for more information on how timeout behaviour can be customised.

### server.setTimeout(\[msecs\]\[, callback\])<!-- YAML
added: v0.9.12
-->

* `msecs` {number} **Predeterminado:** `120000` (2 minutos)

* `callback` {Function}

* Devuelve: {http.Server}

Sets the timeout value for sockets, and emits a `'timeout'` event on the Server object, passing the socket as an argument, if a timeout occurs.

If there is a `'timeout'` event listener on the Server object, then it will be called with the timed-out socket as an argument.

By default, the Server's timeout value is 2 minutes, and sockets are destroyed automatically if they time out. However, if a callback is assigned to the Server's `'timeout'` event, timeouts must be handled explicitly.

### server.timeout<!-- YAML
added: v0.9.12
-->

* {number} Tiempo de espera en milisegundos. **Predeterminado:** `120000` (2 minutos).

The number of milliseconds of inactivity before a socket is presumed to have timed out.

Un valor de `0` inhabilitará el comportamiento del tiempo de espera en conexiones entrantes.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### server.keepAliveTimeout<!-- YAML
added: v8.0.0
-->

* {number} Tiempo de espera en milisegundos. **Predeterminado:** `5000` (5 segundos).

The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: http.ServerResponse<!-- YAML
added: v0.1.17
-->This object is created internally by an HTTP server — not by the user. It is passed as the second parameter to the [

`'request'`][] event.

The response inherits from [Stream](stream.html#stream_stream), and additionally implements the following:

### Event: 'close'<!-- YAML
added: v0.6.7
-->Indicates that the underlying connection was terminated before [

`response.end()`][] was called or able to flush.

### Event: 'finish'<!-- YAML
added: v0.3.6
-->Emitted when the response has been sent. More specifically, this event is emitted when the last segment of the response headers and body have been handed off to the operating system for transmission over the network. It does not imply that the client has received anything yet.

### response.addTrailers(headers)<!-- YAML
added: v0.3.0
-->

* `headers` {Object}

This method adds HTTP trailing headers (a header but at the end of the message) to the response.

Trailers will **only** be emitted if chunked encoding is used for the response; if it is not (e.g. if the request was HTTP/1.0), they will be silently discarded.

Note that HTTP requires the `Trailer` header to be sent in order to emit trailers, with a list of the header fields in its value. Por ejemplo,

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

Vea [`response.socket`][].

### response.end(\[data\]\[, encoding\][, callback])<!-- YAML
added: v0.1.90
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ServerResponse`.
-->

* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Devuelve: {this}

This method signals to the server that all of the response headers and body have been sent; that server should consider this message complete. Este método, `response.end()`, DEBE ser llamado en cada respuesta.

If `data` is specified, it is similar in effect to calling [`response.write(data, encoding)`][] followed by `response.end(callback)`.

If `callback` is specified, it will be called when the response stream is finished.

### response.finished<!-- YAML
added: v0.0.2
-->

* {boolean}

Valor booleano que indica si se ha completado la respuesta. Starts as `false`. Después de que [`response.end()`][] se ejecute, el valor será `true`.

### response.getHeader(name)<!-- YAML
added: v0.4.0
-->

* `name` {string}

* Returns: {any}

Lee una cabecera que ya sido puesta en cola, pero que no ha sido enviada al cliente. Note that the name is case insensitive. The type of the return value depends on the arguments provided to [`response.setHeader()`][].

```js
response.setHeader('Content-Type', 'text/html');
response.setHeader('Content-Length', Buffer.byteLength(body));
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
const contentType = response.getHeader('content-type');
// contentType es 'text/html'
const contentLength = response.getHeader('Content-Length');
// contentLength es de tipo number
const setCookie = response.getHeader('set-cookie');
// setCookie es de tipo string[]
```

### response.getHeaderNames()<!-- YAML
added: v7.7.0
-->

* Devuelve: {string[]}

Devuelve una matriz que contiene los nombres únicos de los actuales encabezados salientes. Todos los nombres de las cabeceras están en minúsculas.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### response.getHeaders()<!-- YAML
added: v7.7.0
-->

* Devuelve: {Object}

Devuelve una copia superficial de las cabeceras salientes actuales. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. Todos los nombres de las cabeceras están en minúsculas.

The object returned by the `response.getHeaders()` method *does not* prototypically inherit from the JavaScript `Object`. This means that typical `Object` methods such as `obj.toString()`, `obj.hasOwnProperty()`, and others are not defined and *will not work*.

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
* Devuelve: {boolean}

Returns `true` if the header identified by `name` is currently set in the outgoing headers. Tenga en cuenta que el nombre de cabecera no distingue entre mayúsculas y minúsculas.

```js
const hasContentType = response.hasHeader('content-type');
```

### response.headersSent<!-- YAML
added: v0.9.3
-->

* {boolean}

Booleano (solo-lectura). Verdadero si las cabeceras fueron enviadas, de lo contrario falso.

### response.removeHeader(name)<!-- YAML
added: v0.4.0
-->

* `name` {string}

Elimina una cabecera que está puesta en cola para un envío implícito.

```js
response.removeHeader('Content-Encoding');
```

### response.sendDate<!-- YAML
added: v0.7.5
-->

* {boolean}

When true, the Date header will be automatically generated and sent in the response if it is not already present in the headers. Por defecto es verdadero.

This should only be disabled for testing; HTTP requires the Date header in responses.

### response.setHeader(name, value)

<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {any}

Establece un único valor de cabecera para cabeceras implícitas. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`response.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
response.setHeader('Content-Type', 'text/html');
```

o

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

If [`response.writeHead()`][] method is called and this method has not been called, it will directly write the supplied header values onto the network channel without caching internally, and the [`response.getHeader()`][] on the header will not yield the expected result. If progressive population of headers is desired with potential future retrieval and modification, use [`response.setHeader()`][] instead of [`response.writeHead()`][].

### response.setTimeout(msecs[, callback])<!-- YAML
added: v0.9.12
-->

* `msecs` {number}

* `callback` {Function}

* Devuelve: {http.ServerResponse}

Establece el valor del tiempo de espera del Socket a `msecs`. If a callback is provided, then it is added as a listener on the `'timeout'` event on the response object.

If no `'timeout'` listener is added to the request, the response, or the server, then sockets are destroyed when they time out. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

### response.socket<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Referencia al socket subyacente. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. The `socket` may also be accessed via `response.connection`.

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

```js
response.statusCode = 404;
```

After response header was sent to the client, this property indicates the status code which was sent out.

### response.statusMessage<!-- YAML
added: v0.11.8
-->

* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

```js
response.statusMessage = 'Not found';
```

After response header was sent to the client, this property indicates the status message which was sent out.

### response.write(chunk\[, encoding\]\[, callback\])<!-- YAML
added: v0.1.29
-->

* `chunk` {string|Buffer}

* `encoding` {string} **Predeterminado:** `'utf8'`

* `callback` {Function}
* Devuelve: {boolean}

If this method is called and [`response.writeHead()`][] has not been called, it will switch to implicit header mode and flush the implicit headers.

Esto envía un fragmento del cuerpo de respuesta. This method may be called multiple times to provide successive parts of the body.

Note that in the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses *must not* include a message body.

`chunk` puede ser una string o un búfer. If `chunk` is a string, the second parameter specifies how to encode it into a byte stream. `callback` será llamado cuando este fragmento de datos sea vaciado.

This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Devuelve como `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

### response.writeContinue()<!-- YAML
added: v0.3.0
-->Sends a HTTP/1.1 100 Continue message to the client, indicating that the request body should be sent. Vea el evento [

`'checkContinue'`][] en `Server`.

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

Envía una cabecera de respuesta a la solicitud. The status code is a 3-digit HTTP status code, like `404`. El último argumento, `headers`, son las cabeceras de respuesta. Optionally one can give a human-readable `statusMessage` as the second argument.

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

This method must only be called once on a message and it must be called before [`response.end()`][] is called.

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

If this method is called and [`response.setHeader()`][] has not been called, it will directly write the supplied header values onto the network channel without caching internally, and the [`response.getHeader()`][] on the header will not yield the expected result. If progressive population of headers is desired with potential future retrieval and modification, use [`response.setHeader()`][] instead.

```js
// returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Tenga en cuenta que la Longitud del Contenido es dada en bytes y no en caracteres. The above example works because the string `'hello world'` contains only single byte characters. If the body contains higher coded characters then `Buffer.byteLength()` should be used to determine the number of bytes in a given encoding. And Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

### response.writeProcessing()<!-- YAML
added: v10.0.0
-->Sends a HTTP/1.1 102 Processing message to the client, indicating that the request body should be sent.

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
-->Indicates that the underlying connection was closed. Al igual que 

`'end'`, este evento ocurre una sola vez por respuesta.

### message.aborted<!-- YAML
added: v10.1.0
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

Llama a `destroy()` en el socket que recibió el `IncomingMessage`. If `error` is provided, an `'error'` event is emitted and `error` is passed as an argument to any listeners on the event.

### message.headers<!-- YAML
added: v0.1.5
-->

* {Object}

El objeto de cabeceras de solicitud/respuesta.

Pares de valores-clave de nombres de encabezado y valores. Los nombres de los encabezados están en minúsculas.

```js
// Imprime algo similar a:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

Duplicates in raw headers are handled in the following ways, depending on the header name:

* Duplicates of `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, or `user-agent` are discarded.
* `set-cookie` siempre es una matriz. Los duplicados se añaden a la matriz.
* For duplicate `cookie` headers, the values are joined together with '; '.
* Para todos los otros encabezados, los valores se unen con ', '.

### message.httpVersion<!-- YAML
added: v0.1.1
-->

* {string}

En caso de la solicitud del servidor, la versión HTTP enviada por el cliente. In the case of client response, the HTTP version of the connected-to server. Probablemente `'1.1'` o `'1.0'`.

Also `message.httpVersionMajor` is the first integer and `message.httpVersionMinor` is the second.

### message.method<!-- YAML
added: v0.1.1
-->

* {string}

**Solo válido para las solicitudes obtenidas desde [`http.Server`][].**

El método de solicitud como una string. Solo lectura. Ejemplos: `'GET'`, `'DELETE'`.

### message.rawHeaders<!-- YAML
added: v0.11.6
-->

* {string[]}

La lista cruda de solicitudes/cabeceras de respuesta, exactamente como fueron recibidos.

Tenga en cuenta que las claves y los valores están en la misma lista. It is *not* a list of tuples. So, the even-numbered offsets are key values, and the odd-numbered offsets are the associated values.

Los nombres de los encabezados no están en minúsculas, y los duplicados no están fusionados.

```js
// Muestro algo similar a:
//
// [ 'user-agent',
// 'esto no es válido porque solo puede haber uno',
// 'User-Agent',
// 'curl/7. 2.0',
// 'Host',
// '127.0.0.1:8000',
// 'ACCEPT',
// '*/*' ]
console.log(request.rawHeaders);
```

### message.rawTrailers<!-- YAML
added: v0.11.6
-->

* {string[]}

The raw request/response trailer keys and values exactly as they were received. Poblado solamente en el evento `'end'` .

### message.setTimeout(msecs, callback)<!-- YAML
added: v0.5.9
-->

* `msecs` {number}

* `callback` {Function}

* Devuelve: {http.IncomingMessage}

Llama a `message.connection.setTimeout(msecs, callback)`.

### message.socket<!-- YAML
added: v0.3.0
-->

* {net.Socket}

El objeto de [`net.Socket`][] asociado a la conexión.

With HTTPS support, use [`request.socket.getPeerCertificate()`][] to obtain the client's authentication details.

### message.statusCode<!-- YAML
added: v0.1.1
-->

* {number}

**Solo válido para la respuesta obtenida de [`http.ClientRequest`][].**

El código de estado de respuesta de 3 dígitos de HTTP. Por ejemplo, `404`.

### message.statusMessage<!-- YAML
added: v0.11.10
-->

* {string}

**Solo válido para la respuesta obtenida de [`http.ClientRequest`][].**

El mensaje de estado de la respuesta HTTP (frase del motivo). E.G. `OK` or `Internal Server
Error`.

### message.trailers<!-- YAML
added: v0.3.0
-->

* {Object}

El objeto de trailers de solicitud/respuesta. Poblado solamente en el evento `'end'` .

### message.url<!-- YAML
added: v0.1.90
-->

* {string}

**Solo válido para las solicitudes obtenidas desde [`http.Server`][].**

String de solicitud de URL. This contains only the URL that is present in the actual HTTP request. Si la solicitud es:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

Entonces `request.url` será:

```js
'/status?name=ryan'
```

To parse the url into its parts `require('url').parse(request.url)` can be used:

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

To extract the parameters from the query string, the `require('querystring').parse` function can be used, or `true` can be passed as the second argument to `require('url').parse`:

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

* {string[]}

Una lista de métodos HTTP que son compatibles con el analizador.

## http.STATUS_CODES<!-- YAML
added: v0.1.22
-->

* {Object}

A collection of all the standard HTTP response status codes, and the short description of each. Por ejemplo, `http.STATUS_CODES[404] === 'Not
Found'`.

## http.createServer(\[options\]\[, requestListener\])<!-- YAML
added: v0.1.13
changes:

  - version: v9.6.0, v8.12.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: The `options` argument is supported now.
-->

* `options` {Object} 
  * `IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to be used. Útil para extender el `IncomingMessage` original. **Predeterminado:** `IncomingMessage`.
  * `ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to be used. Útil para extender el `ServerResponse` original. **Default:** `ServerResponse`.

* `requestListener` {Function}

* Devuelve: {http.Server}

Devuelve una nueva instancia de [`http.Server`][].

The `requestListener` is a function which is automatically added to the [`'request'`][] event.

## http.get(options[, callback])

## http.get(url\[, options\]\[, callback\])<!-- YAML
added: v0.3.6
changes:

  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `url` {string | URL}
* `options` {Object} Accepts the same `options` as [`http.request()`][], with the `method` always set to `GET`. Las propiedades que se heredan desde el prototipo son ignoradas.
* `callback` {Function}
* Devuelve: {http.ClientRequest}

Since most requests are GET requests without bodies, Node.js provides this convenience method. The only difference between this method and [`http.request()`][] is that it sets the method to GET and calls `req.end()` automatically. Note that the callback must take care to consume the response data for reasons stated in [`http.ClientRequest`][] section.

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
added: v10.15.0
-->

* {number}

Read-only property specifying the maximum allowed size of HTTP headers in bytes. Defaults to 8KB. Configurable using the [`--max-http-header-size`][] CLI option.

## http.request(options[, callback])

## http.request(url\[, options\]\[, callback\])

<!-- YAML
added: v0.3.6
changes:

  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `url` {string | URL}
* `opciones` {Object} 
  * `protocol` {string} Protocolo a utilizar. **Predeterminado:** `'http:'`.
  * `host` {string} A domain name or IP address of the server to issue the request to. **Predeterminado:** `'localhost'`.
  * `hostname` {string} Alias para `host`. To support [`url.parse()`][], `hostname` will be used if both `host` and `hostname` are specified.
  * `family` {number} IP address family to use when resolving `host` or `hostname`. Los valores válidos son `4` o `6`. When unspecified, both IP v4 and v6 will be used.
  * `port` {number} Puerto del servidor remoto. **Predeterminado:** `80`.
  * `localAddress` {string} Interfaz local para enlazar conexiones de red.
  * `socketPath` {string} Unix Domain Socket (cannot be used if one of `host` or `port` is specified, those specify a TCP Socket).
  * `method` {string} Una string que especifique el método de solicitud HTTP. **Default:** `'GET'`.
  * `path` {string} Ruta de solicitud. Debería incluir el string de la query si existe alguno. Por ejemplo, `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future. **Predeterminado:** `'/'`.
  * `headers` {Object} Un objeto que contiene las cabeceras de solicitud.
  * `auth` {string} Basic authentication i.e. `'user:password'` to compute an Authorization header.
  * `agente` {http.Agent | boolean} Controla el comportamiento de [`Agent`][]. Valores posibles: 
    * `undefined` (Predeterminado): utiliza [`http.globalAgent`][] para este host y este puerto.
    * objeto `Agent`: utiliza explícitamente lo que fue pasado en `Agent`.
    * `false`: hace que un nuevo `Agent` con valores predeterminados sea utilizado.
  * `createConnection` {Function} A function that produces a socket/stream to use for the request when the `agent` option is not used. This can be used to avoid creating a custom `Agent` class just to override the default `createConnection` function. See [`agent.createConnection()`][] for more details. Cualquier stream [`Duplex`][] es un valor válido.
  * `timeout` {number}: Un número que especifica el tiempo de espera del socket en milisegundos. Esto establecerá el tiempo de espera antes de que el socket se conecte.
  * `setHost` {boolean}: Specifies whether or not to automatically add the `Host` header. Por defecto es `true`.
* `callback` {Function}
* Devuelve: {http.ClientRequest}

Node.js mantiene varias conexiones por servidor para realizar solicitudes HTTP. Esta función permite emitir solicitudes de manera transparente.

`url` can be a string or a [`URL`][] object. If `url` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

If both `url` and `options` are specified, the objects are merged, with the `options` properties taking precedence.

The optional `callback` parameter will be added as a one-time listener for the [`'response'`][] event.

`http.request()` returns an instance of the [`http.ClientRequest`][] class. La instancia `ClientRequest` es un stream editable. If one needs to upload a file with a POST request, then write to the `ClientRequest` object.

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

// escribe los datos sobre el body de la solicitud
req.write(postData);
req.end();
 
Text
XPath: /pre[38]/code;
```

Tenga en cuenta que, en el ejemplo, `req.end()` fue llamado. With `http.request()` one must always call `req.end()` to signify the end of the request - even if there is no data being written to the request body.

If any error is encountered during the request (be that with DNS resolution, TCP level errors, or actual HTTP parse errors) an `'error'` event is emitted on the returned request object. As with all `'error'` events, if no listeners are registered the error will be thrown.

Hay algunas cabeceras especiales que deberían tenerse en cuenta.

* Sending a 'Connection: keep-alive' will notify Node.js that the connection to the server should be persisted until the next request.

* Enviar una cabecera 'Content-Length' inhabilitará la codificación fragmentada predeterminada.

* Enviar una cabecera 'Expect' enviará inmediatamente las cabeceras de solicitud. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `'continue'` event should be set. See RFC2616 Section 8.2.3 for more information.

* Sending an Authorization header will override using the `auth` option to compute basic authentication.

Ejemplo utilizando un [`URL`][] como `options`:

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
  * `'end'` en el objeto `res`
* `'close'`

En el caso de un error de conexión, se emitirán los siguientes eventos:

* `'socket'`
* `'error'`
* `'close'`

If `req.abort()` is called before the connection succeeds, the following events will be emitted in the following order:

* `'socket'`
* (`req.abort()` llamado aquí)
* `'abort'`
* `'error'` with an error with message `'Error: socket hang up'` and code `'ECONNRESET'`
* `'close'`

If `req.abort()` is called after the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'response'` 
  * `'data'` cualquier número de veces, en el objeto `res`
* (`req.abort()` llamado aquí)
* `'abort'`
* `'aborted'` en el objeto `res`
* `'close'`
* `'end'` en el objeto `res`
* `'close'` en el objeto `res`

Note that setting the `timeout` option or using the `setTimeout()` function will not abort the request or do anything besides add a `'timeout'` event.