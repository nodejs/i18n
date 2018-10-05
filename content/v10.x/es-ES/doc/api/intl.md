# Soporte de internacionalización

<!--introduced_in=v8.2.0-->

<!-- type=misc -->

Node.js tiene muchas funcionalidades que hacen más fácil el desarrollo de programas internacionalizados. Algunos de ellos son:

- Funcionalidades susceptibles a la configuración regional o que soportan caracteres Unicode en [ECMAScript Language Specification](https://tc39.github.io/ecma262/): 
    - [`String.prototype.normalize()`][]
    - [`String.prototype.toLowerCase()`][]
    - [`String.prototype.toUpperCase()`][]
- Todas las funcionalidades descritas en [ECMAScript Internationalization API Specification](https://tc39.github.io/ecma402/) (aka ECMA-402): 
    - [`Intl`][] object
    - Métodos susceptibles a la configuración regional como [`String.prototype.localeCompare()`][] y [`Date.prototype.toLocaleString()`][]
- Soporte de [WHATWG URL parser](url.html#url_the_whatwg_url_api)'s [internationalized domain names](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDNs)
- [`require('buffer').transcode()`][]
- Una edición de linea mas precisa en [REPL](repl.html#repl_repl)
- [`require('util').TextDecoder`][]
- [`RegExp` Unicode Property Escapes][]

Node.js (y su subyacente motor V8 JavaScript) usan [ICU](http://icu-project.org/) para implementar estas funcionalidades en código C/C++ nativo. Sin embargo, algunos de ellos requieren un archivo de datos ICU muy grande para soportar todos los locales del mundo. Dado que se espera que la mayoría de los usuarios de Node.js harán uso de sólo una pequeña porción de la funcionalidad de ICU, sólo un subconjunto de todo el conjunto de datos de ICU es proporcionado por Node.js por defecto. Se proporcionan varias opciones para personalizar y expandir el conjunto de datos de ICU cuando se construye o se ejecuta Node.js.

## Opciones para la construcción de Node.js

Para controlar cómo se usa ICU en Node.js, están disponibles cuatro opciones de `configure` durante la compilación. Detalles adicionales sobre cómo compilar Node.js están documentados en [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none` / `--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (por defecto)
- `--with-intl=full-icu`

Un resumen de las funcionalidades de Node.js y JavaScript para cada opción de `configure`:

|                                                      | `none`                            | `system-icu`                 | `small-icu`            | `full-icu` |
| ---------------------------------------------------- | --------------------------------- | ---------------------------- | ---------------------- | ---------- |
| [`String.prototype.normalize()`][]                   | none (function is no-op)          | full                         | full                   | full       |
| `String.prototype.to*Case()`                         | full                              | full                         | full                   | full       |
| [`Intl`][]                                           | none (object does not exist)      | partial/full (depends on OS) | partial (English-only) | full       |
| [`String.prototype.localeCompare()`][]               | partial (not locale-aware)        | full                         | full                   | full       |
| `String.prototype.toLocale*Case()`                   | partial (not locale-aware)        | full                         | full                   | full       |
| [`Number.prototype.toLocaleString()`][]              | partial (not locale-aware)        | partial/full (depends on OS) | partial (English-only) | full       |
| `Date.prototype.toLocale*String()`                   | partial (not locale-aware)        | partial/full (depends on OS) | partial (English-only) | full       |
| [WHATWG URL Parser](url.html#url_the_whatwg_url_api) | partial (no IDN support)          | full                         | full                   | full       |
| [`require('buffer').transcode()`][]                  | none (function does not exist)    | full                         | full                   | full       |
| [REPL](repl.html#repl_repl)                          | partial (inaccurate line editing) | full                         | full                   | full       |
| [`require('util').TextDecoder`][]                    | partial (basic encodings support) | partial/full (depends on OS) | partial (Unicode-only) | full       |
| [`RegExp` Unicode Property Escapes][]                | none (invalid `RegExp` error)     | full                         | full                   | full       |

The "(not locale-aware)" designation denotes that the function carries out its operation just like the non-`Locale` version of the function, if one exists. Por ejemplo, bajo el modo `none`, la operación de `Date.prototype.toLocaleString()` es idéntica a la de `Date.prototype.toString()`.

### Desactivar todas las funcionalidades de internacionalización (`none`)

Si se escoge esta opción, la mayoría de las funcionalidades de internacionalización mencionadas anteriormente no estará **disponibles** en el binario `node` resultante.

### Build with a pre-installed ICU (`system-icu`)

Node.js can link against an ICU build already installed on the system. De hecho, la mayoría de las distribuciones de Linux ya vienen con ICU instalado, y esta opción haría posible reutilizar el mismo conjunto de datos utilizado por otros componentes en el SO.

Las funcionalidades que sólo requieren a la biblioteca de ICU, como [`String.prototype.normalize()`][] y el [analizador de URL WHATWG](url.html#url_the_whatwg_url_api), están completamente soportadas bajo `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Incorporar un conjunto limitado de datos de ICU (`small-icu`)

This option makes the resulting binary link against the ICU library statically, and includes a subset of ICU data (typically only the English locale) within the `node` executable.

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

#### Providing ICU data at runtime

If the `small-icu` option is used, one can still provide additional locale data at runtime so that the JS methods would work for all ICU locales. Asumiendo que el archivo de datos está almacenado en `/some/directory`, puede hacerse disponible para ICU a través de:

- La variable de entorno [`NODE_ICU_DATA`][]:
    
    ```shell
    env NODE_ICU_DATA=/some/directory node
    ```

- El parámetro CLI de [`--icu-data-dir`][]:
    
    ```shell
    node --icu-data-dir=/some/directory
    ```

(Si ambos están especificados, el parámetro CLI de `--icu-data-dir` toma precedencia.)

ICU es capaz de encontrar y cargar automáticamente una variedad de formatos de datos, pero los datos deben ser apropiados para la versión de ICU, y el archivo correctamente nombrado. The most common name for the data file is `icudt5X[bl].dat`, where `5X` denotes the intended ICU version, and `b` or `l` indicates the system's endianness. Verifique el artículo ["Datos ICU"](http://userguide.icu-project.org/icudata) en la Guía de Usuario de ICU para otros formatos soportados y para más detalles acerca de los datos ICU en general.

The [full-icu](https://www.npmjs.com/package/full-icu) npm module can greatly simplify ICU data installation by detecting the ICU version of the running `node` executable and downloading the appropriate data file. Después de instalar el módulo a través de `npm i full-icu`, el archivo de datos estará disponible en `./node_modules/full-icu`. Esta ruta puede entonces ser pasada a `NODE_ICU_DATA` o a `--icu-data-dir` como se muestra arriba, para habilitar soporte completo de `Intl`.

### Embed the entire ICU (`full-icu`)

This option makes the resulting binary link against ICU statically and include a full set of ICU data. A binary created this way has no further external dependencies and supports all locales, but might be rather large. Vea [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) para cómo compilar un binario utilizando este modo.

## Detección de soporte de internacionalización

Para verificar que ICU esté habilitada del todo (`system-icu`, `small-icu` o `full-icu`), simplemente verificar la existencia de `Intl` debería ser suficiente:

```js
const hasICU = typeof Intl === 'object';
```

Alternativamente, verificar el `process.versions.icu`, una propiedad definida sólo cuando ICU está habilitado, también funciona:

```js
const hasICU = typeof process.versions.icu === 'string';
```

To check for support for a non-English locale (i.e. `full-icu` or `system-icu`), [`Intl.DateTimeFormat`][] can be a good distinguishing factor:

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

- [btest402](https://github.com/srl295/btest402): Utilizado generalmente para comprobar si Node.js con el soporte de `Intl` está construido correctamente.
- [Test262](https://github.com/tc39/test262/tree/master/test/intl402): Prueba oficial de conformidad de ECMAScript incluye una sección dedicada a ECMA-402.