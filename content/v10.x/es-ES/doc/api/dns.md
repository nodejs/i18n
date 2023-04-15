# DNS

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `dns` contiene funciones que pertenecen a dos categorías diferentes:

1) Funciones que utilizan las instalaciones del sistema operativo subyacente para realizar la resolución de nombres, y que no necesariamente ejecutan cualquier red de comunicación. Esta categoría contiene solo una función: [`dns.lookup()`][]. **Los desarrolladores que busquen realizar la resolución de nombres de la misma manera en que se comportan otras aplicaciones en el mismo sistema operativo, deben usar [`dns.lookup()`][].**

Por ejemplo, buscando a `iana.org`.

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
// address: "192.0.43.8" family: IPv4
```

2) Funciones que se conectan a un servidor DNS real para ejecutar la resolución de nombres, y que *siempre* utilizan la red para realizar consultas DNS. Esta categoría contiene todas las funciones en el módulo `dns`, *excepto* [`dns.lookup()`][]. Estas funciones no utilizan el mismo conjunto de archivos de configuración utilizados por [`dns.lookup()`][] (p. ej. `/etc/hosts`). Estas funciones deben ser utilizadas por los desarrolladores que no desean utilizar las instalaciones del sistema subyacente para la resolución de nombres, y en cambio, *siempre* quieren realizar consultas DNS.

A continuación, hay un ejemplo que resuelve `'archive.org'` y luego resuelve las direcciones IP que son devueltas.

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

## Class: `dns.Resolver`

<!-- YAML
added: v8.3.0
-->

Un resolver independiente de las solicitudes DNS.

Tenga en cuenta que crear un nuevo resolver utiliza la configuración predeterminada del servidor. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolvers:

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

Cancelar todas las consultas DNS pendientes realizadas por este resolver. Las correspondientes callbacks serán llamadas con un error con código `ECANCELLED`.

## `dns.getServers()`

<!-- YAML
added: v0.11.3
-->

* Devuelve: {string[]}

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

## `dns.lookup(hostname[, options], callback)`

<!-- YAML
added: v0.1.90
changes:

  - version: v8.5.0
    pr-url: https://github.com/nodejs/node/pull/14731
    description: The `verbatim` option is supported now.
  - version: v1.2.0
    pr-url: https://github.com/nodejs/node/pull/744
    description: The `all` option is supported now.
-->

* `hostname` {string}
* `options` {integer | Object} 
  * `family` {integer} El registro family. Debe ser `4` o `6`. Las direcciones IPv4 e IPv6 son ambas devueltas de forma predeterminada.
  * `hints` {number} Uno o más [compatibles con banderas `getaddrinfo`][]. Se pueden pasar múltiples flags bit a bit comparando sus valores con `OR`.
  * `all` {boolean} Cuando sea `true`, la callback devuelve todas las direcciones resueltas en matriz. De lo contrario, devuelve una única dirección. **Predeterminado:** `false`.
  * `verbatim` {boolean} Cuando sea `true`, la callback recibe direcciones IPv4 e IPv6 en el orden en el que la resolución las devolvió. Cuando sea `false`, las direcciones IPv4 son puestas antes de las direcciones IPv6. **Por defecto:** actualmente `false` (las direcciones se reordenan), pero esto se espera que cambie en un futuro no muy lejano. Código nuevo debe utilizar `{ verbatim: true }`.
* `callback` {Function} 
  * `err` {Error}
  * `address` {string} Una representación de cadena de una dirección IPv4 o IPv6.
  * `family` {integer} `4` o `6`, denotando la familia de `address`.

Resuelve un hostname (p. ej. `'nodejs.org'`) en el primer registro A (IPv4) o AAAA (IPv6) encontrado. Todas las propiedades `option` son opcionales. Si `options` es un entero, entonces debe ser `4` o `6` – si `options` no es proporcionado, entonces las direcciones IPv4 e IPV6 son ambas devueltas si son encontradas.

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

* `dns.ADDRCONFIG`: Los tipos de direcciones devueltas son determinadas por los tipos de direcciones apoyadas por el sistema actual. Por ejemplo, las direcciones IPv4 solo son devueltas si el sistema actual tiene al menos una dirección IPv4 configurada. Direcciones de loopback no son consideradas.
* `dns.V4MAPPED`: Si la familia IPv6 fue especificada, pero ninguna dirección IPv6 fue encontrada, luego devuelve las direcciones IPv6 mapeadas por IPv4. Tenga en cuenta que no es soportado en algunos sistemas operativos (p. e.j FreeBSD 10.1).

## `dns.lookupService(address, port, callback)`

<!-- YAML
added: v0.11.14
-->

* `address` {string}
* `port` {number}
* `callback` {Function} 
  * `err` {Error}
  * `hostname` {string} p. e.j. `ejemplo.com`
  * `service` {string} p. e.j. `http`

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

## `dns.resolve(hostname[, rrtype], callback)`

<!-- YAML
added: v0.1.27
-->

* `hostname` {string} Nombre de host para resolver.
* `rrtype` {string} Tipo de registro de recuersos. **Por defecto:** `'A'`.
* `callback` {Function} 
  * `err` {Error}
  * `records` {string[] | Object[] | Object}

Usa el protocolo DNS para resolver un hostname (p. e.j. `'nodejs.org'`) en una matriz de los registros de recursos. La función `callback` tiene argumentos `(err, records)`. Cuando sea exitoso, `records` tendrá una matriz de los registros de recursos. El tipo y la estructura de resultados individuales varía basado en `rrtype`:

| `rrtype`  | `records` contiene                          | Tipo de resultado | Método de taquigrafía    |
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

## `dns.resolve4(hostname[, options], callback)`

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

* `hostname` {string} Nombre de host para resolver.
* `options` {Object} 
  * `ttl` {boolean} Recupere el valor de Time-To-Live (TTL) de cada registro. Cuando sea `true`, la callback recibe un array de objetos `{ address: '1.2.3.4', ttl: 60 }`, en lugar de un array de strings con la expresión TTL en segundos.
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {string[] | Object[]}

Utiliza el protocolo DNS para resolver direcciones IPv4, (registros `A`) para el nombre `hostname`. El argumento de `addresses` pasado a la función `callback` contendrá un array de direcciones IPv4 (p. e.j. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

## `dns.resolve6(hostname[, options], callback)`

<!-- YAML
added: v0.1.16
changes:

  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->

* `hostname`{string} Hostname para resolver.
* `options` {Object} 
  * `ttl` {boolean} Recupere el valor Time-To-Live (TTL) para cada registro. Cuando sea `true`, la callback recibe un array de objetos `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }`, en lugar de un array de strings con la expresión TTL en segundos.
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {string[] | Object[]}

Utiliza el protocolo DNS para resolver direcciones IPv6 (registros `AAAA`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de direcciones IPv6.

## `dns.resolveAny(hostname, callback)`

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `ret` {Object[]}

Utiliza el protocolo DNS para resolver todos los registros (también conocidos como consultas `ANY` o `*`). El argumento `ret` pasado a la función `callback` será un array con varios tipos de registros. Cada objeto tiene una propiedad `type` que indica el tipo del registro actual. Y dependiendo del `type`, propiedades adicionales estarán presentes en el objeto:

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

DNS server operators may choose not to respond to `ANY` queries. It may be better to call individual methods like [`dns.resolve4()`][], [`dns.resolveMx()`][], and so on. For more details, see [RFC 8482](https://tools.ietf.org/html/rfc8482).

## `dns.resolveCname(hostname, callback)`

<!-- YAML
added: v0.3.2
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {string[]}

Utiliza el protocolo DNS para resolver los registros `CNAME` para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de registros de nombres canónicos disponibles para el `hostname` (p. e.j `['bar.example.com']`).

## `dns.resolveMx(hostname, callback)`

<!-- YAML
added: v0.1.27
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {Object[]}

Utiliza el protocolo DNS para resolver el registro de intercambios de correo (registros `MX`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de objetos con ambas propiedades `priority` y `exchange` (p. e.j `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

## `dns.resolveNaptr(hostname, callback)`

<!-- YAML
added: v0.9.12
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {Object[]}

Utiliza el protocolo DNS para resolver los registros basados en expresiones regulares (registros `NAPTR`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de objetos con las siguientes propiedades:

* `flags`
* `service`
* `regexp`
* `replacement`
* `order`
* `preference`

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

## `dns.resolveNs(hostname, callback)`

<!-- YAML
added: v0.1.90
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {string[]}

Utiliza el protocolo DNS para resolver los registros de servidor de nombres (registros `NS`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de registros de servidor de nombres disponibles para el `hostname` (p. e.j `['ns1.example.com', 'ns2.example.com']`).

## `dns.resolvePtr(hostname, callback)`

<!-- YAML
added: v6.0.0
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {string[]}

Utiliza el protocolo DNS para resolver los registros de punteros (registros `PTR`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de strings con los registros de respuesta.

## `dns.resolveSoa(hostname, callback)`

<!-- YAML
added: v0.11.10
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `address` {Object}

Utiliza el protocolo DNS para resolver un registro de inicio de autoridad (registro `SOA`) para el `hostname`. El argumento `address` pasado a la función `callback` será un objeto con las siguiente propiedades:

* `nsname`
* `hostmaster`
* `serial`
* `refresh`
* `retry`
* `expire`
* `minttl`

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

## `dns.resolveSrv(hostname, callback)`

<!-- YAML
added: v0.1.27
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `addresses` {Object[]}

Utiliza el protocolo DNS para resolver los registros de servicio (registros `SRV`) para el `hostname`. El argumento `addresses` pasado a la función `callback` contendrá un array de objetos con las siguientes propiedades:

* `priority`
* `weight`
* `port`
* `name`

<!-- eslint-skip -->

```js
{
  priority: 10,
  weight: 5,
  port: 21223,
  name: 'service.example.com'
}
```

## `dns.resolveTxt(hostname, callback)`

<!-- YAML
added: v0.1.27
-->

* `hostname` {string}
* `callback` {Function} 
  * `err` {Error}
  * `records` {string[][]}

Utiliza el protocolo DNS para resolver consultas de texto (registros `TXT`) para el `hostname`. El argumento `records` pasado a la función `callback` es un array bidimensional de los registros de texto disponibles para `hostname` (p. e.j `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Cada sub-array contiene pedazos de TXT para un registro. Dependiendo del caso de uso, estos podrían unirse o ser tratados por separado.

## `dns.reverse(ip, callback)`

<!-- YAML
added: v0.1.16
-->

* `ip` {string}
* `callback` {Function} 
  * `err` {Error}
  * `hostnames` {string[]}

Realiza una consulta DNS inversa que resuelve una dirección IPv4 o IPv6 para un array de hostnames.

En caso de error, `err` es un objeto [`Error`][], donde `err.code` es uno de los [códigos de error DNS](#dns_error_codes).

## `dns.setServers(servers)`

<!-- YAML
added: v0.11.3
-->

* `servers` {string[]} array de [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) direcciones formateadas

Establece la dirección IP y el puerto de servidores para ser usados al realizar la resolución DNS. El argumento `servers` es un array de [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) direcciones formateadas. Si el puerto es el puerto DNS (53) predeterminado de IANA, puede ser omitido.

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Se produce un error si se proporciona una dirección inválida.

El método `dns.setServers()` no debe ser llamado mientras que una consulta DNS está en progreso.

The [`dns.setServers()`][] method affects only [`dns.resolve()`][], [`dns.resolve*()`][] and [`dns.reverse()`][] (and specifically *not* [`dns.lookup()`][]).

Note that this method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## DNS Promises API

> Estability: 2 - Estable

The `dns.promises` API provides an alternative set of asynchronous DNS methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('dns').promises`.

### Class: `dnsPromises.Resolver`

<!-- YAML
added: v10.6.0
-->

Un resolver independiente de las solicitudes DNS.

Tenga en cuenta que crear un nuevo resolver utiliza la configuración predeterminada del servidor. Setting the servers used for a resolver using [`resolver.setServers()`][`dnsPromises.setServers()`] does not affect other resolvers:

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

### `dnsPromises.getServers()`

<!-- YAML
added: v10.6.0
-->

* Devuelve: {string[]}

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

### `dnsPromises.lookup(hostname[, options])`

<!-- YAML
added: v10.6.0
-->

* `hostname` {string}
* `options` {integer | Object} 
  * `family` {integer} El registro family. Debe ser `4` o `6`. Las direcciones IPv4 e IPv6 son ambas devueltas de forma predeterminada.
  * `hints` {number} Uno o más [compatibles con banderas `getaddrinfo`][]. Se pueden pasar múltiples flags bit a bit comparando sus valores con `OR`.
  * `all` {boolean} When `true`, the `Promise` is resolved with all addresses in an array. De lo contrario, devuelve una única dirección. **Predeterminado:** `false`.
  * `verbatim` {boolean} When `true`, the `Promise` is resolved with IPv4 and IPv6 addresses in the order the DNS resolver returned them. Cuando sea `false`, las direcciones IPv4 son puestas antes de las direcciones IPv6. **Por defecto:** actualmente `false` (las direcciones se reordenan), pero esto se espera que cambie en un futuro no muy lejano. Código nuevo debe utilizar `{ verbatim: true }`.

Resuelve un hostname (p. ej. `'nodejs.org'`) en el primer registro A (IPv4) o AAAA (IPv6) encontrado. Todas las propiedades `option` son opcionales. Si `options` es un entero, entonces debe ser `4` o `6` – si `options` no es proporcionado, entonces las direcciones IPv4 e IPV6 son ambas devueltas si son encontradas.

With the `all` option set to `true`, the `Promise` is resolved with `addresses` being an array of objects with the properties `address` and `family`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code. Tenga en cuenta que `err.code` se establecerá en `'ENOENT'` no solo cuando el hostname no exista, sino también cuando la búsqueda falla de otras maneras, como cuando no hay descriptores de archivo disponibles.

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

### `dnsPromises.lookupService(address, port)`

<!-- YAML
added: v10.6.0
-->

* `address` {string}
* `port` {number}

Resuelve los `address` y `port` dados en un hostname y servicio, usando el sistema operativo subyacente como implementación `getnameinfo`.

Si `address` no es una dirección IP válida, un `TypeError` será arrojado. El `port` será forzado a un número. Si no es un puerto legal, un `TypeError` será arrojado.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code.

```js
const dnsPromises = require('dns').promises;
dnsPromises.lookupService('127.0.0.1', 22).then((result) => {
  console.log(result.hostname, result.service);
  // Prints: localhost ssh
});
```

### `dnsPromises.resolve(hostname[, rrtype])`

<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Nombre de host para resolver.
* `rrtype` {string} Tipo de registro de recuersos. **Por defecto:** `'A'`.

Usa el protocolo DNS para resolver un hostname (p. e.j. `'nodejs.org'`) en una matriz de los registros de recursos. When successful, the `Promise` is resolved with an array of resource records. The type and structure of individual results vary based on `rrtype`:

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

* `hostname` {string} Nombre de host para resolver.
* `options` {Object} 
  * `ttl` {boolean} Recupere el valor de Time-To-Live (TTL) de cada registro. When `true`, the `Promise` is resolved with an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv4 addresses (`A` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

### `dnsPromises.resolve6(hostname[, options])`

<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Nombre de host para resolver.
* `options` {Object} 
  * `ttl` {boolean} Recupere el valor de Time-To-Live (TTL) de cada registro. When `true`, the `Promise` is resolved with an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv6 addresses (`AAAA` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv6 addresses.

### `dnsPromises.resolveAny(hostname)`

<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utiliza el protocolo DNS para resolver todos los registros (también conocidos como consultas `ANY` o `*`). On success, the `Promise` is resolved with an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Tipo      | Propiedades                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'A'`     | `address`/`ttl`                                                                                                                                          |
| `'AAAA'`  | `address`/`ttl`                                                                                                                                          |
| `'CNAME'` | `valor`                                                                                                                                                  |
| `'MX'`    | Refer to [`dnsPromises.resolveMx()`][]                                                                                                                   |
| `'NAPTR'` | Refer to [`dnsPromises.resolveNaptr()`][]                                                                                                                |
| `'NS'`    | `valor`                                                                                                                                                  |
| `'PTR'`   | `valor`                                                                                                                                                  |
| `'SOA'`   | Refer to [`dnsPromises.resolveSoa()`][]                                                                                                                  |
| `'SRV'`   | Refer to [`dnsPromises.resolveSrv()`][]                                                                                                                  |
| `'TXT'`   | This type of record contains an array property called `entries` which refers to [`dnsPromises.resolveTxt()`][], e.g. `{ entries: ['...'], type: 'TXT' }` |

Here is an example of the result object:

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

Utiliza el protocolo DNS para resolver un registro de inicio de autoridad (registro `SOA`) para el `hostname`. On success, the `Promise` is resolved with an object with the following properties:

* `nsname`
* `hostmaster`
* `serial`
* `refresh`
* `retry`
* `expire`
* `minttl`

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

### `dnsPromises.resolveSrv(hostname)`

<!-- YAML
added: v10.6.0
-->

* `hostname` {string}

Utiliza el protocolo DNS para resolver los registros de servicio (registros `SRV`) para el `hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

* `priority`
* `weight`
* `port`
* `name`

<!-- eslint-skip -->

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

Realiza una consulta DNS inversa que resuelve una dirección IPv4 o IPv6 para un array de hostnames.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### `dnsPromises.setServers(servers)`

<!-- YAML
added: v10.6.0
-->

* `servers` {string[]} array de [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) direcciones formateadas

Establece la dirección IP y el puerto de servidores para ser usados al realizar la resolución DNS. El argumento `servers` es un array de [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) direcciones formateadas. Si el puerto es el puerto DNS (53) predeterminado de IANA, puede ser omitido.

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

Note that this method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## Códigos de error

Cada consulta DNS puede devolver uno de los siguientes códigos de error:

* `dns.NODATA`: El servidor DNS devolvió una respuesta sin datos.
* `dns.FORMERR`: La consulta de reclamos del servidor DNS no se formateó correctamente.
* `dns.SERVFAIL`: El servidor DNS devolvió un fallo general.
* `dns.NOTFOUND`: Nombre de dominio no encontrado.
* `dns.NOTIMP`: El servidor DNS no implementa la operación solicitada.
* `dns.REFUSED`: El servidor DNS negó la consulta.
* `dns.BADQUERY`: La consulta DNS no se formateó correctamente.
* `dns.BADNAME`: Hostname mal formateado.
* `dns.BADFAMILY`: Familia de direcciones no soportada.
* `dns.BADRESP`: Respuesta DNS mal formateada.
* `dns.CONNREFUSED`: No se pudo contactar servidores DNS.
* `dns.TIMEOUT`: Tiempo de espera al ponerse en contacto con los servidores DNS agotado.
* `dns.EOF`: Final de archivo.
* `dns.FILE`: Error al leer el archivo.
* `dns.NOMEM`: Sin memoria.
* `dns.DESTRUCTION`: El canal está siendo destruido.
* `dns.BADSTR`: String mal formateada.
* `dns.BADFLAGS`: Banderas ilegales especificadas.
* `dns.NONAME`: Hostname dado no es numérico.
* `dns.BADHINTS`: Señales de banderas ilegales especificadas.
* `dns.NOTINITIALIZED`: Inicialización de biblioteca c-ares no ha sido realizada.
* `dns.LOADIPHLPAPI`: Error cargando `iphlpapi.dll`.
* `dns.ADDRGETNETWORKPARAMS`: No se pudo encontrar la función `GetNetworkParams`.
* `dns.CANCELLED`: Consulta DNS cancelada.

## Consideraciones de implementación

Aunque [`dns.lookup()`][] y las diversas funciones `dns.resolve*()/dns.reverse()` tienen el mismo objetivo de asociar un nombre de red con una dirección de red (o viceversa), su comportamiento es bastante diferente. Estas diferencias pueden tener sutiles pero significativas consecuencias en el comportamiento de los programas Node.js.

### `dns.lookup()`

Bajo el capó, [`dns.lookup()`][] utiliza las mismas instalaciones de sistema operativo que la mayoría de los otros programas. Por ejemplo, [`dns.lookup()`][] casi siempre resolverá un nombre dado de la misma forma que el comando `ping`. En la mayoría de sistemas operativos similares a POSIX, el comportamiento de la función [`dns.lookup()`][] puede ser modificado cambiando los ajustes en nsswitch.conf(5) y/o resolv.conf(5), pero tenga en cuenta que cambiando estos archivos cambiará el comportamiento de *todos los otros programas que se ejecutan en el mismo sistema operativo*.

Aunque la llamada a `dns.lookup()` será asincrónica desde la perspectiva de JavaScript, es implementada como una llamada sincrónica para getaddrinfo(3) que se ejecuta en el threadpool de libuv. Esto puede tener sorprendentes implicaciones negativas en el rendimiento para algunas aplicaciones, vea la documentación [`UV_THREADPOOL_SIZE`][] para obtener más información.

Tenga en cuenta que varias APIs de red llamarán a `dns.lookup()` internamente para resolver los nombres del host. If that is an issue, consider resolving the hostname to an address using `dns.resolve()` and using the address instead of a host name. De igual forma, algunas APIs de red (tales como `socket.connect()`][] y [`dgram.createSocket()`][]) permiten que el resolver predeterminado, `dns.lookup()`, sea reemplazado.

### `dns.resolve()`, `dns.resolve*()` y `dns.reverse()`

Estas funciones son implementadas de forma muy diferente que las de [`dns.lookup()`][]. Ellas no utilizan getaddrinfo(3) y *siempre* realizan una consulta DNS en la red. Esta comunicación de red siempre es hecha de forma asincrónica, y no utiliza la threadpool de libuv.

Como resultado, estas funciones no pueden tener el mismo impacto negativo en otros procesos que ocurren en la threadpool de libuv, que [`dns.lookup()`][]puede tener.

Ellas no utilizan el mismo conjunto de archivos de configuración que utiliza [`dns.lookup()`][]. Por ejemplo, *no utilizan la configuración de `/etc/hosts`*.