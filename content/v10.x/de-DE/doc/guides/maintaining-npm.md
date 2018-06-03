# Aktualisierung von npm in Node.js

## Schritt 1: npm klonen

```console
$ git clone https://github.com/npm/npm.git
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

Hinweis: Bitte führen Sie `npm dist-tag ls npm` aus und stellen Sie sicher, dass dies der `latest` **dist-tag** ist. `latest` in git wird für gewöhnlich als `next` veröffentlicht, wenn es stabil ist.

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