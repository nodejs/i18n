# Moduli ECMAScript

<!--introduced_in=v8.5.0-->
<!-- type=misc -->

> Stability: 1 - Experimental

<!--name=esm-->

Node.js contiene il supporto per i moduli ES basati sul [Node.js EP per i moduli ES](https://github.com/nodejs/node-eps/blob/master/002-es-modules.md).

Non tutte le funzionalità dell'EP sono complete e verranno rilasciate quando sia il supporto VM che la sua implementazione saranno pronti. I messaggi di errore sono ancora in via di ottimizzazione.

## Abilitazione

<!-- type=misc -->

Il flag dei `--experimental-modules` può essere utilizzato per attivare le funzionalità per il caricamento dei moduli ESM.

Uno volta che è stato impostato, i file che terminano con l'estensione `.mjs` saranno in grado di essere caricati come moduli ES.

```sh
node --experimental-modules my-app.mjs
```

## Funzionalità

<!-- type=misc -->

### Supportato

Solamente l'argomento CLI per il per il punto di ingresso principale del programma può essere un punto di entrata in un grafico ESM. L'importazione dinamica può anche essere utilizzata per creare un punto di ingresso in un grafico ESM in esecuzione.

#### import.meta

* {Object}

La metaproprietà `import.meta` è un `Object` che contiene le seguenti proprietà:

* `url` {string} L’URL assoluto `file:` del modulo.

### Non supportato

| Funzionalità           | Motivo                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `require('./foo.mjs')` | I moduli ES hanno una diversa risoluzione e sincronizzazione, utilizza l'importazione dinamica |

## Differenze notevoli tra `import` e `require`

### Nessuna NODE_PATH

`NODE_PATH` non fa parte dei "resolving `import` specifiers". Si prega di utilizzare i "symlink" se questo comportamento è desiderato.

### Nessun `require.extensions`

`require.extensions` non è utilizzato da `import`. L'aspettativa è che il "loader hook" possa fornire questo flusso di lavoro in futuro.

### Nessun `require.cache`

`require.cache` non è utilizzata da `import`. Ha una cache separata.

### Percorsi basati su URL

Gli ESM sono risolti e memorizzati sulla cache basandosi sulla semantica dell'[URL](https://url.spec.whatwg.org/). Questo significa che i file contenenti caratteri speciali come `#` e `?` devono essere esclusi.

I moduli saranno caricati più volte se l'identificatore `import` utilizzato per risolverli ha una query diversa o un frammento di essa.

```js
import './foo?query=1'; // loads ./foo with query of "?query=1"
import './foo?query=2'; // loads ./foo with query of "?query=2"
```

Per il momento, solo i moduli che utilizzano il protocollo `file:` possono essere caricati.

## Interop con moduli esistenti

Tutti i moduli CommonJS, JSON e C++ possono essere utilizzati con `import`.

I moduli caricati in questo modo saranno caricati solo una volta, anche se la loro query o la stringa di frammento differiscono tra `import` istruzioni.

Quando caricato tramite `importa` questi moduli forniranno un'esportazione singola `predefinita` che rappresenta il valore di `modulo.export` al momento della valutazione.

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

## Hooks loader

<!-- type=misc -->

To customize the default module resolution, loader hooks can optionally be provided via a `--loader ./loader-name.mjs` argument to Node.js.

Quando si utilizzano gli hooks, questi si applicano solo al caricamento dei moduli ES e non ad ogni modulo CommonJS caricato.

### Risolvi hook

L'hook di risoluzione restituisce l'URL del file e il formato del modulo risolto per un dato modulo specificatore e URL del file genitore:

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

In aggiunta alla restituzione del valore del file URL risolto, il gancio risolvi restituisce anche una proprietà `formato` specificando il formato del modulo del modulo risolto. Questo può essere uno dei seguenti:

| `format`     | Descrizione                                                      |
| ------------ | ---------------------------------------------------------------- |
| `'esm'`      | Carica un modulo JavaScript standard                             |
| `'cjs'`      | Carica un modulo CommonJS di tipo nodo                           |
| `'builtin'`  | Carica un modulo CommonJS di tipo nodo                           |
| `'json'`     | Carica un file JSON                                              |
| `'addon'`    | Carica un [C++ Addon](addons.html)                               |
| `'dinamico'` | Usa un hook istantaneo [dinamico](#esm_dynamic_instantiate_hook) |

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

Con questo loader, se si esegue:

```console
NODE_OPTIONS='--sperimentale-modules --loader ./custom-loader.mjs' node x.js
```

caricherebbe il modulo `x.js` come modulo ES con supporto relativo alla risoluzione (con `node_modules` caricamento saltato in questo esempio).

### Gancio istanziato dinamico

Per creare un modulo dinamico personalizzato che non corrisponde a una delle interpretazioni esistenti `format` è possibile utilizzare l'hook `dynamic cInstantiate`. Questo hook è chiamato solo per i moduli che restituiscono `format: 'dinamico'` da l'hook `risolvere`.

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

Con l'elenco delle esportazioni del modulo fornito dinnanzi, la funzione `esegui` sarà quindi chiamata al punto esatto dell'ordine di valutazione del modulo per quel modulo nell'albero di importazione.
