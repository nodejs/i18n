# Deprecated APIs

<!--introduced_in=v7.7.0-->

<!-- type=misc -->

Node.js puede desaprobar APIs cuando: (a) el uso de la API es considerado como inseguro, (b) una API alternativa y mejorada ha comenzado a estar disponible, o (c) cambios importantes para la API están planificados en una importante actualización futura.

Node.js utiliza tres tipos de Desaprobaciones:

- Solo-documentación
- Runtime
- Fin-de-Vida

Una desaprobación que sea de solo-documentación es una que está expresada solo dentro de los documentos de API de Node.js. Estas no generan ningún efecto secundario al ejecutar Node.js. Algunas desaprobaciones que son de solo-documentación, provocan una advertencia en runtime cuando son ejecutadas con la bandera [`--pending-deprecation`][] (o su alternativa, la variable de ambiente `NODE_PENDING_DEPRECATION=1`), de manera similar a las desaprobaciones mostradas abajo. Las desaprobaciones de solo-documentación que soporten esa bandera están explicítamente indicadas como tales en la [lista de APIs Desaprobadas](#deprecations_list_of_deprecated_apis).

Una desaprobación de Runtime generará, de forma predeterminada, un proceso de advertencia que será estampado a `stderr` la primera vez que la API desaprobada sea usada. Cuando la bandera de línea de comando `--throw-deprecation` es usada, una desaprobación de Runtime causará que se arroje un error.

Una desaprobación Fin-de-Vida es usada para identificar código que o ha sido removido, o pronto será removido de Node.js.

## Revocación de desaprobaciones

Ocasionalmente, la desaprobación de una API puede ser revertida. En estas situaciones, el documento será actualizado con información relevante a la decisión. Sin embargo, el identificador de la desaprobación no será modificado.

## Lista de APIs Desaprobadas

<a id="DEP0001"></a>

### DEP0001: http.OutgoingMessage.prototype.flush

Tipo: Runtime

El método `OutgoingMessage.prototype.flush()` está desaprobado. En cambio, use `OutgoingMessage.prototype.flushHeaders()`.

<a id="DEP0002"></a>

### DEP0002: requiere('\_linklist')

Tipo: Fin-de-Vida

El módulo `_linklist` está desaprobado. Por favor use un espacio de usuario alternativo.

<a id="DEP0003"></a>

### DEP0003: \_writableState.buffer

Tipo: Runtime

La propiedad `_writableState.buffer` está desaprobada. En cambio, use el método `_writableState.getBuffer()`.

<a id="DEP0004"></a>

### DEP0004: CryptoStream.prototype.readyState

Tipo: solo-documentación

La propiedad `CryptoStream.prototype.readyState` está desaprobada y no debería ser usada.

<a id="DEP0005"></a>

### DEP0005: Buffer() constructor

Tipo: Runtime (soporta [`--pending-deprecation`][])

La función `Buffer()` y el constructor `new Buffer()` están desaprobados debido a problemas de usabilidad con la API que pueden potencialmente resultar en problemas accidentales de seguridad.

Como alternativa, el uso de los siguientes métodos de construcción de objetos `Buffer` es fuertemente recomendado:

- [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Crear un `Buffer` con memoria *inicializada*.
- [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Crear un `Buffer` con memoria *sin inicializar*.
- [`Buffer.allocUnsafeSlow(size)`][] - Crear un `Buffer` con memoria *sin inicializar*.
- [`Buffer.from(array)`][] - Crear un `Buffer` con una copia de `array`
- [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Crear un `Buffer` que envuelva al `arrayBuffer` dado.
- [`Buffer.from(buffer)`][] - Crear un `Buffer` que copie a `buffer`.
- [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Crear un `Buffer` que copie a `string`.

Desde la v10.0.0, una advertencia de desaprobación es emitida en runtime cuando `--pending-deprecation` es usada o cuando el código de llamada está afuera de `node_modules`, de modo que se apunte mejor a los desarrolladores, y no a los usuarios.

<a id="DEP0006"></a>

### DEP0006: child\_process options.customFds

Tipo: Runtime

Dentro de [`child_process`][] los métodos de los módulos `spawn()`, `fork()`, y `exec()`, la opción `options.customFds` está desaprobada. La opción `options.stdio` debería ser usada en su lugar.

<a id="DEP0007"></a>

### DEP0007: Reemplace el grupo worker.suicide con worker.exitedAfterDisconnect

Tipo: Fin-de-Vida

En una versión previa del `cluster` Node.js, una propiedad booleana con el nombre `suicide` fue agregada al objeto `Worker`. La intención de esta propiedad fue proveer una indicación sobre cómo y por qué la instancia `Worker` salió. En Node.js 6.0.0, la vieja propiedad fue desaprobada y reemplazada con una nueva propiedad [`worker.exitedAfterDisconnect`][]. El nombre de la vieja propiedad no describía precisamente la verdadera semántica y fue innecesariamente cargada de emoción.

<a id="DEP0008"></a>

### DEP0008: requiere('constants')

Tipo: Solo-documentación

El módulo `constants` ha sido desaprobado. Cuando se requiere acceso a constantes relevantes a módulos específicos integrados a Node.js, los desarrolladores, en cambio, deberían referir a la propiedad `constants` expuesta por el módulo relevante. Por ejemplo, `require('fs').constants` y `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 sin resumen

Tipo: Fin-de-Vida

El uso de la API [`crypto.pbkdf2()`][] sin especificar un resumen fue desaprobado en Node.js 6.0, porque el método usó de manera predeterminada el resumen no recomendado `'SHA1'`. Previamente, una advertencia de desaprobación fue emitida. A partir de Node.js 8.0.0, llamar a `crypto.pbkdf2()` o `crypto.pbkdf2Sync()` con un `digest` indefinido dará como resultado un `TypeError`.

<a id="DEP0010"></a>

### DEP0010: crypto.createCredentials

Tipo: Runtime

La API [`crypto.createCredentials()`][] está desaprobada. En cambio, porfavor use [`tls.createSecureContext()`][].

<a id="DEP0011"></a>

### DEP0011: crypto.Credentials

Tipo: Runtime

La clase `crypto.Credentials` está desaprobada. En cambio, porfavor use [`tls.SecureContext`][].

<a id="DEP0012"></a>

### DEP0012: Domain.dispose

Tipo: Fin-de-Vida

`Domain.dispose()` ha sido removido. En cambio, recuperesé de acciones I/O fallidas explícitamente por medio de los gestores de eventos de error establecidos en el dominio.

<a id="DEP0013"></a>

### DEP0013: fs función asincrónica sin callback

Tipo: Fin-de-Vida

Llamar a una función asincrónica sin un callback nos lanza un `TypeError` en Node.js 10.0.0 y en adelante. (Vea https://github.com/nodejs/node/pull/12562.)

<a id="DEP0014"></a>

### DEP0014: fs.read interfaz de String antigua

Tipo: Fin-de-Vida

La interfaz de `String` antigua [`fs.read()`][] está desaprobada. En cambio, use la API `Buffer` como se menciona en la documentación.

<a id="DEP0015"></a>

### DEP0015: fs.readSync interfaz de String antigua

Tipo: Fin-de-Vida

La interfaz de `String` antigua [`fs.readSync()`][] está desaprobada. En cambio, use la API `Buffer` como se menciona en la documentación.

<a id="DEP0016"></a>

### DEP0016: GLOBAL/root

Tipo: Runtime

Los alias `GLOBAL` y `root` para la propiedad `global` han sido desaprobados y no deberían seguir siendo usados.

<a id="DEP0017"></a>

### DEP0017: Intl.v8BreakIterator

Tipo: Final-de-Vida

`Intl.v8BreakIterator` fue una extensión no estándar y ha sido removida. Vea [`Intl.Segmenter`](https://github.com/tc39/proposal-intl-segmenter).

<a id="DEP0018"></a>

### DEP0018: Unhandled promise rejections

Tipo: Runtime

Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.

<a id="DEP0019"></a>

### DEP0019: require('.') resolved outside directory

Type: Runtime

In certain cases, `require('.')` may resolve outside the package directory. This behavior is deprecated and will be removed in a future major Node.js release.

<a id="DEP0020"></a>

### DEP0020: Server.connections

Type: Runtime

The [`Server.connections`][] property is deprecated. Please use the [`Server.getConnections()`][] method instead.

<a id="DEP0021"></a>

### DEP0021: Server.listenFD

Type: Runtime

The `Server.listenFD()` method is deprecated. Please use [`Server.listen({fd: <number>})`][] instead.

<a id="DEP0022"></a>

### DEP0022: os.tmpDir()

Type: Runtime

The `os.tmpDir()` API is deprecated. Please use [`os.tmpdir()`][] instead.

<a id="DEP0023"></a>

### DEP0023: os.getNetworkInterfaces()

Type: Runtime

The `os.getNetworkInterfaces()` method is deprecated. Please use the [`os.networkInterfaces`][] property instead.

<a id="DEP0024"></a>

### DEP0024: REPLServer.prototype.convertToContext()

Type: End-of-Life

The `REPLServer.prototype.convertToContext()` API is deprecated and should not be used.

<a id="DEP0025"></a>

### DEP0025: require('sys')

Type: Runtime

The `sys` module is deprecated. Please use the [`util`][] module instead.

<a id="DEP0026"></a>

### DEP0026: util.print()

Type: Runtime

The [`util.print()`][] API is deprecated. Please use [`console.log()`][] instead.

<a id="DEP0027"></a>

### DEP0027: util.puts()

Type: Runtime

The [`util.puts()`][] API is deprecated. Please use [`console.log()`][] instead.

<a id="DEP0028"></a>

### DEP0028: util.debug()

Type: Runtime

The [`util.debug()`][] API is deprecated. Please use [`console.error()`][] instead.

<a id="DEP0029"></a>

### DEP0029: util.error()

Type: Runtime

The [`util.error()`][] API is deprecated. Please use [`console.error()`][] instead.

<a id="DEP0030"></a>

### DEP0030: SlowBuffer

Type: Documentation-only

The [`SlowBuffer`][] class has been deprecated. Please use [`Buffer.allocUnsafeSlow(size)`][] instead.

<a id="DEP0031"></a>

### DEP0031: ecdh.setPublicKey()

Type: Documentation-only

The [`ecdh.setPublicKey()`][] method is now deprecated as its inclusion in the API is not useful.

<a id="DEP0032"></a>

### DEP0032: domain module

Type: Documentation-only

The [`domain`][] module is deprecated and should not be used.

<a id="DEP0033"></a>

### DEP0033: EventEmitter.listenerCount()

Type: Documentation-only

The [`EventEmitter.listenerCount(emitter, eventName)`][] API has been deprecated. Please use [`emitter.listenerCount(eventName)`][] instead.

<a id="DEP0034"></a>

### DEP0034: fs.exists(path, callback)

Type: Documentation-only

The [`fs.exists(path, callback)`][] API has been deprecated. Please use [`fs.stat()`][] or [`fs.access()`][] instead.

<a id="DEP0035"></a>

### DEP0035: fs.lchmod(path, mode, callback)

Type: Documentation-only

The [`fs.lchmod(path, mode, callback)`][] API has been deprecated.

<a id="DEP0036"></a>

### DEP0036: fs.lchmodSync(path, mode)

Type: Documentation-only

The [`fs.lchmodSync(path, mode)`][] API has been deprecated.

<a id="DEP0037"></a>

### DEP0037: fs.lchown(path, uid, gid, callback)

Type: Documentation-only

The [`fs.lchown(path, uid, gid, callback)`][] API has been deprecated.

<a id="DEP0038"></a>

### DEP0038: fs.lchownSync(path, uid, gid)

Type: Documentation-only

The [`fs.lchownSync(path, uid, gid)`][] API has been deprecated.

<a id="DEP0039"></a>

### DEP0039: require.extensions

Type: Documentation-only

The [`require.extensions`][] property has been deprecated.

<a id="DEP0040"></a>

### DEP0040: punycode module

Type: Documentation-only

The [`punycode`][] module has been deprecated. Please use a userland alternative instead.

<a id="DEP0041"></a>

### DEP0041: NODE\_REPL\_HISTORY\_FILE environment variable

Type: End-of-Life

The `NODE_REPL_HISTORY_FILE` environment variable was removed. Please use `NODE_REPL_HISTORY` instead.

<a id="DEP0042"></a>

### DEP0042: tls.CryptoStream

Type: Documentation-only

The [`tls.CryptoStream`][] class has been deprecated. Please use [`tls.TLSSocket`][] instead.

<a id="DEP0043"></a>

### DEP0043: tls.SecurePair

Type: Documentation-only

The [`tls.SecurePair`][] class has been deprecated. Please use [`tls.TLSSocket`][] instead.

<a id="DEP0044"></a>

### DEP0044: util.isArray()

Type: Documentation-only

The [`util.isArray()`][] API has been deprecated. Please use `Array.isArray()` instead.

<a id="DEP0045"></a>

### DEP0045: util.isBoolean()

Type: Documentation-only

The [`util.isBoolean()`][] API has been deprecated.

<a id="DEP0046"></a>

### DEP0046: util.isBuffer()

Type: Documentation-only

The [`util.isBuffer()`][] API has been deprecated. Please use [`Buffer.isBuffer()`][] instead.

<a id="DEP0047"></a>

### DEP0047: util.isDate()

Type: Documentation-only

The [`util.isDate()`][] API has been deprecated.

<a id="DEP0048"></a>

### DEP0048: util.isError()

Type: Documentation-only

The [`util.isError()`][] API has been deprecated.

<a id="DEP0049"></a>

### DEP0049: util.isFunction()

Type: Documentation-only

The [`util.isFunction()`][] API has been deprecated.

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

Por otra parte, `node-inspect` puede ser instalado localmente por medio de un administrador de paquetes, como se explica en el registro npm que lleva el mismo nombre. No source code modification is necessary if that is done.

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

Node.js soporta toda la extensión de las etiquetas de autentificación GCM que sean aceptatadas por OpenSSL al llamar a [`decipher.setAuthTag()`][]. Este comportamiento cambiará en una versión futura, en cuyo momento solo la extensión de las etiquetas de autentificación de 28, 120, 112, 104, 96, 64, y 32 bits serán permitidas. Las etiquetas de autentificación cuya extensión no se encuentre incluida en esta lista será considerada inválida en conformidad con [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

<a id="DEP0091"></a>

### DEP0091: crypto.DEFAULT_ENCODING

Tipo: Runtime

La propiedad [`crypto.DEFAULT_ENCODING`][] está desaprobada.

<a id="DEP0092"></a>

### DEP0092: Top-level `this` bound to `module.exports`

Tipo: Solo-documentación

Asignar propiedades al nivel top `this` como una alternativa al módulo `module.exports` está desaprobado. Los desarrolladores deberían, en cambio, usar `exports` o `module.exports`.

<a id="DEP0093"></a>

### DEP0093: crypto.fips está desaprobado y reemplazado.

Tipo: Solo-documentación

La propiedad [`crypto.fips`][] está desaprobada. En cambio, por favor use `crypto.setFips()` y `crypto.getFips()`.

<a id="DEP0094"></a>

### DEP0094: Usar `assert.fail()` con más de un argumento.

Tipo: Runtime

Usar `assert.fail()` con más de un argumento está desaprobado. Use `assert.fail()` con un solo argumento o use un diferente método de módulo `assert`.

<a id="DEP0095"></a>

### DEP0095: timers.enroll()

Tipo: Runtime

`timers.enroll()` está desaprobado. En cambio, por favor use el públicamente documentado [`setTimeout()`][] o [`setInterval()`][].

<a id="DEP0096"></a>

### DEP0096: timers.unenroll()

Tipo: Runtime

`timers.unenroll()` está desaprobado. En cambio, por favor use el públicamente documentado [`clearTimeout()`][] o [`clearInterval()`][].

<a id="DEP0097"></a>

### DEP0097: MakeCallback con propiedad del dominio

Tipo: Runtime

Usuarios de `MakeCallback` que agreguen la propiedad `domain` para llevar el contexto, deberían empezar a usar la variante `async_context` de `MakeCallback` o `CallbackScope`, o la clase de nivel alto `AsyncResource`.

<a id="DEP0098"></a>

### DEP0098: AsyncHooks Embedder AsyncResource.emitBefore and AsyncResource.emitAfter APIs

Tipo: Runtime

La API incrustrada provista por AsyncHooks expone los métodos `.emitBefore()` y `.emitAfter()` los cuales son muy fáciles de usar incorrectamente, pudiendo conducir a errores irrecuperables.

En cambio, use la API [`asyncResource.runInAsyncScope()`][] la cual provee una alternativa mucho más segura y conveniente. Vea https://github.com/nodejs/node/pull/18513 para más detalles.

<a id="DEP0099"></a>

### DEP0099: async context-unaware node::MakeCallback C++ APIs

Tipo: Tiempo-de-compilación

Ciertas versiones de las APIs `node::MakeCallback` disponibles para módulos nativos están desaprobadas. Por favor, use las versiones de la API que acepten un parámetro `async_context`.

<a id="DEP0100"></a>

### DEP0100: process.assert()

Tipo: Runtime

`process.assert()` está desaprobado. En cambio, por favor use el módulo [`assert`][].

Esta nunca fue una característica documetada.

<a id="DEP0101"></a>

### DEP0101: --with-lttng

Tipo: Fin-de-Vida

La opción de tiempo-de-compilación`--with-lttng` ha sido removida.

<a id="DEP0102"></a>

### DEP0102: Usar `noAssert` en operaciones Buffer#(read|write).

Tipo: Final-de-Vida

Usar el argumento `noAssert` ya no tiene ninguna funcionalidad. Todo lo que entre va a ser verificado, sin importar si está establecido a true o no. Omitir la verificación puede resultar en errores y fallas difíciles de conseguir.

<a id="DEP0103"></a>

### DEP0103: process.binding('util').is[...] typechecks

Type: Documentation-only (supports [`--pending-deprecation`][])

Using `process.binding()` in general should be avoided. The type checking methods in particular can be replaced by using [`util.types`][].

<a id="DEP0104"></a>

### DEP0104: process.env string coercion

Type: Documentation-only (supports [`--pending-deprecation`][])

Cuando se asigna una propiedad sin string a [`process.env`][], el valor asignado es implícitamente convertido a una string. Este comportamiento es desaprobado si el valor asignado no es una string, un booleano, o un número. En el futuro, dicha asignación puede resultar en un error. Por favor convierta la propiedad a una string antes de asignarla a `process.env`.

<a id="DEP0105"></a>

### DEP0105: decipher.finaltol

Tipo: Runtime

`decipher.finaltol()` nunca ha sido documentato y actualmente es un alias para [`decipher.final()`][]. En el futuro, esta API seguramente sea removida, y en cambio se recomienda usar [`decipher.final()`][].

<a id="DEP0106"></a>

### DEP0106: crypto.createCipher y crypto.createDecipher

Tipo: Solo-documentación

Debería evitarse usar [`crypto.createCipher()`][] y [`crypto.createDecipher()`][], debido a que utilizan una función de derivación de clave débil (MD5 sin salt) y vectores de inicialización estáticos. Es recomendado derivar una clave utilizando [`crypto.pbkdf2()`][] y usar [`crypto.createCipheriv()`][] y [`crypto.createDecipheriv()`][] para obtener los objectos [`Cipher`][] y [`Decipher`][], respectivamente.

<a id="DEP0107"></a>

### DEP0107: tls.convertNPNProtocols()

Tipo: Runtime

Esto fue una función auxiliar indocumentada no destinada al uso afuera del core Node.js y obsoleta por la eliminación del soporte NPN (Next Protocol Negotiation).

<a id="DEP0108"></a>

### DEP0108: zlib.bytesRead

Tipo: Solo-documentación

Alias desaprobado para [`zlib.bytesWritten`][]. El nombre original fue elegido porque también tenía sentido interpretar el valor como el número de bytes leídos por el motor, pero es inconsistente con otros streams en Node.js que exponen valores bajo estos nombres.