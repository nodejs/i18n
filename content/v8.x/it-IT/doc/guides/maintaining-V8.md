# Manutenzione di V8 in Node.js

## Background

V8 segue il programma di rilascio di Chromium. Il fronte di supporto per Chromium è diverso rispetto a quello per Node.js. Di conseguenza, Node.js deve supportare molteplici versioni di V8 in più rispetto a quanto deve supportare l'upstream. I branch di V8 in Node.js mancano di un processo di manutenzione ufficiale per la mancanza di un branch supportato da LTS.

Questo documento tenta di delineare gli attuali processi di manutenzione, propone un workflow per il mantenimento dei branch di V8 sia in Node.js LTS sia nelle versioni attuali, e discute su come i team di Node.js e V8 possono aiutare su Google.

## Programma di rilascio di V8

V8 and Chromium follow a [roughly 6-week release cadence](https://www.chromium.org/developers/calendar). At any given time there are three V8 branches that are **active**.

Ad esempio, al momento della stesura di questo documento:

* **Stable**: V8 5.4 è attualmente disponibile come parte di Chromium stable. This branch was created approx. 6 weeks before from when V8 5.3 shipped as stable.
* **Beta**: V8 5.5 è attualmente in versione beta. It will be promoted to stable next; approximately 6 weeks after V8 5.4 shipped as stable.
* **Master**: V8 tip-of-tree corresponds to V8 5.6. This branch gets regularly released as part of the Chromium **canary** builds. This branch will be promoted to beta next when V8 5.5 ships as stable.

Tutti i branch più vecchi vengono abbandonati e non vengono gestiti dal team di V8.

### Panoramica del processo di unione di V8

The process for backporting bug fixes to active branches is officially documented [on the V8 wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Il riepilogo del processo è:

*   V8 supporta solo branch attivi. There is no testing done on any branches older than the current stable/beta/master.
*   Una correzione che richiede il backport è taggata con il tag *merge-request-x.x*. This can be done by anyone interested in getting the fix backported. Issues with this tag are reviewed by the V8 team regularly as candidates for backporting.
*   Le correzioni richiedono un po di 'tempo di cottura' ('baking time') prima che possano essere approvate per il backport. This means waiting a few days to ensure that no issues are detected on the canary/beta builds.
*   Once ready, the issue is tagged w/ *merge-approved-x.x* and one can do the actual merge by using the scripts on the [wiki page](https://github.com/v8/v8/wiki/Merging%20&%20Patching).
*   Le richieste di unione ad un branch abbandonato verranno rifiutate.
*   Sono accettate solo le correzioni di bug per il backporting.

## Requisiti di Supporto di Node.js

In qualsiasi momento, Node.js deve mantenere alcuni diversi branch di V8 per le varie versioni Attuale, LTS e nightly. Attualmente questo elenco include i seguenti branch<sup>1</sup>:

<table>
  <tr>
   <td><strong>Rilascio</strong>
   </td>
   <td><strong>Inizio Supporto</strong>
   </td>
   <td><strong>Fine Supporto</strong>
   </td>
   <td><strong>Versione V8</strong>
   </td>
   <td><strong>Branch V8 rilasciato</strong>
   </td>
   <td><strong>Branch V8 abbandonato</strong>
   </td>
  </tr>
  <tr>
   <td>Node.js 4.x
   </td>
   <td>01-10-2015
   </td>
   <td>Aprile 2018
   </td>
   <td>4.5
   </td>
   <td>01-09-2015
   </td>
   <td>13-10-2015
   </td>
  </tr>
  <tr>
   <td>Node.js 6.x
   </td>
   <td>01-04-2016
   </td>
   <td>Aprile 2019
   </td>
   <td>5.1
   </td>
   <td>31-05-2016
   </td>
   <td>26-06-2016
   </td>
  </tr>
  <tr>
   <td>Node.js 8.x
   </td>
   <td>30-05-2017
   </td>
   <td>Dicembre 2019
   </td>
   <td>6.1 (a breve 6.2)
   </td>
   <td>17-10-2017 (6.2)
   </td>
   <td>~05-12-2017 (6.2)
   </td>
  </tr>
    <tr>
   <td>Node.js 9.x
   </td>
   <td>31-10-2017
   </td>
   <td>Aprile 2018
   </td>
   <td>6.2
   </td>
   <td>17-10-2017
   </td>
   <td>~05-12-2017
   </td>
  </tr>
  <tr>
   <td>master
   </td>
   <td>N/A
   </td>
   <td>N/A
   </td>
   <td>6.2
   </td>
   <td>17-10-2017
   </td>
   <td>~05-12-2017
   </td>
  </tr>
</table>

Le versioni di V8 utilizzate in Node.js v4.x, v6.x e 8.x sono già state abbandonate dall'upstream V8. Tuttavia, Node.js deve continuare a supportare questi branch per molti mesi (branch attuali) o diversi anni (branch LTS).

## Processo di Manutenzione

Una volta è stato identificato un bug in Node.js causato da V8, il primo passo è identificare le versioni di Node.js e V8 colpite. Il bug può essere presente in diverse posizioni, ognuna delle quali segue un processo leggermente diverso.

* Bug non corretti. Il bug esiste nel master branch di V8.
* Corretto, ma ha bisogno di un backport. Il bug potrebbe richiedere il porting su uno o più branch.
    * Backporting ai branch attivi.
    * Backporting ai branch abbandonati.
* Backport identificati dal team di V8. Bugs identified by upstream V8 that we haven't encountered in Node.js yet.

### Bug di Upstream non corretti

If the bug can be reproduced on the [`vee-eight-lkgr` branch](https://github.com/v8/node/tree/vee-eight-lkgr), Chromium canary, or V8 tip-of-tree, and the test case is valid, then the bug needs to be fixed upstream first.

* Start by opening a bug upstream [using this template](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20upstream%20bug).
* Make sure to include a link to the corresponding Node.js issue (if one exists).
* If the fix is simple enough, you may fix it yourself; [contributions](https://github.com/v8/v8/wiki/Contributing) are welcome.
* Il "build waterfall" di V8 mette alla prova le tue modifiche.
* Once the bug is fixed it may still need backporting, if it exists in other V8 branches that are still active or are branches that Node.js cares about. Segui la procedura per il backporting qui sotto.

### Backporting ai Branch Attivi

If the bug exists in any of the active V8 branches, we may need to get the fix backported. At any given time there are [two active branches](https://build.chromium.org/p/client.v8.branches/console) (beta and stable) in addition to master. The following steps are needed to backport the fix:

* Identifica la versione di V8 in cui è stato corretto il bug.
* Identifica se eventuali branch attivi di V8 contengono ancora il bug:
* È necessario un tracking bug per richiedere un backport.
    * If there isn't already a V8 bug tracking the fix, open a new merge request bug using this [Node.js specific template](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20merge%20request).
    * Se un bug esiste già
        * Aggiungi un riferimento al problema GitHub.
        * Attach *merge-request-x.x* labels to the bug for any active branches that still contain the bug. (e.g. merge-request-5.3, merge-request-5.4)
        * Aggiungi ofrobots-at-google.com alla cc list.
* Once the merge has been approved, it should be merged using the [merge script documented in the V8 wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Merging requires commit access to the V8 repository. If you don't have commit access you can indicate someone on the V8 team can do the merge for you.
* It is possible that the merge request may not get approved, for example if it is considered to be a feature or otherwise too risky for V8 stable. In such cases we float the patch on the Node.js side. See the process on 'Backporting to Abandoned branches'.
* Once the fix has been merged upstream, it can be picked up during an update of the V8 branch, (see below).

### Backporting ai Branch Abbandonati

Abandoned V8 branches are supported in the Node.js V8 repository. La correzione deve essere selezionata in modo accurato nel repository di Node.js e V8-CI deve testare la modifica.

* For each abandoned V8 branch corresponding to an LTS branch that is affected by the bug:
    * Open a cherry-pick PR on nodejs/node targeting the appropriate *vY.x-staging* branch (e.g. *v6.x-staging* to fix an issue in V8-5.1).
    * Increase the patch level version in `v8-version.h`. This will not cause any problems with versioning because V8 will not publish other patches for this branch, so Node.js can effectively bump the patch version.
    * In some cases the patch may require extra effort to merge in case V8 has changed substantially. For important issues we may be able to lean on the V8 team to get help with reimplementing the patch.
    * Run the Node.js [V8-CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) in addition to the [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/).

Un esempio per il workflow su come eseguire la selezione accurata considera che il bug [RegExp mostra risultati incoerenti con altri browser](https://crbug.com/v8/5199). Dal bug possiamo vedere che è stato unito da V8 all'interno di 5.2 e 5.3, e non all'interno di V8 5.1 (poiché era già stato abbandonato). Poiché Node.js `v6.x` utilizza V8 5.1, la correzione doveva essere selezionata accuratamente. Per eseguire la sezione accurata, ecco qui un esempio di workflow:

* Scarica ed applica il commit collegato al problema (in questo caso a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3 --directory=deps/v8`. If the branches have diverged significantly, this may not apply cleanly. It may help to try to cherry-pick the merge to the oldest branch that was done upstream in V8. In this example, this would be the patch from the merge to 5.2. The hope is that this would be closer to the V8 5.1, and has a better chance of applying cleanly. If you're stuck, feel free to ping @ofrobots for help.
* Modify the commit message to match the format we use for V8 backports and replace yourself as the author. `git commit --amend --reset-author`. You may want to add extra description if necessary to indicate the impact of the fix on Node.js. In questo caso il problema originale era abbastanza descrittivo. Esempio:
```console
deps: scelta accurata di a51f429 da V8 upstream

Commit message originale:
  [regexp] Correzione della corrispondenza senza distinzione tra maiuscole e minuscole per i soggetti ad un byte.

  Il bug si verifica perché non si rendono canonici gli intervalli delle character class
  prima di aggiungere equivalenti. Aggiungendo i casi equivalenti, abortiamo
  presto per le stringhe del soggetto ad un byte, supponendo che gli intervalli siano ordinati.
  I quali però non lo sono.

  R=marja@chromium.org
  BUG=v8:5199

  Review-Url: https://codereview.chromium.org/2159683002
  Cr-Commit-Position: refs/heads/master@{#37833}

Refs: https://github.com/v8/v8/commit/a51f429772d1e796744244128c9feeab4c26a854
PR-URL: https://github.com/nodejs/node/pull/7833
```
* Apri una PR contro il branch `v6.x-staging` nel repository di Node.js. Launch the normal and [V8-CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) using the Node.js CI system. We only needed to backport to `v6.x` as the other LTS branches weren't affected by this bug.

### Backport identificati dal team di V8

Per i bug rilevati tramite il browser od altri canali, il team di V8 contrassegna quelli che potrebbero essere applicabili ai branch abbandonati in uso da Node.js. Ciò avviene tramite il tagging manuale da parte del team di V8 e attraverso un processo automatizzato che tagga qualsiasi correzione che viene trasferita allo stable branch (poiché è probabile che sia scelto per un ulteriore backporting).

Tali correzioni sono taggate con le seguenti etichette nell'issue tracker di V8:

*   `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): to be reviewed if this is applicable to abandoned branches in use by Node.js. This list if regularly reviewed by the Node.js team at Google to determine applicability to Node.js.
*   `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): marks bugs that are deemed relevant to Node.js and should be backported.
*   `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): Backport for Node.js has been performed already.
*   `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): Backport for Node.js is not desired.

Il backlog di tali problemi viene regolarmente rivisto dal node-team di Google per seguire il processo di backport. I contributors esterni sono invitati a collaborare anche sul processo di backport. Nota che alcuni dei bug potrebbero essere problemi di sicurezza e non saranno visibili ai contributors esterni.

## Aggiornamento di V8

Node.js keeps a vendored copy of V8 inside of deps/ directory. In addition Node.js may need to float patches that do not exist upstream. Ciò significa che potrebbe essere necessario prestare attenzione per aggiornare la copia di vendita di V8.

### Aggiornamenti minori (patch level)

Poiché potrebbero esserci patch mobili sulla versione di V8 in Node.js, è più sicuro applicare gli aggiornamenti di patch level come una patch. Ad esempio, immagina che upstream V8 è a 5.0.71.47 e Node.js è a 5.0.71.32. Sarebbe meglio calcolare la differenza tra questi tag sul repository di V8, e successivamente applicare quella patch sulla copia di V8 in Node.js. Questo dovrebbe preservare le/i patch/backport che Node.js potrebbe rendere mobili (oppure causare un conflitto di unione).

Il profilo approssimativo del processo è:

```shell
# Supponendo che il tuo fork di Node.js sia controllato in $NODE_DIR 
# e tu voglia aggiornare il master branch di Node.js.
# Trova l'attuale (VECCHIA) versione in
# $NODE_DIR/deps/v8/include/v8-version.h
cd $NODE_DIR
git checkout master
git merge --ff-only origin/master
git checkout -b V8_NEW_VERSION
curl -L https://github.com/v8/v8/compare/${V8_OLD_VERSION}...${V8_NEW_VERSION}.patch | git apply --directory=deps/v8
# Si consiglia di modificare il commit message per descrivere la natura dell'aggiornamento
```

V8 also keeps tags of the form *5.4-lkgr* which point to the *Last Known Good Revision* from the 5.4 branch that can be useful in the update process above.


### Aggiornamenti Importanti

Aggiorniamo la versione di V8 nel master di Node.js ogni volta che una nuova versione rilasciata di V8 diventa stable upstream, ovvero ogni volta che viene rilasciata una nuova versione di Chrome.

L'aggiornamento delle versioni principali sarebbe molto più difficile da fare con il meccanismo delle patch descritto sopra. Una strategia migliore è quella di

1. Controllare il master branch attuale e guardare le patch che sono state rese mobili dall'ultimo aggiornamento importante di V8.
1. Sostituire la copia di V8 in Node.js con un nuovo controllo dell'ultimo stable branch di V8. È necessario prestare particolare attenzione per aggiornare in modo ricorsivo le DEPS (dipendenze) sulle quali V8 ha una dipendenza compile time (al momento della stesura di questo documento, sono  solo trace_event e gtest_prod.h)
1. Rendere mobili (selezione accurata) tutte le patch dalla lista calcolata in 1) se necessario. Alcune patch potrebbero non essere più necessarie.

Per controllare le patch mobili:

```shell
git log --oneline deps/v8
```

To replace the copy of V8 in Node.js, use the `[update-v8](https://gist.github.com/targos/8da405e96e98fdff01a395bed365b816)` script<sup>2</sup>. For example, if you want to replace the copy of V8 in Node.js with the branch-head for V8 5.1 branch:

```shell
cd $NODE_DIR
rm -rf deps/v8
path/to/update-v8 branch-heads/5.1
```

You may want to look at the commits created by the above scripts, and squash them once you have reviewed them.

Questo dovrebbe essere seguito con il refloating manuale di tutte le patch rilevanti.

## Proposta: Utilizzo di un fork repo per tracciare upstream V8

Il fatto che Node.js mantenga una copia di vendita di V8 potenzialmente modificata in deps/ rende i processi sopracitati un pò complicati. Una proposta alternativa sarebbe quella di creare un fork di V8 su `nodejs/v8` che verrebbe utilizzato per mantenere i branch di V8. Questo ha diversi vantaggi:

* Il processo per aggiornare la versione di V8 in Node.js potrebbe essere automatizzato per tracciare i suggerimenti dei vari branch di V8 in `nodejs/v8`.
* It would simplify cherry-picking and porting of fixes between branches as the version bumps in `v8-version.h` would happen as part of this update instead of on every change.
* Semplificherebbe V8-CI e lo renderebbe più automatico.
* La cronologia del branch di V8 in `nodejs/v8` diventerebbe più pura e renderebbe più semplice il coinvolgimento del team di V8 nella revisione.
* It would make it simpler to setup an automated build that tracks Node.js master + V8 lkgr integration build.

Fare questo richiede alcuni strumenti:

* A script that would update the V8 in a specific Node.js branch with V8 from upstream (dependent on branch abandoned vs. il branch attivo).
* Uno script per eseguire il bump dei numeri delle versioni V8 quando una nuova versione di V8 viene promossa da `nodejs/v8` a `nodejs/node`.
* Build di V8-CI abilitato in Jenkins per costruire dal fork di `nodejs/v8`.

## Proposal: Dealing with the need to float patches to a stable/beta

Sometimes upstream V8 may not want to merge a fix to their stable branches, but we might. An example of this would be a fix for a performance regression that only affects Node.js and not the browser. At the moment we don't have a mechanism to deal with this situation. If we float a patch and bump the V8 version, we might run into a problem if upstream releases a fix with the same version number.

One idea we have been kicking around is that we could move to a 5-place version number in V8, e.g.: 5.4.500.30.${embedder}. The ${embedder} represents the number of patches an embedder is floating on top of an official V8 version. This would also help with auditing the floating patches in the Node.js commit history.

We are trying this out in https://github.com/nodejs/node/pull/9754. If this ends up working, we will investigate making this change upstream.

<!-- Footnotes themselves at the bottom. -->
### Note

<sup>1</sup>Node.js 0.12 and older are intentionally omitted from this document as their support is ending soon.

<sup>2</sup>@targos is working on [a port of this script](https://github.com/targos/update-v8).
