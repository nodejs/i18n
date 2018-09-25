# HTTP

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

Para utilizar el servidor HTTP y el cliente, uno debe requerirlo de la siguiente manera `require('http')`.

Las interfaces HTTP en Node.js están diseñadas para soportar varias características del protocolo que, tradicionalmente, han sido difíciles de utilizar. En particular, mensajes grandes y potencialmente codificados en fragmentos. La interfaz nunca almacena respuestas o peticiones enteras — el usuario puede establecer entonces un flujo continuo de datos.

Los encabezados de los mensajes HTTP se representan mediante un objeto como el siguiente:

<!-- eslint-skip -->

```js
{ 'content-length': '123',
  'content-type': 'text/plain',
  'connection': 'keep-alive',
  'host': 'mysite.com',
  'accept': '*/*' }
```

Las llaves o identificadores se escriben en minúscula. Los valores no son modificados.

Para poder soportar el espectro completo de las aplicaciones HTTP, la API HTTP de Node.js es de muy bajo nivel. Se encarga solo de manejar flujos y analizar mensajes. Puede analizar y re ordenar un mensaje en encabezado y cuerpo, pero no puede hacer lo mismo con un objeto header o un objeto body.

Consulte la sección [`message.headers`][] para conocer detalles de como los encabezados duplicados son manejados.

Los encabezados sin procesar están retenidos en la propiedad `rawHeaders`, que es un arreglo con la estructura `[key, value, key2, value2, ...]`. Por ejemplo, el objecto encabezado anterior puede tener un arreglo para la propiedad `rawHeaders` como el siguiente:

<!-- eslint-disable semi -->

```js
[ 'content-length', '123',
  'content-type', 'text/plain',
  'connection', 'keep-alive',
  'host', 'mysite.com',
  'accept', '*/*' ]
```

## Clase: http.Agent

<!-- YAML
added: v0.3.4
-->

Un `Agent` es responsable del manejo de la persistencia y reutilización de las conexiones en los clientes HTTP. Mantiene una cola de peticiones pendientes para un host definido y un puerto, reutilizando un único socket para cada una hasta que la cola se encuentra vacía. Que una petición se destruya o sea agrupada con otras, depende de la [opción](#http_new_agent_options) `keepAlive`.

Las conexiones agrupadas tienen la opcion TCP Keep-Alive habilitada, pero incluso así los servidores pueden cerrar las conexiones en espera. De ocurrir, las mismas serán removidas del grupo y una nueva conexión sera establecida cuando una nueva petición HTTP sea realizada para ese host y ese puerto específico. Los servidores también pueden denegar el permiso de permitir múltiples peticiones en una misma conexión, por lo que en este caso la conexión tendrá que ser re establecida para cada petición y no podrá ser agrupada. El `Agent` hará las peticiones a ese servidor, pero cada una será llevada a cabo en una nueva conexión.

Cuando una conexión es cerrada por el cliente o por el servidor, la misma es removida del grupo. Todos los sockets del grupo que ya no sean utilizados, serán desreferenciados para evitar que el proceso de Node.js se mantenga activo cuando no hay mas llamadas pendientes. (Consultar la sección [`socket.unref()`]).

Se considera una buena práctica destruir la instancia del `Agent` cuando ya no esta siendo utilizada, ya que los sockets que persisten consumen recursos del SO. (Consulte la sección [`destroy()`][]).

Los sockets son removidos de un agente cuando emiten un evento `'close'` o un evento `'agentRemove'`. Si la intención es mantener una petición HTTP activa por un periodo de tiempo indefinido, sin mantenerla dentro del agent se puede hacer algo como lo siguiente:

```js
http.get(options, (res) => {
  // Hacer algo
}).on('socket', (socket) => {
  socket.emit('agentRemove');
});
```

Un agent también puede ser utilizado para una petición individual. Al proveer `{agent: false}` como una opción a las funciones `http.get()` o `http.request()`, un `Agent` de uso único, con la configuración por defecto, sera utilizado para la conexión del cliente.

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

### new Agent([options])

<!-- YAML
added: v0.3.4
-->

* `options` {Object} Conjunto de opciones configurables aplicables al agente. Puede contener los siguientes campos: 
  * `keepAlive` {boolean} Mantiene los sockets activos incluso cuando no hay peticiones pendientes, para que puedan ser utilizados por futuras peticiones sin tener que re-establecer una conexión TCP. **Default:**`false`.
  * `keepAliveMsecs` {number} Cuando se utiliza la opción `keepAlive`, especifica el [ delay inicial](net.html#net_socket_setkeepalive_enable_initialdelay) para los paquetes TCP Keep-Alive. Se ignora cuando la opción `keepAlive` es `false` o `undefined`. **Default:** `1000`.
  * `maxSockets` {number} Número máximo de sockets permitidos por host. **Default:** `Infinito`.
  * `maxFreeSockets` {number} Número máximo de sockets a dejar disponibles en un estado libre. Solo aplica si `keepAlive` tiene valor `true`. **Default:** `256`.

El [`http.globalAgent`][] que es utilizado por [`http.request()`][] tiene todos estos valores configurados como sus valores por defecto.

Para configurar cualquiera de ellos, se deberá crear una instancia de [`http.Agent`][].

```js
const http = require('http');
const keepAliveAgent = new http.Agent({ keepAlive: true });
options.agent = keepAliveAgent;
http.request(options, onResponseCallback);
```

### agent.createConnection(options[, callback])

<!-- YAML
added: v0.11.4
-->

* `options` {Object} Opciones que contienen los detalles de conexión. Consultar [`net.createConnection()`][] para ver el formato de las opciones
* `callback` {Function} Función callback que recibe el socket creado
* Retorna: {net.Socket}

Produce un socket/stream para ser utilizado por las peticiones HTTP.

Por defecto, esta función es la misma que [`net.createConnection()`][]. Es posible anular este método con un agente personalizado en caso de que se desee mayor flexibilidad.

Un socket/stream puede ser proporcionado de dos maneras: retornando el socket/stream desde esta función, o pasando el socket/stream como argumento a la función `callback`.

`callback` contempla el ingreso de `(err, stream)` como parámetros.

### agent.keepSocketAlive(socket)

<!-- YAML
added: v8.1.0
-->

* `socket` {net.Socket}

Se invoca cuando `socket` se desreferencia de una petición y puede ser persistido por el `Agent`. El comportamiento por defecto es:

```js
socket.setKeepAlive(true, this.keepAliveMsecs);
socket.unref();
return true;
```

Este método puede ser anulado por una subclase `Agent` particular. Si este método retorna un valor falsy, el socket sera destruido en vez de persistir para ser utilizado en la próxima petición.

### agent.reuseSocket(socket, request)

<!-- YAML
added: v8.1.0
-->

* `socket` {net.Socket}
* `request` {http.ClientRequest}

Invocado cuando `socket` se adosa a `request` luego de ser persistido por las opciones de keep-alive. El comportamiento por defecto es:

```js
socket.ref();
```

Este método puede ser anulado por una subclase particular `Agent`.

### agent.destroy()

<!-- YAML
added: v0.11.4
-->

Destruye cualquier socket que este siendo utilizado por el agent.

Generalmente, no es necesario hacer esto. De cualquier manera, si se esta utilizando un agent con `keepAlive` habilitado, entonces es mejor cerrar el agente explícitamente cuando ya no va a ser utilizado. De otra forma, los sockets pueden mantenerse habilitados por tiempo indeterminado hasta que el server los termine.

### agent.freeSockets

<!-- YAML
added: v0.11.4
-->

* {Object}

Un objeto que contiene un arreglo de sockets disponibles para ser utilizados por el agente cuando `keepAlive` se encuentra habilitado. No modificar.

### agent.getName(options)

<!-- YAML
added: v0.11.4
-->

* `options` {Object} Conjunto de opciones que contiene la información para la generación de nombres 
  * `host` {string} Un nombre de dominio o dirección IP del servidor al cual se le emitirá la petición
  * `port` {number} Puerto del servidor remoto
  * `localAddress` {string} Interfaz local a la cual se realiza en enlace cuando se emite la petición
  * `family` {integer} Debe ser 4 o 6 si su valor no es igual a `undefined`.
* Retorna: {string}

Obtiene un nombre único para un conjunto de opciones de petición, para determinar si una conexión puede ser reutilizada. Para un agente HTTP, retorna `host:port:localAddress` o `host:port:localAddress:family`. Para un agente HTTPS, el nombre incluye la Autoridad de Certificación, certificado, cifras, y otras opciones específicas a HTTPS/TLS que determinan la reusabilidad de un socket.

### agent.maxFreeSockets

<!-- YAML
added: v0.11.7
-->

* {number}

Por defecto, el valor es 256. Para agentes con `keepAlive` habilitado, define el valor máximo de sockets que quedaran abiertos en el estado libre.

### agent.maxSockets

<!-- YAML
added: v0.3.6
-->

* {number}

Por defecto, el valor es `Infinito`. Determina cuantos sockets concurrentes el agente puede tener abierto por origen. Origen es el valor de retorno de [`agent.getName()`][].

### agent.requests

<!-- YAML
added: v0.5.9
-->

* {Object}

Un objeto que contiene colas de peticiones que aún no han sido asignadas a sockets. No modificar.

### agent.sockets

<!-- YAML
added: v0.3.6
-->

* {Object}

Un objeto que contiene arreglos de sockets siendo utilizados por el agente. No modificar.

## Clase: http.ClientRequest

<!-- YAML
added: v0.1.17
-->

Este objecto es creado internamente y es el valor de retorno de [`http.request()`][]. Representa una petición *en progreso* cuyo encabezado ya se encuentra en cola. El encabezado aún es mutable utilizando las APIs de [`setHeader(name, value)`][], [`getHeader(name)`][], [`removeHeader(name)`][]. El encabezado será enviado junto con el primer fragmento de datos o cuando se invoque [`request.end()`][].

Para obtener la respuesta, se debe agregar un listener [`'response'`][] al objeto de la petición. [`'response'`][] será emitido del objecto de petición cuando los encabezados de respuesta hayan sido recibidos. El evento [`'response'`][] se ejecuta con un argumento que es una instancia de [`http.IncomingMessage`][].

Durante el evento [`'response'`][], se pueden agregar listeners al objeto de respuesta; particularmente para esperar que ocurra el evento `'data'`.

Si no se incluye código para manejar la [`'response'`][], entonces la respuesta sera descartada en su totalidad. Sin embargo, en caso de incluir código para manejar [`'response'`][], entonces los datos del objeto de respuesta **deben** ser consumidos ya sea llamando `response.read()` cuando ocurra un evento `'readable'`, o agregando una forma de manipular `'data'`, o llamando al método `.resume()`. Hasta que la data no sea consumida, el evento `'end'` no se va a disparar. También, hasta que la data no sea leída, va a consumir memoria que eventualmente puede desembocar en un error 'process out of memory'.

Node.js no comprueba si el Content-Length y la longitud del objeto body transmitido son iguales o no.

La petición implementa la interfaz [Writable Stream](stream.html#stream_class_stream_writable). Esto es un [`EventEmitter`][] con los siguientes eventos:

### Evento: 'abort'

<!-- YAML
added: v1.4.1
-->

Emitido cuando la petición ha sido cancelada por el cliente. Este evento solo es emitido en la primer llamada a `abort()`.

### Evento: 'connect'

<!-- YAML
added: v0.7.0
-->

* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Emitido cada vez que el servidor responde a una petición con el método `CONNECT`. Si este evento no está siendo atendido, los clientes recibiendo un método `CONNECT` cerrarán sus conexiones.

Un cliente y un servidor demostrando cómo atender el evento `'connect'`:

```js
const http = require('http');
const net = require('net');
const url = require('url');

// Crea un proxy túnel HTTP
const proxy = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
proxy.on('connect', (req, cltSocket, head) => {
  // conectar a un servidor de origen
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

// ahora el proxy está corriendo
proxy.listen(1337, '127.0.0.1', () => {

  // hacer una petición al túnel proxy
  const options = {
    port: 1337,
    hostname: '127.0.0.1',
    method: 'CONNECT',
    path: 'www.google.com:80'
  };

  const req = http.request(options);
  req.end();

  req.on('connect', (res, socket, head) => {
    console.log('conectado!');

    // hacer una petición a través de un túnel HTTP
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

### Evento: 'continue'

<!-- YAML
added: v0.3.2
-->

Emitido cuando el servidor envía una respuesta HTTP '100 Continue', normalmente porque la petición contenía 'Expect: 100-continue'. Esta es una instrucción en que el cliente debería enviar el objeto body de la petición.

### Evento: 'information'

<!-- YAML
added: v10.0.0
-->

Emitido cuando el servidor envía una respuesta 1xx (excluyendo 101 Upgrade). Este evento es emitido con un callback conteniendo un objeto con un código de estado HTTP.

```js
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8080,
  path: '/longitud_peticion'
};

// Hace una solicitud
const req = http.request(options);
req.end();

req.on('information', (res) => {
  console.log(`Información recibida antes de la respuesta principal: ${res.statusCode}`);
});
```

101 Upgrade statuses do not fire this event due to their break from the traditional HTTP request/response chain, such as web sockets, in-place TLS upgrades, or HTTP 2.0. To be notified of 101 Upgrade notices, listen for the [`'upgrade'`][] event instead.

### Evento: 'response'

<!-- YAML
added: v0.1.0
-->

* `response` {http.IncomingMessage}

Emitido cuando se recibe una respuesta para esta solicitud. Este evento se emite solo una vez.

### Evento: 'socket'

<!-- YAML
added: v0.5.3
-->

* `socket` {net.Socket}

Emitido luego de que se asigna un socket a esta solicitud.

### Evento: 'timeout'

<!-- YAML
added: v0.7.8
-->

Emitido cuando el socket subyacente agota el tiempo de espera por inactividad. Esto solo notifica que el socket ha estado inactivo. La solicitud debe ser abortada manualmente.

Ver también: [`request.setTimeout()`][].

### Evento: 'upgrade'

<!-- YAML
added: v0.1.94
-->

* `response` {http.IncomingMessage}
* `socket` {net.Socket}
* `head` {Buffer}

Emitido cada vez que un servidor responde a una solicitud con un upgrade. Si este evento no se está escuchando y el código de estado de respuesta es 101 Switching Protocols, a los clientes que reciban una cabecera de actualización se les cerrarán sus conexiones.

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

### request.abort()

<!-- YAML
added: v0.3.8
-->

Marca a la solicitud como "abortando". Llamar a esto causará que los datos restantes en la respuesta se caigan y que el socket se destruya.

### request.aborted

<!-- YAML
added: v0.11.14
-->

Si una solicitud ha sido abortada, este valor será el tiempo en que la solicitud haya sido abortada, en milisegundos, desde el 01 de enero de 1970 00:00:00 UTC.

### request.connection

<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Vea [`request.socket`][].

### request.end(\[data[, encoding]\]\[, callback\])

<!-- YAML
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

Termina de enviar la solicitud. Si no se envía alguna de las partes del cuerpo, se vaciarán hacia el stream. Si la solicitud es fragmentada, esto enviará la `'0\r\n\r\n'` de terminación.

Si se especifica `data`, es equivalente a llamar a [`request.write(data, encoding)`][] seguido de `request.end(callback)`.

Si se especifica `callback`, será llamado cuando el stream de solicitud haya finalizado.

### request.flushHeaders()

<!-- YAML
added: v1.6.0
-->

Vaciar las cabeceras de solicitud.

For efficiency reasons, Node.js normally buffers the request headers until `request.end()` is called or the first chunk of request data is written. It then tries to pack the request headers and data into a single TCP packet.

That's usually desired (it saves a TCP round-trip), but not when the first data is not sent until possibly much later. `request.flushHeaders()` evade la optimización e inicia la solicitud.

### request.getHeader(name)

<!-- YAML
added: v1.6.0
-->

* `name` {string}
* Devuelve: {any}

Lee una cabecera en la solicitud. Note that the name is case insensitive. El tipo del valor devuelto depende de los argumentos proporcionados a [`request.setHeader()`][].

Ejemplo:

```js
request.setHeader('content-type', 'text/html');
request.setHeader('Content-Length', Buffer.byteLength(body));
request.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
const contentType = request.getHeader('Content-Type');
// contentType is 'text/html'
const contentLength = request.getHeader('Content-Length');
// contentLength is of type number
const setCookie = request.getHeader('set-cookie');
// setCookie is of type string[]
```

### request.maxHeadersCount

* {number} **Predeterminado:** `2000`

Limita al conteo máximo de cabeceras de respuesta. Si se establece a 0, no se aplicará ningún límite.

### request.removeHeader(name)

<!-- YAML
added: v1.6.0
-->

* `name` {string}

Elimina a una cabecera que ya está definida dentro del objeto de cabeceras.

Ejemplo:

```js
request.removeHeader('Content-Type');
```

### request.setHeader(name, value)

<!-- YAML
added: v1.6.0
-->

* `name` {string}
* `value` {any}

Establece a un único valor de cabecera para el objeto de cabeceras. Si esta cabecera ya existe en las cabeceras pendientes, su valor será reemplazado. Utilice aquí un array de strings para enviar varias cabeceras con el mismo nombre. Los valores que no sean strings se almacenarán sin modificación. Por lo tanto, [`request.getHeader()`][] puede devolver valores que no sean strings. Sin embargo, los valores que no sean strings se convertirán a strings para la transmisión de red.

Ejemplo:

```js
request.setHeader('Content-Type', 'application/json');
```

or

```js
request.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

### request.setNoDelay([noDelay])

<!-- YAML
added: v0.5.9
-->

* `noDelay` {boolean}

Una vez que se asigne un socket a esta solicitud y se conecte, [`socket.setNoDelay()`][] será llamado.

### request.setSocketKeepAlive(\[enable\]\[, initialDelay\])

<!-- YAML
added: v0.5.9
-->

* `enable` {boolean}
* `initialDelay` {number}

Una vez que se asigne un socket a esta solicitud y se conecte, [`socket.setKeepAlive()`][] será llamado.

### request.setTimeout(timeout[, callback])

<!-- YAML
added: v0.5.9
-->

* `timeout` {number} Milliseconds before a request times out.
* `callback` {Function} Función opcional que será llamada cuando ocurra un timeout. Igual a enlazar al evento `'timeout'` .
* Devuelve: {http.ClientRequest}

Una vez que se asigne un socket a esta solicitud y se conecte, [`socket.setTimeout()`][] será llamado.

### request.socket

<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Referencia al socket subyacente. Generalmente, los usuarios no querrán acceder a esta propiedad. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. El `socket` también puede ser accedido mediante `request.connection`.

Ejemplo:

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

### request.write(chunk\[, encoding\]\[, callback\])

<!-- YAML
added: v0.1.29
-->

* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Devuelve: {boolean}

Envía una parte del cuerpo. Al llamar a este método varias veces, un cuerpo de solicitud puede ser enviado a un servidor — en ese caso se sugiere utilizar la línea de cabecera `['Transfer-Encoding', 'chunked']` al crear la solicitud.

El argumento `encoding` es opcional y solo aplica cuando `chunk` es una string. Por defecto es `'utf8'`.

The `callback` argument is optional and will be called when this chunk of data is flushed.

Devuelve `true` si todos los datos fueron vaciados con éxito hacia el búfer del núcleo. Devuelve `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

## Clase: http.Server

<!-- YAML
added: v0.1.17
-->

Esta clase hereda desde [`net.Server`][] y tiene los siguientes eventos adicionales:

### Evento: 'checkContinue'

<!-- YAML
added: v0.3.0
-->

* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Se emite cada vez que se recibe una solicitud con un HTTP `Expect: 100-continue` . Si este evento no se escucha, el servidor automáticamente responderá con un `100 Continue` según corresponda.

Manejar este evento implica llamar a [`response.writeContinue()`][] si el cliente debe continuar a enviar el cuerpo de la solicitud, o a generar una respuesta apropiada de HTTP (por ejemplo, 400 Bad Request) si el cliente no debería continuar a enviar el cuerpo de la solicitud.

Tenga en cuenta que cuando este evento se emite y se maneja, el evento [`'request'`][] no se emitirá.

### Evento: 'checkExpectation'

<!-- YAML
added: v5.5.0
-->

* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Se emite cada vez que se recibe una solicitud con una cabecera HTTP `Expect`, en donde el valor no es `100-continue`. Si este evento no se escucha, el servidor automáticamente responderá con un `417 Expectation Failed` según corresponda.

Tenga en cuenta que cuando este evento se emite y se maneja, el evento [`'request'`][] no será emitido.

### Evento: 'clientError'

<!-- YAML
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

Si una conexión del cliente emite un evento `'error'`, será reenviado aquí. El listener de este evento es responsable de cerrar/destruir al socket subyacente. Por ejemplo, uno podría desear cerrar de manera más elegante al socket con una respuesta HTTP personalizada, en lugar de cortar la conexión de manera abrupta.

El comportamiento predeterminado es cerrar al socket con una respuesta HTTP '400 Bad Request' si es posible, de lo contrario el socket se destruirá inmediatamente.

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

Cuando el evento `'clientError'` ocurre, no hay ningún objeto de `request` o `response`, así que cualquier respuesta HTTP enviada, incluyendo las cabeceras de respuesta y la carga útil, *deben* escribirse directamente al objeto `socket` . Se debe tener cuidado en asegurarse de que la respuesta sea un mensaje de respuesta HTTP con el formato correcto.

`err` es una instancia de `Error` con dos columnas adicionales:

* `bytesParsed`: the bytes count of request packet that Node.js may have parsed correctly;
* `rawPacket`: el paquete crudo de la respuesta actual.

### Evento: 'close'

<!-- YAML
added: v0.1.4
-->

Se emite cuando el servidor se cierra.

### Evento: 'connect'

<!-- YAML
added: v0.7.0
-->

* `request` {http.IncomingMessage} Argumentos para la solicitud HTTP, como se encuentra en el evento [`'request'`][]
* `socket` {net.Socket} Socket de red entre el servidor y el cliente
* `head` {Buffer} The first packet of the tunneling stream (may be empty)

Se emite cada vez que un cliente solicita un método de HTTP `CONNECT` . Si este evento no se escucha, entonces a los clientes que soliciten un método `CONNECT` se les cerrarán sus conexiones.

Luego de que este evento es emitido, el socket de la solicitud no tendrá un listener de evento `'data'`, lo que significa que necesitará estar enlazado para manejar los datos enviados al servidor en ese socket.

### Evento: 'connection'

<!-- YAML
added: v0.1.0
-->

* `socket` {net.Socket}

Este evento se emite cuando se establece un stream TCP nuevo. `socket` es, por lo general, un objeto de tipo [`net.Socket`][]. Generalmente, los usuarios no querrán acceder a este evento. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. El `socket` también puede ser accedido en `request.connection`.

Este evento también puede ser emitido de manera explícita por los usuarios para inyectar conexiones dentro del servidor HTTP. En ese caso, cualquier stream [`Duplex`][] puede ser pasado.

### Evento: 'request'

<!-- YAML
added: v0.1.0
-->

* `request` {http.IncomingMessage}
* `response` {http.ServerResponse}

Se emite cada vez que hay una solicitud. Note that there may be multiple requests per connection (in the case of HTTP Keep-Alive connections).

### Evento: 'upgrade'

<!-- YAML
added: v0.1.94
changes:

  - version: v10.0.0
    pr-url: v10.0.0
    description: Not listening to this event no longer causes the socket
                 to be destroyed if a client sends an Upgrade header.
-->

* `request` {http.IncomingMessage} Argumentos para la solicitud HTTP, como se encuentra en el evento [`'request'`][]
* `socket` {net.Socket} Socket de red entre el servidor y el cliente
* `head` {Buffer} El primer paquete del stream actualizado (puede estar vacío)

Se emite cada vez que un cliente solicita una mejora HTTP. Escuchar a este evento es opcional, y los clientes no pueden insistir en un cambio de protocolo.

Luego de que este evento es emitido, el socket de la solicitud no tendrá un listener de evento `'data'`, lo que significa que necesitará estar enlazado para manejar los datos enviados al servidor en ese socket.

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* `callback` {Function}

Detiene al servidor de aceptar nuevas conexiones. Vea [`net.Server.close()`][].

### server.listen()

Inicia el servidor HTTP escuchando conexiones. Este método es idéntico a [`server.listen()`][] desde [`net.Server`][].

### server.listening

<!-- YAML
added: v5.7.0
-->

* {boolean} Indica si el servidor está escuchando a las conexiones o no.

### server.maxHeadersCount

<!-- YAML
added: v0.7.0
-->

* {number} **Predeterminado:** `2000`

Limita al conteo máximo de cabeceras entrantes. Si se establece a 0, no se aplicará ningún límite.

### server.setTimeout(\[msecs\]\[, callback\])

<!-- YAML
added: v0.9.12
-->

* `msecs` {number} **Predeterminado:** `120000` (2 minutos)
* `callback` {Function}
* Devuelve: {http.Server}

Establece el valor del tiempo de espera para los sockets, y emite un evento `'timeout'` en el objeto del Servidor, pasando al socket como un argumento, en caso de que ocurra un timeout.

Si hay un listener del evento `'timeout'` en el objeto del Servidor, entonces será llamado con el socket puesto en tiempo de espera como un argumento.

Por defecto, el valor del tiempo de espera del Servidor es 2 minutos, y los sockets se destruyen automáticamente si se agota su tiempo de espera. Sin embargo, si un callback es asignado al evento `'timeout'` del Servidor, los tiempos de espera deberán ser manejados de manera explícita.

### server.timeout

<!-- YAML
added: v0.9.12
-->

* {number} Tiempo de espera en milisegundos. **Predeterminado:** `120000` (2 minutos).

The number of milliseconds of inactivity before a socket is presumed to have timed out.

Un valor de `0` inhabilitará el comportamiento del tiempo de espera en conexiones entrantes.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

### server.keepAliveTimeout

<!-- YAML
added: v8.0.0
-->

* {number} Tiempo de espera en milisegundos. **Predeterminado:** `5000` (5 segundos).

El número de milisegundos de inactividad que necesita un servidor para esperar a datos entrantes adicionales, después de que haya terminado de escribir la última respuesta, antes de que se destruya un socket. If the server receives new data before the keep-alive timeout has fired, it will reset the regular inactivity timeout, i.e., [`server.timeout`][].

A value of `0` will disable the keep-alive timeout behavior on incoming connections. A value of `0` makes the http server behave similarly to Node.js versions prior to 8.0.0, which did not have a keep-alive timeout.

The socket timeout logic is set up on connection, so changing this value only affects new connections to the server, not any existing connections.

## Clase: http.ServerResponse

<!-- YAML
added: v0.1.17
-->

Este objeto es creado internamente por un servidor HTTP — no por el usuario. Es pasado como el segundo parámetro al evento [`'request'`][] .

La respuesta implementa, pero no hereda, la interfaz del [Stream Editable](stream.html#stream_class_stream_writable) . Esto es un [`EventEmitter`][] con los siguientes eventos:

### Evento: 'close'

<!-- YAML
added: v0.6.7
-->

Indica que la conexión subyacente fue terminada antes de que [`response.end()`][] fuese llamado, o antes de que se hubiera podido vaciar.

### Evento: 'finish'

<!-- YAML
added: v0.3.6
-->

Se emite cuando la respuesta ha sido enviada. Más específicamente, este evento se emite cuando el último segmento de las cabeceras de respuesta y el cuerpo han sido entregados al sistema operativo para la transmisión sobre la red. Eso no implica que el cliente haya recibido algo aún.

Después de este evento, no se emitirán más eventos en el objeto de respuesta.

### response.addTrailers(headers)

<!-- YAML
added: v0.3.0
-->

* `headers` {Object}

This method adds HTTP trailing headers (a header but at the end of the message) to the response.

Los trailers se emitirán **solo** si la codificación fragmentada se utiliza para la respuesta; en caso de que no (por ejemplo, si la solicitud fue HTTP/1.0), serán descartados de manera silenciosa.

Tenga en cuenta que HTTP requiere que la cabecera `Trailer` sea enviada para emitir trailers, con una lista de los campos de cabecera en su valor. Por ejemplo,

```js
response.writeHead(200, { 'Content-Type': 'text/plain',
                          'Trailer': 'Content-MD5' });
response.write(fileData);
response.addTrailers({ 'Content-MD5': '7895bf4b8828b55ceaf47747b4bca667' });
response.end();
```

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

### response.connection

<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Vea [`response.socket`][].

### response.end(\[data\]\[, encoding\][, callback])

<!-- YAML
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

Este método señala al servidor que todas las cabeceras de respuesta y el cuerpo han sido enviados; el servidor debería considerar este mensaje como completo. El método, `response.end()`, DEBE ser llamado en cada respuesta.

Si se especifica `data`, será equivalente a llamar a [`response.write(data, encoding)`][] seguido por `response.end(callback)`.

Si se especifica `callback`, será llamado cuando el stream de respuesta haya finalizado.

### response.finished

<!-- YAML
added: v0.0.2
-->

* {boolean}

El valor booleano indica si se ha completado la respuesta. Comienza como `false`. Luego de que [`response.end()`][] se ejecuta, el valor será `true`.

### response.getHeader(name)

<!-- YAML
added: v0.4.0
-->

* `name` {string}
* Devuelve: {any}

Lee una cabecera que ya ha sido puesta en cola, pero que no ha sido enviada al cliente. Note that the name is case insensitive. El tipo del valor devuelto depende de los argumentos proporcionados a [`response.setHeader()`][].

Ejemplo:

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

### response.getHeaderNames()

<!-- YAML
added: v7.7.0
-->

* Devuelve: {string[]}

Devuelve un array que contiene los nombres únicos de las cabeceras salientes actuales. Todos los nombres de las cabeceras están en minúsculas.

Ejemplo:

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

### response.getHeaders()

<!-- YAML
added: v7.7.0
-->

* Devuelve: {Object}

Devuelve una copia superficial de las cabeceras salientes actuales. Ya que se utiliza una copia superficial, los valores del array pueden ser mutados sin llamadas adicionales a varios métodos del módulo http relacionados con la cabecera. Las claves del objeto devuelto son los nombres de cabecera, y los valores son los respectivos valores de cabecera. Todos los nombres de las cabeceras están en minúscula.

The object returned by the `response.getHeaders()` method *does not* prototypically inherit from the JavaScript `Object`. Esto significa que los típicos métodos `Object` tales como `obj.toString()`, `obj.hasOwnProperty()`, entre otros, no están definidos y *no funcionarán*.

Ejemplo:

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

Devuelve `true` si la cabecera identificada por `name` está actualmente establecida en las cabeceras salientes. Note that the header name matching is case-insensitive.

Ejemplo:

```js
const hasContentType = response.hasHeader('content-type');
```

### response.headersSent

<!-- YAML
added: v0.9.3
-->

* {boolean}

Booleano (solo-lectura). Verdadero si las cabeceras fueron enviadas, de lo contrario falso.

### response.removeHeader(name)

<!-- YAML
added: v0.4.0
-->

* `name` {string}

Elimina a una cabecera que está puesta en cola para un envío implícito.

Ejemplo:

```js
response.removeHeader('Content-Encoding');
```

### response.sendDate

<!-- YAML
added: v0.7.5
-->

* {boolean}

Al ser verdadero, la cabecera de Fecha será generada automáticamente y enviada en la respuesta si no está presente en las cabeceras. Por defecto es verdadero.

Esto solo debería inhabilitarse para las pruebas; HTTP requiere el encabezado de Fecha en las respuestas.

### response.setHeader(name, value)

<!-- YAML
added: v0.4.0
-->

* `name` {string}
* `value` {any}

Establece un único valor de cabecera para cabeceras implícitas. Si esta cabecera ya existe en los envíos de cabeceras pendientes, su valor será reemplazado. Utilice aquí un array de strings para enviar varias cabeceras con el mismo nombre. Los valores que no sean strings se almacenarán sin modificación. Por lo tanto, [`response.getHeader()`][] puede devolver valores que no sean strings. Sin embargo, los valores que no sean strings se convertirán a strings para la transmisión de red.

Ejemplo:

```js
response.setHeader('Content-Type', 'text/html');
```

o

```js
response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
```

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

Cuando las cabeceras hayan sido establecidas con [`response.setHeader()`][], serán combinadas con cualquiera de las cabeceras pasadas a [`response.writeHead()`][], con las cabeceras pasadas a [`response.writeHead()`][] dada su precedencia.

```js
// returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

### response.setTimeout(msecs[, callback])

<!-- YAML
added: v0.9.12
-->

* `msecs` {number}
* `callback` {Function}
* Devuelve: {http.ServerResponse}

Sets the Socket's timeout value to `msecs`. Si se proporciona una callback, entonces se agregará como un listener en el evento `'timeout'` en el objeto de respuesta.

Si no se añade ningún listener `'timeout'` a la solicitud, la respuesta, o al servidor, entonces los sockets se destruirán cuando se agote su tiempo de espera. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

### response.socket

<!-- YAML
added: v0.3.0
-->

* {net.Socket}

Referencia al socket subyacente. Generalmente, los usuarios no querrán acceder a esta propiedad. In particular, the socket will not emit `'readable'` events because of how the protocol parser attaches to the socket. After `response.end()`, the property is nulled. El `socket` también puede ser accedido mediante `response.connection`.

Ejemplo:

```js
const http = require('http');
const server = http.createServer((req, res) => {
  const ip = res.socket.remoteAddress;
  const port = res.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

### response.statusCode

<!-- YAML
added: v0.4.0
-->

* {number}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status code that will be sent to the client when the headers get flushed.

Ejemplo:

```js
response.statusCode = 404;
```

Después de que la cabecera de respuesta fue enviada al cliente, este propiedad indica el código de estado que fue enviado.

### response.statusMessage

<!-- YAML
added: v0.11.8
-->

* {string}

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status message that will be sent to the client when the headers get flushed. Si esto se deja como `undefined`, entonces el mensaje estándar para el código de estado será utilizado.

Ejemplo:

```js
response.statusMessage = 'Not found';
```

Después de que la cabecera de respuesta fue enviada al cliente, esta propiedad indica el mensaje de estado que fue enviado.

### response.write(chunk\[, encoding\]\[, callback\])

<!-- YAML
added: v0.1.29
-->

* `chunk` {string|Buffer}
* `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
* Devuelve: {boolean}

If this method is called and [`response.writeHead()`][] has not been called, it will switch to implicit header mode and flush the implicit headers.

Esto envía una parte del cuerpo de la respuesta. Este método puede ser llamado varias veces para proporcionar partes sucesivas del cuerpo.

Tenga en cuenta que en el módulo `http`, el cuerpo de respuesta se omite cuando la solicitud es una solicitud HEAD. Asimismo, las respuestas `204` y `304` *no deben* incluir un cuerpo de mensaje.

`chunk` puede ser una string o un búfer. Si `chunk` es una string, el segundo parámetro especificará cómo codificarlo dentro de un stream de bytes. `callback` será llamado cuando este fragmento de datos sea vaciado.

Este es el cuerpo crudo de HTTP y no tiene nada qué ver con las codificaciones de cuerpo de partes múltiples y de alto nivel que pueden ser utilizadas.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. Es decir, la respuesta se almacena hasta el primer fragmento del cuerpo.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Devuelve `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

### response.writeContinue()

<!-- YAML
added: v0.3.0
-->

Envía un mensaje de HTTP/1.1 100 Continue al cliente, indicando que el cuerpo de solicitud debería ser enviado. Vea el evento [`'checkContinue'`][] en `Server`.

### response.writeHead(statusCode\[, statusMessage\]\[, headers\])

<!-- YAML
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

Envía una cabecera de respuesta a la solicitud. El código de estado es un código de estado HTTP de 3 dígitos, como `404`. El último argumento, `headers`, son las cabeceras de respuesta. Opcionalmente, uno puede dar un `statusMessage` legible para humanos como el segundo argumento.

Ejemplo:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Este método debe ser llamado solo una vez en un mensaje, y debe ser llamado antes de que [`response.end()`][] sea llamado.

Si [`response.write()`][] o [`response.end()`][] son llamados antes de llamar a esto, las cabeceras implícitas/mutables serán calculadas y llamarán a esta función.

Cuando las cabeceras hayan sido establecidas con [`response.setHeader()`][], serán combinadas con cualquiera de las cabeceras pasadas a [`response.writeHead()`][], con las cabeceras pasadas a [`response.writeHead()`][] dada su procedencia.

```js
// returns content-type = text/plain
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Tenga en cuenta que la Longitud del Contenido es dado en bytes y no en caracteres. El ejemplo anterior funciona porque la string `'hello world'` solo contiene caracteres de un solo byte. Si el cuerpo contiene caracteres altamente codificados, entonces `Buffer.byteLength()` debería ser utilizado para determinar el número de bytes en una codificación dada. Y Node.js no verifica si la Longitud del Contenido y la longitud del cuerpo que ha sido transmitido son iguales o no.

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

### response.writeProcessing()

<!-- YAML
added: v10.0.0
-->

Envía un mensaje de HTTP/1.1 102 Processing al cliente, indicando que el cuerpo de la solicitud debería ser enviado.

## Clase: http.IncomingMessage

<!-- YAML
added: v0.1.17
-->

Un objeto `IncomingMessage` es creado por [`http.Server`][] o [`http.ClientRequest`][] y pasado como el primer argumento al evento [`'request'`][] y [`'response'`][] respectivamente. Puede ser utilizado para acceder a un estado de respuesta, cabeceras y datos.

Implementa la interfaz del [Stream Legible](stream.html#stream_class_stream_readable), así como los siguiente eventos adicionales, métodos, y propiedades.

### Evento: 'aborted'

<!-- YAML
added: v0.3.8
-->

Se emite cuando la solicitud ha sido abortada.

### Evento: 'close'

<!-- YAML
added: v0.4.2
-->

Indica que la conexión subyacente fue cerrada. Al igual que `'end'`, este evento ocurre una sóla vez por respuesta.

### message.aborted

<!-- YAML
added: v10.1.0
-->

* {boolean}

La propiedad de `message.aborted` será `true` si la solicitud ha sido abortada.

### message.destroy([error])

<!-- YAML
added: v0.3.0
-->

* `error` {Error}

Llama a `destroy()` en el socket que recibió el `IncomingMessage`. Si se proporciona `error`, un evento de `'error'` será emitido y `error` será pasado como un argumento a los listeners que estén en el evento.

### message.headers

<!-- YAML
added: v0.1.5
-->

* {Object}

El objeto de cabeceras de solicitud/respuesta.

Pares de valores clave de nombres de cabecera y valores. Los nombres de cabecera están en minúsculas. Ejemplo:

```js
// Prints something like:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

Los duplicados en las cabeceras crudas son manejados en las siguientes maneras, dependiendo del nombre de cabecera:

* Los duplicados de `age`, `authorization`, `content-length`, `content-type`, `etag`, `expires`, `from`, `host`, `if-modified-since`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `referer`, `retry-after`, or `user-agent` se descartan.
* `set-cookie` siempre es una matriz. Los duplicados se añaden a la matriz.
* Para todos los otros encabezados, los valores se unen con ', '.

### message.httpVersion

<!-- YAML
added: v0.1.1
-->

* {string}

En caso de la solicitud del servidor, la versión HTTP enviada por el cliente. En caso de la respuesta del cliente, la versión HTTP del servidor conectado. Probablemente o `'1.1'` o `'1.0'`.

Además, `message.httpVersionMajor` es el primer entero y `message.httpVersionMinor` es el segundo.

### message.method

<!-- YAML
added: v0.1.1
-->

* {string}

**Solo válido para las solicitudes obtenidas desde [`http.Server`][].**

El método de solicitud es una string. Sólo lectura. Ejemplo: `'GET'`, `'DELETE'`.

### message.rawHeaders

<!-- YAML
added: v0.11.6
-->

* {string[]}

La lista cruda de cabeceras de solicitud/respuesta exactamente como fueron recibidas.

Tenga en cuenta que las llaves y los valores están en la misma lista. *no* es una lista de tuplas. So, the even-numbered offsets are key values, and the odd-numbered offsets are the associated values.

Los nombres de los encabezados no están en minúsculas, y los duplicados no están fusionados.

```js
// Prints something like:
//
// [ 'user-agent',
//   'this is invalid because there can be only one',
//   'User-Agent',
//   'curl/7.22.0',
//   'Host',
//   '127.0.0.1:8000',
//   'ACCEPT',
//   '*/*' ]
console.log(request.rawHeaders);
```

### message.rawTrailers

<!-- YAML
added: v0.11.6
-->

* {string[]}

Las claves del trailer y los valores crudos de solicitud/respuesta, exactamente como fueron recibidos. Poblado solamente en el evento `'end'` .

### message.setTimeout(msecs, callback)

<!-- YAML
added: v0.5.9
-->

* `msecs` {number}
* `callback` {Function}
* Devuelve: {http.IncomingMessage}

Llama a `message.connection.setTimeout(msecs, callback)`.

### message.socket

<!-- YAML
added: v0.3.0
-->

* {net.Socket}

El objeto de [`net.Socket`][] asociado a la conexión.

Con el soporte HTTPS, utilice [`request.socket.getPeerCertificate()`][] para obtener los detalles de autenticación del cliente.

### message.statusCode

<!-- YAML
added: v0.1.1
-->

* {number}

**Sólo válido para la respuesta obtenida de [`http.ClientRequest`][].**

El código de estado de respuesta de 3 dígitos de HTTP. Por ejemplo, `404`.

### message.statusMessage

<!-- YAML
added: v0.11.10
-->

* {string}

**Sólo válido para la respuesta obtenida de [`http.ClientRequest`][].**

El mensaje de estado de la respuesta HTTP (frase del motivo). Por ejemplo, `OK` o `Internal Server
Error`.

### message.trailers

<!-- YAML
added: v0.3.0
-->

* {Object}

El objeto de trailers de solicitud/respuesta. Poblado solamente en el evento `'end'` .

### message.url

<!-- YAML
added: v0.1.90
-->

* {string}

**Solo válido para las solicitudes obtenidas desde [`http.Server`][].**

Solicitar string de URL. Esto solo contiene la URL que está presente en la solicitud HTTP actual. Si la solicitud es:

```txt
GET /status?name=ryan HTTP/1.1\r\n
Accept: text/plain\r\n
\r\n
```

Entonces `request.url` será:

<!-- eslint-disable semi -->

```js
'/status?name=ryan'
```

Para analizar la url dentro de sus partes, se puede utilizar `require('url').parse(request.url)` . Ejemplo:

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

To extract the parameters from the query string, the `require('querystring').parse` function can be used, or `true` can be passed as the second argument to `require('url').parse`. Ejemplo:

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

## http.METHODS

<!-- YAML
added: v0.11.8
-->

* {string[]}

Una lista de métodos HTTP que son compatibles con el analizador.

## http.STATUS_CODES

<!-- YAML
added: v0.1.22
-->

* {Object}

Una colección de todos los códigos de estado estándar de respuesta de HTTP, y la descripción corta de cada uno. Por ejemplo, `http.STATUS_CODES[404] === 'Not
Found'`.

## http.createServer(\[options\]\[, requestListener\])

<!-- YAML
added: v0.1.13
changes:

  - version: v9.6.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: The `options` argument is supported now.
-->

* `options` {Object} 
  * `IncomingMessage` {http.IncomingMessage} Especifica la clase de `IncomingMessage` que será utilizada. Útil para extender el `IncomingMessage` original. **Predeterminado:** `IncomingMessage`.
  * `ServerResponse` {http.ServerResponse} Especifica la clase `ServerResponse` que será utilizada. Útil para extender el `ServerResponse` original. **Predeterminado:** `ServerResponse`.

* `requestListener` {Function}

* Devuelve: {http.Server}

Devuelve una nueva instancia de [`http.Server`][].

El `requestListener` es una función que se añade automáticamente al evento de [`'request'`][].

## http.get(options[, callback])

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `options` {Object | string | URL} Acepta las mismas `options` que [`http.request()`][], con el `method` siempre establecido a `GET`. Las propiedades que se heredan desde el prototipo son ignoradas.
* `callback` {Function}
* Devuelve: {http.ClientRequest}

Ya que la mayoría de las solicitudes son solicitudes de GET sin cuerpos, Node.js proporciona este método de conveniencia. La única diferencia entre este método y [`http.request()`][] es que establece el método a GET y llama a `req.end()` automáticamente. Tenga en cuenta que el callback debe tener cuidado al consumir los datos de respuesta, por los motivos indicados en la sección [`http.ClientRequest`][] .

El `callback` se invoca con un único argumento que es una instancia de [`http.IncomingMessage`][].

JSON Fetching Example:

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

## http.globalAgent

<!-- YAML
added: v0.5.9
-->

* {http.Agent}

Instancia global de `Agent` que es utilizada de modo predeterminado para todas las solicitudes del cliente de HTTP.

## http.request(options[, callback])

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

* `options` {Object | string | URL} 
  * `protocol` {string} Protocolo a utilizar. **Predeterminado:** `'http:'`.
  * `host` {string} Un nombre de dominio o dirección IP del servidor al cual se le emitirá la solicitud. **Predeterminado:** `'http:'`.
  * `hostname` {string} Alias para `host`. Para dar soporte a [`url.parse()`][], se prefiere `hostname` sobre `host`.
  * `family` {number} familia de la dirección IP a usar cuando se resuelve `host` y `hostname`. Los valores válidos son `4` o `6`. Cuando no esté especificado, se utilizará IP v4 y v6.
  * `port` {number} Puerto del servidor remoto. **Predeterminado:** `80`.
  * `localAddress` {string} Interfaz local para enlazar conexiones de red.
  * `socketPath` {string} Unix Domain Socket (use one of `host:port` or `socketPath`).
  * `method` {string} Una string que especifique el método de solicitud HTTP. **Predeterminado:** `'GET'`.
  * `path` {string} Ruta de solicitud. Should include query string if any. Por ejemplo, `'/index.html?page=12'`. Se arroja una excepción cuando la ruta de solicitud contiene caracteres no válidos. Actualmente, solo se rechazan los espacios, pero eso puede cambiar en el futuro. **Predeterminado:** `'/'`.
  * `headers` {Object} Un objeto que contiene las cabeceras de solicitud.
  * `auth` {string} autenticación Básica, por ejemplo, `'user:password'` para computar una cabecera de Autorización.
  * `agent` {http.Agent | boolean} Controla el comportamiento de [`Agent`][]. Valores posibles: 
    * `undefined` (Predeterminado): utiliza [`http.globalAgent`][] para este host y este puerto.
    * objeto `Agent`: utiliza explícitamente lo que fue pasado en `Agent`.
    * `false`: hace que un nuevo `Agent` con valores predeterminados sea utilizado.
  * `createConnection` {Function} Una función que produce un socket/stream para ser utilizado para la solicitud cuando no se utilice la opción `agent` . Esto puede ser utilizado para evitar crear una clase `Agent` personalizada solo para anular la función `createConnection` predeterminada. Vea [`agent.createConnection()`][] para más detalles. Cualquier stream [`Duplex`][] es un valor válido.
  * `timeout` {number}: Un número que especifica el tiempo de espera del socket en milisegundos. Esto establecerá el tiempo de espera antes de que el socket se conecte.
  * `setHost` {boolean}: Especifica si se agrega automáticamente a la cabecera `Host` o no. Por defecto es `true`.
* `callback` {Function}
* Devuelve: {http.ClientRequest}

Node.js mantiene varias conexiones por servidor para realizar solicitudes HTTP. Esta función permite emitir solicitudes de manera transparente.

`options` puede ser un objeto, una string, o un objeto [`URL`][] . Si `options` es una string, se analizará automáticamente con [`url.parse()`][]. Si es un objeto [`URL`][], será convertido automáticamente a un objeto `options` ordinario.

El parámetro opcional `callback` será agregado como un listener de un solo uso para el evento [`'response'`][] .

`http.request()` devuelve una instancia de la clase [`http.ClientRequest`][] . La instancia `ClientRequest` es un stream escribible. Si uno necesita subir un archivo con una solicitud POST, entonces escriba al objeto `ClientRequest` .

Ejemplo:

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

Tenga en cuenta que en el ejemplo, `req.end()` fue llamado. Con `http.request()` uno siempre debe llamar a `req.end()` para indicar el final de la solicitud - incluso si no hay datos que estén siendo escritos para el cuerpo de solicitud.

Si se encuentra algún error durante la solicitud (sea con una resolución DNS, errores a nivel de TCP, o errores de análisis en HTTP) se emitirá un evento `'error'` en el objeto de solicitud devuelto. Como con todos los eventos `'error'`, si no hay listeners registrados se arrojará el error.

Hay algunas cabeceras especiales que deberían tenerse en cuenta.

* Enviar un 'Connection: keep-alive' notificará a Node.js que la conexión al servidor debe persistir hasta la siguiente solicitud.

* Enviar una cabecera 'Content-Length' inhabilitará la codificación fragmentada predeterminada.

* Enviar una cabecera 'Expect' enviará inmediatamente las cabeceras de solicitud. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the `'continue'` event should be set. Vea RFC2616 Section 8.2.3 para más información.

* Enviar una cabecera de Autorización anulará utilizando la opción `auth` para computar la autenticación básica.

Ejemplo utilizando un [`URL`][] como `options`:

```js
const options = new URL('http://abc:xyz@example.com');

const req = http.request(options, (res) => {
  // ...
});
```

En una solicitud exitosa, los siguientes eventos se emitirán en el siguiente orden:

* `'socket'`
* `'response'` 
  * `'data'` cualquier número de veces, en el objeto `res` (`'data'` no será emitido si el cuerpo de respuesta está vacío, por ejemplo, en la mayoría de las redirecciones)
  * `'end'` en el objeto `res`
* `'close'`

En el caso de un error de conexión, se emitirán los siguientes eventos:

* `'socket'`
* `'error'`
* `'close'`

Si `req.abort()` es llamado antes de que la conexión tenga éxito, los siguientes eventos serán emitidos en el siguiente orden:

* `'socket'`
* (`req.abort()` llamado aquí)
* `'abort'`
* `'close'`
* `'error'` con un error con el mensaje `'Error: socket hang up'` y el código `'ECONNRESET'`

Si `req.abort()` es llamado después de que se reciba la respuesta, los siguientes eventos serán emitidos en el siguiente orden:

* `'socket'`
* `'response'` 
  * `'data'` cualquier número de veces, en el objeto `res`
* (`req.abort()` llamado aquí)
* `'abort'`
* `'close'` 
  * `'aborted'` en el objeto `res`
  * `'end'` en el objeto `res`
  * `'close'` en el objeto `res`

Tenga en cuenta que establecer la opción `timeout` o utilizar la función `setTimeout()` no abortará la solicitud ni hará nada más que añadir un evento `'timeout'` .