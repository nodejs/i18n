# Mantenimiento de los archivos Build

Este documento explica cómo mantener los archivos build en la base del código.

## Resumen

Sobre cómo compilar el núcleo de Node.js, vea [Compilando Node.js](../../BUILDING.md).

Hay tres archivos build principales que pueden ser ejecutados directamente al compilar Node.js:

- `configure`: un script de Python 2 que detecta las capacidades del sistema y ejecuta [GYP](https://gyp.gsrc.io/docs/UserDocumentation.md). Genera `config.gypi`, el cual incluye parámetros usados por GYP para crear plataformas dependientes de los archivos build. Its output is usually in one of these formats: Makefile, MSbuild, ninja, or XCode project files (the main Makefile mentioned below is maintained separately by humans). Para una guía detallada sobre este script, vea [configure](#configure).
- `vcbuild.bat`: Un Script Windows Batch que localiza herramientas de compilación, proporciona un subconjunto de objetivos disponibles en el [Makefile](#makefile), y unos pocos objetivos propios. Para una guía detallada sobre este script, vea [vcbuild.bat](#vcbuildbat).
- `Makefile`: Un Makefile que puede ser ejecutado por un Make GNU. Proporciona un conjunto de objetivos que compilan y prueban el binario de Node.js, producen lanzamientos y documentaciones, e interactúan con el CI para ejecutar pruebas de rendimiento o tests. Para una guía detallada sobre este archivo, vea [Makefile](#makefile).

En Windows `vcbuild.bat` ejecuta [configure](#configure) antes de compilar el binario de Node.js, en otros sistemas `configure` debe ser ejecutado manualmente antes de ejecutar `make` en el `Makefile`.

## vcbuild.bat

Para ver el texto de ayuda, ejecuta `.\vcbuild help`. Actualice este archivo cuando necesite actualizar el build y probar procesos en Windows.

## configure

Para ver el texto de ayuda, ejecute `python configure --help`. Actualice este archivo cuando necesite actualizar el proceso de configuración.

## Makefile

Para ver el texto de ayuda, ejecute `make help`. Este archivo no es generado, es mantenido por humanos. Tenga en cuenta que no es usualmente ejecutado en Windows, donde [vcbuild.bat](#vcbuildbat) se utiliza en su lugar.

### Opciones

- `-j <n>`: número de subprocesos usados para compilar el binario. Tenga en cuenta que en los objetivos no-ci, las pruebas paralelas tomarán todos los núcleos disponibles, independientemente de esta opción.
