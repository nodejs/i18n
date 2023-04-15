# DNS

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

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

Un resolver independiente de las solicitudes DNS.

Creating a new resolver uses the default server settings. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolvers:

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

Cancelar todas las consultas DNS pendientes realizadas por este resolver. The corresponding callbacks will be called with an error with code `ECANCELLED`.

## `dns.getServers()`
<!-- YAML
added: v0.11.3
-->

* Devuelve: {string[]}

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
  * `family` {integer} El registro family. Must be `4`, `6`, or `0`. The value `0` indicates that IPv4 and IPv6 addresses are both returned. **Default:** `0`.
  * `hints` {number} Uno o más [compatibles con banderas `getaddrinfo`][]. Multiple flags may be passed by bitwise `OR`ing their values.
  * `all` {boolean} When `true`, the callback returns all resolved addresses in an array. De lo contrario, devuelve una única dirección. **Default:** `false`.
  * `verbatim` {boolean} When `true`, the callback receives IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Código nuevo debe utilizar `{ verbatim: true }`.
* `callback` {Function}
  * `err` {Error}
  * `address` {string} Una representación de cadena de una dirección IPv4 o IPv6.
  * `family` {integer} `4` or `6`, denoting the family of `address`, or `0` if the address is not an IPv4 or IPv6 address. `0` is a likely indicator of a bug in the name resolution service used by the operating system.

Resolves a host name (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Todas las propiedades `option` son opcionales. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the arguments for `callback` change to `(err, addresses)`, with `addresses` being an array of objects with the properties `address` and `family`.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es el código de error. Keep in mind that `err.code` will be set to `'ENOTFOUND'` not only when the host name does not exist but also when the lookup fails in other ways such as no available file descriptors.

`dns.lookup()` no tiene necesariamente nada que ver con el protocolo DNS. La implementación utiliza una instalación de sistema operativo que puede asociar nombres con direcciones, y viceversa. Esta implementación puede tener sutiles pero importantes consecuencias en el comportamiento de cualquier programa de Node.js. Por favor, tómese algo de su tiempo para consultar la [Sección de implementación de consideraciones](#dns_implementation_considerations) antes de usar `dns.lookup()`.

Ejemplo de uso:

```js
const dns = require('dns');
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
dns.lookup('example.com', options, (err, address, family) =>
  console.log('address: %j family: IPv%s', address, family));
// dirección: "2606:2800:220:1:248:1893:25c8:1946" family: IPv6

// Cuando options.all es true, el resultado será un Array.
options.all = true;
dns.lookup('example.com', options, (err, addresses) =>
  console.log('addresses: %j', addresses));
// direcciones: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
```

If this method is invoked as its [`util.promisify()`][]ed version, and `all` is not set to `true`, it returns a `Promise` for an `Object` with `address` and `family` properties.

### Banderas getaddrinfo soportadas

Las siguientes banderas pueden ser pasadas como sugerencias a [`dns.lookup()`][].

* `dns.ADDRCONFIG`: Los tipos de direcciones devueltas son determinados por los tipos de direcciones soportadas por el sistema actual. Por ejemplo, las direcciones IPv4 solo son devueltas si el sistema actual tiene al menos una dirección IPv4 configurada. Las direcciones loopback no son consideradas.
* `dns.V4MAPPED`: Si la familia IPv6 fue especificada, pero ninguna dirección IPv6 fue encontrada, entonces devuelve las direcciones IPv6 mapeadas por IPv4. It is not supported on some operating systems (e.g FreeBSD 10.1).

## `dns.lookupService(address, port, callback)`<!-- YAML
added: v0.11.14
-->* `address` {string}
* `port` {number}
* `callback` {Function}
  * `err` {Error}
  * `hostname` {string} p. e.j. `ejemplo.com`
  * `service` {string} p. e.j. `http`

Resolves the given `address` and `port` into a host name and service using the operating system's underlying `getnameinfo` implementation.

Si `address` no es una dirección IP válida, se producirá un `TypeError`. El `port` será forzado a ser un número. Si no es un puerto legal, se producirá un `TypeError`.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es el código de error.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Imprime: localhost ssh
});
```

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `hostname` and `service` properties.

## `dns.resolve(hostname[, rrtype], callback)`<!-- YAML
added: v0.1.27
-->* `hostname` {string} Host name to resolve.
* `rrtype` {string} Tipo de registro de recuersos. **Default:** `'A'`.
* `callback` {Function}
  * `err` {Error}
  * `records` {string[] | Object[] | Object}

Uses the DNS protocol to resolve a host name (e.g. `'nodejs.org'`) into an array of the resource records. La función `callback` tiene argumentos `(err, records)`. Cuando sea exitoso, `records` será un array de los registros de recursos. El tipo y la estructura de resultados individuales varía basado en `rrtype`:

| `rrtype`  | `records` contiene                          | Tipo de resultado | Método shorthand         |
| --------- | ------------------------------------------- | ----------------- | ------------------------ |
| `'A'`     | direcciones IPv4 (predeterminado)           | {string}          | [`dns.resolve4()`][]     |
| `'AAAA'`  | direcciones IPv6                            | {string}          | [`dns.resolve6()`][]     |
| `'ANY'`   | cualquier registro                          | {Object}          | [`dns.resolveAny()`][]   |
| `'CNAME'` | registro de nombres canónicos               | {string}          | [`dns.resolveCname()`][] |
| `'MX'`    | registros de intercambio de correos         | {Object}          | [`dns.resolveMx()`][]    |
| `'NAPTR'` | registros de puntero de autoridad de nombre | {Object}          | [`dns.resolveNaptr()`][] |
| `'NS'`    | registros de servidor de nombres            | {string}          | [`dns.resolveNs()`][]    |
| `'PTR'`   | registros de puntero                        | {string}          | [`dns.resolvePtr()`][]   |
| `'SOA'`   | inicio de registros de autoridad            | {Object}          | [`dns.resolveSoa()`][]   |
| `'SRV'`   | registros de servicio                       | {Object}          | [`dns.resolveSrv()`][]   |
| `'TXT'`   | registros de texto                          | {string[]}        | [`dns.resolveTxt()`][]   |

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es uno de los [códigos de error DNS](#dns_error_codes).

## `dns.resolve4(hostname[, options], callback)`<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera el valor de Time-To-Live (TTL) de cada registro. When `true`, the callback receives an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[] | Object[]}

Utiliza el protocolo DNS para resolver direcciones IPv4 (registros `A`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de direcciones IPv4 (p. e.j. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

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
  * `ttl` {boolean} Recupera el valor de Time-To-Live (TTL) de cada registro. When `true`, the callback receives an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[] | Object[]}

Utiliza el protocolo DNS para resolver direcciones IPv6 (registros `AAAA`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de direcciones IPv6.

## `dns.resolveAny(hostname, callback)`

* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `ret` {Object[]}

Utiliza el protocolo DNS para resolver todos los registros (también conocidos como consultas `ANY` o `*`). The `ret` argument passed to the `callback` function will be an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Tipo      | Propiedades                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'A'`     | `address`/`ttl`                                                                                                                                  |
| `'AAAA'`  | `address`/`ttl`                                                                                                                                  |
| `'CNAME'` | `value`                                                                                                                                          |
| `'MX'`    | Referirse a [`dns.resolveMx()`][]                                                                                                                |
| `'NAPTR'` | Referirse a [`dns.resolveNaptr()`][]                                                                                                             |
| `'NS'`    | `value`                                                                                                                                          |
| `'PTR'`   | `value`                                                                                                                                          |
| `'SOA'`   | Referirse a [`dns.resolveSoa()`][]                                                                                                               |
| `'SRV'`   | Referirse a [`dns.resolveSrv()`][]                                                                                                               |
| `'TXT'`   | This type of record contains an array property called `entries` which refers to [`dns.resolveTxt()`][], e.g. `{ entries: ['...'], type: 'TXT' }` |

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

DNS server operators may choose not to respond to `ANY` queries. It may be better to call individual methods like [`dns.resolve4()`][], [`dns.resolveMx()`][], and so on. For more details, see [RFC 8482](https://tools.ietf.org/html/rfc8482).

## `dns.resolveCname(hostname, callback)`<!-- YAML
added: v0.3.2
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[]}

Utiliza el protocolo DNS para resolver los registros `CNAME` para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de registros de nombres canónicos disponibles para el `hostname` (p. e.j. `['bar.example.com']`).

## `dns.resolveMx(hostname, callback)`<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {Object[]}

Utiliza el protocolo DNS para resolver el registro de intercambios de correo (registros `MX`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de objetos que contengan ambas propiedades `priority` y `exchange` (p. e.j. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

## `dns.resolveNaptr(hostname, callback)`<!-- YAML
added: v0.9.12
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {Object[]}

Utiliza el protocolo DNS para resolver los registros basados en expresiones regulares (registros `NAPTR`) para el `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects with the following properties:

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

Utiliza el protocolo DNS para resolver los registros de servidor de nombres (registros `NS`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de registros de servidores de nombres disponibles para el `hostname` (p. e.j. `['ns1.example.com', 'ns2.example.com']`).

## `dns.resolvePtr(hostname, callback)`<!-- YAML
added: v6.0.0
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `addresses` {string[]}

Utiliza el protocolo DNS para resolver los registros de punteros (registros `PTR`) para el `hostname`. El argumento `addresses` pasado a la función `callback` será un array de strings que contendrá los registros de respuesta.

## `dns.resolveSoa(hostname, callback)`<!-- YAML
added: v0.11.10
-->* `hostname` {string}
* `callback` {Function}
  * `err` {Error}
  * `address` {Object}

Utiliza el protocolo DNS para resolver un registro de inicio de autoridad (registros `SOA`) para el `hostname`. The `address` argument passed to the `callback` function will be an object with the following properties:

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
  * `addresses` {Object[]}

Utiliza el protocolo DNS para resolver los registros de servicio (de registro `SRV`) para el `hostname`. El argumento `addresses` pasado a la función `callback` será un array de objetos con las siguientes propiedades:

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

Utiliza el protocolo DNS para resolver consultas de texto (registros `TXT`) para el `hostname`. The `records` argument passed to the `callback` function is a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Cada sub-array contiene pedazos de TXT para un registro. Dependiendo del caso de uso, estos podrían unirse o ser tratados por separado.

## `dns.reverse(ip, callback)`<!-- YAML
added: v0.1.16
-->* `ip` {string}
* `callback` {Function}
  * `err` {Error}
  * `hostnames` {string[]}

Performs a reverse DNS query that resolves an IPv4 or IPv6 address to an array of host names.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es uno de los [errores de código DNS](#dns_error_codes).

## `dns.setServers(servers)`<!-- YAML
added: v0.11.3
-->* `servers` {string[]} array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. Si el puerto es el puerto DNS (53) predeterminado de IANA, puede ser omitido.

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Se produce un error si se proporciona una dirección inválida.

El método `dns.setServers()` no debe ser llamado mientras que una consulta DNS esté en proceso.

The [`dns.setServers()`][] method affects only [`dns.resolve()`][], `dns.resolve*()` and [`dns.reverse()`][] (and specifically *not* [`dns.lookup()`][]).

This method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## DNS Promises API

The `dns.promises` API provides an alternative set of asynchronous DNS methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('dns').promises`.

### Class: `dnsPromises.Resolver`<!-- YAML
added: v10.6.0
-->Un resolver independiente de las solicitudes DNS.

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
-->* Devuelve: {string[]}

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
  * `family` {integer} El registro family. Must be `4`, `6`, or `0`. The value `0` indicates that IPv4 and IPv6 addresses are both returned. **Default:** `0`.
  * `hints` {number} Uno o más [compatibles con banderas `getaddrinfo`][]. Multiple flags may be passed by bitwise `OR`ing their values.
  * `all` {boolean} When `true`, the `Promise` is resolved with all addresses in an array. De lo contrario, devuelve una única dirección. **Default:** `false`.
  * `verbatim` {boolean} When `true`, the `Promise` is resolved with IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. Código nuevo debe utilizar `{ verbatim: true }`.

Resolves a host name (e.g. `'nodejs.org'`) into the first found A (IPv4) or AAAA (IPv6) record. Todas las propiedades `option` son opcionales. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the `Promise` is resolved with `addresses` being an array of objects with the properties `address` and `family`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code. Keep in mind that `err.code` will be set to `'ENOTFOUND'` not only when the host name does not exist but also when the lookup fails in other ways such as no available file descriptors.

[`dnsPromises.lookup()`][] does not necessarily have anything to do with the DNS protocol. The implementation uses an operating system facility that can associate names with addresses, and vice versa. This implementation can have subtle but important consequences on the behavior of any Node.js program. Please take some time to consult the [Implementation considerations section](#dns_implementation_considerations) before using `dnsPromises.lookup()`.

Ejemplo de uso:

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

Si `address` no es una dirección IP válida, se producirá un `TypeError`. El `port` será forzado a ser un número. Si no es un puerto legal, se producirá un `TypeError`.

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
* `rrtype` {string} Tipo de registro de recuersos. **Default:** `'A'`.

Uses the DNS protocol to resolve a host name (e.g. `'nodejs.org'`) into an array of the resource records. When successful, the `Promise` is resolved with an array of resource records. The type and structure of individual results vary based on `rrtype`:

| `rrtype`  | `records` contiene                          | Tipo de resultado | Método shorthand                 |
| --------- | ------------------------------------------- | ----------------- | -------------------------------- |
| `'A'`     | direcciones IPv4 (predeterminado)           | {string}          | [`dnsPromises.resolve4()`][]     |
| `'AAAA'`  | direcciones IPv6                            | {string}          | [`dnsPromises.resolve6()`][]     |
| `'ANY'`   | cualquier registro                          | {Object}          | [`dnsPromises.resolveAny()`][]   |
| `'CNAME'` | registro de nombres canónicos               | {string}          | [`dnsPromises.resolveCname()`][] |
| `'MX'`    | registros de intercambio de correos         | {Object}          | [`dnsPromises.resolveMx()`][]    |
| `'NAPTR'` | registros de puntero de autoridad de nombre | {Object}          | [`dnsPromises.resolveNaptr()`][] |
| `'NS'`    | registros de servidor de nombres            | {string}          | [`dnsPromises.resolveNs()`][]    |
| `'PTR'`   | registros de puntero                        | {string}          | [`dnsPromises.resolvePtr()`][]   |
| `'SOA'`   | inicio de registros de autoridad            | {Object}          | [`dnsPromises.resolveSoa()`][]   |
| `'SRV'`   | registros de servicio                       | {Object}          | [`dnsPromises.resolveSrv()`][]   |
| `'TXT'`   | registros de texto                          | {string[]}        | [`dnsPromises.resolveTxt()`][]   |

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### `dnsPromises.resolve4(hostname[, options])`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera el valor de Time-To-Live (TTL) de cada registro. When `true`, the `Promise` is resolved with an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv4 addresses (`A` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

### `dnsPromises.resolve6(hostname[, options])`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Host name to resolve.
* `options` {Object}
  * `ttl` {boolean} Recupera el valor de Time-To-Live (TTL) de cada registro. When `true`, the `Promise` is resolved with an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv6 addresses (`AAAA` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv6 addresses.

### `dnsPromises.resolveAny(hostname)`<!-- YAML
added: v10.6.0
-->* `hostname` {string}

Utiliza el protocolo DNS para resolver todos los registros (también conocidos como consultas `ANY` o `*`). On success, the `Promise` is resolved with an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Tipo      | Propiedades                                                                                                                                              |
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

Utiliza el protocolo DNS para resolver los registros `CNAME` para el `hostname`. On success, the `Promise` is resolved with an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

### `dnsPromises.resolveMx(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utiliza el protocolo DNS para resolver el registro de intercambios de correo (registros `MX`) para el `hostname`. On success, the `Promise` is resolved with an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

### `dnsPromises.resolveNaptr(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utiliza el protocolo DNS para resolver los registros basados en expresiones regulares (registros `NAPTR`) para el `hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

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

Utiliza el protocolo DNS para resolver los registros de servidor de nombres (registros `NS`) para el `hostname`. On success, the `Promise` is resolved with an array of name server records available for `hostname` (e.g. `['ns1.example.com', 'ns2.example.com']`).

### `dnsPromises.resolvePtr(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utiliza el protocolo DNS para resolver los registros de punteros (registros `PTR`) para el `hostname`. On success, the `Promise` is resolved with an array of strings containing the reply records.

### `dnsPromises.resolveSoa(hostname)`
<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utiliza el protocolo DNS para resolver un registro de inicio de autoridad (registros `SOA`) para el `hostname`. On success, the `Promise` is resolved with an object with the following properties:

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

Utiliza el protocolo DNS para resolver los registros de servicio (de registro `SRV`) para el `hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

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

Utiliza el protocolo DNS para resolver consultas de texto (registros `TXT`) para el `hostname`. On success, the `Promise` is resolved with a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Cada sub-array contiene pedazos de TXT para un registro. Dependiendo del caso de uso, estos podrían unirse o ser tratados por separado.

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

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [RFC 5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. Si el puerto es el puerto DNS (53) predeterminado de IANA, puede ser omitido.

```js
dnsPromises.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Se produce un error si se proporciona una dirección inválida.

The `dnsPromises.setServers()` method must not be called while a DNS query is in progress.

This method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## Códigos de error

Cada consulta DNS puede devolver uno de los siguientes códigos de error:

* `dns.NODATA`: El servidor DNS devolvió una respuesta sin datos.
* `dns.FORMERR`: El servidor DNS afirma que la consulta no se formateó correctamente.
* `dns.SERVFAIL`: El servidor DNS devolvió un fallo general.
* `dns.NOTFOUND`: Nombre de dominio no encontrado.
* `dns.NOTIMP`: El servidor DNS no implementa la operación solicitada.
* `dns.REFUSED`: El servidor DNS rechazó la consulta.
* `dns.BADQUERY`: Consulta DNS mal formateada.
* `dns.BADNAME`: Misformatted host name.
* `dns.BADFAMILY`: Familia de direcciones no soportada.
* `dns.BADRESP`: Respuesta DNS mal formateada.
* `dns.CONNREFUSED`: No se pudo contactar servidores DNS.
* `dns.TIMEOUT`: Tiempo de espera al contactar los servidores DNS.
* `dns.EOF`: Fin de vida útil.
* `dns.FILE`: Error al leer el archivo.
* `dns.NOMEM`: Sin memoria.
* `dns.DESTRUCTION`: El canal está siendo destruido.
* `dns.BADSTR`: String mal formateada.
* `dns.BADFLAGS`: Banderas ilegales especificadas.
* `dns.NONAME`: Given host name is not numeric.
* `dns.BADHINTS`: Señales de banderas ilegales especificadas.
* `dns.NOTINITIALIZED`: Inicialización de biblioteca c-ares no ha sido ejecutada.
* `dns.LOADIPHLPAPI`: Error loading `iphlpapi.dll`.
* `dns.ADDRGETNETWORKPARAMS`: Could not find `GetNetworkParams` function.
* `dns.CANCELLED`: Consulta DNS cancelada.

## Consideraciones de implementación

A pesar de que [`dns.lookup()`][] y las diversas funciones `dns.resolve*()/dns.reverse()` tienen el mismo objetivo de asociar un nombre de red con una dirección de red (o viceversa), su comportamiento es bastante diferente. Estas diferencias pueden tener sutiles pero significativas consecuencias en el comportamiento de los programas de Node.js.

### `dns.lookup()`

Bajo el capó, [`dns.lookup()`][] utiliza las mismas instalaciones de sistema operativo que la mayoría de los otros programas. Por ejemplo, [`dns.lookup()`][] casi siempre resolverá un nombre dado de la misma forma que el comando `ping`. On most POSIX-like operating systems, the behavior of the [`dns.lookup()`][] function can be modified by changing settings in nsswitch.conf(5) and/or resolv.conf(5), but changing these files will change the behavior of all other programs running on the same operating system.

Though the call to `dns.lookup()` will be asynchronous from JavaScript's perspective, it is implemented as a synchronous call to getaddrinfo(3) that runs on libuv's threadpool. This can have surprising negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

Various networking APIs will call `dns.lookup()` internally to resolve host names. If that is an issue, consider resolving the host name to an address using `dns.resolve()` and using the address instead of a host name. Also, some networking APIs (such as [`socket.connect()`][] and [`dgram.createSocket()`][]) allow the default resolver, `dns.lookup()`, to be replaced.

### `dns.resolve()`, `dns.resolve*()` and `dns.reverse()`

Estas funciones son implementadas de forma muy diferente que las de [`dns.lookup()`][]. They do not use getaddrinfo(3) and they _always_ perform a DNS query on the network. Esta comunicación de red siempre es hecha de forma asincrónica, y no utiliza la threadpool de libuv.

Como resultado, estas funcionas no pueden tener el mismo impacto negativo en otros procesos que ocurren en el threadpool de libuv, que [`dns.lookup()`][] puede tener.

Ellas no utilizan el mismo conjunto de archivos de configuración que utiliza [`dns.lookup()`][]. For instance, _they do not use the configuration from `/etc/hosts`_.
