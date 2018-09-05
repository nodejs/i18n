# Onboarding

Questo documento è una descrizione delle cose che vengono dette ai nuovi Collaboratori durante la sessione di onboarding.

## Una settimana prima della sessione di onboarding

* Se il nuovo Collaboratore non è ancora membro dell'organizzazione GitHub di nodejs, confermare l'utilizzo dell'[autenticazione a due fattori](https://help.github.com/articles/securing-your-account-with-two-factor-authentication-2fa/). Non sarà possibile aggiungere nuovi collaboratori all'organizzazione se non utilizzano l'autenticazione a due fattori. Se non riescono a ricevere messaggi SMS da GitHub, provare [l'utilizzo di un'app mobile TOTP](https://help.github.com/articles/configuring-two-factor-authentication-via-a-totp-mobile-app/).
* Annunciare la nomination accettata in un meeting TSC e nella mailing list TSC.
* Suggerire al nuovo Collaboratore di l'installare [`node-core-utils`][] e di [impostarne le credenziali](https://github.com/nodejs/node-core-utils#setting-up-credentials).

## Quindici minuti prima della sessione di onboarding

* Prima della sessione di onboarding, aggiungere il nuovo Collaboratore al [team dei Collaboratori](https://github.com/orgs/nodejs/teams/collaborators).
* Chiedere ai nuovi collaboratori se vogliono unirsi a qualsiasi team del sottosistema. Vedi [Chi indicare come CC nell'issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).

## Sessione di Onboarding

* Questa sessione coprirà: 
  * [la configurazione locale](#local-setup)
  * [gli obiettivi & i valori del progetto](#project-goals--values)
  * [la gestione dell'issue tracker](#managing-the-issue-tracker)
  * [la revisione delle PR](#reviewing-prs)
  * [la conferma delle PR](#landing-prs)

## Configurazione Locale

* git:
  
  * Assicurati di avere whitespace=fix: `git config --global --add
apply.whitespace fix`
  * Continua sempre la PR dal tuo GitHub fork 
    * I branch nel repository `nodejs/node` sono solo per le righe di rilascio
  * Vedi [Aggiornamento di Node.js dall'Upstream](./onboarding-extras.md#updating-nodejs-from-upstream)
  * Crea un nuovo branch per ogni PR che invii.
  * Membership: Considera la possibilità di rendere pubblica la tua membership (iscrizione) all'organizzazione GitHub di Node.js. Ciò semplifica l'identificazione dei Collaboratori. Le istruzioni su come farlo sono disponibili in [Rendere pubblica o nascondere la membership all'organizzazione](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

* Notifiche:
  
  * Utilizza <https://github.com/notifications> oppure imposta una email
  * Stai attento poiché la repository principale invaderà la tua email (diverse centinaia di notifiche durante una normale settimana), quindi preparati

* `#node-dev` su [webchat.freenode.net](https://webchat.freenode.net/) è il posto migliore per interagire con il TSC / gli altri Collaboratori
  
  * Se dopo la sessione ci sono delle domande, quello è il luogo adatto per farle!
  * La presenza non è obbligatoria, ma si prega di lasciare una nota se la si vuole far arrivare a `master`

## Obiettivi & valori del progetto

* I Collaboratori sono i proprietari collettivi del progetto
  
  * Il progetto ha gli obiettivi dei suoi contributor

* Ci sono alcuni obiettivi e valori di livello superiore
  
  * L'empatia nei confronti degli utenti è importante (questo è in parte il motivo per cui permettiamo l'onboarding di nuove persone)
  * In generale: cerca di essere gentile con le persone!
  * Il miglior risultato è quando le persone che vengono nel nostro issue tracker se ne vanno sentendosi tranquille di poter tornare di nuovo.

* Dovresti seguire *e* ritenere gli altri responsabili verso il [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

## Gestione dell'issue tracker

* Hai (per lo più) libertà di azione; non esitare a chiudere un issue se sei sicuro che debba essere chiuso
  
  * Sii moderato nella chiusura degli issue! Fai sapere alle persone il perché della chiusura, e che gli issue e le PR possono essere riaperti se necessario

* [**Vedi "Etichette"**](./onboarding-extras.md#labels)
  
  * C'è [un bot](https://github.com/nodejs-github-bot/github-bot) che applica le etichette del sottosistema (ad esempio, `doc`, `test`, `assert`, o `buffer`) in modo da sapere quali parti della code base sono modificate dalla pull request. Non è perfetto, ovviamente. Sentiti libero di applicare etichette pertinenti e di rimuovere quelle irrilevanti dalle pull request o dagli issue.
  * Utilizza l'etichetta `tsc-review` se un argomento è controverso o non giunge ad una conclusione dopo un periodo di tempo prolungato.
  * `semver-{minor,major}`: 
    * Se una modifica ha la remota *possibilità* di danneggiare qualcosa, utilizza l'etichetta `semver-major`
    * Quando si aggiunge un'etichetta `semver-*`, aggiungi un commento che spiega il perché di quell'etichetta. Fallo subito così non te ne dimentichi!
  * Si prega di aggiungere l'etichetta `author-ready` per le PR dove: 
    * il CI è stato avviato (non necessariamente concluso),
    * non esistono commenti di revisione rilevanti e
    * almeno un collaboratore ha approvato la PR.

* Vedi [Chi indicare come CC nell'issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).
  
  * Questo arriverà più autonomamente nel tempo
  * Per molti dei team qui elencati, puoi chiedere di esservi aggiunto se interessato 
    * Alcuni sono WG con qualche processo per l'aggiunta di nuove persone, altri sono lì solo per le notifiche

* Quando una discussione si anima, puoi chiedere agli altri Collaboratori di tenerla d'occhio aprendo un issue nel repository privato [nodejs/moderation](https://github.com/nodejs/moderation).
  
  * Questo è un repository a cui tutti i membri dell'organizzazione `nodejs` di GitHub (non solo i Collaboratori del Node.js core) hanno accesso. I suoi contenuti non dovrebbero essere condivisi esternamente.
  * Puoi trovare la completa moderation policy [qui](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisione delle PR

* L'obiettivo principale è quello di migliorare la codebase.
* Secondario (ma non per importanza) è che la persona che invia il codice abbia successo. Una pull request da parte di un nuovo contributor è un'opportunità per far crescere la community.
* Revisionare un pò alla volta. Senza appesantire troppo i nuovi contributors. 
  * Si tende a micro-ottimizzare. Non cascarci. V8 viene modificato spesso. Le tecniche che oggi offrono prestazioni migliori in futuro potrebbero non essere necessarie.
* Siate consapevoli: la vostra opinione è molto importante!
* I Nits (le request di piccole modifiche che non sono essenziali) vanno bene, ma cerca di evitare che una pull request venga bloccata. 
  * Da notare che sono dei nits quando si commenta: `Nit: change foo() to bar().`
  * Se bloccano le pull request, correggili direttamente nella fase di merge (unione).
* Nella misura del possibile, gli issue dovrebbero essere identificati dagli strumenti piuttosto che dai revisori umani. Se lasci dei commenti riguardo degli issue che potrebbero essere identificati dagli strumenti ma non vengono identificati, prendi in considerazione l'implementazione degli strumenti necessari.
* Attesa minima per i commenti 
  * C'è un tempo di attesa minimo che cerchiamo di rispettare per le modifiche significative in modo che le persone che possono avere un input importante in un progetto così distribuito siano in grado di rispondere.
  * Per le modifiche significative, lascia aperta la pull request per almeno 48 ore (72 ore nel weekend).
  * Se una pull request viene abbandonata, prima di prenderla chiedere ai creatori se è un problema (soprattutto se è rimasta solo con dei nits).

* Approvare una modifica
  
  * I Collaboratori indicano di aver revisionato ed approvato le modifiche in una pull request utilizzando l'interfaccia di approvazione di Github
  * Ad alcune persone piace commentare con `LGTM` ("A me sembra buono")
  * Hai l'autorità per approvare il lavoro di qualsiasi altro collaboratore.
  * Non puoi approvare le tue stesse pull request.
  * Quando si utilizzano esplicitamente `Changes requested` (modifiche richieste) mostra empatia - in genere i commenti vengono presi in considerazione anche se non lo si usa. 
    * Se lo fai, è carino che tu sia in seguito disponibile per controllare se i tuoi commenti sono stati presi in considerazione
    * Se noti che le modifiche richieste sono state fatte, puoi cancellare la revisione `Changes requested` di un altro collaborator.
    * Utilizza `Changes requested` per indicare che stai prendendo in considerazione alcuni dei tuoi commenti per bloccare l'accettazione (landing) di una PR.

* Ciò che fa parte di Node.js:
  
  * Le opinioni variano - è bello avere una vasta base di collaboratori per questo motivo!
  * Se Node.js stesso ne ha bisogno (a causa di ragioni storiche), allora fa parte di Node.js. 
    * Nel senso che, `url` è presente a causa di `http`, `freelist` è presente a causa di `http`, ecc.
  * Le cose che non possono essere svolte al di fuori del core, se non solo con una fatica significativa come ad esempio gli `async_hooks`.

* Continuous Integration (CI) Testing:
  
  * <https://ci.nodejs.org/> 
    * Non viene eseguita automaticamente. È necessario avviarla manualmente.
  * L'acceso alla CI è integrato con GitHub. Prova ad accedere ora!
  * La maggior parte delle volte utilizzerai `node-test-pull-request`. Vacci subito! 
    * Considera di inserirlo tra i preferiti: https://ci.nodejs.org/job/node-test-pull-request/
  * Per accedere al modulo da compilare per iniziare un lavoro, clicca su `Build with Parameters`. (Se non lo vedi, probabilmente significa che non hai effettuato l'accesso) Cliccalo ora!
  * Per avviare il CI testing da questa schermata, è necessario compilare due elementi nel modulo: 
    * La casella `CERTIFY_SAFE` deve essere selezionata. Selezionandola, stai indicando che hai revisionato il codice che stai per testare e sei sicuro che non contenga alcun codice maligno. (Non vogliamo che le persone dirottino i nostri host di CI per attaccare altri host su internet, ad esempio!)
    * La casella `PR_ID` deve essere compilata con il numero che identifica la pull request contenente il codice che desideri testare. Ad esempio, se l'URL per la pull request è `https://github.com/nodejs/node/issues/7006`, allora inserisci `7006` all'interno di `PR_ID`.
    * Gli elementi rimanenti nel modulo in genere rimangono invariati ad eccezione di `POST_STATUS_TO_PR`. Selezionarlo se si desidera che venga automaticamente inserito nella PR un indicatore di stato della CI.
  * Se hai bisogno di altro aiuto in relazione alla CI: 
    * Utilizza #node-dev (IRC) per parlare con altri Collaboratori.
    * Utilizza #node-build (IRC) per parlare con i membri del Build WG che gestiscono l'infrastruttura della CI.
    * Utilizza il [repository Build WG](https://github.com/nodejs/build) per i file issue per i membri del Build WG che gestiscono l'infrastruttura della CI.

## Conferma delle PR

Vedi la Guida per i Collaboratori: [Confermare le Pull Request](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests).

Si noti che in una PR i commit che appartengono ad una modifica logica dovrebbero essere compressi. Accade raramente negli esercizi di onboarding, quindi deve essere indicato separatamente durante l'onboarding stesso.

<!-- TODO(joyeechueng): provide examples about "one logical change" -->

## Esercizio: Fai una PR aggiungendoti al README

* Esempio: <https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0> 
  * Per commit message non elaborato: `git log ce986de829457c39257cd205067602e765768fb0
-1`
* I Collaboratori sono in ordine alfabetico in base allo username di GitHub.
* Facoltativamente, includi i tuoi pronomi personali.
* Etichetta la tua pull request con l'etichetta del sottosistema `doc`.
* Esegui la CI sulla PR. Poiché la PR non influenza alcun codice, utilizza la CI task `node-test-pull-request-lite`. In alternativa, utilizza la solita CI task `node-test-pull-request` e annullala dopo che il linter e l'altra task secondaria sono stati passati.
* Dopo una o due approvazioni, conferma la PR (le PR di questo tipo non necessitano di attendere 48/72 ore per essere confermate). 
  * Assicurati di aggiungere `PR-URL: <full-pr-url>` e il metadato `Reviewed-By:` appropriato.
  * [`node-core-utils`][] automatizza la generazione dei metadati e il processo di conferma (landing). Vedi la documentazione di [`git-node`][].
  * [`core-validate-commit`][] automatizza la convalida dei commit message. Questo verrà eseguito durante `git node land --final` del comando [`git-node`][].

## Note finali

* Non preoccuparti di commette qualche errore: tutti li fanno, c'è molto da interiorizzare/assimilare e ci vuole tempo (e ne siamo consapevoli!)
* Quasi ogni errore che potresti fare può essere corretto o ripristinato.
* I Collaboratori attuali si fidano di te e ti sono grati per l'aiuto che dai!
* Altri repository: 
  * <https://github.com/nodejs/TSC>
  * <https://github.com/nodejs/build>
  * <https://github.com/nodejs/nodejs.org>
  * <https://github.com/nodejs/readable-stream>
  * <https://github.com/nodejs/LTS>
  * <https://github.com/nodejs/citgm>
* La Node.js Foundation ospita regolarmente summit per contribuire attivamente al progetto Node.js, dove abbiamo discussioni faccia a faccia riguardo il nostro lavoro svolto sul progetto. La Foundation ha fondi di viaggio per coprire le spese dei partecipanti, inclusi alloggio, trasporto, tasse sui visti, ecc. se necessario. Consulta il repository [summit](https://github.com/nodejs/summit) per i dettagli.