# Mantenimiento del npm en Node.js

## Paso 1: Clonar al npm

```console
$ git clone https://github.com/npm/npm.git
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

Nota: Por favor, corra `npm dist-tag is npm` y, asegúrese de que es la `latest` **dist-tag**. Generalmente, `latest` se lanza en el git como `next` cuando es momento de downstream

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
