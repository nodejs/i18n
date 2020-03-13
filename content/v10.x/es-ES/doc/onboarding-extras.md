# Información adicional para la Orientación

## Etiquetas

### Subsistemas

* `lib/*.js` (`assert`, `buffer`, etc.)
* `build`
* `doc`
* `lib / src`
* `test`
* `tools`

Puede haber mas de un subsistema válido para cada issue o pull request particular.

### General

* `confirmed-bug` - Bugs cuya existencia se haya verificado
* `discuss` -Temas que deben ser puestos a discusión
* `feature request` - Cualquier issue que solicite una nueva característica (usualmente no son PRs)
* `good first issue` - Issues ideales ser realizados por nuevos colaboradores
* `meta` - Para issues cuyo tema es la gobernanza, políticas, procedimientos, etc.

--

* `semver-{minor,major}`
  * sea conservador – esto significa que si un cambio tiene un *chance* remoto de romper algo, se debe elegir semver-major
  * al agregar una etiqueta semver, incluya un comentario explicando el motivo de la adición
  * minor vs. patch: básicamente "agrega un nuevo método / agrega una nueva sección a la documentación"
  * major vs. cualquier otra cosa: corra las pruebas de la ultima versión contra esta versión, y si pasan, **probablemente** sea mejor elegir minor o patch
  * Ayuda para un cambio que rompa ([código completo](https://gist.github.com/chrisdickinson/ba532fa0e4e243fb7b44)):
  ```sh
  SHOW=$(git show-ref -d $(git describe --abbrev=0) | tail -n1 | awk '{print $1}')
  git checkout $(git show -s --pretty='%T' $SHOW) -- test
  make -j4 test
  ```

### Soporte a largo plazo/Etiquetas de versión

Utilizamos etiquetas para mantener un seguimiento de en qué branches deberían realizarse los commits:

* `dont-land-on-v?.x`
  * Para cambios que no aplican para a una determinada línea de release
  * También se utiliza cuando el trabajo involucrado en reincorporar un cambio anterior sobrepasa los beneficios
* `land-on-v?.x`
  * Usado por los lanzadores para marcar un PR como programado para inclusión en un lanzamiento con soporte a largo plazo
  * Aplicado al PR original para ejecutar cherry-picks, o al PR de ajustes a versiones anteriores
* `backport-requested-v?.x`
  * Usado para indicar que un PR necesita un reajuste manual a una branch de manera que se puedan incluir los cambios en esa branch
  * Típicamente aplicado por un lanzador cuando el PR no puede aplicarse limpiamente o rompe las pruebas luego de ser aplicado
  * Será reemplazado por `dont-land-on-v?.x` o `backported-to-v?.x`
* `backported-to-v?.x`
  * Aplicado a los PRs para los cuales un PR de soporte de versión anterior ha sido integrado
* `lts-watch-v?.x`
  * Aplicado a los PRs que el grupo de trabajo de soporte a largo plazo debería considerar incluir en una entrega LTS
  * No indica que ninguna acción específica sera llevada a cabo, pero puede ser un mensaje efectivo hacia no colaboradores
* `lts-agenda`
  * Para temas que necesitan ser discutidos por el grupo de trabajo de LTS
  * (por ejemplo, cambios menores de semver-minor que necesitan o deberían ser incluidos en una entrega LTS)
* `v?.x`
  * Automáticamente aplicado a cambios que no tienen como objetivo `master` pero si la branch `v?.x-staging`

Una vez que una línea de entrega progresa a modo de mantenimiento, las etiquetas correspondientes ya no necesitan ser incluidas, por que solo los arreglos de defectos mas importantes serán incluidos.

### Otras etiquetas

* Etiquetas de Sistema Operativo
  * `macos`, `windows`, `smartos`, `aix`
  * Sistemas linux implícitos por defecto
* Etiquetas de arquitectura
  * `arm`, `mips`, `s390`, `ppc`
  * Desde que están incluidos por defecto, no de incluye arquitectura x86{_64}
