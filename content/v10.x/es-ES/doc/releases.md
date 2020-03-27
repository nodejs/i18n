# Proceso de Lanzamiento de Node.js

Este documento describe los aspectos técnicos del proceso de lanzamiento de Node.js. La audiencia prevista son aquellos que han sido autorizados por el Comité de Dirección Técnica (TSC por sus siglas en inglés) de la Fundación Node.js para crear, promover y firmar versiones oficiales de lanzamiento para Node.js, alojadas en <https://nodejs.org/>.

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
  * [8. Producir una Compilación Nocturna *(opcional)*](#8-produce-a-nightly-build-optional)
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

### 1. Acceso del Lanzamiento Jenkins

Hay tres trabajos de Jenkins relevantes que deben ser usados para un flujo liberado:

**a.** **Ejecuciones de prueba:** **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** es utilizado para una prueba final completa para asegurar de que el *HEAD* actual sea estable.

**b.** **Compilaciones nocturnas** (opcional) **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** puede ser utilizado para crear un lanzamiento nocturno para el *HEAD* actual si se requieren lanzamientos de pruebas públicas. Las compilaciones activadas con este trabajo son publicadas directamente en <https://nodejs.org/download/nightly/> y están disponibles para su descarga pública.

**c.** **Compilaciones de lanzamiento:** **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** hace todo el trabajo para compilar todos los activos de lanzamiento requeridos. La promoción de archivos de lanzamiento es un paso manual una vez que estén listos (vea a continuación).

El [Equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proporcionar este acceso a individuos autorizados por el TSC.

### 2. <nodejs.org> Acceso

El usuario *dist* en nodejs.org controla los activos disponibles en <https://nodejs.org/download/>. <https://nodejs.org/dist/> es un alias para <https://nodejs.org/download/release/>.

The Jenkins release build workers upload their artifacts to the web server as the *staging* user. El usuario *dist* tiene acceso para mover estos activos a acceso público, mientras que, por seguridad, el usuario *staging* no lo tiene.

Nightly builds are promoted automatically on the server by a cron task for the *dist* user.

Release builds require manual promotion by an individual with SSH access to the server as the *dist* user. El [Equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proporcionar este acceso a individuos autorizados por el TSC.

### 3. Una clave GPG pública

A SHASUMS256.txt file is produced for every promoted build, nightly, and releases. Adicionalmente para los lanzamientos, este archivo es firmado por el individuo responsable por dicho lanzamiento. Para poder verificar los binarios descargados, el público debería ser capaz de verificar que el archivo HASUMS256.txt ha sido firmado por alguien que ha sido autorizado para crear un lanzamiento.

Las claves GPG deberían ser rescatables de un keyserver conocido de terceros. The SKS Keyservers at <https://sks-keyservers.net> are recommended. Utilice el formulario de [envío](https://pgp.mit.edu/) para enviar una nueva clave GPG. Las claves deben ser rescatables a través de:

```console
$ gpg --keyserver pool.sks-keyservers.net --recv-keys <FINGERPRINT>
```

La clave que uses pudiera ser una clave secundaria/subclave de una clave existente.

Additionally, full GPG key fingerprints for individuals authorized to release should be listed in the Node.js GitHub README.md file.

## Cómo crear un lanzamiento

Notas:

* Las fechas listadas a continuación como *"AAAA-MM-DD"* deben ser la fecha del lanzamiento **como UTC**. Utilice `date -u +'%Y-%m-%d'` para descubrir qué es esto.
* Version strings are listed below as *"vx.y.z"* or *"x.y.z"*. Substituto para la versión de lanzamiento.
* Examples will use the fictional release version `1.2.3`.

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

* Run or check that there is a passing CI.
* Check approvals (you can approve yourself).
* Check that the commit metadata was not changed from the `master` commit.
* If there are merge conflicts, ask the PR author to rebase. Simple conflicts can be resolved when landing.

When landing the PR add the `Backport-PR-URL:` line to each commit. Close the backport PR with `Landed in ...`. Update the label on the original PR from `backport-requested-vN.x` to `backported-to-vN.x`.

To determine the relevant commits, use [`branch-diff`](https://github.com/nodejs/branch-diff). The tool is available on npm and should be installed globally or run with `npx`. It depends on our commit metadata, as well as the GitHub labels such as `semver-minor` and `semver-major`. Un inconveniente es que, cuando los metadatos `PR-URL` son accidentalmente omitidos de un commit, el commit va a aparecer debido a que no es seguro si es un duplicado o no.

Para una lista de commits que pudieran llegar en un lanzamiento de parche en v1.x:

```console
$ branch-diff v1.x-staging master --exclude-label=semver-major,semver-minor,dont-land-on-v1.x,backport-requested-v1.x --filter-release --format=simple
```

Previous release commits and version bumps do not need to be cherry-picked.

Carefully review the list of commits:

* Checking for errors (incorrect `PR-URL`)
* Checking semver status - Commits labeled as `semver-minor` or `semver-major` should only be cherry-picked when appropriate for the type of release being made.
* If you think it's risky so should wait for a while, add the `baking-for-lts` tag.

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

Establezca la versión para el lanzamiento propuesto utilizando los siguientes macros, los cuales ya están definidos en `src/node_version.h`:

```c
#define NODE_MAJOR_VERSION x
#define NODE_MINOR_VERSION y
#define NODE_PATCH_VERSION z
```

Establezca el valor del macro `NODE_VERSION_IS_RELEASE` a `1`. This causes the build to be produced with a version string that does not have a trailing pre-release tag:

```c
#define NODE_VERSION_IS_RELEASE 1
```

**También considera si se debe saltar `NODE_MODULE_VERSION`**:

Este macro es utilizado para señalar una versión de ABI para complementos nativos. Actualmente tiene dos usos comunes en la comunidad:

* Determinar qué API funciona en contra para compilar complementos nativos, p. ej., [NAN](https://github.com/nodejs/nan) lo utiliza para formar una capa de compatibilidad para mucho de lo que envuelve.
* Determinar el ABI para descargar binarios pre-compilados de complementos nativos, p. ej., [node-pre-gyp](https://github.com/mapbox/node-pre-gyp) utiliza este valor como fue expuesto a través de `process.versions.modules` para ayudar a determinar el binario apropiado para descargar en tiempo de instalación.

La regla general es saltar esta versión cuando hayan cambios *abruptos de ABI* y también si hay cambios no triviales de API. Las reglas aún no están estrictamente definidas, así que en caso de duda, por favor confiera con alguien que tenga una perspectiva más informada, como un miembro del equipo NAN.

It is current TSC policy to bump major version when ABI changes. If you see a need to bump `NODE_MODULE_VERSION` then you should consult the TSC. Los commits pudieran necesitar ser revertidos, opudiera ser necesario que ocurra un salto de una versión mayor.

### 4. Actualizar el Changelog

#### Step 1: Collect the formatted list of changes

Recolecte una lista formateada de commits desde el último lanzamiento. Use [`changelog-maker`](https://github.com/nodejs/changelog-maker) to do this:

```console
$ changelog-maker --group
```

Note that changelog-maker counts commits since the last tag and if the last tag in the repository was not on the current branch you may have to supply a `--start-ref` argument:

```console
$ changelog-maker --group --start-ref v1.2.2
```

#### Paso 2:Actualizar el archivo doc/changelogs/CHANGELOG_*.md apropiado

There is a separate `CHANGELOG_Vx.md` file for each major Node.js release line. Estos están localizados en el directorio `doc/changelogs/`. Once the formatted list of changes is collected, it must be added to the top of the relevant changelog file in the release branch (e.g. a release for Node.js v4 would be added to the `/doc/changelogs/CHANGELOG_V4.md`).

**Por favor *no* agregue las entradas del registro de cambios a la raíz del archivo `CHANGELOG.md`.**

La nueva entrada debe tomar la siguiente forma:

```md
<a id="x.y.x"></a>
## AAAA-MM-DD, Versión x.y.z (Tipo de Lanzamiento), @lanzador

### Cambios notables

* Liste cambios interesantes aquí
* Particularmente cambios que sean responsables de saltos de versión menores o mayores
* También asegúrese de mirar cualquier cambio introducido por dependencias como npm
* ... e incluya cualquier elemento notable de ahí

### Commits

* Incluya la lista completa de los commits desde el último lanzamiento aquí. No incluir commits "Working on X.Y.Z+1".
```

El tipo de lanzamiento debe ser Actual, LTS o de Mantenimiento, dependiendo del tipo de lanzamiento que se está produciendo.

You can use `branch-diff` to get a list of commits with the `notable-change` label:

```console
$ branch-diff upstream/v1.x v1.2.3-proposal --require-label=notable-change -format=simple
```

Be sure that the `<a>` tag, as well as the two headings, are not indented at all.

At the top of the root `CHANGELOG.md` file, there is a table indexing all releases in each major release line. A link to the new release needs to be added to it. Follow the existing examples and be sure to add the release to the *top* of the list. The most recent release for each release line is shown in **bold** in the index. When updating the index, please make sure to update the display accordingly by removing the bold styling from the previous release.

#### Paso 3: Actualiza cualquier etiqueta REPLACEME y DEP00XX en los documentos

If this release includes new APIs then it is necessary to document that they were first added in this version. The relevant commits should already include `REPLACEME` tags as per the example in the [docs README](../tools/doc/README.md). Busca estas etiquetas con `grep REPLACEME
doc/api/*.md`, y substituye esta versión del nodo con `sed -i
"s/REPLACEME/$VERSION/g" doc/api/*.md` or `perl -pi -e "s/REPLACEME/$VERSION/g"
doc/api/*.md`.

`$VERSION` should be prefixed with a `v`.

If this release includes any new deprecations it is necessary to ensure that those are assigned a proper static deprecation code. These are listed in the docs (see `doc/api/deprecations.md`) and in the source as `DEP00XX`. The code must be assigned a number (e.g. `DEP0012`). Note that this assignment should occur when the PR is landed, but a check will be made when the release build is run.

### 5. Crear un Commit de Lanzamiento

The `CHANGELOG.md`, `doc/changelogs/CHANGELOG_Vx.md`, `src/node_version.h`, and `REPLACEME` changes should be the final commit that will be tagged for the release. Cuando se le hagan commit a esto para gitm usa el siguiente formato de mensaje:

```txt
AAAA-MM-DD, Versión x.y.z (Tipo de Lanzamiento)

Cambios notables:

* Copie la lista de cambios notables aquí, reformateado para texto simple
```

### 6. Proponer Lanzamiento en GitHub

Empuja el branch lanzado a `nodejs/node`, no a tu bifurcación propia. This allows release branches to more easily be passed between members of the release team if necessary.

Cree un pull request seleccionando la línea de lanzamiento correcta. For example, a `v5.3.0-proposal` PR should target `v5.x`, not master. Pegue las modificaciones del CHANGELOG en el cuerpo del PR para que los colaboradores puedan ver qué está cambiando. Estos PRs deberían dejarse abiertos por al menos 24 horas, y pueden ser actualizados cuando lleguen nuevos commits.

Si necesita cualquier información adicional acerca de cualquiera de los commits, este PR es un buen lugar para @-mencionar a los contribuyentes relevantes.

After opening the PR, update the release commit to include `PR-URL` metadata and force-push the proposal.

### 7. Asegurar que la Rama de Lanzamiento sea Estable

Run a **[`node-test-pull-request`](https://ci.nodejs.org/job/node-test-pull-request/)** test run to ensure that the build is stable and the HEAD commit is ready for release.

Also run a **[`node-test-commit-v8-linux`](https://ci.nodejs.org/job/node-test-commit-v8-linux/)** test run if the release contains changes to `deps/v8`.

Realice algunas pruebas de humo. There is the **[`citgm-smoker`](https://ci.nodejs.org/job/citgm-smoker/)** CI job for this purpose. Run it once with the base `vx.x` branch as a reference and with the proposal branch to check if new regressions could be introduced in the ecosystem.

### 8. Producir una Compilación Nocturna *(opcional)*

Si hay una razón para producir un lanzamiento de prueba con el propósito de hacer que otros prueben los instaladores o cosas específicas de las compilaciones, produzca una compilación nocturna utilizando **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** y espere a que aparezca en <https://nodejs.org/download/nightly/>. Follow the directions and enter a proper length commit SHA, enter a date string, and select "nightly" for "disttype".

Esto es particularmente recomendado si ha existido trabajo reciente relacionado a los instaladores de macOS o Windows ya que no son probados de ninguna manera por el CI.

### 9. Producir Compilaciones de Lanzamiento

Utilice **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** para producir artefactos de lanzamiento. Ingrese el commit de donde desee compilar y seleccione "release" para "disttype".

Los artefactos de cada worker son subidos a Jenkins y están disponibles si se requieren pruebas adicionales. Utilice esta oportunidad particularmente para probar los instaladores de macOS y Windows si hay alguna duda. Haga clic a través de los workers individuales para una ejecución para encontrar los artefactos.

Todos los trabajadores lanzados deberían lograr "SUCCESS" (y ser verdes, no rojos). Un lanzamiento con fallos no debería ser promovido ya que probablemente hay problemas a ser investigados.

Puede recompilar el lanzamiento cuantas veces necesite antes de promoverlos si encuentra problemas.

Si tiene un error en Windows y necesita comenzar de nuevo, tenga en cuenta que tendrá una falla inmediata a menos que espere 2 minutos para que el enlazador se detenga de trabajos anteriores. i.e. if a build fails after having started compiling, that worker will still have a linker process that's running for another couple of minutes which will prevent Jenkins from clearing the workspace to start a new one. Esto no es un problema grande, es solo una molestia, ¡porque resultará en otra compilación fallida si empieza de nuevo!

ARMv7 tarda más tiempo en compilar. Desafortunadamente, ccache no es tan efectivo en compilaciones de lanzamiento, creo que es debido a configuraciones macro adicionales que van a la compilación de lanzamiento que anula compilaciones previas. También la mayoría de las máquinas de compilación de lanzamientos son separadas para probar las máquinas de compilación, para que no obtengan ningún beneficio de compilaciones en curso entre lanzamientos. Puede esperar 1.5 horas para que el compilador ARMv7 se complete y normalmente debería esperar a que esto termine. Es posible apresurar un lanzamiento si lo desea y añadir compilaciones adicionales después, pero usualmente nosotros proporcionamos ARMv7 desde una promoción inicial.

No tiene que esperar por las compilaciones de ARMv6 / Raspberry PI si se toman más tiempo que las otras. It is only necessary to have the main Linux (x64 and x86), macOS .pkg and .tar.gz, Windows (x64 and x86) .msi and .exe, source, headers, and docs (both produced currently by an macOS worker). **Si usted promueve compilaciones *antes* de que las compilaciones ARM hayan terminado, debe repetir el paso de promoción para las compilaciones ARM cuando estén listas**. If the ARMv6 build failed for some reason you can use the [`iojs-release-arm6-only`](https://ci-release.nodejs.org/job/iojs+release-arm6-only/) build in the release CI to re-run the build only for ARMv6. When launching the build make sure to use the same commit hash as for the original release.

### 10. Probar la Compilación

Jenkins recoge los artefactos de las compilaciones, permitiéndole descargar e instalar la nueva compilación. Asegúrese de que la compilación parezca correcta. Verifique los números de versión y realice algunas verificaciones básicas para confirmar que todo estén bien con la compilación antes de seguir adelante.

### 11. Etiquetar y Firmar el Commit de Lanzamiento

Una vez que haya producido compilaciones con las que esté feliz, cree una nueva etiqueta. Al esperar hasta este etapa de crear etiquetas, puede descargar un lanzamiento propuesto si algo va mal o si se requieren commits adicionales. Once you have created a tag and pushed it to GitHub, you ***must not*** delete and re-tag. Si comete algún error después de realizar el etiquetado, entonces tendrá que actualizar la versión y comenzar de nuevo, y contar esta etiqueta/versión como perdida.

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

La etiqueta **debe** ser firmada utilizando la clave GPG que está listada para usted en el proyecto README.

Empuja la etiqueta al repositorio antes que promuevas las compilaciones. If you haven't pushed your tag first, then build promotion won't work properly. Push the tag using the following command:

```console
$ git push <remote> <vx.y.z>
```

*Note*: Please do not push the tag unless you are ready to complete the remainder of the release steps.

### 12. Configurar Para el Siguiente Lanzamiento

En el branch de propuesta de lanzamiento, edite `src/node_version.h` nuevamente y:

* Incremente `NODE_PATCH_VERSION` por uno
* Cambie `NODE_VERSION_IS_RELEASE` de vuelta a `0`

Realice un commit a este cambio con el siguiente formato de mensaje de commit:

```txt
Working on vx.y.z # where 'z' is the incremented patch number

PR-URL: <full URL to your release proposal PR>
```

Esto configura la rama para que las compilaciones nocturnas sean producidas con el siguiente número de versión *y* una etiqueta de pre-lanzamiento.

Merge your release proposal branch into the stable branch that you are releasing from and rebase the corresponding staging branch on top of that.

```console
$ git checkout v1.x
$ git merge --ff-only v1.2.3-proposal
$ git push upstream v1.x
$ git checkout v1.x-staging
$ git rebase v1.x
$ git push upstream v1.x-staging
```

Selecciona cuidadosamente el commit lanzado al `master`. After cherry-picking, edit `src/node_version.h` to ensure the version macros contain whatever values were previously on `master`. `NODE_VERSION_IS_RELEASE` debería ser `0`. **Do not** cherry-pick the "Working on vx.y.z" commit to `master`.

Run `make lint` before pushing to `master`, to make sure the Changelog formatting passes the lint rules on `master`.

### 13. Promover y Firmar las Compilaciones de Lanzamiento

**Es importante que el mismo individuo que firmó la etiqueta de lanzamiento sea el mismo que promueva las compilaciones, ¡ya que el archivo SHASUMS256.txt necesita ser firmado con la misma clave GPG!**

Usa `tools/release.sh` para promover y firmar la compilación. Cuando se ejecute, realizará las siguientes acciones:

**a.** Seleccionar una clave GPG de tus claves privadas. Utilizará un comando similar a: `gpg --list-secret-keys` para listar sus claves. Si no tiene ninguna clave, no funcionará. (¿Por qué estás lanzando? ¡Su etiqueta debería estar firmada!) Si sólo tiene una clave, usará esa. Si tiene más de una clave, le pedirá que seleccione una de la lista. Asegúrese de utilizar la misma clave con la que usted firmó su etiqueta git.

**b.** Iniciar sesión en el servidor mediante SSH y verificar por lanzamientos que puedan ser promovidos, en conjunto con la lista de artefactos. Utilizará el comando `dist-promotable` en el servidor para encontrarlos. Se le preguntará, por cada lanzamiento promocionable, si desea proceder. Si hay más de un lanzamiento para promover (que no debería haber), asegúrese de sólo promover el lanzamiento por el cual usted es responsable.

**c.** Iniciar sesión en el servidor mediante SSH y ejecutar el script de promoción para el lanzamiento dado. El comando en el servidor será similar a: `dist-promote vx.y.z`. Luego de este paso, los artefactos de lanzamiento estarán disponibles para descargar y el archivo SHASUMS256.txt estará presente. Sin embargo, el lanzamiento seguirá sin estar firmado.

**d.** Utilice `scp` para descargar SHASUMS256.txt en un directorio temporal en su computador.

**e.** Firma el archivo SHASUMS256.txt usando un comando similar a: `gpg
--default-key YOURKEY --clearsign /path/to/SHASUMS256.txt`. El GPG le pedirá su contraseña. El archivo firmado será nombrado SHASUMS256.txt.asc.

**f.** Output an ASCII armored version of your public GPG key using a command similar to: `gpg --default-key YOURKEY --armor --export --output
/path/to/SHASUMS256.txt.gpg`. Esto no requiere su contraseña y es principalmente una conveniencia para los usuarios, aunque no es la manera recomendada para obtener una copia de su clave.

**g.** Subir los archivos SHASUMS256.txt de vuelta al servidor en el directorio de lanzamiento.

Si no esperó por las compilaciones ARM en el paso anterior antes de promover el lanzamiento, debería ejecutar nuevamente `tools/release.sh` luego de que las compilaciones ARM hayan finalizado. Eso moverá los artefactos ARM a la locación correcta. Se le pedirá que vuelva a firmar el archivo SHASUMS256.txt.

It is possible to only sign a release by running `./tools/release.sh -s
vX.Y.Z`.

### 14. Verificar el Lanzamiento

Su lanzamiento debería estar disponible en `https://nodejs.org/dist/vx.y.z/` y <https://nodejs.org/dist/latest/>. Verifique que los archivos apropiados estén en su lugar. Puede que quiera verificar que los binarios estén funcionando de manera adecuada y que tengan los strings de versión interna correctos. Verifique que los documentos API estén disponibles en <https://nodejs.org/api/>. Verifique que los archivos del catálogo de lanzamiento estén correctos en <https://nodejs.org/dist/index.tab> y <https://nodejs.org/dist/index.json>.

### 15. Crear una Entrada en el Blog

Hay una compilación automática que es iniciada cuando promueve nuevas compilaciones, entonces en unos minutos nodejs.org listará su nueva versión como el último lanzamiento. Sin embargo, la entrada en el blog aún no es completamente automática.

Crea una nueva entrada del blog ejecutando [nodejs.org release-post.js script](https://github.com/nodejs/nodejs.org/blob/master/scripts/release-post.js). Este script usará las compilaciones promovidas y el registro de cambios para generar el post. Ejecute `npm run serve` para ver previamente la entrada localmente antes de subirla al repositorio de [nodejs.org](https://github.com/nodejs/nodejs.org).

* You can add a short blurb just under the main heading if you want to say something important, otherwise the text should be publication ready.
* Los enlaces a los archivos de descarga no estarán completos a menos que haya esperado por las compilaciones de ARMv6. Cualquier descarga que falte tendrá un `*Coming soon*` a su lado. Es su responsabilidad actualizarlos manualmente cuando tenga las compilaciones sobresalientes.
* El contenido de SHASUMS256.txt.asc está en la parte inferior de la publicación. When you update the list of tarballs you'll need to copy/paste the new contents of this file to reflect those changes.
* Siempre usa pull-requests en el repositorio de nodejs.org. Sea respetuoso con ese grupo de trabajo, pero no debería tener que esperar a que el PR termine. Opening a PR and merging it immediately *should* be fine. Sin embargo, por favor sigue el siguiente formato de mensaje del commit:
  
  ```console
  Blog: vX.Y.Z release post
  
  Refs: <full URL to your release proposal PR>
  ```

* Los cambios al `master` en el repositorio de nodejs.org van a activar una nueva compilación de nodejs.org, entonces sus cambios deberían aparecer unos minutos después de subirlo.

### 16. Create the release on GitHub

* Go to the [New release page](https://github.com/nodejs/node/releases/new).
* Select the tag version you pushed earlier.
* For release title, copy the title from the changelog.
* For the description, copy the rest of the changelog entry.
* Click on the "Publish release" button.

### 17. Limpiar

Close your release proposal PR and delete the proposal branch.

### 18. Anunciar

El sitio web nodejs.org va a recompilar automáticamente e incluir la nueva versión. Para anunciar la compilación en Twitter a través de la cuenta oficial @nodejs, envíe un correo a <pr@nodejs.org> como un mensaje como el siguiente:

> Salió la v5.8.0 de @nodejs: https://nodejs.org/en/blog/release/v5.8.0/ … algo aquí sobre cambios notables

Para asegurar que la comunicación esté sincronizada con la entrada del blog, por favor permita una notificación previa de 24 horas. Si se conoce, por favor incluya la fecha y la hora en la cual el lanzamiento será compartido con la comunidad en el correo para coordinar estos anuncios.

Ping the IRC ops and the other [Partner Communities](https://github.com/nodejs/community-committee/blob/master/governance/PARTNER_COMMUNITIES.md) liaisons.

### 19. Celebrar

*De cualquier forma que hagas esto...*