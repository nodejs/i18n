# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Ramas de escenificación

Cada línea de la release tiene un branch de staging que el publicador usará como un bloc de notas al preparar la release. El nombre del branch tiene el siguiente formato: `vN.x-staging`, donde `N` es el número del major release.

For the active staging branches see the [Release Schedule](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita recibir un backport?

Si un cherry-pick de master no aterriza limpiamente en una rama de escenificación, el publicador marcará la pull request con una etiqueta particular para esa línea de lanzamiento (por ejemplo: `backport-requested-vN.x`), especificando a nuestras herramientas que esta pull request no debe ser incluida. Entonces, el publicador agregará un comentario solicitando que se realice un backport para una pull request.

## ¿A qué se le puede hacer backport?

La línea de lanzamiento "Actual" es mucho más indulgente que las líneas de lanzamiento LTS en lo que se puede aterrizar. Nuestras líneas de lanzamiento LTS (vea el [Plan de Lanzamiento](https://github.com/nodejs/Release#release-plan)) requieren que los commits maduren en el lanzamiento Actual por al menos 2 semanas antes de que puedan aterrizar en una rama de escenificación de LTS. Solo después de la "maduración" a esos commits se les podrá hacer cherry-pick o backport.

## Cómo enviar una pull request de backport

Para los siguientes pasos, vamos a suponer que es necesario un backport para la línea de lanzamiento v8.x. Todos los comandos usarán la rama `v8.x-staging` como la rama objetivo. Para enviar una pull request de backport a otra rama, simplemente reemplácela con la rama de escenificación para la línea de lanzamiento hacia la que está dirigida.

1. Compruebe la rama de escenificación para la línea de lanzamiento especificada
2. Asegúrese de que la rama de escenificación local esté actualizada con el remoto
3. Cree una nueva rama fuera de la rama de escenificación

```shell
# Assuming your fork of Node.js is checked out in $NODE_DIR,
# the origin remote points to your fork, and the upstream remote points
# to git://github.com/nodejs/node
cd $NODE_DIR
# If v8.x-staging is checked out `pull` should be used instead of `fetch`
git fetch upstream v8.x-staging:v8.x-staging -f
# Assume we want to backport PR #10157
git checkout -b backport-10157-to-v8.x v8.x-staging
# Ensure there are no test artifacts from previous builds
# Note that this command deletes all files and directories
# not under revision control below the ./test directory.
# Es opcional y debe ser usado con precaución.
git clean -xfd ./test/
```

4. Después de crear la rama, aplique los cambios a la rama. El cherry-pick probablemente fallará debido a los conflictos. En ese caso, verá algo así:

```shell
# Diga que $SHA es 773cdc31ef
$ git cherry-pick $SHA # Use su hash de commit 
error: podría no aplicar 773cdc3... <commit title>
pista: después de resolver los conflictos, marque las rutas corregidas 
pista: con 'git add <paths>' or 'git rm <paths>
pista: y realice un commit de los resultados con 'git commit'
```

5. Realice los cambios requeridos para eliminar los conflictos, añada los archivos al índice usando `git add`, y luego plasme los cambios vía commit. Eso se puede hacer con `git cherry-pick --continue`.
6. Deje el mensaje del commit como está. Si piensa que debe ser modificado, comente en la Pull Request. The `Backport-PR-URL` metadata does need to be added to the commit, but this will be done later.
7. Asegúrese de que `make -j4 test` pase.
8. Impulse los cambios a su bifurcación
9. Abra una pull request:
   1. Be sure to target the `v8.x-staging` branch in the pull request.
   1. Include the backport target in the pull request title in the following format — `[v8.x backport] <commit title>`. Example: `[v8.x backport] process: improve performance of nextTick`
   1. Compruebe la casilla de verificación etiquetada como "Permitir ediciones de mantenedores".
   1. In the description add a reference to the original PR.
   1. Amend the commit message and include a `Backport-PR-URL:` metadata and re-push the change to your fork.
   1. Ejecute un trabajo de CI [`node-test-pull-request`][] (con `REBASE_ONTO` establecido en el valor predeterminado `<pr base branch>`)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v8.x-staging`

After the PR lands replace the `backport-requested-v8.x` label on the original PR with `backported-to-v8.x`.
