# Crypto

<!--introduced_in=v0.3.6-->

> Estabilidad: 2 - Estable

El módulo `crypto` ofrece funcionalidad criptográfica que incluye un set de empaquetadores para OpenSSL's hash, HMAC, cifrado, descifrado, firma y funciones de verificación.

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

SPKAC es un mecanismo de Solicitud de Firma de Certificado implementado originalmente por Netscape y, en la actualidad, especificado formalmente como parte de [HTML5's `keygen` element][].

El módulo `crypto` provee la clase `Certificate` para trabajar con datos SPKAC. El uso más común es la salida handling generada por el elemento HTML5 `<keygen>`. Node.js usa [OpenSSL's SPKAC implementation](https://www.openssl.org/docs/man1.0.2/apps/spkac.html) internamente.

### nuevo crypto.Certificate()

Instancias del tipo de `Certificate` pueden ser creadas usando la palabra `new` o, llamando `crypto.Certificate()` como una función:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

### certificate.exportChallenge(spkac)

<!-- YAML
added: v0.11.8
-->

La estructura de los datos `spkac` incluye una llave pública y un desafío. El `certificate.exportChallenge()` regresa al desafío del componente en la forma de un [`Buffer`][] del Node.js. El argumento `spkac` puede ser tanto un string como un [`Buffer`][].

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

La estructura de los datos `spkac` incluye una llave pública y un desafío. El `certificate.exportPublicKey()` regresa al componente de clave pública en la forma de un [`Buffer`][]. El argumento `spkac` puede ser tanto un string como un [`Buffer`][].

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

Regresa `true` si la estructura de los datos `spkac` dados es válida o `false` en caso contrario. El argumento `spkac` debe ser un [`Buffer`][] de Node.js.

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

Las instancias de la clase `Cipher` son usadas para encriptar datos. La clase puede ser empleada en una de dos formas:

* Como un [stream](stream.html) que es tanto legible como grabable en donde los datos sencillos desencriptados son escritos para producir datos encriptados en lado legible; o,
* Usando los métodos [`cipher.update()`][] y [`cipher.final()`][] para producir los datos encriptados.

Los métodos [`crypto.createCipher()`][] o [`crypto.createCipheriv()`][] son usados para crear las instancias de `Cipher`. Los objetos `Cipher` no son creados directamente al usar la palabra clave `new`.

Ejemplo: Usar los objetos `Cipher` como streams:

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

Ejemplo: Usando `Cipher` y los streams canalizados:

```js
const crypto = require('crypto');
const fs = require('fs');
const cipher = crypto.createCipher('aes192', 'a password');

const input = fs.createReadStream('test.js');
const output = fs.createWriteStream('test.enc');

input.pipe(cipher).pipe(output);
```

Ejemplo: Usando los métodos [`cipher.update()`][] y [`cipher.final()`][]:

```js
const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// Imprime: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
```

### cipher.final([output_encoding])

<!-- YAML
added: v0.1.94
-->

Regresa cualquiera de los contenidos restantes cifrados. Un string es regresado si el parámetro `output_encoding` es uno de los ` 'latin1'`, `'base64'` o `'hex'`. De igual forma, si un `output_encoding` no es dado, se regresa un [`Buffer`][].

El objeto `Cipher` no puede ser utilizado para encriptar datos una vez que el método `cipher.final()` ha sido llamado. Y, arrojará un error al hacer varios intentos para llamar al `cipher.final()` más de una vez.

### cipher.setAAD(buffer)

<!-- YAML
added: v1.0.0
-->

El método `cipher.setAAD()` establece el valor empleado por el parámetro de entrada *additional authenticated data* (AAD) cuando se use un modo autenticado de encriptación (solo el `GCM` es válido actualmente).

Regresa `this` para el encadenamiento de métodos.

### cipher.getAuthTag()

<!-- YAML
added: v1.0.0
-->

El método `cipher.getAuthTag()` regresa a un [`Buffer`][] que contiene la *etiqueta de autenticación* que ha sido computada por los datos dados cuando es un modo de encriptación autenticado (solo `GCM` está actualmente avalado).

El método `cipher.getAuthTag()` solo debría ser llamado luego de haber completado la encriptación al usar el método [`cipher.final()`][].

### cipher.setAutoPadding(auto_padding=true)

<!-- YAML
added: v0.7.1
-->

El tipo de `Cipher` se añadirá como relleno automáticamente para el ingreso de datos al tamaño del bloque apropiado. Para inhabilitar el relleno por defecto, llame a `cipher.setAutoPadding(false)`.

La longitud de todos los datos ingresados debe ser un múltiplo del tamaño del bloque cifrado o el [`cipher.final()`][] arrojará un Error cuando `auto_padding` sea `false`. Desabilitar el relleno automático es útil para un relleno atípico, por lo que se puede usar `0x0` en vez del relleno PKCS.

El método `cipher.setAutoPadding()` debe ser llamado antes del [`cipher.final()`][].

Regresa `this` para el encadenamiento de métodos.

### cipher.update(data\[, input_encoding\]\[, output_encoding\])

<!-- YAML
added: v0.1.94
-->

Actualiza el cifrado con `data`. Si el argumento `inputEncoding` es dado, su valor debe ser `'utf8'`, `'ascii'`, o `'latin1'` y el argumento `data` es una string usando la codificación especificada. Pero, si el argumento `inputEncoding` no es dado, `data` debe ser un [`Buffer`][]. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

El `outputEncoding` especifica el formato de salida de los datos cifrados, y puede ser `'latin1'`, `'base64'` o `'hex'`. Si el `outputEncoding` es especificado, se devuelve una string que usa la codificación especificada. Si no se provee un `outputEncoding`, un [`Buffer`][] es devuelto.

El método `cipher.update()` puede ser llamado múltiples veces con nuevos datos hasta que se llame a [`cipher.final()`][]. Si se llama a `cipher.update()` después de [`cipher.final()`][] se producirá un error.

## Clase: Decipher

<!-- YAML
added: v0.1.94
-->

Instancias de la clase `Decipher` son usadas para descifrar datos. La clase puede ser empleada en una de dos formas:

* Como un [stream](stream.html) que es legible y escribible, donde los datos planos encriptados están escritos para producir datos no encriptados en el lado legible, o
* Usando los métodos [`decipher.update()`][] y [`decipher.final()`][] para producir datos no encriptados.

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
  // Imprime: algunos datos de texto limpios
});

const encrypted =
  'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
decipher.write(encrypted, 'hex');
decipher.end();
```

Ejemplo: Usando `Cipher` y los streams canalizados:

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
  // Imprime: algunos datos de texto limpios
```

### decipher.final([output_encoding])

<!-- YAML
added: v0.1.94
-->

Regresa cualquiera de los contenidos restantes descifrados. Un string es regresado si el parámetro `output_encoding` es `'latin1'`, `'base64'` o `'hex'`. De igual forma, si un `output_encoding` no es dado, se regresa un [`Buffer`][].

Una vez que el método `decipher.final()` ha sido llamado, el objeto `Decipher` no puede ser usado para descifrar datos. Intentar llamar mas de una vez a `decipher.final()` producirá un error.

### decipher.setAAD(buffer)

<!-- YAML
added: v1.0.0
-->

El método `decipher.setAAD()` establece el valor empleado por el parámetro de entrada *additional authenticated data* (AAD) cuando se use un modo autenticado de encriptación (solo el `GCM` es válido actualmente).

Regresa `this` para el encadenamiento de métodos.

### decipher.setAuthTag(buffer)

<!-- YAML
added: v1.0.0
-->

El método `decipher.setAuthTag()` es usado para pasar la *etiqueta de autenticación recibida* cuando se usa un modo de encriptación autenticado (solamente `GCM` y <0>CCM</0> están siendo respaldados en la actualiad). Si no se provee ninguna etiqueta o el texto cifrado ha sido manipulado, va a arrojar [`decipher.final()`][], indicando que el texto cifrado debe descartarse por una autenticación fallida.

Regresa `this` para el encadenamiento de métodos.

### decipher.setAutoPadding(auto_padding=true)

<!-- YAML
added: v0.7.1
-->

Cuando los datos han sido encriptados sin un llenado de bloques estándar, llamar al `decipher.setAutoPadding(false)` deshabilitará automáticamente el llenado automático para prevenir a [`decipher.final()`][] de verificar y remover el llenado.

Desactivar el llenado automático solo funcionara si la longitud de datos de entrada es un múltiplo del tamaño de bloque de los cifrados.

El método `decipher.setAutoPadding()` debe ser llamado antes de [`decipher.update()`][].

Regresa `this` para el encadenamiento de métodos.

### decipher.update(data\[, input_encoding\]\[, output_encoding\])

<!-- YAML
added: v0.1.94
-->

Actualiza el descifrado con `data`. Si el argumento `inputEncoding` es dado, su valor debe ser `'latin1'`, `'base64'`, o `'hex'` y el argumento `data` es una string que utiliza la codificación especificada. Pero, si el argumento `inputEncoding` no es dado, `data` debe ser un [`Buffer`][]. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

El `outputEncoding` especifica el formato de salida de los datos cifrados, y puede ser `'latin1'`, `'ascii'` o `'utf8'`. Si el `outputEncoding` es especificado, se devuelve una string que usa la codificación especificada. Si no se provee un `outputEncoding`, un [`Buffer`][] es devuelto.

El método `decipher.update()` puede ser llamado múltiples veces con nuevos datos hasta que sea llamado [`decipher.final()`][]. Pero, si se llama a `decipher.update()` después de [`decipher.final()`][] se producirá un error.

## Clase: DiffieHellman

<!-- YAML
added: v0.5.0
-->

La clase `DiffieHellman` es útil para crear intercambios en la clave Diffie-Hellman.

Las instancias de la clase `DiffieHellman` pude ser creada usando la función [`rypto.createDiffieHellman()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Genera las llaves de Alice...
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

### diffieHellman.computeSecret(other_public_key\[, input_encoding\]\[, output_encoding\])

<!-- YAML
added: v0.5.0
-->

Computa el secreto compartido usando `otherPublicKey` como la clave pública de la otra parte y devuelve el secreto compartido computado. La clave dada es interpretada usando el `inputEncoding` especificado, y el secreto es codificado usando el `outputEncoding` especificado. Los códigos pueden ser `'latin1'`, `'hex'`, o `'base64'`. Si el `input_encoding` no es proporcionado, `otra_llave_pública` es esperada para ser un [`Buffer`][].

Una string es devuelta si el `outputEncoding` es dado; de no ser así, un [`Buffer`][] es devuelto.

### diffieHellman.generateKeys([encoding])

<!-- YAML
added: v0.5.0
-->

Genera valores de claves Diffie-Hellman privadas y públicas, y devuelve la clave pública en el `encoding` especificado. Esta clave debe ser transferida a la otra parte. Los códigos pueden ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así, un [`Buffer`][] es devuelto.

### diffieHellman.getGenerator([encoding])

<!-- YAML
added: v0.5.0
-->

Devuelve el generador de Diffie-Hellman al `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPrime([encoding])

<!-- YAML
added: v0.5.0
-->

Regresa el Diffie-Hellman prime al `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPrivateKey([encoding])

<!-- YAML
added: v0.5.0
-->

Regresa la llave privada Diffie-Hellman en el `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.getPublicKey([encoding])

<!-- YAML
added: v0.5.0
-->

Regresa la llave pública Diffie-Hellman al `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### diffieHellman.setPrivateKey(private_key[, encoding])

<!-- YAML
added: v0.5.0
-->

Establece la clave privada Diffie-Hellman. Si el argumento `encoding` es proporcionado y es `'latin1'`, `'hex'`, o `'base64'`, `privateKey`, se espera que sea una string. Si el `input_encoding` no es proporcionado, `otra_llave_pública`, se espra que sea un [`Buffer`][].

### diffieHellman.setPublicKey(public_key[, encoding])

<!-- YAML
added: v0.5.0
-->

Establece la clave pública Diffie-Hellman. Si el argumento `encoding` es proporcionado y es `'latin1'`, `'hex'` o `'base64'`, `publicKey` se espera que sea una string. Si el `input_encoding` no es proporcionado, se espera que `public_key` sea un [`Buffer`][].

### diffieHellman.verifyError

<!-- YAML
added: v0.11.12
-->

Un campo de bits que contiene advertencias y/o errores que resultan de un chequeo realizado durante la inicialización del objeto `DiffieHellman`.

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

// Genera las llaves de Alice...
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

### ecdh.computeSecret(other_public_key\[, input_encoding\]\[, output_encoding\])

<!-- YAML
added: v0.11.14
-->

Computa el secreto compartido usando `other_public_key` como la clave pública de la otra parte y devuelve el secreto compartido computado. La clave suministrada es interpretada usando el `input_encoding` especificado, y el secreto devuelto es codificado usando `output_encoding`. Las codificaciones pueden ser `'latin1'`, `'hex'`, o `'base64'`. Si el `input_encoding` no es proporcionado, se espera que `other_public_key` sea un [`Buffer`][].

Si `output_encoding` es dado, una string será devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.generateKeys([encoding[, format]])

<!-- YAML
added: v0.11.14
-->

Genera los valores de la clave EC Diffie-Hellman privados y públicos, y devuelve la clave pública en el `format` y `encoding` especificado. Esta clave debe ser transferida a la otra parte.

El argumento `format` especifica la codificación de puntos y puede ser `'compressed'`, `'uncompressed'` o `'hybrid'`. Si `format` no es especificado, el punto será devuelto en formato `'uncompressed'`.

El argumento `encoding` puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.getPrivateKey([encoding])

<!-- YAML
added: v0.11.14
-->

Regresa la llave privada EC Diffie-Hellman en el `encoding` especificado, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.getPublicKey([encoding[, format]])

<!-- YAML
added: v0.11.14
-->

Devuelve la clave pública EC Diffie-Hellman en el `encoding` y `format` especificado.

El argumento `format` especifica la codificación de puntos y puede ser `'compressed'`, `'uncompressed'` o `'hybrid'`. Si `format` no es especificado, el punto será devuelto en formato `'uncompressed'`.

El argumento `encoding` puede ser `'latin1'`, `'hex'`, o `'base64'`. Si `encoding` es especificado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

### ecdh.setPrivateKey(private_key[, encoding])

<!-- YAML
added: v0.11.14
-->

Establece la clave privada EC Diffie-Hellman. El `encoding` puede ser `'latin1'`, `'hex'` o `'base64'`. Si `encoding` es dado, se espera que `private_key` sea una string; de no ser así, se espera que `private_key` sea un [`Buffer`][], `TypedArray`, o `DataView`. Si `private_key` no es válido para la curva especificada cuando el objeto `ECDH` fue creado, se produce un error. Sobre la configuración de la clave privada, el punto público asociado (clave) es también generado y establecido en el objeto ECDH.

### ecdh.setPublicKey(public_key[, encoding])

<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Estabilidad: 0 - Desaprobado

Establece la clave pública EC Diffie-Hellman. La codificación de claves puede ser `'latin1'`, `'hex'` o `'base64'`. Si el `encoding` es proporcionado, se espera que `public_key` sea una string; de otra manera, se espera un [`Buffer`][].

Note que no hay normalmente una razón para llamar a este método porque `ECDH` solo requiere una clave privada y la clave pública de la otra parte para computar el secreto compartido. Tipicamente, [`ecdh.generateKeys()`][] o [`ecdh.setPrivateKey()`][] serán llamados. El método [`ecdh.setPrivateKey()`][] intenta generar la clave/punto público asociado con la clave privada que se está configurando.

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

* Como una [stream](stream.html) que es legible y escribible, donde los datos son escritos para producir un resumen hash computado en el lado legible, o
* Usando el método [`hash.update()`][] y [`hash.digest()`][] para producir el hash computado.

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

Calcula el resumen de todos los datos pasados para ser hashed (usando el método [`hash.update()`][]). El `encoding` puede ser `'hex'`, `'latin1'` o `'base64'`. Si`encoding` es dado, una string será devuelta; de no ser así un [`Buffer`][] es devuelto.

El objeto `Hash` no puede ser usado nuevamente después de que el método `hash.digest()` ha sido llamado. Llamados múltiples causarán que un error sea arrojado.

### hash.Update (datos [, input_encoding])

<!-- YAML
added: v0.1.92
-->

Actualiza el contenido hash con los `data` dados, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

## Clase: Hmac

<!-- YAML
added: v0.1.94
-->

La clase `Hmac` es una utilidad para crear resúmenes criptográficos HMAC. Puede ser usado de una de las dos maneras:

* Como una [stream](stream.html) que es tanto legible como escribible, donde los datos son escritos para producir un resúmen computado HMAC en el lado legible, o
* Usando los métodos [`hmac.update()`][] y [`hmac.digest()`][] para producir el resúmen HMAC.

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

Calcula el resúmen HMAC de todos los datos pasados usando [`hmac.update()`][]. El `encoding` puede ser `'hex'`, `'latin1'` o `'base64'`. Si `encoding` es dado, una string es devuelta; de no ser así, un [`Buffer`][] es devuelto;

El objeto `Hmac` no puede ser usado nuevamente después de que `hmac.digest()` ha sido llamado. Llamadas múltiples a `hmac.digest()` producirá un error.

### hmac.update(data[, input_encoding])

<!-- YAML
added: v0.1.94
-->

Actualiza el contenido `Hmac` con los `data` dados, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

## Clase: Sign

<!-- YAML
added: v0.1.92
-->

La clase `Sign` es una utilidad para generar firmas. Puede ser usada de una de las dos maneras:

* Como una [stream](stream.html) escribible, donde los datos a ser firmados están escritos y el método [`sign.sign()`][] es usado para generar y devolver la firma, o
* Usando los métodos [`sign.update()`][] y [`sign.sign()`][] para producir la firma.

El método [`crypto.createSign()`][] es usado para crear instancias `Sign`. El argumento es el nombre de la string de la función hash a utilizar. Los objetos `Sign` no son creados usando directamente la palabra clave `new`.

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

En algunos casos, una instancia `Sign` también puede ser creada pasando un nombre de algoritmo de firma, como lo es 'RSA-SHA256'. Esto va a usar el algoritmo de resumen correspondiente. Esto no funciona para todos los algoritmos de firmas, tales como 'ecdsa-with-SHA256'. En su lugar, use nombres resumidos.

Ejemplo: firma usando el nombre del algoritmo de firma heredado

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Imprime: la firma calculada
```

### sign.sign(private_key[, output_format])

<!-- YAML
added: v0.1.92
changes:

  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->

Calcula la firma de todos los datos pasados usando [`sign.update()`][] o [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

El argumento `privateKey` puede ser un objeto o una string. Si `privateKey` es una string, se trata como una clave cruda sin frase de contraseña. Si `privateKey` es un objeto, debe contener una o más de las siguientes propiedades:

* `key`: {string} - Clave privada con codificación PEM (requerida)
* `passphrase`: {string} - frase de contraseña para la clave privada
* `padding`: {integer} - Valor de padding opcional para RSA, uno de los siguientes:
  
  * `crypto.constants.RSA_PKCS1_PADDING` (por defecto)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`
  
  Tenga en cuenta que `RSA_PKCS1_PSS_PADDING` va a usar MGF1 con la misma función hash usada para firmar el mensaje como se especifica en la sección 3.1 de [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).

* `saltLength`: {integer} - longitud de salt para cuando el relleno es `RSA_PKCS1_PSS_PADDING`. El valor especial `crypto.constants.RSA_PSS_SALTLEN_DIGEST` establece la longitud de salt al tamaño resumido, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (por defecto) la establece en el valor máximo permitido.

El `outputFormat` puede especificar un `'latin1'`, `'hex'` o `'base64'`. Si `outputFormat` es dado, una string es devuelta; de no ser así un [`Buffer`][] es devuelto.

El objeto `Sign` no puede ser usado nuevamente después de que el método `sign.sign()` ha sido llamado. Llamadas múltiples a `sign.sign()` van a resultar en un error.

### sign.update(data[, input_encoding])

<!-- YAML
added: v0.1.92
-->

Actualiza el contenido `Sign` con el `data` dado, cuyo código es dado en `inputEncoding` y puede ser `'utf8'`, `'ascii'` o `'latin1'`. Si `encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

## Clase: Verify

<!-- YAML
added: v0.1.92
-->

La clase `Verify` es una utilidad para verificar firmas. Puede ser usada de una de las dos maneras:

* Como una [<0>stream](stream.html) escribible donde los datos escritos son usados para validar la firma dada; o,
* Usando los métodos [`verify.update()`][] y [`verify.verify()`][] para verificar la firma.

El método [`crypto.createVerify()`][] se emplea para crear instancias `Verify`. Los objetos `Verify` no son creados directamente usando la palabra clave `new`.

Ejemplo usando los objetos `Verify` como streams:

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

Ejemplo usando los métodos [`verify.update()`][] y [`verify.verify()`][]:

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.update('some data to sign');

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Imprime: Verdadero o Falso
```

### verifier.update(data[, input_encoding])

<!-- YAML
added: v0.1.92
-->

Actualiza el contenido de `Verify` con la `data` proporcionada, cuya codificación es </code>dada en el `input_encoding` y puede ser `'utf8'`, `'ascii'`, o `'latin1'</0>. Si <code>encoding` no es dado, y los `data` son una string, se aplica un código de `'utf8'`. Si `data` es un [`Buffer`][] entonces `inputEncoding` es ignorado.

Esto puede ser llamado muchas veces con nuevos datos a medida en que son streamed.

### verifier.verify(object, signature[, signature_format])

<!-- YAML
added: v0.1.92
changes:

  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/11705
    description: Support for RSASSA-PSS and additional options was added.
-->

* `object` {string | Object}
* `signature` {string | Buffer | Uint8Array}
* `signature_format` {string}

Verifica los datos empleados, utilizando el `object` y la `signature` dados. El argumento `object` puede ser tanto una string que contiene un objeto PEM codificado y que puede ser una llave pública RSA, DSA o un certificado X.509 como un objeto con una o más de las siguientes propiedades:

* `key`: {string} - clave pública PEM codificada (requerida)
* `padding`: {integer} - Valor de padding opcional para RSA, uno de los siguientes:
  
  * `crypto.constants.RSA_PKCS1_PADDING` (por defecto)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`
  
  Note que `RSA_PKCS1_PSS_PADDING` usará MGF1 con la misma función hash empleada para verificar el mensaje como se especifica en la sección 3.1 del [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).

* `saltLength`: {integer} - longitud de salt para cuando el relleno es `RSA_PKCS1_PSS_PADDING`. El valor especial de `crypto.constants.RSA_PSS_SALTLEN_DIGEST` establece la longitud de salt para el tamaño reducido; `crypto.constants.RSA_PSS_SALTLEN_AUTO` (por defecto) hace que se determine automáticamente.

El argumento `signature` es la firma calculada previamente para los datos, en el `signature_format`, el cual puede ser `'latin1'`, `'hex'`, o `'base64'`. Se espera que la `signature` sea una string si un `signature_format` es especificado, de lo contrario se espera que sea un [`Buffer`][].

Regresa `true` o `false`, dependiendo de los valores de la firma para los datos y la clave pública.

El objeto `verifier` no puede ser usado nuevamente luego de que `verify.verify()` ha sido llamado. Múltiples llamadas a `verify.verify()` arrojarán un error.

## Métodos y propiedades del módulo `crypto`

### crypto.constants

<!-- YAML
added: v6.3.0
-->

Regresa un objeto que contiene constantes usadas comúnmente para las operaciones relacionadas con crypto y seguridad. Las constantes específicas actualmente definidas son descritas en [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING

<!-- YAML
added: v0.9.3
-->

La codificación predeterminada a usar para las funciones que pueden tomar strings o [buffers][`Buffer`]. El valor predeterminado es `'buffer'`, el cual hace que los métodos sean objetos [`Buffer`][] por defecto.

El mecanismo `crypto.DEFAULT_ENCODING` se da para la compatibilidad con versiones anteriores con programas antiguos que esperan tener `'latin1'` como codificación predeterminada.

Las nuevas aplicaciones deberían esperar que por defecto sea `'buffer'`. Esta propiedad puede volverse obsoleta en futuras versiones de Node.js.

### crypto.fips

<!-- YAML
added: v6.0.0
-->

La propiedad para verificar y controlar si un proveedor de crypto compatible FIPS está actualmente en uso. Establecer true requiere una compilación FIPS de Node.js.

### crypto.createCipher(algorithm, password)

<!-- YAML
added: v0.1.94
-->

Crea y regresa un objeto `Cipher` que emplea un `algorithm` y una `password` dados.

El `algorithm` es dependiente del OpenSSL, ejemplo de estos son `'aes192'`, etc. En publicaciones recientes de OpenSSL, `openssl list-cipher-algorithms` mostrará los algoritmos de cipher disponibles.

La `password` se emplea para derivar la clave del cifrado y la inicialización del vector (IV). El valor debe ser una string codificada en `'latin1'` o un [`Buffer`][].

La implementación de `crypto.createCipher()` deriva claves usando la función [`EVP_BytesToKey`][] con el algoritmo de resumen establecido para MD5, una iteración y sin salt. La ausencia de salt permite ataques al diccionario ya que la misma contraseña crea siempre la misma clave. El conteo de baja iteración y el algoritmo de hash no criptográficamente seguro permiten que las claves sean probadas rápidamente.

De acuerdo con las recomendaciones de OpenSSL para usar PBKDF2 en vez de [`EVP_BytesToKey`][], se le recomienda a los desarrolladores derivar una clave y un IV por su cuenta empleando [`crypto.pbkdf2()`][], así como usar [`crypto.createCipheriv()`][] para crear el objeto `Cipher`. Los usuarios no deberían usar cifrados en modo contador (por ejemplo, CTR, GCM or CCM) en `crypto.createCipher()`. Una advertencia es emitida cuando son usadas para evitar el riesgo de reusar IV que causa vulnerabilidades. En el caso de que IV sea reutilizado in GCM, véa [Nonce-Disrespecting Adversaries](https://github.com/nonce-disrespect/nonce-disrespect) para más detalles.

### crypto.createCipheriv(algorithm, key, iv)

Crea y regresa un objeto `Cipher` con el `algorithm`, `key` y el vector de inicialización (`iv`).

El `algorithm` es dependiente del OpenSSL, ejemplo de estos son `'aes192'`, etc. En publicaciones recientes de OpenSSL, `openssl list-cipher-algorithms` mostrará los algoritmos de cipher disponibles.

La `key` es la clave no procesada por el `algorithm`, y `iv` es un [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Ambos argumentos deben ser string codificadas en `'utf8'` o [buffers][`Buffer`].

### crypto.createCredentials(details)

<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Estabilidad: 0 - Estable: Use [`tls.createSecureContext()`][] en su lugar.

* `details`{Object} Idéntico a [`tls.createSecureContext()`][].

El método `crypto.createCredentials()` es una función obsoleta para crear y regresar un `tls.SecureContext`. No debería ser usada. Remplácela con [`tls.createSecureContext()`][], la cual tiene los mismos argumentos y valores de retorno.

Regresa una `tls.SecureContext` como si [`tls.createSecureContext()`][] hubiese sido llamado.

### crypto.createDecipher(algorithm, password)

<!-- YAML
added: v0.1.94
-->

Crea y regresa un objeto `Decipher` que usa los `algorithm` y `password` (clave) dados.

La implementación de `crypto.createDecipher()<code> deriva claves usando la función OpenSSL [<0>EVP_BytesToKey`][] con el algoritmo de resumen establecido para MD5, una iteración y sin salt. La ausencia de salt permite ataques al diccionario ya que la misma contraseña crea siempre la misma clave. El conteo de baja iteración y el algoritmo de hash no criptográficamente seguro permiten que las claves sean probadas rápidamente.

De acuerdo a las recomendaciones de OpenSSL para el uso de PBKDF2 en vez de [`EVP_BytesToKey`][], se recomienda que los desarrolladores deriven una clave y un IV por su cuenta usando [`crypto.pbkdf2()`][], y usar [`crypto.createDecipheriv()`][] para crear el objeto `Decipher`.

### crypto.createDecipheriv(algorithm, key, iv)

<!-- YAML
added: v0.1.94
-->

Crea y regresa un objeto `Decipher` que usa los `algorithm`, `key` y vector de inicialización (`iv`) dados.

El `algorithm` es dependiente de OpenSSL, ejemplos de estos son `'aes192'`, etc. En publicaciones recientes de OpenSSL, `openssl list-cipher-algorithms` mostrará los algoritmos de cifrado disponibles.

La `key` es la clave no procesada usada por el `algorithm`, e `iv` es un [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Ambos argumentos deben ser string codificadas en `'utf8'`, [Buffers][`Buffer`], `TypedArray`, o `DataView`s.

### crypto.createDiffieHellman(prime\[, prime_encoding\]\[, generator\][, generator_encoding])

<!-- YAML
added: v0.11.12
-->

Crea un objeto de intercambio de clave `DiffieHellman` usando el `prime` dado y un `generator` opcional específico.

El argumento `generator` puede ser un número, una string o un [`Buffer`][]. Si el `generator` no es especificado, entonces, el valor `2<0> no es usado.</p>

<p>Los argumentos <code>prime_encoding` y `generator_encoding` pueden ser `'latin1'`, `'hex'`, o `'base64'`.

Si se especifica el `prime_encoding`, `prime` será una string, sino se espera un [`Buffer`][].

Si se especifica `generator_encoding`, se espera que `generator` sea una string; de lo contrario, se espera que sea un número o un [`Buffer`][].

### crypto.createDiffieHellman(prime_length[, generator])

<!-- YAML
added: v0.5.0
-->

Crea un objeto de intercambio de clave `DiffieHellman` y genera un prime de `primeLength` bits, usando un `generator` numérico opcional específico. El valor `2<code> será usado si <0>generator` no es especificado.

### crypto.createECDH(curve_name)

<!-- YAML
added: v0.11.14
-->

Crea un objeto de intercambio de claves de Curva Elíptica Diffie-Hellman (`ECDH`) empleando una curva específica y predeterminada por el string `curve_name`. Usa [`crypto.getCurves()`][] para obtener una lista de los nombres de curvas disponibles. En versiones recientes de OpenSSL, `openssl ecparam -list_curves` también mostrará el nombre y la descripción de cada curva elíptica disponible.

### crypto.createHash(algorithm)

<!-- YAML
added: v0.1.92
-->

Crea y regresa un objeto `Hash` que puede ser usado para generar el resumen de hash usando el `algorithm` dado.

El `algorithm` es dependiente de los algoritmos disponibles respaldados por la versión de OpenSSL en la plataforma. Ejemplo de ellos son `'sha256'`, `'sha512'`, etc. En versiones recientes de OpenSSL, `openssl list-message-digest-algorithms` mostrará los resúmenes de algoritmos disponibles.

Eemplos: generando la suma sha256 de un archivo

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

### crypto.createHmac(algorithm, key)

<!-- YAML
added: v0.1.94
-->

Crea y regresa un objeto `Hmac` que usa el `algorithm` y la `key` dada.

El `algorithm` es dependiente de los algoritmos disponibles respaldados por la versión de OpenSSL en la plataforma. Ejemplo de ellos son `'sha256'`, `'sha512'`, etc. En versiones recientes de OpenSSL, `openssl list-message-digest-algorithms` mostrará los resúmenes de algoritmos disponibles.

El `key` es la clave HMAC empleada para generar el hash criptográico de HMAC.

Ejemplo: generando el HMAC sha256 de un archivo

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

### crypto.createSign(algoritmo)

<!-- YAML
added: v0.1.92
-->

Crea y regresa un objeto `Sign` que usa el `algorithm` dado. Usa [`crypto.getHashes()`][] para obtener una matríz de nombres de los algoritmos de firmas disponibles.

### crypto.createVerify(algoritmo)

<!-- YAML
added: v0.1.92
-->

Crea y regresa un objeto `Verify` que usa el algoritmo dado. Usa [`crypto.getHashes()`][] para obtener una matriz de nombres de los algoritmos de firmas disponibles.

### crypto.getCiphers()

<!-- YAML
added: v0.9.3
-->

Regresa una matriz con los nombres de los algoritmos cifrados respaldados.

Ejemplo:

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()

<!-- YAML
added: v2.3.0
-->

Regresa una matriz con los nombres de las curvas elípticas respaldadas.

Ejemplo:

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(group_name)

<!-- YAML
added: v0.7.5
-->

Crea un objeto de intercambio de clave predeterminada `DiffieHellman`. Los grupos respaldados son: `'modp1'`, `'modp2'`, `'modp5'` (determinado en [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), pero se ve [Caveats](#crypto_support_for_weak_or_compromised_algorithms)), y `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (definido en [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). El objeto regresado imita el interfaz de los objetos creados por [`crypto.createDiffieHellman()`][], pero no permitirpa cambios en las claves (con [`diffieHellman.setPublicKey()`][], por ejemplo). La ventaja de usar este método es que las partes no tienen que generar o intercambiar un grupo de módulos previamente, ahorrando tanto el tiempo de procesado como el de comunicación.

Ejemplo (obteniendo un secreto compartido):

```js
const crypto = require('crypto');
const alice = crypto.getDiffieHellman('modp14');
const bob = crypto.getDiffieHellman('modp14');

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

/* El Secreto de Alice y el de Bob deben ser iguales*/
console.log(aliceSecret === bobSecret);
```

### crypto.getHashes()

<!-- YAML
added: v0.9.3
-->

Devuelve una matríz de los nombres de los algoritmos de hash respaldados, tales como `RSA-SHA256`.

Ejemplo:

```js
const hashes = crypto.getHashes();
console.log(hashes); // ['DSA', 'DSA-SHA', 'DSA-SHA1', ...]
```

### crypto.pbkdf2(clave, salt, iteracioness, keylen, resumen, callback)

<!-- YAML
added: v0.5.5
-->

Proporciona implementación asincrónica de una clave de Derivación de Función 2 (PBKDF2) basada en contraseña. Un algoritmo resumido de HMAC seleccionado y especificado por el `digest` es aplicado para derivar una clave de la longitud de byte solicitado (`keylen`) desde `password`, `salt` e `iteraciones`.

La función de `callback` dada es llamada a través de dos argumentos: `err` y `derivdKey`. Se establecerá un `err` si un error ocurre, de lo contrario `err` sera nulo. La `derivedKey` exitosamente generada pasará como un [`Buffer`][].

El argumento de `iteraciones` debe ser un número establecido lo más alto posible. Entre más alto sea el número de iteraciones, más segura sera la llave derivada, y tomará un tiempo mayor de completarse.

El `salt` debe ser también tan único como sea posible. Se recomienda que los salts sean aleatorios y que sus longitudes sean de 16 bytes al menos. Vea [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) para más detalles.

Ejemplo:

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 512, 'sha512', (err, key) => {
  if (err) throw err;
  console.log(key.toString('hex'));  // '3745e48...aa39b34'
});
```

Una matríz de funciones de compilación respaldadas puede ser recuperada empleando [`crypto.getHashes()`][].

### crypto.pbkdf2Sync(clave, salt, iteraciones, keylen, resumen)

<!-- YAML
added: v0.9.3
-->

Provee una implementación asincrónica de la clave basada en contraseña de Derivación de Función 2 (PBKDF2). Un algoritmo resumido de HMAC seleccionado y especificado por el `digest` es aplicado para derivar una clave de la longitud de byte solicitado (`keylen`) desde `password`, `salt` e `iteraciones`.

Si ocurre un error, el mismo sera arrojado; sino, la clave derivada se regresará como un [`Buffer`][].

El argumento de `iteraciones` debe ser un número establecido lo más alto posible. Entre más alto sea el número de iteraciones, más segura sera la llave derivada, y tomará un tiempo mayor de completarse.

El `salt` debe ser también tan único como sea posible. Se recomienda que los salts sean aleatorios y que sus longitudes sean de 16 bytes al menos. Vea [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) para más detalles.

Ejemplo:

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 512, 'sha512');
console.log(key.toString('hex'));  // '3745e48...aa39b34'
```

Una matríz de funciones de compilación respaldadas puede ser recuperada empleando [`crypto.getHashes()`][].

### crypto.privateDecrypt(private_key, buffer)

<!-- YAML
added: v0.11.14
-->

Descifra un `buffer` con la `private_key`.

La `private_key` puede ser un objeto o una string. Si la `private_key` es una string, es tratada como una clave sin frase de contraseña y usará `RSA_PKCS1_OAEP_PADDING`. Pero, si la `private_key` es un objeto, se interpreta como un objeto hash con las claves:

* `clave`: {string} - Clave privada codificada PEM
* `passphrase`: {string} - Frase de contraseña opcional para la clave privada
* `padding` : Un valor de llenado opcional puede ser uno de los siguientes: 
  * `crypto.constants.RSA_NO_PADDING`
  * `crypto.constants.RSA_PKCS1_PADDING`
  * `crypto.constants.RSA_PKCS1_OAEP_PADDING`

Todos los paddings se definen en `crypto.constants`.

### crypto.timingSafeEqual(a, b)

<!-- YAML
added: v6.6.0
-->

Esta función se basa en un algoritmo de tiempo constante. Regresa verdadero si `a` es igual a `b`, sin perder información que permita a un atacante adivinar uno de los valores. Esto es adecuado para comparar los resumenes de HMAC o los valores secretis como cookies de autenticacion o [urls de habilidad](https://www.w3.org/TR/capability-urls/).

`a` y `b` deben ser ambas `Buffers` y tener la misma longitud.

**Nota**: El uso de `crypto.timingSafeEqual` no garantixa que el código *cercano* sea seguro momentáneamente. Debe tener cuidado al asegurarse que el código cercano no introduce vulnerabilidades de tiempo.

### crypto.privateEncrypt(clave_privada, buffer)

<!-- YAML
added: v1.1.0
-->

Encripta el `buffer` con la `clave_privada`.

La `private_key` puede ser un objeto o una string. Si la `clave_privada` es una string, sera tratada como una clave sin frase de contraseña y usará `RSA_PKCS1_PADDING`. Pero, si la `private_key` es un objeto, se interpreta como un objeto hash con las claves:

* `clave`: {string} - Clave privada codificada PEM
* `passphrase`: {string} - Frase de contraseña opcional para la clave privada
* `padding` : Un valor de llenado opcional puede ser uno de los siguientes: 
  * `crypto.constants.RSA_NO_PADDING`
  * `crypto.constants.RSA_PKCS1_PADDING`

Todos los paddings se definen en `crypto.constants`.

### crypto.publicDecrypt(clave_pública, buffer)

<!-- YAML
added: v1.1.0
-->

Desencripta el `buffer` con la `clave_pública`.

La `clave_pública` puede ser un objeto o una string. Si la `clave_pública` es una string, sera tratada como la clave sin frase de contraseña y usará `RSA_PKCS1_PADDING`. Pero, si la `clave_pública` es un objeto, entonces sera interpretada como un objeto hash con las claves:

* `clave`: {string} - Clave pública codificada PEM
* `passphrase`: {string} - Frase de contraseña opcional para la clave privada
* `padding` : Un valor de llenado opcional puede ser uno de los siguientes: 
  * `crypto.constants.RSA_NO_PADDING`
  * `crypto.constants.RSA_PKCS1_PADDING`
  * `crypto.constants.RSA_PKCS1_OAEP_PADDING`

Debido a qie las claves públicas RSA puede derivar de claves privadas y, una clave privada puede ser pasada en vez de una pública.

Todos los paddings se definen en `crypto.constants`.

### crypto.publicEncrypt(clave_pública, buffer)

<!-- YAML
added: v0.11.14
-->

Encripta al `buffer` con la `clave_pública`.

La `clave_pública` puede ser un objeto o una string. Si la `clave_pública` es una string, sera tratada como una clave si frase de contraseña y, usará `RSA_PKCS1_OAEP_PADDING`. Pero, si la `clave_pública` es un objeto, entonces sera interpretada como un objeto hash con las claves:

* `clave`: {string} - Clave pública codificada PEM
* `passphrase`: {string} - Frase de contraseña opcional para la clave privada
* `padding` : Un valor de llenado opcional puede ser uno de los siguientes: 
  * `crypto.constants.RSA_NO_PADDING`
  * `crypto.constants.RSA_PKCS1_PADDING`
  * `crypto.constants.RSA_PKCS1_OAEP_PADDING`

Debido a qie las claves públicas RSA puede derivar de claves privadas y, una clave privada puede ser pasada en vez de una pública.

Todos los paddings se definen en `crypto.constants`.

### crypto.randomBytes(tamaño[, callback])

<!-- YAML
added: v0.5.8
-->

Genera datos pseudoaleatorios criptográficamente fuertes. El argumento `tamaño` es un número que indica el número de bytes a generar.

Si una función `callback` es dada, los bytes son geberados asincrónicamente y, la función `callback` es invocada con dos argumentos: `err` y `buf`. Si un error ocurre, `err` sera un objeto de Error, de lo contrario sera nulo. El argumento `buf` es un [`Buffer`][] que contiene los bytes generados.

```js
// Asincrónico
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
```

Si la función `callback` no es dada, los bytes aleatorios son generados sincrónicamente y, devueltos como [`Buffer`][]. Un error sera arrojado si hay un problema al generar los bytes.

```js
// Sincrónico
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} bytes of random data: ${buf.toString('hex')}`);
```

The `crypto.randomBytes()` method will not complete until there is sufficient entropy available. This should normally never take longer than a few milliseconds. The only time when generating the random bytes may conceivably block for a longer period of time is right after boot, when the whole system is still low on entropy.

### crypto.randomFillSync(buffer\[, offset\]\[, size\])

<!-- YAML
added: v6.13.0
-->

* `buffer` {Buffer|Uint8Array} Must be supplied.
* `offset` {number} Defaults to `0`.
* `size` {number} Defaults to `buffer.length - offset`.

Synchronous version of [`crypto.randomFill()`][].

Returns `buffer`

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// The above is equivalent to the following:
crypto.randomFillSync(buf, 5, 5);
console.log(buf.toString('hex'));
```

### crypto.randomFill(buffer\[, offset\]\[, size\], callback)

<!-- YAML
added: v6.13.0
-->

* `buffer` {Buffer|Uint8Array} Must be supplied.
* `offset` {number} Defaults to `0`.
* `size` {number} Defaults to `buffer.length - offset`.
* `callback` {Function} `function(err, buf) {}`.

This function is similar to [`crypto.randomBytes()`][] but requires the first argument to be a [`Buffer`][] that will be filled. It also requires that a callback is passed in.

If the `callback` function is not provided, an error will be thrown.

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

// The above is equivalent to the following:
crypto.randomFill(buf, 5, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

### crypto.setEngine(engine[, flags])

<!-- YAML
added: v0.11.11
-->

Load and set the `engine` for some or all OpenSSL functions (selected by flags).

`engine` could be either an id or a path to the engine's shared library.

The optional `flags` argument uses `ENGINE_METHOD_ALL` by default. The `flags` is a bit field taking one of or a mix of the following flags (defined in `crypto.constants`):

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

## Notes

### Legacy Streams API (pre Node.js v0.10)

The Crypto module was added to Node.js before there was the concept of a unified Stream API, and before there were [`Buffer`][] objects for handling binary data. As such, the many of the `crypto` defined classes have methods not typically found on other Node.js classes that implement the [streams](stream.html) API (e.g. `update()`, `final()`, or `digest()`). Also, many methods accepted and returned `'latin1'` encoded strings by default rather than Buffers. This default was changed after Node.js v0.8 to use [`Buffer`][] objects by default instead.

### Recent ECDH Changes

Usage of `ECDH` with non-dynamically generated key pairs has been simplified. Now, [`ecdh.setPrivateKey()`][] can be called with a preselected private key and the associated public point (key) will be computed and stored in the object. This allows code to only store and provide the private part of the EC key pair. [`ecdh.setPrivateKey()`][] now also validates that the private key is valid for the selected curve.

The [`ecdh.setPublicKey()`][] method is now deprecated as its inclusion in the API is not useful. Either a previously stored private key should be set, which automatically generates the associated public key, or [`ecdh.generateKeys()`][] should be called. The main drawback of using [`ecdh.setPublicKey()`][] is that it can be used to put the ECDH key pair into an inconsistent state.

### Support for weak or compromised algorithms

The `crypto` module still supports some algorithms which are already compromised and are not currently recommended for use. The API also allows the use of ciphers and hashes with a small key size that are considered to be too weak for safe use.

Users should take full responsibility for selecting the crypto algorithm and key size according to their security requirements.

Based on the recommendations of [NIST SP 800-131A](http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

* MD5 and SHA-1 are no longer acceptable where collision resistance is required such as digital signatures.
* The key used with RSA, DSA and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
* The DH groups of `modp1`, `modp2` and `modp5` have a key size smaller than 2048 bits and are not recommended.

See the reference for other recommendations and details.

## Crypto Constants

The following constants exported by `crypto.constants` apply to various uses of the `crypto`, `tls`, and `https` modules and are generally specific to OpenSSL.

### OpenSSL Options

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Applies multiple bug workarounds within OpenSSL. See
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html for
    detail.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Allows legacy insecure renegotiation between OpenSSL and unpatched
    clients or servers. See
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Attempts to use the server's preferences instead of the client's when
    selecting a cipher. Behavior depends on protocol version. See
    https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CISCO_ANYCONNECT</code></td>
    <td>Instructs OpenSSL to use Cisco's "speshul" version of DTLS_BAD_VER.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_COOKIE_EXCHANGE</code></td>
    <td>Instructs OpenSSL to turn on cookie exchange.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CRYPTOPRO_TLSEXT_BUG</code></td>
    <td>Instructs OpenSSL to add server-hello extension from an early version
    of the cryptopro draft.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS</code></td>
    <td>Instructs OpenSSL to disable a SSL 3.0/TLS 1.0 vulnerability
    workaround added in OpenSSL 0.9.6d.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_EPHEMERAL_RSA</code></td>
    <td>Instructs OpenSSL to always use the tmp_rsa key when performing RSA
    operations.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_LEGACY_SERVER_CONNECT</code></td>
    <td>Allows initial connection to servers that do not support RI.</td>
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
    <td>Instructs OpenSSL to disable the workaround for a man-in-the-middle
    protocol-version vulnerability in the SSL 2.0 server implementation.</td>
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
    <td>Instructs OpenSSL to disable support for SSL/TLS compression.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_QUERY_MTU</code></td>
    <td></td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION</code></td>
    <td>Instructs OpenSSL to always start a new session when performing
    renegotiation.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv2</code></td>
    <td>Instructs OpenSSL to turn off SSL v2</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_SSLv3</code></td>
    <td>Instructs OpenSSL to turn off SSL v3</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TICKET</code></td>
    <td>Instructs OpenSSL to disable use of RFC4507bis tickets.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1</code></td>
    <td>Instructs OpenSSL to turn off TLS v1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_1</code></td>
    <td>Instructs OpenSSL to turn off TLS v1.1</td>
  </tr>
  <tr>
    <td><code>SSL_OP_NO_TLSv1_2</code></td>
    <td>Instructs OpenSSL to turn off TLS v1.2</td>
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
    <td>Instructs OpenSSL to always create a new key when using
    temporary/ephemeral DH parameters.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_SINGLE_ECDH_USE</code></td>
    <td>Instructs OpenSSL to always create a new key when using
    temporary/ephemeral ECDH parameters.</td>
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
    <td>Instructs OpenSSL to disable version rollback attack detection.</td>
  </tr>
</table>

### OpenSSL Engine Constants

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RSA</code></td>
    <td>Limit engine usage to RSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DSA</code></td>
    <td>Limit engine usage to DSA</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DH</code></td>
    <td>Limit engine usage to DH</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_RAND</code></td>
    <td>Limit engine usage to RAND</td>
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
    <td>Limit engine usage to CIPHERS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_DIGESTS</code></td>
    <td>Limit engine usage to DIGESTS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_STORE</code></td>
    <td>Limit engine usage to STORE</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_METHS</code></td>
    <td>Limit engine usage to PKEY_METHDS</td>
  </tr>
  <tr>
    <td><code>ENGINE_METHOD_PKEY_ASN1_METHS</code></td>
    <td>Limit engine usage to PKEY_ASN1_METHS</td>
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

### Other OpenSSL Constants

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
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
    <td>Sets the salt length for `RSA_PKCS1_PSS_PADDING` to the digest size
        when signing or verifying.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_MAX_SIGN</code></td>
    <td>Sets the salt length for `RSA_PKCS1_PSS_PADDING` to the maximum
        permissible value when signing data.</td>
  </tr>
  <tr>
    <td><code>RSA_PSS_SALTLEN_AUTO</code></td>
    <td>Causes the salt length for `RSA_PKCS1_PSS_PADDING` to be determined
        automatically when verifying a signature.</td>
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

### Node.js Crypto Constants

<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>defaultCoreCipherList</code></td>
    <td>Specifies the built-in default cipher list used by Node.js.</td>
  </tr>
  <tr>
    <td><code>defaultCipherList</code></td>
    <td>Specifies the active default cipher list used by the current Node.js
    process.</td>
  </tr>
</table>
