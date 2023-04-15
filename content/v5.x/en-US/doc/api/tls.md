# TLS (SSL)

    Stability: 2 - Stable

Use `require('tls')` to access this module.

The `tls` module uses OpenSSL to provide Transport Layer Security and/or
Secure Socket Layer: encrypted stream communication.

TLS/SSL is a public/private key infrastructure. Each client and each
server must have a private key. A private key is created like this:

```
openssl genrsa -out ryans-key.pem 2048
```

All servers and some clients need to have a certificate. Certificates are public
keys signed by a Certificate Authority or self-signed. The first step to
getting a certificate is to create a "Certificate Signing Request" (CSR)
file. This is done with:

```
openssl req -new -sha256 -key ryans-key.pem -out ryans-csr.pem
```

To create a self-signed certificate with the CSR, do this:

```
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

Alternatively you can send the CSR to a Certificate Authority for signing.

For Perfect Forward Secrecy, it is required to generate Diffie-Hellman
parameters:

```
openssl dhparam -outform PEM -out dhparam.pem 2048
```

To create a .pfx or .p12, do this:

```
openssl pkcs12 -export -in agent5-cert.pem -inkey agent5-key.pem \
      -certfile ca-cert.pem -out agent5.pfx
```

  - `in`:  certificate
  - `inkey`: private key
  - `certfile`: all CA certs concatenated in one file like
    `cat ca1-cert.pem ca2-cert.pem > ca-cert.pem`

## ALPN, NPN and SNI

<!-- type=misc -->

ALPN (Application-Layer Protocol Negotiation Extension), NPN (Next
Protocol Negotiation) and, SNI (Server Name Indication) are TLS
handshake extensions:

  * ALPN/NPN - Allows the use of one TLS server for multiple protocols (HTTP,
    SPDY, HTTP/2)
  * SNI - Allows the use of one TLS server for multiple hostnames with different
    SSL certificates.

## Client-initiated renegotiation attack mitigation

<!-- type=misc -->

The TLS protocol lets the client renegotiate certain aspects of the TLS session.
Unfortunately, session renegotiation requires a disproportionate amount of
server-side resources, which makes it a potential vector for denial-of-service
attacks.

To mitigate this, renegotiation is limited to three times every 10 minutes. An
error is emitted on the [`tls.TLSSocket`][] instance when the threshold is
exceeded. These limits are configurable:

  - `tls.CLIENT_RENEG_LIMIT`: renegotiation limit, default is 3.

  - `tls.CLIENT_RENEG_WINDOW`: renegotiation window in seconds, default is
    10 minutes.

Do not change the defaults without a full understanding of the implications.

To test the server, connect to it with `openssl s_client -connect address:port`
and tap `R<CR>` (i.e., the letter `R` followed by a carriage return) a few
times.

## Modifying the Default TLS Cipher suite

Node.js is built with a default suite of enabled and disabled TLS ciphers.
Currently, the default cipher suite is:

```
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

This default can be overriden entirely using the `--tls-cipher-list` command
line switch. For instance, the following makes
`ECDHE-RSA-AES128-GCM-SHA256:!RC4` the default TLS cipher suite:

```
node --tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4"
```

Note that the default cipher suite included within Node.js has been carefully
selected to reflect current security best practices and risk mitigation.
Changing the default cipher suite can have a significant impact on the security
of an application. The `--tls-cipher-list` switch should by used only if
absolutely necessary.

## Perfect Forward Secrecy

<!-- type=misc -->

The term "[Forward Secrecy]" or "Perfect Forward Secrecy" describes a feature of
key-agreement (i.e., key-exchange) methods. Practically it means that even if
the private key of a server is compromised, communication can only be
decrypted by eavesdroppers if they manage to obtain the key-pair specifically
generated for each session.

This is achieved by randomly generating a key pair for key-agreement on every
handshake (in contrast to using the same key for all sessions). Methods
implementing this technique, thus offering Perfect Forward Secrecy, are
called "ephemeral".

Currently two methods are commonly used to achieve Perfect Forward Secrecy (note
the character "E" appended to the traditional abbreviations):

  * [DHE] - An ephemeral version of the Diffie Hellman key-agreement protocol.
  * [ECDHE] - An ephemeral version of the Elliptic Curve Diffie Hellman
    key-agreement protocol.

Ephemeral methods may have some performance drawbacks, because key generation
is expensive.

## Class: CryptoStream

    Stability: 0 - Deprecated: Use [`tls.TLSSocket`][] instead.

This is an encrypted stream.

### cryptoStream.bytesWritten

A proxy to the underlying socket's bytesWritten accessor, this will return
the total bytes written to the socket, *including the TLS overhead*.

## Class: SecurePair

Returned by tls.createSecurePair.

### Event: 'secure'

This event is emitted from the SecurePair once the pair has successfully
established a secure connection.

As with checking for the server [`secureConnection`](#tls_event_secureconnection)
event, `pair.cleartext.authorized` should be inspected to confirm whether the
certificate used is properly authorized.

## Class: tls.Server

This class is a subclass of `net.Server` and has the same methods on it.
Instead of accepting only raw TCP connections, this accepts encrypted
connections using TLS or SSL.

### Event: 'clientError'

`function (exception, tlsSocket) { }`

When a client connection emits an `'error'` event before a secure connection is
established it will be forwarded here.

`tlsSocket` is the [`tls.TLSSocket`][] that the error originated from.

### Event: 'newSession'

`function (sessionId, sessionData, callback) { }`

Emitted on creation of a TLS session. May be used to store sessions in external
storage. `callback` must be invoked eventually, otherwise no data will be
sent or received from the secure connection.

NOTE: adding this event listener will only have an effect on connections
established after the addition of the event listener.

### Event: 'OCSPRequest'

`function (certificate, issuer, callback) { }`

Emitted when the client sends a certificate status request. The server's
current certificate can be parsed to obtain the OCSP URL and certificate ID;
after obtaining an OCSP response `callback(null, resp)` is then invoked, where
`resp` is a `Buffer` instance. Both `certificate` and `issuer` are `Buffer`
DER-representations of the primary and issuer's certificates. They can be used
to obtain the OCSP certificate ID and OCSP endpoint URL.

Alternatively, `callback(null, null)` may be called, meaning that there was no
OCSP response.

Calling `callback(err)` will result in a `socket.destroy(err)` call.

Typical flow:

1. Client connects to the server and sends an `'OCSPRequest'` to it (via status
   info extension in ClientHello).
2. Server receives the request and invokes the `'OCSPRequest'` event listener
   if present.
3. Server extracts the OCSP URL from either the `certificate` or `issuer` and
   performs an [OCSP request] to the CA.
4. Server receives `OCSPResponse` from the CA and sends it back to the client
   via the `callback` argument
5. Client validates the response and either destroys the socket or performs a
   handshake.

NOTE: `issuer` could be `null` if the certificate is self-signed or if the
issuer is not in the root certificates list. (An issuer may be provided via the
`ca` option.)

NOTE: adding this event listener will only have an effect on connections
established after the addition of the event listener.

NOTE: An npm module like [asn1.js] may be used to parse the certificates.

### Event: 'resumeSession'

`function (sessionId, callback) { }`

Emitted when the client wants to resume the previous TLS session. The event
listener may perform a lookup in external storage using the given `sessionId`
and invoke `callback(null, sessionData)` once finished. If the session can't be
resumed (i.e., doesn't exist in storage) one may call `callback(null, null)`.
Calling `callback(err)` will terminate incoming connection and destroy the
socket.

NOTE: adding this event listener will only have an effect on connections
established after the addition of the event listener.

Here's an example for using TLS session resumption:

```js
var tlsSessionStore = {};
server.on('newSession', (id, data, cb) => {
  tlsSessionStore[id.toString('hex')] = data;
  cb();
});
server.on('resumeSession', (id, cb) => {
  cb(null, tlsSessionStore[id.toString('hex')] || null);
});
```

### Event: 'secureConnection'

`function (tlsSocket) {}`

This event is emitted after the handshaking process for a new connection has
successfully completed. The argument is an instance of [`tls.TLSSocket`][] and
has all the common stream methods and events.

`socket.authorized` is a boolean value which indicates if the
client has been verified by one of the supplied certificate authorities for the
server. If `socket.authorized` is false, then `socket.authorizationError` is
set to describe how authorization failed. Implied but worth mentioning:
depending on the settings of the TLS server, unauthorized connections may
be accepted.

`socket.npnProtocol` is a string containing the selected NPN protocol
and `socket.alpnProtocol` is a string containing the selected ALPN
protocol. When both NPN and ALPN extensions are received, ALPN takes
precedence over NPN and the next protocol is selected by ALPN. When
ALPN has no selected protocol, this returns false.

`socket.servername` is a string containing the server name requested with
SNI.

### server.addContext(hostname, context)

Add secure context that will be used if the client request's SNI hostname
matches the supplied `hostname` (wildcards can be used). `context` can contain
`key`, `cert`, `ca` or any other properties from
[`tls.createSecureContext()`][] `options` argument.

### server.address()

Returns the bound address, the address family name, and port of the
server as reported by the operating system.  See [`net.Server.address()`][] for
more information.

### server.close([callback])

Stops the server from accepting new connections. This function is
asynchronous, the server is finally closed when the server emits a `'close'`
event.  Optionally, you can pass a callback to listen for the `'close'` event.

### server.connections

The number of concurrent connections on the server.

### server.getTicketKeys()

Returns a `Buffer` instance holding the keys currently used for
encryption/decryption of the [TLS Session Tickets][]

### server.listen(port[, hostname][, callback])

Begin accepting connections on the specified `port` and `hostname`. If the
`hostname` is omitted, the server will accept connections on any IPv6 address
(`::`) when IPv6 is available, or any IPv4 address (`0.0.0.0`) otherwise. A
port value of zero will assign a random port.

This function is asynchronous. The last parameter `callback` will be called
when the server has been bound.

See `net.Server` for more information.

### server.setTicketKeys(keys)

Updates the keys for encryption/decryption of the [TLS Session Tickets][].

NOTE: the buffer should be 48 bytes long. See `ticketKeys` option in
[tls.createServer](#tls_tls_createserver_options_secureconnectionlistener) for
more information on how it is used.

NOTE: the change is effective only for future server connections. Existing
or currently pending server connections will use the previous keys.

### server.maxConnections

Set this property to reject connections when the server's connection count
exceeds the specified threshold.


## Class: tls.TLSSocket

This is a wrapped version of [`net.Socket`][] that does transparent encryption
of written data and all required TLS negotiation.

This instance implements the duplex [Stream][] interface. It has all the
common stream methods and events.

Methods that return TLS connection metadata (e.g.
[`tls.TLSSocket.getPeerCertificate()`][] will only return data while the
connection is open.

### new tls.TLSSocket(socket[, options])

Construct a new TLSSocket object from an existing TCP socket.

`socket` is an instance of [`net.Socket`][]

`options` is an optional object that might contain following properties:

  - `secureContext`: An optional TLS context object from
     [`tls.createSecureContext()`][]

  - `isServer`: If `true` the TLS socket will be instantiated in server-mode.
    Default: `false`

  - `server`: An optional [`net.Server`][] instance

  - `requestCert`: Optional, see [`tls.createSecurePair()`][]

  - `rejectUnauthorized`: Optional, see [`tls.createSecurePair()`][]

  - `NPNProtocols`: Optional, see [`tls.createServer()`][]

  - `ALPNProtocols`: Optional, see [`tls.createServer()`][]

  - `SNICallback`: Optional, see [`tls.createServer()`][]

  - `session`: Optional, a `Buffer` instance, containing a TLS session

  - `requestOCSP`: Optional, if `true` the OCSP status request extension will
    be added to the client hello and an `'OCSPResponse'` event will be emitted
    on the socket before establishing a secure communication

### Event: 'OCSPResponse'

`function (response) { }`

This event will be emitted if the `requestOCSP` option was set. `response` is a
`Buffer` containing the server's OCSP response.

Traditionally, the `response` is a signed object from the server's CA that
contains information about server's certificate revocation status.

### Event: 'secureConnect'

This event is emitted after the handshaking process for a new connection has
successfully completed. The listener will be called regardless of whether or not
the server's certificate has been authorized. It is the user's responsibility to
test `tlsSocket.authorized` to see if the server certificate was signed by one
of the specified CAs. If `tlsSocket.authorized === false` then the error can be
found in `tlsSocket.authorizationError`. Also, if either ALPN or NPN was used
`tlsSocket.alpnProtocol` or `tlsSocket.npnProtocol` can be checked for the
negotiated protocol.

### tlsSocket.address()

Returns the bound address, the address family name, and port of the
underlying socket as reported by the operating system. Returns an
object with three properties, e.g.,
`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### tlsSocket.authorized

A boolean that is `true` if the peer certificate was signed by one of the
specified CAs, otherwise `false`.

### tlsSocket.authorizationError

The reason why the peer's certificate has not been verified. This property
becomes available only when `tlsSocket.authorized === false`.

### tlsSocket.encrypted

Static boolean value, always `true`. May be used to distinguish TLS sockets
from regular ones.

### tlsSocket.getCipher()

Returns an object representing the cipher name and the SSL/TLS protocol version
that first defined the cipher.

Example:
`{ name: 'AES256-SHA', version: 'TLSv1/SSLv3' }`

See SSL_CIPHER_get_name() and SSL_CIPHER_get_version() in
https://www.openssl.org/docs/manmaster/ssl/SSL_CIPHER_get_name.html for more
information.

### tlsSocket.getEphemeralKeyInfo()

Returns an object representing the type, name, and size of parameter of
an ephemeral key exchange in [Perfect Forward Secrecy][] on a client
connection. It returns an empty object when the key exchange is not
ephemeral. As this is only supported on a client socket, it returns `null`
if called on a server socket. The supported types are 'DH' and 'ECDH'. The
`name` property is only available in 'ECDH'.

Example:

    { type: 'ECDH', name: 'prime256v1', size: 256 }

### tlsSocket.getPeerCertificate([ detailed ])

Returns an object representing the peer's certificate. The returned object has
some properties corresponding to the fields of the certificate. If the
`detailed` argument is `true` the full chain with the `issuer` property will be
returned, if `false` only the top certificate without the `issuer` property.

Example:

```
{ subject:
   { C: 'UK',
     ST: 'Acknack Ltd',
     L: 'Rhys Jones',
     O: 'node.js',
     OU: 'Test TLS Certificate',
     CN: 'localhost' },
  issuerInfo:
   { C: 'UK',
     ST: 'Acknack Ltd',
     L: 'Rhys Jones',
     O: 'node.js',
     OU: 'Test TLS Certificate',
     CN: 'localhost' },
  issuer:
   { ... another certificate ... },
  raw: < RAW DER buffer >,
  valid_from: 'Nov 11 09:52:22 2009 GMT',
  valid_to: 'Nov  6 09:52:22 2029 GMT',
  fingerprint: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF',
  serialNumber: 'B9B0D332A1AA5635' }
```

If the peer does not provide a certificate, it returns `null` or an empty
object.

### tlsSocket.getProtocol()

Returns a string containing the negotiated SSL/TLS protocol version of the
current connection. `'unknown'` will be returned for connected sockets that have
not completed the handshaking process. `null` will be returned for server
sockets or disconnected client sockets.

Examples:
```
'SSLv3'
'TLSv1'
'TLSv1.1'
'TLSv1.2'
'unknown'
```

See https://www.openssl.org/docs/manmaster/ssl/SSL_get_version.html for more
information.

### tlsSocket.getSession()

Returns the ASN.1 encoded TLS session or `undefined` if none was negotiated.
Could be used to speed up handshake establishment when reconnecting to the
server.

### tlsSocket.getTLSTicket()

NOTE: Works only with client TLS sockets. Useful only for debugging, for
session reuse provide `session` option to [`tls.connect()`][].

Returns the TLS session ticket or `undefined` if none was negotiated.

### tlsSocket.localAddress

The string representation of the local IP address.

### tlsSocket.localPort

The numeric representation of the local port.

### tlsSocket.remoteAddress

The string representation of the remote IP address. For example,
`'74.125.127.100'` or `'2001:4860:a005::68'`.

### tlsSocket.remoteFamily

The string representation of the remote IP family. `'IPv4'` or `'IPv6'`.

### tlsSocket.remotePort

The numeric representation of the remote port. For example, `443`.

### tlsSocket.renegotiate(options, callback)

Initiate TLS renegotiation process. The `options` object may contain the
following fields: `rejectUnauthorized`, `requestCert`. (See [`tls.createServer
()`][] for details.) `callback(err)` will be executed with `null` as `err`,
once the renegotiation is successfully completed.

NOTE: Can be used to request peer's certificate after the secure connection
has been established.

ANOTHER NOTE: When running as the server, socket will be destroyed
with an error after `handshakeTimeout` timeout.

### tlsSocket.setMaxSendFragment(size)

Set maximum TLS fragment size (default and maximum value is: `16384`, minimum
is: `512`). Returns `true` on success, `false` otherwise.

Smaller fragment sizes decrease the buffering latency on the client: larger
fragments are buffered by the TLS layer until the entire fragment is received
and its integrity is verified; large fragments can span multiple roundtrips
and their processing can be delayed due to packet loss or reordering. However,
smaller fragments add extra TLS framing bytes and CPU overhead, which may
decrease overall server throughput.


## tls.connect(options[, callback])
## tls.connect(port[, host][, options][, callback])

Creates a new client connection to the given `port` and `host` (old API) or
`options.port` and `options.host`. (If `host` is omitted, it defaults to
`localhost`.) `options` should be an object which specifies:

  - `host`: Host the client should connect to.

  - `port`: Port the client should connect to.

  - `socket`: Establish secure connection on a given socket rather than
    creating a new socket. If this option is specified, `host` and `port`
    are ignored.

  - `path`: Creates unix socket connection to path. If this option is
    specified, `host` and `port` are ignored.

  - `pfx`: A string or `Buffer` containing the private key, certificate, and
    CA certs of the client in PFX or PKCS12 format.

  - `key`: A string, `Buffer`, array of strings, or array of `Buffer`s
    containing the private key of the client in PEM format.

  - `passphrase`: A string containing the passphrase for the private key or pfx.

  - `cert`: A string, `Buffer`, array of strings, or array of `Buffer`s
    containing the certificate key of the client in PEM format.

  - `ca`: A string, `Buffer`, array of strings, or array of `Buffer`s of trusted
    certificates in PEM format. If this is omitted several well known "root"
    CAs (like VeriSign) will be used. These are used to authorize connections.

  - `ciphers`: A string describing the ciphers to use or exclude, separated by
   `:`. Uses the same default cipher suite as [`tls.createServer()`][].

  - `rejectUnauthorized`: If `true`, the server certificate is verified against
    the list of supplied CAs. An `'error'` event is emitted if verification
    fails; `err.code` contains the OpenSSL error code. Default: `true`.

  - `NPNProtocols`: An array of strings or `Buffer`s containing supported NPN
    protocols. `Buffer`s should have the following format:
    `0x05hello0x05world`, where the first byte is the next protocol name's
    length. (Passing an array is usually be much simpler: `['hello', 'world']`.)

  - `ALPNProtocols`: An array of strings or `Buffer`s containing the
    supported ALPN protocols. `Buffer`s should have following format:
    `0x05hello0x05world`, where the first byte is the next protocol
    name's length. (Passing an array is usually be much simpler:
    `['hello', 'world']`.)

  - `servername`: Server name for the SNI (Server Name Indication) TLS
    extension.

  - `checkServerIdentity(servername, cert)`: Provide an override for checking
    the server's hostname against the certificate. Should return an error if
    verification fails. Returns `undefined` if passing.

  - `secureProtocol`: The SSL method to use, e.g., `SSLv3_method` to force
    SSL version 3. The possible values depend on the version of OpenSSL
    installed in the environment and are defined in the constant
    [SSL_METHODS][].

  - `secureContext`: An optional TLS context object from
    `tls.createSecureContext( ... )`. It can be used for caching client
    certificates, keys, and CA certificates.

  - `session`: A `Buffer` instance, containing TLS session.

  - `minDHSize`: Minimum size of the DH parameter in bits to accept a TLS
    connection. When a server offers a DH parameter with a size less
    than this, the TLS connection is destroyed and an error is thrown. Default:
    1024.

The `callback` parameter will be added as a listener for the
[`'secureConnect'`][] event.

`tls.connect()` returns a [`tls.TLSSocket`][] object.

Here is an example of a client of echo server as described previously:

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  // These are necessary only if using the client certificate authentication
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),

  // This is necessary only if the server uses the self-signed certificate
  ca: [ fs.readFileSync('server-cert.pem') ]
};

var socket = tls.connect(8000, options, () => {
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

Or

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('client.pfx')
};

var socket = tls.connect(8000, options, () => {
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


## tls.createSecureContext(options)

Creates a credentials object; the `options` object may contain the following
fields:

* `pfx` : A string or `Buffer` holding the PFX or PKCS12 encoded private
  key, certificate, and CA certificates.
* `key`: A string or `Buffer` containing the private key of the server in
  PEM format. To support multiple keys using different algorithms, an array
  can be provided. It can either be a plain array of keys or an array of
  objects in the format `{pem: key, passphrase: passphrase}`. (Required)
* `passphrase` : A string containing the passphrase for the private key or pfx.
* `cert` : A string containing the PEM encoded certificate
* `ca`: A string, `Buffer`, array of strings, or array of `Buffer`s of trusted
  certificates in PEM format. If this is omitted several well known "root"
  CAs (like VeriSign) will be used. These are used to authorize connections.
* `crl` : Either a string or list of strings of PEM encoded CRLs
  (Certificate Revocation List).
* `ciphers`: A string describing the ciphers to use or exclude.
  Consult
  <https://www.openssl.org/docs/apps/ciphers.html#CIPHER_LIST_FORMAT>
  for details on the format.
* `honorCipherOrder` : When choosing a cipher, use the server's preferences
  instead of the client preferences. For further details see `tls` module
  documentation.

If no 'CA' details are given, then Node.js will use the default
publicly trusted list of CAs as given in
<http://mxr.mozilla.org/mozilla/source/security/nss/lib/ckfw/builtins/certdata.txt>.

## tls.createSecurePair([context][, isServer][, requestCert][, rejectUnauthorized][, options])

Creates a new secure pair object with two streams, one of which reads and writes
the encrypted data and the other of which reads and writes the cleartext data.
Generally, the encrypted stream is piped to/from an incoming encrypted data
stream and the cleartext one is used as a replacement for the initial encrypted
stream.

 - `credentials`: A secure context object from `tls.createSecureContext( ... )`.

 - `isServer`: A boolean indicating whether this TLS connection should be
   opened as a server or a client.

 - `requestCert`: A boolean indicating whether a server should request a
   certificate from a connecting client. Only applies to server connections.

 - `rejectUnauthorized`: A boolean indicating whether a server should
   automatically reject clients with invalid certificates. Only applies to
   servers with `requestCert` enabled.

 - `options`: An object with common SSL options. See [`tls.TLSSocket`][].

`tls.createSecurePair()` returns a SecurePair object with `cleartext` and
`encrypted` stream properties.

NOTE: `cleartext` has the same API as [`tls.TLSSocket`][]

## tls.createServer(options[, secureConnectionListener])

Creates a new [tls.Server][].  The `connectionListener` argument is
automatically set as a listener for the [`'secureConnection'`][] event.  The
`options` object may contain the following fields:

  - `pfx`: A string or `Buffer` containing the private key, certificate and
    CA certs of the server in PFX or PKCS12 format. (Mutually exclusive with
    the `key`, `cert`, and `ca` options.)

  - `key`: A string or `Buffer` containing the private key of the server in
    PEM format. To support multiple keys using different algorithms an array
    can be provided. It can either be a plain array of keys or an array of
    objects in the format `{pem: key, passphrase: passphrase}`. (Required)

  - `passphrase`: A string containing the passphrase for the private key or pfx.

  - `cert`: A string, `Buffer`, array of strings, or array of `Buffer`s
    containing the certificate key of the server in PEM format. (Required)

  - `ca`: A string, `Buffer`, array of strings, or array of `Buffer`s of trusted
    certificates in PEM format. If this is omitted several well known "root"
    CAs (like VeriSign) will be used. These are used to authorize connections.

  - `crl` : Either a string or array of strings of PEM encoded CRLs (Certificate
    Revocation List).

  - `ciphers`: A string describing the ciphers to use or exclude, separated by
    `:`. The default cipher suite is:

    ```js
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

    The default cipher suite prefers GCM ciphers for [Chrome's 'modern
    cryptography' setting] and also prefers ECDHE and DHE ciphers for Perfect
    Forward Secrecy, while offering *some* backward compatibility.

    128 bit AES is preferred over 192 and 256 bit AES in light of [specific
    attacks affecting larger AES key sizes].

    Old clients that rely on insecure and deprecated RC4 or DES-based ciphers
    (like Internet Explorer 6) cannot complete the handshaking process with
    the default configuration. If these clients _must_ be supported, the
    [TLS recommendations] may offer a compatible cipher suite. For more details
    on the format, see the [OpenSSL cipher list format documentation].

  - `ecdhCurve`: A string describing a named curve to use for ECDH key agreement
    or false to disable ECDH.

    Defaults to `prime256v1` (NIST P-256). Use [`crypto.getCurves()`][] to
    obtain a list of available curve names. On recent releases,
    `openssl ecparam -list_curves` will also display the name and description of
    each available elliptic curve.

  - `dhparam`: A string or `Buffer` containing Diffie Hellman parameters,
    required for Perfect Forward Secrecy. Use `openssl dhparam` to create it.
    Its key length should be greater than or equal to 1024 bits, otherwise
    it throws an error. It is strongly recommended to use 2048 bits or
    larger for stronger security. If omitted or invalid, it is silently
    discarded and DHE ciphers won't be available.

  - `handshakeTimeout`: Abort the connection if the SSL/TLS handshake does not
    finish in the specified number of milliseconds. The default is 120 seconds.

    A `'clientError'` is emitted on the `tls.Server` object whenever a handshake
    times out.

  - `honorCipherOrder` : When choosing a cipher, use the server's preferences
    instead of the client preferences. Default: `true`.

  - `requestCert`: If `true` the server will request a certificate from
    clients that connect and attempt to verify that certificate. Default:
    `false`.

  - `rejectUnauthorized`: If `true` the server will reject any connection
    which is not authorized with the list of supplied CAs. This option only
    has an effect if `requestCert` is `true`. Default: `false`.

  - `NPNProtocols`: An array or `Buffer` of possible NPN protocols. (Protocols
    should be ordered by their priority.)

  - `ALPNProtocols`: An array or `Buffer` of possible ALPN
    protocols. (Protocols should be ordered by their priority.) When
    the server receives both NPN and ALPN extensions from the client,
    ALPN takes precedence over NPN and the server does not send an NPN
    extension to the client.

  - `SNICallback(servername, cb)`: A function that will be called if the client
    supports SNI TLS extension. Two arguments will be passed to it:
    `servername` and `cb`. `SNICallback` should invoke `cb(null, ctx)`, where
    `ctx` is a SecureContext instance. (`tls.createSecureContext(...)` can be
    used to get a proper SecureContext.) If `SNICallback` wasn't provided the
    default callback with high-level API will be used (see below).

  - `sessionTimeout`: An integer specifying the number of seconds after which
    the TLS session identifiers and TLS session tickets created by the server
    will time out. See [SSL_CTX_set_timeout] for more details.

  - `ticketKeys`: A 48-byte `Buffer` instance consisting of a 16-byte prefix,
    a 16-byte HMAC key, and a 16-byte AES key. This can be used to accept TLS
    session tickets on multiple instances of the TLS server.

    NOTE: Automatically shared between `cluster` module workers.

  - `sessionIdContext`: A string containing an opaque identifier for session
    resumption. If `requestCert` is `true`, the default is a MD5 hash value
    generated from the command-line. (In FIPS mode a truncated SHA1 hash is
    used instead.) Otherwise, a default is not provided.

  - `secureProtocol`: The SSL method to use, e.g., `SSLv3_method` to force
    SSL version 3. The possible values depend on the version of OpenSSL
    installed in the environment and are defined in the constant [SSL_METHODS][].

Here is a simple example echo server:

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),

  // This is necessary only if using the client certificate authentication.
  requestCert: true,

  // This is necessary only if the client uses the self-signed certificate.
  ca: [ fs.readFileSync('client-cert.pem') ]
};

var server = tls.createServer(options, (socket) => {
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

Or

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('server.pfx'),

  // This is necessary only if using the client certificate authentication.
  requestCert: true,

};

var server = tls.createServer(options, (socket) => {
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

You can test this server by connecting to it with `openssl s_client`:

```
openssl s_client -connect 127.0.0.1:8000
```

## tls.getCiphers()

Returns an array with the names of the supported SSL ciphers.

Example:

```js
var ciphers = tls.getCiphers();
console.log(ciphers); // ['AES128-SHA', 'AES256-SHA', ...]
```


[OpenSSL cipher list format documentation]: https://www.openssl.org/docs/apps/ciphers.html#CIPHER_LIST_FORMAT
[Chrome's 'modern cryptography' setting]: https://www.chromium.org/Home/chromium-security/education/tls#TOC-Deprecation-of-TLS-Features-Algorithms-in-Chrome
[specific attacks affecting larger AES key sizes]: https://www.schneier.com/blog/archives/2009/07/another_new_aes.html
[BEAST attacks]: https://blog.ivanristic.com/2011/10/mitigating-the-beast-attack-on-tls.html
[`crypto.getCurves()`]: crypto.html#crypto_crypto_getcurves
[`tls.createServer()`]: #tls_tls_createserver_options_secureconnectionlistener
[`tls.createSecurePair()`]: #tls_tls_createsecurepair_context_isserver_requestcert_rejectunauthorized_options
[`tls.TLSSocket`]: #tls_class_tls_tlssocket
[`net.Server`]: net.html#net_class_net_server
[`net.Socket`]: net.html#net_class_net_socket
[`net.Server.address()`]: net.html#net_server_address
[`'secureConnect'`]: #tls_event_secureconnect
[`'secureConnection'`]: #tls_event_secureconnection
[Perfect Forward Secrecy]: #tls_perfect_forward_secrecy
[Stream]: stream.html#stream_stream
[SSL_METHODS]: https://www.openssl.org/docs/ssl/ssl.html#DEALING_WITH_PROTOCOL_METHODS
[tls.Server]: #tls_class_tls_server
[SSL_CTX_set_timeout]: https://www.openssl.org/docs/ssl/SSL_CTX_set_timeout.html
[RFC 4492]: https://www.rfc-editor.org/rfc/rfc4492.txt
[Forward secrecy]: https://en.wikipedia.org/wiki/Perfect_forward_secrecy
[DHE]: https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange
[ECDHE]: https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman
[asn1.js]: https://npmjs.org/package/asn1.js
[OCSP request]: https://en.wikipedia.org/wiki/OCSP_stapling
[TLS recommendations]: https://wiki.mozilla.org/Security/Server_Side_TLS
[TLS Session Tickets]: https://www.ietf.org/rfc/rfc5077.txt
[`tls.TLSSocket.getPeerCertificate()`]: #tls_tlssocket_getpeercertificate_detailed
[`tls.createSecureContext()`]: #tls_tls_createsecurecontext_options
[`tls.connect()`]: #tls_tls_connect_options_callback
