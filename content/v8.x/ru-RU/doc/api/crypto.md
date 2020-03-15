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

Модуль `crypto` предоставляет класс `Certificate` для работы с данными SPKAC. Наиболее распространенное использование - обработка вывода данных, генерируемых `<keygen>` элементом HTML5. Node.js использует [реализацию OpenSSL SPKAC](https://www.openssl.org/docs/man1.0.2/apps/spkac.html) для внутреннего пользования.

### new crypto.Certificate()

Экземпляры класса `Certificate` могут создаваться с помощью ключевого слова `new` или с помощью вызова `crypto.Certificate()` как функции:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

### certificate.exportChallenge(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {string | Buffer | TypedArray | DataView}
- Returns: {Buffer} The challenge component of the `spkac` data structure, which includes a public key and a challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Печатает: вызов в виде строки UTF8
```

### certificate.exportPublicKey(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {string | Buffer | TypedArray | DataView}
- Returns: {Buffer} The public key component of the `spkac` data structure, which includes a public key and a challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Печатает: открытый ключ как <Buffer ...>
```

### certificate.verifySpkac(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {Buffer | TypedArray | DataView}
- Returns: {boolean} `true` if the given `spkac` data structure is valid, `false` otherwise.

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
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = '';
cipher.on('readable', () => {
  const data = cipher.read();
  if (data)
    encrypted += data.toString('hex');
});
cipher.on('end', () => {
  console.log(encrypted);
  // Печатает: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
});

cipher.write('some clear text data');
cipher.end();
```

Пример использования `Cipher` и канальных потоков:

```js
const crypto = require('crypto');
const fs = require('fs');
const cipher = crypto.createCipher('aes192', 'a password');

const input = fs.createReadStream('test.js');
const output = fs.createWriteStream('test.enc');

input.pipe(cipher).pipe(output);
```

Пример использования методов [`cipher.update()`][] и [`cipher.final()`][]:

```js
const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// Печатает: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
```

### cipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
- `outputEncoding` {string}
- Returns: {Buffer | string} Any remaining enciphered contents. If `outputEncoding` parameter is one of `'latin1'`, `'base64'` or `'hex'`, a string is returned. If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

После вызова метода `cipher.final()` объект `Cipher` не может более использоваться для шифрования данных. Попытки вызвать `cipher.final()` более одного раза приведут к выводу ошибки.

### cipher.setAAD(buffer)
<!-- YAML
added: v1.0.0
-->
- `buffer` {Buffer}
- Returns the {Cipher} for method chaining.

При использовании режима проверки подлинности шифрования (на данный момент поддерживается только `GCM`) метод `cipher.setAAD()` устанавливает значение, используемое для входного параметра (AAD) _дополнительная проверка данных_.

Метод `cipher.setAAD()` должен вызываться до [`cipher.update()`][].

### cipher.getAuthTag()
<!-- YAML
added: v1.0.0
-->
- Returns: {Buffer} When using an authenticated encryption mode (only `GCM` is currently supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing the _authentication tag_ that has been computed from the given data.

Метод `cipher.getAuthTag()` должен вызываться только после завершения шифрования методом [`cipher.final()`][].

### cipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
- `autoPadding` {boolean} **Default:** `true`
- Returns: {Cipher} for method chaining.

При использовании блоковых алгоритмов шифрования класс `Cipher` будет автоматически добавлять padding во входящие данные до соответствующего размера блока. Для отключения свойства padding по умолчанию вызовите `cipher.setAutoPadding(false)`.

When `autoPadding` is `false`, the length of the entire input data must be a multiple of the cipher's block size or [`cipher.final()`][] will throw an Error. Отключение автоматического padding полезно для нестандартного заполнения; например, используйте `0x0` вместо PKCS padding.

Метод `cipher.setAutoPadding()` должен быть вызван до [`cipher.final()`][].

### cipher.update(data\[, inputEncoding\]\[, outputEncoding\])
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Возвращает: {Buffer | string}

Обновляет шифр с `data`. If the `inputEncoding` argument is given, its value must be one of `'utf8'`, `'ascii'`, or `'latin1'` and the `data` argument is a string using the specified encoding. If the `inputEncoding` argument is not given, `data` must be a [`Buffer`][], `TypedArray`, or `DataView`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered data, and can be `'latin1'`, `'base64'` or `'hex'`. If the `outputEncoding` is specified, a string using the specified encoding is returned. If no `outputEncoding` is provided, a [`Buffer`][] is returned.

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
const decipher = crypto.createDecipher('aes192', 'a password');

let decrypted = '';
decipher.on('readable', () => {
  const data = decipher.read();
  if (data)
    decrypted += data.toString('utf8');
});
decipher.on('end', () => {
  console.log(decrypted);
  // Prints: some clear text data
});

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
decipher.write(encrypted, 'hex');
decipher.end();
```

Пример использования `Decipher` и канальных потоков:

```js
const crypto = require('crypto');
const fs = require('fs');
const decipher = crypto.createDecipher('aes192', 'a password');

const input = fs.createReadStream('test.enc');
const output = fs.createWriteStream('test.js');

input.pipe(decipher).pipe(output);
```

Пример использования методов [`decipher.update()`][] и [`decipher.final()`][]:

```js
const crypto = require('crypto');
const decipher = crypto.createDecipher('aes192', 'a password');

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
// Prints: some clear text data
```

### decipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
- `outputEncoding` {string}
- Returns: {Buffer | string} Any remaining deciphered contents. If `outputEncoding` parameter is one of `'latin1'`, `'ascii'` or `'utf8'`, a string is returned. If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

После вызова метода `decipher.final()` объект `Decipher` не может более использоваться для дешифровки данных. Попытки вызвать `decipher.final()` более одного раза приведут к выводу ошибки.

### decipher.setAAD(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
- `buffer` {Buffer | TypedArray | DataView}
- Returns: {Cipher} for method chaining.

При использовании режима проверки подлинности шифрования (на данный момент поддерживается только `GCM`) метод `decipher.setAAD()` устанавливает значение, используемое для входного параметра (AAD) _дополнительная проверка данных_.

Метод `decipher.setAAD()` должен вызываться до [`decipher.update()`][].

### decipher.setAuthTag(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
- `buffer` {Buffer | TypedArray | DataView}
- Returns: {Cipher} for method chaining.

При использовании режима проверки подлинности шифрования (на данный момент поддерживается только `GCM`) метод `decipher.setAuthTag()` используется для передачи полученного _тега аутентификации_. Если тег не предоставлен или зашифрованный текст искажен, будет выдано [`decipher.final()`][], указывая, что зашифрованный текст нужно отбросить из-за неудачной аутентификации.

Note that this Node.js version does not verify the length of GCM authentication tags. Such a check *must* be implemented by applications and is crucial to the authenticity of the encrypted data, otherwise, an attacker can use an arbitrarily short authentication tag to increase the chances of successfully passing authentication (up to 0.39%). It is highly recommended to associate one of the values 16, 15, 14, 13, 12, 8 or 4 bytes with each key, and to only permit authentication tags of that length, see [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

Метод `decipher.setAuthTag()` должен быть вызван до [`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
- `autoPadding` {boolean} **Default:** `true`
- Returns: {Cipher} for method chaining.

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
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Возвращает: {Buffer | string}

Обновляет дешифратор с `data`. If the `inputEncoding` argument is given, its value must be one of `'latin1'`, `'base64'`, or `'hex'` and the `data` argument is a string using the specified encoding. If the `inputEncoding` argument is not given, `data` must be a [`Buffer`][]. If `data` is a [`Buffer`][] then `inputEncoding` is ignored.

The `outputEncoding` specifies the output format of the enciphered data, and can be `'latin1'`, `'ascii'` or `'utf8'`. If the `outputEncoding` is specified, a string using the specified encoding is returned. If no `outputEncoding` is provided, a [`Buffer`][] is returned.

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
- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Возвращает: {Buffer | string}

Computes the shared secret using `otherPublicKey` as the other party's public key and returns the computed shared secret. The supplied key is interpreted using the specified `inputEncoding`, and secret is encoded using specified `outputEncoding`. Кодировки могут быть `'latin1'`, `'hex'` или `'base64'`. If the `inputEncoding` is not provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `outputEncoding` is given a string is returned; otherwise, a [`Buffer`][] is returned.

### diffieHellman.generateKeys([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Генерирует приватные и открытые значения ключа Диффи-Хеллмана и возвращает открытый ключ в указанной `encoding`. Этот ключ должен быть передан другой стороне. Кодировка может быть `'latin1'`, `'hex'` или `'base64'`. Если `encoding` задан, то возвращается строка; в ином случае возвращается [`Buffer`][].

### diffieHellman.getGenerator([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Возвращает генератор Диффи-Хеллмана в указанной `encoding`, которая может быть `'latin1'`, `'hex'` или `'base64'`. Если `encoding` задан, то возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.getPrime([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Возвращает простое число Диффи-Хеллмана в указанной `encoding`, которая может быть `'latin1'`, `'hex'` или `'base64'`. Если `encoding` задан, то возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.getPrivateKey([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Возвращает приватный ключ Диффи-Хеллмана в указанной `encoding`, которая может быть `'latin1'`, `'hex'` или `'base64'`. Если `encoding` задан, возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.getPublicKey([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Возвращает открытый ключ Диффи-Хеллмана в указанной `encoding`, которая может быть `'latin1'`, `'hex'` или `'base64'`. Если `encoding` задан, возвращается строка, в ином случае возвращается [`Buffer`][].

### diffieHellman.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.5.0
-->
- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Задает приватный ключ Диффи-Хеллмана. If the `encoding` argument is provided and is either `'latin1'`, `'hex'`, or `'base64'`, `privateKey` is expected to be a string. If no `encoding` is provided, `privateKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.5.0
-->
- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Задает открытый ключ Диффи-Хеллмана. If the `encoding` argument is provided and is either `'latin1'`, `'hex'` or `'base64'`, `publicKey` is expected to be a string. If no `encoding` is provided, `publicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

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

### ecdh.computeSecret(otherPublicKey\[, inputEncoding\]\[, outputEncoding\])
<!-- YAML
added: v0.11.14
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Возвращает: {Buffer | string}

Computes the shared secret using `otherPublicKey` as the other party's public key and returns the computed shared secret. The supplied key is interpreted using specified `inputEncoding`, and the returned secret is encoded using the specified `outputEncoding`. Кодировки могут быть `'latin1'`, `'hex'` или `'base64'`. If the `inputEncoding` is not provided, `otherPublicKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `outputEncoding` is given a string will be returned; otherwise a [`Buffer`][] is returned.

### ecdh.generateKeys([encoding[, format]])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- `format` {string} **Default:** `uncompressed`
- Возвращает: {Buffer | string}

Генерирует приватные и открытые значения ключа Диффи-Хеллмана и возвращает открытый ключ в указанных `format` и `encoding`. Этот ключ должен быть передан другой стороне.

The `format` argument specifies point encoding and can be `'compressed'` or `'uncompressed'`. If `format` is not specified, the point will be returned in `'uncompressed'` format.

Аргумент `encoding` может быть `'latin1'`, `'hex'` или `'base64'`. Если `encoding` задан, то возвращается строка, в ином случае возвращается [`Buffer`][].

### ecdh.getPrivateKey([encoding])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- Returns: {Buffer | string} The EC Diffie-Hellman private key in the specified `encoding`, which can be `'latin1'`, `'hex'`, or `'base64'`. If `encoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.getPublicKey(\[encoding\]\[, format\])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- `format` {string} **Default:** `uncompressed`
- Returns: {Buffer | string} The EC Diffie-Hellman public key in the specified `encoding` and `format`.

The `format` argument specifies point encoding and can be `'compressed'` or `'uncompressed'`. If `format` is not specified the point will be returned in `'uncompressed'` format.

Аргумент `encoding` может быть `'latin1'`, `'hex'` или `'base64'`. Если параметр `encoding` задан, возвращается строка; в ином случае возвращается [`Buffer`][].

### ecdh.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.11.14
-->
- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Задает приватный ключ EC Диффи-Хеллмана. `encoding` может быть `'latin1'`, `'hex'` или `'base64'`. If `encoding` is provided, `privateKey` is expected to be a string; otherwise `privateKey` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

If `privateKey` is not valid for the curve specified when the `ECDH` object was created, an error is thrown. При установке закрытого ключа соответствующая открытая точка (ключ) также генерируется и устанавливается в объекте ECDH.

### ecdh.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Стабильность: 0 - Устарело

- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Устанавливает открытый ключ EC Диффи-Хеллмана. Кодировка ключа может быть `'latin1'`, `'hex'` или `'base64'`. If `encoding` is provided `publicKey` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

Обратите внимание, что обычно нет причины вызывать этот метод, потому что для вычисления общего секрета `ECDH` требует только закрытый ключ и открытый ключ другой стороны. Обычно вызывается [`ecdh.generateKeys()`][] или [`ecdh.setPrivateKey()`][]. Метод [`ecdh.setPrivateKey()`][] пытается сгенерировать публичную точку (ключ), связанную с установленным приватным ключом.

Пример (получение общего секрета):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// Примечание: Это быстрый способ указать предыдущие
// приватные ключи Алисы. Было бы неразумно использовать такой предсказуемый закрытый ключ в реальном
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
  const data = hash.read();
  if (data) {
    console.log(data.toString('hex'));
    // Печатает:
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

### hash.digest([encoding])
<!-- YAML
added: v0.1.92
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Вычисляет дайджест из всех данных, переданных для хеширования (с использованием метода [`hash.update()`][]). `encoding` может быть `'hex'`, `'latin1'` или `'base64'`. Если параметр `encoding` задан, то возвращается строка, в ином случае возвращается a [`Buffer`][].

Объект `Hash` не может снова использоваться после вызова метода `hash.digest()`. Множественные вызовы приведут к выводу ошибки.

### hash.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the hash content with the given `data`, the encoding of which is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or `'latin1'`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

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
  const data = hmac.read();
  if (data) {
    console.log(data.toString('hex'));
    // Печатает:
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

### hmac.digest([encoding])
<!-- YAML
added: v0.1.94
-->
- `encoding` {string}
- Возвращает: {Buffer | string}

Вычисляет дайджест HMAC всех данных, переданных с помощью [`hmac.update()`][]. `encoding` может быть `'hex'`, `'latin1'` или `'base64'`. Если параметр `encoding` задан, то возвращается строка; в ином случае возвращается [`Buffer`][];

Объект `Hmac` не может снова использоваться после вызова `hmac.digest()`. Множественные вызовы `hmac.digest()` приведут к выводу ошибки.

### hmac.update(data[, inputEncoding])
<!-- YAML
added: v0.1.94
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Hmac` content with the given `data`, the encoding of which is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or `'latin1'`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

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

### sign.sign(privateKey[, outputFormat])
<!-- YAML
added: v0.1.92
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->
- `privateKey` {string | Object}
  - `key` {string}
  - `passphrase` {string}
- `outputFormat` {string}
- Возвращает: {Buffer | string}

Вычисляет подпись на всех данных, передаваемых с помощью [`sign.update()`][] или [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

The `privateKey` argument can be an object or a string. If `privateKey` is a string, it is treated as a raw key with no passphrase. If `privateKey` is an object, it must contain one or more of the following properties:

* `key`: {string} - PEM-кодированный приватный ключ (требуется)
* `passphrase`: {string} - ключевая фраза для закрытого ключа
* `padding`: {integer} - Опциональное значение заполнения для RSA, одно из следующих:
  * `crypto.constants.RSA_PKCS1_PADDING` (по умолчанию)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Обратите внимание, что `RSA_PKCS1_PSS_PADDING` будет использовать MGF1 с той же хеш-функцией, которая использовалась для подписи сообщения, как указано в разделе 3.1 [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - длина соли, когда параметр заполнения равен `RSA_PKCS1_PSS_PADDING`. Специальное значение `crypto.constants.RSA_PSS_SALTLEN_DIGEST` задает длину соли на размер дайджеста, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (по умолчанию) устанавливает его в максимально допустимое значение.

The `outputFormat` can specify one of `'latin1'`, `'hex'` or `'base64'`. If `outputFormat` is provided a string is returned; otherwise a [`Buffer`][] is returned.

Объект `Sign` не может снова использоваться после вызова метода `sign.sign()`. Множественные вызовы `sign.sign()` приведут к выводу ошибки.

### sign.update(data[, inputEncoding])
<!-- YAML
added: v0.1.92
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5522
    description: The default `inputEncoding` changed from `binary` to `utf8`.
-->
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Sign` content with the given `data`, the encoding of which is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or `'latin1'`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

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
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Verify` content with the given `data`, the encoding of which is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or `'latin1'`. Если `encoding` не предоставляется, а `data` является строкой, то применяется кодировка `'utf8'`. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

Этот метод можно вызвать много раз с новыми данными в потоковом режиме.

### verify.verify(object, signature[, signatureFormat])
<!-- YAML
added: v0.1.92
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->
- `object` {string | Object}
- `signature` {string | Buffer | TypedArray | DataView}
- `signatureFormat` {string}
- Returns: {boolean} `true` or `false` depending on the validity of the signature for the data and public key.

Проверяет предоставленные данные при помощи заданных `object` и `signature`. Аргумент `object` может быть либо строкой, содержащей PEM-кодированный объект, который может быть открытым ключом RSA, открытым ключом DSA или сертификатом X.509, либо объектом с одним или несколькими из следующих свойств:

* `key`: {string} - открытый ключ в PEM кодировке (требуется)
* `padding`: {integer} - Опциональное значение заполнения для RSA, одно из следующих:
  * `crypto.constants.RSA_PKCS1_PADDING` (по умолчанию)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Обратите внимание, что `RSA_PKCS1_PSS_PADDING` будет использовать MGF1 с той же хеш-функцией, которая использовалась для проверки сообщения, как указано в разделе 3.1 [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - длина соли, когда параметр заполнения равен `RSA_PKCS1_PSS_PADDING`. Специальное значение `crypto.constants.RSA_PSS_SALTLEN_DIGEST` задает длину соли на размер дайджеста, а `crypto.constants.RSA_PSS_SALTLEN_AUTO` (по умолчанию) заставляет его определяться автоматически.

The `signature` argument is the previously calculated signature for the data, in the `signatureFormat` which can be `'latin1'`, `'hex'` or `'base64'`. If a `signatureFormat` is specified, the `signature` is expected to be a string; otherwise `signature` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

The `verify` object can not be used again after `verify.verify()` has been called. Множественные вызовы `verify.verify()` приведут к выводу ошибки.

## Методы и свойства модуля `crypto`

### crypto.constants
<!-- YAML
added: v6.3.0
-->
- Returns: {Object} An object containing commonly used constants for crypto and security related operations. The specific constants currently defined are described in [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING
<!-- YAML
added: v0.9.3
-->

Кодировка по умолчанию для использования в функциях, которые могут принимать как строки, так и [buffers][`Buffer`]. `'buffer'` - значение по умолчанию, что делает методы применяемыми по умолчанию к объектам [`Buffer`][].

Механизм `crypto.DEFAULT_ENCODING` предназначен для обратной совместимости с устаревшими программами, которые ожидают, что `'latin1'` будет кодировкой по умолчанию.

Новые приложения должны ожидать, что по умолчанию будет `'buffer'`. Это свойство может стать устаревшим в следующем релизе Node.js.

### crypto.fips
<!-- YAML
added: v6.0.0
-->

Свойство для проверки и контроля того, используется ли в настоящее время FIPS-совместимый поставщик криптографии. Установка значения "true" требует FIPS-сборки Node.js.

### crypto.createCipher(algorithm, password[, options])
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Возвращает: {Cipher}

Создает и возвращает объект `Cipher`, который использует заданные `algorithm` и `password`. Optional `options` argument controls stream behavior.

`algorithm` зависит от OpenSSL (например, `'aes192'` и т.д.). В последних версиях OpenSSL `openssl list-cipher-algorithms` будет отображать доступные алгоритмы шифрования.

`password` используется для получения ключа шифрования и вектора инициализации (IV). The value must be either a `'latin1'` encoded string, a [`Buffer`][], a `TypedArray`, or a `DataView`.

Реализация `crypto.createCipher()` позволяет получать ключи с помощью функции OpenSSL [`EVP_BytesToKey`][] с алгоритмом дайджеста, установленным на MD5, одну итерацию и без соли. Отсутствие соли позволяет атаковать словарь, как один и тот же пароль всегда создает один и тот же ключ. Малое количество итераций и криптографически небезопасный алгоритм хеширования позволяют быстро проверять пароли.

В соответствии с рекомендацией OpenSSL по использованию PBKDF2 вместо [`EVP_BytesToKey`][] разработчикам рекомендуется самостоятельно получать ключ и IV с помощью [`crypto.pbkdf2()`][] и использовать [`crypto.createCipheriv()`][] для создания объекта `Cipher`. Users should not use ciphers with counter mode (e.g. CTR, GCM, or CCM) in `crypto.createCipher()`. Когда они используются, выдается предупреждение, чтобы избежать риска повторного использования IV, что вызывает уязвимости. For the case when IV is reused in GCM, see \[Nonce-Disrespecting Adversaries\]\[\] for details.

### crypto.createCipheriv(algorithm, key, iv[, options])
<!-- YAML
added: v0.1.94
changes:
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/18644
    description: The `iv` parameter may now be `null` for ciphers which do not
                 need an initialization vector.
-->
- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `iv` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Возвращает: {Cipher}

Создает и возвращает объект `Cipher` с заданными `algorithm`, `key` и вектором инициализации (`iv`). Optional `options` argument controls stream behavior.

`algorithm` зависит от OpenSSL (например, `'aes192'` и т.д.). В последних версиях OpenSSL `openssl list-cipher-algorithms` будет отображать доступные алгоритмы шифрования.

`key` - это необработанный ключ, который используется `algorithm` и `iv` и является [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Оба аргумента должны быть кодированными строками `'utf8'`, [Buffers][`Buffer`], `TypedArray` или `DataView`. If the cipher does not need an initialization vector, `iv` may be `null`.

### crypto.createCredentials(details)
<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Стабильность: 0 - Устарело: Вместо этого используйте [`tls.createSecureContext()`][].

- `details` {Object} Идентичен [`tls.createSecureContext()`][].

Метод `crypto.createCredentials()` является устаревшей функцией для создания и возврата `tls.SecureContext`. Он не должен использоваться. Замените его на [`tls.createSecureContext()`][], который имеет точно такие же аргументы и возвращаемое значение.

Возвращает `tls.SecureContext`, как если бы был вызван [`tls.createSecureContext()`][].

### crypto.createDecipher(algorithm, password[, options])
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Возвращает: {Decipher}

Создает и возвращает объект `Decipher`, который использует заданные `algorithm` и `password` (ключ). Optional `options` argument controls stream behavior.

Реализация `crypto.createDecipher()` позволяет получать ключи с помощью функции OpenSSL [`EVP_BytesToKey`][] с алгоритмом дайджеста, установленным на MD5, одну итерацию и без соли. Отсутствие соли позволяет атаковать словарь, как один и тот же пароль всегда создает один и тот же ключ. Малое количество итераций и криптографически небезопасный алгоритм хеширования позволяют быстро проверять пароли.

В соответствии с рекомендацией OpenSSL по использованию PBKDF2 вместо [`EVP_BytesToKey`][] разработчикам рекомендуется самостоятельно получать ключ и IV с помощью [`crypto.pbkdf2()`][] и использовать [`crypto.createDecipheriv()`][] для создания объекта `Decipher`.

### crypto.createDecipheriv(algorithm, key, iv[, options])
<!-- YAML
added: v0.1.94
changes:
  - version: v8.12.0
    pr-url: https://github.com/nodejs/node/pull/18644
    description: The `iv` parameter may now be `null` for ciphers which do not
                 need an initialization vector.
-->
- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `iv` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Возвращает: {Decipher}

Создает и возвращает объект `Decipher`, который использует заданные `algorithm`, `key` и вектор инициализации (`iv`). Optional `options` argument controls stream behavior.

`algorithm` зависит от OpenSSL (например, `'aes192'` и т.д.). В последних версиях OpenSSL `openssl list-cipher-algorithms` будет отображать доступные алгоритмы шифрования.

`key` - это необработанный ключ, который используется `algorithm` и `iv` и является [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Оба аргумента должны быть кодированными строками `'utf8'`, [Buffers][`Buffer`], `TypedArray` или `DataView`. If the cipher does not need an initialization vector, `iv` may be `null`.

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
- `prime` {string | Buffer | TypedArray | DataView}
- `primeEncoding` {string}
- `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
- `generatorEncoding` {string}

Создает объект обмена ключами `DiffieHellman` с помощью предоставленного `prime` и дополнительного конкретного `generator`.

Аргумент `generator` может быть числом, строкой или [`Buffer`][]. Если `generator` не указан, используется значение `2`.

The `primeEncoding` and `generatorEncoding` arguments can be `'latin1'`, `'hex'`, or `'base64'`.

If `primeEncoding` is specified, `prime` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

If `generatorEncoding` is specified, `generator` is expected to be a string; otherwise a number, [`Buffer`][], `TypedArray`, or `DataView` is expected.

### crypto.createDiffieHellman(primeLength[, generator])
<!-- YAML
added: v0.5.0
-->
- `primeLength` {number}
- `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`

Creates a `DiffieHellman` key exchange object and generates a prime of `primeLength` bits using an optional specific numeric `generator`. Если `generator` не указан, используется значение `2`.

### crypto.createECDH(curveName)
<!-- YAML
added: v0.11.14
-->
- `curveName` {string}

Creates an Elliptic Curve Diffie-Hellman (`ECDH`) key exchange object using a predefined curve specified by the `curveName` string. Используйте [`crypto.getCurves()`][] для получения списка доступных названий кривых. В последних версиях OpenSSL `openssl ecparam -list_curves` также будет отображать название и описание каждой доступной эллиптической кривой.

### crypto.createHash(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}
- `options` {Object} [`stream.transform` options][]
- Возвращает: {Hash}

Создает и возвращает объект `Hash`, который может использоваться для генерации хеш-дайджестов с помощью заданного `algorithm`. Optional `options` argument controls stream behavior.

`algorithm` зависит от доступных алгоритмов, поддерживаемых версией OpenSSL на платформе. Например, `'sha256'`, `'sha512'` и т.д. В последних версиях OpenSSL `openssl list-message-digest-algorithms` будет отображать доступные дайджест-алгоритмы.

Пример генерации суммы файла sha256

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hash = crypto.createHash('sha256');

const input = fs.createReadStream(filename);
input.on('readable', () => {
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
- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Возвращает: {Hmac}

Создает и возвращает объект `Hmac`, который использует заданные `algorithm` и `key`. Optional `options` argument controls stream behavior.

`algorithm` зависит от доступных алгоритмов, поддерживаемых версией OpenSSL на платформе. Например, `'sha256'`, `'sha512'` и т.д. В последних версиях OpenSSL `openssl list-message-digest-algorithms` будет отображать доступные дайджест-алгоритмы.

`key` - это ключ HMAC, используемый для генерации криптографического хеша HMAC.

Пример генерации sha256 HMAC файла

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream(filename);
input.on('readable', () => {
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
- `algorithm` {string}
- `options` {Object} [`stream.Writable` options][]
- Возвращает: {Sign}

Создает и возвращает объект `Sign`, который использует заданный `algorithm`. Используйте [`crypto.getHashes()`][] для получения массива имен доступных алгоритмов подписи. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.createVerify(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}
- `options` {Object} [`stream.Writable` options][]
- Возвращает: {Verify}

Создает и возвращает объект `Verify`, который использует заданный алгоритм. Используйте [`crypto.getHashes()`][] для получения массива имен доступных алгоритмов подписи. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.getCiphers()
<!-- YAML
added: v0.9.3
-->
- Returns: {string[]} An array with the names of the supported cipher algorithms.

Пример:

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()
<!-- YAML
added: v2.3.0
-->
- Returns: {string[]} An array with the names of the supported elliptic curves.

Пример:

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)
<!-- YAML
added: v0.7.5
-->
- `groupName` {string}
- Возвращает: {Object}

Создает предопределенный объект обмена ключами `DiffieHellman`. Поддерживаемые группы: `'modp1'`, `'modp2'`, `'modp5'` (определено в [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), но смотрите [Caveats](#crypto_support_for_weak_or_compromised_algorithms)) и `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (определено в [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). Возвращаемый объект копирует интерфейс объектов, созданных с помощью [`crypto.createDiffieHellman()`][], но не позволит изменить ключи (например, с [`diffieHellman.setPublicKey()`][]). Преимущество использования этого метода в том, что стороны не должны создавать и обменивать групповые модули заранее, экономя время процессора и сессии.

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

### crypto.getHashes()
<!-- YAML
added: v0.9.3
-->
- Returns: {string[]} An array of the names of the supported hash algorithms, such as `'RSA-SHA256'`.

Пример:

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
- `password` {string}
- `salt` {string}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}
- `callback` {Function}
  - `err` {Error}
  - `derivedKey` {Buffer}

Предоставляет асинхронную реализацию функции получения ключа на основе пароля 2 (PBKDF2). Выбранный алгоритм дайджеста HMAC, заданный `digest`, применяется для получения ключа требуемой длины в байтах (`keylen`) из `password`, `salt` и `iterations`.

Предоставленная функция `callback` вызывается с двумя аргументами: `err` и `derivedKey`. Если возникает ошибка, будет установлен `err`; в ином случае `err` будет равен нулю. Успешно сгенерированный `derivedKey` будет передан как [`Buffer`][].

Аргумент `iterations` должен быть максимально возможным числом. Чем больше число итераций, тем более безопасным будет полученный ключ, но займет больше времени для завершения.

`salt` также должен быть максимально уникальным. Рекомендуется, чтобы соли были случайными и имели длину не менее 16 байт. Для более подробной информации смотрите [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf).

Пример:

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...08d59ae'
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
- `password` {string}
- `salt` {string}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}
- Возвращает: {Buffer}

Предоставляет асинхронную реализацию функции получения ключа на основе пароля 2 (PBKDF2). Выбранный алгоритм дайджеста HMAC, заданный `digest`, применяется для получения ключа требуемой длины в байтах (`keylen`) из `password`, `salt` и `iterations`.

Если возникает ошибка, будет выведено сообщение об ошибке, в ином случае полученный ключ вернется как [`Buffer`][].

Аргумент `iterations` должен быть максимально возможным числом. Чем больше число итераций, тем более безопасным будет полученный ключ, но займет больше времени для завершения.

`salt` также должен быть максимально уникальным. Рекомендуется, чтобы соли были случайными и имели длину не менее 16 байт. Для более подробной информации смотрите [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf).

Пример:

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512');
console.log(key.toString('hex'));  // '3745e48...08d59ae'
```

Массив поддерживаемых дайджест-функций можно получить с помощью [`crypto.getHashes()`][].

### crypto.privateDecrypt(privateKey, buffer)
<!-- YAML
added: v0.11.14
-->
- `privateKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Returns: {Buffer} A new `Buffer` with the decrypted content.

Decrypts `buffer` with `privateKey`.

`privateKey` can be an object or a string. If `privateKey` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_OAEP_PADDING`.

### crypto.privateEncrypt(privateKey, buffer)
<!-- YAML
added: v1.1.0
-->
- `privateKey` {Object | string}
  - `key` {string} A PEM encoded private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `RSA_PKCS1_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Returns: {Buffer} A new `Buffer` with the encrypted content.

Encrypts `buffer` with `privateKey`.

`privateKey` can be an object or a string. If `privateKey` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_PADDING`.

### crypto.publicDecrypt(key, buffer)
<!-- YAML
added: v1.1.0
-->
- `key` {Object | string}
  - `key` {string} A PEM encoded public or private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `RSA_PKCS1_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Returns: {Buffer} A new `Buffer` with the decrypted content.

Decrypts `buffer` with `key`.

`key` can be an object or a string. If `key` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_PADDING`.

Поскольку открытые ключи RSA могут быть получены из закрытых ключей, закрытый ключ может передаваться вместо открытого ключа.

### crypto.publicEncrypt(key, buffer)
<!-- YAML
added: v0.11.14
-->
- `key` {Object | string}
  - `key` {string} A PEM encoded public or private key.
  - `passphrase` {string} An optional passphrase for the private key.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Returns: {Buffer} A new `Buffer` with the encrypted content.

Encrypts the content of `buffer` with `key` and returns a new [`Buffer`][] with encrypted content.

`key` can be an object or a string. If `key` is a string, it is treated as the key with no passphrase and will use `RSA_PKCS1_OAEP_PADDING`.

Поскольку открытые ключи RSA могут быть получены из закрытых ключей, закрытый ключ может передаваться вместо открытого ключа.

### crypto.randomBytes(size[, callback])
<!-- YAML
added: v0.5.8
-->
- `size` {number}
- `callback` {Function}
  - `err` {Error}
  - `buf` {Buffer}
- Returns: {Buffer} if the `callback` function is not provided.

Генерирует криптографически сильные псевдослучайные данные. Аргумент `size` является числом, отражающим количество байтов для генерации.

Если предусмотрена функция `callback`, байты генерируются асинхронно и функция `callback` вызывается с двумя аргументами: `err` и `buf`. Если возникает ошибка, `err` будет объектом Error; в ином случае значение будет нулевым. Аргумент `buf` является [`Buffer`][], который содержит сгенерированные байты.

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

*Note*: The asynchronous version of `crypto.randomBytes()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomBytes` requests when doing so as part of fulfilling a client request.

### crypto.randomFillSync(buffer\[, offset\]\[, size\])
<!-- YAML
added: v7.10.0
-->

* `buffer` {Buffer|Uint8Array} Должен быть предоставлен.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* Возвращает: {Buffer}

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

### crypto.randomFill(buffer\[, offset\]\[, size\], callback)
<!-- YAML
added: v7.10.0
-->

* `buffer` {Buffer|Uint8Array} Должен быть предоставлен.
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

Note that this API uses libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

*Note*: The asynchronous version of `crypto.randomFill()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomFill` requests when doing so as part of fulfilling a client request.

### crypto.setEngine(engine[, flags])
<!-- YAML
added: v0.11.11
-->
- `engine` {string}
- `flags` {crypto.constants} **Default:** `crypto.constants.ENGINE_METHOD_ALL`

Загрузите и установите `engine` для некоторых или всех функций OpenSSL (выбирается флажками).

`engine` может быть идентификатором или путем к общей библиотеке движка.

Опциональный аргумент `flags` по умолчанию использует `ENGINE_METHOD_ALL`. `flags` - битовое поле, которое принимает один или несколько из следующих флагов (определено в `crypto.constants`):

* `crypto.constants.ENGINE_METHOD_RSA`
* `crypto.constants.ENGINE_METHOD_DSA`
* `crypto.constants.ENGINE_METHOD_DH`
* `crypto.constants.ENGINE_METHOD_RAND`
* `crypto.constants.ENGINE_METHOD_ECDH`
* `crypto.constants.ENGINE_METHOD_ECDSA`
* `crypto.constants.ENGINE_METHOD_CIPHERS`
* `crypto.constants.ENGINE_METHOD_DIGESTS`
* `crypto.constants.ENGINE_METHOD_STORE`
* `crypto.constants.ENGINE_METHOD_PKEY_METHS`
* `crypto.constants.ENGINE_METHOD_PKEY_ASN1_METHS`
* `crypto.constants.ENGINE_METHOD_ALL`
* `crypto.constants.ENGINE_METHOD_NONE`

### crypto.timingSafeEqual(a, b)
<!-- YAML
added: v6.6.0
-->
- `a` {Buffer | TypedArray | DataView}
- `b` {Buffer | TypedArray | DataView}
- Возвращает: {boolean}

Эта функция основана на алгоритме постоянного времени. Возвращает "true", если `a` равно `b`, без утечки информации о времени, что позволило бы злоумышленнику угадать одно из значений. Это подходит для сравнения дайджестов HMAC или секретных значений, таких как cookie аутентификации или [возможности URL-адресов](https://www.w3.org/TR/capability-urls/).

`a` and `b` must both be `Buffer`s, `TypedArray`s, or `DataView`s, and they must have the same length.

*Примечание*: Использование `crypto.timingSafeEqual` не гарантирует, что *окружающий* код безопасен с точки зрения времени. Убедитесь, чтобы окружающий код не вносил временных уязвимостей.

## Примечания

### API унаследованных потоков (ранняя версия Node.js v0.10)

Модуль шифрования был добавлен в Node.js до того, как появилась концепция унифицированного потока API и до того, как появились объекты [`Buffer`][] для обработки бинарных данных. Поэтому многие из определенных классов `crypto` имеют методы, которые обычно не встречаются в других классах Node.js, реализующих [потоки](stream.html) API (например, `update()`, `final()` или `digest()`). Также многие методы по умолчанию принимали и возвращали кодированные строки `'latin1'`, а не буферы. Это значение по умолчанию было изменено после Node.js v0.8, когда вместо этого по умолчанию начали использовать объекты [`Buffer`][].

### Недавние изменения ECDH

Было упрощено использование `ECDH` с нединамически сгенерированными парами ключей. Теперь [`ecdh.setPrivateKey()`][] может быть вызван с предварительно выбранным закрытым ключом, а связанная открытая точка (ключ) будет вычислена и сохранена в объекте. Это позволяет коду хранить и предоставлять только закрытую часть пары ключей EC. Также [`ecdh.setPrivateKey()`][] теперь проверяет, является ли закрытый ключ действительным для выбранной кривой.

В настоящее время метод [`ecdh.setPublicKey()`][] устарел, поскольку его включение в API является бесполезным. Необходимо либо установить ранее сохраненный закрытый ключ, который автоматически генерирует связанный открытый ключ, либо вызвать [`ecdh.generateKeys()`][]. Основным недостатком использования [`ecdh.setPublicKey()`][] является то, что он приводит пару ключей ECDH в несовместимое состояние.

### Поддержка слабых или скомпрометированных алгоритмов

Модуль `crypto` все еще поддерживает некоторые алгоритмы, которые уже скомпрометированы и в настоящее время не рекомендуются для использования. API также позволяет использовать шифры и хеши с малым размером ключа, который считается слишком слабым для безопасного использования.

Пользователи должны нести полную ответственность за выбор алгоритма шифрования и размер ключа, которые будут соответствовать их требованиям безопасности.

На основании рекомендаций [NIST SP 800-131A](http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

- MD5 и SHA-1 более не приемлемы, когда требуется сопротивление столкновению, например, в цифровых подписях.
- The key used with RSA, DSA, and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
- DH группы `modp1`, `modp2` и `modp5` имеют размер ключа менее 2048 битов и не рекомендуются для использования.

Смотрите ссылку на другие рекомендации и детали.

## Константы шифрования

Следующие константы, экспортируемые `crypto.constants`, применяются для различного использования модулей `crypto`, `tls` и `https` и обычно характерны для OpenSSL.

### Опции OpenSSL

<table>
  <tr>
    <th>Константа</th>
    <th>Описание</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Применяет множественные методы обхода ошибок в OpenSSL. См.
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html для
    деталей.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Позволяет устаревшее небезопасное повторное подключение между OpenSSL и неизвестными
 клиентами или серверами. См.
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Пытается использовать предпочтения сервера вместо предпочтений клиента, при
 выборе шифратора. Поведение зависит от версии протокола. См.
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
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
    <td><code>ENGINE_METHOD_ECDH</code></td>
    <td>Ограничение использования движка до ECDH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_ECDSA</code></td>
    <td>Ограничение использования движка до ECDSA</td>
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
    <td><code>ENGINE_METHOD_STORE</code></td>
    <td>Ограничение использования движка до STORE</td>
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
    <td><code>NPN_ENABLED</code></td>
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
    <td>Устанавливает длину соли для "RSA_PKCS1_PSS_PADDING" в размере дайджеста
        при подписании или проверке.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_MAX_SIGN</code></td>
    <td>Устанавливает длину соли для "RSA_PKCS1_PSS_PADDING" в максимально
        допустимое значение при подписании данных.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_AUTO</code></td>
    <td>Приводит к тому, что длина соли для "RSA_PKCS1_PSS_PADDING" определяется
        автоматически при проверке подписи.</td>
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

