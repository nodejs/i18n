# DNS

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `dns` contiene funzioni appartenenti a due diverse categorie:

1) Le funzioni che utilizzano li sistema operativo sottostante per eseguire il "name resolution" e non devono necessariamente svolgere alcuna comunicazione di rete. Questa categoria contiene una sola funzione: `dns.lookup()`][]. **Gli sviluppatori che cercano di eseguire la funzione di name resolution nello stesso modo in cui si comportano le altre applicazioni del medesimo sistema operativo dovrebbero utilizzare [`dns.lookup()`][].**

Ad esempio, cercando `iana.org`.

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
console.log('address: %j family: IPv%s', address, family);
});
// indirizzo: "192.0.43.8" famiglia: IPv4
```

2) Le funzioni che si connettono a un effettivo server DNS per eseguire il "name resolution" e che utilizzano _sempre_ la rete per eseguire le query DNS. Questa categoria contiene tutte le funzioni presenti sul modulo `dns` _tranne_ [`dns.lookup()`][]. Queste funzioni non utilizzano lo stesso set di file di configurazione utilizzato da [`dns.lookup()`][] (es. `/etc/hosts`). Queste funzioni dovrebbero essere utilizzate dagli sviluppatori che non vogliono utilizzare il sistema operativo sottostante per il name resolution e vogliono invece eseguire _sempre_ delle query DNS.

Di seguito è riportato un esempio di risoluzione di `'archive.org'`, che poi all’inverso risolve gli indirizzi IP restituiti.

```js
const dns = require('dns');

dns.resolve4('archive.org', (err, addresses) => {
  if (err) throw err;

  console.log(`addresses: ${JSON.stringify(addresses)}`);

  addresses.forEach((a) => {
    dns.reverse(a, (err, hostnames) => {
      if (err) {
        throw err;
      }
      console.log(`reverse for ${a}: ${JSON.stringify(hostnames)}`);
    });
  });
});
```

Ci sono sottili differenze nello scegliere un metodo rispetto all'altro, si prega quindi di consultare la [Sezione di considerazioni sull'implementazione](#dns_implementation_considerations) per maggiori dettagli.

## Class: dns.Resolver
<!-- YAML
added: v8.3.0
-->

Un resolver indipendente per le richieste DNS.

Si consideri che la creazione di un nuovo resolver utilizza le impostazioni di default del server. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolvers:

```js
const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['4.4.4.4']);

// Questa richiesta userà il server 4.4.4.4. indipendentemente dalle impostazioni globali.
resolver.resolve4('example.org', (err, addresses) => {
  // ...
});
```

Sono disponibili i seguenti metodi dal modulo `dns`:

* [`resolver.getServers()`][`dns.getServers()`]
* [`resolver.resolve()`][`dns.resolve()`]
* [`resolver.resolve4()`][`dns.resolve4()`]
* [`resolver.resolve6()`][`dns.resolve6()`]
* [`resolver.resolveAny()`][`dns.resolveAny()`]
* [`resolver.resolveCname()`][`dns.resolveCname()`]
* [`resolver.resolveMx()`][`dns.resolveMx()`]
* [`resolver.resolveNaptr()`][`dns.resolveNaptr()`]
* [`resolver.resolveNs()`][`dns.resolveNs()`]
* [`resolver.resolvePtr()`][`dns.resolvePtr()`]
* [`resolver.resolveSoa()`][`dns.resolveSoa()`]
* [`resolver.resolveSrv()`][`dns.resolveSrv()`]
* [`resolver.resolveTxt()`][`dns.resolveTxt()`]
* [`resolver.reverse()`][`dns.reverse()`]
* [`resolver.setServers()`][`dns.setServers()`]

### resolver.cancel()
<!-- YAML
added: v8.3.0
-->

Cancella tutte le query DNS eccezionali effettuate da questo resolver. I callback corrispondenti verranno identificati con il codice di errore `ECANCELLED`.

## dns.getServers()
<!-- YAML
added: v0.11.3
-->

* Restituisce: {string[]}

Restituisce un array di stringe di indirizzi IP, formattati secondo gli standard [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), che sono attualmente configurati per la risoluzione dei DNS. La stringa includerà una sezione per la porta se ne è stata utilizzata una personalizzata.
```js
[
  '4.4.4.4',
  '2001:4860:4860::8888',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]
```

## dns.lookup(hostname[, options], callback)<!-- YAML
added: v0.1.90
changes:
  - version: v8.5.0
    pr-url: https://github.com/nodejs/node/pull/14731
    description: The `verbatim` option is supported now.
  - version: v1.2.0
    pr-url: https://github.com/nodejs/node/pull/744
    description: The `all` option is supported now.
-->* `hostname` {string}
* `options` {integer | Object}
  - `family`{integer} Il record family. Deve essere `4` o `6`. Gli indirizzi IPv4 e IPv6 sono entrambi restituiti per default.
  - `hints`{number} Uno o più [supported `getaddrinfo` flags][]. I flag multipli possono essere passati bit per bit `oppure` utilizzando i loro valori.
  - `all` {boolean} Quando `true`, il callback restituisce tutti gli indirizzi risolti in un array. Altrimenti, restituisce un singolo indirizzo. **Default:** `false`.
  - `verbatim` {boolean} Quando `true` il callback riceve gli indirizzi IPv4 e IPv6 nell'ordine in cui il resolver DNS li ha restituiti. Quando `false`, gli indirizzi IPv4 vengono messi prima di quelli IPv6. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Il nuovo codice da utilizzare `{ verbatim: true }`.
* `callback` {Function}
  - `err` {Error}
  - `address` {string} Una stringa che rappresenta un indirizzo IPv4 o IPv6.
  - `family` {integer} `4` o `6`, che indica la famiglia di `address`.

Risolve un hostname (es. `'nodejs.org'`) nei primi record A (IPv4) oppure AAAA (Ipv6) trovati. Tutte le proprietà `option` sono facoltative. Se `options` è un intero, allora deve essere `4` o `6` - se `options` non è fornito, allora gli indirizzi IPv4 e IPv6 saranno restituiti entrambi, se trovati.

Con l’option `all` impostata su `true`, gli argomenti per il `callback` cambiano in `(err, addresses)`, con `addresses` che rappresenta un array di oggetti con le proprietà `address` e `family`.

In caso di errore, `err` è un [`Error`][] object, dove l'`err.code` è il codice dell'errore. Si tenga a mente che l'`err.code` sarà impostato a `'ENOENT'` non solo quando l'hostname non esiste, ma anche quando la procedura di lookup fallisce per qualsiasi motivo come nel caso di mancanza dei file descriptor.

`dns.lookup()` non ha necessariamente a che fare con il protocollo DNS. L'implementazione utilizza una semplificazione del sistema operativo che permette di associare nomi con indirizzi e viceversa. Questa implementazione può avere conseguenze sottili ma comunque importanti sul comportamento di qualsiasi programma sviluppato con Node.js. Si prega quindi di prendersi del tempo per consultare la [Sezione delle considerazioni sull'implementazione](#dns_implementation_considerations) prima di usare il `dns.lookup()`.

Esempio di utilizzo:

```js
const dns = require('dns');
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
dns.lookup('example.com', options, (err, address, family) =>
  console.log('address: %j family: IPv%s', address, family));
// indirizzo: "2606:2800:220:1:248:1893:25c8:1946" famiglia: IPv6

// Quando options.all è true, i risultati saranno un Array.
options.all = true;
dns.lookup('example.com', options, (err, addresses) =>
  console.log('addresses: %j', addresses));
// addresses: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
```

If this method is invoked as its [`util.promisify()`][]ed version, and `all` is not set to `true`, it returns a `Promise` for an `Object` with `address` and `family` properties.

### Flags getaddrinfo supportati

I seguenti flags possono essere passati come suggerimenti a [`dns.lookup()`][].

- `dns.ADDRCONFIG`: I tipi di indirizzo restituiti sono determinati dai tipi di indirizzi supportati dal sistema corrente. Ad esempio, vengono restituiri indirizzi IPv4 solo se nel sistema attuale è configurato almeno un indirizzo IPv4. Gli indirizzi di loopback non sono considerati.
- `dns.V4MAPPED`: Se viene specificata la famiglia di indirizzi IPv6, ma non viene trovato alcun indirizzo IPv6, allora viene restituito un indirizzo IPv4 mappato come un indirizzo IPv6. Attenzione, questo potrebbe non essere supportato in qualche sistema operativo (ad esempio FreeBSD 10.1).

## dns.lookupService(address, port, callback)<!-- YAML
added: v0.11.14
-->* `address` {string}
* `port` {number}
* `callback` {Function}
  - `err` {Error}
  - `hostname` {string} es. `example.com`
  - `service` {string} es. `http`

Risolve l'`address` e la `port` specificata in un hostname e in un servizio utilizzando l'implementazione `getnameinfo` del sistema operativo sottostante.

Se l'`address` non è un indirizzo IP valido, verrà emesso un `TypeError`. La `port` sarà associata a un numero. Se non è una porta valida, verrà emesso un `TypeError`.

In un errore, `err` è un [`Error`][] object, dove `err.code` è il codice dell'errore.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Stampa: localhost ssh
});
```

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `hostname` and `service` properties.

## dns.resolve(hostname[, rrtype], callback)<!-- YAML
added: v0.1.27
-->* `hostname` {string} Hostname da risolvere.
* `rrtype` {string} Tipo di record della risorsa. **Predefinito:** `'A'`.
* `callback` {Function}
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Utilizzare il protocollo DNS per risolvere un hostname (ad esempio `'nodejs.org'`) in un array dei record delle risorse. La funzione di `callback` ha come argomenti `(err, records)`. Quando ha successo, il `records` sarà un array delle risorse dei record. Il tipo e la struttura dei risultati individuali varia in base al suo `rrtype`:

| `rrtype`  | `records` contiene                       | Tipo di Risultato | Metodo Stenografico      |
| --------- | ---------------------------------------- | ----------------- | ------------------------ |
| `'A'`     | Indirizzi IPv4 (predefiniti)             | {string}          | [`dns.resolve4()`][]     |
| `'AAAA'`  | Indirizzi IPv6                           | {string}          | [`dns.resolve6()`][]     |
| `'ANY'`   | record qualsiasi                         | {Object}          | [`dns.resolveAny()`][]   |
| `'CNAME'` | nome canonico del record                 | {string}          | [`dns.resolveCname()`][] |
| `'MX'`    | mail exchange records                    | {Object}          | [`dns.resolveMx()`][]    |
| `'NAPTR'` | record del puntatore della name autority | {Object}          | [`dns.resolveNaptr()`][] |
| `'NS'`    | record del nome del server               | {string}          | [`dns.resolveNs()`][]    |
| `'PTR'`   | record del puntatore                     | {string}          | [`dns.resolvePtr()`][]   |
| `'SOA'`   | inizio dei record di authority           | {Object}          | [`dns.resolveSoa()`][]   |
| `'SRV'`   | record di servizio                       | {Object}          | [`dns.resolveSrv()`][]   |
| `'TXT'`   | record di testo                          | {string[]}        | [`dns.resolveTxt()`][]   |

In caso di errore, `err` è un `Error`][] object, dove `err.code` è uno dei [codici di errore DNS](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->* `hostname` {string} Hostname da risolvere.
* `options` {Object}
  - `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. Quando `true`, il callback riceve un array di oggetti `{ address: '1.2.3.4', ttl: 60 }` invece di un array di stringhe, con il TTL espresso in secondi.
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Utilizza il protocollo DNS per risolvere gli indirizzi IPv4 (record `A`) per l'`hostname`. Gli argomenti degli `addresses` passati alla funzione del `callback` conterrà un array di indirizzi IPv4 (es. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

## dns.resolve6(hostname[, options], callback)
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->
* `hostname` {string} Hostname da risolvere.
* `options` {Object}
  - `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. Quando `true`, il callback riceve un array di oggetti `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` invece di un array di stringhe, con il TTL espresso in secondi.
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Utilizza il protocollo DNS per risolvere gli indirizzi IPv6 (record `AAAA`) per l'`hostname`. Gli argomenti degli `addresses` passati alla funzione del `callback` conterrà un array di indirizzi IPv6.

## dns.resolveAny(hostname, callback)

* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `ret` {Object[]}

Utilizza il protocollo DNS per risolvere tutti i record (conosciuti anche come `ANY` o query `*`). L'argomento `ret` passato alla funzione di `callback` sarà un array contenente vari tipi di record. Ogni oggetto ha una proprietà `type` che indica il tipo del record attuale. E a seconda del `type`, saranno presenti proprietà aggiuntive sull'oggetto:

| Type      | Proprietà                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'A'`     | `address`/`ttl`                                                                                                                                  |
| `'AAAA'`  | `address`/`ttl`                                                                                                                                  |
| `'CNAME'` | `value`                                                                                                                                          |
| `'MX'`    | Fai riferimento a [`dns.resolveMx()`][]                                                                                                          |
| `'NAPTR'` | Fai riferimento a [`dns.resolveNaptr()`][]                                                                                                       |
| `'NS'`    | `value`                                                                                                                                          |
| `'PTR'`   | `value`                                                                                                                                          |
| `'SOA'`   | Fai riferimento a [`dns.resolveSoa()`][]                                                                                                         |
| `'SRV'`   | Fai riferimento a [`dns.resolveSrv()`][]                                                                                                         |
| `'TXT'`   | This type of record contains an array property called `entries` which refers to [`dns.resolveTxt()`][], e.g. `{ entries: ['...'], type: 'TXT' }` |

Questo è un esempio dell'oggetto `ret` passato alla funzione di callback:
```js
[ { type: 'A', address: '127.0.0.1', ttl: 299 },
  { type: 'CNAME', value: 'example.com' },
  { type: 'MX', exchange: 'alt4.aspmx.l.example.com', priority: 50 },
  { type: 'NS', value: 'ns1.example.com' },
  { type: 'TXT', entries: [ 'v=spf1 include:_spf.example.com ~all' ] },
  { type: 'SOA',
    nsname: 'ns1.example.com',
    hostmaster: 'admin.example.com',
    serial: 156696742,
    refresh: 900,
    retry: 900,
    expire: 1800,
    minttl: 60 } ]
```

DNS server operators may choose not to respond to `ANY` queries. It may be better to call individual methods like [`dns.resolve4()`][], [`dns.resolveMx()`][], and so on. For more details, see [RFC 8482](https://tools.ietf.org/html/rfc8482).

## dns.resolveCname(hostname, callback)<!-- YAML
added: v0.3.2
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record `CNAME` per l'`hostname`. Gli argomenti degli `addresses` passati alla funzione di `callback` conterrà un array di record di nomi canonici disponibili per l'`hostname` (esempio `['bar.example.com']`).

## dns.resolveMx(hostname, callback)<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `address` {Object}[]}

Utilizza il protocollo DNS per risolvere i record di scambio mail (`MX` record) per l'`hostname`. L’argomento `addresses` passato alla funzione di `callback` conterrà un array di oggetti che contiene entrambe le proprietà `priority` e `exchange` (ad esempio: `{priority: 10, exchange: 'mx.example.com'}, ...]`).

## dns.resolveNaptr(hostname, callback)<!-- YAML
added: v0.9.12
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `address` {Object}[]}

Utilizza il protocollo DNS per risolvere i record basati sulle espressioni regolari (record `NAPTR`) per l'`hostname`. L’argomento `addresses` passato alla funzione del `callback` conterrà un array di oggetti con le seguente proprietà:

* `flags`
* `service`
* `regexp`
* `replacement`
* `order`
* `preference`
```js
{
  flags: 's',
  service: 'SIP+D2U',
  regexp: '',
  replacement: '_sip._udp.example.com',
  order: 30,
  preference: 100
}
```

## dns.resolveNs(hostname, callback)<!-- YAML
added: v0.1.90
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record di name server ( record `NS`) per l'`hostname`. L'argomento `addresses` passato alla funzione di `callback` conterrà un array di record con i name server disponibili per l'`hostname` (es.`['ns1.example.com', 'ns2.example.com']`).

## dns.resolvePtr(hostname, callback)<!-- YAML
added: v6.0.0
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record di puntatore (record `PTR`) per l'`hostname`. L'argomento `addresses` passato alla funzione di `callback` sarà un array di stringhe contenente i record di risposta.

## dns.resolveSoa(hostname, callback)<!-- YAML
added: v0.11.10
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `address` {Object}

Utilizza il protocollo DNS per risolvere il record di start of authority (record `SOA`) per l'`hostname`. L'argomento `address` passato alla funzione di `callback` sarà un oggetto con le seguenti proprietà:

* `nsname`
* `hostmaster`
* `serial`
* `refresh`
* `retry`
* `expire`
* `minttl`
```js
{
  nsname: 'ns.example.com',
  hostmaster: 'root.example.com',
  serial: 2013101809,
  refresh: 10000,
  retry: 2400,
  expire: 604800,
  minttl: 3600
}
```

## dns.resolveSrv(hostname, callback)<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `address` {Object}[]}

Utilizza il protocollo DNS per risolvere i record di servizio (record `SRV`) per l'`hostname`. L'argomento `addresses` passato alla funzione di `callback` sarà un array di oggetti con le seguenti proprietà:

* `priority`
* `weight`
* `port`
* `name`
```js
{
  priority: 10,
  weight: 5,
  port: 21223,
  name: 'service.example.com'
}
```

## dns.resolveTxt(hostname, callback)<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `records` {string[][]}

Utilizza il protocollo DNS per risolvere le query di testo (record `TXT`) per l'`hostname`. L'argomento `records` passato alla funzione di `callback` è un array bidimensionale dei record di testo disponibili per l'`hostname` (es.`[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Ogni array secondario contiene pezzi TXT di un record. A seconda dell'utilizzo, questi potrebbero essere sia uniti che trattati separatamente.

## dns.reverse(ip, callback)<!-- YAML
added: v0.1.16
-->* `ip` {string}
* `callback` {Function}
  - `err` {Error}
  - `hostnames` {string[]}

Svolge una query DNS inversa che risolve un indirizzo IPv4 o IPv6 a un array di hostname.

In caso di errore, `err` è un oggetto [`Error`][], dove `err.code` è uno dei [codici di errore DNS](#dns_error_codes).

## dns.setServers(servers)<!-- YAML
added: v0.11.3
-->* `servers` {string[]} un array di stringhe formattato con [rfc5952](https://tools.ietf.org/html/rfc5952#section-6)

Imposta un indirizzo IP e una porta sul server che verrà utilizzata quando di svolge la risoluzione di un DNS. L'argomento `servers` è un array di indirizzi formattato con [rfc5952](https://tools.ietf.org/html/rfc5952#section-6). La porta può essere omessa se è utilizzata quella predefinita assegnata dallo IANA per i DNS (53).

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Un errore sarà generato se verrà fornito un indirizzo non valido.

Il metodo `dns.setServers()` non deve essere chiamato quando una query DNS è in corso.

The [`dns.setServers()`][] method affects only [`dns.resolve()`][], [`dns.resolve*()`][] and [`dns.reverse()`][] (and specifically *not* [`dns.lookup()`][]).

Note that this method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## DNS Promises API

> Stability: 1 - Experimental

The `dns.promises` API provides an alternative set of asynchronous DNS methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('dns').promises`.

### Class: dnsPromises.Resolver<!-- YAML
added: v10.6.0
-->Un resolver indipendente per le richieste DNS.

Si consideri che la creazione di un nuovo resolver utilizza le impostazioni di default del server. Setting the servers used for a resolver using [`resolver.setServers()`][`dnsPromises.setServers()`] does not affect other resolvers:

```js
const { Resolver } = require('dns').promises;
const resolver = new Resolver();
resolver.setServers(['4.4.4.4']);

// This request will use the server at 4.4.4.4, independent of global settings.
resolver.resolve4('example.org').then((addresses) => {
  // ...
});

// Alternatively, the same code can be written using async-await style.
(async function() {
  const addresses = await resolver.resolve4('example.org');
})();
```

The following methods from the `dnsPromises` API are available:

* [`resolver.getServers()`][`dnsPromises.getServers()`]
* [`resolver.resolve()`][`dnsPromises.resolve()`]
* [`resolver.resolve4()`][`dnsPromises.resolve4()`]
* [`resolver.resolve6()`][`dnsPromises.resolve6()`]
* [`resolver.resolveAny()`][`dnsPromises.resolveAny()`]
* [`resolver.resolveCname()`][`dnsPromises.resolveCname()`]
* [`resolver.resolveMx()`][`dnsPromises.resolveMx()`]
* [`resolver.resolveNaptr()`][`dnsPromises.resolveNaptr()`]
* [`resolver.resolveNs()`][`dnsPromises.resolveNs()`]
* [`resolver.resolvePtr()`][`dnsPromises.resolvePtr()`]
* [`resolver.resolveSoa()`][`dnsPromises.resolveSoa()`]
* [`resolver.resolveSrv()`][`dnsPromises.resolveSrv()`]
* [`resolver.resolveTxt()`][`dnsPromises.resolveTxt()`]
* [`resolver.reverse()`][`dnsPromises.reverse()`]
* [`resolver.setServers()`][`dnsPromises.setServers()`]

### dnsPromises.getServers()<!-- YAML
added: v10.6.0
-->* Restituisce: {string[]}

Restituisce un array di stringe di indirizzi IP, formattati secondo gli standard [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), che sono attualmente configurati per la risoluzione dei DNS. La stringa includerà una sezione per la porta se ne è stata utilizzata una personalizzata.
```js
[
  '4.4.4.4',
  '2001:4860:4860::8888',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]
```

### dnsPromises.lookup(hostname[, options])<!-- YAML
added: v10.6.0
-->* `hostname` {string}
* `options` {integer | Object}
  - `family`{integer} Il record family. Deve essere `4` o `6`. Gli indirizzi IPv4 e IPv6 sono entrambi restituiti per default.
  - `hints`{number} Uno o più [supported `getaddrinfo` flags][]. I flag multipli possono essere passati bit per bit `oppure` utilizzando i loro valori.
  - `all` {boolean} When `true`, the `Promise` is resolved with all addresses in an array. Altrimenti, restituisce un singolo indirizzo. **Default:** `false`.
  - `verbatim` {boolean} When `true`, the `Promise` is resolved with IPv4 and IPv6 addresses in the order the DNS resolver returned them. Quando `false`, gli indirizzi IPv4 vengono messi prima di quelli IPv6. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Il nuovo codice da utilizzare `{ verbatim: true }`.

Risolve un hostname (es. `'nodejs.org'`) nei primi record A (IPv4) oppure AAAA (Ipv6) trovati. Tutte le proprietà `option` sono facoltative. Se `options` è un intero, allora deve essere `4` o `6` - se `options` non è fornito, allora gli indirizzi IPv4 e IPv6 saranno restituiti entrambi, se trovati.

With the `all` option set to `true`, the `Promise` is resolved with `addresses` being an array of objects with the properties `address` and `family`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code. Si tenga a mente che l'`err.code` sarà impostato a `'ENOENT'` non solo quando l'hostname non esiste, ma anche quando la procedura di lookup fallisce per qualsiasi motivo come nel caso di mancanza dei file descriptor.

[`dnsPromises.lookup()`][] does not necessarily have anything to do with the DNS protocol. The implementation uses an operating system facility that can associate names with addresses, and vice versa. This implementation can have subtle but important consequences on the behavior of any Node.js program. Please take some time to consult the [Implementation considerations section](#dns_implementation_considerations) before using `dnsPromises.lookup()`.

Esempio di utilizzo:

```js
const dns = require('dns');
const dnsPromises = dns.promises;
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};

dnsPromises.lookup('example.com', options).then((result) => {
  console.log('address: %j family: IPv%s', result.address, result.family);
  // address: "2606:2800:220:1:248:1893:25c8:1946" family: IPv6
});

// When options.all is true, the result will be an Array.
options.all = true;
dnsPromises.lookup('example.com', options).then((result) => {
  console.log('addresses: %j', result);
  // addresses: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
});
```

### dnsPromises.lookupService(address, port)<!-- YAML
added: v10.6.0
-->* `address` {string}
* `port` {number}

Risolve l'`address` e la `port` specificata in un hostname e in un servizio utilizzando l'implementazione `getnameinfo` del sistema operativo sottostante.

Se l'`address` non è un indirizzo IP valido, verrà emesso un `TypeError`. La `port` sarà associata a un numero. Se non è una porta valida, verrà emesso un `TypeError`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code.

```js
const dnsPromises = require('dns').promises;
dnsPromises.lookupService('127.0.0.1', 22).then((result) => {
  console.log(result.hostname, result.service);
  // Prints: localhost ssh
});
```

### dnsPromises.resolve(hostname[, rrtype])<!-- YAML
added: v10.6.0
-->* `hostname` {string} Hostname da risolvere.
* `rrtype` {string} Tipo di record della risorsa. **Predefinito:** `'A'`.

Utilizzare il protocollo DNS per risolvere un hostname (ad esempio `'nodejs.org'`) in un array dei record delle risorse. When successful, the `Promise` is resolved with an array of resource records. The type and structure of individual results vary based on `rrtype`:

| `rrtype`  | `records` contiene                       | Tipo di Risultato | Metodo Stenografico              |
| --------- | ---------------------------------------- | ----------------- | -------------------------------- |
| `'A'`     | Indirizzi IPv4 (predefiniti)             | {string}          | [`dnsPromises.resolve4()`][]     |
| `'AAAA'`  | Indirizzi IPv6                           | {string}          | [`dnsPromises.resolve6()`][]     |
| `'ANY'`   | record qualsiasi                         | {Object}          | [`dnsPromises.resolveAny()`][]   |
| `'CNAME'` | nome canonico del record                 | {string}          | [`dnsPromises.resolveCname()`][] |
| `'MX'`    | mail exchange records                    | {Object}          | [`dnsPromises.resolveMx()`][]    |
| `'NAPTR'` | record del puntatore della name autority | {Object}          | [`dnsPromises.resolveNaptr()`][] |
| `'NS'`    | record del nome del server               | {string}          | [`dnsPromises.resolveNs()`][]    |
| `'PTR'`   | record del puntatore                     | {string}          | [`dnsPromises.resolvePtr()`][]   |
| `'SOA'`   | inizio dei record di authority           | {Object}          | [`dnsPromises.resolveSoa()`][]   |
| `'SRV'`   | record di servizio                       | {Object}          | [`dnsPromises.resolveSrv()`][]   |
| `'TXT'`   | record di testo                          | {string[]}        | [`dnsPromises.resolveTxt()`][]   |

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### dnsPromises.resolve4(hostname[, options])
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Hostname da risolvere.
* `options` {Object}
  - `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the `Promise` is resolved with an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv4 addresses (`A` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

### dnsPromises.resolve6(hostname[, options])
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Hostname da risolvere.
* `options` {Object}
  - `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the `Promise` is resolved with an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv6 addresses (`AAAA` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv6 addresses.

### dnsPromises.resolveAny(hostname)<!-- YAML
added: v10.6.0
-->* `hostname` {string}

Utilizza il protocollo DNS per risolvere tutti i record (conosciuti anche come `ANY` o query `*`). On success, the `Promise` is resolved with an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Type      | Proprietà                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'A'`     | `address`/`ttl`                                                                                                                                          |
| `'AAAA'`  | `address`/`ttl`                                                                                                                                          |
| `'CNAME'` | `value`                                                                                                                                                  |
| `'MX'`    | Refer to [`dnsPromises.resolveMx()`][]                                                                                                                   |
| `'NAPTR'` | Refer to [`dnsPromises.resolveNaptr()`][]                                                                                                                |
| `'NS'`    | `value`                                                                                                                                                  |
| `'PTR'`   | `value`                                                                                                                                                  |
| `'SOA'`   | Refer to [`dnsPromises.resolveSoa()`][]                                                                                                                  |
| `'SRV'`   | Refer to [`dnsPromises.resolveSrv()`][]                                                                                                                  |
| `'TXT'`   | This type of record contains an array property called `entries` which refers to [`dnsPromises.resolveTxt()`][], e.g. `{ entries: ['...'], type: 'TXT' }` |

Here is an example of the result object:
```js
[ { type: 'A', address: '127.0.0.1', ttl: 299 },
  { type: 'CNAME', value: 'example.com' },
  { type: 'MX', exchange: 'alt4.aspmx.l.example.com', priority: 50 },
  { type: 'NS', value: 'ns1.example.com' },
  { type: 'TXT', entries: [ 'v=spf1 include:_spf.example.com ~all' ] },
  { type: 'SOA',
    nsname: 'ns1.example.com',
    hostmaster: 'admin.example.com',
    serial: 156696742,
    refresh: 900,
    retry: 900,
    expire: 1800,
    minttl: 60 } ]
```

### dnsPromises.resolveCname(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record `CNAME` per l'`hostname`. On success, the `Promise` is resolved with an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

### dnsPromises.resolveMx(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di scambio mail (`MX` record) per l'`hostname`. On success, the `Promise` is resolved with an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

### dnsPromises.resolveNaptr(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record basati sulle espressioni regolari (record `NAPTR`) per l'`hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

* `flags`
* `service`
* `regexp`
* `replacement`
* `order`
* `preference`
```js
{
  flags: 's',
  service: 'SIP+D2U',
  regexp: '',
  replacement: '_sip._udp.example.com',
  order: 30,
  preference: 100
}
```

### dnsPromises.resolveNs(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di name server ( record `NS`) per l'`hostname`. On success, the `Promise` is resolved with an array of name server records available for `hostname` (e.g. `['ns1.example.com', 'ns2.example.com']`).

### dnsPromises.resolvePtr(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di puntatore (record `PTR`) per l'`hostname`. On success, the `Promise` is resolved with an array of strings containing the reply records.

### dnsPromises.resolveSoa(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere il record di start of authority (record `SOA`) per l'`hostname`. On success, the `Promise` is resolved with an object with the following properties:

* `nsname`
* `hostmaster`
* `serial`
* `refresh`
* `retry`
* `expire`
* `minttl`
```js
{
  nsname: 'ns.example.com',
  hostmaster: 'root.example.com',
  serial: 2013101809,
  refresh: 10000,
  retry: 2400,
  expire: 604800,
  minttl: 3600
}
```

### dnsPromises.resolveSrv(hostname)<!-- YAML
added: v10.6.0
-->* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di servizio (record `SRV`) per l'`hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

* `priority`
* `weight`
* `port`
* `name`
```js
{
  priority: 10,
  weight: 5,
  port: 21223,
  name: 'service.example.com'
}
```

### dnsPromises.resolveTxt(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Utilizza il protocollo DNS per risolvere le query di testo (record `TXT`) per l'`hostname`. On success, the `Promise` is resolved with a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Ogni array secondario contiene pezzi TXT di un record. A seconda dell'utilizzo, questi potrebbero essere sia uniti che trattati separatamente.

### dnsPromises.reverse(ip)
<!-- YAML
added: v10.6.0
-->
* `ip` {string}

Svolge una query DNS inversa che risolve un indirizzo IPv4 o IPv6 a un array di hostname.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### dnsPromises.setServers(servers)
<!-- YAML
added: v10.6.0
-->
* `servers` {string[]} un array di stringhe formattato con [rfc5952](https://tools.ietf.org/html/rfc5952#section-6)

Imposta un indirizzo IP e una porta sul server che verrà utilizzata quando di svolge la risoluzione di un DNS. L'argomento `servers` è un array di indirizzi formattato con [rfc5952](https://tools.ietf.org/html/rfc5952#section-6). La porta può essere omessa se è utilizzata quella predefinita assegnata dallo IANA per i DNS (53).

```js
dnsPromises.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Un errore sarà generato se verrà fornito un indirizzo non valido.

The `dnsPromises.setServers()` method must not be called while a DNS query is in progress.

Note that this method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## Codici di errore

Ogni query DNS può restituire uno dei seguenti codici di errore:

- `dns.NODATA`: Il server DNS restituisce una risposta senza dati.
- `dns.FORMERR`: Il server DNS segnala una query non formattata.
- `dns.SERVFAIL`: Il server DNS restituisce un errore generale.
- `dns.NOTFOUND`: Il nome del dominio non è stato trovato.
- `dns.NOTIMP`: Il server DNS non ha la funzione richiesta implementata.
- `dns.REFUSED`: Il server DNS ha rifiutato la query.
- `dns.BADQUERY`: La query DNS non è formattata correttamente.
- `dns.BADNAME`: Hostname non formattato correttamente.
- `dns.BADFAMILY`: Famiglia di indirizzi non supportata.
- `dns.BADRESP`: La risposta DNS non è formattata correttamente.
- `dns.CONNREFUSED`: Non è possibile contattare il server DNS.
- `dns.TIMEOUT`: Timeout mentre il server DNS veniva contattato.
- `dns.EOF`: Fine del file.
- `dns.FILE`: Errore di lettura del file.
- `dns.NOMEM`: Memoria terminata.
- `dns.DESTRUCTION`: Il canale si sta distruggendo.
- `dns.BADSTR`: Stringa non formattata correttamente.
- `dns.BADFLAGS`: La flag specificata non è valida.
- `dns.NONAME`: L'hostname non è numerico.
- `dns.BADHINTS`: Il suggerimento specificato della flag non è valido.
- `dns.NOTINITIALIZED`: L'inizializzazione della libreria c-ares non è stata eseguita.
- `dns.LOADIPHLPAPI`: Error loading `iphlpapi.dll`.
- `dns.ADDRGETNETWORKPARAMS`: Could not find `GetNetworkParams` function.
- `dns.CANCELLED`: La query DNS è annullata.

## Considerazioni sull'implementazione

Nonostante [`dns.lookup()`][] e le varie funzioni di `dns.resolve*()/dns.reverse()` abbiano il medesimo obbiettivo, quello di associare un nome di rete con un indirizzo di rete (o viceversa), i loro comportamenti sono piuttosto diversi. Queste differenze possono essere sottili ma significative sul comportamento dei programmi su Node.js.

### `dns.lookup()`

Alla fin fine, [`dns.lookup()`][] utilizza le stesse funzionalità del sistema operativo, come la maggior parte degli altri programmi. Per esempio, [`dns.lookup()`][] dovrà quasi sempre risolvere un nome dato, in modo analogo al comando `ping`. Sulla maggior parte dei sistemi operativi simili a POSIX, il comportamento della funzione [`dns.lookup()`][] può essere modificato cambiando le impostazioni in nsswitch.conf(5) e/o resolv.conf(5), ma attenzione: questi cambiamenti avranno effetto sul comportamento di _tutti gli altri programmi in esecuzione sullo stesso sistema operativo_.

Anche se la chiamata a `dns.lookup()` è asincrona per la prospettiva di JavaScript, la sua implementazione è una chiamata sincrona a getaddrinfo(3) che gira sul threadpool di Libuv. Questo può avere sorprendenti implicazioni negative sulle performance di alcune applicazioni, guarda la documentazione di [`UV_THREADPOOL_SIZE`][] per maggiori informazioni.

Nota, che le varie API di rete chiameranno internamente `dns.lookup()` per risolvere l'hostname. If that is an issue, consider resolving the hostname to an address using `dns.resolve()` and using the address instead of a host name. Inoltre, alcune API di rete (come ad esempio [`socket.connect()`][] e [`dgram.createSocket()`][]) permettono al resolver predefinito `dns.lookup()`, di essere sostituito.

### `dns.resolve()`, `dns.resolve*()` e `dns.reverse()`

Queste funzioni sono implementate in modo molto diverso rispetto a [] [`dns.lookup()`]. Non utilizzano getaddrinfo(3) e svolgono _sempre_ una query DNS sulla rete. Questa comunicazione di rete è sempre fatta in modo asincrono e non utilizza il threadpool di Libuv.

Di conseguenza, queste funzioni non possono avere lo stesso impatto negativo sugli altri processi che si verificano sul threadpool di libuv che [`dns.lookup()`][] può avere.

Non utilizzano lo stesso set di file di configurazione che utilizza il [`dns.lookup()`][]. Per esempio, _non utilizzano la configurazione da `/etc/hosts`_.
