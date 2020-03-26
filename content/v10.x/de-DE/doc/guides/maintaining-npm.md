# Aktualisierung von npm in Node.js

New pull requests should be opened when a "next" version of npm has been released. Once the "next" version has been promoted to "latest" the PR should be updated as necessary.

Two weeks after the "latest" release has been promoted it can land on master assuming no major regressions are found. There are no additional constraints for Semver-Major releases.

The specific Node.js release streams the new version will be able to land into are at the discretion of the release and LTS teams.

This process only covers full updates to new versions of npm. Cherry-picked changes can be reviewed and landed via the normal consensus seeking process.

## Schritt 1: npm klonen

```console
$ git clone https://github.com/npm/cli.git npm
$ cd npm
```

Falls Sie npm bereits geklont haben, stellen Sie sicher, dass es auf dem neuesten Stand ist.

```console
$ git remote update -p
$ git reset --hard origin latest
```

## Schritt 2: Release bauen

```console
$ git checkout vX.Y.Z
$ make release
```

Note: please run `npm dist-tag ls npm` and make sure this is the `latest` **dist-tag**. `latest` on git is usually released as `next` when it's time to downstream

## Schritt 3: Altes npm entfernen

```console
$ cd /path/to/node
$ git remote update -p
$ git checkout -b npm-x.y.z origin/master
$ cd deps
$ rm -rf npm
```

## Schritt 4: Neues npm extrahieren und committen

```console
$ tar zxf /path/to/npm/release/npm-x.y.z.tgz
$ git add -A npm
$ git commit -m "deps: upgrade npm to x.y.z"
$ cd ..
```

## Schritt 5: Lizenz aktualisieren

```console
$ ./configure
$ make -j4
$ ./tools/license-builder.sh
# The following commands are only necessary if there are changes
$ git add .
$ git commit -m "doc: update npm LICENSE using license-builder.sh"
```

Hinweis: Bitte stellen Sie sicher, dass Sie nur Änderungen machen welche auch durch npm gemacht wurden.

## Schritt 6: Leerzeichen korrigieren

```console
$ git rebase --whitespace=fix master
```

## Schritt 7: Änderungen testen

```console
$ make test-npm
```