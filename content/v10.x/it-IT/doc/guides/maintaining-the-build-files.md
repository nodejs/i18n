# Manutenzione dei file di Build

Questo documento spiega come mantenere i file di build nel codebase.

## Panoramica

Per le istruzioni su come costruire il Node.js core, vedi [Costruire Node.js](../../BUILDING.md).

Ci sono tre file di build principali che possono essere eseguiti direttamente durante la costruzione di Node.js:

- `configure`: A Python 2 script that detects system capabilities and runs [GYP](https://gyp.gsrc.io/docs/UserDocumentation.md). It generates `config.gypi` which includes parameters used by GYP to create platform-dependent build files. Its output is usually in one of these formats: Makefile, MSbuild, ninja, or XCode project files (the main Makefile mentioned below is maintained separately by humans). For a detailed guide on this script, see [configure](#configure).
- `vcbuild.bat`: A Windows Batch Script that locates build tools, provides a subset of the targets available in the [Makefile](#makefile), and a few targets of its own. For a detailed guide on this script, see [vcbuild.bat](#vcbuildbat).
- `Makefile`: A Makefile that can be run with GNU Make. It provides a set of targets that build and test the Node.js binary, produce releases and documentation, and interact with the CI to run benchmarks or tests. For a detailed guide on this file, see [Makefile](#makefile).

Su Windows `vcbuild.bat` esegue [configure](#configure) prima di costruire il binario Node.js, su altri sistemi `configure` deve essere eseguito manualmente prima di eseguire `make` sul `Makefile`.

## vcbuild.bat

Per vedere il testo guida, eseguire `.\vcbuild help`. Aggiorna questo file quando è necessario aggiornare il processo di build e test su Windows.

## configure

Per vedere il testo guida, eseguire `python configure --help`. Aggiornare questo file quando è necessario aggiornare il processo di configurazione.

## Makefile

Per vedere il testo guida, eseguire `make help`. Questo file non è generato, è mantenuto dagli umani. Note that this is not usually run on Windows, where [vcbuild.bat](#vcbuildbat) is used instead.

### Option

- `-j <n>`: numero di thread utilizzati per costruire il binario. Notare che sui target non-ci, i test paralleli impegneranno tutti i core disponibili, indipendentemente da questa opzione.
