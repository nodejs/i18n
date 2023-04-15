# Πολυγλωσσική Υποστήριξη

<!--introduced_in=v8.2.0-->
<!-- type=misc -->

Η Node.js έχει πολλά χαρακτηριστικά που επιτρέπουν την εύκολη δημιουργία προγραμμάτων σε πολλαπλές γλώσσες. Κάποια από αυτά είναι:

* Συναρτήσεις που είναι Locale-sensitive ή Unicode-aware στις [προδιαγραφές της γλώσσας ECMAScript](https://tc39.github.io/ecma262/):
  * [`String.prototype.normalize()`][]
  * [`String.prototype.toLowerCase()`][]
  * [`String.prototype.toUpperCase()`][]
* Όλες οι λειτουργίες που περιγράφονται στις [προδιαγραφές του API Πολυγλωσσικής Υποστήριξης ECMAScript](https://tc39.github.io/ecma402/) (γνωστό ως ECMA-402):
  * [`Intl`][] object
  * Locale-sensitive μέθοδοι όπως η [`String.prototype.localeCompare()`][] και η [`Date.prototype.toLocaleString()`][]
* Υποστήριξη του [αναλυτή URL WHATWG](url.html#url_the_whatwg_url_api) για [πολυγλωσσικά ονόματα τομέων](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDNs)
* [`require('buffer').transcode()`][]
* Ακριβέστερη επεξεργασία γραμμών [REPL](repl.html#repl_repl)
* [`require('util').TextDecoder`][]
* [Ιδιότητες Διαφυγής Unicode `RegExp`][]

Node.js (and its underlying V8 engine) uses [ICU](http://site.icu-project.org/) to implement these features in native C/C++ code. The full ICU data set is provided by Node.js by default. However, due to the size of the ICU data file, several options are provided for customizing the ICU data set either when building or running Node.js.

## Επιλογές για τη μεταγλώττιση της Node.js

Για να ελέγξετε πως χρησιμοποιείται το ICU στην Node.js, υπάρχουν τέσσερις επιλογές `configure` διαθέσιμες κατά τη μεταγλώττιση. Πρόσθετες πληροφορίες για το πως να μεταγλωττίσετε την Node.js είναι υπάρχουν τεκμηριωμένες στο [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

* `--with-intl=none`/`--without-intl`
* `--with-intl=system-icu`
* `--with-intl=small-icu`
* `--with-intl=full-icu` (default)

Μια επισκόπηση για την διαθεσιμότητα των χαρακτηριστικών Node.js και Javascript για κάθε επιλογή `configure`:

|                                                        | `none`                                          | `system-icu`                        | `small-icu`                 | `full-icu` |
| ------------------------------------------------------ | ----------------------------------------------- | ----------------------------------- | --------------------------- | ---------- |
| [`String.prototype.normalize()`][]                     | όχι (η συνάρτηση είναι no-op)                   | πλήρης                              | πλήρης                      | πλήρης     |
| `String.prototype.to*Case()`                           | πλήρης                                          | πλήρης                              | πλήρης                      | πλήρης     |
| [`Intl`][]                                             | καμία (το αντικείμενο δεν ορίζεται)             | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| [`String.prototype.localeCompare()`][]                 | περιορισμένη (δεν είναι locale-aware)           | πλήρης                              | πλήρης                      | πλήρης     |
| `String.prototype.toLocale*Case()`                     | περιορισμένη (δεν είναι locale-aware)           | πλήρης                              | πλήρης                      | πλήρης     |
| [`Number.prototype.toLocaleString()`][]                | περιορισμένη (δεν είναι locale-aware)           | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| `Date.prototype.toLocale*String()`                     | περιορισμένη (δεν είναι locale-aware)           | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Αγγλικά) | πλήρης     |
| [Αναλυτής URL WHATWG](url.html#url_the_whatwg_url_api) | περιορισμένη (χωρίς υποστήριξη IDN)             | πλήρης                              | πλήρης                      | πλήρης     |
| [`require('buffer').transcode()`][]                    | καμία (η συνάρτηση δεν ορίζεται)                | πλήρης                              | πλήρης                      | πλήρης     |
| [REPL](repl.html#repl_repl)                            | περιορισμένη (ανακριβής επεξεργασία γραμμών)    | πλήρης                              | πλήρης                      | πλήρης     |
| [`require('util').TextDecoder`][]                      | περιορισμένη (βασική υποστήριξη κωδικοποιήσεων) | περιορισμένη/πλήρης (ανάλογα το ΛΣ) | περιορισμένη (μόνο Unicode) | πλήρης     |
| [Ιδιότητες Διαφυγής Unicode `RegExp`][]                | καμία (μη-έγκυρο σφάλμα `RegExp`)               | πλήρης                              | πλήρης                      | πλήρης     |

The "(not locale-aware)" designation denotes that the function carries out its operation just like the non-`Locale` version of the function, if one exists. Για παράδειγμα, στην λειτουργία `none`, η λειτουργία της `Date.prototype.toLocaleString()` είναι πανομοιότυπη με τη λειτουργία της `Date.prototype.toString()`.

### Απενεργοποίηση όλων των χαρακτηριστικών πολυγλωσσικότητας (`none`)

If this option is chosen, ICU is disabled and most internationalization features mentioned above will be **unavailable** in the resulting `node` binary.

### Μεταγλώττιση με προ-εγκατεστημένο ICU (`system-icu`)

Η node.js μπορεί να συνδεθεί με ένα ICU που είναι ήδη εγκατεστημένο στο σύστημα. Στην πραγματικότητα, οι περισσότερες διανομές Linux έχουν κάποια έκδοση ICU προ-εγκατεστημένη, και αυτή η επιλογή καθιστά δυνατή την επαναχρησιμοποίηση του συνόλου δεδομένων που χρησιμοποιούν άλλα στοιχεία του Λειτουργικού Συστήματος.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Ενσωμάτωση περιορισμένου σετ δεδομένων ICU (`small-icu`)

Αυτή η επιλογή δημιουργεί στατική σύνδεση μεταξύ του σχετικού αρχείου της Node με την βιβλιοθήκη ICU, και συμπεριλαμβάνει ένα υποσύνολο των δεδομένων του ICU (συνήθως μόνο στην Αγγλική Γλώσσα) στο εκτελέσιμο αρχείο `node`.

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

This mode provides a balance between features and binary size.

#### Παροχή δεδομένων ICU κατά την εκτέλεση (runtime)

Αν χρησιμοποιηθεί η επιλογή `small-icu`, ο διαχειριστής μπορεί να παρέχει περισσότερα δεδομένα γλώσσας κατά την εκτέλεση, έτσι ώστε όλες οι μέθοδοι JS να λειτουργούν σε όλες τις γλώσσες του ICU. Υποθέτοντας ότι το αρχείο δεδομένων είναι αποθηκευμένο στη διαδρομή `/some/directory`, μπορεί να γίνει διαθέσιμο στο ICU μέσω ενός από τους παρακάτω τρόπους:

* Μεταβλητή περιβάλλοντος [`NODE_ICU_DATA`][]:

  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

* Παράμετρος Κονσόλας [`--icu-data-dir`][]:

  ```shell
  node --icu-data-dir=/some/directory
  ```

(αν έχουν οριστεί και οι 2 τρόποι, προτεραιότητα έχει η παράμετρος κονσόλας`--icu-data-dir`.)

Το ICU μπορεί να εντοπίσει και να φορτώσει αυτόματα μια μεγάλη ποικιλία μορφών δεδομένων, αλλά τα δεδομένα θα πρέπει να είναι κατάλληλα για την έκδοση του ICU, και το αρχείο να έχει ονομαστεί κατάλληλα. The most common name for the data file is `icudt6X[bl].dat`, where `6X` denotes the intended ICU version, and `b` or `l` indicates the system's endianness. Διαβάστε το άρθρο ["ICU Data"](http://userguide.icu-project.org/icudata) στον Οδηγό Χρήστη του ICU για περισσότερες υποστηριζόμενες μορφές, καθώς και για περισσότερες λεπτομέρειες για τα δεδομένα του ICU γενικότερα.

Το στοιχείο [full-icu](https://www.npmjs.com/package/full-icu) του npm μπορεί να απλοποιήσει σημαντικά την εγκατάσταση των δεδομένων του ICU, ανιχνεύοντας την έκδοση του ICU που χρησιμοποιεί το εκτελέσιμο αρχείο `node` που εκτελείται, και κατεβάζοντας το αντίστοιχο αρχείο δεδομένων. Αφού εγκαταστήσετε το στοιχείο μέσω της εντολής `npm i full-icu`, το αρχείο δεδομένων θα είναι διαθέσιμο στη διαδρομή `./node_modules/full-icu`. Αυτή η διαδρομή μπορεί να χρησιμοποιηθεί είτε με την μεταβλητή `NODE_ICU_DATA` είτε με την παράμετρο κονσόλας `--icu-data-dir` όπως δείχνουν τα παραδείγματα που δείξαμε παραπάνω, για να ενεργοποιηθεί η πλήρης υποστήριξη `Intl`.

### Ενσωμάτωση ολόκληρου του ICU (`full-icu`)

Αυτή η επιλογή συνδέει στατικά το αρχείο που προκύπτει από τη μεταγλώττιση με το ICU, και συμπεριλαμβάνει ένα πλήρες σύνολο δεδομένων του ICU. Το αρχείο που δημιουργείται με αυτόν τον τρόπο, δεν έχει άλλες εξαρτήσεις, υποστηρίζει όλες τις γλώσσες, αλλά μπορεί να είναι αρκετά μεγάλο. This is the default behavior if no `--with-intl` flag is passed. Τα αρχεία που διανέμονται επίσημα, μεταγλωττίζονται με αυτόν τον τρόπο.

## Ανίχνευση πολυγλωσσικής υποστήριξης

Για να επιβεβαιώσετε ότι το ICU είναι ενεργό με οποιονδήποτε τρόπο (`system-icu`, `small-icu`, ή `full-icu`), ο απλός έλεγχος ύπαρξης του `Intl` είναι αρκετός:

```js
const hasICU = typeof Intl === 'object';
```

Εναλλακτικά, ο έλεγχος του `process.versions.icu`, μια ιδιότητα που ορίζεται μόνο όταν έχει ενεργοποιηθεί το ICU, είναι επίσης ένας αποδεκτός τρόπος:

```js
const hasICU = typeof process.versions.icu === 'string';
```

Για να ελέγξετε αν υπάρχει υποστήριξη για μια γλώσσα εκτός των Αγγλικών (π.χ. `full-icu` ή `system-icu`), το [`Intl.DateTimeFormat`][] είναι ένας πολύ καλός τρόπος:

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

Για περισσότερες και αναλυτικότερες δοκιμές για την υποστήριξη του `Intl`, οι παρακάτω πόροι μπορεί να βοηθήσουν:

* [btest402](https://github.com/srl295/btest402): Χρησιμοποιείται για να ελέγξουμε αν έχει μεταγλωττιστεί σωστά το Node.js για το `Intl`.
* [Test262](https://github.com/tc39/test262/tree/master/test/intl402): Η επίσημη σουίτα δοκιμών συμμόρφωσης του ECMAScript περιλαμβάνει μια ενότητα αφιερωμένη στο ECMA-402.
