# HTTPS

<!--introduced_in=v0.10.0-->

> Σταθερότητα: 2 - Σταθερό

HTTPS είναι το πρωτόκολλο HTTP μέσω TLS/SSL. Στη Node.js υλοποιείται σαν μια ξεχωριστή ενότητα.

## Class: https.Agent
<!-- YAML
added: v0.4.5
-->

An Agent object for HTTPS similar to [`http.Agent`][]. See [`https.request()`][] for more information.

## Class: https.Server
<!-- YAML
added: v0.3.4
-->

Η κλάση είναι μια subclass του `tls.Server` και μεταδίδει συμβάντα παρόμοια με το [`http.Server`][]. Για περισσότερες πληροφορίες, δείτε το [`http.Server`][].

### server.close([callback])
<!-- YAML
added: v0.1.90
-->
- `callback` {Function}

Για πληροφορίες, δείτε το [`server.close()`][`http.close()`] από την ενότητα HTTP.

### server.listen()

Εκκινεί τον εξυπηρετητή HTTPS για ακρόαση κρυπτογραφημένων συνδέσεων. Η μέθοδος είναι πανομοιότυπη με το [`server.listen()`][] από το [`net.Server`][].

### server.headersTimeout

- {number} **Προεπιλογή:** `40000`

See [`http.Server#headersTimeout`][].

### server.setTimeout(\[msecs\]\[, callback\])
<!-- YAML
added: v0.11.2
-->
- `msecs` {number} **Προεπιλογή:** `120000` (2 λεπτά)
- `callback` {Function}

Δείτε το [`http.Server#setTimeout()`][].

### server.timeout
<!-- YAML
added: v0.11.2
-->
- {number} **Προεπιλογή:** `120000` (2 λεπτά)

Δείτε το [`http.Server#timeout`][].

### server.keepAliveTimeout
<!-- YAML
added: v8.0.0
-->
- {number} **Προεπιλογή:** `5000` (5 δευτερόλεπτα)

Δείτε το [`http.Server#keepAliveTimeout`][].

## https.createServer(\[options\]\[, requestListener\])
<!-- YAML
added: v0.3.4
-->
- `options` {Object} Δέχεται `options` από το [`tls.createServer()`][], το [`tls.createSecureContext()`][] και τo [`http.createServer()`][].
- `requestListener` {Function} A listener to be added to the `request` event.

Παράδειγμα:

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

Ή

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
- `options` {Object | string | URL} Δέχεται τα ίδια `options` με το [`https.request()`][], με το `method` να είναι πάντα ορισμένο ως `GET`.
- `callback` {Function}

Όπως το [`http.get()`][] αλλά για συνδέσεις HTTPS.

Το `options` μπορεί να είναι ένα αντικείμενο, ένα string ή ένα αντικείμενο [`URL`][]. Αν το `options` είναι string, θα αναλυθεί αυτόματα με το [`url.parse()`][]. Αν είναι ένα αντικείμενο [`URL`][], θα μετατραπεί αυτόματα σε ένα κοινό αντικείμενο `options`.

Παράδειγμα:

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

Καθολικό στιγμιότυπο του [`https.Agent`][] για όλα τα αιτήματα HTTPS των πελατών.

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
  - `port` **Προεπιλογή:** `443`
  - `agent` **Προεπιλογή:** `https.globalAgent`
- `callback` {Function}


Αποστέλλει ένα αίτημα σε έναν ασφαλή εξυπηρετητή ιστού.

The following additional `options` from [`tls.connect()`][] are also accepted when using a custom [`Agent`][]: `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`, `secureProtocol`, `servername`

Το `options` μπορεί να είναι ένα αντικείμενο, ένα string ή ένα αντικείμενο [`URL`][]. Αν το `options` είναι string, θα αναλυθεί αυτόματα με το [`url.parse()`][]. Αν είναι ένα αντικείμενο [`URL`][], θα μετατραπεί αυτόματα σε ένα κοινό αντικείμενο `options`.

Παράδειγμα:

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
Παράδειγμα με χρήση επιλογών από το [`tls.connect()`][]:

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

Παράδειγμα:

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

Παράδειγμα χρήσης ενός [`URL`][] ως `options`:

```js
const { URL } = require('url');

const options = new URL('https://abc:xyz@example.com');

const req = https.request(options, (res) => {
  // ...
});
```
