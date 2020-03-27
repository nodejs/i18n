# Incorporación

Este documento es un resumen de las cosas que contamos a los nuevos Colaboradores en su sesión de incorporación.

## Una semana antes de la sesión de incorporación

* If the new Collaborator is not yet a member of the nodejs GitHub organization, confirm that they are using [two-factor authentication](https://help.github.com/articles/securing-your-account-with-two-factor-authentication-2fa/). It will not be possible to add them to the organization if they are not using two-factor authentication. If they cannot receive SMS messages from GitHub, try [using a TOTP mobile app](https://help.github.com/articles/configuring-two-factor-authentication-via-a-totp-mobile-app/).
* Announce the accepted nomination in a TSC meeting and in the TSC mailing list.
* Suggest the new Collaborator install [`node-core-utils`][] and [set up the credentials](https://github.com/nodejs/node-core-utils#setting-up-credentials) for it.

## Quince minutos antes de la sesión de incorporación

* Prior to the onboarding session, add the new Collaborator to [the Collaborators team](https://github.com/orgs/nodejs/teams/collaborators).
* Pregúnteles si quieren unirse a algún equipo de subsistema. See [Who to CC in the issue tracker](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).

## Sesión de incorporación

* Esta sesión cubrirá:
  * [configuración local](#local-setup)
  * [objetivos y valores del proyecto](#project-goals--values)
  * [gestionar el rastreador de problemas](#managing-the-issue-tracker)
  * [revisar las PRs](#reviewing-prs)
  * [aterrizar las PRs](#landing-prs)

## Configuración local

* git:
  * Asegúrese de tener espacio en blanco=corregir: `git config --global --add
apply.whitespace fix`
  * Siempre continuar el PR desde su propia bifurcación de GitHub
    * Las ramas en el repositorio `nodejs/node` solo son para las líneas de lanzamiento
  * Add the canonical nodejs repository as `upstream` remote:
    * `git remote add upstream git://github.com/nodejs/node.git`
  * To update from `upstream`:
    * `git checkout master`
    * `git remote update -p` OR `git fetch --all`
    * `git merge --ff-only upstream/master` (or `REMOTENAME/BRANCH`)
  * Haga una nueva rama para cada PR que envíe.
  * Membership: Consider making your membership in the Node.js GitHub organization public. Esto facilita la identificación de los Colaboradores. Instructions on how to do that are available at [Publicizing or hiding organization membership](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

* Notificaciones:
  * Use [https://github.com/notifications](https://github.com/notifications) or set up email
  * Watching the main repo will flood your inbox (several hundred notifications on typical weekdays), so be prepared

* `#node-dev` on [webchat.freenode.net](https://webchat.freenode.net/) is the best place to interact with the TSC / other Collaborators
  * Si hay alguna pregunta después de la sesión, ¡ese es un buen lugar para preguntar!
  * Presence is not mandatory, but please drop a note there if force-pushing to `master`

## Objetivos y valores del proyecto

* Los colaboradores son los propietarios colectivos del proyecto
  * El proyecto tiene los objetivos de sus colaboradores

* Hay algunos objetivos y valores de alto nivel
  * La empatía hacia los usuarios es importante (esto es en parte el motivo por el que incorporamos personas)
  * En general: ¡trata de ser amable con la gente!
  * The best outcome is for people who come to our issue tracker to feel like they can come back again.

* You are expected to follow *and* hold others accountable to the [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

## Gestionar el rastreador de problemas

* You have (mostly) free rein; don't hesitate to close an issue if you are confident that it should be closed
  * ¡Sea amable con los problemas de cierre! Let people know why, and that issues and PRs can be reopened if necessary

* [**Vea "Etiquetas"**](./onboarding-extras.md#labels)
  * There is [a bot](https://github.com/nodejs-github-bot/github-bot) that applies subsystem labels (for example, `doc`, `test`, `assert`, or `buffer`) so that we know what parts of the code base the pull request modifies. It is not perfect, of course. Feel free to apply relevant labels and remove irrelevant labels from pull requests and issues.
  * `semver-{minor,major}`:
    * If a change has the remote *chance* of breaking something, use the `semver-major` label
    * When adding a `semver-*` label, add a comment explaining why you're adding it. ¡Hágalo de inmediato para que no lo olvide!
  * Please add the [`author-ready`][] label for PRs, if applicable.

* Consulte [A quien CC en el sistema de seguimiento de incidentes](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).
  * Esto saldrá más naturalmente con el tiempo
  * For many of the teams listed there, you can ask to be added if you are interested
    * Some are WGs with some process around adding people, others are only there for notifications

* When a discussion gets heated, you can request that other Collaborators keep an eye on it by opening an issue at the private [nodejs/moderation](https://github.com/nodejs/moderation) repository.
  * This is a repository to which all members of the `nodejs` GitHub organization (not just Collaborators on Node.js core) have access. Its contents should not be shared externally.
  * You can find the full moderation policy [here](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisión de las PRs

* El objetivo principal es mejorar la base del código.
* El secundario (pero no menos importante) es que la persona que envía el código tenga éxito. A pull request from a new contributor is an opportunity to grow the community.
* Revise un poco a la vez. No abrume a los nuevos contribuyentes.
  * Es tentador micro-optimizar. No sucumba a esa tentación. We change V8 often. Techniques that provide improved performance today may be unnecessary in the future.
* Tenga en cuenta: ¡Su opinión tiene mucho peso!
* Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request.
  * Identify them as nits when you comment: `Nit: change foo() to bar().`
  * Si están deteniendo la pull request, corríjalos usted mismo en la fusión.
* Insofar as possible, issues should be identified by tools rather than human reviewers. If you are leaving comments about issues that could be identified by tools but are not, consider implementing the necessary tooling.
* Tiempo mínimo de espera para comentarios
  * There is a minimum waiting time which we try to respect for non-trivial changes so that people who may have important input in such a distributed project are able to respond.
  * For non-trivial changes, leave the pull request open for at least 48 hours.
  * Si se abandona una pull request, verifique si les importaría que la tomara (especialmente si solo le quedan nits).
* Aprobar un cambio
  * Collaborators indicate that they have reviewed and approve of the changes in a pull request using GitHub’s approval interface
  * A algunas personas les gusta comentar `LGTM` (“Suena bien para mí" en inglés)
  * Usted tiene la autoridad para aprobar el trabajo de cualquier otro colaborador.
  * No puede aprobar sus propias pull requests.
  * Cuando se use explícitamente `Changes requested`, muestre empatía – los comentarios generalmente se abordarán incluso si no lo usa.
    * Si lo hace, es bueno que esté disponible más adelante para verificar si se han abordado sus comentarios
    * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
    * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

* Qué pertenece en Node.js:
  * Las opiniones varían – ¡es bueno tener una amplia base de colaboradores por ese motivo!
  * If Node.js itself needs it (due to historical reasons), then it belongs in Node.js.
    * That is to say, `url` is there because of `http`, `freelist` is there because of `http`, etc.
  * Things that cannot be done outside of core, or only with significant pain such as `async_hooks`.

* Pruebas de Integración Continua (CI):
  * [https://ci.nodejs.org/](https://ci.nodejs.org/)
    * No se ejecuta automáticamente. Necesita iniciarlo manualmente.
  * El inicio de sesión en CI está integrado con GitHub. Intente iniciar sesión ahora!
  * Utilizará `node-test-pull-request` la mayor parte del tiempo. ¡Vaya allí ahora!
    * Considere marcarlo como favorito: https://ci.nodejs.org/job/node-test-pull-request/
  * Para acceder al formulario para iniciar un trabajo, haga clic en `Build with Parameters`. (If you don't see it, that probably means you are not logged in!) Click it now!
  * To start CI testing from this screen, you need to fill in two elements on the form:
    * La casilla `CERTIFY_SAFE` debe estar marcada. By checking it, you are indicating that you have reviewed the code you are about to test and you are confident that it does not contain any malicious code. (We don't want people hijacking our CI hosts to attack other hosts on the internet, for example!)
    * The `PR_ID` box should be filled in with the number identifying the pull request containing the code you wish to test. For example, if the URL for the pull request is `https://github.com/nodejs/node/issues/7006`, then put `7006` in the `PR_ID`.
    * The remaining elements on the form are typically unchanged.
  * Si necesita ayuda con algo relacionado con CI:
    * Use #node-dev (IRC) para hablar con otros Colaboradores.
    * Use #node-build (IRC) to talk to the Build WG members who maintain the CI infrastructure.
    * Use the [Build WG repo](https://github.com/nodejs/build) to file issues for the Build WG members who maintain the CI infrastructure.

## Aterrizar PRs

Consulte la Guía del Colaborador: [Aterrizar Pull Requests](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests).

Commits in one PR that belong to one logical change should be squashed. It is rarely the case in onboarding exercises, so this needs to be pointed out separately during the onboarding.

<!-- TODO(joyeechueng): provide examples about "one logical change" -->

## Ejercicio: Haga una PR añadiéndose a usted mismo al README

* Example: https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0
  * Para el mensaje de commit sin procesar: `git log ce986de829457c39257cd205067602e765768fb0
-1`
* Los colaboradores están en orden alfabético por nombre de usuario de GitHub.
* Opcionalmente, incluya sus pronombres personales.
* Label your pull request with the `doc`, `notable-change`, and `fast-track` labels.
* Ejecute CI en el PR. Because the PR does not affect any code, use the `node-test-pull-request-lite-pipeline` CI task.
* After two Collaborator approvals for the change and two Collaborator approvals for fast-tracking, land the PR.
  * Be sure to add the `PR-URL: <full-pr-url>` and appropriate `Reviewed-By:` metadata.
  * [`node-core-utils`][] automates the generation of metadata and the landing process. Consulte la documentación de [`git-node`][].
  * [`core-validate-commit`][] automatiza la validación de mensajes de commit. This will be run during `git node land --final` of the [`git-node`][] command.

## Notas finales

* Don't worry about making mistakes: everybody makes them, there's a lot to internalize and that takes time (and we recognize that!)
* Casi cualquier error que pueda cometer puede ser arreglado o revertido.
* ¡Los Colaboradores existentes confían en usted y están agradecidos por su ayuda!
* Otros repositorios:
  * [https://github.com/nodejs/TSC](https://github.com/nodejs/TSC)
  * [https://github.com/nodejs/build](https://github.com/nodejs/build)
  * [https://github.com/nodejs/nodejs.org](https://github.com/nodejs/nodejs.org)
  * [https://github.com/nodejs/readable-stream](https://github.com/nodejs/readable-stream)
  * [https://github.com/nodejs/LTS](https://github.com/nodejs/LTS)
  * [https://github.com/nodejs/citgm](https://github.com/nodejs/citgm)
* The Node.js Foundation hosts regular summits for active contributors to the Node.js project, where we have face-to-face discussions about our work on the project. The Foundation has travel funds to cover participants' expenses including accommodations, transportation, visa fees, etc. si es necesario. Check out the [summit](https://github.com/nodejs/summit) repository for details.
