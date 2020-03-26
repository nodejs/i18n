# DNS

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stable

Il modulo `dns` contiene funzioni appartenenti a due diverse categorie:

1) Functions that use the underlying operating system facilities to perform name resolution, and that do not necessarily perform any network communication. Questa categoria contiene una sola funzione: `dns.lookup()`][]. **Developers looking to perform name resolution in the same way that other applications on the same operating system behave should use [`dns.lookup()`][].**

Ad esempio, cercando `iana.org`.

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
console.log('address: %j family: IPv%s', address, family);
});
// indirizzo: "192.0.43.8" famiglia: IPv4
```

2) Functions that connect to an actual DNS server to perform name resolution, and that *always* use the network to perform DNS queries. This category contains all functions in the `dns` module *except* [`dns.lookup()`][]. These functions do not use the same set of configuration files used by [`dns.lookup()`][] (e.g. `/etc/hosts`). These functions should be used by developers who do not want to use the underlying operating system's facilities for name resolution, and instead want to *always* perform DNS queries.

Below is an example that resolves `'archive.org'` then reverse resolves the IP addresses that are returned.

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

There are subtle consequences in choosing one over the other, please consult the [Implementation considerations section](#dns_implementation_considerations) for more information.

## Class dns.Resolver

<!-- YAML
added: v8.3.0
-->

Un resolver indipendente per le richieste DNS.

Si consideri che la creazione di un nuovo resolver utilizza le impostazioni di default del server. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolver:

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

- [`resolver.getServers()`][`dns.getServers()`]
- [`resolver.setServers()`][`dns.setServers()`]
- [`resolver.resolve()`][`dns.resolve()`]
- [`resolver.resolve4()`][`dns.resolve4()`]
- [`resolver.resolve6()`][`dns.resolve6()`]
- [`resolver.resolveAny()`][`dns.resolveAny()`]
- [`resolver.resolveCname()`][`dns.resolveCname()`]
- [`resolver.resolveMx()`][`dns.resolveMx()`]
- [`resolver.resolveNaptr()`][`dns.resolveNaptr()`]
- [`resolver.resolveNs()`][`dns.resolveNs()`]
- [`resolver.resolvePtr()`][`dns.resolvePtr()`]
- [`resolver.resolveSoa()`][`dns.resolveSoa()`]
- [`resolver.resolveSrv()`][`dns.resolveSrv()`]
- [`resolver.resolveTxt()`][`dns.resolveTxt()`]
- [`resolver.reverse()`][`dns.reverse()`]

### resolver.cancel()

<!-- YAML
added: v8.3.0
-->

Cancella tutte le query DNS eccezionali effettuate da questo resolver. The corresponding callbacks will be called with an error with code `ECANCELLED`.

## dns.getServers()

<!-- YAML
added: v0.11.3
-->

Returns an array of IP address strings, formatted according to [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), that are currently configured for DNS resolution. A string will include a port section if a custom port is used.

Per esempio:

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

  - version: v1.2.0
    pr-url: https://github.com/nodejs/node/pull/744
    description: The `all` option is supported now.
-->

- `hostname` {string}
- `options` {integer | Object} 
  - `family`{integer} Il record family. Deve essere `4` o `6`. IPv4 and IPv6 addresses are both returned by default.
  - `hints`{number} Uno o più [supported `getaddrinfo` flags][]. Multiple flags may be passed by bitwise `OR`ing their values.
  - `all` {boolean} When `true`, the callback returns all resolved addresses in an array. Altrimenti, restituisce un singolo indirizzo. **Default:** `false`.
  - `verbatim` {boolean} When `true`, the callback receives IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Il nuovo codice da utilizzare `{ verbatim: true }`.
- `callback` {Function} 
  - `err` {Error}
  - `address` {string} Una stringa che rappresenta un indirizzo IPv4 o IPv6.
  - `family` {integer} `4` o `6`, che indica la famiglia di `address`.

Resolves a hostname (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Tutte le proprietà `option` sono facoltative. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the arguments for `callback` change to `(err, addresses)`, with `addresses` being an array of objects with the properties `address` and `family`.

In caso di errore, `err` è un [`Error`][] object, dove l'`err.code` è il codice dell'errore. Keep in mind that `err.code` will be set to `'ENOENT'` not only when the hostname does not exist but also when the lookup fails in other ways such as no available file descriptors.

`dns.lookup()` non ha necessariamente a che fare con il protocollo DNS. The implementation uses an operating system facility that can associate names with addresses, and vice versa. This implementation can have subtle but important consequences on the behavior of any Node.js program. Please take some time to consult the [Implementation considerations section](#dns_implementation_considerations) before using `dns.lookup()`.

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

If this method is invoked as its [`util.promisify()`][]ed version, and `all` is not set to `true`, it returns a Promise for an object with `address` and `family` properties.

### Flags getaddrinfo supportati

I seguenti flags possono essere passati come suggerimenti a [`dns.lookup()`][].

- `dns.ADDRCONFIG`: Returned address types are determined by the types of addresses supported by the current system. For example, IPv4 addresses are only returned if the current system has at least one IPv4 address configured. Gli indirizzi di loopback non sono considerati.
- `dns.V4MAPPED`: If the IPv6 family was specified, but no IPv6 addresses were found, then return IPv4 mapped IPv6 addresses. Note that it is not supported on some operating systems (e.g FreeBSD 10.1).

## dns.lookupService(address, port, callback)<!-- YAML
added: v0.11.14
-->

- `address` {string}

- `port` {number}

- `callback` {Function} 
  - `err` {Error}
  - `hostname` {string} es. `example.com`
  - `service` {string} es. `http`

Resolves the given `address` and `port` into a hostname and service using the operating system's underlying `getnameinfo` implementation.

Se l'`address` non è un indirizzo IP valido, verrà emesso un `TypeError`. La `port` sarà associata a un numero. If it is not a legal port, a `TypeError` will be thrown.

In un errore, `err` è un [`Error`][] object, dove `err.code` è il codice dell'errore.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Stampa: localhost ssh
});
```

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `hostname` and `service` properties.

## dns.resolve(hostname[, rrtype], callback)<!-- YAML
added: v0.1.27
-->

- `hostname` {string} Hostname to resolve.

- `rrtype` {string} Resource record type. **Predefinito:** `'A'`.

- `callback` {Function} 
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Uses the DNS protocol to resolve a hostname (e.g. `'nodejs.org'`) into an array of the resource records. The `callback` function has arguments `(err, records)`. When successful, `records` will be an array of resource records. Il tipo e la struttura dei risultati individuali varia in base al suo `rrtype`:

| `rrtype`  | `records` contiene                       | Tipo di Risultato | Metodo Stenografico      |
| --------- | ---------------------------------------- | ----------------- | ------------------------ |
| `'A'`     | Indirizzi IPv4 (predefiniti)             | {string}          | [`dns.resolve4()`][]     |
| `'AAAA'`  | Indirizzi IPv6                           | {string}          | [`dns.resolve6()`][]     |
| `'CNAME'` | nome canonico del record                 | {string}          | [`dns.resolveCname()`][] |
| `'MX'`    | mail exchange records                    | {Object}          | [`dns.resolveMx()`][]    |
| `'NAPTR'` | record del puntatore della name autority | {Object}          | [`dns.resolveNaptr()`][] |
| `'NS'`    | record del nome del server               | {string}          | [`dns.resolveNs()`][]    |
| `'PTR'`   | record del puntatore                     | {string}          | [`dns.resolvePtr()`][]   |
| `'SOA'`   | inizio dei record di authority           | {Object}          | [`dns.resolveSoa()`][]   |
| `'SRV'`   | record di servizio                       | {Object}          | [`dns.resolveSrv()`][]   |
| `'TXT'`   | record di testo                          | {string[]}        | [`dns.resolveTxt()`][]   |
| `'ANY'`   | record qualsiasi                         | {Object}          | [`dns.resolveAny()`][]   |

On error, `err` is an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

- `hostname` {string} Hostname da risolvere.
- `options` {Object} 
  - `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the callback receives an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Uses the DNS protocol to resolve a IPv4 addresses (`A` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

## dns.resolve6(hostname[, options], callback)

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

- `hostname` {string} Hostname da risolvere.
- `options` {Object} 
  - `ttl` {boolean} Recupera il valore del Time-To-Live (TTL) di ogni record. When `true`, the callback receives an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Uses the DNS protocol to resolve a IPv6 addresses (`AAAA` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of IPv6 addresses.

## dns.resolveCname(hostname, callback)<!-- YAML
added: v0.3.2
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `addresses` {string[]}

Utilizza il protocollo DNS per risolvere i record `CNAME` per l'`hostname`. The `addresses` argument passed to the `callback` function will contain an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

## dns.resolveMx(hostname, callback)<!-- YAML
added: v0.1.27
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `address` {Object}[]}

Uses the DNS protocol to resolve mail exchange records (`MX` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

## dns.resolveNaptr(hostname, callback)<!-- YAML
added: v0.9.12
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `address` {Object}[]}

Uses the DNS protocol to resolve regular expression based records (`NAPTR` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects with the following properties:

- `flags`
- `service`
- `regexp`
- `replacement`
- `order`
- `preference`

Per esempio:

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
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `addresses` {string[]}

Uses the DNS protocol to resolve name server records (`NS` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of name server records available for `hostname` (e.g. `['ns1.example.com', 'ns2.example.com']`).

## dns.resolvePtr(hostname, callback)<!-- YAML
added: v6.0.0
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `addresses` {string[]}

Uses the DNS protocol to resolve pointer records (`PTR` records) for the `hostname`. The `addresses` argument passed to the `callback` function will be an array of strings containing the reply records.

## dns.resolveSoa(hostname, callback)<!-- YAML
added: v0.11.10
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `address` {Object}

Uses the DNS protocol to resolve a start of authority record (`SOA` record) for the `hostname`. The `address` argument passed to the `callback` function will be an object with the following properties:

- `nsname`
- `hostmaster`
- `serial`
- `refresh`
- `retry`
- `expire`
- `minttl`

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
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `address` {Object}[]}

Uses the DNS protocol to resolve service records (`SRV` records) for the `hostname`. The `addresses` argument passed to the `callback` function will be an array of objects with the following properties:

- `priority`
- `weight`
- `port`
- `name`

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
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `records` {string[][]}

Uses the DNS protocol to resolve text queries (`TXT` records) for the `hostname`. The `records` argument passed to the `callback` function is a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Each sub-array contains TXT chunks of one record. Depending on the use case, these could be either joined together or treated separately.

## dns.resolveAny(hostname, callback)

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `ret` {Object[]}

Utilizza il protocollo DNS per risolvere tutti i record (conosciuti anche come `ANY` o query `*`). The `ret` argument passed to the `callback` function will be an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Type      | Proprietà                                                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'A'`     | `address` / `ttl`                                                                                                                                              |
| `'AAAA'`  | `address` / `ttl`                                                                                                                                              |
| `'CNAME'` | `value`                                                                                                                                                        |
| `'MX'`    | Fai riferimento a [`dns.resolveMx()`][]                                                                                                                        |
| `'NAPTR'` | Fai riferimento a [`dns.resolveNaptr()`][]                                                                                                                     |
| `'NS'`    | `value`                                                                                                                                                        |
| `'PTR'`   | `value`                                                                                                                                                        |
| `'SOA'`   | Fai riferimento a [`dns.resolveSoa()`][]                                                                                                                       |
| `'SRV'`   | Fai riferimento a [`dns.resolveSrv()`][]                                                                                                                       |
| `'TXT'`   | Questo tipo di record contiene un array di proprietà chiamate `entries` che fanno riferimento a `dns.resolveTxt()`][], es. `{ entries: ['...'], type: 'TXT' }` |

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

## dns.reverse(ip, callback)<!-- YAML
added: v0.1.16
-->

- `ip` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `hostnames` {string[]}

Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an array of hostnames.

On error, `err` is an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

## dns.setServers(servers)<!-- YAML
added: v0.11.3
-->

- `servers` {string[]} un array di stringhe formattato con [rfc5952](https://tools.ietf.org/html/rfc5952#section-6)

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. La porta può essere omessa se è utilizzata quella predefinita assegnata dallo IANA per i DNS (53).

Per esempio:

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Un errore sarà generato se verrà fornito un indirizzo non valido.

The `dns.setServers()` method must not be called while a DNS query is in progress.

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
- `dns.LOADIPHLPAPI`: Error loading iphlpapi.dll.
- `dns.ADDRGETNETWORKPARAMS`: Could not find GetNetworkParams function.
- `dns.CANCELLED`: La query DNS è annullata.

## Considerazioni sull'implementazione

Although [`dns.lookup()`][] and the various `dns.resolve*()/dns.reverse()` functions have the same goal of associating a network name with a network address (or vice versa), their behavior is quite different. These differences can have subtle but significant consequences on the behavior of Node.js programs.

### `dns.lookup()`

Under the hood, [`dns.lookup()`][] uses the same operating system facilities as most other programs. For instance, [`dns.lookup()`][] will almost always resolve a given name the same way as the `ping` command. On most POSIX-like operating systems, the behavior of the [`dns.lookup()`][] function can be modified by changing settings in nsswitch.conf(5) and/or resolv.conf(5), but note that changing these files will change the behavior of *all other programs running on the same operating system*.

Though the call to `dns.lookup()` will be asynchronous from JavaScript's perspective, it is implemented as a synchronous call to getaddrinfo(3) that runs on libuv's threadpool. This can have surprising negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

Note that various networking APIs will call `dns.lookup()` internally to resolve host names. If that is an issue, consider resolving the hostname to and address using `dns.resolve()` and using the address instead of a host name. Also, some networking APIs (such as [`socket.connect()`][] and [`dgram.createSocket()`][]) allow the default resolver, `dns.lookup()`, to be replaced.

### `dns.resolve()`, `dns.resolve*()` e `dns.reverse()`

Queste funzioni sono implementate in modo molto diverso rispetto a [] [`dns.lookup()`]. They do not use getaddrinfo(3) and they *always* perform a DNS query on the network. This network communication is always done asynchronously, and does not use libuv's threadpool.

As a result, these functions cannot have the same negative impact on other processing that happens on libuv's threadpool that [`dns.lookup()`][] can have.

They do not use the same set of configuration files than what [`dns.lookup()`][] uses. Per esempio, *non utilizzano la configurazione da `/etc/hosts`*.