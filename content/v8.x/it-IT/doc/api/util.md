# Util

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `util` è progettato principalmente per supportare le esigenze delle API interne di Node.js. Tuttavia, molte delle utilità sono funzionali anche per gli sviluppatori di applicazioni e moduli. Ci si può accedere utilizzando:

```js
const util = require('util');
```

## util.callbackify(original)
<!-- YAML
added: v8.2.0
-->

* `original` {Function} Una funzione `async`
* Restituisce: {Function} una funzione di tipo callback

Takes an `async` function (or a function that returns a Promise) and returns a function following the error-first callback style, i.e. taking a `(err, value) => ...` callback as the last argument. In the callback, the first argument will be the rejection reason (or `null` if the Promise resolved), and the second argument will be the resolved value.

Per esempio:

```js
const util = require('util');

async function fn() {
  return 'hello world';
}
const callbackFunction = util.callbackify(fn);

callbackFunction((err, ret) => {
  if (err) throw err;
  console.log(ret);
});
```

Stamperà:

```txt
hello world
```

*Note*:

* Il callback viene eseguito in modo asincrono e avrà una stack trace limitata. Se il callback genera, il processo emetterà un evento [`'uncaughtException'`][] e, se non gestito, uscirà.

* Poiché `null` ha un significato speciale come primo argomento di un callback, se una funzione di tipo wrapping rifiuta una `Promise` con un valore falso come motivo, il valore viene sottoposto al wrapping in un `Error` con il valore originale memorizzato in un campo chiamato `reason`.
  ```js
  function fn() {
    return Promise.reject(null);
  }
  const callbackFunction = util.callbackify(fn);

  callbackFunction((err, ret) => {
    // When the Promise was rejected with `null` it is wrapped with an Error and
    // the original value is stored in `reason`.
    err && err.hasOwnProperty('reason') && err.reason === null;  // true
  });
  ```

## util.debuglog(section)
<!-- YAML
added: v0.11.3
-->

* `section` {string} Una stringa che identifica la parte dell'applicazione per la quale viene creata la funzione `debuglog`.
* Restituisce: {Function} La funzione di registrazione

Il metodo `util.debuglog()` viene utilizzato per creare una funzione che scrive in modo condizionale i messaggi di debug su `stderr` in base all'esistenza della variabile di ambiente `NODE_DEBUG`. Se il nome della `section` appare all'interno del valore di tale variabile d'ambiente, allora la funzione restituita opera in modo simile a [`console.error()`][]. In caso contrario, la funzione restituita è un no-op.

Per esempio:

```js
const util = require('util');
const debuglog = util.debuglog('foo');

debuglog('hello from foo [%d]', 123);
```

Se questo programma viene eseguito con `NODE_DEBUG=foo` nell'ambiente, allora produrrà un risultato simile a:

```txt
FOO 3245: hello from foo [123]
```

in cui `3245` è l'id del processo. Se non viene eseguito con quella variabile d'ambiente impostata, allora non stamperà nulla.

Multiple comma-separated `section` names may be specified in the `NODE_DEBUG` environment variable. For example: `NODE_DEBUG=fs,net,tls`.

## util.deprecate(function, string)
<!-- YAML
added: v0.8.0
-->

The `util.deprecate()` method wraps the given `function` or class in such a way that it is marked as deprecated.
```js
const util = require('util');

exports.puts = util.deprecate(function() {
  for (let i = 0, len = arguments.length; i < len; ++i) {
    process.stdout.write(arguments[i] + '\n');
  }
}, 'util.puts: Use console.log instead');
```

When called, `util.deprecate()` will return a function that will emit a `DeprecationWarning` using the `process.on('warning')` event. By default, this warning will be emitted and printed to `stderr` exactly once, the first time it is called. After the warning is emitted, the wrapped `function` is called.

Se viene utilizzato uno dei due flag della riga di comando `--no-deprecation` o `--no-warnings` o se la proprietà `process.noDeprecation` viene impostata su `true` *antecedentemente* al primo avviso di deprecazione, il metodo `util.deprecate()` non esegue nulla.

Se i flag della riga di comando `--trace-deprecation` o `--trace-warnings` sono impostati o la proprietà `process.traceDeprecation` è impostata su `true`, la prima volta che viene chiamata la funzione deprecata vengono stampati su `stderr` un avviso ed una stack trace.

Se il flag della riga di comando `--throw-deprecation` viene impostato o se la proprietà `process.throwDeprecation` è impostata su `true`, allora verrà generata un'eccezione nel momento in cui viene chiamata la funzione deprecata.

Il flag della riga di comando `--throw-deprecation` e la proprietà `process.throwDeprecation` hanno la precedenza su `--trace-deprecation` e `process.traceDeprecation`.

## util.format(format[, ...args])<!-- YAML
added: v0.5.3
changes:
  - version: v8.4.0
    pr-url: https://github.com/nodejs/node/pull/14558
    description: The `%o` and `%O` specifiers are supported now.
-->* `format` {string} Una stringa di formato simile a `printf`.

Il metodo `util.format()` restituisce una stringa formattata utilizzando il primo argomento come un formato simile a `printf`.

Il primo argomento è una stringa contenente zero o più token *segnaposto*. Ogni token segnaposto viene sostituito con il valore convertito dall'argomento corrispondente. I segnaposto supportati sono:

* `%s` - String.
* `%d` - Number (integer or floating point value).
* `%i` - Numero intero.
* `%f` - Valore in virgola mobile.
* `%j` - JSON. Sostituito con la stringa `'[Circular]'` se l'argomento contiene riferimenti circolari.
* `%o` - Object. Una rappresentazione di stringa di un object con la formattazione generica di JavaScript object. Similar to `util.inspect()` with options `{ showHidden: true, depth: 4, showProxy: true }`. This will show the full object including non-enumerable symbols and properties.
* `%O` - Object. Una rappresentazione di stringa di un object con la formattazione generica di JavaScript object. Simile a `util.inspect()` senza opzioni. This will show the full object not including non-enumerable symbols and properties.
* `%%` - singolo segno di percentuale (`'%'`). Non consuma un argomento.

Se il segnaposto non ha un argomento corrispondente, il segnaposto non viene sostituito.

```js
util.format('%s:%s', 'foo');
// Restituisce: 'foo:%s'
```

Se sono presenti più argomenti passati al metodo `util.format()` rispetto al numero dei segnaposto, gli argomenti extra vengono forzati in stringhe e quindi concatenati alla stringa restituita, ciascuno delimitato da uno spazio. Gli argomenti in eccesso il cui `typeof` è `'object'` o `'symbol'` (eccetto `null`) verranno trasformati da `util.inspect()`.

```js
util.format('%s:%s', 'foo', 'bar', 'baz'); // 'foo:bar baz'
```

Se il primo argomento non è una stringa, allora `util.format()` restituisce una stringa che è la concatenazione di tutti gli argomenti separati da spazi. Ogni argomento viene convertito in una stringa utilizzando `util.inspect()`.

```js
util.format(1, 2, 3); // '1 2 3'
```

Se viene passato a `util.format()` un solo argomento, questo viene restituito così com'è senza alcuna formattazione.

```js
util.format('%% %s'); // '%% %s'
```

## util.getSystemErrorName(err)<!-- YAML
added: v8.12.0
-->* `err` {number}
* Restituisce: {string}

Restituisce il nome della stringa per un codice di errore numerico proveniente da un'API di Node.js. Il mapping tra codici di errore e nomi di errore è dipendente dalla piattaforma. Vedere [Errori di Sistema Comuni](errors.html#errors_common_system_errors) per i nomi degli errori comuni.

```js
fs.access('file/that/does/not/exist', (err) => {
  const name = util.getSystemErrorName(err.errno);
  console.error(name);  // ENOENT
});
```

## util.inherits(constructor, superConstructor)<!-- YAML
added: v0.3.0
changes:
  - version: v5.0.0
    pr-url: https://github.com/nodejs/node/pull/3455
    description: The `constructor` parameter can refer to an ES6 class now.
-->*Note*: Usage of `util.inherits()` is discouraged. Please use the ES6 `class` and `extends` keywords to get language level inheritance support. Notare inoltre che i due stili sono [semanticamente incompatibili](https://github.com/nodejs/node/issues/4179).

* `constructor` {Function}
* `superConstructor` {Function}

Ereditano i metodi del prototipo da un [constructor](https://developer.mozilla.org/en-US/JavaScript/Reference/Global_Objects/Object/constructor) all'altro. Il prototipo del `constructor` sarà impostato su un nuovo object creato da `superConstructor`.

Come ulteriore comodità, `superConstructor` sarà accessibile attraverso la proprietà `constructor.super_`.

```js
const util = require('util');
const EventEmitter = require('events');

function MyStream() {
  EventEmitter.call(this);
}

util.inherits(MyStream, EventEmitter);

MyStream.prototype.write = function(data) {
  this.emit('data', data);
};

const stream = new MyStream();

console.log(stream instanceof EventEmitter); // true
console.log(MyStream.super_ === EventEmitter); // true

stream.on('data', (data) => {
  console.log(`Received data: "${data}"`);
});
stream.write('It works!'); // Received data: "It works!"
```

ES6 example using `class` and `extends`

```js
const EventEmitter = require('events');

class MyStream extends EventEmitter {
  write(data) {
    this.emit('data', data);
  }
}

const stream = new MyStream();

stream.on('data', (data) => {
  console.log(`Received data: "${data}"`);
});
stream.write('With ES6');

```

## util.inspect(object[, options])<!-- YAML
added: v0.3.0
changes:
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8174
    description: Custom inspection functions can now return `this`.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7499
    description: The `breakLength` option is supported now.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6334
    description: The `maxArrayLength` option is supported now; in particular,
                 long arrays are truncated by default.
  - version: v6.1.0
    pr-url: https://github.com/nodejs/node/pull/6465
    description: The `showProxy` option is supported now.
-->* `object` {any} Any JavaScript primitive or Object.
* `options` {Object}
  * `showHidden` {boolean} If `true`, the `object`'s non-enumerable symbols and properties will be included in the formatted result. **Default:** `false`.
  * `depth` {number} Specifica il numero di volte che deve essere ripetuto durante la formattazione dell'`object`. È utile per ispezionare object complicati di grandi dimensioni. Defaults to `2`. Per farlo ripetere indefinitamente, passare `null`.
  * `colors` {boolean} Se `true`, l'output avrà uno stile con codici di colore ANSI. I colori sono personalizzabili, vedi [Customizing `util.inspect` colors][]. **Default:** `false`.
  * `customInspect` {boolean} If `false`, then custom `inspect(depth, opts)` functions exported on the `object` being inspected will not be called. **Default:** `true`.
  * `showProxy` {boolean} Se `true`, gli object e le funzioni che sono `Proxy` object saranno auto-esaminati per mostrare i loro `target` e `handler` object. **Default:** `false`.
  * `maxArrayLength` {number} Specifies the maximum number of array and `TypedArray` elements to include when formatting. Set to `null` to show all array elements. Set to `0` or negative to show no array elements. **Default:** `100`.
  * `breakLength` {number} La lunghezza alla quale le chiavi di un object vengono suddivise su più righe. Impostare su `Infinity` per formattare un object come una singola linea. **Default:** `60` for legacy compatibility.

The `util.inspect()` method returns a string representation of `object` that is primarily useful for debugging. Additional `options` may be passed that alter certain aspects of the formatted string.

L'esempio seguente ispeziona tutte le proprietà dell'`util` object:

```js
const util = require('util');

console.log(util.inspect(util, { showHidden: true, depth: null }));
```

I valori possono fornire le proprie funzioni di `inspect(depth, opts)` personalizzate, quando vengono chiamate queste ricevono la `depth` corrente nell'ispezione ricorsiva, nonché l'object delle opzioni passato a `util.inspect()`.

### Personalizzazione dei colori di `util.inspect`<!-- type=misc -->L'output a colori (se abilitato) di `util.inspect` è personalizzabile a livello globale tramite le proprietà `util.inspect.styles` e `util.inspect.colors`.

`util.inspect.styles` è una mappa che associa il nome di uno stile ad un colore di `util.inspect.colors`.

Gli stili predefiniti e i colori associati sono:

 * `number` - `yellow`
 * `boolean` - `yellow`
 * `string` - `green`
 * `date` - `magenta`
 * `regexp` - `red`
 * `null` - `bold`
 * `undefined` - `grey`
 * `special` - `cyan` (applicato solo alle funzioni in questo momento)
 * `name` - (senza stile)

I codici di colore predefiniti sono: `white`, `grey`, `black`, `blue`, `cyan`, `green`, `magenta`, `red` e `yellow`. Inoltre sono presenti i codici `bold`, `italic`, `underline` e `inverse`.

Lo stile del colore utilizza i codici di controllo ANSI che potrebbero non essere supportati su tutti i terminali.

### Funzioni di ispezione personalizzate sugli Object

<!-- type=misc -->

Gli Object possono inoltre definire la propria funzione `[util.inspect.custom](depth, opts)` (o l'equivalente ma deprecata `inspect(depth, opts)`) che `util.inspect()` invocherà e ne utilizzerà il risultato nel momento in cui ispezionerà l’object:

```js
const util = require('util');

class Box {
  constructor(value) {
    this.value = value;
  }

  [util.inspect.custom](depth, options) {
    if (depth < 0) {
      return options.stylize('[Box]', 'special');
    }

    const newOptions = Object.assign({}, options, {
      depth: options.depth === null ? null : options.depth - 1
    });

    // Padding di cinque spazi perché è la dimensione di "Box< ".
    const padding = ' '.repeat(5);
    const inner = util.inspect(this.value, newOptions)
                      .replace(/\n/g, `\n${padding}`);
    return `${options.stylize('Box', 'special')}< ${inner} >`;
  }
}

const box = new Box(true);

util.inspect(box);
// Restituisce: "Box< true >"
```

Le funzioni `[util.inspect.custom](depth, opts)` personalizzate in genere restituiscono una stringa tuttavia possono restituire un valore di qualsiasi tipo che verrà formattato di conseguenza da `util.inspect()`.

```js
const util = require('util');

const obj = { foo: 'this will not show up in the inspect() output' };
obj[util.inspect.custom] = (depth) => {
  return { bar: 'baz' };
};

util.inspect(obj);
// Restituisce: "{ bar: 'baz' }"
```

### util.inspect.custom<!-- YAML
added: v6.6.0
-->A Symbol that can be used to declare custom inspect functions, see [Custom inspection functions on Objects](#util_custom_inspection_functions_on_objects).

### util.inspect.defaultOptions<!-- YAML
added: v6.4.0
-->Il valore `defaultOptions` consente la personalizzazione delle opzioni predefinite utilizzate da `util.inspect`. Questo è utile per funzioni come `console.log` o `util.format` che chiamano implicitamente in `util.inspect`. Deve essere impostato su un object contenente una o più opzioni valide di [`util.inspect()`][]. Anche l'impostazione diretta delle proprietà delle opzioni è supportata.

```js
const util = require('util');
const arr = Array(101).fill(0);

console.log(arr); // registra l'array troncato
util.inspect.defaultOptions.maxArrayLength = null;
console.log(arr); // registra l'array completo
```

## util.promisify(original)<!-- YAML
added: v8.0.0
-->* `original` {Function}
* Restituisce: {Function}

Takes a function following the common error-first callback style, i.e. taking a `(err, value) => ...` callback as the last argument, and returns a version that returns promises.

Per esempio:

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);
stat('.').then((stats) => {
  // Eseguire le istruzioni con `stats`
}).catch((error) => {
  //Gestire l'errore.
});
```

Oppure, utilizzando in modo equivalente le `async function`:

```js
const util = require('util');
const fs = require('fs');

const stat = util.promisify(fs.stat);

async function callStat() {
  const stats = await stat('.');
  console.log(`This directory is owned by ${stats.uid}`);
}
```

Se è presente una proprietà `original[util.promisify.custom]`, `promisify` restituirà il suo valore; vedere [Funzioni promisified personalizzate](#util_custom_promisified_functions).

`promisify()` presuppone che `original` sia una funzione che prende un callback come argomento finale in tutti i casi. Se `original` non è una funzione, `promisify()` genererà un errore. Se `original` è una funzione ma il suo ultimo argomento non è un error-first callback, verrà comunque passato un error-first callback come suo ultimo argomento.

### Funzioni promisified personalizzate

Usando il simbolo `util.promisify.custom` si può sovrascrivere il valore restituito di [`util.promisify()`][]:

```js
const util = require('util');

function doSomething(foo, callback) {
  // ...
}

doSomething[util.promisify.custom] = (foo) => {
  return getPromiseSomehow();
};

const promisified = util.promisify(doSomething);
console.log(promisified === doSomething[util.promisify.custom]);
// stampa 'true'
```

Questo può essere utile nei casi in cui la funzione originale non segue il formato standard di prendere un first-error callback come ultimo argomento.

For example, with a function that takes in `(foo, onSuccessCallback, onErrorCallback)`:

```js
doSomething[util.promisify.custom] = (foo) => {
  return new Promise((resolve, reject) => {
    doSomething(foo, resolve, reject);
  });
};
```
Se `promisify.custom` è definito ma non è una funzione, `promisify()` genererà un errore.

### util.promisify.custom
<!-- YAML
added: v8.0.0
-->

* {symbol}

A Symbol that can be used to declare custom promisified variants of functions, see [Custom promisified functions](#util_custom_promisified_functions).

## Class: util.TextDecoder<!-- YAML
added: v8.3.0
-->Un'implementazione dell'API `TextDecoder` dello [Standard di Codifica WHATWG](https://encoding.spec.whatwg.org/).

```js
const decoder = new TextDecoder('shift_jis');
let string = '';
let buffer;
while (buffer = getNextChunkSomehow()) {
  string += decoder.decode(buffer, { stream: true });
}
string += decoder.decode(); // end-of-stream
```

### Codifiche Supportate da WHATWG

Secondo lo [Standard di Codifica WHATWG](https://encoding.spec.whatwg.org/), le codifiche supportate dall'API di `TextDecoder` sono descritte nelle tabelle seguenti. Per ogni codifica, possono essere usati uno o più alias.

Diverse configurazioni di build Node.js supportano diversi set di codifiche. Sebbene sia supportata una serie di codifiche molto basiche anche sui build Node.js senza ICU abilitata, il supporto per alcune codifiche viene fornito solo quando Node.js viene costruito con ICU e utilizza i dati ICU completi (vedere [Internazionalizzazione](intl.html)).

#### Codifiche Supportate Senza ICU

| Codifica     | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |

#### Codifiche Supportate per Impostazione Predefinita (Con ICU)

| Codifica     | Alias                           |
| ------------ | ------------------------------- |
| `'utf-8'`    | `'unicode-1-1-utf-8'`, `'utf8'` |
| `'utf-16le'` | `'utf-16'`                      |
| `'utf-16be'` |                                 |

#### Codifiche che Richiedono Dati ICU Completi

| Codifica           | Alias                                                                                                                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'ibm866'`         | `'866'`, `'cp866'`, `'csibm866'`                                                                                                                                                                                                    |
| `'iso-8859-2'`     | `'csisolatin2'`, `'iso-ir-101'`, `'iso8859-2'`, `'iso88592'`, `'iso_8859-2'`, `'iso_8859-2:1987'`, `'l2'`, `'latin2'`                                                                                                               |
| `'iso-8859-3'`     | `'csisolatin3'`, `'iso-ir-109'`, `'iso8859-3'`, `'iso88593'`, `'iso_8859-3'`, `'iso_8859-3:1988'`, `'l3'`, `'latin3'`                                                                                                               |
| `'iso-8859-4'`     | `'csisolatin4'`, `'iso-ir-110'`, `'iso8859-4'`, `'iso88594'`, `'iso_8859-4'`, `'iso_8859-4:1988'`, `'l4'`, `'latin4'`                                                                                                               |
| `'iso-8859-5'`     | `'csisolatincyrillic'`, `'cyrillic'`, `'iso-ir-144'`, `'iso8859-5'`, `'iso88595'`, `'iso_8859-5'`, `'iso_8859-5:1988'`                                                                                                              |
| `'iso-8859-6'`     | `'arabic'`, `'asmo-708'`, `'csiso88596e'`, `'csiso88596i'`, `'csisolatinarabic'`, `'ecma-114'`, `'iso-8859-6-e'`, `'iso-8859-6-i'`, `'iso-ir-127'`, `'iso8859-6'`, `'iso88596'`, `'iso_8859-6'`, `'iso_8859-6:1987'`                |
| `'iso-8859-7'`     | `'csisolatingreek'`, `'ecma-118'`, `'elot_928'`, `'greek'`, `'greek8'`, `'iso-ir-126'`, `'iso8859-7'`, `'iso88597'`, `'iso_8859-7'`, `'iso_8859-7:1987'`, `'sun_eu_greek'`                                                          |
| `'iso-8859-8'`     | `'csiso88598e'`, `'csisolatinhebrew'`, `'hebrew'`, `'iso-8859-8-e'`, `'iso-ir-138'`, `'iso8859-8'`, `'iso88598'`, `'iso_8859-8'`, `'iso_8859-8:1988'`, `'visual'`                                                                   |
| `'iso-8859-8-i'`   | `'csiso88598i'`, `'logical'`                                                                                                                                                                                                        |
| `'iso-8859-10'`    | `'csisolatin6'`, `'iso-ir-157'`, `'iso8859-10'`, `'iso885910'`, `'l6'`, `'latin6'`                                                                                                                                                  |
| `'iso-8859-13'`    | `'iso8859-13'`, `'iso885913'`                                                                                                                                                                                                       |
| `'iso-8859-14'`    | `'iso8859-14'`, `'iso885914'`                                                                                                                                                                                                       |
| `'iso-8859-15'`    | `'csisolatin9'`, `'iso8859-15'`, `'iso885915'`, `'iso_8859-15'`, `'l9'`                                                                                                                                                             |
| `'koi8-r'`         | `'cskoi8r'`, `'koi'`, `'koi8'`, `'koi8_r'`                                                                                                                                                                                          |
| `'koi8-u'`         | `'koi8-ru'`                                                                                                                                                                                                                         |
| `'macintosh'`      | `'csmacintosh'`, `'mac'`, `'x-mac-roman'`                                                                                                                                                                                           |
| `'windows-874'`    | `'dos-874'`, `'iso-8859-11'`, `'iso8859-11'`, `'iso885911'`, `'tis-620'`                                                                                                                                                            |
| `'windows-1250'`   | `'cp1250'`, `'x-cp1250'`                                                                                                                                                                                                            |
| `'windows-1251'`   | `'cp1251'`, `'x-cp1251'`                                                                                                                                                                                                            |
| `'windows-1252'`   | `'ansi_x3.4-1968'`, `'ascii'`, `'cp1252'`, `'cp819'`, `'csisolatin1'`, `'ibm819'`, `'iso-8859-1'`, `'iso-ir-100'`, `'iso8859-1'`, `'iso88591'`, `'iso_8859-1'`, `'iso_8859-1:1987'`, `'l1'`, `'latin1'`, `'us-ascii'`, `'x-cp1252'` |
| `'windows-1253'`   | `'cp1253'`, `'x-cp1253'`                                                                                                                                                                                                            |
| `'windows-1254'`   | `'cp1254'`, `'csisolatin5'`, `'iso-8859-9'`, `'iso-ir-148'`, `'iso8859-9'`, `'iso88599'`, `'iso_8859-9'`, `'iso_8859-9:1989'`, `'l5'`, `'latin5'`, `'x-cp1254'`                                                                     |
| `'windows-1255'`   | `'cp1255'`, `'x-cp1255'`                                                                                                                                                                                                            |
| `'windows-1256'`   | `'cp1256'`, `'x-cp1256'`                                                                                                                                                                                                            |
| `'windows-1257'`   | `'cp1257'`, `'x-cp1257'`                                                                                                                                                                                                            |
| `'windows-1258'`   | `'cp1258'`, `'x-cp1258'`                                                                                                                                                                                                            |
| `'x-mac-cyrillic'` | `'x-mac-ukrainian'`                                                                                                                                                                                                                 |
| `'gbk'`            | `'chinese'`, `'csgb2312'`, `'csiso58gb231280'`, `'gb2312'`, `'gb_2312'`, `'gb_2312-80'`, `'iso-ir-58'`, `'x-gbk'`                                                                                                                   |
| `'gb18030'`        |                                                                                                                                                                                                                                     |
| `'big5'`           | `'big5-hkscs'`, `'cn-big5'`, `'csbig5'`, `'x-x-big5'`                                                                                                                                                                               |
| `'euc-jp'`         | `'cseucpkdfmtjapanese'`, `'x-euc-jp'`                                                                                                                                                                                               |
| `'iso-2022-jp'`    | `'csiso2022jp'`                                                                                                                                                                                                                     |
| `'shift_jis'`      | `'csshiftjis'`, `'ms932'`, `'ms_kanji'`, `'shift-jis'`, `'sjis'`, `'windows-31j'`, `'x-sjis'`                                                                                                                                       |
| `'euc-kr'`         | `'cseuckr'`, `'csksc56011987'`, `'iso-ir-149'`, `'korean'`, `'ks_c_5601-1987'`, `'ks_c_5601-1989'`, `'ksc5601'`, `'ksc_5601'`, `'windows-949'`                                                                                      |

*Note*: The `'iso-8859-16'` encoding listed in the [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/) is not supported.

### new TextDecoder([encoding[, options]])

* `encoding` {string} Identifica l'`encoding` che questa istanza `TextDecoder` supporta. **Default:** `'utf-8'`.
* `options` {Object}
  * `fatal` {boolean} `true` se i fallimenti di decodifica sono fatali. Questa opzione è supportata esclusivamente quando l'ICU è abilitata (vedi [Internazionalizzazione](intl.html)). **Default:** `false`.
  * `ignoreBOM` {boolean} Quando è `true`, il `TextDecoder` includerà il segno di ordine dei byte nel risultato decodificato. Se `false`, il segno di ordine dei byte verrà rimosso dall'output. Questa opzione è usata esclusivamente quando l'`encoding` è `'utf-8'`, `'utf-16be'` o `'utf-16le'`. **Default:** `false`.

Crea una nuova istanza `TextDecoder`. L'`encoding` può specificare una delle codifiche supportate o un alias.

### textDecoder.decode([input[, options]])

* `input` {ArrayBuffer|DataView|TypedArray} An `ArrayBuffer`, `DataView` or Typed Array instance containing the encoded data.
* `options` {Object}
  * `stream` {boolean} `true` se sono previsti chunk di dati aggiuntivi. **Default:** `false`.
* Restituisce: {string}

Decodifica l'`input` e restituisce una stringa. Se `options.stream` è `true`, qualsiasi sequenza di byte incompleta che si verifica alla fine dell'`input` viene memorizzata nel buffer internamente ed emessa dopo la successiva chiamata a `textDecoder.decode()`.

Se `textDecoder.fatal` è `true`, gli errori di decodifica che si verificano si tradurranno nella generazione di un `TypeError`.

### textDecoder.encoding

* {string}

La codifica supportata dall'istanza `TextDecoder`.

### textDecoder.fatal

* {boolean}

Il valore sarà `true` se gli errori di decodifica danno come risultato la generazione di un `TypeError`.

### textDecoder.ignoreBOM

* {boolean}

Il valore sarà `true` se il risultato della decodifica includerà il segno di ordine dei byte.

## Class: util.TextEncoder
<!-- YAML
added: v8.3.0
-->

Un'implementazione dell'API `TextEncoder` dello [Standard di Codifica WHATWG](https://encoding.spec.whatwg.org/). Tutte le istanze di `TextEncoder` supportano esclusivamente la codifica UTF-8.

```js
const encoder = new TextEncoder();
const uint8array = encoder.encode('this is some data');
```

### textEncoder.encode([input])

* `input` {string} Il testo da codificare. **Default:** una stringa vuota.
* Restituisce: {Uint8Array}

UTF-8 codifica la stringa di `input` e restituisce un `Uint8Array` contenente i byte codificati.

### textEncoder.encoding

* {string}

La codifica supportata dall'istanza `TextEncoder`. Impostata sempre su `'utf-8'`.

## API obsoleti

Le seguenti API sono state deprecate e non dovrebbero più essere utilizzate. Le applicazioni e i moduli presenti dovrebbero essere aggiornati per trovare approcci alternativi.

### util.\_extend(target, source)<!-- YAML
added: v0.7.5
deprecated: v6.0.0
-->> Stabilità: 0 - Deprecato: Utilizza [`Object.assign()`] al suo posto.

Il metodo `util._extend()` non è mai stato destinato ad un utilizzo al di fuori dei moduli interni di Node.js. Tuttavia la comunità l'ha trovato e utilizzato ugualmente.

E' deprecato e non dovrebbe essere utilizzato in un nuovo codice. JavaScript ha disponibile una funzionalità incorporata molto simile tramite [`Object.assign()`].

### util.debug(string)<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stabilità: 0 - Deprecato: Utilizza [`console.error()`][] al suo posto.

* `string` {string} Il messaggio da stampare su `stderr`

Predecessore deprecato di `console.error`.

### util.error([...strings])
<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Stabilità: 0 - Deprecato: Utilizza [`console.error()`][] al suo posto.

* `...strings` {string} Il messaggio da stampare su `stderr`

Predecessore deprecato di `console.error`.

### util.isArray(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stabilità: 0 - Obsoleto

* `object` {any}

Internal alias for [`Array.isArray`][].

Restituisce `true` se l'`object` indicato è un `Array`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isArray([]);
// Restituisce: true
util.isArray(new Array());
// Restituisce: true
util.isArray({});
// Restituisce: false
```

### util.isBoolean(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è un `Boolean`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isBoolean(1);
// Restituisce: false
util.isBoolean(0);
// Restituisce: false
util.isBoolean(false);
// Restituisce: true
```

### util.isBuffer(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Deprecato: Utilizza [`Buffer.isBuffer()`][] al suo posto.

* `object` {any}

Restituisce `true` se l'`object` indicato è un `Buffer`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isBuffer({ length: 0 });
// Restituisce: false
util.isBuffer([]);
// Restituisce: false
util.isBuffer(Buffer.from('hello world'));
// Restituisce: true
```

### util.isDate(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è una `Date`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isDate(new Date());
// Restituisce: true
util.isDate(Date());
// false (senza 'new' restituisce una Stringa)
util.isDate({});
// Restituisce: false
```

### util.isError(object)
<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è un [`Error`][]. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isError(new Error());
// Restituisce: true
util.isError(new TypeError());
// Restituisce: true
util.isError({ name: 'Error', message: 'an error occurred' });
// Restituisce: false
```

Notare che questo metodo dipende dal comportamento di `Object.prototype.toString()`. È possibile ottenere un risultato inesatto quando l'argomento dell'`object` manipola `@@toStringTag`.

```js
const util = require('util');
const obj = { name: 'Error', message: 'an error occurred' };

util.isError(obj);
// Restituisce: false
obj[Symbol.toStringTag] = 'Error';
util.isError(obj);
// Restituisce: true
```

### util.isFunction(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è una `Function`. In caso contrario, restituisce `false`.

```js
const util = require('util');

function Foo() {}
const Bar = () => {};

util.isFunction({});
// Restituisce: false
util.isFunction(Foo);
// Restituisce: true
util.isFunction(Bar);
// Restituisce: true
```

### util.isNull(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è rigorosamente `null`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isNull(0);
// Restituisce: false
util.isNull(undefined);
// Restituisce: false
util.isNull(null);
// Restituisce: true
```

### util.isNullOrUndefined(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è `null` o `undefined`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isNullOrUndefined(0);
// Restituisce: false
util.isNullOrUndefined(undefined);
// Restituisce: true
util.isNullOrUndefined(null);
// Restituisce: true
```

### util.isNumber(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è un `Number`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isNumber(false);
// Restituisce: false
util.isNumber(Infinity);
// Restituisce: true
util.isNumber(0);
// Restituisce: true
util.isNumber(NaN);
// Restituisce: true
```

### util.isObject(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Returns `true` if the given `object` is strictly an `Object` **and** not a `Function`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isObject(5);
// Returns: false
util.isObject(null);
// Returns: false
util.isObject({});
// Returns: true
util.isObject(function() {});
// Returns: false
```

### util.isPrimitive(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è un tipo primitivo. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isPrimitive(5);
// Returns: true
util.isPrimitive('foo');
// Returns: true
util.isPrimitive(false);
// Returns: true
util.isPrimitive(null);
// Returns: true
util.isPrimitive(undefined);
// Returns: true
util.isPrimitive({});
// Returns: false
util.isPrimitive(function() {});
// Returns: false
util.isPrimitive(/^$/);
// Returns: false
util.isPrimitive(new Date());
// Returns: false
```

### util.isRegExp(object)<!-- YAML
added: v0.6.0
deprecated: v4.0.0
-->> Stabilità: 0 - Deprecato

* `object` {any}

Restituisce `true` se l'`object` indicato è un `RegExp`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isRegExp(/some regexp/);
// Restituisce: true
util.isRegExp(new RegExp('another regexp'));
// Restituisce: true
util.isRegExp({});
// Restituisce: false
```

### util.isString(object)<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è una `string`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isString('');
// Restituisce: true
util.isString('foo');
// Restituisce: true
util.isString(String('foo'));
// Restituisce: true
util.isString(5);
// Restituisce: false
```

### util.isSymbol(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è un `Symbol`. In caso contrario, restituisce `false`.

```js
const util = require('util');

util.isSymbol(5);
// Restituisce: false
util.isSymbol('foo');
// Restituisce: false
util.isSymbol(Symbol('foo'));
// Restituisce: true
```

### util.isUndefined(object)
<!-- YAML
added: v0.11.5
deprecated: v4.0.0
-->

> Stabilità: 0 - Obsoleto

* `object` {any}

Restituisce `true` se l'`object` indicato è `undefined`. In caso contrario, restituisce `false`.

```js
const util = require('util');

const foo = undefined;
util.isUndefined(5);
// Restituisce: false
util.isUndefined(foo);
// Restituisce: true
util.isUndefined(null);
// Restituisce: false
```

### util.log(string)<!-- YAML
added: v0.3.0
deprecated: v6.0.0
-->> Stabilità: 0 - Deprecato: Utilizza un modulo di terze parti al suo posto.

* `string` {string}

Il metodo `util.log()` stampa la `string` indicata su `stdout` con un timestamp incluso.

```js
const util = require('util');

util.log('Timestamped message.');
```

### util.print([...strings])<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->> Stabilità: 0 - Deprecato: Utilizza [`console.log()`][] al suo posto.

Predecessore obsoleto di `console.log`.

### util.puts([...strings])
<!-- YAML
added: v0.3.0
deprecated: v0.11.3
-->

> Stabilità: 0 - Deprecato: Utilizza [`console.log()`][] al suo posto.

Predecessore obsoleto di `console.log`.
