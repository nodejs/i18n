# API obsolete

<!--introduced_in=v7.7.0-->

<!-- type=misc -->

Node.js può deprecare delle API quando: (a) l'utilizzo dell'API è considerato poco sicuro, (b) è stata resa disponibile un'API alternativa migliorata oppure (c) sono previste interruzioni delle modifiche all'API in una futura versione principale.

Node.js utilizza tre tipi di Deprecazioni:

- Documentation-only
- Runtime
- End-of-Life

Una deprecazione Documentation-only è espressa solo nei documenti delle API di Node.js. Queste non generano effetti collaterali durante l'esecuzione di Node.js. Alcune deprecazioni Documentation-only attivano un avviso di runtime al loro avvio con il flag [`--pending-deprecation`][] (o la sua alternativa, la variabile d'ambiente `NODE_PENDING_DEPRECATION=1`), in modo simile alle deprecazioni Runtime che seguono. Le deprecazioni Documentation-only che supportano tale flag sono esplicitamente etichettate come tali nell'[elenco delle API deprecate/obsolete](#deprecations_list_of_deprecated_apis).

Una deprecazione Runtime genererà, in modo predefinito, un avviso di processo che verrà stampato su `stderr` la prima volta che viene utilizzata l'API deprecata/obsoleta. Quando viene utilizzato il flag `--throw-deprecation` della command-line, una deprecazione Runtime genenerà un'errore.

Una deprecazione End-of-Life viene utilizzata per identificare il codice che è stato rimosso o verrà presto rimosso da Node.js.

## Revocare le deprecazioni

A volte la deprecazione di un'API può essere annullata. In tali situazioni, questo documento verrà aggiornato con informazioni rilevanti per la decisione. Tuttavia, l'identificatore delle deprecazioni non verrà modificato.

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

Tipo: Runtime (supporta [`--pending-deprecation`][])

La funzione `Buffer()` e il constructor `new Buffer()` sono deprecati/obsoleti a causa di problemi di usabilità dell'API che potevano potenzialmente causare problemi accidentali di sicurezza.

In alternativa, si consiglia vivamente l'utilizzo dei seguenti metodi di costruzione dei `Buffer` object:

- [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Crea un `Buffer` con memoria *inizializzata*.
- [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Crea un `Buffer` con memoria *non inizializzata*.
- [`Buffer.allocUnsafeSlow(size)`][] - Crea un `Buffer` con memoria *non inizializzata*.
- [`Buffer.from(array)`][] - Crea un `Buffer` con una copia di `array`
- [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Crea un `Buffer` che esegue il wrapping dell'`arrayBuffer` specificato.
- [`Buffer.from(buffer)`][] - Crea un `Buffer` che copia `buffer`.
- [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Crea un `Buffer` che copia `string`.

A partire dalla v10.0.0, viene stampato un avviso di deprecazione in fase di esecuzione quando viene utilizzato `--pending-deprecation` o quando il codice chiamante si trova all'esterno di `node_modules` al fine di indirizzare meglio gli sviluppatori, piuttosto che gli utenti.

<a id="DEP0006"></a>

### DEP0006: child\_process options.customFds

Tipo: Runtime

All'interno dei metodi `spawn()`, `fork()`, ed `exec()` del modulo [`child_process`][], l'opzione `options.customFds` è deprecata/obsoleta. Al suo posto dovrebbe essere utilizzata l'opzione `options.stdio`.

<a id="DEP0007"></a>

### DEP0007: Sostituire il cluster worker.suicide con worker.exitedAfterDisconnect

Tipo: End-of-Life

In una versione precedente del `cluster` di Node.js è stata aggiunta una proprietà booleana con il nome `suicide` al `Worker` object. Lo scopo di questa proprietà era fornire un'indicazione su come e perché l'istanza `Worker` è stata chiusa. In Node.js 6.0.0, la vecchia proprietà è stata deprecata e sostituita con una nuova proprietà [`worker.exitedAfterDisconnect`][]. Il vecchio nome della proprietà non descriveva precisamente la semantica attuale ed era inutilmente eccessivo.

<a id="DEP0008"></a>

### DEP0008: require('constants')

Tipo: Documentation-only

Il modulo `constants` è deprecato/obsoleto. Quando si richiede l'accesso a costanti relative a specifici moduli incorporati di Node.js, gli sviluppatori dovrebbero fare riferimento alla proprietà `constants` esposta dal modulo relativo. Per esempio, `require('fs').constants` e `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 senza digest

Tipo: End-of-Life

L'utilizzoo dell'API [`crypto.pbkdf2()`][] senza specificare un digest è stato reso obsoleto in Node.js 6.0 poiché il metodo è stato impostato in modo predefinito per utilizzare il digest `'SHA1'` del quale si sconsiglia l'utilizzo. In precedenza, veniva stampato un avviso di deprecazione. A partire da Node.js 8.0.0, chiamare `crypto.pbkdf2()` o `crypto.pbkdf2Sync()` con un `digest` indefinito genererà un `TypeError`.

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

Tipo: End-of-Life

`Domain.dispose()` è stato rimosso. In alternativa puoi ripristinare le azioni esplicite I/O fallite tramite gli event handler degli errori impostati sul dominio.

<a id="DEP0013"></a>

### DEP0013: fs funzione asincrona senza callback

Tipo: End-of-Life

Chiamare una funzione asincrona senza un callback genera un `TypeError` da Node.js 10.0.0 in poi. (Vedi https://github.com/nodejs/node/pull/12562.)

<a id="DEP0014"></a>

### DEP0014: interfaccia fs.read legacy String

Tipo: End-of-Life

L'interfaccia [`fs.read()`][] legacy `String` è deprecata/obsoleta. In alternativa utilizza l'API `Buffer` come indicato nella documentazione.

<a id="DEP0015"></a>

### DEP0015: interfaccia fs.readSync legacy String

Tipo: End-of-Life

L'interfaccia [`fs.readSync()`][] legacy `String` è deprecata/obsoleta. In alternativa utilizza l'API `Buffer` come indicato nella documentazione.

<a id="DEP0016"></a>

### DEP0016: GLOBAL/root

Tipo: Runtime

Gli alias `GLOBAL` e `root` per la proprietà `global` sono stati deprecati e non dovrebbero più essere utilizzati.

<a id="DEP0017"></a>

### DEP0017: Intl.v8BreakIterator

Tipo: End-of-Life

`Intl.v8BreakIterator` era un'estensione non-standard ed è stata rimossa. Vedi [`Intl.Segmenter`](https://github.com/tc39/proposal-intl-segmenter).

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

Tipo: End-of-Life

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

Tipo: End-of-Life

La variabile d'ambiente `NODE_REPL_HISTORY_FILE` è stata rimossa. Si prega di utilizzare `NODE_REPL_HISTORY` al suo posto.

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

Type: Documentation-only

The [`util.isNull()`][] API has been deprecated.

<a id="DEP0051"></a>

### DEP0051: util.isNullOrUndefined()

Type: Documentation-only

The [`util.isNullOrUndefined()`][] API has been deprecated.

<a id="DEP0052"></a>

### DEP0052: util.isNumber()

Type: Documentation-only

The [`util.isNumber()`][] API has been deprecated.

<a id="DEP0053"></a>

### DEP0053 util.isObject()

Type: Documentation-only

The [`util.isObject()`][] API has been deprecated.

<a id="DEP0054"></a>

### DEP0054: util.isPrimitive()

Type: Documentation-only

The [`util.isPrimitive()`][] API has been deprecated.

<a id="DEP0055"></a>

### DEP0055: util.isRegExp()

Type: Documentation-only

The [`util.isRegExp()`][] API has been deprecated.

<a id="DEP0056"></a>

### DEP0056: util.isString()

Type: Documentation-only

The [`util.isString()`][] API has been deprecated.

<a id="DEP0057"></a>

### DEP0057: util.isSymbol()

Type: Documentation-only

The [`util.isSymbol()`][] API has been deprecated.

<a id="DEP0058"></a>

### DEP0058: util.isUndefined()

Type: Documentation-only

The [`util.isUndefined()`][] API has been deprecated.

<a id="DEP0059"></a>

### DEP0059: util.log()

Type: Documentation-only

The [`util.log()`][] API has been deprecated.

<a id="DEP0060"></a>

### DEP0060: util.\_extend()

Type: Documentation-only

The [`util._extend()`][] API has been deprecated.

<a id="DEP0061"></a>

### DEP0061: fs.SyncWriteStream

Type: Runtime

The `fs.SyncWriteStream` class was never intended to be a publicly accessible API. No alternative API is available. Please use a userland alternative.

<a id="DEP0062"></a>

### DEP0062: node --debug

Type: Runtime

`--debug` activates the legacy V8 debugger interface, which has been removed as of V8 5.8. It is replaced by Inspector which is activated with `--inspect` instead.

<a id="DEP0063"></a>

### DEP0063: ServerResponse.prototype.writeHeader()

Type: Documentation-only

The `http` module `ServerResponse.prototype.writeHeader()` API has been deprecated. Please use `ServerResponse.prototype.writeHead()` instead.

The `ServerResponse.prototype.writeHeader()` method was never documented as an officially supported API.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()

Type: Runtime

The `tls.createSecurePair()` API was deprecated in documentation in Node.js 0.11.3. Users should use `tls.Socket` instead.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC and NODE_REPL_MODE=magic

Type: End-of-Life

The `repl` module's `REPL_MODE_MAGIC` constant, used for `replMode` option, has been removed. Its behavior has been functionally identical to that of `REPL_MODE_SLOPPY` since Node.js 6.0.0, when V8 5.0 was imported. Please use `REPL_MODE_SLOPPY` instead.

The `NODE_REPL_MODE` environment variable is used to set the underlying `replMode` of an interactive `node` session. Its value, `magic`, is also removed. Please use `sloppy` instead.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames

Type: Documentation-only

The `http` module `outgoingMessage._headers` and `outgoingMessage._headerNames` properties have been deprecated. Please instead use one of the public methods (e.g. `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) for working with outgoing headers.

The `outgoingMessage._headers` and `outgoingMessage._headerNames` properties were never documented as officially supported properties.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders

Type: Documentation-only

The `http` module `OutgoingMessage.prototype._renderHeaders()` API has been deprecated.

The `OutgoingMessage.prototype._renderHeaders` property was never documented as an officially supported API.

<a id="DEP0068"></a>

### DEP0068: node debug

Type: Runtime

`node debug` corresponds to the legacy CLI debugger which has been replaced with a V8-inspector based CLI debugger available through `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)

Type: End-of-Life

DebugContext has been removed in V8 and is not available in Node.js 10+.

DebugContext was an experimental API.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()

Type: End-of-Life

`async_hooks.currentId()` was renamed to `async_hooks.executionAsyncId()` for clarity.

This change was made while `async_hooks` was an experimental API.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()

Type: End-of-Life

`async_hooks.triggerId()` was renamed to `async_hooks.triggerAsyncId()` for clarity.

This change was made while `async_hooks` was an experimental API.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()

Type: End-of-Life

`async_hooks.AsyncResource.triggerId()` was renamed to `async_hooks.AsyncResource.triggerAsyncId()` for clarity.

This change was made while `async_hooks` was an experimental API.

<a id="DEP0073"></a>

### DEP0073: Several internal properties of net.Server

Type: End-of-Life

Accessing several internal, undocumented properties of `net.Server` instances with inappropriate names has been deprecated.

As the original API was undocumented and not generally useful for non-internal code, no replacement API is provided.

<a id="DEP0074"></a>

### DEP0074: REPLServer.bufferedCommand

Type: Runtime

The `REPLServer.bufferedCommand` property was deprecated in favor of [`REPLServer.clearBufferedCommand()`][].

<a id="DEP0075"></a>

### DEP0075: REPLServer.parseREPLKeyword()

Type: Runtime

`REPLServer.parseREPLKeyword()` was removed from userland visibility.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()

Type: Runtime

`tls.parseCertString()` is a trivial parsing helper that was made public by mistake. This function can usually be replaced with:

```js
const querystring = require('querystring');
querystring.parse(str, '\n', '=');
```

This function is not completely equivalent to `querystring.parse()`. One difference is that `querystring.parse()` does url decoding:

```sh
> querystring.parse('%E5%A5%BD=1', '\n', '=');
{ '好': '1' }
> tls.parseCertString('%E5%A5%BD=1');
{ '%E5%A5%BD': '1' }
```

<a id="DEP0077"></a>

### DEP0077: Module.\_debug()

Type: Runtime

`Module._debug()` has been deprecated.

The `Module._debug()` function was never documented as an officially supported API.

<a id="DEP0078"></a>

### DEP0078: REPLServer.turnOffEditorMode()

Type: Runtime

`REPLServer.turnOffEditorMode()` was removed from userland visibility.

<a id="DEP0079"></a>

### DEP0079: Custom inspection function on Objects via .inspect()

Type: Runtime

Using a property named `inspect` on an object to specify a custom inspection function for [`util.inspect()`][] is deprecated. Use [`util.inspect.custom`][] instead. For backward compatibility with Node.js prior to version 6.4.0, both may be specified.

<a id="DEP0080"></a>

### DEP0080: path.\_makeLong()

Type: Documentation-only

The internal `path._makeLong()` was not intended for public use. However, userland modules have found it useful. The internal API has been deprecated and replaced with an identical, public `path.toNamespacedPath()` method.

<a id="DEP0081"></a>

### DEP0081: fs.truncate() using a file descriptor

Type: Runtime

`fs.truncate()` `fs.truncateSync()` usage with a file descriptor has been deprecated. Please use `fs.ftruncate()` or `fs.ftruncateSync()` to work with file descriptors.

<a id="DEP0082"></a>

### DEP0082: REPLServer.prototype.memory()

Type: Runtime

`REPLServer.prototype.memory()` is only necessary for the internal mechanics of the `REPLServer` itself. Do not use this function.

<a id="DEP0083"></a>

### DEP0083: Disabling ECDH by setting ecdhCurve to false

Type: Runtime

The `ecdhCurve` option to `tls.createSecureContext()` and `tls.TLSSocket` could be set to `false` to disable ECDH entirely on the server only. This mode is deprecated in preparation for migrating to OpenSSL 1.1.0 and consistency with the client. Use the `ciphers` parameter instead.

<a id="DEP0084"></a>

### DEP0084: requiring bundled internal dependencies

Type: Runtime

Since Node.js versions 4.4.0 and 5.2.0, several modules only intended for internal usage are mistakenly exposed to user code through `require()`. These modules are:

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
- `node-inspect/lib/_inspect` (from 7.6.0)
- `node-inspect/lib/internal/inspect_client` (from 7.6.0)
- `node-inspect/lib/internal/inspect_repl` (from 7.6.0)

The `v8/*` modules do not have any exports, and if not imported in a specific order would in fact throw errors. As such there are virtually no legitimate use cases for importing them through `require()`.

On the other hand, `node-inspect` may be installed locally through a package manager, as it is published on the npm registry under the same name. No source code modification is necessary if that is done.

<a id="DEP0085"></a>

### DEP0085: AsyncHooks Sensitive API

Type: End-of-Life

The AsyncHooks Sensitive API was never documented and had various minor issues. (See https://github.com/nodejs/node/issues/15572.) Use the `AsyncResource` API instead.

<a id="DEP0086"></a>

### DEP0086: Remove runInAsyncIdScope

Type: End-of-Life

`runInAsyncIdScope` doesn't emit the `'before'` or `'after'` event and can thus cause a lot of issues. See https://github.com/nodejs/node/issues/14328 for more details.

<a id="DEP0089"></a>

### DEP0089: require('assert')

Type: Documentation-only

Importing assert directly is not recommended as the exposed functions will use loose equality checks. Use `require('assert').strict` instead. The API is the same as the legacy assert but it will always use strict equality checks.

<a id="DEP0090"></a>

### DEP0090: Invalid GCM authentication tag lengths

Type: Runtime

Node.js supports all GCM authentication tag lengths which are accepted by OpenSSL when calling [`decipher.setAuthTag()`][]. This behavior will change in a future version at which point only authentication tag lengths of 128, 120, 112, 104, 96, 64, and 32 bits will be allowed. Authentication tags whose length is not included in this list will be considered invalid in compliance with [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

<a id="DEP0091"></a>

### DEP0091: crypto.DEFAULT_ENCODING

Type: Runtime

The [`crypto.DEFAULT_ENCODING`][] property is deprecated.

<a id="DEP0092"></a>

### DEP0092: Top-level `this` bound to `module.exports`

Type: Documentation-only

Assigning properties to the top-level `this` as an alternative to `module.exports` is deprecated. Developers should use `exports` or `module.exports` instead.

<a id="DEP0093"></a>

### DEP0093: crypto.fips is deprecated and replaced.

Type: Documentation-only

The [`crypto.fips`][] property is deprecated. Please use `crypto.setFips()` and `crypto.getFips()` instead.

<a id="DEP0094"></a>

### DEP0094: Using `assert.fail()` with more than one argument.

Type: Runtime

Using `assert.fail()` with more than one argument is deprecated. Use `assert.fail()` with only one argument or use a different `assert` module method.

<a id="DEP0095"></a>

### DEP0095: timers.enroll()

Type: Runtime

`timers.enroll()` is deprecated. Please use the publicly documented [`setTimeout()`][] or [`setInterval()`][] instead.

<a id="DEP0096"></a>

### DEP0096: timers.unenroll()

Type: Runtime

`timers.unenroll()` is deprecated. Please use the publicly documented [`clearTimeout()`][] or [`clearInterval()`][] instead.

<a id="DEP0097"></a>

### DEP0097: MakeCallback with domain property

Type: Runtime

Users of `MakeCallback` that add the `domain` property to carry context, should start using the `async_context` variant of `MakeCallback` or `CallbackScope`, or the high-level `AsyncResource` class.

<a id="DEP0098"></a>

### DEP0098: AsyncHooks Embedder AsyncResource.emitBefore and AsyncResource.emitAfter APIs

Type: Runtime

The embedded API provided by AsyncHooks exposes `.emitBefore()` and `.emitAfter()` methods which are very easy to use incorrectly which can lead to unrecoverable errors.

Use [`asyncResource.runInAsyncScope()`][] API instead which provides a much safer, and more convenient, alternative. See https://github.com/nodejs/node/pull/18513 for more details.

<a id="DEP0099"></a>

### DEP0099: async context-unaware node::MakeCallback C++ APIs

Type: Compile-time

Certain versions of `node::MakeCallback` APIs available to native modules are deprecated. Please use the versions of the API that accept an `async_context` parameter.

<a id="DEP0100"></a>

### DEP0100: process.assert()

Type: Runtime

`process.assert()` is deprecated. Please use the [`assert`][] module instead.

This was never a documented feature.

<a id="DEP0101"></a>

### DEP0101: --with-lttng

Type: End-of-Life

The `--with-lttng` compile-time option has been removed.

<a id="DEP0102"></a>

### DEP0102: Using `noAssert` in Buffer#(read|write) operations.

Type: End-of-Life

Using the `noAssert` argument has no functionality anymore. All input is going to be verified, no matter if it is set to true or not. Skipping the verification could lead to hard to find errors and crashes.

<a id="DEP0103"></a>

### DEP0103: process.binding('util').is[...] typechecks

Type: Documentation-only (supports [`--pending-deprecation`][])

Using `process.binding()` in general should be avoided. The type checking methods in particular can be replaced by using [`util.types`][].

<a id="DEP0104"></a>

### DEP0104: process.env string coercion

Type: Documentation-only (supports [`--pending-deprecation`][])

When assigning a non-string property to [`process.env`][], the assigned value is implicitly converted to a string. This behavior is deprecated if the assigned value is not a string, boolean, or number. In the future, such assignment may result in a thrown error. Please convert the property to a string before assigning it to `process.env`.

<a id="DEP0105"></a>

### DEP0105: decipher.finaltol

Type: Runtime

`decipher.finaltol()` has never been documented and is currently an alias for [`decipher.final()`][]. In the future, this API will likely be removed, and it is recommended to use [`decipher.final()`][] instead.

<a id="DEP0106"></a>

### DEP0106: crypto.createCipher and crypto.createDecipher

Type: Documentation-only

Using [`crypto.createCipher()`][] and [`crypto.createDecipher()`][] should be avoided as they use a weak key derivation function (MD5 with no salt) and static initialization vectors. It is recommended to derive a key using [`crypto.pbkdf2()`][] and to use [`crypto.createCipheriv()`][] and [`crypto.createDecipheriv()`][] to obtain the [`Cipher`][] and [`Decipher`][] objects respectively.

<a id="DEP0107"></a>

### DEP0107: tls.convertNPNProtocols()

Type: Runtime

This was an undocumented helper function not intended for use outside Node.js core and obsoleted by the removal of NPN (Next Protocol Negotiation) support.

<a id="DEP0108"></a>

### DEP0108: zlib.bytesRead

Type: Documentation-only

Deprecated alias for [`zlib.bytesWritten`][]. This original name was chosen because it also made sense to interpret the value as the number of bytes read by the engine, but is inconsistent with other streams in Node.js that expose values under these names.