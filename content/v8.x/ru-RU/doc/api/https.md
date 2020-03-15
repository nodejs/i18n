# HTTPS

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

HTTPS является протоколом HTTP через TLS/SSL. В Node.js это реализовано в качестве отдельного модуля.

## Класс: https.Agent
<!-- YAML
added: v0.4.5
-->

Объект Agent для HTTPS похож на [`http.Agent`][]. Для более подробной информации смотрите [`https.request()`][].

## Класс: https.Server
<!-- YAML
added: v0.3.4
-->

Этот класс является подклассом `tls.Server` и генерирует события, так же как и [`http.Server`][]. Для более подробной информации смотрите [`http.Server`][].

### server.close([callback])
<!-- YAML
added: v0.1.90
-->
- `callback` {Function}

См. информацию [`server.close()`][`http.close()`] из модуля HTTP.

### server.listen()

При помощи этого метода HTTPS-сервер запускается и прослушивает зашифрованные подключения. Этот метод идентичен [`server.listen()`][] от [`net.Server`][].

### server.headersTimeout

- {number} **Default:** `40000`

See [`http.Server#headersTimeout`][].

### server.setTimeout(\[msecs\]\[, callback\])
<!-- YAML
added: v0.11.2
-->
- `msecs` {number} **Default:** `120000` (2 minutes)
- `callback` {Function}

Смотрите [`http.Server#setTimeout()`][].

### server.timeout
<!-- YAML
added: v0.11.2
-->
- {number} **Default:** `120000` (2 minutes)

Смотрите [`http.Server#timeout`][].

### server.keepAliveTimeout
<!-- YAML
added: v8.0.0
-->
- {number} **Default:** `5000` (5 seconds)

See [`http.Server#keepAliveTimeout`][].

## https.createServer(\[options\]\[, requestListener\])
<!-- YAML
added: v0.3.4
-->
- `options` {Object} Accepts `options` from [`tls.createServer()`][], [`tls.createSecureContext()`][] and [`http.createServer()`][].
- `requestListener` {Function} Слушатель для добавления к событию `request`.

Пример:

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

Или

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
- `options` {Object | string | URL} Принимает те же `options`, что и [`https.request()`][], с параметром `method`, всегда установленным на `GET`.
- `callback` {Function}

Как и [`http.get()`][], но для HTTPS.

`options` can be an object, a string, or a [`URL`][] object. Если в качестве значения `options` выступает строка, то этот аргумент автоматически подвергается парсингу при помощи [`url.parse()`][]. Если это объект [`URL`][], то он будет автоматически преобразован в обычный объект `options`.

Пример:

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

Глобальный экземпляр [`https.Agent`][] для всех запросов клиента, выполняемых по протоколу HTTPS.

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
  - `port` **Default:** `443`
  - `agent` **Default:** `https.globalAgent`
- `callback` {Function}


Выполняет запрос на защищенный веб-сервер.

Следующие дополнительные `options` из [`tls.connect()`][] также принимаются при использовании пользовательского [`Agent`][]: `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, `servername`

`options` can be an object, a string, or a [`URL`][] object. Если в качестве значения `options` выступает строка, то этот аргумент автоматически подвергается парсингу при помощи [`url.parse()`][]. Если это объект [`URL`][], то он будет автоматически преобразован в обычный объект `options`.

Пример:

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
Пример использования параметров из [`tls.connect()`][]:

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

Также можно отказаться от пула подключений без использования `Agent`.

Пример:

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

Example using a [`URL`][] as `options`:

```js
const { URL } = require('url');

const options = new URL('https://abc:xyz@example.com');

const req = https.request(options, (res) => {
  // ...
});
```
