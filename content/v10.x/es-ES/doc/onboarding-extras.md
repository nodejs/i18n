# Información adicional para la Orientación

## Etiquetas

### Subsistemas

* `lib/*.js` (`assert`, `buffer`, etc.)
* `build`
* `doc`
* `lib / src`
* `test`
* `tools`

There may be more than one subsystem valid for any particular issue or pull request.

### General

* `confirmed-bug` - Bugs cuya existencia ha verificado
* `discuss` -Temas que deben ser puestos a discusión
* `feature request` - Cualquier issue que solicite una nueva característica (usualmente no son PRs)
* `good first issue` - Issues adecuados para ser procesados por nuevos colaboradores
* `meta` - Para issues cuyo tema es la gobernanza, políticas, procedimientos, etc.

--

* `semver-{minor,major}` 
  * be conservative – that is, if a change has the remote *chance* of breaking something, go for semver-major
  * al agregar una etiqueta semver, incluya un comentario explicando el motivo de la adición
  * minor vs. patch: roughly: "does it add a new method / does it add a new section to the docs"
  * major vs. everything else: run last versions tests against this version, if they pass, **probably** minor or patch
  * A breaking change helper ([full source](https://gist.github.com/chrisdickinson/ba532fa0e4e243fb7b44)): 
        sh
        SHOW=$(git show-ref -d $(git describe --abbrev=0) | tail -n1 | awk '{print $1}')
        git checkout $(git show -s --pretty='%T' $SHOW) -- test
        make -j4 test

### Soporte a largo plazo/Etiquetas de versión

Estas etiquetas se utilizan para conocer a que rama entrará el commit:

* `dont-land-on-v?.x` 
  * Para cambios que no aplican a cierta línea de lanzamiento específica
  * También se utiliza cuando el trabajo involucrado en reincorporar un cambio anterior sobrepasa los beneficios
* `land-on-v?.x` 
  * Usado por los lanzadores para marcar un PR como programado para inclusión en un lanzamiento con soporte a largo plazo
  * Applied to the original PR for clean cherry-picks, to the backport PR otherwise
* `backport-requested-v?.x` 
  * Used to indicate that a PR needs a manual backport to a branch in order to land the changes on that branch
  * Typically applied by a releaser when the PR does not apply cleanly or it breaks the tests after applying
  * Será reemplazado por `dont-land-on-v?.x` o `backported-to-v?.x`
* `backported-to-v?.x` 
  * Aplicado a los PRs para los cuales un PR de soporte de versión anterior ha sido integrado
* `lts-watch-v?.x` 
  * Applied to PRs which the LTS working group should consider including in a LTS release
  * Does not indicate that any specific action will be taken, but can be effective as messaging to non-collaborators
* `lts-agenda` 
  * Para temas que necesitan ser discutidos por el grupo de trabajo de LTS
  * (for example semver-minor changes that need or should go into an LTS release)
* `v?.x` 
  * Automatically applied to changes that do not target `master` but rather the `v?.x-staging` branch

Once a release line enters maintenance mode, the corresponding labels do not need to be attached anymore, as only important bugfixes will be included.

### Otras etiquetas

* Etiquetas de Sistema Operativo 
  * `macos`, `windows`, `smartos`, `aix`
  * Sistemas linux implícitos por defecto
* Etiquetas de arquitectura 
  * `arm`, `mips`, `s390`, `ppc`
  * Desde que están incluidos por defecto, no de incluye arquitectura x86{_64}