# Costruire Node.js con Ninja

The purpose of this guide is to show how to build Node.js using [Ninja](https://ninja-build.org/), as doing so can be significantly quicker than using `make`. Please see [Ninja's site](https://ninja-build.org/) for installation instructions (unix only).

Per costruire Node.js con ninja, ci sono 3 step che devono essere compiuti:

1. Configurare le regole di build del progetto basate sul sistema operativo tramite `./configure --ninja`.
2. Eseguire `ninja -C out/Release` per produrre un binario di release compilato.
3. Infine, fare il collegamento simbolico (symlink) a `./node` utilizzando `ln -fs out/Release/node node`.

When running `ninja -C out/Release` you will see output similar to the following if the build has succeeded:

```txt
ninja: Entering directory `out/Release`
[4/4] LINK node, POSTBUILDS
```

The bottom line will change while building, showing the progress as `[finished/total]` build steps. This is useful output that `make` does not produce and is one of the benefits of using Ninja. Also, Ninja will likely compile much faster than even `make -j4` (or `-j<number of processor threads on your machine>`).

## Considerazioni

Le build di Ninja variano leggermente dalle build di `make`. If you wish to run `make test` after, `make` will likely still need to rebuild some amount of Node.js.

As such, if you wish to run the tests, it can be helpful to invoke the test runner directly, like so: `tools/test.py --mode=release message parallel sequential -J`

## Alias

`alias nnode='./configure --ninja && ninja -C out/Release && ln -fs
out/Release/node node'`

## Produrre una build di debug

The above alias can be modified slightly to produce a debug build, rather than a release build as shown below: `alias nnodedebug='./configure --ninja && ninja -C out/Debug && ln -fs
out/Debug/node node_g'`