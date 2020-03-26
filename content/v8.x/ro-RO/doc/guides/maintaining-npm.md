# Menținere npm în Node.js

## Pasul 1: Clonează npm

```console
$ git clone https://github.com/npm/npm.git
$ cd npm
```

sau dacă ai npm deja clonat, asigură-te că depozitul este actualizat

```console
$ git remote update -p
$ git reset --hard origin latest
```

## Pasul 2: Realizează eliberarea

```console
$ git checkout vX.Y.Z
$ make release
```

Note: please run `npm dist-tag ls npm` and make sure this is the `latest` **dist-tag**. `latest` on git is usually released as `next` when it's time to downstream

## Pasul 3: Elimină vechiul npm

```console
$ cd /calea/către/node
$ git remote update -p
$ git checkout -b npm-x.y.z origin/master
$ cd deps
$ rm -rf npm
```

## Pasul 4: Extrage și comite noul npm

```console
$ tar zxf /calea/către/lansarea/npm/npm-x.y.z.tgz
$ git add -A npm
$ git commit -m "dependențe: actualizare npm la x.y.z"
$ cd ..
```

## Pasul 5: Actualizare licențe

```console
$ ./configure
$ make -j4
$ ./tools/license-builder.sh
# Următoarele comenzi sunt necesare doar dacă există modificări
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
