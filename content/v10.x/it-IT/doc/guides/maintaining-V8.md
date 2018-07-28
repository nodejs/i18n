# Manutenzione di V8 in Node.js

## Background

V8 segue il programma di rilascio di Chromium. Il fronte di supporto per Chromium è diverso rispetto a quello per Node.js. Di conseguenza, Node.js deve supportare molteplici versioni di V8 in più rispetto a quanto deve supportare l'upstream. I branch di V8 in Node.js mancano di un processo di manutenzione ufficiale per la mancanza di un branch supportato da LTS.

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
    * Aggiungi ofrobots-at-google.com alla cc list.
* Una volta che l'unione è stata approvata, deve essere inserita usando lo [script di unione documentato nel wiki di V8](https://github.com/v8/v8/wiki/Merging%20&%20Patching). L'unione richiede l'accesso di commit al repository di V8. Se non hai accesso al commit, puoi indicare qualcuno del team di V8 che possa fare l'unione per te.
* È possibile che la richiesta di unione non venga approvata, ad esempio se è considerata come una funzionalità o qualsiasi cosa troppo rischiosa per V8 stable. In questi casi, la patch viene spostata su Node.js. Vedi il processo su 'Backporting ai Branch Abbandonati'.
* Una volta che la correzione è stata unita in modo upstream, può essere rilevata durante un aggiornamento del branch di V8 (vedi sotto).

### Backporting ai Branch Abbandonati

I branch abbandonati di V8 sono supportati nel repository di Node.js. La correzione deve essere selezionata in modo accurato nel repository di Node.js e V8-CI deve testare la modifica.

* Per ogni branch abbandonato di V8 corrispondente ad un branch LTS colpito dal bug: 
  * Esegui il checkout di un branch fuori dall'appropriato branch *vY.x-staging* (es. *v6.x-staging* per correggere un problema in V8 5.1).
  * Seleziona accuratamente il(i) commit(s) dal repository di V8.
  * Su Node.js < 9.0.0: Aumenta la versione a livello di patch in `v8-version.h`. Questo non causerà alcun problema con il controllo delle versioni perché V8 non pubblicherà altre patch per questo branch, quindi Node.js può effettivamente eseguire il bump della versione della patch.
  * Su Node.js >= 9.0.0: Aumenta il numero di `v8_embedder_string` in `common.gypi`.
  * In alcuni casi, la patch potrebbe richiedere uno sforzo supplementare per l'unione nel caso in cui V8 sia stato cambiato sostanzialmente. Per questioni importanti potremmo essere in grado di appoggiare il team di V8 in modo da ottenere aiuto con la re-implementazione della patch.
  * Apri una PR scelta accuratamente su `nodejs/node` che si rivolge al branch *vY.x-staging* e notifica il team di `@nodejs/v8`.
  * Esegui il [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) di Node.js oltre al [Node.js CI](https://ci.nodejs.org/job/node-test-pull-request/). Nota: Il CI utilizza la destinazione di `test-v8` nel <`Makefile`, che utilizza `tools/make-v8.sh` per ricostruire un git tree nella directory `deps/v8` per eseguire i test di V8.

Lo strumento [`update-v8`] può essere utilizzato per semplificare quest'attività. Esegui `update-v8 backport --sha=SHA` per selezionare accuratamente un commit.

Un esempio per il workflow su come eseguire la selezione accurata considera che il bug [RegExp mostra risultati incoerenti con altri browser](https://crbug.com/v8/5199). Dal bug possiamo vedere che è stato unito da V8 all'interno di 5.2 e 5.3, e non all'interno di V8 5.1 (poiché era già stato abbandonato). Poiché Node.js `v6.x` utilizza V8 5.1, la correzione doveva essere selezionata accuratamente. Per eseguire la sezione accurata, ecco qui un esempio di workflow:

* Scarica ed applica il commit collegato al problema (in questo caso a51f429). `curl -L https://github.com/v8/v8/commit/a51f429.patch | git am -3
--directory=deps/v8`. Se i branch si sono divisi in modo significativo, questo potrebbe non essere applicato in modo pulito. Potrebbe essere utile provare a selezionare l'unione con il branch più vecchio eseguito in modo upstream in V8. In questo esempio, questa sarebbe la patch ricevuta dall'unione alla 5.2. La speranza è che questa sia più vicina al V8 5.1, ed abbia una migliore possibilità di essere applicata in modo pulito. Se sei bloccato, sentiti libero di chiamare @ofrobots per un aiuto.
* Modifica il commit message in modo che corrisponda al formato che utilizziamo per i backport di V8 e sostituisci te stesso come autore. `git commit --amend --reset-author`. Se necessario è possibile aggiungere una descrizione extra per indicare l'impatto della correzione su Node.js. In questo caso il problema originale era abbastanza descrittivo. Esempio:

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

* Apri una PR contro il branch `v6.x-staging` nel repository di Node.js. Avvia il normal e [V8 CI](https://ci.nodejs.org/job/node-test-commit-v8-linux/) utilizzando il sistema CI di Node.js. Abbiamo solo bisogno di eseguire il backport su `v6.x` poiché gli altri branch LTS non sono stati colpiti da questo bug.

### Backport identificati dal team di V8

Per i bug rilevati tramite il browser od altri canali, il team di V8 contrassegna quelli che potrebbero essere applicabili ai branch abbandonati in uso da Node.js. Ciò avviene tramite il tagging manuale da parte del team di V8 e attraverso un processo automatizzato che tagga qualsiasi correzione che viene trasferita allo stable branch (poiché è probabile che sia scelto per un ulteriore backporting).

Tali correzioni sono taggate con le seguenti etichette nell'issue tracker di V8:

* `NodeJS-Backport-Review` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Review), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Review)): da rivedere se questo è applicabile ai branch abbandonati in uso da Node.js. Questo elenco se rivisto regolarmente dal team Node.js di Google per determinare l'applicabilità a Node.js.
* `NodeJS-Backport-Approved` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Approved), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Approved)): contrassegna i bug che sono ritenuti rilevanti per Node.js e che devono subire il backport.
* `NodeJS-Backport-Done` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Done), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Done)): Backport per Node.js che è già stato eseguito.
* `NodeJS-Backport-Rejected` ([V8](https://bugs.chromium.org/p/v8/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected), [Chromium](https://bugs.chromium.org/p/chromium/issues/list?can=1&q=label%3ANodeJS-Backport-Rejected)): Backport per Node.js che è indesiderato.

Il backlog di tali problemi viene regolarmente rivisto dal node-team di Google per seguire il processo di backport. I contributors esterni sono invitati a collaborare anche sul processo di backport. Nota che alcuni dei bug potrebbero essere problemi di sicurezza e non saranno visibili ai contributors esterni.

## Aggiornamento di V8

Node.js conserva una copia di vendita di V8 all'interno della directory deps/. Inoltre, Node.js potrebbe dover rendere mobili le patch che non esistono in upstream. Ciò significa che potrebbe essere necessario prestare attenzione per aggiornare la copia di vendita di V8.

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

V8 mantiene anche i tag della forma *5.4-lkgr* che punta alla *Last Known Good Revision* (Ultima Buona Revisione Conosciuta) dal branch 5.4 che può essere utile nel processo di aggiornamento qui sopra.

Lo strumento [`update-v8`](https://github.com/targos/update-v8) può essere utilizzato per semplificare quest'attività. Esegui `update-v8 minor` per applicare un aggiornamento minore.

### Aggiornamenti Importanti

Aggiorniamo la versione di V8 nel master di Node.js ogni volta che una nuova versione rilasciata di V8 diventa stable upstream, ovvero ogni volta che viene rilasciata una nuova versione di Chrome.

L'aggiornamento delle versioni principali sarebbe molto più difficile da fare con il meccanismo delle patch descritto sopra. Una strategia migliore è quella di

1. Controllare il master branch attuale e guardare le patch che sono state rese mobili dall'ultimo aggiornamento importante di V8.
2. Sostituire la copia di V8 in Node.js con un nuovo controllo dell'ultimo stable branch di V8. È necessario prestare particolare attenzione per aggiornare in modo ricorsivo le DEPS (dipendenze) sulle quali V8 ha una dipendenza compile time (al momento della stesura di questo documento, sono solo trace_event e gtest_prod.h)
3. Resettare la variabile `v8_embedder_string` sul valore "-node.0" in `common.gypi`.
4. Rendere mobili (selezione accurata) tutte le patch dalla lista calcolata in 1) se necessario. Alcune patch potrebbero non essere più necessarie.

Per controllare le patch mobili:

```shell
git log --oneline deps/v8
```

Per sostituire la copia di V8 in Node.js, utilizzare lo strumento [`update-v8`]. Ad esempio, se si desidera sostituire la copia di V8 in Node.js con il branch-head per il branch della V8 5.1:

```shell
cd $NODE_DIR
update-v8 major --branch=5.1-lkgr
```

Questo dovrebbe essere seguito con il refloating manuale di tutte le patch rilevanti.

## Proposta: Utilizzo di un fork repo per tracciare upstream V8

Il fatto che Node.js mantenga una copia di vendita di V8 potenzialmente modificata in deps/ rende i processi sopracitati un pò complicati. Una proposta alternativa sarebbe quella di creare un fork di V8 su `nodejs/v8` che verrebbe utilizzato per mantenere i branch di V8. Questo ha diversi vantaggi:

* Il processo per aggiornare la versione di V8 in Node.js potrebbe essere automatizzato per tracciare i suggerimenti dei vari branch di V8 in `nodejs/v8`.
* Semplificherebbe la selezione accurata ed il porting delle correzioni tra i branch, dato che i bump di versione in `v8-version.h` si verificherebbero come parte di questo aggiornamento anziché ad ogni modifica.
* Semplificherebbe V8-CI e lo renderebbe più automatico.
* La cronologia del branch di V8 in `nodejs/v8` diventerebbe più pura e renderebbe più semplice il coinvolgimento del team di V8 nella revisione.
* Semplificherebbe l'installazione di una build automatizzata che tenga traccia del master di Node.js + l'integration build di V8.

Fare questo richiede alcuni strumenti:

* Uno script che aggiornerebbe il V8 in un branch specifico di Node.js con V8 da upstream (dipendente dal branch abbandonato contro il branch attivo).
* Uno script per eseguire il bump dei numeri delle versioni V8 quando una nuova versione di V8 viene promossa da `nodejs/v8` a `nodejs/node`.
* Build di V8-CI abilitato in Jenkins per costruire dal fork di `nodejs/v8`.

<!-- Footnotes themselves at the bottom. -->

### Note

<sup>1</sup>Node.js 0.12 e le versioni precedenti vengono omessi intenzionalmente da questo documento in quanto non vengono più supportate.