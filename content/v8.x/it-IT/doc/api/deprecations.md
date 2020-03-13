# API obsolete

<!--introduced_in=v7.7.0-->

Node.js può deprecare delle API quando: (a) l'utilizzo dell'API è considerato poco sicuro, (b) è stata resa disponibile un'API alternativa migliorata oppure (c) sono previste interruzioni delle modifiche all'API in una futura versione principale.

Node.js utilizza tre tipi di Deprecazioni:

* Documentation-only
* Runtime
* End-of-Life

Una deprecazione Documentation-only è espressa solo nei documenti delle API di Node.js. Queste non generano effetti collaterali durante l'esecuzione di Node.js.

Una deprecazione Runtime genererà, in modo predefinito, un avviso di processo che verrà stampato su `stderr` la prima volta che viene utilizzata l'API deprecata/obsoleta. Quando viene utilizzato il flag `--throw-deprecation` della command-line, una deprecazione Runtime genenerà un'errore.

Una deprecazione End-of-Life viene utilizzata per identificare il codice che è stato rimosso o verrà presto rimosso da Node.js.

## Un-deprecation

From time-to-time the deprecation of an API may be reversed. Such action may happen in either a semver-minor or semver-major release. In tali situazioni, questo documento verrà aggiornato con informazioni rilevanti per la decisione. *However, the deprecation identifier will not be modified*.

## Elenco delle API Deprecate/Obsolete

<a id="DEP0001"></a>

### DEP0001: http.OutgoingMessage.prototype.flush

Tipo: Runtime

Il metodo `OutgoingMessage.prototype.flush()` è deprecato/obsoleto. Utilizza `OutgoingMessage.prototype.flushHeaders()` al suo posto.

<a id="DEP0002"></a>

### DEP0002: require('\_linklist')

Tipo: End-of-Life

Il modulo `_linklist` è deprecato/obsoleto. Si prega di utilizzare un'alternativa userland.

<a id="DEP0003"></a>

### DEP0003: \_writableState.buffer

Tipo: Runtime

La proprietà `_writableState.buffer` è deprecata/obsoleta. Utilizza il metodo `_writableState.getBuffer()` al suo posto.

<a id="DEP0004"></a>

### DEP0004: CryptoStream.prototype.readyState

Tipo: Documentation-only

La proprietà `CryptoStream.prototype.readyState` è deprecata/obsoleta e non dovrebbe essere utilizzata.

<a id="DEP0005"></a>

### DEP0005: Buffer() constructor

Tipo: Documentation-only

La funzione `Buffer()` e il constructor `new Buffer()` sono deprecati/obsoleti a causa di problemi di usabilità dell'API che potevano potenzialmente causare problemi accidentali di sicurezza.

In alternativa, si consiglia vivamente l'utilizzo dei seguenti metodi di costruzione dei `Buffer` object:

* [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Crea un `Buffer` con memoria *inizializzata*.
* [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.allocUnsafeSlow(size)`][] - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.from(array)`][] - Crea un `Buffer` con una copia di `array`
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Create a `Buffer` that wraps the given `arrayBuffer`.
* [`Buffer.from(buffer)`][] - Crea un `Buffer` che copia `buffer`.
* [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Create a `Buffer` that copies `string`.

<a id="DEP0006"></a>

### DEP0006: child\_process options.customFds

Tipo: Runtime

All'interno dei metodi `spawn()`, `fork()`, ed `exec()` del modulo [`child_process`][], l'opzione `options.customFds` è deprecata/obsoleta. Al suo posto dovrebbe essere utilizzata l'opzione `options.stdio`.

<a id="DEP0007"></a>

### DEP0007: cluster worker.suicide

Tipo: Runtime

Within the `cluster` module, the [`worker.suicide`][] property has been deprecated. Please use [`worker.exitedAfterDisconnect`][] instead.

<a id="DEP0008"></a>

### DEP0008: require('constants')

Tipo: Documentation-only

Il modulo `constants` è deprecato/obsoleto. Quando si richiede l'accesso a costanti relative a specifici moduli incorporati di Node.js, gli sviluppatori dovrebbero fare riferimento alla proprietà `constants` esposta dal modulo relativo. Per esempio, `require('fs').constants` e `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 senza digest

Type: End-of-life

L'utilizzoo dell'API [`crypto.pbkdf2()`][] senza specificare un digest è stato reso obsoleto in Node.js 6.0 poiché il metodo era stato impostato per utilizzare in modo predefinito il digest `'SHA1'` del quale si sconsiglia l'utilizzo. In precedenza, veniva stampato un avviso di deprecazione. A partire da Node.js 8.0.0, chiamare `crypto.pbkdf2()` o `crypto.pbkdf2Sync()` con un `digest` indefinito genererà un `TypeError`.

<a id="DEP0010"></a>

### DEP0010: crypto.createCredentials

Tipo: Runtime

L'API [`crypto.createCredentials()`][] è deprecata/obsoleta. Si prega di utilizzare [`tls.createSecureContext()`][] al suo posto.

<a id="DEP0011"></a>

### DEP0011: crypto.Credentials

Tipo: Runtime

La classe `crypto.Credentials` è deprecata/obsoleta. Si prega di utilizzare [`tls.SecureContext`][] al suo posto.

<a id="DEP0012"></a>

### DEP0012: Domain.dispose

Tipo: Runtime

[`Domain.dispose()`][] is deprecated. In alternativa puoi ripristinare le azioni esplicite I/O fallite tramite gli event handler degli errori impostati sul dominio.

<a id="DEP0013"></a>

### DEP0013: fs funzione asincrona senza callback

Tipo: Runtime

Calling an asynchronous function without a callback is deprecated.

<a id="DEP0014"></a>

### DEP0014: interfaccia fs.read legacy String

Tipo: End-of-Life

The [`fs.read()`][] legacy String interface is deprecated. Use the Buffer API as mentioned in the documentation instead.

<a id="DEP0015"></a>

### DEP0015: interfaccia fs.readSync legacy String

Tipo: End-of-Life

The [`fs.readSync()`][] legacy String interface is deprecated. In alternativa utilizza l'API Buffer come indicato nella documentazione.

<a id="DEP0016"></a>

### DEP0016: GLOBAL/root

Tipo: Runtime

Gli alias `GLOBAL` e `root` per la proprietà `global` sono stati deprecati e non dovrebbero più essere utilizzati.

<a id="DEP0017"></a>

### DEP0017: Intl.v8BreakIterator

Tipo: Runtime

The `Intl.v8BreakIterator` is deprecated and will be removed or replaced soon.

<a id="DEP0018"></a>

### DEP0018: Promise rejection non gestiti

Tipo: Runtime

I promise rejection non gestiti sono deprecati/obsoleti. In futuro, i promise rejection che non vengono gestiti termineranno il processo Node.js con un valore di uscita diverso da zero.

<a id="DEP0019"></a>

### DEP0019: require('.') risolto al di fuori della directory

Tipo: Runtime

In alcuni casi, `require('.')` potrebbe risolversi al di fuori della directory del pacchetto. Questo comportamento è deprecato/obsoleto e verrà rimosso in una futura versione di Node.js.

<a id="DEP0020"></a>

### DEP0020: Server.connections

Tipo: Runtime

La proprietà [`Server.connections`][] è deprecata/obsoleta. Si prega di utilizzare il metodo [`Server.getConnections()`][] al suo posto.

<a id="DEP0021"></a>

### DEP0021: Server.listenFD

Tipo: Runtime

Il metodo `Server.listenFD()` è deprecato/obsoleto. Si prega di utilizzare [`Server.listen({fd: <number>})`][] al suo posto.

<a id="DEP0022"></a>

### DEP0022: os.tmpDir()

Tipo: Runtime

L'API `os.tmpDir()` è deprecata/obsoleta. Si prega di utilizzare [`os.tmpdir()`][] al suo posto.

<a id="DEP0023"></a>

### DEP0023: os.getNetworkInterfaces()

Tipo: Runtime

Il metodo `os.getNetworkInterfaces()` è deprecato/obsoleto. Si prega di utilizzare la proprietà [`os.networkInterfaces`][] al suo posto.

<a id="DEP0024"></a>

### DEP0024: REPLServer.prototype.convertToContext()

Tipo: Runtime

L'API `REPLServer.prototype.convertToContext()` è deprecata/obsoleta e non dovrebbe essere utilizzata.

<a id="DEP0025"></a>

### DEP0025: require('sys')

Tipo: Runtime

Il modulo `sys` è deprecato/obsoleto. Si prega di utilizzare il modulo [`util`][] al suo posto.

<a id="DEP0026"></a>

### DEP0026: util.print()

Tipo: Runtime

L'API [`util.print()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.log()`][] al suo posto.

<a id="DEP0027"></a>

### DEP0027: util.puts()

Tipo: Runtime

L'API [`util.puts()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.log()`][] al suo posto.

<a id="DEP0028"></a>

### DEP0028: util.debug()

Tipo: Runtime

L'API [`util.debug()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.error()`][] al suo posto.

<a id="DEP0029"></a>

### DEP0029: util.error()

Tipo: Runtime

L'API [`util.error()`][] è deprecata/obsoleta. Si prega di utilizzare [`console.error()`][] al suo posto.

<a id="DEP0030"></a>

### DEP0030: SlowBuffer

Tipo: Documentation-only

La classe [`SlowBuffer`][] è stata deprecata. Si prega di utilizzare [`Buffer.allocUnsafeSlow(size)`][] al suo posto.

<a id="DEP0031"></a>

### DEP0031: ecdh.setPublicKey()

Tipo: Documentation-only

Adesso il metodo [`ecdh.setPublicKey()`][] è deprecato/obsoleto poiché la sua inclusione nell'API è inutile.

<a id="DEP0032"></a>

### DEP0032: modulo domain

Tipo: Documentation-only

Il modulo [`domain`][] è deprecato/obsoleto e non dovrebbe essere utilizzato.

<a id="DEP0033"></a>

### DEP0033: EventEmitter.listenerCount()

Tipo: Documentation-only

L'API [`EventEmitter.listenerCount(emitter, eventName)`][] è stata deprecata. Si prega di utilizzare [`emitter.listenerCount(eventName)`][] al suo posto.

<a id="DEP0034"></a>

### DEP0034: fs.exists(path, callback)

Tipo: Documentation-only

L'API [`fs.exists(path, callback)`][] è stata deprecata. Si prega di utilizzare al suo posto [`fs.stat()`][] oppure [`fs.access()`][].

<a id="DEP0035"></a>

### DEP0035: fs.lchmod(path, mode, callback)

Tipo: Documentation-only

L'API [`fs.lchmod(path, mode, callback)`][] è stata deprecata.

<a id="DEP0036"></a>

### DEP0036: fs.lchmodSync(path, mode)

Tipo: Documentation-only

L'API [`fs.lchmodSync(path, mode)`][] è stata deprecata.

<a id="DEP0037"></a>

### DEP0037: fs.lchown(path, uid, gid, callback)

Tipo: Documentation-only

L'API [`fs.lchown(path, uid, gid, callback)`][] è stata deprecata.

<a id="DEP0038"></a>

### DEP0038: fs.lchownSync(path, uid, gid)

Tipo: Documentation-only

L'API [`fs.lchownSync(path, uid, gid)`][] è stata deprecata.

<a id="DEP0039"></a>

### DEP0039: require.extensions

Tipo: Documentation-only

La proprietà [`require.extensions`][] è stata deprecata.

<a id="DEP0040"></a>

### DEP0040: modulo punycode

Tipo: Documentation-only

Il modulo [`punycode`][] è stato deprecato. Si prega di utilizzare un'alternativa userland al suo posto.

<a id="DEP0041"></a>

### DEP0041: variabile d'ambiente NODE\_REPL\_HISTORY\_FILE

Tipo: Documentation-only

The `NODE_REPL_HISTORY_FILE` environment variable has been deprecated.

<a id="DEP0042"></a>

### DEP0042: tls.CryptoStream

Tipo: Documentation-only

La classe [`tls.CryptoStream`][] è stata deprecata. Si prega di utilizzare [`tls.TLSSocket`][] al suo posto.

<a id="DEP0043"></a>

### DEP0043: tls.SecurePair

Tipo: Documentation-only

La classe [`tls.SecurePair`][] è stata deprecata. Si prega di utilizzare [`tls.TLSSocket`][] al suo posto.

<a id="DEP0044"></a>

### DEP0044: util.isArray()

Tipo: Documentation-only

L'API [`util.isArray()`][] è stata deprecata. Si prega di utilizzare `Array.isArray()` al suo posto.

<a id="DEP0045"></a>

### DEP0045: util.isBoolean()

Tipo: Documentation-only

L'API [`util.isBoolean()`][] è stata deprecata.

<a id="DEP0046"></a>

### DEP0046: util.isBuffer()

Tipo: Documentation-only

L'API [`util.isBuffer()`][] è stata deprecata. Si prega di utilizzare [`Buffer.isBuffer()`][] al suo posto.

<a id="DEP0047"></a>

### DEP0047: util.isDate()

Tipo: Documentation-only

L'API [`util.isDate()`][] è stata deprecata.

<a id="DEP0048"></a>

### DEP0048: util.isError()

Tipo: Documentation-only

L'API [`util.isError()`][] è stata deprecata.

<a id="DEP0049"></a>

### DEP0049: util.isFunction()

Tipo: Documentation-only

L'API [`util.isFunction()`][] è stata deprecata.

<a id="DEP0050"></a>

### DEP0050: util.isNull()

Tipo: Documentation-only

L'API [`util.isNull()`][] è stata deprecata.

<a id="DEP0051"></a>

### DEP0051: util.isNullOrUndefined()

Tipo: Documentation-only

L'API [`util.isNullOrUndefined()`][] è stata deprecata.

<a id="DEP0052"></a>

### DEP0052: util.isNumber()

Tipo: Documentation-only

L'API [`util.isNumber()`][] è stata deprecata.

<a id="DEP0053"></a>

### DEP0053 util.isObject()

Tipo: Documentation-only

L'API [`util.isObject()`][] è stata deprecata.

<a id="DEP0054"></a>

### DEP0054: util.isPrimitive()

Tipo: Documentation-only

L'API [`util.isPrimitive()`][] è stata deprecata.

<a id="DEP0055"></a>

### DEP0055: util.isRegExp()

Tipo: Documentation-only

L'API [`util.isRegExp()`][] è stata deprecata.

<a id="DEP0056"></a>

### DEP0056: util.isString()

Tipo: Documentation-only

L'API [`util.isString()`][] è stata deprecata.

<a id="DEP0057"></a>

### DEP0057: util.isSymbol()

Tipo: Documentation-only

L'API [`util.isSymbol()`][] è stata deprecata.

<a id="DEP0058"></a>

### DEP0058: util.isUndefined()

Tipo: Documentation-only

L'API [`util.isUndefined()`][] è stata deprecata.

<a id="DEP0059"></a>

### DEP0059: util.log()

Tipo: Documentation-only

L'API [`util.log()`][] è stata deprecata.

<a id="DEP0060"></a>

### DEP0060: util.\_extend()

Tipo: Documentation-only

L'API [`util._extend()`][] è stata deprecata.

<a id="DEP0061"></a>

### DEP0061: fs.SyncWriteStream

Tipo: Runtime

La classe `fs.SyncWriteStream` non è mai stata concepita come un'API pubblicamente accessibile. Non è disponibile alcuna API alternativa. Si prega di utilizzare un'alternativa userland.

<a id="DEP0062"></a>

### DEP0062: node --debug

Tipo: Runtime

`--debug` attiva l'interfaccia legacy del debugger di V8, che è stata rimossa a partire dalla versione V8 5.8. In alternativa viene sostituito dall'Inspector che viene attivato con `--inspect`.

<a id="DEP0063"></a>

### DEP0063: ServerResponse.prototype.writeHeader()

Tipo: Documentation-only

L'API `ServerResponse.prototype.writeHeader()` del modulo `http` è stata deprecata. Si prega di utilizzare `ServerResponse.prototype.writeHead()` al suo posto.

*Note*: The `ServerResponse.prototype.writeHeader()` method was never documented as an officially supported API.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()

Tipo: Runtime

L'API `tls.createSecurePair()` è stata deprecata nella documentazione in Node.js 0.11.3. Gli utenti dovrebbero utilizzare `tls.Socket` al suo posto.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC e NODE_REPL_MODE=magic

Tipo: Documentation-only

The `repl` module's `REPL_MODE_MAGIC` constant, used for `replMode` option, has been deprecated. Its behavior has been functionally identical to that of `REPL_MODE_SLOPPY` since Node.js v6.0.0, when V8 5.0 was imported. Si prega di utilizzare `REPL_MODE_SLOPPY` al suo posto.

La variabile d'ambiente `NODE_REPL_MODE` viene utilizzata per impostare l'opzione `replMode` sottostante di una sessione `node` interattiva. Its default value, `magic`, is similarly deprecated in favor of `sloppy`.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames

Tipo: Documentation-only

Le proprietà `outgoingMessage._headers` e `outgoingMessage._headerNames` del modulo `http` sono state deprecate. Si prega di utilizzare al loro posto uno dei seguenti metodi pubblici (per esempio `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) per lavorare con intestazioni in uscita (outgoing headers).

*Note*: `outgoingMessage._headers` and `outgoingMessage._headerNames` were never documented as officially supported properties.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders

Tipo: Documentation-only

L'API `OutgoingMessage.prototype._renderHeaders()` del modulo `http` è stata deprecata.

*Note*: `OutgoingMessage.prototype._renderHeaders` was never documented as an officially supported API.

<a id="DEP0068"></a>

### DEP0068: node debug

Tipo: Runtime

`node debug` corrisponde al debugger CLI legacy che è stato sostituito con un debugger CLI basato sul V8-inspector disponibile tramite `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)

Tipo: Documentation-only

The DebugContext will be removed in V8 soon and will not be available in Node 10+.

*Note*: DebugContext was an experimental API.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()

Tipo: Runtime

`async_hooks.currentId()` è stato rinominato in `async_hooks.executionAsyncId()` per maggiore chiarezza.

*Note*: change was made while `async_hooks` was an experimental API.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()

Tipo: Runtime

`async_hooks.triggerId()` è stato rinominato in `async_hooks.triggerAsyncId()` per maggiore chiarezza.

*Note*: change was made while `async_hooks` was an experimental API.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()

Tipo: Runtime

`async_hooks.AsyncResource.triggerId()` è stato rinominato in `async_hooks.AsyncResource.triggerAsyncId()` per maggiore chiarezza.

*Note*: change was made while `async_hooks` was an experimental API.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()

Tipo: Documentation-only

`tls.parseCertString()` è un banale aiutante per il parsing reso pubblico per errore. Questa funzione può essere generalmente sostituita con:

```js
const querystring = require('querystring');
querystring.parse(str, '\n', '=');
```

*Note*: This function is not completely equivalent to `querystring.parse()`. Ad esempio una differenza è che `querystring.parse()` esegue la decodifica url:

```sh
> querystring.parse('%E5%A5%BD=1', '\n', '=');
{ '好': '1' }
> tls.parseCertString('%E5%A5%BD=1');
{ '%E5%A5%BD': '1' }
```

<a id="DEP0079"></a>

### DEP0079: Funzione di ispezione personalizzata sugli Object tramite .inspect()

Tipo: Documentation-only

L'utilizzo di una proprietà chiamata `inspect` su un object per specificare una funzione di ispezione personalizzata per [`util.inspect()`][] è deprecato/obsoleto. Utilizza [`util.inspect.custom`][] al suo posto. For backwards compatibility with Node.js prior to version 6.4.0, both may be specified.

<a id="DEP0085"></a>

### DEP0085: AsyncHooks Sensitive API

Tipo: Runtime

The AsyncHooks Sensitive API was never documented and had various of minor issues, see https://github.com/nodejs/node/issues/15572. Use the `AsyncResource` API instead.

<a id="DEP0086"></a>

### DEP0086: Rimuove runInAsyncIdScope

Tipo: Runtime

`runInAsyncIdScope` doesn't emit the `before` or `after` event and can thus cause a lot of issues. Vedi https://github.com/nodejs/node/issues/14328 per maggiori dettagli.

<a id="DEP0089"></a>

### DEP0089: require('assert')

Tipo: Documentation-only

L'importazione diretta dell'assert non è consigliata in quanto le funzioni esposte utilizzano controlli di uguaglianza poco dettagliati. Utilizza `require('assert').strict` al suo posto. L'API è la stessa del legacy assert, ma userà sempre controlli di uguaglianza rigorosi.

<a id="DEP0098"></a>

### DEP0098: AsyncHooks Embedder AsyncResource.emit{Before,After} APIs

Tipo: Runtime

The embedded API provided by AsyncHooks exposes emit{Before,After} methods which are very easy to use incorrectly which can lead to unrecoverable errors.

Utilizza al suo posto l'API [`asyncResource.runInAsyncScope()`][] che fornisce un'alternativa molto più sicura e più conveniente. Vedi https://github.com/nodejs/node/pull/18513 per maggiori dettagli.
