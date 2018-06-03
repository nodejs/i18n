# Problemas

* [Como contribuir en Problemas](#how-to-contribute-in-issues)
* [Pidiendo ayuda en General](#asking-for-general-help)
* [Discusión de temas no técnicos](#discussing-non-technical-topics)
* [Enviar un reporte de Bug](#submitting-a-bug-report)
* [Hacer triage de un Bug](#triaging-a-bug-report)
* [Resolver un reporte de Bug](#resolving-a-bug-report)

## Como contribuir en Problemas

Para cualquier problema, hay tres maneras fundamentales en la que cualquier individuo puede contribuir:

1. Abriendo el problema a discusión: Por ejemplo, si crees que has descubierto un bug en Node.js, crear un nuevo reporte de problema en el tracker de problemas de `nodejs/node` es la mejor manera de reportarlo.
2. Ayudando a hacer el triage del problema: Esto se puede hacer aportando detalles (por ejemplo, un caso que demuestra el bug), o haciendo sugerencias de como encarar el problema.
3. Ayudando a resolver el problema: Típicamente, esto se hace en el formulario o demostrando que el problema reportado no es un problema a fin de cuentas. También, se estila abrir un pull request que cambia algo en `nodejs/node` de una manera concreta y fácil de revisar.

## Pidiendo ayuda en General

Dado que la actividad en el repositorio de `nodejs/node` es tan alta, las preguntas o peticiones de ayuda en general utilizando Node.js deberán ser dirigidas al [repositorio de ayuda de Node.js](https://github.com/nodejs/help/issues).

## Discusión de temas no técnicos

La discusión de temas no técnicos (como la propiedad intelectual y registro de marca) deberá ser dirigida al [Repositorio TSC](https://github.com/nodejs/TSC/issues).

## Enviar un reporte de bug

Al abrir un nuevo reporte de bug en el tracker de `nodejs/node`, los usuarios serán presentados con un template muy básico para completar.

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

Si cree haber encontrado un bug en Node.js, por favor complete el formulario, siguiendo las instrucciones del template. No es necesario llenar todos los campos, pero si todos aquellos a los que se pueda sumar información.

Los dos datos mas importantes que necesitamos a la hora de evaluar el reporte correctamente son la descripción del comportamiento que observa, y un caso de prueba simple que pueda ser usado para recrear el problema nosotros. Si no podemos recrear el problema, se vuelve imposible de arreglar.

Para evitar la posibilidad de defectos introducidos por código de los usuarios en general, los casos de pruebe deberían estar limitados a usar *solo* APIs de Node.js. Si el defecto ocurre solo cuando se esta usando un módulo generado por la comunidad, hay una gran posibilidad de que (a) el módulo en si tiene un bug/defecto o (b) algo en Node.js cambió y eso rompió el módulo.

Ver [Como crear un ejemplo Mínimo, Completo y Verificable](https://stackoverflow.com/help/mcve).

## Hacer triage de un Bug

Una vez que se ha presentado un problema, es común que se genere una discusión sobre el mismo. Algunos colaboradores pueden tener opiniones variadas respecto al problema, incluyendo la apreciación de que lo presentado sea un defecto o una característica deseada. Esta discusión es parte del proceso y los involucrados deberán comprometerse a mantener el foco, el profesionalismo, y la voluntad de ayudar y contribuir.

Las respuestas breves—que no aportan contexto o detalles—no contribuyen ni son profesionales. Para muchos colaboradores, ese tipo de respuestas son interpretadas como molestas y mal recibidas.

Los colaboradores son alentados a lograr todo el progreso que puedan, ayudándose entre si para resolver los problemas de manera colaborativa. Si se decide comentar sobre un asunto que personalmente no se considera un problema a ser resuelto, o si se encuentra información que se interpreta como incorrecta, es importante explicar *por que* se llega a esa conclusión, aportando contexto para facilitar su comprensión. También, es necesario estar dispuestos a considerar la posibilidad de que el error es propio. Teniendo en cuenta lo anterior, generalmente se llega a la conclusión correcta de manera mucho más rápida.

## Resolver un reporte de Bug

En la amplia mayoría de los casos, los problemas se resuelven abriendo un Pull Request. El proceso para abrir y revisar un Pull Request es similar al que se describe en Enviar y Hacer triage de un bug, pero conlleva además una revisión necesaria y la aprobación del flujo de trabajo que permita que el cambio sugerido posea la calidad mínima y los requerimientos funcionales básicos del proyecto Node.js.