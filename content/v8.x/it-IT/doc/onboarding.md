# Onboarding

Questo documento è una descrizione delle cose che vengono dette ai nuovi Collaboratori durante la sessione di onboarding.

## Una settimana prima della sessione di onboarding

* Confirm that the new Collaborator is using two-factor authentication on their GitHub account. Unless two-factor authentication is enabled, do not give an account elevated privileges such as the ability to land code in the main repository or to start continuous integration (CI) jobs.

## Quindici minuti prima della sessione di onboarding

* Prior to the onboarding session, add the new Collaborator to [the Collaborators team](https://github.com/orgs/nodejs/teams/collaborators), and to [the Members team](https://github.com/orgs/nodejs/teams/members) if they are not already part of it. Note that this is the step that gives the account elevated privileges, so do not perform this step (or any subsequent steps) unless two-factor authentication is enabled on the new Collaborator's GitHub account.


## Sessione di Onboarding

* Questa sessione coprirà:
    * [la configurazione locale](#local-setup)
    * [gli obiettivi & i valori del progetto](#project-goals--values)
    * [la gestione dell'issue tracker](#managing-the-issue-tracker)
    * [la revisione delle PR](#reviewing-prs)
    * [la conferma delle PR](#landing-prs)

## Configurazione Locale

  * git:
    * Make sure you have whitespace=fix: `git config --global --add apply.whitespace fix`
    * Always continue to PR from your own github fork
      * I branch nel repository nodejs/node sono solo per le righe di rilascio
    * [See "Updating Node.js from Upstream"](./onboarding-extras.md#updating-nodejs-from-upstream)
    * Crea un nuovo branch per ogni PR che invii.
    * Membership: Consider making your membership in the Node.js GitHub organization public. Ciò semplifica l'identificazione dei Collaboratori. Instructions on how to do that are available at [Publicizing or hiding organization membership](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

  * Notifiche:
    * Use [https://github.com/notifications](https://github.com/notifications) or set up email
    * Watching the main repo will flood your inbox (several hundred notifications on typical weekdays), so be prepared

  * `#node-dev` on [webchat.freenode.net](https://webchat.freenode.net/) is the best place to interact with the TSC / other Collaborators
    * Se dopo la sessione ci sono delle domande, quello è il luogo adatto per farle!
    * Presence is not mandatory, but please drop a note there if force-pushing to `master`


## Obiettivi & valori del progetto

  * I Collaboratori sono i proprietari collettivi del progetto
    * Il progetto ha gli obiettivi dei suoi contributor

  * Ci sono alcuni obiettivi e valori di livello superiore
    * L'empatia nei confronti degli utenti è importante (questo è in parte il motivo per cui permettiamo l'onboarding di nuove persone)
    * In generale: cerca di essere gentile con le persone!
    * The best outcome is for people who come to our issue tracker to feel like they can come back again.

  * We have a [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md) that you are expected to follow *and* hold others accountable to

## Gestione dell'issue tracker

  * You have (mostly) free rein; don't hesitate to close an issue if you are confident that it should be closed
    * Sii moderato nella chiusura degli issue! Let people know why, and that issues and PRs can be reopened if necessary

  * [**Vedi "Etichette"**](./onboarding-extras.md#labels)
    * There is [a bot](https://github.com/nodejs-github-bot/github-bot) that applies subsystem labels (for example, `doc`, `test`, `assert`, or `buffer`) so that we know what parts of the code base the pull request modifies. It is not perfect, of course. Feel free to apply relevant labels and remove irrelevant labels from pull requests and issues.
    * Use the `tsc-review` label if a topic is controversial or isn't coming to a conclusion after an extended time.
    * `semver-{minor,major}`:
      * If a change has the remote *chance* of breaking something, use the `semver-major` label
      * When adding a semver label, add a comment explaining why you're adding it. Fallo subito così non te ne dimentichi!

  * [**See "Who to CC in issues"**](./onboarding-extras.md#who-to-cc-in-issues)
    * Questo arriverà più autonomamente nel tempo
    * For many of the teams listed there, you can ask to be added if you are interested
      * Some are WGs with some process around adding people, others are only there for notifications

  * When a discussion gets heated, you can request that other Collaborators keep an eye on it by opening an issue at the private [nodejs/moderation](https://github.com/nodejs/moderation) repository.
    * This is a repository to which all members of the `nodejs` GitHub organization (not just Collaborators on Node.js core) have access. Its contents should not be shared externally.
    * You can find the full moderation policy [here](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisione delle PR
  * L'obiettivo principale è quello di migliorare la codebase.
  * Secondario (ma non per importanza) è che la persona che invia il codice abbia successo. A pull request from a new contributor is an opportunity to grow the community.
  * Revisionare un pò alla volta. Non sovraccaricare i nuovi contributors.
    * It is tempting to micro-optimize and make everything about relative performance. Non cascarci. We change V8 often. Techniques that provide improved performance today may be unnecessary in the future.
  * Siate consapevoli: la vostra opinione è molto importante!
  * Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request.
    * Da notare che sono dei nits quando si commenta: `Nit: change foo() to bar().`
    * Se bloccano le pull request, correggili direttamente nella fase di merge (unione).
  * Attesa minima per i commenti
    * There is a minimum waiting time which we try to respect for non-trivial changes, so that people who may have important input in such a distributed project are able to respond.
    * For non-trivial changes, leave the pull request open for at least 48 hours (72 hours on a weekend).
    * If a pull request is abandoned, check if they'd mind if you took it over (especially if it just has nits left).
  * Approvare una modifica
    * Collaborators indicate that they have reviewed and approve of the changes in a pull request using Github’s approval interface
    * Ad alcune persone piace commentare con `LGTM` ("A me sembra buono")
    * Hai l'autorità per approvare il lavoro di qualsiasi altro collaboratore.
    * Non puoi approvare le tue stesse pull request.
    * Quando si utilizzano esplicitamente `Changes requested` (modifiche richieste) mostra empatia - in genere i commenti vengono presi in considerazione anche se non lo si usa.
      * Se lo fai, è carino che tu sia in seguito disponibile per controllare se i tuoi commenti sono stati presi in considerazione
      * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
      * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

  * Ciò che fa parte di Node.js:
    * Le opinioni variano - è bello avere una vasta base di collaboratori per questo motivo!
    * If Node.js itself needs it (due to historic reasons), then it belongs in Node.js
      * That is to say, url is there because of http, freelist is there because of http, etc.
    * Things that cannot be done outside of core, or only with significant pain (for example `async_hooks`)

  * Continuous Integration (CI) Testing:
    * [https://ci.nodejs.org/](https://ci.nodejs.org/)
      * Non viene eseguita automaticamente. È necessario avviarla manualmente.
    * L'acceso alla CI è integrato con GitHub. Prova ad accedere ora!
    * La maggior parte delle volte utilizzerai `node-test-pull-request`. Vacci subito!
      * Considera di inserirlo tra i preferiti: https://ci.nodejs.org/job/node-test-pull-request/
    * Per accedere al modulo da compilare per iniziare un lavoro, clicca su `Build with Parameters`. (If you don't see it, that probably means you are not logged in!) Click it now!
    * To start CI testing from this screen, you need to fill in two elements on the form:
      * La casella `CERTIFY_SAFE` deve essere selezionata. By checking it, you are indicating that you have reviewed the code you are about to test and you are confident that it does not contain any malicious code. (We don't want people hijacking our CI hosts to attack other hosts on the internet, for example!)
      * The `PR_ID` box should be filled in with the number identifying the pull request containing the code you wish to test. For example, if the URL for the pull request is `https://github.com/nodejs/node/issues/7006`, then put `7006` in the `PR_ID`.
      * The remaining elements on the form are typically unchanged with the exception of `POST_STATUS_TO_PR`. Check that if you want a CI status indicator to be automatically inserted into the PR.
    * Se hai bisogno di altro aiuto in relazione alla CI:
      * Utilizza #node-dev (IRC) per parlare con altri Collaboratori.
      * Use #node-build (IRC) to talk to the Build WG members who maintain the CI infrastructure.
      * Use the [Build WG repo](https://github.com/nodejs/build) to file issues for the Build WG members who maintain the CI infrastructure.


## Conferma delle PR

  * [See the Collaborator Guide: Landing Pull Requests](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests)

## Esercizio: Fai una PR aggiungendoti al README

  * Example: [https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0](https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0)
    * For raw commit message: `git log ce986de829457c39257cd205067602e765768fb0 -1`
  * I Collaboratori sono in ordine alfabetico in base allo username di GitHub.
  * Facoltativamente, includi i tuoi pronomi personali.
  * Etichetta la tua pull request con l'etichetta del sottosistema `doc`.
  * Run CI on your PR.
  * After one or two approvals, land the PR.
    * Be sure to add the `PR-URL: <full-pr-url>` and appropriate `Reviewed-By:` metadata!
    * [`core-validate-commit`][] helps a lot with this – install and use it if you can!
    * [`node-core-utils`][] fetches the metadata for you.

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
  * The Node.js Foundation hosts regular summits for active contributors to the Node.js project, where we have face-to-face discussion about our work on the project. The foundation has travel funds to cover participants' expenses including accommodation, transportation, visa fees etc. se necessario. Check out the [summit](https://github.com/nodejs/summit) repository for details.
