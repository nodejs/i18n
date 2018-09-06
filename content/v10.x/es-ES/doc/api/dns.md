# DNS

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `dns` contiene funciones que pertenecen a dos categorías diferentes:

1) Funciones que utilizan las instalaciones del sistema operativo subyacente para realizar la resolución de nombres, y que no necesariamente ejecutan cualquier red de comunicación. Esta categoría contiene solo una función: [`dns.lookup()`][]. **Los desarrolladores que busquen realizar la resolución de nombres de la misma manera en que se comportan otras aplicaciones en el mismo sistema operativo, deben usar [`dns.lookup()`][].**

Por ejemplo, buscando `iana.org`.

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
// address: "192.0.43.8" family: IPv4
```

2) Funciones que se conectan a un servidor DNS real para llevar a cabo la resolución de nombres, y que *siempre* utilizan la red para realizar consultas DNS. Esta categoría contiene todas las funciones en el módulo `dns`, *excepto* [`dns.lookup()`][]. Estas funciones no utilizan el mismo conjunto de archivos de configuración utilizados por [`dns.lookup()`][] (p. ej. `/etc/hosts`). Estas funciones deben ser utilizadas por los desarrolladores que no desean utilizar las instalaciones del sistema subyacente para la resolución de nombres, y en cambio, *siempre* quieren realizar consultas DNS.

A continuación, hay un ejemplo que resuelve `'archive.org'`, y luego resuelve las direcciones IP que son devueltas.

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

Hay consecuencias sutiles en la elección de uno sobre el otro, por favor consulte la [Sección de implementación de consideraciones](#dns_implementation_considerations) para más información.

## Clase: dns.Resolver

<!-- YAML
added: v8.3.0
-->

Un resolver independiente de las solicitudes DNS.

Tenga en cuenta que crear un nuevo resolver utiliza la configuración predeterminada del servidor. Ajustar los servidores utilizados por un resolver usando [`resolver.setServers()`][`dns.setServers()`] no afecta otra resolución:

```js
const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['4.4.4.4']);

// Esta solicitud utilizará el servidor en 4.4.4.4, independiente de los ajustes globales.
resolver.resolve4('example.org', (err, addresses) => {
  // ...
});
```

Los siguientes métodos desde el módulo `dns` están disponibles:

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

Cancelar todas las consultas DNS pendientes realizadas por este resolver. Las correspondientes callbacks serán llamadas con un error con código `ECANCELLED`.

## dns.getServers()

<!-- YAML
added: v0.11.3
-->

- Devuelve: {string[]}

Devuelve una matriz de cadenas de direcciones IP, con formato según [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), que actualmente están configurados por la resolución DNS. Una cadena incluirá una sección de puerto si se utiliza un puerto personalizado.

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
  - `family` {integer} El registro family. Debe ser `4` o `6`. Las direcciones IPv4 e IPv6 son ambas devueltas de forma predeterminada.
  - `hints` {number} Uno o más [compatibles con banderas `getaddrinfo`][]. Multiple flags may be passed by bitwise `OR`ing their values.
  - `all` {boolean} Cuando sea `true`, la callback devuelve todas las direcciones resueltas en matriz. De lo contrario, devuelve una única dirección. **Predeterminado:** `false`.
  - `verbatim` {boolean} Cuando sea `true`, la callback recibe direcciones IPv4 e IPv6 en el orden en el que la resolución las devolvió. Cuando sea `false`, las direcciones IPv4 son puestas antes de las direcciones IPv6. **Por defecto:** actualmente `false` (las direcciones se reordenan), pero esto se espera que cambie en un futuro no muy lejano. Código nuevo debe utilizar `{ verbatim: true }`.
- `callback` {Function} 
  - `err` {Error}
  - `address` {string} Una representación de cadena de una dirección IPv4 o IPv6.
  - `family` {integer} `4` o `6`, denotando la familia de `address`.

Resolves a hostname (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Todas las propiedades `option` son opcionales. Si `options` es un entero, entonces debe ser `4` o `6` – si `options` no es proporcionado, entonces las direcciones IPv4 e IPV6 son ambas devueltas si son encontradas.

Con la opción `all` en `true`, los argumentos para `callback` cambian a `(err, addresses)`, con `addresses` siendo una matriz de objetos con las propiedades `address` y `family`.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es el código de error. Tenga en cuenta que `err.code` se establecerá en `'ENOENT'` no solo cuando el hostname no exista, sino también cuando la búsqueda falla de otras maneras, como cuando no hay descriptores de archivo disponibles.

`dns.lookup()` No tiene necesariamente nada que ver con el protocolo DNS. La implementación utiliza una instalación de sistema operativo que puede asociar nombres con direcciones, y viceversa. Esta implementación puede tener sutil pero importantes consecuencias en el comportamiento de cualquier programa Node.js. Por favor, tómese algo su tiempo para consultar [Sección de implementación de consideraciones](#dns_implementation_considerations) antes de usar `dns.lookup()`.

Ejemplo de uso:

```js
const dns = require('dns');
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
dns.lookup('example.com', options, (err, address, family) =>
  console.log('address: %j family: IPv%s', address, family));
// address: "2606:2800:220:1:248:1893:25c8:1946" family: IPv6

// Cuando options.all es true, el resultado será una Matriz.
options.all = true;
dns.lookup('example.com', options, (err, addresses) =>
  console.log('addresses: %j', addresses));
// addresses: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
```

Si este método es invocado como su versión [`util.promisify()`][]ed, y `all` no es establecido como `true`, devuelve una `Promise` para un `Object` con propiedades `address` y `family`.

### Banderas getaddrinfo apoyadas

Las siguientes banderas pueden ser pasadas como sugerencias a [`dns.lookup()`][].

- `dns.ADDRCONFIG`: Los tipos de direcciones devueltas son determinadas por los tipos de direcciones apoyadas por el sistema actual. Por ejemplo, las direcciones IPv4 solo son devueltas si el sistema actual tiene al menos una dirección IPv4 configurada. Direcciones de loopback no son consideradas.
- `dns.V4MAPPED`: Si la familia IPv6 fue especificada, pero ninguna dirección IPv6 fue encontrada, luego devuelve las direcciones IPv6 mapeadas por IPv4. Tenga en cuenta que no es soportado en algunos sistemas operativos (p. e.j FreeBSD 10.1).

## dns.lookupService(address, port, callback)

<!-- YAML
added: v0.11.14
-->

- `address` {string}
- `port` {number}
- `callback` {Function} 
  - `err` {Error}
  - `hostname` {string} p. e.j. `ejemplo.com`
  - `service` {string} p. e.j. `http`

Resuelve los `address` y `port` dados en un hostname y servicio, usando el sistema operativo subyacente como implementación `getnameinfo`.

Si `address` no es una dirección IP válida, un `TypeError` será arrojado. El `port` será forzado a un número. Si no es un puerto legal, un `TypeError` será arrojado.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es el código de error.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Imprime: localhost ssh
});
```

Si este método es invocado en su versión [`util.promisify()`][]ed, devuelve una `Promise` para un `Object` con propiedades `hostname` y `service`.

## dns.resolve(hostname[, rrtype], callback)

<!-- YAML
added: v0.1.27
-->

- `hostname` {string} Hostname to resolve.
- `rrtype` {string} Resource record type. **Default:** `'A'`.
- `callback` {Function} 
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Usa el protocolo DNS para resolver un hostname (p. e.j. `'nodejs.org'`) en una matriz de los registros de recursos. La función `callback` tiene argumentos `(err, records)`. Cuando sea exitoso, `records` tendrá una matriz de los registros de recursos. El tipo y la estructura de resultados individuales varía basado en `rrtype`:

| `rrtype`  | `records` contiene                          | Tipo de resultado | Método de taquigrafía    |
| --------- | ------------------------------------------- | ----------------- | ------------------------ |
| `'A'`     | direcciones IPv4 (predeterminado)           | {string}          | [`dns.resolve4()`][]     |
| `'AAAA'`  | direcciones IPv6                            | {string}          | [`dns.resolve6()`][]     |
| `'CNAME'` | registros de nombres canónicos              | {string}          | [`dns.resolveCname()`][] |
| `'MX'`    | registros de intercambio de correos         | {Object}          | [`dns.resolveMx()`][]    |
| `'NAPTR'` | registros de puntero de autoridad de nombre | {Object}          | [`dns.resolveNaptr()`][] |
| `'NS'`    | registros de servidor de nombres            | {string}          | [`dns.resolveNs()`][]    |
| `'PTR'`   | registros de puntero                        | {string}          | [`dns.resolvePtr()`][]   |
| `'SOA'`   | inicio de registros de autoridad            | {Object}          | [`dns.resolveSoa()`][]   |
| `'SRV'`   | registros de servicios                      | {Object}          | [`dns.resolveSrv()`][]   |
| `'TXT'`   | registros de texto                          | {string[]}        | [`dns.resolveTxt()`][]   |
| `'ANY'`   | cualquier registro                          | {Object}          | [`dns.resolveAny()`][]   |

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es uno de los [códigos de error DNS](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

- `hostname` {string} Nombre de host para resolver.
- `options` {Object} 
  - `ttl` {boolean} Recupere el valor de Time-To-Live (TTL) de cada registro. Cuando sea `true`, la callback recibe un array de objetos `{ address: '1.2.3.4', ttl: 60 }`, en lugar de un array de strings con la expresión TTL en segundos.
- `callback` {Function} 
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Utiliza el protocolo DNS para resolver direcciones IPv4, (registros `A`) para el nombre `hostname`. El argumento de `addresses` pasado a la función `callback` contendrá un array de direcciones IPv4 (p. e.j. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

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