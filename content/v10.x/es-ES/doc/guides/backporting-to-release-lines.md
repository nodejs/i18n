# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Escenificación de ramas

Each release line has a staging branch that the releaser will use as a scratch pad while preparing a release. The branch name is formatted as follows: `vN.x-staging` where `N` is the major release number.

For the active staging branches see the [Release Schedule](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita recibir un backport?

If a cherry-pick from master does not land cleanly on a staging branch, the releaser will mark the pull request with a particular label for that release line (e.g. `backport-requested-vN.x`), specifying to our tooling that this pull request should not be included. The releaser will then add a comment requesting that a backport pull request be made.

## ¿A qué se le puede hacer backport?

The "Current" release line is much more lenient than the LTS release lines in what can be landed. Our LTS release lines (see the [Release Plan](https://github.com/nodejs/Release#release-plan)) require that commits mature in the Current release for at least 2 weeks before they can be landed in an LTS staging branch. Only after "maturation" will those commits be cherry-picked or backported.

## Cómo enviar una pull request de backport

For the following steps, let's assume that a backport is needed for the v8.x release line. All commands will use the `v8.x-staging` branch as the target branch. In order to submit a backport pull request to another branch, simply replace that with the staging branch for the targeted release line.

1. Compruebe la escenificación de rama para la línea de lanzamiento apuntada
2. Asegúrese que la escenificación de rama local esté actualizada con el remoto
3. Cree una nueva rama fuera de la escenificación de rama

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

4. Después de crear la rama, aplique los cambios a la rama. The cherry-pick will likely fail due to conflicts. In that case, you will see something like this:

```shell
# Decir que $SHA es 773cdc31ef
$ git cherry-pick $SHA # Use su error de hash de commit: podría no aplicar 773cdc3... <commit title>
pista: después de resolver los conflictos, marque las rutas corregidas 
pista: con 'git add <paths>' or 'git rm <paths>
pista: y realice commit de los resultados con 'git commit'
```

5. Make the required changes to remove the conflicts, add the files to the index using `git add`, and then commit the changes. That can be done with `git cherry-pick --continue`.
6. Deje el mensaje del commit como está. If you think it should be modified, comment in the Pull Request. The `Backport-PR-URL` metadata does need to be added to the commit, but this will be done later.
7. Asegúrese que `make -j4 test` pase.
8. Impulse los cambios a su fork
9. Abra una pull request: 
    1. Be sure to target the `v8.x-staging` branch in the pull request.
    2. Include the backport target in the pull request title in the following format — `[v8.x backport] <commit title>`. Example: `[v8.x backport] process: improve performance of nextTick`
    3. Compruebe la casilla etiquetada como "Permitir ediciones de mantenedores".
    4. In the description add a reference to the original PR.
    5. Amend the commit message and include a `Backport-PR-URL:` metadata and re-push the change to your fork.
    6. Run a [`node-test-pull-request`][] CI job (with `REBASE_ONTO` set to the default `<pr base branch>`)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v8.x-staging`

After the PR lands replace the `backport-requested-v8.x` label on the original PR with `backported-to-v8.x`.