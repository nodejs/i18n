# HTTP

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

Para utilizar el servidor HTTP y el cliente, uno debe utilizar `require('http')`.

Las interfaces HTTP en Node.js están diseñadas para soportar varias funciones del protocolo que, tradicionalmente, han sido difíciles de utilizar. En particular, mensajes grandes y posiblemente codificados en fragmentos. La interfaz nunca almacena respuestas o peticiones enteras — el usuario puede establecer entonces un flujo continuo de datos.

Los encabezados de los mensajes HTTP se representan mediante un objeto como el siguiente:
```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Las claves se escriben en minúscula. Los valores no son modificados.

Para poder soportar el espectro completo de las posibles aplicaciones HTTP, la API HTTP de Node.js es de muy bajo nivel. Solo se encarga de manejar flujos y analizar mensajes. Puede analizar y re ordenar un mensaje en encabezado y cuerpo, pero no puede hacer lo mismo con un objeto header o un objeto body.

Consulte [`message.headers`][] para más detalles sobre cómo se manejan los encabezados duplicados.

Los encabezados sin procesar están retenidos en la propiedad `rawHeaders`, que es un arreglo con la estructura `[key, value, key2, value2, ...]`. Por ejemplo, el objeto de encabezado del mensaje anterior puede tener una lista de `rawHeaders`, como aparece a continuación:
```js
[ 'content-length', '123',
  'content-type', 'text/plain',
  'connection', 'keep-alive',
  'host', 'mysite.com',
  'accept', '*/*' ]
```

## Class: `http.Agent`<!-- YAML
added: v0.3.4
-->Un `Agent` es responsable del manejo de la persistencia de la conexión y la reutilización de clientes HTTP. Mantiene una cola de solicitudes pendientes para un host definido y un puerto, reutilizando una única conexión de socket para cada una, hasta que la cola esté vacía, momento en el cual el socket será destruido o será colocado en un pool donde será mantenido para ser utilizado otra vez por las solicitudes al mismo host y puerto. Que una petición se destruya o sea agrupada con otras, depende de la [opción](#http_new_agent_options) `keepAlive`.

Las conexiones agrupadas tienen la opción TCP Keep-Alive habilitada, pero aún así los servidores pueden cerrar las conexiones en espera. En ese caso, las mismas serán removidas del grupo y se establecerá una nueva conexión cuando se realice una nueva solicitud de HTTP para ese host y ese puerto. Los servidores también pueden negar el permiso de múltiples solicitudes sobre la misma conexión, en ese caso, la conexión deberá ser restablecida para cada solicitud y no podrá ser agrupada. El `Agent` hará las peticiones a ese servidor, pero cada una será llevada a cabo en una nueva conexión.

Cuando una conexión es cerrada por el cliente o por el servidor, esta es removida del pool. Todos los sockets del grupo que ya no sean utilizados, serán desreferenciados para evitar que el proceso de Node.js se mantenga activo cuando no hay mas llamadas pendientes. (see [`socket.unref()`][]).

Se considera una buena práctica destruir la instancia del `Agent` cuando ya no esta siendo utilizada, ya que los sockets que persisten consumen recursos del SO. (Consulte la sección [`destroy()`][]).

Sockets are removed from an agent when the socket emits either a `'close'` event or an `'agentRemove'` event. When intending to keep one HTTP request open for a long time without keeping it in the agent, something like the following may be done:

```js
http.get(options, (res) => {
  // Hacer algo
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

Un agente también puede ser utilizado para una solicitud individual. Al proveer a `{agent: false}` como una opción a las funciones de `http.get()` o `http.request()`, se utilizará un `Agent` de uso único con opciones predeterminadas para la conexión del cliente.

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
-->* `options` {Object} Set of configurable options to set on the agent. Puede tener los siguientes campos:
  * `keepAlive` {boolean} Mantiene los sockets activos incluso cuando no hay solicitudes sobresalientes, para que estas puedan ser utilizadas por solicitudes futuras sin tener que restablecer una conexión TCP. Not to be confused with the `keep-alive` value of the `Connection` header. The `Connection: keep-alive` header is always sent when using an agent except when the `Connection` header is explicitly specified or when the `keepAlive` and `maxSockets` options are respectively set to `false` and `Infinity`, in which case `Connection: close` will be used. **Default:** `false`.
  * `keepAliveMsecs` {number} When using the `keepAlive` option, specifies the [initial delay](net.html#net_socket_setkeepalive_enable_initialdelay) for TCP Keep-Alive packets. Se ignora cuando la opción `keepAlive` es `false` o `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Número máximo de sockets permitidos por host. Each request will use a new socket until the maximum is reached. **Default:** `Infinity`.
  * `maxFreeSockets` {number} Número máximo de sockets a dejar disponibles en un estado libre. Solo es relevante si `keepAlive` se establece a `true`. **Default:** `256`.
  * `timeout` {number} Socket timeout in milliseconds. This will set the timeout when the socket is created.

`options` in [`socket.connect()`][] are also supported.

El [`http.globalAgent`][] predeterminado que es utilizado por [`http.request()`][] tiene todos estos valores establecidos en sus respectivos valores predeterminados.

Para configurar cualquiera de ellos, se deberá crear una instancia de [`http.Agent`][].

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### `agent.createConnection(options[, callback])`<!-- YAML
added: v0.11.4
-->* `options` {Object} Opciones que contienen los detalles de conexión. Consulte [`net.createConnection()`][] para ver el formato de las opciones
* `callback` {Function} Función de callback que recibe el socket creado
* Returns: {stream.Duplex}

Produce un socket/stream para ser utilizado para las solicitudes de HTTP.

Por defecto, esta función es la misma que [`net.createConnection()`][]. Sin embargo, los agentes personalizados pueden anular este método en caso de que se desee mayor flexibilidad.

Un socket/stream puede ser proporcionado de dos maneras: devolviendo el socket/stream desde esta función, o pasando el socket/stream al `callback`.

This method is guaranteed to return an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

`callback` tiene una firma de `(err, stream)`.

### `agent.keepSocketAlive(socket)`<!-- YAML
added: v8.1.0
-->* `socket` {stream.Duplex}

Called when `socket` is detached from a request and could be persisted by the `Agent`. El comportamiento predeterminado es:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Este método puede ser anulado por una subclase de `Agent` particular. Si este método devuelve un valor falso, el socket será destruido en lugar de persistir, para ser utilizado en la próxima solicitud.

The `socket` argument can be an instance of {net.Socket}, a subclass of
{stream.Duplex}.

### `agent.reuseSocket(socket, request)`<!-- YAML
added: v8.1.0
-->* `socket` {stream.Duplex}
* `request` {http.ClientRequest}

Invocado cuando `socket` se adosa a `request` luego de ser persistido por las opciones de keep-alive. El comportamiento predeterminado es:

```js
socket.ref();
```

Este método puede ser anulado por una subclase de `Agent` particular.

The `socket` argument can be an instance of {net.Socket}, a subclass of
{stream.Duplex}.

### `agent.destroy()`<!-- YAML
added: v0.11.4
-->Destruye cualquier socket que esté siendo utilizado por el agente.

Generalmente, no es necesario hacer esto. However, if using an agent with `keepAlive` enabled, then it is best to explicitly shut down the agent when it will no longer be used. De lo contrario, los sockets podrían mantenerse habilitados por un largo tiempo antes de que el servidor los elimine.

### `agent.freeSockets`<!-- YAML
added: v0.11.4
-->* {Object}

Un objeto que contiene matrices de sockets en espera para ser utilizadas por el agente cuando `keepAlive` sea habilitado. No modificar.

### `agent.getName(options)`
<!-- YAML
added: v0.11.4
-->

* `options` {Object} A set of options providing information for name generation
  * `host` {string} A domain name or IP address of the server to issue the request to
  * `port` {number} Puerto del servidor remoto
  * `localAddress` {string} Interfaz local para enlazar conexiones de red cuando se emite la solicitud
  * `family` {integer} Debe ser 4 o 6 si su valor no es igual a `undefined`.
* Devuelve: {string}

Obtiene un nombre único para un conjunto de opciones de solicitud, para determinar si una conexión puede ser reutilizada. For an HTTP agent, this returns `host:port:localAddress` or `host:port:localAddress:family`. For an HTTPS agent, the name includes the CA, cert, ciphers, and other HTTPS/TLS-specific options that determine socket reusability.

### `agent.maxFreeSockets`<!-- YAML
added: v0.11.7
-->* {number}

Por defecto, el valor es 256. Para agentes con `keepAlive` habilitado, esto establece el número máximo de sockets que quedarán abiertos en el estado libre.

### `agent.maxSockets`<!-- YAML
added: v0.3.6
-->* {number}

By default set to `Infinity`. Determina cuántos sockets concurrentes el agente puede tener abiertos por origen. Origen es el valor devuelto de [`agent.getName()`][].

### `agent.requests`<!-- YAML
added: v0.5.9
-->* {Object}

Un objeto que contiene colas de peticiones que aún no han sido asignadas a sockets. No modificar.

### `agent.sockets`
<!-- YAML
added: v0.3.6
-->

* {Object}

Un objeto que contiene matrices de sockets que están siendo utilizados actualmente por el agente. No modificar.

## Class: `http.ClientRequest`<!-- YAML
added: v0.1.17
-->* Extends: {Stream}

Este objeto es creado internamente y se devuelve desde [`http.request()`][]. It represents an _in-progress_ request whose header has already been queued. The header is still mutable using the [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][] API. The actual header will be sent along with the first data chunk or when calling [`request.end()`][].

Para obtener la respuesta, agregue un listener de [`'response'`][] al objeto de la solicitud. [`'response'`][] será emitido desde el objeto de solicitud cuando los encabezados de respuesta hayan sido recibidos. El evento [`'response'`][] se ejecuta con un argumento que es una instancia de [`http.IncomingMessage`][].

Durante el evento [`'response'`][], se pueden añadir listeners al objeto de respuesta; particularmente para escuchar el evento `'data'` .

Si no se añade ningún handler de [`'response'`][], entonces la respuesta será descartada en su totalidad. However, if a [`'response'`][] event handler is added, then the data from the response object **must** be consumed, either by calling `response.read()` whenever there is a `'readable'` event, or by adding a `'data'` handler, or by calling the `.resume()` method. Hasta que los datos no sean consumidos, el evento `'end'` no se activará. También, hasta que la data no sea leída, va a consumir memoria que eventualmente puede desembocar en un error 'process out of memory'.

Unlike the `request` object, if the response closes prematurely, the `response` object does not emit an `'error'` event but instead emits the `'aborted'` event.

Node.js does not check whether Content-Length and the length of the body which has been transmitted are equal or not.

### Event: `'abort'`<!-- YAML
added: v1.4.1
-->Se emite cuando la solicitud ha sido abortada por el cliente. Este evento solo se emite en la primera llamada a `abort()`.

### Event: `'connect'`<!-- YAML
added: v0.7.0
-->* `response` {http.IncomingMessage}
* `socket` {stream.Duplex}
* `head` {Buffer}

Emitido cada vez que un servidor responde a una solicitud con un método `CONNECT` . If this event is not being listened for, clients receiving a `CONNECT` method will have their connections closed.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Un par de un servidor y cliente que demuestra cómo escuchar el evento: `'connect'` :

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
-->Se emite cuando el servidor envía una respuesta '100 Continue' HTTP, normalmente porque la solicitud contenía 'Expect: 100-continue'. Esta es una instrucción en la cual el cliente debería enviar el cuerpo de la solicitud.

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

Se emite cuando se recibe una respuesta para esta solicitud. Este evento se emite solo una vez.

### Event: `'socket'`<!-- YAML
added: v0.5.3
-->* `socket` {stream.Duplex}

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### Event: `'timeout'`<!-- YAML
added: v0.7.8
-->Emitted when the underlying socket times out from inactivity. This only notifies that the socket has been idle. La solicitud debe ser abortada manualmente.

See also: [`request.setTimeout()`][].

### Event: `'upgrade'`<!-- YAML
added: v0.1.94
-->* `response` {http.IncomingMessage}
* `socket` {stream.Duplex}
* `head` {Buffer}

Emitido cada vez que un servidor responde a una solicitud con una actualización. If this event is not being listened for and the response status code is 101 Switching Protocols, clients receiving an upgrade header will have their connections closed.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Un par de un servidor y cliente que demuestra cómo escuchar el evento `'upgrade'` .

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
-->Marca a la solicitud como "abortando". Llamar a esto causará que los datos restantes en la respuesta se caigan y que el socket se destruya.

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
-->> Estabilidad: 0 - Desaprobado. Use [`request.socket`][].

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
* Devuelve: {this}

Termina de enviar la solicitud. Si no se envía alguna de las partes del cuerpo, se vaciarán hacia el stream. Si la solicitud es fragmentada, esto enviará la `'0\r\n\r\n'` de terminación.

Si se especifica `data`, es equivalente a llamar a [`request.write(data, encoding)`][] seguido de `request.end(callback)`.

Si se especifica `callback`, será llamado cuando el stream de solicitud haya finalizado.

### `request.finished`<!-- YAML
added: v0.0.1
deprecated: v13.4.0
-->> Estabilidad: 0 - Desaprobado. Use [`request.writableEnded`][].

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

Lee una cabecera en la solicitud. The name is case-insensitive. The type of the return value depends on the arguments provided to [`request.setHeader()`][].

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

Elimina a una cabecera que ya está definida dentro del objeto de cabeceras.

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

Establece a un único valor de cabecera para el objeto de cabeceras. If this header already exists in the to-be-sent headers, its value will be replaced. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`request.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
request.setHeader('Content-Type', 'application/json');
```

o

```js
request.setHeader('Cookie', ['type=ninja', 'language=javascript']);
```

### `request.setNoDelay([noDelay])`<!-- YAML
added: v0.5.9
-->* `noDelay` {boolean}

Una vez que se asigne un socket a esta solicitud y se conecte, [`socket.setNoDelay()`][] será llamado.

### `request.setSocketKeepAlive([enable][, initialDelay])`<!-- YAML
added: v0.5.9
-->* `enable` {boolean}
* `initialDelay` {number}

Una vez que se asigne un socket a esta solicitud y se conecte, [`socket.setKeepAlive()`][] será llamado.

### `request.setTimeout(timeout[, callback])`<!-- YAML
added: v0.5.9
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/8895
    description: Consistently set socket timeout only when the socket connects.
-->* `timeout` {number} Milisegundos antes que se agote el tiempo de la solicitud.
* `callback` {Function} Función opcional que será llamada cuando ocurra un timeout. Igual a enlazar al evento `'timeout'` .
* Devuelve: {http.ClientRequest}

Una vez que se asigne un socket a esta solicitud y se conecte, [`socket.setTimeout()`][] será llamado.

### `request.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

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
* Devuelve: {boolean}

Envía un fragmento del cuerpo. By calling this method many times, a request body can be sent to a server — in that case it is suggested to use the `['Transfer-Encoding', 'chunked']` header line when creating the request.

El argumento `encoding` es opcional y solo aplica cuando `chunk` es una string. Por defecto es `'utf8'`.

The `callback` argument is optional and will be called when this chunk of data is flushed, but only if the chunk is non-empty.

Devuelve como `true` si todos los datos fueron arrojados con éxito al búfer del núcleo. Devuelve como `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

When `write` function is called with empty string or buffer, it does nothing and waits for more input.

## Class: `http.Server`<!-- YAML
added: v0.1.17
-->* Extiende a: {net.Server}

### Event: `'checkContinue'`<!-- YAML
added: v0.3.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Se emite cada vez que se recibe una solicitud con un HTTP `Expect: 100-continue` . Si este evento no se escucha, el servidor automáticamente responderá con un `100 Continue` según corresponda.

Handling this event involves calling [`response.writeContinue()`][] if the client should continue to send the request body, or generating an appropriate HTTP response (e.g. 400 Bad Request) if the client should not continue to send the request body.

When this event is emitted and handled, the [`'request'`][] event will not be emitted.

### Event: `'checkExpectation'`<!-- YAML
added: v5.5.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Se emite cada vez que se recibe una solicitud con una cabecera HTTP `Expect`, en donde el valor no es `100-continue`. Si este evento no se escucha, el servidor automáticamente responderá con un `417 Expectation Failed` según corresponda.

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

Si una conexión del cliente emite un evento `'error'`, será reenviado aquí. El listener de este evento es responsable de cerrar/destruir al socket subyacente. For example, one may wish to more gracefully close the socket with a custom HTTP response instead of abruptly severing the connection.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

Default behavior is to try close the socket with a HTTP '400 Bad Request', or a HTTP '431 Request Header Fields Too Large' in the case of a [`HPE_HEADER_OVERFLOW`][] error. If the socket is not writable it is immediately destroyed.

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

When the `'clientError'` event occurs, there is no `request` or `response` object, so any HTTP response sent, including response headers and payload, *must* be written directly to the `socket` object. Se debe tener cuidado en asegurarse de que la respuesta sea un mensaje de respuesta HTTP con el formato correcto.

`err` es una instancia de `Error` con dos columnas adicionales:

* `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
* `rawPacket`: el paquete crudo de la respuesta actual.

### Event: `'close'`<!-- YAML
added: v0.1.4
-->Se emite cuando el servidor se cierra.

### Event: `'connect'`<!-- YAML
added: v0.7.0
-->* `request` {http.IncomingMessage} Argumentos para la solicitud HTTP, como se encuentra en el evento [`'request'`][]
* `socket` {stream.Duplex} Network socket between the server and client
* `head` {Buffer} El primer paquete del stream actualizado (puede estar vacío)

Se emite cada vez que un cliente solicita un método de HTTP `CONNECT` . Si este evento no se escucha, entonces a los clientes que soliciten un método `CONNECT` se les cerrarán sus conexiones.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

### Event: `'connection'`<!-- YAML
added: v0.1.0
-->* `socket` {stream.Duplex}

Este evento se emite cuando se establece un stream TCP nuevo. `socket` is typically an object of type [`net.Socket`][]. Usually users will not want to access this event. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. The `socket` can also be accessed at `request.connection`.

This event can also be explicitly emitted by users to inject connections into the HTTP server. En ese caso, cualquier stream [`Duplex`][] puede ser pasado.

If `socket.setTimeout()` is called here, the timeout will be replaced with `server.keepAliveTimeout` when the socket has served a request (if `server.keepAliveTimeout` is non-zero).

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### Event: `'request'`<!-- YAML
added: v0.1.0
-->* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Se emite cada vez que hay una solicitud. There may be multiple requests per connection (in the case of HTTP Keep-Alive connections).

### Event: `'upgrade'`<!-- YAML
added: v0.1.94
changes:
  - version: v10.0.0
    pr-url: v10.0.0
    description: Not listening to this event no longer causes the socket
                 to be destroyed if a client sends an Upgrade header.
-->* `request` {http.IncomingMessage} Argumentos para la solicitud HTTP, como se encuentra en el evento [`'request'`][]
* `socket` {stream.Duplex} Network socket between the server and client
* `head` {Buffer} El primer paquete del stream actualizado (puede estar vacío)

Se emite cada vez que un cliente solicita una actualización de HTTP. Listening to this event is optional and clients cannot insist on a protocol change.

After this event is emitted, the request's socket will not have a `'data'` event listener, meaning it will need to be bound in order to handle data sent to the server on that socket.

This event is guaranteed to be passed an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specifies a socket type other than {net.Socket}.

### `server.close([callback])`<!-- YAML
added: v0.1.90
-->* `callback` {Function}

No permite que el servidor acepte nuevas conexiones. Vea [`net.Server.close()`][].

### `server.headersTimeout`<!-- YAML
added: v11.3.0
-->* {number} **Default:** `60000`

Limit the amount of time the parser will wait to receive the complete HTTP headers.

In case of inactivity, the rules defined in [`server.timeout`][] apply. However, that inactivity based timeout would still allow the connection to be kept open if the headers are being sent very slowly (by default, up to a byte per 2 minutes). In order to prevent this, whenever header data arrives an additional check is made that more than `server.headersTimeout` milliseconds has not passed since the connection was established. If the check fails, a `'timeout'` event is emitted on the server object, and (by default) the socket is destroyed. See [`server.timeout`][] for more information on how timeout behavior can be customized.

### `server.listen()`

Inicia el servidor HTTP escuchando conexiones. Este método es idéntico a [`server.listen()`][] de [`net.Server`][].

### `server.listening`<!-- YAML
added: v5.7.0
-->* {boolean} Indica si el servidor está escuchando a las conexiones o no.

### `server.maxHeadersCount`<!-- YAML
added: v0.7.0
-->* {number} **Default:** `2000`

Limita al conteo máximo de cabeceras entrantes. If set to 0, no limit will be applied.

### `server.setTimeout([msecs][, callback])`<!-- YAML
added: v0.9.12
changes:
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27558
    description: The default timeout changed from 120s to 0 (no timeout).
-->* `msecs` {number} **Default:** 0 (no timeout)
* `callback` {Function}
* Devuelve: {http.Server}

Establece el valor del tiempo de espera para los sockets, y emite un evento `'timeout'` en el objeto del Servidor, pasando al socket como un argumento, en caso de ocurra un timeout.

Si hay un listener del evento `'timeout'` en el objeto del Servidor, entonces será llamado con el socket puesto en tiempo de espera como un argumento.

By default, the Server does not timeout sockets. However, if a callback is assigned to the Server's `'timeout'` event, timeouts must be handled explicitly.

### `server.timeout`<!-- YAML
added: v0.9.12
changes:
  - version: v13.0.0
    pr-url: https://github.com/nodejs/node/pull/27558
    description: The default timeout changed from 120s to 0 (no timeout).
-->* {number} Tiempo de espera en milisegundos. **Default:** 0 (no timeout)

El número de mili-segundos de inactividad antes de que se presuma que un socket se quedó sin tiempo.

Un valor de `0` inhabilitará el comportamiento del tiempo de espera en conexiones entrantes.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### `server.keepAliveTimeout`<!-- YAML
added: v8.0.0
-->* {number} Tiempo de espera en milisegundos. **Default:** `5000` (5 seconds).

The number of milliseconds of inactivity a server needs to wait for additional incoming data, after it has finished writing the last response, before a socket will be destroyed. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Class: `http.ServerResponse`<!-- YAML
added: v0.1.17
-->* Extends: {Stream}

Este objeto es creado internamente por un servidor de HTTP — no por el usuario. Es pasado como el segundo parámetro al evento [`'request'`][].

### Event: `'close'`<!-- YAML
added: v0.6.7
-->Indicates that the underlying connection was terminated.

### Event: `'finish'`<!-- YAML
added: v0.3.6
-->Se emite cuando la respuesta ha sido enviada. Más específicamente, este evento se emite cuando el último segmento de las cabeceras de respuesta y el cuerpo han sido entregados al sistema operativo para la transmisión sobre la red. Eso no implica que el cliente haya recibido algo aún.

### `response.addTrailers(headers)`<!-- YAML
added: v0.3.0
-->* `headers` {Object}

Este método agrega encabezados finales HTTP (un encabezado pero al final del mensaje) a la respuesta.

Trailers will **only** be emitted if chunked encoding is used for the response; if it is not (e.g. if the request was HTTP/1.0), they will be silently discarded.

HTTP requires the `Trailer` header to be sent in order to emit trailers, with a list of the header fields in its value. Por ejemplo,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

### `response.connection`<!-- YAML
added: v0.3.0
deprecated: v13.0.0
-->> Estabilidad: 0 - Desaprobado. Use [`response.socket`][].

* {stream.Duplex}

Vea [`response.socket`][].

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
* Devuelve: {this}

Este método señala al servidor que todas las cabeceras de respuesta y el cuerpo han sido enviados; y que el servidor debería considerar este mensaje como completo. Este método, `response.end()`, DEBE ser llamado en cada respuesta.

If `data` is specified, it is similar in effect to calling [`response.write(data, encoding)`][] followed by `response.end(callback)`.

Si se especifica el `callback`, será llamado cuando el stream de respuesta haya finalizado.

### `response.finished`<!-- YAML
added: v0.0.2
deprecated: v13.4.0
-->> Estabilidad: 0 - Desaprobado. Use [`response.writableEnded`][].

* {boolean}

The `response.finished` property will be `true` if [`response.end()`][] has been called.

### `response.flushHeaders()`<!-- YAML
added: v1.6.0
-->Flushes the response headers. See also: [`request.flushHeaders()`][].

### `response.getHeader(name)`<!-- YAML
added: v0.4.0
-->* `name` {string}
* Returns: {any}

Lee una cabecera que ya sido puesta en cola, pero que no ha sido enviada al cliente. The name is case-insensitive. The type of the return value depends on the arguments provided to [`response.setHeader()`][].

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

### `response.getHeaderNames()`<!-- YAML
added: v7.7.0
-->* Devuelve: {string[]}

Devuelve una matriz que contiene los nombres únicos de los actuales encabezados salientes. Todos los nombres de las cabeceras están en minúsculas.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### `response.getHeaders()`<!-- YAML
added: v7.7.0
-->* Devuelve: {Object}

Devuelve una copia superficial de las cabeceras salientes actuales. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. The keys of the returned object are the header names and the values are the respective header values. All header names are lowercase.

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
* Devuelve: {boolean}

Returns `true` if the header identified by `name` is currently set in the outgoing headers. The header name matching is case-insensitive.

```js
const hasContentType = response.hasHeader('content-type');
```

### `response.headersSent`<!-- YAML
added: v0.9.3
-->* {boolean}

Booleano (solo-lectura). Verdadero si las cabeceras fueron enviadas, de lo contrario falso.

### `response.removeHeader(name)`<!-- YAML
added: v0.4.0
-->* `name` {string}

Elimina una cabecera que está puesta en cola para un envío implícito.

```js
response.removeHeader('Content-Encoding');
```

### `response.sendDate`<!-- YAML
added: v0.7.5
-->* {boolean}

Al ser verdadero, la cabecera de Fecha será generada automáticamente y enviada en la respuesta si no está presente en las cabeceras. Por defecto es verdadero.

Esto solo debería inhabilitarse para las pruebas; HTTP requiere el encabezado de Fecha en las respuestas.

### `response.setHeader(name, value)`
<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {any}

Establece un único valor de cabecera para cabeceras implícitas. Si este encabezado ya existe en los envíos de encabezados pendientes, su valor será reemplazado. Use an array of strings here to send multiple headers with the same name. Non-string values will be stored without modification. Therefore, [`response.getHeader()`][] may return non-string values. However, the non-string values will be converted to strings for network transmission.

```js
response.setHeader('Content-Type', 'text/html');
```

o

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

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
* Devuelve: {http.ServerResponse}

Establece el valor del tiempo de espera del Socket a `msecs`. Si se proporciona un callback, entonces se agregará como un listener en el evento `'timeout'` en el objeto de respuesta.

Si no se añade ningún listener de `'timeout'` a la solicitud, la respuesta, o al servidor, entonces los sockets se destruirán cuando se agote su tiempo de espera. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

### `response.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

Referencia al socket subyacente. Usually users will not want to access this property. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. The `socket` may also be accessed via `response.connection`.

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

Cuando se utilizan cabeceras implícitas (sin llamar a [`response.writeHead()`][] explícitamente), esta propiedad controla el código de estado que será enviado al cliente cuando las cabeceras sean vaciadas.

```js
response.statusCode = 404;
```

Después de que la cabecera de respuesta fue enviada al cliente, esta propiedad indica el código de estado que fue enviado.

### `response.statusMessage`<!-- YAML
added: v0.11.8
-->* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. If this is left as `undefined` then the standard message for the status code will be used.

```js
response.statusMessage = 'Not found';
```

Después de que la cabecera de respuesta fue enviada al cliente, esta propiedad indica el mensaje de estado que fue enviado.

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
* Devuelve: {boolean}

Si este método es llamado y [`response.writeHead()`][] no se ha llamado, entonces cambiará a modo de cabecera implícita y vaciará las cabeceras implícitas.

Esto envía un fragmento del cuerpo de respuesta. Este método puede ser llamado varias veces para proporcionar partes sucesivas del cuerpo.

In the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses _must not_ include a message body.

`chunk` puede ser una string o un búfer. Si `chunk` es una string, el segundo parámetro especificará cómo codificarlo dentro de un stream de bytes. `callback` será llamado cuando este fragmento de datos sea vaciado.

This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Devuelve como `true` si todos los datos fueron arrojados con éxito al búfer del núcleo. Devuelve como `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

### `response.writeContinue()`<!-- YAML
added: v0.3.0
-->Envía un mensaje de HTTP/1.1 100 Continue al cliente, indicando que el cuerpo debería ser enviado. See the [`'checkContinue'`][] event on `Server`.

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
* Devuelve: {http.ServerResponse}

Envía una cabecera de respuesta a la solicitud. El código de estado es un código de estado HTTP de 3 dígitos, como `404`. El último argumento, `headers`, son las cabeceras de respuesta. Opcionalmente, uno puede dar un `statusMessage` legible para humanos como el segundo argumento.

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

Este método debe ser llamado solo una vez en un mensaje, y debe ser llamado antes de que [`response.end()`][] sea llamado.

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

`Content-Length` is given in bytes not characters. El ejemplo anterior funciona porque la string `'hello world'` solo contiene caracteres de un solo byte. Si el cuerpo contiene caracteres altamente codificados, entonces `Buffer.byteLength()` debería ser utilizado para determinar el número de bytes en una codificación dada. And Node.js does not check whether `Content-Length` and the length of the body which has been transmitted are equal or not.

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

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

Un objeto `IncomingMessage` es creado por [`http.Server`][] o [`http.ClientRequest`][] y pasado como el primer argumento al evento [`'request'`][] y [`'response'`][], respectivamente. It may be used to access response status, headers and data.

### Event: `'aborted'`<!-- YAML
added: v0.3.8
-->Emitted when the request has been aborted.

### Event: `'close'`<!-- YAML
added: v0.4.2
-->Indica que la conexión subyacente fue cerrada.

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

Llama a `destroy()` en el socket que recibió el `IncomingMessage`. If `error` is provided, an `'error'` event is emitted on the socket and `error` is passed as an argument to any listeners on the event.

### `message.headers`<!-- YAML
added: v0.1.5
-->* {Object}

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

Los duplicados en las cabeceras crudas son manejados de las siguientes maneras, dependiendo del nombre de cabecera:

* Duplicates of `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, `server`, or `user-agent` are discarded.
* `set-cookie` siempre es una matriz. Los duplicados se añaden a la matriz.
* For duplicate `cookie` headers, the values are joined together with '; '.
* Para todos los otros encabezados, los valores se unen con ', '.

### `message.httpVersion`<!-- YAML
added: v0.1.1
-->* {string}

En caso de la solicitud del servidor, la versión HTTP enviada por el cliente. En caso de una respuesta de cliente, la versión HTTP del servidor conectado. Probablemente `'1.1'` o `'1.0'`.

Además, `message.httpVersionMajor` es el primer entero y `message.httpVersionMinor` es el segundo.

### `message.method`<!-- YAML
added: v0.1.1
-->* {string}

**Solo válido para las solicitudes obtenidas desde [`http.Server`][].**

El método de solicitud como una string. Solo lectura. Ejemplos: `'GET'`, `'DELETE'`.

### `message.rawHeaders`<!-- YAML
added: v0.11.6
-->* {string[]}

La lista cruda de solicitudes/cabeceras de respuesta, exactamente como fueron recibidos.

The keys and values are in the same list. It is *not* a list of tuples. Entonces, los elementos pares de la lista serían las valores clave, mientras que los elementos impares serían los valores asociados.

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

### `message.rawTrailers`<!-- YAML
added: v0.11.6
-->* {string[]}

Las claves del trailer y los valores crudos de solicitud/respuesta, exactamente como fueron recibidos. Poblado solamente en el evento `'end'` .

### `message.setTimeout(msecs[, callback])`<!-- YAML
added: v0.5.9
-->* `msecs` {number}
* `callback` {Function}
* Devuelve: {http.IncomingMessage}

Llama a `message.connection.setTimeout(msecs, callback)`.

### `message.socket`<!-- YAML
added: v0.3.0
-->* {stream.Duplex}

El objeto de [`net.Socket`][] asociado a la conexión.

Con el soporte HTTPS, utilice [`request.socket.getPeerCertificate()`][] para obtener los detalles de autenticación del cliente.

This property is guaranteed to be an instance of the {net.Socket} class, a subclass of {stream.Duplex}, unless the user specified a socket type other than {net.Socket}.

### `message.statusCode`<!-- YAML
added: v0.1.1
-->* {number}

**Solo válido para la respuesta obtenida de [`http.ClientRequest`][].**

El código de estado de respuesta de 3 dígitos de HTTP. Por ejemplo, `404`.

### `message.statusMessage`<!-- YAML
added: v0.11.10
-->* {string}

**Solo válido para la respuesta obtenida de [`http.ClientRequest`][].**

El mensaje de estado de la respuesta HTTP (frase del motivo). E.G. `OK` or `Internal Server
Error`.

### `message.trailers`<!-- YAML
added: v0.3.0
-->* {Object}

El objeto de trailers de solicitud/respuesta. Poblado solamente en el evento `'end'` .

### `message.url`<!-- YAML
added: v0.1.90
-->* {string}

**Solo válido para las solicitudes obtenidas desde [`http.Server`][].**

String de solicitud de URL. Esto solo contiene la URL que está presente en la solicitud de HTTP actual. Si la solicitud es:

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

Una lista de métodos HTTP que son compatibles con el analizador.

## `http.STATUS_CODES`<!-- YAML
added: v0.1.22
-->* {Object}

Una colección de todos los códigos de estado de respuesta estándar, y la descripción corta de cada uno. Por ejemplo, `http.STATUS_CODES[404] === 'Not
Found'`.

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
  * `IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to be used. Útil para extender el `IncomingMessage` original. **Default:** `IncomingMessage`.
  * `ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to be used. Útil para extender el `ServerResponse` original. **Default:** `ServerResponse`.
  * `insecureHTTPParser` {boolean} Use an insecure HTTP parser that accepts invalid HTTP headers when `true`. Using the insecure parser should be avoided. See [`--insecure-http-parser`][] for more information. **Default:** `false`
  * `maxHeaderSize` {number} Optionally overrides the value of [`--max-http-header-size`][] for requests received by this server, i.e. the maximum length of request headers in bytes. **Default:** 8192 (8KB).
* `requestListener` {Function}

* Devuelve: {http.Server}

Devuelve una nueva instancia de [`http.Server`][].

El `requestListener` es una función que se añade automáticamente al evento de [`'request'`][] .

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
* `options` {Object} Accepts the same `options` as [`http.request()`][], with the `method` always set to `GET`. Las propiedades que se heredan desde el prototipo son ignoradas.
* `callback` {Function}
* Devuelve: {http.ClientRequest}

Ya que la mayoría de las solicitudes son solicitudes de GET sin cuerpos, Node.js proporciona este método de conveniencia. La única diferencia entre este método y [`http.request()`][] es que establece el método a GET y llama a `req.end()` automáticamente. The callback must take care to consume the response data for reasons stated in [`http.ClientRequest`][] section.

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

Instancia global de `Agent` que es utilizada de modo predeterminado para todas las solicitudes del cliente de HTTP.

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
    * `undefined` (predeterminado): utiliza [`http.globalAgent`][] para este host y este puerto.
    * objeto `Agent`: utiliza explícitamente lo que fue pasado en `Agent`.
    * `false`: hace que un nuevo `Agent` con valores predeterminados sea utilizado.
  * `auth` {string} Autenticación básica, por ejemplo, `'user:password'` para computar una cabecera de Autorización.
  * `createConnection` {Function} Una función que produce un socket/stream para ser utilizado para la solicitud cuando no se utilice la opción `agent`. Esto puede ser utilizado para evitar crear una clase `Agent` personalizada solo para anular la función `createConnection` predeterminada. Vea [`agent.createConnection()`][] para más detalles. Cualquier stream [`Duplex`][] es un valor válido.
  * `defaultPort` {number} Default port for the protocol. **Default:** `agent.defaultPort` if an `Agent` is used, else `undefined`.
  * `family` {number} IP address family to use when resolving `host` or `hostname`. Los valores válidos son `4` o `6`. Cuando no esté especificado, se utilizarán IP v4 y v6.
  * `headers` {Object} Un objeto que contiene las cabeceras de solicitud.
  * `host` {string} Un nombre de dominio o dirección IP del servidor al cual se le emitirá la solicitud. **Default:** `'localhost'`.
  * `hostname` {string} Alias para `host`. To support [`url.parse()`][], `hostname` will be used if both `host` and `hostname` are specified.
  * `insecureHTTPParser` {boolean} Use an insecure HTTP parser that accepts invalid HTTP headers when `true`. Using the insecure parser should be avoided. See [`--insecure-http-parser`][] for more information. **Default:** `false`
  * `localAddress` {string} Interfaz local para enlazar conexiones de red.
  * `lookup` {Function} Función de búsqueda personalizada. **Default:** [`dns.lookup()`][].
  * `maxHeaderSize` {number} Optionally overrides the value of [`--max-http-header-size`][] for requests received from the server, i.e. the maximum length of response headers in bytes. **Default:** 8192 (8KB).
  * `method` {string} Una string que especifica el método de solicitud HTTP. **Default:** `'GET'`.
  * `path` {string} Ruta de solicitud. Debería incluir el string de la query si existe alguno. Por ejemplo, `'/index.html?page=12'`. An exception is thrown when the request path contains illegal characters. Currently, only spaces are rejected but that may change in the future. **Default:** `'/'`.
  * `port` {number} Puerto del servidor remoto. **Default:** `defaultPort` if set, else `80`.
  * `protocol` {string} Protocolo a utilizar. **Default:** `'http:'`.
  * `setHost` {boolean}: Specifies whether or not to automatically add the `Host` header. Por defecto es `true`.
  * `socketPath` {string} Unix Domain Socket (cannot be used if one of `host` or `port` is specified, those specify a TCP Socket).
  * `timeout` {number}: Un número que especifica el tiempo de espera del socket en milisegundos. Esto establecerá el tiempo de espera antes de que el socket se conecte.
* `callback` {Function}
* Devuelve: {http.ClientRequest}

Node.js mantiene varias conexiones por servidor para realizar solicitudes HTTP. Esta función permite emitir solicitudes de manera transparente.

`url` can be a string or a [`URL`][] object. If `url` is a string, it is automatically parsed with [`new URL()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

If both `url` and `options` are specified, the objects are merged, with the `options` properties taking precedence.

El parámetro opcional `callback` será agregado como un listener de un solo uso para el evento [`'response'`][] .

`http.request()` devuelve una instancia de la clase [`http.ClientRequest`][] . La instancia `ClientRequest` es un stream editable. Si necesita subir un archivo con una solicitud POST, entonces escriba al objeto `ClientRequest` .

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

Si se encuentra algún error durante la solicitud (sea con una resolución DNS, errores a nivel de TCP, o errores de análisis en HTTP) se emitirá un evento `'error'` en el objeto de solicitud devuelto. Como con todos los eventos `'error'`, si no hay listeners registrados se arrojará el error.

Hay algunas cabeceras especiales que deberían tenerse en cuenta.

* Enviar un 'Connection: keep-alive' notificará a Node.js que la conexión al servidor debería persistir hasta la siguiente solicitud.

* Enviar una cabecera 'Content-Length' inhabilitará la codificación fragmentada predeterminada.

* Enviar una cabecera 'Expect' enviará inmediatamente las cabeceras de solicitud. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `'continue'` event should be set. See RFC 2616 Section 8.2.3 for more information.

* Enviar una cabecera de Autorización anulará utilizando la opción `auth` para computar la autenticación básica.

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

In the case of a premature connection close before the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'error'` with an error with message `'Error: socket hang up'` and code `'ECONNRESET'`
* `'close'`

In the case of a premature connection close after the response is received, the following events will be emitted in the following order:

* `'socket'`
* `'response'`
  * `'data'` cualquier número de veces, en el objeto `res`
* (connection closed here)
* `'aborted'` en el objeto `res`
* `'close'`
* `'close'` en el objeto `res`

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
* `'close'` en el objeto `res`

Setting the `timeout` option or using the `setTimeout()` function will not abort the request or do anything besides add a `'timeout'` event.
