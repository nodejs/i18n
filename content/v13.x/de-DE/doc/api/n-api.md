# N-API

<!--introduced_in=v8.0.0-->
<!-- type=misc -->

> Stabilität: 2 - Stabil

N-API (ausgesprochen N wie der Buchstabe, gefolgt von API) ist eine API zum Erstellen von nativen Addons. It is independent from the underlying JavaScript runtime (for example, V8) and is maintained as part of Node.js itself. Diese API wird über alle Versionen von Node.js hinweg Application-Binary-Interface-stabil (ABI) sein. It is intended to insulate Addons from changes in the underlying JavaScript engine and allow modules compiled for one major version to run on later major versions of Node.js without recompilation. The [ABI Stability](https://nodejs.org/en/docs/guides/abi-stability/) guide provides a more in-depth explanation.

Addons are built/packaged with the same approach/tools outlined in the section titled [C++ Addons](addons.html). The only difference is the set of APIs that are used by the native code. Instead of using the V8 or [Native Abstractions for Node.js](https://github.com/nodejs/nan) APIs, the functions available in the N-API are used.

APIs, die von N-API zur Verfügung gestellt werden, werden generell verwendet, um JavaScript-Werte zu erzeugen und zu manipulieren. Concepts and operations generally map to ideas specified in the ECMA-262 Language Specification. Die APIs haben folgende Eigenschaften:

* Alle N-API-Anfragen liefern einen Statuscode vom Typ `napi_status`. Dieser Status gibt an, ob die API-Anfrage erfolgreich war oder nicht.
* Der Rückgabewert der API wird über einen Out-Parameter ausgegeben.
* Alle JavaScript-Werte werden hinter einem undurchsichtigen Typ namens `napi_value` abstrahiert.
* Im Falle eines Fehlerstatuscodes können zusätzliche Informationen über `napi_get_last_error_info` abgerufen werden. Weitere Informationen finden Sie im Bereich [Fehlerbehandlung](#n_api_error_handling).

Die N-API ist eine C-API, die ABI-Stabilität über Node.js-Versionen und verschiedene Compiler-Level hinweg gewährleistet. A C++ API can be easier to use. To support using C++, the project maintains a C++ wrapper module called [node-addon-api](https://github.com/nodejs/node-addon-api). This wrapper provides an inlineable C++ API. Binaries built with `node-addon-api` will depend on the symbols for the N-API C-based functions exported by Node.js. `node-addon-api` is a more efficient way to write code that calls N-API. Take, for example, the following `node-addon-api` code. The first section shows the `node-addon-api` code and the second section shows what actually gets used in the addon.

```C++
Object obj = Object::New(env);
obj["foo"] = String::New(env, "bar");
```

```C++
napi_status status;
napi_value object, string;
status = napi_create_object(env, &object);
if (status != napi_ok) {
  napi_throw_error(env, ...);
  return;
}

status = napi_create_string_utf8(env, "bar", NAPI_AUTO_LENGTH, &string);
if (status != napi_ok) {
  napi_throw_error(env, ...);
  return;
}

status = napi_set_named_property(env, object, "foo", string);
if (status != napi_ok) {
  napi_throw_error(env, ...);
  return;
}
```

The end result is that the addon only uses the exported C APIs. As a result, it still gets the benefits of the ABI stability provided by the C API.

When using `node-addon-api` instead of the C APIs, start with the API [docs](https://github.com/nodejs/node-addon-api#api-documentation) for `node-addon-api`.

## Implications of ABI Stability

Although N-API provides an ABI stability guarantee, other parts of Node.js do not, and any external libraries used from the addon may not. In particular, none of the following APIs provide an ABI stability guarantee across major versions:

* the Node.js C++ APIs available via any of

    ```C++
    #include <node.h>
    #include <node_buffer.h>
    #include <node_version.h>
    #include <node_object_wrap.h>
    ```

* the libuv APIs which are also included with Node.js and available via

    ```C++
    #include <uv.h>
    ```

* the V8 API available via

    ```C++
    #include <v8.h>
    ```

Thus, for an addon to remain ABI-compatible across Node.js major versions, it must make use exclusively of N-API by restricting itself to using

```C
#include <node_api.h>
```

and by checking, for all external libraries that it uses, that the external library makes ABI stability guarantees similar to N-API.

## Aufbau

Unlike modules written in JavaScript, developing and deploying Node.js native addons using N-API requires an additional set of tools. Besides the basic tools required to develop for Node.js, the native addon developer requires a toolchain that can compile C and C++ code into a binary. In addition, depending upon how the native addon is deployed, the *user* of the native addon will also need to have a C/C++ toolchain installed.

For Linux developers, the necessary C/C++ toolchain packages are readily available. [GCC](https://gcc.gnu.org) is widely used in the Node.js community to build and test across a variety of plarforms. For many developers, the [LLVM](https://llvm.org) compiler infrastructure is also a good choice.

For Mac developers, [Xcode](https://developer.apple.com/xcode/) offers all the required compiler tools. However, it is not necessary to install the entire Xcode IDE. The following command installs the necessary toolchain:

```bash
xcode-select --install
```

For Windows developers, [Visual Studio](https://visualstudio.microsoft.com) offers all the required compiler tools. However, it is not necessary to install the entire Visual Studio IDE. The following command installs the necessary toolchain:

```bash
npm install --global --production windows-build-tools
```

The sections below describe the additional tools available for developing and deploying Node.js native addons.

### Build tools

Both the tools listed here require that *users* of the native addon have a C/C++ toolchain installed in order to successfully install the native addon.

#### node-gyp

[node-gyp](https://github.com/nodejs/node-gyp) is a build system based on Google's [GYP](https://gyp.gsrc.io) tool and comes bundled with npm. GYP, and therefore node-gyp, requires that Python be installed.

Historically, node-gyp has been the tool of choice for building native addons. It has widespread adoption and documentation. However, some developers have run into limitations in node-gyp.

#### CMake.js

[CMake.js](https://github.com/cmake-js/cmake-js) is an alternative build system based on [CMake](https://cmake.org).

CMake.js is a good choice for projects that already use CMake or for developers affected by limitations in node-gyp.

### Uploading precompiled binaries

The three tools listed here permit native addon developers and maintainers to create and upload binaries to public or private servers. These tools are typically integrated with CI/CD build systems like [Travis CI](https://travis-ci.org) and [AppVeyor](https://www.appveyor.com) to build and upload binaries for a variety of platforms and architectures. These binaries are then available for download by users who do not need to have a C/C++ toolchain installed.

#### node-pre-gyp

[node-pre-gyp](https://github.com/mapbox/node-pre-gyp) is a tool based on node-gyp that adds the ability to upload binaries to a server of the developer's choice. node-pre-gyp has particularly good support for uploading binaries to Amazon S3.

#### prebuild

[prebuild](https://github.com/prebuild/prebuild) is a tool that supports builds using either node-gyp or CMake.js. Unlike node-pre-gyp which supports a variety of servers, prebuild uploads binaries only to [GitHub releases](https://help.github.com/en/github/administering-a-repository/about-releases). prebuild is a good choice for GitHub projects using CMake.js.

#### prebuildify

[prebuildify](https://github.com/prebuild/prebuildify) is tool based on node-gyp. The advantage of prebuildify is that the built binaries are bundled with the native module when it's uploaded to npm. The binaries are downloaded from npm and are immediately available to the module user when the native module is installed.

## Usage

In order to use the N-API functions, include the file [`node_api.h`][] which is located in the src directory in the node development tree:

```C
#include <node_api.h>
```

This will opt into the default `NAPI_VERSION` for the given release of Node.js. In order to ensure compatibility with specific versions of N-API, the version can be specified explicitly when including the header:

```C
#define NAPI_VERSION 3
#include <node_api.h>
```

This restricts the N-API surface to just the functionality that was available in the specified (and earlier) versions.

Some of the N-API surface is considered experimental and requires explicit opt-in to access those APIs:

```C
#define NAPI_EXPERIMENTAL
#include <node_api.h>
```

In this case the entire API surface, including any experimental APIs, will be available to the module code.

## N-API Version Matrix

N-API versions are additive and versioned independently from Node.js. Version 4 is an extension to version 3 in that it has all of the APIs from version 3 with some additions. This means that it is not necessary to recompile for new versions of Node.js which are listed as supporting a later version.

|       | 1       | 2        | 3        | 4        | 5        |
| ----- | ------- | -------- | -------- | -------- | -------- |
| v6.x  |         |          | v6.14.2* |          |          |
| v8.x  | v8.0.0* | v8.10.0* | v8.11.2  | v8.16.0  |          |
| v9.x  | v9.0.0* | v9.3.0*  | v9.11.0* |          |          |
| v10.x |         |          | v10.0.0  | v10.16.0 |          |
| v11.x |         |          | v11.0.0  | v11.8.0  |          |
| v12.x |         |          |          | v12.0.0  | v12.11.0 |
| v13.x |         |          |          |          | v13.0.0  |

\* Indicates that the N-API version was released as experimental

The N-APIs associated strictly with accessing ECMAScript features from native code can be found separately in `js_native_api.h` and `js_native_api_types.h`. The APIs defined in these headers are included in `node_api.h` and `node_api_types.h`. The headers are structured in this way in order to allow implementations of N-API outside of Node.js. For those implementations the Node.js specific APIs may not be applicable.

The Node.js-specific parts of an addon can be separated from the code that exposes the actual functionality to the JavaScript environment so that the latter may be used with multiple implementations of N-API. In the example below, `addon.c` and `addon.h` refer only to `js_native_api.h`. This ensures that `addon.c` can be reused to compile against either the Node.js implementation of N-API or any implementation of N-API outside of Node.js.

`addon_node.c` is a separate file that contains the Node.js specific entry point to the addon and which instantiates the addon by calling into `addon.c` when the addon is loaded into a Node.js environment.

```C
// addon.h
#ifndef _ADDON_H_
#define _ADDON_H_
#include <js_native_api.h>
napi_value create_addon(napi_env env);
#endif  // _ADDON_H_
```

```C
// addon.c
#include "addon.h"

#define NAPI_CALL(env, call)                                      \
  do {                                                            \
    napi_status status = (call);                                  \
    if (status != napi_ok) {                                      \
      const napi_extended_error_info* error_info = NULL;          \
      napi_get_last_error_info((env), &error_info);               \
      bool is_pending;                                            \
      napi_is_exception_pending((env), &is_pending);              \
      if (!is_pending) {                                          \
        const char* message = (error_info->error_message == NULL) \
            ? "empty error message"                               \
            : error_info->error_message;                          \
        napi_throw_error((env), NULL, message);                   \
        return NULL;                                              \
      }                                                           \
    }                                                             \
  } while(0)

static napi_value
DoSomethingUseful(napi_env env, napi_callback_info info) {
  // Do something useful.
  return NULL;
}

napi_value create_addon(napi_env env) {
  napi_value result;
  NAPI_CALL(env, napi_create_object(env, &result));

  napi_value exported_function;
  NAPI_CALL(env, napi_create_function(env,
                                      "doSomethingUseful",
                                      NAPI_AUTO_LENGTH,
                                      DoSomethingUseful,
                                      NULL,
                                      &exported_function));

  NAPI_CALL(env, napi_set_named_property(env,
                                         result,
                                         "doSomethingUseful",
                                         exported_function));

  return result;
}
```

```C
// addon_node.c
#include <node_api.h>
#include "addon.h"

NAPI_MODULE_INIT() {
  // This function body is expected to return a `napi_value`.
  // The variables `napi_env env` and `napi_value exports` may be used within
  // the body, as they are provided by the definition of `NAPI_MODULE_INIT()`.
  return create_addon(env);
}
```

## Environment Life Cycle APIs

> Stabilität: 1 - Experimentell

[Section 8.7](https://tc39.es/ecma262/#sec-agents) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/) defines the concept of an "Agent" as a self-contained environment in which JavaScript code runs. Multiple such Agents may be started and terminated either concurrently or in sequence by the process.

A Node.js environment corresponds to an ECMAScript Agent. In the main process, an environment is created at startup, and additional environments can be created on separate threads to serve as [worker threads](https://nodejs.org/api/worker_threads.html). When Node.js is embedded in another application, the main thread of the application may also construct and destroy a Node.js environment multiple times during the life cycle of the application process such that each Node.js environment created by the application may, in turn, during its life cycle create and destroy additional environments as worker threads.

From the perspective of a native addon this means that the bindings it provides may be called multiple times, from multiple contexts, and even concurrently from multiple threads.

Native addons may need to allocate global state of which they make use during their entire life cycle such that the state must be unique to each instance of the addon.

To this env, N-API provides a way to allocate data such that its life cycle is tied to the life cycle of the Agent.

### napi_set_instance_data
<!-- YAML
added: v12.8.0
napiVersion: 6
-->

```C
napi_status napi_set_instance_data(napi_env env,
                                   void* data,
                                   napi_finalize finalize_cb,
                                   void* finalize_hint);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] data`: The data item to make available to bindings of this instance.
* `[in] finalize_cb`: The function to call when the environment is being torn down. The function receives `data` so that it might free it.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API associates `data` with the currently running Agent. `data` can later be retrieved using `napi_get_instance_data()`. Any existing data associated with the currently running Agent which was set by means of a previous call to `napi_set_instance_data()` will be overwritten. If a `finalize_cb` was provided by the previous call, it will not be called.

### napi_get_instance_data
<!-- YAML
added: v12.8.0
napiVersion: 6
-->

```C
napi_status napi_get_instance_data(napi_env env,
                                   void** data);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[out] data`: The data item that was previously associated with the currently running Agent by a call to `napi_set_instance_data()`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API retrieves data that was previously associated with the currently running Agent via `napi_set_instance_data()`. If no data is set, the call will succeed and `data` will be set to `NULL`.

## Grundlegende N-API-Datentypen

N-API stellt die folgenden grundlegenden Datentypen als Abstraktionen dar, die von den verschiedenen APIs verbraucht werden. Diese APIs sollten nur mit anderen N-API-Anfragen als undurchsichtig und introspektierbar behandelt werden.

### napi_status
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Integrierter Statuscode, der den Erfolg oder Misserfolg einer N-API-Anfrage anzeigt. Derzeit werden die folgenden Statuscodes unterstützt.

```C
typedef enum {
  napi_ok,
  napi_invalid_arg,
  napi_object_expected,
  napi_string_expected,
  napi_name_expected,
  napi_function_expected,
  napi_number_expected,
  napi_boolean_expected,
  napi_array_expected,
  napi_generic_failure,
  napi_pending_exception,
  napi_cancelled,
  napi_escape_called_twice,
  napi_handle_scope_mismatch,
  napi_callback_scope_mismatch,
  napi_queue_full,
  napi_closing,
  napi_bigint_expected,
  napi_date_expected,
  napi_arraybuffer_expected,
  napi_detachable_arraybuffer_expected,
} napi_status;
```

Werden zusätzliche Informationen benötigt, wenn eine API einen fehlgeschlagenen Status zurücksendet, können diese durch eine Anfrage von `napi_get_last_error_info` erlangt werden.

### napi_extended_error_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
typedef struct {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
} napi_extended_error_info;
```

* `error_message`: UTF8-kodierter String, der eine VM-neutrale Beschreibung des Fehlers enthält.
* `engine_reserved`: Reserviert für VM-spezifische Fehlerdetails. Dies ist derzeit für keine VM implementiert.
* `engine_error_code`: VM-spezifischer Fehlercode. Dies ist derzeit für keine VM implementiert.
* `error_code`: Der N-API-Statuscode, der mit dem letzten Fehler entstanden ist.

Siehe Abschnitt [Fehlerbehandlung](#n_api_error_handling) für weitere Informationen.

### napi_env

`napi_env` wird verwendet, um einen Kontext darzustellen, den die zugrunde liegende N-API-Implementierung verwenden kann, um den VM-spezifischen Zustand zu erhalten. Diese Struktur wird an native Funktionen übertragen, wenn sie aufgerufen werden und sie muss bei N-API-Anfragen rückübertragen werden. Insbesondere müssen die gleichen `napi_env`, die beim Aufruf der ursprünglichen nativen Funktion übergeben wurden, an alle nachfolgenden geschachtelten N-API-Anfragen übergeben werden. Caching the `napi_env` for the purpose of general reuse, and passing the `napi_env` between instances of the same addon running on different [`Worker`][] threads is not allowed. The `napi_env` becomes invalid when an instance of a native addon is unloaded. Notification of this event is delivered through the callbacks given to [`napi_add_env_cleanup_hook`][] and [`napi_set_instance_data`][].

### napi_value

Dies ist ein undurchsichtiger Verweis, der verwendet wird, um einen JavaScript-Wert darzustellen.

### napi_threadsafe_function
<!-- YAML
added: v10.6.0
napiVersion: 4
-->

This is an opaque pointer that represents a JavaScript function which can be called asynchronously from multiple threads via `napi_call_threadsafe_function()`.

### napi_threadsafe_function_release_mode
<!-- YAML
added: v10.6.0
napiVersion: 4
-->

A value to be given to `napi_release_threadsafe_function()` to indicate whether the thread-safe function is to be closed immediately (`napi_tsfn_abort`) or merely released (`napi_tsfn_release`) and thus available for subsequent use via `napi_acquire_threadsafe_function()` and `napi_call_threadsafe_function()`.

```C
typedef enum {
  napi_tsfn_release,
  napi_tsfn_abort
} napi_threadsafe_function_release_mode;
```

### napi_threadsafe_function_call_mode
<!-- YAML
added: v10.6.0
napiVersion: 4
-->

A value to be given to `napi_call_threadsafe_function()` to indicate whether the call should block whenever the queue associated with the thread-safe function is full.

```C
typedef enum {
  napi_tsfn_nonblocking,
  napi_tsfn_blocking
} napi_threadsafe_function_call_mode;
```

### N-API Memory Management types
#### napi_handle_scope

Dies ist eine Abstraktion, die verwendet wird, um die Lebensdauer von Objekten, die in einem bestimmten Bereich erstellt wurden, zu steuern und zu verändern. Im Allgemeinen werden N-API-Werte im Rahmen eines Handle-Scopes erstellt. Wenn eine native Methode von JavaScript abgerufen wird, existiert ein Standard-Handle-Bereich. Wenn der Benutzer nicht explizit einen neuen Handle-Bereich anlegt, werden N-API-Werte im Standard-Handle-Bereich angelegt. Für alle Aufrufe von Code außerhalb der Ausführung einer nativen Methode (z.B. während einer libuv-Callback-Anfrage) muss das Modul einen Bereich erstellen, bevor es Funktionen aufruft, die zur Erzeugung von JavaScript-Werten führen können.

Handle-Scopes werden mit [`napi_open_handle_scope`][] erstellt und mit [`napi_close_handle_scope`][] vernichtet. Closing the scope can indicate to the GC that all `napi_value`s created during the lifetime of the handle scope are no longer referenced from the current stack frame.

Weitere Informationen finden Sie unter [Object Lifetime Management](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Escapable-Handle-Bereiche sind eine spezielle Art von Handle-Bereichen, deren Zweck es ist, die innerhalb eines bestimmten Handle-Bereichs erzeugten Werte an einen übergeordneten Bereich zurückzusenden.

#### napi_ref
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Dies ist die Abstraktion, die verwendet wird, um auf eine 

`napi_value` zu verweisen. Dies ermöglicht es den Benutzern, die Lebensdauer von JavaScript-Werten, einschließlich der genauen Festlegung ihrer Mindestlebensdauer, zu verwalten.

Weitere Informationen finden Sie unter [Object Lifetime Management](#n_api_object_lifetime_management).

### N-API Callback-Typen
#### napi_callback_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Undurchsichtiger Datentyp, der an eine Callback-Funktion weitergegeben wird. Er kann verwendet werden, um zusätzliche Informationen über den Kontext, in dem der Callback aufgerufen wurde, zu erhalten.

#### napi_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Funktionsverweistyp für vom Benutzer bereitgestellte native Funktionen, die in JavaScript über die N-API eingebunden werden sollen. Callback-Funktionen sollten die folgende Signatur erfüllen:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Funktionsverweistyp für zusätzlich zur Verfügung gestellte Funktionen, der es dem Benutzer ermöglicht benachrichtigt zu werden, wenn externe Daten bereit sind, bereinigt zu werden, weil das Objekt, mit dem sie verknüpft waren, unbrauchbar geworden ist. Der Benutzer muss eine Funktion zur Verfügung stellen, welche die folgende Signatur erfüllt, die auf die Sammlung des Objekts angewandt wird. Derzeit kann 

`napi_finalize` verwendet werden, um herauszufinden, wann Objekte mit externen Daten gesammelt werden.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```

#### napi_async_execute_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Funktionsverweis, der mit Funktionen benutzt wird, die asynchrone Operationen unterstützen. Callback functions must satisfy the following signature:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

Implementations of this function must avoid making N-API calls that execute JavaScript or interact with JavaScript objects.  N-API calls should be in the `napi_async_complete_callback` instead. Do not use the `napi_env` parameter as it will likely result in execution of JavaScript.

#### napi_async_complete_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Funktionsverweis, der mit Funktionen benutzt wird, die asynchrone Operationen unterstützen. Callback functions must satisfy the following signature:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

#### napi_threadsafe_function_call_js
<!-- YAML
added: v10.6.0
napiVersion: 4
-->

Function pointer used with asynchronous thread-safe function calls. The callback will be called on the main thread. Its purpose is to use a data item arriving via the queue from one of the secondary threads to construct the parameters necessary for a call into JavaScript, usually via `napi_call_function`, and then make the call into JavaScript.

The data arriving from the secondary thread via the queue is given in the `data` parameter and the JavaScript function to call is given in the `js_callback` parameter.

N-API sets up the environment prior to calling this callback, so it is sufficient to call the JavaScript function via `napi_call_function` rather than via `napi_make_callback`.

Callback functions must satisfy the following signature:

```C
typedef void (*napi_threadsafe_function_call_js)(napi_env env,
                                                 napi_value js_callback,
                                                 void* context,
                                                 void* data);
```

* `[in] env`: The environment to use for API calls, or `NULL` if the thread-safe function is being torn down and `data` may need to be freed.
* `[in] js_callback`: The JavaScript function to call, or `NULL` if the thread-safe function is being torn down and `data` may need to be freed. It may also be `NULL` if the thread-safe function was created without `js_callback`.
* `[in] context`: The optional data with which the thread-safe function was created.
* `[in] data`: Data created by the secondary thread. It is the responsibility of the callback to convert this native data to JavaScript values (with N-API functions) that can be passed as parameters when `js_callback` is invoked. This pointer is managed entirely by the threads and this callback. Thus this callback should free the data.

## Fehlerbehandlung

Die N-API verwendet sowohl Rückgabewerte als auch JavaScript-Exceptions zur Fehlerbehandlung. Die folgenden Abschnitte erklären die Vorgehensweise für den jeweiligen Fall.

### Rückgabewerte

Alle N-API-Funktionen haben das gleiche Fehlerbehandlungsmuster. Der Rückgabetyp aller API-Funktionen ist `napi_status`.

Der Rückgabewert ist `napi_ok`, wenn die Anfrage erfolgreich war und keine nicht abgefangene Javascript-Exception aufgetreten ist. Wenn ein Fehler UND eine Exception aufgetreten sind, wird der `napi_status`-Wert für den Fehler zurückgesendet. Wenn eine Exception, aber kein Fehler aufgetreten ist, wird `napi_pending_exception` zurückgesendet.

In Fällen, in denen ein anderer Rückgabewert als `napi_ok` oder `napi_pending_exception` zurückgegeben wird, muss [`napi_is_exception_pending`][] aufgerufen werden, um zu prüfen, ob eine Exception aussteht. Weitere Details finden Sie im Abschnitt über Exceptions.

The full set of possible `napi_status` values is defined in `napi_api_types.h`.

Der `napi_status`-Rückgabewert liefert eine VM-unabhängige Darstellung vom aufgetretenen Fehler. In manchen Fällen ist es sinnvoll, detailliertere Informationen zu erhalten, einschließlich eines Strings, der den Fehler darstellt, sowie VM (Engine)-spezifische Informationen.

Um diese Informationen abzurufen, wird [`napi_get_last_error_info`][] bereitgestellt, die eine `napi_extended_error_info`-Struktur liefert. Das Format der `napi_extended_error_info`-Struktur ist wie folgt:

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
typedef struct napi_extended_error_info {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
};
```

* `error_message`: Textliche Darstellung des aufgetretenen Fehlers.
* `engine_reserved`: Opaque-Handle, der nur für die Verwendung der Engine reserviert ist.
* `engine_error_code`: VM-spezifischer Fehler-Code.
* `error_code`: N-API-Statuscode für den letzten Fehler.

[`napi_get_last_error_info`][] liefert die Informationen für die letzte N-API-Anfrage.

Do not rely on the content or format of any of the extended information as it is not subject to SemVer and may change at any time. It is intended only for logging purposes.

#### napi_get_last_error_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status
napi_get_last_error_info(napi_env env,
                         const napi_extended_error_info** result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: Die `napi_extended_error_info`-Struktur mit mehr Informationen über den Fehler.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API retrieves a `napi_extended_error_info` structure with information about the last error that occurred.

The content of the `napi_extended_error_info` returned is only valid up until an n-api function is called on the same `env`.

Do not rely on the content or format of any of the extended information as it is not subject to SemVer and may change at any time. It is intended only for logging purposes.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

### Exceptions

Jeder N-API-Funktionsaufruf kann zu einer ausstehenden JavaScript-Exception führen. Dies ist natürlich der Fall für jede Funktion, die die Ausführung von JavaScript verursachen kann, aber die N-API gibt an, dass eine Exception bei der Rückkehr von einer der vielen API-Funktionen ausstehen kann.

Wenn der von einer Funktion zurückgegebene `napi_status` `napi_ok` ist, dann ist keine Exception ausstehend und es ist keine zusätzliche Aktion erforderlich. Wenn der zurückgegebene `napi_status` etwas anderes als `napi_ok` oder `napi_pending_exception` ist, muss, um zu versuchen, sich wiederherzustellen und fortzusetzen, anstatt einfach sofort zurückzusenden, [`napi_is_exception_pending`][] aufgerufen werden, um festzustellen, ob eine Exception ausstehend ist oder nicht.

In many cases when an N-API function is called and an exception is already pending, the function will return immediately with a `napi_status` of `napi_pending_exception`. However, this is not the case for all functions. N-API allows a subset of the functions to be called to allow for some minimal cleanup before returning to JavaScript. In that case, `napi_status` will reflect the status for the function. It will not reflect previous pending exceptions. To avoid confusion, check the error status after every function call.

Wenn eine Exception aussteht, kann einer von zwei Ansätzen verwendet werden.

Der erste Ansatz besteht darin, eine entsprechende Bereinigung durchzuführen und dann so zurückzukehren, sodass die Ausführung zu JavaScript zurückgesendet wird. As part of the transition back to JavaScript, the exception will be thrown at the point in the JavaScript code where the native method was invoked. The behavior of most N-API calls is unspecified while an exception is pending, and many will simply return `napi_pending_exception`, so do as little as possible and then return to JavaScript where the exception can be handled.

Der zweite Ansatz ist der Versuch, die Exception zu behandeln. Es wird Fälle geben, in denen der native Code die Exception abfangen, die entsprechenden Maßnahmen ergreifen und dann fortfahren kann. Dies wird nur in bestimmten Fällen empfohlen, in denen bekannt ist, dass die Exception sicher behandelt werden kann. In diesen Fällen kann[`napi_get_and_clear_last_exception`][] verwendet werden, um die Exception zu erfassen und zu löschen. On success, result will contain the handle to the last JavaScript `Object` thrown. If it is determined, after retrieving the exception, the exception cannot be handled after all it can be re-thrown it with [`napi_throw`][] where error is the JavaScript `Error` object to be thrown.

The following utility functions are also available in case native code needs to throw an exception or determine if a `napi_value` is an instance of a JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] and [`napi_is_error`][].

The following utility functions are also available in case native code needs to create an `Error` object: [`napi_create_error`][], [`napi_create_type_error`][], and [`napi_create_range_error`][], where result is the `napi_value` that refers to the newly created JavaScript `Error` object.

Das Projekt Node.js fügt Fehlercodes zu allen intern erzeugten Fehlern hinzu. Das Ziel ist es, dass Anwendungen diese Fehlercodes für alle Fehlerüberprüfungen verwenden. Die zugehörigen Fehlermeldungen bleiben erhalten, sind aber nur für die Protokollierung und Anzeige gedacht mit der Erwartung, dass sich die Meldung ohne Anwendung von SemVer ändern kann. Um dieses Modell mit N-API sowohl in der internen Funktionalität als auch für die modulspezifische Funktionalität (wie es die übliche Vorgehensweise ist) zu unterstützen, nehmen die `throw_`- und `create_`-Funktionen einen optionalen Codeparameter, der die Zeichenkette für den Code ist, der dem Fehlerobjekt hinzugefügt werden soll. Wenn der optionale Parameter NULL ist, wird dem Fehler kein Code zugeordnet. Wenn ein Code angegeben wird, wird auch der dem Fehler zugeordnete Name aktualisiert auf:

```text
originalName [code]
```

where `originalName` is the original name associated with the error and `code` is the code that was provided. For example, if the code is `'ERR_ERROR_1'` and a `TypeError` is being created the name will be:

```text
TypeError [ERR_ERROR_1]
```

#### napi_throw
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_throw(napi_env env, napi_value error);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] error`: Der JavaScript-Wert, der ausgeworfen werden soll.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API wirft den angegebenen JavaScript-Wert aus.

#### napi_throw_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_throw_error(napi_env env,
                                         const char* code,
                                         const char* msg);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] code`: Optionaler Fehlercode, der bei einem Fehler eingestellt werden kann.
* `[in] msg`: C string representing the text to be associated with the error.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API wirft einen JavaScript-`Fehler` mit dem angegebenen Text aus.

#### napi_throw_type_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_throw_type_error(napi_env env,
                                              const char* code,
                                              const char* msg);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] code`: Optionaler Fehlercode, der bei einem Fehler eingestellt werden kann.
* `[in] msg`: C string representing the text to be associated with the error.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API wirft einen JavaScript-`Schreibfehler` mit dem angegebenen Text aus.

#### napi_throw_range_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_throw_range_error(napi_env env,
                                               const char* code,
                                               const char* msg);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] code`: Optionaler Fehlercode, der bei einem Fehler eingestellt werden kann.
* `[in] msg`: C string representing the text to be associated with the error.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API wirft einen JavaScript-`Bereichsfehler` mit dem angegebenen Text aus.

#### napi_is_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_is_error(napi_env env,
                                      napi_value value,
                                      bool* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The `napi_value` to be checked.
* `[out] result`: Boolean-Wert, der auf true gesetzt wird, wenn `napi_value` einen Fehler darstellt, sonst false.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API fragt eine `napi_value` ab, um zu prüfen, ob es sich um ein Fehlerobjekt handelt.

#### napi_create_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_create_error(napi_env env,
                                          napi_value code,
                                          napi_value msg,
                                          napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` repräsentiert den erzeugten Fehler.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen JavaScript-`Fehler` mit dem angegebenen Text aus.

#### napi_create_type_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_create_type_error(napi_env env,
                                               napi_value code,
                                               napi_value msg,
                                               napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` repräsentiert den erzeugten Fehler.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen JavaScript-`TypeError` mit dem angegebenen Text aus.

#### napi_create_range_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_create_range_error(napi_env env,
                                                napi_value code,
                                                napi_value msg,
                                                napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` repräsentiert den erzeugten Fehler.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen JavaScript-`RangeError` mit dem angegebenen Text aus.

#### napi_get_and_clear_last_exception
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: Die Exception, wenn eine aussteht, ansonsten NULL.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

#### napi_is_exception_pending
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: Boolean-Wert, der auf true gesetzt wird, wenn eine Exception aussteht.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

#### napi_fatal_exception
<!-- YAML
added: v9.10.0
napiVersion: 3
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] err`: The error that is passed to `'uncaughtException'`.

Eine `'uncaughtException'` in JavaScript auslösen. Nützlich, wenn ein asynchroner Rückruf eine Exception auslöst, die keine Möglichkeit zur Wiederherstellung bietet.

### Schwere Fehler

Im Falle eines nicht behebbaren Fehlers in einem nativen Modul kann ein schwerer Fehler ausgelöst werden, um den Prozess sofort zu beenden.

#### napi_fatal_error
<!-- YAML
added: v8.2.0
napiVersion: 1
-->

```C
NAPI_NO_RETURN void napi_fatal_error(const char* location,
                                                 size_t location_len,
                                                 const char* message,
                                                 size_t message_len);
```

* `[in] location`: Optionale Stelle, an der der Fehler aufgetreten ist.
* `[in] location_len`: Die Länge der Position in Bytes oder `NAPI_AUTO_LENGTH`, wenn sie null-terminiert ist.
* `[in] message`: Die mit dem Fehler im Zusammenhang stehende Nachricht.
* `[in] message_len`: The length of the message in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.

Der Funktionsaufruf wird nicht zurückgesendet, der Prozess wird abgebrochen.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

## Object Lifetime Management

Während N-API-Aufrufe erfolgen, können Handles auf Objekte im Heap für die zugrunde liegende VM als `napi_values` zurückgesendet werden. Diese Handles müssen die Objekte so lange "live" halten, bis sie vom nativen Code nicht mehr benötigt werden, sonst könnten die Objekte eingesammelt werden, bevor der native Code sie benutzt hat.

Wenn Objekt-Handles zurückgesendet werden, sind sie mit einem 'Scope' verknüpft. Die Lebensdauer für den Standard-Scope ist an die Lebensdauer des nativen Methodenaufrufs gebunden. Das Ergebnis ist, dass die Handles standardmäßig gültig bleiben und die mit diesen Handles verbundenen Objekte während der Lebensdauer des nativen Methodenaufrufs live gehalten werden.

In vielen Fällen ist es jedoch notwendig, dass die Handles entweder für eine kürzere oder längere Lebensdauer als die der nativen Methode gültig bleiben. The sections which follow describe the N-API functions that can be used to change the handle lifespan from the default.

### Die Lebensdauer des Handles kürzer halten als bei der nativen Methode
Oftmals ist es notwendig, die Lebensdauer von Handles kürzer zu halten als die Lebensdauer einer nativen Methode. Betrachten Sie zum Beispiel eine native Methode, die einen Loop hat, die die Elemente in einem großen Array durchläuft:

```C
for (int i = 0; i < 1000000; i++) {
  napi_value result;
  napi_status status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // do something with element
}
```

Dies würde dazu führen, dass eine große Anzahl von Handles erstellt werden, die erhebliche Ressourcen verbrauchen. Zusätzlich, obwohl der native Code nur das neueste Handle verwenden kann, werden auch alle zugehörigen Objekte am Leben erhalten, da sie alle den gleichen Scope haben.

Um diesen Fall zu bearbeiten, bietet N-API die Möglichkeit, einen neuen "Scope" zu erstellen, dem neu erstellte Handles zugeordnet werden. Sobald diese Handles nicht mehr benötigt werden, kann der Scope geschlossen werden und alle mit dem Scope verbundenen Handles werden invalidiert. Die verfügbaren Methoden um Scopes zu öffnen/zu schließen sind [`napi_open_handle_scope`][] und [`napi_close_handle_scope`][].

N-API unterstützt nur eine einzige verschachtelte Hierarchie von Scopes. Es gibt zu jeder Zeit nur einen aktiven Scope, und alle neuen Handles werden diesem Scope zugeordnet, während er aktiv ist. Die Scopes müssen in umgekehrter Reihenfolge geschlossen werden, in der sie geöffnet werden. Darüber hinaus müssen alle innerhalb einer nativen Methode erstellten Scopes geschlossen werden, bevor von dieser Methode zurückgekehrt wird.

Im früheren Beispiel würde das Hinzufügen von Aufrufen zu [`napi_open_handle_scope`][] und [`napi_close_handle_scope`][] sicherstellen, dass höchstens ein einziges Handle während der Ausführung des Loops gültig ist:

```C
for (int i = 0; i < 1000000; i++) {
  napi_handle_scope scope;
  napi_status status = napi_open_handle_scope(env, &scope);
  if (status != napi_ok) {
    break;
  }
  napi_value result;
  status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // do something with element
  status = napi_close_handle_scope(env, scope);
  if (status != napi_ok) {
    break;
  }
}
```

Beim Verschachteln von Scopes gibt es Fälle, in denen ein Handle aus einem inneren Scope über die Lebensdauer dieses Scopes hinaus leben muss. N-API unterstützt einen 'Escapable-Scope', um diesen Fall zu unterstützen. Ein Escapable-Scope ermöglicht es, ein Handle zu "fördern", sodass es dem aktuellen Scope "entkommt" und die Lebensdauer des Handles vom aktuellen Scope zu der des äußeren Scopes wechselt.

The methods available to open/close escapable scopes are [`napi_open_escapable_handle_scope`][] and [`napi_close_escapable_handle_scope`][].

Die Aufforderung zur Förderung eines Handles erfolgt über [`napi_escape_handle`][], die nur einmal aufgerufen werden kann.

#### napi_open_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: `napi_value` repräsentiert den neuen Scope.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API öffnet ein neues Scope.

#### napi_close_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] scope`: `napi_value` repräsentiert den zu schließenden Scope.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API schließt den eingegebenen Scope. Die Scopes müssen in umgekehrter Reihenfolge geschlossen werden, aus der sie erstellt wurden.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

#### napi_open_escapable_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status
    napi_open_escapable_handle_scope(napi_env env,
                                     napi_handle_scope* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: `napi_value` repräsentiert den neuen Scope.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API öffnet einen neuen Scope, von dem aus ein Objekt in den äußeren Scope verschoben werden kann.

#### napi_close_escapable_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status
    napi_close_escapable_handle_scope(napi_env env,
                                      napi_handle_scope scope);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] scope`: `napi_value` repräsentiert den zu schließenden Scope.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API schließt den eingegebenen Scope. Die Scopes müssen in umgekehrter Reihenfolge geschlossen werden, aus der sie erstellt wurden.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

#### napi_escape_handle
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] scope`: `napi_value` repräsentiert den aktuellen Scope.
* `[in] escapee`: `napi_value` representing the JavaScript `Object` to be escaped.
* `[out] result`: `napi_value` representing the handle to the escaped `Object` in the outer scope.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API fördert das Handle des JavaScript-Objekts, sodass es für die gesamte Lebensdauer des äußeren Scopes gültig ist. Sie kann nur einmal pro Scope aufgerufen werden. Wenn sie mehr als einmal aufgerufen wird, wird ein Fehler zurückgesendet.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

### Verweise auf Objekte mit einer längeren Lebensdauer als die der nativen Methode

In einigen Fällen muss ein Addon in der Lage sein, Objekte mit einer längeren Lebensdauer als die einer einzigen nativen Methodenaufrufung zu erstellen und zu referenzieren. Um beispielsweise einen Konstruktor anzulegen und diesen Konstruktor später in einem Request zum Erzeugen von Instanzen zu verwenden, muss es möglich sein, das Konstruktorobjekt über viele verschiedene Instanzerstellungsrequests hinweg zu referenzieren. Dies wäre nicht möglich, wenn, wie im vorigen Abschnitt beschrieben, ein normales Handle als `napi_value` zurückgesendet würde. Die Lebensdauer eines normalen Handles wird von Scopes verwaltet und alle Scopes müssen vor dem Ende einer nativen Methode geschlossen werden.

N-API bietet Methoden zum Erstellen persistenter Referenzen auf ein Objekt. Jede persistente Referenz hat einen zugehörigen Zählwert mit einem Wert von 0 oder höher. Der Zählwert bestimmt, ob die Referenz das entsprechende Objekt am Leben erhält. Referenzen mit einem Zählwert von 0 verhindern nicht, dass das Objekt erfasst und oft als "schwache" Referenzen bezeichnet wird. Jeder Zählwert größer als 0 verhindert, dass das Objekt erfasst wird.

Referenzen können mit einem anfänglichen Referenzzählwert erstellt werden. Der Zählwert kann durch [`napi_reference_ref`][] und [`napi_reference_unref`][] modifiziert werden. Wenn ein Objekt erfasst wird, während der Zählwert für eine Referenz 0 ist, geben alle nachfolgenden Aufrufe, um das Objekt zur Referenz [`napi_get_reference_value`][] zuzuordnen, NULL für den ausgegebenen `napi_value` zurück. Ein Versuch, [`napi_reference_ref`][] für eine Referenz aufzurufen, deren Objekt erfasst wurde, führt zu einem Fehler.

Referenzen müssen gelöscht werden, wenn sie vom Addon nicht mehr benötigt werden. Wenn eine Referenz gelöscht wird, verhindert sie nicht mehr, dass das entsprechende Objekt erfasst wird. Wenn eine persistente Referenz nicht gelöscht wird, führt dies zu einem "Memory Leak", bei dem sowohl der native Speicher für die persistente Referenz, als auch das entsprechende Objekt auf dem Heap für immer erhalten bleiben.

Es können mehrere persistente Referenzen erstellt werden, die sich auf das gleiche Objekt beziehen, von denen jede das Objekt entweder am Leben erhält oder nicht auf seinem individuellen Zählwert basiert.

#### napi_create_reference
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_create_reference(napi_env env,
                                              napi_value value,
                                              uint32_t initial_refcount,
                                              napi_ref* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` representing the `Object` to which we want a reference.
* `[in] initial_refcount`: Initialer Referenzzählwert für die neue Referenz.
* `[out] result`: `napi_ref` mit dem Hinweis auf die neue Referenz.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API create a new reference with the specified reference count to the `Object` passed in.

#### napi_delete_reference
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] ref`: `napi_ref`, die gelöscht werden soll.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API löscht die eingegebene Referenz.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

#### napi_reference_ref
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_reference_ref(napi_env env,
                                           napi_ref ref,
                                           uint32_t* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] ref`: `napi_ref`, für die der Referenzzählwert erhöht wird.
* `[out] result`: Der neue Referenzzählwert.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API erhöht den Referenzzählwert für die eingegebene Referenz und gibt den daraus resultierenden Referenzzählwert zurück.

#### napi_reference_unref
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_reference_unref(napi_env env,
                                             napi_ref ref,
                                             uint32_t* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] ref`: `napi_ref`, für die der Referenzzählwert verringert wird.
* `[out] result`: Der neue Referenzzählwert.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API verringert den Referenzzählwert für die eingegebene Referenz und gibt den daraus resultierenden Referenzzählwert zurück.

#### napi_get_reference_value
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_get_reference_value(napi_env env,
                                                 napi_ref ref,
                                                 napi_value* result);
```

Die `napi_value`, die in oder aus diesen Methoden übertragen wird, ist ein Handle für das Objekt, auf das sich die Referenz bezieht.

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] ref`: `napi_ref`, für die wir das entsprechende `Object` anfordern.
* `[out] result`: The `napi_value` for the `Object` referenced by the `napi_ref`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

If still valid, this API returns the `napi_value` representing the JavaScript `Object` associated with the `napi_ref`. Andernfalls ist das Ergebnis NULL.

### Cleanup on exit of the current Node.js instance

While a Node.js process typically releases all its resources when exiting, embedders of Node.js, or future Worker support, may require addons to register clean-up hooks that will be run once the current Node.js instance exits.

N-API provides functions for registering and un-registering such callbacks. When those callbacks are run, all resources that are being held by the addon should be freed up.

#### napi_add_env_cleanup_hook
<!-- YAML
added: v10.2.0
napiVersion: 3
-->

```C
NODE_EXTERN napi_status napi_add_env_cleanup_hook(napi_env env,
                                                  void (*fun)(void* arg),
                                                  void* arg);
```

Registers `fun` as a function to be run with the `arg` parameter once the current Node.js environment exits.

A function can safely be specified multiple times with different `arg` values. In that case, it will be called multiple times as well. Providing the same `fun` and `arg` values multiple times is not allowed and will lead the process to abort.

The hooks will be called in reverse order, i.e. the most recently added one will be called first.

Removing this hook can be done by using `napi_remove_env_cleanup_hook`. Typically, that happens when the resource for which this hook was added is being torn down anyway.

#### napi_remove_env_cleanup_hook
<!-- YAML
added: v10.2.0
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_remove_env_cleanup_hook(napi_env env,
                                                     void (*fun)(void* arg),
                                                     void* arg);
```

Unregisters `fun` as a function to be run with the `arg` parameter once the current Node.js environment exits. Both the argument and the function value need to be exact matches.

The function must have originally been registered with `napi_add_env_cleanup_hook`, otherwise the process will abort.

## Modulregistrierung
N-API-Module werden ähnlich wie andere Module registriert, nur dass anstatt des `NODE_MODULE`-Makros Folgendes verwendet wird:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

Der nächste Unterschied ist die Signatur für die `Init`-Methode. Für ein N-API-Modul sieht es wie folgt aus:

```C
napi_value Init(napi_env env, napi_value exports);
```

Der Rückgabewert von `Init` wird als das `exports`-Objekt für das Modul behandelt. Der `Init`-Methode wird ein leeres Objekt über den `exports`-Parameter zur Vereinfachung übergeben. Wenn `Init` NULL zurückgibt, wird der als `exports` übergebene Parameter vom Modul exportiert. N-API-Module können das `module`-Objekt nicht ändern, können aber alles als `exports`-Eigenschaft des Moduls angeben.

To add the method `hello` as a function so that it can be called as a method provided by the addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor desc =
    {"hello", NULL, Method, NULL, NULL, NULL, napi_default, NULL};
  status = napi_define_properties(env, exports, 1, &desc);
  if (status != napi_ok) return NULL;
  return exports;
}
```

Um eine Funktion festzulegen, die von `require()` für das Addon zurückgegeben wird:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_value method;
  napi_status status;
  status = napi_create_function(env, "exports", NAPI_AUTO_LENGTH, Method, NULL, &method);
  if (status != napi_ok) return NULL;
  return method;
}
```

To define a class so that new instances can be created (often used with [Object Wrap](#n_api_object_wrap)):

```C
// BEACHTE: Teilbeispiel, nicht alle erwähnten Codes sind enthalten.
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor properties[] = {
    { "value", NULL, NULL, GetValue, SetValue, NULL, napi_default, NULL },
    DECLARE_NAPI_METHOD("plusOne", PlusOne),
    DECLARE_NAPI_METHOD("multiply", Multiply),
  };

  napi_value cons;
  status =
      napi_define_class(env, "MyObject", New, NULL, 3, properties, &cons);
  if (status != napi_ok) return NULL;

  status = napi_create_reference(env, cons, 1, &constructor);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "MyObject", cons);
  if (status != napi_ok) return NULL;

  return exports;
}
```

If the module will be loaded multiple times during the lifetime of the Node.js process, use the `NAPI_MODULE_INIT` macro to initialize the module:

```C
NAPI_MODULE_INIT() {
  napi_value answer;
  napi_status result;

  status = napi_create_int64(env, 42, &answer);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "answer", answer);
  if (status != napi_ok) return NULL;

  return exports;
}
```

This macro includes `NAPI_MODULE`, and declares an `Init` function with a special name and with visibility beyond the addon. This will allow Node.js to initialize the module even if it is loaded multiple times.

There are a few design considerations when declaring a module that may be loaded multiple times. The documentation of [context-aware addons](addons.html#addons_context_aware_addons) provides more details.

The variables `env` and `exports` will be available inside the function body following the macro invocation.

Weitere Informationen zum Einstellen der Eigenschaften von Objekten finden Sie im Abschnitt über [Arbeiten mit JavaScript-Eigenschaften](#n_api_working_with_javascript_properties).

For more details on building addon modules in general, refer to the existing API.

## Arbeiten mit JavaScript-Eigenschaften
N-API stellt eine Reihe von APIs zur Verfügung, um alle Arten von JavaScript-Werten zu erstellen. Some of these types are documented under [Section 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Grundsätzlich werden diese APIs verwendet, um eine der folgenden Aktionen durchzuführen:

1. Erstellen eines neuen JavaScript-Objekts
2. Konvertierung von einem primitiven C-Typ in einen N-API-Wert
3. Konvertierung vom N-API-Wert in einen primitiven C-Typ
4. Erhalten Sie globale Instanzen, einschließlich `undefined` und `null`

N-API-Werte werden durch den Typ `napi_value` dargestellt. Jeder N-API-Aufruf, der einen JavaScript-Wert erfordert, nimmt einen `napi_value` auf. In einigen Fällen überprüft die API im Voraus den Typ des `napi_value`. Für eine bessere Performance ist es jedoch besser für den Aufrufer, sicherzustellen, dass die betreffende `napi_value` dem von der API erwarteten JavaScript-Typ entspricht.

### Enum-Typen
#### napi_key_collection_mode
<!-- YAML
added: v13.7.0
napiVersion: 6
-->

```C
typedef enum {
  napi_key_include_prototypes,
  napi_key_own_only
} napi_key_collection_mode;
```

Describes the `Keys/Properties` filter enums:

`napi_key_collection_mode` limits the range of collected properties.

`napi_key_own_only` limits the collected properties to the given object only. `napi_key_include_prototypes` will include all keys of the objects's prototype chain as well.

#### napi_key_filter
<!-- YAML
added: v13.7.0
napiVersion: 6
-->

```C
typedef enum {
  napi_key_all_properties = 0,
  napi_key_writable = 1,
  napi_key_enumerable = 1 << 1,
  napi_key_configurable = 1 << 2,
  napi_key_skip_strings = 1 << 3,
  napi_key_skip_symbols = 1 << 4
} napi_key_filter;
```

Property filter bits. They can be or'ed to build a composite filter.

#### napi_key_conversion
<!-- YAML
added: v13.7.0
napiVersion: 6
-->

```C
typedef enum {
  napi_key_keep_numbers,
  napi_key_numbers_to_strings
} napi_key_conversion;
```

`napi_key_numbers_to_strings` will convert integer indices to strings. `napi_key_keep_numbers` will return numbers for integer indices.

#### napi_valuetype

```C
typedef enum {
  // ES6 types (corresponds to typeof)
  napi_undefined,
  napi_null,
  napi_boolean,
  napi_number,
  napi_string,
  napi_symbol,
  napi_object,
  napi_function,
  napi_external,
  napi_bigint,
} napi_valuetype;
```

Beschreibt den Typ einer `napi_value`. This generally corresponds to the types described in [Section 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) of the ECMAScript Language Specification. In addition to types in that section, `napi_valuetype` can also represent `Function`s and `Object`s with external data.

A JavaScript value of type `napi_external` appears in JavaScript as a plain object such that no properties can be set on it, and no prototype.

#### napi_typedarray_type

```C
typedef enum {
  napi_int8_array,
  napi_uint8_array,
  napi_uint8_clamped_array,
  napi_int16_array,
  napi_uint16_array,
  napi_int32_array,
  napi_uint32_array,
  napi_float32_array,
  napi_float64_array,
  napi_bigint64_array,
  napi_biguint64_array,
} napi_typedarray_type;
```

Dies stellt den zugrunde liegenden, binären Skalar-Datentyp des `TypedArray` dar. Elements of this enum correspond to [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

### Funktionen zur Objekterstellung
#### napi_create_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`Array` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen N-API-Wert zurück, der einem JavaScript-`Array`-Typ entspricht. JavaScript arrays are described in [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) of the ECMAScript Language Specification.

#### napi_create_array_with_length
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] length`: Die Anfangslänge des `Array`.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`Array` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen N-API-Wert zurück, der einem JavaScript-`Array`-Typ entspricht. Die Längeneigenschaft von `Array` wird auf den eingegebenen Längenparameter festgelegt. However, the underlying buffer is not guaranteed to be pre-allocated by the VM when the array is created. That behavior is left to the underlying VM implementation. Wenn der Puffer ein zusammenhängender Speicherblock sein muss, der direkt über C gelesen und/oder beschrieben werden kann, sollten Sie die Verwendung von [`napi_create_external_arraybuffer`][] in Betracht ziehen.

JavaScript arrays are described in [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) of the ECMAScript Language Specification.

#### napi_create_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] length`: Die Länge in Byte des zu erstellenden Array-Puffers.
* `[out] data`: Verweis auf den darunter liegenden Bytepuffer des `ArrayBuffer`.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`ArrayBuffer` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen N-API-Wert zurück, der einem JavaScript `ArrayBuffer` entspricht. `ArrayBuffer`s werden zur Darstellung von binären Datenpuffern mit fester Länge verwendet. They are normally used as a backing-buffer for `TypedArray` objects. The `ArrayBuffer` allocated will have an underlying byte buffer whose size is determined by the `length` parameter that's passed in. Der zugrunde liegende Puffer wird optional an den Aufrufer zurückgegeben, falls der Aufrufer den Puffer direkt manipulieren möchte. An diesen Puffer kann nur direkt aus dem nativen Code geschrieben werden. To write to this buffer from JavaScript, a typed array or `DataView` object would need to be created.

JavaScript `ArrayBuffer` objects are described in [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) of the ECMAScript Language Specification.

#### napi_create_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_buffer(napi_env env,
                               size_t size,
                               void** data,
                               napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] size`: Größe in Bytes des zugrunde liegenden Puffers.
* `[out] data`: Raw-Verweis auf den darunter liegenden Puffer.
* `[out] result`: Eine `napi_value`, die einen `node::buffer` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API weist ein `node::Buffer`-Objekt zu. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

#### napi_create_buffer_copy
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_buffer_copy(napi_env env,
                                    size_t length,
                                    const void* data,
                                    void** result_data,
                                    napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] size`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
* `[in] data`: Raw-Verweis auf den darunter liegenden Puffer, von dem kopiert werden soll.
* `[out] result_data`: Verweis auf den dem neuen `Buffer` zugrunde liegenden Datenpuffer.
* `[out] result`: Eine `napi_value`, die einen `node::buffer` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API weist ein `node::buffer`-Objekt zu und initialisiert es mit Daten, die aus dem eingegebenen Puffer kopiert wurden. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

#### napi_create_date
<!-- YAML
added: v11.11.0
napiVersion: 5
-->

```C
napi_status napi_create_date(napi_env env,
                             double time,
                             napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] time`: ECMAScript time value in milliseconds since 01 January, 1970 UTC.
* `[out] result`: A `napi_value` representing a JavaScript `Date`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API does not observe leap seconds; they are ignored, as ECMAScript aligns with POSIX time specification.

This API allocates a JavaScript `Date` object.

JavaScript `Date` objects are described in [Section 20.3](https://tc39.github.io/ecma262/#sec-date-objects) of the ECMAScript Language Specification.

#### napi_create_external
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_external(napi_env env,
                                 void* data,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] data`: Raw-Verweis auf die externen Daten.
* `[in] finalize_cb`: Optional callback to call when the external value is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Eine `napi_value`, die einen externen Wert darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API weist einen JavaScript-Wert mit externen Daten zu. This is used to pass external data through JavaScript code, so it can be retrieved later by native code using [`napi_get_value_external`][].

The API adds a `napi_finalize` callback which will be called when the JavaScript object just created is ready for garbage collection. It is similar to `napi_wrap()` except that:

* the native data cannot be retrieved later using `napi_unwrap()`,
* nor can it be removed later using `napi_remove_wrap()`, and
* the object created by the API can be used with `napi_wrap()`.

The created value is not an object, and therefore does not support additional properties. It is considered a distinct value type: calling `napi_typeof()` with an external value yields `napi_external`.

#### napi_create_external_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status
napi_create_external_arraybuffer(napi_env env,
                                 void* external_data,
                                 size_t byte_length,
                                 napi_finalize finalize_cb,
                                 void* finalize_hint,
                                 napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] external_data`: Pointer to the underlying byte buffer of the `ArrayBuffer`.
* `[in] byte_length`: Die Länge des zugrunde liegenden Puffers in Byte.
* `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`ArrayBuffer` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt einen N-API-Wert zurück, der einem JavaScript `ArrayBuffer` entspricht. The underlying byte buffer of the `ArrayBuffer` is externally allocated and managed. Der Aufrufer muss sicherstellen, dass der Bytepuffer gültig bleibt, bis der endgültige Rückruf aufgerufen wird.

The API adds a `napi_finalize` callback which will be called when the JavaScript object just created is ready for garbage collection. It is similar to `napi_wrap()` except that:

* the native data cannot be retrieved later using `napi_unwrap()`,
* nor can it be removed later using `napi_remove_wrap()`, and
* the object created by the API can be used with `napi_wrap()`.

JavaScript `ArrayBuffer`s are described in [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) of the ECMAScript Language Specification.

#### napi_create_external_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_external_buffer(napi_env env,
                                        size_t length,
                                        void* data,
                                        napi_finalize finalize_cb,
                                        void* finalize_hint,
                                        napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] length`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
* `[in] data`: Raw-Verweis auf den darunter liegenden Puffer, von dem kopiert werden soll.
* `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Eine `napi_value`, die einen `node::buffer` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API weist ein `node::Buffer`-Objekt zu und initialisiert es mit Daten, die durch den übergebenen Puffer gesichert werden. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

The API adds a `napi_finalize` callback which will be called when the JavaScript object just created is ready for garbage collection. It is similar to `napi_wrap()` except that:

* the native data cannot be retrieved later using `napi_unwrap()`,
* nor can it be removed later using `napi_remove_wrap()`, and
* the object created by the API can be used with `napi_wrap()`.

For Node.js >=4 `Buffers` are `Uint8Array`s.

#### napi_create_object
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: Eine `napi_value`, die ein JavaScript-`Object` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API weist ein Standard-JavaScript-`Objekt` zu. Es ist das Äquivalent zu `new Object()` in JavaScript.

The JavaScript `Object` type is described in [Section 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) of the ECMAScript Language Specification.

#### napi_create_symbol
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] description`: Optional `napi_value` which refers to a JavaScript `String` to be set as the description for the symbol.
* `[out] result`: Eine `napi_value`, die ein JavaScript-`Symbol` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API erstellt ein JavaScript-`Symbol`-Objekt aus einem UTF8-kodierten C-String.

The JavaScript `Symbol` type is described in [Section 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) of the ECMAScript Language Specification.

#### napi_create_typedarray
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_typedarray(napi_env env,
                                   napi_typedarray_type type,
                                   size_t length,
                                   napi_value arraybuffer,
                                   size_t byte_offset,
                                   napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] type`: Skalar-Datentyp der Elemente innerhalb des `TypedArray`.
* `[in] length`: Anzahl der Elemente in `TypedArray`.
* `[in] arraybuffer`: `ArrayBuffer` liegt unter dem typisierten Array.
* `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `TypedArray`.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`TypedArray` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API creates a JavaScript `TypedArray` object over an existing `ArrayBuffer`. `TypedArray` objects provide an array-like view over an underlying data buffer where each element has the same underlying binary scalar datatype.

It's required that `(length * size_of_element) + byte_offset` should be <= the size in bytes of the array passed in. If not, a `RangeError` exception is raised.

JavaScript `TypedArray` objects are described in [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the ECMAScript Language Specification.

#### napi_create_dataview
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_create_dataview(napi_env env,
                                 size_t byte_length,
                                 napi_value arraybuffer,
                                 size_t byte_offset,
                                 napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] length`: Anzahl der Elemente in `DataView`.
* `[in] arraybuffer`: `ArrayBuffer` liegt unter dem `DataView`.
* `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `DataView`.
* `[out] result`: Eine `napi_value`, die eine JavaScript-`DataView` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API erstellt ein JavaScript-`DataView`-Objekt über einem vorhandenen `ArrayBuffer`. `DataView` objects provide an array-like view over an underlying data buffer, but one which allows items of different size and type in the `ArrayBuffer`.

Es ist erforderlich, dass `byte_length + byte_offset` kleiner oder gleich der Größe in Bytes des eingegebenen Arrays ist. If not, a `RangeError` exception is raised.

JavaScript `DataView` objects are described in [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) of the ECMAScript Language Specification.

### Funktionen zur Konvertierung von C-Typen in N-API
#### napi_create_int32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Integer-Wert, der in JavaScript dargestellt werden soll.
* `[out] result`: Eine `napi_value`, die eine JavaScript-`Number` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API is used to convert from the C `int32_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_uint32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Integer-Wert ohne Vorzeichen, der in JavaScript dargestellt werden soll.
* `[out] result`: Eine `napi_value`, die eine JavaScript-`Number` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API is used to convert from the C `uint32_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_int64
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Integer-Wert, der in JavaScript dargestellt werden soll.
* `[out] result`: Eine `napi_value`, die eine JavaScript-`Number` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API is used to convert from the C `int64_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification. Beachten Sie, dass der gesamte Bereich von `int64_t` nicht mit voller Präzision in JavaScript dargestellt werden kann. Integer values outside the range of [`Number.MIN_SAFE_INTEGER`][] `-(2^53 - 1)` - [`Number.MAX_SAFE_INTEGER`][] `(2^53 - 1)` will lose precision.

#### napi_create_double
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Doppelpräzisionswert, der in JavaScript dargestellt werden soll.
* `[out] result`: Eine `napi_value`, die eine JavaScript-`Number` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API is used to convert from the C `double` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_bigint_int64
<!-- YAML
added: v10.7.0
napiVersion: 6
-->

```C
napi_status napi_create_bigint_int64(napi_env env,
                                     int64_t value,
                                     napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Integer-Wert, der in JavaScript dargestellt werden soll.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API converts the C `int64_t` type to the JavaScript `BigInt` type.

#### napi_create_bigint_uint64
<!-- YAML
added: v10.7.0
napiVersion: 6
-->

```C
napi_status napi_create_bigint_uint64(napi_env env,
                                      uint64_t value,
                                      napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Integer-Wert ohne Vorzeichen, der in JavaScript dargestellt werden soll.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API converts the C `uint64_t` type to the JavaScript `BigInt` type.

#### napi_create_bigint_words
<!-- YAML
added: v10.7.0
napiVersion: 6
-->

```C
napi_status napi_create_bigint_words(napi_env env,
                                     int sign_bit,
                                     size_t word_count,
                                     const uint64_t* words,
                                     napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] sign_bit`: Determines if the resulting `BigInt` will be positive or negative.
* `[in] word_count`: The length of the `words` array.
* `[in] words`: An array of `uint64_t` little-endian 64-bit words.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API converts an array of unsigned 64-bit words into a single `BigInt` value.

The resulting `BigInt` is calculated as: (–1)<sup>`sign_bit`</sup> (`words[0]` × (2<sup>64</sup>)<sup>0</sup> + `words[1]` × (2<sup>64</sup>)<sup>1</sup> + …)

#### napi_create_string_latin1
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_string_latin1(napi_env env,
                                      const char* str,
                                      size_t length,
                                      napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] str`: Character-Puffer, der einen ISO-8859-1-kodierten String darstellt.
* `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`String` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API creates a JavaScript `String` object from an ISO-8859-1-encoded C string. Der native String wurde kopiert.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

#### napi_create_string_utf16
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_string_utf16(napi_env env,
                                     const char16_t* str,
                                     size_t length,
                                     napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] str`: Character-Puffer, der einen UTF16-LE-kodierten String darstellt.
* `[in] length`: Die Länge des Strings in Zwei-Byte-Codeeinheiten oder `NAPI_AUTO_LENGTH`, wenn sie null-terminiert ist.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`String` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API erstellt ein JavaScript-`String`-Objekt aus einem UTF16-LE-kodierten C-String. Der native String wurde kopiert.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

#### napi_create_string_utf8
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_string_utf8(napi_env env,
                                    const char* str,
                                    size_t length,
                                    napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] str`: Character-Puffer, der einen UTF8-kodierten String darstellt.
* `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[out] result`: Eine `napi_value`, die einen JavaScript-`String` darstellt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API erstellt ein JavaScript-`String`-Objekt aus einem UTF8-kodierten C-String. Der native String wurde kopiert.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

### Funktionen zur Konvertierung von N-API in C-Typen
#### napi_get_array_length
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_array_length(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` representing the JavaScript `Array` whose length is being queried.
* `[out] result`: `uint32` repräsentiert die Länge des Arrays.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt die Länge des Arrays zurück.

`Array` length is described in [Section 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) of the ECMAScript Language Specification.

#### napi_get_arraybuffer_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] arraybuffer`: `napi_value` repräsentiert den `ArrayBuffer`, der abgefragt wird.
* `[out] data`: Der zugrunde liegende Datenpuffer des `ArrayBuffer`.
* `[out] byte_length`: Länge in Bytes des darunter liegenden Datenpuffers.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API is used to retrieve the underlying data buffer of an `ArrayBuffer` and its length.

*WARNING*: Use caution while using this API. The lifetime of the underlying data buffer is managed by the `ArrayBuffer` even after it's returned. A possible safe way to use this API is in conjunction with [`napi_create_reference`][], which can be used to guarantee control over the lifetime of the `ArrayBuffer`. It's also safe to use the returned data buffer within the same callback as long as there are no calls to other APIs that might trigger a GC.

#### napi_get_buffer_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_buffer_info(napi_env env,
                                 napi_value value,
                                 void** data,
                                 size_t* length)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert den `node::Buffer`, der abgefragt wird.
* `[out] data`: Der zugrunde liegende Datenpuffer des `node::Buffer`.
* `[out] length`: Länge in Bytes des darunter liegenden Datenpuffers.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API wird verwendet, um den zugrunde liegenden Datenpuffer eines `node::Buffer` und seine Länge abzurufen.

*Warning*: Use caution while using this API since the underlying data buffer's lifetime is not guaranteed if it's managed by the VM.

#### napi_get_prototype
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_prototype(napi_env env,
                               napi_value object,
                               napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] object`: `napi_value` representing JavaScript `Object` whose prototype to return. Dies gibt das Äquivalent von `Object.getPrototypeOf` zurück (was nicht dasselbe ist, wie die `prototype`-Eigenschaft der Funktion).
* `[out] result`: `napi_value` repräsentiert den Prototyp des betreffenden Objekts.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

#### napi_get_typedarray_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_typedarray_info(napi_env env,
                                     napi_value typedarray,
                                     napi_typedarray_type* type,
                                     size_t* length,
                                     void** data,
                                     napi_value* arraybuffer,
                                     size_t* byte_offset)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] typedarray`: `napi_value` representing the `TypedArray` whose properties to query.
* `[out] type`: Skalar-Datentyp der Elemente innerhalb des `TypedArray`.
* `[out] length`: The number of elements in the `TypedArray`.
* `[out] data`: The data buffer underlying the `TypedArray` adjusted by the `byte_offset` value so that it points to the first element in the `TypedArray`.
* `[out] arraybuffer`: The `ArrayBuffer` underlying the `TypedArray`.
* `[out] byte_offset`: The byte offset within the underlying native array at which the first element of the arrays is located. The value for the data parameter has already been adjusted so that data points to the first element in the array. Therefore, the first byte of the native array would be at `data - byte_offset`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt verschiedene Eigenschaften eines Typed-Arrays zurück.

*Warning*: Use caution while using this API since the underlying data buffer is managed by the VM.

#### napi_get_dataview_info
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_get_dataview_info(napi_env env,
                                   napi_value dataview,
                                   size_t* byte_length,
                                   void** data,
                                   napi_value* arraybuffer,
                                   size_t* byte_offset)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] dataview`: `napi_value` representing the `DataView` whose properties to query.
* `[out] byte_length`: `Number` der Bytes in der `DataView`.
* `[out] data`: Der Datenpuffer der zugrunde liegenden `DataView`.
* `[out] arraybuffer`: `ArrayBuffer` liegt unter dem `DataView`.
* `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the `DataView`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt verschiedene Eigenschaften einer `DataView` zurück.

#### napi_get_date_value
<!-- YAML
added: v11.11.0
napiVersion: 5
-->

```C
napi_status napi_get_date_value(napi_env env,
                                napi_value value,
                                double* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` representing a JavaScript `Date`.
* `[out] result`: Time value as a `double` represented as milliseconds since midnight at the beginning of 01 January, 1970 UTC.

This API does not observe leap seconds; they are ignored, as ECMAScript aligns with POSIX time specification.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-date `napi_value` is passed in it returns `napi_date_expected`.

This API returns the C double primitive of time value for the given JavaScript `Date`.

#### napi_get_value_bool
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert JavaScript-`Boolean`.
* `[out] result`: C boolean primitive equivalent of the given JavaScript `Boolean`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. Wenn eine nicht boolesche `napi_value` übergeben wird, gibt es `napi_boolean_expected` aus.

This API returns the C boolean primitive equivalent of the given JavaScript `Boolean`.

#### napi_get_value_double
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_double(napi_env env,
                                  napi_value value,
                                  double* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert JavaScript-`Number`.
* `[out] result`: C double primitive equivalent of the given JavaScript `Number`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. Wenn eine Nicht Zahl `napi_value` eingegeben wird, gibt sie `napi_number_expected` zurück.

This API returns the C double primitive equivalent of the given JavaScript `Number`.

#### napi_get_value_bigint_int64
<!-- YAML
added: v10.7.0
napiVersion: 6
-->

```C
napi_status napi_get_value_bigint_int64(napi_env env,
                                        napi_value value,
                                        int64_t* result,
                                        bool* lossless);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] result`: C `int64_t` primitive equivalent of the given JavaScript `BigInt`.
* `[out] lossless`: Indicates whether the `BigInt` value was converted losslessly.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-`BigInt` is passed in it returns `napi_bigint_expected`.

This API returns the C `int64_t` primitive equivalent of the given JavaScript `BigInt`. If needed it will truncate the value, setting `lossless` to `false`.

#### napi_get_value_bigint_uint64
<!-- YAML
added: v10.7.0
napiVersion: 6
-->

```C
napi_status napi_get_value_bigint_uint64(napi_env env,
                                        napi_value value,
                                        uint64_t* result,
                                        bool* lossless);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] result`: C `uint64_t` primitive equivalent of the given JavaScript `BigInt`.
* `[out] lossless`: Indicates whether the `BigInt` value was converted losslessly.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-`BigInt` is passed in it returns `napi_bigint_expected`.

This API returns the C `uint64_t` primitive equivalent of the given JavaScript `BigInt`. If needed it will truncate the value, setting `lossless` to `false`.

#### napi_get_value_bigint_words
<!-- YAML
added: v10.7.0
napiVersion: 6
-->

```C
napi_status napi_get_value_bigint_words(napi_env env,
                                        napi_value value,
                                        int* sign_bit,
                                        size_t* word_count,
                                        uint64_t* words);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] sign_bit`: Integer representing if the JavaScript `BigInt` is positive or negative.
* `[in/out] word_count`: Must be initialized to the length of the `words` array. Upon return, it will be set to the actual number of words that would be needed to store this `BigInt`.
* `[out] words`: Pointer to a pre-allocated 64-bit word array.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API converts a single `BigInt` value into a sign bit, 64-bit little-endian array, and the number of elements in the array. `sign_bit` and `words` may be both set to `NULL`, in order to get only `word_count`.

#### napi_get_value_external
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_external(napi_env env,
                                    napi_value value,
                                    void** result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert den externen Wert von JavaScript.
* `[out] result`: Verweis auf die Daten, die durch den externen Wert von JavaScript umschlossen sind.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. Wenn eine nicht externe `napi_value` übergeben wird, wird `napi_invalid_arg` zurückgegeben.

Diese API ruft den externen Datenverweis ab, der zuvor an `napi_create_external()` übergeben wurde.

#### napi_get_value_int32
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_int32(napi_env env,
                                 napi_value value,
                                 int32_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert JavaScript-`Number`.
* `[out] result`: C `int32` primitive equivalent of the given JavaScript `Number`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. Wenn eine Nicht Zahl `napi_value` in `napi_number_expected` übergeben wird.

This API returns the C `int32` primitive equivalent of the given JavaScript `Number`.

Wenn die Zahl den Bereich des 32-Bit-Integer überschreitet, wird das Ergebnis auf das Äquivalent der unteren 32 Bit abgeschnitten. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

Non-finite number values (`NaN`, `+Infinity`, or `-Infinity`) set the result to zero.

#### napi_get_value_int64
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_int64(napi_env env,
                                 napi_value value,
                                 int64_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert JavaScript-`Number`.
* `[out] result`: C `int64` primitive equivalent of the given JavaScript `Number`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. Wenn eine Nicht-Zahl `napi_value` eingegeben wird, gibt sie `napi_number_expected` zurück.

This API returns the C `int64` primitive equivalent of the given JavaScript `Number`.

`Number` values outside the range of [`Number.MIN_SAFE_INTEGER`][] `-(2^53 - 1)` - [`Number.MAX_SAFE_INTEGER`][] `(2^53 - 1)` will lose precision.

Non-finite number values (`NaN`, `+Infinity`, or `-Infinity`) set the result to zero.

#### napi_get_value_string_latin1
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_string_latin1(napi_env env,
                                         napi_value value,
                                         char* buf,
                                         size_t bufsize,
                                         size_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` stellt einen JavaScript-String dar.
* `[in] buf`: Puffer zum Schreiben des ISO-8859-1-kodierten Strings. Wenn NULL eingegeben wird, wird die Länge des Strings (in Bytes) zurückgegeben.
* `[in] bufsize`: Größe des Zielpuffers. Wenn dieser Wert nicht ausreicht, wird der zurückgegebene String abgeschnitten.
* `[out] result`: Anzahl der in den Puffer kopierten Bytes, mit Ausnahme des Null-Terminators.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Diese API gibt den ISO-8859-1-kodierten String zurück, der dem übergebenen Wert entspricht.

#### napi_get_value_string_utf8
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` stellt einen JavaScript-String dar.
* `[in] buf`: Puffer zum Schreiben des UTF8-kodierten Strings. Wenn NULL eingegeben wird, wird die Länge des Strings (in Bytes) zurückgegeben.
* `[in] bufsize`: Größe des Zielpuffers. Wenn dieser Wert nicht ausreicht, wird der zurückgegebene String abgeschnitten.
* `[out] result`: Anzahl der in den Puffer kopierten Bytes, mit Ausnahme des Null-Terminators.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Diese API gibt den UTF8-kodierten String zurück, der dem übergebenen Wert entspricht.

#### napi_get_value_string_utf16
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_string_utf16(napi_env env,
                                        napi_value value,
                                        char16_t* buf,
                                        size_t bufsize,
                                        size_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` stellt einen JavaScript-String dar.
* `[in] buf`: Puffer zum Schreiben des UTF16-LE-kodierten Strings. Wenn NULL eingegeben wird, wird die Länge des Strings (in 2-Byte-Codeeinheiten) zurückgegeben.
* `[in] bufsize`: Größe des Zielpuffers. Wenn dieser Wert nicht ausreicht, wird der zurückgegebene String abgeschnitten.
* `[out] result`: Number of 2-byte code units copied into the buffer, excluding the null terminator.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Diese API gibt den UTF16-kodierten String zurück, der dem übergebenen Wert entspricht.

#### napi_get_value_uint32
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_uint32(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: `napi_value` repräsentiert JavaScript-`Number`.
* `[out] result`: C-primitives Äquivalent der gegebenen `napi_value` als `uint32_t`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. Wenn eine Nicht-Zahl `napi_value` eingegeben wird, gibt sie `napi_number_expected` zurück.

Diese API gibt das C-primitive Äquivalent der gegebenen `napi_value` als `uint32_t` zurück.

### Funktionen zum Abrufen globaler Instanzen
#### napi_get_boolean
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: Der Wert des Boolean, der abgefragt werden soll.
* `[out] result`: `napi_value` representing JavaScript `Boolean` singleton to retrieve.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API is used to return the JavaScript singleton object that is used to represent the given boolean value.

#### napi_get_global
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: `napi_value` repräsentiert JavaScript-`global`-Objekt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt das `global`-Objekt aus.

#### napi_get_null
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: `napi_value` repräsentiert JavaScript-`null`-Objekt.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt das `null`-Objekt aus.

#### napi_get_undefined
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: `napi_value` repräsentiert den undefinierten Wert von JavaScript.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API gibt das undefinierte Objekt aus.

## Working with JavaScript Values and Abstract Operations

N-API stellt eine Reihe von APIs zur Verfügung, um einige abstrakte Operationen mit JavaScript-Werten durchzuführen. Some of these operations are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Diese APIs unterstützen die Durchführung einer der folgenden:

1. Coerce JavaScript values to specific JavaScript types (such as `Number` or `String`).
2. Check the type of a JavaScript value.
3. Check for equality between two JavaScript values.

### napi_coerce_to_bool
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_coerce_to_bool(napi_env env,
                                napi_value value,
                                napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to coerce.
* `[out] result`: `napi_value` representing the coerced JavaScript `Boolean`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API implements the abstract operation `ToBoolean()` as defined in [Section 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_coerce_to_number
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_coerce_to_number(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to coerce.
* `[out] result`: `napi_value` representing the coerced JavaScript `Number`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API implements the abstract operation `ToNumber()` as defined in [Section 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_coerce_to_object
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_coerce_to_object(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to coerce.
* `[out] result`: `napi_value` representing the coerced JavaScript `Object`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API implements the abstract operation `ToObject()` as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_coerce_to_string
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_coerce_to_string(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to coerce.
* `[out] result`: `napi_value` representing the coerced JavaScript `String`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API implements the abstract operation `ToString()` as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_typeof
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value whose type to query.
* `[out] result`: The type of the JavaScript value.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

* `napi_invalid_arg` if the type of `value` is not a known ECMAScript type and `value` is not an External value.

This API represents behavior similar to invoking the `typeof` Operator on the object as defined in [Section 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) of the ECMAScript Language Specification. However, it has support for detecting an External value. If `value` has a type that is invalid, an error is returned.

### napi_instanceof
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_instanceof(napi_env env,
                            napi_value object,
                            napi_value constructor,
                            bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] object`: The JavaScript value to check.
* `[in] constructor`: The JavaScript function object of the constructor function to check against.
* `[out] result`: Boolean that is set to true if `object instanceof constructor` is true.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API represents invoking the `instanceof` Operator on the object as defined in [Section 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) of the ECMAScript Language Specification.

### napi_is_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given object is an array.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API represents invoking the `IsArray` operation on the object as defined in [Section 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) of the ECMAScript Language Specification.

### napi_is_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given object is an `ArrayBuffer`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in is an array buffer.

### napi_is_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given `napi_value` represents a `node::Buffer` object.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in is a buffer.

### napi_is_date
<!-- YAML
added: v11.11.0
napiVersion: 5
-->

```C
napi_status napi_is_date(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given `napi_value` represents a JavaScript `Date` object.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in is a date.

### napi_is_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given `napi_value` represents an `Error` object.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in is an `Error`.

### napi_is_typedarray
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given `napi_value` represents a `TypedArray`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in is a typed array.

### napi_is_dataview
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The JavaScript value to check.
* `[out] result`: Whether the given `napi_value` represents a `DataView`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in is a `DataView`.

### napi_strict_equals
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_strict_equals(napi_env env,
                               napi_value lhs,
                               napi_value rhs,
                               bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] lhs`: The JavaScript value to check.
* `[in] rhs`: The JavaScript value to check against.
* `[out] result`: Whether the two `napi_value` objects are equal.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API represents the invocation of the Strict Equality algorithm as defined in [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) of the ECMAScript Language Specification.

### napi_detach_arraybuffer
<!-- YAML
added: v13.0.0
-->

> Stabilität: 1 - Experimentell

```C
napi_status napi_detach_arraybuffer(napi_env env,
                                    napi_value arraybuffer)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] arraybuffer`: The JavaScript `ArrayBuffer` to be detached.

Gibt `napi_ok` zurück, wenn die API erfolgreich war. If a non-detachable `ArrayBuffer` is passed in it returns `napi_detachable_arraybuffer_expected`.

Generally, an `ArrayBuffer` is non-detachable if it has been detached before. The engine may impose additional conditions on whether an `ArrayBuffer` is detachable. For example, V8 requires that the `ArrayBuffer` be external, that is, created with [`napi_create_external_arraybuffer`][].

This API represents the invocation of the `ArrayBuffer` detach operation as defined in [Section 24.1.1.3](https://tc39.es/ecma262/#sec-detacharraybuffer) of the ECMAScript Language Specification.

### napi_is_detached_arraybuffer
<!-- YAML
added: v13.3.0
-->

> Stabilität: 1 - Experimentell

```C
napi_status napi_is_detached_arraybuffer(napi_env env,
                                         napi_value arraybuffer,
                                         bool* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] arraybuffer`: The JavaScript `ArrayBuffer` to be checked.
* `[out] result`: Whether the `arraybuffer` is detached.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

The `ArrayBuffer` is considered detached if its internal data is `null`.

This API represents the invocation of the `ArrayBuffer` `IsDetachedBuffer` operation as defined in [Section 24.1.1.2](https://tc39.es/ecma262/#sec-isdetachedbuffer) of the ECMAScript Language Specification.

## Working with JavaScript Properties

N-API exposes a set of APIs to get and set properties on JavaScript objects. Some of these types are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Properties in JavaScript are represented as a tuple of a key and a value. Fundamentally, all property keys in N-API can be represented in one of the following forms:

* Named: a simple UTF8-encoded string
* Integer-Indexed: an index value represented by `uint32_t`
* JavaScript value: these are represented in N-API by `napi_value`. This can be a `napi_value` representing a `String`, `Number`, or `Symbol`.

N-API-Werte werden durch den Typ `napi_value` dargestellt. Jeder N-API-Aufruf, der einen JavaScript-Wert erfordert, nimmt einen `napi_value` auf. However, it's the caller's responsibility to make sure that the `napi_value` in question is of the JavaScript type expected by the API.

The APIs documented in this section provide a simple interface to get and set properties on arbitrary JavaScript objects represented by `napi_value`.

For instance, consider the following JavaScript code snippet:

```js
const obj = {};
obj.myProp = 123;
```

The equivalent can be done using N-API values with the following snippet:

```C
napi_status status = napi_generic_failure;

// const obj = {}
napi_value obj, value;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Create a napi_value for 123
status = napi_create_int32(env, 123, &value);
if (status != napi_ok) return status;

// obj.myProp = 123
status = napi_set_named_property(env, obj, "myProp", value);
if (status != napi_ok) return status;
```

Indexed properties can be set in a similar manner. Consider the following JavaScript snippet:

```js
const arr = [];
arr[123] = 'hello';
```

The equivalent can be done using N-API values with the following snippet:

```C
napi_status status = napi_generic_failure;

// const arr = [];
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// Create a napi_value for 'hello'
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &value);
if (status != napi_ok) return status;

// arr[123] = 'hello';
status = napi_set_element(env, arr, 123, value);
if (status != napi_ok) return status;
```

Properties can be retrieved using the APIs described in this section. Consider the following JavaScript snippet:

```js
const arr = [];
const value = arr[123];
```

The following is the approximate equivalent of the N-API counterpart:

```C
napi_status status = napi_generic_failure;

// const arr = []
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// const value = arr[123]
status = napi_get_element(env, arr, 123, &value);
if (status != napi_ok) return status;
```

Finally, multiple properties can also be defined on an object for performance reasons. Consider the following JavaScript:

```js
const obj = {};
Object.defineProperties(obj, {
  'foo': { value: 123, writable: true, configurable: true, enumerable: true },
  'bar': { value: 456, writable: true, configurable: true, enumerable: true }
});
```

The following is the approximate equivalent of the N-API counterpart:

```C
napi_status status = napi_status_generic_failure;

// const obj = {};
napi_value obj;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Create napi_values for 123 and 456
napi_value fooValue, barValue;
status = napi_create_int32(env, 123, &fooValue);
if (status != napi_ok) return status;
status = napi_create_int32(env, 456, &barValue);
if (status != napi_ok) return status;

// Set the properties
napi_property_descriptor descriptors[] = {
  { "foo", NULL, NULL, NULL, NULL, fooValue, napi_default, NULL },
  { "bar", NULL, NULL, NULL, NULL, barValue, napi_default, NULL }
}
status = napi_define_properties(env,
                                obj,
                                sizeof(descriptors) / sizeof(descriptors[0]),
                                descriptors);
if (status != napi_ok) return status;
```

### Structures
#### napi_property_attributes

```C
typedef enum {
  napi_default = 0,
  napi_writable = 1 << 0,
  napi_enumerable = 1 << 1,
  napi_configurable = 1 << 2,

  // Used with napi_define_class to distinguish static properties
  // from instance properties. Ignored by napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

`napi_property_attributes` are flags used to control the behavior of properties set on a JavaScript object. Other than `napi_static` they correspond to the attributes listed in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/). They can be one or more of the following bitflags:

* `napi_default`: No explicit attributes are set on the property. By default, a property is read only, not enumerable and not configurable.
* `napi_writable`: The property is writable.
* `napi_enumerable`: The property is enumerable.
* `napi_configurable`: The property is configurable as defined in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).
* `napi_static`: The property will be defined as a static property on a class as opposed to an instance property, which is the default. This is used only by [`napi_define_class`][]. It is ignored by `napi_define_properties`.

#### napi_property_descriptor

```C
typedef struct {
  // One of utf8name or name should be NULL.
  const char* utf8name;
  napi_value name;

  napi_callback method;
  napi_callback getter;
  napi_callback setter;
  napi_value value;

  napi_property_attributes attributes;
  void* data;
} napi_property_descriptor;
```

* `utf8name`: Optional `String` describing the key for the property, encoded as UTF8. One of `utf8name` or `name` must be provided for the property.
* `name`: Optional `napi_value` that points to a JavaScript string or symbol to be used as the key for the property. One of `utf8name` or `name` must be provided for the property.
* `value`: The value that's retrieved by a get access of the property if the property is a data property. If this is passed in, set `getter`, `setter`, `method` and `data` to `NULL` (since these members won't be used).
* `getter`: A function to call when a get access of the property is performed. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is accessed from JavaScript code (or if a get on the property is performed using a N-API call).
* `setter`: A function to call when a set access of the property is performed. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is set from JavaScript code (or if a set on the property is performed using a N-API call).
* `method`: Set this to make the property descriptor object's `value` property to be a JavaScript function represented by `method`. If this is passed in, set `value`, `getter` and `setter` to `NULL` (since these members won't be used).
* `attributes`: The attributes associated with the particular property. See [`napi_property_attributes`][].
* `data`: The callback data passed into `method`, `getter` and `setter` if this function is invoked.

### Functions
#### napi_get_property_names
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_property_names(napi_env env,
                                    napi_value object,
                                    napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to retrieve the properties.
* `[out] result`: A `napi_value` representing an array of JavaScript values that represent the property names of the object. The API can be used to iterate over `result` using [`napi_get_array_length`][] and [`napi_get_element`][].

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API returns the names of the enumerable properties of `object` as an array of strings. The properties of `object` whose key is a symbol will not be included.

#### napi_get_all_property_names
<!-- YAML
added: v13.7.0
napiVersion: 6
-->

```C
napi_get_all_property_names(napi_env env,
                            napi_value object,
                            napi_key_collection_mode key_mode,
                            napi_key_filter key_filter,
                            napi_key_conversion key_conversion,
                            napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to retrieve the properties.
* `[in] key_mode`: Whether to retrieve prototype properties as well.
* `[in] key_filter`: Which properties to retrieve (enumerable/readable/writable).
* `[in] key_conversion`: Whether to convert numbered property keys to strings.
* `[out] result`: A `napi_value` representing an array of JavaScript values that represent the property names of the object. [`napi_get_array_length`][] and [`napi_get_element`][] can be used to iterate over `result`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API returns an array containing the names of the available properties of this object.

#### napi_set_property
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_set_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value value);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object on which to set the property.
* `[in] key`: The name of the property to set.
* `[in] value`: The property value.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API set a property on the `Object` passed in.

#### napi_get_property
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to retrieve the property.
* `[in] key`: The name of the property to retrieve.
* `[out] result`: The value of the property.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API gets the requested property from the `Object` passed in.

#### napi_has_property
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_has_property(napi_env env,
                              napi_value object,
                              napi_value key,
                              bool* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object to query.
* `[in] key`: The name of the property whose existence to check.
* `[out] result`: Whether the property exists on the object or not.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in has the named property.

#### napi_delete_property
<!-- YAML
added: v8.2.0
napiVersion: 1
-->

```C
napi_status napi_delete_property(napi_env env,
                                 napi_value object,
                                 napi_value key,
                                 bool* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object to query.
* `[in] key`: The name of the property to delete.
* `[out] result`: Whether the property deletion succeeded or not. `result` can optionally be ignored by passing `NULL`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API attempts to delete the `key` own property from `object`.

#### napi_has_own_property
<!-- YAML
added: v8.2.0
napiVersion: 1
-->

```C
napi_status napi_has_own_property(napi_env env,
                                  napi_value object,
                                  napi_value key,
                                  bool* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object to query.
* `[in] key`: The name of the own property whose existence to check.
* `[out] result`: Whether the own property exists on the object or not.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API checks if the `Object` passed in has the named own property. `key` must be a string or a `Symbol`, or an error will be thrown. N-API will not perform any conversion between data types.

#### napi_set_named_property
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_set_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value value);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object on which to set the property.
* `[in] utf8Name`: The name of the property to set.
* `[in] value`: The property value.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method is equivalent to calling [`napi_set_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

#### napi_get_named_property
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to retrieve the property.
* `[in] utf8Name`: The name of the property to get.
* `[out] result`: The value of the property.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method is equivalent to calling [`napi_get_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

#### napi_has_named_property
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_has_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    bool* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object to query.
* `[in] utf8Name`: The name of the property whose existence to check.
* `[out] result`: Whether the property exists on the object or not.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method is equivalent to calling [`napi_has_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

#### napi_set_element
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_set_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value value);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to set the properties.
* `[in] index`: The index of the property to set.
* `[in] value`: The property value.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API sets and element on the `Object` passed in.

#### napi_get_element
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to retrieve the property.
* `[in] index`: The index of the property to get.
* `[out] result`: The value of the property.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API gets the element at the requested index.

#### napi_has_element
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_has_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             bool* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object to query.
* `[in] index`: The index of the property whose existence to check.
* `[out] result`: Whether the property exists on the object or not.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API returns if the `Object` passed in has an element at the requested index.

#### napi_delete_element
<!-- YAML
added: v8.2.0
napiVersion: 1
-->

```C
napi_status napi_delete_element(napi_env env,
                                napi_value object,
                                uint32_t index,
                                bool* result);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object to query.
* `[in] index`: The index of the property to delete.
* `[out] result`: Whether the element deletion succeeded or not. `result` can optionally be ignored by passing `NULL`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API attempts to delete the specified `index` from `object`.

#### napi_define_properties
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_define_properties(napi_env env,
                                   napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties);
```

* `[in] env`: Die Umgebung, unter der die N-API aufgerufen wird.
* `[in] object`: The object from which to retrieve the properties.
* `[in] property_count`: The number of elements in the `properties` array.
* `[in] properties`: The array of property descriptors.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method allows the efficient definition of multiple properties on a given object. The properties are defined using property descriptors (see [`napi_property_descriptor`][]). Given an array of such property descriptors, this API will set the properties on the object one at a time, as defined by `DefineOwnProperty()` (described in [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) of the ECMA-262 specification).

## Working with JavaScript Functions

N-API provides a set of APIs that allow JavaScript code to call back into native code. N-API APIs that support calling back into native code take in a callback functions represented by the `napi_callback` type. When the JavaScript VM calls back to native code, the `napi_callback` function provided is invoked. The APIs documented in this section allow the callback function to do the following:

* Get information about the context in which the callback was invoked.
* Get the arguments passed into the callback.
* Return a `napi_value` back from the callback.

Additionally, N-API provides a set of functions which allow calling JavaScript functions from native code. One can either call a function like a regular JavaScript function call, or as a constructor function.

Any non-`NULL` data which is passed to this API via the `data` field of the `napi_property_descriptor` items can be associated with `object` and freed whenever `object` is garbage-collected by passing both `object` and the data to [`napi_add_finalizer`][].

### napi_call_function
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_call_function(napi_env env,
                                           napi_value recv,
                                           napi_value func,
                                           size_t argc,
                                           const napi_value* argv,
                                           napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] recv`: The `this` object passed to the called function.
* `[in] func`: `napi_value` representing the JavaScript function to be invoked.
* `[in] argc`: The count of elements in the `argv` array.
* `[in] argv`: Array of `napi_values` representing JavaScript values passed in as arguments to the function.
* `[out] result`: `napi_value` representing the JavaScript object returned.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method allows a JavaScript function object to be called from a native add-on. This is the primary mechanism of calling back *from* the add-on's native code *into* JavaScript. For the special case of calling into JavaScript after an async operation, see [`napi_make_callback`][].

A sample use case might look as follows. Consider the following JavaScript snippet:

```js
function AddTwo(num) {
  return num + 2;
}
```

Then, the above function can be invoked from a native add-on using the following code:

```C
// Get the function named "AddTwo" on the global object
napi_value global, add_two, arg;
napi_status status = napi_get_global(env, &global);
if (status != napi_ok) return;

status = napi_get_named_property(env, global, "AddTwo", &add_two);
if (status != napi_ok) return;

// const arg = 1337
status = napi_create_int32(env, 1337, &arg);
if (status != napi_ok) return;

napi_value* argv = &arg;
size_t argc = 1;

// AddTwo(arg);
napi_value return_val;
status = napi_call_function(env, global, add_two, argc, argv, &return_val);
if (status != napi_ok) return;

// Convert the result back to a native type
int32_t result;
status = napi_get_value_int32(env, return_val, &result);
if (status != napi_ok) return;
```

### napi_create_function
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 size_t length,
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] utf8Name`: The name of the function encoded as UTF8. This is visible within JavaScript as the new function object's `name` property.
* `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[in] cb`: The native function which should be called when this function object is invoked.
* `[in] data`: User-provided data context. This will be passed back into the function when invoked later.
* `[out] result`: `napi_value` representing the JavaScript function object for the newly created function.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API allows an add-on author to create a function object in native code. This is the primary mechanism to allow calling *into* the add-on's native code *from* JavaScript.

The newly created function is not automatically visible from script after this call. Instead, a property must be explicitly set on any object that is visible to JavaScript, in order for the function to be accessible from script.

In order to expose a function as part of the add-on's module exports, set the newly created function on the exports object. A sample module might look as follows:

```C
napi_value SayHello(napi_env env, napi_callback_info info) {
  printf("Hello\n");
  return NULL;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_status status;

  napi_value fn;
  status = napi_create_function(env, NULL, 0, SayHello, NULL, &fn);
  if (status != napi_ok) return NULL;

  status = napi_set_named_property(env, exports, "sayHello", fn);
  if (status != napi_ok) return NULL;

  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

Given the above code, the add-on can be used from JavaScript as follows:

```js
const myaddon = require('./addon');
myaddon.sayHello();
```

The string passed to `require()` is the name of the target in `binding.gyp` responsible for creating the `.node` file.

Any non-`NULL` data which is passed to this API via the `data` parameter can be associated with the resulting JavaScript function (which is returned in the `result` parameter) and freed whenever the function is garbage-collected by passing both the JavaScript function and the data to [`napi_add_finalizer`][].

JavaScript `Function`s are described in [Section 19.2](https://tc39.github.io/ecma262/#sec-function-objects) of the ECMAScript Language Specification.

### napi_get_cb_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_cb_info(napi_env env,
                             napi_callback_info cbinfo,
                             size_t* argc,
                             napi_value* argv,
                             napi_value* thisArg,
                             void** data)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] cbinfo`: The callback info passed into the callback function.
* `[in-out] argc`: Specifies the size of the provided `argv` array and receives the actual count of arguments.
* `[out] argv`: Buffer to which the `napi_value` representing the arguments are copied. If there are more arguments than the provided count, only the requested number of arguments are copied. If there are fewer arguments provided than claimed, the rest of `argv` is filled with `napi_value` values that represent `undefined`.
* `[out] this`: Receives the JavaScript `this` argument for the call.
* `[out] data`: Receives the data pointer for the callback.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method is used within a callback function to retrieve details about the call like the arguments and the `this` pointer from a given callback info.

### napi_get_new_target
<!-- YAML
added: v8.6.0
napiVersion: 1
-->

```C
napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] cbinfo`: The callback info passed into the callback function.
* `[out] result`: The `new.target` of the constructor call.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API returns the `new.target` of the constructor call. If the current callback is not a constructor call, the result is `NULL`.

### napi_new_instance
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_new_instance(napi_env env,
                              napi_value cons,
                              size_t argc,
                              napi_value* argv,
                              napi_value* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
* `[in] argc`: The count of elements in the `argv` array.
* `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the constructor.
* `[out] result`: `napi_value` representing the JavaScript object returned, which in this case is the constructed object.

This method is used to instantiate a new JavaScript value using a given `napi_value` that represents the constructor for the object. For example, consider the following snippet:

```js
function MyObject(param) {
  this.param = param;
}

const arg = 'hello';
const value = new MyObject(arg);
```

The following can be approximated in N-API using the following snippet:

```C
// Get the constructor function MyObject
napi_value global, constructor, arg, value;
napi_status status = napi_get_global(env, &global);
if (status != napi_ok) return;

status = napi_get_named_property(env, global, "MyObject", &constructor);
if (status != napi_ok) return;

// const arg = "hello"
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &arg);
if (status != napi_ok) return;

napi_value* argv = &arg;
size_t argc = 1;

// const value = new MyObject(arg)
status = napi_new_instance(env, constructor, argc, argv, &value);
```

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

## Object Wrap

N-API offers a way to "wrap" C++ classes and instances so that the class constructor and methods can be called from JavaScript.

1. The [`napi_define_class`][] API defines a JavaScript class with constructor, static properties and methods, and instance properties and methods that correspond to the C++ class.
2. When JavaScript code invokes the constructor, the constructor callback uses [`napi_wrap`][] to wrap a new C++ instance in a JavaScript object, then returns the wrapper object.
3. When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` C++ function is invoked. For an instance callback, [`napi_unwrap`][] obtains the C++ instance that is the target of the call.

For wrapped objects it may be difficult to distinguish between a function called on a class prototype and a function called on an instance of a class. A common pattern used to address this problem is to save a persistent reference to the class constructor for later `instanceof` checks.

```C
napi_value MyClass_constructor = NULL;
status = napi_get_reference_value(env, MyClass::es_constructor, &MyClass_constructor);
assert(napi_ok == status);
bool is_instance = false;
status = napi_instanceof(env, es_this, MyClass_constructor, &is_instance);
assert(napi_ok == status);
if (is_instance) {
  // napi_unwrap() ...
} else {
  // otherwise...
}
```

The reference must be freed once it is no longer needed.

### napi_define_class
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_define_class(napi_env env,
                              const char* utf8name,
                              size_t length,
                              napi_callback constructor,
                              void* data,
                              size_t property_count,
                              const napi_property_descriptor* properties,
                              napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] utf8name`: Name of the JavaScript constructor function; this is not required to be the same as the C++ class name, though it is recommended for clarity.
* `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[in] constructor`: Callback function that handles constructing instances of the class. (This should be a static method on the class, not an actual C++ constructor function.)
* `[in] data`: Optional data to be passed to the constructor callback as the `data` property of the callback info.
* `[in] property_count`: Number of items in the `properties` array argument.
* `[in] properties`: Array of property descriptors describing static and instance data properties, accessors, and methods on the class See `napi_property_descriptor`.
* `[out] result`: A `napi_value` representing the constructor function for the class.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Defines a JavaScript class that corresponds to a C++ class, including:

* A JavaScript constructor function that has the class name and invokes the provided C++ constructor callback.
* Properties on the constructor function corresponding to _static_ data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
* Properties on the constructor function's `prototype` object corresponding to _non-static_ data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

The C++ constructor callback should be a static method on the class that calls the actual class constructor, then wraps the new C++ instance in a JavaScript object, and returns the wrapper object. See `napi_wrap()` for details.

The JavaScript constructor function returned from [`napi_define_class`][] is often saved and used later, to construct new instances of the class from native code, and/or check whether provided values are instances of the class. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

Any non-`NULL` data which is passed to this API via the `data` parameter or via the `data` field of the `napi_property_descriptor` array items can be associated with the resulting JavaScript constructor (which is returned in the `result` parameter) and freed whenever the class is garbage-collected by passing both the JavaScript function and the data to [`napi_add_finalizer`][].

### napi_wrap
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_wrap(napi_env env,
                      napi_value js_object,
                      void* native_object,
                      napi_finalize finalize_cb,
                      void* finalize_hint,
                      napi_ref* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] js_object`: The JavaScript object that will be the wrapper for the native object.
* `[in] native_object`: The native instance that will be wrapped in the JavaScript object.
* `[in] finalize_cb`: Optional native callback that can be used to free the native instance when the JavaScript object is ready for garbage-collection.
* `[in] finalize_hint`: Optional contextual hint that is passed to the finalize callback.
* `[out] result`: Optional reference to the wrapped object.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Wraps a native instance in a JavaScript object. The native instance can be retrieved later using `napi_unwrap()`.

When JavaScript code invokes a constructor for a class that was defined using `napi_define_class()`, the `napi_callback` for the constructor is invoked. After constructing an instance of the native class, the callback must then call `napi_wrap()` to wrap the newly constructed instance in the already-created JavaScript object that is the `this` argument to the constructor callback. (That `this` object was created from the constructor function's `prototype`, so it already has definitions of all the instance properties and methods.)

Typically when wrapping a class instance, a finalize callback should be provided that simply deletes the native instance that is received as the `data` argument to the finalize callback.

The optional returned reference is initially a weak reference, meaning it has a reference count of 0. Typically this reference count would be incremented temporarily during async operations that require the instance to remain valid.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. If it is deleted before then, then the finalize callback may never be invoked. Therefore, when obtaining a reference a finalize callback is also required in order to enable correct disposal of the reference.

Calling `napi_wrap()` a second time on an object will return an error. To associate another native instance with the object, use `napi_remove_wrap()` first.

### napi_unwrap
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_unwrap(napi_env env,
                        napi_value js_object,
                        void** result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] js_object`: The object associated with the native instance.
* `[out] result`: Pointer to the wrapped native instance.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Retrieves a native instance that was previously wrapped in a JavaScript object using `napi_wrap()`.

When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` is invoked. If the callback is for an instance method or accessor, then the `this` argument to the callback is the wrapper object; the wrapped C++ instance that is the target of the call can be obtained then by calling `napi_unwrap()` on the wrapper object.

### napi_remove_wrap
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
napi_status napi_remove_wrap(napi_env env,
                             napi_value js_object,
                             void** result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] js_object`: The object associated with the native instance.
* `[out] result`: Pointer to the wrapped native instance.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Retrieves a native instance that was previously wrapped in the JavaScript object `js_object` using `napi_wrap()` and removes the wrapping. If a finalize callback was associated with the wrapping, it will no longer be called when the JavaScript object becomes garbage-collected.

### napi_add_finalizer

<!-- YAML
added: v8.0.0
napiVersion: 5
-->

```C
napi_status napi_add_finalizer(napi_env env,
                               napi_value js_object,
                               void* native_object,
                               napi_finalize finalize_cb,
                               void* finalize_hint,
                               napi_ref* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] js_object`: The JavaScript object to which the native data will be attached.
* `[in] native_object`: The native data that will be attached to the JavaScript object.
* `[in] finalize_cb`: Native callback that will be used to free the native data when the JavaScript object is ready for garbage-collection.
* `[in] finalize_hint`: Optional contextual hint that is passed to the finalize callback.
* `[out] result`: Optional reference to the JavaScript object.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Adds a `napi_finalize` callback which will be called when the JavaScript object in `js_object` is ready for garbage collection. This API is similar to `napi_wrap()` except that:

* the native data cannot be retrieved later using `napi_unwrap()`,
* nor can it be removed later using `napi_remove_wrap()`, and
* the API can be called multiple times with different data items in order to attach each of them to the JavaScript object, and
* the object manipulated by the API can be used with `napi_wrap()`.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. If it is deleted before then, then the finalize callback may never be invoked. Therefore, when obtaining a reference a finalize callback is also required in order to enable correct disposal of the reference.

## Simple Asynchronous Operations

Addon modules often need to leverage async helpers from libuv as part of their implementation. This allows them to schedule work to be executed asynchronously so that their methods can return in advance of the work being completed. This allows them to avoid blocking overall execution of the Node.js application.

N-API provides an ABI-stable interface for these supporting functions which covers the most common asynchronous use cases.

N-API defines the `napi_async_work` structure which is used to manage asynchronous workers. Instances are created/deleted with [`napi_create_async_work`][] and [`napi_delete_async_work`][].

The `execute` and `complete` callbacks are functions that will be invoked when the executor is ready to execute and when it completes its task respectively.

The `execute` function should avoid making any N-API calls that could result in the execution of JavaScript or interaction with JavaScript objects. Most often, any code that needs to make N-API calls should be made in `complete` callback instead. Avoid using the `napi_env` parameter in the execute callback as it will likely execute JavaScript.

These functions implement the following interfaces:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

When these methods are invoked, the `data` parameter passed will be the addon-provided `void*` data that was passed into the `napi_create_async_work` call.

Once created the async worker can be queued for execution using the [`napi_queue_async_work`][] function:

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

[`napi_cancel_async_work`][] can be used if the work needs to be cancelled before the work has started execution.

After calling [`napi_cancel_async_work`][], the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even when it was cancelled.

### napi_create_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
changes:
  - version: v8.6.0
    pr-url: https://github.com/nodejs/node/pull/14697
    description: Added `async_resource` and `async_resource_name` parameters.
-->

```C
napi_status napi_create_async_work(napi_env env,
                                   napi_value async_resource,
                                   napi_value async_resource_name,
                                   napi_async_execute_callback execute,
                                   napi_async_complete_callback complete,
                                   void* data,
                                   napi_async_work* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
* `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
* `[in] complete`: The native function which will be called when the asynchronous logic is completed or is cancelled. The given function is called from the main event loop thread.
* `[in] data`: User-provided data context. This will be passed back into the execute and complete functions.
* `[out] result`: `napi_async_work*` which is the handle to the newly created async work.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API allocates a work object that is used to execute logic asynchronously. It should be freed using [`napi_delete_async_work`][] once the work is no longer required.

`async_resource_name` should be a null-terminated, UTF-8-encoded string.

The `async_resource_name` identifier is provided by the user and should be representative of the type of async work being performed. It is also recommended to apply namespacing to the identifier, e.g. by including the module name. See the [`async_hooks` documentation][async_hooks `type`] for more information.

### napi_delete_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] work`: The handle returned by the call to `napi_create_async_work`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API frees a previously allocated work object.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

### napi_queue_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] work`: The handle returned by the call to `napi_create_async_work`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API requests that the previously allocated work be scheduled for execution. Once it returns successfully, this API must not be called again with the same `napi_async_work` item or the result will be undefined.

### napi_cancel_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] work`: The handle returned by the call to `napi_create_async_work`.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API cancels queued work if it has not yet been started. If it has already started executing, it cannot be cancelled and `napi_generic_failure` will be returned. If successful, the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even if it has been successfully cancelled.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

## Custom Asynchronous Operations

The simple asynchronous work APIs above may not be appropriate for every scenario. When using any other asynchronous mechanism, the following APIs are necessary to ensure an asynchronous operation is properly tracked by the runtime.

### napi_async_init
<!-- YAML
added: v8.6.0
napiVersion: 1
-->

```C
napi_status napi_async_init(napi_env env,
                            napi_value async_resource,
                            napi_value async_resource_name,
                            napi_async_context* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
* `[out] result`: The initialized async context.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

### napi_async_destroy
<!-- YAML
added: v8.6.0
napiVersion: 1
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] async_context`: The async context to be destroyed.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

### napi_make_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
changes:
  - version: v8.6.0
    description: Added `async_context` parameter.
-->

```C
NAPI_EXTERN napi_status napi_make_callback(napi_env env,
                                           napi_async_context async_context,
                                           napi_value recv,
                                           napi_value func,
                                           size_t argc,
                                           const napi_value* argv,
                                           napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
* `[in] recv`: The `this` object passed to the called function.
* `[in] func`: `napi_value` representing the JavaScript function to be invoked.
* `[in] argc`: The count of elements in the `argv` array.
* `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
* `[out] result`: `napi_value` representing the JavaScript object returned.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This method allows a JavaScript function object to be called from a native add-on. This API is similar to `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). It is a fairly simple wrapper around `node::MakeCallback`.

Note it is *not* necessary to use `napi_make_callback` from within a `napi_async_complete_callback`; in that situation the callback's async context has already been set up, so a direct call to `napi_call_function` is sufficient and appropriate. Use of the `napi_make_callback` function may be required when implementing custom async behavior that does not use `napi_create_async_work`.

### napi_open_callback_scope
<!-- YAML
added: v9.6.0
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_open_callback_scope(napi_env env,
                                                 napi_value resource_object,
                                                 napi_async_context context,
                                                 napi_callback_scope* result)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] resource_object`: An object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
* `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
* `[out] result`: The newly created scope.

There are cases (for example, resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls. If there is no other script on the stack the [`napi_open_callback_scope`][] and [`napi_close_callback_scope`][] functions can be used to open/close the required scope.

### napi_close_callback_scope
<!-- YAML
added: v9.6.0
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] scope`: The scope to be closed.

Diese API kann auch dann aufgerufen werden, wenn eine JavaScript-Exception ansteht.

## Version Management

### napi_get_node_version
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
typedef struct {
  uint32_t major;
  uint32_t minor;
  uint32_t patch;
  const char* release;
} napi_node_version;

napi_status napi_get_node_version(napi_env env,
                                  const napi_node_version** version);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] version`: A pointer to version information for Node.js itself.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This function fills the `version` struct with the major, minor, and patch version of Node.js that is currently running, and the `release` field with the value of [`process.release.name`][`process.release`].

The returned buffer is statically allocated and does not need to be freed.

### napi_get_version
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] result`: The highest version of N-API supported.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API returns the highest N-API version supported by the Node.js runtime. N-API is planned to be additive such that newer releases of Node.js may support additional API functions. In order to allow an addon to use a newer function when running with versions of Node.js that support it, while providing fallback behavior when running with Node.js versions that don't support it:

* Call `napi_get_version()` to determine if the API is available.
* If available, dynamically load a pointer to the function using `uv_dlsym()`.
* Use the dynamically loaded pointer to invoke the function.
* If the function is not available, provide an alternate implementation that does not use the function.

## Memory Management

### napi_adjust_external_memory
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_adjust_external_memory(napi_env env,
                                                    int64_t change_in_bytes,
                                                    int64_t* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
* `[out] result`: The adjusted value

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This function gives V8 an indication of the amount of externally allocated memory that is kept alive by JavaScript objects (i.e. a JavaScript object that points to its own memory allocated by a native module). Registering externally allocated memory will trigger global garbage collections more often than it would otherwise.

## Promises

N-API provides facilities for creating `Promise` objects as described in [Section 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) of the ECMA specification. It implements promises as a pair of objects. When a promise is created by `napi_create_promise()`, a "deferred" object is created and returned alongside the `Promise`. The deferred object is bound to the created `Promise` and is the only means to resolve or reject the `Promise` using `napi_resolve_deferred()` or `napi_reject_deferred()`. The deferred object that is created by `napi_create_promise()` is freed by `napi_resolve_deferred()` or `napi_reject_deferred()`. The `Promise` object may be returned to JavaScript where it can be used in the usual fashion.

For example, to create a promise and pass it to an asynchronous worker:

```c
napi_deferred deferred;
napi_value promise;
napi_status status;

// Create the promise.
status = napi_create_promise(env, &deferred, &promise);
if (status != napi_ok) return NULL;

// Pass the deferred to a function that performs an asynchronous action.
do_something_asynchronous(deferred);

// Return the promise to JS
return promise;
```

The above function `do_something_asynchronous()` would perform its asynchronous action and then it would resolve or reject the deferred, thereby concluding the promise and freeing the deferred:

```c
napi_deferred deferred;
napi_value undefined;
napi_status status;

// Create a value with which to conclude the deferred.
status = napi_get_undefined(env, &undefined);
if (status != napi_ok) return NULL;

// Resolve or reject the promise associated with the deferred depending on
// whether the asynchronous action succeeded.
if (asynchronous_action_succeeded) {
  status = napi_resolve_deferred(env, deferred, undefined);
} else {
  status = napi_reject_deferred(env, deferred, undefined);
}
if (status != napi_ok) return NULL;

// At this point the deferred has been freed, so we should assign NULL to it.
deferred = NULL;
```

### napi_create_promise
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
napi_status napi_create_promise(napi_env env,
                                napi_deferred* deferred,
                                napi_value* promise);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] deferred`: A newly created deferred object which can later be passed to `napi_resolve_deferred()` or `napi_reject_deferred()` to resolve resp. reject the associated promise.
* `[out] promise`: The JavaScript promise associated with the deferred object.

Gibt `napi_ok` zurück, wenn die API erfolgreich war.

This API creates a deferred object and a JavaScript promise.

### napi_resolve_deferred
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
napi_status napi_resolve_deferred(napi_env env,
                                  napi_deferred deferred,
                                  napi_value resolution);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] deferred`: The deferred object whose associated promise to resolve.
* `[in] resolution`: The value with which to resolve the promise.

This API resolves a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to resolve JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

### napi_reject_deferred
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
napi_status napi_reject_deferred(napi_env env,
                                 napi_deferred deferred,
                                 napi_value rejection);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] deferred`: The deferred object whose associated promise to resolve.
* `[in] rejection`: The value with which to reject the promise.

This API rejects a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to reject JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

### napi_is_promise
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
napi_status napi_is_promise(napi_env env,
                            napi_value value,
                            bool* is_promise);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] value`: The value to examine
* `[out] is_promise`: Flag indicating whether `promise` is a native promise object (that is, a promise object created by the underlying engine).

## Script execution

N-API provides an API for executing a string containing JavaScript using the underlying JavaScript engine.

### napi_run_script
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_run_script(napi_env env,
                                        napi_value script,
                                        napi_value* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] script`: A JavaScript string containing the script to execute.
* `[out] result`: The value resulting from having executed the script.

This function executes a string of JavaScript code and returns its result with the following caveats:

* Unlike `eval`, this function does not allow the script to access the current lexical scope, and therefore also does not allow to access the [module scope](modules.html#modules_the_module_scope), meaning that pseudo-globals such as `require` will not be available.
* The script can access the [global scope](globals.html). Function and `var` declarations in the script will be added to the [`global`][] object. Variable declarations made using `let` and `const` will be visible globally, but will not be added to the [`global`][] object.
* The value of `this` is [`global`][] within the script.

## libuv event loop

N-API provides a function for getting the current event loop associated with a specific `napi_env`.

### napi_get_uv_event_loop
<!-- YAML
added:
  - v8.10.0
  - v9.3.0
napiVersion: 2
-->

```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               struct uv_loop_s** loop);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[out] loop`: The current libuv loop instance.

## Asynchronous Thread-safe Function Calls

JavaScript functions can normally only be called from a native addon's main thread. If an addon creates additional threads, then N-API functions that require a `napi_env`, `napi_value`, or `napi_ref` must not be called from those threads.

When an addon has additional threads and JavaScript functions need to be invoked based on the processing completed by those threads, those threads must communicate with the addon's main thread so that the main thread can invoke the JavaScript function on their behalf. The thread-safe function APIs provide an easy way to do this.

These APIs provide the type `napi_threadsafe_function` as well as APIs to create, destroy, and call objects of this type. `napi_create_threadsafe_function()` creates a persistent reference to a `napi_value` that holds a JavaScript function which can be called from multiple threads. The calls happen asynchronously. This means that values with which the JavaScript callback is to be called will be placed in a queue, and, for each value in the queue, a call will eventually be made to the JavaScript function.

Upon creation of a `napi_threadsafe_function` a `napi_finalize` callback can be provided. This callback will be invoked on the main thread when the thread-safe function is about to be destroyed. It receives the context and the finalize data given during construction, and provides an opportunity for cleaning up after the threads e.g. by calling `uv_thread_join()`. **Aside from the main loop thread, no threads should be using the thread-safe function after the finalize callback completes.**

The `context` given during the call to `napi_create_threadsafe_function()` can be retrieved from any thread with a call to `napi_get_threadsafe_function_context()`.

`napi_call_threadsafe_function()` can then be used for initiating a call into JavaScript. `napi_call_threadsafe_function()` accepts a parameter which controls whether the API behaves blockingly. If set to `napi_tsfn_nonblocking`, the API behaves non-blockingly, returning `napi_queue_full` if the queue was full, preventing data from being successfully added to the queue. If set to `napi_tsfn_blocking`, the API blocks until space becomes available in the queue. `napi_call_threadsafe_function()` never blocks if the thread-safe function was created with a maximum queue size of 0.

The actual call into JavaScript is controlled by the callback given via the `call_js_cb` parameter. `call_js_cb` is invoked on the main thread once for each value that was placed into the queue by a successful call to `napi_call_threadsafe_function()`. If such a callback is not given, a default callback will be used, and the resulting JavaScript call will have no arguments. The `call_js_cb` callback receives the JavaScript function to call as a `napi_value` in its parameters, as well as the `void*` context pointer used when creating the `napi_threadsafe_function`, and the next data pointer that was created by one of the secondary threads. The callback can then use an API such as `napi_call_function()` to call into JavaScript.

The callback may also be invoked with `env` and `call_js_cb` both set to `NULL` to indicate that calls into JavaScript are no longer possible, while items remain in the queue that may need to be freed. This normally occurs when the Node.js process exits while there is a thread-safe function still active.

It is not necessary to call into JavaScript via `napi_make_callback()` because N-API runs `call_js_cb` in a context appropriate for callbacks.

Threads can be added to and removed from a `napi_threadsafe_function` object during its existence. Thus, in addition to specifying an initial number of threads upon creation, `napi_acquire_threadsafe_function` can be called to indicate that a new thread will start making use of the thread-safe function. Similarly, `napi_release_threadsafe_function` can be called to indicate that an existing thread will stop making use of the thread-safe function.

`napi_threadsafe_function` objects are destroyed when every thread which uses the object has called `napi_release_threadsafe_function()` or has received a return status of `napi_closing` in response to a call to `napi_call_threadsafe_function`. The queue is emptied before the `napi_threadsafe_function` is destroyed. `napi_release_threadsafe_function()` should be the last API call made in conjunction with a given `napi_threadsafe_function`, because after the call completes, there is no guarantee that the `napi_threadsafe_function` is still allocated. For the same reason, do not make use of a thread-safe function after receiving a return value of `napi_closing` in response to a call to `napi_call_threadsafe_function`. Data associated with the `napi_threadsafe_function` can be freed in its `napi_finalize` callback which was passed to `napi_create_threadsafe_function()`.

Once the number of threads making use of a `napi_threadsafe_function` reaches zero, no further threads can start making use of it by calling `napi_acquire_threadsafe_function()`. In fact, all subsequent API calls associated with it, except `napi_release_threadsafe_function()`, will return an error value of `napi_closing`.

The thread-safe function can be "aborted" by giving a value of `napi_tsfn_abort` to `napi_release_threadsafe_function()`. This will cause all subsequent APIs associated with the thread-safe function except `napi_release_threadsafe_function()` to return `napi_closing` even before its reference count reaches zero. In particular, `napi_call_threadsafe_function()` will return `napi_closing`, thus informing the threads that it is no longer possible to make asynchronous calls to the thread-safe function. This can be used as a criterion for terminating the thread. **Upon receiving a return value of `napi_closing` from `napi_call_threadsafe_function()` a thread must make no further use of the thread-safe function because it is no longer guaranteed to be allocated.**

Similarly to libuv handles, thread-safe functions can be "referenced" and "unreferenced". A "referenced" thread-safe function will cause the event loop on the thread on which it is created to remain alive until the thread-safe function is destroyed. In contrast, an "unreferenced" thread-safe function will not prevent the event loop from exiting. The APIs `napi_ref_threadsafe_function` and `napi_unref_threadsafe_function` exist for this purpose.

### napi_create_threadsafe_function

<!-- YAML
added: v10.6.0
napiVersion: 4
changes:
  - version: v12.6.0
    pr-url: https://github.com/nodejs/node/pull/27791
    description: Made `func` parameter optional with custom `call_js_cb`.
-->

```C
NAPI_EXTERN napi_status
napi_create_threadsafe_function(napi_env env,
                                napi_value func,
                                napi_value async_resource,
                                napi_value async_resource_name,
                                size_t max_queue_size,
                                size_t initial_thread_count,
                                void* thread_finalize_data,
                                napi_finalize thread_finalize_cb,
                                void* context,
                                napi_threadsafe_function_call_js call_js_cb,
                                napi_threadsafe_function* result);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] func`: An optional JavaScript function to call from another thread. It must be provided if `NULL` is passed to `call_js_cb`.
* `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: A JavaScript string to provide an identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
* `[in] max_queue_size`: Maximum size of the queue. `0` for no limit.
* `[in] initial_thread_count`: The initial number of threads, including the main thread, which will be making use of this function.
* `[in] thread_finalize_data`: Optional data to be passed to `thread_finalize_cb`.
* `[in] thread_finalize_cb`: Optional function to call when the `napi_threadsafe_function` is being destroyed.
* `[in] context`: Optional data to attach to the resulting `napi_threadsafe_function`.
* `[in] call_js_cb`: Optional callback which calls the JavaScript function in response to a call on a different thread. This callback will be called on the main thread. If not given, the JavaScript function will be called with no parameters and with `undefined` as its `this` value.
* `[out] result`: The asynchronous thread-safe JavaScript function.

### napi_get_threadsafe_function_context

<!-- YAML
added: v10.6.0
napiVersion: 4
-->

```C
NAPI_EXTERN napi_status
napi_get_threadsafe_function_context(napi_threadsafe_function func,
                                     void** result);
```

* `[in] func`: The thread-safe function for which to retrieve the context.
* `[out] result`: The location where to store the context.

This API may be called from any thread which makes use of `func`.

### napi_call_threadsafe_function

<!-- YAML
added: v10.6.0
napiVersion: 4
-->

```C
NAPI_EXTERN napi_status
napi_call_threadsafe_function(napi_threadsafe_function func,
                              void* data,
                              napi_threadsafe_function_call_mode is_blocking);
```

* `[in] func`: The asynchronous thread-safe JavaScript function to invoke.
* `[in] data`: Data to send into JavaScript via the callback `call_js_cb` provided during the creation of the thread-safe JavaScript function.
* `[in] is_blocking`: Flag whose value can be either `napi_tsfn_blocking` to indicate that the call should block if the queue is full or `napi_tsfn_nonblocking` to indicate that the call should return immediately with a status of `napi_queue_full` whenever the queue is full.

This API will return `napi_closing` if `napi_release_threadsafe_function()` was called with `abort` set to `napi_tsfn_abort` from any thread. The value is only added to the queue if the API returns `napi_ok`.

This API may be called from any thread which makes use of `func`.

### napi_acquire_threadsafe_function

<!-- YAML
added: v10.6.0
napiVersion: 4
-->

```C
NAPI_EXTERN napi_status
napi_acquire_threadsafe_function(napi_threadsafe_function func);
```

* `[in] func`: The asynchronous thread-safe JavaScript function to start making use of.

A thread should call this API before passing `func` to any other thread-safe function APIs to indicate that it will be making use of `func`. This prevents `func` from being destroyed when all other threads have stopped making use of it.

This API may be called from any thread which will start making use of `func`.

### napi_release_threadsafe_function

<!-- YAML
added: v10.6.0
napiVersion: 4
-->

```C
NAPI_EXTERN napi_status
napi_release_threadsafe_function(napi_threadsafe_function func,
                                 napi_threadsafe_function_release_mode mode);
```

* `[in] func`: The asynchronous thread-safe JavaScript function whose reference count to decrement.
* `[in] mode`: Flag whose value can be either `napi_tsfn_release` to indicate that the current thread will make no further calls to the thread-safe function, or `napi_tsfn_abort` to indicate that in addition to the current thread, no other thread should make any further calls to the thread-safe function. If set to `napi_tsfn_abort`, further calls to `napi_call_threadsafe_function()` will return `napi_closing`, and no further values will be placed in the queue.

A thread should call this API when it stops making use of `func`. Passing `func` to any thread-safe APIs after having called this API has undefined results, as `func` may have been destroyed.

This API may be called from any thread which will stop making use of `func`.

### napi_ref_threadsafe_function

<!-- YAML
added: v10.6.0
napiVersion: 4
-->

```C
NAPI_EXTERN napi_status
napi_ref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] func`: The thread-safe function to reference.

This API is used to indicate that the event loop running on the main thread should not exit until `func` has been destroyed. Similar to [`uv_ref`][] it is also idempotent.

This API may only be called from the main thread.

### napi_unref_threadsafe_function

<!-- YAML
added: v10.6.0
napiVersion: 4
-->

```C
NAPI_EXTERN napi_status
napi_unref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

* `[in] env`: Die Umgebung, unter der die API aufgerufen wird.
* `[in] func`: The thread-safe function to unreference.

This API is used to indicate that the event loop running on the main thread may exit before `func` is destroyed. Similar to [`uv_unref`][] it is also idempotent.

This API may only be called from the main thread.
