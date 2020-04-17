# Proceso de Lanzamiento de Node.js

Este documento describe los aspectos técnicos del proceso de lanzamiento de Node.js. The intended audience is those who have been authorized by the Node.js Foundation Technical Steering Committee (TSC) to create, promote, and sign official release builds for Node.js, hosted on <https://nodejs.org/>.

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

**a.** **Test runs:** **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** is used for a final full-test run to ensure that the current *HEAD* is stable.

**b.** **Nightly builds:** (optional) **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** can be used to create a nightly release for the current *HEAD* if public test releases are required. Builds triggered with this job are published straight to <https://nodejs.org/download/nightly/> and are available for public download.

**c.** **Release builds:** **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** does all of the work to build all required release assets. Promotion of the release files is a manual step once they are ready (see below).

The [Node.js build team](https://github.com/nodejs/build) is able to provide this access to individuals authorized by the TSC.

### 2. <nodejs.org> Acceso

The *dist* user on nodejs.org controls the assets available in <https://nodejs.org/download/>. <https://nodejs.org/dist/> is an alias for <https://nodejs.org/download/release/>.

The Jenkins release build workers upload their artifacts to the web server as the *staging* user. The *dist* user has access to move these assets to public access while, for security, the *staging* user does not.

Nightly builds are promoted automatically on the server by a cron task for the *dist* user.

Release builds require manual promotion by an individual with SSH access to the server as the *dist* user. The [Node.js build team](https://github.com/nodejs/build) is able to provide this access to individuals authorized by the TSC.

### 3. Una clave GPG pública

A SHASUMS256.txt file is produced for every promoted build, nightly, and releases. Additionally for releases, this file is signed by the individual responsible for that release. In order to be able to verify downloaded binaries, the public should be able to check that the SHASUMS256.txt file has been signed by someone who has been authorized to create a release.

Las claves GPG deberían ser rescatables de un keyserver conocido de terceros. The SKS Keyservers at <https://sks-keyservers.net> are recommended. Use the [submission](https://pgp.mit.edu/) form to submit a new GPG key. Keys should be fetchable via:

```console
$ gpg --keyserver pool.sks-keyservers.net --recv-keys <FINGERPRINT>
```

La clave que uses pudiera ser una clave secundaria/subclave de una clave existente.

Additionally, full GPG key fingerprints for individuals authorized to release should be listed in the Node.js GitHub README.md file.

## Cómo crear un lanzamiento

Notas:

* Dates listed below as *"YYYY-MM-DD"* should be the date of the release **as UTC**. Utilice `date -u +'%Y-%m-%d'` para descubrir qué es esto.
* Version strings are listed below as *"vx.y.z"* or *"x.y.z"*. Substitute for the release version.
* Examples will use the fictional release version `1.2.3`.

### 0. Pre-release steps

Before preparing a Node.js release, the Build Working Group must be notified at least one business day in advance of the expected release. Coordinating with Build is essential to make sure that the CI works, release files are published, and the release blog post is available on the project website.

Build can be contacted best by opening up an issue on the [Build issue tracker](https://github.com/nodejs/build/issues/new), and by posting in `#node-build` on [webchat.freenode.net](https://webchat.freenode.net/).

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

To determine the relevant commits, use [`branch-diff`](https://github.com/nodejs/branch-diff). The tool is available on npm and should be installed globally or run with `npx`. It depends on our commit metadata, as well as the GitHub labels such as `semver-minor` and `semver-major`. One drawback is that when the `PR-URL` metadata is accidentally omitted from a commit, the commit will show up because it's unsure if it's a duplicate or not.

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

Set the version for the proposed release using the following macros, which are already defined in `src/node_version.h`:

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

Este macro es utilizado para señalar una versión de ABI para complementos nativos. It currently has two common uses in the community:

* Determining what API to work against for compiling native addons, e.g. [NAN](https://github.com/nodejs/nan) uses it to form a compatibility-layer for much of what it wraps.
* Determining the ABI for downloading pre-built binaries of native addons, e.g. [node-pre-gyp](https://github.com/mapbox/node-pre-gyp) uses this value as exposed via `process.versions.modules` to help determine the appropriate binary to download at install-time.

The general rule is to bump this version when there are *breaking ABI* changes and also if there are non-trivial API changes. The rules are not yet strictly defined, so if in doubt, please confer with someone that will have a more informed perspective, such as a member of the NAN team.

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

The release type should be either Current, LTS, or Maintenance, depending on the type of release being produced.

You can use `branch-diff` to get a list of commits with the `notable-change` label:

```console
$ branch-diff upstream/v1.x v1.2.3-proposal --require-label=notable-change -format=simple
```

Be sure that the `<a>` tag, as well as the two headings, are not indented at all.

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

Empuja el branch lanzado a `nodejs/node`, no a tu bifurcación propia. This allows release branches to more easily be passed between members of the release team if necessary.

Cree un pull request seleccionando la línea de lanzamiento correcta. For example, a `v5.3.0-proposal` PR should target `v5.x`, not master. Paste the CHANGELOG modifications into the body of the PR so that collaborators can see what is changing. These PRs should be left open for at least 24 hours, and can be updated as new commits land.

If you need any additional information about any of the commits, this PR is a good place to @-mention the relevant contributors.

After opening the PR, update the release commit to include `PR-URL` metadata and force-push the proposal.

### 7. Asegurar que la Rama de Lanzamiento sea Estable

Run a **[`node-test-pull-request`](https://ci.nodejs.org/job/node-test-pull-request/)** test run to ensure that the build is stable and the HEAD commit is ready for release.

Also run a **[`node-test-commit-v8-linux`](https://ci.nodejs.org/job/node-test-commit-v8-linux/)** test run if the release contains changes to `deps/v8`.

Realice algunas pruebas de humo. There is the **[`citgm-smoker`](https://ci.nodejs.org/job/citgm-smoker/)** CI job for this purpose. Run it once with the base `vx.x` branch as a reference and with the proposal branch to check if new regressions could be introduced in the ecosystem.

### 8. Producir una Compilación Nocturna *(opcional)*

If there is a reason to produce a test release for the purpose of having others try out installers or specifics of builds, produce a nightly build using **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** and wait for it to drop in <https://nodejs.org/download/nightly/>. Follow the directions and enter a proper length commit SHA, enter a date string, and select "nightly" for "disttype".

This is particularly recommended if there has been recent work relating to the macOS or Windows installers as they are not tested in any way by CI.

### 9. Producir Compilaciones de Lanzamiento

Use **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** to produce release artifacts. Enter the commit that you want to build from and select "release" for "disttype".

Artifacts from each worker are uploaded to Jenkins and are available if further testing is required. Use this opportunity particularly to test macOS and Windows installers if there are any concerns. Click through to the individual workers for a run to find the artifacts.

Todos los trabajadores lanzados deberían lograr "SUCCESS" (y ser verdes, no rojos). A release with failures should not be promoted as there are likely problems to be investigated.

You can rebuild the release as many times as you need prior to promoting them if you encounter problems.

If you have an error on Windows and need to start again, be aware that you'll get immediate failure unless you wait up to 2 minutes for the linker to stop from previous jobs. i.e. if a build fails after having started compiling, that worker will still have a linker process that's running for another couple of minutes which will prevent Jenkins from clearing the workspace to start a new one. This isn't a big deal, it's just a hassle because it'll result in another failed build if you start again!

ARMv7 tarda más tiempo en compilar. Unfortunately ccache isn't as effective on release builds, I think it's because of the additional macro settings that go in to a release build that nullify previous builds. Also most of the release build machines are separate to the test build machines so they don't get any benefit from ongoing compiles between releases. You can expect 1.5 hours for the ARMv7 builder to complete and you should normally wait for this to finish. It is possible to rush a release out if you want and add additional builds later but we normally provide ARMv7 from initial promotion.

You do not have to wait for the ARMv6 / Raspberry PI builds if they take longer than the others. It is only necessary to have the main Linux (x64 and x86), macOS .pkg and .tar.gz, Windows (x64 and x86) .msi and .exe, source, headers, and docs (both produced currently by an macOS worker). **If you promote builds *before* ARM builds have finished, you must repeat the promotion step for the ARM builds when they are ready**. If the ARMv6 build failed for some reason you can use the [`iojs-release-arm6-only`](https://ci-release.nodejs.org/job/iojs+release-arm6-only/) build in the release CI to re-run the build only for ARMv6. When launching the build make sure to use the same commit hash as for the original release.

### 10. Probar la Compilación

Jenkins collects the artifacts from the builds, allowing you to download and install the new build. Asegúrese de que la compilación parezca correcta. Check the version numbers, and perform some basic checks to confirm that all is well with the build before moving forward.

### 11. Etiquetar y Firmar el Commit de Lanzamiento

Una vez que haya producido compilaciones con las que esté feliz, cree una nueva etiqueta. By waiting until this stage to create tags, you can discard a proposed release if something goes wrong or additional commits are required. Once you have created a tag and pushed it to GitHub, you ***must not*** delete and re-tag. If you make a mistake after tagging then you'll have to version-bump and start again and count that tag/version as lost.

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

The tag **must** be signed using the GPG key that's listed for you on the project README.

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

This sets up the branch so that nightly builds are produced with the next version number *and* a pre-release tag.

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

**It is important that the same individual who signed the release tag be the one to promote the builds as the SHASUMS256.txt file needs to be signed with the same GPG key!**

Usa `tools/release.sh` para promover y firmar la compilación. When run, it will perform the following actions:

**a.** Seleccionar una clave GPG de tus claves privadas. It will use a command similar to: `gpg --list-secret-keys` to list your keys. If you don't have any keys, it will bail. (¿Por qué estás lanzando? Your tag should be signed!) If you have only one key, it will use that. If you have more than one key it will ask you to select one from the list. Be sure to use the same key that you signed your git tag with.

**b.** Log in to the server via SSH and check for releases that can be promoted, along with the list of artifacts. It will use the `dist-promotable` command on the server to find these. You will be asked, for each promotable release, whether you want to proceed. If there is more than one release to promote (there shouldn't be), be sure to only promote the release you are responsible for.

**c.** Log in to the server via SSH and run the promote script for the given release. El comando en el servidor será similar a: `dist-promote vx.y.z`. After this step, the release artifacts will be available for download and a SHASUMS256.txt file will be present. The release will still be unsigned, however.

**d.** Use `scp` to download SHASUMS256.txt to a temporary directory on your computer.

**e.** Firma el archivo SHASUMS256.txt usando un comando similar a: `gpg
--default-key YOURKEY --clearsign /path/to/SHASUMS256.txt`. You will be prompted by GPG for your password. El archivo firmado será nombrado SHASUMS256.txt.asc.

**f.** Output an ASCII armored version of your public GPG key using a command similar to: `gpg --default-key YOURKEY --armor --export --output
/path/to/SHASUMS256.txt.gpg`. This does not require your password and is mainly a convenience for users, although not the recommended way to get a copy of your key.

**g.** Upload the SHASUMS256.txt files back to the server into the release directory.

If you didn't wait for ARM builds in the previous step before promoting the release, you should re-run `tools/release.sh` after the ARM builds have finished. Eso moverá los artefactos ARM a la locación correcta. You will be prompted to re-sign SHASUMS256.txt.

It is possible to only sign a release by running `./tools/release.sh -s
vX.Y.Z`.

### 14. Verificar el Lanzamiento

Your release should be available at `https://nodejs.org/dist/vx.y.z/` and <https://nodejs.org/dist/latest/>. Check that the appropriate files are in place. You may want to check that the binaries are working as appropriate and have the right internal version strings. Check that the API docs are available at <https://nodejs.org/api/>. Check that the release catalog files are correct at <https://nodejs.org/dist/index.tab> and <https://nodejs.org/dist/index.json>.

### 15. Crear una Entrada en el Blog

There is an automatic build that is kicked off when you promote new builds, so within a few minutes nodejs.org will be listing your new version as the latest release. Sin embargo, la entrada en el blog aún no es completamente automática.

Crea una nueva entrada del blog ejecutando [nodejs.org release-post.js script](https://github.com/nodejs/nodejs.org/blob/master/scripts/release-post.js). Este script usará las compilaciones promovidas y el registro de cambios para generar el post. Run `npm run serve` to preview the post locally before pushing to the [nodejs.org](https://github.com/nodejs/nodejs.org) repo.

* You can add a short blurb just under the main heading if you want to say something important, otherwise the text should be publication ready.
* The links to the download files won't be complete unless you waited for the ARMv6 builds. Any downloads that are missing will have `*Coming soon*` next to them. It's your responsibility to manually update these later when you have the outstanding builds.
* El contenido de SHASUMS256.txt.asc está en la parte inferior de la publicación. When you update the list of tarballs you'll need to copy/paste the new contents of this file to reflect those changes.
* Siempre usa pull-requests en el repositorio de nodejs.org. Be respectful of that working group, but you shouldn't have to wait for PR sign-off. Opening a PR and merging it immediately *should* be fine. However, please follow the following commit message format:
  
  ```console
  Blog: vX.Y.Z release post
  
  Refs: <full URL to your release proposal PR>
  ```

* Changes to `master` on the nodejs.org repo will trigger a new build of nodejs.org so your changes should appear in a few minutes after pushing.

### 16. Create the release on GitHub

* Go to the [New release page](https://github.com/nodejs/node/releases/new).
* Select the tag version you pushed earlier.
* For release title, copy the title from the changelog.
* For the description, copy the rest of the changelog entry.
* Click on the "Publish release" button.

### 17. Limpiar

Close your release proposal PR and delete the proposal branch.

### 18. Anunciar

El sitio web nodejs.org va a recompilar automáticamente e incluir la nueva versión. To announce the build on Twitter through the official @nodejs account, email <pr@nodejs.org> with a message such as:

> v5.8.0 of @nodejs is out: https://nodejs.org/en/blog/release/v5.8.0/ … something here about notable changes

To ensure communication goes out with the timing of the blog post, please allow 24 hour prior notice. If known, please include the date and time the release will be shared with the community in the email to coordinate these announcements.

Ping the IRC ops and the other [Partner Communities](https://github.com/nodejs/community-committee/blob/master/governance/PARTNER_COMMUNITIES.md) liaisons.

### 19. Celebrar

*De cualquier forma que hagas esto...*