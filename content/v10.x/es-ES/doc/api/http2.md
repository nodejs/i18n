# HTTP/2

<!--introduced_in=v8.4.0-->

> Estabilidad: 1 - Experimental

El módulo `http2` provee una implementación del protocolo [HTTP/2](https://tools.ietf.org/html/rfc7540). Puede ser accedido utilizando:

```js
const http2 = require('http2');
```

## Core API

La API de Núcleo proporciona una interfaz de bajo nivel diseñada específicamente alrededor del soporte para las funciones del protocolo de HTTP/2. It is specifically *not* designed for compatibility with the existing [HTTP/1](http.html) module API. However, the [Compatibility API](#http2_compatibility_api) is.

La API de Núcleo `http2` es mucho más simétrica entre cliente y servidor que la API `http` . Por ejemplo, la mayoría de los eventos, como `'error'`, `'connect'` y `'stream'`, pueden ser emitidos por el código del lado del cliente o por el código del lado del servidor.

### Ejemplo del lado del servidor

La siguiente ilustra un servidor simple de HTTP/2 utilizando la API de núcleo. Dado que no hay navegadores conocidos que soporten [unencrypted HTTP/2](https://http2.github.io/faq/#does-http2-require-encryption), el uso de [`http2.createSecureServer()`][] es necesario al comunicarse con clientes del navegador.

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

Instancias de la clase `http2.Http2Session` representan una sesión activa de comunicaciones entre un cliente HTTP/2 y un servidor. Instancias de esta clase *no* están destinadas a ser construidas directamente por el código de usuario.

Cada instancia de `Http2Session` exhibirá comportamientos ligeramente distintos, dependiendo de si está operando como un servidor o un cliente. La propiedad `http2session.type` puede ser usada para determinar el modo en el que una `http2session.type` está operando. En el lado del servidor, el código de usuario raramente debe tener ocasión de trabajar directamente con el objeto `Http2Session`, con la mayoría de las acciones tomadas típicamente a través de interacciones, ya sea con los objetos `Http2Server` o `Http2Stream`.

#### `Http2Session` and Sockets

Cada instancia `Http2Session` está asociada con exactamente una [`net.Socket`][] o una [`tls.TLSSocket`][] cuando es creada. Cuando se destruye ya sea el `Socket` o la `Http2Session`, ambos serán destruidos.

Debido a los requisitos específicos de serialización y procesamiento impuestos por el protocolo HTTP/2, no se recomienda que el código de usuario lea o escriba datos a una instancia de `Socket` vinculada a una `Http2Session` . Hacerlo, puede poner la sesión HTTP/2 en un estado indeterminado, causando que la sesión y el socket se vuelvan inutilizables.

Una vez que un `Socket` haya sido vinculado a una `Http2Session`, el código de usuario debería confiar únicamente en la API de la `Http2Session` .

#### Event: 'close'

<!-- YAML
added: v8.4.0
-->

El evento de `'close'` se emite una vez que la `Http2Session` ha sido destruida. Su oyente no espera ningún argumento.

#### Event: 'connect'

<!-- YAML
added: v8.4.0
-->

* `session` {Http2Session}
* `socket` {net.Socket}

El evento `'connect'` se emite una vez que la `Http2Session` haya sido conectada exitosamente al peer remoto y la comunicación pueda comenzar.

El código de usuario generalmente no escuchará directamente a este evento.

#### Event: 'error'

<!-- YAML
added: v8.4.0
-->

* `error` {Error}

El evento de `'error'` se emite cuando ocurre un error durante el procesamiento de un `Http2Session`.

#### Event: 'frameError'

<!-- YAML
added: v8.4.0
-->

* `type` {integer} El tipo de frame.
* `code` {integer} El código de error.
* `id` {integer} The stream id (or `0` if the frame isn't associated with a stream).

El evento `'frameError'` se emite cuando ocurre un error mientras se intenta enviar un frame en la sesión. Si el frame que no pudo ser enviado se asocia con un `Http2Stream` específico, se realizará un intento para emitir un evento de `'frameError'` en el `Http2Stream` .

Si el evento `'frameError'` esta asociado con un stream, el stream se cerrará y se destruirá inmediatamente después del evento `'frameError'` . Si el evento no está asociado a un stream, la `Http2Session` se apagará inmediatamente después del evento `'frameError'` .

#### Event: 'goaway'

<!-- YAML
added: v8.4.0
-->

* `errorCode` {number} El código de error HTTP/2 especificado en el frame `GOAWAY` .
* `lastStreamID` {number} The ID of the last stream the remote peer successfully processed (or `0` if no ID is specified).
* `opaqueData` {Buffer} If additional opaque data was included in the `GOAWAY` frame, a `Buffer` instance will be passed containing that data.

El evento `'goaway'` se emite cuando se recibe un frame de `GOAWAY` .

La instancia `Http2Session` se apagará automáticamente cuando se emita el evento `'goaway'` .

#### Event: 'localSettings'

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

#### Event: 'remoteSettings'

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
* `flags` {number} The associated numeric flags
* `rawHeaders` {Array} An array containing the raw header names followed by their respective values.

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
  stream.end('<h1>Hello World</h1>');
});

server.listen(80);
```

#### Event: 'timeout'

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

Value will be `undefined` if the `Http2Session` is not yet connected to a socket, `h2c` if the `Http2Session` is not connected to a `TLSSocket`, or will return the value of the connected `TLSSocket`'s own `alpnProtocol` property.

#### http2session.close([callback])

<!-- YAML
added: v9.4.0
-->

* `callback` {Function}

Gracefully closes the `Http2Session`, allowing any existing streams to complete on their own and preventing new `Http2Stream` instances from being created. Una vez cerrado, `http2session.destroy()` *might* ser llamado si no hay instancias de `Http2Stream` abiertas.

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

#### http2session.destroy(\[error,\]\[code\])

<!-- YAML
added: v8.4.0
-->

* `error` {Error} An `Error` object if the `Http2Session` is being destroyed due to an error.
* `code` {number} The HTTP/2 error code to send in the final `GOAWAY` frame. If unspecified, and `error` is not undefined, the default is `INTERNAL_ERROR`, otherwise defaults to `NO_ERROR`.

Termina inmediatamente la `Http2Session` y el `net.Socket` o el `tls.TLSSocket` asociados.

Una vez destruido, el `Http2Session` emitirá el evento de `'close'` . Si `error` no está indefinido, un evento `'error'` será emitido inmediatamente antes del evento `'close'`.

Si queda algún `Http2Streams` abierto, asociado con la `Http2Session`, esos también serán destruidos.

#### http2session.destroyed

<!-- YAML
added: v8.4.0
-->

* {boolean}

Will be `true` if this `Http2Session` instance has been destroyed and must no longer be used, otherwise `false`.

#### http2session.encrypted

<!-- YAML
added: v9.4.0
-->

* {boolean|undefined}

El valor es `undefined` si el socket de la sesión `Http2Session` no ha sido conectado aún, `true` si el `Http2Session` está conectado con un `TLSSocket`, y `false` si el `Http2Session` está conectado a otro tipo de socket o stream.

#### http2session.goaway([code, [lastStreamID, [opaqueData]]])

<!-- YAML
added: v9.4.0
-->

* `code` {number} An HTTP/2 error code
* `lastStreamID` {number} La identificación numérica del último `Http2Stream` procesado
* `opaqueData` {Buffer|TypedArray|DataView} A `TypedArray` or `DataView` instance containing additional data to be carried within the `GOAWAY` frame.

Transmits a `GOAWAY` frame to the connected peer *without* shutting down the `Http2Session`.

#### http2session.localSettings

<!-- YAML
added: v8.4.0
-->

* {HTTP/2 Settings Object}

A prototype-less object describing the current local settings of this `Http2Session`. Las configuraciones locales son locales para *this* `Http2Session` instancia.

#### http2session.originSet

<!-- YAML
added: v9.4.0
-->

* {string[]|undefined}

Si la `Http2Session` se conecta a un `TLSSocket`, la propiedad de `originSet` devolverá un `Array` de orígenes para los cuales el `Http2Session` podría considerarse autoritativo.

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
* Returns: {boolean}

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

Calls [`ref()`][`net.Socket.prototype.ref()`] on this `Http2Session` instance's underlying [`net.Socket`].

#### http2session.remoteSettings

<!-- YAML
added: v8.4.0
-->

* {HTTP/2 Settings Object}

A prototype-less object describing the current remote settings of this `Http2Session`. Las configuraciones remotas están establecidas por el peer HTTP/2 *connected* .

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

Returns a `Proxy` object that acts as a `net.Socket` (or `tls.TLSSocket`) but limits available methods to ones safe to use with HTTP/2.

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
  * `outboundQueueSize` {number} The number of frames currently within the outbound queue for this `Http2Session`.
  * `deflateDynamicTableSize` {number} The current size in bytes of the outbound header compression state table.
  * `inflateDynamicTableSize` {number} The current size in bytes of the inbound header compression state table.

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

* `alt` {string} A description of the alternative service configuration as defined by [RFC 7838](https://tools.ietf.org/html/rfc7838).
* `originOrStream` {number|string|URL|Object} O una string de URL que especifica el origen (o un `Object` con una propiedad de `origin`) o el identificador numérico de un `Http2Stream` activo, como lo da la propiedad de `http2stream.id` .

Submits an `ALTSVC` frame (as defined by [RFC 7838](https://tools.ietf.org/html/rfc7838)) to the connected client.

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

The `alt` and origin string *must* contain only ASCII bytes and are strictly interpreted as a sequence of ASCII bytes. The special value `'clear'` may be passed to clear any previously set alternative service for a given domain.

Cuando se pasa una string para el argumento de `originOrStream`, será analizado como una URL y el origen será derivado. For instance, the origin for the HTTP URL `'https://example.org/foo/bar'` is the ASCII string `'https://example.org'`. Ocurrirá un error si la string dada no se puede analizar como una URL o si no se puede derivar un origen válido.

A `URL` object, or any object with an `origin` property, may be passed as `originOrStream`, in which case the value of the `origin` property will be used. The value of the `origin` property *must* be a properly serialized ASCII origin.

#### Especificación de servicios alternativos

The format of the `alt` parameter is strictly defined by [RFC 7838](https://tools.ietf.org/html/rfc7838) as an ASCII string containing a comma-delimited list of "alternative" protocols associated with a specific host and port.

Por ejemplo, el valor `'h2="example.org:81"'` indica que el protocolo HTTP/2 está disponible en el host `'example.org'` en TCP/IP puerto 81. The host and port *must* be contained within the quote (`"`) characters.

Se pueden especificar múltiples alternativas, por ejemplo: `'h2="example.org:81",
h2=":82"'`.

El identificador de protocolo (`'h2'` en los ejemplos) puede ser cualquier [ALPN Protocol ID](https://www.iana.org/assignments/tls-extensiontype-values/tls-extensiontype-values.xhtml#alpn-protocol-ids) válido.

La sintaxis de estos valores no está validada por la implementación de Node.js, y se transmiten como proporcionadas por el usuario o recibidas desde el peer.

### Class: ClientHttp2Session

<!-- YAML
added: v8.4.0
-->

#### Event: 'altsvc'

<!-- YAML
added: v9.4.0
-->

* `alt`: {string}
* `origin`: {string}
* `streamId`: {number}

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

#### clienthttp2session.request(headers[, options])

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `options` {Object}
  
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

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event is emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrailers()` method can then be called to send trailing headers to the peer.

Es importante señalar que cuando se establece `options.waitForTrailers`, el `Http2Stream` *no* se cerrará automáticamente cuando se transmita el último frame de `DATA` . El código de usuario *debe* llamar a `http2stream.sendTrailers()` o a `http2stream.close()` para cerrar el `Http2Stream`.

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

#### Http2Stream Lifecycle

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

```js
stream.on('trailers', (headers, flags) => {
  console.log(headers);
});
```

#### Event: 'wantTrailers'

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

An object containing the outbound headers sent for this `Http2Stream`.

#### http2stream.sentInfoHeaders

<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object[]}

An array of objects containing the outbound informational (additional) headers sent for this `Http2Stream`.

#### http2stream.sentTrailers

<!-- YAML
added: v9.5.0
-->

* {HTTP/2 Headers Object}

An object containing the outbound trailers sent for this this `HttpStream`.

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
--> Proporciona información diversa sobre el estado actual del 

`Http2Stream`.

* {Object} 
  * `localWindowSize` {number} El número de bytes que el peer conectado puede enviar a este `Http2Stream` sin recibir un `WINDOW_UPDATE`.
  * `state` {number} Una bandera que indica el estado actual de bajo nivel del `Http2Stream`, como lo determina `nghttp2`.
  * `localClose` {number} es `true` en caso de que este `Http2Stream` haya sido cerrado de manera local.
  * `remoteClose` {number} `true` si este `Http2Stream` ha sido cerrado de manera remota.
  * `sumDependencyWeight` {number} The sum weight of all `Http2Stream` instances that depend on this `Http2Stream` as specified using `PRIORITY` frames.
  * `weight` {number} El peso de prioridad de esta `Http2Stream`.

Un estado actual de este `Http2Stream`.

#### http2stream.sendTrailers(headers)

<!-- YAML
added: v10.0.0
-->

* `headers` {HTTP/2 Headers Object}

Sends a trailing `HEADERS` frame to the connected HTTP/2 peer. This method will cause the `Http2Stream` to be immediately closed and must only be called after the `'wantTrailers'` event has been emitted. When sending a request or sending a response, the `options.waitForTrailers` option must be set in order to keep the `Http2Stream` open after the final `DATA` frame so that trailers can be sent.

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

### Class: ClientHttp2Stream

<!-- YAML
added: v8.4.0
-->

* Extends {Http2Stream}

La clase `ClientHttp2Stream` es una extensión de `Http2Stream` que se usa exclusivamente en clientes HTTP/2. Las instancias `Http2Stream` en el cliente proporcionan eventos tales como `'response'` y `'push'`, los cuales son relevantes solamente en el cliente.

#### Evento: 'continue'

<!-- YAML
added: v8.5.0
-->

Se emite cuando el servidor envía un estado de `100 Continue`, generalmente a causa de que la solicitud contenía `Expect: 100-continue`. Esta es una instrucción en la que el cliente debería enviar el cuerpo de la solicitud.

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

Read-only property mapped to the `SETTINGS_ENABLE_PUSH` flag of the remote client's most recent `SETTINGS` frame. Will be `true` if the remote peer accepts push streams, `false` otherwise. Las configuraciones son las mismas para cada `Http2Stream` en el mismo `Http2Session`.

#### http2stream.pushStream(headers[, options], callback)

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `opciones` {Object} 
  * `exclusive` {boolean} Cuando `true` y `parent` identifica un Stream mayor, el stream creado se vuelve la única dependencia directa del Stream mayor, con todas las otras dependientes existentes vueltas dependientes del stream creado recientemente. **Default:** `false`.
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

#### http2stream.respond([headers[, options]])

<!-- YAML
added: v8.4.0
-->

* `headers` {HTTP/2 Headers Object}
* `opciones` {Object} 
  * `endStream` {boolean} Set to `true` to indicate that the response will not include payload data.
  * `waitForTrailers` {boolean} Cuando es `true`, el `Http2Stream` emitirá el evento `'wantTrailers'` luego de que el frame final de `DATA` haya sido enviado.

```js
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream) => {
  stream.respond({ ':status': 200 });
  stream.end('some data');
});
```

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event will be emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

Es importante señalar que cuando se establece `options.waitForTrailers`, el `Http2Stream` *not* se cerrará automáticamente cuando se transmita el frame final de `DATA` . El código de usuario *debe* llamar a `http2stream.sendTrailers()` o a `http2stream.close()` para cerrar el `Http2Stream`.

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

The optional `options.statCheck` function may be specified to give user code an opportunity to set additional content headers based on the `fs.Stat` details of the given fd. Si se proporciona la función de `statCheck`, el método de `http2stream.respondWithFD()` realizará una llamada `fs.fstat()` para recopilar detalles sobre el descriptor de archivos proporcionado.

The `offset` and `length` options may be used to limit the response to a specific range subset. This can be used, for instance, to support HTTP Range requests.

El descriptor de archivos no se cierra cuando se cierra el stream, entonces necesitará cerrarse manualmente una vez que ya no se necesite. Tenga en cuenta que utilizar el mismo descriptor de archivo de manera concurrente para múltiples streams no es soportado y puede resultar en pérdida de datos. Reutilizar un descriptor de archivo luego de que un stream ha finalizado es soportado.

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event will be emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrailers()` method can then be used to sent trailing header fields to the peer.

Es importante señalar que cuando se establece `options.waitForTrailers`, el `Http2Stream` *not* se cerrará automáticamente cuando se transmita el frame final de `DATA` . El código de usuario *debe* llamar a `http2stream.sendTrailers()` o a `http2stream.close()` para cerrar el `Http2Stream`.

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

* `path` {string|Buffer|URL}
* `headers` {HTTP/2 Headers Object}
* `opciones` {Object} 
  * `statCheck` {Function}
  * `onError` {Function} Función de callback invocada en caso de que ocurra un error antes de un envío.
  * `waitForTrailers` {boolean} Cuando es `true`, el `Http2Stream` emitirá el evento `'wantTrailers'` luego de que el frame final de `DATA` haya sido enviado.
  * `offset` {number} The offset position at which to begin reading.
  * `length` {number} La cantidad de datos de la fd a enviar.

Envía un archivo normal como respuesta. The `path` must specify a regular file or an `'error'` event will be emitted on the `Http2Stream` object.

Al ser utilizada, la interfaz de `Duplex` del objeto de `Http2Stream` se cerrará automáticamente.

The optional `options.statCheck` function may be specified to give user code an opportunity to set additional content headers based on the `fs.Stat` details of the given file:

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

The `options.statCheck` function may also be used to cancel the send operation by returning `false`. For instance, a conditional request may check the stat results to determine if the file has been modified to return an appropriate `304` response:

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

The `content-length` header field will be automatically set.

The `offset` and `length` options may be used to limit the response to a specific range subset. This can be used, for instance, to support HTTP Range requests.

The `options.onError` function may also be used to handle all the errors that could happen before the delivery of the file is initiated. El comportamiento predeterminado es destruir el stream.

When the `options.waitForTrailers` option is set, the `'wantTrailers'` event will be emitted immediately after queuing the last chunk of payload data to be sent. The `http2stream.sendTrilers()` method can then be used to sent trailing header fields to the peer.

Es importante señalar que cuando se establece `options.waitForTrailers`, el `Http2Stream` *not* se cerrará automáticamente cuando se transmita el frame final de `DATA` . El código de usuario *debe* llamar a `http2stream.sendTrailers()` o a `http2stream.close()` para cerrar el `Http2Stream`.

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

### Class: Http2Server

<!-- YAML
added: v8.4.0
-->

* Extends: {net.Server}

In `Http2Server`, there are no `'clientError'` events as there are in HTTP1. However, there are `'sessionError'`, and `'streamError'` events for errors emitted on the socket, or from `Http2Session` or `Http2Stream` instances.

#### Event: 'checkContinue'

<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Si se registra un listener [`'request'`][] o se suministra una función de callback a [`http2.createServer()`][], el evento de `'checkContinue'` se emitirá cada vez que una solicitud con un HTTP `Expect: 100-continue` sea recibida. If this event is not listened for, the server will automatically respond with a status `100 Continue` as appropriate.

Manejar este evento implica llamar a [`response.writeContinue()`][] si el cliente debería continuar a enviar el cuerpo de la solicitud, o generar una respuesta apropiada de HTTP (por ejemplo, 400 Bad Request) si el cliente no debería continuar a enviar el cuerpo de la solicitud.

Tener en cuenta que cuando este evento es emitido y manejado, el evento [`'request'`] no será emitido.

#### Event: 'request'

<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Emitido cada vez que hay una solicitud. Tenga en cuenta que pueden haber múltiples solicitudes por sesión. Vea la [Compatibility API](#http2_compatibility_api).

#### Event: 'session'

<!-- YAML
added: v8.4.0
-->

El evento `'session'` se emite cuando una `Http2Session` nueva es creada por el `Http2Server` .

#### Event: 'sessionError'

<!-- YAML
added: v8.4.0
-->

El evento de `'sessionError'` se emite cuando un evento de `'error'` es emitido por un objeto de `Http2Session` asociado con el `Http2Server`.

#### Event: 'streamError'

<!-- YAML
added: v8.5.0
-->

Si un `ServerHttp2Stream` emite un evento de `'error'`, será reenviado aquí. El stream ya estará destruido cuando se active este evento.

#### Event: 'stream'

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

#### Event: 'timeout'

<!-- YAML
added: v8.4.0
-->

El evento `'timeout'` se emite cuando no hay actividad en el Servidor por un número dado de milisegundos establecidos, utilizando `http2server.setTimeout()` .

#### server.close([callback])

<!-- YAML
added: v8.4.0
-->

* `callback` {Function}

Detiene al servidor de aceptar nuevas conexiones. See [`net.Server.close()`][].

Note that this is not analogous to restricting new requests since HTTP/2 connections are persistent. To achieve a similar graceful shutdown behavior, consider also using [`http2session.close()`] on active sessions.

### Class: Http2SecureServer

<!-- YAML
added: v8.4.0
-->

* Extends: {tls.Server}

#### Event: 'checkContinue'

<!-- YAML
added: v8.5.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Si se registra un listener [`'request'`][] o se suministra una función de callback a [`http2.createSecureServer()`][], el evento de `'checkContinue'` se emitirá cada vez que una solicitud con un HTTP `Expect: 100-continue` sea recibida. Si este evento no se escucha, el servidor automáticamente responderá con un estado `100 Continue` según corresponda.

Manejar este evento implica llamar a [`response.writeContinue()`][] si el cliente debería continuar a enviar el cuerpo de la solicitud, o generar una respuesta apropiada de HTTP (por ejemplo, 400 Bad Request) si el cliente no debería continuar a enviar el cuerpo de la solicitud.

Tener en cuenta que cuando este evento es emitido y manejado, el evento [`'request'`][] no será emitido.

#### Event: 'request'

<!-- YAML
added: v8.4.0
-->

* `request` {http2.Http2ServerRequest}
* `response` {http2.Http2ServerResponse}

Emitido cada vez que hay una solicitud. Tenga en cuenta que pueden haber múltiples solicitudes por sesión. Vea la [Compatibility API](#http2_compatibility_api).

#### Event: 'session'

<!-- YAML
added: v8.4.0
-->

El evento de `'session'` se emite cuando `Http2SecureServer` crea un nuevo `Http2Session` .

#### Event: 'sessionError'

<!-- YAML
added: v8.4.0
-->

El evento `'sessionError'` se emite cuando un evento `'error'` es emitido por un objeto `Http2Session` asociado al `Http2SecureServer` .

#### Event: 'stream'

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

#### Event: 'timeout'

<!-- YAML
added: v8.4.0
-->

El evento `'timeout'` se emite cuando no hay actividad en el Servidor por un número dado de milisegundos establecidos, utilizando `http2secureServer.setTimeout()` .

#### Event: 'unknownProtocol'

<!-- YAML
added: v8.4.0
-->

The `'unknownProtocol'` event is emitted when a connecting client fails to negotiate an allowed protocol (i.e. HTTP/2 or HTTP/1.1). The event handler receives the socket for handling. Si no se registra ningún listener para este evento, la conexión será terminada. Vea la [Compatibility API](#http2_compatibility_api).

#### server.close([callback])

<!-- YAML
added: v8.4.0
-->

* `callback` {Function}

Stops the server from accepting new connections. See [`tls.Server.close()`][].

Note that this is not analogous to restricting new requests since HTTP/2 connections are persistent. To achieve a similar graceful shutdown behavior, consider also using [`http2session.close()`] on active sessions.

### http2.createServer(options[, onRequestHandler])

<!-- YAML
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
-->

* `opciones` {Object} 
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Sets the maximum memory that the `Http2Session` is permitted to use. El valor se expresa en términos de número de megabytes, por ejemplo, `1` es igual a 1 megabyte. El valor mínimo permitido es `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. El número actual de sesiones de `Http2Stream`, el uso de memoria actual de los tableros de compresión de encabezados, datos actuales puestos en cola para ser enviados, y los frames no reconocidos de `PING` y `SETTINGS` se cuentan hacia el límite actual. **Default:** `10`.
  * `maxHeaderListPairs` {number} Sets the maximum number of header entries. El valor mínimo es `4`. **Default:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Default:** `10`.
  * `maxSendHeaderBlockLength` {number} Establece el tamaño máximo permitido para un bloque comprimido y serializado de encabezados. Attempts to send headers that exceed this limit will result in a `'frameError'` event being emitted and the stream being closed and destroyed.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Value may be one of: 
    * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
    * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
    * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
    * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. If this maximum is less than the calculated amount needed to ensure alignment, the maximum will be used and the total frame length will *not* necessarily be aligned at 8 bytes.
  * `peerMaxConcurrentStreams` {number} Sets the maximum number of concurrent streams for the remote peer as if a `SETTINGS` frame had been received. Will be overridden if the remote peer sets its own value for `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, proporciona la función de callback utilizada para determinar el relleno. See [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} Las configuraciones iniciales para enviar al peer remoto al conectarse.
  * `Http1IncomingMessage` {http.IncomingMessage} Specifies the `IncomingMessage` class to used for HTTP/1 fallback. Útil para extender el `http.IncomingMessage` original. **Default:** `http.IncomingMessage`.
  * `Http1ServerResponse` {http.ServerResponse} Specifies the `ServerResponse` class to used for HTTP/1 fallback. Útil para extender el `http.ServerResponse` original. **Default:** `http.ServerResponse`.
  * `Http2ServerRequest` {http2.Http2ServerRequest} Specifies the `Http2ServerRequest` class to use. Útil para extender el `Http2ServerRequest` original. **Default:** `Http2ServerRequest`.
  * `Http2ServerResponse` {http2.Http2ServerResponse} Specifies the `Http2ServerResponse` class to use. Útil para extender el `Http2ServerResponse` original. **Default:** `Http2ServerResponse`.
* `onRequestHandler` {Function} See [Compatibility API](#http2_compatibility_api)
* Returns: {Http2Server}

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

### http2.createSecureServer(options[, onRequestHandler])

<!-- YAML
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
-->

* `opciones` {Object} 
  * `allowHTTP1` {boolean} Incoming client connections that do not support HTTP/2 will be downgraded to HTTP/1.x when set to `true`. See the [`'unknownProtocol'`][] event. Vea [ALPN negotiation](#http2_alpn_negotiation). **Default:** `false`.
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Sets the maximum memory that the `Http2Session` is permitted to use. El valor se expresa en términos de número de megabytes, por ejemplo, `1` es igual a 1 megabyte. El valor mínimo permitido es `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. El número actual de sesiones de `Http2Stream`, el uso de memoria actual de los tableros de compresión de encabezados, datos actuales puestos en cola para ser enviados, y los frames no reconocidos de `PING` y `SETTINGS` se cuentan hacia el límite actual. **Default:** `10`.
  * `maxHeaderListPairs` {number} Sets the maximum number of header entries. El valor mínimo es `4`. **Default:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Default:** `10`.
  * `maxSendHeaderBlockLength` {number} Establece el tamaño máximo permitido para un bloque comprimido y serializado de encabezados. Attempts to send headers that exceed this limit will result in a `'frameError'` event being emitted and the stream being closed and destroyed.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Value may be one of: 
    * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
    * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
    * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
    * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. Si este valor máximo es inferior a la cantidad calculada necesaria para asegurar la alineación, el valor máximo será utilizado y la longitud total del frame *no* necesariamente estará alineada en 8 bytes.
  * `peerMaxConcurrentStreams` {number} Establece el número máximo de streams concurrentes para el peer remoto, como si un frame de `SETTINGS` hubiese sido recibido. Will be overridden if the remote peer sets its own value for `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, proporciona la función de callback utilizada para determinar el relleno. See [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} Las configuraciones iniciales para enviar al peer remoto al conectarse.
  * ...: Any [`tls.createServer()`][] options can be provided. Para los servidores, usualmente se requieren las opciones de identidad (`pfx` ó `key`/`cert`).
* `onRequestHandler` {Function} See [Compatibility API](#http2_compatibility_api)
* Returns: {Http2SecureServer}

Devuelve una instancia de `tls.Server` que crea y gestiona instancias de `Http2Session` .

```js
const http2 = require('http2');

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

### http2.connect(authority\[, options\]\[, listener\])

<!-- YAML
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
-->

* `authority` {string|URL}
* `opciones` {Object} 
  * `maxDeflateDynamicTableSize` {number} Sets the maximum dynamic table size for deflating header fields. **Default:** `4Kib`.
  * `maxSessionMemory`{number} Sets the maximum memory that the `Http2Session` is permitted to use. El valor se expresa en términos de número de megabytes, por ejemplo, `1` es igual a 1 megabyte. El valor mínimo permitido es `1`. This is a credit based limit, existing `Http2Stream`s may cause this limit to be exceeded, but new `Http2Stream` instances will be rejected while this limit is exceeded. El número actual de sesiones de `Http2Stream`, el uso de memoria actual de los tableros de compresión de encabezados, datos actuales puestos en cola para ser enviados, y los frames no reconocidos de `PING` y `SETTINGS` se cuentan hacia el límite actual. **Default:** `10`.
  * `maxHeaderListPairs` {number} Sets the maximum number of header entries. El valor mínimo es `1`. **Default:** `128`.
  * `maxOutstandingPings` {number} Sets the maximum number of outstanding, unacknowledged pings. **Default:** `10`.
  * `maxReservedRemoteStreams` {number} Sets the maximum number of reserved push streams the client will accept at any given time. Once the current number of currently reserved push streams exceeds reaches this limit, new push streams sent by the server will be automatically rejected.
  * `maxSendHeaderBlockLength` {number} Establece el tamaño máximo permitido para un bloque comprimido y serializado de encabezados. Attempts to send headers that exceed this limit will result in a `'frameError'` event being emitted and the stream being closed and destroyed.
  * `paddingStrategy` {number} Identifies the strategy used for determining the amount of padding to use for `HEADERS` and `DATA` frames. **Default:** `http2.constants.PADDING_STRATEGY_NONE`. Value may be one of: 
    * `http2.constants.PADDING_STRATEGY_NONE` - Specifies that no padding is to be applied.
    * `http2.constants.PADDING_STRATEGY_MAX` - Specifies that the maximum amount of padding, as determined by the internal implementation, is to be applied.
    * `http2.constants.PADDING_STRATEGY_CALLBACK` - Specifies that the user provided `options.selectPadding()` callback is to be used to determine the amount of padding.
    * `http2.constants.PADDING_STRATEGY_ALIGNED` - Will *attempt* to apply enough padding to ensure that the total frame length, including the 9-byte header, is a multiple of 8. For each frame, however, there is a maximum allowed number of padding bytes that is determined by current flow control state and settings. Si este valor máximo es inferior a la cantidad calculada necesaria para asegurar la alineación, el valor máximo será utilizado y la longitud total del frame *no* necesariamente estará alineada en 8 bytes.
  * `peerMaxConcurrentStreams` {number} Sets the maximum number of concurrent streams for the remote peer as if a `SETTINGS` frame had been received. Will be overridden if the remote peer sets its own value for `maxConcurrentStreams`. **Default:** `100`.
  * `selectPadding` {Function} Cuando `options.paddingStrategy` es igual a `http2.constants.PADDING_STRATEGY_CALLBACK`, proporciona la función de callback utilizada para determinar el relleno. See [Using `options.selectPadding()`][].
  * `settings` {HTTP/2 Settings Object} Las configuraciones iniciales para enviar al peer remoto al conectarse.
  * `createConnection` {Function} Un callback opcional que recibe la instancia de `URL` pasada a `connect` y el objeto de `options`, y devuelve cualquier stream de [`Duplex`][] que deberá ser utilizado como la conexión para esta sesión.
  * ...: Any [`net.connect()`][] or [`tls.connect()`][] options can be provided.
* `listener` {Function}
* Returns: {ClientHttp2Session}

Returns a `ClientHttp2Session` instance.

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

#### Error Codes for RST_STREAM and GOAWAY

<a id="error_codes"></a>

| Valor  | Nombre                    | Constant                                      |
| ------ | ------------------------- | --------------------------------------------- |
| `0x00` | Sin errores               | `http2.constants.NGHTTP2_NO_ERROR`            |
| `0x01` | Error de protocolo        | `http2.constants.NGHTTP2_PROTOCOL_ERROR`      |
| `0x02` | Error interno             | `http2.constants.NGHTTP2_INTERNAL_ERROR`      |
| `0x03` | Error de control de flujo | `http2.constants.NGHTTP2_FLOW_CONTROL_ERROR`  |
| `0x04` | Settings Timeout          | `http2.constants.NGHTTP2_SETTINGS_TIMEOUT`    |
| `0x05` | Stream cerrado            | `http2.constants.NGHTTP2_STREAM_CLOSED`       |
| `0x06` | Error de tamaño de frame  | `http2.constants.NGHTTP2_FRAME_SIZE_ERROR`    |
| `0x07` | Stream negado             | `http2.constants.NGHTTP2_REFUSED_STREAM`      |
| `0x08` | Cancelar                  | `http2.constants.NGHTTP2_CANCEL`              |
| `0x09` | Error de Compresión       | `http2.constants.NGHTTP2_COMPRESSION_ERROR`   |
| `0x0a` | Error de conexión         | `http2.constants.NGHTTP2_CONNECT_ERROR`       |
| `0x0b` | Enhance Your Calm         | `http2.constants.NGHTTP2_ENHANCE_YOUR_CALM`   |
| `0x0c` | Seguridad inadecuada      | `http2.constants.NGHTTP2_INADEQUATE_SECURITY` |
| `0x0d` | HTTP/1.1 Required         | `http2.constants.NGHTTP2_HTTP_1_1_REQUIRED`   |

The `'timeout'` event is emitted when there is no activity on the Server for a given number of milliseconds set using `http2server.setTimeout()`.

### http2.getDefaultSettings()

<!-- YAML
added: v8.4.0
-->

* Returns: {HTTP/2 Settings Object}

Devuelve a un objeto que contiene las configuraciones predeterminadas para una instancia de `Http2Session` . This method returns a new object instance every time it is called so instances returned may be safely modified for use.

### http2.getPackedSettings(settings)

<!-- YAML
added: v8.4.0
-->

* `settings` {HTTP/2 Settings Object}
* Returns: {Buffer}

Returns a `Buffer` instance containing serialized representation of the given HTTP/2 settings as specified in the [HTTP/2](https://tools.ietf.org/html/rfc7540) specification. This is intended for use with the `HTTP2-Settings` header field.

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
* Returns: {HTTP/2 Settings Object}

Returns a [HTTP/2 Settings Object](#http2_settings_object) containing the deserialized settings from the given `Buffer` as generated by `http2.getPackedSettings()`.

### Headers Object

Los encabezados están representados como propiedades propias sobre los objetos de JavaScript. The property keys will be serialized to lower-case. Property values should be strings (if they are not they will be coerced to strings) or an `Array` of strings (in order to send more than one value per header field).

```js
const headers = {
  ':status': '200',
  'content-type': 'text-plain',
  'ABC': ['has', 'more', 'than', 'one', 'value']
};

stream.respond(headers);
```

Los objetos de encabezado pasados a funciones de callback tendrán un prototipo `null` . This means that normal JavaScript object methods such as `Object.prototype.toString()` and `Object.prototype.hasOwnProperty()` will not work.

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
--> The 

`http2.getDefaultSettings()`, `http2.getPackedSettings()`, `http2.createServer()`, `http2.createSecureServer()`, `http2session.settings()`, `http2session.localSettings`, and `http2session.remoteSettings` APIs either return or receive as input an object that defines configuration settings for an `Http2Session` object. Estos objetos son objetos ordinarios de JavaScript que contienen las siguientes propiedades.

* `headerTableSize` {number} Especifica el número máximo de bytes utilizados para la compresión de encabezado. El valor mínimo permitido es 0. El valor máximo permitido es 2<sup>32</sup>-1. **Predeterminado:** `4,096 octets`.
* `enablePush` {boolean} Specifies `true` if HTTP/2 Push Streams are to be permitted on the `Http2Session` instances.
* `initialWindowSize` {number} Specifies the *senders* initial window size for stream-level flow control. El valor mínimo permitido es 0. El valor máximo permitido es 2<sup>32</sup>-1. **Default:** `65,535 bytes`.
* `maxFrameSize` {number} Specifies the size of the largest frame payload. El valor mínimo permitido es 16,384. El valor máximo permitido es 2<sup>24</sup>-1. **Predeterminado:** `16,384 bytes`.
* `maxConcurrentStreams` {number} Especifica el número máximo de streams concurrentes permitidos en una `Http2Session`. No hay valor predeterminado que implique, al menos teóricamente, que los streams de 2<sup>31</sup>-1 pueden abrirse de manera concurrente en cualquier tiempo dado en una `Http2Session`. El valor mínimo es 0. El valor máximo permitido es 2<sup>31</sup>-1.
* `maxHeaderListSize` {number} Specifies the maximum size (uncompressed octets) of header list that will be accepted. El valor mínimo permitido es 0. El valor máximo permitido es 2<sup>32</sup>-1. **Predeterminado:** `65535`.

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

### Invalid character handling in header names and values

The HTTP/2 implementation applies stricter handling of invalid characters in HTTP header names and values than the HTTP/1 implementation.

Header field names are *case-insensitive* and are transmitted over the wire strictly as lower-case strings. La API proporcionada por Node.js permite que los nombres de los encabezados sean establecidos como strings con mayúsculas y minúsculas (por ejemplo, `Content-Type`) pero los convertirá a minúsculas (por ejemplo, `content-type`) al ser transmitidos.

Header field-names *must only* contain one or more of the following ASCII characters: `a`-`z`, `A`-`Z`, `0`-`9`, `!`, `#`, `$`, `%`, `&`, `'`, `*`, `+`, `-`, `.`, `^`, `_`, `` ` `` (backtick), `|`, and `~`.

Using invalid characters within an HTTP header field name will cause the stream to be closed with a protocol error being reported.

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

### Supporting the CONNECT method

The `CONNECT` method is used to allow an HTTP/2 server to be used as a proxy for TCP/IP connections.

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

An HTTP/2 CONNECT proxy:

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

An HTTP/2 CONNECT client:

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

## API de compatibilidad

La API de Compatibilidad tiene el objetivo de proporcionar una experiencia para el desarrollador similar a HTTP/1 al utilizar HTTP/2, haciendo posible el desarrollo de aplicaciones que soporten [HTTP/1](http.html) y HTTP/2. Esta API sólo se dirige a la **API pública** del [HTTP/1](http.html). Sin embargo, varios módulos utilizan métodos o estado internos, y esos *no son soportados* ya que consisten en una implementación completamente diferente.

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

In order to create a mixed [HTTPS](https.html) and HTTP/2 server, refer to the [ALPN negotiation](#http2_alpn_negotiation) section. Upgrading from non-tls HTTP/1 servers is not supported.

The HTTP/2 compatibility API is composed of [`Http2ServerRequest`]() and [`Http2ServerResponse`](). They aim at API compatibility with HTTP/1, but they do not hide the differences between the protocols. Por ejemplo, se ignora el mensaje de estado para los códigos de HTTP.

### ALPN negotiation

ALPN negotiation allows supporting both [HTTPS](https.html) and HTTP/2 over the same socket. Los objetos `req` y `res` pueden ser HTTP/1 o HTTP/2, y una aplicación **debe** limitarse a la API pública de [HTTP/1](http.html), y detecta si es posible utilizar las funciones más avanzadas de HTTP/2.

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

### Class: http2.Http2ServerRequest

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

The request/response headers object.

Pares de valores-clave de nombres de encabezado y valores. Los nombres de los encabezados están en minúsculas. Ejemplo:

```js
// Prints something like:
//
// { 'user-agent': 'curl/7.22.0',
//   host: '127.0.0.1:8000',
//   accept: '*/*' }
console.log(request.headers);
```

Vea [Objeto de Encabezados de HTTP/2](#http2_headers_object).

In HTTP/2, the request path, hostname, protocol, and method are represented as special headers prefixed with the `:` character (e.g. `':path'`). Estos encabezados especiales serán incluidos en el objeto de `request.headers` . Care must be taken not to inadvertently modify these special headers or errors may occur. Por ejemplo, remover todos los encabezados de la solicitud ocasionará que ocurran errores:

```js
removeAllHeaders(request.headers);
assert(request.url);   // Fails because the :path header has been removed
```

#### request.httpVersion

<!-- YAML
added: v8.4.0
-->

* {string}

En caso de una solicitud del servidor, la versión HTTP enviada por el cliente. En el caso de la respuesta del cliente, la versión HTTP del servidor conectado al servidor. Devuelve `'2.0'`.

Además, `message.httpVersionMajor` es el primer entero y `message.httpVersionMinor` es el segundo.

#### request.method

<!-- YAML
added: v8.4.0
-->

* {string}

El método de solicitud como una string. Sólo lectura. Ejemplo: `'GET'`, `'DELETE'`.

#### request.rawHeaders

<!-- YAML
added: v8.4.0
-->

* {string[]}

The raw request/response headers list exactly as they were received.

Tenga en cuenta que las claves y los valores están en la misma lista. It is *not* a list of tuples. So, the even-numbered offsets are key values, and the odd-numbered offsets are the associated values.

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

#### request.rawTrailers

<!-- YAML
added: v8.4.0
-->

* {string[]}

The raw request/response trailer keys and values exactly as they were received. Only populated at the `'end'` event.

#### request.setTimeout(msecs, callback)

<!-- YAML
added: v8.4.0
-->

* `msecs` {number}
* `callback` {Function}
* Returns: {http2.Http2ServerRequest}

Sets the [`Http2Stream`]()'s timeout value to `msecs`. Si se proporciona un callback, entonces se agregará como un listener en el evento de `'timeout'` en el objeto de respuesta.

Si no se añade ningún listener de `'timeout'` a la solicitud, la respuesta, o al servidor, entonces los [`Http2Stream`]()s se destruirán cuando se agote su tiempo de espera. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

#### request.socket

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Returns a `Proxy` object that acts as a `net.Socket` (or `tls.TLSSocket`) but applies getters, setters, and methods based on HTTP/2 logic.

Las propiedades de `destroyed`, `readable`, y `writable` serán recuperadas desde y establecidas en `request.stream`.

Los métodos de `destroy`, `emit`, `end`, `on` y `once` serán llamados en `request.stream`.

El método de `setTimeout` será llamado en `request.stream.session`.

`pause`, `read`, `resume`, y `write` arrojarán un error con el código `ERR_HTTP2_NO_SOCKET_MANIPULATION`. Vea [`Http2Session` y Sockets][] para más información.

All other interactions will be routed directly to the socket. With TLS support, use [`request.socket.getPeerCertificate()`][] to obtain the client's authentication details.

#### request.stream

<!-- YAML
added: v8.4.0
-->

* {Http2Stream}

The [`Http2Stream`][] object backing the request.

#### request.trailers

<!-- YAML
added: v8.4.0
-->

* {Object}

The request/response trailers object. Only populated at the `'end'` event.

#### request.url

<!-- YAML
added: v8.4.0
-->

* {string}

Solicitar string de URL. Esto sólo contiene la URL que está presente en la solicitud de HTTP actual. Si la solicitud es:

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

To parse the url into its parts `require('url').parse(request.url)` can be used. Ejemplo:

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

### Class: http2.Http2ServerResponse

<!-- YAML
added: v8.4.0
-->

Este objeto es creado internamente por un servidor de HTTP — no por el usuario. Se pasa como el segundo parámetro al evento de [`'request'`][].

La respuesta implementa, pero no hereda, la interfaz del [Stream Editable](stream.html#stream_writable_streams) . Esto es un [`EventEmitter`][] con los siguientes eventos:

#### Event: 'close'

<!-- YAML
added: v8.4.0
-->

Indicates that the underlying [`Http2Stream`]() was terminated before [`response.end()`][] was called or able to flush.

#### Event: 'finish'

<!-- YAML
added: v8.4.0
-->

Emitido cuando la respuesta ha sido enviada. More specifically, this event is emitted when the last segment of the response headers and body have been handed off to the HTTP/2 multiplexing for transmission over the network. Eso no implica que el cliente no ha recibido nada aún.

Después de este evento, no se emitirán más eventos en el objeto de respuesta.

#### response.addTrailers(headers)

<!-- YAML
added: v8.4.0
-->

* `headers` {Object}

This method adds HTTP trailing headers (a header but at the end of the message) to the response.

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

#### response.connection

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Vea [`response.socket`][].

#### response.end(\[data\]\[, encoding\][, callback])

<!-- YAML
added: v8.4.0
changes:

  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18780
    description: This method now returns a reference to `ServerResponse`.
-->

* `data` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Returns: {this}

Este método señala al servidor que todos los encabezados de respuesta y el cuerpo han sido enviados; y que el servidor debería considerar este mensaje como completo. Este método, `response.end()`, DEBE ser llamado en cada respuesta.

Si se especifica `data`, es equivalente a llamar a [`response.write(data, encoding)`][] seguido por `response.end(callback)`.

Si se especifica el `callback`, será llamado cuando el stream de respuesta haya finalizado.

#### response.finished

<!-- YAML
added: v8.4.0
-->

* {boolean}

Boolean value that indicates whether the response has completed. Starts as `false`. After [`response.end()`][] executes, the value will be `true`.

#### response.getHeader(name)

<!-- YAML
added: v8.4.0
-->

* `name` {string}
* Returns: {string}

Lee un encabezado que ya ha sido puesto en cola, pero que no ha sido enviado al cliente. Note that the name is case insensitive.

Ejemplo:

```js
const contentType = response.getHeader('content-type');
```

#### response.getHeaderNames()

<!-- YAML
added: v8.4.0
-->

* Devuelve: {string[]}

Devuelve una matriz que contiene los nombres únicos de los actuales encabezados salientes. Todos los nombres de los encabezados están en minúsculas.

Ejemplo:

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

* Returns: {Object}

Returns a shallow copy of the current outgoing headers. Since a shallow copy is used, array values may be mutated without additional calls to various header-related http module methods. Las claves del objeto devuelto son los nombres de encabezado y los valores de los respectivos valores de encabezado. Todos los nombres de los encabezados están en minúsculas.

The object returned by the `response.getHeaders()` method *does not* prototypically inherit from the JavaScript `Object`. Esto significa que métodos típicos de `Object` tales como `obj.toString()`, `obj.hasOwnProperty()`, entre otros, no están definidos y *no funcionarán*.

Ejemplo:

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
* Returns: {boolean}

Devuelve `true` si el encabezado identificado por `name` está actualmente establecido en los encabezados salientes. Note that the header name matching is case-insensitive.

Ejemplo:

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

Ejemplo:

```js
response.removeHeader('Content-Encoding');
```

#### response.sendDate

<!-- YAML
added: v8.4.0
-->

* {boolean}

Al ser verdadero, la Fecha del encabezado será generada automáticamente y enviada en la respuesta si no está presente en los encabezados. Por defecto es verdadero.

This should only be disabled for testing; HTTP requires the Date header in responses.

#### response.setHeader(name, value)

<!-- YAML
added: v8.4.0
-->

* `name` {string}
* `value` {string|string[]}

Establece un único valor de encabezado para encabezados implícitos. Si este encabezado ya existe en los envíos de encabezados pendientes, su valor será reemplazado. Utilice aquí una matriz de strings para enviar varios encabezados con el mismo nombre.

Ejemplo:

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
* Returns: {http2.Http2ServerResponse}

Sets the [`Http2Stream`]()'s timeout value to `msecs`. If a callback is provided, then it is added as a listener on the `'timeout'` event on the response object.

If no `'timeout'` listener is added to the request, the response, or the server, then [`Http2Stream`]()s are destroyed when they time out. If a handler is assigned to the request, the response, or the server's `'timeout'` events, timed out sockets must be handled explicitly.

#### response.socket

<!-- YAML
added: v8.4.0
-->

* {net.Socket|tls.TLSSocket}

Returns a `Proxy` object that acts as a `net.Socket` (or `tls.TLSSocket`) but applies getters, setters, and methods based on HTTP/2 logic.

`destroyed`, `readable`, and `writable` properties will be retrieved from and set on `response.stream`.

`destroy`, `emit`, `end`, `on` and `once` methods will be called on `response.stream`.

El método de `setTimeout` será llamado en `response.stream.session`.

`pause`, `read`, `resume`, and `write` will throw an error with code `ERR_HTTP2_NO_SOCKET_MANIPULATION`. Vea [`Http2Session` y Sockets][] para más información.

All other interactions will be routed directly to the socket.

Ejemplo:

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

When using implicit headers (not calling [`response.writeHead()`][] explicitly), this property controls the status code that will be sent to the client when the headers get flushed.

Ejemplo:

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

The [`Http2Stream`][] object backing the response.

#### response.write(chunk\[, encoding\]\[, callback\])

<!-- YAML
added: v8.4.0
-->

* `chunk` {string|Buffer}
* `encoding` {string}
* `callback` {Function}
* Returns: {boolean}

If this method is called and [`response.writeHead()`][] has not been called, it will switch to implicit header mode and flush the implicit headers.

Esto envía una parte del cuerpo de la respuesta. Este método puede ser llamado varias veces para proporcionar partes sucesivas del cuerpo.

Note that in the `http` module, the response body is omitted when the request is a HEAD request. Similarly, the `204` and `304` responses *must not* include a message body.

`chunk` puede ser una string o un búfer. Si `chunk` es una string, el segundo parámetro especificará cómo codificarlo dentro de un stream de bytes. Por defecto, el `encoding` es `'utf8'`. `callback` will be called when this chunk of data is flushed.

This is the raw HTTP body and has nothing to do with higher-level multi-part body encodings that may be used.

The first time [`response.write()`][] is called, it will send the buffered header information and the first chunk of the body to the client. The second time [`response.write()`][] is called, Node.js assumes data will be streamed, and sends the new data separately. That is, the response is buffered up to the first chunk of the body.

Returns `true` if the entire data was flushed successfully to the kernel buffer. Returns `false` if all or part of the data was queued in user memory. `'drain'` will be emitted when the buffer is free again.

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

Envía un encabezado de respuesta a la solicitud. El código de estado es un código de estado de 3 dígitos, como el `404`. El último argumento, `headers`, son los encabezados de respuesta.

For compatibility with [HTTP/1](http.html), a human-readable `statusMessage` may be passed as the second argument. However, because the `statusMessage` has no meaning within HTTP/2, the argument will have no effect and a process warning will be emitted.

Ejemplo:

```js
const body = 'hello world';
response.writeHead(200, {
  'Content-Length': Buffer.byteLength(body),
  'Content-Type': 'text/plain' });
```

Tenga en cuenta que la longitud del contenido se da en bytes, no en caracteres. La API de `Buffer.byteLength()` puede ser utilizada para determinar el número de bytes en una codificación dada. On outbound messages, Node.js does not check if Content-Length and the length of the body being transmitted are equal or not. However, when receiving messages, Node.js will automatically reject messages when the Content-Length does not match the actual payload size.

Este método puede ser llamado una vez en un mensaje, como máximo, antes de que [`response.end()`][] sea llamado.

If [`response.write()`][] or [`response.end()`][] are called before calling this, the implicit/mutable headers will be calculated and call this function.

When headers have been set with [`response.setHeader()`][], they will be merged with any headers passed to [`response.writeHead()`][], with the headers passed to [`response.writeHead()`][] given precedence.

```js
// returns content-type = text/plain
const server = http2.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('X-Foo', 'bar');
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});
```

Attempting to set a header field name or value that contains invalid characters will result in a [`TypeError`][] being thrown.

#### response.createPushResponse(headers, callback)

<!-- YAML
added: v8.4.0
-->

Call [`http2stream.pushStream()`][] with the given headers, and wraps the given newly created [`Http2Stream`] on `Http2ServerRespose`.

El callback será llamado con un error con código `ERR_HTTP2_STREAM_CLOSED` si se cierra el stream.

## Collecting HTTP/2 Performance Metrics

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

* `bytesRead` {number} The number of `DATA` frame bytes received for this `Http2Stream`.
* `bytesWritten` {number} The number of `DATA` frame bytes sent for this `Http2Stream`.
* `id` {number} El identificador del `Http2Stream` asociado
* `timeToFirstByte` {number} The number of milliseconds elapsed between the `PerformanceEntry` `startTime` and the reception of the first `DATA` frame.
* `timeToFirstByteSent` {number} The number of milliseconds elapsed between the `PerformanceEntry` `startTime` and sending of the first `DATA` frame.
* `timeToFirstHeader` {number} El número de milisegundos transcurridos entre el `PerformanceEntry` `startTime` y la recepción del primer encabezado.

Si `name` es igual a `Http2Session`, el `PerformanceEntry` contendrá las siguientes propiedades adicionales:

* `bytesRead` {number} El número de bytes recibidos para este `Http2Session`.
* `bytesWritten` {number} El número de bytes enviados para este `Http2Session`.
* `framesReceived` {number} The number of HTTP/2 frames received by the `Http2Session`.
* `framesSent` {number} The number of HTTP/2 frames sent by the `Http2Session`.
* `maxConcurrentStreams` {number} The maximum number of streams concurrently open during the lifetime of the `Http2Session`.
* `pingRTT` {number} The number of milliseconds elapsed since the transmission of a `PING` frame and the reception of its acknowledgment. Solo está presente si un frame de `PING` ha sido enviado en la `Http2Session`.
* `streamAverageDuration` {number} La duración promedio (en milisegundos) para todas las instancias de `Http2Stream` .
* `streamCount` {number} El número de instancias de `Http2Stream` procesadas por la `Http2Session`.
* `type` {string} Either `'server'` or `'client'` to identify the type of `Http2Session`.