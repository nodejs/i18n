# VM (运行 JavaScript)

<!--introduced_in=v0.10.0-->

> 稳定性：2 - 稳定

<!--name=vm-->

`vm` 模块提供了用于在 V8 虚拟机上下文中编译和运行代码的一组 API。 **The `vm` module is not a security mechanism. Do not use it to run untrusted code**. The term "sandbox" is used throughout these docs simply to refer to a separate context, and does not confer any security guarantees.

JavaScript 代码可被编译并立即运行，或者编译，保存，并稍后运行。

一个常见的用例就是在一个沙盒环境中运行代码。 沙盒代码使用不同的 V8 上下文，这意味着与代码的其他部分不同，它具有一个不同的全局对象。

可以通过 ["contextifying"](#vm_what_does_it_mean_to_contextify_an_object) 沙盒对象来提供上下文。 The sandboxed code treats any property in the sandbox like a global variable. Any changes to global variables caused by the sandboxed code are reflected in the sandbox object.

```js
const vm = require('vm');

const x = 1;

const sandbox = { x: 2 };
vm.createContext(sandbox); // Contextify the sandbox.

const code = 'x += 40; var y = 17;';
// x and y are global variables in the sandboxed environment.
// Initially, x has the value 2 because that is the value of sandbox.x.
vm.runInContext(code, sandbox);

console.log(sandbox.x); // 42
console.log(sandbox.y); // 17

console.log(x); // 1; y is not defined.
```

## Class: vm.SourceTextModule
<!-- YAML
added: v9.6.0
-->

> 稳定性：1 - 实验中

*This feature is only available with the `--experimental-vm-modules` command flag enabled.*

The `vm.SourceTextModule` class provides a low-level interface for using ECMAScript modules in VM contexts. It is the counterpart of the `vm.Script` class that closely mirrors [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s as defined in the ECMAScript specification.

Unlike `vm.Script` however, every `vm.SourceTextModule` object is bound to a context from its creation. Operations on `vm.SourceTextModule` objects are intrinsically asynchronous, in contrast with the synchronous nature of `vm.Script` objects. With the help of async functions, however, manipulating `vm.SourceTextModule` objects is fairly straightforward.

Using a `vm.SourceTextModule` object requires four distinct steps: creation/parsing, linking, instantiation, and evaluation. These four steps are illustrated in the following example.

This implementation lies at a lower level than the \[ECMAScript Module loader\]\[\]. There is also currently no way to interact with the Loader, though support is planned.

```js
const vm = require('vm');

const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  // Step 1
  //
  // Create a Module by constructing a new `vm.SourceTextModule` object. This
  // parses the provided source text, throwing a `SyntaxError` if anything goes
  // wrong. By default, a Module is created in the top context. But here, we
  // specify `contextifiedSandbox` as the context this Module belongs to.
  //
  // Here, we attempt to obtain the default export from the module "foo", and
  // put it into local binding "secret".

  const bar = new vm.SourceTextModule(`
    import s from 'foo';
    s;
  `, { context: contextifiedSandbox });

  // Step 2
  //
  // "Link" the imported dependencies of this Module to it.
  //
  // The provided linking callback (the "linker") accepts two arguments: the
  // parent module (`bar` in this case) and the string that is the specifier of
  // the imported module. The callback is expected to return a Module that
  // corresponds to the provided specifier, with certain requirements documented
  // in `module.link()`.
  //
  // If linking has not started for the returned Module, the same linker
  // callback will be called on the returned Module.
  //
  // Even top-level Modules without dependencies must be explicitly linked. The
  // callback provided would never be called, however.
  //
  // The link() method returns a Promise that will be resolved when all the
  // Promises returned by the linker resolve.
  //
  // Note: This is a contrived example in that the linker function creates a new
  // "foo" module every time it is called. In a full-fledged module system, a
  // cache would probably be used to avoid duplicated modules.

  async function linker(specifier, referencingModule) {
    if (specifier === 'foo') {
      return new vm.SourceTextModule(`
        // The "secret" variable refers to the global variable we added to
        // "contextifiedSandbox" when creating the context.
        export default secret;
      `, { context: referencingModule.context });

      // Using `contextifiedSandbox` instead of `referencingModule.context`
      // here would work as well.
    }
    throw new Error(`Unable to resolve dependency: ${specifier}`);
  }
  await bar.link(linker);

  // Step 3
  //
  // Instantiate the top-level Module.
  //
  // Only the top-level Module needs to be explicitly instantiated; its
  // dependencies will be recursively instantiated by instantiate().

  bar.instantiate();

  // Step 4
  //
  // Evaluate the Module. The evaluate() method returns a Promise with a single
  // property "result" that contains the result of the very last statement
  // executed in the Module. In the case of `bar`, it is `s;`, which refers to
  // the default export of the `foo` module, the `secret` we set in the
  // beginning to 42.

  const { result } = await bar.evaluate();

  console.log(result);
  // Prints 42.
})();
```

### Constructor: new vm.SourceTextModule(code[, options])

* `code` {string} JavaScript Module code to parse
* `options`
  * `url` {string} URL used in module resolution and stack traces. **Default:** `'vm:module(i)'` where `i` is a context-specific ascending index.
  * `context` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) object as returned by the `vm.createContext()` method, to compile and evaluate this `Module` in.
  * `lineOffset` {integer} Specifies the line number offset that is displayed in stack traces produced by this `Module`.
  * `columnOffset` {integer} Specifies the column number offset that is displayed in stack traces produced by this `Module`.
  * `initializeImportMeta` {Function} Called during evaluation of this `Module` to initialize the `import.meta`. This function has the signature `(meta,
module)`, where `meta` is the `import.meta` object in the `Module`, and `module` is this `vm.SourceTextModule` object.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

Creates a new ES `Module` object.

Properties assigned to the `import.meta` object that are objects may allow the `Module` to access information outside the specified `context`, if the object is created in the top level context. Use `vm.runInContext()` to create objects in a specific context.

```js
const vm = require('vm');

const contextifiedSandbox = vm.createContext({ secret: 42 });

(async () => {
  const module = new vm.SourceTextModule(
    'Object.getPrototypeOf(import.meta.prop).secret = secret;',
    {
      initializeImportMeta(meta) {
        // Note: this object is created in the top context. As such,
        // Object.getPrototypeOf(import.meta.prop) points to the
        // Object.prototype in the top context rather than that in
        // the sandbox.
        meta.prop = {};
      }
    });
  // Since module has no dependencies, the linker function will never be called.
  await module.link(() => {});
  module.instantiate();
  await module.evaluate();

  // Now, Object.prototype.secret will be equal to 42.
  //
  // To fix this problem, replace
  //     meta.prop = {};
  // above with
  //     meta.prop = vm.runInContext('{}', contextifiedSandbox);
})();
```

### module.dependencySpecifiers

* {string[]}

The specifiers of all dependencies of this module. The returned array is frozen to disallow any changes to it.

Corresponds to the `[[RequestedModules]]` field of [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s in the ECMAScript specification.

### module.error

* {any}

If the `module.status` is `'errored'`, this property contains the exception thrown by the module during evaluation. If the status is anything else, accessing this property will result in a thrown exception.

The value `undefined` cannot be used for cases where there is not a thrown exception due to possible ambiguity with `throw undefined;`.

Corresponds to the `[[EvaluationError]]` field of [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)s in the ECMAScript specification.

### module.evaluate([options])

* `options` {Object}
  * `timeout` {integer} Specifies the number of milliseconds to evaluate before terminating execution. If execution is interrupted, an [`Error`][] will be thrown. This value must be a strictly positive integer.
  * `breakOnSigint` {boolean} If `true`, the execution will be terminated when `SIGINT` (Ctrl+C) is received. Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. If execution is interrupted, an [`Error`][] will be thrown.
* Returns: {Promise}

Evaluate the module.

This must be called after the module has been instantiated; otherwise it will throw an error. It could be called also when the module has already been evaluated, in which case it will do one of the following two things:

- return `undefined` if the initial evaluation ended in success (`module.status` is `'evaluated'`)
- rethrow the same exception the initial evaluation threw if the initial evaluation ended in an error (`module.status` is `'errored'`)

This method cannot be called while the module is being evaluated (`module.status` is `'evaluating'`) to prevent infinite recursion.

Corresponds to the [Evaluate() concrete method](https://tc39.github.io/ecma262/#sec-moduleevaluation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.instantiate()

Instantiate the module. This must be called after linking has completed (`linkingStatus` is `'linked'`); otherwise it will throw an error. It may also throw an exception if one of the dependencies does not provide an export the parent module requires.

However, if this function succeeded, further calls to this function after the initial instantiation will be no-ops, to be consistent with the ECMAScript specification.

Unlike other methods operating on `Module`, this function completes synchronously and returns nothing.

Corresponds to the [Instantiate() concrete method](https://tc39.github.io/ecma262/#sec-moduledeclarationinstantiation) field of \[Source Text Module Record\]\[\]s in the ECMAScript specification.

### module.link(linker)

* `linker` {Function}
* Returns: {Promise}

Link module dependencies. This method must be called before instantiation, and can only be called once per module.

Two parameters will be passed to the `linker` function:

- `specifier` The specifier of the requested module:
  <!-- eslint-skip -->
  ```js
  import foo from 'foo';
  //              ^^^^^ the module specifier
  ```
- `referencingModule` The `Module` object `link()` is called on.

The function is expected to return a `Module` object or a `Promise` that eventually resolves to a `Module` object. The returned `Module` must satisfy the following two invariants:

- It must belong to the same context as the parent `Module`.
- Its `linkingStatus` must not be `'errored'`.

If the returned `Module`'s `linkingStatus` is `'unlinked'`, this method will be recursively called on the returned `Module` with the same provided `linker` function.

`link()` returns a `Promise` that will either get resolved when all linking instances resolve to a valid `Module`, or rejected if the linker function either throws an exception or returns an invalid `Module`.

The linker function roughly corresponds to the implementation-defined [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) abstract operation in the ECMAScript specification, with a few key differences:

- The linker function is allowed to be asynchronous while [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) is synchronous.
- The linker function is executed during linking, a Node.js-specific stage before instantiation, while [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) is called during instantiation.

The actual [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) implementation used during module instantiation is one that returns the modules linked during linking. Since at that point all modules would have been fully linked already, the [HostResolveImportedModule](https://tc39.github.io/ecma262/#sec-hostresolveimportedmodule) implementation is fully synchronous per specification.

### module.linkingStatus

* {string}

The current linking status of `module`. It will be one of the following values:

- `'unlinked'`: `module.link()` has not yet been called.
- `'linking'`: `module.link()` has been called, but not all Promises returned by the linker function have been resolved yet.
- `'linked'`: `module.link()` has been called, and all its dependencies have been successfully linked.
- `'errored'`: `module.link()` has been called, but at least one of its dependencies failed to link, either because the callback returned a `Promise` that is rejected, or because the `Module` the callback returned is invalid.

### module.namespace

* {Object}

The namespace object of the module. This is only available after instantiation (`module.instantiate()`) has completed.

Corresponds to the [GetModuleNamespace](https://tc39.github.io/ecma262/#sec-getmodulenamespace) abstract operation in the ECMAScript specification.

### module.status

* {string}

The current status of the module. Will be one of:

- `'uninstantiated'`: The module is not instantiated. It may because of any of the following reasons:

  - The module was just created.
  - `module.instantiate()` has been called on this module, but it failed for some reason.

  This status does not convey any information regarding if `module.link()` has been called. See `module.linkingStatus` for that.

- `'instantiating'`: The module is currently being instantiated through a `module.instantiate()` call on itself or a parent module.

- `'instantiated'`: The module has been instantiated successfully, but `module.evaluate()` has not yet been called.

- `'evaluating'`: The module is being evaluated through a `module.evaluate()` on itself or a parent module.

- `'evaluated'`: The module has been successfully evaluated.

- `'errored'`: The module has been evaluated, but an exception was thrown.

Other than `'errored'`, this status string corresponds to the specification's [Source Text Module Record](https://tc39.github.io/ecma262/#sec-source-text-module-records)'s `[[Status]]` field. `'errored'` corresponds to `'evaluated'` in the specification, but with `[[EvaluationError]]` set to a value that is not `undefined`.

### module.url

* {string}

The URL of the current module, as set in the constructor.

## 类：vm.Script
<!-- YAML
added: v0.3.1
-->

`vm.Script` 类的实例包含预编译的，可在特定沙盒（或 “上下文”）中运行的脚本。

### new vm.Script(code, options)
<!-- YAML
added: v0.3.1
changes:
  - version: v5.7.0
    pr-url: https://github.com/nodejs/node/pull/4777
    description: The `cachedData` and `produceCachedData` options are
                 supported now.
  - version: v10.6.0
    pr-url: https://github.com/nodejs/node/pull/20300
    description: The `produceCachedData` is deprecated in favour of
                 `script.createCachedData()`
-->

* `code` {string} 要编译的 JavaScript 代码。
* `options`
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source. When supplied, the `cachedDataRejected` value will be set to either `true` or `false` depending on acceptance of the data by V8.
  * `produceCachedData` {boolean} 当值为 `true` 时，且 `cachedData` 不存在时，V8 会尝试为 `code` 生成代码缓存数据。 成功后，将生成具有 V8 代码缓存数据的 `Buffer`，并存储在返回的 `vm.Script` 实例的 `cachedData` 属性中。 `cachedDataProduced` 的值将被设置为 `true` 或 `false`，具体取决于代码缓存数据是否被成功生成。 This option is deprecated in favor of `script.createCachedData()`.
  * `importModuleDynamically` {Function} Called during evaluation of this module when `import()` is called. This function has the signature `(specifier, module)` where `specifier` is the specifier passed to `import()` and `module` is this `vm.SourceTextModule`. If this option is not specified, calls to `import()` will reject with [`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`][]. This method can return a [Module Namespace Object](https://tc39.github.io/ecma262/#sec-module-namespace-exotic-objects), but returning a `vm.SourceTextModule` is recommended in order to take advantage of error tracking, and to avoid issues with namespaces that contain `then` function exports.

创建新的 `vm.Script` 对象会编译 `code` 但不会运行它。 编译过的 `vm.Script` 可以在以后被多次运行。 `code` 不会被绑定到任何全局对象；恰恰相反，它在每次运行前被绑定，并只针对该次运行而绑定。

### script.createCachedData()
<!-- YAML
added: v10.6.0
-->

* 返回：{Buffer}

Creates a code cache that can be used with the Script constructor's `cachedData` option. Returns a Buffer. This method may be called at any time and any number of times.

```js
const script = new vm.Script(`
function add(a, b) {
  return a + b;
}

const x = add(1, 2);
`);

const cacheWithoutX = script.createCachedData();

script.runInThisContext();

const cacheWithX = script.createCachedData();
```

### script.runInContext(contextifiedSandbox[, options])
<!-- YAML
added: v0.3.1
changes:
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/6635
    description: The `breakOnSigint` option is supported now.
-->

* `contextifiedSandbox` {Object} 由 `vm.createContext()` 方法返回的 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 对象。
* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. 如果运行被终止，则抛出 [`Error`][]。 This value must be a strictly positive integer.
  * `breakOnSigint`：如果值为 `true`，则在收到 `SIGINT` (Ctrl+C) 时，执行将被终止。 Existing handlers for the event that have been attached via `process.on('SIGINT')` will be disabled during script execution, but will continue to work after that. 如果运行被终止，则抛出 [`Error`][] 。

在已提供的 `contextifiedSandbox` 中运行 `vm.Script` 对象包含的已编译代码，并返回结果。 正在运行的代码不能访问本地作用域。

如下的示例将编译并多次运行代码，该代码会增加全局变量的值，并设置另一个全局变量的值。 全局变量被包含在 `sandbox` 对象中。

```js
const util = require('util');
const vm = require('vm');

const sandbox = {
  animal: 'cat',
  count: 2
};

const script = new vm.Script('count += 1; name = "kitty";');

const context = vm.createContext(sandbox);
for (let i = 0; i < 10; ++i) {
  script.runInContext(context);
}

console.log(util.inspect(sandbox));

// { animal: 'cat', count: 12, name: 'kitty' }
```

Using the `timeout` or `breakOnSigint` options will result in new event loops and corresponding threads being started, which have a non-zero performance overhead.

### script.runInNewContext([sandbox[, options]])
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `contextCodeGeneration` option is supported now.
-->

* `sandbox` {Object} 将被 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 的对象。 如果 `undefined`，将会创建一个新的对象。
* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. 如果运行被终止，则抛出 [`Error`][]。 This value must be a strictly positive integer.
  * `contextName` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `contextCodeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.

首先 contextifies 给定的 `sandbox`，在已创建的沙盒中运行 `vm.Script` 对象包含的已编译代码，并返回结果。 正在运行的代码不能访问本地作用域。

如下的示例编译设置了全局变量的代码，并在不同的上下文中多次运行该代码。 全局变量被赋值，且被包含于每个单独的 `sandbox` 中。

```js
const util = require('util');
const vm = require('vm');

const script = new vm.Script('globalVar = "set"');

const sandboxes = [{}, {}, {}];
sandboxes.forEach((sandbox) => {
  script.runInNewContext(sandbox);
});

console.log(util.inspect(sandboxes));

// [{ globalVar: 'set' }, { globalVar: 'set' }, { globalVar: 'set' }]
```

### script.runInThisContext([options])
<!-- YAML
added: v0.3.1
-->

* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. 如果运行被终止，则抛出 [`Error`][]。 This value must be a strictly positive integer.

在当前 `global` 对象的上下文中运行 `vm.Script` 中包含的已编译代码。 正在运行的代码不能访问本地作用域，但 *可以* 访问当前的 `global` 对象。

如下示例编译增加 `global` 变量值的代码并多次运行该代码：

```js
const vm = require('vm');

global.globalVar = 0;

const script = new vm.Script('globalVar += 1', { filename: 'myfile.vm' });

for (let i = 0; i < 1000; ++i) {
  script.runInThisContext();
}

console.log(globalVar);

// 1000
```

## vm.compileFunction(code[, params[, options]])
<!-- YAML
added: v10.10.0
-->
* `code` {string} The body of the function to compile.
* `params` {string[]} An array of strings containing all parameters for the function.
* `options` {Object}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。 **Default:** `''`.
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。 **默认值：** `0`。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。 **默认值：** `0`。
  * `cachedData` {Buffer|TypedArray|DataView} Provides an optional `Buffer` or `TypedArray`, or `DataView` with V8's code cache data for the supplied source.
  * `produceCachedData` {boolean} Specifies whether to produce new cache data. **默认:** `false`.
  * `parsingContext` {Object} The [contextified](#vm_what_does_it_mean_to_contextify_an_object) sandbox in which the said function should be compiled in.
  * `contextExtensions` {Object[]} An array containing a collection of context extensions (objects wrapping the current scope) to be applied while compiling. **Default:** `[]`.

Compiles the given code into the provided context/sandbox (if no context is supplied, the current context is used), and returns it wrapped inside a function with the given `params`.

## vm.createContext([sandbox[, options]])
<!-- YAML
added: v0.3.1
changes:
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19398
    description: The `sandbox` option can no longer be a function.
  - version: v10.0.0
    pr-url: https://github.com/nodejs/node/pull/19016
    description: The `codeGeneration` option is supported now.
-->

* `sandbox` {Object}
* `options` {Object}
  * `name` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `origin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.
  * `codeGeneration` {Object}
    * `strings` {boolean} If set to false any calls to `eval` or function constructors (`Function`, `GeneratorFunction`, etc) will throw an `EvalError`. **Default:** `true`.
    * `wasm` {boolean} If set to false any attempt to compile a WebAssembly module will throw a `WebAssembly.CompileError`. **Default:** `true`.

如果给定 `sandbox` 对象，`vm.createContext()` 方法将会 [准备沙盒](#vm_what_does_it_mean_to_contextify_an_object)，这样该沙盒就可以在调用 [`vm.runInContext()`][] 或[`script.runInContext()`][] 时被使用。 在该脚本中，`sandbox` 对象将会是全局对象，会保留其所有现有属性，同时具有任何标准 [global object](https://es5.github.io/#x15.1) 具有的内置对象和函数。 在 vm 模块运行脚本之外，全局变量将不被更改。

```js
const util = require('util');
const vm = require('vm');

global.globalVar = 3;

const sandbox = { globalVar: 1 };
vm.createContext(sandbox);

vm.runInContext('globalVar *= 2;', sandbox);

console.log(util.inspect(sandbox)); // { globalVar: 2 }

console.log(util.inspect(globalVar)); // 3
```

如果 `sandbox` 被省略 （或显式传递为 `undefined`），则会返回一个新的空 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 沙盒对象。

`vm.createContext()` 方法主要在创建可运行多个脚本的单一沙盒时有用。 例如，如果模仿一个 web 浏览器，该方法可被用于创建一个代表窗口全局对象的单一沙盒，之后在该沙盒的上下文中一起运行所有标签。

The provided `name` and `origin` of the context are made visible through the Inspector API.

## vm.isContext(sandbox)
<!-- YAML
added: v0.11.7
-->

* `sandbox` {Object}
* 返回：{boolean}

如果给定的 `sandbox` 对象已经通过 [`vm.createContext()`][] 被 [contextified](#vm_what_does_it_mean_to_contextify_an_object)，则返回 `true`。

## vm.runInContext(code, contextifiedSandbox[, options])

* `code` {string} 要编译和运行的 JavaScript 代码。
* `contextifiedSandbox` {Object} 当 `code` 被编译和运行时，将被作为 `global` 的 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 对象。
* `options` {Object|string}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. 如果运行被终止，则抛出 [`Error`][]。 This value must be a strictly positive integer.

`vm.runInContext()` 方法会编译 `code`，在 `contextifiedSandbox` 的上下文中运行该代码，并返回结果。 正在运行的代码不能访问本地作用域。 `contextifiedSandbox` 对象 *必须* 在之前已经通过 [`vm.createContext()`][] 方法被 [contextified](#vm_what_does_it_mean_to_contextify_an_object)。

If `options` is a string, then it specifies the filename.

如下示例使用单一的 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 对象编译并运行不同的脚本。

```js
const util = require('util');
const vm = require('vm');

const sandbox = { globalVar: 1 };
vm.createContext(sandbox);

for (let i = 0; i < 10; ++i) {
  vm.runInContext('globalVar *= 2;', sandbox);
}
console.log(util.inspect(sandbox));

// { globalVar: 1024 }
```

## vm.runInNewContext(code[, sandbox[, options]])
<!-- YAML
added: v0.3.1
-->

* `code` {string} 要编译和运行的 JavaScript 代码。
* `sandbox` {Object} 将被 [contextified](#vm_what_does_it_mean_to_contextify_an_object) 的对象。 如果 `undefined`，将会创建一个新的对象。
* `options` {Object|string}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. 如果运行被终止，则抛出 [`Error`][]。 This value must be a strictly positive integer.
  * `contextName` {string} Human-readable name of the newly created context. **Default:** `'VM Context i'`, where `i` is an ascending numerical index of the created context.
  * `contextOrigin` {string} [Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) corresponding to the newly created context for display purposes. The origin should be formatted like a URL, but with only the scheme, host, and port (if necessary), like the value of the [`url.origin`][] property of a [`URL`][] object. Most notably, this string should omit the trailing slash, as that denotes a path. **Default:** `''`.

`vm.runInNewContext()` 首先会 contextifies 给定的 `sandbox` 对象 （如果传递的是 `undefined`，则会新建一个 `sandbox` ），在创建的上下文中编译和运行 `code` ，并返回结果。 正在运行的代码不能访问本地作用域。

If `options` is a string, then it specifies the filename.

如下示例编译并运行代码，该代码增加一个全局变量的值，并给新的变量赋值。 这些全局变量被包含在 `sandbox` 中。

```js
const util = require('util');
const vm = require('vm');

const sandbox = {
  animal: 'cat',
  count: 2
};

vm.runInNewContext('count += 1; name = "kitty"', sandbox);
console.log(util.inspect(sandbox));

// { animal: 'cat', count: 3, name: 'kitty' }
```

## vm.runInThisContext(code[, options])
<!-- YAML
added: v0.3.1
-->

* `code` {string} 要编译和运行的 JavaScript 代码。
* `options` {Object|string}
  * `filename` {string} 指定此脚本生成的追溯栈中使用的文件名。
  * `lineOffset` {number} 指定此脚本生成的追溯栈中显示的行号偏移量。
  * `columnOffset` {number} 指定此脚本生成的追溯栈中显示的列号偏移量。
  * `displayErrors` {boolean} 当值为 `true` 时，如果在编译 `code` 时发生 [`Error`][] 错误，导致错误的代码行会被附加到追溯栈。
  * `timeout` {integer} Specifies the number of milliseconds to execute `code` before terminating execution. 如果运行被终止，则抛出 [`Error`][]。 This value must be a strictly positive integer.

`vm.runInThisContext()` 会编译 `code`，在当前 `global` 的上下文中运行该代码，并返回结果。 正在运行的代码不能访问本地作用域，但可以访问当前的 `global` 对象。

If `options` is a string, then it specifies the filename.

下面的示例演示如何使用 `vm.runInThisContext()` 和 JavaScript [`eval()`][] 函数来运行同样的代码：
```js
const vm = require('vm');
let localVar = 'initial value';

const vmResult = vm.runInThisContext('localVar = "vm";');
console.log('vmResult:', vmResult);
console.log('localVar:', localVar);

const evalResult = eval('localVar = "eval";');
console.log('evalResult:', evalResult);
console.log('localVar:', localVar);

// vmResult: 'vm', localVar: 'initial value'
// evalResult: 'eval', localVar: 'eval'
```

由于 `vm.runInThisContext()` 不能访问本地作用域，`localVar` 未被更改。 恰恰相反，[`eval()`][] *可以* 访问本地作用域，因此 `localVar` 的值被更改了。 通过这种方式，`vm.runInThisContext()` 就类似于 [间接 `eval()` 调用]，即：`(0,eval)('code')`。

## 示例：在 VM 中运行一个 HTTP 服务器

When using either [`script.runInThisContext()`][] or [`vm.runInThisContext()`][], the code is executed within the current V8 global context. The code passed to this VM context will have its own isolated scope.

为了使用 `http` 模块运行一个简单的 web 服务器，传递给上下文的代码必须自己调用 `require('http')`，或者具有传递给它的 `http` 模块的引用。 例如：

```js
'use strict';
const vm = require('vm');

const code = `
((require) => {
  const http = require('http');

  http.createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('Hello World\\n');
  }).listen(8124);

  console.log('Server running at http://127.0.0.1:8124/');
})`;

vm.runInThisContext(code)(require);
```

The `require()` in the above case shares the state with the context it is passed from. 这可能会在运行不受信任代码时引入风险，即：以不希望的方式更改上下文中的对象。

## "contextify" 一个对象是什么意思？

在 Node.js 中运行的所有 JavaScript 都在 “上下文” 的作用域内运行。 根据 [V8 嵌入式指南](https://github.com/v8/v8/wiki/Embedder's%20Guide#contexts)：

> 在 V8 中，上下文是一个执行环境，它允许在一个单一的 V8 实例中运行分离的，不相关的 JavaScript 应用程序。 你必须显式指定要在其中运行任何 JavaScript 代码的上下文。

当 `vm.createContext()` 方法被调用时，传入的（如果 `sandbox` 是 `undefined`，则是新创建的对象） `sandbox` 对象在内部和一个 V8 上下文的实例相关联。 此 V8 上下文提供了使用 `vm` 模块的方法在一个隔离的，可操作的全局环境中运行的 `code` 。 创建 V8 上下文以及将其和 `sandbox` 对象相关联的过程在此文档中被称作 "contextifying" `sandbox`。

## Timeout limitations when using process.nextTick(), and Promises

Because of the internal mechanics of how the `process.nextTick()` queue and the microtask queue that underlies Promises are implemented within V8 and Node.js, it is possible for code running within a context to "escape" the `timeout` set using `vm.runInContext()`, `vm.runInNewContext()`, and `vm.runInThisContext()`.

For example, the following code executed by `vm.runInNewContext()` with a timeout of 5 milliseconds schedules an infinite loop to run after a promise resolves. The scheduled loop is never interrupted by the timeout:

```js
const vm = require('vm');

function loop() {
  while (1) console.log(Date.now());
}

vm.runInNewContext(
  'Promise.resolve().then(loop);',
  { loop, console },
  { timeout: 5 }
);
```

This issue also occurs when the `loop()` call is scheduled using the `process.nextTick()` function.

This issue occurs because all contexts share the same microtask and nextTick queues.
