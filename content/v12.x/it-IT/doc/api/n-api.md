# N-API

<!--introduced_in=v8.0.0-->
<!-- type=misc -->

> Stabilità: 2 - Stable

N-API (pronunciato N come la lettera stessa, seguito da API) è un'API per la creazione di Addons nativi. It is independent from the underlying JavaScript runtime (for example, V8) and is maintained as part of Node.js itself. Quest'API sarà stabile in Application Binary Interface (ABI) tra le versioni di Node.js. It is intended to insulate Addons from changes in the underlying JavaScript engine and allow modules compiled for one major version to run on later major versions of Node.js without recompilation. The [ABI Stability](https://nodejs.org/en/docs/guides/abi-stability/) guide provides a more in-depth explanation.

Addons are built/packaged with the same approach/tools outlined in the section titled [C++ Addons](addons.html). The only difference is the set of APIs that are used by the native code. Instead of using the V8 or [Native Abstractions for Node.js](https://github.com/nodejs/nan) APIs, the functions available in the N-API are used.

Le API esposte da N-API vengono generalmente utilizzate per creare e manipolare i valori di JavaScript. Concepts and operations generally map to ideas specified in the ECMA-262 Language Specification. Le API hanno le seguenti proprietà:

* Tutte le chiamate N-API restituiscono(return) uno status code di tipo `napi_status`. Questo stato indica se la chiamata API è avvenuta con successo oppure no.
* Il valore di return dell'API viene passato tramite un parametro out.
* Tutti i valori di JavaScript sono astratti dietro un tipo opaco chiamato `napi_value`.
* In caso di status code di errore, è possibile ottenere ulteriori informazioni utilizzando `napi_get_last_error_info`. Ulteriori informazioni possono essere trovate nella sezione di gestione degli errori [Gestione degli Errori](#n_api_error_handling).

Il N-API è un'API C che garantisce la stabilità dell'ABI attraverso le versioni di Node.js e diversi livelli del compilatore. A C++ API can be easier to use. To support using C++, the project maintains a C++ wrapper module called [node-addon-api](https://github.com/nodejs/node-addon-api). This wrapper provides an inlineable C++ API. Binaries built with `node-addon-api` will depend on the symbols for the N-API C-based functions exported by Node.js. `node-addon-api` is a more efficient way to write code that calls N-API. Take, for example, the following `node-addon-api` code. The first section shows the `node-addon-api` code and the second section shows what actually gets used in the addon.

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

## Building

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

## Utilizzo

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

|       | 1       | 2        | 3        | 4       | 5        |
| ----- | ------- | -------- | -------- | ------- | -------- |
| v6.x  |         |          | v6.14.2* |         |          |
| v8.x  | v8.0.0* | v8.10.0* | v8.11.2  | v8.16.0 |          |
| v9.x  | v9.0.0* | v9.3.0*  | v9.11.0* |         |          |
| v10.x |         |          | v10.0.0  |         |          |
| v11.x |         |          | v11.0.0  | v11.8.0 |          |
| v12.x |         |          |          | v12.0.0 | v12.11.0 |
| v13.x |         |          |          |         |          |

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

> Stabilità: 1 - Sperimentale

[Section 8.7](https://tc39.es/ecma262/#sec-agents) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/) defines the concept of an "Agent" as a self-contained environment in which JavaScript code runs. Multiple such Agents may be started and terminated either concurrently or in sequence by the process.

A Node.js environment corresponds to an ECMAScript Agent. In the main process, an environment is created at startup, and additional environments can be created on separate threads to serve as [worker threads](https://nodejs.org/api/worker_threads.html). When Node.js is embedded in another application, the main thread of the application may also construct and destroy a Node.js environment multiple times during the life cycle of the application process such that each Node.js environment created by the application may, in turn, during its life cycle create and destroy additional environments as worker threads.

From the perspective of a native addon this means that the bindings it provides may be called multiple times, from multiple contexts, and even concurrently from multiple threads.

Native addons may need to allocate global state of which they make use during their entire life cycle such that the state must be unique to each instance of the addon.

To this env, N-API provides a way to allocate data such that its life cycle is tied to the life cycle of the Agent.

### napi_set_instance_data
<!-- YAML
added: v12.8.0
-->

```C
napi_status napi_set_instance_data(napi_env env,
                                   void* data,
                                   napi_finalize finalize_cb,
                                   void* finalize_hint);
```

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] data`: The data item to make available to bindings of this instance.
* `[in] finalize_cb`: The function to call when the environment is being torn down. The function receives `data` so that it might free it.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.

Restituisce `napi_ok` se l'API ha esito positivo.

This API associates `data` with the currently running Agent. `data` can later be retrieved using `napi_get_instance_data()`. Any existing data associated with the currently running Agent which was set by means of a previous call to `napi_set_instance_data()` will be overwritten. If a `finalize_cb` was provided by the previous call, it will not be called.

### napi_get_instance_data
<!-- YAML
added: v12.8.0
-->

```C
napi_status napi_get_instance_data(napi_env env,
                                   void** data);
```

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[out] data`: The data item that was previously associated with the currently running Agent by a call to `napi_set_instance_data()`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API retrieves data that was previously associated with the currently running Agent via `napi_set_instance_data()`. If no data is set, the call will succeed and `data` will be set to `NULL`.

## Data Types N-API di base

N-API espone i seguenti datatypes fondamentali come abstractions che vengono utilizzate dalle varie API. Queste API devono essere considerate come opache, auto-esaminabile (introspectable) solo con altre chiamate N-API.

### napi_status
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Status code integrale che indica il successo oppure il fallimento di una chiamata N-API. Attualmente sono supportati i seguenti status codes.

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

Se viene richiesta qualche informazione aggiuntiva su un'API che restituisce un failed status, può essere ottenuta chiamando `napi_get_last_error_info`.

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

* `error_message`: Stringa con codifica UTF8 contenente una descrizione neutrale dell'errore da parte della VM.
* `engine_reserved`: Riservato per i dettagli degli errori specifici della VM. Questo non è attualmente implementato per qualsiasi VM.
* `engine_error_code`: Error code specifico della VM. Questo non è attualmente implementato per qualsiasi VM.
* `error_code`: Lo status code di N-API che ha avuto origine con l'ultimo errore.

Vedi la sezione [Gestione degli Errori](#n_api_error_handling) per ulteriori informazioni.

### napi_env

`napi_env` viene utilizzato per rappresentare un contesto che l'implementazione N-API sottostante può utilizzare per mantenere lo stato specifico della VM. Questa struttura viene passata alle funzioni native quando vengono invocate, e dev'essere passata indietro quando si effettuano chiamate N-API. Nello specifico, lo stesso `napi_env`, che è stato passato quand'è stata chiamata la funzione nativa iniziale, deve essere passato a tutte le successive chiamate N-API nidificate. Non è consentito memorizzare nella cache `napi_env` ai fini del riutilizzo generale.

### napi_value

Questo è un puntatore opaco che viene utilizzato per rappresentare un valore JavaScript.

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

### Tipi di N-API Memory Management
#### napi_handle_scope

Questa è un'abstraction utilizzata per controllare e modificare la durata degli objects creati all'interno di un particolare scope. In generale, i valori N-API vengono creati nel contesto di un handle scope. Nel momento in cui un metodo nativo viene chiamato da JavaScript, esisterà un handle scope predefinito. Se l'utente non crea esplicitamente un nuovo handle scope, i valori N-API verranno creati nell'handle scope predefinito. Per ogni invocazione di codice al di fuori dell'esecuzione di un metodo nativo (ad esempio, durante l'invocazione di una callback per libuv), è richiesto il modulo per creare uno scope prima di invocare qualsiasi funzione che può comportare la creazione di valori JavaScript.

Gli handle scopes vengono creati usando [`napi_open_handle_scope`][] e vengono distrutti usando [`napi_close_handle_scope`][]. Closing the scope can indicate to the GC that all `napi_value`s created during the lifetime of the handle scope are no longer referenced from the current stack frame.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Gli handle scopes di tipo escapable sono un tipo speciale di handle scope per restituire valori creati all'interno di un particolare handle scope ad un parent scope.

#### napi_ref
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Questa è l'abstraction da usare per fare riferimento a 

`napi_value`. Ciò consente agli utenti di gestire la durata dei valori JavaScript, compresa la definizione in modo esplicito della loro durata minima.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

### Tipi di N-API Callback
#### napi_callback_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Datatype opaco passato ad una funzione di callback. Può essere utilizzato per ottenere informazioni aggiuntive sul contesto in cui è stato invocato il callback.

#### napi_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Tipo di funzione puntatore per le funzioni native fornite dall'utente che devono essere esposte a JavaScript tramite N-API. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Tipo di funzione puntatore per funzioni aggiuntive fornite che consente all'utente di essere avvisato quando i dati di proprietà esterna sono pronti per essere puliti poichè l'oggetto con cui è stato associato è stato sottoposto alla garbage collection. L'utente deve fornire una funzione che soddisfi la seguente dicitura che verrebbe chiamata sulla collection dell'object. Al momento, 

`napi_finalize` può essere utilizzato per scoprire quando avviene la collection di objects con dati esterni.

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
Funzione puntatore utilizzato con funzioni che supportano operazioni asincrone. Callback functions must satisfy the following signature:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

Implementations of this function must avoid making N-API calls that execute JavaScript or interact with JavaScript objects.  N-API calls should be in the `napi_async_complete_callback` instead. Do not use the `napi_env` parameter as it will likely result in execution of JavaScript.

#### napi_async_complete_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Funzione puntatore utilizzato con funzioni che supportano operazioni asincrone. Callback functions must satisfy the following signature:

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

## Gestione degli Errori

N-API utilizza sia i valori return che le eccezioni JavaScript per la gestione degli errori. Le seguenti sezioni spiegano l'approccio per ciascun caso.

### Valori Return

Tutte le funzioni N-API condividono lo stesso modello di gestione degli errori. Il tipo di return di tutte le funzioni API è `napi_status`.

Il valore return sarà `napi_ok` se la richiesta è stata eseguita correttamente e se non è stata generata alcuna eccezione JavaScript non rilevata. Se si è verificato un errore ED è stata generata un'eccezione, verrà restituito il valore `napi_status` per l'errore. Se è stata generata un'eccezione, e non si è verificato alcun errore, verrà restituito `napi_pending_exception`.

Nei casi in cui viene restituito un valore return diverso da `napi_ok` o `napi_pending_exception`, è necessario chiamare [`napi_is_exception_pending`][] per verificare se c'è un'eccezione in sospeso. Vedi la sezione sulle eccezioni per maggiori dettagli.

The full set of possible `napi_status` values is defined in `napi_api_types.h`.

Il valore return `napi_status` fornisce una rappresentazione indipendente dell'errore verificatosi da parte della VM. In alcuni casi è utile essere in grado di ottenere informazioni più dettagliate, includendo una stringa che rappresenta l'errore e le informazioni specifiche della VM (engine).

Per recuperare queste informazioni viene fornito [`napi_get_last_error_info`][] che restituisce una struttura `napi_extended_error_info`. Il formato della struttura `napi_extended_error_info` è il seguente:

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

* `error_message`: Rappresentazione testuale dell'errore che si è verificato.
* `engine_reserved`: Handle opaco riservato solo all'uso dell'engine.
* `engine_error_code`: Error code specifico della VM.
* `error_code`: Status code n-api per l'ultimo errore.

[`napi_get_last_error_info`][] restituisce le informazioni per l'ultima chiamata N-API che è stata effettuata.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: La struttura `napi_extended_error_info` con ulteriori informazioni sull'errore.

Restituisce `napi_ok` se l'API ha esito positivo.

This API retrieves a `napi_extended_error_info` structure with information about the last error that occurred.

The content of the `napi_extended_error_info` returned is only valid up until an n-api function is called on the same `env`.

Do not rely on the content or format of any of the extended information as it is not subject to SemVer and may change at any time. It is intended only for logging purposes.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Eccezioni

Qualsiasi chiamata alla funzione N-API può causare un'eccezione JavaScript in sospeso. Questo è ovviamente il caso per qualsiasi funzione che potrebbe causare l'esecuzione di JavaScript, ma N-API specifica che un'eccezione potrebbe essere in attesa di return da una qualsiasi delle funzioni API.

Se il `napi_status` restituito da una funzione è `napi_ok`, allora non è in sospeso alcuna eccezione e non è richiesta alcuna azione aggiuntiva. Se il `napi_status` restituito è qualcosa di diverso da `napi_ok` o `napi_pending_exception`, per provare a recuperare e continuare anzichè restituire immediatamente, bisogna chiamare [`napi_is_exception_pending`][] per determinare se un'eccezione è in sospeso o meno.

In many cases when an N-API function is called and an exception is already pending, the function will return immediately with a `napi_status` of `napi_pending_exception`. However, this is not the case for all functions. N-API allows a subset of the functions to be called to allow for some minimal cleanup before returning to JavaScript. In that case, `napi_status` will reflect the status for the function. It will not reflect previous pending exceptions. To avoid confusion, check the error status after every function call.

Quando un'eccezione è in sospeso, è possibile utilizzare uno dei seguenti due approcci.

Il primo approccio consiste nel fare qualsiasi pulizia appropriata e successivamente fare il return in modo che l'esecuzione ritorni a JavaScript. As part of the transition back to JavaScript, the exception will be thrown at the point in the JavaScript code where the native method was invoked. The behavior of most N-API calls is unspecified while an exception is pending, and many will simply return `napi_pending_exception`, so do as little as possible and then return to JavaScript where the exception can be handled.

Il secondo approccio è provare a gestire l'eccezione. Ci saranno casi in cui il codice nativo può catturare l'eccezione, bisogna prendere l'azione giusta e dopo continuare. Questo è consigliato solo nei casi specifici in cui è noto che l'eccezione può essere gestita in sicurezza. In questi casi [`napi_get_and_clear_last_exception`][] può essere utilizzato per ottenere e cancellare l'eccezione. On success, result will contain the handle to the last JavaScript `Object` thrown. If it is determined, after retrieving the exception, the exception cannot be handled after all it can be re-thrown it with [`napi_throw`][] where error is the JavaScript `Error` object to be thrown.

The following utility functions are also available in case native code needs to throw an exception or determine if a `napi_value` is an instance of a JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] and [`napi_is_error`][].

The following utility functions are also available in case native code needs to create an `Error` object: [`napi_create_error`][], [`napi_create_type_error`][], and [`napi_create_range_error`][], where result is the `napi_value` that refers to the newly created JavaScript `Error` object.

Il progetto Node.js aggiunge error codes a tutti gli errori generati internamente. L'obiettivo è che le applicazioni utilizzino questi error codes per il controllo di tutti gli errori. I messaggi di errato associato rimarranno, ma verranno utilizzati solo per la registrazione e la visualizzazione con l'aspettativa che il messaggio possa cambiare senza applicare SemVer. Per supportare questo modello con N-API, sia nelle funzionalità interne che per le funzionalità specifiche del modulo (come buona pratica), le funzioni `throw_` e `create_` richiedono un parametro di codice opzionale che è la stringa per il codice da aggiungere all'error object. Se il parametro opzionale è NULL, nessun codice verrà associato all'errore. Se viene fornito un codice, viene aggiornato anche il nome associato all'errore:

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] error`: Il valore JavaScript da lanciare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia il valore JavaScript fornito.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] code`: Error code opzionale da impostare sull'errore.
* `[in] msg`: C string representing the text to be associated with the error.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `Error` con il testo fornito.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] code`: Error code opzionale da impostare sull'errore.
* `[in] msg`: C string representing the text to be associated with the error.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `TypeError` con il testo fornito.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] code`: Error code opzionale da impostare sull'errore.
* `[in] msg`: C string representing the text to be associated with the error.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript `RangeError` con il testo fornito.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: The `napi_value` to be checked.
* `[out] result`: Valore booleano impostato su true se `napi_value` rappresenta un errore, in caso contrario false.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API richiede un `napi_value` per verificare se rappresenta un error object.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `Error` con il testo fornito.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `TypeError` con il testo fornito.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript `RangeError` con il testo fornito.

#### napi_get_and_clear_last_exception
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: L'eccezione se una è in sospeso, in caso contrario NULL.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_is_exception_pending
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: Valore booleano impostato su true se è in sospeso un'eccezione.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_fatal_exception
<!-- YAML
added: v9.10.0
napiVersion: 3
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] err`: The error that is passed to `'uncaughtException'`.

Attiva un `'uncaughtException'` in JavaScript. Utile se una callback asincrona lancia un'eccezione senza possibilità di recupero.

### Fatal Errors

In caso di errore irreversibile in un modulo nativo, è possibile lanciare un fatal error per interrompere immediatamente il processo.

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

* `[in] location`: Posizione opzionale in cui si è verificato l'errore.
* `[in] location_len`: La lunghezza della posizione in bytes, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
* `[in] message`: Il messaggio associato all'errore.
* `[in] message_len`: The length of the message in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.

La funzione call non restituisce nulla, il processo verrà terminato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Object Lifetime management

Quando vengono effettuate le N-API calls, gli handles per gli objects nell'heap per la VM sottostante possono essere restituiti come `napi_values`. Questi handles devono mantenere gli objects 'vivi' fino a quando non sono più richiesti dal codice nativo, altrimenti gli objects potrebbero essere raccolti prima che il codice nativo finisca di usarli.

Man mano che object handles vengono restituiti, essi vengono associati a uno 'scope'. La durata dello scope predefinito è legata alla durata della chiamata al metodo nativo. Il risultato è che, per impostazione predefinita, gli handles restano validi e gli objects associati a questi handles verranno mantenuti vivi per la durata della chiamata al metodo nativo.

In molti casi, tuttavia, è necessario che gli handles restino validi per una durata più breve o più lunga rispetto a quella del metodo nativo. The sections which follow describe the N-API functions that can be used to change the handle lifespan from the default.

### Rendere la durata dell'handle più breve rispetto a quella del metodo nativo
Spesso è necessario rendere la durata degli handles più breve rispetto alla durata di un metodo nativo. Ad esempio, si consideri un metodo nativo che ha un ciclo che itera attraverso gli elementi in un array di grandi dimensioni:

```C
for (int i = 0; i < 1000000; i++) {
  napi_value result;
  napi_status status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // fare qualcosa con l'elemento.
}
```

Questo comporterebbe la creazione di un numero elevato di handles, che consumano risorse sostanziali. Inoltre, anche se il codice nativo potrebbe usare solo l'handle più recente, tutti gli objects associati sarebbero mantenuti in vita poiché condividono tutti lo stesso scope.

Per gestire questo caso, N-API offre la capacità di stabilire un nuovo 'scope' al quale verranno associati gli handles appena creati. Una volta che tali handles non sono più necessari, lo scope può essere 'chiuso' e qualsiasi handle associato allo scope viene invalidato. I metodi disponibili per aprire/chiudere gli scopes sono [`napi_open_handle_scope`][] e [`napi_close_handle_scope`][].

N-API supporta solo una singola gerarchia nidificata di scopes. C'è un solo scope attivo in qualsiasi momento e tutti i nuovi handles saranno associati ad esso mentre è attivo. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati aperti. Inoltre, tutti gli scopes creati all'interno di un metodo nativo devono essere chiusi prima di ritornare da quel metodo.

Prendendo l'esempio precedente, l'aggiunta di calls a [`napi_open_handle_scope`][] e [`napi_close_handle_scope`][] assicurerebbe che, al massimo, un singolo handle sia valido durante l'esecuzione del ciclo:

```C
or (int i = 0; i < 1000000; i++) {
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
  // fare qualcosa con l'elemento
  status = napi_close_handle_scope(env, scope);
  if (status != napi_ok) {
    break;
  }
}
```

Quando si annidano gli scopes, ci sono casi in cui un handle da uno scope interno debba vivere oltre la durata di quello scope. N-API supporta un 'escapable scope' al fine di sostenere questo caso. Un escapable scope consente ad un handle di essere 'promosso' in modo che esso 'ignori' lo scope corrente e la sua durata cambi da quella dello scope corrente a quella dello scope esterno.

The methods available to open/close escapable scopes are [`napi_open_escapable_handle_scope`][] and [`napi_close_escapable_handle_scope`][].

La richiesta per promuovere un handle viene effettuata tramite [`napi_escape_handle`][] che può essere chiamato una sola volta.

#### napi_open_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope.

#### napi_close_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati creati.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope da cui è possibile promuovere un oggetto allo scope esterno.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Gli scopes devono essere chiusi nell'ordine inverso a quello in cui sono stati creati.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] scope`: `napi_value` che rappresenta lo scope corrente.
* `[in] escapee`: `napi_value` representing the JavaScript `Object` to be escaped.
* `[out] result`: `napi_value` representing the handle to the escaped `Object` in the outer scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API promuove l'handle per il JavaScript object in modo che sia valido per la durata dello scope esterno. Può essere chiamato solo una volta per ogni scope. Se viene chiamato più di una volta, verrà restituito un errore.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Reference ad objects con una durata superiore a quella del metodo nativo

In alcuni casi un addon dovrà essere in grado di creare e fare reference ad objects con una durata superiore a quella di una sola invocazione del metodo nativo. Ad esempio, per creare un constructor e successivamente utilizzare tale constructor in una richiesta per creare istanze, deve essere possibile fare reference al constructor object in richieste di creazione di istanze di ogni tipo. Questo non sarebbe possibile con un handle normale restituito come `napi_value` come descritto nella sezione precedente. La durata di un normale handle è gestita dagli scopes e tutti gli scopes devono essere chiusi prima della fine di un metodo nativo.

N-API fornisce metodi per creare reference persistenti ad un object. Ogni reference persistente ha un count associato con un valore pari a 0 o superiore. Il count determina se il reference manterrà vivo l'oggetto corrispondente. I reference con un count di 0 non impediscono la raccolta dell'object e sono spesso denominati reference 'deboli'. Qualsiasi count superiore a 0 impedirà la raccolta dell'object.

I reference possono essere creati con un reference count iniziale. Il count può quindi essere modificato tramite [`napi_reference_ref`][] e [`napi_reference_unref`][]. Se un object viene raccolto mentre il count per un reference è 0, tutte le chiamate successive per ottenere l'object associato al reference [`napi_get_reference_value`][] restituiranno NULL per il valore restituito `napi_value`. Un tentativo di chiamare [`napi_reference_ref`][] per un reference il cui object è stato raccolto genererà un errore.

I reference devono essere cancellati una volta che non sono più richiesti dall'addon. Quando un reference viene eliminato, non impedirà più all'object corrispondente di essere raccolto. La mancata eliminazione di un reference persistente comporterà una 'perdita di memoria' sia con la memoria nativa per il reference persistente sia con l'object corrispondente sull'heap che sarà mantenuto per sempre.

Possono essere creati più reference persistenti che si riferiscono allo stesso object, ognuno dei quali manterrà l'object vivo o meno in base al proprio count.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing the `Object` to which we want a reference.
* `[in] initial_refcount`: Reference count iniziale per il nuovo reference.
* `[out] result`: `napi_ref` che punta al nuovo reference.

Restituisce `napi_ok` se l'API ha esito positivo.

This API create a new reference with the specified reference count to the `Object` passed in.

#### napi_delete_reference
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] ref`: `napi_ref` da cancellare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API cancella il reference passato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] ref`: `napi_ref` per il quale verrà incrementato il reference count.
* `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API incrementa il reference count per il reference passato e restituisce il reference count risultante.

#### napi_reference_unref
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_reference_unref(napi_env env,
                                             napi_ref ref,
                                             uint32_t* result););
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] ref`: `napi_ref` per il quale verrà decrementato il reference count.
* `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API decrementa il reference count per il reference passato e restituisce il reference count risultante.

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

il `napi_value` passato all'interno o all'esterno da questi metodi è un handle per l'object a cui è collegato il reference.

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] ref`: `napi_ref` per il quale richiediamo l'`Object` corrispondente.
* `[out] result`: The `napi_value` for the `Object` referenced by the `napi_ref`.

Restituisce `napi_ok` se l'API ha esito positivo.

If still valid, this API returns the `napi_value` representing the JavaScript `Object` associated with the `napi_ref`. In caso contrario, il risultato sarà NULL.

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

## Registrazione del Modulo
I moduli N-API sono registrati in modo simile ad altri moduli tranne per il fatto che anziché utilizzare la macro `NODE_MODULE` viene utilizzata la seguente:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

La prossima differenza è la dicitura per il metodo `Init`. Per un modulo N-API è la seguente:

```C
napi_value Init(napi_env env, napi_value exports);
```

Il valore restituito da `Init` viene considerato come `exports` object per il modulo. Il metodo `Init` passa un empty object tramite il parametro `exports` per comodità. Se `Init` restituisce NULL, il parametro passato come `exports` viene esportato dal modulo. I moduli N-API non possono modificare il `module` object ma possono specificare qualsiasi cosa come la proprietà `exports` del modulo.

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

Per impostare una funzione in modo che venga restituita da `require()` per l'addon:

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
// NOTA: esempio parziale, non è incluso tutto il codice di riferimento
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

Per maggiori dettagli sul settaggio delle proprietà sugli objects, vedi la sezione [Lavorare con le proprietà JavaScript](#n_api_working_with_javascript_properties).

For more details on building addon modules in general, refer to the existing API.

## Lavorare con i valori JavaScript
N-API espone un set di API per creare tutti i tipi di valori JavaScript. Some of these types are documented under [Section 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Fondamentalmente, queste API vengono utilizzate per eseguire una delle seguenti operazioni:

1. Creare un nuovo JavaScript object
2. Convertire da un tipo C primitivo ad un valore N-API
3. Converti da un valore N-API ad un tipo C primitivo
4. Ottenere istanze globali tra cui `undefined` e `null`

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un un valore JavaScript accetta un `napi_value`. In alcuni casi, l'API controlla il tipo del `napi_value` in anticipo. Tuttavia, per prestazioni migliori, è meglio che il caller si assicuri che il `napi_value` in questione sia del tipo JavaScript previsto dall'API.

### Tipi di Enum
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

Descrive il tipo di `napi_value`. This generally corresponds to the types described in [Section 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) of the ECMAScript Language Specification. In addition to types in that section, `napi_valuetype` can also represent `Function`s and `Object`s with external data.

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

Questo rappresenta il datatype scalare binario sottostante di `TypedArray`. Elements of this enum correspond to [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

### Funzioni per la creazione di Objects
#### napi_create_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `Array`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript `Array`. JavaScript arrays are described in [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) of the ECMAScript Language Specification.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] length`: La lunghezza iniziale dell'`Array`.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `Array`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript `Array`. La proprietà della lunghezza dell'`Array` è impostata sul parametro della lunghezza passata/approvata. However, the underlying buffer is not guaranteed to be pre-allocated by the VM when the array is created. That behavior is left to the underlying VM implementation. Se il buffer deve essere un blocco contiguo di memoria che può essere letto e/o scritto direttamente tramite C, considerare l'utilizzo di [`napi_create_external_arraybuffer`][].

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] length`: La lunghezza in bytes dell'array buffer da creare.
* `[out] data`: Puntatore al byte buffer sottostante di `ArrayBuffer`.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript `ArrayBuffer`. Gli `ArrayBuffer` sono usati per rappresentare i buffers di dati binari a lunghezza fissa. They are normally used as a backing-buffer for `TypedArray` objects. The `ArrayBuffer` allocated will have an underlying byte buffer whose size is determined by the `length` parameter that's passed in. Il buffer sottostante viene restituito in modo facoltativo al caller nel caso in cui il caller voglia manipolare direttamente il buffer. Questo buffer può essere scritto solo direttamente dal codice nativo. To write to this buffer from JavaScript, a typed array or `DataView` object would need to be created.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] size`: Dimensione in bytes del buffer sottostante.
* `[out] data`: Puntatore Raw al buffer sottostante.
* `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] size`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
* `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
* `[out] result_data`: Puntatore al buffer dei dati sottostanti del nuovo `Buffer`.
* `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object e lo inizializza con i dati copiati dal buffer passato/approvato. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] time`: ECMAScript time value in milliseconds since 01 January, 1970 UTC.
* `[out] result`: A `napi_value` representing a JavaScript `Date`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] data`: Puntatore Raw ai dati esterni.
* `[in] finalize_cb`: Optional callback to call when the external value is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Un `napi_value` che rappresenta un valore esterno.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un valore JavaScript con dati esterni associati ad esso. This is used to pass external data through JavaScript code, so it can be retrieved later by native code using [`napi_get_value_external`][].

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] external_data`: Pointer to the underlying byte buffer of the `ArrayBuffer`.
* `[in] byte_length`: La lunghezza in bytes del buffer sottostante.
* `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript `ArrayBuffer`. The underlying byte buffer of the `ArrayBuffer` is externally allocated and managed. Il caller deve assicurarsi che il byte buffer rimanga valido fino alla chiamata del callback finalizzato.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] length`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
* `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
* `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object e lo inizializza con i dati supportati dal buffer passato/approvato. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: A `napi_value` representing a JavaScript `Object`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API allocates a default JavaScript `Object`. È l'equivalente di fare `new Object()` in JavaScript.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] description`: Optional `napi_value` which refers to a JavaScript `String` to be set as the description for the symbol.
* `[out] result`: A `napi_value` representing a JavaScript `Symbol`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript `Symbol` object from a UTF8-encoded C string.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] type`: Scalar datatype of the elements within the `TypedArray`.
* `[in] length`: Number of elements in the `TypedArray`.
* `[in] arraybuffer`: `ArrayBuffer` underlying the typed array.
* `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `TypedArray`.
* `[out] result`: A `napi_value` representing a JavaScript `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] length`: Number of elements in the `DataView`.
* `[in] arraybuffer`: `ArrayBuffer` underlying the `DataView`.
* `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `DataView`.
* `[out] result`: A `napi_value` representing a JavaScript `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript `DataView` object over an existing `ArrayBuffer`. `DataView` objects provide an array-like view over an underlying data buffer, but one which allows items of different size and type in the `ArrayBuffer`.

È richiesto che `byte_length + byte_offset` sia minore o uguale alla dimensione in bytes dell'array passato/approvato. If not, a `RangeError` exception is raised.

JavaScript `DataView` objects are described in [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) of the ECMAScript Language Specification.

### Funzioni per la conversione da tipi C a N-API
#### napi_create_int32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Valore integer da rappresentare in JavaScript.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Valore unsigned integer da rappresentare in JavaScript.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Valore integer da rappresentare in JavaScript.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to convert from the C `int64_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification. Nota che l'intervallo completo di `int64_t` non può essere rappresentato con la massima precisione in JavaScript. Integer values outside the range of [`Number.MIN_SAFE_INTEGER`][] `-(2^53 - 1)` - [`Number.MAX_SAFE_INTEGER`][] `(2^53 - 1)` will lose precision.

#### napi_create_double
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Valore double-precision(doppia precisione) da rappresentare in JavaScript.
* `[out] result`: Un `napi_value` che rappresenta un JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to convert from the C `double` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_bigint_int64
<!-- YAML
added: v10.7.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_create_bigint_int64(napi_env env,
                                     int64_t value,
                                     napi_value* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Valore integer da rappresentare in JavaScript.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API converts the C `int64_t` type to the JavaScript `BigInt` type.

#### napi_create_bigint_uint64
<!-- YAML
added: v10.7.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_create_bigint_uint64(napi_env env,
                                      uint64_t value,
                                      napi_value* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Valore unsigned integer da rappresentare in JavaScript.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API converts the C `uint64_t` type to the JavaScript `BigInt` type.

#### napi_create_bigint_words
<!-- YAML
added: v10.7.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_create_bigint_words(napi_env env,
                                     int sign_bit,
                                     size_t word_count,
                                     const uint64_t* words,
                                     napi_value* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] sign_bit`: Determines if the resulting `BigInt` will be positive or negative.
* `[in] word_count`: The length of the `words` array.
* `[in] words`: An array of `uint64_t` little-endian 64-bit words.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] str`: Character buffer representing an ISO-8859-1-encoded string.
* `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript `String` object from an ISO-8859-1-encoded C string. La stringa nativa viene copiata.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] str`: Character buffer che rappresenta una stringa con codifica UTF16-LE.
* `[in] length`: La lunghezza della stringa in two-byte code units, oppure `NAPI_AUTO_LENGTH` se è null-terminated.
* `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript `String` object from a UTF16-LE-encoded C string. La stringa nativa viene copiata.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] str`: Character buffer che rappresenta una stringa con codifica UTF8.
* `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[out] result`: Un `napi_value` che rappresenta una JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript `String` object from a UTF8-encoded C string. La stringa nativa viene copiata.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

### Funzioni per la conversione da N-API a tipi C
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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing the JavaScript `Array` whose length is being queried.
* `[out] result`: `uint32` che rappresenta la lunghezza dell'array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce la lunghezza di un'array.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] arraybuffer`: `napi_value` representing the `ArrayBuffer` being queried.
* `[out] data`: The underlying data buffer of the `ArrayBuffer`.
* `[out] byte_length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` che rappresenta il `node::Buffer` interrogato.
* `[out] data`: Il data buffer sottostante al `node::Buffer`.
* `[out] length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API viene utilizzata per recuperare il data buffer sottostante di un `node::Buffer` e la sua lunghezza.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] object`: `napi_value` representing JavaScript `Object` whose prototype to return. Questo restituisce l'equivalente di `Object.getPrototypeOf` (che non ha lo stesso ruolo della proprietà del `prototype` della funzione).
* `[out] result`: `napi_value` che rappresenta il prototipo dell'object dato.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] typedarray`: `napi_value` representing the `TypedArray` whose properties to query.
* `[out] type`: Scalar datatype of the elements within the `TypedArray`.
* `[out] length`: The number of elements in the `TypedArray`.
* `[out] data`: The data buffer underlying the `TypedArray` adjusted by the `byte_offset` value so that it points to the first element in the `TypedArray`.
* `[out] arraybuffer`: The `ArrayBuffer` underlying the `TypedArray`.
* `[out] byte_offset`: The byte offset within the underlying native array at which the first element of the arrays is located. The value for the data parameter has already been adjusted so that data points to the first element in the array. Therefore, the first byte of the native array would be at `data - byte_offset`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un array tipizzato (typed array).

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] dataview`: `napi_value` representing the `DataView` whose properties to query.
* `[out] byte_length`: `Number` of bytes in the `DataView`.
* `[out] data`: The data buffer underlying the `DataView`.
* `[out] arraybuffer`: `ArrayBuffer` underlying the `DataView`.
* `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns various properties of a `DataView`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing a JavaScript `Date`.
* `[out] result`: Time value as a `double` represented as milliseconds since midnight at the beginning of 01 January, 1970 UTC.

This API does not observe leap seconds; they are ignored, as ECMAScript aligns with POSIX time specification.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-date `napi_value` is passed in it returns `napi_date_expected`.

This API returns the C double primitive of time value for the given JavaScript `Date`.

#### napi_get_value_bool
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `Boolean`.
* `[out] result`: C boolean primitive equivalent of the given JavaScript `Boolean`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non booleano esso restituisce `napi_boolean_expected`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C double primitive equivalent of the given JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

This API returns the C double primitive equivalent of the given JavaScript `Number`.

#### napi_get_value_bigint_int64
<!-- YAML
added: v10.7.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_get_value_bigint_int64(napi_env env,
                                        napi_value value,
                                        int64_t* result,
                                        bool* lossless);
```

* `[in] env`: The environment that the API is invoked under
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] result`: C `int64_t` primitive equivalent of the given JavaScript `BigInt`.
* `[out] lossless`: Indicates whether the `BigInt` value was converted losslessly.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-`BigInt` is passed in it returns `napi_bigint_expected`.

This API returns the C `int64_t` primitive equivalent of the given JavaScript `BigInt`. If needed it will truncate the value, setting `lossless` to `false`.

#### napi_get_value_bigint_uint64
<!-- YAML
added: v10.7.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_get_value_bigint_uint64(napi_env env,
                                        napi_value value,
                                        uint64_t* result,
                                        bool* lossless);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] result`: C `uint64_t` primitive equivalent of the given JavaScript `BigInt`.
* `[out] lossless`: Indicates whether the `BigInt` value was converted losslessly.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-`BigInt` is passed in it returns `napi_bigint_expected`.

This API returns the C `uint64_t` primitive equivalent of the given JavaScript `BigInt`. If needed it will truncate the value, setting `lossless` to `false`.

#### napi_get_value_bigint_words
<!-- YAML
added: v10.7.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_get_value_bigint_words(napi_env env,
                                        napi_value value,
                                        int* sign_bit,
                                        size_t* word_count,
                                        uint64_t* words);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] sign_bit`: Integer representing if the JavaScript `BigInt` is positive or negative.
* `[in/out] word_count`: Must be initialized to the length of the `words` array. Upon return, it will be set to the actual number of words that would be needed to store this `BigInt`.
* `[out] words`: Pointer to a pre-allocated 64-bit word array.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` che rappresenta un valore esterno di JavaScript.
* `[out] result`: Puntatore ai dati che hanno subito il wrapping da parte del valore esterno di JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non esterno esso restituisce `napi_invalid_arg`.

Quest'API recupera il puntatore ai dati esterni passato in precedenza a `napi_create_external()`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C `int32` primitive equivalent of the given JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico in `napi_number_expected`.

This API returns the C `int32` primitive equivalent of the given JavaScript `Number`.

Se il numero supera l'intervallo del valore integer a 32 bit, allora il risultato viene troncato all'equivalente dei 32 bits inferiori. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C `int64` primitive equivalent of the given JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
* `[in] buf`: Buffer nel quale scrivere la stringa con codifica ISO-8859-1. Se viene passato NULL, viene restituita la lunghezza della stringa (in bytes).
* `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
* `[out] result`: Numero di bytes copiati all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Quest'API restituisce la stringa con codifica ISO-8859-1 corrispondente al valore passato.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
* `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF8. Se viene passato NULL, viene restituita la lunghezza della stringa (in bytes).
* `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
* `[out] result`: Numero di bytes copiati all'interno del buffer, escluso il null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Quest'API restituisce la stringa con codifica UTF8 corrispondente al valore passato.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
* `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF16-LE. Se viene passato NULL, viene restituita la lunghezza della stringa (in unità di codice a 2 byte).
* `[in] bufsize`: Dimensione del buffer di destinazione. Quando questo valore è insufficiente, la stringa restituita verrà troncata.
* `[out] result`: Number of 2-byte code units copied into the buffer, excluding the null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Quest'API restituisce la stringa con codifica UTF16 corrispondente al valore passato.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C primitivo equivalente al `napi_value` fornito come un `uint32_t`.

Restituisce `napi_ok` se l'API ha esito positivo. Se viene passato un valore `napi_value` non numerico esso restituisce `napi_number_expected`.

Quest'API restituisce un C primitivo equivalente al `napi_value` fornito come un `uint32_t`.

### Funzioni per ottenere istanze globali
#### napi_get_boolean
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore del booleano da recuperare.
* `[out] result`: `napi_value` representing JavaScript `Boolean` singleton to retrieve.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to return the JavaScript singleton object that is used to represent the given boolean value.

#### napi_get_global
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: `napi_value` representing JavaScript `global` object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the `global` object.

#### napi_get_null
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: `napi_value` representing JavaScript `null` object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the `null` object.

#### napi_get_undefined
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: `napi_value` che rappresenta un valore JavaScript Undefined.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce l'Undefined object.

## Working with JavaScript Values and Abstract Operations

N-API fornisce un set di API per eseguire alcune abstract operations su valori JavaScript. Some of these operations are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Queste API supportano una delle seguenti operations:

1. Coerce JavaScript values to specific JavaScript types (such as `Number` or `String`).
2. Controllare il tipo di un valore JavaScript.
3. Verificare l'uguaglianza tra due valori JavaScript.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da forzare.
* `[out] result`: `napi_value` representing the coerced JavaScript `Boolean`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da forzare.
* `[out] result`: `napi_value` representing the coerced JavaScript `Number`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da forzare.
* `[out] result`: `napi_value` representing the coerced JavaScript `Object`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da forzare.
* `[out] result`: `napi_value` representing the coerced JavaScript `String`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API implements the abstract operation `ToString()` as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_typeof
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript il cui tipo è da interrogare.
* `[out] result`: Il tipo del valore JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

* `napi_invalid_arg` se il tipo di `value` non è un tipo ECMAScript noto e se `value` non è un valore esterno.

Quest'API si comporta in modo simile all'invocazione del `typeof` Operator sull'object come definito nella [Section 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) dell'ECMAScript Language Specification. Tuttavia, ha il supporto per rilevare un valore esterno. Se `value` ha un tipo che non è valido, viene restituito un errore.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] object`: Il valore JavaScript da verificare.
* `[in] constructor`: The JavaScript function object of the constructor function to check against.
* `[out] result`: Valore booleano impostato su true se `object instanceof constructor` è true.

Restituisce `napi_ok` se l'API ha esito positivo.

This API represents invoking the `instanceof` Operator on the object as defined in [Section 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) of the ECMAScript Language Specification.

### napi_is_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Se l'object fornito è un array.

Restituisce `napi_ok` se l'API ha esito positivo.

This API represents invoking the `IsArray` operation on the object as defined in [Section 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) of the ECMAScript Language Specification.

### napi_is_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Whether the given object is an `ArrayBuffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API checks if the `Object` passed in is an array buffer.

### napi_is_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Se il `napi_value` fornito rappresenta un `node::Buffer` object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API checks if the `Object` passed in is a buffer.

### napi_is_date
<!-- YAML
added: v11.11.0
napiVersion: 5
-->

```C
napi_status napi_is_date(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Whether the given `napi_value` represents a JavaScript `Date` object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API checks if the `Object` passed in is a date.

### napi_is_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Whether the given `napi_value` represents an `Error` object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API checks if the `Object` passed in is an `Error`.

### napi_is_typedarray
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Whether the given `napi_value` represents a `TypedArray`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API checks if the `Object` passed in is a typed array.

### napi_is_dataview
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] value`: Il valore JavaScript da verificare.
* `[out] result`: Whether the given `napi_value` represents a `DataView`.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] lhs`: Il valore JavaScript da verificare.
* `[in] rhs`: Il valore JavaScript con il quale verificarlo.
* `[out] result`: Se i due `napi_value` objects sono uguali.

Restituisce `napi_ok` se l'API ha esito positivo.

This API represents the invocation of the Strict Equality algorithm as defined in [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) of the ECMAScript Language Specification.

### napi_detach_arraybuffer
<!-- YAML
added: v12.16.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_detach_arraybuffer(napi_env env,
                                    napi_value arraybuffer)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] arraybuffer`: The JavaScript `ArrayBuffer` to be detached.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-detachable `ArrayBuffer` is passed in it returns `napi_detachable_arraybuffer_expected`.

Generally, an `ArrayBuffer` is non-detachable if it has been detached before. The engine may impose additional conditions on whether an `ArrayBuffer` is detachable. For example, V8 requires that the `ArrayBuffer` be external, that is, created with [`napi_create_external_arraybuffer`][].

This API represents the invocation of the `ArrayBuffer` detach operation as defined in [Section 24.1.1.3](https://tc39.es/ecma262/#sec-detacharraybuffer) of the ECMAScript Language Specification.

### napi_is_detached_arraybuffer
<!-- YAML
added: v12.16.0
-->

> Stabilità: 1 - Sperimentale

```C
napi_status napi_is_detached_arraybuffer(napi_env env,
                                         napi_value arraybuffer,
                                         bool* result)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] arraybuffer`: The JavaScript `ArrayBuffer` to be checked.
* `[out] result`: Whether the `arraybuffer` is detached.

Restituisce `napi_ok` se l'API ha esito positivo.

The `ArrayBuffer` is considered detached if its internal data is `null`.

This API represents the invocation of the `ArrayBuffer` `IsDetachedBuffer` operation as defined in [Section 24.1.1.2](https://tc39.es/ecma262/#sec-isdetachedbuffer) of the ECMAScript Language Specification.

## Lavorare con le Proprietà JavaScript

N-API fornisce un set di API per ottenere ed impostare le proprietà sugli JavaScript objects. Some of these types are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Le proprietà in JavaScript sono rappresentate come una tupla di una key ed un valore. Fondamentalmente, tutte le property keys in N-API possono essere rappresentate in una delle seguenti forme:

* Named: una semplice stringa con codifica UTF8
* Integer-Indexed: un valore di indice rappresentato tramite `uint32_t`
* JavaScript value: questi sono rappresentati in N-API tramite `napi_value`. This can be a `napi_value` representing a `String`, `Number`, or `Symbol`.

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un un valore JavaScript accetta un `napi_value`. Tuttavia, è responsabilità del caller assicurarsi che il `napi_value` in questione sia del tipo JavaScript previsto dall'API.

Le API documentate in questa sezione forniscono una semplice interfaccia per ottenere ed impostare le proprietà su JavaScript objects arbitrari rappresentati tramite `napi_value`.

Ad esempio, considera il seguente frammento di codice JavaScript:

```js
const obj = {};
obj.myProp = 123;
```

L'equivalente può essere fatto usando i valori N-API con il seguente frammento:

```C
napi_status status = napi_generic_failure;

// const obj = {}
napi_value obj, value;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Crea un napi_value per 123
status = napi_create_int32(env, 123, &value);
if (status != napi_ok) return status;

// obj.myProp = 123
status = napi_set_named_property(env, obj, "myProp", value);
if (status != napi_ok) return status;
```

Le proprietà indicizzate possono essere impostate in modo simile. Considera il seguente frammento JavaScript:

```js
const arr = [];
arr[123] = 'hello';
```

L'equivalente può essere fatto usando i valori N-API con il seguente frammento:

```C
napi_status status = napi_generic_failure;

// const arr = [];
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// Crea un napi_value per 'hello'
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &value);
if (status != napi_ok) return status;

// arr[123] = 'hello';
status = napi_set_element(env, arr, 123, value);
if (status != napi_ok) return status;
```

Le proprietà possono essere recuperate utilizzando le API descritte in questa sezione. Considera il seguente frammento JavaScript:

```js
const arr = [];
const value = arr[123];
```

Quanto segue è l'equivalente approssimativo della controparte N-API:

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

Infine, è possibile definire più proprietà su un object per motivi di prestazioni. Considera il seguente codice JavaScript:

```js
const obj = {};
Object.defineProperties(obj, {
  'foo': { value: 123, writable: true, configurable: true, enumerable: true },
  'bar': { value: 456, writable: true, configurable: true, enumerable: true }
});
```

Quanto segue è l'equivalente approssimativo della controparte N-API:

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

### Strutture
#### napi_property_attributes

```C
typedef enum {
  napi_default = 0,
  napi_writable = 1 << 0,
  napi_enumerable = 1 << 1,
  napi_configurable = 1 << 2,

  // Usato con napi_define_class per distinguere le proprietà statiche
  // dalle proprietà dell'istanza. Ignorato da napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

Gli `napi_property_attributes` sono flags (bandiere) utilizzate per controllare il comportamento delle proprietà impostate su un JavaScript object. A parte `napi_static` essi corrispondono agli attributi elencati nella [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) dell'[ECMAScript Language Specification](https://tc39.github.io/ecma262/). Possono essere uno o più dei seguenti bitflags:

* `napi_default`: No explicit attributes are set on the property. By default, a property is read only, not enumerable and not configurable.
* `napi_writable`: The property is writable.
* `napi_enumerable`: The property is enumerable.
* `napi_configurable`: The property is configurable as defined in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).
* `napi_static`: The property will be defined as a static property on a class as opposed to an instance property, which is the default. This is used only by [`napi_define_class`][]. It is ignored by `napi_define_properties`.

#### napi_property_descriptor

```C
typedef struct {
  // Una di tipo utf8name oppure il nome dovrebbe essere NULL.
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

* `utf8name`: Optional `String` describing the key for the property, encoded as UTF8. Uno tra `utf8name` oppure `name` deve essere fornito per la proprietà.
* `name`: Optional `napi_value` that points to a JavaScript string or symbol to be used as the key for the property. Uno tra `utf8name` oppure `name` deve essere fornito per la proprietà.
* `value`: Il valore recuperato tramite un get access della proprietà se la proprietà è una proprietà dei dati. Se questo viene passato, imposta `getter`, `setter`, `method` e `data` a `NULL` (poiché questi membri non saranno usati).
* `getter`: Una funzione da chiamare quando viene eseguito un get access della proprietà. Se questo viene passato, imposta `value` e `method` a `NULL` (poiché questi membri non saranno usati). The given function is called implicitly by the runtime when the property is accessed from JavaScript code (or if a get on the property is performed using a N-API call).
* `setter`: Una funzione da chiamare quando viene eseguito un set access della proprietà. Se questo viene passato, imposta `value` e `method` a `NULL` (poiché questi membri non saranno usati). The given function is called implicitly by the runtime when the property is set from JavaScript code (or if a set on the property is performed using a N-API call).
* `method`: Impostalo per fare in modo che la `value` property del property descriptor object sia una funzione JavaScript rappresentata tramite `method`. Se questo viene passato, imposta `value`, `getter` e `setter` a `NULL` (poiché questi membri non saranno usati).
* `attributes`: Gli attributi associati alla particolare proprietà. See [`napi_property_attributes`][].
* `data`: The callback data passed into `method`, `getter` and `setter` if this function is invoked.

### Funzioni
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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da cui recuperare le proprietà.
* `[out] result`: Un `napi_value` che rappresenta un array di valori JavaScript che indicano i nomi delle proprietà dell'object. L'API può essere utilizzata per iterare su `result` usando [`napi_get_array_length`][] e [`napi_get_element`][].

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the names of the enumerable properties of `object` as an array of strings. The properties of `object` whose key is a symbol will not be included.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object su cui impostare la proprietà.
* `[in] key`: Il nome della proprietà da impostare.
* `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da cui recuperare la proprietà.
* `[in] key`: Il nome della proprietà da recuperare.
* `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da interrogare.
* `[in] key`: Il nome della proprietà di cui bisogna verificare l'esistenza.
* `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da interrogare.
* `[in] key`: Il nome della proprietà da cancellare.
* `[out] result`: Se la cancellazione della proprietà è avvenuta con successo o meno. Facoltativamente, il `result` può essere ignorato passando `NULL`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API tenta di eliminare la `key` own property da `object`.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da interrogare.
* `[in] key`: Il nome della own property di cui bisogna verificare l'esistenza.
* `[out] result`: Se l'own property esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object su cui impostare la proprietà.
* `[in] utf8Name`: Il nome della proprietà da impostare.
* `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da cui recuperare la proprietà.
* `[in] utf8Name`: Il nome della proprietà da ottenere.
* `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da interrogare.
* `[in] utf8Name`: Il nome della proprietà di cui bisogna verificare l'esistenza.
* `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da cui impostare le proprietà.
* `[in] index`: L'index della proprietà da impostare.
* `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da cui recuperare la proprietà.
* `[in] index`: L'index della proprietà da ottenere.
* `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API ottiene l'elemento nell'index richiesto.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da interrogare.
* `[in] index`: L'index della proprietà di cui bisogna verificare l'esistenza.
* `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da interrogare.
* `[in] index`: L'index della proprietà da cancellare.
* `[out] result`: Se la cancellazione dell'elemento è avvenuta con successo o meno. Facoltativamente, il `result` può essere ignorato passando `NULL`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API tenta di cancellare l'`index` specificato dall'`object`.

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

* `[in] env`: L'ambiente in cui viene invocata la N-API call.
* `[in] object`: L'object da cui recuperare le proprietà.
* `[in] property_count`: Il numero di elementi nell'array `properties`.
* `[in] properties`: L'array dei property descriptors (descrittori della proprietà).

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo consente la definizione efficiente di più proprietà su un dato object. The properties are defined using property descriptors (see [`napi_property_descriptor`][]). Given an array of such property descriptors, this API will set the properties on the object one at a time, as defined by `DefineOwnProperty()` (described in [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) of the ECMA-262 specification).

## Lavorare con le funzioni JavaScript

N-API fornisce un set di API che consentono al codice JavaScript di richiamare (callback) il codice nativo. Le API N-API che supportano il richiamo al codice nativo utilizzano funzioni di callback rappresentate dal tipo `napi_callback`. Quando la JavaScript VM richiama il codice nativo, viene invocata la funzione `napi_callback` fornita. Le API documentate in questa sezione consentono alla funzione di callback di eseguire le operazioni seguenti:

* Ottenere informazioni sul contesto in cui è stato invocato il callback.
* Ottenere gli argomenti passati nel callback.
* Restituire un `napi_value` indietro dal callback.

Inoltre, N-API fornisce un set di funzioni che consentono di chiamare le funzioni JavaScript dal codice nativo. Si può chiamare una funzione come una normale chiamata di funzione JavaScript, o come una funzione constructor.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] recv`: L'object `this` è passato alla funzione chiamata.
* `[in] func`: `napi_value` representing the JavaScript function to be invoked.
* `[in] argc`: Il count degli elementi nell'array `argv`.
* `[in] argv`: Array of `napi_values` representing JavaScript values passed in as arguments to the function.
* `[out] result`: `napi_value` che rappresenta il JavaScript object restituito.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo consente ad un JavaScript function object di essere chiamato da un add-on nativo. This is the primary mechanism of calling back *from* the add-on's native code *into* JavaScript. Nel caso speciale di chiamare in JavaScript dopo un'operazione asincrona, vedi [`napi_make_callback`][].

Un esempio di caso d'utilizzo potrebbe essere il seguente. Considera il seguente frammento JavaScript:

```js
function AddTwo(num) {
  return num + 2;
}
```

La funzione sopracitata può essere invocata da un add-on nativo usando il seguente codice:

```C
// Ottiene la funzione denominata "AddTwo" sul global object
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

// Converte il risultato in un tipo nativo
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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] utf8Name`: Il nome della funzione codificata come UTF8. Questo è visibile all'interno di JavaScript come nuova proprietà `name` del function object.
* `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[in] cb`: La funzione nativa che dovrebbe essere chiamata quando viene invocato questo function object.
* `[in] data`: Data context fornito dall'utente. Questo verrà restituito alla funzione quando viene invocata in seguito.
* `[out] result`: `napi_value` che rappresenta il JavaScript function object per la funzione appena creata.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API consente ad un add-on author di creare un function object nel codice nativo. This is the primary mechanism to allow calling *into* the add-on's native code *from* JavaScript.

The newly created function is not automatically visible from script after this call. Instead, a property must be explicitly set on any object that is visible to JavaScript, in order for the function to be accessible from script.

Per esporre una funzione come parte del modulo exports dell'add-on, imposta la funzione appena creata sull'exports object. Un modulo di esempio potrebbe essere il seguente:

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

Dato il codice sopracitato, l'add-on può essere utilizzato da JavaScript nel seguente modo:

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] cbinfo`: Le callback info passate nella funzione callback.
* `[in-out] argc`: Specifies the size of the provided `argv` array and receives the actual count of arguments.
* `[out] argv`: Buffer to which the `napi_value` representing the arguments are copied. If there are more arguments than the provided count, only the requested number of arguments are copied. If there are fewer arguments provided than claimed, the rest of `argv` is filled with `napi_value` values that represent `undefined`.
* `[out] this`: Riceve l'argomento JavaScript `this` per la call.
* `[out] data`: Riceve il puntatore ai dati per il callback.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo viene utilizzato all'interno di una funzione callback per recuperare i dettagli sulla call come gli argomenti ed il puntatore `this` da una determinata callback info.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] cbinfo`: Le callback info passate nella funzione callback.
* `[out] result`: Il `new.target` della constructor call.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `new.target` della constructor call. Se il callback corrente non è una constructor call, il risultato è `NULL`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
* `[in] argc`: Il count degli elementi nell'array `argv`.
* `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the constructor.
* `[out] result`: `napi_value` che rappresenta il JavaScript object restituito, che in questo caso è il constructed object (l'object costruito).

Questo metodo viene utilizzato per istanziare un nuovo valore JavaScript utilizzando un dato `napi_value` che rappresenta il constructor per l'object. Ad esempio, considera il seguente frammento:

```js
function MyObject(param) {
  this.param = param;
}

const arg = 'hello';
const value = new MyObject(arg);
```

Questo può essere approssimato in N-API usando il seguente frammento:

```C
// Ottiene la funzione constructor MyObject
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

Restituisce `napi_ok` se l'API ha esito positivo.

## Object Wrap

N-API offre un modo per "avvolgere" (wrap) classi ed istanze C++ in modo che il constructor ed i metodi della classe possano essere chiamati da JavaScript.

1. The [`napi_define_class`][] API defines a JavaScript class with constructor, static properties and methods, and instance properties and methods that correspond to the C++ class.
2. When JavaScript code invokes the constructor, the constructor callback uses [`napi_wrap`][] to wrap a new C++ instance in a JavaScript object, then returns the wrapper object.
3. When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` C++ function is invoked. For an instance callback, [`napi_unwrap`][] obtains the C++ instance that is the target of the call.

Per i wrapped objects può essere difficile distinguere tra una funzione chiamata su un prototipo di classe ed una funzione chiamata su un'istanza di una classe. Un modello comune utilizzato per risolvere questo problema consiste nel salvare un reference persistente al constructor della classe per i successivi controlli di `instanceof`.

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
  // in caso contrario...
}
```

Il reference deve essere liberato quando non è più necessario.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] utf8name`: Nome della funzione JavaScript constructor; non deve essere necessariamente uguale al nome della classe C++, sebbene sia raccomandato per chiarezza.
* `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[in] constructor`: Funzione callback che gestisce la costruzione di istanze della classe. (Questo dovrebbe essere un metodo statico sulla classe, non una funzione C++ constructor effettiva.)
* `[in] data`: Dati opzionali da passare al callback del constructor come `data` property delle callback info.
* `[in] property_count`: Numero di elementi nell'argomento dell'array `properties`.
* `[in] properties`: Array di property descriptors che descrivono proprietà di dati statici e di istanza, accessors e metodi sulla classe. Vedi `napi_property_descriptor`.
* `[out] result`: Un `napi_value` che rappresenta la funzione constructor per la classe.

Restituisce `napi_ok` se l'API ha esito positivo.

Definisce una classe JavaScript che corrisponde ad una classe C++, includendo:

* Una funzione JavaScript constructor che ha il nome della classe ed invoca il callback del constructor C++ fornito.
* Properties on the constructor function corresponding to _static_ data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
* Properties on the constructor function's `prototype` object corresponding to _non-static_ data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

Il callback del constructor C++ deve essere un metodo statico sulla classe che chiama l'effettivo constructor della classe, successivamente esegue il wrapping della nuova istanza C++ in un JavaScript object, e restituisce il wrapper object. Vedi `napi_wrap()` per maggiori dettagli.

La funzione JavaScript constructor restituita da [`napi_define_class`][] viene spesso salvata ed utilizzata in seguito, per costruire nuove istanze della classe dal codice nativo, e/o verificare se i valori forniti sono istanze della classe. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] js_object`: Il JavaScript object che sarà il wrapper per l'object nativo.
* `[in] native_object`: L'istanza nativa che subirà il wrapping nel JavaScript object.
* `[in] finalize_cb`: Callback nativo opzionale che può essere utilizzato per liberare l'istanza nativa quando il JavaScript object è pronto per la garbage-collection.
* `[in] finalize_hint`: Contextual hint opzionale passato al callback finalizzato.
* `[out] result`: Reference opzionale al wrapped object.

Restituisce `napi_ok` se l'API ha esito positivo.

Esegue il wrapping di un'istanza nativa in un JavaScript object. L'istanza nativa può essere recuperata in seguito utilizzando `napi_unwrap()`.

Quando il codice JavaScript invoca un constructor per una classe che è stata definita usando `napi_define_class()`, viene invocato il `napi_callback` per il constructor. Dopo aver costruito un'istanza della classe nativa, il callback deve chiamare `napi_wrap()` per eseguire il wrapping dell'istanza appena costruita nel JavaScript object già creato ovvero l'argomento `this` del callback del constructor. (Quel `this` object è stato creato dal `prototype` della funzione constructor, quindi ha già le definizioni di tutte le proprietà e i metodi dell'istanza.)

In genere, quando si esegue il wrapping di un'istanza di classe, è necessario fornire un callback finalizzato che elimina semplicemente l'istanza nativa ricevuta come argomento `data` sul callback finalizzato.

Il reference opzionale restituito è inizialmente un reference debole, il che significa che ha un reference count pari a 0. In genere questo reference count viene incrementato temporaneamente durante le operazioni asincrone che richiedono che l'istanza rimanga valida.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] js_object`: L'object associato all'istanza nativa.
* `[out] result`: Puntatore all'istanza nativa che ha subito il wrapping.

Restituisce `napi_ok` se l'API ha esito positivo.

Recupera un'istanza nativa che ha precedentemente subito il wrapping in un JavaScript object utilizzando `napi_wrap()`.

Quando il codice JavaScript invoca un metodo od una property accessor sulla classe, viene invocato il corrispondente `napi_callback`. Se il callback è per un metodo od un accessor di istanza, allora l'argomento `this` del callback è il wrapper object; l'istanza C++, che ha subito il wrapping ed è il target della chiamata, può essere ottenuta chiamando `napi_unwrap()` sul wrapper object.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] js_object`: L'object associato all'istanza nativa.
* `[out] result`: Puntatore all'istanza nativa che ha subito il wrapping.

Restituisce `napi_ok` se l'API ha esito positivo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] js_object`: The JavaScript object to which the native data will be attached.
* `[in] native_object`: The native data that will be attached to the JavaScript object.
* `[in] finalize_cb`: Native callback that will be used to free the native data when the JavaScript object is ready for garbage-collection.
* `[in] finalize_hint`: Contextual hint opzionale passato al callback finalizzato.
* `[out] result`: Optional reference to the JavaScript object.

Restituisce `napi_ok` se l'API ha esito positivo.

Adds a `napi_finalize` callback which will be called when the JavaScript object in `js_object` is ready for garbage collection. This API is similar to `napi_wrap()` except that:

* the native data cannot be retrieved later using `napi_unwrap()`,
* nor can it be removed later using `napi_remove_wrap()`, and
* the API can be called multiple times with different data items in order to attach each of them to the JavaScript object, and
* the object manipulated by the API can be used with `napi_wrap()`.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. If it is deleted before then, then the finalize callback may never be invoked. Therefore, when obtaining a reference a finalize callback is also required in order to enable correct disposal of the reference.

## Semplici Operazioni Asincrone

I moduli Addon spesso hanno bisogno di sfruttare gli async helpers di libuv come parte della loro implementazione. Ciò gli consente di pianificare il lavoro da eseguire in modo asincrono così che i loro metodi possano eseguire il return prima che il lavoro venga completato. This allows them to avoid blocking overall execution of the Node.js application.

N-API fornisce un'interfaccia ABI stabile per queste funzioni di supporto che copre i casi più comuni di utilizzo asicrono.

N-API defines the `napi_async_work` structure which is used to manage asynchronous workers. Le istanze vengono create/eliminate con [`napi_create_async_work`][] e [`napi_delete_async_work`][].

I callback `execute` e `complete` sono funzioni che verranno invocate rispettivamente quando l'executor è pronto per essere eseguito e quando esso termina il suo compito (task).

The `execute` function should avoid making any N-API calls that could result in the execution of JavaScript or interaction with JavaScript objects. Most often, any code that needs to make N-API calls should be made in `complete` callback instead. Avoid using the `napi_env` parameter in the execute callback as it will likely execute JavaScript.

Queste funzioni implementano le seguenti interfacce:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

When these methods are invoked, the `data` parameter passed will be the addon-provided `void*` data that was passed into the `napi_create_async_work` call.

Una volta creato, l'async worker può essere messo in coda per l'esecuzione utilizzando la funzione [`napi_queue_async_work`][]:

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

[`napi_cancel_async_work`][] can be used if the work needs to be cancelled before the work has started execution.

Dopo aver chiamato [`napi_cancel_async_work`][], il callback `complete` verrà invocato con un status value di `napi_cancelled`. Il work non dovrebbe essere cancellato prima dell'invocazione del callback `complete`, anche quando è stato annullato.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] async_resource`: Un object facoltativo associato all'async work che verrà passato a possibili `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
* `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
* `[in] complete`: La funzione nativa che verrà chiamata quando la logica asincrona è completata o cancellata. La funzione data viene chiamata dal main event loop thread.
* `[in] data`: Data context fornito dall'utente. Questo verrà passato di nuovo nelle funzioni execute e complete.
* `[out] result`: `napi_async_work*` che è l'handle dell'async work appena creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un work object che viene utilizzato per eseguire la logica in modo asincrono. Esso dovrebbe essere liberato usando [`napi_delete_async_work`][] una volta che il work non è più necessario.

`async_resource_name` dovrebbe essere una stringa null-terminated con codifica UTF-8.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API libera un work object allocato precedentemente.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### napi_queue_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API richiede che il work allocato precedentemente venga pianificato per l'esecuzione. Once it returns successfully, this API must not be called again with the same `napi_async_work` item or the result will be undefined.

### napi_cancel_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API annulla il work in coda se non è stato ancora avviato. Se ha già iniziato l'esecuzione, non può essere annullato e verrà restituito `napi_generic_failure`. In caso di successo, il callback `complete` verrà invocato con un status value di `napi_cancelled`. Il work non dovrebbe essere cancellato prima dell'invocazione del callback `complete`, anche se è stato annullato con successo.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Operazioni Asincrone Personalizzate

Le semplici API di work asincrono sopracitate potrebbero non essere appropriate per ogni scenario. Quando si utilizza un altro meccanismo asincrono, sono necessarie le seguenti API per garantire che un'operazione asincrona venga monitorata correttamente dal runtime.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] async_resource`: Un object facoltativo associato all'async work che verrà passato a possibili `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: Identificatore per il tipo di risorsa che viene fornita per le informazioni diagnostiche esposte dall'API `async_hooks`.
* `[out] result`: L'async context inizializzato.

Restituisce `napi_ok` se l'API ha esito positivo.

### napi_async_destroy
<!-- YAML
added: v8.6.0
napiVersion: 1
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] async_context`: L'async context da distruggere.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
* `[in] recv`: L'object `this` è passato alla funzione chiamata.
* `[in] func`: `napi_value` representing the JavaScript function to be invoked.
* `[in] argc`: Il count degli elementi nell'array `argv`.
* `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
* `[out] result`: `napi_value` che rappresenta il JavaScript object restituito.

Restituisce `napi_ok` se l'API ha esito positivo.

Questo metodo consente ad un JavaScript function object di essere chiamato da un add-on nativo. Quest'API è simile a `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). È un wrapper abbastanza semplice attorno a `node::MakeCallback`.

Note it is *not* necessary to use `napi_make_callback` from within a `napi_async_complete_callback`; in that situation the callback's async context has already been set up, so a direct call to `napi_call_function` is sufficient and appropriate. L'utilizzo della funzione `napi_make_callback` può essere richiesto quando si implementa un comportamento asincrono personalizzato che non utilizza `napi_create_async_work`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] resource_object`: An object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
* `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
* `[out] result`: Lo scope appena creato.

There are cases (for example, resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls. Se non ci sono altri script nello stack, le funzioni [`napi_open_callback_scope`][] e [`napi_close_callback_scope`][] possono essere utilizzate per aprire/chiudere lo scope richiesto.

### napi_close_callback_scope
<!-- YAML
added: v9.6.0
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] scope`: Lo scope da chiudere.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Gestione delle Versioni

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] version`: A pointer to version information for Node.js itself.

Restituisce `napi_ok` se l'API ha esito positivo.

This function fills the `version` struct with the major, minor, and patch version of Node.js that is currently running, and the `release` field with the value of [`process.release.name`][`process.release`].

Il buffer restituito è allocato in modo statico e non è necessario liberarlo.

### napi_get_version
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] result`: La versione di N-API più recente supportata.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce la versione N-API più recente supportata dal runtime Node.js. N-API è programmato per essere additivo in modo che le nuove release di Node.js possano supportare funzioni API aggiuntive. Per consentire ad un addon di utilizzare una funzione più recente quando è in esecuzione con versioni di Node.js che lo supportano, pur fornendo un comportamento di fallback durante l'esecuzione con versioni di Node.js che non lo supportano:

* Chiama `napi_get_version()` per determinare se l'API è disponibile.
* Se disponibile, carica in modo dinamico un puntatore alla funzione usando `uv_dlsym()`.
* Usa il puntatore caricato in modo dinamico per invocare la funzione.
* Se la funzione non è disponibile, fornisci un'implementazione alternativa che non utilizza la funzione.

## Gestione della Memoria

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
* `[out] result`: Il valore regolato

Restituisce `napi_ok` se l'API ha esito positivo.

Questa funzione fornisce a V8 un'indicazione della quantità di memoria allocata esternamente che viene mantenuta attiva dagli JavaScript objects (es. un JavaScript object che punta alla propria memoria allocata da un modulo nativo). La registrazione di memoria allocata esternamente attiverà le garbage collection globali più spesso di quanto non farebbe altrimenti.

## Promises

N-API fornisce agevolazioni per la creazione di `Promise` objects come descritto nella [Section 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) dell'ECMA specification. Implementa i promise come una coppia di objects. Quando un promise viene creato da `napi_create_promise()`, un "deferred" object (object differito) viene creato e restituito affianco a `Promise`. Il deferred object è associato al `Promise` creato ed è l'unico mezzo per risolvere o rifiutare il `Promise` utilizzando `napi_resolve_deferred()` oppure `napi_reject_deferred()`. Il deferred object creato da `napi_create_promise()` è liberato da `napi_resolve_deferred()` oppure `napi_reject_deferred()`. Il `Promise` object può essere restituito a JavaScript dove può essere usato nel modo più consueto.

Ad esempio, per creare un promise e passarlo ad un worker asincrono:

```c
napi_deferred deferred;
napi_value promise;
napi_status status;

// Crea il promise.
status = napi_create_promise(env, &deferred, &promise);
if (status != napi_ok) return NULL;

// Passa il deferred ad una funzione che esegue un'azione asincrona.
do_something_asynchronous(deferred);

// Restituisce il promise a JS
return promise;
```

La funzione `do_something_asynchronous()` qui sopra eseguirebbe la sua azione asincrona e quindi risolverebbe o rifiuterebbe il deferred, concludendo così il promise e liberando il deferred:

```c
napi_deferred deferred;
napi_value undefined;
napi_status status;

// Crea un valore con cui concludere il deferred.
status = napi_get_undefined(env, &undefined);
if (status != napi_ok) return NULL;

// Risolve o rifiuta il promise associato al deferred dipendendo
// dal successo dell'azione asincrona.
if (asynchronous_action_succeeded) {
  status = napi_resolve_deferred(env, deferred, undefined);
} else {
  status = napi_reject_deferred(env, deferred, undefined);
}
if (status != napi_ok) return NULL;

// A questo punto il deferred è stato liberato, quindi dovremmo assegnargli NULL.
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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] deferred`: Un deferred object appena creato che in seguito può essere passato a `napi_resolve_deferred()` oppure `napi_reject_deferred()` per risolvere resp. rifiuta il promise associato.
* `[out] promise`: Il JavaScript promise associato con il deferred object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un deferred object ed un JavaScript promise.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] deferred`: Il deferred object del quale bisogna risolvere il promise associato.
* `[in] resolution`: Il valore con cui risolvere il promise.

Quest'API risolve un JavaScript promise tramite il deferred object a cui è associato. Pertanto, può essere utilizzata solo per risolvere i JavaScript promise per i quali è disponibile il corrispondente deferred object. Ciò significa in effetti che il promise dev'essere stato creato utilizzando `napi_create_promise()` e che il deferred object restituito da tale chiamata dev'essere stato mantenuto per essere passato a quest'API.

Il deferred object viene liberato al completamento avvenuto con successo.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] deferred`: Il deferred object del quale bisogna risolvere il promise associato.
* `[in] rejection`: Il valore con cui rifiutare il promise.

Quest'API rifiuta un JavaScript promise tramite il deferred object a cui è associato. Pertanto, può essere utilizzata solo per rifiutare i JavaScript promise per i quali è disponibile il corrispondente deferred object. Ciò significa in effetti che il promise dev'essere stato creato utilizzando `napi_create_promise()` e che il deferred object restituito da tale chiamata dev'essere stato mantenuto per essere passato a quest'API.

Il deferred object viene liberato al completamento avvenuto con successo.

### napi_is_promise
<!-- YAML
added: v8.5.0
napiVersion: 1
-->

```C
napi_status napi_is_promise(napi_env env,
                            napi_value promise,
                            bool* is_promise);
```

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] promise`: Il promise da esaminare
* `[out] is_promise`: Flag indicating whether `promise` is a native promise object (that is, a promise object created by the underlying engine).

## Script execution

N-API fornisce un'API per l'esecuzione di una stringa contenente JavaScript utilizzando il JavaScript engine sottostante.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] script`: Una stringa JavaScript contenente lo script da eseguire.
* `[out] result`: Il valore risultante dell'aver eseguito lo script.

This function executes a string of JavaScript code and returns its result with the following caveats:

* Unlike `eval`, this function does not allow the script to access the current lexical scope, and therefore also does not allow to access the [module scope](modules.html#modules_the_module_scope), meaning that pseudo-globals such as `require` will not be available.
* The script can access the [global scope](globals.html). Function and `var` declarations in the script will be added to the [`global`][] object. Variable declarations made using `let` and `const` will be visible globally, but will not be added to the [`global`][] object.
* The value of `this` is [`global`][] within the script.

## libuv event loop

N-API fornisce una funzione per ottenere l'attuale event loop associato ad uno specifico `napi_env`.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[out] loop`: L'attuale istanza del libuv loop.

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

* `[in] env`: L'ambiente in cui viene invocata l'API.
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

* `[in] env`: L'ambiente in cui viene invocata l'API.
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

* `[in] env`: L'ambiente in cui viene invocata l'API.
* `[in] func`: The thread-safe function to unreference.

This API is used to indicate that the event loop running on the main thread may exit before `func` is destroyed. Similar to [`uv_unref`][] it is also idempotent.

This API may only be called from the main thread.
