# Sistema de Archivos

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!--name=fs-->

El archivo I/O es proporcionado por empaquetadores simples alrededor de las funciones estándar de POSIX. Para utilizar este módulo ejecute `require('fs')`. Todos los métodos tienen formas asincrónicas y sincrónicas.

La forma asincrónica siempre toma un callback de terminación como su último argumento. Los argumentos pasados al callback de terminación dependen del método, pero el primer argumento se reserva siempre para una excepción. Si la operación se completó con éxito, entonces el primer argumento será `null` o `undefined`.

Cuando se utiliza la forma asincrónica las excepciones se lanzan inmediatamente. Las excepciones pueden ser manejadas utilizando `try`/`catch`, o se les puede permitir que generen burbujas.

Aquí hay un ejemplo de una versión asincrónica:

```js
const fs = require('fs');

fs.unlink('/tmp/hello', (err) => {
  if (err) throw err;
  console.log('successfully deleted /tmp/hello');
});
```

Aquí está la versión sincrónica:

```js
const fs = require('fs');

fs.unlinkSync('/tmp/hello');
console.log('successfully deleted /tmp/hello');
```

Con los métodos asincrónicos no existe un orden garantizado. Así que lo que aparece a continuación está propenso a errores:

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  console.log('renamed complete');
});
fs.stat('/tmp/world', (err, stats) => {
  if (err) throw err;
  console.log(`stats: ${JSON.stringify(stats)}`);
});
```

Podría ser que `fs.stat` se ejecute antes que `fs.rename`. La manera correcta de hacer esto es encadenar a los callbacks.

```js
fs.rename('/tmp/hello', '/tmp/world', (err) => {
  if (err) throw err;
  fs.stat('/tmp/world', (err, stats) => {
    if (err) throw err;
    console.log(`stats: ${JSON.stringify(stats)}`);
  });
});
```

En procesos difíciles, el programador es _fuertemente aconsejado_ a que utilice las versiones asincrónicas de estas llamadas. Las versiones sincrónicas bloquearán todo el proceso hasta que terminen de — detener todas las conexiones.

La ruta relativa a un nombre de archivo puede ser utilizada. Sin embargo, recuerde que esta ruta será relativa a `process.cwd()`.

Aunque no es recomendado, la mayoría de las funciones fs permiten que el argumento del callback sea omitido, en este caso, se utiliza un callback predeterminado que regenera errores. Para obtener un trace hacia el sitio de llamada original, establezca la variable de entorno `NODE_DEBUG`:

*Nota*: Omitir la función del callback en funciones fs asincrónicas es obsoleto y su resultado puede ser un error que ocurrirá en el futuro.

```txt
$ cat script.js
function bad() {
  require('fs').readFile('/');
}
bad();

$ env NODE_DEBUG=fs node script.js
fs.js:88
        throw backtrace;
        ^
Error: EISDIR: illegal operation on a directory, read
    <stack trace.>
```

*Nota:* en Windows, Node.js sigue el concepto de directorio de trabajo por disco. Este comportamiento puede ser observado cuando se usa una ruta de disco sin un backlash. Por ejemplo `fs.readdirSync('c:\\')` puede potencialmente devolver un resultado diferente a `fs.readdirSync('c:')`. Para más información, consulte [esta página de MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247.aspx#fully_qualified_vs._relative_paths).

*Note:* On Windows, opening an existing hidden file using the `w` flag (either through `fs.open` or `fs.writeFile`) will fail with `EPERM`. Los archivos ocultos existentes pueden ser abiertos para ser escritos con la bandera `r+` . Una llamada a `fs.ftruncate` puede ser utilizada para restablecer los contenidos del archivo.

## Uso de Threadpool

Tenga en cuenta que todas las API's del sistema de archivos excepto `fs.FSWatcher()` y aquellas que son explícitamente sincrónicas utilizan el threadpool de libuv, lo cual puede tener sorpresivas y negativas implicaciones de rendimiento en algunas aplicaciones, consulte la documentación [`UV_THREADPOOL_SIZE`][] para más información.

## WHATWG URL object support
<!-- YAML
added: v7.6.0
-->

> Estabilidad: 1 - Experimental

Para la mayoría de las funciones de módulo de `fs`, el `path` o el argumento de `filename` pueden ser pasados como un objeto de [`URL`][] de WHATWG. Sólo los objetos de [`URL`][] que utilizan el protocolo de `file:` son soportados.

```js
const fs = require('fs');
const { URL } = require('url');
const fileUrl = new URL('file:///tmp/hello');

fs.readFileSync(fileUrl);
```

*Nota*: Las URLs de `file:` siempre son rutas absolutas.

Utilizar objetos de [`URL`][] de WHATWG podría introducir comportamientos específicos a la plataforma.

En Windows, URLs del tipo `file:` con un hostname se convierten en rutas UNC, mientras que URLs `file:` con letras de unidades se convierten en rutas absolutas locales. URLs `file:` sin hostname o letra de unidad resultaran en un throw :

```js
// En Windows :

// - WHATWG URLs con hostname se convierten en rutas UNC
// file://hostname/p/a/t/h/file => \\hostname\p\a\t\h\file
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));

// - WHATWG URLs file con letras de unidad se convierten en rutas absolutas
// file:///C:/tmp/hello => C:\tmp\hello
fs.readFileSync(new URL('file:///C:/tmp/hello'));

// - WHATWG URLs file sin hostname deberá tener la letra de la unidad
fs.readFileSync(new URL('file:///notdriveletter/p/a/t/h/file'));
fs.readFileSync(new URL('file:///c/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must be absolute
```

*Note*: `file:` URLs with drive letters must use `:` as a separator just after the drive letter. Utilizar otro separador dará como resultado un lanzamiento.

En todas las demás plataformas, las URLs de `file:` con un nombre de host no son soportadas y resultarán en un lanzamiento:

```js
// En otras plataformas:

// - WHATWG file URLs con hostname no son compatibles
// file://hostname/p/a/t/h/file => throw!
fs.readFileSync(new URL('file://hostname/p/a/t/h/file'));
// TypeError [ERR_INVALID_FILE_URL_PATH]: debe ser absoluto

// - WHATWG file URLs  se convierten en direcciones absolutas
// file:///tmp/hello => /tmp/hello
fs.readFileSync(new URL('file:///tmp/hello'));
```

Una URL `file:` teniendo caracteres codificados resultara en un throw en todas las plataformas:

```js
// En Windows
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///C:/p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */

// En POSIX
fs.readFileSync(new URL('file:///p/a/t/h/%2F'));
fs.readFileSync(new URL('file:///p/a/t/h/%2f'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
/ characters */
```
En Windows, URLs `file:` teniendo barras codificadas resultaran en un throw:

```js
// En Windows
fs.readFileSync(new URL('file:///C:/path/%5C'));
fs.readFileSync(new URL('file:///C:/path/%5c'));
/* TypeError [ERR_INVALID_FILE_URL_PATH]: File URL path must not include encoded
\ or / characters */
```

## API de Búfer
<!-- YAML
added: v6.0.0
-->

Pasar y recibir rutas como strings y búfers es soportado por las funciones de `fs` . Esta última está destinada para hacer posible el funcionamiento con los sistemas de archivos que permiten a los nombres de archivo que no son UTF-8. Para los usos más típicos, trabajar con rutas como Búfers será innecesario, ya que la API de la string convierte para y desde UTF-8 automáticamente.

*Nota*: En ciertos sistemas de archivos (tales como NTFS y HFS+) los nombres de archivo siempre serán codificados como UTF-8. En tales sistemas de archivos, pasar búfers codificados que no sean UTF-8 hacia las funciones de `fs` no funcionará como se esperaba.

## Clase: fs.FSWatcher
<!-- YAML
added: v0.5.8
-->

Los objetos devueltos desde [`fs.watch()`][] son de este tipo.

El callback `listener` proporcionado a `fs.watch()` recibe los eventos `change` del FSWatcher devuelto.

El objeto emite estos eventos:

### Evento: 'change'
<!-- YAML
added: v0.5.8
-->

* `eventType` {string} El tipo de cambio de fs
* `filename` {string|Buffer} El nombre de archivo que cambió (si es relevante/disponible)

Se emite cuando algo cambia en un directorio o archivo observado. Vea más detalles en [`fs.watch()`][].

El argumento de `filename` puede no estar proporcionado dependiendo del soporte del sistema operativo. Si se proporciona `filename`, será proporcionado como un `Buffer` si `fs.watch()` es llamado con su opción de `encoding` establecido a `'buffer'`, de lo contrario `filename` será una string.

```js
// Example when handled through fs.watch listener
fs.watch('./tmp', { encoding: 'buffer' }, (eventType, filename) => {
  if (filename) {
    console.log(filename);
    // Prints: <Buffer ...>
  }
});
```

### Evento: 'error'
<!-- YAML
added: v0.5.8
-->

* `error` {Error}

Emitido cuando ocurre un error.

### watcher.close()
<!-- YAML
added: v0.5.8
-->

Deja de buscar cambios en el `fs.FSWatcher` dado.

## Clase: fs.ReadStream
<!-- YAML
added: v0.1.93
-->

`ReadStream` es un [Stream Legible](stream.html#stream_class_stream_readable).

### Evento: 'close'
<!-- YAML
added: v0.1.93
-->

Emitido cuando el descriptor de archivo subyacente de `ReadStream` ha sido cerrado.

### Evento: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Descriptor de archivo de enteros utilizado por el ReadStream.

Se emite cuando se abre el archivo de ReadStream.

### readStream.bytesRead
<!-- YAML
added: 6.4.0
-->

El número de bytes leídos hasta ahora.

### readStream.path
<!-- YAML
added: v0.1.93
-->

La ruta al archivo desde el cual lee el stream, como se especifica en el primer argumento a `fs.createReadStream()`. Si `path` se pasa como una string, entonces `readStream.path` será una string. Si `path` se pasa como un `Buffer`, entonces `readStream.path` será un `Buffer`.

## Clase: fs.Stats
<!-- YAML
added: v0.1.21
changes:
  - version: v8.1.0
    pr-url: https://github.com/nodejs/node/pull/13173
    description: Added times as numbers.
-->

Objetos devueltos desde [`fs.stat()`][], [`fs.lstat()`][] y [`fs.fstat()`][] y sus contrapartes sincrónicas son de este tipo.

 - `stats.isFile()`
 - `stats.isDirectory()`
 - `stats.isBlockDevice()`
 - `stats.isCharacterDevice()`
 - `stats.isSymbolicLink()` (only valid with [`fs.lstat()`][])
 - `stats.isFIFO()`
 - `stats.isSocket()`

Para un archivo normal [`util.inspect(stats)`][] devolvería una string muy similar a esto:

```console
Stats {
  dev: 2114,
  ino: 48064969,
  mode: 33188,
  nlink: 1,
  uid: 85,
  gid: 100,
  rdev: 0,
  size: 527,
  blksize: 4096,
  blocks: 8,
  atimeMs: 1318289051000.1,
  mtimeMs: 1318289051000.1,
  ctimeMs: 1318289051000.1,
  birthtimeMs: 1318289051000.1,
  atime: Mon, 10 Oct 2011 23:24:11 GMT,
  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
```

*Nota*: `atimeMs`, `mtimeMs`, `ctimeMs`, `birthtimeMs` son [números](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type) que contienen los tiempos correspondientes en milisegundos. Su precisión es específica en la plataforma. `atime`, `mtime`, `ctime`, y `birthtime` son objetos de [`Date`](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Date), representaciones alternas de los tiempos varios. La `Date` y los valores numéricos no están conectados. Asignar un nuevo valor numérico, o mutar el valor de `Date`, no se reflejará en la correspondiente representación alterna.


### Valores del Tiempo de Estadísticas

Los tiempo en el objeto de estadísticas tienen la siguiente semántica:

* `atime` "Hora de Acceso" - La hora en la que se accedió por última vez a los datos de archivo. Cambiados por las llamadas de sistema mknod(2), utimes(2), y read(2).
* `mtime` "Hora de Modificación" - La hora en que se modificaron por última vez los datos de archivo. Cambiados por las llamadas de sistema mknod(2), utimes(2), y read(2).
* `ctime` "Hora de Cambio" - La hora en la que se cambiaron por última vez los estados de archivo (modificación de datos inode). Cambiados por las llamadas de sistema chmod(2), chown(2), link(2), mknod(2), rename(2), unlink(2), utimes(2), read(2), and write(2).
* `birthtime` "Hora de Creación" - La hora de creación de un archivo. Se establece una vez que se crea el archivo. En sistema de archivos en donde no está disponible la hora de creación, este campo puede poseer en su lugar el `ctime` o `1970-01-01T00:00Z` (por ejemplo, la marca de tiempo de la época de unix `0`). Tenga en cuenta que este valor puede que sea mayor que `atime` o `mtime` en este caso. En Darwin y otras variantes de FreeBSD, también se establece si el `atime` está explícitamente establecido a un valor anterior al de `birthtime` actual, utilizando la llamada de sistema de utimes(2).

Antes de Node v0.12, el `ctime` mantuvo al `birthtime` en sistemas de Windows. Tenga en cuenta que a partir de v0.12, `ctime` ya no es la "hora de la creación", y en sistemas de Unix, nunca la fue.

## Clase: fs.WriteStream
<!-- YAML
added: v0.1.93
-->

`WriteStream` es un [Stream Editable](stream.html#stream_class_stream_writable).

### Evento: 'close' (cerrar)
<!-- YAML
added: v0.1.93
-->

Emitido cuando el descriptor de archivo subyacente de `WriteStream` ha sido cerrado.

### Evento: 'open'
<!-- YAML
added: v0.1.93
-->

* `fd` {integer} Descriptor de archivo de enteros utilizado por el WriteStream.

Se emite cuando se abre el archivo de WriteStream.

### writeStream.bytesWritten
<!-- YAML
added: v0.4.7
-->

El número de bytes escritos hasta el momento. No incluye datos que todavía están en cola para escritura.

### writeStream.path
<!-- YAML
added: v0.1.93
-->

La ruta hacia el archivo al que escribe el stream, como se especifica en el primer argumento a `fs.createWriteStream()`. Si se pasa a `path` como una string, entonces `writeStream.path` será una string. Si se pasa a `path` como un `Buffer`, entonces `writeStream.path` será un `Buffer`.

## fs.access(path[, mode], callback)
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6534
    description: The constants like `fs.R_OK`, etc which were present directly
                 on `fs` were moved into `fs.constants` as a soft deprecation.
                 Thus for Node `< v6.3.0` use `fs` to access those constants, or
                 do something like `(fs.constants || fs).R_OK` to work with all
                 versions.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Por defecto es:** `fs.constants.F_OK`
* `callback` {Function}
  * `err` {Error}

Prueba los permisos del usuario para el archivo o directorio especificado por `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Las siguientes constantes definen los posibles valores de `mode`. Es posible crear una máscara que consista del bitwise O de dos o más valores (por ejemplo, `fs.constants.W_OK | fs.constants.R_OK`).

* `fs.constants.F_OK` - `path` es visible para el proceso de llamada. Esto es útil para determinar si un archivo existe, pero no dice nada sobre los permisos de `rwx` . Predeterminado si no se especifica ningún `mode` .
* `fs.constants.R_OK` - `path` puede ser leído por el proceso de llamada.
* `fs.constants.W_OK` - `path` puede ser escrito por el proceso de llamada.
* `fs.constants.X_OK` - `path` puede ser ejecutado por el proceso de llamada. Esto no tiene ningún efecto en Windows (se comportará como `fs.constants.F_OK`).

El argumento final, `callback`, es una función de callback que se invoca con un posible argumento de error. Si alguna verificación de accesibilidad falla, el argumento de error será un objeto de `Error` . El siguiente ejemplo verifica si el archivo `/etc/passwd` puede ser leído y escrito por el proceso actual.

```js
fs.access('/etc/passwd', fs.constants.R_OK | fs.constants.W_OK, (err) => {
  console.log(err ? 'no access!' : 'can read/write');
});
```

Utilizar `fs.access()` para verificar la accesibilidad de un archivo antes de llamar a `fs.open()`, `fs.readFile()` ó `fs.writeFile()` no es recomendado. Hacer eso introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre las dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no es accesible.

For example:


**escribir (NO SE RECOMIENDA)**

```js
fs.access('myfile', (err) => {
  if (!err) {
    console.error('myfile already exists');
    return;
  }

  fs.open('myfile', 'wx', (err, fd) => {
    if (err) throw err;
    writeMyData(fd);
  });
});
```

**escribir (RECOMENDADO)**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile ya existe');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**leer (NO SE RECOMIENDA)**

```js
fs.access('myfile', (err) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile no existe');
      return;
    }

    throw err;
  }

  fs.open('myfile', 'r', (err, fd) => {
    if (err) throw err;
    readMyData(fd);
  });
});
```

**leer (RECOMENDADO)**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile no existe');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

Los ejemplos anteriores "no recomendados" verifican la accesibilidad y luego utilizan el archivo; los ejemplos "recomendados" son mejores porque utilizan el archivo directamente y manejan el error, si los hay.

En general, verifique la accesibilidad de un archivo sólo si el archivo no será utilizado directamente, por ejemplo, cuando su accesibilidad es una señal de otro proceso.

On Windows, access-control policies (ACLs) on a directory may limit access to a file or directory. The `fs.access()` function, however, does not check the ACL and therefore may report that a path is accessible even if the ACL restricts the user from reading or writing to it.

## fs.accessSync(path[, mode])
<!-- YAML
added: v0.11.15
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Por defecto es:** `fs.constants.F_OK`
* Devuelve: {undefined}

Prueba de manera sincrónica los permisos de un usuario para el archivo o directorio especificado por `path`. El argumento `mode` es un entero opcional que especifica las verificaciones de accesibilidad que serán realizadas. Las siguientes constantes definen los posibles valores de `mode`. Es posible crear una máscara que consista del bitwise O de dos o más valores (por ejemplo, `fs.constants.W_OK | fs.constants.R_OK`).

* `fs.constants.F_OK` - `path` es visible para el proceso de llamada. Esto es útil para determinar si un archivo existe, pero no dice nada sobre los permisos de `rwx` . Predeterminado si no se especifica ningún `mode` .
* `fs.constants.R_OK` - `path` puede ser leído por el proceso de llamada.
* `fs.constants.W_OK` - `path` puede ser escrito por el proceso de llamada.
* `fs.constants.X_OK` - `path` puede ser ejecutado por el proceso de llamada. Esto no tiene ningún efecto en Windows (se comportará como `fs.constants.F_OK`).

Si alguna verificación de accesibilidad falla, se arrojará un `Error` . De lo contrario, el método devolverá `undefined`.

```js
try {
  fs.accessSync('etc/passwd', fs.constants.R_OK | fs.constants.W_OK);
  console.log('puede leer/escribir');
} catch (err) {
  console.error('Sin acceso');
}
```

## fs.appendFile(file, data[, options], callback)
<!-- YAML
added: v0.6.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|number} nombre de archivo o descriptor de archivo
* `data` {string|Buffer}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} **Por defecto es:** `'a'`
* `callback` {Function}
  * `err` {Error}

Anexa los datos de manera asincrónica a un archivo, creando el archivo en caso de que aún no exista. `data` puede ser una string o un [`Buffer`][].

Ejemplo:

```js
fs.appendFile('message.txt', 'datos a agregar', (err) => {
  if (err) throw err;
  console.log('El "datos a agregar" ha sido añadido al archivo');
});
```

Si `options` es una string, entonces especifica la codificación. Ejemplo:

```js
fs.appendFile('message.txt', 'data a añadir', 'utf8', callback);
```

El `file` puede ser especificado como un descriptor de archivos numérico que ha sido abierto para ser anexado (utilizando `fs.open()` o `fs.openSync()`). El descriptor de archivos no se cerrará automáticamente.

```js
fs.open('message.txt', 'a', (err, fd) => {
  if (err) throw err;
  fs.appendFile(fd, 'datos a añadir', 'utf8', (err) => {
    fs.close(fd, (err) => {
      if (err) throw err;
    });
    if (err) throw err;
  });
});
```

## fs.appendFileSync(file, data[, options])
<!-- YAML
added: v0.6.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|number} nombre de archivo o descriptor de archivo
* `data` {string|Buffer}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} **Por defecto es:** `'a'`

Anexa los datos de manera sincrónica a un archivo, creando el archivo en caso de que aún no exista. `data` puede ser una string o un [`Buffer`][].

Ejemplo:

```js
try {
  fs.appendFileSync('message.txt', 'data a añadir');
  console.log('Los "data a añadir" fueron añadidos al archivo');
} catch (err) {
  /* Maneja el error*/
}
```

Si `options` es una string, entonces especifica la codificación. Ejemplo:

```js
fs.appendFileSync('message.txt', 'data a añadir', 'utf8');
```

El `file` puede ser especificado como un descriptor de archivos numérico que ha sido abierto para ser anexado (utilizando `fs.open()` o `fs.openSync()`). El descriptor de archivos no se cerrará automáticamente.

```js
try {
  fd = fs.openSync('message.txt', 'a');
  fs.appendFileSync(fd, 'data to append', 'utf8');
} catch (err) {
  /* Maneja el error */
} finally {
  if (fd !== undefined)
    fs.closeSync(fd);
}
```

## fs.chmod(path, mode, callback)
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

Cambia de manera asincrónica los permisos de un archivo. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: chmod(2)

### Modos de archivo

El argumento `mode` utilizado en los métodos `fs.chmod()` y `fs.chmodSync()` es una máscara de bits numérica creada utilizando un lógico O de las siguientes constantes:

| Constante              | Octal   | Descripción                     |
| ---------------------- | ------- | ------------------------------- |
| `fs.constants.S_IRUSR` | `0o400` | leído por el propietario        |
| `fs.constants.S_IWUSR` | `0o200` | escribir por el propietario     |
| `fs.constants.S_IXUSR` | `0o100` | ejecutar/buscar por propietario |
| `fs.constants.S_IRGRP` | `0o40`  | leído por el grupo              |
| `fs.constants.S_IWGRP` | `0o20`  | escribir por grupo              |
| `fs.constants.S_IXGRP` | `0o10`  | ejecutar/buscar por grupo       |
| `fs.constants.S_IROTH` | `0o4`   | leído por otros                 |
| `fs.constants.S_IWOTH` | `0o2`   | escribir por otros              |
| `fs.constants.S_IXOTH` | `0 o1`  | ejecutar/buscar por otros       |

Un método más sencillo de construir el `mode` es utilizar una secuencia de tres dígitos octales (por ejemplo, `765`). El primer dígito a la izquierda (`7` en el ejemplo), especifica los permisos para el propietario del archivo. El dígito medio (`6` en el ejemplo), especifica los permisos para el grupo. El primer dígito a la derecha (`5` en el ejemplo), especifica los permisos para otros.

| Número | Descripción                |
| ------ | -------------------------- |
| `7`    | leer, escribir, y ejecutar |
| `6`    | leer y escribir            |
| `5`    | leer y ejecutar            |
| `4`    | solo lectura               |
| `3`    | escribir y ejecutar        |
| `2`    | solo escritura             |
| `1`    | solo ejecutar              |
| `0`    | sin permisos               |

Por ejemplo, el valor octal `0o765` significa:

* El propietario puede leer, escribir y ejecutar el archivo.
* El grupo puede leer y escribir el archivo.
* Otros pueden leer y ejecutar el archivo.

## fs.chmodSync(path, mode)
<!-- YAML
added: v0.6.7
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode`{integer}

Cambia de manera sincrónica los permisos de un archivo. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.chmod()`][].

Vea también: chmod(2)

## fs.chown(path, uid, gid, callback)
<!-- YAML
added: v0.1.97
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

Cambia de manera asincrónica el propietario y el grupo de un archivo. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: chown(2)

## fs.chownSync(path, uid, gid)
<!-- YAML
added: v0.1.97
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}

Cambia de manera sincrónica el propietario y el grupo de un archivo. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.chown()`][].

Vea también: chown(2)

## fs.close(fd, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}

close(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.closeSync(fd)
<!-- YAML
added: v0.1.21
-->

* `fd`{integer}

close(2) sincrónico. Devuelve: `undefined`.

## fs.constants

Devuelve un objeto que contiene constantes utilizadas comúnmente para operaciones del sistema de archivos. Las constantes específicas actualmente definidas se describen en [Constantes de FS](#fs_fs_constants_1).

## fs.copyFile(src, dest[, flags], callback)
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Predeterminado:** `0`.
* `callback` {Function}

Copia de manera asincrónica `src` a `dest`. Por defecto, se sobrescribe `dest` si ya existe. Ningún otro argumento que no sea una posible excepción es dado a la función de callback. Node.js no ofrece ninguna garantía sobre la atomicidad de la operación de copia. Si ocurre un error luego de que el archivo de destino ha sido abierto para escritura, Node.js intentará eliminar el destino.

`flags` es un entero opcional que especifica el comportamiento de la operación de copia. La única bandera soportada es `fs.constants.COPYFILE_EXCL`, la cual hace que la operación de copia falle si `dest` ya existe.

Ejemplo:

```js
const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFile('source.txt', 'destination.txt', (err) => {
  if (err) throw err;
  console.log('source.txt was copied to destination.txt');
});
```

Si el tercer argumento es un número, entonces especifica `flags`, como se muestra en el siguiente ejemplo.

```js
const fs = require('fs');
const { COPYFILE_EXCL } = fs.constants;

// By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
fs.copyFile('source.txt', 'destination.txt', COPYFILE_EXCL, callback);
```

## fs.copyFileSync(src, dest[, flags])
<!-- YAML
added: v8.5.0
-->

* `src` {string|Buffer|URL} nombre de archivo de la fuente a copiar
* `dest` {string|Buffer|URL} nombre de archivo de destino de la operación de copia
* `flags` {number} modificadores para la operación de copia. **Predeterminado:** `0`.

Copia de manera sincrónica `src` a `dest`. Por defecto, se sobrescribe `dest` si ya existe. Devuelve `undefined`. Node.js no ofrece ninguna garantía sobre la atomicidad de la operación de copia. Si ocurre un error luego de que el archivo de destino ha sido abierto para escritura, Node.js intentará eliminar el destino.

`flags` es un entero opcional que especifica el comportamiento de la operación de copia. La única bandera soportada es `fs.constants.COPYFILE_EXCL`, la cual hace que la operación de copia falle si `dest` ya existe.

Ejemplo:

```js
const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFileSync('source.txt', 'destination.txt');
console.log('source.txt was copied to destination.txt');
```

Si el tercer argumento es un número, entonces especifica `flags`, como se muestra en el siguiente ejemplo.

```js
const fs = require('fs');
const { COPYFILE_EXCL } = fs.constants;

// By using COPYFILE_EXCL, the operation will fail if destination.txt exists.
fs.copyFileSync('source.txt', 'destination.txt', COPYFILE_EXCL);
```

## fs.createReadStream(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v2.3.0
    pr-url: https://github.com/nodejs/node/pull/1845
    description: The passed `options` object can be a string now.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `flags` {string}
  * `encoding` {string}
  * `fd`{integer}
  * `mode`{integer}
  * `autoClose` {boolean}
  * `start` {integer}
  * `end` {integer}
  * `highWaterMark` {integer}

Devuelve un objeto nuevo de [`ReadStream`][]. (Vea [Stream Legible](stream.html#stream_class_stream_readable)).

Tenga en cuenta que, a diferencia del valor predeterminado establecido para `highWaterMark` en un stream legible (16 kb), el stream devuelto por este método tiene un valor predeterminado de 64 kb para el mismo parámetro.

`options` es un objeto o string con los siguientes valores predeterminados:

```js
const defaults = {
  flags: 'r',
  encoding: null,
  fd: null,
  mode: 0o666,
  autoClose: true,
  highWaterMark: 64 * 1024
};
```

`options` puede incluir valores de `start` y `end` para leer un rango de bytes desde el archivo, en lugar de todo el archivo. `start` y `end` son inclusivos y empiezan a contar desde 0. Si se especifica `fd` y se omite `start` o es `undefined`, `fs.createReadStream()` lee de manera secuencial desde la posición actual del archivo. El `encoding` puede ser cualquiera de los aceptados por [`Buffer`][].

Si se especifica `fd`, `ReadStream` ignorará el argumento de `path` y utilizará el descriptor de archivo especificado. Esto significa que no se emitirán eventos `'open'` . Tenga en cuenta que `fd` debería estar bloqueando; los `fd`s que no bloquean deberían ser pasados a [`net.Socket`][].

Si `autoClose` es falso, entonces el descriptor de archivo no se cerrará, incluso si hay un error. Es responsabilidad de la aplicación cerrarla y asegurarse de que no hayan pérdidas del descriptor de archivo. Si `autoClose` se establece a verdadero (comportamiento predeterminado), en `error` o `end` el descriptor de archivo se cerrará automáticamente.

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado.

Un ejemplo para leer los últimos 10 bytes de un archivo que tiene 100 bytes de longitud:

```js
fs.createReadStream('sample.txt', { start: 90, end: 99 });
```

Si `options` es una string, entonces especifica la codificación.

## fs.createWriteStream(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
  - version: v5.5.0
    pr-url: https://github.com/nodejs/node/pull/3679
    description: The `autoClose` option is supported now.
  - version: v2.3.0
    pr-url: https://github.com/nodejs/node/pull/1845
    description: The passed `options` object can be a string now.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `flags` {string}
  * `encoding` {string}
  * `fd`{integer}
  * `mode`{integer}
  * `autoClose` {boolean}
  * `start` {integer}

Devuelve un objeto nuevo de [`WriteStream`][]. (Vea [Stream Editable](stream.html#stream_class_stream_writable)).

`options` es un objeto o string con los siguientes valores predeterminados:

```js
const defaults = {
  flags: 'w',
  encoding: 'utf8',
  fd: null,
  mode: 0o666,
  autoClose: true
};
```

`options` también puede incluir una opción de `start` para permitir la escritura de datos en una posición más allá del inicio del archivo. Modificar un archivo en vez de reemplazarlo puede que requiera un modo de `flags` de `r+` en vez del modo predeterminado `w`. El `encoding` puede ser cualquiera de los aceptados por [`Buffer`][].

Si `autoClose` se establece a true (comportamiento predeterminado), en `error` o `end` el descriptor de archivo se cerrará automáticamente. Si `autoClose` es falso, entonces el descriptor de archivo no se cerrará, incluso si hay un error. Es responsabilidad de la aplicación cerrarla y asegurarse de que no hayan pérdidas del descriptor de archivo.

Al igual que [`ReadStream`][], si se especifica `fd`, `WriteStream` ignorará el argumento de `path` y utilizará el descriptor de archivos especificado. Esto significa que no se emitirán eventos `'open'`. Tenga en cuenta que `fd` debería estar bloqueando; los `fd`s que no bloquean deberían ser pasados a [`net.Socket`][].

Si `options` es una string, entonces especifica la codificación.

## fs.exists(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
deprecated: v1.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`fs.stat()`][] o [`fs.access()`][] en su lugar.

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `exists` {boolean}

Prueba si una ruta dada existe o no, verificándolo mediante el sistema de archivos. Después llama al argumento de `callback` con verdadero o falso. Ejemplo:

```js
fs.exists('/etc/passwd', (exists) => {
  console.log(exists ? 'it\'s there' : 'no passwd!');
});
```

**Tenga en cuenta que el parámetro para este callback no es consistente con otros callbacks de Node.js.** Normalmente, el primer parámetro para un callback de Node.js es un parámetro `err`, seguido de manera opcional por otros parámetros. El callback de `fs.exists()` sólo tiene un parámetro booleano. Esta es una razón por la que se recomienda `fs.access()` en lugar de `fs.exists()`.

Utilizar `fs.exists()` para verificar la existencia de un archivo antes de llamar a `fs.open()`, `fs.readFile()` ó `fs.writeFile()` no es recomendado. Hacer eso introduce una condición de carrera, ya que otros procesos pueden cambiar el estado del archivo entre las dos llamadas. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no existe.

For example:

**escribir (NO SE RECOMIENDA)**

```js
fs.exists('myfile', (exists) => {
  if (exists) {
    console.error('myfile already exists');
  } else {
    fs.open('myfile', 'wx', (err, fd) => {
      if (err) throw err;
      writeMyData(fd);
    });
  }
});
```

**escribir (RECOMENDADO)**

```js
fs.open('myfile', 'wx', (err, fd) => {
  if (err) {
    if (err.code === 'EEXIST') {
      console.error('myfile ya existe');
      return;
    }

    throw err;
  }

  writeMyData(fd);
});
```

**leer (NO SE RECOMIENDA)**

```js
fs.exists('myfile', (exists) => {
  if (exists) {
    fs.open('myfile', 'r', (err, fd) => {
      if (err) throw err;
      readMyData(fd);
    });
  } else {
    console.error('myfile does not exist');
  }
});
```

**leer (RECOMENDADO)**

```js
fs.open('myfile', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile no existe');
      return;
    }

    throw err;
  }

  readMyData(fd);
});
```

Los ejemplos anteriores "no recomendados" verifican la existencia y luego utilizan el archivo; los ejemplos "recomendados" son mejores porque estos utilizan el archivo directamente y manejan el error, si los hay.

En general, verifique la existencia de un archivo sólo si el archivo no se utilizará directamente, por ejemplo, cuando su existencia es una señal de otro proceso.

## fs.existsSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

Versión sincrónica de [`fs.exists()`][]. Devuelve `true` si la ruta existe, de lo contrario `false`.

Tenga en cuenta que `fs.exists()` es obsoleto, pero `fs.existsSync()` no. (El parámetro de `callback` a `fs.exists()` acepta los parámetros que son inconsistentes con otros callbacks de Node.js. `fs.existsSync()` no utiliza un callback.)

## fs.fchmod(fd, mode, callback)
<!-- YAML
added: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

fchmod(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fchmodSync(fd, mode)
<!-- YAML
added: v0.4.7
-->

* `fd`{integer}
* `mode`{integer}

fchmod(2) sincrónico. Devuelve `undefined`.

## fs.fchown(fd, uid, gid, callback)
<!-- YAML
added: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

fchown(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fchownSync(fd, uid, gid)
<!-- YAML
added: v0.4.7
-->

* `fd`{integer}
* `uid`{integer}
* `gid`{integer}

fchown(2) sincrónico. Devuelve `undefined`.

## fs.fdatasync(fd, callback)
<!-- YAML
added: v0.1.96
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}

fdatasync(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fdatasyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd`{integer}

fdatasync(2) sincrónico. Devuelve `undefined`.

## fs.fstat(fd, callback)
<!-- YAML
added: v0.1.95
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

fstat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)` donde `stats` es un objeto de [`fs.Stats`][]. `fstat()` es idéntico a [`stat()`][], excepto que el archivo que será añadido a las estadísticas se especifica por el descriptor de archivo `fd`.

## fs.fstatSync(fd)
<!-- YAML
added: v0.1.95
-->

* `fd`{integer}

fstat(2) sincrónica. Devuelve una instancia de [`fs.Stats`][].

## fs.fsync(fd, callback)
<!-- YAML
added: v0.1.96
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `callback` {Function}
  * `err` {Error}

fsync(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.fsyncSync(fd)
<!-- YAML
added: v0.1.96
-->

* `fd`{integer}

fsync(2) asincrónico. Devuelve `undefined`.

## fs.ftruncate(fd[, len], callback)
<!-- YAML
added: v0.8.6
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `len` {integer} **Predeterminado:** `0`
* `callback` {Function}
  * `err` {Error}

ftruncate(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Si el archivo referido por el descriptor de archivos fuese más grande que los bytes `len`, sólo los primeros bytes `len` serán retenidos en el archivo.

Por ejemplo, el siguiente programa retiene solo los primeros cuatro bytes del archivo.

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

// get the file descriptor of the file to be truncated
const fd = fs.openSync('temp.txt', 'r+');

// truncate the file to first four bytes
fs.ftruncate(fd, 4, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt', 'utf8'));
});
// Prints: Node
```

Si el archivo previamente era más corto que bytes `len`, se extiende, y la parte extendida se llena con bytes nulos ('\0'). Por ejemplo,

```js
console.log(fs.readFileSync('temp.txt', 'utf8'));
// Prints: Node.js

// get the file descriptor of the file to be truncated
const fd = fs.openSync('temp.txt', 'r+');

// truncate the file to 10 bytes, whereas the actual size is 7 bytes
fs.ftruncate(fd, 10, (err) => {
  assert.ifError(err);
  console.log(fs.readFileSync('temp.txt'));
});
// Prints: <Buffer 4e 6f 64 65 2e 6a 73 00 00 00>
// ('Node.js\0\0\0' in UTF8)
```

Los últimos tres bytes son bytes nulos ('\0'), para compensar el sobre-truncamiento.

## fs.ftruncateSync(fd[, len])
<!-- YAML
added: v0.8.6
-->

* `fd`{integer}
* `len` {integer} **Predeterminado:** `0`

ftruncate(2) sincrónico. Devuelve `undefined`.

## fs.futimes(fd, atime, mtime, callback)
<!-- YAML
added: v0.4.2
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd`{integer}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `callback` {Function}
  * `err` {Error}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por el descriptor de archivo proporcionado. Vea [`fs.utimes()`][].

*Nota*: Esta función no funciona en versiones AIX anteriores a 7.1, devolverá el error `UV_ENOSYS`.

## fs.futimesSync(fd, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `fd`{integer}
* `atime` {integer}
* `mtime` {integer}

Versión sincrónica de [`fs.futimes()`][]. Devuelve `undefined`.

## fs.lchmod(path, mode, callback)
<!-- YAML
deprecated: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode`{integer}
* `callback` {Function}
  * `err` {Error}

lchmod(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Sólo disponible en macOS.

## fs.lchmodSync(path, mode)
<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer|URL}
* `mode`{integer}

lchmod(2) sincrónico. Devuelve `undefined`.

## fs.lchown(path, uid, gid, callback)
<!-- YAML
deprecated: v0.4.7
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}
* `callback` {Function}
  * `err` {Error}

lchwon(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

## fs.lchownSync(path, uid, gid)
<!-- YAML
deprecated: v0.4.7
-->

* `path` {string|Buffer|URL}
* `uid`{integer}
* `gid`{integer}

lchwon(2) sincrónico. Devuelve `undefined`.

## fs.link(existingPath, newPath, callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

link(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

## fs.linkSync(existingPath, newPath)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `existingPath` and `newPath` parameters can be WHATWG
                 `URL` objects using `file:` protocol. Support is currently
                 still *experimental*.
-->

* `existingPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}

link(2) sincrónico. Devuelve `undefined`.

## fs.lstat(path, callback)
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

lstat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)`, en donde `stats` es un objeto de [`fs.Stats`][]. `lstat()` es idéntico a `stat()`, salvo en caso de que `path` sea un enlace simbólico, entonces el mismo enlace sería parte de las estadísticas, no el archivo al que se refiere.

## fs.lstatSync(path)
<!-- YAML
added: v0.1.30
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

lstat(2) sincrónico. Devuelve una instancia de [`fs.Stats`][].

## fs.mkdir(path[, mode], callback)
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Predeterminado:** `0o777`
* `callback` {Function}
  * `err` {Error}

Crea un directorio de manera asincrónica. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: mkdir(2)

## fs.mkdirSync(path[, mode])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `mode` {integer} **Predeterminado:** `0o777`

Crea un directorio de manera sincrónica. Devuelve `undefined`. Esta es la versión sincrónica de [`fs.mkdir()`][].

Vea también: mkdir(2)

## fs.mkdtemp(prefix[, options], callback)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.2.1
    pr-url: https://github.com/nodejs/node/pull/6828
    description: The `callback` parameter is optional now.
-->

* `prefix` {string}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `folder` {string}

Crea un único directorio temporal.

Genera seis caracteres aleatorios para ser anexados detrás de un `prefix` necesario, para crear un directorio temporal único.

La ruta de archivo creada se pasa como una string al segundo parámetro del callback.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

Ejemplo:

```js
fs.mkdtemp(path.join(os.tmpdir(), 'foo-'), (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Prints: /tmp/foo-itXde2 or C:\Users\...\AppData\Local\Temp\foo-itXde2
});
```

*Nota*: El método `fs.mkdtemp()` anexará los seis caracteres seleccionados aleatoriamente, directamente a la string `prefix`. For instance, given a directory `/tmp`, if the intention is to create a temporary directory *within* `/tmp`, the `prefix` *must* end with a trailing platform-specific path separator (`require('path').sep`).

```js
// The parent directory for the new temporary directory
const tmpDir = os.tmpdir();

// This method is *INCORRECT*:
fs.mkdtemp(tmpDir, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Will print something similar to `/tmpabc123`.
  // Note that a new temporary directory is created
  // at the file system root rather than *within*
  // the /tmp directory.
});

// This method is *CORRECT*:
const { sep } = require('path');
fs.mkdtemp(`${tmpDir}${sep}`, (err, folder) => {
  if (err) throw err;
  console.log(folder);
  // Will print something similar to `/tmp/abc123`.
  // A new temporary directory is created within
  // the /tmp directory.
});
```

## fs.mkdtempSync(prefix[, options])
<!-- YAML
added: v5.10.0
-->

* `prefix` {string}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`

La versión sincrónica de [`fs.mkdtemp()`][]. Devuelve la ruta de archivo creada.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar.

## fs.open(path, flags[, mode], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number}
* `mode` {integer} **Default:** `0o666` (readable and writable)
* `callback` {Function}
  * `err` {Error}
  * `fd`{integer}

Apertura de archivo asincrónica. Vea open(2). `flags` puede ser:

* `'r'` - Archivo abierto para leer. Una excepción ocurre si el archivo no existe.

* `'r+'` - Archivo abierto para leer y escribir. Una excepción ocurre si el archivo no existe.

* `'rs+'` - Archivo abierto para leer y escribir en modo sincrónico. Instruye al sistema operativo a evadir la caché del sistema de archivos local.

  This is primarily useful for opening files on NFS mounts as it allows skipping the potentially stale local cache. Tiene un impacto bastante real en el rendimiento de E/S, así que no se recomienda utilizar esta bandera a menos de que sea necesario.

  Tenga en cuenta que esto no convierte a `fs.open()` en una llamada sincrónica de bloqueo. Si se desea una operación sincrónica, se debería utilizar `fs.openSync()` .

* `'w'` - Archivo abierto para escribir. El archivo es creado (si no existe) o truncado (si existe).

* `'wx'` - Como `'w'` pero falla si `path` existe.

* `'w+'` - Archivo abierto para leer y escribir. El archivo es creado (si no existe) o truncado (si existe).

* `'wx+'` - Como `'w+'` pero falla si `path` existe.

* `'a'` - Archivo abierto para anexar. El archivo se crea si no existe.

* `'ax'` - Como `'a'` pero falla si `path` existe.

* `'as'` - Archivo abierto para anexar en modo sincrónico. El archivo se crea si no existe.

* `'a+'` - Archivo abierto para leer y anexar. El archivo se crea si no existe.

* `'ax+'` - Como `'a+'` pero falla si `path` existe.

* `'as+'` - Archivo abierto para leer y anexar en modo sincrónico. El archivo se crea si no existe.

`mode` establece el modo de archivo (el permiso y los sticky bits), pero solo si el archivo fue creado.

El callback recibe dos argumentos `(err, fd)`.

La bandera exclusiva `'x'` (bandera `O_EXCL` en open(2)) asegura que `path` sea creado recientemente. En sistemas de POSIX, se considera que `path` existe incluso si es un enlace simbólico a un archivo inexistente. La bandera exclusiva puede o no que funcione con sistemas de archivos de red.

`flags` también puede ser un número como lo documenta open(2); las constantes comúnmente utilizadas están disponibles desde `fs.constants`. En Windows, donde esto sea aplicable, las banderas son traducidas a sus equivalentes, por ejemplo, `O_WRONLY` a `FILE_GENERIC_WRITE`, o `O_EXCL|O_CREAT` a `CREATE_NEW`, como las acepta CreateFileW.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

*Nota*: El comportamiento de `fs.open()` específico en la plataforma para algunas banderas. Y así, abrir un directorio en macOS y Linux con la bandera `'a+'` - vea el ejemplo a continuación - devolverá un error. En contraste, en Windows y FreeBSD, un descriptor de archivo será devuelto.

```js
// macOS and Linux
fs.open('<directory>', 'a+', (err, fd) => {
  // => [Error: EISDIR: illegal operation on a directory, open <directory>]
});

// Windows and FreeBSD
fs.open('<directory>', 'a+', (err, fd) => {
  // => null, <fd>
});
```

Algunos caracteres (`< > : " / \ | ? *`) están reservados bajo Windows como los documenta [Nombrar Archivos, Rutas, y Espacios de Nombres](https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx). Bajo NTFS, si el nombre de archivo contiene dos puntos, Node.js abrirá un stream del sistema de archivo, como lo describe [esta página de MSDN](https://msdn.microsoft.com/en-us/library/windows/desktop/bb540537.aspx).

Las funciones basadas en `fs.open()` también exhiben este comportamiento. por ejemplo, `fs.writeFile()`, `fs.readFile()`, etc.

## fs.openSync(path, flags[, mode])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `flags` {string|number}
* `mode` {integer} **Predeterminado:** `0o666`

Versión sincrónica de [`fs.open()`][]. Devuelve un entero que representa el descriptor de archivo.

## fs.read(fd, buffer, offset, length, position, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd`{integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesRead` {integer}
  * `buffer` {Buffer}

Lee datos del archivo especificado por `fd`.

`buffer` es el búfer al cual se escribirán los datos.

`offset` es el offset dentro del búfer en donde se empieza a escribir.

`length` es un entero que especifica el número de bytes a leer.

`position` es un argumento que especifica dónde comenzar la lectura desde dentro del archivo. Si `position` es `null`, se leerán los datos desde la posición actual del archivo, y se actualizará la posición del archivo. Si `position` es un entero, la posición del archivo permanecerá sin cambios.

Al callback se le dan tres argumentos, `(err, bytesRead, buffer)`.

Si se invoca este método en su versión [`util.promisify()`][], devolverá una Promise para un objeto con propiedades de `bytesRead` y `buffer` .

## fs.readdir(path[, options], callback)
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5616
    description: The `options` parameter was added.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `files` {string[]|Buffer[]}

readdir(3) asincrónico. Lee los contenidos de un directorio. El callback obtiene dos argumentos `(err, files)`, en donde `files` es una matriz de los nombres de los archivos en el directorio excluyendo `'.'` y `'..'`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para los nombres de archivo pasados al callback. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como objetos de `Buffer` .

## fs.readdirSync(path[, options])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`

readdir(3) sincrónico. Devuelve una matriz de nombres de archivo que excluye a `'.'` y `'..'`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para los nombres de archivo pasados al callback. Si el `encoding` se establece a `'buffer'`, los nombres de archivo devueltos serán pasados como objetos de `Buffer` .

## fs.readFile(path[, options], callback)
<!-- YAML
added: v0.1.29
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v5.1.0
    pr-url: https://github.com/nodejs/node/pull/3740
    description: The `callback` will always be called with `null` as the `error`
                 parameter in case of success.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `path` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `null`
  * `flag` {string} **Por defecto es:** `'r'`
* `callback` {Function}
  * `err` {Error}
  * `data` {string|Buffer}

Lee de manera asincrónica todos los contenidos de un archivo. Ejemplo:

```js
fs.readFile('/etc/passwd', (err, data) => {
  if (err) throw err;
  console.log(data);
});
```

Al callback se le pasan dos argumentos `(err, data)`, en donde `data` son los contenidos del archivo.

Si no se especifica ninguna codificación, entonces el búfer crudo será devuelto.

Si `options` es una string, entonces especifica la codificación. Ejemplo:

```js
fs.readFile('/etc/passwd', 'utf8', callback);
```
*Nota*: Cuando la ruta es un directorio, el comportamiento de `fs.readFile()` y [`fs.readFileSync()`][] es específico en la plataforma. En macOS, Linux, y Windows, se devolverá un error. En FreeBSD, una representación de los contenidos del directorio será devuelta.

```js
// macOS, Linux, and Windows
fs.readFile('<directory>', (err, data) => {
  // => [Error: EISDIR: illegal operation on a directory, read <directory>]
});

//  FreeBSD
fs.readFile('<directory>', (err, data) => {
  // => null, <data>
});
```

Cualquier descriptor de archivos especificado tiene que soportar la lectura.

*Nota*: Si un descriptor de archivo se especifica como el `path`, no será cerrado automáticamente.

*Nota*: `fs.readFile()` lee todo el archivo en una sola petición de threadpool. To minimize threadpool task length variation, prefer the partitioned APIs `fs.read()` and `fs.createReadStream()` when reading files as part of fulfilling a client request.

## fs.readFileSync(path[, options])
<!-- YAML
added: v0.1.8
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `path` parameter can be a file descriptor now.
-->

* `path` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `null`
  * `flag` {string} **Por defecto es:** `'r'`

Versión sincrónica de [`fs.readFile()`][]. Devuelve los contenidos del `path`.

Si la opción de `encoding` es especificada, entonces esta función devuelve una string. De lo contrario, devuelve un búfer.

*Nota*: Similar a [`fs.readFile()`][], cuando la ruta es un directorio, el comportamiento de `fs.readFileSync()` es específico en la plataforma.

```js
// macOS, Linux, and Windows
fs.readFileSync('<directory>');
// => [Error: EISDIR: illegal operation on a directory, read <directory>]

//  FreeBSD
fs.readFileSync('<directory>'); // => null, <data>
```

## fs.readlink(path[, options], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `linkString` {string|Buffer}

readlink(2) asincrónico. El callback obtiene dos argumentos `(err,
linkString)`.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta de enlace pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

## fs.readlinkSync(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`

readlink(2) sincrónico. Devuelve el valor de la string del enlace simbólico.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta de enlace pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta de enlace devuelta será pasada como un objeto de `Buffer` .

## fs.readSync(fd, buffer, offset, length, position)
<!-- YAML
added: v0.1.21
changes:
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4518
    description: The `length` parameter can now be `0`.
-->

* `fd`{integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}

Versión sincrónica de [`fs.read()`][]. Devuelve el número de `bytesRead`.

## fs.realpath(path[, options], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/13028
    description: Pipe/Socket resolve support was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpath` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`
* `callback` {Function}
  * `err` {Error}
  * `resolvedPath` {string|Buffer}

realpath(3) asincrónico. El `callback` obtiene dos argumentos `(err,
resolvedPath)`. Puede utilizar `process.cwd` para resolver rutas relativas.

Sólo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para la ruta pasada al callback. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer` .

*Nota*: Si `path` resuelve a un socket o un pipe, la función devolverá un nombre dependiente al sistema para ese objeto.

## fs.realpathSync(path[, options])
<!-- YAML
added: v0.1.31
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/13028
    description: Pipe/Socket resolve support was added.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7899
    description: Calling `realpathSync` now works again for various edge cases
                 on Windows.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/3594
    description: The `cache` parameter was removed.
-->

* `path` {string|Buffer|URL}
* `opciones` {string|Object}
  * `encoding` {string} **Predeterminado:** `'utf8'`

realpath(3) sincrónico. Devuelve la ruta resuelta.

Sólo son soportadas las rutas que pueden ser convertidas a strings UTF8.

El argumento opcional de `options` puede ser una string que especifique una codificación, o un objeto con una propiedad de `encoding` que especifique la codificación de caracteres a usar para el valor devuelto. Si el `encoding` se establece a `'buffer'`, la ruta devuelta será pasada como un objeto de `Buffer` .

*Nota*: Si `path` resuelve a un socket o un pipe, la función devolverá un nombre dependiente al sistema para ese objeto.

## fs.rename(oldPath, newPath, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

De manera asincrónica, renombra a un archivo en `oldPath` al nombre de ruta proporcionado como `newPath`. En caso de que `newPath` ya exista, será reescrito. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

Vea también: rename(2).

```js
fs.rename('oldFile.txt', 'newFile.txt', (err) => {
  if (err) throw err;
  console.log('Rename complete!');
});
```

## fs.renameSync(oldPath, newPath)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `oldPath` and `newPath` parameters can be WHATWG `URL`
                 objects using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `oldPath` {string|Buffer|URL}
* `newPath` {string|Buffer|URL}

rename(2) sincrónico. Devuelve `undefined`.

## fs.rmdir(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

rmdir(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación.

*Nota*: Utilizar `fs.rmdir()` en un archivo (no un directorio) da como resultado un error de `ENOENT` en Windows y un error de `ENOTDIR` en POSIX.

## fs.rmdirSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameters can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

rmdir(2) sincrónico. Devuelve `undefined`.

*Nota*: Utilizar `fs.rmdirSync()` en un archivo (no un directorio) da como resultado un error de `ENOENT` en Windows y un error de `ENOTDIR` en POSIX.

## fs.stat(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v9.9.0
    pr-url: https://github.com/nodejs/node/pull/18801
    description: The `as` and `as+` modes are supported now.
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}
  * `stats` {fs.Stats}

stat(2) asincrónico. El callback obtiene dos argumentos `(err, stats)` donde `stats` es un objeto de [`fs.Stats`][].

En caso de que ocurra un error, el `err.code` será uno de los [Errores de Sistema Comunes](errors.html#errors_common_system_errors).

Utilizar `fs.stat()` para verificar la existencia de un archivo antes de llamar a `fs.open()`, `fs.readFile()` ó `fs.writeFile()` no es recomendado. En lugar de ello, el código de usuario debería abrir/leer/escribir el archivo directamente y manejar el error ocurrido si el archivo no está disponible.

Para verificar si un archivo existe sin manipularlo posteriormente, se recomienda [`fs.access()`].

## fs.statSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

stat(2) sincrónico. Devuelve una instancia de [`fs.Stats`][].

## fs.symlink(target, path[, type], callback)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Por defecto es:** `'file'`
* `callback` {Function}
  * `err` {Error}

symlink(2) asincrónico. Ningún otro argumento que no sea una posible excepción es dado al callback de terminación. El argumento de `type` puede ser establecido a `'dir'`, `'file'`, ó `'junction'` y sólo está disponible en Windows (se ignora en otras plataformas). Tenga en cuenta que los puntos de unión de Windows requieren que la ruta de destino sea absoluta. Cuando se utiliza `'junction'`, el argumento de `target` será automáticamente normalizado a la ruta absoluta.

A continuación, hay un ejemplo:

```js
fs.symlink('./foo', './new-port', callback);
```

Crea un enlace simbólico llamado "new-port" que apunta a "foo".

## fs.symlinkSync(target, path[, type])
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `target` and `path` parameters can be WHATWG `URL` objects
                 using `file:` protocol. Support is currently still
                 *experimental*.
-->

* `target` {string|Buffer|URL}
* `path` {string|Buffer|URL}
* `type` {string} **Por defecto es:** `'file'`

symlink(2) sincrónico. Devuelve `undefined`.

## fs.truncate(path[, len], callback)
<!-- YAML
added: v0.8.6
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Predeterminado:** `0`
* `callback` {Function}
  * `err` {Error}

truncate(2) asincrónico. Ningún argumento que no sea una posible excepción es dado al callback de terminación. Un descriptor de archivos también puede ser pasado como el primer argumento. En este caso, `fs.ftruncate()` es llamado.

## fs.truncateSync(path[, len])
<!-- YAML
added: v0.8.6
-->

* `path` {string|Buffer|URL}
* `len` {integer} **Predeterminado:** `0`

truncate(2) sincrónico. Devuelve `undefined`. Un descriptor de archivo también puede ser pasado como el primer argumento. En este caso, `fs.ftruncateSync()` es llamado.

## fs.unlink(path, callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `path` {string|Buffer|URL}
* `callback` {Function}
  * `err` {Error}

Elimina de manera asincrónica un archivo o enlace simbólico. Ningún argumento que no sea una posible excepción es dado al callback de terminación.

```js
// Assuming that 'path/file.txt' is a regular file.
fs.unlink('path/file.txt', (err) => {
  if (err) throw err;
  console.log('path/file.txt was deleted');
});
```

`fs.unlink()` no funcionará en un directorio, vacío o no. Para eliminar un directorio, utilice [`fs.rmdir()`][].

Vea también: unlink(2)

## fs.unlinkSync(path)
<!-- YAML
added: v0.1.21
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
-->

* `path` {string|Buffer|URL}

unlink(2) sincrónico. Devuelve `undefined`.

## fs.unwatchFile(filename[, listener])
<!-- YAML
added: v0.1.31
-->

* `filename` {string|Buffer|URL}
* `listener` {Function} Opcional, un listener previamente acoplado utilizando `fs.watchFile()`

Deja de buscar cambios en `filename`. Si se especifica `listener`, sólo se eliminará ese listener en específico. De lo contrario, se eliminarán *todos* los listeners, deteniendo de manera eficaz la observación de `filename`.

Llamar a `fs.unwatchFile()` con un nombre de archivo que no esté siendo observado es un no-op, no un error.

*Nota*: [`fs.watch()`][] es más eficiente que `fs.watchFile()` y `fs.unwatchFile()`. `fs.watch()` debería ser utilizado en lugar de `fs.watchFile()` y `fs.unwatchFile()` cuando sea posible.

## fs.utimes(path, atime, mtime, callback)
<!-- YAML
added: v0.4.2
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11919
    description: "`NaN`, `Infinity`, and `-Infinity` are no longer valid time
                 specifiers."
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {number|string|Date}
* `mtime` {number|string|Date}
* `callback` {Function}
  * `err` {Error}

Cambia las marcas de tiempo del sistema de archivos del objeto referenciado por `path`.

Los argumentos `atime` y `mtime` siguen las siguientes reglas:
- Los valores pueden ser números que representen el tiempo de época de Unix, `Date`s, o una string numérica como `'123456789.0'`.
- Si el valor no puede ser convertido a un número, o es `NaN`, `Infinity` o `-Infinity`, se arrojará un `Error` .

## fs.utimesSync(path, atime, mtime)
<!-- YAML
added: v0.4.2
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11919
    description: "`NaN`, `Infinity`, and `-Infinity` are no longer valid time
                 specifiers."
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `path` parameter can be a WHATWG `URL` object using `file:`
                 protocol. Support is currently still *experimental*.
  - version: v4.1.0
    pr-url: https://github.com/nodejs/node/pull/2387
    description: Numeric strings, `NaN` and `Infinity` are now allowed
                 time specifiers.
-->

* `path` {string|Buffer|URL}
* `atime` {integer}
* `mtime` {integer}

Versión sincrónica de [`fs.utimes()`][]. Devuelve `undefined`.

## fs.watch(filename\[, options\]\[, listener\])
<!-- YAML
added: v0.5.10
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7831
    description: The passed `options` object will never be modified.
-->

* `filename` {string|Buffer|URL}
* `opciones` {string|Object}
  * `persistent` {boolean} Indica si el proceso debería continuar ejecutándose, siempre y cuando los archivos estén siendo observados. **Predeterminado:** `true`.
  * `recursive` {boolean} Indica si todos los sub-directorios deberían ser observados, o solamente el directorio actual. Esto aplica cuando un directorio es especificado, y solamente en plataformas soportadas (Vea [Advertencias](#fs_caveats)). **Predeterminado:** `false`.
  * `encoding` {string} Especifica la codificación de caracteres que será utilizada para el nombre de archivo pasado al listener. **Predeterminado:** `'utf8'`.
* `listener` {Function|undefined} **Default:** `undefined`
  * `eventType` {string}
  * `filename` {string|Buffer}

Busca cambios en `filename`, donde `filename` es o un archivo o un directorio. El objeto devuelto es un [`fs.FSWatcher`][].

El segundo argumento es opcional. Si se proporciona `options` como una string, especificará el `encoding`. De lo contrario, `options` debería ser pasado como un objeto.

El callback del listener recibe dos argumentos `(eventType, filename)`. `eventType` es `'rename'` o `'change'`, y `filename` es el nombre del archivo que activó el evento.

Tenga en cuenta que en la mayoría de las plataformas, `'rename'` es emitido cuando un nombre de archivo aparece o desaparece en el directorio.

Tenga en cuenta también que el callback del listener está acoplado al evento de `'change'` activado por [`fs.FSWatcher`][], pero no es lo mismo que el valor de `'change'` de `eventType`.

### Advertencias

<!--type=misc-->

La API de `fs.watch` no es 100% consistente entre plataformas, y en algunas situaciones no está disponible.

La opción recursiva sólo es soportada en macOS y Windows.

#### Disponibilidad

<!--type=misc-->

Esta función depende del sistema operativo subyacente, proporcionando una manera para estar notificado de los cambios del sistema de archivos.

* En sistemas Linux, esto utiliza [`inotify`]
* En sistemas BSD, esto utiliza [`kqueue`]
* En macOC, esto utiliza [`kqueue`] para archivos y [`FSEvents`] para directorios.
* En sistemas SunOS (incluyendo Solaris y SmartOS), esto utiliza [`event ports`].
* En el sistema de Windows, esta función depende de [`ReadDirectoryChangesW`].
* En sistemas Aix, esta función depende de [`AHAFS`], la cual debe ser habilitada.

Si la funcionalidad subyacente no está disponible por algún motivo, entonces `fs.watch` no podrá funcionar. Por ejemplo, observar archivos o directorios puede no ser seguro, y en algunos casos imposible, en sistemas de archivos de red (NFS, SMB, etc), o sistemas de alojamiento de archivos cuando se utilizan softwares de virtualización tales como Vagrant, Docker, etc.

Aún es posible utilizar `fs.watchFile()`, el cual utiliza el polling de estadísticas, pero este método es más lento y menos seguro.

#### Inodos

<!--type=misc-->

En Linux y sistemas de macOS, `fs.watch()` resuelve la ruta a un [inode](https://en.wikipedia.org/wiki/Inode) y observa el inode. Si la ruta observada es eliminada y recreada, se le asigna un nuevo inode. La observación emitirá un evento para la eliminación, pero continuará observando el inode *original* . No se emitirán eventos para el nuevo inode. Este comportamiento es esperado.

Los archivos AIX retienen el mismo inode durante el tiempo de vida de un archivo. Guardar y cerrar un archivo observado en AIX tendrá como resultado dos notificaciones (una para añadir nuevo contenido, y una para el truncamiento).

#### Argumento de Nombre de Archivo

<!--type=misc-->

Proporcionar un argumento de `filename` en el callback sólo es soportado en Linux, macOS, WIndows, y AIX. Incluso en las plataformas que lo soportan, no se garantiza que `filename` siempre será proporcionado. Por lo tanto, no asuma que el argumento de `filename` siempre se proporcionará en el callback, y tendrá algo de lógica de reserva si es nulo.

```js
fs.watch('somedir', (eventType, filename) => {
  console.log(`event type is: ${eventType}`);
  if (filename) {
    console.log(`filename provided: ${filename}`);
  } else {
    console.log('filename not provided');
  }
});
```

## fs.watchFile(filename[, options], listener)
<!-- YAML
added: v0.1.31
changes:
  - version: v7.6.0
    pr-url: https://github.com/nodejs/node/pull/10739
    description: The `filename` parameter can be a WHATWG `URL` object using
                 `file:` protocol. Support is currently still *experimental*.
-->

* `filename` {string|Buffer|URL}
* `opciones` {Object}
  * `persistent` {boolean} **Por defecto es:** `true`
  * `interval` {integer} **Por defecto es:** `5007`
* `listener` {Function}
  * `current` {fs.Stats}
  * `previous` {fs.Stats}

Buscar cambios en `filename`. El callback de `listener` será llamado cada vez que el archivo sea accedido.

El argumento de `options` puede ser omitido. Si se proporciona, debería ser un objeto. El objeto de `options` puede contener un booleano llamado `persistent` que indica si el proceso debería continuar ejecutándose, siempre y cuando los archivos estén siendo observados. El objeto de `options` puede especificar una propiedad de `interval` que indique qué tan seguido debería estudiarse el objetivo en milisegundos.

El `listener` obtiene dos argumentos, el objeto de estadística actual y el objeto de estadística previo:

```js
fs.watchFile('message.text', (curr, prev) => {
  console.log(`the current mtime is: ${curr.mtime}`);
  console.log(`the previous mtime was: ${prev.mtime}`);
});
```

Estos objetos de estadísticas son instancias de `fs.Stat`.

Para ser notificado de cuándo se modificó el archivo, no sólo cuando fue accedido, es necesario comparar `curr.mtime` y `prev.mtime`.

*Nota*: Cuando una operación de `fs.watchFile` tiene como resultado un error de `ENOENT`, esta invocará al listener una vez, junto con todos los campos en cero (o, para las fechas, el Tiempo de Unix). En Windows, los campos de `blksize` y `blocks` serán `undefined`, en vez de cero. Si el archivo es creado más tarde, el listener será llamado nuevamente, con los últimos objetos de estadística. Este es un cambio en la funcionalidad desde v0.10.

*Nota*: [`fs.watch()`][] es más eficiente que `fs.watchFile` y `fs.unwatchFile`. `fs.watch` debería ser utilizado en lugar de `fs.watchFile` y `fs.unwatchFile` cuando sea posible.

*Nota:* Cuando un archivo que esté siendo observado por `fs.watchFile()` desaparezca y reaparezca, entonces el `previousStat` reportado en el segundo evento de callback (la reaparición del archivo) será igual al `previousStat` del primer evento de callback (su desaparición).

Esto ocurre cuando:
- el archivo es eliminado, seguido de una restauración
- el archivo es renombrado dos veces - la segunda vez de vuelta a su nombre original

## fs.write(fd, buffer[, offset[, length[, position]]], callback)
<!-- YAML
added: v0.0.2
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}
* `callback` {Function}
  * `err` {Error}
  * `bytesWritten` {integer}
  * `buffer` {Buffer|Uint8Array}

Escribe `buffer` al archivo especificado por `fd`.

`offset` determina la parte del búfer que será escrita, y `length` es un entero que especifica el número de bytes a escribir.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de que `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

Al callback se le darán tres argumentos `(err, bytesWritten, buffer)` en donde `bytesWritten` especificará cuántos _bytes_ fueron escritos desde `buffer`.

Si se invoca este método en su versión [`util.promisify()`][], devolverá una Promesa para un objeto con propiedades de `bytesWritten` y `buffer` .

Tenga en cuenta que no es seguro utilizar `fs.write` múltiples veces en el mismo archivo sin esperar al callback. Para este caso, `fs.createWriteStream` es altamente recomendado.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

## fs.write(fd, string[, position[, encoding]], callback)
<!-- YAML
added: v0.11.5
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
-->

* `fd`{integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}
* `callback` {Function}
  * `err` {Error}
  * `written` {integer}
  * `string` {string}

Escribe `string` al archivo especificado por `fd`. Si `string` no es una string, entonces el valor será forzado a uno.

`position` se refiere al offset del principio del archivo en donde deberían ser escritos estos datos. En caso de que `typeof position !== 'number'`, los datos serán escritos en la posición actual. Vea pwrite(2).

`encoding` es la codificación de string esperada.

El callback recibirá los argumentos `(err, written, string)`, en donde `written` especificará cuántos _bytes_ necesitó la string pasada para ser escrita. Tenga en cuenta que bytes escritos no es igual a caracteres de string. Vea [`Buffer.byteLength`][].

A diferencia de cuando se escribe el `buffer`, toda la string debe ser escrita. No se puede especificar ninguna substring. Esto se debe a que el offset de bytes de los datos resultantes puede que no sea igual al offset de strings.

Tenga en cuenta que no es seguro utilizar `fs.write` múltiples veces en el mismo archivo sin esperar al callback. Para este caso, `fs.createWriteStream` es altamente recomendado.

En Linux, las escrituras posicionales no funcionan cuando el archivo se abre en modo de anexo. El núcleo ignora el argumento de posición y siempre anexa los datos al final del archivo.

## fs.writeFile(file, data[, options], callback)
<!-- YAML
added: v0.1.29
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7897
    description: The `callback` parameter is no longer optional. Not passing
                 it will emit a deprecation warning.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `data` {string|Buffer|Uint8Array}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} **Por defecto es:** `'w'`
* `callback` {Function}
  * `err` {Error}

Escribe los datos de manera asincrónica a un archivo, reemplazando el archivo si ya existe. `data` puede ser una string o un búfer.

La opción de `encoding` se ignora si `data` es un búfer.

Ejemplo:

```js
fs.writeFile('message.txt', 'Hello Node.js', (err) => {
  if (err) throw err;
  console.log('The file has been saved!');
});
```

Si `options` es una string, entonces especifica la codificación. Ejemplo:

```js
fs.writeFile('message.txt', 'Hello Node.js', 'utf8', callback);
```

Cualquier descriptor de archivos especificado tiene que soportar la escritura.

Tenga en cuenta que no es seguro utilizar `fs.writeFile` múltiples veces en el mismo archivo sin esperar al callback. Para este caso, `fs.createWriteStream` es altamente recomendado.

*Nota*: Si un descriptor de archivo se especifica como el `file`, no será cerrado automáticamente.

## fs.writeFileSync(file, data[, options])
<!-- YAML
added: v0.1.29
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `data` parameter can now be a `Uint8Array`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3163
    description: The `file` parameter can be a file descriptor now.
-->

* `file` {string|Buffer|URL|integer} nombre de archivo o descriptor de archivo
* `data` {string|Buffer|Uint8Array}
* `opciones` {Object|string}
  * `encoding` {string|null} **Por defecto es:** `'utf8'`
  * `mode` {integer} **Predeterminado:** `0o666`
  * `flag` {string} **Por defecto es:** `'w'`

La versión sincrónica de [`fs.writeFile()`][]. Devuelve `undefined`.

## fs.writeSync(fd, buffer[, offset[, length[, position]]])
<!-- YAML
added: v0.1.21
changes:
  - version: v7.4.0
    pr-url: https://github.com/nodejs/node/pull/10382
    description: The `buffer` parameter can now be a `Uint8Array`.
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `offset` and `length` parameters are optional now.
-->

* `fd`{integer}
* `buffer` {Buffer|Uint8Array}
* `offset` {integer}
* `length` {integer}
* `position` {integer}

## fs.writeSync(fd, string[, position[, encoding]])
<!-- YAML
added: v0.11.5
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/7856
    description: The `position` parameter is optional now.
-->

* `fd`{integer}
* `string` {string}
* `position` {integer}
* `encoding` {string}

Versiones sincrónicas de [`fs.write()`][]. Devuelve el número de bytes escritos.

## Constantes FS

Las siguientes constantes son exportadas por `fs.constants`.

*Nota*: No todas las constantes estarán disponibles en cada sistema operativo.

### Constantes de Acceso de Archivo

Las siguientes constantes están destinadas para ser utilizadas con [`fs.access()`][].

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>F_OK</code></td>
    <td>Bandera que indica que el archivo es visible para el proceso de llamada.</td>
  </tr>
  <tr>
    <td><code>R_OK</code></td>
    <td>Bandera que indica que el archivo puede ser leído por el proceso de llamada.</td>
  </tr>
  <tr>
    <td><code>W_OK</code></td>
    <td>Bandera que indica que el archivo puede ser escrito por el proceso
    de llamada.</td>
  </tr>
  <tr>
    <td><code>X_OK</code></td>
    <td>Bandera que indica que el archivo puede ser ejecutado por el proceso
    de llamada.</td>
  </tr>
</table>

### Constantes Abiertas de Archivo

Las siguientes constantes están destinadas para ser utilizadas con `fs.open()`.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>O_RDONLY</code></td>
    <td>Bandera que indica abrir un archivo con acceso de solo-lectura.</td>
  </tr>
  <tr>
    <td><code>O_WRONLY</code></td>
    <td>Bandera que indica abrir un archivo con acceso de solo-escritura.</td>
  </tr>
  <tr>
    <td><code>O_RDWR</code></td>
    <td>Bandera que indica abrir un archivo con acceso de lectura-escritura.</td>
  </tr>
  <tr>
    <td><code>O_CREAT</code></td>
    <td>Bandera que indica crear el archivo, si éste aún no existe.</td>
  </tr>
  <tr>
    <td><code>O_EXCL</code></td>
    <td>Bandera que indica que fallará la apertura de un archivo si la
bandera     <code>O_CREAT</code> está establecida y el archivo ya existe.</td>
  </tr>
  <tr>
    <td><code>O_NOCTTY</code></td>
    <td>Bandera que indica que si la ruta identifica un dispositivo terminal, abrir la
    ruta no causará que ese terminal se convierta en un terminal de control para
    el proceso (si el proceso no posee ya en ese momento uno).</td>
  </tr>
  <tr>
    <td><code>O_TRUNC</code></td>
    <td>Bandera que indica que si el archivo existe y es un archivo normal, y el
    archivo se abre exitosamente con acceso para ser escrito, su longitud deberá ser truncada
    a cero.</td>
  </tr>
  <tr>
    <td><code>O_APPEND</code></td>
    <td>Bandera que indica que los datos serán anexados al final del archivo.</td>
  </tr>
  <tr>
    <td><code>O_DIRECTORY</code></td>
    <td>Bandera que indica que la apertura debería fallar si la ruta no es un
    directorio.</td>
  </tr>
  <tr>
  <td><code>O_NOATIME</code></td>
    <td>Bandera que indica que los accesos de lectura al sistema de archivos ya no
    resultarán en una actualización de la información de `atime` asociada al archivo.
    Esta bandera sólo está disponible en sistemas operativos de Linux.</td>
  </tr>
  <tr>
    <td><code>O_NOFOLLOW</code></td>
    <td>Bandera que indica que la apertura debería fallar si el archivo es un link
    simbólico.</td>
  </tr>
  <tr>
    <td><code>O_SYNC</code></td>
    <td>Bandera que indica que el archivo se abre para E/S sincronizada con operaciones de
    escritura a la espera de la integridad del archivo.</td>
  </tr>
  <tr>
    <td><code>O_DSYNC</code></td>
    <td>Bandera que indica que el archivo se abre para E/S sincronizada con operaciones de
    escritura a la espera de la integridad de los datos.</td>
  </tr>
  <tr>
    <td><code>O_SYMLINK</code></td>
    <td>Bandera que indica abrir el enlace simbólico en vez del
    recurso al cual éste apunta.</td>
  </tr>
  <tr>
    <td><code>O_DIRECT</code></td>
    <td>Al establecerse, se realizará un intento para minimizar los efectos de captura del archivo
    E/S.</td>
  </tr>
  <tr>
    <td><code>O_NONBLOCK</code></td>
    <td>Bandera que indica abrir el archivo en modo de no-bloqueo, cuando sea posible.</td>
  </tr>
</table>

### Constantes de Tipo de Archivo

Las siguientes constantes están destinadas para ser utilizadas con la propiedad `mode` del objeto de [`fs.Stats`][] para determinar el tipo de un archivo.

<table>
  <tr>
    <th>Constantes</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>S_IFMT</code></td>
    <td>Máscara de bits utilizada para extraer el código de tipo de archivo.</td>
  </tr>
  <tr>
    <td><code>S_IFREG</code></td>
    <td>Constante de tipo de archivo para un archivo normal.</td>
  </tr>
  <tr>
    <td><code>S_IFDIR</code></td>
    <td>Constante de tipo de archivo para un directorio.</td>
  </tr>
  <tr>
    <td><code>S_IFDIR</code></td>
    <td>Constante de tipo de archivo para un archivo de dispositivo orientado por caracteres.</td>
  </tr>
  <tr>
    <td><code>S_IFBLK</code></td>
    <td>Constante de tipo de archivo para un archivo de dispositivo orientado por bloques.</td>
  </tr>
  <tr>
    <td><code>S_IFIFO</code></td>
    <td>Constante de tipo de archivo para un FIFO/pipe.</td>
  </tr>
  <tr>
    <td><code>S_IFLNK</code></td>
    <td>Constante de tipo de archivo para un enlace simbólico.</td>
  </tr>
  <tr>
    <td><code>S_IFSOCK</code></td>
    <td>Constante de tipo de archivo para un socket.</td>
  </tr>
</table>

### Constantes de Modo de Archivo

Las siguientes constantes están destinadas para ser utilizadas con la propiedad `mode` del objeto de [`fs.Stats`][] para determinar los permisos de acceso para un archivo.

<table>
  <tr>
    <th>Constante</th>
    <th>Descripción</th>
  </tr>
  <tr>
    <td><code>S_IRWXU</code></td>
    <td>Modo de archivo que indica que es legible, editable y que puede ser ejecutado por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IRUSR</code></td>
    <td>Modo de archivo que indica que puede ser leído por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IWUSR</code></td>
    <td>Modo de archivo que indica que puede ser editado por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IXUSR</code></td>
    <td>Modo de archivo que indica que puede ser ejecutado por el propietario.</td>
  </tr>
  <tr>
    <td><code>S_IRWXG</code></td>
    <td>Modo de archivo que indica que es legible. editable, y que puede ser ejecutado por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IRGRP</code></td>
    <td>Modo de archivo que indica que puede ser leído por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IWGRP</code></td>
    <td>Modo de archivo que indica que puede ser editado por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IXGRP</code></td>
    <td>Modo de archivo que indica que puede ser ejecutado por el grupo.</td>
  </tr>
  <tr>
    <td><code>S_IRWXO</code></td>
    <td>Modo de archivo que indica que es legible, editable, y que puede ser ejecutado por otros.</td>
  </tr>
  <tr>
    <td><code>S_IROTH</code></td>
    <td>Modo de archivo que indica que puede ser leído por otros.</td>
  </tr>
  <tr>
    <td><code>S_IWOTH</code></td>
    <td>Modo de archivo que indica que puede ser editado por otros.</td>
  </tr>
  <tr>
    <td><code>S_IXOTH</code></td>
    <td>Modo de archivo que indica que puede ser ejecutado por otros.</td>
  </tr>
</table>

