# Crypto

<!--introduced_in=v0.3.6-->

> Stabilité: 2 - stable

Le module `crypto` fournit des fonctionnalités cryptographiques incluant un jeu de wrappers pour les fonctions de hachage, de HMAC, de chiffrement, de déchiffrement, de signature et de vérification d'OpenSSL.

Utilisez `require('crypto')` pour accéder à ce module.

```js
const crypto = require('crypto');

const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
console.log(hash);
// Prints:
//   c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e
```

## Déterminer si le support de crypto est indisponible

Il est possible que Node.js soit construit sans le support du module `crypto`. Dans ce cas, l'appel à `require('crypto')` génèrera une erreur.

```js
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('crypto support is disabled!');
}
```

## Classe : Certificate
<!-- YAML
added: v0.11.8
-->

SPKAC est un mécanisme de requête de signature de certificat implémenté à l'origine par Netscape, qui a été spécifié formellement dans [HTML5's `keygen` element][].

Notez que `<keygen>` est obsolète depuis [HTML 5.2](https://www.w3.org/TR/html52/changes.html#features-removed) et les nouveaux projets ne devraient plus utiliser cet élément.

Le module `crypto` fournit la classe `Certificate` pour travailler avec les données de SPKAC. L'utilisation la plus courante est la gestion de la sortie générée par l'élément `<keygen>` de HTML5. Node.js uses [OpenSSL's SPKAC implementation](https://www.openssl.org/docs/man1.1.0/apps/openssl-spkac.html) internally.

### Certificate.exportChallenge(spkac)
<!-- YAML
added: v9.0.0
-->
* `spkac` {string | Buffer | TypedArray | DataView}
* Renvoie : {Buffer} Le composant challenge de la structure de données `spkac`, qui inclut une clé publique et un challenge.

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
* Renvoie : {Buffer} Le composant clé publique de la structure de données `spkac`, qui inclut une clé publique et un challenge.

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
* Renvoie : {boolean} `true` si la structure de données `spkac` est valide, `false` dans le cas contraire.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
console.log(Certificate.verifySpkac(Buffer.from(spkac)));
// Prints: true or false
```

### API obsolète

As a still supported legacy interface, it is possible (but not recommended) to create new instances of the `crypto.Certificate` class as illustrated in the examples below.

#### new crypto.Certificate()

Les instances de la classe `Certificate` peuvent être créées en utilisant le mot-clé `new` ou en appelant `crypto.Certificate()` comme une fonction :

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
* Renvoie : {Buffer} Le composant challenge de la structure de données `spkac`, qui inclut une clé publique et un challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Prints: the challenge as a UTF8 string
```

#### certificate.exportPublicKey(spkac)
<!-- YAML
added: v0.11.8
-->
* `spkac` {string | Buffer | TypedArray | DataView}
* Renvoie : {Buffer} Le composant clé publique de la structure de données `spkac`, qui inclut une clé publique et un challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Prints: the public key as <Buffer ...>
```

#### certificate.verifySpkac(spkac)
<!-- YAML
added: v0.11.8
-->
* `spkac` {Buffer | TypedArray | DataView}
* Renvoie : {boolean} `true` si la structure de données `spkac` est valide, `false` dans le cas contraire.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Prints: true or false
```

## Classe : Cipher
<!-- YAML
added: v0.1.94
-->

Les instances de la classe `Cipher` sont utilisées pour crypter des données. La classe peut être utilisée de deux manières :

- En tant que [flux](stream.html) à la fois lisible et accessible en écriture, où des données brutes non cryptées sont écrites pour produire des données cryptées côté lecture, ou bien
- En utilisant les méthodes [`cipher.update()`][] et [`cipher.final()`][] pour produire les données cryptées.

Les méthodes [`crypto.createCipher()`][] ou [`crypto.createCipheriv()`][] sont utilisées pour créer des instances de `Cipher`. Les objets `Cipher` ne doivent pas être créés directement avec le mot-clé `new`.

Exemple : Utilisation d'objets `Cipher` en tant que flux :

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

Exemple : Utiliser `Cipher` et les flux bidirectionnels :

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

Exemple : Utilisation des méthodes [`cipher.update()`][] et [`cipher.final()`][] :

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
* Renvoie : {Buffer | string} Tout contenu chiffré restant. If `outputEncoding` is specified, a string is returned. Si `outputEncoding` est omis, un [`Buffer`][] est renvoyé.

Une fois la méthode `cipher.final()` appelée, l'objet `Cipher` ne peut plus être utilisé pour crypter des données. Appeler `cipher.final()` plus d'une fois génèrera une erreur.

### cipher.setAAD(buffer[, options])
<!-- YAML
added: v1.0.0
-->
* `buffer` {Buffer}
* `options` {Object} [`stream.transform` options][]
  - `plaintextLength` {number}
* Renvoie : {Cipher} pour le chaînage de méthodes.

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.setAAD()` method sets the value used for the _additional authenticated data_ (AAD) input parameter.

The `options` argument is optional for `GCM` and `OCB`. When using `CCM`, the `plaintextLength` option must be specified and its value must match the length of the plaintext in bytes. See [CCM mode](#crypto_ccm_mode).

La méthode `cipher.setAAD()` doit être appelée avant [`cipher.update()`][].

### cipher.getAuthTag()
<!-- YAML
added: v1.0.0
-->
* Returns: {Buffer} When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `cipher.getAuthTag()` method returns a [`Buffer`][] containing the _authentication tag_ that has been computed from the given data.

La méthode `cipher.getAuthTag()` ne devrait être appelée qu'après la finalisation du cryptage par l'appel à la méthode [`cipher.final()`][].

### cipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
* `autoPadding` {boolean} **Par défaut :** `true`
* Renvoie : {Cipher} pour le chaînage de méthodes.

Lors de l'utilisation d'algorithmes de chiffrement par blocs, la classe `Cipher` ajoutera automatiquement du remplissage aux données d'entrée pour obtenir la taille de bloc appropriée. Pour désactiver le remplissage par défaut, appelez `cipher.setAutoPadding(false)`.

When `autoPadding` is `false`, the length of the entire input data must be a multiple of the cipher's block size or [`cipher.final()`][] will throw an error. Désactiver le remplissage automatique est utile pour des remplissages non-standard, par exemple utilisant `0x0` au lieu du remplissage PKCS.

La méthode `cipher.setAutoPadding()` doit être appelée avant [`cipher.final()`][].

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
* Renvoie : {Buffer | string}

Met à jour le chiffrement avec `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. Si l'argument `inputEncoding` est omis, `data` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`. Si `data` est un [`Buffer`][], un `TypedArray` ou un `DataView`, `inputEncoding` est ignoré.

The `outputEncoding` specifies the output format of the enciphered data. Si `outputEncoding` est spécifié, un chaîne utilisant cet encodage est renvoyée. Si `outputEncoding` est omis, un [`Buffer`][] est renvoyé.

La méthode `cipher.update()` peut être appelée plusieurs fois avec de nouvelles données jusqu'à l'appel de [`cipher.final()`][]. Appeler `cipher.update()` après [`cipher.final()`][] génèrera une erreur.

## Classe : Decipher
<!-- YAML
added: v0.1.94
-->

Les instances de la classe `Decipher` sont utilisées pour déchiffre des données. La classe peut être utilisée de deux manières :

- En tant que [flux](stream.html) à la fois lisible et accessible en écriture, où des données brutes cryptées sont écrites pour produire des données non cryptées côté lecture, ou bien
- En utilisant les méthodes [`decipher.update()`][] and [`decipher.final()`][] pour produire les données non cryptées.

Les méthodes [`crypto.createDecipher()`][] ou [`crypto.createDecipheriv()`][] sont utilisées pour créer des instances de `Decipher`. Les objets `Decipher` ne doivent pas être créés directement avec le mot-clé `new`.

Exemple : Utilisation d'objets `Decipher` en tant que flux :

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

Exemple : Utiliser `Decipher` et les flux bidirectionnels :

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

Exemple : Utilisation des méthodes [`decipher.update()`][] et [`decipher.final()`][] :

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
* Renvoie : {Buffer | string} Tout contenu déchiffré restant. If `outputEncoding` is specified, a string is returned. Si `outputEncoding` est omis, un [`Buffer`][] est renvoyé.

Une fois la méthode `decipher.final()` appelée, l'objet `Decipher` ne peut plus être utilisé pour décrypter des données. Appeler `decipher.final()` plus d'une fois génèrera une erreur.

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

La méthode `decipher.setAAD()` doit être appelée avant [`decipher.update()`][].

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

When using an authenticated encryption mode (`GCM`, `CCM` and `OCB` are currently supported), the `decipher.setAuthTag()` method is used to pass in the received _authentication tag_. Si aucun tag n'est fourni ou si le texte chiffré a été falsifié [`decipher.final()`][] sera lancé, isera lancé, indiquant que le texte chiffré devrait être rejeté en raison de l'échec de l'authentification.

Notez que cette version de Node.js ne vérifie pas la longueur du tag d'authentification GCM. Un tel contrôle *doit* doit être implémenté par les applications et est crucial pour l'authenticité des données cryptées, sinon une attaque peut utiliser un tag d'authentification arbitrairement court pour augmenter ses chances de passer l'authentification avec succès (jusqu'à 0.39%). It is highly recommended to associate one of the values 16, 15, 14, 13, 12, 8 or 4 bytes with each key, and to only permit authentication tags of that length, see [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

La méthode `decipher.setAuthTag()` doit être appelée avant [`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])
<!-- YAML
added: v0.7.1
-->
* `autoPadding` {boolean} **Par défaut :** `true`
* Returns: {Decipher} for method chaining.

Lorsque des données ont été cryptées sans remplissage de bloc standard, l'appel à `decipher.setAutoPadding(false)` désactivera le remplissage automatique pour empêcher [`decipher.final()`][] de rechercher et supprimer le remplissage.

Désactiver le remplissage automatique ne fonctionnera que si la longueur des données entrées est un multiple de la taille du bloc de chiffrement.

La méthode `decipher.setAutoPadding()` doit être appelée avant [`decipher.final()`][].

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
* Renvoie : {Buffer | string}

Met à jour decipher avec `data`. If the `inputEncoding` argument is given, the `data` argument is a string using the specified encoding. Si l'argument `inputEncoding` est omis, `data` doit être un [`Buffer`][]. Si `data` est un [`Buffer`][] alors `inputEncoding` est ignoré.

The `outputEncoding` specifies the output format of the enciphered data. Si `outputEncoding` est spécifié, un chaîne utilisant cet encodage est renvoyée. Si `outputEncoding` est omis, un [`Buffer`][] est renvoyé.

La méthode `decipher.update()` peut être appelée plusieurs fois avec de nouvelles données jusqu'à l'appel de [`decipher.final()`][]. Appeler `decipher.update()` après [`decipher.final()`][] génèrera une erreur.

## Classe : DiffieHellman
<!-- YAML
added: v0.5.0
-->

La classe `DiffieHellman` est un utilitaire permettant de créer des échanges de clés Diffie-Hellman.

Les instances de la classe `DiffieHellman` peuvent être créées en utilisant la fonction [`crypto.createDiffieHellman()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Generate Alice's keys...
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// Generate Bob's keys...
const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
const bobKey = bob.generateKeys();

// Exchange and generate the secret...
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
* Renvoie : {Buffer | string}

Calcule le secret partagé en utilisant `otherPublicKey` comme clé publique de l’autre partie et retourne le secret partagé calculé. La clé fournie est interprétée à l’aide de l'`inputEncoding` spécifié, et secret est encodé à l’aide de l'`outputEncoding` spécifié. Si `inputEncoding` est omis, `otherPublicKey` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`.

Si `outputEncoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

### diffieHellman.generateKeys([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Génère des valeurs de clés Diffie-Hellman privée et publique, et retourne la clé publique dans l'`encoding` spécifié. Cette clé devrait être transférée à l'autre partie. Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

### diffieHellman.getGenerator([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Returns the Diffie-Hellman generator in the specified `encoding`. Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

### diffieHellman.getPrime([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Returns the Diffie-Hellman prime in the specified `encoding`. Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

### diffieHellman.getPrivateKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Returns the Diffie-Hellman private key in the specified `encoding`. Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

### diffieHellman.getPublicKey([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.5.0
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Returns the Diffie-Hellman public key in the specified `encoding`. Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

### diffieHellman.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.5.0
-->
* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Définit la clé privée Diffie-Hellman. If the `encoding` argument is provided, `privateKey` is expected to be a string. Si `encoding` est omis, `privateKey` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.5.0
-->
* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Définit la clé publique Diffie-Hellman. If the `encoding` argument is provided, `publicKey` is expected to be a string. Si `encoding` est omis, `publicKey` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`.

### diffieHellman.verifyError
<!-- YAML
added: v0.11.12
-->

Un champ de bits contenant tous les avertissements et erreurs résultant d'un contrôle opéré lors de l'initialisation de l'objet `DiffieHellman`.

Les valeurs suivantes sont valides pour cette propriété (comme définies dans le module `constants`) :

* `DH_CHECK_P_NOT_SAFE_PRIME`
* `DH_CHECK_P_NOT_PRIME`
* `DH_UNABLE_TO_CHECK_GENERATOR`
* `DH_NOT_SUITABLE_GENERATOR`

## Classe : ECDH
<!-- YAML
added: v0.11.14
-->

La classe `ECDH` est un utilitaire pour créer des échanges de clés de Courbe Elliptique Diffie-Hellman (ECDH : Elliptic Curve Diffie-Hellman).

Les instances de la classe `ECDH` peuvent être créées en utilisant le fonction [`crypto.createECDH()`][].

```js
const crypto = require('crypto');
const assert = require('assert');

// Generate Alice's keys...
const alice = crypto.createECDH('secp521r1');
const aliceKey = alice.generateKeys();

// Generate Bob's keys...
const bob = crypto.createECDH('secp521r1');
const bobKey = bob.generateKeys();

// Exchange and generate the secret...
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
* Renvoie : {Buffer | string}

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
* Renvoie : {Buffer | string}

Calcule le secret partagé en utilisant `otherPublicKey` comme clé publique de l’autre partie et retourne le secret partagé calculé. La clé fournie est interprétée à l’aide de l'`inputEncoding` spécifié, et secret renvoyé est encodé à l’aide de l'`outputEncoding` spécifié. Si `inputEncoding` est omis, `otherPublicKey` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`.

Si `outputEncoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

`ecdh.computeSecret` will throw an `ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY` error when `otherPublicKey` lies outside of the elliptic curve. Since `otherPublicKey` is usually supplied from a remote user over an insecure network, its recommended for developers to handle this exception accordingly.

### ecdh.generateKeys([encoding[, format]])
<!-- YAML
added: v0.11.14
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* `format` {string} **Default:** `'uncompressed'`
* Renvoie : {Buffer | string}

Génère des valeurs de clés Diffie-Hellman privée et publique, et retourne la clé publique dans le `format` et l'`encoding` spécifiés. Cette clé devrait être transférée à l'autre partie.

L'argument `format` spécifie l'encodage du point et peut être `'compressed'` ou `'uncompressed'`. Si `format` est omis, le point sera renvoyé au format `'uncompressed'`.

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
* Renvoie : {Buffer | string} La clé publique de Courbe Elliptique Diffie-Hellman dans l'`encoding` et au `format` spécifiés.

L'argument `format` spécifie l'encodage du point et peut être `'compressed'` ou `'uncompressed'`. Si `format` est omis, le point sera renvoyé au format `'uncompressed'`.

If `encoding` is specified, a string is returned; otherwise a [`Buffer`][] is returned.

### ecdh.setPrivateKey(privateKey[, encoding])
<!-- YAML
added: v0.11.14
-->
* `privateKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `privateKey` string.

Définit la clé privée de Courbe Elliptique Diffie-Hellman. Si `encoding` est fourni, `privateKey` doit être une chaîne ; sinon `privateKey` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`.

Si `privateKey` n'est pas valide pour la courbe spécifiée quand l'objet `ECDH` a été créé, une erreur est générée. Upon setting the private key, the associated public point (key) is also generated and set in the `ECDH` object.

### ecdh.setPublicKey(publicKey[, encoding])
<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Stabilité : 0 - obsolète

* `publicKey` {string | Buffer | TypedArray | DataView}
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the `publicKey` string.

Définit la clé publique de Courbe Elliptique Diffie-Hellman. Si `encoding` est fourni, `publicKey` doit être une chaîne ; sinon `publicKey` doit être un [`Buffer`][], un `TypedArray` ou un `DataView`.

Notez qu'il n'y a normalement pas de raison d'appeler cette méthode, parce qu'`ECDH` ne requiert qu'une clé privée et la clé publique de l'autre partie pour calculer le secret partagé. Généralement [`ecdh.generateKeys()`][] ou [`ecdh.setPrivateKey()`][] seront appelés. La méthode [`ecdh.setPrivateKey()`][] essaie de générer le point/clé public associé à la clé privée étant définie.

Exemple (obtenir un secret partagé) :

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// This is a shortcut way of specifying one of Alice's previous private
// keys. It would be unwise to use such a predictable private key in a real
// application.
alice.setPrivateKey(
  crypto.createHash('sha256').update('alice', 'utf8').digest()
);

// Bob uses a newly generated cryptographically strong
// pseudorandom key pair
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

// aliceSecret and bobSecret should be the same shared secret value
console.log(aliceSecret === bobSecret);
```

## Classe : Hash
<!-- YAML
added: v0.1.92
-->

La classe `Hash` est un utilitaire pour créer des condensés de données de hachage. Elle peut être utilisée de deux manières :

- En tant que [flux](stream.html) à la fois lisible et accessible en écriture, où des données sont écrites pour produire un condensé de données de hachage côté lecture, ou bien
- En utilisant les méthodes [`hash.update()`][] et [`hash.digest()`][] pour produire le hachage.

La méthode [`crypto.createHash()`][] est utilisée pour créer les instances de `Hash`. Les objets `Hash` ne doivent pas être créés directement avec le mot-clé `new`.

Exemple : Utilisation d'objets `Hash` en tant que flux :

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

Exemple : Utiliser `Hash` et les flux bidirectionnels :

```js
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');

const input = fs.createReadStream('test.js');
input.pipe(hash).pipe(process.stdout);
```

Exemple : utilisation des méthodes [`hash.update()`][] et [`hash.digest()`][] :

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('some data to hash');
console.log(hash.digest('hex'));
// Prints:
//   6a2da20943931e9834fc12cfe5bb47bbd9ae43489a30726962b576f4e3993e50
```

### hash.digest([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.1.92
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Calcule le condensé de toutes les données passées pour le hachage (via la méthode [`hash.update()`][]). Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné.

L'objet `Hash` ne peut pas être à nouveau utilisé une fois la méthode `hash.digest()` appelée. Plusieurs appels génèreront une erreur.

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

Updates the hash content with the given `data`, the encoding of which is given in `inputEncoding`. Si `encoding` est omis, et`data` est une chaîne, un encodage `'utf8'` est appliqué. Si `data` est un [`Buffer`][], un `TypedArray` ou un `DataView`, `inputEncoding` est ignoré.

Elle peut être plusieurs fois avec de nouvelles données alors qu'elle est en flux.

## Classe : Hmac
<!-- YAML
added: v0.1.94
-->

La classe `Hmac` est un utilitaire pour la création de condensés cryptographiques HMAC. Elle peut être utilisée de deux manières :

- En tant que [flux](stream.html) à la fois lisible et accessible en écriture, où des données sont écrites pour produire un condensé HMAC côté lecture, ou bien
- En utilisant les méthodes [`hmac.update()`][] et [`hmac.digest()`][] pour produire le condensé HMAC.

La méthode [`crypto.createHmac()`][] est utilisée pour créer les instances de `Hash`. Les objets `Hmac` ne doivent pas être créés directement avec le mot-clé `new`.

Exemple : Utilisation d'objets `Hmac` en tant que flux :

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

Exemple : Utiliser `Hmac` et les flux bidirectionnels :

```js
const crypto = require('crypto');
const fs = require('fs');
const hmac = crypto.createHmac('sha256', 'a secret');

const input = fs.createReadStream('test.js');
input.pipe(hmac).pipe(process.stdout);
```

Exemple : utilisation des méthodes [`hmac.update()`][] et [`hmac.digest()`][] :

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.update('some data to hash');
console.log(hmac.digest('hex'));
// Prints:
//   7fd04df92f636fd450bc841c9418e5825c17f33ad9c87c518115a45971f7f77e
```

### hmac.digest([encoding](buffer.html#buffer_buffers_and_character_encodings))
<!-- YAML
added: v0.1.94
-->
* `encoding` {string} The [encoding](buffer.html#buffer_buffers_and_character_encodings) of the return value.
* Renvoie : {Buffer | string}

Calcule le condensé HMAC de toutes les données passées via [`hmac.update()`][]. Si `Encoding` est fourni un chaîne est retournée ; Sinon, un [`Buffer`][] est retourné;

L'objet `Hmac` ne peut pas être à nouveau utilisé une fois la méthode `hmac.digest()` appelée. Plusieurs appels à `hmac.digest()` génèreront une erreur.

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

Updates the `Hmac` content with the given `data`, the encoding of which is given in `inputEncoding`. Si `encoding` est omis, et`data` est une chaîne, un encodage `'utf8'` est appliqué. Si `data` est un [`Buffer`][], un `TypedArray` ou un `DataView`, `inputEncoding` est ignoré.

Elle peut être plusieurs fois avec de nouvelles données alors qu'elle est en flux.

## Classe : Sign
<!-- YAML
added: v0.1.92
-->

La classe `Sign` est un utilitaire pour générer des signatures. Elle peut être utilisée de deux manières :

- En tant que [stream](stream.html), où les données à signer sont écrites et la méthode [`sign.sign()`][] est utilisée pour générer et renvoyer la signature, ou bien
- En utilisant les méthodes [`sign.update()`][] et [`sign.sign()`][] pour produire la signature.

La méthode [`crypto.createSign()`][] est utilisée pour créer les instances de `Sign`. L’argument est le nom de chaîne de la fonction de hachage à utiliser. Les objets `Sign` ne doivent pas être créés directement avec le mot-clé `new`.

Exemple : Utilisation d'objets `Sign` en tant que flux :

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.write('some data to sign');
sign.end();

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Prints: the calculated signature using the specified private key and
// SHA-256. For RSA keys, the algorithm is RSASSA-PKCS1-v1_5 (see padding
// parameter below for RSASSA-PSS). For EC keys, the algorithm is ECDSA.
```

Exemple : utilisation des méthodes [`sign.update()`][] et [`sign.sign()`][] :

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Prints: the calculated signature
```

Dans certains cas, une instance de `Sign` peut aussi être créée en fournissant un nom de signature d’algorithme, tel que 'RSA-SHA256'. Ceci utilisera l'algorithme d'empreinte correspondant. Ça ne marche pas pour tous les algorithmes de signature, tels que 'ecdsa-with-SHA256'. Utilisez les noms abrégés à la place.

Exemple : Signer en utilisant un nom d’algorithme de signature legacy

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Prints: the calculated signature
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
* Renvoie : {Buffer | string}

Calcule la signature de toutes les données transmises en utilisant soit [`sign.update()`][], soit [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

L'argument `privateKey` peut être un objet ou une chaîne. Si `privateKey` est une chaîne, elle est traitée comme une clé brute sans phrase secrète. Si `privateKey` est un objet, il doit contenir au moins une des propriétés suivantes :

* `key`: {string} - clé privée encodée au format PEM (requise)
* `passphrase`: {string} - phrase secrète pour la clé privée
* `padding`: {integer} - valeur de remplissage optionnelle pour RSA, une des suivantes :
  * `crypto.constants.RSA_PKCS1_PADDING` (par défaut)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Notez que `RSA_PKCS1_PSS_PADDING` utilisera MGF1 avec la même fonction de hachage utilisée pour signer le message comme spécifié dans la section 3.1 de la [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - longueur du salage quand le remplissage est `RSA_PKCS1_PSS_PADDING`. La valeur spéciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` définit la longueur du salage égale à celle de l'empreinte, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (par défaut) la définit à la taille maximale permise.

If `outputEncoding` is provided a string is returned; otherwise a [`Buffer`][] is returned.

L'objet `Sign` ne peut pas être à nouveau utilisé une fois la méthode `sign.sign()` appelée. Plusieurs appels à `sign.sign()` génèreront une erreur.

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

Updates the `Sign` content with the given `data`, the encoding of which is given in `inputEncoding`. Si `encoding` est omis, et`data` est une chaîne, un encodage `'utf8'` est appliqué. Si `data` est un [`Buffer`][], un `TypedArray` ou un `DataView`, `inputEncoding` est ignoré.

Elle peut être plusieurs fois avec de nouvelles données alors qu'elle est en flux.

## Classe : Verify
<!-- YAML
added: v0.1.92
-->

La classe `Verify` est un utilitaire pour vérifier des signatures. Elle peut être utilisée de deux manières :

- En tant que [stream](stream.html), où les données écrites sont utilisées pour valider avec la signature fournie, ou bien
- En utilisant les méthodes [`verify.update()`][] et [`verify.verify()`][] pour vérifier la signature.

La méthode [`crypto.createVerify()`][] est utilisée pour créer les instances de `Verify`. Les objets `Verify` ne doivent pas être créés directement avec le mot-clé `new`.

Exemple : Utilisation d'objets `Sign` en tant que flux :

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.write('some data to sign');
verify.end();

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Prints: true or false
```

Exemple : utilisation des méthodes [`verify.update()`][] et [`verify.verify()`][] :

```js
const crypto = require('crypto');
const verify = crypto.createVerify('SHA256');

verify.update('some data to sign');

const publicKey = getPublicKeySomehow();
const signature = getSignatureToVerify();
console.log(verify.verify(publicKey, signature));
// Prints: true or false
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

Updates the `Verify` content with the given `data`, the encoding of which is given in `inputEncoding`. If `inputEncoding` is not provided, and the `data` is a string, an encoding of `'utf8'` is enforced. Si `data` est un [`Buffer`][], un `TypedArray` ou un `DataView`, `inputEncoding` est ignoré.

Elle peut être plusieurs fois avec de nouvelles données alors qu'elle est en flux.

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
* Renvoie : {boolean} `true` or `false` selon la validité de la signature pour les données et la clé publique.

Vérifie les données fournies en utilisant `object` et `signature`. L'argument `object` peut être soit un chaîne contenant un objet encodé au format PEM - pouvant être une clé publique RSA, une clé publique DSA ou un certificat X.509 - soit un objet avec au moins une des propriétés suivantes :

* `key`: {string} - clé publique encodée au format PEM (requis)
* `padding`: {integer} - valeur de remplissage optionnelle pour RSA, une des suivantes :
  * `crypto.constants.RSA_PKCS1_PADDING` (par défaut)
  * `crypto.constants.RSA_PKCS1_PSS_PADDING`

  Notez que `RSA_PKCS1_PSS_PADDING` utilisera MGF1 avec la même fonction de hachage utilisée pour vérifier le message comme spécifié dans la section 3.1 de la [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).
* `saltLength`: {integer} - longueur du salage quand le remplissage est `RSA_PKCS1_PSS_PADDING`. La valeur spéciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` définit la longueur du salage égale à celle de l'empreinte, `crypto.constants.RSA_PSS_SALTLEN_AUTO` (par défaut) la détermine automatiquement.

The `signature` argument is the previously calculated signature for the data, in the `signatureEncoding`. If a `signatureEncoding` is specified, the `signature` is expected to be a string; otherwise `signature` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

L'objet `verify` ne peut pas être à nouveau utilisé une fois la méthode `verify.verify()` appelée. Plusieurs appels à `verify.verify()` génèreront une erreur.

## Méthodes et propriétés du module `crypto`

### crypto.constants
<!-- YAML
added: v6.3.0
-->
* Renvoie : {Object} Un objet contenant les constants couramment utilisées pour la cryptographie et les opérations de sécurité liées. Les constantes spécifiques actuellement définies sont décrites dans [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING
<!-- YAML
added: v0.9.3
deprecated: v10.0.0
-->

> Stabilité : 0 - obsolète

L'encodage par défaut à utiliser pour les fonctions qui peuvent accepter des chaînes ou des [buffers][`Buffer`]. La valeur par défaut est `'buffer'`, qui donne par défaut aux méthodes des objets [`Buffer`][].

Le mécanisme `crypto.DEFAULT_ENCODING` est fourni pour rétro-compatibilité avec des programmes obsolètes qui attendent `'latin1'` comme encodage par défaut.

Les nouvelles applications devraient attendre `'buffer'` comme encodage par défaut.

This property is deprecated.

### crypto.fips
<!-- YAML
added: v6.0.0
deprecated: v10.0.0
-->

> Stabilité : 0 - obsolète

Property for checking and controlling whether a FIPS compliant crypto provider is currently in use. Définir à true requiert une version FIPS de Node.js.

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
* Renvoie : {Cipher}

Creates and returns a `Cipher` object that uses the given `algorithm` and `password`.

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

The `password` is used to derive the cipher key and initialization vector (IV). The value must be either a `'latin1'` encoded string, a [`Buffer`][], a `TypedArray`, or a `DataView`.

The implementation of `crypto.createCipher()` derives keys using the OpenSSL function [`EVP_BytesToKey`][] with the digest algorithm set to MD5, one iteration, and no salt. The lack of salt allows dictionary attacks as the same password always creates the same key. The low iteration count and non-cryptographically secure hash algorithm allow passwords to be tested very rapidly.

In line with OpenSSL's recommendation to use a more modern algorithm instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.scrypt()`][] and to use [`crypto.createCipheriv()`][] to create the `Cipher` object. Users should not use ciphers with counter mode (e.g. CTR, GCM, or CCM) in `crypto.createCipher()`. A warning is emitted when they are used in order to avoid the risk of IV reuse that causes vulnerabilities. For the case when IV is reused in GCM, see \[Nonce-Disrespecting Adversaries\]\[\] for details.

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
* Renvoie : {Cipher}

Creates and returns a `Cipher` object, with the given `algorithm`, `key` and initialization vector (`iv`).

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to set the length of the authentication tag that will be returned by `getAuthTag()` and defaults to 16 bytes.

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

The `key` is the raw key used by the `algorithm` and `iv` is an [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Both arguments must be `'utf8'` encoded strings, [Buffers][`Buffer`], `TypedArray`, or `DataView`s. If the cipher does not need an initialization vector, `iv` may be `null`.

Initialization vectors should be unpredictable and unique; ideally, they will be cryptographically random. They do not have to be secret: IVs are typically just added to ciphertext messages unencrypted. It may sound contradictory that something has to be unpredictable and unique, but does not have to be secret; it is important to remember that an attacker must not be able to predict ahead of time what a given IV will be.

### crypto.createCredentials(details)
<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Stabilité : 0 - obsolète : utilisez [`tls.createSecureContext()`][] à la place.

- `details` {Object} Identical to [`tls.createSecureContext()`][].
- Returns: {tls.SecureContext}

The `crypto.createCredentials()` method is a deprecated function for creating and returning a `tls.SecureContext`. It should not be used. Replace it with [`tls.createSecureContext()`][] which has the exact same arguments and return value.

Returns a `tls.SecureContext`, as-if [`tls.createSecureContext()`][] had been called.

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
* Renvoie : {Decipher}

Creates and returns a `Decipher` object that uses the given `algorithm` and `password` (key).

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

The implementation of `crypto.createDecipher()` derives keys using the OpenSSL function [`EVP_BytesToKey`][] with the digest algorithm set to MD5, one iteration, and no salt. The lack of salt allows dictionary attacks as the same password always creates the same key. The low iteration count and non-cryptographically secure hash algorithm allow passwords to be tested very rapidly.

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
* Renvoie : {Decipher}

Creates and returns a `Decipher` object that uses the given `algorithm`, `key` and initialization vector (`iv`).

The `options` argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode). In GCM mode, the `authTagLength` option is not required but can be used to restrict accepted authentication tags to those with the specified length.

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

The `key` is the raw key used by the `algorithm` and `iv` is an [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Both arguments must be `'utf8'` encoded strings, [Buffers][`Buffer`], `TypedArray`, or `DataView`s. If the cipher does not need an initialization vector, `iv` may be `null`.

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

Creates a `DiffieHellman` key exchange object using the supplied `prime` and an optional specific `generator`.

The `generator` argument can be a number, string, or [`Buffer`][]. If `generator` is not specified, the value `2` is used.

If `primeEncoding` is specified, `prime` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

If `generatorEncoding` is specified, `generator` is expected to be a string; otherwise a number, [`Buffer`][], `TypedArray`, or `DataView` is expected.

### crypto.createDiffieHellman(primeLength[, generator])
<!-- YAML
added: v0.5.0
-->
* `primeLength` {number}
* `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
* Returns: {DiffieHellman}

Creates a `DiffieHellman` key exchange object and generates a prime of `primeLength` bits using an optional specific numeric `generator`. If `generator` is not specified, the value `2` is used.

### crypto.createECDH(curveName)
<!-- YAML
added: v0.11.14
-->
* `curveName` {string}
* Returns: {ECDH}

Creates an Elliptic Curve Diffie-Hellman (`ECDH`) key exchange object using a predefined curve specified by the `curveName` string. Use [`crypto.getCurves()`][] to obtain a list of available curve names. On recent OpenSSL releases, `openssl ecparam -list_curves` will also display the name and description of each available elliptic curve.

### crypto.createHash(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.transform` options][]
* Renvoie : {Hash}

Creates and returns a `Hash` object that can be used to generate hash digests using the given `algorithm`. Optional `options` argument controls stream behavior.

The `algorithm` is dependent on the available algorithms supported by the version of OpenSSL on the platform. Examples are `'sha256'`, `'sha512'`, etc. On recent releases of OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` for older versions of OpenSSL) will display the available digest algorithms.

Example: generating the sha256 sum of a file

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
* Renvoie : {Hmac}

Creates and returns an `Hmac` object that uses the given `algorithm` and `key`. Optional `options` argument controls stream behavior.

The `algorithm` is dependent on the available algorithms supported by the version of OpenSSL on the platform. Examples are `'sha256'`, `'sha512'`, etc. On recent releases of OpenSSL, `openssl list -digest-algorithms` (`openssl list-message-digest-algorithms` for older versions of OpenSSL) will display the available digest algorithms.

The `key` is the HMAC key used to generate the cryptographic HMAC hash.

Example: generating the sha256 HMAC of a file

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
* Renvoie : {Sign}

Creates and returns a `Sign` object that uses the given `algorithm`. Use [`crypto.getHashes()`][] to obtain an array of names of the available signing algorithms. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.createVerify(algorithm[, options])
<!-- YAML
added: v0.1.92
-->
* `algorithm` {string}
* `options` {Object} [`stream.Writable` options][]
* Renvoie : {Verify}

Creates and returns a `Verify` object that uses the given algorithm. Use [`crypto.getHashes()`][] to obtain an array of names of the available signing algorithms. Optional `options` argument controls the `stream.Writable` behavior.

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
* Returns: {Object}
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

Creates a predefined `DiffieHellman` key exchange object. The supported groups are: `'modp1'`, `'modp2'`, `'modp5'` (defined in [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), but see [Caveats](#crypto_support_for_weak_or_compromised_algorithms)) and `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (defined in [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). The returned object mimics the interface of objects created by [`crypto.createDiffieHellman()`][], but will not allow changing the keys (with [`diffieHellman.setPublicKey()`][], for example). The advantage of using this method is that the parties do not have to generate nor exchange a group modulus beforehand, saving both processor and communication time.

Exemple (obtenir un secret partagé) :

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

Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. A selected HMAC digest algorithm specified by `digest` is applied to derive a key of the requested byte length (`keylen`) from the `password`, `salt` and `iterations`.

The supplied `callback` function is called with two arguments: `err` and `derivedKey`. If an error occurs while deriving the key, `err` will be set; otherwise `err` will be `null`. By default, the successfully generated `derivedKey` will be passed to the callback as a [`Buffer`][]. An error will be thrown if any of the input arguments specify invalid values or types.

If `digest` is `null`, `'sha1'` will be used. This behavior will be deprecated in a future version of Node.js.

The `iterations` argument must be a number set as high as possible. The higher the number of iterations, the more secure the derived key will be, but will take a longer amount of time to complete.

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

An array of supported digest functions can be retrieved using [`crypto.getHashes()`][].

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
* Renvoie : {Buffer}

Provides a synchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. A selected HMAC digest algorithm specified by `digest` is applied to derive a key of the requested byte length (`keylen`) from the `password`, `salt` and `iterations`.

If an error occurs an `Error` will be thrown, otherwise the derived key will be returned as a [`Buffer`][].

If `digest` is `null`, `'sha1'` will be used. This behavior will be deprecated in a future version of Node.js.

The `iterations` argument must be a number set as high as possible. The higher the number of iterations, the more secure the derived key will be, but will take a longer amount of time to complete.

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

An array of supported digest functions can be retrieved using [`crypto.getHashes()`][].

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

Because RSA public keys can be derived from private keys, a private key may be passed instead of a public key.

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

Because RSA public keys can be derived from private keys, a private key may be passed instead of a public key.

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

Generates cryptographically strong pseudo-random data. The `size` argument is a number indicating the number of bytes to generate.

If a `callback` function is provided, the bytes are generated asynchronously and the `callback` function is invoked with two arguments: `err` and `buf`. If an error occurs, `err` will be an `Error` object; otherwise it is `null`. The `buf` argument is a [`Buffer`][] containing the generated bytes.

```js
// Asynchronous
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
```

If the `callback` function is not provided, the random bytes are generated synchronously and returned as a [`Buffer`][]. An error will be thrown if there is a problem generating the bytes.

```js
// Synchronous
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} bytes of random data: ${buf.toString('hex')}`);
```

The `crypto.randomBytes()` method will not complete until there is sufficient entropy available. This should normally never take longer than a few milliseconds. The only time when generating the random bytes may conceivably block for a longer period of time is right after boot, when the whole system is still low on entropy.

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

Synchronous version of [`crypto.randomFill()`][].

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// The above is equivalent to the following:
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
* Renvoie : {Buffer}

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

Load and set the `engine` for some or all OpenSSL functions (selected by flags).

`engine` could be either an id or a path to the engine's shared library.

The optional `flags` argument uses `ENGINE_METHOD_ALL` by default. The `flags` is a bit field taking one of or a mix of the following flags (defined in `crypto.constants`):

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
* Returns: {boolean}

This function is based on a constant-time algorithm. Returns true if `a` is equal to `b`, without leaking timing information that would allow an attacker to guess one of the values. This is suitable for comparing HMAC digests or secret values like authentication cookies or [capability urls](https://www.w3.org/TR/capability-urls/).

`a` and `b` must both be `Buffer`s, `TypedArray`s, or `DataView`s, and they must have the same length.

Use of `crypto.timingSafeEqual` does not guarantee that the *surrounding* code is timing-safe. Care should be taken to ensure that the surrounding code does not introduce timing vulnerabilities.

## Notes

### Legacy Streams API (pre Node.js v0.10)

The Crypto module was added to Node.js before there was the concept of a unified Stream API, and before there were [`Buffer`][] objects for handling binary data. As such, the many of the `crypto` defined classes have methods not typically found on other Node.js classes that implement the [streams](stream.html) API (e.g. `update()`, `final()`, or `digest()`). Also, many methods accepted and returned `'latin1'` encoded strings by default rather than `Buffer`s. This default was changed after Node.js v0.8 to use [`Buffer`][] objects by default instead.

### Recent ECDH Changes

Usage of `ECDH` with non-dynamically generated key pairs has been simplified. Now, [`ecdh.setPrivateKey()`][] can be called with a preselected private key and the associated public point (key) will be computed and stored in the object. This allows code to only store and provide the private part of the EC key pair. [`ecdh.setPrivateKey()`][] now also validates that the private key is valid for the selected curve.

The [`ecdh.setPublicKey()`][] method is now deprecated as its inclusion in the API is not useful. Either a previously stored private key should be set, which automatically generates the associated public key, or [`ecdh.generateKeys()`][] should be called. The main drawback of using [`ecdh.setPublicKey()`][] is that it can be used to put the ECDH key pair into an inconsistent state.

### Support for weak or compromised algorithms

The `crypto` module still supports some algorithms which are already compromised and are not currently recommended for use. The API also allows the use of ciphers and hashes with a small key size that are considered to be too weak for safe use.

Users should take full responsibility for selecting the crypto algorithm and key size according to their security requirements.

Based on the recommendations of [NIST SP 800-131A](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

- MD5 and SHA-1 are no longer acceptable where collision resistance is required such as digital signatures.
- The key used with RSA, DSA, and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
- The DH groups of `modp1`, `modp2` and `modp5` have a key size smaller than 2048 bits and are not recommended.

See the reference for other recommendations and details.

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

## Crypto Constants

The following constants exported by `crypto.constants` apply to various uses of the `crypto`, `tls`, and `https` modules and are generally specific to OpenSSL.

### OpenSSL Options
<!--lint disable maximum-line-length-->
<table>
  <tr>
    <th>Constant</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>SSL_OP_ALL</code></td>
    <td>Applies multiple bug workarounds within OpenSSL. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>
    for detail.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION</code></td>
    <td>Allows legacy insecure renegotiation between OpenSSL and unpatched
    clients or servers. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
  </tr>
  <tr>
    <td><code>SSL_OP_CIPHER_SERVER_PREFERENCE</code></td>
    <td>Attempts to use the server's preferences instead of the client's when
    selecting a cipher. Behavior depends on protocol version. See
    <a href="https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html">https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html</a>.</td>
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
<!--lint enable maximum-line-length remark-lint-->

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
    <td><code>ENGINE_METHOD_EC</code></td>
    <td>Limit engine usage to EC</td>
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

