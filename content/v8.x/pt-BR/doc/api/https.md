# HTTPS

<!--introduced_in=v0.10.0-->

> Estabilidade: 2 - estável

HTTPS é o protocolo HTTP sobre SSL/TLS. In Node.js this is implemented as a separate module.

## Classe: https.Agent

<!-- YAML
added: v0.4.5
-->

An Agent object for HTTPS similar to [`http.Agent`][]. See [`https.request()`][] for more information.

## Class: https.Server

<!-- YAML
added: v0.3.4
-->

This class is a subclass of `tls.Server` and emits events same as [`http.Server`][]. Consulte [`http.Server`][] para obter mais informações.

### server.close ([callback])

<!-- YAML
added: v0.1.90
-->

- `callback` {Function}

Consulte [`server.close()`] [`http.close()`] do módulo HTTP para obter detalhes.

### server.listen()

Inicia o servidor HTTPS escutando para conexões criptografadas. Esse método é idêntico ao [`server.listen()`] [] do [`net. Server`] [].

### server.headersTimeout

- {number} **Padrão:** `40000`

See [`http.Server#headersTimeout`][].

### server.setTimeout(\[msecs\]\[, callback\])

<!-- YAML
added: v0.11.2
-->

- `Ms` {number} **Padrão:** `120000` (2 minutos)
- `callback` {Function}

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

- `options` {Object} Accepts `options` from [`tls.createServer()`][], [`tls.createSecureContext()`][] and [`http.createServer()`][].
- `requestListener` {Function} A listener to be added to the `request` event.

Exemplo:

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

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

- `options` {Object | string | URL} Accepts the same `options` as [`https.request()`][], with the `method` always set to `GET`.
- `callback` {Function}

Como [`http.get()`][] mas para o HTTPS.

`opções` pode ser um objeto, uma string, ou um objeto [`URL`][]. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

Exemplo:

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

<!-- YAML
added: v0.3.6
changes:

  - version: v7.5.0
    pr-url: https://github.com/nodejs/node/pull/10638
    description: The `options` parameter can be a WHATWG `URL` object.
-->

- `opções` {Object | string | URL} Accepts all `options` from [`http.request()`][], with some differences in default values: 
  - `protocol` **Default:** `https:`
  - `porta` **Padrão:** `443`
  - `agente` **Padrão:** `https.globalAgent`
- `callback` {Function}

Faz uma requesição para um web server seguro.

The following additional `options` from [`tls.connect()`][] are also accepted when using a custom [`Agent`][]: `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, `servername`

`options` pode ser um objeto, uma string, ou um objeto [`URL`][]. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

Exemplo:

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

Alternatively, opt out of connection pooling by not using an `Agent`.

Exemplo:

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
const { URL } = require('url');

const options = new URL('https://abc:xyz@example.com');

const req = https.request(options, (res) => {
  // ...
});
```