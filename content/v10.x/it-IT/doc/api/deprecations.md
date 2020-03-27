# API obsolete

<!--introduced_in=v7.7.0-->
<!-- type=misc -->

Node.js may deprecate APIs when either: (a) use of the API is considered to be unsafe, (b) an improved alternative API is available, or (c) breaking changes to the API are expected in a future major release.

Node.js utilizza tre tipi di Deprecazioni:

* Documentation-only
* Runtime
* End-of-Life

Una deprecazione Documentation-only è espressa solo nei documenti delle API di Node.js. Queste non generano effetti collaterali durante l'esecuzione di Node.js. Alcune deprecazioni Documentation-only attivano un avviso di runtime al loro avvio con il flag [`--pending-deprecation`][] (o la sua alternativa, la variabile d'ambiente `NODE_PENDING_DEPRECATION=1`), in modo simile alle deprecazioni Runtime che seguono. Le deprecazioni Documentation-only che supportano tale flag sono esplicitamente etichettate come tali nell'[elenco delle API deprecate/obsolete](#deprecations_list_of_deprecated_apis).

Una deprecazione Runtime genererà, in modo predefinito, un avviso di processo che verrà stampato su `stderr` la prima volta che viene utilizzata l'API deprecata/obsoleta. Quando viene utilizzato il flag `--throw-deprecation` della command-line, una deprecazione Runtime genenerà un'errore.

An End-of-Life deprecation is used when functionality is or will soon be removed from Node.js.

## Revocare le deprecazioni

A volte la deprecazione di un'API può essere annullata. In tali situazioni, questo documento verrà aggiornato con informazioni rilevanti per la decisione. Tuttavia, l'identificatore delle deprecazioni non verrà modificato.

## Elenco delle API Deprecate/Obsolete

<a id="DEP0001"></a>

### DEP0001: http.OutgoingMessage.prototype.flush
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v1.6.0
    pr-url: https://github.com/nodejs/node/pull/1156
    description: Runtime deprecation.
-->

Tipo: Runtime

Il metodo `OutgoingMessage.prototype.flush()` è deprecato/obsoleto. Utilizza `OutgoingMessage.prototype.flushHeaders()` al suo posto.

<a id="DEP0002"></a>

### DEP0002: require('\_linklist')
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12113
    description: End-of-Life.
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3078
    description: Runtime deprecation.
-->

Tipo: End-of-Life

Il modulo `_linklist` è deprecato/obsoleto. Si prega di utilizzare un'alternativa userland.

<a id="DEP0003"></a>

### DEP0003: \_writableState.buffer
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.15
    pr-url: https://github.com/nodejs/node-v0.x-archive/pull/8826
    description: Runtime deprecation.
-->

Tipo: Runtime

La proprietà `_writableState.buffer` è deprecata/obsoleta. Utilizza il metodo `_writableState.getBuffer()` al suo posto.

<a id="DEP0004"></a>

### DEP0004: CryptoStream.prototype.readyState
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17882
    description: End-of-Life.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: 0.4.0
    commit: 9c7f89bf56abd37a796fea621ad2e47dd33d2b82
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

The `CryptoStream.prototype.readyState` property was removed.

<a id="DEP0005"></a>

### DEP0005: Buffer() constructor
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Runtime deprecation.
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4682
    description: Documentation-only deprecation.
-->

Tipo: Runtime (supporta [`--pending-deprecation`][])

La funzione `Buffer()` e il constructor `new Buffer()` sono deprecati/obsoleti a causa di problemi di usabilità dell'API che potevano potenzialmente causare problemi accidentali di sicurezza.

In alternativa, si consiglia vivamente l'utilizzo dei seguenti metodi di costruzione dei `Buffer` object:

* [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Crea un `Buffer` con memoria *inizializzata*.
* [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.allocUnsafeSlow(size)`][] - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.from(array)`][] - Crea un `Buffer` con una copia di `array`
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Create a `Buffer` that wraps the given `arrayBuffer`.
* [`Buffer.from(buffer)`][] - Crea un `Buffer` che copia `buffer`.
* [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Crea un `Buffer` che copia `string`.

A partire dalla v10.0.0, viene stampato un avviso di deprecazione in fase di esecuzione quando viene utilizzato `--pending-deprecation` o quando il codice chiamante si trova all'esterno di `node_modules` al fine di indirizzare meglio gli sviluppatori, piuttosto che gli utenti.

<a id="DEP0006"></a>

### DEP0006: child\_process options.customFds
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.14
    description: Runtime deprecation.
  - version: v0.5.11
    description: Documentation-only deprecation.
-->

Tipo: Runtime

All'interno dei metodi `spawn()`, `fork()`, ed `exec()` del modulo [`child_process`][], l'opzione `options.customFds` è deprecata/obsoleta. Al suo posto dovrebbe essere utilizzata l'opzione `options.stdio`.

<a id="DEP0007"></a>

### DEP0007: Sostituire il cluster worker.suicide con worker.exitedAfterDisconnect
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13702
    description: End-of-Life.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/3747
    description: Runtime deprecation.
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3743
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

In una versione precedente del `cluster` di Node.js è stata aggiunta una proprietà booleana con il nome `suicide` al `Worker` object. Lo scopo di questa proprietà era fornire un'indicazione su come e perché l'istanza `Worker` è stata chiusa. In Node.js 6.0.0, la vecchia proprietà è stata deprecata e sostituita con una nuova proprietà [`worker.exitedAfterDisconnect`][]. Il vecchio nome della proprietà non descriveva precisamente l’effettiva semantica ed era inutilmente carico di emotività.

<a id="DEP0008"></a>

### DEP0008: require('constants')
<!-- YAML
changes:
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6534
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The `constants` module is deprecated. Quando si richiede l'accesso a costanti relative a specifici moduli incorporati di Node.js, gli sviluppatori dovrebbero fare riferimento alla proprietà `constants` esposta dal modulo relativo. Per esempio, `require('fs').constants` e `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 senza digest
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11305
    description: End-of-Life.
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4047
    description: Runtime deprecation.
-->

Tipo: End-of-Life

L'utilizzoo dell'API [`crypto.pbkdf2()`][] senza specificare un digest è stato reso obsoleto in Node.js 6.0 poiché il metodo era stato impostato per utilizzare in modo predefinito il digest `'SHA1'` del quale si sconsiglia l'utilizzo. In precedenza, veniva stampato un avviso di deprecazione. A partire da Node.js 8.0.0, chiamare `crypto.pbkdf2()` o `crypto.pbkdf2Sync()` con un `digest` indefinito genererà un `TypeError`.

<a id="DEP0010"></a>

### DEP0010: crypto.createCredentials
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.13
    pr-url: https://github.com/nodejs/node-v0.x-archive/pull/7265
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API [`crypto.createCredentials()`][] è deprecata/obsoleta. Si prega di utilizzare [`tls.createSecureContext()`][] al suo posto.

<a id="DEP0011"></a>

### DEP0011: crypto.Credentials
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.13
    pr-url: https://github.com/nodejs/node-v0.x-archive/pull/7265
    description: Runtime deprecation.
-->

Tipo: Runtime

La classe `crypto.Credentials` è deprecata/obsoleta. Si prega di utilizzare [`tls.SecureContext`][] al suo posto.

<a id="DEP0012"></a>

### DEP0012: Domain.dispose
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15412
    description: End-of-Life.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.7
    pr-url: https://github.com/nodejs/node-v0.x-archive/pull/5021
    description: Runtime deprecation.
-->

Tipo: End-of-Life

`Domain.dispose()` è stato rimosso. In alternativa puoi ripristinare le azioni esplicite I/O fallite tramite gli event handler degli errori impostati sul dominio.

<a id="DEP0013"></a>

### DEP0013: fs funzione asincrona senza callback
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18668
    description: End-of-Life.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: Runtime deprecation.
-->

Tipo: End-of-Life

Chiamare una funzione asincrona senza un callback genera un `TypeError` da Node.js 10.0.0 in poi. (See <https://github.com/nodejs/node/pull/12562>.)

<a id="DEP0014"></a>

### DEP0014: interfaccia fs.read legacy String
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9683
    description: End-of-Life.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4525
    description: Runtime deprecation.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.1.96
    commit: c93e0aaf062081db3ec40ac45b3e2c979d5759d6
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

L'interfaccia [`fs.read()`][] legacy `String` è deprecata/obsoleta. In alternativa utilizza l'API `Buffer` come indicato nella documentazione.

<a id="DEP0015"></a>

### DEP0015: interfaccia fs.readSync legacy String
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/9683
    description: End-of-Life.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4525
    description: Runtime deprecation.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.1.96
    commit: c93e0aaf062081db3ec40ac45b3e2c979d5759d6
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

L'interfaccia [`fs.readSync()`][] legacy `String` è deprecata/obsoleta. In alternativa utilizza l'API `Buffer` come indicato nella documentazione.

<a id="DEP0016"></a>

### DEP0016: GLOBAL/root
<!-- YAML
changes:
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/1838
    description: Runtime deprecation.
-->

Tipo: Runtime

The `GLOBAL` and `root` aliases for the `global` property are deprecated and should no longer be used.

<a id="DEP0017"></a>

### DEP0017: Intl.v8BreakIterator
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15238
    description: End-of-Life.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8908
    description: Runtime deprecation.
-->

Tipo: End-of-Life

`Intl.v8BreakIterator` era un'estensione non-standard ed è stata rimossa. Vedi [`Intl.Segmenter`](https://github.com/tc39/proposal-intl-segmenter).

<a id="DEP0018"></a>

### DEP0018: Promise rejection non gestiti
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Runtime deprecation.
-->

Tipo: Runtime

I promise rejection non gestiti sono deprecati/obsoleti. In futuro, i promise rejection che non vengono gestiti termineranno il processo Node.js con un valore di uscita diverso da zero.

<a id="DEP0019"></a>

### DEP0019: require('.') risolto al di fuori della directory
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v1.8.1
    pr-url: https://github.com/nodejs/node/pull/1363
    description: Runtime deprecation.
-->

Tipo: Runtime

In alcuni casi, `require('.')` potrebbe risolversi al di fuori della directory del pacchetto. Questo comportamento è deprecato/obsoleto e verrà rimosso in una futura versione di Node.js.

<a id="DEP0020"></a>

### DEP0020: Server.connections
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.9.7
    pr-url: https://github.com/nodejs/node-v0.x-archive/pull/4595
    description: Runtime deprecation.
-->

Tipo: Runtime

La proprietà [`Server.connections`][] è deprecata/obsoleta. Si prega di utilizzare il metodo [`Server.getConnections()`][] al suo posto.

<a id="DEP0021"></a>

### DEP0021: Server.listenFD
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.7.12
    commit: 41421ff9da1288aa241a5e9dcf915b685ade1c23
    description: Runtime deprecation.
-->

Tipo: Runtime

Il metodo `Server.listenFD()` è deprecato/obsoleto. Si prega di utilizzare [`Server.listen({fd: <number>})`][] al suo posto.

<a id="DEP0022"></a>

### DEP0022: os.tmpDir()
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6739
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API `os.tmpDir()` è deprecata/obsoleta. Si prega di utilizzare [`os.tmpdir()`][] al suo posto.

<a id="DEP0023"></a>

### DEP0023: os.getNetworkInterfaces()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.6.0
    commit: 37bb37d151fb6ee4696730e63ff28bb7a4924f97
    description: Runtime deprecation.
-->

Tipo: Runtime

Il metodo `os.getNetworkInterfaces()` è deprecato/obsoleto. Si prega di utilizzare la proprietà [`os.networkInterfaces`][] al suo posto.

<a id="DEP0024"></a>

### DEP0024: REPLServer.prototype.convertToContext()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13434
    description: End-of-Life.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7829
    description: Runtime deprecation.
-->

Tipo: End-of-Life

The `REPLServer.prototype.convertToContext()` API has been removed.

<a id="DEP0025"></a>

### DEP0025: require('sys')
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v1.0.0
    pr-url: https://github.com/nodejs/node/pull/317
    description: Runtime deprecation.
-->

Tipo: Runtime

Il modulo `sys` è deprecato/obsoleto. Si prega di utilizzare il modulo [`util`][] al suo posto.

<a id="DEP0026"></a>

### DEP0026: util.print()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.3
    commit: 896b2aa7074fc886efd7dd0a397d694763cac7ce
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API [`util.print()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.log()`][] al suo posto.

<a id="DEP0027"></a>

### DEP0027: util.puts()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.3
    commit: 896b2aa7074fc886efd7dd0a397d694763cac7ce
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API [`util.puts()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.log()`][] al suo posto.

<a id="DEP0028"></a>

### DEP0028: util.debug()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.3
    commit: 896b2aa7074fc886efd7dd0a397d694763cac7ce
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API [`util.debug()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.error()`][] al suo posto.

<a id="DEP0029"></a>

### DEP0029: util.error()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.3
    commit: 896b2aa7074fc886efd7dd0a397d694763cac7ce
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API [`util.error()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.error()`][] al suo posto.

<a id="DEP0030"></a>

### DEP0030: SlowBuffer
<!-- YAML
changes:
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5833
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`SlowBuffer`][] class is deprecated. Si prega di utilizzare [`Buffer.allocUnsafeSlow(size)`][] al suo posto.

<a id="DEP0031"></a>

### DEP0031: ecdh.setPublicKey()
<!-- YAML
changes:
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v5.2.0
    pr-url: https://github.com/nodejs/node/pull/3511
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Adesso il metodo [`ecdh.setPublicKey()`][] è deprecato/obsoleto poiché la sua inclusione nell'API è inutile.

<a id="DEP0032"></a>

### DEP0032: modulo domain
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v1.4.2
    pr-url: https://github.com/nodejs/node/pull/943
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Il modulo [`domain`][] è deprecato/obsoleto e non dovrebbe essere utilizzato.

<a id="DEP0033"></a>

### DEP0033: EventEmitter.listenerCount()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v3.2.0
    pr-url: https://github.com/nodejs/node/pull/2349
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`EventEmitter.listenerCount(emitter, eventName)`][] API is deprecated. Si prega di utilizzare [`emitter.listenerCount(eventName)`][] al suo posto.

<a id="DEP0034"></a>

### DEP0034: fs.exists(path, callback)
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v1.0.0
    pr-url: https://github.com/iojs/io.js/pull/166
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`fs.exists(path, callback)`][] API is deprecated. Si prega di utilizzare al suo posto [`fs.stat()`][] oppure [`fs.access()`][].

<a id="DEP0035"></a>

### DEP0035: fs.lchmod(path, mode, callback)
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.4.7
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`fs.lchmod(path, mode, callback)`][] API is deprecated.

<a id="DEP0036"></a>

### DEP0036: fs.lchmodSync(path, mode)
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.4.7
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`fs.lchmodSync(path, mode)`][] API is deprecated.

<a id="DEP0037"></a>

### DEP0037: fs.lchown(path, uid, gid, callback)
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: Deprecation revoked.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.4.7
    description: Documentation-only deprecation.
-->

Type: Deprecation revoked

The [`fs.lchown(path, uid, gid, callback)`][] API is deprecated.

<a id="DEP0038"></a>

### DEP0038: fs.lchownSync(path, uid, gid)
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/21498
    description: Deprecation revoked.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.4.7
    description: Documentation-only deprecation.
-->

Type: Deprecation revoked

The [`fs.lchownSync(path, uid, gid)`][] API is deprecated.

<a id="DEP0039"></a>

### DEP0039: require.extensions
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.10.6
    commit: 7bd8a5a2a60b75266f89f9a32877d55294a3881c
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`require.extensions`][] property is deprecated.

<a id="DEP0040"></a>

### DEP0040: modulo punycode
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7941
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`punycode`][] module is deprecated. Si prega di utilizzare un'alternativa userland al suo posto.

<a id="DEP0041"></a>

### DEP0041: variabile d'ambiente NODE\_REPL\_HISTORY\_FILE
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/13876
    description: End-of-Life.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2224
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

La variabile d'ambiente `NODE_REPL_HISTORY_FILE` è stata rimossa. Si prega di utilizzare `NODE_REPL_HISTORY` al suo posto.

<a id="DEP0042"></a>

### DEP0042: tls.CryptoStream
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17882
    description: End-of-Life.
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v0.11.3
    commit: af80e7bc6e6f33c582eb1f7d37c7f5bbe9f910f7
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

The [`tls.CryptoStream`][] class was removed. Si prega di utilizzare [`tls.TLSSocket`][] al suo posto.

<a id="DEP0043"></a>

### DEP0043: tls.SecurePair
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11349
    description: Runtime deprecation.
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6063
    description: Documentation-only deprecation.
  - version: v0.11.15
    pr-url:
      - https://github.com/nodejs/node-v0.x-archive/pull/8695
      - https://github.com/nodejs/node-v0.x-archive/pull/8700
    description: Deprecation revoked.
  - version: v0.11.3
    commit: af80e7bc6e6f33c582eb1f7d37c7f5bbe9f910f7
    description: Runtime deprecation.
-->

Tipo: Documentation-only

The [`tls.SecurePair`][] class is deprecated. Si prega di utilizzare [`tls.TLSSocket`][] al suo posto.

<a id="DEP0044"></a>

### DEP0044: util.isArray()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isArray()`][] API is deprecated. Si prega di utilizzare `Array.isArray()` al suo posto.

<a id="DEP0045"></a>

### DEP0045: util.isBoolean()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isBoolean()`][] API is deprecated.

<a id="DEP0046"></a>

### DEP0046: util.isBuffer()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isBuffer()`][] API is deprecated. Si prega di utilizzare [`Buffer.isBuffer()`][] al suo posto.

<a id="DEP0047"></a>

### DEP0047: util.isDate()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isDate()`][] API is deprecated.

<a id="DEP0048"></a>

### DEP0048: util.isError()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isError()`][] API is deprecated.

<a id="DEP0049"></a>

### DEP0049: util.isFunction()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isFunction()`][] API is deprecated.

<a id="DEP0050"></a>

### DEP0050: util.isNull()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isNull()`][] API is deprecated.

<a id="DEP0051"></a>

### DEP0051: util.isNullOrUndefined()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isNullOrUndefined()`][] API is deprecated.

<a id="DEP0052"></a>

### DEP0052: util.isNumber()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isNumber()`][] API is deprecated.

<a id="DEP0053"></a>

### DEP0053 util.isObject()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isObject()`][] API is deprecated.

<a id="DEP0054"></a>

### DEP0054: util.isPrimitive()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isPrimitive()`][] API is deprecated.

<a id="DEP0055"></a>

### DEP0055: util.isRegExp()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isRegExp()`][] API is deprecated.

<a id="DEP0056"></a>

### DEP0056: util.isString()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isString()`][] API is deprecated.

<a id="DEP0057"></a>

### DEP0057: util.isSymbol()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isSymbol()`][] API is deprecated.

<a id="DEP0058"></a>

### DEP0058: util.isUndefined()
<!-- YAML
changes:
  - version:
    - v4.8.6
    - v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version:
    - v3.3.1
    - v4.0.0
    pr-url: https://github.com/nodejs/node/pull/2447
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.isUndefined()`][] API is deprecated.

<a id="DEP0059"></a>

### DEP0059: util.log()
<!-- YAML
changes:
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6161
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util.log()`][] API is deprecated.

<a id="DEP0060"></a>

### DEP0060: util.\_extend()
<!-- YAML
changes:
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4903
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`util._extend()`][] API is deprecated.

<a id="DEP0061"></a>

### DEP0061: fs.SyncWriteStream
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10467
    description: Runtime deprecation.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6749
    description: Documentation-only deprecation.
-->

Tipo: Runtime

La classe `fs.SyncWriteStream` non è mai stata concepita come un'API pubblicamente accessibile. Non è disponibile alcuna API alternativa. Si prega di utilizzare un'alternativa userland.

<a id="DEP0062"></a>

### DEP0062: node --debug
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10970
    description: Runtime deprecation.
-->

Tipo: Runtime

`--debug` activates the legacy V8 debugger interface, which was removed as of V8 5.8. It is replaced by Inspector which is activated with `--inspect` instead.

<a id="DEP0063"></a>

### DEP0063: ServerResponse.prototype.writeHeader()
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11355
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The `http` module `ServerResponse.prototype.writeHeader()` API is deprecated. Si prega di utilizzare `ServerResponse.prototype.writeHead()` al suo posto.

Il metodo `ServerResponse.prototype.writeHeader()` non è mai stato documentato come un'API ufficialmente supportata.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11349
    description: Runtime deprecation.
  - version: v6.12.0
    pr-url: https://github.com/nodejs/node/pull/10116
    description: A deprecation code has been assigned.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6063
    description: Documentation-only deprecation.
  - version: v0.11.15
    pr-url:
      - https://github.com/nodejs/node-v0.x-archive/pull/8695
      - https://github.com/nodejs/node-v0.x-archive/pull/8700
    description: Deprecation revoked.
  - version: v0.11.3
    commit: af80e7bc6e6f33c582eb1f7d37c7f5bbe9f910f7
    description: Runtime deprecation.
-->

Tipo: Runtime

L'API `tls.createSecurePair()` è stata deprecata nella documentazione in Node.js 0.11.3. Gli utenti dovrebbero utilizzare `tls.Socket` al suo posto.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC e NODE_REPL_MODE=magic
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19187
    description: End-of-Life.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11599
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

La costante `REPL_MODE_MAGIC` del modulo `repl`, utilizzata per l'opzione `replMode`, è stata rimossa. Il suo comportamento è stato funzionalmente identico a quello di `REPL_MODE_SLOPPY` dalla versione Node.js 6.0.0, quando è stata importata la version V8 5.0. Si prega di utilizzare `REPL_MODE_SLOPPY` al suo posto.

La variabile d'ambiente `NODE_REPL_MODE` viene utilizzata per impostare l'opzione `replMode` sottostante di una sessione `node` interattiva. Anche il suo valore, `magic`, viene rimosso. Si prega di utilizzare `sloppy` al suo posto.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10941
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The `http` module `outgoingMessage._headers` and `outgoingMessage._headerNames` properties are deprecated. Use one of the public methods (e.g. `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) for working with outgoing headers.

Le proprietà `outgoingMessage._headers` e `outgoingMessage._headerNames` non sono mai state documentate come proprietà ufficialmente supportate.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10941
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The `http` module `OutgoingMessage.prototype._renderHeaders()` API is deprecated.

La proprietà `OutgoingMessage.prototype._renderHeaders` non è mai stata documentata come un'API ufficialmente supportata.

<a id="DEP0068"></a>

### DEP0068: node debug
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11441
    description: Runtime deprecation.
-->

Tipo: Runtime

`node debug` corrisponde al debugger CLI legacy che è stato sostituito con un debugger CLI basato sul V8-inspector disponibile tramite `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/13295
    description: End-of-Life.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/12815
    description: Runtime deprecation.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12243
    description: Documentation-only deprecation.
-->

Tipo: End-of-Life

DebugContext è stato rimosso in V8 e non è disponibile nelle versioni Node.js 10+.

DebugContext era un'API sperimentale.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14414
    description: End-of-Life.
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Runtime deprecation.
-->

Tipo: End-of-Life

`async_hooks.currentId()` è stato rinominato in `async_hooks.executionAsyncId()` per maggiore chiarezza.

Questa modifica è stata fatta mentre `async_hooks` era un'API sperimentale.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14414
    description: End-of-Life.
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Runtime deprecation.
-->

Tipo: End-of-Life

`async_hooks.triggerId()` è stato rinominato in `async_hooks.triggerAsyncId()` per maggiore chiarezza.

Questa modifica è stata fatta mentre `async_hooks` era un'API sperimentale.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14414
    description: End-of-Life.
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Runtime deprecation.
-->

Tipo: End-of-Life

`async_hooks.AsyncResource.triggerId()` è stato rinominato in `async_hooks.AsyncResource.triggerAsyncId()` per maggiore chiarezza.

Questa modifica è stata fatta mentre `async_hooks` era un'API sperimentale.

<a id="DEP0073"></a>

### DEP0073: Diverse proprietà interne di net.Server
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17141
    description: End-of-Life.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14449
    description: Runtime deprecation.
-->

Tipo: End-of-Life

Accessing several internal, undocumented properties of `net.Server` instances with inappropriate names is deprecated.

Poiché l'API originale non era documentata e in genere non era utile per il codice non-interno, non viene fornita nessun'API sostitutiva.

<a id="DEP0074"></a>

### DEP0074: REPLServer.bufferedCommand
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13687
    description: Runtime deprecation.
-->

Tipo: Runtime

La proprietà `REPLServer.bufferedCommand` è stata deprecata a favore di [`REPLServer.clearBufferedCommand()`][].

<a id="DEP0075"></a>

### DEP0075: REPLServer.parseREPLKeyword()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14223
    description: Runtime deprecation.
-->

Tipo: Runtime

`REPLServer.parseREPLKeyword()` è stato rimosso dalla visibilità dell'userland.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14249
    description: Runtime deprecation.
  - version: v8.6.0
    pr-url: https://github.com/nodejs/node/pull/14245
    description: Documentation-only deprecation.
-->

Tipo: Runtime

`tls.parseCertString()` è un banale aiutante per il parsing reso pubblico per errore. Questa funzione può essere generalmente sostituita con:

```js
const querystring = require('querystring');
querystring.parse(str, '\n', '=');
```

Questa funzione non è completamente equivalente a `querystring.parse()`. Ad esempio una differenza è che `querystring.parse()` esegue la decodifica url:

```sh
> querystring.parse('%E5%A5%BD=1', '\n', '=');
{ '好': '1' }
> tls.parseCertString('%E5%A5%BD=1');
{ '%E5%A5%BD': '1' }
```

<a id="DEP0077"></a>

### DEP0077: Module.\_debug()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13948
    description: Runtime deprecation.
-->

Tipo: Runtime

`Module._debug()` is deprecated.

La funzione `Module._debug()` non è mai stata documentata come un'API ufficialmente supportata.

<a id="DEP0078"></a>

### DEP0078: REPLServer.turnOffEditorMode()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15136
    description: Runtime deprecation.
-->

Tipo: Runtime

`REPLServer.turnOffEditorMode()` è stato rimosso dalla visibilità dell'userland.

<a id="DEP0079"></a>

### DEP0079: Funzione di ispezione personalizzata sugli Object tramite .inspect()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16393
    description: Runtime deprecation.
  - version: v8.7.0
    pr-url: https://github.com/nodejs/node/pull/15631
    description: Documentation-only deprecation.
-->

Tipo: Runtime

L'utilizzo di una proprietà chiamata `inspect` su un object per specificare una funzione di ispezione personalizzata per [`util.inspect()`][] è deprecato/obsoleto. Utilizza [`util.inspect.custom`][] al suo posto. Per la retro-compatibilità con le versioni di Node.js precedenti alla versione 6.4.0, è possibile specificare entrambi.

<a id="DEP0080"></a>

### DEP0080: path.\_makeLong()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14956
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Il `path._makeLong()` interno non era destinato all'utilizzo pubblico. Tuttavia, i moduli userland lo hanno trovato utile. The internal API is deprecated and replaced with an identical, public `path.toNamespacedPath()` method.

<a id="DEP0081"></a>

### DEP0081: fs.truncate() utilizzando un file descriptor
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15990
    description: Runtime deprecation.
-->

Tipo: Runtime

`fs.truncate()` `fs.truncateSync()` usage with a file descriptor is deprecated. Si prega di utilizzare `fs.ftruncate()` o `fs.ftruncateSync()` per lavorare con i file descriptor.

<a id="DEP0082"></a>

### DEP0082: REPLServer.prototype.memory()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/16242
    description: Runtime deprecation.
-->

Tipo: Runtime

`REPLServer.prototype.memory()` è necessario solo per la meccanica interna del `REPLServer` stesso. Non utilizzare questa funzione.

<a id="DEP0083"></a>

### DEP0083: Disattivazione di ECDH impostando ecdhCurve su false
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19794
    description: End-of-Life.
  - version: v9.2.0
    pr-url: https://github.com/nodejs/node/pull/16130
    description: Runtime deprecation.
-->

Type: End-of-Life.

L'opzione `ecdhCurve` su `tls.createSecureContext()` e `tls.TLSSocket` potrebbe essere impostata su `false` per disabilitare completamente ECDH esclusivamente sul server. This mode was deprecated in preparation for migrating to OpenSSL 1.1.0 and consistency with the client and is now unsupported. Utilizza il parametro `ciphers` al suo posto.

<a id="DEP0084"></a>

### DEP0084: richiesta di dipendenze interne in bundle
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16392
    description: Runtime deprecation.
-->

Tipo: Runtime

A partire dalle versioni Node.js 4.4.0 e 5.2.0, diversi moduli destinati esclusivamente all'utilizzo interno vengono erroneamente esposti al codice utente tramite `require()`. Questi moduli sono:

- `v8/tools/codemap`
- `v8/tools/consarray`
- `v8/tools/csvparser`
- `v8/tools/logreader`
- `v8/tools/profile_view`
- `v8/tools/profile`
- `v8/tools/SourceMap`
- `v8/tools/splaytree`
- `v8/tools/tickprocessor-driver`
- `v8/tools/tickprocessor`
- `node-inspect/lib/_inspect` (dalla 7.6.0)
- `node-inspect/lib/internal/inspect_client` (dalla 7.6.0)
- `node-inspect/lib/internal/inspect_repl` (dalla 7.6.0)

I moduli `v8/*` non hanno esportazioni e, se non importati in un ordine specifico, genererebbero degli errori. In quanto tali, non esistono praticamente casi di utilizzo legittimi per importarli tramite `require()`.

D'altra parte, `node-inspect` potrebbe essere installato localmente tramite un gestore di pacchetti, in quanto è pubblicato sul registro npm con lo stesso nome. Se installato, non è necessaria nessuna modifica del codice sorgente.

<a id="DEP0085"></a>

### DEP0085: AsyncHooks Sensitive API
<!-- YAML
changes:
  - version: 10.0.0
    pr-url: https://github.com/nodejs/node/pull/17147
    description: End-of-Life.
  - version:
    - v8.10.0
    - v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16972
    description: Runtime deprecation.
-->

Tipo: End-of-Life

L'API AsyncHooks Sensitive non è mai stata documentata e ha avuto vari problemi minori. (See <https://github.com/nodejs/node/issues/15572>.) Use the `AsyncResource` API instead.

<a id="DEP0086"></a>

### DEP0086: Rimuove runInAsyncIdScope
<!-- YAML
changes:
  - version: 10.0.0
    pr-url: https://github.com/nodejs/node/pull/17147
    description: End-of-Life.
  - version:
    - v8.10.0
    - v9.4.0
    pr-url: https://github.com/nodejs/node/pull/16972
    description: Runtime deprecation.
-->

Tipo: End-of-Life

`runInAsyncIdScope` non emette l'evento `'before'` o l'evento `'after'` e ciò può causare un sacco di problemi. See <https://github.com/nodejs/node/issues/14328> for more details.

<a id="DEP0089"></a>

### DEP0089: require('assert')
<!-- YAML
changes:
  - version:
      - v9.9.0
      - v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17002
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

L'importazione diretta dell'assert non è consigliata in quanto le funzioni esposte utilizzano controlli di uguaglianza poco dettagliati. Utilizza `require('assert').strict` al suo posto. L'API è la stessa del legacy assert, ma userà sempre controlli di uguaglianza rigorosi.

<a id="DEP0090"></a>

### DEP0090: Lunghezze degli authentication tag di GCM non valide
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18017
    description: Runtime deprecation.
-->

Tipo: Runtime

Node.js supporta tutte le lunghezze accettate da OpenSSL degli authentication tag di GCM quando viene chiamato [`decipher.setAuthTag()`][]. Questo comportamento cambierà in una versione futura a cui saranno consentite solo lunghezze degli authentication tag corrispondenti a 128, 120, 112, 104, 96, 64 e 32 bit. Authentication tags whose length is not included in this list will be considered invalid in compliance with [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

<a id="DEP0091"></a>

### DEP0091: crypto.DEFAULT_ENCODING
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18333
    description: Runtime deprecation.
-->

Tipo: Runtime

La proprietà [`crypto.DEFAULT_ENCODING`][] è deprecata/obsoleta.

<a id="DEP0092"></a>

### DEP0092: livello superiore `this` associato a `module.exports`
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16878
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Assegnare le proprietà al livello superiore `this` come alternativa a `module.exports` è deprecato/obsoleto. Gli sviluppatori dovrebbero utilizzare al suo posto `exports` oppure `module.exports`.

<a id="DEP0093"></a>

### DEP0093: crypto.fips è deprecato/obsoleto e sostituito.
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18335
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

La proprietà [`crypto.fips`][] è deprecata/obsoleta. Si prega di utilizzare al suo posto `crypto.setFips()` e `crypto.getFips()`.

<a id="DEP0094"></a>

### DEP0094: Utilizzare `assert.fail()` con più di un argomento.
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18418
    description: Runtime deprecation.
-->

Tipo: Runtime

L'utilizzo di `assert.fail()` con più di un argomento è deprecato/obsoleto. Utilizza `assert.fail()` con un solo argomento oppure utilizza un metodo diverso di modulo `assert`.

<a id="DEP0095"></a>

### DEP0095: timers.enroll()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18066
    description: Runtime deprecation.
-->

Tipo: Runtime

`timers.enroll()` è deprecato/obsoleto. Si prega di utilizzare al suo posto [`setTimeout()`][] oppure [`setInterval()`][] i quali sono documentati pubblicamente.

<a id="DEP0096"></a>

### DEP0096: timers.unenroll()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18066
    description: Runtime deprecation.
-->

Tipo: Runtime

`timers.unenroll()` è deprecato/obsoleto. Si prega di utilizzare al suo posto [`clearTimeout()`][] oppure [`clearInterval()`][] i quali sono documentati pubblicamente.

<a id="DEP0097"></a>

### DEP0097: MakeCallback con la proprietà domain
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17417
    description: Runtime deprecation.
-->

Tipo: Runtime

Gli utenti di `MakeCallback` che aggiungono la proprietà `domain` per portare contesto, dovrebbero iniziare a utilizzare la variante `async_context` di `MakeCallback` o `CallbackScope` oppure la classe di livello superiore `AsyncResource`.

<a id="DEP0098"></a>

### DEP0098: Le API AsyncResource.emitBefore e AsyncResource.emitAfter dell'AsyncHooks Embedder
<!-- YAML
changes:
  - version:
    - v8.12.0
    - v9.6.0
    - v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18632
    description: Runtime deprecation.
-->

Tipo: Runtime

L'embedded API fornita da AsyncHooks espone i metodi `.emitBefore()` ed `.emitAfter()` i quali sono molto facili da utilizzare in modo errato e possono portare a errori irreversibili.

Utilizza al suo posto l'API [`asyncResource.runInAsyncScope()`][] che fornisce un'alternativa molto più sicura e più conveniente. See <https://github.com/nodejs/node/pull/18513> for more details.

<a id="DEP0099"></a>

### DEP0099: async context-unaware node::MakeCallback C++ API
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18632
    description: Compile-time deprecation.
-->

Tipo: Compile-time

Alcune versioni di API `node::MakeCallback` disponibili per i moduli nativi sono deprecate/obsolete. Si prega di utilizzare le versioni delle API che accettano un parametro `async_context`.

<a id="DEP0100"></a>

### DEP0100: process.assert()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18666
    description: Runtime deprecation.
  - version: v0.3.7
    description: Documentation-only deprecation.
-->

Tipo: Runtime

`process.assert()` è deprecato/obsoleto. Si prega di utilizzare il modulo [`assert`][] al suo posto.

Questa non è mai stata una funzionalità documentata.

<a id="DEP0101"></a>

### DEP0101: --with-lttng
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18982
    description: End-of-Life.
-->

Tipo: End-of-Life

L'opzione compile-time `--with-lttng` è stata rimossa.

<a id="DEP0102"></a>

### DEP0102: Utilizzare `noAssert` nelle operazioni Buffer#(read|write).
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: End-of-Life.
-->

Tipo: End-of-Life

L'utilizzo dell'argomento `noAssert` non ha più alcuna funzionalità. Tutti gli input saranno verificati, non importa se un input è impostato su true oppure no. Saltare la verifica potrebbe causare errori e arresti difficili da trovare.

<a id="DEP0103"></a>

### DEP0103: i typecheck process.binding('util').is[...]
<!-- YAML
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/22004
    description: Superseded by [DEP0111](#DEP0111).
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18415
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only (supporta [`--pending-deprecation`][])

Generalmente l'utilizzo di `process.binding()` dovrebbe essere evitato. In particolare i metodi di typecheck possono essere sostituiti utilizzando [`util.types`][].

This deprecation has been superseded by the deprecation of the `process.binding()` API ([DEP0111](#DEP0111)).

<a id="DEP0104"></a>

### DEP0104: coercizione della stringa process.env
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18990
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only (supporta [`--pending-deprecation`][])

When assigning a non-string property to [`process.env`][], the assigned value is implicitly converted to a string. This behavior is deprecated if the assigned value is not a string, boolean, or number. In the future, such assignment may result in a thrown error. Please convert the property to a string before assigning it to `process.env`.

<a id="DEP0105"></a>

### DEP0105: decipher.finaltol
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19353
    description: Runtime deprecation.
-->

Tipo: Runtime

`decipher.finaltol()` has never been documented and is currently an alias for [`decipher.final()`][]. In the future, this API will likely be removed, and it is recommended to use [`decipher.final()`][] instead.

<a id="DEP0106"></a>

### DEP0106: crypto.createCipher e crypto.createDecipher
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19343
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Using [`crypto.createCipher()`][] and [`crypto.createDecipher()`][] should be avoided as they use a weak key derivation function (MD5 with no salt) and static initialization vectors. It is recommended to derive a key using [`crypto.pbkdf2()`][] or [`crypto.scrypt()`][] and to use [`crypto.createCipheriv()`][] and [`crypto.createDecipheriv()`][] to obtain the [`Cipher`][] and [`Decipher`][] objects respectively.

<a id="DEP0107"></a>

### DEP0107: tls.convertNPNProtocols()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19403
    description: Runtime deprecation.
-->

Tipo: Runtime

This was an undocumented helper function not intended for use outside Node.js core and obsoleted by the removal of NPN (Next Protocol Negotiation) support.

<a id="DEP0108"></a>

### DEP0108: zlib.bytesRead
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19414
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Deprecated alias for [`zlib.bytesWritten`][]. This original name was chosen because it also made sense to interpret the value as the number of bytes read by the engine, but is inconsistent with other streams in Node.js that expose values under these names.

<a id="DEP0110"></a>

### DEP0110: vm.Script cached data
<!-- YAML
changes:
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/20300
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The `produceCachedData` option is deprecated. Use [`script.createCachedData()`][] instead.

<a id="DEP0111"></a>

### DEP0111: process.binding()
<!-- YAML
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/22004
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

`process.binding()` is for use by Node.js internal code only.
