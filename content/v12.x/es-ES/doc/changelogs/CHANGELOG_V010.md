# Node.js 0.10 ChangeLog

<!--lint disable prohibited-strings-->
<!--lint disable maximum-line-length-->

<table>
<tr>
<th colspan="2">Estable</th>
</tr>
<tr>
<td valign="top">
<a href="#0.10.48">0.10.48</a><br/>
<a href="#0.10.47">0.10.47</a><br/>
<a href="#0.10.46">0.10.46</a><br/>
<a href="#0.10.45">0.10.45</a><br/>
<a href="#0.10.44">0.10.44</a><br/>
<a href="#0.10.43">0.10.43</a><br/>
<a href="#0.10.42">0.10.42</a><br/>
<a href="#0.10.41">0.10.41</a><br/>
<a href="#0.10.40">0.10.40</a><br/>
<a href="#0.10.39">0.10.39</a><br/>
<a href="#0.10.38">0.10.38</a><br/>
<a href="#0.10.37">0.10.37</a><br/>
<a href="#0.10.36">0.10.36</a><br/>
<a href="#0.10.35">0.10.35</a><br/>
<a href="#0.10.34">0.10.34</a><br/>
<a href="#0.10.33">0.10.33</a><br/>
<a href="#0.10.32">0.10.32</a><br/>
<a href="#0.10.31">0.10.31</a><br/>
<a href="#0.10.30">0.10.30</a><br/>
<a href="#0.10.29">0.10.29</a><br/>
<a href="#0.10.28">0.10.28</a><br/>
<a href="#0.10.27">0.10.27</a><br/>
<a href="#0.10.26">0.10.26</a><br/>
<a href="#0.10.25">0.10.25</a><br/>
<a href="#0.10.24">0.10.24</a><br/>
<a href="#0.10.23">0.10.23</a><br/>
</td>
<td valign="top">
<a href="#0.10.22">0.10.22</a><br/>
<a href="#0.10.21">0.10.21</a><br/>
<a href="#0.10.20">0.10.20</a><br/>
<a href="#0.10.19">0.10.19</a><br/>
<a href="#0.10.18">0.10.18</a><br/>
<a href="#0.10.17">0.10.17</a><br/>
<a href="#0.10.16">0.10.16</a><br/>
<a href="#0.10.15">0.10.15</a><br/>
<a href="#0.10.14">0.10.14</a><br/>
<a href="#0.10.13">0.10.13</a><br/>
<a href="#0.10.12">0.10.12</a><br/>
<a href="#0.10.11">0.10.11</a><br/>
<a href="#0.10.10">0.10.10</a><br/>
<a href="#0.10.9">0.10.9</a><br/>
<a href="#0.10.8">0.10.8</a><br/>
<a href="#0.10.7">0.10.7</a><br/>
<a href="#0.10.6">0.10.6</a><br/>
<a href="#0.10.5">0.10.5</a><br/>
<a href="#0.10.4">0.10.4</a><br/>
<a href="#0.10.3">0.10.3</a><br/>
<a href="#0.10.2">0.10.2</a><br/>
<a href="#0.10.1">0.10.1</a><br/>
<a href="#0.10.0">0.10.0</a><br/>
</td>
</tr>
</table>

* Otras versiones
  * [12.x](CHANGELOG_V12.md)
  * [11.x](CHANGELOG_V11.md)
  * [10.x](CHANGELOG_V10.md)
  * [9.x](CHANGELOG_V9.md)
  * [8.x](CHANGELOG_V8.md)
  * [7.x](CHANGELOG_V7.md)
  * [6.x](CHANGELOG_V6.md)
  * [5.x](CHANGELOG_V5.md)
  * [4.x](CHANGELOG_V4.md)
  * [0.12.x](CHANGELOG_V012.md)
  * [io.js](CHANGELOG_IOJS.md)
  * [Archivo](CHANGELOG_ARCHIVE.md)

*Note*: Node.js v0.10 is covered by the [Node.js Long Term Support Plan](https://github.com/nodejs/LTS) and will be maintained until October 2016.

<a id="0.10.48"></a>

## 2016-10-18, Version 0.10.48 (Maintenance), @rvagg

Esta es una actualización de seguridad. Todos los usuarios de Node.js deberían consultar el resumen de la actualización de seguridad en https://nodejs.org/en/blog/vulnerability/october-2016-security-releases/ para más detalles sobre vulnerabilidades parcheadas.

### Cambios notables

* c-ares: fix for single-byte buffer overwrite, CVE-2016-5180, more information at https://c-ares.haxx.se/adv_20160929.html (Rod Vagg)

### Commits

* [[`a14a6a3a11`](https://github.com/nodejs/node/commit/a14a6a3a11)] - deps: c-ares, avoid single-byte buffer overwrite (Rod Vagg) https://github.com/nodejs/node/pull/9108
* [[`b798f598af`](https://github.com/nodejs/node/commit/b798f598af)] - tls: fix minor jslint failure (Rod Vagg) https://github.com/nodejs/node/pull/9107
* [[`92b232ba01`](https://github.com/nodejs/node/commit/92b232ba01)] - win,build: try multiple timeservers when signing (Rod Vagg) https://github.com/nodejs/node/pull/9155

<a id="0.10.47"></a>

## 2016-09-27, Version 0.10.47 (Maintenance), @rvagg

Esta es una actualización de seguridad. Todos los usuarios de Node.js deberían consultar el resumen de la actualización de seguridad en https://nodejs.org/en/blog/vulnerability/september-2016-security releases/ para más detalles sobre vulnerabilidades parcheadas.

### Cambios Notables:

* buffer: Zero-fill excess bytes in new `Buffer` objects created with `Buffer.concat()` while providing a `totalLength` parameter that exceeds the total length of the original `Buffer` objects being concatenated. (Сковорода Никита Андреевич)
* http:
  * CVE-2016-5325 - Properly validate for allowable characters in the `reason` argument in `ServerResponse#writeHead()`. Arregla un posible vector de ataque de división de respuesta. Esto introduce un nuevo caso donde `throw` puede ocurrir cuando se configuran respuestas de HTTP, los usuarios deberían estar ya adoptando try/catch aquí. Originalmente reportado por Evan Lucas y Romain Gaucher. (Evan Lucas)
  * Los códigos de estatus inválidos no pueden ser enviados. Limited to 3 digit numbers between 100 - 999. Lack of proper validation may also serve as a potential response splitting attack vector. Backported from v4.x. (Brian White)
* openssl: Upgrade to 1.0.1u, fixes a number of defects impacting Node.js: CVE-2016-6304 ("OCSP Status Request extension unbounded memory growth", high severity), CVE-2016-2183, CVE-2016-2183, CVE-2016-2178 and CVE-2016-6306.
* tls: CVE-2016-7099 - Fix invalid wildcard certificate validation check whereby a TLS server may be able to serve an invalid wildcard certificate for its hostname due to improper validation of `*.` in the wildcard string. Originally reported by Alexander Minozhenko and James Bunton (Atlassian) (Ben Noordhuis)

### Commits:

* [[`fc259c7dc4`](https://github.com/nodejs/node/commit/fc259c7dc4)] - buffer: zero-fill uninitialized bytes in .concat() (Сковорода Никита Андреевич) https://github.com/nodejs/node-private/pull/67
* [[`35b49ed4bb`](https://github.com/nodejs/node/commit/35b49ed4bb)] - build: turn on -fno-delete-null-pointer-checks (Ben Noordhuis) https://github.com/nodejs/node/pull/6738
* [[`03f4920d6a`](https://github.com/nodejs/node/commit/03f4920d6a)] - crypto: don't build hardware engines (Rod Vagg) https://github.com/nodejs/node-private/pull/68
* [[`1cbdb1957d`](https://github.com/nodejs/node/commit/1cbdb1957d)] - deps: add -no_rand_screen to openssl s_client (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25368
* [[`c66408cd0c`](https://github.com/nodejs/node/commit/c66408cd0c)] - deps: fix openssl assembly error on ia32 win32 (Fedor Indutny) https://github.com/nodejs/node-v0.x-archive/pull/25654
* [[`68f88ea792`](https://github.com/nodejs/node/commit/68f88ea792)] - deps: separate sha256/sha512-x86_64.pl for openssl (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25654
* [[`884d50b348`](https://github.com/nodejs/node/commit/884d50b348)] - deps: copy all openssl header files to include dir (Shigeki Ohtsu) https://github.com/nodejs/node/pull/8718
* [[`bfd6cb5699`](https://github.com/nodejs/node/commit/bfd6cb5699)] - deps: upgrade openssl sources to 1.0.1u (Shigeki Ohtsu) https://github.com/nodejs/node/pull/8718
* [[`3614a173d0`](https://github.com/nodejs/node/commit/3614a173d0)] - http: check reason chars in writeHead (Evan Lucas) https://github.com/nodejs/node-private/pull/48
* [[`f2433430ca`](https://github.com/nodejs/node/commit/f2433430ca)] - http: disallow sending obviously invalid status codes (Evan Lucas) https://github.com/nodejs/node-private/pull/48
* [[`0d7e21ee7b`](https://github.com/nodejs/node/commit/0d7e21ee7b)] - lib: make tls.checkServerIdentity() more strict (Ben Noordhuis) https://github.com/nodejs/node-private/pull/62
* [[`1f4a6f5bd1`](https://github.com/nodejs/node/commit/1f4a6f5bd1)] - openssl: fix keypress requirement in apps on win32 (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25654
* [[`88dcc7f5bb`](https://github.com/nodejs/node/commit/88dcc7f5bb)] - v8: fix -Wsign-compare warning in Zone::New() (Ben Noordhuis) https://github.com/nodejs/node-private/pull/62
* [[`fd8ac56c75`](https://github.com/nodejs/node/commit/fd8ac56c75)] - v8: fix build errors with g++ 6.1.1 (Ben Noordhuis) https://github.com/nodejs/node-private/pull/62

<a id="0.10.46"></a>

## 2016-06-23, Version 0.10.46 (Maintenance), @rvagg

### Cambios Notables:

Esta es una actualización de seguridad. All Node.js users should consult the security release summary at https://nodejs.org/en/blog/vulnerability/june-2016-security-releases/ for details on patched vulnerabilities.

* libuv: (CVE-2014-9748) Fixes a bug in the read/write locks implementation for Windows XP and Windows 2003 that can lead to undefined and potentially unsafe behaviour. More information can be found at https://github.com/libuv/libuv/issues/515 or at https://nodejs.org/en/blog/vulnerability/june-2016-security-releases/.
* V8: (CVE-2016-1669) Fixes a potential Buffer overflow vulnerability discovered in V8, more details can be found in the CVE at https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2016-1669 or at https://nodejs.org/en/blog/vulnerability/june-2016-security-releases/.

### Commits:

* [[`3374f57973`](https://github.com/nodejs/node/commit/3374f57973)] - deps: update libuv to 0.10.37 (Saúl Ibarra Corretgé) https://github.com/nodejs/node/pull/7293
* [[`fcb9145e29`](https://github.com/nodejs/node/commit/fcb9145e29)] - deps: backport 3a9bfec from v8 upstream (Myles Borins) https://github.com/nodejs/node-private/pull/43

<a id="0.10.45"></a>

## 2016-05-06, Version 0.10.45 (Mantenimiento), @rvagg

### Cambios Notables:

* npm: Corregir números de versiones erróneas en códigos de v2.15.1(Forrest L Norvell) https://github.com/nodejs/node/pull/5987
* openssl: Actualizar a v1.0.1t, abordando las vulnerabilidades de seguridad (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
  * Repara CVE-2016-2107 "Oráculo de relleno en la verificación AES-NI CBC MAC"
  * Vea https://nodejs.org/en/blog/vulnerability/openssl-may-2016/ para los detalles completos

### Commits:

* [[`3cff81c7d6`](https://github.com/nodejs/node/commit/3cff81c7d6)] - deps: completely upgrade npm in LTS to 2.15.1 (Forrest L Norvell) https://github.com/nodejs/node/pull/5987
* [[`7c22f19009`](https://github.com/nodejs/node/commit/7c22f19009)] - deps: add -no_rand_screen to openssl s_client (Shigeki Ohtsu) https://github.com/joyent/node/pull/25368
* [[`5d78366937`](https://github.com/nodejs/node/commit/5d78366937)] - deps: update openssl asm files (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
* [[`2bc2427cb7`](https://github.com/nodejs/node/commit/2bc2427cb7)] - deps: fix openssl assembly error on ia32 win32 (Fedor Indutny) https://github.com/joyent/node/pull/25654
* [[`8df4b0914c`](https://github.com/nodejs/node/commit/8df4b0914c)] - deps: separate sha256/sha512-x86_64.pl for openssl (Shigeki Ohtsu) https://github.com/joyent/node/pull/25654
* [[`11eefefb17`](https://github.com/nodejs/node/commit/11eefefb17)] - deps: copy all openssl header files to include dir (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
* [[`61ccc27b54`](https://github.com/nodejs/node/commit/61ccc27b54)] - deps: upgrade openssl sources to 1.0.1t (Shigeki Ohtsu) https://github.com/nodejs/node/pull/6553
* [[`aa02438274`](https://github.com/nodejs/node/commit/aa02438274)] - openssl: fix keypress requirement in apps on win32 (Shigeki Ohtsu) https://github.com/joyent/node/pull/25654

<a id="0.10.44"></a>

## 2016-03-31, Versión 0.10.44 (Mantenimiento), @rvagg

### Cambios notables

* npm: Actualizar a v2.15.1. Corrige una falla de seguridad en el uso de tokens de autenticación en solicitudes HTTP que permitirían a un atacante configurar un servidor que pudiera recoger todos los tokens de los usurarios de la interfaz de línea-comando. Los tokens de autenticación se han sido enviados previamente con cada solicitud hecha por el CLI para los usuarios logueados, sin importar el destino de la solicitud. Esta actualización repara esto al incluir solamente esos tokens para las solicitudes hechas contra el registro o los registros utilizados para la instalación actual. IMPORTANTE: Esta es una actualización importante para npm v2 LTS del npm v1 anterior ya obsoleto. (Forrest L Norvell) https://github.com/nodejs/node/pull/5967
* openssl: OpenSSL v1.0.1s deshabilita los cifrados EXPORT y LOW ya que son obsoletos y no se consideran seguros. Esta versión de Node.js activa ` OPENSSL_NO_WEAK_SSL_CIPHERS ` para deshabilitar completamente los 27 cifrados incluidos en estas listas que pueden ser usados en SSLv3 y superiores. Los detalles completos sobre el asunto pueden ser encontrardos en nuestra discusión de LTS (https://github.com/nodejs/LTS/issues/85). (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5712

### Commits

* [[`feceb77d7e`](https://github.com/nodejs/node/commit/feceb77d7e)] - deps: upgrade npm in LTS to 2.15.1 (Forrest L Norvell) https://github.com/nodejs/node/pull/5968
* [[`0847954331`](https://github.com/nodejs/node/commit/0847954331)] - deps: Disable EXPORT and LOW ciphers in openssl (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5712
* [[`6bb86e727a`](https://github.com/nodejs/node/commit/6bb86e727a)] - test: change tls tests not to use LOW cipher (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5712
* [[`905bec29ad`](https://github.com/nodejs/node/commit/905bec29ad)] - win,build: support Visual C++ Build Tools 2015 (João Reis) https://github.com/nodejs/node/pull/5627

<a id="0.10.43"></a>

## 2016-03-04, Versión 0.10.43 (Mantenimiento), @rvagg

### Cambios Notables:

* http_parser: Actualizar a http-parser 1.2 para reparar una limitación estricta no intencional de caracteres de cabecera permitidos. (James M Snell) https://github.com/nodejs/node/pull/5242
* dominio:
  * Previene una salida debido a que se arroja una excepción en vez de emitir un evento ` 'uncaughtException' ` en el objeto` process ` cuando ningún manejador de errores es establecido en el dominio donde se arroja un error, y un listener del evento ` 'uncaughtException' ` es establecido en ` process `. (Julien Gilli) https://github.com/nodejs/node/pull/3887
  * Repara un problema donde el proceso no abortaría en la llamada de función adecuada si se arroja un error dentro del dominio sin un manejador de errores y se utiliza ` --abort-on-uncught-exception `. (Julien Gilli) https://github.com/nodejs/node/pull/3887
* openssl: Actualizar de 1.0.1r a 1.0.1s (Ben Noordhuis) https://github.com/nodejs/node/pull/5508
  * Repara un defecto doble-libre en el análisis de claves DSA malformadas que potencialmente pudieran ser usadas para los ataques DoS o de corrupción de memoria. Es probable que sea muy difícil usar este defecto para un ataque práctico y es por lo tanto considerado como una severidad baja para usuarios de Node.js. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0705
  * Repara un defecto que puede causar corrupción en la memoria en ciertos casos muy raros relacionados con las funciones internas `BN_hex2bn()` and `BN_dec2bn()`. It is believed that Node.js is not invoking the code paths that use these functions so practical attacks via Node.js using this defect are _unlikely_ to be possible. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0797
  * Arreglar un defecto que hace que el ataque CacheBleed (https://ssrg.nicta.com.au/projects/TS/cachebleed/) sea posible. Este defecto permite a los atacantes ejecutar ataques de canales laterales conduciendo a la recuperación potencial de todas las claves privadas RSA. Solo afecta a la microarquitectura de los Sandy Bridge de Intel (y posiblemente más viejos) cuando se usa hyper-threading. Las microarquitecturas más nuevas, incluyendo la Haswell, no se ven afectadas. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0702
  * Eliminar el soporte de SSLv2, el argumento de la línea de comando `--enable-ssl2` ahora producirá un error. El ataque DROWN (https://drownattack.com/) crea una vulnerabilidad en la cual SSLv2 es habilitado por un servidor, incluso si una conexión al cliente no está usando SSLv2. El protocolo SSLv2 es ampliamente considerado como inaceptablemente roto y no debería ser soportado. Hay más información disponible en https://www.openssl.org/news/vulnerabilities.html#2016-0800

### Commits:

* [[`164157abbb`](https://github.com/nodejs/node/commit/164157abbb)] - build: update Node.js logo on OSX installer (Rod Vagg) https://github.com/nodejs/node/pull/5401
* [[`f8cb0dcf67`](https://github.com/nodejs/node/commit/f8cb0dcf67)] - crypto,tls: remove SSLv2 support (Ben Noordhuis) https://github.com/nodejs/node/pull/5529
* [[`42ded2a590`](https://github.com/nodejs/node/commit/42ded2a590)] - deps: upgrade openssl to 1.0.1s (Ben Noordhuis) https://github.com/nodejs/node/pull/5508
* [[`1e45a6111c`](https://github.com/nodejs/node/commit/1e45a6111c)] - deps: update http-parser to version 1.2 (James M Snell) https://github.com/nodejs/node/pull/5242
* [[`6db377b2f4`](https://github.com/nodejs/node/commit/6db377b2f4)] - doc: remove SSLv2 descriptions (Shigeki Ohtsu) https://github.com/nodejs/node/pull/5541
* [[`563c359f5c`](https://github.com/nodejs/node/commit/563c359f5c)] - domains: fix handling of uncaught exceptions (Julien Gilli) https://github.com/nodejs/node/pull/3887
* [[`e483f3fd26`](https://github.com/nodejs/node/commit/e483f3fd26)] - test: fix hanging http obstext test (Ben Noordhuis) https://github.com/nodejs/node/pull/5511

<a id="0.10.42"></a>

## 2016-02-09, Versión 0.10.42 (Mantenimiento), @jasnell

Esta es una actualización de seguridad importante. Todos los usuarios de Node.js deberían consultar el resumen de la actualización de seguridad en nodejs.org para los detalles de vulnerabilidades parcheadas.

### Cambios notables

* http: arreglar los defectos en el análisis de cabeceras HTTP para solicitudes y respuestas que puedan permitir el contrabando de solicitudes (CVE-2016-2086) o la división de respuestas (CVE-2016-2216). El análisis de cabeceras HTTP ahora se alinea más cerca con la especificación HTTP, incluyendo la restricción de caracteres aceptables.
* http-parser: actualizar de 1.0 a 1.1
* openssl: actualizar de 1.0.1q a 1.0.1r. Para mitigar los ataques Logjam, los clientes TLS ahora reflejan el establecimiento de comunicación Diffie-Hellman con parámetros más cortos que 1024-bits, mejorado del límite previo de 768-bits.
* src:
  * introducir una nueva bandera de línea de comando `--security-revert={cvenum}` para reversión selectiva de reparaciones CVE específicas
  * permitir la corrección para que CVE-2016-2216 sea revertida selectivamente usando `--security-revert=CVE-2016-2216`
* build:
  * los archivos tar xz comprimidos serán estarán disponibles desde nodejs.org para compilaciones v0.10 desde v0.10.42 en adelante
  * Un archivo headers.tar.gz estará disponible desde nodejs.org para compilaciones v0.10 desde v0.10.42 en adelante, un cambio futuro a node-gyp será requerido para hacer uso de este

### Commits

* [[`fdc332183e`](https://github.com/nodejs/node/commit/fdc332183e)] - build: enable xz compressed tarballs where possible (Rod Vagg) https://github.com/nodejs/node/pull/4894
* [[`2d35b421b5`](https://github.com/nodejs/node/commit/2d35b421b5)] - deps: upgrade openssl sources to 1.0.1r (Shigeki Ohtsu) https://github.com/joyent/node/pull/25368
* [[`b31c0f3ea4`](https://github.com/nodejs/node/commit/b31c0f3ea4)] - deps: update http-parser to version 1.1 (James M Snell)
* [[`616ec1d6b0`](https://github.com/nodejs/node/commit/616ec1d6b0)] - doc: clarify v0.10.41 openssl tls security impact (Rod Vagg) https://github.com/nodejs/node/pull/4153
* [[`ccb3c2377c`](https://github.com/nodejs/node/commit/ccb3c2377c)] - http: strictly forbid invalid characters from headers (James M Snell)
* [[`f0af0d1f96`](https://github.com/nodejs/node/commit/f0af0d1f96)] - src: avoid compiler warning in node_revert.cc (James M Snell)
* [[`df80e856c6`](https://github.com/nodejs/node/commit/df80e856c6)] - src: add --security-revert command line flag (James M Snell)
* [[`ff58dcdd74`](https://github.com/nodejs/node/commit/ff58dcdd74)] - tools: backport tools/install.py for headers (Richard Lau) https://github.com/nodejs/node/pull/4149

<a id="0.10.41"></a>

## 2015-12-04, Versión 0.10.41 (Mantenimiento), @rvagg

Actualización de Seguridad

### Cambios notables

* build: Añadir soporte para Microsoft Visual Studio 2015
* npm: Actualizar a v1.4.29 desde v1.4.28. Un lanzamiento de una sola ocasión como parte de la estrategia para obtener una versión de npm en Node.js v0.10.x que funcione con el registro actual (https://github.com/nodejs/LTS/issues/37). Esta versión de npm imprime un aviso cada vez que se ejecuta. El aviso advierte que el siguiente lanzamiento estándar de Node.js v0.10.x va tener una versión npm v2.
* openssl: Actualizar a 1.0.1q, contiene reparaciones CVE-2015-3194 "Falló la verificación de certificado, falta parámetro PSS", un vector potencial de negación-de-servicio para servidores TLS de Node.js que utilizan autenticación de certificados de cliente; los clientes TLS también son afectados. Details are available at <http://openssl.org/news/secadv/20151203.txt>. (Ben Noordhuis) https://github.com/nodejs/node/pull/4133

### Commits

* [[`16ca0779f5`](https://github.com/nodejs/node/commit/16ca0779f5)] - src/node.cc: fix build error without OpenSSL support (Jörg Krause) https://github.com/nodejs/node-v0.x-archive/pull/25862
* [[`c559c7911d`](https://github.com/nodejs/node/commit/c559c7911d)] - build: backport tools/release.sh (Rod Vagg) https://github.com/nodejs/node/pull/3965
* [[`268d2b4637`](https://github.com/nodejs/node/commit/268d2b4637)] - build: backport config for new CI infrastructure (Rod Vagg) https://github.com/nodejs/node/pull/3965
* [[`c88a0b26da`](https://github.com/nodejs/node/commit/c88a0b26da)] - build: update manifest to include Windows 10 (Lucien Greathouse) https://github.com/nodejs/node/pull/2838
* [[`8564a9f5f7`](https://github.com/nodejs/node/commit/8564a9f5f7)] - build: gcc version detection on openSUSE Tumbleweed (Henrique Aparecido Lavezzo) https://github.com/nodejs/node-v0.x-archive/pull/25671
* [[`9c7bd6de56`](https://github.com/nodejs/node/commit/9c7bd6de56)] - build: run-ci makefile rule (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`ffa1e1f31d`](https://github.com/nodejs/node/commit/ffa1e1f31d)] - build: support flaky tests in test-ci (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`100dd19e61`](https://github.com/nodejs/node/commit/100dd19e61)] - build: support Jenkins via test-ci (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`ec861f6f90`](https://github.com/nodejs/node/commit/ec861f6f90)] - build: make release process easier for multi users (Julien Gilli) https://github.com/nodejs/node-v0.x-archive/pull/25638
* [[`d7ae79a452`](https://github.com/nodejs/node/commit/d7ae79a452)] - build,win: fix node.exe resource version (João Reis) https://github.com/nodejs/node/pull/3053
* [[`6ac47aa9f5`](https://github.com/nodejs/node/commit/6ac47aa9f5)] - build,win: try next MSVS version on failure (João Reis) https://github.com/nodejs/node/pull/2910
* [[`e669b27740`](https://github.com/nodejs/node/commit/e669b27740)] - crypto: replace rwlocks with simple mutexes (Ben Noordhuis) https://github.com/nodejs/node/pull/2723
* [[`ce0a48826e`](https://github.com/nodejs/node/commit/ce0a48826e)] - deps: upgrade to openssl 1.0.1q (Ben Noordhuis) https://github.com/nodejs/node/pull/4132
* [[`b68781e500`](https://github.com/nodejs/node/commit/b68781e500)] - deps: upgrade npm to 1.4.29 (Forrest L Norvell) https://github.com/nodejs/node/pull/3639
* [[`7cf0d9c1d9`](https://github.com/nodejs/node/commit/7cf0d9c1d9)] - deps: fix openssl for MSVS 2015 (Andy Polyakov) https://github.com/nodejs/node-v0.x-archive/pull/25857
* [[`9ee8a14f9e`](https://github.com/nodejs/node/commit/9ee8a14f9e)] - deps: fix gyp to work on MacOSX without XCode (Shigeki Ohtsu) https://github.com/nodejs/node-v0.x-archive/pull/25857
* [[`a525c7244e`](https://github.com/nodejs/node/commit/a525c7244e)] - deps: update gyp to 25ed9ac (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25857
* [[`6502160294`](https://github.com/nodejs/node/commit/6502160294)] - dns: allow v8 to optimize lookup() (Brian White) https://github.com/nodejs/node-v0.x-archive/pull/8942
* [[`5d829a63ab`](https://github.com/nodejs/node/commit/5d829a63ab)] - doc: backport README.md (Rod Vagg) https://github.com/nodejs/node/pull/3965
* [[`62c8948109`](https://github.com/nodejs/node/commit/62c8948109)] - doc: fix Folders as Modules omission of index.json (Elan Shanker) https://github.com/nodejs/node-v0.x-archive/pull/8868
* [[`572663f303`](https://github.com/nodejs/node/commit/572663f303)] - https: don't overwrite servername option (skenqbx) https://github.com/nodejs/node-v0.x-archive/pull/9368
* [[`75c84b2439`](https://github.com/nodejs/node/commit/75c84b2439)] - test: add test for https agent servername option (skenqbx) https://github.com/nodejs/node-v0.x-archive/pull/9368
* [[`841a6dd264`](https://github.com/nodejs/node/commit/841a6dd264)] - test: mark more tests as flaky (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25807
* [[`a7fee30da1`](https://github.com/nodejs/node/commit/a7fee30da1)] - test: mark test-tls-securepair-server as flaky (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25807
* [[`7df57703dd`](https://github.com/nodejs/node/commit/7df57703dd)] - test: mark test-net-error-twice flaky on SmartOS (Julien Gilli) https://github.com/nodejs/node-v0.x-archive/pull/25760
* [[`e10892cccc`](https://github.com/nodejs/node/commit/e10892cccc)] - test: make test-abort-fatal-error non flaky (Julien Gilli) https://github.com/nodejs/node-v0.x-archive/pull/25755
* [[`a2f879f197`](https://github.com/nodejs/node/commit/a2f879f197)] - test: mark recently failing tests as flaky (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`e7010bdf92`](https://github.com/nodejs/node/commit/e7010bdf92)] - test: runner should return 0 on flaky tests (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`c283c9bbb3`](https://github.com/nodejs/node/commit/c283c9bbb3)] - test: support writing test output to file (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`eeaed586bb`](https://github.com/nodejs/node/commit/eeaed586bb)] - test: runner support for flaky tests (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`3bb8174b94`](https://github.com/nodejs/node/commit/3bb8174b94)] - test: refactor to use common testcfg (Timothy J Fontaine) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`df59d43586`](https://github.com/nodejs/node/commit/df59d43586)] - tools: pass constant to logger instead of string (Johan Bergström) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`d103d4ed9a`](https://github.com/nodejs/node/commit/d103d4ed9a)] - tools: fix test.py after v8 upgrade (Ben Noordhuis) https://github.com/nodejs/node-v0.x-archive/pull/25686
* [[`8002192b4e`](https://github.com/nodejs/node/commit/8002192b4e)] - win: manifest node.exe for Windows 8.1 (Alexis Campailla) https://github.com/nodejs/node/pull/2838
* [[`66ec1dae8f`](https://github.com/nodejs/node/commit/66ec1dae8f)] - win: add MSVS 2015 support (Rod Vagg) https://github.com/nodejs/node-v0.x-archive/pull/25857
* [[`e192f61514`](https://github.com/nodejs/node/commit/e192f61514)] - win: fix custom actions for WiX older than 3.9 (João Reis) https://github.com/nodejs/node-v0.x-archive/pull/25569
* [[`16bcd68dc5`](https://github.com/nodejs/node/commit/16bcd68dc5)] - win: fix custom actions on Visual Studio != 2013 (Julien Gilli) https://github.com/nodejs/node-v0.x-archive/pull/25569
* [[`517986c2f4`](https://github.com/nodejs/node/commit/517986c2f4)] - win: backport bringing back xp/2k3 support (Bert Belder) https://github.com/nodejs/node-v0.x-archive/pull/25569
* [[`10f251e8dd`](https://github.com/nodejs/node/commit/10f251e8dd)] - win: backport set env before generating projects (Alexis Campailla) https://github.com/nodejs/node-v0.x-archive/pull/25569

<a id="0.10.40"></a>

## 2015-07-09, Versión 0.10.40 (Mantenimiento)

### Commits

* [[`0cf9f27703`](https://github.com/nodejs/node/commit/0cf9f27703)] - **openssl**: upgrade to 1.0.1p [#25654](https://github.com/joyent/node/pull/25654)
* [[`5a60e0d904`](https://github.com/nodejs/node/commit/5a60e0d904)] - **V8**: back-port JitCodeEvent patch from upstream (Ben Noordhuis) [#25588](https://github.com/joyent/node/pull/25588)
* [[`18d413d299`](https://github.com/nodejs/node/commit/18d413d299)] - **win,msi**: create npm folder in AppData directory (Steven Rockarts) [#8838](https://github.com/joyent/node/pull/8838)

<a id="0.10.39"></a>

## 2015-06-18, Versión 0.10.39 (Mantenimiento)

### Commits

* [[`456c22f63f`](https://github.com/nodejs/node/commit/456c22f63f)] - **openssl**: upgrade to 1.0.1o (Addressing multiple CVEs) [#25523](https://github.com/joyent/node/pull/25523)
* [[`9d19dfbfdb`](https://github.com/nodejs/node/commit/9d19dfbfdb)] - **install**: fix source path for openssl headers (Oguz Bastemur) [#14089](https://github.com/joyent/node/pull/14089)
* [[`4028669531`](https://github.com/nodejs/node/commit/4028669531)] - **install**: make sure opensslconf.h is overwritten (Oguz Bastemur) [#14089](https://github.com/joyent/node/pull/14089)
* [[`d38e865fce`](https://github.com/nodejs/node/commit/d38e865fce)] - **timers**: fix timeout when added in timer's callback (Julien Gilli) [#17203](https://github.com/joyent/node/pull/17203)
* [[`e7c84f82c7`](https://github.com/nodejs/node/commit/e7c84f82c7)] - **windows**: broadcast WM_SETTINGCHANGE after install (Mathias Küsel) [#25100](https://github.com/joyent/node/pull/25100)

<a id="0.10.38"></a>

## 2015-03-23, Versión 0.10.38 (Mantenimiento)

### Commits

* [[`3b511a8ccd`](https://github.com/nodejs/node/commit/3b511a8ccd)] - **openssl**: upgrade to 1.0.1m (Addressing multiple CVES)

<a id="0.10.37"></a>

## 2015-03-11, Versión 0.10.37 (Mantenimiento)

### Commits

* [[`dcff5d565c`](https://github.com/nodejs/node/commit/dcff5d565c)] - uv: actualizar a 0.10.36 (CVE-2015-0278) [#9274](https://github.com/joyent/node/pull/9274)
* [[`f2a45caf2e`](https://github.com/nodejs/node/commit/f2a45caf2e)] - domains: reparar la limpieza del stack después del manejo de errores (Jonas Dohse) [#9364](https://github.com/joyent/node/pull/9364)
* [[`d01a900078`](https://github.com/nodejs/node/commit/d01a900078)] - buffer: reformular el mensaje de error de Buffer.concat (Chris Dickinson) [#8723](https://github.com/joyent/node/pull/8723)
* [[`c8239c08d7`](https://github.com/nodejs/node/commit/c8239c08d7)] - console: permitir a los campos de Object.prototype como etiqutas (Julien Gilli) [#9215](https://github.com/joyent/node/pull/9215)
* [[`431eb172f9`](https://github.com/nodejs/node/commit/431eb172f9)] - V8: versión del registro en el archivo de registros del perfilador (Ben Noordhuis) [#9043](https://github.com/joyent/node/pull/9043)
* [[`8bcd0a4c4a`](https://github.com/nodejs/node/commit/8bcd0a4c4a)] - http: reparar regresión del rendimiento para solicitudes GET (Florin-Cristian Gavrila) [#9026](https://github.com/joyent/node/pull/9026)

<a id="0.10.36"></a>

## 2015-01-26, Versión 0.10.36 (Estable)

### Commits

* [[`deef605085`](https://github.com/nodejs/node/commit/deef605085)] - **openssl**: update to 1.0.1l
* [[`45f1330425`](https://github.com/nodejs/node/commit/45f1330425)] - **v8**: Fix debugger and strict mode regression (Julien Gilli)
* [[`6ebd85e105`](https://github.com/nodejs/node/commit/6ebd85e105)] - **v8**: don't busy loop in cpu profiler thread (Ben Noordhuis) [#8789](https://github.com/joyent/node/pull/8789)

<a id="0.10.35"></a>

## 2014.12.22, Versión 0.10.35 (Estable)

* tls: volver a añadir certs de SSL 1024-bit removidos por f9456a2 (Chris Dickinson)
* timers: no cerrar los temporizadores de intervalos cuando se desreferencian (Julien Gilli)
* timers: no mutar la lista de unref mientras se esté iterando (Julien Gilli)

<a id="0.10.34"></a>

## 2014.12.17, Versión 0.10.34 (Estable)

https://github.com/nodejs/node/commit/52795f8fcc2de77cf997e671ea58614e5e425dfe

* uv: actualizar a v0.10.30
* zlib: actualizar a v1.2.8
* child_process: verificar si execFile args es un array (Sam Roberts)
* child_process: verificar si los argumentos de bifurcación son un array (Sam Roberts)
* crypto: actualizar certificados root (Ben Noordhuis)
* domains: arreglar problemas con abortos ante no-captura
* timers: Evitar rastreo lineal en _unrefActive. (Julien Gilli)
* timers: reparar la fuga de memoria de unref () (Trevor Norris)
* v8: añadir api para la abortos ante excepción de no-captura (Julien Gilli)
* debugger: arreglar la utilización de "usar estricto" (Julien Gilli)

<a id="0.10.33"></a>

## 2014.10.20, Versión 0.10.33 (Estable)

https://github.com/nodejs/node/commit/8d045a30e95602b443eb259a5021d33feb4df079

* openssl: actualizar a 1.0.1j (Tratar múltiples CVEs)
* uv: Actualizar a v0.10.29
* child_process: soportar argumentos opcionales de manera correcta (cjihrig)
* crypto: Deshabilita autonegociación para SSLv2/3 de manera predeterminada (Fedor Indutny, Timothy J Fontaine, Alexis Campailla)

  Este es un cambio de comportamiento, de manera predeterminada no permitiremos la negociación a SSLv2 or SSLv3. Si deseas este comportamiento, ejecuta Node.js con `--enable-ssl2` o `--enable-ssl3`, respectivamente.

  Esto no cambia el comportamiento para los usuarios que estén solicitando específicamente `SSLv2_method` o `SSLv3_method`. Aunque este comportamiento no es recomendado, se asume que usted sabe lo que está haciendo, pues está solicitando usar estos métodos específicamente.

<a id="0.10.32"></a>

## 2014.09.16, Versión 0.10.32 (Estable)

https://github.com/nodejs/node/commit/0fe0d121551593c23a565db8397f85f17bb0f00e

* npm: Actualizar a 1.4.28
* v8: reparar una falla introducida por una versión previa (Fedor Indutny)
* configure: añadir bandera --openssl-no-asm (Fedor Indutny)
* crypto: usar dominios para cualquier método para atender callbacks (Chris Dickinson)
* http: no enviar `0\r\n\r\n` en respuestas de TE HEAD (Fedor Indutny)
* querystring: reparar la anulación de unescape (Tristan Berger)
* url: Anadir soporte para los separadores de RFC 3490 (Mathias Bynens)

<a id="0.10.31"></a>

## 2014.08.19, Versión 0.10.31 (Estable)

https://github.com/nodejs/node/commit/7fabdc23d843cb705d2d0739e7bbdaaf50aa3292

* v8: hacer backport a CVE-2013-6668
* openssl: Actualizar a v1.0.1i
* npm: Actualizar a v1.4.23
* cluster: la desconexión no debe ser sincrónica (Sam Roberts)
* fs: reparar la pérdida fs.readFileSync fd cuando obtiene RangeError (Jackson Tian)
* stream: reparar valores falsos de Readable.wrap objectMode (James Halliday)
* timers: reparar temporizadores con un retraso de ejecución no-enteros. (Julien Gilli)

<a id="0.10.30"></a>

## 2014.07.31, Versión 0.10.30 (Estable)

https://github.com/nodejs/node/commit/bc0ff830aff1e016163d855e86ded5c98b0899e8

* uv: Actualizar a v0.10.28
* npm: Actualizar a v1.4.21
* v8: Interrupciones no deben enmascarar el stack overflow.
* Revertido "stream: inicia el viejo-modo de lectura en el próximo tick" (Fedor Indutny)
* buffer: repara señal de desbordamiento en `readUIn32BE` (Fedor Indutny)
* buffer: mejorar métodos {read,write}{U}Int* (Nick Apperson)
* child_process: manejar error writeUtf8String error (Fedor Indutny)
* deps: backport 4ed5fde4f desde upstream v8 (Fedor Indutny)
* deps: cherry-pick eca441b2 de OpenSSL (Fedor Indutny)
* lib: eliminar y reestructurar llamadas a isNaN() (cjihrig)
* module: eliminar doble `getenv()` (Maciej Małecki)
* stream2: arrojar datos existentes en la lectura del stream terminado (Chris Dickinson)
* streams: eliminar requiere ('assert') no usado(Rod Vagg)
* timers: backport f8193ab (Julien Gilli)
* util.h: compatibilidad de interfaz (Oguz Bastemur)
* zlib: no falla en la escritura después de cerrar (Fedor Indutny)

<a id="0.10.29"></a>

## 2014.06.05, Versión 0.10.29 (Estable)

https://github.com/nodejs/node/commit/ce82d6b8474bde7ac7df6d425fb88fb1bcba35bc

* openssl: to 1.0.1h (CVE-2014-0224)
* npm: actualizar a 1.4.14
* utf8: Prevenir que Node envíe un UTF-8 inválido (Felix Geisendörfer)
  * *NOTE* this introduces a breaking change, previously you could construct invalid UTF-8 and invoke an error in a client that was expecting valid UTF-8, now unmatched surrogate pairs are replaced with the unknown UTF-8 character. Para restaurar la vieja funcionalidad, simplemente ten establecida la variable de ambiente NODE_INVALID_UTF8.

* child_process: no establecer args antes de arrojar (Greg Sabia Tucker)
* child_process: spawn() no arroja TypeError (Greg Sabia Tucker)
* constants: exportar O_NONBLOCK (Fedor Indutny)
* crypto: mejorar el uso de memoria (Alexis Campailla)
* fs: cerrar archivo si fstat() falla al ejecutar readFile() (cjihrig)
* lib: nombrar métodos prototipo de EventEmitter (Ben Noordhuis)
* tls: reparar problemas de rendimiento (Alexis Campailla)

<a id="0.10.28"></a>

## 2014.05.01, Versión 0.10.28 (Estable)

https://github.com/nodejs/node/commit/b148cbe09d4657766fdb61575ba985734c2ff0a8

* npm: actualizar a v1.4.9

<a id="0.10.27"></a>

## 2014.05.01, Versión 0.10.27 (Estable)

https://github.com/nodejs/node/commit/cb7911f78ae96ef7a540df992cc1359ba9636e86

* npm: actualizar a v1.4.8
* openssl: actualizar a 1.0.1g
* uv: actualizar a v0.10.27
* dns: reparar ciertas entradas txt (Fedor Indutny)
* assert: Asegurar reflexivilidad de deepEqual (Mike Pennisi)
* child_process: reparar bloqueo cuando se envían hadles (Fedor Indutny)
* child_process: reparar envío doble de handle (Fedor Indutny)
* crypto: no colocar en minúscula los nombres del cifrador/hash (Fedor Indutny)
* dtrace: buscar solución alternativa de bug vinculado en FreeBSD (Fedor Indutny)
* http: no emitir socket EOF no legible (Fedor Indutny)
* http: invocar createConnection cuando no hay agente (Nathan Rajlich)
* stream: remover verificación sin utilidad (Brian White)
* timer: no reprogramar temporizador del cubo en un dominio (Greg Brail)
* url: tratar a \ de igual manera que a / (isaacs)
* util: dar formato como Error si instanceof tiene Error (Rod Vagg)

<a id="0.10.26"></a>

## 2014.02.18, Versión 0.10.26 (Estable)

https://github.com/nodejs/node/commit/cc56c62ed879ad4f93b1fdab3235c43e60f48b7e

* uv: Actualizar a v0.10.25 (Timothy J Fontaine)
* npm: actualizar a 1.4.3 (isaacs)
* v8: soportar compilación con VS2013 (Fedor Indutny)
* cares: hacer backport a la reparación del análisis TXT (Fedor Indutny)
* crypto: arrojar ante falla de SignFinal (Fedor Indutny)
* crypto: actualizar certificados root (Ben Noordhuis)
* debugger: Reparar que no aparece el punto de quiebre luego de reiniciar (Farid Neshat)
* fs: hacer que unwatchFile() sea insensible a la ruta (iamdoron)
* net: no volver a emitir los errores del stream (Fedor Indutny)
* net: hacer que la reentrada de Socket destroy() sea segura (Jun Ma)
* net: reestablecer `endEmitted` tras la reconexión (Fedor Indutny)
* node: no cerrar la implicidad de stdio (Fedor Indutny)
* zlib: evitar la aserción en el cierre (Fedor Indutny)

<a id="0.10.25"></a>

## 2014.01.23, Versión 0.10.25 (Estable)

https://github.com/nodejs/node/commit/b0e5f195dfce3e2b99f5091373d49f6616682596

* uv: Actualizar a v0.10.23
* npm: Actualizar a v1.3.24
* v8: Reparar la enumeración de objetos con muchas propiedades
* child_process: reparar argumentos spawn() opcionales (Sam Roberts)
* cluster: reportar más errores a los workers (Fedor Indutny)
* domains: exit() solo afecta dominios activos (Ryan Graham)
* src: manejador de OnFatalError debe abort() (Timothy J Fontaine)
* stream: escrituras pueden devolver false pero no olvidar emitir drain (Yang Tianyang)

<a id="0.10.24"></a>

## 2013.12.18, Versión 0.10.24 (Estable)

https://github.com/nodejs/node/commit/b7fd6bc899ccb629d790c47aee06aba87e535c41

* uv: Actualizar a v0.10.21
* npm: actualizar a1.3.21
* v8: hacer backport a corrección para CVE-2013-{6639|6640}
* build: nodo de instalación unix y encabezados de biblioteca dep (Timothy J Fontaine)
* cluster, v8: reparar --logfile=%p.log (Ben Noordhuis)
* odule: solo almacenar en paquete de caché el principal (Wyatt Preul)

<a id="0.10.23"></a>

## 2013.12.12, Versión 0.10.23 (Estable)

https://github.com/nodejs/node/commit/0462bc23564e7e950a70ae4577a840b04db6c7c6

* uv: Actualizar a v0.10.20 (Timothy J Fontaine)
* npm: Actualizar a 1.3.17 (isaacs)
* gyp: actualizar a 78b26f7 (Timothy J Fontaine)
* build: incluir símbolos postmortem en linux (Timothy J Fontaine)
* crypto: Hacer que Decipher._flush() emita errores. (Kai Groner)
* dgram: reparar anulación cuando se tenga `fd` del dgram cerrado (Fedor Indutny)
* events: no aceptar NaN en setMaxListeners (Fedor Indutny)
* events: evitar llamar la función `once` dos veces (Tim Wood)
* events: reparar TypeError en removeAllListeners (Jeremy Martin)
* fs: reportar la ruta correcta cuando EEXIST (Fedor Indutny)
* process: hacer cumplir señales permitidas por kill (Sam Roberts)
* tls: emitir 'end' en .receivedShutdown (Fedor Indutny)
* tls: reparar una corrupción de datos potenciales (Fedor Indutny)
* tls: manejar errores `ssl.start()` apropiadamente (Fedor Indutny)
* tls: restablecer los callbacks NPN después de SNI (Fedor Indutny)

<a id="0.10.22"></a>

## 2013.11.12, Versión 0.10.22 (Estable)

https://github.com/nodejs/node/commit/cbff8f091c22fb1df6b238c7a1b9145db950fa65

* npm: Actualizar a 1.3.14
* uv: Actualizar a v0.10.19
* child_process: no afirmar en eventos de descriptores de archivos obsoletos (Fedor Indutny)
* darwin: Reparar "No Responde" en monitor de actividad Mavericks (Fedor Indutny)
* debugger: Reparar bug en sb() con script sin nombre (Maxim Bogushevich)
* repl: no insertar duplicados en las terminaciones (Maciej Małecki)
* src: Reparar pérdida de memoria en hadles cerrados (Timothy J Fontaine)
* tls: previene detenciones usando read(0) (Fedor Indutny)
* v8: usar la información de la zona horaria correcta en Solaris (Maciej Małecki)

<a id="0.10.21"></a>

## 2013.10.18, Versión 0.10.21 (Estable)

https://github.com/nodejs/node/commit/e2da042844a830fafb8031f6c477eb4f96195210

* uv: Actualizar a v0.10.18
* crypto: limpia errores de falla verificada (Timothy J Fontaine)
* dtrace: interpretar strings de dos bytes (Dave Pacheco)
* fs: reparar el bug del contenido del archivo fs.truncate() se hace cero (Ben Noordhuis)
* http: proveer contrapresión para inundación de pipe (isaacs)
* tls: reparar la terminación prematura de la conexión (Ben Noordhuis)

<a id="0.10.20"></a>

## 2013.09.30, Versión 0.10.20 (Estable)

https://github.com/nodejs/node/commit/d7234c8d50a1af73f60d2d3c0cc7eed17429a481

* tls: reparar colgado esporádico y lecturas parciales (Fedor Indutny)
  * reparar "npm ERR! cb() nunca llamado!"

<a id="0.10.19"></a>

## 2013.09.24, Versión 0.10.19 (Estable)

https://github.com/nodejs/node/commit/6b5e6a5a3ec8d994c9aab3b800b9edbf1b287904

* uv: Actualizar a v0.10.17
* npm: actualizar a 1.3.11
* readline: manejar inicio de la entrada con caracteres de control (Eric Schrock)
* configure: añadir opción mips-float-abi (suave, duro)(Andrei Sedoi)
* stream: transformaciones deobjectMode permiten valores falsos (isaacs)
* tls: previene valores duplicados devueltos de la lectura (Nathan Rajlich)
* tls: protocolos NPN ahora son locales a las conexiones (Fedor Indutny)

<a id="0.10.18"></a>

## 2013.09.04, Versión 0.10.18 (Estable)

https://github.com/nodejs/node/commit/67a1f0c52e0708e2596f3f2134b8386d6112561e

* uv: Actualizar a v0.10.15
* stream: No fallar en la propiedad unset_events (isaacs)
* stream: Pasar codificación 'buffer' con fragmentos escribibles decodificados (isaacs)

<a id="0.10.17"></a>

## 2013.08.21, Versión 0.10.17 (Estable)

https://github.com/nodejs/node/commit/469a4a5091a677df62be319675056b869c31b35c

* uv: Actualizar v0.10.14
* http_parser: No aceptar métodos PUN/GEM como PUT/GET (Chris Dickinson)
* tls: arreglar aserción cuando ssl es destruido en la lectura (Fedor Indutny)
* stream: Arrojar 'error' si se remueven los listeners (isaacs)
* dgram: reparar aserción en los argumentos de send () malos (Ben Noordhuis)
* readline: pausar stdin antes de apagar el modo raw del terminal (Daniel Chatfield)

<a id="0.10.16"></a>

## 2013.08.16, Versión 0.10.16 (Estable)

https://github.com/nodejs/node/commit/50b4c905a4425430ae54db4906f88982309e128d

* v8: reparar back-port para CVE-2013-2882
* npm: Actualizar a 1.3.8
* crypto: corregir assert() en entrada hex malformada (Ben Noordhuis)
* crypto: reparar fuga de memoria en ruta de error de randomBytes() (Ben Noordhuis)
* events: reparar pérdida de memoria, que no filtren los nombres de los eventos (Ben Noordhuis)
* http: Manejar codificaciones hex/base64 correctamente (isaacs)
* http: mejorar el rendimiento res.write(buf) fragmentado (Ben Noordhuis)
* stream: Reparar emisión de error de doble pipe (Eran Hammer)

<a id="0.10.15"></a>

## 2013.07.25, Versión 0.10.15 (Estable)

https://github.com/nodejs/node/commit/2426d65af860bda7be9f0832a99601cc43c6cf63

* src: corregir el valor de retorno de process.getuid() (Ben Noordhuis)

<a id="0.10.14"></a>

## 2013.07.25, Versión 0.10.14 (Estable)

https://github.com/nodejs/node/commit/fdf57f811f9683a4ec49a74dc7226517e32e6c9d

* uv: Actualizar a v0.10.13
* npm: Actualizar a v1.3.5
* os: No reportar tiempos negativos en la información del cpu (Ben Noordhuis)
* fs: Manejar UID y GID grandes (Ben Noordhuis)
* url: Corregir caso extremo en el cual el protocolo no está en minúsculas (Shuan Wang)
* doc: Reescribir el API Doc de streams (isaacs)
* node: llamar a MakeDomainCallback en todos los casos de dominio (Trevor Norris)
* crypto: reparar fuga de memoria en LoadPKCS12 (Fedor Indutny)

<a id="0.10.13"></a>

## 2013.07.09, Versión 0.10.13 (Estable)

https://github.com/nodejs/node/commit/e32660a984427d46af6a144983cf7b8045b7299c

* uv: Actualizar a v0.10.12
* npm: Actualizar a 1.3.2
* windows: obtener el errno apropiado (Ben Noordhuis)
* tls: solo esperar para terminar si no lo hemos visto (Timothy J Fontaine)
* http: Deshacerse de la respuesta cuando la solicitud es abortada (isaacs)
* http: usar un temporizador desreferenciado para corregir retraso en la salida (Peter Rust)
* zlib: nivel puede ser negativo (Brian White)
* zlib: permitir valores cero para nivel y estrategia (Brian White)
* buffer: añadir comentario explicando la alineación del búfer (Ben Noordhuis)
* string_bytes: detectar correctamente 64bit (Timothy J Fontaine)
* src: reparar fuga de memoria en UsingDomains() (Ben Noordhuis)

<a id="0.10.12"></a>

## 2013.06.18, Versión 0.10.12 (Estable)

https://github.com/nodejs/node/commit/a088cf4f930d3928c97d239adf950ab43e7794aa

* npm: Actualizar a 1.2.32
* readline: hacer que `ctrl + L` limpie la pantalla (Yuan Chuan)
* v8: añadir el comando setVariableValue del depurador (Ben Noordhuis)
* net: No destruir el socket en medio de la escritura (isaacs)
* v8: reparar compilación para la arquitectura mips32r2 (Andrei Sedoi)
* configure: reparar compilación-cruzada host_arch_cc() (Andrei Sedoi)

<a id="0.10.11"></a>

## 2013.06.13, Versión 0.10.11 (Estable)

https://github.com/nodejs/node/commit/d9d5bc465450ae5d60da32e9ffcf71c2767f1fad

* uv: Actualizar a 0.10.11
* npm: Actualizar a 1.2.30
* openssl: añadir piezas de configuración faltantes para MIPS (Andrei Sedoi)
* Revert "http: remover bodyHead de eventos 'upgrade'" (isaacs)
* v8: reparar el comportamiento indefinido del puntero aritmético (Trevor Norris)
* crypto: reparar la verificación de codificación utf8/utf-8 (Ben Noordhuis)
* net: Reparar bucle ocupado en POLLERR|POLLHUP en los núcleos más viejos de linux (Ben Noordhuis, isaacs)

<a id="0.10.10"></a>

## 2013.06.04, Versión 0.10.10 (Estable)

https://github.com/nodejs/node/commit/25e51c396aa23018603baae2b1d9390f5d9db496

* uv: Actualizar a 0.10.10
* npm: Actualizar a 1.2.25
* utl: Analizar correctamente a ciertas urls formadas de manera extraña (isaacs)
* stream: unshift('') es un noop (isaacs)

<a id="0.10.9"></a>

## 2013.05.30, Versión 0.10.9 (Estable)

https://github.com/nodejs/node/commit/878ffdbe6a8eac918ef3a7f13925681c3778060b

* npm: Actualizar a 1.2.24
* uv: Actualizar a v0.10.9
* repl: reparar la verificación del error JSON.parse (Brian White)
* tls: destroySoon adecaudo (Fedor Indutny)
* tls: invocar write cb solo después que la lectura opuesta termine (Fedor Indutny)
* tls: ignorar error syscall.shutdown() (Fedor Indutny)

<a id="0.10.8"></a>

## 2013.05.24, Versión 0.10.8 (Estable)

https://github.com/nodejs/node/commit/30d9e9fdd9d4c33d3d95a129d021cd8b5b91eddb

* v8: actualizar a 3.14.5.9
* uv: actualizar a 0.10.8
* npm: Actualizar a 1.2.23
* http: remover bodyHead de los eventos 'upgrade' (Nathan Zadoks)
* http: Devuelve true en escrituras vacías, no false (isaacs)
* http: guardar recorridos, convierte búferes en strings (Ben Noordhuis)
* configure: respetar a la bandera --dest-os constantemente (Nathan Rajlich)
* buffer: arrojar cuando se escriba más allá de búfer (Trevor Norris)
* crypto: Limpiar el error después de los errores clave DiffieHellman (isaacs)
* string_bytes: eliminar relleno de strings base64 (Trevor Norris)

<a id="0.10.7"></a>

## 2013.05.17, Versión 0.10.7 (Estable)

https://github.com/nodejs/node/commit/d2fdae197ac542f686ee06835d1153dd43b862e5

* uv: actualizar a v0.10.7
* npm: Actualizar a 1.2.21
* crypto: No ignorar la verificación del argumento de codificación (isaacs)
* buffer, crypto: reparar la regresión de codificación predeterminada (Ben Noordhuis)
* timers: reparar aserción de setInterval() (Ben Noordhuis)

<a id="0.10.6"></a>

## 2013.05.14, Versión 0.10.6 (Estable)

https://github.com/nodejs/node/commit/5deb1672f2b5794f8be19498a425ea4dc0b0711f

* module: Desaprobar require.extensions (isaacs)
* stream: hacer que Readable.wrap soporte objectMode, vaciar los streams (Daniel Moore)
* child_process: reparar entrega de handles (Ben Noordhuis)
* crypto: Reparar la regresión de rendimiento (isaacs)
* src: codificación/decodificación de strings DRY (isaacs)

<a id="0.10.5"></a>

## 2013.04.23, Versión 0.10.5 (Estable)

https://github.com/nodejs/node/commit/deeaf8fab978e3cadb364e46fb32dafdebe5f095

* uv: Actualizar a 0.10.5 (isaacs)
* build: añadido soporte para Visual Studio 2012 (Miroslav Bajtoš)
* http: No intentar destruir sockets inexistentes (isaacs)
* crypto: hacer LazyTransform en propiedades, no métodos (isaacs)
* assert: colocar la información en err.message, no en err.name (Ryan Doenges)
* dgram: reparar la falta de address bind() (Ben Noordhuis)
* handle_wrap: reparar puntero de desreferencia NULO (Ben Noordhuis)
* os: reparar rebosamiento poco probable de búfer en os.type() (Ben Noordhuis)
* stream: Reparar condiciones de carrera de unshift() (isaacs)

<a id="0.10.4"></a>

## 2013.04.11, Versión 0.10.4 (Estable)

https://github.com/nodejs/node/commit/9712aa9f76073c30850b20a188b1ed12ffb74d17

* uv: Actualizar a 0.10.4
* npm: Actualizar a 1.2.18
* v8: Evitar el crecimiento excesivo de memoria en JSON.parse (Fedor Indutny)
* child_process, cluster: reparar escaneo O(n*m) del string cmd (Ben Noordhuis)
* net: reparar el soporte de socket.bytesWritten de Búferes (Fedor Indutny)
* buffer: reparar verificaciones de offset (Łukasz Walukiewicz)
* stream: llamar a cb de escritura antes de terminar el evento (isaacs)
* http: Soportar write(data, 'hex') (isaacs)
* crypto: secreto dh debería ser rellenado a la izquierda (Fedor Indutny)
* process: exponer NODE_MODULE_VERSION en process. versions (Rod Vagg)
* crypto: reparar llamada al constructor en streams de crypto (Andreas Madsen)
* net: cuenta para codificar en .byteLength (Fedor Indutny)
* net: reparar iteración del búfer en bytesWritten (Fedor Indutny)
* crypto: zero no es un error si se escriben 0 bytes (Fedor Indutny)
* tls: Volver a habilitar revisión de CN-ID en verificación de certificados (Tobías Müllerleile)

<a id="0.10.3"></a>

## 2013.04.03, Versión 0.10.3 (Estable)

https://github.com/nodejs/node/commit/d4982f6f5e4a9a703127489a553b8d782997ea43

* npm: Actualizar a 1.2.17
* child_process: reconocer los handles enviados (Fedor Indutny)
* etw: actualizar prototipos para que coincidan con el proveedor dtrace (Timothy J Fontaine)
* dtrace: pasar más argumentos a sondas (Dave Pacheco)
* build: permitir construcción con dtrace en osx (Dave Pacheco)
* http: Remover código de la solución heredada para ECONNRESET (isaacs)
* http: Garantizar limpieza del socket cuando la respuesta del cliente termine (isaacs)
* tls: Destruir socket cuando el lado encriptado cierre (isaacs)
* repl: isSyntaxError() atrapa los errores del "strict mode" (Nathan Rajlich)
* crypto: Pasar opciones a las llamadas de ctor (isaacs)
* src: ligar process.versions.uv a uv_version_string() (Ben Noordhuis)

<a id="0.10.2"></a>

## 2013.03.28, Versión 0.10.2 (Estable)

https://github.com/nodejs/node/commit/1e0de9c426e07a260bbec2d2196c2d2db8eb8886

* npm: Actualizar a 1.2.15
* uv: Actualizar a 0.10.3
* tls: manejar SSL_ERROR_ZERO_RETURN (Fedor Indutny)
* tls: manejar los errores antes de llamar a métodos C++ (Fedor Indutny)
* tls: remover nocivas e innecesarias revisiones de enlaces (Marcel Laverdet)
* crypto: hacer que getCiphers() devuelva cifrados no SSL (Ben Noordhuis)
* crypto: verificar el tamaño del argumento randomBytes() (Ben Noordhuis)
* timers: no calcular la propiedad Timeout._when (Alexey Kupershtokh)
* timers: reparar error de fuera-por-uno de ms (Alexey Kupershtokh)
* timers: manejar rebosamiento de int32 firmado en enroll() (Fedor Indutny)
* stream: Reparar la detención en Transformación bajo condiciones muy específicas (Gil Pedersen)
* stream: Manejar tarde los listeners del evento 'readable' (isaacs)
* stream: Corregir la finalización temprana en Escribibles en escrituras de longitud-cero (isaacs)
* domain: arreglar callback dominio de MakeCallback (Trevor Norris)
* child_process: no emitir el mismo handle dos veces (Ben Noordhuis)
* child_process: reparar envío de utf-8 a proceso secundario (Ben Noordhuis)

<a id="0.10.1"></a>

## 2013.03.21, Versión 0.10.1 (Estable)

https://github.com/nodejs/node/commit/c274d1643589bf104122674a8c3fd147527a667d

* npm: actualizar a 1.2.15
* crypto: Mejorar el rendimiento de APIs que no sean stream (Fedor Indutny)
* tls: siempre restablecer el error this.ssl. después del manejo (Fedor Indutny)
* tls: Prevenir cuelgues a mitad de los streams (Fedor Indutny, isaacs)
* net: mejorar el soporte del socket tcp arbitrario (Ben Noordhuis)
* net: manejar el evento 'finish' solo después de 'connect' (Fedor Indutny)
* http: No hacer end() de hot-path para búferes grandes (isaacs)
* fs: Errores de cb faltantes son desaprobados, no es un arrojamiento (isaacs)
* fs: hacer que write/appendFileSync establezca correctamente modo archivo (Raymond Feng)
* stream: Devolver el mismo del readable.wrap (isaacs)
* stream: Nunca llamar a decoder.end() múltiples veces (Gil Pedersen)
* windows: habilitar ver señales con process.on('SIGXYZ') (Bert Belder)
* node: revertir la eliminación de MakeCallback (Trevor Norris)
* node: Desenvolver sin abortar en el getter del fd del handle (isaacs)

<a id="0.10.0"></a>

## 2013.03.11, Versión 0.10.0 (Estable)

https://github.com/nodejs/node/commit/163ca274230fce536afe76c64676c332693ad7c1

* npm: Actualizar a 1.2.14
* core: Añadir el nombre de archivo correctamente en dlopen en windows (isaacs)
* zlib: Manejar limpieza de banderas correctamente (isaacs)
* domains: Manejar errores arrojados en manejadores de errores anidados (isaacs)
* buffer: Borrar bits altos cuando se convierta a ascii (Ben Noordhuis)
* win/msi: Habilitar modificar y reparar (Bert Belder)
* win/msi: Añadir selección de características para varias partes del nodo (Bert Belder)
* win/msi: usar rutas de claves de registro consistentes (Bert Belder)
* child_process: soportar envío de socket de dgram (Andreas Madsen)
* fs: Levantar EISDIR en Windows cuando se llame a fs.read/write en un dir (isaacs)
* unix: reparar advertencias de establecimiento de alias estricto, convertir funciones en macro (Ben Noordhuis)
* unix: respetar variable de ambiente UV_THREADPOOL_SIZE (Ben Noordhuis)
* win/tty: reparar error tipográfico en la enumeración de atributos de color (Bert Belder)
* win/tty: no tocar el modo insertar o el modo de edición rápida (Bert Belder)
