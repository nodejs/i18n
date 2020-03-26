# APIs Desaprobadas

<!--introduced_in=v7.7.0-->
<!-- type=misc -->

Node.js may deprecate APIs when either: (a) use of the API is considered to be unsafe, (b) an improved alternative API is available, or (c) breaking changes to the API are expected in a future major release.

Node.js utiliza tres tipos de Desaprobaciones:

* Sólo Documentación
* Duración
* Final de Vida

Una desaprobación de tipo documentation-only es una que está expresada solo dentro de los documentos de API de Node.js. Estas no generan ningún efecto secundario al ejecutar Node.js. Algunas desaprobaciones que son de tipo documentation-only, provocan una advertencia en runtime cuando son ejecutadas con la bandera [`--pending-deprecation`][] (o su alternativa, la variable de ambiente `NODE_PENDING_DEPRECATION=1`), de manera similar a las desaprobaciones mostradas abajo. Las desaprobaciones de tipo documentation-only que soporten esa bandera están explicítamente indicadas como tales en la [lista de APIs Desaprobadas](#deprecations_list_of_deprecated_apis).

Una desaprobación de Runtime generará, de forma predeterminada, un proceso de advertencia que será estampado a `stderr` la primera vez que la API desaprobada sea usada. Cuando la bandera de línea de comando `--throw-deprecation` es usada, una desaprobación de Runtime causará que se arroje un error.

An End-of-Life deprecation is used when functionality is or will soon be removed from Node.js.

## Revocación de desaprobaciones

Ocasionalmente, la desaprobación de una API puede ser revertida. En estas situaciones, el documento será actualizado con información relevante a la decisión. Sin embargo, el identificador de la desaprobación no será modificado.

## Lista de APIs Desaprobadas

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

El método `OutgoingMessage.prototype.flush()` está desaprobado. En cambio, use `OutgoingMessage.prototype.flushHeaders()`.

<a id="DEP0002"></a>

### DEP0002: requiere('\_linklist')
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

Tipo: Fin-de-Vida

El módulo `_linklist` está desaprobado. Por favor use un espacio de usuario alternativo.

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

La propiedad `_writableState.buffer` está desaprobada. En cambio, use el método `_writableState.getBuffer()`.

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

Tipo: Fin-de-Vida

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

Tipo: Runtime (soporta [`--pending-deprecation`][])

La función `Buffer()` y el constructor `new Buffer()` están desaprobados debido a problemas de usabilidad con la API que pueden potencialmente resultar en problemas accidentales de seguridad.

Como alternativa, el uso de los siguientes métodos de construcción de objetos `Buffer` es fuertemente recomendado:

* [`Buffer.alloc(size[, fill[, encoding]])`](buffer.html#buffer_class_method_buffer_alloc_size_fill_encoding) - Crea un `Buffer` con memoria *inicializada*.
* [`Buffer.allocUnsafe(size)`](buffer.html#buffer_class_method_buffer_allocunsafe_size) - Crear un `Buffer` con memoria *sin inicializar*.
* [`Buffer.allocUnsafeSlow(size)`][] - Create a `Buffer` with *uninitialized* memory.
* [`Buffer.from(array)`][] - Crea un `Buffer` con una copia de `array`
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`](buffer.html#buffer_class_method_buffer_from_arraybuffer_byteoffset_length) - Crear un `Buffer` que envuelva al `arrayBuffer` dado.
* [`Buffer.from(buffer)`][] - Crea un `Buffer` que copia a `buffer`.
* [`Buffer.from(string[, encoding])`](buffer.html#buffer_class_method_buffer_from_string_encoding) - Crear un `Buffer` que copie a `string`.

Desde la v10.0.0, una advertencia de desaprobación es emitida en runtime cuando `--pending-deprecation` es usada o cuando el código de llamada está afuera de `node_modules`, de modo que se apunte mejor a los desarrolladores, y no a los usuarios.

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

Dentro de [`child_process`][] los métodos de los módulos `spawn()`, `fork()`, y `exec()`, la opción `options.customFds` está desaprobada. La opción `options.stdio` debería ser usada en su lugar.

<a id="DEP0007"></a>

### DEP0007: Reemplace el grupo worker.suicide con worker.exitedAfterDisconnect
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

Tipo: Fin-de-Vida

En una versión previa del `cluster` Node.js, una propiedad booleana con el nombre `suicide` fue agregada al objeto `Worker`. La intención de esta propiedad fue proveer una indicación sobre cómo y por qué la instancia `Worker` salió. En Node.js 6.0.0, la vieja propiedad fue desaprobada y reemplazada con una nueva propiedad [`worker.exitedAfterDisconnect`][]. El nombre de la vieja propiedad no describía precisamente la verdadera semántica y fue innecesariamente cargada de emoción.

<a id="DEP0008"></a>

### DEP0008: requiere('constants')
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

The `constants` module is deprecated. Cuando se requiere acceso a constantes relevantes a módulos específicos integrados a Node.js, los desarrolladores, en cambio, deberían referir a la propiedad `constants` expuesta por el módulo relevante. Por ejemplo, `require('fs').constants` y `require('os').constants`.

<a id="DEP0009"></a>

### DEP0009: crypto.pbkdf2 sin resumen
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

Tipo: Fin-de-Vida

El uso de la API [`crypto.pbkdf2()`][] sin especificar un resumen fue desaprobado en Node.js 6.0, porque el método usó de manera predeterminada el resumen no recomendado `'SHA1'`. Previamente, una advertencia de desaprobación fue emitida. A partir de Node.js 8.0.0, llamar a `crypto.pbkdf2()` o `crypto.pbkdf2Sync()` con un `digest` indefinido dará como resultado un `TypeError`.

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

La API [`crypto.createCredentials()`][] está desaprobada. En cambio, por favor use [`tls.createSecureContext()`][].

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

La clase `crypto.Credentials` está desaprobada. En cambio, porfavor use [`tls.SecureContext`][].

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

Tipo: Fin-de-Vida

`Domain.dispose()` ha sido removido. En cambio, recupérese de acciones I/O fallidas explícitamente por medio de los gestores de eventos de error establecidos en el dominio.

<a id="DEP0013"></a>

### DEP0013: fs función asincrónica sin callback
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18668
    description: End-of-Life.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: Runtime deprecation.
-->

Tipo: Fin-de-Vida

Llamar a una función asincrónica sin un callback nos lanza un `TypeError` en Node.js 10.0.0 y en adelante. (See <https://github.com/nodejs/node/pull/12562>.)

<a id="DEP0014"></a>

### DEP0014: fs.read interfaz de String antigua
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

Tipo: Fin-de-Vida

La interfaz de `String` legacy [`fs.read()`][] está desaprobada. En cambio, use la API `Buffer` como se menciona en la documentación.

<a id="DEP0015"></a>

### DEP0015: fs.readSync interfaz de String antigua
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

Tipo: Fin-de-Vida

La interfaz de `String` antigua [`fs.readSync()`][] está desaprobada. En cambio, use la API `Buffer` como se menciona en la documentación.

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

Tipo: Final-de-Vida

`Intl.v8BreakIterator` fue una extensión no estándar y ha sido removida. Vea [`Intl.Segmenter`](https://github.com/tc39/proposal-intl-segmenter).

<a id="DEP0018"></a>

### DEP0018: rechazos de promesas sin gestionar
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8217
    description: Runtime deprecation.
-->

Tipo: Runtime

Los rechazos de promesas sin gestionar están desaprobados. En el futuro, rechazos de promesas que no sean gestionados terminarán el proceso de Node.js con un código de salida non-zero.

<a id="DEP0019"></a>

### DEP0019: require('.') resuelto fuera del directorio
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

En ciertos casos, `require('.')` puede resolver fuera del directorio de paquetes. Este comportamiento está desaprobado y será removido en una importante actualización futura de Node.js.

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

La propiedad [`Server.connections`][] está desaprobada. En cambio, por favor use el método [`Server.getConnections()`][].

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

El método `Server.listenFD()` está desaprobado. En cambio, por favor use [`Server.listen({fd: <number>})`][].

<a id="DEP0022"></a>

### DEP0022: os.tmpDir()
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/6739
    description: Runtime deprecation.
-->

Tipo: Runtime

La API `os.tmpDir()` está desaprobada. En cambio, por favor use [`os.tmpdir()`][].

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

El método `os.getNetworkInterfaces()` está desaprobado. En cambio, por favor use [`os.networkInterfaces`][].

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

Tipo: Fin-de-Vida

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

El módulo `sys` está desaprobado. En cambio, por favor use el módulo [`util`][].

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

La API [`util.print()`][] está desaprobada. En cambio, por favor use [`console.log()`][].

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

La API [`util.puts()`][] está desaprobada. En cambio, por favor use [`console.log()`][].

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

La API [`util.debug()`][] está desaprobada. En cambio, por favor use [`console.error()`][].

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

La API [`util.error()`][] está desaprobada. En cambio, por favor use [`console.error()`][].

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

The [`SlowBuffer`][] class is deprecated. En cambio, por favor use [`Buffer.allocUnsafeSlow(size)`][].

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

El método [`ecdh.setPublicKey()`][] ahora está desaprobado ya que, su inclusión en la API no es útil.

<a id="DEP0032"></a>

### DEP0032: módulo de dominio
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

El módulo [`domain`][] está desaprobado y no debería ser usado.

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

The [`EventEmitter.listenerCount(emitter, eventName)`][] API is deprecated. En cambio, por favor use [`emitter.listenerCount(eventName)`][].

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

The [`fs.exists(path, callback)`][] API is deprecated. En cambio, por favor use [`fs.stat()`][] or [`fs.access()`][].

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

### DEP0040: módulo punycode
<!-- YAML
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7941
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

The [`punycode`][] module is deprecated. En cambio, por favor use un espacio de usuario alternativo.

<a id="DEP0041"></a>

### DEP0041: NODE\_REPL\_HISTORY\_FILE variable de entorno
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

Tipo: Fin-de-Vida

La variable de entorno `NODE_REPL_HISTORY_FILE` ha sido removida. En cambio, por favor use `NODE_REPL_HISTORY`.

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

Tipo: Fin-de-Vida

The [`tls.CryptoStream`][] class was removed. En cambio, por favor use [`tls.TLSSocket`][].

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

The [`tls.SecurePair`][] class is deprecated. En cambio, por favor use [`tls.TLSSocket`][].

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

La API [`util.isArray()`][] está desaprobada. En cambio, por favor use `Array.isArray()`.

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

La API [`util.isBoolean()`][] está desaprobada.

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

La API [`util.isBuffer()`][] está desaprobada. En cambio, por favor use [`Buffer.isBuffer()`][].

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

La API [`util.isDate()`][] está desaprobada.

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

La API [`util.isError()`][] está desaprobada.

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

La API [`util.isFunction()`][] está desaprobada.

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

La API [`util.isNull()`][] está desaprobada.

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

La API [`util.isNullOrUndefined()`][] está desaprobada.

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

La API [`util.isNumber()`][] está desaprobada.

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

La API [`util.isObject()`][] está desaprobada.

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

La API [`util.isPrimitive()`][] está desaprobada.

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

La API [`util.isRegExp()`][] está desaprobada.

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

La API [`util.isString()`][] está desaprobada.

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

La API [`util.isSymbol()`][] está desaprobada.

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

La API [`util.isUndefined()`][] está desaprobada.

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

La API [`util.log()`][] está desaprobada.

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

La clase `fs.SyncWriteStream` nunca estuvo destinada a ser una API públicamente accesible. No hay disponible ninguna API alternativa. Por favor use un espacio de usuario alternativo.

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

The `http` module `ServerResponse.prototype.writeHeader()` API is deprecated. En cambio, por favor use `ServerResponse.prototype.writeHead()`.

El método `ServerResponse.prototype.writeHeader()` nunca fue documentado como una API oficialmente soportada.

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

La API `tls.createSecurePair()` fue desaprobada en la documentación en Node.js 0.11.3. En cambio, los usuarios deberían usar `tls.Socket`.

<a id="DEP0065"></a>

### DEP0065: repl.REPL_MODE_MAGIC and NODE_REPL_MODE=magic
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19187
    description: End-of-Life.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11599
    description: Documentation-only deprecation.
-->

Tipo: Fin-de-Vida

La constante `REPL_MODE_MAGIC` del módulo `repl`, usada para la opción `replMode`, ha sido removida. Su comportamiento ha sido funcionalmente idéntico al de `REPL_MODE_SLOPPY` desde Node.js 6.0.0, cuando V8 5.0 fue importada. En cambio, por favor use `REPL_MODE_SLOPPY`.

La variable de ambiente `NODE_REPL_MODE` es usada para fijar el `replMode` subyacente de una sesión interactiva `node`. Su valor, `magic`, también está removido. En cambio, por favor use `sloppy`.

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

Las propiedades `outgoingMessage._headers` y `outgoingMessage._headerNames` nunca fueron documentadas como propiedades oficialmente soportadas.

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

La propiedad `OutgoingMessage.prototype._renderHeaders` nunca fue documentada como una API oficialmente soportada.

<a id="DEP0068"></a>

### DEP0068: node debug
<!-- YAML
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11441
    description: Runtime deprecation.
-->

Tipo: Runtime

`node debug` corresponde al debugger antiguo CLI el cual fue reemplazado con un debugger CLI basado en V8-inspector disponible por medio de `node inspect`.

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

Tipo: Fin-de-Vida

DebugContext ha sido removido en V8 y no está disponible en Node.js 10+.

DebugContext fue una API experimental.

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

`async_hooks.currentId()` fue renombrado a `async_hooks.executionAsyncId()` para mayor claridad.

Este cambio se hizo mientras `async_hooks` era una API experimental.

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

Tipo: Fin-de-Vida

`async_hooks.triggerId()` fue renombrado a `async_hooks.triggerAsyncId()` para mayor claridad.

Este cambio se hizo mientras `async_hooks` era una API experimental.

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

Tipo: Fin-de-Vida

`async_hooks.AsyncResource.triggerId()` fue renombrado a `async_hooks.AsyncResource.triggerAsyncId()` para mayor claridad.

Este cambio se hizo mientras `async_hooks` era una API experimental.

<a id="DEP0073"></a>

### DEP0073: Varias propiedades internas de net.Server
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17141
    description: End-of-Life.
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14449
    description: Runtime deprecation.
-->

Tipo: Fin-de-Vida

Accessing several internal, undocumented properties of `net.Server` instances with inappropriate names is deprecated.

Como la API original estaba indocumentada y generalmente no era útil para código no interno, ninguna API de reemplazo fue prevista.

<a id="DEP0074"></a>

### DEP0074: REPLServer.bufferedCommand
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13687
    description: Runtime deprecation.
-->

Tipo: Runtime

La propiedad `REPLServer.bufferedCommand` fue desaprobada en favor de [`REPLServer.clearBufferedCommand()`][].

<a id="DEP0075"></a>

### DEP0075: REPLServer.parseREPLKeyword()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14223
    description: Runtime deprecation.
-->

Tipo: Runtime

`REPLServer.parseREPLKeyword()` fue removido de la visibilidad del espacio de usuario.

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
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13948
    description: Runtime deprecation.
-->

Tipo: Runtime

`Module._debug()` is deprecated.

La función `Module._debug()` nunca fue documentada como una API oficialmente soportada.

<a id="DEP0078"></a>

### DEP0078: REPLServer.turnOffEditorMode()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15136
    description: Runtime deprecation.
-->

Tipo: Runtime

`REPLServer.turnOffEditorMode()` fue removido de la visibilidad del espacio de usuario.

<a id="DEP0079"></a>

### DEP0079: Función personalizada de inspección en Objects via .inspect()
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

Usar una propiedad llamada `inspect` en un objecto para especificar una función de inspección personalizada para [`util.inspect()`][] está desaprobado. En cambio, use [`util.inspect.custom`][]. Para retrocompatibilidad con versiones de Node.js previas a la 6.4.0, ambos pueden ser especificados.

<a id="DEP0080"></a>

### DEP0080: path.\_makeLong()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/14956
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

El internal `path._makeLong()` no estaba destinado para uso público. Sin embargo, módulos del espacio de usuario lo han encontrado útil. The internal API is deprecated and replaced with an identical, public `path.toNamespacedPath()` method.

<a id="DEP0081"></a>

### DEP0081: fs.truncate() usando un descriptor de archivo
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/15990
    description: Runtime deprecation.
-->

Tipo: Runtime

`fs.truncate()` `fs.truncateSync()` usage with a file descriptor is deprecated. Por favor use `fs.ftruncate()` o `fs.ftruncateSync()` para trabajar con descriptores de archivos.

<a id="DEP0082"></a>

### DEP0082: REPLServer.prototype.memory()
<!-- YAML
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/16242
    description: Runtime deprecation.
-->

Tipo: Runtime

`REPLServer.prototype.memory()` es solo necesario para la mecánica interna del mismo `REPLServer`. No use esta función.

<a id="DEP0083"></a>

### DEP0083: Deshabilitar a ECDH fijando a ecdhCurve como falso
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19794
    description: End-of-Life.
  - version: v9.2.0
    pr-url: https://github.com/nodejs/node/pull/16130
    description: Runtime deprecation.
-->

Tipo: Fin-de-Vida.

La opción `ecdhCurve` para `tls.createSecureContext()` y `tls.TLSSocket` podría ser fijada como `false` para deshabilitar enteramente a ECDH solamente en el servidor. This mode was deprecated in preparation for migrating to OpenSSL 1.1.0 and consistency with the client and is now unsupported. En cambio, use el parámetro `ciphers`.

<a id="DEP0084"></a>

### DEP0084: requerir dependencias internas agrupadas
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16392
    description: Runtime deprecation.
-->

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

Tipo: Fin-de-Vida

La AsyncHooks Sensitive API nunca fue documentada y tuvo varios problemas menores. (See <https://github.com/nodejs/node/issues/15572>.) Use the `AsyncResource` API instead.

<a id="DEP0086"></a>

### DEP0086: Remover runInAsyncIdScope
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

Tipo: Fin-de-Vida

`runInAsyncIdScope` no emite el evento `'before'` o `'after'` y, en consecuencia, puede causar muchos problemas. See <https://github.com/nodejs/node/issues/14328> for more details.

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

Importar directamente a assert no es recomendado, ya que las funciones expuestas usarán chequeos de calidad flojos. En cambio, use `require('assert').strict`. La API es la misma que la legacy assert pero siempre usará controles de calidad estrictos.

<a id="DEP0090"></a>

### DEP0090: Extensión de la etiqueta de autentificación GCM inválida
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18017
    description: Runtime deprecation.
-->

Tipo: Runtime

Node.js soporta toda la extensión de las etiquetas de autentificación GCM que sean aceptatadas por OpenSSL al llamar a [`decipher.setAuthTag()`][]. Este comportamiento cambiará en una versión futura, en cuyo momento solo la extensión de las etiquetas de autentificación de 28, 120, 112, 104, 96, 64, y 32 bits serán permitidas. Las etiquetas de autentificación cuya extensión no se encuentre incluida en esta lista será considerada inválida en conformidad con [NIST SP 800-38D](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf).

<a id="DEP0091"></a>

### DEP0091: crypto.DEFAULT_ENCODING
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18333
    description: Runtime deprecation.
-->

Tipo: Runtime

La propiedad [`crypto.DEFAULT_ENCODING`][] está desaprobada.

<a id="DEP0092"></a>

### DEP0092: `esto` de nivel superior enlazado a `module.exports`
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/16878
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Asignar propiedades a `esto` de nivel superior, como una alternativa al módulo `module.exports`, está desaprobado. Los desarrolladores deberían, en cambio, usar `exports` o `module.exports`.

<a id="DEP0093"></a>

### DEP0093: crypto.fips está desaprobado y reemplazado.
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18335
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

La propiedad [`crypto.fips`][] está desaprobada. En cambio, por favor use `crypto.setFips()` y `crypto.getFips()`.

<a id="DEP0094"></a>

### DEP0094: Usar `assert.fail()` con más de un argumento.
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18418
    description: Runtime deprecation.
-->

Tipo: Runtime

Usar `assert.fail()` con más de un argumento está desaprobado. Use `assert.fail()` con un solo argumento o use un diferente método de módulo `assert`.

<a id="DEP0095"></a>

### DEP0095: timers.enroll()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18066
    description: Runtime deprecation.
-->

Tipo: Runtime

`timers.enroll()` está desaprobado. En cambio, por favor use el públicamente documentado [`setTimeout()`][] o [`setInterval()`][].

<a id="DEP0096"></a>

### DEP0096: timers.unenroll()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18066
    description: Runtime deprecation.
-->

Tipo: Runtime

`timers.unenroll()` está desaprobado. En cambio, por favor use el públicamente documentado [`clearTimeout()`][] o [`clearInterval()`][].

<a id="DEP0097"></a>

### DEP0097: MakeCallback con propiedad del dominio
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17417
    description: Runtime deprecation.
-->

Tipo: Runtime

Usuarios de `MakeCallback` que agreguen la propiedad `domain` para llevar el contexto, deberían empezar a usar la variante `async_context` de `MakeCallback` o `CallbackScope`, o la clase de nivel alto `AsyncResource`.

<a id="DEP0098"></a>

### DEP0098: APIs AsyncHooks Embedder AsyncResource.emitBefore y AsyncResource.emitAfter
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

La API incrustrada provista por AsyncHooks expone los métodos `.emitBefore()` y `.emitAfter()` los cuales son muy fáciles de usar incorrectamente, pudiendo conducir a errores irrecuperables.

En cambio, use la API [`asyncResource.runInAsyncScope()`][] la cual provee una alternativa mucho más segura y conveniente. See <https://github.com/nodejs/node/pull/18513> for more details.

<a id="DEP0099"></a>

### DEP0099: async context-unaware node::MakeCallback C++ APIs
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18632
    description: Compile-time deprecation.
-->

Tipo: Tiempo-de-compilación

Ciertas versiones de las APIs `node::MakeCallback` disponibles para módulos nativos están desaprobadas. Por favor, use las versiones de la API que acepten un parámetro `async_context`.

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

`process.assert()` está desaprobado. En cambio, por favor use el módulo [`assert`][].

Esta nunca fue una característica documetada.

<a id="DEP0101"></a>

### DEP0101: --with-lttng
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18982
    description: End-of-Life.
-->

Tipo: Fin-de-Vida

La opción de tiempo-de-compilación`--with-lttng` ha sido removida.

<a id="DEP0102"></a>

### DEP0102: Usar `noAssert` en operaciones Buffer#(read|write).
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: End-of-Life.
-->

Tipo: Fin-de-Vida

Usar el argumento `noAssert` ya no tiene ninguna funcionalidad. Todo lo que entre va a ser verificado, sin importar si está establecido a true o no. Omitir la verificación puede resultar en errores y fallas difíciles de conseguir.

<a id="DEP0103"></a>

### DEP0103: process.binding('util').is[...] typechecks
<!-- YAML
changes:
  - version: v10.9.0
    pr-url: https://github.com/nodejs/node/pull/22004
    description: Superseded by [DEP0111](#DEP0111).
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18415
    description: Documentation-only deprecation.
-->

Type: Documentation-only (soporta [`--pending-deprecation`][])

El uso de `process.binding()` en general debería ser evitado. Particularmente, los métodos de comprobación de tipos pueden ser reemplazados usando [`util.types`][].

This deprecation has been superseded by the deprecation of the `process.binding()` API ([DEP0111](#DEP0111)).

<a id="DEP0104"></a>

### DEP0104: process.env coerción de string
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18990
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only (soporta[`--pending-deprecation`][])

Cuando se asigna una propiedad sin string a [`process.env`][], el valor asignado es implícitamente convertido a una string. Este comportamiento es desaprobado si el valor asignado no es una string, un booleano, o un número. En el futuro, dicha asignación puede resultar en un error. Por favor convierta la propiedad a una string antes de asignarla a `process.env`.

<a id="DEP0105"></a>

### DEP0105: decipher.finaltol
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19353
    description: Runtime deprecation.
-->

Tipo: Runtime

`decipher.finaltol()` nunca ha sido documentato y actualmente es un alias para [`decipher.final()`][]. En el futuro, esta API seguramente sea removida, y en cambio se recomienda usar [`decipher.final()`][].

<a id="DEP0106"></a>

### DEP0106: crypto.createCipher y crypto.createDecipher
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19343
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Debería evitarse usar [`crypto.createCipher()`][] y [`crypto.createDecipher()`][], debido a que utilizan una función de derivación de clave débil (MD5 sin salt) y vectores de inicialización estáticos. It is recommended to derive a key using [`crypto.pbkdf2()`][] or [`crypto.scrypt()`][] and to use [`crypto.createCipheriv()`][] and [`crypto.createDecipheriv()`][] to obtain the [`Cipher`][] and [`Decipher`][] objects respectively.

<a id="DEP0107"></a>

### DEP0107: tls.convertNPNProtocols()
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19403
    description: Runtime deprecation.
-->

Tipo: Runtime

Esto fue una función auxiliar indocumentada no destinada al uso afuera del core Node.js y obsoleta por la eliminación del soporte NPN (Next Protocol Negotiation).

<a id="DEP0108"></a>

### DEP0108: zlib.bytesRead
<!-- YAML
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19414
    description: Documentation-only deprecation.
-->

Tipo: Documentation-only

Alias desaprobado para [`zlib.bytesWritten`][]. El nombre original fue elegido porque también tenía sentido interpretar el valor como el número de bytes leídos por el motor, pero es inconsistente con otros streams en Node.js que exponen valores bajo estos nombres.

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
