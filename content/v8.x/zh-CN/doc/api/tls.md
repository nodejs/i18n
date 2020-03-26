# TLS (SSL)

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定的

The `tls` module provides an implementation of the Transport Layer Security (TLS) and Secure Socket Layer (SSL) protocols that is built on top of OpenSSL. 此模块可通过如下方式访问：

```js
const tls = require('tls');
```

## TLS/SSL 概念

TLS/SSL 是一个基于公钥/私钥的架构 （PKI）。 For most common cases, each client and server must have a *private key*.

私钥可通过多种方式生成。 The example below illustrates use of the OpenSSL command-line interface to generate a 2048-bit RSA private key:

```sh
openssl genrsa -out ryans-key.pem 2048
```

在使用 TLS/SSL 时，所有服务器 （和一些客户端）必须具有 *证书*。 Certificates are *public keys* that correspond to a private key, and that are digitally signed either by a Certificate Authority or by the owner of the private key (such certificates are referred to as "self-signed"). The first step to obtaining a certificate is to create a *Certificate Signing Request* (CSR) file.

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

其中：

* `in`：是已签名的证书
* `inkey`：是关联的私钥
* `certfile`: is a concatenation of all Certificate Authority (CA) certs into a single file, e.g. `cat ca1-cert.pem ca2-cert.pem > ca-cert.pem`

### 完美前向安全

<!-- type=misc -->

The term "[Forward Secrecy](https://en.wikipedia.org/wiki/Perfect_forward_secrecy)" or "Perfect Forward Secrecy" describes a feature of key-agreement (i.e., key-exchange) methods. That is, the server and client keys are used to negotiate new temporary keys that are used specifically and only for the current communication session. Practically, this means that even if the server's private key is compromised, communication can only be decrypted by eavesdroppers if the attacker manages to obtain the key-pair specifically generated for the session.

Perfect Forward Secrecy is achieved by randomly generating a key pair for key-agreement on every TLS/SSL handshake (in contrast to using the same key for all sessions). 实现此技术的方法被称为 "ephemeral"。

Currently two methods are commonly used to achieve Perfect Forward Secrecy (note the character "E" appended to the traditional abbreviations):

* [DHE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) - Diffie Hellman 密钥协议的 ephemeral 版本。
* [ECDHE](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) - An ephemeral version of the Elliptic Curve Diffie Hellman key-agreement protocol.

Ephemeral methods may have some performance drawbacks, because key generation is expensive.

To use Perfect Forward Secrecy using `DHE` with the `tls` module, it is required to generate Diffie-Hellman parameters and specify them with the `dhparam` option to [`tls.createSecureContext()`][]. The following illustrates the use of the OpenSSL command-line interface to generate such parameters:

```sh
openssl dhparam -outform PEM -out dhparam.pem 2048
```

If using Perfect Forward Secrecy using `ECDHE`, Diffie-Hellman parameters are not required and a default ECDHE curve will be used. The `ecdhCurve` property can be used when creating a TLS Server to specify the list of names of supported curves to use, see [`tls.createServer()`] for more info.

### ALPN, NPN, 及 SNI

<!-- type=misc -->

ALPN (Application-Layer Protocol Negotiation Extension), NPN (Next Protocol Negotiation) and, SNI (Server Name Indication) are TLS handshake extensions:

* ALPN/NPN - Allows the use of one TLS server for multiple protocols (HTTP, SPDY, HTTP/2)
* SNI - Allows the use of one TLS server for multiple hostnames with different SSL certificates.

*注意*：推荐使用 ALPN 而不是 NPN。 The NPN extension has never been formally defined or documented and generally not recommended for use.

### 客户端发起的重新协商攻击缓解

<!-- type=misc -->

The TLS protocol allows clients to renegotiate certain aspects of the TLS session. Unfortunately, session renegotiation requires a disproportionate amount of server-side resources, making it a potential vector for denial-of-service attacks.

为了减轻风险，重新协商以每十分钟三次为上限。 An `'error'` event is emitted on the [`tls.TLSSocket`][] instance when this threshold is exceeded. 此限制是可以配置的：

* `tls.CLIENT_RENEG_LIMIT` {number} Specifies the number of renegotiation requests. **Default:** `3`.
* `tls.CLIENT_RENEG_WINDOW` {number} Specifies the time renegotiation window in seconds. **Default:** `600` (10 minutes).

*Note*: The default renegotiation limits should not be modified without a full understanding of the implications and risks.

To test the renegotiation limits on a server, connect to it using the OpenSSL command-line client (`openssl s_client -connect address:port`) then input `R<CR>` (i.e., the letter `R` followed by a carriage return) multiple times.

## 修改默认的 TLS 密码套件

Node.js 是使用默认的已启用和已禁用的 TLS 密码套件来构建的。 当前，默认的密码套件是：

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

This default can be replaced entirely using the `--tls-cipher-list` command line switch. For instance, the following makes `ECDHE-RSA-AES128-GCM-SHA256:!RC4` the default TLS cipher suite:

```sh
node --tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4"
```

The default can also be replaced on a per client or server basis using the `ciphers` option from [`tls.createSecureContext()`][], which is also available in [`tls.createServer()`], [`tls.connect()`], and when creating new [`tls.TLSSocket`]s.

请参阅 [OpenSSL 密码列表格式文档](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT) 以获取格式的细节信息。

*Note*: The default cipher suite included within Node.js has been carefully selected to reflect current security best practices and risk mitigation. Changing the default cipher suite can have a significant impact on the security of an application. The `--tls-cipher-list` switch and `ciphers` option should by used only if absolutely necessary.

The default cipher suite prefers GCM ciphers for [Chrome's 'modern cryptography' setting] and also prefers ECDHE and DHE ciphers for Perfect Forward Secrecy, while offering *some* backward compatibility.

128 bit AES is preferred over 192 and 256 bit AES in light of [specific attacks affecting larger AES key sizes].

Old clients that rely on insecure and deprecated RC4 or DES-based ciphers (like Internet Explorer 6) cannot complete the handshaking process with the default configuration. If these clients *must* be supported, the [TLS recommendations](https://wiki.mozilla.org/Security/Server_Side_TLS) may offer a compatible cipher suite. For more details on the format, see the [OpenSSL cipher list format documentation](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT).

## 类：tls.Server

<!-- YAML
added: v0.3.2
-->

The `tls.Server` class is a subclass of `net.Server` that accepts encrypted connections using TLS or SSL.

### 事件：'newSession'

<!-- YAML
added: v0.9.2
-->

在创建新的 TLS 会话时，`'newSession'` 事件会被发出。 This may be used to store sessions in external storage. The listener callback is passed three arguments when called:

* `sessionId` - TLS 会话标识符
* `sessionData` - TLS 会话数据
* `callback` {Function} A callback function taking no arguments that must be invoked in order for data to be sent or received over the secure connection.

*Note*: Listening for this event will have an effect only on connections established after the addition of the event listener.

### 事件：'OCSPRequest'

<!-- YAML
added: v0.11.13
-->

The `'OCSPRequest'` event is emitted when the client sends a certificate status request. 当被调用时，监听器回调函数将被赋予三个参数：

* `certificate` {Buffer} 服务器端证书
* `issuer` {Buffer} 签发者证书
* `callback` {Function} A callback function that must be invoked to provide the results of the OCSP request.

The server's current certificate can be parsed to obtain the OCSP URL and certificate ID; after obtaining an OCSP response, `callback(null, resp)` is then invoked, where `resp` is a `Buffer` instance containing the OCSP response. Both `certificate` and `issuer` are `Buffer` DER-representations of the primary and issuer's certificates. These can be used to obtain the OCSP certificate ID and OCSP endpoint URL.

Alternatively, `callback(null, null)` may be called, indicating that there was no OCSP response.

调用 `callback(err)` 将会导致 `socket.destroy(err)` 被调用。

典型的 OCSP 请求流程如下所示：

1. Client connects to the server and sends an `'OCSPRequest'` (via the status info extension in ClientHello).
2. Server receives the request and emits the `'OCSPRequest'` event, calling the listener if registered.
3. Server extracts the OCSP URL from either the `certificate` or `issuer` and performs an [OCSP request](https://en.wikipedia.org/wiki/OCSP_stapling) to the CA.
4. Server receives `OCSPResponse` from the CA and sends it back to the client via the `callback` argument
5. Client validates the response and either destroys the socket or performs a handshake.

*Note*: The `issuer` can be `null` if the certificate is either self-signed or the issuer is not in the root certificates list. (An issuer may be provided via the `ca` option when establishing the TLS connection.)

*Note*: Listening for this event will have an effect only on connections established after the addition of the event listener.

*注意*：像 [asn1.js](https://npmjs.org/package/asn1.js) 这样的 npm 模块可被用于解析证书。

### 事件：'resumeSession'

<!-- YAML
added: v0.9.2
-->

The `'resumeSession'` event is emitted when the client requests to resume a previous TLS session. The listener callback is passed two arguments when called:

* `sessionId` - TLS/SSL 会话标识符
* `callback` {Function} A callback function to be called when the prior session has been recovered.

When called, the event listener may perform a lookup in external storage using the given `sessionId` and invoke `callback(null, sessionData)` once finished. If the session cannot be resumed (i.e., doesn't exist in storage) the callback may be invoked as `callback(null, null)`. Calling `callback(err)` will terminate the incoming connection and destroy the socket.

*Note*: Listening for this event will have an effect only on connections established after the addition of the event listener.

下面演示了如何恢复 TLS 会话：

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

### 事件：'secureConnection'

<!-- YAML
added: v0.3.2
-->

The `'secureConnection'` event is emitted after the handshaking process for a new connection has successfully completed. The listener callback is passed a single argument when called:

* `tlsSocket` {tls.TLSSocket} 已建立的 TLS 套接字。

The `tlsSocket.authorized` property is a `boolean` indicating whether the client has been verified by one of the supplied Certificate Authorities for the server. If `tlsSocket.authorized` is `false`, then `socket.authorizationError` is set to describe how authorization failed. Note that depending on the settings of the TLS server, unauthorized connections may still be accepted.

The `tlsSocket.npnProtocol` and `tlsSocket.alpnProtocol` properties are strings that contain the selected NPN and ALPN protocols, respectively. When both NPN and ALPN extensions are received, ALPN takes precedence over NPN and the next protocol is selected by ALPN.

如果 ALPN 没有选定的协议，`tlsSocket.alpnProtocol` 会返回 `false`。

The `tlsSocket.servername` property is a string containing the server name requested via SNI.

### 事件：'tlsClientError'

<!-- YAML
added: v6.0.0
-->

The `'tlsClientError'` event is emitted when an error occurs before a secure connection is established. The listener callback is passed two arguments when called:

* `exception` {Error} 用于描述错误的 `Error` 对象
* `tlsSocket` {tls.TLSSocket} The `tls.TLSSocket` instance from which the error originated.

### server.addContext(hostname, context)

<!-- YAML
added: v0.5.3
-->

* `hostname` {string} 一个 SNI 主机名或通配符 （例如：`'*'`）
* `context` {Object} An object containing any of the possible properties from the [`tls.createSecureContext()`][] `options` arguments (e.g. `key`, `cert`, `ca`, etc).

The `server.addContext()` method adds a secure context that will be used if the client request's SNI hostname matches the supplied `hostname` (or wildcard).

### server.address()

<!-- YAML
added: v0.6.0
-->

Returns the bound address, the address family name, and port of the server as reported by the operating system. See [`net.Server.address()`][] for more information.

### server.close([callback])

<!-- YAML
added: v0.3.2
-->

* `callback` {Function} An optional listener callback that will be registered to listen for the server instance's `'close'` event.

`server.close()` 方法会阻止服务器接受新连接。

此函数以异步方式运行。 The `'close'` event will be emitted when the server has no more open connections.

### server.connections

<!-- YAML
added: v0.3.2
deprecated: v0.9.7
-->

> 稳定性：0 - 已弃用：改为使用 [`server.getConnections()`][] 。

返回服务器上当前的并发连接数。

### server.getTicketKeys()

<!-- YAML
added: v3.0.0
-->

Returns a `Buffer` instance holding the keys currently used for encryption/decryption of the [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt)

### server.listen()

启动监听加密连接的服务器。 此方法与 [`net.Server`][] 中的 [`server.listen()`][] 相同。

### server.setTicketKeys(keys)

<!-- YAML
added: v3.0.0
-->

* `keys` {Buffer} The keys used for encryption/decryption of the [TLS Session Tickets](https://www.ietf.org/rfc/rfc5077.txt).

更新用于加密/解密 [TLS 会话凭据](https://www.ietf.org/rfc/rfc5077.txt) 的密钥。

*注意*：密钥的 `Buffer` 应为 48 个字节长。 See `ticketKeys` option in [tls.createServer](#tls_tls_createserver_options_secureconnectionlistener) for more information on how it is used.

*Note*: Changes to the ticket keys are effective only for future server connections. Existing or currently pending server connections will use the previous keys.

## 类：tls.TLSSocket

<!-- YAML
added: v0.11.4
-->

The `tls.TLSSocket` is a subclass of [`net.Socket`][] that performs transparent encryption of written data and all required TLS negotiation.

`tls.TLSSocket` 的实例实现了双工的 [Stream](stream.html#stream_stream) 接口。

*Note*: Methods that return TLS connection metadata (e.g. [`tls.TLSSocket.getPeerCertificate()`][] will only return data while the connection is open.

### new tls.TLSSocket(socket[, options])

<!-- YAML
added: v0.11.4
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `socket` {net.Socket|stream.Duplex} 在服务器端，任何的 `Duplex` 流。 On the client side, any instance of [`net.Socket`][] (for generic `Duplex` stream support on the client side, [`tls.connect()`][] must be used).
* `options` {Object} 
  * `isServer`: The SSL/TLS protocol is asymmetrical, TLSSockets must know if they are to behave as a server or a client. If `true` the TLS socket will be instantiated as a server. **默认:** `false`.
  * `server` {net.Server} 可选的 [`net.Server`][] 实例。
  * `requestCert`: Whether to authenticate the remote peer by requesting a certificate. 客户端始终请求服务器的证书。 Servers (`isServer` is true) may optionally set `requestCert` to true to request a client certificate.
  * `rejectUnauthorized`：可选，请参阅 [`tls.createServer()`][]
  * `NPNProtocols`：可选，请参阅 [`tls.createServer()`][]
  * `ALPNProtocols`：可选，请参阅 [`tls.createServer()`][]
  * `SNICallback`: 可选，请参阅 [`tls.createServer()`][]
  * `session` {Buffer} 包含 TLS 会话的可选 `Buffer` 实例。
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication
  * `secureContext`: Optional TLS context object created with [`tls.createSecureContext()`][]. If a `secureContext` is *not* provided, one will be created by passing the entire `options` object to `tls.createSecureContext()`.
  * ...: Optional [`tls.createSecureContext()`][] options that are used if the `secureContext` option is missing, otherwise they are ignored.

从现有的 TCP 套接字中构造一个新的 `tls.TLSSocket` 对象。

### 事件：'OCSPResponse'

<!-- YAML
added: v0.11.13
-->

The `'OCSPResponse'` event is emitted if the `requestOCSP` option was set when the `tls.TLSSocket` was created and an OCSP response has been received. 当被调用时，监听器回调函数将被赋予一个参数：

* `response` {Buffer} 服务器的 OCSP 响应

Typically, the `response` is a digitally signed object from the server's CA that contains information about server's certificate revocation status.

### 事件：'secureConnect'

<!-- YAML
added: v0.11.4
-->

The `'secureConnect'` event is emitted after the handshaking process for a new connection has successfully completed. The listener callback will be called regardless of whether or not the server's certificate has been authorized. It is the client's responsibility to check the `tlsSocket.authorized` property to determine if the server certificate was signed by one of the specified CAs. If `tlsSocket.authorized === false`, then the error can be found by examining the `tlsSocket.authorizationError` property. If either ALPN or NPN was used, the `tlsSocket.alpnProtocol` or `tlsSocket.npnProtocol` properties can be checked to determine the negotiated protocol.

### tlsSocket.address()

<!-- YAML
added: v0.11.4
-->

Returns the bound address, the address family name, and port of the underlying socket as reported by the operating system. Returns an object with three properties, e.g. `{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### tlsSocket.authorizationError

<!-- YAML
added: v0.11.4
-->

返回对等方证书未被验证的原因。 This property is set only when `tlsSocket.authorized === false`.

### tlsSocket.authorized

<!-- YAML
added: v0.11.4
-->

Returns `true` if the peer certificate was signed by one of the CAs specified when creating the `tls.TLSSocket` instance, otherwise `false`.

### tlsSocket.disableRenegotiation()

<!-- YAML
added: v8.4.0
-->

禁用此 `TLSSocket` 实例的 TLS 重新协商。 Once called, attempts to renegotiate will trigger an `'error'` event on the `TLSSocket`.

### tlsSocket.encrypted

<!-- YAML
added: v0.11.4
-->

总是返回 `true`。 This may be used to distinguish TLS sockets from regular `net.Socket` instances.

### tlsSocket.getCipher()

<!-- YAML
added: v0.11.4
-->

返回代表密码名称的对象。 The `version` key is a legacy field which always contains the value `'TLSv1/SSLv3'`.

例如：`{ name: 'AES256-SHA', version: 'TLSv1/SSLv3' }`

See `SSL_CIPHER_get_name()` in https://www.openssl.org/docs/man1.0.2/ssl/SSL_CIPHER_get_name.html for more information.

### tlsSocket.getEphemeralKeyInfo()

<!-- YAML
added: v5.0.0
-->

Returns an object representing the type, name, and size of parameter of an ephemeral key exchange in [Perfect Forward Secrecy](#tls_perfect_forward_secrecy) on a client connection. It returns an empty object when the key exchange is not ephemeral. As this is only supported on a client socket; `null` is returned if called on a server socket. 支持的类型为：`'DH'` 和 `'ECDH'`。 The `name` property is available only when type is 'ECDH'.

例如：`{ type: 'ECDH', name: 'prime256v1', size: 256 }`

### tlsSocket.getFinished()

<!-- YAML
added: v8.12.0
-->

* Returns: {Buffer|undefined} The latest `Finished` message that has been sent to the socket as part of a SSL/TLS handshake, or `undefined` if no `Finished` message has been sent yet.

As the `Finished` messages are message digests of the complete handshake (with a total of 192 bits for TLS 1.0 and more for SSL 3.0), they can be used for external authentication procedures when the authentication provided by SSL/TLS is not desired or is not enough.

Corresponds to the `SSL_get_finished` routine in OpenSSL and may be used to implement the `tls-unique` channel binding from [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getPeerCertificate([detailed])

<!-- YAML
added: v0.11.4
-->

* `detailed` {boolean} Include the full certificate chain if `true`, otherwise include just the peer's certificate.

返回代表对等方证书的对象。 The returned object has some properties corresponding to the fields of the certificate.

If the full certificate chain was requested, each certificate will include a `issuerCertificate` property containing an object representing its issuer's certificate.

例如：

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
   { ... another certificate, possibly with a .issuerCertificate ... },
  raw: < RAW DER buffer >,
  valid_from: 'Nov 11 09:52:22 2009 GMT',
  valid_to: 'Nov 6 09:52:22 2029 GMT',
  fingerprint: '2A:7A:C2:DD:E5:F9:CC:53:72:35:99:7A:02:5A:71:38:52:EC:8A:DF',
  serialNumber: 'B9B0D332A1AA5635' }
```

如果对等方没有提供证书，则返回一个空对象。

### tlsSocket.getPeerFinished()

<!-- YAML
added: v8.12.0
-->

* Returns: {Buffer|undefined} The latest `Finished` message that is expected or has actually been received from the socket as part of a SSL/TLS handshake, or `undefined` if there is no `Finished` message so far.

As the `Finished` messages are message digests of the complete handshake (with a total of 192 bits for TLS 1.0 and more for SSL 3.0), they can be used for external authentication procedures when the authentication provided by SSL/TLS is not desired or is not enough.

Corresponds to the `SSL_get_peer_finished` routine in OpenSSL and may be used to implement the `tls-unique` channel binding from [RFC 5929](https://tools.ietf.org/html/rfc5929).

### tlsSocket.getProtocol()

<!-- YAML
added: v5.7.0
-->

Returns a string containing the negotiated SSL/TLS protocol version of the current connection. The value `'unknown'` will be returned for connected sockets that have not completed the handshaking process. The value `null` will be returned for server sockets or disconnected client sockets.

响应示例包括：

* `TLSv1`
* `TLSv1.1`
* `TLSv1.2`
* `unknown`

See https://www.openssl.org/docs/man1.0.2/ssl/SSL_get_version.html for more information.

### tlsSocket.getSession()

<!-- YAML
added: v0.11.4
-->

Returns the ASN.1 encoded TLS session or `undefined` if no session was negotiated. Can be used to speed up handshake establishment when reconnecting to the server.

### tlsSocket.getTLSTicket()

<!-- YAML
added: v0.11.4
-->

返回 TLS 会话凭据，或者当没有协商任何会话时返回 `undefined`。

*注意*：它只适用于客户端 TLS 套接字。 Useful only for debugging, for session reuse provide `session` option to [`tls.connect()`][].

### tlsSocket.localAddress

<!-- YAML
added: v0.11.4
-->

返回代表本地 IP 地址的字符串。

### tlsSocket.localPort

<!-- YAML
added: v0.11.4
-->

返回代表本地端口号的数字。

### tlsSocket.remoteAddress

<!-- YAML
added: v0.11.4
-->

返回代表远程 IP 地址的字符串。 For example, `'74.125.127.100'` or `'2001:4860:a005::68'`.

### tlsSocket.remoteFamily

<!-- YAML
added: v0.11.4
-->

返回代表远程 IP 地址系列名的字符串。 `'IPv4'` 或 `'IPv6'`。

### tlsSocket.remotePort

<!-- YAML
added: v0.11.4
-->

返回代表远程端口号的数字。 例如：`443`。

### tlsSocket.renegotiate(options, callback)

<!-- YAML
added: v0.11.8
-->

* `options` {Object} 
  * `rejectUnauthorized` {boolean} If not `false`, the server certificate is verified against the list of supplied CAs. An `'error'` event is emitted if verification fails; `err.code` contains the OpenSSL error code. **Default:** `true`.
  * `requestCert`
* `callback` {Function} A function that will be called when the renegotiation request has been completed.

`tlsSocket.renegotiate()` 方法启动 TLS 重新协商过程。 Upon completion, the `callback` function will be passed a single argument that is either an `Error` (if the request failed) or `null`.

*Note*: This method can be used to request a peer's certificate after the secure connection has been established.

*Note*: When running as the server, the socket will be destroyed with an error after `handshakeTimeout` timeout.

### tlsSocket.setMaxSendFragment(size)

<!-- YAML
added: v0.11.11
-->

* `size` {number} TLS 片段大小的最大值。 The maximum value is `16384`. **Default:** `16384`.

`tlsSocket.setMaxSendFragment()` 方法会设置 TLS 片段大小的最大值。 如果成功设置限制，则返回 `true`，否则返回 `false`。

Smaller fragment sizes decrease the buffering latency on the client: larger fragments are buffered by the TLS layer until the entire fragment is received and its integrity is verified; large fragments can span multiple roundtrips and their processing can be delayed due to packet loss or reordering. However, smaller fragments add extra TLS framing bytes and CPU overhead, which may decrease overall server throughput.

## tls.checkServerIdentity(host, cert)

<!-- YAML
added: v0.8.4
-->

* `host` {string} 用于验证证书的主机名
* `cert` {Object} 代表对等方证书的对象。 The returned object has some properties corresponding to the fields of the certificate.

验证颁发给主机 `host` 的证书 `cert`。

Returns {Error} object, populating it with the reason, host, and cert on failure. 成功时，返回 {undefined}。

*Note*: This function can be overwritten by providing alternative function as part of the `options.checkServerIdentity` option passed to `tls.connect()`. The overwriting function can call `tls.checkServerIdentity()` of course, to augment the checks done with additional verification.

*Note*: This function is only called if the certificate passed all other checks, such as being issued by trusted CA (`options.ca`).

cert 对象包含已解析的证书，并将具有如下的类似结构：

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
  valid_from: 'Aug 14 00:00:00 2017 GMT',
  valid_to: 'Nov 20 23:59:59 2019 GMT',
  fingerprint: '01:02:59:D9:C3:D2:0D:08:F7:82:4E:44:A4:B4:53:C5:E2:3A:87:4D',
  ext_key_usage: [ '1.3.6.1.5.5.7.3.1', '1.3.6.1.5.5.7.3.2' ],
  serialNumber: '66593D57F20CBC573E433381B5FEC280',
  raw: <Buffer ....> }
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
    description: The `ALPNProtocols` and `NPNProtocols` options can
                 be `Uint8Array`s now.
  - version: v5.3.0, v4.7.0
    pr-url: https://github.com/nodejs/node/pull/4246
    description: The `secureContext` option is supported now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `options` {Object} 
  * `host` {string} 客户端应连接到的主机。 **默认值：** `'localhost'`.
  * `port` {number} 客户端应连接到的端口。
  * `path` {string} 创建和路径关联的 unix 套接字连接。 If this option is specified, `host` and `port` are ignored.
  * `socket` {stream.Duplex} Establish secure connection on a given socket rather than creating a new socket. Typically, this is an instance of [`net.Socket`][], but any `Duplex` stream is allowed. If this option is specified, `path`, `host` and `port` are ignored, except for certificate validation. Usually, a socket is already connected when passed to `tls.connect()`, but it can be connected later. Note that connection/disconnection/destruction of `socket` is the user's responsibility, calling `tls.connect()` will not cause `net.connect()` to be called.
  * `rejectUnauthorized` {boolean} If not `false`, the server certificate is verified against the list of supplied CAs. An `'error'` event is emitted if verification fails; `err.code` contains the OpenSSL error code. **Default:** `true`.
  * `NPNProtocols` {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing supported NPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['hello', 'world']`.
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing the supported ALPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['hello', 'world']`.
  * `servername`: {string} Server name for the SNI (Server Name Indication) TLS extension.
  * `checkServerIdentity(servername, cert)` {Function} A callback function to be used (instead of the builtin `tls.checkServerIdentity()` function) when checking the server's hostname (or the provided `servername` when explicitly set) against the certificate. This should return an {Error} if verification fails. The method should return `undefined` if the `servername` and `cert` are verified.
  * `session` {Buffer} 包含 TLS 会话的 `Buffer` 实例。
  * `minDHSize` {number} Minimum size of the DH parameter in bits to accept a TLS connection. When a server offers a DH parameter with a size less than `minDHSize`, the TLS connection is destroyed and an error is thrown. **Default:** `1024`.
  * `secureContext`: Optional TLS context object created with [`tls.createSecureContext()`][]. If a `secureContext` is *not* provided, one will be created by passing the entire `options` object to `tls.createSecureContext()`.
  * `lookup`: {Function} 自定义查找函数。 **默认值：** [`dns.lookup()`][].
  * ...: Optional [`tls.createSecureContext()`][] options that are used if the `secureContext` option is missing, otherwise they are ignored.
* `callback` {Function}

The `callback` function, if specified, will be added as a listener for the [`'secureConnect'`][] event.

`tls.connect()` 返回一个 [`tls.TLSSocket`][] 对象。

如下实现了一个简单的 "echo server" 示例：

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  // Necessary only if using the client certificate authentication
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem'),

  // Necessary only if the server uses the self-signed certificate
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

或

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

* `path` {string} `options.path` 的默认值。
* `options` {Object} 请参阅 [`tls.connect()`][]。
* `callback` {Function} 请参阅 [`tls.connect()`][]。

Same as [`tls.connect()`][] except that `path` can be provided as an argument instead of an option.

*Note*: A path option, if specified, will take precedence over the path argument.

## tls.connect(port\[, host\]\[, options\][, callback])

<!-- YAML
added: v0.11.3
-->

* `port` {number} `options.port` 的默认值。
* `host` {string} 可选的 `options.host` 的默认值。
* `options` {Object} 请参阅 [`tls.connect()`][]。
* `callback` {Function} 请参阅 [`tls.connect()`][]。

Same as [`tls.connect()`][] except that `port` and `host` can be provided as arguments instead of options.

*Note*: A port or host option, if specified, will take precedence over any port or host argument.

## tls.createSecureContext(options)

<!-- YAML
added: v0.11.13
changes:

  - version: v7.3.0
    pr-url: https://github.com/nodejs/node/pull/10294
    description: If the `key` option is an array, individual entries do not
                 need a `passphrase` property anymore. Array entries can also
                 just be `string`s or `Buffer`s now.
  - version: v5.2.0
    pr-url: https://github.com/nodejs/node/pull/4099
    description: The `ca` option can now be a single string containing multiple
                 CA certificates.
-->

* `options` {Object} 
  * `pfx` {string|string[]|Buffer|Buffer[]|Object[]} Optional PFX or PKCS12 encoded private key and certificate chain. `pfx` is an alternative to providing `key` and `cert` individually. PFX is usually encrypted, if it is, `passphrase` will be used to decrypt it. Multiple PFX can be provided either as an array of unencrypted PFX buffers, or an array of objects in the form `{buf: <string|buffer>[, passphrase: <string>]}`. The object form can only occur in an array. `object.passphrase` 是可选的。 Encrypted PFX will be decrypted with `object.passphrase` if provided, or `options.passphrase` if it is not.
  * `key` {string|string[]|Buffer|Buffer[]|Object[]} Optional private keys in PEM format. PEM 允许对私钥选项进行加密。 Encrypted keys will be decrypted with `options.passphrase`. Multiple keys using different algorithms can be provided either as an array of unencrypted key strings or buffers, or an array of objects in the form `{pem:
<string|buffer>[, passphrase: <string>]}`. The object form can only occur in an array. `object.passphrase` 是可选的。 Encrypted keys will be decrypted with `object.passphrase` if provided, or `options.passphrase` if it is not.
  * `passphrase` {string} Optional shared passphrase used for a single private key and/or a PFX.
  * `cert` {string|string[]|Buffer|Buffer[]} 可选的 PEM 格式证书链。 应对每个私钥提供一个证书链。 Each cert chain should consist of the PEM formatted certificate for a provided private `key`, followed by the PEM formatted intermediate certificates (if any), in order, and not including the root CA (the root CA must be pre-known to the peer, see `ca`). When providing multiple cert chains, they do not have to be in the same order as their private keys in `key`. If the intermediate certificates are not provided, the peer will not be able to validate the certificate, and the handshake will fail.
  * `ca` {string|string[]|Buffer|Buffer[]} Optionally override the trusted CA certificates. 默认值为信任由 Mozilla 策展的知名 CA。 Mozilla's CAs are completely replaced when CAs are explicitly specified using this option. The value can be a string or Buffer, or an Array of strings and/or Buffers. Any string or Buffer can contain multiple PEM CAs concatenated together. The peer's certificate must be chainable to a CA trusted by the server for the connection to be authenticated. When using certificates that are not chainable to a well-known CA, the certificate's CA must be explicitly specified as a trusted or the connection will fail to authenticate. If the peer uses a certificate that doesn't match or chain to one of the default CAs, use the `ca` option to provide a CA certificate that the peer's certificate can match or chain to. For self-signed certificates, the certificate is its own CA, and must be provided.
  * `crl` {string|string[]|Buffer|Buffer[]} Optional PEM formatted CRLs (Certificate Revocation Lists).
  * `ciphers` {string} Optional cipher suite specification, replacing the default. 请参阅 [更改默认密码套件](#tls_modifying_the_default_tls_cipher_suite) 以获取更多信息。
  * `honorCipherOrder` {boolean} Attempt to use the server's cipher suite preferences instead of the client's. When `true`, causes `SSL_OP_CIPHER_SERVER_PREFERENCE` to be set in `secureOptions`, see [OpenSSL Options](crypto.html#crypto_openssl_options) for more information.
  * `ecdhCurve` {string} A string describing a named curve or a colon separated list of curve NIDs or names, for example `P-521:P-384:P-256`, to use for ECDH key agreement, or `false` to disable ECDH. Set to `auto` to select the curve automatically. Use [`crypto.getCurves()`][] to obtain a list of available curve names. On recent releases, `openssl ecparam -list_curves` will also display the name and description of each available elliptic curve. **Default:** [`tls.DEFAULT_ECDH_CURVE`].
  * `dhparam` {string|Buffer} Diffie Hellman parameters, required for [Perfect Forward Secrecy](#tls_perfect_forward_secrecy). 运行 `openssl dhparam` 来创建参数。 The key length must be greater than or equal to 1024 bits, otherwise an error will be thrown. It is strongly recommended to use 2048 bits or larger for stronger security. If omitted or invalid, the parameters are silently discarded and DHE ciphers will not be available.
  * `secureProtocol` {string} Optional SSL method to use, default is `'SSLv23_method'`. The possible values are listed as [SSL_METHODS](https://www.openssl.org/docs/man1.0.2/ssl/ssl.html#DEALING-WITH-PROTOCOL-METHODS), use the function names as strings. For example, `'SSLv3_method'` to force SSL version 3.
  * `secureOptions` {number} Optionally affect the OpenSSL protocol behavior, which is not usually necessary. 如果有的话，应小心使用！ Value is a numeric bitmask of the `SSL_OP_*` options from [OpenSSL Options](crypto.html#crypto_openssl_options).
  * `sessionIdContext` {string} Optional opaque identifier used by servers to ensure session state is not shared between applications. 未被客户端使用。

*注意*：

* [`tls.createServer()`][] sets the default value of the `honorCipherOrder` option to `true`, other APIs that create secure contexts leave it unset.

* [`tls.createServer()`][] uses a 128 bit truncated SHA1 hash value generated from `process.argv` as the default value of the `sessionIdContext` option, other APIs that create secure contexts have no default value.

`tls.createSecureContext()` 方法创建一个安全凭据对象。

对于使用证书的密码，密钥是 *必须的*。 Either `key` or `pfx` can be used to provide it.

If the 'ca' option is not given, then Node.js will use the default publicly trusted list of CAs as given in <https://hg.mozilla.org/mozilla-central/raw-file/tip/security/nss/lib/ckfw/builtins/certdata.txt>.

## tls.createServer(\[options\]\[, secureConnectionListener\])

<!-- YAML
added: v0.3.2
changes:

  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11984
    description: The `ALPNProtocols` and `NPNProtocols` options can
                 be `Uint8Array`s now.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `options` {Object} 
  * `handshakeTimeout` {number} Abort the connection if the SSL/TLS handshake does not finish in the specified number of milliseconds. A `'tlsClientError'` is emitted on the `tls.Server` object whenever a handshake times out. **Default:** `120000` (120 seconds).
  * `requestCert` {boolean} If `true` the server will request a certificate from clients that connect and attempt to verify that certificate. **Default:** `false`.
  * `rejectUnauthorized` {boolean} If not `false` the server will reject any connection which is not authorized with the list of supplied CAs. This option only has an effect if `requestCert` is `true`. **Default:** `true`.
  * `NPNProtocols` {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing supported NPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['hello', 'world']`. (协议应按其优先级进行排序。)
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} An array of strings, `Buffer`s or `Uint8Array`s, or a single `Buffer` or `Uint8Array` containing the supported ALPN protocols. `Buffer`s should have the format `[len][name][len][name]...` e.g. `0x05hello0x05world`, where the first byte is the length of the next protocol name. Passing an array is usually much simpler, e.g. `['hello', 'world']`. (Protocols should be ordered by their priority.) When the server receives both NPN and ALPN extensions from the client, ALPN takes precedence over NPN and the server does not send an NPN extension to the client.
  * `SNICallback(servername, cb)` {Function} A function that will be called if the client supports SNI TLS extension. Two arguments will be passed when called: `servername` and `cb`. `SNICallback` should invoke `cb(null, ctx)`, where `ctx` is a SecureContext instance. (`tls.createSecureContext(...)` can be used to get a proper SecureContext.) If `SNICallback` wasn't provided the default callback with high-level API will be used (see below).
  * `sessionTimeout` {number} An integer specifying the number of seconds after which the TLS session identifiers and TLS session tickets created by the server will time out. 请参阅 [SSL_CTX_set_timeout](https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_timeout.html) 以获取更多信息。
  * `ticketKeys`: A 48-byte `Buffer` instance consisting of a 16-byte prefix, a 16-byte HMAC key, and a 16-byte AES key. This can be used to accept TLS session tickets on multiple instances of the TLS server.
  * ...: 可以提供任何的 [`tls.createSecureContext()`][] 选项。 For servers, the identity options (`pfx` or `key`/`cert`) are usually required.
* `secureConnectionListener` {Function}

创建一个新的 [tls.Server](#tls_class_tls_server)。 The `secureConnectionListener`, if provided, is automatically set as a listener for the [`'secureConnection'`][] event.

*Note*: The `ticketKeys` options is automatically shared between `cluster` module workers.

如下演示了一个简单的 echo 服务器：

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

或

```js
const tls = require('tls');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('server.pfx'),

  // This is necessary only if using the client certificate authentication.
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

可以通过使用 `openssl s_client` 来连接到服务器以对其进行测试。

```sh
openssl s_client -connect 127.0.0.1:8000
```

## tls.getCiphers()

<!-- YAML
added: v0.10.2
-->

返回一个受支持的 SSL 密码名称的数组。

例如：

```js
console.log(tls.getCiphers()); // ['AES128-SHA', 'AES256-SHA', ...]
```

## tls.DEFAULT_ECDH_CURVE

<!-- YAML
added: v0.11.13
-->

在 tls 服务器中用于 ECDH 密钥协议的默认曲线名称。 The default value is `'prime256v1'` (NIST P-256). Consult [RFC 4492](https://www.rfc-editor.org/rfc/rfc4492.txt) and [FIPS.186-4](http://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf) for more details.

## 已弃用的 API

### 类：CryptoStream

<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

> 稳定性：0 - 已弃用：改为使用 [`tls.TLSSocket`][]。

`tls.CryptoStream` 类表示加密数据流。 This class has been deprecated and should no longer be used.

#### cryptoStream.bytesWritten

<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

The `cryptoStream.bytesWritten` property returns the total number of bytes written to the underlying socket *including* the bytes required for the implementation of the TLS protocol.

### 类：SecurePair

<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

> 稳定性：0 - 已弃用：改为使用 [`tls.TLSSocket`][]。

由 [`tls.createSecurePair()`][] 返回。

#### 事件：'secure'

<!-- YAML
added: v0.3.2
deprecated: v0.11.3
-->

The `'secure'` event is emitted by the `SecurePair` object once a secure connection has been established.

As with checking for the server [`secureConnection`](#tls_event_secureconnection) event, `pair.cleartext.authorized` should be inspected to confirm whether the certificate used is properly authorized.

### tls.createSecurePair(\[context\]\[, isServer\]\[, requestCert\]\[, rejectUnauthorized\][, options])

<!-- YAML
added: v0.3.2
deprecated: v0.11.3
changes:

  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

> 稳定性：0 - 已弃用：改为使用 [`tls.TLSSocket`][]。

* `context` {Object} A secure context object as returned by `tls.createSecureContext()`
* `isServer` {boolean} `true` to specify that this TLS connection should be opened as a server.
* `requestCert` {boolean} `true` to specify whether a server should request a certificate from a connecting client. 只适用于当 `isServer` 的值为 `true`时。
* `rejectUnauthorized` {boolean} If not `false` a server automatically reject clients with invalid certificates. 只适用于当 `isServer` 的值为 `true`时。
* `options` 
  * `secureContext`: An optional TLS context object from [`tls.createSecureContext()`][]
  * `isServer`：如果值为 `true`，则 TLS 套接字将被以服务器模式初始化。 **默认:** `false`.
  * `server` {net.Server} 可选的 [`net.Server`][] 实例
  * `requestCert`：可选的，请参阅 [`tls.createServer()`][]
  * `rejectUnauthorized`：可选的，请参阅 [`tls.createServer()`][]
  * `NPNProtocols`：可选的，请参阅 [`tls.createServer()`][]
  * `ALPNProtocols`：可选的，请参阅 [`tls.createServer()`][]
  * `SNICallback`：可选的，请参阅 [`tls.createServer()`][]
  * `session` {Buffer} 可选的包含 TLS 会话的 `Buffer` 实例。
  * `requestOCSP` {boolean} If `true`, specifies that the OCSP status request extension will be added to the client hello and an `'OCSPResponse'` event will be emitted on the socket before establishing a secure communication

Creates a new secure pair object with two streams, one of which reads and writes the encrypted data and the other of which reads and writes the cleartext data. Generally, the encrypted stream is piped to/from an incoming encrypted data stream and the cleartext one is used as a replacement for the initial encrypted stream.

`tls.createSecurePair()` returns a `tls.SecurePair` object with `cleartext` and `encrypted` stream properties.

*注意*：`cleartext` 具有和 [`tls.TLSSocket`][] 相同的API。

*Note*: The `tls.createSecurePair()` method is now deprecated in favor of `tls.TLSSocket()`. 例如，代码：

```js
pair = tls.createSecurePair(/* ... */);
pair.encrypted.pipe(socket);
socket.pipe(pair.encrypted);
```

可被替换为：

```js
secure_socket = tls.TLSSocket(socket, options);
```

其中 `secure_socket` 含有和 `pair.cleartext` 相同的 API。