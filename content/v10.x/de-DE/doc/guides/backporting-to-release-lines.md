# How to: Zurückportieren eines Pull Requests zu einem Versionszweig

## Staging Branches

Jeder Versionszweig hat einen Staging-Branch, der dem Releaser als Zwischenspeicher während der Präparierung einer neuen Version dient. Der Branchname ist wie folgt aufgebaut: `vN.x-staging` wobei `N` die Hauptversionsnummer ist.

*Hinweis*: Weitere Infos zu aktiven Staging-Branches sind im [Release-Plan](https://github.com/nodejs/Release#release-schedule1) zu finden.

## Was wird zurückportiert?

Wenn ein Cherry-Pick aus dem master nicht fehlerfrei in einen Staging-Branch übernommen werden konnte, wird der Releaser den Pull-Request mit einem speziellen Label für diesen Versionszweig kennzeichnen (z.B. `backport-requested-vN.x`). Das bedeutet für unser Tooling, dass dieser Pull-Request nicht enthalten sein soll. Der Releaser wird dann in einem Kommentar einen Pull-Request für die Zurückportierung anfordern.

## Was kann zurückportiert werden?

Der aktuelle Versionszweig ist weniger strikt als die LTS-Versionszweige in Bezug auf, welche Pull-Requests übernommen werden können. Unsere LTS-Versionszweige (siehe im [Release-Plan](https://github.com/nodejs/Release#release-plan)) erfordern, dass Commits mindestens zwei Wochen im aktuellen Versionszweig heranreifen bevor sie in einen LTS-Staging-Branch übernommen werden können. Nur nach dieser "Reifephase" werden diese Commits zurückportiert oder gecherry-picked.

## Wie reicht man einen Pull-Request für eine Zurückportierung ein?

Für die nächsten Schritte nehmen wir an, dass eine Zurückportierung für den v6.x Versionszweig gemacht wird. Alle Befehle verwenden den `v6.x-staging` Branch als Ziel-Branch. Um einen Pull-Request für einen anderen Branch einzureichen, ersetze diesen einfach mit dem Namen des Staging-Branches des entsprechenden Versionszweiges.

1. Checke den Staging-Branch für den Ziel-Versionszweig aus
2. Stelle sicher, dass der lokale Staging-Branch ist auf dem aktuellen Stand ist
3. Erstelle vom Staging-Branch aus einen neuen Branch

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