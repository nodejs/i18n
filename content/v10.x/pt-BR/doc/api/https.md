# HTTPS

<!--introduced_in=v0.10.0-->

> Estabilidade: 2 - estável

HTTPS é o protocolo HTTP sobre SSL/TLS. No node.js, isso é implementado como um módulo separado.

## Classe: https.Agent
<!-- YAML
added: v0.4.5
-->

An [`Agent`][] object for HTTPS similar to [`http.Agent`][]. See [`https.request()`][] for more information.

## Class: https.Server
<!-- YAML
added: v0.3.4
-->

Essa classe é uma subclasse de `tls. Server` e emite os eventos igual ao [`http. Server`] []. Consulte [`http.Server`][] para obter mais informações.

### server.close ([callback])
<!-- YAML
added: v0.1.90
-->
* `callback` {Function}
* Returns: {https.Server}

Consulte [`server.close()`] [`http.close()`] do módulo HTTP para obter detalhes.

### server.listen()

Inicia o servidor HTTPS escutando para conexões criptografadas. Esse método é idêntico ao [`server.listen()`] [] do [`net. Server`] [].


### server.maxHeadersCount

- {number} **Padrão:** `2000`

See [`http.Server#maxHeadersCount`][].

### server.headersTimeout

- {number} **Padrão:** `40000`

See [`http.Server#headersTimeout`][].

### server.setTimeout (\[msecs\]\[, callback\])
<!-- YAML
added: v0.11.2
-->
* `Ms` {number} **Padrão:** `120000` (2 minutos)
* `callback` {Function}
* Returns: {https.Server}

Consulte [`http.Server#setTimeout()`][].

### server.timeout
<!-- YAML
added: v0.11.2
-->
- {number} **Padrão:** `120000` (2 minutos)

Consulte [`http.Server#maxHeadersCount`][].

### server.keepAliveTimeout
<!-- YAML
added: v8.0.0
-->
- {number} **Padrão:** `5000` (5 segundos)

Consulte [`http.Server#keepAliveTimeout`][].

## https.createServer(\[options\]\[, requestListener\])
<!-- YAML
added: v0.3.4
-->
* `Opções de` {Object} aceita `Opções` de [`tls.createServer()`] [], [`tls.createSecureContext()`] [] e [`http.createServer()`] [].
* `requestListener` {Function} A listener to be added to the `'request'` event.
* Returns: {https.Server}

```js
// curl -k https://localhost:8000/
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);
```

Ou

```js
const https = require('https');
const fs = require('fs');

const options = {
  pfx: fs.readFileSync('test/fixtures/test_cert.pfx'),
  passphrase: 'sample'
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);
```

## https.get(options[, callback])
## https.get(url\[, options\]\[, callback\])
<!-- YAML
added: v0.3.6
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->
* `url` {string | URL}
* `opções` {Object | string | URL} aceita as mesmas `Opções` que [] [`https.request()`], com o `método` sempre definido para `GET`.
* `callback` {Function}

Como [`http.get()`][] mas para o HTTPS.

`opções` pode ser um objeto, uma string, ou um objeto [`URL`][]. Se `options` é uma string, é automaticamente parseada com [`url.parse()`][]. Se é um objeto [`URL`][], vai ser automaticamente convertido para um objeto comum `options`.

```js
const https = require('https');

https.get('https://encrypted.google.com/', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });

}).on('error', (e) => {
  console.error(e);
});
```

## https.globalAgent
<!-- YAML
added: v0.5.9
-->

Instância global de [`https.Agent`][] para todas as requisições HTTPS clientes.

## https.request(options[, callback])
## https.request(url\[, options\]\[, callback\])
<!-- YAML
added: v0.3.6
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21616
    description: The `url` parameter can now be passed along with a separate
                 `options` object.
  - version: v9.3.0
    pr-url: https://github.com/nodejs/node/pull/14903
    description: The `options` parameter can now include `clientCertEngine`.
  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->
* `url` {string | URL}
* `options` {Object | string | URL} Accepts all `options` from [`http.request()`][], with some differences in default values:
  - `protocol` **Default:** `'https:'`
  - `porta` **Padrão:** `443`
  - `agente` **Padrão:** `https.globalAgent`
* `callback` {Function}

Faz uma requesição para um web server seguro.

The following additional `options` from [`tls.connect()`][] are also accepted: `ca`, `cert`, `ciphers`, `clientCertEngine`, `crl`, `dhparam`, `ecdhCurve`, `honorCipherOrder`, `key`, `passphrase`, `pfx`, `rejectUnauthorized`, `secureOptions`, `secureProtocol`, `servername`, `sessionIdContext`.

`opções` pode ser um objeto, uma string, ou um objeto [`URL`][]. Se `options` é uma string, é automaticamente parseada com [`url.parse()`][]. Se é um objeto [`URL`][], vai ser automaticamente convertido para um objeto comum `options`.

```js
const https = require('https');

https.get('https://encrypted.google.com/', (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });

}).on('error', (e) => {
  console.error(e);
});
```
Exemplo usando opções do [`tls.connect()`] []:

```js
const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET',
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};
options.agent = new https.Agent(options);

const req = https.request(options, (res) => {
  // ...
});
```

Alternatively, opt out of connection pooling by not using an [`Agent`][].

```js
const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET',
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};
options.agent = new https.Agent(options);

const req = https.request(options, (res) => {
  // ...
});
```

Exemplo usando uma [`URL`] [] como `options`:

```js
const options = new URL('https://abc:xyz@example.com');

const req = https.request(options, (res) => {
  // ...
});
```

Example pinning on certificate fingerprint, or the public key (similar to `pin-sha256`):

```js
const tls = require('tls');
const https = require('https');
const crypto = require('crypto');

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('base64');
}
const options = {
  hostname: 'github.com',
  port: 443,
  path: '/',
  method: 'GET',
  checkServerIdentity: function(host, cert) {
    // Make sure the certificate is issued to the host we are connected to
    const err = tls.checkServerIdentity(host, cert);
    if (err) {
      return err;
    }

    // Pin the public key, similar to HPKP pin-sha25 pinning
    const pubkey256 = 'pL1+qb9HTMRZJmuC/bB/ZI9d302BYrrqiVuRyW+DGrU=';
    if (sha256(cert.pubkey) !== pubkey256) {
      const msg = 'Certificate verification error: ' +
        `The public key of '${cert.subject.CN}' ` +
        'does not match our pinned fingerprint';
      return new Error(msg);
    }

    // Pin the exact certificate, rather then the pub key
    const cert256 = '25:FE:39:32:D9:63:8C:8A:FC:A1:9A:29:87:' +
      'D8:3E:4C:1D:98:DB:71:E4:1A:48:03:98:EA:22:6A:BD:8B:93:16';
    if (cert.fingerprint256 !== cert256) {
      const msg = 'Certificate verification error: ' +
        `The certificate of '${cert.subject.CN}' ` +
        'does not match our pinned fingerprint';
      return new Error(msg);
    }

    // This loop is informational only.
    // Print the certificate and public key fingerprints of all certs in the
    // chain. Its common to pin the public key of the issuer on the public
    // internet, while pinning the public key of the service in sensitive
    // environments.
    do {
      console.log('Subject Common Name:', cert.subject.CN);
      console.log('  Certificate SHA256 fingerprint:', cert.fingerprint256);

      hash = crypto.createHash('sha256');
      console.log('  Public key ping-sha256:', sha256(cert.pubkey));

      lastprint256 = cert.fingerprint256;
      cert = cert.issuerCertificate;
    } while (cert.fingerprint256 !== lastprint256);

  },
};

options.agent = new https.Agent(options);
const req = https.request(options, (res) => {
  console.log('All OK. Server matched our pinned cert or public key');
  console.log('statusCode:', res.statusCode);
  // Print the HPKP values
  console.log('headers:', res.headers['public-key-pins']);

  res.on('data', (d) => {});
});

req.on('error', (e) => {
  console.error(e.message);
});
req.end();
```

Outputs for example:

```text
Subject Common Name: github.com
  Certificate SHA256 fingerprint: 25:FE:39:32:D9:63:8C:8A:FC:A1:9A:29:87:D8:3E:4C:1D:98:DB:71:E4:1A:48:03:98:EA:22:6A:BD:8B:93:16
  Public key ping-sha256: pL1+qb9HTMRZJmuC/bB/ZI9d302BYrrqiVuRyW+DGrU=
Subject Common Name: DigiCert SHA2 Extended Validation Server CA
  Certificate SHA256 fingerprint: 40:3E:06:2A:26:53:05:91:13:28:5B:AF:80:A0:D4:AE:42:2C:84:8C:9F:78:FA:D0:1F:C9:4B:C5:B8:7F:EF:1A
  Public key ping-sha256: RRM1dGqnDFsCJXBTHky16vi1obOlCgFFn/yOhI/y+ho=
Subject Common Name: DigiCert High Assurance EV Root CA
  Certificate SHA256 fingerprint: 74:31:E5:F4:C3:C1:CE:46:90:77:4F:0B:61:E0:54:40:88:3B:A9:A0:1E:D0:0B:A6:AB:D7:80:6E:D3:B1:18:CF
  Public key ping-sha256: WoiWRyIOVNa9ihaBciRSC7XHjliYS9VwUGOIud4PB18=
All OK. Server matched our pinned cert or public key
statusCode: 200
headers: max-age=0; pin-sha256="WoiWRyIOVNa9ihaBciRSC7XHjliYS9VwUGOIud4PB18="; pin-sha256="RRM1dGqnDFsCJXBTHky16vi1obOlCgFFn/yOhI/y+ho="; pin-sha256="k2v657xBsOVe1PQRwOsHsw3bsGT2VzIqz5K+59sNQws="; pin-sha256="K87oWBWM9UZfyddvDfoxL+8lpNyoUB2ptGtn0fv6G2Q="; pin-sha256="IQBnNBEiFuhj+8x6X8XLgh01V9Ic5/V3IRQLNFFc7v4="; pin-sha256="iie1VXtL7HzAMF+/PVPR9xzT80kQxdZeJ+zduCB3uj0="; pin-sha256="LvRiGEjRqfzurezaWuj8Wie2gyHMrW5Q06LspMnox7A="; includeSubDomains
```
