# Mantener npm en Node.js

## Paso 1: Clona npm

```console
$ git clone https://github.com/npm/npm.git
$ cd npm
```

o si ya has clonado el npm, asegurese de que el repositorio este actualizado

```console
$ git remote update -p
$ git reset --hard origin latest
```

## Paso 2: Construir lanzamiento

```console
$ git checkout vX.Y.Z
$ make release
```

Note: please run `npm dist-tag ls npm` and make sure this is the `latest` **dist-tag**. `latest` on git is usually released as `next` when it's time to downstream

## Step 3: Remove old npm

```console
$ cd /path/to/node
$ git remote update -p
$ git checkout -b npm-x.y.z origin/master
$ cd deps
$ rm -rf npm
```

## Step 4: Extract and commit new npm

```console
$ tar zxf /path/to/npm/release/npm-x.y.z.tgz
$ git add -A npm
$ git commit -m "deps: upgrade npm to x.y.z"
$ cd ..
```

## Step 5: Update licenses

```console
$ ./configure
$ make -j4
$ ./tools/license-builder.sh
# The following commands are only necessary if there are changes
$ git add .
$ git commit -m "doc: update npm LICENSE using license-builder.sh"
```

Note: please ensure you are only making the updates that are changed by npm.

## Step 6: Apply Whitespace fix

```console
$ git rebase --whitespace=fix master
```

## Step 7: Test the build

```console
$ make test-npm
```