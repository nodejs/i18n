# Manutenzione dei file di Build

Questo documento spiega come mantenere i file di build nel codebase.

## Panoramica

Per le istruzioni su come costruire il Node.js core, vedi [Costruire Node.js](../../BUILDING.md).

Ci sono tre file di build principali che possono essere eseguiti direttamente durante la costruzione di Node.js:

* `configure`: A Python 2 script that detects system capabilities and runs [GYP](https://gyp.gsrc.io/docs/UserDocumentation.md). It generates `config.gypi` which includes parameters used by GYP to create platform-dependent build files. Its output is usually in one of these formats: Makefile, MSbuild, ninja, or XCode project files (the main Makefile mentioned below is maintained separately by humans). For a detailed guide on this script, see [configure](#configure).
* `vcbuild.bat`: A Windows Batch Script that locates build tools, provides a subset of the targets available in the [Makefile](#makefile), and a few targets of its own. For a detailed guide on this script, see [vcbuild.bat](#vcbuildbat).
* `Makefile`: Un Makefile che può essere eseguito con GNU Make. It provides a set of targets that build and test the Node.js binary, produce releases and documentation, and interact with the CI to run benchmarks or tests. For a detailed guide on this file, see [Makefile](#makefile).

On Windows `vcbuild.bat` runs [configure](#configure) before building the Node.js binary, on other systems `configure` must be run manually before running `make` on the `Makefile`.

## vcbuild.bat

Per vedere il testo guida, eseguire `.\vcbuild help`. Update this file when you need to update the build and testing process on Windows.

## configure

The `configure` script recognizes many CLI flags for special build formulas. Many are not represented by `vcbuild` shortcuts, and need to be passed either by:

* Calling `python configure --XXX --YYY=PPPP` directly, followed by `vcbuild
noprojgen`
* Setting `set config_flags=--XXX --YYY=PPPP` before calling `vcbuild`

Per vedere il testo guida, eseguire `python configure --help`. Update this file when you need to update the configuration process.

## Makefile

Per vedere il testo guida, eseguire `make help`. This file is not generated, it is maintained by humans. This is not usually run on Windows, where [vcbuild.bat](#vcbuildbat) is used instead.

### Opzioni

* `-j <n>`: numero di thread utilizzati per costruire il binario. On the non-CI targets, the parallel tests will take up all the available cores, regardless of this option.
