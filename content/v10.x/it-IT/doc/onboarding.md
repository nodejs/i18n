# Onboarding

Questo documento è una descrizione delle cose che vengono dette ai nuovi Collaboratori durante la sessione di onboarding.

## Una settimana prima della sessione di onboarding

* Se il nuovo Collaboratore non è ancora membro dell'organizzazione GitHub di nodejs, confermare l'utilizzo dell'[autenticazione a due fattori](https://help.github.com/articles/securing-your-account-with-two-factor-authentication-2fa/). Non sarà possibile aggiungere nuovi collaboratori all'organizzazione se non utilizzano l'autenticazione a due fattori. Se non riescono a ricevere messaggi SMS da GitHub, provare [l'utilizzo di un'app mobile TOTP](https://help.github.com/articles/configuring-two-factor-authentication-via-a-totp-mobile-app/).
* Annunciare la nomination accettata in un meeting TSC e nella mailing list TSC.
* Suggerire al nuovo Collaboratore l'installazione di [`node-core-utils`][] e [le impostazioni per le credenziali](https://github.com/nodejs/node-core-utils#setting-up-credentials) di quest'ultimo.

## Quindici minuti prima della sessione di onboarding

* Prima della sessione di onboarding, aggiungere il nuovo Collaboratore al [team dei Collaboratori](https://github.com/orgs/nodejs/teams/collaborators).
* Chiedere ai nuovi collaboratori se vogliono unirsi a qualsiasi team del sottosistema. Vedi [Chi per CC nell'issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).

## Sessione di Onboarding

* Questa sessione coprirà: 
  * [la configurazione locale](#local-setup)
  * [gli obiettivi & i valori del progetto](#project-goals--values)
  * [la gestione dell'issue tracker](#managing-the-issue-tracker)
  * [la revisione delle PR](#reviewing-prs)
  * [la conferma delle PR](#landing-prs)

## La configurazione locale

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
  
  * Se dopo la sessione ci sono delle domande, questo è il luogo adatto per farle!
  * La presenza non è obbligatoria, ma si prega di lasciare una nota se la si vuole far arrivare a `master`

## Gli obiettivi & i valori del progetto

* I Collaboratori sono i proprietari collettivi del progetto
  
  * Il progetto ha gli obiettivi dei suoi contributor

* Ci sono alcuni obiettivi e valori di livello superiore
  
  * L'empatia nei confronti degli utenti è importante (questo è in parte il motivo per cui permettiamo l'onboarding di nuove persone)
  * In generale: cerca di essere gentile con le persone!
  * Il miglior risultato è quando le persone che vengono nel nostro issue tracker se ne vanno sentendosi tranquille di poter tornare di nuovo.

* Dovresti seguire *e* ritenere gli altri responsabili verso il [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

## La gestione dell'issue tracker

* Hai (soprattutto) libero sfogo; non esitare a chiudere un problema se sei sicuro che questo andrebbe chiuso
  
  * Sii gentile con i problemi chiusi! Fai sapere alla gente i motivi, i problemi e le PR possono essere riaperti se necessario

* [**Vedi "Etichette"**](./onboarding-extras.md#labels)
  
  * C'è [un bot](https://github.com/nodejs-github-bot/github-bot) che applica le etichette del sottosistema (per esempio,`doc`, `test`, `assert`, o `buffer`) in modo da sapere quali parti del codice sono la base della modifica del Pr. Non è perfetto, ovviamente. Sii libero di applicare etichette pertinenti e rimuovere etichette irrilevanti da problemi e le Pr.
  * Utilizza l'etichetta ` tsc-review ` se un argomento è controverso o non è stato concluso dopo un tempo prolungato.
  * `semver-{minor,major}`: 
    * If a change has the remote *chance* of breaking something, use the `semver-major` label
    * Quando si aggiunge l'etichetta `semver-*` aggiungi un commento in cui spieghi perché la stai aggiungendo. Fallo subito così non lo dimentichi!
  * Si prega di aggiungere l'etichetta `author-ready` per PR dove: 
    * iC è stato avviato (non necessariamente terminato),
    * non esistono commenti di revisione rilevanti e
    * almeno un collaboratore ha approvato il PR.

* See [Who to CC in the issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).
  
  * Questo arriverà più sicuramente nel tempo
  * Per molte delle squadre elencate qui, puoi chiedere di essere aggiunto se sei interessato 
    * Alcuni WG sono con qualche processo di aggiunta di persone, altri sono solo lì per le notifiche

* Quando una discussione si anima, puoi chiedere agli altri Collaboratori di tenerlo d'occhio aprendo un problema in privato [nodejs/moderation](https://github.com/nodejs/moderation).
  
  * This is a repository to which all members of the `nodejs` GitHub organization (not just Collaborators on Node.js core) have access. I contenuti non dovrebbero essere condivisi esternamente.
  * Puoi trovare la politica di moderazione completa [qui](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisione di PR

* L'obiettivo principale è quello di migliorare la base di codici.
* Secondario (ma non per importanza) è per la persona che invia il codice per avere successo. Un Pr da un nuovo contributore è un'opportunità per far crescere la comunità.
* Ripassa un po 'alla volta. Non sovraccaricare i nuovi contributori. 
  * Si è tentati di micro-ottimizzare. Non cadere in quella tentazione. Noi cambiamo spesso il V8. Le tecniche che offrono prestazioni migliori oggi potrebbero essere inutili in futuro.
* Siate consapevoli: la vostra opinione è molto importante!
* Nits (richieste di piccole modifiche che non sono essenziali) vanno bene, ma provate a evitare di bloccare la Pr. 
  * Note that they are nits when you comment: `Nit: change foo() to bar().`
  * Se bloccano la Pr, correggili da solo.
* Nella misura del possibile, i problemi dovrebbero essere identificati da strumenti piuttosto che da revisori umani. Se si lasciano commenti su problemi che potrebbero essere identificati dagli strumenti ma non lo sono, prendete in considerazione l'implementazione degli strumenti necessari.
* Attesa minima dei commenti 
  * C'è un tempo di attesa minimo che cerchiamo di rispettare per i cambiamenti non banali in modo che le persone che possono avere un input importante in un progetto così distribuito siano in grado di rispondere.
  * Per modifiche non banali, lasciare aperta la Pr per almeno 48 ore (72 ore nel fine settimana).
  * If a pull request is abandoned, check if they'd mind if you took it over (especially if it just has nits left).

* Approvazione di un cambiamento
  
  * I collaboratori indicano di aver esaminato e approvato le modifiche in una Pr utilizzando l'interfaccia di approvazione di Github
  * Ad alcune persone piace commentare `LGTM` ("Sembra buono per me")
  * Hai l'autorità per approvare il lavoro di qualsiasi altro collaboratore.
  * Non puoi approvare le tue Pr.
  * Quando si utilizzano esplicitamente `le modifiche richieste`, mostrate empatia: i consigli saranno solitamente indirizzati anche se non li si usano. 
    * Se lo fai, è bello se sei disponibile in seguito per controllare se i tuoi consigli sono stati affrontati
    * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
    * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

* Ciò che appartiene a Node.js:
  
  * Le opinioni variano - è bello avere una vasta base di collaboratori per questo motivo!
  * Se Node.js ne ha bisogno (a causa di ragioni storiche), quindi appartiene a Node.js. 
    * Vale a dire, `url` è lì a causa di `http`, `freelist` è lì a causa di `http`, etc.
  * Things that cannot be done outside of core, or only with significant pain such as `async_hooks`.

* Continuous Integration (CI) Testing:
  
  * <https://ci.nodejs.org/> 
    * It is not automatically run. You need to start it manually.
  * Log in on CI is integrated with GitHub. Try to log in now!
  * You will be using `node-test-pull-request` most of the time. Go there now! 
    * Consider bookmarking it: https://ci.nodejs.org/job/node-test-pull-request/
  * To get to the form to start a job, click on `Build with Parameters`. (If you don't see it, that probably means you are not logged in!) Click it now!
  * To start CI testing from this screen, you need to fill in two elements on the form: 
    * The `CERTIFY_SAFE` box should be checked. By checking it, you are indicating that you have reviewed the code you are about to test and you are confident that it does not contain any malicious code. (We don't want people hijacking our CI hosts to attack other hosts on the internet, for example!)
    * The `PR_ID` box should be filled in with the number identifying the pull request containing the code you wish to test. For example, if the URL for the pull request is `https://github.com/nodejs/node/issues/7006`, then put `7006` in the `PR_ID`.
    * The remaining elements on the form are typically unchanged with the exception of `POST_STATUS_TO_PR`. Check that if you want a CI status indicator to be automatically inserted into the PR.
  * If you need help with something CI-related: 
    * Use #node-dev (IRC) to talk to other Collaborators.
    * Use #node-build (IRC) to talk to the Build WG members who maintain the CI infrastructure.
    * Use the [Build WG repo](https://github.com/nodejs/build) to file issues for the Build WG members who maintain the CI infrastructure.

## Landing PRs

See the Collaborator Guide: [Landing Pull Requests](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests).

Note that commits in one PR that belong to one logical change should be squashed. It is rarely the case in onboarding exercises, so this needs to be pointed out separately during the onboarding.

<!-- TODO(joyeechueng): provide examples about "one logical change" -->

## Exercise: Make a PR adding yourself to the README

* Esempio: <https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0> 
  * For raw commit message: `git log ce986de829457c39257cd205067602e765768fb0
-1`
* Collaborators are in alphabetical order by GitHub username.
* Optionally, include your personal pronouns.
* Label your pull request with the `doc` subsystem label.
* Run CI on the PR. Because the PR does not affect any code, use the `node-test-pull-request-lite` CI task. Alternatively, use the usual `node-test-pull-request` CI task and cancel it after the linter and one other subtask have passed.
* After one or two approvals, land the PR (PRs of this type do not need to wait for 48/72 hours to land). 
  * Be sure to add the `PR-URL: <full-pr-url>` and appropriate `Reviewed-By:` metadata.
  * [`node-core-utils`][] automates the generation of metadata and the landing process. See the documentation of [`git-node`][].
  * [`core-validate-commit`][] automates the validation of commit messages. This will be run during `git node land --final` of the [`git-node`][] command.

## Note finali

* Non preoccuparti di sbagliare: tutti li fanno, c'è molto da c'è molto da interiorizzare e ci vuole tempo (e lo riconosciamo!)
* Almost any mistake you could make can be fixed or reverted.
* I Collaboratori si fidano di te e sono grati per il tuo aiuto!
* Other repositories: 
  * <https://github.com/nodejs/TSC>
  * <https://github.com/nodejs/build>
  * <https://github.com/nodejs/nodejs.org>
  * <https://github.com/nodejs/readable-stream>
  * <https://github.com/nodejs/LTS>
  * <https://github.com/nodejs/citgm>
* The Node.js Foundation hosts regular summits for active contributors to the Node.js project, where we have face-to-face discussions about our work on the project. La Fondazione ha fondi di viaggio per coprire le spese dei partecipanti, inclusi alloggio, trasporto, tasse sui visti, ecc. se necessario. Check out the [summit](https://github.com/nodejs/summit) repository for details.