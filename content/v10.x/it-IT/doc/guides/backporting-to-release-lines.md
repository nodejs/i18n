# Come eseguire il Backport di una Pull Request su una Release Line

## I branch di staging

Each release line has a staging branch that the releaser will use as a scratch pad while preparing a release. The branch name is formatted as follows: `vN.x-staging` where `N` is the major release number.

For the active staging branches see the [Release Schedule](https://github.com/nodejs/Release#release-schedule1).

## Su cosa deve essere eseguito il backport?

If a cherry-pick from master does not land cleanly on a staging branch, the releaser will mark the pull request with a particular label for that release line (e.g. `backport-requested-vN.x`), specifying to our tooling that this pull request should not be included. The releaser will then add a comment requesting that a backport pull request be made.

## Su cosa può essere eseguito il backport?

The "Current" release line is much more lenient than the LTS release lines in what can be landed. Our LTS release lines (see the [Release Plan](https://github.com/nodejs/Release#release-plan)) require that commits mature in the Current release for at least 2 weeks before they can be landed in an LTS staging branch. Only after "maturation" will those commits be cherry-picked or backported.

## Come inviare una pull request di un backport

For the following steps, let's assume that a backport is needed for the v8.x release line. All commands will use the `v8.x-staging` branch as the target branch. In order to submit a backport pull request to another branch, simply replace that with the staging branch for the targeted release line.

1. Fare il checkout del branch di staging per la release line scelta
2. Assicurarsi che il branch di staging locale sia aggiornato con il remoto
3. Creare un nuovo branch fuori dal branch di staging

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
# È facoltativo e deve essere utilizzato con cautela.
git clean -xfd ./test/
```

4. Dopo la creazione del branch, applicare le modifiche al branch. The cherry-pick will likely fail due to conflicts. In that case, you will see something like this:

```shell
# Dì che $SHA è 773cdc31ef
$ git cherry-pick $SHA # Utilizza il tuo commit hash
error: could not apply 773cdc3... <commit title>
suggerimento: dopo aver risolto i conflitti, segna i percorsi corretti
suggerimento: con 'git add <paths>' o 'git rm <paths>'
suggerimento: ed esegui il commit del risultato con 'git commit'
```

5. Make the required changes to remove the conflicts, add the files to the index using `git add`, and then commit the changes. That can be done with `git cherry-pick --continue`.
6. Lasciare il messaggio di commit come è. If you think it should be modified, comment in the Pull Request. The `Backport-PR-URL` metadata does need to be added to the commit, but this will be done later.
7. Assicurarsi che `make -j4 test` passi.
8. Eseguire il push delle modifiche del tuo fork
9. Aprire una pull request: 
    1. Be sure to target the `v8.x-staging` branch in the pull request.
    2. Include the backport target in the pull request title in the following format — `[v8.x backport] <commit title>`. Example: `[v8.x backport] process: improve performance of nextTick`
    3. Spunta la casella di controllo contrassegnata con "Consenti modifiche da parte dei manutentori".
    4. In the description add a reference to the original PR.
    5. Amend the commit message and include a `Backport-PR-URL:` metadata and re-push the change to your fork.
    6. Run a [`node-test-pull-request`][] CI job (with `REBASE_ONTO` set to the default `<pr base branch>`)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v8.x-staging`

After the PR lands replace the `backport-requested-v8.x` label on the original PR with `backported-to-v8.x`.