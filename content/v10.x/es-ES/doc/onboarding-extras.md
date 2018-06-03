# Información adicional para Onboarding

## Etiquetas

### Subsistemas

* `lib/*.js` (`assert`, `buffer`, etc.)
* `build`
* `doc`
* `lib / src`
* `test`
* `tools`

Puede haber mas de un subsistema valido para problemas o pull requests.

### General

* `confirmed-bug` - Bugs cuya existencia está verificada
* `discuss` - Asuntos que necesitan mayor discusión
* `feature request` - Pedidos de nuevas características (usualmente no son PRs)
* `good first issue` - Defectos adecuados para ser tomados por nuevos colaboradores
* `meta` - Para defectos cuyo tema son la gobernanza, políticas, procedimientos, etc.

--

* `semver-{minor,major}` 
  * ser conservativos – esto significa que si un cambio tiene una *chance* remota de romper algo, se debe elegir semver-major
  * al agregar una etiqueta semver, incluir un comentario explicando el motivo de la adición
  * menor vs. parche: básicamente evaluar "si agrega un nuevo método / agrega una nueva sección a la documentación"
  * mayor vs. cualquier otra cosa: correr los tests de la ultima version contra esta version, y si pasan, **probablemente** puedan ser considerados como menores o parches
  * Ayuda para un cambio que rompa ([código completo](https://gist.github.com/chrisdickinson/ba532fa0e4e243fb7b44)): 
        sh
        SHOW=$(git show-ref -d $(git describe --abbrev=0) | tail -n1 | awk '{print $1}')
        git checkout $(git show -s --pretty='%T' $SHOW) -- test
        make -j4 test

### LTS/Etiquetas de versión

Utilizamos etiquetas para mantener un seguimiento de en que branches deberían realizarse los commits:

* `dont-land-on-v?.x` 
  * Para cambios que no aplican a cierta linea de entrega específica
  * También utilizable cuando el trabajo involucrado en modificar versiones anteriores sobrepasa los beneficios
* `land-on-v?.x` 
  * Usado para marcar los PR como candidatos de inclusión en una entrega LTS
  * Aplicado o al PR original para ejecutar cherry-picks, o al PR de ajustes a versiones anteriores
* `backport-requested-v?.x` 
  * Used to indicate that a PR needs a manual backport to a branch in order to land the changes on that branch
  * Typically applied by a releaser when the PR does not apply cleanly or it breaks the tests after applying
  * Will be replaced by either `dont-land-on-v?.x` or `backported-to-v?.x`
* `backported-to-v?.x` 
  * Applied to PRs for which a backport PR has been merged
* `lts-watch-v?.x` 
  * Applied to PRs which the LTS working group should consider including in a LTS release
  * Does not indicate that any specific action will be taken, but can be effective as messaging to non-collaborators
* `lts-agenda` 
  * For things that need discussion by the LTS working group
  * (for example semver-minor changes that need or should go into an LTS release)
* `v?.x` 
  * Automatically applied to changes that do not target `master` but rather the `v?.x-staging` branch

Once a release line enters maintenance mode, the corresponding labels do not need to be attached anymore, as only important bugfixes will be included.

### Other Labels

* Operating system labels 
  * `macos`, `windows`, `smartos`, `aix`
  * No linux, linux is the implied default
* Architecture labels 
  * `arm`, `mips`, `s390`, `ppc`
  * No x86{_64}, since that is the implied default

## Updating Node.js from Upstream

* `git remote add upstream git://github.com/nodejs/node.git`

to update from nodejs/node:

* `git checkout master`
* `git remote update -p` OR `git fetch --all`
* `git merge --ff-only upstream/master` (or `REMOTENAME/BRANCH`)

## Best practices

* When making PRs, spend time writing a thorough description.