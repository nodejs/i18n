# Mantenimiento de V8 en Node.js

## Trasfondo

V8 sigue el horario de lanzamiento de Chromium. The support horizon for Chromium is different compared to the support horizon for Node.js. As a result, Node.js needs to support multiple versions of V8 longer than what upstream needs to support. V8 branches in Node.js lack of an official maintenance process due to a missing LTS supported branch.

This document attempts to outline the current maintenance processes, proposes a workflow for maintaining the V8 branches in both Node.js LTS and current releases, and discusses how the Node.js and V8 teams at Google can help.

## Horario de lanzamiento V8

V8 y Chromium siguen una [cadencia de liberación de aproximadamente 6 semanas](https://www.chromium.org/developers/calendar). En cualquier momento dado, hay tres ramas de V8 que están **activas**.

Por ejemplo, en el momento de escribir esto:

* **Estable**: V8 5.4 se envía actualmente como parte de Chromium estable. Esta rama fue creada aprox. 6 semanas antes desde que V8 5.3 se enviara como estable.
* **Beta**: V8 5.5 está actualmente en fase beta. Será promovido a estable luego; aproximadamente 6 semanas después del envío de V8 5.4 como estable.
* **Master**: V8 tip-of-tree corresponde a V8 5.6. Esta rama se lanza regularmente como parte de las compilaciones Chromium **canary**. Se promoverá a beta luego, cuando V8 5.5 se envíe como una versión estable.

Todas las ramas más antiguas son abandonadas y no son mantenidas por el equipo V8.

### Descripción general del proceso de fusión V8

El proceso para respaldar las correcciones de errores en las ramas activas está oficialmente documentado [en la wiki de V8](https://github.com/v8/v8/wiki/Merging%20&%20Patching). El resumen del proceso es:

* V8 solo admite ramas activas. No se realizan pruebas en ramas anteriores a la estable/beta/master actual.
* Una solución que necesita backport está etiquetada con la etiqueta *merge-request-x.x*. Esto puede hacerlo cualquier persona interesada en que se le haga backport a la solución. Los problemas con esta etiqueta son regularmente revisados por el equipo de V8 como candidatos para backporting.
* Las reparaciones necesitan cierto "tiempo de cocción" antes de que puedan ser aprobadas para backporting. Esto significa esperar unos días para asegurarse de que no se detecten problemas en las compilaciones canary/beta.
* Una vez que está listo, el problema se etiqueta con *merge-approved-x.x* y se puede hacer la fusión real mediante el uso de los scripts en la [página wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching).
* Las solicitudes de fusión a una rama abandonada serán rechazadas.
* Solo se aceptan correcciones de errores para backporting.

## Requisitos de soporte de Node.js

At any given time Node.js needs to be maintaining a few different V8 branches for the various Current, LTS, and nightly releases. At present this list includes the following branches<sup>1</sup>:

<table>
  <tr>
   <td><strong>Lanzamiento</strong>
   </td>
   <td><strong>Inicio de soporte</strong>
   </td>
   <td><strong>Fin de Soporte</strong>
   </td>
   <td><strong>Versión V8</strong>
   </td>
   <td><strong>Lanzamiento de la rama V8</strong>
   </td>
   <td><strong>Rama V8 abandonada</strong>
   </td>
  </tr>
  <tr>
   <td>Node.js 4.x
   </td>
   <td>2015-10-01
   </td>
   <td>Abril 2018
   </td>
   <td>4.5
   </td>
   <td>2015-09-01
   </td>
   <td>2015-10-13
   </td>
  </tr>
  <tr>
   <td>Node.js 6.x
   </td>
   <td>2016-04-01
   </td>
   <td>Abril 2019
   </td>
   <td>5.1
   </td>
   <td>2016-05-31
   </td>
   <td>2016-06-26
   </td>
  </tr>
  <tr>
   <td>Node.js 8.x
   </td>
   <td>2017-05-30
   </td>
   <td>Diciembre 2019
   </td>
   <td>6.1 (pronto será 6.2)
   </td>
   <td>2017-10-17 (6.2)
   </td>
   <td>~2017-12-05 (6.2)
   </td>
  </tr>
    <tr>
   <td>Node.js 9.x
   </td>
   <td>2017-10-31
   </td>
   <td>Abril 2018
   </td>
   <td>6.2
   </td>
   <td>2017-10-17
   </td>
   <td>~2017-12-05
   </td>
  </tr>
  <tr>
   <td>master
   </td>
   <td>N/A
   </td>
   <td>N/A
   </td>
   <td>6.2
   </td>
   <td>2017-10-17
   </td>
   <td>~2017-12-05
   </td>
  </tr>
</table>

The versions of V8 used in Node.js v4.x, v6.x, and 8.x have already been abandoned by upstream V8. However, Node.js needs to continue supporting these branches for many months (Current branches) or several years (LTS branches).

## Proceso de mantenimiento

Once a bug in Node.js has been identified to be caused by V8, the first step is to identify the versions of Node.js and V8 affected. The bug may be present in multiple different locations, each of which follows a slightly different process.

* Errores no arreglados. El error existe en la rama principal V8.
* Solucionado, pero necesita backport. El error puede necesitar la transferencia a una o más ramas. 
  * Backporting a ramas activas.
  * Backporting a ramas abandonadas.
* Backports identificados por el equipo V8. Errores identificados por el upstream de V8 que no hemos encontrado en Node.js todavía.

### Errores Upstream no corregidos

If the bug can be reproduced on the [Node.js `canary` branch], Chromium canary, or V8 tip-of-tree, and the test case is valid, then the bug needs to be fixed upstream first.

* Comience abriendo un error upstream usando [esta plantilla](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20upstream%20bug).
* Asegúrese de incluir un enlace al problema Node.js correspondiente (si existe).
* Si la solución es lo suficientemente simple, puede solucionarlo usted mismo; las [contribuciones](https://github.com/v8/v8/wiki/Contributing) son bienvenidas.
* El waterfall de construcción de V8 prueba su cambio.
* Una vez que se soluciona el error, es posible que aún necesite backporting, si existe en otras ramas de V8 que todavía están activas o son ramas importantes para Node.js. Sigue el proceso de backporting a continuación.

### Backporting a Ramas Activas

Si el error existe en cualquiera de las ramas activas de V8, es posible que necesitemos hacer backport a la solución. En cualquier momento dado hay [dos ramas activas](https://build.chromium.org/p/client.v8.branches/console) (beta y estable) además de la master. Los siguientes pasos son necesarios para respaldar la corrección:

* Identifica en qué versión de V8 se solucionó el error.
* Identifica si alguna rama V8 activa todavía contiene el error:
* Se necesita un error de seguimiento para solicitar un backport. 
  * Si todavía no hay un error V8 que rastree la corrección, abra un nuevo error de solicitud de fusión usando esta [plantilla específica de Node.js](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20merge%20request).
  * Si ya existe un error 
    * Agregue una referencia al problema GitHub.
    * Adjunte etiquetas *merge-request-x.x* al error para cualquier rama activa que aún contenga el error. (por ejemplo, merge-request-5.3, merge-request-5.4)
    * Agregue ofrobots-at-google.com a la lista cc.
* Una vez que la fusión ha sido aprobada, debe fusionarse usando el [script de fusión documentado en la wiki de V8](https://github.com/v8/v8/wiki/Merging%20&%20Patching). La fusión requiere tener acceso de commits al repositorio de V8. Si no tiene acceso de commits puede indicar que alguien en el equipo de V8 haga la fusión por usted.
* Es posible que la solicitud de fusión no sea aprobada, por ejemplo, si se considera que es una característica o si es demasiado arriesgada para una versión estable de V8. En tales casos, flotamos el parche en el lado de Node.js. Vea el proceso sobre 'Backporting a ramas Abandonadas'.
* Once the fix has been merged upstream, it can be picked up during an update of the V8 branch (see below).

### Backporting a Ramas Abandonadas

Las ramas V8 abandonadas son compatibles en el repositorio Node.js. The fix needs to be cherry-picked in the Node.js repository and V8-CI must test the change.

* Para cada rama de V8 abandonada correspondiente a una rama LTS que se ve afectada por el error: 
  * Checkout a branch off the appropriate *vY.x-staging* branch (e.g. *v6.x-staging* to fix an issue in V8 5.1).
  * Selecciona el(los) commit(s) del repositorio V8.
  * En Node.js < 9.0.0: aumente la versión del nivel de parche en `v8-version.h`. Esto no causará ningún problema con el control de versiones porque V8 no publicará otros parches para esta rama, por lo que Node.js puede efectivamente superar la versión del parche.
  * On Node.js >= 9.0.0: Increase the `v8_embedder_string` number in `common.gypi`.
  * En algunos casos, el parche puede requerir un esfuerzo extra para fusionarse en caso de que V8 haya cambiado sustancialmente. Para problemas importantes, es posible que podamos apoyarnos en el equipo de V8 para obtener ayuda con la reimplementación del parche.
  * Open a cherry-pick PR on `nodejs/node` targeting the *vY.x-staging* branch and notify the `@nodejs/v8` team.
  * Ejecute Node.js [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) además del [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/). The CI uses the `test-v8` target in the `Makefile`, which uses `tools/make-v8.sh` to reconstruct a git tree in the `deps/v8` directory to run V8 tests.

The [`git-node`] tool can be used to simplify this task. Run `git node v8 backport <sha>` to cherry-pick a commit.

An example for workflow how to cherry-pick consider the bug [RegExp show inconsistent result with other browsers](https://crbug.com/v8/5199). From the bug we can see that it was merged by V8 into 5.2 and 5.3, and not into V8 5.1 (since it was already abandoned). Since Node.js `v6.x` uses V8 5.1, the fix needed to be cherry-picked. Para hacerlo, este es un flujo de trabajo de ejemplo:

* Descargue y aplique el commit vinculado en el problema (en este caso a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3
--directory=deps/v8`. Si las ramas han divergido significativamente, esto puede no aplicarse limpiamente. Puede ser útil tratar de hacer cherry-pick a la fusión a la rama más antigua que se realizó upstream en V8. En este ejemplo, este sería el parche de la fusión a 5.2. La esperanza es que esto esté más cerca del V8 5.1 y que tenga una mejor oportunidad de aplicar limpiamente. Si está atascado, siéntase libre de hacer ping a @ofrobots para obtener ayuda.
* Modifique el mensaje de commit para que coincida con el formato que usamos para los backports de V8 y sustitúyase como autor. `git commit --amend --reset-author`. Es posible que desee agregar una descripción adicional si es necesario para indicar el impacto de la solución en Node.js. En este caso, el problema original fue lo suficientemente descriptivo. Ejemplo:

```console
deps: cherry-pick a51f429 de V8 upstream

Mensaje de commit original:
  [regexp] Fix case-insensitive matching for one-byte subjects.

  El error se produce porque no canonizamos los rangos de clase de caracteres antes de agregar equivalentes de casos. Al agregar equivalentes de casos, abortamos con anticipación para cadenas de asunto de un byte, asumiendo que los rangos están ordenados.
  Que no lo están.

  R=marja@chromium.org
  BUG=v8:5199

  Review-Url: https://codereview.chromium.org/2159683002
  Cr-Commit-Position: refs/heads/master@{#37833}

Refs: https://github.com/v8/v8/commit/a51f429772d1e796744244128c9feeab4c26a854
PR-URL: https://github.com/nodejs/node/pull/7833
```

* Abra una PR en la rama `v6.x-staging` en el repositorio Node.js. Launch the normal and [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) using the Node.js CI system. Solo necesitamos hacer backport a `v6.x` ya que las otras ramas de LTS no se vieron afectadas por este error.

### Backports identificados por el equipo V8

For bugs found through the browser or other channels, the V8 team marks bugs that might be applicable to the abandoned branches in use by Node.js. This is done through manual tagging by the V8 team and through an automated process that tags any fix that gets backported to the stable branch (as it is likely candidate for backporting further).

Estas correcciones se etiquetan con las siguientes etiquetas en el rastreador de problemas de V8:

* `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): se revisará si esto es aplicable a las ramas abandonadas en uso por Node.js. Esta lista es revisada regularmente por el equipo de Node.js en Google para determinar la aplicabilidad a Node.js.
* `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): marca los errores que se consideran relevantes para Node.js y que se les debería hacer backport.
* `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): El backport para Node.js ya se ha realizado.
* `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): El backport para Node.js no es deseado.

The backlog of issues with such is regularly reviewed by the node-team at Google to shepherd through the backport process. External contributors are welcome to collaborate on the backport process as well. Note that some of the bugs may be security issues and will not be visible to external collaborators.

## Actualizando V8

Node.js se queda con una copia de V8 dentro del directorio deps/. In addition, Node.js may need to float patches that do not exist upstream. This means that some care may need to be taken to update the vendored copy of V8.

### Actualizaciones menores (a nivel de parche)

Because there may be floating patches on the version of V8 in Node.js, it is safest to apply the patch level updates as a patch. For example, imagine that upstream V8 is at 5.0.71.47 and Node.js is at 5.0.71.32. It would be best to compute the diff between these tags on the V8 repository, and then apply that patch on the copy of V8 in Node.js. This should preserve the patches/backports that Node.js may be floating (or else cause a merge conflict).

El bosquejo del proceso es:

```shell
# Suponiendo que tu fork de Node.js está desprotegido en $NODE_DIR
# y desea actualizar la rama master Node.js.
# Encuentre la versión actual (VIEJA) en
# $NODE_DIR/deps/v8/include/v8-version.h
cd $NODE_DIR
git checkout master
git merge --ff-only origin/master
git checkout -b V8_NEW_VERSION
curl -L https://github.com/v8/v8/compare/${V8_OLD_VERSION}...${V8_NEW_VERSION}.patch | git apply --directory=deps/v8
# Es posible que desee modificar el mensaje de commit para describir la naturaleza de la actualización
```

V8 also keeps tags of the form *5.4-lkgr* which point to the *Last Known Good Revision* from the 5.4 branch that can be useful in the update process above.

The [`git-node`] tool can be used to simplify this task. Run `git node v8 minor` to apply a minor update.

### Actualizaciones principales

We upgrade the version of V8 in Node.js master whenever a V8 release goes stable upstream, that is, whenever a new release of Chrome comes out.

Upgrading major versions would be much harder to do with the patch mechanism above. Una mejor estrategia es

1. Audite la rama maestra actual y observe los parches que se han flotado desde la última actualización importante de V8.
2. Reemplace la copia de V8 en Node.js con una nueva verificación de la última rama estable de V8. Se debe tener especial cuidado al actualizar de forma recursiva los DEPS en los que V8 tiene una dependencia de tiempo de compilación (al momento de escribir esto, estos son solo trace_event y gtest_prod.h)
3. Restablezca la variable `v8_embedder_string` a "-node.0" en `common.gypi`.
4. Vuelva a cargar (seleccione con precisión) todos los parches de la lista calculada en 1) según sea necesario. Es posible que algunos de los parches ya no sean necesarios.

Para auditar parches flotantes:

```shell
git log --oneline deps/v8
```

To replace the copy of V8 in Node.js, use the [`git-node`] tool. Por ejemplo, si desea reemplazar la copia de V8 en Node.js con la cabecera de rama para la rama de V8 5.1:

```shell
cd $NODE_DIR
git node v8 major --branch=5.1-lkgr
```

Esto debe ser seguido con el reflotamiento manual de todos los parches relevantes.

## Propuesta: Usar un repositorio fork para rastrear V8 upstream

The fact that Node.js keeps a vendored, potentially edited copy of V8 in deps/ makes the above processes a bit complicated. An alternative proposal would be to create a fork of V8 at `nodejs/v8` that would be used to maintain the V8 branches. Esto tiene varios beneficios:

* The process to update the version of V8 in Node.js could be automated to track the tips of various V8 branches in `nodejs/v8`.
* Simplificaría el cherry-picking y el porting de correcciones entre ramas, ya que los saltos de versión en `v8-version.h` ocurrirían como parte de esta actualización en lugar de en cada cambio.
* Simplificaría el V8-CI y lo haría más automatizable.
* The history of the V8 branch in `nodejs/v8` becomes purer and it would make it easier to pull in the V8 team for help with reviewing.
* Haría más fácil la configuración de una compilación automatizada que rastree la compilación de integración de Node.js master + V8 lkgr.

Esto requeriría algunas herramientas para:

* Un script que actualizaría el V8 en una rama específica de Node.js con V8 upstream (dependiente de la rama abandonada vs. activa).
* We need a script to bump V8 version numbers when a new version of V8 is promoted from `nodejs/v8` to `nodejs/node`.
* Habilitar la compilación de V8-CI en Jenkins para compilar desde el fork `nodejs/v8`.

<!-- Footnotes themselves at the bottom. -->

### Notas

<sup>1</sup>Node.js 0.12 and older are intentionally omitted from this document as their support has ended.