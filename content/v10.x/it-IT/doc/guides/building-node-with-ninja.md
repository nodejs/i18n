# Costruire Node.js con Ninja

Lo scopo di questa guida è mostrare come costruire Node.js utilizzando [Ninja](https://ninja-build.org/), poiché fare così può essere significativamente più veloce che utilizzando `make`. Si prega di consultare il [sito di Ninja](https://ninja-build.org/) per istruzioni sull'installazione (solo per unix).

Per costruire Node.js con ninja, ci sono 3 step che devono essere compiuti:

1. Configurare le regole di build del progetto basate sul sistema operativo tramite `./configure --ninja`.
2. Eseguire `ninja -C out/Release` per produrre un binario di release compilato.
3. Infine, fare il collegamento simbolico (symlink) a `./node` utilizzando `ln -fs out/Release/node node`.

Durante l'esecuzione di `ninja -C out/Release` vedrai un output simile al seguente se la build è riuscita:

```txt
ninja: Entering directory `out/Release`
[4/4] LINK node, POSTBUILDS
```

La linea inferiore cambierà durante la costruzione, mostrando l'avanzamento come step di build `[finished/total]`. Questo è un utile output che `make` non produce ed è uno dei vantaggi dell'utilizzo di Ninja. Inoltre, Ninja probabilmente compilerà molto più velocemente anche di `make -j4` (o `-j<number of processor threads on your machine>`).

## Considerazioni

Le build di Ninja variano leggermente dalle build di `make`. Se vuoi eseguire `make test` in seguito, `make` probabilmente dovrà comunque ricostruire una certa quantità di Node.js.

Di conseguenza, se desideri eseguire i test, può essere utile invocare il test runner direttamente, in questo modo: `tools/test.py --mode=release message parallel sequential -J`

## Alias

`alias nnode='./configure --ninja && ninja -C out/Release && ln -fs
out/Release/node node'`

## Produrre una build di debug

L'alias precedente può essere modificato leggermente per produrre una build di debug, piuttosto che una release build come illustrato di seguito: `alias nnodedebug='./configure --ninja && ninja -C out/Debug && ln -fs
out/Debug/node node_g'`
