# Crypto

<!--introduced_in=v0.3.6-->

> Стабильность: 2 - Стабильно

The `crypto` module provides cryptographic functionality that includes a set of wrappers for OpenSSL's hash, HMAC, cipher, decipher, sign, and verify functions.

Для доступа к этому модулю используйте `require('crypto')`.

```js
const crypto = require('crypto');

const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
console.log(hash);
// Печатает:
//   c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e
```

## Определение доступности поддержки шифрования

Node.js может быть построен без поддержки модуля `crypto`. В таких случаях вызов `require('crypto')` приведет к выводу ошибки.

```js
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('поддержка шифрования отключена!');
}
```

## Класс: Сертификат
<!-- YAML
added: v0.11.8
-->

SPKAC is a Certificate Signing Request mechanism originally implemented by Netscape and was specified formally as part of [HTML5's `keygen` element][].

Note that `<keygen>` is deprecated since [HTML 5.2](https://www.w3.org/TR/html52/changes.html#features-removed) and new projects should not use this element anymore.

Модуль `crypto` предоставляет класс `Certificate` для работы с данными SPKAC. Наиболее распространенное использование - обработка вывода данных, генерируемых `<keygen>` элементом HTML5. Node.js uses [OpenSSL's SPKAC implementation](https://www.openssl.org/docs/man1.1.0/apps/openssl-spkac.html) internally.

### Certificate.exportChallenge(spkac)
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
// Prints: the challenge as a UTF8 string
```

### Certificate.exportPublicKey(spkac[, encoding])
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
// Prints: the public key as <Buffer ...>
```

### Certificate.verifySpkac(spkac)
<!-- YAML
added: v9.0.0
-->
* `spkac` {Buffer | TypedArray | DataView}
* Returns: {boolean} `true` if the given `spkac` data structure is valid, `false` otherwise.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
console.log(Certificate.verifySpkac(Buffer.from(spkac)));
// Prints: true or false
```

### Legacy API

As a still supported legacy interface, it is possible (but not recommended) to create new instances of the `crypto.Certificate` class as illustrated in the examples below.

#### new crypto.Certificate()

Экземпляры класса `Certificate` могут создаваться с помощью ключевого слова `new` или с помощью вызова `crypto.Certificate()` как функции:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

#### certificate.exportChallenge(spkac)
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
// Печатает: вызов в виде строки UTF8
```

#### certificate.exportPublicKey(spkac)
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
// Печатает: открытый ключ как <Buffer ...>
```

#### certificate.verifySpkac(spkac)
<!-- YAML
added: v0.11.8
-->
* `spkac` {Buffer | TypedArray | DataView}
* Returns: {boolean} `true` if the given `spkac` data structure is valid, `false` otherwise.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Печатает: "true" или "false"
```

## Класс: Cipher
<!-- YAML
added: v0.1.94
-->

Экземпляры класса `Cipher` используются для шифрования данных. Этот класс может использоваться одним из двух способов:

- Как [stream](stream.html), который доступен как для чтения, так и записи, где простые незашифрованные данные записываются для получения читаемых зашифрованных данных, или
- Использование методов [`cipher.update()`][] и [`cipher.final()`][] для получения зашифрованных данных.

Методы [`crypto.createCipher()`][] или [`crypto.createCipheriv()`][] используются для создания экземпляров `Cipher`. Объекты `Cipher` не создаются непосредственно с помощью ключевого слова `new`.

Пример использования объектов `Cipher` в качестве потоков:

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

Пример использования `Cipher` и канальных потоков:

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

Пример использования методов [`cipher.update()`][] и [`cipher.final()`][]:

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

### cipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Returns: {Buffer | string} Any remaining enciphered contents. If `outputEncoding` is specified, a string is returned. If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

После вызова метода `cipher.final()` объект `Cipher` не может более использоваться для шифрования данных. Попытки вызвать `cipher.final()` более одного раза приведут к выводу ошибки.

### cipher.setAAD(buffer[, options])
<!-- YAML
added: v1.0.0
-->
* `buffer` {Buffer}
* `options` {Object} [`stream.transform` options][]
  - `plaintextLength` {number}
* Returns: {Cipher} for method chaining.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

The `options` argument is optional for `GCM` and `OCB`. When using `CCM`, the `plaintextLength` option must be specified and its value must match the length of the plaintext in bytes. See [CCM mode](#crypto_ccm_mode).

Метод `cipher.setAAD()` должен вызываться до [`cipher.update()`][].

### cipher.getAuthTag()
<!-- YAML
added: v1.0.0
-->
* Returns: {Buffer} When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing the _authentication tag_ that has been computed from the given data.

Метод `cipher.getAuthTag()` должен вызываться только после завершения шифрования методом [`cipher.final()`][].

### cipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
* `autoPadding` {boolean} **Default:** `true`
* Returns: {Cipher} for method chaining.

При использовании блоковых алгоритмов шифрования класс `Cipher` будет автоматически добавлять padding во входящие данные до соответствующего размера блока. Для отключения свойства padding по умолчанию вызовите `cipher.setAutoPadding(false)`.

When `autoPadding` is `false`, the length of the entire input data must be a multiple of the cipher's block size or [`cipher.final()`][] will throw an error. Отключение автоматического padding полезно для нестандартного заполнения; например, используйте `0x0` вместо PKCS padding.

Метод `cipher.setAutoPadding()` должен быть вызван до [`cipher.final()`][].

### cipher.update(data\[, inputEncoding\]\[, outputEncoding\])
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
* Возвращает: {Buffer | string}

Обновляет шифр с `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. If the `inputEncoding` argument is not given, `data` must be a [`Buffer`][], `TypedArray`, or `DataView`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered data. If the `outputEncoding` is specified, a string using the specified encoding is returned. If no `outputEncoding` is provided, a [`Buffer`][] is returned.

Метод `cipher.update()` можно вызывать несколько раз с новыми данными, пока не будет вызван [`cipher.final()`][]. Вызов `cipher.update()` после [`cipher.final()`][] приведет к выводу ошибки.

## Класс: Decipher
<!-- YAML
added: v0.1.94
-->

Экземпляры класса `Decipher` используются для дешифровки данных. Этот класс может использоваться одним из двух способов:

- Как [stream](stream.html), который доступен как для чтения, так и записи, где простые зашифрованные данные записываются для получения читаемых дешифрованных данных, или
- Использование методов [`decipher.update()`][] и [`decipher.final()`][] для получения дешифрованных данных.

Методы [`crypto.createDecipher()`][] или [`crypto.createDecipheriv()`][] используются для создания экземпляров `Decipher`. Объекты `Decipher` не создаются непосредственно с помощью ключевого слова `new`.

Пример использования объектов `Decipher` в качестве потоков:

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

Пример использования `Decipher` и канальных потоков:

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

Пример использования методов [`decipher.update()`][] и [`decipher.final()`][]:

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

### decipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Returns: {Buffer | string} Any remaining deciphered contents. If `outputEncoding` is specified, a string is returned. If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

После вызова метода `decipher.final()` объект `Decipher` не может более использоваться для дешифровки данных. Попытки вызвать `decipher.final()` более одного раза приведут к выводу ошибки.

### decipher.setAAD(buffer[, options])
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
* `buffer` {Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
  - `plaintextLength` {number}
* Returns: {Decipher} for method chaining.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

The `options` argument is optional for `GCM`. When using `CCM`, the `plaintextLength` option must be specified and its value must match the length of the plaintext in bytes. See [CCM mode](#crypto_ccm_mode).

Метод `decipher.setAAD()` должен вызываться до [`decipher.update()`][].

### decipher.setAuthTag(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
* `buffer` {Buffer | TypedArray | DataView}
* Returns: {Decipher} for method chaining.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAuthTag()` method is used to pass in the received _authentication tag_. Если тег не предоставлен или зашифрованный текст искажен, будет выдано [`decipher.final()`][], указывая, что зашифрованный текст нужно отбросить из-за неудачной аутентификации.

Note that this Node.js version does not verify the length of GCM authentication tags. Such a check *must* be implemented by applications and is crucial to the authenticity of the encrypted data, otherwise, an attacker can use an arbitrarily short authentication tag to increase the chances of successfully passing authentication (up to 0.39%). It is highly recommended to associate one of the values 16, 15, 14, 13, 12, 8 or 4 bytes with each key, and to only permit authentication tags of that length, see [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

Метод `decipher.setAuthTag()` должен быть вызван до [`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
* `autoPadding` {boolean} **Default:** `true`
* Returns: {Decipher} for method chaining.

Если данные были зашифрованы без стандартного заполнения блоков, вызов `decipher.setAutoPadding(false)` отключит автоматическое заполнение, чтобы предотвратить [`decipher.final()`][] от проверки и удаления заполнения.

Отключение автозаполнения будет работать, только если длина входящих данных кратна размеру блока шифрования.

Метод `decipher.setAutoPadding()` должен быть вызван до [`decipher.final()`][].

### decipher.update(data\[, inputEncoding\]\[, outputEncoding\])
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
* Возвращает: {Buffer | string}

Обновляет дешифратор с `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. If the `inputEncoding` argument is not given, `data` must be a [`Buffer`][]. If `data` is a [`Buffer`][] then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered data. If the `outputEncoding` is specified, a string using the specified encoding is returned. If no `outputEncoding` is provided, a [`Buffer`][] is returned.

Метод `decipher.update()` можно вызывать несколько раз с новыми данными, пока не будет вызван [`decipher.final()`][]. Вызов `decipher.update()` после [`decipher.final()`][] приведет к выводу ошибки.

## Класс: DiffieHellman
<!-- YAML
added: v0.5.0
-->

Класс `DiffieHellman` - это утилита для создания обмена ключами Диффи-Хеллмана.

Экземпляры класса `DiffieHellman` могут создаваться с помощью функции [`crypto.createDiffieHellman()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Генерируем ключи Алисы...
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// Генерируем ключи Боба...
const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
const bobKey = bob.generateKeys();

// Обмен и генерация секрета...
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

// OK
assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
```

### diffieHellman.computeSecret(otherPublicKey\[, inputEncoding\]\[, outputEncoding\])
<!-- YAML
added: v0.5.0
-->
* `otherPublicKey` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of an `otherPublicKey` string.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Computes the shared secret using `otherPublicKey` as the other party's public key and returns the computed shared secret. The supplied key is interpreted using the specified `inputEncoding`, and secret is encoded using specified `outputEncoding`. If the `inputEncoding` is not provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `outputEncoding` is given a string is returned; otherwise, a [`Buffer`][] is returned.

### diffieHellman.generateKeys([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Генерирует приватные и открытые значения ключа Диффи-Хеллмана и возвращает открытый ключ в указанной `encoding`. Этот ключ должен быть передан другой стороне. Если `encoding` задан, то возвращается строка; в ином случае возвращается [`Buffer`][].

### diffieHellman.getGenerator([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Returns the Diffie-Hellman generator in the specified `encoding`. Если `encoding` задан, то возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.getPrime([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Returns the Diffie-Hellman prime in the specified `encoding`. Если `encoding` задан, то возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.getPrivateKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Returns the Diffie-Hellman private key in the specified `encoding`. Если `encoding` задан, возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.getPublicKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Returns the Diffie-Hellman public key in the specified `encoding`. Если `encoding` задан, возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.5.0
-->
* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Задает приватный ключ Диффи-Хеллмана. If the `encoding` argument is provided, `privateKey` is expected to be a string. If no `encoding` is provided, `privateKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.5.0
-->
* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Задает открытый ключ Диффи-Хеллмана. If the `encoding` argument is provided, `publicKey` is expected to be a string. If no `encoding` is provided, `publicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

### diffieHellman.verifyError
<!-- YAML
added: v0.11.12
-->

Битовое поле, содержащее любые предупреждения и/или ошибки, возникающие в результате проверки, которая выполняется во время инициализации объекта `DiffieHellman`.

Для этого свойства допустимы следующие значения (как определено в модуле `constants`):

* `DH_CHECK_P_NOT_SAFE_PRIME`
* `DH_CHECK_P_NOT_PRIME`
* `DH_UNABLE_TO_CHECK_GENERATOR`
* `DH_NOT_SUITABLE_GENERATOR`

## Класс: ECDH
<!-- YAML
added: v0.11.14
-->

Класс `ECDH` является утилитой для создания эллиптической кривой Диффи-Хеллмана (Elliptic Curve Diffie-Hellman (ECDH)) для обмена ключами.

Экземпляры класса `ECDH` могут создаваться с помощью функции [`crypto.createECDH()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Генерируем ключи Алисы...
const alice = crypto.createECDH('secp521r1');
const aliceKey = alice.generateKeys();

// Генерируем ключи Боба...
const bob = crypto.createECDH('secp521r1');
const bobKey = bob.generateKeys();

// Обмен и генерация секрета...
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
// OK
```

### Class Method: ECDH.convertKey(key, curve[, inputEncoding[, outputEncoding[, format]]])
<!-- YAML
added: v10.0.0
-->

* `key` {string | Buffer | TypedArray | DataView}
* `curve` {string}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `key` string.
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Возвращает: {Buffer | string}

Converts the EC Diffie-Hellman public key specified by `key` and `curve` to the format specified by `format`. The `format` argument specifies point encoding and can be `'compressed'`, `'uncompressed'` or `'hybrid'`. The supplied key is interpreted using the specified `inputEncoding`, and the returned key is encoded using the specified `outputEncoding`.

Use [`crypto.getCurves()`][] to obtain a list of available curve names. On recent OpenSSL releases, `openssl ecparam -list_curves` will also display the name and description of each available elliptic curve.

If `format` is not specified the point will be returned in `'uncompressed'` format.

If the `inputEncoding` is not provided, `key` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

Example (uncompressing a key):

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

// the converted key and the uncompressed public key should be the same
console.log(uncompressedKey === ecdh.getPublicKey('hex'));
```

### ecdh.computeSecret(otherPublicKey\[, inputEncoding\]\[, outputEncoding\])
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
* Возвращает: {Buffer | string}

Computes the shared secret using `otherPublicKey` as the other party's public key and returns the computed shared secret. The supplied key is interpreted using specified `inputEncoding`, and the returned secret is encoded using the specified `outputEncoding`. If the `inputEncoding` is not provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `outputEncoding` is given a string will be returned; otherwise a [`Buffer`][] is returned.

`ecdh.computeSecret` will throw an `ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY` error when `otherPublicKey` lies outside of the elliptic curve. Since `otherPublicKey` is usually supplied from a remote user over an insecure network, its recommended for developers to handle this exception accordingly.

### ecdh.generateKeys([encoding[, format]])
<!-- YAML
added: v0.11.14
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Возвращает: {Buffer | string}

Генерирует приватные и открытые значения ключа Диффи-Хеллмана и возвращает открытый ключ в указанных `format` и `encoding`. Этот ключ должен быть передан другой стороне.

The `format` argument specifies point encoding and can be `'compressed'` or `'uncompressed'`. If `format` is not specified, the point will be returned in `'uncompressed'` format.

If `encoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.getPrivateKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.11.14
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Returns: {Buffer | string} The EC Diffie-Hellman in the specified `encoding`.

If `encoding` is specified, a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.getPublicKey([encoding](buffer.html#buffer_buffers_and_character_encodings)[, format])
<!-- YAML
added: v0.11.14
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Returns: {Buffer | string} The EC Diffie-Hellman public key in the specified `encoding` and `format`.

The `format` argument specifies point encoding and can be `'compressed'` or `'uncompressed'`. If `format` is not specified the point will be returned in `'uncompressed'` format.

If `encoding` is specified, a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.11.14
-->
* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Задает приватный ключ EC Диффи-Хеллмана. If `encoding` is provided, `privateKey` is expected to be a string; otherwise `privateKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `privateKey` is not valid for the curve specified when the `ECDH` object was created, an error is thrown. Upon setting the private key, the associated public point (key) is also generated and set in the `ECDH` object.

### ecdh.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Стабильность: 0 - Устарело

* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Устанавливает открытый ключ EC Диффи-Хеллмана. If `encoding` is provided `publicKey` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

Обратите внимание, что обычно нет причины вызывать этот метод, потому что для вычисления общего секрета `ECDH` требует только закрытый ключ и открытый ключ другой стороны. Обычно вызывается [`ecdh.generateKeys()`][] или [`ecdh.setPrivateKey()`][]. Метод [`ecdh.setPrivateKey()`][] пытается сгенерировать публичную точку (ключ), связанную с установленным приватным ключом.

Пример (получение общего секрета):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// This is a shortcut way of specifying one of Alice's previous private
// keys. Было бы неразумно использовать такой предсказуемый закрытый ключ в реальном
// приложении.
alice.setPrivateKey(
  crypto.createHash('sha256').update('alice', 'utf8').digest()
);

// Боб использует вновь сгенерированную криптографически сильную
// псевдослучайную пару ключей
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

// aliceSecret and bobSecret should be the same shared secret value
console.log(aliceSecret === bobSecret);
```

## Класс: Hash
<!-- YAML
added: v0.1.92
-->

Класс `Hash` - это утилита для создания хэш-дайджестов данных. Может использоваться одним из двух способов:

- В качестве [stream](stream.html), который открыт для чтения и записи, где данные записываются для создания вычисленного хэш-дайджеста на читаемой стороне, или
- Использование методов [`hash.update()`][] и [`hash.digest()`][] для создания вычисленного хеша.

Метод [`crypto.createHash()`][] используется для создания экземпляров `Hash`. Объекты `Hash` не создаются непосредственно с помощью ключевого слова `new`.

Пример использования объектов `Hash` в качестве потоков:

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

Пример использования `Hash` и канальных потоков:

```js
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');

const input = fs.createReadStream('test.js');
input.pipe(hash).pipe(process.stdout);
```

Пример использования методов [`hash.update()`][] и [`hash.digest()`][]:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('some data to hash');
console.log(hash.digest('hex'));
// Печатает:
//   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
```

### hash.digest([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.1.92
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Вычисляет дайджест из всех данных, переданных для хеширования (с использованием метода [`hash.update()`][]). Если параметр `encoding` задан, то возвращается строка, в ином случае возвращается a [`Buffer`][].

Объект `Hash` не может снова использоваться после вызова метода `hash.digest()`. Множественные вызовы приведут к выводу ошибки.

### hash.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the hash content with the given `data`, the encoding of which is given in `inputEncoding`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Этот метод можно вызвать много раз с новыми данными в потоковом режиме.

## Класс: Hmac
<!-- YAML
added: v0.1.94
-->

Класс `Hmac` - это утилита для создания криптографических дайджестов HMAC. Может использоваться одним из двух способов:

- В качестве [stream](stream.html), который открыт для чтения и записи, где данные записываются для создания вычисленного дайджеста HMAC на читаемой стороне, или
- Использование методов [`hmac.update()`][] и [`hmac.digest()`][] для создания вычисленного дайджеста HMAC.

Метод [`crypto.createHmac()`][] используется для создания экземпляров `Hmac`. Объекты `Hmac` не создаются непосредственно с помощью ключевого слова `new`.

Пример использования объектов `Hmac` в качестве потоков:

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

Пример использования `Hmac` и канальных потоков:

```js
const crypto = require('crypto');
const fs = require('fs');
const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream('test.js');
input.pipe(hmac).pipe(process.stdout);
```

Пример использования методов [`hmac.update()`][] и [`hmac.digest()`][]:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.update('some data to hash');
console.log(hmac.digest('hex'));
// Печатает:
//   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
```

### hmac.digest([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.1.94
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Вычисляет дайджест HMAC всех данных, переданных с помощью [`hmac.update()`][]. Если параметр `encoding` задан, то возвращается строка; в ином случае возвращается [`Buffer`][];

Объект `Hmac` не может снова использоваться после вызова `hmac.digest()`. Множественные вызовы `hmac.digest()` приведут к выводу ошибки.

### hmac.update(data[, inputEncoding])
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the `Hmac` content with the given `data`, the encoding of which is given in `inputEncoding`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Этот метод можно вызвать много раз с новыми данными в потоковом режиме.

## Класс: Sign
<!-- YAML
added: v0.1.92
-->

Класс `Sign` - это утилита для генерации подписей. Может использоваться одним из двух способов:

- В качестве открытого для записи [stream](stream.html), где записываются данные для подписи, а метод [`sign.sign()`][] используется для генерации и возврата подписи, или
- Использование методов [`sign.update()`][] и [`sign.sign()`][] для создания подписи.

Метод [`crypto.createSign()`][] используется для создания экземпляров `Sign`. Аргумент - это имя строки используемой хеш-функции. Объекты `Sign` не создаются непосредственно с помощью ключевого слова `new`.

Пример использования объектов `Sign` как потоков:

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.write('some data to sign');
sign.end();

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Печатает: вычисленная подпись с помощью указанного закрытого ключа и
// SHA-256. Для ключей RSA используется алгоритм RSASSA-PKCS1-v1_5 (см. параметр
// заполнения для RSASSA-PSS ниже). Для ключей EC используется алгоритм ECDSA.
```

Пример использования методов [`sign.update()`][] и [`sign.sign()`][]:

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Печатает: вычисленная подпись
```

В некоторых случаях экземпляр `Sign` также может создаваться путем передачи в имя алгоритма подписи, такого как "RSA-SHA256". Будет использовать соответствующий алгоритм дайджеста. Это не работает для всех алгоритмов подписи, таких как "ecdsa-with-SHA256". Вместо этого используйте названия дайджеста.

Пример: подпись с использованием имени устаревшего алгоритма подписи

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Печатает: вычисленная подпись
```

### sign.sign(privateKey[, outputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->
* `privateKey` {string | Object}
  - `key` {string}
  - `passphrase` {string}
  - `padding` {integer}
  - `saltLength` {integer}
* `outputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Возвращает: {Buffer | string}

Вычисляет подпись на всех данных, передаваемых с помощью [`sign.update()`][] или [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

The `privateKey` argument can be an object or a string. If `privateKey` is a string, it is treated as a raw key with no passphrase. If `privateKey` is an object, it must contain one or more of the following properties:

* `key`: {string} - PEM-кодированный приватный ключ (требуется)
* `passphrase`: {string} - ключевая фраза для закрытого ключа
* `padding`: {integer} - Опциональное значение заполнения для RSA, одно из следующих:
  * `crypto.constants.RSA_PKCS1_PADDING` (по умолчанию)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Обратите внимание, что `RSA_PKCS1_PSS_PADDING` будет использовать MGF1 с той же хеш-функцией, которая использовалась для подписи сообщения, как указано в разделе 3.1 [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - длина соли, когда параметр заполнения равен `RSA_PKCS1_PSS_PADDING`. Специальное значение `crypto.constants.RSA_PSS_SALTLEN_DIGEST` задает длину соли на размер дайджеста, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (по умолчанию) устанавливает его в максимально допустимое значение.

If `outputEncoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

Объект `Sign` не может снова использоваться после вызова метода `sign.sign()`. Множественные вызовы `sign.sign()` приведут к выводу ошибки.

### sign.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
* `data` {string | Buffer | TypedArray | DataView}
* `inputEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `data` string.

Updates the `Sign` content with the given `data`, the encoding of which is given in `inputEncoding`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Этот метод можно вызвать много раз с новыми данными в потоковом режиме.

## Класс: Verify
<!-- YAML
added: v0.1.92
-->

Класс `Verify` - это утилита для подтверждения подписей. Может использоваться одним из двух способов:

- В качестве открытого для записи [stream](stream.html), где записанные данные используются для проверки соответствия поставленной подписи, или
- Использование методов [`verify.update()`][] и [`verify.verify()`][] для подтверждения подписи.

Метод [`crypto.createVerify()`][] используется для создания экземпляров `Verify`. Объекты `Verify` не создаются непосредственно с помощью ключевого слова `new`.

Пример использования объектов `Verify` как потоков:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.write('some data to sign');
verify.end();

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Печатает: верный или ложный
```

Пример использования методов [`verify.update()`][] и [`verify.verify()`][]:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.update('some data to sign');

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Печатает: верный или ложный
```

### verify.update(data[, inputEncoding])
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

Этот метод можно вызвать много раз с новыми данными в потоковом режиме.

### verify.verify(object, signature[, signatureEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->
* `object` {string | Object}
* `signature` {string | Buffer | TypedArray | DataView}
* `signatureEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `signature` string.
* Returns: {boolean} `true` or `false` depending on the validity of the signature for the data and public key.

Проверяет предоставленные данные при помощи заданных `object` и `signature`. Аргумент `object` может быть либо строкой, содержащей PEM-кодированный объект, который может быть открытым ключом RSA, открытым ключом DSA или сертификатом X.509, либо объектом с одним или несколькими из следующих свойств:

* `key`: {string} - открытый ключ в PEM кодировке (требуется)
* `padding`: {integer} - Опциональное значение заполнения для RSA, одно из следующих:
  * `crypto.constants.RSA_PKCS1_PADDING` (по умолчанию)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Обратите внимание, что `RSA_PKCS1_PSS_PADDING` будет использовать MGF1 с той же хеш-функцией, которая использовалась для проверки сообщения, как указано в разделе 3.1 [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - длина соли, когда параметр заполнения равен `RSA_PKCS1_PSS_PADDING`. Специальное значение `crypto.constants.RSA_PSS_SALTLEN_DIGEST` задает длину соли на размер дайджеста, а `crypto.constants.RSA_PSS_SALTLEN_AUTO` (по умолчанию) заставляет его определяться автоматически.

The `signature` argument is the previously calculated signature for the data, in the `signatureEncoding`. If a `signatureEncoding` is specified, the `signature` is expected to be a string; otherwise `signature` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

The `verify` object can not be used again after `verify.verify()` has been called. Множественные вызовы `verify.verify()` приведут к выводу ошибки.

## Методы и свойства модуля `crypto`

### crypto.constants
<!-- YAML
added: v6.3.0
-->
* Returns: {Object} An object containing commonly used constants for crypto and security related operations. The specific constants currently defined are described in [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING
<!-- YAML
added: v0.9.3
deprecated: v10.0.0
-->

> Стабильность: 0 - Устарело

Кодировка по умолчанию для использования в функциях, которые могут принимать как строки, так и [buffers][`Buffer`]. `'buffer'` - значение по умолчанию, что делает методы применяемыми по умолчанию к объектам [`Buffer`][].

Механизм `crypto.DEFAULT_ENCODING` предназначен для обратной совместимости с устаревшими программами, которые ожидают, что `'latin1'` будет кодировкой по умолчанию.

Новые приложения должны ожидать, что по умолчанию будет `'buffer'`.

This property is deprecated.

### crypto.fips
<!-- YAML
added: v6.0.0
deprecated: v10.0.0
-->

> Стабильность: 0 - Устарело

Property for checking and controlling whether a FIPS compliant crypto provider is currently in use. Установка значения "true" требует FIPS-сборки Node.js.

This property is deprecated. Please use `crypto.setFips()` and `crypto.getFips()` instead.

### crypto.createCipher(algorithm, password[, options])
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

> Stability: 0 - Deprecated: Use [`crypto.createCipheriv()`][] instead.

* `algorithm` {string}
* `password` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Возвращает: {Cipher}

Создает и возвращает объект `Cipher`, который использует заданные `algorithm` и `password`.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

`algorithm` зависит от OpenSSL (например, `'aes192'` и т.д.). On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

`password` используется для получения ключа шифрования и вектора инициализации (IV). The value must be either a `'latin1'` encoded string, a [`Buffer`][], a `TypedArray`, or a `DataView`.

Реализация `crypto.createCipher()` позволяет получать ключи с помощью функции OpenSSL [`EVP_BytesToKey`][] с алгоритмом дайджеста, установленным на MD5, одну итерацию и без соли. Отсутствие соли позволяет атаковать словарь, как один и тот же пароль всегда создает один и тот же ключ. Малое количество итераций и криптографически небезопасный алгоритм хеширования позволяют быстро проверять пароли.

In line with OpenSSL's recommendation to use a more modern algorithm instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.scrypt()`][] and to use [`crypto.createCipheriv()`][] to create the `Cipher` object. Users should not use ciphers with counter mode (e.g. CTR, GCM, or CCM) in `crypto.createCipher()`. Когда они используются, выдается предупреждение, чтобы избежать риска повторного использования IV, что вызывает уязвимости. For the case when IV is reused in GCM, see \[Nonce-Disrespecting Adversaries\]\[\] for details.

### crypto.createCipheriv(algorithm, key, iv[, options])
<!-- YAML
added: v0.1.94
changes:
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
* `key` {string | Buffer | TypedArray | DataView}
* `iv` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Возвращает: {Cipher}

Создает и возвращает объект `Cipher` с заданными `algorithm`, `key` и вектором инициализации (`iv`).

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

`algorithm` зависит от OpenSSL (например, `'aes192'` и т.д.). On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

`key` - это необработанный ключ, который используется `algorithm` и `iv` и является [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Оба аргумента должны быть кодированными строками `'utf8'`, [Buffers][`Buffer`], `TypedArray` или `DataView`. If the cipher does not need an initialization vector, `iv` may be `null`.

Initialization vectors should be unpredictable and unique; ideally, they will be cryptographically random. They do not have to be secret: IVs are typically just added to ciphertext messages unencrypted. It may sound contradictory that something has to be unpredictable and unique, but does not have to be secret; it is important to remember that an attacker must not be able to predict ahead of time what a given IV will be.

### crypto.createCredentials(details)
<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Стабильность: 0 - Устарело: Вместо этого используйте [`tls.createSecureContext()`][].

- `details` {Object} Идентичен [`tls.createSecureContext()`][].
- Returns: {tls.SecureContext}

Метод `crypto.createCredentials()` является устаревшей функцией для создания и возврата `tls.SecureContext`. Он не должен использоваться. Замените его на [`tls.createSecureContext()`][], который имеет точно такие же аргументы и возвращаемое значение.

Возвращает `tls.SecureContext`, как если бы был вызван [`tls.createSecureContext()`][].

### crypto.createDecipher(algorithm, password[, options])
<!-- YAML
added: v0.1.94
deprecated: v10.0.0
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/21447
    description: Ciphers in OCB mode are now supported.
-->

> Stability: 0 - Deprecated: Use [`crypto.createDecipheriv()`][] instead.

* `algorithm` {string}
* `password` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Возвращает: {Decipher}

Создает и возвращает объект `Decipher`, который использует заданные `algorithm` и `password` (ключ).

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

Реализация `crypto.createDecipher()` позволяет получать ключи с помощью функции OpenSSL [`EVP_BytesToKey`][] с алгоритмом дайджеста, установленным на MD5, одну итерацию и без соли. Отсутствие соли позволяет атаковать словарь, как один и тот же пароль всегда создает один и тот же ключ. Малое количество итераций и криптографически небезопасный алгоритм хеширования позволяют быстро проверять пароли.

In line with OpenSSL's recommendation to use a more modern algorithm instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.scrypt()`][] and to use [`crypto.createDecipheriv()`][] to create the `Decipher` object.

### crypto.createDecipheriv(algorithm, key, iv[, options])
<!-- YAML
added: v0.1.94
changes:
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
* `key` {string | Buffer | TypedArray | DataView}
* `iv` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Возвращает: {Decipher}

Создает и возвращает объект `Decipher`, который использует заданные `algorithm`, `key` и вектор инициализации (`iv`).

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to restrict accepted authentication tags to those with the specified length.

`algorithm` зависит от OpenSSL (например, `'aes192'` и т.д.). On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

`key` - это необработанный ключ, который используется `algorithm` и `iv` и является [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Оба аргумента должны быть кодированными строками `'utf8'`, [Buffers][`Buffer`], `TypedArray` или `DataView`. If the cipher does not need an initialization vector, `iv` may be `null`.

Initialization vectors should be unpredictable and unique; ideally, they will be cryptographically random. They do not have to be secret: IVs are typically just added to ciphertext messages unencrypted. It may sound contradictory that something has to be unpredictable and unique, but does not have to be secret; it is important to remember that an attacker must not be able to predict ahead of time what a given IV will be.

### crypto.createDiffieHellman(prime\[, primeEncoding\]\[, generator\][, generatorEncoding])
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
* Returns: {DiffieHellman}

Создает объект обмена ключами `DiffieHellman` с помощью предоставленного `prime` и дополнительного конкретного `generator`.

Аргумент `generator` может быть числом, строкой или [`Buffer`][]. Если `generator` не указан, используется значение `2`.

If `primeEncoding` is specified, `prime` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

If `generatorEncoding` is specified, `generator` is expected to be a string; otherwise a number, [`Buffer`][], `TypedArray`, or `DataView` is expected.

### crypto.createDiffieHellman(primeLength[, generator])
<!-- YAML
added: v0.5.0
-->
* `primeLength` {number}
* `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
* Returns: {DiffieHellman}

Creates a `DiffieHellman` key exchange object and generates a prime of `primeLength` bits using an optional specific numeric `generator`. Если `generator` не указан, используется значение `2`.

### crypto.createECDH(curveName)
<!-- YAML
added: v0.11.14
-->
* `curveName` {string}
* Returns: {ECDH}

Creates an Elliptic Curve Diffie-Hellman (`ECDH`) key exchange object using a predefined curve specified by the `curveName` string. Используйте [`crypto.getCurves()`][] для получения списка доступных названий кривых. В последних версиях OpenSSL `openssl ecparam -list_curves` также будет отображать название и описание каждой доступной эллиптической кривой.

### crypto.createHash(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.transform` options][]
* Возвращает: {Hash}

Создает и возвращает объект `Hash`, который может использоваться для генерации хеш-дайджестов с помощью заданного `algorithm`. Optional `options` argument controls stream behavior.

`algorithm` зависит от доступных алгоритмов, поддерживаемых версией OpenSSL на платформе. Например, `'sha256'`, `'sha512'` и т.д. On recent releases of OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` for older versions of OpenSSL) will display the available digest algorithms.

Пример генерации суммы файла sha256

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

### crypto.createHmac(algorithm, key[, options])
<!-- YAML
added: v0.1.94
-->
* `algorithm` {string}
* `key` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Возвращает: {Hmac}

Создает и возвращает объект `Hmac`, который использует заданные `algorithm` и `key`. Optional `options` argument controls stream behavior.

`algorithm` зависит от доступных алгоритмов, поддерживаемых версией OpenSSL на платформе. Например, `'sha256'`, `'sha512'` и т.д. On recent releases of OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` for older versions of OpenSSL) will display the available digest algorithms.

`key` - это ключ HMAC, используемый для генерации криптографического хеша HMAC.

Пример генерации sha256 HMAC файла

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

### crypto.createSign(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.Writable` options][]
* Возвращает: {Sign}

Создает и возвращает объект `Sign`, который использует заданный `algorithm`. Используйте [`crypto.getHashes()`][] для получения массива имен доступных алгоритмов подписи. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.createVerify(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.Writable` options][]
* Возвращает: {Verify}

Создает и возвращает объект `Verify`, который использует заданный алгоритм. Используйте [`crypto.getHashes()`][] для получения массива имен доступных алгоритмов подписи. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.generateKeyPair(type, options, callback)
<!-- YAML
added: v10.12.0
-->
* `type`: {string} Must be `'rsa'`, `'dsa'` or `'ec'`.
* `options`: {Object}
  - `modulusLength`: {number} Key size in bits (RSA, DSA).
  - `publicExponent`: {number} Public exponent (RSA). **Default:** `0x10001`.
  - `divisorLength`: {number} Size of `q` in bits (DSA).
  - `namedCurve`: {string} Name of the curve to use (EC).
  - `publicKeyEncoding`: {Object}
    - `type`: {string} Must be one of `'pkcs1'` (RSA only) or `'spki'`.
    - `format`: {string} Must be `'pem'` or `'der'`.
  - `privateKeyEncoding`: {Object}
    - `type`: {string} Must be one of `'pkcs1'` (RSA only), `'pkcs8'` or `'sec1'` (EC only).
    - `format`: {string} Must be `'pem'` or `'der'`.
    - `cipher`: {string} If specified, the private key will be encrypted with the given `cipher` and `passphrase` using PKCS#5 v2.0 password based encryption.
    - `passphrase`: {string} The passphrase to use for encryption, see `cipher`.
* `callback`: {Function}
  - `err`: {Error}
  - `publicKey`: {string|Buffer}
  - `privateKey`: {string|Buffer}

Generates a new asymmetric key pair of the given `type`. Only RSA, DSA and EC are currently supported.

It is recommended to encode public keys as `'spki'` and private keys as `'pkcs8'` with encryption:

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

On completion, `callback` will be called with `err` set to `undefined` and `publicKey` / `privateKey` representing the generated key pair. When PEM encoding was selected, the result will be a string, otherwise it will be a buffer containing the data encoded as DER. Note that Node.js itself does not accept DER, it is supported for interoperability with other libraries such as WebCrypto only.

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `publicKey` and `privateKey` properties.

### crypto.generateKeyPairSync(type, options)
<!-- YAML
added: v10.12.0
-->
* `type`: {string} Must be `'rsa'`, `'dsa'` or `'ec'`.
* `options`: {Object}
  - `modulusLength`: {number} Key size in bits (RSA, DSA).
  - `publicExponent`: {number} Public exponent (RSA). **Default:** `0x10001`.
  - `divisorLength`: {number} Size of `q` in bits (DSA).
  - `namedCurve`: {string} Name of the curve to use (EC).
  - `publicKeyEncoding`: {Object}
    - `type`: {string} Must be one of `'pkcs1'` (RSA only) or `'spki'`.
    - `format`: {string} Must be `'pem'` or `'der'`.
  - `privateKeyEncoding`: {Object}
    - `type`: {string} Must be one of `'pkcs1'` (RSA only), `'pkcs8'` or `'sec1'` (EC only).
    - `format`: {string} Must be `'pem'` or `'der'`.
    - `cipher`: {string} If specified, the private key will be encrypted with the given `cipher` and `passphrase` using PKCS#5 v2.0 password based encryption.
    - `passphrase`: {string} The passphrase to use for encryption, see `cipher`.
* Возвращает: {Object}
  - `publicKey`: {string|Buffer}
  - `privateKey`: {string|Buffer}

Generates a new asymmetric key pair of the given `type`. Only RSA, DSA and EC are currently supported.

It is recommended to encode public keys as `'spki'` and private keys as `'pkcs8'` with encryption:

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

### crypto.getCiphers()
<!-- YAML
added: v0.9.3
-->
* Returns: {string[]} An array with the names of the supported cipher algorithms.

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()
<!-- YAML
added: v2.3.0
-->
* Returns: {string[]} An array with the names of the supported elliptic curves.

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)
<!-- YAML
added: v0.7.5
-->
* `groupName` {string}
* Returns: {DiffieHellman}

Создает предопределенный объект обмена ключами `DiffieHellman`. Поддерживаемые группы: `'modp1'`, `'modp2'`, `'modp5'` (определено в [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), но смотрите [Caveats](#crypto_support_for_weak_or_compromised_algorithms)) и `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (определено в [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). The returned object mimics the interface of objects created by [`crypto.createDiffieHellman()`][], but will not allow changing the keys (with [`diffieHellman.setPublicKey()`][], for example). Преимущество использования этого метода в том, что стороны не должны создавать и обменивать групповые модули заранее, экономя время процессора и сессии.

Пример (получение общего секрета):

```js
const crypto = require('crypto');
const alice = crypto.getDiffieHellman('modp14');
const bob = crypto.getDiffieHellman('modp14');

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

/* aliceSecret and bobSecret should be the same */
console.log(aliceSecret === bobSecret);
```

### crypto.getFips()
<!-- YAML
added: v10.0.0
-->
* Returns: {boolean} `true` if and only if a FIPS compliant crypto provider is currently in use.

### crypto.getHashes()
<!-- YAML
added: v0.9.3
-->
* Returns: {string[]} An array of the names of the supported hash algorithms, such as `'RSA-SHA256'`.

```js
const hashes = crypto.getHashes();
console.log(hashes); // ['DSA', 'DSA-SHA', 'DSA-SHA1', ...]
```

### crypto.pbkdf2(password, salt, iterations, keylen, digest, callback)
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
  - `err` {Error}
  - `derivedKey` {Buffer}

Предоставляет асинхронную реализацию функции получения ключа на основе пароля 2 (PBKDF2). Выбранный алгоритм дайджеста HMAC, заданный `digest`, применяется для получения ключа требуемой длины в байтах (`keylen`) из `password`, `salt` и `iterations`.

Предоставленная функция `callback` вызывается с двумя аргументами: `err` и `derivedKey`. If an error occurs while deriving the key, `err` will be set; otherwise `err` will be `null`. By default, the successfully generated `derivedKey` will be passed to the callback as a [`Buffer`][]. An error will be thrown if any of the input arguments specify invalid values or types.

If `digest` is `null`, `'sha1'` will be used. This behavior will be deprecated in a future version of Node.js.

Аргумент `iterations` должен быть максимально возможным числом. Чем больше число итераций, тем более безопасным будет полученный ключ, но займет больше времени для завершения.

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

Массив поддерживаемых дайджест-функций можно получить с помощью [`crypto.getHashes()`][].

Note that this API uses libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

### crypto.pbkdf2Sync(password, salt, iterations, keylen, digest)
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
* Возвращает: {Buffer}

Предоставляет асинхронную реализацию функции получения ключа на основе пароля 2 (PBKDF2). Выбранный алгоритм дайджеста HMAC, заданный `digest`, применяется для получения ключа требуемой длины в байтах (`keylen`) из `password`, `salt` и `iterations`.

If an error occurs an `Error` will be thrown, otherwise the derived key will be returned as a [`Buffer`][].

If `digest` is `null`, `'sha1'` will be used. This behavior will be deprecated in a future version of Node.js.

Аргумент `iterations` должен быть максимально возможным числом. Чем больше число итераций, тем более безопасным будет полученный ключ, но займет больше времени для завершения.

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

Массив поддерживаемых дайджест-функций можно получить с помощью [`crypto.getHashes()`][].

### crypto.privateDecrypt(privateKey, buffer)
<!-- YAML
added: v0.11.14
-->
* `privateKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `crypto.constants.RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Returns: {Buffer} A new `Buffer` with the decrypted content.

Decrypts `buffer` with `privateKey`. `buffer` was previously encrypted using the corresponding public key, for example using [`crypto.publicEncrypt()`][].

`privateKey` can be an object or a string. If `privateKey` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_OAEP_PADDING`.

### crypto.privateEncrypt(privateKey, buffer)
<!-- YAML
added: v1.1.0
-->
* `privateKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `crypto.constants.RSA_PKCS1_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Returns: {Buffer} A new `Buffer` with the encrypted content.

Encrypts `buffer` with `privateKey`. The returned data can be decrypted using the corresponding public key, for example using [`crypto.publicDecrypt()`][].

`privateKey` can be an object or a string. If `privateKey` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_PADDING`.

### crypto.publicDecrypt(key, buffer)
<!-- YAML
added: v1.1.0
-->
* `key` {Object | string}
  - `key` {string} A PEM encoded public or private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `crypto.constants.RSA_PKCS1_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Returns: {Buffer} A new `Buffer` with the decrypted content.

Decrypts `buffer` with `key`.`buffer` was previously encrypted using the corresponding private key, for example using [`crypto.privateEncrypt()`][].

`key` can be an object or a string. If `key` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_PADDING`.

Поскольку открытые ключи RSA могут быть получены из закрытых ключей, закрытый ключ может передаваться вместо открытого ключа.

### crypto.publicEncrypt(key, buffer)
<!-- YAML
added: v0.11.14
-->
* `key` {Object | string}
  - `key` {string} A PEM encoded public or private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `crypto.constants.RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Returns: {Buffer} A new `Buffer` with the encrypted content.

Encrypts the content of `buffer` with `key` and returns a new [`Buffer`][] with encrypted content. The returned data can be decrypted using the corresponding private key, for example using [`crypto.privateDecrypt()`][].

`key` can be an object or a string. If `key` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_OAEP_PADDING`.

Поскольку открытые ключи RSA могут быть получены из закрытых ключей, закрытый ключ может передаваться вместо открытого ключа.

### crypto.randomBytes(size[, callback])
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
  - `err` {Error}
  - `buf` {Buffer}
* Returns: {Buffer} if the `callback` function is not provided.

Генерирует криптографически сильные псевдослучайные данные. Аргумент `size` является числом, отражающим количество байтов для генерации.

Если предусмотрена функция `callback`, байты генерируются асинхронно и функция `callback` вызывается с двумя аргументами: `err` и `buf`. If an error occurs, `err` will be an `Error` object; otherwise it is `null`. Аргумент `buf` является [`Buffer`][], который содержит сгенерированные байты.

```js
// Асинхронный
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} байты случайных данных: ${buf.toString('hex')}`);
});
```

Если функция `callback` не предусмотрена, случайные байты генерируются синхронно и возвращаются как [`Buffer`][]. Ошибка будет выдана, если существует проблема генерации байтов.

```js
// Синхронный
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} байты случайных данных: ${buf.toString('hex')}`);
```

Метод `crypto.randomBytes()` не завершится до тех пор, пока не будет доступна соответствующая энтропия. Обычно это занимает не более нескольких миллисекунд. Единственный случай, при котором генерация случайных байтов может предположительно занимать более длительный период времени сразу после загрузки, когда вся система все еще имеет низкую энтропию.

Note that this API uses libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

The asynchronous version of `crypto.randomBytes()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomBytes` requests when doing so as part of fulfilling a client request.

### crypto.randomFillSync(buffer\[, offset\]\[, size\])
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15231
    description: The `buffer` argument may be any `TypedArray` or `DataView`.
-->

* `buffer` {Buffer|TypedArray|DataView} Must be supplied.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* Returns: {Buffer|TypedArray|DataView} The object passed as `buffer` argument.

Синхронная версия [`crypto.randomFill()`][].

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// Вышеуказанное эквивалентно следующему:
crypto.randomFillSync(buf, 5, 5);
console.log(buf.toString('hex'));
```

Any `TypedArray` or `DataView` instance may be passed as `buffer`.

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

### crypto.randomFill(buffer\[, offset\]\[, size\], callback)
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15231
    description: The `buffer` argument may be any `TypedArray` or `DataView`.
-->

* `buffer` {Buffer|TypedArray|DataView} Must be supplied.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* `callback` {Function} `function(err, buf) {}`.

Эта функция похожа на [`crypto.randomBytes()`][], но требует, чтобы первый аргумент, который будет заполнен, был [`Buffer`][]. Она также требует, чтобы обратный вызов прошел.

Если функция `callback` не предусмотрена, будет выдана ошибка.

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

// Вышеуказанное эквивалентно следующему:
crypto.randomFill(buf, 5, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

Any `TypedArray` or `DataView` instance may be passed as `buffer`.

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

Note that this API uses libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

The asynchronous version of `crypto.randomFill()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomFill` requests when doing so as part of fulfilling a client request.

### crypto.scrypt(password, salt, keylen[, options], callback)
<!-- YAML
added: v10.5.0
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21525
    description: The `cost`, `blockSize` and `parallelization` option names
                 have been added.
-->
* `password` {string|Buffer|TypedArray|DataView}
* `salt` {string|Buffer|TypedArray|DataView}
* `keylen` {number}
* `options` {Object}
  - `cost` {number} CPU/memory cost parameter. Must be a power of two greater
  - `N` {number} CPU/memory cost parameter. Must be a power of two greater than one. **Default:** `16384`.
  - `blockSize` {number} Block size parameter. **Default:** `8`.
  - `parallelization` {number} Parallelization parameter. **Default:** `1`.
  - `N` {number} Alias for `cost`. Only one of both may be specified.
  - `r` {number} Alias for `blockSize`. Only one of both may be specified.
  - `p` {number} Alias for `parallelization`. Only one of both may be specified.
  - `maxmem` {number} Memory upper bound. It is an error when (approximately) `128 * N * r > maxmem`. **Default:** `32 * 1024 * 1024`.
* `callback` {Function}
  - `err` {Error}
  - `derivedKey` {Buffer}

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

### crypto.scryptSync(password, salt, keylen[, options])
<!-- YAML
added: v10.5.0
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/21525
    description: The `cost`, `blockSize` and `parallelization` option names
                 have been added.
-->
* `password` {string|Buffer|TypedArray|DataView}
* `salt` {string|Buffer|TypedArray|DataView}
* `keylen` {number}
* `options` {Object}
  - `cost` {number} CPU/memory cost parameter. Must be a power of two greater
  - `N` {number} CPU/memory cost parameter. Must be a power of two greater than one. **Default:** `16384`.
  - `blockSize` {number} Block size parameter. **Default:** `8`.
  - `parallelization` {number} Parallelization parameter. **Default:** `1`.
  - `N` {number} Alias for `cost`. Only one of both may be specified.
  - `r` {number} Alias for `blockSize`. Only one of both may be specified.
  - `p` {number} Alias for `parallelization`. Only one of both may be specified.
  - `maxmem` {number} Memory upper bound. It is an error when (approximately) `128 * N * r > maxmem`. **Default:** `32 * 1024 * 1024`.
* Возвращает: {Buffer}

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

### crypto.setEngine(engine[, flags])
<!-- YAML
added: v0.11.11
-->
* `engine` {string}
* `flags` {crypto.constants} **Default:** `crypto.constants.ENGINE_METHOD_ALL`

Загрузите и установите `engine` для некоторых или всех функций OpenSSL (выбирается флажками).

`engine` может быть идентификатором или путем к общей библиотеке движка.

Опциональный аргумент `flags` по умолчанию использует `ENGINE_METHOD_ALL`. `flags` - битовое поле, которое принимает один или несколько из следующих флагов (определено в `crypto.constants`):

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

The flags below are deprecated in OpenSSL-1.1.0.

* `crypto.constants.ENGINE_METHOD_ECDH`
* `crypto.constants.ENGINE_METHOD_ECDSA`
* `crypto.constants.ENGINE_METHOD_STORE`

### crypto.setFips(bool)
<!-- YAML
added: v10.0.0
-->
* `bool` {boolean} `true` to enable FIPS mode.

Enables the FIPS compliant crypto provider in a FIPS-enabled Node.js build. Throws an error if FIPS mode is not available.

### crypto.timingSafeEqual(a, b)
<!-- YAML
added: v6.6.0
-->
* `a` {Buffer | TypedArray | DataView}
* `b` {Buffer | TypedArray | DataView}
* Возвращает: {boolean}

Эта функция основана на алгоритме постоянного времени. Возвращает "true", если `a` равно `b`, без утечки информации о времени, что позволило бы злоумышленнику угадать одно из значений. Это подходит для сравнения дайджестов HMAC или секретных значений, таких как cookie аутентификации или [возможности URL-адресов](https://www.w3.org/TR/capability-urls/).

`a` and `b` must both be `Buffer`s, `TypedArray`s, or `DataView`s, and they must have the same length.

Use of `crypto.timingSafeEqual` does not guarantee that the *surrounding* code is timing-safe. Care should be taken to ensure that the surrounding code does not introduce timing vulnerabilities.

## Примечания

### API унаследованных потоков (ранняя версия Node.js v0.10)

Модуль шифрования был добавлен в Node.js до того, как появилась концепция унифицированного потока API и до того, как появились объекты [`Buffer`][] для обработки бинарных данных. Поэтому многие из определенных классов `crypto` имеют методы, которые обычно не встречаются в других классах Node.js, реализующих [потоки](stream.html) API (например, `update()`, `final()` или `digest()`). Also, many methods accepted and returned `'latin1'` encoded strings by default rather than `Buffer`s. Это значение по умолчанию было изменено после Node.js v0.8, когда вместо этого по умолчанию начали использовать объекты [`Buffer`][].

### Недавние изменения ECDH

Было упрощено использование `ECDH` с нединамически сгенерированными парами ключей. Теперь [`ecdh.setPrivateKey()`][] может быть вызван с предварительно выбранным закрытым ключом, а связанная открытая точка (ключ) будет вычислена и сохранена в объекте. Это позволяет коду хранить и предоставлять только закрытую часть пары ключей EC. Также [`ecdh.setPrivateKey()`][] теперь проверяет, является ли закрытый ключ действительным для выбранной кривой.

В настоящее время метод [`ecdh.setPublicKey()`][] устарел, поскольку его включение в API является бесполезным. Необходимо либо установить ранее сохраненный закрытый ключ, который автоматически генерирует связанный открытый ключ, либо вызвать [`ecdh.generateKeys()`][]. Основным недостатком использования [`ecdh.setPublicKey()`][] является то, что он приводит пару ключей ECDH в несовместимое состояние.

### Поддержка слабых или скомпрометированных алгоритмов

Модуль `crypto` все еще поддерживает некоторые алгоритмы, которые уже скомпрометированы и в настоящее время не рекомендуются для использования. API также позволяет использовать шифры и хеши с малым размером ключа, который считается слишком слабым для безопасного использования.

Пользователи должны нести полную ответственность за выбор алгоритма шифрования и размер ключа, которые будут соответствовать их требованиям безопасности.

Based on the recommendations of [NIST SP 800-131A](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

- MD5 и SHA-1 более не приемлемы, когда требуется сопротивление столкновению, например, в цифровых подписях.
- The key used with RSA, DSA, and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
- DH группы `modp1`, `modp2` и `modp5` имеют размер ключа менее 2048 битов и не рекомендуются для использования.

Смотрите ссылку на другие рекомендации и детали.

### CCM mode

CCM is one of the supported [AEAD algorithms](https://en.wikipedia.org/wiki/Authenticated_encryption). Applications which use this mode must adhere to certain restrictions when using the cipher API:

- The authentication tag length must be specified during cipher creation by setting the `authTagLength` option and must be one of 4, 6, 8, 10, 12, 14 or 16 bytes.
- The length of the initialization vector (nonce) `N` must be between 7 and 13 bytes (`7 ≤ N ≤ 13`).
- The length of the plaintext is limited to `2 ** (8 * (15 - N))` bytes.
- When decrypting, the authentication tag must be set via `setAuthTag()` before specifying additional authenticated data or calling `update()`. Otherwise, decryption will fail and `final()` will throw an error in compliance with section 2.6 of [RFC 3610](https://www.rfc-editor.org/rfc/rfc3610.txt).
- Using stream methods such as `write(data)`, `end(data)` or `pipe()` in CCM mode might fail as CCM cannot handle more than one chunk of data per instance.
- When passing additional authenticated data (AAD), the length of the actual message in bytes must be passed to `setAAD()` via the `plaintextLength` option. This is not necessary if no AAD is used.
- As CCM processes the whole message at once, `update()` can only be called once.
- Even though calling `update()` is sufficient to encrypt/decrypt the message, applications *must* call `final()` to compute or verify the authentication tag.

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

// Now transmit { ciphertext, nonce, tag }.

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
}

console.log(receivedPlaintext);
```

## Константы шифрования

Следующие константы, экспортируемые `crypto.constants`, применяются для различного использования модулей `crypto`, `tls` и `https` и обычно характерны для OpenSSL.

### Опции OpenSSL
<!--lint disable maximum-line-length-->
<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Применяет множественные методы обхода ошибок в OpenSSL. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>
    for detail.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Позволяет устаревшее небезопасное повторное подключение между OpenSSL и неизвестными
 клиентами или серверами. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Пытается использовать предпочтения сервера вместо предпочтений клиента, при
 выборе шифратора. Поведение зависит от версии протокола. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CISCO_ANYCONNECT</code></td>
    <td>Указывает OpenSSL использовать "особую" версию Cisco DTLS_BAD_VER.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_COOKIE_EXCHANGE</code></td>
    <td>Указывает OpenSSL включить обмен cookie.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CRYPTOPRO_TLSEXT_BUG</code></td>
    <td>Указывает OpenSSL добавить расширение сервера-hello из ранней версии
 проекта cryptopro.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS</code></td>
    <td>Указывает OpenSSL отключить уязвимый обходной путь SSL 3.0/TLS 1.0,
 который был добавлен в OpenSSL 0.9.6d.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_EPHEMERAL_RSA</code></td>
    <td>Указывает OpenSSL всегда использовать  ключ tmp_rsa при выполнении
 операций RSA.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_LEGACY_SERVER_CONNECT</code></td>
    <td>Позволяет первоначальное подключение к серверам, которые не поддерживают RI.</td>
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
    <td>Указывает OpenSSL отключить обходной путь в реализации сервера SSL 2.0 для уязвимости версии протокола man-in-the-middle.</td>
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
    <td>Указывает OpenSSL отключить поддержку сжатия SSL/TLS.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_QUERY_MTU</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION</code></td>
    <td>Указывает OpenSSL всегда начинать новую сессию при выполнении
 переподключения.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv2</code></td>
    <td>Указывает OpenSSL отключить SSL v2</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv3</code></td>
    <td>Указывает OpenSSL отключить SSL v3</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TICKET</code></td>
    <td>Указывает OpenSSL отключить использование заявок RFC4507bis.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1</code></td>
    <td>Указывает OpenSSL отключить TLS v1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_1</code></td>
    <td>Указывает OpenSSL отключить TLS v1.1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_2</code></td>
    <td>Указывает OpenSSL отключить TLS v1.2</td>
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
    <td>Указывает OpenSSL всегда создавать новый ключ при использовании
 временных/недолговечных параметров DH.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_ECDH_USE</code></td>
    <td>Указывает OpenSSL всегда создавать новый ключ при использовании
 временных/недолговечных параметров ECDH.</td>
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
    <td>Указывает OpenSSL отключить обнаружение атаки версии отката.</td>
  </tr>
</table>

### Константы движка OpenSSL
<!--lint enable maximum-line-length remark-lint-->

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RSA</code></td>
    <td>Ограничение использования движка до RSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DSA</code></td>
    <td>Ограничение использования движка до DSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DH</code></td>
    <td>Ограничение использования движка до DH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RAND</code></td>
    <td>Ограничение использования движка до RAND</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_EC</code></td>
    <td>Limit engine usage to EC</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_CIPHERS</code></td>
    <td>Ограничение использования движка до CIPHERS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DIGESTS</code></td>
    <td>Ограничение использования движка до DIGESTS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_METHS</code></td>
    <td>Ограничение использования движка до PKEY_METHDS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_ASN1_METHS</code></td>
    <td>Ограничение использования движка до PKEY_ASN1_METHS</td>
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

### Другие константы OpenSSL

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
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

### Константы шифрования Node.js

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>defaultCoreCipherList</code></td>
    <td>Определяет встроенный список шифраторов по умолчанию, используемый Node.js.</td>
  </tr>
  <tr>
    <td><code>defaultCipherList</code></td>
    <td>Определяет активный список шифраторов по умолчанию, используемый текущим
    процессом Node.js.</td>
  </tr>
</table>

