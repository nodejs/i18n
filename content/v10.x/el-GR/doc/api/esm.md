# Ενότητες ECMAScript

<!--introduced_in=v8.5.0-->
<!-- type=misc -->

> Σταθερότητα: 1 - Πειραματικό

<!--name=esm-->

Η Node.js υποστηρίζει ενότητες ES με βάση το [Node.js EP για ενότητες ES](https://github.com/nodejs/node-eps/blob/master/002-es-modules.md).

Δεν είναι όλα τα χαρακτηριστικά του EP έτοιμα, και θα ετοιμαστούν όταν ολοκληρωθεί η υποστήριξη και η υλοποίηση της VM. Τα μηνύματα λάθους είναι ακόμα υπό μορφοποίηση.

## Ενεργοποίηση

<!-- type=misc -->

Η επιλογή `--experimental-modules` μπορεί να χρησιμοποιηθεί για την ενεργοποίηση των δυνατοτήτων φόρτωσης των ενοτήτων ESM.

Μόλις οριστεί αυτή η επιλογή, τα αρχεία με κατάληξη `.mjs` θα μπορούν να φορτωθούν ως ενότητες ES Modules.

```sh
node --experimental-modules my-app.mjs
```

## Χαρακτηριστικά

<!-- type=misc -->

### Υποστηριζόμενα

Μόνο οι παράμετροι CLI για το κύριο σημείο εισόδου του προγράμματος, μπορούν να είναι ένα σημείο εισόδου για ένα γράφημα ESM. H δυναμική εισαγωγή κατά την εκτέλεση, μπορεί επίσης να δημιουργεί σημεία εισόδου στα γραφήματα ESM.

#### import.meta

* {Object}

Η μεταιδιότητα `import.meta` είναι ένα `Object` που περιέχει την παρακάτω ιδιότητα:

* `url` {string} Το απόλυτο `file:` URL της ενότητας.

### Μη υποστηριζόμενα

| Χαρακτηριστικό         | Αιτία                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `require('./foo.mjs')` | Οι ενότητες ES έχουν διαφορετική ανάλυση και χρονομέτρηση, χρησιμοποιήστε δυναμική εισαγωγή |

## Αξιοσημείωτες διαφορές μεταξύ `import` και `require`

### Δεν υπάρχει NODE_PATH

Το `NODE_PATH` δεν είναι μέρος της επίλυσης των προσδιοριστών `import`. Παρακαλούμε χρησιμοποιήστε symlinks αν επιθυμείτε αυτή τη συμπεριφορά.

### Δεν υπάρχει `require.extensions`

Το `require.extensions` δεν χρησιμοποιείται από το `import`. Το αναμενόμενο είναι ότι τα loader hooks μπορούν να προσφέρουν αυτή τη λειτουργικότητα στο μέλλον.

### Δεν υπάρχει `require.cache`

Το `require.cache` δε χρησιμοποιείται από το `import`. Έχει ξεχωριστή προσωρινή μνήμη.

### Διαδρομές βασισμένες σε URL

Τα ESM επιλύονται και αποθηκεύονται προσωρινά με τη χρήση σημασιολογίας [URL](https://url.spec.whatwg.org/). Αυτό σημαίνει ότι πρέπει να γίνει χρήση χαρακτήρα διαφυγής, όταν εμφανίζονται χαρακτήρες όπως το `#` και το `?`.

Οι ενότητες θα φορτωθούν πολλαπλές φορές αν οι προσδιοριστές `import` που χρησιμοποιούνται για την επίλυση τους έχουν διαφορετικό επερώτημα.

```js
import './foo?query=1'; // loads ./foo with query of "?query=1"
import './foo?query=2'; // loads ./foo with query of "?query=2"
```

Προς το παρόν, μόνο ενότητες που χρησιμοποιούν το πρωτόκολλο `file:` μπορούν να φορτωθούν.

## Διαλειτουργικότητα με υπάρχουσες μονάδες

Όλες οι ενότητες CommonJS, JSON, και C++ μπορούν να χρησιμοποιηθούν με τη χρήση του `import`.

Οι ενότητες που φορτώνονται με αυτό τον τρόπο θα φορτωθούν μόνο μια φορά, ακόμα κι αν το επερώτημά τους είναι διαφορετικό μεταξύ των δηλώσεων `import`.

Όταν φορτωθούν μέσω του `import` αυτές οι ενότητες θα παρέχουν μια μοναδική εξαγόμενη `default` η οποία αντιπροσωπεύει την τιμή του `module.exports` την στιγμή της ολοκλήρωσης της αξιολόγησης.

```js
// foo.js
module.exports = { one: 1 };

// bar.mjs
import foo from './foo.js';
foo.one === 1; // true
```

Builtin modules will provide named exports of their public API, as well as a default export which can be used for, among other things, modifying the named exports. Named exports of builtin modules are updated when the corresponding exports property is accessed, redefined, or deleted.

```js
import EventEmitter from 'events';
const e = new EventEmitter();
```

```js
import { readFile } from 'fs';
readFile('./foo.txt', (err, source) => {
  if (err) {
    console.error(err);
  } else {
    console.log(source);
  }
});
```

```js
import fs, { readFileSync } from 'fs';

fs.readFileSync = () => Buffer.from('Hello, ESM');

fs.readFileSync === readFileSync;
```

## Loader hooks

<!-- type=misc -->

To customize the default module resolution, loader hooks can optionally be provided via a `--loader ./loader-name.mjs` argument to Node.js.

Όταν χρησιμοποιούνται τα hook, ισχύουν μόνο για τις μονάδες ES που φορτώνονται, και όχι για μονάδες CommonJS.

### Hook επίλυσης

Το hook επίλυσης επιστρέφει το επιλυμένο URL αρχείου και τη μορφή της ενότητας για τον δεδομένο προσδιοριστή ενότητας καθώς και το URL του γονικού αρχείου:

```js
const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

export async function resolve(specifier,
                              parentModuleURL = baseURL,
                              defaultResolver) {
  return {
    url: new URL(specifier, parentModuleURL).href,
    format: 'esm'
  };
}
```

The `parentModuleURL` is provided as `undefined` when performing main Node.js load itself.

The default Node.js ES module resolution function is provided as a third argument to the resolver for easy compatibility workflows.

Εκτός από την επιστροφή της τιμής του επιλυμένου URL του αρχείου, το hook επίλυσης επιστρέφει επίσης μια ιδιότητα `format` η οποία προσδιορίζει τη μορφή της επιλυμένης ενότητας. Αυτή μπορεί να είναι μια από τις παρακάτω:

| `μορφή`     | Περιγραφή                                                              |
| ----------- | ---------------------------------------------------------------------- |
| `'esm'`     | Φόρτωση κανονικών ενοτήτων JavaScript                                  |
| `'cjs'`     | Φόρτωση μιας ενότητας CommonJS σε στυλ node                            |
| `'builtin'` | Φόρτωση μιας ενσωματωμένης ενότητας CommonJS                           |
| `'json'`    | Φόρτωση ενός αρχείου JSON                                              |
| `'addon'`   | Φόρτωση ενός [πρόσθετου C++](addons.html)                              |
| `'dynamic'` | Χρήση ενός [δυναμικού instantiate hook](#esm_dynamic_instantiate_hook) |

For example, a dummy loader to load JavaScript restricted to browser resolution rules with only JS file extension and Node.js builtin modules support could be written:

```js
import path from 'path';
import process from 'process';
import Module from 'module';

const builtins = Module.builtinModules;
const JS_EXTENSIONS = new Set(['.js', '.mjs']);

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve) {
  if (builtins.includes(specifier)) {
    return {
      url: specifier,
      format: 'builtin'
    };
  }
  if (/^\.{0,2}[/]/.test(specifier) !== true && !specifier.startsWith('file:')) {
    // For node_modules support:
    // return defaultResolve(specifier, parentModuleURL);
    throw new Error(
      `imports must begin with '/', './', or '../'; '${specifier}' does not`);
  }
  const resolved = new URL(specifier, parentModuleURL);
  const ext = path.extname(resolved.pathname);
  if (!JS_EXTENSIONS.has(ext)) {
    throw new Error(
      `Cannot load file with non-JavaScript file extension ${ext}.`);
  }
  return {
    url: resolved.href,
    format: 'esm'
  };
}
```

Με αυτόν το φορτωτή, τρέχοντας την εντολή:

```console
NODE_OPTIONS='--experimental-modules --loader ./custom-loader.mjs' node x.js
```

θα φορτώσει την ενότητα `x.js` ως μια ενότητα ES, με υποστήριξη σχετικής ανάλυσης (με τη φόρτωση των `node_modules` να παραλείπεται σε αυτό το παράδειγμα).

### Δυναμικό instantiate hook

Για τη δημιουργία μιας προσαρμοσμένης δυναμικής ενότητας που δεν αντιστοιχεί σε μια από τις υπάρχουσες ερμηνείες `format`, μπορεί να χρησιμοποιηθεί το `dynamicInstantiate` hook. Αυτό το hook καλείται μόνο για ενότητες που επιστρέφουν `format: 'dynamic'` από το `resolve` hook.

```js
export async function dynamicInstantiate(url) {
  return {
    exports: ['customExportName'],
    execute: (exports) => {
      // get and set functions provided for pre-allocated export names
      exports.customExportName.set('value');
    }
  };
}
```

Με τη λίστα εξαγόμενων ενοτήτων να παρέχεται εκ των προτέρων, η συνάρτηση `execute` θα κληθεί στο ακριβές σημείο της αξιολόγησης σειράς των ενοτήτων, για την ενότητα στο δέντρο εισαγωγής.
