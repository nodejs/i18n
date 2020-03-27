# HTTPS

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Stable

HTTPS es el protocolo de HTTP sobre TLS/SSL. In Node.js this is implemented as a separate module.

## Clase: https.Agent

<!-- YAML
added: v0.4.5
-->

Un objeto Agente para HTTPS similar a [`http.Agent`][]. See [`https.request()`][] for more information.

## Clase: https.Server

<!-- YAML
added: v0.3.4
-->

This class is a subclass of `tls.Server` and emits events same as [`http.Server`][]. Vea [`http.Server`][] para más información.

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

- `callback` {Function}

Vea [`server.close()`][`http.close()`] desde el módulo HTTP para detalles.

### server.listen()

Inicia el servidor HTTPS escuchando por conexiones encriptadas. Este método es idéntico a [`server.listen()`][] de [`net.Server`][].

### server.headersTimeout

- {number} **Predeterminado:** `40000`

See [`http.Server#headersTimeout`][].

### server.setTimeout(\[msecs\]\[, callback\])

<!-- YAML
added: v0.11.2
-->

- `msecs` {number} **Predeterminado:** `120000` (2 minutos)
- `callback` {Function}

Vea [`http.Server#setTimeout()`][].

### server.timeout

<!-- YAML
added: v0.11.2
-->

- {number} **Predeterminado:** `120000` (2 minutos)

Vea [`http.Server#timeout`][].

### server.keepAliveTimeout

<!-- YAML
added: v8.0.0
-->

- {number} **Predeterminado:** `5000` (5 segundos)

Vea [`http.Server#keepAliveTimeout`][].

## https.createServer(\[options\]\[, requestListener\])

<!-- YAML
added: v0.3.4
-->

- `options` {Object} Accepts `options` from [`tls.createServer()`][], [`tls.createSecureContext()`][] and [`http.createServer()`][].
- `requestListener` {Function} Un listener a ser añadido al evento `request` .

Ejemplo:

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

O

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

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

- `options` {Object | string | URL} Accepts the same `options` as [`https.request()`][], with the `method` always set to `GET`.
- `callback` {Function}

Como [`http.get()`][], pero para HTTPS.

`options` puede ser un objeto, una string o un objeto [`URL`][]. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

Ejemplo:

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

Instancia global de [`https.Agent`][] para todas las solicitudes de cliente HTTPS.

## https.request(options[, callback])

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

- `options` {Object | string | URL} Accepts all `options` from [`http.request()`][], with some differences in default values: 
  - `protocol` **Default:** `https:`
  - `port` **Predeterminado:** `443`
  - `agent` **Predeterminado:** `https.globalAgent`
- `callback` {Function}

Hace una solicitud a un servidor web seguro.

The following additional `options` from [`tls.connect()`][] are also accepted when using a custom [`Agent`][]: `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, `servername`

`options` puede ser un objeto, una string o un objeto [`URL`][]. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

Ejemplo:

```js
const https = require('https');

const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET'
};

const req = https.request(options, (res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (e) => {
  console.error(e);
});
req.end();
```

Ejemplo utilizando opciones como [`tls.connect()`][]:

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

Alternatively, opt out of connection pooling by not using an `Agent`.

Ejemplo:

```js
const options = {
  hostname: 'encrypted.google.com',
  port: 443,
  path: '/',
  method: 'GET',
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem'),
  agent: false
};

const req = https.request(options, (res) => {
  // ...
});
```

Ejemplo utilizando un [`URL`][] como `options`:

```js
const { URL } = require('url');

const options = new URL('https://abc:xyz@example.com');

const req = https.request(options, (res) => {
  // ...
});
```