# Crypto

<!--introduced_in=v0.3.6-->

> Stabilità: 2 - Stabile

Il modulo `crypto` fornisce una funzionalità crittografica che include un set di wrapper per le funzioni OpenSSL di hash, HMAC, cipher, decipher, sign e verify.

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

## Class: Certificate

<!-- YAML
added: v0.11.8
-->

SPKAC è un meccanismo di Certificate Signing Request (CSR) originariamente implementato da Netscape ed è stato specificato formalmente come parte del [HTML5's `keygen` element][].

Da notare che `<keygen>` è obsoleto/deprecato poiché [HTML 5.2](https://www.w3.org/TR/html52/changes.html#features-removed) e i nuovi progetti non dovrebbero più utilizzare questo elemento.

Il modulo `crypto` fornisce la classe `Certificate` per lavorare con i dati SPKAC. L'utilizzo più comune è la gestione dell'output generato dall'elemento HTML5 `<keygen>`. Node.js utilizza [l'implementazione SPKAC di OpenSSL](https://www.openssl.org/docs/man1.1.0/apps/openssl-spkac.html) internamente.

### Certificate.exportChallenge(spkac)

<!-- YAML
added: v9.0.0
-->

- `spkac` {string | Buffer | TypedArray | DataView}
- Restituisce: {Buffer} La componente challenge della struttura dati di `spkac`, che include una public key ed una challenge.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const challenge = Certificate.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Stampa: la challenge come una stringa UTF8
```

### Certificate.exportPublicKey(spkac[, encoding])

<!-- YAML
added: v9.0.0
-->

- `spkac` {string | Buffer | TypedArray | DataView}
- `encoding` {string}
- Restituisce: {Buffer} La componente public key della struttura dati di `spkac`, che include una public key ed una challenge.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const publicKey = Certificate.exportPublicKey(spkac);
console.log(publicKey);
// Stampa: la public key come un <Buffer ...>
```

### Certificate.verifySpkac(spkac)

<!-- YAML
added: v9.0.0
-->

- `spkac` {Buffer | TypedArray | DataView}
- Restituisce: {boolean} `true` se la struttura dati di `spkac` fornita è valida, in caso contrario `false`.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
console.log(Certificate.verifySpkac(Buffer.from(spkac)));
// Stampa: true oppure false
```

### Legacy API

Come un'interfaccia legacy ancora supportata, è possibile (ma non consigliato) creare nuove istanze della classe `crypto.Certificate` come mostrato nei seguenti esempi.

#### new crypto.Certificate()

Le istanze della classe `Certificate` possono essere create utilizzando la parola chiave `new` o chiamando `crypto.Certificate()` come funzione:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

#### certificate.exportChallenge(spkac)

<!-- YAML
added: v0.11.8
-->

- `spkac` {string | Buffer | TypedArray | DataView}
- Restituisce: {Buffer} La componente challenge della struttura dati di `spkac`, che include una public key ed una challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Stampa: la challenge come una stringa UTF8
```

#### certificate.exportPublicKey(spkac)

<!-- YAML
added: v0.11.8
-->

- `spkac` {string | Buffer | TypedArray | DataView}
- Restituisce: {Buffer} La componente public key della struttura dati di `spkac`, che include una public key ed una challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Stampa: la public key come un <Buffer ...>
```

#### certificate.verifySpkac(spkac)

<!-- YAML
added: v0.11.8
-->

- `spkac` {Buffer | TypedArray | DataView}
- Restituisce: {boolean} `true` se la struttura dati di `spkac` fornita è valida, in caso contrario `false`.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Stampa: true oppure false
```

## Class: Cipher

<!-- YAML
added: v0.1.94
-->

Le istanze della classe `Cipher` vengono utilizzate per crittografare i dati. La classe può essere utilizzata in due modi:

- Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing semplici dati non criptati per produrre i dati criptati sul lato readable, oppure
- Utilizzando i metodi [`cipher.update()`][] e [`cipher.final()`][] per produrre i dati criptati.

I metodi [`crypto.createCipher()`][] o [`crypto.createCipheriv()`][] vengono usati per creare istanze `Cipher`. Gli `Cipher` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Cipher` object come degli stream:

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
  // Stampa: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
});

cipher.write('some clear text data');
cipher.end();
```

Esempio: Utilizzando `Cipher` e i piped stream:

```js
const crypto = require('crypto');
const fs = require('fs');
const cipher = crypto.createCipher('aes192', 'a password');

const input = fs.createReadStream('test.js');
const output = fs.createWriteStream('test.enc');

input.pipe(cipher).pipe(output);
```

Esempio: Utilizzando i metodi [`cipher.update()`][] e [`cipher.final()`][]:

```js
const crypto = require('crypto');
const cipher = crypto.createCipher('aes192', 'a password');

let encrypted = cipher.update('some clear text data', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// Stampa: ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504
```

### cipher.final([outputEncoding])

<!-- YAML
added: v0.1.94
-->

- `outputEncoding` {string}
- Restituisce: {Buffer | string} Qualsiasi contenuto cifrato restante. Se l'`outputEncoding` è `'latin1'`, `'base64'` o `'hex'`, viene restituita una stringa. Se non viene fornito nessun `outputEncoding`, viene restituito un [`Buffer`][].

Una volta chiamato il metodo `cipher.final()`, il `Cipher` object non può più essere utilizzato per cifrare i dati. I tentativi di chiamare `cipher.final()` più di una volta genereranno un errore.

### cipher.setAAD(buffer[, options])

<!-- YAML
added: v1.0.0
-->

- `buffer` {Buffer}
- `options` {Object}
- Restituisce: {Cipher} per il method chaining.

Quando si utilizza una modalità di crittografia autenticata (attualmente sono supportate solo la `GCM` e la `CCM`), il metodo `cipher.setAAD()` imposta il valore utilizzato per il parametro input *additional authenticated data* (AAD).

L'argomento `options` è facoltativo per la `GCM`. Quando si utilizza la `CCM`, deve essere specificata l'opzione `plaintextLength` e il suo valore deve corrispondere alla lunghezza del testo normale in byte. Vedi [Modalità CCM](#crypto_ccm_mode).

Il metodo `cipher.setAAD()` dev'essere chiamato prima di [`cipher.update()`][].

### cipher.getAuthTag()

<!-- YAML
added: v1.0.0
-->

- Restituisce: {Buffer} Quando si utilizza una modalità di crittografia autenticata (attualmente sono supportate solo la `GCM` e la `CCM`), il metodo `cipher.getAuthTag()` restituisce un [`Buffer`][] contenente l'*authentication tag* che è stato calcolato dai dati forniti.

Il metodo `cipher.getAuthTag()` dev'essere chiamato solo dopo aver completato la crittografia utilizzando il metodo [`cipher.final()`][].

### cipher.setAutoPadding([autoPadding])

<!-- YAML
added: v0.7.1
-->

- `autoPadding` {boolean} **Default:** `true`
- Restituisce: {Cipher} per il method chaining.

Quando si utilizzano algoritmi di cifratura a blocchi, la classe `Cipher` eseguirà automaticamente il padding (riempimento) dei dati d'input fino a raggiungere la block size appropriata. Per disattivare il padding predefinito chiamare `cipher.setAutoPadding(false)`.

Quando `autoPadding` è `false`, la lunghezza di tutti i dati d'input dev'essere un multiplo della block size del cipher altrimenti [`cipher.final()`][] genererà un errore. La disattivazione del padding automatico è utile per il padding non standard, ad esempio utilizzando `0x0` al posto del padding PKCS.

Il metodo `cipher.setAutoPadding()` dev'essere chiamato prima di [`cipher.final()`][].

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
- Restituisce: {Buffer | string}

Aggiorna il cipher con `data`. Se viene specificato l'argomento `inputEncoding`, il suo valore dev'essere `'utf8'`, `'ascii'`, oppure `'latin1'` e l'argomento `data` è una stringa che utilizza l'encoding specificato. Se l'argomento `inputEncoding` non è specificato, `data` dev'essere un [`Buffer`][], un `TypedArray`, oppure un `DataView`. Se `data` è un [`Buffer`][], un `TypedArray`, oppure un `DataView`, allora `inputEncoding` viene ignorato.

L'`outputEncoding` specifica il formato di output dei dati cifrati e può essere `'latin1'`, `'base64'` o `'hex'`. Se l'`outputEncoding` è specificato, viene restituita una stringa che utilizza l'encoding specificato. Se non viene fornito nessun `outputEncoding`, viene restituito un [`Buffer`][].

Il metodo `cipher.update()` può essere chiamato più volte con i nuovi dati finché non viene chiamato [`cipher.final()`][]. Chiamare `cipher.update()` dopo [`cipher.final()`][] genererà un errore.

## Class: Decipher

<!-- YAML
added: v0.1.94
-->

Le istanze della classe `Decipher` vengono utilizzate per decrittografare i dati. La classe può essere utilizzata in due modi:

- Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing semplici dati criptati per produrre i dati non criptati sul lato readable, oppure
- Utilizzando i metodi [`decipher.update()`][] e [`decipher.final()`][] per produrre i dati non criptati.

I metodi [`crypto.createDecipher()`][] o [`crypto.createDecipheriv()`][] sono usati per creare istanze `Decipher`. Gli `Decipher` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Decipher` object come degli stream:

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
  // Stampa: alcuni dati di testo chiari
});

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
decipher.write(encrypted, 'hex');
decipher.end();
```

Esempio: Utilizzando `Decipher` e i piped stream:

```js
const crypto = require('crypto');
const fs = require('fs');
const decipher = crypto.createDecipher('aes192', 'a password');

const input = fs.createReadStream('test.enc');
const output = fs.createWriteStream('test.js');

input.pipe(decipher).pipe(output);
```

Esempio: Utilizzando i metodi [`decipher.update()`][] e [`decipher.final()`][]:

```js
const crypto = require('crypto');
const decipher = crypto.createDecipher('aes192', 'a password');

const encrypted =
    'ca981be48e90867604588e75d04feabb63cc007a8f8ad89b10616ed84d815504';
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
// Stampa: alcuni dati di testo chiari
```

### decipher.final([outputEncoding])

<!-- YAML
added: v0.1.94
-->

- `outputEncoding` {string}
- Restituisce: {Buffer | string} Qualsiasi contenuto decifrato restante. Se l'`outputEncoding` è `'latin1'`, `'ascii'` o `'utf8'`, viene restituita una stringa. Se non viene fornito nessun `outputEncoding`, viene restituito un [`Buffer`][].

Una volta chiamato il metodo `decipher.final()`, il `Decipher` object non può più essere utilizzato per decifrare i dati. I tentativi di chiamare `decipher.final()` più di una volta genereranno un errore.

### decipher.setAAD(buffer)

<!-- YAML
added: v1.0.0
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->

- `buffer` {Buffer | TypedArray | DataView}
- Restituisce: {Cipher} per il method chaining.

Quando si utilizza una modalità di crittografia autenticata (attualmente sono supportate solo la `GCM` e la `CCM`), il metodo `decipher.setAAD()` imposta il valore utilizzato per il parametro input *additional authenticated data* (AAD).

Il metodo `decipher.setAAD()` dev'essere chiamato prima di [`decipher.update()`][].

### decipher.setAuthTag(buffer)

<!-- YAML
added: v1.0.0
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9398
    description: This method now returns a reference to `decipher`.
-->

- `buffer` {Buffer | TypedArray | DataView}
- Restituisce: {Cipher} per il method chaining.

Quando si utilizza una modalità di crittografia autenticata (attualmente sono supportare solo la `GCM` e la `CCM`), il metodo `decipher.setAuthTag()` viene utilizzato per passare l'*authentication tag* ricevuto. Se non viene fornito alcun tag, o se il testo cifrato è stato manomesso, verrà eseguito [`decipher.final()`][], indicando che il testo cifrato dovrebbe essere scartato a causa dell'autenticazione fallita.

Da notare che questa versione di Node.js non verifica la lunghezza degli authentication tag GCM. Tale controllo *deve* essere implementato dalle applicazioni ed è fondamentale per l'autenticità dei dati cifrati, altrimenti un utente malintenzionato potrebbe utilizzare un authentication tag arbitrariamente breve per aumentare le possibilità di passare l'autenticazione con successo (fino allo 0,39%). E' altamente consigliato di associare uno dei valori 16, 15, 14, 13, 12, 8 o 4 byte a ciascuna key e di accettare solo gli authentication tag di tale lunghezza, vedi [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

Il metodo `decipher.setAuthTag()` dev'essere chiamato prima di [`decipher.final()`][].

### decipher.setAutoPadding([autoPadding])

<!-- YAML
added: v0.7.1
-->

- `autoPadding` {boolean} **Default:** `true`
- Restituisce: {Cipher} per il method chaining.

Quando i dati sono stati cifrati senza il padding standard del blocco, la chiamata a `decipher.setAutoPadding(false)` disabiliterà il padding automatico in modo da impedire a [`decipher.final()`][] di cercare e rimuovere il padding.

La disattivazione del padding automatico sarà possibile solo se la lunghezza dei dati d'input è un multiplo della block size dei cipher.

Il metodo `decipher.setAutoPadding()` dev'essere chiamato prima di [`decipher.final()`][].

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
- Restituisce: {Buffer | string}

Aggiorna il decipher con `data`. Se viene specificato l'argomento `inputEncoding`, il suo valore dev'essere `'latin1'`, `'base64'` oppure `'hex'` e l'argomento `data` è una stringa che utilizza l'encoding specificato. Se non viene specificato l'argomento `inputEncoding`, `data` dev'essere un [`Buffer`][]. Se `data` è un [`Buffer`][] allora `inputEncoding` viene ignorato.

L'`outputEncoding` specifica il formato di output dei dati decifrati e può essere `'latin1'`, `'ascii'` o `'utf8'`. Se l'`outputEncoding` è specificato, viene restituita una stringa che utilizza l'encoding specificato. Se non viene fornito nessun `outputEncoding`, viene restituito un [`Buffer`][].

Il metodo `decipher.update()` può essere chiamato più volte con i nuovi dati finché non viene chiamato [`decipher.final()`][]. Chiamare `decipher.update()` dopo [`decipher.final()`][] genererà un errore.

## Class: DiffieHellman

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

### diffieHellman.computeSecret(otherPublicKey\[, inputEncoding\]\[, outputEncoding\])

<!-- YAML
added: v0.5.0
-->

- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Restituisce: {Buffer | string}

Calcola la chiave segreta condivisa utilizzando `otherPublicKey` come la public key (chiave pubblica) dell'altra parte e restituisce la chiave segreta condivisa calcolata. La chiave fornita viene interpretata utilizzando l'`inputEncoding` specificato, e la chiave segreta viene codificata utilizzando l'`outputEncoding` specificato. L'encoding può essere `'latin1'`, `'hex'` o `'base64'`. Se non viene fornito l'`inputEncoding`, `otherPublicKey` dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

Se viene fornito l'`outputEncoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### diffieHellman.generateKeys([encoding])

<!-- YAML
added: v0.5.0
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Genera valori di chiave Diffie-Hellman privata e pubblica, e restituisce la chiave pubblica nell'`encoding` specificato. Questa chiave dovrebbe essere trasferita all'altra parte. L'encoding può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### diffieHellman.getGenerator([encoding])

<!-- YAML
added: v0.5.0
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Restituisce il generatore Diffie-Hellman nell'`encoding` specificato, che può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### diffieHellman.getPrime([encoding])

<!-- YAML
added: v0.5.0
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Restituisce il Diffie-Hellman prime (numero primo) nell'`encoding` specificato, che può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### diffieHellman.getPrivateKey([encoding])

<!-- YAML
added: v0.5.0
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Restituisce la Diffie-Hellman private key (chiave privata) nell'`encoding` specificato, che può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### diffieHellman.getPublicKey([encoding])

<!-- YAML
added: v0.5.0
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Restituisce la chiave pubblica Diffie-Hellman nell'`encoding` specificato, che può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### diffieHellman.setPrivateKey(privateKey[, encoding])

<!-- YAML
added: v0.5.0
-->

- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Imposta la chiave privata Diffie-Hellman. Se viene fornito l'argomento `encoding` ed è `'latin1'`, `'hex'` o `'base64'`, `privateKey` dovrebbe essere una stringa. Se non viene fornito nessun `encoding`, `privateKey` dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

### diffieHellman.setPublicKey(publicKey[, encoding])

<!-- YAML
added: v0.5.0
-->

- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Imposta la chiave pubblica Diffie-Hellman. Se viene fornito l'argomento `encoding` ed è `'latin1'`, `'hex'` o `'base64'`, `publicKey` dovrebbe essere una stringa. Se non viene fornito nessun `encoding`, `publicKey` dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

### diffieHellman.verifyError

<!-- YAML
added: v0.11.12
-->

Un campo di bit contenente eventuali avvisi e/o errori risultanti da un controllo eseguito durante l'inizializzazione del `DiffieHellman` object.

I seguenti valori sono validi per questa proprietà (come definita nel modulo `constants`):

- `DH_CHECK_P_NOT_SAFE_PRIME`
- `DH_CHECK_P_NOT_PRIME`
- `DH_UNABLE_TO_CHECK_GENERATOR`
- `DH_NOT_SUITABLE_GENERATOR`

## Class: ECDH

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

### ECDH.convertKey(key, curve[, inputEncoding[, outputEncoding[, format]]])

<!-- YAML
added: v10.0.0
-->

- `key` {string | Buffer | TypedArray | DataView}
- `curve` {string}
- `inputEncoding` {string}
- `outputEncoding` {string}
- `format` {string} **Default:** `'uncompressed'`
- Restituisce: {Buffer | string}

Converte la chiave pubblica EC Diffie-Hellman specificata tramite `key` e `curve` nel formato specificato da `format`. L'argomento `format` specifica l'encoding del punto e può essere `'compressed'`, `'uncompressed'` oppure `'hybrid'`. La chiave fornita viene interpretata utilizzando l'`inputEncoding` specificato e la chiave restituita viene codificata utilizzando l'`outputEncoding` specificato. Gli encoding possono essere `'latin1'`, `'hex'` o `'base64'`.

Utilizza [`crypto.getCurves()`][] per ottenere un elenco di nomi di curve disponibili. Nelle versioni OpenSSL recenti, `openssl ecparam -list_curves` mostrerà anche il nome e la descrizione di ciascuna curva ellittica disponibile.

Se non viene specificato `format`, il punto verrà restituito nel formato `'uncompressed'`.

Se non viene fornito l'`inputEncoding`, `key` dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

Esempio (decompressione di una chiave):

```js
const { ECDH } = require('crypto');

const ecdh = ECDH('secp256k1');
ecdh.generateKeys();

const compressedKey = ecdh.getPublicKey('hex', 'compressed');

const uncompressedKey = ECDH.convertKey(compressedKey,
                                        'secp256k1',
                                        'hex',
                                        'hex',
                                        'uncompressed');

// la chiave convertita e la chiave pubblica non compressa devono essere uguali
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

- `otherPublicKey` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}
- `outputEncoding` {string}
- Restituisce: {Buffer | string}

Calcola la chiave segreta condivisa utilizzando `otherPublicKey` come chiave pubblica dell'altra parte e restituisce la chiave segreta condivisa calcolata. La chiave fornita viene interpretata utilizzando l'`inputEncoding` specificato e la chiave segreta viene codificata utilizzando l'`outputEncoding` specificato. Gli encoding possono essere `'latin1'`, `'hex'` o `'base64'`. Se non viene fornito l'`inputEncoding`, `otherPublicKey` dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

Se viene fornito l'`outputEncoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

`ecdh.computeSecret` genererà un errore `ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY` quando `otherPublicKey` si trova al di fuori della curva ellittica. Poiché `otherPublicKey` viene solitamente fornita da un utente remoto su una rete non sicura, di conseguenza gli sviluppatori sono invitati a gestire quest'eccezione.

### ecdh.generateKeys([encoding[, format]])

<!-- YAML
added: v0.11.14
-->

- `encoding` {string}
- `format` {string} **Default:** `'uncompressed'`
- Restituisce: {Buffer | string}

Genera valori di chiave EC Diffie-Hellman privata e pubblica, e restituisce la chiave pubblica nel `format` e nell'`encoding` specificati. Questa chiave dovrebbe essere trasferita all'altra parte.

L'argomento `format` specifica l'encoding del punto e può essere `'compressed'` oppure `'uncompressed'`. Se non viene specificato `format`, il punto verrà restituito nel formato `'uncompressed'`.

L'argomento `encoding` può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### ecdh.getPrivateKey([encoding])

<!-- YAML
added: v0.11.14
-->

- `encoding` {string}
- Restituisce: {Buffer | string} L'EC Diffie-Hellman private key (chiave privata) nell'`encoding` specificato, che può essere `'latin1'`, `'hex'`, o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### ecdh.getPublicKey(\[encoding\]\[, format\])

<!-- YAML
added: v0.11.14
-->

- `encoding` {string}
- `format` {string} **Default:** `'uncompressed'`
- Restituisce: {Buffer | string} L'EC Diffie-Hellman public key (chiave pubblica) nell'`encoding` e nel `format` specificati.

L'argomento `format` specifica l'encoding del punto e può essere `'compressed'` oppure `'uncompressed'`. Se non viene specificato `format`, il punto verrà restituito nel formato `'uncompressed'`.

L'argomento `encoding` può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

### ecdh.setPrivateKey(privateKey[, encoding])

<!-- YAML
added: v0.11.14
-->

- `privateKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Imposta l'EC Diffie-Hellman private key (chiave privata). L'`encoding` può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding`, `privateKey` dovrebbe essere una stringa; in caso contrario `privateKey` dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

Se la `privateKey` non è valida per la curva specificata quando è stato creato l'`ECDH` object, viene generato un errore. Dopo aver impostato la private key, viene generato e impostato nel `ECDH` object anche il public point (key) associato.

### ecdh.setPublicKey(publicKey[, encoding])

<!-- YAML
added: v0.11.14
deprecated: v5.2.0
-->

> Stabilità: 0 - Obsoleto

- `publicKey` {string | Buffer | TypedArray | DataView}
- `encoding` {string}

Imposta l'EC Diffie-Hellman public key (chiave pubblica). L'encoding della chiave può essere `'latin1'`, `'hex'` o `'base64'`. Se viene fornito l'`encoding`, la `publicKey` dovrebbe essere una stringa; in caso contrario dovrebbe essere un [`Buffer`][], un `TypedArray` o un `DataView`.

Da notare che normalmente non esiste un motivo per chiamare questo metodo poiché `ECDH` richiede solo una private key (chiave privata) e una public key (chiave pubblica) dell'altra parte per calcolare la chiave segreta condivisa. Solitamente viene chiamato [`ecdh.generateKeys()`][] oppure [`ecdh.setPrivateKey()`][]. Il metodo [`ecdh.setPrivateKey()`][] tenta di generare il/la public point/key (punto/chiave pubblico/a) associato/a alla private key (chiave privata) impostata.

Esempio (ottenendo una chiave segreta condivisa):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// Nota: questa è una scorciatoia per specificare una delle chiavi private di Alice
// precedenti. Non sarebbe saggio usare una chiave privata così prevedibile in una vera
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

## Class: Hash

<!-- YAML
added: v0.1.92
-->

La classe `Hash` è un'utility per creare hash digest di dati. Può essere utilizzata in due modi:

- Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing i dati per produrre un hash digest calcolato sul lato readable, oppure
- Utilizzando i metodi [`hash.update()`][] e [`hash.digest()`][] per produrre l'hash calcolato.

Le istanze `Hash` vengono create utilizzando il metodo [`crypto.createHash()`][]. Gli `Hash` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Hash` object come degli stream:

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.on('readable', () => {
  const data = hash.read();
  if (data) {
    console.log(data.toString('hex'));
    // Stampa:
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

### hash.digest([encoding])

<!-- YAML
added: v0.1.92
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Calcola il digest di tutti i dati passati per essere sottoposti all'hash (utilizzando il metodo [`hash.update()`][]). L'`encoding` può essere `'hex'`, `'latin1'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

L'`Hash` object non può essere utilizzato nuovamente dopo aver chiamato il metodo `hash.digest()`. Chiamate multiple genereranno un errore.

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

Aggiorna il contenuto dell'hash con il `data` fornito, il cui encoding è fornito all'interno dell'`inputEncoding` e può essere `'utf8'`, `'ascii'` o `'latin1'`. Se non viene fornito l'`encoding`, e `data` è una stringa, viene imposto un encoding di `'utf8'`. Se `data` è un [`Buffer`][], `TypedArray` o un `DataView`, allora `inputEncoding` viene ignorato.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

## Class: Hmac

<!-- YAML
added: v0.1.94
-->

La classe `Hmac` è un'utility per la creazione di digest HMAC crittografici. Può essere utilizzata in due modi:

- Come uno [stream](stream.html) che è sia readable che writable (leggibile e scrivibile), sul quale vengono scritti tramite il writing i dati per produrre un HMAC digest calcolato sul lato readable, oppure
- Utilizzando i metodi [`hmac.update()`][] e [`hmac.digest()`][] per produrre l'HMAC digest calcolato.

Le istanze `Hmac` vengono create utilizzando il metodo [`crypto.createHmac()`][]. Gli `Hmac` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando gli `Hmac` object come degli stream:

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', 'a secret');

hmac.on('readable', () => {
  const data = hmac.read();
  if (data) {
    console.log(data.toString('hex'));
    // Stampa:
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

### hmac.digest([encoding])

<!-- YAML
added: v0.1.94
-->

- `encoding` {string}
- Restituisce: {Buffer | string}

Calcola l'HMAC digest di tutti i dati passati utilizzando [`hmac.update()`][]. L'`encoding` può essere `'hex'`, `'latin1'` o `'base64'`. Se viene fornito l'`encoding` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][];

L'`Hmac` object non può essere utilizzato nuovamente dopo aver chiamato il metodo `hmac.digest()`. Chiamate multiple di `hmac.digest()` genereranno un errore.

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

Aggiorna il contenuto dell'`Hmac` con il `data` fornito, il cui encoding è fornito all'interno dell'`inputEncoding` e può essere `'utf8'`, `'ascii'` o `'latin1'`. Se non viene fornito l'`encoding`, e `data` è una stringa, viene imposto un encoding di `'utf8'`. Se `data` è un [`Buffer`][], `TypedArray` o un `DataView`, allora `inputEncoding` viene ignorato.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

## Class: Sign

<!-- YAML
added: v0.1.92
-->

La classe `Sign` è un'utility per la generazione di firme. Può essere utilizzata in due modi:

- Come un writable [stream](stream.html), sul quale vengono scritti tramite il writing i dati da firmare e il metodo [`sign.sign()`][] viene utilizzato per generare e restituire la firma, oppure
- Utilizzando i metodi [`sign.update()`][] e [`sign.sign()`][] per produrre la firma.

Le istanze `Sign` vengono create utilizzando il metodo [`crypto.createSign()`][]. L'argomento è il nome della stringa della funzione hash da utilizzare. I `Sign` object non devono essere creati direttamente utilizzando la parola chiave `new`.

Esempio: Utilizzando i `Sign` object come degli stream:

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.write('some data to sign');
sign.end();

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Stampa: la firma calcolata utilizzando la chiave privata e
// l'SHA-256 specificati. Per le chiavi RSA, l'algoritmo è 
// RSASSA-PKCS1-v1_5 (vedi il parametro padding in basso per RSASSA-PSS). Per le chiavi EC, l'algoritmo è ECDSA.
```

Esempio: Utilizzando i metodi [`sign.update()`][] e [`sign.sign()`][]:

```js
const crypto = require('crypto');
const sign = crypto.createSign('SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Stampa: la firma calcolata
```

In alcuni casi, è anche possibile creare un'istanza `Sign` passando un nome dell'algoritmo di una firma, come ad esempio 'RSA-SHA256'. Questo utilizzerà l'algoritmo del digest corrispondente. Questo non funziona per tutti gli algoritmi delle firma, ad esempio per 'ecdsa-with-SHA256' non funziona. In questo caso utilizza i nomi dei digest.

Esempio: firma utilizzando il nome dell'algoritmo della firma legacy

```js
const crypto = require('crypto');
const sign = crypto.createSign('RSA-SHA256');

sign.update('some data to sign');

const privateKey = getPrivateKeySomehow();
console.log(sign.sign(privateKey, 'hex'));
// Stampa: la firma calcolata
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
- Restituisce: {Buffer | string}

Calcola la firma su tutti i dati passati utilizzando [`sign.update()`][] oppure [`sign.write()`](stream.html#stream_writable_write_chunk_encoding_callback).

L'argomento `privateKey` può essere un object o una stringa. Se `privateKey` è una stringa, viene trattato come una raw key senza passphrase (frase d'accesso). Se `privateKey` è un object, deve contenere una o più delle seguenti proprietà:

- `key`: {string} - Private key (chiave privata) con codifica PEM (obbligatoria)
- `passphrase`: {string} - passphrase (frase d'accesso) per la private key (chiave privata)
- `padding`: {integer} - Valore padding opzionale per RSA, può essere uno dei seguenti:
  
  - `crypto.constants.RSA_PKCS1_PADDING` (valore di default)
  - `crypto.constants.RSA_PKCS1_PSS_PADDING`
  
  Da notare che `RSA_PKCS1_PSS_PADDING` utilizzerà MGF1 con la stessa funzione hash utilizzata per firmare il messaggio come specificato nella sezione 3.1 del documento [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).

- `saltLength`: {integer} - lunghezza del salt per quando il padding è `RSA_PKCS1_PSS_PADDING`. Il valore speciale `crypto.constants.RSA_PSS_SALTLEN_DIGEST` imposta la lunghezza del salt nella dimensione del digest, `crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN` (valore di default) lo imposta sul valore massimo consentito.

L'`outputFormat` può essere `'latin1'`, `'hex'` oppure `'base64'`. Se viene fornito l'`outputFormat` viene restituita una stringa; in caso contrario, viene restituito un [`Buffer`][].

Il `Sign` object non può essere utilizzato nuovamente dopo aver chiamato il metodo `sign.sign()`. Chiamate multiple di `sign.sign()` genereranno un errore.

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

Aggiorna il contenuto di `Sign` con il `data` fornito, il cui encoding è fornito all'interno dell'`inputEncoding` e può essere `'utf8'`, `'ascii'` o `'latin1'`. Se non viene fornito l'`encoding`, e `data` è una stringa, viene imposto un encoding di `'utf8'`. Se `data` è un [`Buffer`][], `TypedArray` o un `DataView`, allora `inputEncoding` viene ignorato.

Può essere chiamato più volte con i nuovi dati mentre viene eseguito lo streaming.

## Class: Verify

<!-- YAML
added: v0.1.92
-->

The `Verify` class is a utility for verifying signatures. It can be used in one of two ways:

- As a writable [stream](stream.html) where written data is used to validate against the supplied signature, or
- Using the [`verify.update()`][] and [`verify.verify()`][] methods to verify the signature.

The [`crypto.createVerify()`][] method is used to create `Verify` instances. `Verify` objects are not to be created directly using the `new` keyword.

Example: Using `Verify` objects as streams:

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

Example: Using the [`verify.update()`][] and [`verify.verify()`][] methods:

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

- `data` {string | Buffer | TypedArray | DataView}
- `inputEncoding` {string}

Updates the `Verify` content with the given `data`, the encoding of which is given in `inputEncoding` and can be `'utf8'`, `'ascii'` or `'latin1'`. If `encoding` is not provided, and the `data` is a string, an encoding of `'utf8'` is enforced. If `data` is a [`Buffer`][], `TypedArray`, or `DataView`, then `inputEncoding` is ignored.

This can be called many times with new data as it is streamed.

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

Verifies the provided data using the given `object` and `signature`. The `object` argument can be either a string containing a PEM encoded object, which can be an RSA public key, a DSA public key, or an X.509 certificate, or an object with one or more of the following properties:

- `key`: {string} - PEM encoded public key (required)
- `padding`: {integer} - Optional padding value for RSA, one of the following:
  
  - `crypto.constants.RSA_PKCS1_PADDING` (default)
  - `crypto.constants.RSA_PKCS1_PSS_PADDING`
  
  Note that `RSA_PKCS1_PSS_PADDING` will use MGF1 with the same hash function used to verify the message as specified in section 3.1 of [RFC 4055](https://www.rfc-editor.org/rfc/rfc4055.txt).

- `saltLength`: {integer} - salt length for when padding is `RSA_PKCS1_PSS_PADDING`. The special value `crypto.constants.RSA_PSS_SALTLEN_DIGEST` sets the salt length to the digest size, `crypto.constants.RSA_PSS_SALTLEN_AUTO` (default) causes it to be determined automatically.

The `signature` argument is the previously calculated signature for the data, in the `signatureFormat` which can be `'latin1'`, `'hex'` or `'base64'`. If a `signatureFormat` is specified, the `signature` is expected to be a string; otherwise `signature` is expected to be a [`Buffer`][], `TypedArray`, or `DataView`.

The `verify` object can not be used again after `verify.verify()` has been called. Multiple calls to `verify.verify()` will result in an error being thrown.

## `crypto` module methods and properties

### crypto.constants

<!-- YAML
added: v6.3.0
-->

- Returns: {Object} An object containing commonly used constants for crypto and security related operations. The specific constants currently defined are described in [Crypto Constants](#crypto_crypto_constants_1).

### crypto.DEFAULT_ENCODING

<!-- YAML
added: v0.9.3
deprecated: v10.0.0
-->

The default encoding to use for functions that can take either strings or [buffers][`Buffer`]. The default value is `'buffer'`, which makes methods default to [`Buffer`][] objects.

The `crypto.DEFAULT_ENCODING` mechanism is provided for backwards compatibility with legacy programs that expect `'latin1'` to be the default encoding.

New applications should expect the default to be `'buffer'`.

This property is deprecated.

### crypto.fips

<!-- YAML
added: v6.0.0
deprecated: v10.0.0
-->

Property for checking and controlling whether a FIPS compliant crypto provider is currently in use. Setting to true requires a FIPS build of Node.js.

This property is deprecated. Please use `crypto.setFips()` and `crypto.getFips()` instead.

### crypto.createCipher(algorithm, password[, options])

<!-- YAML
added: v0.1.94
deprecated: v10.0.0
-->

> Stability: 0 - Deprecated: Use [`crypto.createCipheriv()`][] instead.

- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Returns: {Cipher}

Creates and returns a `Cipher` object that uses the given `algorithm` and `password`.

The `options` argument controls stream behavior and is optional except when a cipher in CCM mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

The `password` is used to derive the cipher key and initialization vector (IV). The value must be either a `'latin1'` encoded string, a [`Buffer`][], a `TypedArray`, or a `DataView`.

The implementation of `crypto.createCipher()` derives keys using the OpenSSL function [`EVP_BytesToKey`][] with the digest algorithm set to MD5, one iteration, and no salt. The lack of salt allows dictionary attacks as the same password always creates the same key. The low iteration count and non-cryptographically secure hash algorithm allow passwords to be tested very rapidly.

In line with OpenSSL's recommendation to use PBKDF2 instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.pbkdf2()`][] and to use [`crypto.createCipheriv()`][] to create the `Cipher` object. Users should not use ciphers with counter mode (e.g. CTR, GCM, or CCM) in `crypto.createCipher()`. A warning is emitted when they are used in order to avoid the risk of IV reuse that causes vulnerabilities. For the case when IV is reused in GCM, see [Nonce-Disrespecting Adversaries](https://github.com/nonce-disrespect/nonce-disrespect) for details.

### crypto.createCipheriv(algorithm, key, iv[, options])

<!-- YAML
added: v0.1.94
changes:

  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18644
    description: The `iv` parameter may now be `null` for ciphers which do not
                 need an initialization vector.
-->

- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `iv` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Returns: {Cipher}

Creates and returns a `Cipher` object, with the given `algorithm`, `key` and initialization vector (`iv`).

The `options` argument controls stream behavior and is optional except when a cipher in CCM mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

The `algorithm` is dependent on OpenSSL, examples are `'aes192'`, etc. On recent OpenSSL releases, `openssl list -cipher-algorithms` (`openssl list-cipher-algorithms` for older versions of OpenSSL) will display the available cipher algorithms.

The `key` is the raw key used by the `algorithm` and `iv` is an [initialization vector](https://en.wikipedia.org/wiki/Initialization_vector). Both arguments must be `'utf8'` encoded strings, [Buffers][`Buffer`], `TypedArray`, or `DataView`s. If the cipher does not need an initialization vector, `iv` may be `null`.

Initialization vectors should be unpredictable and unique; ideally, they will be cryptographically random. They do not have to be secret: IVs are typically just added to ciphertext messages unencrypted. It may sound contradictory that something has to be unpredictable and unique, but does not have to be secret; it is important to remember that an attacker must not be able to predict ahead of time what a given IV will be.

### crypto.createCredentials(details)

<!-- YAML
added: v0.1.92
deprecated: v0.11.13
-->

> Stability: 0 - Deprecated: Use [`tls.createSecureContext()`][] instead.

- `details` {Object} Identical to [`tls.createSecureContext()`][].
- Returns: {tls.SecureContext}

The `crypto.createCredentials()` method is a deprecated function for creating and returning a `tls.SecureContext`. It should not be used. Replace it with [`tls.createSecureContext()`][] which has the exact same arguments and return value.

Returns a `tls.SecureContext`, as-if [`tls.createSecureContext()`][] had been called.

### crypto.createDecipher(algorithm, password[, options])

<!-- YAML
added: v0.1.94
deprecated: v10.0.0
-->

> Stability: 0 - Deprecated: Use [`crypto.createDecipheriv()`][] instead.

- `algorithm` {string}
- `password` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Returns: {Decipher}

Creates and returns a `Decipher` object that uses the given `algorithm` and `password` (key).

The `options` argument controls stream behavior and is optional except when a cipher in CCM mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

The implementation of `crypto.createDecipher()` derives keys using the OpenSSL function [`EVP_BytesToKey`][] with the digest algorithm set to MD5, one iteration, and no salt. The lack of salt allows dictionary attacks as the same password always creates the same key. The low iteration count and non-cryptographically secure hash algorithm allow passwords to be tested very rapidly.

In line with OpenSSL's recommendation to use PBKDF2 instead of [`EVP_BytesToKey`][] it is recommended that developers derive a key and IV on their own using [`crypto.pbkdf2()`][] and to use [`crypto.createDecipheriv()`][] to create the `Decipher` object.

### crypto.createDecipheriv(algorithm, key, iv[, options])

<!-- YAML
added: v0.1.94
changes:

  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18644
    description: The `iv` parameter may now be `null` for ciphers which do not
                 need an initialization vector.
-->

- `algorithm` {string}
- `key` {string | Buffer | TypedArray | DataView}
- `iv` {string | Buffer | TypedArray | DataView}
- `options` {Object} [`stream.transform` options][]
- Returns: {Decipher}

Creates and returns a `Decipher` object that uses the given `algorithm`, `key` and initialization vector (`iv`).

The `options` argument controls stream behavior and is optional except when a cipher in CCM mode is used (e.g. `'aes-128-ccm'`). In that case, the `authTagLength` option is required and specifies the length of the authentication tag in bytes, see [CCM mode](#crypto_ccm_mode).

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

- `prime` {string | Buffer | TypedArray | DataView}
- `primeEncoding` {string}
- `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`
- `generatorEncoding` {string}

Creates a `DiffieHellman` key exchange object using the supplied `prime` and an optional specific `generator`.

The `generator` argument can be a number, string, or [`Buffer`][]. If `generator` is not specified, the value `2` is used.

The `primeEncoding` and `generatorEncoding` arguments can be `'latin1'`, `'hex'`, or `'base64'`.

If `primeEncoding` is specified, `prime` is expected to be a string; otherwise a [`Buffer`][], `TypedArray`, or `DataView` is expected.

If `generatorEncoding` is specified, `generator` is expected to be a string; otherwise a number, [`Buffer`][], `TypedArray`, or `DataView` is expected.

### crypto.createDiffieHellman(primeLength[, generator])

<!-- YAML
added: v0.5.0
-->

- `primeLength` {number}
- `generator` {number | string | Buffer | TypedArray | DataView} **Default:** `2`

Creates a `DiffieHellman` key exchange object and generates a prime of `primeLength` bits using an optional specific numeric `generator`. If `generator` is not specified, the value `2` is used.

### crypto.createECDH(curveName)

<!-- YAML
added: v0.11.14
-->

- `curveName` {string}

Creates an Elliptic Curve Diffie-Hellman (`ECDH`) key exchange object using a predefined curve specified by the `curveName` string. Use [`crypto.getCurves()`][] to obtain a list of available curve names. On recent OpenSSL releases, `openssl ecparam -list_curves` will also display the name and description of each available elliptic curve.

### crypto.createHash(algorithm[, options])

<!-- YAML
added: v0.1.92
-->

- `algorithm` {string}
- `options` {Object} [`stream.transform` options][]
- Returns: {Hash}

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
- Returns: {Hmac}

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
- Returns: {Sign}

Creates and returns a `Sign` object that uses the given `algorithm`. Use [`crypto.getHashes()`][] to obtain an array of names of the available signing algorithms. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.createVerify(algorithm[, options])

<!-- YAML
added: v0.1.92
-->

- `algorithm` {string}
- `options` {Object} [`stream.Writable` options][]
- Returns: {Verify}

Creates and returns a `Verify` object that uses the given algorithm. Use [`crypto.getHashes()`][] to obtain an array of names of the available signing algorithms. Optional `options` argument controls the `stream.Writable` behavior.

### crypto.getCiphers()

<!-- YAML
added: v0.9.3
-->

- Returns: {string[]} An array with the names of the supported cipher algorithms.

Example:

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()

<!-- YAML
added: v2.3.0
-->

- Returns: {string[]} An array with the names of the supported elliptic curves.

Example:

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)

<!-- YAML
added: v0.7.5
-->

- `groupName` {string}
- Returns: {Object}

Creates a predefined `DiffieHellman` key exchange object. The supported groups are: `'modp1'`, `'modp2'`, `'modp5'` (defined in [RFC 2412](https://www.rfc-editor.org/rfc/rfc2412.txt), but see [Caveats](#crypto_support_for_weak_or_compromised_algorithms)) and `'modp14'`, `'modp15'`, `'modp16'`, `'modp17'`, `'modp18'` (defined in [RFC 3526](https://www.rfc-editor.org/rfc/rfc3526.txt)). The returned object mimics the interface of objects created by [`crypto.createDiffieHellman()`][], but will not allow changing the keys (with [`diffieHellman.setPublicKey()`][] for example). The advantage of using this method is that the parties do not have to generate nor exchange a group modulus beforehand, saving both processor and communication time.

Example (obtaining a shared secret):

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

- Returns: {boolean} `true` if and only if a FIPS compliant crypto provider is currently in use.

### crypto.getHashes()

<!-- YAML
added: v0.9.3
-->

- Returns: {string[]} An array of the names of the supported hash algorithms, such as `'RSA-SHA256'`.

Example:

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

- `password` {string|Buffer|TypedArray}
- `salt` {string|Buffer|TypedArray}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}
- `callback` {Function} 
  - `err` {Error}
  - `derivedKey` {Buffer}

Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. A selected HMAC digest algorithm specified by `digest` is applied to derive a key of the requested byte length (`keylen`) from the `password`, `salt` and `iterations`.

The supplied `callback` function is called with two arguments: `err` and `derivedKey`. If an error occurs while deriving the key, `err` will be set; otherwise `err` will be `null`. By default, the successfully generated `derivedKey` will be passed to the callback as a [`Buffer`][]. An error will be thrown if any of the input arguments specify invalid values or types.

The `iterations` argument must be a number set as high as possible. The higher the number of iterations, the more secure the derived key will be, but will take a longer amount of time to complete.

The `salt` should also be as unique as possible. It is recommended that the salts are random and their lengths are at least 16 bytes. See [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

Example:

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

- `password` {string|Buffer|TypedArray}
- `salt` {string|Buffer|TypedArray}
- `iterations` {number}
- `keylen` {number}
- `digest` {string}
- Returns: {Buffer}

Provides a synchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. A selected HMAC digest algorithm specified by `digest` is applied to derive a key of the requested byte length (`keylen`) from the `password`, `salt` and `iterations`.

If an error occurs an `Error` will be thrown, otherwise the derived key will be returned as a [`Buffer`][].

The `iterations` argument must be a number set as high as possible. The higher the number of iterations, the more secure the derived key will be, but will take a longer amount of time to complete.

The `salt` should also be as unique as possible. It is recommended that the salts are random and their lengths are at least 16 bytes. See [NIST SP 800-132](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf) for details.

Example:

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512');
console.log(key.toString('hex'));  // '3745e48...08d59ae'
```

The `crypto.DEFAULT_ENCODING` property may be used to change the way the `derivedKey` is returned. This property, however, has been deprecated and use should be avoided.

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

Because RSA public keys can be derived from private keys, a private key may be passed instead of a public key.

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

- `size` {number}
- `callback` {Function} 
  - `err` {Error}
  - `buf` {Buffer}
- Returns: {Buffer} if the `callback` function is not provided.

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
added: v7.10.0
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15231
    description: The `buffer` argument may be any `TypedArray` or `DataView`.
-->

- `buffer` {Buffer|TypedArray|DataView} Must be supplied.
- `offset` {number} **Default:** `0`
- `size` {number} **Default:** `buffer.length - offset`
- Returns: {Buffer}

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
console.log(crypto.randomFillSync(a).toString('hex'));

const b = new Float64Array(10);
console.log(crypto.randomFillSync(a).toString('hex'));

const c = new DataView(new ArrayBuffer(10));
console.log(crypto.randomFillSync(a).toString('hex'));
```

### crypto.randomFill(buffer\[, offset\]\[, size\], callback)

<!-- YAML
added: v7.10.0
changes:

  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15231
    description: The `buffer` argument may be any `TypedArray` or `DataView`.
-->

- `buffer` {Buffer|TypedArray|DataView} Must be supplied.
- `offset` {number} **Default:** `0`
- `size` {number} **Default:** `buffer.length - offset`
- `callback` {Function} `function(err, buf) {}`.

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
  console.log(buf.toString('hex'));
});

const b = new Float64Array(10);
crypto.randomFill(b, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

const c = new DataView(new ArrayBuffer(10));
crypto.randomFill(c, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

Note that this API uses libuv's threadpool, which can have surprising and negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

The asynchronous version of `crypto.randomFill()` is carried out in a single threadpool request. To minimize threadpool task length variation, partition large `randomFill` requests when doing so as part of fulfilling a client request.

### crypto.setEngine(engine[, flags])

<!-- YAML
added: v0.11.11
-->

- `engine` {string}
- `flags` {crypto.constants} **Default:** `crypto.constants.ENGINE_METHOD_ALL`

Load and set the `engine` for some or all OpenSSL functions (selected by flags).

`engine` could be either an id or a path to the engine's shared library.

The optional `flags` argument uses `ENGINE_METHOD_ALL` by default. The `flags` is a bit field taking one of or a mix of the following flags (defined in `crypto.constants`):

- `crypto.constants.ENGINE_METHOD_RSA`
- `crypto.constants.ENGINE_METHOD_DSA`
- `crypto.constants.ENGINE_METHOD_DH`
- `crypto.constants.ENGINE_METHOD_RAND`
- `crypto.constants.ENGINE_METHOD_EC`
- `crypto.constants.ENGINE_METHOD_CIPHERS`
- `crypto.constants.ENGINE_METHOD_DIGESTS`
- `crypto.constants.ENGINE_METHOD_PKEY_METHS`
- `crypto.constants.ENGINE_METHOD_PKEY_ASN1_METHS`
- `crypto.constants.ENGINE_METHOD_ALL`
- `crypto.constants.ENGINE_METHOD_NONE`

The flags below are deprecated in OpenSSL-1.1.0.

- `crypto.constants.ENGINE_METHOD_ECDH`
- `crypto.constants.ENGINE_METHOD_ECDSA`
- `crypto.constants.ENGINE_METHOD_STORE`

### crypto.setFips(bool)

<!-- YAML
added: v10.0.0
-->

- `bool` {boolean} `true` to enable FIPS mode.

Enables the FIPS compliant crypto provider in a FIPS-enabled Node.js build. Throws an error if FIPS mode is not available.

### crypto.timingSafeEqual(a, b)

<!-- YAML
added: v6.6.0
-->

- `a` {Buffer | TypedArray | DataView}
- `b` {Buffer | TypedArray | DataView}
- Returns: {boolean}

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

Based on the recommendations of [NIST SP 800-131A](http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar1.pdf):

- MD5 and SHA-1 are no longer acceptable where collision resistance is required such as digital signatures.
- The key used with RSA, DSA, and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
- The DH groups of `modp1`, `modp2` and `modp5` have a key size smaller than 2048 bits and are not recommended.

See the reference for other recommendations and details.

### CCM mode

CCM is one of the two supported [AEAD algorithms](https://en.wikipedia.org/wiki/Authenticated_encryption). Applications which use this mode must adhere to certain restrictions when using the cipher API:

- The authentication tag length must be specified during cipher creation by setting the `authTagLength` option and must be one of 4, 6, 8, 10, 12, 14 or 16 bytes.
- The length of the initialization vector (nonce) `N` must be between 7 and 13 bytes (`7 ≤ N ≤ 13`).
- The length of the plaintext is limited to `2 ** (8 * (15 - N))` bytes.
- When decrypting, the authentication tag must be set via `setAuthTag()` before specifying additional authenticated data and / or calling `update()`. Otherwise, decryption will fail and `final()` will throw an error in compliance with section 2.6 of [RFC 3610](https://www.rfc-editor.org/rfc/rfc3610.txt).
- Using stream methods such as `write(data)`, `end(data)` or `pipe()` in CCM mode might fail as CCM cannot handle more than one chunk of data per instance.
- When passing additional authenticated data (AAD), the length of the actual message in bytes must be passed to `setAAD()` via the `plaintextLength` option. This is not necessary if no AAD is used.
- As CCM processes the whole message at once, `update()` can only be called once.
- Even though calling `update()` is sufficient to encrypt / decrypt the message, applications *must* call `final()` to compute and / or verify the authentication tag.

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
