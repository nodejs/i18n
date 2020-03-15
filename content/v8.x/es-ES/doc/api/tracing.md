# Seguimiento

<!--introduced_in=v7.7.0-->

El Evento de Seguimiento proporciona un mecanismo para centralizar el seguimiento de información generado por V8, el núcleo de Node, y el código del espacio de usuario.

El seguimiento puede ser habilitado pasando la bandera `--trace-events-enabled` cuando se inicia una aplicación de Node.js.

El conjunto de categorías para el cual se registran seguimientos puede ser especificado utilizando la bandera `--trace-event-categories`, seguido de una lista de nombres de categorías separados por comas. Por defecto, se habilitan las categorías `node`, `node.async_hooks`, y `v8` .

```txt
node --trace-events-enabled --trace-event-categories v8,node,node.async_hooks server.js
```

Ejecutar Node.js con seguimiento habilitado producirá archivos de registro que pueden ser abiertos en la ventana [`chrome://tracing`](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) de Chrome.

El archivo de registro es llamado por defecto `node_trace.${rotation}.log`, donde `${rotation}` es una id ascendiente de la rotación de registros. El patrón de ruta de archivos puede ser específicado con `--trace-event-file-pattern` que acepte una plantilla de string que soporte `${rotation}` y `${pid}`. For example:

```txt
node --trace-events-enabled --trace-event-file-pattern '${pid}-${rotation}.log' server.js
```

Starting with Node 10.0.0, the tracing system uses the same time source as the one used by `process.hrtime()` however the trace-event timestamps are expressed in microseconds, unlike `process.hrtime()` which returns nanoseconds.
