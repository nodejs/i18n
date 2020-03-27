# Ενότητες ECMAScript

<!--introduced_in=v8.5.0-->

<!-- type=misc -->

> Σταθερότητα: 1 - Πειραματικό

<!--name=esm-->

Node.js contains support for ES Modules based upon the [Node.js EP for ES Modules](https://github.com/nodejs/node-eps/blob/master/002-es-modules.md).

Not all features of the EP are complete and will be landing as both VM support and implementation is ready. Τα μηνύματα λάθους είναι ακόμα υπό μορφοποίηση.

## Ενεργοποίηση

<!-- type=misc -->

The `--experimental-modules` flag can be used to enable features for loading ESM modules.

Once this has been set, files ending with `.mjs` will be able to be loaded as ES Modules.

```sh
node --experimental-modules my-app.mjs
```

## Χαρακτηριστικά

<!-- type=misc -->

### Υποστηριζόμενα

Only the CLI argument for the main entry point to the program can be an entry point into an ESM graph. Dynamic import can also be used to create entry points into ESM graphs at runtime.

#### import.meta

* {Object}

The `import.meta` metaproperty is an `Object` that contains the following property:

* `url` {string} Το απόλυτο `file:` URL της ενότητας.

### Μη υποστηριζόμενα

| Χαρακτηριστικό         | Αιτία                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `require('./foo.mjs')` | Οι ενότητες ES έχουν διαφορετική ανάλυση και χρονομέτρηση, χρησιμοποιήστε δυναμική εισαγωγή |

## Αξιοσημείωτες διαφορές μεταξύ `import` και `require`

### Δεν υπάρχει NODE_PATH

Το `NODE_PATH` δεν είναι μέρος της επίλυσης των προσδιοριστών `import`. Please use symlinks if this behavior is desired.

### Δεν υπάρχει `require.extensions`

Το `require.extensions` δεν χρησιμοποιείται από το `import`. The expectation is that loader hooks can provide this workflow in the future.

### Δεν υπάρχει `require.cache`

Το `require.cache` δε χρησιμοποιείται από το `import`. Έχει ξεχωριστή προσωρινή μνήμη.

### Διαδρομές βασισμένες σε URL

ESM are resolved and cached based upon [URL](https://url.spec.whatwg.org/) semantics. This means that files containing special characters such as `#` and `?` need to be escaped.

Modules will be loaded multiple times if the `import` specifier used to resolve them have a different query or fragment.

```js
import './foo?query=1'; // loads ./foo with query of "?query=1"
import './foo?query=2'; // loads ./foo with query of "?query=2"
```

Προς το παρόν, μόνο ενότητες που χρησιμοποιούν το πρωτόκολλο `file:` μπορούν να φορτωθούν.

## Διαλειτουργικότητα με υπάρχουσες μονάδες

Όλες οι ενότητες CommonJS, JSON, και C++ μπορούν να χρησιμοποιηθούν με τη χρήση του `import`.

Modules loaded this way will only be loaded once, even if their query or fragment string differs between `import` statements.

When loaded via `import` these modules will provide a single `default` export representing the value of `module.exports` at the time they finished evaluating.

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

When hooks are used they only apply to ES module loading and not to any CommonJS modules loaded.

### Hook επίλυσης

The resolve hook returns the resolved file URL and module format for a given module specifier and parent file URL:

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

In addition to returning the resolved file URL value, the resolve hook also returns a `format` property specifying the module format of the resolved module. Αυτή μπορεί να είναι μια από τις παρακάτω:

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

would load the module `x.js` as an ES module with relative resolution support (with `node_modules` loading skipped in this example).

### Δυναμικό instantiate hook

To create a custom dynamic module that doesn't correspond to one of the existing `format` interpretations, the `dynamicInstantiate` hook can be used. This hook is called only for modules that return `format: 'dynamic'` from the `resolve` hook.

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

With the list of module exports provided upfront, the `execute` function will then be called at the exact point of module evaluation order for that module in the import tree.