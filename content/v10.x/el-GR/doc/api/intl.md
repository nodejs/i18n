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

Η Node.js (και η υποκείμενη μηχανή V8) χρησιμοποιεί το [ICU](http://icu-project.org/) για την υλοποίηση αυτών των χαρακτηριστικών σε native κώδικα C/C++. Ωστόσο, κάποια από αυτά χρειάζονται ένα πολύ μεγάλο αρχείο δεδομένων ICU για να υποστηριχθούν όλες οι γλώσσες του κόσμου. Επειδή αναμένεται ότι οι χρήστες της Node.js θα χρησιμοποιήσουν ένα μικρό μόνο κομμάτι της λειτουργικότητας του ICU, μόνο ένα υποσύνολο του συνόλου δεδομένων του ICU προσφέρεται από προεπιλογή. Προσφέρονται διάφορες επιλογές για την παραμετροποίηση και την επέκταση του συνόλου δεδομένων του ICU κατά μεταγλώττιση ή την εκτέλεση της Node.js.

## Επιλογές για τη μεταγλώττιση της Node.js

Για να ελέγξετε πως χρησιμοποιείται το ICU στην Node.js, υπάρχουν τέσσερις επιλογές `configure` διαθέσιμες κατά τη μεταγλώττιση. Πρόσθετες πληροφορίες για το πως να μεταγλωττίσετε την Node.js είναι υπάρχουν τεκμηριωμένες στο [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none` / `--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (προεπιλογή)
- `--with-intl=full-icu`

Μια επισκόπηση για την διαθεσιμότητα των χαρακτηριστικών Node.js και Javascript για κάθε επιλογή `configure`:

|                                                        | `none`                                          | `system-icu`                        | `small-icu`                 | `full-icu` |
| ------------------------------------------------------ | ----------------------------------------------- | ----------------------------------- | --------------------------- | ---------- |
| [`String.prototype.normalize()`][]                     | όχι (η συνάρτηση είναι no-op)                   | πλήρης                              | πλήρης                      | πλήρης     |
| `String.prototype.to*Case()`                           | πλήρης                                          | πλήρης                              | πλήρης                      | πλήρης     |
| [`Intl`][]                                             | όχι (η συνάρτηση είναι no-op)                   | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| [`String.prototype.localeCompare()`][]                 | περιορισμένη (δεν είναι locale-aware)           | πλήρης                              | πλήρης                      | πλήρης     |
| `String.prototype.toLocale*Case()`                     | περιορισμένη (δεν είναι locale-aware)           | πλήρης                              | πλήρης                      | πλήρης     |
| [`Number.prototype.toLocaleString()`][]                | περιορισμένη (δεν είναι locale-aware)           | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| `Date.prototype.toLocale*String()`                     | περιορισμένη (δεν είναι locale-aware)           | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| [Αναλυτής URL WHATWG](url.html#url_the_whatwg_url_api) | περιορισμένη (χωρίς υποστήριξη IDN)             | πλήρης                              | πλήρης                      | πλήρης     |
| [`require('buffer').transcode()`][]                    | καμία (η συνάρτηση δεν ορίζεται)                | πλήρης                              | πλήρης                      | πλήρης     |
| [REPL](repl.html#repl_repl)                            | περιορισμένη (ανακριβής επεξεργασία γραμμών)    | πλήρης                              | πλήρης                      | πλήρης     |
| [`require('util').TextDecoder`][]                      | περιορισμένη (βασική υποστήριξη κωδικοποιήσεων) | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Unicode) | πλήρης     |
| [Ιδιότητες Διαφυγής Unicode `RegExp`][]                | καμία (μη-έγκυρο σφάλμα `RegExp`)               | πλήρης                              | πλήρης                      | πλήρης     |

Ο χαρακτηρισμός "(δεν είναι locale-aware)" σημαίνει ότι η συνάρτηση εκτελείται κανονικά, όπως η μη `Locale` έκδοση της συνάρτησης, εάν αυτή υπάρχει. Για παράδειγμα, στην λειτουργία `none`, η λειτουργία της `Date.prototype.toLocaleString()` είναι πανομοιότυπη με τη λειτουργία της `Date.prototype.toString()`.

### Απενεργοποίηση όλων των χαρακτηριστικών πολυγλωσσικότητας (`none`)

Αν χρησιμοποιηθεί αυτή η επιλογή, τα περισσότερα χαρακτηριστικά πολυγλωσσικότητας που αναφέρονται παραπάνω θα είναι **μη διαθέσιμα** στο αρχείο `node` που θα δημιουργηθεί.

### Μεταγλώττιση με προ-εγκατεστημένο ICU (`system-icu`)

Η node.js μπορεί να συνδεθεί με ένα ICU που είναι ήδη εγκατεστημένο στο σύστημα. Στην πραγματικότητα, οι περισσότερες διανομές Linux έχουν κάποια έκδοση ICU προ-εγκατεστημένη, και αυτή η επιλογή καθιστά δυνατή την επαναχρησιμοποίηση του συνόλου δεδομένων που χρησιμοποιούν άλλα στοιχεία του Λειτουργικού Συστήματος.

Οι λειτουργίες που απαιτούν μόνο τη βιβλιοθήκη ICU, όπως για παράδειγμα το [`String.prototype.normalize()`][] και τον [αναλυτή URL WHATWG](url.html#url_the_whatwg_url_api), υποστηρίζονται πλήρως από το `system-icu`. Χαρακτηριστικά που απαιτούν πρόσθετα τοπικά δεδομένα του ICU, όπως για παράδειγμα το [`Intl.DateTimeFormat`][] *ίσως* υποστηρίζονται τμηματικά ή πλήρως, ανάλογα με την πληρότητα των δεδομένων του ICU που έχει εγκατασταθεί στο σύστημα.

### Ενσωμάτωση περιορισμένου σετ δεδομένων ICU (`small-icu`)

Αυτή η επιλογή δημιουργεί στατική σύνδεση μεταξύ του σχετικού αρχείου της Node με την βιβλιοθήκη ICU, και συμπεριλαμβάνει ένα υποσύνολο των δεδομένων του ICU (συνήθως μόνο στην Αγγλική Γλώσσα) στο εκτελέσιμο αρχείο `node`.

Οι λειτουργίες που απαιτούν μόνο τη βιβλιοθήκη ICU, όπως για παράδειγμα το [`String.prototype.normalize()`][] και τον [αναλυτή URL WHATWG](url.html#url_the_whatwg_url_api), υποστηρίζονται πλήρως από το `small-icu`. Χαρακτηριστικά που απαιτούν πρόσθετα τοπικά δεδομένα του ICU, όπως το [`Intl.DateTimeFormat`][], γενικά λειτουργούν μόνο στην Αγγλική γλώσσα:

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

Αυτός ο τρόπος παρέχει μια καλή ισορροπία μεταξύ χαρακτηριστικών και μέγεθος αρχείου, και είναι η προεπιλεγμένη συμπεριφορά αν δεν χρησιμοποιηθεί κάποια επιλογή του `--with-intl`. Τα αρχεία που διανέμονται επίσημα, μεταγλωττίζονται με αυτόν τον τρόπο.

#### Παροχή δεδομένων ICU κατά την εκτέλεση (runtime)

Αν χρησιμοποιηθεί η επιλογή `small-icu`, ο διαχειριστής μπορεί να παρέχει περισσότερα δεδομένα γλώσσας κατά την εκτέλεση, έτσι ώστε όλες οι μέθοδοι JS να λειτουργούν σε όλες τις γλώσσες του ICU. Υποθέτοντας ότι το αρχείο δεδομένων είναι αποθηκευμένο στη διαδρομή `/some/directory`, μπορεί να γίνει διαθέσιμο στο ICU μέσω ενός απο τους παρακάτω τρόπους:

- Μεταβλητή περιβάλλοντος [`NODE_ICU_DATA`][]:
    
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