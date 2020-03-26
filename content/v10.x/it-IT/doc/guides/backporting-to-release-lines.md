# Come eseguire il Backport di una Pull Request su una Release Line

## I branch di staging

Ogni release line ha un branch di staging che il releaser userà come scratch pad durante la preparazione di una release. Il nome del branch è formattato come segue: `vN.x-staging` in cui `N` è il numero della release principale.

For the active staging branches see the [Release Schedule](https://github.com/nodejs/Release#release-schedule1).

## Su cosa deve essere eseguito il backport?

Se una cherry-pick del master non viene confermata chiaramente su un branch di staging, il releaser contrassegnerà la pull request con un'etichetta particolare per quella release line (ad esempio `backport-requested-vN.x`), specificando ai nostri strumenti che questa pull request non dovrebbe essere inclusa. Il releaser aggiungerà poi un commento che richiede che venga eseguita una pull request del backport.

## Su cosa può essere eseguito il backport?

La "Current" release line è molto più indulgente della LTS release line riguardo a ciò che può essere accettato. Le nostre LTS release line (vedi il [Piano di Release](https://github.com/nodejs/Release#release-plan)) richiedono che i commit maturino nella Current release per almeno 2 settimane prima che possano essere accettati in un LTS staging branch. Solo in seguito a "maturazione" quei commit verranno sottoposti a cherry-pick e backport.

## Come inviare una pull request di un backport

For the following steps, let's assume that a backport is needed for the v8.x release line. All commands will use the `v8.x-staging` branch as the target branch. Per inviare una pull request di un backport ad un altro branch, sostituire semplicemente quella con il branch di staging per la release line scelta.

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

4. Dopo la creazione del branch, applicare le modifiche al branch. Il cherry-pick probabilmente fallirà a causa di conflitti. In quel caso, vedrai qualcosa simile a questo:

```shell
# Dì che $SHA è 773cdc31ef
$ git cherry-pick $SHA # Utilizza il tuo commit hash
error: could not apply 773cdc3... <commit title>
suggerimento: dopo aver risolto i conflitti, segna i percorsi corretti
suggerimento: con 'git add <paths>' o 'git rm <paths>'
suggerimento: ed esegui il commit del risultato con 'git commit'
```

5. Creare le modifiche necessarie per rimuovere i conflitti, aggiungere i file all'indice utilizzando `git add` e poi eseguire il commit delle modifiche. Ciò può essere fatto con `git cherry-pick --continue`.
6. Lasciare il messaggio di commit come è. Se pensi che debba essere modificato, commenta nella Pull Request. The `Backport-PR-URL` metadata does need to be added to the commit, but this will be done later.
7. Assicurarsi che `make -j4 test` passi.
8. Eseguire il push delle modifiche del tuo fork
9. Aprire una pull request:
   1. Be sure to target the `v8.x-staging` branch in the pull request.
   1. Include the backport target in the pull request title in the following format — `[v8.x backport] <commit title>`. Example: `[v8.x backport] process: improve performance of nextTick`
   1. Spunta la casella di controllo contrassegnata con "Consenti modifiche da parte dei manutentori".
   1. In the description add a reference to the original PR.
   1. Amend the commit message and include a `Backport-PR-URL:` metadata and re-push the change to your fork.
   1. Esegui un lavoro [`node-test-pull-request`][] di CI (con `REBASE_ONTO` impostato sul `<pr base branch>` predefinito)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v8.x-staging`

After the PR lands replace the `backport-requested-v8.x` label on the original PR with `backported-to-v8.x`.
