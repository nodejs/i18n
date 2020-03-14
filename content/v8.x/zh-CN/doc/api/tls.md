# TLS (SSL)

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

`tls` 模块提供了对传输层安全性 (TLS) 及构建于 OpenSSL 之上的安全套接字层 （SSL）的实现。 此模块可通过如下方式访问：

```js
const tls = require('tls');
```

## TLS/SSL 概念

TLS/SSL 是一个基于公钥/私钥的架构 （PKI）。 对于最常见的情况，每个客户端和服务器必须具有一个 *私钥*。

私钥可通过多种方式生成。 如下示例子演示了如何通过 OpenSSL 命令行界面生成 2048 位的 RSA 私钥：

```sh
openssl genrsa -out ryans-key.pem 2048
```

在使用 TLS/SSL 时，所有服务器 （和一些客户端）必须具有 *证书*。 证书是和私钥对应的 *公钥*，并且由证书颁发机构或私钥所有者（这样的证书被称作“自签名的”）进行数字签名。 获取证书的第一步是创建一个 *证书签名请求* （CSR）文件。

OpenSSL 命令行界面可被用于生成一个针对私钥的 CSR。

```sh
openssl req -new -sha256 -key ryans-key.pem -out ryans-csr.pem
```

一旦 CSR 文件生成，它可被发送给证书颁发机构以获取签名，或者用于生成自签名证书。

下面的示例演示了如何使用 OpenSSL 命令行界面创建一个自签名证书。

```sh
openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
```

一旦证书被生成，它就可以被用于生成 `.pfx` 或 `.p12` 文件：

```sh
openssl pkcs12 -export -in ryans-cert.pem -inkey ryans-key.pem \
      -certfile ca-cert.pem -out ryans.pfx
```

其中：

* `in`：是已签名的证书
* `inkey`：是关联的私钥
* `certfile`：是所有证书颁发机构（CA）的证书连接而成的单一文件，即：`cat ca1-cert.pem ca2-cert.pem > ca-cert.pem`

### 完美前向安全

<!-- type=misc -->

术语 "[前向安全](https://en.wikipedia.org/wiki/Perfect_forward_secrecy)" 或 "完美前向安全" 描述了密钥协商（即密钥交换）方法的一个特征。 这就是，服务器端和客户端密钥用于协商仅用于当前通讯会话的新临时密钥。 在实际上，这意味着即使服务器的私钥泄露，如果攻击者能够获取专门针对某个会话的密钥对，窃听者也只能解密该会话中的通讯。

完美前向安全是通过针对每一个 TLS/SSL 握手的密钥协商随机生成密钥对（与针对所有会话使用相同的密钥相比）来实现的。 实现此技术的方法被称为 "ephemeral"。

目前有两种常见方法来实现完美前向安全（注意：字符 "E" 被追加到传统缩写之后）：

* [DHE](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange) - Diffie Hellman 密钥协议的 ephemeral 版本。
* [ECDHE](https://en.wikipedia.org/wiki/Elliptic_curve_Diffie%E2%80%93Hellman) - Elliptic Curve Diffie Hellman 密钥协议的 ephemeral 版本。

由于密钥生成的系统开销很大，ephemeral 方法可能在性能上会有缺陷。

要想通过 `DHE` 方法和 `tls` 模块来使用完美前向安全，要求生成 Diffie-Hellman 参数并在 [`tls.createSecureContext()`][] 的 `dhparam` 参数中进行指定。 下面演示了如何通过 OpenSSL 命令行界面来生成这些参数：

```sh
openssl dhparam -outform PEM -out dhparam.pem 2048
```

如果通过 `ECDHE` 方法使用完美前向安全，Diffie-Hellman 参数不是必须的，默认的 ECDHE 曲线将被使用。 当创建 TLS 服务器时，`ecdhCurve` 属性可被用于指定支持的曲线名称列表，请参阅 [`tls.createServer()`] 以获取更多信息。

### ALPN, NPN, 及 SNI

<!-- type=misc -->

ALPN (应用层协议协商扩展)，NPN (下一代协议协商) 和 SNI (服务器名称指示) 都是 TLS 握手扩展：

* ALPN/NPN - 允许在一个 TLS 服务器上使用多种协议 (HTTP, SPDY, HTTP/2)
* SNI - 允许使用一个 TLS 服务器支持多个具有不同 SSL 证书的主机名。

*注意*：推荐使用 ALPN 而不是 NPN。 NPN 扩展从未被正式定义或记录，一般不推荐使用。

### 客户端发起的重新协商攻击缓解

<!-- type=misc -->

TLS 协议允许客户端重新协商 TLS 会话的特定方面。 遗憾的是，会话重新协商需要不成比例的服务器端资源，这使得它成为拒绝服务攻击的潜在载体。

为了减轻风险，重新协商以每十分钟三次为上限。 当超出此上限时，在 [`tls.TLSSocket`][] 实例上会发出 `'error'` 事件。 此限制是可以配置的：

* `tls.CLIENT_RENEG_LIMIT` {number} 指定重新协商请求的数量。 **Default:** `3`.
* `tls.CLIENT_RENEG_WINDOW` {number} 指定以秒计的重新协商请求时间段。 **Default:** `600` (10 minutes).

*注意*：如果没有对其影响和风险有充分的理解，不应修改默认的重新协商限制。

要想测试服务器上的重新协商限制，使用 OpenSSL 命令行客户端 (`openssl s_client -connect address:port`) 连接服务器，然后多次输入 `R&lt;CR&gt;` (即：字母 `R` 然后回车键) 。

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

可以通过 `--tls-cipher-list` 命令行开关来完全替换此默认设置。 例如：以下值将 `ECDHE-RSA-AES128-GCM-SHA256:!RC4` 作为默认的 TLS 密码套件：

```sh
node --tls-cipher-list="ECDHE-RSA-AES128-GCM-SHA256:!RC4"
```

默认值也可以通过 [`tls.createSecureContext()`][] 中的 `ciphers` 选项来针对每个客户端或服务器端来替换，该选项同样在 [`tls.createServer()`], [`tls.connect()`]，以及创建新的 [`tls.TLSSocket`] 时可用。

请参阅 [OpenSSL 密码列表格式文档](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT) 以获取格式的细节信息。

*注意*：Node.js 中包含的默认密码套件是被精心挑选的，以反映当前安全最佳实践和风险缓解。 更改默认的密码套件会对应用程序的安全性产生重大影响。 `--tls-cipher-list` 开关以及 `ciphers` 选项只有在绝对必要时被使用。

The default cipher suite prefers GCM ciphers for [Chrome's 'modern cryptography' setting] and also prefers ECDHE and DHE ciphers for Perfect Forward Secrecy, while offering *some* backward compatibility.

128 bit AES is preferred over 192 and 256 bit AES in light of [specific attacks affecting larger AES key sizes].

依赖于不安全和已弃用的 RC4 或基于 DES 密码的旧客户端（如：Internet Explorer 6），在默认设置下无法完成握手过程。 如果这些客户端 _必须_ 被支持，[TLS 建议](https://wiki.mozilla.org/Security/Server_Side_TLS) 必须提供兼容的密码套件。 关于格式的细节，请参阅 [OpenSSL 密码列表格式文档](https://www.openssl.org/docs/man1.0.2/apps/ciphers.html#CIPHER-LIST-FORMAT)。

## 类：tls.Server
<!-- YAML
added: v0.3.2
-->

`tls.Server` 类是 `net.Server` 的子类，该类接受使用 TLS 或 SSL 的加密连接。

### 事件：'newSession'
<!-- YAML
added: v0.9.2
-->

在创建新的 TLS 会话时，`'newSession'` 事件会被发出。 这可被用于将会话保存在外部存储中。 当被调用时，监听器回调函数将被赋予三个参数：

* `sessionId` - TLS 会话标识符
* `sessionData` - TLS 会话数据
* `callback` {Function} 为了在安全连接中发送和接收数据的，不接受任何参数的回调函数。

*注意*：监听此事件仅对在事件监听器被添加后建立的连接产生作用。

### 事件：'OCSPRequest'
<!-- YAML
added: v0.11.13
-->

当客户端发出证书状态查询时，`'OCSPRequest'` 事件被发送。 当被调用时，监听器回调函数将被赋予三个参数：

* `certificate` {Buffer} 服务器端证书
* `issuer` {Buffer} 签发者证书
* `callback` {Function} 一个必须被调用以提供 OCSP 请求结果的回调函数。

服务器的当前证书可被解析以获取 OCSP URL及证书 ID；在获取 OCSP 响应之后，`callback(null, resp)` 将被调用，其中 `resp` 是一个包含 OCSP 响应的 `Buffer` 实例。 `certificate` 和 `issuer` 都是 `Buffer` 的DER 形式表示的主要及颁发机构的证书。 这些可被用于获取 OCSP 证书 ID以及 OCSP 终端 URL。

或者，可以调用 `callback(null, null)`，来表明没有 OCSP 响应。

调用 `callback(err)` 将会导致 `socket.destroy(err)` 被调用。

典型的 OCSP 请求流程如下所示：

1. Client connects to the server and sends an `'OCSPRequest'` (via the status info extension in ClientHello).
2. Server receives the request and emits the `'OCSPRequest'` event, calling the listener if registered.
3. Server extracts the OCSP URL from either the `certificate` or `issuer` and performs an [OCSP request](https://en.wikipedia.org/wiki/OCSP_stapling) to the CA.
4. Server receives `OCSPResponse` from the CA and sends it back to the client via the `callback` argument
5. Client validates the response and either destroys the socket or performs a handshake.

*注意*：如果证书为自签名的，或者 issuer 不在根证书列表中，`issuer` 的值可能为 `null`。 （在建立 TLS 连接时，issuer 可以通过 `ca` 选项来提供。）

*注意*：监听此事件仅对在事件监听器被添加后建立的连接产生作用。

*注意*：像 [asn1.js](https://npmjs.org/package/asn1.js) 这样的 npm 模块可被用于解析证书。

### 事件：'resumeSession'
<!-- YAML
added: v0.9.2
-->

当客户端请求继续以前的 TLS 会话时，将发出 `'resumeSession'` 事件。 当被调用时，监听器回调函数将被赋予两个参数：

* `sessionId` - TLS/SSL 会话标识符
* `callback` {Function} 当上一个会话被恢复时被调用的回调函数。

当被调用时，事件监听器可能会使用给定的 `sessionId` 在外部存储中查找，并在结束时调用 `callback(null, sessionData)`。 如果会话无法恢复（即：在存储中不存在），则会以 `callback(null, null)` 的形式调用回调函数。 调用 `callback(err)` 将会终止传入的连接并销毁套接字。

*注意*：监听此事件仅对在事件监听器被添加后建立的连接产生作用。

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

在新建连接的握手过程成功完成后，将发出 `'secureConnection'` 事件。 当被调用时，监听器回调函数将被赋予一个参数：

* `tlsSocket` {tls.TLSSocket} 已建立的 TLS 套接字。

`tlsSocket.authorized` 属性为 `boolean` 类型，它指示客户端是否已由提供的服务器证书颁发机构之一进行了验证。 如果 `tlsSocket.authorized` 的值为 `false`，则 `socket.authorizationError` 被赋值以描述授权如何失败。 注意：根据 TLS 服务器的设置，未经授权的连接仍可能被接受。

`tlsSocket.npnProtocol` 和 `tlsSocket.alpnProtocol` 属性是分别包含选定的 NPN 及 ALPN 协议的字符串。 当 NPN 和 ALPN 扩展都被接收时，ALPN 会优先于 NPN，下一个协议则由 ALPN 选择。

如果 ALPN 没有选定的协议，`tlsSocket.alpnProtocol` 会返回 `false`。

`tlsSocket.servername` 属性是包含通过 SNI 请求的服务器名称的字符串。

### 事件：'tlsClientError'
<!-- YAML
added: v6.0.0
-->

在建立安全连接之前发生错误时，将发出 `'tlsClientError'` 事件。 当被调用时，监听器回调函数将被赋予两个参数：

* `exception` {Error} 用于描述错误的 `Error` 对象
* `tlsSocket` {tls.TLSSocket} 产生错误根源的 `tls.TLSSocket` 实例。

### server.addContext(hostname, context)
<!-- YAML
added: v0.5.3
-->

* `hostname` {string} 一个 SNI 主机名或通配符 （例如：`'*'`）
* `context` {Object} 包含来自于 [`tls.createSecureContext()`][] `options` 参数 （例如：`key`, `cert`, `ca`等）中任何可能属性的对象。

`server.addContext()` 方法添加了一个安全上下文，如果客户端请求的 SNI 主机名和提供的 `hostname` （或通配符）相匹配，该上下文将被使用。

### server.address()
<!-- YAML
added: v0.6.0
-->

返回操作系统报告的绑定地址，地址系列名，以及服务器端口号。 请查阅 [`net.Server.address()`][] 以获取更多信息。

### server.close([callback])
<!-- YAML
added: v0.3.2
-->

* `callback` {Function} 一个可选的监听器回调函数，该函数将被注册并监听服务器实例的 `'close'` 事件。

`server.close()` 方法会阻止服务器接受新连接。

此函数以异步方式运行。 当服务器没有更多的打开连接时，将发出 `'close'` 事件。

### server.connections
<!-- YAML
added: v0.3.2
deprecated: v0.9.7
-->

> 稳定性：0 - 已弃用：改为使用 [`server.getConnections()`][]。

返回服务器上当前的并发连接数。

### server.getTicketKeys()
<!-- YAML
added: v3.0.0
-->

返回一个 `Buffer` 实例，该实例中包含用于当前 [TLS 会话凭据](https://www.ietf.org/rfc/rfc5077.txt) 加密/解密的密钥 。

### server.listen()

启动监听加密连接的服务器。 此方法与 [`net.Server`][] 中的 [`server.listen()`][] 相同。

### server.setTicketKeys(keys)
<!-- YAML
added: v3.0.0
-->

* `keys` {Buffer} 用于 [TLS 会话凭据](https://www.ietf.org/rfc/rfc5077.txt) 加密/解密的密钥。

更新用于加密/解密 [TLS 会话凭据](https://www.ietf.org/rfc/rfc5077.txt) 的密钥。

*注意*：密钥的 `Buffer` 应为 48 个字节长。 请参阅 [tls.createServer](#tls_tls_createserver_options_secureconnectionlistener) 中的 `ticketKeys` 选项以获取更多关于如何使用它的信息。

*注意*：对凭据密钥的更改仅对该更改之后的服务器连接有效。 现有的或待处理的服务器连接将使用以前的密钥。


## 类：tls.TLSSocket
<!-- YAML
added: v0.11.4
-->

`tls.TLSSocket` 是对写入数据及所有必须的 TLS 协商进行透明加密的 [`net.Socket`][] 类的子类，

`tls.TLSSocket` 的实例实现了双工的 [Stream](stream.html#stream_stream) 接口。

*注意*：返回 TLS 连接元数据的方法（例如：[`tls.TLSSocket.getPeerCertificate()`][]）只有在连接被打开时返回数据。

### new tls.TLSSocket(socket[, options])
<!-- YAML
added: v0.11.4
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2564
    description: ALPN options are supported now.
-->

* `socket` {net.Socket|stream.Duplex} 在服务器端，任何的 `Duplex` 流。 在客户端，[`net.Socket`][] 的任何实例 （对于客户端的通用 `Duplex` 流支持，必须使用 [`tls.connect()`][]）。
* `options` {Object}
  * `isServer`：SSL/TLS 协议是不对称的，TLSSockets 必须知道它们是否要作为服务器还是客户端。 如果值为 `true`，TLS 套接字将被实例化为服务器。 **默认:** `false`.
  * `server` {net.Server} 可选的 [`net.Server`][] 实例。
  * `requestCert`：是否通过请求证书来对远程对等方进行身份验证。 客户端始终请求服务器的证书。 服务器 (`isServer` 的值为 true）可以选择性的将 `requestCert` 的值设置为 true，以请求客户端证书。
  * `rejectUnauthorized`：可选的，请参阅 [`tls.createServer()`][]
  * `NPNProtocols`：可选，请参阅 [`tls.createServer()`][]
  * `ALPNProtocols`：可选，请参阅 [`tls.createServer()`][]
  * `SNICallback`: 可选，请参阅 [`tls.createServer()`][]
  * `session` {Buffer} 包含 TLS 会话的可选 `Buffer` 实例。
  * `requestOCSP` {boolean} 如果值为 `true`，指定 OCSP 状态请求扩展将被添加到客户端 hello 消息中，且在建立安全通信之前发出 `'OCSPResponse'` 事件。
  * `secureContext`：可选 通过 [`tls.createSecureContext()`][] 创建的可选的 TLS 上下文对象。 如果 _没有_ 提供 `secureContext`，则会通过传递完整的 `options` 对象给 `tls.createSecureContext()` 来创建一个。
  * ...: 可选 如果缺少 `secureContext` 选项，则会使用可选的 [`tls.createSecureContext()`][] 选项，否则它们将被忽略。

从现有的 TCP 套接字中构造一个新的 `tls.TLSSocket` 对象。

### 事件：'OCSPResponse'
<!-- YAML
added: v0.11.13
-->

当 `tls.TLSSocket` 被创建且已收到 OCSP 响应时，如果 `requestOCSP` 选项被设置，将发出 `'OCSPResponse'` 事件。 当被调用时，监听器回调函数将被赋予一个参数：

* `response` {Buffer} 服务器的 OCSP 响应

通常，`response` 是来自服务器 CA 的数字签名对象，它包含服务器证书废止的状态信息。

### 事件：'secureConnect'
<!-- YAML
added: v0.11.4
-->

在新建连接的握手过程成功完成后，将发出 `'secureConnect'` 事件。 无论服务器的证书是否已被授权，监听器回调函数都将被调用。 客户端有责任检查 `tlsSocket.authorized` 属性来确定服务器证书是否由指定的 CA 之一签名。 如果 `tlsSocket.authorized === false`，可通过检查 `tlsSocket.authorizationError` 属性来发现错误。 如果 ALPN 和 NPN 都没有被使用，可通过检查 `tlsSocket.alpnProtocol` 或 `tlsSocket.npnProtocol` 属性来确定已协商的协议。

### tlsSocket.address()
<!-- YAML
added: v0.11.4
-->

返回操作系统报告的绑定地址，地址系列名，以及服务器端口号。 返回包含三个属性的对象，例如：`{ port: 12346, family: 'IPv4', address: '127.0.0.1' }`

### tlsSocket.authorizationError
<!-- YAML
added: v0.11.4
-->

返回对等方证书未被验证的原因。 只有在 `tlsSocket.authorized === false` 时，此属性被设置。

### tlsSocket.authorized
<!-- YAML
added: v0.11.4
-->

在创建 `tls.TLSSocket` 实例时，如果对等方证书由指定的 CA 之一签名，返回 `true`，否则返回 `false`。

### tlsSocket.disableRenegotiation()
<!-- YAML
added: v8.4.0
-->

禁用此 `TLSSocket` 实例的 TLS 重新协商。 一旦调用，重新协商的尝试会触发 `TLSSocket` 上的 `'error'` 事件。

### tlsSocket.encrypted
<!-- YAML
added: v0.11.4
-->

总是返回 `true`。 它也可以被用于区分 TLS 套接字和常规的 `net.Socket` 实例。

### tlsSocket.getCipher()
<!-- YAML
added: v0.11.4
-->

返回代表密码名称的对象。 `version` 键是一个传统字段，它始终包含 `'TLSv1/SSLv3'` 值。

例如：`{ name: 'AES256-SHA', version: 'TLSv1/SSLv3' }`

请参阅 https://www.openssl.org/docs/man1.0.2/ssl/SSL_CIPHER_get_name.html 中的 `SSL_CIPHER_get_name()` 以获取更多信息。

### tlsSocket.getEphemeralKeyInfo()
<!-- YAML
added: v5.0.0
-->

返回一个代表类型，名称，以及在客户端连接的 [完美前向安全](#tls_perfect_forward_secrecy) 中用于交换的 ephemeral 密钥大小的对象。 当密钥交换不是 ephemeral 时，返回一个空对象。 因为这只在客户端套接字中支持，如果在服务器套接字上调用，则返回 `null`。 支持的类型为：`'DH'` 和 `'ECDH'`。 只有当类型为 'ECDH' 时，`name` 属性可用。

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

* `detailed` {boolean} 如果值为 `true`，则包含完整的证书链，否则只包含对等方的证书。

返回代表对等方证书的对象。 返回的对象具有和证书中字段相对应的属性。

如果请求完整的证书链，每个证书将包含 `issuerCertificate` 属性，该属性包含一个代表颁发者证书的对象。

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

返回一个包含当前连接的已协商过的 SSL/TLS 协议版本号的字符串。 对于尚未完成握手过程的已连接套接字，将返回 `'unknown'` 值。 对于服务器套接字或断开连接的客户端套接字，将返回 `null` 值。

响应示例包括：

* `TLSv1`
* `TLSv1.1`
* `TLSv1.2`
* `unknown`

请参阅 https://www.openssl.org/docs/man1.0.2/ssl/SSL_get_version.html 以获取更多信息。

### tlsSocket.getSession()
<!-- YAML
added: v0.11.4
-->

返回一个 ASN.1 编码的 TLS 会话，如果没有协商任何会话，则返回 `undefined`。 当重新连接到服务器时，此方法可被用于加快握手过程的创建。

### tlsSocket.getTLSTicket()
<!-- YAML
added: v0.11.4
-->

返回 TLS 会话凭据，或者当没有协商任何会话时返回 `undefined`。

*注意*：它只适用于客户端 TLS 套接字。 仅用于调试，对于会话的重用，可为 [`tls.connect()`][] 提供 `session` 选项。

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

返回代表远程 IP 地址的字符串。 例如： `'74.125.127.100'` 或 `'2001:4860:a005::68'`。

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
  * `rejectUnauthorized` {boolean} If not `false`, the server certificate is verified against the list of supplied CAs. 如果验证失败，则会发出 `'error'` 事件；`err.code` 包含 OpenSSL 错误代码。 **Default:** `true`.
  * `requestCert`
* `callback` {Function} 当重新协商请求结束后被调用的函数。

`tlsSocket.renegotiate()` 方法启动 TLS 重新协商过程。 结束后，`callback` 函数会被赋予一个参数，该参数为 `Error` （如果请求失败）或 `null`。

*注意*：在建立安全连接后，此方法可被用于请求对等方的证书。

*注意*：当以服务器方式运行时，如果 `handshakeTimeout` 超时，套接字将被销毁并出错。

### tlsSocket.setMaxSendFragment(size)
<!-- YAML
added: v0.11.11
-->

* `size` {number} TLS 片段大小的最大值。 The maximum value is `16384`. **Default:** `16384`.

`tlsSocket.setMaxSendFragment()` 方法会设置 TLS 片段大小的最大值。 如果成功设置限制，则返回 `true`，否则返回 `false`。

较小的片段大小会减少客户端的缓冲延迟；在收到完整的片段且其完整性已被验证之前，较大的片段会在 TLS 层被缓冲；较大的片段可能需要多次的交互才能完成数据的传输，同时由于数据包丢失或重新排序，其处理可能会延迟。 然而，较小的片段会增加额外的 TLS 帧字节和 CPU 开销，这可能会降低服务器的整体吞吐量。

## tls.checkServerIdentity(host, cert)
<!-- YAML
added: v0.8.4
-->

* `host` {string} 用于验证证书的主机名
* `cert` {Object} 代表对等方证书的对象。 返回的对象具有和证书中字段相对应的属性。

验证颁发给主机 `host` 的证书 `cert`。

返回 {Error} 对象，在失败时用reason，host，及 cert 来填充该对象。 成功时，返回 {undefined}。

*注意*：通过将替代函数作为传递给 `tls.connect()` 的 `options.checkServerIdentity` 选项的一部分，此函数可被重写。 重写函数当然可以调用 `tls.checkServerIdentity()`，以增加通过额外验证实现的检查。

*注意*：只有在证书通过所有其他检查，例如由受信任的 CA （`options.ca`）颁发的检查时，此函数才会被调用。

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
  * `host` {string} 客户端应连接到的主机。 **Default:** `'localhost'`.
  * `port` {number} 客户端应连接到的端口。
  * `path` {string} 创建和路径关联的 unix 套接字连接。 如果此选项被指定，则 `host` 和 `port` 会被忽略。
  * `socket` {stream.Duplex} 建立到给定套接字的安全连接，而不是创建一个新的套接字。 通常情况下，这是 [`net.Socket`][] 的实例，但允许任何的 `Duplex` 流。 如果指定此选项，除了在证书验证时，`path`, `host` 和 `port` 将被忽略。 通常，当传递给 `tls.connect()` 时，套接字已连接，但它也可在稍后被连接。 注意：连接/断开连接/销毁 `socket` 是用户的责任，调用 `tls.connect()` 并不会导致对 `net.connect()` 的调用。
  * `rejectUnauthorized` {boolean} If not `false`, the server certificate is verified against the list of supplied CAs. 如果验证失败，则会发出 `'error'` 事件；`err.code` 包含 OpenSSL 错误代码。 **Default:** `true`.
  * `NPNProtocols` {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} 字符串数组，含有支持的 NPN 协议的一个或多个 `Buffer` 或 `Uint8Array`。 `Buffer` 的格式应该是这样的：`[len][name][len][name]...`。例如：`0x05hello0x05world`，其中的首字节为下一个协议名的长度。 传入一个数组通常会更简单，例如：`['hello', 'world']`。
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} 字符串数组，含有支持的 ALPN 协议的一个或多个 `Buffer` 或 `Uint8Array`。 `Buffer` 的格式应该是这样的：`[len][name][len][name]...`，例如：`0x05hello0x05world`，其中首字节为下一个协议名的长度。 传入一个数组通常会更简单，例如：`['hello', 'world']`。
  * `servername`: {string} SNI (服务器名称指示) TLS 扩展的服务器名。
  * `checkServerIdentity(servername, cert)` {Function} 当针对证书检查服务器的主机名 (如果明确设置，则为 `servername`) 时，将被使用的回调函数 (而不是内置的 `tls.checkServerIdentity()` 函数)。 如果验证失败，则应返回 {Error}。 如果 `servername` 和 `cert` 已验证，此方法应返回 `undefined`。
  * `session` {Buffer} 包含 TLS 会话的 `Buffer` 实例。
  * `minDHSize` {number} 用来接受 TLS 连接的，以位为单位的 DH 参数大小的最小值。 当服务器提供的 DH 参数的大小小于 `minDHSize` 时，TLS 连接将被销毁，且将抛出错误。 **Default:** `1024`.
  * `secureContext`：可选 通过 [`tls.createSecureContext()`][] 创建的可选的 TLS 上下文对象。 如果 _没有_ 提供 `secureContext`，则会通过传递完整的 `options` 对象给 `tls.createSecureContext()` 来创建一个。
  * `lookup`: {Function} 自定义查找函数。 **Default:** [`dns.lookup()`][].
  * ...: 可选 如果缺少 `secureContext` 选项，则会使用可选的 [`tls.createSecureContext()`][] 选项，否则它们将被忽略。
* `callback` {Function}

如果指定了 `callback` 函数，则该函数将被添加为 [`'secureConnect'`][] 事件的监听器。

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

与 [`tls.connect()`][] 相同，但不同之处在于 `path` 可以通过参数，而不是选项的方式提供。

*注意*：如果指定 path 选项，它将优于 path 参数。

## tls.connect(port\[, host\]\[, options\][, callback])
<!-- YAML
added: v0.11.3
-->

* `port` {number} `options.port` 的默认值。
* `host` {string} 可选的 `options.host` 的默认值。
* `options` {Object} 请参阅 [`tls.connect()`][]。
* `callback` {Function} 请参阅 [`tls.connect()`][]。

与 [`tls.connect()`][] 相同，但不同之处在于 `port` 和 `host` 可以通过参数，而不是选项的方式提供。

*注意*：如果指定 port 或 host 选项，它将优于 port 或 host 参数。


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
  * `pfx` {string|string[]|Buffer|Buffer[]|Object[]} 可选的 PFX 或 PKCS12 编码的私钥和证书链。 相对于分别提供 `key` 和 `cert`，`pfx` 是一种替代方式。 PFX 通常是加密的，如果是的话，`passphrase` 将被用于对其进行解密。 可以提供多个 PFX，其提供方式可以是一个未加密的 PFX 缓冲区数组，或是以 `{buf: <string|buffer>[, passphrase: <string>]}` 格式提供的对象数组。 对象形式只能在数组中使用。 `object.passphrase` 是可选的。 如果提供了 `object.passphrase`，将使用它对加密的 PFX 进行解密，如未提供，则使用 `options.passphrase`。
  * `key` {string|string[]|Buffer|Buffer[]|Object[]} 可选的 PEM 格式私钥。 PEM 允许对私钥选项进行加密。 加密的密钥将通过 `options.passphrase` 进行解密。 使用不同算法的多个密钥可以通过未加密的密钥字符串数组或缓冲区来提供，也可以通过 `{pem: <string|buffer>[, passphrase: <string>]}` 格式的对象数组来提供。 对象形式只能在数组中使用。 `object.passphrase` 是可选的。 如果提供了 `object.passphrase`，将使用它对加密密钥进行解密，如未提供，则使用 `options.passphrase` 进行解密。
  * `passphrase` {string} 可选的共享密码，可用于单个私钥和/或 PFX。
  * `cert` {string|string[]|Buffer|Buffer[]} 可选的 PEM 格式证书链。 应对每个私钥提供一个证书链。 每个证书链应该包含针对已提供私 `钥` 的 PEM 格式的证书，按照次序，随后是 PEM 格式的中间证书 (如存在)，且不包含根 CA (根 CA 对于对等方必须是预知的，请参阅 `ca`) 。 当提供多个证书链时，其次序不必和 `key` 中私钥的次序一致。 如未提供中间证书，对等方就无法验证证书，握手过程就会失败。
  * `ca` {string|string[]|Buffer|Buffer[]} 可选的覆盖受信任 CA 的证书。 默认值为信任由 Mozilla 策展的知名 CA。 当使用此选项显式指定 CA 时，会彻底替换 Mozilla 的 CA。 该值可以是字符串或缓冲区，或者是字符串数组和/或缓冲区。 任何字符串或缓冲区都可以包含多个连接到一起的 PEM CA。 对等方证书必须可以链接到受服务器信任的CA，才能对连接进行身份验证。 当使用不能链接到知名 CA 的证书时，证书的 CA 必须被显式指定为受信任的，否则连接无法进行身份验证。 如果对等方使用一个不匹配，或和默认 CA 无法链接的证书，请使用 `ca` 选项来提供一个 CA 证书以便对等方证书可以匹配或链入。 对于自签名证书，证书就是自己的 CA，因此必须被提供。
  * `crl` {string|string[]|Buffer|Buffer[]} 可选的 PEM 格式的 CRLs (证书吊销列表)。
  * `ciphers` {string} 可选的密码套件规范，用来替换默认值。 请参阅 [更改默认密码套件](#tls_modifying_the_default_tls_cipher_suite) 以获取更多信息。
  * `honorCipherOrder` {boolean} 尝试使用服务器的，而不是客户端的密码套件偏好。 当值为 `true` 时，将 `SSL_OP_CIPHER_SERVER_PREFERENCE` 赋值给 `secureOptions`，请参阅 [OpenSSL Options](crypto.html#crypto_openssl_options) 以获取更多信息。
  * `ecdhCurve` {string} 描述一个已命名曲线，或者以冒号分隔的曲线 NID 或名称列表的字符串，例如：`P-521:P-384:P-256`，以便用于 ECDH 密钥协商，或者，当值为 `false` 时，禁用 ECDH。 设置为 `auto` 来自动选择曲线。 Use [`crypto.getCurves()`][] to obtain a list of available curve names. On recent releases, `openssl ecparam -list_curves` will also display the name and description of each available elliptic curve. **Default:** [`tls.DEFAULT_ECDH_CURVE`].
  * `dhparam` {string|Buffer} Diffie Hellman 参数，是 [完美前向安全](#tls_perfect_forward_secrecy) 的必选参数。 运行 `openssl dhparam` 来创建参数。 密钥长度必须大于或等于 1024 位，否则会抛出错误。 强烈建议使用 2048 位或更高位以提高安全性。 如果忽略或无效，参数将以静默方式被丢弃，DHE 密码将不可用。
  * `secureProtocol` {string} Optional SSL method to use, default is `'SSLv23_method'`. 可能的值被列入 [SSL_METHODS](https://www.openssl.org/docs/man1.0.2/ssl/ssl.html#DEALING-WITH-PROTOCOL-METHODS)，将函数名作为字符串。 For example, `'SSLv3_method'` to force SSL version 3.
  * `secureOptions` {number} 可选的能够影响 OpenSSL 协议行为的选项，通常是不需要的。 如果有的话，应小心使用！ 其值是 [OpenSSL Options](crypto.html#crypto_openssl_options) 中 `SSL_OP_*` 选项的数字位掩码。
  * `sessionIdContext` {string} 可选的服务器使用的不透明标识符，以确保会话状态不会在应用程序间共享。 未被客户端使用。

*注意*：

* [`tls.createServer()`][] 将 `honorCipherOrder` 选项的默认值设置为 `true`，其他创建安全上下文的 API 可不必理会。

* [`tls.createServer()`][] 使用从 `process.argv` 生成的 128 位截断的 SHA1 哈希值，并将其作为 `sessionIdContext` 选项的默认值，其他创建安全上下文的 API 没有默认值。

`tls.createSecureContext()` 方法创建一个安全凭据对象。

对于使用证书的密码，密钥是 *必须的*。 `key` 或 `pfx` 都可被用于该目的。

如果 'ca' 选项未被提供，Node.js 将会使用 <https://hg.mozilla.org/mozilla-central/raw-file/tip/security/nss/lib/ckfw/builtins/certdata.txt> 中给出的默认的公开受信任 CA 列表。


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
  * `handshakeTimeout` {number} 如果 SSL/TLS 握手过程没有在指定的毫秒数内完成，则终止连接。 如果握手过程超时，则会在 `tls.Server` 对象上发出 `'tlsClientError'`。 **Default:** `120000` (120 seconds).
  * `requestCert` {boolean} 如果值为 `true`，服务器会从发出连接的客户端请求一个证书，并尝试验证该证书。 **Default:** `false`.
  * `rejectUnauthorized` {boolean} 如果值不是 `false`，服务器将会拒绝任何未被已提供的 CA 列表所授权的连接。 只有当 `requestCert` 的值为 `true` 时，此选项才有效。 **Default:** `true`.
  * `NPNProtocols` {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} 字符串数组，含有支持的 NPN 协议的一个或多个 `Buffer` 或 `Uint8Array`。 `Buffer` 的格式应该是这样的：`[len][name][len][name]...`。例如：`0x05hello0x05world`，其中的首字节为下一个协议名的长度。 传入一个数组通常会更简单，例如：`['hello', 'world']`。 (协议应按其优先级进行排序。)
  * `ALPNProtocols`: {string[]|Buffer[]|Uint8Array[]|Buffer|Uint8Array} 字符串数组，含有支持的 ALPN 协议的一个或多个 `Buffer` 或 `Uint8Array`。 `Buffer` 的格式应该是这样的：`[len][name][len][name]...`，例如：`0x05hello0x05world`，其中首字节为下一个协议名的长度。 传入一个数组通常会更简单，例如：`['hello', 'world']`。 (协议应该按照它们的优先级进行排序。) 当服务器从客户端收到 NPN 和 ALPN 扩展时，ALPN 会优于 NPN，且服务器不会将 NPN 扩展发送到客户端。
  * `SNICallback(servername, cb)` {Function} 当客户端支持 SNI TLS 扩展时将被调用的函数。 当被调用时，将传递两个参数：`servername` 和 `cb`。 `SNICallback` 将会调用 `cb(null, ctx)`，其中 `ctx` 是 SecureContext 的实例。 (`tls.createSecureContext(...)` 可被用于获得正确的 SecureContext。) 如果未提供 `SNICallback`，含有高级 API 的默认回调函数将被使用 (如下所示)。
  * `sessionTimeout` {number} 指定由服务器创建的 TLS 会话标识符及 TLS 会话凭据超时秒数的一个整数值。 请参阅 [SSL_CTX_set_timeout](https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_timeout.html) 以获取更多信息。
  * `ticketKeys`: 一个 48 字节的 `Buffer` 实例，其中包含 16 个字节的前缀，16 个字节的 HMAC 密钥，以及 16 个字节的 AES 密钥。 它可被用于接受多个 TLS 服务器实例上的 TLS 会话凭据。
  * ...: 可以提供任何的 [`tls.createSecureContext()`][] 选项。 对于服务器，通常需要标识符选项 (`pfx` 或 `key`/`cert`)。
* `secureConnectionListener` {Function}

创建一个新的 [tls.Server](#tls_class_tls_server)。 如果提供了 `secureConnectionListener`，它会被自动设置为 [`'secureConnection'`][] 事件的监听器。

*注意*：`ticketKeys` 选项会自动在 `cluster` 模块的 worker 之间共享。

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

在 tls 服务器中用于 ECDH 密钥协议的默认曲线名称。 默认值为：`'prime256v1'` (NIST P-256)。 请参阅 [RFC 4492](https://www.rfc-editor.org/rfc/rfc4492.txt) 和 [FIPS.186-4](http://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf) 以获取详细信息。


## 已弃用的 API

### 类：CryptoStream
<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

> 稳定性：0 - 已弃用：改为使用 [`tls.TLSSocket`][]。

`tls.CryptoStream` 类表示加密数据流。 此类已被弃用因此不应再被使用。

#### cryptoStream.bytesWritten
<!-- YAML
added: v0.3.4
deprecated: v0.11.3
-->

`cryptoStream.bytesWritten` 属性返回写入到底层套接字中的总计字节数，其中 *包含* 实现 TLS 协议所必须的字节。

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

一旦建立了安全连接，`SecurePair` 对象就会发出 `'secure'` 事件。

和检查服务器 [`secureConnection`](#tls_event_secureconnection) 事件一样，应当检查 `pair.cleartext.authorized` 以确定被使用的证书是否被正确的授权。

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

* `context` {Object} 由 `tls.createSecureContext()` 返回的安全上下文对象。
* `isServer` {boolean} `true` 指定 TLS 连接是否以服务器方式打开。
* `requestCert` {boolean} `true` 指定服务器是否应该请求连接客户端的证书。 只适用于当 `isServer` 的值为 `true`时。
* `rejectUnauthorized` {boolean} 如果值不是 `false`，服务器会自动拒绝具有无效证书的客户端。 只适用于当 `isServer` 的值为 `true`时。
* `options`
  * `secureContext`：来自 [`tls.createSecureContext()`][] 的可选的 TLS 上下文对象。
  * `isServer`：如果值为 `true`，则 TLS 套接字将被以服务器模式初始化。 **默认:** `false`.
  * `server` {net.Server} 可选的 [`net.Server`][] 实例
  * `requestCert`：可选的，请参阅 [`tls.createServer()`][]
  * `rejectUnauthorized`：可选的，请参阅 [`tls.createServer()`][]
  * `NPNProtocols`：可选，请参阅 [`tls.createServer()`][]
  * `ALPNProtocols`：可选，请参阅 [`tls.createServer()`][]
  * `SNICallback`: 可选，请参阅 [`tls.createServer()`][]
  * `session` {Buffer} 包含 TLS 会话的可选 `Buffer` 实例。
  * `requestOCSP` {boolean} 如果值为 `true`，指定 OCSP 状态请求扩展将被添加到客户端 hello 消息中，且在建立安全通信之前发出 `'OCSPResponse'` 事件。

创建具有两个流的新安全对对象，其中一个读取和写入加密数据，另一个读取和写入明文数据。 通常，加密流和传入的加密数据流通过管道传输，而明文流则用于替换初始加密流。

`tls.createSecurePair()` 返回含有 `cleartext` 和 `encrypted` 流属性的 `tls.SecurePair` 对象。

*注意*：`cleartext` 具有和 [`tls.TLSSocket`][] 相同的API。

*注意*：`tls.createSecurePair()` 方法现已被弃用，推荐使用 `tls.TLSSocket()`。 例如，代码：

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
