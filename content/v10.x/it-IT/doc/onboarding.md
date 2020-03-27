# Onboarding

Questo documento è una descrizione delle cose che vengono dette ai nuovi Collaboratori durante la sessione di onboarding.

## Una settimana prima della sessione di onboarding

* If the new Collaborator is not yet a member of the nodejs GitHub organization, confirm that they are using [two-factor authentication](https://help.github.com/articles/securing-your-account-with-two-factor-authentication-2fa/). It will not be possible to add them to the organization if they are not using two-factor authentication. If they cannot receive SMS messages from GitHub, try [using a TOTP mobile app](https://help.github.com/articles/configuring-two-factor-authentication-via-a-totp-mobile-app/).
* Announce the accepted nomination in a TSC meeting and in the TSC mailing list.
* Suggest the new Collaborator install [`node-core-utils`][] and [set up the credentials](https://github.com/nodejs/node-core-utils#setting-up-credentials) for it.

## Quindici minuti prima della sessione di onboarding

* Prior to the onboarding session, add the new Collaborator to [the Collaborators team](https://github.com/orgs/nodejs/teams/collaborators).
* Ask them if they want to join any subsystem teams. See [Who to CC in the issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).

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
  * Add the canonical nodejs repository as `upstream` remote:
    * `git remote add upstream git://github.com/nodejs/node.git`
  * To update from `upstream`:
    * `git checkout master`
    * `git remote update -p` OR `git fetch --all`
    * `git merge --ff-only upstream/master` (or `REMOTENAME/BRANCH`)
  * Crea un nuovo branch per ogni PR che invii.
  * Membership: Consider making your membership in the Node.js GitHub organization public. Ciò semplifica l'identificazione dei Collaboratori. Instructions on how to do that are available at [Publicizing or hiding organization membership](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

* Notifiche:
  * Utilizza [https://github.com/notifications](https://github.com/notifications) oppure imposta una email
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

* You are expected to follow *and* hold others accountable to the [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

## Gestione dell'issue tracker

* Hai (per lo più) libertà di azione; non esitare a chiudere un issue se sei sicuro che debba essere chiuso
  * Sii moderato nella chiusura degli issue! Fai sapere alle persone il perché della chiusura, e che gli issue e le PR possono essere riaperti se necessario

* [**Vedi "Etichette"**](./onboarding-extras.md#labels)
  * C'è [un bot](https://github.com/nodejs-github-bot/github-bot) che applica le etichette del sottosistema (ad esempio, `doc`, `test`, `assert`, o `buffer`) in modo da sapere quali parti della code base sono modificate dalla pull request. Non è perfetto, ovviamente. Sentiti libero di applicare etichette pertinenti e di rimuovere quelle irrilevanti dalle pull request o dagli issue.
  * Utilizza l'etichetta `tsc-review` se un argomento è controverso o non giunge ad una conclusione dopo un periodo di tempo prolungato.
  * `semver-{minor,major}`:
    * If a change has the remote *chance* of breaking something, use the `semver-major` label
    * When adding a `semver-*` label, add a comment explaining why you're adding it. Fallo subito così non te ne dimentichi!
  * Please add the [`author-ready`][] label for PRs, if applicable.

* Vedi [Chi indicare come CC nell'issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).
  * Questo arriverà più autonomamente nel tempo
  * Per molti dei team qui elencati, puoi chiedere di esservi aggiunto se interessato
    * Alcuni sono WG con qualche processo per l'aggiunta di nuove persone, altri sono lì solo per le notifiche

* Quando una discussione si anima, puoi chiedere agli altri Collaboratori di tenerla d'occhio aprendo un issue nel repository privato [nodejs/moderation](https://github.com/nodejs/moderation).
  * Questo è un repository a cui tutti i membri dell'organizzazione `nodejs` di GitHub (non solo i Collaboratori del Node.js core) hanno accesso. I suoi contenuti non dovrebbero essere condivisi esternamente.
  * Puoi trovare la completa moderation policy [qui](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisione delle PR

* L'obiettivo principale è quello di migliorare la codebase.
* Secondario (ma non per importanza) è che la persona che invia il codice abbia successo. A pull request from a new contributor is an opportunity to grow the community.
* Revisionare un pò alla volta. Non sovraccaricare i nuovi contributors.
  * Si tende a micro-ottimizzare. Non cascarci. V8 viene modificato spesso. Le tecniche che oggi offrono prestazioni migliori in futuro potrebbero non essere necessarie.
* Siate consapevoli: la vostra opinione è molto importante!
* Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request.
  * Da notare che sono dei nits quando si commenta: `Nit: change foo() to bar().`
  * Se bloccano le pull request, correggili direttamente nella fase di merge (unione).
* Insofar as possible, issues should be identified by tools rather than human reviewers. If you are leaving comments about issues that could be identified by tools but are not, consider implementing the necessary tooling.
* Attesa minima per i commenti
  * C'è un tempo di attesa minimo che cerchiamo di rispettare per le modifiche significative in modo che le persone che possono avere un input importante in un progetto così distribuito siano in grado di rispondere.
  * For non-trivial changes, leave the pull request open for at least 48 hours.
  * Se una pull request viene abbandonata, prima di prenderla chiedere ai creatori se è un problema (soprattutto se è rimasta solo con dei nits).
* Approvare una modifica
  * Collaborators indicate that they have reviewed and approve of the changes in a pull request using GitHub’s approval interface
  * Ad alcune persone piace commentare con `LGTM` ("A me sembra buono")
  * Hai l'autorità per approvare il lavoro di qualsiasi altro collaboratore.
  * Non puoi approvare le tue stesse pull request.
  * Quando si utilizzano esplicitamente `Changes requested` (modifiche richieste) mostra empatia - in genere i commenti vengono presi in considerazione anche se non lo si usa.
    * Se lo fai, è carino che tu sia in seguito disponibile per controllare se i tuoi commenti sono stati presi in considerazione
    * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
    * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

* Ciò che fa parte di Node.js:
  * Le opinioni variano - è bello avere una vasta base di collaboratori per questo motivo!
  * If Node.js itself needs it (due to historical reasons), then it belongs in Node.js.
    * Nel senso che, `url` è presente a causa di `http`, `freelist` è presente a causa di `http`, ecc.
  * Things that cannot be done outside of core, or only with significant pain such as `async_hooks`.

* Continuous Integration (CI) Testing:
  * [https://ci.nodejs.org/](https://ci.nodejs.org/)
    * Non viene eseguita automaticamente. È necessario avviarla manualmente.
  * L'acceso alla CI è integrato con GitHub. Prova ad accedere ora!
  * La maggior parte delle volte utilizzerai `node-test-pull-request`. Vacci subito!
    * Considera di inserirlo tra i preferiti: https://ci.nodejs.org/job/node-test-pull-request/
  * Per accedere al modulo da compilare per iniziare un lavoro, clicca su `Build with Parameters`. (Se non lo vedi, probabilmente significa che non hai effettuato l'accesso) Cliccalo ora!
  * To start CI testing from this screen, you need to fill in two elements on the form:
    * La casella `CERTIFY_SAFE` deve essere selezionata. By checking it, you are indicating that you have reviewed the code you are about to test and you are confident that it does not contain any malicious code. (We don't want people hijacking our CI hosts to attack other hosts on the internet, for example!)
    * The `PR_ID` box should be filled in with the number identifying the pull request containing the code you wish to test. For example, if the URL for the pull request is `https://github.com/nodejs/node/issues/7006`, then put `7006` in the `PR_ID`.
    * The remaining elements on the form are typically unchanged.
  * Se hai bisogno di altro aiuto in relazione alla CI:
    * Utilizza #node-dev (IRC) per parlare con altri Collaboratori.
    * Use #node-build (IRC) to talk to the Build WG members who maintain the CI infrastructure.
    * Use the [Build WG repo](https://github.com/nodejs/build) to file issues for the Build WG members who maintain the CI infrastructure.

## Conferma delle PR

Vedi la Guida per i Collaboratori: [Confermare le Pull Request](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests).

Si noti che in una PR i commit che appartengono ad una modifica logica dovrebbero essere compressi. Accade raramente negli esercizi di onboarding, quindi deve essere indicato separatamente durante l'onboarding stesso.

<!-- TODO(joyeechueng): provide examples about "one logical change" -->

## Esercizio: Fai una PR aggiungendoti al README

* Example: https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0
  * Per commit message non elaborato: `git log ce986de829457c39257cd205067602e765768fb0
-1`
* I Collaboratori sono in ordine alfabetico in base allo username di GitHub.
* Facoltativamente, includi i tuoi pronomi personali.
* Label your pull request with the `doc`, `notable-change`, and `fast-track` labels.
* Run CI on the PR. Because the PR does not affect any code, use the `node-test-pull-request-lite-pipeline` CI task.
* After two Collaborator approvals for the change and two Collaborator approvals for fast-tracking, land the PR.
  * Assicurati di aggiungere `PR-URL: <full-pr-url>` e il metadato `Reviewed-By:` appropriato.
  * [`node-core-utils`][] automatizza la generazione dei metadati e il processo di conferma (landing). Vedi la documentazione di [`git-node`][].
  * [`core-validate-commit`][] automatizza la convalida dei commit message. Questo verrà eseguito durante `git node land --final` del comando [`git-node`][].

## Note finali

* Don't worry about making mistakes: everybody makes them, there's a lot to internalize and that takes time (and we recognize that!)
* Quasi ogni errore che potresti fare può essere corretto o ripristinato.
* I Collaboratori attuali si fidano di te e ti sono grati per l'aiuto che dai!
* Altri repository:
  * [https://github.com/nodejs/TSC](https://github.com/nodejs/TSC)
  * [https://github.com/nodejs/build](https://github.com/nodejs/build)
  * [https://github.com/nodejs/nodejs.org](https://github.com/nodejs/nodejs.org)
  * [https://github.com/nodejs/readable-stream](https://github.com/nodejs/readable-stream)
  * [https://github.com/nodejs/LTS](https://github.com/nodejs/LTS)
  * [https://github.com/nodejs/citgm](https://github.com/nodejs/citgm)
* La Node.js Foundation ospita regolarmente summit per contribuire attivamente al progetto Node.js, dove abbiamo discussioni faccia a faccia riguardo il nostro lavoro svolto sul progetto. La Foundation ha fondi di viaggio per coprire le spese dei partecipanti, inclusi alloggio, trasporto, tasse sui visti, ecc. se necessario. Consulta il repository [summit](https://github.com/nodejs/summit) per i dettagli.
