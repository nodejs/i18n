# Crypto

<!--introduced_in=v0.3.6-->

> Estability: 2 - Estable

El módulo `crypto` provee funcionalidad criptográfica que incluye un conjunto de empaquetadores para hash de OpenSSL, HMAC, cifrar, descifrar, firmar, y verificar funciones.

Use `require('crypto')` para acceder a este módulo.

```js
const crypto = require('crypto');

const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
console.log(hash);
// Imprime:
//   c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e
```

## Determinar si el soporte de crypto está desactivado

Es posible que Node.js sea compilado sin incluir soporte para el módulo `crypto`. En estos casos, llamar al comando `require('crypto')` arrojará como resultado un error.

```js
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('crypto support is disabled!');
}
```

## Clase: Certificado
<!-- YAML
added: v0.11.8
-->

SPKAC es un mecanismo de Solicitud de Firma Certificado implementado originalmente por Netscape y fue especificado formalmente como parte del [elemento `keygen` de HTML5][].

Note que `<keygen>` es obsoleto desde que [HTML 5.2](https://www.w3.org/TR/html52/changes.html#features-removed) y nuevos proyectos ya no deben usar este elemento.

El módulo `crypto` provee la clase `Certificate` para trabajar con datos SPKAC. El uso más común es el manejo de la salida generada por el elemento HTML5 `<keygen>`. Node.js usa la [implementación de SPKAC de OpenSSL](https://www.openssl.org/docs/man1.1.0/apps/openssl-spkac.html) internamente.

### Certificate.exportChallenge(spkac)
<!-- YAML
added: v9.0.0
-->
* `spack` {string | Buffer | TypedArray | DataView}
* Devuelve: {Buffer} El componente desafío de la estructura de datos `spkac`, que incluye una clave pública y un desafío.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const challenge = Certificate.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Imprime: el desafío como un string UTF8
```

### Certificate.exportPublicKey(spkac[, encoding])
<!-- YAML
added: v9.0.0
-->
* `spkac` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `spkac` string.
* Devuelve: {Buffer} El componente público de la estructura de datos `spkac`, que incluye una clave pública y un desafío.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const publicKey = Certificate.exportPublicKey(spkac);
console.log(publicKey);
// Imprime: la clave pública como <Buffer ...>
```

### Certificate.verifySpkac(spkac)
<!-- YAML
added: v9.0.0
-->
* `spkac` {Buffer | TypedArray | DataView}
* Devuelve: {boolean} `true` si la estructura de datos `spkac` dada es válida, `false` si no lo es.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
console.log(Certificate.verifySpkac(Buffer.from(spkac)));
// Imprime: verdadero o falso
```

### Legado API

Como una interfaz heredada que todavía es compatible, es posible (pero no se recomienda) crear nuevas instancias de la clase `crypto.Certificate` como se ilustra en los ejemplos a continuación.

#### nuevo crypto.Certificate()

Instancias de la clase `Certificate` pueden ser creadas usando la palabra clave `new` o llamando a `crypto.Certificate()` como una función:

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
* Devuelve: {Buffer} El componente desafío de la estructura de datos `spkac`, que incluye una clave pública y un desafío.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Imprime: el desafío como una string en UTF8
```

#### certificate.exportPublicKey(spkac)
<!-- YAML
added: v0.11.8
-->
* `spkac` {string | Buffer | TypedArray | DataView}
* Devuelve: {Buffer} El componente público de la estructura de datos `spkac`, que incluye una clave pública y un desafío.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Imprime: la clave pública como <Buffer ...>
```

#### certificate.verifySpkac(spkac)
<!-- YAML
added: v0.11.8
-->
* `spkac` {Buffer | TypedArray | DataView}
* Devuelve: {boolean} `true` si la estructura de datos `spkac` dada es válida, `false` si no lo es.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Imprime: “true” o “false”
```

## Clase: Cipher
<!-- YAML
added: v0.1.94
-->

Instancias de clase `Cipher` son usadas para encriptar datos. La clase puede ser usada de una o dos maneras:

- Como una [stream](stream.html) que es legible y escribible, donde los datos planos sin encriptar están escritos para producir datos encriptados en el lado legible, o
- Usando los métodos [`cipher.update()`][] y [`cipher.final()`][] para producir datos encriptados.

Los métodos [`crypto.createCipher()`][] o [`crypto.createCipheriv()`][] son usados para crear instancias `Cipher`. Los objetos `Cipher` no deben crearse directamente usando la palabra clave `new`.

Por ejemplo: Usando objetos `Cipher` como streams:

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

Por ejemplo: Usando `Cipher` y piped streams:

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

Por ejemplo: Usando los métodos [`cipher.update()`][] y [`cipher.final()`][]:

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
* Devuelve: {Buffer | string} Cualquier contenido cifrado restante. If `outputEncoding` is specified, a string is returned. Si no se provee una `outputEncoding`, un [`Buffer`][] es devuelto.

Una vez que el método `cipher.final()` ha sido llamado, el objeto `Cipher` no puede ser usado para encriptar datos. Intentar llamar a `cipher.final()` más de una vez producirá un error.

### cipher.setAAD(buffer[, options])
<!-- YAML
added: v1.0.0
-->
* `buffer` {Buffer}
* `options` {Object} [`stream.transform` options][]
  - `plaintextLength` {number}
* Devuelve: {Cipher} como método cadena.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

The `options` argument is optional for `GCM` and `OCB`. Cuando se usa `CCM`, la opción `plaintextLength`  debe estar especificada y su valor debe coincidir con la longitud del texto plano en bytes. Ver [CCM mode](#crypto_ccm_mode).

El método `cipher.setAAD()` debe llamarse antes que [`cipher.update()`][].

### cipher.getAuthTag()
<!-- YAML
added: v1.0.0
-->
* Returns: {Buffer} When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing the _authentication tag_ that has been computed from the given data.

El método `cipher.getAuthTag()` debe ser llamado solamente después de que se completó el encriptado usando el método [`cipher.final()`][].

### cipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
* `autoPadding` {boolean} **Por defecto:** `true`
* Devuelve: {Cipher} como método cadena.

Cuando se usan los algoritmos de encriptación por bloque, de clase `Cipher` automáticamente rellenará los datos de entrada al tamaño de bloque apropiado. Para desactivar el llenado por defecto llame a `cipher.setAutoPadding(false)`.

Cuando `autoPadding` es `false`, la longitud de los datos de entrada debe ser un múltiplo del tamaño del bloque cipher o [`cipher.final()`][] arrojará un error. Desactivar el llenado automático es útil para un llenado no estándar, por ejemplo usando `0x0` en vez del llenado PKCS.

El método `cipher.setAutoPadding()` debe llamarse antes del [`cipher.final()`][].

### cipher.update(data\[, input_encoding\]\[, output_encoding\])
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
* Devuelve: {Buffer | string}

Actualiza el cifrado con `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. Si el argumento `inputEncoding` no es dado, `data` debe ser un [`Buffer`][], `TypedArray`, o `DataView`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces se omite `inputEncoding`.

The `outputEncoding` specifies the output format of the enciphered data. Si el `outputEncoding` es especificado, se devuelve una string que usa el código especificado. Si no se provee un `outputEncoding`, un [`Buffer`][] es devuelto.

El método `cipher.update()` puede ser llamado múltiples veces con nuevos datos hasta que se llame a [`cipher.final()`][]. Si se llama a `cipher.update()` después de [`cipher.final()`][] se producirá un error.

## Clase: Decipher
<!-- YAML
added: v0.1.94
-->

Instancias de la clase `Decipher` son usadas para descifrar datos. La clase puede ser usada de una o dos maneras:

- Como un [stream](stream.html) que es legible y escribible, donde los datos planos encriptados están escritos para producir datos no encriptados en el lado legible, o
- Usando los métodos [`decipher.update()`][] y [`decipher.final()`][] para producir datos no encriptados.

Los métodos [`crypto.createDecipher()`][] o [`crypto.createDecipheriv()`][] son usados para crear instancias `Decipher`. Los objetos `Decipher` no deben crearse directamente usando la palabra clave `new`.

Ejemplo: Usando objetos `Decipher` como streams:

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

Ejemplo: Usando `Decipher` y piped streams:

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

Ejemplo: Usando los métodos [`decipher.update()`][] y [`decipher.final()`][]:

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
* Devuelve: {Buffer | string} Cualquier contenido descifrado restante. If `outputEncoding` is specified, a string is returned. Si no se provee un `outputEncoding`, es devuelto un [`Buffer`][].

Una vez que el método `decipher.final()` ha sido llamado, el objeto `Decipher` no puede ser usado para descifrar datos. Intentar llamar mas de una vez a `decipher.final()` producirá un error.

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
* Devuelve: {Decipher} como método cadena.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

El argumento `options` es opcional para `GCM`. Cuando se usa `CCM`, la opción `plaintextLength`  debe estar especificada y su valor debe coincidir con la longitud del texto plano en bytes. Ver [CCM mode](#crypto_ccm_mode).

El método `decipher.setAAD()` debe llamarse antes de [`decipher.update()`][].

### decipher.setAuthTag(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
* `buffer` {Buffer | TypedArray | DataView}
* Devuelve: {Decipher} como método cadena.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAuthTag()` method is used to pass in the received _authentication tag_. Si no se provee ninguna etiqueta, o si el texto cifrado ha sido manipulado, va a arrojar [`decipher.final()`][], indicando que el texto cifrado debe descartarse por una autenticación fallida.

Note que esta versión de Node.js no verifica la longitud de la etiqueta de autenticación de GCM. Tal control *debe* ser implementado por las aplicaciones y es crucial para la autenticidad de los datos encriptados, de otro modo, un atacante puede usar una etiqueta de autenticación arbitraria corta para aumentar las posibilidades de pasar la autenticación de manera efectiva (hasta un 0.39%). Es altamente recomendable asociar uno de los valores 16, 15, 14, 13, 12, 8 o 4 bytes con cada clave, y solo para permitir etiquetas de autenticación de esa longitud, ver [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

El método `decipher.setAuthTag()` debe ser llamado antes de [`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
* `autoPadding` {boolean} **Por defecto:** `true`
* Devuelve: {Decipher} como método cadena.

Cuando los datos han sido encriptados sin un llenado de bloques estándar, llamar a `decipher.setAutoPadding(false)` va a deshabilitar automáticamente el llenado automático para prevenir a [`decipher.final()`][] de verificar y remover el llenado.

Desactivar el llenado automático sólo funciona si la longitud de datos de entrada es un múltiplo del tamaño de bloques cifrados.

El método `decipher.setAutoPadding()` debe ser llamado antes de [`decipher.final()`][].

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
* Devuelve: {Buffer | string}

Actualiza el descifrado con `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. Si el argumento `inputEncoding` no es dado, `data` debe ser un [`Buffer`][]. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

The `outputEncoding` specifies the output format of the enciphered data. Si el `outputEncoding` es especificado, se devuelve una string que usa el código especificado. Si no se provee un `outputEncoding`, un [`Buffer`][] es devuelto.

El método `decipher.update()` puede ser llamado múltiples veces con nuevos datos hasta que es llamado [`decipher.final()`][]. Si se llama a `decipher.update()` después de [`decipher.final()`][] se producirá un error.

## Tipo: DiffieHellman
<!-- YAML
added: v0.5.0
-->

La clase `DiffieHellman` es una herramienta útil para crear intercambios de clave Diffie-Hellman.

Las instancias de la clase `DiffieHellman` pueden ser creadas usando la función [`crypto.createDiffieHellman()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Generate Alice's keys...
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// Genera las llaves de Bob...
const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
const bobKey = bob.generateKeys();

// intercambian y generan el secreto...
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
* Devuelve: {Buffer | string}

Computa el secreto compartido usando `otherPublicKey` como la clave pública de la otra parte y devuelve el secreto compartido computado. La clave dada es interpretada usando el `inputEncoding` especificado, y el secreto es codificado usando el `outputEncoding` especificado. Si el `inputEncoding` no es dado, `otherPublicKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si el `outputEncoding` es dado, una string es devuelta; de no ser así, un [`Buffer`][] es devuelto.

### diffieHellman.generateKeys([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Genera valores de claves Diffie-Hellman privadas y públicas, y devuelve la clave pública en el `encoding` especificado. Esta clave debe ser transferida a la otra parte. Si `encoding` es dado, una string es devuelta; de no ser así, un [`Buffer`][] es devuelto.

### diffieHellman.getGenerator([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Returns the Diffie-Hellman generator in the specified `encoding`. Si `encoding` es dado, una string es devuelta, de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPrime([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Returns the Diffie-Hellman prime in the specified `encoding`. Si `encoding` es dado, una string es devuelta, de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPrivateKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Returns the Diffie-Hellman private key in the specified `encoding`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPublicKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Returns the Diffie-Hellman public key in the specified `encoding`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.5.0
-->
* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Establece la clave privada Diffie-Hellman. If the `encoding` argument is provided, `privateKey` is expected to be a string. Si no se proporciona `encoding`, `privateKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.5.0
-->
* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Establece la clave pública Diffie-Hellman. If the `encoding` argument is provided, `publicKey` is expected to be a string. Si no es proporcionado `encoding`, `publicKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

### diffieHellman.verifyError
<!-- YAML
added: v0.11.12
-->

Un campo de bits que contiene advertencias y/o errores que resultan de un chequeo realizado durante el inicio del objeto `DiffieHellman`.

Los valores a continuación son válidos para esta propiedad (como es definido en el módulo`constants`):

* `DH_CHECK_P_NOT_SAFE_PRIME`
* `DH_CHECK_P_NOT_PRIME`
* `DH_UNABLE_TO_CHECK_GENERATOR`
* `DH_NOT_SUITABLE_GENERATOR`

## Clase: ECDH
<!-- YAML
added: v0.11.14
-->

La clase `ECDH` es una utilidad para crear la Curva Elíptica Diffie-Hellman (ECDH) de intercambios de claves.

Las instancias de clase `ECDH` pueden ser creadas usando la función [`crypto.createECDH()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Generate Alice's keys...
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// Generar las llaves de Bob...
const bob = crypto.createECDH('secp521r1');
const bobKey = bob.generateKeys();

// Intercambiar y generar el secreto...
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
* Devuelve: {Buffer | string}

Convierte la clave pública EC Diffie-Hellman especificada por `key` y `curve` al formato especificado por el `format`. El argumento `format` especifica la codificación de puntos y puede ser `'compressed'`, `'uncompressed'` o `'hybrid'`. La clave proporcionada es interpretada usando el `inputEncoding` especificado, y la clave es devuelta usando el `outputEncoding` especificado.

Use [`crypto.getCurves()`][] para obtener una lista de nombres de curvas disponibles. En las últimas versiones de OpenSSL, `openssl ecparam -list_curves` también mostrará el nombre y la descripción disponible de cada curva elíptica.

Si `format` no es especificado el punto será devuelto en formato `'uncompressed'`.

Si `inputEncoding` no es dado, `key` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Ejemplo (descomprimiendo una clave):

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
* Devuelve: {Buffer | string}

Computa el secreto compartido usando `otherPublicKey` como la clave pública de la otra parte y devuelve el secreto compartido computado. La clave suministrada es interpretada usando `inputEncoding` especificado, y el secreto devuelto es codificado usando `outputEncoding`. Si el `inputEncoding` no es dado, `otherPublicKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si `outputEncoding` es dado, una string será devuelta; de no ser así un [`Buffer`][] es devuelto.

`ecdh.computeSecret` arrojará un error `ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY` cuando `otherPublicKey` se encuentre fuera de la curva elíptica. Desde que `otherPublicKey` es usualmente dado, desde un usuario remoto a través de una red insegura, es recomendable para los desarrolladores manejar esta excepción como corresponde.

### ecdh.generateKeys([encoding[, format]])
<!-- YAML
added: v0.11.14
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Devuelve: {Buffer | string}

Genera los valores de la clave EC Diffie-Hellman privados y públicos, y devuelve la clave pública en el `format` y `encoding` especificado. Esta clave debe ser transferida a la otra parte.

El argumento `format` especifica la codificación de puntos y puede ser `'compressed'` o `'uncompressed'`. Si `format` no es especificado, el punto será devuelto en formato `'uncompressed'`.

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
* Devuelve: {Buffer | string} La clave pública EC Diffie-Hellman en el `encoding` y `format` especificado.

El argumento `format` especifica la codificación de puntos y puede ser `'compressed'` o `'uncompressed'`. Si `format` no es especificado, el punto será devuelto en formato `'uncompressed'`.

If `encoding` is specified, a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.11.14
-->
* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Establece la clave privada EC Diffie-Hellman. Si `encoding` es dado, `privateKey` se espera que sea una string; de no ser así `privateKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si `privateKey` no es válido para la curva especificada cuando el objeto `ECDH` fue creado, se produce un error. Sobre la configuración de la clave privada, el punto público asociado (clave) es también generado y establecido en el objeto `ECDH`.

### ecdh.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Estabilidad: 0 - En desuso

* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Establece la clave pública EC Diffie-Hellman. Si `encoding` es dado, se espera que `publicKey` sea una string; de no ser así un [`Buffer`][], `TypedArray`, o `DataView` es esperado.

Note que no hay normalmente una razón para llamar a este método porque `ECDH` solo requiere una clave privada y la clave pública de la otra parte para computar el secreto compartido. Tipicamente [`ecdh.generateKeys()`][] o [`ecdh.setPrivateKey()`][] serán llamados. El método [`ecdh.setPrivateKey()`][] intenta generar la clave/punto público asociado con la clave privada que se está configurando.

Ejemplo (obteniendo un secreto compartido):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// This is a shortcut way of specifying one of Alice's previous private
// keys. Sería poco inteligente usar una clave privada predecible en una 
// aplicación real.
alice.setPrivateKey(
  crypto.createHash('sha256').update('alice', 'utf8').digest()
);

// Bob usa una nueva generada criptográficamente fuerte
// clave par pseudoaleatoria
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

// El secreto de Alice y de Bob debe tener el mismo valor de secreto compartido 

console.log(aliceSecret === bobSecret);
```

## Clase: Hash
<!-- YAML
added: v0.1.92
-->

La clase `Hash` es una utilidad para crear resúmenes hash de datos. Puede ser usado de una de las dos maneras:

- Como una [stream](stream.html) que es legible y escribible, donde los datos son escritos para producir un resumen hash computado en el lado legible, o
- Usando el método [`hash.update()`][] y [`hash.digest()`][] para producir el hash computado.

El método [`crypto.createHash()`][] es usado para crear las instancias `Hash`. Los objetos `Hash` no deben crearse directamente usando la palabra clave `new`.

Ejemplo: Usando los objetos `Hash` como streams:

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

Ejemplo: Usando `Hash` y piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');

const input = fs.createReadStream('test.js');
input.pipe(hash).pipe(process.stdout);
```

Ejemplo: Usando los métodos [`hash.update()`][] y [`hash.digest()`][]:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('some data to hash');
console.log(hash.digest('hex'));
// Imprime:
//   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
```

### hash.digest([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.1.92
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Calcula el resumen de todos los datos pasados para ser hashed (usando el método [`hash.update()`][]). Si`encoding` es dado, una string será devuelta; de no ser así un [`Buffer`][] es devuelto.

El objeto `Hash` no puede ser usado nuevamente después de que el método `hash.digest()` ha sido llamado. Llamados múltiples causaran que se arroje un error.

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

Updates the hash content with the given `data`, the encoding of which is given in `inputEncoding`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

## Clase: Hmac
<!-- YAML
added: v0.1.94
-->

La clase `Hmac` es una utilidad para crear resúmenes criptográficos HMAC. Puede ser usado de una de las dos maneras:

- Como una [stream](stream.html) que es tanto legible como escribible, donde los datos son escritos para producir un resúmen computado HMAC en el lado legible, o
- Usando los métodos [`hmac.update()`][] y [`hmac.digest()`][] para producir el resúmen HMAC.

El método [`crypto.createHmac()`][] es usado para crear instancias `Hmac`. Los objetos `Hmac` no deben crearse directamente usando la palabra clave `new`.

Ejemplo: Usando objetos `Hmac` como streams:

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

Ejemplo: Usando `Hmac` y piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream('test.js');
input.pipe(hmac).pipe(process.stdout);
```

Ejemplo: Usando los métodos [`hmac.update()`][] y [`hmac.digest()`][]:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.update('some data to hash');
console.log(hmac.digest('hex'));
// Imprime:
//   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
```

### hmac.digest([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.1.94
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Devuelve: {Buffer | string}

Calcula el resúmen HMAC de todos los datos pasados usando [`hmac.update()`][]. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto;

El objeto `Hmac` no puede ser usado nuevamente después de que `hmac.digest()` ha sido llamado. Llamadas múltiples a `hmac.digest()` producirá un error.

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

Updates the `Hmac` content with the given `data`, the encoding of which is given in `inputEncoding`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

## Clase: Sign
<!-- YAML
added: v0.1.92
-->

La clase `Sign` es una utilidad para generar firmas. Puede ser usada de una de las dos maneras:

- Como una [stream](stream.html) escribible, donde los datos a ser firmados están escritos y el método [`sign.sign()`][] es usado para generar y devolver la firma, o
- Usando los métodos [`sign.update()`][] y [`sign.sign()`][] para producir la firma.

El método [`crypto.createSign()`][] es usado para crear instancias `Sign`. El argumento es el nombre de la string de la función hash a utilizar. Los objetos `Sign` no deben crearse usando directamente la palabra clave `new`.

Ejemplo: Usando objetos`Sign` como streams:

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.write('some data to sign');
sign.end();

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Imprime: la firma calculada usando la clave privada especificada y el
// SHA-256. Para las llaves RSA, el algoritmo es RSASSA-PKCS1-v1_5 (ver el parámetro
// padding a continuación para RSASSA-PSS). El algoritmo es ECDSA para las llaves EC.
```

Ejemplo: Usando los métodos [`sign.update()`][] y [`sign.sign()`][]:

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Imprime: la firma calculada
```

En algunos casos, una instancia `Sign` puede también ser creada pasando un nombre de algoritmo de firma, como lo es 'RSA-SHA256'. Esto va a usar el algoritmo de resumen correspondiente. Esto no funciona para todos los algoritmos de firmas, tales como 'ecdsa-with-SHA256'. En su lugar, use nombres resumidos.

Ejemplo: firmando usando el nombre del algoritmo de firma heredado

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Imprime: la firma calculada
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
* Devuelve: {Buffer | string}

Calcula la firma de todos los datos pasados usando [`sign.update()`][] o [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

El argumento `privateKey` puede ser un objeto o una string. Si `privateKey` es una string, se trata como una clave cruda sin frase de contraseña. Si `privateKey` es un objeto, debe contener una o más de las siguientes propiedades:

* `key`: {string} - Clave privada con codificación PEM (requerida)
* `passphrase`: {string} - frase de contraseña para la clave privada
* `padding`: {integer} - Valor de llenado opcional para RSA, uno de los siguientes:
  * `crypto.constants.RSA_PKCS1_PADDING` (por defecto)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Tenga en cuenta que `RSA_PKCS1_PSS_PADDING` va a usar MGF1 con la misma función hash usada para firmar el mensaje como se especifica en la sección 3.1 de [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - longitud de sal para cuando el relleno es `RSA_PKCS1_PSS_PADDING`. El valor especial `crypto.constants.RSA_PSS_SALTLEN_DIGEST` establece la longitud de sal del tamaño resumido, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (por defecto) lo establece en el valor máximo permitido.

If `outputEncoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

El objeto `Sign` no puede ser usado nuevamente después de que el método `sign.sign()` ha sido llamado. Llamadas múltiples a `sign.sign()` van a resultar en un error.

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

Updates the `Sign` content with the given `data`, the encoding of which is given in `inputEncoding`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

## Clase: Verify
<!-- YAML
added: v0.1.92
-->

La clase `Verify` es una utilidad para verificar firmas. Puede ser usada de una de las dos maneras:

- Como una [stream](stream.html) escribible donde los datos escritos son usados para validar contra la firma dada, o
- Usando los métodos [`verify.update()`][] y [`verify.verify()`][] para verificar la firma.

El método [`crypto.createVerify()`][] es usado para crear instancias `Verify`. Los objetos`Verify` no tienen que ser creados usando directamente la palabra clave `new`.

Ejemplo: Usando objetos `Verify` como streams:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.write('some data to sign');
verify.end();

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Imprime: Verdadero o Falso
```

Ejemplo: Usando los métodos [`verify.update()`][] y [`verify.verify()`][]:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.update('some data to sign');

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Imprime: Verdadero o Falso
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

Updates the `Verify` content with the given `data`, the encoding of which is given in `inputEncoding`. If `inputEncoding` is not provided, and the `data` is a string, an encoding of `'utf8'` is enforced. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

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
* Devuelve: {boolean} `true` o `false` dependiendo de la validez de la firma para los datos y la clave pública.

Verifica los datos dados usando los `object` y `signature` dados. El argumento `object` puede ser una string que contiene un objeto PEM codificado, que puede ser una clave pública RSA, una clave pública DSA, o un certificado X.509, o un objeto con una o más de las siguientes propiedades:

* `key`: {string} - Clave pública con codificación PEM (requerida)
* `padding`: {integer} - Valor de llenado opcional para RSA, uno de los siguientes:
  * `crypto.constants.RSA_PKCS1_PADDING` (por defecto)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Tenga en cuenta que `RSA_PKCS1_PSS_PADDING` va a usar MGF1 con la misma función hash usada para verificar el mensaje como se especifica en la sección 3.1 de [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - longitud de sal para cuando el relleno es `RSA_PKCS1_PSS_PADDING`. El valor especial `crypto.constants.RSA_PSS_SALTLEN_DIGEST` establece la longitud de sal de tamaño resumido, `crypto.constants.RSA_PSS_SALTLEN_AUTO` (por defecto) hace que se determine automáticamente.

The `signature` argument is the previously calculated signature for the data, in the `signatureEncoding`. If a `signatureEncoding` is specified, the `signature` is expected to be a string; otherwise `signature` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

El objeto `verify` no puede ser usado nuevamente después de que `verify.verify()` ha sido llamado. Múltiples llamadas a `verify.verify()` arrojarán un error.

## Métodos y propiedades del módulo `crypto`

### crypto.constants
<!-- YAML
added: v6.3.0
-->
* Devuelve: {Object} Un objeto contiene constantes usadas comúnmente para cifrado y operaciones relacionadas con la seguridad. Las constantes especificadas actualmente definidas son descritas en [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING
<!-- YAML
added: v0.9.3
deprecated: v10.0.0
-->

> Estabilidad: 0 - Desactualización

La codificación predeterminada a usar para funciones que pueden tomar strings o [buffers][`Buffer`]. El valor por defecto es `'buffer'`, que hace que los métodos por defecto sean objetos [`Buffer`][].

El mecanismo `crypto.DEFAULT_ENCODING` es dado para la compatibilidad con versiones anteriores de programas antiguos que esperan que `'latin1'` sea un código por defecto.

Las nuevas aplicaciones deben esperar que el valor por defecto sea `'buffer'`.

Esta propiedad está en desuso.

### crypto.fips
<!-- YAML
added: v6.0.0
deprecated: v10.0.0
-->

> Estabilidad: 0 - Desactualización

Propiedad para comprobar y controlar si un proveedor de criptografía compatible con FIPS está actualmente en uso. Establecer true requiere una compilación FIPS de Node.js.

Esta propiedad está en desuso. Por favor use `crypto.setFips()` y `crypto.getFips()` en su lugar.

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

> Estabilidad: 0 - Obsoleto: Use en su lugar [`crypto.createCipheriv()`][].

* `algorithm` {string}
* `password` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Devuelve: {Cipher}

Crea y devuelve un objeto `Cipher` que usa los `algorithm` y `password` dados.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). En ese caso, la opción `authTagLength` es requerida y especifica la longitud de la etiqueta de autenticación en bytes, ver [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

El `algorithm` es dependiente de OpenSSL, un ejemplo sería `'aes192'`, etc. En versiones recientes OpenSSL, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` para versiones antiguas de OpenSSL) va a mostrar los algoritmos de cifrado disponibles.

El `password` es usado para derivar la clave cifrada y el vector de inicialización (IV). El valor debe ser un string codificado `'latin1'`, un [`Buffer`][], un `TypedArray`, o un `DataView`.

La implementación de `crypto.createCipher()` deriva claves usando la función de OpenSSL [`EVP_BytesToKey`][] con el algoritmo de resumen establecido en MD5, una iteración, y sin sal. La falta de sal permite ataques de diccionario ya que la misma contraseña siempre crea la misma clave. El bajo conteo de iteraciones y el algoritmo hash no-criptográficamente seguro permite que las contraseñas sean probadas rápidamente.

In line with OpenSSL's recommendation to use a more modern algorithm instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.scrypt()`][] and to use [`crypto.createCipheriv()`][] to create the `Cipher` object. Los usuarios no deben usar cifrados con modo contador (por ejemplo CTR, GCM, o CCM) en `crypto.createCipher()`. Se emite una advertencia cuando se usan a fin de evitar el riesgo de reutilización IV que causa vulnerabilidades. For the case when IV is reused in GCM, see \[Nonce-Disrespecting Adversaries\]\[\] for details.

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
* Devuelve: {Cipher}

Crea y devuelve un objeto `Cipher`, con los `algorithm`, `key` y vector de inicialización (`iv`) dados.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). En ese caso, la opción `authTagLength` es requerida y especifica la longitud de la etiqueta de autenticación en bytes, ver [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

El `algorithm` es dependiente de OpenSSL, un ejemplo sería `'aes192'`, etc. En versiones recientes OpenSSL, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` para versiones antiguas de OpenSSL) va a mostrar los algoritmos de cifrado disponibles.

La `key` es la clave sin procesar usada por el `algorithm` y `iv` es un [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Ambos argumentos deben ser strings `'utf8'` codificadas, [Buffers][`Buffer`], `TypedArray`, o `DataView`. Si el cifrado no necesita un vector de inicialización, entonces `iv` puede ser `null`.

Los vectores de inicialización deben ser impredecibles y únicos; idealmente, serán criptográficamente aleatorios. Estos no tienen que ser secretos: los IV son típicamente añadidos a los mensajes de texto cifrado sin cifrar. Puede sonar contradictorio que algo tenga que ser impredecible y único, pero no tenga que ser secreto; es importante recordar que un atacante no debe ser capaz de predecir a futuro cual va a ser el IV dado.

### crypto.createCredentials(details)
<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Estabilidad: 0 - Desaprobado: Usar [`tls.createSecureContext()`][] en su lugar.

- `details` {Object} Idéntico a [`tls.createSecureContext()`][].
- Devuelve: {tls.SecureContext}

El método `crypto.createCredentials()` es una función desaprobada para crear y devolver un `tls.SecureContext`. No debe ser usada. Reemplácelo con [`tls.createSecureContext()`][] el cual tiene exactamente los mismos argumentos y valor de retorno.

Devuelve un `tls.SecureContext`, como si [`tls.createSecureContext()`][] hubiera sido llamado.

### crypto.createDecipher(algorithm, password[, options])
<!-- YAML
added: v0.1.94
deprecated: v10.0.0
changes:
  - version: v10.10.0
    pr-url: https://github.com/nodejs/node/pull/21447
    description: Ciphers in OCB mode are now supported.
-->

> Estabilidad: 0 - Desaprobado: Usar [`crypto.createDecipheriv()`][] en su lugar.

* `algorithm` {string}
* `password` {string | Buffer | TypedArray | DataView}
* `options` {Object} [`stream.transform` options][]
* Devuelve: {Decipher}

Crea y devuelve un objeto `Decipher` que usa los `algorithm` y `password` (clave) dados.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). En ese caso, la opción `authTagLength` es requerida y especifica la longitud de la etiqueta de autenticación en bytes, ver [CCM mode](#crypto_ccm_mode).

La implementación de `crypto.createDecipher()` deriva claves usando la función OpenSSL [`EVP_BytesToKey`][] con el algoritmo de resumen establecido en MD5, una iteración, y sin sal. La falta de sal permite ataques de diccionario ya que la misma contraseña siempre crea la misma clave. El bajo conteo de iteraciones y el algoritmo hash no-criptográficamente seguro permite que las contraseñas sean probadas rápidamente.

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
* Devuelve: {Decipher}

Crea y devuelve un objeto `Decipher` que usa los `algorithm`, `key` y vector de inicialización (`iv`) dados.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). En ese caso, la opción `authTagLength` es requerida y especifica la longitud de la etiqueta de autenticación en bytes, ver [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to restrict accepted authentication tags to those with the specified length.

El `algorithm` es dependiente de OpenSSL, un ejemplo sería `'aes192'`, etc. En versiones recientes OpenSSL, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` para versiones antiguas de OpenSSL) va a mostrar los algoritmos de cifrado disponibles.

La `key` es la clave sin procesar usada por el `algorithm` y `iv` es un [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Ambos argumentos deben ser strings `'utf8'` codificadas, [Buffers][`Buffer`], `TypedArray`, o `DataView`. Si el cifrado no necesita un vector de inicialización, entonces `iv` puede ser `null`.

Los vectores de inicialización deben ser impredecibles y únicos; idealmente, serán criptográficamente aleatorios. Estos no tienen que ser secretos: los IV son típicamente añadidos a los mensajes de texto cifrado sin cifrar. Puede sonar contradictorio que algo tenga que ser impredecible y único, pero no tenga que ser secreto; es importante recordar que un atacante no debe ser capaz de predecir a futuro cual va a ser el IV dado.

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
* `prime`{string | Buffer | TypedArray | DataView}
* `primeEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `prime` string.
* `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
* `generatorEncoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `generator` string.
* Devuelve: {DiffieHellman}

Crea un objeto de intercambio de claves `DiffieHellman` usando el `prime` proporcionado y un `generator` opcional específico.

El argumento `generator` puede ser un número, string, o un [`Buffer`][]. Si `generator` no es especificado, el valor `2` es usado.

Si `primeEncoding` es especificado, se espera que `prime` sea una string; de no ser así, se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si `generatorEncoding` es especificado, se espera que `generator` sea una string; de no ser así, se espera un número, [`Buffer`][], `TypedArray`, o `DataView`.

### crypto.createDiffieHellman(primeLength[, generator])
<!-- YAML
added: v0.5.0
-->
* `primeLength` {number}
* `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
* Devuelve: {DiffieHellman}

Crea un objeto de intercambio de claves `DiffieHellman` y genera un prime de `primeLength` bits usando un `generator` numérico opcional específico. Si `generator` no es especificado, el valor `2` es usado.

### crypto.createECDH(curveName)
<!-- YAML
added: v0.11.14
-->
* `curveName` {string}
* Devuelve: {ECDH}

Crea un objeto de intercambio de claves de Curva Elíptica Diffie-Hellman (`ECDH`) usando una curva predefinida específicada por la string `curveName`. Use [`crypto.getCurves()`][] para obtener una lista de nombres de curvas disponibles. En las últimas versiones OpenSSL, `openssl ecparam -list_curves` también mostrará el nombre y la descripción de cada curva elíptica disponible.

### crypto.createHash(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.transform` options][]
* Devuelve: {Hash}

Crea y devuelve un objeto `Hash` que puede ser usado para generar resúmenes hash usando el `algorithm` dado. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de los algoritmos disponibles respaldados por la versión de OpenSSL en la plataforma. Los ejemplos son `'sha256'`, `'sha512'`, etc. En versiones recientes de OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` para versiones antiguas de OpenSSL) va a mostrar los algoritmos de cifrado disponibles.

Ejemplo: generando la suma sha256 de un archivo

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
* Devuelve: {Hmac}

Crea y devuelve un objeto `Hmac` que usa el `algorithm` y la `key` dados. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de los algoritmos disponibles respaldados por la versión de OpenSSL en la plataforma. Los ejemplos son `'sha256'`, `'sha512'`, etc. En versiones recientes de OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` para versiones antiguas de OpenSSL) va a mostrar los algoritmos de cifrado disponibles.

La `key` es la clave HMAC usada para generar el hash criptográfico HMAC.

Ejemplo: generando la HMAC sha256 de un archivo

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
* Devuelve: {Sign}

Crea y devuelve un objeto `Sign` que usa el `algorithm` dado. Use [`crypto.getHashes()`][] para obtener una matriz de nombres de los algoritmos de firma disponibles. El argumento opcional `options` controla el comportamiento `stream.Writable`.

### crypto.createVerify(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.Writable` options][]
* Devuelve: {Verify}

Crea y devuelve un objeto `Verify` que usa el algoritmo dado. Use [`crypto.getHashes()`][] para obtener una matriz de nombres de los algoritmos de firma disponibles. El argumento opcional `options` controla el comportamiento `stream.Writable`.

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
* Devuelve: {Object}
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
* Devuelve: {string[]} Un string con los nombres de los algoritmos de cifrado respaldados.

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()
<!-- YAML
added: v2.3.0
-->
* Devuelve: {string[]} Un string con los nombres de las curvas elípticas respaldadas.

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)
<!-- YAML
added: v0.7.5
-->
* `groupName` {string}
* Devuelve: {DiffieHellman}

Crea un objeto de intercambio de claves `DiffieHellman` predefinido. Los grupos respaldados son: `'modp1'`, `'modp2'`, `'modp5'` (definidos en [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), pero ver [Caveats](#crypto_support_for_weak_or_compromised_algorithms)) y `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (definidos en [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). The returned object mimics the interface of objects created by [`crypto.createDiffieHellman()`][], but will not allow changing the keys (with [`diffieHellman.setPublicKey()`][], for example). La ventaja de usar este método es que las partes no tienen que generar ni intercambiar un grupo de módulos de antemano, ahorrando tiempo de procesado y de comunicación.

Ejemplo (obteniendo un secreto compartido):

```js
const crypto = require('crypto');
const alice = crypto.getDiffieHellman('modp14');
const bob = crypto.getDiffieHellman('modp14');

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

/* aliceSecret y bobSecret deben ser iguales*/
console.log(aliceSecret === bobSecret);
```

### crypto.getFips()
<!-- YAML
added: v10.0.0
-->
* Devuelve: {boolean} `true` si y sólo si un proveedor de criptografía compatible con FIPS se encuentra actualmente en uso.

### crypto.getHashes()
<!-- YAML
added: v0.9.3
-->
* Devuelve: {string[]} Un array de los nombres de los algoritmos hash compatibles, como `'RSA-SHA256'`.

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

Proporciona una implementación asincrónica de la función 2 (PBKDF2) de derivación de clave basada en contraseña. Un algoritmo resumido HMAC seleccionado, especificado por `digest`, es aplicado para derivar una clave de la longitud de byte solicitada (`keylen`) de los `password`, `salt` y `iterations`.

La función `callback` es llamada con dos argumentos: `err` y `derivedKey`. Si un error ocurre mientras se deriva la clave, `err` se configurará; de lo contrario `err` será `null`. Por defecto, la `derivedKey` generada exitosamente se pasará a la devolución de llamada como un [`Buffer`][]. Va a ocurrir un error si ninguno de los argumentos de entrada especifica valores o tipos inválidos.

If `digest` is `null`, `'sha1'` will be used. This behavior will be deprecated in a future version of Node.js.

El argumento `iterations` debe ser un número establecido lo más alto posible. Mientras más alto sea el número de iteraciones, más segura será la clave derivada, pero tomará mucho más tiempo para completarse.

The `salt` should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...08d59ae'
});
```

La propiedad `crypto.DEFAULT_ENCODING` puede ser usada para cambiar la forma en que la `derivedKey` es pasada a la devolución de llamada. Esta propiedad, sin embargo, ha quedado en desuso y debe evitarse su utilización.

```js
const crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'hex';
crypto.pbkdf2('secret', 'salt', 100000, 512, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey);  // '3745e48...aa39b34'
});
```

Un array de funciones de compilación compatibles puede ser recuperada usando [`crypto.getHashes()`][].

Tenga en cuenta que esta API usa el conjunto de subprocesos de libuv, el cual puede tener implicaciones de desempeño sorprendentes y negativas para algunas aplicaciones, vea la documentación [`UV_THREADPOOL_SIZE`][] para más información.

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
* Devuelve: {Buffer}

Proporciona una implementación asincrónica de la función 2 (PBKDF2) de Derivación de Clave Basada en Contraseña. Un algoritmo resumido HMAC seleccionado, especificado por `digest`, es aplicado para derivar una clave de la longitud de byte solicitada (`keylen`) de los `password`, `salt` y `iterations`.

Si ocurre un error, se arrojará un `Error`, de no ser así, la clave derivada será devuelta como un [`Buffer`][].

If `digest` is `null`, `'sha1'` will be used. This behavior will be deprecated in a future version of Node.js.

El argumento `iterations` debe ser un número establecido lo más alto posible. Mientras más alto sea el número de iteraciones, más segura será la clave derivada, pero tomará mucho más tiempo para completarse.

The `salt` should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See [NIST SP 800-132](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512');
console.log(key.toString('hex'));  // '3745e48...08d59ae'
```

La propiedad `crypto.DEFAULT_ENCODING` puede ser usada para cambiar la forma en la que la `derivedKey` es devuelta. This property, however, is deprecated and use should be avoided.

```js
const crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'hex';
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 512, 'sha512');
console.log(key);  // '3745e48...aa39b34'
```

Un array de funciones de compilación compatibles puede ser recuperada usando [`crypto.getHashes()`][].

### crypto.privateDecrypt(privateKey, buffer)
<!-- YAML
added: v0.11.14
-->
* `privateKey` {Object | string}
  - `key` {string} Clave privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `crypto.constants.RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Devuelve: {Buffer} Un nuevo `Buffer` con el contenido descifrado.

Descifra `buffer` con la `privateKey`. `buffer` was previously encrypted using the corresponding public key, for example using [`crypto.publicEncrypt()`][].

`privateKey` puede ser un objeto o una string. Si `privateKey` es una string, es tratada como la clave sin frase de contraseña y va a usar `RSA_PKCS1_OAEP_PADDING`.

### crypto.privateEncrypt(privateKey, buffer)
<!-- YAML
added: v1.1.0
-->
* `privateKey` {Object | string}
  - `key` {string} Clave privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `crypto.constants.RSA_PKCS1_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Devuelve: {Buffer} Un nuevo `Buffer` con el contenido encriptado.

Encripta `buffer` con la `privateKey`. The returned data can be decrypted using the corresponding public key, for example using [`crypto.publicDecrypt()`][].

`privateKey` puede ser un objeto o una string. Si `privateKey` es una string, es tratada como la clave sin frase de contraseña y va a usar `RSA_PKCS1_PADDING`.

### crypto.publicDecrypt(key, buffer)
<!-- YAML
added: v1.1.0
-->
* `key` {Object | string}
  - `key` {string} Clave pública o privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING` or `crypto.constants.RSA_PKCS1_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Devuelve: {Buffer} Un nuevo `Buffer` con el contenido descifrado.

Decrypts `buffer` with `key`.`buffer` was previously encrypted using the corresponding private key, for example using [`crypto.privateEncrypt()`][].

`key` puede ser un objeto o una string. Si `key` es una string, es tratada como una clave sin frase de contraseña y va a usar `RSA_PKCS1_PADDING`.

Debido a que las claves públicas RSA pueden ser derivadas de claves privadas, una clave privada puede ser pasada en lugar de una clave pública.

### crypto.publicEncrypt(key, buffer)
<!-- YAML
added: v0.11.14
-->
* `key` {Object | string}
  - `key` {string} Clave pública o privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} An optional padding value defined in `crypto.constants`, which may be: `crypto.constants.RSA_NO_PADDING`, `crypto.constants.RSA_PKCS1_PADDING`, or `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
* `buffer` {Buffer | TypedArray | DataView}
* Devuelve: {Buffer} Un nuevo `Buffer` con el contenido encriptado.

Encripta el contenido del `buffer` con la `key` y devuelve un nuevo [`Buffer`][] con el contenido encriptado. The returned data can be decrypted using the corresponding private key, for example using [`crypto.privateDecrypt()`][].

`key` puede ser un objeto o una string. Si `key` es una string, es tratada como una clave sin frase de contraseña y va a usar `RSA_PKCS1_OAEP_PADDING`.

Debido a que las claves públicas RSA pueden ser derivadas de claves privadas, una clave privada puede ser pasada en lugar de una clave pública.

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
* Devuelve: {Buffer} si la función `callback` no es proporcionada.

Genera datos pseudoaleatorios criptográficamente fuertes. El argumento `size` es un número que indica el número de bytes a generar.

Si una función `callback` es dada, los bytes son generados asincrónicamente y la función `callback` es invocada con dos argumentos: `err` y `buf`. Si ocurre un error, `err` será un objeto `Error`; de no ser así será `null`. El argumento `buf` es un [`Buffer`][] que contiene los bytes generados.

```js
// Asincrónico
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
```

Si la función `callback` no es dada, los bytes aleatorios son generados sincrónicamente y devueltos como [`Buffer`][]. Un error será arrojado si hay un problema al generar los bytes.

```js
// Sincrónico
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} bytes of random data: ${buf.toString('hex')}`);
```

El método `crypto.randomBytes()` no estará completo hasta que haya suficiente entropía disponible. Esto normalmente no debe tardar más de unos pocos milisegundos. El único momento en que la generación de bytes aleatorios puede bloquearse durante un período de tiempo más prolongado es justo después del arranque, cuando todo el sistema sigue estando bajo en entropía.

Tenga en cuenta que esta API usa el conjunto de subprocesos de libuv, el cual puede tener implicaciones de desempeño sorprendentes y negativas para algunas aplicaciones, vea la documentación [`UV_THREADPOOL_SIZE`][] para más información.

La versión asincrónica de `crypto.randomBytes()` se lleva a cabo en una sola solicitud de agrupación de subprocesos. Para minimizar la variación de la longitud de la agrupación de subprocesos, particione las solicitudes grandes de `randomBytes` cuando lo haga como parte del cumplimiento de una solicitud de cliente.

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

* `buffer` {Buffer|TypedArray|DataView} Debe ser suministrada.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* Returns: {Buffer|TypedArray|DataView} The object passed as `buffer` argument.

Versión sincrónica de [`crypto.randomFill()`][].

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// Lo anterior es equivalente a lo siguiente:
crypto.randomFillSync(buf, 5, 5);
console.log(buf.toString('hex'));
```

Cualquier instancia `TypedArray` o `DataView` puede pasarse como `buffer`.

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

* `buffer` {Buffer|TypedArray|DataView} Debe ser suministrada.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* `callback` {Function} `function(err, buf) {}`.

Esta función es similar a [`crypto.randomBytes()`][] pero requiere que el primer argumento sea un [`Buffer`][] que será llenado. También requiere que pase una devolución de llamada.

Si la función `callback` no es proporcionada, se producirá un error.

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

// Lo anterior es equivalente a lo siguiente:
crypto.randomFill(buf, 5, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

Cualquier instancia `TypedArray` o `DataView` puede pasarse como `buffer`.

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

Tenga en cuenta que esta API usa el conjunto de subprocesos de libuv, el cual puede tener implicaciones de desempeño sorprendentes y negativas para algunas aplicaciones, vea la documentación [`UV_THREADPOOL_SIZE`][] para obtener más información.

La versión asincrónica de`crypto.randomFill()` se lleva a cabo en una sola solicitud de agrupación de subprocesos. Para minimizar la variación de la longitud de la agrupación de subprocesos, particione las solicitudes grandes de `randomFill` cuando lo haga como parte del cumplimiento de una solicitud de cliente.

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
* `opciones` {Object}
  - `cost` {number} CPU/memory cost parameter. Must be a power of two greater
  - `N` {number} CPU/memory cost parameter. Must be a power of two greater than one. **Predeterminado:** `16384`.
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
* `opciones` {Object}
  - `cost` {number} CPU/memory cost parameter. Must be a power of two greater
  - `N` {number} CPU/memory cost parameter. Must be a power of two greater than one. **Predeterminado:** `16384`.
  - `blockSize` {number} Block size parameter. **Default:** `8`.
  - `parallelization` {number} Parallelization parameter. **Default:** `1`.
  - `N` {number} Alias for `cost`. Only one of both may be specified.
  - `r` {number} Alias for `blockSize`. Only one of both may be specified.
  - `p` {number} Alias for `parallelization`. Only one of both may be specified.
  - `maxmem` {number} Memory upper bound. It is an error when (approximately) `128 * N * r > maxmem`. **Default:** `32 * 1024 * 1024`.
* Devuelve: {Buffer}

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
* `flags` {crypto.constants} **Por defecto:** `crypto.constants.ENGINE_METHOD_ALL`

Cargue y configure el `engine` para algunas o todas las funciones OpenSSL (seleccionadas por flags).

`engine` puede ser tanto un id o una ruta a la biblioteca compartida del motor.

El argumento opcional `flags` usa `ENGINE_METHOD_ALL` por defecto. Los `flags` son un campo de bits que toma una o una mezcla de los siguientes flags (definidos en `crypto.constants`):

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

Las siguientes flags están en desuso en OpenSSL-1.1.0.

* `crypto.constants.ENGINE_METHOD_ECDH`
* `crypto.constants.ENGINE_METHOD_ECDSA`
* `crypto.constants.ENGINE_METHOD_STORE`

### crypto.setFips(bool)
<!-- YAML
added: v10.0.0
-->
* `bool` {boolean} `true` para habilitar el modo FIPS.

Habilita al proveedor de cifrado compatible FIPS en una compilación de Node.js habilitada para FIPS. Produce un error si el modo FIPS no está disponible.

### crypto.timingSafeEqual(a, b)
<!-- YAML
added: v6.6.0
-->
* `a` {Buffer | TypedArray | DataView}
* `b` {Buffer | TypedArray | DataView}
* Devuelve: {boolean}

Esta función se basa en un algoritmo de tiempo constante. Devuelve true si `a` es igual a `b`, sin perder información de tiempo que le permita adivinar a un atacante uno de los valores. Esto es adecuado para comparar los resúmenes de HMAC o los valores secretos como cookies de autenticación o [urls de habilidad](https://www.w3.org/TR/capability-urls/).

`a` y `b` deben ser ambos `Buffer`s, `TypedArray`s, o `DataView`s, y deben tener la misma longitud.

El uso de `crypto.timingSafeEqual` no garantiza que el código *surrounding* sea seguro en cuanto a tiempo. Debe tener cuidado al asegurarse de que el código cercano no introduce vulnerabilidades de tiempo.

## Notas

### API de Streams heredadas (previo a Node.js v0.10)

El módulo Crypto fue añadido a Node.js antes del concepto de una Stream API unificada, y antes de que existieran objetos [`Buffer`][] para manejar datos binarios. Como tal, la mayoría de las clases definidas `crypto` tienen métodos atípicos encontrados en otras clases Node.js que implementan los [streams](stream.html) API (e.g `update()`, `final()`, or `digest()`). También, algunos métodos aceptaron y devolvieron strings `'latin1'` codificados por defecto en lugar de `Buffer`s. Esto fue cambiado después de Node.js v0.8 para usar objetos [`Buffer`][] en lugar del predeterminado.

### Cambios Recientes ECDH

El uso de `ECDH` sin dinamismo generado de pares key ha sido simplificado. Ahora, [`ecdh.setPrivateKey()`][] puede ser llamado con una key privada preseleccionada y el punto público asociado (key) será computado y almacenado en el objeto. Esto permite al código sólo almacenar y proporcionar la parte privada del par key EC. [`ecdh.setPrivateKey()`][] ahora también valida que la key privada es válida por la curve seleccionada.

El método [`ecdh.setPublicKey()`][] ahora está desaprobado ya que, su inclusión en la API no es útil. También, una key privada almacenada con anterioridad debería estar establecida, lo cual automaticamente genera la key pública asociada, o mejor llamada [`ecdh.generateKeys()`][]. El principal inconveniente del uso de [`ecdh.setPublicKey()`][] es que puede ser usado para poner el par key ECDH en un estado de inconsciencia.

### Soporte para algoritmos débiles o comprometidos

El módulo `crypto` todavía soporta algunos algoritmos que están comprometidos y que no son actualmente recomendados. El API también permite el uso de ciphers y hashes con una key pequeña que son considerados muy débiles en temas de seguridad.

Los usuarios deben tomar la responsabilidad completa por seleccionar el crypto algoritmo y el tamaño de la key dependiendo de los requerimientos de seguridad.

Basado en la recomendación de [NIST SP 800-131A](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

- MD5 y SHA-1 ya no son aceptados como firmas digitales en donde la collision resistance es necesaria.
- La key usada con los algoritmos RSA, DSA, y DH es recomendable que tenga al menos 2048 bits y que la curve de ECDSA y ECDH tenga al menos 224 bits, esto para que sea seguro su uso por varios años.
- Los grupos DH de `modp1`, `modp2` and `modp5` que tienen un tamaño de key menor a 2048 bits, no son recomendados.

Observe la referencia para otras recomendaciones y detalles.

### Modo CCM

CCM is one of the supported [AEAD algorithms](https://en.wikipedia.org/wiki/Authenticated_encryption). Las aplicaciones de usar este modo van con ciertas restricciones cuando se usa el cipher API:

- La longitud de la etiqueta de autenticación debe ser específicada durante la creación del cipher por la opción `authTagLength` y debe ser de 4, 6, 8, 10, 12, 14 o 16 bytes.
- La longitud del vector de iniciación (nonce) `N` debe ser entre 7 y 13 bytes (`7 ≤ N ≤ 13`).
- La longitud del texto plano está limitada a `2 ** (8 * (15 - N))` bytes.
- When decrypting, the authentication tag must be set via `setAuthTag()` before specifying additional authenticated data or calling `update()`. De lo contrario, al descifrar fallara y `final()` devolverá un error en conformidad con la sección 2.6 de [RFC 3610](https://www.rfc-editor.org/rfc/rfc3610.txt).
- Usar métodos stream en modo CCM como `write(data)`, `end(data)` o `pipe()` puede fallar ya que éste modo no logra soportar más de un chunk de data por instante.
- Al pasar data adicional autenticada (AAD), la longitud del mensaje en bytes deber ser pasada por `setAAD()` en la opción `plaintextLength`. Esto no es necesario si no se usa AAD.
- Como CCM procesa todo el mesaje de una sola vez, `update()` puede ser llamado sólo una vez.
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

## Constantes de Crypto

Las siguientes constantes sacadas de `crypto.constants` sirven para diversos usos de los módulos `crypto`, `tls`, y `https` además generalmente son específicos de OpenSSL.

### Opciones de OpenSSL
<!--lint disable maximum-line-length-->
<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Aplica para múltiples soluciones de fallos dentro de OpenSSL. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>
    for detail.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Permite una renegociación insegura heredada entre OpenSSL y clientes o servidores sin parchar. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Intenta utilizar las preferencias del servidor en lugar de las del 
cliente al seleccionar un cifrado. El comportamiento depende de la versión del protocolo. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CISCO_ANYCONNECT</code></td>
    <td>Indica a OpenSSL que use la versión "speshul" de Cisco de DTLS_BAD_VER.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_COOKIE_EXCHANGE</code></td>
    <td>Indica a OpenSSL que active el intercambio de cookies.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CRYPTOPRO_TLSEXT_BUG</code></td>
    <td>Indica a OpenSSL que agregue la extensión server-hello desde una versión anterior del borrador de cryptopro.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS</code></td>
    <td>Indica a OpenSSL que deshabilite una solución alternativa de vulnerabilidad SSL 3.0 / TLS 1.0 agregada en OpenSSL 0.9.6d.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_EPHEMERAL_RSA</code></td>
    <td>Indica a OpenSSL que use siempre la clave tmp_rsa al realizar operaciones RSA.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_LEGACY_SERVER_CONNECT</code></td>
    <td>Permite la conexión inicial a servidores que no soportan RI.</td>
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
    <td>Indica a OpenSSL que deshabilite la solución alternativa para una vulnerabilidad de versión de protocolo man-in-the-middle en la implementación del servidor SSL 2.0.</td>
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
    <td>Indica a OpenSSL que deshabilite el soporte para la compresión SSL / TLS.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_QUERY_MTU</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION</code></td>
    <td>Indica a OpenSSL que siempre comience una nueva sesión al realizar una renegociación.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv2</code></td>
    <td>Indica a OpenSSL que apague SSL v2</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv3</code></td>
    <td>Indica a OpenSSL que apague SSL v3</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TICKET</code></td>
    <td>Indica a OpenSSL que desactive el uso de tickets RFC4507bis.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1</code></td>
    <td>Indica a OpenSSL que apague TLS v1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_1</code></td>
    <td>Indica a OpenSSL que apague TLS v1.1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_2</code></td>
    <td>Indica a OpenSSL que apague TLS v1.2</td>
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
    <td>Indica a OpenSSL que siempre cree una nueva clave cuando use parámetros DH temporales/efímeros.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_ECDH_USE</code></td>
    <td>Indica a OpenSSL que siempre cree una nueva clave cuando use parámetros ECDH temporales/efímeros.</td>
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
    <td>Indica a OpenSSL que deshabilite la detección de ataques de reversión de versión.</td>
  </tr>
</table>

### Constantes del Motor OpenSSL
<!--lint enable maximum-line-length remark-lint-->

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RSA</code></td>
    <td>Limita el uso del motor a RSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DSA</code></td>
    <td>Limita el uso del motor a DSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DH</code></td>
    <td>Limita el uso del motor a DH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RAND</code></td>
    <td>Limita el uso del motor a RAND</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_EC</code></td>
    <td>Limita el uso del motor a EC</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_CIPHERS</code></td>
    <td>Limita el uso del motor a CIPHERS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DIGESTS</code></td>
    <td>Limita el uso del motor a DIGESTS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_METHS</code></td>
    <td>Limita el uso del motor a PKEY_METHDS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_ASN1_METHS</code></td>
    <td>Limita el uso del motor a PKEY_ASN1_METHS</td>
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

### Otras Constantes OpenSSL

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
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

### Constantes Crypto de Node.js

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>defaultCoreCipherList</code></td>
    <td>Especifica la lista de cifrado predeterminada utilizada por Node.js.</td>
  </tr>
  <tr>
    <td><code>defaultCipherList</code></td>
    <td>Especifica la lista de cifrado predeterminada activa utilizada por el proceso Node.js actual.</td>
  </tr>
</table>

