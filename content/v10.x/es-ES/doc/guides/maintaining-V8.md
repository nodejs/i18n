# Mantenimiento de V8 en Node.js

## Background

V8 sigue el horario de lanzamiento de Chromium. El horizonte de soporte para Chromium es diferente en comparación con el horizonte de soporte para Node.js. Como resultado, Node.js necesita soportar versiones múltiples de V8 por más tiempo de lo que necesita soportar el upstream. V8 se ramifica en la falta de Node.js de un proceso de mantenimiento oficial debido a que falta una rama compatible con LTS.

Este documento intenta delinear los procesos de mantenimiento actuales, propone un flujo de trabajo para mantener las ramas V8 tanto en Node.js LTS como en las versiones actuales, y analiza cómo pueden ayudar los equipos Node.js y V8 en Google.

## Horario de lanzamiento V8

V8 y Chromium siguen una [cadencia de liberación de aproximadamente 6 semanas](https://www.chromium.org/developers/calendar). En cualquier momento dado, hay tres ramas V8 que están **activas**.

Por ejemplo, en el momento de escribir esto:

* **Estable**: V8 5.4 se envía actualmente como parte de Chromium estable. Esta rama fue creada aprox. 6 semanas antes desde que V8 5.3 se envió como estable.
* **Beta**: V8 5.5 está actualmente en fase beta. Será promovido a estable luego; aproximadamente 6 semanas después del envío de V8 5.4 como estable.
* **Master**: V8 tip-of-tree corresponde a V8 5.6. Esta rama se lanza regularmente como parte de las compilaciones Chromium **canary**. Se promocionará a beta luego, cuando el V8 5.5 se envíe como estable.

Todas las ramas más antiguas son abandonadas y no son mantenidas por el equipo V8.

### Descripción general del proceso de fusión V8

El proceso para respaldar las correcciones de errores en las ramas activas está oficialmente documentado [en la wiki de V8](https://github.com/v8/v8/wiki/Merging%20&%20Patching). El sumario del proceso es:

* V8 solo admite ramas activas. No se realizan pruebas en ramas anteriores a la estable/beta/master actual.
* Una solución que necesita backport está etiquetada con la etiqueta *merge-request-x.x*. This can be done by anyone interested in getting the fix backported. Los problemas con esta etiqueta son revisados por el equipo de V8, regularmente como candidatos para backporting.
* Las reparaciones necesitan cierto "tiempo de cocción" antes de que puedan ser aprobadas para backporting. Esto significa esperar unos días para asegurarse de que no se detectan problemas en las compilaciones canary/beta.
* Una vez que esté listo, el problema se etiquetará con *merge-approved-x.x* y se puede hacer la fusión real mediante el uso de los scripts en la [página wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching).
* Las solicitudes de fusión a una rama abandonada serán rechazadas.
* Solo se aceptan correcciones de errores para backporting.

## Requisitos de soporte de Node.js

En un momento dado, Node.js necesita mantener algunas ramas V8 diferentes para las distintas versiones actuales, LTS y lanzamientos nocturnos. En la actualidad, esta lista incluye las siguientes ramas <sup>1</sup>:

<table>
  <tr>
   <td><strong>Lanzamiento</strong>
   </td>
   <td><strong>Inicio de soporte</strong>
   </td>
   <td><strong>Soporte final</strong>
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

Las versiones de V8 utilizadas en Node.js v4.x, v6.x y 8.x ya han sido abandonadas por V8 upstream. Sin embargo, Node.js necesita continuar apoyando estas ramas durante muchos meses (ramas actuales), o por varios años (ramas LTS).

## Proceso de mantenimiento

Una vez que se ha identificado que una falla en Node.js es causada por V8, el primer paso es identificar las versiones de Node.js y V8 afectadas. El error puede estar presente en múltiples ubicaciones diferentes, cada una de las cuales sigue un proceso ligeramente diferente.

* Errores no arreglados. El error existe en la rama principal V8.
* Solucionado, pero necesita backport. El error puede necesitar la transferencia a una o más ramas. 
  * Backporting a ramas activas.
  * Backporting a ramas abandonadas.
* Backports identificados por el equipo V8. Errores identificados por el upstream V8 que no hemos encontrado en Node.js todavía.

### Errores Upstream no corregidos

Si el error se puede reproducir en la [rama Node.js `canary`], Chromium canary o V8 tip-of-tree, y el caso de prueba es válido, entonces el error debe corregirse upstream primero.

* Comience abriendo un error upstream usando [esta plantilla](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20upstream%20bug).
* Asegúrese de incluir un enlace al problema Node.js correspondiente (si existe).
* Si la solución es lo suficientemente simple, puede solucionarlo usted mismo; las [contribuciones](https://github.com/v8/v8/wiki/Contributing) son bienvenidas.
* El waterfall de construcción de V8 prueba su cambio.
* Una vez que se soluciona el error, es posible que aún necesite backporting, si existe en otras ramas de V8 que todavía están activas o son ramas importantes para Node.js. Sigue el proceso de backporting a continuación.

### Backporting a ramas activas

Si el error existe en cualquiera de las ramas activas de V8, es posible que necesitemos obtener la solución backported. En cualquier momento dado hay [dos ramas activas](https://build.chromium.org/p/client.v8.branches/console) (beta y estable) además de la master. Los siguientes pasos son necesarios para respaldar la corrección:

* Identifica en qué versión de V8 se solucionó el error.
* Identifica si alguna rama V8 activa todavía contiene el error:
* Se necesita un error de seguimiento para solicitar un backport. 
  * Si todavía no hay un error V8 que rastree la corrección, abra un nuevo error de solicitud de fusión usando esta [plantilla específica de Node.js](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20merge%20request).
  * Si ya existe un error 
    * Agregue una referencia al problema GitHub.
    * Adjunte etiquetas *merge-request-x.x* al error para cualquier rama activa que aún contenga el error. (por ejemplo, merge-request-5.3, merge-request-5.4)
    * Agregue ofrobots-at-google.com a la lista cc.
* Una vez que la fusión ha sido aprobada, debe fusionarse usando el [script de fusión documentado en la wiki de V8](https://github.com/v8/v8/wiki/Merging%20&%20Patching). La fusión requiere el acceso de confirmación al repositorio de V8. Si no tiene acceso de confirmación puede indicar que alguien en el equipo de V8 puede hacer la fusión por usted.
* Es posible que la solicitud de fusión no sea aprobada, por ejemplo, si se considera que es una característica o si es demasiado arriesgada para V8 estable. En tales casos, flotamos el parche en el lado de Node.js. Vea el proceso sobre 'Backporting a ramas Abandonadas'.
* Una vez que la solución se ha fusionado upstream, se puede recoger durante una actualización de la rama V8 (ver a continuación).

### Backporting a Ramas Abandonadas

Las ramas V8 abandonadas son compatibles en el repositorio Node.js. La corrección debe ser seleccionada en el repositorio Node.js y V8-CI debe probar el cambio.

* Para cada rama V8 abandonada correspondiente a una rama LTS que se ve afectada por el error: 
  * Verifique una rama fuera de la rama correspondiente *vY.x-staging* (por ejemplo, *v6.x-staging* para solucionar un problema en V8 5.1).
  * Selecciona el(los) commit(s) del repositorio V8.
  * En Node.js < 9.0.0: aumente la versión del nivel de parche en `v8-version.h`. Esto no causará ningún problema con el control de versiones porque V8 no publicará otros parches para esta rama, por lo que Node.js puede superar eficazmente la versión del parche.
  * En Node.js >= 9.0.0: aumente el número `v8_embedder_string` en `common.gypi`.
  * En algunos casos, el parche puede requerir un esfuerzo extra para fusionarse en caso de que V8 haya cambiado sustancialmente. Para problemas importantes, es posible que podamos apoyarnos en el equipo de V8 para obtener ayuda con la reimplementación del parche.
  * Abra una PR de recolección selectiva en `nodejs/node` seleccionando la rama *vY.x-staging* y notifíquelo al equipo de `@nodejs/v8`.
  * Ejecute Node.js [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) además del [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/). Nota: El CI usa el objetivo `test-v8` en el `Makefile`, que usa `tools / make-v8.sh` para reconstruir un árbol git en el directorio `deps / v8` para ejecutar pruebas V8.

La herramienta [`update-v8`] se puede utilizar para simplificar esta tarea. Ejecute `update-v8 backport --sha = SHA` para seleccionar un commit.

An example for workflow how to cherry-pick consider the bug [RegExp show inconsistent result with other browsers](https://crbug.com/v8/5199). From the bug we can see that it was merged by V8 into 5.2 and 5.3, and not into V8 5.1 (since it was already abandoned). Since Node.js `v6.x` uses V8 5.1, the fix needed to be cherry-picked. To cherry-pick, here's an example workflow:

* Download and apply the commit linked-to in the issue (in this case a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3
--directory=deps/v8`. If the branches have diverged significantly, this may not apply cleanly. It may help to try to cherry-pick the merge to the oldest branch that was done upstream in V8. In this example, this would be the patch from the merge to 5.2. The hope is that this would be closer to the V8 5.1, and has a better chance of applying cleanly. If you're stuck, feel free to ping @ofrobots for help.
* Modify the commit message to match the format we use for V8 backports and replace yourself as the author. `git commit --amend --reset-author`. You may want to add extra description if necessary to indicate the impact of the fix on Node.js. In this case the original issue was descriptive enough. Example:

```console
deps: cherry-pick a51f429 from V8 upstream

Original commit message:
  [regexp] Fix case-insensitive matching for one-byte subjects.

  The bug occurs because we do not canonicalize character class ranges
  before adding case equivalents. While adding case equivalents, we abort
  early for one-byte subject strings, assuming that the ranges are sorted.
  Which they are not.

  R=marja@chromium.org
  BUG=v8:5199

  Review-Url: https://codereview.chromium.org/2159683002
  Cr-Commit-Position: refs/heads/master@{#37833}

Refs: https://github.com/v8/v8/commit/a51f429772d1e796744244128c9feeab4c26a854
PR-URL: https://github.com/nodejs/node/pull/7833
```

* Open a PR against the `v6.x-staging` branch in the Node.js repo. Launch the normal and [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) using the Node.js CI system. We only needed to backport to `v6.x` as the other LTS branches weren't affected by this bug.

### Backports Identified by the V8 team

For bugs found through the browser or other channels, the V8 team marks bugs that might be applicable to the abandoned branches in use by Node.js. This is done through manual tagging by the V8 team and through an automated process that tags any fix that gets backported to the stable branch (as it is likely candidate for backporting further).

Such fixes are tagged with the following labels in the V8 issue tracker:

* `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): to be reviewed if this is applicable to abandoned branches in use by Node.js. This list if regularly reviewed by the Node.js team at Google to determine applicability to Node.js.
* `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): marks bugs that are deemed relevant to Node.js and should be backported.
* `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): Backport for Node.js has been performed already.
* `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): Backport for Node.js is not desired.

The backlog of issues with such is regularly reviewed by the node-team at Google to shepherd through the backport process. External contributors are welcome to collaborate on the backport process as well. Note that some of the bugs may be security issues and will not be visible to external collaborators.

## Updating V8

Node.js keeps a vendored copy of V8 inside of the deps/ directory. In addition, Node.js may need to float patches that do not exist upstream. This means that some care may need to be taken to update the vendored copy of V8.

### Minor updates (patch level)

Because there may be floating patches on the version of V8 in Node.js, it is safest to apply the patch level updates as a patch. For example, imagine that upstream V8 is at 5.0.71.47 and Node.js is at 5.0.71.32. It would be best to compute the diff between these tags on the V8 repository, and then apply that patch on the copy of V8 in Node.js. This should preserve the patches/backports that Node.js may be floating (or else cause a merge conflict).

The rough outline of the process is:

```shell
# Assuming your fork of Node.js is checked out in $NODE_DIR
# and you want to update the Node.js master branch.
# Find the current (OLD) version in
# $NODE_DIR/deps/v8/include/v8-version.h
cd $NODE_DIR
git checkout master
git merge --ff-only origin/master
git checkout -b V8_NEW_VERSION
curl -L https://github.com/v8/v8/compare/${V8_OLD_VERSION}...${V8_NEW_VERSION}.patch | git apply --directory=deps/v8
# You may want to amend the commit message to describe the nature of the update
```

V8 also keeps tags of the form *5.4-lkgr* which point to the *Last Known Good Revision* from the 5.4 branch that can be useful in the update process above.

The [`update-v8`](https://github.com/targos/update-v8) tool can be used to simplify this task. Run `update-v8 minor` to apply a minor update.

### Major Updates

We upgrade the version of V8 in Node.js master whenever a V8 release goes stable upstream, that is, whenever a new release of Chrome comes out.

Upgrading major versions would be much harder to do with the patch mechanism above. A better strategy is to

1. Audit the current master branch and look at the patches that have been floated since the last major V8 update.
2. Replace the copy of V8 in Node.js with a fresh checkout of the latest stable V8 branch. Special care must be taken to recursively update the DEPS that V8 has a compile time dependency on (at the moment of this writing, these are only trace_event and gtest_prod.h)
3. Reset the `v8_embedder_string` variable to "-node.0" in `common.gypi`.
4. Refloat (cherry-pick) all the patches from list computed in 1) as necessary. Some of the patches may no longer be necessary.

To audit for floating patches:

```shell
git log --oneline deps/v8
```

To replace the copy of V8 in Node.js, use the [`update-v8`] tool. For example, if you want to replace the copy of V8 in Node.js with the branch-head for V8 5.1 branch:

```shell
cd $NODE_DIR
update-v8 major --branch=5.1-lkgr
```

This should be followed up with manual refloating of all relevant patches.

## Proposal: Using a fork repo to track upstream V8

The fact that Node.js keeps a vendored, potentially edited copy of V8 in deps/ makes the above processes a bit complicated. An alternative proposal would be to create a fork of V8 at `nodejs/v8` that would be used to maintain the V8 branches. This has several benefits:

* The process to update the version of V8 in Node.js could be automated to track the tips of various V8 branches in `nodejs/v8`.
* It would simplify cherry-picking and porting of fixes between branches as the version bumps in `v8-version.h` would happen as part of this update instead of on every change.
* It would simplify the V8-CI and make it more automatable.
* The history of the V8 branch in `nodejs/v8` becomes purer and it would make it easier to pull in the V8 team for help with reviewing.
* It would make it simpler to setup an automated build that tracks Node.js master + V8 lkgr integration build.

This would require some tooling to:

* A script that would update the V8 in a specific Node.js branch with V8 from upstream (dependent on branch abandoned vs. active).
* We need a script to bump V8 version numbers when a new version of V8 is promoted from `nodejs/v8` to `nodejs/node`.
* Enabled the V8-CI build in Jenkins to build from the `nodejs/v8` fork.

<!-- Footnotes themselves at the bottom. -->

### Notes

<sup>1</sup>Node.js 0.12 and older are intentionally omitted from this document as their support has ended.