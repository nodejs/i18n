# Pull Requests

Ci sono due componenti fondamentali del processo di Pull Request: uno concreto e tecnico ed uno più orientato al processo. La componente concreta e tecnica riguarda i dettagli specifici della configurazione del local environment in modo da poter apportare le modifiche effettive. Questo è da dove inizieremo.

* [Dipendenze](#dependencies)
* [Configurazione del local environment](#setting-up-your-local-environment) 
  * [Step 1: Fork](#step-1-fork)
  * [Step 2: Branch](#step-2-branch)
* [Il Processo per Fare Modifiche](#the-process-of-making-changes) 
  * [Step 3: Code](#step-3-code)
  * [Step 4: Commit](#step-4-commit) 
    * [Linee Guida per il Commit Message](#commit-message-guidelines)
  * [Step 5: Rebase](#step-5-rebase)
  * [Step 6: Test](#step-6-test) 
    * [Test Coverage](#test-coverage)
  * [Step 7: Push](#step-7-push)
  * [Step 8: Aprire la Pull Request](#step-8-opening-the-pull-request)
  * [Step 9: Discutere ed Aggiornare](#step-9-discuss-and-update) 
    * [Workflow dell'Approval e delle Request Changes](#approval-and-request-changes-workflow)
  * [Step 10: Conferma (Landing)](#step-10-landing)
* [Revisione delle Pull Requests](#reviewing-pull-requests) 
  * [Revisionare un pò alla volta](#review-a-bit-at-a-time)
  * [Essere consapevoli della persona dietro il codice](#be-aware-of-the-person-behind-the-code)
  * [Rispettare il tempo di attesa minimo per i commenti](#respect-the-minimum-wait-time-for-comments)
  * [Pull Request Abbandonate o Bloccate](#abandoned-or-stalled-pull-requests)
  * [Approvare una modifica](#approving-a-change)
  * [Accettare che ci siano opinioni diverse su ciò che appartiene a Node.js](#accept-that-there-are-different-opinions-about-what-belongs-in-nodejs)
  * [Le prestazioni non sono tutto](#performance-is-not-everything)
  * [Test di integrazione continua](#continuous-integration-testing)
* [Note aggiuntive](#additional-notes) 
  * [Commit Squashing](#commit-squashing)
  * [Ottenere Approvazioni per la Pull Request](#getting-approvals-for-your-pull-request)
  * [CI Testing](#ci-testing)
  * [Attendere fino a quanto la Pull Request non viene confermata](#waiting-until-the-pull-request-gets-landed)
  * [Consultare la Collaborator Guide](#check-out-the-collaborator-guide)

## Dipendenze

Node.js ha diverse dipendenze in bundle nelle directory *deps/* e *tools/* che non fanno parte del progetto corretto. Le modifiche ai file in tali directory dovrebbero essere inviate ai rispettivi progetti. Non inviare una patch a Node.js. Non possiamo accettare tali patch.

Se c'è qualche dubbio, aprire un issue nell'[issue tracker](https://github.com/nodejs/node/issues/) o contattare uno dei [Collaboratori del progetto](https://github.com/nodejs/node/#current-project-team-members). Node.js ha due canali IRC: [#Node.js](https://webchat.freenode.net/?channels=node.js) per un aiuto e domande di tipo generico, e [#Node-dev](https://webchat.freenode.net/?channels=node-dev) per lo sviluppo del Node.js core in particolare.

## Configurazione del local environment

Per iniziare, bisogna avere `git` installato in local. A seconda del sistema operativo in uso, c'è un determinato numero di dipendenze necessarie. Queste sono approfondite nella [Building guide](../../../BUILDING.md).

Una volta che hai `git` e sei sicuro di avere tutte le dipendenze necessarie, è il momento di creare un fork.

### Step 1: Fork

Suddividi (Fork) il progetto [su GitHub](https://github.com/nodejs/node) e clona la tua fork (parte suddivisa) in local.

```text
$ git clone git@github.com:username/node.git
$ cd node
$ git remote add upstream https://github.com/nodejs/node.git
$ git fetch upstream
```

Si consiglia di configurare `git` in modo che sappia chi sei:

```text
$ git config user.name "J. Random User"
$ git config user.email "j.random.user@example.com"
```

Si presa di assicurarsi che questa local email sia aggiunta anche alla tua [GitHub email list](https://github.com/settings/emails) in modo che i tuoi commits siano correttamente associati al tuo account ed in modo che tu venga promosso a Contributor una volta che il tuo primo commit viene confermato.

### Step 2: Branch

Come migliore pratica per mantenere il tuo development environment il più organizzato possibile, crea local branch su cui lavorare. Questi dovrebbero anche essere creati direttamente dal `master` branch.

```text
$ git checkout -b my-branch -t upstream/master
```

## Il Processo per Fare Modifiche

### Step 3: Code

La stragrande maggioranza delle Pull Requests aperte sul repository `nodejs/node` includono le modifiche ad uno o più dei seguenti elementi:

     - Il codice C/C++ all'interno della directory `src`
     - Il codice JavaScript all'interno della directory `lib`
     - la documentazione in `doc/api`
     - i test all'interno della directory `test`.
    

Se stai modificando il codice, assicurati di eseguire `make lint` di volta in volta per essere sicuro che le modifiche seguano la Node.js code style guide.

Qualsiasi documentazione scritta (compresi i commenti al codice e la documentazione API) dovrebbe seguire la [Style Guide](../../STYLE_GUIDE.md). Gli esempi di codice inclusi nei documenti API verranno controllati anche quando si esegue `make lint` (o `vcbuild.bat lint` su Windows).

Per contribuire con il codice C++, potresti dare un'occhiata alla [C++ Style Guide](../../../CPP_STYLE_GUIDE.md).

### Step 4: Commit

È consigliato utilizzare le migliori pratiche per mantenere le modifiche raggruppate nel modo più logico possibile all'interno dei singoli commits. Non c'è alcun limite al numero di commits che ogni singola Pull Request può avere, e molti contributors trovano più facile rivedere le modifiche che sono suddivise tra più commits.

```text
$ git add my/changed/files
$ git commit
```

Da notare che più commits vengono spesso "schiacciati" (squashing) quando sono confermati (vedi le note riguardo il [commit squashing](#commit-squashing)).

#### Linee Guida per il Commit Message

Un buon commit message dovrebbe descrivere cosa è stato modificato e perchè.

1. La prima riga dovrebbe:
  
  * contenere una breve descrizione della modifica (preferibilmente di 50 caratteri o meno, e non più di 72 caratteri)
  * essere interamente in minuscolo con l'eccezione dei nomi propri, degli acronimi e delle parole che si riferiscono al codice, come nomi di funzioni/variabili
  * essere preceduta dal nome del subsystem modificato ed iniziare con un verbo imperativo. Controlla l'output di `git log --oneline files/you/changed` per scoprire quali subsystems tocchi con le tue modifiche.
    
    Esempi:
  
  * `net: Aggiunge localAddress e localPort al Socket`
  
  * `src: corregge gli errori di battitura in async_wrap.h`

2. Lascia vuota la seconda riga.

3. Esegui il wrapping di tutte le altre righe a 72 colonne (ad eccezione di URL lunghi).

4. Se la patch corregge un issue (problema) aperto, puoi aggiungere un riferimento ad esso alla fine del log. Usa il prefisso `Fixes:` ed l'URL completo dell'issue. Per altri riferimenti usa `Refs:`.
  
  Esempi:
  
  * `Fixes: https://github.com/nodejs/node/issues/1337`
  * `Refs: http://eslint.org/docs/rules/space-in-parens.html`
  * `Refs: https://github.com/nodejs/node/pull/3615`

5. Se il tuo commit introduce una breaking change (`semver-major`), dovrebbe contenere una spiegazione sul perchè di questa modifica, quale situazione la innescherebbe e qual è la modifica esatta.

Esempio di commit message completo:

```txt
subsystem: spiega il commit in una riga

Il corpo (body) del commit message è composto da poche 
righe di testo, le quali spiegano le cose in modo
più dettagliato, dando eventualmente qualche informazione
sul problema da correggere, ecc.

Il corpo del commit message può essere di diversi paragrafi, 
e si prega di andare a capo e mantenere le colonne 
più corte di 72 caratteri all'incirca. In questo modo, `git log` 
mostrerà le cose bene anche quando è indentato.

Fixes: https://github.com/nodejs/node/issues/1337
Refs: http://eslint.org/docs/rules/space-in-parens.html
```

Se sei nuovo nel contribuire a Node.js, prova a fare del tuo meglio seguendo queste linee guida, ma non preoccuparti se fai qualcosa di sbagliato. Uno dei contributors esistenti ti aiuterà a trovare le cose e il contributor che conferma la Pull Request si assicurerà che sia tutto secondo le linee guida del progetto.

Vedi [core-validate-commit](https://github.com/evanlucas/core-validate-commit) - Un'utility che garantisce che i commits seguano le linee guida per la formattazione del commit.

### Step 5: Rebase

Come migliore pratica, una volta inviate le modifiche, è una buona idea usare `git rebase` (non `git merge`) per sincronizzare il lavoro con il repository principale.

```text
$ git fetch upstream
$ git rebase upstream/master
```

Questo assicura che il tuo branch di lavoro abbia le ultime modifiche dal `nodejs/node` master.

### Step 6: Test

Le correzioni dei bug e le funzionalità dovrebbero sempre arrivare facendo i test. E' stata fornita una [guida per scrivere test in Node.js](../writing-tests.md) in modo da rendere il processo più facile. Anche guardare altri test per vedere come dovrebbero essere strutturati può essere d'aiuto.

La directory `test` all'interno del repository `nodejs/node` è complessa e spesso non è chiaro dove dovrebbe andare un nuovo test file. In caso di qualche dubbio, aggiungere i nuovi test alla directory `test/parallel/` e la posizione corretta verrà aggiustata in un secondo momento.

Prima di inviare le modifiche in una Pull Request, eseguire sempre tutto l'insieme dei test di Node.js. Per eseguire i test (incluso il code linting) su Unix / macOS:

```text
$ ./configure && make -j4 test
```

E su Windows:

```text
> vcbuild test
```

(Vedi la [Building guide](../../../BUILDING.md) per maggiori dettagli.)

Assicurarsi che il linter non segnali alcun problema e che tutti i test passino con successo. Si prega di non inviare patch che non superano i controlli.

Se vuoi eseguire il linter senza eseguire i test, usa `make lint`/`vcbuild lint`. Esso eseguirà sia il JavaScript linting che il C++ linting.

Se stai aggiornando i test e ne vuoi eseguire uno solo per controllarlo:

```text
$ python tools/test.py -J --mode=release parallel/test-stream2-transform
```

Puoi eseguire tutto l'insieme di test per un determinato subsystem fornendo il nome di un subsystem:

```text
$ python tools/test.py -J --mode=release child-process
```

Se vuoi controllare le altre opzioni, chiedi aiuto usando l'opzione `--help`

```text
$ python tools/test.py --help
```

In genere puoi eseguire test direttamente con il node:

```text
$ ./node ./test/parallel/test-stream2-transform.js
```

Ricorda di ricompilare con `make -j4`, tra l'esecuzione di un test e l'altro, se modifichi il codice nelle directory `lib` o `src`.

#### Test Coverage

È buona pratica garantire che qualsiasi codice aggiunto o modificato sia coperto dai test. Puoi farlo eseguendo l'insieme dei test con la coverage abilitata:

```text
$ ./configure --coverage && make coverage
```

Un report dettagliato sulla coverage verrà scritto su `coverage/index.html` per la JavaScript coverage e su `coverage/cxxcoverage.html` per la C++ coverage.

*Si noti che la generazione di un test coverage report può richiedere diversi minuti.*

Per raccogliere la coverage di un sottoinsieme di test, puoi impostare le variabili `CI_JS_SUITES` e `CI_NATIVE_SUITES`:

```text
$ CI_JS_SUITES=child-process CI_NATIVE_SUITES= make coverage
```

Il comando precedente esegue i test per il subsystem `child-process` e genera il coverage report risultante.

L'esecuzione di test con coverage creerà e modificherà diverse directory e file. Per pulire in seguito, esegui:

```text
make coverage-clean
./configure && make -j4.
```

### Step 7: Push

Una volta che sei sicuro che i tuoi commits sono pronti, con i test ed il linting superati, inizia il processo di apertura di una Pull Request spingendo (push) il tuo branch di lavoro al tuo fork su GitHub.

```text
$ git push origin my-branch
```

### Step 8: Aprire la Pull Request

All'interno di GitHub, l'apertura di una nuova Pull Request si presenterà con un modello da dover compilare:

```markdown
<!--
Grazie per la tua Pull Request. Si prega di fornire una descrizione sopra e ricontrollare i requisiti di seguito.

Le correzioni di bug e nuove funzionalità dovrebbero includere i test ed eventualmente i benchmark.

Contributors guide: https://github.com/nodejs/node/blob/master/CONTRIBUTING.md
-->

#### Checklist
<!-- Rimuovi gli elementi che non si applicano. Per gli elementi completati, modificare [ ] to [x]. -->

- [ ] `make -j4 test` (UNIX), oppure `vcbuild test` (Windows) passa
- [ ] i test e/o i benchmark sono inclusi
- [ ] la documentazione è modificata o aggiunta
- [ ] il commit message segue le [commit guidelines](https://github.com/nodejs/node/blob/master/doc/guides/contributing/pull-requests.md#commit-message-guidelines)
```

Cerca di fare del tuo meglio per compilare tutti i punti, ma sentiti libero di saltare le parti dove non sei sicuro cosa mettere.

Una volta aperte, le Pull Request vengono generalmente esaminate entro pochi giorni.

### Step 9: Discutere ed Aggiornare

Probabilmente riceverai feedback o richieste di modifiche per la tua Pull Request. Questa è una parte importante del processo di invio quindi non scoraggiarti! Alcuni contributors possono confermare subito la Pull Request, altri possono volere commenti o feedback più dettagliati. Questa è una parte necessaria del processo al fine di poter valutare se le modifiche sono corrette e necessarie.

Per apportare modifiche ad una Pull Request esistente, fai le modifiche nel tuo local branch, aggiungi un nuovo commit con queste modifiche ed inviale (push) al fork. GitHub aggiornerà automaticamente la Pull Request.

```text
$ git add my/changed/files
$ git commit
$ git push origin my-branch
```

Spesso è anche necessario sincronizzare la tua Pull Request con altre modifiche che sono finite in `master` usando `git rebase`:

```text
$ git fetch --all
$ git rebase origin/master
$ git push --force-with-lease origin my-branch
```

**Importante:** Il comando `git push --force-with-lease` è uno dei pochi modi per eliminare la cronologia in `git`. Prima di usarlo, assicurati di comprenderne i rischi. Se hai qualche dubbio, puoi sempre chiedere indicazioni nella Pull Request o su [IRC nel canale #node-dev](https://webchat.freenode.net?channels=node-dev&uio=d4).

Se ti capita di fare un errore in uno dei tuoi commits, non preoccuparti. Puoi modificare l'ultimo commit (ad esempio se vuoi modificare il commit log).

```text
$ git add any/changed/files
$ git commit --amend
$ git push --force-with-lease origin my-branch
```

Ci sono numerosi meccanismi più avanzati per la gestione dei commits e possono essere utilizzati tramite `git rebase`, ma vanno oltre lo scopo di questa guida.

Se sei in attesa di una risposta o qualsiasi cosa, sentiti libero di inserire un commento nella Pull Request per ricordarlo ai revisori. Se incontri parole o acronimi che non ti sembrano familiari, aiutati con questo [glossario](https://sites.google.com/a/chromium.org/dev/glossary).

#### Workflow dell'Approval e delle Request Changes

Tutte le Pull Request richiedono lo "sign off" per essere confermate. Ogni volta che un contributor esamina una Pull Request, può trovare dettagli specifici che vorrebbe vedere modificati o corretti. Questi possono essere semplici come correggere errori di battitura oppure possono implicare modifiche sostanziali al codice che hai scritto. Sebbene queste loro richieste siano utili, potrebbero anche rivelarsi improvvise o inutili, in particolare le richieste di modificare cose senza suggerimenti concreti su *come* fare per modificarle.

Cerca di non scoraggiarti. Se credi che una particolare revisione sia ingiusta, dillo, oppure contatta uno degli altri contributors del progetto e tenta di ottenere il loro aiuto. Spesso osservazioni di questo tipo sono il risultato del fatto che il revisore ha dato un giudizio affrettato e quindi non sono mal intenzionate. Spesso problemi di questo tipo possono essere risolti con un pò di pazienza. Detto questo, i revisori dovrebbero essere d'aiuto con i loro feedback, perciò il feedback semplicemente vago, sprezzante ed inutile è senz'altro da ignorare.

### Step 10: Conferma (Landing)

Per essere confermata, una Pull Request deve essere revisionata ed [approved](#getting-approvals-for-your-pull-request) (approvata) da almeno un Node.js Collaborator e superare un [CI (Continuous Integration) test run](#ci-testing). Dopodiché, finché non ci sono obiezioni da parte di altri contributors, la Pull Request può essere inserita (merged). Se credi che il tempo d'attesa della tua Pull Request sia stato più lungo del previsto, vedi le [note riguardo il tempo d'attesa](#waiting-until-the-pull-request-gets-landed).

Quando un collaborator conferma la Pull Request, invierà un commento alla pagina della Pull Request menzionando il(i) commit(s) confermato(i). GitHub mostra spesso la Pull Request come `Closed` (chiusa) a questo punto, ma non preoccuparti. Se osservi il branch su cui hai generato la tua Pull Request (probabilmente `master`), dovresti vedere un commit con sopra il tuo nome. Congratulazioni e grazie per il tuo contributo!

## Revisione delle Pull Requests

Tutti i contributors di Node.js che scelgono di revisionare e fornire feedback sulle Pull Requests hanno una responsabilità sia nei confronti del progetto sia nei confronti della persona che fornisce il contributo. Le revisioni ed i feedback devono essere utili, perspicaci ed orientate a migliorare il contributo anziché semplicemente bloccarlo. Se ci sono ragioni per le quali ritieni che la PR non debba essere confermata, spiega quali sono. Non aspettarti di essere in grado di bloccare l'avanzamento di una Pull Request semplicemente dicendo "No" senza neanche dare una spiegazione. Sii aperto ad avere una mentalità flessibile. Sii aperto a collaborare con il contributor per migliorare la Pull Request.

Le revisioni, del contributor o di qualsiasi altro revisore, che sono sprezzanti o irrispettose sono rigorosamente in contrasto con il [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

Quando si revisiona una Pull Request, gli obiettivi primari sono il miglioramento del codebase e che la persona che invia la richiesta abbia successo. Anche se una Pull Request non viene confermata, chi invia la richiesta dovrebbe uscire da quest'esperienza come se il proprio sforzo non fosse sprecato o poco apprezzato. Perchè ogni Pull Request di un nuovo contributor è un'opportunità per far crescere la community.

### Revisionare un pò alla volta.

Non sovraccaricare i nuovi contributors.

Si è tentati di micro-ottimizzare e fare tutto seguendo prestazioni relative, grammatica perfetta o corrispondenze di stile esatte. Non cedere a questa tentazione.

Concentrati innanzitutto sugli aspetti più significativi della modifica:

1. Questa modifica ha senso per Node.js?
2. Questa modifica rende Node.js migliore, anche se solo in modo incrementale?
3. Ci sono chiari bug o problemi su larga scala che devono essere seguiti?
4. Il commit message è leggibile e corretto? Se contiene una breaking change è abbastanza chiaro?

Quando le modifiche sono necessarie, *rechiedile*, non *pretenderle*, e non dare per scontato che il submitter sappia già come aggiungere un test od eseguire un benchmark.

Specifiche tecniche di ottimizzazione delle prestazioni, stili e convenzioni di codifica si modificano nel tempo. La prima impressione che date ad un nuovo contributor non cambia mai più.

I Nits (le request per piccole modifiche che non sono essenziali) vanno bene, ma cerca di evitare che una Pull Request venga bloccata. La maggior parte dei nits può essere risolta dal Node.js Collaborator che conferma la Pull Request, ma può anche essere un'opportunità per il contributor di imparare un pò di più sul progetto.

È sempre bene indicare chiaramente i nits quando commentate: ad es. `Nit: modifica di foo() con bar(). Ma questo non sta bloccando`

Se i tuoi commenti sono stati indirizzati ma non sono stati inseriti automaticamente dopo i nuovi commits o se si sono rivelati errati, sei pregato di [nasconderli](https://help.github.com/articles/managing-disruptive-comments/#hiding-a-comment) con la giusta motivazione per mantenere la conversazione fluida e pertinente.

### Essere consapevoli della persona dietro il codice

Tieni presente che *il modo* in cui comunichi le richieste e le revisioni nel tuo feedback può avere un impatto significativo sul successo della Pull Request. Sì, potremmo confermare una particolare modifica che rende Node.js migliore, ma la persona potrebbe non voler più avere nulla a che fare con Node.js. L'obiettivo non è solo avere un buon codice.

### Rispettare il tempo di attesa minimo per i commenti

C'è un tempo di attesa minimo che cerchiamo di rispettare per le modifiche significative, in modo che le persone, che possono avere un input importante in un progetto così distribuito, siano in grado di rispondere.

Per le modifiche significative, le Pull Requests devono essere lasciate aperte per *almeno* 48 ore nel corso della settimana, e 72 ore durante il weekend. Nella maggior parte dei casi, quando la PR è relativamente piccola e focalizzata su un ristretto insieme di modifiche, questi periodi danno a disposizione più del tempo necessario per un'adeguata revisione. A volte le modifiche richiedono molto più tempo per la revisione o richiedono una revisione più specializzata da parte di esperti in materia. Se c'è qualche dubbio, non avere fretta.

Le modifiche banali, in genere limitate a piccole modifiche di formattazione o correzioni alla documentazione, possono essere confermate entro in un minimo di 48 ore.

### Pull Request Abbandonate o Bloccate

If a Pull Request appears to be abandoned or stalled, it is polite to first check with the contributor to see if they intend to continue the work before checking if they would mind if you took it over (especially if it just has nits left). When doing so, it is courteous to give the original contributor credit for the work they started (either by preserving their name and email address in the commit log, or by using an `Author:` meta-data tag in the commit.

### Approving a change

Any Node.js core Collaborator (any GitHub user with commit rights in the `nodejs/node` repository) is authorized to approve any other contributor's work. Collaborators are not permitted to approve their own Pull Requests.

Collaborators indicate that they have reviewed and approve of the changes in a Pull Request either by using GitHub's Approval Workflow, which is preferred, or by leaving an `LGTM` ("Looks Good To Me") comment.

When explicitly using the "Changes requested" component of the GitHub Approval Workflow, show empathy. That is, do not be rude or abrupt with your feedback and offer concrete suggestions for improvement, if possible. If you're not sure *how* a particular change can be improved, say so.

Most importantly, after leaving such requests, it is courteous to make yourself available later to check whether your comments have been addressed.

If you see that requested changes have been made, you can clear another collaborator's `Changes requested` review.

Change requests that are vague, dismissive, or unconstructive may also be dismissed if requests for greater clarification go unanswered within a reasonable period of time.

If you do not believe that the Pull Request should land at all, use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing. When doing so, explain *why* you believe the Pull Request should not land along with an explanation of what may be an acceptable alternative course, if any.

### Accept that there are different opinions about what belongs in Node.js

Opinions on this vary, even among the members of the Technical Steering Committee.

One general rule of thumb is that if Node.js itself needs it (due to historic or functional reasons), then it belongs in Node.js. For instance, `url` parsing is in Node.js because of HTTP protocol support.

Also, functionality that either cannot be implemented outside of core in any reasonable way, or only with significant pain.

It is not uncommon for contributors to suggest new features they feel would make Node.js better. These may or may not make sense to add, but as with all changes, be courteous in how you communicate your stance on these. Comments that make the contributor feel like they should have "known better" or ridiculed for even trying run counter to the [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

### Performance is not everything

Node.js has always optimized for speed of execution. If a particular change can be shown to make some part of Node.js faster, it's quite likely to be accepted. Claims that a particular Pull Request will make things faster will almost always be met by requests for performance [benchmark results](../writing-and-running-benchmarks.md) that demonstrate the improvement.

That said, performance is not the only factor to consider. Node.js also optimizes in favor of not breaking existing code in the ecosystem, and not changing working functional code just for the sake of changing.

If a particular Pull Request introduces a performance or functional regression, rather than simply rejecting the Pull Request, take the time to work *with* the contributor on improving the change. Offer feedback and advice on what would make the Pull Request acceptable, and do not assume that the contributor should already know how to do that. Be explicit in your feedback.

### Continuous Integration Testing

All Pull Requests that contain changes to code must be run through continuous integration (CI) testing at <https://ci.nodejs.org/>.

Only Node.js core Collaborators with commit rights to the `nodejs/node` repository may start a CI testing run. The specific details of how to do this are included in the new Collaborator [Onboarding guide](../../onboarding.md).

Ideally, the code change will pass ("be green") on all platform configurations supported by Node.js (there are over 30 platform configurations currently). This means that all tests pass and there are no linting errors. In reality, however, it is not uncommon for the CI infrastructure itself to fail on specific platforms or for so-called "flaky" tests to fail ("be red"). It is vital to visually inspect the results of all failed ("red") tests to determine whether the failure was caused by the changes in the Pull Request.

## Additional Notes

### Commit Squashing

In most cases, do not squash commits that you add to your Pull Request during the review process. When the commits in your Pull Request land, they may be squashed into one commit per logical change. Metadata will be added to the commit message (including links to the Pull Request, links to relevant issues, and the names of the reviewers). The commit history of your Pull Request, however, will stay intact on the Pull Request page.

For the size of "one logical change", [0b5191f](https://github.com/nodejs/node/commit/0b5191f15d0f311c804d542b67e2e922d98834f8) can be a good example. It touches the implementation, the documentation, and the tests, but is still one logical change. All tests should always pass when each individual commit lands on the master branch.

### Getting Approvals for Your Pull Request

A Pull Request is approved either by saying LGTM, which stands for "Looks Good To Me", or by using GitHub's Approve button. GitHub's Pull Request review feature can be used during the process. For more information, check out [the video tutorial](https://www.youtube.com/watch?v=HW0RPaJqm4g) or [the official documentation](https://help.github.com/articles/reviewing-changes-in-pull-requests/).

After you push new changes to your branch, you need to get approval for these new changes again, even if GitHub shows "Approved" because the reviewers have hit the buttons before.

### CI Testing

Every Pull Request needs to be tested to make sure that it works on the platforms that Node.js supports. This is done by running the code through the CI system.

Only a Collaborator can start a CI run. Usually one of them will do it for you as approvals for the Pull Request come in. If not, you can ask a Collaborator to start a CI run.

### Waiting Until the Pull Request Gets Landed

A Pull Request needs to stay open for at least 48 hours (72 hours on a weekend) from when it is submitted, even after it gets approved and passes the CI. This is to make sure that everyone has a chance to weigh in. If the changes are trivial, collaborators may decide it doesn't need to wait. A Pull Request may well take longer to be merged in. All these precautions are important because Node.js is widely used, so don't be discouraged!

### Consultare la Collaborator Guide

If you want to know more about the code review and the landing process, see the [Collaborator Guide](../../../COLLABORATOR_GUIDE.md).