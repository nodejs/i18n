# Incorporación

Este documento es un resumen de las cosas que contamos a los nuevos Colaboradores en su sesión de incorporación.

## Una semana antes de la sesión de incorporación

* Confirme que el nuevo Colaborador está utilizando la autenticación de dos factores en su cuenta de GitHub. A menos que la autenticación de dos factores esté habilitada, no otorgue privilegios elevados a una cuenta, así como la capacidad de ingresar código en el repositorio principal o iniciar trabajos de integración continua (CI).

## Quince minutos antes de la sesión de incorporación

* Antes de la sesión de incorporación, agregue el nuevo Colaborador al [equipo de Colaboradores](https://github.com/orgs/nodejs/teams/collaborators) y al [equipo de Miembros](https://github.com/orgs/nodejs/teams/members) si aún no forman parte de él. Tenga en cuenta que este es el paso que otorga privilegios elevados a la cuenta, así que no realice este paso (o cualquier otro paso subsiguiente) a menos que la autenticación de dos factores esté habilitada en la nueva cuenta de GitHub del Colaborador.


## Sesión de incorporación

* Esta sesión cubrirá:
    * [configuración local](#local-setup)
    * [objetivos & valores del proyecto](#project-goals--values)
    * [gestionar el rastreador de problemas](#managing-the-issue-tracker)
    * [revisar las PRs](#reviewing-prs)
    * [aterrizar las PRs](#landing-prs)

## Configuración local

  * git:
    * Asegúrese de tener whitespace=fix: `git config --global --add apply.whitespace fix`
    * Siempre continúe con la PR desde su propia bifurcación de github
      * Las ramas en el repositorio nodejs/node son solo para líneas de lanzamiento
    * [Consulte "Actualización de Node.js desde Upstream"](./onboarding-extras.md#updating-nodejs-from-upstream)
    * Haga una nueva rama para cada PR que envíe.
    * Membresía: Considere hacer pública su membresía en la organización de GitHub de Node.js. Esto facilita la identificación de los Colaboradores. Las instrucciones sobre cómo hacerlo están disponibles en [Publicar u ocultar la membresía de la organización](https://help.github.com/articles/publicizing-or-hiding-organization-membership/).

  * Notificaciones:
    * Use [https://github.com/notifications](https://github.com/notifications) o configure el correo electrónico
    * Ver el repositorio principal inundará su bandeja de entrada (varios cientos de notificaciones en los días hábiles típicos), así que prepárese

  * `#node-dev` en [webchat.freenode.net](https://webchat.freenode.net/) es el mejor lugar para interactuar con el TSC/otros colaboradores
    * Si hay alguna pregunta después de la sesión, ¡ese es un buen lugar para preguntar!
    * La presencia no es obligatoria, pero deje una nota allí si presiona a la fuerza a `master`


## Objetivos y valores del proyecto

  * Los colaboradores son los propietarios colectivos del proyecto
    * El proyecto tiene los objetivos de sus colaboradores

  * Hay algunos objetivos y valores de alto nivel
    * La empatía hacia los usuarios es importante (esto es en parte el motivo por el que incorporamos personas)
    * En general: ¡trata de ser amable con la gente!
    * El mejor resultado es que las personas que acuden a nuestro rastreador de problemas sientan que pueden regresar nuevamente.

  * Tenemos un [Código de conducta](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md) que se espera que usted cumpla *y* responsabilice a otros

## Gestionar el rastreador de problemas

  * Tiene (en su mayoría) rienda suelta; no dude en cerrar un problema si está seguro de que debería cerrarse
    * ¡Sea amable con los problemas de cierre! Deje que la gente sepa por qué, y que los problemas y las PRs pueden reabrirse si es necesario

  * [**Vea "Etiquetas"**](./onboarding-extras.md#labels)
    * Existe [un bot](https://github.com/nodejs-github-bot/github-bot) que aplica etiquetas de subsistema (por ejemplo, `doc`, `test`, `assert` o `buffer`) para que sepamos qué partes del código base modifica la pull request. No es perfecto, por supuesto. Siéntase libre de aplicar etiquetas relevantes y eliminar etiquetas irrelevantes de pull requests y problemas.
    * Use la etiqueta `tsc-review` si un tema es controvertido o no llega a una conclusión después de un tiempo prolongado.
    * `semver-{minor,major}`:
      * Si un cambio tiene la *posibilidad* remota de romper algo, use la etiqueta `semver-major`
      * Cuando agregue una etiqueta semver, agregue un comentario que explique por qué lo está agregando. ¡Hágalo de inmediato para que no lo olvide!

  * [**Vea "A quién hacer CC en los problemas"**](./onboarding-extras.md#who-to-cc-in-issues)
    * Esto saldrá más naturalmente con el tiempo
    * Para muchos de los equipos que figuran en la lista, puede solicitar ser agregado si está interesado
      * Algunos son grupos de trabajo con algún proceso para agregar personas, otros solo están ahí para recibir notificaciones

  * Cuando una discusión se torna tensa, puede solicitar que otros Colaboradores la vigilen abriendo un problema en el repositorio privado [nodejs/moderation ](https://github.com/nodejs/moderation).
    * Este es un repositorio al que todos los miembros de la organización de GitHub de `nodejs` (no solo los Colaboradores en el núcleo de Node.js) tienen acceso. Sus contenidos no deben ser compartidos externamente.
    * Puede encontrar la política de moderación completa [aquí](https://github.com/nodejs/TSC/blob/master/Moderation-Policy.md).

## Revisión de las PRs
  * El objetivo principal es mejorar la base del código.
  * El secundario (pero no menos importante) es que la persona que envía el código tenga éxito. Una pull request de un nuevo contribuyente es una oportunidad para hacer crecer la comunidad.
  * Revise un poco a la vez. No abrume a los nuevos contribuyentes.
    * It is tempting to micro-optimize and make everything about relative performance. No sucumba a esa tentación. Cambiamos V8 a menudo. Techniques that provide improved performance today may be unnecessary in the future.
  * Tenga en cuenta: ¡Su opinión tiene mucho peso!
  * Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the pull request.
    * Tenga en cuenta que son nits cuando usted comenta: `Nit: change foo() to bar().`
    * Si están deteniendo la pull request, corríjalos usted mismo en la fusión.
  * Tiempo mínimo de espera para comentarios
    * There is a minimum waiting time which we try to respect for non-trivial changes, so that people who may have important input in such a distributed project are able to respond.
    * For non-trivial changes, leave the pull request open for at least 48 hours (72 hours on a weekend).
    * If a pull request is abandoned, check if they'd mind if you took it over (especially if it just has nits left).
  * Aprobación de un cambio
    * Collaborators indicate that they have reviewed and approve of the changes in a pull request using Github’s approval interface
    * A algunas personas les gusta comentar `LGTM` ("Me parece bien")
    * Usted tiene la autoridad para aprobar el trabajo de cualquier otro colaborador.
    * No puede aprobar sus propias pull requests.
    * Cuando utilice explícitamente `Changes requested`, muestre empatía - los comentarios usualmente se abordarán incluso si no la utiliza.
      * Si lo hace, es bueno que esté disponible luego para verificar si se han abordado sus comentarios
      * Si observa que se han realizado los cambios solicitados, puede borrar la revisión de `Changes requested` de otro colaborador.
      * Use `Changes requested` para indicar que está considerando algunos de sus comentarios para impedir que la PR aterrice.

  * Qué pertenece en Node.js:
    * Las opiniones varían – ¡es bueno tener una amplia base de colaboradores por ese motivo!
    * Si Node.js lo necesita (debido a razones históricas), entonces pertenece a Node.js
      * Es decir, el url está ahí debido a http, freelist está ahí debido a http, etc.
    * Cosas que no se pueden hacer fuera del núcleo, o solo con un daño significativo (por ejemplo, `async_hooks`)

  * Pruebas de Integración Continua (CI):
    * [https://ci.nodejs.org/](https://ci.nodejs.org/)
      * No se ejecuta automáticamente. Necesita iniciarlo manualmente.
    * El inicio de sesión en CI está integrado con GitHub. Intente iniciar sesión ahora!
    * Utilizará `node-test-pull-request` la mayor parte del tiempo. ¡Vaya allí ahora!
      * Considere marcarlo como favorito: https://ci.nodejs.org/job/node-test-pull-request/
    * Para acceder al formulario para iniciar un trabajo, haga clic en `Build with Parameters`. (Si no lo ve, probablemente significa que no ha iniciado sesión). ¡Haga clic ahora!
    * Para iniciar las pruebas de CI desde esta pantalla, debe completar dos elementos en el formulario:
      * La casilla `CERTIFY_SAFE` debe estar marcada. Al marcarla, indica que ha revisado el código que está a punto de probar y confía en que no contiene ningún código malicioso. (¡No queremos que las personas que secuestran nuestros hosts de CI para atacar a otros hosts en Internet, por ejemplo!)
      * La casilla `PR_ID` se debe completar con el número que identifica la pull request que contiene el código que desea probar. Por ejemplo, si el URL para la pull request es `https://github.com/nodejs/node/issues/7006`, coloque `7006` en el `PR_ID`.
      * Los elementos restantes en el formulario normalmente no se modifican con la excepción de `POST_STATUS_TO_PR`. Compruebe si desea que un indicador de estado de CI se inserte automáticamente en la PR.
    * Si necesita ayuda con algo relacionado con CI:
      * Use #node-dev (IRC) para hablar con otros Colaboradores.
      * Use #node-build (IRC) para hablar con los miembros de Build WG que mantienen la infraestructura de CI.
      * Utilice el [repositorio de Build WG](https://github.com/nodejs/build) para archivar los problemas de los miembros de Build WG que mantienen la infraestructura de CI.


## Aterrizar PRs

  * [Consulte la Guía del Colaborador: Aterrizar Pull Requests](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md#landing-pull-requests)

## Ejercicio: Haga una PR añadiéndose a usted mismo al README

  * Ejemplo: [https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0](https://github.com/nodejs/node/commit/ce986de829457c39257cd205067602e765768fb0)
    * Para el mensaje de commit sin formato: `git log ce986de829457c39257cd205067602e765768fb0 -1`
  * Los colaboradores están en orden alfabético por nombre de usuario de GitHub.
  * Opcionalmente, incluya sus pronombres personales.
  * Etiquete su pull request con la etiqueta del subsistema `doc`.
  * Ejecute CI en su PR.
  * Después de una o dos aprobaciones, aterrize la PR.
    * Asegúrese de agregar el `PR-URL: <full-pr-url>`, ¡y los metadatos apropiados de `Reviewed-By:`!
    * [`core-validate-commit`][] ayuda mucho con esto – ¡instálelo y utilícelo si puede!
    * [`node-core-utils`][] busca los metadatos por usted.

## Notas finales

  * No se preocupe por cometer errores: todos los cometen, hay mucho que internalizar y eso lleva tiempo (¡y lo reconocemos!)
  * Casi cualquier error que pueda cometer puede ser arreglado o revertido.
  * ¡Los Colaboradores existentes confían en usted y están agradecidos por su ayuda!
  * Otros repositorios:
    * [https://github.com/nodejs/TSC](https://github.com/nodejs/TSC)
    * [https://github.com/nodejs/build](https://github.com/nodejs/build)
    * [https://github.com/nodejs/nodejs.org](https://github.com/nodejs/nodejs.org)
    * [https://github.com/nodejs/readable-stream](https://github.com/nodejs/readable-stream)
    * [https://github.com/nodejs/LTS](https://github.com/nodejs/LTS)
    * [https://github.com/nodejs/citgm](https://github.com/nodejs/citgm)
  * The Node.js Foundation hosts regular summits for active contributors to the Node.js project, where we have face-to-face discussion about our work on the project. The foundation has travel funds to cover participants' expenses including accommodation, transportation, visa fees etc. si es necesario. Check out the [summit](https://github.com/nodejs/summit) repository for details.
