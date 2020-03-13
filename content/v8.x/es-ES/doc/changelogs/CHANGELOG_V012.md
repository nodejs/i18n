# Registro de Cambios de Node.js 0.12

<!--lint disable prohibited-strings-->

<table>
<tr>
<th>Estable</th>
</tr>
<tr>
<td>
<a href="#0.12.18">0.12.18</a><br/>
<a href="#0.12.17">0.12.17</a><br/>
<a href="#0.12.16">0.12.16</a><br/>
<a href="#0.12.15">0.12.15</a><br/>
<a href="#0.12.14">0.12.14</a><br/>
<a href="#0.12.13">0.12.13</a><br/>
<a href="#0.12.12">0.12.12</a><br/>
<a href="#0.12.11">0.12.11</a><br/>
<a href="#0.12.10">0.12.10</a><br/>
<a href="#0.12.9">0.12.9</a><br/>
<a href="#0.12.8">0.12.8</a><br/>
<a href="#0.12.7">0.12.7</a><br/>
<a href="#0.12.6">0.12.6</a><br/>
<a href="#0.12.5">0.12.5</a><br/>
<a href="#0.12.4">0.12.4</a><br/>
<a href="#0.12.3">0.12.3</a><br/>
<a href="#0.12.2">0.12.2</a><br/>
<a href="#0.12.1">0.12.1</a><br/>
<a href="#0.12.0">0.12.0</a><br/>
</td>
</tr>
</table>

* Otras Versiones
  * [8.x](CHANGELOG_V8.md)
  * [7.x](CHANGELOG_V7.md)
  * [6.x](CHANGELOG_V6.md)
  * [5.x](CHANGELOG_V5.md)
  * [4.x](CHANGELOG_V4.md)
  * [0.10.x](CHANGELOG_V010.md)
  * [io.js](CHANGELOG_IOJS.md)
  * [Archive](CHANGELOG_ARCHIVE.md)

*Note*: Node.js v0.12 is covered by the [Node.js Long Term Support Plan](https://github.com/nodejs/LTS) and will be maintained until December 31st, 2016.

<a id="0.12.18"></a>

## 2016-12-21, Versión 0.12.18 (Mantenimiento), @rvagg

### Cambios Notables:

* npm; Actualización de v2.15.1 a v2.15.11, incluida la licencia actualizada precisa (Jeremiah Senkpiel)
* process: `process.versions.ares` now outputs the c-ares version (Johan Bergström)

### Commits:

* [a47fd4549d] - build: add working lint-ci make target (Rod Vagg) https://github.com/nodejs/node/pull/9151
* [830584ca59] - deps: define missing operator delete functions (John Barboza) https://github.com/nodejs/node/pull/10356
* [c130b31cba] - deps: actualizar npm a 2.15.11 (Jeremiah Senkpiel) https://github.com/nodejs/node/pull/9619
* [bc6766d847] - doc: actualizar licencia npm en archivo principal LICENSE (Rod Vagg) https://github.com/nodejs/node/pull/10352
* [0cdf344c80] - (SEMVER-MINOR) process: reintroduce ares to versions (Johan Bergström) https://github.com/nodejs/node/pull/9191
* [d8e27ec30a] - test: mark dgram-multicast-multi-process as flaky (Rod Vagg) https://github.com/nodejs/node/pull/9150
* [c722335ead] - tls: corregir falla menor de jslint (Rod Vagg) https://github.com/nodejs/node/pull/9107

<a id="0.12.17"></a>

## 2016-10-18, Version 0.12.17 (Maintenance), @rvagg

Esto es un lanzamiento de seguridad. Todos los usuarios de Node.js deberían consultar el resumen de la actualización de seguridad en https://nodejs.org/en/blog/vulnerability/october-2016-security-releases/ para más detalles sobre vulnerabilidades parcheadas.

### Cambios Notables:

* c-ares: corregir para sobreescritura de buffer de un sólo byte, CVE-2016-5180, más información en https://c-ares.haxx.se/adv_20160929.html (Daniel Stenberg)

### Commits:

* [c5b095ecf8] - deps: evitar sobreescritura de buffer de un sólo byte (Daniel Stenberg) https://github.com/nodejs/node/pull/8849

<a id="0.12.16"></a>

## 2016-09-27, Version 0.12.16 (Maintenance), @rvagg

Esto es un lanzamiento de seguridad. Todos los usuarios de Node.js deberían consultar https://nodejs.org/en/blog/vulnerability/september-2016-security-releases/ para más detalles sobre vulnerabilidades parcheadas.

### Cambios notables:

* buffer: Rellenar con ceros el exceso de bytes en nuevos objetos `Buffer` creados con `Buffer.concat()` mientras proporcionan un parámetro `totalLength` que excede la longitud total de los objetos `Buffer` originales siendo concatenados. (Сковорода Никита Андреевич)
* http:
  - CVE-2016-5325 - Validar apropiadamente los caracteres permitidos en el argumento `reason` en `ServerResponse#writeHead()`. Corrige un posible vector de ataque de división de respuesta. Este introduce un nuevo caso en el que puede ocurrir `throw` cuando se estén configurando las respuestas de HTTP, los usuarios ya deberían adoptar try/catch aquí. Originalmente reportado de forma independiente por Evan Lucas y Romain Gaucher. (Evan Lucas)
  - Los códigos de estado inválidos ya no pueden ser enviados. Limitado a números de 3 dígitos entre 100 - 999. La falta de validación adecuada también puede servir como un potencial vector de ataque de división de respuesta. Se le hizo backport de v4.x. (Brian White)
* openssl:
  - Actualizado a 1.0.1u, corrige un número de defectos que impactan a Node.js: CVE-2016-6304 ("Crecimiento ilimitado de memoria de la extensión de solicitud de estado de OCSP", gravedad alta), CVE-2016-2183, CVE-2016-6303, CVE-2016-2178 y CVE-2016-6306.
  - Eliminar soporte para cargar módulos dinámicos de motor externo. Un atacante puede ser capaz de ocultar código malicioso a ser insertado en Node.js en el tiempo de ejecución enmascarándose como uno de los módulos de motor dinámico. Originalmente reportado por Ahmed Zaki (Skype). (Ben Noordhuis, Rod Vagg)
* tls: CVE-2016-7099 - Corregir la comprobación de validación de certificado de comodín inválido por la cual un servidor TLS puede servir un certificado de comodín inválido para su nombre de host debido a una validación incorrecta de `*.` en la cadena de comodín. Originalmente reportado por Alexander Minozhenko y James Bunton (Atlassian). (Ben Noordhuis)

### Commits:

* [38d7258d89] - buffer: Rellenar con cero bytes sin inicializar en .concat() (Сковорода Никита Андреевич) https://github.com/nodejs/node-private/pull/66
* [1ba6d16786] - build: activar -fno-delete-null-pointer-checks (Ben Noordhuis) https://github.com/nodejs/node/pull/6737
* [71e4285e27] - crypto: no compilar motores de hardware (Rod Vagg) https://github.com/nodejs/node-private/pull/69
* [b6e0105a66] - deps: agregar -no_rand_screen a s_client de openssl (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25368
* [1caec97eab] - deps: corregir error de ensamblaje de openssl en ia32 win32 (Fedor Indutny) https://github.com/nodejs/node-v0.x-archive/pull/25654
* [734bc6938b] - deps: separar sha256/sha512-x86_64.pl para openssl (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25654
* [7cc6d4eb5c] - deps: copiar todos los archivos de cabecera de openssl para incluir dir (Shigeki Ohtsu) https://github.com/nodejs/node/pull/8718
* [4a9da21217] - deps: actualizar fuentes de openssl a 1.0.1u (Shigeki Ohtsu) https://github.com/nodejs/node/pull/8718
* [6d977902bd] - http: verificar caracteres de razón en writeHead (Evan Lucas) https://github.com/nodejs/node-private/pull/47
* [ad470e496b] - http: denegar envío de códigos de estado obviamente inválidos (Evan Lucas) https://github.com/nodejs/node-private/pull/47
* [9dbde2fc88] - lib: hacer tls.checkServerIdentity() más estricto (Ben Noordhuis) https://github.com/nodejs/node-private/pull/61
* [db80592071] - openssl: corregir requisito de keypress en aplicaciones en win32 (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25654

<a id="0.12.15"></a>

## 2016-06-23, Version 0.12.15 (Maintenance), @rvagg

### Cambios Notables:

Esto es un lanzamiento de seguridad. Todos los usuarios de Node.js deberían consultar https://nodejs.org/en/blog/vulnerability/june-2016-security-releases/ para más detalles sobre vulnerabilidades parcheadas.

* libuv: (CVE-2014-9748) Corrige un bug en la implementación de bloqueo de lectura/escritura para Windows XP y Windows 2003 que pueden llevar a un comportamiento indefinido y potencialmente inseguro. Se puede encontrar más información en https://github.com/libuv/libuv/issues/515 o en https://nodejs.org/en/blog/vulnerability/june-2016-security-releases/.
* V8: (CVE-2016-1669) Corrige una potencial vulnerabilidad de desbordamiento de Buffer descubierta en V8, se pueden encontrar más detalles en el CVE en https://www.cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-1669 or at https://nodejs.org/en/blog/vulnerability/june-2016-security-releases/.

### Commits:

* [da8501edf6] - deps: backport bd1777fd from libuv upstream (Rod Vagg)
* [9207a00f8e] - deps: backport 85adf43e from libuv upstream (Rod Vagg)
* [9627f34230] - deps: backport 98239224 from libuv upstream (Rod Vagg)
* [5df21b2e36] - deps: backport 9a4fd268 from libuv upstream (Rod Vagg)
* [e75de35057] - deps: backport 3eb6764a from libuv upstream (Rod Vagg)
* [a113e02f16] - deps: backport 3a9bfec from v8 upstream (Ben Noordhuis)
* [8138055c88] - test: fix test failure due to expired certificates (Ben Noordhuis) https://github.com/nodejs/node/pull/7195

<a id="0.12.14"></a>

## 2016-05-06, Version 0.12.14 (Maintenance), @rvagg

### Cambios Notables:

* npm: Corregir números de versión erróneos en el código v2.15.1 (Forrest L Norvell) https://github.com/nodejs/node/pull/5988
* openssl: Actualizar a v1.0.1t, abordando vulnerabilidades de seguridad (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
  - Repara CVE-2016-2107 "Oráculo de relleno en la verificación AES-NI CBC MAC"
  - Fixes CVE-2016-2105 "EVP_EncodeUpdate overflow"
  - Vea https://nodejs.org/en/blog/vulnerability/openssl-may-2016/ para los detalles completos

### Commits:

* [3e99ee1b47] - deps: actualizar completamente npm en LTS a 2.15.1 (Forrest L Norvell) https://github.com/nodejs/node/pull/5988
* [2b63396e1f] - deps: agregar -no_rand_screen a s_client en openssl (Shigeki Ohtsu) https://github.com/joyent/node/pull/25368
* [f21705df58] - deps: actualizar archivos asm de openssl (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
* [02b6a6bc27] - deps: corregir error de ensamblaje de openssl en ia32 win32 (Fedor Indutny) https://github.com/joyent/node/pull/25654
* [1aecc668b0] - deps: separar sha256/sha512-x86_64.pl para openssl (Shigeki Ohtsu) https://github.com/joyent/node/pull/25654
* [39380836a0] - deps: copiar todos los archivos de cabecera de openssl para incluir dir (Shigeki Ohtsu) https://github.com/nodejs/node/pull/655
* [08c8ae44a8] - deps: actualizar fuentes de openssl a 1.0.1t (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
* [f5a961ab13] - openssl: corregir el requisito keypress en aplicaciones en win32 (Shigeki Ohtsu) https://github.com/joyent/node/pull/25654
* [810fb211a7] - tools: eliminar comando obsoleto de npm test-legacy (Kat Marchán) https://github.com/nodejs/node/pull/5988

<a id="0.12.13"></a>

## 2016-03-31, Versión 0.12.13 (LTS), @rvagg

### Cambios notables

* npm: Actualizar a v2.15.1. (Forrest L Norvell)
* openssl: OpenSSL v1.0.1s desactiva los cifrados EXPORT y LOW ya que son obsoletos y no son considerados seguros. Esta versión de Node.js activa `OPENSSL_NO_WEAK_SSL_CIPHERS` para desactivar completamente los 27 cifrados incluidos en estas listas, los cuales pueden ser utilizados en SSLv3 y superiores. Los detalles completos pueden encontrarse en nuestra discusión de LTS sobre la materia (https://github.com/nodejs/LTS/issues/85). (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5712

### Commits

* [4041ea6bc5] - deps: actualizar npm en LTS a 2.15.1 (Forrest L Norvell)
* [a115779026] - deps: Desactiva cifrados EXPORT y LOW en openssl (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5712
* [ab907eb5a8] - test: saltar cluster-disconnect-race en Windows (Gibson Fahnestock) https://github.com/nodejs/node/pull/5621
* [9c06db7444] - test: cambiar prueba tls para que no utilice cifrado LOW (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5712
* [154098a3dc] - test: corregir bp para est-http-get-pipeline-problem.js (Michael Dawson) https://github.com/nodejs/node/pull/3013
* [ff2bed6e86] - win,build: soportar Visual C++ Build Tools 2015 (João Reis) https://github.com/nodejs/node/pull/5627

<a id="0.12.12"></a>

## 2016-03-08, Versión 0.12.12 (LTS), @rvagg

### Cambios Notables:

* openssl: Remover completamente soporte para SSLv2, el argumento de línea de comando `--enable-ssl2` producirá ahora un error. El ataque DROWN (https://drownattack.com/) crea una vulnerabilidad en la que SSLv2 es habilitado por un servidor, incluso si una conexión de cliente no está utilizando SSLv2. El protocolo SSLv2 es ampliamente considerado como inaceptablemente dañado y no debe ser soportado. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0800

Tenga en cuenta que la actualización a OpenSSL 1.0.1s en Node.js v0.12.11 eliminó el soporte interno de SSLv2. El cambio en esta versión fue originalmente pensado para v0.12.11. El argumento de línea de comando `--enable-ssl2` ahora produce un error en lugar de ser un no-op.

### Commits:

* [dbfc9d9241] - crypto,tls: eliminar soporte a SSLv2 (Ben Noordhuis) https://github.com/nodejs/node/pull/5536

<a id="0.12.11"></a>

## 2016-03-03, Versión 0.12.11 (LTS), @rvagg

### Cambios Notables:

* http_parser: Actualizar a http-parser 2.3.2 para reparar una limitación estricta no intencional de caracteres de cabecera permitidos. (James M Snell) https://github.com/nodejs/node/pull/5241
* dominios:
  - Impedir que se produzca una salida debido a que se arroja una excepción en lugar de emitir un evento 'uncaughtException' en el objeto `process` cuando no se establece ningún manejador de errores en el dominio dentro del cual se arroja un error y se establece un listener del evento 'uncaughtException' en `process`. (Julien Gilli) https://github.com/nodejs/node/pull/3885
  - Corregir un problema en el que el proceso no abortaría en la llamada de función adecuada si se arroja un error dentro de un dominio sin manejador de errores y se utiliza `--abort-on-uncaught-exception`. (Julien Gilli) https://github.com/nodejs/node/pull/3885
* openssl: Actualizar de 1.0.1r a 1.0.1s (Ben Noordhuis) https://github.com/nodejs/node/pull/5509
  - Corregir un defecto de doble libertad en el análisis de claves DSA malformadas que potencialmente pudieran ser utilizadas para ataques DoS o de corrupción de memoria. Es probable que sea muy difícil utilizar este defecto para un ataque práctico y, por lo tanto, es considerado como baja severidad para los usuarios de Node.js. Más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0705
  - Corregir un defecto que puede causar corrupción en la memoria in ciertos casos muy raros relacionados a las funciones internas `BN_hex2bn()` y `BN_dec2bn()`. Se cree que Node.js no está invocando las rutas de código que usan estas funciones, por lo que los ataques prácticos a través de Node.js usando este defecto son _poco probables_ que sucedan. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0797
  - Reparar un defecto que hace sea posible el ataque CacheBleed (https://ssrg.nicta.com.au/projects/TS/cachebleed/). Este defecto permite a los atacantes ejecutar ataques de canal lateral que conducen a la recuperación potencial de claves privadas RSA completas. Sólo afecta a la microarquitectura Sandy Bridge de Intel (y posiblemente a las anteriores) cuando se utiliza hyper-threading. Las microarquitecturas más nuevas, incluyendo la Haswell, no se ven afectadas. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0702

### Commits:

* [1ab6653db9] - build: actualizar logo de Node.js en el instalador OSX (Rod Vagg) https://github.com/nodejs/node/pull/5401
* [fcc64792ae] - child_process: proteger contra la condición de carrera (Rich Trott) https://github.com/nodejs/node/pull/5153
* [6c468df9af] - child_process: corregir pérdida de datos con el evento readable (Brian White) https://github.com/nodejs/node/pull/5037
* [61a22019c2] - deps: actualizar openssl a 1.0.1s (Ben Noordhuis) https://github.com/nodejs/node/pull/5509
* [fa26b13df7] - deps: actualizar a http-parser 2.3.2 (James M Snell) https://github.com/nodejs/node/pull/5241
* [46c8e2165f] - deps: backport 1f8555 from v8's upstream (Trevor Norris) https://github.com/nodejs/node/pull/3945
* [ce58c2c31a] - doc: eliminar descripciones SSLv2 (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5541
* [018e4e0b1a] - domains: reparar manejo de excepciones no capturadas (Julien Gilli) https://github.com/nodejs/node/pull/3885
* [d421e85dc9] - lib: corregir fuga del handle del cluster (Rich Trott) https://github.com/nodejs/node/pull/5152
* [3a48f0022f] - node: fix leaking Context handle (Trevor Norris) https://github.com/nodejs/node/pull/3945
* [28dddabf6a] - src: reparar error de compilación sin soporte de OpenSSL (Jörg Krause) https://github.com/nodejs/node/pull/4201
* [a79baf03cd] - src: utilizar SealHandleScope global (Trevor Norris) https://github.com/nodejs/node/pull/3945
* [be39f30447] - test: agregar de vuelta test-domain-exit-dispose-again (Julien Gilli) https://github.com/nodejs/node/pull/4278
* [da66166b9a] - test: reparar test-domain-exit-dispose-again (Julien Gilli) https://github.com/nodejs/node/pull/3991

<a id="0.12.10"></a>

## 2016-02-09, Versión 0.12.10 (LTS), @jasnell

Esta es una actualización de seguridad importante. Todos los usuarios de Node.js deberían consultar el resumen de la actualización de seguridad en nodejs.org para los detalles de vulnerabilidades parcheadas.

### Cambios notables

* http: reparar defectos en el análisis del encabezado HTTP para solicitudes y respuestas que pueden permitir el contrabando de solicitudes (CVE-2016-2086) o división de respuesta (CVE-2016-2216). El análisis de encabezado HTTP ahora se alinea más de cerca con la especificación HTTP, incluyendo la restricción de caracteres aceptables.
* http-parser: actualizar de 2.3.0 a 2.3.1
* openssl: actualizar de 1.0.1q a 1.0.1r. Para mitigar contra el ataque de Logjam, ahora los clientes TLS rechazan los handshakes de Diffie-Hellman con parámetros más cortos de 1024 bits, por encima del límite previo de 768 bits.
* src:
  - introducir nueva bandera de línea de comando `--security-revert={cvenum}` para reversión selectiva de reparaciones CVE específicas
  - permitir que la corrección para CVE-2016-2216 sea revertida de manera selectiva utilizando `--security-revert=CVE-2016-2216`
* compilación:
  - archivos tar comprimidos en xz serán hechos disponibles desde nodejs.org para compilaciones v.012 desde v0.12.10 en adelante
  - Un archivo header.tar.gz será hecho disponible desde nodejs.org para compilaciones v0.12 desde v0.12.10 en adelante, un cambio futuro a node-gyp será requerido para hacer uso de este

### Commits

* [4312848bff] - build: activar tarballs comprimidos en xz donde sea posible (Rod Vagg) https://github.com/nodejs/node/pull/4894
* [247626245c] - deps: actualizar fuentes openssl a 1.0.1r (Shigeki Ohtsu) https://github.com/joyent/node/pull/25368
* [744c9749fc] - deps: actualizar http-parse a la versión 2.3.1 (James M Snell)
* [d1c56ec7d1] - doc: clarificar ítems notables de v0.12.9 (Rod Vagg) https://github.com/nodejs/node/pull/4154
* [e128d9a5b4] - http: prohibir estrictamente caracteres inválidos desde las cabeceras (James M Snell)
* [bdb9f2cf89] - src: evitar advertencias del compilador en node_revert.cc (James M Snell)
* [23bced1fb3] - src: añadir bandera de línea de comando --security-revert (James M Snell)
* [f41a3c73e7] - tools: backport tools/install.py para los encabezados (Richard Lau) https://github.com/nodejs/node/pull/4149

<a id="0.12.9"></a>

## 2015-12-04, Versión 0.12.9 (LTS), @rvagg

Actualización de Seguridad

### Cambios notables

* http: Reparar CVE-2015-8027, un bug por el que un socket HTTP ya no puede tener un analizador asociado, pero una solicitud pipelined intenta desencadenar una pausa o reanudar en el analizador inexistente, una vulnerabilidad potencial de denegación de servicio. (Fedor Indutny)
* openssl: Actualizar a 1.0.1q, repara CVE-2015-3194 "Fallo de verificación de certificado con parámetro PSS perdido", un potencial vector de denegación de servicio para los servidores TLS de Node.js mediante la autenticación de certificado de cliente; los clientes TLS también son impactados. Hay más detalles disponibles en <http://openssl.org/news/secadv/20151203.txt>. (Ben Noordhuis) https://github.com/nodejs/node/pull/4133

### Commits

* [8d24a14f2c] - deps: actualizar a openssl 1.0.1q (Ben Noordhuis) https://github.com/nodejs/node/pull/4133
* [dfc6f4a9af] - http: reparar regresión de pipeline (Fedor Indutny)

<a id="0.12.8"></a>

## 2015.11.25, Versión 0.12.8 (LTS), @rvagg

* [d9399569bd] - build: backport tools/release.sh (Rod Vagg) https://github.com/nodejs/node/pull/3642
* [78c5b4c8bd] - build: configuración backport para la nueva infraestructura CI (Rod Vagg) https://github.com/nodejs/node/pull/3642
* [83441616a5] - build: reparar error de tiempo de compilación --without-ssl (Ben Noordhuis) https://github.com/nodejs/node/pull/3825
* [8887666b0b] - build: actualizar manifiesto para incluir Windows 10 (Lucien Greathouse) https://github.com/nodejs/node/pull/2843
* [08afe4ec8e] - build: agregar soporte MSVS 2015 (Rod Vagg) https://github.com/nodejs/node/pull/2843
* [4f2456369c] - build: work around VS2015 issue in ICU <56 (Steven R. Loomis) https://github.com/nodejs/node-v0.x-archive/pull/25804
* [15030f26fd] - build: Intl: bump ICU4C from 54 to 55 (backport) (Steven R. Loomis) https://github.com/nodejs/node-v0.x-archive/pull/25856
* [1083fa70f0] - build: regla makefile run-ci (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25653
* [2d2494cf14] - build: soportar pruebas flaky en test-ci (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25653
* [b25d26f2ef] - build: soportar Jenkins a través de test-ci (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25653
* [7e4b47f38a] - build,win: reparar versión de recurso node.exe (João Reis) https://github.com/nodejs/node/pull/3053
* [e07c86e240] - build,win: probar siguiente versión MSVS en caso de falla (João Reis) https://github.com/nodejs/node/pull/2843
* [b5a0abcfdf] - child_process: clonar argumento de opciones de reproducción (cjihrig) https://github.com/nodejs/node-v0.x-archive/pull/9159
* [8b81f98c41] - configure: agregar bandera --without-mdb (cgalibern) https://github.com/nodejs/node-v0.x-archive/pull/25707
* [071c860c2b] - crypto: reemplazar rwlocks con mutexes simples (Ben Noordhuis) https://github.com/nodejs/node/pull/2723
* [ca97fb6be3] - deps: actualizar npm a 2.14.9 (Forrest L Norvell) https://github.com/nodejs/node/pull/3684
* [583734342e] - deps: repara openssl para MSVS 2015 (Andy Polyakov) https://github.com/nodejs/node/pull/2843
* [02c262a4c6] - deps: reparar gyp para trabajar en MacOSX sin XCode (Shigeki Ohtsu) https://github.com/nodejs/node/pull/2843
* [f0fba0bce8] - deps: actualizar gyp a 25ed9ac (João Reis) https://github.com/nodejs/node/pull/2843
* [f693565813] - deps: actualizar a npm 2.13.4 (Kat Marchán) https://github.com/nodejs/node-v0.x-archive/pull/25825
* [618b142679] - deps,v8: reparar compilación en VS2015 (João Reis) https://github.com/nodejs/node/pull/2843
* [49b4f0d54e] - doc: backport README.md (Rod Vagg) https://github.com/nodejs/node/pull/3642
* [2860c53562] - doc: fixed child_process.exec doc (Tyler Anton) https://github.com/nodejs/node-v0.x-archive/pull/14088
* [4a91fa11a3] - doc: Actualizar documentos para os.platform() (George Kotchlamazashvili) https://github.com/nodejs/node-v0.x-archive/pull/25777
* [b03ab02fe8] - doc: Cambiar el enlace para documentos v8 a v8dox.com (Chad Walker) https://github.com/nodejs/node-v0.x-archive/pull/25811
* [1fd8f37efd] - doc: buffer, adding missing backtick (Dyana Rose) https://github.com/nodejs/node-v0.x-archive/pull/25811
* [162d0db3bb] - doc: tls.markdown, ajustar versión de v0.10.30 a v0.10.x (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [eda2560cdc] - doc: refinamiento adicional para evento readable (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [881d9bea01] - doc: aclaración de evento readable (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [b6378f0c75] - doc: stream.unshift does not reset reading state (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [4952e2b4d2] - doc: aclarar Readable._read y Readable.push (fresheneesz) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [14000b97d4] - doc: dos mejoras menores de documento stream (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [6b6bd21497] - doc: Clarified read method with specified size argument. (Philippe Laferriere) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [16f547600a] - doc: Document http.request protocol option (Ville Skyttä) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [618e4ecda9] - doc: añadir una nota sobre readable en el siguiente modo (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [0b165be37b] - doc: reparar envoltura de línea en buffer.markdown (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [70dd13f88d] - doc: agregar aviso de depreciación CleartextStream (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [418cde0765] - doc: mencionar que el modo es ignorado si existe el archivo (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [85bcb281e4] - doc: mejorar descripción de http.abort (James M Snell) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [5ccb429ee8] - doc, comments: Corrección gramatical y ortográfica (Ville Skyttä) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [a24db43101] - docs: aviso de comportamiento de evento emitter (Samuel Mills (Henchman)) https://github.com/nodejs/node-v0.x-archive/pull/25467
* [8cbf7cb021] - docs: events clarify emitter.listener() behavior (Benjamin Steephenson) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [b7229debbe] - docs: Corregir opciones por defecto para fs.createWriteStream() (Chris Neave) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [f0453caea2] - domains: puerto caeb677 de v0.10 a v0.12 (Jeremy Whitlock) https://github.com/nodejs/node-v0.x-archive/pull/25835
* [261fa3620f] - src: fix intermittent SIGSEGV in resolveTxt (Evan Lucas) https://github.com/nodejs/node-v0.x-archive/pull/9300
* [1f7257b02d] - test: marcar test-https-aws-ssl como flaky en linux (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25893
* [cf435d55db] - test: marcar test-signal-unregister como flaky (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25750
* [ceb6a8c131] - test: reparar test-debug-port-from-cmdline (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25748
* [22997731e6] - test: añadir prueba de regresión para #25735 (Fedor Indutny) https://github.com/nodejs/node-v0.x-archive/pull/25739
* [39e05639f4] - test: marcar http-pipeline-flood como flaky en win32 (Julien Gilli) https://github.com/nodejs/node-v0.x-archive/pull/25707
* [78d256e7f5] - test: desmarcar pruebas que ya no son flaky (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25676
* [a9b642cf5b] - test: el runner debería devolver 0 en pruebas flaky (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25653
* [b48639befd] - test: soportar salida de prueba de escritura al archivo (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25653
* [caa16b41d6] - (SEMVER-MINOR) tls: prevent server from using dhe keys < 768 (Michael Dawson) https://github.com/nodejs/node/pull/3890
* [0363cf4a80] - tls: cierre de socket padre también cierra el sock de tls (Devin Nakamura) https://github.com/nodejs/node-v0.x-archive/pull/25642
* [75697112e8] - tls: do not hang without `newSession` handler (Fedor Indutny) https://github.com/nodejs/node-v0.x-archive/pull/25739
* [d998a65058] - tools: pasar constante al logger en lugar de una string (Johan Bergström) https://github.com/nodejs/node-v0.x-archive/pull/25653
* [1982ed6e63] - v8: puerto fbff705 de v0.10 a v0.12 (Jeremy Whitlock) https://github.com/nodejs/node-v0.x-archive/pull/25835
* [44d7054252] - win: reparar acciones personalizadas para WiX anteriores a 3.9 (João Reis) https://github.com/nodejs/node/pull/2843
* [586c4d8b8e] - win: reparar acciones personalizadas en Visual Studio != 2013 (Julien Gilli) https://github.com/nodejs/node/pull/2843
* [14db629497] - win,msi: claves de registro de ruta de instalación correctas (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25640
* [8e80528453] - win,msi: cambiar InstallScope a perMachine (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25640
* [35bbe98401] - Actualizar addons.markdown (Max Deepfield) https://github.com/nodejs/node-v0.x-archive/pull/25885
* [9a6f1ce416] - coma (Julien Valéry) https://github.com/nodejs/node-v0.x-archive/pull/25811
* [d384bf8f84] - Actualizar assert.markdown (daveboivin) https://github.com/nodejs/node-v0.x-archive/pull/25811
* [89b22ccbe1] - Fixed typo (Andrew Murray) https://github.com/nodejs/node-v0.x-archive/pull/25811
* [5ad05af380] - Actualizar util.markdown (Daniel Rentz) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [cb660ab3d3] - Update child_process.markdown, spelling (Jared Fox) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [59c67fe3cd] - documentación actualizada para fs.createReadStream (Michele Caini) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [53b6a615a5] - Actualización de documentación sobre inicialización de Buffer (Sarath) https://github.com/nodejs/node-v0.x-archive/pull/25591
* [b8d47a7b6f] - corregir (Fedor Indutny) https://github.com/nodejs/node-v0.x-archive/pull/25739

<a id="0.12.7"></a>

## 2015-07-09, Versión 0.12.7 (Estable)

### Commits

* [[`0cf9f27703`](https://github.com/nodejs/node/commit/0cf9f27703)] - **deps**: actualizar fuentes de openssl a 1.0.1p [#25654](https://github.com/joyent/node/pull/25654)
* [[`8917e430b8`](https://github.com/nodejs/node/commit/8917e430b8)] - **deps**: actualizar a npm 2.11.3 [#25545](https://github.com/joyent/node/pull/25545)
* [[`88a27a9621`](https://github.com/nodejs/node/commit/88a27a9621)] - **V8**: cherry-pick JitCodeEvent patch from upstream (Ben Noordhuis) [#25589](https://github.com/joyent/node/pull/25589)
* [[`18d413d299`](https://github.com/nodejs/node/commit/18d413d299)] - **win,msi**: crea una carpeta npm en el directorio AppData (Steven Rockarts) [#8838](https://github.com/joyent/node/pull/8838)

<a id="0.12.6"></a>

## 2015-07-03, Versión 0.12.6 (Estable)

### Cambios notables

* **deps**: Reparada una escritura fuera de banda en decodificador utf8. **Esta es una actualización de seguridad importante** ya que se puede usar para provocar la negación de un ataque de servicio.

### Commits

* [[`78b0e30954`](https://github.com/nodejs/node/commit/78b0e30954)] - **deps**: reparar escritura fuera de banda en decodificador utf8 (Fedor Indutny)

<a id="0.12.5"></a>

## 2015-06-22, Versión 0.12.5 (Estable)

### Commits

* [[`456c22f63f`](https://github.com/nodejs/node/commit/456c22f63f)] - **openssl**: actualizar a 1.0.1o (Addressing multiple CVEs) [#25523](https://github.com/joyent/node/pull/25523)
* [[`20d8db1a42`](https://github.com/nodejs/node/commit/20d8db1a42)] - **npm**: actualizar a 2.11.2 [#25517](https://github.com/joyent/node/pull/25517)
* [[`50f961596d`](https://github.com/nodejs/node/commit/50f961596d)] - **uv**: actualizar a 1.6.1 [#25475](https://github.com/joyent/node/pull/25475)
* [[`b81a643f9a`](https://github.com/nodejs/node/commit/b81a643f9a)] - **V8**: evitar interbloqueo cuando el perfilado está activo (Dmitri Melikyan) [#25309](https://github.com/joyent/node/pull/25309)
* [[`9d19dfbfdb`](https://github.com/nodejs/node/commit/9d19dfbfdb)] - **install**: reparar ruta fuente para los encabezados openssl (Oguz Bastemur) [#14089](https://github.com/joyent/node/pull/14089)
* [[`4028669531`](https://github.com/nodejs/node/commit/4028669531)] - **install**: asegurarse que opensslconf.h esté sobreescrito (Oguz Bastemur) [#14089](https://github.com/joyent/node/pull/14089)
* [[`d38e865fce`](https://github.com/nodejs/node/commit/d38e865fce)] - **timers**: reparar el tiempo de espera cuando se añade un temporizador de la callback (Julien Gilli) [#17203](https://github.com/joyent/node/pull/17203)
* [[`e7c84f82c7`](https://github.com/nodejs/node/commit/e7c84f82c7)] - **windows**: transmitir WM_SETTINGCHANGE después de instalar (Mathias Küsel) [#25100](https://github.com/joyent/node/pull/25100)

<a id="0.12.4"></a>

## 2015-05-22, Versión 0.12.4 (Estable)

### Commits

* [[`202c18bbc3`](https://github.com/nodejs/node/commit/202c18bbc3)] - **npm**: actualizar a 2.10.1 [#25364](https://github.com/joyent/node/pull/25364)
* [[`6157697bd5`](https://github.com/nodejs/node/commit/6157697bd5)] - **V8**: revertir eliminación de Array.prototype.values() de v8 (cjihrig) [#25328](https://github.com/joyent/node/pull/25328)
* [[`3122052890`](https://github.com/nodejs/node/commit/3122052890)] - **win**: traer devuelta soporte xp/2k3 (Bert Belder) [#25367](https://github.com/joyent/node/pull/25367)

<a id="0.12.3"></a>

## 2015-05-13, Versión 0.12.3 (Estable)

### Commits

* [[`32166a90cf`](https://github.com/nodejs/node/commit/32166a90cf)] - **V8**: actualizar a 3.28.71.19 [#18206](https://github.com/joyent/node/pull/18206)
* [[`84f1ab6114`](https://github.com/nodejs/node/commit/84f1ab6114)] - **uv**: actualizar a 1.5.0 [#25141](https://github.com/joyent/node/pull/25141)
* [[`03cfbd65fb`](https://github.com/nodejs/node/commit/03cfbd65fb)] - **npm**: actualizar a 2.9.1 [#25289](https://github.com/joyent/node/pull/25289)
* [[`80cdae855f`](https://github.com/nodejs/node/commit/80cdae855f)] - **V8**: don't busy loop in v8 cpu profiler thread (Mike Tunnicliffe) [#25268](https://github.com/joyent/node/pull/25268)
* [[`2a5f4bd7ce`](https://github.com/nodejs/node/commit/2a5f4bd7ce)] - **V8**: reparar problema con dejar enlaces para bucles (adamk) [#23948](https://github.com/joyent/node/pull/23948)
* [[`f0ef597e09`](https://github.com/nodejs/node/commit/f0ef597e09)] - **debugger**: no generar proceso hijo en modo remoto (Jackson Tian) [#14172](https://github.com/joyent/node/pull/14172)
* [[`0e392f3b68`](https://github.com/nodejs/node/commit/0e392f3b68)] - **net**: no establecer V4MAPPED en FreeBSD (Julien Gilli) [#18204](https://github.com/joyent/node/pull/18204)
* [[`101e103e3b`](https://github.com/nodejs/node/commit/101e103e3b)] - **repl**: hacer recuperables los errores 'Unexpected token' (Julien Gilli) [#8875](https://github.com/joyent/node/pull/8875)
* [[`d5b32246fb`](https://github.com/nodejs/node/commit/d5b32246fb)] - **src**: backport ignore ENOTCONN on shutdown race (Ben Noordhuis) [#14480](https://github.com/joyent/node/pull/14480)
* [[`f99eaefe75`](https://github.com/nodejs/node/commit/f99eaefe75)] - **src**: fix backport of SIGINT crash fix on FreeBSD (Julien Gilli) [#14819](https://github.com/joyent/node/pull/14819)

<a id="0.12.2"></a>

## 2015-03-31, Versión 0.12.2 (Estable)

### Commits

* [[`7a37910f25`](https://github.com/nodejs/node/commit/7a37910f25)] - **uv**: Actualizar a 1.4.2 [#9179](https://github.com/joyent/node/pull/9179)
* [[`2704c62933`](https://github.com/nodejs/node/commit/2704c62933)] - **npm**: Actualizar a 2.7.4 [#14180](https://github.com/joyent/node/pull/14180)
* [[`a103712a62`](https://github.com/nodejs/node/commit/a103712a62)] - **V8**: no añadir nueva línea adicional en archivo de registro (Julien Gilli)
* [[`2fc5eeb3da`](https://github.com/nodejs/node/commit/2fc5eeb3da)] - **V8**: reparar desbordamiento de entero --max_old_space_size=4096 (Andrei Sedoi) [#9200](https://github.com/joyent/node/pull/9200)
* [[`605329d7f7`](https://github.com/nodejs/node/commit/605329d7f7)] - **asyncwrap**: reparar condición de constructor para ret adelantado (Trevor Norris) [#9146](https://github.com/joyent/node/pull/9146)
* [[`a33f23cbbc`](https://github.com/nodejs/node/commit/a33f23cbbc)] - **buffer**: alinear trozos en límite de 8 bytes (Fedor Indutny) [#9375](https://github.com/joyent/node/pull/9375)
* [[`a35ba2f67d`](https://github.com/nodejs/node/commit/a35ba2f67d)] - **buffer**: reparar ajuste de offset del pool (Trevor Norris)
* [[`c0766eb1a4`](https://github.com/nodejs/node/commit/c0766eb1a4)] - **build**: reparar uso de alias estrictos (Trevor Norris) [#9179](https://github.com/joyent/node/pull/9179)
* [[`6c3647c38d`](https://github.com/nodejs/node/commit/6c3647c38d)] - **console**: permitir los campos de Object.prototype como etiquetas (Colin Ihrig) [#9116](https://github.com/joyent/node/pull/9116)
* [[`4823afcbe2`](https://github.com/nodejs/node/commit/4823afcbe2)] - **fs**: hacer que F_OK/R_OK/W_OK/X_OK no sea editable (Jackson Tian) [#9060](https://github.com/joyent/node/pull/9060)
* [[`b3aa876f08`](https://github.com/nodejs/node/commit/b3aa876f08)] - **fs**: manejar apropiadamente fd pasado a truncate() (Bruno Jouhier) [#9161](https://github.com/joyent/node/pull/9161)
* [[`d6484f3f7b`](https://github.com/nodejs/node/commit/d6484f3f7b)] - **http**: fix assert on data/end after socket error (Fedor Indutny) [#14087](https://github.com/joyent/node/pull/14087)
* [[`04b63e022a`](https://github.com/nodejs/node/commit/04b63e022a)] - **lib**: reparar verificación de tamaño máximo en constructor de Buffer (Ben Noordhuis) [#657](https://github.com/iojs/io.js/pull/657)
* [[`2411bea0df`](https://github.com/nodejs/node/commit/2411bea0df)] - **lib**: fix stdio/ipc sync i/o regression (Ben Noordhuis) [#9179](https://github.com/joyent/node/pull/9179)
* [[`b8604fa480`](https://github.com/nodejs/node/commit/b8604fa480)] - **module**: reemplazar NativeModule.require (Herbert Vojčík) [#9201](https://github.com/joyent/node/pull/9201)
* [[`1a2a4dac23`](https://github.com/nodejs/node/commit/1a2a4dac23)] - **net**: permitir puerto 0 en connect() (cjihrig) [#9268](https://github.com/joyent/node/pull/9268)
* [[`bada87bd66`](https://github.com/nodejs/node/commit/bada87bd66)] - **net**: unref timer in parent sockets (Fedor Indutny) [#891](https://github.com/iojs/io.js/pull/891)
* [[`c66f8c21f0`](https://github.com/nodejs/node/commit/c66f8c21f0)] - **path**: refactorizar para rendimiento y consistencia (Nathan Woltman) [#9289](https://github.com/joyent/node/pull/9289)
* [[`9deade4322`](https://github.com/nodejs/node/commit/9deade4322)] - **smalloc**: extender API de usuario (Trevor Norris) [#905](https://github.com/iojs/io.js/pull/905)
* [[`61fe1fe21b`](https://github.com/nodejs/node/commit/61fe1fe21b)] - **src**: reparar colapso de SIGINT en FreeBSD (Fedor Indutny) [#14184](https://github.com/joyent/node/pull/14184)
* [[`b233131901`](https://github.com/nodejs/node/commit/b233131901)] - **src**: fix builtin modules failing with --use-strict (Julien Gilli) [#9237](https://github.com/joyent/node/pull/9237)
* [[`7e9d2f8de8`](https://github.com/nodejs/node/commit/7e9d2f8de8)] - **watchdog**: fix timeout for early polling return (Saúl Ibarra Corretgé) [#9410](https://github.com/joyent/node/pull/9410)

<a id="0.12.1"></a>

## 2015-03-23, Versión 0.12.1 (Estable)

### Commits

* [[`3b511a8ccd`](https://github.com/nodejs/node/commit/3b511a8ccd)] - **openssl**: actualizar a 1.0.1m (Addressing multiple CVES)

<a id="0.12.0"></a>

## 2015-02-06, Versión 0.12.0 (Estable)

### Commits

* [[`087a7519ce`](https://github.com/nodejs/node/commit/087a7519ce)] - **npm**: Actualizar a 2.5.1
* [[`4312f8d760`](https://github.com/nodejs/node/commit/4312f8d760)] - **mdb_v8**: actualizar para v0.12 (Dave Pacheco)
