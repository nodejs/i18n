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

In una versione precedente del `cluster` di Node.js è stata aggiunta una proprietà booleana con il nome `suicide` al `Worker` object. Lo scopo di questa proprietà era fornire un'indicazione su come e perché l'istanza `Worker` è stata chiusa. In Node.js 6.0.0, la vecchia proprietà è stata deprecata e sostituita con una nuova proprietà [`worker.exitedAfterDisconnect`][]. Il vecchio nome della proprietà non descriveva precisamente l’effettiva semantica ed era inutilmente carico di emotività.

<a id="DEP0008"></a>

### DEP0008: require('constants')

Tipo: Documentation-only

Il modulo `constants` è deprecato/obsoleto. Quando si richiede l'accesso a costanti relative a specifici moduli incorporati di Node.js, gli sviluppatori dovrebbero fare riferimento alla proprietà `constants` esposta dal modulo relativo. Per esempio, `require('fs').constants` e `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 senza digest

Tipo: End-of-Life

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

Il metodo `ServerResponse.prototype.writeHeader()` non è mai stato documentato come un'API ufficialmente supportata.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()

Tipo: Runtime

L'API `tls.createSecurePair()` è stata deprecata nella documentazione in Node.js 0.11.3. Gli utenti dovrebbero utilizzare `tls.Socket` al suo posto.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC e NODE_REPL_MODE=magic

Tipo: End-of-Life

La costante `REPL_MODE_MAGIC` del modulo `repl`, utilizzata per l'opzione `replMode`, è stata rimossa. Il suo comportamento è stato funzionalmente identico a quello di `REPL_MODE_SLOPPY` dalla versione Node.js 6.0.0, quando è stata importata la version V8 5.0. Si prega di utilizzare `REPL_MODE_SLOPPY` al suo posto.

La variabile d'ambiente `NODE_REPL_MODE` viene utilizzata per impostare l'opzione `replMode` sottostante di una sessione `node` interattiva. Anche il suo valore, `magic`, viene rimosso. Si prega di utilizzare `sloppy` al suo posto.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames

Tipo: Documentation-only

Le proprietà `outgoingMessage._headers` e `outgoingMessage._headerNames` del modulo `http` sono state deprecate. Si prega di utilizzare al loro posto uno dei seguenti metodi pubblici (per esempio `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) per lavorare con intestazioni in uscita (outgoing headers).

Le proprietà `outgoingMessage._headers` e `outgoingMessage._headerNames` non sono mai state documentate come proprietà ufficialmente supportate.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders

Tipo: Documentation-only

L'API `OutgoingMessage.prototype._renderHeaders()` del modulo `http` è stata deprecata.

La proprietà `OutgoingMessage.prototype._renderHeaders` non è mai stata documentata come un'API ufficialmente supportata.

<a id="DEP0068"></a>

### DEP0068: node debug

Tipo: Runtime

`node debug` corrisponde al debugger CLI legacy che è stato sostituito con un debugger CLI basato sul V8-inspector disponibile tramite `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)

Tipo: End-of-Life

DebugContext è stato rimosso in V8 e non è disponibile nelle versioni Node.js 10+.

DebugContext era un'API sperimentale.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()

Tipo: End-of-Life

`async_hooks.currentId()` è stato rinominato in `async_hooks.executionAsyncId()` per maggiore chiarezza.

Questa modifica è stata fatta mentre `async_hooks` era un'API sperimentale.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()

Tipo: End-of-Life

`async_hooks.triggerId()` è stato rinominato in `async_hooks.triggerAsyncId()` per maggiore chiarezza.

Questa modifica è stata fatta mentre `async_hooks` era un'API sperimentale.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()

Tipo: End-of-Life

`async_hooks.AsyncResource.triggerId()` è stato rinominato in `async_hooks.AsyncResource.triggerAsyncId()` per maggiore chiarezza.

Questa modifica è stata fatta mentre `async_hooks` era un'API sperimentale.

<a id="DEP0073"></a>

### DEP0073: Diverse proprietà interne di net.Server

Tipo: End-of-Life

L'accesso a diverse proprietà interne non documentate di istanze `net.Server` con nomi inappropriati è stato deprecato.

Poiché l'API originale non era documentata e in genere non era utile per il codice non-interno, non viene fornita nessun'API sostitutiva.

<a id="DEP0074"></a>

### DEP0074: REPLServer.bufferedCommand

Tipo: Runtime

La proprietà `REPLServer.bufferedCommand` è stata deprecata a favore di [`REPLServer.clearBufferedCommand()`][].

<a id="DEP0075"></a>

### DEP0075: REPLServer.parseREPLKeyword()

Tipo: Runtime

`REPLServer.parseREPLKeyword()` è stato rimosso dalla visibilità dell'userland.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()

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

Tipo: Runtime

`Module._debug()` è stato deprecato.

La funzione `Module._debug()` non è mai stata documentata come un'API ufficialmente supportata.

<a id="DEP0078"></a>

### DEP0078: REPLServer.turnOffEditorMode()

Tipo: Runtime

`REPLServer.turnOffEditorMode()` è stato rimosso dalla visibilità dell'userland.

<a id="DEP0079"></a>

### DEP0079: Funzione di ispezione personalizzata sugli Object tramite .inspect()

Tipo: Runtime

L'utilizzo di una proprietà chiamata `inspect` su un object per specificare una funzione di ispezione personalizzata per [`util.inspect()`][] è deprecato/obsoleto. Utilizza [`util.inspect.custom`][] al suo posto. Per la retro-compatibilità con le versioni di Node.js precedenti alla versione 6.4.0, è possibile specificare entrambi.

<a id="DEP0080"></a>

### DEP0080: path.\_makeLong()

Tipo: Documentation-only

Il `path._makeLong()` interno non era destinato all'utilizzo pubblico. Tuttavia, i moduli userland lo hanno trovato utile. L'API interna è stata deprecata e sostituita con un `path.toNamespacedPath()` identico e pubblico.

<a id="DEP0081"></a>

### DEP0081: fs.truncate() utilizzando un file descriptor

Tipo: Runtime

L'utilizzo di `fs.truncate()` `fs.truncateSync()` con un con un file descriptor è stato deprecato. Si prega di utilizzare `fs.ftruncate()` o `fs.ftruncateSync()` per lavorare con i file descriptor.

<a id="DEP0082"></a>

### DEP0082: REPLServer.prototype.memory()

Tipo: Runtime

`REPLServer.prototype.memory()` è necessario solo per la meccanica interna del `REPLServer` stesso. Non utilizzare questa funzione.

<a id="DEP0083"></a>

### DEP0083: Disattivazione di ECDH impostando ecdhCurve su false

Tipo: Runtime

L'opzione `ecdhCurve` su `tls.createSecureContext()` e `tls.TLSSocket` potrebbe essere impostata su `false` per disabilitare completamente ECDH esclusivamente sul server. Questa modalità è deprecata/obsoleta in preparazione alla migrazione a OpenSSL 1.1.0 e alla coerenza con il client. Utilizza il parametro `ciphers` al suo posto.

<a id="DEP0084"></a>

### DEP0084: richiesta di dipendenze interne in bundle

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

Tipo: End-of-Life

L'API AsyncHooks Sensitive non è mai stata documentata e ha avuto vari problemi minori. (Vedi https://github.com/nodejs/node/issues/15572.) Utilizza l'API `AsyncResource` al suo posto.

<a id="DEP0086"></a>

### DEP0086: Rimuove runInAsyncIdScope

Tipo: End-of-Life

`runInAsyncIdScope` non emette l'evento `'before'` o l'evento `'after'` e ciò può causare un sacco di problemi. Vedi https://github.com/nodejs/node/issues/14328 per maggiori dettagli.

<a id="DEP0089"></a>

### DEP0089: require('assert')

Tipo: Documentation-only

L'importazione diretta dell'assert non è consigliata in quanto le funzioni esposte utilizzano controlli di uguaglianza poco dettagliati. Utilizza `require('assert').strict` al suo posto. L'API è la stessa del legacy assert, ma userà sempre controlli di uguaglianza rigorosi.

<a id="DEP0090"></a>

### DEP0090: Lunghezze degli authentication tag di GCM non valide

Tipo: Runtime

Node.js supporta tutte le lunghezze accettate da OpenSSL degli authentication tag di GCM quando viene chiamato [`decipher.setAuthTag()`][]. Questo comportamento cambierà in una versione futura a cui saranno consentite solo lunghezze degli authentication tag corrispondenti a 128, 120, 112, 104, 96, 64 e 32 bit. Gli authentication tag la cui lunghezza non è inclusa in questo elenco saranno considerati non validi in conformità al documento [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

<a id="DEP0091"></a>

### DEP0091: crypto.DEFAULT_ENCODING

Tipo: Runtime

La proprietà [`crypto.DEFAULT_ENCODING`][] è deprecata/obsoleta.

<a id="DEP0092"></a>

### DEP0092: livello superiore `this` associato a `module.exports`

Tipo: Documentation-only

Assegnare le proprietà al livello superiore `this` come alternativa a `module.exports` è deprecato/obsoleto. Gli sviluppatori dovrebbero utilizzare al suo posto `exports` oppure `module.exports`.

<a id="DEP0093"></a>

### DEP0093: crypto.fips è deprecato/obsoleto e sostituito.

Tipo: Documentation-only

La proprietà [`crypto.fips`][] è deprecata/obsoleta. Si prega di utilizzare al suo posto `crypto.setFips()` e `crypto.getFips()`.

<a id="DEP0094"></a>

### DEP0094: Utilizzare `assert.fail()` con più di un argomento.

Tipo: Runtime

L'utilizzo di `assert.fail()` con più di un argomento è deprecato/obsoleto. Utilizza `assert.fail()` con un solo argomento oppure utilizza un metodo diverso di modulo `assert`.

<a id="DEP0095"></a>

### DEP0095: timers.enroll()

Tipo: Runtime

`timers.enroll()` è deprecato/obsoleto. Si prega di utilizzare al suo posto [`setTimeout()`][] oppure [`setInterval()`][] i quali sono documentati pubblicamente.

<a id="DEP0096"></a>

### DEP0096: timers.unenroll()

Tipo: Runtime

`timers.unenroll()` è deprecato/obsoleto. Si prega di utilizzare al suo posto [`clearTimeout()`][] oppure [`clearInterval()`][] i quali sono documentati pubblicamente.

<a id="DEP0097"></a>

### DEP0097: MakeCallback con la proprietà domain

Tipo: Runtime

Gli utenti di `MakeCallback` che aggiungono la proprietà `domain` per portare contesto, dovrebbero iniziare a utilizzare la variante `async_context` di `MakeCallback` o `CallbackScope` oppure la classe di livello superiore `AsyncResource`.

<a id="DEP0098"></a>

### DEP0098: Le API AsyncResource.emitBefore e AsyncResource.emitAfter dell'AsyncHooks Embedder

Tipo: Runtime

L'embedded API fornita da AsyncHooks espone i metodi `.emitBefore()` ed `.emitAfter()` i quali sono molto facili da utilizzare in modo errato e possono portare a errori irreversibili.

Utilizza al suo posto l'API [`asyncResource.runInAsyncScope()`][] che fornisce un'alternativa molto più sicura e più conveniente. Vedi https://github.com/nodejs/node/pull/18513 per maggiori dettagli.

<a id="DEP0099"></a>

### DEP0099: async context-unaware node::MakeCallback C++ API

Tipo: Compile-time

Alcune versioni di API `node::MakeCallback` disponibili per i moduli nativi sono deprecate/obsolete. Si prega di utilizzare le versioni delle API che accettano un parametro `async_context`.

<a id="DEP0100"></a>

### DEP0100: process.assert()

Tipo: Runtime

`process.assert()` è deprecato/obsoleto. Si prega di utilizzare il modulo [`assert`][] al suo posto.

Questa non è mai stata una funzionalità documentata.

<a id="DEP0101"></a>

### DEP0101: --with-lttng

Tipo: End-of-Life

L'opzione compile-time `--with-lttng` è stata rimossa.

<a id="DEP0102"></a>

### DEP0102: Utilizzare `noAssert` nelle operazioni Buffer#(read|write).

Tipo: End-of-Life

L'utilizzo dell'argomento `noAssert` non ha più alcuna funzionalità. Tutti gli input saranno verificati, non importa se un input è impostato su true oppure no. Saltare la verifica potrebbe causare errori e arresti difficili da trovare.

<a id="DEP0103"></a>

### DEP0103: i typecheck process.binding('util').is[...]

Tipo: Documentation-only (supporta [`--pending-deprecation`][])

Generalmente l'utilizzo di `process.binding()` dovrebbe essere evitato. In particolare i metodi di typecheck possono essere sostituiti utilizzando [`util.types`][].

<a id="DEP0104"></a>

### DEP0104: coercizione della stringa process.env

Tipo: Documentation-only (supporta [`--pending-deprecation`][])

Quando si assegna una proprietà diversa da una stringa a [`process.env`][], il valore assegnato viene convertito implicitamente in una stringa. Questo comportamento è deprecato/obsoleto se il valore assegnato non è una stringa, un valore booleano o un numero. In futuro, tale assegnazione potrebbe generare un errore. Si prega di convertire la proprietà in una stringa prima di assegnarla a `process.env`.

<a id="DEP0105"></a>

### DEP0105: decipher.finaltol

Tipo: Runtime

`decipher.finaltol()` non è mai stato documentato e attualmente è un alias di [`decipher.final()`][]. In futuro, quest'API verrà probabilmente rimossa e si consiglia l'utilizzo di [`decipher.final()`][].

<a id="DEP0106"></a>

### DEP0106: crypto.createCipher e crypto.createDecipher

Tipo: Documentation-only

L'utilizzo di [`crypto.createCipher()`][] e [`crypto.createDecipher()`][] dovrebbe essere evitato in quanto utilizzano una funzione di derivazione della chiave debole (MD5 senza salt) e vettori di inizializzazione statici. Si consiglia di derivare una chiave utilizzando [`crypto.pbkdf2()`][] e di usare [`crypto.createCipheriv()`][] e [`crypto.createDecipheriv()`][] per ottenere rispettivamente gli object [`Cipher`][] e [`Decipher`][].

<a id="DEP0107"></a>

### DEP0107: tls.convertNPNProtocols()

Tipo: Runtime

Si trattava di una funzione di supporto non documentata da non utilizzare all'esterno del core di Node.js e obsoleta da quando è avvenuta la rimozione del supporto NPN (Next Protocol Negotiation).

<a id="DEP0108"></a>

### DEP0108: zlib.bytesRead

Tipo: Documentation-only

Alias deprecato/obsoleto di [`zlib.bytesWritten`][]. Questo nome originale è stato scelto perché aveva anche senso interpretare il valore come il numero di byte letti dall'engine, ma è incoerente con altri stream all'interno di Node.js che espongono i valori con gli stessi nomi.