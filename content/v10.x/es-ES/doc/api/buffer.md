# Buffer

<!--introduced_in=v0.1.90-->

> Estability: 2 - Estable

Antes de la introducción de [`TypedArray`], el lenguaje JavaScript no tenía ningún mecanismo para leer o manipular flujos de datos binarios. La clase `Buffer` fue introducida como parte de la API de Node.js para habilitar la interacción con secuencias de octetos en flujos TCP, operaciones del sistema de archivo, y otros contextos.

Con [`TypedArray`] ahora disponible, la clase `Buffer` implementa la API [`Uint8Array`] de una manera que es más optimizada y adecuada para Node.js.

Las instancias de la clase `Buffer` son similares a los arrays de enteros pero corresponden a asignaciones de memoria de tamaño fijo fuera del montículo de V8. El tamaño del `Buffer` se establece cuando se crea y no puede ser cambiado.

La clase de `Buffer` está dentro del alcance global, por lo que es poco probable que alguna vez uno necesite utilizar `require('buffer').Buffer`.

```js
// Crea un Buffer lleno de ceros de longitud 10.
const buf1 = Buffer.alloc(10);

// Crea un Buffer de longitud 10, lleno con 0x1.
const buf2 = Buffer.alloc(10, 1);

// Crea un buffer sin inicializar de longitud 10.
// Esto es más rápido que llamar a Buffer.alloc() pero la instancia de Buffer
// devuelta puede contener datos viejos que necesitan ser
// sobrescritos utilizando ya sea fill() o write().
const buf3 = Buffer.allocUnsafe(10);

// Crea un Buffer que contiene [0x1, 0x2, 0x3].
const buf4 = Buffer.from([1, 2, 3]);

// Crea un Buffer que contiene UTF-8 bytes [0x74, 0xc3, 0xa9, 0x73, 0x74].
const buf5 = Buffer.from('tést');

// Crea un Buffer que contiene Latin-1 bytes [0x74, 0xe9, 0x73, 0x74].
const buf6 = Buffer.from('tést', 'latin1');
```

## `Buffer.from()`, `Buffer.alloc()`, y `Buffer.allocUnsafe()`

En versiones anteriores a la 6.0.0, las instancias de `Buffer` fueron creadas utilizando la función constructor de `Buffer`, la cual asigna el `Buffer` retornado de manera diferente basado en qué argumento es provisto:

* Al pasar un número como el primer argumento de `Buffer()` (ejemplo `new Buffer(10)`) se asigna a un nuevo objeto de `Buffer` del tamaño especificado. Prior to Node.js 8.0.0, the memory allocated for such `Buffer` instances is *not* initialized and *can contain sensitive data*. Tales instancias de `Buffer` *deben* ser subsecuentemente inicializadas utilizando cualquier [`buf.fill(0)`][`buf.fill()`] o al escribir el `Buffer` entero. Mientras este comportamiento es *intencional* para mejorar el rendimiento, la experiencia en el desarrollo ha demostrado que una distinción más explícita es requerida entre la creación de un rápido pero no inicializado `Buffer` versus la creación de un `Buffer` más lento pero seguro. Comenzando en Node.js 8.0.0, `Buffer(num)` y `new Buffer(num)` retornará un `Buffer` con memoria inicializada.
* Pasar un string, array o `Buffer` como el primer argumento copia los datos del objeto pasado en el `Buffer`.
* Pasar un [`ArrayBuffer`] o un [`SharedArrayBuffer`] devuelve un `Buffer` que comparte la memoria asignada con el buffer del array dado.

Porque el comportamiento del `new Buffer()` es diferente dependiendo del tipo del primer argumento, los problemas de seguridad y confiabilidad pueden introducirse inadvertidamente dentro de las aplicaciones cuando la validación del argumento o la inicialización del `Buffer` no se realiza.

Para hacer la creación de las instancias de `Buffer` más confiable y menos propensa a errores, las formas variadas del constructor del `new Buffer()` han quedado **obsoletas** y han sido reemplazadas por los métodos separados `Buffer.from()`, [`Buffer.alloc()`], y [`Buffer.allocUnsafe()`].

*Los desarrolladores deben migrar todos los usos existentes de los constructores del `new Buffer()` a una de estas nuevas APIs.*

* [`Buffer.from(array)`] retorna un nuevo `Buffer` que *contiene una copia* de los octetos proporcionados.
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] retorna un nuevo `Buffer` que *comparte la misma memoria asignada* como el [`ArrayBuffer`] dado.
* [`Buffer.from(buffer)`] retorna un nuevo `Buffer` que *contiene una copia* de los contenidos del `Buffer` dado.
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`] retorna un nuevo `Buffer` que *contiene una copia* de la cadena proporcionada.
* [`Buffer.alloc(size[, fill[, encoding]])`][`Buffer.alloc()`] retorna un nuevo `Buffer` inicializado de un tamaño específico. Este método es más lento que [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] pero garantiza que las instancias de `Buffer` recién creadas nunca contengan datos antiguos que sean potencialmente confidenciales.
* [`Buffer.allocUnsafe(size)`][`Buffer.allocUnsafe()`] y [`Buffer.allocUnsafeSlow(size)`][`Buffer.allocUnsafeSlow()`] cada uno retorna un nuevo `Buffer` no inicializado del `size` especificado. Porque el `Buffer` no está inicializado, el segmento asignado en la memoria puede contender datos antiguos que son potencialmente confidenciales.

Las instancias de `Buffer` retornadas por [`Buffer.allocUnsafe()`] *deben* ser asignadas a un grupo de memoria interna compartida si `size` es menor o igual que la mitad de [`Buffer.poolSize`]. Las instancias retornadas por [`Buffer.allocUnsafeSlow()`] *nunca* utilizan el grupo de memoria interna compartida.

### La opción de línea de comando `--zero-fill-buffers`
<!-- YAML
added: v5.10.0
-->

Node.js se puede iniciar utilizando la opción de línea de comando `--zero-fill-buffers` para hacer que todas las instancias de `Buffer` recién asignadas se llenen con ceros al crearlas por defecto, incluyendo a buffers retornados por `new Buffer(size)`, [`Buffer.allocUnsafe()`], [`Buffer.allocUnsafeSlow()`], y `new
SlowBuffer(size)`. Utilizar esta bandera puede tener un significativo impacto negativo sobre el rendimiento. Se recomienda el uso de la opción `--zero-fill-buffers` solo cuando es necesario asegurar que las instancias de `Buffer` recientemente asignadas no puedan contener datos antiguos que son potencialmente confidenciales.

```txt
$ node --zero-fill-buffers
> Buffer.allocUnsafe(5);
<Buffer 00 00 00 00 00>
```

### ¿Qué hace `Buffer.allocUnsafe()` y `Buffer.allocUnsafeSlow()`"inseguros"?

Cuando se llama a [`Buffer.allocUnsafe()`] y a [`Buffer.allocUnsafeSlow()`], el segmento de memoria asignada está *no inicializada* (no es cero a cero). Mientras este diseño hace la asignación de memoria muy rápido, el segmento asignado de memoria puede contener datos antiguos que son potencialmente confidenciales. Utilizando un `Buffer` creado por [`Buffer.allocUnsafe()`] sin sobrescribir *completamente* la memoria se puede permitir que estos datos antiguos se filtren cuando la memoria del `Buffer` se lee.

Mientras que hay claras ventajas de rendimiento al utilizar [`Buffer.allocUnsafe()`], se *debe* tener cuidado adicional para evitar la introducción de vulnerabilidades de seguridad dentro de una aplicación.

## Buffers y Codificaciones de Caracteres
<!-- YAML
changes:
  - version: v6.4.0
    pr-url: https://github.com/nodejs/node/pull/7111
    description: Introduced `latin1` as an alias for `binary`.
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/2859
    description: Removed the deprecated `raw` and `raws` encodings.
-->

Cuando los datos de cadena se almacenan o extraen de una instancia de `Buffer`, una codificación de caracteres puede ser especificada.

```js
const buf = Buffer.from('hello world', 'ascii');

console.log(buf.toString('hex'));
// Imprime: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// Imprime: aGVsbG8gd29ybGQ=

console.log(Buffer.from('fhqwhgads', 'ascii'));
// Imprime: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// Imprime: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>
```

Las codificaciones de caracteres soportadas actualmente por Node.js incluyen:

* `'ascii'` - Solo para datos ASCII de 2-bit. Esta codificación es rápida y eliminará el bit alto si se establece.

* `'utf8'` - Multibyte codificado en caracteres Unicode. Muchas páginas web y otros formatos de documento utilizan UTF-8.

* `'utf16le'` - 2 o 4 bytes, caracteres Unicode codificados como little-endian. Los pares sustitutos (U+10000 to U+10FFFF) son soportados.

* `'ucs2'` - Alias de `'utf16le'`.

* `'base64'` - Codificación Base64. Al crear un `Buffer` desde una string, esta codificación también aceptará correctamente "URL y nombre de archivo Safe Alphabet" como es especificado en [RFC4648, Section 5](https://tools.ietf.org/html/rfc4648#section-5).

* `'latin1'` - Una forma de codificar el `Buffer` en una cadena codificada de un byte (como es definido por la IANA en [RFC1345](https://tools.ietf.org/html/rfc1345), página 63, para ser el bloque de suplemento Latin-1 y los códigos de control C0 / C1).

* `'binary'` - Alias para `'latin1'`.

* `'hex'` - Codifica cada byte como dos caracteres hexadecimales.

Los navegadores Web modernos siguen la [Codificación Estándar de WHATWG](https://encoding.spec.whatwg.org/) que distorsiona a `'latin1'` y de `'ISO-8859-1'` a `'win-1252'`. Esto significa que al hacer algo como `http.get()`, si el conjunto de caracteres devueltos es uno de los enumerados en las especificaciones de WHATWG, es posible que el servidor realmente devolviera los datos codificados en `'win-1252'`, y utilizar la codificación `'latin1'` puede decodificar incorrectamente los caracteres.

## Buffers y TypedArray
<!-- YAML
changes:
  - version: v3.0.0
    pr-url: https://github.com/nodejs/node/pull/2002
    description: The `Buffer`s class now inherits from `Uint8Array`.
-->

Instancias de `Buffer` también son instancias de [`Uint8Array`]. Sin embargo, hay sutiles incompatibilidades con [`TypedArray`]. Por ejemplo, mientras [`ArrayBuffer#slice()`] crea una copia del sector, la implementación de [`Buffer#slice()`][`buf.slice()`] crea una vista sobre el `Buffer` existente sin copiar, haciendo a [`Buffer#slice()`][`buf.slice()`] mucho más eficiente.

También es posible crear nuevas instancias de [`TypedArray`] desde un `Buffer` con las siguientes advertencias:

1. La memoria del objeto `Buffer` se copia al [`TypedArray`], no es compartida.

2. La memoria del objeto `Buffer` es interpretada como un array de distintos elementos, y no como un array, no como un array de bytes del tipo de destino. Es decir, `new Uint32Array(Buffer.from([1, 2, 3, 4]))` crea un elemento 4[`Uint32Array`] con elementos `[1, 2, 3, 4]`, no un [`Uint32Array`] con un solo elemento `[0x1020304]` o `[0x4030201]`.

It is possible to create a new `Buffer` that shares the same allocated memory as a [`TypedArray`] instance by using the `TypedArray` object's `.buffer` property.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Copia el contenido de `arr`
const buf1 = Buffer.from(arr);
// Comparte memoria con `arr`
const buf2 = Buffer.from(arr.buffer);

console.log(buf1);
// Imprime: <Buffer 88 a0>
console.log(buf2);
// Imprime: <Buffer 88 13 a0 0f>

arr[1] = 6000;

console.log(buf1);
// Imprime: <Buffer 88 a0>
console.log(buf2);
// Imprime: <Buffer 88 13 70 17>
```

Tenga en cuenta que cuando se crea un `Buffer` utilizando un `.buffer` de [`TypedArray`] es posible utilizar solo una parte del [`ArrayBuffer`] subyacente al pasar los parámetros `byteOffset` y `length`.

```js
const arr = new Uint16Array(20);
const buf = Buffer.from(arr.buffer, 0, 16);

console.log(buf.length);
// Imprime: 16
```

El `Buffer.from()` y el [`TypedArray.from()`] tienen diferentes firmas e implementaciones. Específicamente, las variantes de [`TypedArray`] aceptan un segundo argumento que es una función de mapeo que se invoca sobre cada elemento del arreglo escrito:

* `TypedArray.from(source[, mapFn[, thisArg]])`

El método `Buffer.from()`, sin embargo, no permite el uso de una función de mapeo:

* [`Buffer.from(array)`]
* [`Buffer.from(buffer)`]
* [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`]
* [`Buffer.from(string[, encoding])`][`Buffer.from(string)`]

## Buffers e Iteración

Las instancias de `Buffer` pueden iterarse utilizando la sintaxis `for..of`:

```js
const buf = Buffer.from([1, 2, 3]);

// Imprime:
//   1
//   2
//   3
for (const b of buf) {
  console.log(b);
}
```

Adicionalmente, los métodos [`buf.values()`], [`buf.keys()`], y [`buf.entries()`] pueden utilizarse para crear iteradores.

## Clase: Buffer

La clase `Buffer` es un tipo global para tratar con datos binarios directamente. Hay una variedad de maneras en las que puede ser construido.

### new Buffer(array)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Estabilidad: 0 - Desaprobada: Use [`Buffer.from(array)`] en su lugar.

* `array` {integer[]} Un array de bytes del cual copiarse.

Asigna un nuevo `Buffer` utilizando un `array` de octetos.

```js
// Crea un nuevo Buffer que contiene los bytes UTF-8 de la string 'buffer'
const buf = new Buffer([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

### nuevo Buffer(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v3.0.0
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/4682
    description: The `byteOffset` and `length` parameters are supported now.
-->

> Estabilidad: 0 - Obsoleto: Utilice [`Buffer.from(arrayBuffer[, byteOffset[, length]])`][`Buffer.from(arrayBuf)`] en su lugar.

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Un [`ArrayBuffer`], [`SharedArrayBuffer`] o la propiedad `.buffer` de un [`TypedArray`].
* `byteOffset` {integer} Índice del primer byte para exponer. **Predeterminado:** `0`.
* `length` {integer} Número de bytes para exponer. **Predeterminado:** `arrayBuffer.length - byteOffset`.

Esto crea una vista del [`ArrayBuffer`] o [`SharedArrayBuffer`] sin copiar la memoria subyacente. Por ejemplo, cuando se pasa una referencia a la propiedad `.buffer` de una instancia de [`TypedArray`], el `Buffer` recientemente creado compartirá la misma memoria asignada que el [`TypedArray`].

Los argumentos opcionales `byteOffset` y `length` especifican un rango de memoria dentro del `arrayBuffer` que será compartido por el `Buffer`.

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Comparte memoria con `arr`
const buf = new Buffer(arr.buffer);

console.log(buf);
// Imprime: <Buffer 88 13 a0 0f>

// Cambiar el Uint16Array original también cambia el Buffer
arr[1] = 6000;

console.log(buf);
// Imprime: <Buffer 88 13 70 17>
```

### nuevo Buffer(buffer)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Estabilidad: 0 - Obsoleto: Utilice [`Buffer.from(buffer)`] en su lugar.

* `buffer` {Buffer|Uint8Array} Un `Buffer` o [`Uint8Array`] existente desde donde copiar los datos.

Copia los datos del `buffer` pasado en una nueva instancia de `Buffer`.

```js
const buf1 = new Buffer('buffer');
const buf2 = new Buffer(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Imprime: auffer
console.log(buf2.toString());
// Imprime: buffer
```

### new Buffer(size)
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12141
    description: The `new Buffer(size)` will return zero-filled memory by
                 default.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Estabilidad: 0 - Desaprobado: Use [`Buffer.alloc()`] en su lugar (también vea  [`Buffer.allocUnsafe()`]).

* `size` {integer} La longitud deseada del nuevo `Buffer`.

Asigna un nuevo `Buffer` de `size` bytes. Si `size` es más largo que [`buffer.constants.MAX_LENGTH`] o más pequeño que 0, se lanza [`ERR_INVALID_OPT_VALUE`]. Un `Buffer` de longitud cero se crea si `size` es 0.

Antes de Node.js 8.0.0, la memoria subyacente para las instancias de `Buffer` creadas de esta manera está *no inicializada*. Los contenidos de un `Buffer` creado recientemente son desconocidos y *pueden contener datos confidenciales*. Utilice [`Buffer.alloc(size)`][`Buffer.alloc()`] en lugar de inicializar un `Buffer` con ceros.

```js
const buf = new Buffer(10);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

### new Buffer(string[, encoding])
<!-- YAML
deprecated: v6.0.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19524
    description: Calling this constructor emits a deprecation warning when
                 run from code outside the `node_modules` directory.
  - version: v7.2.1
    pr-url: https://github.com/nodejs/node/pull/9529
    description: Calling this constructor no longer emits a deprecation warning.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8169
    description: Calling this constructor emits a deprecation warning now.
-->

> Estabilidad: 0 - Desaprobado: Use [`Buffer.from(string[, encoding])`] [`Buffer.from(string)`] en su lugar.

* `string` {string} String a codificar.
* `encoding` {string} La codificación de `string`. **Predeterminado:** `'utf8'`.

Crea un nuevo `Buffer` que contiene `string`. El parámetro de `encoding` identifica la codificación de caracteres del `string`.

```js
const buf1 = new Buffer('esto es un tést');
const buf2 = new Buffer('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Imprime: esto es un tést
console.log(buf2.toString());
// Imprime: esto es un tést
console.log(buf1.toString('ascii'));
// Imprime: esto es un tC)st
```

### Método de Clase: Buffer.alloc(size[, fill[, encoding]])
<!-- YAML
added: v5.10.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18129
    description: Attempting to fill a non-zero length buffer with a zero length
                 buffer triggers a thrown exception.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17427
    description: Specifying an invalid string for `fill` triggers a thrown
                 exception.
  - version: v8.9.3
    pr-url: https://github.com/nodejs/node/pull/17428
    description: Specifying an invalid string for `fill` now results in a
                 zero-filled buffer.
-->

* `size` {integer} La longitud deseada del nuevo `Buffer`.
* `fill` {string|Buffer|integer} Un valor con el cual llenar previamente el nuevo `Buffer`. **Predeterminado:** `0`.
* `encoding` {string} Si `fill` es una string, esta es su codificación. **Predeterminado:** `'utf8'`.

Asigna un nuevo `Buffer` de `size` bytes. Si `fill` es `undefined`, el `Buffer` estará *lleno de ceros*.

```js
const buf = Buffer.alloc(5);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00>
```

Asigna un nuevo `Buffer` de `size` bytes. Si `size` es más largo que [`buffer.constants.MAX_LENGTH`] o más pequeño que 0, se lanza [`ERR_INVALID_OPT_VALUE`]. Un `Buffer` de longitud cero se crea si `size` es 0.

Si `fill` es especificado, el `Buffer` asignado se inicializará al llamar a [`buf.fill(fill)`][`buf.fill()`].

```js
const buf = Buffer.alloc(5, 'a');

console.log(buf);
// Imprime: <Buffer 61 61 61 61 61>
```

Si se especifican tanto `fill` como `encoding`, el `Buffer` asignado se inicializará al llamar a [`buf.fill(fill, encoding)`][`buf.fill()`].

```js
const buf = Buffer.alloc(11, 'aGVsbG8gd29ybGQ=', 'base64');

console.log(buf);
// Imprime: <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
```

Llamar a [`Buffer.alloc()`] puede ser significativamente más lento que la alternativa [`Buffer.allocUnsafe()`] pero garantiza que el contenido de la instancia de `Buffer` creada recientemente *nunca contendrá datos confidenciales*.

Se producirá un `TypeError` si `size` no es un número.

### Método de Clase: Buffer.allocUnsafe(size)
<!-- YAML
added: v5.10.0
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7079
    description: Passing a negative `size` will now throw an error.
-->

* `size` {integer} La longitud deseada del nuevo `Buffer`.

Asigna un nuevo `Buffer` de `size` bytes. Si `size` es más largo que [`buffer.constants.MAX_LENGTH`] o más pequeño que 0, se lanza [`ERR_INVALID_OPT_VALUE`]. Un `Buffer` de longitud cero se crea si `size` es 0.

La memoria subyacente para las instancias de `Buffer` creadas de esta manera está *sin inicializar*. Los contenidos del `Buffer` creado recientemente son desconocidos y *pueden contener datos confidenciales*. En su lugar, utilice [`Buffer.alloc()`] para inicializar las instancias de `Buffer` con ceros.

```js
const buf = Buffer.allocUnsafe(10);

console.log(buf);
// Imprime: (puede variar el contenido): <Buffer a0 8b 28 3f 01 00 00 00 50 32>

buf.fill(0);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00 00 00 00 00 00>
```

Se producirá un `TypeError` si `size` no es un número.

Tenga en cuenta que el módulo `Buffer` asigna previamente una instancia de `Buffer` interna de tamaño [`Buffer.poolSize`] que es usado como un repositorio para la rápida asignación de las nuevas instancias de `Buffer` creadas utilizando [`Buffer.allocUnsafe()`] y el constructor obsoleto `new Buffer(size)` solo cuando `size` es menor o igual que `Buffer.poolSize >> 1` (piso de [`Buffer.poolSize`] dividido entre dos).

El uso de este conjunto de memoria interna asignada previamente es una diferencia clave entre llamar a `Buffer.alloc(size, fill)` vs. `Buffer.allocUnsafe(size).fill(fill)`. Specifically, `Buffer.alloc(size, fill)` will *never* use the internal `Buffer` pool, while `Buffer.allocUnsafe(size).fill(fill)` *will* use the internal `Buffer` pool if `size` is less than or equal to half [`Buffer.poolSize`]. La diferencia es sutil, pero puede ser importante cuando una aplicación requiere el rendimiento adicional que proporciona [`Buffer.allocUnsafe()`].

### Método de Clase: Buffer.allocUnsafeSlow(size)
<!-- YAML
added: v5.12.0
-->

* `size` {integer} La longitud deseada del nuevo `Buffer`.

Asigna un nuevo `Buffer` de `size` bytes. Si `size` es más largo que [`buffer.constants.MAX_LENGTH`] o más pequeño que 0, se lanza [`ERR_INVALID_OPT_VALUE`]. Un `Buffer` de longitud cero se crea si `size` es 0.

La memoria subyacente para las instancias de `Buffer` creadas de esta manera está *sin inicializar*. Los contenidos del `Buffer` creado recientemente son desconocidos y *pueden contener datos confidenciales*. Utilice [`buf.fill(0)`][`buf.fill()`] para inicializar dichas instancias de `Buffer` con ceros.

Cuando se utiliza [`Buffer.allocUnsafe()`] para asignar nuevas instancias de `Buffer`, las asignaciones menores a 4KB se segmentan desde un solo `Buffer` asignado previamente. Esto permite a las aplicaciones evitar la sobrecarga de la recolección de basura que implica crear muchas instancias de `Buffer` asignadas individualmente. Este enfoque mejora el rendimiento y uso de la memoria, al eliminar la necesidad de rastrear y limpiar tantos objetos persistentes.

Sin embargo, en el caso donde un desarrollador puede necesitar retener un pequeño pedazo de memoria desde un conjunto por una cantidad indeterminada de tiempo, puede ser apropiado crear una instancia de `Buffer` sin agrupar utilizando `Buffer.allocUnsafeSlow()` y luego copiando los bits relevantes.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data
    const sb = Buffer.allocUnsafeSlow(10);

    // Copy the data into the new allocation
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

`Buffer.allocUnsafeSlow()` debe utilizarse solo como el último recurso después de que un desarrollador haya observado retención indebida de memoria en sus aplicaciones.

Se producirá un `TypeError` si `size` no es un número.

### Método de Clase: Buffer.byteLength(string[, encoding])
<!-- YAML
added: v0.1.90
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/8946
    description: Passing invalid input will now throw an error.
  - version: v5.10.0
    pr-url: https://github.com/nodejs/node/pull/5255
    description: The `string` parameter can now be any `TypedArray`, `DataView`
                 or `ArrayBuffer`.
-->

* `string` {string|Buffer|TypedArray|DataView|ArrayBuffer|SharedArrayBuffer} Un valor del cual calcular la longitud.
* `encoding` {string} Si `string` es una string, esta es su codificación. **Predeterminado:** `'utf8'`.
* Devuelve: {integer} El número de bytes contenidos dentro de `string`.

Devuelve la longitud real en byte de una cadena. Esto no es lo mismo que [`String.prototype.length`], pues eso devuelve el número de *caracteres* en una cadena.

Para `'base64'` y `'hex'`, esta función asume una entrada válida. Para cadenas que contienen datos no-Base64/codificados-Hex (por ejemplo, espacios en blanco), el valor de retorno puede ser mayor que la longitud de un `Buffer` creado desde la cadena.

```js
const str = '\u00bd + \u00bc = \u00be';

console.log(`${str}: ${str.length} characters, ` +
            `${Buffer.byteLength(str, 'utf8')} bytes`);
// Imprime: ½ + ¼ = ¾: 9 caracteres, 12 bytes
```

Cuando `string` es un `Buffer`/[`DataView`]/[`TypedArray`]/[`ArrayBuffer`]/ [`SharedArrayBuffer`], se devuelve la longitud del byte real.

### Método de Clase: Buffer.compare(buf1, buf2)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `buf1` {Buffer|Uint8Array}
* `buf2` {Buffer|Uint8Array}
* Devuelve: {integer}

Compara `buf1` con `buf2`, típicamente con el propósito de clasificar arreglos de instancias de `Buffer`. Esto es equivalente a llamar a [`buf1.compare(buf2)`][`buf.compare()`].

```js
const buf1 = Buffer.from('1234');
const buf2 = Buffer.from('0123');
const arr = [buf1, buf2];

console.log(arr.sort(Buffer.compare));
// Imprime: [ <Buffer 30 31 32 33>, <Buffer 31 32 33 34> ]
// (Este resultado es igual a: [buf2, buf1])
```

### Método de Clase: Buffer.concat(list[, totalLength])
<!-- YAML
added: v0.7.11
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The elements of `list` can now be `Uint8Array`s.
-->

* `list` {Buffer[] | Uint8Array[]} Lista de instancias de `Buffer` o [`Uint8Array`] para concatenar.
* `totalLength` {integer} Longitud total de las instancias de `Buffer` en `list` cuando están concatenadas.
* Devuelve: {Buffer}

Devuelve un nuevo `Buffer`, el cual es el resultado de concatenar todas las instancias de `Buffer` juntas en la `list`.

Si la lista no tiene elementos, o si la `totalLength` es 0, entonces un nuevo `Buffer` de longitud cero será devuelto.

Si no se proporciona `totalLength`, se calcula desde las instancias de `Buffer` en `list`. Sin embargo, esto ocasiona que se ejecute un bucle adicional para calcular la `totalLength`, así que es más rápido proporcionar explícitamente la longitud si ya se conoce.

Si se proporciona `totalLength`, se forza a ser un número entero, sin signos. Si la longitud combinada de los `Buffer`s en `list` excede la `totalLength`, el resultado se trunca a `totalLength`.

```js
// Crea un `Buffer` único desde una lista de tres instancias de `Buffer`.

const buf1 = Buffer.alloc(10);
const buf2 = Buffer.alloc(14);
const buf3 = Buffer.alloc(18);
const totalLength = buf1.length + buf2.length + buf3.length;

console.log(totalLength);
// Imprime: 42

const bufA = Buffer.concat([buf1, buf2, buf3], totalLength);

console.log(bufA);
// Imprime: <Buffer 00 00 00 00 ...>
console.log(bufA.length);
// Imprime: 42
```

### Método de Clase: Buffer.from(array)
<!-- YAML
added: v5.10.0
-->

* `array` {integer[]}

Asigna un nuevo `Buffer` utilizando un `array` de octetos.

```js
// Crea un Buffer nuevo que contiene bytes UTF-8 de la string 'buffer'
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]);
```

Se producirá un `TypeError` si `array` no es un `Array`.

### Método de Clase: Buffer.from(arrayBuffer[, byteOffset[, length]])
<!-- YAML
added: v5.10.0
-->

* `arrayBuffer` {ArrayBuffer|SharedArrayBuffer} Un [`ArrayBuffer`], [`SharedArrayBuffer`], o la propiedad `.buffer` de un [`TypedArray`].
* `byteOffset` {integer} Índice del primer byte para exponer. **Predeterminado:** `0`.
* `length` {integer} número de bytes a exponer. **Predeterminado:** `arrayBuffer.length - byteOffset`.

Esto crea una vista del [`ArrayBuffer`] sin copiar la memoria subyacente. Por ejemplo, cuando se pasa una referencia de la propiedad `.buffer` a una instancia [`TypedArray`], el`Buffer` creado recientemente compartirá la misma memoria asignada que el [`TypedArray`].

```js
const arr = new Uint16Array(2);

arr[0] = 5000;
arr[1] = 4000;

// Comparte memoria con `arr`
const buf = Buffer.from(arr.buffer);

console.log(buf);
// Imprime: <Buffer 88 13 a0 0f>

// Al cambiar el Uint16Array original también cambia el Buffer
arr[1] = 6000;

console.log(buf);
// Imprime: <Buffer 88 13 70 17>
```

Los argumentos opcionales `byteOffset` y `length` especifican un rango de memoria dentro del `arrayBuffer` que será compartido por el `Buffer`.

```js
const ab = new ArrayBuffer(10);
const buf = Buffer.from(ab, 0, 2);

console.log(buf.length);
// Imprime: 2
```

Se producirá un `TypeError` si `arrayBuffer` no es un [`ArrayBuffer`] o un [`SharedArrayBuffer`].

### Método de Clase: Buffer.from(buffer)
<!-- YAML
added: v5.10.0
-->

* `buffer` {Buffer|Uint8Array} Un `Buffer` o [`Uint8Array`] existente desde donde copiar los datos.

Copia los datos del `buffer` pasado en una nueva instancia de `Buffer`.

```js
const buf1 = Buffer.from('buffer');
const buf2 = Buffer.from(buf1);

buf1[0] = 0x61;

console.log(buf1.toString());
// Imprime: auffer
console.log(buf2.toString());
// Imprime: buffer
```

Se producirá un `TypeError` si `buffer` no es un `Buffer`.

### Método de Clase: Buffer.from(object[, offsetOrEncoding[, length]])
<!-- YAML
added: v8.2.0
-->

* `object` {Object} Un objeto que admite `Symbol.toPrimitive` o `valueOf()`
* `offsetOrEncoding` {number|string} Un byte-offset o codificación, dependiendo del valor devuelto por `object.valueOf()` o `object[Symbol.toPrimitive]()`.
* `length` {number} Una longitud, dependiendo del valor devuelto por `object.valueOf()` o `object[Symbol.toPrimitive]()`.

Para objetos cuya función `valueOf()` devuelve un valor que no es estrictamente igual a `object`, devuelve `Buffer.from(object.valueOf(), offsetOrEncoding, length)`.

```js
const buf = Buffer.from(new String('this is a test')); 
// Imprime: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

Para objetos que admiten `Symbol.toPrimitive`, devuelve `Buffer.from(object[Symbol.toPrimitive](), offsetOrEncoding, length)`.

```js
class Foo { 
  [Symbol.toPrimitive]() { 
    return 'this is a test'; 
  } 
} 

const buf = Buffer.from(new Foo(), 'utf8'); //
Imprime: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74>
```

### Método de Clase: Buffer.from(string[, encoding])
<!-- YAML
added: v5.10.0
-->

* `string` {string} Una string a codificar.
* `encoding` {string} La codificación de `string`. **Predeterminado:** `'utf8'`.

Crea un nuevo `Buffer` que contiene `string`. El parámetro de `encoding` identifica la codificación de caracteres del `string`.

```js
const buf1 = Buffer.from('this is a tést');
const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');

console.log(buf1.toString());
// Imprime: this is a tést
console.log(buf2.toString()); 
// Imprime: this is a tést 
console.log(buf1.toString('ascii')); 
// Imprime: this is a tC)st
```

Se producirá un `TypeError` si `string` no es una cadena.

### Método de Clase: Buffer.isBuffer(obj)
<!-- YAML
added: v0.1.101
-->

* `obj` {Object}
* Devuelve: {boolean}

Devuelve `true` si `obj` es un `Buffer`, de lo contrario devuelve `false`.

### Método de Clase: Buffer.isEncoding(encoding)
<!-- YAML
added: v0.9.1
-->

* `encoding` {string} Un nombre de codificación de caracteres para verificar.
* Devuelve: {boolean}

Devuelve `true` si `encoding` contiene una codificación de caracteres admitida, o `false` de lo contrario.

### Propiedad de Clase: Buffer.poolSize
<!-- YAML
added: v0.11.3
-->

* {integer} **Predeterminado:** `8192`

Este es el tamaño (en bytes) de las instancias internas de `Buffer` preasignadas, utilizadas para la agrupación. Este valor puede ser modificado.

### buf[index]
<!-- YAML
type: property
name: [index]
-->

El operador de índice `[index]` puede ser usado para obtener y establecer el octeto en la posición `index` en `buf`. Los valores refieren a bytes individuales, por lo que el rango de valor legal está entre `0x00` y `0xFF` (hex) o `0` y `255` (decimal).

Este operador es heredado de `Uint8Array`, por lo que su comportamiento en el acceso fuera de los límites es el mismo que `UInt8Array` - es decir, hacer "get" devuelve `undefined` y "set" no hace nada.

```js
// Copia una cadena ASCII dentro de un `Buffer`, un byte a la vez.

const str = 'Node.js';
const buf = Buffer.allocUnsafe(str.length);

for (let i = 0; i < str.length; i++) {
  buf[i] = str.charCodeAt(i);
}

console.log(buf.toString('ascii'));
// Imprime: Node.js
```

### buf.buffer

* {ArrayBuffer} El objeto `ArrayBuffer` subyacente en que se basa la creación de este objeto `Buffer`.

```js
const arrayBuffer = new ArrayBuffer(16);
const buffer = Buffer.from(arrayBuffer);

console.log(buffer.buffer === arrayBuffer);
// Imprime: true
```

### buf.byteOffset

* {integer} The `byteOffset` on the underlying `ArrayBuffer` object based on which this `Buffer` object is created.

When setting `byteOffset` in `Buffer.from(ArrayBuffer, byteOffset, length)` or sometimes when allocating a buffer smaller than `Buffer.poolSize` the buffer doesn't start from a zero offset on the underlying `ArrayBuffer`.

This can cause problems when accessing the underlying `ArrayBuffer` directly using `buf.buffer`, as the first bytes in this `ArrayBuffer` may be unrelated to the `buf` object itself.

A common issue is when casting a `Buffer` object to a `TypedArray` object, in this case one needs to specify the `byteOffset` correctly:

```js
// Create a buffer smaller than `Buffer.poolSize`.
const nodeBuffer = new Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

// When casting the Node.js Buffer to an Int8 TypedArray remember to use the
// byteOffset.
new Int8Array(nodeBuffer.buffer, nodeBuffer.byteOffset, nodeBuffer.length);
```

### buf.compare(target[, targetStart[, targetEnd[, sourceStart[, sourceEnd]]]])
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `target` parameter can now be a `Uint8Array`.
  - version: v5.11.0
    pr-url: https://github.com/nodejs/node/pull/5880
    description: Additional parameters for specifying offsets are supported now.
-->

* `target` {Buffer|Uint8Array} Un `Buffer` o [`Uint8Array`] con el que comparar `buf`.
* `targetStart` {integer} El desplazamiento dentro del `target` en el que debe comenzar la comparación. **Predeterminado:** `0`.
* `targetEnd` {integer} El desplazamiento con el `target` con el que debe terminar la comparación (no incluido). **Predeterminado:** `target.length`.
* `sourceStart` {integer} El desplazamiento dentro de `buf` con el que debe comenzar la comparación. **Predeterminado:** `0`.
* `sourceEnd` {integer} El desplazamiento dentro de `buf` con el que se debe terminar la comparación (no incluido). **Predeterminado:** [`buf.length`].
* Devuelve: {integer}

Compara `buf` con `target` y devuelve un número que indica si `buf` aparece antes, después, o es igual a `target` en el orden de clasificación. La comparación se basa en la secuencia real de bytes en cada `Buffer`.

* Se devuelve `0` si `target` es igual que `buf`
* Se devuelve `1` si `target` debe aparecer *antes* de `buf` cuando se ordenan.
* Se devuelve `-1` si `target` debe aparecer *después* de `buf` cuando se ordenan.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('BCD');
const buf3 = Buffer.from('ABCD');

console.log(buf1.compare(buf1));
// Imprime: 0
console.log(buf1.compare(buf2));
// Imprime: -1
console.log(buf1.compare(buf3));
// Imprime: -1
console.log(buf2.compare(buf1));
// Imprime: 1
console.log(buf2.compare(buf3));
// Imprime: 1
console.log([buf1, buf2, buf3].sort(Buffer.compare));
// Imprime: [ <Buffer 41 42 43>, <Buffer 41 42 43 44>, <Buffer 42 43 44> ]
// (Este resultado es igual a: [buf1, buf3, buf2])
```

Los argumentos opcionales `targetStart`, `targetEnd`, `sourceStart`, y `sourceEnd` pueden ser utilizados para limitar la comparación a rangos específicos dentro de `target` y `buf`, respectivamente.

```js
const buf1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const buf2 = Buffer.from([5, 6, 7, 8, 9, 1, 2, 3, 4]);

console.log(buf1.compare(buf2, 5, 9, 0, 4));
// Imprime: 0
console.log(buf1.compare(buf2, 0, 6, 4));
// Imprime: -1
console.log(buf1.compare(buf2, 5, 6, 5));
// Imprime: 1
```

Se producirá [`ERR_INDEX_OUT_OF_RANGE`] si `targetStart < 0`, `sourceStart < 0`, `targetEnd > target.byteLength`, o `sourceEnd > source.byteLength`.

### buf.copy(target[, targetStart[, sourceStart[, sourceEnd]]])
<!-- YAML
added: v0.1.90
-->

* `target` {Buffer|Uint8Array} Un `Buffer` o [`Uint8Array`] en el cual copiar.
* `targetStart` {integer} El desplazamiento dentro del `target` en el que comenzar a escribir. **Predeterminado:** `0`.
* `sourceStart` {integer} El desplazamiento dentro del `buf` desde el que comenzar a copiar. **Predeterminado:** `0`.
* `sourceEnd` {integer} El desplazamiento dentro de `buf` en el que detener la copia (no incluido). **Predeterminado:** [`buf.length`].
* Devuelve: {integer} El número de bytes copiados.

Copia datos desde una región de `buf` a una región en `target`, incluso si la región de la memoria de `target` se superpone con `buf`.

```js
// Crea dos instancias de `Buffer`.
const buf1 = Buffer.allocUnsafe(26);
const buf2 = Buffer.allocUnsafe(26).fill('!');

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf1[i] = i + 97;
}

// Copia de `buf1` los bytes del 16 al 19 en` buf2` comenzando en el byte 8 de `buf2`
buf1.copy(buf2, 8, 16, 20);

console.log(buf2.toString('ascii', 0, 25));
// Imprime: !!!!!!!!qrst!!!!!!!!!!!!!
```

```js
// Crea un `Buffer` y copia datos desde una región a una región superpuesta
// dentro del mismo `Buffer`.

const buf = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf[i] = i + 97;
}

buf.copy(buf, 0, 4, 10);

console.log(buf.toString());
// Imprime: efghijghijklmnopqrstuvwxyz
```

### buf.entries()
<!-- YAML
added: v1.1.0
-->

* Devuelve: {Iterator}

Crea y devuelve un [iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) de pares `[index, byte]` desde el contenido de `buf`.

```js
// Registra el contenido completo de un `Buffer`.

const buf = Buffer.from('buffer');

for (const pair of buf.entries()) {
  console.log(pair);
}
// Imprime:
//   [0, 98]
//   [1, 117]
//   [2, 102]
//   [3, 102]
//   [4, 101]
//   [5, 114]
```

### buf.equals(otherBuffer)
<!-- YAML
added: v0.11.13
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The arguments can now be `Uint8Array`s.
-->

* `otherBuffer` {Buffer} Un `Buffer` o [`Uint8Array`] con el que comparar el `buf`.
* Devuelve: {boolean}

Devuelve `true` si ambos, `buf` y `otherBuffer`, tienen exactamente los mismos bytes, de lo contrario devuelve `false`.

```js
const buf1 = Buffer.from('ABC');
const buf2 = Buffer.from('414243', 'hex');
const buf3 = Buffer.from('ABCD');

console.log(buf1.equals(buf2));
// Imprime: true
console.log(buf1.equals(buf3));
// Imprime: false
```

### buf.fill(value\[, offset[, end]\]\[, encoding\])
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18790
    description: Negative `end` values throw an `ERR_INDEX_OUT_OF_RANGE` error.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18129
    description: Attempting to fill a non-zero length buffer with a zero length
                 buffer triggers a thrown exception.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/17427
    description: Specifying an invalid string for `value` triggers a thrown
                 exception.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4935
    description: The `encoding` parameter is supported now.
-->

* `value` {string|Buffer|integer} El valor con el que llenar `buf`.
* `offset` {integer} Número de bytes a omitir antes de empezar a llenar `buf`. **Predeterminado:** `0`.
* `end` {integer} Dónde detener el llenado del `buf` (no incluido). **Predeterminado:** [`buf.length`].
* `encoding` {string} La codificación para el `value` si `value` es una cadena. **Predeterminado:** `'utf8'`.
* Devuelve: {Buffer} Una referencia a `buf`.

Llena `buf` con el `value` especificado. Si el `offset` y el `end` no se dan, el `buf` entero se llenará:

```js
// Llena un `Buffer`con el caracter ASCII 'h'.

const b = Buffer.allocUnsafe(50).fill('h');

console.log(b.toString());
// Imprime: hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
```

`value` is coerced to a `uint32` value if it is not a string, `Buffer`, or integer. If the resulting integer is greater than `255` (decimal), `buf` will be filled with `value & 255`.

Si la escritura final de una operación `fill()` falla sobre un caracter multi-byte, entonces solo se escriben los bytes de ese caracter que encajen dentro de `buf`:

```js
// Llena un `Buffer`con un caracter de dos bytes.

console.log(Buffer.allocUnsafe(3).fill('\u0222'));
// Imprime: <Buffer c8 a2 c8>
```

Si `value` contiene caracteres inválidos, se trunca; si no quedan datos de relleno válidos, se produce una excepción:

```js
const buf = Buffer.allocUnsafe(5);

console.log(buf.fill('a'));
// Imprime: <Buffer 61 61 61 61 61>
console.log(buf.fill('aazz', 'hex'));
// Imprime: <Buffer aa aa aa aa aa>
console.log(buf.fill('zz', 'hex'));
// Se produce una excepción.
```

### buf.includes(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v5.3.0
-->

* `value` {string|Buffer|integer} Qué buscar.
* `byteOffset` {integer} Dónde comenzar la búsqueda en `buf`. **Predeterminado:** `0`.
* `encoding` {string} Si `value` es una cadena, esta es su codificación. **Predeterminado:** `'utf8'`.
* Devuelve: {boolean} `true` si `value` se encontró en `buf`, y `false` de lo contrario.

Equivalente a [`buf.indexOf() !== -1`][`buf.indexOf()`].

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.includes('this'));
// Imprime: true
console.log(buf.includes('is'));
// Imprime: true
console.log(buf.includes(Buffer.from('a buffer')));
// Imprime: true
console.log(buf.includes(97));
// Imprime: true (97 is the decimal ASCII value for 'a')
console.log(buf.includes(Buffer.from('a buffer example')));
// Imprime: false
console.log(buf.includes(Buffer.from('a buffer example').slice(0, 8)));
// Imprime: true
console.log(buf.includes('this', 4));
// Imprime: false
```

### buf.indexOf(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v1.5.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
  - version: v5.7.0, v4.4.0
    pr-url: https://github.com/nodejs/node/pull/4803
    description: When `encoding` is being passed, the `byteOffset` parameter
                 is no longer required.
-->

* `value` {string|Buffer|Uint8Array|integer} Qué buscar.
* `byteOffset` {integer} Dónde comenzar la búsqueda en `buf`. **Predeterminado:** `0`.
* `encoding` {string} Si `value` es una cadena, esta es la codificación utilizada para determinar la representación binaria de la cadena que se buscará en `buf`. **Predeterminado:** `'utf8'`.
* Devuelve: {integer} El índice de la primera aparición de `value` en `buf`, o `-1` si `buf` no contiene `value`.

Si `value` es:

  * una cadena, `value` se interpreta de acuerdo a la codificación de caracteres en `enconding`.
  * un `Buffer` o [`Uint8Array`], `value` se utilizará en su totalidad. Para comparar un `Buffer` parcial, utilice [`buf.slice()`].
  * un número, `value` se interpretará como un valor entero de 8-bit sin signo entre `0` y `255`.

```js
const buf = Buffer.from('this is a buffer');

console.log(buf.indexOf('this'));
// Imprime: 0
console.log(buf.indexOf('is'));
// Imprime: 2
console.log(buf.indexOf(Buffer.from('a buffer')));
// Imprime: 8
console.log(buf.indexOf(97));
// Imprime: 8 (97 es el valor ASCII decimal para 'a')
console.log(buf.indexOf(Buffer.from('a buffer example')));
// Imprime: -1
console.log(buf.indexOf(Buffer.from('a buffer example').slice(0, 8)));
// Imprime: 8

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.indexOf('\u03a3', 0, 'utf16le'));
// Imprime: 4
console.log(utf16Buffer.indexOf('\u03a3', -4, 'utf16le'));
// Imprime: 6
```

Si `value` no es una string, un número, o un `Buffer`, este método producirá un `TypeError`. Si `value` es un número, será forzado a ser un valor byte válido, un entero entre 0 y 255.

Si `byteOffset` no es un número, será forzado a ser un número. Si el resultado de forzar es `NaN` o `0`, entonces el buffer entero se buscará. Este comportamiento coincide con [`String#indexOf()`].

```js
const b = Buffer.from('abcdef');

// Pasa un valor que es un número, pero no un byte válido
// Imprime: 2, equivalente a buscar 99 o 'c'
console.log(b.indexOf(99.9));
console.log(b.indexOf(256 + 99));

// Pasa un byteOffset que fuerza a NaN o 0
// Imprime: 1, buscando todo el buffer
console.log(b.indexOf('b', undefined));
console.log(b.indexOf('b', {}));
console.log(b.indexOf('b', null));
console.log(b.indexOf('b', []));
```

Si `value` es una cadena vacía o `Buffer` vacío y `byteOffset` es menor que `buf.length`, se devolverá `byteOffset`. Si `value` está vacío y `byteOffset` al menos es `buf.length`, se devolverá `buf.length`.

### buf.keys()
<!-- YAML
added: v1.1.0
-->

* Devuelve: {Iterator}

Crea y devuelve un [iterador](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) de claves `buf` (índices).

```js
const buf = Buffer.from('buffer');

for (const key of buf.keys()) {
  console.log(key);
}
// Imprime:
//   0
//   1
//   2
//   3
//   4
//   5
```

### buf.lastIndexOf(value\[, byteOffset\]\[, encoding\])
<!-- YAML
added: v6.0.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `value` can now be a `Uint8Array`.
-->

* `value` {string|Buffer|Uint8Array|integer} Qué buscar.
* `byteOffset` {integer} Dónde comenzar la búsqueda en `buf`. **Predeterminado:** [`buf.length`]`- 1`.
* `encoding` {string} Si `value` es una cadena, esta es la codificación utilizada para determinar la representación binaria de la cadena que se buscará en `buf`. **Predeterminado:** `'utf8'`.
* Devuelve: {integer} El índice de la última aparición de `value` en `buf`, o `-1` si `buf` no contiene `value`.

Idéntico a [`buf.indexOf()`], excepto que se encuentra la última aparición de `value`, en lugar de la primera aparición.

```js
const buf = Buffer.from('this buffer is a buffer');

console.log(buf.lastIndexOf('this'));
// Imprime: 0
console.log(buf.lastIndexOf('buffer'));
// Imprime: 17
console.log(buf.lastIndexOf(Buffer.from('buffer')));
// Imprime: 17
console.log(buf.lastIndexOf(97));
// Imprime: 15 (97 es el valor ASCII decimal para 'a')
console.log(buf.lastIndexOf(Buffer.from('yolo')));
// Imprime: -1
console.log(buf.lastIndexOf('buffer', 5));
// Imprime: 5
console.log(buf.lastIndexOf('buffer', 4));
// Imprime: -1

const utf16Buffer = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'utf16le');

console.log(utf16Buffer.lastIndexOf('\u03a3', undefined, 'utf16le'));
// Imprime: 6
console.log(utf16Buffer.lastIndexOf('\u03a3', -5, 'utf16le'));
// Imprime: 4
```

Si `value` no es una cadena, número, o `Buffer`, este método producirá un `TypeError`. Si `value` es un número, se forzará a un valor byte válido, un entero entre 0 y 255.

Si `byteOffset` no es un número, se forzará a un número. Cualquier argumento que fuerce a `NaN`, como `{}` or `undefined`, buscará todo el buffer. Este comportamiento coincide con [`String#lastIndexOf()`].

```js
const b = Buffer.from('abcdef');

// Pasa un valor que es un número, pero no un byte válido
// Imprime: 2, equivalente a buscar 99 o 'c'
console.log(b.lastIndexOf(99.9));
console.log(b.lastIndexOf(256 + 99));

// Pasa un byteOffset que fuerza a NaN
// Imprime: 1, buscando todo el buffer
console.log(b.lastIndexOf('b', undefined));
console.log(b.lastIndexOf('b', {}));

// Pasa un byteOffset que fuerza a 0
// Imprime: -1, equivalent to passing 0
console.log(b.lastIndexOf('b', null));
console.log(b.lastIndexOf('b', []));
```

Si `value` es una cadena vacía o un `Buffer` vacío, se devolverá `byteOffset`.

### buf.length
<!-- YAML
added: v0.1.90
-->

* {integer}

Devuelve la cantidad de memoria asignada para `buf` en bytes. Tenga en cuenta que esto no necesariamente refleja la cantidad de datos "utilizables" dentro de `buf`.

```js
// Crea un `Buffer`y escribe una cadena ASCII más corta en él.

const buf = Buffer.alloc(1234);

console.log(buf.length);
// Imprime: 1234

buf.write('some string', 0, 'ascii');

console.log(buf.length);
// Imprime: 1234
```

Mientras que la propiedad `length` no es inmutable, cambiar el valor de `length` puede resultar en un comportamiento indefinido e incoherente. Las aplicaciones que deseen modificar la longitud de un `Buffer` deberían, por lo tanto, tratar a `length` como solo de lectura y usar [`buf.slice()`] para crear un nuevo `Buffer`.

```js
let buf = Buffer.allocUnsafe(10);

buf.write('abcdefghj', 0, 'ascii');

console.log(buf.length);
// Imprime: 10

buf = buf.slice(0, 5);

console.log(buf.length);
// Imprime: 5
```

### buf.parent
<!-- YAML
deprecated: v8.0.0
-->

> Estabilidad: 0 - Obsoleto: Utilice [`buf.buffer`] en su lugar.

La propiedad `buf.parent` es un alias obsoleto para `buf.buffer`.

### buf.readDoubleBE(offset)
### buf.readDoubleLE(offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 8`.
* Devuelve: {number}

Lee un doble de 64-bit desde `buf` como el `offset` especificado con el formato endian especificado (`readDoubleBE()` devuelve big endian, `readDoubleLE()` devuelve little endian).

```js
const buf = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]);

console.log(buf.readDoubleBE(0));
// Imprime: 8.20788039913184e-304
console.log(buf.readDoubleLE(0));
// Imprime: 5.447603722011605e-270
console.log(buf.readDoubleLE(1));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readFloatBE(offset)
### buf.readFloatLE(offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 4`.
* Devuelve: {number}

Lee un float de 32-bit desde `buf` en el `offset` especificado con el formato endian especificado (`readFloatBE()` devuelve big endian, `readFloatLE()` devuelve little endian).

```js
const buf = Buffer.from([1, 2, 3, 4]);

console.log(buf.readFloatBE(0));
// Imprime: 2.387939260590663e-38
console.log(buf.readFloatLE(0));
// Imprime: 1.539989614439558e-36
console.log(buf.readFloatLE(1));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readInt8(offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 1`.
* Devuelve: {integer}

Lee un entero de 8-bit con signo desde `buf` en el `offset` especificado.

Los enteros leídos desde un `Buffer` se interpretan como valores con signo del complemento de dos.

```js
const buf = Buffer.from([-1, 5]);

console.log(buf.readInt8(0));
// Imprime: -1
console.log(buf.readInt8(1));
// Imprime: 5
console.log(buf.readInt8(2));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readInt16BE(offset)
### buf.readInt16LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 2`.
* Devuelve: {integer}

Lee un entero de 16-bit con signo desde `buf` en el `offset` especificado con el formato endian especificado (`readInt16BE()` devuelve big endian, `readInt16LE()` devuelve little endian).

Los enteros leídos desde un `Buffer` se interpretan como valores con signo del complemento de dos.

```js
const buf = Buffer.from([0, 5]);

console.log(buf.readInt16BE(0));
// Imprime: 5
console.log(buf.readInt16LE(0));
// Imprime: 1280
console.log(buf.readInt16LE(1));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readInt32BE(offset)
### buf.readInt32LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 4`.
* Devuelve: {integer}

Lee un entero de 32-bit desde `buf` en el `offset` especificado con el formato endian especificado (`readInt32BE()` devuelve big endian, `readInt32LE()` devuelve little endian).

Los enteros leídos desde un `Buffer` se interpretan como valores con signo del complemento de dos.

```js
const buf = Buffer.from([0, 0, 0, 5]);

console.log(buf.readInt32BE(0));
// Imprime: 5
console.log(buf.readInt32LE(0));
// Imprime: 83886080
console.log(buf.readInt32LE(1));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readIntBE(offset, byteLength)
### buf.readIntLE(offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a leer. Debe satisfacer `0 < byteLength <= 6`.
* Devuelve: {integer}

Lee el número `byteLength` de bytes desde `buf` en el `offset` especificado e interpreta el resultado como un valor con signo del complemento de dos. Soporta hasta 48 bits de precisión.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readIntLE(0, 6).toString(16));
// Imprime: -546f87a9cbee
console.log(buf.readIntBE(0, 6).toString(16));
// Imprime: 1234567890ab
console.log(buf.readIntBE(1, 6).toString(16));
// Lanza ERR_INDEX_OUT_OF_RANGE
console.log(buf.readIntBE(1, 0).toString(16));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readUInt8(offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 1`.
* Devuelve: {integer}

Lee un entero de 8-bit sin signo desde `buf` en el `offset` especificado.

```js
const buf = Buffer.from([1, -2]);

console.log(buf.readUInt8(0));
// Imprime: 1
console.log(buf.readUInt8(1));
// Imprime: 254
console.log(buf.readUInt8(2));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readUInt16BE(offset)
### buf.readUInt16LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 2`.
* Devuelve: {integer}

Lee un entero de 16-bit sin signo desde `buf` en el `offset` especificado con el formato endian especificado (`readUInt16BE()` devuelve big endian, `readUInt16LE()` devuelve little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56]);

console.log(buf.readUInt16BE(0).toString(16));
// Imprime: 1234
console.log(buf.readUInt16LE(0).toString(16));
// Imprime: 3412
console.log(buf.readUInt16BE(1).toString(16));
// Imprime: 3456
console.log(buf.readUInt16LE(1).toString(16));
// Imprime: 5634
console.log(buf.readUInt16LE(2).toString(16));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readUInt32BE(offset)
### buf.readUInt32LE(offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - 4`.
* Devuelve: {integer}

Lee un entero de 32-bit sin signo desde `buf` en el `offset` especificado con el formato endian especificado (`readUInt32BE()` devuelve big endian, `readUInt32LE()` devuelve little endian).

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78]);

console.log(buf.readUInt32BE(0).toString(16));
// Imprime: 12345678
console.log(buf.readUInt32LE(0).toString(16));
// Imprime: 78563412
console.log(buf.readUInt32LE(1).toString(16));
// Lanza ERR_OUT_OF_RANGE
```

### buf.readUIntBE(offset, byteLength)
### buf.readUIntLE(offset, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `offset` {integer} Número de bytes a omitir antes de comenzar a leer. Debe satisfacer `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a leer. Debe satisfacer `0 < byteLength <= 6`.
* Devuelve: {integer}

Lee el número `byteLength` de bytes desde `buf` en el `offset` especificado e interpreta el resultado como un entero sin signo. Soporta hasta 48 bits de precisión.

```js
const buf = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90, 0xab]);

console.log(buf.readUIntBE(0, 6).toString(16));
// Imprime: 1234567890ab
console.log(buf.readUIntLE(0, 6).toString(16));
// Imprime: ab9078563412
console.log(buf.readUIntBE(1, 6).toString(16));
// Lanza ERR_OUT_OF_RANGE
```

### buf.slice([start[, end]])
<!-- YAML
added: v0.3.0
changes:
  - version: v7.1.0, v6.9.2
    pr-url: https://github.com/nodejs/node/pull/9341
    description: Coercing the offsets to integers now handles values outside
                 the 32-bit integer range properly.
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/9101
    description: All offsets are now coerced to integers before doing any
                 calculations with them.
-->

* `start` {integer} Dónde comenzará el nuevo `Buffer`. **Predeterminado:** `0`.
* `end` {integer} Dónde terminará el nuevo `Buffer` (no incluido). **Predeterminado:** [`buf.length`].
* Devuelve: {Buffer}

Devuelve un nuevo `Buffer` que hace referencia a la misma memoria del original, pero se desplaza y se recorta por los índices `start` y `end`.

La especificación de que `end` es mayor que [`buf.length`] devolverá el mismo resultado que el de `end` igual a [`buf.length`].

La modificación de la porción del nuevo `Buffer` modificará la memoria en el `Buffer` original porque la memoria asignada de los dos objetos se superpone.

```js
// Crea un `Buffer`con el alfabeto ASCII, toma un segmento, y modifica un byte
// desde el `Buffer`original.

const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf1[i] = i + 97;
}

const buf2 = buf1.slice(0, 3);

console.log(buf2.toString('ascii', 0, buf2.length));
// Imprime: abc

buf1[0] = 33;

console.log(buf2.toString('ascii', 0, buf2.length));
// Imprime: !bc
```

La especificación de índices negativos causa que la porción se genere en relación al final de `buf`, en lugar de al inicio.

```js
const buf = Buffer.from('buffer');

console.log(buf.slice(-6, -1).toString());
// Imprime: buffe
// (Equivalente a buf.slice(0, 5))

console.log(buf.slice(-6, -2).toString());
// Imprime: buff
// (Equivalente a buf.slice(0, 4))

console.log(buf.slice(-5, -2).toString());
// Imprime: uff
// (Equivalente a buf.slice(1, 4))
```

### buf.swap16()
<!-- YAML
added: v5.10.0
-->

* Devuelve: {Buffer} Una referencia a `buf`.

Interpreta a `buf` como un arreglo de enteros de 16-bit sin signos y cambia el orden de bytes *in situ*. Produce [`ERR_INVALID_BUFFER_SIZE`] si [`buf.length`] no es un múltiplo de 2.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Imprime: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap16();

console.log(buf1);
// Imprime: <Buffer 02 01 04 03 06 05 08 07>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap16();
// Lanza ERR_INVALID_BUFFER_SIZE
```

One convenient use of `buf.swap16()` is to perform a fast in-place conversion between UTF-16 little-endian and UTF-16 big-endian:

```js
const buf = Buffer.from('This is little-endian UTF-16', 'utf16le');
buf.swap16(); // Convert to big-endian UTF-16 text.
```

### buf.swap32()
<!-- YAML
added: v5.10.0
-->

* Devuelve: {Buffer} Una referencia a `buf`.

Interpreta `buf` como un arreglo de entero de 32-bit sin signos y cambia el orden de bytes *in situ*. Produce [`ERR_INVALID_BUFFER_SIZE`] si [`buf.length`] no es un múltiplo de 4.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Imprime: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap32();

console.log(buf1);
// Imprime: <Buffer 04 03 02 01 08 07 06 05>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap32();
// Lanza ERR_INVALID_BUFFER_SIZE
```

### buf.swap64()
<!-- YAML
added: v6.3.0
-->

* Devuelve: {Buffer} Una referencia a `buf`.

Interpreta a `buf` como un arreglo de números de 64-bit y cambia el orden de los bytes *in situ*. Produce [`ERR_INVALID_BUFFER_SIZE`] si [`buf.length`] no es un múltiplo de 8.

```js
const buf1 = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8]);

console.log(buf1);
// Imprime: <Buffer 01 02 03 04 05 06 07 08>

buf1.swap64();

console.log(buf1);
// Imprime: <Buffer 08 07 06 05 04 03 02 01>

const buf2 = Buffer.from([0x1, 0x2, 0x3]);

buf2.swap64();
// Lanza ERR_INVALID_BUFFER_SIZE
```

Tenga en cuenta que JavaScript no puede codificar enteros de 64-bit. Este método está diseñado para trabajar con floats de 64-bit.

### buf.toJSON()
<!-- YAML
added: v0.9.2
-->

* Devuelve: {Object}

Devuelve una representación JSON de `buf`. [`JSON.stringify()`] implícitamente llama a esta función al convertir en cadena a una instancia de `Buffer`.

```js
const buf = Buffer.from([0x1, 0x2, 0x3, 0x4, 0x5]);
const json = JSON.stringify(buf);

console.log(json);
// Imprime: {"type":"Buffer","data":[1,2,3,4,5]}

const copy = JSON.parse(json, (key, value) => {
  return value && value.type === 'Buffer' ?
    Buffer.from(value.data) :
    value;
});

console.log(copy);
// Imprime: <Buffer 01 02 03 04 05>
```

### buf.toString([encoding[, start[, end]]])
<!-- YAML
added: v0.1.90
-->

* `encoding` {string} La codificación de caracteres a utilizar. **Predeterminado:** `'utf8'`.
* `start` {integer} El desplazamiento de bytes donde comenzar la decodificación. **Predeterminado:** `0`.
* `end` {integer} El desplazamiento de bytes donde detener la codificación (no incluido). **Predeterminado:** [`buf.length`].
* Devuelve: {string}

Decodifica el `buf` en una cadena de acuerdo a la codificación de caracteres especificados en `enconding`. `start` y `end` pueden pasarse para decodificar solo un subconjunto de `buf`.

La máxima longitud de una instancia de cadena (en unidades de código UTF-16) está disponible como [`buffer.constants.MAX_STRING_LENGTH`][].

```js
const buf1 = Buffer.allocUnsafe(26);

for (let i = 0; i < 26; i++) {
  // 97 es el valor ASCII decimal para 'a'
  buf1[i] = i + 97;
}

console.log(buf1.toString('ascii'));
// Imprime: abcdefghijklmnopqrstuvwxyz
console.log(buf1.toString('ascii', 0, 5));
// Imprime: abcde

const buf2 = Buffer.from('tést');

console.log(buf2.toString('hex'));
// Imprime: 74c3a97374
console.log(buf2.toString('utf8', 0, 3));
// Imprime: té
console.log(buf2.toString(undefined, 0, 3));
// Imprime: té
```

### buf.values()
<!-- YAML
added: v1.1.0
-->

* Devuelve: {Iterator}

Crea y devuelve un [iterador](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) para valores de `buf` (bytes). Esta función se llama automáticamente cuando un `Buffer` se utiliza en una declaración `for..of`.

```js
const buf = Buffer.from('buffer');

for (const value of buf.values()) {
  console.log(value);
}
// Imprime:
//   98
//   117
//   102
//   102
//   101
//   114

for (const value of buf) {
  console.log(value);
}
// Imprime:
//   98
//   117
//   102
//   102
//   101
//   114
```

### buf.write(string\[, offset[, length]\]\[, encoding\])
<!-- YAML
added: v0.1.90
-->

* `string` {string} Cadena para escribir al `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir el `string`. **Predeterminado:** `0`.
* `length` {integer} Número de bytes a escribir. **Predeterminado:** `buf.length - offset`.
* `encoding` {string} La codificación de caracteres del `string`. **Predeterminado:** `'utf8'`.
* Devuelve: {integer} Número de bytes escritos.

Escribe el `string` al `buf` de `offset` de acuerdo a la codificación de caracteres en `encoding`. El parámetro de `length` es el número de bytes para escribir. Si `buf` no contiene suficiente espacio para ajustar la cadena entera, solo parte del `string` se escribirá. Sin embargo, no se escribirán caracteres codificados parcialmente.

```js
const buf = Buffer.alloc(256);

const len = buf.write('\u00bd + \u00bc = \u00be', 0);

console.log(`${len} bytes: ${buf.toString('utf8', 0, len)}`);
// Imprime: 12 bytes: ½ + ¼ = ¾
```

### buf.writeDoubleBE(value, offset)
### buf.writeDoubleLE(value, offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 8`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe el `value` al `buf` en el `offset` especificado con el formato endian especificado (`writeDoubleBE()` escribe big endian, `writeDoubleLE()` escribe little endian). `value` *debe* ser un doble de 64-bit válido. El comportamiento es indefinido cuando `value` es cualquier cosa distinta a un doble de 64-bit.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeDoubleBE(123.456, 0);

console.log(buf);
// Prints: <Buffer 40 5e dd 2f 1a 9f be 77>

buf.writeDoubleLE(123.456, 0);

console.log(buf);
// Prints: <Buffer 77 be 9f 1a 2f dd 5e 40>
```

### buf.writeFloatBE(value, offset)
### buf.writeFloatLE(value, offset)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {number} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 4`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe el `value` al `buf` en el `offset` especificado con el formato endian especificado (`writeFloatBE()` escribe big endian, `writeFloatLE()` escribe little endian). `value` *debe* ser un float de 32-bit válido. El comportamiento está indefinido cuando `value` es cualquier cosa distinta a un float de 32-bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeFloatBE(0xcafebabe, 0);

console.log(buf);
// Imprime: <Buffer 4f 4a fe bb>

buf.writeFloatLE(0xcafebabe, 0);

console.log(buf);
// Imprime: <Buffer bb fe 4a 4f>
```

### buf.writeInt8(value, offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 1`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe el `value` al `buff` en el `offset` especificado. `value` *debe* se un entero con signo de 8-bit válido. El comportamiento es indefinido cuando `value` es cualquier cosa distinta a un entero con signo de 8-bit válido.

`value` se interpreta y escribe como un complemento de dos entero con signo.

```js
const buf = Buffer.allocUnsafe(2);

buf.writeInt8(2, 0);
buf.writeInt8(-2, 1);

console.log(buf);
// Imprime: <Buffer 02 fe>
```

### buf.writeInt16BE(value, offset)
### buf.writeInt16LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 2`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe `value` al `buf` en el `offset` especificado con el formato endian especificado (`writeInt16BE()` escribe big endian, `writeInt16LE()` escribe little endian). `value` *debe* se un entero con sigo de 16-bit válido. El comportamiento está indefinido cuando `value` es cualquier otra cosa que un entero con signo de 16-bit.

`value` se interpreta y escribe como un complemento de dos entero con signo.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeInt16BE(0x0102, 0);
buf.writeInt16LE(0x0304, 2);

console.log(buf);
// Imprime: <Buffer 01 02 04 03>
```

### buf.writeInt32BE(value, offset)
### buf.writeInt32LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 4`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe `value` al `buf` en el `offset` especificado con el formato endian especificado (`writeInt32BE()` escribe big endian, `writeInt32LE()` escribe little endian). `value` *debe* se un entero con signo de 32-bit válido. El comportamiento está indefinido cuando `value` es cualquier otro que un entero con signo de 32-bit.

`value` se interpreta y escribe como un complemento de dos entero con signo.

```js
const buf = Buffer.allocUnsafe(8);

buf.writeInt32BE(0x01020304, 0);
buf.writeInt32LE(0x05060708, 4);

console.log(buf);
// Imprime: <Buffer 01 02 03 04 08 07 06 05>
```

### buf.writeIntBE(value, byteLength)
### buf.writeIntLE(value, byteLength)
<!-- YAML
added: v0.11.15
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a escribir. Debe satisfacer `0 < byteLength <= 6`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe los bytes de `byteLength` del `value` al `buf` en el `offset` especificado. Soporta hasta 48 bits de precisión. El comportamiento es indefinido cuando `value` es cualquier cosa distinta a un entero con signo.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer 12 34 56 78 90 ab>

buf.writeIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer ab 90 78 56 34 12>
```

### buf.writeUInt8(value, offset)
<!-- YAML
added: v0.5.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 1`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe el `value` al `buff` en el `offset` especificado. `value` *debe* ser un entero sin signo de 8-bit válido. El comportamiento es indefinido cuando `value` es cualquier cosa distinta a un entero sin signo de 8-bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt8(0x3, 0);
buf.writeUInt8(0x4, 1);
buf.writeUInt8(0x23, 2);
buf.writeUInt8(0x42, 3);

console.log(buf);
// Imprime: <Buffer 03 04 23 42>
```

### buf.writeUInt16BE(value, offset)
### buf.writeUInt16LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 2`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe `value` al `buf` en el `offset` especificado con el formato endian especificado (`writeUInt16BE()` escribe big endian, `writeUInt16LE()` escribe little endian). `value` debe ser un entero sin signo de 16-bit válido. El comportamiento está indefinido cuando `value` es cualquier otra cosa que un entero sin signo de 16-bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt16BE(0xdead, 0);
buf.writeUInt16BE(0xbeef, 2);

console.log(buf);
// Imprime: <Buffer de ad be ef>

buf.writeUInt16LE(0xdead, 0);
buf.writeUInt16LE(0xbeef, 2);

console.log(buf);
// Imprime: <Buffer ad de ef be>
```

### buf.writeUInt32BE(value, offset)
### buf.writeUInt32LE(value, offset)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - 4`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe `value` al `buf` en el `offset` especificado con el formato endian especificado (`writeUInt32BE()` escribe big endian, `writeUInt32LE()` escribe little endian). `value` debe ser un entero sin signo de 32-bit válido. El comportamiento está indefinido cuando `value` es cualquier otra casa que un entero sin signo de 32-bit.

```js
const buf = Buffer.allocUnsafe(4);

buf.writeUInt32BE(0xfeedface, 0);

console.log(buf);
// Escribe: <Buffer fe ed fa ce>

buf.writeUInt32LE(0xfeedface, 0);

console.log(buf);
// Escribe: <Buffer ce fa ed fe>
```

### buf.writeUIntBE(value, byteLength)
### buf.writeUIntLE(value, byteLength)
<!-- YAML
added: v0.5.5
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18395
    description: Removed `noAssert` and no implicit coercion of the offset
                 and `byteLength` to `uint32` anymore.
-->

* `value` {integer} Número a ser escrito en `buf`.
* `offset` {integer} Número de bytes a omitir antes de comenzar a escribir. Debe satisfacer `0 <= offset <= buf.length - byteLength`.
* `byteLength` {integer} Número de bytes a escribir. Debe satisfacer `0 < byteLength <= 6`.
* Devuelve: {integer} `offset` más el número de bytes escritos.

Escribe los bytes de `byteLength` del `value` al `buf` en el `offset` especificado. Soporta hasta 48 bits de precisión. El comportamiento es indefinido cuando `value` es cualquier cosa distinta a un entero sin signo.

```js
const buf = Buffer.allocUnsafe(6);

buf.writeUIntBE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer 12 34 56 78 90 ab>

buf.writeUIntLE(0x1234567890ab, 0, 6);

console.log(buf);
// Imprime: <Buffer ab 90 78 56 34 12>
```

## buffer.INSPECT_MAX_BYTES
<!-- YAML
added: v0.5.4
-->

* {integer} **Predeterminado:** `50`

Devuelve el número máximo de bytes que serán devueltos cuando se llama a `buf.inspect()`. Esto puede ser reemplazado por módulos de usuario. Ver [`util.inspect()`] para más detalles sobre el comportamiento de `buf.inspect()`.

Tenga en cuenta que esto es una propiedad sobre el módulo de `buffer` devuelto por `require('buffer')`, no sobre el `Buffer` global o una instancia de `Buffer`.

## buffer.kMaxLength
<!-- YAML
added: v3.0.0
-->

* {integer} El tamaño más grande asignado para una sola instancia de `Buffer`.

Un alias para [`buffer.constants.MAX_LENGTH`][].

Tenga en cuenta que esto es una propiedad sobre el módulo de `buffer` devuelto por `require('buffer')`, no sobre el `Buffer` global o una instancia de `Buffer`.

## buffer.transcode(source, fromEnc, toEnc)
<!-- YAML
added: v7.1.0
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10236
    description: The `source` parameter can now be a `Uint8Array`.
-->

* `source` {Buffer|Uint8Array} Una instancia de `Buffer` o `Uint8Array`.
* `fromEnc` {string} La codificación actual.
* `toEnc` {string} Para apuntar a la codificación.

Re-codifica la instancia de `Buffer` o `Uint8Array` dada desde una codificación de caracteres a otra. Devuelve una nueva instancia de `Buffer`.

Lanza `fromEnc` o `toEnc` si se especifican codificaciones de caracteres inválidas o si la conversión desde `fromEnc` a `toEnc` no está permitida.

Encodings supported by `buffer.transcode()` are: `'ascii'`, `'utf8'`, `'utf16le'`, `'ucs2'`, `'latin1'`, and `'binary'`.

El proceso de transcodificación utilizará caracteres de sustitución si una secuencia de bytes dada no puede representarse adecuadamente en la codificación objetivo. Por ejemplo:

```js
const buffer = require('buffer');

const newBuf = buffer.transcode(Buffer.from('€'), 'utf8', 'ascii');
console.log(newBuf.toString('ascii'));
// Imprime: '?'
```

Debido a que el signo del Euro (`€`) no es representable en US-ASCII, se remplaza con `?` en el `Buffer` transcodificado.

Tenga en cuenta que esto es una propiedad sobre el módulo de `buffer` devuelto por `require('buffer')`, no sobre el `Buffer` global o una instancia de `Buffer`.

## Clase: SlowBuffer
<!-- YAML
deprecated: v6.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.allocUnsafeSlow()`] es su lugar.

Devuelve un `Buffer` sin agrupar.

Para evitar la sobrecarga de la recolección de basura al crear muchas instancias de `Buffer` asignadas individualmente, las asignaciones predeterminadas debajo de 4KB se recortan desde un único objeto asignado más grande.

En el caso donde un desarrollador pueda necesitar retener una pequeña porción de la memoria desde un grupo por una cantidad indeterminada de tiempo, puede ser apropiado crear una instancia de `Buffer` sin agrupar utilizando `SlowBuffer` y luego copiar los bits relevantes.

```js
// Need to keep around a few small chunks of memory
const store = [];

socket.on('readable', () => {
  let data;
  while (null !== (data = readable.read())) {
    // Allocate for retained data
    const sb = SlowBuffer(10);

    // Copy the data into the new allocation
    data.copy(sb, 0, 0, 10);

    store.push(sb);
  }
});
```

El uso de `SlowBuffer` debe emplearse solo como el último recurso *después* de que un desarrollador haya observado retención indebida de memoria en sus aplicaciones.

### nuevo SlowBuffer(size)
<!-- YAML
deprecated: v6.0.0
-->

> Estabilidad: 0 - Desaprobado: Utilice [`Buffer.allocUnsafeSlow()`] en su lugar.

* `size` {integer} La longitud deseada del nuevo `SlowBuffer`.

Asigna un nuevo `Buffer` de `size` bytes. Si `size` es más largo que [`buffer.constants.MAX_LENGTH`] o más pequeño que 0, se lanza [`ERR_INVALID_OPT_VALUE`]. Un `Buffer` de longitud cero se crea si `size` es 0.

La memoria subyacente para instancias de `SlowBuffer` están *sin inicializar*. Los contenidos de un `SlowBuffer` creado recientemente son desconocidos y pueden contener datos confidenciales. Utilice [`buf.fill(0)`][`buf.fill()`] para inicializar un `SlowBuffer` con ceros.

```js
const { SlowBuffer } = require('buffer');

const buf = new SlowBuffer(5);

console.log(buf);
// Imprime: (los contenidos pueden variar): <Buffer 78 e0 82 02 01>

buf.fill(0);

console.log(buf);
// Imprime: <Buffer 00 00 00 00 00>
```

## Constantes de Buffer
<!-- YAML
added: v8.2.0
-->

Tenga en cuenta que `buffer.constants` es una propiedad sobre el módulo de `buffer` devuelto por `require('buffer')`, no sobre el `Buffer` global o una instancia de `Buffer`.

### buffer.constants.MAX_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} El tamaño más grande asignado para una sola instancia de `Buffer`.

En arquitecturas de 32-bit, este valor es `(2^30)-1` (~1GB). En arquitecturas de 64-bit, este valor es `(2^31)-1` (~2GB).

Este valor también está disponible como [`buffer.kMaxLength`][].

### buffer.constants.MAX_STRING_LENGTH
<!-- YAML
added: v8.2.0
-->

* {integer} La longitud más larga asignada para una sola instancia de `string`.

Representa la `length` más larga que un `string` primitivo pueda tener, contada en unidades de código UTF-16.

Este valor debe depender del motor JS que se esté utilizando.
