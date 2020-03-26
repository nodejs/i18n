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

El módulo `crypto` provee la clase `Certificate` para trabajar con datos SPKAC. El uso más común es el manejo de la salida generada por el elemento HTML5 `<keygen>`. Node.js usa [OpenSSL's SPKAC implementation](https://www.openssl.org/docs/man1.0.2/apps/spkac.html) internamente.

### nuevo crypto.Certificate()

Instancias de la clase `Certificate` pueden ser creadas usando la palabra clave `new` o llamando a `crypto.Certificate()` como una función:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

### certificate.exportChallenge(spkac)
<!-- YAML
added: v0.11.8
-->
- `spack` {string | Buffer | TypedArray | DataView}
- Devuelve: {Buffer} El componente desafío de la estructura de datos `spkac`, que incluye una clave pública y un desafío.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Imprime: el desafío como una string en UTF8
```

### certificate.exportPublicKey(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {string | Buffer | TypedArray | DataView}
- Devuelve: {Buffer} El componente público de la estructura de datos `spkac`, que incluye una clave pública y un desafío.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Imprime: la clave pública como <Buffer ...>
```

### certificate.verifySpkac(spkac)
<!-- YAML
added: v0.11.8
-->
- `spkac` {Buffer | TypedArray | DataView}
- Devuelve: {boolean} `true` si la estructura de datos `spkac` dada es válida, `false` si no lo es.

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
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = '';
cipher.on('readable', () => {
  const data = cipher.read();
  if (data)
    encrypted += data.toString('hex');
});
cipher.on('end', () => {
  console.log(encrypted);
  // Imprime: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
});

cipher.write('some clear text data');
cipher.end();
```

Por ejemplo: Usando `Cipher` y piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const cipher = crypto.createCipher('aes192', 'a password');

const input = fs.createReadStream('test.js');
const output = fs.createWriteStream('test.enc');

input.pipe(cipher).pipe(output);
```

Por ejemplo: Usando los métodos [`cipher.update()`][] y [`cipher.final()`][]:

```js
const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// Imprime: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
```

### cipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
- `outputEncoding` {string}
- Devuelve: {Buffer | string} Cualquier contenido cifrado restante. If `outputEncoding` parameter is one of `'latin1'`, `'base64'` or `'hex'`, a string is returned. If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

Una vez que el método `cipher.final()` ha sido llamado, el objeto `Cipher` no puede ser usado para encriptar datos. Intentar llamar a `cipher.final()` más de una vez producirá un error.

### cipher.setAAD(buffer)
<!-- YAML
added: v1.0.0
-->
- `buffer` {Buffer}
- Devuelve al {Cipher} como método cadena.

El método `cipher.setAAD()` establece el valor empleado por el parámetro de entrada _additional authenticated data_ (AAD) cuando se use un modo autenticado de encriptación (solo el `GCM` es válido actualmente).

El método `cipher.setAAD()` debe llamarse antes que [`cipher.update()`][].

### cipher.getAuthTag()
<!-- YAML
added: v1.0.0
-->
- Returns: {Buffer} When using an authenticated encryption mode (only `GCM` is currently supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing the _authentication tag_ that has been computed from the given data.

El método `cipher.getAuthTag()` debe ser llamado solamente después de que se completó el encriptado usando el método [`cipher.final()`][].

### cipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
- `autoPadding` {boolean} **Por defecto:** `true`
- Devuelve: {Cipher} como método cadena.

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
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Devuelve: {Buffer | string}

Actualiza el cifrado con `data`. Si el argumento `inputEncoding` es dado, su valor debe ser `'utf8'`, `'ascii'`, o `'latin1'` y el argumento `data` es una string usando el código específico. Si el argumento `inputEncoding` no es dado, `data` debe ser un [`Buffer`][], `TypedArray`, o `DataView`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces se omite `inputEncoding`.

El `outputEncoding` especifica el formato de salida de los datos cifrados, y puede ser `'latin1'`, `'base64'` o `'hex'`. Si el `outputEncoding` es especificado, se devuelve una string que usa el código especificado. Si no se provee un `outputEncoding`, un [`Buffer`][] es devuelto.

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
const decipher = crypto.createDecipher('aes192', 'a password'); 

let decrypted = ''; 
decipher.on('readable', () => {   
  const data = decipher.read();   
  if (data)     
    decrypted += data.toString('utf8'); 
}); 
decipher.on('end', () => {   
  console.log(decrypted);   
  // Imprime: algunos datos de texto claros 
}); 

const encrypted =                       
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504'; decipher.write(encrypted, 'hex'); 
decipher.end();
```

Ejemplo: Usando `Decipher` y piped streams:

```js
const crypto = require('crypto');
const fs = require('fs');
const decipher = crypto.createDecipher('aes192', 'a password');

const input = fs.createReadStream('test.enc');
const output = fs.createWriteStream('test.js');

input.pipe(decipher).pipe(output);
```

Ejemplo: Usando los métodos [`decipher.update()`][] y [`decipher.final()`][]:

```js
const crypto = require('crypto'); 
const decipher = crypto.createDecipher('aes192', 'a password'); 

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504'; 
let decrypted = decipher.update(encrypted, 'hex', 'utf8'); 
decrypted += decipher.final('utf8'); 
console.log(decrypted); 
// Imprime: algunos datos limpios
```

### decipher.final([outputEncoding])
<!-- YAML
added: v0.1.94
-->
- `outputEncoding` {string}
- Devuelve: {Buffer | string} Cualquier contenido descifrado restante. If `outputEncoding` parameter is one of `'latin1'`, `'ascii'` or `'utf8'`, a string is returned. If an `outputEncoding` is not provided, a [`Buffer`][] is returned.

Una vez que el método `decipher.final()` ha sido llamado, el objeto `Decipher` no puede ser usado para descifrar datos. Intentar llamar mas de una vez a `decipher.final()` producirá un error.

### decipher.setAAD(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
- `buffer` {Buffer | TypedArray | DataView}
- Devuelve: {Cipher} como método cadena.

El método `decipher.setAAD()` establece el valor empleado por el parámetro de entrada _additional authenticated data_ (AAD) cuando se use un modo autenticado de encriptación (solo el `GCM` es válido actualmente).

El método `decipher.setAAD()` debe llamarse antes de [`decipher.update()`][].

### decipher.setAuthTag(buffer)
<!-- YAML
added: v1.0.0
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->
- `buffer` {Buffer | TypedArray | DataView}
- Devuelve: {Cipher} como método cadena.

El método `decipher.setAuthTag()` es usado para pasar la _etiqueta de autenticación recibida_ cuando se usa un modo de encriptación autenticado (solamente `GCM` y <0>CCM</0> están siendo respaldados en la actualiad). Si no se provee ninguna etiqueta, o si el texto cifrado ha sido manipulado, va a arrojar [`decipher.final()`][], indicando que el texto cifrado debe descartarse por una autenticación fallida.

Note que esta versión de Node.js no verifica la longitud de la etiqueta de autenticación de GCM. Tal control *debe* ser implementado por las aplicaciones y es crucial para la autenticidad de los datos encriptados, de otro modo, un atacante puede usar una etiqueta de autenticación arbitraria corta para aumentar las posibilidades de pasar la autenticación de manera efectiva (hasta un 0.39%). Es altamente recomendable asociar uno de los valores 16, 15, 14, 13, 12, 8 o 4 bytes con cada clave, y solo para permitir etiquetas de autenticación de esa longitud, ver [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

El método `decipher.setAuthTag()` debe ser llamado antes de [`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
- `autoPadding` {boolean} **Por defecto:** `true`
- Devuelve: {Cipher} como método cadena.

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
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Devuelve: {Buffer | string}

Actualiza el descifrado con `data`. Si el argumento `inputEncoding` es dado, su valor debe ser `'latin1'`, `'base64'`, o `'hex'` y el argumento `data` es una string usando el código específico. Si el argumento `inputEncoding` no es dado, `data` debe ser un [`Buffer`][]. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

El `outputEncoding` especifica el formato de salida de los datos cifrados, y puede ser `'latin1'`, `'ascii'` o `'utf8'`. Si el `outputEncoding` es especificado, se devuelve una string que usa el código especificado. Si no se provee un `outputEncoding`, un [`Buffer`][] es devuelto.

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
- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Devuelve: {Buffer | string}

Computa el secreto compartido usando `otherPublicKey` como la clave pública de la otra parte y devuelve el secreto compartido computado. La clave dada es interpretada usando el `inputEncoding` especificado, y el secreto es codificado usando el `outputEncoding` especificado. Las codificaciones pueden ser `'latin1'`, `'hex'`, o `'base64'`. Si el `inputEncoding` no es dado, `otherPublicKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si el `outputEncoding` es dado, una string es devuelta; de no ser así, un [`Buffer`][] es devuelto.

### diffieHellman.generateKeys([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Genera valores de claves Diffie-Hellman privadas y públicas, y devuelve la clave pública en el `encoding` especificado. Esta clave debe ser transferida a la otra parte. Los códigos pueden ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así, un [`Buffer`][] es devuelto.

### diffieHellman.getGenerator([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Devuelve el generador de Diffie-Hellman al `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta, de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPrime([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Regresa el Diffie-Hellman prime al `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta, de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPrivateKey([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Regresa la llave privada Diffie-Hellman en el `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPublicKey([encoding])
<!-- YAML
added: v0.5.0
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Regresa la llave pública Diffie-Hellman al `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.5.0
-->
- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Establece la clave privada Diffie-Hellman. Si el argumento `encoding` es proporcionado y es `'latin1'`, `'hex'`, o `'base64'`, `privateKey` se espera que sea una string. Si no se proporciona `encoding`, `privateKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.5.0
-->
- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Establece la clave pública Diffie-Hellman. Si el argumento `encoding` es proporcionado y es `'latin1'`, `'hex'` o `'base64'`, `publicKey` se espera que sea una string. Si no es proporcionado `encoding`, `publicKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

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
- Devuelve: {Buffer | string}

Computa el secreto compartido usando `otherPublicKey` como la clave pública de la otra parte y devuelve el secreto compartido computado. La clave suministrada es interpretada usando `inputEncoding` especificado, y el secreto devuelto es codificado usando `outputEncoding`. Las codificaciones pueden ser `'latin1'`, `'hex'`, o `'base64'`. Si el `inputEncoding` no es dado, `otherPublicKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si `outputEncoding` es dado, una string será devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.generateKeys([encoding[, format]])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- `format` {string} **Default:** `uncompressed`
- Devuelve: {Buffer | string}

Genera los valores de la clave EC Diffie-Hellman privados y públicos, y devuelve la clave pública en el `format` y `encoding` especificado. Esta clave debe ser transferida a la otra parte.

El argumento `format` especifica la codificación de puntos y puede ser `'compressed'` o `'uncompressed'`. Si `format` no es especificado, el punto será devuelto en formato `'uncompressed'`.

El argumento `encoding` puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.getPrivateKey([encoding])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- Devuelve: {Buffer | string} La clave privada EC Diffie-Hellman en el `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.getPublicKey(\[encoding\]\[, formato\])
<!-- YAML
added: v0.11.14
-->
- `encoding` {string}
- `format` {string} **Default:** `uncompressed`
- Devuelve: {Buffer | string} La clave pública EC Diffie-Hellman en el `encoding` y `format` especificado.

El argumento `format` especifica la codificación de puntos y puede ser `'compressed'` o `'uncompressed'`. Si `format` no es especificado, el punto será devuelto en formato `'uncompressed'`.

El argumento `encoding` puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es especificado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.11.14
-->
- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Establece la clave privada EC Diffie-Hellman. El `encoding` puede ser `'latin1'`, `'hex'` o `'base64'`. Si `encoding` es dado, `privateKey` se espera que sea una string; de no ser así `privateKey` se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si `privateKey` no es válido para la curva especificada cuando el objeto `ECDH` fue creado, se produce un error. Sobre la configuración de la clave privada, el punto público asociado (clave) es también generado y establecido en el objeto ECDH.

### ecdh.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Estabilidad: 0 - En desuso

- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Establece la clave pública EC Diffie-Hellman. El código clave puede ser `'latin1'`, `'hex'` o `'base64'`. Si `encoding` es dado, se espera que `publicKey` sea una string; de no ser así un [`Buffer`][], `TypedArray`, o `DataView` es esperado.

Note que no hay normalmente una razón para llamar a este método porque `ECDH` solo requiere una clave privada y la clave pública de la otra parte para computar el secreto compartido. Tipicamente [`ecdh.generateKeys()`][] o [`ecdh.setPrivateKey()`][] serán llamados. El método [`ecdh.setPrivateKey()`][] intenta generar la clave/punto público asociado con la clave privada que se está configurando.

Ejemplo (obteniendo un secreto compartido):

```js
const crypto = require('crypto'); 
const alice = crypto.createECDH('secp256k1'); 
const bob = crypto.createECDH('secp256k1');

// Note: Esta es una forma de acceso directo para especificar una de las anteriores
// claves privadas de Alice. Sería poco inteligente usar una clave privada predecible en una 
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

### hash.digest([encoding])
<!-- YAML
added: v0.1.92
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Calcula el resumen de todos los datos pasados para ser hashed (usando el método [`hash.update()`][]). El `encoding` puede ser `'hex'`, `'latin1'` o `'base64'`. Si`encoding` es dado, una string será devuelta; de no ser así un [`Buffer`][] es devuelto.

El objeto `Hash` no puede ser usado nuevamente después de que el método `hash.digest()` ha sido llamado. Llamados múltiples causaran que se arroje un error.

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

Actualiza el contenido hash con los `data` dados, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

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
  const data = hmac.read();
  if (data) {
    console.log(data.toString('hex'));
    // Imprime:
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

### hmac.digest([encoding])
<!-- YAML
added: v0.1.94
-->
- `encoding` {string}
- Devuelve: {Buffer | string}

Calcula el resúmen HMAC de todos los datos pasados usando [`hmac.update()`][]. El `encoding` puede ser `'hex'`, `'latin1'` o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto;

El objeto `Hmac` no puede ser usado nuevamente después de que `hmac.digest()` ha sido llamado. Llamadas múltiples a `hmac.digest()` producirá un error.

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

Actualiza el contenido `Hmac` con los `data` dados, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

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

### sign.sign(privateKey[, output_format])
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
- Devuelve: {Buffer | string}

Calcula la firma de todos los datos pasados usando [`sign.update()`][] o [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

El argumento `privateKey` puede ser un objeto o una string. Si `privateKey` es una string, se trata como una clave cruda sin frase de contraseña. Si `privateKey` es un objeto, debe contener una o más de las siguientes propiedades:

* `key`: {string} - Clave privada con codificación PEM (requerida)
* `passphrase`: {string} - frase de contraseña para la clave privada
* `padding`: {integer} - Valor de llenado opcional para RSA, uno de los siguientes:
  * `crypto.constants.RSA_PKCS1_PADDING` (por defecto)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Tenga en cuenta que `RSA_PKCS1_PSS_PADDING` va a usar MGF1 con la misma función hash usada para firmar el mensaje como se especifica en la sección 3.1 de [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - longitud de sal para cuando el relleno es `RSA_PKCS1_PSS_PADDING`. El valor especial `crypto.constants.RSA_PSS_SALTLEN_DIGEST` establece la longitud de sal del tamaño resumido, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (por defecto) lo establece en el valor máximo permitido.

El `outputFormat` puede especificar un `'latin1'`, `'hex'` o `'base64'`. Si `outputFormat` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

El objeto `Sign` no puede ser usado nuevamente después de que el método `sign.sign()` ha sido llamado. Llamadas múltiples a `sign.sign()` van a resultar en un error.

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

Actualiza el contenido `Sign` con el `data` dado, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

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
- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Actualiza el contenido `Verify` con los `data` dados, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][], `TypedArray`, o `DataView`, entonces el `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

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
- Devuelve: {boolean} `true` o `false` dependiendo de la validez de la firma para los datos y la clave pública.

Verifica los datos dados usando los `object` y `signature` dados. El argumento `object` puede ser una string que contiene un objeto PEM codificado, que puede ser una clave pública RSA, una clave pública DSA, o un certificado X.509, o un objeto con una o más de las siguientes propiedades:

* `key`: {string} - Clave pública con codificación PEM (requerida)
* `padding`: {integer} - Valor de llenado opcional para RSA, uno de los siguientes:
  * `crypto.constants.RSA_PKCS1_PADDING` (por defecto)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Tenga en cuenta que `RSA_PKCS1_PSS_PADDING` va a usar MGF1 con la misma función hash usada para verificar el mensaje como se especifica en la sección 3.1 de [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - longitud de sal para cuando el relleno es `RSA_PKCS1_PSS_PADDING`. El valor especial `crypto.constants.RSA_PSS_SALTLEN_DIGEST` establece la longitud de sal de tamaño resumido, `crypto.constants.RSA_PSS_SALTLEN_AUTO` (por defecto) hace que se determine automáticamente.

El argumento `signature` es la firma previamente calculada para los datos, en el `signatureFormat` que puede ser `'latin1'`, `'hex'` o `'base64'`. Si un `signatureFormat` es especificado, la `signature` se espera que sea una string; de no ser así se espera que `signature` sea un [`Buffer`][], `TypedArray`, o `DataView`.

El objeto `verify` no puede ser usado nuevamente después de que `verify.verify()` ha sido llamado. Múltiples llamadas a `verify.verify()` arrojarán un error.

## Métodos y propiedades del módulo `crypto`

### crypto.constants
<!-- YAML
added: v6.3.0
-->
- Devuelve: {Object} Un objeto contiene constantes usadas comúnmente para cifrado y operaciones relacionadas con la seguridad. Las constantes especificadas actualmente definidas son descritas en [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING
<!-- YAML
added: v0.9.3
-->

La codificación predeterminada a usar para funciones que pueden tomar strings o [buffers][`Buffer`]. El valor por defecto es `'buffer'`, que hace que los métodos por defecto sean objetos [`Buffer`][].

El mecanismo `crypto.DEFAULT_ENCODING` es dado para la compatibilidad con versiones anteriores de programas antiguos que esperan que `'latin1'` sea un código por defecto.

Las nuevas aplicaciones deben esperar que el valor por defecto sea `'buffer'`. Esta propiedad puede volverse obsoleta en futuras versiones de Node.js.

### crypto.fips
<!-- YAML
added: v6.0.0
-->

La propiedad para verificar y controlar si un proveedor de crypto compatible FIPS está actualmente en uso. Establecer true requiere una compilación FIPS de Node.js.

### crypto.createCipher(algorithm, password[, options])
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Devuelve: {Cipher}

Crea y devuelve un objeto `Cipher` que usa los `algorithm` y `password` dados. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de OpenSSL, un ejemplo sería `'aes192'`, etc. En publicaciones recientes de OpenSSL, `openssl list-cipher-algorithms` mostrará los algoritmos de cipher disponibles.

El `password` es usado para derivar la clave cifrada y el vector de inicialización (IV). El valor debe ser un string codificado `'latin1'`, un [`Buffer`][], un `TypedArray`, o un `DataView`.

La implementación de `crypto.createCipher()` deriva claves usando la función de OpenSSL [`EVP_BytesToKey`][] con el algoritmo de resumen establecido en MD5, una iteración, y sin sal. La falta de sal permite ataques de diccionario ya que la misma contraseña siempre crea la misma clave. El bajo conteo de iteraciones y el algoritmo hash no-criptográficamente seguro permite que las contraseñas sean probadas rápidamente.

De acuerdo con las recomendaciones de OpenSSL para usar PBKDF2 en vez de [`EVP_BytesToKey`][], se recomienda que los desarrolladores deriven una clave y un IV por su cuenta usando [`crypto.pbkdf2()`][] y usen [`crypto.createCipheriv()`][] para crear el objeto `Cipher`. Los usuarios no deben usar cifrados con modo contador (por ejemplo CTR, GCM, o CCM) en `crypto.createCipher()`. Se emite una advertencia cuando se usan a fin de evitar el riesgo de reutilización IV que causa vulnerabilidades. For the case when IV is reused in GCM, see \[Nonce-Disrespecting Adversaries\]\[\] for details.

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
- Devuelve: {Cipher}

Crea y devuelve un objeto `Cipher`, con los `algorithm`, `key` y vector de inicialización (`iv`) dados. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de OpenSSL, un ejemplo sería `'aes192'`, etc. En publicaciones recientes de OpenSSL, `openssl list-cipher-algorithms` mostrará los algoritmos de cipher disponibles.

La `key` es la clave sin procesar usada por el `algorithm` y `iv` es un [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Ambos argumentos deben ser strings `'utf8'` codificadas, [Buffers][`Buffer`], `TypedArray`, o `DataView`. Si el cifrado no necesita un vector de inicialización, entonces `iv` puede ser `null`.

### crypto.createCredentials(details)
<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Estabilidad: 0 - Estable: Use [`tls.createSecureContext()`][] en su lugar.

- `details` {Object} Idéntico a [`tls.createSecureContext()`][].

El método `crypto.createCredentials()` es una función desaprobada para crear y devolver un `tls.SecureContext`. No debe ser usada. Reemplácelo con [`tls.createSecureContext()`][] el cual tiene exactamente los mismos argumentos y valor de retorno.

Devuelve un `tls.SecureContext`, como si [`tls.createSecureContext()`][] hubiera sido llamado.

### crypto.createDecipher(algorithm, password[, options])
<!-- YAML
added: v0.1.94
-->
- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Devuelve: {Decipher}

Crea y devuelve un objeto `Decipher` que usa los `algorithm` y `password` (clave) dados. El argumento opcional `options` controla el comportamiento del stream.

La implementación de `crypto.createDecipher()` deriva claves usando la función OpenSSL [`EVP_BytesToKey`][] con el algoritmo de resumen establecido en MD5, una iteración, y sin sal. La falta de sal permite ataques de diccionario ya que la misma contraseña siempre crea la misma clave. El bajo conteo de iteraciones y el algoritmo hash no-criptográficamente seguro permite que las contraseñas sean probadas rápidamente.

De acuerdo con las recomendaciones de OpenSSL para usar PBKDF2 en vez de [`EVP_BytesToKey`][] se recomienda que los desarrolladores deriven una clave y un IV por su cuenta usando [`crypto.pbkdf2()`][] y usen [`crypto.createDecipheriv()`][] para crear el objeto `Decipher`.

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
- Devuelve: {Decipher}

Crea y devuelve un objeto `Decipher` que usa los `algorithm`, `key` y vector de inicialización (`iv`) dados. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de OpenSSL, un ejemplo sería `'aes192'`, etc. En publicaciones recientes de OpenSSL, `openssl list-cipher-algorithms` mostrará los algoritmos de cipher disponibles.

La `key` es la clave sin procesar usada por el `algorithm` y `iv` es un [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Ambos argumentos deben ser strings `'utf8'` codificadas, [Buffers][`Buffer`], `TypedArray`, o `DataView`. Si el cifrado no necesita un vector de inicialización, entonces `iv` puede ser `null`.

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
- `prime`{string | Buffer | TypedArray | DataView}
- `primeEncoding` {string}
- `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
- `generatorEncoding` {string}

Crea un objeto de intercambio de claves `DiffieHellman` usando el `prime` proporcionado y un `generator` opcional específico.

El argumento `generator` puede ser un número, string, o un [`Buffer`][]. Si `generator` no es especificado, el valor `2` es usado.

Los argumentos `primeEncoding` y `generatorEncoding` pueden ser `'latin1'`, `'hex'`, o `'base64'`.

Si `primeEncoding` es especificado, se espera que `prime` sea una string; de no ser así, se espera que sea un [`Buffer`][], `TypedArray`, o `DataView`.

Si `generatorEncoding` es especificado, se espera que `generator` sea una string; de no ser así, se espera un número, [`Buffer`][], `TypedArray`, o `DataView`.

### crypto.createDiffieHellman(primeLength[, generator])
<!-- YAML
added: v0.5.0
-->
- `primeLength` {number}
- `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`

Crea un objeto de intercambio de claves `DiffieHellman` y genera un prime de `primeLength` bits usando un `generator` numérico opcional específico. Si `generator` no es especificado, el valor `2` es usado.

### crypto.createECDH(curveName)
<!-- YAML
added: v0.11.14
-->
- `curveName` {string}

Crea un objeto de intercambio de claves de Curva Elíptica Diffie-Hellman (`ECDH`) usando una curva predefinida específicada por la string `curveName`. Use [`crypto.getCurves()`][] para obtener una lista de nombres de curvas disponibles. En las últimas versiones OpenSSL, `openssl ecparam -list_curves` también mostrará el nombre y la descripción de cada curva elíptica disponible.

### crypto.createHash(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}
- `options` {Object} [`stream.transform` options][]
- Devuelve: {Hash}

Crea y devuelve un objeto `Hash` que puede ser usado para generar resúmenes hash usando el `algorithm` dado. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de los algoritmos disponibles respaldados por la versión de OpenSSL en la plataforma. Los ejemplos son `'sha256'`, `'sha512'`, etc. En versiones recientes de OpenSSL, `openssl list-message-digest-algorithms` mostrará los resúmenes de algoritmos disponibles.

Ejemplo: generando la suma sha256 de un archivo

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
- Devuelve: {Hmac}

Crea y devuelve un objeto `Hmac` que usa el `algorithm` y la `key` dados. El argumento opcional `options` controla el comportamiento del stream.

El `algorithm` es dependiente de los algoritmos disponibles respaldados por la versión de OpenSSL en la plataforma. Los ejemplos son `'sha256'`, `'sha512'`, etc. En versiones recientes de OpenSSL, `openssl list-message-digest-algorithms` mostrará los resúmenes de algoritmos disponibles.

La `key` es la clave HMAC usada para generar el hash criptográfico HMAC.

Ejemplo: generando la HMAC sha256 de un archivo

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
- Devuelve: {Sign}

Crea y devuelve un objeto `Sign` que usa el `algorithm` dado. Use [`crypto.getHashes()`][] para obtener una matriz de nombres de los algoritmos de firma disponibles. El argumento opcional `options` controla el comportamiento `stream.Writable`.

### crypto.createVerify(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
- `algorithm` {string}
- `options` {Object} [`stream.Writable` options][]
- Devuelve: {Verify}

Crea y devuelve un objeto `Verify` que usa el algoritmo dado. Use [`crypto.getHashes()`][] para obtener una matriz de nombres de los algoritmos de firma disponibles. El argumento opcional `options` controla el comportamiento `stream.Writable`.

### crypto.getCiphers()
<!-- YAML
added: v0.9.3
-->
- Devuelve: {string[]} Un string con los nombres de los algoritmos de cifrado respaldados.

Ejemplo:

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()
<!-- YAML
added: v2.3.0
-->
- Devuelve: {string[]} Un string con los nombres de las curvas elípticas respaldadas.

Ejemplo:

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)
<!-- YAML
added: v0.7.5
-->
- `groupName` {string}
- Devuelve: {Object}

Crea un objeto de intercambio de claves `DiffieHellman` predefinido. Los grupos respaldados son: `'modp1'`, `'modp2'`, `'modp5'` (definidos en [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), pero ver [Caveats](#crypto_support_for_weak_or_compromised_algorithms)) y `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (definidos en [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). El objeto devuelto imita la interfaz de objetos creados por [`crypto.createDiffieHellman()`][], pero no va a permitir cambios de las claves (con [`diffieHellman.setPublicKey()`][] por ejemplo). La ventaja de usar este método es que las partes no tienen que generar ni intercambiar un grupo de módulos de antemano, ahorrando tiempo de procesado y de comunicación.

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

### crypto.getHashes()
<!-- YAML
added: v0.9.3
-->
- Devuelve: {string[]} Un array de los nombres de los algoritmos hash compatibles, como `'RSA-SHA256'`.

Ejemplo:

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

Proporciona una implementación asincrónica de la función 2 (PBKDF2) de derivación de clave basada en contraseña. Un algoritmo resumido HMAC seleccionado, especificado por `digest`, es aplicado para derivar una clave de la longitud de byte solicitada (`keylen`) de los `password`, `salt` y `iterations`.

La función `callback` es llamada con dos argumentos: `err` y `derivedKey`. Se establecerá un `err` si un error ocurre, de lo contrario `err` sera nulo. La `derivedKey` exitosamente generada pasará como un [`Buffer`][].

El argumento `iterations` debe ser un número establecido lo más alto posible. Mientras más alto sea el número de iteraciones, más segura será la clave derivada, pero tomará mucho más tiempo para completarse.

La `salt` también debe ser lo más única posible. Es recomendable que las sales sean aleatorias y que sus longitudes sean de al menos de 16 bytes. Vea [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) para más detalles.

Ejemplo:

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...08d59ae'
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
- `password` {string}
- `salt` {string}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}
- Devuelve: {Buffer}

Proporciona una implementación asincrónica de la función 2 (PBKDF2) de Derivación de Clave Basada en Contraseña. Un algoritmo resumido HMAC seleccionado, especificado por `digest`, es aplicado para derivar una clave de la longitud de byte solicitada (`keylen`) de los `password`, `salt` y `iterations`.

Si ocurre un error, el mismo sera arrojado; sino, la clave derivada se regresará como un [`Buffer`][].

El argumento `iterations` debe ser un número establecido lo más alto posible. Mientras más alto sea el número de iteraciones, más segura será la clave derivada, pero tomará mucho más tiempo para completarse.

La `salt` también debe ser lo más única posible. Es recomendable que las sales sean aleatorias y que sus longitudes sean de al menos de 16 bytes. Vea [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) para más detalles.

Ejemplo:

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512');
console.log(key.toString('hex'));  // '3745e48...08d59ae'
```

Un array de funciones de compilación compatibles puede ser recuperada usando [`crypto.getHashes()`][].

### crypto.privateDecrypt(privateKey, buffer)
<!-- YAML
added: v0.11.14
-->
- `privateKey` {Object | string}
  - `key` {string} Clave privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} Un valor de relleno opcional definido en `crypto.constants`, que puede ser: `crypto.constants.RSA_NO_PADDING`, `RSA_PKCS1_PADDING`, o `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Devuelve: {Buffer} Un nuevo `Buffer` con el contenido descifrado.

Descifra `buffer` con la `privateKey`.

`privateKey` puede ser un objeto o una string. Si `privateKey` es una string, es tratada como la clave sin frase de contraseña y va a usar `RSA_PKCS1_OAEP_PADDING`.

### crypto.privateEncrypt(privateKey, buffer)
<!-- YAML
added: v1.1.0
-->
- `privateKey` {Object | string}
  - `key` {string} Clave privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} Un valor de relleno opcional definido en `crypto.constants`, que puede ser: `crypto.constants.RSA_NO_PADDING` o `RSA_PKCS1_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Devuelve: {Buffer} Un nuevo `Buffer` con el contenido encriptado.

Encripta `buffer` con la `privateKey`.

`privateKey` puede ser un objeto o una string. Si `privateKey` es una string, es tratada como la clave sin frase de contraseña y va a usar `RSA_PKCS1_PADDING`.

### crypto.publicDecrypt(key, buffer)
<!-- YAML
added: v1.1.0
-->
- `key` {Object | string}
  - `key` {string} Clave pública o privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} Un valor de relleno opcional definido en `crypto.constants`, que puede ser: `crypto.constants.RSA_NO_PADDING` o `RSA_PKCS1_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Devuelve: {Buffer} Un nuevo `Buffer` con el contenido descifrado.

Descifra `buffer` con la `key`.

`key` puede ser un objeto o una string. Si `key` es una string, es tratada como una clave sin frase de contraseña y va a usar `RSA_PKCS1_PADDING`.

Debido a que las claves públicas RSA pueden ser derivadas de claves privadas, una clave privada puede ser pasada en lugar de una clave pública.

### crypto.publicEncrypt(key, buffer)
<!-- YAML
added: v0.11.14
-->
- `key` {Object | string}
  - `key` {string} Clave pública o privada con codificación PEM.
  - `passphrase` {string} Una frase de contraseña opcional para la clave privada.
  - `padding` {crypto.constants} Un valor de relleno opcional definido en `crypto.constants`, que puede ser: `crypto.constants.RSA_NO_PADDING`, `RSA_PKCS1_PADDING`, o `crypto.constants.RSA_PKCS1_OAEP_PADDING`.
- `buffer` {Buffer | TypedArray | DataView}
- Devuelve: {Buffer} Un nuevo `Buffer` con el contenido encriptado.

Encripta el contenido del `buffer` con la `key` y devuelve un nuevo [`Buffer`][] con el contenido encriptado.

`key` puede ser un objeto o una string. Si `key` es una string, es tratada como una clave sin frase de contraseña y va a usar `RSA_PKCS1_OAEP_PADDING`.

Debido a que las claves públicas RSA pueden ser derivadas de claves privadas, una clave privada puede ser pasada en lugar de una clave pública.

### crypto.randomBytes(size[, callback])
<!-- YAML
added: v0.5.8
-->
- `size` {number}
- `callback` {Function}
  - `err` {Error}
  - `buf` {Buffer}
- Devuelve: {Buffer} si la función `callback` no es proporcionada.

Genera datos pseudoaleatorios criptográficamente fuertes. El argumento `size` es un número que indica el número de bytes a generar.

Si una función `callback` es dada, los bytes son generados asincrónicamente y la función `callback` es invocada con dos argumentos: `err` y `buf`. Si un error ocurre, `err` será un objeto de Error, de lo contrario sera nulo. El argumento `buf` es un [`Buffer`][] que contiene los bytes generados.

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

*Note*: The asynchronous version of `crypto.randomBytes()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomBytes` requests when doing so as part of fulfilling a client request.

### crypto.randomFillSync(buffer\[, offset\]\[, size\])
<!-- YAML
added: v7.10.0
-->

* `buffer` {Buffer|Uint8Array} Debe ser suministrada.
* `offset` {number} **Default:** `0`
* `size` {number} **Default:** `buffer.length - offset`
* Devuelve: {Buffer}

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

### crypto.randomFill(buffer\[, offset\]\[, size\], callback)
<!-- YAML
added: v7.10.0
-->

* `buffer` {Buffer|Uint8Array} Debe ser suministrada.
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

Tenga en cuenta que esta API usa el conjunto de subprocesos de libuv, el cual puede tener implicaciones de desempeño sorprendentes y negativas para algunas aplicaciones, vea la documentación [`UV_THREADPOOL_SIZE`][] para más información.

*Note*: The asynchronous version of `crypto.randomFill()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomFill` requests when doing so as part of fulfilling a client request.

### crypto.setEngine(engine[, flags])
<!-- YAML
added: v0.11.11
-->
- `engine` {string}
- `flags` {crypto.constants} **Por defecto:** `crypto.constants.ENGINE_METHOD_ALL`

Cargue y configure el `engine` para algunas o todas las funciones OpenSSL (seleccionadas por flags).

`engine` puede ser tanto un id o una ruta a la biblioteca compartida del motor.

El argumento opcional `flags` usa `ENGINE_METHOD_ALL` por defecto. Los `flags` son un campo de bits que toma una o una mezcla de los siguientes flags (definidos en `crypto.constants`):

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
- Devuelve: {boolean}

Esta función se basa en un algoritmo de tiempo constante. Devuelve true si `a` es igual a `b`, sin perder información de tiempo que le permita adivinar a un atacante uno de los valores. Esto es adecuado para comparar los resúmenes de HMAC o los valores secretos como cookies de autenticación o [urls de habilidad](https://www.w3.org/TR/capability-urls/).

`a` y `b` deben ser ambos `Buffer`s, `TypedArray`s, o `DataView`s, y deben tener la misma longitud.

*Nota*: El uso de `crypto.timingSafeEqual` no garantiza que el código *cercano* sea seguro en cuanto a tiempo. Debe tener cuidado al asegurarse de que el código cercano no introduce vulnerabilidades de tiempo.

## Notas

### API de Streams heredadas (previo a Node.js v0.10)

El módulo Crypto fue añadido a Node.js antes del concepto de una Stream API unificada, y antes de que existieran objetos [`Buffer`][] para manejar datos binarios. Como tal, la mayoría de las clases definidas `crypto` tienen métodos atípicos encontrados en otras clases Node.js que implementan los [streams](stream.html) API (e.g `update()`, `final()`, or `digest()`). Also, many methods accepted and returned `'latin1'` encoded strings by default rather than Buffers. Esto fue cambiado después de Node.js v0.8 para usar objetos [`Buffer`][] en lugar del predeterminado.

### Cambios Recientes ECDH

El uso de `ECDH` sin dinamismo generado de pares key ha sido simplificado. Ahora, [`ecdh.setPrivateKey()`][] puede ser llamado con una key privada preseleccionada y el punto público asociado (key) será computado y almacenado en el objeto. Esto permite al código sólo almacenar y proporcionar la parte privada del par key EC. [`ecdh.setPrivateKey()`][] ahora también valida que la key privada es válida por la curve seleccionada.

El método [`ecdh.setPublicKey()`][] ahora está desaprobado ya que, su inclusión en la API no es útil. También, una key privada almacenada con anterioridad debería estar establecida, lo cual automaticamente genera la key pública asociada, o mejor llamada [`ecdh.generateKeys()`][]. El principal inconveniente del uso de [`ecdh.setPublicKey()`][] es que puede ser usado para poner el par key ECDH en un estado de inconsciencia.

### Soporte para algoritmos débiles o comprometidos

El módulo `crypto` todavía soporta algunos algoritmos que están comprometidos y que no son actualmente recomendados. El API también permite el uso de ciphers y hashes con una key pequeña que son considerados muy débiles en temas de seguridad.

Los usuarios deben tomar la responsabilidad completa por seleccionar el crypto algoritmo y el tamaño de la key dependiendo de los requerimientos de seguridad.

Basado en la recomendación de [NIST SP 800-131A](http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

- MD5 y SHA-1 ya no son aceptados como firmas digitales en donde la collision resistance es necesaria.
- La key usada con los algoritmos RSA, DSA, y DH es recomendable que tenga al menos 2048 bits y que la curve de ECDSA y ECDH tenga al menos 224 bits, esto para que sea seguro su uso por varios años.
- Los grupos DH de `modp1`, `modp2` and `modp5` que tienen un tamaño de key menor a 2048 bits, no son recomendados.

Observe la referencia para otras recomendaciones y detalles.

## Constantes de Crypto

Las siguientes constantes sacadas de `crypto.constants` sirven para diversos usos de los módulos `crypto`, `tls`, y `https` además generalmente son específicos de OpenSSL.

### Opciones de OpenSSL

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Aplica para múltiples soluciones de fallos dentro de OpenSSL. Ver https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html para más información.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Permite una renegociación insegura heredada entre OpenSSL y clientes o servidores sin parchar. Ver
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Intenta utilizar las preferencias del servidor en lugar de las del 
cliente al seleccionar un cifrado. El comportamiento depende de la versión del protocolo. Ver
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
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
    <td><code>ENGINE_METHOD_ECDH</code></td>
    <td>Limit engine usage to ECDH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_ECDSA</code></td>
    <td>Limit engine usage to ECDSA</td>
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
    <td><code>ENGINE_METHOD_STORE</code></td>
    <td>Limit engine usage to STORE</td>
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
    <td>Establece la longitud de sal para `RSA_PKCS1_PSS_PADDING` al tamaño resumido al firmar o verificar.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_MAX_SIGN</code></td>
    <td>Establece la longitud de sal para `RSA_PKCS1_PSS_PADDING` en el valor máximo permitido al firmar datos.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_AUTO</code></td>
    <td>Hace que la longitud de sal para `RSA_PKCS1_PSS_PADDING` se determine automáticamente al verificar una firma.</td>
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

