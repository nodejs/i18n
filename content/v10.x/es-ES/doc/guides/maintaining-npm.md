# Mantenimiento del npm en Node.js

New pull requests should be opened when a "next" version of npm has been released. Once the "next" version has been promoted to "latest" the PR should be updated as necessary.

Two weeks after the "latest" release has been promoted it can land on master assuming no major regressions are found. There are no additional constraints for Semver-Major releases.

The specific Node.js release streams the new version will be able to land into are at the discretion of the release and LTS teams.

This process only covers full updates to new versions of npm. Cherry-picked changes can be reviewed and landed via the normal consensus seeking process.

## Paso 1: Clonar al npm

```console
$ git clone https://github.com/npm/cli.git npm
$ cd npm
```

o si ya ha clonado el npm, asegúrese de que el repositorio este actualizado

```console
$ git remote update -p
$ git reset --hard origin latest
```

## Paso 2: Lanzamiento del Build

```console
$ git checkout vX.Y.Z
$ make release
```

Nota: por favor ejecute `npm dist-tag ls npm` y asegúrese que esta es la `latest`**dist-tag**. `latest` en git es usualmente publicado como `next` cuando es hora de downstream

## Paso 3: Remover el npm anterior

```console
$ cd /path/to/node
$ git remote update -p
$ git checkout -b npm-x.y.z origin/master
$ cd deps
$ rm -rf npm
```

## Paso 4: Extraer y asentar un nuevo npm

```console
$ tar zxf /path/to/npm/release/npm-x.y.z.tgz
$ git add -A npm
$ git commit -m "deps: upgrade npm to x.y.z"
$ cd ..
```

## Paso 5: Actualizar licencias

```console
$ ./configure
$ make -j4
$ ./tools/license-builder.sh
# Los siguientes comandos solo son necesarios si hay cambios
$ git add .
$ git commit -m "doc: update npm LICENSE using license-builder.sh"
```

Nota: por favor asegúrese que solo está haciendo actualizaciones que son cambiadas por el npm.

## Paso 6: Aplicar corrección de Whitespace

```console
$ git rebase --whitespace=fix master
```

## Paso 7: Probar la compilación

```console
$ make test-npm
```
