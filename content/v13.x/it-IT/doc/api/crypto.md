# Crypto

<!--introduced_in=v0.3.6-->

> Stabilità: 2 - Stable

The `crypto` module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.

Utilizza `require('crypto')` per accedere a questo modulo.

```js
const crypto = require('crypto');

const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
console.log(hash);
// Stampa:
//   c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e
```

## Determinare se il supporto crittografico non è disponibile

È possibile creare Node.js senza includere il supporto per il modulo `crypto`. In questi casi, la chiamata di `require('crypto')` genererà un errore.

```js
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('crypto support is disabled!');
}
```

## Class: `Certificate`
<!-- YAML
added: v0.11.8
-->

SPKAC is a Certificate Signing Request mechanism originally implemented by Netscape and was specified formally as part of [HTML5's `keygen` element][].

`<keygen>` is deprecated since [HTML 5.2](https://www.w3.org/TR/html52/changes.html#features-removed) and new projects should not use this element anymore.

Il modulo `crypto` fornisce la classe `Certificate` per lavorare con i dati SPKAC. L'utilizzo più comune è la gestione dell'output generato dall'elemento HTML5 `<keygen>`. Node.js utilizza [l'implementazione SPKAC di OpenSSL](https://www.openssl.org/docs/man1.1.0/apps/openssl-spkac.html) internamente.

### `Certificate.exportChallenge(spkac)`
<!-- YAML
added: v9.0.0
-->

* `spkac` {string | Buffer | TypedArray | DataView}
* Returns: {Buffer} The challenge component of the `spkac` data structure, which includes a public key and a challenge.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const challenge = Certificate.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Stampa: la challenge come una stringa UTF8
```

### `Certificate.exportPublicKey(spkac[, encoding])`
<!-- YAML
added: v9.0.0
-->

* `spkac` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `spkac` string.
* Returns: {Buffer} The public key component of the `spkac` data structure, which includes a public key and a challenge.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const publicKey = Certificate.exportPublicKey(spkac);
console.log(publicKey);
// Stampa: la public key come un <Buffer ...>
```

### `Certificate.verifySpkac(spkac)`
<!-- YAML
added: v9.0.0
-->

* `spkac` {Buffer | TypedArray | DataView}
* Returns: {boolean} `true` if the given `spkac` data structure is valid, `false` otherwise.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
console.log(Certificate.verifySpkac(Buffer.from(spkac)));
// Stampa: true oppure false
```

### Legacy API

As a still supported legacy interface, it is possible (but not recommended) to create new instances of the `crypto.Certificate` class as illustrated in the examples below.

#### `new crypto.Certificate()`

Le istanze della classe `Certificate` possono essere create utilizzando la parola chiave `new` o chiamando `crypto.Certificate()` come funzione:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

#### `certificate.exportChallenge(spkac)`
<!-- YAML
added: v0.11.8
-->

* `spkac` {string | Buffer | TypedArray | DataView}
* Returns: {Buffer} The challenge component of the `spkac` data structure, which includes a public key and a challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Stampa: la challenge come una stringa UTF8
```

#### `certificate.exportPublicKey(spkac)`
<!-- YAML
added: v0.11.8
-->

* `spkac` {string | Buffer | TypedArray | DataView}
* Returns: {Buffer} The public key component of the `spkac` data structure, which includes a public key and a challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Stampa: la public key come un <Buffer ...>
```

#### `certificate.verifySpkac(spkac)`
<!-- YAML
added: v0.11.8
-->

* `spkac` {Buffer | TypedArray | DataView}
* Returns: {boolean} `true` if the given `spkac` data structure is valid, `false` otherwise.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Stampa: true oppure false
```

## Class: `Cipher`
<!-- YAML
added: v0.1.94
-->

* Extends: {stream.Transform}

Le istanze della classe `Cipher` vengono utilizzate per crittografare i dati. La classe può essere utilizzata in due modi:

* Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing semplici dati non criptati per produrre i dati criptati sul lato readable, oppure
* Utilizzando i metodi [`cipher.update()`][] e [`cipher.final()`][] per produrre i dati criptati.

I metodi [`crypto.createCipher()`][] o [`crypto.createCipheriv()`][] vengono usati per creare istanze `Cipher`. Gli `Cipher` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Cipher` object come degli stream:

```js
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
// Key length is dependent on the algorithm. In this case for aes192, it is
// 24 bytes (192 bits).
// Use async `crypto.scrypt()` instead.
const key = crypto.scryptSync(password, 'salt', 24);
// Use `crypto.randomBytes()` to generate a random iv instead of the static iv
// shown here.
const iv = Buffer.alloc(16, 0); // Initialization vector.

const cipher = crypto.createCipheriv(algorithm, key, iv);

let encrypted = '';
cipher.on('readable', () => {
  let chunk;
  while (null !== (chunk = cipher.read())) {
    encrypted += chunk.toString('hex');
  }
});
cipher.on('end', () => {
  console.log(encrypted);
  // Prints: e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa
});

cipher.write('some clear text data');
cipher.end();
```

Esempio: Utilizzando `Cipher` e i piped stream:

```js
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
// Use the async `crypto.scrypt()` instead.
const key = crypto.scryptSync(password, 'salt', 24);
// Use `crypto.randomBytes()` to generate a random iv instead of the static iv
// shown here.
const iv = Buffer.alloc(16, 0); // Initialization vector.

const cipher = crypto.createCipheriv(algorithm, key, iv);

const input = fs.createReadStream('test.js');
const output = fs.createWriteStream('test.enc');

input.pipe(cipher).pipe(output);
```

Esempio: Utilizzando i metodi [`cipher.update()`][] e [`cipher.final()`][]:

```js
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
// Use the async `crypto.scrypt()` instead.
const key = crypto.scryptSync(password, 'salt', 24);
// Use `crypto.randomBytes` to generate a random iv instead of the static iv
// shown here.
const iv = Buffer.alloc(16, 0); // Initialization vector.

const cipher = crypto.createCipheriv(algorithm, key, iv);

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// Prints: e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa
```

### `cipher.final([outputEncoding])`
<!-- YAML
added: v0.1.94
-->

* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string} Qualsiasi contenuto cifrato restante. If `outputEncoding` is specified, a string is returned. Se non viene fornito nessun `outputEncoding`, viene restituito un [`Buffer`][].

Una volta chiamato il metodo `cipher.final()`, il `Cipher` object non può più essere utilizzato per cifrare i dati. I tentativi di chiamare `cipher.final()` più di una volta genereranno un errore.

### `cipher.setAAD(buffer[, options])`
<!-- YAML
added: v1.0.0
-->

* `buffer` {Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
  * `plaintextLength` {number}
* Restituisce: {Cipher} per il method chaining.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

The `options` argument is optional for `GCM` and `OCB`. When using `CCM`, the `plaintextLength` option must be specified and its value must match the length of the plaintext in bytes. Vedi [Modalità CCM](#crypto_ccm_mode).

Il metodo `cipher.setAAD()` dev'essere chiamato prima di [`cipher.update()`][].

### `cipher.getAuthTag()`
<!-- YAML
added: v1.0.0
-->

* Returns: {Buffer} When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing the _authentication tag_ that has been computed from the given data.

Il metodo `cipher.getAuthTag()` dev'essere chiamato solo dopo aver completato la crittografia utilizzando il metodo [`cipher.final()`][].

### `cipher.setAutoPadding([autoPadding])`
<!-- YAML
added: v0.7.1
-->

* `autoPadding` {boolean} **Default:** `true`
* Restituisce: {Cipher} per il method chaining.

Quando si utilizzano algoritmi di cifratura a blocchi, la classe `Cipher` eseguirà automaticamente il padding (riempimento) dei dati d'input fino a raggiungere la block size appropriata. Per disattivare il padding predefinito chiamare `cipher.setAutoPadding(false)`.

When `autoPadding` is `false`, the length of the entire input data must be a multiple of the cipher's block size or [`cipher.final()`][] will throw an error. La disattivazione del padding automatico è utile per il padding non standard, ad esempio utilizzando `0x0` al posto del padding PKCS.

The `cipher.setAutoPadding()` method must be called before [`cipher.final()`][].

### `cipher.update(data[, inputEncoding][, outputEncoding])`
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->

* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the data.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Aggiorna il cipher con `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. If the `inputEncoding` argument is not given, `data` must be a [`Buffer`][], `TypedArray`, or `DataView`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered data. If the `outputEncoding` is specified, a string using the specified encoding is returned. If no `outputEncoding` is provided, a [`Buffer`][] is returned.

Il metodo `cipher.update()` può essere chiamato più volte con i nuovi dati finché non viene chiamato [`cipher.final()`][]. Chiamare `cipher.update()` dopo [`cipher.final()`][] genererà un errore.

## Class: `Decipher`
<!-- YAML
added: v0.1.94
-->

* Extends: {stream.Transform}

Le istanze della classe `Decipher` vengono utilizzate per decrittografare i dati. La classe può essere utilizzata in due modi:

* Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing semplici dati criptati per produrre i dati non criptati sul lato readable, oppure
* Utilizzando i metodi [`decipher.update()`][] e [`decipher.final()`][] per produrre i dati non criptati.

I metodi [`crypto.createDecipher()`][] o [`crypto.createDecipheriv()`][] sono usati per creare istanze `Decipher`. Gli `Decipher` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Decipher` object come degli stream:

```js
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
// Key length is dependent on the algorithm. In this case for aes192, it is
// 24 bytes (192 bits).
// Use the async `crypto.scrypt()` instead.
const key = crypto.scryptSync(password, 'salt', 24);
// The IV is usually passed along with the ciphertext.
const iv = Buffer.alloc(16, 0); // Initialization vector.

const decipher = crypto.createDecipheriv(algorithm, key, iv);

let decrypted = '';
decipher.on('readable', () => {
  while (null !== (chunk = decipher.read())) {
    decrypted += chunk.toString('utf8');
  }
});
decipher.on('end', () => {
  console.log(decrypted);
  // Prints: some clear text data
});

// Encrypted with same algorithm, key and iv.
const encrypted =
  'e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa';
decipher.write(encrypted, 'hex');
decipher.end();
```

Esempio: Utilizzando `Decipher` e i piped stream:

```js
const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
// Use the async `crypto.scrypt()` instead.
const key = crypto.scryptSync(password, 'salt', 24);
// The IV is usually passed along with the ciphertext.
const iv = Buffer.alloc(16, 0); // Initialization vector.

const decipher = crypto.createDecipheriv(algorithm, key, iv);

const input = fs.createReadStream('test.enc');
const output = fs.createWriteStream('test.js');

input.pipe(decipher).pipe(output);
```

Esempio: Utilizzando i metodi [`decipher.update()`][] e [`decipher.final()`][]:

```js
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
// Use the async `crypto.scrypt()` instead.
const key = crypto.scryptSync(password, 'salt', 24);
// The IV is usually passed along with the ciphertext.
const iv = Buffer.alloc(16, 0); // Initialization vector.

const decipher = crypto.createDecipheriv(algorithm, key, iv);

// Encrypted using same algorithm, key and iv.
const encrypted =
  'e5f79c5915c02171eec6b212d5520d44480993d7d622a7c4c2da32f6efda0ffa';
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
// Prints: some clear text data
```

### `decipher.final([outputEncoding])`
<!-- YAML
added: v0.1.94
-->

* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string} Qualsiasi contenuto decifrato restante. If `outputEncoding` is specified, a string is returned. Se non viene fornito nessun `outputEncoding`, viene restituito un [`Buffer`][].

Una volta chiamato il metodo `decipher.final()`, il `Decipher` object non può più essere utilizzato per decifrare i dati. I tentativi di chiamare `decipher.final()` più di una volta genereranno un errore.

### `decipher.setAAD(buffer[, options])`
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->

* `buffer` {Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
  * `plaintextLength` {number}
* Restituisce: {Decipher} per il method chaining.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

L'argomento `options` è facoltativo per la `GCM`. When using `CCM`, the `plaintextLength` option must be specified and its value must match the length of the plaintext in bytes. Vedi [Modalità CCM](#crypto_ccm_mode).

Il metodo `decipher.setAAD()` dev'essere chiamato prima di [`decipher.update()`][].

### `decipher.setAuthTag(buffer)`
<!-- YAML
added: v1.0.0
changes:
  - version: v11.0.0
    pr-url: https://github.com/nodejs/node/pull/17825
    description: This method now throws if the GCM tag length is invalid.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->

* `buffer` {Buffer | TypedArray | DataView}
* Restituisce: {Decipher} per il method chaining.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAuthTag()` method is used to pass in the received _authentication tag_. Se non viene fornito alcun tag, o se il testo cifrato è stato manomesso, verrà eseguito [`decipher.final()`][], indicando che il testo cifrato dovrebbe essere scartato a causa dell'autenticazione fallita. If the tag length is invalid according to [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) or does not match the value of the `authTagLength` option, `decipher.setAuthTag()` will throw an error.

The `decipher.setAuthTag()` method must be called before [`decipher.final()`][] and can only be called once.

### `decipher.setAutoPadding([autoPadding])`
<!-- YAML
added: v0.7.1
-->

* `autoPadding` {boolean} **Default:** `true`
* Restituisce: {Decipher} per il method chaining.

Quando i dati sono stati cifrati senza il padding standard del blocco, la chiamata a `decipher.setAutoPadding(false)` disabiliterà il padding automatico in modo da impedire a [`decipher.final()`][] di cercare e rimuovere il padding.

La disattivazione del padding automatico sarà possibile solo se la lunghezza dei dati d'input è un multiplo della block size dei cipher.

The `decipher.setAutoPadding()` method must be called before [`decipher.final()`][].

### `decipher.update(data[, inputEncoding][, outputEncoding])`
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->

* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Aggiorna il decipher con `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. If the `inputEncoding` argument is not given, `data` must be a [`Buffer`][]. If `data` is a [`Buffer`][] then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered data. If the `outputEncoding` is specified, a string using the specified encoding is returned. If no `outputEncoding` is provided, a [`Buffer`][] is returned.

Il metodo `decipher.update()` può essere chiamato più volte con i nuovi dati finché non viene chiamato [`decipher.final()`][]. Chiamare `decipher.update()` dopo [`decipher.final()`][] genererà un errore.

## Class: `DiffieHellman`
<!-- YAML
added: v0.5.0
-->

La classe `DiffieHellman` è un'utility per la creazione di scambi di chiavi Diffie-Hellman.

Le istanze della classe `DiffieHellman` possono essere create utilizzando la funzione [`crypto.createDiffieHellman()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Genera le chiavi di Alice...
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// Genera le chiavi di Bob...
const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
const bobKey = bob.generateKeys();

// Esegue lo scambio e genera la chiave segreta...
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

// OK
assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
```

### `diffieHellman.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])`
<!-- YAML
added: v0.5.0
-->

* `otherPublicKey` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of an `otherPublicKey` string.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Computes the shared secret using `otherPublicKey` as the other party's public key and returns the computed shared secret. The supplied key is interpreted using the specified `inputEncoding`, and secret is encoded using specified `outputEncoding`. If the `inputEncoding` is not provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `outputEncoding` is given a string is returned; otherwise, a [`Buffer`][] is returned.

### `diffieHellman.generateKeys([encoding])`
<!-- YAML
added: v0.5.0
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Genera valori di chiave Diffie-Hellman privata e pubblica, e restituisce la chiave pubblica nell'`encoding` specificato. Questa chiave dovrebbe essere trasferita all'altra parte. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### `diffieHellman.getGenerator([encoding])`
<!-- YAML
added: v0.5.0
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Returns the Diffie-Hellman generator in the specified `encoding`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### `diffieHellman.getPrime([encoding])`
<!-- YAML
added: v0.5.0
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Returns the Diffie-Hellman prime in the specified `encoding`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### `diffieHellman.getPrivateKey([encoding])`
<!-- YAML
added: v0.5.0
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Returns the Diffie-Hellman private key in the specified `encoding`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### `diffieHellman.getPublicKey([encoding])`
<!-- YAML
added: v0.5.0
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Returns the Diffie-Hellman public key in the specified `encoding`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### `diffieHellman.setPrivateKey(privateKey[, encoding])`
<!-- YAML
added: v0.5.0
-->

* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Imposta la chiave privata Diffie-Hellman. If the `encoding` argument is provided, `privateKey` is expected to be a string. If no `encoding` is provided, `privateKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

### `diffieHellman.setPublicKey(publicKey[, encoding])`
<!-- YAML
added: v0.5.0
-->

* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Imposta la chiave pubblica Diffie-Hellman. If the `encoding` argument is provided, `publicKey` is expected to be a string. If no `encoding` is provided, `publicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

### `diffieHellman.verifyError`
<!-- YAML
added: v0.11.12
-->

Un campo di bit contenente eventuali avvisi e/o errori risultanti da un controllo eseguito durante l'inizializzazione del `DiffieHellman` object.

I seguenti valori sono validi per questa proprietà (come definita nel modulo `constants`):

* `DH_CHECK_P_NOT_SAFE_PRIME`
* `DH_CHECK_P_NOT_PRIME`
* `DH_UNABLE_TO_CHECK_GENERATOR`
* `DH_NOT_SUITABLE_GENERATOR`

## Class: `DiffieHellmanGroup`
<!-- YAML
added: v0.7.5
-->

The `DiffieHellmanGroup` class takes a well-known modp group as its argument but otherwise works the same as `DiffieHellman`.

```js
const name = 'modp1';
const dh = crypto.createDiffieHellmanGroup(name);
```

`name` is taken from [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt) (modp1 and 2) and [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt):

```console
$ perl -ne 'print "$1\n" if /"(modp\d+)"/' src/node_crypto_groups.h
modp1  #  768 bits
modp2  # 1024 bits
modp5  # 1536 bits
modp14 # 2048 bits
modp15 # etc.
modp16
modp17
modp18
```

## Class: `ECDH`
<!-- YAML
added: v0.11.14
-->

La classe `ECDH` è un'utility per la creazione di scambi di chiavi Elliptic Curve Diffie-Hellman (ECDH).

Le istanze della classe `ECDH` possono essere create utilizzando la funzione [`crypto.createECDH()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Genera le chiavi di Alice...
const alice = crypto.createECDH('secp521r1');
const aliceKey = alice.generateKeys();

// Genera le chiavi di Bob...
const bob = crypto.createECDH('secp521r1');
const bobKey = bob.generateKeys();

// Esegue lo scambio e genera la chiave segreta...
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
// OK
```

### Class Method: `ECDH.convertKey(key, curve[, inputEncoding[, outputEncoding[, format]]])`
<!-- YAML
added: v10.0.0
-->

* `key` {string | Buffer | TypedArray | DataView}
* `curve` {string}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `key` string.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Restituisce: {Buffer | string}

Converts the EC Diffie-Hellman public key specified by `key` and `curve` to the format specified by `format`. The `format` argument specifies point encoding and can be `'compressed'`, `'uncompressed'` or `'hybrid'`. The supplied key is interpreted using the specified `inputEncoding`, and the returned key is encoded using the specified `outputEncoding`.

Utilizza [`crypto.getCurves()`][] per ottenere un elenco di nomi di curve disponibili. On recent OpenSSL releases, `openssl ecparam -list_curves` will also display the name and description of each available elliptic curve.

If `format` is not specified the point will be returned in `'uncompressed'` format.

If the `inputEncoding` is not provided, `key` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

Esempio (decompressione di una chiave):

```js
const { createECDH, ECDH } = require('crypto');

const ecdh = createECDH('secp256k1');
ecdh.generateKeys();

const compressedKey = ecdh.getPublicKey('hex', 'compressed');

const uncompressedKey = ECDH.convertKey(compressedKey,
                                        'secp256k1',
                                        'hex',
                                        'hex',
                                        'uncompressed');

// The converted key and the uncompressed public key should be the same
console.log(uncompressedKey === ecdh.getPublicKey('hex'));
```

### `ecdh.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])`
<!-- YAML
added: v0.11.14
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16849
    description: Changed error format to better support invalid public key
                 error
-->

* `otherPublicKey` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `otherPublicKey` string.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Computes the shared secret using `otherPublicKey` as the other party's public key and returns the computed shared secret. The supplied key is interpreted using specified `inputEncoding`, and the returned secret is encoded using the specified `outputEncoding`. If the `inputEncoding` is not provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `outputEncoding` is given a string will be returned; otherwise a [`Buffer`][] is returned.

`ecdh.computeSecret` will throw an `ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY` error when `otherPublicKey` lies outside of the elliptic curve. Since `otherPublicKey` is usually supplied from a remote user over an insecure network, its recommended for developers to handle this exception accordingly.

### `ecdh.generateKeys([encoding[, format]])`
<!-- YAML
added: v0.11.14
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Restituisce: {Buffer | string}

Genera valori di chiave EC Diffie-Hellman privata e pubblica, e restituisce la chiave pubblica nel `format` e nell'`encoding` specificati. Questa chiave dovrebbe essere trasferita all'altra parte.

The `format` argument specifies point encoding and can be `'compressed'` or `'uncompressed'`. If `format` is not specified, the point will be returned in `'uncompressed'` format.

If `encoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

### `ecdh.getPrivateKey([encoding])`
<!-- YAML
added: v0.11.14
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Returns: {Buffer | string} The EC Diffie-Hellman in the specified `encoding`.

If `encoding` is specified, a string is returned; otherwise a [`Buffer`][] is returned.

### `ecdh.getPublicKey([encoding][, format])`
<!-- YAML
added: v0.11.14
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Returns: {Buffer | string} The EC Diffie-Hellman public key in the specified `encoding` and `format`.

The `format` argument specifies point encoding and can be `'compressed'` or `'uncompressed'`. If `format` is not specified the point will be returned in `'uncompressed'` format.

If `encoding` is specified, a string is returned; otherwise a [`Buffer`][] is returned.

### `ecdh.setPrivateKey(privateKey[, encoding])`
<!-- YAML
added: v0.11.14
-->

* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Imposta la chiave privata EC Diffie-Hellman. If `encoding` is provided, `privateKey` is expected to be a string; otherwise `privateKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `privateKey` is not valid for the curve specified when the `ECDH` object was created, an error is thrown. Upon setting the private key, the associated public point (key) is also generated and set in the `ECDH` object.

### `ecdh.setPublicKey(publicKey[, encoding])`
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Stabilità: 0 - Obsoleto

* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Imposta la chiave pubblica EC Diffie-Hellman. If `encoding` is provided `publicKey` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

There is not normally a reason to call this method because `ECDH` only requires a private key and the other party's public key to compute the shared secret. Solitamente viene chiamato [`ecdh.generateKeys()`][] oppure [`ecdh.setPrivateKey()`][]. Il metodo [`ecdh.setPrivateKey()`][] tenta di generare il punto pubblico/la chiave pubblica associati alla chiave privata impostata.

Esempio (ottenendo una chiave segreta condivisa):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// This is a shortcut way of specifying one of Alice's previous private
// keys. Non sarebbe saggio usare una chiave privata così prevedibile in una vera
// applicazione.
alice.setPrivateKey(
  crypto.createHash('sha256').update('alice', 'utf8').digest()
);

// Bob usa una coppia di chiavi pseudocasuali
// ben cifrate
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

// aliceSecret e bobSecret dovrebbero avere lo stesso valore segreto condiviso
console.log(aliceSecret === bobSecret);
```

## Class: `Hash`
<!-- YAML
added: v0.1.92
-->

* Extends: {stream.Transform}

La classe `Hash` è un'utility per creare hash digest di dati. Può essere utilizzata in due modi:

* Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing i dati per produrre un hash digest calcolato sul lato readable, oppure
* Utilizzando i metodi [`hash.update()`][] e [`hash.digest()`][] per produrre l'hash calcolato.

Le istanze `Hash` vengono create utilizzando il metodo [`crypto.createHash()`][]. Gli `Hash` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Hash` object come degli stream:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.on('readable', () => {
  // Only one element is going to be produced by the
  // hash stream.
  const data = hash.read();
  if (data) {
    console.log(data.toString('hex'));
    // Prints:
    //   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
  }
});

hash.write('some data to hash');
hash.end();
```

Esempio: Utilizzando `Hash` e i piped stream:

```js
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');

const input = fs.createReadStream('test.js');
input.pipe(hash).pipe(process.stdout);
```

Esempio: Utilizzando i metodi [`hash.update()`][] e [`hash.digest()`][]:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('some data to hash');
console.log(hash.digest('hex'));
// Stampa:
//   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
```

### `hash.copy([options])`
<!-- YAML
added: v13.1.0
-->

* `options` {Object} [`stream.transform` options][]
* Restituisce: {Hash}

Creates a new `Hash` object that contains a deep copy of the internal state of the current `Hash` object.

The optional `options` argument controls stream behavior. For XOF hash functions such as `'shake256'`, the `outputLength` option can be used to specify the desired output length in bytes.

An error is thrown when an attempt is made to copy the `Hash` object after its [`hash.digest()`][] method has been called.

```js
// Calculate a rolling hash.
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('one');
console.log(hash.copy().digest('hex'));

hash.update('two');
console.log(hash.copy().digest('hex'));

hash.update('three');
console.log(hash.copy().digest('hex'));

// Etc.
```

### `hash.digest([encoding])`
<!-- YAML
added: v0.1.92
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Calcola il digest di tutti i dati passati per essere sottoposti all'hash (utilizzando il metodo [`hash.update()`][]). Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

L'`Hash` object non può essere utilizzato nuovamente dopo aver chiamato il metodo `hash.digest()`. Chiamate multiple genereranno un errore.

### `hash.update(data[, inputEncoding])`
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->

* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the hash content with the given `data`, the encoding of which is given in `inputEncoding`. Se non viene fornito l'`encoding`, e `data` è una stringa, viene imposto un encoding di `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

## Class: `Hmac`
<!-- YAML
added: v0.1.94
-->

* Extends: {stream.Transform}

The `Hmac` class is a utility for creating cryptographic HMAC digests. Può essere utilizzata in due modi:

* Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing i dati per produrre un HMAC digest calcolato sul lato readable, oppure
* Utilizzando i metodi [`hmac.update()`][] e [`hmac.digest()`][] per produrre l'HMAC digest calcolato.

Le istanze `Hmac` vengono create utilizzando il metodo [`crypto.createHmac()`][]. Gli `Hmac` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Hmac` object come degli stream:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.on('readable', () => {
  // Only one element is going to be produced by the
  // hash stream.
  const data = hmac.read();
  if (data) {
    console.log(data.toString('hex'));
    // Prints:
    //   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
  }
});

hmac.write('some data to hash');
hmac.end();
```

Esempio: Utilizzando `Hmac` e i piped stream:

```js
const crypto = require('crypto');
const fs = require('fs');
const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream('test.js');
input.pipe(hmac).pipe(process.stdout);
```

Esempio: Utilizzando i metodi [`hmac.update()`][] e [`hmac.digest()`][]:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.update('some data to hash');
console.log(hmac.digest('hex'));
// Stampa:
//   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
```

### `hmac.digest([encoding])`
<!-- YAML
added: v0.1.94
-->

* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Calcola l'HMAC digest di tutti i dati passati utilizzando [`hmac.update()`][]. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][];

L'`Hmac` object non può essere utilizzato nuovamente dopo aver chiamato il metodo `hmac.digest()`. Chiamate multiple di `hmac.digest()` genereranno un errore.

### `hmac.update(data[, inputEncoding])`
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->

* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the `Hmac` content with the given `data`, the encoding of which is given in `inputEncoding`. Se non viene fornito l'`encoding`, e `data` è una stringa, viene imposto un encoding di `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

## Class: `KeyObject`
<!-- YAML
added: v11.6.0
changes:
  - version: v11.13.0
    pr-url: https://github.com/nodejs/node/pull/26438
    description: This class is now exported.
-->

Node.js uses a `KeyObject` class to represent a symmetric or asymmetric key, and each kind of key exposes different functions. The [`crypto.createSecretKey()`][], [`crypto.createPublicKey()`][] and [`crypto.createPrivateKey()`][] methods are used to create `KeyObject` instances. `KeyObject` objects are not to be created directly using the `new` keyword.

Most applications should consider using the new `KeyObject` API instead of passing keys as strings or `Buffer`s due to improved security features.

### `keyObject.asymmetricKeyType`
<!-- YAML
added: v11.6.0
changes:
  - version: v13.9.0
    pr-url: https://github.com/nodejs/node/pull/31178
    description: Added support for `'dh'`.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26960
    description: Added support for `'rsa-pss'`
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26786
    description: This property now returns `undefined` for KeyObject
                 instances of unrecognized type instead of aborting.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26774
    description: Added support for `'x25519'` and `'x448'`
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26319
    description: Added support for `'ed25519'` and `'ed448'`.
-->

* {string}

For asymmetric keys, this property represents the type of the key. Supported key types are:

* `'rsa'` (OID 1.2.840.113549.1.1.1)
* `'rsa-pss'` (OID 1.2.840.113549.1.1.10)
* `'dsa'` (OID 1.2.840.10040.4.1)
* `'ec'` (OID 1.2.840.10045.2.1)
* `'x25519'` (OID 1.3.101.110)
* `'x448'` (OID 1.3.101.111)
* `'ed25519'` (OID 1.3.101.112)
* `'ed448'` (OID 1.3.101.113)
* `'dh'` (OID 1.2.840.113549.1.3.1)

This property is `undefined` for unrecognized `KeyObject` types and symmetric keys.

### `keyObject.export([options])`
<!-- YAML
added: v11.6.0
-->

* `options`: {Object}
* Returns: {string | Buffer}

For symmetric keys, this function allocates a `Buffer` containing the key material and ignores any options.

For asymmetric keys, the `options` parameter is used to determine the export format.

For public keys, the following encoding options can be used:

* `type`: {string} Must be one of `'pkcs1'` (RSA only) or `'spki'`.
* `format`: {string} Must be `'pem'` or `'der'`.

For private keys, the following encoding options can be used:

* `type`: {string} Must be one of `'pkcs1'` (RSA only), `'pkcs8'` or `'sec1'` (EC only).
* `format`: {string} Must be `'pem'` or `'der'`.
* `cipher`: {string} If specified, the private key will be encrypted with the given `cipher` and `passphrase` using PKCS#5 v2.0 password based encryption.
* `passphrase`: {string | Buffer} The passphrase to use for encryption, see `cipher`.

When PEM encoding was selected, the result will be a string, otherwise it will be a buffer containing the data encoded as DER.

PKCS#1, SEC1, and PKCS#8 type keys can be encrypted by using a combination of the `cipher` and `format` options. The PKCS#8 `type` can be used with any `format` to encrypt any key algorithm (RSA, EC, or DH) by specifying a `cipher`. PKCS#1 and SEC1 can only be encrypted by specifying a `cipher` when the PEM `format` is used. For maximum compatibility, use PKCS#8 for encrypted private keys. Since PKCS#8 defines its own encryption mechanism, PEM-level encryption is not supported when encrypting a PKCS#8 key. See [RFC 5208](https://www.rfc-editor.org/rfc/rfc5208.txt) for PKCS#8 encryption and [RFC 1421](https://www.rfc-editor.org/rfc/rfc1421.txt) for PKCS#1 and SEC1 encryption.

### `keyObject.symmetricKeySize`
<!-- YAML
added: v11.6.0
-->

* {number}

For secret keys, this property represents the size of the key in bytes. This property is `undefined` for asymmetric keys.

### `keyObject.type`
<!-- YAML
added: v11.6.0
-->

* {string}

Depending on the type of this `KeyObject`, this property is either `'secret'` for secret (symmetric) keys, `'public'` for public (asymmetric) keys or `'private'` for private (asymmetric) keys.

## Class: `Sign`
<!-- YAML
added: v0.1.92
-->

* Extends: {stream.Writable}

The `Sign` class is a utility for generating signatures. Può essere utilizzata in due modi:

* Come un writable [stream](stream.html), sul quale vengono scritti tramite il writing i dati da firmare e il metodo [`sign.sign()`][] viene utilizzato per generare e restituire la firma, oppure
* Utilizzando i metodi [`sign.update()`][] e [`sign.sign()`][] per produrre la firma.

Le istanze `Sign` vengono create utilizzando il metodo [`crypto.createSign()`][]. L'argomento è il nome della stringa della funzione hash da utilizzare. I `Sign` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Example: Using `Sign` and [`Verify`][] objects as streams:

```js
const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'sect239k1'
});

const sign = crypto.createSign('SHA256');
sign.write('some data to sign');
sign.end();
const signature = sign.sign(privateKey, 'hex');

const verify = crypto.createVerify('SHA256');
verify.write('some data to sign');
verify.end();
console.log(verify.verify(publicKey, signature, 'hex'));
// Prints: true
```

Example: Using the [`sign.update()`][] and [`verify.update()`][] methods:

```js
const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const sign = crypto.createSign('SHA256');
sign.update('some data to sign');
sign.end();
const signature = sign.sign(privateKey);

const verify = crypto.createVerify('SHA256');
verify.update('some data to sign');
verify.end();
console.log(verify.verify(publicKey, signature));
// Prints: true
```

### `sign.sign(privateKey[, outputEncoding])`
<!-- YAML
added: v0.1.92
changes:
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26960
    description: This function now supports RSA-PSS keys.
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: This function now supports key objects.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->

* `privateKey` {Object | string | Buffer | KeyObject}
  * `dsaEncoding` {string}
  * `padding` {integer}
  * `saltLength` {integer}
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Restituisce: {Buffer | string}

Calcola la firma su tutti i dati passati utilizzando [`sign.update()`][] oppure [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

If `privateKey` is not a [`KeyObject`][], this function behaves as if `privateKey` had been passed to [`crypto.createPrivateKey()`][]. If it is an object, the following additional properties can be passed:

* `dsaEncoding` {string} For DSA and ECDSA, this option specifies the format of the generated signature. It can be one of the following:
  * `'der'` (default): DER-encoded ASN.1 signature structure encoding `(r, s)`.
  * `'ieee-p1363'`: Signature format `r || s` as proposed in IEEE-P1363.
* `padding` {integer} Optional padding value for RSA, one of the following:
  * `crypto.constants.RSA_PKCS1_PADDING` (valore di default)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function used to sign the message as specified in section 3.1 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt), unless an MGF1 hash function has been specified as part of the key in compliance with section 3.3 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength` {integer} Salt length for when padding is `RSA_PKCS1_PSS_PADDING`. Il valore speciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` imposta la lunghezza del salt nella dimensione del digest, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (valore di default) lo imposta sul valore massimo consentito.

If `outputEncoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

Il `Sign` object non può essere utilizzato nuovamente dopo aver chiamato il metodo `sign.sign()`. Chiamate multiple di `sign.sign()` genereranno un errore.

### `sign.update(data[, inputEncoding])`
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->

* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the `Sign` content with the given `data`, the encoding of which is given in `inputEncoding`. Se non viene fornito l'`encoding`, e `data` è una stringa, viene imposto un encoding di `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

## Class: `Verify`
<!-- YAML
added: v0.1.92
-->

* Extends: {stream.Writable}

La classe `Verify` è un'utility per verificare le firme. Può essere utilizzata in due modi:

* Come un writable [stream](stream.html), sul quale i dati scritti tramite il writing vengono utilizzati per convalidare la firma fornita, oppure
* Utilizzando i metodi [`verify.update()`][] e [`verify.verify()`][] per verificare la firma.

Le istanze `Verify` vengono create utilizzando il metodo [`crypto.createVerify()`][]. Gli `Verify` object non devono essere creati direttamente utilizzando la parola chiave `new`.

See [`Sign`][] for examples.

### `verify.update(data[, inputEncoding])`
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->

* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the `Verify` content with the given `data`, the encoding of which is given in `inputEncoding`. If `inputEncoding` is not provided, and the `data` is a string, an encoding of `'utf8'` is enforced. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

### `verify.verify(object, signature[, signatureEncoding])`
<!-- YAML
added: v0.1.92
changes:
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26960
    description: This function now supports RSA-PSS keys.
  - version: v11.7.0
    pr-url: https://github.com/nodejs/node/pull/25217
    description: The key can now be a private key.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->

* `object` {Object | string | Buffer | KeyObject}
  * `dsaEncoding` {string}
  * `padding` {integer}
  * `saltLength` {integer}
* `signature` {string | Buffer | TypedArray | DataView}
* `signatureEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `signature` string.
* Returns: {boolean} `true` or `false` depending on the validity of the signature for the data and public key.

Verifica i dati forniti utilizzando l'`object` e la `signature` specificati.

If `object` is not a [`KeyObject`][], this function behaves as if `object` had been passed to [`crypto.createPublicKey()`][]. If it is an object, the following additional properties can be passed:

* `dsaEncoding` {string} For DSA and ECDSA, this option specifies the format of the generated signature. It can be one of the following:
  * `'der'` (default): DER-encoded ASN.1 signature structure encoding `(r, s)`.
  * `'ieee-p1363'`: Signature format `r || s` as proposed in IEEE-P1363.
* `padding` {integer} Optional padding value for RSA, one of the following:
  * `crypto.constants.RSA_PKCS1_PADDING` (valore di default)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function used to verify the message as specified in section 3.1 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt), unless an MGF1 hash function has been specified as part of the key in compliance with section 3.3 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength` {integer} Salt length for when padding is `RSA_PKCS1_PSS_PADDING`. Il valore speciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` imposta la lunghezza del salta nella dimensione del digest, `crypto.constants.RSA_PSS_SALTLEN_AUTO` (valore di default) fa sì che venga determinato automaticamente.

The `signature` argument is the previously calculated signature for the data, in the `signatureEncoding`. If a `signatureEncoding` is specified, the `signature` is expected to be a string; otherwise `signature` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

The `verify` object can not be used again after `verify.verify()` has been called. Chiamate multiple di `verify.verify()` genereranno un errore.

Because public keys can be derived from private keys, a private key may be passed instead of a public key.

## Metodi e proprietà del modulo `crypto`

### `crypto.constants`
<!-- YAML
added: v6.3.0
-->

* Returns: {Object} An object containing commonly used constants for crypto and security related operations. The specific constants currently defined are described in [Crypto Constants](#crypto_crypto_constants_1).

### `crypto.DEFAULT_ENCODING`
<!-- YAML
added: v0.9.3
deprecated: v10.0.0
-->

> Stabilità: 0 - Obsoleto

L'encoding predefinito da utilizzare per le funzioni che possono utilizzare le stringhe oppure i [buffers] [`Buffer`]. Il valore predefinito è `'buffer'`, il quale rende i metodi predefiniti ai [`Buffer`][] object.

Il meccanismo `crypto.DEFAULT_ENCODING` viene fornito per la retrocompatibilità con i programmi legacy che prevedono che `'latin1'` sia l'encoding predefinito.

Le nuove applicazioni dovrebbero aspettarsi che il valore predefinito sia `'buffer'`.

Questa proprietà è obsoleta.

### `crypto.fips`
<!-- YAML
added: v6.0.0
deprecated: v10.0.0
-->

> Stabilità: 0 - Obsoleto

Property for checking and controlling whether a FIPS compliant crypto provider is currently in use. L'impostazione su true richiede una build delle norme FIPS di Node.js.

Questa proprietà è obsoleta. Please use `crypto.setFips()` and `crypto.getFips()` instead.

### `crypto.createCipher(algorithm, password[, options])`
<!-- YAML
added: v0.1.94
deprecated: v10.0.0
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/21447
    description: Ciphers in OCB mode are now supported.
  - version: v10.2.0
    pr-url: https://github.com/nodejs/node/pull/20235
    description: The `authTagLength` option can now be used to produce shorter
                 authentication tags in GCM mode and defaults to 16 bytes.
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`crypto.createCipheriv()`][].

* `algorithm` {string}
* `password` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Restituisce: {Cipher}

Crea e restituisce un `Cipher` object che utilizza l'`algorithm` e la `password` specificati.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

L'`algorithm` dipende da OpenSSL, alcuni esempi sono `'aes192'`, ecc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

La `password` viene utilizzata per ricavare la chiave di cifratura (cipher key) e il vettore di inizializzazione (IV). The value must be either a `'latin1'` encoded string, a [`Buffer`][], a `TypedArray`, or a `DataView`.

L'implementazione di `crypto.createCipher()` deriva le chiavi utilizzando la funzione OpenSSL [`EVP_BytesToKey`][] con l'algoritmo digest impostato su MD5, una iterazione e nessun salt. La mancanza di salt consente attacchi a dizionario poiché la stessa password crea sempre la stessa chiave. Il basso numero di iterazioni e l'algoritmo hash, non crittograficamente sicuro, permettono di testare le password molto rapidamente.

In line with OpenSSL's recommendation to use a more modern algorithm instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.scrypt()`][] and to use [`crypto.createCipheriv()`][] to create the `Cipher` object. Users should not use ciphers with counter mode (e.g. CTR, GCM, or CCM) in `crypto.createCipher()`. Viene emesso un avviso quando vengono utilizzati al fine di non rischiare riutilizzando l'IV in quanto il riutilizzo causa vulnerabilità. For the case when IV is reused in GCM, see \[Nonce-Disrespecting Adversaries\]\[\] for details.

### `crypto.createCipheriv(algorithm, key, iv[, options])`
<!-- YAML
added: v0.1.94
changes:
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: The `key` argument can now be a `KeyObject`.
  - version: v11.2.0
    pr-url: https://github.com/nodejs/node/pull/24081
    description: The cipher `chacha20-poly1305` is now supported.
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/21447
    description: Ciphers in OCB mode are now supported.
  - version: v10.2.0
    pr-url: https://github.com/nodejs/node/pull/20235
    description: The `authTagLength` option can now be used to produce shorter
                 authentication tags in GCM mode and defaults to 16 bytes.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18644
    description: The `iv` parameter may now be `null` for ciphers which do not
                 need an initialization vector.
-->

* `algorithm` {string}
* `key` {string | Buffer | TypedArray | DataView | KeyObject}
* `iv` {string | Buffer | TypedArray | DataView | null}
* `options` {Object} [`stream.transform` options][]
* Restituisce: {Cipher}

Crea e restituisce un `Cipher` object, con l'`algorithm`, la `key` e il vettore di inizializzazione (`iv`) specificati.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

L'`algorithm` dipende da OpenSSL, alcuni esempi sono `'aes192'`, ecc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

La `key` è la raw key utilizzata dall'`algorithm` e `iv` è un [vettore di inizializzazione](https://en.wikipedia.org/wiki/Initialization_vector). Entrambi gli argomenti devono essere delle stringhe con codifica `'utf8'`, dei [Buffers][`Buffer`], dei `TypedArray` o dei `DataView`. The `key` may optionally be a [`KeyObject`][] of type `secret`. If the cipher does not need an initialization vector, `iv` may be `null`.

Initialization vectors should be unpredictable and unique; ideally, they will be cryptographically random. They do not have to be secret: IVs are typically just added to ciphertext messages unencrypted. It may sound contradictory that something has to be unpredictable and unique, but does not have to be secret; remember that an attacker must not be able to predict ahead of time what a given IV will be.

### `crypto.createDecipher(algorithm, password[, options])`
<!-- YAML
added: v0.1.94
deprecated: v10.0.0
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/21447
    description: Ciphers in OCB mode are now supported.
-->

> Stabilità: 0 - Obsoleto: Utilizza invece [`crypto.createDecipheriv()`][].

* `algorithm` {string}
* `password` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Restituisce: {Decipher}

Crea e restituisce un `Decipher` object che utilizza l'`algorithm` e la `password` (chiave) specificati.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

L'implementazione di `crypto.createDecipher()` deriva le chiavi utilizzando la funzione OpenSSL [`EVP_BytesToKey`][] con l'algoritmo digest impostato su MD5, una iterazione e nessun salt. La mancanza di salt consente attacchi a dizionario poiché la stessa password crea sempre la stessa chiave. Il basso numero di iterazioni e l'algoritmo hash, non crittograficamente sicuro, permettono di testare le password molto rapidamente.

In line with OpenSSL's recommendation to use a more modern algorithm instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.scrypt()`][] and to use [`crypto.createDecipheriv()`][] to create the `Decipher` object.

### `crypto.createDecipheriv(algorithm, key, iv[, options])`
<!-- YAML
added: v0.1.94
changes:
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: The `key` argument can now be a `KeyObject`.
  - version: v11.2.0
    pr-url: https://github.com/nodejs/node/pull/24081
    description: The cipher `chacha20-poly1305` is now supported.
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/21447
    description: Ciphers in OCB mode are now supported.
  - version: v10.2.0
    pr-url: https://github.com/nodejs/node/pull/20039
    description: The `authTagLength` option can now be used to restrict accepted
                 GCM authentication tag lengths.
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18644
    description: The `iv` parameter may now be `null` for ciphers which do not
                 need an initialization vector.
-->

* `algorithm` {string}
* `key` {string | Buffer | TypedArray | DataView | KeyObject}
* `iv` {string | Buffer | TypedArray | DataView | null}
* `options` {Object} [`stream.transform` options][]
* Restituisce: {Decipher}

Crea e restituisce un `Decipher` object che utilizza l'`algorithm`, la `key` e il vettore di inizializzazione (`iv`) specificati.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to restrict accepted authentication tags to those with the specified length.

L'`algorithm` dipende da OpenSSL, alcuni esempi sono `'aes192'`, ecc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

La `key` è la raw key utilizzata dall'`algorithm` e `iv` è un [vettore di inizializzazione](https://en.wikipedia.org/wiki/Initialization_vector). Entrambi gli argomenti devono essere delle stringhe con codifica `'utf8'`, dei [Buffers][`Buffer`], dei `TypedArray` o dei `DataView`. The `key` may optionally be a [`KeyObject`][] of type `secret`. If the cipher does not need an initialization vector, `iv` may be `null`.

Initialization vectors should be unpredictable and unique; ideally, they will be cryptographically random. They do not have to be secret: IVs are typically just added to ciphertext messages unencrypted. It may sound contradictory that something has to be unpredictable and unique, but does not have to be secret; remember that an attacker must not be able to predict ahead of time what a given IV will be.

### `crypto.createDiffieHellman(prime[, primeEncoding][, generator][, generatorEncoding])`
<!-- YAML
added: v0.11.12
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12223
    description: The `prime` argument can be any `TypedArray` or `DataView` now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11983
    description: The `prime` argument can be a `Uint8Array` now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default for the encoding parameters changed
                 from `binary` to `utf8`.
-->

* `prime` {string | Buffer | TypedArray | DataView}
* `primeEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `prime` string.
* `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
* `generatorEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `generator` string.
* Restituisce: {DiffieHellman}

Crea un `DiffieHellman` key exchange object utilizzando il `prime` fornito e un `generator` specifico opzionale.

L'argomento `generator` può essere un numero, una stringa o un [`Buffer`][]. Se `generator` non viene specificato, viene utilizzato il valore `2`.

If `primeEncoding` is specified, `prime` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

If `generatorEncoding` is specified, `generator` is expected to be a string; otherwise a number, [`Buffer`][], `TypedArray`, or `DataView` is expected.

### `crypto.createDiffieHellman(primeLength[, generator])`
<!-- YAML
added: v0.5.0
-->

* `primeLength` {number}
* `generator` {number} **Default:** `2`
* Restituisce: {DiffieHellman}

Creates a `DiffieHellman` key exchange object and generates a prime of `primeLength` bits using an optional specific numeric `generator`. Se `generator` non viene specificato, viene utilizzato il valore `2`.

### `crypto.createDiffieHellmanGroup(name)`
<!-- YAML
added: v0.9.3
-->

* `name` {string}
* Returns: {DiffieHellmanGroup}

An alias for [`crypto.getDiffieHellman()`][]

### `crypto.createECDH(curveName)`
<!-- YAML
added: v0.11.14
-->

* `curveName` {string}
* Restituisce: {ECDH}

Creates an Elliptic Curve Diffie-Hellman (`ECDH`) key exchange object using a predefined curve specified by the `curveName` string. Utilizza [`crypto.getCurves()`][] per ottenere un elenco di nomi di curve disponibili. Nelle versioni OpenSSL recenti, `openssl ecparam -list_curves` mostrerà anche il nome e la descrizione di ciascuna curva ellittica disponibile.

### `crypto.createHash(algorithm[, options])`
<!-- YAML
added: v0.1.92
changes:
  - version: v12.8.0
    pr-url: https://github.com/nodejs/node/pull/28805
    description: The `outputLength` option was added for XOF hash functions.
-->

* `algorithm` {string}
* `options` {Object} [`stream.transform` options][]
* Restituisce: {Hash}

Crea e restituisce un `Hash` object che può essere utilizzato per generare degli hash digest tramite l'`algorithm` specificato. Optional `options` argument controls stream behavior. For XOF hash functions such as `'shake256'`, the `outputLength` option can be used to specify the desired output length in bytes.

L'`algorithm` dipende dagli algoritmi disponibili supportati dalla versione OpenSSL sulla piattaforma. Alcuni esempi sono `'sha256'`, `'sha512'`, ecc. On recent releases of OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` for older versions of OpenSSL) will display the available digest algorithms.

Esempio: generazione della somma sha256 di un file

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hash = crypto.createHash('sha256');

const input = fs.createReadStream(filename);
input.on('readable', () => {
  // Only one element is going to be produced by the
  // hash stream.
  const data = input.read();
  if (data)
    hash.update(data);
  else {
    console.log(`${hash.digest('hex')} ${filename}`);
  }
});
```

### `crypto.createHmac(algorithm, key[, options])`
<!-- YAML
added: v0.1.94
changes:
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: The `key` argument can now be a `KeyObject`.
-->

* `algorithm` {string}
* `key` {string | Buffer | TypedArray | DataView | KeyObject}
* `options` {Object} [`stream.transform` options][]
* Restituisce: {Hmac}

Crea e restituisce un `Hmac` object che utilizza l'`algorithm` e la `key` specificati. L'argomento `options` opzionale controlla il comportamento dello stream.

L'`algorithm` dipende dagli algoritmi disponibili supportati dalla versione OpenSSL sulla piattaforma. Alcuni esempi sono `'sha256'`, `'sha512'`, ecc. On recent releases of OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` for older versions of OpenSSL) will display the available digest algorithms.

La `key` è la chiave HMAC utilizzata per generare l'hash crittografico HMAC. If it is a [`KeyObject`][], its type must be `secret`.

Esempio: generazione dell'HMAC sha256 di un file

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream(filename);
input.on('readable', () => {
  // Only one element is going to be produced by the
  // hash stream.
  const data = input.read();
  if (data)
    hmac.update(data);
  else {
    console.log(`${hmac.digest('hex')} ${filename}`);
  }
});
```

### `crypto.createPrivateKey(key)`
<!-- YAML
added: v11.6.0
-->

* `key` {Object | string | Buffer}
  * `key`: {string | Buffer} The key material, either in PEM or DER format.
  * `format`: {string} Must be `'pem'` or `'der'`. **Default:** `'pem'`.
  * `type`: {string} Must be `'pkcs1'`, `'pkcs8'` or `'sec1'`. This option is required only if the `format` is `'der'` and ignored if it is `'pem'`.
  * `passphrase`: {string | Buffer} The passphrase to use for decryption.
* Returns: {KeyObject}

Creates and returns a new key object containing a private key. If `key` is a string or `Buffer`, `format` is assumed to be `'pem'`; otherwise, `key` must be an object with the properties described above.

If the private key is encrypted, a `passphrase` must be specified. The length of the passphrase is limited to 1024 bytes.

### `crypto.createPublicKey(key)`
<!-- YAML
added: v11.6.0
changes:
  - version: v11.13.0
    pr-url: https://github.com/nodejs/node/pull/26278
    description: The `key` argument can now be a `KeyObject` with type
                 `private`.
  - version: v11.7.0
    pr-url: https://github.com/nodejs/node/pull/25217
    description: The `key` argument can now be a private key.
-->

* `key` {Object | string | Buffer | KeyObject}
  * `key`: {string | Buffer}
  * `format`: {string} Must be `'pem'` or `'der'`. **Default:** `'pem'`.
  * `type`: {string} Must be `'pkcs1'` or `'spki'`. This option is required only if the `format` is `'der'`.
* Returns: {KeyObject}

Creates and returns a new key object containing a public key. If `key` is a string or `Buffer`, `format` is assumed to be `'pem'`; if `key` is a `KeyObject` with type `'private'`, the public key is derived from the given private key; otherwise, `key` must be an object with the properties described above.

If the format is `'pem'`, the `'key'` may also be an X.509 certificate.

Because public keys can be derived from private keys, a private key may be passed instead of a public key. In that case, this function behaves as if [`crypto.createPrivateKey()`][] had been called, except that the type of the returned `KeyObject` will be `'public'` and that the private key cannot be extracted from the returned `KeyObject`. Similarly, if a `KeyObject` with type `'private'` is given, a new `KeyObject` with type `'public'` will be returned and it will be impossible to extract the private key from the returned object.

### `crypto.createSecretKey(key)`
<!-- YAML
added: v11.6.0
-->

* `key` {Buffer}
* Returns: {KeyObject}

Creates and returns a new key object containing a secret key for symmetric encryption or `Hmac`.

### `crypto.createSign(algorithm[, options])`
<!-- YAML
added: v0.1.92
-->

* `algorithm` {string}
* `options` {Object} [`stream.Writable` options][]
* Restituisce: {Sign}

Crea e restituisce un `Sign` object che utilizza l'`algorithm` specificato.  Use [`crypto.getHashes()`][] to obtain the names of the available digest algorithms. Optional `options` argument controls the `stream.Writable` behavior.

In some cases, a `Sign` instance can be created using the name of a signature algorithm, such as `'RSA-SHA256'`, instead of a digest algorithm. This will use the corresponding digest algorithm. This does not work for all signature algorithms, such as `'ecdsa-with-SHA256'`, so it is best to always use digest algorithm names.

### `crypto.createVerify(algorithm[, options])`
<!-- YAML
added: v0.1.92
-->

* `algorithm` {string}
* `options` {Object} [`stream.Writable` options][]
* Restituisce: {Verify}

Crea e restituisce un `Verify` object che utilizza l'algoritmo specificato. Utilizza [`crypto.getHashes()`][] per ottenere un array di nomi degli algoritmi per la firma disponibili. Optional `options` argument controls the `stream.Writable` behavior.

In some cases, a `Verify` instance can be created using the name of a signature algorithm, such as `'RSA-SHA256'`, instead of a digest algorithm. This will use the corresponding digest algorithm. This does not work for all signature algorithms, such as `'ecdsa-with-SHA256'`, so it is best to always use digest algorithm names.

### `crypto.diffieHellman(options)`
<!-- YAML
added: v13.9.0
-->

* `options`: {Object}
  * `privateKey`: {KeyObject}
  * `publicKey`: {KeyObject}
* Restituisce: {Buffer}

Computes the Diffie-Hellman secret based on a `privateKey` and a `publicKey`. Both keys must have the same `asymmetricKeyType`, which must be one of `'dh'` (for Diffie-Hellman), `'ec'` (for ECDH), `'x448'`, or `'x25519'` (for ECDH-ES).

### `crypto.generateKeyPair(type, options, callback)`
<!-- YAML
added: v10.12.0
changes:
  - version: v13.9.0
    pr-url: https://github.com/nodejs/node/pull/31178
    description: Add support for Diffie-Hellman.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26774
    description: Add ability to generate X25519 and X448 key pairs.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26554
    description: Add ability to generate Ed25519 and Ed448 key pairs.
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: The `generateKeyPair` and `generateKeyPairSync` functions now
                 produce key objects if no encoding was specified.
-->

* `type`: {string} Must be `'rsa'`, `'dsa'`, `'ec'`, `'ed25519'`, `'ed448'`, `'x25519'`, `'x448'`, or `'dh'`.
* `options`: {Object}
  * `modulusLength`: {number} Key size in bits (RSA, DSA).
  * `publicExponent`: {number} Public exponent (RSA). **Default:** `0x10001`.
  * `divisorLength`: {number} Size of `q` in bits (DSA).
  * `namedCurve`: {string} Name of the curve to use (EC).
  * `prime`: {Buffer} The prime parameter (DH).
  * `primeLength`: {number} Prime length in bits (DH).
  * `generator`: {number} Custom generator (DH). **Default:** `2`.
  * `groupName`: {string} Diffie-Hellman group name (DH). See [`crypto.getDiffieHellman()`][].
  * `publicKeyEncoding`: {Object} See [`keyObject.export()`][].
  * `privateKeyEncoding`: {Object} See [`keyObject.export()`][].
* `callback`: {Function}
  * `err`: {Error}
  * `publicKey`: {string | Buffer | KeyObject}
  * `privateKey`: {string | Buffer | KeyObject}

Generates a new asymmetric key pair of the given `type`. RSA, DSA, EC, Ed25519, Ed448, X25519, X448, and DH are currently supported.

If a `publicKeyEncoding` or `privateKeyEncoding` was specified, this function behaves as if [`keyObject.export()`][] had been called on its result. Otherwise, the respective part of the key is returned as a [`KeyObject`][].

It is recommended to encode public keys as `'spki'` and private keys as `'pkcs8'` with encryption for long-term storage:

```js
const { generateKeyPair } = require('crypto');
generateKeyPair('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'top secret'
  }
}, (err, publicKey, privateKey) => {
  // Handle errors and use the generated key pair.
});
```

On completion, `callback` will be called with `err` set to `undefined` and `publicKey` / `privateKey` representing the generated key pair.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `publicKey` and `privateKey` properties.

### `crypto.generateKeyPairSync(type, options)`
<!-- YAML
added: v10.12.0
changes:
  - version: v13.9.0
    pr-url: https://github.com/nodejs/node/pull/31178
    description: Add support for Diffie-Hellman.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26554
    description: Add ability to generate Ed25519 and Ed448 key pairs.
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: The `generateKeyPair` and `generateKeyPairSync` functions now
                 produce key objects if no encoding was specified.
-->

* `type`: {string} Must be `'rsa'`, `'dsa'`, `'ec'`, `'ed25519'`, `'ed448'`, `'x25519'`, `'x448'`, or `'dh'`.
* `options`: {Object}
  * `modulusLength`: {number} Key size in bits (RSA, DSA).
  * `publicExponent`: {number} Public exponent (RSA). **Default:** `0x10001`.
  * `divisorLength`: {number} Size of `q` in bits (DSA).
  * `namedCurve`: {string} Name of the curve to use (EC).
  * `prime`: {Buffer} The prime parameter (DH).
  * `primeLength`: {number} Prime length in bits (DH).
  * `generator`: {number} Custom generator (DH). **Default:** `2`.
  * `groupName`: {string} Diffie-Hellman group name (DH). See [`crypto.getDiffieHellman()`][].
  * `publicKeyEncoding`: {Object} See [`keyObject.export()`][].
  * `privateKeyEncoding`: {Object} See [`keyObject.export()`][].
* Restituisce: {Object}
  * `publicKey`: {string | Buffer | KeyObject}
  * `privateKey`: {string | Buffer | KeyObject}

Generates a new asymmetric key pair of the given `type`. RSA, DSA, EC, Ed25519, Ed448, X25519, X448, and DH are currently supported.

If a `publicKeyEncoding` or `privateKeyEncoding` was specified, this function behaves as if [`keyObject.export()`][] had been called on its result. Otherwise, the respective part of the key is returned as a [`KeyObject`][].

When encoding public keys, it is recommended to use `'spki'`. When encoding private keys, it is recommended to use `'pks8'` with a strong passphrase, and to keep the passphrase confidential.

```js
const { generateKeyPairSync } = require('crypto');
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'top secret'
  }
});
```

The return value `{ publicKey, privateKey }` represents the generated key pair. When PEM encoding was selected, the respective key will be a string, otherwise it will be a buffer containing the data encoded as DER.

### `crypto.getCiphers()`
<!-- YAML
added: v0.9.3
-->

* Returns: {string[]} An array with the names of the supported cipher algorithms.

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### `crypto.getCurves()`
<!-- YAML
added: v2.3.0
-->

* Restituisce: {string[]} Un array con i nomi delle curve ellittiche supportate.

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### `crypto.getDiffieHellman(groupName)`
<!-- YAML
added: v0.7.5
-->

* `groupName` {string}
* Returns: {DiffieHellmanGroup}

Creates a predefined `DiffieHellmanGroup` key exchange object. I gruppi supportati sono: `'modp1'`, `'modp2'`, `'modp5'` (definiti nel documento [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), ma vedi anche gli [Avvertimenti](#crypto_support_for_weak_or_compromised_algorithms)) e `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (definiti nel documento [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). The returned object mimics the interface of objects created by [`crypto.createDiffieHellman()`][], but will not allow changing the keys (with [`diffieHellman.setPublicKey()`][], for example). Il vantaggio dell'utilizzo di questo metodo è che le parti non devono generare né scambiare preventivamente un modulo di gruppo, risparmiando tempo per il processore e la comunicazione.

Esempio (ottenendo una chiave segreta condivisa):

```js
const crypto = require('crypto');
const alice = crypto.getDiffieHellman('modp14');
const bob = crypto.getDiffieHellman('modp14');

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

/* aliceSecret e bobSecret dovrebbero essere uguali */
console.log(aliceSecret === bobSecret);
```

### `crypto.getFips()`
<!-- YAML
added: v10.0.0
-->

* Returns: {boolean} `true` if and only if a FIPS compliant crypto provider is currently in use.

### `crypto.getHashes()`
<!-- YAML
added: v0.9.3
-->

* Returns: {string[]} An array of the names of the supported hash algorithms, such as `'RSA-SHA256'`. Hash algorithms are also called "digest" algorithms.

```js
const hashes = crypto.getHashes();
console.log(hashes); // ['DSA', 'DSA-SHA', 'DSA-SHA1', ...]
```

### `crypto.pbkdf2(password, salt, iterations, keylen, digest, callback)`
<!-- YAML
added: v0.5.5
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11305
    description: The `digest` parameter is always required now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4047
    description: Calling this function without passing the `digest` parameter
                 is deprecated now and will emit a warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default encoding for `password` if it is a string changed
                 from `binary` to `utf8`.
-->

* `password` {string|Buffer|TypedArray|DataView}
* `salt` {string|Buffer|TypedArray|DataView}
* `iterations` {number}
* `keylen` {number}
* `digest` {string}
* `callback` {Function}
  * `err` {Error}
  * `derivedKey` {Buffer}

Fornisce un'implementazione asincrona della Password-Based Key Derivation Function 2 (PBKDF2). Viene applicato un algoritmo dell'HMAC digest selezionato specificato da `digest` per derivare una chiave della lunghezza di byte richiesta (`keylen`) dalla `password`, dal `salt` e dalle `iterations`.

La funzione `callback` fornita viene chiamata con due argomenti: `err` e `derivedKey`. If an error occurs while deriving the key, `err` will be set; otherwise `err` will be `null`. By default, the successfully generated `derivedKey` will be passed to the callback as a [`Buffer`][]. An error will be thrown if any of the input arguments specify invalid values or types.

If `digest` is `null`, `'sha1'` will be used. This behavior is deprecated, please specify a `digest` explicitly.

L'argomento `iterations` dev'essere un numero impostato con il valore più alto possibile. Maggiore è il numero di iterazioni, più sicura sarà la chiave derivata, ma sarà necessario più tempo per completarla.

The `salt` should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...08d59ae'
});
```

The `crypto.DEFAULT_ENCODING` property can be used to change the way the `derivedKey` is passed to the callback. This property, however, has been deprecated and use should be avoided.

```js
const crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'hex';
crypto.pbkdf2('secret', 'salt', 100000, 512, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey);  // '3745e48...aa39b34'
});
```

Può essere recuperato un array di funzioni digest supportate utilizzando [`crypto.getHashes()`][].

This API uses libuv's threadpool, which can have surprising and negative performance implications for some applications; see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

### `crypto.pbkdf2Sync(password, salt, iterations, keylen, digest)`
<!-- YAML
added: v0.9.3
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4047
    description: Calling this function without passing the `digest` parameter
                 is deprecated now and will emit a warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default encoding for `password` if it is a string changed
                 from `binary` to `utf8`.
-->

* `password` {string|Buffer|TypedArray|DataView}
* `salt` {string|Buffer|TypedArray|DataView}
* `iterations` {number}
* `keylen` {number}
* `digest` {string}
* Restituisce: {Buffer}

Fornisce un'implementazione sincrona della Password-Based Key Derivation Function 2 (PBKDF2). Viene applicato un algoritmo dell'HMAC digest selezionato specificato da `digest` per derivare una chiave della lunghezza di byte richiesta (`keylen`) dalla `password`, dal `salt` e dalle `iterations`.

If an error occurs an `Error` will be thrown, otherwise the derived key will be returned as a [`Buffer`][].

If `digest` is `null`, `'sha1'` will be used. This behavior is deprecated, please specify a `digest` explicitly.

L'argomento `iterations` dev'essere un numero impostato con il valore più alto possibile. Maggiore è il numero di iterazioni, più sicura sarà la chiave derivata, ma sarà necessario più tempo per completarla.

The `salt` should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512');
console.log(key.toString('hex'));  // '3745e48...08d59ae'
```

The `crypto.DEFAULT_ENCODING` property may be used to change the way the `derivedKey` is returned. This property, however, is deprecated and use should be avoided.

```js
const crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'hex';
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 512, 'sha512');
console.log(key);  // '3745e48...aa39b34'
```

Può essere recuperato un array di funzioni digest supportate utilizzando [`crypto.getHashes()`][].

### `crypto.privateDecrypt(privateKey, buffer)`
<!-- YAML
added: v0.11.14
changes:
  - version: v12.11.0
    pr-url: https://github.com/nodejs/node/pull/29489
    description: The `oaepLabel` option was added.
  - version: v12.9.0
    pr-url: https://github.com/nodejs/node/pull/28335
    description: The `oaepHash` option was added.
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: This function now supports key objects.
-->

* `privateKey` {Object | string | Buffer | KeyObject}
  * `oaepHash` {string} The hash function to use for OAEP padding. **Default:** `'sha1'`
  * `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `crypto.constants.RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Restituisce: {Buffer} Un nuovo `Buffer` con il contenuto decifrato.

Decifra il `buffer` con la `privateKey`. `buffer` was previously encrypted using the corresponding public key, for example using [`crypto.publicEncrypt()`][].

If `privateKey` is not a [`KeyObject`][], this function behaves as if `privateKey` had been passed to [`crypto.createPrivateKey()`][]. If it is an object, the `padding` property can be passed. Otherwise, this function uses `RSA_PKCS1_OAEP_PADDING`.

### `crypto.privateEncrypt(privateKey, buffer)`
<!-- YAML
added: v1.1.0
changes:
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: This function now supports key objects.
-->

* `privateKey` {Object | string | Buffer | KeyObject}
  * `key` {string | Buffer | KeyObject} A PEM encoded private key.
  * `passphrase` {string | Buffer} An optional passphrase for the private key.
  * `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `crypto.constants.RSA_PKCS1_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Restituisce: {Buffer} Un nuovo `Buffer` con il contenuto cifrato.

Codifica il `buffer` con la `privateKey`. The returned data can be decrypted using the corresponding public key, for example using [`crypto.publicDecrypt()`][].

If `privateKey` is not a [`KeyObject`][], this function behaves as if `privateKey` had been passed to [`crypto.createPrivateKey()`][]. If it is an object, the `padding` property can be passed. Otherwise, this function uses `RSA_PKCS1_PADDING`.

### `crypto.publicDecrypt(key, buffer)`
<!-- YAML
added: v1.1.0
changes:
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: This function now supports key objects.
-->

* `key` {Object | string | Buffer | KeyObject}
  * `passphrase` {string | Buffer} An optional passphrase for the private key.
  * `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `crypto.constants.RSA_PKCS1_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Restituisce: {Buffer} Un nuovo `Buffer` con il contenuto decifrato.

Decrypts `buffer` with `key`.`buffer` was previously encrypted using the corresponding private key, for example using [`crypto.privateEncrypt()`][].

If `key` is not a [`KeyObject`][], this function behaves as if `key` had been passed to [`crypto.createPublicKey()`][]. If it is an object, the `padding` property can be passed. Otherwise, this function uses `RSA_PKCS1_PADDING`.

Poiché le chiavi pubbliche RSA possono essere derivate da chiavi private, potrebbe essere passata una chiave privata al posto della chiave pubblica.

### `crypto.publicEncrypt(key, buffer)`
<!-- YAML
added: v0.11.14
changes:
  - version: v12.11.0
    pr-url: https://github.com/nodejs/node/pull/29489
    description: The `oaepLabel` option was added.
  - version: v12.9.0
    pr-url: https://github.com/nodejs/node/pull/28335
    description: The `oaepHash` option was added.
  - version: v11.6.0
    pr-url: https://github.com/nodejs/node/pull/24234
    description: This function now supports key objects.
-->

* `key` {Object | string | Buffer | KeyObject}
  * `key` {string | Buffer | KeyObject} A PEM encoded public or private key.
  * `oaepHash` {string} The hash function to use for OAEP padding. **Default:** `'sha1'`
  * `passphrase` {string | Buffer} An optional passphrase for the private key.
  * `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `crypto.constants.RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Restituisce: {Buffer} Un nuovo `Buffer` con il contenuto cifrato.

Encrypts the content of `buffer` with `key` and returns a new [`Buffer`][] with encrypted content. The returned data can be decrypted using the corresponding private key, for example using [`crypto.privateDecrypt()`][].

If `key` is not a [`KeyObject`][], this function behaves as if `key` had been passed to [`crypto.createPublicKey()`][]. If it is an object, the `padding` property can be passed. Otherwise, this function uses `RSA_PKCS1_OAEP_PADDING`.

Poiché le chiavi pubbliche RSA possono essere derivate da chiavi private, potrebbe essere passata una chiave privata al posto della chiave pubblica.

### `crypto.randomBytes(size[, callback])`
<!-- YAML
added: v0.5.8
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/16454
    description: Passing `null` as the `callback` argument now throws
                 `ERR_INVALID_CALLBACK`.
-->

* `size` {number}
* `callback` {Function}
  * `err` {Error}
  * `buf` {Buffer}
* Restituisce: {Buffer} se non viene fornita la funzione `callback`.

Genera dati pseudo casuali crittograficamente forti. L'argomento `size` è un numero che indica il numero di byte da generare.

Se viene fornita una funzione `callback`, i byte vengono generati in modo asincrono e la funzione `callback` viene invocata con due argomenti: `err` e `buf`. Se si verifica un errore, `err` sarà un `Error` object; in caso contrario sarà `null`. L'argomento `buf` è un [`Buffer`][] contenente i byte generati.

```js
// Asincrono
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
```

Se non viene fornita la funzione `callback`, i byte casuali vengono generati in modo sincrono e restituiti come un [`Buffer`][]. Verrà generato un errore se si verifica un problema nella generazione dei byte.

```js
// Sincrono
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} bytes of random data: ${buf.toString('hex')}`);
```

Il metodo `crypto.randomBytes()` non verrà completato finché non ci sarà sufficiente entropia disponibile. Questo normalmente non dovrebbe mai richiedere più di qualche millisecondo. L'unico momento in cui la generazione dei byte casuali può teoricamente bloccarsi per un periodo di tempo più lungo è subito dopo l'avvio, quando l'intero sistema ha ancora un basso livello di entropia.

This API uses libuv's threadpool, which can have surprising and negative performance implications for some applications; see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

The asynchronous version of `crypto.randomBytes()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomBytes` requests when doing so as part of fulfilling a client request.

### `crypto.randomFillSync(buffer[, offset][, size])`
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15231
    description: The `buffer` argument may be any `TypedArray` or `DataView`.
-->

* `buffer` {Buffer|TypedArray|DataView} Dev'essere fornito.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* Returns: {Buffer|TypedArray|DataView} The object passed as `buffer` argument.

Versione sincrona di [`crypto.randomFill()`][].

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// Il codice qui sopra è equivalente al seguente:
crypto.randomFillSync(buf, 5, 5);
console.log(buf.toString('hex'));
```

Qualsiasi istanza `TypedArray` o `DataView` può essere passata come `buffer`.

```js
const a = new Uint32Array(10);
console.log(Buffer.from(crypto.randomFillSync(a).buffer,
                        a.byteOffset, a.byteLength).toString('hex'));

const b = new Float64Array(10);
console.log(Buffer.from(crypto.randomFillSync(b).buffer,
                        b.byteOffset, b.byteLength).toString('hex'));

const c = new DataView(new ArrayBuffer(10));
console.log(Buffer.from(crypto.randomFillSync(c).buffer,
                        c.byteOffset, c.byteLength).toString('hex'));
```

### `crypto.randomFill(buffer[, offset][, size], callback)`
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15231
    description: The `buffer` argument may be any `TypedArray` or `DataView`.
-->

* `buffer` {Buffer|TypedArray|DataView} Dev'essere fornito.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* `callback` {Function} `function(err, buf) {}`.

Questa funzione è simile a [`crypto.randomBytes()`][] ma richiede che il primo argomento sia un [`Buffer`][] che verrà riempito. Richiede inoltre che venga passato un callback.

Se non viene fornita la funzione `callback`, verrà generato un errore.

```js
const buf = Buffer.alloc(10);
crypto.randomFill(buf, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

crypto.randomFill(buf, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

// Il codice qui sopra è equivalente al seguente:
crypto.randomFill(buf, 5, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

Qualsiasi istanza `TypedArray` o `DataView` può essere passata come `buffer`.

```js
const a = new Uint32Array(10);
crypto.randomFill(a, (err, buf) => {
  if (err) throw err;
  console.log(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
    .toString('hex'));
});

const b = new Float64Array(10);
crypto.randomFill(b, (err, buf) => {
  if (err) throw err;
  console.log(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
    .toString('hex'));
});

const c = new DataView(new ArrayBuffer(10));
crypto.randomFill(c, (err, buf) => {
  if (err) throw err;
  console.log(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
    .toString('hex'));
});
```

This API uses libuv's threadpool, which can have surprising and negative performance implications for some applications; see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

The asynchronous version of `crypto.randomFill()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomFill` requests when doing so as part of fulfilling a client request.

### `crypto.scrypt(password, salt, keylen[, options], callback)`
<!-- YAML
added: v10.5.0
changes:
  - version: v12.8.0
    pr-url: https://github.com/nodejs/node/pull/28799
    description: The `maxmem` value can now be any safe integer.
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21525
    description: The `cost`, `blockSize` and `parallelization` option names
                 have been added.
-->

* `password` {string|Buffer|TypedArray|DataView}
* `salt` {string|Buffer|TypedArray|DataView}
* `keylen` {number}
* `options` {Object}
  * `cost` {number} CPU/memory cost parameter. Must be a power of two greater than one. **Default:** `16384`.
  * `blockSize` {number} Block size parameter. **Default:** `8`.
  * `parallelization` {number} Parallelization parameter. **Default:** `1`.
  * `N` {number} Alias for `cost`. Only one of both may be specified.
  * `r` {number} Alias for `blockSize`. Only one of both may be specified.
  * `p` {number} Alias for `parallelization`. Only one of both may be specified.
  * `maxmem` {number} Memory upper bound. It is an error when (approximately) `128 * N * r > maxmem`. **Default:** `32 * 1024 * 1024`.
* `callback` {Function}
  * `err` {Error}
  * `derivedKey` {Buffer}

Provides an asynchronous [scrypt](https://en.wikipedia.org/wiki/Scrypt) implementation. Scrypt is a password-based key derivation function that is designed to be expensive computationally and memory-wise in order to make brute-force attacks unrewarding.

The `salt` should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

The `callback` function is called with two arguments: `err` and `derivedKey`. `err` is an exception object when key derivation fails, otherwise `err` is `null`. `derivedKey` is passed to the callback as a [`Buffer`][].

An exception is thrown when any of the input arguments specify invalid values or types.

```js
const crypto = require('crypto');
// Using the factory defaults.
crypto.scrypt('secret', 'salt', 64, (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...08d59ae'
});
// Using a custom N parameter. Must be a power of two.
crypto.scrypt('secret', 'salt', 64, { N: 1024 }, (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...aa39b34'
});
```

### `crypto.scryptSync(password, salt, keylen[, options])`
<!-- YAML
added: v10.5.0
changes:
  - version: v12.8.0
    pr-url: https://github.com/nodejs/node/pull/28799
    description: The `maxmem` value can now be any safe integer.
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21525
    description: The `cost`, `blockSize` and `parallelization` option names
                 have been added.
-->

* `password` {string|Buffer|TypedArray|DataView}
* `salt` {string|Buffer|TypedArray|DataView}
* `keylen` {number}
* `options` {Object}
  * `cost` {number} CPU/memory cost parameter. Must be a power of two greater than one. **Default:** `16384`.
  * `blockSize` {number} Block size parameter. **Default:** `8`.
  * `parallelization` {number} Parallelization parameter. **Default:** `1`.
  * `N` {number} Alias for `cost`. Only one of both may be specified.
  * `r` {number} Alias for `blockSize`. Only one of both may be specified.
  * `p` {number} Alias for `parallelization`. Only one of both may be specified.
  * `maxmem` {number} Memory upper bound. It is an error when (approximately) `128 * N * r > maxmem`. **Default:** `32 * 1024 * 1024`.
* Restituisce: {Buffer}

Provides a synchronous [scrypt](https://en.wikipedia.org/wiki/Scrypt) implementation. Scrypt is a password-based key derivation function that is designed to be expensive computationally and memory-wise in order to make brute-force attacks unrewarding.

The `salt` should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

An exception is thrown when key derivation fails, otherwise the derived key is returned as a [`Buffer`][].

An exception is thrown when any of the input arguments specify invalid values or types.

```js
const crypto = require('crypto');
// Using the factory defaults.
const key1 = crypto.scryptSync('secret', 'salt', 64);
console.log(key1.toString('hex'));  // '3745e48...08d59ae'
// Using a custom N parameter. Must be a power of two.
const key2 = crypto.scryptSync('secret', 'salt', 64, { N: 1024 });
console.log(key2.toString('hex'));  // '3745e48...aa39b34'
```

### `crypto.setEngine(engine[, flags])`
<!-- YAML
added: v0.11.11
-->

* `engine` {string}
* `flags` {crypto.constants} **Default:** `crypto.constants.ENGINE_METHOD_ALL`

Carica e imposta l'`engine` per alcune o per tutte le funzioni di OpenSSL (selezionate dai flag).

L'`engine` potrebbe essere un ID oppure un percorso della libreria dell'engine condivisa.

L'argomento `flags` opzionale utilizza `ENGINE_METHOD_ALL` come impostazione predefinita. L'argomento `flags` è un campo di bit che prende uno o un insieme dei seguenti flag (definiti all'interno di `crypto.constants`):

* `crypto.constants.ENGINE_METHOD_RSA`
* `crypto.constants.ENGINE_METHOD_DSA`
* `crypto.constants.ENGINE_METHOD_DH`
* `crypto.constants.ENGINE_METHOD_RAND`
* `crypto.constants.ENGINE_METHOD_EC`
* `crypto.constants.ENGINE_METHOD_CIPHERS`
* `crypto.constants.ENGINE_METHOD_DIGESTS`
* `crypto.constants.ENGINE_METHOD_PKEY_METHS`
* `crypto.constants.ENGINE_METHOD_PKEY_ASN1_METHS`
* `crypto.constants.ENGINE_METHOD_ALL`
* `crypto.constants.ENGINE_METHOD_NONE`

I flag qui sotto sono obsoleti su OpenSSL-1.1.0.

* `crypto.constants.ENGINE_METHOD_ECDH`
* `crypto.constants.ENGINE_METHOD_ECDSA`
* `crypto.constants.ENGINE_METHOD_STORE`

### `crypto.setFips(bool)`
<!-- YAML
added: v10.0.0
-->

* `bool` {boolean} `true` per abilitare la modalità FIPS.

Abilita il provider crittografico compatibile con le norme FIPS in un build Node.js abilitato per le norme FIPS. Se la modalità FIPS non è disponibile, genera un errore.

### `crypto.sign(algorithm, data, key)`
<!-- YAML
added: v12.0.0
-->

* `algorithm` {string | null | undefined}
* `data` {Buffer | TypedArray | DataView}
* `key` {Object | string | Buffer | KeyObject}
* Restituisce: {Buffer}

Calculates and returns the signature for `data` using the given private key and algorithm. If `algorithm` is `null` or `undefined`, then the algorithm is dependent upon the key type (especially Ed25519 and Ed448).

If `key` is not a [`KeyObject`][], this function behaves as if `key` had been passed to [`crypto.createPrivateKey()`][]. If it is an object, the following additional properties can be passed:

* `dsaEncoding` {string} For DSA and ECDSA, this option specifies the format of the generated signature. It can be one of the following:
  * `'der'` (default): DER-encoded ASN.1 signature structure encoding `(r, s)`.
  * `'ieee-p1363'`: Signature format `r || s` as proposed in IEEE-P1363.
* `padding` {integer} Optional padding value for RSA, one of the following:
  * `crypto.constants.RSA_PKCS1_PADDING` (valore di default)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function used to sign the message as specified in section 3.1 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength` {integer} Salt length for when padding is `RSA_PKCS1_PSS_PADDING`. Il valore speciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` imposta la lunghezza del salt nella dimensione del digest, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (valore di default) lo imposta sul valore massimo consentito.

### `crypto.timingSafeEqual(a, b)`
<!-- YAML
added: v6.6.0
-->

* `a` {Buffer | TypedArray | DataView}
* `b` {Buffer | TypedArray | DataView}
* Restituisce: {boolean}

Questa funzione è basata su un algoritmo di durata costante. Restituisce true se `a` è uguale a `b`, senza perdite di informazioni temporali che permetterebbero ad un utente malintenzionato di indovinare uno dei valori. E' adatto per confrontare gli HMAC digest o i valori segreti come ad esempio i cookie di autenticazione oppure gli [URL di capacità](https://www.w3.org/TR/capability-urls/).

`a` and `b` must both be `Buffer`s, `TypedArray`s, or `DataView`s, and they must have the same length.

Use of `crypto.timingSafeEqual` does not guarantee that the *surrounding* code is timing-safe. Care should be taken to ensure that the surrounding code does not introduce timing vulnerabilities.

### `crypto.verify(algorithm, data, key, signature)`
<!-- YAML
added: v12.0.0
-->

* `algorithm` {string | null | undefined}
* `data` {Buffer | TypedArray | DataView}
* `key` {Object | string | Buffer | KeyObject}
* `signature` {Buffer | TypedArray | DataView}
* Restituisce: {boolean}

Verifies the given signature for `data` using the given key and algorithm. If `algorithm` is `null` or `undefined`, then the algorithm is dependent upon the key type (especially Ed25519 and Ed448).

If `key` is not a [`KeyObject`][], this function behaves as if `key` had been passed to [`crypto.createPublicKey()`][]. If it is an object, the following additional properties can be passed:

* `dsaEncoding` {string} For DSA and ECDSA, this option specifies the format of the generated signature. It can be one of the following:
  * `'der'` (default): DER-encoded ASN.1 signature structure encoding `(r, s)`.
  * `'ieee-p1363'`: Signature format `r || s` as proposed in IEEE-P1363.
* `padding` {integer} Optional padding value for RSA, one of the following:
  * `crypto.constants.RSA_PKCS1_PADDING` (valore di default)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function used to sign the message as specified in section 3.1 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength` {integer} Salt length for when padding is `RSA_PKCS1_PSS_PADDING`. Il valore speciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` imposta la lunghezza del salt nella dimensione del digest, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (valore di default) lo imposta sul valore massimo consentito.

The `signature` argument is the previously calculated signature for the `data`.

Because public keys can be derived from private keys, a private key or a public key may be passed for `key`.

## Note

### Legacy Stream API (pre Node.js v0.10)

Il modulo Crypto è stato aggiunto a Node.js prima che esistesse il concetto di Stream API unificata e prima che esistessero i [`Buffer`][] object per la gestione dei dati binari. Pertanto, molte delle classi definite `crypto` hanno metodi che non si trovano in genere su altre classi Node.js che implementano gli [stream](stream.html) API (ad esempio `update()`, `final()` o `digest()`). Also, many methods accepted and returned `'latin1'` encoded strings by default rather than `Buffer`s. Questo valore di default è stato modificato dopo Node.js v0.8 per utilizzare i [`Buffer`][] object di default.

### Recenti Modifiche di ECDH

E' stato semplificato l'utilizzo di `ECDH` con coppie di chiavi generate in modo non dinamico. Ora [`ecdh.setPrivateKey()`][] può essere chiamato con una chiave privata preselezionata e il public point (key) associato verrà calcolato e memorizzato all'interno dell'object. Ciò consente al codice di memorizzare e fornire solo la parte privata della coppia di chiavi EC. Adesso [`ecdh.setPrivateKey()`][] verifica anche che la chiave privata sia valida per la curva selezionata.

Adesso il metodo [`ecdh.setPublicKey()`][] è deprecato/obsoleto poiché la sua inclusione nell'API è inutile. Dovrebbe essere impostata una chiave privata precedentemente archiviata la quale genera automaticamente la chiave pubblica associata oppure dovrebbe essere chiamato [`ecdh.generateKeys()`][]. Lo svantaggio principale dell'utilizzare [`ecdh.setPublicKey()`][] è che può essere usato per mettere la coppia di chiavi ECDH in uno stato incoerente.

### Supporto per gli algoritmi deboli o compromessi

Il modulo `crypto` supporta ancora alcuni algoritmi già compromessi e il cui utilizzo è attualmente sconsigliato. The API also allows the use of ciphers and hashes with a small key size that are too weak for safe use.

Gli utenti devono assumersi la piena responsabilità della scelta dell'algoritmo crypto e della dimensione della chiave in base ai propri requisiti di sicurezza.

In base alle raccomandazioni del documento [NIST SP 800-131A](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

* MD5 e SHA-1 non sono più accettabili dov'è richiesta la resistenza alle collisioni come ad esempio con le firme digitali.
* The key used with RSA, DSA, and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
* I gruppi DH di `modp1`, `modp2` e `modp5` hanno chiavi di dimensioni inferiori a 2048 bit e di conseguenza ne è sconsigliato l'utilizzo.

Vedi il riferimento per ulteriori raccomandazioni e dettagli.

### Modalità CCM

CCM is one of the supported [AEAD algorithms](https://en.wikipedia.org/wiki/Authenticated_encryption). Applications which use this mode must adhere to certain restrictions when using the cipher API:

* The authentication tag length must be specified during cipher creation by setting the `authTagLength` option and must be one of 4, 6, 8, 10, 12, 14 or 16 bytes.
* The length of the initialization vector (nonce) `N` must be between 7 and 13 bytes (`7 ≤ N ≤ 13`).
* La lunghezza del plaintext (testo non codificato) è limitata a `2 ** (8 * (15 - N))` byte.
* When decrypting, the authentication tag must be set via `setAuthTag()` before calling `update()`. Otherwise, decryption will fail and `final()` will throw an error in compliance with section 2.6 of [RFC 3610](https://www.rfc-editor.org/rfc/rfc3610.txt).
* Using stream methods such as `write(data)`, `end(data)` or `pipe()` in CCM mode might fail as CCM cannot handle more than one chunk of data per instance.
* When passing additional authenticated data (AAD), the length of the actual message in bytes must be passed to `setAAD()` via the `plaintextLength` option. Questo non è necessario se non viene utilizzato nessun AAD.
* As CCM processes the whole message at once, `update()` can only be called once.
* Even though calling `update()` is sufficient to encrypt/decrypt the message, applications *must* call `final()` to compute or verify the authentication tag.

```js
const crypto = require('crypto');

const key = 'keykeykeykeykeykeykeykey';
const nonce = crypto.randomBytes(12);

const aad = Buffer.from('0123456789', 'hex');

const cipher = crypto.createCipheriv('aes-192-ccm', key, nonce, {
  authTagLength: 16
});
const plaintext = 'Hello world';
cipher.setAAD(aad, {
  plaintextLength: Buffer.byteLength(plaintext)
});
const ciphertext = cipher.update(plaintext, 'utf8');
cipher.final();
const tag = cipher.getAuthTag();

// Adesso trasmetti { ciphertext, nonce, tag }.

const decipher = crypto.createDecipheriv('aes-192-ccm', key, nonce, {
  authTagLength: 16
});
decipher.setAuthTag(tag);
decipher.setAAD(aad, {
  plaintextLength: ciphertext.length
});
const receivedPlaintext = decipher.update(ciphertext, null, 'utf8');

try {
  decipher.final();
} catch (err) {
  console.error('Authentication failed!');
  return;
}

console.log(receivedPlaintext);
```

## Costanti Crypto

Le seguenti costanti esportate da `crypto.constants` si applicano a vari utilizzi dei moduli `crypto`, `tls` e `https` e sono generalmente specifici per OpenSSL.

### Opzioni OpenSSL

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Applica molteplici soluzioni alternative ai bug all'interno di OpenSSL. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>
    for detail.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Permette una rinegoziazione legacy non sicura tra OpenSSL e i client o i server senza patch. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Cerca di utilizzare le preferenze del server anziché quelle del client quando si seleziona un cipher. Il comportamento dipende dalla versione del protocollo. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CISCO_ANYCONNECT</code></td>
    <td>Dà istruzioni a OpenSSL di utilizzare la versione "speshul" di Cisco di DTLS_BAD_VER.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_COOKIE_EXCHANGE</code></td>
    <td>Dà istruzioni a OpenSSL di attivare lo scambio di cookie.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CRYPTOPRO_TLSEXT_BUG</code></td>
    <td>Dà istruzioni a OpenSSL di aggiungere un'estensione server-hello da una versione precedente della bozza cryptopro.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS</code></td>
    <td>Dà istruzioni a OpenSSL di disabilitare una soluzione alternativa di vulnerabilità SSL 3.0/TLS 1.0 aggiunta in OpenSSL 0.9.6d.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_EPHEMERAL_RSA</code></td>
    <td>Dà istruzioni a OpenSSL di utilizzare sempre la chiave tmp_rsa durante l'esecuzione delle operazioni 
    RSA.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_LEGACY_SERVER_CONNECT</code></td>
    <td>Consente la connessione iniziale ai server che non supportano RI.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_MICROSOFT_SESS_ID_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_MSIE_SSLV2_RSA_PADDING</code></td>
    <td>Dà istruzioni a OpenSSL di disabilitare la soluzione alternativa per una vulnerabilità della versione di protocollo man-in-the-middle nell'implementazione del server SSL 2.0.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_CA_DN_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_CHALLENGE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_COMPRESSION</code></td>
    <td>Dà istruzioni a OpenSSL di disabilitare il supporto per la compressione SSL/TLS.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_QUERY_MTU</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION</code></td>
    <td>Dà istruzioni a OpenSSL di avviare sempre una nuova sessione quando si esegue la 
    rinegoziazione.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv2</code></td>
    <td>Dà istruzioni a OpenSSL di disattivare SSL v2</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv3</code></td>
    <td>Dà istruzioni a OpenSSL di disattivare SSL v3</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TICKET</code></td>
    <td>Dà istruzioni a OpenSSL di disabilitare l'uso dei ticket RFC4507bis.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1</code></td>
    <td>Dà istruzioni a OpenSSL di disattivare TLS v1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_1</code></td>
    <td>Dà istruzioni a OpenSSL di disattivare TLS v1.1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_2</code></td>
    <td>Dà istruzioni a OpenSSL di disattivare TLS v1.2</td>
  </tr>
    <td><code>SSL_OP_PKCS1_CHECK_1</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_PKCS1_CHECK_2</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_DH_USE</code></td>
    <td>Dà istruzioni a OpenSSL di creare sempre una nuova chiave quando si utilizzano 
    i parametri DH temporanei/effimeri.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_ECDH_USE</code></td>
    <td>Dà istruzioni a OpenSSL di creare sempre una nuova chiave quando si utilizzano 
    i parametri ECDH temporanei/effimeri.</td>
  </tr>
    <td><code>SSL_OP_SSLEAY_080_CLIENT_DH_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_TLS_BLOCK_PADDING_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_TLS_D5_BUG</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_TLS_ROLLBACK_BUG</code></td>
    <td>Dà istruzioni a OpenSSL di disabilitare il rilevamento degli attacchi di rollback della versione.</td>
  </tr>
</table>

### Costanti Engine OpenSSL

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RSA</code></td>
    <td>Limita l'utilizzo dell'engine a RSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DSA</code></td>
    <td>Limita l'utilizzo dell'engine a DSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DH</code></td>
    <td>Limita l'utilizzo dell'engine a DH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RAND</code></td>
    <td>Limita l'utilizzo dell'engine a RAND</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_EC</code></td>
    <td>Limita l'utilizzo dell'engine a EC</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_CIPHERS</code></td>
    <td>Limita l'utilizzo dell'engine a CIPHERS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DIGESTS</code></td>
    <td>Limita l'utilizzo dell'engine a DIGESTS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_METHS</code></td>
    <td>Limita l'utilizzo dell'engine a PKEY_METHDS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_ASN1_METHS</code></td>
    <td>Limita l'utilizzo dell'engine a PKEY_ASN1_METHS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_ALL</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_NONE</code></td>
    <td></td>
  </tr>
</table>

### Altre Costanti OpenSSL

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>DH_CHECK_P_NOT_SAFE_PRIME</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>DH_CHECK_P_NOT_PRIME</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>DH_UNABLE_TO_CHECK_GENERATOR</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>DH_NOT_SUITABLE_GENERATOR</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>ALPN_ENABLED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PKCS1_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_SSLV23_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_NO_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PKCS1_OAEP_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_X931_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PKCS1_PSS_PADDING</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_DIGEST</code></td>
    <td>Sets the salt length for <code>RSA_PKCS1_PSS_PADDING</code> to the
        digest size when signing or verifying.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_MAX_SIGN</code></td>
    <td>Sets the salt length for <code>RSA_PKCS1_PSS_PADDING</code> to the
        maximum permissible value when signing data.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_AUTO</code></td>
    <td>Causes the salt length for <code>RSA_PKCS1_PSS_PADDING</code> to be
        determined automatically when verifying a signature.</td>
  </tr>
  <tr>
    <td><code>POINT_CONVERSION_COMPRESSED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>POINT_CONVERSION_UNCOMPRESSED</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>POINT_CONVERSION_HYBRID</code></td>
    <td></td>
  </tr>
</table>

### Costanti Crypto Node.js

<table>
  <tr>
    <th>Costante</th>
    <th>Descrizione</th>
  </tr>
  <tr>
    <td><code>defaultCoreCipherList</code></td>
    <td>Specifica l'elenco cipher predefinito incorporato utilizzato da Node.js.</td>
  </tr>
  <tr>
    <td><code>defaultCipherList</code></td>
    <td>Specifica l'elenco cipher predefinito attivo utilizzato dall'attuale
    processo Node.js.</td>
  </tr>
</table>

