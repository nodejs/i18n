# APIs desaprobadas

<!--introduced_in=v7.7.0-->

<!-- type=misc -->

Node.js puede desaprobar APIs cuando: (a) el uso de la API es considerado como inseguro, (b) una API alternativa y mejorada ha comenzado a estar disponible, o (c) cambios importantes para la API están planificados en una importante actualización futura.

Node.js utiliza tres tipos de Desaprobaciones:

- Documentation-only
- Runtime
- End-of-Life

Una desaprobación de tipo documentation-only es una que está expresada solo dentro de los documentos de API de Node.js. Estas no generan ningún efecto secundario al ejecutar Node.js. Algunas desaprobaciones que son de tipo documentation-only, provocan una advertencia en runtime cuando son ejecutadas con la bandera [`--pending-deprecation`][] (o su alternativa, la variable de ambiente `NODE_PENDING_DEPRECATION=1`), de manera similar a las desaprobaciones mostradas abajo. Las desaprobaciones de tipo documentation-only que soporten esa bandera están explicítamente indicadas como tales en la [lista de APIs Desaprobadas](#deprecations_list_of_deprecated_apis).

Una desaprobación de Runtime generará, de forma predeterminada, un proceso de advertencia que será estampado a `stderr` la primera vez que la API desaprobada sea usada. Cuando la bandera de línea de comando `--throw-deprecation` es usada, una desaprobación de Runtime causará que se arroje un error.

Una desaprobación de tipo End-of-Life es usada para identificar código que o ha sido removido, o pronto será removido de Node.js.

## Revocación de desaprobaciones

Ocasionalmente, la desaprobación de una API puede ser revertida. En estas situaciones, el documento será actualizado con información relevante a la decisión. Sin embargo, el identificador de la desaprobación no será modificado.

## Lista de APIs Desaprobadas

<a id="DEP0001"></a>

### DEP0001: http.OutgoingMessage.prototype.flush

Tipo: Runtime

El método `OutgoingMessage.prototype.flush()` está desaprobado. En cambio, use `OutgoingMessage.prototype.flushHeaders()`.

<a id="DEP0002"></a>

### DEP0002: requiere('\_linklist')

Tipo: End-of-Life

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

Tipo: End-of-Life

En una versión previa del `cluster` Node.js, una propiedad booleana con el nombre `suicide` fue agregada al objeto `Worker`. La intención de esta propiedad fue proveer una indicación sobre cómo y por qué la instancia `Worker` salió. En Node.js 6.0.0, la vieja propiedad fue desaprobada y reemplazada con una nueva propiedad [`worker.exitedAfterDisconnect`][]. El nombre de la vieja propiedad no describía precisamente la verdadera semántica y fue innecesariamente cargada de emoción.

<a id="DEP0008"></a>

### DEP0008: requiere('constants')

Tipo: Documentation-only

El módulo `constants` ha sido desaprobado. Cuando se requiere acceso a constantes relevantes a módulos específicos integrados a Node.js, los desarrolladores, en cambio, deberían referir a la propiedad `constants` expuesta por el módulo relevante. Por ejemplo, `require('fs').constants` y `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 sin resumen

Tipo: End-of-Life

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

Tipo: Fin-de-Vida

`Domain.dispose()` ha sido removido. En cambio, recupérese de acciones I/O fallidas explícitamente por medio de los gestores de eventos de error establecidos en el dominio.

<a id="DEP0013"></a>

### DEP0013: fs función asincrónica sin callback

Tipo: Fin-de-Vida

Llamar a una función asincrónica sin un callback nos lanza un `TypeError` en Node.js 10.0.0 y en adelante. (Vea https://github.com/nodejs/node/pull/12562.)

<a id="DEP0014"></a>

### DEP0014: fs.read interfaz de String antigua

Tipo: Fin-de-Vida

La interfaz de `String` legacy [`fs.read()`][] está desaprobada. En cambio, use la API `Buffer` como se menciona en la documentación.

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

Tipo: Final-de-Vida

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

Tipo: Final-de-Vida

La variable de entorno `NODE_REPL_HISTORY_FILE` ha sido removida. En cambio, por favor use `NODE_REPL_HISTORY`.

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

El método `ServerResponse.prototype.writeHeader()` nunca fue documentado como una API oficialmente soportada.

<a id="DEP0064"></a>

### DEP0064: tls.createSecurePair()

Tipo: Runtime

La API `tls.createSecurePair()` fue desaprobada en la documentación en Node.js 0.11.3. En cambio, los usuarios deberían usar `tls.Socket`.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC and NODE_REPL_MODE=magic

Tipo: End-of-Life

La constante `REPL_MODE_MAGIC` del módulo `repl`, usada para la opción `replMode`, ha sido removida. Su comportamiento ha sido funcionalmente idéntico al de `REPL_MODE_SLOPPY` desde Node.js 6.0.0, cuando V8 5.0 fue importada. En cambio, por favor use `REPL_MODE_SLOPPY`.

La variable de ambiente `NODE_REPL_MODE` es usada para fijar el `replMode` subyacente de una sesión interactiva `node`. Su valor, `magic`, también está removido. En cambio, por favor use `sloppy`.

<a id="DEP0066"></a>

### DEP0066: outgoingMessage.\_headers, outgoingMessage.\_headerNames

Tipo: Documentation-only

Las propiedades `outgoingMessage._headers` y `outgoingMessage._headerNames` del módulo `http` han sido desaprobadas. En cambio, por favor use uno de los métodos públicos (e.g. `outgoingMessage.getHeader()`, `outgoingMessage.getHeaders()`, `outgoingMessage.getHeaderNames()`, `outgoingMessage.hasHeader()`, `outgoingMessage.removeHeader()`, `outgoingMessage.setHeader()`) para trabajar con encabezados salientes.

Las propiedades `outgoingMessage._headers` y `outgoingMessage._headerNames` nunca fueron documentadas como propiedades oficialmente soportadas.

<a id="DEP0067"></a>

### DEP0067: OutgoingMessage.prototype.\_renderHeaders

Tipo: Documentation-only

La API `OutgoingMessage.prototype._renderHeaders()` del módulo `http` ha sido desaprobada.

La propiedad `OutgoingMessage.prototype._renderHeaders` nunca fue documentada como una API oficialmente soportada.

<a id="DEP0068"></a>

### DEP0068: node debug

Tipo: Runtime

`node debug` corresponde al debugger antiguo CLI el cual fue reemplazado con un debugger CLI basado en V8-inspector disponible por medio de `node inspect`.

<a id="DEP0069"></a>

### DEP0069: vm.runInDebugContext(string)

Tipo: End-of-Life

DebugContext ha sido removido en V8 y no está disponible en Node.js 10+.

DebugContext fue una API experimental.

<a id="DEP0070"></a>

### DEP0070: async_hooks.currentId()

Tipo: End-of-Life

`async_hooks.currentId()` fue renombrado a `async_hooks.executionAsyncId()` para mayor claridad.

Este cambio se hizo mientras `async_hooks` era una API experimental.

<a id="DEP0071"></a>

### DEP0071: async_hooks.triggerId()

Tipo: End-of-Life

`async_hooks.triggerId()` fue renombrado a `async_hooks.triggerAsyncId()` para mayor claridad.

Este cambio se hizo mientras `async_hooks` era una API experimental.

<a id="DEP0072"></a>

### DEP0072: async_hooks.AsyncResource.triggerId()

Tipo: End-of-Life

`async_hooks.AsyncResource.triggerId()` fue renombrado a `async_hooks.AsyncResource.triggerAsyncId()` para mayor claridad.

Este cambio se hizo mientras `async_hooks` era una API experimental.

<a id="DEP0073"></a>

### DEP0073: Varias propiedades internas de net.Server

Tipo: End-of-Life

Acceder a varias propiedades internas e indocumentadas de instancias de `net.Server` con nombres inapropiados ha sido desaprobado.

Como la API original estaba indocumentada y generalmente no era útil para código no interno, ninguna API de reemplazo fue prevista.

<a id="DEP0074"></a>

### DEP0074: REPLServer.bufferedCommand

Tipo: Runtime

La propiedad `REPLServer.bufferedCommand` fue desaprobada en favor de [`REPLServer.clearBufferedCommand()`][].

<a id="DEP0075"></a>

### DEP0075: REPLServer.parseREPLKeyword()

Tipo: Runtime

`REPLServer.parseREPLKeyword()` fue removido de la visibilidad del espacio de usuario.

<a id="DEP0076"></a>

### DEP0076: tls.parseCertString()

Tipo: Runtime

`tls.parseCertString()` es un ayudante trivial de parsing que fue hecho público por error. Esta función puede usualmente ser reemplazada con:

```js
const querystring = require('querystring');
querystring.parse(str, '\n', '=');
```

Esta función no es completamente equivalente a `querystring.parse()`. Una diferencia es que `querystring.parse()` hace url decoding:

```sh
> querystring.parse('%E5%A5%BD=1', '\n', '=');
{ '好': '1' }
> tls.parseCertString('%E5%A5%BD=1');
{ '%E5%A5%BD': '1' }
```

<a id="DEP0077"></a>

### DEP0077: Module.\_debug()

Tipo: Runtime

`Module._debug()` ha sido desaprobado.

La función `Module._debug()` nunca fue documentada como una API oficialmente soportada.

<a id="DEP0078"></a>

### DEP0078: REPLServer.turnOffEditorMode()

Tipo: Runtime

`REPLServer.turnOffEditorMode()` fue removido de la visibilidad del espacio de usuario.

<a id="DEP0079"></a>

### DEP0079: Función personalizada de inspección en Objects via .inspect()

Tipo: Runtime

Usar una propiedad llamada `inspect` en un objecto para especificar una función de inspección personalizada para [`util.inspect()`][] está desaprobado. En cambio, use [`util.inspect.custom`][]. Para retrocompatibilidad con versiones de Node.js previas a la 6.4.0, ambos pueden ser especificados.

<a id="DEP0080"></a>

### DEP0080: path.\_makeLong()

Tipo: Documentation-only

El internal `path._makeLong()` no estaba destinado para uso público. Sin embargo, módulos del espacio de usuario lo han encontrado útil. La API internal ha sido desaprobada y reemplazada con un método `path.toNamespacedPath()` idéntico y público.

<a id="DEP0081"></a>

### DEP0081: fs.truncate() usando un descriptor de archivo

Tipo: Runtime

El uso de `fs.truncate()` `fs.truncateSync()` con un descriptor de archivo ha sido desaprobado. Por favor use `fs.ftruncate()` o `fs.ftruncateSync()` para trabajar con descriptores de archivos.

<a id="DEP0082"></a>

### DEP0082: REPLServer.prototype.memory()

Tipo: Runtime

`REPLServer.prototype.memory()` es solo necesario para la mecánica interna del mismo `REPLServer`. No use esta función.

<a id="DEP0083"></a>

### DEP0083: Deshabilitar a ECDH fijando a ecdhCurve como falso

Tipo: Runtime

La opción `ecdhCurve` para `tls.createSecureContext()` y `tls.TLSSocket` podría ser fijada como `false` para deshabilitar enteramente a ECDH solamente en el servidor. Este modo está desaprobado en preparación para la migración a OpenSSL 1.1.0 y consistencia con el cliente. En cambio, use el parámetro `ciphers`.

<a id="DEP0084"></a>

### DEP0084: requerir dependencias internas agrupadas

Tipo: Runtime

Desde las versiones 4.4.0 y 5.2.0 de Node.js, varios módulos destinados solo para uso interno están expuestos erróneamente a código de usuario por medio de `require()`. Estos módulos son:

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
- `node-inspect/lib/_inspect` (desde 7.6.0)
- `node-inspect/lib/internal/inspect_client` (desde 7.6.0)
- `node-inspect/lib/internal/inspect_repl` (desde 7.6.0)

Los módulos `v8/*` no tienen ninguna exportación, y si no son importados en un orden específico arrojarían errores. Como tal, virtualmente no hay ningún caso de uso legítimo para importarlos por medio de `require()`.

Por otra parte, `node-inspect` puede ser instalado localmente por medio de un administrador de paquetes, como se explica en el registro npm que lleva el mismo nombre. Ninguna modificación del código fuente es necesaria si eso se hace.

<a id="DEP0085"></a>

### DEP0085: AsyncHooks Sensitive API

Tipo: End-of-Life

La AsyncHooks Sensitive API nunca fue documentada y tuvo varios problemas menores. (Vea https://github.com/nodejs/node/issues/15572.) En cambio, use la API `AsyncResource`.

<a id="DEP0086"></a>

### DEP0086: Remover runInAsyncIdScope

Tipo: End-of-Life

`runInAsyncIdScope` no emite el evento `'before'` o `'after'` y, en consecuencia, puede causar muchos problemas. Vea https://github.com/nodejs/node/issues/14328 para más detalles.

<a id="DEP0089"></a>

### DEP0089: require('assert')

Tipo: Documentation-only

Importar directamente a assert no es recomendado, ya que las funciones expuestas usarán chequeos de calidad flojos. En cambio, use `require('assert').strict`. La API es la misma que la legacy assert pero siempre usará controles de calidad estrictos.

<a id="DEP0090"></a>

### DEP0090: Extensión de la etiqueta de autentificación GCM inválida

Tipo: Runtime

Node.js soporta toda la extensión de las etiquetas de autentificación GCM que sean aceptatadas por OpenSSL al llamar a [`decipher.setAuthTag()`][]. Este comportamiento cambiará en una versión futura, en cuyo momento solo la extensión de las etiquetas de autentificación de 28, 120, 112, 104, 96, 64, y 32 bits serán permitidas. Las etiquetas de autentificación cuya extensión no se encuentre incluida en esta lista será considerada inválida en conformidad con [NIST SP 800-38D](http://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

<a id="DEP0091"></a>

### DEP0091: crypto.DEFAULT_ENCODING

Tipo: Runtime

La propiedad [`crypto.DEFAULT_ENCODING`][] está desaprobada.

<a id="DEP0092"></a>

### DEP0092: `esto` de nivel superior enlazado a `module.exports`

Tipo: Documentation-only

Asignar propiedades a `esto` de nivel superior, como una alternativa al módulo `module.exports`, está desaprobado. Los desarrolladores deberían, en cambio, usar `exports` o `module.exports`.

<a id="DEP0093"></a>

### DEP0093: crypto.fips está desaprobado y reemplazado.

Tipo: Documentation-only

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

### DEP0098: APIs AsyncHooks Embedder AsyncResource.emitBefore y AsyncResource.emitAfter

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

Tipo: End-of-Life

La opción de tiempo-de-compilación`--with-lttng` ha sido removida.

<a id="DEP0102"></a>

### DEP0102: Usar `noAssert` en operaciones Buffer#(read|write).

Tipo: End-of-Life

Usar el argumento `noAssert` ya no tiene ninguna funcionalidad. Todo lo que entre va a ser verificado, sin importar si está establecido a true o no. Omitir la verificación puede resultar en errores y fallas difíciles de conseguir.

<a id="DEP0103"></a>

### DEP0103: process.binding('util').is[...] typechecks

Type: Documentation-only (soporta [`--pending-deprecation`][])

El uso de `process.binding()` en general debería ser evitado. Particularmente, los métodos de comprobación de tipos pueden ser reemplazados usando [`util.types`][].

<a id="DEP0104"></a>

### DEP0104: process.env coerción de string

Tipo: Documentation-only (soporta[`--pending-deprecation`][])

Cuando se asigna una propiedad sin string a [`process.env`][], el valor asignado es implícitamente convertido a una string. Este comportamiento es desaprobado si el valor asignado no es una string, un booleano, o un número. En el futuro, dicha asignación puede resultar en un error. Por favor convierta la propiedad a una string antes de asignarla a `process.env`.

<a id="DEP0105"></a>

### DEP0105: decipher.finaltol

Tipo: Runtime

`decipher.finaltol()` nunca ha sido documentato y actualmente es un alias para [`decipher.final()`][]. En el futuro, esta API seguramente sea removida, y en cambio se recomienda usar [`decipher.final()`][].

<a id="DEP0106"></a>

### DEP0106: crypto.createCipher y crypto.createDecipher

Tipo: Documentation-only

Debería evitarse usar [`crypto.createCipher()`][] y [`crypto.createDecipher()`][], debido a que utilizan una función de derivación de clave débil (MD5 sin salt) y vectores de inicialización estáticos. Es recomendado derivar una clave utilizando [`crypto.pbkdf2()`][] y usar [`crypto.createCipheriv()`][] y [`crypto.createDecipheriv()`][] para obtener los objectos [`Cipher`][] y [`Decipher`][], respectivamente.

<a id="DEP0107"></a>

### DEP0107: tls.convertNPNProtocols()

Tipo: Runtime

Esto fue una función auxiliar indocumentada no destinada al uso afuera del core Node.js y obsoleta por la eliminación del soporte NPN (Next Protocol Negotiation).

<a id="DEP0108"></a>

### DEP0108: zlib.bytesRead

Tipo: Documentation-only

Alias desaprobado para [`zlib.bytesWritten`][]. El nombre original fue elegido porque también tenía sentido interpretar el valor como el número de bytes leídos por el motor, pero es inconsistente con otros streams en Node.js que exponen valores bajo estos nombres.