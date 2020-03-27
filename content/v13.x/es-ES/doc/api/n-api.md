# N-API

<!--introduced_in=v8.0.0-->
<!-- type=misc -->

> Estability: 2 - Estable

N-API (pronunciado N como la letra, seguido por API) es una API para crear complementos nativos. It is independent from the underlying JavaScript runtime (for example, V8) and is maintained as part of Node.js itself. Esta API será Interfaz Binaria de Aplicación (ABI) estable entre versiones de Node.js. It is intended to insulate Addons from changes in the underlying JavaScript engine and allow modules compiled for one major version to run on later major versions of Node.js without recompilation. The [ABI Stability](https://nodejs.org/en/docs/guides/abi-stability/) guide provides a more in-depth explanation.

Addons are built/packaged with the same approach/tools outlined in the section titled [C++ Addons](addons.html). The only difference is the set of APIs that are used by the native code. Instead of using the V8 or [Native Abstractions for Node.js](https://github.com/nodejs/nan) APIs, the functions available in the N-API are used.

Las APIs expuestas por la N-API son, generalmente, utilizadas para crear y manipular valores de JavaScript. Concepts and operations generally map to ideas specified in the ECMA-262 Language Specification. Las APIs tienen las siguientes propiedades:

* Todas las llamadas N-API devuelven un código de estado del tipo `napi_status`. Este estado indica si la llamada a la API fue exitosa o no.
* El valor devuelto por la API se pasa a través de un parámetro de salida.
* Todos los valores de JavaScript se abstraen detrás de un tipo opaco llamado `napi_value`.
* En caso de un estado de error, se puede obtener información adicional utilizando `napi_get_last_error_info`. Se puede encontrar más información en la sección de manejo de errores [Manejo de Errores](#n_api_error_handling).

La N-API es una C API que garantiza la estabilidad de la ABI a través de las versiones y los diferentes niveles de compilación de Node.js. A C++ API can be easier to use. To support using C++, the project maintains a C++ wrapper module called [node-addon-api](https://github.com/nodejs/node-addon-api). This wrapper provides an inlineable C++ API. Binaries built with `node-addon-api` will depend on the symbols for the N-API C-based functions exported by Node.js. `node-addon-api` is a more efficient way to write code that calls N-API. Take, for example, the following `node-addon-api` code. The first section shows the `node-addon-api` code and the second section shows what actually gets used in the addon.

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

## Compilación

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

## Uso

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

> Estabilidad: 1 - Experimental

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] data`: The data item to make available to bindings of this instance.
* `[in] finalize_cb`: The function to call when the environment is being torn down. The function receives `data` so that it might free it.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.

Devuelve `napi_ok` si la API fue exitosa.

This API associates `data` with the currently running Agent. `data` can later be retrieved using `napi_get_instance_data()`. Any existing data associated with the currently running Agent which was set by means of a previous call to `napi_set_instance_data()` will be overwritten. If a `finalize_cb` was provided by the previous call, it will not be called.

### napi_get_instance_data
<!-- YAML
added: v12.8.0
-->

```C
napi_status napi_get_instance_data(napi_env env,
                                   void** data);
```

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[out] data`: The data item that was previously associated with the currently running Agent by a call to `napi_set_instance_data()`.

Devuelve `napi_ok` si la API fue exitosa.

This API retrieves data that was previously associated with the currently running Agent via `napi_set_instance_data()`. If no data is set, the call will succeed and `data` will be set to `NULL`.

## Tipos Básicos de Datos de N-API

N-API expone los siguientes tipos de datos fundamentales como abstracciones que son consumidas por las diversas APIs. Estas APIs deben tratarse como opacas, solo siendo posible una revisión introspectiva mediante otras llamadas N-API.

### napi_status
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Código de estado integral que indica el éxito o fracaso de una llamada N-API. Actualmente, los siguiente códigos de estado son admitidos.

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

Si se requiere información adicional cuando una API devuelve un estado de fracaso, puede ser obtenida llamando `napi_get_last_error_info`.

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

* `error_message`: string UTF8-codificada que contiene una descripción neutral VM del error.
* `engine_reserved`: Reservado para los detalles de error específico de la VM. Actualmente, este no está implementado para ninguna VM.
* `engine_error_code`: código de error específico de la VM. Actualmente, este no está implementado para ninguna VM.
* `error_code`: El código de estado de la N-API que se originó con el último error.

Mira la sección [Manejo de Errores](#n_api_error_handling) para información adicional.

### napi_env

`napi_env` es utilizada para representar un contexto que la implementación de N-API subyacente puede utilizar para persistir en un estado específico de la VM. Esta estructura es pasada a funciones nativas cuando son invocadas y debe ser pasada devuelta cuando se hacen llamadas N-API. Específicamente, el mismo `napi_env` que fue pasado cuando la función nativa inicial fue llamada debe ser pasada a cualquier llamada N-API subsecuente anidada. Caching the `napi_env` for the purpose of general reuse, and passing the `napi_env` between instances of the same addon running on different [`Worker`][] threads is not allowed. The `napi_env` becomes invalid when an instance of a native addon is unloaded. Notification of this event is delivered through the callbacks given to [`napi_add_env_cleanup_hook`][] and [`napi_set_instance_data`][].

### napi_value

Este es un apuntador opaco que se utiliza para representar un valor de JavaScript.

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

### Tipos de Gestión de Memoria de N-API
#### napi_handle_scope

Esta es una abstracción utilizada para controlar y modificar el tiempo de vida de objetos creados dentro de un ámbito particular. En general, los valores N-API son creados dentro de un contexto de ámbito controlado. Cuando se llama a un método nativo de JavaScript, existirá un ámbito controlado por defecto. Si el usuario no crea explícitamente un nuevo ámbito controlado, los valores N-API serán creados en el ámbito controlado por defecto. Para cualquier invocación de código fuera de la ejecución de un método nativo (por ejemplo, durante una invocación a la llamada libuv), el módulo es requerido para crear el ámbito antes de invocar cualquier función que pueda resultar en la creación de valores JavaScript.

Los ámbitos controlados son creados utilizando [`napi_open_handle_scope`][] y son destruidos utilizando [`napi_close_handle_scope`][]. Closing the scope can indicate to the GC that all `napi_value`s created during the lifetime of the handle scope are no longer referenced from the current stack frame.

Para más detalles, revisar la [Gestión de tiempo de vida del objeto](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Los ámbitos controlados escapables son un tipo especial de ámbitos controlados para devolver al ámbito padre valores creados dentro de un ámbito controlado particular.

#### napi_ref
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Esta es la abstracción utilizada para referenciar a 

`napi_value`. Esto permite que los usuarios puedean controlar el tiempo de vida de los valores JavaScript, incluyendo la definición de sus tiempos de vida mínimos de forma explícita.

Para más detalles, revisar la [Gestión de tiempo de vida del objeto](#n_api_object_lifetime_management).

### Tipos de callbacks N-API
#### napi_callback_info
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Tipo de dato opaco que se pasa a una función de callback. Puede ser utilizado para obtener información adicional sobre el contexto en el que el callback fue invocado.

#### napi_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Tipo de función puntero para las funciones nativas provistas por el usuario que son expuestas a JavaScript por medio de N-API. Las funciones de callbacks deben satisfacer la siguiente firma:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Tipo de función puntero para las funciones provistas por los complementos que permiten al usuario ser notificado cuando datos de dominio externo están listos para ser limpiados porque el objeto al que estaban asociados fue clasificado como basura. El usuario debe suministrar una función que satisfaga la siguiente firma, que sería invocada tras la recolección del objeto. Actualmente, 

`napi_finalize` puede ser utilizado para averiguar cuándo los objetos que tienen datos externos son recogidos.

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
Función puntero utilizada con funciones que soportan operaciones asincrónicas. Callback functions must satisfy the following signature:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

Implementations of this function must avoid making N-API calls that execute JavaScript or interact with JavaScript objects.  N-API calls should be in the `napi_async_complete_callback` instead. Do not use the `napi_env` parameter as it will likely result in execution of JavaScript.

#### napi_async_complete_callback
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
Función puntero utilizada con funciones que soportan operaciones asincrónicas. Callback functions must satisfy the following signature:

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

## Manejo de Errores

N-API utiliza valores de entorno y excepciones de JavaScript para el manejo de errores. Las siguientes secciones explican la aproximación para cada caso.

### Valores de retorno

Todas las funciones N-API comparten el mismo patrón de manejo de errores. El tipo de retorno de todas las funciones API es `napi_status`.

El valor de retorno será `napi_ok` si la petición fue exitosa y no se arrojó ninguna excepción de JavaScript no capturada. Si ha ocurrido un error y una excepción fue arrojada, el valor de `napi_status` para el error será devuelto. Si una excepción fue arrojada y no ocurrió ningún error, `napi_pending_exception` será devuelto.

En casos donde se devuelva un valor de retorno distinto a `napi_ok` o `napi_pending_exception`, [`napi_is_exception_pending`][] debe ser llamado para verificar si hay una excepción pendiente. Consulte la sección de excepciones para más detalles.

The full set of possible `napi_status` values is defined in `napi_api_types.h`.

El valor de retorno `napi_status` proporciona una representación del error ocurrido independiente de VM. En algunos casos, es útil poder obtener información más detallada, incluyendo una string que represente el error, así como información específica (del motor) de VM.

Para recuperar esta información, se proporciona [`napi_get_last_error_info`][], el cual devuelve una estructura `napi_extended_error_info`. El formato de la estructura `napi_extended_error_info` es el siguiente:

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

* `error_message`: Representación textual del error ocurrido.
* `engine_reserved`: Handle opaco reservado solo para uso del motor.
* `engine_error_code`: Código de error específico de VM.
* `error_code`: Código de estado de n-api para el último error.

[`napi_get_last_error_info`][] devuelve la información de la última llamada N-API que fue realizada.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: La estructura `napi_extended_error_info` con más información sobre el error.

Devuelve `napi_ok` si la API fue exitosa.

This API retrieves a `napi_extended_error_info` structure with information about the last error that occurred.

The content of the `napi_extended_error_info` returned is only valid up until an n-api function is called on the same `env`.

Do not rely on the content or format of any of the extended information as it is not subject to SemVer and may change at any time. It is intended only for logging purposes.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

### Excepciones

Cualquier llamada a una función N-API puede resultar en una excepción pendiente de JavaScript. Este es, obviamente, el caso de cualquier función que pueda causar la ejecución de JavaScript, pero N-API especifica que una excepción puede estar pendiente en la devolución de cualquiera de las funciones de la API.

Si el `napi_status` devuelto por una función es `napi_ok` entonces no hay excepciones pendientes y no se requieren acciones adicionales. Si el `napi_status` devuelto es cualquiera distinto a`napi_ok` o `napi_pending_exception`, para tratar de recuperar y continuar, en lugar de simplemente retornar inmediatamente, [`napi_is_exception_pending`][] debe ser llamada para determinar si una excepción está pendiente o no.

In many cases when an N-API function is called and an exception is already pending, the function will return immediately with a `napi_status` of `napi_pending_exception`. However, this is not the case for all functions. N-API allows a subset of the functions to be called to allow for some minimal cleanup before returning to JavaScript. In that case, `napi_status` will reflect the status for the function. It will not reflect previous pending exceptions. To avoid confusion, check the error status after every function call.

Cuando una excepción está pendiente, se puede emplear uno de dos enfoques.

El primer enfoque es realizar una limpieza apropiada y luego regresar, así la ejecución regresará a JavaScript. As part of the transition back to JavaScript, the exception will be thrown at the point in the JavaScript code where the native method was invoked. The behavior of most N-API calls is unspecified while an exception is pending, and many will simply return `napi_pending_exception`, so do as little as possible and then return to JavaScript where the exception can be handled.

El segundo enfoque es tratar de manejar la excepción. Habrá casos donde el código nativo pueda capturar la excepción, tomar la acción apropiada y luego continuar. Esto solo es recomendado en casos específicos donde se sabe que la excepción puede ser manejada de forma segura. En estos casos [`napi_get_and_clear_last_exception`][] puede ser utilizada para obtener y eliminar la excepción. On success, result will contain the handle to the last JavaScript `Object` thrown. If it is determined, after retrieving the exception, the exception cannot be handled after all it can be re-thrown it with [`napi_throw`][] where error is the JavaScript `Error` object to be thrown.

The following utility functions are also available in case native code needs to throw an exception or determine if a `napi_value` is an instance of a JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] and [`napi_is_error`][].

The following utility functions are also available in case native code needs to create an `Error` object: [`napi_create_error`][], [`napi_create_type_error`][], and [`napi_create_range_error`][], where result is the `napi_value` that refers to the newly created JavaScript `Error` object.

El proyecto Node.js está añadiendo códigos de error a todos los errores generados internamente. La meta es que las aplicaciones utilicen estos códigos de error para todas las comprobaciones de errores. Los mensajes de error asociados permanecerán, pero sólo se utilizarán para el registro y la visualización, con la expectativa de que el mensaje pueda cambiar sin aplicar SemVer. Para soportar este modelo con N-API, en funcionalidad interna y funcionalidad específica por módulo (como buena práctica), las funciones `throw_` y `create_` toman un parámetro de código opcional que es la string para el código que se agregará al objeto error. Si el parámetro opcional es NULL, ningún código será asociado con el error. Si se proporciona el código, el nombre asociado con el error también se actualiza para ser:

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] error`: El valor JavaScript a ser arrojado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API arroja el valor JavaScript proporcionado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] code`: Código de error opcional a establecer en el error.
* `[in] msg`: C string representing the text to be associated with the error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API suelta un `Error` de JavaScript con el texto proporcionado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] code`: Código de error opcional a establecer en el error.
* `[in] msg`: C string representing the text to be associated with the error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API suelta un `TypeError` de JavaScript con el texto proporcionado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] code`: Código de error opcional a establecer en el error.
* `[in] msg`: C string representing the text to be associated with the error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API suelta un `RangeError` de JavaScript con el texto proporcionado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: The `napi_value` to be checked.
* `[out] result`: Valor Booleano que se establece en true si `napi_value` representa un error; de lo contrario, se establece en false.

Devuelve `napi_ok` si la API fue exitosa.

Esta API requiere un `napi_value` para verificar si representa un objeto error.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un `Error` de JavaScript con el texto proporcionado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un `TypeError` de JavaScript con el texto proporcionado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
* `[in] msg`: `napi_value` that references a JavaScript `String` to be used as the message for the `Error`.
* `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un `RangeError` de JavaScript con el texto proporcionado.

#### napi_get_and_clear_last_exception
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: Si es uno, la excepción está pendiente; de otra forma es NULL.

Devuelve `napi_ok` si la API fue exitosa.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

#### napi_is_exception_pending
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: Valor Booleano que se establece en true si hay una excepción pendiente.

Devuelve `napi_ok` si la API fue exitosa.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

#### napi_fatal_exception
<!-- YAML
added: v9.10.0
napiVersion: 3
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] err`: The error that is passed to `'uncaughtException'`.

Dispara un `'uncaughtException'` en JavaScript. Es útil si una callback asíncrona arroja un excepción sin manera de recuperarla.

### Errores Fatales

En el evento de un error no recuperable en un módulo nativo, un error fatal puede ser arrojado para terminar el proceso inmediatamente.

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

* `[in] location`: Ubicación opcional en la que se produjo el error.
* `[in] location_len`: La longitud de la ubicación en bytes o `NAPI_AUTO_LENGTH`, si está terminada en NULL.
* `[in] message`: El mensaje asociado con el error.
* `[in] message_len`: The length of the message in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.

La llamada a la función no regresa, el proceso se terminará.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

## Gestión de la vida útil del objeto

A medida que se realizan las llamadas N-API, los handles de los objetos en el montón para la máquina virtual subyacente pueden devolverse como `napi_values`. Estos handles deben mantener los objetos 'activos' hasta que el código nativo ya no los requiera, de lo contrario, los objetos podrían recopilarse antes de que el código nativo terminara de usarlos.

A medida que se devuelven los handles de objetos, se asocian con un 'ámbito'. La vida útil para el ámbito predeterminado está vinculada a la vida útil de la llamada al método nativo. El resultado es que, de forma predeterminada, los handles siguen siendo válidos y los objetos asociados con estos handles se mantendrán activos durante la vida útil de la llamada al método nativo.

En muchos casos, sin embargo, es necesario que los handles sigan siendo válidos para una vida útil más corta o más larga que la del método nativo. The sections which follow describe the N-API functions that can be used to change the handle lifespan from the default.

### Hacer que la vida útil del handle sea más corta que la del método nativo
A menudo es necesario hacer que la vida útil de los handles sea más corta que la vida útil de un método nativo. Por ejemplo, considere un método nativo que tiene un bucle que recorre los elementos en un gran array:

```C
for (int i = 0; i < 1000000; i++) {
  napi_value result;
  napi_status status = napi_get_element(env, object, i, &result);
  if (status != napi_ok) {
    break;
  }
  // hacer algo con el elemento
}
```

Esto daría lugar a la creación de una gran cantidad de handles, que consumen recursos sustanciales. Además, aunque el código nativo solo podría usar el handle más reciente, todos los objetos asociados también se mantendrían activos ya que todos comparten el mismo ámbito.

Para manejar este caso, N-API proporciona la capacidad de establecer un nuevo 'ámbito' al que se asociarán los nuevos handles creados. Una vez que esos handles ya no sean necesarios, el ámbito se puede "cerrar", y los handles asociados con este serán invalidados. Los métodos disponibles para abrir/cerrar ámbitos son [`napi_open_handle_scope`][] y [`napi_close_handle_scope`][].

N-API solo soporta una única jerarquía anidada de ámbitos. Sólo hay un ámbito activo en cualquier momento y todos los nuevos handles serán asociados con ese ámbito mientras esté activo. Los ámbitos deben ser cerrados en el orden inverso al que fueron abiertos. Además, todos los ámbitos creados dentro de un método nativo deben ser cerrados antes de regresar de ese método.

Tomando el ejemplo anterior, añadir llamadas a [`napi_open_handle_scope`][] y [`napi_close_handle_scope`][] garantizaría que, como máximo, un único handle sea válido durante la ejecución del bucle:

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
  // hacer algo con el elemento
  status = napi_close_handle_scope(env, scope);
  if (status != napi_ok) {
    break;
  }
}
```

Al anidar ámbitos, hay casos en los que un handle de un ámbito interno necesita vivir más allá de la vida útil de ese ámbito. N-API soporta un 'ámbito de escape' para poder soportar este caso. Un ámbito escapable permite que un handle sea "promovido" para "escapar" del ámbito actual, y la vida útil del handle cambia del ámbito actual al del ámbito externo.

The methods available to open/close escapable scopes are [`napi_open_escapable_handle_scope`][] and [`napi_close_escapable_handle_scope`][].

La solicitud para promover un handle se realiza a través de [`napi_escape_handle`][], el cual solo puede ser llamado una vez.

#### napi_open_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: `napi_value` que representa al nuevo ámbito.

Devuelve `napi_ok` si la API fue exitosa.

Esta API abre un nuevo ámbito.

#### napi_close_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] scope`: `napi_value` que representa al ámbito que será cerrado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cierra el ámbito pasado. Los ámbitos deben ser cerrados en el orden inverso al que fueron creados.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: `napi_value` que representa al nuevo ámbito.

Devuelve `napi_ok` si la API fue exitosa.

Esta API abre un nuevo ámbito desde el cual un objeto puede ser promovido al ámbito externo.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] scope`: `napi_value` que representa al ámbito que será cerrado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cierra el ámbito pasado. Los ámbitos deben ser cerrados en el orden inverso al que fueron creados.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] scope`: `napi_value` que representa el ámbito actual.
* `[in] escapee`: `napi_value` representing the JavaScript `Object` to be escaped.
* `[out] result`: `napi_value` representing the handle to the escaped `Object` in the outer scope.

Devuelve `napi_ok` si la API fue exitosa.

Esta API promueve el handle al objeto de JavaScript para que sea válido durante el tiempo de vida útil del ámbito externo. Solo se puede llamar una vez por ámbito. Si es llamada más de una vez, se devolverá un error.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

### Referencias a objetos con vida útil más larga que la del método nativo

En algunos casos, un complemento necesitará poder crear y referenciar objetos con una vida útil más larga que la de una única invocación de un método nativo. Por ejemplo, para crear un constructor y luego utilizarlo en una solicitud para crear instancias, debe ser posible referenciar al objeto constructor a través de muchas diferentes peticiones de creación de instancias. Esto no sería posible con un handle normal devuelto como un `napi_value` como se describe en la sección anterior. La vida útil de un handle normal es gestionada por ámbitos y todos los ámbitos deben ser cerrados antes del final de un método nativo.

N-API proporciona métodos para crear referencias persistentes a un objeto. Cada referencia persistente tiene una recuento asociado con un valor de 0 o superior. El recuento determina si la referencia mantendrá activo al objeto correspondiente. Las referencias con un conteo de 0 no impiden que el objeto sea tomado y, a menudo, se denominan referencias "débiles". Cualquier recuento mayor que 0 impedirá que el objeto sea tomado.

Las referencias se pueden crear con un recuento de referencia inicial. El recuento puede ser modificado a través de [`napi_reference_ref`][] y [`napi_reference_unref`][]. Si un objeto es tomado mientras el conteo para una referencia es 0, todas las llamadas subsecuentes para obtener al objeto asociado con la referencia [`napi_get_reference_value`][] devolverán NULL para el `napi_value` devuelto. Un intento de llamar a [`napi_reference_ref`][] para una referencia cuyo objeto ha sido tomado generará un error.

Las referencias se deben eliminar una vez que el complemento ya no las requiere. Cuando una referencia es eliminada, ya no impedirá que el objeto correspondiente sea tomado. Si no se elimina una referencia persistente, se producirá una 'pérdida de memoria' conservándose para siempre la memoria nativa para la referencia persistente y el objeto correspondiente en el montón.

Puede haber múltiples referencias persistentes creadas que se refieran al mismo objeto, cada una de las cuales mantendrá al objeto activo, o no, en función de su conteo individual.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing the `Object` to which we want a reference.
* `[in] initial_refcount`: Recuento inicial de referencia para la nueva referencia.
* `[out] result`: `napi_ref` que apunta a la nueva referencia.

Devuelve `napi_ok` si la API fue exitosa.

This API create a new reference with the specified reference count to the `Object` passed in.

#### napi_delete_reference
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NAPI_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] ref`: `napi_ref` que será eliminada.

Devuelve `napi_ok` si la API fue exitosa.

Esta API elimina la referencia pasada.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] ref`: `napi_ref` para la cual se incrementará el conteo de referencias.
* `[out] result`: El nuevo conteo de referencias.

Devuelve `napi_ok` si la API fue exitosa.

Esta API incrementa el conteo de referencias para la referencia pasada y devuelve el conteo de referencias resultante.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] ref`: `napi_ref` para la cual se disminuirá el conteo de referencias.
* `[out] result`: El nuevo conteo de referencias.

Devuelve `napi_ok` si la API fue exitosa.

Esta API disminuye el conteo de referencias para la referencia pasada y devuelve el conteo de referencias resultante.

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

el `napi_value passed` dentro o fuera de estos métodos es un handle para el objeto con el que se relaciona la referencia.

* `[in] env`: El entorno en el que se invoca la API.
* `[in] ref`: `napi_ref` para la cual solicitamos el correspondiente `Object`.
* `[out] result`: The `napi_value` for the `Object` referenced by the `napi_ref`.

Devuelve `napi_ok` si la API fue exitosa.

If still valid, this API returns the `napi_value` representing the JavaScript `Object` associated with the `napi_ref`. De lo contrario, el resultado será NULL.

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

## Registro de Módulos
Los módulos N-API son registrados de forma similar a otros módulos, excepto que en lugar de utilizar la macro `NODE_MODULE`, se utiliza la siguiente:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

La siguiente diferencia es la firma para el método `Init`. Para un módulo N-API es el siguiente:

```C
napi_value Init(napi_env env, napi_value exports);
```

El valor de retorno de `Init` es tratado como el objeto `exports` para el módulo. Al método `Init` se le pasa un objeto vacío, a través del parámetro `exports` como una conveniencia. Si `Init` devuelve NULL, el parámetro pasado como `exports` es exportado por el módulo. Los módulos N-API no pueden modificar el objeto `module`, pero pueden especificar cualquiera como la propiedad `exports` del módulo.

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

Para establecer una función que sea devuelta por el `require()` para el complemento:

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
// NOTA: ejemplo parcial, no todo el código referenciado está incluido 
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

Para más detalles sobre la configuración de propiedades en objetos, consulte la sección sobre [Trabajar con las Propiedades de JavaScript](#n_api_working_with_javascript_properties).

For more details on building addon modules in general, refer to the existing API.

## Trabajar con las Propiedades de JavaScript
N-API expone un conjunto de APIs para crear todos los tipos de valores de JavaScript. Some of these types are documented under [Section 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Fundamentalmente, estas APIs son utilizadas para realizar una de las siguientes acciones:

1. Crear un nuevo objeto de JavaScript
2. Convertir de un tipo primitivo de C a un valor de N-API
3. Convertir de un valor de N-API a un tipo primitivo de C
4. Obtener instancias globales incluyendo `undefined` y `null`

Los valores de N-API son representados por el tipo `napi_value`. Cualquier llamada N-API que requiera un valor de JavaScript toma un `napi_value`. En algunos casos, la API verifica el tipo de `napi_value` por adelantado. Sin embargo, para un mejor rendimiento, es mejor para el que llama asegurarse de que el `napi_value` en cuestión sea del tipo de JavaScript que espera la API.

### Tipos de Enum
#### napi_key_collection_mode
<!-- YAML
added: v13.7.0
-->

> Estabilidad: 1 - Experimental

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
-->

> Estabilidad: 1 - Experimental

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
-->

> Estabilidad: 1 - Experimental

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

Describe el tipo de un `napi_value`. This generally corresponds to the types described in [Section 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) of the ECMAScript Language Specification. In addition to types in that section, `napi_valuetype` can also represent `Function`s and `Object`s with external data.

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

Esto representa el tipo de dato escalar binario subyacente del `TypedArray`. Elements of this enum correspond to [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

### Funciones de Creación de Objetos
#### napi_create_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[out] result`: Un `napi_value` que representa un `Array` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API que corresponde a un tipo de `Array` de JavaScript. JavaScript arrays are described in [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) of the ECMAScript Language Specification.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] length`: La longitud inicial del `Array`.
* `[out] result`: Un `napi_value` que representa un `Array` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API que corresponde a un tipo de `Array` de JavaScript. La propiedad de longitud del `Array` se establece en el parámetro de longitud pasado. However, the underlying buffer is not guaranteed to be pre-allocated by the VM when the array is created. That behavior is left to the underlying VM implementation. Si el buffer debe ser un bloque contiguo de memoria que pueda ser leído y/o escrito directamente desde C, considere utilizar [`napi_create_external_arraybuffer`][].

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] length`: La longitud en bytes del buffer del array a crear.
* `[out] data`: Apuntador al bytes buffer subyacente del `ArrayBuffer`.
* `[out] result`: El `napi_value` que representa un `ArrayBuffer` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un `ArrayBuffer` de JavaScript. Los `ArrayBuffer`s son utilizados para representar buffers de datos binarios de longitud fija. They are normally used as a backing-buffer for `TypedArray` objects. The `ArrayBuffer` allocated will have an underlying byte buffer whose size is determined by the `length` parameter that's passed in. El buffer subyacente se devuelve opcionalmente al que llama en caso de que quiera manipular el buffer directamente. Este buffer solo se puede escribir directamente desde el código nativo. To write to this buffer from JavaScript, a typed array or `DataView` object would need to be created.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] size`: Tamaño en bytes del buffer subyacente.
* `[out] data`: Puntero sin formato al buffer subyacente.
* `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer`. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] size`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
* `[in] data`: Puntero sin formato al buffer subyacente desde el que se va a copiar.
* `[out] result_data`: Apuntador al nuevo buffer de datos subyacente del `Buffer`.
* `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer` y lo inicializa con los datos copiados del buffer pasado. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] time`: ECMAScript time value in milliseconds since 01 January, 1970 UTC.
* `[out] result`: A `napi_value` representing a JavaScript `Date`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] data`: Puntero sin formato a los datos externos.
* `[in] finalize_cb`: Optional callback to call when the external value is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Un `napi_value` que representa un valor externo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un valor de JavaScript con datos externos adjuntos. This is used to pass external data through JavaScript code, so it can be retrieved later by native code using [`napi_get_value_external`][].

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] external_data`: Pointer to the underlying byte buffer of the `ArrayBuffer`.
* `[in] byte_length`: Longitud en bytes del buffer subyacente.
* `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: El `napi_value` que representa un `ArrayBuffer` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un `ArrayBuffer` de JavaScript. The underlying byte buffer of the `ArrayBuffer` is externally allocated and managed. El que llama debe asegurar que el byte buffer permanezca válido hasta que se llame a la callback de terminación.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] length`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
* `[in] data`: Puntero sin formato al buffer subyacente desde el que se va a copiar.
* `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
* `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
* `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer` y lo inicializa con los datos respaldados por el buffer pasado. While this is still a fully-supported data structure, in most cases using a `TypedArray` will suffice.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: A `napi_value` representing a JavaScript `Object`.

Devuelve `napi_ok` si la API fue exitosa.

This API allocates a default JavaScript `Object`. Es equivalente a realizar `new Object()` en JavaScript.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] description`: Optional `napi_value` which refers to a JavaScript `String` to be set as the description for the symbol.
* `[out] result`: A `napi_value` representing a JavaScript `Symbol`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] type`: Scalar datatype of the elements within the `TypedArray`.
* `[in] length`: Number of elements in the `TypedArray`.
* `[in] arraybuffer`: `ArrayBuffer` underlying the typed array.
* `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `TypedArray`.
* `[out] result`: A `napi_value` representing a JavaScript `TypedArray`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] length`: Number of elements in the `DataView`.
* `[in] arraybuffer`: `ArrayBuffer` underlying the `DataView`.
* `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `DataView`.
* `[out] result`: A `napi_value` representing a JavaScript `DataView`.

Devuelve `napi_ok` si la API fue exitosa.

This API creates a JavaScript `DataView` object over an existing `ArrayBuffer`. `DataView` objects provide an array-like view over an underlying data buffer, but one which allows items of different size and type in the `ArrayBuffer`.

Es necesario que `byte_length + byte_offset` sea menor o igual que el tamaño en bytes del array pasado. If not, a `RangeError` exception is raised.

JavaScript `DataView` objects are described in [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) of the ECMAScript Language Specification.

### Funciones para convertir de tipos de C a N-API
#### napi_create_int32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: Valor entero a ser representado en JavaScript.
* `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: Valor entero sin firmar para ser representado en JavaScript.
* `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: Valor entero a ser representado en JavaScript.
* `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

This API is used to convert from the C `int64_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification. Tenga en cuenta que el rango completo de `int64_t` no puede ser representado con total precisión en JavaScript. Integer values outside the range of [`Number.MIN_SAFE_INTEGER`][] `-(2^53 - 1)` - [`Number.MAX_SAFE_INTEGER`][] `(2^53 - 1)` will lose precision.

#### napi_create_double
<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: Valor de doble precisión a ser representado en JavaScript.
* `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

This API is used to convert from the C `double` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_bigint_int64
<!-- YAML
added: v10.7.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_create_bigint_int64(napi_env env,
                                     int64_t value,
                                     napi_value* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: Valor entero a ser representado en JavaScript.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Devuelve `napi_ok` si la API fue exitosa.

This API converts the C `int64_t` type to the JavaScript `BigInt` type.

#### napi_create_bigint_uint64
<!-- YAML
added: v10.7.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_create_bigint_uint64(napi_env env,
                                      uint64_t value,
                                      napi_value* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: Valor entero sin firmar para ser representado en JavaScript.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Devuelve `napi_ok` si la API fue exitosa.

This API converts the C `uint64_t` type to the JavaScript `BigInt` type.

#### napi_create_bigint_words
<!-- YAML
added: v10.7.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_create_bigint_words(napi_env env,
                                     int sign_bit,
                                     size_t word_count,
                                     const uint64_t* words,
                                     napi_value* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] sign_bit`: Determines if the resulting `BigInt` will be positive or negative.
* `[in] word_count`: The length of the `words` array.
* `[in] words`: An array of `uint64_t` little-endian 64-bit words.
* `[out] result`: A `napi_value` representing a JavaScript `BigInt`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] str`: Character buffer representing an ISO-8859-1-encoded string.
* `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[out] result`: Un `napi_value` que representa una `String` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

This API creates a JavaScript `String` object from an ISO-8859-1-encoded C string. Se copia la cadena nativa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] str`: Buffer de caracteres que representa una string codificada en UTF16-LE.
* `[in] length`: La longitud de la string en unidades de código de dos bytes, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
* `[out] result`: Un `napi_value` que representa una `String` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

This API creates a JavaScript `String` object from a UTF16-LE-encoded C string. Se copia la cadena nativa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] str`: Buffer de caracteres que representa una string codificada en UTF8.
* `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[out] result`: Un `napi_value` que representa una `String` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

This API creates a JavaScript `String` object from a UTF8-encoded C string. Se copia la cadena nativa.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

### Funciones para convertir desde N-API a tipos de C
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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing the JavaScript `Array` whose length is being queried.
* `[out] result`: `uint32` que representa la longitud del array.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve la longitud de un array.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] arraybuffer`: `napi_value` representing the `ArrayBuffer` being queried.
* `[out] data`: The underlying data buffer of the `ArrayBuffer`.
* `[out] byte_length`: Longitud en bytes del buffer de datos subyacente.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` que representa al `node::Buffer` que está siendo consultado.
* `[out] data`: El buffer de datos subyacente del `node::Buffer`.
* `[out] length`: Longitud en bytes del buffer de datos subyacente.

Devuelve `napi_ok` si la API fue exitosa.

Esta API es utilizada para recuperar el buffer de datos subyacente de un `node::Buffer` y su longitud.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] object`: `napi_value` representing JavaScript `Object` whose prototype to return. Este devuelve el equivalente de `Object.getPrototypeOf` (que no es lo mismo que la propiedad `prototype` de la función).
* `[out] result`: `napi_value` que representa al prototipo del objeto dado.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] typedarray`: `napi_value` representing the `TypedArray` whose properties to query.
* `[out] type`: Scalar datatype of the elements within the `TypedArray`.
* `[out] length`: The number of elements in the `TypedArray`.
* `[out] data`: The data buffer underlying the `TypedArray` adjusted by the `byte_offset` value so that it points to the first element in the `TypedArray`.
* `[out] arraybuffer`: The `ArrayBuffer` underlying the `TypedArray`.
* `[out] byte_offset`: The byte offset within the underlying native array at which the first element of the arrays is located. The value for the data parameter has already been adjusted so that data points to the first element in the array. Therefore, the first byte of the native array would be at `data - byte_offset`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve varias propiedades de un typed array.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] dataview`: `napi_value` representing the `DataView` whose properties to query.
* `[out] byte_length`: `Number` of bytes in the `DataView`.
* `[out] data`: The data buffer underlying the `DataView`.
* `[out] arraybuffer`: `ArrayBuffer` underlying the `DataView`.
* `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the `DataView`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing a JavaScript `Date`.
* `[out] result`: Time value as a `double` represented as milliseconds since midnight at the beginning of 01 January, 1970 UTC.

This API does not observe leap seconds; they are ignored, as ECMAScript aligns with POSIX time specification.

Devuelve `napi_ok` si la API fue exitosa. If a non-date `napi_value` is passed in it returns `napi_date_expected`.

This API returns the C double primitive of time value for the given JavaScript `Date`.

#### napi_get_value_bool
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `Boolean`.
* `[out] result`: C boolean primitive equivalent of the given JavaScript `Boolean`.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no booleano, devuelve `napi_boolean_expected`.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C double primitive equivalent of the given JavaScript `Number`.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

This API returns the C double primitive equivalent of the given JavaScript `Number`.

#### napi_get_value_bigint_int64
<!-- YAML
added: v10.7.0
-->

> Estabilidad: 1 - Experimental

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

Devuelve `napi_ok` si la API fue exitosa. If a non-`BigInt` is passed in it returns `napi_bigint_expected`.

This API returns the C `int64_t` primitive equivalent of the given JavaScript `BigInt`. If needed it will truncate the value, setting `lossless` to `false`.

#### napi_get_value_bigint_uint64
<!-- YAML
added: v10.7.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_get_value_bigint_uint64(napi_env env,
                                        napi_value value,
                                        uint64_t* result,
                                        bool* lossless);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] result`: C `uint64_t` primitive equivalent of the given JavaScript `BigInt`.
* `[out] lossless`: Indicates whether the `BigInt` value was converted losslessly.

Devuelve `napi_ok` si la API fue exitosa. If a non-`BigInt` is passed in it returns `napi_bigint_expected`.

This API returns the C `uint64_t` primitive equivalent of the given JavaScript `BigInt`. If needed it will truncate the value, setting `lossless` to `false`.

#### napi_get_value_bigint_words
<!-- YAML
added: v10.7.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_get_value_bigint_words(napi_env env,
                                        napi_value value,
                                        int* sign_bit,
                                        size_t* word_count,
                                        uint64_t* words);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `BigInt`.
* `[out] sign_bit`: Integer representing if the JavaScript `BigInt` is positive or negative.
* `[in/out] word_count`: Must be initialized to the length of the `words` array. Upon return, it will be set to the actual number of words that would be needed to store this `BigInt`.
* `[out] words`: Pointer to a pre-allocated 64-bit word array.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` que representa un valor externo de JavaScript.
* `[out] result`: Indicador para los datos envueltos por el valor externo de JavaScript.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no externo es pasado, devuelve `napi_invalid_arg`.

Esta API recupera el puntero a los datos externos que fue previamente pasado a `napi_create_external()`.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C `int32` primitive equivalent of the given JavaScript `Number`.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado en `napi_number_expected`.

This API returns the C `int32` primitive equivalent of the given JavaScript `Number`.

Si el número excede el rango del entero de 32 bits, entonces el resultado se trunca al equivalente de los 32 bits inferiores. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: C `int64` primitive equivalent of the given JavaScript `Number`.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` que representa la string de JavaScript.
* `[in] buf`: Buffer para escribir la string codificada en ISO-8859-1. Si se pasa NULL, se devuelve la longitud de la string (en bytes).
* `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la string devuelta será truncada.
* `[out] result`: Número de bytes copiados en el buffer, excluyendo al terminador Null.

Devuelve `napi_ok` si la API fue exitosa. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Esta API devuelve una string codificada en ISO-8859-1 que corresponde al valor pasado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` que representa la string de JavaScript.
* `[in] buf`: Buffer en el cual escribir la string codificada en UTF8. Si se pasa NULL, se devuelve la longitud de la string (en bytes).
* `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la string devuelta será truncada.
* `[out] result`: Número de bytes copiados en el buffer, excluyendo al terminador Null.

Devuelve `napi_ok` si la API fue exitosa. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Esta API devuelve la string codificada en UTF8 correspondiente al valor pasado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` que representa la string de JavaScript.
* `[in] buf`: Buffer en el cual escribir la string codificada en UTF16-LE. Si se pasa NULL, se devuelve la longitud de la string (en unidades de código de 2 bytes).
* `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la string devuelta será truncada.
* `[out] result`: Number of 2-byte code units copied into the buffer, excluding the null terminator.

Devuelve `napi_ok` si la API fue exitosa. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

Esta API devuelve la string codificada en UTF16 correspondiente al valor pasado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: `napi_value` representing JavaScript `Number`.
* `[out] result`: Primitivo de C equivalente al `napi_value` dado como un `uint32_t`.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

Esta API devuelve un primitivo de C equivalente al `napi_value` dado como `uint32_t`.

### Funciones para obtener instancias globales
#### napi_get_boolean
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor del booleano a recuperar.
* `[out] result`: `napi_value` representing JavaScript `Boolean` singleton to retrieve.

Devuelve `napi_ok` si la API fue exitosa.

This API is used to return the JavaScript singleton object that is used to represent the given boolean value.

#### napi_get_global
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: `napi_value` representing JavaScript `global` object.

Devuelve `napi_ok` si la API fue exitosa.

This API returns the `global` object.

#### napi_get_null
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: `napi_value` representing JavaScript `null` object.

Devuelve `napi_ok` si la API fue exitosa.

This API returns the `null` object.

#### napi_get_undefined
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: `napi_value` que representa al valor Indefinido de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el objeto Indefinido de JavaScript.

## Working with JavaScript Values and Abstract Operations

N-API expone un conjunto de APIs para realizar algunas operaciones abstractas en valores de JavaScript. Some of these operations are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Estas APIs soportan hacer uno de los siguientes:

1. Coerce JavaScript values to specific JavaScript types (such as `Number` or `String`).
2. Verificar el tipo de valor de JavaScript.
3. Verificar la equidad entre dos valores de JavaScript.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a forzar.
* `[out] result`: `napi_value` representing the coerced JavaScript `Boolean`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a forzar.
* `[out] result`: `napi_value` representing the coerced JavaScript `Number`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a forzar.
* `[out] result`: `napi_value` representing the coerced JavaScript `Object`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a forzar.
* `[out] result`: `napi_value` representing the coerced JavaScript `String`.

Devuelve `napi_ok` si la API fue exitosa.

This API implements the abstract operation `ToString()` as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_typeof
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaSript cuyo tipo será consultado.
* `[out] result`: El tipo del valor de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

* `napi_invalid_arg` si el tipo del `value` no es un tipo de ECMAScript conocido y el `value` no es un valor Externo.

Esta API representa un comportamiento similar a invocar al operador `typeof` en el objeto como se define en la [Sección 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) de las Especificaciones del Lenguaje ECMAScript. Sin embargo, tiene soporte para detectar un valor Externo. Si el `value` tiene un tipo inválido, se devuelve un error.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] object`: El valor de JavaScript a verificar.
* `[in] constructor`: The JavaScript function object of the constructor function to check against.
* `[out] result`: Booleano que se establece en true si `object instanceof constructor` es true.

Devuelve `napi_ok` si la API fue exitosa.

This API represents invoking the `instanceof` Operator on the object as defined in [Section 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) of the ECMAScript Language Specification.

### napi_is_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Si el objeto dado es un array.

Devuelve `napi_ok` si la API fue exitosa.

This API represents invoking the `IsArray` operation on the object as defined in [Section 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) of the ECMAScript Language Specification.

### napi_is_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Whether the given object is an `ArrayBuffer`.

Devuelve `napi_ok` si la API fue exitosa.

This API checks if the `Object` passed in is an array buffer.

### napi_is_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Si el `napi_value` dado representa un objeto `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

This API checks if the `Object` passed in is a buffer.

### napi_is_date
<!-- YAML
added: v11.11.0
napiVersion: 5
-->

```C
napi_status napi_is_date(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Whether the given `napi_value` represents a JavaScript `Date` object.

Devuelve `napi_ok` si la API fue exitosa.

This API checks if the `Object` passed in is a date.

### napi_is_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Whether the given `napi_value` represents an `Error` object.

Devuelve `napi_ok` si la API fue exitosa.

This API checks if the `Object` passed in is an `Error`.

### napi_is_typedarray
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Whether the given `napi_value` represents a `TypedArray`.

Devuelve `napi_ok` si la API fue exitosa.

This API checks if the `Object` passed in is a typed array.

### napi_is_dataview
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: El valor de JavaScript a verificar.
* `[out] result`: Whether the given `napi_value` represents a `DataView`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] lhs`: El valor de JavaScript a verificar.
* `[in] rhs`: El valor de JavaScript contra el que se va a comparar.
* `[out] result`: Si los dos objetos `napi_value` son iguales.

Devuelve `napi_ok` si la API fue exitosa.

This API represents the invocation of the Strict Equality algorithm as defined in [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) of the ECMAScript Language Specification.

### napi_detach_arraybuffer
<!-- YAML
added: v13.0.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_detach_arraybuffer(napi_env env,
                                    napi_value arraybuffer)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] arraybuffer`: The JavaScript `ArrayBuffer` to be detached.

Devuelve `napi_ok` si la API fue exitosa. If a non-detachable `ArrayBuffer` is passed in it returns `napi_detachable_arraybuffer_expected`.

Generally, an `ArrayBuffer` is non-detachable if it has been detached before. The engine may impose additional conditions on whether an `ArrayBuffer` is detachable. For example, V8 requires that the `ArrayBuffer` be external, that is, created with [`napi_create_external_arraybuffer`][].

This API represents the invocation of the `ArrayBuffer` detach operation as defined in [Section 24.1.1.3](https://tc39.es/ecma262/#sec-detacharraybuffer) of the ECMAScript Language Specification.

### napi_is_detached_arraybuffer
<!-- YAML
added: v13.3.0
-->

> Estabilidad: 1 - Experimental

```C
napi_status napi_is_detached_arraybuffer(napi_env env,
                                         napi_value arraybuffer,
                                         bool* result)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] arraybuffer`: The JavaScript `ArrayBuffer` to be checked.
* `[out] result`: Whether the `arraybuffer` is detached.

Devuelve `napi_ok` si la API fue exitosa.

The `ArrayBuffer` is considered detached if its internal data is `null`.

This API represents the invocation of the `ArrayBuffer` `IsDetachedBuffer` operation as defined in [Section 24.1.1.2](https://tc39.es/ecma262/#sec-isdetachedbuffer) of the ECMAScript Language Specification.

## Trabajar con las Propiedades de JavaScript

N-API expone un conjunto de APIs para obtener y establecer propiedades sobre objetos de JavaScript. Some of these types are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Las propiedades en JavaScript están representadas como una tupla de una clave y un valor. Fundamentalmente, todas las claves de las propiedades en N-API pueden ser representadas de alguna de las siguientes formas:

* Nombrada: una string simple codificada en UTF8
* Entero indexado: un valor de índice representado por `uint32_t`
* Valor de JavaScript: estos están representados por `napi_value` en N-API. This can be a `napi_value` representing a `String`, `Number`, or `Symbol`.

Los valores de N-API son representados por el tipo `napi_value`. Cualquier llamada N-API que requiera un valor de JavaScript toma un `napi_value`. Sin embargo, es responsabilidad del que llama asegurarse de que el `napi_value` en cuestión sea del tipo de JavaScript esperado por la API.

Las APIs documentadas en esta sección proporcionan una interfaz simple para obtener y establecer propiedades sobre objetos arbitrarios de JavaScript, representados por `napi_value`.

Por ejemplo, considere el siguiente fragmento de código JavaScript:

```js
const obj = {};
obj.myProp = 123;
```

El equivalente puede hacerse utilizando valores N-API con el siguiente fragmento:

```C
napi_status status = napi_generic_failure;

// const obj = {}
napi_value obj, value;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Crea un napi_value para 123
status = napi_create_int32(env, 123, &value);
if (status != napi_ok) return status;

// obj.myProp = 123
status = napi_set_named_property(env, obj, "myProp", value);
if (status != napi_ok) return status;
```

Las propiedades indexadas pueden establecerse de manera similar. Considere el siguiente fragmento de JavaScript:

```js
const arr = [];
arr[123] = 'hello';
```

El equivalente puede hacerse utilizando valores N-API con el siguiente fragmento:

```C
napi_status status = napi_generic_failure;

// const arr = [];
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// Crea un napi_value para 'hello'
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &value);
if (status != napi_ok) return status;

// arr[123] = 'hello';
status = napi_set_element(env, arr, 123, value);
if (status != napi_ok) return status;
```

Las propiedades pueden recuperarse utilizando las APIs descritas en esta sección. Considere el siguiente fragmento de JavaScript:

```js
const arr = [];
const value = arr[123];
```

El siguiente es el equivalente aproximado de la contraparte de N-API:

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

Finamente, múltiples propiedades también pueden ser definidas sobre un objeto por razones de rendimiento. Considere el siguiente código de JavaScript:

```js
const obj = {};
Object.defineProperties(obj, {
  'foo': { value: 123, writable: true, configurable: true, enumerable: true },
  'bar': { value: 456, writable: true, configurable: true, enumerable: true }
});
```

El siguiente es el equivalente aproximado de la contraparte de N-API:

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

### Estructuras
#### napi_property_attributes

```C
typedef enum {
  napi_default = 0,
  napi_writable = 1 << 0,
  napi_enumerable = 1 << 1,
  napi_configurable = 1 << 2,

  // Utilizada con la napi_define_class para distinguir propiedades estáticas
  // de propiedades de instancia. Ignoradas por napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

`napi_property_attributes` son banderas utilizadas para controlar el comportamiento de propiedades establecidas sobre un objeto de JavaScript. Aparte de `napi_static`, corresponden a los atributos listados en la [Sección 6.1.7.1](https://tc39.github.io/ecma262/#table-2) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/). Pueden ser uno o más de los siguientes bitflags:

* `napi_default`: No explicit attributes are set on the property. By default, a property is read only, not enumerable and not configurable.
* `napi_writable`: The property is writable.
* `napi_enumerable`: The property is enumerable.
* `napi_configurable`: The property is configurable as defined in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).
* `napi_static`: The property will be defined as a static property on a class as opposed to an instance property, which is the default. This is used only by [`napi_define_class`][]. It is ignored by `napi_define_properties`.

#### napi_property_descriptor

```C
typedef struct {
 // Alguno de los dos, utf8name o name, debe ser NULL.
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

* `utf8name`: Optional `String` describing the key for the property, encoded as UTF8. Alguno de los dos, `utf8name` o `name`, debe ser proporcionado para la propiedad.
* `name`: Optional `napi_value` that points to a JavaScript string or symbol to be used as the key for the property. Alguno de los dos, `utf8name` o `name`, debe ser proporcionado para la propiedad.
* `value`: El valor que es recuperado por un acceso de la propiedad si esta es una propiedad de datos. Si es pasado, establecezca `getter`, `setter`, `method` y `data` en `NULL` (ya que estos miembros no serán utilizados).
* `getter`: Una función a llamar cuando se realiza un acceso de la propiedad. Si es pasado, establezca `value` y `method` en `NULL` (ya que estos miembros no se utilizarán). The given function is called implicitly by the runtime when the property is accessed from JavaScript code (or if a get on the property is performed using a N-API call).
* `setter`: Una función a llamar cuando se realiza un acceso de conjunto de la propiedad. Si es pasado, establezca `value` y `method` en `NULL` (ya que estos miembros no se utilizarán). The given function is called implicitly by the runtime when the property is set from JavaScript code (or if a set on the property is performed using a N-API call).
* `method`: Establezca esto para hacer que la propiedad `value` del objeto descriptor de la propiedad sea una función de JavaScript representada por `method`. Si es pasado, establezca `value`, `getter` y `setter` en `NULL` (ya que estos miembros no se utilizarán).
* `attributes`: Los atributos asociados con la propiedad particular. See [`napi_property_attributes`][].
* `data`: The callback data passed into `method`, `getter` and `setter` if this function is invoked.

### Funciones
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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el cual recuperar las propiedades.
* `[out] result`: Un `napi_value` que representa un array de valores de JavaScript que representan los nombres de propiedad del objeto. Esta API puede ser utilizada para iterar sobre `result`, usando [`napi_get_array_length`][] y [`napi_get_element`][].

Devuelve `napi_ok` si la API fue exitosa.

This API returns the names of the enumerable properties of `object` as an array of strings. The properties of `object` whose key is a symbol will not be included.

#### napi_get_all_property_names
<!-- YAML
added: v13.7.0
-->

> Estabilidad: 1 - Experimental

```C
napi_get_all_property_names(napi_env env,
                            napi_value object,
                            napi_key_collection_mode key_mode,
                            napi_key_filter key_filter,
                            napi_key_conversion key_conversion,
                            napi_value* result);
```

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el cual recuperar las propiedades.
* `[in] key_mode`: Whether to retrieve prototype properties as well.
* `[in] key_filter`: Which properties to retrieve (enumerable/readable/writable).
* `[in] key_conversion`: Whether to convert numbered property keys to strings.
* `[out] result`: Un `napi_value` que representa un array de valores de JavaScript que representan los nombres de propiedad del objeto. [`napi_get_array_length`][] and [`napi_get_element`][] can be used to iterate over `result`.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto sobre el cual establecer la propiedad.
* `[in] key`: El nombre de la propiedad a establecer.
* `[in] value`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el cual recuperar la propiedad.
* `[in] key`: El nombre de la propiedad a recuperar.
* `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto a consultar.
* `[in] key`: El nombre de la propiedad cuya existencia se va a verificar.
* `[out] result`: Si la propiedad existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto a consultar.
* `[in] key`: El nombre de la propiedad a eliminar.
* `[out] result`: Si la eliminación de la propiedad fue exitosa o no. `result` puede ser opcionalmente ignorado pasando `NULL`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API intenta eliminar la propiedad de `key` propia desde `object`.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto a consultar.
* `[in] key`: El nombre de la propiedad propia cuya existencia se va a verificar.
* `[out] result`: Si la propiedad propia existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto sobre el cual establecer la propiedad.
* `[in] utf8Name`: El nombre de la propiedad a establecer.
* `[in] value`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el cual recuperar la propiedad.
* `[in] utf8Name`: El nombre de la propiedad a obtener.
* `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto a consultar.
* `[in] utf8Name`: El nombre de la propiedad cuya existencia se va a verificar.
* `[out] result`: Si la propiedad existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el que se establecen las propiedades.
* `[in] index`: El índice de la propiedad a establecer.
* `[in] value`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el cual recuperar la propiedad.
* `[in] index`: El índice de la propiedad a obtener.
* `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Esta API obtiene el elemento en el índice solicitado.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto a consultar.
* `[in] index`: El índice de la propiedad cuya existencia se va a verificar.
* `[out] result`: Si la propiedad existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto a consultar.
* `[in] index`: El índice de la propiedad a eliminar.
* `[out] result`: Si la eliminación del elemento fue exitosa o no. `result` puede ser opcionalmente ignorado pasando `NULL`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API intenta eliminar el `index` especificado desde `object`.

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

* `[in] env`: El entorno bajo el que la llamada N-API es invocada.
* `[in] object`: El objeto desde el cual recuperar las propiedades.
* `[in] property_count`: El número de elementos en el array de `properties`.
* `[in] properties`: El array de los descriptores de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite la definición eficiente de múltiples propiedades sobre un objeto dado. The properties are defined using property descriptors (see [`napi_property_descriptor`][]). Given an array of such property descriptors, this API will set the properties on the object one at a time, as defined by `DefineOwnProperty()` (described in [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) of the ECMA-262 specification).

## Trabajar con Funciones de JavaScript

N-API ofrece un conjunto de APIs que permiten al código de JavaScript hacer llamadas de vuelta al código nativo. Las APIs de N-API que son compatibles con las llamadas de vuelta al código nativo toman una función callback representada por el tipo `napi_callback`. Cuando la VM de JavaScript llama de vuelta al código nativo, la función `napi_callback` proporcionada es invocada. Las APIs documentadas en esta sección permiten a la función callback hacer lo siguiente:

* Obtener información sobre el contexto en el cual la callback fue invocada.
* Obtener los argumentos pasados a la callback.
* Devolver un `napi_value` desde la callback.

Adicionalmente, N-API proporciona un conjunto de funciones que permiten llamar funciones de JavaScript desde el código nativo. Se puede llamar a una función como una llamada de función de JavaScript regular, o como una función de constructor.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] recv`: El objeto `this` pasado a la función llamada.
* `[in] func`: `napi_value` representing the JavaScript function to be invoked.
* `[in] argc`: El conteo de elementos en el array `argv`.
* `[in] argv`: Array of `napi_values` representing JavaScript values passed in as arguments to the function.
* `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite a un objeto de función de JavaScript ser llamado desde un complemento nativo. This is the primary mechanism of calling back *from* the add-on's native code *into* JavaScript. Para el caso especial de llamar a JavaScript después de una operación asíncrona, vea [`napi_make_callback`][].

Un ejemplo de caso de uso podría verse de la siguiente manera. Considere el siguiente fragmento de código de JavaScript:

```js
function AddTwo(num) {
  return num + 2;
}
```

Entonces, la función anterior puede ser invocada desde un complemento nativo utilizando el siguiente código:

```C
// Obtener la función llamada "AddTwo" en el objeto global
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

// Convertir al resultado en un tipo nativo
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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] utf8Name`: El nombre de la función codificado como UTF8. Esto es visible dentro de JavaScript como la nueva propiedad `name` del objeto de función.
* `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[in] cb`: La función nativa que debe ser llamada cuando este objeto de función sea invocado.
* `[in] data`: Contexto de datos proporcionado por el usuario. Este será pasado de nuevo a la función cuando se invoque luego.
* `[out] result`: `napi_value` que representa el objeto de función de JavaScript para la nueva función creada.

Devuelve `napi_ok` si la API fue exitosa.

Esta API permite al autor de un complemento crear un objeto de función en código nativo. This is the primary mechanism to allow calling *into* the add-on's native code *from* JavaScript.

The newly created function is not automatically visible from script after this call. Instead, a property must be explicitly set on any object that is visible to JavaScript, in order for the function to be accessible from script.

Para exponer una función como parte de las exportaciones del módulo del complemento, establezca la función recién creada en el objeto de exportaciones. Un módulo de muestra puede verse de la siguiente manera:

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

Dado el código anterior, el complemento puede ser utilizado desde JavaScript de la siguiente manera:

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] cbinfo`: La información de la callback pasada a la función callback.
* `[in-out] argc`: Specifies the size of the provided `argv` array and receives the actual count of arguments.
* `[out] argv`: Buffer to which the `napi_value` representing the arguments are copied. If there are more arguments than the provided count, only the requested number of arguments are copied. If there are fewer arguments provided than claimed, the rest of `argv` is filled with `napi_value` values that represent `undefined`.
* `[out] this`: Recibe el argumento `this` de JavaScript para la llamada.
* `[out] data`: Recibe el puntero de datos para la callback.

Devuelve `napi_ok` si la API fue exitosa.

Este método es utilizado a través de una función callback para recuperar detalles sobre la llamada, como los argumentos y el puntero `this` desde la información de la callback dada.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] cbinfo`: La información de la callback pasada a la función callback.
* `[out] result`: El `new.target` de la llamada del constructor.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el `new.target` de la llamada del constructor. Si la callback actual no es una llamada del constructor, el resultado es `NULL`.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
* `[in] argc`: El conteo de elementos en el array `argv`.
* `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the constructor.
* `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto, el cual, en este caso, es el objeto constructor.

Este método es utilizado para instanciar un nuevo valor de JavaScript usando un `napi_value` dado que representa al constructor para el objeto. Por ejemplo, considere el siguiente fragmento de código:

```js
function MyObject(param) {
  this.param = param;
}

const arg = 'hello';
const value = new MyObject(arg);
```

El siguiente se puede aproximar en N-API utilizando el fragmento de código a continuación:

```C
// Obtener la función de constructor MyObject
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

Devuelve `napi_ok` si la API fue exitosa.

## Envoltura de Objeto

N-API ofrece una forma de "envolver" las instancias y clases de C++ para que los métodos y la clase constructor puedan ser llamados desde JavaScript.

1. The [`napi_define_class`][] API defines a JavaScript class with constructor, static properties and methods, and instance properties and methods that correspond to the C++ class.
2. When JavaScript code invokes the constructor, the constructor callback uses [`napi_wrap`][] to wrap a new C++ instance in a JavaScript object, then returns the wrapper object.
3. When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` C++ function is invoked. For an instance callback, [`napi_unwrap`][] obtains the C++ instance that is the target of the call.

Para los objetos envueltos puede ser difícil distinguir entre una función llamada sobre un prototipo de clase y una función llamada sobre una instancia de una clase. Un patrón común utilizado para abordar este problema es guardar una referencia persistente a la clase constructor para posteriores verificaciones de `instanceof`.

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
  // de lo contrario...
}
```

La referencia debe ser liberada una vez que deje de ser necesaria.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] utf8name`: Nombre de la función constructor de JavaScript; no se requiere que este sea el mismo que el nombre de la clase de C++, aunque es recomendado para mayor claridad.
* `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
* `[in] constructor`: Función callback que maneja la construcción de instancias de la clase. (Este debe ser un método estático en la clase, no una función real de constructor de C++)
* `[in] data`: Datos opcionales a ser pasados a la callback del constructor como la propiedad `data` de la información de la callback.
* `[in] property_count`: Número de elementos en el argumento del array `properties`.
* `[in] properties`: Array de descriptores de propiedad que describen propiedades de datos estáticos y de instancia, accesores, y métodos en la clase. Vea`napi_property_descriptor`.
* `[out] result`: Un `napi_value` que representa la función de constructor para la clase.

Devuelve `napi_ok` si la API fue exitosa.

Define una clase de Javascript que corresponde a una clase de C++, incluyendo:

* Una función constructor de JavaScript que tiene el nombre de la clase e invoca a la callback del constructor de C++ proporcionado.
* Properties on the constructor function corresponding to _static_ data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
* Properties on the constructor function's `prototype` object corresponding to _non-static_ data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

La callback del constructor de C++ debe se un método estático sobre la clase que llama a la verdadera clase del constructor, entonces envuelve la nueva instancia de C++ en un objeto de JavaScript, y devuelve un objeto de envoltorio. Vea `napi_wrap()` para más detalles.

La función constructora de JavaScript devuelta desde [`napi_define_class`][] es usualmente guardada y utilizada luego, para construir nuevas instancias de la clase desde código nativo, y/o verificar si los valores proporcionados son instancias de la clase. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] js_object`: El objeto de JavaScript que será el envoltorio para el objeto nativo.
* `[in] native_object`: La instancia nativa que será envuelta en el objeto de JavaScript.
* `[in] finalize_cb`: Callback nativa opcional que puede ser utilizada para liberar la instancia nativa cuando el objeto de JavaScript esté listo para la recolección de basura.
* `[in] finalize_hint`: Sugerencia contextual opcional que es pasada a la callback de finalización.
* `[out] result`: Referencia opcional al objeto envuelto.

Devuelve `napi_ok` si la API fue exitosa.

Envuelve una instancia nativa en un objeto de JavaScript. La instancia nativa puede ser recuperada luego utilizando `napi_unwrap()`.

Cuando un código de JavaScript invoca un constructor para la clase que fue definida utilizando `napi_define_class()`, el `napi_callback` para el constructor es invocado. Luego de construir una instancia de la clase nativa, la callback debe llamar entonces a `napi_wrap()` para envolver a la instancia recién construida en el ya creado objeto de JavaScript que es el argumento `this` de la callback del constructor. (Ese objeto `this` fue creado desde el `prototype` de la función del constructor, entonces ya tiene definiciones de todas las propiedades y métodos de instancia.)

Normalmente, al envolver una instancia de clase, se debe proporcionar un callback de terminación que simplemente elimine la instancia nativa que se recibe como el argumento `data` para la callback de terminación.

La referencia opcional devuelta es, inicialmente, una referencia débil, lo que significa que tiene una cuenta de referencia de 0. Normalmente, esta cuenta de referencia se incrementará temporalmente durante operaciones asíncronas que requieran que la instancia permanezca válida.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] js_object`: El objeto asociado con la instancia nativa.
* `[out] result`: Puntero a la instancia nativa envuelta.

Devuelve `napi_ok` si la API fue exitosa.

Recupera una instancia nativa que estaba envuelta previamente en un objeto de JavaScript usando `napi_wrap()`.

Cuando el código de JavaScript invoca un método o un accesor de propiedad en la clase, el `napi_callback` correspondiente es invocado. Si la callback es para un método o accesor de instancia, entonces el argumento `this` a la callback es el objeto envoltorio; la instancia de C++ envuelta que es el objetivo de la llamada se puede obtener llamando a `napi_unwrap()` en el objeto envoltorio.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] js_object`: El objeto asociado con la instancia nativa.
* `[out] result`: Puntero a la instancia nativa envuelta.

Devuelve `napi_ok` si la API fue exitosa.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] js_object`: The JavaScript object to which the native data will be attached.
* `[in] native_object`: The native data that will be attached to the JavaScript object.
* `[in] finalize_cb`: Native callback that will be used to free the native data when the JavaScript object is ready for garbage-collection.
* `[in] finalize_hint`: Sugerencia contextual opcional que es pasada a la callback de finalización.
* `[out] result`: Optional reference to the JavaScript object.

Devuelve `napi_ok` si la API fue exitosa.

Adds a `napi_finalize` callback which will be called when the JavaScript object in `js_object` is ready for garbage collection. This API is similar to `napi_wrap()` except that:

* the native data cannot be retrieved later using `napi_unwrap()`,
* nor can it be removed later using `napi_remove_wrap()`, and
* the API can be called multiple times with different data items in order to attach each of them to the JavaScript object, and
* the object manipulated by the API can be used with `napi_wrap()`.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. If it is deleted before then, then the finalize callback may never be invoked. Therefore, when obtaining a reference a finalize callback is also required in order to enable correct disposal of the reference.

## Operaciones Asíncronas Simples

Los módulos de complementos a menudo necesitan aprovechar ayudantes asíncronos de libuv como parte de su implementación. Esto les permite programar el trabajo a ser ejecutado de forma asíncrona, de modo que sus métodos puedan regresar antes de que se complete el trabajo. This allows them to avoid blocking overall execution of the Node.js application.

N-API proporciona una interfaz ABI estable para estas funciones de soporte que cubren los casos de uso asíncrono más comunes.

N-API defines the `napi_async_work` structure which is used to manage asynchronous workers. Las instancias son creadas/eliminadas con [`napi_create_async_work`][] y [`napi_delete_async_work`][].

Los callbacks `execute` y `complete` son funciones que serán invocadas cuando el ejecutor esté preparado para ejecutar y cuando complete su tarea, respectivamente.

The `execute` function should avoid making any N-API calls that could result in the execution of JavaScript or interaction with JavaScript objects. Most often, any code that needs to make N-API calls should be made in `complete` callback instead. Avoid using the `napi_env` parameter in the execute callback as it will likely execute JavaScript.

Estas funciones implementan las siguientes interfaces:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

When these methods are invoked, the `data` parameter passed will be the addon-provided `void*` data that was passed into the `napi_create_async_work` call.

Una vez creado, el worker asíncrono puede ponerse en cola para la ejecución utilizando la función [`napi_queue_async_work`][]:

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

[`napi_cancel_async_work`][] can be used if the work needs to be cancelled before the work has started execution.

Después de llamar a [`napi_cancel_async_work`][], el callback `complete` será invocado con un valor de estado de `napi_cancelled`. El trabajo no debe ser eliminado antes de la invocación del callback `complete`, incluso cuando fue cancelado.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] async_resource`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
* `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
* `[in] complete`: La función nativa que será llamada cuando la lógica asíncrona esté completa o sea cancelada. La función dada es llamada desde el hilo del bucle de eventos principal.
* `[in] data`: Contexto de datos proporcionado por el usuario. Este será pasado de vuelta a las funciones de ejecución y completación.
* `[out] result`: `napi_async_work*` que es el manejador para el trabajo asíncrono recién creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto de trabajo que es utilizado para ejecutar la lógica de manera asíncrona. Debe ser liberado utilizando [`napi_delete_async_work`][] una vez que el trabajo ya no sea requerido.

`async_resource_name` debe ser una string codificada en UTF-8 y terminada en null.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] work`: El manejador devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API libera un objeto de trabajo previamente asignado.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

### napi_queue_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] work`: El manejador devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API solicita que el trabajo asignado previamente sea programado para su ejecución. Once it returns successfully, this API must not be called again with the same `napi_async_work` item or the result will be undefined.

### napi_cancel_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] work`: El manejador devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cancela el trabajo en cola, si aún no ha sido iniciado. Si ya comenzó a ejecutarse, no puede ser cancelado y `napi_generic_failure` será devuelto. Si es exitoso, la callback `complete` será invocada con un valor de estado de `napi_cancelled`. El trabajo no debe ser eliminado antes de la invocación de la callback `complete`, incluso si fue cancelado de manera exitosa.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

## Operaciones Asíncronas Personalizadas

Las APIs de trabajo asíncrono simple anteriores pueden no ser apropiadas para cada escenario. Al utilizar cualquier otro mecanismo asíncrono, las siguientes APIs son necesarias para asegurar que una operación asíncrona sea apropiadamente rastreada por el tiempo de ejecución.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] async_resource`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles `async_hooks` [`init` hooks][].
* `[in] async_resource_name`: Identificador para el tipo de recurso que está siendo proporcionado para la información de diagnóstico expuesta por la API `async_hooks`.
* `[out] result`: El contexto asíncrono inicializado.

Devuelve `napi_ok` si la API fue exitosa.

### napi_async_destroy
<!-- YAML
added: v8.6.0
napiVersion: 1
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] async_context`: El contexto asíncrono a ser destruido.

Devuelve `napi_ok` si la API fue exitosa.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
* `[in] recv`: El objeto `this` pasado a la función llamada.
* `[in] func`: `napi_value` representing the JavaScript function to be invoked.
* `[in] argc`: El conteo de elementos en el array `argv`.
* `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
* `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite a un objeto de función de JavaScript ser llamado desde un complemento nativo. Esta API es similar a `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). Es una envoltura bastante simple alrededor de `node::MakeCallback`.

Note it is *not* necessary to use `napi_make_callback` from within a `napi_async_complete_callback`; in that situation the callback's async context has already been set up, so a direct call to `napi_call_function` is sufficient and appropriate. El uso de la función `napi_make_callback` puede ser requerido cuando se implementa un comportamiento asíncrono personalizado que no utiliza `napi_create_async_work`.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] resource_object`: An object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
* `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
* `[out] result`: El ámbito recién creado.

There are cases (for example, resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls. Si no hay otro script en la pila, las funciones [`napi_open_callback_scope`][] y [`napi_close_callback_scope`][] pueden ser utilizadas para abrir/cerrar el ámbito requerido.

### napi_close_callback_scope
<!-- YAML
added: v9.6.0
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

* `[in] env`: El entorno en el que se invoca la API.
* `[in] scope`: El ámbito a ser cerrado.

Se puede llamar a esta API incluso si hay una excepción de JavaScript pendiente.

## Administración de Versiones

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

* `[in] env`: El entorno en el que se invoca la API.
* `[out] version`: A pointer to version information for Node.js itself.

Devuelve `napi_ok` si la API fue exitosa.

This function fills the `version` struct with the major, minor, and patch version of Node.js that is currently running, and the `release` field with the value of [`process.release.name`][`process.release`].

El buffer devuelto está asignado de forma estática y no necesita ser liberado.

### napi_get_version
<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

* `[in] env`: El entorno en el que se invoca la API.
* `[out] result`: La versión más alta soportada de N-API.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve la versión más alta de N-API soportada por el tiempo de ejecución de Node.js. Está previsto que N-API sea aditiva, de modo que las versiones más recientes de Node.js puedan soportar funciones API adicionales. Para permitir que un complemento utilice una función más nueva cuando se ejecuta con versiones de Node.js que lo soportan, al mismo tiempo que se proporciona un comportamiento alternativo cuando se ejecuta con versiones de Node.js que no lo soportan:

* Llamar a `napi_get_version()` para determinar si la API está disponible.
* Si está disponible, cargar de forma dinámica un puntero a la función utilizando `uv_dlsym()`.
* Utilizar el puntero cargado de forma dinámica para invocar a la función.
* Si la función no está disponible, proporcionar una implementación alternativa que no utilice la función.

## Gestión de la Memoria

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
* `[out] result`: El valor ajustado

Devuelve `napi_ok` si la API fue exitosa.

Esta función le da a V8 una indicación de la cantidad de memoria asignada externamente que se mantiene activa por los objetos de JavaScript (por ejemplo, un objeto de JavaScript que apunta a su propia memoria asignada por el módulo nativo.). El registro de la memoria asignada externamente desencadenará recolecciones de basura globales más a menudo que de lo contrario.

## Promesas

N-API proporciona facilidades para crear objetos `Promise` como se describen en la [Sección 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) de la especificación ECMA. Implementa promesas como un par de objetos. Cuando una promesa es creada por `napi_create_promise()`, se crea un objeto "diferido" y se devuelve junto con la `Promise`. El objeto diferido está vinculado a la `Promise` creada y es el único medio para resolver o rechazar la `Promise` utilizando `napi_resolve_deferred()` o `napi_reject_deferred()`. El objeto diferido que es creado por `napi_create_promise()` es liberado por `napi_resolve_deferred()` o `napi_reject_deferred()`. El objeto `Promise` puede ser devuelto a JavaScript, donde puede ser utilizado de la forma habitual.

Por ejemplo, para crear una promesa y pasarla a un worker asíncrono:

```c
napi_deferred deferred;
napi_value promise;
napi_status status;


// Crea la promesa.
status = napi_create_promise(env, &deferred, &promise);
if (status != napi_ok) return NULL;

// Pasa el diferido a una función que realiza una acción asíncrona.
do_something_asynchronous(deferred);

// Devuelve la promesa a JS
return promise;
```

La función anterior `do_something_asynchronous()` llevaría a cabo su acción asíncrona y entonces resolvería o rechazaría al diferido, concluyendo así la promesa y liberando al diferido:

```c
napi_deferred deferred;
napi_value undefined;
napi_status status;

// Crea un valor con el cual concluir al diferido.
status = napi_get_undefined(env, &undefined);
if (status != napi_ok) return NULL;

// Resuelve o rechaza la promesa asociada con el diferido, dependiendo de
// si la acción asíncrona fue exitosa.
if (asynchronous_action_succeeded) {
  status = napi_resolve_deferred(env, deferred, undefined);
} else {
  status = napi_reject_deferred(env, deferred, undefined);
}
if (status != napi_ok) return NULL;

// En este punto el diferido ha sido liberado, por lo tanto debemos asignarle NULL.
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

* `[in] env`: El entorno en el que se invoca la API.
* `[out] deferred`: Un objeto diferido recién creado que luego puede ser pasado a `napi_resolve_deferred()` o `napi_reject_deferred()` para resolver el rechazo de la promesa asociada.
* `[out] promise`: La promesa de JavaScript asociada con el objeto diferido.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto diferido y una promesa de JavaScript.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] deferred`: El objeto diferido cuya promesa asociada se resolverá.
* `[in] resolution`: El valor con el cual resolver la promesa.

Esta API resuelve una promesa de JavaScript a través del objeto diferido con el cual está asociada. Por lo tanto, sólo puede ser utilizada para resolver promesas de JavaScript para las cuales esté disponible el objeto diferido correspondiente. Esto significa, efectivamente, que la promesa debe haber sido creada utilizando `napi_create_promise()` y el objeto diferido devuelto de esa llamada debe haber sido retenido para ser pasado a esta API.

El objeto diferido se libera al completarse con éxito.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] deferred`: El objeto diferido cuya promesa asociada se resolverá.
* `[in] rejection`: El valor con el cual se rechazará la promesa.

Esta API rechaza una promesa de JavaScript a través del objeto diferido al cual está asociada. Por lo tanto, sólo puede ser utilizada para rechazar promesas de JavaScript para las cuales esté disponible el objeto diferido correspondiente. Esto significa, efectivamente, que la promesa debe haber sido creada utilizando `napi_create_promise()` y el objeto diferido devuelto de esa llamada debe haber sido retenido para ser pasado a esta API.

El objeto diferido se libera al completarse con éxito.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] value`: The value to examine
* `[out] is_promise`: Flag indicating whether `promise` is a native promise object (that is, a promise object created by the underlying engine).

## Ejecución del script

N-API proporciona una API para ejecutar una string que contiene JavaScript utilizando el motor subyacente de JavaScript.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] script`: Una string de JavaScript que contiene el script a ejecutar.
* `[out] result`: El valor que resulta de haber ejecutado el script.

This function executes a string of JavaScript code and returns its result with the following caveats:

* Unlike `eval`, this function does not allow the script to access the current lexical scope, and therefore also does not allow to access the [module scope](modules.html#modules_the_module_scope), meaning that pseudo-globals such as `require` will not be available.
* The script can access the [global scope](globals.html). Function and `var` declarations in the script will be added to the [`global`][] object. Variable declarations made using `let` and `const` will be visible globally, but will not be added to the [`global`][] object.
* The value of `this` is [`global`][] within the script.

## bucle de eventos de libuv

N-API proporciona una función para obtener el bucle de eventos actual asociado con un `napi_env` específico.

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

* `[in] env`: El entorno en el que se invoca la API.
* `[out] loop`: La instancia actual del bucle de libuv.

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

* `[in] env`: El entorno en el que se invoca la API.
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

* `[in] env`: El entorno en el que se invoca la API.
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

* `[in] env`: El entorno en el que se invoca la API.
* `[in] func`: The thread-safe function to unreference.

This API is used to indicate that the event loop running on the main thread may exit before `func` is destroyed. Similar to [`uv_unref`][] it is also idempotent.

This API may only be called from the main thread.
