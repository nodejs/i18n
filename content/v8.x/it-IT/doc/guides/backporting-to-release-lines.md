# Come eseguire il Backport di una Pull Request su una Release Line

## I branch di staging

Ogni release line ha un branch di staging che il releaser userà come scratch pad durante la preparazione di una release. Il nome del branch è formattato come segue: `vN.x-staging` in cui `N` è il numero della release principale.

*Nota*: Per i branch di staging attivi vedi la [Pianificazione delle Release](https://github.com/nodejs/Release#release-schedule1).

## Su cosa deve essere eseguito il backport?

Se una cherry-pick del master non viene confermata chiaramente su un branch di staging, il releaser contrassegnerà la pull request con un'etichetta particolare per quella release line (ad esempio `backport-requested-vN.x`), specificando ai nostri strumenti che questa pull request non dovrebbe essere inclusa. Il releaser aggiungerà poi un commento che richiede che venga eseguita una pull request del backport.

## Su cosa può essere eseguito il backport?

La "Current" release line è molto più indulgente della LTS release line riguardo a ciò che può essere accettato. Le nostre LTS release line (vedi il [Piano di Release](https://github.com/nodejs/Release#release-plan)) richiedono che i commit maturino nella Current release per almeno 2 settimane prima che possano essere accettati in un LTS staging branch. Solo in seguito a "maturazione" quei commit verranno sottoposti a cherry-pick e backport.

## Come inviare una pull request di un backport

Per i seguenti step, supponiamo che sia necessario un backport per la v6.x release line. Tutti i comandi utilizzeranno il `v6.x-staging` branch come target branch. Per inviare una pull request di un backport ad un altro branch, sostituire semplicemente quella con il branch di staging per la release line scelta.

1. Fare il checkout del branch di staging per la release line scelta
2. Assicurarsi che il branch di staging locale sia aggiornato con il remoto
3. Creare un nuovo branch fuori dal branch di staging

```shell
# Supponendo che il tuo fork di Node.js sia sottoposto al check out in $NODE_DIR,
# il remoto di origine punta al tuo fork e il remoto dell'upstream punta
# a git://github.com/nodejs/node
cd $NODE_DIR
# Se v6.x-staging viene sottoposto al check out, dovrebbe essere usato `pull` al posto di `fetch`
git fetch upstream v6.x-staging:v6.x-staging -f
# Supponiamo di voler eseguire il backport su PR #10157
git checkout -b backport-10157-to-v6.x v6.x-staging
# Assicurarsi che non ci siano artefatti dei test da build precedenti 
# Nota che questo comando elimina tutti i file e le directory
# che non sono soggetti al controllo di revisione sotto alla ./test directory.
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
6. Lasciare il messaggio di commit come è. Se pensi che debba essere modificato, commenta nella Pull Request.
7. Assicurarsi che `make -j4 test` passi.
8. Eseguire il push delle modifiche del tuo fork
9. Aprire una pull request:
   1. Assicurarsi di selezionare il `v6.x-staging` branch nella pull request.
   2. Includere l'obiettivo del backport nel titolo della pull request nel seguente formato — `[v6.x backport] <commit title>`. Esempio: `[v6.x backport] process: improve performance of nextTick`
   3. Spunta la casella di controllo contrassegnata con "Consenti modifiche da parte dei manutentori".
   4. Nella descrizione aggiungi un riferimento alla PR originale
   5. Esegui un lavoro [`node-test-pull-request`][] di CI (con `REBASE_ONTO` impostato sul `<pr base branch>` predefinito)
10. If during the review process conflicts arise, use the following to rebase: `git pull --rebase upstream v6.x-staging`

Dopo che la PR viene confermata, sostituire l'etichetta `backport-requested-v6.x` sulla PR originale con `backported-to-v6.x`.
