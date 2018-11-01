# DNS

<!--introduced_in=v0.10.0-->

> Stabilità: 2 - Stabile

Il Modulo `dns` contiene funzioni appartenenti a due diverse categorie:

1) Le funzioni che utilizzano li sistema operativo sottostante per eseguire il "name resolution" e non devono necessariamente svolgere alcuna comunicazione di rete. Questa categoria contiene una sola funzione: `dns.lookup()`][]. **Gli sviluppatori cercano di eseguire la funzione di name resolution nello stesso modo in cui le altre applicazioni del medesimo sistema operativo dovrebbero comportarsi utilizzando [`dns.lookup()`][].**

Ad esempio, guarda `iana.org`.

```js
dns.lookup('iana.org', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
// indirizzo: "192.0.43.8" famiglia: IPv4
```

2) Le funzioni che si connettono a un effettivo server DNS per eseguire il "name resolution" e che utilizzano *sempre* la rete per eseguire le query DNS. Questa categoria contiene tutte le funzioni presenti sul modulo `dns`* tranne* [`dns.lookup()`][]. Queste funzioni non utilizzano lo stesso set di file di configurazione utilizzato da [`dns.lookup()`][] (es. `/etc/hosts`). Queste funzioni dovrebbero essere utilizzate dagli sviluppatori che non vogliono utilizzare il sistema operativo sottostante per il name resolution e vogliono invece eseguire *sempre* delle query DNS.

Di seguito è riportato un esempio di risoluzione di `'archive.org'`, quindi l'indirizzo IP che ci viene restituito è risolto all'inverso.

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

Queste sono le sottili differenze di scegliere un metodo rispetto all'altro, si prega quindi di consultare la [Sezione di considerazioni sull'implementazione](#dns_implementation_considerations) per maggiori dettagli.

## Classe: dns.Resolver

<!-- YAML
added: v8.3.0
-->

Un resolver indipendente per le richieste DNS.

Si consideri che la creazione di un nuovo resolver utilizza le impostazioni di default del server. Le impostazioni utilizzate per un resolver che utilizzano [`resolver.setServers()`][`dns.setServers()`] non hanno nessun effetto sugli altri resolver:

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

Cancella tutte le query DNS eccezionali effettuate da questo resolver. I callback corrispondenti verranno identificati con il codice di errore `ECANCELLED`.

## dns.getServers()

<!-- YAML
added: v0.11.3
-->

- Restituisce: {string[]}

Restituisce un array di stringe di indirizzi IP, formattati secondo gli standard [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), che sono attualmente configurati per la risoluzione dei DNS. La stringa, includerà una sezione per la porta, se è stata utilizzata una personalizzata.

<!-- eslint-disable semi-->

```js
[
  '4.4.4.4',
  '2001:4860:4860::8888',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]
```

## dns.lookup(hostname[, options], callback)

<!-- YAML
added: v0.1.90
changes:

  - version: v1.2.0
    pr-url: https://github.com/nodejs/node/pull/744
    description: The `all` option is supported now.
-->

- `hostname` {string}
- `options` {integer | Object} 
  - `family`{integer} Il record family. Deve essere di `4` o `6`. Gli indirizzi IPv4 e IPv6 sono entrambi restituiti per default.
  - `hints`{number} Uno o più [supported `getaddrinfo` flags][]. I flag multipli possono essere passati bit per bit `oppure` utilizzando i loro valori.
  - `all` {boolean} Quando `true`, il callback restituisce tutti gli indirizzi risolti in un array. Altrimenti, restituisce un singolo indirizzo. **Default:** `false`.
  - `verbatim` {boolean} Quando `true`. il callback riceve gli indirizzi IPv4 e IPv6 nell'ordine in cui il resolver DNS li ha restituiti. Quando `falso`, invece gli indirizzi IPv4 vengono messi prima di quelli IPv6. **Default:** attualmente `false` (gli indirizzi sono riordinati) ma questo verrà cambiato in un futuro non troppo lontano. Il nuovo codice da utilizzare `{ verbatim: true }`.
- `callback` {Function} 
  - `err` {Error}
  - `address` {string} Una stringa che rappresenta un indirizzo IPv4 o IPv6.
  - `family` {integer} `4` o `6`, che indica la famiglia di `address`.

Risolve un hostname (es. `'nodejs.org'`) nei primi record A (IPv4) oppure AAAA (Ipv6) trovati. Tutte le proprietà `option` sono facoltative. Se `options` è un intero, allora deve essere `4` o `6` - se `options` non è fornito, allora gli indirizzi IPv4 e IPv6 saranno restituiti entrambi, se trovati.

Con `tutte` le opzioni impostate a `true`, gli argomenti per il `callback` cambiano `(err, addresses)`, in `addresses` diventando quindi un array di oggetti con le proprietà `address` e `family`.

In caso di errore, `err` è un oggetto di [`Error`][], dove l'`err.code` è il codice dell'errore. Si tenga a mente che l'`err.code` sarà impostato a `'ENOENT'` non solo quando l'hostname non esiste, ma anche quando la procedura di lookup fallisce per qualsiasi motivo come nel caso di mancanza dei file descriptors.

`dns.lookup()` non ha necessariamente a che fare con il protocollo DNS. L'implementazione utilizza una semplificazione del sistema operativo che permette di associare nome con indirizzi e viceversa. Questa implementazione può avere conseguenze sottili ma comunque importanti sul comportamento di qualsiasi programma sviluppato con Node.js. Si prega quindi di prendersi del tempo per consultare la [sezione delle considerazioni sull'implementazione](#dns_implementation_considerations) prima di usare il `dns.lookup()`.

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
// indirizzo: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
```

Se questo metodo viene invocato come [`util.promisify()`][] nella sua versione corrente, e non è impostato come `true`, il suo risultato è `Promise` per un `Object` con `address` e proprietà `family`.

### Flags getaddrinfo supportati

I seguenti flags possono essere passati come suggerimenti a [`dns.lookup()`][].

- `dns.ADDRCONFIG`: Restituisce il tipo di indirizzo, determinato, tra i tipi di indirizzi che il sistema supporta in quel momento. Ad Esempio. Gli indirizzi IPv4 saranno restituiti se nel sistema attualmente è presente almeno un indirizzo IPv4 configurato. Gli indirizzi di loopback non sono considerati.
- `dns.V4MAPPED`: Se viene specificata la famiglia di indrizzi IPv6, ma non vengono trovati, allora viene restituito un indirizzo IPv4 mappato come uno indirizzo IPv6. Attenzione, questo potrebbe non essere supportato in qualche sistema operativo (ad esempio FreeBSD 10.1).

## dns.lookupService(address, port, callback)

<!-- YAML
added: v0.11.14
-->

- `address` {string}
- `port` {number}
- `callback` {Function} 
  - `err` {Error}
  - `hostname` {string} e.g. `example.com`
  - `service` {string} e.g. `http`

Risolve l'`address` e la `port` specificata in un hostname e in un servizio utilizzando l'implementazione `getnameinfo` del sistema operativo sottostante.

Se l'`address` non è un indirizzo IP valido, un `TypeError` verrà mostrato. La `port` sarà associata a un numero. Se non è una porta legale, un `TypeError` verrà mostrato.

In un errore, `err` è un oggetto di [`Error`][], dove `err.code` è il codice dell'errore.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Stampa: localhost ssh
});
```

Se questo metodo viene invocato come sua versione [`util.promisify()`][], restituisce un `Promise` per un `Object` con `hostname` e le proprietà del `service`.

## dns.resolve(hostname[, rrtype], callback)

<!-- YAML
added: v0.1.27
-->

- `hostname` {string} Hostname da risolvere.
- `rrtype` {string} Tipo di record della risorsa. **Predefinito:** `'A'`.
- `callback` {Function} 
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Utilizzare il protocollo DNS per risolvere un hostname (ad esempio `'nodejs.org'`) in un array dei record delle risorse. La funzione di `callback` ha come argomenti `(err, records)`. Quando ha successo, il `records` sarà un array delle risorse dei record. Il tipo e la struttura dei risultati individuali varia in base al suo `rrtype`:

| `rrtype`  | `records` Contiene                       | Tipo di Rilsultato | Metodo Stenografico      |
| --------- | ---------------------------------------- | ------------------ | ------------------------ |
| `'A'`     | Indirizzi IPv4 (predefiniti)             | {string}           | [`dns.resolve4()`][]     |
| `'AAAA'`  | Indirizzi IPv6                           | {string}           | [`dns.resolve6()`][]     |
| `'CNAME'` | nome canonico del record                 | {string}           | [`dns.resolveCname()`][] |
| `'MX'`    | mail exchange records                    | {Object}           | [`dns.resolveMx()`][]    |
| `'NAPTR'` | record del puntatore della name autority | {Object}           | [`dns.resolveNaptr()`][] |
| `'NS'`    | record del nome del server               | {string}           | [`dns.resolveNs()`][]    |
| `'PTR'`   | record del puntatore                     | {string}           | [`dns.resolvePtr()`][]   |
| `'SOA'`   | inizio dei record di authority           | {Object}           | [`dns.resolveSoa()`][]   |
| `'SRV'`   | record di servizio                       | {Object}           | [`dns.resolveSrv()`][]   |
| `'TXT'`   | record di testo                          | {string[]}         | [`dns.resolveTxt()`][]   |
| `'ANY'`   | record qualsiasi                         | {Object}           | [`dns.resolveAny()`][]   |

In caso di errore, `err` è un oggetto di `Error`][], dove `err.code` è uno dei [DNS error codes](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)

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
  - `ttl` {boolean} Recupera il valore del Time-To-Life (TTL) di ogni record. Quando `true`, il callback riceve un array di oggetti `{ address: '1.2.3.4', ttl: 60 }` invece di un array di stringhe, con il TTL espresso in secondi.
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Utilizza il protocollo DNS per risolvere gli indirizzi IPv4 (records `A`) per l'`hostname`. The `addresses` argument passed to the `callback` function will contain an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

## dns.resolve6(hostname[, options], callback)

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

- `hostname` {string} Hostname to resolve.
- `options` {Object} 
  - `ttl` {boolean} Retrieve the Time-To-Live value (TTL) of each record. When `true`, the callback receives an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Uses the DNS protocol to resolve a IPv6 addresses (`AAAA` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of IPv6 addresses.

## dns.resolveCname(hostname, callback)

<!-- YAML
added: v0.3.2
-->

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[]}

Uses the DNS protocol to resolve `CNAME` records for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

## dns.resolveMx(hostname, callback)

<!-- YAML
added: v0.1.27
-->

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {Object[]}

Uses the DNS protocol to resolve mail exchange records (`MX` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

## dns.resolveNaptr(hostname, callback)

<!-- YAML
added: v0.9.12
-->

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {Object[]}

Uses the DNS protocol to resolve regular expression based records (`NAPTR` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects with the following properties:

- `flags`
- `service`
- `regexp`
- `replacement`
- `order`
- `preference`

<!-- eslint-skip -->

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

## dns.resolveNs(hostname, callback)

<!-- YAML
added: v0.1.90
-->

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[]}

Uses the DNS protocol to resolve name server records (`NS` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of name server records available for `hostname` (e.g. `['ns1.example.com', 'ns2.example.com']`).

## dns.resolvePtr(hostname, callback)

<!-- YAML
added: v6.0.0
-->

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[]}

Uses the DNS protocol to resolve pointer records (`PTR` records) for the `hostname`. The `addresses` argument passed to the `callback` function will be an array of strings containing the reply records.

## dns.resolveSoa(hostname, callback)

<!-- YAML
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

<!-- eslint-skip -->

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

## dns.resolveSrv(hostname, callback)

<!-- YAML
added: v0.1.27
-->

- `hostname` {string}
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {Object[]}

Uses the DNS protocol to resolve service records (`SRV` records) for the `hostname`. The `addresses` argument passed to the `callback` function will be an array of objects with the following properties:

- `priority`
- `weight`
- `port`
- `name`

<!-- eslint-skip -->

```js
{
  priority: 10,
  weight: 5,
  port: 21223,
  name: 'service.example.com'
}
```

## dns.resolveTxt(hostname, callback)

<!-- YAML
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

Uses the DNS protocol to resolve all records (also known as `ANY` or `*` query). The `ret` argument passed to the `callback` function will be an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Type      | Properties                                                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `'A'`     | `address` / `ttl`                                                                                                                               |
| `'AAAA'`  | `address` / `ttl`                                                                                                                               |
| `'CNAME'` | `value`                                                                                                                                         |
| `'MX'`    | Refer to [`dns.resolveMx()`][]                                                                                                                  |
| `'NAPTR'` | Refer to [`dns.resolveNaptr()`][]                                                                                                               |
| `'NS'`    | `value`                                                                                                                                         |
| `'PTR'`   | `value`                                                                                                                                         |
| `'SOA'`   | Refer to [`dns.resolveSoa()`][]                                                                                                                 |
| `'SRV'`   | Refer to [`dns.resolveSrv()`][]                                                                                                                 |
| `'TXT'`   | This type of record contains an array property called `entries` which refers to [`dns.resolveTxt()`][], eg. `{ entries: ['...'], type: 'TXT' }` |

Here is an example of the `ret` object passed to the callback:

<!-- eslint-disable semi -->

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

## dns.reverse(ip, callback)

<!-- YAML
added: v0.1.16
-->

- `ip` {string}
- `callback` {Function} 
  - `err` {Error}
  - `hostnames` {string[]}

Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an array of hostnames.

On error, `err` is an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

## dns.setServers(servers)

<!-- YAML
added: v0.11.3
-->

- `servers` {string[]} array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. If the port is the IANA default DNS port (53) it can be omitted.

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

An error will be thrown if an invalid address is provided.

The `dns.setServers()` method must not be called while a DNS query is in progress.

## Error codes

Each DNS query can return one of the following error codes:

- `dns.NODATA`: DNS server returned answer with no data.
- `dns.FORMERR`: DNS server claims query was misformatted.
- `dns.SERVFAIL`: DNS server returned general failure.
- `dns.NOTFOUND`: Domain name not found.
- `dns.NOTIMP`: DNS server does not implement requested operation.
- `dns.REFUSED`: DNS server refused query.
- `dns.BADQUERY`: Misformatted DNS query.
- `dns.BADNAME`: Misformatted hostname.
- `dns.BADFAMILY`: Unsupported address family.
- `dns.BADRESP`: Misformatted DNS reply.
- `dns.CONNREFUSED`: Could not contact DNS servers.
- `dns.TIMEOUT`: Timeout while contacting DNS servers.
- `dns.EOF`: End of file.
- `dns.FILE`: Error reading file.
- `dns.NOMEM`: Out of memory.
- `dns.DESTRUCTION`: Channel is being destroyed.
- `dns.BADSTR`: Misformatted string.
- `dns.BADFLAGS`: Illegal flags specified.
- `dns.NONAME`: Given hostname is not numeric.
- `dns.BADHINTS`: Illegal hints flags specified.
- `dns.NOTINITIALIZED`: c-ares library initialization not yet performed.
- `dns.LOADIPHLPAPI`: Error loading `iphlpapi.dll`.
- `dns.ADDRGETNETWORKPARAMS`: Could not find `GetNetworkParams` function.
- `dns.CANCELLED`: DNS query cancelled.

## Implementation considerations

Although [`dns.lookup()`][] and the various `dns.resolve*()/dns.reverse()` functions have the same goal of associating a network name with a network address (or vice versa), their behavior is quite different. These differences can have subtle but significant consequences on the behavior of Node.js programs.

### `dns.lookup()`

Under the hood, [`dns.lookup()`][] uses the same operating system facilities as most other programs. For instance, [`dns.lookup()`][] will almost always resolve a given name the same way as the `ping` command. On most POSIX-like operating systems, the behavior of the [`dns.lookup()`][] function can be modified by changing settings in nsswitch.conf(5) and/or resolv.conf(5), but note that changing these files will change the behavior of *all other programs running on the same operating system*.

Though the call to `dns.lookup()` will be asynchronous from JavaScript's perspective, it is implemented as a synchronous call to getaddrinfo(3) that runs on libuv's threadpool. This can have surprising negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

Note that various networking APIs will call `dns.lookup()` internally to resolve host names. If that is an issue, consider resolving the hostname to and address using `dns.resolve()` and using the address instead of a host name. Also, some networking APIs (such as [`socket.connect()`][] and [`dgram.createSocket()`][]) allow the default resolver, `dns.lookup()`, to be replaced.

### `dns.resolve()`, `dns.resolve*()` and `dns.reverse()`

These functions are implemented quite differently than [`dns.lookup()`][]. They do not use getaddrinfo(3) and they *always* perform a DNS query on the network. This network communication is always done asynchronously, and does not use libuv's threadpool.

As a result, these functions cannot have the same negative impact on other processing that happens on libuv's threadpool that [`dns.lookup()`][] can have.

They do not use the same set of configuration files than what [`dns.lookup()`][] uses. For instance, *they do not use the configuration from `/etc/hosts`*.