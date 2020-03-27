# Incorporación

This document is an outline of the things we tell new Collaborators at their onboarding session.

## Una semana antes de la sesión de orientación

* If the new Collaborator is not yet a member of the nodejs GitHub organization, confirm that they are using [two-factor authentication](https://help.github.com/articles/securing-your-account-with-two-factor-authentication-2fa/). It will not be possible to add them to the organization if they are not using two-factor authentication. If they cannot receive SMS messages from GitHub, try [using a TOTP mobile app](https://help.github.com/articles/configuring-two-factor-authentication-via-a-totp-mobile-app/).
* Announce the accepted nomination in a TSC meeting and in the TSC mailing list.
* Suggest the new Collaborator install [`node-core-utils`][] and [set up the credentials](https://github.com/nodejs/node-core-utils#setting-up-credentials) for it.

## Quince minutos antes de la sesión de orientación

* Prior to the onboarding session, add the new Collaborator to [the Collaborators team](https://github.com/orgs/nodejs/teams/collaborators).
* Pregúnteles si quieren unirse a algún equipo de subsistema. Consulte [A quien CC en el sistema de seguimiento de incidentes](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).

## Sesión de orientación

* Esta sesión cubrirá: 
  * [configuración local](#local-setup)
  * [objetivos & valores del proyecto](#project-goals--values)
  * [gestionar el rastreador de problemas](#managing-the-issue-tracker)
  * [revisión de PRs](#reviewing-prs)
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
  
  * Use <https://github.com/notifications> o configure el correo electrónico
  * Ver el repositorio principal inundará su bandeja de entrada (varios cientos de notificaciones en los días hábiles típicos), así que prepárese

* `#node-dev` en [webchat.freenode.net](https://webchat.freenode.net/) es el mejor lugar para interactuar con el TSC/otros colaboradores
  
  * Si hay alguna pregunta después de la sesión, ¡un buen lugar para preguntar es ahí!
  * La presencia no es obligatoria, pero deje una nota allí si presiona a la fuerza a `master`

## Objetivos & valores del proyecto

* Los Colaboradores son los propietarios colectivos del proyecto
  
  * El proyecto tiene los objetivos de sus contribuyentes

* Hay algunos objetivos y valores de alto nivel
  
  * La empatía hacia los usuarios es importante (esto es en parte el motivo por el que incorporamos personas)
  * En general: ¡intente ser amable con las personas!
  * El mejor resultado es que las personas que acuden a nuestro rastreador de problemas sientan que pueden regresar nuevamente.

* You are expected to follow *and* hold others accountable to the [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

## Gestionar el rastreador de problemas

* Tiene (en su mayoría) rienda suelta; no dude en cerrar un problema si está seguro de que debería cerrarse
  
  * ¡Sea amable con los problemas de cierre! Deje que la gente sepa por qué, y que los problemas y las PRs pueden reabrirse si es necesario

* [**Ver "Etiquetas"**](./onboarding-extras.md#labels)
  
  * Existe [un bot](https://github.com/nodejs-github-bot/github-bot) que aplica etiquetas de subsistema (por ejemplo, `doc`, `test`, `assert` o `buffer`) para que sepamos qué partes del código base modifica la pull request. No es perfecto, por supuesto. Siéntase libre de aplicar etiquetas relevantes y eliminar etiquetas irrelevantes de pull requests y problemas.
  * Use the `tsc-review` label if a topic is controversial or isn't coming to a conclusion after an extended time.
  * `semver-{minor,major}`: 
    * Si un cambio tiene la *posibilidad* remota de romper algo, use la etiqueta `semver-major`
    * When adding a `semver-*` label, add a comment explaining why you're adding it. ¡Hágalo de inmediato para que no se le olvide!
  * Please add the [`author-ready`][] label for PRs, if applicable.

* Consulte [A quien CC en el sistema de seguimiento de incidentes](../COLLABORATOR_GUIDE.md#who-to-cc-in-the-issue-tracker).
  
  * Esto vendrá más naturalmente con el tiempo
  * Para muchos de los equipos que figuran en la lista, puede solicitar ser agregado si está interesado 
    * Algunos son grupos de trabajo con algún proceso para agregar personas, otros solo están ahí para recibir notificaciones

* Cuando una discusión se torna tensa, puede solicitar que otros Colaboradores la vigilen abriendo un problema en el repositorio privado [nodejs/moderation ](https://github.com/nodejs/moderation).
  
  * Este es un repositorio al que todos los miembros de la organización de GitHub de `nodejs` (no solo los Colaboradores en el núcleo de Node.js) tienen acceso. Sus contenidos no deben ser compartidos externamente.
  * Puede encontrar la política de moderación completa [aquí](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisión de PRs

* El objetivo principal es mejorar la base del código.
* El secundario (pero no menos importante) es que la persona que envía el código tenga éxito. A pull request from a new contributor is an opportunity to grow the community.
* Revise un poco a la vez. No abrume a los nuevos colaboradores. 
  * Es tentador micro-optimizar. No sucumba a esa tentación. Cambiamos V8 a menudo. Techniques that provide improved performance today may be unnecessary in the future.
* Tenga en cuenta: ¡Su opinión tiene mucho peso!
* Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request. 
  * Tenga en cuenta que son nits cuando comenta: `Nit: change foo() to bar().`
  * Si están deteniendo el pull request, corríjalos usted mismo en la fusión.
* Insofar as possible, issues should be identified by tools rather than human reviewers. If you are leaving comments about issues that could be identified by tools but are not, consider implementing the necessary tooling.
* Tiempo mínimo de espera para comentarios 
  * There is a minimum waiting time which we try to respect for non-trivial changes so that people who may have important input in such a distributed project are able to respond.
  * For non-trivial changes, leave the pull request open for at least 48 hours.
  * If a pull request is abandoned, check if they'd mind if you took it over (especially if it just has nits left).

* Aprobar un cambio
  
  * Collaborators indicate that they have reviewed and approve of the changes in a pull request using GitHub’s approval interface
  * A algunas personas les gusta comentar `LGTM` ("Me parece bien")
  * Tiene la autoridad para aprobar cualquier trabajo de otro colaborador.
  * No puede aprobar sus propios pull requests.
  * When explicitly using `Changes requested`, show empathy – comments will usually be addressed even if you don’t use it. 
    * If you do, it is nice if you are available later to check whether your comments have been addressed
    * If you see that the requested changes have been made, you can clear another collaborator's `Changes requested` review.
    * Use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing.

* Lo que pertenece en Node.js:
  
  * Las opiniones varían - ¡es bueno tener una extensa base de colaboradores por esa razón!
  * If Node.js itself needs it (due to historical reasons), then it belongs in Node.js. 
    * That is to say, `url` is there because of `http`, `freelist` is there because of `http`, etc.
  * Things that cannot be done outside of core, or only with significant pain such as `async_hooks`.

* Pruebas de Integración Continua (CI):
  
  * <https://ci.nodejs.org/> 
    * No se ejecuta automáticamente. Necesita iniciarlo manualmente.
  * Iniciar sesión en la CI está integrado con GitHub. ¡Intente iniciar sesión ahora!
  * Utilizará `node-test-pull-request` la mayor parte del tiempo. ¡Vaya allí ahora! 
    * Considere marcarlo: https://ci.nodejs.org/job/node-test-pull-request/
  * Para acceder al formulario para iniciar un trabajo, haga clic en `Build with Parameters`. (Si no lo ve, probablemente significa que no ha iniciado sesión). ¡Haga clic ahora!
  * Para iniciar las pruebas de CI desde esta pantalla, debe completar dos elementos en el formulario: 
    * La caja `CERTIFY_SAFE` debe ser verificada. Al marcarla, indica que ha revisado el código que está a punto de probar y confía en que no contiene ningún código malicioso. (¡No queremos que las personas que secuestran nuestros hosts de CI para atacar a otros hosts en Internet, por ejemplo!)
    * La casilla `PR_ID` se debe completar con el número que identifica la pull request que contiene el código que desea probar. Por ejemplo, si el URL para la pull request es `https://github.com/nodejs/node/issues/7006`, coloque `7006` en el `PR_ID`.
    * The remaining elements on the form are typically unchanged.
  * Si necesita ayuda con algo relacionado con CI: 
    * Utilice #node-dev (IRC) para hablar con otros Colaboradores.
    * Use #node-build (IRC) para hablar con los miembros de Build WG que mantienen la infraestructura de CI.
    * Utilice el [repositorio de Build WG](https://github.com/nodejs/build) para archivar los problemas de los miembros de Build WG que mantienen la infraestructura de CI.

## Aterrizar las PRs

Consulte la Guía del Colaborador: [Aterrizar Pull Requests](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests).

Note that commits in one PR that belong to one logical change should be squashed. It is rarely the case in onboarding exercises, so this needs to be pointed out separately during the onboarding.

<!-- TODO(joyeechueng): provide examples about "one logical change" -->

## Ejercicio: Haga un PR agregándose usted mismo al README

* Example: https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0 
  * Para el mensaje de commit sin procesar: `git log ce986de829457c39257cd205067602e765768fb0
-1`
* Los colaboradores están ordenados alfabéticamente por el nombre de usuario de GitHub.
* Opcionalmente, incluya sus pronombres personales.
* Label your pull request with the `doc`, `notable-change`, and `fast-track` labels.
* Ejecute CI en el PR. Because the PR does not affect any code, use the `node-test-pull-request-lite-pipeline` CI task.
* After two Collaborator approvals for the change and two Collaborator approvals for fast-tracking, land the PR. 
  * Be sure to add the `PR-URL: <full-pr-url>` and appropriate `Reviewed-By:` metadata.
  * [`node-core-utils`][] automates the generation of metadata and the landing process. Consulte la documentación de [`git-node`][].
  * [`core-validate-commit`][] automatiza la validación de mensajes de commit. This will be run during `git node land --final` of the [`git-node`][] command.

## Notas Finales

* No se preocupe por cometer errores: todos los cometen, hay mucho que internalizar y eso lleva tiempo (¡y lo reconocemos!)
* Casi cualquier error que podría cometer puede ser arreglado o revertido.
* ¡Los Colaboradores existentes confían en usted y están agradecidos por su ayuda!
* Otros repositorios: 
  * <https://github.com/nodejs/TSC>
  * <https://github.com/nodejs/build>
  * <https://github.com/nodejs/nodejs.org>
  * <https://github.com/nodejs/readable-stream>
  * <https://github.com/nodejs/LTS>
  * <https://github.com/nodejs/citgm>
* The Node.js Foundation hosts regular summits for active contributors to the Node.js project, where we have face-to-face discussions about our work on the project. The Foundation has travel funds to cover participants' expenses including accommodations, transportation, visa fees, etc. si es necesario. Check out the [summit](https://github.com/nodejs/summit) repository for details.