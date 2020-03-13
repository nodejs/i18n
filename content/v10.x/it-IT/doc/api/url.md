# URL

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `url` fornisce utility per la risoluzione e l'analisi dell'URL. Ci si può accedere utilizzando:

```js
const url = require('url');
```

## Stringhe URL e URL Objects

Una stringa URL è una stringa strutturata contenente più componenti significativi. Quando analizzato, viene restituito un URL object contenente proprietà per ciascuno di questi componenti.

Il modulo `url` fornisce due API per lavorare con gli URL: un'API legacy specifica per Node.js ed un'API più recente che implementa lo stesso [WHATWG URL Standard](https://url.spec.whatwg.org/) utilizzato dai browser web.

Sebbene l'API Legacy non sia stata deprecata, viene mantenuta esclusivamente per la compatibilità con le versioni precedenti delle applicazioni esistenti. Il nuovo codice dell'applicazione deve utilizzare l'API WHATWG.

Di seguito viene fornito un confronto tra le API WHATWG e Legacy. Above the URL `'http://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'`, properties of an object returned by the legacy `url.parse()` are shown. Sotto di esso si trovano le proprietà di un WHATWG `URL` object.

La proprietà `origin` del WHATWG URL include `protocol` e `host` ma non `username` o `password`.

```txt
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                              href                                              │
├──────────┬──┬─────────────────────┬────────────────────────┬───────────────────────────┬───────┤
│ protocol │  │        auth         │          host          │           path            │ hash  │
│          │  │                     ├─────────────────┬──────┼──────────┬────────────────┤       │
│          │  │                     │    hostname     │ port │ pathname │     search     │       │
│          │  │                     │                 │      │          ├─┬──────────────┤       │
│          │  │                     │                 │      │          │ │    query     │       │
"  https:   //    user   :   pass   @ sub.example.com : 8080   /p/a/t/h  ?  query=string   #hash "
│          │  │          │          │    hostname     │ port │          │                │       │
│          │  │          │          ├─────────────────┴──────┤          │                │       │
│ protocol │  │ username │ password │          host          │          │                │       │
├──────────┴──┼──────────┴──────────┼────────────────────────┤          │                │       │
│   origin    │                     │         origin         │ pathname │     search     │ hash  │
├─────────────┴─────────────────────┴────────────────────────┴──────────┴────────────────┴───────┤
│                                              href                                              │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
(all spaces in the "" line should be ignored — they are purely for formatting)
```

Analisi della stringa URL utilizzando l'API WHATWG:

```js
const myURL =
  new URL('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');
```

Analisi della stringa URL utilizzando l'API Legacy:

```js
const url = require('url');
const myURL =
  url.parse('https://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash');
```

## L'API di WHATWG URL

### Class: URL
<!-- YAML
added:
  - v7.0.0
  - v6.13.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

Classe `URL` compatibile con browser, implementata seguendo il WHATWG URL Standard. [Esempi di URL analizzati](https://url.spec.whatwg.org/#example-url-parsing) possono essere trovati nello Standard stesso. The `URL` class is also available on the global object.

In accordance with browser conventions, all properties of `URL` objects are implemented as getters and setters on the class prototype, rather than as data properties on the object itself. Thus, unlike [legacy `urlObject`][]s, using the `delete` keyword on any properties of `URL` objects (e.g. `delete
myURL.protocol`, `delete myURL.pathname`, etc) has no effect but will still return `true`.

#### Constructor: new URL(input[, base])

* `input` {string} The absolute or relative input URL to parse. If `input` is relative, then `base` is required. If `input` is absolute, the `base` is ignored.
* `base` {string|URL} L'URL di base da risolvere se l'`input` non è assoluto.

Crea un nuovo `URL` object analizzando l'`input` relativo alla `base`. Se la `base` viene passata come stringa, verrà analizzata in modo equivalente a `new URL(base)`.

```js
const myURL = new URL('/foo', 'https://example.org/');
// https://example.org/foo
```

Verrà generato un `TypeError` se l'`input` o la `base` non sono URL validi. Notare che ci si impegnerà a forzare i valori indicati affinché si convertano in stringhe. Ad esempio:

```js
const myURL = new URL({ toString: () => 'https://example.org/' });
// https://example.org/
```

I caratteri Unicode che appaiono all'interno dell'hostname di `input` verranno automaticamente convertiti in ASCII utilizzando l'algoritmo [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4).

```js
const myURL = new URL('https://測試');
// https://xn--g6w251d/
```

This feature is only available if the `node` executable was compiled with [ICU](intl.html#intl_options_for_building_node_js) enabled. In caso contrario, i nomi di dominio vengono passati invariati.

In cases where it is not known in advance if `input` is an absolute URL and a `base` is provided, it is advised to validate that the `origin` of the `URL` object is what is expected.

```js
let myURL = new URL('http://Example.com/', 'https://example.org/');
// http://example.com/

myURL = new URL('https://Example.com/', 'https://example.org/');
// https://example.com/

myURL = new URL('foo://Example.com/', 'https://example.org/');
// foo://Example.com/

myURL = new URL('http:Example.com/', 'https://example.org/');
// http://example.com/

myURL = new URL('https:Example.com/', 'https://example.org/');
// https://example.org/Example.com/

myURL = new URL('foo:Example.com/', 'https://example.org/');
// foo:Example.com/
```

#### url.hash

* {string}

Ottiene e imposta la parte frammento dell'URL.

```js
const myURL = new URL('https://example.org/foo#bar');
console.log(myURL.hash);
// Stampa #bar

myURL.hash = 'baz';
console.log(myURL.href);
// Stampa https://example.org/foo#baz
```

I caratteri URL non validi inclusi nel valore assegnato alla proprietà `hash` sono [percent-encoded](#whatwg-percent-encoding). Notare che la selezione dei caratteri da codificare in percentuale può variare leggermente da ciò che produrrebbero i metodi [`url.parse()`][] e [`url.format()`][].

#### url.host

* {string}

Ottiene e imposta la parte host dell'URL.

```js
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.host);
// Stampa example.org:81

myURL.host = 'example.com:82';
console.log(myURL.href);
// Stampa https://example.com:82/foo
```

I valori host non validi assegnati alla proprietà `host` vengono ignorati.

#### url.hostname

* {string}

Ottiene e imposta la parte hostname dell'URL. La differenza chiave tra `url.host` e `url.hostname` è che `url.hostname` *non* include la porta.

```js
const myURL = new URL('https://example.org:81/foo');
console.log(myURL.hostname);
// Stampa example.org

myURL.hostname = 'example.com:82';
console.log(myURL.href);
// Stampa https://example.com:81/foo
```

I valori degli hostname non validi assegnati alla proprietà `hostname` vengono ignorati.

#### url.href

* {string}

Ottiene e imposta l'URL serializzato.

```js
const myURL = new URL('https://example.org/foo');
console.log(myURL.href);
// Stampa https://example.org/foo

myURL.href = 'https://example.com/bar';
console.log(myURL.href);
// Stampa https://example.com/bar
```

Ottenere il valore della proprietà `href` equivale a chiamare [`url.toString()`][].

L'impostazione del valore di questa proprietà su un nuovo valore equivale alla creazione di un nuovo `URL` object utilizzando [`new URL(value)`][`new URL()`]. Ogni proprietà dell'`URL` object verrà modificata.

Se il valore assegnato alla proprietà `href` non è un URL valido, verrà generato un `TypeError`.

#### url.origin

* {string}

Ottiene la serializzazione di sola lettura dell'origine dell'URL.

```js
const myURL = new URL('https://example.org/foo/bar?baz');
console.log(myURL.origin);
// Stampa https://example.org
```

```js
const idnURL = new URL('https://測試');
console.log(idnURL.origin);
// Prints https://xn--g6w251d

console.log(idnURL.hostname);
// Prints xn--g6w251d
```

#### url.password

* {string}

Ottiene e imposta la parte password dell'URL.

```js
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.password);
// Stampa xyz

myURL.password = '123';
console.log(myURL.href);
// Stampa https://abc:123@example.com
```

I caratteri URL non validi inclusi nel valore assegnato alla proprietà della `password` sono [percent-encoded](#whatwg-percent-encoding). Notare che la selezione dei caratteri da codificare in percentuale può variare leggermente da ciò che produrrebbero i metodi [`url.parse()`][] e [`url.format()`][].

#### url.pathname

* {string}

Ottiene e imposta la parte percorso dell'URL.

```js
const myURL = new URL('https://example.org/abc/xyz?123');
console.log(myURL.pathname);
// Stampa /abc/xyz

myURL.pathname = '/abcdef';
console.log(myURL.href);
// Stampa https://example.org/abcdef?123
```

I caratteri URL non validi inclusi nel valore assegnato alla proprietà `pathname` sono [percent-encoded](#whatwg-percent-encoding). Notare che la selezione dei caratteri da codificare in percentuale può variare leggermente da ciò che produrrebbero i metodi [`url.parse()`][] e [`url.format()`][].

#### url.port

* {string}

Ottiene e imposta la parte porta dell'URL.

The port value may be a number or a string containing a number in the range `0` to `65535` (inclusive). Setting the value to the default port of the `URL` objects given `protocol` will result in the `port` value becoming the empty string (`''`).

The port value can be an empty string in which case the port depends on the protocol/scheme:

| protocol | port |
|:-------- |:---- |
| "ftp"    | 21   |
| "file"   |      |
| "gopher" | 70   |
| "http"   | 80   |
| "https"  | 443  |
| "ws"     | 80   |
| "wss"    | 443  |

Upon assigning a value to the port, the value will first be converted to a string using `.toString()`.

If that string is invalid but it begins with a number, the leading number is assigned to `port`. If the number lies outside the range denoted above, it is ignored.

```js
const myURL = new URL('https://example.org:8888');
console.log(myURL.port);
// Stampa 8888

// Le porte predefinite vengono automaticamente trasformate nella stringa vuota
// (La porta di default del protocollo HTTPS è la 443)
myURL.port = '443';
console.log(myURL.port);
// Stampa la stringa vuota
console.log(myURL.href);
// Stampa https://example.org/

myURL.port = 1234;
console.log(myURL.port);
// Stampa 1234
console.log(myURL.href);
// Stampa https://example.org:1234/

// Le stringhe di porte totalmente non valide vengono ignorate
myURL.port = 'abcd';
console.log(myURL.port);
// Stampa 1234

// I numeri iniziali vengono trattati come numeri di porte
myURL.port = '5678abcd';
console.log(myURL.port);
// Stampa 5678

// I numeri non interi vengono troncati
myURL.port = 1234.5678;
console.log(myURL.port);
// Stampa 1234

// I numeri fuori dall'intervallo che non sono rappresentati nella notazione scientifica 
// verranno ignorati.
myURL.port = 1e10; // 10000000000, verrà verificato se rientra nell'intervallo come descritto sotto
console.log(myURL.port);
// Stampa 1234
```

Note that numbers which contain a decimal point, such as floating-point numbers or numbers in scientific notation, are not an exception to this rule. Leading numbers up to the decimal point will be set as the URL's port, assuming they are valid:

```js
myURL.port = 4.567e21;
console.log(myURL.port);
// Stampa 4 (perché è il numero iniziale nella stringa '4.567e21')
```

#### url.protocol

* {string}

Ottiene e imposta la parte protocollo dell'URL.

```js
const myURL = new URL('https://example.org');
console.log(myURL.protocol);
// Stampa https:

myURL.protocol = 'ftp';
console.log(myURL.href);
// Stampa ftp://example.org/
```

I valori del protocollo URL non validi assegnati alla proprietà `protocol` vengono ignorati.

##### Special Schemes

The [WHATWG URL Standard](https://url.spec.whatwg.org/) considers a handful of URL protocol schemes to be _special_ in terms of how they are parsed and serialized. When a URL is parsed using one of these special protocols, the `url.protocol` property may be changed to another special protocol but cannot be changed to a non-special protocol, and vice versa.

For instance, changing from `http` to `https` works:

```js
const u = new URL('http://example.org');
u.protocol = 'https';
console.log(u.href);
// https://example.org
```

However, changing from `http` to a hypothetical `fish` protocol does not because the new protocol is not special.

```js
const u = new URL('http://example.org');
u.protocol = 'fish';
console.log(u.href);
// http://example.org
```

Likewise, changing from a non-special protocol to a special protocol is also not permitted:

```js
const u = new URL('fish://example.org');
u.protocol = 'http';
console.log(u.href);
// fish://example.org
```

The protocol schemes considered to be special by the WHATWG URL Standard include: `ftp`, `file`, `gopher`, `http`, `https`, `ws`, and `wss`.

#### url.search

* {string}

Ottiene e imposta la parte query serializzata dell'URL.

```js
const myURL = new URL('https://example.org/abc?123');
console.log(myURL.search);
// Prints ?123

myURL.search = 'abc=xyz';
console.log(myURL.href);
// Prints https://example.org/abc?abc=xyz
```

Tutti i caratteri URL non validi che appaiono nel valore assegnato alla proprietà `search` saranno [percent-encoded](#whatwg-percent-encoding). Notare che la selezione dei caratteri da codificare in percentuale può variare leggermente da ciò che produrrebbero i metodi [`url.parse()`][] e [`url.format()`][].

#### url.searchParams

* {URLSearchParams}

Ottiene l'[`URLSearchParams`][] object che rappresenta i parametri di query dell'URL. Questa proprietà è di sola lettura; per sostituire la totalità dei parametri di query dell'URL, utilizza l'[`url.search`][] setter. Consultare la documentazione di [`URLSearchParams`][] per i dettagli.

#### url.username

* {string}

Ottiene e imposta la parte username dell'URL.

```js
const myURL = new URL('https://abc:xyz@example.com');
console.log(myURL.username);
// Prints abc

myURL.username = '123';
console.log(myURL.href);
// Prints https://123:xyz@example.com/
```

Tutti i caratteri URL non validi che appaiono nel valore assegnato alla proprietà `username` saranno [percent-encoded](#whatwg-percent-encoding). Notare che la selezione dei caratteri da codificare in percentuale può variare leggermente da ciò che produrrebbero i metodi [`url.parse()`][] e [`url.format()`][].

#### url.toString()

* Restituisce: {string}

Il metodo `toString()` sull'`URL` object restituisce l'URL serializzato. Il valore restituito è equivalente a quello di [`url.href`][] e di [`url.toJSON()`][].

A causa della necessità di conformità standard, questo metodo non consente agli utenti di personalizzare il processo di serializzazione dell'URL. Per maggiore flessibilità, potrebbe essere interessante il metodo [`require('url').format()`][].

#### url.toJSON()

* Restituisce: {string}

Il metodo `toJSON()` sull'`URL` object restituisce l'URL serializzato. Il valore restituito è equivalente a quello di [`url.href`][] e di [`url.toString()`][].

Questo metodo viene chiamato automaticamente quando un `URL` object viene serializzato con [`JSON.stringify()`][].

```js
const myURLs = [
  new URL('https://www.example.com'),
  new URL('https://test.example.org')
];
console.log(JSON.stringify(myURLs));
// Prints ["https://www.example.com/","https://test.example.org/"]
```

### Class: URLSearchParams
<!-- YAML
added:
  - v7.5.0
  - v6.13.0
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/18281
    description: The class is now available on the global object.
-->

L'API `URLSearchParams` fornisce accesso in lettura e scrittura alla query di un `URL`. La classe `URLSearchParams` può anche essere utilizzata standalone con uno dei quattro seguenti constructor. The `URLSearchParams` class is also available on the global object.

L'interfaccia WHATWG `URLSearchParams` e il modulo [`querystring`][] hanno uno scopo simile, ma quello del modulo [`querystring`][] è più generale, in quanto consente la personalizzazione dei caratteri delimitatori (`&` e `=`). D'altra parte, questa API è progettata esclusivamente per stringhe di query URL.

```js
const myURL = new URL('https://example.org/?abc=123');
console.log(myURL.searchParams.get('abc'));
// Prints 123

myURL.searchParams.append('abc', 'xyz');
console.log(myURL.href);
// Prints https://example.org/?abc=123&abc=xyz

myURL.searchParams.delete('abc');
myURL.searchParams.set('a', 'b');
console.log(myURL.href);
// Prints https://example.org/?a=b

const newSearchParams = new URLSearchParams(myURL.searchParams);
// The above is equivalent to
// const newSearchParams = new URLSearchParams(myURL.search);

newSearchParams.append('a', 'c');
console.log(myURL.href);
// Prints https://example.org/?a=b
console.log(newSearchParams.toString());
// Prints a=b&a=c

// newSearchParams.toString() is implicitly called
myURL.search = newSearchParams;
console.log(myURL.href);
// Prints https://example.org/?a=b&a=c
newSearchParams.delete('a');
console.log(myURL.href);
// Prints https://example.org/?a=b&a=c
```

#### Constructor: new URLSearchParams()

Istanziare un nuovo `URLSearchParams` object vuoto.

#### Constructor: new URLSearchParams(string)

* `string` {string} Una stringa di query

Analizzare `string` come stringa di query ed utilizzarla per istanziare un nuovo `URLSearchParams` object. Un `'?'` iniziale, se presente, viene ignorato.

```js
let params;

params = new URLSearchParams('user=abc&query=xyz');
console.log(params.get('user'));
// Prints 'abc'
console.log(params.toString());
// Prints 'user=abc&query=xyz'

params = new URLSearchParams('?user=abc&query=xyz');
console.log(params.toString());
// Prints 'user=abc&query=xyz'
```

#### Constructor: new URLSearchParams(obj)
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
-->

* `obj` {Object} Un object che rappresenta una raccolta di coppie chiave-valore

Istanziare un nuovo `URLSearchParams` object con una mappa hash di query. La chiave e il valore di ogni proprietà di `obj` vengono sempre costretti in stringhe.

Unlike [`querystring`][] module, duplicate keys in the form of array values are not allowed. Arrays are stringified using [`array.toString()`][], which simply joins all array elements with commas.

```js
const params = new URLSearchParams({
  user: 'abc',
  query: ['first', 'second']
});
console.log(params.getAll('query'));
// Prints [ 'first,second' ]
console.log(params.toString());
// Prints 'user=abc&query=first%2Csecond'
```

#### Constructor: new URLSearchParams(iterable)
<!-- YAML
added:
  - v7.10.0
  - v6.13.0
-->

* `iterable` {Iterable} Un object iterabile i cui elementi sono coppie chiave-valore

Istanziare un nuovo `URLSearchParams` object con una mappa iterabile in un modo simile al constructor di [`Map`][]. `iterable` can be an `Array` or any iterable object. Ciò significa che `iterable` può essere un altro `URLSearchParams`, nel qual caso il constructor creerà semplicemente un clone dell'`URLSearchParams` fornito. Gli elementi di `iterable` sono coppie chiave-valore e possono essere essi stessi qualsiasi object iterabile.

Sono consentite chiavi duplicate.

```js
let params;

// Using an array
params = new URLSearchParams([
  ['user', 'abc'],
  ['query', 'first'],
  ['query', 'second']
]);
console.log(params.toString());
// Prints 'user=abc&query=first&query=second'

// Using a Map object
const map = new Map();
map.set('user', 'abc');
map.set('query', 'xyz');
params = new URLSearchParams(map);
console.log(params.toString());
// Prints 'user=abc&query=xyz'

// Using a generator function
function* getQueryPairs() {
  yield ['user', 'abc'];
  yield ['query', 'first'];
  yield ['query', 'second'];
}
params = new URLSearchParams(getQueryPairs());
console.log(params.toString());
// Prints 'user=abc&query=first&query=second'

// Each key-value pair must have exactly two elements
new URLSearchParams([
  ['user', 'abc', 'error']
]);
// Throws TypeError [ERR_INVALID_TUPLE]:
//        Each query pair must be an iterable [name, value] tuple
```

#### urlSearchParams.append(name, value)

* `name` {string}
* `value` {string}

Aggiungi una nuova coppia nome-valore alla stringa di query.

#### urlSearchParams.delete(name)

* `name` {string}

Rimuovi tutte le coppie nome-valore il cui nome è `name`.

#### urlSearchParams.entries()

* Restituisce: {Iterator}

Returns an ES6 `Iterator` over each of the name-value pairs in the query. Each item of the iterator is a JavaScript `Array`. The first item of the `Array` is the `name`, the second item of the `Array` is the `value`.

Alias per [`urlSearchParams[@@iterator]()`][`urlSearchParams@@iterator()`].

#### urlSearchParams.forEach(fn[, thisArg])

* `fn` {Function} Invocato per ogni coppia nome-valore nella query
* `thisArg` {Object} Da utilizzare come valore `this` per quando viene chiamato `fn`

Itera su ciascuna coppia nome-valore nella query ed invoca la funzione specificata.

```js
const myURL = new URL('https://example.org/?a=b&c=d');
myURL.searchParams.forEach((value, name, searchParams) => {
  console.log(name, value, myURL.searchParams === searchParams);
});
// Prints:
//   a b true
//   c d true
```

#### urlSearchParams.get(name)

* `name` {string}
* Restituisce: {string} o `null` se non esiste una coppia nome-valore con il `name` specificato.

Restituisce il valore della prima coppia nome-valore il cui nome è `name`. Se non ci sono coppie di questo tipo, viene restituito `null`.

#### urlSearchParams.getAll(name)

* `name` {string}
* Restituisce: {string[]}

Restituisce i valori di tutte le coppie nome-valore il cui nome è `name`. Se non ci sono coppie di questo tipo, viene restituito un array vuoto.

#### urlSearchParams.has(name)

* `name` {string}
* Restituisce: {boolean}

Restituisce `true` se esiste almeno una coppia nome-valore il cui nome è `name`.

#### urlSearchParams.keys()

* Restituisce: {Iterator}

Returns an ES6 `Iterator` over the names of each name-value pair.

```js
const params = new URLSearchParams('foo=bar&foo=baz');
for (const name of params.keys()) {
  console.log(name);
}
// Prints:
//   foo
//   foo
```

#### urlSearchParams.set(name, value)

* `name` {string}
* `value` {string}

Imposta il valore nell'`URLSearchParams` object associato al `name` su `value`. Se sono presenti coppie nome-valore preesistenti i cui nomi sono `name`, impostare il valore della prima coppia di questo tipo su `value` e rimuovere tutti gli altri. In caso contrario, aggiungere la coppia nome-valore alla stringa di query.

```js
const params = new URLSearchParams();
params.append('foo', 'bar');
params.append('foo', 'baz');
params.append('abc', 'def');
console.log(params.toString());
// Prints foo=bar&foo=baz&abc=def

params.set('foo', 'def');
params.set('xyz', 'opq');
console.log(params.toString());
// Prints foo=def&abc=def&xyz=opq
```

#### urlSearchParams.sort()
<!-- YAML
added:
  - v7.7.0
  - v6.13.0
-->

Ordina tutte le coppie nome-valore esistenti a seconda del loro nome. L'ordinamento viene eseguito con un [algoritmo di ordinamento stabile](https://en.wikipedia.org/wiki/Sorting_algorithm#Stability), affinché venga mantenuto l'ordine relativo tra coppie nome-valore con lo stesso nome.

Questo metodo può essere utilizzato, in particolare, per aumentare i cache hit.

```js
const params = new URLSearchParams('query[]=abc&type=search&query[]=123');
params.sort();
console.log(params.toString());
// Prints query%5B%5D=abc&query%5B%5D=123&type=search
```

#### urlSearchParams.toString()

* Restituisce: {string}

Restituisce i parametri di ricerca serializzati come una stringa, con caratteri codificati in percentuale ove necessario.

#### urlSearchParams.values()

* Restituisce: {Iterator}

Returns an ES6 `Iterator` over the values of each name-value pair.

#### urlSearchParams\[Symbol.iterator\]()

* Restituisce: {Iterator}

Returns an ES6 `Iterator` over each of the name-value pairs in the query string. Each item of the iterator is a JavaScript `Array`. The first item of the `Array` is the `name`, the second item of the `Array` is the `value`.

Alias per [`urlSearchParams.entries()`][].

```js
const params = new URLSearchParams('foo=bar&xyz=baz');
for (const [name, value] of params) {
  console.log(name, value);
}
// Prints:
//   foo bar
//   xyz baz
```

### url.domainToASCII(domain)
<!-- YAML
added:
  - v7.4.0
  - v6.13.0
-->

* `domain` {string}
* Restituisce: {string}

Restituisce la serializzazione ASCII [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4) del `domain`. Se `domain` è un dominio non valido, viene restituita la stringa vuota.

Esegue l'operazione inversa su [`url.domainToUnicode()`][].

```js
const url = require('url');
console.log(url.domainToASCII('español.com'));
// Stampa xn--espaol-zwa.com
console.log(url.domainToASCII('中文.com'));
// Stampa xn--fiq228c.com
console.log(url.domainToASCII('xn--iñvalid.com'));
// Stampa una stringa vuota
```

### url.domainToUnicode(domain)
<!-- YAML
added:
  - v7.4.0
  - v6.13.0
-->

* `domain` {string}
* Restituisce: {string}

Restituisce la serializzazione Unicode del `domain`. Se `domain` è un dominio non valido, viene restituita la stringa vuota.

Esegue l'operazione inversa su [`url.domainToASCII()`][].

```js
const url = require('url');
console.log(url.domainToUnicode('xn--espaol-zwa.com'));
// Stampa español.com
console.log(url.domainToUnicode('xn--fiq228c.com'));
// Stampa 中文.com
console.log(url.domainToUnicode('xn--iñvalid.com'));
//Stampa una stringa vuota
```

### url.fileURLToPath(url)
<!-- YAML
added: v10.12.0
-->

* `url` {URL | string} The file URL string or URL object to convert to a path.
* Returns: {string} The fully-resolved platform-specific Node.js file path.

This function ensures the correct decodings of percent-encoded characters as well as ensuring a cross-platform valid absolute path string.

```js
new URL('file:///C:/path/').pathname;    // Incorrect: /C:/path/
fileURLToPath('file:///C:/path/');       // Correct:   C:\path\ (Windows)

new URL('file://nas/foo.txt').pathname;  // Incorrect: /foo.txt
fileURLToPath('file://nas/foo.txt');     // Correct:   \\nas\foo.txt (Windows)

new URL('file:///你好.txt').pathname;    // Incorrect: /%E4%BD%A0%E5%A5%BD.txt
fileURLToPath('file:///你好.txt');       // Correct:   /你好.txt (POSIX)

new URL('file:///hello world').pathname; // Incorrect: /hello%20world
fileURLToPath('file:///hello world');    // Correct:   /hello world (POSIX)
```

### url.format(URL[, options])
<!-- YAML
added: v7.6.0
-->

* `URL` {URL} Un [WHATWG URL](#url_the_whatwg_url_api) object
* `options` {Object}
  * `auth` {boolean} `true` se la stringa dell'URL serializzato deve includere nome utente e password, altrimenti `false`. **Default:** `true`.
  * `fragment` {boolean} `true` se la stringa dell'URL serializzato deve includere il frammento, altrimenti `false`. **Default:** `true`.
  * `search` {boolean} `true` se la stringa dell'URL serializzato deve includere la query di ricerca, altrimenti `false`. **Default:** `true`.
  * `unicode` {boolean} `true` se i caratteri Unicode che appaiono nel componente host della stringa URL devono essere codificati direttamente anziché essere codificati con Punycode. **Default:** `false`.
* Restituisce: {string}

Returns a customizable serialization of a URL `String` representation of a [WHATWG URL](#url_the_whatwg_url_api) object.

L'URL object ha sia un metodo `toString()` che una proprietà `href` che restituiscono le serializzazioni della stringa dell'URL. Tuttavia, questi non sono personalizzabili in alcun modo. Il metodo `url.format(URL[, options])` consente la personalizzazione di base dell'output.

```js
const myURL = new URL('https://a:b@測試?abc#foo');

console.log(myURL.href);
// Prints https://a:b@xn--g6w251d/?abc#foo

console.log(myURL.toString());
// Prints https://a:b@xn--g6w251d/?abc#foo

console.log(url.format(myURL, { fragment: false, unicode: true, auth: false }));
// Prints 'https://測試/?abc'
```

### url.pathToFileURL(path)
<!-- YAML
added: v10.12.0
-->

* `path` {string} The path to convert to a File URL.
* Returns: {URL} The file URL object.

This function ensures that `path` is resolved absolutely, and that the URL control characters are correctly encoded when converting into a File URL.

```js
new URL(__filename);                // Incorrect: throws (POSIX)
new URL(__filename);                // Incorrect: C:\... (Windows)
pathToFileURL(__filename);          // Correct:   file:///... (POSIX)
pathToFileURL(__filename);          // Correct:   file:///C:/... (Windows)

new URL('/foo#1', 'file:');         // Incorrect: file:///foo#1
pathToFileURL('/foo#1');            // Correct:   file:///foo%231 (POSIX)

new URL('/some/path%.js', 'file:'); // Incorrect: file:///some/path%
pathToFileURL('/some/path%.js');    // Correct:   file:///some/path%25 (POSIX)
```

## API Legacy dell'URL

### Legacy `urlObject`

The legacy `urlObject` (`require('url').Url`) is created and returned by the `url.parse()` function.

#### urlObject.auth

The `auth` property is the username and password portion of the URL, also referred to as _userinfo_. This string subset follows the `protocol` and double slashes (if present) and precedes the `host` component, delimited by `@`. The string is either the username, or it is the username and password separated by `:`.

For example: `'user:pass'`.

#### urlObject.hash

The `hash` property is the fragment identifier portion of the URL including the leading `#` character.

For example: `'#hash'`.

#### urlObject.host

La proprietà `host` è la parte completa dell'host dell'URL in minuscolo, inclusa la `port` se specificata.

For example: `'sub.example.com:8080'`.

#### urlObject.hostname

La proprietà `hostname` è la parte del nome host in minuscolo del componente `host` *senza* includere la `port`.

For example: `'sub.example.com'`.

#### urlObject.href

La proprietà `href` è la stringa URL completa che è stata analizzata con entrambi i componenti del `protocol` e dell'`host` convertiti in caratteri minuscoli.

For example: `'http://user:pass@sub.example.com:8080/p/a/t/h?query=string#hash'`.

#### urlObject.path

La proprietà `path` è una concatenazione del `pathname` e dei componenti di `search`.

For example: `'/p/a/t/h?query=string'`.

Non viene eseguita alcuna decodifica del `path`.

#### urlObject.pathname

La proprietà `pathname` è costituita dall'intera sezione del percorso dell'URL. Questo è tutto ciò che segue l'`host` (inclusa la `port`) e precede l'inizio dei componenti `query` o `hash`, delimitati dai caratteri ASCII punto interrogativo (`?`) o hash (`#`).

For example: `'/p/a/t/h'`.

Non viene eseguita alcuna decodifica della stringa del percorso.

#### urlObject.port

La proprietà `port` è la porzione numerica della porta del componente `host`.

For example: `'8080'`.

#### urlObject.protocol

La proprietà del `protocol` identifica lo schema del protocollo dell'URL in minuscolo.

For example: `'http:'`.

#### urlObject.query

La proprietà `query` è la stringa di query senza il punto interrogativo ASCII iniziale (`?`) o un object restituito dal metodo `parse()` del modulo [`querystring`][]. Se la proprietà della `query` sia una stringa o un object viene determinato dall'argomento `parseQueryString` passato a `url.parse()`.

For example: `'query=string'` or `{'query': 'string'}`.

Se restituito come stringa, non viene eseguita alcuna decodifica della stringa di query. Se restituito come object, vengono decodificati sia le chiavi che i valori.

#### urlObject.search

La proprietà `search` è composta dall'intera porzione "stringa di query" dell'URL, compreso il carattere iniziale ASCII punto interrogativo (`?`).

For example: `'?query=string'`.

Non viene eseguita alcuna decodifica della stringa di query.

#### urlObject.slashes

La proprietà `slashes` è un `boolean` con valore `true` se nel `protocol` vengono richiesti due caratteri slash ASCII (`/`) dopo i due punti.

### url.format(urlObject)
<!-- YAML
added: v0.1.25
changes:
  - version: v7.0.0
    pr-url: https://github.com/nodejs/node/pull/7234
    description: URLs with a `file:` scheme will now always use the correct
                 number of slashes regardless of `slashes` option. A false-y
                 `slashes` option with no protocol is now also respected at all
                 times.
-->

* `urlObject` {Object|string} Un URL object (restituito da `url.parse()` o costruito diversamente). Se è una stringa, viene convertita in un object passandola a `url.parse()`.

Il metodo `url.format()` restituisce una stringa di URL formattata derivata da `urlObject`.

```js
url.format({
  protocol: 'https',
  hostname: 'example.com',
  pathname: '/some/path',
  query: {
    page: 1,
    format: 'json'
  }
});

// => 'https://example.com/some/path?page=1&format=json'
```

Se `urlObject` non è un object né una stringa, `url.format()` genererà un [`TypeError`][].

Il processo di formattazione funziona come segue:

* Viene creata un nuovo stringa vuota `result`.
* Se `urlObject.protocol` è una stringa, viene aggiunta così com'è a `result`.
* Altrimenti, se `urlObject.protocol` non è `undefined` e non è una stringa, viene generato un [`Error`][].
* Per tutti i valori stringa di `urlObject.protocol` che *non terminano* con il carattere ASCII due punti (`:`), la stringa letterale `:` verrà aggiunta al `result`.
* If either of the following conditions is true, then the literal string `//` will be appended to `result`:
    * `urlObject.slashes` property is true;
    * `urlObject.protocol` begins with `http`, `https`, `ftp`, `gopher`, or `file`;
* If the value of the `urlObject.auth` property is truthy, and either `urlObject.host` or `urlObject.hostname` are not `undefined`, the value of `urlObject.auth` will be coerced into a string and appended to `result` followed by the literal string `@`.
* Se la proprietà `urlObject.host` è `undefined` allora:
  * Se l'`urlObject.hostname` è una stringa, viene aggiunta al `result`.
  * Altrimenti, se `urlObject.hostname` non è `undefined` e non è una stringa, viene generato un [`Error`][].
  * Se il valore della proprietà `urlObject.port` è veritiero e `urlObject.hostname` non è `undefined`:
    * La stringa letterale `:` viene aggiunta al `result` e
    * Il valore di `urlObject.port` è forzato in una stringa e aggiunto al `result`.
* Altrimenti, se il valore della proprietà `urlObject.host` è veritiero, il valore di `urlObject.host` viene forzato in una stringa e aggiunto al `result`.
* Se la proprietà `urlObject.pathname` è una stringa che non è una stringa vuota:
  * If the `urlObject.pathname` *does not start* with an ASCII forward slash (`/`), then the literal string `'/'` is appended to `result`.
  * Il valore di `urlObject.pathname` viene aggiunto al `result`.
* Altrimenti, se `urlObject.pathname` non è `undefined` e non è una stringa, viene generato un [`Error`][].
* Se la proprietà `urlObject.search` è `undefined` e la proprietà `urlObject.query` è un `Object`, la stringa letterale `?` viene aggiunta al `result` seguita dall'output della chiamata al metodo `stringify()` del modulo [`querystring`][] passando il valore di `urlObject.query`.
* Altrimenti, se `urlObject.search` è una stringa:
  * Se il valore di `urlObject.search` *non inizia* con il carattere ASCII punto interrogativo (`?`), la stringa letterale `?` viene aggiunta al `result`.
  * Il valore di `urlObject.search` viene aggiunto al `result`.
* Altrimenti, se `urlObject.search` non è `undefined` e non è una stringa, viene generato un [`Error`][].
* Se la proprietà `urlObject.hash` è una stringa:
  * Se il valore di `urlObject.hash` *non inizia* con il carattere ASCII cancelletto (`#`), la stringa letterale `#` viene aggiunta al `result`.
  * Il valore di `urlObject.hash` viene aggiunto al `result`.
* Altrimenti, se la proprietà `urlObject.hash` non è `undefined` e non è una stringa, viene generato un [`Error`][].
* Viene restituito `result`.

### url.parse(urlString[, parseQueryString[, slashesDenoteHost]])
<!-- YAML
added: v0.1.25
changes:
  - version: v9.0.0
    pr-url: https://github.com/nodejs/node/pull/13606
    description: The `search` property on the returned URL object is now `null`
                 when no query string is present.
-->

* `urlString` {string} La stringa dell'URL da analizzare.
* `parseQueryString` {boolean} Se `true`, la proprietà `query` sarà sempre impostata su un object restituito dal metodo `parse()` del modulo [`querystring`][]. Se `false`, la proprietà `query` sull'URL object restituito sarà una stringa non analizzata e non codificata. **Default:** `false`.
* `slashesDenoteHost` {boolean} Se `true`, il primo token dopo la stringa letterale `//` e precedente al successivo `/` verrà interpretato come `host`. Ad esempio, considerando `//foo/bar`, il risultato sarebbe `{host: 'foo', pathname: '/bar'}` piuttosto che `{pathname: '//foo/bar'}`. **Default:** `false`.

Il metodo `url.parse()` prende una stringa URL, la analizza e restituisce un URL object.

Verrà generato un `TypeError` se `urlString` non è una stringa.

Viene generato un `URIError` se la proprietà `auth` è presente ma non può essere decodificata.

### url.resolve(from, to)
<!-- YAML
added: v0.1.25
changes:
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8215
    description: The `auth` fields are now kept intact when `from` and `to`
                 refer to the same host.
  - version: v6.5.0, v4.6.2
    pr-url: https://github.com/nodejs/node/pull/8214
    description: The `port` field is copied correctly now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/1480
    description: The `auth` fields is cleared now the `to` parameter
                 contains a hostname.
-->

* `from` {string} L'URL di Base da risolvere.
* `to` {string} L'URL di HREF da risolvere.

Il metodo `url.resolve()` risolve un URL di destinazione relativo a un URL di base in un modo similare a quello con cui un browser Web risolve un tag di ancoraggio HREF.

```js
const url = require('url');
url.resolve('/one/two/three', 'four');         // '/one/two/four'
url.resolve('http://example.com/', '/one');    // 'http://example.com/one'
url.resolve('http://example.com/one', '/two'); // 'http://example.com/two'
```

<a id="whatwg-percent-encoding"></a>

## Codifica Percentuale negli URL

Gli URL sono autorizzati a contenere esclusivamente un determinato intervallo di caratteri. Qualsiasi carattere che si trova al di fuori di tale intervallo deve essere codificato. In che modo tali caratteri vengono codificati e quali caratteri codificare dipende interamente da dove si trova il carattere all'interno della struttura dell'URL.

### API Legacy

All'interno dell'API Legacy, verranno automaticamente ignorati gli spazi (`' '`) ed i caratteri seguenti nelle proprietà degli URL object:

```txt
< > " ` \r \n \t { } | \ ^ '
```

Ad esempio, Il carattere ASCII spazio (`' '`) viene codificato come `%20`. Il carattere ASCII slash (`/`) viene codificato come `%3C`.

### API di WHATWG

Il [WHATWG URL Standard](https://url.spec.whatwg.org/) utilizza un approccio per la selezione dei caratteri codificati più selettivo e minuzioso di quello utilizzato dall'API Legacy.

L'algoritmo di WHATWG definisce quattro "set di codifica percentuale" che descrivono intervalli di caratteri che devono essere codificati in percentuale:

* Il *set di codifica percentuale di controllo C0* include punti di codice nell'intervallo da U+0000 a U+001F (compresi) e tutti i punti di codice superiori a U+007E.

* The *fragment percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+003C, U+003E, and U+0060.

* The *path percent-encode set* includes the *C0 control percent-encode set* and code points U+0020, U+0022, U+0023, U+003C, U+003E, U+003F, U+0060, U+007B, and U+007D.

* The *userinfo encode set* includes the *path percent-encode set* and code points U+002F, U+003A, U+003B, U+003D, U+0040, U+005B, U+005C, U+005D, U+005E, and U+007C.

Il *set di codifica percentuale di userinfo* viene utilizzato esclusivamente per il nome utente e le password codificate all'interno dell'URL. Il *set di codifica percentuale del percorso* viene utilizzato per il percorso della maggior parte degli URL. Il *set di codifica percentuale del frammento* viene utilizzato per i frammenti degli URL. Il *set di codifica percentuale di controllo C0* viene utilizzato per l'host e per il percorso ad alcune condizioni specifiche, in aggiunta a tutti gli altri casi.

Quando appaiono caratteri non-ASCII all'interno dell'hostname, l'hostname stesso viene codificato utilizzando l'algoritmo [Punycode](https://tools.ietf.org/html/rfc5891#section-4.4). Note, however, that a hostname *may* contain *both* Punycode encoded and percent-encoded characters:

```js
const myURL = new URL('https://%CF%80.example.com/foo');
console.log(myURL.href);
// Prints https://xn--1xa.example.com/foo
console.log(myURL.origin);
// Prints https://xn--1xa.example.com
```
