# HTTP/2
<!-- YAML
added: v8.4.0
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/22466
    description: HTTP/2 is now Stable. Previously, it had been Experimental.
-->
<!--introduced_in=v8.4.0-->

> Estability: 2 - Estable

El módulo `http2` provee una implementación del protocolo [HTTP/2](https://tools.ietf.org/html/rfc7540) . Se puede acceder a través de:

```js
const http2 = require('http2');
```

## API de Núcleo

La API de Núcleo proporciona una interfaz de bajo nivel diseñada específicamente alrededor del soporte para las funciones del protocolo de HTTP/2. *No* está específicamente diseñada para la compatibilidad con la API existente del módulo [HTTP/1](http.html) . Sin embargo, la [API de Compatibilidad](#http2_compatibility_api) sí.

La API de Núcleo `http2` es mucho más simétrica entre cliente y servidor que la API `http` . Por ejemplo, la mayoría de los eventos, como `'error'`, `'connect'` y `'stream'`, pueden ser emitidos por el código del lado del cliente o por el código del lado del servidor.

### Ejemplo del lado del servidor

La siguiente ilustra un servidor simple de HTTP/2 utilizando la API de núcleo. Dado que no hay navegadores conocidos que soporten [unencrypted HTTP/2](https://http2.github.io/faq/#does-http2-require-encryption), el uso de [`http2.createSecureServer()`][] es necesario al comunicarse con los clientes del navegador.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('localhost-privkey.pem'),
  cert: fs.readFileSync('localhost-cert.pem')
});
server.on('error', (err) => console.error(err));

server.on('stream', (stream, headers) => {
  // stream is a Duplex
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(8443);
```

Para generar el certificado y la clave para este ejemplo, ejecute:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout localhost-privkey.pem -out localhost-cert.pem
```

### Ejemplo del lado del cliente

Lo siguiente ilustra un cliente HTTP/2:

```js
const http2 = require('http2');
const fs = require('fs');
const client = http2.connect('https://localhost:8443', {
  ca: fs.readFileSync('localhost-cert.pem')
});
client.on('error', (err) => console.error(err));

const req = client.request({ ':path': '/' });

req.on('response', (headers, flags) => {
  for (const name in headers) {
    console.log(`${name}: ${headers[name]}`);
  }
});

req.setEncoding('utf8');
let data = '';
req.on('data', (chunk) => { data += chunk; });
req.on('end', () => {
  console.log(`\n${data}`);
  client.close();
});
req.end();
```

### Clase: Http2Session
<!-- YAML
added: v8.4.0
-->

* Extiende a: {EventEmitter}

Las instancias de la clase `http2.Http2Session` representan una sesión activa de comunicaciones entre un cliente HTTP/2 y un servidor. Instances of this class are *not* intended to be constructed directly by user code.

Cada instancia de `Http2Session` exhibirá comportamientos ligeramente distintos, dependiendo de si está operando como un servidor o un cliente. La propiedad `http2session.type` puede ser utilizada para determinar el modo en el que una `Http2Session` está operando. En el lado del servidor, el código de usuario raramente debe tener ocasión de trabajar directamente con el objeto `Http2Session`, con la mayoría de las acciones tomadas típicamente a través de interacciones, ya sea con los objetos `Http2Server` o `Http2Stream`.

User code will not create `Http2Session` instances directly. Server-side `Http2Session` instances are created by the `Http2Server` instance when a new HTTP/2 connection is received. Client-side `Http2Session` instances are created using the `http2.connect()` method.

#### Http2Session y Sockets

Cada instancia `Http2Session` está asociada con exactamente un [`net.Socket`][] o un [`tls.TLSSocket`][] cuando es creada. Cuando se destruya el `Socket` o la `Http2Session`, ambos serán destruidos.

Because of the specific serialization and processing requirements imposed by the HTTP/2 protocol, it is not recommended for user code to read data from or write data to a `Socket` instance bound to a `Http2Session`. Hacerlo, puede poner la sesion HTTP/2 en un estado indeterminado, causando que la sesión y el socket se vuelvan inutilizables.

Una vez que un `Socket` haya sido vinculado a una `Http2Session`, el código de usuario debería depender únicamente de la API de la `Http2Session`.

#### Evento: 'close'
<!-- YAML
added: v8.4.0
-->

El evento de `'close'` se emite una vez que la `Http2Session` ha sido destruida. Su oyente no espera ningún argumento.

#### Evento: 'connect'
<!-- YAML
added: v8.4.0
-->

* `session` {Http2Session}
* `socket` {net.Socket}

El evento `'connect'` se emite una vez que la `Http2Session` ha sido conectada exitosamente al peer remoto y la comunicación pueda comenzar.

El código de usuario generalmente no escuchará directamente a este evento.

#### Evento: 'error'
<!-- YAML
added: v8.4.0
-->

* `error` {Error}

El evento `'error'` se emite cuando un error ocurre durante el procesamiento de una `Http2Session`.

#### Evento: 'frameError'
<!-- YAML
added: v8.4.0
-->

* `type` {integer} El tipo de frame.
* `code` {integer} El código de error.
* `id` {integer} La id del stream (o `0` si el frame no está asociado a un stream).

El evento `'frameError'` se emite cuando ocurre un error mientras se intenta enviar un frame en la sesión. Si el frame no pudo ser enviado se asocia con un `Http2Stream` específico, se realizará un intento para emitir un evento `'frameError'` en el `Http2Stream` .

Si el evento `'frameError'` esta asociado con un stream, el stream se cerrará y se destruirá inmediatamente después del evento `'frameError'` . Si el evento no está asociado a un stream, la `Http2Session` se apagará inmediatamente después del evento `'frameError'` .

#### Evento: 'goaway'
<!-- YAML
added: v8.4.0
-->

* `errorCode` {number} El código de error HTTP/2 especificado en el frame `GOAWAY` .
* `lastStreamID` {number} La ID del último stream procesado exitosamente por el peer remoto (o `0` si no se especifica ninguna ID).
* `opaqueData` {Buffer} Si se incluyeron datos opacos adicionales en el frame `GOAWAY`, una instancia `Buffer` será pasada conteniendo esos datos.

El evento `'goaway'` se emite cuando se recibe un frame de `GOAWAY` .

La instancia `Http2Session` se apagará automáticamente cuando se emita el evento `'goaway'` .

#### Evento: 'localSettings'
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object} Una copia recibida del frame `SETTINGS` .

El evento `'localSettings'` se emite cuando un reconocimiento del frame `SETTINGS` ha sido recibida.

Al utilizar `http2session.settings()` para enviar nuevas configuraciones, las configuraciones modificadas no toman efecto hasta que se emite el evento `'localSettings'` .

```js
session.settings({ enablePush: false });

session.on('localSettings', (settings) => {
  /* Use the new settings */
});
```

#### Event: 'ping'
<!-- YAML
added: v10.12.0
-->

* `payload` {Buffer} The `PING` frame 8-byte payload

The `'ping'` event is emitted whenever a `PING` frame is received from the connected peer.

#### Evento: 'remoteSettings'
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object} Una copia recibida del frame `SETTINGS` .

El evento `'remoteSettings'` se emite cuando un frame `SETTINGS` nuevo es recibido desde el peer conectado.

```js
session.on('remoteSettings', (settings) => {
  /* Use the new settings */
});
```

#### Evento: 'stream'
<!-- YAML
added: v8.4.0
-->

* `stream` {Http2Stream} Una referencia para el stream
* `headers` {HTTP/2 Headers Object} Un objeto describiendo los encabezados
* `flags` {number} Las banderas numéricas asociadas
* `rawHeaders` {Array} Un array que contiene los nombres crudos de cabecera, seguido por sus valores correspondientes.

El evento `'stream'` se emite cuando un `Http2Stream` nuevo es creado.

```js
const http2 = require('http2');
session.on('stream', (stream, headers, flags) => {
  const method = headers[':method'];
  const path = headers[':path'];
  // ...
  stream.respond({
    ':status': 200,
    'content-type': 'text/plain'
  });
  stream.write('hello ');
  stream.end('world');
});
```

En el lado del servidor, el código de usuario típicamente no escuchará este evento directamente y, en su lugar, registrará un handler para el evento `'stream'` emitido por las instancias `net.Server` o `tls.Server`, devueltas por `http2.createServer()` y `http2.createSecureServer()` respectivamente, como en el ejemplo a continuación:

```js
const http2 = require('http2');

// Create an unencrypted HTTP/2 server
const server = http2.createServer();

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.on('error', (error) => console.error(error));
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

Even though HTTP/2 streams and network sockets are not in a 1:1 correspondence, a network error will destroy each individual stream and must be handled on the stream level, as shown above.

#### Evento: 'timeout'
<!-- YAML
added: v8.4.0
-->

Después de que el método `http2session.setTimeout()` es utilizado para establecer el tiempo de espera para este `Http2Session`, el evento `'timeout'` se emite si no hay actividad en el `Http2Session` luego del número de milisegundos configurados.

```js
session.setTimeout(2000);
session.on('timeout', () => { /* .. */ });
```

#### http2session.alpnProtocol
<!-- YAML
added: v9.4.0
-->

* {string|undefined}

El valor será `undefined` si la `Http2Session` aún no se ha conectado a un socket, `h2c` en caso de que la `Http2Session` no esté conectada a un `TLSSocket`, o devolverá el valor de la propiedad `alpnProtocol` del `TLSSocket` conectado.

#### http2session.close([callback])
<!-- YAML
added: v9.4.0
-->

* `callback` {Function}

Cierra de manera elegante la `Http2Session`, permitiendo que cualquier stream se complete por sí solo, y evitando que se construyan nuevas instancias `Http2Stream` . Once closed, `http2session.destroy()` *might* be called if there are no open `Http2Stream` instances.

Sí está especificado, la función `callback` se registra como un handler para el evento `'close'`.

#### http2session.closed
<!-- YAML
added: v9.4.0
-->

* {boolean}

Será `true` si esta instancia de `Http2Session` ha sido cerrada, de lo contrario `false`.

#### http2session.connecting
<!-- YAML
added: v10.0.0
-->

* {boolean}

Será `true` si esta instancia de `Http2Session` todavía está conectándose, se establecerá a `false` antes de emitir el evento de `connect` y/ó llamar al callback de `http2.connect` .

#### http2session.destroy(\[error\]\[, code\])
<!-- YAML
added: v8.4.0
-->

* `error` {Error} Un objeto `Error` si la `Http2Session` está siendo destruida a causa de un error.
* `code` {number} El código de error HTTP/2 a enviar en el frame `GOAWAY` final. Si no está especificado, y si `error` no está definido, `INTERNAL_ERROR` será predeterminado, de lo contrario `NO_ERROR` será predeterminado.

Termina inmediatamente la `Http2Session` y el `net.Socket` o el `tls.TLSSocket` asociados.

Una vez destruido, el `Http2Session` emitirá el evento de `'close'` . Si `error` no está indefinido, un evento `'error'` será emitido inmediatamente antes del evento `'close'`.

Si queda algún `Http2Streams` abierto, asociado con la `Http2Session`, esos también serán destruidos.

#### http2session.destroyed
<!-- YAML
added: v8.4.0
-->

* {boolean}

Será `true` si esta instancia `Http2Session` ha sido destruida y ya no debe ser utilizada, de lo contrario `false`.

#### http2session.encrypted
<!-- YAML
added: v9.4.0
-->

* {boolean|undefined}

El valor es `undefined` si el socket de la sesión `Http2Session` no ha sido conectado aún, `true` si el `Http2Session` está conectado con un `TLSSocket`, y `false` si el `Http2Session` está conectado a otro tipo de socket o stream.

#### http2session.goaway([code[, lastStreamID[, opaqueData]]])
<!-- YAML
added: v9.4.0
-->

* `code` {number} Un código de error de HTTP/2
* `lastStreamID` {number} La identificación numérica del último `Http2Stream` procesado
* `opaqueData` {Buffer|TypedArray|DataView} Una instancia `TypedArray` o `DataView` que contenga datos adicionales que serán llevados dentro del frame `GOAWAY` .

Transmite un frame `GOAWAY` al peer conectado *sin* apagar la `Http2Session`.

#### http2session.localSettings
<!-- YAML
added: v8.4.0
-->

* {HTTP/2 Settings Object}

Un objeto sin prototipo que describa las configuraciones locales actuales de esta `Http2Session`. Las configuraciones locales son locales para *this* `Http2Session` instancia.

#### http2session.originSet
<!-- YAML
added: v9.4.0
-->

* {string[]|undefined}

Si la `Http2Session` se conecta a un `TLSSocket`, la propiedad de `originSet` devolverá un `Array` de orígenes para los cuales el `Http2Session` podría considerarse autoritativo.

The `originSet` property is only available when using a secure TLS connection.

#### http2session.pendingSettingsAck
<!-- YAML
added: v8.4.0
-->

* {boolean}

Indica si `Http2Session` está esperando actualmente una confirmación para un frame `SETTINGS` enviado o no. Será `true` después de llamar al método `http2session.settings()` . Será `false` una vez que todos los frames de CONFIGURACIONES hayan sido reconocidos.

#### http2session.ping([payload, ]callback)
<!-- YAML
added: v8.9.3
-->

* `payload` {Buffer|TypedArray|DataView} Optional ping payload.
* `callback` {Function}
* Devuelve: {boolean}

Envía un frame de `PING` a un peer de HTTP/2 conectado. La función `callback` debe ser proporcionada. El método devolverá a `true` si el `PING` fue enviado, sino, será `false`.

El número máximo de pings sobresalientes (no reconocidos) es determinado por la opción de configuración `maxOutstandingPings`. El máximo valor por defecto es 10.

Si se proporcionan, el `payload` debe ser un `Buffer`, `TypedArray`, o `DataView` conteniendo 8 bytes de datos que serán transmitidos con el `PING` y retornados con el reconocimiento del ping.

El callback será invocado con tres argumentos: un argumento de error que será `null` si el `PING` fue reconocido con éxito, un argumento de `duration` que reporta el número de milisegundos transcurridos desde que el ping fue enviado y desde que el reconocimiento fue recibido, y un `Buffer` que contiene la carga `PING` de 8-byte.

```js
session.ping(Buffer.from('abcdefgh'), (err, duration, payload) => {
  if (!err) {
    console.log(`Ping acknowledged in ${duration} milliseconds`);
    console.log(`With payload '${payload.toString()}'`);
  }
});
```

If the `payload` argument is not specified, the default payload will be the 64-bit timestamp (little endian) marking the start of the `PING` duration.

#### http2session.ref()
<!-- YAML
added: v9.4.0
-->

Llama a [`ref()`][`net.Socket.prototype.ref()`] en este [`net.Socket`] subyacente de la instancia de `Http2Session` .

#### http2session.remoteSettings
<!-- YAML
added: v8.4.0
-->

* {HTTP/2 Settings Object}

Un objeto sin prototipo que describe las configuraciones remotas actuales de esta `Http2Session`. Las configuraciones remotas están establecidas por el peer HTTP/2 *connected* .

#### http2session.setTimeout(msecs, callback)
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}

Utilizado para establecer una función de callback, que es llamada cuando no hay actividad en la `Http2Session` después de unos milisegundos `msecs`. El `callback` dado, está registrado como un oyente en el evento de `'timeout'` .

#### http2session.socket
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Devuelve un objeto `Proxy` que actúa como un `net.Socket` (o `tls.TLSSocket`) pero limita los métodos disponibles para aquellos de uso seguro con HTTP/2.

`destroy`, `emit`, `end`, `pause`, `read`, `resume`, y `write` arrojarán un error con código `ERR_HTTP2_NO_SOCKET_MANIPULATION`. Vea [`Http2Session` and Sockets][] para más información.

El método `setTimeout` será llamado en esta `Http2Session`.

Todas las otras interacciones serán enrutadas directamente al socket.

#### http2session.state
<!-- YAML
added: v8.4.0
-->

Proporciona información diversa sobre el estado actual del `Http2Session`.

* {Object}
  * `effectiveLocalWindowSize` {number} El tamaño de ventana actual y local (recibir) del control de flujo para la `Http2Session`.
  * `effectiveRecvDataLength` {number} El número actual de bytes que han sido recibidos desde el último control de flujo `WINDOW_UPDATE`.
  * `nextStreamID` {number} El identificador numérico que se utilizará la próxima vez que un `Http2Stream` nuevo sea creado por esta `Http2Session`.
  * `localWindowSize` {number} El número de bytes que el peer remoto puede enviar sin recibir un `WINDOW_UPDATE`.
  * `lastProcStreamID` {number} La id numérica del `Http2Stream` para el cual se recibió más recientemente a un frame de `HEADERS` o `DATA` .
  * `remoteWindowSize` {number} El número de bytes que esta `Http2Session` puede enviar sin recibir un `WINDOW_UPDATE`.
  * `outboundQueueSize` {number} El número de frames que actualmente se encuentran dentro de la cola saliente para esta `Http2Session`.
  * `deflateDynamicTableSize` {number} El tamaño actual en bytes del tablero del estado de compresión de la cabecera saliente.
  * `inflateDynamicTableSize` {number} El tamaño actual en bytes del tablero del estado de compresión de la cabecera entrante.

Un objeto que describe el estado actual de este `Http2Session`.

#### http2session.settings(settings)
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object}

Actualiza las configuraciones locales actuales para esta `Http2Session` y envía un nuevo frame `SETTINGS` al peer HTTP/2 conectado.

Una vez llamado, la propiedad de `http2session.pendingSettingsAck` será `true` mientras que la sesión esté esperando que el peer remoto reconozca las nuevas configuraciones.

Las nuevas configuraciones no se harán efectivas hasta que el reconocimiento de `SETTINGS` sea recibido y el evento `'localSettings'` sea emitido. Es posible enviar múltiples frames `SETTINGS` mientras aún está pendiente el reconocimiento.

#### http2session.type
<!-- YAML
added: v8.4.0
-->

* {number}

El `http2session.type` será igual a `http2.constants.NGHTTP2_SESSION_SERVER` si esta instancia de `Http2Session` es un servidor, y `http2.constants.NGHTTP2_SESSION_CLIENT` si la instancia es un cliente.

#### http2session.unref()
<!-- YAML
added: v9.4.0
-->

Llama a [`unref()`][`net.Socket.prototype.unref()`] en esta [`net.Socket`] subyacente de la instancia de `Http2Session` .

### Clase: ServerHttp2Session
<!-- YAML
added: v8.4.0
-->

#### serverhttp2session.altsvc(alt, originOrStream)
<!-- YAML
added: v9.4.0
-->

* `alt` {string} Una descripción de la configuración del servicio alternativo como lo define [RFC 7838](https://tools.ietf.org/html/rfc7838).
* `originOrStream` {number|string|URL|Object} O una string de URL que especifica el origen (o un `Object` con una propiedad de `origin`) o el identificador numérico de un `Http2Stream` activo, como lo da la propiedad de `http2stream.id` .

Manda un frame `ALTSVC` (como lo define [RFC 7838](https://tools.ietf.org/html/rfc7838)) al cliente conectado.

```js
const http2 = require('http2');

const server = http2.createServer();
server.on('session', (session) => {
  // Set altsvc for origin https://example.org:80
  session.altsvc('h2=":8000"', 'https://example.org:80');
});

server.on('stream', (stream) => {
  // Set altsvc for a specific stream
  stream.session.altsvc('h2=":8000"', stream.id);
});
```

Enviar un frame de `ALTSVC` con una ID de stream específica indica que el servicio alternativo está asociado al origen del `Http2Stream` dado.

El `alt` y la string de origen *deben* contener solamente bytes ASCII, y se interpretan estrictamente como una secuencia de bytes ASCII. El valor especial `'clear'` puede ser pasado para borrar cualquier servicio alternativo establecido previamente para un dominio dado.

Cuando se pasa una string para el argumento de `originOrStream`, será analizado como una URL y el origen será derivado. Por ejemplo, el origen para la HTTP URL `'https://example.org/foo/bar'` es la string ASCII `'https://example.org'`. Ocurrirá un error si la string dada no se puede analizar como una URL o si no se puede derivar un origen válido.

Un objeto `URL`, o cualquier objeto con una propiedad `origin`, puede ser pasado como `originOrStream`, y en tal caso el valor de la propiedad `origin` será utilizada. El valor de la propiedad `origin` *debe* ser un origen ASCII serializado de manera apropiada.

#### Especificación de servicios alternativos

El formato del parámetro `alt` está estrictamente definido por [RFC 7838](https://tools.ietf.org/html/rfc7838) como una string ASCII que contiene una lista de protocolos "alternativos" delimitados por comas, asociados a un host y un puerto específico.

Por ejemplo, el valor `'h2="example.org:81"'` indica que el protocolo HTTP/2 está disponible en el host `'example.org'` en TCP/IP puerto 81. El host y el puerto *deben* estar contenidos dentro de los caracteres de (`"`) comillas.

Se pueden especificar múltiples alternativas, por ejemplo: `'h2="example.org:81",
h2=":82"'`.

El identificador de protocolo (`'h2'` en los ejemplos) puede ser cualquier [ALPN Protocol ID](https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml#alpn-protocol-ids) válido.

La sintaxis de estos valores no está validada por la implementación de Node.js, y se transmiten como proporcionadas por el usuario o recibidas desde el peer.

#### serverhttp2session.origin(...origins)
<!-- YAML
added: v10.12.0
-->

* `origins` { string | URL | Object } One or more URL Strings passed as separate arguments.

Submits an `ORIGIN` frame (as defined by [RFC 8336](https://tools.ietf.org/html/rfc8336)) to the connected client to advertise the set of origins for which the server is capable of providing authoritative responses.

```js
const http2 = require('http2');
const options = getSecureOptionsSomehow();
const server = http2.createSecureServer(options);
server.on('stream', (stream) => {
  stream.respond();
  stream.end('ok');
});
server.on('session', (session) => {
  session.origin('https://example.com', 'https://example.org');
});
```

When a string is passed as an `origin`, it will be parsed as a URL and the origin will be derived. For instance, the origin for the HTTP URL `'https://example.org/foo/bar'` is the ASCII string `'https://example.org'`. Ocurrirá un error si la string dada no se puede analizar como una URL o si no se puede derivar un origen válido.

A `URL` object, or any object with an `origin` property, may be passed as an `origin`, in which case the value of the `origin` property will be used. El valor de la propiedad `origin` *debe* ser un origen ASCII serializado de manera apropiada.

Alternatively, the `origins` option may be used when creating a new HTTP/2 server using the `http2.createSecureServer()` method:

```js
const http2 = require('http2');
const options = getSecureOptionsSomehow();
options.origins = ['https://example.com', 'https://example.org'];
const server = http2.createSecureServer(options);
server.on('stream', (stream) => {
  stream.respond();
  stream.end('ok');
});
```

### Clase: ClientHttp2Session
<!-- YAML
added: v8.4.0
-->

#### Evento: 'altsvc'
<!-- YAML
added: v9.4.0
-->

* `alt` {string}
* `origin` {string}
* `streamId` {number}

El evento de `'altsvc'` se emite cuando un frame de `ALTSVC` es recibido por el cliente. El evento es emitido con el valor de `ALTSVC`, origen, e identificación del stream. Si no se proporciona ningún `origin` en el frame de `ALTSVC`, `origin` será una string vacía.

```js
const http2 = require('http2');
const client = http2.connect('https://example.org');

client.on('altsvc', (alt, origin, streamId) => {
  console.log(alt);
  console.log(origin);
  console.log(streamId);
});
```

#### Event: 'origin'
<!-- YAML
added: v10.12.0
-->

* `origins` {string[]}

The `'origin'`  event is emitted whenever an `ORIGIN` frame is received by the client. The event is emitted with an array of `origin` strings. The `http2session.originSet` will be updated to include the received origins.

```js
const http2 = require('http2');
const client = http2.connect('https://example.org');

client.on('origin', (origins) => {
  for (let n = 0; n < origins.length; n++)
    console.log(origins[n]);
});
```

The `'origin'` event is only emitted when using a secure TLS connection.

#### clienthttp2session.request(headers[, options])
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `opciones` {Object}
  * `endStream` {boolean} `true` if the `Http2Stream` *writable* side should be closed initially, such as when sending a `GET` request that should not expect a payload body.
  * `exclusive` {boolean} Cuando `true` y `parent` identifica un Stream mayor, el stream creado se vuelve la única dependencia directa del Stream mayor, con todas las otras dependientes existentes vueltas dependientes del stream creado recientemente. **Predeterminado:** `false`.
  * `parent` {number} Especifica el identificador numérico de un stream del cual es dependiente el stream que se creó recientemente.
  * `weight` {number} Especifica la dependencia relativa de un stream en relación a otros streams con el mismo `parent`. El valor es un número entre `1` y `256` (inclusivo).
  * `waitForTrailers` {boolean} Cuando es `true`, el `Http2Stream` emitirá el evento `'wantTrailers'` luego de que el frame final de `DATA` haya sido enviado.

* Devuelve: {ClientHttp2Stream}

Solamente para instancias de `Http2Session` del Cliente de HTTP/2, la `http2session.request()` crea y devuelve una instancia de `Http2Stream` que puede ser utilizada para enviar una solicitud de HTTP/2 al servidor conectado.

Este método sólo está disponible si `http2session.type` es igual a `http2.constants.NGHTTP2_SESSION_CLIENT`.

```js
const http2 = require('http2');
const clientSession = http2.connect('https://localhost:1234');
const {
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS
} = http2.constants;

const req = clientSession.request({ [HTTP2_HEADER_PATH]: '/' });
req.on('response', (headers) => {
  console.log(headers[HTTP2_HEADER_STATUS]);
  req.on('data', (chunk) => { /* .. */ });
  req.on('end', () => { /* .. */ });
});
```

Cuando la opción `options.waitForTrailers` se establece, el evento `'wantTrailers'` se emitirá inmediatamente después de poner en cola la última parte de los datos de carga útil que serán enviados. The `http2stream.sendTrailers()` method can then be called to send trailing headers to the peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code must call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

The `:method` and `:path` pseudo-headers are not specified within `headers`, they respectively default to:

* `:method` = `'GET'`
* `:path` = `/`

### Clase: Http2Stream
<!-- YAML
added: v8.4.0
-->

* Extiende a: {stream.Duplex}

Cada instancia de la clase de `Http2Stream` representa un stream de comunicaciones bidireccionales de HTTP/2 sobre una instancia de `Http2Session` . Cualquier `Http2Session` individual puede tener hasta 2 instancias de <sup>31</sup>-1 `Http2Stream` sobre su tiempo de vida.

Código de usuario no construirá instancias de `Http2Stream` directamente. Más bien, estas son creadas, gestionadas, y proporcionadas a código de usuario a través de la instancia de `Http2Session` . En el servidor, las instancias `Http2Stream` son creadas en respuesta a una solicitud entrante de HTTP (y entregadas al código de usuario mediante el evento de `'stream'`), o en respuesta a una llamada al método `http2stream.pushStream()` . En el cliente, las instancias de `Http2Stream` se crean y se devuelven cuando el método de `http2session.request()` es llamado, o en respuesta a un evento de `'push'` entrante.

La clase `Http2Stream` es una base para las clases de [`ServerHttp2Stream`][] y [`ClientHttp2Stream`][], las cuales son utilizadas específicamente por el Servidor o el lado del Cliente, respectivamente.

Todas las instancias de `Http2Stream` son streams de [`Duplex`][]. El lado `Writable` del `Duplex` es utilizado para enviar datos al peer conectado, mientras que el lado `Readable` es utilizado para recibir datos enviados por el peer conectado.

#### Ciclo de vida de Http2Stream

##### Creación

En el lado del servidor, las instancias de [`ServerHttp2Stream`][] son creadas cuando:

* Se recibe un frame nuevo de HTTP/2 `HEADERS` con ID de un stream no utilizado previamente;
* El método `http2stream.pushStream()` es llamado.

En el lado del cliente, las instancias de [`ClientHttp2Stream`][] son creadas cuando el método de `http2session.request()` es llamado.

En el cliente, la instancia de `Http2Stream` devuelta por `http2session.request()` puede no estar lista para ser utilizada inmediatamente si el `Http2Session` mayor aún no ha sido establecido completamente. In such cases, operations called on the `Http2Stream` will be buffered until the `'ready'` event is emitted. El código de usuario raramente debería, y quizá nunca, tener necesidad de manejar el evento de `'ready'` de manera directa. El estado listo de un `Http2Stream` se puede determinar comprobando el valor de `http2stream.id`. Si el valor es `undefined`, el stream aún no está listo para utilizarse.

##### Destrucción

Todas las instancias de [`Http2Stream`][] se destruyen ya sea cuando:

* Un frame de `RST_STREAM` para el stream es recibido por el peer conectado.
* El método de `http2stream.close()` es llamado.
* Los métodos de `http2stream.destroy()` o `http2session.destroy()` son llamados.

Cuando se destruye una instancia `Http2Stream`, se hará un intento de enviar un frame `RST_STREAM` al peer conectado.

Cuando se destruye la instancia de `Http2Stream`, el evento de `'close'` será emitido. Ya que `Http2Stream` es una instancia de `stream.Duplex`, el evento de `'end'` también será emitido si los datos del stream fluyen actualmente. Puede que el evento de `'error'` también sea emitido si `http2stream.destroy()` fue llamado con un `Error` pasado como el primer argumento.

Después de que el `Http2Stream` haya sido destruido, la propiedad de `http2stream.destroyed` será `true` y la propiedad de `http2stream.rstCode` especificará el código de error de `RST_STREAM` . La instancia de `Http2Stream` ya no es utilizable una vez destruida.

#### Evento: 'aborted'
<!-- YAML
added: v8.4.0
-->

El evento `'aborted'` se emite cuando una instancia de `Http2Stream` se anula de manera anormal a la mitad de una comunicación.

El evento `'aborted'` sólo será emitido si el lado grabable de `Http2Stream` no ha sido finalizado.

#### Evento: 'close'
<!-- YAML
added: v8.4.0
-->

El evento de `'close'` se emite cuando se destruye el `Http2Stream` . Una vez que se emite este evento, la instancia de `Http2Stream` no es utilizable.

El código de error HTTP/2 que se utiliza al cerrar el stream se puede recuperar utilizando la propiedad de `http2stream.rstCode` . Si el código es un valor distinto a `NGHTTP2_NO_ERROR` (`0`), un evento de `'error'` también habrá sido emitido.

#### Evento: 'error'
<!-- YAML
added: v8.4.0
-->

* `error` {Error}

El evento de `'error'` se emite cuando ocurre un error durante el procesamiento de un `Http2Stream`.

#### Evento: 'frameError'
<!-- YAML
added: v8.4.0
-->

El evento de `'frameError'` se emite cuando ocurre un error al intentar enviar un frame. Cuando se invoca, la función de handler recibirá un argumento de un entero que identifique el tipo de frame, y un argumento de un entero que identifique el código de error. La instancia de `Http2Stream` se destruirá inmediatamente después de que se emita el evento de `'frameError'` .

#### Evento: 'timeout'
<!-- YAML
added: v8.4.0
-->

El evento de `'timeout'` se emite luego de que no se reciba ninguna actividad para este `Http2Stream` dentro del número de milisegundos establecidos utilizando `http2stream.setTimeout()`.

#### Evento: 'trailers'
<!-- YAML
added: v8.4.0
-->

The `'trailers'` event is emitted when a block of headers associated with trailing header fields is received. Al callback del listener se le pasa el [Objeto de Encabezados de HTTP/2](#http2_headers_object) y las banderas asociadas a los encabezados.

Note that this event might not be emitted if `http2stream.end()` is called before trailers are received and the incoming data is not being read or listened for.

```js
stream.on('trailers', (headers, flags) => {
  console.log(headers);
});
```

#### Evento: 'wantTrailers'
<!-- YAML
added: v10.0.0
-->

The `'wantTrailers'` event is emitted when the `Http2Stream` has queued the final `DATA` frame to be sent on a frame and the `Http2Stream` is ready to send trailing headers. Cuando se inicia una solicitud o respuesta, la opción de `waitForTrailers` debe ser establecida para que este evento sea emitido.

#### http2stream.aborted
<!-- YAML
added: v8.4.0
-->

* {boolean}

Se establece a `true` si la instancia de `Http2Stream` fue abortada de manera anormal. Cuando se establezca, el evento `'aborted'` habrá sido emitido.

#### http2stream.bufferSize
<!-- YAML
added: v10.16.0
-->
* {number}

This property shows the number of characters currently buffered to be written. See [`net.Socket.bufferSize`][] for details.

#### http2stream.close(code[, callback])
<!-- YAML
added: v8.4.0
-->

* `code` {number} Unsigned 32-bit integer identifying the error code. **Predeterminado:** `http2.constants.NGHTTP2_NO_ERROR` (`0x00`).
* `callback` {Function} Una función opcional registrada para escuchar para el evento de `'close'` .

Cierra la instancia de `Http2Stream` enviando un frame de `RST_STREAM` al peer conectado de HTTP/2.

#### http2stream.closed
<!-- YAML
added: v9.4.0
-->

* {boolean}

Establecida para `true` si la instancia `Http2Stream` ha sido cerrada.

#### http2stream.destroyed
<!-- YAML
added: v8.4.0
-->

* {boolean}

Establecida para `true` si la instancia de `Http2Stream` ha sido destruida y ya no es utilizable.

#### http2stream.endAfterHeaders
<!-- YAML
added: v10.11.0
-->

* {boolean}

Set the `true` if the `END_STREAM` flag was set in the request or response HEADERS frame received, indicating that no additional data should be received and the readable side of the `Http2Stream` will be closed.

#### http2stream.pending
<!-- YAML
added: v9.4.0
-->

* {boolean}

Se establece a `true` si aún no se le ha asignado a la instancia de `Http2Stream` un identificador de stream numérico.

#### http2stream.priority(options)
<!-- YAML
added: v8.4.0
-->

* `opciones` {Object}
  * `exclusive` {boolean} Cuando `true` y `parent` identifica un Stream mayor, el stream se vuelve la única dependencia directa del Stream mayor, con todas las otras dependientes existentes vueltas una dependiente de este stream. **Predeterminado:** `false`.
  * `parent` {number} Especifica el identificador numérico de un stream del cual es dependiente este stream.
  * `weight` {number} Especifica la dependencia relativa de un stream en relación a otros streams con el mismo `parent`. El valor es un número entre `1` y `256` (inclusivo).
  * `silent` {boolean} Cuando es `true`, cambia la prioridad de manera local sin enviar un frame de `PRIORITY` al peer conectado.

Actualiza la prioridad para esta instancia `Http2Stream` .

#### http2stream.rstCode
<!-- YAML
added: v8.4.0
-->

* {number}

Establece al `RST_STREAM` [error code](#error_codes) reportado cuando el `Http2Stream` se destruye ya sea después de recibir un frame `RST_STREAM` del peer conectado, al llamar `http2stream.close()`, ó `http2stream.destroy()`. Será `undefined` si el `Http2Stream` no ha sido cerrado.

#### http2stream.sentHeaders
<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object}

Un objeto que contiene las cabeceras salientes enviadas para este `Http2Stream`.

#### http2stream.sentInfoHeaders
<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object[]}

Un array de objetos que contienen las cabeceras salientes informativas (adicionales) enviadas para este `Http2Stream`.

#### http2stream.sentTrailers
<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object}

An object containing the outbound trailers sent for this `HttpStream`.

#### http2stream.session
<!-- YAML
added: v8.4.0
-->

* {Http2Session}

Una referencia a la instancia de `Http2Session` que posee este `Http2Stream`. El valor será `undefined` luego de que la instancia `Http2Stream` sea destruida.

#### http2stream.setTimeout(msecs, callback)
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}

```js
const http2 = require('http2');
const client = http2.connect('http://example.org:8000');
const { NGHTTP2_CANCEL } = http2.constants;
const req = client.request({ ':path': '/' });

// Cancel the stream if there's no activity after 5 seconds
req.setTimeout(5000, () => req.close(NGHTTP2_CANCEL));
```

#### http2stream.state
<!-- YAML
added: v8.4.0
-->
Proporciona información diversa sobre el estado actual del 

`Http2Stream`.

* {Object}
  * `localWindowSize` {number} El número de bytes que el peer conectado puede enviar a este `Http2Stream` sin recibir un `WINDOW_UPDATE`.
  * `state` {number} Una bandera que indica el estado actual de bajo nivel del `Http2Stream`, como lo determina `nghttp2`.
  * `localClose` {number} es `true` en caso de que este `Http2Stream` haya sido cerrado de manera local.
  * `remoteClose` {number} `true` si este `Http2Stream` ha sido cerrado de manera remota.
  * `sumDependencyWeight` {number} El peso total de todas las instancias `Http2Stream` que dependen de este `Http2Stream`, como se especifica utilizando frames `PRIORITY` .
  * `weight` {number} El peso de prioridad de esta `Http2Stream`.

Un estado actual de este `Http2Stream`.

#### http2stream.sendTrailers(headers)
<!-- YAML
added: v10.0.0
-->

* `headers` {HTTP/2 Headers Object}

Sends a trailing `HEADERS` frame to the connected HTTP/2 peer. Este método causará que el `Http2Stream` se cierre inmediatamente, y solo debe ser llamado luego de que el evento de `'wantTrailers'` haya sido emitido. Al enviar una solicitud o al enviar una respuesta, la opción `options.waitForTrailers` debe estar establecida para mantener abierto al `Http2Stream` después del frame `DATA` final, para que los trailers puedan ser enviados.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond(undefined, { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ xyz: 'abc' });
  });
  stream.end('Hello World');
});
```

The HTTP/1 specification forbids trailers from containing HTTP/2 pseudo-header fields (e.g. `':method'`, `':path'`, etc).

### Clase: ClientHttp2Stream
<!-- YAML
added: v8.4.0
-->

* Extiende a {Http2Stream}

La clase `ClientHttp2Stream` es una extensión de `Http2Stream` que se usa exclusivamente en clientes HTTP/2. Las instancias `Http2Stream` en el cliente proporcionan eventos tales como `'response'` y `'push'`, los cuales son relevantes solamente en el cliente.

#### Evento: 'continue'
<!-- YAML
added: v8.5.0
-->

Se emite cuando el servidor envía un estado de `100 Continue`, generalmente a causa de que la solicitud contenía `Expect: 100-continue`. Esta es una instrucción en la cual el cliente debería enviar el cuerpo de la solicitud.

#### Evento: 'headers'
<!-- YAML
added: v8.4.0
-->

El evento de `'headers'` se emite cuando se recibe un bloque adicional de encabezados para un stream, como cuando se recibe un bloque de encabezados informativos de `1xx` . Al callback del listener se le pasa el [Objecto de Encabezados de HTTP/2](#http2_headers_object) y las banderas asociadas a los encabezados.

```js
stream.on('headers', (headers, flags) => {
  console.log(headers);
});
```

#### Evento: 'push'
<!-- YAML
added: v8.4.0
-->

El evento de `'push'` se emite cuando se reciben los encabezados de respuesta para un stream de Server Push. Al callback del listener se le pasa el [Objecto de Encabezados de HTTP/2](#http2_headers_object) y las banderas asociadas a los encabezados.

```js
stream.on('push', (headers, flags) => {
  console.log(headers);
});
```

#### Evento: 'response'
<!-- YAML
added: v8.4.0
-->

El evento de `'response'` se emite cuando un frame de respuesta de `HEADERS` haya sido recibido para este stream desde el servidor conectado de HTTP/2. El listener se invoca con dos argumentos: un `Object` que contenga el [Objeto de Encabezados de HTTP/2](#http2_headers_object), y las banderas asociadas a los encabezados.

```js
const http2 = require('http2');
const client = http2.connect('https://localhost');
const req = client.request({ ':path': '/' });
req.on('response', (headers, flags) => {
  console.log(headers[':status']);
});
```

### Clase: ServerHttp2Stream
<!-- YAML
added: v8.4.0
-->

* Extiende a: {Http2Stream}

La clase `ServerHttp2Stream` es una extensión de [`Http2Stream`][] que se utiliza exclusivamente en Servidores HTTP/2. Las instancias de `Http2Stream` en el servidor proporcionan métodos adicionales tales como `http2stream.pushStream()` y `http2stream.respond()`, los cuales son relevantes solamente en el servidor.

#### http2stream.additionalHeaders(headers)
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}

Envía un frame adicional e informativo de `HEADERS` al peer conectado de HTTP/2.

#### http2stream.headersSent
<!-- YAML
added: v8.4.0
-->

* {boolean}

Verdadero si los encabezados fueron enviados, de lo contrario falso (sólo lectura).

#### http2stream.pushAllowed
<!-- YAML
added: v8.4.0
-->

* {boolean}

La propiedad de sólo-lectura mapeada a la bandera `SETTINGS_ENABLE_PUSH` del frame `SETTINGS` más reciente del cliente remoto. Will be `true` if the remote peer accepts push streams, `false` otherwise. Las configuraciones son las mismas para cada `Http2Stream` en el mismo `Http2Session`.

#### http2stream.pushStream(headers[, options], callback)
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `opciones` {Object}
  * `exclusive` {boolean} Cuando `true` y `parent` identifica un Stream mayor, el stream creado se vuelve la única dependencia directa del Stream mayor, con todas las otras dependientes existentes vueltas dependientes del stream creado recientemente. **Predeterminado:** `false`.
  * `parent` {number} Especifica el identificador numérico de un stream del cual es dependiente el stream que se creó recientemente.
* `callback` {Function} Callback that is called once the push stream has been initiated.
  * `err` {Error}
  * `pushStream` {ServerHttp2Stream} El objeto devuelto de `pushStream` .
  * `headers` {HTTP/2 Headers Object} El objeto de Encabezados con el cual se inició a `pushStream` .

Initiates a push stream. The callback is invoked with the new `Http2Stream` instance created for the push stream passed as the second argument, or an `Error` passed as the first argument.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 });
  stream.pushStream({ ':path': '/' }, (err, pushStream, headers) => {
    if (err) throw err;
    pushStream.respond({ ':status': 200 });
    pushStream.end('some pushed data');
  });
  stream.end('some data');
});
```

Setting the weight of a push stream is not allowed in the `HEADERS` frame. Pasa un valor de `weight` a `http2stream.priority` con la opción de `silent` establecida a `true` para habilitar el balance de ancho de banda del lado del servidor entre streams concurrentes.

Calling `http2stream.pushStream()` from within a pushed stream is not permitted and will throw an error.

#### http2stream.respond([headers[, options]])
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `opciones` {Object}
  * `endStream` {boolean} Establecido a `true` para indicar que la respuesta no incluirá datos de carga útil.
  * `waitForTrailers` {boolean} Cuando es `true`, el `Http2Stream` emitirá el evento `'wantTrailers'` luego de que el frame final de `DATA` haya sido enviado.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 });
  stream.end('some data');
});
```

Cuando la opción `options.waitForTrailers` se establece, el evento `'wantTrailers'` será emitido inmediatamente después de poner en cola la última parte de los datos de carga útil que serán enviados. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code must call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 }, { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ ABC: 'some value to send' });
  });
  stream.end('some data');
});
```

#### http2stream.respondWithFD(fd[, headers[, options]])
<!-- YAML
added: v8.4.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18936
    description: Any readable file descriptor, not necessarily for a
                 regular file, is supported now.
-->

* `fd` {number} Un descriptor de archivo legible.
* `headers` {HTTP/2 Headers Object}
* `opciones` {Object}
  * `statCheck` {Function}
  * `waitForTrailers` {boolean} Cuando es `true`, el `Http2Stream` emitirá el evento `'wantTrailers'` luego de que el frame final de `DATA` haya sido enviado.
  * `offset` {number} The offset position at which to begin reading.
  * `length` {number} La cantidad de datos de la fd a enviar.

Inicia una respuesta cuyos datos son leídos desde el descriptor de archivo dado. Ninguna validación se realiza en el descriptor de archivos dado. Si ocurre un error al intentar leer datos utilizando el descriptor de archivos, se cerrará el `Http2Stream` utilizando un frame de `RST_STREAM` utilizando el código estándar `INTERNAL_ERROR` .

Al ser utilizada, la interfaz de `Duplex` del objeto de `Http2Stream` se cerrará automáticamente.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createServer();
server.on('stream', (stream) => {
  const fd = fs.openSync('/some/file', 'r');

  const stat = fs.fstatSync(fd);
  const headers = {
    'content-length': stat.size,
    'last-modified': stat.mtime.toUTCString(),
    'content-type': 'text/plain'
  };
  stream.respondWithFD(fd, headers);
  stream.on('close', () => fs.closeSync(fd));
});
```

La función opcional `options.statCheck` puede ser especificada para dar al código de usuario una oportunidad para establecer cabeceras de contenido adicionales basadas en los detalles `fs.Stat` del fd dado. Si se proporciona la función de `statCheck`, el método de `http2stream.respondWithFD()` realizará una llamada `fs.fstat()` para recopilar detalles sobre el descriptor de archivos proporcionado.

Las opciones `offset` y `length` pueden ser utilizadas para limitar la respuesta a un subconjunto de rangos específicos. Por ejemplo, esto puede ser utilizado para brindar soporte a las solicitudes de HTTP Range.

El descriptor de archivos no se cierra cuando se cierra el stream, entonces necesitará cerrarse manualmente una vez que ya no se necesite. Tenga en cuenta que utilizar el mismo descriptor de archivo de manera concurrente para múltiples streams no es soportado y puede resultar en pérdida de datos. Reutilizar un descriptor de archivo luego de que un stream ha finalizado es soportado.

Cuando la opción `options.waitForTrailers` se establece, el evento `'wantTrailers'` será emitido inmediatamente después de poner en cola la última parte de los datos de carga útil que serán enviados. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code *must* call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

```js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createServer();
server.on('stream', (stream) => {
  const fd = fs.openSync('/some/file', 'r');

  const stat = fs.fstatSync(fd);
  const headers = {
    'content-length': stat.size,
    'last-modified': stat.mtime.toUTCString(),
    'content-type': 'text/plain'
  };
  stream.respondWithFD(fd, headers, { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ ABC: 'some value to send' });
  });

  stream.on('close', () => fs.closeSync(fd));
});
```

#### http2stream.respondWithFile(path[, headers[, options]])
<!-- YAML
added: v8.4.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18936
    description: Any readable file, not necessarily a
                 regular file, is supported now.
-->

* `path`{string|Buffer|URL}
* `headers` {HTTP/2 Headers Object}
* `opciones` {Object}
  * `statCheck` {Function}
  * `onError` {Function} Función de callback invocada en caso de que ocurra un error antes de un envío.
  * `waitForTrailers` {boolean} Cuando es `true`, el `Http2Stream` emitirá el evento `'wantTrailers'` luego de que el frame final de `DATA` haya sido enviado.
  * `offset` {number} The offset position at which to begin reading.
  * `length` {number} La cantidad de datos de la fd a enviar.

Envía un archivo normal como respuesta. El `path` debe especificar a un archivo normal o se emitirá un evento `'error'` en el objeto `Http2Stream` .

Al ser utilizada, la interfaz de `Duplex` del objeto de `Http2Stream` se cerrará automáticamente.

La función opcional `options.statCheck` puede ser especificada para dar al código de usuario una oportunidad para establecer cabeceras de contenido adicionales basadas en los detalles `fs.Stat` del archivo dado:

Si ocurre un error al intentar leer los datos del archivo, el `Http2Stream` se cerrará utilizando un frame de `RST_STREAM`, utilizando el código estándar `INTERNAL_ERROR` . Si se define el callback de `onError`, entonces será llamado. De lo contrario el stream sera destruido.

Ejemplo utilizando una ruta de archivo:

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  function statCheck(stat, headers) {
    headers['last-modified'] = stat.mtime.toUTCString();
  }

  function onError(err) {
    if (err.code === 'ENOENT') {
      stream.respond({ ':status': 404 });
    } else {
      stream.respond({ ':status': 500 });
    }
    stream.end();
  }

  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { statCheck, onError });
});
```

La función `options.statCheck` también puede ser utilizada para cancelar la operación de envío devolviendo `false`. Por ejemplo, una solicitud condicional puede verificar los resultados de estadística para determinar si el archivo ha sido modificado para devolver una respuesta `304` apropiada:

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  function statCheck(stat, headers) {
    // Check the stat here...
    stream.respond({ ':status': 304 });
    return false; // Cancel the send operation
  }
  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { statCheck });
});
```

El campo de encabezado `content-length` se establecerá automáticamente.

Las opciones `offset` y `length` pueden ser utilizadas para limitar la respuesta a un subconjunto de rangos específicos. Por ejemplo, esto puede ser utilizado para brindar soporte a las solicitudes de HTTP Range.

La función `options.onError` también puede ser utilizada para manejar todos los errores que podrían ocurrir antes de que se inicie la entrega del archivo. El comportamiento predeterminado es destruir el stream.

Cuando la opción `options.waitForTrailers` se establece, el evento `'wantTrailers'` será emitido inmediatamente después de poner en cola la última parte de los datos de carga útil que serán enviados. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

When `options.waitForTrailers` is set, the `Http2Stream` will not automatically close when the final `DATA` frame is transmitted. User code must call either `http2stream.sendTrailers()` or `http2stream.close()` to close the `Http2Stream`.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respondWithFile('/some/file',
                         { 'content-type': 'text/plain' },
                         { waitForTrailers: true });
  stream.on('wantTrailers', () => {
    stream.sendTrailers({ ABC: 'some value to send' });
  });
});
```

### Clase: Http2Server
<!-- YAML
added: v8.4.0
-->

* Extiende a: {net.Server}

Instances of `Http2Server` are created using the `http2.createServer()` function. The `Http2Server` class is not exported directly by the `http2` module.

#### Evento: 'checkContinue'
<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Si se registra un listener [`'request'`][] o se suministra una función de callback a [`http2.createServer()`][], el evento de `'checkContinue'` se emitirá cada vez que una solicitud con un HTTP `Expect: 100-continue` sea recibida. Si este evento no se escucha, el servidor automáticamente responderá con un estado `100 Continue` según corresponda.

Manejar este evento implica llamar a [`response.writeContinue()`][] si el cliente debería continuar a enviar el cuerpo de la solicitud, o generar una respuesta apropiada de HTTP (por ejemplo, 400 Bad Request) si el cliente no debería continuar a enviar el cuerpo de la solicitud.

Tener en cuenta que cuando este evento es emitido y manejado, el evento [`'request'`][] no será emitido.

#### Evento: 'request'
<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Se emite cada vez que hay una solicitud. Tenga en cuenta que pueden haber múltiples solicitudes por sesión. Vea la [Compatibility API](#http2_compatibility_api).

#### Evento: 'session'
<!-- YAML
added: v8.4.0
-->

El evento `'session'` se emite cuando una `Http2Session` nueva es creada por el `Http2Server` .

#### Evento: 'sessionError'
<!-- YAML
added: v8.4.0
-->

El evento de `'sessionError'` se emite cuando un evento de `'error'` es emitido por un objeto de `Http2Session` asociado con el `Http2Server`.

#### Evento: 'stream'
<!-- YAML
added: v8.4.0
-->

El evento `'stream'` se emite cuando un evento `'stream'` ha sido emitido por una `Http2Session` asociada al servidor.

```js
const http2 = require('http2');
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;

const server = http2.createServer();
server.on('stream', (stream, headers, flags) => {
  const method = headers[HTTP2_HEADER_METHOD];
  const path = headers[HTTP2_HEADER_PATH];
  // ...
  stream.respond({
    [HTTP2_HEADER_STATUS]: 200,
    [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain'
  });
  stream.write('hello ');
  stream.end('world');
});
```

#### Evento: 'timeout'
<!-- YAML
added: v8.4.0
-->

El evento `'timeout'` se emite cuando no hay actividad en el Servidor por un número dado de milisegundos establecidos, utilizando `http2server.setTimeout()` . **Default:** 2 minutes.

#### server.close([callback])
<!-- YAML
added: v8.4.0
-->
* `callback` {Function}

Detiene al servidor de aceptar nuevas conexiones.  Vea [`net.Server.close()`][].

Note that this is not analogous to restricting new requests since HTTP/2 connections are persistent. To achieve a similar graceful shutdown behavior, consider also using [`http2session.close()`] on active sessions.

#### server.setTimeout(\[msecs\]\[, callback\])
<!-- YAML
added: v8.4.0
-->

* `msecs` {number} **Predeterminado:** `120000` (2 minutos)
* `callback` {Function}
* Devuelve: {Http2Server}

Used to set the timeout value for http2 server requests, and sets a callback function that is called when there is no activity on the `Http2Server` after `msecs` milliseconds.

The given callback is registered as a listener on the `'timeout'` event.

In case of no callback function were assigned, a new `ERR_INVALID_CALLBACK` error will be thrown.

### Clase: Http2SecureServer
<!-- YAML
added: v8.4.0
-->

* Extiende a: {tls.Server}

Instances of `Http2SecureServer` are created using the `http2.createSecureServer()` function. The `Http2SecureServer` class is not exported directly by the `http2` module.

#### Evento: 'checkContinue'
<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Si se registra un listener [`'request'`][] o se suministra una función de callback a [`http2.createSecureServer()`][], el evento de `'checkContinue'` se emitirá cada vez que una solicitud con un HTTP `Expect: 100-continue` sea recibida. Si este evento no se escucha, el servidor automáticamente responderá con un estado `100 Continue` según corresponda.

Manejar este evento implica llamar a [`response.writeContinue()`][] si el cliente debería continuar a enviar el cuerpo de la solicitud, o generar una respuesta apropiada de HTTP (por ejemplo, 400 Bad Request) si el cliente no debería continuar a enviar el cuerpo de la solicitud.

Tener en cuenta que cuando este evento es emitido y manejado, el evento [`'request'`][] no será emitido.

#### Evento: 'request'
<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Se emite cada vez que hay una solicitud. Tenga en cuenta que pueden haber múltiples solicitudes por sesión. Vea la [Compatibility API](#http2_compatibility_api).

#### Evento: 'session'
<!-- YAML
added: v8.4.0
-->

El evento de `'session'` se emite cuando `Http2SecureServer` crea un nuevo `Http2Session` .

#### Evento: 'sessionError'
<!-- YAML
added: v8.4.0
-->

El evento `'sessionError'` se emite cuando un evento `'error'` es emitido por un objeto `Http2Session` asociado al `Http2SecureServer` .

#### Evento: 'stream'
<!-- YAML
added: v8.4.0
-->

El evento `'stream'` se emite cuando un evento `'stream'` ha sido emitido por una `Http2Session` asociada al servidor.

```js
const http2 = require('http2');
const {
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_CONTENT_TYPE
} = http2.constants;

const options = getOptionsSomehow();

const server = http2.createSecureServer(options);
server.on('stream', (stream, headers, flags) => {
  const method = headers[HTTP2_HEADER_METHOD];
  const path = headers[HTTP2_HEADER_PATH];
  // ...
  stream.respond({
    [HTTP2_HEADER_STATUS]: 200,
    [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain'
  });
  stream.write('hello ');
  stream.end('world');
});
```

#### Evento: 'timeout'
<!-- YAML
added: v8.4.0
-->

El evento `'timeout'` se emite cuando no hay actividad en el Servidor por un número dado de milisegundos establecidos, utilizando `http2secureServer.setTimeout()` . **Default:** 2 minutes.

#### Evento: 'unknownProtocol'
<!-- YAML
added: v8.4.0
-->

El evento `'unknownProtocol'` se emite cuando un cliente de conexión falla en negociar un protocolo permitido (por ejemplo, HTTP/2 o HTTP/1.1). El handler del evento recibe el socket para el manejo. Si no se registra ningún listener para este evento, la conexión será terminada. Vea la [Compatibility API](#http2_compatibility_api).

#### server.close([callback])
<!-- YAML
added: v8.4.0
-->
* `callback` {Function}

Detiene al servidor de aceptar nuevas conexiones.  Vea [`tls.Server.close()`][].

Note that this is not analogous to restricting new requests since HTTP/2 connections are persistent. To achieve a similar graceful shutdown behavior, consider also using [`http2session.close()`] on active sessions.

#### server.setTimeout(\[msecs\]\[, callback\])
<!-- YAML
added: v8.4.0
-->

* `msecs` {number} **Predeterminado:** `120000` (2 minutos)
* `callback` {Function}
* Devuelve: {Http2SecureServer}

Used to set the timeout value for http2 secure server requests, and sets a callback function that is called when there is no activity on the `Http2SecureServer` after `msecs` milliseconds.

The given callback is registered as a listener on the `'timeout'` event.

In case of no callback function were assigned, a new `ERR_INVALID_CALLBACK` error will be thrown.

### http2.createServer(options[, onRequestHandler])<!-- YAML
added: v8.4.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17105
    description: Added the `maxOutstandingPings` option with a default limit of
                 10. 
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: Added the `maxHeaderListPairs` option with a default limit of
                 128 header pairs.
  - version: v9.6.0
    pr-url: https://github.com/nodejs/node/pull/15752
    description: Added the `Http1IncomingMessage` and `Http1ServerResponse`
                 option.
-->* `opciones` {Object}
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Predeterminado:** `4Kib`.
  * `maxSessionMemory`{number} Establece el máximo de memoria que se le permite utilizar a `Http2Session` . El valor se expresa en términos de número de megabytes, por ejemplo, `1` es igual a 1 megabyte. El valor mínimo permitido es `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. El número actual de sesiones de `Http2Stream`, el uso de memoria actual de los tableros de compresión de encabezados, datos actuales puestos en cola para ser enviados, y los frames no reconocidos de `PING` y `SETTINGS` se cuentan hacia el límite actual. **Predeterminado:** `10`.
  * `maxHeaderListPairs` {number} Establece el número máximo de entradas de encabezado. El valor mínimo es `4`. **Predeterminado:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Predeterminado:** `10`.
  * `maxSendHeaderBlockLength` {number} Establece el tamaño máximo permitido para un bloque comprimido y serializado de encabezados. Intenta enviar encabezados que excedan este límite, tendrá como resultado la emisión de un evento `'frameError'` y el cierre y la destrucción de un stream.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. El valor puede ser uno de los siguientes:
     * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
     * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
     * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
     * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Establece el número máximo de streams concurrentes para el peer remoto, como si un frame de `SETTINGS` hubiese sido recibido. Se anulará si el peer remoto establece su propio valor para `maxConcurrentStreams`. **Predeterminado:** `100`.
  * `selectPadding` {Function} Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, proporciona la función de callback utilizada para determinar el relleno. Vea [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} Las configuraciones iniciales para enviar al peer remoto al conectarse.
  * `Http1IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to used for HTTP/1 fallback. Útil para extender el `http.IncomingMessage` original. **Default:** `http.IncomingMessage`.
  * `Http1ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to used for HTTP/1 fallback. Útil para extender el `http.ServerResponse` original. **Default:** `http.ServerResponse`.
  * `Http2ServerRequest` {http2.Http2ServerRequest} Especifica la clase `Http2ServerRequest` a usar. Útil para extender el `Http2ServerRequest` original. **Default:** `Http2ServerRequest`.
  * `Http2ServerResponse` {http2.Http2ServerResponse} Especifica la clase `Http2ServerResponse` a usar. Útil para extender el `Http2ServerResponse` original. **Predeterminado:** `Http2ServerResponse`.
* `onRequestHandler` {Function} Vea [API de Compatibilidad](#http2_compatibility_api)
* Devuelve: {Http2Server}

Devuelve una instancia de `net.Server` que crea y gestiona instancias de `Http2Session` .

Dado que no hay navegadores conocidos que soporten [unencrypted HTTP/2](https://http2.github.io/faq/#does-http2-require-encryption), el uso de [`http2.createSecureServer()`][] es necesario al comunicarse con los clientes del navegador.

```js
const http2 = require('http2');

// Create an unencrypted HTTP/2 server.
// Since there are no browsers known that support
// unencrypted HTTP/2, the use of `http2.createSecureServer()`
// is necessary when communicating with browser clients.
const server = http2.createServer();

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

### http2.createSecureServer(options[, onRequestHandler])<!-- YAML
added: v8.4.0
changes:
  - version: v10.12.0
    pr-url: https://github.com/nodejs/node/pull/22956
    description: Added the `origins` option to automatically send an `ORIGIN`
                 frame on `Http2Session` startup.
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17105
    description: Added the `maxOutstandingPings` option with a default limit of
                 10. 
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: Added the `maxHeaderListPairs` option with a default limit of
                 128 header pairs.
-->* `opciones` {Object}
  * `allowHTTP1` {boolean} Las conexiones de cliente entrantes que no brinden soporte a HTTP/2 serán degradadas a HTTP/1.x cuando se establezcan a `true`. Vea el evento [`'unknownProtocol'`][] . Vea [ALPN negotiation](#http2_alpn_negotiation). **Predeterminado:** `false`.
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Predeterminado:** `4Kib`.
  * `maxSessionMemory`{number} Establece el máximo de memoria que se le permite utilizar a `Http2Session` . El valor se expresa en términos de número de megabytes, por ejemplo, `1` es igual a 1 megabyte. El valor mínimo permitido es `1`. Este es un límite basado en el crédito, los `Http2Stream`s existentes pueden causar que este límite sea excedido, pero las nuevas instancias `Http2Stream` serán rechazadas mientras este límite sea excedido. El número actual de sesiones de `Http2Stream`, el uso de memoria actual de los tableros de compresión de encabezados, datos actuales puestos en cola para ser enviados, y los frames no reconocidos de `PING` y `SETTINGS` se cuentan hacia el límite actual. **Predeterminado:** `10`.
  * `maxHeaderListPairs` {number} Establece el número máximo de entradas de encabezado. El valor mínimo es `4`. **Predeterminado:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Predeterminado:** `10`.
  * `maxSendHeaderBlockLength` {number} Establece el tamaño máximo permitido para un bloque comprimido y serializado de encabezados. Intenta enviar encabezados que excedan este límite, tendrá como resultado la emisión de un evento `'frameError'` y el cierre y la destrucción de un stream.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. El valor puede ser uno de los siguientes:
     * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
     * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
     * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
     * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Establece el número máximo de streams concurrentes para el peer remoto, como si un frame de `SETTINGS` hubiese sido recibido. Se anulará si el peer remoto establece su propio valor para `maxConcurrentStreams`. **Predeterminado:** `100`.
  * `selectPadding` {Function} Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, proporciona la función de callback utilizada para determinar el relleno. Vea [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} Las configuraciones iniciales para enviar al peer remoto al conectarse.
  * ...: Cualquiera de las opciones de [`tls.createServer()`][] pueden ser proporcionadas. Para los servidores, usualmente se requieren las opciones de identidad (`pfx` ó `key`/`cert`).
  * `origins` {string[]} An array of origin strings to send within an `ORIGIN` frame immediately following creation of a new server `Http2Session`.
* `onRequestHandler` {Function} Vea [API de Compatibilidad](#http2_compatibility_api)
* Devuelve: {Http2SecureServer}

Devuelve una instancia de `tls.Server` que crea y gestiona instancias de `Http2Session` .

```js
const http2 = require('http2');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
};

// Create a secure HTTP/2 server
const server = http2.createSecureServer(options);

server.on('stream', (stream, headers) => {
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

### http2.connect(authority\[, options\]\[, listener\])<!-- YAML
added: v8.4.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17105
    description: Added the `maxOutstandingPings` option with a default limit of
                 10. 
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: Added the `maxHeaderListPairs` option with a default limit of
                 128 header pairs.
-->* `authority` {string|URL}
* `opciones` {Object}
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Predeterminado:** `4Kib`.
  * `maxSessionMemory`{number} Establece el máximo de memoria que se le permite utilizar a `Http2Session` . El valor se expresa en términos de número de megabytes, por ejemplo, `1` es igual a 1 megabyte. El valor mínimo permitido es `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. El número actual de sesiones de `Http2Stream`, el uso de memoria actual de los tableros de compresión de encabezados, datos actuales puestos en cola para ser enviados, y los frames no reconocidos de `PING` y `SETTINGS` se cuentan hacia el límite actual. **Predeterminado:** `10`.
  * `maxHeaderListPairs` {number} Establece el número máximo de entradas de encabezado. El valor mínimo es `1`. **Predeterminado:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Predeterminado:** `10`.
  * `maxReservedRemoteStreams` {number} Sets the maximum number of reserved push streams the client will accept at any given time. Once the current number of currently reserved push streams exceeds reaches this limit, new push streams sent by the server will be automatically rejected.
  * `maxSendHeaderBlockLength` {number} Establece el tamaño máximo permitido para un bloque comprimido y serializado de encabezados. Intenta enviar encabezados que excedan este límite, tendrá como resultado la emisión de un evento `'frameError'` y el cierre y la destrucción de un stream.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. El valor puede ser uno de los siguientes:
     * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
     * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
     * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
     * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Establece el número máximo de streams concurrentes para el peer remoto, como si un frame de `SETTINGS` hubiese sido recibido. Se anulará si el peer remoto establece su propio valor para `maxConcurrentStreams`. **Predeterminado:** `100`.
  * `selectPadding` {Function} Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, proporciona la función de callback utilizada para determinar el relleno. Vea [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} Las configuraciones iniciales para enviar al peer remoto al conectarse.
  * `createConnection` {Function} Un callback opcional que recibe la instancia de `URL` pasada a `connect` y el objeto de `options`, y devuelve cualquier stream de [`Duplex`][] que deberá ser utilizado como la conexión para esta sesión.
  * ...: Cualquiera de las opciones de [`net.connect()`][] o [`tls.connect()`][] pueden ser proporcionadas.
* `listener` {Function}
* Devuelve: {ClientHttp2Session}

Devuelve una instancia `ClientHttp2Session` .

```js
const http2 = require('http2');
const client = http2.connect('https://localhost:1234');

/* Use the client */

client.close();
```

### http2.constants
<!-- YAML
added: v8.4.0
-->

#### Códigos de Error para RST_STREAM y GOAWAY

<a id="error_codes"></a>

| Valor  | Nombre                    | Constante                                     |
| ------ | ------------------------- | --------------------------------------------- |
| `0x00` | Sin errores               | `http2.constants.NGHTTP2_NO_ERROR`            |
| `0x01` | Error de Protocolo        | `http2.constants.NGHTTP2_PROTOCOL_ERROR`      |
| `0x02` | Error Interno             | `http2.constants.NGHTTP2_INTERNAL_ERROR`      |
| `0x03` | Error de Control de Flujo | `http2.constants.NGHTTP2_FLOW_CONTROL_ERROR`  |
| `0x04` | Settings Timeout          | `http2.constants.NGHTTP2_SETTINGS_TIMEOUT`    |
| `0x05` | Stream Cerrado            | `http2.constants.NGHTTP2_STREAM_CLOSED`       |
| `0x06` | Error de Tamaño de Frame  | `http2.constants.NGHTTP2_FRAME_SIZE_ERROR`    |
| `0x07` | Stream Negado             | `http2.constants.NGHTTP2_REFUSED_STREAM`      |
| `0x08` | Cancelar                  | `http2.constants.NGHTTP2_CANCEL`              |
| `0x09` | Error de Compresión       | `http2.constants.NGHTTP2_COMPRESSION_ERROR`   |
| `0x0a` | Error de Conexión         | `http2.constants.NGHTTP2_CONNECT_ERROR`       |
| `0x0b` | Enhance Your Calm         | `http2.constants.NGHTTP2_ENHANCE_YOUR_CALM`   |
| `0x0c` | Seguridad Inadecuada      | `http2.constants.NGHTTP2_INADEQUATE_SECURITY` |
| `0x0d` | HTTP/1.1 Requerido        | `http2.constants.NGHTTP2_HTTP_1_1_REQUIRED`   |

El evento `'timeout'` se emite cuando no hay actividad en el Servidor por un número dado de milisegundos establecidos, utilizando `http2server.setTimeout()` .

### http2.getDefaultSettings()
<!-- YAML
added: v8.4.0
-->

* Devuelve: {HTTP/2 Settings Object}

Devuelve a un objeto que contiene las configuraciones predeterminadas para una instancia de `Http2Session` . Este método devuelve una nueva instancia de objeto cada vez que se llama, para que las instancias devueltas puedan ser modificadas de forma segura para su uso.

### http2.getPackedSettings(settings)
<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object}
* Devuelve: {Buffer}

Devuelve una instancia de `Buffer` que contiene representación serializada de las configuraciones de HTTP/2 dadas, como se especifica en la especificación de [HTTP/2](https://tools.ietf.org/html/rfc7540) . Esto está destinado para ser utilizado con el campo de encabezado `HTTP2-Settings` .

```js
const http2 = require('http2');

const packed = http2.getPackedSettings({ enablePush: false });

console.log(packed.toString('base64'));
// Prints: AAIAAAAA
```

### http2.getUnpackedSettings(buf)
<!-- YAML
added: v8.4.0
-->

* `buf` {Buffer|Uint8Array} Las configuraciones empaquetadas.
* Devuelve: {HTTP/2 Settings Object}

Returns a [HTTP/2 Settings Object](#http2_settings_object) containing the deserialized settings from the given `Buffer` as generated by `http2.getPackedSettings()`.

### Objeto de Encabezados

Los encabezados están representados como propiedades propias sobre los objetos de JavaScript. Las claves de propiedad serán serializadas a minúsculas. Property values should be strings (if they are not they will be coerced to strings) or an `Array` of strings (in order to send more than one value per header field).

```js
const headers = {
  ':status': '200',
  'content-type': 'text-plain',
  'ABC': ['has', 'more', 'than', 'one', 'value']
};

stream.respond(headers);
```

Los objetos de encabezado pasados a funciones de callback tendrán un prototipo `null` . Esto significa que los métodos normales de objetos de Javascript tales como `Object.prototype.toString()` y `Object.prototype.hasOwnProperty()` no funcionarán.

For incoming headers:
* The `:status` header is converted to `number`.
* Duplicates of `:status`, `:method`, `:authority`, `:scheme`, `:path`, `:protocol`, `age`, `authorization`, `access-control-allow-credentials`, `access-control-max-age`, `access-control-request-method`, `content-encoding`, `content-language`, `content-length`, `content-location`, `content-md5`, `content-range`, `content-type`, `date`, `dnt`, `etag`, `expires`, `from`, `if-match`, `if-modified-since`, `if-none-match`, `if-range`, `if-unmodified-since`, `last-modified`, `location`, `max-forwards`, `proxy-authorization`, `range`, `referer`,`retry-after`, `tk`, `upgrade-insecure-requests`, `user-agent` or `x-content-type-options` are discarded.
* `set-cookie` siempre es una matriz. Los duplicados se añaden a la matriz.
* For duplicate `cookie` headers, the values are joined together with '; '.
* Para todos los otros encabezados, los valores se unen con ', '.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream, headers) => {
  console.log(headers[':path']);
  console.log(headers.ABC);
});
```

### Objeto de Configuraciones
<!-- YAML
added: v8.4.0
changes:
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/16676
    description: The `maxHeaderListSize` setting is now strictly enforced.
-->
The 

`http2.getDefaultSettings()`, `http2.getPackedSettings()`, `http2.createServer()`, `http2.createSecureServer()`, `http2session.settings()`, `http2session.localSettings`, and `http2session.remoteSettings` APIs either return or receive as input an object that defines configuration settings for an `Http2Session` object. Estos objetos son objetos ordinarios de JavaScript que contienen las siguientes propiedades.

* `headerTableSize` {number} Especifica el número máximo de bytes utilizados para la compresión de encabezado. El valor mínimo permitido es 0. El valor máximo permitido es 2<sup>32</sup>-1. **Default:** `4,096 octets`.
* `enablePush` {boolean} Specifies `true` if HTTP/2 Push Streams are to be permitted on the `Http2Session` instances.
* `initialWindowSize` {number} Specifies the *senders* initial window size for stream-level flow control. El valor mínimo permitido es 0. El valor máximo permitido es 2<sup>32</sup>-1. **Default:** `65,535 bytes`.
* `maxFrameSize` {number} Especifica el tamaño de la carga útil del frame más grande. El valor mínimo permitido es 16,384. El valor máximo permitido es 2<sup>24</sup>-1. **Default:** `16,384 bytes`.
* `maxConcurrentStreams` {number} Especifica el número máximo de streams concurrentes permitidos en una `Http2Session`. No hay valor predeterminado que implique, al menos teóricamente, que los streams de 2<sup>31</sup>-1 pueden abrirse de manera concurrente en cualquier tiempo dado en una `Http2Session`. El valor mínimo es 0. El valor máximo permitido es 2<sup>31</sup>-1.
* `maxHeaderListSize` {number} Specifies the maximum size (uncompressed octets) of header list that will be accepted. El valor mínimo permitido es 0. El valor máximo permitido es 2<sup>32</sup>-1. **Default:** `65535`.
* `enableConnectProtocol`{boolean} Specifies `true` if the "Extended Connect Protocol" defined by [RFC 8441](https://tools.ietf.org/html/rfc8441) is to be enabled. This setting is only meaningful if sent by the server. Once the `enableConnectProtocol` setting has been enabled for a given `Http2Session`, it cannot be disabled.

Se ignoran todas las propiedades adicionales del objeto de las configuraciones.

### Utilizar `options.selectPadding()`

Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, la implementación de HTTP/2 consultará la función de callback de `options.selectPadding()`, si es proporcionada, para determinar la cantidad específica de relleno a usar por `HEADERS` y frame de `DATA` .

La función de `options.selectPadding()` recibe dos argumentos numéricos, `frameLen` y `maxFrameLen` y debe devolver un número `N` de modo que `frameLen <= N <= maxFrameLen`.

```js
const http2 = require('http2');
const server = http2.createServer({
  paddingStrategy: http2.constants.PADDING_STRATEGY_CALLBACK,
  selectPadding(frameLen, maxFrameLen) {
    return maxFrameLen;
  }
});
```

The `options.selectPadding()` function is invoked once for *every* `HEADERS` and `DATA` frame. Esto tiene un definido impacto notable sobre el rendimiento.

### Manejo de Errores

Hay varios tipos de condiciones de error que pueden surgir al utilizar el módulo de `http2` :

Los errores de validación ocurren cuando un argumento incorrecto, opción, o valor de configuración es pasado. Estos siempre serán reportados por un `throw` sincrónico.

Los errores de estado ocurren cuando se intenta una acción en un tiempo incorrecto (por ejemplo, intentar enviar datos en un stream luego de que ha cerrado). Estos serán reportados utilizando un `throw` sincrónico o por medio de un evento de `'error'` en el `Http2Stream`, `Http2Session` o en los objetos del Servidor de HTTP/2, dependiendo de dónde y cuándo ocurran los errores.

Los errores internos ocurren cuando una sesión HTTP/2 falla inesperadamente. Estos serán reportados por medio de un evento de `'error'` en el `Http2Session` u objetos del servidor de HTTP/2.

Se producen errores de protocolo cuando se violan varias restricciones del protocolo de HTTP/2. Estos serán reportados utilizando un `throw` sincrónico o por medio de un evento de `'error'` en el `Http2Stream`, `Http2Session` o en los objetos del Servidor de HTTP/2, dependiendo de dónde y cuándo ocurran los errores.

### Manejo inválido de caracteres en nombres de cabecera y valores

La implementación de HTTP/2 aplica un manejo más estricto de caracteres inválidos en nombres de cabecera de HTTP y valores que la implementación de HTTP/1.

Header field names are *case-insensitive* and are transmitted over the wire strictly as lower-case strings. La API proporcionada por Node.js permite que los nombres de los encabezados sean establecidos como strings con mayúsculas y minúsculas (por ejemplo, `Content-Type`) pero los convertirá a minúsculas (por ejemplo, `content-type`) al ser transmitidos.

Header field-names *must only* contain one or more of the following ASCII characters: `a`-`z`, `A`-`Z`, `0`-`9`, `!`, `#`, `$`, `%`, `&`, `'`, `*`, `+`, `-`, `.`, `^`, `_`, `` ` `` (backtick), `|`, and `~`.

Utilizar caracteres inválidos dentro de un nombre de campo de cabecera de HTTP causará el cierre del stream y el reporte de un error de protocolo.

Header field values are handled with more leniency but *should* not contain new-line or carriage return characters and *should* be limited to US-ASCII characters, per the requirements of the HTTP specification.

### Push streams on the client

To receive pushed streams on the client, set a listener for the `'stream'` event on the `ClientHttp2Session`:

```js
const http2 = require('http2');

const client = http2.connect('http://localhost');

client.on('stream', (pushedStream, requestHeaders) => {
  pushedStream.on('push', (responseHeaders) => {
    // process response headers
  });
  pushedStream.on('data', (chunk) => { /* handle pushed data */ });
});

const req = client.request({ ':path': '/' });
```

### Proporcionar soporte al método CONNECT

El método `CONNECT` se utiliza para permitir que un servidor HTTP/2 sea utilizado como un proxy para conexiones TCP/IP.

Un servidor simple de TCP:
```js
const net = require('net');

const server = net.createServer((socket) => {
  let name = '';
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => name += chunk);
  socket.on('end', () => socket.end(`hello ${name}`));
});

server.listen(8000);
```

Un proxy HTTP/2 CONNECT:

```js
const http2 = require('http2');
const { NGHTTP2_REFUSED_STREAM } = http2.constants;
const net = require('net');

const proxy = http2.createServer();
proxy.on('stream', (stream, headers) => {
  if (headers[':method'] !== 'CONNECT') {
    // Only accept CONNECT requests
    stream.close(NGHTTP2_REFUSED_STREAM);
    return;
  }
  const auth = new URL(`tcp://${headers[':authority']}`);
  // It's a very good idea to verify that hostname and port are
  // things this proxy should be connecting to.
  const socket = net.connect(auth.port, auth.hostname, () => {
    stream.respond();
    socket.pipe(stream);
    stream.pipe(socket);
  });
  socket.on('error', (error) => {
    stream.close(http2.constants.NGHTTP2_CONNECT_ERROR);
  });
});

proxy.listen(8001);
```

Un cliente HTTP/2 CONNECT:

```js
const http2 = require('http2');

const client = http2.connect('http://localhost:8001');

// Must not specify the ':path' and ':scheme' headers
// for CONNECT requests or an error will be thrown.
const req = client.request({
  ':method': 'CONNECT',
  ':authority': `localhost:${port}`
});

req.on('response', (headers) => {
  console.log(headers[http2.constants.HTTP2_HEADER_STATUS]);
});
let data = '';
req.setEncoding('utf8');
req.on('data', (chunk) => data += chunk);
req.on('end', () => {
  console.log(`The server says: ${data}`);
  client.close();
});
req.end('Jane');
```

### The Extended CONNECT Protocol

[RFC 8441](https://tools.ietf.org/html/rfc8441) defines an "Extended CONNECT Protocol" extension to HTTP/2 that may be used to bootstrap the use of an `Http2Stream` using the `CONNECT` method as a tunnel for other communication protocols (such as WebSockets).

The use of the Extended CONNECT Protocol is enabled by HTTP/2 servers by using the `enableConnectProtocol` setting:

```js
const http2 = require('http2');
const settings = { enableConnectProtocol: true };
const server = http2.createServer({ settings });
```

Once the client receives the `SETTINGS` frame from the server indicating that the extended CONNECT may be used, it may send `CONNECT` requests that use the `':protocol'`  HTTP/2 pseudo-header:

```js
const http2 = require('http2');
const client = http2.connect('http://localhost:8080');
client.on('remoteSettings', (settings) => {
  if (settings.enableConnectProtocol) {
    const req = client.request({ ':method': 'CONNECT', ':protocol': 'foo' });
    // ...
  }
});
```

## API de compatibilidad

La API de Compatibilidad tiene el objetivo de proporcionar una experiencia para el desarrollador similar a HTTP/1 al utilizar HTTP/2, haciendo posible el desarrollo de aplicaciones que soporten [HTTP/1](http.html) y HTTP/2. This API targets only the **public API** of the [HTTP/1](http.html). However many modules use internal methods or state, and those _are not supported_ as it is a completely different implementation.

El siguiente ejemplo crea un servidor de HTTP/2 utilizando la API de compatibilidad:

```js
const http2 = require('http2');
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Para crear un servidor mixto de [HTTPS](https.html) y HTTP/2, consulte la sección de [Negociación ALPN](#http2_alpn_negotiation) . No se admite la actualización desde servidores que no sean tls HTTP/1.

La API de compatibilidad de HTTP/2 está compuesta por [`Http2ServerRequest`]() y [`Http2ServerResponse`](). Su objetivo es la compatibilidad de la API con HTTP/1, pero no ocultan las diferencias entre los protocolos. Por ejemplo, se ignora el mensaje de estado para los códigos de HTTP.

### Negociación ALPN

ALPN negotiation allows supporting both [HTTPS](https.html) and HTTP/2 over the same socket. The `req` and `res` objects can be either HTTP/1 or HTTP/2, and an application **must** restrict itself to the public API of [HTTP/1](http.html), and detect if it is possible to use the more advanced features of HTTP/2.

El siguiente ejemplo crea un servidor que soporta a ambos protocolos:

```js
const { createSecureServer } = require('http2');
const { readFileSync } = require('fs');

const cert = readFileSync('./cert.pem');
const key = readFileSync('./key.pem');

const server = createSecureServer(
  { cert, key, allowHTTP1: true },
  onRequest
).listen(4443);

function onRequest(req, res) {
  // detects if it is a HTTPS request or HTTP/2
  const { socket: { alpnProtocol } } = req.httpVersion === '2.0' ?
    req.stream.session : req;
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({
    alpnProtocol,
    httpVersion: req.httpVersion
  }));
}
```

El evento de `'request'` funciona de manera idéntica en [HTTPS](https.html) y HTTP/2.

### Clase: http2.Http2ServerRequest
<!-- YAML
added: v8.4.0
-->

Un objeto de `Http2ServerRequest` es creado por [`http2.Server`][] o [`http2.SecureServer`][] y pasado como el primer argumento al evento de [`'request'`][]. Puede ser utilizado para acceder a un estado de solicitud, encabezados, y datos.

Implementa la interfaz del [Stream Legible](stream.html#stream_class_stream_readable), así como los siguientes eventos adicionales, métodos, y propiedades.

#### Evento: 'aborted'
<!-- YAML
added: v8.4.0
-->

El evento de `'aborted'` se emite cuando una instancia de `Http2ServerRequest` se aborta de manera anormal a mitad de una comunicación.

El evento de `'aborted'` sólo será emitido si el lado editable de `Http2ServerRequest` no se ha finalizado.

#### Evento: 'close'
<!-- YAML
added: v8.4.0
-->

Indica que el [`Http2Stream`][] subyacente fue cerrado. Al igual que `'end'`, este evento ocurre una sóla vez por respuesta.

#### request.aborted
<!-- YAML
added: v10.1.0
-->

* {boolean}

La propiedad de `request.aborted` será `true` si la solicitud ha sido anulada.

#### request.authority
<!-- YAML
added: v8.4.0
-->

* {string}

The request authority pseudo header field. It can also be accessed via `req.headers[':authority']`.

#### request.destroy([error])
<!-- YAML
added: v8.4.0
-->

* `error` {Error}

Llama a `destroy()` en el [`Http2Stream`][] que recibió el [`Http2ServerRequest`][]. Si se proporciona `error`, un evento de `'error'` será emitido y `error` será pasado como un argumento a cualquiera de los listeners en el evento.

No hace nada si el stream ya fue destruido.

#### request.headers
<!-- YAML
added: v8.4.0
-->

* {Object}

El objeto de cabeceras de solicitud/respuesta.

Pares de valores-clave de nombres de encabezado y valores. Los nombres de cabecera están en minúsculas.

```js
// Imprime algo similar a:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

Vea [Objeto de Encabezados de HTTP/2](#http2_headers_object).

En HTTP/2, la ruta de solicitud, el nombre de host, el protocolo, y el método están representados como encabezados especiales con el caracter `:` como prefijo (por ejemplo, `':path'`). Estos encabezados especiales serán incluidos en el objeto de `request.headers` . Se debe tener cuidado para no modificar inadvertidamente estos encabezados especiales o podrían ocurrir errores. Por ejemplo, remover todos los encabezados de la solicitud ocasionará que ocurran errores:

```js
removeAllHeaders(request.headers);
assert(request.url);   // Fails because the :path header has been removed
```

#### request.httpVersion
<!-- YAML
added: v8.4.0
-->

* {string}

En caso de la solicitud del servidor, la versión HTTP enviada por el cliente. En el caso de la respuesta del cliente, la versión HTTP del servidor conectado al servidor. Devuelve `'2.0'`.

Además, `message.httpVersionMajor` es el primer entero y `message.httpVersionMinor` es el segundo.

#### request.method
<!-- YAML
added: v8.4.0
-->

* {string}

El método de solicitud es una string. Sólo lectura. Examples: `'GET'`, `'DELETE'`.

#### request.rawHeaders
<!-- YAML
added: v8.4.0
-->

* {string[]}

La lista cruda de cabeceras de solicitud/respuesta exactamente como fueron recibidas.

Tenga en cuenta que las llaves y los valores están en la misma lista. Esto *no* es una lista de tuplas. Entonces, los elementos pares de la lista serían las valores clave, mientras que los elementos impares serían los valores asociados.

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

#### request.rawTrailers
<!-- YAML
added: v8.4.0
-->

* {string[]}

Las claves del trailer y los valores crudos de solicitud/respuesta, exactamente como fueron recibidos. Poblado solamente en el evento `'end'` .

#### request.scheme
<!-- YAML
added: v8.4.0
-->

* {string}

The request scheme pseudo header field indicating the scheme portion of the target URL.

#### request.setTimeout(msecs, callback)
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}
* Devuelve: {http2.Http2ServerRequest}

Establece el valor del tiempo de espera de [`Http2Stream`]() a `msecs`. Si se proporciona un callback, entonces se agregará como un listener en el evento de `'timeout'` en el objeto de respuesta.

Si no se añade ningún listener de `'timeout'` a la solicitud, la respuesta, o al servidor, entonces los [`Http2Stream`]()s se destruirán cuando se agote su tiempo de espera. Si se asigna un manejador a la solicitud, la respuesta, o a los eventos `'timeout'` del servidor, los sockets sin tiempo de espera deberán ser manejados de manera explícita.

#### request.socket
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Devuelve a un objeto proxy que actúa como un `net.Socket` (o `tls.TLSSocket`) pero aplica getters, setters, y métodos basados en lógica de HTTP/2.

Las propiedades de `destroyed`, `readable`, y `writable` serán recuperadas desde y establecidas en `request.stream`.

Los métodos de `destroy`, `emit`, `end`, `on` y `once` serán llamados en `request.stream`.

El método de `setTimeout` será llamado en `request.stream.session`.

`pause`, `read`, `resume`, y `write` arrojarán un error con el código `ERR_HTTP2_NO_SOCKET_MANIPULATION`. Vea [`Http2Session` y Sockets][] para más información.

Todas las otras interacciones serán enrutadas directamente al socket. Con el soporte TLS, utilice [`request.socket.getPeerCertificate()`][] para obtener los detalles de autenticación del cliente.

#### request.stream
<!-- YAML
added: v8.4.0
-->

* {Http2Stream}

El objeto [`Http2Stream`][] que apoya la solicitud.

#### request.trailers
<!-- YAML
added: v8.4.0
-->

* {Object}

El objeto de trailers de solicitud/respuesta. Poblado solamente en el evento `'end'` .

#### request.url
<!-- YAML
added: v8.4.0
-->

* {string}

Solicitar string de URL. Esto solo contiene la URL que está presente en la solicitud HTTP actual. Si la solicitud es:

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

Para obtener los parámetros del string de la query, la función `require('querystring').parse` puede ser usada, o `true` puede ser añadido como segundo argumento de `require('url').parse`.

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

### Clase: http2.Http2ServerResponse<!-- YAML
added: v8.4.0
-->Este objeto es creado internamente por un servidor de HTTP — no por el usuario. Se pasa como el segundo parámetro al evento de [`'request'`][].

The response inherits from [Stream](stream.html#stream_stream), and additionally implements the following:

#### Evento: 'close'
<!-- YAML
added: v8.4.0
-->

Indica que el [`Http2Stream`]() subyacente fue eliminado antes de que [`response.end()`][] fuese llamado, o antes de que se hubiera podido vaciar.

#### Evento: 'finish'
<!-- YAML
added: v8.4.0
-->

Se emite cuando la respuesta ha sido enviada. Más específicamente, este evento se emite cuando el último segmento de las cabeceras de respuesta y el cuerpo han sido entregados a la multiplexación de HTTP/2 para la transmisión sobre la red. Eso no implica que el cliente haya recibido algo aún.

Después de este evento, no se emitirán más eventos en el objeto de respuesta.

#### response.addTrailers(headers)
<!-- YAML
added: v8.4.0
-->

* `headers` {Object}

This method adds HTTP trailing headers (a header but at the end of the message) to the response.

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

#### response.connection
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Vea [`response.socket`][].

#### response.end(\[data\]\[, encoding\][, callback])<!-- YAML
added: v8.4.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ServerResponse`.
-->* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Devuelve: {this}

Este método señala al servidor que todos los encabezados de respuesta y el cuerpo han sido enviados; y que el servidor debería considerar este mensaje como completo. El método, `response.end()`, DEBE ser llamado en cada respuesta.

Si se especifica `data`, será equivalente a llamar a [`response.write(data, encoding)`][] seguido por `response.end(callback)`.

Si se especifica el `callback`, será llamado cuando el stream de respuesta haya finalizado.

#### response.finished<!-- YAML
added: v8.4.0
-->* {boolean}

Valor booleano que indica si se ha completado la respuesta. Comienza como `false`. Después de que [`response.end()`][] se ejecute, el valor será `true`.

#### response.getHeader(name)
<!-- YAML
added: v8.4.0
-->

* `name` {string}
* Devuelve: {string}

Lee un encabezado que ya ha sido puesto en cola, pero que no ha sido enviado al cliente. Tenga en que el nombre no distingue entre mayúsculas y minúsculas.

```js
const contentType = response.getHeader('content-type');
```

#### response.getHeaderNames()
<!-- YAML
added: v8.4.0
-->

* Devuelve: {string[]}

Devuelve una matriz que contiene los nombres únicos de los actuales encabezados salientes. Todos los nombres de las cabeceras están en minúsculas.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headerNames = response.getHeaderNames();
// headerNames === ['foo', 'set-cookie']
```

#### response.getHeaders()
<!-- YAML
added: v8.4.0
-->

* Devuelve: {Object}

Devuelve una copia superficial de las cabeceras salientes actuales. Ya que se utiliza una copia superficial, los valores de la matriz pueden ser mutados sin llamadas adicionales a varios métodos del módulo http relacionados con la cabecera. Las claves del objeto devuelto son los nombres de encabezado y los valores de los respectivos valores de encabezado. Todos los nombres de las cabeceras están en minúsculas.

The object returned by the `response.getHeaders()` method _does not_ prototypically inherit from the JavaScript `Object`. Esto significa que métodos típicos de `Object` tales como `obj.toString()`, `obj.hasOwnProperty()`, entre otros, no están definidos y *no funcionarán*.

```js
response.setHeader('Foo', 'bar');
response.setHeader('Set-Cookie', ['foo=bar', 'bar=baz']);

const headers = response.getHeaders();
// headers === { foo: 'bar', 'set-cookie': ['foo=bar', 'bar=baz'] }
```

#### response.hasHeader(name)
<!-- YAML
added: v8.4.0
-->

* `name` {string}
* Devuelve: {boolean}

Devuelve `true` si el encabezado identificado por `name` está actualmente establecido en los encabezados salientes. Tenga en cuenta que el nombre de cabecera no distingue entre mayúsculas y minúsculas.

```js
const hasContentType = response.hasHeader('content-type');
```

#### response.headersSent
<!-- YAML
added: v8.4.0
-->

* {boolean}

Verdadero si los encabezados fueron enviados, de lo contrario falso (sólo lectura).

#### response.removeHeader(name)
<!-- YAML
added: v8.4.0
-->

* `name` {string}

Elimina un encabezado que ha sido puesto en cola para un envío implícito.

```js
response.removeHeader('Content-Encoding');
```

#### response.sendDate
<!-- YAML
added: v8.4.0
-->

* {boolean}

Al ser verdadero, la Fecha del encabezado será generada automáticamente y enviada en la respuesta si no está presente en los encabezados. Por defecto es verdadero.

Esto solo debería inhabilitarse para las pruebas; HTTP requiere el encabezado de Fecha en las respuestas.

#### response.setHeader(name, value)
<!-- YAML
added: v8.4.0
-->

* `name` {string}
* `value` {string|string[]}

Establece un único valor de cabecera para cabeceras implícitas. Si este encabezado ya existe en los envíos de encabezados pendientes, su valor será reemplazado. Aquí, utiliza una matriz de strings para enviar varias cabeceras con el mismo nombre.

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
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

#### response.setTimeout(msecs[, callback])
<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}
* Devuelve: {http2.Http2ServerResponse}

Establece el valor del tiempo de espera de [`Http2Stream`]() a `msecs`. Si se proporciona un callback, entonces se agregará como un listener en el evento de `'timeout'` en el objeto de respuesta.

Si no se añade ningún listener de `'timeout'` a la solicitud, la respuesta, o al servidor, entonces los [`Http2Stream`]()s se destruirán cuando se agote su tiempo de espera. Si se asigna un manejador a la solicitud, la respuesta, o a los eventos `'timeout'` del servidor, los sockets sin tiempo de espera deberán ser manejados de manera explícita.

#### response.socket
<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Devuelve a un objeto proxy que actúa como un `net.Socket` (o `tls.TLSSocket`) pero aplica getters, setters, y métodos basados en lógica de HTTP/2.

Las propiedades `destroyed`, `readable`, y `writable` serán recuperadas desde y establecidas en `response.stream`.

Los métodos de `destroy`, `emit`, `end`, `on` y `once` serán llamados en `response.stream`.

El método de `setTimeout` será llamado en `response.stream.session`.

`pause`, `read`, `resume`, y `write` arrojarán un error con el código `ERR_HTTP2_NO_SOCKET_MANIPULATION`. Vea [`Http2Session` y Sockets][] para más información.

Todas las otras interacciones serán enrutadas directamente al socket.

```js
const http2 = require('http2');
const server = http2.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const port = req.socket.remotePort;
  res.end(`Your IP address is ${ip} and your source port is ${port}.`);
}).listen(3000);
```

#### response.statusCode
<!-- YAML
added: v8.4.0
-->

* {number}

Cuando se utilizan cabeceras implícitas (sin llamar a [`response.writeHead()`][] explícitamente), esta propiedad controla el código de estado que será enviado al cliente cuando las cabeceras sean vaciadas.

```js
response.statusCode = 404;
```

Después de que el encabezado de respuesta fue enviado al cliente, esta propiedad indica el código de estado que fue enviado.

#### response.statusMessage
<!-- YAML
added: v8.4.0
-->

* {string}

Mensaje de estado no es soportado por HTTP/2 (RFC7540 8.1.2.4). Devuelve una string vacía.

#### response.stream
<!-- YAML
added: v8.4.0
-->

* {Http2Stream}

El objeto [`Http2Stream`][] que apoya la respuesta.

#### response.write(chunk\[, encoding\]\[, callback\])
<!-- YAML
added: v8.4.0
-->

* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Devuelve: {boolean}

Si este método es llamado y [`response.writeHead()`][] no se ha llamado, entonces cambiará a modo de cabecera implícita y vaciará las cabeceras implícitas.

Esto envía una parte del cuerpo de la respuesta. Este método puede ser llamado varias veces para proporcionar partes sucesivas del cuerpo.

Tenga en cuenta que en el módulo `http`, el cuerpo de respuesta se omite cuando la solicitud es una solicitud HEAD. Asimismo, las respuestas `204` y `304` _no deben_ incluir un cuerpo de mensaje.

`chunk` puede ser una string o un búfer. Si `chunk` es una string, el segundo parámetro especificará cómo codificarlo dentro de un stream de bytes. Por defecto, el `encoding` es `'utf8'`. `callback` será llamado cuando este fragmento de datos sea vaciado.

Este es el cuerpo crudo de HTTP y no tiene nada qué ver con las codificaciones de cuerpo de partes múltiples y de alto nivel que pueden ser utilizadas.

La primera vez que [`response.write()`][] sea llamado, enviará la información de cabecera almacenada y el primer fragmento del cuerpo al cliente. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. Es decir, la respuesta se almacena hasta el primer fragmento del cuerpo.

Devuelve como `true` si todos los datos fueron arrojados con éxito al búfer del núcleo. Devuelve `false` si todos o parte de los datos fueron puestos en cola en la memoria del usuario. `'drain'` será emitido cuando el búfer esté libre otra vez.

#### response.writeContinue()
<!-- YAML
added: v8.4.0
-->

Envía un estado `100 Continue` al cliente, indicando que el cuerpo de solicitud debería ser enviado. Vea el evento de [`'checkContinue'`][] en `Http2Server` y `Http2SecureServer`.

#### response.writeHead(statusCode\[, statusMessage\]\[, headers\])
<!-- YAML
added: v8.4.0
-->

* `statusCode` {number}
* `statusMessage` {string}
* `headers` {Object}

Envía una cabecera de respuesta a la solicitud. El código de estado es un código de estado HTTP de 3 dígitos, como `404`. El último argumento, `headers`, son las cabeceras de respuesta.

For compatibility with [HTTP/1](http.html), a human-readable `statusMessage` may be passed as the second argument. Sin embargo, ya que el `statusMessage` no tiene ningún significado dentro de HTTP/2, el argumento no tendrá efecto y se emitirá una advertencia de proceso.

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Tenga en cuenta que la longitud del contenido se da en bytes, no en caracteres. La API de `Buffer.byteLength()` puede ser utilizada para determinar el número de bytes en una codificación dada. En mensajes salientes, Node.js no verifica si la Longitud del Contenido y la longitud del cuerpo que se transmite son iguales o no. However, when receiving messages, Node.js will automatically reject messages when the Content-Length does not match the actual payload size.

Este método puede ser llamado una vez en un mensaje, como máximo, antes de que [`response.end()`][] sea llamado.

Si [`response.write()`][] o [`response.end()`][] son llamados antes de llamar a esto, las cabeceras implícitas/mutables serán calculadas y llamarán a esta función.

Cuando las cabeceras hayan sido establecidas con [`response.setHeader()`][], serán combinadas con cualquiera de las cabeceras pasadas a [`response.writeHead()`][], con las cabeceras pasadas a [`response.writeHead()`][] dada su precedencia.

```js
// returns content-type = text/plain
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Intentar establecer un nombre de campo de cabecera o un valor que contenga caracteres inválidos dará como resultado al lanzamiento de un [`TypeError`][] .

#### response.createPushResponse(headers, callback)
<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object} Un objeto describiendo los encabezados
* `callback` {Function} Called once `http2stream.pushStream()` is finished, or either when the attempt to create the pushed `Http2Stream` has failed or has been rejected, or the state of `Http2ServerRequest` is closed prior to calling the `http2stream.pushStream()` method
  * `err` {Error}
  * `stream` {ServerHttp2Stream} The newly-created `ServerHttp2Stream` object

Call [`http2stream.pushStream()`][] with the given headers, and wrap the given [`Http2Stream`] on a newly created `Http2ServerResponse` as the callback parameter if successful. When `Http2ServerRequest` is closed, the callback is called with an error `ERR_HTTP2_INVALID_STREAM`.

## Recopilar Métricas de Rendimiento de HTTP/2

The [Performance Observer](perf_hooks.html) API can be used to collect basic performance metrics for each `Http2Session` and `Http2Stream` instance.

```js
const { PerformanceObserver } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
  const entry = items.getEntries()[0];
  console.log(entry.entryType);  // prints 'http2'
  if (entry.name === 'Http2Session') {
    // entry contains statistics about the Http2Session
  } else if (entry.name === 'Http2Stream') {
    // entry contains statistics about the Http2Stream
  }
});
obs.observe({ entryTypes: ['http2'] });
```

La propiedad de `entryType` de la `PerformanceEntry` será igual a `'http2'`.

La propiedad de `name` del `PerformanceEntry` será igual a `'Http2Stream'` o a `'Http2Session'`.

Si `name` es igual a `Http2Stream`, el `PerformanceEntry` contendrá las siguientes propiedades adicionales:

* `bytesRead` {number} El número de bytes recibidos del frame `DATA` para este `Http2Stream`.
* `bytesWritten` {number} El número de bytes enviados del frame `DATA` para este `Http2Stream`.
* `id` {number} El identificador del `Http2Stream` asociado
* `timeToFirstByte` {number} El número de milisegundos transcurridos entre el `PerformanceEntry` `startTime` y la recepción del primer frame `DATA` .
* `timeToFirstByteSent` {number} El número de milisegundos transcurridos entre el `PerformanceEntry` `startTime` y el envío del primer frame `DATA` .
* `timeToFirstHeader` {number} El número de milisegundos transcurridos entre el `PerformanceEntry` `startTime` y la recepción del primer encabezado.

Si `name` es igual a `Http2Session`, el `PerformanceEntry` contendrá las siguientes propiedades adicionales:

* `bytesRead` {number} El número de bytes recibidos para este `Http2Session`.
* `bytesWritten` {number} El número de bytes enviados para este `Http2Session`.
* `framesReceived` {number} El número de frames HTTP/2 recibidos por la `Http2Session`.
* `framesSent` {number} El número de frames HTTP/2 enviados por la `Http2Session`.
* `maxConcurrentStreams` {number} El número máximo de streams abiertos de manera concurrente durante el tiempo de vida de la `Http2Session`.
* `pingRTT` {number} El número de milisegundos transcurridos desde la transmisión de un frame `PING` y la recepción de su reconocimiento. Solo está presente si un frame de `PING` ha sido enviado en la `Http2Session`.
* `streamAverageDuration` {number} La duración promedio (en milisegundos) para todas las instancias de `Http2Stream` .
* `streamCount` {number} El número de instancias de `Http2Stream` procesadas por la `Http2Session`.
* `type` {string} Utilice `'server'` o `'client'` para identificar el tipo de `Http2Session`.
