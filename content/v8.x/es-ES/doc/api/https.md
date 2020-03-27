# HTTPS

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

HTTPS es el protocolo de HTTP sobre TLS/SSL. En Node.js, esto se implementa como un módulo separado.

## Clase: https.Agent
<!-- YAML
added: v0.4.5
-->

Un objeto Agente para HTTPS similar a [`http.Agent`][]. Vea [`https.request()`][] para más información.

## Clase: https.Server
<!-- YAML
added: v0.3.4
-->

Esta clase es una subclase de `tls.Server` y emite eventos iguales a [`http.Server`][]. Vea [`http.Server`][] para más información.

### server.close([callback])
<!-- YAML
added: v0.1.90
-->
- `callback` {Function}

Vea [`server.close()`][`http.close()`] desde el módulo HTTP para detalles.

### server.listen()

Inicia el servidor HTTPS escuchando conexiones encriptadas. Este método es idéntico a [`server.listen()`][] de [`net.Server`][].

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
- `options` {Object} Acepta `options` de [`tls.createServer()`][], [`tls.createSecureContext()`][] y [`http.createServer()`][].
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
- `options` {Object | string | URL} Acepta las mismas `options` como [`https.request()`][], con el `method` siempre establecido a `GET`.
- `callback` {Function}

Como [`http.get()`][], pero para HTTPS.

`options` puede ser un objeto, una string o un objeto [`URL`][]. Si `options` es una string, es analizado automáticamente con [`url.parse()`][]. Si es un objeto [`URL`][], será convertido automáticamente a un objeto `options` ordinario.

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

Las siguientes `options` adicionales de [`tls.connect()`][] también son aceptadas cuando se utiliza un [`Agent`][] personalizado: `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, `servername`

`options` puede ser un objeto, una string o un objeto [`URL`][]. Si `options` es una string, es analizado automáticamente con [`url.parse()`][]. Si es un objeto [`URL`][], será convertido automáticamente a un objeto `options` ordinario.

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
