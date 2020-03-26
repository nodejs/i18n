# Proceso de Lanzamiento de Node.js

Este documento describe los aspectos técnicos del proceso de lanzamiento de Node.js. La audiencia prevista son aquellos que han sido autorizados por el Comité de Dirección Técnica (TSC por sus siglas en inglés) de la Fundación Node.js para crear, promover y firmar versiones oficiales de lanzamiento para Node.js, alojadas en <https://nodejs.org/>.

## ¿Quién puede realizar un lanzamiento?

La autorización de lanzamiento es otorgada por el TSC de Node.js. Una vez autorizado, un individuo debe tener lo siguiente:

### 1. Acceso de Lanzamiento Jenkins

Hay tres trabajos relevantes de Jenkins que deben ser utilizados para un flujo de lanzamiento:

**a.** **Test runs:** **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** is used for a final full-test run to ensure that the current *HEAD* is stable.

**b.** **Nightly builds:** (optional) **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** can be used to create a nightly release for the current *HEAD* if public test releases are required. Las compilaciones activadas con este trabajo son publicadas directamente en <https://nodejs.org/download/nightly/> y están disponibles para su descarga pública.

**c.** **Release builds:** **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** does all of the work to build all required release assets. La promoción de archivos de lanzamiento es un paso manual una vez que estén listos (vea a continuación).

El [Equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proporcionar este acceso a individuos autorizados por el TSC.

### 2. <nodejs.org> Acceso

The _dist_ user on nodejs.org controls the assets available in <https://nodejs.org/download/>. <https://nodejs.org/dist/> is an alias for <https://nodejs.org/download/release/>.

The Jenkins release build workers upload their artifacts to the web server as the _staging_ user. El usuario _dist_ tiene acceso para mover estos activos a acceso público, mientras que, por seguridad, el usuario _staging_ no lo tiene.

Nightly builds are promoted automatically on the server by a cron task for the _dist_ user.

Release builds require manual promotion by an individual with SSH access to the server as the _dist_ user. El [Equipo de compilación de Node.js](https://github.com/nodejs/build) es capaz de proporcionar este acceso a individuos autorizados por el TSC.

### 3. Una Clave GPG Públicamente Listada

A SHASUMS256.txt file is produced for every promoted build, nightly, and releases. Adicionalmente para los lanzamientos, este archivo es firmado por el individuo responsable por dicho lanzamiento. Para poder verificar los binarios descargados, el público debería ser capaz de verificar que el archivo HASUMS256.txt ha sido firmado por alguien que ha sido autorizado para crear un lanzamiento.

Las claves GPG deberían ser rescatables de un keyserver conocido de terceros. The SKS Keyservers at <https://sks-keyservers.net> are recommended. Utilice el formulario de [envío](https://pgp.mit.edu/) para enviar una nueva clave GPG. Las claves deben ser rescatables a través de:

```console
$ gpg --keyserver pool.sks-keyservers.net --recv-keys <FINGERPRINT>
```

La clave que usted utilice puede ser una clave secundaria/subclave de una clave existente.

Additionally, full GPG key fingerprints for individuals authorized to release should be listed in the Node.js GitHub README.md file.

## Cómo crear un lanzamiento

Notas:

 - Las fechas listadas a continuación como _"AAAA-MM-DD"_ deben ser la fecha del lanzamiento **como UTC**. Utilice `date -u +'%Y-%m-%d'` para descubrir qué es esto.
 - Las versiones de strings están listadas a continuación como _"vx.y.z"_. Substituto para la versión de lanzamiento.

### 1. Selecciona cuidadosamente desde `master` y otras branches

Crea una nueva rama llamada _"vx.y.z-proposal"_, o algo similar. Using `git cherry-pick`, bring the appropriate commits into your new branch. Para determinar los commits relevantes, utilice [`branch-diff`](https://github.com/rvagg/branch-diff) y [`changelog-maker`](https://github.com/rvagg/changelog-maker/) (ambos están disponibles en npm y deben ser instalados globalmente). Estas herramientas dependen de nuestros metadatos del commit, así como las etiquetas de Github `semver-minor` y `semver-major`. Un inconveniente es que, cuando los metadatos `PR-URL` son accidentalmente omitidos de un commit, el commit va a aparecer debido a que no es seguro si es un duplicado o no.

Para una lista de commits que pudieran llegar en un lanzamiento de parche en v5.x

```console
$ branch-diff v5.x master --exclude-label=semver-major,semver-minor,dont-land-on-v5.x --filter-release --format=simple
```

Revise cuidadosamente la lista de commits que buscan errores (`PR-URL` incorrecto, semver incorrecto, etc.). Commits labeled as semver minor or semver major should only be cherry-picked when appropriate for the type of release being made. Los commits de lanzamientos anteriores y saltos de la versión no necesitan ser seleccionados.

### 2. Actualizar `src/node_version.h`

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

La regla general es saltar esta versión cuando hayan cambios _abruptos de ABI_ y también si hay cambios no triviales de API. Las reglas aún no están estrictamente definidas, así que en caso de duda, por favor confiera con alguien que tenga una perspectiva más informada, como un miembro del equipo NAN.

*Note*: Es la política TSC actual saltar una versión mayor cuando ABI cambia. If you see a need to bump `NODE_MODULE_VERSION` then you should consult the TSC. Los commits pudieran necesitar ser revertidos, opudiera ser necesario que ocurra un salto de una versión mayor.

### 3. Actualizar el Changelog

#### Paso 1: Recolectar la lista formateada de cambios:

Recolecte una lista formateada de commits desde el último lanzamiento. Utilice [`changelog-maker`](https://github.com/rvagg/changelog-maker) para hacer esto.

```console
$ changelog-maker --group
```

Note that changelog-maker counts commits since the last tag and if the last tag in the repository was not on the current branch you may have to supply a `--start-ref` argument:

```console
$ changelog-maker --group --start-ref v2.3.1
```

#### Paso 2: Actualizar el archivo doc/changelogs/CHANGELOG_*.md apropiado

Hay un archivo `CHANGELOG_*.md` separado por cada línea de lanzamiento mayor de Node.js. Estos están localizados en el directorio `doc/changelogs/`. Once the formatted list of changes is collected, it must be added to the top of the relevant changelog file in the release branch (e.g. a release for Node.js v4 would be added to the `/doc/changelogs/CHANGELOG_V4.md`).

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

El tipo de lanzamiento debe ser Actual, LTS o de Mantenimiento, dependiendo del tipo de lanzamiento que se está produciendo.

Be sure that the `<a>` tag, as well as the two headings, are not indented at all.

Por encima de cada archivo `CHANGELOG_*.md`, y en el archivo `CHANGELOG.md` raíz, hay una tabla que indexa todos los lanzamientos en cada línea de lanzamiento mayor. Es necesario añadir un enlace a cada uno de los nuevos lanzamientos. Siga los ejemplos existentes y asegúrese de añadir el lanzamiento al *comienzo* de la lista.

En el archivo raíz de `CHANGELOG.md`, el lanzamiento más reciente para cada línea de lanzamiento se muestra en **negritas** en el índice. Al actualizar el índice, por favor asegúrese de actualizar la pantalla adecuadamente removiendo el estilo en negrita del lanzamiento anterior.

#### Paso 3: Actualiza cualquier etiqueta REPLACEME y DEP00XX en los documentos

Si este lanzamiento incluye nuevas APIs, entonces es necesario documentar que fueron añadidas por primera vez en esta versión. Los commits relevantes deberían ya incluir las etiquetas de `REPLACEME` como en el ejemplo en los [documentos README](../tools/doc/README.md). Check for these tags with `grep REPLACEME doc/api/*.md`, and substitute this node version with `sed -i "s/REPLACEME/$VERSION/g" doc/api/*.md` or `perl -pi -e "s/REPLACEME/$VERSION/g" doc/api/*.md`.

*Nota*: `$VERSION` debería ser prefijada con `v`

Si este lanzamiento incluye cualquier tipo de desaprobación nueva, es necesario asegurarse que esas fueron asignadas a un código de desaprobación estático apropiado. Éstas están listadas en los documentos (vea `doc/api/deprecations.md`) y en la fuente como `DEP00XX`. Al código se le debe asignar un número (p. ej. `DEP0012`). Note that this assignment should occur when the PR is landed, but a check will be made when the release built is run.

### 4. Crear un Commit de Lanzamiento

Los cambios de `CHANGELOG.md`, `doc/changelogs/CHANGELOG_*.md`, `src/node_version.h` y `REPLACEME` deberían ser el commit final que será etiquetado para el lanzamiento. Cuando se le hagan commit a esto para gitm usa el siguiente formato de mensaje:

```txt
AAAA-MM-DD, Versión x.y.z (Tipo de Lanzamiento)

Cambios notables:

* Copie la lista de cambios notables aquí, reformateado para texto simple
```

### 5. Proponer Lanzamiento en GitHub

Empuja el branch lanzado a `nodejs/node`, no a tu bifurcación propia. This allows release branches to more easily be passed between members of the release team if necessary.

Cree un pull request seleccionando la línea de lanzamiento correcta. For example, a v5.3.0-proposal PR should target v5.x, not master. Pegue las modificaciones del CHANGELOG en el cuerpo del PR para que los colaboradores puedan ver qué está cambiando. Estos PRs deberían dejarse abiertos por al menos 24 horas, y pueden ser actualizados cuando lleguen nuevos commits.

Si necesita cualquier información adicional acerca de cualquiera de los commits, este PR es un buen lugar para @-mencionar a los contribuyentes relevantes.

Este también es un buen momento para actualizar el commit de lanzamiento para incluir los metadatos de `PR-URL`.

### 6. Asegurar que la Rama de Lanzamiento sea Estable

Realice una prueba de ejecución de **[node-test-pull-request](https://ci.nodejs.org/job/node-test-pull-request/)** que asegure que la compilación sea estable y que el commit HEAD esté listo para el lanzamiento.

Realice algunas pruebas de humo. Tenemos [citgm](https://github.com/nodejs/citgm) para esto. También puede probar manualmente módulos importantes del ecosistema. Recuerde que node-gyp y npm toman una bandera de `--nodedir` para apuntar a su repositorio local para que pueda hacer pruebas a las versiones no lanzadas sin necesitar que node-gyp descargue encabezados por usted.

### 7. Producir una Compilación Nocturna _(opcional)_

Si hay una razón para producir un lanzamiento de prueba con el propósito de hacer que otros prueben los instaladores o cosas específicas de las compilaciones, produzca una compilación nocturna utilizando **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** y espere a que aparezca en <https://nodejs.org/download/nightly/>. Follow the directions and enter a proper length commit SHA, enter a date string, and select "nightly" for "disttype".

Esto es particularmente recomendado si ha existido trabajo reciente relacionado a los instaladores de macOS o Windows ya que no son probados de ninguna manera por el CI.

### 8. Producir Compilaciones de Lanzamiento

Utilice **[iojs+release](https://ci-release.nodejs.org/job/iojs+release/)** para producir artefactos de lanzamiento. Ingrese el commit de donde desee compilar y seleccione "release" para "disttype".

Los artefactos de cada worker son subidos a Jenkins y están disponibles si se requieren pruebas adicionales. Utilice esta oportunidad particularmente para probar los instaladores de macOS y Windows si hay alguna duda. Haga clic a través de los workers individuales para una ejecución para encontrar los artefactos.

Todos los trabajadores lanzados deberían lograr "SUCCESS" (y ser verdes, no rojos). Un lanzamiento con fallos no debería ser promovido ya que probablemente hay problemas a ser investigados.

Puede recompilar el lanzamiento cuantas veces necesite antes de promoverlos si encuentra problemas.

Si tiene un error en Windows y necesita comenzar de nuevo, tenga en cuenta que tendrá una falla inmediata a menos que espere 2 minutos para que el enlazador se detenga de trabajos anteriores. i.e. if a build fails after having started compiling, that worker will still have a linker process that's running for another couple of minutes which will prevent Jenkins from clearing the workspace to start a new one. Esto no es un problema grande, es solo una molestia, ¡porque resultará en otra compilación fallida si empieza de nuevo!

ARMv7 tarda más tiempo en compilar. Desafortunadamente, ccache no es tan efectivo en compilaciones de lanzamiento, creo que es debido a configuraciones macro adicionales que van a la compilación de lanzamiento que anula compilaciones previas. También la mayoría de las máquinas de compilación de lanzamientos son separadas para probar las máquinas de compilación, para que no obtengan ningún beneficio de compilaciones en curso entre lanzamientos. Puede esperar 1.5 horas para que el compilador ARMv7 se complete y normalmente debería esperar a que esto termine. Es posible apresurar un lanzamiento si lo desea y añadir compilaciones adicionales después, pero usualmente nosotros proporcionamos ARMv7 desde una promoción inicial.

No tiene que esperar por las compilaciones de ARMv6 / Raspberry PI si se toman más tiempo que las otras. It is only necessary to have the main Linux (x64 and x86), macOS .pkg and .tar.gz, Windows (x64 and x86) .msi and .exe, source, headers, and docs (both produced currently by an macOS worker). **If you promote builds _before_ ARM builds have finished, you must repeat the promotion step for the ARM builds when they are ready**. If the ARMv6 build failed for some reason you can use the [`iojs-release-arm6-only`](https://ci-release.nodejs.org/job/iojs+release-arm6-only/) build in the release CI to re-run the build only for ARMv6. When launching the build make sure to use the same commit hash as for the original release.

### 9. Probar la Compilación

Jenkins recoge los artefactos de las compilaciones, permitiéndole descargar e instalar la nueva compilación. Asegúrese de que la compilación parezca correcta. Verifique los números de versión y realice algunas verificaciones básicas para confirmar que todo estén bien con la compilación antes de seguir adelante.

### 10. Etiquetar y Firmar el Commit de Lanzamiento

Una vez que haya producido compilaciones con las que esté feliz, cree una nueva etiqueta. Al esperar hasta este etapa de crear etiquetas, puede descargar un lanzamiento propuesto si algo va mal o si se requieren commits adicionales. Una vez haya creado una etiqueta y la haya subido a GitHub, ***no debe*** eliminar y re-etiquetar. Si comete algún error después de realizar el etiquetado, entonces tendrá que actualizar la versión y comenzar de nuevo, y contar esta etiqueta/versión como perdida.

Los resúmenes de las etiquetas tienen un formato predecible, vea una etiqueta reciente para ver, `git tag -v v6.0.0`. El mensaje debería lucir algo así `2016-04-26 Node.js v6.0.0 (Actual) Lanzamiento`.

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

### 11. Configurar Para el Siguiente Lanzamiento

En el branch de propuesta de lanzamiento, edite `src/node_version.h` nuevamente y:

- Incremente `NODE_PATCH_VERSION` por uno
- Cambie `NODE_VERSION_IS_RELEASE` de vuelta a `0`

Realice un commit a este cambio con el siguiente formato de mensaje de commit:

```txt
Working on vx.y.z # where 'z' is the incremented patch number

PR-URL: <full URL to your release proposal PR>
```

Esto configura la rama para que las compilaciones nocturnas sean producidas con el siguiente número de versión _y_ una etiqueta de pre-lanzamiento.

Merge your release proposal branch into the stable branch that you are releasing from (e.g. `v8.x`), and rebase the corresponding staging branch (`v8.x-staging`) on top of that.

Selecciona cuidadosamente el commit lanzado al `master`. After cherry-picking, edit `src/node_version.h` to ensure the version macros contain whatever values were previously on `master`. `NODE_VERSION_IS_RELEASE` debería ser `0`.

Run `make lint` before pushing to `master`, to make sure the Changelog formatting passes the lint rules on `master`.

### 12. Promover y Firmar las Compilaciones de Lanzamiento

**Es importante que el mismo individuo que firmó la etiqueta de lanzamiento sea el mismo que promueva las compilaciones, ¡ya que el archivo SHASUMS256.txt necesita ser firmado con la misma clave GPG!**

Usa `tools/release.sh` para promover y firmar la compilación. Cuando se ejecute, realizará las siguientes acciones:

**a.** Seleccionar una clave GPG de tus claves privadas. Utilizará un comando similar a: `gpg --list-secret-keys` para listar sus claves. Si no tiene ninguna clave, no funcionará. (¿Por qué estás lanzando? ¡Su etiqueta debería estar firmada!) Si sólo tiene una clave, usará esa. Si tiene más de una clave, le pedirá que seleccione una de la lista. Asegúrese de utilizar la misma clave con la que usted firmó su etiqueta git.

**b.** Iniciar sesión en el servidor mediante SSH y verificar por lanzamientos que puedan ser promovidos, en conjunto con la lista de artefactos. Utilizará el comando `dist-promotable` en el servidor para encontrarlos. Se le preguntará, por cada lanzamiento promocionable, si desea proceder. Si hay más de un lanzamiento para promover (que no debería haber), asegúrese de sólo promover el lanzamiento por el cual usted es responsable.

**c.** Iniciar sesión en el servidor mediante SSH y ejecutar el script de promoción para el lanzamiento dado. El comando en el servidor será similar a: `dist-promote vx.y.z`. Luego de este paso, los artefactos de lanzamiento estarán disponibles para descargar y el archivo SHASUMS256.txt estará presente. Sin embargo, el lanzamiento seguirá sin estar firmado.

**d.** Utilice `scp` para descargar SHASUMS256.txt en un directorio temporal en su computador.

**e.** Firme el archivo SHASUMS256.txt utilizando un comando similar a: `gpg --default-key YOURKEY --clearsign /path/to/SHASUMS256.txt`. El GPG le pedirá su contraseña. El archivo firmado será nombrado SHASUMS256.txt.asc.

**f.** Output an ASCII armored version of your public GPG key using a command similar to: `gpg --default-key YOURKEY --armor --export --output /path/to/SHASUMS256.txt.gpg`. Esto no requiere su contraseña y es principalmente una conveniencia para los usuarios, aunque no es la manera recomendada para obtener una copia de su clave.

**g.** Subir los archivos SHASUMS256.txt de vuelta al servidor en el directorio de lanzamiento.

Si no esperó por las compilaciones ARM en el paso anterior antes de promover el lanzamiento, debería ejecutar nuevamente `tools/release.sh` luego de que las compilaciones ARM hayan finalizado. Eso moverá los artefactos ARM a la locación correcta. Se le pedirá que vuelva a firmar el archivo SHASUMS256.txt.

*Note*: It is possible to only sign a release by running `./tools/release.sh -s vX.Y.Z`.

### 13. Verificar el Lanzamiento

Su lanzamiento debería estar disponible en `https://nodejs.org/dist/vx.y.z/` y <https://nodejs.org/dist/latest/>. Verifique que los archivos apropiados estén en su lugar. Puede que quiera verificar que los binarios estén funcionando de manera adecuada y que tengan los strings de versión interna correctos. Verifique que los documentos API estén disponibles en <https://nodejs.org/api/>. Check that the release catalog files are correct at <https://nodejs.org/dist/index.tab> and <https://nodejs.org/dist/index.json>.

### 14. Crear una Entrada en el Blog

Hay una compilación automática que es iniciada cuando promueve nuevas compilaciones, entonces en unos minutos nodejs.org listará su nueva versión como el último lanzamiento. Sin embargo, la entrada en el blog aún no es completamente automática.

Crea una nueva entrada del blog ejecutando [nodejs.org release-post.js script](https://github.com/nodejs/nodejs.org/blob/master/scripts/release-post.js). Este script usará las compilaciones promovidas y el registro de cambios para generar el post. Ejecute `npm run serve` para ver previamente la entrada localmente antes de subirla al repositorio de [nodejs.org](https://github.com/nodejs/nodejs.org).

* You can add a short blurb just under the main heading if you want to say something important, otherwise the text should be publication ready.
* Los enlaces a los archivos de descarga no estarán completos a menos que haya esperado por las compilaciones de ARMv6. Cualquier descarga que falte tendrá un `*Coming soon*` a su lado. Es su responsabilidad actualizarlos manualmente cuando tenga las compilaciones sobresalientes.
* El contenido de SHASUMS256.txt.asc está en la parte inferior de la publicación. When you update the list of tarballs you'll need to copy/paste the new contents of this file to reflect those changes.
* Siempre utilice pull-requests en el repositorio de nodejs.org. Sea respetuoso con ese grupo de trabajo, pero no debería tener que esperar a que el PR termine. Opening a PR and merging it immediately _should_ be fine. Sin embargo, por favor sigue el siguiente formato de mensaje del commit:
```console
Blog: vX.Y.Z release post

Refs: <full URL to your release proposal PR>
```
* Los cambios al `master` en el repositorio de nodejs.org van a activar una nueva compilación de nodejs.org, entonces sus cambios deberían aparecer unos minutos después de subirlo.

### 15. Anunciar

El sitio web nodejs.org va a recompilar automáticamente e incluir la nueva versión. Para anunciar la compilación en Twitter a través de la cuenta oficial @nodejs, envíe un correo a [pr@nodejs.org](mailto:pr@nodejs.org) como un mensaje como el siguiente:

> Salió la v5.8.0 de @nodejs: https://nodejs.org/en/blog/release/v5.8.0/ … algo aquí sobre cambios notables

Para asegurar que la comunicación esté sincronizada con la entrada del blog, por favor permita una notificación previa de 24 horas. Si se conoce, por favor incluya la fecha y la hora en la cual el lanzamiento será compartido con la comunidad en el correo para coordinar estos anuncios.

### 16. Limpiar

Cierra tu propuesta PR y remueve el branch propuesto.

### 17. Celebrar

_De cualquier forma que hagas esto..._
