# Menținere npm în Node.js

New pull requests should be opened when a "next" version of npm has been released. Once the "next" version has been promoted to "latest" the PR should be updated as necessary.

Two weeks after the "latest" release has been promoted it can land on master assuming no major regressions are found. There are no additional constraints for Semver-Major releases.

The specific Node.js release streams the new version will be able to land into are at the discretion of the release and LTS teams.

This process only covers full updates to new versions of npm. Cherry-picked changes can be reviewed and landed via the normal consensus seeking process.

## Pasul 1: Clonează npm

```console
$ git clone https://github.com/npm/cli.git npm
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
