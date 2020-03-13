# Información adicional para la Orientación

## Vea "A quién hacer CC en los problemas

| Subsistema                            | Mantenedores                                                            |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `benchmark/*`                         | @nodejs/benchmarking, @mscdex                                           |
| `bootstrap_node.js`                   | @fishrock123                                                            |
| `doc/*`, `*.md`                       | @nodejs/documentation                                                   |
| `lib/assert`                          | @nodejs/testing                                                         |
| `lib/async_hooks`                     | @nodejs/async\_hooks for bugs/reviews (+ @nodejs/diagnostics for API) |
| `lib/buffer`                          | @nodejs/buffer                                                          |
| `lib/child_process`                   | @bnoordhuis, @cjihrig                                                   |
| `lib/cluster`                         | @bnoordhuis, @cjihrig, @mcollina                                        |
| `lib/{crypto,tls,https}`              | @nodejs/crypto                                                          |
| `lib/dgram`                           | @cjihrig, @mcollina                                                     |
| `lib/domains`                         | @misterdjules                                                           |
| `lib/fs`, `src/{fs,file}`             | @nodejs/fs                                                              |
| `lib/{_}http{*}`                      | @nodejs/http                                                            |
| `lib/inspector.js`, `src/inspector_*` | @nodejs/v8-inspector                                                    |
| `lib/internal/url`, `src/node_url`    | @nodejs/url                                                             |
| `lib/net`                             | @bnoordhuis, @indutny, @nodejs/streams                                  |
| `lib/repl`                            | @addaleax, @fishrock123                                                 |
| `lib/{_}stream{*}`                    | @nodejs/streams                                                         |
| `lib/timers`                          | @fishrock123, @misterdjules                                             |
| `lib/util`                            | @bnoordhuis, @cjihrig, @evanlucas                                       |
| `lib/zlib`                            | @addaleax, @bnoordhuis, @indutny                                        |
| `src/async-wrap.*`                    | @nodejs/async\_hooks                                                  |
| `src/node_api.*`                      | @nodejs/n-api                                                           |
| `src/node_crypto.*`                   | @nodejs/crypto                                                          |
| `test/*`                              | @nodejs/testing                                                         |
| `tools/eslint`, `.eslintrc`           | @not-an-aardvark, @silverwind, @trott                                   |
| build                                 | @nodejs/build                                                           |
| ES Modules                            | @bmeck, @Fishrock123, @guybedford, @MylesBorins, @targos                |
| GYP                                   | @nodejs/gyp                                                             |
| performance                           | @nodejs/performance                                                     |
| platform specific                     | @nodejs/platform-{aix,arm,freebsd,macos,ppc,smartos,s390,windows}       |
| python code                           | @nodejs/python                                                          |
| upgrading c-ares                      | @jbergstroem                                                            |
| upgrading http-parser                 | @jbergstroem, @nodejs/http                                              |
| upgrading libuv                       | @saghul                                                                 |
| upgrading npm                         | @fishrock123, @MylesBorins                                              |
| upgrading V8                          | @nodejs/v8, @nodejs/post-mortem                                         |

Cuando las cosas necesitan atención extra, son polémicas, o `semver-major`: @nodejs/tsc

If you cannot find who to cc for a file, `git shortlog -n -s <file>` may help.


## Etiquetas

### By Subsystem

Generalmente clasificamos issues bajo el concepto de "subsistema", lo que nos permite conocer que parte(s) del código base son manipuladas.

**Subsystems generally are**:

* `lib/*.js`
* `doc`, `build`, `tools`, `test`, `deps`, `lib / src` (especiales), puede haber mas.
* `meta` for anything non-code (process) related

Puede haber mas de un subsistema válido para cada issue o pull request particular.


### General

Por favor úselos cuando sea posible/apropiado

* `confirmed-bug` - Bugs cuya existencia se haya verificado
* `discuss` -Temas que deben ser puestos a discusión
* `feature request` - Cualquier issue que solicite una nueva característica (usualmente no son PRs)
* `good first issue` - Issues ideales ser realizados por nuevos colaboradores

--

* `semver-{minor,major}`
  * be conservative – that is, if a change has the remote *chance* of breaking something, go for semver-major
  * al agregar una etiqueta semver, incluya un comentario explicando el motivo de la adición
  * minor vs. patch: roughly: "does it add a new method / does it add a new section to the docs"
  * major vs. everything else: run last versions tests against this version, if they pass, **probably** minor or patch
  * A breaking change helper ([full source](https://gist.github.com/chrisdickinson/ba532fa0e4e243fb7b44)):
  ```sh
  git checkout $(git show -s --pretty='%T' $(git show-ref -d $(git describe --abbrev=0) | tail -n1 | awk '{print $1}')) -- test; make -j4 test
  ```

### Soporte a largo plazo/Etiquetas de versión

Estas etiquetas se utilizan para conocer a que rama entrará el commit:

* `dont-land-on-v?.x`
  * Para cambios que no aplican para a una determinada línea de release
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
  * Aplicado a PRs que el grupo de trabajo LTS debería considerar incluir en una versión LTS
  * Does not indicate that any specific action will be taken, but can be effective as messaging to non-collaborators
* `lts-agenda`
  * Para temas que necesitan ser discutidos por el grupo de trabajo de LTS
  * (for example semver-minor changes that need or should go into an LTS release)
* `v?.x`
  * Automatically applied to changes that do not target `master` but rather the `v?.x-staging` branch

Una vez que la línea lanzada entra a la etapa de mantenimiento, ya no es necesario que se anexen sus etiquetas correspondientes, sólo se deberán incluir la reparaciones de bugs más importantes.

### Otras etiquetas

* Etiquetas de Sistema Operativo
  * `macos`, `windows`, `smartos`, `aix`
  * Sistemas linux implícitos por defecto
* Etiquetas de arquitectura
  * `arm`, `mips`, `s390`, `ppc`
  * Desde que están incluidos por defecto, no de incluye arquitectura x86{_64}


## Actualizar Node.js desde el repositorio principal

* `git remote add upstream git://github.com/nodejs/node.git`

para actualizar desde nodejs/node:
* `git checkout master`
* `git remote update -p` OR `git fetch --all` (I prefer the former)
* `git merge --ff-only upstream/master` (or `REMOTENAME/BRANCH`)

## Buenas prácticas

* Al crear PRs, dedicar el tiempo necesario a escribir descripciones completas.
* Usually only squash at the end of your work.
