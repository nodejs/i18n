# TLS (SSL)

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El `tls` proporciona una implementación de los protocolos Transport Layer Security (TLS) y Secure Socket Layer (SSL) que se construyen sobre OpenSSL. Se puede acceder al módulo utilizando:

```js
const tls = require('tls');
```

## Conceptos de TLS/SSL

El TLS/SSL es una infraestructura de clave pública/privada (PKI por sus siglas en inglés). Para los casos más comunes, cada cliente y servidor deben tener una *clave privada*.

Las claves privadas pueden ser generadas de múltiples formas. El siguiente ejemplo ilustra el uso de la interfaz de línea de comandos de OpenSSL para generar una clave privada RSA de 2048 bits:

```sh
openssl genrsa -out ryans-key.pem 2048
```

Con TLS/SSL, todos los servidores (y algunos clientes) deben tener un *certificado*. Los certificados son *claves públicas* que corresponden a una clave privada, y que están firmadas digitalmente por una Autoridad de Certificación o por el propietario de la clave privada (dichos certificados están referidos como "auto-firmados"). El primer paso para obtener un certificado es crear un archivo de *Solicitud de Firma de Certificado*(CSR).

La interfaz de línea de comandos de OpenSSL puede ser usada para generar un CRS para una clave privada:

```sh
openssl req -new -sha256 -key ryans-key.pem -out ryans-csr.pem
```

Una vez que se genera el archivo CRS, puede ser enviado a una Autoridad Certificadora para su firma o utilizado para generar un certificado auto-firmado.

La creación de un certificado auto-firmado utilizando la interfaz de línea de comandos OpenSSL se ilustra en el siguiente ejemplo:

```sh
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

Una vez que se genera el certificado, puede ser utilizado para generar un archivo`.pfx ` o `.p12`:

```sh
openssl pkcs12 -export -in ryans-cert.pem -inkey ryans-key.pem \
      -certfile ca-cert.pem -out ryans.pfx
```

Donde:

* `in`: es el certificado firmado
* `inkey`: es la clave privada asociada
* `certfile`: es una concatenación de todos los certificados de la Autoridad de Certificación (CA) en un único archivo, `cat ca1-cert.pem ca2-cert.pem > ca-cert.pem`

### Perfect Forward Secrecy

<!-- type=misc -->

El término "[Forward Secrecy](https://en.wikipedia.org/wiki/Perfect_forward_secrecy)" or "Perfect Forward Secrecy" describe una característica de los métodos de acuerdo de clave (p,ej, intercambio de claves). Es decir, las claves de servidor y cliente son utilizadas para negociar nuevas claves temporales que son utilizadas específicamente y solo para la sesión de comunicación actual. En la práctica, esto significa que incluso si la clave privada del servidor está comprometida, la comunicación solo puede ser descifrada por intrusos si el atacante logra obtener el par de claves generadas específicamente para la sesión.

Perfect Forward Secrecy se logra generando de manera aleatoria un par de claves para el acuerdo de claves en cada establecimiento de comunicación de TLS/SSL (en vez de usar la misma clave para todas las sesiones). Los métodos que implementan esta técnica son llamados "efímeros".

Actualmente, se utilizan dos métodos para lograr el Perfect Forward Secrecy (tenga en cuenta el carácter "E" añadido a las abreviaturas tradicionales):

* [DHE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) -Una versión efímera del protocolo de acuerdo de claves Diffie Hellman.
* [ECDHE](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) Una versión efímera del protocolo de acuerdo de claves Diffie Hellman de Curva Elíptica.

Los métodos efímeros pueden tener algunos inconvenientes de rendimiento, porque la generación de claves es costosa.

Para utilizar el Perfect Forward Secrecy usando `DHE` con el módulo `DHE`, se requiere generar parámetros de Diffie-Hellman y especificarlos con la opción `dhparam` de [`tls.createSecureContext()`][]. A continuación se ilustra el uso de la interfaz de línea de comandos de OpenSSL para generar dichos parámetros:

```sh
openssl dhparam -outform PEM -out dhparam.pem 2048
```

Si se utiliza Perfect Forward Secrecy usando `ECDHE`, no se requieren los parámetros de Diffie-Hellman y se usará una curva ECDHE predeterminada. La propiedad `ecdhCurve` puede ser usada al crear un Servidor TLS para especificar la lista de nombres de curvas admitidas para utilizar, ver [`tls.createServer()`] para mayor información.

### ALPN y SNI

<!-- type=misc -->

ALPN (Application Layer Protocol Negotiation Extension) y SNI (Server Name Indication) son extensiones de protocolo de enlace de TLS:

* ALPN - Permite el uso de un servidor TLS para múltiples protocolos (HTTP, HTTP/2)
* SNI - Permite el uso de un servidor TLS para múltiples nombres de host con diferentes certificados SSL.

### Mitigación del ataque de renegociación iniciado por el cliente

<!-- type=misc -->

El protocolo TLS permite a los clientes renegociar ciertos aspectos de la sesión TLS. Desafortunadamente, la renegociación de la sesión requiere una cantidad desproporcionada de recursos del lado del servidor, lo que lo convierte en un vector potencial para los ataques de denegación de servicio.

Para mitigar el riesgo, la renegociación se limita a tres veces cada diez minutos. Se emite un evento `'error'` en la instancia [`tls.TLSSocket`][] cuando se excede este umbral. Los límites son configurables:

* `tls.CLIENT_RENEG_LIMIT` {number} Específica el número de solicitudes de renegociación. **Predeterminado:** `3`.
* `tls.CLIENT_RENEG_WINDOW` {number} Especifica la ventana de renegociación del tiempo en segundos. **Predeterminado:** `600` (10 minutes).

Los límites de renegociación predeterminados no deben modificarse sin un completo entendimiento de las implicaciones y los riesgos.

### Session Resumption

Establishing a TLS session can be relatively slow. The process can be sped up by saving and later reusing the session state. There are several mechanisms to do so, discussed here from oldest to newest (and preferred).

***Session Identifiers*** Servers generate a unique ID for new connections and send it to the client. Clients and servers save the session state. When reconnecting, clients send the ID of their saved session state and if the server also has the state for that ID, it can agree to use it. Otherwise, the server will create a new session. See [RFC 2246](https://www.ietf.org/rfc/rfc2246.txt) for more information, page 23 and
30.

Resumption using session identifiers is supported by most web browsers when making HTTPS requests.

For Node.js, clients must call [`tls.TLSSocket.getSession()`][] after the [`'secureConnect'`][] event to get the session data, and provide the data to the `session` option of [`tls.connect()`][] to reuse the session. Servers must implement handlers for the [`'newSession'`][] and [`'resumeSession'`][] events to save and restore the session data using the session ID as the lookup key to reuse sessions. To reuse sessions across load balancers or cluster workers, servers must use a shared session cache (such as Redis) in their session handlers.

***Session Tickets*** The servers encrypt the entire session state and send it to the client as a "ticket". When reconnecting, the state is sent to the server in the initial connection. This mechanism avoids the need for server-side session cache. If the server doesn't use the ticket, for any reason (failure to decrypt it, it's too old, etc.), it will create a new session and send a new ticket. See [RFC 5077](https://tools.ietf.org/html/rfc5077) for more information.

Resumption using session tickets is becoming commonly supported by many web browsers when making HTTPS requests.

For Node.js, clients use the same APIs for resumption with session identifiers as for resumption with session tickets. For debugging, if [`tls.TLSSocket.getTLSTicket()`][] returns a value, the session data contains a ticket, otherwise it contains client-side session state.

Single process servers need no specific implementation to use session tickets. To use session tickets across server restarts or load balancers, servers must all have the same ticket keys. There are three 16-byte keys internally, but the tls API exposes them as a single 48-byte buffer for convenience.

Its possible to get the ticket keys by calling [`server.getTicketKeys()`][] on one server instance and then distribute them, but it is more reasonable to securely generate 48 bytes of secure random data and set them with the `ticketKeys` option of [`tls.createServer()`][]. The keys should be regularly regenerated and server's keys can be reset with [`server.setTicketKeys()`][].

Session ticket keys are cryptographic keys, and they ***must be stored securely***. With TLS 1.2 and below, if they are compromised all sessions that used tickets encrypted with them can be decrypted. They should not be stored on disk, and they should be regenerated regularly.

If clients advertise support for tickets, the server will send them. The server can disable tickets by supplying `require('constants').SSL_OP_NO_TICKET` in `secureOptions`.

Both session identifiers and session tickets timeout, causing the server to create new sessions. The timeout can be configured with the `sessionTimeout` option of [`tls.createServer()`][].

For all the mechanisms, when resumption fails, servers will create new sessions. Since failing to resume the session does not cause TLS/HTTPS connection failures, it is easy to not notice unnecessarily poor TLS performance. The OpenSSL CLI can be used to verify that servers are resuming sessions. Use the `-reconnect` option to `openssl s_client`, for example:

```sh
$ openssl s_client -connect localhost:443 -reconnect
```

Read through the debug output. The first connection should say "New", for example:

```text
New, TLSv1.2, Cipher is ECDHE-RSA-AES128-GCM-SHA256
```

Subsequent connections should say "Reused", for example:

```text
Reused, TLSv1.2, Cipher is ECDHE-RSA-AES128-GCM-SHA256
```

## Modificar el conjunto de Cifrado TLS Predeterminado

Node.js se crea con un conjunto predeterminado de cifrados TLS habilitados y deshabilitados. Actualmente, el conjunto de cifrado predeterminado es:

```txt
ECDHE-RSA-AES128-GCM-SHA256:
ECDHE-ECDSA-AES128-GCM-SHA256:
ECDHE-RSA-AES256-GCM-SHA384:
ECDHE-ECDSA-AES256-GCM-SHA384:
DHE-RSA-AES128-GCM-SHA256:
ECDHE-RSA-AES128-SHA256:
DHE-RSA-AES128-SHA256:
ECDHE-RSA-AES256-SHA384:
DHE-RSA-AES256-SHA384:
ECDHE-RSA-AES256-SHA256:
DHE-RSA-AES256-SHA256:
HIGH:
!aNULL:
!eNULL:
!EXPORT:
!DES:
!RC4:
!MD5:
!PSK:
!SRP:
!CAMELLIA
```

This default can be replaced entirely using the [`--tls-cipher-list`][] command line switch (directly, or via the [`NODE_OPTIONS`][] environment variable). For instance, the following makes `ECDHE-RSA-AES128-GCM-SHA256:!RC4` the default TLS cipher suite:

```sh
node --tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4" server.js

export NODE_OPTIONS=--tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4"
node server.js
```

El valor predeterminado también se puede reemplazar por cliente o servidor utilizando la opción `ciphers` de [`tls.createSecureContext()`][], que también está disponible en [`tls.createServer()`], [`tls.connect()`] y al crear nuevos [`tls.TLSSocket`].

Consulte [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.1.0/apps/ciphers.html#CIPHER-LIST-FORMAT) para más detalles sobre el formato.

El conjunto de cifrado predeterminado incluido en Node.js se ha seleccionado cuidadosamente para reflejar las mejores prácticas de seguridad actuales y la mitigación de riesgos. Cambiar el conjunto de cifrado predeterminado puede tener un impacto significativo en la seguridad de una aplicación. El modificador `--tls-cipher-list` y la opción `ciphers` deben usarse solo si es absolutamente necesario.

The default cipher suite prefers GCM ciphers for [Chrome's 'modern cryptography' setting] and also prefers ECDHE and DHE ciphers for Perfect Forward Secrecy, while offering *some* backward compatibility.

128 bit AES is preferred over 192 and 256 bit AES in light of [specific attacks affecting larger AES key sizes].

Los clientes antiguos que dependen de cifrados inseguros y obsoletos RC4 o basados en DES (como Internet Explorer 6) no pueden completar el proceso de establecimiento de la comunicación con la configuración predeterminada. Si estos clientes _deben_ ser compatibles, las [recomendaciones de TLS ](https://wiki.mozilla.org/Security/Server_Side_TLS) pueden ofrecer un paquete de cifrado compatible. Para más detalles sobre el formato, visite [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.1.0/apps/ciphers.html#CIPHER-LIST-FORMAT).

## Clase: tls.Server
<!-- YAML
added: v0.3.2
-->

La clase `tls.Server` es una subclase de `net.Server` que acepta conexiones encriptadas mediante TLS o SSL.

### Evento: 'newSession'
<!-- YAML
added: v0.9.2
-->

El evento `'newSession'` se emite al crear una nueva sesión de TLS. Esto puede ser usado para almacenar sesiones en el almacenamiento externo. The data should be provided to the [`'resumeSession'`][] callback.

El listener callback recibe tres argumentos cuando se le llama:

* `sessionId` {Buffer} The TLS session identifier
* `sessionData` {Buffer} The TLS session data
* `callback` {Function} Una función callback que no toma argumentos que debe ser invocada para que los datos se envíen o reciban sobre una conexión segura.

Escuchar este evento tendrá un efecto solo en las conexiones establecidas después de la adición del listener del evento.

### Evento: 'OCSPRequest'
<!-- YAML
added: v0.11.13
-->

El evento `'OCSPRequest'` se emite cuando el cliente envía una solicitud de estado de certificado. El listener callback recibe tres argumentos cuando se le llama:

* `certificate` {Buffer} El certificado del servidor
* `issuer` {Buffer} El certificado del emisor
* `callback` {Function} Una función callback que debe ser invocada para proporcionar los resultados de la solicitud OCSP.

El certificado actual del servidor se puede analizar para obtener la URL OCSP y la identificación del certificado; después de obtener una respuesta OCSP, se invoca `callback(null, resp)`, donde `resp` es una instancia `Buffer` que contiene la respuesta OCSP. Tanto el `certificate` como el `issuer` son representaciones `Buffer` DER de los certificados primarios y del emisor. Estos pueden usarse para obtener el ID del certificado OCSP y el URL del punto final OCSP.

Alternativamente, puede llamarse a `callback(null, null)` para indicar que no hubo respuesta OCSP.

Llamar a `callback(err)` dará como resultado una llamada `socket.destroy(err)`.

El flujo típico de una Solicitud OCSP es el siguiente:

1. Client connects to the server and sends an `'OCSPRequest'` (via the status info extension in ClientHello).
2. Server receives the request and emits the `'OCSPRequest'` event, calling the listener if registered.
3. Server extracts the OCSP URL from either the `certificate` or `issuer` and performs an [OCSP request](https://en.wikipedia.org/wiki/OCSP_stapling) to the CA.
4. Server receives `'OCSPResponse'` from the CA and sends it back to the client via the `callback` argument
5. Client validates the response and either destroys the socket or performs a handshake.

El `issuer` puede ser `null` si el certificado está autofirmado o el emisor no está en la lista de certificados de origen. (Se puede proporcionar un emisor a través de la opción `ca` al establecer la conexión TLS.)

Escuchar este evento tendrá un efecto solo en las conexiones establecidas después de la adición del listener del evento.

Se puede usar un módulo npm como [asn1.js](https://www.npmjs.com/package/asn1.js) para analizar los certificados.

### Evento: 'resumeSession'
<!-- YAML
added: v0.9.2
-->

El evento `'resumeSession'` se emite cuando el cliente solicita reanudar una sesión anterior de TLS. El listener callback recibe dos argumentos cuando se le llama:

* `sessionId` {Buffer} The TLS session identifier
* `callback` {Function} A callback function to be called when the prior session has been recovered: `callback([err[, sessionData]])`
  * `err` {Error}
  * `sessionData` {Buffer}

The event listener should perform a lookup in external storage for the `sessionData` saved by the [`'newSession'`][] event handler using the given `sessionId`. If found, call `callback(null, sessionData)` to resume the session. If not found, the session cannot be resumed. `callback()` must be called without `sessionData` so that the handshake can continue and a new session can be created. It is possible to call `callback(err)` to terminate the incoming connection and destroy the socket.

Escuchar este evento tendrá un efecto solo en las conexiones establecidas después de la adición del listener del evento.

Lo siguiente ilustra la reanudación de una sesión de TLS:

```js
const tlsSessionStore = {};
server.on('newSession', (id, data, cb) => {
  tlsSessionStore[id.toString('hex')] = data;
  cb();
});
server.on('resumeSession', (id, cb) => {
  cb(null, tlsSessionStore[id.toString('hex')] || null);
});
```

### Evento: 'secureConnection'
<!-- YAML
added: v0.3.2
-->

El evento `'secureConnection'` se emite después del proceso de establecimiento de conexión para que una nueva conexión se haya completado con éxito. The listener callback pasa un solo argumento cuando se le llama:

* `tlsSocket` {tls.TLSSocket} El socket TLS establecido.

La propiedad `tlsSocket.authorized` es un `boolean` que indica si el cliente ha sido verificado por una de las Autoridades de Certificación suministradas para el servidor. Si `tlsSocket.authorized` es `falso`, entonces `socket.authorizationError` está configurado para describir cómo falló la autorización. Tenga en cuenta que, dependiendo de la configuración del servidor TLS, aún se pueden aceptar conexiones no autorizadas.

La propiedad `tlsSocket.alpnProtocol` es una cadena que contiene el protocolo ALPN seleccionado. Cuando ALPN no tiene un protocolo seleccionado, `tlsSocket.alpnProtocol` es igual a `false`.

La propiedad `tlsSocket.servername` es una cadena que contiene el nombre del servidor solicitado a través de SNI.

### Evento: 'tlsClientError'
<!-- YAML
added: v6.0.0
-->

El evento `'tlsClientError'` se emite cuando se produce un error antes de que se establezca una conexión segura. El listener callback recibe dos argumentos cuando se le llama:

* `exception` {Error} El objeto `Error` que describe el error
* `tlsSocket` {tls.TLSSocket} La instancia `tls.TLSSocket` de la cual se originó el error.

### server.addContext(hostname, context)
<!-- YAML
added: v0.5.3
-->

* `hostname` {string} Un nombre de host o comodín del SNI (p.ej., `'*'`)
* `context` {Object} Un objeto que contiene cualquiera de las posibles propiedades de los argumentos `options` de [`tls.createSecureContext()`][] (p.ej., `key`, `cert`, `ca`, etc).

The `server.addContext()` method adds a secure context that will be used if the client request's SNI name matches the supplied `hostname` (or wildcard).

### server.address()
<!-- YAML
added: v0.6.0
-->

* Devuelve: {Object}

Devuelve la dirección enlazada, el apellido de la dirección y el puerto del servidor según lo informado por el sistema operativo. Ver [`net.Server.address()`][] para más información.

### server.close([callback])
<!-- YAML
added: v0.3.2
-->

* `callback` {Function} A listener callback that will be registered to listen for the server instance's `'close'` event.
* Devuelve: {tls.Server}

El método `server.close()` evita que el servidor acepte nuevas conexiones.

Esta función funciona de forma asíncrona. El evento `'close'` se emitirá cuando el servidor no tenga más conexiones abiertas.

### server.connections
<!-- YAML
added: v0.3.2
deprecated: v0.9.7
-->

> Estabilidad: 0 - Desaprobado: Use [`server.getConnections()`][] en su lugar.

* {number}

Devuelve el número actual de conexiones simultáneas en el servidor.

### server.getTicketKeys()
<!-- YAML
added: v3.0.0
-->

* Returns: {Buffer} A 48-byte buffer containing the session ticket keys.

Returns the session ticket keys.

See [Session Resumption](#tls_session_resumption) for more information.

### server.listen()

Inicia el servidor escuchando conexiones encriptadas. Este método es idéntico a [`server.listen()`][] de [`net.Server`][].

### server.setTicketKeys(keys)
<!-- YAML
added: v3.0.0
-->

* `keys` {Buffer} A 48-byte buffer containing the session ticket keys.

Sets the session ticket keys.

Los cambios en las claves de ticket son efectivos solo para futuras conexiones de servidor. Las conexiones de servidor existentes o actualmente pendientes usarán las claves anteriores.

See [Session Resumption](#tls_session_resumption) for more information.

## Class: tls.TLSSocket
<!-- YAML
added: v0.11.4
-->

El `tls.TLSSocket` es una subclase de [`net.Socket`][] que realiza un cifrado transparente de los datos escritos y todas las negociaciones de TLS necesarias.

Las instancias de `tls.TLSSocket` implementan la interfaz dúplex [Stream](stream.html#stream_stream).

Métodos que devuelven los metadatos de conexión TLS (por ejemplo [`tls.TLSSocket.getPeerCertificate()`][] solo devolverá los datos mientras la conexión esté abierta.

### new tls.TLSSocket(socket[, options])
<!-- YAML
added: v0.11.4
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `socket` {net.Socket|stream.Duplex} En el lado del servidor, cualquier flujo `Duplex`. En el lado del cliente, cualquier instancia de [`net.Socket`][] (para el soporte genérico `Duplex` en el lado del cliente, [`tls.connect()`][] debe ser utilizado).
* `opciones` {Object}
  * `isServer`: El protocolo SSL/TLS es asimétrico. TLSSockets debe saber si deben comportarse como un servidor o un cliente. Si `true`, se creará una instancia del socket TLS como servidor. **Predeterminado:** `false`.
  * `server` {net.Server} A [`net.Server`][] instance.
  * `requestCert`: Ya sea para autenticar, o no, al peer remoto solicitando un certificado. Los clientes siempre solicitan un certificado de servidor. Servers (`isServer` is true) may set `requestCert` to true to request a client certificate.
  * `rejectUnauthorized`: See [`tls.createServer()`][]
  * `ALPNProtocols`: See [`tls.createServer()`][]
  * `SNICallback`: See [`tls.createServer()`][]
  * `session` {Buffer} A `Buffer` instance containing a TLS session.
  * `requestOCSP` {boolean} Si es `true`, especifica que la extensión de solicitud de estado OCSP se agregará al hola del cliente y se emitirá un evento `'OCSPResponse'` en el socket antes de establecer una comunicación segura
  * `secureContext`: TLS context object created with [`tls.createSecureContext()`][]. Si _no_ se proporciona un `secureContext`, se creará uno pasando el objeto entero `options` a `tls.createSecureContext()`.
  * ...: [`tls.createSecureContext()`][] options that are used if the `secureContext` option is missing. Otherwise, they are ignored.

Construya un nuevo objeto `tls.TLSSocket` desde un socket TCP existente.

### Evento: 'OCSPResponse'
<!-- YAML
added: v0.11.13
-->

El evento `'OCSPResponse'` se emite si la opción `requestOCSP` se configuró cuando se creó `tls.TLSSocket` y se recibió una respuesta OCSP. El listener callback pasa un solo argumento cuando se le llama:

* `response` {Buffer} La respuesta OCSP del servidor

Normalmente, la `response` es un objeto firmado digitalmente de la CA del servidor que contiene información sobre el estado de revocación del certificado del servidor.

### Evento: 'secureConnect'
<!-- YAML
added: v0.11.4
-->

El evento `'secureConnect'` se emite después de que el proceso de establecimiento de comunicación para una nueva conexión se haya completado con éxito. Se llamará al listener callback independientemente de si el certificado del servidor ha sido autorizado o no. Es responsabilidad del cliente verificar la propiedad `tlsSocket.authorized` para determinar si el certificado del servidor fue firmado por una de las CA especificadas. Si `tlsSocket.authorized === false`, se puede encontrar el error examinando la propiedad `tlsSocket.authorizationError`. Si se utilizó ALPN, se puede verificar la propiedad `tlsSocket.alpnProtocol` para determinar el protocolo negociado.

### tlsSocket.address()
<!-- YAML
added: v0.11.4
-->

* Devuelve: {Object}

Devuelve la `address` enlazada, el nombre de la `family` de direcciones y el `port` del socket subyacente, del modo que es reportado por el sistema operativo: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

### tlsSocket.authorizationError
<!-- YAML
added: v0.11.4
-->

Devuelve la razón por la cual el certificado del peer no ha sido verificado. Esta propiedad se establece solo cuando `tlsSocket.authorized === false`.

### tlsSocket.authorized
<!-- YAML
added: v0.11.4
-->

* Devuelve: {boolean}

Devuelve `true` si el certificado peer fue firmado por una de las CA especificadas al crear la instancia `tls.TLSSocket`, de lo contrario `false`.

### tlsSocket.disableRenegotiation()
<!-- YAML
added: v8.4.0
-->

Deshabilita la renegociación de TLS para la instancia `TLSSocket`. Una vez llamado, los intentos de renegociar desencadenarán un evento `'error'` en el `TLSSocket `.

### tlsSocket.encrypted
<!-- YAML
added: v0.11.4
-->

Siempre devuelve `true`. Esto se puede usar para distinguir los sockets TLS de las instancias normales de `net.Socket`.

### tlsSocket.getCipher()
<!-- YAML
added: v0.11.4
-->

* Devuelve: {Object}

Devuelve un objeto que representa el nombre de cifrado. La clave `version` es un campo heredado que siempre contiene el valor `'TLSv1/SSLv3'`.

Por ejemplo: `{ name: 'AES256-SHA', version: 'TLSv1/SSLv3' }`.

See `SSL_CIPHER_get_name()` in [https://www.openssl.org/docs/man1.1.0/ssl/SSL_CIPHER_get_name.html](https://www.openssl.org/docs/man1.1.0/ssl/SSL_CIPHER_get_name.html) for more information.

### tlsSocket.getEphemeralKeyInfo()
<!-- YAML
added: v5.0.0
-->

* Devuelve: {Object}

Devuelve un objeto que representa el tipo, nombre y tamaño del parámetro de un intercambio de clave efímera en [Perfect Forward Secrecy](#tls_perfect_forward_secrecy) en una conexión de cliente. Devuelve un objeto vacío cuando el intercambio de claves no es efímero. Como esto solo se admite en un socket de cliente; se devuelve `null` si se llama a un socket de servidor. Los tipos soportados son `'DH'` y `'ECDH'`. La propiedad `name` está disponible solo cuando el tipo es `'ECDH'`.

Por ejemplo: `{ type: 'ECDH', name: 'prime256v1', size: 256 }`.

### tlsSocket.getFinished()
<!-- YAML
added: v9.9.0
-->

* Devuelve: {Buffer|undefined} El último mensaje `Finished` que se ha enviado al socket como parte de un protocolo de enlace SSL/TLS, o `undefined` si aún no se ha enviado ningún mensaje `Finished`.

Como los mensajes `Finished` son resúmenes de mensajes del protocolo de enlace completo (con un total de 192 bits para TLS 1.0 y más para SSL 3.0), se pueden usar para procedimientos de autenticación externos cuando la autenticación proporcionada por SSL/TLS no es deseada o no es suficiente.

Corresponde a la rutina `SSL_get_finished` en OpenSSL y se puede usar para implementar el enlace de canal `tls-unique` desde [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getPeerCertificate([detailed])
<!-- YAML
added: v0.11.4
-->

* `detailed` {boolean} Incluya la cadena de certificados completa si `true`, de lo contrario incluya solo el certificado del peer.
* Devuelve: {Object}

Devuelve un objeto que representa el certificado del par. El objeto devuelto tiene algunas propiedades que corresponden a los campos del certificado.

Si se solicitó la cadena de certificados completa, cada certificado incluirá una propiedad `issuerCertificate` que contiene un objeto que representa el certificado de su emisor.

```text
{ subject:
   { C: 'UK',
     ST: 'Acknack Ltd',
     L: 'Rhys Jones',
     O: 'node.js',
     OU: 'Test TLS Certificate',
     CN: 'localhost' },
  issuer:
   { C: 'UK',
     ST: 'Acknack Ltd',
     L: 'Rhys Jones',
     O: 'node.js',
     OU: 'Test TLS Certificate',
     CN: 'localhost' },
  issuerCertificate:
   { ... another certificate, possibly with an .issuerCertificate ... },
  raw: < RAW DER buffer >,
  pubkey: < RAW DER buffer >,
  valid_from: 'Nov 11 09:52:22 2009 GMT',
  valid_to: 'Nov 6 09:52:22 2029 GMT',
  fingerprint: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF',
  fingerprint256: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF:00:11:22:33:44:55:66:77:88:99:AA:BB',
  serialNumber: 'B9B0D332A1AA5635' }
```

Si los pares no proporcionan un certificado, se devolverá un objeto vacío.

### tlsSocket.getPeerFinished()
<!-- YAML
added: v9.9.0
-->

* Devuelve: {Buffer|undefined} El último mensaje `Finished` que se espera o se ha recibido realmente del socket como parte de un protocolo de enlace SSL/TLS, o `undefined` si no existe ningún mensaje `Finished` hasta el momento.

Como los mensajes `Finished` son resúmenes de mensajes del protocolo de enlace completo (con un total de 192 bits para TLS 1.0 y más para SSL 3.0), se pueden usar para procedimientos de autenticación externos cuando la autenticación proporcionada por SSL/TLS no es deseada o no es suficiente.

Corresponde a la rutina `SSL_get_peer_finished` en OpenSSL y se puede usar para implementar el enlace de canal `tls-unique` de [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getProtocol()
<!-- YAML
added: v5.7.0
-->

* Devuelve: {string|null}

Devuelve una cadena que contiene la versión negociada del protocolo SSL/TLS de la conexión actual. El valor `'unknown'` se devolverá para sockets conectados que no hayan completado el proceso de establecimiento de comunicación. El valor `null` se devolverá para sockets de servidor o sockets de cliente desconectados.

Protocol versions are:

* `'TLSv1'`
* `'TLSv1.1'`
* `'TLSv1.2'`
* `'SSLv3'`

See [https://www.openssl.org/docs/man1.1.0/ssl/SSL_get_version.html](https://www.openssl.org/docs/man1.1.0/ssl/SSL_get_version.html) for more information.

### tlsSocket.getSession()
<!-- YAML
added: v0.11.4
-->

* {Buffer}

Returns the TLS session data or `undefined` if no session was negotiated. On the client, the data can be provided to the `session` option of [`tls.connect()`][] to resume the connection. On the server, it may be useful for debugging.

See [Session Resumption](#tls_session_resumption) for more information.

### tlsSocket.getTLSTicket()
<!-- YAML
added: v0.11.4
-->

* {Buffer}

For a client, returns the TLS session ticket if one is available, or `undefined`. For a server, always returns `undefined`.

It may be useful for debugging.

See [Session Resumption](#tls_session_resumption) for more information.

### tlsSocket.isSessionReused()
<!-- YAML
added: v0.5.6
-->

* Returns: {boolean} `true` if the session was reused, `false` otherwise.

See [Session Resumption](#tls_session_resumption) for more information.

### tlsSocket.localAddress
<!-- YAML
added: v0.11.4
-->

* {string}

Devuelve la representación de cadena de la dirección IP local.

### tlsSocket.localPort
<!-- YAML
added: v0.11.4
-->

* {number}

Devuelve la representación numérica del puerto local.

### tlsSocket.remoteAddress
<!-- YAML
added: v0.11.4
-->

* {string}

Devuelve la representación de cadena de la dirección IP remota. Por ejemplo, `'74.125.127.100'` o `'2001:4860:a005::68'`.

### tlsSocket.remoteFamily
<!-- YAML
added: v0.11.4
-->

* {string}

Devuelve la representación de cadena de la familia de IP remota. `'IPv4'` or `'IPv6'`.

### tlsSocket.remotePort
<!-- YAML
added: v0.11.4
-->

* {number}

Devuelve la representación numérica del puerto remoto. Por ejemplo, `443`.

### tlsSocket.renegotiate(opciones, callback)
<!-- YAML
added: v0.11.8
-->

* `opciones` {Object}
  * `rejectUnauthorized` {boolean} Si no es `false`, el certificado del servidor se verifica con la lista de CA proporcionadas. Se produce un evento `'error'` si la verificación falla; `err.code` contiene el código de error OpenSSL. **Predeterminado:** `true`.
  * `requestCert`
* `callback` {Function} Una función que se invocará cuando se haya completado la solicitud de renegociación.

El método `tlsSocket.renegotiate()` inicia un proceso de renegociación de TLS. Una vez completada, la función `callback` recibirá un único argumento que es un `Error` (si la solicitud falló) o `null`.

Este método se puede usar para solicitar el certificado de un peer después de que se haya establecido la conexión segura.

Cuando se ejecuta como servidor, el socket se destruirá con un error después del tiempo de espera de `handshakeTimeout`.

### tlsSocket.setMaxSendFragment(size)
<!-- YAML
added: v0.11.11
-->

* `size` {number} El tamaño máximo de fragmento TLS. El valor máximo es `16384`. **Predeterminado:** `16384`.
* Devuelve: {boolean}

El método `tlsSocket.setMaxSendFragment()` establece el tamaño máximo del fragmento TLS. Devuelve `true` si se establece correctamente el límite; de lo contrario `false`.

Los tamaños de fragmentos más pequeños disminuyen la latencia del buffer en el cliente: la capa TLS amortigua los fragmentos más grandes hasta que se recibe el fragmento completo y se verifica su integridad; los fragmentos grandes pueden abarcar múltiples recorridos de ida y vuelta y su procesamiento puede retrasarse debido a la pérdida o reordenación de paquetes. Sin embargo, los fragmentos más pequeños agregan bytes adicionales de trama TLS y sobrecarga de CPU, lo que puede disminuir el rendimiento general del servidor.

## tls.checkServerIdentity(hostname, cert)
<!-- YAML
added: v0.8.4
-->

* `hostname` {string} The host name or IP address to verify the certificate against.
* `cert` {Object} Un objeto que representa el certificado del peer. El objeto devuelto tiene algunas propiedades correspondientes a los campos del certificado.
* Devuelve: {Error|undefined}

Verifies the certificate `cert` is issued to `hostname`.

Returns {Error} object, populating it with `reason`, `host`, and `cert` on failure. En caso de éxito, devuelve {undefined}.

Esta función se puede sobrescribir proporcionando una función alternativa como parte de la opción `options.checkServerIdentity` pasada a `tls.connect()`. La función de sobreescritura puede invocar a `tls.checkServerIdentity()`, por supuesto, para aumentar las comprobaciones realizadas con verificación adicional.

Esta función solo se invoca si el certificado pasa el resto de las comprobaciones, como las emitidas por la CA de confianza (`options.ca`).

El objeto cert contiene el certificado analizado y tendrá una estructura similar a:

```text
{ subject:
   { OU: [ 'Domain Control Validated', 'PositiveSSL Wildcard' ],
     CN: '*.nodejs.org' },
  issuer:
   { C: 'GB',
     ST: 'Greater Manchester',
     L: 'Salford',
     O: 'COMODO CA Limited',
     CN: 'COMODO RSA Domain Validation Secure Server CA' },
  subjectaltname: 'DNS:*.nodejs.org, DNS:nodejs.org',
  infoAccess:
   { 'CA Issuers - URI':
      [ 'http://crt.comodoca.com/COMODORSADomainValidationSecureServerCA.crt' ],
     'OCSP - URI': [ 'http://ocsp.comodoca.com' ] },
  modulus: 'B56CE45CB740B09A13F64AC543B712FF9EE8E4C284B542A1708A27E82A8D151CA178153E12E6DDA15BF70FFD96CB8A88618641BDFCCA03527E665B70D779C8A349A6F88FD4EF6557180BD4C98192872BCFE3AF56E863C09DDD8BC1EC58DF9D94F914F0369102B2870BECFA1348A0838C9C49BD1C20124B442477572347047506B1FCD658A80D0C44BCC16BC5C5496CFE6E4A8428EF654CD3D8972BF6E5BFAD59C93006830B5EB1056BBB38B53D1464FA6E02BFDF2FF66CD949486F0775EC43034EC2602AEFBF1703AD221DAA2A88353C3B6A688EFE8387811F645CEED7B3FE46E1F8B9F59FAD028F349B9BC14211D5830994D055EEA3D547911E07A0ADDEB8A82B9188E58720D95CD478EEC9AF1F17BE8141BE80906F1A339445A7EB5B285F68039B0F294598A7D1C0005FC22B5271B0752F58CCDEF8C8FD856FB7AE21C80B8A2CE983AE94046E53EDE4CB89F42502D31B5360771C01C80155918637490550E3F555E2EE75CC8C636DDE3633CFEDD62E91BF0F7688273694EEEBA20C2FC9F14A2A435517BC1D7373922463409AB603295CEB0BB53787A334C9CA3CA8B30005C5A62FC0715083462E00719A8FA3ED0A9828C3871360A73F8B04A4FC1E71302844E9BB9940B77E745C9D91F226D71AFCAD4B113AAF68D92B24DDB4A2136B55A1CD1ADF39605B63CB639038ED0F4C987689866743A68769CC55847E4A06D6E2E3F1',
  exponent: '0x10001',
  pubkey: <Buffer ... >,
  valid_from: 'Aug 14 00:00:00 2017 GMT',
  valid_to: 'Nov 20 23:59:59 2019 GMT',
  fingerprint: '01:02:59:D9:C3:D2:0D:08:F7:82:4E:44:A4:B4:53:C5:E2:3A:87:4D',
  fingerprint256: '69:AE:1A:6A:D4:3D:C6:C1:1B:EA:C6:23:DE:BA:2A:14:62:62:93:5C:7A:EA:06:41:9B:0B:BC:87:CE:48:4E:02',
  ext_key_usage: [ '1.3.6.1.5.5.7.3.1', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '66593D57F20CBC573E433381B5FEC280',
  raw: <Buffer ... > }
```

## tls.connect(options[, callback])
<!-- YAML
added: v0.11.3
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/25517
    description: The `timeout` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12839
    description: The `lookup` option is supported now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11984
    description: The `ALPNProtocols` option can be a `Uint8Array` now.
  - version: v5.3.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/4246
    description: The `secureContext` option is supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `opciones` {Object}
  * `host` {string} Servidor al que el cliente debe conectarse. **Predeterminado:** `'localhost'`.
  * `port` {number} Puerto al que el cliente debe conectarse.
  * `path` {string} Crea una conexión de socket de Unix a la ruta. Si se especifica esta opción, `host` y `port` se ignoran.
  * `socket` {stream.Duplex} Establece una conexión segura en un socket dado en lugar de crear un nuevo socket. Normalmente, esta es una instancia de [`net.Socket`][], pero se permite cualquier transmisión `Duplex`. Si se especifica esta opción, se ignoran `path`, `host` y `port`, excepto para la validación de certificados. Por lo general, un socket ya está conectado cuando se pasa a `tls.connect()`, pero se puede conectar más tarde. Tenga en cuenta que la conexión/desconexión/destrucción del `socket` es responsabilidad del usuario, llamar a `tls.connect()` no hará que `net.connect()` sea llamado.
  * `rejectUnauthorized` {boolean} Si no es `false`, el certificado del servidor se verifica con la lista de CA proporcionadas. Se produce un evento `'error'` si la verificación falla; `err.code` contiene el código de error OpenSSL. **Predeterminado:** `true`.
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} Un array de cadenas, `Buffer`s o `Uint8Array`s, o un solo `Buffer` o `Uint8Array` que contienen los protocolos compatibles ALPN. `Buffer`s should have the format `[len][name][len][name]...` e.g. `'\x08http/1.1\x08http/1.0'`, where the `len` byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['http/1.1', 'http/1.0']`. Protocols earlier in the list have higher preference than those later.
  * `servername`: {string} Nombre del servidor para la extensión TLS de SNI (Server Name Indication). It is the name of the host being connected to, and must be a host name, and not an IP address. It can be used by a multi-homed server to choose the correct certificate to present to the client, see the `SNICallback` option to [`tls.createServer()`][].
  * `checkServerIdentity(servername, cert)` {Function} Una función callback para ser utilizada (en lugar de la función builtin `tls.checkServerIdentity()`) al verificar el hostname del servidor (o el `servername` proporcionado cuando se establece explícitamente) contra el certificado. Esto debería devolver un {Error} si la verificación falla. El método debería devolver `undefined` si se verifican el `servername` y el `cert`.
  * `session` {Buffer} Una instancia `Buffer` que contiene la sesión TLS.
  * `minDHSize` {number} Tamaño mínimo del parámetro DH en bits para aceptar una conexión TLS. Cuando un servidor ofrece un parámetro DH con un tamaño inferior a `minDHSize`, la conexión TLS se destruye y se produce un error. **Predeterminado:** `1024`.
  * `secureContext`: TLS context object created with [`tls.createSecureContext()`][]. Si _no_ se proporciona un `secureContext`, se creará uno pasando el objeto entero `options` a `tls.createSecureContext()`.
  * `lookup`: {Function} Función de búsqueda personalizada. **Predeterminado:** [`dns.lookup()`][].
  * `timeout`: {number} If set and if a socket is created internally, will call [`socket.setTimeout(timeout)`][] after the socket is created, but before it starts the connection.
  * ...: [`tls.createSecureContext()`][] options that are used if the `secureContext` option is missing, otherwise they are ignored.
* `callback` {Function}
* Devuelve: {tls.TLSSocket}

La función de `callback`, si se especifica, se agregará como listener para el evento [`'secureConnect'`][].

`tls.connect()` devuelve un objeto [`tls.TLSSocket`][].

The following illustrates a client for the echo server example from [`tls.createServer()`][]:

```js
// Assumes an echo server that is listening on port 8000.
const tls = require('tls');
const fs = require('fs');

const options = {
  // Necessary only if the server requires client certificate authentication.
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),

  // Necessary only if the server uses a self-signed certificate.
  ca: [ fs.readFileSync('server-cert.pem') ],

  // Necessary only if the server's cert isn't for "localhost".
  checkServerIdentity: () => { return null; },
};

const socket = tls.connect(8000, options, () => {
  console.log('client connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  process.stdin.pipe(socket);
  process.stdin.resume();
});
socket.setEncoding('utf8');
socket.on('data', (data) => {
  console.log(data);
});
socket.on('end', () => {
  console.log('server ends connection');
});
```

## tls.connect(path\[, options\]\[, callback\])
<!-- YAML
added: v0.11.3
-->

* `path` {string} Valor predeterminado para `options.path`.
* `options` {Object} Vea [`tls.connect()`][].
* `callback` {Function} Vea [`tls.connect()`][].
* Devuelve: {tls.TLSSocket}

Igual que [`tls.connect()`][] excepto que `path` se puede proporcionar como un argumento en lugar de una opción.

Una opción de ruta, si se especifica, tendrá prioridad sobre el argumento ruta.

## tls.connect(port\[, host\]\[, options\][, callback])
<!-- YAML
added: v0.11.3
-->

* `port` {number} Valor predeterminado para `options.port`.
* `host` {string} Default value for `options.host`.
* `options` {Object} Vea [`tls.connect()`][].
* `callback` {Function} Vea [`tls.connect()`][].
* Devuelve: {tls.TLSSocket}

Igual que [`tls.connect()`][] excepto que se pueden proporcionar `port` y `host` como argumentos en lugar de opciones.

Una opción de puerto o host, si se especifica, tendrá prioridad sobre cualquier puerto o argumento de host.

## tls.createSecureContext([options])
<!-- YAML
added: v0.11.13
changes:
  - version: v10.16.0
    pr-url: https://github.com/nodejs/node/pull/24405
    description: The `minVersion` and `maxVersion` can be used to restrict
                 the allowed TLS protocol versions.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19794
    description: The `ecdhCurve` cannot be set to `false` anymore due to a
                 change in OpenSSL.
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/14903
    description: The `options` parameter can now include `clientCertEngine`.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15206
    description: The `ecdhCurve` option can now be multiple `':'` separated
                 curve names or `'auto'`.
  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10294
    description: If the `key` option is an array, individual entries do not
                 need a `passphrase` property anymore. `Array` entries can also
                 just be `string`s or `Buffer`s now.
  - version: v5.2.0
    pr-url: https://github.com/nodejs/node/pull/4099
    description: The `ca` option can now be a single string containing multiple
                 CA certificates.
-->

* `opciones` {Object}
  * `ca` {string|string[]|Buffer|Buffer[]} Opcionalmente, anula los certificados CA de confianza. El valor predeterminado es confiar en las CA mejor conocidas seleccionadas por Mozilla. Las CA de Mozilla se reemplazan completamente cuando las CA se especifican explícitamente con esta opción. El valor puede ser una string o `Buffer`, o un `Array` de strings y/o `Buffer`s. Cualquier string o `Buffer` puede contener múltiples CAs de PEM concatenadas juntas. El certificado del peer debe poder conectarse a una CA de confianza del servidor para que la conexión se autentique. Cuando se usan certificados que no pueden encadenarse a una CA bien conocida, el certificado CA debe especificarse explícitamente como confiable o la conexión no podrá autenticarse. Si el peer utiliza un certificado que no concuerda o encadena a una de las CA predeterminadas, use la opción `ca` para proporcionar un certificado CA con el que el certificado del peer pueda coincidir o encadenarse. Para certificados autofirmados, el certificado es su propia CA y debe proporcionarse. For PEM encoded certificates, supported types are "X509 CERTIFICATE", and "CERTIFICATE".
  * `cert` {string|string[]|Buffer|Buffer[]} Cert chains in PEM format. One cert chain should be provided per private key. Each cert chain should consist of the PEM formatted certificate for a provided private `key`, followed by the PEM formatted intermediate certificates (if any), in order, and not including the root CA (the root CA must be pre-known to the peer, see `ca`). When providing multiple cert chains, they do not have to be in the same order as their private keys in `key`. If the intermediate certificates are not provided, the peer will not be able to validate the certificate, and the handshake will fail.
  * `ciphers` {string} Cipher suite specification, replacing the default. For more information, see [modifying the default cipher suite](#tls_modifying_the_default_tls_cipher_suite).
  * `clientCertEngine` {string} Name of an OpenSSL engine which can provide the client certificate.
  * `crl` {string|string[]|Buffer|Buffer[]} PEM formatted CRLs (Certificate Revocation Lists).
  * `dhparam` {string|Buffer} Parámetros de Diffie Hellman, necesarios para [Perfect Forward Secrecy](#tls_perfect_forward_secrecy). Use `openssl dhparam` para crear los parámetros. La longitud de la clave debe ser mayor o igual a 1024 bits; de lo contrario, se generará un error. Se recomienda encarecidamente usar 2048 bits o más para una mayor seguridad. Si se omite o no es válido, los parámetros se descartan silenciosamente y las cifras de DHE no estarán disponibles.
  * `ecdhCurve` {string} A string describing a named curve or a colon separated list of curve NIDs or names, for example `P-521:P-384:P-256`, to use for ECDH key agreement. Establézcalo en `auto` para seleccionar la curva automáticamente. Utilice [`crypto.getCurves()`][] para obtener una lista de nombres de curvas disponibles. En versiones recientes, `openssl ecparam-list_curves` también mostrará el nombre y la descripción de cada curva elíptica disponible. **Predeterminado:** [`tls.DEFAULT_ECDH_CURVE`].
  * `honorCipherOrder` {boolean} Intenta utilizar las preferencias del conjunto de cifrado del servidor en lugar de las del cliente. Cuando `true`, hace que `SSL_OP_CIPHER_SERVER_PREFERENCE` se establezca en `secureOptions`, consulte [OpenSSL Options](crypto.html#crypto_openssl_options) para obtener más información.
  * `key` {string|string[]|Buffer|Buffer[]|Object[]} Private keys in PEM format. PEM permite la opción de encriptar claves privadas. Encrypted keys will be decrypted with `options.passphrase`. Multiple keys using different algorithms can be provided either as an array of unencrypted key strings or buffers, or an array of objects in the form `{pem: <string|buffer>[,
passphrase: <string>]}`. The object form can only occur in an array. `object.passphrase` es opcional. Encrypted keys will be decrypted with `object.passphrase` if provided, or `options.passphrase` if it is not.
  * `maxVersion` {string} Optionally set the maximum TLS version to allow. One of `TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the `secureProtocol` option, use one or the other.  **Default:** `'TLSv1.2'`.
  * `minVersion` {string} Optionally set the minimum TLS version to allow. One of `TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the `secureProtocol` option, use one or the other.  It is not recommended to use less than TLSv1.2, but it may be required for interoperability. **Default:** `'TLSv1'`.
  * `passphrase` {string} Shared passphrase used for a single private key and/or a PFX.
  * `pfx` {string|string[]|Buffer|Buffer[]|Object[]} PFX or PKCS12 encoded private key and certificate chain. `pfx` is an alternative to providing `key` and `cert` individually. PFX generalmente está encriptado, si es así, se usará `passphrase` para descifrarlo. Se puede proporcionar PFX múltiple ya sea como un array de buffers PFX sin encriptar, o un array de objetos en la forma `{buf: <string|buffer>[, passphrase: <string>]}`. La forma del objeto solo puede ocurrir en un array. `object.passphrase` es opcional. El PFX encriptado se descifrará con `object.passphrase` si se proporciona, o `options.passphrase` si no es así.
  * `secureOptions` {number} Opcionalmente afecta el comportamiento del protocolo OpenSSL, que generalmente no es necesario. ¡Esto debe usarse con cuidado si lo hace! El valor es una máscara de bits numérica de las opciones `SSL_OP_*` de [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `secureProtocol` {string} The TLS protocol version to use. The possible values are listed as [SSL_METHODS](https://www.openssl.org/docs/man1.1.0/ssl/ssl.html#Dealing-with-Protocol-Methods), use the function names as strings. For example, use `'TLSv1_1_method'` to force TLS version 1.1, or `'TLS_method'` to allow any TLS protocol version. It is not recommended to use TLS versions less than 1.2, but it may be required for interoperability.  **Default:** none, see `minVersion`.
  * `sessionIdContext` {string} Opaque identifier used by servers to ensure session state is not shared between applications. No utilizado por los clientes.

[`tls.createServer()`][] establece el valor predeterminado de la opción `honorCipherOrder` a `true`, otras API que crean contextos seguros lo dejan sin configurar.

[`tls.createServer()`][] utiliza un valor de hash SHA1 truncado de 128 bits generado a partir de `process.argv` como el valor predeterminado de la opción`sessionIdContext`, otras API que crean contextos seguros no tienen valor predeterminado.

El método `tls.createSecureContext()` crea un objeto de credenciales.

Se *requiere* una clave para cifrados que hacen uso de certificados. Se puede usar `key` o `pfx` para proporcionarla.

Si no se proporciona la opción 'ca', entonces Node.js utilizará la lista predeterminada de confianza pública de las CA como se indica en <https://hg.mozilla.org/mozilla-central/raw-file/tip/security/nss/lib/ckfw/builtins/certdata.txt>.

## tls.createServer(\[options\]\[, secureConnectionListener\])
<!-- YAML
added: v0.3.2
changes:
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/14903
    description: The `options` parameter can now include `clientCertEngine`.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11984
    description: The `ALPNProtocols` option can be a `Uint8Array` now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `opciones` {Object}
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} Un array de cadenas, `Buffer`s o `Uint8Array`s, o un solo `Buffer` o `Uint8Array` que contienen los protocolos compatibles ALPN. Los `Buffer`s deben tener el formato `[len][name][len][name]...` e.g. `0x05hello0x05world`, donde el primer byte es la longitud del siguiente nombre de protocolo. Pasar un array suele ser mucho más simple, por ejemplo, `['hello', 'world']`. (Los protocolos deben ordenarse por su prioridad.)
  * `clientCertEngine` {string} Name of an OpenSSL engine which can provide the client certificate.
  * `handshakeTimeout` {number} Anula la conexión si el establecimiento de comunicación SSL/TLS no finaliza en la cantidad especificada de milisegundos. Se emite un `'tlsClientError'` en el objeto `tls.Server` cada vez que se agota el establecimiento de comunicación. **Predeterminado:** `120000` (120 segundos).
  * `rejectUnauthorized` {boolean} Si no es `false`, el servidor rechazará cualquier conexión que no esté autorizada con la lista de CA suministradas. Esta opción solo tiene efecto si `requestCert` es `true`. **Predeterminado:** `true`.
  * `requestCert` {boolean} Si es `true` el servidor solicitará un certificado de los clientes que se conectan e intentan verificar ese certificado. **Predeterminado:** `false`.
  * `sessionTimeout` {number} The number of seconds after which a TLS session created by the server will no longer be resumable. See [Session Resumption](#tls_session_resumption) for more information. **Default:** `300`.
  * `SNICallback(servername, cb)` {Function} Una función que se llamará si el cliente admite la extensión SNI TLS. Se pasarán dos argumentos cuando se le llame: `servername` y `cb`. `SNICallback` debería invocar `cb(null, ctx)`, donde `ctx` es una instancia de `SecureContext`. (`tls.createSecureContext(...)` se puede usar para obtener un `SecureContext` apropiado.) Si no se proporcionó `SNICallback`, se utilizará el callback predeterminado con API de alto nivel (vea a continuación).
  * `ticketKeys`: {Buffer} 48-bytes of cryptographically strong pseudo-random data. See [Session Resumption](#tls_session_resumption) for more information.
  * ...: Any [`tls.createSecureContext()`][] option can be provided. Para los servidores, usualmente se requieren las opciones de identidad (`pfx` ó `key`/`cert`).
* `secureConnectionListener` {Function}
* Devuelve: {tls.Server}

Crea un nuevo [`tls.Server`][]. El `secureConnectionListener`, si se proporciona, se configura automáticamente como un listener para el evento [`'secureConnection'`][] event.

Las opciones `ticketKeys` se comparten automáticamente entre los workers del módulo `cluster`.

Lo siguiente ilustra un servidor de eco simple:

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),

  // This is necessary only if using client certificate authentication.
  requestCert: true,

  // This is necessary only if the client uses a self-signed certificate.
  ca: [ fs.readFileSync('client-cert.pem') ]
};

const server = tls.createServer(options, (socket) => {
  console.log('server connected',
              socket.authorized ? 'authorized' : 'unauthorized');
  socket.write('welcome!\n');
  socket.setEncoding('utf8');
  socket.pipe(socket);
});
server.listen(8000, () => {
  console.log('server bound');
});
```

The server can be tested by connecting to it using the example client from [`tls.connect()`][].

## tls.getCiphers()
<!-- YAML
added: v0.10.2
-->

* Devuelve: {string[]}

Devuelve un array con los nombres de los cifrados SSL admitidos.

```js
console.log(tls.getCiphers()); // ['AES128-SHA', 'AES256-SHA', ...]
```

## tls.DEFAULT_ECDH_CURVE
<!-- YAML
added: v0.11.13
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16853
    description: Default value changed to `'auto'`.
-->

El nombre de la curva por defecto para usar para el acuerdo de clave ECDH en un servidor tls. El valor predeterminado es `'auto'`. Consulte [`tls.createSecureContext()`] para obtener más información.

## API Obsoletas

### Clase: CryptoStream
<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Usar [`tls.TLSSocket`][] en su lugar.

La clase `tls.CryptoStream` representa un stream de datos encriptados. This class is deprecated and should no longer be used.

#### cryptoStream.bytesWritten
<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

La propiedad `cryptoStream.bytesWritten` devuelve el número total de bytes escritos en el socket subyacente, *incluidos* los bytes necesarios para la implementación del protocolo TLS.

### Clase: SecurePair
<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Use [`tls.TLSSocket`][] en su lugar.

Devuelto por [`tls.createSecurePair()`][].

#### Evento: 'secure'
<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

El evento `'secure'` es emitido por el objeto `SecurePair` una vez que se ha establecido una conexión segura.

As with checking for the server [`'secureConnection'`](#tls_event_secureconnection) event, `pair.cleartext.authorized` should be inspected to confirm whether the certificate used is properly authorized.

### tls.createSecurePair(\[context\]\[, isServer\]\[, requestCert\]\[, rejectUnauthorized\][, options])
<!-- YAML
added: v0.3.2
deprecated: v0.11.3
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

> Estabilidad: 0 - Desaprobado: Use [`tls.TLSSocket`][] en su lugar.

* `context` {Object} Un objeto de contexto seguro como lo devuelve `tls.createSecureContext()`
* `isServer` {boolean} `true` para especificar que esta conexión TLS debe abrirse como servidor.
* `requestCert` {boolean} `true` para especificar si un servidor debe solicitar un certificado de un cliente en conexión. Solo aplica cuando `isServer` es `true`.
* `rejectUnauthorized` {boolean} If not `false` a server automatically reject clients with invalid certificates. Solo aplica cuando `isServer` es `true`.
* `options`
  * `secureContext`: A TLS context object from [`tls.createSecureContext()`][]
  * `isServer`: Si es `true` el socket TLS será instanciado en modo servidor. **Predeterminado:** `false`.
  * `server` {net.Server} A [`net.Server`][] instance
  * `requestCert`: See [`tls.createServer()`][]
  * `rejectUnauthorized`: See [`tls.createServer()`][]
  * `ALPNProtocols`: See [`tls.createServer()`][]
  * `SNICallback`: See [`tls.createServer()`][]
  * `session` {Buffer} A `Buffer` instance containing a TLS session.
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication.

Crea un nuevo objeto de par seguro con dos streams, uno de los cuales lee y escribe los datos encriptados, y el que otro lee y escribe los datos cleartext. En general, el stream encriptado se canaliza hacia/desde un stream de datos encriptados entrantes y el de cleartext se utiliza como reemplazo del stream encriptado inicial.

`tls.createSecurePair()` devuelve un objeto `tls.SecurePair` con las propiedades stream `cleartext` y `encrypted`.

Using `cleartext` has the same API as [`tls.TLSSocket`][].

The `tls.createSecurePair()` method is now deprecated in favor of `tls.TLSSocket()`. Por ejemplo, el código:

```js
pair = tls.createSecurePair(/* ... */);
pair.encrypted.pipe(socket);
socket.pipe(pair.encrypted);
```

puede ser reemplazado por:

```js
secureSocket = tls.TLSSocket(socket, options);
```

where `secureSocket` has the same API as `pair.cleartext`.
