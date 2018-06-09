# Acerca de esta documentación

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

La meta de esta documentacion es explicar de forma exhaustiva la API de Node.js, tanto de un punto de vista referencial como conceptual. Cada sección describe un módulo integrado o un concepto de alto nivel.

Cuando es apropiado, los tipos de las propiedades, los argumentos de métodos y los argumentos que se proveen a manejadores de eventos son detallados en una lista bajo el título de cada tema.

## Contribuyendo

Si encuentras errores en esta documentación, por favor [abre una nueva incidencia](https://github.com/nodejs/node/issues/new) o revisa [la guia de contribución](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) para obtener ayuda en como enviar un arreglo del error.

Every file is generated based on the corresponding `.md` file in the `doc/api/` folder in Node.js's source tree. The documentation is generated using the `tools/doc/generate.js` program. An HTML template is located at `doc/template.html`.

## Stability Index

<!--type=misc-->

A lo largo de la documentación se indica la estabilidad de cada sección. La API de Node.js está aún de cierta forma cambiando, y mientras se vuelve más madura, ciertas partes son más confiables que otras. Algunas están tan bien probadas, y hay Tanya dependencias en ellas, que es muy poco probable que alguna vez vayan a cambiar. Otras son muy recientes y experimentales, o se sabe que son arriesgadas y están en proceso de ser rediseñadas.

Los índices de estabilidad son los siguientes:

```txt
Estabilidad: 0 - Absoleto. Esta funcionalidad/característica se sabe que es problemática y puede tener cambios planificados. Do not rely on it. Use of the feature may cause warnings to be
emitted. Backwards compatibility across major versions should not be expected.
```

```txt
Stability: 1 - Experimental. This feature is still under active development and
subject to non-backwards compatible changes, or even removal, in any future
version. Use of the feature is not recommended in production environments.
Experimental features are not subject to the Node.js Semantic Versioning model.
```

```txt
Stability: 2 - Stable. The API has proven satisfactory. Compatibility with the
npm ecosystem is a high priority, and will not be broken unless absolutely
necessary.
```

Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. End users may not be aware that experimental features are being used, and therefore may experience unexpected failures or behavior changes when API modifications occur. To help avoid such surprises, `Experimental` features may require a command-line flag to explicitly enable them, or may cause a process warning to be emitted. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`'warning'`][] event.

## JSON Output

<!-- YAML
added: v0.6.12
-->

> Stability: 1 - Experimental

Every `.html` document has a corresponding `.json` document presenting the same information in a structured manner. This feature is experimental, and added for the benefit of IDEs and other utilities that wish to do programmatic things with the documentation.

## Syscalls and man pages

System calls like open(2) and read(2) define the interface between user programs and the underlying operating system. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. The docs link to the corresponding man pages (short for manual pages) which describe how the syscalls work.

Some syscalls, like lchown(2), are BSD-specific. That means, for example, that [`fs.lchown()`][] only works on macOS and other BSD-derived systems, and is not available on Linux.

Most Unix syscalls have Windows equivalents, but behavior may differ on Windows relative to Linux and macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node issue 4760](https://github.com/nodejs/node/issues/4760).