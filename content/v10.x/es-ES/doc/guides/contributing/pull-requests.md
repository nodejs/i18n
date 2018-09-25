# Pull Requests

Hay dos componentes fundamentales del proceso de Pull Request: uno concreto y técnico, y uno más orientado al proceso. El componente concreto y técnico implica los detalles específicos de la configuración de tu entorno local para que puedas realizar los cambios reales. Aquí es donde comenzaremos.

* [Dependencias](#dependencies)
* [Configurando su entorno local](#setting-up-your-local-environment) 
  * [Paso 1: Bifurcación](#step-1-fork)
  * [Paso 2: Branch](#step-2-branch)
* [El proceso de hacer cambios](#the-process-of-making-changes) 
  * [Paso 3: Código](#step-3-code)
  * [Paso 4: Commit](#step-4-commit) 
    * [Pautas del mensaje Commit](#commit-message-guidelines)
  * [Paso 5: Rebase](#step-5-rebase)
  * [Paso 6: Prueba](#step-6-test) 
    * [Cobertura de prueba](#test-coverage)
  * [Paso 7: Push](#step-7-push)
  * [Paso 8: Apertura de la Pull Request](#step-8-opening-the-pull-request)
  * [Paso 9: Discutir y actualizar](#step-9-discuss-and-update) 
    * [Flujo de trabajo de aprobación y cambios de solicitud](#approval-and-request-changes-workflow)
  * [Paso 10: Ejecutar](#step-10-landing)
* [Revisión de Pull Requests](#reviewing-pull-requests) 
  * [Revise un poco a la vez](#review-a-bit-at-a-time)
  * [Tenga en cuenta a la persona detrás del código](#be-aware-of-the-person-behind-the-code)
  * [Respete el tiempo de espera mínimo para los comentarios](#respect-the-minimum-wait-time-for-comments)
  * [Pull Requests abandonadas o paralizadas](#abandoned-or-stalled-pull-requests)
  * [Aprobar un cambio](#approving-a-change)
  * [Acepte que hay opiniones diferentes sobre lo que pertenece a Node.js](#accept-that-there-are-different-opinions-about-what-belongs-in-nodejs)
  * [El rendimiento no es todo](#performance-is-not-everything)
  * [Pruebas de integración continua](#continuous-integration-testing)
* [Notas adicionales](#additional-notes) 
  * [Commit Squashing](#commit-squashing)
  * [Obtener aprobaciones para su Pull Request](#getting-approvals-for-your-pull-request)
  * [Prueba de CI](#ci-testing)
  * [Esperar hasta que se aterrice la Pull Request](#waiting-until-the-pull-request-gets-landed)
  * [Consulte la Guía del Colaborador](#check-out-the-collaborator-guide)

## Dependencias

Node.js tiene varias dependencias empaquetadas en las *deps/* y en los directorios de *tools/* que no son parte del proyecto propiamente dicho. Los cambios a los archivos en esos directorios deben enviarse a sus respectivos proyectos. No envíe un parche a Node.js. No podemos aceptar dichos parches.

En caso de duda, abra un problema en el [issue tracker](https://github.com/nodejs/node/issues/) o contacte a uno de los [colaboradores del proyecto](https://github.com/nodejs/node/#current-project-team-members). Node.js tiene dos canales de IRC: [#Node.js](https://webchat.freenode.net/?channels=node.js), para ayuda general y preguntas, y [#Node-dev](https://webchat.freenode.net/?channels=node-dev), específicamente para el desarrollo del núcleo de Node.js.

## Configurando su entorno local

Para empezar, necesitará tener `git` instalado de forma local. Dependiendo de su sistema operativo, también hay una serie de otras dependencias requeridas. Estas se detallan en la [guía de Building](../../../BUILDING.md).

Una vez que tenga `git` y esté seguro de tener todas las dependencias necesarias, es hora de crear un fork.

### Paso 1: Bifurcación

Bifurque el proyecto [en GitHub](https://github.com/nodejs/node) y clone su bifurcación de forma local.

```text
$ git clone git@github.com:username/node.git
$ cd node
$ git remote add upstream https://github.com/nodejs/node.git
$ git fetch upstream
```

Se recomienda configurar `git` para que sepa quién es usted:

```text
$ git config user.name "J. Random User"
$ git config user.email "j.random.user@example.com"
```

Asegúrate de que este correo electrónico local también se haya agregado a tu [lista de correo electrónico de GitHub](https://github.com/settings/emails), de modo que tus commits se asocien correctamente con tu cuenta y seas promovido a Contribuyente una vez que se haya descargado tu primer commit.

### Paso 2: Branch

Como práctica recomendada para mantener su entorno de desarrollo lo más organizado posible, cree branches locales para trabajar dentro de ellas. Estos también se deben crear directamente fuera del branch `principal`.

```text
$ git checkout -b my-branch -t upstream/master
```

## El proceso de hacer cambios

### Paso 3: Código

La gran mayoría de las Pull Requests abiertas en el repositorio `nodejs/node` incluye cambios en uno o más de los siguientes:

     - el código C/C ++ contenido en el directorio `src`
     - el código JavaScript contenido en el directorio `lib`
     - la documentación en `doc / api`
     - pruebas dentro del directorio `test`.
    

Si está modificando el código, por favor asegúrese de ejecutar `make lint` de vez en cuando para asegurarse de que los cambios sigan la guía de estilo del código de Node.js.

Cualquier documentación que escriba (incluidos los comentarios de código y la documentación de API) debe seguir la [Guía de Estilo](../../STYLE_GUIDE.md). Las muestras de código incluidas en los documentos API también se verificarán cuando se ejecute `make lint` (o `vcbuild.bat lint`, en Windows).

Para contribuir con el código de C++, es posible que desee consultar la [Guía de Estilo de C++](../../../CPP_STYLE_GUIDE.md).

### Paso 4: Commit

Es una mejor práctica recomendada mantener sus cambios lo más lógicamente agrupados dentro de los commits individuales. No hay límite para el número de commits que puede tener una sola Pull Request, y a muchos colaboradores les resulta más fácil revisar los cambios que se dividen en varios commits.

```text
$ git add my/changed/files
$ git commit
```

Tenga en cuenta que los commits múltiples a menudo se reducen cuando se aterrizan (consulte las notas sobre [commit squashing](#commit-squashing)).

#### Pautas del mensaje Commit

Un buen mensaje de commit debe describir qué cambió y por qué.

1. La primera línea debe:
  
  * contener una breve descripción del cambio (preferiblemente 50 caracteres o menos, y no más de 72 caracteres)
  * estar completamente en minúsculas, con la excepción de los nombres propios, acrónimos y las palabras que hacen referencia al código, como nombres de funciones/variables
  * ir precedido del nombre del subsistema modificado y comenzar con un verbo imperativo. Comprueba la salida de `git log --oneline files/you/changed` para averiguar qué subsistemas tocan tus cambios.
    
    Ejemplos (en inglés):
  
  * `net: add localAddress and localPort to Socket`
  
  * `src: fix typos in async_wrap.h`

2. Mantenga la segunda línea en blanco.

3. Envuelva todas las otras líneas en 72 columnas (a excepción de las URL largas).

4. Si su parche soluciona un problema abierto, puede agregar una referencia al final del registro. Utilice el prefijo `Fixes:` y la URL completa del problema. Para otras referencias, use `Refs:`.
  
  Ejemplos:
  
  * `Fixes: https://github.com/nodejs/node/issues/1337`
  * `Refs: http://eslint.org/docs/rules/space-in-parens.html`
  * `Refs: https://github.com/nodejs/node/pull/3615`

5. Si su commit introduce un cambio de ruptura(`semver-major`), debe contener una explicación sobre el motivo del cambio de ruptura, qué situación desencadenaría el cambio de ruptura y cuál es el cambio exacto.

Muestra de mensaje de confirmación completo (en inglés):

```txt
subsystem: explain the commit in one line

Body of commit message is a few lines of text, explaining things
in more detail, possibly giving some background about the issue
being fixed, etc.

The body of the commit message can be several paragraphs, and
please do proper word-wrap and keep columns shorter than about
72 characters or so. That way, `git log` will show things
nicely even when it is indented.

Fixes: https://github.com/nodejs/node/issues/1337
Refs: http://eslint.org/docs/rules/space-in-parens.html
```

Si eres nuevo en contribuir con Node.js, por favor intenta hacer tu mejor esfuerzo para cumplir con estas pautas, pero no te preocupes si haces algo mal. Uno de los colaboradores actuales ayudará a ubicar las cosas y el contribuyente que aterrice la Solicitud de extracción garantizará que todo siga las pautas del proyecto.

Vea [core-validate-commit](https://github.com/evanlucas/core-validate-commit) - Una utilidad que asegura que los commits sigan las pautas de formato de commit.

### Paso 5: Rebase

Como buena práctica, una vez que haya confirmado sus cambios, es una buena idea usar `git rebase` (no `git merge`) para sincronizar su trabajo con el repositorio principal.

```text
$ git fetch upstream
$ git rebase upstream/master
```

Esto garantiza que su branch de trabajo tenga los últimos cambios del maestro `nodejs/node`.

### Paso 6: Prueba

Las correcciones de errores y las características siempre deben venir con las pruebas. Se ha proporcionado una [guía para escribir pruebas en Node.js](../writing-tests.md) para facilitar el proceso. Revisar otras pruebas para ver cómo deberían estructurarse también puede ayudar.

El directorio `test` dentro del repositorio `nodejs/node` es complejo y, a menudo, no está claro adónde debe ir un nuevo archivo de prueba. En caso de dudas, agregue una nueva prueba al directorio `test/parallel/` y la ubicación correcta se resolverá luego.

Antes de enviar los cambios en una Pull Request, siempre ejecute el conjunto de pruebas completo de Node.js. Para ejecutar las pruebas (incluyendo el linting de código) en Unix/macOS:

```text
$ ./configure && make -j4 test
```

Y en Windows:

```text
> vcbuild test
```

(Vea la [Building guide](../../../BUILDING.md) para más detalles.)

Asegúrese de que el linter no reporte ningún problema y de que todas las pruebas pasen. Por favor, no envíe parches que no cumplan con la verificación.

Si desea ejecutar el linter sin ejecutar pruebas, utilice `make lint`/`vcbuild lint`. Ejecutará el linting de JavaScript y el linting de C ++.

Si está actualizando pruebas y solo desea ejecutar una prueba única para verificarlo:

```text
$ python tools/test.py -J --mode=release parallel/test-stream2-transform
```

Puede ejecutar todo el conjunto de pruebas para un subsistema dado proporcionando el nombre de un subsistema:

```text
$ python tools/test.py -J --mode=release child-process
```

Si desea verificar las otras opciones, consulte la ayuda utilizando la opción `--help`

```text
$ python tools/test.py --help
```

Por lo general, puede ejecutar pruebas directamente con node:

```text
$ ./node ./test/parallel/test-stream2-transform.js
```

Recuerde volver a compilar con `make -j4` entre ejecuciones de prueba si cambia el código en los directorios `lib`o`src`.

#### Cobertura de Prueba

Es una buena práctica asegurarse de que cualquier código que agregue o modifique esté cubierto por pruebas. Puede hacerlo ejecutando el conjunto de pruebas con cobertura habilitada:

```text
$ ./configure --coverage && make coverage
```

Se escribirá un informe de cobertura detallado en `coverage/index.html`, para la cobertura de JavaScript, y `coverage/cxxcoverage.html`, para la cobertura de C ++.

*Tenga en cuenta que generar un informe de cobertura de prueba puede demorar varios minutos.*

Para recopilar la cobertura de un subconjunto de pruebas, puede establecer las variables `CI_JS_SUITES` y `CI_NATIVE_SUITES`:

```text
$ CI_JS_SUITES=child-process CI_NATIVE_SUITES= make coverage
```

El comando anterior ejecuta pruebas para el subsistema `child-process` y genera el informe de cobertura resultante.

Ejecutar pruebas con cobertura creará y modificará varios directorios y archivos. Para limpiar después, ejecute:

```text
make coverage-clean
./configure && make -j4.
```

### Paso 7: Push

Una vez que esté seguro de que sus commits están listas para continuar, pasando las pruebas y el linting, comience el proceso de abrir una Pull Request "empujando" su branch de trabajo hacia su fork en GitHub.

```text
$ git push origin my-branch
```

### Paso 8: Apertura de la Pull Request

Desde dentro de GitHub, la apertura de una nueva Pull Request le presentará una plantilla (en inglés) que debe completarse:

```markdown
<!--
Thank you for your Pull Request. Please provide a description above and review
the requirements below.

Bug fixes and new features should include tests and possibly benchmarks.

Contributors guide: https://github.com/nodejs/node/blob/master/CONTRIBUTING.md
-->

#### Checklist
<!-- Remove items that do not apply. For completed items, change [ ] to [x]. -->

- [ ] `make -j4 test` (UNIX), or `vcbuild test` (Windows) passes
- [ ] tests and/or benchmarks are included
- [ ] documentation is changed or added
- [ ] commit message follows [commit guidelines](https://github.com/nodejs/node/blob/master/doc/guides/contributing/pull-requests.md#commit-message-guidelines)
```

Por favor, intente hacer todo lo posible para completar los detalles, pero no dude en saltarse partes si no está seguro de qué colocar.

Una vez abiertas, las Pull Requests generalmente se revisan en unos pocos días.

### Paso 9: Discutir y actualizar

Probablemente recibirá un feedback o solicitudes de cambios en su Pull Request. Esta es una parte importante del proceso de envío, así que, ¡no te desanimes! Algunos colaboradores pueden firmar la Pull Request de inmediato, otros pueden tener comentarios más detallados o un feedback. Esta es una parte necesaria del proceso, para evaluar si los cambios son correctos y necesarios.

Para realizar cambios en una Pull Request existente, realice los cambios en su branch local, agregue un nuevo commit con esos cambios y envíelos a su fork. GitHub actualizará automáticamente la Pull Request.

```text
$ git add my/changed/files
$ git commit
$ git push origin my-branch
```

También suele ser necesario sincronizar su Pull Request con otros cambios que han "aterrizado" en `master` usando `git rebase`:

```text
$ git fetch --all
$ git rebase origin/master
$ git push --force-with-lease origin my-branch
```

**Importante:** El comando `git push --force-with-lease` es una de las pocas formas de eliminar el historial en `git`. Antes de usarlo, asegúrese de comprender los riesgos. En caso de duda, siempre puede solicitar orientación en la Pull Request o en [IRC en el canal #node-dev](https://webchat.freenode.net?channels=node-dev&uio=d4).

Si comete un error en alguno de sus commits, no se preocupe. Puede modificar el último commit (por ejemplo, si desea cambiar el registro de commit).

```text
$ git add any/changed/files
$ git commit --amend
$ git push --force-with-lease origin my-branch
```

Hay varios mecanismos más avanzados para administrar commits usando `git rebase` que pueden ser usados, pero están fuera del alcance de esta guía.

Siéntase libre de publicar un comentario en la Pull Request para hacer ping a los colaboradores si está esperando una respuesta sobre algo. Si encuentra palabras o acrónimos que le parecen desconocidos, consulte este [glosario](https://sites.google.com/a/chromium.org/dev/glossary).

#### Flujo de trabajo de aprobación y cambios de solicitud

Todas las Pull Requests requieren "cerrar sesión" para poder "aterrizar". Cuando un colaborador revisa una Pull Request, puede encontrar detalles específicos que le gustaría ver modificados o reparados. Estos pueden ser tan simples como corregir un error tipográfico, o pueden implicar cambios sustanciales en el código que ha escrito. Si bien estas solicitudes tienen la intención de ser útiles, pueden parecer abruptas o inútiles, especialmente las solicitudes para cambiar las cosas que no incluyen sugerencias concretas sobre *cómo* cambiarlas.

Trate de no desanimarse. Si siente que una revisión en particular es injusta, dígalo, o póngase en contacto con uno de los otros colaboradores en el proyecto y solicite su opinión. A menudo, dichos comentarios son el resultado de que el revisor solo tomó un corto tiempo para la reseña y no son malintencionados. Muy seguidamente, tales problemas se pueden resolver con un poco de paciencia. Dicho esto, se debería esperar que los revisores sean útiles en su feedback, y los comentarios que son simplemente vagos, despectivos e inútiles, probablemente sea mejor ignorarlos.

### Paso 10: Ejecutar

Para "aterrizar", una Pull Request debe ser revisada y [aprobada](#getting-approvals-for-your-pull-request) por al menos un Colaborador de Node.js y pasar una [prueba de funcionamiento CI (Continuous Integration)](#ci-testing). Después de eso, siempre que no haya objeciones de otros colaboradores, la Pull Request puede "fusionarse". Si nota que su Pull Request espera más de lo previsto, consulte las [notas sobre el tiempo de espera](#waiting-until-the-pull-request-gets-landed).

Cuando un colaborador aterrice su Pull Request, publicará un comentario en la página de Pull Request mencionando el(los) commit(s) como el(los) que se aterrizó. GitHub a menudo muestra la Pull Request como `Closed` en este punto, pero no se preocupe. Si observas el branch en el que planteaste tu Pull Request (probablemente `master`), deberías ver un commit con tu nombre. ¡Felicidades y gracias por su contribución!

## Revisión de Pull Requests

Todos los colaboradores de Node.js que optan por revisar y proporcionar un feedback sobre las Pull Requests, tienen una responsabilidad tanto con el proyecto como con la persona que realiza la contribución. Las revisiones y los feedbacks deben ser útiles, perspicaces y estar orientados a mejorar la contribución, en lugar de simplemente bloquearla. Si hay razones por las cuales siente que la PR no debe aterrizar, explique cuáles son. No espere poder bloquear el avance de una Pull Request simplemente porque diga "No" sin dar una explicación. Esté abierto a cambiar de opinión. Esté abierto a trabajar con el colaborador para mejorar la Pull Request.

Los comentarios que son despectivos o irrespetuosos con el colaborador o cualquier otro revisor son estrictamente contrarios al [Código de Conducta](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

Al revisar una Pull Request, los objetivos principales son que la base de código mejore y que la persona que envía la solicitud tenga éxito. Incluso si una Pull Request no aterriza, los remitentes deben abandonar la experiencia sintiendo que su esfuerzo no fue desaprovechado o inestimado. Cada Pull Request de un nuevo colaborador es una oportunidad para hacer crecer a la comunidad.

### Revise un poco a la vez.

No abrume a los nuevos contribuyentes.

Es tentador realizar una micro-optimización y hacer todo lo relacionado con el rendimiento relativo, la gramática perfecta o las coincidencias de estilo exactas. No sucumba a esa tentación.

Enfóquese primero en los aspectos más significativos del cambio:

1. ¿Este cambio tiene sentido para Node.js?
2. ¿Este cambio hace que Node.js sea mejor, aunque solo sea incrementalmente?
3. ¿Hay errores claros o problemas de mayor escala que deben atenderse?
4. ¿El mensaje de el commit es legible y correcto? Si contiene un cambio de ruptura, ¿es lo suficientemente claro?

Cuando los cambios sean necesarios, *solicítelos*, no los *exija*, y no asuma que el remitente ya sabe cómo agregar una prueba o ejecutar una prueba de rendimiento.

Las técnicas específicas de optimización del rendimiento, los estilos de codificación y las convenciones cambian con el tiempo. La primera impresión que le das a un nuevo colaborador nunca lo hace.

Las Nits (solicitudes de pequeños cambios que no son esenciales) están bien, pero trate de evitar el bloqueo de la Pull Request. Normalmente, la mayoría de las nits pueden ser arregladas por el Colaborador de Node.js que aterriza la Pull Request, pero también pueden ser una oportunidad para que el contribuyente aprenda un poco más sobre el proyecto.

Siempre es bueno indicar claramente las nits cuando comenta: por ejemplo `Nit: change foo() to bar(). But this is not blocking.`

Si sus comentarios fueron abordados pero no fueron "doblados" automáticamente después de nuevos commits o si demostraron estar equivocados, por favor, [ocúltelos](https://help.github.com/articles/managing-disruptive-comments/#hiding-a-comment) con el motivo apropiado para mantener el flujo de la conversación conciso y relevante.

### Tenga en cuenta a la persona detrás del código

Tenga en cuenta que *como* comunica las solicitudes y las revisiones en su feedback, puede tener un impacto significativo en el éxito de la Pull Request. Sí, podemos obtener un cambio particular que haga que Node.js sea mejor, pero es posible que el individuo simplemente no quiera volver a tener nada que ver con Node.js. El objetivo no es solo tener un buen código.

### Respete el tiempo de espera mínimo para los comentarios

Hay un tiempo mínimo de espera que tratamos de respetar para cambios no triviales, de modo que las personas que puedan tener un aporte importante en dicho proyecto distribuido puedan responder.

Para cambios no triviales, las Pull Requests se deben dejar abiertas durante *al menos* 48 horas durante la semana y 72 horas en un fin de semana. En la mayoría de los casos, cuando la PR es relativamente pequeña y se enfoca en un conjunto estrecho de cambios, estos períodos brindan tiempo más que suficiente para una revisión adecuada. A veces, los cambios tardan más tiempo en revisarse, o necesitan una revisión más especializada por parte de los expertos en la materia. En caso de dudas, no se apresure.

Los cambios triviales, normalmente limitados a pequeños cambios en el formato o correcciones a la documentación, pueden ser aterrizados dentro del plazo mínimo de 48 horas.

### Pull Requests abandonadas o paralizadas

Si una Pull Request parece abandonada o estancada, es de buena educación consultar primero con el colaborador para ver si tiene la intención de continuar el trabajo, antes de consultarle si le importaría que usted lo asumiera (especialmente si solo le quedan nits por trabajar). Al hacerlo, es cortés otorgarle al contribuyente original crédito por el trabajo que inició (preservando su nombre y dirección de correo electrónico en el registro de commit, o usando una etiqueta de metadatos de `Author:` en el commit).

### Aprobar un cambio

Cualquier Colaborador central de Node.js (cualquier usuario de GitHub con derechos de commit en el repositorio `nodejs/node`) está autorizado para aprobar el trabajo de cualquier otro colaborador. Los colaboradores no pueden aprobar sus propias Pull Requests.

Los colaboradores indican que han revisado y aprobado los cambios en una Pull Request, ya sea utilizando el Flujo de Trabajo de Aprobación de GitHub, que es el preferido, o dejando un comentario `LGTM` (siglas de "me parece bien a mí" en inglés).

Cuando utilice explícitamente el componente "Cambios solicitados" del Flujo de Trabajo de Aprobación de GitHub, muestre empatía. Es decir, no sea grosero o abrupto con su feedback y ofrezca sugerencias concretas para mejorar, si es posible. Si no está seguro de *cómo* puede mejorar un cambio en particular, dígalo.

Lo más importante es que, después de dejar tales solicitudes, es cortés estar disponible más tarde para verificar si se han abordado sus comentarios.

Si ve que se han realizado los cambios solicitados, puede borrar la revisión `Changes requested` de otro colaborador.

Las solicitudes de cambio que sean vagas, despectivas, o poco constructivas, también pueden descartarse si las solicitudes de mayor aclaración no reciben respuesta dentro de un período de tiempo razonable.

Si no cree que la Pull Request debe aterrizar, utilice `Changes requested` para indicar que está considerando algunos de sus comentarios para bloquear el aterrizaje de la PR. Al hacerlo, explique *porqué* cree que la Pull Request no debe aterrizar y describa lo que puede ser un proceso alternativo aceptable, si corresponde.

### Acepte que hay opiniones diferentes sobre lo que pertenece a Node.js

Las opiniones sobre esto varían, incluso entre los miembros del Comité Directivo Técnico.

Una regla general es que si Node.js lo necesita (debido a razones históricas o funcionales), entonces pertenece a Node.js. Por ejemplo, el análisis `url` está en Node.js debido a la compatibilidad con el protocolo HTTP.

Además, la funcionalidad que no puede implementarse fuera del núcleo de ninguna manera razonable, o solo con un gran daño.

No es raro que los colaboradores sugieran nuevas características que, en su opinión, mejorarían el funcionamiento de Node.js. Puede o no tener sentido agregarlos, pero como con todos los cambios, sea cortés con la forma en que comunica su postura al respecto. Los comentarios que hagan que el contribuyente se sienta como que debería haber "sabido mejor" o ridiculizado por siquiera intentar van en contra del [Código de Conducta](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

### El rendimiento no es todo

Node.js siempre se ha optimizado para la velocidad de ejecución. Si se puede mostrar un cambio en particular para hacer que una parte de Node.js sea más rápida, es bastante probable que se acepte. Las afirmaciones de que una Pull Request particular hará que las cosas sean más rápidas casi siempre irán de la mano con solicitudes de rendimiento [benchmark results](../writing-and-running-benchmarks.md) que demuestren la mejora.

Dicho esto, el rendimiento no es el único factor a considerar. Node.js también optimiza a favor de no romper el código existente en el ecosistema, y no cambiar el código funcional de trabajo solo por el hecho de cambiar.

Si una Pull Request particular presenta una regresión funcional o de rendimiento, en lugar de simplemente rechazar la Pull Request, tómese el tiempo para trabajar *con* el contribuyente para mejorar el cambio. Ofrezca un feedback y consejos sobre lo que haría aceptable a la Pull Request, y no suponga que el contribuyente ya debería saber cómo hacerlo. Sea explícito en su feedback.

### Pruebas de integración continua

Todas las Pull Requests que contengan cambios en el código se deben ejecutar a través de pruebas de integración continua (CI) en <https://ci.nodejs.org/>.

Solo los Colaboradores centrales de Node.js con derechos de commit en el repositorio `nodejs/node` pueden iniciar una ejecución de prueba de CI. Los detalles específicos de cómo hacer esto se incluyen en la nueva [Guía de incorporación](../../onboarding.md) del Colaborador.

Idealmente, el cambio de código pasará ("a ser verde") en todas las configuraciones de plataforma compatibles con Node.js (actualmente hay más de 30 configuraciones de plataforma). Esto significa que todas las pruebas pasan y no hay errores de linting. En realidad, sin embargo, no es raro que la propia infraestructura de CI falle en plataformas específicas o que las llamadas pruebas "flaky" fallen ("sean rojas"). Es vital inspeccionar visualmente los resultados de todas las pruebas fallidas ("rojas") para determinar si la falla fue causada por los cambios en la Pull Request.

## Notas adicionales

### Commit Squashing

En la mayoría de los casos, no reduzca las confirmaciones que agregue a su Pull Request durante el proceso de revisión. Cuando los commits en su Pull Request aterrizan, pueden ser reducidos en un commit por cambio lógico. Los metadatos se agregarán al mensaje de commit (incluidos los enlaces a la Pull Request, enlaces a problemas relevantes y los nombres de los revisores). Sin embargo, el historial de commits de su Pull Request se mantendrá intacto en la página Pull Request.

Para el tamaño de "un cambio lógico", [0b5191f](https://github.com/nodejs/node/commit/0b5191f15d0f311c804d542b67e2e922d98834f8) puede ser un buen ejemplo. Toca la implementación, la documentación y las pruebas, pero sigue siendo un cambio lógico. Todas las pruebas siempre deben pasar cuando cada commit individual aterriza en el branch principal.

### Obtener aprobaciones para su Pull Request

Una Pull Request se aprueba diciendo LGTM, que significa "Me parece bien" en inglés, o usando el botón Aprobar de GitHub. La función de revisión de Pull Request de GitHub puede ser utilizada durante el proceso. Para obtener más información, consulte [el video tutorial](https://www.youtube.com/watch?v=HW0RPaJqm4g) o [la documentación oficial](https://help.github.com/articles/reviewing-changes-in-pull-requests/).

Después de insertar nuevos cambios en su branch, debe obtener aprobación de estos nuevos cambios nuevamente, incluso si GitHub muestra "Aprobado" porque los revisores han pulsado los botones anteriormente.

### Prueba de CI

Cada Pull Request debe probarse para asegurarse de que funciona en las plataformas admitidas por Node.js. Esto se hace ejecutando el código a través del sistema CI.

Solo un Colaborador puede iniciar una ejecución de CI. Por lo general, uno de ellos lo hará por usted a medida que las aprobaciones para la Pull Request entren. De lo contrario, puede pedirle a un Colaborador que inicie una ejecución de CI.

### Esperar hasta que se aterrice la Pull Request

Una Pull Request debe permanecer abierta durante al menos 48 horas (72 horas en un fin de semana) desde el momento en que se envía, incluso después de que se aprueba y pasa la CI. Esto es para asegurarse de que todos tengan la oportunidad de intervenir. Si los cambios son triviales, los colaboradores pueden decidir que no necesitan esperar. Una Pull Request puede tomar más tiempo para fusionarse. Todas estas precauciones son importantes porque Node.js es ampliamente utilizado, ¡así que no te desanimes!

### Consulte la Guía del Colaborador

Si desea obtener más información sobre la revisión del código y el proceso de aterrizaje, consulte la [Guía del colaborador](../../../COLLABORATOR_GUIDE.md).