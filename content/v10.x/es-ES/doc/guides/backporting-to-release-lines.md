# Cómo realizar Backport a una Pull Request a una Línea de Lanzamiento

## Escenificación de ramas

Cada línea de lanzamiento tiene una escenificación de rama que el publicador usará como un bloc de notas mientras prepara el lanzamiento. El nombre de la rama es formateado de la siguiente forma: `vN.x-staging`, donde `N` es el número del lanzamiento mayor.

*Nota*: Para la escenificación de ramas activa vea el [Calendario de Lanzamiento](https://github.com/nodejs/Release#release-schedule1).

## ¿Qué necesita ser backported?

Si un cherry-pick de master no aterriza limpiamente en una escenificación de rama, el lanzador marcará la pull request con una etiqueta particular para esa línea de lanzamiento (p. e.j `backport-requested-vN.x`), especificando a nuestras herramientas que esta pull request no debe ser incluida. Entonces, el lanzador agregará un comentario solicitando que se realice un backport para una pull request.

## What can be backported?

The "Current" release line is much more lenient than the LTS release lines in what can be landed. Our LTS release lines (see the [Release Plan](https://github.com/nodejs/Release#release-plan)) require that commits mature in the Current release for at least 2 weeks before they can be landed in an LTS staging branch. Only after "maturation" will those commits be cherry-picked or backported.

## How to submit a backport pull request

For the following steps, let's assume that a backport is needed for the v6.x release line. All commands will use the `v6.x-staging` branch as the target branch. In order to submit a backport pull request to another branch, simply replace that with the staging branch for the targeted release line.

1. Checkout the staging branch for the targeted release line
2. Make sure that the local staging branch is up to date with the remote
3. Create a new branch off of the staging branch

```shell
# Assuming your fork of Node.js is checked out in $NODE_DIR,
# the origin remote points to your fork, and the upstream remote points
# to git://github.com/nodejs/node
cd $NODE_DIR
# If v6.x-staging is checked out `pull` should be used instead of `fetch`
git fetch upstream v6.x-staging:v6.x-staging -f
# Assume we want to backport PR #10157
git checkout -b backport-10157-to-v6.x v6.x-staging
# Ensure there are no test artifacts from previous builds
# Note that this command deletes all files and directories
# not under revision control below the ./test directory.
# It is optional and should be used with caution.
git clean -xfd ./test/
```

1. After creating the branch, apply the changes to the branch. The cherry-pick will likely fail due to conflicts. In that case, you will see something like this:

```shell
# Say the $SHA is 773cdc31ef
$ git cherry-pick $SHA # Use your commit hash
error: could not apply 773cdc3... <commit title>
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