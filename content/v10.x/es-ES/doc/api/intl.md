# Soporte de Internacionalización

<!--introduced_in=v8.2.0-->
<!-- type=misc -->

Node.js tiene muchas funcionalidades que hacen más fácil el desarrollo de programas internacionalizados. Algunos de ellos son:

- Funciones sensibles a la configuración local o que toman en cuenta la codificación Unicode en la [Especificación de Lenguaje ECMAScript](https://tc39.github.io/ecma262/):
  - [`String.prototype.normalize()`][]
  - [`String.prototype.toLowerCase()`][]
  - [`String.prototype.toUpperCase()`][]
- Todas las funciones descritas en la [Especificación de la API de Internacionalización de ECMAScript](https://tc39.github.io/ecma402/) (también conocida como ECMA-402):
  - Objeto [`Intl`][]
  - Métodos sensibles a la configuración local como [`String.prototype.localeCompare()`][] y [`Date.prototype.toLocaleString()`][]
- Soporte de [WHATWG URL parser](url.html#url_the_whatwg_url_api)'s [internationalized domain names](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDNs)
- [`require('buffer').transcode()`][]
- Una edición de linea mas precisa en [REPL](repl.html#repl_repl)
- [`require('util').TextDecoder`][]
- [`RegExp` Unicode Property Escapes][]

Node.js (y su subyacente motor V8 JavaScript) usan [ICU](http://site.icu-project.org/) para implementar estas funcionalidades en código C/C++ nativo. Sin embargo, algunos de ellos requieren un archivo de datos ICU muy grande para soportar todos los locales del mundo. Dado que se espera que la mayoría de los usuarios de Node.js harán uso de sólo una pequeña porción de la funcionalidad de ICU, sólo un subconjunto de todo el conjunto de datos de ICU es proporcionado por Node.js por defecto. Se proporcionan varias opciones para personalizar y expandir el conjunto de datos de ICU cuando se construye o se ejecuta Node.js.

## Opciones para la compilación de Node.js

Para controlar cómo se usa ICU en Node.js, están disponibles cuatro opciones de `configure` durante la compilación. Detalles adicionales sobre cómo compilar Node.js están documentados en [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none`/`--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (por defecto)
- `--with-intl=full-icu`

Un resumen de las funcionalidades de Node.js y JavaScript para cada opción de `configure`:

|                                                      | `none`                            | `system-icu`                     | `small-icu`              | `full-icu` |
| ---------------------------------------------------- | --------------------------------- | -------------------------------- | ------------------------ | ---------- |
| [`String.prototype.normalize()`][]                   | ninguna (la función no es op)     | completa                         | completa                 | completa   |
| `String.prototype.to*Case()`                         | completa                          | completa                         | completa                 | completa   |
| [`Intl`][]                                           | inexistente (el objeto no existe) | parcial/completa (depende de OS) | parcial (solo en inglés) | completa   |
| [`String.prototype.localeCompare()`][]               | parcial (no considera el locale)  | completa                         | completa                 | completa   |
| `String.prototype.toLocale*Case()`                   | parcial (no considera el locale)  | completa                         | completa                 | completa   |
| [`Number.prototype.toLocaleString()`][]              | parcial (no considera el locale)  | parcial/completa (depende de OS) | parcial (solo en inglés) | completa   |
| `Date.prototype.toLocale*String()`                   | parcial (no considera el locale)  | parcial/completa (depende de OS) | parcial (solo en inglés) | completa   |
| [WHATWG URL Parser](url.html#url_the_whatwg_url_api) | partial (no IDN support)          | completa                         | completa                 | completa   |
| [`require('buffer').transcode()`][]                  | none (function does not exist)    | completa                         | completa                 | completa   |
| [REPL](repl.html#repl_repl)                          | partial (inaccurate line editing) | completa                         | completa                 | completa   |
| [`require('util').TextDecoder`][]                    | partial (basic encodings support) | parcial/completa (depende de OS) | partial (Unicode-only)   | completa   |
| [`RegExp` Unicode Property Escapes][]                | none (invalid `RegExp` error)     | completa                         | completa                 | completa   |

The "(not locale-aware)" designation denotes that the function carries out its operation just like the non-`Locale` version of the function, if one exists. Por ejemplo, bajo el modo `none`, la operación de `Date.prototype.toLocaleString()` es idéntica a la de `Date.prototype.toString()`.

### Desactivar todas las funciones de internacionalización (`none`)

Si se escoge esta opción, la mayoría de las funcionalidades de internacionalización mencionadas anteriormente no estará **disponibles** en el binario `node` resultante.

### Compilar con una ICU pre-instalada (`system-icu`)

Node.js puede enlazar contrariando una compilación de ICU ya instalada en el sistema. De hecho, la mayoría de las distribuciones de Linux ya vienen con ICU instalado, y esta opción haría posible reutilizar el mismo conjunto de datos utilizado por otros componentes en el SO.

Las funcionalidades que sólo requieren a la biblioteca de ICU, como [`String.prototype.normalize()`][] y el [analizador de URL WHATWG](url.html#url_the_whatwg_url_api), están completamente soportadas bajo `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Incorporar un conjunto limitado de datos de ICU (`small-icu`)

Esta opción hace que el enlace binario contra la librería de ICU resultante sea estático e incluya un subconjunto de datos de ICU (típicamente, solo la locale de inglés) dentro del ejecutable de `node`.

Las funcionalidades que sólo requieren a la biblioteca de ICU, como [`String.prototype.normalize()`][] y el [analizador de URL WHATWG](url.html#url_the_whatwg_url_api), están completamente soportadas bajo `small-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][], generally only work with the English locale:

```js
const january = new Date(9e8);
const english = new Intl.DateTimeFormat('en', { month: 'long' });
const spanish = new Intl.DateTimeFormat('es', { month: 'long' });

console.log(english.format(january));
// Imprime "January"
console.log(spanish.format(january));
// Imprime "M01" en small-icu
// Debería imprimir "enero"
```

Este modo proporciona un buen balance entre las funcionalidades y el tamaño binario, y es el comportamiento predeterminado si no se pasa ninguna bandera de `--with-intl`. Los binarios oficiales también están construidos en este modo.

#### Proporcionar datos de ICU en tiempo de ejecución

Si la opción `small-icu` es utilizada, aún es posible proporcionar datos locales adicionales en tiempo de ejecución para que los métodos JS funcionen para todos los locales de ICU. Asumiendo que el archivo de datos está almacenado en `/some/directory`, puede hacerse disponible para ICU a través de:

* La variable de entorno [`NODE_ICU_DATA`][]:

  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

* El parámetro CLI de [`--icu-data-dir`][]:

  ```shell
  node --icu-data-dir=/some/directory
  ```

(Si ambos están especificados, el parámetro CLI de `--icu-data-dir` toma precedencia.)

ICU es capaz de encontrar y cargar automáticamente una variedad de formatos de datos, pero los datos deben ser apropiados para la versión de ICU, y el archivo correctamente nombrado. El nombre más común para el archivo de datos es `icudt6X[bl].dat`, donde `6X` denota la versión de ICU prevista, y `b` o `l` indica la "endianisidad" del sistema. Verifique el artículo ["Datos ICU"](http://userguide.icu-project.org/icudata) en la Guía de Usuario de ICU para otros formatos soportados y para más detalles acerca de los datos ICU en general.

El módulo de npm [full-icu](https://www.npmjs.com/package/full-icu) puede simplificar enormemente la instalación de los datos de ICU, detectando la versión de ICU del ejecutable de `node` en ejecución y descargando el archivo de datos apropiado. Después de instalar el módulo a través de `npm i full-icu`, el archivo de datos estará disponible en `./node_modules/full-icu`. Esta ruta puede entonces ser pasada a `NODE_ICU_DATA` o a `--icu-data-dir` como se muestra arriba, para habilitar soporte completo de `Intl`.

### Incorpore toda la ICU (`full-icu`)

Esta opción hace que el enlace binario contra ICU resultante sea estático e incluya un conjunto completo de datos de ICU. Un binario creado de esta manera no tiene otras dependencias externas y soporta todos los locales, pero podría ser bastante grande. Vea [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) para cómo compilar un binario utilizando este modo.

## Detección del soporte de internacionalización

Para verificar que ICU esté habilitada del todo (`system-icu`, `small-icu` o `full-icu`), simplemente verificar la existencia de `Intl` debería ser suficiente:

```js
const hasICU = typeof Intl === 'object';
```

Alternativamente, verificar el `process.versions.icu`, una propiedad definida sólo cuando ICU está habilitado, también funciona:

```js
const hasICU = typeof process.versions.icu === 'string';
```

Para revisar en busca de soporte para una locale distinta a la de inglés (es decir, `full-icu` o `system-icu`), [`Intl.DateTimeFormat`][] puede ser un buen factor distintivo:

```js
const hasFullICU = (() => {
  try {
    const january = new Date(9e8);
    const spanish = new Intl.DateTimeFormat('es', { month: 'long' });
    return spanish.format(january) === 'enero';
  } catch (err) {
    return false;
  }
})();
```

Para pruebas más detalladas para soporte de `Intl`, las siguientes fuentes pueden ser útiles:

- [btest402](https://github.com/srl295/btest402): Generalmente utilizado para comprobar si el Node.js con soporte de `Intl` está compilado correctamente.
- [Test262](https://github.com/tc39/test262/tree/master/test/intl402): La suite de pruebas oficial de la conformidad con ECMAScript incluye una sección dedicada a ECMA-402.
