# Modules: `module` API

<!--introduced_in=v0.3.7-->

## The `Module` object

* {Object}

Provides general utility methods when interacting with instances of
`Module`, the [`module`][] variable often seen in [CommonJS][] modules. Accessed
via `import 'module'` or `require('module')`.

### `module.builtinModules`
<!-- YAML
added:
  - v9.3.0
  - v8.10.0
  - v6.13.0
-->

* {string[]}

A list of the names of all modules provided by Node.js. Can be used to verify
if a module is maintained by a third party or not.

`module` in this context isn't the same object that's provided
by the [module wrapper][]. To access it, require the `Module` module:

```js
// module.mjs
// In an ECMAScript module
import { builtinModules as builtin } from 'module';
```

```js
// module.cjs
// In a CommonJS module
const builtin = require('module').builtinModules;
```

### `module.createRequire(filename)`
<!-- YAML
added: v12.2.0
-->

* `filename` {string|URL} Filename to be used to construct the require
  function. Must be a file URL object, file URL string, or absolute path
  string.
* Returns: {require} Require function

```js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// sibling-module.js is a CommonJS module.
const siblingModule = require('./sibling-module');
```

### `module.createRequireFromPath(filename)`
<!-- YAML
added: v10.12.0
deprecated: v12.2.0
-->

> Stability: 0 - Deprecated: Please use [`createRequire()`][] instead.

* `filename` {string} Filename to be used to construct the relative require
  function.
* Returns: {require} Require function

```js
const { createRequireFromPath } = require('module');
const requireUtil = createRequireFromPath('../src/utils/');

// Require `../src/utils/some-tool`
requireUtil('./some-tool');
```

### `module.syncBuiltinESMExports()`
<!-- YAML
added: v12.12.0
-->

The `module.syncBuiltinESMExports()` method updates all the live bindings for
builtin [ES Modules][] to match the properties of the [CommonJS][] exports. It
does not add or remove exported names from the [ES Modules][].

```js
const fs = require('fs');
const { syncBuiltinESMExports } = require('module');

fs.readFile = null;

delete fs.readFileSync;

fs.newAPI = function newAPI() {
  // ...
};

syncBuiltinESMExports();

import('fs').then((esmFS) => {
  assert.strictEqual(esmFS.readFile, null);
  assert.strictEqual('readFileSync' in fs, true);
  assert.strictEqual(esmFS.newAPI, undefined);
});
```

## Source map v3 support
<!-- YAML
added:
 - v13.7.0
 - v12.17.0
-->

> Stability: 1 - Experimental

Helpers for interacting with the source map cache. This cache is
populated when source map parsing is enabled and
[source map include directives][] are found in a modules' footer.

To enable source map parsing, Node.js must be run with the flag
[`--enable-source-maps`][], or with code coverage enabled by setting
[`NODE_V8_COVERAGE=dir`][].

```js
// module.mjs
// In an ECMAScript module
import { findSourceMap, SourceMap } from 'module';
```

```js
// module.cjs
// In a CommonJS module
const { findSourceMap, SourceMap } = require('module');
```

### `module.findSourceMap(path[, error])`
<!-- YAML
added:
 - v13.7.0
 - v12.17.0
-->

* `path` {string}
* `error` {Error}
* Returns: {module.SourceMap}

`path` is the resolved path for the file for which a corresponding source map
should be fetched.

The `error` instance should be passed as the second parameter to `findSourceMap`
in exceptional flows, e.g., when an overridden
[`Error.prepareStackTrace(error, trace)`][] is invoked. Modules are not added to
the module cache until they are successfully loaded, in these cases source maps
will be associated with the `error` instance along with the `path`.

### Class: `module.SourceMap`
<!-- YAML
added:
 - v13.7.0
 - v12.17.0
-->

#### `new SourceMap(payload)`

* `payload` {Object}

Creates a new `sourceMap` instance.

`payload` is an object with keys matching the [Source map v3 format][]:

* `file`: {string}
* `version`: {number}
* `sources`: {string[]}
* `sourcesContent`: {string[]}
* `names`: {string[]}
* `mappings`: {string}
* `sourceRoot`: {string}

#### `sourceMap.payload`

* Returns: {Object}

Getter for the payload used to construct the [`SourceMap`][] instance.

#### `sourceMap.findEntry(lineNumber, columnNumber)`

* `lineNumber` {number}
* `columnNumber` {number}
* Returns: {Object}

Given a line number and column number in the generated source file, returns
an object representing the position in the original file. The object returned
consists of the following keys:

* generatedLine: {number}
* generatedColumn: {number}
* originalSource: {string}
* originalLine: {number}
* originalColumn: {number}

[Source map v3 format]: https://sourcemaps.info/spec.html#h.mofvlxcwqzej
[`--enable-source-maps`]: cli.html#cli_enable_source_maps
[`Error.prepareStackTrace(error, trace)`]: https://v8.dev/docs/stack-trace-api#customizing-stack-traces
[`NODE_V8_COVERAGE=dir`]: cli.html#cli_node_v8_coverage_dir
[`SourceMap`]: #module_class_module_sourcemap
[`createRequire()`]: #module_module_createrequire_filename
[module wrapper]: modules_cjs.html#modules_cjs_the_module_wrapper
[source map include directives]: https://sourcemaps.info/spec.html#h.lmz475t4mvbx
[`module`]: modules.html#modules_the_module_object
[CommonJS]: modules.html
[ES Modules]: esm.html
