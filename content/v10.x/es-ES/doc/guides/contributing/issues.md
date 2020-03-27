# Problemas

* [Cómo Contribuir en Problemas](#how-to-contribute-in-issues)
* [Pidiendo Ayuda General](#asking-for-general-help)
* [Discusión de temas no técnicas](#discussing-non-technical-topics)
* [Enviando un Reporte de Error](#submitting-a-bug-report)
* [Hacer triage de un Bug](#triaging-a-bug-report)
* [Resolviendo un Reporte de Error](#resolving-a-bug-report)

## Como contribuir en Problemas

Para cualquier problema, hay tres maneras fundamentales en las que cualquier individuo puede contribuir:

1. Abriendo el problema para discusión: Por ejemplo, si crees que has descubierto un bug en Node.js, crear un nuevo problema en el rastreador de problemas `nodejs/node` es la manera de reportarlo.
2. Ayudando a hacer el triage del problema: Esto se puede hacer aportando detalles (por ejemplo, un caso que demuestra el bug), o haciendo sugerencias de como encarar el problema.
3. Ayudando a resolver el problema: Típicamente esto se hace en el formulario o demostrando que el problema reportado no es un problema después de todo. También, se estila abrir un Pull Request que cambia algo en `nodejs/node` de una manera concreta y fácil de revisar.

## Pidiendo ayuda en General

Debido al nivel de actividad en el repositorio de `nodejs/node` es muy alto, las preguntas o solicitudes para la ayuda general utilizando Node.js deben ser dirigidas al [repositorio de ayuda de Node.js](https://github.com/nodejs/help/issues).

## Discusión de temas no técnicos

La discusión de temas no técnicos (como la propiedad intelectual y registro de marca) deberá ser dirigida al [Repositorio del Comité de Dirección Técnica (TSC por sus siglas en inglés)](https://github.com/nodejs/TSC/issues).

## Enviar un reporte de bug

Al abrir un nuevo problema en el rastreador de problemas `nodejs/node`, los usuarios serán presentados con una plantilla básica que deben completar.

```markdown
<!--
Thank you for reporting an issue.

This issue tracker is for bugs and issues found within Node.js core.
If you require more general support please file an issue on our help
repo. https://github.com/nodejs/help


Please fill in as much of the template below as you're able.

Version: output of `node -v`
Platform: output of `uname -a` (UNIX), or version and 32 or 64-bit (Windows)
Subsystem: if known, please specify affected core module name

If possible, please provide code that demonstrates the problem, keeping it as
simple and free of external dependencies as you are able.
-->

* **Version**:
* **Platform**:
* **Subsystem**:

<!-- Enter your issue details below this comment. -->
```

Si cree que ha encontrado un error en Node.js, por favor complete este formulario, siguiendo la plantilla lo mejor que pueda. No se preocupe si no puede responder cada detalle, sólo llene lo que pueda.

Los dos datos de información más importantes que necesitamos para evaluar adecuadamente el reporte es una descripción del comportamiento que está viendo y un caso simple de prueba que podamos utilizar para recrear el problema nosotros. Si no podemos recrear el problema, es imposible para nosotros corregirlo.

Para evitar la posibilidad de defectos introducidos por código de los usuarios en general, los casos de pruebe deberían estar limitados a usar *solo* APIs de Node.js. Si el error ocurre sólo cuando está utilizan un módulo específico generado por la comunidad, hay una gran posibilidad de que (a) el módulo tenga un error, o (b) algo en Node.js cambió y eso rompió el módulo.

Vea [Cómo crear un ejemplo Mínimo, Completo y Verificable](https://stackoverflow.com/help/mcve).

## Hacer triage de un Bug

Una vez un problema se haya abierto, es común que se genere una discusión sobre el mismo. Algunos colaboradores pueden tener distintas opiniones acerca del problema, incluyendo si el comportamiento que observan es un error o una funcionalidad. Esta discusión es parte del proceso y debería mantener el foco, ser útil y profesional.

Las respuestas breves y recortadas—que no aportan contexto adicional ni detalles de soporte—no son útiles o profesionales. Para muchos, dichas respuesta son simplemente molestas y poco amigables.

Los colaboradores son alentados a ayudarse unos a otros para progresar lo máximo posible, ayudándose unos a otros para resolver los problemas de manera colaborativa. Si se decide comentar sobre un asunto que personalmente no se considera un problema a ser resuelto, o si se encuentra información que se interpreta como incorrecta, es importante explicar *por que* se llega a esa conclusión, aportando contexto para facilitar su comprensión. También, es necesario estar dispuestos a considerar la posibilidad de que el error es propio. Al hacerlo, generalmente podemos llegar a la conclusión correcta de manera mucho más rápida.

## Resolver un reporte de Bug

En la amplia mayoría de los casos, los problemas se resuelven abriendo un Pull Request. El proceso para abrir y revisar un Pull Request es similar al que se describe en Enviar y Hacer triage de un bug, pero conlleva además una revisión necesaria y la aprobación del flujo de trabajo que permita que el cambio sugerido posea la calidad mínima y los requerimientos funcionales básicos del proyecto Node.js.
