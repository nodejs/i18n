# Módulos ECMAScript

<!--introduced_in=v8.5.0-->

<!-- type=misc -->

> Estabilidad: 1 - Experimental

<!--name=esm-->

Node.js contiene soporte para los Módulos ES basado en el [EP de Node.js para Módulos ES](https://github.com/nodejs/node-eps/blob/master/002-es-modules.md).

Not all features of the EP are complete and will be landing as both VM support and implementation is ready. Los mensajes de error todavía están siendo pulidos.

## Habilitación

<!-- type=misc -->

The `--experimental-modules` flag can be used to enable features for loading ESM modules.

Una vez esto haya sido establecido, los archivos que terminan en `.mjs` serán capaces de ser cargados como Módulos ES.

```sh
node --experimental-modules my-app.mjs
```

## Funciones

<!-- type=misc -->

### Soportado

Sólo el argumento CLI para el punto principal de entrada al programa puede ser un punto de entrada a un gráfico ESM. La importación dinámica también puede ser usada para crear puntos de entrada a gráficos ESM en tiempo de ejecución.

#### import.meta

* {Object}

La metapropiedad `import.meta` es un `Object` que contiene la siguiente propiedad:

* `url` {string} La URL del `file:` del módulo absoluta.

### No Soportado

| Función                | Razón                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `require('./foo.mjs')` | Los Módulos ES tienen diferente resolución y sincronización, utilice importación dinámica |

## Diferencias notables entre `import` y `require`

### No hay NODE_PATH

`NODE_PATH` no es parte de la resolución de especificadores de `import`. Por favor, utilice symlinks si se desea este comportamiento.

### No hay `require.extensions`

`require.extensions` no es utilizado por `import`. Lo que se espera es que los loader hooks puedan proporcionar este flujo de trabajo en el futuro.

### No `require.cache`

`require.cache` no es usado por `import`. Tiene un caché separado.

### Rutas basadas en URL

Los ESM son resueltos y almacenados en caché basándose en la semántica de [URL](https://url.spec.whatwg.org/). Esto significa que se necesita escapar de los archivos que contienen caracteres especiales, como `#` y `?`.

Los módulos serán cargados múltiples veces si el especificador `import` utilizado para resolverlos tiene una consulta o fragmento diferente.

```js
import './foo?query=1'; // loads ./foo with query of "?query=1"
import './foo?query=2'; // loads ./foo with query of "?query=2"
```

Por ahora, sólo los módulos que utilicen el protocolo `file:` pueden ser cargados.

## Interop with existing modules

Todos los módulos CommonJS, JSON y C++ pueden ser utilizados con `import`.

Los módulos que se carguen de esta manera sólo se cargarán una vez, incluso si su string de consulta o fragmento difiere entre las declaraciones de `import`.

Al cargarlos a través de `import`, estos módulos proporcionarán una exportación `default` simple que representa el valor de `module.exports` al momento de culminar la evaluación.

```js
import fs from 'fs';
fs.readFile('./foo.txt', (err, body) => {
  if (err) {
    console.error(err);
  } else {
    console.log(body);
  }
});
```

## Loader hooks

<!-- type=misc -->

Para personalizar la resolución del módulo predeterminado, los loader hooks pueden, opcionalmente, ser proporcionados a través de un argumento `--loader ./loader-name.mjs` a Node.js.

When hooks are used they only apply to ES module loading and not to any CommonJS modules loaded.

### Resolve hook

The resolve hook returns the resolved file URL and module format for a given module specifier and parent file URL:

```js
const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

export async function resolve(specifier,
                              parentModuleURL = baseURL,
                              defaultResolver) {
  return {
    url: new URL(specifier, parentModuleURL).href,
    format: 'esm'
  };
}
```

El `parentModuleURL` es proporcionado como `undefined` al realizar la carga principal de Node.js.

The default Node.js ES module resolution function is provided as a third argument to the resolver for easy compatibility workflows.

In addition to returning the resolved file URL value, the resolve hook also returns a `format` property specifying the module format of the resolved module. Este puede ser uno de los siguientes:

| `formato`   | Descripción                                                     |
| ----------- | --------------------------------------------------------------- |
| `'esm'`     | Carga un módulo de JavaScript estándar                          |
| `'cjs'`     | Carga un módulo de CommonJS de estilo nodo                      |
| `'builtin'` | Load a node builtin CommonJS module                             |
| `'json'`    | Carga un archivo JSON                                           |
| `'addon'`   | Carga un [Addon de C++](addons.html)                            |
| `'dynamic'` | Use a [dynamic instantiate hook](#esm_dynamic_instantiate_hook) |

For example, a dummy loader to load JavaScript restricted to browser resolution rules with only JS file extension and Node.js builtin modules support could be written:

```js
import path from 'path';
import process from 'process';
import Module from 'module';

const builtins = Module.builtinModules;
const JS_EXTENSIONS = new Set(['.js', '.mjs']);

const baseURL = new URL('file://');
baseURL.pathname = `${process.cwd()}/`;

export function resolve(specifier, parentModuleURL = baseURL, defaultResolve) {
  if (builtins.includes(specifier)) {
    return {
      url: specifier,
      format: 'builtin'
    };
  }
  if (/^\.{0,2}[/]/.test(specifier) !== true && !specifier.startsWith('file:')) {
    // For node_modules support:
    // return defaultResolve(specifier, parentModuleURL);
    throw new Error(
      `imports must begin with '/', './', or '../'; '${specifier}' does not`);
  }
  const resolved = new URL(specifier, parentModuleURL);
  const ext = path.extname(resolved.pathname);
  if (!JS_EXTENSIONS.has(ext)) {
    throw new Error(
      `Cannot load file with non-JavaScript file extension ${ext}.`);
  }
  return {
    url: resolved.href,
    format: 'esm'
  };
}
```

Con este cargador, corriendo:

```console
NODE_OPTIONS='--experimental-modules --loader ./custom-loader.mjs' node x.js
```

would load the module `x.js` as an ES module with relative resolution support (with `node_modules` loading skipped in this example).

### Dynamic instantiate hook

To create a custom dynamic module that doesn't correspond to one of the existing `format` interpretations, the `dynamicInstantiate` hook can be used. This hook is called only for modules that return `format: 'dynamic'` from the `resolve` hook.

```js
export async function dynamicInstantiate(url) {
  return {
    exports: ['customExportName'],
    execute: (exports) => {
      // get and set functions provided for pre-allocated export names
      exports.customExportName.set('value');
    }
  };
}
```

With the list of module exports provided upfront, the `execute` function will then be called at the exact point of module evaluation order for that module in the import tree.