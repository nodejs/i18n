# Erstellen von Node.js mit Ninja

Der Zweck dieser Anleitung ist, zu zeigen, wie man unter Verwendung von [Ninja](https://ninja-build.org/) Node.js aufbaut. Dies kann deutlich schneller sein, als die Verwendung von `make`. Sehen Sie dazu auf [Ninja's site](https://ninja-build.org/) die Installationsanleitungen (nur Unix) ein.

Um Node.js mit Ninja herzustellen, gibt es 3 notwendige Stufen:

1. Konfigurieren der Projekt OS-basierten Regeln mittels `./configure --ninja`.
2. Um eine kompilierte Binärdatei zu erzeugen, führen Sie `ninja -C out/Release` aus.
3. Letztlich Symlink mit `./node` using `ln -fs out/Release/node node` erzeugen.

Wenn `ninja -C out/Release` ausgeführt wird, erhalten Sie eine ähnliche Ausgabe wie nachfolgend, wenn der Build ordnungsgemäß verlief:

```txt
ninja: Entering directory `out/Release`
[4/4] LINK node, POSTBUILDS
```

Die untere Zeile verändert sich beim erstellen, sie zeigt den Fortschritt als `[finished/total]`. Dies ist eine nützliche Ausgabe, welche `make` nicht erzeugt und dies ist einer der Vorteile von Ninja. Desweiteren wird Ninja wahrscheinlich schneller kompilieren als selbst `make -j4` (oder `-j<number of processor threads on your machine>`).

## Erwägungen

Ninja Builds unterscheiden sich leicht von `make` builds. Wenn Sie `make test` hinterher laufen lassen, wird `make` wahrscheinlich einiges von Node.js neu erstellen müssen.

Wenn Sie daher die Tests laufen lassen wollen, kann es hilfreich sein, das Testprogramm, wie folgend, direkt aufzurufen: `tools/test.py --mode=release message parallel sequential -J`

## Alias

`alias nnode='./configure --ninja && ninja -C out/Release && ln -fs out/Release/node node'`

## Ein Debug-Build erstellen

Das obige Alias kann kann zur Erstellung eines Debug-Builds leicht modifiziert werden, ganz im Gegensatz zum Release-Build wie folgend gezeigt: `alias nnodedebug='./configure --ninja && ninja -C out/Debug && ln -fs out/Debug/node node_g'`
