# Proceso de lanzamiento de Node.js

Este documento describe los aspectos técnicos del proceso de lanzamiento de Node.js. La audiencia prevista son quienes han sido autorizados por el Comité de Dirección Técnica (TSC) de la Fundación Node.js para crear, promover y firmar versiones oficiales de lanzamiento para Node.js, alojadas en <https://nodejs.org/>.

## ¿Quién puede hacer un lanzamiento?

La autorización del lanzamiento es dada por el TSC de Node.js. Una vez autorizado, un individuo debe tener lo siguiente:

### 1. Acceso del Lanzamiento Jenkins

Hay tres trabajos de Jenkins relevantes que deben ser usados para un flujo liberado:

**a.** **Pruebas:** **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** es usado para una prueba final para asegurar que el *ENCABEZADO* actual es estable.

**b.** **Compilaciones nocturnas:** (opcional) **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** puede ser usado para crear un lanzamiento nocturno para el *ENCABEZADO* actual si se requiere lanzamientos de pruebas públicas. Las compilaciones activadas con este trabajo son publicadas directamente en <https://nodejs.org/download/nightly/> y se encuentran disponibles para su descarga pública.

**c.** **Compilaciones liberadas:** **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** hace todo el trabajo de compilar todos los activos de lanzamiento requeridos. La promoción de los archivos de lanzamiento es un paso manual una vez que están listos (véase a continuación).

El [equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proveer este acceso a personas individuales autorizadas por el TSC.

### 2. <nodejs.org> Acceso

El usuario *dist* en nodejs.org controla los activos disponibles en <https://nodejs.org/download/>. <https://nodejs.org/dist/> es un alias para <https://nodejs.org/download/release/>.

Los workers de la compilación del lanzamiento Jenkins workers sube los artefactos al servidor web como el usuario *staging*. El usuario *dist* tiene acceso para mover estos activos a acceso público mientras que, por seguridad, no lo tiene el usuario *staging*.

Las compilaciones nocturnas son promovidas automáticamente en el servidor por una tarea cron para el usuario *dist*.

Las compilaciones liberadas requieren promoción manual por una persona individual con acceso SSH en el servidor como el usuario*dist*. El [equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proveer este acceso a personas individuales autorizadas por el TSC.

### 3. Una clave GPG pública

Un archivo SHASUMS256.txt es producido por cada compilación promovida, cada noche, y lanzamientos. Adicionalmente para los lanzamientos, este archivo es firmado por la persona individual responsable de ese lanzamiento. Para poder verificar binarios descargados, el publico debería ser capaz de verificar que el archivo SHASUMS256.txt ha sido firmado por alguien que ha sido autorizado para crear un lanzamiento.

Las claves GPG deberían ser rescatables de un keyserver conocido de terceros. Son recomendados los Keyservers SKS en <https://sks-keyservers.net>. Usa el formulario de [envío](https://pgp.mit.edu/) para enviar una nueva clave GPG. Las claves deberían ser rescatables usando:

```console
$ gpg --keyserver pool.sks-keyservers.net --recv-keys <FINGERPRINT>
```

La clave que uses pudiera ser una clave secundaria/subclave de una clave existente.

Además, huellas de clave GPG completas para individuos autorizados para hacer el lanzamiento deberían estar listadas en el archivo Node.js GitHub README.md.

## Cómo crear un lanzamiento

Notas:

- Las fechas listadas a continuación como *"AAAA-MM-DD"* deberían ser la fecha del lanzamiento **como UTC**. Usa `date -u +'%Y-%m-%d'` para descubrir qué es esto.
- Las versiones de strings están listadas a continuación como *"vx.y.z"*. Substituto para la versión liberada.

### 1. Selecciona cuidadosamente desde `master` y otras branches

Crea un nuevo branch llamado *"vx.y.z-proposal"*, o algo similar. Usar `git
cherry-pick`, trae los commits apropiados en tu nuevo branch. Para determinar los commits relevantes, usa [`branch-diff`](https://github.com/rvagg/branch-diff) y [`changelog-maker`](https://github.com/rvagg/changelog-maker/) (ambos están disponibles en npm y deberían ser instalados globalmente). Estas herramientas dependen de nuestros metadatos del commit, así como las etiquetas `semver-minor` y `semver-major` de GitHub. Un inconveniente es que cuando los metadatos `PR-URL` son accidentalmente omitidos de un commit, el commit va a aparecer porque no es seguro si es un duplicado o no.

Para una lista de commits que pudieran llegar en un lanzamiento de parche en v5.x:

```console
$ branch-diff v5.x master --exclude-label=semver-major,semver-minor,dont-land-on-v5.x --filter-release --format=simple
```

Revisa cuidadosamente la lista de commits que buscan errores (`PR-URL` incorrecto, semver incorrecto, etc.). Los commits etiquetados como semver menor o semver mayor deberían solo ser seleccionados cuando sea apropiado por el tipo de lanzamiento que se esté haciendo. Los commits de lanzamientos anteriores y saltos de la versión no necesitan ser seleccionados.

### 2. Actualizar `src/node_version.h`

Establece la versión para el lanzamiento propuesto usando los siguientes macros, que ya están definidos en `src/node_version.h`:

```c
#define NODE_MAJOR_VERSION x
#define NODE_MINOR_VERSION y
#define NODE_PATCH_VERSION z
```

Establece el valor macro `NODE_VERSION_IS_RELEASE` a `1`. Esto causa que la compilación sea producida con una versión string que no tiene una etiqueta de pre-lanzamiento al final:

```c
#define NODE_VERSION_IS_RELEASE 1
```

**También considera si se debe saltar `NODE_MODULE_VERSION`**:

Este macro es usado para señalar una versión ABI para complementos nativos. Actualmente tiene dos usos comunes en la comunidad:

- Determinar qué API funciona en contra para compilar complementos nativos, p. ej. [NAN](https://github.com/nodejs/nan) lo usa para formar una capa de compatibilidad para mucho de lo que envuelve.
- Determinar el ABI para descargar binarios pre-compilados de complementos nativos, p. ej. [node-pre-gyp](https://github.com/mapbox/node-pre-gyp) usa este valor como fue expuesto por `process.versions.modules` para ayudar a determinar el binario apropiado para descargar en tiempo de instalación.

La regla general es saltar esta versión cuando hay cambios de *rompimiento ABI*, y también si hay cambios API no-triviales. Las reglas aún no están estrictamente definidas, en caso de duda, por favor confiere con alguien que tendrá una perspectiva más informada, como un miembro del equipo NAN.

*Note*: Es la política TSC actual saltar una versión mayor cuando ABI cambia. Si ves una necesidad de saltar `NODE_MODULE_VERSION`, entonces deberías consultar el TSC. Los commits pudieran necesitar ser revertidos, opudiera ser necesario que ocurra un salto de una versión mayor.

### 3. Actualizar el Registro de Cambios

#### Paso 1: Recolectar la lista con formato de cambios:

Recolectar una lista con formato de los commits desde el último lanzamiento. Usa [`changelog-maker`](https://github.com/rvagg/changelog-maker) para hacer esto:

```console
$ changelog-maker --group
```

Ten en cuenta que, el creador de registro de cambios cuenta los commits desde la última etiqueta, y si la última etiqueta en el repositorio no estaba en el branch actual, puede ser que tengas que suministrar un argumento `--start-ref`:

```console
$ changelog-maker --group --start-ref v2.3.1
```

#### Paso 2:Actualizar el archivo doc/changelogs/CHANGELOG_*.md apropiado

Hay un archivo `CHANGELOG_*.md` separado por cada línea de lanzamiento mayor de Node.js. Estos están localizados en el directorio `doc/changelogs/`. Una vez que la lista con formato de cambios es recolectada, debe añadirse a la cima de los archivos del registro de cambio en el branch lanzado (p. ej. un lanzamiento para Node.js v4 sería añadido al `/doc/changelogs/CHANGELOG_V4.md`).

**Por favor *no* añadas las entradas al registro de cambios al archivo `CHANGELOG.md` de raíz.**

La nueva entrada debe tomar la siguiente forma:

```md
<a id="x.y.x"></a>
## YYYY-MM-DD, Version x.y.z (Release Type), @releaser

### Notable changes

* List interesting changes here
* Particularly changes that are responsible for minor or major version bumps
* Also be sure to look at any changes introduced by dependencies such as npm
* ... and include any notable items from there

### Commits

* Include the full list of commits since the last release here. Do not include "Working on X.Y.Z+1" commits.
```

El tipo de lanzamiento debe ser actual, LTS, o de mantenimiento, dependiendo del tipo de lanzamiento que se está produciendo.

Asegúrate que la etiqueta `<a>`, así como los dos encabezados, no sean para nada intencionales.

En la cima de cada archivo `CHANGELOG_*.md`, y en el archivo `CHANGELOG.md` raíz, hay una tabla de indexación de todas los lanzamientos en cada línea de lanzamiento mayor. Un enlace para el nuevo lanzamiento necesita ser añadido a cada uno. Sigue los siguientes ejemplos y asegúrate de añadir el lanzamiento a la *cima* de la lista.

En el archivo raíz `CHANGELOG.md`, el lanzamiento más reciente para cada línea de lanzamiento es mostrado en **negrita** en el índice. Cuando se actualice el índice, por favor asegúrate de actualizar la pantalla en consecuencia de remover el estilo negrita de la versión previa.

#### Paso 3: Actualiza cualquier etiqueta REPLACEME y DEP00XX tags en los documentos

Si este lanzamiento incluye APIs nuevas, entonces es necesario documentar que fueron añadidas por primera vez en esta versión. Los commits relevantes deberían ya incluir etiquetas `REPLACEME` como en el ejemplo en el [documento README](../tools/doc/README.md). Busca estas etiquetas con `grep REPLACEME
doc/api/*.md`, y substituye esta versión del nodo con `sed -i
"s/REPLACEME/$VERSION/g" doc/api/*.md` or `perl -pi -e "s/REPLACEME/$VERSION/g"
doc/api/*.md`.

*Nota*: `$VERSION` se le deberia ser prefijada con `v`.

Si este lanzamiento incluye cualquier nueva desaprobación es necesario asegurarse que esas fueron asignadas un código estático de desaprobación apropiado. Estos están listados en el documento (see `doc/api/deprecations.md`) and in the source as `DEP00XX`. El código se le debe asignar un número (p. ej. `DEP0012`). Tenga en cuenta que esta asignación debería ocurrir cuando el PR es aterrizado, pero una verificación será realizada cuando la compilación lanzada es ejecutada.

### 4. Crear Lanzamiento del Commit

Los cambios `CHANGELOG.md`, `doc/changelogs/CHANGELOG_*.md`, `src/node_version.h`, y `REPLACEME` deberían ser el commit final que será etiquetado para el lanzamiento. Cuando se le hagan commit a esto para gitm usa el siguiente formato de mensaje:

```txt
AAAA-MM-DD, Versión x.y.z (Tipo de Lanzamiento)

Cambios notables:

* Copia los cambios notables aquí, refortadeado para texto simple
```

### 5. Proponer un Lanzamiento en GitHub

Empuja el branch lanzado a `nodejs/node`, no a tu bifurcación propia. Esto permite que los branches lanzados sean pasados más fácilmente entre miembros del equipo de lanzamiento si es necesario.

Create a pull request targeting the correct release line. For example, a v5.3.0-proposal PR should target v5.x, not master. Paste the CHANGELOG modifications into the body of the PR so that collaborators can see what is changing. These PRs should be left open for at least 24 hours, and can be updated as new commits land.

If you need any additional information about any of the commits, this PR is a good place to @-mention the relevant contributors.

This is also a good time to update the release commit to include `PR-URL` metadata.

### 6. Ensure that the Release Branch is Stable

Run a **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** test run to ensure that the build is stable and the HEAD commit is ready for release.

Perform some smoke-testing. We have [citgm](https://github.com/nodejs/citgm) for this. You can also manually test important modules from the ecosystem. Remember that node-gyp and npm both take a `--nodedir` flag to point to your local repository so that you can test unreleased versions without needing node-gyp to download headers for you.

### 7. Produce a Nightly Build *(optional)*

If there is a reason to produce a test release for the purpose of having others try out installers or specifics of builds, produce a nightly build using **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** and wait for it to drop in <https://nodejs.org/download/nightly/>. Follow the directions and enter a proper length commit SHA, enter a date string, and select "nightly" for "disttype".

This is particularly recommended if there has been recent work relating to the macOS or Windows installers as they are not tested in any way by CI.

### 8. Produce Release Builds

Use **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** to produce release artifacts. Enter the commit that you want to build from and select "release" for "disttype".

Artifacts from each worker are uploaded to Jenkins and are available if further testing is required. Use this opportunity particularly to test macOS and Windows installers if there are any concerns. Click through to the individual workers for a run to find the artifacts.

All release workers should achieve "SUCCESS" (and be green, not red). A release with failures should not be promoted as there are likely problems to be investigated.

You can rebuild the release as many times as you need prior to promoting them if you encounter problems.

If you have an error on Windows and need to start again, be aware that you'll get immediate failure unless you wait up to 2 minutes for the linker to stop from previous jobs. i.e. if a build fails after having started compiling, that worker will still have a linker process that's running for another couple of minutes which will prevent Jenkins from clearing the workspace to start a new one. This isn't a big deal, it's just a hassle because it'll result in another failed build if you start again!

ARMv7 takes the longest to compile. Unfortunately ccache isn't as effective on release builds, I think it's because of the additional macro settings that go in to a release build that nullify previous builds. Also most of the release build machines are separate to the test build machines so they don't get any benefit from ongoing compiles between releases. You can expect 1.5 hours for the ARMv7 builder to complete and you should normally wait for this to finish. It is possible to rush a release out if you want and add additional builds later but we normally provide ARMv7 from initial promotion.

You do not have to wait for the ARMv6 / Raspberry PI builds if they take longer than the others. It is only necessary to have the main Linux (x64 and x86), macOS .pkg and .tar.gz, Windows (x64 and x86) .msi and .exe, source, headers, and docs (both produced currently by an macOS worker). **If you promote builds *before* ARM builds have finished, you must repeat the promotion step for the ARM builds when they are ready**. If the ARMv6 build failed for some reason you can use the [`iojs-release-arm6-only`](https://ci-release.nodejs.org/job/iojs+release-arm6-only/) build in the release CI to re-run the build only for ARMv6. When launching the build make sure to use the same commit hash as for the original release.

### 9. Test the Build

Jenkins collects the artifacts from the builds, allowing you to download and install the new build. Make sure that the build appears correct. Check the version numbers, and perform some basic checks to confirm that all is well with the build before moving forward.

### 10. Tag and Sign the Release Commit

Once you have produced builds that you're happy with, create a new tag. By waiting until this stage to create tags, you can discard a proposed release if something goes wrong or additional commits are required. Once you have created a tag and pushed it to GitHub, you ***should not*** delete and re-tag. If you make a mistake after tagging then you'll have to version-bump and start again and count that tag/version as lost.

Tag summaries have a predictable format, look at a recent tag to see, `git tag
-v v6.0.0`. The message should look something like `2016-04-26 Node.js v6.0.0
(Current) Release`.

Install `git-secure-tag` npm module:

```console
$ npm install -g git-secure-tag
```

Create a tag using the following command:

```console
$ git secure-tag <vx.y.z> <commit-sha> -sm 'YYYY-MM-DD Node.js vx.y.z (Release Type) Release'
```

The tag **must** be signed using the GPG key that's listed for you on the project README.

Push the tag to the repo before you promote the builds. If you haven't pushed your tag first, then build promotion won't work properly. Push the tag using the following command:

```console
$ git push <remote> <vx.y.z>
```

### 11. Set Up For the Next Release

On release proposal branch, edit `src/node_version.h` again and:

- Increment `NODE_PATCH_VERSION` by one
- Change `NODE_VERSION_IS_RELEASE` back to `0`

Commit this change with the following commit message format:

```txt
Working on vx.y.z # where 'z' is the incremented patch number

PR-URL: <full URL to your release proposal PR>
```

This sets up the branch so that nightly builds are produced with the next version number *and* a pre-release tag.

Merge your release proposal branch into the stable branch that you are releasing from (e.g. `v8.x`), and rebase the corresponding staging branch (`v8.x-staging`) on top of that.

Cherry-pick the release commit to `master`. After cherry-picking, edit `src/node_version.h` to ensure the version macros contain whatever values were previously on `master`. `NODE_VERSION_IS_RELEASE` should be `0`.

Run `make lint-md-build; make lint` before pushing to `master`, to make sure the Changelog formatting passes the lint rules on `master`.

### 12. Promote and Sign the Release Builds

**It is important that the same individual who signed the release tag be the one to promote the builds as the SHASUMS256.txt file needs to be signed with the same GPG key!**

Use `tools/release.sh` to promote and sign the build. When run, it will perform the following actions:

**a.** Select a GPG key from your private keys. It will use a command similar to: `gpg --list-secret-keys` to list your keys. If you don't have any keys, it will bail. (Why are you releasing? Your tag should be signed!) If you have only one key, it will use that. If you have more than one key it will ask you to select one from the list. Be sure to use the same key that you signed your git tag with.

**b.** Log in to the server via SSH and check for releases that can be promoted, along with the list of artifacts. It will use the `dist-promotable` command on the server to find these. You will be asked, for each promotable release, whether you want to proceed. If there is more than one release to promote (there shouldn't be), be sure to only promote the release you are responsible for.

**c.** Log in to the server via SSH and run the promote script for the given release. The command on the server will be similar to: `dist-promote vx.y.z`. After this step, the release artifacts will be available for download and a SHASUMS256.txt file will be present. The release will still be unsigned, however.

**d.** Use `scp` to download SHASUMS256.txt to a temporary directory on your computer.

**e.** Sign the SHASUMS256.txt file using a command similar to: `gpg
--default-key YOURKEY --clearsign /path/to/SHASUMS256.txt`. You will be prompted by GPG for your password. The signed file will be named SHASUMS256.txt.asc.

**f.** Output an ASCII armored version of your public GPG key using a command similar to: `gpg --default-key YOURKEY --armor --export --output
/path/to/SHASUMS256.txt.gpg`. This does not require your password and is mainly a convenience for users, although not the recommended way to get a copy of your key.

**g.** Upload the SHASUMS256.txt files back to the server into the release directory.

If you didn't wait for ARM builds in the previous step before promoting the release, you should re-run `tools/release.sh` after the ARM builds have finished. That will move the ARM artifacts into the correct location. You will be prompted to re-sign SHASUMS256.txt.

*Note*: It is possible to only sign a release by running `./tools/release.sh -s
vX.Y.Z`.

### 13. Check the Release

Your release should be available at `https://nodejs.org/dist/vx.y.z/` and <https://nodejs.org/dist/latest/>. Check that the appropriate files are in place. You may want to check that the binaries are working as appropriate and have the right internal version strings. Check that the API docs are available at <https://nodejs.org/api/>. Check that the release catalog files are correct at <https://nodejs.org/dist/index.tab> and <https://nodejs.org/dist/index.json>.

### 14. Create a Blog Post

There is an automatic build that is kicked off when you promote new builds, so within a few minutes nodejs.org will be listing your new version as the latest release. However, the blog post is not yet fully automatic.

Create a new blog post by running the [nodejs.org release-post.js script](https://github.com/nodejs/nodejs.org/blob/master/scripts/release-post.js). This script will use the promoted builds and changelog to generate the post. Run `npm run serve` to preview the post locally before pushing to the [nodejs.org](https://github.com/nodejs/nodejs.org) repo.

- You can add a short blurb just under the main heading if you want to say something important, otherwise the text should be publication ready.
- The links to the download files won't be complete unless you waited for the ARMv6 builds. Any downloads that are missing will have `*Coming soon*` next to them. It's your responsibility to manually update these later when you have the outstanding builds.
- The SHASUMS256.txt.asc content is at the bottom of the post. When you update the list of tarballs you'll need to copy/paste the new contents of this file to reflect those changes.
- Always use pull-requests on the nodejs.org repo. Be respectful of that working group, but you shouldn't have to wait for PR sign-off. Opening a PR and merging it immediately *should* be fine. However, please follow the following commit message format:
    
    ```console
    Blog: vX.Y.Z release post
    
    Refs: <full URL to your release proposal PR>
    ```

- Changes to `master` on the nodejs.org repo will trigger a new build of nodejs.org so your changes should appear in a few minutes after pushing.

### 15. Announce

The nodejs.org website will automatically rebuild and include the new version. To announce the build on Twitter through the official @nodejs account, email <pr@nodejs.org> with a message such as:

> v5.8.0 of @nodejs is out: https://nodejs.org/en/blog/release/v5.8.0/ … something here about notable changes

To ensure communication goes out with the timing of the blog post, please allow 24 hour prior notice. If known, please include the date and time the release will be shared with the community in the email to coordinate these announcements.

### 16. Cleanup

Close your release proposal PR and remove the proposal branch.

### 17. Celebrate

*In whatever form you do this...*