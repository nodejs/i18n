# HTTPS

<!--introduced_in=v0.10.0-->

> Σταθερότητα: 2 - Σταθερό

HTTPS είναι το πρωτόκολλο HTTP μέσω TLS/SSL. In Node.js this is implemented as a separate module.

## Class: https.Agent

<!-- YAML
added: v0.4.5
-->

Ένα αντικείμενο [`Agent`][] για HTTPS, παρόμοιο με το [`http.Agent`][]. See [`https.request()`][] for more information.

## Class: https.Server

<!-- YAML
added: v0.3.4
-->

This class is a subclass of `tls.Server` and emits events same as [`http.Server`][]. Για περισσότερες πληροφορίες, δείτε το [`http.Server`][].

### server.close([callback])

<!-- YAML
added: v0.1.90
-->

* `callback` {Function}
* Returns: {https.Server}

Για πληροφορίες, δείτε το [`server.close()`][`http.close()`] από την ενότητα HTTP.

### server.listen()

Εκκινεί τον εξυπηρετητή HTTPS για ακρόαση κρυπτογραφημένων συνδέσεων. Η μέθοδος είναι πανομοιότυπη με το [`server.listen()`][] από το [`net.Server`][].

### server.maxHeadersCount

* {number} **Προεπιλογή:** `2000`

Δείτε το [`http.Server#maxHeadersCount`][].

### server.headersTimeout

* {number} **Προεπιλογή:** `40000`

See [`http.Server#headersTimeout`][].

### server.setTimeout(\[msecs\]\[, callback\])

<!-- YAML
added: v0.11.2
-->

* `msecs` {number} **Προεπιλογή:** `120000` (2 λεπτά)
* `callback` {Function}
* Returns: {https.Server}

Δείτε το [`http.Server#setTimeout()`][].

### server.timeout

<!-- YAML
added: v0.11.2
-->

* {number} **Προεπιλογή:** `120000` (2 λεπτά)

Δείτε το [`http.Server#timeout`][].

### server.keepAliveTimeout

<!-- YAML
added: v8.0.0
-->

* {number} **Προεπιλογή:** `5000` (5 δευτερόλεπτα)

Δείτε το [`http.Server#keepAliveTimeout`][].

## https.createServer(\[options\]\[, requestListener\])

<!-- YAML
added: v0.3.4
-->

* `options` {Object} Accepts `options` from [`tls.createServer()`][], [`tls.createSecureContext()`][] and [`http.createServer()`][].
* `requestListener` {Function} Ένας ακροατής που θα προστεθεί στο συμβάν `'request'`.
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
* `options` {Object | string | URL} Accepts the same `options` as [`https.request()`][], with the `method` always set to `GET`.
* `callback` {Function}

Όπως το [`http.get()`][] αλλά για συνδέσεις HTTPS.

Το `options` μπορεί να είναι ένα αντικείμενο, ένα string ή ένα αντικείμενο [`URL`][]. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

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
  * `protocol` **Προεπιλογή:** `'https:'`
  * `port` **Προεπιλογή:** `443`
  * `agent` **Προεπιλογή:** `https.globalAgent`
* `callback` {Function}

Αποστέλλει ένα αίτημα σε έναν ασφαλή εξυπηρετητή ιστού.

The following additional `options` from [`tls.connect()`][] are also accepted: `ca`, `cert`, `ciphers`, `clientCertEngine`, `crl`, `dhparam`, `ecdhCurve`, `honorCipherOrder`, `key`, `passphrase`, `pfx`, `rejectUnauthorized`, `secureOptions`, `secureProtocol`, `servername`, `sessionIdContext`.

Το `options` μπορεί να είναι ένα αντικείμενο, ένα string ή ένα αντικείμενο [`URL`][]. If `options` is a string, it is automatically parsed with [`url.parse()`][]. If it is a [`URL`][] object, it will be automatically converted to an ordinary `options` object.

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

Εναλλακτικά, μπορείτε να αρνηθείτε τη συγκέντρωση συνδέσεων, χωρίς να χρησιμοποιήσετε έναν [`Agent`][].

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
    // Σιγουρέψου ότι το πιστοποιητικό έχει εκδοθεί στον υπολογιστή που έχουμε συνδεθεί
    const err = tls.checkServerIdentity(host, cert);
    if (err) {
      return err;
    }

    // Να γίνει pin του δημόσιου κλειδιού, παρομοίως με το pinning HPKP pin-sha25
    const pubkey256 = 'pL1+qb9HTMRZJmuC/bB/ZI9d302BYrrqiVuRyW+DGrU=';
    if (sha256(cert.pubkey) !== pubkey256) {
      const msg = 'Certificate verification error: ' +
        `The public key of '${cert.subject.CN}' ` +
        'does not match our pinned fingerprint';
      return new Error(msg);
    }

    // Να γίνει pin του συγκεκριμένου πιστοποιητικού, και όχι του δημόσιου κλειδιού
    const cert256 = '25:FE:39:32:D9:63:8C:8A:FC:A1:9A:29:87:' +
      'D8:3E:4C:1D:98:DB:71:E4:1A:48:03:98:EA:22:6A:BD:8B:93:16';
    if (cert.fingerprint256 !== cert256) {
      const msg = 'Certificate verification error: ' +
        `The certificate of '${cert.subject.CN}' ` +
        'does not match our pinned fingerprint';
      return new Error(msg);
    }

    // Αυτός ο βρόγχος είναι απλά ενημερωτικός.
    // Εμφάνιση του αποτυπώματος του πιστοποιητικού και του 
    // δημόσιου κλειδιού όλων των πιστοποιητικών στην αλυσίδα. 
    // Είναι συνηθισμένο να γίνεται pinning του δημόσιου κλειδιού του
    // εκδότη στο ίντερνετ, ενώ να γίνεται pinning του δημόσιου κλειδιού
    // της υπηρεσίας σε ευαίσθητες εφαρμογές.
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
  // Εκτύπωση των τιμών HPKP
  console.log('headers:', res.headers['public-key-pins']);

  res.on('data', (d) => {});
});

req.on('error', (e) => {
  console.error(e.message);
});
req.end();
```

Ο παραπάνω κώδικας, μπορεί να εμφανίσει για παράδειγμα:

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