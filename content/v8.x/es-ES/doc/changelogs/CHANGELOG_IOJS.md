# Registro de Cambios de io.js

<!--lint disable prohibited-strings-->

<table>
<tr>
<th>v3</th>
<th>v2</th>
<th>v1</th>
</tr>
<tr>
<td valign="top">
<a href="#3.3.1">3.3.1</a><br/>
<a href="#3.3.0">3.3.0</a><br/>
<a href="#3.2.0">3.2.0</a><br/>
<a href="#3.1.0">3.1.0</a><br/>
<a href="#3.0.0">3.0.0</a><br/>
</td>
<td valign="top">
<a href="#2.5.0">2.5.0</a><br/>
<a href="#2.4.0">2.4.0</a><br/>
<a href="#2.3.4">2.3.4</a><br/>
<a href="#2.3.3">2.3.3</a><br/>
<a href="#2.3.2">2.3.2</a><br/>
<a href="#2.3.1">2.3.1</a><br/>
<a href="#2.3.0">2.3.0</a><br/>
<a href="#2.2.1">2.2.1</a><br/>
<a href="#2.2.0">2.2.0</a><br/>
<a href="#2.1.0">2.1.0</a><br/>
<a href="#2.0.2">2.0.2</a><br/>
<a href="#2.0.1">2.0.1</a><br/>
<a href="#2.0.0">2.0.0</a><br/>
</td>
<td valign="top">
<a href="#1.8.4">1.8.4</a><br/>
<a href="#1.8.3">1.8.3</a><br/>
<a href="#1.8.2">1.8.2</a><br/>
<a href="#1.8.1">1.8.1</a><br/>
<a href="#1.7.1">1.7.1</a><br/>
<a href="#1.7.0">1.7.0</a><br/>
<a href="#1.6.4">1.6.4</a><br/>
<a href="#1.6.3">1.6.3</a><br/>
<a href="#1.6.2">1.6.2</a><br/>
<a href="#1.6.1">1.6.1</a><br/>
<a href="#1.6.0">1.6.0</a><br/>
<a href="#1.5.1">1.5.1</a><br/>
<a href="#1.5.0">1.5.0</a><br/>
<a href="#1.4.3">1.4.3</a><br/>
<a href="#1.4.2">1.4.2</a><br/>
<a href="#1.4.1">1.4.1</a><br/>
<a href="#1.4.1">1.4.0</a><br/>
<a href="#1.3.0">1.3.0</a><br/>
<a href="#1.2.0">1.2.0</a><br/>
<a href="#1.1.0">1.1.0</a><br/>
<a href="#1.0.4">1.0.4</a><br/>
<a href="#1.0.3">1.0.3</a><br/>
<a href="#1.0.2">1.0.2</a><br/>
<a href="#1.0.1">1.0.1</a><br/>
<a href="#1.0.0">1.0.0</a><br/>
</td>
</tr>
</table>

* Otras Versiones
  * [8.x](CHANGELOG_V8.md)
  * [7.x](CHANGELOG_V7.md)
  * [6.x](CHANGELOG_V6.md)
  * [5.x](CHANGELOG_V5.md)
  * [4.x](CHANGELOG_V4.md)
  * [0.12.x](CHANGELOG_V012.md)
  * [0.10.x](CHANGELOG_V010.md)
  * [Archive](CHANGELOG_ARCHIVE.md)

<a id="3.3.1"></a>

## 2015-09-15, io.js Versión 3.3.1 @rvagg

### Cambios notables

* **buffer**: Fixed a minor errors that was causing crashes (Michaël Zasso) [#2635](https://github.com/nodejs/node/pull/2635),
* **child_process**: Fix error that was causing crashes (Evan Lucas) [#2727](https://github.com/nodejs/node/pull/2727)
* **crypto**: Replace use of rwlocks, unsafe on Windows XP / 2003 (Ben Noordhuis) [#2723](https://github.com/nodejs/node/pull/2723)
* **libuv**: Upgrade from 1.7.3 to 1.7.4 (Saúl Ibarra Corretgé) [#2817](https://github.com/nodejs/node/pull/2817)
* **node**: Fix faulty `process.release.libUrl` on Windows (Rod Vagg) [#2699](https://github.com/nodejs/node/pull/2699)
* **node-gyp**: Float v3.0.3 which has improved support for Node.js and io.js v0.10 to v4+ (Rod Vagg) [#2700](https://github.com/nodejs/node/pull/2700)
* **npm**: Upgrade to version 2.14.3 from 2.13.3, includes a security update, see https://github.com/npm/npm/releases/tag/v2.14.2 for more details, (Kat Marchán) [#2696](https://github.com/nodejs/node/pull/2696).
* **timers**: Improved timer performance from porting the 0.12 implementation, plus minor fixes (Jeremiah Senkpiel) [#2540](https://github.com/nodejs/node/pull/2540), (Julien Gilli) [nodejs/node-v0.x-archive#8751](https://github.com/nodejs/node-v0.x-archive/pull/8751) [nodejs/node-v0.x-archive#8905](https://github.com/nodejs/node-v0.x-archive/pull/8905)

### Problemas conocidos

Vea https://github.com/nodejs/io.js/labels/confirmed-bug para una lista actual y completa de problemas conocidos.

* Algunos usos de propiedades abreviadas de objetos computados no son manejadas correctamente por la versión de V8 actual. p. ej. `[{ [prop]: val }]` se evalúa a `[{}]`. [#2507](https://github.com/nodejs/node/issues/2507)
* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/io.js/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/io.js/issues/690)
* `process.send()` no es sincrónico, como lo sugieren los documentos, una regresión introducida en 1.0.2, vea [#760](https://github.com/nodejs/io.js/issues/760).
* Llamar a `dns.setServers()` mientras una consulta de DNS está en progreso puede ocasionar que el proceso colapse ante una aserción fallida. [#894](https://github.com/nodejs/io.js/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/io.js/issues/1435).

### Commits

* [[`b73ff52fe6`](https://github.com/nodejs/node/commit/b73ff52fe6)] - **bindings**: close after reading module struct (Fedor Indutny) [#2792](https://github.com/nodejs/node/pull/2792)
* [[`aa1140e59a`](https://github.com/nodejs/node/commit/aa1140e59a)] - **buffer**: SlowBuffer only accept valid numeric values (Michaël Zasso) [#2635](https://github.com/nodejs/node/pull/2635)
* [[`574475d56e`](https://github.com/nodejs/node/commit/574475d56e)] - **build**: clean up the generated tap file (Sakthipriyan Vairamani) [#2837](https://github.com/nodejs/node/pull/2837)
* [[`aa0001271e`](https://github.com/nodejs/node/commit/aa0001271e)] - **build**: remote commands on staging in single session (Rod Vagg) [#2717](https://github.com/nodejs/node/pull/2717)
* [[`1428661095`](https://github.com/nodejs/node/commit/1428661095)] - **build**: fix v8_enable_handle_zapping override (Karl Skomski) [#2731](https://github.com/nodejs/node/pull/2731)
* [[`5a51edd718`](https://github.com/nodejs/node/commit/5a51edd718)] - **build**: add --enable-asan with builtin leakcheck (Karl Skomski) [#2376](https://github.com/nodejs/node/pull/2376)
* [[`618caa5de0`](https://github.com/nodejs/node/commit/618caa5de0)] - **child_process**: use stdio.fd even if it is 0 (Evan Lucas) [#2727](https://github.com/nodejs/node/pull/2727)
* [[`7be4e49cb6`](https://github.com/nodejs/node/commit/7be4e49cb6)] - **child_process**: check execFile and fork args (James M Snell) [#2667](https://github.com/nodejs/node/pull/2667)
* [[`7f5d6e72c6`](https://github.com/nodejs/node/commit/7f5d6e72c6)] - **cluster**: allow shared reused dgram sockets (Fedor Indutny) [#2548](https://github.com/nodejs/node/pull/2548)
* [[`e68c7ec498`](https://github.com/nodejs/node/commit/e68c7ec498)] - **contextify**: ignore getters during initialization (Fedor Indutny) [nodejs/io.js#2091](https://github.com/nodejs/io.js/pull/2091)
* [[`610fa964aa`](https://github.com/nodejs/node/commit/610fa964aa)] - **cpplint**: make it possible to run outside git repo (Ben Noordhuis) [#2710](https://github.com/nodejs/node/pull/2710)
* [[`4237373dd7`](https://github.com/nodejs/node/commit/4237373dd7)] - **crypto**: replace rwlocks with simple mutexes (Ben Noordhuis) [#2723](https://github.com/nodejs/node/pull/2723)
* [[`777eb00306`](https://github.com/nodejs/node/commit/777eb00306)] - **deps**: upgraded to node-gyp@3.0.3 in npm (Kat Marchán) [#2822](https://github.com/nodejs/node/pull/2822)
* [[`b729ad384b`](https://github.com/nodejs/node/commit/b729ad384b)] - **deps**: upgrade to npm 2.14.3 (Kat Marchán) [#2822](https://github.com/nodejs/node/pull/2822)
* [[`b09fde761c`](https://github.com/nodejs/node/commit/b09fde761c)] - **deps**: update libuv to version 1.7.4 (Saúl Ibarra Corretgé) [#2817](https://github.com/nodejs/node/pull/2817)
* [[`4cf225daad`](https://github.com/nodejs/node/commit/4cf225daad)] - **deps**: float node-gyp v3.0.0 (Rod Vagg) [#2700](https://github.com/nodejs/node/pull/2700)
* [[`118f48c0f3`](https://github.com/nodejs/node/commit/118f48c0f3)] - **deps**: create .npmrc during npm tests (Kat Marchán) [#2696](https://github.com/nodejs/node/pull/2696)
* [[`b3fee8e6a6`](https://github.com/nodejs/node/commit/b3fee8e6a6)] - **deps**: upgrade to npm 2.14.2 (Kat Marchán) [#2696](https://github.com/nodejs/node/pull/2696)
* [[`4593539b92`](https://github.com/nodejs/node/commit/4593539b92)] - **deps**: backport 75e43a6 from v8 upstream (saper) [#2636](https://github.com/nodejs/node/pull/2636)
* [[`2d1438cfe0`](https://github.com/nodejs/node/commit/2d1438cfe0)] - **doc**: fix broken link in repl.markdown (Danny Nemer) [#2827](https://github.com/nodejs/node/pull/2827)
* [[`9dd9c85a48`](https://github.com/nodejs/node/commit/9dd9c85a48)] - **doc**: fix typos in README (Ionică Bizău) [#2852](https://github.com/nodejs/node/pull/2852)
* [[`476125d403`](https://github.com/nodejs/node/commit/476125d403)] - **doc**: add tunniclm as a collaborator (Mike Tunnicliffe) [#2826](https://github.com/nodejs/node/pull/2826)
* [[`0603a92d48`](https://github.com/nodejs/node/commit/0603a92d48)] - **doc**: fix two doc errors in stream and process (Jeremiah Senkpiel) [#2549](https://github.com/nodejs/node/pull/2549)
* [[`da2902ddfd`](https://github.com/nodejs/node/commit/da2902ddfd)] - **doc**: use "Calls" over "Executes" for consistency (Minwoo Jung) [#2800](https://github.com/nodejs/node/pull/2800)
* [[`5e93bc4fba`](https://github.com/nodejs/node/commit/5e93bc4fba)] - **doc**: use US English for consistency (Anne-Gaelle Colom) [#2784](https://github.com/nodejs/node/pull/2784)
* [[`3ee7fbcefd`](https://github.com/nodejs/node/commit/3ee7fbcefd)] - **doc**: use 3rd person singular for consistency (Anne-Gaelle Colom) [#2765](https://github.com/nodejs/node/pull/2765)
* [[`4fdccb9eb7`](https://github.com/nodejs/node/commit/4fdccb9eb7)] - **doc**: fix comma splice in Assertion Testing doc (Rich Trott) [#2728](https://github.com/nodejs/node/pull/2728)
* [[`28c2d310d6`](https://github.com/nodejs/node/commit/28c2d310d6)] - **doc**: update AUTHORS list (Rod Vagg)
* [[`324c073fb9`](https://github.com/nodejs/node/commit/324c073fb9)] - **doc**: add TSC meeting minutes 2015-09-02 (Rod Vagg) [#2674](https://github.com/nodejs/node/pull/2674)
* [[`8929445686`](https://github.com/nodejs/node/commit/8929445686)] - **doc**: update url doc to account for escaping (Jeremiah Senkpiel) [#2605](https://github.com/nodejs/node/pull/2605)
* [[`512dad6883`](https://github.com/nodejs/node/commit/512dad6883)] - **doc**: reorder collaborators by their usernames (Johan Bergström) [#2322](https://github.com/nodejs/node/pull/2322)
* [[`8372ea2ca5`](https://github.com/nodejs/node/commit/8372ea2ca5)] - **doc,test**: enable recursive file watching in Windows (Sakthipriyan Vairamani) [#2649](https://github.com/nodejs/node/pull/2649)
* [[`daf6c533cc`](https://github.com/nodejs/node/commit/daf6c533cc)] - **events,lib**: don't require EE#listenerCount() (Jeremiah Senkpiel) [#2661](https://github.com/nodejs/node/pull/2661)
* [[`d8371a801e`](https://github.com/nodejs/node/commit/d8371a801e)] - **http_server**: fix resume after socket close (Fedor Indutny) [#2824](https://github.com/nodejs/node/pull/2824)
* [[`7f7d4fdddd`](https://github.com/nodejs/node/commit/7f7d4fdddd)] - **node-gyp**: float 3.0.1, minor fix for download url (Rod Vagg) [#2737](https://github.com/nodejs/node/pull/2737)
* [[`91cee73294`](https://github.com/nodejs/node/commit/91cee73294)] - **src**: use ZCtxt as a source for v8::Isolates (Roman Klauke) [#2547](https://github.com/nodejs/node/pull/2547)
* [[`ac98e13b95`](https://github.com/nodejs/node/commit/ac98e13b95)] - **src**: s/ia32/x86 for process.release.libUrl for win (Rod Vagg) [#2699](https://github.com/nodejs/node/pull/2699)
* [[`ca6c3223e1`](https://github.com/nodejs/node/commit/ca6c3223e1)] - **src**: use standard conform snprintf on windows (Karl Skomski) [#2404](https://github.com/nodejs/node/pull/2404)
* [[`b028978a53`](https://github.com/nodejs/node/commit/b028978a53)] - **src**: fix buffer overflow for long exception lines (Karl Skomski) [#2404](https://github.com/nodejs/node/pull/2404)
* [[`e73eafd7e7`](https://github.com/nodejs/node/commit/e73eafd7e7)] - **src**: fix memory leak in ExternString (Karl Skomski) [#2402](https://github.com/nodejs/node/pull/2402)
* [[`d370306de1`](https://github.com/nodejs/node/commit/d370306de1)] - **src**: only set v8 flags if argc > 1 (Evan Lucas) [#2646](https://github.com/nodejs/node/pull/2646)
* [[`ed087836af`](https://github.com/nodejs/node/commit/ed087836af)] - **streams**: refactor LazyTransform to internal/ (Brendan Ashworth) [#2566](https://github.com/nodejs/node/pull/2566)
* [[`993c22fe0e`](https://github.com/nodejs/node/commit/993c22fe0e)] - **test**: remove disabled test (Rich Trott) [#2841](https://github.com/nodejs/node/pull/2841)
* [[`1474f29d1f`](https://github.com/nodejs/node/commit/1474f29d1f)] - **test**: split up internet dns tests (Rich Trott) [#2802](https://github.com/nodejs/node/pull/2802)
* [[`601a97622b`](https://github.com/nodejs/node/commit/601a97622b)] - **test**: increase dgram timeout for armv6 (Rich Trott) [#2808](https://github.com/nodejs/node/pull/2808)
* [[`1dad19ba81`](https://github.com/nodejs/node/commit/1dad19ba81)] - **test**: remove valid hostname check in test-dns.js (Rich Trott) [#2785](https://github.com/nodejs/node/pull/2785)
* [[`f3d5891a3f`](https://github.com/nodejs/node/commit/f3d5891a3f)] - **test**: expect error for test_lookup_ipv6_hint on FreeBSD (Rich Trott) [#2724](https://github.com/nodejs/node/pull/2724)
* [[`2ffb21baf1`](https://github.com/nodejs/node/commit/2ffb21baf1)] - **test**: fix use of `common` before required (Rod Vagg) [#2685](https://github.com/nodejs/node/pull/2685)
* [[`b2c5479a14`](https://github.com/nodejs/node/commit/b2c5479a14)] - **test**: refactor to eliminate flaky test (Rich Trott) [#2609](https://github.com/nodejs/node/pull/2609)
* [[`fcfd15f8f9`](https://github.com/nodejs/node/commit/fcfd15f8f9)] - **test**: mark eval_messages as flaky (Alexis Campailla) [#2648](https://github.com/nodejs/node/pull/2648)
* [[`1865cad7ae`](https://github.com/nodejs/node/commit/1865cad7ae)] - **test**: mark test-vm-syntax-error-stderr as flaky (João Reis) [#2662](https://github.com/nodejs/node/pull/2662)
* [[`b0014ecd27`](https://github.com/nodejs/node/commit/b0014ecd27)] - **test**: mark test-repl-persistent-history as flaky (João Reis) [#2659](https://github.com/nodejs/node/pull/2659)
* [[`74ff9bc86c`](https://github.com/nodejs/node/commit/74ff9bc86c)] - **timers**: minor _unrefActive fixes and improvements (Jeremiah Senkpiel) [#2540](https://github.com/nodejs/node/pull/2540)
* [[`5d14a6eca7`](https://github.com/nodejs/node/commit/5d14a6eca7)] - **timers**: don't mutate unref list while iterating it (Julien Gilli) [#2540](https://github.com/nodejs/node/pull/2540)
* [[`6e744c58f2`](https://github.com/nodejs/node/commit/6e744c58f2)] - **timers**: Avoid linear scan in _unrefActive. (Julien Gilli) [#2540](https://github.com/nodejs/node/pull/2540)
* [[`07fbf835ad`](https://github.com/nodejs/node/commit/07fbf835ad)] - **tools**: open `test.tap` file in write-binary mode (Sakthipriyan Vairamani) [#2837](https://github.com/nodejs/node/pull/2837)
* [[`6d9198f7f1`](https://github.com/nodejs/node/commit/6d9198f7f1)] - **tools**: add missing tick processor polyfill (Matt Loring) [#2694](https://github.com/nodejs/node/pull/2694)
* [[`7b16597527`](https://github.com/nodejs/node/commit/7b16597527)] - **tools**: fix flakiness in test-tick-processor (Matt Loring) [#2694](https://github.com/nodejs/node/pull/2694)
* [[`ef83029356`](https://github.com/nodejs/node/commit/ef83029356)] - **tools**: remove hyphen in TAP result (Sakthipriyan Vairamani) [#2718](https://github.com/nodejs/node/pull/2718)
* [[`ac45ef9157`](https://github.com/nodejs/node/commit/ac45ef9157)] - **win,msi**: corregir url de atajo a la documentación (Brian White) [#2781](https://github.com/nodejs/node/pull/2781)

<a id="3.3.0"></a>

## 2015-09-02, Versión 3.3.0, @rvagg

### Cambios notables

* **build**: Añadir a `configure` una opción de `--link-module` que pueda ser usada para juntar módulos de JavaScript adicionales en un binario compilado (Bradley Meck) [#2497](https://github.com/nodejs/node/pull/2497)
* **docs**: Unificar actualizaciones de doc sobresalientes desde joyent/node (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* **http_parser**: Una mejora de rendimiento significativa, al hacer que `http.Server`consuma todos los datos iniciales de su `net.Socket` y realice análisis de manera directa, sin tener que ingresar a JavaScript. El uso de listeners de `'data'` en el `net.Socket` causará que los datos sean "desconsumidos" en JavaScript, deshaciendo, por ende, cualquier ganancia obtenida para el rendimiento. (Fedor Indutny) [#2355](https://github.com/nodejs/node/pull/2355)
* **libuv**: Actualizar a 1.7.3 (from 1.6.1), vea [ChangeLog](https://github.com/libuv/libuv/blob/v1.x/ChangeLog) para detalles (Saúl Ibarra Corretgé) [#2310](https://github.com/nodejs/node/pull/2310)
* **V8**: Actualizar a 4.4.63.30 (from 4.4.63.26) (Michaël Zasso) [#2482](https://github.com/nodejs/node/pull/2482)

### Problemas conocidos

Vea https://github.com/nodejs/io.js/labels/confirmed-bug para una lista completa y actual de todos los problemas conocidos.

* Algunos usos de las propiedades abreviadas de objetos computados no son manejados correctamente por la versión actual de V8. p. ej `[{ [prop]: val }]` se evalúa a `[{}]`. [#2507](https://github.com/nodejs/node/issues/2507)
* Algunos problemas con temporizadores sin referencia que se ejecutan durante `beforeExit` todavía están por resolverse. Vea [#1264](https://github.com/nodejs/io.js/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/io.js/issues/690)
* `process.send()` no es sincrónico, como lo sugieren los documentos, una regresión introducida en 1.0.2, vea [#760](https://github.com/nodejs/io.js/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta de DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/io.js/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/io.js/issues/1435).

### Commits

* [[`1a531b4e44`](https://github.com/nodejs/node/commit/1a531b4e44)] - **(SEMVER-MINOR)** Introducir --link-module a ./configure (Bradley Meck) [#2497](https://github.com/nodejs/node/pull/2497)
* [[`d2f314c190`](https://github.com/nodejs/node/commit/d2f314c190)] - **build**: corregir la llamada a chmod para cargas de lanzamiento que se encuentra obstruida (Rod Vagg) [#2645](https://github.com/nodejs/node/pull/2645)
* [[`3172e9c541`](https://github.com/nodejs/node/commit/3172e9c541)] - **build**: establecer los permisos de archivo antes de la subida (Rod Vagg) [#2623](https://github.com/nodejs/node/pull/2623)
* [[`a860d7fae1`](https://github.com/nodejs/node/commit/a860d7fae1)] - **build**: cambiar el directorio escenificado en un nuevo servidor (Rod Vagg) [#2623](https://github.com/nodejs/node/pull/2623)
* [[`50c0baa8d7`](https://github.com/nodejs/node/commit/50c0baa8d7)] - **build**: renombrar el directorio 'doc' como 'docs' para la subida (Rod Vagg) [#2623](https://github.com/nodejs/node/pull/2623)
* [[`0a0577cf5f`](https://github.com/nodejs/node/commit/0a0577cf5f)] - **build**: corregir cherry-pick mal realizado para el lanzamiento de compilación de vcbuild.bat (Rod Vagg) [#2625](https://github.com/nodejs/node/pull/2625)
* [[`34de90194b`](https://github.com/nodejs/node/commit/34de90194b)] - **build**: solo definir NODE_V8_OPTIONS si no se encuentra vacío (Evan Lucas) [#2532](https://github.com/nodejs/node/pull/2532)
* [[`944174b189`](https://github.com/nodejs/node/commit/944174b189)] - **build**: crear complementos de prueba de integración continua en test/addons (Ben Noordhuis) [#2428](https://github.com/nodejs/node/pull/2428)
* [[`e955f9a1b0`](https://github.com/nodejs/node/commit/e955f9a1b0)] - **crypto**: Utilizar OPENSSL_cleanse para destruir los datos. (Сковорода Никита Андреевич) [#2575](https://github.com/nodejs/node/pull/2575)
* [[`395d736b9d`](https://github.com/nodejs/node/commit/395d736b9d)] - **debugger**: utilizar comparación de igualdad estricta (Minwoo Jung) [#2558](https://github.com/nodejs/node/pull/2558)
* [[`1d0e5210a8`](https://github.com/nodejs/node/commit/1d0e5210a8)] - **deps**: actualizar libuv a 1.7.3 (Saúl Ibarra Corretgé) [#2310](https://github.com/nodejs/node/pull/2310)
* [[`34ef53364f`](https://github.com/nodejs/node/commit/34ef53364f)] - **deps**: actualizar V8 a 4.4.63.30 (Michaël Zasso) [#2482](https://github.com/nodejs/node/pull/2482)
* [[`23579a5f4a`](https://github.com/nodejs/node/commit/23579a5f4a)] - **doc**: añadir minutas de la reunión del TSC del 2015-08-12 (Rod Vagg) [#2438](https://github.com/nodejs/node/pull/2438)
* [[`0cc59299a4`](https://github.com/nodejs/node/commit/0cc59299a4)] - **doc**: añadir minutas de la reunión del TSC del 2015-08-26 (Rod Vagg) [#2591](https://github.com/nodejs/node/pull/2591)
* [[`6efa96e33a`](https://github.com/nodejs/node/commit/6efa96e33a)] - **doc**: unificar CHANGELOG.md con el Registro de Cambios de joyent/node (Minqi Pan) [#2536](https://github.com/nodejs/node/pull/2536)
* [[`f75d54607b`](https://github.com/nodejs/node/commit/f75d54607b)] - **doc**: clarificar el comportamiento del clúster cuando no hay workers (Jeremiah Senkpiel) [#2606](https://github.com/nodejs/node/pull/2606)
* [[`8936302121`](https://github.com/nodejs/node/commit/8936302121)] - **doc**: clarificación menor en buffer.markdown (Сковорода Никита Андреевич) [#2574](https://github.com/nodejs/node/pull/2574)
* [[`0db0e53753`](https://github.com/nodejs/node/commit/0db0e53753)] - **doc**: añadir a @jasnell y @sam-github al equipo de lanzamiento (Rod Vagg) [#2455](https://github.com/nodejs/node/pull/2455)
* [[`c16e100593`](https://github.com/nodejs/node/commit/c16e100593)] - **doc**: reorganizar al equipo de lanzamiento en una sección separada (Rod Vagg) [#2455](https://github.com/nodejs/node/pull/2455)
* [[`e3e00143fd`](https://github.com/nodejs/node/commit/e3e00143fd)] - **doc**: corregir unificación mal realizada en modules.markdown (James M Snell)
* [[`2f62455880`](https://github.com/nodejs/node/commit/2f62455880)] - **doc**: correcciones y mejoras adicionales menores (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`3bd08aac4b`](https://github.com/nodejs/node/commit/3bd08aac4b)] - **doc**: actualización gramatical menor en crypto.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`f707189370`](https://github.com/nodejs/node/commit/f707189370)] - **doc**: actualización gramatical menor (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`6c98cf0266`](https://github.com/nodejs/node/commit/6c98cf0266)] - **doc**: remover declaración repetida en globals.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`48e6ccf8c2`](https://github.com/nodejs/node/commit/48e6ccf8c2)] - **doc**: remover 'dudes' de la documentación (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`b5d68f8076`](https://github.com/nodejs/node/commit/b5d68f8076)] - **doc**: actualizar el uso de los tiempos en child_process.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`242e3fe3ba`](https://github.com/nodejs/node/commit/242e3fe3ba)] - **doc**: fue corregido el tipo de worker.id (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`ea9ee15c21`](https://github.com/nodejs/node/commit/ea9ee15c21)] - **doc**: el puerto es opcional para socket.bind() (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`0ff6657a50`](https://github.com/nodejs/node/commit/0ff6657a50)] - **doc**: corregir detalles de escritura y gramática menores en los documentos del sistema de archivos (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`94d83c04f2`](https://github.com/nodejs/node/commit/94d83c04f2)] - **doc**: actualizar nombre de parámetro en net.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`04111ce40f`](https://github.com/nodejs/node/commit/04111ce40f)] - **doc**: corregir error tipográfico pequeño en domain.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`c9fdd1bbbf`](https://github.com/nodejs/node/commit/c9fdd1bbbf)] - **doc**: se corrigió un error tipográfico en net.markdown (una coma faltante) (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`27c07b3f8e`](https://github.com/nodejs/node/commit/27c07b3f8e)] - **doc**: actualizar la descripción de fs.exists en fs.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`52018e73d9`](https://github.com/nodejs/node/commit/52018e73d9)] - **doc**: clarificación sobre el evento 'close' (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`f6d3b87a25`](https://github.com/nodejs/node/commit/f6d3b87a25)] - **doc**: mejorar el trabajo en stream.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`b5da89431a`](https://github.com/nodejs/node/commit/b5da89431a)] - **doc**: actualizar la documentación de path.extname (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`1d4ea609db`](https://github.com/nodejs/node/commit/1d4ea609db)] - **doc**: pequeñas clarificaciones en modules.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`c888985591`](https://github.com/nodejs/node/commit/c888985591)] - **doc**: limpiezas del estilo de código en repl.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`105b493595`](https://github.com/nodejs/node/commit/105b493595)] - **doc**: corregir gramática en cluster.markdown (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`51b86ccac7`](https://github.com/nodejs/node/commit/51b86ccac7)] - **doc**: Clarificar que module.parent es establecido una sola vez (James M Snell) [#2378](https://github.com/nodejs/node/pull/2378)
* [[`d2ffecba2d`](https://github.com/nodejs/node/commit/d2ffecba2d)] - **doc**: añadir nota sobre los módulos internos (Jeremiah Senkpiel) [#2523](https://github.com/nodejs/node/pull/2523)
* [[`b36debd5cb`](https://github.com/nodejs/node/commit/b36debd5cb)] - **env**: introducir `KickNextTick` (Fedor Indutny) [#2355](https://github.com/nodejs/node/pull/2355)
* [[`1bc446863f`](https://github.com/nodejs/node/commit/1bc446863f)] - **http_parser**: consumir instancia de StreamBase (Fedor Indutny) [#2355](https://github.com/nodejs/node/pull/2355)
* [[`ce04b735cc`](https://github.com/nodejs/node/commit/ce04b735cc)] - **src**: only memcmp if length > 0 in Buffer::Compare (Karl Skomski) [#2544](https://github.com/nodejs/node/pull/2544)
* [[`31823e37c7`](https://github.com/nodejs/node/commit/31823e37c7)] - **src**: Código de getsockname/getpeername DRY (no repita usted mismo) (Ben Noordhuis) [#956](https://github.com/nodejs/node/pull/956)
* [[`13fd96dda3`](https://github.com/nodejs/node/commit/13fd96dda3)] - **src**: Exception::Error faltante en node_http_parser (Jeremiah Senkpiel) [#2550](https://github.com/nodejs/node/pull/2550)
* [[`42e075ae02`](https://github.com/nodejs/node/commit/42e075ae02)] - **test**: mejorar rendimiento de prueba de stringbytes (Trevor Norris) [#2544](https://github.com/nodejs/node/pull/2544)
* [[`fc726399fd`](https://github.com/nodejs/node/commit/fc726399fd)] - **test**: dejar de marcar test-process-argv-0.js como defectuosa (Rich Trott) [#2613](https://github.com/nodejs/node/pull/2613)
* [[`7727ba1394`](https://github.com/nodejs/node/commit/7727ba1394)] - **test**: hacer lint y refactorizar para evitar problema de autocrif (Roman Reiss) [#2494](https://github.com/nodejs/node/pull/2494)
* [[`c56aa829f0`](https://github.com/nodejs/node/commit/c56aa829f0)] - **test**: utilizar tmpDir en lugar de fixturesDir (Sakthipriyan Vairamani) [#2583](https://github.com/nodejs/node/pull/2583)
* [[`5e65181ea4`](https://github.com/nodejs/node/commit/5e65181ea4)] - **test**: manejar los casos de fallo adecuadamente (Sakthipriyan Vairamani) [#2206](https://github.com/nodejs/node/pull/2206)
* [[`c48b95e847`](https://github.com/nodejs/node/commit/c48b95e847)] - **test**: lista inicial de pruebas defectuosas (Alexis Campailla) [#2424](https://github.com/nodejs/node/pull/2424)
* [[`94e88498ba`](https://github.com/nodejs/node/commit/94e88498ba)] - **test**: pasar argumentos a test-ci a través de la variable env (Alexis Campailla) [#2424](https://github.com/nodejs/node/pull/2424)
* [[`09987c7a1c`](https://github.com/nodejs/node/commit/09987c7a1c)] - **test**: soportar pruebas defectuosas en test-ci (Alexis Campailla) [#2424](https://github.com/nodejs/node/pull/2424)
* [[`08b83c8b45`](https://github.com/nodejs/node/commit/08b83c8b45)] - **test**: añadir plantillas de configuración de pruebas (Alexis Campailla) [#2424](https://github.com/nodejs/node/pull/2424)
* [[`8f8ab6fa57`](https://github.com/nodejs/node/commit/8f8ab6fa57)] - **test**: el corredor debe devolver 0 en las pruebas defectuosas (Alexis Campailla) [#2424](https://github.com/nodejs/node/pull/2424)
* [[`0cfd3be9c6`](https://github.com/nodejs/node/commit/0cfd3be9c6)] - **test**: soporte del corredor para pruebas defectuosas (Alexis Campailla) [#2424](https://github.com/nodejs/node/pull/2424)
* [[`3492d2d4c6`](https://github.com/nodejs/node/commit/3492d2d4c6)] - **test**: hacer que test-process-argv-0 sea robusto (Rich Trott) [#2541](https://github.com/nodejs/node/pull/2541)
* [[`a96cc31710`](https://github.com/nodejs/node/commit/a96cc31710)] - **test**: acelerar test-child-process-spawnsync.js (Rich Trott) [#2542](https://github.com/nodejs/node/pull/2542)
* [[`856baf4c67`](https://github.com/nodejs/node/commit/856baf4c67)] - **test**: hacer que la prueba de spawnSync() sea robusta (Rich Trott) [#2535](https://github.com/nodejs/node/pull/2535)
* [[`3aa6bbb648`](https://github.com/nodejs/node/commit/3aa6bbb648)] - **tools**: actualizar release.sh para que funcione con la nuevo sitio web (Rod Vagg) [#2623](https://github.com/nodejs/node/pull/2623)
* [[`f2f0fe45ff`](https://github.com/nodejs/node/commit/f2f0fe45ff)] - **tools**: hacer que el scrapper incorporado imprima los nombres de archivo (Ben Noordhuis) [#2428](https://github.com/nodejs/node/pull/2428)
* [[`bb24c4a418`](https://github.com/nodejs/node/commit/bb24c4a418)] - **win,msi**: corregir las claves de registro de ruta de instalación (João Reis) [#2565](https://github.com/nodejs/node/pull/2565)
* [[`752977b888`](https://github.com/nodejs/node/commit/752977b888)] - **win,msi**: cambiar InstallScope a perMachine (João Reis) [#2565](https://github.com/nodejs/node/pull/2565)

<a id="3.2.0"></a>

## 2015-08-25, Versión 3.2.0, @rvagg

### Cambios notables

* **events**: Fue añadida `EventEmitter#listenerCount(event)` como un reemplazo para `EventEmitter.listenerCount(emitter, event)`, la cual ha sido marcada como desaprobada en los docs. (Sakthipriyan Vairamani) [#2349](https://github.com/nodejs/node/pull/2349)
* **module**: Se corrigió un error sucedido con los módulos pre-cargados al no existir el directorio de trabajo actual. (Bradley Meck) [#2353](https://github.com/nodejs/node/pull/2353)
* **node**: El tiempo de inicio es ahora alrededor de 5% más rápido cuando no se pasan banderas de V8. (Evan Lucas) [#2483](https://github.com/nodejs/node/pull/2483)
* **repl**: El completado de tabla ahora funciona mejor con arrays. (James M Snell) [#2409](https://github.com/nodejs/node/pull/2409)
* **string_bytes**: Se corrigió una escritura no alineada en el manejo de la codificación de UCS2. (Fedor Indutny) [#2480](https://github.com/nodejs/node/pull/2480)
* **tls**: Se añadió una nueva bandera `--tls-cipher-list` que puede ser usada para anular la lista de cifrados predeterminada incorporada. (James M Snell) [#2412](https://github.com/nodejs/node/pull/2412) _Nota: Se sugiere que utilice la lista de cifrados incorporada, ya que ha sido seleccionada cuidadosamente para reflejar las mejores prácticas de seguridad y mitigación de riesgos actuales. _

### Problemas conocidos

Vea https://github.com/nodejs/io.js/labels/confirmed-bug para una lista actual y completa de problemas conocidos.

* Algunos usos de las propiedades abreviadas de objetos computados no son manejadas correctamente por la versión actual de V8. p. ej. `[{ [prop]: val }]` se evalúa a `[{}]`. [#2507](https://github.com/nodejs/node/issues/2507)
* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/io.js/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/io.js/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/io.js/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/io.js/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/io.js/issues/1435).

### Commits

* [[`1cd794f129`](https://github.com/nodejs/node/commit/1cd794f129)] - **buffer**: reaplicar 07c0667 (Fedor Indutny) [#2487](https://github.com/nodejs/node/pull/2487)
* [[`156781dedd`](https://github.com/nodejs/node/commit/156781dedd)] - **build**: usar la plataforma requerida en android-configure (Evan Lucas) [#2501](https://github.com/nodejs/node/pull/2501)
* [[`77075ec906`](https://github.com/nodejs/node/commit/77075ec906)] - **crypto**: arreglar {de}allocation de mem en ExportChallenge (Karl Skomski) [#2359](https://github.com/nodejs/node/pull/2359)
* [[`cb30414d9e`](https://github.com/nodejs/node/commit/cb30414d9e)] - **doc**: sincronizar CHANGELOG.md desde el maestro (Roman Reiss) [#2524](https://github.com/nodejs/node/pull/2524)
* [[`9330f5ef45`](https://github.com/nodejs/node/commit/9330f5ef45)] - **doc**: hacer que las desaprobaciones sean consistentes (Sakthipriyan Vairamani) [#2450](https://github.com/nodejs/node/pull/2450)
* [[`09437e0146`](https://github.com/nodejs/node/commit/09437e0146)] - **doc**: corregir los comentarios en tls_wrap.cc y _http_client.js (Minwoo Jung) [#2489](https://github.com/nodejs/node/pull/2489)
* [[`c9867fed29`](https://github.com/nodejs/node/commit/c9867fed29)] - **doc**: documentar response.finished en http.markdown (hackerjs) [#2414](https://github.com/nodejs/node/pull/2414)
* [[`7f23a83c42`](https://github.com/nodejs/node/commit/7f23a83c42)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#2505](https://github.com/nodejs/node/pull/2505)
* [[`cd0c362f67`](https://github.com/nodejs/node/commit/cd0c362f67)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#2318](https://github.com/nodejs/node/pull/2318)
* [[`2c7b9257ea`](https://github.com/nodejs/node/commit/2c7b9257ea)] - **doc**: añadir minutas de la reunión del TSC del 2015-07-29 (Rod Vagg) [#2437](https://github.com/nodejs/node/pull/2437)
* [[`aaefde793e`](https://github.com/nodejs/node/commit/aaefde793e)] - **doc**: añadir minutas de la reunión del TSC del 2015-08-19 (Rod Vagg) [#2460](https://github.com/nodejs/node/pull/2460)
* [[`51ef9106f5`](https://github.com/nodejs/node/commit/51ef9106f5)] - **doc**: añadir minutas de la reunión del TSC del 2015-06-03 (Rod Vagg) [#2453](https://github.com/nodejs/node/pull/2453)
* [[`7130b4cf1d`](https://github.com/nodejs/node/commit/7130b4cf1d)] - **doc**: corregir los enlaces al repo convergido original (Rod Vagg) [#2454](https://github.com/nodejs/node/pull/2454)
* [[`14f2aee1df`](https://github.com/nodejs/node/commit/14f2aee1df)] - **doc**: corregir enlaces a las publicaciones de gh originales para las reuniones del TSC (Rod Vagg) [#2454](https://github.com/nodejs/node/pull/2454)
* [[`87a9ef0a40`](https://github.com/nodejs/node/commit/87a9ef0a40)] - **doc**: añadir los enlaces a las grabaciones de audio a las minutas de reuniones del TSC (Rod Vagg) [#2454](https://github.com/nodejs/node/pull/2454)
* [[`f5cf24afbc`](https://github.com/nodejs/node/commit/f5cf24afbc)] - **doc**: añadir minutas de reunión del TSC 2015-07-22 (Rod Vagg) [#2436](https://github.com/nodejs/node/pull/2436)
* [[`3f821b96eb`](https://github.com/nodejs/node/commit/3f821b96eb)] - **doc**: corregir error de escritura en un comentario de node.js (Jacob Edelman) [#2391](https://github.com/nodejs/node/pull/2391)
* [[`3e6a6fcdd6`](https://github.com/nodejs/node/commit/3e6a6fcdd6)] - **(SEMVER-MINOR)** **events**: deprecate static listenerCount function (Sakthipriyan Vairamani) [#2349](https://github.com/nodejs/node/pull/2349)
* [[`023386c852`](https://github.com/nodejs/node/commit/023386c852)] - **fs**: reemplazar macro de bad_args con mensaje de error concreto (Roman Klauke) [#2495](https://github.com/nodejs/node/pull/2495)
* [[`d1c27b2e29`](https://github.com/nodejs/node/commit/d1c27b2e29)] - **module**: corregir pre-carga de módulos cuando cwd es ENOENT (Bradley Meck) [#2353](https://github.com/nodejs/node/pull/2353)
* [[`5d7486941b`](https://github.com/nodejs/node/commit/5d7486941b)] - **repl**: filtrar claves de enteros desde lista completa de tabs de repl (James M Snell) [#2409](https://github.com/nodejs/node/pull/2409)
* [[`7f02443a9a`](https://github.com/nodejs/node/commit/7f02443a9a)] - **repl**: no arrojar ENOENT ante NODE_REPL_HISTORY_FILE (Todd Kennedy) [#2451](https://github.com/nodejs/node/pull/2451)
* [[`56a2ae9cef`](https://github.com/nodejs/node/commit/56a2ae9cef)] - **src**: mejorar el tiempo de inicio (Evan Lucas) [#2483](https://github.com/nodejs/node/pull/2483)
* [[`14653c7429`](https://github.com/nodejs/node/commit/14653c7429)] - **stream**: renombrar función mal nombrada (Ben Noordhuis) [#2479](https://github.com/nodejs/node/pull/2479)
* [[`1c6e014bfa`](https://github.com/nodejs/node/commit/1c6e014bfa)] - **stream**: micro-optimizar el cálculo de la marca de agua alta (Ben Noordhuis) [#2479](https://github.com/nodejs/node/pull/2479)
* [[`f1f4b4c46d`](https://github.com/nodejs/node/commit/f1f4b4c46d)] - **stream**: corregir error off-by-factor-16 en comentario (Ben Noordhuis) [#2479](https://github.com/nodejs/node/pull/2479)
* [[`2d3f09bd76`](https://github.com/nodejs/node/commit/2d3f09bd76)] - **stream_base**: varias mejoras (Fedor Indutny) [#2351](https://github.com/nodejs/node/pull/2351)
* [[`c1ce423b35`](https://github.com/nodejs/node/commit/c1ce423b35)] - **string_bytes**: corregir escritura no alineada en UCS2 (Fedor Indutny) [#2480](https://github.com/nodejs/node/pull/2480)
* [[`e4d0e86165`](https://github.com/nodejs/node/commit/e4d0e86165)] - **test**: refactorizar test-https-simple.js (Rich Trott) [#2433](https://github.com/nodejs/node/pull/2433)
* [[`0ea5c8d737`](https://github.com/nodejs/node/commit/0ea5c8d737)] - **test**: remover test-timers-first-fire (João Reis) [#2458](https://github.com/nodejs/node/pull/2458)
* [[`536c3d0537`](https://github.com/nodejs/node/commit/536c3d0537)] - **test**: usar IP reservada en test-net-connect-timeout (Rich Trott) [#2257](https://github.com/nodejs/node/pull/2257)
* [[`5df06fd8df`](https://github.com/nodejs/node/commit/5df06fd8df)] - **test**: añadir espacios luego de las palabras clave (Brendan Ashworth)
* [[`e714b5620e`](https://github.com/nodejs/node/commit/e714b5620e)] - **test**: remover código inalcanzable (Michaël Zasso) [#2289](https://github.com/nodejs/node/pull/2289)
* [[`3579f3a2a4`](https://github.com/nodejs/node/commit/3579f3a2a4)] - **test**: no permitir código inalcanzable (Michaël Zasso) [#2289](https://github.com/nodejs/node/pull/2289)
* [[`3545e236fc`](https://github.com/nodejs/node/commit/3545e236fc)] - **test**: reducir tiempos de espera en test-net-keepalive (Brendan Ashworth) [#2429](https://github.com/nodejs/node/pull/2429)
* [[`b60e690023`](https://github.com/nodejs/node/commit/b60e690023)] - **test**: mejorar test-net-server-pause-on-connect (Brendan Ashworth) [#2429](https://github.com/nodejs/node/pull/2429)
* [[`11d1b8fcaf`](https://github.com/nodejs/node/commit/11d1b8fcaf)] - **test**: mejorar test-net-pingpong (Brendan Ashworth) [#2429](https://github.com/nodejs/node/pull/2429)
* [[`5fef5c6562`](https://github.com/nodejs/node/commit/5fef5c6562)] - **(SEMVER-MINOR)** **tls**: add --tls-cipher-list command line switch (James M Snell) [#2412](https://github.com/nodejs/node/pull/2412)
* [[`d9b70f9cbf`](https://github.com/nodejs/node/commit/d9b70f9cbf)] - **tls**: manejar certificado vacío en checkServerIndentity (Mike Atkins) [#2343](https://github.com/nodejs/node/pull/2343)
* [[`4f8e34c202`](https://github.com/nodejs/node/commit/4f8e34c202)] - **tools**: añadir boilerplate de licencia a check-imports.sh (James M Snell) [#2386](https://github.com/nodejs/node/pull/2386)
* [[`b76b9197f9`](https://github.com/nodejs/node/commit/b76b9197f9)] - **tools**: habilitar space-after-keywords en eslint (Brendan Ashworth)
* [[`64a8f30a70`](https://github.com/nodejs/node/commit/64a8f30a70)] - **tools**: corregir anclas en documentos generados (Sakthipriyan Vairamani) [#2491](https://github.com/nodejs/node/pull/2491)
* [[`22e344ea10`](https://github.com/nodejs/node/commit/22e344ea10)] - **win**: corregir acciones personalizadas para WiX más antiguos que 3.9 (João Reis) [#2365](https://github.com/nodejs/node/pull/2365)
* [[`b5bd3ebfc8`](https://github.com/nodejs/node/commit/b5bd3ebfc8)] - **win**: corregir acciones personalizadas en Visual Studio != 2013 (Julien Gilli) [#2365](https://github.com/nodejs/node/pull/2365)

<a id="3.1.0"></a>

## 2015-08-18, Versión 3.1.0, @Fishrock123

### Cambios notables

* **buffer**: Se corrigió un par de fugas de memoria grandes (Ben Noordhuis) [#2352](https://github.com/nodejs/node/pull/2352).
* **crypto**:
  - Se corrigió un par de fugas de memoria menores (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375).
  - El inicio de sesión ahora revisa en busca de errores de OpenSSL (Minqi Pan) [#2342](https://github.com/nodejs/node/pull/2342). **Tenga en cuenta que esto puede exponer errores previamente escondidos en el código de usuario.**
* **intl**: Intl support using small-icu is now enabled by default in builds (Steven R. Loomis) [#2264](https://github.com/nodejs/node/pull/2264).
  - [`String#normalize()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) puede ser usada ahora para la normalización de unicode.
  - El objeto [`Intl`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Intl) y varios métodos `String` y `Number` se encuentran presentes, pero solo soportan la configuración del inglés.
  - Para el soporte de todos los locales, node debe ser compilado con [full-icu](https://github.com/nodejs/node#build-with-full-icu-support-all-locales-supported-by-icu).
* **tls**: Se corrigió el rendimiento de tls, siendo mucho más bajo tras una unificación errada (Fedor Indutny) [#2381](https://github.com/nodejs/node/pull/2381).
* **tools**: The v8 tick processor now comes bundled with node (Matt Loring) [#2090](https://github.com/nodejs/node/pull/2090).
  - Este puede ser utilizado mediante la producción de outputs del rendimiento del perfilado al ejecutar node con `--perf`, y luego ejecutando su script de la plataforma adecuado en el output, tal como se encuentra en [tools/v8-prof](https://github.com/nodejs/node/tree/master/tools/v8-prof).
* **util**: `util.inspect(obj)` ahora imprime el nombre del constructor del objeto, si existe uno (Christopher Monsanto) [#1935](https://github.com/nodejs/io.js/pull/1935).

### Problemas conocidos

Vea https://github.com/nodejs/io.js/labels/confirmed-bug para una lista actual y completa de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/io.js/issues/1264).
* El part sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/io.js/issues/690)
* `process.send()` no es sincrónico, como lo sugieren los documentos, una regresión introducida en 1.0.2, vea [#760](https://github.com/nodejs/io.js/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/io.js/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/io.js/issues/1435).

### Commits

* [[`3645dc62ed`](https://github.com/nodejs/node/commit/3645dc62ed)] - **build**: work around VS2015 issue in ICU <56 (Steven R. Loomis) [#2283](https://github.com/nodejs/node/pull/2283)
* [[`1f12e03266`](https://github.com/nodejs/node/commit/1f12e03266)] - **(SEMVER-MINOR)** **build**: intl: converge from joyent/node (Steven R. Loomis) [#2264](https://github.com/nodejs/node/pull/2264)
* [[`071640abdd`](https://github.com/nodejs/node/commit/071640abdd)] - **build**: Intl: empujar ICU4C de 54 a 55 (Steven R. Loomis) [#2293](https://github.com/nodejs/node/pull/2293)
* [[`07a88b0c8b`](https://github.com/nodejs/node/commit/07a88b0c8b)] - **build**: actualizar manifiesto para incluir Windows 10 (Lucien Greathouse) [#2332](https://github.com/nodejs/io.js/pull/2332)
* [[`0bb099f444`](https://github.com/nodejs/node/commit/0bb099f444)] - **build**: expandir ~ tempranamente en la instalación de prefijo (Ben Noordhuis) [#2307](https://github.com/nodejs/io.js/pull/2307)
* [[`7fe6dd8f5d`](https://github.com/nodejs/node/commit/7fe6dd8f5d)] - **crypto**: revisar en busca de errores de OpenSSL al firmar (Minqi Pan) [#2342](https://github.com/nodejs/node/pull/2342)
* [[`605f6ee904`](https://github.com/nodejs/node/commit/605f6ee904)] - **crypto**: corregir fuga de memoria en PBKDF2Request (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375)
* [[`ba6eb8af12`](https://github.com/nodejs/node/commit/ba6eb8af12)] - **crypto**: corregir fuga de memoria en ECDH::SetPrivateKey (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375)
* [[`6a16368611`](https://github.com/nodejs/node/commit/6a16368611)] - **crypto**: corregir fuga de memoria en PublicKeyCipher::Cipher (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375)
* [[`a760a87803`](https://github.com/nodejs/node/commit/a760a87803)] - **crypto**: corregir fuga de memoria en SafeX509ExtPrint (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375)
* [[`f45487cd6e`](https://github.com/nodejs/node/commit/f45487cd6e)] - **crypto**: corregir fuga de memoria en SetDHParam (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375)
* [[`2ff183dd86`](https://github.com/nodejs/node/commit/2ff183dd86)] - **doc**: Actualizar instrucciones de FIPS en README.md (Michael Dawson) [#2278](https://github.com/nodejs/node/pull/2278)
* [[`6483bc2e8f`](https://github.com/nodejs/node/commit/6483bc2e8f)] - **doc**: clarificar las opciones para fs.watchFile() (Rich Trott) [#2425](https://github.com/nodejs/node/pull/2425)
* [[`e76822f454`](https://github.com/nodejs/node/commit/e76822f454)] - **doc**: múltiples actualizaciones de documentación a las que se les hizo cherry-pick desde la v0.12 (James M Snell) [#2302](https://github.com/nodejs/io.js/pull/2302)
* [[`1738c9680b`](https://github.com/nodejs/node/commit/1738c9680b)] - **net**: asegurarse de que la dirección reportada por el Socket es la actual (Ryan Graham) [#2095](https://github.com/nodejs/io.js/pull/2095)
* [[`844d3f0e3e`](https://github.com/nodejs/node/commit/844d3f0e3e)] - **path**: utilizar '===' en lugar de '==' al hacer comparaciones (Sam Stites) [#2388](https://github.com/nodejs/node/pull/2388)
* [[`7118b8a882`](https://github.com/nodejs/node/commit/7118b8a882)] - **path**: remover código muerto en beneficio de las pruebas de unidades (Nathan Woltman) [#2282](https://github.com/nodejs/io.js/pull/2282)
* [[`34f2cfa806`](https://github.com/nodejs/node/commit/34f2cfa806)] - **src**: mejorar el mensaje de error ante malloc de Buffer fallido (Karl Skomski) [#2422](https://github.com/nodejs/node/pull/2422)
* [[`b196c1da3c`](https://github.com/nodejs/node/commit/b196c1da3c)] - **src**: corregir fuga de memoria en DLOpen (Karl Skomski) [#2375](https://github.com/nodejs/node/pull/2375)
* [[`d1307b2995`](https://github.com/nodejs/node/commit/d1307b2995)] - **src**: no utilizar fopen() en la ruta rápida de require() (Ben Noordhuis) [#2377](https://github.com/nodejs/node/pull/2377)
* [[`455ec570d1`](https://github.com/nodejs/node/commit/455ec570d1)] - **src**: renombrar Buffer::Use() como Buffer::New() (Ben Noordhuis) [#2352](https://github.com/nodejs/node/pull/2352)
* [[`fd63e1ce2b`](https://github.com/nodejs/node/commit/fd63e1ce2b)] - **src**: introducir función Buffer::Copy() interna (Ben Noordhuis) [#2352](https://github.com/nodejs/node/pull/2352)
* [[`5586ceca13`](https://github.com/nodejs/node/commit/5586ceca13)] - **src**: mover funciones internas afuera de node_buffer.h (Ben Noordhuis) [#2352](https://github.com/nodejs/node/pull/2352)
* [[`bff9bcddb6`](https://github.com/nodejs/node/commit/bff9bcddb6)] - **src**: conectar fugas de memoria (Ben Noordhuis) [#2352](https://github.com/nodejs/node/pull/2352)
* [[`ccf12df4f3`](https://github.com/nodejs/node/commit/ccf12df4f3)] - **(SEMVER-MINOR)** **src**: add total_available_size to v8 statistics (Roman Klauke) [#2348](https://github.com/nodejs/io.js/pull/2348)
* [[`194eeb841b`](https://github.com/nodejs/node/commit/194eeb841b)] - **test**: quitar Isolate::GetCurrent() de las pruebas de complementos (Ben Noordhuis) [#2427](https://github.com/nodejs/node/pull/2427)
* [[`46cdb2f6e2`](https://github.com/nodejs/node/commit/46cdb2f6e2)] - **test**: hacer lint a las pruebas de complementos (Ben Noordhuis) [#2427](https://github.com/nodejs/node/pull/2427)
* [[`850c794882`](https://github.com/nodejs/node/commit/850c794882)] - **test**: refactorizar test-fs-watchfile.js (Rich Trott) [#2393](https://github.com/nodejs/node/pull/2393)
* [[`a3160c0a33`](https://github.com/nodejs/node/commit/a3160c0a33)] - **test**: corregir la ortografía de 'childProcess' (muddletoes) [#2389](https://github.com/nodejs/node/pull/2389)
* [[`e51f90d747`](https://github.com/nodejs/node/commit/e51f90d747)] - **test**: opción para ejecutar un subconjunto de pruebas (João Reis) [#2260](https://github.com/nodejs/io.js/pull/2260)
* [[`cc46d3bca3`](https://github.com/nodejs/node/commit/cc46d3bca3)] - **test**: clarificar llamada de dropMembership() (Rich Trott) [#2062](https://github.com/nodejs/io.js/pull/2062)
* [[`0ee4df9c7a`](https://github.com/nodejs/node/commit/0ee4df9c7a)] - **test**: hacer que el servidor/cluster de listen-fd sea más robusto (Sam Roberts) [#1944](https://github.com/nodejs/io.js/pull/1944)
* [[`cf9ba81398`](https://github.com/nodejs/node/commit/cf9ba81398)] - **test**: abordar problemas de tiempo en pruebas de http simples (Gireesh Punathil) [#2294](https://github.com/nodejs/io.js/pull/2294)
* [[`cbb75c4f86`](https://github.com/nodejs/node/commit/cbb75c4f86)] - **tls**: corregir problemas de rendimiento tras una unificación incorrecta (Fedor Indutny) [#2381](https://github.com/nodejs/node/pull/2381)
* [[`94b765f409`](https://github.com/nodejs/node/commit/94b765f409)] - **tls**: corregir revisión de sesión reutilizada (Fedor Indutny) [#2312](https://github.com/nodejs/io.js/pull/2312)
* [[`e83a41ad65`](https://github.com/nodejs/node/commit/e83a41ad65)] - **tls**: introducir `onticketkeycallback` interna (Fedor Indutny) [#2312](https://github.com/nodejs/io.js/pull/2312)
* [[`fb0f5d733f`](https://github.com/nodejs/node/commit/fb0f5d733f)] - **(SEMVER-MINOR)** **tools**: run the tick processor without building v8 (Matt Loring) [#2090](https://github.com/nodejs/node/pull/2090)
* [[`7606bdb897`](https://github.com/nodejs/node/commit/7606bdb897)] - **(SEMVER-MINOR)** **util**: display constructor when inspecting objects (Christopher Monsanto) [#1935](https://github.com/nodejs/io.js/pull/1935)

<a id="3.0.0"></a>

## 2015-08-04, Versión 3.0.0, @rvagg

### Cambios notables

* **buffer**:
  - Debido a cambios en V8, ha sido necesario reimplementar `Buffer` por encima del `Uint8Array` de V8. Cada esfuerzo ha sido hecho para minimizar el impacto en el rendimiento, sin embargo, la instanciación de `Buffer` es considerablemente más lenta. Las operaciones de acceso pueden ser más rápidas en algunas circunstancias, pero el perfil de rendimiento exacto y la diferencia respecto a versiones anteriores dependerá de cómo se utiliza `Buffer` en las aplicaciones. (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825).
  - `Buffer` ahora puede tomar `ArrayBuffer`s como un argumento constructor (Trevor Norris) [#2002](https://github.com/nodejs/node/pull/2002).
  - Cuando un buffer simple sea pasado a `Buffer.concat()`, se devolverá un objeto `Buffer` nuevo con copia; el comportamiento previo era devolver el objeto `Buffer` original (Sakthipriyan Vairamani) [#1937](https://github.com/nodejs/node/pull/1937).
* **build**: Se ha añadido el soporte de PPC al núcleo para permitir la compilación en BE y LE de pLinux (el soporte para AIX viene pronto) (Michael Dawson) [#2124](https://github.com/nodejs/node/pull/2124).
* **dgram**: si ocurre un error dentro de `socket.send()` y una callback ha sido proporcionada, el error solo será pasado a la callback como el primer argumento y no será emitido en el objeto `socket`; el comportamiento previo consistía en hacer ambas cosas (Matteo Collina & Chris Dickinson) [#1796](https://github.com/nodejs/node/pull/1796)
* **freelist**: Desaprobar el módulo del núcleo de la `freelist` sin documentación (Sakthipriyan Vairamani) [#2176](https://github.com/nodejs/node/pull/2176).
* **http**:
  - Ahora todos los códigos de estado utilizan los [nombres IANA](http://www.iana.org/assignments/http-status-codes) oficiales, como indica [RFC7231](https://tools.ietf.org/html/rfc7231), p.ej., `http.STATUS_CODES[414]` ahora devuelve `'URI Too Long'`, en lugar de `'Request-URI Too Large'` (jomo) [#1470](https://github.com/nodejs/node/pull/1470).
  - Llamar a .getName() en un agente HTTPS ya no devolverá dos puntos finales, los agentes HTTPS ya no devolverán dos puntos extra hacia el centro de la string (Brendan Ashworth) [#1617](https://github.com/nodejs/node/pull/1617).
* **node**:
  - `NODE_MODULE_VERSION` ha sido empujada a `45` para reflejar la ruptura en ABI (Rod Vagg) [#2096](https://github.com/nodejs/node/pull/2096).
  - Introducir un nuevo objeto `process.release` que contenga una propiedad `name` establecida a `'io.js'` y propiedades `sourceUrl`, `headersUrl` y `libUrl` (solo en Windows) que contengan las URLs de los recursos relevantes; esto está destinado a ser utilizado por node-gyp (Rod Vagg) [#2154](https://github.com/nodejs/node/pull/2154).
  - La versión de node-gyp empaquetada con io.js ahora descarga y utiliza un tarball de archivos de cabecera desde iojs.org, en lugar de la fuente completa para la compilación de complementos nativos; se espera que esto sea un parche flotante temporal y que el cambio sea cargado a node-gyp pronto (Rod Vagg) [#2066](https://github.com/nodejs/node/pull/2066).
* **repl**: El historial persistente ahora está habilitado por defecto. El archivo de historial está localizado en ~/.node_repl_history, la cual puede ser anulada por la nueva variable de ambiente `NODE_REPL_HISTORY`. Esto desaprueba la variable `NODE_REPL_HISTORY_FILE` previa. Adicionalmente, el formato del archivo ha sido cambiado a texto sin formato para hacer un mejor manejo de la corrupción de archivo. (Jeremiah Senkpiel) [#2224](https://github.com/nodejs/node/pull/2224).
* **smalloc**: El módulo `smalloc` ha sido removido, ya que no es posible proporcionar la API, por cambios en V8 (Ben Noordhuis) [#2022](https://github.com/nodejs/node/pull/2022).
* **tls**: Añadir los métodos `server.getTicketKeys()` y `server.setTicketKeys()` para la rotación de [clave de sesión de TLS](https://www.ietf.org/rfc/rfc5077.txt) (Fedor Indutny) [#2227](https://github.com/nodejs/node/pull/2227).
* **v8**: Upgraded to 4.4.63.26
  - ES6: [Nombres de propiedades computadas](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#Computed_property_names) habilitados
  - ES6: Ahora `array` puede ser subclasificado en el modo estricto
  - ES6: Implementar [parámetros rest](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/rest_parameters) en la escenificación, utilizar la bandera de línea de comandos `--harmony-rest-parameters`
  - ES6: Implementar el [operador de extensión](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator) en la escenificación, utilizar la línea de comandos `--harmony-spreadcalls`
  - Removed `SetIndexedPropertiesToExternalArrayData` and related APIs, forcing a shift to `Buffer` to be reimplemented based on `Uint8Array`
  - Introduction of `Maybe` and `MaybeLocal` C++ API for objects which _may_ or _may not_ have a value.
  - Se añadió soporte para PPC

Vea también https://github.com/nodejs/node/wiki/Breaking-Changes#300-from-2x para un resumen de los cambios de ruptura (SEMVER-MAJOR).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica, como sugieren los docs, una regresión introducida en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación de la url al resolver entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`60a974d200`](https://github.com/nodejs/node/commit/60a974d200)] - **buffer**: corregir la revisión nula/indefinida (Trevor Norris) [#2195](https://github.com/nodejs/node/pull/2195)
* [[`e6ab2d92bc`](https://github.com/nodejs/node/commit/e6ab2d92bc)] - **buffer**: corregir la no-devolución ante error (Trevor Norris) [#2225](https://github.com/nodejs/node/pull/2225)
* [[`1057d1186b`](https://github.com/nodejs/node/commit/1057d1186b)] - **buffer**: renombrar internal/buffer_new.js como buffer.js (Ben Noordhuis) [#2022](https://github.com/nodejs/node/pull/2022)
* [[`4643b8b667`](https://github.com/nodejs/node/commit/4643b8b667)] - **(SEMVER-MINOR)** **buffer**: allow ArrayBuffer as Buffer argument (Trevor Norris) [#2002](https://github.com/nodejs/node/pull/2002)
* [[`e5ada116cd`](https://github.com/nodejs/node/commit/e5ada116cd)] - **buffer**: limpieza menor desde rebase (Trevor Norris) [#2003](https://github.com/nodejs/node/pull/2003)
* [[`b625ab4242`](https://github.com/nodejs/node/commit/b625ab4242)] - **buffer**: corregir el uso de kMaxLength (Trevor Norris) [#2003](https://github.com/nodejs/node/pull/2003)
* [[`eea66e2a7b`](https://github.com/nodejs/node/commit/eea66e2a7b)] - **(SEMVER-MAJOR)** **buffer**: fix case of one buffer passed to concat (Sakthipriyan Vairamani) [#1937](https://github.com/nodejs/node/pull/1937)
* [[`8664084166`](https://github.com/nodejs/node/commit/8664084166)] - **buffer**: hacer cambios adicionales a la API nativa (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`36f78f4c1c`](https://github.com/nodejs/node/commit/36f78f4c1c)] - **buffer**: cambiar API para devolver MaybeLocal<T> (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`571ec13841`](https://github.com/nodejs/node/commit/571ec13841)] - **buffer**: cambiar para usar API de<T> Maybe (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`d75f5c8d0e`](https://github.com/nodejs/node/commit/d75f5c8d0e)] - **buffer**: finalizar la implementación de FreeCallback (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`63da0dfd3a`](https://github.com/nodejs/node/commit/63da0dfd3a)] - **buffer**: implementar Buffer respaldado por Uint8Array (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`23be6ca189`](https://github.com/nodejs/node/commit/23be6ca189)] - **buffer**: permitir que ARGS_THIS acepte un nombre (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`971de5e417`](https://github.com/nodejs/node/commit/971de5e417)] - **build**: preparar al instalador de Windows para soporte de i18n (Frederic Hemberger) [#2247](https://github.com/nodejs/node/pull/2247)
* [[`2ba8b23661`](https://github.com/nodejs/node/commit/2ba8b23661)] - **build**: añadir de nuevo la opción 'x86' en la configuración (Rod Vagg) [#2233](https://github.com/nodejs/node/pull/2233)
* [[`b4226e797a`](https://github.com/nodejs/node/commit/b4226e797a)] - **build**: primer conjunto de actualizaciones para habilitar el soporte de PPC (Michael Dawson) [#2124](https://github.com/nodejs/node/pull/2124)
* [[`24dd016deb`](https://github.com/nodejs/node/commit/24dd016deb)] - **build**: producir archivos de mapas de symbol en windows (Ali Ijaz Sheikh) [#2243](https://github.com/nodejs/node/pull/2243)
* [[`423d8944ce`](https://github.com/nodejs/node/commit/423d8944ce)] - **cluster**: no establecer --debug-port incondicionalmente (cjihrig) [#1949](https://github.com/nodejs/node/pull/1949)
* [[`fa98b97171`](https://github.com/nodejs/node/commit/fa98b97171)] - **cluster**: añadir "colillas" de ref/unref en el modo rr (Ben Noordhuis) [#2274](https://github.com/nodejs/node/pull/2274)
* [[`944f68046c`](https://github.com/nodejs/node/commit/944f68046c)] - **crypto**: remover kMaxLength de randomBytes() (Trevor Norris) [#1825](https://github.com/nodejs/node/pull/1825)
* [[`3d3c687012`](https://github.com/nodejs/node/commit/3d3c687012)] - **deps**: actualizar V8 a 4.4.63.26 (Michaël Zasso) [#2220](https://github.com/nodejs/node/pull/2220)
* [[`3aad4fa89a`](https://github.com/nodejs/node/commit/3aad4fa89a)] - **deps**: actualizar v8 a 4.4.63.12 (Ben Noordhuis) [#2092](https://github.com/nodejs/node/pull/2092)
* [[`70d1f32f56`](https://github.com/nodejs/node/commit/70d1f32f56)] - **(SEMVER-MAJOR)** **deps**: update v8 to 4.4.63.9 (Ben Noordhuis) [#2022](https://github.com/nodejs/node/pull/2022)
* [[`deb7ee93a7`](https://github.com/nodejs/node/commit/deb7ee93a7)] - **deps**: hacer backport a 7b24219346 desde upstream de v8 (Rod Vagg) [#1805](https://github.com/nodejs/node/pull/1805)
* [[`d58e780504`](https://github.com/nodejs/node/commit/d58e780504)] - **(SEMVER-MAJOR)** **deps**: update v8 to 4.3.61.21 (Chris Dickinson) [iojs/io.js#1632](https://github.com/iojs/io.js/pull/1632)
* [[`2a63cf612b`](https://github.com/nodejs/node/commit/2a63cf612b)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`bf63266460`](https://github.com/nodejs/node/commit/bf63266460)] - **deps**: actualizar a npm 2.13.3 (Kat Marchán) [#2284](https://github.com/nodejs/node/pull/2284)
* [[`ef2c8cd4ec`](https://github.com/nodejs/node/commit/ef2c8cd4ec)] - **(SEMVER-MAJOR)** **dgram**: make send cb act as "error" event handler (Matteo Collina) [#1796](https://github.com/nodejs/node/pull/1796)
* [[`3da057fef6`](https://github.com/nodejs/node/commit/3da057fef6)] - **(SEMVER-MAJOR)** **dgram**: make send cb act as "error" event handler (Chris Dickinson) [#1796](https://github.com/nodejs/node/pull/1796)
* [[`df1994fe53`](https://github.com/nodejs/node/commit/df1994fe53)] - ***Revert*** "**dns**: remove AI_V4MAPPED hint flag on FreeBSD" (cjihrig) [iojs/io.js#1555](https://github.com/iojs/io.js/pull/1555)
* [[`1721968b22`](https://github.com/nodejs/node/commit/1721968b22)] - **doc**: documentar cambios del historial persistente de repl (Jeremiah Senkpiel) [#2224](https://github.com/nodejs/node/pull/2224)
* [[`d12df7f159`](https://github.com/nodejs/node/commit/d12df7f159)] - **doc**: actualizar las banderas de v8 en la página del manual (Michaël Zasso) [iojs/io.js#1701](https://github.com/iojs/io.js/pull/1701)
* [[`d168d01b04`](https://github.com/nodejs/node/commit/d168d01b04)] - **doc**: heredar de EventEmitter correctamente (Sakthipriyan Vairamani) [#2168](https://github.com/nodejs/node/pull/2168)
* [[`500f2538cc`](https://github.com/nodejs/node/commit/500f2538cc)] - **doc**: "a listener", no "an listener" (Sam Roberts) [#1025](https://github.com/nodejs/node/pull/1025)
* [[`54627a919d`](https://github.com/nodejs/node/commit/54627a919d)] - **doc**: el evento de cierre del servidor no tiene un argumento (Sam Roberts) [#1025](https://github.com/nodejs/node/pull/1025)
* [[`ed85c95a9c`](https://github.com/nodejs/node/commit/ed85c95a9c)] - **doc,test**: documenta el comportamiento de un archivo inexistente (Sakthipriyan Vairamani) [#2169](https://github.com/nodejs/node/pull/2169)
* [[`2965442308`](https://github.com/nodejs/node/commit/2965442308)] - **(SEMVER-MAJOR)** **http**: fix agent.getName() and add tests (Brendan Ashworth) [#1617](https://github.com/nodejs/node/pull/1617)
* [[`2d9456e3e6`](https://github.com/nodejs/node/commit/2d9456e3e6)] - **(SEMVER-MAJOR)** **http**: use official IANA Status Codes (jomo) [#1470](https://github.com/nodejs/node/pull/1470)
* [[`11e4249227`](https://github.com/nodejs/node/commit/11e4249227)] - **(SEMVER-MAJOR)** **http_server**: `prefinish` vs `finish` (Fedor Indutny) [#1411](https://github.com/nodejs/node/pull/1411)
* [[`9bc2e26720`](https://github.com/nodejs/node/commit/9bc2e26720)] - **net**: no establecer V4MAPPED en FreeBSD (Julien Gilli) [iojs/io.js#1555](https://github.com/iojs/io.js/pull/1555)
* [[`ba9ccf227e`](https://github.com/nodejs/node/commit/ba9ccf227e)] - **node**: remover --use-old-buffer redundante (Rod Vagg) [#2275](https://github.com/nodejs/node/pull/2275)
* [[`ef65321083`](https://github.com/nodejs/node/commit/ef65321083)] - **(SEMVER-MAJOR)** **node**: do not override `message`/`stack` of error (Fedor Indutny) [#2108](https://github.com/nodejs/node/pull/2108)
* [[`9f727f5e03`](https://github.com/nodejs/node/commit/9f727f5e03)] - **node-gyp**: detectar compilación de RC con formato x.y.z-rc.n (Rod Vagg) [#2171](https://github.com/nodejs/node/pull/2171)
* [[`e52f963632`](https://github.com/nodejs/node/commit/e52f963632)] - **node-gyp**: descargar tarball de cabeceras para compilar (Rod Vagg) [#2066](https://github.com/nodejs/node/pull/2066)
* [[`902c9ca51d`](https://github.com/nodejs/node/commit/902c9ca51d)] - **node-gyp**: hacer notar nightly, next-nightly & rc (Rod Vagg) [#2066](https://github.com/nodejs/node/pull/2066)
* [[`4cffaa3f55`](https://github.com/nodejs/node/commit/4cffaa3f55)] - **(SEMVER-MINOR)** **readline**: allow tabs in input (Rich Trott) [#1761](https://github.com/nodejs/node/pull/1761)
* [[`ed6c249104`](https://github.com/nodejs/node/commit/ed6c249104)] - **(SEMVER-MAJOR)** **repl**: persist history in plain text (Jeremiah Senkpiel) [#2224](https://github.com/nodejs/node/pull/2224)
* [[`f7d5e4c618`](https://github.com/nodejs/node/commit/f7d5e4c618)] - **(SEMVER-MINOR)** **repl**: default persistence to ~/.node_repl_history (Jeremiah Senkpiel) [#2224](https://github.com/nodejs/node/pull/2224)
* [[`ea05e760cd`](https://github.com/nodejs/node/commit/ea05e760cd)] - **repl**: no tratar con las propiedades de RegExp.$ de manera agresiva (Sakthipriyan Vairamani) [#2137](https://github.com/nodejs/node/pull/2137)
* [[`d20093246b`](https://github.com/nodejs/node/commit/d20093246b)] - **src**: deshabilitar ICs de vector en brazo (Michaël Zasso) [#2220](https://github.com/nodejs/node/pull/2220)
* [[`04fd4fad46`](https://github.com/nodejs/node/commit/04fd4fad46)] - **(SEMVER-MINOR)** **src**: introduce process.release object (Rod Vagg) [#2154](https://github.com/nodejs/node/pull/2154)
* [[`9d34bd1147`](https://github.com/nodejs/node/commit/9d34bd1147)] - **src**: incrementar NODE_MODULE_VERSION a 45 (Rod Vagg) [#2096](https://github.com/nodejs/node/pull/2096)
* [[`ceee8d2807`](https://github.com/nodejs/node/commit/ceee8d2807)] - **test**: añadir pruebas para historial persistente de repl (Jeremiah Senkpiel) [#2224](https://github.com/nodejs/node/pull/2224)
* [[`8e1a8ffe24`](https://github.com/nodejs/node/commit/8e1a8ffe24)] - **test**: remover dos pruebas de pummel obsoletas (Ben Noordhuis) [#2022](https://github.com/nodejs/node/pull/2022)
* [[`ae731ec0fa`](https://github.com/nodejs/node/commit/ae731ec0fa)] - **test**: no utilizar arguments.callee (Ben Noordhuis) [#2022](https://github.com/nodejs/node/pull/2022)
* [[`21d31c08e7`](https://github.com/nodejs/node/commit/21d31c08e7)] - **test**: remover banderas harmony obsoletas (Chris Dickinson)
* [[`64cf71195c`](https://github.com/nodejs/node/commit/64cf71195c)] - **test**: cambiar el nombre del host a un nombre inválido (Sakthipriyan Vairamani) [#2287](https://github.com/nodejs/node/pull/2287)
* [[`80a1cf7425`](https://github.com/nodejs/node/commit/80a1cf7425)] - **test**: corregir mensajes y utilizar "volver" para omitir pruebas (Sakthipriyan Vairamani) [#2290](https://github.com/nodejs/node/pull/2290)
* [[`d5ab92bcc1`](https://github.com/nodejs/node/commit/d5ab92bcc1)] - **test**: utilizar common.isWindows consistentemente (Sakthipriyan Vairamani) [#2269](https://github.com/nodejs/node/pull/2269)
* [[`bc733f7065`](https://github.com/nodejs/node/commit/bc733f7065)] - **test**: corregir pruebas de fs.readFile('/dev/stdin') (Ben Noordhuis) [#2265](https://github.com/nodejs/node/pull/2265)
* [[`3cbb5870e5`](https://github.com/nodejs/node/commit/3cbb5870e5)] - **tools**: exponer el output de la omisión para el corredor de pruebas (Johan Bergström) [#2130](https://github.com/nodejs/node/pull/2130)
* [[`3b021efe11`](https://github.com/nodejs/node/commit/3b021efe11)] - **vm**: corregir el acceso de symbol (Domenic Denicola) [#1773](https://github.com/nodejs/node/pull/1773)
* [[`7b81e4ba36`](https://github.com/nodejs/node/commit/7b81e4ba36)] - **vm**: remover revisiones de acceso innecesarias (Domenic Denicola) [#1773](https://github.com/nodejs/node/pull/1773)
* [[`659dadd410`](https://github.com/nodejs/node/commit/659dadd410)] - **vm**: corregir los descriptores de propiedades de las propiedades del entorno de pruebas (Domenic Denicola) [#1773](https://github.com/nodejs/node/pull/1773)
* [[`9bac1dbae9`](https://github.com/nodejs/node/commit/9bac1dbae9)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)

<a id="2.5.0"></a>

## 2015-07-28, Versión 2.5.0, @cjihrig

### Cambios notables

* **https**: las sesiones TLS en el Agente son reutilizadas (Fedor Indutny) [#2228](https://github.com/nodejs/node/pull/2228)
* **src**: la decodificación en base64 ahora es 50% más rápida (Ben Noordhuis) [#2193](https://github.com/nodejs/node/pull/2193)
* **npm**: Upgraded to v2.13.2, release notes can be found in <https://github.com/npm/npm/releases/tag/v2.13.2> (Kat Marchán) [#2241](https://github.com/nodejs/node/pull/2241).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* La utilización en paralelo de múltiples instancias de REPL puede causar alguna corrupción o pérdida del historial de REPL. [#1634](https://github.com/nodejs/node/issues/1634)
* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`bf2cd225a8`](https://github.com/nodejs/node/commit/bf2cd225a8)] - **process**: redimensionar stderr en SIGWINCH (Jeremiah Senkpiel) [#2231](https://github.com/nodejs/node/pull/2231)
* [[`99d9d7e716`](https://github.com/nodejs/node/commit/99d9d7e716)] - **benchmark**: añadir las pruebas de rendimiento de ruta restantes & optimizar (Nathan Woltman) [#2103](https://github.com/nodejs/node/pull/2103)
* [[`66fc8ca22b`](https://github.com/nodejs/node/commit/66fc8ca22b)] - **(SEMVER-MINOR)** **cluster**: emit 'message' event on cluster master (Sam Roberts) [#861](https://github.com/nodejs/node/pull/861)
* [[`eb35968de7`](https://github.com/nodejs/node/commit/eb35968de7)] - **crypto**: arreglar SNICallback heredada (Fedor Indutny) [#1720](https://github.com/nodejs/node/pull/1720)
* [[`fef190cea6`](https://github.com/nodejs/node/commit/fef190cea6)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`b73a7465c5`](https://github.com/nodejs/node/commit/b73a7465c5)] - **deps**: actualizar a npm 2.13.2 (Kat Marchán) [#2241](https://github.com/nodejs/node/pull/2241)
* [[`0a7bf81d2f`](https://github.com/nodejs/node/commit/0a7bf81d2f)] - **deps**: actualizar V8 a 4.2.77.21 (Ali Ijaz Sheikh) [#2238](https://github.com/nodejs/node/issues/2238)
* [[`73cdcdd581`](https://github.com/nodejs/node/commit/73cdcdd581)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`04893a736d`](https://github.com/nodejs/node/commit/04893a736d)] - **deps**: actualizar a npm 2.13.1 (Kat Marchán) [#2210](https://github.com/nodejs/node/pull/2210)
* [[`a3c1b9720e`](https://github.com/nodejs/node/commit/a3c1b9720e)] - **doc**: añadir huella digital de GPC para cjihrig (cjihrig) [#2217](https://github.com/nodejs/node/pull/2217)
* [[`d9f857df3b`](https://github.com/nodejs/node/commit/d9f857df3b)] - **doc**: nota acerca de las funciones de inspección personalizadas (Sakthipriyan Vairamani) [#2142](https://github.com/nodejs/node/pull/2142)
* [[`4ef2b5fbfb`](https://github.com/nodejs/node/commit/4ef2b5fbfb)] - **doc**: Reemplazar util.debug con console.error (Yosuke Furukawa) [#2214](https://github.com/nodejs/node/pull/2214)
* [[`b612f085ec`](https://github.com/nodejs/node/commit/b612f085ec)] - **doc**: añadir a joaocgreis como colaborador (João Reis) [#2208](https://github.com/nodejs/node/pull/2208)
* [[`6b85d5a4b3`](https://github.com/nodejs/node/commit/6b85d5a4b3)] - **doc**: añadir las minutas de la reunión del TSC del 2015-07-15 (Rod Vagg) [#2191](https://github.com/nodejs/node/pull/2191)
* [[`c7d8b09162`](https://github.com/nodejs/node/commit/c7d8b09162)] - **doc**: recompilar antes de probar los cambios en el módulo del núcleo (Phillip Johnsen) [#2051](https://github.com/nodejs/node/pull/2051)
* [[`9afee6785e`](https://github.com/nodejs/node/commit/9afee6785e)] - **http**: Probar this.connection antes de utilizarla (Sakthipriyan Vairamani) [#2172](https://github.com/nodejs/node/pull/2172)
* [[`2ca5a3db47`](https://github.com/nodejs/node/commit/2ca5a3db47)] - **https**: reutilizar las sesiones de TLS en el Agente (Fedor Indutny) [#2228](https://github.com/nodejs/node/pull/2228)
* [[`fef87fee1d`](https://github.com/nodejs/node/commit/fef87fee1d)] - **(SEMVER-MINOR)** **lib,test**: add freelist deprecation and test (Sakthipriyan Vairamani) [#2176](https://github.com/nodejs/node/pull/2176)
* [[`503b089dd8`](https://github.com/nodejs/node/commit/503b089dd8)] - **net**: no arrojar ante socket destruido inmediatamente (Evan Lucas) [#2251](https://github.com/nodejs/node/pull/2251)
* [[`93660c8b8e`](https://github.com/nodejs/node/commit/93660c8b8e)] - **node**: remover llamada y revisión de mala fn (Trevor Norris) [#2157](https://github.com/nodejs/node/pull/2157)
* [[`afd7e37ee0`](https://github.com/nodejs/node/commit/afd7e37ee0)] - **repl**: mejorar el manejo de líneas vacías (Sakthipriyan Vairamani) [#2163](https://github.com/nodejs/node/pull/2163)
* [[`81ea52aa01`](https://github.com/nodejs/node/commit/81ea52aa01)] - **repl**: mejora del manejo de la continuación de línea (Sakthipriyan Vairamani) [#2163](https://github.com/nodejs/node/pull/2163)
* [[`30edb5aee9`](https://github.com/nodejs/node/commit/30edb5aee9)] - **repl**: prevención de colapso de REPL con propiedades heredadas (Sakthipriyan Vairamani) [#2163](https://github.com/nodejs/node/pull/2163)
* [[`77fa385e5d`](https://github.com/nodejs/node/commit/77fa385e5d)] - **repl**: corregir `undefined` en error de palabra clave de REPL inválido (Sakthipriyan Vairamani) [#2163](https://github.com/nodejs/node/pull/2163)
* [[`8fd3ce100e`](https://github.com/nodejs/node/commit/8fd3ce100e)] - **src**: hacer que la decodificación en base64 sea 50% más rápida (Ben Noordhuis) [#2193](https://github.com/nodejs/node/pull/2193)
* [[`c786d6341d`](https://github.com/nodejs/node/commit/c786d6341d)] - **test**: no utilizar IPs públicas para pruebas de tiempo de espera (Rich Trott) [#2057](https://github.com/nodejs/node/pull/2057)
* [[`4e78cd71c0`](https://github.com/nodejs/node/commit/4e78cd71c0)] - **test**: omitir la parte de IPv6 antes de probarla (Sakthipriyan Vairamani) [#2226](https://github.com/nodejs/node/pull/2226)
* [[`ac70bc8240`](https://github.com/nodejs/node/commit/ac70bc8240)] - **test**: corregir la advertencia de la memoria sin inicializar de valgrind (Ben Noordhuis) [#2193](https://github.com/nodejs/node/pull/2193)
* [[`ac7d3fa0d9`](https://github.com/nodejs/node/commit/ac7d3fa0d9)] - **test**: añadir -no_rand_screen a opciones de s_client en Win (Shigeki Ohtsu) [#2209](https://github.com/nodejs/node/pull/2209)
* [[`79c865a53f`](https://github.com/nodejs/node/commit/79c865a53f)] - **test**: cambiar process.exit para que devuelva al mismo tiempo que se omiten pruebas (Sakthipriyan Vairamani) [#2109](https://github.com/nodejs/node/pull/2109)
* [[`69298d36cf`](https://github.com/nodejs/node/commit/69298d36cf)] - **test**: mensajes de omisión de formateo para el análisis de TAP (Sakthipriyan Vairamani) [#2109](https://github.com/nodejs/node/pull/2109)
* [[`543dabb609`](https://github.com/nodejs/node/commit/543dabb609)] - **timers**: mejorar el rendimiento de Timer.now() (Ben Noordhuis) [#2256](https://github.com/nodejs/node/pull/2256)
* [[`3663b124e6`](https://github.com/nodejs/node/commit/3663b124e6)] - **timers**: remover Timer.again() sin utilizar (Ben Noordhuis) [#2256](https://github.com/nodejs/node/pull/2256)
* [[`bcce5cf9bb`](https://github.com/nodejs/node/commit/bcce5cf9bb)] - **timers**: remover Timer.getRepeat() sin utilizar (Ben Noordhuis) [#2256](https://github.com/nodejs/node/pull/2256)
* [[`f2c83bd202`](https://github.com/nodejs/node/commit/f2c83bd202)] - **timers**: remover Timer.setRepeat() sin utilizar (Ben Noordhuis) [#2256](https://github.com/nodejs/node/pull/2256)
* [[`e11fc67225`](https://github.com/nodejs/node/commit/e11fc67225)] - **(SEMVER-MINOR)** **tls**: add `getTicketKeys()`/`setTicketKeys()` (Fedor Indutny) [#2227](https://github.com/nodejs/node/pull/2227)
* [[`68b06e94e3`](https://github.com/nodejs/node/commit/68b06e94e3)] - **tools**: utilizar $NODE local o especificado para test-npm (Jeremiah Senkpiel) [#1984](https://github.com/nodejs/node/pull/1984)
* [[`ab479659c7`](https://github.com/nodejs/node/commit/ab479659c7)] - **util**: retrasar creación del contexto de depuración (Ali Ijaz Sheikh) [#2248](https://github.com/nodejs/node/pull/2248)
* [[`6391f4d2fd`](https://github.com/nodejs/node/commit/6391f4d2fd)] - **util**: remover las revisiones redundantes en las funciones is* (Sakthipriyan Vairamani) [#2179](https://github.com/nodejs/node/pull/2179)
* [[`b148c0dff3`](https://github.com/nodejs/node/commit/b148c0dff3)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)
* [[`f90f1e75bb`](https://github.com/nodejs/node/commit/f90f1e75bb)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)

<a id="2.4.0"></a>

## 2015-07-17, Versión 2.4.0, @Fishrock123

### Cambios notables

* **src**: Se añadió una nueva bandera `--track-heap-objects` para hacer seguimiento a las asignaciones de los objetos del montículo para los snapshots del montículo (Bradley Meck) [#2135](https://github.com/nodejs/node/pull/2135).
* **readline**: Se corrigió un congelamiento que afectaba al repl si el manejador del evento "keypress" arrojaba (Alex Kocharin) [#2107](https://github.com/nodejs/node/pull/2107).
* **npm**: Upgraded to v2.13.0, release notes can be found in <https://github.com/npm/npm/releases/tag/v2.13.0> (Forrest L Norvell) [#2152](https://github.com/nodejs/node/pull/2152).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`f95f9ef6ea`](https://github.com/nodejs/node/commit/f95f9ef6ea)] - **build**: siempre utilizar prefijo=/ para tar-headers (Rod Vagg) [#2082](https://github.com/nodejs/node/pull/2082)
* [[`12bc397207`](https://github.com/nodejs/node/commit/12bc397207)] - **build**: regla makefile de run-ci (Alexis Campailla) [#2134](https://github.com/nodejs/node/pull/2134)
* [[`84012c99e0`](https://github.com/nodejs/node/commit/84012c99e0)] - **build**: corregir problemas de unión de vcbuild (Alexis Campailla) [#2131](https://github.com/nodejs/node/pull/2131)
* [[`47e2c5c828`](https://github.com/nodejs/node/commit/47e2c5c828)] - **build**: liberar con anticipación si "clean" es invocada (Johan Bergström) [#2127](https://github.com/nodejs/node/pull/2127)
* [[`5acad6b163`](https://github.com/nodejs/node/commit/5acad6b163)] - **child_process**: corregir los comentarios de los argumentos (Roman Reiss) [#2161](https://github.com/nodejs/node/pull/2161)
* [[`3c4121c418`](https://github.com/nodejs/node/commit/3c4121c418)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`938cc757bb`](https://github.com/nodejs/node/commit/938cc757bb)] - **deps**: actualizar a npm 2.13.0 (Forrest L Norvell) [#2152](https://github.com/nodejs/node/pull/2152)
* [[`6f306e0ed2`](https://github.com/nodejs/node/commit/6f306e0ed2)] - **doc**: añadir a targos como colaborador (Michaël Zasso) [#2200](https://github.com/nodejs/node/pull/2200)
* [[`c019d9a239`](https://github.com/nodejs/node/commit/c019d9a239)] - **doc**: añadir a thefourtheye como colaborador (Sakthipriyan Vairamani) [#2199](https://github.com/nodejs/node/pull/2199)
* [[`4e92dbc26b`](https://github.com/nodejs/node/commit/4e92dbc26b)] - **doc**: añadir a los miembros del TSC del proyecto combinado (Jeremiah Senkpiel) [#2085](https://github.com/nodejs/node/pull/2085)
* [[`6c3aabf455`](https://github.com/nodejs/node/commit/6c3aabf455)] - **doc**: añadir las minutas de la reunión del TSC del 2015-07-08 (Rod Vagg) [#2184](https://github.com/nodejs/node/pull/2184)
* [[`30a0d47d51`](https://github.com/nodejs/node/commit/30a0d47d51)] - **doc**: añadir las minutas de la reunión del TSC del 2015-07-01 (Rod Vagg) [#2132](https://github.com/nodejs/node/pull/2132)
* [[`23efb05cc3`](https://github.com/nodejs/node/commit/23efb05cc3)] - **doc**: documentar el comportamiento de fs.watchFile en ENOENT (Brendan Ashworth) [#2093](https://github.com/nodejs/node/pull/2093)
* [[`65963ec26f`](https://github.com/nodejs/node/commit/65963ec26f)] - **doc,test**: vaciar las strings en el módulo de ruta (Sakthipriyan Vairamani) [#2106](https://github.com/nodejs/node/pull/2106)
* [[`0ab81e6f58`](https://github.com/nodejs/node/commit/0ab81e6f58)] - **docs**: hacer enlaces a documentos de v8 más actualizados (Jeremiah Senkpiel) [#2196](https://github.com/nodejs/node/pull/2196)
* [[`1afc0c9e86`](https://github.com/nodejs/node/commit/1afc0c9e86)] - **fs**: corregir error ante tipo de listener incorrecto (Brendan Ashworth) [#2093](https://github.com/nodejs/node/pull/2093)
* [[`2ba84606a6`](https://github.com/nodejs/node/commit/2ba84606a6)] - **path**: hacer aserciones sobre los argumentos de path.join() por igual (Phillip Johnsen) [#2159](https://github.com/nodejs/node/pull/2159)
* [[`bd01603201`](https://github.com/nodejs/node/commit/bd01603201)] - **readline**: arreglar congelamiento en el caso de que el evento `keypress` arroje (Alex Kocharin) [#2107](https://github.com/nodejs/node/pull/2107)
* [[`59f6b5da2a`](https://github.com/nodejs/node/commit/59f6b5da2a)] - **repl**: Evitar colapso cuando tab sea completada mediante Proxy (Sakthipriyan Vairamani) [#2120](https://github.com/nodejs/node/pull/2120)
* [[`cf14a2427c`](https://github.com/nodejs/node/commit/cf14a2427c)] - **(SEMVER-MINOR)** **src**: add --track-heap-objects (Bradley Meck) [#2135](https://github.com/nodejs/node/pull/2135)
* [[`2b4b600660`](https://github.com/nodejs/node/commit/2b4b600660)] - **test**: arreglar test-debug-port-from-cmdline (João Reis) [#2186](https://github.com/nodejs/node/pull/2186)
* [[`d4ceb16da2`](https://github.com/nodejs/node/commit/d4ceb16da2)] - **test**: limpiar correctamente el directorio temp (Roman Reiss) [#2164](https://github.com/nodejs/node/pull/2164)
* [[`842eb5b853`](https://github.com/nodejs/node/commit/842eb5b853)] - **test**: añadir prueba para dgram.setTTL (Evan Lucas) [#2121](https://github.com/nodejs/node/pull/2121)
* [[`cff7300a57`](https://github.com/nodejs/node/commit/cff7300a57)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)

<a id="2.3.4"></a>

## 2015-07-09, Versión 2.3.4, @Fishrock123

### Cambios notables

* **openssl**: Actualizar a 1.0.2d, corrige CVE-2015-1793 (Forja de Certificados de Cadenas Alterna) (Shigeki Ohtsu) [#2141](https://github.com/nodejs/node/pull/2141).
* **npm**: Upgraded to v2.12.1, release notes can be found in <https://github.com/npm/npm/releases/tag/v2.12.0> and <https://github.com/npm/npm/releases/tag/v2.12.1> (Kat Marchán) [#2112](https://github.com/nodejs/node/pull/2112).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación de la url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`0d15161c24`](https://github.com/nodejs/node/commit/0d15161c24)] - **benchmark**: Añadir algunas pruebas de rendimiento de ruta para #1778 (Nathan Woltman) [#1778](https://github.com/nodejs/node/pull/1778)
* [[`c70e68fa32`](https://github.com/nodejs/node/commit/c70e68fa32)] - **deps**: actualizar deps/openssl/conf/arch/*/opensslconf.h (Shigeki Ohtsu) [#2141](https://github.com/nodejs/node/pull/2141)
* [[`ca93f7f2e6`](https://github.com/nodejs/node/commit/ca93f7f2e6)] - **deps**: actualizar fuentes de openssl a 1.0.2d (Shigeki Ohtsu) [#2141](https://github.com/nodejs/node/pull/2141)
* [[`b18c841ec1`](https://github.com/nodejs/node/commit/b18c841ec1)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`863cdbdd08`](https://github.com/nodejs/node/commit/863cdbdd08)] - **deps**: actualizar a npm 2.12.1 (Kat Marchán) [#2112](https://github.com/nodejs/node/pull/2112)
* [[`84b3915764`](https://github.com/nodejs/node/commit/84b3915764)] - **doc**: documentar el procedimiento de lanzamiento actual (Rod Vagg) [#2099](https://github.com/nodejs/node/pull/2099)
* [[`46140334cd`](https://github.com/nodejs/node/commit/46140334cd)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#2100](https://github.com/nodejs/node/pull/2100)
* [[`bca53dce76`](https://github.com/nodejs/node/commit/bca53dce76)] - **path**: refactorizar por razones de rendimiento y consistencia (Nathan Woltman) [#1778](https://github.com/nodejs/node/pull/1778)
* [[`6bef15afe7`](https://github.com/nodejs/node/commit/6bef15afe7)] - **src**: remover del proceso la propiedad traceSyncIO (Bradley Meck) [#2143](https://github.com/nodejs/node/pull/2143)
* [[`2ba1740ba1`](https://github.com/nodejs/node/commit/2ba1740ba1)] - **test**: añadir revisiones criptográficas faltantes (Johan Bergström) [#2129](https://github.com/nodejs/node/pull/2129)
* [[`180fd392ca`](https://github.com/nodejs/node/commit/180fd392ca)] - **test**: refactorizar test-repl-tab-complete (Sakthipriyan Vairamani) [#2122](https://github.com/nodejs/node/pull/2122)
* [[`fb05c8e27d`](https://github.com/nodejs/node/commit/fb05c8e27d)] - ***Revert*** "**test**: add test for missing `close`/`finish` event" (Fedor Indutny)
* [[`9436a860cb`](https://github.com/nodejs/node/commit/9436a860cb)] - **test**: añadir prueba para evento `close`/`finish` faltante (Mark Plomer) [iojs/io.js#1373](https://github.com/iojs/io.js/pull/1373)
* [[`ee3ce2ed88`](https://github.com/nodejs/node/commit/ee3ce2ed88)] - **tools**: instalar gdbinit desde v8 para $PREFIX/compartir (Ali Ijaz Sheikh) [#2123](https://github.com/nodejs/node/pull/2123)
* [[`dd523c75da`](https://github.com/nodejs/node/commit/dd523c75da)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)

<a id="1.8.4"></a>

## 2015-07-09, Versión 1.8.4, @Fishrock123

**Versión de mantenimiento**

### Cambios notables

* **openssl**: Actualizar a 1.0.2d, corrige CVE-2015-1793 (Forja de Certificados de Cadenas Alterna) [#2141](https://github.com/nodejs/node/pull/2141).

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, una regresión introducida en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras una consulta de DNS está en progreso puede ocasionar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`c70e68fa32`](https://github.com/nodejs/node/commit/c70e68fa32)] - **deps**: actualizar deps/openssl/conf/arch/*/opensslconf.h (Shigeki Ohtsu) [#2141](https://github.com/nodejs/node/pull/2141)
* [[`ca93f7f2e6`](https://github.com/nodejs/node/commit/ca93f7f2e6)] - **deps**: actualizar fuentes de openssl a 1.0.2d (Shigeki Ohtsu) [#2141](https://github.com/nodejs/node/pull/2141)

<a id="2.3.3"></a>

## 2015-07-04, Versión 2.3.3, @Fishrock123

### Cambios notables

* **deps**: Reparada una escritura fuera de banda en decodificador utf8. **Esta es una actualización de seguridad importante** ya que se puede usar para provocar la negación de un ataque de servicio.

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal. [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760).
* Llamar a `dns.setServers()` mientras que una consulta DNS todavía está en progreso puede causar que el proceso colapse en una aserción fallida. [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

## Commits

* [[`030f8045c7`](https://github.com/nodejs/node/commit/030f8045c7)] - **deps**: corregir escritura fuera de banda en el decodificador de utf8 (Fedor Indutny)
* [[`0f09b8db28`](https://github.com/nodejs/node/commit/0f09b8db28)] - **doc**: no recomendar dominios para el manejo de errores (Benjamin Gruenbaum) [#2056](https://github.com/nodejs/node/pull/2056)
* [[`9cd44bb2b6`](https://github.com/nodejs/node/commit/9cd44bb2b6)] - **util**: anteponer '(node) ' a los mensajes de desaprobación (Sakthipriyan Vairamani) [#1892](https://github.com/nodejs/node/pull/1892)

<a id="1.8.3"></a>

## 2015-07-04, Versión 1.8.3, @rvagg

**Versión de mantenimiento**

## Cambios notables

* **v8**: Fue corregida una escritura fuera de banda en el decodificador de utf8. **Esta es una actualización de seguridad importante** ya que se puede usar para provocar la negación de un ataque de servicio.
* **openssl**: Actualizar a 1.0.2b y 1.0.2c, introduce una protección contra ataques de intermediario de DHE (Logjam) y corrige ECParameters malformados, causantes de un bucle infinito (CVE-2015-1788). Vea el [aviso de seguridad](https://www.openssl.org/news/secadv_20150611.txt) para obtener todos los detalles. (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950) [#1958](https://github.com/nodejs/node/pull/1958)
* **build**:
  - Se añadió soporte para la compilación con Microsoft Visual C++ 2015
  - Se inició la compilación y distribución de tarballs de solo cabeceras junto con binarios

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`d8f260d33b`](https://github.com/nodejs/node/commit/d8f260d33b)] - **build**: añadir objetivo de cabeceras de tarball para tarball de solo cabeceras (Rod Vagg) [#1975](https://github.com/nodejs/node/pull/1975)
* [[`00ba429674`](https://github.com/nodejs/node/commit/00ba429674)] - **build**: actualizar los objetivos de compilación para io.js (Rod Vagg) [#1938](https://github.com/nodejs/node/pull/1938)
* [[`39e2207ff1`](https://github.com/nodejs/node/commit/39e2207ff1)] - **build**: corregir errores de cherry-pick, corregir la escritura del comentario (Rod Vagg) [#2036](https://github.com/nodejs/node/pull/2036)
* [[`561919a67a`](https://github.com/nodejs/node/commit/561919a67a)] - **build**: añadir soporte para MSVS 2015 (Rod Vagg) [#2036](https://github.com/nodejs/node/pull/2036)
* [[`8e1134c04c`](https://github.com/nodejs/node/commit/8e1134c04c)] - **build**: remover lint de test-ci en windows (Johan Bergström) [#2004](https://github.com/nodejs/node/pull/2004)
* [[`e52e99085e`](https://github.com/nodejs/node/commit/e52e99085e)] - **build**: no ejecutar lint desde test-ci (Johan Bergström) [#1965](https://github.com/nodejs/node/pull/1965)
* [[`c5d1ec7fea`](https://github.com/nodejs/node/commit/c5d1ec7fea)] - **build**: simplificar la ejecución de binario compilado (Johan Bergström) [#1955](https://github.com/nodejs/node/pull/1955)
* [[`2ce147551a`](https://github.com/nodejs/node/commit/2ce147551a)] - **build,win**: establecer env antes de generar proyectos (Alexis Campailla) [joyent/node#20109](https://github.com/joyent/node/pull/20109)
* [[`78de5f85f2`](https://github.com/nodejs/node/commit/78de5f85f2)] - **deps**: corregir escritura fuera de banda en el decodificador de utf8 (Ben Noordhuis)
* [[`83ee07b6be`](https://github.com/nodejs/node/commit/83ee07b6be)] - **deps**: copiar todos los archivos de cabecera de openssl para incluir dir (Shigeki Ohtsu) [#2016](https://github.com/nodejs/node/pull/2016)
* [[`a97125520d`](https://github.com/nodejs/node/commit/a97125520d)] - **deps**: actualizar doc de UPGRADING.md a openssl-1.0.2c (Shigeki Ohtsu) [#1958](https://github.com/nodejs/node/pull/1958)
* [[`0e2d068e0b`](https://github.com/nodejs/node/commit/0e2d068e0b)] - **deps**: reemplazar todas las cabeceras en openssl (Shigeki Ohtsu) [#1958](https://github.com/nodejs/node/pull/1958)
* [[`310b8d1120`](https://github.com/nodejs/node/commit/310b8d1120)] - **deps**: añadir -no_rand_screen al s_client de openssl (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`a472946747`](https://github.com/nodejs/node/commit/a472946747)] - **deps**: corregir error de compilación de asm de openssl en x86_win32 (Shigeki Ohtsu) [nodejs/node#1389](https://github.com/nodejs/node/pull/1389)
* [[`b2467e3ebf`](https://github.com/nodejs/node/commit/b2467e3ebf)] - **deps**: corregir error de ensamblaje de openssl en win32 de ia32 (Fedor Indutny) [nodejs/node#1389](https://github.com/nodejs/node/pull/1389)
* [[`e548abb800`](https://github.com/nodejs/node/commit/e548abb800)] - **deps**: actualizar fuentes de openssl a 1.0.2c (Shigeki Ohtsu) [#1958](https://github.com/nodejs/node/pull/1958)
* [[`1feaa68e85`](https://github.com/nodejs/node/commit/1feaa68e85)] - **deps**: actualizar archivos de asm para openssl-1.0.2b (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950)
* [[`151720fae7`](https://github.com/nodejs/node/commit/151720fae7)] - **deps**: reemplazar todas las cabeceras en openssl (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950)
* [[`139da6a02a`](https://github.com/nodejs/node/commit/139da6a02a)] - **deps**: añadir -no_rand_screen a s_client de openssl (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`283642827a`](https://github.com/nodejs/node/commit/283642827a)] - **deps**: corregir error de compilación de asm en x86_win32 (Shigeki Ohtsu) [nodejs/node#1389](https://github.com/nodejs/node/pull/1389)
* [[`d593b552de`](https://github.com/nodejs/node/commit/d593b552de)] - **deps**: corregir error de ensamblaje de openssl en win32 de ia32 (Fedor Indutny) [nodejs/node#1389](https://github.com/nodejs/node/pull/1389)
* [[`2a3367a4bd`](https://github.com/nodejs/node/commit/2a3367a4bd)] - **deps**: actualizar fuentes de openssl a 1.0.2b (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950)
* [[`5c29c0c519`](https://github.com/nodejs/node/commit/5c29c0c519)] - **openssl**: corregir requerimiento de keypress en aplicaciones en win32 (Shigeki Ohtsu) [nodejs/node#1389](https://github.com/nodejs/node/pull/1389)
* [[`2cd7f73d9f`](https://github.com/nodejs/node/commit/2cd7f73d9f)] - **openssl**: corregir requerimiento de keypress en aplicaciones en win32 (Shigeki Ohtsu) [nodejs/node#1389](https://github.com/nodejs/node/pull/1389)
* [[`c65484a74d`](https://github.com/nodejs/node/commit/c65484a74d)] - **tls**: hacer que el servidor no utilice DHE en menos de 1024bits (Shigeki Ohtsu) [#1739](https://github.com/nodejs/node/pull/1739)
* [[`77f518403f`](https://github.com/nodejs/node/commit/77f518403f)] - **win,node-gyp**: hacer que el hook delay-load cumpla con C89 (Sharat M R) \[TooTallNate/node-gyp#616\](https://github.com/TooTallNa

<a id="2.3.2"></a>

## 2015-07-01, Versión 2.3.2, @rvagg

### Cambios notables

* **build**:
  - Se añadió soporte para compilar con Microsoft Visual C++ 2015
  - Se inició la compilación y distribución de tarballs de solo cabeceras junto con binarios

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

## Commits

* [[`9180140231`](https://github.com/nodejs/node/commit/9180140231)] - **_stream_wrap**: evitar el uso luego de la liberación en TLS (Fedor Indutny) [#1910](https://github.com/nodejs/node/pull/1910)
* [[`05a73c0f25`](https://github.com/nodejs/node/commit/05a73c0f25)] - **benchmark**: hacer que las solicitudes concurrentes sean configurables (Rich Trott) [#2068](https://github.com/nodejs/node/pull/2068)
* [[`f52d73352e`](https://github.com/nodejs/node/commit/f52d73352e)] - **benchmark**: corregir error tipográfico en README (Rich Trott) [#2067](https://github.com/nodejs/node/pull/2067)
* [[`1cd9eeb556`](https://github.com/nodejs/node/commit/1cd9eeb556)] - **buffer**: evitar aborto ante mal proto (Trevor Norris) [#2012](https://github.com/nodejs/node/pull/2012)
* [[`8350f3a3a2`](https://github.com/nodejs/node/commit/8350f3a3a2)] - **buffer**: optimizar Buffer#toString() (Ben Noordhuis) [#2027](https://github.com/nodejs/node/pull/2027)
* [[`628a3ab093`](https://github.com/nodejs/node/commit/628a3ab093)] - **build**: añadir objetivo de cabeceras de tarball para tarball de solo cabeceras (Rod Vagg) [#1975](https://github.com/nodejs/node/pull/1975)
* [[`dcbb9e1da6`](https://github.com/nodejs/node/commit/dcbb9e1da6)] - **build**: actualizar objetivos de compilación para io.js (Rod Vagg) [#1938](https://github.com/nodejs/node/pull/1938)
* [[`c87c34c242`](https://github.com/nodejs/node/commit/c87c34c242)] - **build**: corregir errores de cherry-pick, corregir la escritura de comentario (Rod Vagg) [#2036](https://github.com/nodejs/node/pull/2036)
* [[`4208dc4fef`](https://github.com/nodejs/node/commit/4208dc4fef)] - **build**: añadir soporte para MSVS 2015 (Rod Vagg) [#2036](https://github.com/nodejs/node/pull/2036)
* [[`834a365113`](https://github.com/nodejs/node/commit/834a365113)] - **build**: DTrace está habilitado por defecto en darwin (Evan Lucas) [#2019](https://github.com/nodejs/node/pull/2019)
* [[`c0c0d73269`](https://github.com/nodejs/node/commit/c0c0d73269)] - **build,win**: establecer env antes de generar proyectos (Alexis Campailla) [joyent/node#20109](https://github.com/joyent/node/pull/20109)
* [[`9e890fe8b4`](https://github.com/nodejs/node/commit/9e890fe8b4)] - **crypto**: corregir VerifyCallback en el caso de un error de verificación (Shigeki Ohtsu) [#2064](https://github.com/nodejs/node/pull/2064)
* [[`1f371e3988`](https://github.com/nodejs/node/commit/1f371e3988)] - **deps**: copiar todos los archivos de cabecera de opessl para que incluyan dir (Shigeki Ohtsu) [#2016](https://github.com/nodejs/node/pull/2016)
* [[`c370bd3aea`](https://github.com/nodejs/node/commit/c370bd3aea)] - **doc**: hacer que la abreviación de 1MM sea clara (Ivan Yan) [#2053](https://github.com/nodejs/node/pull/2053)
* [[`54d5437566`](https://github.com/nodejs/node/commit/54d5437566)] - **doc**: Se añadió un comando de ejemplo para probar el build de iojs (Jimmy Hsu) [#850](https://github.com/nodejs/node/pull/850)
* [[`f1f1b7e597`](https://github.com/nodejs/node/commit/f1f1b7e597)] - **doc**: añadir minutas de la reunión del TSC del 2015-06-17 (Rod Vagg) [#2048](https://github.com/nodejs/node/pull/2048)
* [[`dbd5dc932d`](https://github.com/nodejs/node/commit/dbd5dc932d)] - **doc**: claificar los pre-requisitos en benchmark/README.md (Jeremiah Senkpiel) [#2034](https://github.com/nodejs/node/pull/2034)
* [[`50dbc8e143`](https://github.com/nodejs/node/commit/50dbc8e143)] - **doc**: añadir minutas de la reunión del TSC del 2015-05-27 (Rod Vagg) [#2037](https://github.com/nodejs/node/pull/2037)
* [[`941ad362a7`](https://github.com/nodejs/node/commit/941ad362a7)] - **doc**: archivar las minutas del TC de io.js (Rod Vagg)
* [[`644b2eaa89`](https://github.com/nodejs/node/commit/644b2eaa89)] - **doc**: renombrar tc-meetings como tsc-meetings (Rod Vagg)
* [[`1330ee3b27`](https://github.com/nodejs/node/commit/1330ee3b27)] - **doc**: añadir minutas de la reunión del TC del 2015-05-13 (Rod Vagg) [#1700](https://github.com/nodejs/node/pull/1700)
* [[`392e8fd64e`](https://github.com/nodejs/node/commit/392e8fd64e)] - **doc**: añadir a @shigeki y @mscdex al TC (Rod Vagg) [#2008](https://github.com/nodejs/node/pull/2008)
* [[`af249fa8a1`](https://github.com/nodejs/node/commit/af249fa8a1)] - **net**: empaquetar "connect" en nextTick (Evan Lucas) [#2054](https://github.com/nodejs/node/pull/2054)
* [[`7f63449fde`](https://github.com/nodejs/node/commit/7f63449fde)] - **net**: corregir depuración para dnsopts (Evan Lucas) [#2059](https://github.com/nodejs/node/pull/2059)
* [[`eabed2f518`](https://github.com/nodejs/node/commit/eabed2f518)] - **repl**: remover TODO obsoleto (Rich Trott) [#2081](https://github.com/nodejs/node/pull/2081)
* [[`a198c68b56`](https://github.com/nodejs/node/commit/a198c68b56)] - **repl**: hacer que los errores 'Unexpected token' sean recuperables (Julien Gilli) [#2052](https://github.com/nodejs/node/pull/2052)
* [[`d735b2c6ef`](https://github.com/nodejs/node/commit/d735b2c6ef)] - **repl**: corregir completado de tab desde un contexto no global (Sangmin Yoon) [#2052](https://github.com/nodejs/node/pull/2052)
* [[`8cee8f54fc`](https://github.com/nodejs/node/commit/8cee8f54fc)] - **src**: poner fin a la manipulación de stdin _readableState.reading (Chris Dickinson) [#454](https://github.com/nodejs/node/pull/454)
* [[`856c11f8c8`](https://github.com/nodejs/node/commit/856c11f8c8)] - **test**: purgar las pruebas deshabilitadas y estancadas (Rich Trott) [#2045](https://github.com/nodejs/node/pull/2045)
* [[`4d5089e181`](https://github.com/nodejs/node/commit/4d5089e181)] - **test**: no tragarse el error de soporte de OpenSSL (Rich Trott) [#2042](https://github.com/nodejs/node/pull/2042)
* [[`06721fe005`](https://github.com/nodejs/node/commit/06721fe005)] - **test**: corregir test-repl-tab-complete.js (cjihrig) [#2052](https://github.com/nodejs/node/pull/2052)
* [[`8e9089ac35`](https://github.com/nodejs/node/commit/8e9089ac35)] - **test**: revisar en busca de error en Windows (Rich Trott) [#2035](https://github.com/nodejs/node/pull/2035)
* [[`776a65ebcd`](https://github.com/nodejs/node/commit/776a65ebcd)] - **test**: remover los comentarios de TODO obsoletos (Rich Trott) [#2033](https://github.com/nodejs/node/pull/2033)
* [[`bdfeb798ad`](https://github.com/nodejs/node/commit/bdfeb798ad)] - **test**: remover los comentarios de TODO obsoletos (Rich Trott) [#2032](https://github.com/nodejs/node/pull/2032)
* [[`58e914f9bc`](https://github.com/nodejs/node/commit/58e914f9bc)] - **tools**: arreglar gyp para que funcione en MacOSX sin XCode (Shigeki Ohtsu) [iojs/io.js#1325](https://github.com/iojs/io.js/pull/1325)
* [[`99cbbc0a13`](https://github.com/nodejs/node/commit/99cbbc0a13)] - **tools**: actualizar gyp a 25ed9ac (Ben Noordhuis) [#2074](https://github.com/nodejs/node/pull/2074)
* [[`e3f9335c40`](https://github.com/nodejs/node/commit/e3f9335c40)] - **tools**: reactivar regla del espaciado de las comas del linter (Roman Reiss) [#2072](https://github.com/nodejs/node/pull/2072)
* [[`d91e10b3bd`](https://github.com/nodejs/node/commit/d91e10b3bd)] - **tools**: actualizar eslint a 0.24.0 (Roman Reiss) [#2072](https://github.com/nodejs/node/pull/2072)
* [[`6c61ca5325`](https://github.com/nodejs/node/commit/6c61ca5325)] - **url**: corregir error tipográfico en comentario (Rich Trott) [#2071](https://github.com/nodejs/node/pull/2071)
* [[`1a51f0058c`](https://github.com/nodejs/node/commit/1a51f0058c)] - **v8**: hacer cherry-pick a parche de JitCodeEvent desde upstream (Ben Noordhuis) [#2075](https://github.com/nodejs/node/pull/2075)

<a id="2.3.1"></a>

## 2015-06-23, Versión 2.3.1, @rvagg

### Cambios notables

* **module**: El número de llamadas de sistema hechas durante la ejecución de la función `require()` ha sido nuevamente reducido de forma significativa, (vea [#1801](https://github.com/nodejs/node/pull/1801) de la v2.2.0 para consultar el trabajo previo), lo que debería conducir a una mejora de rendimiento (Pierre Inglebert) [#1920](https://github.com/nodejs/node/pull/1920).
* **npm**:
  * Actualizar a [v2.11.2](https://github.com/npm/npm/releases/tag/v2.11.2) (Rebecca Turner) [#1956](https://github.com/nodejs/node/pull/1956).
  * Actualizar a [v2.11.3](https://github.com/npm/npm/releases/tag/v2.11.3) (Forrest L Norvell) [#2018](https://github.com/nodejs/node/pull/2018).
* **zlib**: Fue descubierto un bug causante del aborto de procesos cuando la parte final de una descompresión de zlib resultaba ser un búfer de tamaño superior a los `0x3fffffff` bytes (~1GiB). Esto solía suceder solamente durante la descompresión en búfer (y no en la transmisión de datos). Esto fue arreglado y ahora ha de resultar en el arrojo de un `RangeError` (Michaël Zasso) [#1811](https://github.com/nodejs/node/pull/1811).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

## Commits

* [[`e56758a5e0`](https://github.com/nodejs/node/commit/e56758a5e0)] - **async-wrap**: añadir id del proveedor y cb de la información del objeto (Trevor Norris) [#1896](https://github.com/nodejs/node/pull/1896)
* [[`d5637e67c9`](https://github.com/nodejs/node/commit/d5637e67c9)] - **buffer**: corregir dependencia cíclica con util (Brendan Ashworth) [#1988](https://github.com/nodejs/node/pull/1988)
* [[`c5353d7c62`](https://github.com/nodejs/node/commit/c5353d7c62)] - **build**: remover lint de test-ci en windows (Johan Bergström) [#2004](https://github.com/nodejs/node/pull/2004)
* [[`c207e8d223`](https://github.com/nodejs/node/commit/c207e8d223)] - **build**: corregir análisis de output de pkg-config en configuración (Ben Noordhuis) [#1986](https://github.com/nodejs/node/pull/1986)
* [[`8d8a26e8f7`](https://github.com/nodejs/node/commit/8d8a26e8f7)] - **build**: no ejecutar lint desde test-ci (Johan Bergström) [#1965](https://github.com/nodejs/node/pull/1965)
* [[`1ec53c044d`](https://github.com/nodejs/node/commit/1ec53c044d)] - **build**: simplificar la ejecución de binario compilado (Johan Bergström) [#1955](https://github.com/nodejs/node/pull/1955)
* [[`3beb880716`](https://github.com/nodejs/node/commit/3beb880716)] - **crypto**: añadir revisión de certificados a la Lista Blanca de CNNIC (Shigeki Ohtsu) [#1895](https://github.com/nodejs/node/pull/1895)
* [[`48c0fb8b1a`](https://github.com/nodejs/node/commit/48c0fb8b1a)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`6a359b1ce9`](https://github.com/nodejs/node/commit/6a359b1ce9)] - **deps**: actualizar a npm 2.11.3 (Forrest L Norvell) [#2018](https://github.com/nodejs/node/pull/2018)
* [[`6aab2f3b9a`](https://github.com/nodejs/node/commit/6aab2f3b9a)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`3e12561b55`](https://github.com/nodejs/node/commit/3e12561b55)] - **deps**: actualizar a npm 2.11.2 (Rebecca Turner) [#1956](https://github.com/nodejs/node/pull/1956)
* [[`8ac50819b6`](https://github.com/nodejs/node/commit/8ac50819b6)] - **doc**: añadir sección de seguridad a README.md (Rod Vagg) [#1948](https://github.com/nodejs/node/pull/1948)
* [[`1f93b63b11`](https://github.com/nodejs/node/commit/1f93b63b11)] - **doc**: cambiar la información para que sea la misma establecida en gitconfig (Christian Tellnes) [#2000](https://github.com/nodejs/node/pull/2000)
* [[`0cf94e6856`](https://github.com/nodejs/node/commit/0cf94e6856)] - **doc** mencionar CI en la Guía de Colaboradores (Rich Trott) [#1995](https://github.com/nodejs/node/pull/1995)
* [[`7a3006efe4`](https://github.com/nodejs/node/commit/7a3006efe4)] - **doc**: añadir enlaces a TOC en la Guía de Colaboradores (Rich Trott) [#1994](https://github.com/nodejs/node/pull/1994)
* [[`30638b150f`](https://github.com/nodejs/node/commit/30638b150f)] - **doc**: añadir las notas de la reunión del TSC del 2015-06-10 (Bert Belder) [#1943](https://github.com/nodejs/node/pull/1943)
* [[`c4ec04136b`](https://github.com/nodejs/node/commit/c4ec04136b)] - **doc**: cambiar el formato de la sección de autores (Johan Bergström) [#1966](https://github.com/nodejs/node/pull/1966)
* [[`96165f9be2`](https://github.com/nodejs/node/commit/96165f9be2)] - **doc**: clarificación menor en el doc de la API de módulos. (Сковорода Никита Андреевич) [#1983](https://github.com/nodejs/node/pull/1983)
* [[`5c2707c1b2`](https://github.com/nodejs/node/commit/5c2707c1b2)] - **doc**: revisión y corrección de benchmark/README.md (Rich Trott) [#1970](https://github.com/nodejs/node/pull/1970)
* [[`74fdf732d0`](https://github.com/nodejs/node/commit/74fdf732d0)] - **doc**: revisión y corrección de COLLABORATOR_GUIDE.md (Rich Trott) [#1964](https://github.com/nodejs/node/pull/1964)
* [[`5fe6e83640`](https://github.com/nodejs/node/commit/5fe6e83640)] - **doc**: revisión y corrección de GOVERNANCE.md (Rich Trott) [#1963](https://github.com/nodejs/node/pull/1963)
* [[`428526544c`](https://github.com/nodejs/node/commit/428526544c)] - **doc**: añadir a ChALkeR como colaborador (Сковорода Никита Андреевич) [#1927](https://github.com/nodejs/node/pull/1927)
* [[`5dfe0d5d61`](https://github.com/nodejs/node/commit/5dfe0d5d61)] - **doc**: remover SEMVER-MINOR & MAJOR irrelevantes (Rod Vagg)
* [[`fb8811d95e`](https://github.com/nodejs/node/commit/fb8811d95e)] - **lib,test**: corregir problemas de whitespace (Roman Reiss) [#1971](https://github.com/nodejs/node/pull/1971)
* [[`a4f4909f3d`](https://github.com/nodejs/node/commit/a4f4909f3d)] - **module**: corregir stat con rutas largas en Windows (Michaël Zasso) [#2013](https://github.com/nodejs/node/pull/2013)
* [[`a71ee93afe`](https://github.com/nodejs/node/commit/a71ee93afe)] - **module**: reducir las llamadas de sistema durante la búsqueda de require (Pierre Inglebert) [#1920](https://github.com/nodejs/node/pull/1920)
* [[`671e64ac73`](https://github.com/nodejs/node/commit/671e64ac73)] - **module**: permitir rutas largas para require en Windows (Michaël Zasso)
* [[`061342a500`](https://github.com/nodejs/node/commit/061342a500)] - **net**: Diferir lectura hasta que puedan ser añadidos listeners (James Hartig) [#1496](https://github.com/nodejs/node/pull/1496)
* [[`5d2b846d11`](https://github.com/nodejs/node/commit/5d2b846d11)] - **test**: hacer aserciones a los dirs de tmp y fixtures de manera distinta (Rich Trott) [#2015](https://github.com/nodejs/node/pull/2015)
* [[`b0990ef45d`](https://github.com/nodejs/node/commit/b0990ef45d)] - **test**: confirmar enlace simbólico (Rich Trott) [#2014](https://github.com/nodejs/node/pull/2014)
* [[`3ba4f71fc4`](https://github.com/nodejs/node/commit/3ba4f71fc4)] - **test**: revisar el resultado tan pronto como sea posible (Rich Trott) [#2007](https://github.com/nodejs/node/pull/2007)
* [[`0abcf44d6b`](https://github.com/nodejs/node/commit/0abcf44d6b)] - **test**: añadir prueba de UTF-8 de porción de Búfer UTF-8 (Rich Trott) [#1989](https://github.com/nodejs/node/pull/1989)
* [[`88c1831ff4`](https://github.com/nodejs/node/commit/88c1831ff4)] - **test**: los fallos de creación de tmpdir deberían hacer que las pruebas fallen (Rich Trott) [#1976](https://github.com/nodejs/node/pull/1976)
* [[`52a822d944`](https://github.com/nodejs/node/commit/52a822d944)] - **test**: arreglar test-cluster-worker-disconnect (Santiago Gimeno) [#1919](https://github.com/nodejs/node/pull/1919)
* [[`7c79490bfb`](https://github.com/nodejs/node/commit/7c79490bfb)] - **test**: solo refrescar tmpDir para las pruebas que necesiten de ello (Rich Trott) [#1954](https://github.com/nodejs/node/pull/1954)
* [[`88d7904c0b`](https://github.com/nodejs/node/commit/88d7904c0b)] - **test**: remover repetición de prueba (Rich Trott) [#1874](https://github.com/nodejs/node/pull/1874)
* [[`91dfb5e094`](https://github.com/nodejs/node/commit/91dfb5e094)] - **tools**: hacer que test-npm funcione sin npm global (Jeremiah Senkpiel) [#1926](https://github.com/nodejs/node/pull/1926)
* [[`3777f41562`](https://github.com/nodejs/node/commit/3777f41562)] - **tools**: habilitar las reglas relacionadas con whitespace en eslint (Roman Reiss) [#1971](https://github.com/nodejs/node/pull/1971)
* [[`626432d843`](https://github.com/nodejs/node/commit/626432d843)] - **util**: no repetir isBuffer (Brendan Ashworth) [#1988](https://github.com/nodejs/node/pull/1988)
* [[`1d79f572f1`](https://github.com/nodejs/node/commit/1d79f572f1)] - **util**: mover deprecate() al módulo interno (Brendan Ashworth) [#1988](https://github.com/nodejs/node/pull/1988)
* [[`4b4b1760b5`](https://github.com/nodejs/node/commit/4b4b1760b5)] - **v8**: hacer cherry-pick al parche del build de uclibc desde upstream (Ben Noordhuis) [#1974](https://github.com/nodejs/node/pull/1974)
* [[`5d0cee46bb`](https://github.com/nodejs/node/commit/5d0cee46bb)] - **vm**: remover HandleScopes innecesarios (Ben Noordhuis) [#2001](https://github.com/nodejs/node/pull/2001)
* [[`0ecf9457b5`](https://github.com/nodejs/node/commit/0ecf9457b5)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)
* [[`953b3e75e8`](https://github.com/nodejs/node/commit/953b3e75e8)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)
* [[`3806d875d3`](https://github.com/nodejs/node/commit/3806d875d3)] - **zlib**: evitar excepción no capturada en zlibBuffer (Michaël Zasso) [#1811](https://github.com/nodejs/node/pull/1811)

<a id="2.3.0"></a>

## 2015-06-13, Versión 2.3.0, @rvagg

### Cambios notables

* **libuv**: Upgraded to 1.6.0 and 1.6.1, see [full ChangeLog](https://github.com/libuv/libuv/blob/60e515d9e6f3d86c0eedad583805201f32ea3aed/ChangeLog#L1-L36) for details. (Saúl Ibarra Corretgé) [#1905](https://github.com/nodejs/node/pull/1905) [#1889](https://github.com/nodejs/node/pull/1889). Destacan:
  - Corregir el bloqueo de TTY en OS X
  - Corregir el envío no sincrónico de callbacks por UDP
  - Añadir `uv_os_homedir()` (expuesta como `os.homedir()`, vea más abajo)
* **npm**: See full [release notes](https://github.com/npm/npm/releases/tag/v2.11.1) for details. (Kat Marchán) [#1899](https://github.com/nodejs/node/pull/1899). Destaca:
  - Utilice GIT_SSH_COMMAND (disponible a partir de Git 2.3)
* **openssl**:
  - Actualizar a 1.0.2b y 1.0.2c, introduce una protección contra ataques de intermediario de DHE (Logjam) y corrige ECParameters malformados, causantes de un bucle infinito (CVE-2015-1788). Vea el [aviso de seguridad](https://www.openssl.org/news/secadv_20150611.txt) para detalles completos. (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950) [#1958](https://github.com/nodejs/node/pull/1958)
  - Soportar el modo [FIPS](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standards) de OpenSSL, consulte [README](https://github.com/nodejs/node#building-iojs-with-fips-compliant-openssl) para obtener instrucciones. (Fedor Indutny) [#1890](https://github.com/nodejs/node/pull/1890)
* **os**: Añadir el método `os.homedir()`. (Colin Ihrig) [#1791](https://github.com/nodejs/node/pull/1791)
* **smalloc**: Desaprobar el módulo completo. (Vladimir Kurchatkin) [#1822](https://github.com/nodejs/node/pull/1822)
* Añadir nuevos colaboradores:
  - Alex Kocharin ([@rlidwka](https://github.com/rlidwka))
  - Christopher Monsanto ([@monsanto](https://github.com/monsanto))
  - Ali Ijaz Sheikh ([@ofrobots](https://github.com/ofrobots))
  - Oleg Elifantiev ([@Olegas](https://github.com/Olegas))
  - Domenic Denicola ([@domenic](https://github.com/domenic))
  - Rich Trott ([@Trott](https://github.com/Trott))

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

## Commits

* [[`9c0a1b8cfc`](https://github.com/nodejs/node/commit/9c0a1b8cfc)] - **cluster**: esperar al cierre de los servidores antes de desconectar (Oleg Elifantiev) [#1400](https://github.com/nodejs/node/pull/1400)
* [[`0f68377f69`](https://github.com/nodejs/node/commit/0f68377f69)] - **crypto**: soportar el modo FIPS de OpenSSL (Fedor Indutny) [#1890](https://github.com/nodejs/node/pull/1890)
* [[`38d1afc24d`](https://github.com/nodejs/node/commit/38d1afc24d)] - **(SEMVER-MINOR)** **crypto**: add getCurves() to get supported ECs (Brian White) [#1914](https://github.com/nodejs/node/pull/1914)
* [[`a4dbf45b59`](https://github.com/nodejs/node/commit/a4dbf45b59)] - **crypto**: actualizar los certificados root (Ben Noordhuis) [#1833](https://github.com/nodejs/node/pull/1833)
* [[`81029c639a`](https://github.com/nodejs/node/commit/81029c639a)] - **debugger**: mejorar el mensaje de error de ESRCH (Jackson Tian) [#1863](https://github.com/nodejs/node/pull/1863)
* [[`2a7fd0ad32`](https://github.com/nodejs/node/commit/2a7fd0ad32)] - **deps**: actualizar el doc UPGRADING.md a openssl-1.0.2c (Shigeki Ohtsu) [#1958](https://github.com/nodejs/node/pull/1958)
* [[`6b3df929e0`](https://github.com/nodejs/node/commit/6b3df929e0)] - **deps**: reemplazar todas la cabeceras en openssl (Shigeki Ohtsu) [#1958](https://github.com/nodejs/node/pull/1958)
* [[`664a659696`](https://github.com/nodejs/node/commit/664a659696)] - **deps**: añadir -no_rand_screen al s_client de openssl (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`42a8de2ac6`](https://github.com/nodejs/node/commit/42a8de2ac6)] - **deps**: corregir error de compilación de asm en x86_win32 (Shigeki Ohtsu) [iojs/io.js#1389](https://github.com/iojs/io.js/pull/1389)
* [[`c66c3d9fa3`](https://github.com/nodejs/node/commit/c66c3d9fa3)] - **deps**: corregir error de ensamblaje de openssl en win32 de ia32 (Fedor Indutny) [iojs/io.js#1389](https://github.com/iojs/io.js/pull/1389)
* [[`86737cf0a0`](https://github.com/nodejs/node/commit/86737cf0a0)] - **deps**: actualizar fuentes de openssl a 1.0.2c (Shigeki Ohtsu) [#1958](https://github.com/nodejs/node/pull/1958)
* [[`94804969b7`](https://github.com/nodejs/node/commit/94804969b7)] - **deps**: actualizar archivos de asm para openssl-1.0.2b (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950)
* [[`38444915e0`](https://github.com/nodejs/node/commit/38444915e0)] - **deps**: reemplazar todas las cabeceras en openssl (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950)
* [[`f62b613252`](https://github.com/nodejs/node/commit/f62b613252)] - **deps**: añadir -no_rand_screen a s_client de openssl (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`f624d0122c`](https://github.com/nodejs/node/commit/f624d0122c)] - **deps**: corregir error de compilación de asm de openssl en x86_win32 (Shigeki Ohtsu) [iojs/io.js#1389](https://github.com/iojs/io.js/pull/1389)
* [[`dcd67cc8d7`](https://github.com/nodejs/node/commit/dcd67cc8d7)] - **deps**: corregir error de ensamblaje de openssl en win32 de ia32 (Fedor Indutny) [iojs/io.js#1389](https://github.com/iojs/io.js/pull/1389)
* [[`c21b24decf`](https://github.com/nodejs/node/commit/c21b24decf)] - **deps**: actualizar las fuentes de openssl a 1.0.2b (Shigeki Ohtsu) [#1950](https://github.com/nodejs/node/pull/1950)
* [[`2dc819b09a`](https://github.com/nodejs/node/commit/2dc819b09a)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`f41b7f12b5`](https://github.com/nodejs/node/commit/f41b7f12b5)] - **deps**: actualizar a npm 2.11.1 (Kat Marchán) [#1899](https://github.com/nodejs/node/pull/1899)
* [[`a5bd466440`](https://github.com/nodejs/node/commit/a5bd466440)] - **deps**: actualizar libuv a la versión 1.6.1 (Saúl Ibarra Corretgé) [#1905](https://github.com/nodejs/node/pull/1905)
* [[`aa33db3238`](https://github.com/nodejs/node/commit/aa33db3238)] - **deps**: actualizar libuv a la versión 1.6.0 (Saúl Ibarra Corretgé) [#1889](https://github.com/nodejs/node/pull/1889)
* [[`0ee497f0b4`](https://github.com/nodejs/node/commit/0ee497f0b4)] - **deps**: añadir -no_rand_screen al s_client de openssl (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`b5cd2f0986`](https://github.com/nodejs/node/commit/b5cd2f0986)] - **dgram**: revertir 18d457b parcialmente (Saúl Ibarra Corretgé) [#1889](https://github.com/nodejs/node/pull/1889)
* [[`a3cc43d0a4`](https://github.com/nodejs/node/commit/a3cc43d0a4)] - **doc**: añadir a Trott como colaborador (Rich Trott) [#1962](https://github.com/nodejs/node/pull/1962)
* [[`cf5020fc02`](https://github.com/nodejs/node/commit/cf5020fc02)] - **doc**: añadir a domenic como colaborador (Domenic Denicola) [#1942](https://github.com/nodejs/node/pull/1942)
* [[`11ed5f31ab`](https://github.com/nodejs/node/commit/11ed5f31ab)] - **doc**: añadir a Olegas como colaborador (Oleg Elifantiev) [#1930](https://github.com/nodejs/node/pull/1930)
* [[`f500e1833b`](https://github.com/nodejs/node/commit/f500e1833b)] - **doc**: añadir a ofrobots como colaborador (Ali Ijaz Sheikh)
* [[`717724611a`](https://github.com/nodejs/node/commit/717724611a)] - **doc**: añadir a monsanto como colaborador (Christopher Monsanto) [#1932](https://github.com/nodejs/node/pull/1932)
* [[`7192b6688c`](https://github.com/nodejs/node/commit/7192b6688c)] - **doc**: añadir a rlidwka como colaborador (Alex Kocharin) [#1929](https://github.com/nodejs/node/pull/1929)
* [[`9f3a03f0d4`](https://github.com/nodejs/node/commit/9f3a03f0d4)] - **doc**: añadir referencias a crypto.getCurves() (Roman Reiss) [#1918](https://github.com/nodejs/node/pull/1918)
* [[`ff39ecb914`](https://github.com/nodejs/node/commit/ff39ecb914)] - **doc**: remover unión de coma (Rich Trott) [#1900](https://github.com/nodejs/node/pull/1900)
* [[`deb8b87dc9`](https://github.com/nodejs/node/commit/deb8b87dc9)] - **doc**: añadir nota sobre curvas ECC disponibles (Ryan Petschek) [#1913](https://github.com/nodejs/node/pull/1913)
* [[`89a5b9040e`](https://github.com/nodejs/node/commit/89a5b9040e)] - **doc**: corregir la documentación de http.IncomingMessage.socket (Сковорода Никита Андреевич) [#1867](https://github.com/nodejs/node/pull/1867)
* [[`d29034b34b`](https://github.com/nodejs/node/commit/d29034b34b)] - **doc**: ajustar registro de cambios para clarificar reversión de `client` (Rod Vagg) [#1859](https://github.com/nodejs/node/pull/1859)
* [[`a79dece8ad`](https://github.com/nodejs/node/commit/a79dece8ad)] - **docs**: añadir valor de retorno para funciones sincrónicas del sistema de archivos (Tyler Anton) [#1770](https://github.com/nodejs/node/pull/1770)
* [[`1cb72c14c4`](https://github.com/nodejs/node/commit/1cb72c14c4)] - **docs**: borrar los archivos css no usados/duplicados (Robert Kowalski) [#1770](https://github.com/nodejs/node/pull/1770)
* [[`53a4eb3198`](https://github.com/nodejs/node/commit/53a4eb3198)] - **fs**: hacer que SyncWriteStream sea no-numerable (Sakthipriyan Vairamani) [#1870](https://github.com/nodejs/node/pull/1870)
* [[`a011c3243f`](https://github.com/nodejs/node/commit/a011c3243f)] - **fs**: refactorización menor (Sakthipriyan Vairamani) [#1870](https://github.com/nodejs/node/pull/1870)
* [[`8841132f30`](https://github.com/nodejs/node/commit/8841132f30)] - **fs**: remover inStatWatchers y utilizar Mapa para la búsqueda (Sakthipriyan Vairamani) [#1870](https://github.com/nodejs/node/pull/1870)
* [[`67a11b9bcc`](https://github.com/nodejs/node/commit/67a11b9bcc)] - **fs**: remoción de nullCheckCallNT innecesaria (Sakthipriyan Vairamani) [#1870](https://github.com/nodejs/node/pull/1870)
* [[`09f2a67bd8`](https://github.com/nodejs/node/commit/09f2a67bd8)] - **fs**: mejorar las descripciones de los mensajes de error (Sakthipriyan Vairamani) [#1870](https://github.com/nodejs/node/pull/1870)
* [[`2dcef83b5f`](https://github.com/nodejs/node/commit/2dcef83b5f)] - **fs**: utilizar `kMaxLength` desde el enlazado (Vladimir Kurchatkin) [#1903](https://github.com/nodejs/node/pull/1903)
* [[`353e26e3c7`](https://github.com/nodejs/node/commit/353e26e3c7)] - **(SEMVER-MINOR)** **fs**: Add string encoding option for Stream method (Yosuke Furukawa) [#1845](https://github.com/nodejs/node/pull/1845)
* [[`8357c5084b`](https://github.com/nodejs/node/commit/8357c5084b)] - **fs**: establecer la codificación en fs.createWriteStream (Yosuke Furukawa) [#1844](https://github.com/nodejs/node/pull/1844)
* [[`02c345020a`](https://github.com/nodejs/node/commit/02c345020a)] - **gitignore**: no ignorar el módulo de depuración de npm (Kat Marchán) [#1908](https://github.com/nodejs/node/pull/1908)
* [[`b5b8ff117c`](https://github.com/nodejs/node/commit/b5b8ff117c)] - **lib**: no utilizar el Búfer global (Roman Reiss) [#1794](https://github.com/nodejs/node/pull/1794)
* [[`a251657058`](https://github.com/nodejs/node/commit/a251657058)] - **node**: marcar las promesas como manejadas tan pronto como sea posible (Vladimir Kurchatkin) [#1952](https://github.com/nodejs/node/pull/1952)
* [[`2eb170874a`](https://github.com/nodejs/node/commit/2eb170874a)] - **openssl**: corregir el requerimiento de keypress en aplicaciones en win32 (Shigeki Ohtsu) [iojs/io.js#1389](https://github.com/iojs/io.js/pull/1389)
* [[`a130132c8f`](https://github.com/nodejs/node/commit/a130132c8f)] - **openssl**: corregir el requerimiento de keypress en aplicaciones en win32 (Shigeki Ohtsu) [iojs/io.js#1389](https://github.com/iojs/io.js/pull/1389)
* [[`6e78e5feaa`](https://github.com/nodejs/node/commit/6e78e5feaa)] - **(SEMVER-MINOR)** **os**: add homedir() (cjihrig) [#1791](https://github.com/nodejs/node/pull/1791)
* [[`d9e250295b`](https://github.com/nodejs/node/commit/d9e250295b)] - ***Revert*** "**readline**: allow tabs in input" (Jeremiah Senkpiel) [#1961](https://github.com/nodejs/node/pull/1961)
* [[`4b3d493c4b`](https://github.com/nodejs/node/commit/4b3d493c4b)] - **readline**: permitir tabs en el input (Rich Trott) [#1761](https://github.com/nodejs/node/pull/1761)
* [[`6d95f4ff92`](https://github.com/nodejs/node/commit/6d95f4ff92)] - **(SEMVER-MINOR)** **smalloc**: deprecate whole module (Vladimir Kurchatkin) [#1822](https://github.com/nodejs/node/pull/1822)
* [[`8c71a9241d`](https://github.com/nodejs/node/commit/8c71a9241d)] - **src**: ocultar el símbolo de InitializeICUDirectory (Ben Noordhuis) [#1815](https://github.com/nodejs/node/pull/1815)
* [[`5b6f575c1f`](https://github.com/nodejs/node/commit/5b6f575c1f)] - ***Revert*** "**src**: add getopt option parser" (Evan Lucas) [#1862](https://github.com/nodejs/node/pull/1862)
* [[`c0e7bf2d8c`](https://github.com/nodejs/node/commit/c0e7bf2d8c)] - **src**: añadir el analizador de opciones de getopt (Evan Lucas) [#1804](https://github.com/nodejs/node/pull/1804)
* [[`8ea6844d26`](https://github.com/nodejs/node/commit/8ea6844d26)] - **test**: añadir prueba para guardado fallido en REPL (Rich Trott) [#1818](https://github.com/nodejs/node/pull/1818)
* [[`03ce84dfa1`](https://github.com/nodejs/node/commit/03ce84dfa1)] - **test**: corregir el apuro de cluster-worker-wait-server-close (Sam Roberts) [#1953](https://github.com/nodejs/node/pull/1953)
* [[`a6b8ee19b8`](https://github.com/nodejs/node/commit/a6b8ee19b8)] - **test**: crear directorio temporal en common.js (Rich Trott) [#1877](https://github.com/nodejs/node/pull/1877)
* [[`ff8202c6f4`](https://github.com/nodejs/node/commit/ff8202c6f4)] - **test**: corregir acceso de variables no declarado (Roman Reiss) [#1794](https://github.com/nodejs/node/pull/1794)
* [[`d9ddd7d345`](https://github.com/nodejs/node/commit/d9ddd7d345)] - **test**: remover comentario de TODO (Rich Trott) [#1820](https://github.com/nodejs/node/pull/1820)
* [[`6537fd4b55`](https://github.com/nodejs/node/commit/6537fd4b55)] - **test**: remover TODO (Rich Trott) [#1875](https://github.com/nodejs/node/pull/1875)
* [[`a804026c9b`](https://github.com/nodejs/node/commit/a804026c9b)] - **test**: corregir prueba de FreeBSD que no sirve (Santiago Gimeno) [#1881](https://github.com/nodejs/node/pull/1881)
* [[`43a82f8a71`](https://github.com/nodejs/node/commit/43a82f8a71)] - **test**: corregir test-sync-io-option (Evan Lucas) [#1840](https://github.com/nodejs/node/pull/1840)
* [[`4ed25f664d`](https://github.com/nodejs/node/commit/4ed25f664d)] - **test**: añadir -no_rand_screen para tls-server-verify (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`4cf323d23d`](https://github.com/nodejs/node/commit/4cf323d23d)] - **test**: matar el proceso secundario en tls-server-verify para aumentar la velocidad (Shigeki Ohtsu) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`e6ccdcc1fe`](https://github.com/nodejs/node/commit/e6ccdcc1fe)] - **test**: mejorar el output de la consola de tls-server-verify (João Reis) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`975e5956f0`](https://github.com/nodejs/node/commit/975e5956f0)] - **test**: ejecutar paralelamente los servidores de tls-server-verify (João Reis) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`b18604ba2c`](https://github.com/nodejs/node/commit/b18604ba2c)] - **test**: ejecución paralela de los clientes de tls-server-verify (João Reis) [#1836](https://github.com/nodejs/node/pull/1836)
* [[`f78c722df5`](https://github.com/nodejs/node/commit/f78c722df5)] - **test**: remover referencias conectadas a 'iojs' (Rod Vagg) [#1882](https://github.com/nodejs/node/pull/1882)
* [[`bd99e8de8e`](https://github.com/nodejs/node/commit/bd99e8de8e)] - **test**: mayor cobertura de prueba para maxConnections (Rich Trott) [#1855](https://github.com/nodejs/node/pull/1855)
* [[`b9267189a5`](https://github.com/nodejs/node/commit/b9267189a5)] - **test**: corregir test-child-process-stdout-flush-exit (Santiago Gimeno) [#1868](https://github.com/nodejs/node/pull/1868)
* [[`d20f018dcf`](https://github.com/nodejs/node/commit/d20f018dcf)] - **test**: hacer menos estricta la condición para detectar bucle infinito (Yosuke Furukawa) [#1857](https://github.com/nodejs/node/pull/1857)
* [[`e0e96acc6f`](https://github.com/nodejs/node/commit/e0e96acc6f)] - **test**: remover prueba de complemento de smalloc (Ben Noordhuis) [#1835](https://github.com/nodejs/node/pull/1835)
* [[`8704c58fc4`](https://github.com/nodejs/node/commit/8704c58fc4)] - **test**: remover tarea de comentario no necesaria (Rich Trott) [#1858](https://github.com/nodejs/node/pull/1858)
* [[`8732977536`](https://github.com/nodejs/node/commit/8732977536)] - **tls**: corregir las referencias para que señalen un `cb` indefinido (Fedor Indutny) [#1951](https://github.com/nodejs/node/pull/1951)
* [[`75930bb38c`](https://github.com/nodejs/node/commit/75930bb38c)] - **tls**: evitar use-after-free (Fedor Indutny) [#1702](https://github.com/nodejs/node/pull/1702)
* [[`5795e835a1`](https://github.com/nodejs/node/commit/5795e835a1)] - **tls**: emitir errores en el cierre durante acción asíncrona (Fedor Indutny) [#1702](https://github.com/nodejs/node/pull/1702)
* [[`59d9734e21`](https://github.com/nodejs/node/commit/59d9734e21)] - **tls_wrap**: invocar las callbacks programadas en DestroySSL (Fedor Indutny) [#1702](https://github.com/nodejs/node/pull/1702)
* [[`6e4d30286d`](https://github.com/nodejs/node/commit/6e4d30286d)] - **tools**: habilitar/añadir reglas de eslint adicionales (Roman Reiss) [#1794](https://github.com/nodejs/node/pull/1794)
* [[`098354a9f8`](https://github.com/nodejs/node/commit/098354a9f8)] - **tools**: actualizar certdata.txt (Ben Noordhuis) [#1833](https://github.com/nodejs/node/pull/1833)
* [[`a2d921d6a0`](https://github.com/nodejs/node/commit/a2d921d6a0)] - **tools**: personalizar mk-ca-bundle.pl (Ben Noordhuis) [#1833](https://github.com/nodejs/node/pull/1833)
* [[`5be9efca40`](https://github.com/nodejs/node/commit/5be9efca40)] - **tools**: actualizar mk-ca-bundle.pl a HEAD de upstream (Ben Noordhuis) [#1833](https://github.com/nodejs/node/pull/1833)
* [[`1baba0580d`](https://github.com/nodejs/node/commit/1baba0580d)] - **tools**: Corregir la copia de contenidos de deps/npm (thefourtheye) [#1853](https://github.com/nodejs/node/pull/1853)
* [[`628845b816`](https://github.com/nodejs/node/commit/628845b816)] - **(SEMVER-MINOR)** **util**: introduce `printDeprecationMessage` function (Vladimir Kurchatkin) [#1822](https://github.com/nodejs/node/pull/1822)
* [[`91d0a8b19c`](https://github.com/nodejs/node/commit/91d0a8b19c)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [iojs/io.js#1433](https://github.com/iojs/io.js/pull/1433)

<a id="2.2.1"></a>

## 2015-06-01, Versión 2.2.1, @rvagg

### Cambios notables

* **http**: Revierte la movilización de la propiedad `client`de `IncomingMessage` a su prototipo. Aún sin haber sido documentada, esta propiedad fue utilizada y se asumió como una "propiedad de posesión" fuera del ambiente controlado, destacadamente por [request](https://github.com/request/request), que es utilizada por el npm. (Michaël Zasso) [#1852](https://github.com/nodejs/node/pull/1852).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`c5a1009903`](https://github.com/nodejs/node/commit/c5a1009903)] - **build**: evitar el paso de strings vacías para la construcción de banderas (Johan Bergström) [#1789](https://github.com/nodejs/node/pull/1789)
* [[`5d83401086`](https://github.com/nodejs/node/commit/5d83401086)] - **doc**: colocar SEMVER-MINOR en la corrección de la pre-carga de módulo 2.2.0 (Rod Vagg)
* [[`4d6b768e5d`](https://github.com/nodejs/node/commit/4d6b768e5d)] - **http**: revertir desaprobación de la propiedad del cliente (Michaël Zasso) [#1852](https://github.com/nodejs/node/pull/1852)

<a id="2.2.0"></a>

## 2015-05-31, Versión 2.2.0, @rvagg

### Cambios notables

* **node**: Acelere `require()` sustituyendo el uso de `fs.statSync()` y `fs.readFileSync()` con variantes internas que sean más rápidas para este caso de uso y no creen tantos objetos que hayan de ser limpiados por el recolector de basura. Los dos beneficios principales son: un incremento significativo en el tiempo de arranque de las aplicaciones típicas y un mejor tiempo de arranque para el depurador, a través de la eliminación de casi todos los miles de eventos de excepción. (Ben Noordhuis) [#1801](https://github.com/nodejs/node/pull/1801).
* **node**: La resolución de los módulos de pre-carga (`-r` o `--require`) ahora sigue las reglas estándar de `require()`, en lugar de solo resolver rutas, de modo que ahora puede pre-cargar módulos en node_modules. (Ali Ijaz Sheikh) [#1812](https://github.com/nodejs/node/pull/1812).
* **npm**: npm fue actualizado a v2.11.0. Nuevos hooks para los eventos del ciclo de vida de `preversion`, `version`, y `postversion`, algunos cambios de licencia relacionados con SPDX e inclusiones de archivos de licencia. Consulte las [notas del lanzamiento](https://github.com/npm/npm/releases/tag/v2.11.0) para ver los detalles completos.

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`a77c330c32`](https://github.com/nodejs/node/commit/a77c330c32)] - **(SEMVER-MINOR)** **child_process**: expose ChildProcess constructor (Evan Lucas) [#1760](https://github.com/nodejs/node/pull/1760)
* [[`3a1bc067d4`](https://github.com/nodejs/node/commit/3a1bc067d4)] - ***Revert*** "**core**: set PROVIDER type as Persistent class id" (Ben Noordhuis) [#1827](https://github.com/nodejs/node/pull/1827)
* [[`f9fd554500`](https://github.com/nodejs/node/commit/f9fd554500)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`c1afa53648`](https://github.com/nodejs/node/commit/c1afa53648)] - **deps**: actualizar npm a 2.11.0 (Forrest L Norvell) [iojs/io.js#1829](https://github.com/iojs/io.js/pull/1829)
* [[`ff794498e7`](https://github.com/nodejs/node/commit/ff794498e7)] - **doc**: `fs.*File()` también acepta strings de codificación (Rich Trott) [#1806](https://github.com/nodejs/node/pull/1806)
* [[`98649fd31a`](https://github.com/nodejs/node/commit/98649fd31a)] - **doc**: añadir documentación para el hook AtExit (Steve Sharp) [#1014](https://github.com/nodejs/node/pull/1014)
* [[`eb1856dfd1`](https://github.com/nodejs/node/commit/eb1856dfd1)] - **doc**: clarificar la estabilidad de fs.watch y sus parientes (Rich Trott) [#1775](https://github.com/nodejs/node/pull/1775)
* [[`a74c2c9458`](https://github.com/nodejs/node/commit/a74c2c9458)] - **doc**: plasmar el comportamiento de la decodificación de url (Josh Gummersall) [#1731](https://github.com/nodejs/node/pull/1731)
* [[`ba76a9d872`](https://github.com/nodejs/node/commit/ba76a9d872)] - **doc**: remover entrada de semver-major incorrecta de CHANGELOG (Rod Vagg) [#1782](https://github.com/nodejs/node/pull/1782)
* [[`a6a3f8c78d`](https://github.com/nodejs/node/commit/a6a3f8c78d)] - **doc**: corregir changelog s/2.0.3/2.1.0 (Rod Vagg)
* [[`2c686fd3ce`](https://github.com/nodejs/node/commit/2c686fd3ce)] - **http**: vaciar cabecera almacenada (Vladimir Kurchatkin) [#1695](https://github.com/nodejs/node/pull/1695)
* [[`1eec5f091a`](https://github.com/nodejs/node/commit/1eec5f091a)] - **http**: simplificar código y remover propiedades no utilizadas (Brian White) [#1572](https://github.com/nodejs/node/pull/1572)
* [[`1bbf8d0720`](https://github.com/nodejs/node/commit/1bbf8d0720)] - **lib**: acelerar require(), fase 2 (Ben Noordhuis) [#1801](https://github.com/nodejs/node/pull/1801)
* [[`b14fd1a720`](https://github.com/nodejs/node/commit/b14fd1a720)] - **lib**: acelerar require(), fase 1 (Ben Noordhuis) [#1801](https://github.com/nodejs/node/pull/1801)
* [[`5abd4ac079`](https://github.com/nodejs/node/commit/5abd4ac079)] - **lib**: simplificar el uso de nextTick() (Brian White) [#1612](https://github.com/nodejs/node/pull/1612)
* [[`5759722cfa`](https://github.com/nodejs/node/commit/5759722cfa)] - **(SEMVER-MINOR)** **src**: fix module search path for preload modules (Ali Ijaz Sheikh) [#1812](https://github.com/nodejs/node/pull/1812)
* [[`a65762cab6`](https://github.com/nodejs/node/commit/a65762cab6)] - **src**: remover código viejo (Brendan Ashworth) [#1819](https://github.com/nodejs/node/pull/1819)
* [[`93a44d5228`](https://github.com/nodejs/node/commit/93a44d5228)] - **src**: arreglar los eventos diferidos que no funcionan con -e (Ben Noordhuis) [#1793](https://github.com/nodejs/node/pull/1793)
* [[`8059393934`](https://github.com/nodejs/node/commit/8059393934)] - **test**: revisar tipo de error de net.Server.listen() (Rich Trott) [#1821](https://github.com/nodejs/node/pull/1821)
* [[`4e90c82cdb`](https://github.com/nodejs/node/commit/4e90c82cdb)] - **test**: añadir prueba de regresión de complemento de perfilador del montículo (Ben Noordhuis) [#1828](https://github.com/nodejs/node/pull/1828)
* [[`6dfca71af0`](https://github.com/nodejs/node/commit/6dfca71af0)] - **test**: no hacer lint a los test/addons/doc-*/ auto-generados (Ben Noordhuis) [#1793](https://github.com/nodejs/node/pull/1793)
* [[`c2b8b30836`](https://github.com/nodejs/node/commit/c2b8b30836)] - **test**: remover avisos independientes sobre derecho de autor (Ben Noordhuis) [#1793](https://github.com/nodejs/node/pull/1793)
* [[`280fb01daf`](https://github.com/nodejs/node/commit/280fb01daf)] - **test**: corregir advertencia de desaprobación en prueba de complementos (Ben Noordhuis) [#1793](https://github.com/nodejs/node/pull/1793)
* [[`8606793999`](https://github.com/nodejs/node/commit/8606793999)] - **tools**: pasar constante al registrador en lugar de string (Johan Bergström) [#1842](https://github.com/nodejs/node/pull/1842)
* [[`fbd2b59716`](https://github.com/nodejs/node/commit/fbd2b59716)] - **tools**: añadir objectLiteralShorthandProperties a .eslintrc (Evan Lucas) [#1760](https://github.com/nodejs/node/pull/1760)
* [[`53e98cc1b4`](https://github.com/nodejs/node/commit/53e98cc1b4)] - **win,node-gyp**: habilitar por defecto el hook delay-load (Bert Belder) [#1763](https://github.com/nodejs/node/pull/1763)

<a id="2.1.0"></a>

## 2015-05-24, Versión 2.1.0, @rvagg

### Cambios notables

* **crypto**: Los parámetros del intercambio de claves Diffie-Hellman (DHE) (`'dhparams'`) ahora deben ser de 1024 o más bits, o se arrojará un error. Asimismo, una advertencia será impresa en la consola si suministra menos de 2048 bits. Consulte https://weakdh.org/ para informarse sobre este asunto de seguridad con un mayor contexto. (Shigeki Ohtsu) [#1739](https://github.com/nodejs/node/pull/1739).
* **node**: Una nueva bandera de línea de comandos `--trace-sync-io` imprimirá una advertencia y un stack trace cada vez que una API sincrónica sea utilizada. Esto puede utilizarse para rastrear las llamadas sincrónicas que puedan estar realentizando una aplicación. (Trevor Norris) [#1707](https://github.com/nodejs/node/pull/1707).
* **node**: To allow for chaining of methods, the `setTimeout()`, `setKeepAlive()`, `setNoDelay()`, `ref()` and `unref()` methods used in `'net'`, `'dgram'`, `'http'`, `'https'` and `'tls'` now return the current instance instead of `undefined` (Roman Reiss & Evan Lucas) [#1699](https://github.com/nodejs/node/pull/1699) [#1768](https://github.com/nodejs/node/pull/1768) [#1779](https://github.com/nodejs/node/pull/1779).
* **npm**: Upgraded to v2.10.1, release notes can be found in <https://github.com/npm/npm/releases/tag/v2.10.1> and <https://github.com/npm/npm/releases/tag/v2.10.0>.
* **util**: A significant speed-up (in the order of 35%) for the common-case of a single string argument to `util.format()`, used by `console.log()` (Сковорода Никита Андреевич) [#1749](https://github.com/nodejs/node/pull/1749).

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónico como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación de la url al resolver entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`9da168b71f`](https://github.com/nodejs/node/commit/9da168b71f)] - **buffer**: optimize Buffer.byteLength (Brendan Ashworth) [#1713](https://github.com/nodejs/node/pull/1713)
* [[`2b1c01c2cc`](https://github.com/nodejs/node/commit/2b1c01c2cc)] - **build**: refactor pkg-config for shared libraries (Johan Bergström) [#1603](https://github.com/nodejs/node/pull/1603)
* [[`3c44100558`](https://github.com/nodejs/node/commit/3c44100558)] - **core**: set PROVIDER type as Persistent class id (Trevor Norris) [#1730](https://github.com/nodejs/node/pull/1730)
* [[`c1de6d249e`](https://github.com/nodejs/node/commit/c1de6d249e)] - **(SEMVER-MINOR)** **core**: implement runtime flag to trace sync io (Trevor Norris) [#1707](https://github.com/nodejs/node/pull/1707)
* [[`9e7099fa4e`](https://github.com/nodejs/node/commit/9e7099fa4e)] - **deps**: make node-gyp work with io.js (cjihrig) [iojs/io.js#990](https://github.com/iojs/io.js/pull/990)
* [[`c54d057598`](https://github.com/nodejs/node/commit/c54d057598)] - **deps**: upgrade to npm 2.10.1 (Rebecca Turner) [#1763](https://github.com/nodejs/node/pull/1763)
* [[`367ffd167d`](https://github.com/nodejs/node/commit/367ffd167d)] - **doc**: update AUTHORS list (Rod Vagg) [#1776](https://github.com/nodejs/node/pull/1776)
* [[`2bb2f06b3e`](https://github.com/nodejs/node/commit/2bb2f06b3e)] - **doc**: fix typo in CONTRIBUTING.md (Rich Trott) [#1755](https://github.com/nodejs/node/pull/1755)
* [[`515afc6367`](https://github.com/nodejs/node/commit/515afc6367)] - **doc**: path is ignored in url.format (Maurice Butler) [#1753](https://github.com/nodejs/node/pull/1753)
* [[`f0a8bc3f84`](https://github.com/nodejs/node/commit/f0a8bc3f84)] - **doc**: fix spelling in CHANGELOG (Felipe Batista)
* [[`86dd244d9b`](https://github.com/nodejs/node/commit/86dd244d9b)] - **doc**: add notes to child_process.fork() and .exec() (Rich Trott) [#1718](https://github.com/nodejs/node/pull/1718)
* [[`066274794c`](https://github.com/nodejs/node/commit/066274794c)] - **doc**: update links from iojs/io.js to nodejs/io.js (Frederic Hemberger) [#1715](https://github.com/nodejs/node/pull/1715)
* [[`cb381fe3e0`](https://github.com/nodejs/node/commit/cb381fe3e0)] - **(SEMVER-MINOR)** **net**: return this from setNoDelay and setKeepAlive (Roman Reiss) [#1779](https://github.com/nodejs/node/pull/1779)
* [[`85d9983009`](https://github.com/nodejs/node/commit/85d9983009)] - **net**: persist net.Socket options before connect (Evan Lucas) [#1518](https://github.com/nodejs/node/pull/1518)
* [[`39dde3222e`](https://github.com/nodejs/node/commit/39dde3222e)] - **(SEMVER-MINOR)** **net,dgram**: return this from ref and unref methods (Roman Reiss) [#1768](https://github.com/nodejs/node/pull/1768)
* [[`5773438913`](https://github.com/nodejs/node/commit/5773438913)] - **test**: fix jslint error (Michaël Zasso) [#1743](https://github.com/nodejs/node/pull/1743)
* [[`867631986f`](https://github.com/nodejs/node/commit/867631986f)] - **test**: fix test-sync-io-option (Santiago Gimeno) [#1734](https://github.com/nodejs/node/pull/1734)
* [[`f29762f4dd`](https://github.com/nodejs/node/commit/f29762f4dd)] - **test**: enable linting for tests (Roman Reiss) [#1721](https://github.com/nodejs/node/pull/1721)
* [[`2a71f02988`](https://github.com/nodejs/node/commit/2a71f02988)] - **tls**: emit errors happening before handshake finish (Malte-Thorben Bruns) [#1769](https://github.com/nodejs/node/pull/1769)
* [[`80342f649d`](https://github.com/nodejs/node/commit/80342f649d)] - **tls**: use `.destroy(err)` instead of destroy+emit (Fedor Indutny) [#1711](https://github.com/nodejs/node/pull/1711)
* [[`9b35be5810`](https://github.com/nodejs/node/commit/9b35be5810)] - **tls**: make server not use DHE in less than 1024bits (Shigeki Ohtsu) [#1739](https://github.com/nodejs/node/pull/1739)
* [[`214d02040e`](https://github.com/nodejs/node/commit/214d02040e)] - **util**: speed up common case of formatting string (Сковорода Никита Андреевич) [#1749](https://github.com/nodejs/node/pull/1749)
* [[`d144e96fbf`](https://github.com/nodejs/node/commit/d144e96fbf)] - **win,node-gyp**: enable delay-load hook by default (Bert Belder) [#1763](https://github.com/nodejs/node/pull/1763)
* [[`0d6d3dda95`](https://github.com/nodejs/node/commit/0d6d3dda95)] - **win,node-gyp**: make delay-load hook C89 compliant (Sharat M R) [TooTallNate/node-gyp#616](https://github.com/TooTallNate/node-gyp/pull/616)

<a id="1.8.2"></a>

## 2015-05-17, Versión 1.8.2, @rvagg

**Versión de mantenimiento**

## Cambios notables

* **crypto**: significantly reduced memory usage for TLS (Fedor Indutny & Сковорода Никита Андреевич) [#1529](https://github.com/nodejs/node/pull/1529)
* **npm**: Upgrade npm to 2.9.0. See the [v2.8.4](https://github.com/npm/npm/releases/tag/v2.8.4) and [v2.9.0](https://github.com/npm/npm/releases/tag/v2.9.0) release notes for details. Resumen:
  - Añadir soporte para el campo de autor predeterminado para hacer que `npm init -y` funcione sin un input de usuario (@othiym23) \[npm/npm/d8eee6cf9d\](https://github.com/npm/npm/commit/d8eee6cf9d2ff7aca68dfaed2de76824a3e0d9
  - Incluir módulos locales en `npm outdated` y `npm update` (@ArnaudRinquin) [npm/npm#7426](https://github.com/npm/npm/issues/7426)
  - Ahora el prefijo usado antes del número de versión en `npm version` es configurable a través de `tag-version-prefix` (@kkragenbrink) [npm/npm#8014](https://github.com/npm/npm/issues/8014)

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).
* readline: los escapes de división son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`5404cbc745`](https://github.com/nodejs/node/commit/5404cbc745)] - **buffer**: corregir segfault de copy() cuando no se pasan argumentos (Trevor Norris) [nodejs/node#1520](https://github.com/nodejs/node/pull/1520)
* [[`65dd10e9c0`](https://github.com/nodejs/node/commit/65dd10e9c0)] - **build**: remover -J de test-ci (Rod Vagg) [nodejs/node#1544](https://github.com/nodejs/node/pull/1544)
* [[`74060bb60e`](https://github.com/nodejs/node/commit/74060bb60e)] - **crypto**: hacer seguimiento a la memoria externa para las estructuras de SSL (Fedor Indutny) [nodejs/node#1529](https://github.com/nodejs/node/pull/1529)
* [[`f10f379240`](https://github.com/nodejs/node/commit/f10f379240)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [nodejs/node#990](https://github.com/nodejs/node/pull/990)
* [[`ba0e744c2c`](https://github.com/nodejs/node/commit/ba0e744c2c)] - **deps**: actualizar npm a 2.9.0 (Forrest L Norvell) [nodejs/node#1583](https://github.com/nodejs/node/pull/1583)
* [[`b3a7da1091`](https://github.com/nodejs/node/commit/b3a7da1091)] - **deps**: actualizar http_parser a 2.5.0 (Fedor Indutny) [nodejs/node#1517](https://github.com/nodejs/node/pull/1517)
* [[`4030545af6`](https://github.com/nodejs/node/commit/4030545af6)] - **fs**: validar descriptor de archivos en fs.write (Julian Duque) [#1553](https://github.com/nodejs/node/pull/1553)
* [[`898d423820`](https://github.com/nodejs/node/commit/898d423820)] - **string_decoder**: no almacenar Buffer.isEncoding en caché (Brian White) [nodejs/node#1548](https://github.com/nodejs/node/pull/1548)
* [[`32a6dbcf23`](https://github.com/nodejs/node/commit/32a6dbcf23)] - **test**: extender los tiempos de espera para ARMv6 (Rod Vagg) [nodejs/node#1554](https://github.com/nodejs/node/pull/1554)
* [[`5896fe5cd3`](https://github.com/nodejs/node/commit/5896fe5cd3)] - **test**: ajustar Makefile/test-ci, añadir a vcbuild.bat (Rod Vagg) [nodejs/node#1530](https://github.com/nodejs/node/pull/1530)
* [[`b72e4bc596`](https://github.com/nodejs/node/commit/b72e4bc596)] - **tls**: destruir inmediatamente el contexto de singleUse (Fedor Indutny) [nodejs/node#1529](https://github.com/nodejs/node/pull/1529)
* [[`1cfc455dc5`](https://github.com/nodejs/node/commit/1cfc455dc5)] - **tls**: hacer que la lista libre de SSL_CTX sea cero para un socket de singleUse (Fedor Indutny) [nodejs/node#1529](https://github.com/nodejs/node/pull/1529)
* [[`7ada680519`](https://github.com/nodejs/node/commit/7ada680519)] - **tls**: destruir SSL una vez que esté fuera de uso (Fedor Indutny) [nodejs/node#1529](https://github.com/nodejs/node/pull/1529)
* [[`71274b0263`](https://github.com/nodejs/node/commit/71274b0263)] - **tls_wrap**: utilizar localhost si options.host está vacío (Guilherme Souza) [nodejs/node#1493](https://github.com/nodejs/node/pull/1493)
* [[`0eb74a8b6c`](https://github.com/nodejs/node/commit/0eb74a8b6c)] - **win,node-gyp**: permitir que opcionalmente node.exe/iojs.ex se pueda renombrar (Bert Belder) [nodejs/node#1266](https://github.com/nodejs/node/pull/1266)

<a id="2.0.2"></a>

## 2015-05-15, Versión 2.0.2, @Fishrock123

### Cambios notables

* **win,node-gyp**: el hook delay-load para los complementos de windows ha sido correctamente habilitado por defecto, por error, había sido desactivado de manera predeterminada en la versión de lanzamiento 2.0.0 (Bert Belder) [#1433](https://github.com/nodejs/node/pull/1433)
* **os**: la barra diagonal al final de `tmpdir()` ha sido refinada para corregir un problema cuando el directorio temporal está en '/'. También toma en cuenta cuál barra diagonal es utilizada por el sistema operativo. (cjihrig) [#1673](https://github.com/nodejs/node/pull/1673)
* **tls**: los cifrados por defecto han sido actualizados para utilizar gcm y aes128 (Mike MacCana) [#1660](https://github.com/nodejs/node/pull/1660)
* **build**: los snapshots de v8 se han vuelto a habilitar por defecto, como fue sugerido por el equipo de v8, puesto que ya fueron resueltos problemas de seguridad previos. Esto debería traer algunas mejoras de rendimiento para el arranque y la creación de contextos de la vm. (Trevor Norris) [#1663](https://github.com/nodejs/node/pull/1663)
* **src**: se corrigió la falla de los módulos de pre-carga por la que no funcionaban cuando otras banderas eran utilizadas antes de `--require` (Yosuke Furukawa) [#1694](https://github.com/nodejs/node/pull/1694)
* **dgram**: se corrigió que la callback de `send()` no era asíncrona (Yosuke Furukawa) [#1313](https://github.com/nodejs/node/pull/1313)
* **readline**: ahora emitKeys sigue almacenando datos en búfer hasta que tiene suficientes para analizar. Esto corrige un problema con el análisis de escapes divididos. (Alex Kocharin) [#1601](https://github.com/nodejs/node/pull/1601)
* **cluster**: los workers ahora emiten 'disconnect' a `cluser.worker` de forma correcta (Oleg Elifantiev) [#1386](https://github.com/nodejs/node/pull/1386)
* **events**: los errores no capturados ahora proporcionan algo de contexto (Evan Lucas) [#1654](https://github.com/nodejs/node/pull/1654)

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).

### Commits

* [[`8a0e5295b4`](https://github.com/nodejs/node/commit/8a0e5295b4)] - **build**: utilizar barras inversas para las rutas en windows (Johan Bergström) [#1698](https://github.com/nodejs/node/pull/1698)
* [[`20c9a52227`](https://github.com/nodejs/node/commit/20c9a52227)] - **build**: mover --with-intl a optgroup de intl (Johan Bergström) [#1680](https://github.com/nodejs/node/pull/1680)
* [[`36cdc7c8ac`](https://github.com/nodejs/node/commit/36cdc7c8ac)] - **build**: volver a habilitar snapshots de V8 (Trevor Norris) [#1663](https://github.com/nodejs/node/pull/1663)
* [[`5883a59b21`](https://github.com/nodejs/node/commit/5883a59b21)] - **cluster**: evento "disconnect" emitido de manera incorrecta (Oleg Elifantiev) [#1386](https://github.com/nodejs/node/pull/1386)
* [[`0f850f7ae7`](https://github.com/nodejs/node/commit/0f850f7ae7)] - **deps**: proporcionar información de fragmento de TXT en c-ares (Fedor Indutny)
* [[`7e1c0e75ed`](https://github.com/nodejs/node/commit/7e1c0e75ed)] - **deps**: sincronizar con bagder/c-ares@bba4dc5 de upstream (Ben Noordhuis) [#1678](https://github.com/nodejs/node/pull/1678)
* [[`18d457bd34`](https://github.com/nodejs/node/commit/18d457bd34)] - **dgram**: llamar a la callback de envío de manera asíncrona (Yosuke Furukawa) [#1313](https://github.com/nodejs/node/pull/1313)
* [[`8b9a1537ad`](https://github.com/nodejs/node/commit/8b9a1537ad)] - **events**: proporcionar un mejor mensaje de error para error no manejado (Evan Lucas) [#1654](https://github.com/nodejs/node/pull/1654)
* [[`19ffb5cf1c`](https://github.com/nodejs/node/commit/19ffb5cf1c)] - **lib**: corregir los estilos de eslint (Yosuke Furukawa) [#1539](https://github.com/nodejs/node/pull/1539)
* [[`76937051f8`](https://github.com/nodejs/node/commit/76937051f8)] - **os**: refinar el desmontaje de las barras diagonales al final de tmpdir() (cjihrig) [#1673](https://github.com/nodejs/node/pull/1673)
* [[`aed6bce906`](https://github.com/nodejs/node/commit/aed6bce906)] - **readline**: convertir emitKeys en un analizador de transmisión de datos (Alex Kocharin) [#1601](https://github.com/nodejs/node/pull/1601)
* [[`0a461e5360`](https://github.com/nodejs/node/commit/0a461e5360)] - **src**: corregir "preload" cuando se utiliza con banderas anteriores (Yosuke Furukawa) [#1694](https://github.com/nodejs/node/pull/1694)
* [[`931a0d4634`](https://github.com/nodejs/node/commit/931a0d4634)] - **src**: añadir revisión de tipo a v8.setFlagsFromString() (Roman Klauke) [#1652](https://github.com/nodejs/node/pull/1652)
* [[`08d08668c9`](https://github.com/nodejs/node/commit/08d08668c9)] - **src,deps**: reemplazar LoadLibrary por LoadLibraryW (Cheng Zhao) [#226](https://github.com/nodejs/node/pull/226)
* [[`4e2f999a62`](https://github.com/nodejs/node/commit/4e2f999a62)] - **test**: corregir la detección de bucle infinito (Yosuke Furukawa) [#1681](https://github.com/nodejs/node/pull/1681)
* [[`5755fc099f`](https://github.com/nodejs/node/commit/5755fc099f)] - **tls**: actualizar los cifrados por defecto para utilizar gcm y aes128 (Mike MacCana) [#1660](https://github.com/nodejs/node/pull/1660)
* [[`966acb9916`](https://github.com/nodejs/node/commit/966acb9916)] - **tools**: remover closure_linter a eslint en windows (Yosuke Furukawa) [#1685](https://github.com/nodejs/node/pull/1685)
* [[`c58264e58b`](https://github.com/nodejs/node/commit/c58264e58b)] - **tools**: hacer que eslint funcione en sub-directorios (Roman Reiss) [#1686](https://github.com/nodejs/node/pull/1686)
* [[`0b21ab13b7`](https://github.com/nodejs/node/commit/0b21ab13b7)] - **tools**: refactorizar `make test-npm` en test-npm.sh (Jeremiah Senkpiel) [#1662](https://github.com/nodejs/node/pull/1662)
* [[`f07b3b600b`](https://github.com/nodejs/node/commit/f07b3b600b)] - **tools**: establecer espaciado de comas de eslint en 'warn' (Roman Reiss) [#1672](https://github.com/nodejs/node/pull/1672)
* [[`f9dd34d301`](https://github.com/nodejs/node/commit/f9dd34d301)] - **tools**: reemplazar linter de cierre con eslint (Yosuke Furukawa) [#1539](https://github.com/nodejs/node/pull/1539)
* [[`64d3210c98`](https://github.com/nodejs/node/commit/64d3210c98)] - **win,node-gyp**: establecer por defecto el hook delay-load (Bert Belder) [#1667](https://github.com/nodejs/node/issues/1667)

<a id="2.0.1"></a>

## 2015-05-07, Versión 2.0.1, @rvagg

### Cambios notables

* **async_wrap**: (Trevor Norris) [#1614](https://github.com/nodejs/node/pull/1614)
  - ahora es posible filtrar por proveedores
  - las banderas de bits han sido removidas y reemplazadas con llamadas de métodos en el objeto de enlazado
  - _tenga en cuenta que esta es una API inestable, por lo que la adición de funciones y los cambios de ruptura no cambiarán el semver de io.js_
* **libuv**: resolves numerous io.js issues:
  - [#862](https://github.com/nodejs/node/issues/862) evitar la generación de procesos secundarios con descriptores de archivos de stdio inválidos
  - [#1397](https://github.com/nodejs/node/issues/1397) corregir el error EPERM con fs.access(W_OK) en Windows
  - [#1621](https://github.com/nodejs/node/issues/1621) errores de compilación asociados con el libuv empaquetado
  - [#1512](https://github.com/nodejs/node/issues/1512) debería corregir correctamente los errores de terminación de Windows
* **addons**: el macro `NODE_DEPRECATED` estaba causando problemas al compilar complementos con compiladores más viejos, esto ahora debería haberse resuelto (Ben Noordhuis) [#1626](https://github.com/nodejs/node/pull/1626)
* **V8**: actualizar V8 de 4.2.77.18 a 4.2.77.20 con correcciones menores, incluyendo un error que evitaba las compilaciones en FreeBSD

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`7dde95a8bd`](https://github.com/nodejs/node/commit/7dde95a8bd)] - **async-wrap**: remover las llamadas before/after en init (Trevor Norris) [#1614](https://github.com/nodejs/node/pull/1614)
* [[`bd42ba056a`](https://github.com/nodejs/node/commit/bd42ba056a)] - **async-wrap**: establecer banderas utilizando funciones (Trevor Norris) [#1614](https://github.com/nodejs/node/pull/1614)
* [[`4b2c786449`](https://github.com/nodejs/node/commit/4b2c786449)] - **async-wrap**: pasar PROVIDER como primer argumento a init (Trevor Norris) [#1614](https://github.com/nodejs/node/pull/1614)
* [[`84bf609fd2`](https://github.com/nodejs/node/commit/84bf609fd2)] - **async-wrap**: no llamar a callback de init innecesariamente (Trevor Norris) [#1614](https://github.com/nodejs/node/pull/1614)
* [[`04cc03b029`](https://github.com/nodejs/node/commit/04cc03b029)] - **deps**: actualizar libuv a 1.5.0 (Saúl Ibarra Corretgé) [#1646](https://github.com/nodejs/node/pull/1646)
* [[`b16d9c28e8`](https://github.com/nodejs/node/commit/b16d9c28e8)] - **deps**: actualizar v8 a 4.2.77.20 (Ben Noordhuis) [#1639](https://github.com/nodejs/node/pull/1639)
* [[`9ec3109272`](https://github.com/nodejs/node/commit/9ec3109272)] - **doc**: añadir minutas de la reunión del TC del 2015-04-29 (Rod Vagg) [#1585](https://github.com/nodejs/node/pull/1585)
* [[`2c7206254c`](https://github.com/nodejs/node/commit/2c7206254c)] - **doc**: corregir error tipográfico en readme.md (AQNOUCH Mohammed) [#1643](https://github.com/nodejs/node/pull/1643)
* [[`71dc7152ee`](https://github.com/nodejs/node/commit/71dc7152ee)] - **doc**: corregir enlace de PR en CHANGELOG (Brian White) [#1624](https://github.com/nodejs/node/pull/1624)
* [[`b97b96d05a`](https://github.com/nodejs/node/commit/b97b96d05a)] - **install**: corregir NameError (thefourtheye) [#1628](https://github.com/nodejs/node/pull/1628)
* [[`6ccbe75384`](https://github.com/nodejs/node/commit/6ccbe75384)] - **js_stream**: corregir índice de búfer en DoWrite (Shigeki Ohtsu) [#1635](https://github.com/nodejs/node/pull/1635)
* [[`c43855c49c`](https://github.com/nodejs/node/commit/c43855c49c)] - **src**: exportar la función ParseEncoding en Windows (Ivan Kozik) [#1596](https://github.com/nodejs/node/pull/1596)
* [[`8315b22390`](https://github.com/nodejs/node/commit/8315b22390)] - **src**: corregir advertencias pedantes de whitespace de cpplint (Ben Noordhuis) [#1640](https://github.com/nodejs/node/pull/1640)
* [[`b712af79a7`](https://github.com/nodejs/node/commit/b712af79a7)] - **src**: corregir macro NODE_DEPRECATED con compiladores viejos (Ben Noordhuis) [#1626](https://github.com/nodejs/node/pull/1626)
* [[`2ed10f1349`](https://github.com/nodejs/node/commit/2ed10f1349)] - **src**: corregir ineficiencia menor en llamada de Buffer::New() (Ben Noordhuis) [#1577](https://github.com/nodejs/node/pull/1577)
* [[`f696c9efab`](https://github.com/nodejs/node/commit/f696c9efab)] - **src**: corregir el uso desaprobado de Buffer::New() (Ben Noordhuis) [#1577](https://github.com/nodejs/node/pull/1577)
* [[`0c8f13df8f`](https://github.com/nodejs/node/commit/0c8f13df8f)] - **tools**: remover la función GuessWordSize no utilizada (thefourtheye) [#1638](https://github.com/nodejs/node/pull/1638)

<a id="2.0.0"></a>

## 2015-05-04, Versión 2.0.0, @rvagg

### Cambios de ruptura

Detalles completos en https://github.com/nodejs/node/wiki/Breaking-Changes#200-from-1x

* Actualización de V8 a 4.2, cambios menores a la API de C++
* `os.tmpdir()` ahora es consistentemente multi-plataforma y ya no devuelve una ruta con una barra diagonal final en ninguna plataforma
* Aunque no es un *cambio de ruptura*, el módulo 'smalloc' ha sido desaprobado, previendo que dejará de ser soportado con una actualización futura a V8 4.4. Consulte [#1451](https://github.com/nodejs/node/issues/1451) para más información.

_Nota: una nueva versión del módulo 'url' fue revertida antes de su lanzamiento, pues se decidió que su potencial como causa de ruptura en el ecosistema npm era demasiado grande y era necesario realizar más trabajo de compatibilidad antes de lanzarlo. Vea [#1602](https://github.com/nodejs/node/pull/1602) para mayor información._

### Cambios notables

* **crypto**: el uso de la memoria fue significativamente reducido para TLS (Fedor Indutny & Сковорода Никита Андреевич) [#1529](https://github.com/nodejs/node/pull/1529)
* **net**: `socket.connect()` ahora acepta una opción de `'lookup'` para un mecanismo de resolución de DNS personalizado; el predeterminado es `dns.lookup()` (Evan Lucas) [#1505](https://github.com/nodejs/node/pull/1505)
* **npm**: Upgrade npm to 2.9.0. See the [v2.8.4](https://github.com/npm/npm/releases/tag/v2.8.4) and [v2.9.0](https://github.com/npm/npm/releases/tag/v2.9.0) release notes for details. Artículos notables:
  - Añadir soporte para el campo de autor predeterminado para hacer que `npm init -y` funcione sin un input de usuario (@othiym23) [npm/npm/d8eee6cf9d](https://github.com/npm/npm/commit/d8eee6cf9d2ff7aca68dfaed2de76824a3e0d9af)
  - Incluir módulos locales en `npm outdated` y `npm update` (@ArnaudRinquin) [npm/npm#7426](https://github.com/npm/npm/issues/7426)
  - El prefijo usado antes del número de versión en `npm version` ahora es configurable a través de `tag-version-prefix` (@kkragenbrink) [npm/npm#8014](https://github.com/npm/npm/issues/8014)
* **os**: `os.tmpdir()` ahora es consistentemente multi-plataforma y ya no devuelve una ruta con una barra diagonal final en ninguna plataforma (Christian Tellnes) [#747](https://github.com/nodejs/node/pull/747)
* **process**:
  - El rendimiento de `process.nextTick()` ha sido mejorado entre un 2 y un 42% a través de la suite de pruebas de rendimiento, en gran medida ya que es sumamente utilizada en el núcleo (Brian White) [#1571](https://github.com/nodejs/node/pull/1571)
  - Los nuevos métodos `process.geteuid()`, `process.seteuid(id)`, `process.getegid()` y `process.setegid(id)` le permiten obtener y establecer las UID y GID efectivas del proceso (Evan Lucas) [#1536](https://github.com/nodejs/node/pull/1536)
* **repl**:
  - El historial de REPL puede ser persistente a través de las sesiones si la variable de ambiente `NODE_REPL_HISTORY_FILE` es establecida como un archivo accesible por los usuarios, `NODE_REPL_HISTORY_SIZE` puede establecer el tamaño máximo del historial y se establece como `1000` de manera predeterminada (Chris Dickinson) [#1513](https://github.com/nodejs/node/pull/1513)
  - El REPL puede establecerse en uno de tres modos utilizando la variable de entorno `NODE_REPL_MODE`: `sloppy`, `strict` o `magic` (por defecto); el nuevo modo `magic` ejecutará automáticamente declaraciones de "solo en modo estricto" en el modo estricto (Chris Dickinson) [#1513](https://github.com/nodejs/node/pull/1513)
* **smalloc**: el módulo 'smalloc' ha sido desaprobado debido a cambios que lo dejarán inutilizable que vienen en la versión 4.4. de V8
* **util**: añadir soporte para la inspección de "Promise", "Map" y "Set" (Christopher Monsanto) [#1471](https://github.com/nodejs/node/pull/1471)
* **V8**: upgrade to 4.2.77.18, see the [ChangeLog](https://chromium.googlesource.com/v8/v8/+/refs/heads/4.2.77/ChangeLog) for full details. Artículos notables:
  - Las clases se han movido fuera de la escenificación; la palabra clave `class` ahora es utilizable sin banderas en el modo estricto
  - Las mejoras literales de objetos han sido movidas fuera de la escenificación; el método de atajo y la sintaxis de la propiedad ahora son utilizables (`{ method() { }, property }`)
  - Los parámetros del resto (`function(...args) {}`) son implementados en la escenificación tras la bandera `--harmony-rest-parameters`
  - Los nombres de propiedades computados (`{['foo'+'bar']:'bam'}`) son implementados en la escenificación tras la bandera `--harmony-computed-property-names`
  - Los escapes de unicode (`'\u{xxxx}'`) son implementados en la escenificación tras las banderas `--harmony_unicode` y `--harmony_unicode_regexps`, para uso en las expresiones regulares
* **Windows**:
  - Fue corregida la terminación de procesos aleatoria en Windows (Fedor Indutny)  [#1512](https://github.com/nodejs/node/issues/1512) / [#1563](https://github.com/nodejs/node/pull/1563)
  - El hook delay-load introducido para corregir problemas con el nombramiento de procesos (iojs.exe / node.exe) se ha convertido en opt-out para los complementos nativos. Los complementos nativos deben incluir `'win_delay_load_hook': 'false'` en sus binding.gyp para deshabilitar esta función si experimentan problemas. (Bert Belder) [#1433](https://github.com/nodejs/node/pull/1433)
* **Governance**:
  - Rod Vagg (@rvagg) fue añadido al Comité Técnico (TC)
  - Jeremiah Senkpiel (@Fishrock123) fue añadido al Comité Técnico (TC)

### Problemas conocidos

Vea https://github.com/nodejs/node/labels/confirmed-bug para la lista completa y actual de problemas conocidos.

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`5404cbc745`](https://github.com/nodejs/node/commit/5404cbc745)] - **buffer**: corregir el segfault de copy() cuando no se pasan argumentos (Trevor Norris) [#1520](https://github.com/nodejs/node/pull/1520)
* [[`3d3083b91f`](https://github.com/nodejs/node/commit/3d3083b91f)] - **buffer**: pequeña mejora para el método Buffer.concat (Jackson Tian) [#1437](https://github.com/nodejs/node/pull/1437)
* [[`e67542ae17`](https://github.com/nodejs/node/commit/e67542ae17)] - **build**: deshabilitar -Og al compilar con clang (Ben Noordhuis) [#1609](https://github.com/nodejs/node/pull/1609)
* [[`78f4b038f8`](https://github.com/nodejs/node/commit/78f4b038f8)] - **build**: activar las optimizaciones seguras para depuración con -Og (Ben Noordhuis) [#1569](https://github.com/nodejs/node/pull/1569)
* [[`a5dcff827a`](https://github.com/nodejs/node/commit/a5dcff827a)] - **build**: Utilizar grupos de opciones en el output de la configuración (Johan Bergström) [#1533](https://github.com/nodejs/node/pull/1533)
* [[`2a3c8c187e`](https://github.com/nodejs/node/commit/2a3c8c187e)] - **build**: remover -J de test-ci (Rod Vagg) [#1544](https://github.com/nodejs/node/pull/1544)
* [[`e6874dd0f9`](https://github.com/nodejs/node/commit/e6874dd0f9)] - **crypto**: hacer seguimiento a la memoria externa para las estructuras de SSL (Fedor Indutny) [#1529](https://github.com/nodejs/node/pull/1529)
* [[`935c9d3fa7`](https://github.com/nodejs/node/commit/935c9d3fa7)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`56e4255382`](https://github.com/nodejs/node/commit/56e4255382)] - **deps**: actualizar npm a 2.9.0 (Forrest L Norvell) [#1573](https://github.com/nodejs/node/pull/1573)
* [[`509b59ea7c`](https://github.com/nodejs/node/commit/509b59ea7c)] - **deps**: volver a habilitar la depuración postmortem de v8 (Ben Noordhuis) [#1232](https://github.com/nodejs/node/pull/1232)
* [[`01652c7709`](https://github.com/nodejs/node/commit/01652c7709)] - **deps**: actualizar v8 a 4.2.77.18 (Chris Dickinson) [#1506](https://github.com/nodejs/node/pull/1506)
* [[`01e6632d70`](https://github.com/nodejs/node/commit/01e6632d70)] - **deps**: actualizar v8 a 4.2.77.15 (Ben Noordhuis) [#1399](https://github.com/nodejs/node/pull/1399)
* [[`db4ded5903`](https://github.com/nodejs/node/commit/db4ded5903)] - **deps**: volver a habilitar la depuración postmortem de v8 (Ben Noordhuis) [#1232](https://github.com/nodejs/node/pull/1232)
* [[`36cd5fb9d2`](https://github.com/nodejs/node/commit/36cd5fb9d2)] - **(SEMVER-MAJOR)** **deps**: upgrade v8 to 4.2.77.13 (Ben Noordhuis) [#1232](https://github.com/nodejs/node/pull/1232)
* [[`b3a7da1091`](https://github.com/nodejs/node/commit/b3a7da1091)] - **deps**: actualizar http_parser a 2.5.0 (Fedor Indutny) [#1517](https://github.com/nodejs/node/pull/1517)
* [[`ac1fb39ce8`](https://github.com/nodejs/node/commit/ac1fb39ce8)] - **doc**: añadir a rvagg al TC (Rod Vagg) [#1613](https://github.com/nodejs/node/pull/1613)
* [[`dacc1fa35c`](https://github.com/nodejs/node/commit/dacc1fa35c)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#1586](https://github.com/nodejs/node/pull/1586)
* [[`2a3a1909ab`](https://github.com/nodejs/node/commit/2a3a1909ab)] - **doc**: añadir líneas de require() al ejemplo de child.stdio (Nick Raienko) [#1504](https://github.com/nodejs/node/pull/1504)
* [[`02388dbf40`](https://github.com/nodejs/node/commit/02388dbf40)] - **doc**: corregir algunas referencias cruzadas (Alexander Gromnitsky) [#1584](https://github.com/nodejs/node/pull/1584)
* [[`57c4cc26e2`](https://github.com/nodejs/node/commit/57c4cc26e2)] - **doc**: añadir las minutas de la reunión del TC del 2015-04-22 (Rod Vagg) [#1556](https://github.com/nodejs/node/pull/1556)
* [[`b4ad5d7050`](https://github.com/nodejs/node/commit/b4ad5d7050)] - **doc**: mejorar las opciones de http.request y https.request (Roman Reiss) [#1551](https://github.com/nodejs/node/pull/1551)
* [[`7dc8eec0a6`](https://github.com/nodejs/node/commit/7dc8eec0a6)] - **doc**: desaprobar el módulo smalloc (Ben Noordhuis) [#1566](https://github.com/nodejs/node/pull/1566)
* [[`1bcdf46ca7`](https://github.com/nodejs/node/commit/1bcdf46ca7)] - **doc**: añadir las minutas de la reunión del TC del 2015-04-15 (Rod Vagg) [#1498](https://github.com/nodejs/node/pull/1498)
* [[`391cae3595`](https://github.com/nodejs/node/commit/391cae3595)] - **doc**: Añadir Problemas conocidos al Registro de Cambios de la v1.7.0/1.7.1 (Yosuke Furukawa) [#1473](https://github.com/nodejs/node/pull/1473)
* [[`e55fdc47a7`](https://github.com/nodejs/node/commit/e55fdc47a7)] - **doc**: corregir ejemplo de util.deprecate (Nick Raienko) [#1535](https://github.com/nodejs/node/pull/1535)
* [[`5178f93bc0`](https://github.com/nodejs/node/commit/5178f93bc0)] - **doc**: Añadir API de Complemento (NAN) a la lista del grupo de trabajo (Julian Duque) [#1523](https://github.com/nodejs/node/pull/1523)
* [[`f3cc50f811`](https://github.com/nodejs/node/commit/f3cc50f811)] - **doc**: añadir minutas de la reunión del TC del 2015-04-08 (Rod Vagg) [#1497](https://github.com/nodejs/node/pull/1497)
* [[`bb254b533b`](https://github.com/nodejs/node/commit/bb254b533b)] - **doc**: actualizar rama al máster (Roman Reiss) [#1511](https://github.com/nodejs/node/pull/1511)
* [[`22aafa5597`](https://github.com/nodejs/node/commit/22aafa5597)] - **doc**: añadir a Fishrock123 al TC (Jeremiah Senkpiel) [#1507](https://github.com/nodejs/node/pull/1507)
* [[`b16a328ede`](https://github.com/nodejs/node/commit/b16a328ede)] - **doc**: añadir espacios al ejemplo de child.kill (Nick Raienko) [#1503](https://github.com/nodejs/node/pull/1503)
* [[`26327757f8`](https://github.com/nodejs/node/commit/26327757f8)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#1476](https://github.com/nodejs/node/pull/1476)
* [[`f9c681cf62`](https://github.com/nodejs/node/commit/f9c681cf62)] - **fs**: validar el descriptor de archivos en fs.write (Julian Duque) [#1553](https://github.com/nodejs/node/pull/1553)
* [[`801b47acc5`](https://github.com/nodejs/node/commit/801b47acc5)] - **gitignore**: ignorar espacios de trabajo y proyectos de xcode (Roman Klauke) [#1562](https://github.com/nodejs/node/pull/1562)
* [[`d5ce47e433`](https://github.com/nodejs/node/commit/d5ce47e433)] - **(SEMVER-MINOR)** **lib**: deprecate the smalloc module (Ben Noordhuis) [#1564](https://github.com/nodejs/node/pull/1564)
* [[`7384ca83f9`](https://github.com/nodejs/node/commit/7384ca83f9)] - **module**: remover '' de Module.globalPaths (Chris Yip) [#1488](https://github.com/nodejs/node/pull/1488)
* [[`b4f5898395`](https://github.com/nodejs/node/commit/b4f5898395)] - **net**: asegurar el handle de las referencias de Write/ShutdownWrap (Fedor Indutny) [#1590](https://github.com/nodejs/node/pull/1590)
* [[`4abe2fa1cf`](https://github.com/nodejs/node/commit/4abe2fa1cf)] - **(SEMVER-MINOR)** **net**: add lookup option to Socket.prototype.connect (Evan Lucas) [#1505](https://github.com/nodejs/node/pull/1505)
* [[`1bef717476`](https://github.com/nodejs/node/commit/1bef717476)] - **(SEMVER-MINOR)** **net**: cleanup connect logic (Evan Lucas) [#1505](https://github.com/nodejs/node/pull/1505)
* [[`c7782c0af8`](https://github.com/nodejs/node/commit/c7782c0af8)] - **node**: mejorar el rendimiento de nextTick (Brian White) [#1571](https://github.com/nodejs/node/pull/1571)
* [[`b57cc51d8d`](https://github.com/nodejs/node/commit/b57cc51d8d)] - **(SEMVER-MAJOR)** **os**: remove trailing slash from os.tmpdir() (Christian Tellnes) [#747](https://github.com/nodejs/node/pull/747)
* [[`ca219b00d1`](https://github.com/nodejs/node/commit/ca219b00d1)] - **repl**: corrección para limpieza de archivo por descriptor de archivos de a+ (Chris Dickinson) [#1605](https://github.com/nodejs/node/pull/1605)
* [[`051d482b15`](https://github.com/nodejs/node/commit/051d482b15)] - **repl**: corregir \_debugger estableciendo proxy para repl correctamente (Chris Dickinson) [#1605](https://github.com/nodejs/node/pull/1605)
* [[`2e2fce0502`](https://github.com/nodejs/node/commit/2e2fce0502)] - **repl**: corregir historial persistente y nombre de la variable de ambiente (Roman Reiss) [#1593](https://github.com/nodejs/node/pull/1593)
* [[`ea5195ccaf`](https://github.com/nodejs/node/commit/ea5195ccaf)] - **repl**: no guardar historial desde el repl no-terminal (Fedor Indutny) [#1575](https://github.com/nodejs/node/pull/1575)
* [[`0450ce7db2`](https://github.com/nodejs/node/commit/0450ce7db2)] - **repl**: añadir el modo de detección, historial persistente del cli (Chris Dickinson) [#1513](https://github.com/nodejs/node/pull/1513)
* [[`c1b9913e1f`](https://github.com/nodejs/node/commit/c1b9913e1f)] - **(SEMVER-MAJOR)** **src**: bump NODE_MODULE_VERSION due to V8 API (Rod Vagg) [#1532](https://github.com/nodejs/node/pull/1532)
* [[`279f6116aa`](https://github.com/nodejs/node/commit/279f6116aa)] - **src**: corregir advertencia de -Wmissing-field-initializers (Ben Noordhuis) [#1606](https://github.com/nodejs/node/pull/1606)
* [[`73062521a4`](https://github.com/nodejs/node/commit/73062521a4)] - **src**: desaprobar funciones públicas de smalloc (Ben Noordhuis) [#1565](https://github.com/nodejs/node/pull/1565)
* [[`ccb199af17`](https://github.com/nodejs/node/commit/ccb199af17)] - **src**: corregir advertencias de desaprobación (Ben Noordhuis) [#1565](https://github.com/nodejs/node/pull/1565)
* [[`609fa0de03`](https://github.com/nodejs/node/commit/609fa0de03)] - **src**: corregir macro de NODE_DEPRECATED (Ben Noordhuis) [#1565](https://github.com/nodejs/node/pull/1565)
* [[`3c92ca2b5c`](https://github.com/nodejs/node/commit/3c92ca2b5c)] - **(SEMVER-MINOR)** **src**: add ability to get/set effective uid/gid (Evan Lucas) [#1536](https://github.com/nodejs/node/pull/1536)
* [[`30b7349176`](https://github.com/nodejs/node/commit/30b7349176)] - **stream_base**: enviar solicitudes en en el impl del stream (Fedor Indutny) [#1563](https://github.com/nodejs/node/pull/1563)
* [[`0fa6c4a6fc`](https://github.com/nodejs/node/commit/0fa6c4a6fc)] - **string_decoder**: no almacenar Buffer.isEncoding en caché (Brian White) [#1548](https://github.com/nodejs/node/pull/1548)
* [[`f9b226c1c1`](https://github.com/nodejs/node/commit/f9b226c1c1)] - **test**: extender tiempos de espera para ARMv6 (Rod Vagg) [#1554](https://github.com/nodejs/node/pull/1554)
* [[`bfae8236b1`](https://github.com/nodejs/node/commit/bfae8236b1)] - **test**: corregir aserción de prueba de test-net-dns-custom-lookup (Evan Lucas) [#1531](https://github.com/nodejs/node/pull/1531)
* [[`547213913b`](https://github.com/nodejs/node/commit/547213913b)] - **test**: ajustar Makefile/test-ci, añadir a vcbuild.bat (Rod Vagg) [#1530](https://github.com/nodejs/node/pull/1530)
* [[`550c2638c0`](https://github.com/nodejs/node/commit/550c2638c0)] - **tls**: utilizar `SSL_set_cert_cb`para SNI/OCSP asíncronas (Fedor Indutny) [#1464](https://github.com/nodejs/node/pull/1464)
* [[`1787416376`](https://github.com/nodejs/node/commit/1787416376)] - **tls**: destruir contexto de singleUse inmediatamente (Fedor Indutny) [#1529](https://github.com/nodejs/node/pull/1529)
* [[`2684c902c4`](https://github.com/nodejs/node/commit/2684c902c4)] - **tls**: hacer que la lista libre de SSL_CTX sea cero para un socket de singleUse (Fedor Indutny) [#1529](https://github.com/nodejs/node/pull/1529)
* [[`2d241b3b82`](https://github.com/nodejs/node/commit/2d241b3b82)] - **tls**: destruir SSL una vez que esté fuera de uso (Fedor Indutny) [#1529](https://github.com/nodejs/node/pull/1529)
* [[`f7620fb96d`](https://github.com/nodejs/node/commit/f7620fb96d)] - **tls_wrap**: Desvincular los objetos de TLSWrap y SecureContext (Сковорода Никита Андреевич) [#1580](https://github.com/nodejs/node/pull/1580)
* [[`a7d74633f2`](https://github.com/nodejs/node/commit/a7d74633f2)] - **tls_wrap**: utilizar localhost si options.host está vacío (Guilherme Souza) [#1493](https://github.com/nodejs/node/pull/1493)
* [[`702997c1f0`](https://github.com/nodejs/node/commit/702997c1f0)] - ***Revert*** "**url**: significantly improve the performance of the url module" (Rod Vagg) [#1602](https://github.com/nodejs/node/pull/1602)
* [[`0daed24883`](https://github.com/nodejs/node/commit/0daed24883)] - ***Revert*** "**url**: delete href cache on all setter code paths" (Rod Vagg) [#1602](https://github.com/nodejs/node/pull/1602)
* [[`0f39ef4ca1`](https://github.com/nodejs/node/commit/0f39ef4ca1)] - ***Revert*** "**url**: fix treatment of some values as non-empty" (Rod Vagg) [#1602](https://github.com/nodejs/node/pull/1602)
* [[`66877216bd`](https://github.com/nodejs/node/commit/66877216bd)] - **url**: corregir el trato de algunos valores como no-vacíos (Petka Antonov) [#1589](https://github.com/nodejs/node/pull/1589)
* [[`dbdd81a91b`](https://github.com/nodejs/node/commit/dbdd81a91b)] - **url**: borrar la caché de href en todas las rutas de código de setters (Petka Antonov) [#1589](https://github.com/nodejs/node/pull/1589)
* [[`3fd7fc429c`](https://github.com/nodejs/node/commit/3fd7fc429c)] - **url**: mejorar significativamente el rendimiento del módulo url (Petka Antonov) [#1561](https://github.com/nodejs/node/pull/1561)
* [[`bf7ac08dd0`](https://github.com/nodejs/node/commit/bf7ac08dd0)] - **util**: añadir soporte para inspección de Map y Set (Christopher Monsanto) [#1471](https://github.com/nodejs/node/pull/1471)
* [[`30e83d2e84`](https://github.com/nodejs/node/commit/30e83d2e84)] - **win,node-gyp**: permitir que opcionalmente se pueda renombrar a node.exe/iojs.exe (Bert Belder) [#1266](https://github.com/nodejs/node/pull/1266)
* [[`3bda6cbfa4`](https://github.com/nodejs/node/commit/3bda6cbfa4)] - **(SEMVER-MAJOR)** **win,node-gyp**: enable delay-load hook by default (Bert Belder) [#1433](https://github.com/nodejs/node/pull/1433)

<a id="1.8.1"></a>

## 2015-04-20, Versión 1.8.1, @chrisdickinson

### Cambios notables

* **NOTICE**: Se omitió la v1.8.0 debido a problemas con las herramientas de lanzamiento. Consulte [#1436](https://github.com/nodejs/node/issues/1436) para ver detalles.
* **build**: Soporte para la compilación de io.js como una librería estática (Marat Abdullin) [#1341](https://github.com/nodejs/node/pull/1341)
* **deps**: Upgrade openssl to 1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
  * Los usuarios deberían ver mejoras en el rendimiento al utilizar la API criptográfica. Consulte [aquí](https://github.com/nodejs/node/wiki/Crypto-Performance-Notes-for-OpenSSL-1.0.2a-on-iojs-v1.8.0) para ver detalles.
* **npm**: Upgrade npm to 2.8.3. See the [release notes](https://github.com/npm/npm/releases/tag/v2.8.3) for details. Incluye soporte de git mejorado. Resumen:
  * [`387f889`](https://github.com/npm/npm/commit/387f889c0e8fb617d9cc9a42ed0a3ec49424ab5d) [#7961](https://github.com/npm/npm/issues/7961) Asegurarse de que los URLs del SSH del git alojado tengan siempre un protocolo válido al ser almacenados en los campos `resolved` (resueltos) en `npm-shrinkwrap.json`. ([@othiym23](https://github.com/othiym23))
  * [`394c2f5`](https://github.com/npm/npm/commit/394c2f5a1227232c0baf42fbba1402aafe0d6ffb) Invertir el orden en el que los proveedores de Gits alojados son revisados a `git:`, `git+https:`, y luego `git+ssh:` (anteriormente era `git:`, `git+ssh:`, y luego `git+https:`) con la intención de proceder desde el que tiene menos probabilidades de éxito hasta el que tiene más, para crear un mensaje de error menos confuso. ([@othiym23](https://github.com/othiym23))
  * [`431c3bf`](https://github.com/npm/npm/commit/431c3bf6cdec50f9f0c735f478cb2f3f337d3313) [#7699](https://github.com/npm/npm/issues/7699) `npm-registry-client@6.3.2`: No enviar el cuerpo con las solicitudes del GET de HTTP al ingresar. ([@smikes](https://github.com/smikes))
  * [`15efe12`](https://github.com/npm/npm/commit/15efe124753257728a0ddc64074fa5a4b9c2eb30) [#7872](https://github.com/npm/npm/issues/7872) Utilice la nueva versión de `hosted-git-info` para pasar credenciales incrustadas en URLs de gits,. Pruébelo. Pruébelo mucho. ([@othiym23](https://github.com/othiym23))
  * [`b027319`](https://github.com/npm/npm/commit/b0273190c71eba14395ddfdd1d9f7ba625297523) [#7920](https://github.com/npm/npm/issues/7920) Los paquetes con ámbito con `peerDependencies` estaban instalando las `peerDependencies` en el directorio equivocado. ([@ewie](https://github.com/ewie))
  * [`6b0f588`](https://github.com/npm/npm/commit/6b0f58877f37df9904490ffbaaad33862bd36dce) [#7867](https://github.com/npm/npm/issues/7867) Utilice los atajos de gits y las URLs de gits como son presentados por los usuarios. Soportar la nueva sintaxis del atajo a `hosted-git-info`. Guardar atajo en `package.json`. Intente clonar a través de `git:`, `git+ssh:`, y `git+https:`, en ese orden, cuando sean soportados por el provedor de host subyacente. ([@othiym23](https://github.com/othiym23))
* **src**: Permitir el paso de múltiples argumentos a process.nextTick (Trevor Norris) [#1077](https://github.com/nodejs/node/pull/1077)
* **module**: la interacción entre `require('.')` y `NODE_PATH` ha sido restaurada y desaprobada. Esta función será eliminada en un punto en el futuro. (Roman Reiss) [#1363](https://github.com/nodejs/node/pull/1363)

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* `url.resolve` puede transferir la porción de autenticación del url mientras resuelve entre dos hosts completos, vea [#1435](https://github.com/nodejs/node/issues/1435).
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`53ed89d927`](https://github.com/nodejs/node/commit/53ed89d927)] - ***Revert*** "**build**: use %PYTHON% instead of python" (Rod Vagg) [#1475](https://github.com/nodejs/node/pull/1475)
* [[`f23b96352b`](https://github.com/nodejs/node/commit/f23b96352b)] - **src**: revertir NODE_MODULE_VERSION a 43 (Chris Dickinson) [#1460](https://github.com/nodejs/node/pull/1460)
* [[`431673ebd1`](https://github.com/nodejs/node/commit/431673ebd1)] - **buffer**: fast-case para string vacía en byteLength (Jackson Tian) [#1441](https://github.com/nodejs/node/pull/1441)
* [[`1b22bad35f`](https://github.com/nodejs/node/commit/1b22bad35f)] - **build**: corregir lógica para banderas de librería compartida (Jeremiah Senkpiel) [#1454](https://github.com/nodejs/node/pull/1454)
* [[`91943a99d5`](https://github.com/nodejs/node/commit/91943a99d5)] - **build**: utilizar %PYTHON% en lugar de python (Rod Vagg) [#1444](https://github.com/nodejs/node/pull/1444)
* [[`c7769d417b`](https://github.com/nodejs/node/commit/c7769d417b)] - **build**: Exponer el nivel de compresión de xz (Johan Bergström) [#1428](https://github.com/nodejs/node/pull/1428)
* [[`a530b2baf1`](https://github.com/nodejs/node/commit/a530b2baf1)] - **build**: corregir el mensaje de error en la configuración (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`92dfb794f9`](https://github.com/nodejs/node/commit/92dfb794f9)] - **build**: habilitar el soporte de ssl en arm64 (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`7de0dcde83`](https://github.com/nodejs/node/commit/7de0dcde83)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`4870213f9e`](https://github.com/nodejs/node/commit/4870213f9e)] - **deps**: actualizar npm a 2.8.3 (Forrest L Norvell)
* [[`49bb7ded2c`](https://github.com/nodejs/node/commit/49bb7ded2c)] - **deps**: corregir la sensibilidad a las mayúsculas y minúsculas de git en npm (Chris Dickinson) [#1456](https://github.com/nodejs/node/pull/1456)
* [[`4830b4bce8`](https://github.com/nodejs/node/commit/4830b4bce8)] - **deps**: añadir docs para actualizar openssl (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`11bec72c87`](https://github.com/nodejs/node/commit/11bec72c87)] - **deps**: actualizar archivos de asm para openssl-1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`53924d8ebe`](https://github.com/nodejs/node/commit/53924d8ebe)] - **deps**: actualizar el Makefile de asm para openssl-1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`418e839456`](https://github.com/nodejs/node/commit/418e839456)] - **deps**: actualizar openssl.gyp/gypi para openssl-1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`02f12ab666`](https://github.com/nodejs/node/commit/02f12ab666)] - **deps**: actualizar opensslconf.h para 1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`eb7a23595f`](https://github.com/nodejs/node/commit/eb7a23595f)] - **deps**: añadir soporte de x32 y arm64 para opensslconf.h (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`033a663127`](https://github.com/nodejs/node/commit/033a663127)] - **deps**: reemplazar todas las cabeceras en openssl (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`ae8831f240`](https://github.com/nodejs/node/commit/ae8831f240)] - **deps**: hacer backport al parche de openssl de cadenas de certificados alternativas 1 (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`71316c46d9`](https://github.com/nodejs/node/commit/71316c46d9)] - **deps**: corregir error de compilación de asm de openssl en x86_win32 (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`d293a4f096`](https://github.com/nodejs/node/commit/d293a4f096)] - **deps**: corregir error de ensamblaje de openssl en win32 de ia32 (Fedor Indutny) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`e4872d7405`](https://github.com/nodejs/node/commit/e4872d7405)] - **deps**: actualizar openssl a 1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`a1c9ef3142`](https://github.com/nodejs/node/commit/a1c9ef3142)] - **deps, build**: añadir ensamblador de soporte viejo (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`76f219c128`](https://github.com/nodejs/node/commit/76f219c128)] - **doc**: Documentar el push forzado con git (Johan Bergström) [#1420](https://github.com/nodejs/node/pull/1420)
* [[`12e51d56c1`](https://github.com/nodejs/node/commit/12e51d56c1)] - **doc**: añadir WG de API de Complementos (Rod Vagg) [#1226](https://github.com/nodejs/node/pull/1226)
* [[`7956a13dad`](https://github.com/nodejs/node/commit/7956a13dad)] - **http**: respetar maxSockets lógicamente (fengmk2) [#1242](https://github.com/nodejs/node/pull/1242)
* [[`5b844e140b`](https://github.com/nodejs/node/commit/5b844e140b)] - **module**: corregir estilo (Roman Reiss) [#1453](https://github.com/nodejs/node/pull/1453)
* [[`3ad82c335d`](https://github.com/nodejs/node/commit/3ad82c335d)] - **(SEMVER-MINOR)** **module**: handle NODE_PATH in require('.') (Roman Reiss) [#1363](https://github.com/nodejs/node/pull/1363)
* [[`cd60ff0328`](https://github.com/nodejs/node/commit/cd60ff0328)] - **net**: añadir descriptor de archivos en la información de depuración de listen2 (Jackson Tian) [#1442](https://github.com/nodejs/node/pull/1442)
* [[`10e31ba56c`](https://github.com/nodejs/node/commit/10e31ba56c)] - **(SEMVER-MINOR)** **node**: allow multiple arguments passed to nextTick (Trevor Norris) [#1077](https://github.com/nodejs/node/pull/1077)
* [[`116c54692a`](https://github.com/nodejs/node/commit/116c54692a)] - **openssl**: corregir el requerimiento de keypress en aplicaciones en win32 (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`62f5f4cec9`](https://github.com/nodejs/node/commit/62f5f4cec9)] - **src**: remover byteLength duplicado de Búfer (Jackson Tian) [#1438](https://github.com/nodejs/node/pull/1438)
* [[`51d0808c90`](https://github.com/nodejs/node/commit/51d0808c90)] - **stream**: remover expresión duplicada (Yazhong Liu) [#1444](https://github.com/nodejs/node/pull/1444)
* [[`deb9d23d7b`](https://github.com/nodejs/node/commit/deb9d23d7b)] - **test**: corregir revisión de mensaje de error para openssl-1.0.2a (Shigeki Ohtsu) [#1389](https://github.com/nodejs/node/pull/1389)
* [[`ca8c9ec2c8`](https://github.com/nodejs/node/commit/ca8c9ec2c8)] - **win,node-gyp**: permitir que opcionalmente node.exe/iojs.exe pueda ser renombrado (Bert Belder) [#1266](https://github.com/nodejs/node/pull/1266)

<a id="1.7.1"></a>

## 2015-04-14, Versión 1.7.1, @rvagg

### Cambios notables

* **build**: Un error de sintáxis en el Makefile para las compilaciones de lanzamiento causó que la versión 1.7.0 fallara y no fuera lanzada. (Rod Vagg) [#1421](https://github.com/nodejs/node/pull/1421).

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`aee86a21f2`](https://github.com/nodejs/node/commit/aee86a21f2)] - **build**: corregir revisión de RELEASE (Rod Vagg) [#1421](https://github.com/nodejs/node/pull/1421)

<a id="1.7.0"></a>

## 2015-04-14, Versión 1.7.0, @rvagg

### Cambios notables

* **C++ API**: Fedor Indutny contribuyó a V8 en una función, a la cual se le ha hecho backport al V8 incluido en io.js. `SealHandleScope` permite a un autor de complementos de C++ _sellar_ un `HandleScope` para evitar más asignaciones no deseadas. Actualmente solo está habilitado para builds de depuración de io.js. Esta función ayudó a detectar la fuga en [#1075](https://github.com/nodejs/node/issues/1075) y ahora se encuentra habilitada en el `HandleScope` raíz en io.js. (Fedor Indutny) [#1395](https://github.com/nodejs/node/pull/1395).
* **ARM**: This release includes significant work to improve the state of ARM support for builds and tests. Los servidores de los builds de ARMv6, ARMv7 y ARMv8 del clúster de CI de io.js están (casi todos) reportando las compilaciones y pruebas exitosas.
  * ARMv8 64-bit (AARCH64) ahora está soportado correctamente, incluyendo una corrección a la que se le hizo backport en libuv que estaba detectando erróneamente la existencia de `epoll_wait()`. (Ben Noordhuis) [#1365](https://github.com/nodejs/node/pull/1365).
  * ARMv6: [#1376](https://github.com/nodejs/node/issues/1376) reportó un problema con `Math.exp()` en ARMv6 (incl Raspberry Pi). El culpable es un codegen erróneo para ARMv6, al utilizar la función de "matemática rápida" de V8. `--nofast_math` ha sido activada por defecto para todas las variantes de ARMv6 para evitar esto, la matemática rápida puede volver a ser activada con `--fast_math`. (Ben Noordhuis) [#1398](https://github.com/nodejs/node/pull/1398).
  * Pruebas: los tiempos de espera han sido ajustados específicamente para plataformas más lentas, detectadas como ARMv6 y ARMv7. (Roman Reiss) [#1366](https://github.com/nodejs/node/pull/1366).
* **npm**: Upgrade npm to 2.7.6. See the [release notes](https://github.com/npm/npm/releases/tag/v2.7.6) for details. Resumen:
  * [`b747593`](https://github.com/npm/npm/commit/b7475936f473f029e6a027ba1b16277523747d0b)[#7630](https://github.com/npm/npm/issues/7630) No registrar todas las fallas de git como errores. `maybeGithub` necesita ser capaz de fallar sin dejar registros para soportar su lógica de reserva. ([@othiym23](https://github.com/othiym23))
  * [`78005eb`](https://github.com/npm/npm/commit/78005ebb6f4103c20f077669c3929b7ea46a4c0d)[#7743](https://github.com/npm/npm/issues/7743) Siempre citar los argumentos pasados a `npm run-script`. Esto permite que los sistemas de compilación y los patrones globales similares al escape seguro sean pasados como argumentos a `run-scripts` con `npm run-script &lt;script&gt; -- &lt;arguments&gt;`. Esto es un cambio complicado que ha de ser puesto a prueba, y que puede ser revertido o movido a`npm@3` si resulta que daña cosas para los usuarios. ([@mantoni](https://github.com/mantoni))
  * [`da015ee`](https://github.com/npm/npm/commit/da015eee45f6daf384598151d06a9b57ffce136e)[#7074](https://github.com/npm/npm/issues/7074) `read-package-json@1.3.3`: `read-package-json` ya no almacena los archivos de `package.json` en caché, lo que implica una pérdida de rendimiento muy pequeña por la eliminación de una gran clase de condiciones de carrera realmente molestas. Consulte [#7074](https://github.com/npm/npm/issues/7074) para ver los espeluznantes detalles. ([@othiym23](https://github.com/othiym23))

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)
* readline: los escapes divididos son procesados incorrectamente, vea [#1403](https://github.com/nodejs/node/issues/1403)

### Commits

* [[`d2b62a4973`](https://github.com/nodejs/node/commit/d2b62a4973)] - **benchmark**: no revisar wrk en prueba de rendimiento no-http (Jackson Tian) [#1368](https://github.com/nodejs/node/pull/1368)
* [[`fd90b33b94`](https://github.com/nodejs/node/commit/fd90b33b94)] - **build**: validar las opciones pasadas a la configuración (Johan Bergström) [#1335](https://github.com/nodejs/node/pull/1335)
* [[`04b02f5e34`](https://github.com/nodejs/node/commit/04b02f5e34)] - **build**: Remover las banderas desaprobadas (Johan Bergström) [#1407](https://github.com/nodejs/node/pull/1407)
* [[`39d395c966`](https://github.com/nodejs/node/commit/39d395c966)] - **build**: cambios menores para corregir el build de rpm (Dan Varga) [#1408](https://github.com/nodejs/node/pull/1408)
* [[`f9a2d31b32`](https://github.com/nodejs/node/commit/f9a2d31b32)] - **build**: Simplificar versión de lanzamiento muy adornada (Johan Bergström) [#1405](https://github.com/nodejs/node/pull/1405)
* [[`cd38a4af8f`](https://github.com/nodejs/node/commit/cd38a4af8f)] - **build**: soportar la compilación de io.js como una librería estática (Marat Abdullin) [#1341](https://github.com/nodejs/node/pull/1341)
* [[`d726a177ed`](https://github.com/nodejs/node/commit/d726a177ed)] - **build**: Remover la compilación contra un V8 compartido (Johan Bergström) [#1331](https://github.com/nodejs/node/pull/1331)
* [[`a5244d3a39`](https://github.com/nodejs/node/commit/a5244d3a39)] - **(SEMVER-MINOR)** **deps**: backport 1f8555 from v8's upstream (Fedor Indutny) [#1395](https://github.com/nodejs/node/pull/1395)
* [[`09d4a286ea`](https://github.com/nodejs/node/commit/09d4a286ea)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`cc8376ae67`](https://github.com/nodejs/node/commit/cc8376ae67)] - **deps**: actualizar npm a 2.7.6 (Forrest L Norvell) [#1390](https://github.com/nodejs/node/pull/1390)
* [[`5b0e5755a0`](https://github.com/nodejs/node/commit/5b0e5755a0)] - **deps**: generar opensslconf.h para arquitecturas (Shigeki Ohtsu) [#1377](https://github.com/nodejs/node/pull/1377)
* [[`7d14aa0222`](https://github.com/nodejs/node/commit/7d14aa0222)] - **deps**: añadir Makefile para generar opensslconf.h (Shigeki Ohtsu) [#1377](https://github.com/nodejs/node/pull/1377)
* [[`29a3301461`](https://github.com/nodejs/node/commit/29a3301461)] - **deps**: hacer que opensslconf.h incluya la arquitectura de cada objetivo (Shigeki Ohtsu) [#1377](https://github.com/nodejs/node/pull/1377)
* [[`93a1a07ef4`](https://github.com/nodejs/node/commit/93a1a07ef4)] - **doc**: remover de http.request las opciones de keepAlive (Jeremiah Senkpiel) [#1392](https://github.com/nodejs/node/pull/1392)
* [[`3ad6ea7c38`](https://github.com/nodejs/node/commit/3ad6ea7c38)] - **doc**: remover parámetro redundante en el listener de `end`. (Alex Yursha) [#1387](https://github.com/nodejs/node/pull/1387)
* [[`2bc3532461`](https://github.com/nodejs/node/commit/2bc3532461)] - **doc**: documentar la clase Console (Jackson Tian) [#1388](https://github.com/nodejs/node/pull/1388)
* [[`69bc1382b7`](https://github.com/nodejs/node/commit/69bc1382b7)] - **doc**: aplicar sangría correctamente a las opciones de http.Agent keepAlive (Jeremiah Senkpiel) [#1384](https://github.com/nodejs/node/pull/1384)
* [[`b464d467a2`](https://github.com/nodejs/node/commit/b464d467a2)] - **doc**: actualizar el uso de signo de curl (bucle) en COLLABORATOR_GUIDE (Roman Reiss) [#1382](https://github.com/nodejs/node/pull/1382)
* [[`61c0e7b70f`](https://github.com/nodejs/node/commit/61c0e7b70f)] - **doc**: actualizar los enlaces de CONTRIBUTING. (Andrew Crites) [#1380](https://github.com/nodejs/node/pull/1380)
* [[`8d467e521c`](https://github.com/nodejs/node/commit/8d467e521c)] - **doc**: añadir minutas de la reunión del TC del 2015-03-28 (Rod Vagg) [#1370](https://github.com/nodejs/node/pull/1370)
* [[`8ba9c4a7c2`](https://github.com/nodejs/node/commit/8ba9c4a7c2)] - **doc**: añadir las minutas de la reunión del TC del 2015-04-01 (Rod Vagg) [#1371](https://github.com/nodejs/node/pull/1371)
* [[`48facf93ad`](https://github.com/nodejs/node/commit/48facf93ad)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#1372](https://github.com/nodejs/node/pull/1372)
* [[`1219e7466c`](https://github.com/nodejs/node/commit/1219e7466c)] - **lib**: reducir las llamadas a process.binding() (Brendan Ashworth) [#1367](https://github.com/nodejs/node/pull/1367)
* [[`264a8f3a1b`](https://github.com/nodejs/node/commit/264a8f3a1b)] - **linux**: corregir la reserva de epoll_pwait() en arm64 (Ben Noordhuis) [#1365](https://github.com/nodejs/node/pull/1365)
* [[`f0bf6bb024`](https://github.com/nodejs/node/commit/f0bf6bb024)] - **readline**: corregir la llamada a un constructor sin "new" (Alex Kocharin) [#1385](https://github.com/nodejs/node/pull/1385)
* [[`ff74931107`](https://github.com/nodejs/node/commit/ff74931107)] - **smalloc**: no hacer seguimiento de la memoria externa (Fedor Indutny) [#1375](https://github.com/nodejs/node/pull/1375)
* [[`a07c69113a`](https://github.com/nodejs/node/commit/a07c69113a)] - **(SEMVER-MINOR)** **src**: use global SealHandleScope (Fedor Indutny) [#1395](https://github.com/nodejs/node/pull/1395)
* [[`a4d88475fa`](https://github.com/nodejs/node/commit/a4d88475fa)] - **src**: deshabilitar la matemática rápida solo en armv6 (Ben Noordhuis) [#1398](https://github.com/nodejs/node/pull/1398)
* [[`e306c78f83`](https://github.com/nodejs/node/commit/e306c78f83)] - **src**: deshabilitar la matemática rápida en arm (Ben Noordhuis) [#1398](https://github.com/nodejs/node/pull/1398)
* [[`7049d7b474`](https://github.com/nodejs/node/commit/7049d7b474)] - **test**: incrementar los tiempos de espera en ARM (Roman Reiss) [#1366](https://github.com/nodejs/node/pull/1366)
* [[`3066f2c0c3`](https://github.com/nodejs/node/commit/3066f2c0c3)] - **test**: hacer prueba doble a los temporizadores en las máquinas arm (Ben Noordhuis) [#1357](https://github.com/nodejs/node/pull/1357)
* [[`66db9241cb`](https://github.com/nodejs/node/commit/66db9241cb)] - **tools**: Remover archivos no utilizados (Johan Bergström) [#1406](https://github.com/nodejs/node/pull/1406)
* [[`8bc8bd4bc2`](https://github.com/nodejs/node/commit/8bc8bd4bc2)] - **tools**: añadir para instalar deps/openssl/config/archs (Shigeki Ohtsu) [#1377](https://github.com/nodejs/node/pull/1377)
* [[`907aaf325a`](https://github.com/nodejs/node/commit/907aaf325a)] - **win,node-gyp**: permitir que opcionalmente se pueda renombrar a node.exe/iojs.exe (Bert Belder) [#1266](https://github.com/nodejs/node/pull/1266)
* [[`372bf83818`](https://github.com/nodejs/node/commit/372bf83818)] - **zlib**: hacer que las constantes se mantengan siendo de solo lectura (Jackson Tian) [#1361](https://github.com/nodejs/node/pull/1361)

<a id="1.6.4"></a>

## 2015-04-06, Versión 1.6.4, @Fishrock123

### Cambios notables

* **npm**: upgrade npm to 2.7.5. See [npm CHANGELOG.md](https://github.com/npm/npm/blob/master/CHANGELOG.md#v275-2015-03-26) for details. Incluye dos correcciones de seguridad importantes. Resumen:
  * [`300834e`](https://github.com/npm/npm/commit/300834e91a4e2a95fb7fb59c309e7c3fc91d2312) `tar@2.0.0`: Normalizar los enlaces simbólicos que apuntan a objetivos fuera de la raíz de extracción. Esto evita que los paquetes que contengan enlaces simbólicos sobreescriban objetivos fuera de las rutas esperadas para un paquete. Gracias a [Tim Cuthbertson](http://gfxmonk.net/) y al equipo de [Lift Security](https://liftsecurity.io/) por trabajar con el equipo de npm para identifiar este problema. ([@othiym23](https://github.com/othiym23))
  * [`0dc6875`](https://github.com/npm/npm/commit/0dc68757cffd5397c280bc71365d106523a5a052) `semver@4.3.2`: Las versiones de paquete no pueden ser de más de 256 caracteres de largas. Esto evita una situación en la que analizar el número de versión puede gastar exponencialmente más tiempo y memoria, llevando a una denegación de servicio potencial. Gracias a Adam Baldwin, de Lift Security, por hacernos notar esto.  ([@isaacs](https://github.com/isaacs))
  * [`eab6184`](https://github.com/npm/npm/commit/eab618425c51e3aa4416da28dcd8ca4ba63aec41) [#7766](https://github.com/npm/npm/issues/7766) Un último ajuste para asegurarse que los accesos directos de Github funcionen con repositorios privados. ([@iarna](https://github.com/iarna))
  * [`a840a13`](https://github.com/npm/npm/commit/a840a13bbf0330157536381ea8e58d0bd93b4c05) [#7746](https://github.com/npm/npm/issues/7746) Solo arreglar las rutas URL de git cuando hayan rutas que arreglar. ([@othiym23](https://github.com/othiym23))
* **openssl**: se ha realizado un trabajo preliminar para una próxima actualización a OpenSSL 1.0.2a [#1325](https://github.com/nodejs/node/pull/1325) (Shigeki Ohtsu). Consulte [#589](https://github.com/nodejs/node/issues/589) para ver detalles adicionales.
* **timers**: se corrigió una fuga de memoria menor que se daba cuando los temporizadores no tenían referencias, junto a algunos problemas relacionados relativos a los temporizadores [#1330](https://github.com/nodejs/node/pull/1330) (Fedor Indutny). Esto parece haber corregido la fuga restante reportada en [#1075](https://github.com/nodejs/node/issues/1075).
* **android**: ahora es posible compilar io.js para Android y dispositivos relacionados [#1307](https://github.com/nodejs/node/pull/1307) (Giovanny Andres Gongora Granada).

### Problemas conocidos

* Algunos problemas con temporizadores sin referencias que se ejecutan durante `beforeExit` aún están por resolverse. Vea [#1264](https://github.com/nodejs/node/issues/1264).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible construir io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`3a69b7689b`](https://github.com/io.js/io.js/commit/3a69b7689b)] - **benchmark**: añadir prueba de rendimiento de rsa/aes-gcm (Shigeki Ohtsu) [iojs/io.js#1325](https://github.com/nodejs/node/pull/1325)
* [[`1c709f3aa9`](https://github.com/io.js/io.js/commit/1c709f3aa9)] - **benchmark**: añadir/eliminar algoritmo de hash (Shigeki Ohtsu) [iojs/io.js#1325](https://github.com/nodejs/node/pull/1325)
* [[`a081c7c522`](https://github.com/io.js/io.js/commit/a081c7c522)] - **benchmark**: corregir ejecución de prueba de rendimiento de cliente fragmentada (Brian White) [iojs/io.js#1257](https://github.com/nodejs/node/pull/1257)
* [[`65d4d25f52`](https://github.com/io.js/io.js/commit/65d4d25f52)] - **build**: establecer por defecto armv7+vfpv3 en android (Giovanny Andres Gongora Granada) [iojs/io.js#1307](https://github.com/nodejs/node/pull/1307)
* [[`6a134f7d70`](https://github.com/io.js/io.js/commit/6a134f7d70)] - **build**: evitar pasar banderas privadas desde pmake (Johan Bergström) [iojs/io.js#1334](https://github.com/nodejs/node/pull/1334)
* [[`5094a0fde3`](https://github.com/io.js/io.js/commit/5094a0fde3)] - **build**: Pasar argumentos de BSDmakefile a gmake (Johan Bergström) [iojs/io.js#1298](https://github.com/nodejs/node/pull/1298)
* [[`f782824d48`](https://github.com/io.js/io.js/commit/f782824d48)] - **deps**: refactorizar openssl.gyp (Shigeki Ohtsu) [iojs/io.js#1325](https://github.com/nodejs/node/pull/1325)
* [[`21f4fb6215`](https://github.com/io.js/io.js/commit/21f4fb6215)] - **deps**: actualizar gyp a e1c8fcf7 (Shigeki Ohtsu) [iojs/io.js#1325](https://github.com/nodejs/node/pull/1325)
* [[`dac903f9b6`](https://github.com/io.js/io.js/commit/dac903f9b6)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [iojs/io.js#990](https://github.com/nodejs/node/pull/990)
* [[`5eb983e0b3`](https://github.com/io.js/io.js/commit/5eb983e0b3)] - **deps**: actualizar npm a 2.7.5 (Forrest L Norvell) [iojs/io.js#1337](https://github.com/nodejs/node/pull/1337)
* [[`008078862e`](https://github.com/io.js/io.js/commit/008078862e)] - **deps**: revisar en gtest, añadir prueba de unidad de util (Ben Noordhuis) [iojs/io.js#1199](https://github.com/nodejs/node/pull/1199)
* [[`48d69cf1bb`](https://github.com/io.js/io.js/commit/48d69cf1bb)] - ***Revert*** "**doc**: fix typo in CHANGELOG.md" (Giovanny Andres Gongora Granada) [iojs/io.js#1349](https://github.com/nodejs/node/pull/1349)
* [[`679596c848`](https://github.com/io.js/io.js/commit/679596c848)] - **doc**: añadir WG de Docker (Peter Petrov) [iojs/io.js#1134](https://github.com/nodejs/node/pull/1134)
* [[`d8578bad25`](https://github.com/io.js/io.js/commit/d8578bad25)] - **doc**: corregir errores tipográficos menores en COLLABORATOR_GUIDE.md (Kelsey) [iojs/io.js#1320](https://github.com/nodejs/node/pull/1320)
* [[`bde2b3e397`](https://github.com/io.js/io.js/commit/bde2b3e397)] - **doc**: corregir error tipográfico en CHANGELOG.md (Giovanny Andres Gongora Granada) [iojs/io.js#1342](https://github.com/nodejs/node/pull/1342)
* [[`8c6c376a94`](https://github.com/io.js/io.js/commit/8c6c376a94)] - **doc**: añadir huella digital de GPG para Fishrock123 (Jeremiah Senkpiel) [iojs/io.js#1324](https://github.com/nodejs/node/pull/1324)
* [[`ccbea18960`](https://github.com/io.js/io.js/commit/ccbea18960)] - **doc**: mejorar formato para las claves GPG de los colaboradores (Jeremiah Senkpiel) [iojs/io.js#1324](https://github.com/nodejs/node/pull/1324)
* [[`87053e8aee`](https://github.com/io.js/io.js/commit/87053e8aee)] - **doc**: añadir de vuelta la cita para la variable booleana 'true' (Kohei TAKATA) [iojs/io.js#1338](https://github.com/nodejs/node/pull/1338)
* [[`634e9629a0`](https://github.com/io.js/io.js/commit/634e9629a0)] - **doc**: añadir minutas de la reunión del TC del 2015-03-04 (Rod Vagg) [iojs/io.js#1123](https://github.com/nodejs/node/pull/1123)
* [[`245ba1d658`](https://github.com/io.js/io.js/commit/245ba1d658)] - **doc**: corregir la documentación de util.isObject (Jeremiah Senkpiel) [iojs/io.js#1295](https://github.com/nodejs/node/pull/1295)
* [[`ad937752ee`](https://github.com/io.js/io.js/commit/ad937752ee)] - **doc,src**: remover referencias a --max-stack-size (Aria Stewart) [iojs/io.js#1327](https://github.com/nodejs/node/pull/1327)
* [[`15f058f609`](https://github.com/io.js/io.js/commit/15f058f609)] - **gyp**: corregir compilación con python 2.6 (Fedor Indutny) [iojs/io.js#1325](https://github.com/nodejs/node/pull/1325)
* [[`4dc6ae2181`](https://github.com/io.js/io.js/commit/4dc6ae2181)] - **lib**: remover variables no utilizadas (Brian White) [iojs/io.js#1290](https://github.com/nodejs/node/pull/1290)
* [[`b6e22c4bd5`](https://github.com/io.js/io.js/commit/b6e22c4bd5)] - **src**: configurar los workers del clúster antes de la precarga (Ali Ijaz Sheikh) [iojs/io.js#1314](https://github.com/nodejs/node/pull/1314)
* [[`4a801c211c`](https://github.com/io.js/io.js/commit/4a801c211c)] - **src**: soltar fondo de threads personal, utilizar libplatform (Ben Noordhuis) [iojs/io.js#1329](https://github.com/nodejs/node/pull/1329)
* [[`f1e5a13516`](https://github.com/io.js/io.js/commit/f1e5a13516)] - **src**: envolver la definición de MIN en infdef (Johan Bergström) [iojs/io.js#1322](https://github.com/nodejs/node/pull/1322)
* [[`6f72d87c27`](https://github.com/io.js/io.js/commit/6f72d87c27)] - **test**: añadir prueba para la fuga de un temporizador sin referencias (Fedor Indutny) [iojs/io.js#1330](https://github.com/nodejs/node/pull/1330)
* [[`416499c872`](https://github.com/io.js/io.js/commit/416499c872)] - **timers**: remover código redundante (Fedor Indutny) [iojs/io.js#1330](https://github.com/nodejs/node/pull/1330)
* [[`d22b2a934a`](https://github.com/io.js/io.js/commit/d22b2a934a)] - **timers**: no reiniciar el intervalo luego del cierre (Fedor Indutny) [iojs/io.js#1330](https://github.com/nodejs/node/pull/1330)
* [[`cca5efb086`](https://github.com/io.js/io.js/commit/cca5efb086)] - **timers**: no cerrar temporizadores de intervalo cuando se les haga unref() (Julien Gilli)
* [[`0e061975d7`](https://github.com/io.js/io.js/commit/0e061975d7)] - **timers**: corregir fuga de memoria de unref() (Trevor Norris) [iojs/io.js#1330](https://github.com/nodejs/node/pull/1330)
* [[`ec7fbf2bb2`](https://github.com/io.js/io.js/commit/ec7fbf2bb2)] - **tools**: corregir la ruta de fuente de la instalación para las cabeceras de openssl (Oguz Bastemur) [iojs/io.js#1354](https://github.com/nodejs/node/pull/1354)
* [[`644ece1f67`](https://github.com/io.js/io.js/commit/644ece1f67)] - **tools**: remover directorio de pruebas de gyp (Shigeki Ohtsu) [iojs/io.js#1350](https://github.com/nodejs/node/pull/1350)
* [[`eb459c8151`](https://github.com/io.js/io.js/commit/eb459c8151)] - **tools**: corregir gyp para que funcione en MacOSX sin XCode (Shigeki Ohtsu) [iojs/io.js#1325](https://github.com/nodejs/node/pull/1325)
* [[`1e94057c05`](https://github.com/io.js/io.js/commit/1e94057c05)] - **url**: corregir la resolución desde no-archivos a las URLs de archivos. (Jeffrey Jagoda) [iojs/io.js#1277](https://github.com/nodejs/node/pull/1277)
* [[`382bd9d2e0`](https://github.com/io.js/io.js/commit/382bd9d2e0)] - **v8**: hacer backport a corrección de la compilación de openbsd/amd64 (Ben Noordhuis) [iojs/io.js#1318](https://github.com/nodejs/node/pull/1318)
* [[`efadffe861`](https://github.com/io.js/io.js/commit/efadffe861)] - **win,node-gyp**: permitir que opcionalmente se pueda renombrar a node.exe/iojs.exe (Bert Belder) [iojs/io.js#1266](https://github.com/nodejs/node/pull/1266)

<a id="1.6.3"></a>

## 2015-03-31, Versión 1.6.3, @rvagg

### Cambios notables

* **fs**: puede darse corrupción por efecto de `fs.writeFileSync()` y el modo adjunto de `fs.writeFile()` y `fs.writeFileSync()` bajo ciertas circunstancias, reportado en [#1058](https://github.com/nodejs/node/issues/1058), corregido en [#1063](https://github.com/nodejs/node/pull/1063) (Olov Lassus).
* **iojs**: una API de "módulos internos" ha sido introducida para permitir que el código del núcleo comparta módulos de JavaScript solo internamente sin tener que exponerlos como una API pública, esta función es solo para el núcleo [#848](https://github.com/nodejs/node/pull/848) (Vladimir Kurchatkin).
* **timers**: two minor problems with timers have been fixed:
  - ahora `Timer#close()` es idempotente [#1288](https://github.com/nodejs/node/issues/1288) (Petka Antonov).
  - `setTimeout()` solo ejecutará la callback una vez luego de `unref()` durante la callback [#1231](https://github.com/nodejs/node/pull/1231) (Roman Reiss).
  - NOTA: aún existen otros asuntos sin resolver con el código de los temporizadores, tales como [#1152](https://github.com/nodejs/node/pull/1152).
* **Windows**: un "hook delay-load hook" ha sido añadido para los complementos compilados en Windows, debería aliviar algunos de los problemas que los usuarios de Windows pueden estar experimentando con complementos en io.js [#1251](https://github.com/nodejs/node/pull/1251) (Bert Belder).
* **V8**: actualización de corrección de bug menor para V8 a 4.1.0.27.
* **npm**: upgrade npm to 2.7.4. See [npm CHANGELOG.md](https://github.com/npm/npm/blob/master/CHANGELOG.md#v274-2015-03-20) for details. Resumen:
  * [`1549106`](https://github.com/npm/npm/commit/1549106f518000633915686f5f1ccc6afcf77f8f) [#7641](https://github.com/npm/npm/issues/7641) Debido a 448efd0, la ejecución de `npm shrinkwrap --dev` causó que las dependencias de producción dejaran de ser incluidas en `npm-shrinkwrap.json`. ¡Ooops! ([@othiym23](https://github.com/othiym23))
  * [`fb0ac26`](https://github.com/npm/npm/commit/fb0ac26eecdd76f6eaa4a96a865b7c6f52ce5aa5) [#7579](https://github.com/npm/npm/issues/7579) Solo bloquear la remoción de archivos y enlaces al estar seguros de que npm no es responsable por ellos. Este cambio es difícil de resumir, ya que si las cosas están funcionando correctamente usted no debería notarlo, pero si desea más contexto solo [lea el mensaje del commit](https://github.com/npm/npm/commit/fb0ac26eecdd76f6eaa4a96a865b7c6f52ce5aa5), en el que todo se explica. ([@othiym23](https://github.com/othiym23))
  * [`051c473`](https://github.com/npm/npm/commit/051c4738486a826300f205b71590781ce7744f01) [#7552](https://github.com/npm/npm/issues/7552) las `bundledDependencies` ahora están correctamente incluidas en el contexto de instalación. Este es otro bug increíblemente difícil de resumir, y, de nuevo, le recomiendo [leer el mensaje del commit](https://github.com/npm/npm/commit/051c4738486a826300f205b71590781ce7744f01) si se siente curioso sobre los detalles. Un breve resumen es que esto corrige muchos casos de uso para `ember-cli`. ([@othiym23](https://github.com/othiym23))
  * [`fe1bc38`](https://github.com/npm/npm/commit/fe1bc387a14475e373557de669e03d9d006d3173)[#7672](https://github.com/npm/npm/issues/7672) `npm-registry-client@3.1.2`: Corregir el manejo de certificados paralelos al cliente corrigiendo el nombre de la propiedad. ([@atamon](https://github.com/atamon))
  * [`89ce829`](https://github.com/npm/npm/commit/89ce829a00b526d0518f5cd855c323bffe182af0)[#7630](https://github.com/npm/npm/issues/7630) `hosted-git-info@1.5.3`: La tercera parte de asegurarse que el atajo de Github sea manejado consistentemente. ([@othiym23](https://github.com/othiym23))
  * [`63313eb`](https://github.com/npm/npm/commit/63313eb0c37891c355546fd1093010c8a0c3cd81)[#7630](https://github.com/npm/npm/issues/7630) `realize-package-specifier@2.2.0`: La segunda parte de asegurarse de que el atajo de Github sea manejado correctamente. ([@othiym23](https://github.com/othiym23))
  * [`3ed41bf`](https://github.com/npm/npm/commit/3ed41bf64a1bb752bb3155c74dd6ffbbd28c89c9)[#7630](https://github.com/npm/npm/issues/7630) `npm-package-arg@3.1.1`: La primera parte de asegurarse de que el atajo de Github sea manejado correctamente. ([@othiym23](https://github.com/othiym23))

### Problemas conocidos

* Algunos problemas con temporizadores y `unref()` aún están por resolverse. Consulte [#1152](https://github.com/nodejs/node/pull/1152).
* Puede que aún exista alguna o algunas fugas de memoria pequeñas, pero aún deben ser adecuadamente identificadas, consulte los detalles en [#1075](https://github.com/nodejs/node/issues/1075).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`7dd5e824be`](https://github.com/nodejs/node/commit/7dd5e824be)] - **assert**: simplificar la lógica de la prueba de igualdad de búfer (Alex Yursha) [#1171](https://github.com/nodejs/node/pull/1171)
* [[`a2ea16838f`](https://github.com/nodejs/node/commit/a2ea16838f)] - **debugger**: no generar proceso secundario en el modo remoto (Jackson Tian) [#1282](https://github.com/nodejs/node/pull/1282)
* [[`2752da4b64`](https://github.com/nodejs/node/commit/2752da4b64)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`f166cdecf1`](https://github.com/nodejs/node/commit/f166cdecf1)] - **deps**: actualizar npm a 2.7.4 (Forrest L Norvell)
* [[`318d9d8fd7`](https://github.com/nodejs/node/commit/318d9d8fd7)] - **deps**: actualizar v8 a 4.1.0.27 (Ben Noordhuis) [#1289](https://github.com/nodejs/node/pull/1289)
* [[`269e46be37`](https://github.com/nodejs/node/commit/269e46be37)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`b542fb94a4`](https://github.com/nodejs/node/commit/b542fb94a4)] - **deps**: actualizar npm a 2.7.3 (Forrest L Norvell) [#1219](https://github.com/nodejs/node/pull/1219)
* [[`73de13511d`](https://github.com/nodejs/node/commit/73de13511d)] - **doc**: añadir enlaces de WG en WORKING_GROUPS.md & corregir nits (Farrin Reid) [#1113](https://github.com/nodejs/node/pull/1113)
* [[`19641b17be`](https://github.com/nodejs/node/commit/19641b17be)] - **doc**: desparejar el desplazamiento de la barra lateral (Roman Reiss) [#1274](https://github.com/nodejs/node/pull/1274)
* [[`dbccf8d3ed`](https://github.com/nodejs/node/commit/dbccf8d3ed)] - **doc**: corregir error ortográfico en las banderas de funciones (Phillip Lamplugh) [#1286](https://github.com/nodejs/node/pull/1286)
* [[`5e609e9324`](https://github.com/nodejs/node/commit/5e609e9324)] - ***Revert*** "**doc**: clarify real name requirement" (Jeremiah Senkpiel) [#1276](https://github.com/nodejs/node/pull/1276)
* [[`45814216ee`](https://github.com/nodejs/node/commit/45814216ee)] - **doc**: corregir discrepancia con los documentos de formato (Brendan Ashworth) [#1255](https://github.com/nodejs/node/pull/1255)
* [[`4e9bf93e9c`](https://github.com/nodejs/node/commit/4e9bf93e9c)] - **doc**: clarificar requerimiento de nombre real (Roman Reiss) [#1250](https://github.com/nodejs/node/pull/1250)
* [[`e84dd5f651`](https://github.com/nodejs/node/commit/e84dd5f651)] - **doc**: documentar carga de módulo ante petición de repl (Roman Reiss) [#1249](https://github.com/nodejs/node/pull/1249)
* [[`c9207f7fc2`](https://github.com/nodejs/node/commit/c9207f7fc2)] - **fs**: arreglar corrupción en writeFile y writeFileSync (Olov Lassus) [#1063](https://github.com/nodejs/node/pull/1063)
* [[`2db758c562`](https://github.com/nodejs/node/commit/2db758c562)] - **iojs**: introducir módulos internos (Vladimir Kurchatkin) [#848](https://github.com/nodejs/node/pull/848)
* [[`36f017afaf`](https://github.com/nodejs/node/commit/36f017afaf)] - **js2c**: corregir generación de ids de módulos en windows (Ben Noordhuis) [#1281](https://github.com/nodejs/node/pull/1281)
* [[`1832743e18`](https://github.com/nodejs/node/commit/1832743e18)] - **lib**: añadir `new` faltante para el lib/*.js de los errores (Mayhem) [#1246](https://github.com/nodejs/node/pull/1246)
* [[`ea37ac04f4`](https://github.com/nodejs/node/commit/ea37ac04f4)] - **src**: ignorar ENOTCONN ante carrera de cierre con el proceso secundario (Ben Noordhuis) [#1214](https://github.com/nodejs/node/pull/1214)
* [[`f06b16f2e9`](https://github.com/nodejs/node/commit/f06b16f2e9)] - **src**: corregir fuga de memoria menor en módulos de pre-carga (Ali Ijaz Sheikh) [#1265](https://github.com/nodejs/node/pull/1265)
* [[`2903410aa8`](https://github.com/nodejs/node/commit/2903410aa8)] - **src**: no hacer carga floja de las globales de los temporizadores (Ben Noordhuis) [#1280](https://github.com/nodejs/node/pull/1280)
* [[`2e5b87a147`](https://github.com/nodejs/node/commit/2e5b87a147)] - **src**: remover búsquedas de ambiente innecesarias (Ben Noordhuis) [#1238](https://github.com/nodejs/node/pull/1238)
* [[`7e88a9322c`](https://github.com/nodejs/node/commit/7e88a9322c)] - **src**: hacer que los accesores sean inmunes a la confusión de contexto (Ben Noordhuis) [#1238](https://github.com/nodejs/node/pull/1238)
* [[`c8fa8ccdbc`](https://github.com/nodejs/node/commit/c8fa8ccdbc)] - **streams**: utilizar on _stream_wrap estricto (Brendan Ashworth) [#1279](https://github.com/nodejs/node/pull/1279)
* [[`8a945814dd`](https://github.com/nodejs/node/commit/8a945814dd)] - **string_decoder**: optimizar write() (Brian White) [#1209](https://github.com/nodejs/node/pull/1209)
* [[`8d1c87ea0a`](https://github.com/nodejs/node/commit/8d1c87ea0a)] - **test**: corregir carrera en paralela/test-vm-debug-context (Ben Noordhuis) [#1294](https://github.com/nodejs/node/pull/1294)
* [[`955c1508da`](https://github.com/nodejs/node/commit/955c1508da)] - **test**: reducir defectuosidad de secuencial/test-fs-watch (Roman Reiss) [#1275](https://github.com/nodejs/node/pull/1275)
* [[`77c2da10fd`](https://github.com/nodejs/node/commit/77c2da10fd)] - **timers**: hacer que Timer.close sea idempotente (Petka Antonov) [#1288](https://github.com/nodejs/node/pull/1288)
* [[`776b73b243`](https://github.com/nodejs/node/commit/776b73b243)] - **timers**: manejo de intervalos de limpieza (Jeremiah Senkpiel) [#1272](https://github.com/nodejs/node/pull/1272)
* [[`caf0b36de3`](https://github.com/nodejs/node/commit/caf0b36de3)] - **timers**: asegurarse de que setTimeout solo se ejecute una vez (Roman Reiss) [#1231](https://github.com/nodejs/node/pull/1231)
* [[`2ccc8f3970`](https://github.com/nodejs/node/commit/2ccc8f3970)] - **tls_wrap**: corregir esta fuga increíblemente estúpida (Fedor Indutny) [#1244](https://github.com/nodejs/node/pull/1244)
* [[`e74b5d278c`](https://github.com/nodejs/node/commit/e74b5d278c)] - **tls_wrap**: corregir fuga de BIO ante error de SSL (Fedor Indutny) [#1244](https://github.com/nodejs/node/pull/1244)
* [[`ba93c583bc`](https://github.com/nodejs/node/commit/ba93c583bc)] - **win,node-gyp**: permitir que opcionalmente se pueda renombrar anode.exe/iojs.exe (Bert Belder) [#1266](https://github.com/nodejs/node/pull/1266)
* [[`08acf1352c`](https://github.com/nodejs/node/commit/08acf1352c)] - **win,node-gyp**: hacer que el hook delay-load sea opcional (Bert Belder) [#1266](https://github.com/nodejs/node/pull/1266)
* [[`3d46fefe0c`](https://github.com/nodejs/node/commit/3d46fefe0c)] - **win,node-gyp**: permitir que se pueda renombrar a node.exe/iojs.exe (Bert Belder) [#1251](https://github.com/nodejs/node/pull/1251)

<a id="1.6.2"></a>

## 2015-03-23, Versión 1.6.2, @rvagg

### Cambios notables

* **Windows**: El trabajo actual para mejorar el estado del soporte de Windows ha traído consigo que toda la suite de pruebas pase de nuevo. Como se hace notar en las notas de lanzamiento para la v1.4.2, el sistema de integración continua y problemas de configuración del mismo no le permitían reportar correctamente problemas con las pruebas de Windows, dichos problemas con la integración continua y la base de código parecen haberse resuelto completamente.
* **FreeBSD**: Un [bug del núcleo](https://lists.freebsd.org/pipermail/freebsd-current/2015-March/055043.html) que tenía efectos sobre io.js/Node.js fue [descubierto](https://github.com/joyent/node/issues/9326) y se ha introducido un parche para evitar que cause problemas en io.js (Fedor Indutny) [#1218](https://github.com/nodejs/node/pull/1218).
* **module**: ahora puede hacer `require('.')` en lugar de tener que hacer `require('./')`, esto se puede considerar una corrección de bug (Michaël Zasso) [#1185](https://github.com/nodejs/node/pull/1185).
* **v8**: actualizado a 4.1.0.25, incluyendo parches para los valores de `--max_old_space_size` superiores a `4096` y soporte para Solaris, ambos de los cuales ya están incluidos en io.js.

### Problemas conocidos

* Puede(n) todavía existir una(s) posible(s) pequeña(s) pérdida(s) de memoria, pero todavía están por identificarse apropiadamente, detalles en [#1075](https://github.com/nodejs/node/issues/1075).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`fe4434b77a`](https://github.com/nodejs/node/commit/fe4434b77a)] - **deps**: actualizar v8 a 4.1.0.25 (Johan Bergström) [#1224](https://github.com/nodejs/node/pull/1224)
* [[`d8f383ba3f`](https://github.com/nodejs/node/commit/d8f383ba3f)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#1234](https://github.com/nodejs/node/pull/1234)
* [[`bc9c1a5a7b`](https://github.com/nodejs/node/commit/bc9c1a5a7b)] - **doc**: corregir typo en CHANGELOG (Mathieu Darse) [#1230](https://github.com/nodejs/node/pull/1230)
* [[`99c79f8d41`](https://github.com/nodejs/node/commit/99c79f8d41)] - **doc**: llamar a función de js en un contexto nulo (Ben Noordhuis) [#1125](https://github.com/nodejs/node/pull/1125)
* [[`55abf34be5`](https://github.com/nodejs/node/commit/55abf34be5)] - **doc**: no utilizar `using namespace v8` (Ben Noordhuis) [#1125](https://github.com/nodejs/node/pull/1125)
* [[`c4e1b82120`](https://github.com/nodejs/node/commit/c4e1b82120)] - **doc**: reemplazar v8::Handle<T> con v8::Local<T> (Ben Noordhuis) [#1125](https://github.com/nodejs/node/pull/1125)
* [[`2f1b78347c`](https://github.com/nodejs/node/commit/2f1b78347c)] - **doc**: remover v8::HandleScopes innecesarios (Ben Noordhuis) [#1125](https://github.com/nodejs/node/pull/1125)
* [[`409d413363`](https://github.com/nodejs/node/commit/409d413363)] - **doc**: remover usos de v8::Isolate::GetCurrent() (Ben Noordhuis) [#1125](https://github.com/nodejs/node/pull/1125)
* [[`33fea6ed5f`](https://github.com/nodejs/node/commit/33fea6ed5f)] - **lib**: no penalizar caso común de setInterval() (Ben Noordhuis) [#1221](https://github.com/nodejs/node/pull/1221)
* [[`31da9758a0`](https://github.com/nodejs/node/commit/31da9758a0)] - **lib**: no penalizar caso común de setTimeout() (Ben Noordhuis) [#1221](https://github.com/nodejs/node/pull/1221)
* [[`6fc5e95354`](https://github.com/nodejs/node/commit/6fc5e95354)] - **module**: permitir require('.') (Michaël Zasso) [#1185](https://github.com/nodejs/node/pull/1185)
* [[`9ae1a61214`](https://github.com/nodejs/node/commit/9ae1a61214)] - **node**: asegurarse de que streams2 no hagan `.end()` sobre stdin (Fedor Indutny) [#1233](https://github.com/nodejs/node/pull/1233)
* [[`b64983d77c`](https://github.com/nodejs/node/commit/b64983d77c)] - **src**: reestablecer el manejador de señales a SIG_DFL en FreeBSD (Fedor Indutny) [#1218](https://github.com/nodejs/node/pull/1218)
* [[`9705a34e96`](https://github.com/nodejs/node/commit/9705a34e96)] - **test**: mover secuencial/test-signal-unregister (Ben Noordhuis) [#1227](https://github.com/nodejs/node/pull/1227)
* [[`10a9c00563`](https://github.com/nodejs/node/commit/10a9c00563)] - **test**: corregir problema con el tiempo en prueba de señales (Ben Noordhuis) [#1227](https://github.com/nodejs/node/pull/1227)
* [[`999fbe9d96`](https://github.com/nodejs/node/commit/999fbe9d96)] - **test**: corregir mala revisión criptográfica de crypto-binary-default (Brendan Ashworth) [#1141](https://github.com/nodejs/node/pull/1141)
* [[`2b3b2d392f`](https://github.com/nodejs/node/commit/2b3b2d392f)] - **test**: añadir pruebas multi-argumentos de setTimeout/setInterval (Ben Noordhuis) [#1221](https://github.com/nodejs/node/pull/1221)
* [[`849319a260`](https://github.com/nodejs/node/commit/849319a260)] - **util**: Revisar el input para util.inherits (Connor Peet) [#1240](https://github.com/nodejs/node/pull/1240)
* [[`cf081a4712`](https://github.com/nodejs/node/commit/cf081a4712)] - **vm**: corregir colapso ante error fatal en el contexto de depuración (Ben Noordhuis) [#1229](https://github.com/nodejs/node/pull/1229)

<a id="1.6.1"></a>

## 2015-03-20, Versión 1.6.1, @rvagg

### Cambios notables

* **path**: Una nueva revisión de tipo en `path.resolve()` [#1153](https://github.com/nodejs/node/pull/1153) descubrió algunos casos límite de los que se dependía fuera del entorno controlado, significativamente `path.dirname(undefined)`. La revisión de tipo se ha hecho menos estricta para `path.dirname()`, `path.basename()`, y `path.extname()` (Colin Ihrig) [#1216](https://github.com/nodejs/node/pull/1216).
* **querystring**: Optimizaciones internas en `querystring.parse()` y `querystring.stringify()` [#847](https://github.com/nodejs/node/pull/847) evitaron que literales `Number` fueran correctamente convertidos a través de `querystring.escape()` [#1208](https://github.com/nodejs/node/issues/1208), exponiendo un punto ciego en la suite de pruebas. El bug y las pruebas ya han sido corregidas (Jeremiah Senkpiel) [#1213](https://github.com/nodejs/node/pull/1213).

### Problemas conocidos

* Posible(s) pérdida(s) de memoria relacionada(s) con TLS restante, detalles en [#1075](https://github.com/nodejs/node/issues/1075).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`3b9eab9779`](https://github.com/nodejs/node/commit/3b9eab9779)] - **build**: hacer prueba de revisión de alias (Johan Bergström) [#1211](https://github.com/nodejs/node/pull/1211)
* [[`4c731042d4`](https://github.com/nodejs/node/commit/4c731042d4)] - **configure**: utilizar por defecto cc y c++ en os x (Ben Noordhuis) [#1210](https://github.com/nodejs/node/pull/1210)
* [[`8de78e470d`](https://github.com/nodejs/node/commit/8de78e470d)] - **path**: reducir revisión de tipo en algunos métodos (cjihrig) [#1216](https://github.com/nodejs/node/pull/1216)
* [[`c9aec2b716`](https://github.com/nodejs/node/commit/c9aec2b716)] - **querystring**: corregir stringifyPrimitive dañada (Jeremiah Senkpiel) [#1213](https://github.com/nodejs/node/pull/1213)
* [[`a89f5c2156`](https://github.com/nodejs/node/commit/a89f5c2156)] - **querystring**: analizar correctamente los números (Jeremiah Senkpiel) [#1213](https://github.com/nodejs/node/pull/1213)
* [[`2034137385`](https://github.com/nodejs/node/commit/2034137385)] - **smalloc**: no mezclar malloc() y nueva char\[\] (Ben Noordhuis) [#1205](https://github.com/nodejs/node/pull/1205)

<a id="1.6.0"></a>

## 2015-03-19, Versión 1.6.0, @chrisdickinson

### Cambios notables

* **node**: una nueva opción de la línea de comandos `-r` o `--require` puede ser utilizada para pre-cargar módulos en el inicio (Ali Ijaz Sheikh) [#881](https://github.com/nodejs/node/pull/881).
* **querystring**: ahora `parse()` y `stringify()` son más rápidas (Brian White) [#847](https://github.com/nodejs/node/pull/847).
* **http**: el método `http.ClientRequest#flush()` ha sido desaprobado y reemplazado por `http.ClientRequest#flushHeaders()` para coincidir con el mismo cambio en la v0.12 de Node.js, de acuerdo con [joyent/node#9048](https://github.com/joyent/node/pull/9048) (Yosuke Furukawa) [#1156](https://github.com/nodejs/node/pull/1156).
* **net**: permitir que `server.listen()` acepte una opción de `String` para `port`, p.ej., `{ port: "1234" }`, de modo que coincida con la misma opción que se acepta en `net.connect()`, de acuerdo con [joyent/node#9268](https://github.com/joyent/node/pull/9268) (Ben Noordhuis) [#1116](https://github.com/nodejs/node/pull/1116).
* **tls**: más trabajo en la fuga de memoria reportada, aunque parece que aún resta una fuga menor para el caso de uso en cuestión. Haga seguimiento del progreso en [#1075](https://github.com/nodejs/node/issues/1075).
* **v8**: hacer backport a una corrección para el desbordamiento de un entero cuando sean usados valores de `--max_old_space_size` superiores a `4096` (Ben Noordhuis) [#1166](https://github.com/nodejs/node/pull/1166).
* **platforms**: the io.js CI system now reports passes on **FreeBSD** and **SmartOS** (_Solaris_).
* **npm**: upgrade npm to 2.7.1. See [npm CHANGELOG.md](https://github.com/npm/npm/blob/master/CHANGELOG.md#v271-2015-03-05) for details. Resumen:
  * [`6823807`](https://github.com/npm/npm/commit/6823807bba) [#7121](https://github.com/npm/npm/issues/7121) utilizar `npm install --save` para dependencias de Git guarda el URL pasado, en lugar del directorio temporal utilizado para clonar el repositorio remoto. Corrige el uso de dependencias de Git al hacer shrinkwwap. En el proceso, se reescribió el almacenamiento en caché de código por la dependencia de Git. Nuevamente. No más nombres de variables de una sola letra, y un flujo de trabajo mucho más claro. ([@othiym23](https://github.com/othiym23))
  * [`abdd040`](https://github.com/npm/npm/commit/abdd040da9) read-package-json@1.3.2: Proporcionar mensajes de error más útiles cuando los errores de análisis de JSON sean encontrados utilizando un analizador de JSON menos estricto que JSON.parse. ([@smikes](https://github.com/smikes))
  * [`c56cfcd`](https://github.com/npm/npm/commit/c56cfcd79c) [#7525](https://github.com/npm/npm/issues/7525) `npm dedupe` maneja los paquetes con ámbito. ([@KidkArolis](https://github.com/KidkArolis))
  * [`4ef1412`](https://github.com/npm/npm/commit/4ef1412d00) [#7075](https://github.com/npm/npm/issues/7075) Si intenta etiquetar un lanzamiento como un rango de semver válido, `npm publish` y `npm tag` emitirán un error tempranamente, en lugar de proceder. ([@smikes](https://github.com/smikes))

### Problemas conocidos

* Posible(s) pérdida(s) de memoria relacionada(s) con TLS restante, detalles en [#1075](https://github.com/nodejs/node/issues/1075).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`a84ea66b35`](https://github.com/nodejs/node/commit/a84ea66b35)] - **deps**: actualizar a openssl-1.0.1m (Shigeki Ohtsu) [#1206](https://github.com/nodejs/node/pull/1206)
* [[`3bc445f6c2`](https://github.com/nodejs/node/commit/3bc445f6c2)] - **doc**: corregir un enlace roto de github de colaborador (Aleksanteri Negru-Vode) [#1204](https://github.com/nodejs/node/pull/1204)
* [[`813a536126`](https://github.com/nodejs/node/commit/813a536126)] - **buffer**: remoción de código duplicado (Thorsten Lorenz) [#1144](https://github.com/nodejs/node/pull/1144)
* [[`1514b82355`](https://github.com/nodejs/node/commit/1514b82355)] - **(SEMVER-MINOR) src**: añadir las banderas -r/--require para los módulos de pre-carga (Ali Ijaz Sheikh) [#881](https://github.com/nodejs/node/pull/881)
* [[`f600111d82`](https://github.com/nodejs/node/commit/f600111d82)] - **test**: almacenar en caché las propiedades lazy, corregir nits de estilo (Rod Vagg) [#1196](https://github.com/nodejs/node/pull/1196)
* [[`3038b8ee6a`](https://github.com/nodejs/node/commit/3038b8ee6a)] - **test**: doble finalización del tiempo de espera en tls-wrap-timeout.js (Fedor Indutny) [#1201](https://github.com/nodejs/node/pull/1201)
* [[`dd37fb4c48`](https://github.com/nodejs/node/commit/dd37fb4c48)] - **build**: remover argumento incorrecto en vcbuild.bat (Jeremiah Senkpiel) [#1198](https://github.com/nodejs/node/pull/1198)
* [[`2b2e48a4b9`](https://github.com/nodejs/node/commit/2b2e48a4b9)] - **lib**: no emitir error en repl cuando cwd no exista (Ben Noordhuis) [#1194](https://github.com/nodejs/node/pull/1194)
* [[`2c6f79c08c`](https://github.com/nodejs/node/commit/2c6f79c08c)] - **src**: no emitir error al inicio cuando cwd no exista (Ben Noordhuis) [#1194](https://github.com/nodejs/node/pull/1194)
* [[`c15e81afdd`](https://github.com/nodejs/node/commit/c15e81afdd)] - **test**: Introducir conocimiento de contenedores de FreeBSD (Johan Bergström) [#1167](https://github.com/nodejs/node/pull/1167)
* [[`fe0f015c51`](https://github.com/nodejs/node/commit/fe0f015c51)] - **src**: corregir solución para entero de bio de criptografía en 32 bits (Ben Noordhuis) [#1192](https://github.com/nodejs/node/pull/1192)
* [[`2b63bcd247`](https://github.com/nodejs/node/commit/2b63bcd247)] - **doc**: añadir a yosuke-furukawa como colaborador (Yosuke Furukawa) [#1183](https://github.com/nodejs/node/pull/1183)
* [[`69350baaef`](https://github.com/nodejs/node/commit/69350baaef)] - **doc**: actualizar sección de pruebas en CONTRIBUTING.md (Ben Noordhuis) [#1181](https://github.com/nodejs/node/pull/1181)
* [[`3c8ae2d934`](https://github.com/nodejs/node/commit/3c8ae2d934)] - **doc**: añadir a petkaantonov como collaborator (Petka Antonov) [#1179](https://github.com/nodejs/node/pull/1179)
* [[`92c1ad97c0`](https://github.com/nodejs/node/commit/92c1ad97c0)] - **doc**: añadir a silverwind como colaborador (Roman Reiss) [#1176](https://github.com/nodejs/node/pull/1176)
* [[`14c74d5326`](https://github.com/nodejs/node/commit/14c74d5326)] - **doc**: añadir a jbergstroem como colaborador (Johan Bergström) [#1175](https://github.com/nodejs/node/pull/1175)
* [[`8b2363d2fd`](https://github.com/nodejs/node/commit/8b2363d2fd)] - **configure**: utilizar gcc y g++ como predeterminados de CC y CXX (Ben Noordhuis) [#1174](https://github.com/nodejs/node/pull/1174)
* [[`08ec897f82`](https://github.com/nodejs/node/commit/08ec897f82)] - **doc**: corregir error tipográfico en la documentación del módulo buffer (Alex Yursha) [#1169](https://github.com/nodejs/node/pull/1169)
* [[`c638dad567`](https://github.com/nodejs/node/commit/c638dad567)] - **benchmark**: añadir la opción de formato del output \[csv\] (Brendan Ashworth) [#777](https://github.com/nodejs/node/pull/777)
* [[`97d8d4928d`](https://github.com/nodejs/node/commit/97d8d4928d)] - **benchmark**: añadir script gráfico R plot_csv (Brendan Ashworth) [#777](https://github.com/nodejs/node/pull/777)
* [[`22793da485`](https://github.com/nodejs/node/commit/22793da485)] - **v8**: corregir el desbordamiento de enteros --max_old_space_size=4096 (Ben Noordhuis) [#1166](https://github.com/nodejs/node/pull/1166)
* [[`b2e00e38dc`](https://github.com/nodejs/node/commit/b2e00e38dc)] - **(SEMVER-MINOR) http**: añador flushHeaders y desaprobar flush (Yosuke Furukawa) [#1156](https://github.com/nodejs/node/pull/1156)
* [[`68d4bed2fd`](https://github.com/nodejs/node/commit/68d4bed2fd)] - **make**: remover node_dtrace de las exclusiones de cpplint (Julien Gilli) [joyent/node#8741](https://github.com/joyent/node/pull/8741)
* [[`30666f22ca`](https://github.com/nodejs/node/commit/30666f22ca)] - **net**: utilizar nombre de peer almacenado en caché para resolver campos remotos (James Hartig) [joyent/node#9366](https://github.com/joyent/node/pull/9366)
* [[`e6e616fdcb`](https://github.com/nodejs/node/commit/e6e616fdcb)] - **doc**: corregir errores tipográficos '\\' en Windows (Steven Vercruysse) [joyent/node#9412](https://github.com/joyent/node/pull/9412)
* [[`89bf6c05e9`](https://github.com/nodejs/node/commit/89bf6c05e9)] - **build**: permitir ruta de PackageMaker personalizada (Julien Gilli) [joyent/node#9377](https://github.com/joyent/node/pull/9377)
* [[`f58e59649d`](https://github.com/nodejs/node/commit/f58e59649d)] - **lib**: remover función NODE_MODULE_CONTEXTS dañada (Ben Noordhuis) [#1162](https://github.com/nodejs/node/pull/1162)
* [[`2551c1d2ca`](https://github.com/nodejs/node/commit/2551c1d2ca)] - **src**: utilizar Number::New() para heapTotal/heapUsed (Ben Noordhuis) [#1148](https://github.com/nodejs/node/pull/1148)
* [[`4f394998ba`](https://github.com/nodejs/node/commit/4f394998ba)] - **src**: no crear string de js dos veces ante error (Ben Noordhuis) [#1148](https://github.com/nodejs/node/pull/1148)
* [[`eb995d6822`](https://github.com/nodejs/node/commit/eb995d6822)] - **path**: añadir revisión de tipo para inputs de ruta (cjihrig) [#1153](https://github.com/nodejs/node/pull/1153)
* [[`a28945b128`](https://github.com/nodejs/node/commit/a28945b128)] - **doc**: reflejar el nuevo comportamiento de require('events') (Alex Yursha) [#975](https://github.com/nodejs/node/pull/975)
* [[`85a92a37ef`](https://github.com/nodejs/node/commit/85a92a37ef)] - **querystring**: optimizar análisis y stringificación (Brian White) [#847](https://github.com/nodejs/node/pull/847)
* [[`65d0a8eca8`](https://github.com/nodejs/node/commit/65d0a8eca8)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`7d0baf1741`](https://github.com/nodejs/node/commit/7d0baf1741)] - **deps**: actualizar npm a 2.7.1 (Forrest L Norvell) [#1142](https://github.com/nodejs/node/pull/1142)
* [[`4eb8810a27`](https://github.com/nodejs/node/commit/4eb8810a27)] - **tls**: volver a habilitar `.writev()` en TLSWrap (Fedor Indutny) [#1155](https://github.com/nodejs/node/pull/1155)
* [[`e90ed790c3`](https://github.com/nodejs/node/commit/e90ed790c3)] - **tls**: corregir fuga en errores de `DoWrite()` (Fedor Indutny) [#1154](https://github.com/nodejs/node/pull/1154)
* [[`056ed4b0c9`](https://github.com/nodejs/node/commit/056ed4b0c9)] - **src**: revertir las banderas -r/--require (Chris Dickinson) [#1150](https://github.com/nodejs/node/pull/1150)
* [[`7a5b023bac`](https://github.com/nodejs/node/commit/7a5b023bac)] - **doc**: corregir los ejemplos del módulo vm (FangDun Cai) [#1147](https://github.com/nodejs/node/pull/1147)
* [[`7bde3f1a8f`](https://github.com/nodejs/node/commit/7bde3f1a8f)] - **(SEMVER-MINOR) src**: añadir banderas -r/--require para los módulos de pre-carga (Ali Ijaz Sheikh) [#881](https://github.com/nodejs/node/pull/881)
* [[`53e200acc2`](https://github.com/nodejs/node/commit/53e200acc2)] - **test**: corregir test-http-content-length (Jeremiah Senkpiel) [#1145](https://github.com/nodejs/node/pull/1145)
* [[`d8c4a932c9`](https://github.com/nodejs/node/commit/d8c4a932c9)] - **crypto**: añadir autenticador de certificados de ValiCert desaprobado para certificados cruzados (Shigeki Ohtsu) [#1135](https://github.com/nodejs/node/pull/1135)
* [[`82f067e60b`](https://github.com/nodejs/node/commit/82f067e60b)] - **test**: fix ext commands to be double quoted (Shigeki Ohtsu) [#1122](https://github.com/nodejs/node/pull/1122)
* [[`5ecdc0314d`](https://github.com/nodejs/node/commit/5ecdc0314d)] - **test**: añadir prueba para la lectura de un archivo grande a través de un pipe (Santiago Gimeno) [#1074](https://github.com/nodejs/node/pull/1074)
* [[`a6af709489`](https://github.com/nodejs/node/commit/a6af709489)] - **fs**: utilice stat.st_size solo para leer archivos regulares (Santiago Gimeno) [#1074](https://github.com/nodejs/node/pull/1074)
* [[`0782c24993`](https://github.com/nodejs/node/commit/0782c24993)] - **test**: corregir prueba de readfile-zero-byte-liar (Santiago Gimeno) [#1074](https://github.com/nodejs/node/pull/1074)
* [[`e2c9040995`](https://github.com/nodejs/node/commit/e2c9040995)] - **src**: no permitir fuga de handles ante depuración y salida (Fedor Indutny) [#1133](https://github.com/nodejs/node/pull/1133)
* [[`8c4f0df464`](https://github.com/nodejs/node/commit/8c4f0df464)] - **v8**: corregir compilación en plataformas solaris (Johan Bergström) [#1079](https://github.com/nodejs/node/pull/1079)
* [[`41c9daa143`](https://github.com/nodejs/node/commit/41c9daa143)] - **build**: corregir configuración incorrecta en vcbuild.bat (Bert Belder)
* [[`07c066724c`](https://github.com/nodejs/node/commit/07c066724c)] - **buffer**: alinear fragmentos en límite de 8 bytes (Fedor Indutny) [#1126](https://github.com/nodejs/node/pull/1126)
* [[`d33a647b4b`](https://github.com/nodejs/node/commit/d33a647b4b)] - **doc**: hacer que tools/update-authors.sh sea de plataforma cruzada (Ben Noordhuis) [#1121](https://github.com/nodejs/node/pull/1121)
* [[`8453fbc879`](https://github.com/nodejs/node/commit/8453fbc879)] - **https**: no sobreescribir la opción del nombre de servidor (skenqbx) [#1110](https://github.com/nodejs/node/pull/1110)
* [[`60dac07b06`](https://github.com/nodejs/node/commit/60dac07b06)] - **doc**: añadir a Malte-Thorben Bruns a .mailmap (Ben Noordhuis) [#1118](https://github.com/nodejs/node/pull/1118)
* [[`480b48244f`](https://github.com/nodejs/node/commit/480b48244f)] - **(SEMVER-MINOR) lib**: permitir server.listen({ port: "1234" }) (Ben Noordhuis) [#1116](https://github.com/nodejs/node/pull/1116)
* [[`80e14d736e`](https://github.com/nodejs/node/commit/80e14d736e)] - **doc**: mover la opción de checkServerIdentity a tls.connect() (skenqbx) [#1107](https://github.com/nodejs/node/pull/1107)
* [[`684a5878b6`](https://github.com/nodejs/node/commit/684a5878b6)] - **doc**: corregir puntos faltantes en url.markdown (Ryuichi Okumura) [#1115](https://github.com/nodejs/node/pull/1115)
* [[`8431fc53f1`](https://github.com/nodejs/node/commit/8431fc53f1)] - **tls_wrap**: establecer métodos de handle con proxies en el prototipo (Fedor Indutny) [#1108](https://github.com/nodejs/node/pull/1108)
* [[`8070b1ff99`](https://github.com/nodejs/node/commit/8070b1ff99)] - **buffer**: No asignar .parent si no existe ninguno (Trevor Norris) [#1109](https://github.com/nodejs/node/pull/1109)

<a id="1.5.1"></a>

## 2015-03-09, Versión 1.5.1, @rvagg

### Cambios notables

* **tls**: La fuga de memoria de TLS reportada ha sido, al menos, resuelta parcialmente a través de varios commits en este lanzamiento. Las pruebas actuales indican que aún _podrían_ haber algunos problemas de fuga. Siga el progreso completo en [#1075](https://github.com/nodejs/node/issues/1075).
* **http**: Corregir un error reportado en [joyent/node#9348](https://github.com/joyent/node/issues/9348) y [npm/npm#7349](https://github.com/npm/npm/issues/7349). Los datos pendientes no estaban siendo leídos completamente cuando se producía un evento de `'error'` que conducía a una falla de aserción ante `socket.destroy()`. (Fedor Indutny) [#1103](https://github.com/nodejs/node/pull/1103)

### Problemas conocidos

* Posible(s) pérdida(s) de memoria relacionada(s) con TLS restante, detalles en [#1075](https://github.com/nodejs/node/issues/1075).
* Windows todavía reporta algunas fallas menores de prueba y continuamos abordando todas estas como una prioridad. Vea [#1005](https://github.com/nodejs/node/issues/1005).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`030a92347d`](https://github.com/nodejs/node/commit/030a92347d)] - **benchmark**: variación de prueba de rendimiento de cliente de http fragmentado (Rudi Cilibrasi) [#228](https://github.com/nodejs/node/pull/228)
* [[`3b57819b58`](https://github.com/nodejs/node/commit/3b57819b58)] - **crypto**: corregir fuga en SafeX509ExtPrint (Fedor Indutny) [#1087](https://github.com/nodejs/node/pull/1087)
* [[`f8c893dd39`](https://github.com/nodejs/node/commit/f8c893dd39)] - **doc**: corregir markdown confuso en util.markdown (Yazhong Liu) [#1097](https://github.com/nodejs/node/pull/1097)
* [[`e763220f66`](https://github.com/nodejs/node/commit/e763220f66)] - **doc**: actualizar prerequisito de la versión de clang (Brendan Ashworth) [#1094](https://github.com/nodejs/node/pull/1094)
* [[`0f7c8ebeea`](https://github.com/nodejs/node/commit/0f7c8ebeea)] - **doc**: reemplazar artículo "an" con "a" en los documentos de net (Evan Lucas) [#1093](https://github.com/nodejs/node/pull/1093)
* [[`cf565b5516`](https://github.com/nodejs/node/commit/cf565b5516)] - **fs**: corregir que .write() no está forzando los valores no-strings (Jeremiah Senkpiel) [#1102](https://github.com/nodejs/node/pull/1102)
* [[`1a3ca8223e`](https://github.com/nodejs/node/commit/1a3ca8223e)] - **http_client**: asegurar socket vacío ante error (Fedor Indutny) [#1103](https://github.com/nodejs/node/pull/1103)
* [[`8670613d2d`](https://github.com/nodejs/node/commit/8670613d2d)] - **node_crypto_bio**: ajustar tamaño de memoria externa (Fedor Indutny) [#1085](https://github.com/nodejs/node/pull/1085)
* [[`528d8786ff`](https://github.com/nodejs/node/commit/528d8786ff)] - **src**: corregir fuga de memoria en ruta de error de fs.writeSync (Ben Noordhuis) [#1092](https://github.com/nodejs/node/pull/1092)
* [[`648fc63cd1`](https://github.com/nodejs/node/commit/648fc63cd1)] - **src**: corregir delete[] no coincidente en src/node_file.cc (Ben Noordhuis) [#1092](https://github.com/nodejs/node/pull/1092)
* [[`9f7c9811e2`](https://github.com/nodejs/node/commit/9f7c9811e2)] - **src**: añadir Context::Scope faltante (Ben Noordhuis) [#1084](https://github.com/nodejs/node/pull/1084)
* [[`fe36076c78`](https://github.com/nodejs/node/commit/fe36076c78)] - **stream_base**: WriteWrap::New/::Dispose (Fedor Indutny) [#1090](https://github.com/nodejs/node/pull/1090)
* [[`7f4c95e160`](https://github.com/nodejs/node/commit/7f4c95e160)] - **tls**: no permitir fuga de objetos de WriteWrap (Fedor Indutny) [#1090](https://github.com/nodejs/node/pull/1090)
* [[`4bd3620382`](https://github.com/nodejs/node/commit/4bd3620382)] - **url**: remover asignación redundante en url.parse (Alex Kocharin) [#1095](https://github.com/nodejs/node/pull/1095)

<a id="1.5.0"></a>

## 2015-03-06, Versión 1.5.0, @rvagg

### Cambios notables

* **buffer**: Nuevo método `Buffer#indexOf()`, modelado a partir de [`Array#indexOf()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf). Acepta una String, un Búfer o un Número. Las strings son interpretadas como UTF8. (Trevor Norris) [#561](https://github.com/nodejs/node/pull/561)
* **fs**: las propiedades de objeto de `options` en los métodos del `'fs'` ya no realizan una revisión de `hasOwnProperty()`, y, por lo tanto, permiten que los objetos de opciones tengan propiedades prototipo que apliquen. (Jonathan Ong) [#635](https://github.com/nodejs/node/pull/635)
* **tls**: Una probable fuga de memoria de TLS fue reportada por PayPal. Algunos de los cambios recientes en **stream_wrap** parecen tener la culpa. La corrección inicial se encuentra en [#1078](https://github.com/nodejs/node/pull/1078), puede hacer seguimiento del progreso hacia el cierre de la fuga en [#1075](https://github.com/nodejs/node/issues/1075) (Fedor Indutny).
* **npm**: Upgrade npm to 2.7.0. See [npm CHANGELOG.md](https://github.com/npm/npm/blob/master/CHANGELOG.md#v270-2015-02-26) for details including why this is a semver-minor when it could have been semver-major. Resumen:
  * [`145af65`](https://github.com/npm/npm/commit/145af6587f45de135cc876be2027ed818ed4ca6a) [#4887](https://github.com/npm/npm/issues/4887) Reemplazar las llamadas al script de `node-gyp` empaquetado con npm, pasando la opción `--node-gyp=/path/to/node-gyp` a npm. Intercambie con `pangyp` o una versión de `node-gyp` modificada para funcionar mejor con io.js, ¡sin tener que tocar el código de npm!  ([@ackalker](https://github.com/ackalker))
  * [`2f6a1df`](https://github.com/npm/npm/commit/2f6a1df3e1e3e0a3bc4abb69e40f59a64204e7aa) [#1999](https://github.com/npm/npm/issues/1999) Solo ejecutar los scripts de `stop` y `start` (y sus scripts pre- y post-) cuando no haya un script de `restart` definido. Esto hace que sea más fácil soportar reinicios con gracia de servicios manejados por npm.  ([@watilde](https://github.com/watilde) / [@scien](https://github.com/scien))
  * [`448efd0`](https://github.com/npm/npm/commit/448efd0eaa6f97af0889bf47efc543a1ea2f8d7e) [#2853](https://github.com/npm/npm/issues/2853) Añadir soporte de `--dev` y `--prod` para `npm ls`, de modo que pueda enumerar solo los árboles de producción o dependencias de desarrollo, como se desee. ([@watilde](https://github.com/watilde))
  * [`a0a8777`](https://github.com/npm/npm/commit/a0a87777af8bee180e4e9321699f050c29ed5ac4) [#7463](https://github.com/npm/npm/issues/7463) Dividir la lista impresa por `npm run-script` en scripts de ciclos de vida y scripts directamente invocados a través de `npm
run-script`. ([@watilde](https://github.com/watilde))
  * [`a5edc17`](https://github.com/npm/npm/commit/a5edc17d5ef1435b468a445156a4a109df80f92b) [#6749](https://github.com/npm/npm/issues/6749) `init-package-json@1.3.1`: Soporte para el paso de ámbitos a `npm init`, de modo que los paquetes sean inicializados como parte de tal ámbito / organización / equipo. ([@watilde](https://github.com/watilde))
* **TC**: Colin Ihrig (@cjihrig) renunció al TC, debido a sus deseos de hacer más código y menos reuniones.

### Problemas conocidos

* Posible fuga de memoria relacionada con TLS, detalles en [#1075](https://github.com/nodejs/node/issues/1075).
* Windows todavía reporta algunas fallas menores de prueba y continuamos abordando todas estas como una prioridad. Vea [#1005](https://github.com/nodejs/node/issues/1005).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`b27931b0fe`](https://github.com/nodejs/node/commit/b27931b0fe)] - **benchmark**: corregir la revisión de `wrk` (Brian White) [#1076](https://github.com/nodejs/node/pull/1076)
* [[`2b79052494`](https://github.com/nodejs/node/commit/2b79052494)] - **benchmark**: buscar wrk antes de ejecutar pruebas de rendimiento (Johan Bergström) [#982](https://github.com/nodejs/node/pull/982)
* [[`31421afe89`](https://github.com/nodejs/node/commit/31421afe89)] - **buffer**: reescribir el mensaje de error de Buffer.concat (Chris Dickinson) [joyent/node#8723](https://github.com/joyent/node/pull/8723)
* [[`78581c8d90`](https://github.com/nodejs/node/commit/78581c8d90)] - **(SEMVER-MINOR) buffer**: añadir el método indexOf() (Trevor Norris) [#561](https://github.com/nodejs/node/pull/561)
* [[`37bb1df7c4`](https://github.com/nodejs/node/commit/37bb1df7c4)] - **build**: remover mdb de io.js (Johan Bergström) [#1023](https://github.com/nodejs/node/pull/1023)
* [[`726671cb0e`](https://github.com/nodejs/node/commit/726671cb0e)] - **build**: añadir soporte básico para mips/mipsel (Ben Noordhuis) [#1045](https://github.com/nodejs/node/pull/1045)
* [[`a45d4f8fd6`](https://github.com/nodejs/node/commit/a45d4f8fd6)] - **build**: remover herramientas/wrk del árbol (Johan Bergström) [#982](https://github.com/nodejs/node/pull/982)
* [[`dee07e2983`](https://github.com/nodejs/node/commit/dee07e2983)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`fe14802fb7`](https://github.com/nodejs/node/commit/fe14802fb7)] - **deps**: actualizar npm a 2.7.0 (Forrest L Norvell) [#1080](https://github.com/nodejs/node/pull/1080)
* [[`31142415de`](https://github.com/nodejs/node/commit/31142415de)] - **doc**: añadir minutas de la reunión del TC del 2015-02-18 (Rod Vagg) [#1051](https://github.com/nodejs/node/pull/1051)
* [[`6190a2236b`](https://github.com/nodejs/node/commit/6190a2236b)] - **doc**: remover a cjihrig del TC (cjihrig) [#1056](https://github.com/nodejs/node/pull/1056)
* [[`9741291fe9`](https://github.com/nodejs/node/commit/9741291fe9)] - **doc**: corregir el ancho del encabezado de child_process (Sam Roberts) [#1038](https://github.com/nodejs/node/pull/1038)
* [[`c8110692a5`](https://github.com/nodejs/node/commit/c8110692a5)] - **doc**: añadir explicaciones para querystring (Robert Kowalski) [joyent/node#9259](https://github.com/joyent/node/pull/9259)
* [[`8fb711e06c`](https://github.com/nodejs/node/commit/8fb711e06c)] - **doc**: corregir el valor predeterminado de opts.decodeURIComponent (h7lin) [joyent/node#9259](https://github.com/joyent/node/pull/9259)
* [[`6433ad1eef`](https://github.com/nodejs/node/commit/6433ad1eef)] - **doc**: añadir nueva línea faltante en CHANGELOG (Rod Vagg)
* [[`555a7c48cf`](https://github.com/nodejs/node/commit/555a7c48cf)] - **events**: optimizar la clonación de arrays de listeners (Brian White) [#1050](https://github.com/nodejs/node/pull/1050)
* [[`4d0329ebeb`](https://github.com/nodejs/node/commit/4d0329ebeb)] - **(SEMVER-MINOR) fs**: remover el uso innecesario de .hasOwnProperty() (Jonathan Ong) [#635](https://github.com/nodejs/node/pull/635)
* [[`4874182065`](https://github.com/nodejs/node/commit/4874182065)] - **http**: enviar Content-Length cuando sea posible (Christian Tellnes) [#1062](https://github.com/nodejs/node/pull/1062)
* [[`08133f45c7`](https://github.com/nodejs/node/commit/08133f45c7)] - **http**: optimizar las peticiones salientes (Brendan Ashworth) [#605](https://github.com/nodejs/node/pull/605)
* [[`dccb69a21a`](https://github.com/nodejs/node/commit/dccb69a21a)] - **js_stream**: corregir fuga de instancias (Fedor Indutny) [#1078](https://github.com/nodejs/node/pull/1078)
* [[`4ddd6406ce`](https://github.com/nodejs/node/commit/4ddd6406ce)] - **lib**: evitar llamada a .toLowerCase() en Buffer#write() (Ben Noordhuis) [#1048](https://github.com/nodejs/node/pull/1048)
* [[`bbf54a554a`](https://github.com/nodejs/node/commit/bbf54a554a)] - **lib**: optimizar manualmente el constructor de Buffer (Ben Noordhuis) [#1048](https://github.com/nodejs/node/pull/1048)
* [[`9d2b89d06c`](https://github.com/nodejs/node/commit/9d2b89d06c)] - **net**: permitir el puerto 0 en connect() (cjihrig) [joyent/node#9268](https://github.com/joyent/node/pull/9268)
* [[`e0835c9cda`](https://github.com/nodejs/node/commit/e0835c9cda)] - **node**: mejorar el rendimiento de nextTick (Trevor Norris) [#985](https://github.com/nodejs/node/pull/985)
* [[`8f5f12bb48`](https://github.com/nodejs/node/commit/8f5f12bb48)] - **smalloc**: exportar constantes desde C++ (Vladimir Kurchatkin) [#920](https://github.com/nodejs/node/pull/920)
* [[`0697f8b44d`](https://github.com/nodejs/node/commit/0697f8b44d)] - **smalloc**: validar argumentos en js (Vladimir Kurchatkin) [#920](https://github.com/nodejs/node/pull/920)
* [[`1640dedb3b`](https://github.com/nodejs/node/commit/1640dedb3b)] - **src**: corregir regresión de codificación de búfer ucs-2 (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`2eda2d6096`](https://github.com/nodejs/node/commit/2eda2d6096)] - **src**: corregir cálculo de longitud de string externa (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`4aea16f214`](https://github.com/nodejs/node/commit/4aea16f214)] - **src**: renombrar variable local nombrada de manera confusa (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`c9ee654290`](https://github.com/nodejs/node/commit/c9ee654290)] - **src**: simplificar node::Utf8Value() (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`364cc7e08a`](https://github.com/nodejs/node/commit/364cc7e08a)] - **src**: remover variable de ambiente NODE_INVALID_UTF8 (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`826cde8661`](https://github.com/nodejs/node/commit/826cde8661)] - **src**: corregir heurística del recolector de basura para strings de dos bytes (twobyte) externas (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`f5b7e18243`](https://github.com/nodejs/node/commit/f5b7e18243)] - **src**: remover código no utilizado (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`4ae64b2626`](https://github.com/nodejs/node/commit/4ae64b2626)] - **src**: extraer inicialización de ambiente de node afuera de la inicialización de proceso (Petka Antonov) [#980](https://github.com/nodejs/node/pull/980)
* [[`b150c9839e`](https://github.com/nodejs/node/commit/b150c9839e)] - **src**: corregir advertencias -Wempty-body del compilador (Ben Noordhuis) [#974](https://github.com/nodejs/node/pull/974)
* [[`fb284e2e4d`](https://github.com/nodejs/node/commit/fb284e2e4d)] - **src**: corregir advertencia del compilador en smalloc.cc (Ben Noordhuis) [#1055](https://github.com/nodejs/node/pull/1055)
* [[`583a868bcd`](https://github.com/nodejs/node/commit/583a868bcd)] - **stream_wrap**: añadir HandleScope's en las callbacks de uv (Fedor Indutny) [#1078](https://github.com/nodejs/node/pull/1078)
* [[`e2fb733a95`](https://github.com/nodejs/node/commit/e2fb733a95)] - **test**: simplificar parallel/test-stringbytes-external (Ben Noordhuis) [#1042](https://github.com/nodejs/node/pull/1042)
* [[`7b554b1a8f`](https://github.com/nodejs/node/commit/7b554b1a8f)] - **test**: no generar procesos secundarios en prueba de dominio (Ben Noordhuis) [#974](https://github.com/nodejs/node/pull/974)
* [[`b72fa03057`](https://github.com/nodejs/node/commit/b72fa03057)] - **test**: añade una prueba para un valor indefinido en setHeader (Ken Perkins) [#970](https://github.com/nodejs/node/pull/970)
* [[`563771d8b1`](https://github.com/nodejs/node/commit/563771d8b1)] - **test**: dividir las partes fuera de la prueba de host-headers dentro de su propia prueba (Johan Bergström) [#1049](https://github.com/nodejs/node/pull/1049)
* [[`671fbd5a9d`](https://github.com/nodejs/node/commit/671fbd5a9d)] - **test**: refactorizar todas las pruebas que dependan del módulo criptográfico (Johan Bergström) [#1049](https://github.com/nodejs/node/pull/1049)
* [[`c7ad320472`](https://github.com/nodejs/node/commit/c7ad320472)] - **test**: verificar la existencia del cliente de openssl y proporcionar una ruta si existe (Johan Bergström) [#1049](https://github.com/nodejs/node/pull/1049)
* [[`71776f9057`](https://github.com/nodejs/node/commit/71776f9057)] - **test**: remover las importaciones de http no utilizadas (Johan Bergström) [#1049](https://github.com/nodejs/node/pull/1049)
* [[`3d5726c4ad`](https://github.com/nodejs/node/commit/3d5726c4ad)] - **test**: introducir un ayudante que revise si el módulo criptográfico está disponible (Johan Bergström) [#1049](https://github.com/nodejs/node/pull/1049)
* [[`d0e7c359a7`](https://github.com/nodejs/node/commit/d0e7c359a7)] - **test**: no asumir que process.versions.openssl siempre está disponible (Johan Bergström) [#1049](https://github.com/nodejs/node/pull/1049)
* [[`e1bf6709dc`](https://github.com/nodejs/node/commit/e1bf6709dc)] - **test**: corregir la "carreridad" en tls-inception (Fedor Indutny) [#1040](https://github.com/nodejs/node/pull/1040)
* [[`fd3ea29902`](https://github.com/nodejs/node/commit/fd3ea29902)] - **test**: corregir test-fs-access cuando la uid sea 0 (Johan Bergström) [#1037](https://github.com/nodejs/node/pull/1037)
* [[`5abfa930b8`](https://github.com/nodejs/node/commit/5abfa930b8)] - **test**: hacer que destroyed-socket-write2.js sea más robusta (Michael Dawson) [joyent/node#9270](https://github.com/joyent/node/pull/9270)
* [[`1009130495`](https://github.com/nodejs/node/commit/1009130495)] - **tests**: corregir carrera en test-http-curl-chunk-problem (Julien Gilli) [joyent/node#9301](https://github.com/joyent/node/pull/9301)
* [[`bd1bd7e38d`](https://github.com/nodejs/node/commit/bd1bd7e38d)] - **timer**: Mejorar el rendimiento de las callbacks (Ruben Verborgh) [#406](https://github.com/nodejs/node/pull/406)
* [[`7b3b8acfa6`](https://github.com/nodejs/node/commit/7b3b8acfa6)] - **tls**: aceptar `net.Socket`s vacíos (Fedor Indutny) [#1046](https://github.com/nodejs/node/pull/1046)
* [[`c09c90c1a9`](https://github.com/nodejs/node/commit/c09c90c1a9)] - **tls_wrap**: no sujetar al proceso primario a las referencias persistentes (Fedor Indutny) [#1078](https://github.com/nodejs/node/pull/1078)
* [[`3446ff417b`](https://github.com/nodejs/node/commit/3446ff417b)] - **tty**: no añadir el método `shutdown` al handle (Fedor Indutny) [#1073](https://github.com/nodejs/node/pull/1073)
* [[`abb00cc915`](https://github.com/nodejs/node/commit/abb00cc915)] - **url**: arrojar ante valores inválidos para url.format (Christian Tellnes) [#1036](https://github.com/nodejs/node/pull/1036)
* [[`abd3ecfbd1`](https://github.com/nodejs/node/commit/abd3ecfbd1)] - **win,test**: corregir test-stdin-from-file (Bert Belder) [#1067](https://github.com/nodejs/node/pull/1067)

<a id="1.4.3"></a>

## 2015-03-02, Versión 1.4.3, @rvagg

### Cambios notables

* **stream**: Se corrigieron problemas para plataformas sin soporte de `writev()`, particularmente Windows. Los cambios introducidos en la versión 1.4.1, a través de [#926](https://github.com/nodejs/node/pull/926), dañaron algunas funcionalidades para estas plataformas. Esto ya ha sido abordado. [#1008](https://github.com/nodejs/node/pull/1008) (Fedor Indutny)
* **arm**: Tenemos los inicios del soporte para ARMv8 / ARM64 / AARCH64. Una actualización a OpenSSL 1.0.2 es requerida para tener un soporte completo. [#1028](https://github.com/nodejs/node/pull/1028) (Ben Noordhuis)
* Añadir a un nuevo colaborador: Julian Duque ([@julianduque](https://github.com/julianduque))

### Problemas conocidos

* Windows aún reporta algunas fallas menores con las pruebas y continuamos abordando todas estas tan rápido como nos es posible. Vea [#1005](https://github.com/nodejs/node/issues/1005).
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`ca3c50b789`](https://github.com/nodejs/node/commit/ca3c50b789)] - **build**: añadir soporte básico para arm64 (Ben Noordhuis) [#1028](https://github.com/nodejs/node/pull/1028)
* [[`08e89b1880`](https://github.com/nodejs/node/commit/08e89b1880)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#1018](https://github.com/nodejs/node/pull/1018)
* [[`ea02d90cd0`](https://github.com/nodejs/node/commit/ea02d90cd0)] - **doc**: añadir a julianduque como colaborador (Julian Duque) [#1021](https://github.com/nodejs/node/pull/1021)
* [[`dfe7a17784`](https://github.com/nodejs/node/commit/dfe7a17784)] - **doc**: corregir errores tipográficos y fuentes en WORKING_GROUPS.md (&! (bitandbang)) [#1022](https://github.com/nodejs/node/pull/1022)
* [[`6d26990d32`](https://github.com/nodejs/node/commit/6d26990d32)] - **doc**: Limpiar net.Socket (Ryan Scheel) [#951](https://github.com/nodejs/node/pull/951)
* [[`c380ac6e98`](https://github.com/nodejs/node/commit/c380ac6e98)] - **doc**: sugerir alternativas a las APs desaprobadas (Benjamin Gruenbaum) [#1007](https://github.com/nodejs/node/pull/1007)
* [[`3d6440cf2a`](https://github.com/nodejs/node/commit/3d6440cf2a)] - **src**: corregir compilación --without-ssl (Ben Noordhuis) [#1027](https://github.com/nodejs/node/pull/1027)
* [[`2b47fd2eb6`](https://github.com/nodejs/node/commit/2b47fd2eb6)] - **stream_base**: `.writev()` tiene soporte limitado (Fedor Indutny) [#1008](https://github.com/nodejs/node/pull/1008)

<a id="1.4.2"></a>

## 2015-02-28, Versión 1.4.2, @rvagg

### Cambios notables

* **tls**: Un error tipográfico introducido en los cambios a TLSWrap en [#840](https://github.com/nodejs/node/pull/840) solo fue encontrado cuando un bug en Windows no fue capturado por el sistema de Integración Continua de io.js debido a problemas con el script de la compilación de Windows y la configuración de la integración continua de Windows. Vea los Problemas Conocidos, más abajo. Corregido en [#994](https://github.com/nodejs/node/pull/994) & [#1004](https://github.com/nodejs/node/pull/1004). (Fedor Indutny)
* **npm**: Upgrade npm to 2.6.1. See [npm CHANGELOG.md](https://github.com/npm/npm/blob/master/CHANGELOG.md#v260-2015-02-12) for details. Resumen:
  * [`8b98f0e`](https://github.com/npm/npm/commit/8b98f0e709d77a8616c944aebd48ab726f726f76) [#4471](https://github.com/npm/npm/issues/4471) `npm outdated` (y solo `npm
outdated`) ahora se establece predeterminadamente con `--depth=0`. Esto, además, tiene el excelente pero inesperado efecto de hacer que `npm update -g` funcione de la manera que casi todos quieren. Consulte los [documentos para `--depth`](https://github.com/npm/npm/blob/82f484672adb1a3caf526a8a48832789495bb43d/doc/misc/npm-config.md#depth) para ver los ligeramente confusos detalles. ([@smikes](https://github.com/smikes))
  * [`aa79194`](https://github.com/npm/npm/commit/aa791942a9f3c8af6a650edec72a675deb7a7c6e) [#6565](https://github.com/npm/npm/issues/6565) Mejorar la advertencia de desaprobación de `peerDependency` para incluir qué dependencia en cuál paquete va a necesitar ser cambiada. ([@othiym23](https://github.com/othiym23))
  * [`5fa067f`](https://github.com/npm/npm/commit/5fa067fd47682ac3cdb12a2b009d8ca59b05f992) [#7171](https://github.com/npm/npm/issues/7171) Mejorar la advertencia de desaprobación de `engineStrict` para incluir cuál `package.json` lo está usando. ([@othiym23](https://github.com/othiym23))
* Añadir nuevos colaboradores:
  - Robert Kowalski ([@robertkowalski](https://github.com/robertkowalski))
  - Christian Vaagland Tellnes ([@tellnes](https://github.com/tellnes))
  - Brian White ([@mscdex](https://github.com/mscdex))

### Problemas conocidos

* El soporte para Windows tiene algunas fallas sobresalientes que no han sido abordadas correctamente por el sistema de integración continua de io.js, debido a una combinación de factores que incluyen errores humanos, de programa y de Jenkins. Consulte [#1005](https://github.com/nodejs/node/issues/1005) para ver los detalles & la discusión. Espere que estos problemas sean abordados tan pronto como sea posible.
* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`25da0742ee`](https://github.com/nodejs/node/commit/25da0742ee)] - **build**: mejorar vcbuild.bat (Bert Belder) [#998](https://github.com/nodejs/node/pull/998)
* [[`b8310cbd3e`](https://github.com/nodejs/node/commit/b8310cbd3e)] - **build**: reducir el tamaño del tarball entre un 8 y 10% (Johan Bergström) [#961](https://github.com/nodejs/node/pull/961)
* [[`58a612ea9d`](https://github.com/nodejs/node/commit/58a612ea9d)] - **deps**: hacer que node-gyp funcione con io.js (cjihrig) [#990](https://github.com/nodejs/node/pull/990)
* [[`2a2fe5c4f2`](https://github.com/nodejs/node/commit/2a2fe5c4f2)] - **deps**: actualizar npm a 2.6.1 (Forrest L Norvell) [#990](https://github.com/nodejs/node/pull/990)
* [[`84ee2722a3`](https://github.com/nodejs/node/commit/84ee2722a3)] - **doc**: correcciones de formato menores. (Tim Oxley) [#996](https://github.com/nodejs/node/pull/996)
* [[`cf0306cd71`](https://github.com/nodejs/node/commit/cf0306cd71)] - **doc**: actualizar el índice de estabilidad (Chris Dickinson) [#943](https://github.com/nodejs/node/pull/943)
* [[`fb2439a699`](https://github.com/nodejs/node/commit/fb2439a699)] - **doc**: añadir a robertkowalski como colaborador (Robert Kowalski) [#977](https://github.com/nodejs/node/pull/977)
* [[`f83d380647`](https://github.com/nodejs/node/commit/f83d380647)] - **doc**: actualizar os.markdown (Benjamin Gruenbaum) [#976](https://github.com/nodejs/node/pull/976)
* [[`ae7a23351f`](https://github.com/nodejs/node/commit/ae7a23351f)] - **doc**: añadir mapa de ruta, i18n, seguimiento, WGs de evangelismo (Mikeal Rogers) [#911](https://github.com/nodejs/node/pull/911)
* [[`14174a95a5`](https://github.com/nodejs/node/commit/14174a95a5)] - **doc**: documentar mapa de ruta, grupos de trabajo (Mikeal Rogers)
* [[`865ee313cf`](https://github.com/nodejs/node/commit/865ee313cf)] - **doc**: añadir a tellnes como colaborador (Christian Tellnes) [#973](https://github.com/nodejs/node/pull/973)
* [[`01296923db`](https://github.com/nodejs/node/commit/01296923db)] - **doc**: añadir a mscdex como colaborador (Brian White) [#972](https://github.com/nodejs/node/pull/972)
* [[`675cffb33e`](https://github.com/nodejs/node/commit/675cffb33e)] - **http**: no confundir las cabeceras automáticas con otras (Christian Tellnes) [#828](https://github.com/nodejs/node/pull/828)
* [[`7887e119ed`](https://github.com/nodejs/node/commit/7887e119ed)] - **install**: new performance counters provider guid (Russell Dempsey)
* [[`4d1fa2ca97`](https://github.com/nodejs/node/commit/4d1fa2ca97)] - **src**: añadir revisión para el macro NOMINMAX ya definido (Pavel Medvedev) [#986](https://github.com/nodejs/node/pull/986)
* [[`1ab7e80838`](https://github.com/nodejs/node/commit/1ab7e80838)] - **tls**: establecer proxy a `handle.reading` de vuelta al handle primario (Fedor Indutny) [#1004](https://github.com/nodejs/node/pull/1004)
* [[`755461219d`](https://github.com/nodejs/node/commit/755461219d)] - **tls**: fix typo `handle._reading` => `handle.reading` (Fedor Indutny) [#994](https://github.com/nodejs/node/pull/994)

<a id="1.4.1"></a>

## 2015-02-26, Versión 1.4.1, @rvagg

_Nota: la versión **1.4.0** fue etiquetada y compilada, pero no hubo lanzamiento. Fue descubierto un bug de libuv en el proceso, por lo que el lanzamiento fue abortado. La etiqueta seguía a [`a558cd0a61`](https://github.com/nodejs/node/commit/a558cd0a61), pero ha sido removida. Hemos saltado a la versión 1.4.1 para evitar la confusión._

### Cambios notables

* **process** / **promises**: An `'unhandledRejection'` event is now emitted on `process` whenever a `Promise` is rejected and no error handler is attached to the `Promise` within a turn of the event loop. Ahora, un evento `'rejectionHandled'`es emitido cada vez que una `Promesa` es rechazada y un manejador de errores es anexado a la misma tras una vuelta del bucle de eventos. Consulte la documentación de [process](https://iojs.org/api/process.html) para ver más detalles. [#758](https://github.com/nodejs/node/pull/758) (Petka Antonov)
* **streams**:ahora puede utilizar un stream regular como socket subyacente para `tls.connect()` [#926](https://github.com/nodejs/node/pull/926) (Fedor Indutny)
* **http**: Un nuevo evento `'abort'` es emitido cada vez que una `http.ClientRequest` es abortada por el cliente. [#945](https://github.com/nodejs/node/pull/945) (Evan Lucas)
* **V8**: Actualizar V8 a 4.1.0.21. Incluye una corrección bloqueada, los detalles deberían estar disponibles en https://code.google.com/p/chromium/issues/detail?id=430201 cuando el bloqueo se levante. Un cambio de ruptura de ABI no ha sido agregado a esta actualización, y posiblemente sea incluido cuando io.js se combine con V8 4.2. Consulte [#952](https://github.com/nodejs/node/pull/952) para ver la discusión.
* **npm**: Upgrade npm to 2.6.0. Includes features to support the new registry and to prepare for `npm@3`. Consulte el [CHANGELOG.md de npm](https://github.com/npm/npm/blob/master/CHANGELOG.md#v260-2015-02-12) para ver detalles. Resumen:
  * [`38c4825`](https://github.com/npm/npm/commit/38c48254d3d217b4babf5027cb39492be4052fc2) [#5068](https://github.com/npm/npm/issues/5068) Añadir un nuevo comando de cierre de sesión, y encargarse de que haga algo útil tanto con los clientes autenticados de portador como los básicos. ([@othiym23](https://github.com/othiym23))
  * [`c8e08e6`](https://github.com/npm/npm/commit/c8e08e6d91f4016c80f572aac5a2080df0f78098) [#6565](https://github.com/npm/npm/issues/6565) Advertir que el comportamiento de `peerDependency` está cambiando y añadir una nota a los documentos. ([@othiym23](https://github.com/othiym23))
  * [`7c81a5f`](https://github.com/npm/npm/commit/7c81a5f5f058941f635a92f22641ea68e79b60db) [#7171](https://github.com/npm/npm/issues/7171) Advertir que el `engineStrict` en `package.json` desaparecerá en la siguiente versión major de npm (¡próximamente!) ([@othiym23](https://github.com/othiym23))
* **libuv**: Actualizado a 1.4.2. Consulte el [Registro de Cambios de libuv](https://github.com/libuv/libuv/blob/v1.x/ChangeLog) para ver los detalles de las correcciones.

### Problemas conocidos

* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`8a1e22af3a`](https://github.com/nodejs/node/commit/8a1e22af3a)] - **benchmark**: pasar execArgv al proceso de ejecución de pruebas de rendimiento (Petka Antonov) [#928](https://github.com/nodejs/node/pull/928)
* [[`234e6916b8`](https://github.com/nodejs/node/commit/234e6916b8)] - **build**: Corregir referencia incorrecta (Johan Bergström) [#924](https://github.com/nodejs/node/pull/924)
* [[`e00c938d24`](https://github.com/nodejs/node/commit/e00c938d24)] - **build**: hacer que test-ci dirija su output de TAP a stdout y registro (Rod Vagg) [#938](https://github.com/nodejs/node/pull/938)
* [[`b2a0d8f65e`](https://github.com/nodejs/node/commit/b2a0d8f65e)] - **deps**: actualizar libuv a 1.4.2 (Ben Noordhuis) [#966](https://github.com/nodejs/node/pull/966)
* [[`a558cd0a61`](https://github.com/nodejs/node/commit/a558cd0a61)] - **deps**: revertir cambio de abi de v8 (Ben Noordhuis) [#952](https://github.com/nodejs/node/pull/952)
* [[`54532a9761`](https://github.com/nodejs/node/commit/54532a9761)] - **deps**: corregir el soporte postmortem en v8 (Fedor Indutny) [#706](https://github.com/nodejs/node/pull/706)
* [[`78f4837926`](https://github.com/nodejs/node/commit/78f4837926)] - **deps**: actualizar v8 a 4.1.0.21 (Ben Noordhuis) [#952](https://github.com/nodejs/node/pull/952)
* [[`739fda16a9`](https://github.com/nodejs/node/commit/739fda16a9)] - **deps**: actualizar libuv a 1.4.1 (Ben Noordhuis) [#940](https://github.com/nodejs/node/pull/940)
* [[`da730c76e9`](https://github.com/nodejs/node/commit/da730c76e9)] - **deps**: habilitar la suma de control de descarga de iojs.lib de node-gyp (Ben Noordhuis) [#918](https://github.com/nodejs/node/pull/918)
* [[`97b424365a`](https://github.com/nodejs/node/commit/97b424365a)] - **deps**: hacer que node-gyp funcione otra vez en windows (Bert Belder)
* [[`19e3d5e10a`](https://github.com/nodejs/node/commit/19e3d5e10a)] - **deps**: hacer que node-gyp obtenga tarballs de iojs.org (Ben Noordhuis) [#343](https://github.com/nodejs/node/pull/343)
* [[`1e2fa1537f`](https://github.com/nodejs/node/commit/1e2fa1537f)] - **deps**: actualizar npm a 2.6.0 (Forrest L Norvell) [#904](https://github.com/nodejs/node/pull/904)
* [[`2e2cf81476`](https://github.com/nodejs/node/commit/2e2cf81476)] - **doc**: corregir la referencia de process.stdout a console.log (Brendan Ashworth) [#964](https://github.com/nodejs/node/pull/964)
* [[`2e63bad7eb`](https://github.com/nodejs/node/commit/2e63bad7eb)] - **doc**: enlace & y formato de los Algoritmos de Hash Seguros (SHAs) en la lista de commits (Tim Oxley) [#967](https://github.com/nodejs/node/pull/967)
* [[`c5050d8e4d`](https://github.com/nodejs/node/commit/c5050d8e4d)] - **doc**: corregir la descripción de 'dhparam' de tls.createServer (silverwind) [#968](https://github.com/nodejs/node/pull/968)
* [[`06ee782f24`](https://github.com/nodejs/node/commit/06ee782f24)] - **doc**: documentar 'unhandledRejection' y 'rejectionHandled' (Benjamin Gruenbaum) [#946](https://github.com/nodejs/node/pull/946)
* [[`b65dade102`](https://github.com/nodejs/node/commit/b65dade102)] - **doc**: actualizar el documentation.markdown para io.js. (Ryan Scheel) [#950](https://github.com/nodejs/node/pull/950)
* [[`87e4bfd582`](https://github.com/nodejs/node/commit/87e4bfd582)] - **doc**: enlazar a child.send() a la worker.send() de cluster (Sam Roberts) [#839](https://github.com/nodejs/node/pull/839)
* [[`cb22bc9b8a`](https://github.com/nodejs/node/commit/cb22bc9b8a)] - **doc**: corregir el tamaño de los pies de página (Jeremiah Senkpiel) [#860](https://github.com/nodejs/node/pull/860)
* [[`3ab9b92e90`](https://github.com/nodejs/node/commit/3ab9b92e90)] - **doc**: corregir el tamaño del encabezado de `_writev` de stream (René Kooi) [#916](https://github.com/nodejs/node/pull/916)
* [[`4fcbb8aaaf`](https://github.com/nodejs/node/commit/4fcbb8aaaf)] - **doc**: utilizar la URL de HTTPS para la página de documentación de API (Shinnosuke Watanabe) [#913](https://github.com/nodejs/node/pull/913)
* [[`329f364ea2`](https://github.com/nodejs/node/commit/329f364ea2)] - **doc**: corregir referencia a Pull Request en CHANGELOG (Brian White) [#903](https://github.com/nodejs/node/pull/903)
* [[`0ac57317aa`](https://github.com/nodejs/node/commit/0ac57317aa)] - **doc**: corregir error tipográfico, reescribir el cambio de cifrado en CHANGELOG (Rod Vagg) [#902](https://github.com/nodejs/node/pull/902)
* [[`1f40b2a636`](https://github.com/nodejs/node/commit/1f40b2a636)] - **fs**: añadir revisión de tipo a makeCallback() (cjihrig) [#866](https://github.com/nodejs/node/pull/866)
* [[`c82e580a50`](https://github.com/nodejs/node/commit/c82e580a50)] - **fs**: manejar correctamente al descriptor de archivos pasado a truncate() (Bruno Jouhier) [joyent/node#9161](https://github.com/joyent/node/pull/9161)
* [[`2ca22aacbd`](https://github.com/nodejs/node/commit/2ca22aacbd)] - **(SEMVER-MINOR) http**: emitir evento "abort" desde ClientRequest (Evan Lucas) [#945](https://github.com/nodejs/node/pull/945)
* [[`d8eb974a98`](https://github.com/nodejs/node/commit/d8eb974a98)] - **net**: hacer que Server.prototype.unref() sea persistente (cjihrig) [#897](https://github.com/nodejs/node/pull/897)
* [[`872702d9b7`](https://github.com/nodejs/node/commit/872702d9b7)] - **(SEMVER-MINOR) node**: implementar seguimiento de rechazos no manejados (Petka Antonov) [#758](https://github.com/nodejs/node/pull/758)
* [[`b41dbc2737`](https://github.com/nodejs/node/commit/b41dbc2737)] - **readline**: usar `codePointAt` nativa (Vladimir Kurchatkin) [#825](https://github.com/nodejs/node/pull/825)
* [[`26ebe9805e`](https://github.com/nodejs/node/commit/26ebe9805e)] - **smalloc**: extender la API de usuario (Trevor Norris) [#905](https://github.com/nodejs/node/pull/905)
* [[`e435a0114d`](https://github.com/nodejs/node/commit/e435a0114d)] - **src**: corregir SIGSEGV intermitente en resolveTxt (Evan Lucas) [#960](https://github.com/nodejs/node/pull/960)
* [[`0af4c9ea74`](https://github.com/nodejs/node/commit/0af4c9ea74)] - **src**: corregir dominios + --abort-on-uncaught-exception (Chris Dickinson) [#922](https://github.com/nodejs/node/pull/922)
* [[`89e133a1d8`](https://github.com/nodejs/node/commit/89e133a1d8)] - **stream_base**: remover declaraciones estáticas de JSMethod (Fedor Indutny) [#957](https://github.com/nodejs/node/pull/957)
* [[`b9686233fc`](https://github.com/nodejs/node/commit/b9686233fc)] - **stream_base**: introducir StreamBase (Fedor Indutny) [#840](https://github.com/nodejs/node/pull/840)
* [[`1738c77835`](https://github.com/nodejs/node/commit/1738c77835)] - **(SEMVER-MINOR) streams**: introducir StreamWrap y JSStream (Fedor Indutny) [#926](https://github.com/nodejs/node/pull/926)
* [[`506c7fd40b`](https://github.com/nodejs/node/commit/506c7fd40b)] - **test**: corregir ciclo de generación infinita en prueba de stdio (Ben Noordhuis) [#948](https://github.com/nodejs/node/pull/948)
* [[`a7bdce249c`](https://github.com/nodejs/node/commit/a7bdce249c)] - **test**: soportar la escritura de output de prueba a archivo (Johan Bergström) [#934](https://github.com/nodejs/node/pull/934)
* [[`0df54303c1`](https://github.com/nodejs/node/commit/0df54303c1)] - **test**: common.js -> common (Brendan Ashworth) [#917](https://github.com/nodejs/node/pull/917)
* [[`ed3b057e9f`](https://github.com/nodejs/node/commit/ed3b057e9f)] - **util**: manejar correctamente los símbolos en format() (cjihrig) [#931](https://github.com/nodejs/node/pull/931)

<a id="1.3.0"></a>

## 2015-02-20, Versión 1.3.0, @rvagg

### Cambios notables

* **url**: `url.resolve('/path/to/file', '.')` ahora devuelve `/path/to/` con una barra diagonal final, `url.resolve('/', '.')` devuelve `/`. [#278](https://github.com/nodejs/node/issues/278) (Amir Saboury)
* **tls**: La suite de cifrado predeterminada utilizada por `tls` y `https` ha sido cambiada a una que logra el Secreto Perfecto Hacia Adelante (Perfect Forward Secrecy) con todos los navegadores modernos. Adicionalmente, los cifrados RC4 inseguros han sido excluidos. Si necesita estrictamente de RC4, por favor especifique sus propias suites de cifrado. [#826](https://github.com/nodejs/node/issues/826) (Roman Reiss)

### Problemas conocidos

* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica como los docs sugieren, un retroceso introducido en 1.0.2, vea [#760](https://github.com/nodejs/node/issues/760) y corrija en [#774](https://github.com/nodejs/node/issues/774)
* Llamar a `dns.setServers()` mientras que una consulta DNS está en progreso puede causar que el proceso colapse en una aserción fallida [#894](https://github.com/nodejs/node/issues/894)

### Commits

* [[`35ed79932c`](https://github.com/nodejs/node/commit/35ed79932c)] - **benchmark**: añadir algunas pruebas de rendimiento de querystring (Brian White) [#846](https://github.com/nodejs/node/pull/846)
* [[`c6fd2c5e95`](https://github.com/nodejs/node/commit/c6fd2c5e95)] - **buffer**: corregir el ajuste del offset del fondo (Trevor Norris)
* [[`36a779560a`](https://github.com/nodejs/node/commit/36a779560a)] - **buffer**: exponer internos en el enlazado (Vladimir Kurchatkin) [#770](https://github.com/nodejs/node/pull/770)
* [[`e63b51793b`](https://github.com/nodejs/node/commit/e63b51793b)] - **crypto**: corregir para revisar método externo para librería compartida (Shigeki Ohtsu) [#800](https://github.com/nodejs/node/pull/800)
* [[`afdef70fcc`](https://github.com/nodejs/node/commit/afdef70fcc)] - **doc**: actualizar la lista AUTHORS (Rod Vagg) [#900](https://github.com/nodejs/node/pull/900)
* [[`1bf91878e7`](https://github.com/nodejs/node/commit/1bf91878e7)] - **doc**: añadir minutas de la reunión del TC del 2015-02-04 (Rod Vagg) [#876](https://github.com/nodejs/node/pull/876)
* [[`9e05c8d2fc`](https://github.com/nodejs/node/commit/9e05c8d2fc)] - **doc**: remover lenguaje obsoleto sobre consenso (Emily Rose)
* [[`ed240f44f7`](https://github.com/nodejs/node/commit/ed240f44f7)] - **doc**: documentar la opción 'ciphers' de tls.connect (Roman Reiss) [#845](https://github.com/nodejs/node/pull/845)
* [[`0555b3c785`](https://github.com/nodejs/node/commit/0555b3c785)] - **doc**: fix typo miliseconds -> milliseconds (jigsaw) [#865](https://github.com/nodejs/node/pull/865)
* [[`fc6507dd4e`](https://github.com/nodejs/node/commit/fc6507dd4e)] - **doc**: añadir coma en README para hacerlo más claro (Jimmy Hsu)
* [[`f0296933f8`](https://github.com/nodejs/node/commit/f0296933f8)] - **doc**: cambiar `it's` por `its` en el documento "process" (Charmander) [#837](https://github.com/nodejs/node/pull/837)
* [[`e81731ad18`](https://github.com/nodejs/node/commit/e81731ad18)] - **doc**: añadir a geek como colaborador (Wyatt Preul) [#835](https://github.com/nodejs/node/pull/835)
* [[`4ca7cca84a`](https://github.com/nodejs/node/commit/4ca7cca84a)] - **doc**: corrección gramatical en smalloc (Debjeet Biswas) [joyent/node#9164](https://github.com/joyent/node/pull/9164)
* [[`30dca66958`](https://github.com/nodejs/node/commit/30dca66958)] - **doc**: corregir sintaxis de código (Dan Dascalescu) [joyent/node#9198](https://github.com/joyent/node/pull/9198)
* [[`8c1df7a8a8`](https://github.com/nodejs/node/commit/8c1df7a8a8)] - **doc**: utilizar la firma correcta para assert() (Andrei Sedoi) [joyent/node#9003](https://github.com/joyent/node/pull/9003)
* [[`ba40942ad2`](https://github.com/nodejs/node/commit/ba40942ad2)] - **doc**: corregir gramática de oración en timers.markdown (Omer Wazir) [#815](https://github.com/nodejs/node/pull/815)
* [[`789ff959be`](https://github.com/nodejs/node/commit/789ff959be)] - **doc**: incrementar el grado de contraste de clases de marcas (Omer Wazir) [#824](https://github.com/nodejs/node/pull/824)
* [[`122a1758d1`](https://github.com/nodejs/node/commit/122a1758d1)] - **doc**: mejorar el suavizado de fuentes para firefox (Jeremiah Senkpiel) [#820](https://github.com/nodejs/node/pull/820)
* [[`982b143ab3`](https://github.com/nodejs/node/commit/982b143ab3)] - **doc**: deshabilitar las ligaduras de fuentes (Roman Reiss) [#816](https://github.com/nodejs/node/pull/816)
* [[`cb5560bd62`](https://github.com/nodejs/node/commit/cb5560bd62)] - **doc**: Cerrar correctamente el span de código (Omer Wazir) [#814](https://github.com/nodejs/node/pull/814)
* [[`c3c2fbdf83`](https://github.com/nodejs/node/commit/c3c2fbdf83)] - **doc**: cambiar "effect" por "affect" en errors.md (Ryan Seys) [#799](https://github.com/nodejs/node/pull/799)
* [[`b620129715`](https://github.com/nodejs/node/commit/b620129715)] - **doc**: añadir a sam-github como colaborador (Sam Roberts) [#791](https://github.com/nodejs/node/pull/791)
* [[`e80f803298`](https://github.com/nodejs/node/commit/e80f803298)] - **doc**: remover la sección de Caine de la guía de contribución (Michaël Zasso) [#804](https://github.com/nodejs/node/pull/804)
* [[`400d6e56f9`](https://github.com/nodejs/node/commit/400d6e56f9)] - **doc**: corregir enlace a libuv (Yosuke Furukawa) [#803](https://github.com/nodejs/node/pull/803)
* [[`15d156e3ec`](https://github.com/nodejs/node/commit/15d156e3ec)] - **doc**: corregir redacción en fs.appendFile (Rudolf Meijering) [#801](https://github.com/nodejs/node/pull/801)
* [[`dbf75924f1`](https://github.com/nodejs/node/commit/dbf75924f1)] - **doc**: actualizar enlaces de errores (Chris Dickinson) [#793](https://github.com/nodejs/node/pull/793)
* [[`7061669dba`](https://github.com/nodejs/node/commit/7061669dba)] - **events**: optimizar la adición y remoción de listeners (Brian White) [#785](https://github.com/nodejs/node/pull/785)
* [[`630f636334`](https://github.com/nodejs/node/commit/630f636334)] - **events**: mover la ruta lenta para que también separe la función (Brian White) [#785](https://github.com/nodejs/node/pull/785)
* [[`ecef87177a`](https://github.com/nodejs/node/commit/ecef87177a)] - **fs**: asegurarse de que la callback nullCheck() sea una función (cjihrig) [#887](https://github.com/nodejs/node/pull/887)
* [[`6a2b204bbc`](https://github.com/nodejs/node/commit/6a2b204bbc)] - **module**: reemplazar NativeModule.require (Herbert Vojčík) [joyent/node#9201](https://github.com/joyent/node/pull/9201)
* [[`9b6b05556f`](https://github.com/nodejs/node/commit/9b6b05556f)] - **net**: quitar referencias a temporizador en los sockets de proceso primario (Fedor Indutny) [#891](https://github.com/nodejs/node/pull/891)
* [[`cca8de6709`](https://github.com/nodejs/node/commit/cca8de6709)] - **net**: eliminar el uso de argumentos en el constructor del Servidor (cjihrig)
* [[`0cff0521c3`](https://github.com/nodejs/node/commit/0cff0521c3)] - **net**: arrojar ante agotamientos de tiempos de espera de sockets inválidos (cjihrig) [joyent/node#8884](https://github.com/joyent/node/pull/8884)
* [[`b5f25a963c`](https://github.com/nodejs/node/commit/b5f25a963c)] - **src**: asegurarse de que los descriptores de archivos 0-2 sean válidos (Ben Noordhuis) [#875](https://github.com/nodejs/node/pull/875)
* [[`a956791f69`](https://github.com/nodejs/node/commit/a956791f69)] - **src**: corregir error tipográfico en mensaje de error (Ben Noordhuis) [#875](https://github.com/nodejs/node/pull/875)
* [[`fb28c91074`](https://github.com/nodejs/node/commit/fb28c91074)] - **src**: corregir compilaciones de complementos, revertir 8aed9d66 parcialmente (Ben Noordhuis) [#868](https://github.com/nodejs/node/pull/868)
* [[`4bb3184d8d`](https://github.com/nodejs/node/commit/4bb3184d8d)] - **src**: reducir huella de la memoria de AsyncWrap (Ben Noordhuis) [#667](https://github.com/nodejs/node/pull/667)
* [[`7e779b4593`](https://github.com/nodejs/node/commit/7e779b4593)] - **src**: remover cabecera queue.h obsoleta (Ben Noordhuis) [#667](https://github.com/nodejs/node/pull/667)
* [[`38dc0cd8f4`](https://github.com/nodejs/node/commit/38dc0cd8f4)] - **src**: cambiar de QUEUE (en espera) a lista intrusiva (Ben Noordhuis) [#667](https://github.com/nodejs/node/pull/667)
* [[`58eb00c693`](https://github.com/nodejs/node/commit/58eb00c693)] - **src**: añadir lista intrusiva con seguridad de tipo (typesafe) (Ben Noordhuis) [#667](https://github.com/nodejs/node/pull/667)
* [[`8aed9d6610`](https://github.com/nodejs/node/commit/8aed9d6610)] - **src**: limpiar `Isolate::GetCurrent()` (Vladimir Kurchatkin) [#807](https://github.com/nodejs/node/pull/807)
* [[`7c22372303`](https://github.com/nodejs/node/commit/7c22372303)] - **src**: remover espacio en blanco posterior (Vladimir Kurchatkin) [#798](https://github.com/nodejs/node/pull/798)
* [[`20f8e7f17a`](https://github.com/nodejs/node/commit/20f8e7f17a)] - **test**: remover funcionalidad de pruebas defectuosa (Rod Vagg) [#812](https://github.com/nodejs/node/pull/812)
* [[`30e340ad9d`](https://github.com/nodejs/node/commit/30e340ad9d)] - **test**: corregir parallel/test-tls-getcipher (Roman Reiss) [#853](https://github.com/nodejs/node/pull/853)
* [[`d53b636d94`](https://github.com/nodejs/node/commit/d53b636d94)] - **test**: verificar campos en errores de spawn{Sync} (cjihrig) [#838](https://github.com/nodejs/node/pull/838)
* [[`3b1b4de903`](https://github.com/nodejs/node/commit/3b1b4de903)] - **test**: Timeout#unref() no devuelve instancia (Jan Schär) [joyent/node#9171](https://github.com/joyent/node/pull/9171)
* [[`becb4e980e`](https://github.com/nodejs/node/commit/becb4e980e)] - **test**: distribuir las pruebas criptográficas en archivos separados (Brendan Ashworth) [#827](https://github.com/nodejs/node/pull/827)
* [[`77f35861d0`](https://github.com/nodejs/node/commit/77f35861d0)] - **(SEMVER-MINOR) tls**: configuraciones predeterminadas más seguras (Roman Reiss) [#826](https://github.com/nodejs/node/pull/826)
* [[`faa687b4be`](https://github.com/nodejs/node/commit/faa687b4be)] - **url**: resolver urls con . y .. (Amir Saboury) [#278](https://github.com/nodejs/node/pull/278)

<a id="1.2.0"></a>

## 2015-02-10, Versión 1.2.0, @rvagg

### Cambios notables

* **stream**:
  - Construcción de streams más sencilla, consulte [readable-stream/issues#102](https://github.com/nodejs/readable-stream/issues/102) para ver detalles. Esto extiende los objetos base de los streams para hacer que sus constructores acepten métodos de implementación predeterminados, reduciendo los datos requeridos para implementar streams personalizados. Una versión actualizada de stream legible será lanzada eventualmente para hacer juego con este cambio en el núcleo. (@sonewman)
* **dns**:
  - Ahora `lookup()` soporta una opción booleana `'all'`, que está establecida por defecto en `false`, pero al ser activada ocasiona que el método devuelva un array de *todos* los nombres resueltos para una dirección [#744](https://github.com/nodejs/node/pull/744) (@silverwind)
* **assert**:
  - Remover la comparación de la propiedad `prototype` en `deepEqual()`, considerada una corrección de bug, vea [#636](https://github.com/nodejs/node/pull/636) (@vkurchatkin)
  - Introducir un método de `deepStrictEqual()` que imite a `deepEqual()` pero realice comparaciones de igualdad estricta sobre valores primitivos, vea [#639](https://github.com/nodejs/node/pull/639) (@vkurchatkin)
* **tracing**:
  - Añadir [LTTng](http://lttng.org/) (Linux Trace Toolkit Next Generation, o Nueva Generación de Herramientas de Seguimiento de Linux) al compilarse con la opción  `--with-lttng`. Los puntos de seguimiento coinciden con aquellos disponibles para DTrace y ETW. [#702](https://github.com/nodejs/node/pull/702) (@thekemkid)
* **docs**:
  - Muchas actualizaciones de documentación, vea los commits individuales
  - Nueva página de **Errores**, en la cual se discuten los errores de JavaScript, especificaciones de V8, y detalles de errores específicos de io.js. (@chrisdickinson)
* **npm** upgrade to 2.5.1, short changelog:
  - [npm/0e8d473](https://github.com/npm/npm/commit/0e8d4736a1cbdda41ae8eba8a02c7ff7ce80c2ff) [#7281](https://github.com/npm/npm/issues/7281) `npm-registry-mock@1.0.0`: Limpiar API, establecer `connection: close`, lo que hace que las pruebas pasen en io.js 1.1.x. ([@robertkowalski](https://github.com/robertkowalski))
  - [npm/f9313a0](https://github.com/npm/npm/commit/f9313a066c9889a0ee898d8a35676e40b8101e7f) [#7226](https://github.com/npm/npm/issues/7226) Ensure that all request settings are copied onto the agent. ([@othiym23](https://github.com/othiym23))
   - [npm/fec4c96](https://github.com/npm/npm/commit/fec4c967ee235030bf31393e8605e9e2811f4a39) Permitir `--no-proxy` para sobreescribir la configuración de `HTTP_PROXY` en el ambiente. ([@othiym23](https://github.com/othiym23))
  - [npm/9d61e96](https://github.com/npm/npm/commit/9d61e96fb1f48687a85c211e4e0cd44c7f95a38e) `npm outdated --long` ahora incluye una columna que muestra el tipo de dependencia. ([@watilde](https://github.com/watilde))
* **libuv** actualizar a 1.4.0, vea [el Registro de Cambios de libuv](https://github.com/libuv/libuv/blob/v1.x/ChangeLog)
* Añadir nuevos colaboradores:
  - Aleksey Smolenchuk (@lxe)
  - Shigeki Ohtsu (@shigeki)

### Problemas conocidos

* El par sustituto en REPL puede congelar el terminal [#690](https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática [#686](https://github.com/nodejs/node/issues/686)
* `process.send()` no es sincrónica, como los docs sugieren, una regresión introducida en la versión 1.0.2. Vea [#760](https://github.com/nodejs/node/issues/760) y la corrección en [#774](https://github.com/nodejs/node/issues/774), que debería aparecer en el próximo parche a ser lanzado.

### Commits

* [[`7e2235a`](https://github.com/nodejs/node/commit/7e2235aebb067b84974e001f9fa4d83f45b7c9dd)] - doc: añadir documentación de errores (Chris Dickinson)
* [[`d832be4`](https://github.com/nodejs/node/commit/d832be4aa3c68c29017339a65593f62cb73179bc)] - doc: actualizar la lista AUTHORS (Rod Vagg)
* [[`aea9b89`](https://github.com/nodejs/node/commit/aea9b89b5c2e3fb9fdbd96c7483eb1f60d09a39e)] - doc: añadir a shigeki como colaborador (Shigeki Ohtsu)
* [[`e653080`](https://github.com/nodejs/node/commit/e65308053c871352be948b9001737df01aad1965)] - fs: mejorar el rendimiento de `readFile` (Vladimir Kurchatkin)
* [[`9681fca`](https://github.com/nodejs/node/commit/9681fcacf0fd477f999a52f6ff4151d4125d49d0)] - deps: actualizar libuv a 1.4.0 (Saúl Ibarra Corretgé)
* [[`5e825d1`](https://github.com/nodejs/node/commit/5e825d1073b57a87fc9a77751ed3e21c86970082)] - tracing: añadir soporte de lttng para el seguimiento en linux (Glen Keane)
* [[`b677b84`](https://github.com/nodejs/node/commit/b677b844fc1de328a0f2b0151bdfc045cb5d0c81)] - events: optimizar varias funciones (Brian White)
* [[`c86e383`](https://github.com/nodejs/node/commit/c86e383c41f35b17ba79cc1c6dbfff674214177d)] - test: corregir fallo de prueba con openssl compartido (Shigeki Ohtsu)
* [[`1151016`](https://github.com/nodejs/node/commit/1151016d0a13dcb5973f602d0717c2da6abca551)] - doc: corregir error tipográfico en el documento "crypto" (Haoliang Gao)
* [[`7c56868`](https://github.com/nodejs/node/commit/7c568684b834a6a3c4d15bb29d2f95cf76773cb8)] - doc: cambiar el orden de crypto.publicDecrypt (Haoliang Gao)
* [[`3f473ef`](https://github.com/nodejs/node/commit/3f473ef141fdc7059928ebc4542b00e2f126ab07)] - assert: introducir `deepStrictEqual` (Vladimir Kurchatkin)
* [[`828d19a`](https://github.com/nodejs/node/commit/828d19a1f696840acf43b70125b85b0d61ff5056)] - doc: corregir el ejemplo de opciones de dns.lookup (Roman Reiss)
* [[`90d2b35`](https://github.com/nodejs/node/commit/90d2b352810bc352620e61e0dacc8573faf11dfb)] - doc: actualizar output de process.versions anticuado (Ben Noordhuis)
* [[`789bbb9`](https://github.com/nodejs/node/commit/789bbb91d3eb30fa2a51e9b064592d6a461a6fe5)] - doc: actualizar las referencias de node.js en los documentos de api (Ben Noordhuis)
* [[`c22e5ac`](https://github.com/nodejs/node/commit/c22e5ace846f93b4531a39b0e055f89a46598f63)] - https: revisión de argumentos más sencilla (Michaël Zasso)
* [[`b9d3928`](https://github.com/nodejs/node/commit/b9d3928f80992a812795a974cbae02288fc5049c)] - util: simplificar `isPrimitive` (Vladimir Kurchatkin)
* [[`2c3121c`](https://github.com/nodejs/node/commit/2c3121c606967f8595d671601493e623a7157385)] - benchmark: impulsar el número de iteraciones de eventemitter (Ben Noordhuis)
* [[`633a990`](https://github.com/nodejs/node/commit/633a9908487efadda6a86026a36d5325a28805c6)] - dns: permitir que dns.lookup() devuelva todas las direcciones (Roman Reiss)
* [[`1cd1d7a`](https://github.com/nodejs/node/commit/1cd1d7a182c2d16c28c778ddcd72bbeac6bc5c75)] - buffer: no comparar los mismos búferes (Vladimir Kurchatkin)
* [[`847b9d2`](https://github.com/nodejs/node/commit/847b9d212a404e5906ea9f366c458332c0318c53)] - benchmark: añadir más pruebas de rendimiento de EventEmitter (Brian White)
* [[`96597bc`](https://github.com/nodejs/node/commit/96597bc5927c57737c3bea943dd163d69ac76a96)] - doc: añadir a lxe como colaborador (Aleksey Smolenchuk)
* [[`7a301e2`](https://github.com/nodejs/node/commit/7a301e29de1e4ab5f39165beb6d0b41435c221dd)] - deps: hacer que node-gyp funcione de nuevo en windows (Bert Belder)
* [[`b188a34`](https://github.com/nodejs/node/commit/b188a3459d9d8a6d0c5fd391f1aefba281407083)] - deps: hacer que node-gyp obtenga tarballs de iojs.org (Ben Noordhuis)
* [[`af1bf49`](https://github.com/nodejs/node/commit/af1bf49852b7a8bcc9b9b6dd718edea0b18e3cb6)] - deps: actualizar npm a 2.5.1 (Forrest L Norvell)
* [[`9dc9ec3`](https://github.com/nodejs/node/commit/9dc9ec3ce6ba6f3dd4020e00f5863e207fa08a75)] - lib: hacer que el cliente de depuración se conecte a 127.0.0.1 (Ben Noordhuis)
* [[`e7573f9`](https://github.com/nodejs/node/commit/e7573f9111f6b85c599ec225714d76e08ec8a4dc)] - assert: no comparar la propiedad `prototype` de los objetos (Vladimir Kurchatkin)
* [[`8d11799`](https://github.com/nodejs/node/commit/8d1179952aefaa0086ff5540671cfd6ff612594b)] - asyncwrap: corregir revisión del proceso primario de nullptr (Trevor Norris)
* [[`62512bb`](https://github.com/nodejs/node/commit/62512bb29cd000dd5ce848258c10f3211f153bd5)] - test: aceptar error de ipv6 de EPROTONOSUPPORT (Ben Noordhuis)
* [[`05f4dff`](https://github.com/nodejs/node/commit/05f4dff97519ada5d3149a16ca9e5a04df948a61)] - asyncwrap: corregir condición del constructor para ret temprana (Trevor Norris)
* [[`10277d2`](https://github.com/nodejs/node/commit/10277d2e57ee7fe9e0e3f63f10b9ea521e86e7f0)] - docs: incluir mención de los nuevos métodos criptográficos (Calvin Metcalf)
* [[`9a8f186`](https://github.com/nodejs/node/commit/9a8f18613da4956c963377e2ad55cdd3dabc32aa)] - child_process: añadir detalles de depuración y errores (Zach Bruggeman)
* [[`6f7a978`](https://github.com/nodejs/node/commit/6f7a9784eaef82a1aa6cf53bbbd7224c446876a0)] - crypto: limpiar error ante retorno en los métodos de TLS (Fedor Indutny)
* [[`50daee7`](https://github.com/nodejs/node/commit/50daee7243a3f987e1a28d93c43f913471d6885a)] - stream: construcción de streams más sencilla (Sam Newman)
* [[`e0730ee`](https://github.com/nodejs/node/commit/e0730eeaa5231841a7eba080c8170e41278c3c52)] - benchmark: permitir la comparación a través de filtros fine-grained (Brian White)
* [[`96ffcb9`](https://github.com/nodejs/node/commit/96ffcb9a210a2fa1248ae5931290193573512a96)] - src: reducir el desbordamiento del perfilador de cpu (Ben Noordhuis)
* [[`3e675e4`](https://github.com/nodejs/node/commit/3e675e44b59f1be8e5581de000f3cb17ef747c14)] - benchmark: no utilizar strings modelo (Evan Lucas)
* [[`8ac8b76`](https://github.com/nodejs/node/commit/8ac8b760ac74e5a6938a49e563406716804672cb)] - doc: búsqueda de consenso total simplificada (Mikeal Rogers)
* [[`0a54b6a`](https://github.com/nodejs/node/commit/0a54b6a134a6815e30d1f78f8c8612d4a00399ad)] - doc: actualizar la carta de wg de streams (Chris Dickinson)
* [[`b8ead4a`](https://github.com/nodejs/node/commit/b8ead4a23f8b0717204878235d61cfce3f3fdd30)] - Ajuste para el proceso de retroalimentación en las pull requests. (Mikeal Rogers)
* [[`3af7f30`](https://github.com/nodejs/node/commit/3af7f30a7cceb1e418e5cd26c65a8ec5cc589d09)] - Documentación inicial para grupos de trabajo. (Mikeal Rogers)
* [[`513724e`](https://github.com/nodejs/node/commit/513724efcc42ed150391915050fe60402f8dd48d)] - doc: añadir huella digital de GPG para chrisdickinson (Chris Dickinson)
* [[`4168198`](https://github.com/nodejs/node/commit/41681983921d323da79b6d45e4ae0f8edb541e18)] - doc: añadir minutas de la reunión del TC del 2015-01-28 (Rod Vagg)

<a id="1.1.0"></a>

## 2015-02-03, Versión 1.1.0, @chrisdickinson

### Cambios notables

* debug: corregir la depuración post-mortem de v8.
* crypto: ahora publicEncrypt soporta claves privadas protegidas con contraseña.
* crypto: aceleración de ~30% en las funciones de hash.
* crypto: funciones privateEncrypt/publicDecrypt añadidas.
* errors
  - mejor formato a través de util.inspect
  - errores del sistema de archivos más descriptivos. Esto requería que se actualizara la `NODE_MODULE_VERSION`.
  - errores de http.setHeader más descriptivos
* actualizaciones de dependencias:
  - npm: actualizar a 2.4.1
  - http-parser: regresar a 2.3.0
  - libuv: actualizar a 1.3.0
  - v8: actualizar a 4.1.0.14
* http.request: ahora se respetan las propiedades heredadas en las opciones
* añadir interfaz iterable a los búferes (`para (permitir byte de buffer.values()) { }`)
* fs: corregir fuga del descriptor de archivos en `fs.createReadStream`. Consulte 497fd72 para ver detalles.
* instalador: en Windows, emitir WM_SETTINGCHANGE luego de la instalación, para hacer que los demás procesos en ejecución estén al tanto de los cambios de PATH.
* Se añadieron nuevos colaboradores:
  - Vladimir Kurchatkin (@vkurchatkin)
  - Micleușanu Nicu (@micnic)

### Problemas conocidos

* El par sustituto en REPL puede congelar el terminal (https://github.com/nodejs/node/issues/690)
* No es posible compilar io.js como una librería estática (https://github.com/nodejs/node/issues/686)

### Commits

* [[`df48faf`](https://github.com/nodejs/node/commit/df48fafa92c4ff0caee54c2f7fa214073cbd787e)] - tools: añadir herramienta de lanzamiento y documentos, remover herramientas viejas (Rod Vagg)
* [[`14684d3`](https://github.com/nodejs/node/commit/14684d3d67ad7c04bec7b63377343dab3e389470)] - v8abbr: ASCIISTRINGTAG =&gt; ONEBYTESTRINGTAG (Fedor Indutny)
* [[`6a5d731`](https://github.com/nodejs/node/commit/6a5d731f602b547074f4367a7eb3964395080c94)] - gyp: habilitar el soporte para postmortem, corregir rutas de dtrace (Fedor Indutny)
* [[`8b88ff8`](https://github.com/nodejs/node/commit/8b88ff85f106eed03bf677b9ab3b842f4edbdc6b)] - deps: arreglar el soporte para postmortem en v8 (Fedor Indutny)
* [[`d0b0bb4`](https://github.com/nodejs/node/commit/d0b0bb4ae00f596042bebe1ae61ae685bfbebf7d)] - dtrace: corregir la remoción de sondas no utilizadas (Glen Keane)
* [[`3e67d7e`](https://github.com/nodejs/node/commit/3e67d7e46b80c90faa360d1d0e44dacc444e8e4f)] - http: reemplazar util._extend() con [].slice() (Jonathan Ong)
* [[`89dd8e0`](https://github.com/nodejs/node/commit/89dd8e062f462106a6f7d3e92e9d18906445f851)] - benchmark: limpiar common.js (Brendan Ashworth)
* [[`6561274`](https://github.com/nodejs/node/commit/6561274d2377d9fd9c55fa3ce2eb2e53c14d898e)] - crypto: soportar contraseñas en publicEncrypt (Calvin Metcalf)
* [[`e9eb2ec`](https://github.com/nodejs/node/commit/e9eb2ec1c491e82dda27fe07d0eaf14ff569351b)] - process: corregir regresión en señales de des-escucha (Sam Roberts)
* [[`233e333`](https://github.com/nodejs/node/commit/233e333b183edeea6b740911061c7dc526078260)] - events: remover la indeterminación de la ordenación de eventos (Sam Roberts)
* [[`d75fecf`](https://github.com/nodejs/node/commit/d75fecf6fd7a1ef9d3d84a70ab832e7c062f5880)] - src: remover sondas de dtrace no utilizadas (Glen Keane)
* [[`8c0742f`](https://github.com/nodejs/node/commit/8c0742f43759d35da99f2475f81a026c2818c66a)] - net: revisar que la callback de cierre sea una función (Yosuke Furukawa)
* [[`207e48c`](https://github.com/nodejs/node/commit/207e48c93459da5e47f2efd408cfad6328bb0e25)] - dgram: revisar que la callback de cierre sea una función (Yosuke Furukawa)
* [[`6ac8bdc`](https://github.com/nodejs/node/commit/6ac8bdc0aba5f60f4b4f2da5abd36d664062aa40)] - lib: reducir el uso de util.is*() (cjihrig)
* [[`bce7a26`](https://github.com/nodejs/node/commit/bce7a2608eb198eee6ecd7991062efd6daeeb440)] - deps: hacer que node-gyp funcione otra vez en windows (Bert Belder)
* [[`1bdd74d`](https://github.com/nodejs/node/commit/1bdd74d20a3c979d51929a1039824d90abca2cdb)] - deps: hacer que node-gyp obtenga tarballs de iojs.org (Ben Noordhuis)
* [[`faf34ff`](https://github.com/nodejs/node/commit/faf34ffbd321f4657bd99fb82931e1c9a4dda6af)] - deps: actualizar npm a 2.4.1 (Forrest L Norvell)
* [[`40e29dc`](https://github.com/nodejs/node/commit/40e29dcbbf33d919f5cc0cbab5fa65a282adb04b)] - assert: utilizar util.inspect() para crear mensajes de error (cjihrig)
* [[`bc2c85c`](https://github.com/nodejs/node/commit/bc2c85ceef7ac034830e4a4357d0aef69cd6e386)] - fs: mejorar mensajes de error (Bert Belder)
* [[`0767c2f`](https://github.com/nodejs/node/commit/0767c2feb1cb6921acd18be3392d331e093b2b4c)] - lib: arreglar la revisión de tamaño máximo en el constructor de Búfer (Ben Noordhuis)
* [[`65b1e4f`](https://github.com/nodejs/node/commit/65b1e4f56f1f49dccd19b65dee2856df05b06c89)] - dgram: los enlazados implícitos deben ser exclusivos (Sam Roberts)
* [[`083c421`](https://github.com/nodejs/node/commit/083c421b5ca08576897b5da396085a462010780e)] - benchmark: remover el espaciado adicional en las opciones de http (Brendan Ashworth)
* [[`e17e6fb`](https://github.com/nodejs/node/commit/e17e6fb2faa04193eddf8062fbd49f1612b4dbff)] - util: utilizar el búfer on-stack para Utf8Value (Fedor Indutny)
* [[`3d4e96f`](https://github.com/nodejs/node/commit/3d4e96f3ceea1d30b4affb66133016a3c2811005)] - crypto: utilizar el almacenamiento on-stack en HashUpdate (Fedor Indutny)
* [[`aca2011`](https://github.com/nodejs/node/commit/aca20112519decef44474a2ee9936049e2a38b67)] - string_bytes: introducir InlineDecoder (Fedor Indutny)
* [[`c6367e7`](https://github.com/nodejs/node/commit/c6367e7f2a68b2418a98dfe9e829f17f62ba403a)] - node: acelerar ParseEncoding (Fedor Indutny)
* [[`7604e6d`](https://github.com/nodejs/node/commit/7604e6decc441a1110567e98f20f7ee122179d54)] - docs: añadir nota sobre el relleno por defecto al documento de crypto (Calvin Metcalf)
* [[`cf3e908`](https://github.com/nodejs/node/commit/cf3e908b70dfb345711cbca6c8e5373d085b05ea)] - http: errores de setHeader más descriptivos (Qasim Zaidi)
* [[`cbc1262`](https://github.com/nodejs/node/commit/cbc1262bd952a6c52937abe47a0af625965fba65)] - deps: actualizar v8 a 4.1.0.14 (Ben Noordhuis)
* [[`00f822f`](https://github.com/nodejs/node/commit/00f822f276c08465db3f6c70f154e9f28cc372d6)] - doc: añadir a micnic como colaborador (Micleusanu Nicu)
* [[`514b1d9`](https://github.com/nodejs/node/commit/514b1d964b2e67d0594c6a44a22fbc29fe71454b)] - doc: añadir más información a benchmark/README.md (Fishrock123)
* [[`097fde7`](https://github.com/nodejs/node/commit/097fde7129a3acc660beb372cecd9daf1164a7f2)] - deps: actualizar libuv a 1.3.0 (Saúl Ibarra Corretgé)
* [[`6ad236c`](https://github.com/nodejs/node/commit/6ad236c9b6a344a88ec2f1f173d5f920984b77b7)] - build: configurar el formato, añadir mensaje final (Roman Reiss)
* [[`dd47a8c`](https://github.com/nodejs/node/commit/dd47a8c78547db14ea0c7fc2f3375e8c9cb1a129)] - src: establecer disposiciones de señal predeterminadas en el inicio (Ben Noordhuis)
* [[`63ae1d2`](https://github.com/nodejs/node/commit/63ae1d203aba94b9a35400acdf00ff968fb6eb05)] - src: volver a trabajar el manejo de la señal temprana del depurador (Ben Noordhuis)
* [[`5756f92`](https://github.com/nodejs/node/commit/5756f92f464fd0f2d04dd05bc30b350010885f74)] - src: realizar más pronto la inicialización de plataforma específica (Ben Noordhuis)
* [[`24bd4e0`](https://github.com/nodejs/node/commit/24bd4e055562d8eb8a0d8db907c1715cc37e90b4)] - test: añadir prueba de regresión de cabecera en actualización de http (Ben Noordhuis)
* [[`6605096`](https://github.com/nodejs/node/commit/660509694cfd4de59df0548eabbe18c97d75c63a)] - deps: devolver http_parser a la versión 2.3.0 (Ben Noordhuis)
* [[`90ddb46`](https://github.com/nodejs/node/commit/90ddb46d522c37d2bc2eb68a6e0c9d52f9fbba42)] - crypto: eliminar el uso de this._readableState (Calvin Metcalf)
* [[`45d8d9f`](https://github.com/nodejs/node/commit/45d8d9f8262983d7d6434f4500b4e88b63052cd5)] - buffer: implementar interfaz `iterable` (Vladimir Kurchatkin)
* [[`3cbb5cd`](https://github.com/nodejs/node/commit/3cbb5cdfdb621baec5dc3a2ac505be37f1718086)] - console: permitir los campos de Object.prototype como etiquetas (cjihrig)
* [[`87e62bd`](https://github.com/nodejs/node/commit/87e62bd4c87e8674e3d1c432506e9b4991784ee2)] - crypto: implementar privateEncrypt/publicDecrypt (Fedor Indutny)
* [[`b50fea4`](https://github.com/nodejs/node/commit/b50fea4d490278b291321e6b96c49cf20bee1552)] - watchdog: corregir la finalización del tiempo de espera para el retorno temprano del poll (Saúl Ibarra Corretgé)
* [[`b5166cb`](https://github.com/nodejs/node/commit/b5166cb7d269cd1bf90d1768f82767b05b9ac1f8)] - benchmark: añadir bench-(url & events) crear objetivos (Yosuke Furukawa)
* [[`5843ae8`](https://github.com/nodejs/node/commit/5843ae8dfba5db83f2c04ed2db847049cbd2ab0d)] - Revertir "doc: clarificar los parámetros de fs.symlink y fs.symlinkSync" (Bert Belder)
* [[`668bde8`](https://github.com/nodejs/node/commit/668bde8ac0d16382cbc98c904d8b5f55fd9fd9f0)] - win,msi: transmitir WM_SETTINGCHANGE tras la instalación (Mathias Küsel)
* [[`69ce064`](https://github.com/nodejs/node/commit/69ce0641dc6a84c90ffdd0906790cd945f1c3629)] - build: remover artefactos en distclean (Johan Bergström)
* [[`1953886`](https://github.com/nodejs/node/commit/1953886126a2ab3e7291a73767ee4302a391a208)] - test: fuga del descriptor de archivos de fs.createReadStream().destroy() (Rod Vagg)
* [[`497fd72`](https://github.com/nodejs/node/commit/497fd72e21d2d1216e8457928d1a8082349fd0e5)] - fs: corregir fuga del descriptor de archivos en ReadStream.destroy() (Alex Kocharin)
* [[`8b09ae7`](https://github.com/nodejs/node/commit/8b09ae76f1d854a0db579fc0737df4809ce6087d)] - doc: añadir enlaces para las mejoras de http_parser/libuv (Michael Hart)
* [[`683e096`](https://github.com/nodejs/node/commit/683e09603e3418ed13333bac05876cb7d52453f5)] - src: remover datos excesivos sobre licencia (Aleksey Smolenchuk)
* [[`5c7ab96`](https://github.com/nodejs/node/commit/5c7ab96b90d1ab35e03e32a249d50e7651dee6ef)] - doc: corregir el comportamiento del enlazado de net.Server.listen (Andres Suarez)
* [[`84b05d4`](https://github.com/nodejs/node/commit/84b05d48d943e5b5e88485be129755277bedd1cb)] - doc: actualizar la codificación por defecto de los streams escribibles (Johnny Ray Austin)
* [[`1855267`](https://github.com/nodejs/node/commit/18552677d7e4468b093f28e721d1c02ce001b558)] - doc: corregir error gramatical menor en los documentos de streams (ttrfwork)
* [[`4f68369`](https://github.com/nodejs/node/commit/4f68369643cbbbcc6b12028091bb8064e89ce02d)] - build: deshabilitar los snapshots de v8 (Ben Noordhuis)
* [[`c0a9d1b`](https://github.com/nodejs/node/commit/c0a9d1bc74e1aa5ed1f5a934509c1984142e0eab)] - versions: añadir nivel de parche de http-parser (Johan Bergström)
* [[`7854811`](https://github.com/nodejs/node/commit/785481149d59fddead9007d469e2578204f24cfb)] - child_process: clonar el argumento de generación de opciones (cjihrig)
* [[`88aaff9`](https://github.com/nodejs/node/commit/88aaff9aa6dd2aa2baadaf9b8d5f08e89fb77402)] - deps: actualizar http_parser a 2.4.2 (Fedor Indutny)
* [[`804ab7e`](https://github.com/nodejs/node/commit/804ab7ebaaf5d87499e3cbce03184f064264dd2a)] - doc: añadir a seishun como colaborador (Nikolai Vavilov)
* [[`301a968`](https://github.com/nodejs/node/commit/301a968a40152c1ad3562482b4044458a13ebc4f)] - child_process: remover condición redundante (Vladimir Kurchatkin)
* [[`06cfff9`](https://github.com/nodejs/node/commit/06cfff935012ed2826cac56284cea982630cbc27)] - http: no molestarse haciendo una copia de las opciones (Jonathan Ong)
* [[`55c222c`](https://github.com/nodejs/node/commit/55c222ceba8e2b22fb5639082906faace520ec4e)] - doc: añadir a vkurchatkin como colaborador (Vladimir Kurchatkin)
* [[`50ac4b7`](https://github.com/nodejs/node/commit/50ac4b7e2a823f92f0e102b804ec73f00eacb216)] - Trabajando en la 1.0.5 (Rod Vagg)
* [[`d1fc9c6`](https://github.com/nodejs/node/commit/d1fc9c6caec68883401fe601d99f3a69fee52556)] - 2015-01-24 Versión de io.js 1.0.4 (Rod Vagg)

<a id="1.0.4"></a>

## 2015-01-24, Versión 1.0.4, @rvagg

### Cambios notables

* La actualización de npm a 2.3.0 corrige los errores "uid is undefined" (la uid está sin definir) de Windows
* Ahora crypto.pseudoRandomBytes() es un alias para crypto.randomBytes() y se bloqueará si no hay suficiente entropía para producir valores seguros. Consulte https://github.com/nodejs/node/commit/e5e5980 para ver detalles.
* Parche para V8, para que detecte a ARMv6 correctamente; los binarios vuelven a funcionar en ARMv6 (Raspberry Pi, etc.)
* Mejora menor de V8 de 4.1.0.7 a 4.1.0.12
* El módulo del núcleo 'punycode' ha sido llevado del nivel de estabilidad 2-Inestable a 3-Estable
* Se añadieron nuevos colaboradores:
  - Thorsten Lorenz (@thlorenz)
  - Stephen Belanger (@qard)
  - Jeremiah Senkpiel (@fishrock123)
  - Evan Lucas (@evanlucas)
  - Brendan Ashworth (@brendanashworth)

### Commits

* [[`bb766d2`](https://github.com/nodejs/node/commit/bb766d2c47e8a416ce9f1e4f693f124afe857c1a)] - doc: actualizar la sección "net" en node de acuerdo a los cambios de io.js (Andres Suarez)
* [[`73ddaa6`](https://github.com/nodejs/node/commit/73ddaa629c145af1632ac67d5d7d3a2abeabdf24)] - tools: remover el viejo script de updateAuthors.awk (Rod Vagg)
* [[`6230bf9`](https://github.com/nodejs/node/commit/6230bf9b79a6c451d678693004d52249fe9c1702)] - doc: actualizar la lista AUTHORS (Rod Vagg)
* [[`33186fa`](https://github.com/nodejs/node/commit/33186fa7d89aef988e5cf24801de891d325afd7d)] - doc: añadir a brendanashworth como colaborador (Brendan Ashworth)
* [[`8f9502a`](https://github.com/nodejs/node/commit/8f9502a20a8851cfbf5f6181a52813baec23fe0f)] - doc: añadir a evanlucas a los colaboradores (Evan Lucas)
* [[`35a4f11`](https://github.com/nodejs/node/commit/35a4f1107eeab39f9cd0e5b9abe6a314e1f6ddd7)] - doc: alfabetizar all.markdown (Brendan Ashworth)
* [[`a0831c5`](https://github.com/nodejs/node/commit/a0831c580d50b54fd4add58071341b3b7ec83499)] - doc: añadir a Fishrock123 a los colaboradores (Fishrock123)
* [[`5412487`](https://github.com/nodejs/node/commit/54124874dcc7eee1e8909cf2056c7f69722be4aa)] - doc: añadir a qard a los colaboradores (Stephen Belanger)
* [[`8b55048`](https://github.com/nodejs/node/commit/8b55048d670d22d4e6d93710fe039d576a2b71bc)] - deps: hacer que node-gyp funcione otra vez en windows (Bert Belder)
* [[`82227f3`](https://github.com/nodejs/node/commit/82227f35110dcefa5a02e068a78dc3eb4aa0d3bc)] - deps: hacer que node-gyp obtenga tarballs de iojs.org (Ben Noordhuis)
* [[`f5b35db`](https://github.com/nodejs/node/commit/f5b35dbda45c466eda888a4451591c66e8671faf)] - deps: actualizar npm a 2.3.0 (Forrest L Norvell)
* [[`f3fed51`](https://github.com/nodejs/node/commit/f3fed5193caaac151acd555a7523068ee269801c)] - doc: adición de thlorenz a la lista de colaboradores (Thorsten Lorenz)
* [[`8de89ec`](https://github.com/nodejs/node/commit/8de89ec465d8f1e31521e0b888c19b0a3309cd88)] - lib: mover la lógica de direcciones por defecto a `net._listen2` (Vladimir Kurchatkin)
* [[`3143d73`](https://github.com/nodejs/node/commit/3143d732f6efd82da76e9c53ad192ac14071bf70)] - test: eliminar parallel/test-process-active-wraps (Ben Noordhuis)
* [[`4f95b5d`](https://github.com/nodejs/node/commit/4f95b5d8253ef64e3673b9fa178c41dc8109b72b)] - test: corregir parallel/test-http-destroyed-socket-write2 (Ben Noordhuis)
* [[`5ba307a`](https://github.com/nodejs/node/commit/5ba307a97879342ff81aa813ffd7da46b6411b1c)] - test: corregir parallel/test-dgram-error-message-address (Ben Noordhuis)
* [[`f4c536b`](https://github.com/nodejs/node/commit/f4c536b749735a0240da08386d6784767f95cb5d)] - debugger: no anular el enlazado de módulos (Vladimir Kurchatkin)
* [[`40ffed8`](https://github.com/nodejs/node/commit/40ffed8f3f4392d6e110769ca06d86d6295fc645)] - stream: utilizar nop como callback de write() si se ha omitido (cjihrig)
* [[`df0d790`](https://github.com/nodejs/node/commit/df0d790107edf635dc233f3338b3c2e68db58cc7)] - doc: dns.lookupService tiene un nivel de encabezado erróneo (Icer Liang)
* [[`8b1db9c`](https://github.com/nodejs/node/commit/8b1db9c0a7dc39261218a0fac2dd6cf4fbb6a7b4)] - doc: nota en los documentos sobre las interfaces faltantes (Todd Kennedy)
* [[`2928ac6`](https://github.com/nodejs/node/commit/2928ac68e524bb5cacd522507bac0a147d01cd75)] - doc: llevar la estabilidad de la api de punycode a "estable" (Ben Noordhuis)
* [[`328e67b`](https://github.com/nodejs/node/commit/328e67b58bc6dbcbed8ec452e6903ea6f121dc59)] - doc: añadir minutas de la reunión del TC del 2015-01-21 (Rod Vagg)
* [[`e5e5980`](https://github.com/nodejs/node/commit/e5e598060eb43faf2142184d523a04f0ca2d95c3)] - lib,src: hacer que pseudoRandomBytes sea un alias de randomBytes (Calvin Metcalf)
* [[`c6cd460`](https://github.com/nodejs/node/commit/c6cd46041c70794d89634da380555fb613c2e0ab)] - configure: remover variable de arm_neon no utilizada (Ben Noordhuis)
* [[`7d9d756`](https://github.com/nodejs/node/commit/7d9d7560cfbd24172ede690e74cedbb4b26e32c9)] - configure: deshabilitar vfpv3 en armv6 (Ben Noordhuis)
* [[`297cadb`](https://github.com/nodejs/node/commit/297cadbab6a37fa4f14811452e4621770a321371)] - deps: arreglar la detección en tiempo de ejecución de armv6 de v8 (Ben Noordhuis)
* [[`d481bb6`](https://github.com/nodejs/node/commit/d481bb68c4f2cf01ec7d26dcc91862b265b7effa)] - doc: documentos de crypto.pseudoRandomBytes más explícitos (Calvin Metcalf)
* [[`7d46247`](https://github.com/nodejs/node/commit/7d462479f6aad374fab90dd10bb07a8097f750aa)] - src: mensaje de s/node/io.js/ en `--help de iojs` (Ben Noordhuis)
* [[`069c0df`](https://github.com/nodejs/node/commit/069c0dfb1cbfeb7c9c66a30f1fb5f065a9e22ee6)] - deps: actualizar v8 a 4.1.0.12 (Ben Noordhuis)
* [[`ada2a43`](https://github.com/nodejs/node/commit/ada2a4308c5a70728d01ea7447c0a7a153a9b703)] - doc: añadir las minutas de la reunión del TC del 2015-01-13 (Rod Vagg)
* [[`60402b9`](https://github.com/nodejs/node/commit/60402b924b4b38196a658a023fad945421710457)] - docs: remover entrada incorrecta de registro de cambios (Bert Belder)
* [[`8b98096`](https://github.com/nodejs/node/commit/8b98096c921f8a210b05aed64e0b2f1440667a7c)] - fs: hacer que las banderas de fs.access() sean de solo lectura (Jackson Tian)
* [[`804e7aa`](https://github.com/nodejs/node/commit/804e7aa9ab0b34fa88709ef0980b960abca5e059)] - lib: utilizar const para definir constantes (cjihrig)
* [[`803883b`](https://github.com/nodejs/node/commit/803883bb1a701da12c285fd735233eed7627eada)] - v8: corregir deref de puntero NULL de literal modelo (Ben Noordhuis)
* [[`5435cf2`](https://github.com/nodejs/node/commit/5435cf2f1619721745c7a8ac06b4f833d0b80d25)] - v8: optimizar `getHeapStatistics` (Vladimir Kurchatkin)
* [[`5d01463`](https://github.com/nodejs/node/commit/5d014637b618af7eac6ab0fce8d67884598c7b35)] - benchmark: imprimir cuenta a cinco lugares decimales (Yosuke Furukawa)
* [[`752585d`](https://github.com/nodejs/node/commit/752585db6355ead7e6484f321e053b8d543c0a67)] - src: silenciar las advertencias de clang (Trevor Norris)
* [[`22e1aea`](https://github.com/nodejs/node/commit/22e1aea8a025b6439493dec4d44afe4c9f454c86)] - src: establecer node_is_initialized en node::Init (Cheng Zhao)
* [[`668420d`](https://github.com/nodejs/node/commit/668420d1f7685f49843bbf81ee3b4733a1989852)] - src: limpiar macros no utilizados en node_file.cc (Ben Noordhuis)
* [[`52f624e`](https://github.com/nodejs/node/commit/52f624e72a419d3fd7f7f8ccc2d22ebdb0ba4fff)] - src: renombrar macros de ASSERT en node_crypto.cc (Ben Noordhuis)
* [[`e95cfe1`](https://github.com/nodejs/node/commit/e95cfe14e343c5abed96a8d3cb9397c0c84abecc)] - src: añadir macros de estilo de ASSERT_EQ (Ben Noordhuis)
* [[`ee9cd00`](https://github.com/nodejs/node/commit/ee9cd004d8a211871439fc77c0696b79c5d0e52d)] - lib: corregir TypeError con abuso de EventEmitter#on() (Ben Noordhuis)
* [[`77d6807`](https://github.com/nodejs/node/commit/77d68070dafe56b5593ad92759a57c64de6b4cf1)] - test: corregir el estilo de event-emitter-get-max-listeners (Ben Noordhuis)
* [[`767ee73`](https://github.com/nodejs/node/commit/767ee7348624803e6f90cf111df8b917fac442fc)] - test: reducir los datos sobre derecho de autor (Ben Noordhuis)
* [[`86eda17`](https://github.com/nodejs/node/commit/86eda173b16b6ece9712e066661a0ac5db6795e8)] - fs: definir constantes con const (cjihrig)

<a id="1.0.3"></a>

## 2015-01-20, Versión 1.0.3, @rvagg

### Cambios notables

* Actualización de V8 de 3.31 a 4.1, esto no es una actualización mayor, el número de versión "4.1" significa el seguimiento hacia Chrome 41. La rama 3.31 no se está dirigiendo ahora hacia una versión estable.
* Volver a habilitar el soporte para Windows XP / 2003
* Actualización de npm a 2.2.0
* Soporte para FreeBSD mejorado

### Problemas conocidos

* Aún no funcionan las compilaciones de ARMv6, hay un retraso en V8 en este asunto, incidente #283
* Las strings modelo pueden utilizar segfaults en V8 4.1, https://codereview.chromium.org/857433004, asimismo incidente #333

### Commits

* [[`9419e1f`](https://github.com/nodejs/node/commit/9419e1fb698e1a9319fec5c4777686d62fad4a51)] - src: corregir inconsistencia entre una revisión y un error (toastynerd)
* [[`03ee4d8`](https://github.com/nodejs/node/commit/03ee4d854744e83f99bc5857b98f75139c448564)] - fs: añadir código de error ante rutas de bytes nulos (cjihrig)
* [[`e2558f0`](https://github.com/nodejs/node/commit/e2558f02dfb671fc74f5768d4401a826efb5c117)] - net: corregir detalles de errores en connect() (cjihrig)
* [[`4af5746`](https://github.com/nodejs/node/commit/4af5746993a6b91c88973b6debcee19c6cd35185)] - win,build: eliminar definición duplicada (Bert Belder)
* [[`e8d0850`](https://github.com/nodejs/node/commit/e8d08503c7821e8c92e9fa236ed7328e9bdfe62a)] - win: traer de vuelta el soporte para xp/2k3 (Bert Belder)
* [[`4dd22b9`](https://github.com/nodejs/node/commit/4dd22b946ebfec81a7c4a61aa9c6ed528e317802)] - cluster: evitar que la carrera active el depurador en worker (Timothy J Fontaine)
* [[`6b91c78`](https://github.com/nodejs/node/commit/6b91c78e201948937a4524027a6778aa7f82fb0a)] - test: volver a aterrizar cambios de [`11c1bae`](https://github.com/nodejs/node/commit/11c1bae734dae3a017f2c4f3f71b5e679a9ddfa6) (Ben Noordhuis)
* [[`992a1e7`](https://github.com/nodejs/node/commit/992a1e7f5f87606276af8504c2d57cc5a966830a)] - test: debug-signal-cluster no debería actuar con condición de carrera (Timothy J Fontaine)
* [[`cdf0df1`](https://github.com/nodejs/node/commit/cdf0df13d85391b3b8ac36fa5b70da7f21072619)] - test: respaldar temporalmente los cambios desde [`11c1bae`](https://github.com/nodejs/node/commit/11c1bae734dae3a017f2c4f3f71b5e679a9ddfa6) (Ben Noordhuis)
* [[`1ea607c`](https://github.com/nodejs/node/commit/1ea607cb299b0bb59d7d557e01b21b3c615d689e)] - test: mover sequential/test-debug-port-from-cmdline (Ben Noordhuis)
* [[`2f33e00`](https://github.com/nodejs/node/commit/2f33e00d716d692e84b02768430664fd92298c98)] - test: corregir test-debug-port-from-cmdline.js (Julien Gilli)
* [[`b7365c1`](https://github.com/nodejs/node/commit/b7365c15597253e906590045aa6f3f07f6e76b52)] - repl: hacer que REPL soporte literales modelo multilíneas (Xiaowei Li)
* [[`2253d30`](https://github.com/nodejs/node/commit/2253d30d9cbba42abc1faa183e4480cac69c4222)] - build: remover variable no utilizada (Johan Bergström)
* [[`ab04a43`](https://github.com/nodejs/node/commit/ab04a434761cf66d107481d58798f36d3cb49d46)] - doc: añadir a README sudo opcional para realizar instalación (Glen Keane)
* [[`1b1cd1c`](https://github.com/nodejs/node/commit/1b1cd1c3f8e21b34a8e1355e545057a661acaa15)] - build: acortar la impresión del script de configuración en stdout (Roman Reiss)
* [[`d566ded`](https://github.com/nodejs/node/commit/d566ded26b996c27afeb7fc208709bb6096bfa13)] - deps: corregir bugs del depurador de V8 (Jay Jaeho Lee)
* [[`6f36630`](https://github.com/nodejs/node/commit/6f36630f55efcbe5954a52ac22bbb0a378020e98)] - doc: corregir ejemplos util.isBuffer (Thomas Jensen)
* [[`3abfb56`](https://github.com/nodejs/node/commit/3abfb56f9b012da0d1e1deaec1529ea7384a0a71)] - benchmark: corregir prueba de rendimiento de tcp luego del cambio de api interna (Yosuke Furukawa)
* [[`50177fb`](https://github.com/nodejs/node/commit/50177fb13cae68067845cca7622798eb7a34f8e9)] - benchmark: detener el trato deficiente de la prueba de rendimiento de v8 a RegExp (Ben Noordhuis)
* [[`1952219`](https://github.com/nodejs/node/commit/19522197ef28275344ad2f1e0799ce8106276ec1)] - deps: hacer que node-gyp funcione otra vez en windows (Bert Belder)
* [[`a28de9b`](https://github.com/nodejs/node/commit/a28de9bd3684f54379ccf101f62656771002205d)] - deps: hacer que node-gyp obtenga tarballs de iojs.org (Ben Noordhuis)
* [[`9dc8f59`](https://github.com/nodejs/node/commit/9dc8f59fea5a294df039f70e523be2d45aef1324)] - deps: actualizar npm a 2.2.0 (Forrest L Norvell)
* [[`e8ad773`](https://github.com/nodejs/node/commit/e8ad773b56a94fad2cd8a454453a7214a8ce92d1)] - src: volver a eliminar las --noharmony_classes (Ben Noordhuis)
* [[`334020e`](https://github.com/nodejs/node/commit/334020e016a72952a9a3b3f7e9179145c7e167ad)] - deps: corregir la compilación de v8 en FreeBSD (Fedor Indutny)
* [[`5e7ebc7`](https://github.com/nodejs/node/commit/5e7ebc7af6d08d4e31cf66f4ae22d29c688ef814)] - deps: actualizar v8 a 4.1.0.7 (Ben Noordhuis)
* [[`ea7750b`](https://github.com/nodejs/node/commit/ea7750bddd8051f39fa538905e05f9bf1d1afa5f)] - benchmark: añadir opción de filtro para prueba de rendimiento (Yosuke Furukawa)
* [[`4764eef`](https://github.com/nodejs/node/commit/4764eef9b2efdf17cafeb4ec40898c6669a84e3b)] - doc: fue corregido el uso de signos de puntuación (Brenard Cubacub)
* [[`de224d6`](https://github.com/nodejs/node/commit/de224d6e6c9381e71ffee965dbda928802cc438e)] - configure: remover --ninja switch (Ben Noordhuis)
* [[`48774ec`](https://github.com/nodejs/node/commit/48774ec027a28cca17656659d316bb7ed8d6f33c)] - configure: imprimir advertencia para compiladores viejos (Ben Noordhuis)
* [[`daf9562`](https://github.com/nodejs/node/commit/daf9562d918b7926186471cd0db60cec2f72547a)] - doc: cambiar a iojs desde node en el mensaje de uso (Jongyeol Choi)
* [[`3fde649`](https://github.com/nodejs/node/commit/3fde64937a3a0c8ed941ee97b07e1828b392a672)] - build: añadir herramientas/gflags a PYTHONPATH (Shigeki Ohtsu)
* [[`8b22df1`](https://github.com/nodejs/node/commit/8b22df15ae0e3499b2e057ffd8a6f65cbf978da3)] - doc: añadir bloqueo de LICENSE de python-gflags (Shigeki Ohtsu)
* [[`6242229`](https://github.com/nodejs/node/commit/62422297f52523d2214136cd5514e2453197e3e8)] - tools: añadir módulo de python-gflags (Shigeki Ohtsu)

<a id="1.0.2"></a>

## 2015-01-16, Versión 1.0.2, @rvagg

### Cambios notables

* Correcciones del instalador de Windows
* Correcciones empaquetadas de node-gyp para Windows
* [Actualización de http_parser v2.4.1](https://github.com/joyent/http-parser/compare/v2.3...v2.4.1)
* [Actualización de libuv v1.2.1](https://github.com/libuv/libuv/compare/v1.2.0...v1.2.1)

### Commits

* [[`265cb76`](https://github.com/nodejs/node/commit/265cb76517d81408afb72506c778f0c0b889f4dc)] - build: añadir nueva configuración del instalador para OS X (Rod Vagg)
* [[`8cf6079`](https://github.com/nodejs/node/commit/8cf6079a6a7f5d1afb06606b7c51acf9b1a046a0)] - doc: actualizar la lista AUTHORS (Rod Vagg)
* [[`c80a944`](https://github.com/nodejs/node/commit/c80a9449b309f9c52a5910b7ac6ba0c84ee1b6f6)] - doc: Añadir comportamiento keepalive de http a CHANGELOG.md (Isaac Z. Schlueter)
* [[`9b81c3e`](https://github.com/nodejs/node/commit/9b81c3e77ffd733645956129a38fdc2fddd08b50)] - doc: corregir atribución del autor (Tom Hughes)
* [[`fd30eb2`](https://github.com/nodejs/node/commit/fd30eb21526bdaa5aabb15523b0a766e0cbbe535)] - src: corregir errores de jslint (Yosuke Furukawa)
* [[`946eabd`](https://github.com/nodejs/node/commit/946eabd18f623b438e17164b14c98066f7054168)] - tools: actualizar el linter de cierre a 2.3.17 (Yosuke Furukawa)
* [[`9e62ae4`](https://github.com/nodejs/node/commit/9e62ae4304a0bee3aec8c5fb743eb17d78b1cd35)] - _debug_agent: utilizar la opción `readableObjectMode` (Vladimir Kurchatkin)
* [[`eec4c81`](https://github.com/nodejs/node/commit/eec4c8168be1f0a01db3576ae99f7756eea01151)] - doc: corregir formato en LICENSE para la generación de RTF (Rod Vagg)
* [[`e789103`](https://github.com/nodejs/node/commit/e7891034c269dccf8d6264acc4b7421e19a905f6)] - doc: corregir 404s para que la sintaxis resalte js (Phil Hughes)
* [[`ca039b4`](https://github.com/nodejs/node/commit/ca039b4616915b95130ba5ee5a2cf9f5c768645e)] - src: definir AI_V4MAPPED para OpenBSD (Aaron Bieber)
* [[`753fcaa`](https://github.com/nodejs/node/commit/753fcaa27066b34a99ee1c02b43a32744fc92a3c)] - doc: extender ejemplo de http.request con evento de finalización (Michal Tehnik)
* [[`8440cac`](https://github.com/nodejs/node/commit/8440cacb100ae83c2b2c02e82a87c73a66380c21)] - src: corregir url de documentación en mensaje de ayuda (Shigeki Ohtsu)
* [[`24def66`](https://github.com/nodejs/node/commit/24def662936ae8c15770ede0344cd7a7402a63ef)] - win,msi: advertir que el viejo io.js necesita una desinstalación manual (Bert Belder)
* [[`59d9361`](https://github.com/nodejs/node/commit/59d93613d8e1e8507b5c8462c52dd3cbda98e99b)] - win,msi: cambiar UpgradeCode (Bert Belder)
* [[`5de334c`](https://github.com/nodejs/node/commit/5de334c23096492014a097ff487f07ad8eaee6d2)] - deps: hacer que node-gyp funcione otra vez en windows (Bert Belder)
* [[`07bd05b`](https://github.com/nodejs/node/commit/07bd05ba332e078c1ba76635921f5448a3e884cf)] - deps: actualizar libuv a 1.2.1 (Saúl Ibarra Corretgé)
* [[`e177377`](https://github.com/nodejs/node/commit/e177377a4bc0cdbaecb8b17a58e57c73b4ca0090)] - doc: mencionar io.js junto a Node en los documentos de Punycode (Mathias Bynens)
* [[`598efcb`](https://github.com/nodejs/node/commit/598efcbe7f4d795622f038e0ba28c7b119927a14)] - deps: actualizar http_parser a 2.4.1 (Fedor Indutny)
* [[`3dd7ebb`](https://github.com/nodejs/node/commit/3dd7ebb0ba181960fb6d7131e11243a6ec85458d)] - doc: actualizar entrada sobre el clúster en CHANGELOG (Ben Noordhuis)
* [[`0c5de1f`](https://github.com/nodejs/node/commit/0c5de1ff813de9661d33cb9aefc4a9540b58b147)] - doc: corregir ejemplo de smalloc doble (Mathias Buus)

<a id="1.0.1"></a>

## 2015-01-14, Versión 1.0.1, @rvagg

Re-compilar, debido a entradas de registro de git de worker de compilación estancadas para el lanzamiento de la versión 1.0.0

* doc: mejorar la consistencia del estilo de redacción (Rui Marinho)
* win,msi: corregir enlace al sitio web del documento (Bert Belder)

--------------------------------------

<a id="1.0.0"></a>
A continuación, se encuentra un registro de los cambios que han de encontrar (de manera percibible) los usuarios en la versión 1.0.0 de io.js, en contraste con la versión _estable_ de Node.js actual, v10.35. Al momento del lanzamiento de la v1.0.0, la última versión _inestable_ de Node.js es la v0.11.14, con un progreso significativo hecho en dirección al lanzamiento de una v.0.11.15. La base de código de io.js hereda la mayor parte de los cambios encontrados en la rama de la v0.11 del repositorio [joyent/note](https://github.com/joyent/node), y, por ende, puede ser vista como una extensión de esta.

## Resumen de los cambios desde la v0.10.35 de Node.js a la v1.0.0 de io.js

### General

- El motor de JavaScript de V8 empaquetado con io.js fue actualizado de manera dramática, desde la versión 3.14.5.9 en la versión 0.10.35 de Node.js y la versión 3.26.33 en la versión 0.11.14 de Node.js, hasta la versión 3.31.74.1 para la versión 1.0.0 de io.js. Esto trae consigo muchas correcciones y mejoras de rendimiento, ¡así como soporte adicional para nuevas funcionalidades referentes al lenguaje ES6! Para más información sobre esto, revise la [página de ES6 de io.js](https://iojs.org/es6.html).
- Otras tecnologías empaquetadas fueron actualizadas:
  - c-ares: 1.9.0-DEV a 1.10.0-DEV
  - http_parser: 1.0 a 2.3
  - libuv: 0.10.30 a 1.2.0
  - npm: 1.4.28 a 2.1.18
  - openssl: 1.0.1j a 1.0.1k
  - punycode: 1.2.0 a 1.3.2.
- Mejoras de rendimiento y estabilidad en todas las plataformas.

### buffer

https://iojs.org/api/buffer.html

- Fueron añadidos los métodos `buf.writeUIntLE`, `buf.writeUIntBE`, `buf.writeIntLE`, `buf.writeIntBE`, `buf.readUIntLE`, `buf.readUIntBE`, `buf.readIntLE` y `buf.readIntBE` que leen y escriben valores de hasta 6 bytes.
- Fue añadido `Buffer.compare()`, el cual realiza `memcmp()` sobre dos instancias de Búfer. Las instancias mismas también tienen una `compare()`.
- Se añadió `buffer.equals()`, la cual realiza chequeos de igualdad de Búferes a partir de sus contenidos.
- Se añadió un constructor de `new Buffer(otherBuffer)`.
- Semánticas de `SlowBuffer` mejoradas.
- Se actualizó el output de `buffer.toJSON()` para que no fuera igual que un array. En lugar de esto, es un objeto específicamente etiquetado como un búfer, el cual puede ser recuperado pasándolo (como una nueva sobrecarga) al constructor de `Buffer`.

### child_process

https://iojs.org/api/child_process.html

- Se añadió una opción `shell` a `child_process.exec`.
- Se añadieron contrapartes sincrónicas para las funciones de procesos secundarios: `child_process.spawnSync`, `child_process.execSync`, y `child_process.execFileSync`.
- Se añadió la ruta para errores `ENOENT` cualesquiera, para una depuración más sencilla.

### console

https://iojs.org/api/console.html

- Se añadió un parámetro `options` a `console.dir`.

### cluster

https://iojs.org/api/cluster.html

- Se actualizó `cluster` para que utilice de manera predeterminada un balance de carga estilo round-robin en todas las plataformas distintas a Windows. Sin embargo, la política de programación es configurable.
- Se ha hecho que `--debug` esté consciente del clúster.
- Muchas correcciones de bugs.

### crypto

https://iojs.org/api/crypto.html

- Se añadió soporte para el paso de valores de generador personalizados a `DiffieHellman` (estableciéndose por defecto en dos, para garantizar la compatibilidad con versiones anteriores).
- Se añadió soporte para los métodos de resumen pbkdf2 personalizados.
- Se añadió soporte para Diffie-Hellman con base de curva elíptica.
- Se añadió soporte para la carga y configuración del motor para algunas/todas las funciones de OpenSSL.
- Se añadió soporte para el pase de una contraseña para la desencriptación de la clave de firma a `Sign.sign()`.
- Se añadió soporte para la contraseña de clave privada en todos los métodos que las aceptan.
- Se añadió soporte para la funcionalidad de encriptación/desencriptación pública/privada de RSA.
- Se añadió soporte para el establecimiento y obtención de etiquetas de autenticación y el establecimiento de datos de autenticación adicionales al utilizar cifrados como AES-GCM.

### dgram

https://iojs.org/api/dgram.html

- Se añadió soporte para la recepción de paquetes UDP vacíos.

### dns

https://iojs.org/api/dns.html

- Se añadieron los métodos `dns.resolveSoa`, `dns.getServers`, y `dns.setServers`.
- `hostname` añadido a los mensajes de error, al estar disponible.
- Se mejoró la consistencia del manejo de errores.

### events

https://iojs.org/api/events.html

- Se añadió soporte de encadenado a `EventEmitter.setMaxListeners`.
- Se actualizó `require('events')` para que devuelva el constructor de `EventEmitter`, permitiendo que el módulo sea usado como `var EventEmitter = require('events')`, en lugar de `var EventEmitter = require('events').EventEmitter`.

### fs

https://iojs.org/api/fs.html

- Se añadió `fs.access`, y `fs.exists` desaprobada. Por favor lea cuidadosamente la documentación.
- Se añadieron errores más informativos y detalles del sitio de las llamadas de métodos cuando el ambiente `NODE_DEBUG` está establecido para aligerar la depuración.
- Se añadió una opción a `fs.watch` para el soporte de sub-directorios recursivos (solo para OS X).
- Se corrigió que los errores de callbacks perdidas solo fueran impresos, en lugar de arrojados.

### http

https://iojs.org/api/http.html

- Se añadió soporte para que `response.write` y `response.end` reciban una callback para ser informados sobre el momento en el que la operación finaliza.
- Se añadió soporte para el código de estado 308 (vea RFC 7238).
- Array `http.METHODS` añadido, en este se especifican los métodos HTTP soportados por el analizador.
- Se añadió el método `request.flush`.
- Se añadió el método `response.getHeader('header')`, que puede ser utilizado antes de que se vacíen las cabeceras.
- Se añadió la propiedad `response.statusMessage`.
- Se añadió el comportamiento Keep-Alive del Cliente.  Establecer `keepAlive:true` en las opciones de solicitud, para reutilizar indefinidamente las conexiones.
- Se añadieron los miembros `rawHeaders` y `rawTrailers` al mensaje entrante.
- Codificación fragmentada predeterminada removida de `DELETE` y `OPTIONS`.

### red

https://iojs.org/api/net.html

- Se cambió `net.Server.listen`, de modo tal que cuando la dirección enlazada es omitida se prueba primero con IPv6, y IPv4 se utiliza como una reserva.

### os

https://iojs.org/api/os.html

- Se añadieron direcciones MAC, netmasks e IDs de ámbito para direcciones IPv6 al output del método `os.networkInterfaces`.
- `os.tmpdir` fue actualizado en Windows para que utilice las variables de ambiente `%SystemRoot%` o `%WINDIR%`, en lugar del valor de código duro de `c:\windows`, al determinar la ubicación del directorio temporal.

### path

https://iojs.org/api/path.html

- Se añadieron los métodos `path.isAbsolute` y `path.parse`.
- Se añadieron objetos de `path.win32` y `path.posix` que contienen versiones de plataforma específica de las diversas funciones de `path`.
- Mejorar el rendimiento de `path.join`.

### process

https://iojs.org/api/process.html

- Se añadió el evento `beforeExit`.
- Se añadieron `process.mainModule` y `process.exitCode`.

### querystring

https://iojs.org/api/querystring.html

- Se añadió la habilidad de pasar versiones personalizadas de `encodeURIComponent` y `decodeURIComponent` al stringificar o analizar una string de consulta.
- Se corrigieron varios problemas con el formato de las strings de consulta en casos extremos.

### smalloc

https://iojs.org/api/smalloc.html

`smalloc` es un nuevo módulo principal para la asignación/desasignación/copia de la memoria en bruto (externa) en JavaScript.

### streams

https://iojs.org/api/stream.html

Los cambios en los streams no son tan drásticos como la transición de streams1 a streams2: son un refinamiento de ideas existentes, y deberían hacer que la API sea un poco menos sorprendente para los humanos y más rápida para las computadoras. Como conjunto, estos cambios son referidos como "streams3", pero deberían pasar, ampliamente, desapercibidos por la mayor parte de los consumidores e implementadores de streams.

#### Streams legibles

La distinción entre los modos "fluido" y "no-fluido" ha sido refinada. La entrada en el modo "fluido" ya no es una operación irreversible&mdash;es posible regresar al modo "no-fluido" desde el modo "fluido". Adicionalmente, los dos modos ahora fluyen a través de la misma maquinaria en lugar de reemplazar métodos. Cada vez que son devueltos datos como resultados de una llamada a `.read`, dichos datos *también*serán emitidos en el evento `"data"`.

Igual que antes, la adición de un listener para los eventos `"readable"` o `"data"` dará inicio al flujo del stream; del mismo modo, lo hará la conducción por pipes hacia otra string.

#### Streams escribibles

La habilidad para "escribir en masa" a recursos subyacentes ha sido añadida a los streams `Writable` (escribibles). Para los implementadores de streams, uno puede emitir una señal que indique que un stream es susceptible a la escritura en masa, a través de la especificación del método [_writev](https://iojs.org/api/stream.html#stream_writable_writev_chunks_callback). La escritura en masa se dará en dos situaciones:

1. Cuando un stream susceptible a la escritura en masa se encuentra limpiando su reserva de solicitudes de escritura almacenadas en búfer,
2. o si un usuario final ha hecho uso de los nuevos métodos de la API de `.cork()` y `.uncork()`.

`.cork` y `.uncork` permiten al usuario final controlar el comportamiento del almacenamiento en búfer de los streams escribibles independientemente de la contrapresión que esté siendo aplicada. `.cork` indica que el stream debería aceptar nuevas escrituras (hasta `highWaterMark`), mientras que `.uncork` restablece ese comportamiento e intenta escribir en masa a todas las escrituras transmitidas por búfer al recurso subyacente.

La única API de streams principal que **actualmente** implementa `_writev` es `net.Socket`.

En adición a los cambios de escritura en masa, el rendimiento de la pequeñas escrituras repetidas hacia streams no susceptibles a la escritura en masa (tales como `fs.WriteStream`) ha sido mejorada drásticamente. Los usuarios que transmitan mediante pipes streams de registros de gran volumen al disco deberían ver una mejora.

Para una descripción detallada de cómo los streams3 interactúan, [vea este diagrama](https://cloud.githubusercontent.com/assets/37303/5728694/f9a3e300-9b20-11e4-9e14-a6938b3327f0.png).

### timers

https://iojs.org/api/timers.html

- `process.maxTickDepth` fue removido, permitiendo que `process.nextTick` sea usado recursivamente sin ningún límite.
- Se actualizó `setImmediate` para procesar la cola completa en cada vuelta del bucle de eventos, en lugar de uno por cola.

### tls

https://iojs.org/api/tls.html

- Se añadió la bandera booleana `detailed` a `getPeerCertificate` para devolver información detallada del certificado (con bytes DER sin procesar).
- Se añadió el método `renegotiate(options, callback)` para la negociación de la sesión.
- Se añadió el método `setMaxSendFragment` para la variación del tamaño del fragmento de TLS.
- Se añadió una opción `dhparam` para los cifrados DH.
- Se añadió una opción `ticketKeys` para la configuración de las claves de encriptado del ticket de TLS.
- Se añadió callback OCSP-stapling asíncrona.
- Se añadieron eventos de almacenamiento de sesión asíncronos.
- Se añadió callback SNI asíncrona.
- Se añadió soporte para servidores multi-claves (por ejemplo, un servidor ECDSA+RSA).
- Se añadió una callback opcional a `checkServerIdentity` para la validación manual de certificados en el espacio de usuario.
- Se añadió soporte para el cifrado ECDSA/ECDHE.
- Se implementaron streams de TLS en C++, aumentando su rendimiento.
- `createCredentials` fue movida a `tls` y renombrada como `createSecureContext`.
- Se eliminó el soporte de SSLv2 y SSLv3.

### url

https://iojs.org/api/url.html

- Fue mejorado el escape de ciertos caracteres.
- Se mejoró la velocidad de análisis.

### util

https://iojs.org/api/util.html

- Se añadió `util.debuglog`.
- Se añadió una plétora de nuevos métodos de pruebas de tipo. Vea [los documentos](https://iojs.org/api/util.html).
- Se actualizó `util.format` para que recibiera varios cambios:
  - Ahora `-0` se muestra como tal, en lugar de como `0`.
  - Todo aquello que es un `instanceof Error` ahora tiene formato de error.
  - Ahora las referencias circulares en objetos de JavaScript son manejadas para el especificador `%j`.
  - Ahora se les permite a las funciones `inspect` personalizadas devolver un objeto.
  - Ahora las funciones `inspect` personalizadas reciben los argumentos cualesquiera que sean pasados a `util.inspect`.

## v8

https://iojs.org/api/v8.html

`v8` es ahora un módulo principal para interactuar directamente con el motor de V8.

### vm

https://iojs.org/api/vm.html

El módulo `vm` ha sido reescrito para un mejor funcionamiento, basado en el excelente módulo nativo de [Contextify](https://github.com/brianmcd/contextify). Toda la funcionalidad de Contextify se encuentra ahora en el núcleo, ¡con mejoras!

- Se añadió el método `vm.isContext(object)` para determinar si un `object` ha sido contextualizado.
- Se añadió el método `vm.runInDebugContext(code)` para compilar y ejecutar `code` dentro del contexto de depuración de V8.
- Se actualizó `vm.createContext(sandbox)` para "contextualizar" el entorno de pruebas, haciéndolo apto para su uso como global para los scripts de la `vm`, y luego devolverla. Ya no crea un objeto de contexto separado.
- Se actualizó la mayoría de los métodos de la `vm` y `vm.Script` para que acepten un objeto de `options`, permitiendo la configuración de un tiempo de espera para el script, el comportamiento de la visualización de los errores, y, algunas veces, el nombre de archivo (para los stack traces).
- Habiendo sido actualizado el objeto del entorno de pruebas suministrado para ser utilizado directamente como el global, remover la copia, susceptible a errores, de propiedades hacia atrás y hacia adelante entre el objeto del entorno de pruebas proporcionado y el global que aparece dentro de los scripts ejecutados por el módulo `vm`.

Para más información, consulte la documentación de la `vm` referida anteriormente.

### zlib

https://iojs.org/api/zlib.html

- Se añadió soporte para que `zlib.flush` especifique un método de vaciado particular (estableciéndose por defecto `Z_FULL_FLUSH`).
- Se añadió soporte para que `zlib.params` actualice dinámicamente el nivel de compresión y la estrategia al desinflarse.
- Se añadieron versiones sincrónicas de los métodos de zlib.

### Cambios de la API de C++

https://iojs.org/api/addons.html

En general, se recomienda que utilice [NAN](https://github.com/rvagg/nan) como una capa de compatibilidad para sus complementos. Esto también ayudará con cambios futuros en la API de C++ de V8 y Node/io.js. La mayor parte de los cambios listados a continuación ya son manejados por envoltorios específicos de NAN.

#### Destacados de V8

- La firma del método expuesto ha cambiado de `Handle<Value> Method(const Arguments& args)` a `void Method(const v8::FunctionCallbackInfo<Value>& args)`, con la recientemente introducida `FunctionCallbackInfo` también tomando el valor de retorno a través de `args.GetReturnValue().Set(value)` en lugar de `scope.Close(value)`, `Arguments` ha sido removida.
- La firma del setter expuesto ha cambiado de `void Setter(Local<String> property, Local<Value> value, const v8::AccessorInfo& args)` `void Setter(Local<String> property, Local<Value> value, const v8::PropertyCallbackInfo<void>& args)`.
- La firma del getter expuesta ha cambiado de `void Getter(Local<String> property, Local<Value> value, const v8::AccessorInfo& args)` `void Getter(Local<String> property, Local<Value> value, const v8::PropertyCallbackInfo<Value>& args)`.
- La firma del setter de la propiedad expuesta ha cambiado de `Handle<Value> Setter(Local<String> property, Local<Value> value, const v8::AccessorInfo& args)` `void Setter(Local<String> property, Local<Value> value, const v8::PropertyCallbackInfo<Value>& args)`.
- La firma del getter de la propiedad ha cambiado de `Handle<Value> Getter(Local<String> property, Local<Value> value, const v8::AccessorInfo& args)` `void Getter(Local<String> property, Local<Value> value, const v8::PropertyCallbackInfo<Value>& args)`.
- Se han realizado cambios similares a los enumeradores de propiedades, eliminadores de propiedades, consulta de propiedades, getter de índice, setter de índice, enumerador de índice, eliminador de índice, consulta de índice.
- Ahora los objetos de V8 instanciados en C++ requieren un argumento `Isolate*` como el primer argumento. En la mayoría de los casos, está bien sencillamente pasar `v8::Isolate::GetCurrent()`, p. ej., `Date::New(Isolate::GetCurrent(), time)`, o `String::NewFromUtf8(Isolate::GetCurrent(), "foobar")`.
- Ahora `HandleScope scope` requiere un argumento `Isolate*`, es decir, `HandleScope scope(isolate)`. En la mayor parte de los casos, `v8::Isolate::GetCurrent()` está bien.
- Se han hecho cambios similares a `Locker` y `Unlocker`.
- Los objetos de V8 que necesiten "escapar" a un ámbito deberían estar dentro de un `EscapableHandleScope` y no un `HandleScope`, y ser devueltos con `scope.Escape(value)`.
- Ahora las excepciones son arrojadas desde los isolates con `isolate->ThrowException(ExceptionObject)`.
- Ahora `Context::GetCurrent()` debe ser realizada sobre un isolate, por ejemplo, `Isolate::GetCurrent()->GetCurrentContext()`.
- `String::NewSymbol()` ha sido eliminada, utilice strings sencillas en su lugar.
- `String::New()` ha sido eliminada, utilice `String::NewFromUtf8()` en su lugar.
- Los objetos `Persistent` ya no heredan desde `Handle` y no pueden ser instanciados con otros objetos. En vez de esto, el `Persistent` debería ser, sencillamente, declarado. Por ejemplo: `Persistent<Type> handle` y luego asignársele un `Local` mediante `handle.Reset(isolate, value)`. Para obtener un `Local` desde un `Persistent`, debe instanciarlo como el argumento, es decir, `Local::New(Isolate*, Persistent)`.

#### Node / io.js

- Se actualizó `node::Buffer::New()` para que devuelva directamente un `Handle`, de modo que ya no necesite encargarse usted de buscar la propiedad `handle_`.
- Se actualizó `node::MakeCallback()` para que requiera un `Isolate*` como el primer argumento. Generalmente `Isolate::GetCurrent()` estará bien para esto.
