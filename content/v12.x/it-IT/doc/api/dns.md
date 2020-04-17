# DNS

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

The `dns` module enables name resolution. For example, use it to look up IP addresses of host names.

Although named for the Domain Name System (DNS), it does not always use the DNS protocol for lookups. [`dns.lookup()`][] uses the operating system facilities to perform name resolution. It may not need to perform any network communication. Developers looking to perform name resolution in the same way that other applications on the same operating system behave should use [`dns.lookup()`][].

```js
const dns = require('dns');

dns.lookup('example.org', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
// address: "93.184.216.34" family: IPv4
```

All other functions in the `dns` module connect to an actual DNS server to perform name resolution. They will always use the network to perform DNS queries. These functions do not use the same set of configuration files used by [`dns.lookup()`][] (e.g. `/etc/hosts`). These functions should be used by developers who do not want to use the underlying operating system's facilities for name resolution, and instead want to always perform DNS queries.

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

See the [Implementation considerations section](#dns_implementation_considerations) for more information.

## Class: `dns.Resolver`
<!-- YAML
added: v8.3.0
-->

Un resolver indipendente per le richieste DNS.

Creating a new resolver uses the default server settings. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolvers:

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

### `resolver.cancel()`
<!-- YAML
added: v8.3.0
-->

Cancella tutte le query DNS eccezionali effettuate da questo resolver. The corresponding callbacks will be called with an error with code `ECANCELLED`.

## `dns.getServers()`
<!-- YAML
added: v0.11.3
-->

* Restituisce: {string[]}

Returns an array of IP address strings, formatted according to [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6), that are currently configured for DNS resolution. A string will include a port section if a custom port is used.
```js
[
  '4.4.4.4',
  '2001:4860:4860::8888',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]
```

## `dns.lookup(hostname[, options], callback)`<!-- YAML
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
  * `family`{integer} Il record family. Must be `4`, `6`, or `0`. The value `0` indicates that IPv4 and IPv6 addresses are both returned. **Default:** `0`.
  * `hints`{number} Uno o più [supported `getaddrinfo` flags][]. Multiple flags may be passed by bitwise `OR`ing their values.
  * `all` {boolean} When `true`, the callback returns all resolved addresses in an array. Altrimenti, restituisce un singolo indirizzo. **Default:** `false`.
  * `verbatim` {boolean} When `true`, the callback receives IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Il nuovo codice da utilizzare `{ verbatim: true }`.
* `callback` {Function}
  * `err` {Error}
  * `address` {string} Una stringa che rappresenta un indirizzo IPv4 o IPv6.
  * `family` {integer} `4` or `6`, denoting the family of `address`, or `0` if the address is not an IPv4 or IPv6 address. `0` is a likely indicator of a bug in the name resolution service used by the operating system.

Resolves a host name (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Tutte le proprietà `option` sono facoltative. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the arguments for `callback` change to `(err, addresses)`, with `addresses` being an array of objects with the properties `address` and `family`.

In caso di errore, `err` è un [`Error`][] object, dove l'`err.code` è il codice dell'errore. Keep in mind that `err.code` will be set to `'ENOTFOUND'` not only when the host name does not exist but also when the lookup fails in other ways such as no available file descriptors.

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

* `dns.ADDRCONFIG`: I tipi di indirizzo restituiti sono determinati dai tipi di indirizzi supportati dal sistema corrente. Ad esempio, vengono restituiri indirizzi IPv4 solo se nel sistema attuale è configurato almeno un indirizzo IPv4. Gli indirizzi di loopback non sono considerati.
* `dns.V4MAPPED`: Se viene specificata la famiglia di indirizzi IPv6, ma non viene trovato alcun indirizzo IPv6, allora viene restituito un indirizzo IPv4 mappato come un indirizzo IPv6. It is not supported on some operating systems (e.g FreeBSD 10.1).

## `dns.lookupService(address, port, callback)`<!-- YAML
added: v0.11.14
-->* `address` {string}
* `port` {number}
* `callback` {Function}
  * `err` {Error}
  * `hostname` {string} es. `example.com`
  * `service` {string} es. `http`

Resolves the given `address` and `port` into a host name and service using the operating system's underlying `getnameinfo` implementation.

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

## `dns.resolve(hostname[, rrtype], callback)`<!-- YAML
added: v0.1.27
-->* `hostname` {string} Host name to resolve.
* `rrtype` {string} Tipo di record della risorsa. **Default:** `'A'`.
* `callback` {Function}
  * `err` {Error}
  * `records` {string[] | Object[] | Object}

Uses the DNS protocol to resolve a host name (e.g. `'nodejs.org'`) into an array of the resource records. La funzione di `callback` ha come argomenti `(err, records)`. Quando ha successo, il `records` sarà un array delle risorse dei record. Il tipo e la struttura dei risultati individuali varia in base al suo `rrtype`:

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

## `dns.resolve4(hostname[, options], callback)`<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the callback receives an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[] | Object[]}

Utilizza il protocollo DNS per risolvere gli indirizzi IPv4 (record `A`) per l'`hostname`. Gli argomenti degli `addresses` passati alla funzione del `callback` conterrà un array di indirizzi IPv4 (es. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

## `dns.resolve6(hostname[, options], callback)`
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the callback receives an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[] | Object[]}

Utilizza il protocollo DNS per risolvere gli indirizzi IPv6 (record `AAAA`) per l'`hostname`. Gli argomenti degli `addresses` passati alla funzione del `callback` conterrà un array di indirizzi IPv6.

## `dns.resolveAny(hostname, callback)`

* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `ret` {Object[]}

Utilizza il protocollo DNS per risolvere tutti i record (conosciuti anche come `ANY` o query `*`). The `ret` argument passed to the `callback` function will be an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

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

## `dns.resolveCname(hostname, callback)`<!-- YAML
added: v0.3.2
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record `CNAME` per l'`hostname`. Gli argomenti degli `addresses` passati alla funzione di `callback` conterrà un array di record di nomi canonici disponibili per l'`hostname` (esempio `['bar.example.com']`).

## `dns.resolveMx(hostname, callback)`<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `address` {Object}[]}

Utilizza il protocollo DNS per risolvere i record di scambio mail (`MX` record) per l'`hostname`. L’argomento `addresses` passato alla funzione di `callback` conterrà un array di oggetti che contiene entrambe le proprietà `priority` e `exchange` (ad esempio: `{priority: 10, exchange: 'mx.example.com'}, ...]`).

## `dns.resolveNaptr(hostname, callback)`<!-- YAML
added: v0.9.12
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `address` {Object}[]}

Utilizza il protocollo DNS per risolvere i record basati sulle espressioni regolari (record `NAPTR`) per l'`hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects with the following properties:

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

## `dns.resolveNs(hostname, callback)`<!-- YAML
added: v0.1.90
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record di name server ( record `NS`) per l'`hostname`. L'argomento `addresses` passato alla funzione di `callback` conterrà un array di record con i name server disponibili per l'`hostname` (es.`['ns1.example.com', 'ns2.example.com']`).

## `dns.resolvePtr(hostname, callback)`<!-- YAML
added: v6.0.0
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record di puntatore (record `PTR`) per l'`hostname`. L'argomento `addresses` passato alla funzione di `callback` sarà un array di stringhe contenente i record di risposta.

## `dns.resolveSoa(hostname, callback)`<!-- YAML
added: v0.11.10
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `address` {Object}

Utilizza il protocollo DNS per risolvere il record di start of authority (record `SOA`) per l'`hostname`. The `address` argument passed to the `callback` function will be an object with the following properties:

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

## `dns.resolveSrv(hostname, callback)`<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `address` {Object}[]}

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

## `dns.resolveTxt(hostname, callback)`<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `records` <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type" class="type">&lt;string[][]&gt;</a>

Utilizza il protocollo DNS per risolvere le query di testo (record `TXT`) per l'`hostname`. The `records` argument passed to the `callback` function is a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Ogni array secondario contiene pezzi TXT di un record. A seconda dell'utilizzo, questi potrebbero essere sia uniti che trattati separatamente.

## `dns.reverse(ip, callback)`<!-- YAML
added: v0.1.16
-->* `ip` {string}
* `callback` {Function}
  * `err` {Error}
  * `hostnames` {string[]}

Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an array of host names.

In caso di errore, `err` è un oggetto [`Error`][], dove `err.code` è uno dei [codici di errore DNS](#dns_error_codes).

## `dns.setServers(servers)`<!-- YAML
added: v0.11.3
-->* `servers` {string[]} array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. La porta può essere omessa se è utilizzata quella predefinita assegnata dallo IANA per i DNS (53).

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

The [`dns.setServers()`][] method affects only [`dns.resolve()`][], `dns.resolve*()` and [`dns.reverse()`][] (and specifically *not* [`dns.lookup()`][]).

This method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## DNS Promises API

The `dns.promises` API provides an alternative set of asynchronous DNS methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('dns').promises`.

### Class: `dnsPromises.Resolver`<!-- YAML
added: v10.6.0
-->Un resolver indipendente per le richieste DNS.

Creating a new resolver uses the default server settings. Setting the servers used for a resolver using [`resolver.setServers()`][`dnsPromises.setServers()`] does not affect other resolvers:

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

### `dnsPromises.getServers()`<!-- YAML
added: v10.6.0
-->* Restituisce: {string[]}

Returns an array of IP address strings, formatted according to [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6), that are currently configured for DNS resolution. A string will include a port section if a custom port is used.
```js
[
  '4.4.4.4',
  '2001:4860:4860::8888',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]
```

### `dnsPromises.lookup(hostname[, options])`<!-- YAML
added: v10.6.0
-->* `hostname` {string}
* `options` {integer | Object}
  * `family`{integer} Il record family. Must be `4`, `6`, or `0`. The value `0` indicates that IPv4 and IPv6 addresses are both returned. **Default:** `0`.
  * `hints`{number} Uno o più [supported `getaddrinfo` flags][]. Multiple flags may be passed by bitwise `OR`ing their values.
  * `all` {boolean} When `true`, the `Promise` is resolved with all addresses in an array. Altrimenti, restituisce un singolo indirizzo. **Default:** `false`.
  * `verbatim` {boolean} When `true`, the `Promise` is resolved with IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Il nuovo codice da utilizzare `{ verbatim: true }`.

Resolves a host name (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Tutte le proprietà `option` sono facoltative. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the `Promise` is resolved with `addresses` being an array of objects with the properties `address` and `family`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code. Keep in mind that `err.code` will be set to `'ENOTFOUND'` not only when the host name does not exist but also when the lookup fails in other ways such as no available file descriptors.

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

### `dnsPromises.lookupService(address, port)`<!-- YAML
added: v10.6.0
-->* `address` {string}
* `port` {number}

Resolves the given `address` and `port` into a host name and service using the operating system's underlying `getnameinfo` implementation.

Se l'`address` non è un indirizzo IP valido, verrà emesso un `TypeError`. La `port` sarà associata a un numero. Se non è una porta valida, verrà emesso un `TypeError`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code.

```js
const dnsPromises = require('dns').promises;
dnsPromises.lookupService('127.0.0.1', 22).then((result) => {
  console.log(result.hostname, result.service);
  // Prints: localhost ssh
});
```

### `dnsPromises.resolve(hostname[, rrtype])`<!-- YAML
added: v10.6.0
-->* `hostname` {string} Host name to resolve.
* `rrtype` {string} Tipo di record della risorsa. **Default:** `'A'`.

Uses the DNS protocol to resolve a host name (e.g. `'nodejs.org'`) into an array of the resource records. When successful, the `Promise` is resolved with an array of resource records. The type and structure of individual results vary based on `rrtype`:

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

### `dnsPromises.resolve4(hostname[, options])`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the `Promise` is resolved with an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv4 addresses (`A` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

### `dnsPromises.resolve6(hostname[, options])`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the `Promise` is resolved with an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv6 addresses (`AAAA` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv6 addresses.

### `dnsPromises.resolveAny(hostname)`<!-- YAML
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

### `dnsPromises.resolveCname(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record `CNAME` per l'`hostname`. On success, the `Promise` is resolved with an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

### `dnsPromises.resolveMx(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di scambio mail (`MX` record) per l'`hostname`. On success, the `Promise` is resolved with an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

### `dnsPromises.resolveNaptr(hostname)`
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

### `dnsPromises.resolveNs(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di name server ( record `NS`) per l'`hostname`. On success, the `Promise` is resolved with an array of name server records available for `hostname` (e.g. `['ns1.example.com', 'ns2.example.com']`).

### `dnsPromises.resolvePtr(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utilizza il protocollo DNS per risolvere i record di puntatore (record `PTR`) per l'`hostname`. On success, the `Promise` is resolved with an array of strings containing the reply records.

### `dnsPromises.resolveSoa(hostname)`
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

### `dnsPromises.resolveSrv(hostname)`<!-- YAML
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

### `dnsPromises.resolveTxt(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utilizza il protocollo DNS per risolvere le query di testo (record `TXT`) per l'`hostname`. On success, the `Promise` is resolved with a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Ogni array secondario contiene pezzi TXT di un record. A seconda dell'utilizzo, questi potrebbero essere sia uniti che trattati separatamente.

### `dnsPromises.reverse(ip)`
<!-- YAML
added: v10.6.0
-->

* `ip` {string}

Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an array of host names.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### `dnsPromises.setServers(servers)`
<!-- YAML
added: v10.6.0
-->

* `servers` {string[]} array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. La porta può essere omessa se è utilizzata quella predefinita assegnata dallo IANA per i DNS (53).

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

This method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## Codici di errore

Ogni query DNS può restituire uno dei seguenti codici di errore:

* `dns.NODATA`: Il server DNS restituisce una risposta senza dati.
* `dns.FORMERR`: Il server DNS segnala una query non formattata.
* `dns.SERVFAIL`: Il server DNS restituisce un errore generale.
* `dns.NOTFOUND`: Il nome del dominio non è stato trovato.
* `dns.NOTIMP`: Il server DNS non ha la funzione richiesta implementata.
* `dns.REFUSED`: Il server DNS ha rifiutato la query.
* `dns.BADQUERY`: La query DNS non è formattata correttamente.
* `dns.BADNAME`: Misformatted host name.
* `dns.BADFAMILY`: Famiglia di indirizzi non supportata.
* `dns.BADRESP`: La risposta DNS non è formattata correttamente.
* `dns.CONNREFUSED`: Non è possibile contattare il server DNS.
* `dns.TIMEOUT`: Timeout mentre il server DNS veniva contattato.
* `dns.EOF`: Fine del file.
* `dns.FILE`: Errore di lettura del file.
* `dns.NOMEM`: Memoria terminata.
* `dns.DESTRUCTION`: Il canale si sta distruggendo.
* `dns.BADSTR`: Stringa non formattata correttamente.
* `dns.BADFLAGS`: La flag specificata non è valida.
* `dns.NONAME`: Given host name is not numeric.
* `dns.BADHINTS`: Il suggerimento specificato della flag non è valido.
* `dns.NOTINITIALIZED`: L'inizializzazione della libreria c-ares non è stata eseguita.
* `dns.LOADIPHLPAPI`: Error loading `iphlpapi.dll`.
* `dns.ADDRGETNETWORKPARAMS`: Could not find `GetNetworkParams` function.
* `dns.CANCELLED`: La query DNS è annullata.

## Considerazioni sull'implementazione

Nonostante [`dns.lookup()`][] e le varie funzioni di `dns.resolve*()/dns.reverse()` abbiano il medesimo obbiettivo, quello di associare un nome di rete con un indirizzo di rete (o viceversa), i loro comportamenti sono piuttosto diversi. Queste differenze possono essere sottili ma significative sul comportamento dei programmi su Node.js.

### `dns.lookup()`

Alla fin fine, [`dns.lookup()`][] utilizza le stesse funzionalità del sistema operativo, come la maggior parte degli altri programmi. Per esempio, [`dns.lookup()`][] dovrà quasi sempre risolvere un nome dato, in modo analogo al comando `ping`. On most POSIX-like operating systems, the behavior of the [`dns.lookup()`][] function can be modified by changing settings in nsswitch.conf(5) and/or resolv.conf(5), but changing these files will change the behavior of all other programs running on the same operating system.

Though the call to `dns.lookup()` will be asynchronous from JavaScript's perspective, it is implemented as a synchronous call to getaddrinfo(3) that runs on libuv's threadpool. This can have surprising negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

Various networking APIs will call `dns.lookup()` internally to resolve host names. If that is an issue, consider resolving the host name to an address using `dns.resolve()` and using the address instead of a host name. Also, some networking APIs (such as [`socket.connect()`][] and [`dgram.createSocket()`][]) allow the default resolver, `dns.lookup()`, to be replaced.

### `dns.resolve()`, `dns.resolve*()` e `dns.reverse()`

Queste funzioni sono implementate in modo molto diverso rispetto a [] [`dns.lookup()`]. They do not use getaddrinfo(3) and they _always_ perform a DNS query on the network. Questa comunicazione di rete è sempre fatta in modo asincrono e non utilizza il threadpool di Libuv.

Di conseguenza, queste funzioni non possono avere lo stesso impatto negativo sugli altri processi che si verificano sul threadpool di libuv che [`dns.lookup()`][] può avere.

Non utilizzano lo stesso set di file di configurazione che utilizza il [`dns.lookup()`][]. For instance, _they do not use the configuration from `/etc/hosts`_.
