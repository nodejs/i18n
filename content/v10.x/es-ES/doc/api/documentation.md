# Acerca de esta documentación

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

La meta de esta documentacion es explicar de forma exhaustiva la API de Node.js, tanto de un punto de vista referencial como conceptual. Cada sección describe un módulo integrado o un concepto de alto nivel.

Cuando es apropiado, los tipos de las propiedades, los argumentos de métodos y los argumentos que se proveen a manejadores de eventos son detallados en una lista bajo el título de cada tema.

## Contribuyendo

Si encuentras errores en esta documentación, por favor [abre una nueva incidencia](https://github.com/nodejs/node/issues/new) o revisa [la guia de contribución](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) para obtener ayuda en como enviar un arreglo del error.

Cada archivo es generado basándose en el archivo `.md` correspondiente en la carpeta `doc/api/` en el árbol fuente de Node.js. La documentación es generada utilizando el programa `tools/doc/generate.js`. Una plantilla de HTML está ubicada en `doc/template.html`.

## Índice de Estabilidad

<!--type=misc-->

A lo largo de la documentación se indica la estabilidad de cada sección. La API de Node.js está aún de cierta forma cambiando, y mientras se vuelve más madura, ciertas partes son más confiables que otras. Algunas están tan bien probadas, y hay Tanya dependencias en ellas, que es muy poco probable que alguna vez vayan a cambiar. Otras son muy recientes y experimentales, o se sabe que son arriesgadas y están en proceso de ser rediseñadas.

Los índices de estabilidad son los siguientes:

```txt
Estabilidad: 0 - Absoleto. Esta funcionalidad/característica se sabe que es problemática y puede tener cambios planificados. No confíes en ella. El uso de esta funcionalidad/característica puede causar que se emitan advertencias. No se espera que se mantenga compatibilidad hacia atrás cuando se actualicen versiones principales.
```

```txt
Estabilidad: 1 - Experimental. This feature is still under active development and
subject to non-backwards compatible changes, or even removal, in any future
version. Use of the feature is not recommended in production environments.
Experimental features are not subject to the Node.js Semantic Versioning model.
```

```txt
Stability: 2 - Stable. The API has proven satisfactory. Compatibility with the
npm ecosystem is a high priority, and will not be broken unless absolutely
necessary.
```

Debe tener precaución al hacer uso de las funcionalidades `Experimental`, particularmente dentro de los módulos que pueden ser usados como dependencias (o dependencias de dependencias) dentro de una aplicación de Node.js. End users may not be aware that experimental features are being used, and therefore may experience unexpected failures or behavior changes when API modifications occur. Para ayudar a evitar tales sorpresas, las funcionalidades `Experimental` pueden requerir una bandera de línea de comando para habilitarlos explícitamente, o podría causar que se emita una advertencia del proceso. Por defecto, dichas advertencias son impresas en [`stderr`][] y pueden ser manejadas adjuntando a un listener al evento [`'warning'`][].

## JSON Output

<!-- YAML
added: v0.6.12
-->

> Estabilidad: 1 - Experimental

Cada documento `.html` tiene un documento `.json` correspondiente que presenta la misma información en una manera estructurada. Esta funcionalidad es experimental, y es añadida para el beneficio de IDEs y otras utilidades que desean hacer cosas programáticas con la documentación.

## Syscalls y páginas man

Llamadas de sistema como open(2) y read(2) definen la interfaz entre los programas de usuario y el sistema operativo subyacente. Las funciones de Node.js que simplemente envuelven a un syscall, como [`fs.open()`][], lo documentarán. Los docs enlazan a las páginas man correspondientes (abreviación para páginas manuales) las cuales describen cómo las syscalls funcionan.

Some syscalls, like lchown(2), are BSD-specific. Eso significa, por ejemplo, que [`fs.lchown()`][] sólo funciona en macOS y otros sistemas derivados de BSD, y no está disponible en Linux.

La mayoría de las syscalls de Unix tiene equivalentes de Windows, pero el comportamiento puede variar en Windows en relación a Linux y macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node issue 4760](https://github.com/nodejs/node/issues/4760).