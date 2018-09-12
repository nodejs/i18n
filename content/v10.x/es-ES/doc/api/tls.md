# TLS (SSL)

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `tls` proporciona una implementación de Transport Layer Security (TLS) y protocolos Secure Socket Layer (SSL) que se construyen sobre OpenSSL. Se puede acceder al módulo usando:

```js
const tls = require('tls');
```

## Conceptos TLS/SSL

El TLS/SSL es una infraestructura de clave pública/privada (PKI). Para los casos más comunes, cada cliente y servidor debe tener una *clave privada*.

Las claves privadas se pueden generar de múltiples maneras. El siguiente ejemplo demuestra el uso de la interfaz de línea de comandos de OpenSSL para generar una clave privada RSA de 2048 bits:

```sh
openssl genrsa -out ryans-key.pem 2048
```

Con TLS/SSL, todos los servidores (y algunos clientes) deben tener un *certificado*. Los certificados son *claves públicas* que corresponden a una clave privada y que están firmadas digitalmente por una Autoridad de Certificación o por el propietario de la clave privada (dichos certificados se denominan "auto-firmados"). El primer paso para obtener un certificado es crear un archivo de *Certificate Signing Request* (CSR).

La interfaz de línea de comandos de OpenSSL se puede usar para generar un CSR para una clave privada:

```sh
openssl req -new -sha256 -key ryans-key.pem -out ryans-csr.pem
```

Una vez que se genera el archivo CSR, puede enviarse a una Autoridad de Certificación para firmar o utilizarse para generar un certificado auto-firmado.

La creación de un certificado auto-firmado utilizando la interfaz de línea de comandos de OpenSSL se ilustra en el siguiente ejemplo:

```sh
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

Una vez que se genera el certificado, se puede usar para generar un archivo `.pfx` o `.p12`:

```sh
openssl pkcs12 -export -in ryans-cert.pem -inkey ryans-key.pem \
      -certfile ca-cert.pem -out ryans.pfx
```

Donde:

* `in`: es el certificado firmado
* `inkey`: es la clave privada asociada
* `certfile`: es una concatenación de todos los certificados de la Autoridad de Certificación (CA) en un único archivo, p.ej. `cat ca1-cert.pem ca2-cert.pem > ca-cert.pem`

### Perfect Forward Secrecy

<!-- type=misc -->

El término "[Forward Secrecy](https://en.wikipedia.org/wiki/Perfect_forward_secrecy)" o "Perfect Forward Secrecy" describe una característica de los métodos de acuerdo clave (es decir, intercambio de claves). Es decir, las claves del servidor y del cliente se utilizan para negociar nuevas claves temporales que se usan específicamente y solo para la sesión de comunicación actual. Prácticamente, esto significa que incluso si la clave privada del servidor se ve comprometida, la comunicación solo puede ser descifrada por espías si el atacante logra obtener el par de claves específicamente generadas para la sesión.

Perfect Forward Secrecy se logra generando aleatoriamente un par de claves para el acuerdo de clave en cada establecimiento de comunicación de TLS/SSL (en contraste con el uso de la misma clave para todas las sesiones). Los métodos que implementan esta técnica se llaman "efímeros".

Actualmente, se utilizan dos métodos para lograr Perfect Forward Secrecy (tenga en cuenta el carácter "E" anexado a las abreviaturas tradicionales):

* [DHE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) - Una versión efímera del protocolo de acuerdo clave de Diffie Hellman.
* [ECDHE](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) - Una versión efímera del protocolo de acuerdo clave de Diffie Hellman de curva elíptica.

Los métodos efímeros pueden tener algunos inconvenientes de rendimiento, porque la generación de claves es costosa.

Para usar Perfect Forward Secrecy usando `DHE` con el módulo `tls`, se requiere generar parámetros de Diffie-Hellman y especificarlos con la opción `dhparam` para [`tls.createSecureContext()`][]. A continuación, se ilustra el uso de la interfaz de línea de comandos de OpenSSL para generar dichos parámetros:

```sh
openssl dhparam -outform PEM -out dhparam.pem 2048
```

Si usa Perfect Forward Secrecy usando `ECDHE`, no se requieren los parámetros de Diffie-Hellman y se usará una curva ECDHE predeterminada. La propiedad `ecdhCurve` se puede usar al crear un servidor TLS para especificar la lista de nombres de curvas admitidas a usar, consulte [`tls.createServer()`] para más información.

### ALPN y SNI

<!-- type=misc -->

ALPN (Application Layer Protocol Negotiation Extension) y SNI (Server Name Indication) son extensiones de protocolo de enlace de TLS:

* ALPN - Permite el uso de un servidor TLS para múltiples protocolos (HTTP, HTTP/2)
* SNI - Permite el uso de un servidor TLS para múltiples hostnames con diferentes certificados SSL.

### Mitigación del ataque de renegociación iniciada por el cliente

<!-- type=misc -->

El protocolo TLS permite a los clientes renegociar ciertos aspectos de la sesión TLS. Desafortunadamente, la renegociación de la sesión requiere una cantidad desproporcionada de recursos del lado del servidor, lo que lo convierte en un vector potencial para los ataques de denegación de servicio.

Para mitigar el riesgo, la renegociación se limita a tres veces cada diez minutos. Se emite un evento `'error'` en la instancia [`tls.TLSSocket`][] cuando se excede este umbral. Los límites son configurables:

* `tls.CLIENT_RENEG_LIMIT` {number} Especifica el número de solicitudes de renegociación. **Predeterminado:** `3`.
* `tls.CLIENT_RENEG_WINDOW` {number} Especifica la ventana de renegociación de tiempo en segundos. **Predeterminado:** `600` (10 minutes).

Los límites de renegociación predeterminados no deben modificarse sin un completo entendimiento de las implicaciones y los riesgos.

Para probar los límites de renegociación en un servidor, conéctese usando el cliente de línea de comandos de OpenSSL (`openssl s_client -connect address:port`) y luego ingrese `R<CR>` (es decir, la letra `R` seguida de un retorno de carro) varias veces.

## Modificar el conjunto de cifrado TLS predeterminado

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

Este valor predeterminado se puede reemplazar por completo usando el modificador de línea de comando `--tls-cipher-list`. Por ejemplo, lo siguiente hace `ECDHE-RSA-AES128-GCM-SHA256:!RC4` el conjunto de cifrado de TLS predeterminado:

```sh
node --tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4"
```

El valor predeterminado también se puede reemplazar por cliente o servidor utilizando la opción `ciphers` de [`tls.createSecureContext()`][], que también está disponible en [`tls.createServer()`], [`tls.connect()`] y al crear nuevos [`tls.TLSSocket`].

Consulte [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.1.0/apps/ciphers.html#CIPHER-LIST-FORMAT) para más detalles sobre el formato.

El conjunto de cifrado predeterminado incluido en Node.js se ha seleccionado cuidadosamente para reflejar las mejores prácticas de seguridad actuales y la mitigación de riesgos. Cambiar el conjunto de cifrado predeterminado puede tener un impacto significativo en la seguridad de una aplicación. El modificador `--tls-cipher-list` y la opción `ciphers` deben usarse solo si es absolutamente necesario.

El conjunto de cifrado predeterminado prefiere los cifrados de GCM para la configuración de [Chrome's 'modern cryptography' setting](https://www.chromium.org/Home/chromium-security/education/tls#TOC-Cipher-Suites) y también prefiere los cifrados ECDHE y DHE para Perfect Forward Secrecy, al tiempo que ofrece *un poco* de retrocompatibilidad.

Se prefiere 128 bits AES a 192 y 256 bits AES a la luz de [ataques específicos que afectan tamaños de clave AES más grandes ](https://www.schneier.com/blog/archives/2009/07/another_new_aes.html).

Los clientes antiguos que dependen de cifrados inseguros y obsoletos RC4 o basados en DES (como Internet Explorer 6) no pueden completar el proceso de establecimiento de la comunicación con la configuración predeterminada. Si estos clientes *deben* ser compatibles, las [recomendaciones de TLS ](https://wiki.mozilla.org/Security/Server_Side_TLS) pueden ofrecer un paquete de cifrado compatible. Para más detalles sobre el formato, visite [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.1.0/apps/ciphers.html#CIPHER-LIST-FORMAT).

## Clase: tls.Server

<!-- YAML
added: v0.3.2
-->

La clase `tls.Server` es una subclase de `net.Server` que acepta conexiones encriptadas mediante TLS o SSL.

### Evento: 'newSession'

<!-- YAML
added: v0.9.2
-->

El evento `'newSession'` se emite al crear una nueva sesión de TLS. Esto puede ser usado para almacenar sesiones en el almacenamiento externo. El listener callback recibe tres argumentos cuando se le llama:

* `sessionId` - El identificador de sesión TLS
* `sessionData` - Los datos de la sesión TLS
* `callback` {Function} Una función callback que no toma argumentos que deben invocarse para que los datos se envíen o reciban a través de la conexión segura.

Escuchar este evento tendrá un efecto solo en las conexiones establecidas después de la adición del listener del evento.

### Evento: 'OCSPRequest'

<!-- YAML
added: v0.11.13
-->

El evento `'OCSPRequest'` se emite cuando el cliente envía una solicitud de estado de certificado. El listener callback recibe tres argumentos cuando se le llama:

* `certificate` {Buffer} El certificado del servidor
* `issuer` {Buffer} El certificado del emisor
* `callback` {Function} Una función callback que debe invocarse para proporcionar los resultados de la solicitud OCSP.

El certificado actual del servidor se puede analizar para obtener la URL OCSP y la identificación del certificado; después de obtener una respuesta OCSP, se invoca `callback(null, resp)`, donde `resp` es una instancia `Buffer` que contiene la respuesta OCSP. Tanto el `certificate` como el `issuer` son representaciones `Buffer` DER de los certificados primarios y del emisor. Estos pueden usarse para obtener el ID del certificado OCSP y el URL del punto final OCSP.

Alternativamente, puede llamarse a `callback(null, null)` para indicar que no hubo respuesta OCSP.

Llamar a `callback(err)` dará como resultado una llamada `socket.destroy(err)`.

El flujo típico de una Solicitud OCSP es el siguiente:

1. El cliente se conecta al servidor y envía un `'OCSPRequest'` (a través de la extensión de información de estado en ClientHello).
2. El servidor recibe la solicitud y emite el evento `'OCSPRequest'`, llamando al listener si está registrado.
3. El servidor extrae la URL OCSP del `certificate` o del `issuer` y realiza una [OCSP request](https://en.wikipedia.org/wiki/OCSP_stapling) a la CA.
4. El servidor recibe `'OCSPResponse'` de la CA y lo envía de vuelta al cliente a través del argumento `callback`
5. El cliente valida la respuesta y destruye el socket o realiza un establecimiento de comunicación.

El `issuer` puede ser `null` si el certificado está autofirmado o el emisor no está en la lista de certificados de origen. (Se puede proporcionar un emisor a través de la opción `ca` al establecer la conexión TLS.)

Escuchar este evento tendrá un efecto solo en las conexiones establecidas después de la adición del listener del evento.

Se puede usar un módulo npm como [asn1.js](https://npmjs.org/package/asn1.js) para analizar los certificados.

### Evento: 'resumeSession'

<!-- YAML
added: v0.9.2
-->

El evento `'resumeSession'` se emite cuando el cliente solicita reanudar una sesión anterior de TLS. El listener callback recibe dos argumentos cuando se le llama:

* `sessionId` - El identificador de sesión TLS / SSL
* `callback` {Function} Una función callback que se llamará cuando se haya recuperado la sesión anterior.

Cuando se le llama, el listener del evento puede realizar una búsqueda en el almacenamiento externo utilizando el `sessionId` dado e invocar `callback(null, sessionData)` una vez finalizado. Si la sesión no se puede reanudar (es decir, no existe en el almacenamiento), el callback se puede invocar como `callback(null, null)`. Llamar a `callback(err)` terminará la conexión entrante y destruirá el socket.

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
* `tlsSocket` {tls.TLSSocket} La instancia de `tls.TLSSocket` a partir de la cual se originó el error.

### server.addContext(hostname, context)

<!-- YAML
added: v0.5.3
-->

* `hostname` {string} Un hostname o comodín de SNI (por ejemplo, `'*'`)
* `context` {Object} Un objeto que contiene cualquiera de las posibles propiedades de los argumentos [`tls.createSecureContext()`][] `options` (por ejemplo, `key`, `cert`, `ca`, etc).

El método `server.addContext()` agrega un contexto seguro que se utilizará si el hostname de SNI de la solicitud del cliente coincide con el `hostname` (o comodín) suministrado.

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

* `callback` {Function} Un listener opcional callback que se registrará para escuchar el evento `'close'` de la instancia del servidor.

El método `server.close()` evita que el servidor acepte nuevas conexiones.

Esta función funciona de forma asíncrona. El evento `'close'` se emitirá cuando el servidor no tenga más conexiones abiertas.

### server.connections

<!-- YAML
added: v0.3.2
deprecated: v0.9.7
-->

> Estabilidad: 0 - Obsoleto: Use [`server.getConnections()`][] en su lugar.

* {number}

Devuelve el número actual de conexiones simultáneas en el servidor.

### server.getTicketKeys()

<!-- YAML
added: v3.0.0
-->

* Devuelve: {Buffer}

Devuelve una instancia `Buffer` que contiene las claves actualmente utilizadas para el cifrado/descifrado de los [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt).

### server.listen()

Inicia el servidor escuchando conexiones encriptadas. Este método es idéntico a [`server.listen()`][] from [`net.Server`][].

### server.setTicketKeys(keys)

<!-- YAML
added: v3.0.0
-->

* `keys` {Buffer} Las claves utilizadas para el cifrado/descifrado de los [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt).

Actualiza las claves para el cifrado/descifrado de la [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt).

El `Buffer` de la clave debe tener 48 bytes de longitud. Consulte la opción `ticketKeys` en [`tls.createServer()`] para obtener más información sobre cómo se usa.

Los cambios en las claves de ticket son efectivos solo para futuras conexiones de servidor. Las conexiones de servidor existentes o actualmente pendientes usarán las claves anteriores.

## Clase: tls.TLSSocket

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
  * `isServer`: El protocolo SSL/TLS es asimétrico. TLSSockets debe saber si deben comportarse como un servidor o un cliente. Si `true`, se creará una instancia del socket TLS como servidor. **Default:** `false`.
  * `server` {net.Server} Una instancia opcional [`net.Server`][].
  * `requestCert`: Ya sea para autenticar, o no, al peer remoto solicitando un certificado. Los clientes siempre solicitan un certificado de servidor. Los servidores (`isServer` es verdadero) pueden establecer opcionalmente `requestCert` en verdadero para solicitar un certificado de cliente.
  * `rejectUnauthorized`: Opcional, vea [`tls.createServer()`][]
  * `ALPNProtocols`: Opcional, vea [`tls.createServer()`][]
  * `SNICallback`: Opcional, vea [`tls.createServer()`][]
  * `session` {Buffer} Una instancia opcional de `Buffer` que contiene una sesión TLS.
  * `requestOCSP` {boolean} Si es `true`, especifica que la extensión de solicitud de estado OCSP se agregará al hola del cliente y se emitirá un evento `'OCSPResponse'` en el socket antes de establecer una comunicación segura
  * `secureContext`: Objeto de contexto TLS opcional creado con [`tls.createSecureContext()`][]. Si *no* se proporciona un `secureContext`, se creará uno pasando el objeto `options` completo a `tls.createSecureContext()`.
  * ...: Opciones opcionales [`tls.createSecureContext()`][] que se utilizan si falta la opción `secureContext`, de lo contrario, son ignoradas.

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

Vea `SSL_CIPHER_get_name()` en https://www.openssl.org/docs/man1.1.0/ssl/SSL_CIPHER_get_name.html para más información.

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

Devuelve un objeto que representa el certificado del peer. El objeto devuelto tiene algunas propiedades correspondientes a los campos del certificado.

Si se solicitó la cadena de certificados completa, cada certificado incluirá una propiedad `issuerCertificate` que contiene un objeto que representa el certificado de su emisor.

For example:

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

Si el peer no proporciona un certificado, se devolverá un objeto vacío.

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

* Devuelve: {string}

Devuelve una cadena que contiene la versión negociada del protocolo SSL/TLS de la conexión actual. El valor `'unknown'` se devolverá para sockets conectados que no hayan completado el proceso de establecimiento de comunicación. El valor `null` se devolverá para sockets de servidor o sockets de cliente desconectados.

Las respuestas de ejemplo incluyen:

* `SSLv3`
* `TLSv1`
* `TLSv1.1`
* `TLSv1.2`
* `unknown`

Vea https://www.openssl.org/docs/man1.1.0/ssl/SSL_get_version.html para más información.

### tlsSocket.getSession()

<!-- YAML
added: v0.11.4
-->

Devuelve la sesión TLS codificada en ASN.1 o `undefined` si no se negoció ninguna sesión. Se puede usar para acelerar el establecimiento del protocolo de enlace cuando se realice una reconexión al servidor.

### tlsSocket.getTLSTicket()

<!-- YAML
added: v0.11.4
-->

Devuelve el ticket de sesión de TLS o `undefined` si no se negoció ninguna sesión.

Esto solo funciona con los sockets TLS del cliente. Útil solo para la depuración, para la reutilización de sesión proporcione la opción `session` a [`tls.connect()`][].

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

## tls.checkServerIdentity(host, cert)

<!-- YAML
added: v0.8.4
-->

* `host` {string} El hostname para verificar el certificado en contra
* `cert` {Object} Un objeto que representa el certificado del peer. El objeto devuelto tiene algunas propiedades correspondientes a los campos del certificado.
* Devuelve: {Error|undefined}

Verifica que el certificado `cert` se emita para alojar `host`.

Devuelve el objeto {Error}, rellenándolo con el motivo, el host y el certificado en caso de error. En caso de éxito, devuelve {undefined}.

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
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} Un array de cadenas, `Buffer`s o `Uint8Array`s, o un solo `Buffer` o `Uint8Array` que contienen los protocolos compatibles ALPN. Los `Buffer`s deben tener el formato `[len][name][len][name]...` e.g. `0x05hello0x05world`, donde el primer byte es la longitud del siguiente nombre de protocolo. Pasar un array suele ser mucho más simple, por ejemplo, `['hello', 'world']`.
  * `servername`: {string} Nombre del servidor para la extensión TLS de SNI (Server Name Indication).
  * `checkServerIdentity(servername, cert)` {Function} Una función callback para ser utilizada (en lugar de la función builtin `tls.checkServerIdentity()`) al verificar el hostname del servidor (o el `servername` proporcionado cuando se establece explícitamente) contra el certificado. Esto debería devolver un {Error} si la verificación falla. El método debería devolver `undefined` si se verifican el `servername` y el `cert`.
  * `session` {Buffer} Una instancia `Buffer` que contiene la sesión TLS.
  * `minDHSize` {number} Tamaño mínimo del parámetro DH en bits para aceptar una conexión TLS. Cuando un servidor ofrece un parámetro DH con un tamaño inferior a `minDHSize`, la conexión TLS se destruye y se produce un error. **Predeterminado:** `1024`.
  * `secureContext`: Objeto de contexto TLS opcional creado con [`tls.createSecureContext()`][]. Si *no* se proporciona un `secureContext`, se creará uno pasando el objeto entero `options` a `tls.createSecureContext()`.
  * `lookup`: {Function} Función de búsqueda personalizada. **Predeterminado:** [`dns.lookup()`][].
  * ...: Opciones alternativas[`tls.createSecureContext()`][] que se utilizan si falta la opción `secureContext`; de lo contrario, se ignorarán.
* `callback` {Function}

La función de `callback`, si se especifica, se agregará como listener para el evento [`'secureConnect'`][].

`tls.connect()` devuelve un objeto [`tls.TLSSocket`][].

A continuación, se implementa un ejemplo simple de "echo server":

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  // Necesario solo si se usa la autenticación del certificado del cliente
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),

  // Necesario solo si el servidor utiliza el certificado autofirmado
  ca: [ fs.readFileSync('server-cert.pem') ]
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
  server.close();
});
```

O

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('client.pfx')
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
  server.close();
});
```

## tls.connect(path\[, options\]\[, callback\])

<!-- YAML
added: v0.11.3
-->

* `path` {string} Valor predeterminado para `options.path`.
* `options` {Object} Vea [`tls.connect()`][].
* `callback` {Function} Vea [`tls.connect()`][].

Igual que [`tls.connect()`][] excepto que `path` se puede proporcionar como un argumento en lugar de una opción.

Una opción de ruta, si se especifica, tendrá prioridad sobre el argumento ruta.

## tls.connect(port\[, host\]\[, options\][, callback])

<!-- YAML
added: v0.11.3
-->

* `port` {number} Valor predeterminado para `options.port`.
* `host` {string} Valor predeterminado opcional para `options.host`.
* `options` {Object} Vea [`tls.connect()`][].
* `callback` {Function} Vea [`tls.connect()`][].

Igual que [`tls.connect()`][] excepto que se pueden proporcionar `port` y `host` como argumentos en lugar de opciones.

Una opción de puerto o host, si se especifica, tendrá prioridad sobre cualquier puerto o argumento de host.

## tls.createSecureContext(options)

<!-- YAML
added: v0.11.13
changes:

  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/14903
    description: The `options` parameter can now include `clientCertEngine`.
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
  * `pfx` {string|string[]|Buffer|Buffer[]|Object[]} Clave codificada y cadena de certificado opcional PFX o PKCS12. `pfx` es una alternativa para proporcionar `key` y `cert` individualmente. PFX generalmente está encriptado, si es así, se usará `passphrase` para descifrarlo. Se puede proporcionar PFX múltiple ya sea como un array de buffers PFX sin encriptar, o un array de objetos en la forma `{buf: <string|buffer>[, passphrase: <string>]}`. La forma del objeto solo puede ocurrir en un array. `object.passphrase` es opcional. El PFX encriptado se descifrará con `object.passphrase` si se proporciona, o `options.passphrase` si no es así.
  * `key` {string|string[]|Buffer|Buffer[]|Object[]} Claves privadas opcionales en formato PEM. PEM permite la opción de encriptar claves privadas. Las claves encriptadas se descifrarán con `options.passphrase`. Se pueden proporcionar varias claves utilizando diferentes algoritmos, ya sea como un array de strings clave sin cifrar o buffers, o un array de objetos en la forma `{pem:
<string|buffer>[, passphrase: <string>]}`. La forma del objeto solo puede ocurrir en un array. `object.passphrase` es opcional. Las claves encriptadas se descifrarán con `object.passphrase` si se proporciona, u `options.passphrase` si no es así.
  * `passphrase` {string} Frase de acceso compartida opcional utilizada para una sola clave privada y/o un PFX.
  * `cert` {string|string[]|Buffer|Buffer[]} Cadenas de certificados opcionales en formato PEM. Se debe proporcionar una cadena de certificados por clave privada. Cada cadena de certificados debe consistir en el certificado con formato PEM para una `key` privada, seguido por los certificados intermedios con formato PEM (si los hay), en orden, y sin incluir el root CA (el root CA debe ser conocido previamente por el peer, consulte `ca`). Al proporcionar múltiples cadenas de certificados, no tienen que estar en el mismo orden que sus claves privadas en `key`. Si no se proporcionan los certificados intermedios, el peer no podrá validar el certificado, y el establecimiento de comunicación fallará.
  * `ca` {string|string[]|Buffer|Buffer[]} Opcionalmente, anula los certificados CA de confianza. El valor predeterminado es confiar en las CA mejor conocidas seleccionadas por Mozilla. Las CA de Mozilla se reemplazan completamente cuando las CA se especifican explícitamente con esta opción. El valor puede ser una string o `Buffer`, o un `Array` de strings y/o `Buffer`s. Cualquier string o `Buffer` puede contener múltiples CAs de PEM concatenadas juntas. El certificado del peer debe poder conectarse a una CA de confianza del servidor para que la conexión se autentique. Cuando se usan certificados que no pueden encadenarse a una CA bien conocida, el certificado CA debe especificarse explícitamente como confiable o la conexión no podrá autenticarse. Si el peer utiliza un certificado que no concuerda o encadena a una de las CA predeterminadas, use la opción `ca` para proporcionar un certificado CA con el que el certificado del peer pueda coincidir o encadenarse. Para certificados autofirmados, el certificado es su propia CA y debe proporcionarse.
  * `ciphers` {string} Especificación de conjunto de cifrado opcional, reemplazando el valor predeterminado. Para más información, consulte [modifying the default cipher suite](#tls_modifying_the_default_tls_cipher_suite).
  * `honorCipherOrder` {boolean} Intenta utilizar las preferencias del conjunto de cifrado del servidor en lugar de las del cliente. Cuando `true`, hace que `SSL_OP_CIPHER_SERVER_PREFERENCE` se establezca en `secureOptions`, consulte [OpenSSL Options](crypto.html#crypto_openssl_options) para obtener más información.
  * `ecdhCurve` {string} Una string que describe una curva con nombre o una lista separada por dos puntos de NID curvas o nombres, por ejemplo `P-521:P-384:P-256`, para usar para el acuerdo de clave ECDH, o `false` para desactivar ECDH. Establézcalo en `auto` para seleccionar la curva automáticamente. Utilice [`crypto.getCurves()`][] para obtener una lista de nombres de curvas disponibles. En versiones recientes, `openssl ecparam-list_curves` también mostrará el nombre y la descripción de cada curva elíptica disponible. **Predeterminado:** [`tls.DEFAULT_ECDH_CURVE`].
  * `clientCertEngine` {string} Nombre opcional de una máquina OpenSSL que puede proporcionar el certificado del cliente.
  * `crl` {string|string[]|Buffer|Buffer[]} CRL formateadas PEM opcionales (listas de revocación de certificados).
  * `dhparam` {string|Buffer} Parámetros de Diffie Hellman, necesarios para [Perfect Forward Secrecy](#tls_perfect_forward_secrecy). Use `openssl dhparam` para crear los parámetros. La longitud de la clave debe ser mayor o igual a 1024 bits; de lo contrario, se generará un error. Se recomienda encarecidamente usar 2048 bits o más para una mayor seguridad. Si se omite o no es válido, los parámetros se descartan silenciosamente y las cifras de DHE no estarán disponibles.
  * `secureOptions` {number} Opcionalmente afecta el comportamiento del protocolo OpenSSL, que generalmente no es necesario. ¡Esto debe usarse con cuidado si lo hace! El valor es una máscara de bits numérica de las opciones `SSL_OP_*` de [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `secureProtocol` {string} Método SSL opcional para usar. Los valores posibles se catalogan como [SSL_METHODS](https://www.openssl.org/docs/man1.1.0/ssl/ssl.html#Dealing-with-Protocol-Methods), use los nombres de las funciones como strings. Por ejemplo, `'TLSv1_2_method'` para forzar la versión 1.2 de TLS. **Predeterminado:** `'TLS_method'`.
  * `sessionIdContext` {string} Identificador opaco opcional utilizado por los servidores para garantizar que el estado de la sesión no se comparta entre las aplicaciones. No utilizado por los clientes.

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
  * `clientCertEngine` {string} Nombre opcional de una máquina OpenSSL que puede proporcionar el certificado del cliente.
  * `handshakeTimeout` {number} Anula la conexión si el establecimiento de comunicación SSL/TLS no finaliza en la cantidad especificada de milisegundos. Se emite un `'tlsClientError'` en el objeto `tls.Server` cada vez que se agota el establecimiento de comunicación. **Predeterminado:** `120000` (120 segundos).
  * `requestCert` {boolean} Si es `true` el servidor solicitará un certificado de los clientes que se conectan e intentan verificar ese certificado. **Predeterminado:** `false`.
  * `rejectUnauthorized` {boolean} Si no es `false`, el servidor rechazará cualquier conexión que no esté autorizada con la lista de CA suministradas. Esta opción solo tiene efecto si `requestCert` es `true`. **Predeterminado:** `true`.
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} Una array de strings, `Buffer`s o `Uint8Array`, o un único `Buffer` o `Uint8Array` que contiene los protocolos ALPN admitidos. Los `Buffer`s deben tener el formato `[len][name][len][name]...` por ejemplo `0x05hello0x05world`, donde el primer byte es la longitud del siguiente nombre de protocolo. Pasar un array suele ser mucho más simple, por ejemplo `['hello', 'world']`. (Los protocolos deben ordenarse por su prioridad.)
  * `SNICallback(servername, cb)` {Function} Una función que se llamará si el cliente admite la extensión SNI TLS. Se pasarán dos argumentos cuando se le llame: `servername` y `cb`. `SNICallback` debería invocar `cb(null, ctx)`, donde `ctx` es una instancia de `SecureContext`. (`tls.createSecureContext(...)` se puede usar para obtener un `SecureContext` apropiado.) Si no se proporcionó `SNICallback`, se utilizará el callback predeterminado con API de alto nivel (vea a continuación).
  * `sessionTimeout` {number} Un entero que especifica el número de segundos después del cual se agotarán los identificadores de sesión TLS y los tickets de sesión TLS creados por el servidor. Vea [`SSL_CTX_set_timeout`] para más detalles.
  * `ticketKeys`: Instancia `Buffer` de 48 bytes que consiste en un prefijo de 16 bytes, una clave HMAC de 16 bytes y una clave AES de 16 bytes. Esto se puede usar para aceptar tickets de sesión TLS en varias instancias del servidor TLS.
  * ...: Se pueden proporcionar las opciones [`tls.createSecureContext()`][]. Para los servidores, generalmente se requieren las opciones de identidad (`pfx` o `key`/`cert`).
* `secureConnectionListener` {Function}

Crea un nuevo [`tls.Server`][]. El `secureConnectionListener`, si se proporciona, se configura automáticamente como un listener para el evento [`'secureConnection'`][] event.

Las opciones `ticketKeys` se comparten automáticamente entre los workers del módulo `cluster`.

Lo siguiente ilustra un servidor de eco simple:

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),

// Esto es necesario solo si se usa la autenticación del certificado del cliente.
  requestCert: true,

// Esto es necesario solo si el cliente usa el certificado autofirmado.
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

O

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('server.pfx'),

// Esto es necesario solo si se usa la autenticación del certificado del cliente.
  requestCert: true,
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

Este servidor se puede probar conectándose a él usando `openssl s_client`:

```sh
openssl s_client -connect 127.0.0.1:8000
```

## tls.getCiphers()

<!-- YAML
added: v0.10.2
-->

* Devuelve: {string[]}

Devuelve un array con los nombres de los cifrados SSL admitidos.

Por ejemplo:

```js
console.log(tls.getCiphers()); // ['AES128-SHA', 'AES256-SHA', ...]
```

## tls.DEFAULT_ECDH_CURVE

<!-- YAML
added: v0.11.13
-->

El nombre de la curva por defecto para usar para el acuerdo de clave ECDH en un servidor tls. El valor predeterminado es `'auto'`. Consulte [`tls.createSecureContext()`] para obtener más información.

## APIs Desaprobadas

### Clase: CryptoStream

<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

> Estabilidad: 0 - Desaprobado: Usar [`tls.TLSSocket`][] en su lugar.

La clase `tls.CryptoStream` representa un stream de datos encriptados. Esta clase ha sido desaprobada y ya no debe usarse.

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

Al igual que con la comprobación del evento [`'secureConnection'`](#tls_event_secureconnection) del servidor, se debe inspeccionar `pair.cleartext.authorized` para confirmar si el certificado utilizado está debidamente autorizado.

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
* `rejectUnauthorized` {boolean} Si no es `false` un servidor rechaza automáticamente clientes con certificados inválidos. Solo aplica cuando `isServer` es `true`.
* `opciones` 
  * `secureContext`: Un objeto de contexto TLS opcional de [`tls.createSecureContext()`][]
  * `isServer`: Si es `true` el socket TLS será instanciado en modo servidor. **Predeterminado:** `false`.
  * `server` {net.Server} Una instancia opcional [`net.Server`][]
  * `requestCert`: Opcional, vea [`tls.createServer()`][]
  * `rejectUnauthorized`: Opcional, vea [`tls.createServer()`][]
  * `ALPNProtocols`: Opcional, vea [`tls.createServer()`][]
  * `SNICallback`: Opcional, vea [`tls.createServer()`][]
  * `session` {Buffer} Una instancia `Buffer` opcional que contiene una sesión TLS.
  * `requestOCSP` {boolean} Si es `true`, especifica que la extensión de solicitud de estado OCSP se agregará al hello del cliente y se emitirá un evento `'OCSPResponse'` en el socket antes de establecer una comunicación segura.

Crea un nuevo objeto de par seguro con dos streams, uno de los cuales lee y escribe los datos encriptados, y el que otro lee y escribe los datos cleartext. En general, el stream encriptado se canaliza hacia/desde un stream de datos encriptados entrantes y el de cleartext se utiliza como reemplazo del stream encriptado inicial.

`tls.createSecurePair()` devuelve un objeto `tls.SecurePair` con las propiedades stream `cleartext` y `encrypted`.

El uso de `cleartext` tiene la misma API que [`tls.TLSSocket`][].

El método `tls.createSecurePair()` ahora está desaprobado, a favor de `tls.TLSSocket()`. Por ejemplo, el código:

```js
pair = tls.createSecurePair(/* ... */);
pair.encrypted.pipe(socket);
socket.pipe(pair.encrypted);
```

puede ser reemplazado por:

```js
secureSocket = tls.TLSSocket(socket, options);
```

donde `secureSocket` tiene la misma API que `pair.cleartext`.