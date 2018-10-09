# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Escenificación de ramas

Cada línea de lanzamiento tiene una escenificación de rama que el publicador usará como un bloc de notas mientras prepara el lanzamiento. El nombre de la rama es formateado de la siguiente forma: `vN.x-staging`, donde `N` es el número del lanzamiento mayor.

*Nota*: Para la escenificación de ramas activa vea el [Calendario de Lanzamiento](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita ser backported?

Si un cherry-pick de master no aterriza limpiamente en una escenificación de rama, el lanzador marcará la pull request con una etiqueta particular para esa línea de lanzamiento (p. e.j `backport-requested-vN.x`), especificando a nuestras herramientas que esta pull request no debe ser incluida. Entonces, el lanzador agregará un comentario solicitando que se realice un backport para una pull request.

## ¿Qué puede ser backported?

La línea de lanzamiento "Actual" es mucho más indulgente que las líneas de lanzamiento LTS en lo que se puede aterrizar. Nuestras líneas de lanzamiento LTS (vea el [Plan de Lanzamiento](https://github.com/nodejs/Release#release-plan)) requieren que los commits maduren en el lanzamiento Current por al menos 2 semanas antes de que puedan aterrizar en una escenificación de rama LTS. Solo después de la "maduración" esos commits podrán ser seleccionados o backported.

## Cómo presentar un backport de una pull request

Para los siguientes pasos, vamos a suponer que es necesario un backport para la línea de lanzamiento v6.x. Todos los comando usarán la rama `v6.x-staging` como la rama objetivo. Para enviar un backport de una pull request a otra rama, simplemente reemplace eso con la escenificación de rama para la línea de lanzamiento dirigida.

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
hint: after resolving the conflicts, mark the corrected paths
hint: with 'git add <paths>' or 'git rm <paths>'
hint: and commit the result with 'git commit'
```

1. Make the required changes to remove the conflicts, add the files to the index using `git add`, and then commit the changes. That can be done with `git cherry-pick --continue`.
2. Leave the commit message as is. If you think it should be modified, comment in the Pull Request.
3. Make sure `make -j4 test` passes.
4. Push the changes to your fork
5. Open a pull request: 
    1. Be sure to target the `v6.x-staging` branch in the pull request.
    2. Include the backport target in the pull request title in the following format — `[v6.x backport] <commit title>`. Example: `[v6.x backport] process: improve performance of nextTick`
    3. Check the checkbox labeled "Allow edits from maintainers".
    4. In the description add a reference to the original PR
    5. Run a [`node-test-pull-request`][] CI job (with `REBASE_ONTO` set to the default `<pr base branch>`)
6. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v6.x-staging`

After the PR lands replace the `backport-requested-v6.x` label on the original PR with `backported-to-v6.x`.