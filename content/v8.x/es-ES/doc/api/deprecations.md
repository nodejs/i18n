# APIs Desaprobadas

<!--introduced_in=v7.7.0-->

Node.js puede desaprobar APIs cuando: (a) el uso de la API es considerado como inseguro, (b) una API alternativa y mejorada ha comenzado a estar disponible, o (c) cambios importantes para la API están planificados en una actualización futura importante.

Node.js utiliza tres tipos de Desaprobaciones:

* Sólo Documentación
* Duración
* Final de Vida

Una desaprobación de tipo Sólo documentación es una que está expresada sólo dentro de los documentos de API de Node.js. Estas no generan ningún efecto secundario al ejecutar Node.js.

Una desaprobación de tipo Runtime, por defecto, generará una advertencia de proceso que se imprimirá en `stderr` la primera vez que la API desaprobada sea utilizada. Cuando la bandera de línea de comando `--throw-deprecation` es utilizada, una desaprobación de tipo Tiempo de Ejecución causará que se arroje un error.

Una desaprobación de tipo Fin de Vida es utilizada para identificar código que ha sido eliminado o que pronto será eliminado de Node.js.

## Un-deprecation

Ocasionalmente, la desaprobación de una API puede ser revertida. Such action may happen in either a semver-minor or semver-major release. En dichas situaciones, este documento será actualizado con información relevante a la decisión. *Sin embargo, el identificador de la desaprobación no será modificado*.

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

Tipo: Documentation-only

La propiedad `CryptoStream.prototype.readyState` está desaprobada y no debería ser usada.

<a id="DEP0005"></a>

### DEP0005: Buffer() constructor

Tipo: Documentation-only

La función `Buffer()` y el constructor `new Buffer()` están desaprobados debido a problemas de usabilidad con la API que pueden potencialmente resultar en problemas accidentales de seguridad.

Como alternativa, el uso de los siguientes métodos de construcción de objetos `Buffer` es fuertemente recomendado:

* [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Crea un `Buffer` con memoria *inicializada*.
* [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Crea un `Buffer` con memoria *sin inicializar*.
* [`Buffer.allocUnsafeSlow(size)`][] - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.from(array)`][] - Crea un `Buffer` con una copia de `array`
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Crea un `Buffer` que envuelve al `arrayBuffer` dado.
* [`Buffer.from(buffer)`][] - Crea un `Buffer` que copia a `buffer`.
* [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Crea un `Buffer` que copia a `string`.

<a id="DEP0006"></a>

### DEP0006: child\_process options.customFds

Tipo: Runtime

Dentro de [`child_process`][] los métodos de los módulos `spawn()`, `fork()`, y `exec()`, la opción `options.customFds` está desaprobada. La opción `options.stdio` debería ser usada en su lugar.

<a id="DEP0007"></a>

### DEP0007: cluster worker.suicide

Tipo: Runtime

Dentro del módulo `cluster`, la propiedad [`worker.suicide`][] ha sido desaprobada. Por favor utilice [`worker.exitedAfterDisconnect`][] en su lugar.

<a id="DEP0008"></a>

### DEP0008: requiere('constants')

Tipo: Documentation-only

El módulo `constants` ha sido desaprobado. Cuando se requiere acceso a constantes relevantes a módulos específicos integrados a Node.js, los desarrolladores, en cambio, deberían referir a la propiedad `constants` expuesta por el módulo relevante. Por ejemplo, `require('fs').constants` y `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 sin resumen

Type: End-of-life

El uso de la API [`crypto.pbkdf2()`][] sin especificar un resumen fue desaprobado en Node.js 6.0, porque el método usó de manera predeterminada el resumen no recomendado `'SHA1'`. Previamente, una advertencia de desaprobación fue emitida. A partir de Node.js 8.0.0, llamar a `crypto.pbkdf2()` o `crypto.pbkdf2Sync()` con un `digest` indefinido dará como resultado un `TypeError`.

<a id="DEP0010"></a>

### DEP0010: crypto.createCredentials

Tipo: Runtime

La API [`crypto.createCredentials()`][] está desaprobada. En cambio, por favor use [`tls.createSecureContext()`][].

<a id="DEP0011"></a>

### DEP0011: crypto.Credentials

Tipo: Runtime

La clase `crypto.Credentials` está desaprobada. En cambio, porfavor use [`tls.SecureContext`][].

<a id="DEP0012"></a>

### DEP0012: Domain.dispose

Tipo: Runtime

[`Domain.dispose()`][] está desaprobado. En cambio, recupérese de acciones I/O fallidas explícitamente por medio de los gestores de eventos de error establecidos en el dominio.

<a id="DEP0013"></a>

### DEP0013: fs función asincrónica sin callback

Tipo: Runtime

Llamar a una función asincrónica sin un callback está desaprobado.

<a id="DEP0014"></a>

### DEP0014: fs.read interfaz de String antigua

Tipo: Fin-de-Vida

The [`fs.read()`][] legacy String interface is deprecated. En su lugar, utilice la API de Buffer como se menciona en la documentación.

<a id="DEP0015"></a>

### DEP0015: fs.readSync interfaz de String antigua

Tipo: Fin-de-Vida

The [`fs.readSync()`][] legacy String interface is deprecated. En su lugar, utilice la API de Buffer como se menciona en la documentación.

<a id="DEP0016"></a>

### DEP0016: GLOBAL/root

Tipo: Runtime

Los alias `GLOBAL` y `root` para la propiedad `global` han sido desaprobados y no deberían seguir siendo usados.

<a id="DEP0017"></a>

### DEP0017: Intl.v8BreakIterator

Tipo: Runtime

El `Intl.v8BreakIterator` está desaprobado y será eliminado o reemplazado pronto.

<a id="DEP0018"></a>

### DEP0018: rechazos de promesas sin gestionar

Tipo: Runtime

Los rechazos de promesas sin gestionar están desaprobados. En el futuro, rechazos de promesas que no sean gestionados terminarán el proceso de Node.js con un código de salida non-zero.

<a id="DEP0019"></a>

### DEP0019: require('.') resuelto fuera del directorio

Tipo: Runtime

En ciertos casos, `require('.')` puede resolver fuera del directorio de paquetes. Este comportamiento está desaprobado y será removido en una importante actualización futura de Node.js.

<a id="DEP0020"></a>

### DEP0020: Server.connections

Tipo: Runtime

La propiedad [`Server.connections`][] está desaprobada. En cambio, por favor use el método [`Server.getConnections()`][].

<a id="DEP0021"></a>

### DEP0021: Server.listenFD

Tipo: Runtime

El método `Server.listenFD()` está desaprobado. En cambio, por favor use [`Server.listen({fd: <number>})`][].

<a id="DEP0022"></a>

### DEP0022: os.tmpDir()

Tipo: Runtime

La API `os.tmpDir()` está desaprobada. En cambio, por favor use [`os.tmpdir()`][].

<a id="DEP0023"></a>

### DEP0023: os.getNetworkInterfaces()

Tipo: Runtime

El método `os.getNetworkInterfaces()` está desaprobado. En cambio, por favor use [`os.networkInterfaces`][].

<a id="DEP0024"></a>

### DEP0024: REPLServer.prototype.convertToContext()

Tipo: Runtime

La API `REPLServer.prototype.convertToContext()` está desaprobada y no debería ser usada.

<a id="DEP0025"></a>

### DEP0025: require('sys')

Tipo: Runtime

El módulo `sys` está desaprobado. En cambio, por favor use el módulo [`util`][].

<a id="DEP0026"></a>

### DEP0026: util.print()

Tipo: Runtime

La API [`util.print()`][] está desaprobada. En cambio, por favor use [`console.log()`][].

<a id="DEP0027"></a>

### DEP0027: util.puts()

Tipo: Runtime

La API [`util.puts()`][] está desaprobada. En cambio, por favor use [`console.log()`][].

<a id="DEP0028"></a>

### DEP0028: util.debug()

Tipo: Runtime

La API [`util.debug()`][] está desaprobada. En cambio, por favor use [`console.error()`][].

<a id="DEP0029"></a>

### DEP0029: util.error()

Tipo: Runtime

La API [`util.error()`][] está desaprobada. En cambio, por favor use [`console.error()`][].

<a id="DEP0030"></a>

### DEP0030: SlowBuffer

Tipo: Documentation-only

La clase [`SlowBuffer`][] ha sido desaprobada. En cambio, por favor use [`Buffer.allocUnsafeSlow(size)`][].

<a id="DEP0031"></a>

### DEP0031: ecdh.setPublicKey()

Tipo: Documentation-only

El método [`ecdh.setPublicKey()`][] ahora está desaprobado ya que, su inclusión en la API no es útil.

<a id="DEP0032"></a>

### DEP0032: módulo de dominio

Tipo: Documentation-only

El módulo [`domain`][] está desaprobado y no debería ser usado.

<a id="DEP0033"></a>

### DEP0033: EventEmitter.listenerCount()

Tipo: Documentation-only

La API [`EventEmitter.listenerCount(emitter, eventName)`][] ha sido desaprobada. En cambio, por favor use [`emitter.listenerCount(eventName)`][].

<a id="DEP0034"></a>

### DEP0034: fs.exists(path, callback)

Tipo: Documentation-only

La API [`fs.exists(path, callback)`][] ha sido desaprobada. En cambio, por favor use [`fs.stat()`][] or [`fs.access()`][].

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

El módulo [`punycode`][] ha sido desaprobado. En cambio, por favor use un espacio de usuario alternativo.

<a id="DEP0041"></a>

### DEP0041: NODE\_REPL\_HISTORY\_FILE variable de entorno

Tipo: Documentation-only

La variable de entorno `NODE_REPL_HISTORY_FILE` ha sido desaprobada.

<a id="DEP0042"></a>

### DEP0042: tls.CryptoStream

Tipo: Documentation-only

La clase [`tls.CryptoStream`][] ha sido desaprobada. En cambio, por favor use [`tls.TLSSocket`][].

<a id="DEP0043"></a>

### DEP0043: tls.SecurePair

Tipo: Documentation-only

La clase [`tls.SecurePair`][] ha sido desaprobada. En cambio, por favor use [`tls.TLSSocket`][].

<a id="DEP0044"></a>

### DEP0044: util.isArray()

Tipo: Documentation-only

La API [`util.isArray()`][] ha sido desaprobada. En cambio, por favor use `Array.isArray()`.

<a id="DEP0045"></a>

### DEP0045: util.isBoolean()

Tipo: Documentation-only

La API [`util.isBoolean()`][] ha sido desaprobada.

<a id="DEP0046"></a>

### DEP0046: util.isBuffer()

Tipo: Documentation-only

La API [`util.isBuffer()`][] ha sido desaprobada. En cambio, por favor use [`Buffer.isBuffer()`][].

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

La clase `fs.SyncWriteStream` nunca estuvo destinada a ser una API públicamente accesible. No hay disponible ninguna API alternativa. Por favor use un espacio de usuario alternativo.

<a id="DEP0062"></a>

### DEP0062: node --debug

Tipo: Runtime

`--debug` activa la interfaz legacy V8 debugger, la cual ha sido removida a partir de la V8 5.8. Está reemplazada por Inspector el cual, en cambio, es activado con `--inspect`.

<a id="DEP0063"></a>

### DEP0063: ServerResponse.prototype.writeHeader()

Tipo: Documentation-only

La API `ServerResponse.prototype.writeHeader()` del módulo `http` ha sido desaprobada. En cambio, por favor use `ServerResponse.prototype.writeHead()`.

*Nota*: El método `ServerResponse.prototype.writeHeader()` nunca fue documentado como una API oficialmente soportada.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()

Tipo: Runtime

La API `tls.createSecurePair()` fue desaprobada en la documentación en Node.js 0.11.3. En cambio, los usuarios deberían usar `tls.Socket`.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC and NODE_REPL_MODE=magic

Tipo: Documentation-only

La constante `REPL_MODE_MAGIC` del módulo `repl`, utilizada para la opción de `replMode`, ha sido desaprobada. Su comportamiento ha sido funcionalmente idéntico al de `REPL_MODE_SLOPPY` desde Node.js v6.0.0, cuando V8 5.0 fue importado. En cambio, por favor use `REPL_MODE_SLOPPY`.

La variable de ambiente `NODE_REPL_MODE` es usada para fijar el `replMode` subyacente de una sesión interactiva `node`. Su valor predeterminado, `magic`, es semejantemente desaprobado en favor de `sloppy`.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames

Tipo: Documentation-only

Las propiedades `outgoingMessage._headers` y `outgoingMessage._headerNames` del módulo `http` han sido desaprobadas. En cambio, por favor use uno de los métodos públicos (e.g. `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) para trabajar con encabezados salientes.

*Nota*: `outgoingMessage._headers` y `outgoingMessage._headerNames` nunca fueron documentadas como propiedades oficialmente soportadas.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders

Tipo: Documentation-only

La API `OutgoingMessage.prototype._renderHeaders()` del módulo `http` ha sido desaprobada.

*Nota*: `OutgoingMessage.prototype._renderHeaders` nunca fue documentada como una API oficialmente soportada.

<a id="DEP0068"></a>

### DEP0068: node debug

Tipo: Runtime

`node debug` corresponde al debugger antiguo CLI el cual fue reemplazado con un debugger CLI basado en V8-inspector disponible por medio de `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)

Tipo: Documentation-only

El DebugContext será eliminado en V8 pronto y no estará disponible en Node 10+.

*Nota*: DebugContext fue una API experimental.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()

Tipo: Runtime

`async_hooks.currentId()` fue renombrado a `async_hooks.executionAsyncId()` para mayor claridad.

*Nota*: se realizó el cambio mientras `async_hooks` era una API experimental.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()

Tipo: Runtime

`async_hooks.triggerId()` fue renombrado a `async_hooks.triggerAsyncId()` para mayor claridad.

*Nota*: se realizó el cambio mientras `async_hooks` era una API experimental.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()

Tipo: Runtime

`async_hooks.AsyncResource.triggerId()` fue renombrado a `async_hooks.AsyncResource.triggerAsyncId()` para mayor claridad.

*Nota*: se realizó el cambio mientras `async_hooks` era una API experimental.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()

Tipo: Documentation-only

`tls.parseCertString()` es un ayudante trivial de parsing que fue hecho público por error. Esta función puede usualmente ser reemplazada con:

```js
const querystring = require('querystring');
querystring.parse(str, '\n', '=');
```

*Nota*: Esta función no es completamente equivalente a `querystring.parse()`. Una diferencia es que `querystring.parse()` hace url decoding:

```sh
> querystring.parse('%E5%A5%BD=1', '\n', '=');
{ '好': '1' }
> tls.parseCertString('%E5%A5%BD=1');
{ '%E5%A5%BD': '1' }
```

<a id="DEP0079"></a>

### DEP0079: Función personalizada de inspección en Objects via .inspect()

Tipo: Documentation-only

Usar una propiedad llamada `inspect` en un objecto para especificar una función de inspección personalizada para [`util.inspect()`][] está desaprobado. En cambio, use [`util.inspect.custom`][]. For backwards compatibility with Node.js prior to version 6.4.0, both may be specified.

<a id="DEP0085"></a>

### DEP0085: AsyncHooks Sensitive API

Tipo: Runtime

The AsyncHooks Sensitive API was never documented and had various of minor issues, see https://github.com/nodejs/node/issues/15572. Utilice la API `AsyncResource` en su lugar.

<a id="DEP0086"></a>

### DEP0086: Remover runInAsyncIdScope

Tipo: Runtime

`runInAsyncIdScope` no emite el evento `before` o `after` y, en consecuencia, puede causar muchos problemas. Vea https://github.com/nodejs/node/issues/14328 para más detalles.

<a id="DEP0089"></a>

### DEP0089: require('assert')

Tipo: Documentation-only

Importar directamente a assert no es recomendado, ya que las funciones expuestas usarán chequeos de calidad flojos. En cambio, use `require('assert').strict`. La API es la misma que la legacy assert pero siempre usará controles de calidad estrictos.

<a id="DEP0098"></a>

### DEP0098: AsyncHooks Embedder AsyncResource.emit{Before,After} APIs

Tipo: Runtime

The embedded API provided by AsyncHooks exposes emit{Before,After} methods which are very easy to use incorrectly which can lead to unrecoverable errors.

En cambio, use la API [`asyncResource.runInAsyncScope()`][] la cual provee una alternativa mucho más segura y conveniente. Vea https://github.com/nodejs/node/pull/18513 para más detalles.
