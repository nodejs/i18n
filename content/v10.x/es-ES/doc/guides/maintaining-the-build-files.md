# Mantenimiento de los archivos Build

Este documento explica cómo mantener los archivos build en la base del código.

## Resumen

Sobre cómo compilar el núcleo de Node.js, vea [Compilando Node.js](../../BUILDING.md).

Hay tres archivos build principales que pueden ser ejecutados directamente al compilar Node.js:

- `configure`: A Python 2 script that detects system capabilities and runs [GYP](https://gyp.gsrc.io/docs/UserDocumentation.md). It generates `config.gypi` which includes parameters used by GYP to create platform-dependent build files. Its output is usually in one of these formats: Makefile, MSbuild, ninja, or XCode project files (the main Makefile mentioned below is maintained separately by humans). For a detailed guide on this script, see [configure](#configure).
- `vcbuild.bat`: A Windows Batch Script that locates build tools, provides a subset of the targets available in the [Makefile](#makefile), and a few targets of its own. For a detailed guide on this script, see [vcbuild.bat](#vcbuildbat).
- `Makefile`: Un Makefile que puede ser ejecutado por un Make GNU. It provides a set of targets that build and test the Node.js binary, produce releases and documentation, and interact with the CI to run benchmarks or tests. For a detailed guide on this file, see [Makefile](#makefile).

On Windows `vcbuild.bat` runs [configure](#configure) before building the Node.js binary, on other systems `configure` must be run manually before running `make` on the `Makefile`.

## vcbuild.bat

Para ver el texto de ayuda, ejecuta `.\vcbuild help`. Update this file when you need to update the build and testing process on Windows.

## configure

Para ver el texto de ayuda, ejecute `python configure --help`. Update this file when you need to update the configuration process.

## Makefile

Para ver el texto de ayuda, ejecute `make help`. This file is not generated, it is maintained by humans. Note that this is not usually run on Windows, where [vcbuild.bat](#vcbuildbat) is used instead.

### Opciones

- `-j <n>`: número de subprocesos usados para compilar el binario. Note that on the non-ci targets, the parallel tests will take up all the available cores, regardless of this option.