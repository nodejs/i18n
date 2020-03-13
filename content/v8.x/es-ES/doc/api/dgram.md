# UDP/ Datagram Sockets

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

<!-- name=dgram -->

El módulo `dgram` proporciona una implementación de sockets de UDP Datagrama.

```js
const dgram = requerido ('dgram');
const servidor = dgram.createSocket ('udp4');

servidor.on ('error', (err) = & gt; {
   console.log (`error del servidor: \ n $ {err.stack}`);
   server.close ();
});

servidor.on('mensage', (msg, rinfo) => {
  console.log(`server got: ${msg} desde ${rinfo.address}:${rinfo.port}`);
});

servidor.on('escuchando', () => {
  const dirección = dirección de servidor();
  console.log(`server listening ${address.address}:${address.port}`);
});

servidor.bind(41234);
// servidor escuchando 0.0.0.0:41234
```

## Clase: dgram.Socket
<!-- YAML
added: v0.1.99
-->

El objeto `dgram.Socket` es un [` EventEmitter`][] que encapsula la funcionalidad del datagrama.

Las nuevas instancias de `dgram.Socket` son creadas usando [`dgram.createSocket()`][]. La palabra clave `new` no debe ser usada para crear instancias `dgram.Socket`.

### Evento: 'close'
<!-- YAML
added: v0.1.99
-->

El evento `'close'` se emite luego de que un socket es cerrado con [`close()`][]. Una vez activado, no se emitirán nuevos eventos `'message'` en este socket.

### Evento: 'error'
<!-- YAML
added: v0.1.99
-->

* `exception` {Error}

El evento `'error'` se emite cada vez que se produce un error. La función manejador de eventos pasa un solo objeto de error.

### Evento: 'listening'
<!-- YAML
added: v0.1.99
-->

El evento ` 'listening' ` se emite cada vez que un socket comienza a escuchar Mensajes de datagramas. Esto ocurre tan pronto como sockets UDP son creados.

### Evento: 'message'
<!-- YAML
added: v0.1.99
-->

El evento `'message'` se emite cuando un nuevo datagrama está disponible en un socket. El evento función del controlador pasa con dos argumentos: `msg` y `rinfo`.
* `msg` {Buffer} El mensaje.
* `rinfo` {Object} Remote address information.
  * `address` {string} La dirección del remitente.
  * `family` {string} La familia de direcciones (` 'IPv4' ` o ` 'IPv6' `).
  * `port` {number} El puerto del remitente.
  * `size` {number} Tamaño del mensaje.

### socket.añadir miembro(multicastAddress [, multicastInterface])
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Le dice al kernel que se una a un grupo multicast en las `multicastAddress` y `multicastInterface` dadas usando la opción del socket `IP_ADD_MEMBERSHIP`. Si el argumento `multicastInterface` no está especificado, el sistema operativo elegirá una interfaz y le agregará una membresía. Para agregar membresía a cada interfaz disponible llame a `addMembership` varias veces, una vez por interfaz.

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

### socket.dirección()
<!-- YAML
added: v0.1.99
-->

Devuelve un objeto incluyendo la información de la dirección para un socket. Para sockets UDP, este objeto contendrá `address`, `family` y propiedades de `port`.

### socket.bind(\[port\]\[, address\][, callback])
<!-- YAML
added: v0.1.99
-->

* `port` {number} Entero.
* ` dirección ` {string}
* ` devolución de llamada ` {Función} sin parámetros. Llamando cuando el enlace está completo.

Para sockets UDP, causa que `dgram.Socket` escuche por mensajes datagrama en un `port` llamado y `address` optional. Si ` el puerto ` no es especificado o es ` 0 `, el sistema operativo intentará enlazarse a un puerto aleatorio. Si `address` no es especificada, el sistema operativo intentará escuchar en todas las direcciones. Una vez que el enlace está completado, `'listening'` un evento es emitido y la función opcional `callback` es llamada.

Tenga en cuenta que especificando ambos ` 'escuchando' ` evento listener y ` devolución de llamada ` al método ` socket.bind () ` método no es perjudicial pero no es muy útil.

Un socket de datagrama enlazado mantiene el proceso Node.js en ejecución para recibir mensajes de datagrama.

Si el enlace falla, se genera un evento `'error'`. En casos raros (por ejemplo, intentando enlazar con un socket cerrado), un [`Error`][] puede ser arrojado.

Ejemplo de un servidor UDP “listening” en el puerto 41234:

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
// servidor escucha a 0.0.0.0:41234
```

### socket.bind(opciones[, callback])
<!-- YAML
added: v0.11.14
-->

* `options` {Object} Requerido. Soporta las siguientes propiedades:
  * `port` {integer}
  * `dirección` {string}
  * `exclusivo` {boolean}
* `callback` {Function}

Para sockets UDP, causa que `dgram.Socket` escuche por mensajes datagrama en un `port` nombrado y `address` opcional que son pasadas como propiedades de un objeto `options` pasado como el primer argumento. Si `port` no está especificado o es `0`, el sistema operativo intentará enlazar a un puerto aleatorio. Si`address` no es especificada, el sistema operativo intentará escuchar en todas las direcciones. Una vez que el enlace está completado, un evento `'listening'` es emitido y la función `callback` opcional es llamada.

Tenga en cuenta que especificando ambos ` 'escuchando' ` evento listener y ` devolución de llamada ` al método ` socket.bind () ` método no es perjudicial pero no es muy útil.

El objeto `options` puede contener una propiedad `exclusive` adicional que es utilizada cuando se usan objetos `dgram.Socket` con el módulo [`cluster`]. Cuando `exclusive` es establecido como `false` (la manera predeterminada), los workers del clúster utilizarán el mismo handle del socket subyacente, permitiendo que las tareas del manejo de la conexión sean compartidas. Sin embargo, cuando `exclusive` es `true`, el handle no es compartido y los intentos de compartir el puerto resultan en un error.

Un socket de datagrama enlazado mantiene el proceso Node.js en ejecución para recibir mensajes de datagrama.

Si el enlace falla, se genera un evento `'error'`. En casos raros (por ejemplo, intentando enlazar con un socket cerrado), un [`Error`][] puede ser arrojado.

Un ejemplo de un socket escuchando a un puerto exclusivo es mostrado a continuación.

```js
socket.bind({
  address: 'localhost',
  port: 8000,
  exclusive: true
});
```

### socket.close([callback])
<!-- YAML
added: v0.1.99
-->

Cierra el socket subyacente y deja de escuchar por datos en él. Si se provee un callback, es añadido como un listener para el evento [`'close'`][].

### socket.dropMembership(multicastAddress[, multicastInterface])
<!-- YAML
added: v0.6.9
-->

* `multicastAddress` {string}
* `multicastInterface` {string}

Instruye al Kernel para que deje un grupo multicast en `multicastAddress` usando la opción del socket `IP_DROP_MEMBERSHIP`. Este método es llamado automáticamente por el kernel cuando el socket es cerrado o cuando el proceso termina, para que la mayoría de las aplicaciones nunca tengan una razón para llamar a este método.

Si `multicastInterface` no es especificada, el sistema operativo intentará abandonar la membresía en todas las interfaces válidas.

### socket.getRecvBufferSize()
<!-- YAML
added: v8.7.0
-->

* Devuelve: {number} el socket `SO_RCVBUF` recibe el tamaño del búfer en bytes.

### socket.getSendBufferSize()
<!-- YAML
added: v8.7.0
-->

* Devuelve: {number} el socket `SO_SNDBUF` envía el tamaño del búfer en bytes.

### socket.ref()
<!-- YAML
added: v0.9.1
-->

De manera predeterminada, enlazar un socket causará que este bloquee el cierre del proceso Node.js mientras permanezca el socket abierto. El método `socket.unref()` puede ser usado para excluir el socket de la cuenta de referencia, que mantiene el proceso Node.js activo. El método `socket.ref()` añade el socket de vuelta a la cuenta de referencia y restaura el comportamiento predeterminado.

Llamar a `socket.ref()` múltiples veces, no tendrá ningún efecto adicional.

El método `socket.ref()` devuelve una referencia al socket para que las llamadas puedan ser encadenadas.

### socket.send(msg, \[offset, length,] port [, address\] \[, callback\])
<!-- YAML
added: v0.1.99
changes:
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/11985
    description: The `msg` parameter can be an Uint8Array now.
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
-->

* `msg` {Buffer|Uint8Array|string|Array} Mensaje para ser enviado.
* `offset` {number} Entero. Offset en el búfer donde comienza el mensaje.
* `length` {number} Entero. Número de bytes en el mensaje.
* `port` {number} Entero. Puerto de destino.
* `address` {string} Nombre de host de destino o dirección IP.
* `callback` {Function} Llamada cuando el mensaje ha sido enviado.

Transmite un datagrama en el socket. El `port` y la `address` de destino deben ser especificada.

El argumento `msg` contiene el mensaje que será enviado. Dependiendo de su tipo, se pueden aplicar distintos comportamientos. Si `msg` es un `Buffer` o un `Uint8Array`, el `offset` y el `length` especifican, respectivamente, el offset dentro del `Buffer`, dónde el mensaje comienza y el número de bytes en el mensaje. Si `msg` es un `String`, entonces se convierte automáticamente en un `Buffer` con codificación `'utf8'`. Con mensajes que contienen caracteres multi-bytes, `offset` y `length` serán calculados con respecto a [longitud de bytes](buffer.html#buffer_class_method_buffer_bytelength_string_encoding) y no con la posición del carácter. Si `msg` es un array, `offset` y `length` no deben ser especificados.

El argumento `address` es un string. Si el valor de `address` es un nombre del host, el DNS será usado para resolver la dirección del host. Si la `address` no es proporcionada o es falsa, van a ser usados de manera predeterminada `'127.0.0.1'` (para sockets `udp4`) o `'::1'` (para sockets `udp6`).

Si el socket no ha sido anteriormente enlazado con un llamado a `bind`, el socket es asignado a un número de puerto aleatorio y es enlazado a la dirección de "todas las interfaces" (`'0.0.0.0'` para sockets `udp4`, `'::0'` para sockets `udp6`.)

Una función `callback` opcional puede ser especificada como una manera de reportar los errores DNS o para determinar cuándo es seguro reutilizar el objeto `buf`. Tenga en cuenta que la búsqueda de DNS demora el tiempo para enviar al menos un tick al bucle del evento Node.js.

La única manera de saber con certeza que se ha enviado el datagrama es usando un `callback`. Si ocurre un error y se da un `callback`, el error será pasado como el primer argumento pare el `callback`. Si no se da un `callback`, el error es emitido como un evento `'error'` en el objeto `socket`.

El offset y la longitud son opcionales, pero ambos *deben* ser establecidos si ninguno es usado. Solo son soportados cuando el primer argumento es un `Buffer` o `Uint8Array`.

Ejemplo de enviar un paquete UDP a un puerto en `localhost`;

```js
const dgram = require('dgram');
const message = Buffer.from('Some bytes');
const client = dgram.createSocket('udp4');
client.send(message, 41234, 'localhost', (err) => {
  client.close();
});
```

Ejemplo de enviar un paquete UDP compuesto de múltiples búferes a un puerto en `127.0.0.1`;

```js
const dgram = require('dgram');
const buf1 = Buffer.from('Some ');
const buf2 = Buffer.from('bytes');
const client = dgram.createSocket('udp4');
client.send([buf1, buf2], 41234, (err) => {
  client.close();
});
```

Enviar múltiples búferes puede ser más rápido o más lento dependiendo de la aplicación y del sistema operativo. Es importante ejecutar pruebas de rendimiento para determinar la estrategia óptima en una base de caso por caso. En general, sin embargo, enviar múltiples búferes es más rápido.

**Una nota sobre el tamaño de datagrama UDP**

El tamaño máximo de un datagrama `IPv4/v6` depende del `MTU` (_Unidad Máxima de Transmisión_), y del tamaño del campo de `Payload Length`.

- El campo de `Payload Length` tiene `16 bits` de ancho, lo que significa que una carga normal sobrepasa 64K octets _incluyendo_ el encabezado de internet y los datos (65,507 bytes = 65,535 − 8 bytes encabezado UDP − 20 bytes encabezado IP).

- El `MTU` es el tamaño más grande que una tecnología de capa de enlace puede soportar para mensajes de datagrama. Para cualquier enlace, `IPv4` exige un `MTU` mínimo de `68` octets, mientras que el `MTU` para IPv4 es `576` (recomendado comúnmente como el `MTU` para aplicaciones con un tipo de conexión por línea conmutada), ya bien si llegan completos o en fragmentos.

  Para `IPv6`, el `MTU` mínimo es `1280` octets, sin embargo, el tamaño mínimo obligatorio del búfer del reensamblaje de fragmento es `1500` octets. El valor de `68` octets es muy pequeño, puesto que las tecnologías de capa de enlace más recientes, como Ethernet, tienen un `MTU` mínimo de `1500`.

Es imposible saber con anterioridad el MTU de cada enlace por medio del cual un paquete podría viajar. Enviar un datagrama mayor que el `MTU` del receptor no funcionará porque el paquete será abandonado silenciosamente sin informar a la fuente que los datos no llegaron al destinatario deseado.

### socket.setBroadcast(flag)
<!-- YAML
added: v0.6.9
-->

* `flag` {boolean}

Establece o borra la opción socket `SO_BROADCAST`. Cuando se establece como `true`, los paquetes UDP pudieran ser enviados a una dirección de transmisión de la interfaz local.

### socket.setMulticastInterface(multicastInterface)
<!-- YAML
added: v8.6.0
-->

* `multicastInterface` {string}

*Nota: Todas las referencias a investigar en esta sección se refieren a los [Índices de Zona IPv6](https://en.wikipedia.org/wiki/IPv6_address#Scoped_literal_IPv6_addresses), que son definidos por [RFC 4007](https://tools.ietf.org/html/rfc4007). En forma de string, una IP con un índice de ámbito es escrita como `'IP%scope'` donde el ámbito es el nombre o número de la interfaz.*

Establece la interfaz de multidifusión saliente predeterminada del socket a una interfaz escogida, o devuelve al sistema de selección de interfaces. EL `multicastInterface` debe ser una representación string válida de una IP, de la familia del socket.

Para sockets IPv4, este debería ser el IP configurado para la interfaz física deseada. Todos los paquetes enviados a hacer multidifusión en el socket serán enviados a la interfaz, determinado por el uso exitoso más reciente de esta llamada.

Para sockets IPv6, `multicastInterface` debería incluir un scope para indicar la interfaz como en el siguiente ejemplo. En IPv6, llamadas `send` individualmente también pueden usar scope explícito en las direcciones, para que solo los paquetes enviados a una dirección de multidifusión sin especificar un scope explícito sean afectadas por el uso exitoso más reciente de esta llamada.

#### Ejemplos: IPv6 Interfaz de Multidifusión Saliente

En la mayoría de los sistemas, donde el formato scope usa el nombre de la interfaz:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%eth1');
});
```

En Windows, donde el formato scope usa un número de interfaz:

```js
const socket = dgram.createSocket('udp6');

socket.bind(1234, () => {
  socket.setMulticastInterface('::%2');
});
```

#### Ejemplo: IPv4 Interfaz de Multidifusión Saliente
Todos los sistemas usan un IP del host en la interfaz física deseada:
```js
const socket = dgram.createSocket('udp4');

socket.bind(1234, () => {
  socket.setMulticastInterface('10.0.0.2');
});
```

#### Resultados de la Llamada

Una llamada en un socket que no está listo para enviar, o no está abierto, puede arrojar un *No se está ejecutando* [`Error`][].

Si `multicastInterface` no puede ser analizado en un IP, entonces un se arroja *EINVAL* [`System Error`][].

En IPv4, si `multicastInterface` es una dirección válida, pero no coincide con ninguna interfaz, o si la dirección no coincide con la familia entonces se arroja un [`System Error`][], tales como `EADDRNOTAVAIL` o `EPROTONOSUP`.

En IPv6, la mayoría de los errores especificando u omitiendo el scope resultará en el socket continúe usando (o retorne a) la selección de interfaz predeterminada del sistema.

CUALQUIER dirección de la familia de la direcciones de un socket (IPv4 `'0.0.0.0'` or IPv6 `'::'`) puede ser usada para devolver el control de interfaz saliente predeterminada de los sockets al sistema para futuros paquetes multidifusores.


### socket.setMulticastLoopback(flag)
<!-- YAML
added: v0.3.8
-->

* `flag` {boolean}

Establece o borra la opción del socket `IP_MULTICAST_LOOP`. Cuando se establece como `true`, los paquetes de multidifusión también serán recibidos en la interfaz local.

### socket.setMulticastTTL(ttl)
<!-- YAML
added: v0.3.8
-->

* `ttl` {number} Entero.

Establece la opción del socket `IP_MULTICAST_TTL`. Mientras que TTL generalmente significa "Tiempo Para Vivir", en este contexto especifica el número de saltos IP que un paquete es permitido viajar, específicamente para tráfico de multidifusión. Cada router o puerta de enlace que reenvía un paquete disminuye el TTL. Si el TTL es disminuido a 0 por un router, no se reenviará.

El argumento pasado a `socket.setMulticastTTL()` es un número que salta entre 0 y 255. El predeterminado en la mayoría de los sistemas es `1` pero puede variar.

### socket.setRecvBufferSize(size)
<!-- YAML
added: v8.7.0
-->

* `size` {number} Integer

Establece la opción del socket `SO_RCVBUF`. Establece el búfer de recibir del máximo socket en bytes.

### socket.setSendBufferSize(size)
<!-- YAML
added: v8.7.0
-->

* `size` {number} Integer

Establece la opción del socket `SO_SNDBUF`. Establece el búfer de enviar del máximo socket en bytes.

### socket.setTTL(ttl)
<!-- YAML
added: v0.1.101
-->

* `ttl` {number} Entero.

Establece la opción del socket `IP_TTL`. Mientras que TTL generalmente significa "Tiempo Para Vivir", en este contexto especifica el número de saltos de IP que un paquete tiene permitido viajar. Cada router o puerta de enlace que reenvía un paquete disminuye el TTL. Si el TTL es disminuido a 0 por un router, no se reenviará. Valores TTL cambiantes son hechos por sondeos de red, o cuando se hace multidifusión.

El argumento para `socket.setTTL()` es un número que salta entre 1 y 255. El predeterminado en la mayoría de los sistemas es 64 pero puede variar.

### socket.unref()
<!-- YAML
added: v0.9.1
-->

De manera predeterminada, enlazar un socket causará que este bloquee el cierre del proceso Node.js mientras permanezca el socket abierto. El método `socket.unref()` puede ser usado para excluir el socket de la referencia, teniendo en cuenta que mantiene el proceso Node.js activo, permitiendo al proceso salir incluso si el socket sigue escuchando.

Llamar a `socket.unref()` múltiples veces no tendrá ningún efecto.

El método `socket.unref()` devuelve una referencia al socket para que las llamadas puedan ser encadenadas.

### Cambiar al comportamiento `socket.bind()` asincrónico

A partir de Node.js v0.10, [`dgram.Socket#bind()`][] cambió a un modelo de ejecución asincrónico. Código heredado que asume comportamiento sincrónico, como en el siguiente ejemplo:

```js
const s = dgram.createSocket('udp4');
s.bind(1234);
s.addMembership('224.0.0.114');
```

Debe ser cambiado para pasar una función callback a la función [`dgram.Socket#bind()`][]:

```js
const s = dgram.createSocket('udp4');
s.bind(1234, () => {
  s.addMembership('224.0.0.114');
});
```

## `dgram` funciones del módulo

### dgram.createSocket(options[, callback])
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
-->

* `options` {Object} Available options are:
  * `type` {string} La familia del socket. Debe ser `'udp4'` o `'udp6'`. Requerido.
  * `reuseAddr` {boolean} Cuando sea `true`, [`socket.bind()`][] reutilizará la dirección, incluso si otro proceso ya ha enlazado un socket. **Predeterminado:** `false`.
  * `recvBufferSize` {number} - Establece el valor del socket `SO_RCVBUF`.
  * `sendBufferSize` {number} - Establece el valor del socket `SO_SNDBUF`.
  * `lookup` {Function} Función de búsqueda personalizada. **Predeterminado:** [`dns.lookup()`][].
* `callback` {Function} Adjuntada como un listener para eventos `'message'`. Opcional.
* Devuelve: {dgram.Socket}

Crea un objeto `dgram.Socket`. Una vez que el socket es creado, llamar a [`socket.bind()`][] le dirá al socket que empiece a escuchar por mensajes de datagrama. Cuando `address` y `port` no son pasados a [`socket.bind()`][], el método enlazará el socket a la dirección "todas las interfaces" en un puerto aleatorio (hace lo correcto tanto para el socket `udp4` como para el socket `udp6`). La dirección y puerto enlazados pueden ser recuperados usando [`socket.address().address`][] y [`socket.address().port`][].

### dgram.createSocket(type[, callback])
<!-- YAML
added: v0.1.99
-->

* `type` {string} - Ya sea 'udp4' o 'udp6'.
* `callback` {Function} - Adjuntada como un listener para los eventos `'message'`.
* Devuelve: {dgram.Socket}

Crea un objeto `dgram.Socket` del `type` especificado. El argumento `type` puede ser `udp4` o bien`udp6`. Una función `callback` opcional puede ser pasada, que es añadida como un listener para eventos `'message'`.

Una vez que el socket es creado, llamar a [`socket.bind()`][] le dirá al socket que empiece a escuchar por mensajes de datagrama. Cuando ni `address` ni `port` son pasados a [`socket.bind()`][], el método enlazará el socket a la dirección "todas las interfaces" en un puerto aleatorio (hace lo correcto tanto para el socket `udp4` como para el socket `udp6`). La dirección y puerto enlazados pueden ser recuperados usando [`socket.address().address`][] y [`socket.address().port`][].
