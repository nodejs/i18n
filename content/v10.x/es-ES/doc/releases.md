# Proceso de Lanzamiento de Node.js

Este documento describe los aspectos técnicos del proceso de lanzamiento de Node.js. La audiencia prevista son quienes han sido autorizados por el Comité de Dirección Técnica (TSC) de la Fundación Node.js para crear, promover y firmar versiones oficiales de lanzamiento para Node.js, alojadas en <https://nodejs.org/>.

## Tabla de Contenidos

* [¿Quién puede realizar un lanzamiento?](#who-can-make-a-release)
  * [1. Acceso de Lanzamiento Jenkins](#1-jenkins-release-access)
  * [2. <nodejs.org> Acceso](#2-nodejsorg-access)
  * [3. Una Clave GPG Públicamente Listada](#3-a-publicly-listed-gpg-key)
* [Cómo crear un lanzamiento](#how-to-create-a-release)
  * [0. Pre-release steps](#0-pre-release-steps)
  * [1. Update the staging branch](#1-update-the-staging-branch)
  * [2. Create a new branch for the release](#2-create-a-new-branch-for-the-release)
  * [3. Actualizar `src/node_version.h`](#3-update-srcnode_versionh)
  * [4. Actualizar el Changelog](#4-update-the-changelog)
  * [5. Crear un Commit de Lanzamiento](#5-create-release-commit)
  * [6. Proponer Lanzamiento en GitHub](#6-propose-release-on-github)
  * [7. Asegurar que la Rama de Lanzamiento sea Estable](#7-ensure-that-the-release-branch-is-stable)
  * [8. Producir una Compilación Nocturna _(opcional)_](#8-produce-a-nightly-build-optional)
  * [9. Producir Compilaciones de Lanzamiento](#9-produce-release-builds)
  * [10. Probar la Compilación](#10-test-the-build)
  * [11. Etiquetar y Firmar el Commit de Lanzamiento](#11-tag-and-sign-the-release-commit)
  * [12. Configurar Para el Siguiente Lanzamiento](#12-set-up-for-the-next-release)
  * [13. Promover y Firmar las Compilaciones de Lanzamiento](#13-promote-and-sign-the-release-builds)
  * [14. Verificar el Lanzamiento](#14-check-the-release)
  * [15. Crear una Entrada en el Blog](#15-create-a-blog-post)
  * [16. Create the release on GitHub](#16-create-the-release-on-github)
  * [17. Limpiar](#17-cleanup)
  * [18. Anunciar](#18-announce)
  * [19. Celebrar](#19-celebrate)

## ¿Quién puede realizar un lanzamiento?

La autorización de lanzamiento es otorgada por el TSC de Node.js. Once authorized, an individual must have the following:

### 1. Acceso de Lanzamiento Jenkins

Hay tres trabajos relevantes de Jenkins que deben ser utilizados para un flujo de lanzamiento:

**a.** **Test runs:** **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** is used for a final full-test run to ensure that the current *HEAD* is stable.

**b.** **Nightly builds:** (optional) **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** can be used to create a nightly release for the current *HEAD* if public test releases are required. Las compilaciones activadas con este trabajo son publicadas directamente en <https://nodejs.org/download/nightly/> y se encuentran disponibles para su descarga pública.

**c.** **Release builds:** **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** does all of the work to build all required release assets. La promoción de los archivos de lanzamiento es un paso manual una vez que están listos (véase a continuación).

El [equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proveer este acceso a personas individuales autorizadas por el TSC.

### 2. <nodejs.org> Acceso

The _dist_ user on nodejs.org controls the assets available in <https://nodejs.org/download/>. <https://nodejs.org/dist/> is an alias for <https://nodejs.org/download/release/>.

Los workers de la compilación del lanzamiento Jenkins workers sube los artefactos al servidor web como el usuario _staging_. El usuario _dist_ tiene acceso para mover estos activos a acceso público mientras que, por seguridad, no lo tiene el usuario _staging_.

Las compilaciones nocturnas son promovidas automáticamente en el servidor por una tarea cron para el usuario _dist_.

Las compilaciones liberadas requieren promoción manual por una persona individual con acceso SSH en el servidor como el usuario_dist_. El [equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proveer este acceso a personas individuales autorizadas por el TSC.

### 3. Una Clave GPG Públicamente Listada

Un archivo SHASUMS256.txt es producido por cada compilación promovida, cada noche, y lanzamientos. Adicionalmente para los lanzamientos, este archivo es firmado por la persona individual responsable de ese lanzamiento. Para poder verificar binarios descargados, el publico debería ser capaz de verificar que el archivo SHASUMS256.txt ha sido firmado por alguien que ha sido autorizado para crear un lanzamiento.

Las claves GPG deberían ser rescatables de un keyserver conocido de terceros. Son recomendados los Keyservers SKS en <https://sks-keyservers.net>. Usa el formulario de [envío](https://pgp.mit.edu/) para enviar una nueva clave GPG. Las claves deberían ser rescatables usando:

```console
$ gpg --keyserver pool.sks-keyservers.net --recv-keys <FINGERPRINT>
```

La clave que usted utilice puede ser una clave secundaria/subclave de una clave existente.

Además, huellas de clave GPG completas para individuos autorizados para hacer el lanzamiento deberían estar listadas en el archivo Node.js GitHub README.md.

## Cómo crear un lanzamiento

Notas:

- Las fechas listadas a continuación como _"AAAA-MM-DD"_ deberían ser la fecha del lanzamiento **como UTC**. Utilice `date -u +'%Y-%m-%d'` para descubrir qué es esto.
- Version strings are listed below as _"vx.y.z"_ or _"x.y.z"_. Substitute for the release version.
- Examples will use the fictional release version `1.2.3`.

### 0. Pre-release steps

Before preparing a Node.js release, the Build Working Group must be notified at least one business day in advance of the expected release. Coordinating with Build is essential to make sure that the CI works, release files are published, and the release blog post is available on the project website.

Build can be contacted best by opening up an issue on the \[Build issue tracker\]\[\], and by posting in `#node-build` on [webchat.freenode.net](https://webchat.freenode.net/).

When preparing a security release, contact Build at least two weekdays in advance of the expected release. To ensure that the security patch(es) can be properly tested, run a `node-test-pull-request` job against the `master` branch of the `nodejs-private/node-private` repository a day or so before the [CI lockdown procedure](https://github.com/nodejs/build/blob/master/doc/jenkins-guide.md#restricting-access-for-security-releases) begins. This is to confirm that Jenkins can properly access the private repository.

### 1. Update the staging branch

Checkout the staging branch locally.

```console
$ git remote update
$ git checkout v1.x-staging
$ git reset --hard upstream/v1.x-staging
```

If the staging branch is not up to date relative to `master`, bring the appropriate PRs and commits into it.

Go through PRs with the label `vN.x`. e.g. [PRs with the `v8.x` label](https://github.com/nodejs/node/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc+label%3Av8.x).

For each PR:
- Run or check that there is a passing CI.
- Check approvals (you can approve yourself).
- Check that the commit metadata was not changed from the `master` commit.
- If there are merge conflicts, ask the PR author to rebase. Simple conflicts can be resolved when landing.

When landing the PR add the `Backport-PR-URL:` line to each commit. Close the backport PR with `Landed in ...`. Update the label on the original PR from `backport-requested-vN.x` to `backported-to-vN.x`.

To determine the relevant commits, use [`branch-diff`](https://github.com/nodejs/branch-diff). The tool is available on npm and should be installed globally or run with `npx`. It depends on our commit metadata, as well as the GitHub labels such as `semver-minor` and `semver-major`. One drawback is that when the `PR-URL` metadata is accidentally omitted from a commit, the commit will show up because it's unsure if it's a duplicate or not.

Para una lista de commits que pudieran llegar en un lanzamiento de parche en v1.x:

```console
$ branch-diff v1.x-staging master --exclude-label=semver-major,semver-minor,dont-land-on-v1.x,backport-requested-v1.x --filter-release --format=simple
```

Previous release commits and version bumps do not need to be cherry-picked.

Carefully review the list of commits:
- Checking for errors (incorrect `PR-URL`)
- Checking semver status - Commits labeled as `semver-minor` or `semver-major` should only be cherry-picked when appropriate for the type of release being made.
- If you think it's risky so should wait for a while, add the `baking-for-lts` tag.

When cherry-picking commits, if there are simple conflicts you can resolve them. Otherwise, add the `backport-requested-vN.x` label to the original PR and post a comment stating that it does not land cleanly and will require a backport PR.

If commits were cherry-picked in this step, check that the test still pass and push to the staging branch to keep it up-to-date.

```console
$ git push upstream v1.x-staging
```

### 2. Create a new branch for the release

Create a new branch named `vx.y.z-proposal`, off the corresponding staging branch.

```console
$ git checkout -b v1.2.3-proposal upstream/v1.x-staging
```

### 3. Actualizar `src/node_version.h`

Establece la versión para el lanzamiento propuesto usando los siguientes macros, que ya están definidos en `src/node_version.h`:

```c
#define NODE_MAJOR_VERSION x
#define NODE_MINOR_VERSION y
#define NODE_PATCH_VERSION z
```

Establezca el valor del macro `NODE_VERSION_IS_RELEASE` a `1`. Esto causa que la compilación sea producida con una versión string que no tiene una etiqueta de pre-lanzamiento al final:

```c
#define NODE_VERSION_IS_RELEASE 1
```

**También considera si se debe saltar `NODE_MODULE_VERSION`**:

Este macro es utilizado para señalar una versión de ABI para complementos nativos. Actualmente tiene dos usos comunes en la comunidad:

- Determinar qué API funciona en contra para compilar complementos nativos, p. ej. [NAN](https://github.com/nodejs/nan) lo usa para formar una capa de compatibilidad para mucho de lo que envuelve.
- Determinar el ABI para descargar binarios pre-compilados de complementos nativos, p. ej. [node-pre-gyp](https://github.com/mapbox/node-pre-gyp) usa este valor como fue expuesto por `process.versions.modules` para ayudar a determinar el binario apropiado para descargar en tiempo de instalación.

La regla general es saltar esta versión cuando hay cambios de _rompimiento ABI_, y también si hay cambios API no-triviales. Las reglas aún no están estrictamente definidas, en caso de duda, por favor confiere con alguien que tendrá una perspectiva más informada, como un miembro del equipo NAN.

It is current TSC policy to bump major version when ABI changes. Si ves una necesidad de saltar `NODE_MODULE_VERSION`, entonces deberías consultar el TSC. Los commits pudieran necesitar ser revertidos, opudiera ser necesario que ocurra un salto de una versión mayor.

### 4. Actualizar el Changelog

#### Step 1: Collect the formatted list of changes

Recolecte una lista formateada de commits desde el último lanzamiento. Usa [`changelog-maker`](https://github.com/nodejs/changelog-maker) para hacer esto:

```console
$ changelog-maker --group
```

Ten en cuenta que, el creador de registro de cambios cuenta los commits desde la última etiqueta, y si la última etiqueta en el repositorio no estaba en el branch actual, puede ser que tengas que suministrar un argumento `--start-ref`:

```console
$ changelog-maker --group --start-ref v1.2.2
```

#### Paso 2: Actualizar el archivo doc/changelogs/CHANGELOG_*.md apropiado

There is a separate `CHANGELOG_Vx.md` file for each major Node.js release line. Estos están localizados en el directorio `doc/changelogs/`. Una vez que la lista con formato de cambios es recolectada, debe añadirse a la cima de los archivos del registro de cambio en el branch lanzado (p. ej. un lanzamiento para Node.js v4 sería añadido al `/doc/changelogs/CHANGELOG_V4.md`).

**Por favor *no* agregue las entradas del registro de cambios a la raíz del archivo `CHANGELOG.md`.**

La nueva entrada debe tomar la siguiente forma:

```md
<a id="x.y.x"></a>
## YYYY-MM-DD, Version x.y.z (Release Type), @releaser

### Notable changes

* List interesting changes here
* Particularly changes that are responsible for minor or major version bumps
* Also be sure to look at any changes introduced by dependencies such as npm
* ... e incluya cualquier elemento notable de ahí

### Commits

* Incluya la lista completa de los commits desde el último lanzamiento aquí. No incluir commits "Working on X.Y.Z+1".
```

El tipo de lanzamiento debe ser actual, LTS, o de mantenimiento, dependiendo del tipo de lanzamiento que se está produciendo.

You can use `branch-diff` to get a list of commits with the `notable-change` label:

```console
$ branch-diff upstream/v1.x v1.2.3-proposal --require-label=notable-change -format=simple
```

Asegúrate que la etiqueta `<a>`, así como los dos encabezados, no sean para nada intencionales.

At the top of the root `CHANGELOG.md` file, there is a table indexing all releases in each major release line. A link to the new release needs to be added to it. Follow the existing examples and be sure to add the release to the *top* of the list. The most recent release for each release line is shown in **bold** in the index. When updating the index, please make sure to update the display accordingly by removing the bold styling from the previous release.

#### Paso 3: Actualiza cualquier etiqueta REPLACEME y DEP00XX en los documentos

Si este lanzamiento incluye nuevas APIs, entonces es necesario documentar que fueron añadidas por primera vez en esta versión. Los commits relevantes deberían ya incluir las etiquetas de `REPLACEME` como en el ejemplo en los [documentos README](../tools/doc/README.md). Busca estas etiquetas con `grep REPLACEME
doc/api/*.md`, y substituye esta versión del nodo con `sed -i
"s/REPLACEME/$VERSION/g" doc/api/*.md` or `perl -pi -e "s/REPLACEME/$VERSION/g"
doc/api/*.md`.

`$VERSION` should be prefixed with a `v`.

Si este lanzamiento incluye cualquier tipo de desaprobación nueva, es necesario asegurarse que esas fueron asignadas a un código de desaprobación estático apropiado. Éstas están listadas en los documentos (vea `doc/api/deprecations.md`) y en la fuente como `DEP00XX`. Al código se le debe asignar un número (p. ej. `DEP0012`). Note that this assignment should occur when the PR is landed, but a check will be made when the release build is run.

### 5. Crear un Commit de Lanzamiento

The `CHANGELOG.md`, `doc/changelogs/CHANGELOG_Vx.md`, `src/node_version.h`, and `REPLACEME` changes should be the final commit that will be tagged for the release. Cuando se le hagan commit a esto para gitm usa el siguiente formato de mensaje:

```txt
AAAA-MM-DD, Versión x.y.z (Tipo de Lanzamiento)

Cambios notables:

* Copie la lista de cambios notables aquí, reformateado para texto simple
```

### 6. Proponer Lanzamiento en GitHub

Empuja el branch lanzado a `nodejs/node`, no a tu bifurcación propia. Esto permite que los branches lanzados sean pasados más fácilmente entre miembros del equipo de lanzamiento si es necesario.

Cree un pull request seleccionando la línea de lanzamiento correcta. For example, a `v5.3.0-proposal` PR should target `v5.x`, not master. Pega las modificaciones CHANGELOG en el cuerpo del PR para que los colaboradores puedan ver qué está cambiando. Estos PRs deberían dejarse abiertos al menos por 24 horas, y pueden ser actualizados cuando lleguen nuevos commits.

Si necesitas cualquier información adicional sobre cualquier commit, este PR es un buen lugar para @-mencionar los contribuyentes relevantes.

After opening the PR, update the release commit to include `PR-URL` metadata and force-push the proposal.

### 7. Asegurar que la Rama de Lanzamiento sea Estable

Run a **[`node-test-pull-request`](https://ci.nodejs.org/job/node-test-pull-request/)** test run to ensure that the build is stable and the HEAD commit is ready for release.

Also run a **[`node-test-commit-v8-linux`](https://ci.nodejs.org/job/node-test-commit-v8-linux/)** test run if the release contains changes to `deps/v8`.

Realice algunas pruebas de humo. There is the **[`citgm-smoker`](https://ci.nodejs.org/job/citgm-smoker/)** CI job for this purpose. Run it once with the base `vx.x` branch as a reference and with the proposal branch to check if new regressions could be introduced in the ecosystem.

### 8. Producir una Compilación Nocturna _(opcional)_

Si hay una razón para producir un lanzamiento de prueba para el propósito de hacer que otros lo prueben los instaladores o cosas específicas de las compilaciones, produce una compilación nocturna usando **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** y espera que aparezca en <https://nodejs.org/download/nightly/>. Sigue las instrucciones y coloca una longitud apropiada del commit SHA, coloca un string fecha, y selecciona "nightly" para "disttype".

Esto es particularmente recomendado si ha existido trabajo reciente relacionado a los instaladores de macOS o Windows ya que no son probados de ninguna manera por el CI.

### 9. Producir Compilaciones de Lanzamiento

Usa **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** para producir el lanzamiento de artefactos. Ingresa el commit de donde quieres compilar y seleccione "release" para "disttype".

Los artefactos de cada worker son subidos a Jenkins y están disponibles si se requieren pruebas adicionales. Usa esta oportunidad particularmente para probar los instaladores de macOS y Windows si hay alguna duda. Haz clic a través de los workers individuales para una ejecución para encontrar los artefactos.

Todos los trabajadores lanzados deberían lograr "SUCCESS" (y ser verdes, no rojos). Un lanzamientos con errores no debería ser promovido ya que probablemente hay problemas a ser investigados.

Puedes recompilar el lanzamiento tantas veces como necesites antes de promoverlos si encuentras problemas.

Si tienes un error en Windows y necesitas comenzar de nuevo, ten en cuenta que tendrás una falla inmediata a menos que esperes 2 minutos para que el enlazador se detenga de los trabajos anteriores. Es decir, si una compilación falla después que empezó a compilar, ese worker aún va a tener un proceso enlazador que está en ejecución por otro par de minutos, que van a prevenir al Jenkins de limpiar el espacio de trabajo para comenzar uno nuevo. Esto no es un gran problema, es solo una molestia, ¡porque va a resultar en otra compilación fallida si empiezas de nuevo!

ARMv7 tarda más tiempo en compilar. Desafortunadamente ccache no es tan efectiva en compilaciones ya lanzadas, creo que es porque las configuraciones macro adicionales que están en una compilación lanzada que nulifica las compilaciones previas. También la mayoría de las máquinas de compilación lanzadas son separadas a las máquinas de compilación de pruebas, para que no obtengan ningún beneficio de compilaciones en curso entre lanzamientos. Puedes esperar 1.5 horas para que el compilador ARMv7 se complete y normalmente deberías esperar que esto termine. Es posible apresurar un lanzamiento si quieres y añadir compilaciones adicionales después pero normalmente proveemos ARMv7 desde una promoción inicial.

No tienes que esperar por el / las ARMv6 / compilaciones Raspberry PR si se toman más tiempo que los otros. Solo es necesario tener el Linux principal (x64 y x86), macOS .pkg y .tar.gs, Windows (x64 y x86) .msi y .exe, fuente, encabezados, y los documentos (ambos actualmente producidos por un worker de macOS). **If you promote builds _before_ ARM builds have finished, you must repeat the promotion step for the ARM builds when they are ready**. Si la compilación ARMv6 falló por alguna razón puedes usar la compilación [`iojs-release-arm6-only`](https://ci-release.nodejs.org/job/iojs+release-arm6-only/) en el CI lanzado para volver a ejecutar la compilación solo para ARMv6. Cuando se esté lanzando la compilación asegúrate usar el mismo hash commit en cuanto al lanzamiento original.

### 10. Probar la Compilación

Jenkins recoge los artefactos de la compilación, permitiéndote descargar e instalar la nueva compilación. Asegúrese de que la compilación parezca correcta. Verifica los números de la versión, y haz algunas pruebas básicas para confirmar que todo está bien con la compilación antes de seguir adelante.

### 11. Etiquetar y Firmar el Commit de Lanzamiento

Una vez que haya producido compilaciones con las que esté feliz, cree una nueva etiqueta. Al esperar hasta esta etapa para crear etiquetas, puedes descartar un lanzamiento propuesto si algo sale mal, o si se requieren commits adicionales. Once you have created a tag and pushed it to GitHub, you ***must not*** delete and re-tag. Si cometes un error después de hacer el etiquetado, entonces deberías actualizar la versión y empezar de nuevo, y contar esa etiqueta/versión como perdida.

Los resúmenes de las etiquetas tienen un formato predecible, ve una etiqueta reciente para ver, `git tag
-v v6.0.0`. El mensaje debería ser algo así `2016-04-26 Node.js v6.0.0
(Current) Release`.

Instale el módulo npm `git-secure-tag`:

```console
$ npm install -g git-secure-tag
```

Cree una etiqueta utilizando el siguiente comando:

```console
$ git secure-tag <vx.y.z> <commit-sha> -sm 'YYYY-MM-DD Node.js vx.y.z (Release Type) Release'
```

La etiqueta **debe** ser firmada usando una clave GPG que está listada para ti en el proyecto README.

Empuja la etiqueta al repositorio antes que promuevas las compilaciones. Si no has empujado tu etiqueta primero, entonces la promoción de la compilación no funcionará correctamente. Empuja la etiqueta usando el siguiente comando:

```console
$ git push <remote> <vx.y.z>
```

*Note*: Please do not push the tag unless you are ready to complete the remainder of the release steps.

### 12. Configurar Para el Siguiente Lanzamiento

En el branch de propuesta de lanzamiento, edite `src/node_version.h` nuevamente y:

- Incremente `NODE_PATCH_VERSION` por uno
- Cambie `NODE_VERSION_IS_RELEASE` de vuelta a `0`

Realice un commit a este cambio con el siguiente formato de mensaje de commit:

```txt
Working on vx.y.z # where 'z' is the incremented patch number

PR-URL: <full URL to your release proposal PR>
```

Esto establece al branch para que las compilaciones nocturnas sean producidas con el siguiente número de versión _y_ una etiqueta de pre-lanzamiento.

Merge your release proposal branch into the stable branch that you are releasing from and rebase the corresponding staging branch on top of that.

```console
$ git checkout v1.x
$ git merge --ff-only v1.2.3-proposal
$ git push upstream v1.x
$ git checkout v1.x-staging
$ git rebase v1.x
$ git push upstream v1.x-staging
```

Selecciona cuidadosamente el commit lanzado al `master`. Después de seleccionar, edita `src/node_version.h` para asegurar que los macros de la versión contengan todos los valores que tenían previamente en el `master`. `NODE_VERSION_IS_RELEASE` debería ser `0`. **Do not** cherry-pick the "Working on vx.y.z" commit to `master`.

Run `make lint` before pushing to `master`, to make sure the Changelog formatting passes the lint rules on `master`.

### 13. Promover y Firmar las Compilaciones de Lanzamiento

**Es importante que los mismos individuos que firmaron las etiquetas lanzadas sean los que promuevan las compilaciones, como el archivo SHASUMS256.txt que necesita ser firmado ¡con la misma clave GPG!**

Usa `tools/release.sh` para promover y firmar la compilación. Cuando se ejecute, realizará las siguientes acciones:

**a.** Seleccionar una clave GPG de tus claves privadas. Usará un comando similar a: `gpg --list-secret-keys` para listar tus claves. Si no tienes ninguna clave, no funcionará. (¿Por qué estás lanzando? ¡Tu etiqueta debería estar firmada!) Si solo tienes una clave, usará esa. Si tienes más de una clave, te preguntará para que selecciones una de la lista. Asegúrate de usar la misma clave con la que firmaste tu etiqueta git.

**b.** Inicia sesión en el servidor mediante SSH y verifica por lanzamientos que pueden ser promovidos, junto con la lista de artefactos. Usará el comando `dist-promotable` en el servidor para encontrarlo. Serás preguntado, por cada lanzamiento promocionable, si quieres proceder. Si hay más de un lanzamiento para promover (que no debería existir), asegúrate de solo promocionar el lanzamiento del que eres responsable.

**c.** Inicia sesión en el servidor mediante SSH y ejecuta el script promovido para el lanzamiento dado. El comando en el servidor será similar a: `dist-promote vx.y.z`. Después de este paso, los artefactos lanzados van a estar disponibles para descarga y un archivo SHASUMS256.txt estará presente. Sin embargo, el lanzamiento seguirá sin firmar.

**d.** Usa `scp` para descargar SHASUMS256.txt a un directorio temporal en tu computadora.

**e.** Firma el archivo SHASUMS256.txt usando un comando similar a: `gpg
--default-key YOURKEY --clearsign /path/to/SHASUMS256.txt`. El GPG te pedirá tu contraseña. El archivo firmado será nombrado SHASUMS256.txt.asc.

**f.** Imprime una versión reforzada ASCII de tu clave pública GPG usando un comando similar a: `gpg --default-key YOURKEY --armor --export --output
/path/to/SHASUMS256.txt.gpg`. Esto no requiere tu contraseña y es principalmente una conveniencia para los usuarios, aunque no es la manera recomendada para obtener una copia de tu clave.

**g.** Sube los archivos SHASUMS256.txt de vuelta al servidor en el directorio del lanzamiento.

Si no esperaste por las compilaciones ARM en los pasos previos antes de promover el lanzamiento, deberías volver a ejecutar `tools/release.sh` después que las compilaciones ARM hayan terminado. Eso moverá los artefactos ARM a la locación correcta. Te será pedido que vuelvas a firmar SHASUMS256.txt.

It is possible to only sign a release by running `./tools/release.sh -s
vX.Y.Z`.

### 14. Verificar el Lanzamiento

Tu lanzamiento debería estar disponible en `https://nodejs.org/dist/vx.y.z/` y en <https://nodejs.org/dist/latest/>. Verifica que los archivos apropiados están en su lugar. Puede que quieras verificar que los binarios están trabajando de manera apropiada y que tengan los strings de versión interna correctos. Verifica que los documentos API están disponibles en <https://nodejs.org/api/>. Check that the release catalog files are correct at <https://nodejs.org/dist/index.tab> and <https://nodejs.org/dist/index.json>.

### 15. Crear una Entrada en el Blog

Hay una compilación automática que es iniciada cuando promueves nuevas compilaciones, entonces en unos pocos minutos nodejs.org listará tu nueva versión como el último lanzamiento. Sin embargo, la entrada en el blog aún no es completamente automática.

Crea una nueva entrada del blog ejecutando [nodejs.org release-post.js script](https://github.com/nodejs/nodejs.org/blob/master/scripts/release-post.js). Este script usará las compilaciones promovidas y el registro de cambios para generar el post. Ejecuta `npm run serve` para ver previamente el post localmente antes de subirlo al repositorio [nodejs.org](https://github.com/nodejs/nodejs.org).

- Puedes añadir un blurb corto debajo del encabezado principal si quieres decir algo importante, de otra manera el texto debería estar listo para la publicación.
- Los enlaces a los archivos descargados no serán completados a menos que hayas esperado por las compilaciones ARMv6. Cualquier descarga que falte tendrá `*Coming soon*` al lado. Es tu responsabilidad actualizar manualmente estos luego, cuando tengas compilaciones sobresalientes.
- El contenido de SHASUMS256.txt.asc está en la parte inferior de la publicación. Cuando actualizas la lista de tarballs, necesitarás copiar/pegar los nuevos contenidos en este archivo para reflejar esos cambios.
- Siempre usa pull-requests en el repositorio de nodejs.org. Se respetuoso con ese grupo de trabajo, pero no deberías tener que esperar a que el PR termine. Abrir un PR y fusionarlo inmediatamente _debería_ estar bien. Sin embargo, por favor sigue el siguiente formato del mensaje commit:

  ```console
  Blog: vX.Y.Z release post

  Refs: <full URL to your release proposal PR>
  ```

- Cambios al `master` en el repositorio de nodejs.org van a activar una nueva compilación de nodejs.org, entonces tus cambios deberían aparecer en unos minutos luego de empujar.

### 16. Create the release on GitHub

- Go to the [New release page](https://github.com/nodejs/node/releases/new).
- Select the tag version you pushed earlier.
- For release title, copy the title from the changelog.
- For the description, copy the rest of the changelog entry.
- Click on the "Publish release" button.

### 17. Limpiar

Close your release proposal PR and delete the proposal branch.

### 18. Anunciar

El sitio web nodejs.org va a recompilar automáticamente e incluir la nueva versión. Para anunciar la compilación en Twitter a traves de la cuenta oficial @nodejs, envia un correo electrónico a [pr@nodejs.org](mailto:pr@nodejs.org) con un mensaje como:

> salió la v5.8.0 de @nodejs: https://nodejs.org/en/blog/release/v5.8.0/ … aqlgo aquí sobre los cambios notables

Para asegurar que la comunicación está sincronizada con la entrada del blog, por favor permite una notificación previa de 24 horas. If known, please include the date and time the release will be shared with the community in the email to coordinate these announcements.

Ping the IRC ops and the other [Partner Communities](https://github.com/nodejs/community-committee/blob/master/governance/PARTNER_COMMUNITIES.md) liaisons.

### 19. Celebrar

_De cualquier forma que hagas esto..._
