# Acerca de esta documentación

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

El objetivo de esta documentación es explicar de forma exhaustiva la API de Node.js, tanto de un punto de vista referencial como conceptual. Cada sección describe un módulo integrado o un concepto de alto nivel.

Cuando es apropiado, los tipos de propiedades, los argumentos de métodos, y los argumentos proporcionados a los manejadores de eventos son detallados en una lista bajo el título de cada tema.

## Contribuyendo

Si encuentras errores en esta documentación, por favor [abre una nueva incidencia](https://github.com/nodejs/node/issues/new) o revisa [la guia de contribución](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) para obtener ayuda en como enviar un arreglo del error.

Cada archivo es generado basado en el correspondiente archivo `.md` en la carpeta `doc/api/` en el arbol fuente de Node.Js. La documentación es generada usando el programa `tools/doc/generate.js`. Una plantilla de HTML está ubicada en `doc/template.html`.

## Índice de Estabilidad

<!--type=misc-->

A lo largo de la documentación se indica la estabilidad de cada sección. La API de Node.js está aún, de cierta forma, cambiando, y mientras se vuelve más madura, ciertas partes son más confiables que otras. Algunas están tan bien probadas, y tan confiables, que es muy poco probable que alguna vez vayan a cambiar. Otras son muy recientes y experimentables, o se sabe que son peligrosas y están en proceso de ser rediseñadas.

Los índices de estabilidad son los siguientes:

```txt
Estabilidad: 0 - Obsoleta
Esta funcionalidad es conocida como problemática, y puede tener cambios planificados. No confíes en ella. Uso de esta funcionalidad puede causar que se emitan advertencias.
La compatibilidad hacia atrás a través de las versiones principales no debe ser esperada.
```

```txt
Estabilidad: 1 - Experimental
Esta funcionalidad está aún bajo desarrollo activo y se encuentra sujeta a cambios de compatibilidad no hacia atrás, o incluso removida, en cualquier versión futura. El uso de esta funcionalidad no es recomendado en entornos de producción. Las características experimentales no son sujetas al modelo versionado semántico de Node.js.
```

```txt
Estabilidad: 2 - Estable
La API ha sido probado satisfactoriamente. Compatibilidad con el ecosistema npm es una prioridad, y no se rompe a menos que sea absolutamente necesaria.
```

*Nota*: Debe tener precaución al usar funcionalidades `Experimentales`, particularmente dentro de módulos que pueden ser usado como dependencias (o dependencias de dependencias) dentro de una aplicación Node.js. Los usuarios finales pueden no ser conscientes que funcionalidades experimentales están siendo usadas, y por lo tanto, pueden experimentar fallos no esperados o cambios en el comportamiento cuando ocurran modificaciones a la API. Para ayudar a evitar tales sorpresas, funcionalidades `Experimentales` pueden requerir una bandera de la línea de comandos para permitirlas explícitamente, o puede causar que una advertencia del proceso sea emitida. Por defecto, dichas advertencias son impresas en [`stderr`][] y pueden ser manejadas adjuntandoles una función oyente al evento [`process.on('warning')`][].

## Salida JSON
<!-- YAML
added: v0.6.12
-->

> Estabilidad: 1 - Experimental

Cada documento `.html` tiene un correspondiente documento `.json` presentando la misma información de forma estructurada. Esta funcionalidad es experimental, y es añadidad para el beneficio de las IDEs y otras utilidade que desean hacer cosas programáticas con la documentación.

## Syscalls y páginas man

Llamadas de Sistemas como open(2) y read(2) definen la interfaz entre los programas de usuario y el sistema operativo subyacente. Las funciones de Node.js que simplemente envuelven a un syscall, como [`fs.open()`][], lo documentarán. Los documentos enlazan a las páginas man correspondientes (abreviación para páginas manuales) las cuales describen cómo funcionan las syscalls.

Algunas syscalls, como Ichown(2), son específicas BSD. Esto significa, por ejemplo, que [`fs.lchown()`][] solo funciona en macOS y otros sistemas BSD derivados, y no está disponible en Linux.

La mayoría de las syscalls tienen equivalentes en Windows, pero el comportamiento puede diferir en Windows relativo a Linux y macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
