# Mantenimiento de V8 en Node.js

## Trasfondo

V8 sigue el horario de lanzamiento de Chromium. The support horizon for Chromium is different compared to the support horizon for Node.js. As a result, Node.js needs to support multiple versions of V8 longer than what upstream needs to support. V8 branches in Node.js lack of an official maintenance process due to a missing LTS supported branch.

This document attempts to outline the current maintenance processes, proposes a workflow for maintaining the V8 branches in both Node.js LTS and current releases, and discusses how the Node.js and V8 teams at Google can help.

## Horario de Lanzamiento de V8

V8 and Chromium follow a [roughly 6-week release cadence](https://www.chromium.org/developers/calendar). At any given time there are three V8 branches that are **active**.

Por ejemplo, en el momento de escribir esto:

* **Stable**: V8 5.4 is currently shipping as part of Chromium stable. This branch was created approx. 6 weeks before from when V8 5.3 shipped as stable.
* **Beta**: V8 5.5 is currently in beta. It will be promoted to stable next; approximately 6 weeks after V8 5.4 shipped as stable.
* **Master**: V8 tip-of-tree corresponds to V8 5.6. This branch gets regularly released as part of the Chromium **canary** builds. This branch will be promoted to beta next when V8 5.5 ships as stable.

Todas las ramas más antiguas son abandonadas y no son mantenidas por el equipo V8.

### Descripción general del proceso de fusión de V8

The process for backporting bug fixes to active branches is officially documented [on the V8 wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). El resumen del proceso es:

* V8 solo admite ramas activas. There is no testing done on any branches older than the current stable/beta/master.
* A fix needing backport is tagged w/ *merge-request-x.x* tag. This can be done by anyone interested in getting the fix backported. Issues with this tag are reviewed by the V8 team regularly as candidates for backporting.
* Las reparaciones necesitan cierto "tiempo de cocción" antes de que puedan ser aprobadas para backporting. This means waiting a few days to ensure that no issues are detected on the canary/beta builds.
* Once ready, the issue is tagged w/ *merge-approved-x.x* and one can do the actual merge by using the scripts on the [wiki page](https://github.com/v8/v8/wiki/Merging%20&%20Patching).
* Las solicitudes de fusión a una rama abandonada serán rechazadas.
* Solo se aceptan correcciones de errores para backporting.

## Requerimientos de Soporte de Node.js

En un momento dado, Node.js necesita mantener algunas ramas de V8 diferentes para las distintas versiones actuales, LTS y lanzamientos nocturnos. En la actualidad, esta lista incluye las siguientes ramas <sup>1</sup>:

<table>
  <tr>
   <td><strong>Lanzamiento</strong>
   </td>
   <td><strong>Inicio de Soporte</strong>
   </td>
   <td><strong>Término de soporte</strong>
   </td>
   <td><strong>Versión de V8</strong>
   </td>
   <td><strong>Lanzamiento de la rama de V8</strong>
   </td>
   <td><strong>Rama de V8 abandonada</strong>
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

Las versiones de V8 utilizadas en Node.js v4.x, v6.x y 8.x ya han sido abandonadas por V8 upstream. Sin embargo, Node.js necesita continuar apoyando estas ramas durante muchos meses (ramas actuales), o por varios años (ramas LTS).

## Proceso de mantenimiento

Una vez que se ha identificado que una falla en Node.js es causada por V8, el primer paso es identificar las versiones de Node.js y V8 afectadas. El error puede estar presente en múltiples ubicaciones diferentes, cada una de las cuales sigue un proceso ligeramente diferente.

* Errores no arreglados. El error existe en la rama principal V8.
* Solucionado, pero necesita backport. El error puede necesitar la transferencia a una o más ramas.
  * Backporting a ramas activas.
  * Backporting a ramas abandonadas.
* Backports identificados por el equipo V8. Bugs identified by upstream V8 that we haven't encountered in Node.js yet.

### Errores Upstream no corregidos

If the bug can be reproduced on the [Node.js `canary` branch][], Chromium canary, or V8 tip-of-tree, and the test case is valid, then the bug needs to be fixed upstream first.

* Comience abriendo un error upstream usando [esta plantilla](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20upstream%20bug).
* Make sure to include a link to the corresponding Node.js issue (if one exists).
* If the fix is simple enough, you may fix it yourself; [contributions](https://github.com/v8/v8/wiki/Contributing) are welcome.
* La cascada de compilación de V8 prueba su cambio.
* Once the bug is fixed it may still need backporting, if it exists in other V8 branches that are still active or are branches that Node.js cares about. Sigue el proceso de backporting a continuación.

### Backporting a Ramas Activas

If the bug exists in any of the active V8 branches, we may need to get the fix backported. At any given time there are [two active branches](https://build.chromium.org/p/client.v8.branches/console) (beta and stable) in addition to master. The following steps are needed to backport the fix:

* Identifica en qué versión de V8 se solucionó el error.
* Identifica si alguna rama V8 activa todavía contiene el error:
* Se necesita un error de seguimiento para solicitar un backport.
  * If there isn't already a V8 bug tracking the fix, open a new merge request bug using this [Node.js specific template](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20merge%20request).
  * Si ya existe un error
    * Agregue una referencia al incidente de GitHub.
    * Attach *merge-request-x.x* labels to the bug for any active branches that still contain the bug. (e.g. merge-request-5.3, merge-request-5.4)
    * Agregue ofrobots-at-google.com a la lista cc.
* Once the merge has been approved, it should be merged using the [merge script documented in the V8 wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Merging requires commit access to the V8 repository. If you don't have commit access you can indicate someone on the V8 team can do the merge for you.
* It is possible that the merge request may not get approved, for example if it is considered to be a feature or otherwise too risky for V8 stable. In such cases we float the patch on the Node.js side. See the process on 'Backporting to Abandoned branches'.
* Once the fix has been merged upstream, it can be picked up during an update of the V8 branch (see below).

### Backporting a Ramas Abandonadas

Las ramas V8 abandonadas son compatibles en el repositorio Node.js. La corrección debe ser seleccionada en el repositorio Node.js y V8-CI debe probar el cambio.

* For each abandoned V8 branch corresponding to an LTS branch that is affected by the bug:
  * Checkout a branch off the appropriate *vY.x-staging* branch (e.g. *v6.x-staging* to fix an issue in V8 5.1).
  * Selecciona el(los) commit(s) del repositorio V8.
  * On Node.js < 9.0.0: Increase the patch level version in `v8-version.h`. This will not cause any problems with versioning because V8 will not publish other patches for this branch, so Node.js can effectively bump the patch version.
  * On Node.js >= 9.0.0: Increase the `v8_embedder_string` number in `common.gypi`.
  * In some cases the patch may require extra effort to merge in case V8 has changed substantially. For important issues we may be able to lean on the V8 team to get help with reimplementing the patch.
  * Open a cherry-pick PR on `nodejs/node` targeting the *vY.x-staging* branch and notify the `@nodejs/v8` team.
  * Ejecute Node.js [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) además del [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/). The CI uses the `test-v8` target in the `Makefile`, which uses `tools/make-v8.sh` to reconstruct a git tree in the `deps/v8` directory to run V8 tests.

The [`git-node`][] tool can be used to simplify this task. Run `git node v8 backport <sha>` to cherry-pick a commit.

An example for workflow how to cherry-pick consider the bug [RegExp show inconsistent result with other browsers](https://crbug.com/v8/5199). From the bug we can see that it was merged by V8 into 5.2 and 5.3, and not into V8 5.1 (since it was already abandoned). Since Node.js `v6.x` uses V8 5.1, the fix needed to be cherry-picked. Para seleccionarla cuidadosamente, aquí hay un ejemplo de flujo de trabajo:

* Descargue y aplique el commit vinculado en el problema (en este caso a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3
--directory=deps/v8`. If the branches have diverged significantly, this may not apply cleanly. It may help to try to cherry-pick the merge to the oldest branch that was done upstream in V8. In this example, this would be the patch from the merge to 5.2. The hope is that this would be closer to the V8 5.1, and has a better chance of applying cleanly. If you're stuck, feel free to ping @ofrobots for help.
* Modify the commit message to match the format we use for V8 backports and replace yourself as the author. `git commit --amend --reset-author`. You may want to add extra description if necessary to indicate the impact of the fix on Node.js. En este caso, el problema original fue lo suficientemente descriptivo. Ejemplo:

```console
deps: hacer cherry-pick a a51f429 desde upstream de V8

Original commit message:
  [regexp] Corregir la coincidencia entre mayúsculas y minúsculas para los casos de un byte.

  El error se produce porque no canonizamos los rangos de clase de caracteres antes de agregar equivalentes de caso. Al agregar equivalentes de casos, abortamos temprano para strings de casos de un byte, asumiendo que los rangos están ordenados.
  Que no lo están.

  R=marja@chromium.org
  BUG=v8:5199

  Review-Url: https://codereview.chromium.org/2159683002
  Cr-Commit-Position: refs/heads/master@{#37833}

Refs: https://github.com/v8/v8/commit/a51f429772d1e796744244128c9feeab4c26a854
PR-URL: https://github.com/nodejs/node/pull/7833
```

* Abra una PR contra la rama `v6.x-staging` en el repositorio de Node.js. Launch the normal and [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) using the Node.js CI system. We only needed to backport to `v6.x` as the other LTS branches weren't affected by this bug.

### Backports Identificados por el equipo de V8

Para los errores encontrados a través del navegador u otros canales, el equipo V8 marca los errores que podrían ser aplicables a las ramas abandonadas en uso por Node.js. Esto se hace a través del etiquetado manual por parte del equipo de V8 y mediante un proceso automatizado que marca cualquier corrección a la que se le haya hecho un backport a la rama estable (ya que es probable que sea una candidata para el backporting).

Estas correcciones se marcan con las siguientes etiquetas en el rastreador de problemas de V8:

* `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): to be reviewed if this is applicable to abandoned branches in use by Node.js. This list if regularly reviewed by the Node.js team at Google to determine applicability to Node.js.
* `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): marks bugs that are deemed relevant to Node.js and should be backported.
* `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): Backport for Node.js has been performed already.
* `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): Backport for Node.js is not desired.

El equipo de node en Google regularmente revisa la acumulación de problemas con estos para supervisar el proceso de backport. Los colaboradores externos también pueden colaborar en el proceso de backport. Some of the bugs may be security issues and will not be visible to external collaborators.

## Actualización de V8

Node.js se queda con una copia de V8 dentro del directorio deps/. In addition, Node.js may need to float patches that do not exist upstream. Esto significa que se debe tener cuidado al actualizar la copia vendida de V8.

### Actualizaciones menores (a nivel de parche)

Debido a que puede haber parches flotantes en la versión de V8 en Node.js, es más seguro aplicar las actualizaciones de nivel de parche como un parche. Por ejemplo, imagine que el V8 upstream está en 5.0.71.47 y Node.js está en 5.0.71.32. Sería mejor calcular la diferencia entre estas etiquetas en el repositorio de V8 y luego aplicar ese parche en la copia de V8 en Node.js. Esto debería preservar los parches/backports que Node.js puede estar flotando (o de lo contrario causaría un conflicto de fusión).

El esquema del proceso es:

```shell
# Suponiendo que su bifurcación de Node.js esté verificada en $NODE_DIR
# y desea actualizar la rama maestra Node.js.
# Encuentre la versión actual (ANTIGUA) en
# $NODE_DIR/deps/v8/include/v8-version.h
cd $NODE_DIR
git checkout master
git merge --ff-only origin/master
git checkout -b V8_NEW_VERSION
curl -L https://github.com/v8/v8/compare/${V8_OLD_VERSION}...${V8_NEW_VERSION}.patch | git apply --directory=deps/v8
# Es posible que desee modificar el mensaje de commit para describir la naturaleza de la actualización
```

V8 also keeps tags of the form *5.4-lkgr* which point to the *Last Known Good Revision* from the 5.4 branch that can be useful in the update process above.

The [`git-node`][] tool can be used to simplify this task. Run `git node v8 minor` to apply a minor update.

### Actualizaciones Importantes

Actualizamos la versión de V8 en Node.js master cada vez que una versión de V8 se estabiliza upstream, es decir, cada vez que sale una nueva versión de Chrome.

Actualizar las versiones principales sería mucho más difícil de hacer con el mecanismo de parche anterior. Una mejor estrategia es

1. Audit the current master branch and look at the patches that have been floated since the last major V8 update.
1. Replace the copy of V8 in Node.js with a fresh checkout of the latest stable V8 branch. Special care must be taken to recursively update the DEPS that V8 has a compile time dependency on (at the moment of this writing, these are only trace_event and gtest_prod.h)
1. Restablezca la variable `v8_embedder_string` a "-node.0" en `common.gypi`.
1. Renovar (hacer cherry-pick) todos los parches de la lista calculados en 1) según sea necesario. Es posible que algunos de los parches ya no sean necesarios.

Para auditar los parches flotantes:

```shell
git log --oneline deps/v8
```

To replace the copy of V8 in Node.js, use the [`git-node`][] tool. For example, if you want to replace the copy of V8 in Node.js with the branch-head for V8 5.1 branch:

```shell
cd $NODE_DIR
git node v8 major --branch=5.1-lkgr
```

Esto debe ser seguido con la renovación manual de todos los parches relevantes.

## Propuesta: Usar un repositorio de bifurcaciones para rastrear el V8 upstream

El hecho de que Node.js mantenga una copia vendida y potencialmente editada de V8 en deps/ hace que los procesos anteriores sean un poco complicados. An alternative proposal would be to create a fork of V8 at `nodejs/v8` that would be used to maintain the V8 branches. Esto tiene varios beneficios:

* The process to update the version of V8 in Node.js could be automated to track the tips of various V8 branches in `nodejs/v8`.
* It would simplify cherry-picking and porting of fixes between branches as the version bumps in `v8-version.h` would happen as part of this update instead of on every change.
* Simplificaría el V8-CI y lo haría más automatizable.
* The history of the V8 branch in `nodejs/v8` becomes purer and it would make it easier to pull in the V8 team for help with reviewing.
* It would make it simpler to setup an automated build that tracks Node.js master + V8 lkgr integration build.

Esto requeriría algunas herramientas para:

* A script that would update the V8 in a specific Node.js branch with V8 from upstream (dependent on branch abandoned vs. activa).
* We need a script to bump V8 version numbers when a new version of V8 is promoted from `nodejs/v8` to `nodejs/node`.
* Habilitar la compilación de V8-CI en Jenkins para compilar desde el fork `nodejs/v8`.

<!-- Footnotes themselves at the bottom. -->
### Notas

<sup>1</sup>Node.js 0.12 and older are intentionally omitted from this document as their support has ended.
