# DNS

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

Модуль `dns` содержит функции, которые принадлежат двум разным категориям:

1) Функции, которые используют базовые возможности операционной системы для выполнения разрешения имен и не обязательно выполняют какое-либо сетевое взаимодействие. Эта категория содержит только одну функцию: [`dns.lookup()`][]. **Разработчики, стремящиеся выполнить разрешение имен способом как в других приложениях в операционной системе со сходным поведением, должны использовать [`dns.lookup()`][].**

Например, ищем `iana.org`.

```js
const dns = require('dns');

dns.lookup('iana.org', (err, address, family) => {
  console.log('address: %j family: IPv%s', address, family);
});
// address: "192.0.43.8" family: IPv4
```

2) Функции, которые подключаются к реальному DNS-серверу для выполнения разрешения имен и которые _всегда_ используют сеть для выполнения запросов DNS. Эта категория содержит все функции в модуле `dns`, _кроме_ [`dns.lookup()`][]. Эти функции не используют тот же набор файлов конфигурации, который используется [`dns.lookup()`][] (например, `/etc/hosts`). Эти функции должны использоваться разработчиками, которые не хотят использовать базовые установки операционной системы для разрешения имен, а вместо этого _всегда_ хотят выполнять запросы DNS.

Ниже приведен пример, разрешающий `'archive.org'` и затем обратное разрешение возвращенных IP-адресов.

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

Существуют небольшие последствия при выборе между одним или другим; пожалуйста, для более подробной информации обратитесь к [Разделу решений в реализации](#dns_implementation_considerations).

## Class: dns.Resolver
<!-- YAML
added: v8.3.0
-->

An independent resolver for DNS requests.

Note that creating a new resolver uses the default server settings. Setting the servers used for a resolver using [`resolver.setServers()`][`dns.setServers()`] does not affect other resolvers:

```js
const { Resolver } = require('dns');
const resolver = new Resolver();
resolver.setServers(['4.4.4.4']);

// This request will use the server at 4.4.4.4, independent of global settings.
resolver.resolve4('example.org', (err, addresses) => {
  // ...
});
```

The following methods from the `dns` module are available:

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

Cancel all outstanding DNS queries made by this resolver. The corresponding callbacks will be called with an error with code `ECANCELLED`.

## dns.getServers()
<!-- YAML
added: v0.11.3
-->

* Returns: {string[]}

Returns an array of IP address strings, formatted according to [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), that are currently configured for DNS resolution. A string will include a port section if a custom port is used.
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
  - `family` {integer} The record family. Must be `4` or `6`. IPv4 and IPv6 addresses are both returned by default.
  - `hints` {number} One or more [supported `getaddrinfo` flags][]. Multiple flags may be passed by bitwise `OR`ing their values.
  - `all` {boolean} When `true`, the callback returns all resolved addresses in an array. Otherwise, returns a single address. **По умолчанию:** `false`.
  - `verbatim` {boolean} When `true`, the callback receives IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. New code should use `{ verbatim: true }`.
* `callback` {Function}
  - `err` {Error}
  - `address` {string} A string representation of an IPv4 or IPv6 address.
  - `family` {integer} `4` or `6`, denoting the family of `address`.

Разрешает имя хоста (например, `'nodejs.org'`) в первой найденной записи A (IPv4) или AAAA (IPv6). All `option` properties are optional. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the arguments for `callback` change to `(err, addresses)`, with `addresses` being an array of objects with the properties `address` and `family`.

В случае ошибки `err` является объектом [`Error`][], где `err.code` - код ошибки. Имейте в виду, что `err.code` будет установлен на `'ENOENT'` не только, когда имя хоста отсутствует, но и когда поиск не удается другими способами, например, нет доступных файловых дескрипторов.

`dns.lookup()` совсем не обязательно имеет какое-либо отношение к протоколу DNS. Реализация использует возможности ОС, которые могут связывать имена с адресами и наоборот. Эта реализация может иметь незначительные, но очень важные последствия на поведение любой программы Node.js. Пожалуйста, перед использованием `dns.lookup()` найдите время обратиться к [Разделу решений в реализации](#dns_implementation_considerations).

Пример употребления:

```js
const dns = require('dns');
const options = {
  family: 6,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};
dns.lookup('example.com', options, (err, address, family) =>
  console.log('address: %j family: IPv%s', address, family));
// адрес: "2606:2800:220:1:248:1893:25c8:1946" семейство: IPv6

// Когда options.all имеет значение true, результатом будет массив.
options.all = true;
 dns.lookup('example.com', options, (err, addresses) =>
   console.log('addresses: %j', addresses));
 // addresses: [{"address":"2606:2800:220:1:248:1893:25c8:1946","family":6}]
```

If this method is invoked as its [`util.promisify()`][]ed version, and `all` is not set to `true`, it returns a `Promise` for an `Object` with `address` and `family` properties.

### Поддерживаемые флаги getaddrinfo

Следующие флаги могут передаваться в [`dns.lookup()`][] в качестве подсказки.

- `dns.ADDRCONFIG`: Типы возвращаемых адресов определяются типами адресов, которые поддерживаются текущей системой. Например, адреса IPv4 возвращаются, только если в текущей системе имеется хотя бы один сконфигурированный адрес IPv4. Loopback-адреса не рассматриваются.
- `dns.V4MAPPED`: Если указано семейство IPv6, но адреса IPv6 не были найдены, то возвращаются IPv6 сопоставимые с IPv4. Обратите внимание, что это не поддерживается некоторыми операционными системами (например, FreeBSD 10.1).

## dns.lookupService(address, port, callback)<!-- YAML
added: v0.11.14
-->* `адрес` {string}
* `port` {number}
* `callback` {Function}
  - `err` {Error}
  - `hostname` {string} e.g. `example.com`
  - `service` {string} e.g. `http`

Разрешает заданные `address` и `port` в имя хоста и службы с использованием базовой реализации `getnameinfo` операционной системы.

Если `address` не является действительным IP-адресом, будет выдаваться `TypeError`. `port` будет приведен к числу. Если это не разрешенный порт, то будет выдаваться `TypeError`.

On an error, `err` is an [`Error`][] object, where `err.code` is the error code.

```js
const dns = require('dns');
dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
  console.log(hostname, service);
  // Печатает: localhost ssh
});
```

If this method is invoked as its [`util.promisify()`][]ed version, it returns a `Promise` for an `Object` with `hostname` and `service` properties.

## dns.resolve(hostname[, rrtype], callback)<!-- YAML
added: v0.1.27
-->* `hostname` {string} Имя хоста для разрешения.
* `rrtype` {string} Тип записи ресурса. **Default:** `'A'`.
* `callback` {Function}
  - `err` {Error}
  - `records` {string[] | Object[] | Object}

Использует протокол DNS для разрешения имени хоста (например, `'nodejs.org'`) в массив записей ресурсов. Функция `callback` имеет аргументы `(err, records)`. Если успешно, `records` будет массивом записей ресурсов. Тип и структура отдельных результатов зависит от `rrtype`:

| `rrtype`  | `records` содержит          | Тип результата | Сокращенный метод        |
| --------- | --------------------------- | -------------- | ------------------------ |
| `'A'`     | адреса IPv4 (по умолчанию)  | {string}       | [`dns.resolve4()`][]     |
| `'AAAA'`  | адреса IPv6                 | {string}       | [`dns.resolve6()`][]     |
| `'ANY'`   | any records                 | {Object}       | [`dns.resolveAny()`][]   |
| `'CNAME'` | записи канонического имени  | {string}       | [`dns.resolveCname()`][] |
| `'MX'`    | записи обмена почтой        | {Object}       | [`dns.resolveMx()`][]    |
| `'NAPTR'` | записи о владельце имени    | {Object}       | [`dns.resolveNaptr()`][] |
| `'NS'`    | записи имени сервера        | {string}       | [`dns.resolveNs()`][]    |
| `'PTR'`   | записи указателя            | {string}       | [`dns.resolvePtr()`][]   |
| `'SOA'`   | начало авторитетных записей | {Object}       | [`dns.resolveSoa()`][]   |
| `'SRV'`   | служебные записи            | {Object}       | [`dns.resolveSrv()`][]   |
| `'TXT'`   | текстовые записи            | {string[]}     | [`dns.resolveTxt()`][]   |

В случае ошибки `err` является объектом [`Error`][], где `err.code` - один из [кодов ошибки DNS](#dns_error_codes).

## dns.resolve4(hostname[, options], callback)<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->* `hostname` {string} Имя хоста для разрешения.
* `options` {Object}
  - `ttl` {boolean} Извлечь значение Time-To-Live (TTL) каждой записи. When `true`, the callback receives an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Использует протокол DNS для разрешения адресов IPv4 (записи `A`) для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет содержать массив адресов IPv4 (например, `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

## dns.resolve6(hostname[, options], callback)
<!-- YAML
added: v0.1.16
changes:
  - version: v7.2.0
    pr-url: https://github.com/nodejs/node/pull/9296
    description: This method now supports passing `options`,
                 specifically `options.ttl`.
-->
* `hostname` {string} Имя хоста для разрешения.
* `options` {Object}
  - `ttl` {boolean} Извлечь значение Time-To-Live (TTL) каждой записи. When `true`, the callback receives an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[] | Object[]}

Использует протокол DNS для разрешения адресов IPv6 (записи `AAAA`) для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет содержать массив адресов IPv6.

## dns.resolveAny(hostname, callback)

* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `ret` {Object[]}

Uses the DNS protocol to resolve all records (also known as `ANY` or `*` query). The `ret` argument passed to the `callback` function will be an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Type      | Properties                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `'A'`     | `address`/`ttl`                                                                                                                                  |
| `'AAAA'`  | `address`/`ttl`                                                                                                                                  |
| `'CNAME'` | `value`                                                                                                                                          |
| `'MX'`    | Refer to [`dns.resolveMx()`][]                                                                                                                   |
| `'NAPTR'` | Refer to [`dns.resolveNaptr()`][]                                                                                                                |
| `'NS'`    | `value`                                                                                                                                          |
| `'PTR'`   | `value`                                                                                                                                          |
| `'SOA'`   | Refer to [`dns.resolveSoa()`][]                                                                                                                  |
| `'SRV'`   | Refer to [`dns.resolveSrv()`][]                                                                                                                  |
| `'TXT'`   | This type of record contains an array property called `entries` which refers to [`dns.resolveTxt()`][], e.g. `{ entries: ['...'], type: 'TXT' }` |

Here is an example of the `ret` object passed to the callback:
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

Использует протокол DNS для разрешения записей `CNAME` для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет содержать массив записей канонических имен, доступных для `hostname` (например, `['bar.example.com']`).

## dns.resolveMx(hostname, callback)<!-- YAML
added: v0.1.27
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `addresses` {Object[]}

Использует протокол DNS для разрешения записей обмена почтой (записи `MX`) для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет содержать массив объектов, содержащих свойства `priority` и `exchange` (например, `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

## dns.resolveNaptr(hostname, callback)<!-- YAML
added: v0.9.12
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `addresses` {Object[]}

Использует протокол DNS для разрешения записей на основе регулярных выражений (записи `NAPTR`) для `hostname`. The `addresses` argument passed to the `callback` function will contain an array of objects with the following properties:

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

Использует протокол DNS для разрешения записей имени сервера (записи `NS`) для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет содержать массив записей имени сервера, доступных для `hostname` (например, `['ns1.example.com', 'ns2.example.com']`).

## dns.resolvePtr(hostname, callback)<!-- YAML
added: v6.0.0
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `addresses` {string[]}

Использует протокол DNS для разрешения записей указателя (записи `PTR`) для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет массивом строк, содержащим записи ответа.

## dns.resolveSoa(hostname, callback)<!-- YAML
added: v0.11.10
-->* `hostname` {string}
* `callback` {Function}
  - `err` {Error}
  - `address` {Object}

Использует протокол DNS для разрешения старта авторитетной записи (запись `SOA`) для `hostname`. The `address` argument passed to the `callback` function will be an object with the following properties:

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
  - `addresses` {Object[]}

Использует протокол DNS для разрешения сервисных записей (записи `SRV`) для `hostname`. Аргумент `addresses`, переданный функции `callback`, будет массивом объектов со следующими свойствами:

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

Использует протокол DNS для разрешения текстовых запросов (записи `TXT`) для `hostname`. The `records` argument passed to the `callback` function is a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Каждый подмассив содержит части TXT одной записи. В зависимости от варианта использования их можно объединять или обрабатывать отдельно.

## dns.reverse(ip, callback)<!-- YAML
added: v0.1.16
-->* `ip` {string}
* `callback` {Function}
  - `err` {Error}
  - `hostnames` {string[]}

Выполняет обратный запрос DNS, который разрешает адреса IPv4 или IPv6 в массив имен хоста.

В случае ошибки `err` является объектом [`Error`][], где `err.code` - один из [кодов ошибки DNS](#dns_error_codes).

## dns.setServers(servers)<!-- YAML
added: v0.11.3
-->* `servers` {string[]} array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. If the port is the IANA default DNS port (53) it can be omitted.

```js
dns.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Если адрес указан неверно, будет выдана ошибка.

Метод `dns.setServers()` не должен вызываться во время процесса запроса DNS.

The [`dns.setServers()`][] method affects only [`dns.resolve()`][], [`dns.resolve*()`][] and [`dns.reverse()`][] (and specifically *not* [`dns.lookup()`][]).

Note that this method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## DNS Promises API

> Стабильность: 1 - экспериментальный

The `dns.promises` API provides an alternative set of asynchronous DNS methods that return `Promise` objects rather than using callbacks. The API is accessible via `require('dns').promises`.

### Class: dnsPromises.Resolver<!-- YAML
added: v10.6.0
-->An independent resolver for DNS requests.

Note that creating a new resolver uses the default server settings. Setting the servers used for a resolver using [`resolver.setServers()`][`dnsPromises.setServers()`] does not affect other resolvers:

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
-->* Returns: {string[]}

Returns an array of IP address strings, formatted according to [rfc5952](https://tools.ietf.org/html/rfc5952#section-6), that are currently configured for DNS resolution. A string will include a port section if a custom port is used.
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
  - `family` {integer} The record family. Must be `4` or `6`. IPv4 and IPv6 addresses are both returned by default.
  - `hints` {number} One or more [supported `getaddrinfo` flags][]. Multiple flags may be passed by bitwise `OR`ing their values.
  - `all` {boolean} When `true`, the `Promise` is resolved with all addresses in an array. Otherwise, returns a single address. **По умолчанию:** `false`.
  - `verbatim` {boolean} When `true`, the `Promise` is resolved with IPv4 and IPv6 addresses in the order the DNS resolver returned them. When `false`, IPv4 addresses are placed before IPv6 addresses. **Default:** currently `false` (addresses are reordered) but this is expected to change in the not too distant future. New code should use `{ verbatim: true }`.

Разрешает имя хоста (например, `'nodejs.org'`) в первой найденной записи A (IPv4) или AAAA (IPv6). All `option` properties are optional. If `options` is an integer, then it must be `4` or `6` – if `options` is not provided, then IPv4 and IPv6 addresses are both returned if found.

With the `all` option set to `true`, the `Promise` is resolved with `addresses` being an array of objects with the properties `address` and `family`.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is the error code. Имейте в виду, что `err.code` будет установлен на `'ENOENT'` не только, когда имя хоста отсутствует, но и когда поиск не удается другими способами, например, нет доступных файловых дескрипторов.

[`dnsPromises.lookup()`][] does not necessarily have anything to do with the DNS protocol. The implementation uses an operating system facility that can associate names with addresses, and vice versa. This implementation can have subtle but important consequences on the behavior of any Node.js program. Please take some time to consult the [Implementation considerations section](#dns_implementation_considerations) before using `dnsPromises.lookup()`.

Пример употребления:

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
-->* `адрес` {string}
* `port` {number}

Разрешает заданные `address` и `port` в имя хоста и службы с использованием базовой реализации `getnameinfo` операционной системы.

Если `address` не является действительным IP-адресом, будет выдаваться `TypeError`. `port` будет приведен к числу. Если это не разрешенный порт, то будет выдаваться `TypeError`.

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
-->* `hostname` {string} Имя хоста для разрешения.
* `rrtype` {string} Тип записи ресурса. **Default:** `'A'`.

Использует протокол DNS для разрешения имени хоста (например, `'nodejs.org'`) в массив записей ресурсов. When successful, the `Promise` is resolved with an array of resource records. The type and structure of individual results vary based on `rrtype`:

| `rrtype`  | `records` содержит          | Тип результата | Сокращенный метод                |
| --------- | --------------------------- | -------------- | -------------------------------- |
| `'A'`     | адреса IPv4 (по умолчанию)  | {string}       | [`dnsPromises.resolve4()`][]     |
| `'AAAA'`  | адреса IPv6                 | {string}       | [`dnsPromises.resolve6()`][]     |
| `'ANY'`   | any records                 | {Object}       | [`dnsPromises.resolveAny()`][]   |
| `'CNAME'` | записи канонического имени  | {string}       | [`dnsPromises.resolveCname()`][] |
| `'MX'`    | записи обмена почтой        | {Object}       | [`dnsPromises.resolveMx()`][]    |
| `'NAPTR'` | записи о владельце имени    | {Object}       | [`dnsPromises.resolveNaptr()`][] |
| `'NS'`    | записи имени сервера        | {string}       | [`dnsPromises.resolveNs()`][]    |
| `'PTR'`   | записи указателя            | {string}       | [`dnsPromises.resolvePtr()`][]   |
| `'SOA'`   | начало авторитетных записей | {Object}       | [`dnsPromises.resolveSoa()`][]   |
| `'SRV'`   | служебные записи            | {Object}       | [`dnsPromises.resolveSrv()`][]   |
| `'TXT'`   | текстовые записи            | {string[]}     | [`dnsPromises.resolveTxt()`][]   |

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### dnsPromises.resolve4(hostname[, options])
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Имя хоста для разрешения.
* `options` {Object}
  - `ttl` {boolean} Извлечь значение Time-To-Live (TTL) каждой записи. When `true`, the `Promise` is resolved with an array of `{ address: '1.2.3.4', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv4 addresses (`A` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv4 addresses (e.g. `['74.125.79.104', '74.125.79.105', '74.125.79.106']`).

### dnsPromises.resolve6(hostname[, options])
<!-- YAML
added: v10.6.0
-->

* `hostname` {string} Имя хоста для разрешения.
* `options` {Object}
  - `ttl` {boolean} Извлечь значение Time-To-Live (TTL) каждой записи. When `true`, the `Promise` is resolved with an array of `{ address: '0:1:2:3:4:5:6:7', ttl: 60 }` objects rather than an array of strings, with the TTL expressed in seconds.

Uses the DNS protocol to resolve IPv6 addresses (`AAAA` records) for the `hostname`. On success, the `Promise` is resolved with an array of IPv6 addresses.

### dnsPromises.resolveAny(hostname)<!-- YAML
added: v10.6.0
-->* `hostname` {string}

Uses the DNS protocol to resolve all records (also known as `ANY` or `*` query). On success, the `Promise` is resolved with an array containing various types of records. Each object has a property `type` that indicates the type of the current record. And depending on the `type`, additional properties will be present on the object:

| Type      | Properties                                                                                                                                               |
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

Использует протокол DNS для разрешения записей `CNAME` для `hostname`. On success, the `Promise` is resolved with an array of canonical name records available for the `hostname` (e.g. `['bar.example.com']`).

### dnsPromises.resolveMx(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Использует протокол DNS для разрешения записей обмена почтой (записи `MX`) для `hostname`. On success, the `Promise` is resolved with an array of objects containing both a `priority` and `exchange` property (e.g. `[{priority: 10, exchange: 'mx.example.com'}, ...]`).

### dnsPromises.resolveNaptr(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Использует протокол DNS для разрешения записей на основе регулярных выражений (записи `NAPTR`) для `hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

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

Использует протокол DNS для разрешения записей имени сервера (записи `NS`) для `hostname`. On success, the `Promise` is resolved with an array of name server records available for `hostname` (e.g. `['ns1.example.com', 'ns2.example.com']`).

### dnsPromises.resolvePtr(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Использует протокол DNS для разрешения записей указателя (записи `PTR`) для `hostname`. On success, the `Promise` is resolved with an array of strings containing the reply records.

### dnsPromises.resolveSoa(hostname)
<!-- YAML
added: v10.6.0
-->
* `hostname` {string}

Использует протокол DNS для разрешения старта авторитетной записи (запись `SOA`) для `hostname`. On success, the `Promise` is resolved with an object with the following properties:

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

Использует протокол DNS для разрешения сервисных записей (записи `SRV`) для `hostname`. On success, the `Promise` is resolved with an array of objects with the following properties:

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

Использует протокол DNS для разрешения текстовых запросов (записи `TXT`) для `hostname`. On success, the `Promise` is resolved with a two-dimensional array of the text records available for `hostname` (e.g. `[ ['v=spf1 ip4:0.0.0.0 ', '~all' ] ]`). Каждый подмассив содержит части TXT одной записи. В зависимости от варианта использования их можно объединять или обрабатывать отдельно.

### dnsPromises.reverse(ip)
<!-- YAML
added: v10.6.0
-->
* `ip` {string}

Выполняет обратный запрос DNS, который разрешает адреса IPv4 или IPv6 в массив имен хоста.

On error, the `Promise` is rejected with an [`Error`][] object, where `err.code` is one of the [DNS error codes](#dns_error_codes).

### dnsPromises.setServers(servers)
<!-- YAML
added: v10.6.0
-->
* `servers` {string[]} array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses

Sets the IP address and port of servers to be used when performing DNS resolution. The `servers` argument is an array of [rfc5952](https://tools.ietf.org/html/rfc5952#section-6) formatted addresses. If the port is the IANA default DNS port (53) it can be omitted.

```js
dnsPromises.setServers([
  '4.4.4.4',
  '[2001:4860:4860::8888]',
  '4.4.4.4:1053',
  '[2001:4860:4860::8888]:1053'
]);
```

Если адрес указан неверно, будет выдана ошибка.

The `dnsPromises.setServers()` method must not be called while a DNS query is in progress.

Note that this method works much like [resolve.conf](http://man7.org/linux/man-pages/man5/resolv.conf.5.html). That is, if attempting to resolve with the first server provided results in a `NOTFOUND` error, the `resolve()` method will *not* attempt to resolve with subsequent servers provided. Fallback DNS servers will only be used if the earlier ones time out or result in some other error.

## Коды ошибок

Каждый запрос DNS может возвращать один из следующих кодов ошибки:

- `dns.NODATA`: Сервер DNS вернул ответ без данных.
- `dns.FORMERR`: Сервер DNS заявляет, что запрос был неправильно отформатирован.
- `dns.SERVFAIL`: Сервер DNS вернул общую ошибку.
- `dns.NOTFOUND`: Доменное имя не найдено.
- `dns.NOTIMP`: Сервер DNS не может реализовать запрошенную операцию.
- `dns.REFUSED`: Сервер DNS отклонил запрос.
- `dns.BADQUERY`: Неправильный формат запроса DNS.
- `dns.BADNAME`: Неправильный формат имени хоста.
- `dns.BADFAMILY`: Неподдерживаемое семейство адресов.
- `dns.BADRESP`: Неправильный формат ответа DNS.
- `dns.CONNREFUSED`: Не удалось связаться с серверами DNS.
- `dns.TIMEOUT`: Время ожидания при обращении к серверам DNS.
- `dns.EOF`: Конец файла.
- `dns.FILE`: Ошибка чтения файла.
- `dns.NOMEM`: Недостаточно памяти.
- `dns.DESTRUCTION`: Канал разрушается.
- `dns.BADSTR`: Неправильный формат строки.
- `dns.BADFLAGS`: Указаны недопустимые флаги.
- `dns.NONAME`: Заданное имя хоста не является числом.
- `dns.BADHINTS`: Указаны недопустимые флаги подсказок.
- `dns.NOTINITIALIZED`: Инициализация библиотеки c-ares еще не выполнена.
- `dns.LOADIPHLPAPI`: Error loading `iphlpapi.dll`.
- `dns.ADDRGETNETWORKPARAMS`: Could not find `GetNetworkParams` function.
- `dns.CANCELLED`: Запрос DNS отменен.

## Особенности реализации

Хотя [`dns.lookup()`][] и различные функции `dns.resolve*()/dns.reverse()` имеют одну и ту же цель - связать имя сети с адресом сети (и наоборот), их поведение полностью отличается. Эти различия могут иметь незначительные, но существенные последствия на поведение программ Node.js.

### `dns.lookup()`

Если заглянуть глубже, [`dns.lookup()`][] использует те же средства операционной системы, что и большинство других программ. Например, [`dns.lookup()`][] почти всегда будет разрешать заданное имя тем же способом, что и команда `ping`. На большинстве ОС типа POSIX поведение функции [`dns.lookup()`][] можно изменить поменяв настройки в nsswitch.conf(5) и/или resolv.conf(5); но обратите внимание, что изменение этих файлов приведет к изменению поведения _всех других программ, запущенных на той же операционной системе_.

Though the call to `dns.lookup()` will be asynchronous from JavaScript's perspective, it is implemented as a synchronous call to getaddrinfo(3) that runs on libuv's threadpool. This can have surprising negative performance implications for some applications, see the [`UV_THREADPOOL_SIZE`][] documentation for more information.

Note that various networking APIs will call `dns.lookup()` internally to resolve host names. If that is an issue, consider resolving the hostname to an address using `dns.resolve()` and using the address instead of a host name. Also, some networking APIs (such as [`socket.connect()`][] and [`dgram.createSocket()`][]) allow the default resolver, `dns.lookup()`, to be replaced.

### `dns.resolve()`, `dns.resolve*()` и `dns.reverse()`

Эти функции реализованы совершенно иначе, чем [`dns.lookup()`][]. Они не используют getaddrinfo(3) и _всегда_ выполняют запрос DNS по сети. Эта сетевая связь всегда выполняется асинхронно и не использует пул потоков libuv.

В результате эти функции не оказывают такого же негативного влияния на другой процесс, который происходит в пуле потоков libuv, в отличие от [`dns.lookup()`][].

Они не используют тот же набор конфигурационных файлов, который используется [`dns.lookup()`][]. Например, _они не используют конфигурацию из `/etc/hosts`_.
