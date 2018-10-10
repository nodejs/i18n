# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Escenificación de ramas

Cada línea de lanzamiento tiene una escenificación de rama que el publicador usará como un bloc de notas mientras prepara el lanzamiento. El nombre de la rama es formateado de la siguiente forma: `vN.x-staging`, donde `N` es el número del lanzamiento mayor.

*Nota*: Para la escenificación de ramas activa vea el [Calendario de Lanzamiento](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita ser refactorizado?

Si un cherry-pick de master no aterriza limpiamente en una escenificación de rama, el lanzador marcará la pull request con una etiqueta particular para esa línea de lanzamiento (p. e.j `backport-requested-vN.x`), especificando a nuestras herramientas que esta pull request no debe ser incluida. Entonces, el lanzador agregará un comentario solicitando que se realice un backport para una pull request.

## ¿Qué puede ser refactorizado?

La línea de lanzamiento "Current" es mucho más indulgente que las líneas de lanzamiento LTS en lo que se puede aterrizar. Nuestras líneas de lanzamiento LTS (vea el [Plan de Lanzamiento](https://github.com/nodejs/Release#release-plan)) requieren que los commits maduren en el lanzamiento Current por al menos 2 semanas antes de que puedan aterrizar en una escenificación de rama LTS. Solo después de la "maduración" esos commits podrán ser seleccionados o refactorizados.

## Cómo presentar una pull request de backport

Para los siguientes pasos, vamos a suponer que es necesario un backport para la línea de lanzamiento v6.x. Todos los comandos usarán la rama `v6.x-staging` como la rama objetivo. Para enviar una pull request de backport a otra rama, simplemente reemplace eso con la escenificación de rama para la línea de lanzamiento hacia la que está dirigida.

1. Compruebe la escenificación de rama para la línea de lanzamiento apuntada
2. Asegúrese que la escenificación de rama local esté actualizada con el remoto
3. Cree una nueva rama fuera de la escenificación de rama

```shell
# Asumiendo que tu fork de Node.js es verificado en $NODE_DIR,
# el romoto de origen señala a tu fork, y el remoto upstream señala
# a git://github.com/nodejs/node
cd $NODE_DIR
# Si v6.x-staging es verificado `pull` debería ser usado en lugar de `fetch`
git fetch upstream v6.x-staging:v6.x-staging -f
# Suponiendo que queremos realizar un backport para PR #10157
git checkout -b backport-10157-to-v6.x v6.x-staging
# Asegúrate de que no haya artefactos de prueba de compilaciones anteriores
# Tenga en cuenta que este comando elimina todos los archivos y directorios
# que no están bajo el control de revisión de ./test directory.
# Es opcional y debe ser usado con precaución.
git clean -xfd ./test/
```

1. Después de crear la rama, aplique los cambios a la rama. El cherry-pick probablemente fallará debido a los conflictos. En ese caso, verás algo así:

```shell
# Decir que $SHA es 773cdc31ef
$ git cherry-pick $SHA # Use su error de hash de commit: podría no aplicar 773cdc3... <commit title>
pista: después de resolver los conflictos, marque las rutas corregidas 
pista: con 'git add <paths>' or 'git rm <paths>
pista: y realice commit de los resultados con 'git commit'
```

1. Realice los cambios requeridos para eliminar los conflictos, añada los archivos al índice usando `git add`, y luego realice commit a los cambios. Eso se puede hacer con `git cherry-pick --continue`.
2. Deje el mensaje del commit como está. Si piensa que debe ser modificado, comente en la Pull Request.
3. Asegúrese que `make -j4 test` pase.
4. Impulse los cambios a su fork
5. Abra una pull request: 
    1. Asegúrese de apuntar la rama `v6.x-staging` en el pull request.
    2. Incluya el objetivo del backport en el título de la pull request en el siguiente formato — `[v6.x backport] <commit title>`. Ejemplo: `proceso [v6.x backport]: mejora el rendimiento de nextTick`
    3. Compruebe la casilla etiquetada como "Permitir ediciones de mantenedores".
    4. En la descripción añada una referencia al PR original
    5. Ejecute un trabajo CI [`node-test-pull-request`][] (con `REBASE_ONTO` establecido al predeterminado `<pr base branch>`)
6. Si durante el proceso de revisión surgen conflictos, use lo siguiente para rebase: `git pull --rebase upstream v6.x-staging`

Después que aterrice el PR reemplace la etiqueta `backport-requested-v6.x` en el PR original con `backported-to-v6.x`.