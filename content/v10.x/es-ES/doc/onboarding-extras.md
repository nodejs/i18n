# Información adicional para la Orientación

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
  * Usado para indicar que un PR necesita un ajuste de versiones manual para una branch, de manera de poder incluir los cambios en esa branch
  * Típicamente se aplica por quien realiza la entrega cuando el PR no puede aplicarse limpiamente, o cuando rompe los tests luego de ser aplicado
  * Será reemplazado por `dont-land-on-v?.x` o `backported-to-v?.x`
* `backported-to-v?.x` 
  * Aplicado a los PRs para los cuales un PR de soporte de versión anterior ha sido mergeado
* `lts-watch-v?.x` 
  * Aplicado a los PRs que se desea que el grupo de trabajo de LTS considere incluir en una entrega LTS
  * No indica que ninguna acción específica sera llevada a cabo, pero puede ser un mensaje efectivo hacia no colaboradores
* `lts-agenda` 
  * Para temas que necesitan ser discutidos por el grupo de trabajo de LTS
  * (por ejemplo, cambios menores de semver-minor que necesitan o deberían ser incluidos en una entrega LTS)
* `v?.x` 
  * Automáticamente aplicado a cambios que no tienen como objetivo `master` pero si la branch `v?.x-staging`

Una vez que una línea de entrega progresa a modo de mantenimiento, las etiquetas correspondientes ya no necesitan ser incluidas, por que solo los arreglos de defectos mas importantes serán incluidos.

### Otras etiquetas

* Etiquetas de sistemas operativos 
  * `macos`, `windows`, `smartos`, `aix`
  * Sin linux, linux está implícito por defecto
* Etiquetas de arquitectura 
  * `arm`, `mips`, `s390`, `ppc`
  * Sin x86{_64}, ya que se asumen por defecto

## Actualizando Node.js desde Upstream

* `git remote add upstream git://github.com/nodejs/node.git`

para actualizar desde nodejs/node:

* `git checkout master`
* `git remote update -p` OR `git fetch --all`
* `git merge --ff-only upstream/master` (or `REMOTENAME/BRANCH`)

## Buenas prácticas

* Al crear PRs, dedicar el tiempo necesario a escribir descripciones completas.