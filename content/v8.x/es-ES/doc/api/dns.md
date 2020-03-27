# DNS

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `dns` contiene funciones que pertenecen a dos categorías diferentes:

1) Functions that use the underlying operating system facilities to perform name resolution, and that do not necessarily perform any network communication. Esta categoría contiene solo una función: [`dns.lookup()`][]. **Developers looking to perform name resolution in the same way that other applications on the same operating system behave should use [`dns.lookup()`][].**

Por ejemplo, buscando a `iana.org`.

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
// address: "192.0.43.8" family: IPv4
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

Un resolver independiente de las solicitudes DNS.

Tenga en cuenta que crear un nuevo resolver utiliza la configuración predeterminada del servidor. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolver:

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

Cancelar todas las consultas DNS pendientes realizadas por este resolver. The corresponding callbacks will be called with an error with code `ECANCELLED`.

## dns.getServers()

<!-- YAML
added: v0.11.3
-->

Returns an array of IP address strings, formatted according to [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), that are currently configured for DNS resolution. A string will include a port section if a custom port is used.

For example:

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
  - `family` {integer} El registro family. Debe ser `4` o `6`. IPv4 and IPv6 addresses are both returned by default.
  - `hints` {number} Uno o más [compatibles con banderas `getaddrinfo`][]. Multiple flags may be passed by bitwise `OR`ing their values.
  - `all` {boolean} When `true`, the callback returns all resolved addresses in an array. De lo contrario, devuelve una única dirección. **Predeterminado:** `false`.
  - `verbatim` {boolean} When `true`, the callback receives IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Código nuevo debe utilizar `{ verbatim: true }`.
- `callback` {Function} 
  - `err` {Error}
  - `address` {string} Una representación de cadena de una dirección IPv4 o IPv6.
  - `family` {integer} `4` o `6`, denotando la familia de `address`.

Resolves a hostname (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Todas las propiedades `option` son opcionales. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the arguments for `callback` change to `(err, addresses)`, with `addresses` being an array of objects with the properties `address` and `family`.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es el código de error. Keep in mind that `err.code` will be set to `'ENOENT'` not only when the hostname does not exist but also when the lookup fails in other ways such as no available file descriptors.

`dns.lookup()` No tiene necesariamente nada que ver con el protocolo DNS. The implementation uses an operating system facility that can associate names with addresses, and vice versa. This implementation can have subtle but important consequences on the behavior of any Node.js program. Please take some time to consult the [Implementation considerations section](#dns_implementation_considerations) before using `dns.lookup()`.

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

If this method is invoked as its [`util.promisify()`][]ed version, and `all` is not set to `true`, it returns a Promise for an object with `address` and `family` properties.

### Banderas getaddrinfo apoyadas

Las siguientes banderas pueden ser pasadas como sugerencias a [`dns.lookup()`][].

- `dns.ADDRCONFIG`: Returned address types are determined by the types of addresses supported by the current system. For example, IPv4 addresses are only returned if the current system has at least one IPv4 address configured. Direcciones de loopback no son consideradas.
- `dns.V4MAPPED`: If the IPv6 family was specified, but no IPv6 addresses were found, then return IPv4 mapped IPv6 addresses. Note that it is not supported on some operating systems (e.g FreeBSD 10.1).

## dns.lookupService(address, port, callback)<!-- YAML
added: v0.11.14
-->

- `address` {string}

- `port` {number}

- `callback` {Function} 
  - `err` {Error}
  - `hostname` {string} p. e.j. `ejemplo.com`
  - `service` {string} p. e.j. `http`

Resolves the given `address` and `port` into a hostname and service using the operating system's underlying `getnameinfo` implementation.

Si `address` no es una dirección IP válida, un `TypeError` será arrojado. El `port` será forzado a un número. If it is not a legal port, a `TypeError` will be thrown.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es el código de error.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Imprime: localhost ssh
});
```

If this method is invoked as its [`util.promisify()`][]ed version, it returns a Promise for an object with `hostname` and `service` properties.

## dns.resolve(hostname[, rrtype], callback)<!-- YAML
added: v0.1.27
-->

- `hostname` {string} Hostname a resolver.

- `rrtype` {string} Tipo de registro de recuersos. **Por defecto:** `'A'`.

- `callback` {Function} 
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Uses the DNS protocol to resolve a hostname (e.g. `'nodejs.org'`) into an array of the resource records. The `callback` function has arguments `(err, records)`. When successful, `records` will be an array of resource records. El tipo y la estructura de resultados individuales varía basado en `rrtype`:

| `rrtype`  | `records` contiene                          | Tipo de resultado | Método shorthand         |
| --------- | ------------------------------------------- | ----------------- | ------------------------ |
| `'A'`     | direcciones IPv4 (predeterminado)           | {string}          | [`dns.resolve4()`][]     |
| `'AAAA'`  | direcciones IPv6                            | {string}          | [`dns.resolve6()`][]     |
| `'CNAME'` | registro de nombres canónicos               | {string}          | [`dns.resolveCname()`][] |
| `'MX'`    | registros de intercambio de correos         | {Object}          | [`dns.resolveMx()`][]    |
| `'NAPTR'` | registros de puntero de autoridad de nombre | {Object}          | [`dns.resolveNaptr()`][] |
| `'NS'`    | registros de servidor de nombres            | {string}          | [`dns.resolveNs()`][]    |
| `'PTR'`   | registros de puntero                        | {string}          | [`dns.resolvePtr()`][]   |
| `'SOA'`   | inicio de registros de autoridad            | {Object}          | [`dns.resolveSoa()`][]   |
| `'SRV'`   | registros de servicio                       | {Object}          | [`dns.resolveSrv()`][]   |
| `'TXT'`   | registros de texto                          | {string[]}        | [`dns.resolveTxt()`][]   |
| `'ANY'`   | cualquier registro                          | {Object}          | [`dns.resolveAny()`][]   |

On error, `err` is an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

- `hostname` {string} Nombre de host para resolver.
- `options` {Object} 
  - `ttl` {boolean} Recupere el valor de Time-To-Live (TTL) de cada registro. When `true`, the callback receives an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
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

- `hostname` {string} Nombre de host para resolver.
- `options` {Object} 
  - `ttl` {boolean} Recupere el valor de Time-To-Live (TTL) de cada registro. When `true`, the callback receives an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
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

Utiliza el protocolo DNS para resolver los registros `CNAME` para el `hostname`. The `addresses` argument passed to the `callback` function will contain an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

## dns.resolveMx(hostname, callback)<!-- YAML
added: v0.1.27
-->

- `hostname` {string}

- `callback` {Function}
  
  - `err` {Error}
  - `addresses` {Object[]}

Uses the DNS protocol to resolve mail exchange records (`MX` records) for the `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

## dns.resolveNaptr(hostname, callback)<!-- YAML
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

For example:

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
  - `addresses` {Object[]}

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

Utiliza el protocolo DNS para resolver todos los registros (también conocidos como consultas `ANY` o `*`). The `ret` argument passed to the `callback` function will be an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Tipo      | Propiedades                                                                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'A'`     | `address` / `ttl`                                                                                                                                             |
| `'AAAA'`  | `address` / `ttl`                                                                                                                                             |
| `'CNAME'` | `value`                                                                                                                                                       |
| `'MX'`    | Referirse a [`dns.resolveMx()`][]                                                                                                                             |
| `'NAPTR'` | Referirse a [`dns.resolveNaptr()`][]                                                                                                                          |
| `'NS'`    | `value`                                                                                                                                                       |
| `'PTR'`   | `valor`                                                                                                                                                       |
| `'SOA'`   | Referirse a [`dns.resolveSoa()`][]                                                                                                                            |
| `'SRV'`   | Referirse a [`dns.resolveSrv()`][]                                                                                                                            |
| `'TXT'`   | Este tipo de registro contiene un propiedad array llamada `entries`, la cual se refiere a [`dns.resolveTxt()`][], p. e.j. `{ entries: ['...'], type: 'TXT' }` |

A continuación, hay un ejemplo del objeto `ret` pasado a callback:

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

- `servers` {string[]} array de [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) direcciones formateadas

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. Si el puerto es el puerto DNS (53) predeterminado de IANA, puede ser omitido.

For example:

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Se produce un error si se proporciona una dirección inválida.

The `dns.setServers()` method must not be called while a DNS query is in progress.

## Códigos de error

Cada consulta DNS puede devolver uno de los siguientes códigos de error:

- `dns.NODATA`: El servidor DNS devolvió una respuesta sin datos.
- `dns.FORMERR`: La consulta de reclamos del servidor DNS no se formateó correctamente.
- `dns.SERVFAIL`: El servidor DNS devolvió un fallo general.
- `dns.NOTFOUND`: Nombre de dominio no encontrado.
- `dns.NOTIMP`: El servidor DNS no implementa la operación solicitada.
- `dns.REFUSED`: El servidor DNS negó la consulta.
- `dns.BADQUERY`: La consulta DNS no se formateó correctamente.
- `dns.BADNAME`: Hostname mal formateado.
- `dns.BADFAMILY`: Familia de direcciones no soportada.
- `dns.BADRESP`: Respuesta DNS mal formateada.
- `dns.CONNREFUSED`: No se pudo contactar servidores DNS.
- `dns.TIMEOUT`: Tiempo de espera al ponerse en contacto con los servidores DNS agotado.
- `dns.EOF`: Final de archivo.
- `dns.FILE`: Error al leer el archivo.
- `dns.NOMEM`: Sin memoria.
- `dns.DESTRUCTION`: El canal está siendo destruido.
- `dns.BADSTR`: String mal formateada.
- `dns.BADFLAGS`: Banderas ilegales especificadas.
- `dns.NONAME`: Hostname dado no es numérico.
- `dns.BADHINTS`: Señales de banderas ilegales especificadas.
- `dns.NOTINITIALIZED`: Inicialización de biblioteca c-ares no ha sido realizada.
- `dns.LOADIPHLPAPI`: Error cargando iphlpapi.dll.
- `dns.ADDRGETNETWORKPARAMS`: No se pudo encontrar la función GetNetworkParams.
- `dns.CANCELLED`: Consulta DNS cancelada.

## Consideraciones de implementación

Although [`dns.lookup()`][] and the various `dns.resolve*()/dns.reverse()` functions have the same goal of associating a network name with a network address (or vice versa), their behavior is quite different. These differences can have subtle but significant consequences on the behavior of Node.js programs.

### `dns.lookup()`

Under the hood, [`dns.lookup()`][] uses the same operating system facilities as most other programs. For instance, [`dns.lookup()`][] will almost always resolve a given name the same way as the `ping` command. On most POSIX-like operating systems, the behavior of the [`dns.lookup()`][] function can be modified by changing settings in nsswitch.conf(5) and/or resolv.conf(5), but note that changing these files will change the behavior of *all other programs running on the same operating system*.

Though the call to `dns.lookup()` will be asynchronous from JavaScript's perspective, it is implemented as a synchronous call to getaddrinfo(3) that runs on libuv's threadpool. This can have surprising negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

Note that various networking APIs will call `dns.lookup()` internally to resolve host names. If that is an issue, consider resolving the hostname to and address using `dns.resolve()` and using the address instead of a host name. Also, some networking APIs (such as [`socket.connect()`][] and [`dgram.createSocket()`][]) allow the default resolver, `dns.lookup()`, to be replaced.

### `dns.resolve()`, `dns.resolve*()` y `dns.reverse()`

Estas funciones son implementadas de forma muy diferente que las de [`dns.lookup()`][]. They do not use getaddrinfo(3) and they *always* perform a DNS query on the network. This network communication is always done asynchronously, and does not use libuv's threadpool.

As a result, these functions cannot have the same negative impact on other processing that happens on libuv's threadpool that [`dns.lookup()`][] can have.

They do not use the same set of configuration files than what [`dns.lookup()`][] uses. Por ejemplo, *no utilizan la configuración de `/etc/hosts`*.