# UDP/Datagram Sockets

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

<!-- name=dgram -->

Модуль `dgram` обеспечивает реализацию сокетов UDP Datagram.

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(41234);
// Prints: server listening 0.0.0.0:41234
```

## Class: `dgram.Socket`
<!-- YAML
added: v0.1.99
-->

* Extends: {EventEmitter}

Encapsulates the datagram functionality.

Новые экземпляры `dgram.Socket` создаются с помощью [`dgram.createSocket()`][]. Ключ `new` не используется для создания экземпляров `dgram.Socket`.

### Event: `'close'`
<!-- YAML
added: v0.1.99
-->

Событие `'close'` выдается после закрытия сокета с помощью [`close()`][]. После срабатывания новые события `'message'` на этом сокете появляться не будут.

### Event: `'connect'`
<!-- YAML
added: v12.0.0
-->

The `'connect'` event is emitted after a socket is associated to a remote address as a result of a successful [`connect()`][] call.

### Event: `'error'`
<!-- YAML
added: v0.1.99
-->

* `exception` {Error}

Событие `'error'` создается, когда появляется ошибка. The event handler function is passed a single `Error` object.

### Event: `'listening'`
<!-- YAML
added: v0.1.99
-->

Событие `'listening'` происходит, когда сокет начинает слушать сообщения datagram. Это происходит, как только создаются UDP сокеты.

### Event: `'message'`
<!-- YAML
added: v0.1.99
-->

Событие `'message'` выдается при наличии на сокете нового датаграма. Функция обработчика событий передает два аргумента: `msg` and `rinfo`.

* `msg` {Buffer} Сообщение.
* `rinfo` {Object} Remote address information.
  * `address` {string} Адрес отправителя.
  * `family` {string} Семейство адресов (`'IPv4'` или `'IPv6'`).
  * `port` {number} Порт отправителя.
  * `size` {number} Размер сообщения.

### `socket.addMembership(multicastAddress[, multicastInterface])`
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Указывает ядру присоединиться к мультикастной группе на заданных `multicastAddress` и `multicastInterface`, используя параметр сокета `IP_ADD_MEMBERSHIP`. Если аргумент `multicastInterface` не указан, операционная система выберет один интерфейс и добавит в него членство. Чтобы добавить членство в каждый доступный интерфейс, несколько раз вызовите `addMembership`, один раз для каждого интерфейса.

When sharing a UDP socket across multiple `cluster` workers, the `socket.addMembership()` function must be called only once or an `EADDRINUSE` error will occur:

```js
const cluster = require('cluster');
const dgram = require('dgram');
if (cluster.isMaster) {
  cluster.fork(); // Works ok.
  cluster.fork(); // Fails with EADDRINUSE.
} else {
  const s = dgram.createSocket('udp4');
  s.bind(1234, () => {
    s.addMembership('224.0.0.114');
  });
}
```

### `socket.addSourceSpecificMembership(sourceAddress, groupAddress[, multicastInterface])`
<!-- YAML
added: v13.1.0
-->
* `sourceAddress` {string}
* `groupAddress` {string}
* `multicastInterface` {string}

Tells the kernel to join a source-specific multicast channel at the given `sourceAddress` and `groupAddress`, using the `multicastInterface` with the `IP_ADD_SOURCE_MEMBERSHIP` socket option. If the `multicastInterface` argument is not specified, the operating system will choose one interface and will add membership to it. To add membership to every available interface, call `socket.addSourceSpecificMembership()` multiple times, once per interface.

### `socket.address()`
<!-- YAML
added: v0.1.99
-->

* Возвращает: {Object}

Возвращает объект, содержащий адресную информацию для сокета. Для сокетов UDP этот объект будет содержать свойства `адрес`, `семейство` и `порт`.

### `socket.bind([port][, address][, callback])`
<!-- YAML
added: v0.1.99
changes:
  - version: v0.10
    description: The method was changed to an asynchronous execution model.
                 Legacy code would need to be changed to pass a callback
                 function to the method call.
-->

* `порт` {integer}
* `адрес` {string}
* `обратный вызов` {Function} без параметров. Вызывается при завершении привязки.

Для UDP-сокетов `dgram.Socket` вызывается для прослушивания сообщений датаграмм на указанный `порт` и опционально `адрес`. Если `порт` не указан или равен `0`, операционная система будет пытаться привязать к случайному порту. Если `адрес` не указан, операционная система будет пытаться прослушать все адреса. После завершения привязки событие `'listening'` возвращается и вызывается опциональная функция `callback`.

Specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

Связанный сокет датаграмм содержит процесс Node.js, запущенный с целью принятия сообщения датаграмм.

Если привязка не удалась, генерируется событие `'error'`. В редких случаях (например, при попытке связаться с закрытым сокетом) может появиться [`Ошибка`][].

Пример UDP-сервера, прослушивающего порт 41234:

```js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`);
});

server.bind(41234);
// Prints: server listening 0.0.0.0:41234
```

### `socket.bind(options[, callback])`
<!-- YAML
added: v0.11.14
-->

* `options` {Object} Required. Поддерживает следующие свойства:
  * `порт` {integer}
  * `адрес` {string}
  * `exclusive` {boolean}
  * `fd` {integer}
* `callback` {Function}

Для сокетов UDP вызывается `dgram.Socket` для прослушивания сообщений датаграмм на указанный `порт` и опционально `адрес`, которые передаются как свойства `опций` объекта, преданного в качестве первого аргумента. Если `порт` не указан или не равен `0`, операционная система будет пытаться связаться со случайным портом. Если `адрес` не указан, операционная система будет пытаться прослушать все адреса. После завершения привязки событие `'listening'` возвращается и вызывается опциональная функция `callback`.

The `options` object may contain a `fd` property. When a `fd` greater than `0` is set, it will wrap around an existing socket with the given file descriptor. In this case, the properties of `port` and `address` will be ignored.

Specifying both a `'listening'` event listener and passing a `callback` to the `socket.bind()` method is not harmful but not very useful.

The `options` object may contain an additional `exclusive` property that is used when using `dgram.Socket` objects with the [`cluster`][] module. Если параметр `exclusive` установлен как `false` (по умолчанию), рабочие процессы кластера будут использовать тот же сокет дескриптор, позволяющий делить обязанности по обработке соединений. Если `exclusive` является `true`, дескриптор не является общим и попытка совместного использования порта приведет к ошибке.

Связанный сокет датаграмм содержит процесс Node.js, запущенный с целью принятия сообщения датаграмм.

Если привязка не удалась, генерируется событие `'error'`. В редких случаях (например, при попытке связаться с закрытым сокетом) может появиться [`Ошибка`][].

Ниже приведен пример прослушивания эксклюзивного порта.

```js
socket.bind({
  address: 'localhost',
  port: 8000,
  exclusive: true
});
```

### `socket.close([callback])`
<!-- YAML
added: v0.1.99
-->

* `callback` {Function} Called when the socket has been closed.

Закройте сокет и перестаньте слушать данные о нем. Если обратный вызов указан, он добавляется как слушатель в событие [`'close'`][].

### `socket.connect(port[, address][, callback])`
<!-- YAML
added: v12.0.0
-->

* `порт` {integer}
* `адрес` {string}
* `callback` {Function} Called when the connection is completed or on error.

Associates the `dgram.Socket` to a remote address and port. Every message sent by this handle is automatically sent to that destination. Also, the socket will only receive messages from that remote peer. Trying to call `connect()` on an already connected socket will result in an [`ERR_SOCKET_DGRAM_IS_CONNECTED`][] exception. If `address` is not provided, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets) will be used by default. Once the connection is complete, a `'connect'` event is emitted and the optional `callback` function is called. In case of failure, the `callback` is called or, failing this, an `'error'` event is emitted.

### `socket.disconnect()`
<!-- YAML
added: v12.0.0
-->

A synchronous function that disassociates a connected `dgram.Socket` from its remote address. Trying to call `disconnect()` on an already disconnected socket will result in an [`ERR_SOCKET_DGRAM_NOT_CONNECTED`][] exception.

### `socket.dropMembership(multicastAddress[, multicastInterface])`
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Указывает ядру покинуть мультикастовую группу по опции `multicastAddress`Ю, используя сокет опцию `IP_DROP_MEMBERSHIP`. Этот метод вызывается ядром автоматически, когда закрыт сокет или завершается процесс, поэтому большинство приложений не нуждаются в этом вызове.

Если `multicastInterface` не указан, операционная система будет пытаться удалить членство на всех доступных интерфейсах.

### `socket.dropSourceSpecificMembership(sourceAddress, groupAddress[, multicastInterface])`
<!-- YAML
added: v13.1.0
-->

* `sourceAddress` {string}
* `groupAddress` {string}
* `multicastInterface` {string}

Instructs the kernel to leave a source-specific multicast channel at the given `sourceAddress` and `groupAddress` using the `IP_DROP_SOURCE_MEMBERSHIP` socket option. This method is automatically called by the kernel when the socket is closed or the process terminates, so most apps will never have reason to call this.

Если `multicastInterface` не указан, операционная система будет пытаться удалить членство на всех доступных интерфейсах.

### `socket.getRecvBufferSize()`
<!-- YAML
added: v8.7.0
-->

* Returns: {number} the `SO_RCVBUF` socket receive buffer size in bytes.

### `socket.getSendBufferSize()`
<!-- YAML
added: v8.7.0
-->

* Returns: {number} the `SO_SNDBUF` socket send buffer size in bytes.

### `socket.ref()`
<!-- YAML
added: v0.9.1
-->

* Возвращает: {dgram.Socket}

По умолчанию привязка сокета приведет к блокировке закрытия процесса Node.js, пока сокет остается открытым. Метод `socket.unref()` может использоваться для исключения сокета из подсчета ссылок, что сохраняет процесс Node.js в активном состоянии. Метод `socket.ref()` добавляет сокет обратно в подсчет ссылок и восстанавливает поведение по умолчанию.

Многократный вызов `socket.ref()` не будет иметь никакого дополнительного эффекта.

Метод `socket.ref()` возвращает ссылку на сокет, поэтому вызовы могут быть связаны.

### `socket.remoteAddress()`
<!-- YAML
added: v12.0.0
-->

* Возвращает: {Object}

Returns an object containing the `address`, `family`, and `port` of the remote endpoint. It throws an [`ERR_SOCKET_DGRAM_NOT_CONNECTED`][] exception if the socket is not connected.

### `socket.send(msg[, offset, length][, port][, address][, callback])`
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11985
    description: The `msg` parameter can be an `Uint8Array` now.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/10473
    description: The `address` parameter is always optional now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/5929
    description: On success, `callback` will now be called with an `error`
                 argument of `null` rather than `0`.
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4374
    description: The `msg` parameter can be an array now. Also, the `offset`
                 and `length` parameters are optional now.
  - version: v12.0.0
    pr-url: https://github.com/nodejs/node/pull/26871
    description: Added support for sending data on connected sockets.
-->

* `msg` {Buffer|Uint8Array|string|Array} Сообщение для отправки.
* `offset` {integer} Offset in the buffer where the message starts.
* `length` {integer} Number of bytes in the message.
* `port` {integer} Destination port.
* `address` {string} Destination host name or IP address.
* `callback` {Function} Вызывается при отправке сообщения.

Передает датаграмм в сокете. For connectionless sockets, the destination `port` and `address` must be specified. Connected sockets, on the other hand, will use their associated remote endpoint, so the `port` and `address` arguments must not be set.

Аргумент `msg` содержит сообщение для отправки. В зависимости от типа может применяться разное поведение. If `msg` is a `Buffer` or `Uint8Array`, the `offset` and `length` specify the offset within the `Buffer` where the message begins and the number of bytes in the message, respectively. Если `msg` является `String`, то оно автоматически конвертируется в `Buffer` с кодом `'utf8'`. With messages that contain multi-byte characters, `offset` and `length` will be calculated with respect to [byte length](buffer.html#buffer_class_method_buffer_bytelength_string_encoding) and not the character position. If `msg` is an array, `offset` and `length` must not be specified.

Аргумент `адрес` является строкой. Если значение `адреса` является именем хоста, DNS будет использоваться для разрешения адреса хоста. If `address` is not provided or otherwise falsy, `'127.0.0.1'` (for `udp4` sockets) or `'::1'` (for `udp6` sockets) will be used by default.

Если ранее сокет не был привязан с помощью вызова `bind`, то он получает произвольный номер порта и привязывается к общему адресу интерфейсов (`'0.0.0.0'` для сокетов `udp4`, `'::0'` для сокетов `udp6`).

An optional `callback` function may be specified to as a way of reporting DNS errors or for determining when it is safe to reuse the `buf` object. DNS lookups delay the time to send for at least one tick of the Node.js event loop.

Единственный способ узнать об отправке датаграмм - использовать `callback`. Если возникает ошибка и `callback`, ошибка передается в качестве первого аргумента `callback`. Если `callback` не выдается, ошибка появляется как событие `'error'` на объекте `socket`.

Offset and length are optional but both *must* be set if either are used. They are supported only when the first argument is a `Buffer` or `Uint8Array`.

Example of sending a UDP packet to a port on `localhost`;

```js
const dgram = require('dgram');
 const message = Buffer.from('Some bytes');
 const client = dgram.createSocket('udp4');
 client.send(message, 41234, 'localhost', (err) => {
   client.close();
 });
```

Example of sending a UDP packet composed of multiple buffers to a port on `127.0.0.1`;

```js
const dgram = require('dgram');
const buf1 = Buffer.from('Some ');
const buf2 = Buffer.from('bytes');
const client = dgram.createSocket('udp4');
client.send([buf1, buf2], 41234, (err) => {
  client.close();
});
```

Sending multiple buffers might be faster or slower depending on the application and operating system. Run benchmarks to determine the optimal strategy on a case-by-case basis. Generally speaking, however, sending multiple buffers is faster.

Example of sending a UDP packet using a socket connected to a port on `localhost`:

```js
const dgram = require('dgram');
const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');
client.connect(41234, 'localhost', (err) => {
  client.send(message, (err) => {
    client.close();
  });
});
```

#### Note about UDP datagram size

The maximum size of an `IPv4/v6` datagram depends on the `MTU` (_Maximum Transmission Unit_) and on the `Payload Length` field size.

* The `Payload Length` field is `16 bits` wide, which means that a normal payload exceed 64K octets _including_ the internet header and data (65,507 bytes = 65,535 − 8 bytes UDP header − 20 bytes IP header); this is generally true for loopback interfaces, but such long datagram messages are impractical for most hosts and networks.

* `MTU` - максимальная величина, которую способен поддерживать данный слой ссылок для сообщений датаграмм. Для любой ссылки `IPv4` требует минимум `MTU` октетов `68`, пока рекомендуемая `MTU` для IPv4 является `576` (обычно рекомендуется как `MTU` для приложений типа набора), приходят ли они целиком или фрагментами.

  Для `IPv6` минимальный `MTU` является `1280` октетов, но обязательный минимальный размер перенаправляемого фрагмента `1500` октетов. Значение `68` октетов очень мало, так как современные технологии, например, Ethernet, имеют минимум `MTU` `1500`.

Невозможно заранее узнать MTU по каждой ссылке, через которую пакет может путешествовать. Отправка датаграмм больше, чем получатель `MTU` не будет работать, потому что пакет будет сброшен, не информируя источник, что информация не достигла целевого получателя.

### `socket.setBroadcast(flag)`
<!-- YAML
added: v0.6.9
-->

* `флаг` {boolean}

Устанавливает или очищает опцию сокета `SO_BROADCAST`. При значении `true`, UDP пакеты могут быть отправлены на адрес трансляции локального интерфейса.

### `socket.setMulticastInterface(multicastInterface)`
<!-- YAML
added: v8.6.0
-->

* `multicastInterface` {string}

*All references to scope in this section are referring to [IPv6 Zone Indices](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), which are defined by [RFC 4007](https://tools.ietf.org/html/rfc4007). In string form, an IP with a scope index is written as `'IP%scope'` where scope is an interface name or interface number.*

Устанавливает исходящий многоадресный интерфейс сокета по умолчанию для выбранного интерфейса или возвращается в систему выбора интерфейса. `multicastInterface` должен быть корректным строковым представлением IP из семьи сокета.

Для сокетов IPv4 это должен быть IP, настроенный для желаемого физического интерфейса. Все пакеты, отправленные на многоадресную рассылку через сокет, будут отправлены на интерфейс, который определяется последним успешным использованием этого вызова.

Для сокетов IPv6 `multicastInterface` должен включать область действия для указания интерфейса, как показано в следующем примере. В IPv6 отдельные вызовы `send` могут также использовать явную область в адресах, поэтому последнее успешное использование этого вызова влияет только на пакеты, отправленные на адрес многоадресной рассылки без указания явной области.

#### Примеры: интерфейс исходящей многоадресной рассылки IPv6

В большинстве систем, где формат области использует имя интерфейса:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%eth1');
});
```

В Windows, где формат области использует номер интерфейса:

```js
const socket = dgram.createSocket('udp6');

 socket.bind(1234, () => {
   socket.setMulticastInterface('::%2');
 });
```

#### Пример: IPv4 Исходящий Многоадресный Интерфейс
Все системы используют IP хоста на желаемом физическом интерфейсе:

```js
const socket = dgram.createSocket('udp4');

 socket.bind(1234, () => {
   socket.setMulticastInterface('10.0.0.2');
 });
```

#### Результаты вызовов

A call on a socket that is not ready to send or no longer open may throw a *Not running* [`Error`][].

If `multicastInterface` can not be parsed into an IP then an *EINVAL* [`System Error`][] is thrown.

На IPv4, если `multicastInterface` является действительным адресом, но не соответствует никакому интерфейсу или адрес не соответствует семейству, то появится [`System Error`][] такая, как `EADDRNOTAVAIL` или `EPROTONOSUP`.

On IPv6, most errors with specifying or omitting scope will result in the socket continuing to use (or returning to) the system's default interface selection.

ЛЮБОЙ адрес семейства адресов сокетов (IPv4 `'0.0.0.0'` или IPv6 `'::'`) может использоваться для возвращения управления исходящим интерфейсом сокетов по умолчанию в систему для будущих многоадресных пакетов.

### `socket.setMulticastLoopback(flag)`
<!-- YAML
added: v0.3.8
-->

* `флаг` {boolean}

Устанавливает или очищает опцию сокета `IP_MULTICAST_LOOP`. При значении `true` многоадресные пакеты также будут получены на локальном интерфейсе.

### `socket.setMulticastTTL(ttl)`
<!-- YAML
added: v0.3.8
-->

* `ttl` {integer}

Устанавливает опцию сокета `IP_MULTICAST_TTL`. TTL расшифровывается как "Время жить", в данном контексте указывается количество IP-узлов, которые может пройти данный пакет, в частности, для мультикастного трафика. Каждый маршрутизатор или шлюз, через который проходит пакет, уменьшает значение TTL. Если TTL укажет на 0, он не будет перенаправлен.

The `ttl` argument may be between 0 and 255. The default on most systems is `1`.

### `socket.setRecvBufferSize(size)`
<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Sets the `SO_RCVBUF` socket option. Sets the maximum socket receive buffer in bytes.

### `socket.setSendBufferSize(size)`
<!-- YAML
added: v8.7.0
-->

* `size` {integer}

Sets the `SO_SNDBUF` socket option. Sets the maximum socket send buffer in bytes.

### `socket.setTTL(ttl)`
<!-- YAML
added: v0.1.101
-->

* `ttl` {integer}

Устанавливает опцию сокета `IP_TTL`. Хотя TTL обычно означает «Время жизни», в этом контексте оно указывает количество IP-прыжков, через которые пакету дозволено пройти. Каждый маршрутизатор или шлюз, который перенаправляет пакет, уменьшает TTL. Если значение TTL не достигло 0 на маршрутизаторе, то пакет не будет перенаправлен. Изменение значения TTL обычно делается для типовых зондов или при мультикастинге.

The `ttl` argument may be between between 1 and 255. The default on most systems is 64.

### `socket.unref()`
<!-- YAML
added: v0.9.1
-->

* Возвращает: {dgram.Socket}

По умолчанию привязка сокета приведет к блокировке закрытия процесса Node.js, пока сокет остается открытым. Метод `socket.unref()` может использоваться для исключения сокета из подсчета ссылок, что поддерживает процесс Node.js в активном состоянии, позволяя процессу завершиться, даже если сокет продолжает прослушивать.

Многократный вызов `socket.unref()` не будет иметь никакого дополнительного эффекта.

Метод `socket.unref()` возвращает ссылку на сокет, поэтому вызовы могут быть связаны.

## Функции модуля `dgram`

### `dgram.createSocket(options[, callback])`
<!-- YAML
added: v0.11.13
changes:
  - version: v8.6.0
    pr-url: https://github.com/nodejs/node/pull/14560
    description: The `lookup` option is supported.
  - version: v8.7.0
    pr-url: https://github.com/nodejs/node/pull/13623
    description: The `recvBufferSize` and `sendBufferSize` options are
                 supported now.
  - version: v11.4.0
    pr-url: https://github.com/nodejs/node/pull/23798
    description: The `ipv6Only` option is supported.
-->

* `options` {Object} Available options are:
  * `type` {string} The family of socket. Must be either `'udp4'` or `'udp6'`. Required.
  * `reuseAddr` {boolean} When `true` [`socket.bind()`][] will reuse the address, even if another process has already bound a socket on it. **Default:** `false`.
  * `ipv6Only` {boolean} Setting `ipv6Only` to `true` will disable dual-stack support, i.e., binding to address `::` won't make `0.0.0.0` be bound. **Default:** `false`.
  * `recvBufferSize` {number} Sets the `SO_RCVBUF` socket value.
  * `sendBufferSize` {number} Sets the `SO_SNDBUF` socket value.
  * `lookup` {Function} Custom lookup function. **Default:** [`dns.lookup()`][].
* `callback` {Function} Attached as a listener for `'message'` events. Необязательный.
* Возвращает: {dgram.Socket}

Создает объект `dgram.Socket`. Once the socket is created, calling [`socket.bind()`][] will instruct the socket to begin listening for datagram messages. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). The bound address and port can be retrieved using [`socket.address().address`][] and [`socket.address().port`][].

### `dgram.createSocket(type[, callback])`
<!-- YAML
added: v0.1.99
-->

* `type` {string} Either `'udp4'` or `'udp6'`.
* `callback` {Function} Функция прикреплена как слушатель событий `'message'`.
* Возвращает: {dgram.Socket}

Создает объект `dgram.Socket` заданного `type`.

После создания сокета вызов [`socket.bind()`][] даст команду сокету прослушивать сообщения датаграммы. When `address` and `port` are not passed to [`socket.bind()`][] the method will bind the socket to the "all interfaces" address on a random port (it does the right thing for both `udp4` and `udp6` sockets). Связанный адрес и порт можно получить с помощью [`socket.address().address`][] и [`socket.address().port`][].
