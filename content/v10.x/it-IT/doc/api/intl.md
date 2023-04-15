# Supporto all'Internazionalizzazione

<!--introduced_in=v8.2.0-->

<!-- type=misc -->

Node.js has many features that make it easier to write internationalized programs. Alcune di esse sono:

- Locale-sensitive or Unicode-aware functions in the [ECMAScript Language Specification](https://tc39.github.io/ecma262/): 
  - [`String.prototype.normalize()`][]
  - [`String.prototype.toLowerCase()`][]
  - [`String.prototype.toUpperCase()`][]
- All functionality described in the [ECMAScript Internationalization API Specification](https://tc39.github.io/ecma402/) (aka ECMA-402): 
  - [`Intl`][] object
  - Locale-sensitive methods like [`String.prototype.localeCompare()`][] and [`Date.prototype.toLocaleString()`][]
- Il supporto dei [nomi di dominio internazionalizzati](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDN) del [parser WHATWG URL](url.html#url_the_whatwg_url_api)
- [`require('buffer').transcode()`][]
- Editing della riga [REPL](repl.html#repl_repl) più accurato
- [`require('util').TextDecoder`][]
- [Escape di Proprietà Unicode di `RegExp`][]

Node.js (and its underlying V8 engine) uses [ICU](http://site.icu-project.org/) to implement these features in native C/C++ code. However, some of them require a very large ICU data file in order to support all locales of the world. Because it is expected that most Node.js users will make use of only a small portion of ICU functionality, only a subset of the full ICU data set is provided by Node.js by default. Several options are provided for customizing and expanding the ICU data set either when building or running Node.js.

## Opzioni per la costruzione di Node.js

To control how ICU is used in Node.js, four `configure` options are available during compilation. Additional details on how to compile Node.js are documented in [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none`/`--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (default)
- `--with-intl=full-icu`

An overview of available Node.js and JavaScript features for each `configure` option:

|                                                      | `none`                                    | `system-icu`                       | `small-icu`             | `full-icu` |
| ---------------------------------------------------- | ----------------------------------------- | ---------------------------------- | ----------------------- | ---------- |
| [`String.prototype.normalize()`][]                   | nessuno (la funzione è no-op)             | completo                           | completo                | completo   |
| `String.prototype.to*Case()`                         | completo                                  | completo                           | completo                | completo   |
| [`Intl`][]                                           | nessuno (l'object non esiste)             | parziale/completo (dipende dal SO) | parziale (solo Inglese) | completo   |
| [`String.prototype.localeCompare()`][]               | parziale (non locale-aware)               | completo                           | completo                | completo   |
| `String.prototype.toLocale*Case()`                   | parziale (non locale-aware)               | completo                           | completo                | completo   |
| [`Number.prototype.toLocaleString()`][]              | parziale (non locale-aware)               | parziale/completo (dipende dal SO) | parziale (solo Inglese) | completo   |
| `Date.prototype.toLocale*String()`                   | parziale (non locale-aware)               | parziale/completo (dipende dal SO) | parziale (solo Inglese) | completo   |
| [WHATWG URL Parser](url.html#url_the_whatwg_url_api) | parziale (nessun supporto IDN)            | completo                           | completo                | completo   |
| [`require('buffer').transcode()`][]                  | nessuno (la funzione non esiste)          | completo                           | completo                | completo   |
| [REPL](repl.html#repl_repl)                          | parziale (editing di riga non preciso)    | full                               | full                    | full       |
| [`require('util').TextDecoder`][]                    | parziale (supporto per codifiche di base) | parziale/completo (dipende dal SO) | parziale (solo Unicode) | completo   |
| [Escape di Proprietà Unicode di `RegExp`][]          | nessuno (errore `RegExp` non valido)      | completo                           | completo                | completo   |

The "(not locale-aware)" designation denotes that the function carries out its operation just like the non-`Locale` version of the function, if one exists. For example, under `none` mode, `Date.prototype.toLocaleString()`'s operation is identical to that of `Date.prototype.toString()`.

### Disabilita tutte le funzionalità di internazionalizzazione (`none`)

If this option is chosen, most internationalization features mentioned above will be **unavailable** in the resulting `node` binary.

### Costruisci con una ICU preinstallata (`system-icu`)

Node.js può essere collegato a una build ICU già installata nel sistema. In fact, most Linux distributions already come with ICU installed, and this option would make it possible to reuse the same set of data used by other components in the OS.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Incorpora un set limitato di dati ICU (`small-icu`)

This option makes the resulting binary link against the ICU library statically, and includes a subset of ICU data (typically only the English locale) within the `node` executable.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `small-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][], generally only work with the English locale:

```js
const january = new Date(9e8);
const english = new Intl.DateTimeFormat('en', { month: 'long' });
const spanish = new Intl.DateTimeFormat('es', { month: 'long' });

console.log(english.format(january));
// Stampa "January"
console.log(spanish.format(january));
// Stampa "M01" su small-icu
// Dovrebbe stampare "enero"
```

This mode provides a good balance between features and binary size, and it is the default behavior if no `--with-intl` flag is passed. The official binaries are also built in this mode.

#### Fornire dati ICU in fase di esecuzione

If the `small-icu` option is used, one can still provide additional locale data at runtime so that the JS methods would work for all ICU locales. Assuming the data file is stored at `/some/directory`, it can be made available to ICU through either:

- La variabile di ambiente [`NODE_ICU_DATA`][]:
  
  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

- Il parametro CLI [`--icu-data-dir`][]:
  
  ```shell
  node --icu-data-dir=/some/directory
  ```

(Se sono specificati entrambi, il parametro CLI `--icu-data-dir` ha la precedenza.)

ICU is able to automatically find and load a variety of data formats, but the data must be appropriate for the ICU version, and the file correctly named. The most common name for the data file is `icudt6X[bl].dat`, where `6X` denotes the intended ICU version, and `b` or `l` indicates the system's endianness. Check ["ICU Data"](http://userguide.icu-project.org/icudata) article in the ICU User Guide for other supported formats and more details on ICU data in general.

The [full-icu](https://www.npmjs.com/package/full-icu) npm module can greatly simplify ICU data installation by detecting the ICU version of the running `node` executable and downloading the appropriate data file. After installing the module through `npm i full-icu`, the data file will be available at `./node_modules/full-icu`. This path can be then passed either to `NODE_ICU_DATA` or `--icu-data-dir` as shown above to enable full `Intl` support.

### Incorporare l'intera ICU (`full-icu`)

This option makes the resulting binary link against ICU statically and include a full set of ICU data. A binary created this way has no further external dependencies and supports all locales, but might be rather large. See [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) on how to compile a binary using this mode.

## Rilevazione del supporto per l'internazionalizzazione

To verify that ICU is enabled at all (`system-icu`, `small-icu`, or `full-icu`), simply checking the existence of `Intl` should suffice:

```js
const hasICU = typeof Intl === 'object';
```

Alternatively, checking for `process.versions.icu`, a property defined only when ICU is enabled, works too:

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

For more verbose tests for `Intl` support, the following resources may be found to be helpful:

- [btest402](https://github.com/srl295/btest402): Generally used to check whether Node.js with `Intl` support is built correctly.
- [Test262](https://github.com/tc39/test262/tree/master/test/intl402): ECMAScript's official conformance test suite includes a section dedicated to ECMA-402.