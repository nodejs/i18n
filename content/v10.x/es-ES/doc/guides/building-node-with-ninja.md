# Compilar Node.js con Ninja

El propósito de esta guía es mostrar cómo compilar Node.js usando [Ninja](https://ninja-build.org/), ya que hacerlo puede ser significativamente más rápido que usar `make`. Por favor, consulte [el sitio de Ninja](https://ninja-build.org/) para obtener instrucciones de instalación (solo unix).

Para compilar Node.js con ninja, hay 3 pasos que se deben seguir:

1. Configure las reglas de compilación basadas en el sistema operativo del proyecto mediante `./configure --ninja`.
2. Ejecute `ninja -C out/Release` para producir un binario de lanzamiento compilado.
3. Por último, haga un enlace simbólico a `./node` usando `ln -fs out/Release/node node`.

Al ejecutar `ninja -C out/Release` verá una impresión similar a la siguiente si la compilación tuvo éxito:

```txt
ninja: Entering directory `out/Release`
[4/4] LINK node, POSTBUILDS
```

La línea inferior cambiará durante la compilación, mostrando el progreso como pasos de compilación `[finished/total]`. Esta es una impresión útil que `make` no produce y es uno de los beneficios de usar Ninja. Además, es probable que Ninja compile mucho más rápido que incluso `make -j4` (o `-j<number of processor threads on your machine>`).

## Consideraciones

Las compilaciones de Ninja varían ligeramente de las compilaciones de `make`. Si desea ejecutar `make test` después, es probable que `make` aún tenga que recompilar cierta cantidad de Node.js.

Como tal, si desea ejecutar las pruebas, puede ser útil invocar el corredor de prueba directamente, de este modo: `tools/test.py --mode=release message parallel sequential -J`

## Alias

`alias nnode='./configure --ninja && ninja -C out/Release && ln -fs
out/Release/node node'`

## Producir una compilación de depuración

El alias anterior se puede modificar ligeramente para producir una compilación de depuración, en lugar de una compilación de lanzamiento, como se muestra a continuación: `alias nnodedebug='./configure --ninja && ninja -C out/Debug && ln -fs
out/Debug/node node_g'`
