# Πολυγλωσσική Υποστήριξη

<!--introduced_in=v8.2.0-->

Node.js has many features that make it easier to write internationalized programs. Κάποια από αυτά είναι:

- Locale-sensitive or Unicode-aware functions in the [ECMAScript Language Specification](https://tc39.github.io/ecma262/): 
  - [`String.prototype.normalize()`][]
  - [`String.prototype.toLowerCase()`][]
  - [`String.prototype.toUpperCase()`][]
- All functionality described in the [ECMAScript Internationalization API Specification](https://tc39.github.io/ecma402/) (aka ECMA-402): 
  - [`Intl`][] object
  - Locale-sensitive methods like [`String.prototype.localeCompare()`][] and [`Date.prototype.toLocaleString()`][]
- Υποστήριξη του [αναλυτή URL WHATWG](url.html#url_the_whatwg_url_api) για [πολυγλωσσικά ονόματα τομέων](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDNs)
- [`require('buffer').transcode()`][]
- Ακριβέστερη επεξεργασία γραμμών [REPL](repl.html#repl_repl)
- [`require('util').TextDecoder`][]
- [Ιδιότητες Διαφυγής Unicode RegExp](https://github.com/tc39/proposal-regexp-unicode-property-escapes)

Node.js (and its underlying V8 engine) uses [ICU](http://icu-project.org/) to implement these features in native C/C++ code. However, some of them require a very large ICU data file in order to support all locales of the world. Because it is expected that most Node.js users will make use of only a small portion of ICU functionality, only a subset of the full ICU data set is provided by Node.js by default. Several options are provided for customizing and expanding the ICU data set either when building or running Node.js.

## Επιλογές για τη μεταγλώττιση της Node.js

To control how ICU is used in Node.js, four `configure` options are available during compilation. Additional details on how to compile Node.js are documented in [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none` / `--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (προεπιλογή)
- `--with-intl=full-icu`

An overview of available Node.js and JavaScript features for each `configure` option:

|                                                                                                       | `none`                                          | `system-icu`                        | `small-icu`                 | `full-icu` |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------- | --------------------------- | ---------- |
| [`String.prototype.normalize()`][]                                                                    | όχι (η συνάρτηση είναι no-op)                   | πλήρης                              | πλήρης                      | πλήρης     |
| `String.prototype.to*Case()`                                                                          | πλήρης                                          | πλήρης                              | πλήρης                      | πλήρης     |
| [`Intl`][]                                                                                            | καμία (το αντικείμενο δεν ορίζεται)             | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| [`String.prototype.localeCompare()`][]                                                                | περιορισμένη (δεν είναι locale-aware)           | πλήρης                              | πλήρης                      | πλήρης     |
| `String.prototype.toLocale*Case()`                                                                    | περιορισμένη (δεν είναι locale-aware)           | πλήρης                              | πλήρης                      | πλήρης     |
| [`Number.prototype.toLocaleString()`][]                                                               | περιορισμένη (δεν είναι locale-aware)           | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| `Date.prototype.toLocale*String()`                                                                    | περιορισμένη (δεν είναι locale-aware)           | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| [Αναλυτής URL WHATWG](url.html#url_the_whatwg_url_api)                                                | περιορισμένη (χωρίς υποστήριξη IDN)             | πλήρης                              | πλήρης                      | πλήρης     |
| [`require('buffer').transcode()`][]                                                                   | καμία (η συνάρτηση δεν ορίζεται)                | πλήρης                              | πλήρης                      | πλήρης     |
| [REPL](repl.html#repl_repl)                                                                           | περιορισμένη (ανακριβής επεξεργασία γραμμών)    | πλήρης                              | πλήρης                      | πλήρης     |
| [`require('util').TextDecoder`][]                                                                     | περιορισμένη (βασική υποστήριξη κωδικοποιήσεων) | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Unicode) | πλήρης     |
| [Ιδιότητες Διαφυγής Unicode RegExp](https://github.com/tc39/proposal-regexp-unicode-property-escapes) | καμία (μη-έγκυρο σφάλμα RegExp)                 | πλήρης                              | πλήρης                      | πλήρης     |

*Note*: The "(not locale-aware)" designation denotes that the function carries out its operation just like the non-`Locale` version of the function, if one exists. For example, under `none` mode, `Date.prototype.toLocaleString()`'s operation is identical to that of `Date.prototype.toString()`.

### Απενεργοποίηση όλων των χαρακτηριστικών πολυγλωσσικότητας (`none`)

If this option is chosen, most internationalization features mentioned above will be **unavailable** in the resulting `node` binary.

### Μεταγλώττιση με προ-εγκατεστημένο ICU (`system-icu`)

Η node.js μπορεί να συνδεθεί με ένα ICU που είναι ήδη εγκατεστημένο στο σύστημα. In fact, most Linux distributions already come with ICU installed, and this option would make it possible to reuse the same set of data used by other components in the OS.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Ενσωμάτωση περιορισμένου σετ δεδομένων ICU (`small-icu`)

This option makes the resulting binary link against the ICU library statically, and includes a subset of ICU data (typically only the English locale) within the `node` executable.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `small-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][], generally only work with the English locale:

```js
const january = new Date(9e8);
const english = new Intl.DateTimeFormat('en', { month: 'long' });
const spanish = new Intl.DateTimeFormat('es', { month: 'long' });

console.log(english.format(january));
// Τυπώνει "January"
console.log(spanish.format(january));
// Τυπώνει "M01" on small-icu
// Θα έπρεπε να τυπώσει "enero"
```

This mode provides a good balance between features and binary size, and it is the default behavior if no `--with-intl` flag is passed. The official binaries are also built in this mode.

#### Παροχή δεδομένων ICU κατά την εκτέλεση (runtime)

If the `small-icu` option is used, one can still provide additional locale data at runtime so that the JS methods would work for all ICU locales. Assuming the data file is stored at `/some/directory`, it can be made available to ICU through either:

- Μεταβλητή περιβάλλοντος [`NODE_ICU_DATA`][]:
  
  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

- Παράμετρος Κονσόλας [`--icu-data-dir`][]:
  
  ```shell
  node --icu-data-dir=/some/directory
  ```

(αν έχουν οριστεί και οι 2 τρόποι, προτεραιότητα έχει η παράμετρος κονσόλας`--icu-data-dir`.)

ICU is able to automatically find and load a variety of data formats, but the data must be appropriate for the ICU version, and the file correctly named. The most common name for the data file is `icudt5X[bl].dat`, where `5X` denotes the intended ICU version, and `b` or `l` indicates the system's endianness. Check ["ICU Data"](http://userguide.icu-project.org/icudata) article in the ICU User Guide for other supported formats and more details on ICU data in general.

The [full-icu](https://www.npmjs.com/package/full-icu) npm module can greatly simplify ICU data installation by detecting the ICU version of the running `node` executable and downloading the appropriate data file. After installing the module through `npm i full-icu`, the data file will be available at `./node_modules/full-icu`. This path can be then passed either to `NODE_ICU_DATA` or `--icu-data-dir` as shown above to enable full `Intl` support.

### Ενσωμάτωση ολόκληρου του ICU (`full-icu`)

This option makes the resulting binary link against ICU statically and include a full set of ICU data. A binary created this way has no further external dependencies and supports all locales, but might be rather large. See [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) on how to compile a binary using this mode.

## Ανίχνευση πολυγλωσσικής υποστήριξης

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