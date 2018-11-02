# Πολυγλωσσική Υποστήριξη

<!--introduced_in=v8.2.0-->

<!-- type=misc -->

Η Node.js έχει πολλά χαρακτηριστικά που επιτρέπουν την εύκολη δημιουργία προγραμμάτων σε πολλαπλές γλώσσες. Κάποια από αυτά είναι:

- Συναρτήσεις που είναι Locale-sensitive ή Unicode-aware στις [προδιαγραφές της γλώσσας ECMAScript](https://tc39.github.io/ecma262/): 
    - [`String.prototype.normalize()`][]
    - [`String.prototype.toLowerCase()`][]
    - [`String.prototype.toUpperCase()`][]
- Όλες οι λειτουργίες που περιγράφονται στις [προδιαγραφές του API Πολυγλωσσικής Υποστήριξης ECMAScript](https://tc39.github.io/ecma402/) (γνωστό ως ECMA-402): 
    - [`Intl`][] object
    - Locale-sensitive μέθοδοι όπως η [`String.prototype.localeCompare()`][] και η [`Date.prototype.toLocaleString()`][]
- Υποστήριξη του [αναλυτή URL WHATWG](url.html#url_the_whatwg_url_api) για [πολυγλωσσικά ονόματα τομέων](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDNs)
- [`require('buffer').transcode()`][]
- Ακριβέστερη επεξεργασία γραμμών [REPL](repl.html#repl_repl)
- [`require('util').TextDecoder`][]
- [Ιδιότητες Διαφυγής Unicode `RegExp`][]

Η Node.js (και η υποκείμενη μηχανή V8) χρησιμοποιεί το [ICU](http://icu-project.org/) για την υλοποίηση αυτών των χαρακτηρηστικών σε native κώδικα C/C++. Ωστόσο, κάποια από αυτά χρειάζονται ένα πολύ μεγάλο αρχείο δεδομένων ICU για να υποστηριχθούν όλες οι γλώσσες του κόσμου. Επειδή αναμένεται ότι οι χρήστες της Node.js θα χρησιμοποιήσουν ένα μικρό μόνο κομμάτι της λειτουργικότητας του ICU, μόνο ένα υποσύνολο του συνόλου δεδομένων του ICU προσφέρεται από προεπιλογή. Προσφέρονται διάφορες επιλογές για την παραμετροποίηση και την επέκταση του συνόλου δεδομένων του ICU κατά μεταγλώττιση ή την εκτέλεση της Node.js.

## Επιλογές για τη μεταγλώττιση της Node.js

Για να ελέγξετε πως χρησιμοποιείται το ICU στην Node.js, υπάρχουν τέσσερεις επιλογές `configure` διαθέσιμες κατά τη μεταγλώττιση. Πρόσθετες πληροφορίες για το πως να μεταγλωττίσετε την Node.js είναι υπάρχουν τεκμηριωμένες στο [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none` / `--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (προεπιλογή)
- `--with-intl=full-icu`

Μια επισκόπηση για την διαθεσιμότητα των χαρακτηριστικών Node.js και Javascript για κάθε επιλογή `configure`:

|                                                      | `none`                            | `system-icu`                 | `small-icu`            | `full-icu` |
| ---------------------------------------------------- | --------------------------------- | ---------------------------- | ---------------------- | ---------- |
| [`String.prototype.normalize()`][]                   | όχι (η συνάρτηση είναι no-op)     | πλήρης                       | πλήρης                 | πλήρης     |
| `String.prototype.to*Case()`                         | πλήρης                            | πλήρης                       | πλήρης                 | πλήρης     |
| [`Intl`][]                                           | όχι (η συνάρτηση είναι no-op)     | partial/full (depends on OS) | partial (English-only) | full       |
| [`String.prototype.localeCompare()`][]               | partial (not locale-aware)        | full                         | full                   | full       |
| `String.prototype.toLocale*Case()`                   | partial (not locale-aware)        | full                         | full                   | full       |
| [`Number.prototype.toLocaleString()`][]              | partial (not locale-aware)        | partial/full (depends on OS) | partial (English-only) | full       |
| `Date.prototype.toLocale*String()`                   | partial (not locale-aware)        | partial/full (depends on OS) | partial (English-only) | full       |
| [WHATWG URL Parser](url.html#url_the_whatwg_url_api) | partial (no IDN support)          | full                         | full                   | full       |
| [`require('buffer').transcode()`][]                  | none (function does not exist)    | full                         | full                   | full       |
| [REPL](repl.html#repl_repl)                          | partial (inaccurate line editing) | full                         | full                   | full       |
| [`require('util').TextDecoder`][]                    | partial (basic encodings support) | partial/full (depends on OS) | partial (Unicode-only) | full       |
| [Ιδιότητες Διαφυγής Unicode `RegExp`][]              | none (invalid `RegExp` error)     | full                         | full                   | full       |

The "(not locale-aware)" designation denotes that the function carries out its operation just like the non-`Locale` version of the function, if one exists. For example, under `none` mode, `Date.prototype.toLocaleString()`'s operation is identical to that of `Date.prototype.toString()`.

### Disable all internationalization features (`none`)

If this option is chosen, most internationalization features mentioned above will be **unavailable** in the resulting `node` binary.

### Build with a pre-installed ICU (`system-icu`)

Node.js can link against an ICU build already installed on the system. In fact, most Linux distributions already come with ICU installed, and this option would make it possible to reuse the same set of data used by other components in the OS.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Embed a limited set of ICU data (`small-icu`)

This option makes the resulting binary link against the ICU library statically, and includes a subset of ICU data (typically only the English locale) within the `node` executable.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `small-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][], generally only work with the English locale:

```js
const january = new Date(9e8);
const english = new Intl.DateTimeFormat('en', { month: 'long' });
const spanish = new Intl.DateTimeFormat('es', { month: 'long' });

console.log(english.format(january));
// Prints "January"
console.log(spanish.format(january));
// Prints "M01" on small-icu
// Should print "enero"
```

This mode provides a good balance between features and binary size, and it is the default behavior if no `--with-intl` flag is passed. The official binaries are also built in this mode.

#### Providing ICU data at runtime

If the `small-icu` option is used, one can still provide additional locale data at runtime so that the JS methods would work for all ICU locales. Assuming the data file is stored at `/some/directory`, it can be made available to ICU through either:

- The [`NODE_ICU_DATA`][] environment variable:
    
    ```shell
    env NODE_ICU_DATA=/some/directory node
    ```

- The [`--icu-data-dir`][] CLI parameter:
    
    ```shell
    node --icu-data-dir=/some/directory
    ```

(If both are specified, the `--icu-data-dir` CLI parameter takes precedence.)

ICU is able to automatically find and load a variety of data formats, but the data must be appropriate for the ICU version, and the file correctly named. The most common name for the data file is `icudt5X[bl].dat`, where `5X` denotes the intended ICU version, and `b` or `l` indicates the system's endianness. Check ["ICU Data"](http://userguide.icu-project.org/icudata) article in the ICU User Guide for other supported formats and more details on ICU data in general.

The [full-icu](https://www.npmjs.com/package/full-icu) npm module can greatly simplify ICU data installation by detecting the ICU version of the running `node` executable and downloading the appropriate data file. After installing the module through `npm i full-icu`, the data file will be available at `./node_modules/full-icu`. This path can be then passed either to `NODE_ICU_DATA` or `--icu-data-dir` as shown above to enable full `Intl` support.

### Embed the entire ICU (`full-icu`)

This option makes the resulting binary link against ICU statically and include a full set of ICU data. A binary created this way has no further external dependencies and supports all locales, but might be rather large. See [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) on how to compile a binary using this mode.

## Detecting internationalization support

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