# APIs desaprobadas

<!--introduced_in=v7.7.0-->

Node.js may deprecate APIs when either: (a) use of the API is considered to be unsafe, (b) an improved alternative API has been made available, or (c) breaking changes to the API are expected in a future major release.

Node.js utiliza tres tipos de Desaprobaciones:

* Documentation-only
* Runtime
* End-of-Life

A Documentation-only deprecation is one that is expressed only within the Node.js API docs. Estas no generan ningún efecto secundario al ejecutar Node.js.

A Runtime deprecation will, by default, generate a process warning that will be printed to `stderr` the first time the deprecated API is used. When the `--throw-deprecation` command-line flag is used, a Runtime deprecation will cause an error to be thrown.

An End-of-Life deprecation is used to identify code that either has been removed or will soon be removed from Node.js.

## Un-deprecation

Ocasionalmente, la desaprobación de una API puede ser revertida. Such action may happen in either a semver-minor or semver-major release. In such situations, this document will be updated with information relevant to the decision. *Sin embargo, el identificador de la desaprobación no será modificado*.

## Lista de APIs Desaprobadas

<a id="DEP0001"></a>

### DEP0001: http.OutgoingMessage.prototype.flush

Tipo: Tiempo de Ejecución

El método `OutgoingMessage.prototype.flush()` está desaprobado. Use `OutgoingMessage.prototype.flushHeaders()` instead.

<a id="DEP0002"></a>

### DEP0002: requiere('\_linklist')

Tipo: Fin-de-Vida

El módulo `_linklist` está desaprobado. Por favor use un espacio de usuario alternativo.

<a id="DEP0003"></a>

### DEP0003: \_writableState.buffer

Tipo: Runtime

La propiedad `_writableState.buffer` está desaprobada. Use the `_writableState.getBuffer()` method instead.

<a id="DEP0004"></a>

### DEP0004: CryptoStream.prototype.readyState

Tipo: Sólo documentación

The `CryptoStream.prototype.readyState` property is deprecated and should not be used.

<a id="DEP0005"></a>

### DEP0005: Buffer() constructor

Tipo: Documentation-only

The `Buffer()` function and `new Buffer()` constructor are deprecated due to API usability issues that can potentially lead to accidental security issues.

As an alternative, use of the following methods of constructing `Buffer` objects is strongly recommended:

* [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Create a `Buffer` with *initialized* memory.
* [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.allocUnsafeSlow(size)`][] - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.from(array)`][] - Crear un `Buffer` con una copia de `array`
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Create a `Buffer` that wraps the given `arrayBuffer`.
* [`Buffer.from(buffer)`][] - Crear un `Buffer` que copie a `buffer`.
* [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Create a `Buffer` that copies `string`.

<a id="DEP0006"></a>

### DEP0006: child\_process options.customFds

Tipo: Runtime

Within the [`child_process`][] module's `spawn()`, `fork()`, and `exec()` methods, the `options.customFds` option is deprecated. The `options.stdio` option should be used instead.

<a id="DEP0007"></a>

### DEP0007: cluster worker.suicide

Tipo: Runtime

Within the `cluster` module, the [`worker.suicide`][] property has been deprecated. Por favor utilice [`worker.exitedAfterDisconnect`][] en su lugar.

<a id="DEP0008"></a>

### DEP0008: requiere('constants')

Tipo: Documentation-only

El módulo `constants` ha sido desaprobado. When requiring access to constants relevant to specific Node.js builtin modules, developers should instead refer to the `constants` property exposed by the relevant module. For instance, `require('fs').constants` and `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 sin resumen

Type: End-of-life

Use of the [`crypto.pbkdf2()`][] API without specifying a digest was deprecated in Node.js 6.0 because the method defaulted to using the non-recommended `'SHA1'` digest. Previamente, una advertencia de desaprobación fue emitida. Starting in Node.js 8.0.0, calling `crypto.pbkdf2()` or `crypto.pbkdf2Sync()` with an undefined `digest` will throw a `TypeError`.

<a id="DEP0010"></a>

### DEP0010: crypto.createCredentials

Tipo: Runtime

La API [`crypto.createCredentials()`][] está desaprobada. Please use [`tls.createSecureContext()`][] instead.

<a id="DEP0011"></a>

### DEP0011: crypto.Credentials

Tipo: Runtime

La clase `crypto.Credentials` está desaprobada. Please use [`tls.SecureContext`][] instead.

<a id="DEP0012"></a>

### DEP0012: Domain.dispose

Tipo: Runtime

[`Domain.dispose()`][] está desaprobado. Recover from failed I/O actions explicitly via error event handlers set on the domain instead.

<a id="DEP0013"></a>

### DEP0013: fs función asincrónica sin callback

Tipo: Runtime

Llamar a una función asincrónica sin un callback está desaprobado.

<a id="DEP0014"></a>

### DEP0014: fs.read interfaz de String antigua

Tipo: Fin-de-Vida

The [`fs.read()`][] legacy String interface is deprecated. Use the Buffer API as mentioned in the documentation instead.

<a id="DEP0015"></a>

### DEP0015: fs.readSync interfaz de String antigua

Tipo: Fin-de-Vida

The [`fs.readSync()`][] legacy String interface is deprecated. Use the Buffer API as mentioned in the documentation instead.

<a id="DEP0016"></a>

### DEP0016: GLOBAL/root

Tipo: Runtime

The `GLOBAL` and `root` aliases for the `global` property have been deprecated and should no longer be used.

<a id="DEP0017"></a>

### DEP0017: Intl.v8BreakIterator

Tipo: Runtime

El `Intl.v8BreakIterator` está desaprobado y será eliminado o reemplazado pronto.

<a id="DEP0018"></a>

### DEP0018: rechazos de promesas sin gestionar

Tipo: Runtime

Los rechazos de promesas sin gestionar están desaprobados. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

<a id="DEP0019"></a>

### DEP0019: require('.') resuelto fuera del directorio

Tipo: Runtime

En ciertos casos, `require('.')` puede resolver fuera del directorio de paquetes. This behavior is deprecated and will be removed in a future major Node.js release.

<a id="DEP0020"></a>

### DEP0020: Server.connections

Tipo: Runtime

La propiedad [`Server.connections`][] está desaprobada. Please use the [`Server.getConnections()`][] method instead.

<a id="DEP0021"></a>

### DEP0021: Server.listenFD

Tipo: Runtime

El método `Server.listenFD()` está desaprobado. Please use [`Server.listen({fd: <number>})`][] instead.

<a id="DEP0022"></a>

### DEP0022: os.tmpDir()

Tipo: Runtime

La API `os.tmpDir()` está desaprobada. Por favor utilice [`os.tmpdir()`][] en su lugar.

<a id="DEP0023"></a>

### DEP0023: os.getNetworkInterfaces()

Tipo: Runtime

El método `os.getNetworkInterfaces()` está desaprobado. Please use the [`os.networkInterfaces`][] property instead.

<a id="DEP0024"></a>

### DEP0024: REPLServer.prototype.convertToContext()

Tipo: Runtime

The `REPLServer.prototype.convertToContext()` API is deprecated and should not be used.

<a id="DEP0025"></a>

### DEP0025: require('sys')

Tipo: Runtime

El módulo `sys` está desaprobado. Por favor utilice el módulo [`util`][] en su lugar.

<a id="DEP0026"></a>

### DEP0026: util.print()

Tipo: Runtime

La API [`util.print()`][] está desaprobada. Por favor utilice [`console.log()`][] en su lugar.

<a id="DEP0027"></a>

### DEP0027: util.puts()

Tipo: Runtime

La API [`util.puts()`][] está desaprobada. Por favor utilice [`console.log()`][] en su lugar.

<a id="DEP0028"></a>

### DEP0028: util.debug()

Tipo: Runtime

La API [`util.debug()`][] está desaprobada. Please use [`console.error()`][] instead.

<a id="DEP0029"></a>

### DEP0029: util.error()

Tipo: Runtime

La API [`util.error()`][] está desaprobada. Please use [`console.error()`][] instead.

<a id="DEP0030"></a>

### DEP0030: SlowBuffer

Tipo: Documentation-only

La clase [`SlowBuffer`][] ha sido desaprobada. Please use [`Buffer.allocUnsafeSlow(size)`][] instead.

<a id="DEP0031"></a>

### DEP0031: ecdh.setPublicKey()

Tipo: Documentation-only

The [`ecdh.setPublicKey()`][] method is now deprecated as its inclusion in the API is not useful.

<a id="DEP0032"></a>

### DEP0032: módulo de dominio

Tipo: Documentation-only

El módulo [`domain`][] está desaprobado y no debería ser utilizado.

<a id="DEP0033"></a>

### DEP0033: EventEmitter.listenerCount()

Tipo: Documentation-only

The [`EventEmitter.listenerCount(emitter, eventName)`][] API has been deprecated. Por favor utilice [`emitter.listenerCount(eventName)`][] en su lugar.

<a id="DEP0034"></a>

### DEP0034: fs.exists(path, callback)

Tipo: Documentation-only

La API [`fs.exists(path, callback)`][] ha sido desaprobada. Please use [`fs.stat()`][] or [`fs.access()`][] instead.

<a id="DEP0035"></a>

### DEP0035: fs.lchmod(path, mode, callback)

Tipo: Documentation-only

La API [`fs.lchmod(path, mode, callback)`][] ha sido desaprobada.

<a id="DEP0036"></a>

### DEP0036: fs.lchmodSync(path, mode)

Tipo: Documentation-only

La API [`fs.lchmodSync(path, mode)`][] ha sido desaprobada.

<a id="DEP0037"></a>

### DEP0037: fs.lchown(path, uid, gid, callback)

Tipo: Documentation-only

La API [`fs.lchown(path, uid, gid, callback)`][] ha sido desaprobada.

<a id="DEP0038"></a>

### DEP0038: fs.lchownSync(path, uid, gid)

Tipo: Documentation-only

La API [`fs.lchownSync(path, uid, gid)`][] ha sido desaprobada.

<a id="DEP0039"></a>

### DEP0039: require.extensions

Tipo: Documentation-only

La propiedad [`require.extensions`][] ha sido desaprobada.

<a id="DEP0040"></a>

### DEP0040: módulo punycode

Tipo: Documentation-only

El módulo [`punycode`][] ha sido desaprobado. Please use a userland alternative instead.

<a id="DEP0041"></a>

### DEP0041: NODE\_REPL\_HISTORY\_FILE variable de entorno

Tipo: Documentation-only

La variable de entorno `NODE_REPL_HISTORY_FILE` ha sido desaprobada.

<a id="DEP0042"></a>

### DEP0042: tls.CryptoStream

Tipo: Documentation-only

La clase [`tls.CryptoStream`][] ha sido desaprobada. Please use [`tls.TLSSocket`][] instead.

<a id="DEP0043"></a>

### DEP0043: tls.SecurePair

Tipo: Documentation-only

La clase [`tls.SecurePair`][] ha sido desaprobada. Please use [`tls.TLSSocket`][] instead.

<a id="DEP0044"></a>

### DEP0044: util.isArray()

Tipo: Documentation-only

La API [`util.isArray()`][] ha sido desaprobada. Please use `Array.isArray()` instead.

<a id="DEP0045"></a>

### DEP0045: util.isBoolean()

Tipo: Documentation-only

La API [`util.isBoolean()`][] ha sido desaprobada.

<a id="DEP0046"></a>

### DEP0046: util.isBuffer()

Tipo: Documentation-only

La API [`util.isBuffer()`][] ha sido desaprobada. Please use [`Buffer.isBuffer()`][] instead.

<a id="DEP0047"></a>

### DEP0047: util.isDate()

Tipo: Documentation-only

La API [`util.isDate()`][] ha sido desaprobada.

<a id="DEP0048"></a>

### DEP0048: util.isError()

Tipo: Documentation-only

La API [`util.isError()`][] ha sido desaprobada.

<a id="DEP0049"></a>

### DEP0049: util.isFunction()

Tipo: Documentation-only

La API [`util.isFunction()`][] ha sido desaprobada.

<a id="DEP0050"></a>

### DEP0050: util.isNull()

Tipo: Documentation-only

La API [`util.isNull()`][] ha sido desaprobada.

<a id="DEP0051"></a>

### DEP0051: util.isNullOrUndefined()

Tipo: Documentation-only

La API [`util.isNullOrUndefined()`][] ha sido desaprobada.

<a id="DEP0052"></a>

### DEP0052: util.isNumber()

Tipo: Documentation-only

La API [`util.isNumber()`][] ha sido desaprobada.

<a id="DEP0053"></a>

### DEP0053 util.isObject()

Tipo: Documentation-only

La API [`util.isObject()`][] ha sido desaprobada.

<a id="DEP0054"></a>

### DEP0054: util.isPrimitive()

Tipo: Documentation-only

La API [`util.isPrimitive()`][] ha sido desaprobada.

<a id="DEP0055"></a>

### DEP0055: util.isRegExp()

Tipo: Documentation-only

La API [`util.isRegExp()`][] ha sido desaprobada.

<a id="DEP0056"></a>

### DEP0056: util.isString()

Tipo: Documentation-only

La API [`util.isString()`][] ha sido desaprobada.

<a id="DEP0057"></a>

### DEP0057: util.isSymbol()

Tipo: Documentation-only

La API [`util.isSymbol()`][] ha sido desaprobada.

<a id="DEP0058"></a>

### DEP0058: util.isUndefined()

Tipo: Documentation-only

La API [`util.isUndefined()`][] ha sido desaprobada.

<a id="DEP0059"></a>

### DEP0059: util.log()

Tipo: Documentation-only

La API [`util.log()`][] ha sido desaprobada.

<a id="DEP0060"></a>

### DEP0060: util.\_extend()

Tipo: Documentation-only

La API [`util._extend()`][] ha sido desaprobada.

<a id="DEP0061"></a>

### DEP0061: fs.SyncWriteStream

Tipo: Runtime

The `fs.SyncWriteStream` class was never intended to be a publicly accessible API. No hay disponible ninguna API alternativa. Por favor use un espacio de usuario alternativo.

<a id="DEP0062"></a>

### DEP0062: node --debug

Tipo: Runtime

`--debug` activates the legacy V8 debugger interface, which has been removed as of V8 5.8. It is replaced by Inspector which is activated with `--inspect` instead.

<a id="DEP0063"></a>

### DEP0063: ServerResponse.prototype.writeHeader()

Tipo: Documentation-only

The `http` module `ServerResponse.prototype.writeHeader()` API has been deprecated. Por favor utilice `ServerResponse.prototype.writeHead()` en su lugar.

*Note*: The `ServerResponse.prototype.writeHeader()` method was never documented as an officially supported API.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()

Tipo: Runtime

The `tls.createSecurePair()` API was deprecated in documentation in Node.js 0.11.3. Users should use `tls.Socket` instead.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC and NODE_REPL_MODE=magic

Tipo: Documentation-only

The `repl` module's `REPL_MODE_MAGIC` constant, used for `replMode` option, has been deprecated. Its behavior has been functionally identical to that of `REPL_MODE_SLOPPY` since Node.js v6.0.0, when V8 5.0 was imported. Please use `REPL_MODE_SLOPPY` instead.

The `NODE_REPL_MODE` environment variable is used to set the underlying `replMode` of an interactive `node` session. Its default value, `magic`, is similarly deprecated in favor of `sloppy`.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames

Tipo: Documentation-only

The `http` module `outgoingMessage._headers` and `outgoingMessage._headerNames` properties have been deprecated. Please instead use one of the public methods (e.g. `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) for working with outgoing headers.

*Note*: `outgoingMessage._headers` and `outgoingMessage._headerNames` were never documented as officially supported properties.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders

Tipo: Documentation-only

The `http` module `OutgoingMessage.prototype._renderHeaders()` API has been deprecated.

*Note*: `OutgoingMessage.prototype._renderHeaders` was never documented as an officially supported API.

<a id="DEP0068"></a>

### DEP0068: node debug

Tipo: Runtime

`node debug` corresponds to the legacy CLI debugger which has been replaced with a V8-inspector based CLI debugger available through `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)

Tipo: Documentation-only

The DebugContext will be removed in V8 soon and will not be available in Node 10+.

*Nota*: DebugContext fue una API experimental.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()

Tipo: Runtime

`async_hooks.currentId()` was renamed to `async_hooks.executionAsyncId()` for clarity.

*Nota*: se realizó el cambio mientras `async_hooks` era una API experimental.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()

Tipo: Runtime

`async_hooks.triggerId()` was renamed to `async_hooks.triggerAsyncId()` for clarity.

*Nota*: se realizó el cambio mientras `async_hooks` era una API experimental.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()

Tipo: Runtime

`async_hooks.AsyncResource.triggerId()` was renamed to `async_hooks.AsyncResource.triggerAsyncId()` for clarity.

*Nota*: se realizó el cambio mientras `async_hooks` era una API experimental.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()

Tipo: Documentation-only

`tls.parseCertString()` is a trivial parsing helper that was made public by mistake. Esta función puede usualmente ser reemplazada con:

```js
const querystring = require('querystring');
querystring.parse(str, '\n', '=');
```

*Nota*: Esta función no es completamente equivalente a `querystring.parse()`. One difference is that `querystring.parse()` does url decoding:

```sh
> querystring.parse('%E5%A5%BD=1', '\n', '=');
{ '好': '1' }
> tls.parseCertString('%E5%A5%BD=1');
{ '%E5%A5%BD': '1' }
```

<a id="DEP0079"></a>

### DEP0079: Función personalizada de inspección en Objects via .inspect()

Tipo: Documentation-only

Using a property named `inspect` on an object to specify a custom inspection function for [`util.inspect()`][] is deprecated. Use [`util.inspect.custom`][] instead. For backwards compatibility with Node.js prior to version 6.4.0, both may be specified.

<a id="DEP0085"></a>

### DEP0085: AsyncHooks Sensitive API

Tipo: Runtime

The AsyncHooks Sensitive API was never documented and had various of minor issues, see https://github.com/nodejs/node/issues/15572. Use the `AsyncResource` API instead.

<a id="DEP0086"></a>

### DEP0086: Remover runInAsyncIdScope

Tipo: Runtime

`runInAsyncIdScope` doesn't emit the `before` or `after` event and can thus cause a lot of issues. See https://github.com/nodejs/node/issues/14328 for more details.

<a id="DEP0089"></a>

### DEP0089: require('assert')

Tipo: Documentation-only

Importing assert directly is not recommended as the exposed functions will use loose equality checks. En cambio, use `require('assert').strict`. The API is the same as the legacy assert but it will always use strict equality checks.

<a id="DEP0098"></a>

### DEP0098: AsyncHooks Embedder AsyncResource.emit{Before,After} APIs

Tipo: Runtime

The embedded API provided by AsyncHooks exposes emit{Before,After} methods which are very easy to use incorrectly which can lead to unrecoverable errors.

Use [`asyncResource.runInAsyncScope()`][] API instead which provides a much safer, and more convenient, alternative. See https://github.com/nodejs/node/pull/18513 for more details.