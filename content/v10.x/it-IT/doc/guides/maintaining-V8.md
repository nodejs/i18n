# Manutenzione di V8 in Node.js

## Background

V8 segue il programma di rilascio di Chromium. Il fronte di supporto per Chromium è diverso rispetto a quello per Node.js. As a result, Node.js needs to support multiple versions of V8 longer than what upstream needs to support. I branch di V8 in Node.js mancano di un processo di manutenzione ufficiale per la mancanza di un branch supportato da LTS.

Questo documento tenta di delineare gli attuali processi di manutenzione, propone un workflow per il mantenimento dei branch di V8 sia in Node.js LTS sia nelle versioni attuali, e discute su come i team di Node.js e V8 possono aiutare su Google.

## Programma di rilascio di V8

V8 e Chromium seguono una [cadenza di rilascio delle nuove versioni di circa 6 settimane](https://www.chromium.org/developers/calendar). In qualsiasi momento ci sono tre branch V8 che sono **active**.

Ad esempio, al momento della stesura di questo documento:

* **Stable**: V8 5.4 è attualmente disponibile come parte di Chromium stable. Questo branch è stato creato circa 6 settimane prima che V8 5.3 sia stato spedito come stable.
* **Beta**: V8 5.5 è attualmente in versione beta. Sarà promosso a stable in seguito; circa 6 settimane dopo che V8 5.4 sia stato spedito come stable.
* **Master**: La V8 tip-of-tree corrisponde a V8 5.6. Questo branch viene regolarmente rilasciato come parte delle **canary** builds di Chromium. Questo branch verrà promosso in versione beta quando V8 5.5 verrà spedito come stable.

Tutti i branch più vecchi vengono abbandonati e non vengono gestiti dal team di V8.

### Panoramica del processo di unione di V8

Il processo per il backporting delle correzioni dei bug ai branch attivi è ufficialmente documentato [sul wiki di V8](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Il riepilogo del processo è:

* V8 supporta solo branch attivi. Non è stato effettuato alcun test sui branch più vecchi dell'attuale stable/beta/master.
* Una correzione che richiede il backport è taggata con il tag *merge-request-x.x*. Questo può essere fatto da chiunque sia interessato ad ottenere la correzione del backport. I problemi con questo tag vengono regolarmente esaminati dal team di V8 come candidati per il backporting.
* Le correzioni richiedono un po di 'tempo di cottura' ('baking time') prima che possano essere approvate per il backport. Ciò significa attendere alcuni giorni per garantire che non vengano rilevati problemi nelle builds canary/beta.
* Una volta pronto, il problema viene contrassegnato con *merge-approved-x.x* ed uno può eseguire l'unione effettiva utilizzando gli script sulla [pagina wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching).
* Le richieste di unione ad un branch abbandonato verranno rifiutate.
* Sono accettate solo le correzioni di bug per il backporting.

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
* Backport identificati dal team di V8. Bug identificati dal upstream V8 che non abbiamo ancora incontrato in Node.js.

### Bug di Upstream non corretti

Se il bug può essere riprodotto sul [branch Node.js `canary`], sul Chromium canary oppure sul V8 tip-of-tree, ed il test case è valido, allora il bug deve essere risolto prima all'upstream.

* Inizia aprendo un bug upstream usando [questo template](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20upstream%20bug).
* Assicurati di includere un collegamento al problema Node.js corrispondente (se ne esiste uno).
* Se la correzione è abbastanza semplice, puoi correggerla tu stesso; le [contributions](https://github.com/v8/v8/wiki/Contributing) sono le benvenute.
* Il "build waterfall" di V8 mette alla prova le tue modifiche.
* Una volta risolto il bug, potrebbe essere necessario il backporting, se esiste in altri branch di V8 che sono ancora attivi o che sono interessati a Node.js. Segui la procedura per il backporting qui sotto.

### Backporting ai Branch Attivi

Se il bug esiste in uno dei branch attivi di V8, potremmo aver bisogno della correzione che ha subito il backport. In qualsiasi momento ci sono [due branch attivi](https://build.chromium.org/p/client.v8.branches/console) (beta e stable) oltre al master. I passaggi seguenti sono necessari per eseguire il backport della correzione:

* Identifica la versione di V8 in cui è stato corretto il bug.
* Identifica se eventuali branch attivi di V8 contengono ancora il bug:
* È necessario un tracking bug per richiedere un backport. 
  * Se non c'è già un bug di V8 che tiene traccia della correzione, apri una nuova richiesta per l'inserimento del bug usando questo [template specifico di Node.js ](https://bugs.chromium.org/p/v8/issues/entry?template=Node.js%20merge%20request).
  * Se un bug esiste già 
    * Aggiungi un riferimento al problema GitHub.
    * Allega le etichette *merge-request-x.x* al bug per eventuali branch attivi che lo contengono ancora. (es. merge-request-5.3, merge-request-5.4)
    * Add ofrobots-at-google.com to the cc list.
* Once the merge has been approved, it should be merged using the [merge script documented in the V8 wiki](https://github.com/v8/v8/wiki/Merging%20&%20Patching). Merging requires commit access to the V8 repository. If you don't have commit access you can indicate someone on the V8 team can do the merge for you.
* It is possible that the merge request may not get approved, for example if it is considered to be a feature or otherwise too risky for V8 stable. In such cases we float the patch on the Node.js side. See the process on 'Backporting to Abandoned branches'.
* Once the fix has been merged upstream, it can be picked up during an update of the V8 branch (see below).

### Backporting to Abandoned Branches

Abandoned V8 branches are supported in the Node.js repository. The fix needs to be cherry-picked in the Node.js repository and V8-CI must test the change.

* For each abandoned V8 branch corresponding to an LTS branch that is affected by the bug: 
  * Checkout a branch off the appropriate *vY.x-staging* branch (e.g. *v6.x-staging* to fix an issue in V8 5.1).
  * Cherry-pick the commit(s) from the V8 repository.
  * On Node.js < 9.0.0: Increase the patch level version in `v8-version.h`. This will not cause any problems with versioning because V8 will not publish other patches for this branch, so Node.js can effectively bump the patch version.
  * On Node.js >= 9.0.0: Increase the `v8_embedder_string` number in `common.gypi`.
  * In some cases the patch may require extra effort to merge in case V8 has changed substantially. For important issues we may be able to lean on the V8 team to get help with reimplementing the patch.
  * Open a cherry-pick PR on `nodejs/node` targeting the *vY.x-staging* branch and notify the `@nodejs/v8` team.
  * Run the Node.js [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) in addition to the [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/). Note: The CI uses the `test-v8` target in the `Makefile`, which uses `tools/make-v8.sh` to reconstruct a git tree in the `deps/v8` directory to run V8 tests.

The [`update-v8`] tool can be used to simplify this task. Run `update-v8 backport --sha=SHA` to cherry-pick a commit.

An example for workflow how to cherry-pick consider the bug [RegExp show inconsistent result with other browsers](https://crbug.com/v8/5199). From the bug we can see that it was merged by V8 into 5.2 and 5.3, and not into V8 5.1 (since it was already abandoned). Since Node.js `v6.x` uses V8 5.1, the fix needed to be cherry-picked. To cherry-pick, here's an example workflow:

* Download and apply the commit linked-to in the issue (in this case a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3
--directory=deps/v8`. If the branches have diverged significantly, this may not apply cleanly. It may help to try to cherry-pick the merge to the oldest branch that was done upstream in V8. In this example, this would be the patch from the merge to 5.2. The hope is that this would be closer to the V8 5.1, and has a better chance of applying cleanly. If you're stuck, feel free to ping @ofrobots for help.
* Modify the commit message to match the format we use for V8 backports and replace yourself as the author. `git commit --amend --reset-author`. You may want to add extra description if necessary to indicate the impact of the fix on Node.js. In this case the original issue was descriptive enough. Example:

```console
deps: cherry-pick a51f429 from V8 upstream

Original commit message:
  [regexp] Fix case-insensitive matching for one-byte subjects.

  The bug occurs because we do not canonicalize character class ranges
  before adding case equivalents. While adding case equivalents, we abort
  early for one-byte subject strings, assuming that the ranges are sorted.
  Which they are not.

  R=marja@chromium.org
  BUG=v8:5199

  Review-Url: https://codereview.chromium.org/2159683002
  Cr-Commit-Position: refs/heads/master@{#37833}

Refs: https://github.com/v8/v8/commit/a51f429772d1e796744244128c9feeab4c26a854
PR-URL: https://github.com/nodejs/node/pull/7833
```

* Open a PR against the `v6.x-staging` branch in the Node.js repo. Launch the normal and [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) using the Node.js CI system. We only needed to backport to `v6.x` as the other LTS branches weren't affected by this bug.

### Backports Identified by the V8 team

For bugs found through the browser or other channels, the V8 team marks bugs that might be applicable to the abandoned branches in use by Node.js. This is done through manual tagging by the V8 team and through an automated process that tags any fix that gets backported to the stable branch (as it is likely candidate for backporting further).

Such fixes are tagged with the following labels in the V8 issue tracker:

* `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): to be reviewed if this is applicable to abandoned branches in use by Node.js. This list if regularly reviewed by the Node.js team at Google to determine applicability to Node.js.
* `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): marks bugs that are deemed relevant to Node.js and should be backported.
* `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): Backport for Node.js has been performed already.
* `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): Backport for Node.js is not desired.

The backlog of issues with such is regularly reviewed by the node-team at Google to shepherd through the backport process. External contributors are welcome to collaborate on the backport process as well. Note that some of the bugs may be security issues and will not be visible to external collaborators.

## Updating V8

Node.js keeps a vendored copy of V8 inside of the deps/ directory. In addition, Node.js may need to float patches that do not exist upstream. This means that some care may need to be taken to update the vendored copy of V8.

### Minor updates (patch level)

Because there may be floating patches on the version of V8 in Node.js, it is safest to apply the patch level updates as a patch. For example, imagine that upstream V8 is at 5.0.71.47 and Node.js is at 5.0.71.32. It would be best to compute the diff between these tags on the V8 repository, and then apply that patch on the copy of V8 in Node.js. This should preserve the patches/backports that Node.js may be floating (or else cause a merge conflict).

The rough outline of the process is:

```shell
# Assuming your fork of Node.js is checked out in $NODE_DIR
# and you want to update the Node.js master branch.
# Find the current (OLD) version in
# $NODE_DIR/deps/v8/include/v8-version.h
cd $NODE_DIR
git checkout master
git merge --ff-only origin/master
git checkout -b V8_NEW_VERSION
curl -L https://github.com/v8/v8/compare/${V8_OLD_VERSION}...${V8_NEW_VERSION}.patch | git apply --directory=deps/v8
# You may want to amend the commit message to describe the nature of the update
```

V8 also keeps tags of the form *5.4-lkgr* which point to the *Last Known Good Revision* from the 5.4 branch that can be useful in the update process above.

The [`update-v8`](https://github.com/targos/update-v8) tool can be used to simplify this task. Run `update-v8 minor` to apply a minor update.

### Major Updates

We upgrade the version of V8 in Node.js master whenever a V8 release goes stable upstream, that is, whenever a new release of Chrome comes out.

Upgrading major versions would be much harder to do with the patch mechanism above. A better strategy is to

1. Audit the current master branch and look at the patches that have been floated since the last major V8 update.
2. Replace the copy of V8 in Node.js with a fresh checkout of the latest stable V8 branch. Special care must be taken to recursively update the DEPS that V8 has a compile time dependency on (at the moment of this writing, these are only trace_event and gtest_prod.h)
3. Reset the `v8_embedder_string` variable to "-node.0" in `common.gypi`.
4. Refloat (cherry-pick) all the patches from list computed in 1) as necessary. Some of the patches may no longer be necessary.

To audit for floating patches:

```shell
git log --oneline deps/v8
```

To replace the copy of V8 in Node.js, use the [`update-v8`] tool. For example, if you want to replace the copy of V8 in Node.js with the branch-head for V8 5.1 branch:

```shell
cd $NODE_DIR
update-v8 major --branch=5.1-lkgr
```

This should be followed up with manual refloating of all relevant patches.

## Proposal: Using a fork repo to track upstream V8

The fact that Node.js keeps a vendored, potentially edited copy of V8 in deps/ makes the above processes a bit complicated. An alternative proposal would be to create a fork of V8 at `nodejs/v8` that would be used to maintain the V8 branches. This has several benefits:

* The process to update the version of V8 in Node.js could be automated to track the tips of various V8 branches in `nodejs/v8`.
* It would simplify cherry-picking and porting of fixes between branches as the version bumps in `v8-version.h` would happen as part of this update instead of on every change.
* It would simplify the V8-CI and make it more automatable.
* The history of the V8 branch in `nodejs/v8` becomes purer and it would make it easier to pull in the V8 team for help with reviewing.
* It would make it simpler to setup an automated build that tracks Node.js master + V8 lkgr integration build.

This would require some tooling to:

* A script that would update the V8 in a specific Node.js branch with V8 from upstream (dependent on branch abandoned vs. active).
* We need a script to bump V8 version numbers when a new version of V8 is promoted from `nodejs/v8` to `nodejs/node`.
* Enabled the V8-CI build in Jenkins to build from the `nodejs/v8` fork.

<!-- Footnotes themselves at the bottom. -->

### Notes

<sup>1</sup>Node.js 0.12 and older are intentionally omitted from this document as their support has ended.