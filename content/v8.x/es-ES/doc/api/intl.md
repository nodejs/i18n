# Soporte de Internacionalización

<!--introduced_in=v8.2.0-->

Node.js tiene muchas funciones que facilitan la escritura de programas internacionalizados. Algunas de ellas son:

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
- [RegExp Unicode Property Escapes](https://github.com/tc39/proposal-regexp-unicode-property-escapes)

Node.js (y su motor V8 subyacente) utiliza [ICU](http://icu-project.org/) para implementar estas funciones en código C/C++ nativo. Sin embargo, algunas de ellas requieren un archivo de datos de ICU muy grande para soportar todas las locales del mundo. Ya que se espera que la mayoría de los usuarios de Node.js hagan uso solo de una porción pequeña de la funcionalidad de ICU, por defecto, nada más un subconjunto de la totalidad de los datos de ICU es proporcionada por Node.js. Se proporcionan varias opciones para la personalización y expansión del conjunto de datos de ICU en la compilación o ejecución de Node.js.

## Opciones para la compilación de Node.js

Para controlar la manera en la que se utiliza ICU en Node.js, se encuentran disponibles cuatro opciones de `configure` (configuración) durante la compilación. Detalles adicionales sobre cómo compilar Node.js están documentados en [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none` / `--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (por defecto)
- `--with-intl=full-icu`

Un resumen general de las funciones de Node.js y JavaScript disponibles para cada opción de `configure`:

|                                                                                                     | `none`                            | `system-icu`                     | `small-icu`              | `full-icu` |
| --------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- | ------------------------ | ---------- |
| [`String.prototype.normalize()`][]                                                                  | ninguna (la función no es op)     | completa                         | completa                 | completa   |
| `String.prototype.to*Case()`                                                                        | completa                          | completa                         | completa                 | completa   |
| [`Intl`][]                                                                                          | inexistente (el objeto no existe) | parcial/completa (depende de OS) | parcial (solo en inglés) | completa   |
| [`String.prototype.localeCompare()`][]                                                              | parcial (no considera el locale)  | completa                         | completa                 | completa   |
| `String.prototype.toLocale*Case()`                                                                  | parcial (no considera el locale)  | completa                         | completa                 | completa   |
| [`Number.prototype.toLocaleString()`][]                                                             | parcial (no considera el locale)  | parcial/completa (depende de OS) | parcial (solo en inglés) | completa   |
| `Date.prototype.toLocale*String()`                                                                  | parcial (no considera el locale)  | parcial/completa (depende de OS) | parcial (solo en inglés) | completa   |
| [WHATWG URL Parser](url.html#url_the_whatwg_url_api)                                                | partial (no IDN support)          | completa                         | completa                 | completa   |
| [`require('buffer').transcode()`][]                                                                 | none (function does not exist)    | completa                         | completa                 | completa   |
| [REPL](repl.html#repl_repl)                                                                         | partial (inaccurate line editing) | completa                         | completa                 | completa   |
| [`require('util').TextDecoder`][]                                                                   | partial (basic encodings support) | parcial/completa (depende de OS) | partial (Unicode-only)   | completa   |
| [RegExp Unicode Property Escapes](https://github.com/tc39/proposal-regexp-unicode-property-escapes) | none (invalid RegExp error)       | completa                         | completa                 | completa   |

*Nota*: La designación "(no considera el locale)" denota que la función efectúa su operación como la versión no-`Locale` de la función, si existe una. Por ejemplo, en el modo `none`, la operación de `Date.prototype.toLocaleString()` es idéntica a la de `Date.prototype.toString()`.

### Desactivar todas las funciones de internacionalización (`none`)

Si se escoge esta opción, la mayoría de las funcionalidades de internacionalización mencionadas anteriormente no estará **disponibles** en el binario `node` resultante.

### Compilar con una ICU pre-instalada (`system-icu`)

Node.js puede enlazar contrariando una compilación de ICU ya instalada en el sistema. De hecho, la mayor parte de las distribuciones de Linux ya vienen con ICU instalada, y esta opción haría posible la reutilización del mismo conjunto de datos usado por otros componentes en el sistema operativo.

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

Este modo proporciona un buen balance entre funciones y tamaño binario, y es el comportamiento predeterminado si no se pasa ninguna bandera `--with-intl`. Los binarios oficiales también son compilados en este modo.

#### Proporcionar datos de ICU en tiempo de ejecución

Si la opción `small-icu` es utilizada, aún es posible proporcionar datos locales adicionales en tiempo de ejecución para que los métodos JS funcionen para todos los locales de ICU. Asumiendo que el archivo de datos está almacenado en `/some/directory`, este puede hacerse disponible para ICU a través de:

* La variable de entorno [`NODE_ICU_DATA`][]:

  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

* El parámetro CLI de [`--icu-data-dir`][]:

  ```shell
  node --icu-data-dir=/some/directory
  ```

(Si ambos están especificados, el parámetro CLI de `--icu-data-dir` tendrá precedencia.)

ICU es capaz de encontrar y cargar automáticamente una variedad de formatos de datos, pero los datos deben ser apropiados para la versión de ICU, y el archivo debe estar nombrado de manera correcta. El nombre más común para el archivo de datos es `icudt5X[bl].dat`, donde `5X` denota la versión de ICU prevista, y `b` o `l` indica la "endianisidad" del sistema. Revise el artículo ["Datos de ICU"](http://userguide.icu-project.org/icudata) en la Guía de Usuario de ICU para otros formatos soportados y más detalles sobre los datos de ICU en general.

El módulo de npm [full-icu](https://www.npmjs.com/package/full-icu) puede simplificar enormemente la instalación de los datos de ICU, detectando la versión de ICU del ejecutable de `node` en ejecución y descargando el archivo de datos apropiado. Tras la instalación del módulo a través de `npm i full-icu`, el archivo de datos se encontrará disponible en `./node_modules/full-icu`. Esta ruta puede ser pasada a `NODE_ICU_DATA` o `--icu-data-dir`, como se muestra arriba, para habilitar el soporte completo de `Intl`.

### Incorpore toda la ICU (`full-icu`)

Esta opción hace que el enlace binario contra ICU resultante sea estático e incluya un conjunto completo de datos de ICU. Un binario creado de esta manera no tiene otras dependencias externas y soporta todos los locales, pero podría ser bastante grande. Consulte [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) para ver cómo compilar un binario utilizando este modo.

## Detección del soporte de internacionalización

Para verificar que ICU se encuentre habilitada (`system-icu`, `small-icu`, o `full-icu`), debería ser suficiente con verificar la existencia de `Intl`:

```js
const hasICU = typeof Intl === 'object';
```

Alternativamente, también funciona revisar en busca de `process.versions.icu`, una propiedad solo definida cuando ICU se encuentra habilitada:

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

Para pruebas más detalladas para el soporte de `Intl`, los siguientes recursos pueden resultar útiles:

- [btest402](https://github.com/srl295/btest402): Generalmente utilizado para comprobar si el Node.js con soporte de `Intl` está compilado correctamente.
- [Test262](https://github.com/tc39/test262/tree/master/test/intl402): La suite de pruebas oficial de la conformidad con ECMAScript incluye una sección dedicada a ECMA-402.
