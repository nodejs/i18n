# TLS (SSL)

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

The `tls` module provides an implementation of the Transport Layer Security (TLS) and Secure Socket Layer (SSL) protocols that is built on top of OpenSSL. Si può accedere al modulo utilizzando:

```js
const tls = require('tls');
```

## Concetti TLS/SSL

Il TLS/SSL è un infrastruttura a chiave publica/privata (PKI). For most common cases, each client and server must have a *private key*.

Le chiavi private possono essere generate in diversi modi. The example below illustrates use of the OpenSSL command-line interface to generate a 2048-bit RSA private key:

```sh
openssl genrsa -out ryans-key.pem 2048
```

Con TLS/SSL, tutti i server (e alcuni client) devono avere un *certificate*. Certificates are *public keys* that correspond to a private key, and that are digitally signed either by a Certificate Authority or by the owner of the private key (such certificates are referred to as "self-signed"). The first step to obtaining a certificate is to create a *Certificate Signing Request* (CSR) file.

The OpenSSL command-line interface can be used to generate a CSR for a private key:

```sh
openssl req -new -sha256 -key ryans-key.pem -out ryans-csr.pem
```

Once the CSR file is generated, it can either be sent to a Certificate Authority for signing or used to generate a self-signed certificate.

Creating a self-signed certificate using the OpenSSL command-line interface is illustrated in the example below:

```sh
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

Once the certificate is generated, it can be used to generate a `.pfx` or `.p12` file:

```sh
openssl pkcs12 -export -in ryans-cert.pem -inkey ryans-key.pem \
      -certfile ca-cert.pem -out ryans.pfx
```

Dove:

* `in`: è il certificato firmato
* `inkey`: è la chiave privata associata
* `certfile`: è una concatenazione di tutte le Autorità di Certificazione (CA) certs in un singolo file, ad es.`cât ca-cert.pem ca-cert.pem > ca-cert.pem`

### Perfect Forward Secrecy

<!-- type=misc -->

The term "[Forward Secrecy](https://en.wikipedia.org/wiki/Perfect_forward_secrecy)" or "Perfect Forward Secrecy" describes a feature of key-agreement (i.e., key-exchange) methods. That is, the server and client keys are used to negotiate new temporary keys that are used specifically and only for the current communication session. Practically, this means that even if the server's private key is compromised, communication can only be decrypted by eavesdroppers if the attacker manages to obtain the key-pair specifically generated for the session.

Perfect Forward Secrecy is achieved by randomly generating a key pair for key-agreement on every TLS/SSL handshake (in contrast to using the same key for all sessions). I metodi che implementano questa tecnica vengono chiamati "ephemeral" (effimeri).

Currently two methods are commonly used to achieve Perfect Forward Secrecy (note the character "E" appended to the traditional abbreviations):

* [DHE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) - Una versione effimera del protocollo di key-agreement Diffie Hellman.
* [ECDHE](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) - An ephemeral version of the Elliptic Curve Diffie Hellman key-agreement protocol.

Ephemeral methods may have some performance drawbacks, because key generation is expensive.

To use Perfect Forward Secrecy using `DHE` with the `tls` module, it is required to generate Diffie-Hellman parameters and specify them with the `dhparam` option to [`tls.createSecureContext()`][]. The following illustrates the use of the OpenSSL command-line interface to generate such parameters:

```sh
openssl dhparam -outform PEM -out dhparam.pem 2048
```

If using Perfect Forward Secrecy using `ECDHE`, Diffie-Hellman parameters are not required and a default ECDHE curve will be used. The `ecdhCurve` property can be used when creating a TLS Server to specify the list of names of supported curves to use, see [`tls.createServer()`] for more info.

### ALPN e SNI

<!-- type=misc -->

ALPN (Application-Layer Protocol Negotiation Extension) and SNI (Server Name Indication) are TLS handshake extensions:

* ALPN - Consente l'utilizzo di un server TLS per più protocolli (HTTP, HTTP/2)
* SNI - Allows the use of one TLS server for multiple hostnames with different SSL certificates.

### Client-initiated renegotiation attack mitigation

<!-- type=misc -->

The TLS protocol allows clients to renegotiate certain aspects of the TLS session. Unfortunately, session renegotiation requires a disproportionate amount of server-side resources, making it a potential vector for denial-of-service attacks.

Per mitigare i rischi, la rinegoziazione viene limitata a tre volte ogni dieci minuti. An `'error'` event is emitted on the [`tls.TLSSocket`][] instance when this threshold is exceeded. I limiti sono configurabili:

* `tls.CLIENT_RENEG_LIMIT` {number} Specifies the number of renegotiation requests. **Predefinito** `3`.
* `tls.CLIENT_RENEG_WINDOW` {number} Specifies the time renegotiation window in seconds. **Predefinito:** `600` (10 minuti).

The default renegotiation limits should not be modified without a full understanding of the implications and risks.

### Session Resumption

Establishing a TLS session can be relatively slow. The process can be sped up by saving and later reusing the session state. There are several mechanisms to do so, discussed here from oldest to newest (and preferred).

***Session Identifiers*** Servers generate a unique ID for new connections and send it to the client. Clients and servers save the session state. When reconnecting, clients send the ID of their saved session state and if the server also has the state for that ID, it can agree to use it. Otherwise, the server will create a new session. See [RFC 2246](https://www.ietf.org/rfc/rfc2246.txt) for more information, page 23 and 30.

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

## Modificare la suite del Cipher TLS predefinito

Node.js è costruito con una suite predefinita di cifrature TLS abilitate e disabilitate. Attualmente, la suite di cifratura predefinita è:

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

The default can also be replaced on a per client or server basis using the `ciphers` option from [`tls.createSecureContext()`][], which is also available in [`tls.createServer()`], [`tls.connect()`], and when creating new [`tls.TLSSocket`]s.

Per ulteriori dettagli sul formato consultare la [documentazione della lista di formati di cifratura OpenSSL](https://www.openssl.org/docs/man1.1.0/apps/ciphers.html#CIPHER-LIST-FORMAT).

The default cipher suite included within Node.js has been carefully selected to reflect current security best practices and risk mitigation. Changing the default cipher suite can have a significant impact on the security of an application. The `--tls-cipher-list` switch and `ciphers` option should by used only if absolutely necessary.

The default cipher suite prefers GCM ciphers for [Chrome's 'modern cryptography' setting](https://www.chromium.org/Home/chromium-security/education/tls#TOC-Cipher-Suites) and also prefers ECDHE and DHE ciphers for Perfect Forward Secrecy, while offering *some* backward compatibility.

128 bit AES is preferred over 192 and 256 bit AES in light of [specific attacks affecting larger AES key sizes](https://www.schneier.com/blog/archives/2009/07/another_new_aes.html).

Old clients that rely on insecure and deprecated RC4 or DES-based ciphers (like Internet Explorer 6) cannot complete the handshaking process with the default configuration. If these clients *must* be supported, the [TLS recommendations](https://wiki.mozilla.org/Security/Server_Side_TLS) may offer a compatible cipher suite. For more details on the format, see the [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.1.0/apps/ciphers.html#CIPHER-LIST-FORMAT).

## Classe: tls.Server

<!-- YAML
added: v0.3.2
-->

The `tls.Server` class is a subclass of `net.Server` that accepts encrypted connections using TLS or SSL.

### Event: 'newSession'

<!-- YAML
added: v0.9.2
-->

L'evento `'newSession'` viene emesso alla creazione di una nuova sessione di TLS. This may be used to store sessions in external storage. The data should be provided to the [`'resumeSession'`][] callback.

Il callback del listener riceve tre argomenti quando viene chiamato:

* `sessionId` {Buffer} The TLS session identifier
* `sessionData` {Buffer} The TLS session data
* `callback` {Function} A callback function taking no arguments that must be invoked in order for data to be sent or received over the secure connection.

Listening for this event will have an effect only on connections established after the addition of the event listener.

### Evento: 'OCSPRequest'

<!-- YAML
added: v0.11.13
-->

The `'OCSPRequest'` event is emitted when the client sends a certificate status request. Il callback del listener riceve tre argomenti quando viene chiamato:

* `certificate` {Buffer} Il certificato del server
* `issuer` {Buffer} Il certificato dell’emittente
* `callback` {Function} A callback function that must be invoked to provide the results of the OCSP request.

The server's current certificate can be parsed to obtain the OCSP URL and certificate ID; after obtaining an OCSP response, `callback(null, resp)` is then invoked, where `resp` is a `Buffer` instance containing the OCSP response. Both `certificate` and `issuer` are `Buffer` DER-representations of the primary and issuer's certificates. These can be used to obtain the OCSP certificate ID and OCSP endpoint URL.

Alternatively, `callback(null, null)` may be called, indicating that there was no OCSP response.

Chiamare `callback(err)` darà come risultato la chiamata a `socket.destroy(err)`.

Il flusso tipico di una richiesta OCSP è il seguente:

1. Il client si connette al server e invia una `'OCSPRequest'` (attraverso l'estensione di informazione dello stato in ClientHello).
2. Il server riceve la richiesta ed emette l'evento `'OCSPRequest'`, chiamando il listener se è registrato.
3. Il server estrae l'URL OCSP dal `certificato` o dall'`emittente` e invia una richiesta [OCSP](https://en.wikipedia.org/wiki/OCSP_stapling) al CA.
4. Server receives `'OCSPResponse'` from the CA and sends it back to the client via the `callback` argument
5. Il client convalida la risposta e alternativamente distrugge il socket oppure esegue un handshake.

The `issuer` can be `null` if the certificate is either self-signed or the issuer is not in the root certificates list. (An issuer may be provided via the `ca` option when establishing the TLS connection.)

Listening for this event will have an effect only on connections established after the addition of the event listener.

Per analizzare i certificati potrebbe essere usato un modulo npm come [asn.js](https://www.npmjs.com/package/asn1.js).

### Event: 'resumeSession'

<!-- YAML
added: v0.9.2
-->

The `'resumeSession'` event is emitted when the client requests to resume a previous TLS session. The listener callback is passed two arguments when called:

* `sessionId` {Buffer} The TLS session identifier
* `callback` {Function} A callback function to be called when the prior session has been recovered: `callback([err[, sessionData]])` 
  * `err` {Error}
  * `sessionData` {Buffer}

The event listener should perform a lookup in external storage for the `sessionData` saved by the [`'newSession'`][] event handler using the given `sessionId`. If found, call `callback(null, sessionData)` to resume the session. If not found, the session cannot be resumed. `callback()` must be called without `sessionData` so that the handshake can continue and a new session can be created. It is possible to call `callback(err)` to terminate the incoming connection and destroy the socket.

Listening for this event will have an effect only on connections established after the addition of the event listener.

Di seguito viene illustrato come si riprende un sessione TLS:

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

The `'secureConnection'` event is emitted after the handshaking process for a new connection has successfully completed. Il callback del listener riceve un solo argomento quando viene chiamato:

* `tlsSocket` {tls.TLSSocket} Il socket TLS stabilito.

The `tlsSocket.authorized` property is a `boolean` indicating whether the client has been verified by one of the supplied Certificate Authorities for the server. If `tlsSocket.authorized` is `false`, then `socket.authorizationError` is set to describe how authorization failed. Note that depending on the settings of the TLS server, unauthorized connections may still be accepted.

The `tlsSocket.alpnProtocol` property is a string that contains the selected ALPN protocol. When ALPN has no selected protocol, `tlsSocket.alpnProtocol` equals `false`.

The `tlsSocket.servername` property is a string containing the server name requested via SNI.

### Evento: 'tlsClientError'

<!-- YAML
added: v6.0.0
-->

The `'tlsClientError'` event is emitted when an error occurs before a secure connection is established. The listener callback is passed two arguments when called:

* `exception` {Error} L'`Error` object che descrive l'errore
* `tlsSocket` {tls.TLSSocket} The `tls.TLSSocket` instance from which the error originated.

### server.addContext(hostname, context)

<!-- YAML
added: v0.5.3
-->

* `hostname` {string} Un host name SNI o carattere jolly (ad es. `*`)
* `context` {Object} An object containing any of the possible properties from the [`tls.createSecureContext()`][] `options` arguments (e.g. `key`, `cert`, `ca`, etc).

The `server.addContext()` method adds a secure context that will be used if the client request's SNI name matches the supplied `hostname` (or wildcard).

### indirizzi del server()

<!-- YAML
added: v0.6.0
-->

* Restituisce: {Object}

Returns the bound address, the address family name, and port of the server as reported by the operating system. See [`net.Server.address()`][] for more information.

### server.close([callback])

<!-- YAML
added: v0.3.2
-->

* `callback` {Function} A listener callback that will be registered to listen for the server instance's `'close'` event.
* Restituisce: {tls.Server}

Il metodo `server.close()` blocca l'accettazione di nuove connessioni da parte del server.

La funzione opera in modo asincrono. The `'close'` event will be emitted when the server has no more open connections.

### server.connections

<!-- YAML
added: v0.3.2
deprecated: v0.9.7
-->

> Stabilità: 0 - Deprecato: Utilizza invece [`server.getConnections()`][].

* {number}

Restituisce il numero attuale di connessioni simultanee sul server.

### server.getTicketKeys()

<!-- YAML
added: v3.0.0
-->

* Returns: {Buffer} A 48-byte buffer containing the session ticket keys.

Returns the session ticket keys.

See [Session Resumption](#tls_session_resumption) for more information.

### server.listen()

Avvia il server che esegue il listening per le connessioni criptate. Questo metodo è identico a [`server.listen()`][] da [`net.Server`][].

### server.setTicketKeys(keys)

<!-- YAML
added: v3.0.0
-->

* `keys` {Buffer} A 48-byte buffer containing the session ticket keys.

Sets the session ticket keys.

Le modifiche alle chiavi del ticket sono efficaci solo per le future connessioni al server. Le connessioni al server esistenti o in attesa utilizzeranno le chiavi precedenti.

See [Session Resumption](#tls_session_resumption) for more information.

## Classe: tls.TLSSocket

<!-- YAML
added: v0.11.4
-->

The `tls.TLSSocket` is a subclass of [`net.Socket`][] that performs transparent encryption of written data and all required TLS negotiation.

Le istanze di `tls.TLSSocket` implementano l'interfaccia duplex [Stream](stream.html#stream_stream).

Methods that return TLS connection metadata (e.g. [`tls.TLSSocket.getPeerCertificate()`][] will only return data while the connection is open.

### new tls.TLSSocket(socket[, options])

<!-- YAML
added: v0.11.4
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `socket` {net.Socket|stream.Duplex} Sul lato server, qualsiasi stream `Duplex`. On the client side, any instance of [`net.Socket`][] (for generic `Duplex` stream support on the client side, [`tls.connect()`][] must be used).
* `opzioni` {Object} 
  * `isServer`: The SSL/TLS protocol is asymmetrical, TLSSockets must know if they are to behave as a server or a client. If `true` the TLS socket will be instantiated as a server. **Default** `false`.
  * `server` {net.Server} A [`net.Server`][] instance.
  * `requestCert`: Se autenticare o meno il peer remoto richiedendo un certificato. I client richiedono sempre un certificato del server. Servers (`isServer` is true) may set `requestCert` to true to request a client certificate.
  * `rejectUnauthorized`: See [`tls.createServer()`][]
  * `ALPNProtocols`: See [`tls.createServer()`][]
  * `SNICallback`: See [`tls.createServer()`][]
  * `session` {Buffer} A `Buffer` instance containing a TLS session.
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication
  * `secureContext`: TLS context object created with [`tls.createSecureContext()`][]. If a `secureContext` is *not* provided, one will be created by passing the entire `options` object to `tls.createSecureContext()`.
  * ...: [`tls.createSecureContext()`][] options that are used if the `secureContext` option is missing. Otherwise, they are ignored.

Costruisce un nuovo `tls.TLSSocket` object da un socket TCP esistente.

### Evento: 'OCSPResponse'

<!-- YAML
added: v0.11.13
-->

The `'OCSPResponse'` event is emitted if the `requestOCSP` option was set when the `tls.TLSSocket` was created and an OCSP response has been received. Il callback del listener riceve un solo argomento quando viene chiamato:

* `respone` {Buffer} La risposta del server OCSP

Typically, the `response` is a digitally signed object from the server's CA that contains information about server's certificate revocation status.

### Evento: 'secureConnect'

<!-- YAML
added: v0.11.4
-->

The `'secureConnect'` event is emitted after the handshaking process for a new connection has successfully completed. The listener callback will be called regardless of whether or not the server's certificate has been authorized. It is the client's responsibility to check the `tlsSocket.authorized` property to determine if the server certificate was signed by one of the specified CAs. If `tlsSocket.authorized === false`, then the error can be found by examining the `tlsSocket.authorizationError` property. If ALPN was used, the `tlsSocket.alpnProtocol` property can be checked to determine the negotiated protocol.

### tlsSocket.address()

<!-- YAML
added: v0.11.4
-->

* Restituisce: {Object}

Returns the bound `address`, the address `family` name, and `port` of the underlying socket as reported by the operating system: `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`.

### tlsSocket.authorizationError

<!-- YAML
added: v0.11.4
-->

Restituisce il motivo per cui non è stato verificato il certificato del peer. This property is set only when `tlsSocket.authorized === false`.

### tlsSocket.authorized

<!-- YAML
added: v0.11.4
-->

* Restituisce: {boolean}

Returns `true` if the peer certificate was signed by one of the CAs specified when creating the `tls.TLSSocket` instance, otherwise `false`.

### tlsSocket.disableRenegotiation()

<!-- YAML
added: v8.4.0
-->

Disabilita la rinegoziazione TLS per questa istanza `TLSSocket`. Once called, attempts to renegotiate will trigger an `'error'` event on the `TLSSocket`.

### tlsSocket.encrypted

<!-- YAML
added: v0.11.4
-->

Restituisce sempre `true`. This may be used to distinguish TLS sockets from regular `net.Socket` instances.

### tlsSocket.getCipher()

<!-- YAML
added: v0.11.4
-->

* Restituisce: {Object}

Restituisce un object che rappresenta il nome del cifrario. The `version` key is a legacy field which always contains the value `'TLSv1/SSLv3'`.

For example: `{ name: 'AES256-SHA', version: 'TLSv1/SSLv3' }`.

See `SSL_CIPHER_get_name()` in [https://www.openssl.org/docs/man1.1.0/ssl/SSL_CIPHER_get_name.html](https://www.openssl.org/docs/man1.1.0/ssl/SSL_CIPHER_get_name.html) for more information.

### tlsSocket.getEphemeralKeyInfo()

<!-- YAML
added: v5.0.0
-->

* Restituisce: {Object}

Returns an object representing the type, name, and size of parameter of an ephemeral key exchange in [Perfect Forward Secrecy](#tls_perfect_forward_secrecy) on a client connection. It returns an empty object when the key exchange is not ephemeral. As this is only supported on a client socket; `null` is returned if called on a server socket. I tipi supportati sono `'DH' ` e `'ECDH'`. The `name` property is available only when type is `'ECDH'`.

Per esempio: `{ type: 'ECDH', name: 'prime256v1', size: 256 }`.

### tlsSocket.getFinished()

<!-- YAML
added: v9.9.0
-->

* Returns: {Buffer|undefined} The latest `Finished` message that has been sent to the socket as part of a SSL/TLS handshake, or `undefined` if no `Finished` message has been sent yet.

As the `Finished` messages are message digests of the complete handshake (with a total of 192 bits for TLS 1.0 and more for SSL 3.0), they can be used for external authentication procedures when the authentication provided by SSL/TLS is not desired or is not enough.

Corresponds to the `SSL_get_finished` routine in OpenSSL and may be used to implement the `tls-unique` channel binding from [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getPeerCertificate([detailed])

<!-- YAML
added: v0.11.4
-->

* `detailed` {boolean} Include the full certificate chain if `true`, otherwise include just the peer's certificate.
* Restituisce: {Object}

Restituisce un object che rappresenta il certificato del peer. The returned object has some properties corresponding to the fields of the certificate.

If the full certificate chain was requested, each certificate will include an `issuerCertificate` property containing an object representing its issuer's certificate.

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
   { ... un altro certificato, possibilmente con un
.issuerCertificate ... },
  raw: < RAW DER buffer >,
  pubkey: < RAW DER buffer >,
  valid_from: 'Nov 11 09:52:22 2009 GMT',
  valid_to: 'Nov 6 09:52:22 2029 GMT',
  fingerprint: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF',
  fingerprint256: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF:00:11:22:33:44:55:66:77:88:99:AA:BB',
  serialNumber: 'B9B0D332A1AA5635' }
```

Se il peer non fornisce un certificato, verrà restituito un object vuoto.

### tlsSocket.getPeerFinished()

<!-- YAML
added: v9.9.0
-->

* Returns: {Buffer|undefined} The latest `Finished` message that is expected or has actually been received from the socket as part of a SSL/TLS handshake, or `undefined` if there is no `Finished` message so far.

As the `Finished` messages are message digests of the complete handshake (with a total of 192 bits for TLS 1.0 and more for SSL 3.0), they can be used for external authentication procedures when the authentication provided by SSL/TLS is not desired or is not enough.

Corresponds to the `SSL_get_peer_finished` routine in OpenSSL and may be used to implement the `tls-unique` channel binding from [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getProtocol()

<!-- YAML
added: v5.7.0
-->

* Restituisce: {string|null}

Returns a string containing the negotiated SSL/TLS protocol version of the current connection. The value `'unknown'` will be returned for connected sockets that have not completed the handshaking process. The value `null` will be returned for server sockets or disconnected client sockets.

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

Returns the string representation of the local IP address.

### tlsSocket.localPort

<!-- YAML
added: v0.11.4
-->

* {number}

Restituisce la rappresentazione numerica della porta locale.

### tlsSocket.remoteAddress

<!-- YAML
added: v0.11.4
-->

* {string}

Restituisce la rappresentazione di tipo stringa dell'indirizzo IP remoto. For example, `'74.125.127.100'` or `'2001:4860:a005::68'`.

### tlsSocket.remoteFamily

<!-- YAML
added: v0.11.4
-->

* {string}

Returns the string representation of the remote IP family. `'IPv4'` o `'IPv6'`.

### tlsSocket.remotePort

<!-- YAML
added: v0.11.4
-->

* {number}

Restituisce la rappresentazione numerica della porta remota. Per esempio, `443`.

### tlsSocket.renegotiate(options, callback)

<!-- YAML
added: v0.11.8
-->

* `opzioni` {Object} 
  * `rejectUnauthorized` {boolean} If not `false`, the server certificate is verified against the list of supplied CAs. An `'error'` event is emitted if verification fails; `err.code` contains the OpenSSL error code. **Default:** `true`.
  * `requestCert`
* `callback` {Function} A function that will be called when the renegotiation request has been completed.

Il metodo `tlsSocket.renegotiate()` avvia un processo di rinegoziazione TLS. Upon completion, the `callback` function will be passed a single argument that is either an `Error` (if the request failed) or `null`.

This method can be used to request a peer's certificate after the secure connection has been established.

When running as the server, the socket will be destroyed with an error after `handshakeTimeout` timeout.

### tlsSocket.setMaxSendFragment(size)

<!-- YAML
added: v0.11.11
-->

* `size` {number} La dimensione massima del frammento TLS. Il valore massimo è `16384`. **Default:** `16384`.
* Restituisce: {boolean}

Il metodo `tlsSocket.setMaxSendFragment()` imposta la dimensione massima del frammento TLS. Restituisce `true` se l'impostazione del limite è riuscita; altrimenti `false`.

Smaller fragment sizes decrease the buffering latency on the client: larger fragments are buffered by the TLS layer until the entire fragment is received and its integrity is verified; large fragments can span multiple roundtrips and their processing can be delayed due to packet loss or reordering. However, smaller fragments add extra TLS framing bytes and CPU overhead, which may decrease overall server throughput.

## tls.checkServerIdentity(hostname, cert)

<!-- YAML
added: v0.8.4
-->

* `hostname` {string} The host name or IP address to verify the certificate against.
* `cert` {Object} Un object che rappresenta il certificato del peer. The returned object has some properties corresponding to the fields of the certificate.
* Restituisce: {Error|undefined}

Verifies the certificate `cert` is issued to `hostname`.

Returns {Error} object, populating it with `reason`, `host`, and `cert` on failure. On success, returns {undefined}.

This function can be overwritten by providing alternative function as part of the `options.checkServerIdentity` option passed to `tls.connect()`. The overwriting function can call `tls.checkServerIdentity()` of course, to augment the checks done with additional verification.

This function is only called if the certificate passed all other checks, such as being issued by trusted CA (`options.ca`).

The cert object contains the parsed certificate and will have a structure similar to:

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

* `opzioni` {Object} 
  * `host` {string} Il host a cui il client si dovrebbe connettere. **Default:** `'localhost'`.
  * `port` {number} La porta a cui il client si dovrebbe connettere.
  * `path` {string} Crea una connessione di tipo socket unix al percorso. If this option is specified, `host` and `port` are ignored.
  * `socket` {stream.Duplex} Establish secure connection on a given socket rather than creating a new socket. Typically, this is an instance of [`net.Socket`][], but any `Duplex` stream is allowed. If this option is specified, `path`, `host` and `port` are ignored, except for certificate validation. Usually, a socket is already connected when passed to `tls.connect()`, but it can be connected later. Note that connection/disconnection/destruction of `socket` is the user's responsibility, calling `tls.connect()` will not cause `net.connect()` to be called.
  * `rejectUnauthorized` {boolean} If not `false`, the server certificate is verified against the list of supplied CAs. An `'error'` event is emitted if verification fails; `err.code` contains the OpenSSL error code. **Default:** `true`.
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing the supported ALPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `'\x08http/1.1\x08http/1.0'`, where the `len` byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['http/1.1', 'http/1.0']`. Protocols earlier in the list have higher preference than those later.
  * `servername`: {string} Server name for the SNI (Server Name Indication) TLS extension. It is the name of the host being connected to, and must be a host name, and not an IP address. It can be used by a multi-homed server to choose the correct certificate to present to the client, see the `SNICallback` option to [`tls.createServer()`][].
  * `checkServerIdentity(servername, cert)` {Function} A callback function to be used (instead of the builtin `tls.checkServerIdentity()` function) when checking the server's hostname (or the provided `servername` when explicitly set) against the certificate. This should return an {Error} if verification fails. The method should return `undefined` if the `servername` and `cert` are verified.
  * `session` {Buffer} Un instanza `Buffer`, contenente la sessione TLS.
  * `minDHSize` {number} Minimum size of the DH parameter in bits to accept a TLS connection. When a server offers a DH parameter with a size less than `minDHSize`, the TLS connection is destroyed and an error is thrown. **Default:** `1024`.
  * `secureContext`: TLS context object created with [`tls.createSecureContext()`][]. If a `secureContext` is *not* provided, one will be created by passing the entire `options` object to `tls.createSecureContext()`.
  * `lookup` {Function} Funzione lookup (di ricerca) personalizzata. **Default:** [`dns.lookup()`][].
  * `timeout`: {number} If set and if a socket is created internally, will call [`socket.setTimeout(timeout)`][] after the socket is created, but before it starts the connection.
  * ...: [`tls.createSecureContext()`][] options that are used if the `secureContext` option is missing, otherwise they are ignored.
* `callback` {Function}
* Restituisce: {tls.TLSSocket}

The `callback` function, if specified, will be added as a listener for the [`'secureConnect'`][] event.

`tls.connect()` restituisce un object [`tls.TLSSocket`][].

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

* `path` {string} Valore predefinito per `options.path`.
* `options` {Object} Vedi [`tls.connect()`][].
* `callback` {Function} Vedi [`tls.connect()`][].
* Restituisce: {tls.TLSSocket}

Same as [`tls.connect()`][] except that `path` can be provided as an argument instead of an option.

Un'opzione path, se specificata, avrà la precedenza sull'argomento path.

## tls.connect(port\[, host\]\[, options\][, callback])

<!-- YAML
added: v0.11.3
-->

* `port` {number} Valore predefinito per `options.port`.
* `host` {string} Default value for `options.host`.
* `options` {Object} Vedi [`tls.connect()`][].
* `callback` {Function} Vedi [`tls.connect()`][].
* Restituisce: {tls.TLSSocket}

Same as [`tls.connect()`][] except that `port` and `host` can be provided as arguments instead of options.

A port or host option, if specified, will take precedence over any port or host argument.

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

* `options` {Object} 
  * `ca` {string|string[]|Buffer|Buffer[]} Optionally override the trusted CA certificates. Default is to trust the well-known CAs curated by Mozilla. Le CA di Mozilla vengono sostituite completamente quando le CA sono specificate esplicitamente utilizzando questa opzione. The value can be a string or `Buffer`, or an `Array` of strings and/or `Buffer`s. Any string or `Buffer` can contain multiple PEM CAs concatenated together. Il certificato del peer deve poter essere concatenato a una CA di fiducia del server affinché la connessione venga autenticata. Quando vengono utilizzati certificati che non sono concatenati a una CA ben nota, La CA del certificato deve essere specificata esplicitamente come attendibile altrimenti la connessione non si potrà autenticare. Se il peer utilizza un certificato che non corrisponde o si concatena a una delle CA predefinite, utilizzare l'opzione `ca` per fornire un certificato CA a cui il certificato del peer può corrispondere o concatenare. Per i certificati auto-firmati, il certificato è la propria CA, e deve essere fornito. For PEM encoded certificates, supported types are "X509 CERTIFICATE", and "CERTIFICATE".
  * `cert` {string|string[]|Buffer|Buffer[]} Cert chains in PEM format. One cert chain should be provided per private key. Each cert chain should consist of the PEM formatted certificate for a provided private `key`, followed by the PEM formatted intermediate certificates (if any), in order, and not including the root CA (the root CA must be pre-known to the peer, see `ca`). When providing multiple cert chains, they do not have to be in the same order as their private keys in `key`. If the intermediate certificates are not provided, the peer will not be able to validate the certificate, and the handshake will fail.
  * `ciphers` {string} Cipher suite specification, replacing the default. For more information, see [modifying the default cipher suite](#tls_modifying_the_default_tls_cipher_suite).
  * `clientCertEngine` {string} Name of an OpenSSL engine which can provide the client certificate.
  * `crl` {string|string[]|Buffer|Buffer[]} PEM formatted CRLs (Certificate Revocation Lists).
  * `dhparam` {string|Buffer} Parametri DiffieHellman, necessari per [Perfect Forward Secrecy](#tls_perfect_forward_secrecy). Usa `openssl dhparam` per creare i parametri. La lunghezza della chiave deve essere maggiore di o uguale a 1024 bits, altrimenti verrà generato un errore. Si raccomanda vivamente l'utilizzo di 2048 bits o più per una maggiore sicurezza. If omitted or invalid, the parameters are silently discarded and DHE ciphers will not be available.
  * `ecdhCurve` {string} A string describing a named curve or a colon separated list of curve NIDs or names, for example `P-521:P-384:P-256`, to use for ECDH key agreement. Set to `auto` to select the curve automatically. Use [`crypto.getCurves()`][] to obtain a list of available curve names. Nelle versioni più recenti, `openssl ecparam -list_curves` mostrerà anche il nome e la descrizione di ogni curva ellittica disponibile. **Default:** [`tls.DEFAULT_ECDH_CURVE`].
  * `honorCipherOrder` {boolean} Tentativo di utilizzare le preferenze della suite di cifratura del server invece di quella del client. Quando è `true`, causa l'impostazione di `SSL_OP_CIPHER_SERVER_PREFERENCE` in `secureOptions`, per ulteriori informazioni visualizza [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `key` {string|string[]|Buffer|Buffer[]|Object[]} Private keys in PEM format. PEM allows the option of private keys being encrypted. Encrypted keys will be decrypted with `options.passphrase`. Multiple keys using different algorithms can be provided either as an array of unencrypted key strings or buffers, or an array of objects in the form `{pem: <string|buffer>[,
passphrase: <string>]}`. The object form can only occur in an array. `object.passphrase` è facoltativo. Encrypted keys will be decrypted with `object.passphrase` if provided, or `options.passphrase` if it is not.
  * `maxVersion` {string} Optionally set the maximum TLS version to allow. One of `TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the `secureProtocol` option, use one or the other. **Default:** [`tls.DEFAULT_MAX_VERSION`][].
  * `minVersion` {string} Optionally set the minimum TLS version to allow. One of `TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. Cannot be specified along with the `secureProtocol` option, use one or the other. It is not recommended to use less than TLSv1.2, but it may be required for interoperability. **Default:** [`tls.DEFAULT_MIN_VERSION`][].
  * `passphrase` {string} Shared passphrase used for a single private key and/or a PFX.
  * `pfx` {string|string[]|Buffer|Buffer[]|Object[]} PFX or PKCS12 encoded private key and certificate chain. `pfx` is an alternative to providing `key` and `cert` individually. PFX is usually encrypted, if it is, `passphrase` will be used to decrypt it. Multiple PFX can be provided either as an array of unencrypted PFX buffers, or an array of objects in the form `{buf: <string|buffer>[, passphrase: <string>]}`. The object form can only occur in an array. `object.passphrase` è facoltativo. Encrypted PFX will be decrypted with `object.passphrase` if provided, or `options.passphrase` if it is not.
  * `secureOptions` {number} Influisce facoltativamente sul comportamento del protocollo OpenSSL, il che di solito non è necessario. This should be used carefully if at all! Value is a numeric bitmask of the `SSL_OP_*` options from [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `secureProtocol` {string} The TLS protocol version to use. The possible values are listed as [SSL_METHODS](https://www.openssl.org/docs/man1.1.0/ssl/ssl.html#Dealing-with-Protocol-Methods), use the function names as strings. For example, use `'TLSv1_1_method'` to force TLS version 1.1, or `'TLS_method'` to allow any TLS protocol version. It is not recommended to use TLS versions less than 1.2, but it may be required for interoperability. **Default:** none, see `minVersion`.
  * `sessionIdContext` {string} Opaque identifier used by servers to ensure session state is not shared between applications. Non utilizzato dai client.

[`tls.createServer()`][] sets the default value of the `honorCipherOrder` option to `true`, other APIs that create secure contexts leave it unset.

[`tls.createServer()`][] uses a 128 bit truncated SHA1 hash value generated from `process.argv` as the default value of the `sessionIdContext` option, other APIs that create secure contexts have no default value.

Il metodo `tls.createSecureContext()` crea un object di credenziali.

Per i cifrari che fanno uso di certificati è *necessaria* una chiave. Either `key` or `pfx` can be used to provide it.

If the 'ca' option is not given, then Node.js will use the default publicly trusted list of CAs as given in <https://hg.mozilla.org/mozilla-central/raw-file/tip/security/nss/lib/ckfw/builtins/certdata.txt>.

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

* `options` {Object} 
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing the supported ALPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['hello', 'world']`. (I protocolli dovrebbero essere ordinati in base alla loro priorità.)
  * `clientCertEngine` {string} Name of an OpenSSL engine which can provide the client certificate.
  * `handshakeTimeout` {number} Abort the connection if the SSL/TLS handshake does not finish in the specified number of milliseconds. A `'tlsClientError'` is emitted on the `tls.Server` object whenever a handshake times out. **Default:** `120000` (120 secondi).
  * `rejectUnauthorized` {boolean} If not `false` the server will reject any connection which is not authorized with the list of supplied CAs. This option only has an effect if `requestCert` is `true`. **Default:** `true`.
  * `requestCert` {boolean} If `true` the server will request a certificate from clients that connect and attempt to verify that certificate. **Default:** `false`.
  * `sessionTimeout` {number} The number of seconds after which a TLS session created by the server will no longer be resumable. See [Session Resumption](#tls_session_resumption) for more information. **Default:** `300`.
  * `SNICallback(servername, cb)` {Function} A function that will be called if the client supports SNI TLS extension. Two arguments will be passed when called: `servername` and `cb`. `SNICallback` should invoke `cb(null, ctx)`, where `ctx` is a `SecureContext` instance. (`tls.createSecureContext(...)` can be used to get a proper `SecureContext`.) If `SNICallback` wasn't provided the default callback with high-level API will be used (see below).
  * `ticketKeys`: {Buffer} 48-bytes of cryptographically strong pseudo-random data. See [Session Resumption](#tls_session_resumption) for more information.
  * ...: Any [`tls.createSecureContext()`][] option can be provided. For servers, the identity options (`pfx` or `key`/`cert`) are usually required.
* `secureConnectionListener` {Function}
* Restituisce: {tls.Server}

Creates a new [`tls.Server`][]. The `secureConnectionListener`, if provided, is automatically set as a listener for the [`'secureConnection'`][] event.

The `ticketKeys` options is automatically shared between `cluster` module workers.

The following illustrates a simple echo server:

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

* Restituisce: {string[]}

Returns an array with the names of the supported SSL ciphers.

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

The default curve name to use for ECDH key agreement in a tls server. The default value is `'auto'`. See [`tls.createSecureContext()`] for further information.

## tls.DEFAULT_MAX_VERSION

<!-- YAML
added: v10.6.0
-->

* {string} The default value of the `maxVersion` option of [`tls.createSecureContext()`][]. It can be assigned any of the supported TLS protocol versions, `TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. **Default:** `'TLSv1.2'`.

## tls.DEFAULT_MIN_VERSION

<!-- YAML
added: v10.6.0
-->

* {string} The default value of the `minVersion` option of [`tls.createSecureContext()`][]. It can be assigned any of the supported TLS protocol versions, `TLSv1.2'`, `'TLSv1.1'`, or `'TLSv1'`. **Default:** `'TLSv1'`.

## API obsolete

### Class: CryptoStream

<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

The `tls.CryptoStream` class represents a stream of encrypted data. This class is deprecated and should no longer be used.

#### cryptoStream.bytesWritten

<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

The `cryptoStream.bytesWritten` property returns the total number of bytes written to the underlying socket *including* the bytes required for the implementation of the TLS protocol.

### Class: SecurePair

<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

> Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

Returned by [`tls.createSecurePair()`][].

#### Event: 'secure'

<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

The `'secure'` event is emitted by the `SecurePair` object once a secure connection has been established.

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

> Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

* `context` {Object} A secure context object as returned by `tls.createSecureContext()`
* `isServer` {boolean} `true` to specify that this TLS connection should be opened as a server.
* `requestCert` {boolean} `true` to specify whether a server should request a certificate from a connecting client. Only applies when `isServer` is `true`.
* `rejectUnauthorized` {boolean} If not `false` a server automatically reject clients with invalid certificates. Only applies when `isServer` is `true`.
* `options` 
  * `secureContext`: A TLS context object from [`tls.createSecureContext()`][]
  * `isServer`: If `true` the TLS socket will be instantiated in server-mode. **Default:** `false`.
  * `server` {net.Server} A [`net.Server`][] instance
  * `requestCert`: See [`tls.createServer()`][]
  * `rejectUnauthorized`: See [`tls.createServer()`][]
  * `ALPNProtocols`: See [`tls.createServer()`][]
  * `SNICallback`: See [`tls.createServer()`][]
  * `session` {Buffer} A `Buffer` instance containing a TLS session.
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication.

Creates a new secure pair object with two streams, one of which reads and writes the encrypted data and the other of which reads and writes the cleartext data. Generally, the encrypted stream is piped to/from an incoming encrypted data stream and the cleartext one is used as a replacement for the initial encrypted stream.

`tls.createSecurePair()` returns a `tls.SecurePair` object with `cleartext` and `encrypted` stream properties.

Using `cleartext` has the same API as [`tls.TLSSocket`][].

The `tls.createSecurePair()` method is now deprecated in favor of `tls.TLSSocket()`. Ad esempio, il codice:

```js
pair = tls.createSecurePair(/* ... */);
pair.encrypted.pipe(socket);
socket.pipe(pair.encrypted);
```

can be replaced by:

```js
secureSocket = tls.TLSSocket(socket, options);
```

where `secureSocket` has the same API as `pair.cleartext`.