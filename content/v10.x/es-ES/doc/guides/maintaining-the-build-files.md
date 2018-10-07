# Mantenimiento de los archivos Build

Este documento explica cómo mantener los archivos build en la base del código.

## Resumen

Sobre cómo compilar el núcleo de Node.js, vea [Compilando Node.js](../../BUILDING.md).

Hay tres archivos build principales que pueden ser ejecutados directamente al compilar Node.js:

- `configure`: un script de Python 2 que detecta las capacidades del sistema y ejecuta [GYP](https://gyp.gsrc.io/docs/UserDocumentation.md). Genera `config.gypi`, el cual incluye parámetros usados por GYP para crear plataformas dependientes de los archivos build. Su output es usualmente en uno de estos formatos: archivos de proyecto Makefile, MSbuild, ninja o XCode. (Nota: el Makefile principal mencionado a continuación es mantenido por separado por humanos). Para una guía detallada sobre este script, vea [configure](#configure).
- `vcbuild.bat`: A Windows Batch Script that locates build tools, provides a subset of the targets available in the [Makefile](#makefile), and a few targets of its own. For a detailed guide on this script, see [vcbuild.bat](#vcbuild.bat).
- `Makefile`: A Makefile that can be run with GNU Make. It provides a set of targets that build and test the Node.js binary, produce releases and documentation, and interact with the CI to run benchmarks or tests. For a detailed guide on this file, see [Makefile](#makefile).

On Windows `vcbuild.bat` runs [configure](#configure) before building the Node.js binary, on other systems `configure` must be run manually before running `make` on the `Makefile`.

## vcbuild.bat

To see the help text, run `.\vcbuild help`. Update this file when you need to update the build and testing process on Windows.

## configure

To see the help text, run `python configure --help`. Update this file when you need to update the configuration process.

## Makefile

To see the help text, run `make help`. This file is not generated, it is maintained by humans. Note that this is not usually run on Windows, where [vcbuild.bat](#vcbuild.bat) is used instead.

### Options

- `-j <n>`: number of threads used to build the binary. Note that on the non-ci targets, the parallel tests will take up all the available cores, regardless of this option.