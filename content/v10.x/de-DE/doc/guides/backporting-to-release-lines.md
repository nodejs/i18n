# How to: Zurückportieren eines Pull Requests zu einem Versionszweig

## Staging Branches

Jeder Versionszweig hat einen Staging-Branch, der dem Releaser als Zwischenspeicher während der Präparierung einer neuen Version dient. Der Branchname ist wie folgt aufgebaut: `vN.x-staging` wobei `N` die Hauptversionsnummer ist.

For the active staging branches see the [Release Schedule](https://github.com/nodejs/Release#release-schedule1).

## Was wird zurückportiert?

Wenn ein Cherry-Pick aus dem master nicht fehlerfrei in einen Staging-Branch übernommen werden konnte, wird der Releaser den Pull-Request mit einem speziellen Label für diesen Versionszweig kennzeichnen (z.B. `backport-requested-vN.x`). Das bedeutet für unser Tooling, dass dieser Pull-Request nicht enthalten sein soll. Der Releaser wird dann in einem Kommentar einen Pull-Request für die Zurückportierung anfordern.

## Was kann zurückportiert werden?

Der aktuelle Versionszweig ist weniger strikt als die LTS-Versionszweige in Bezug auf, welche Pull-Requests übernommen werden können. Unsere LTS-Versionszweige (siehe im [Release-Plan](https://github.com/nodejs/Release#release-plan)) erfordern, dass Commits mindestens zwei Wochen im aktuellen Versionszweig heranreifen bevor sie in einen LTS-Staging-Branch übernommen werden können. Nur nach dieser "Reifephase" werden diese Commits zurückportiert oder gecherry-picked.

## Wie reicht man einen Pull-Request für eine Zurückportierung ein?

For the following steps, let's assume that a backport is needed for the v8.x release line. All commands will use the `v8.x-staging` branch as the target branch. Um einen Pull-Request für einen anderen Branch einzureichen, ersetze diesen einfach mit dem Namen des Staging-Branches des entsprechenden Versionszweiges.

1. Checke den Staging-Branch für den Ziel-Versionszweig aus
2. Stelle sicher, dass der lokale Staging-Branch ist auf dem aktuellen Stand ist
3. Erstelle vom Staging-Branch aus einen neuen Branch

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
# Es ist optional und sollte mit Bedacht verwendet werden.
git clean -xfd ./test/
```

4. After creating the branch, apply the changes to the branch. The cherry-pick will likely fail due to conflicts. In that case, you will see something like this:

```shell
# Say the $SHA is 773cdc31ef
$ git cherry-pick $SHA # Use your commit hash
error: could not apply 773cdc3... <commit title>
hint: after resolving the conflicts, mark the corrected paths
hint: with 'git add <paths>' or 'git rm <paths>'
hint: and commit the result with 'git commit'
```

5. Make the required changes to remove the conflicts, add the files to the index using `git add`, and then commit the changes. That can be done with `git cherry-pick --continue`.
6. Leave the commit message as is. If you think it should be modified, comment in the Pull Request. The `Backport-PR-URL` metadata does need to be added to the commit, but this will be done later.
7. Make sure `make -j4 test` passes.
8. Push the changes to your fork
9. Open a pull request:
   1. Be sure to target the `v8.x-staging` branch in the pull request.
   1. Include the backport target in the pull request title in the following format — `[v8.x backport] <commit title>`. Example: `[v8.x backport] process: improve performance of nextTick`
   1. Check the checkbox labeled "Allow edits from maintainers".
   1. In the description add a reference to the original PR.
   1. Amend the commit message and include a `Backport-PR-URL:` metadata and re-push the change to your fork.
   1. Run a [`node-test-pull-request`][] CI job (with `REBASE_ONTO` set to the default `<pr base branch>`)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v8.x-staging`

After the PR lands replace the `backport-requested-v8.x` label on the original PR with `backported-to-v8.x`.
