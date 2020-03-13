# Supporto all'Internazionalizzazione

<!--introduced_in=v8.2.0-->
<!-- type=misc -->

Node.js possiede molte funzionalità che rendono più semplice scrivere programmi internazionalizzati. Alcune di esse sono:

- Funzioni Locale-sensitive o Unicode-aware nella [Specifica del Linguaggio ECMAScript](https://tc39.github.io/ecma262/):
  - [`String.prototype.normalize()`][]
  - [`String.prototype.toLowerCase()`][]
  - [`String.prototype.toUpperCase()`][]
- Tutte le funzionalità descritte nella [Specifica dell'API di Internalizzazione di ECMAScript](https://tc39.github.io/ecma402/) (nota anche come ECMA-402):
  - [`Intl`][] object
  - Metodi Locale-sensitive come [`String.prototype.localeCompare()`][] e [`Date.prototype.toLocaleString()`][]
- Il supporto dei [nomi di dominio internazionalizzati](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDN) del [parser WHATWG URL](url.html#url_the_whatwg_url_api)
- [`require('buffer').transcode()`][]
- Editing della riga [REPL](repl.html#repl_repl) più accurato
- [`require('util').TextDecoder`][]
- [Escape di Proprietà Unicode di `RegExp`][]

Node.js (and its underlying V8 engine) uses [ICU](http://site.icu-project.org/) to implement these features in native C/C++ code. Tuttavia, alcune di esse richiedono un file di dati ICU molto grande per supportare tutte le versioni internazionali del mondo. Poiché si prevede che la maggior parte degli utenti di Node.js utilizzeranno solo una piccola parte delle funzionalità di ICU, viene fornito di default da Node.js solo il sottoinsieme del set di dati ICU completo. Vengono offerte diverse opzioni per la personalizzazione e l'espansione del set di dati ICU durante la creazione o l'esecuzione di Node.js.

## Opzioni per la costruzione di Node.js

Per controllare come viene utilizzata l'ICU in Node.js, durante la compilazione sono disponibili quattro opzioni di `configure`. Ulteriori dettagli su come compilare Node.js sono documentati in [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none`/`--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (default)
- `--with-intl=full-icu`

Una panoramica delle funzionalità di Node.js e di JavaScript disponibili per ogni opzione di `configure`:

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

La designazione "(non local-aware)" indica che la funzione svolge il suo lavoro proprio come la versione non-`Locale` della funzione, se ne esiste una. Ad esempio, in modalità `none`, l'operazione `Date.prototype.toLocaleString()` è identica a quella di `Date.prototype.toString()`.

### Disabilita tutte le funzionalità di internazionalizzazione (`none`)

Se viene scelta questa opzione, la maggior parte delle funzionalità di internazionalizzazione sopra menzionate sarà **indisponibile** nel `node` binario risultante.

### Costruisci con una ICU preinstallata (`system-icu`)

Node.js può essere collegato a una build ICU già installata nel sistema. In effetti, la maggior parte delle distribuzioni Linux sono già dotate di ICU installata e questa opzione consentirebbe di riutilizzare lo stesso set di dati utilizzato da altri componenti nel sistema operativo.

Funzionalità che richiedono solo la libreria ICU stessa, come [`String.prototype.normalize()`][] ed il [parser URL WHATWG](url.html#url_the_whatwg_url_api), sono pienamente supportate in `system-icu`. Le funzionalità che richiedono in aggiunta i dati locali dell'ICU, come ad esempio [`Intl.DateTimeFormat`][] *possono* essere completamente o parzialmente supportate, a seconda della completezza dei dati ICU installati sul sistema.

### Incorpora un set limitato di dati ICU (`small-icu`)

Questa opzione rende statico il risultante collegamento binario con la libreria ICU e include un sottoinsieme di dati ICU (in genere solo le impostazioni internazionali in inglese) all'interno dell'eseguibile del `node`.

Funzionalità che richiedono solo la libreria ICU stessa, come [`String.prototype.normalize()`][] ed il [parser URL WHATWG](url.html#url_the_whatwg_url_api), sono pienamente supportate in `small-icu`. Le funzionalità che richiedono in aggiunta dati delle impostazioni internazionali dell'ICU, come ad esempio [`Intl.DateTimeFormat`][], generalmente funzionano solo con le impostazioni in inglese:

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

Questa modalità fornisce un buon bilanciamento tra funzionalità e dimensione binaria ed è il comportamento predefinito se non viene passato nessun flag ` --with-intl`. I binari ufficiali vengono costruiti anche in questa modalità.

#### Fornire dati ICU in fase di esecuzione

Se viene utilizzata l'opzione `small-icu`, è ancora possibile fornire dati locali aggiuntivi in ​​fase di runtime in modo che i metodi JS funzionino per tutte le versioni internazionali di ICU. Supponendo che il file di dati sia memorizzato in `/some/directory`, può essere reso disponibile in ICU tramite:

* La variabile di ambiente [`NODE_ICU_DATA`][]:

  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

* Il parametro CLI [`--icu-data-dir`][]:

  ```shell
  node --icu-data-dir=/some/directory
  ```

(Se sono specificati entrambi, il parametro CLI `--icu-data-dir` ha la precedenza.)

ICU è in grado di trovare e caricare automaticamente una varietà di formati di dati, ma i dati devono essere appropriati per la versione ICU ed il file denominato correttamente. The most common name for the data file is `icudt6X[bl].dat`, where `6X` denotes the intended ICU version, and `b` or `l` indicates the system's endianness. Controllare l'articolo ["Dati ICU"](http://userguide.icu-project.org/icudata) nella Guida dell'Utente ICU per altri formati supportati e per maggiori dettagli sui dati ICU in generale.

Il modulo npm [full-icu](https://www.npmjs.com/package/full-icu) può semplificare notevolmente l'installazione dei dati ICU rilevando la versione ICU del `node` eseguibile in esecuzione e scaricando il file di dati appropriato. Dopo aver installato il modulo tramite `npm i full-icu`, il file di dati sarà disponibile in `./node_modules/full-icu`. Questo percorso può essere quindi passato a `NODE_ICU_DATA` o `--icu-data-dir` come mostrato sopra per abilitare il supporto completo di `Intl`.

### Incorporare l'intera ICU (`full-icu`)

Questa opzione rende statico il risultante collegamento binario con l'ICU e include un set completo di dati ICU. Un binario creato in questo modo non ha altre dipendenze esterne e supporta tutte le versioni locali, tuttavia potrebbe essere piuttosto grande. Vedi [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) su come compilare un binario usando questa modalità.

## Rilevazione del supporto per l'internazionalizzazione

Per verificare che l'ICU sia abilitata completamente (`system-icu`, `small-icu` o `full-icu`), dovrebbe essere sufficiente verificare l'esistenza di `Intl`:

```js
const hasICU = typeof Intl === 'object';
```

In alternativa, funziona anche controllare `process.versions.icu`, una proprietà definita solo quando l'ICU è abilitata:

```js
const hasICU = typeof process.versions.icu === 'string';
```

[`Intl.DateTimeFormat`][] può essere un buon fattore distintivo per verificare il supporto ad una versione internazionale non in lingua inglese (ad esempio `full-icu` o `system-icu`):

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

Per ulteriori test dettagliati per il supporto `Intl`, è possibile trovare le seguenti risorse utili:

- [btest402](https://github.com/srl295/btest402): Generalmente utilizzato per verificare se Node.js con supporto `Intl` è stato creato correttamente.
- [Test262](https://github.com/tc39/test262/tree/master/test/intl402): l'insieme di test di conformità ufficiale di ECMAScript include una sezione dedicata a ECMA-402.
