# N-API

<!--introduced_in=v7.10.0-->

> Stabilità: 2 - Stable

N-API (pronounced N as in the letter, followed by API) is an API for building native Addons. It is independent from the underlying JavaScript runtime (ex V8) and is maintained as part of Node.js itself. This API will be Application Binary Interface (ABI) stable across versions of Node.js. It is intended to insulate Addons from changes in the underlying JavaScript engine and allow modules compiled for one version to run on later versions of Node.js without recompilation.

Addons are built/packaged with the same approach/tools outlined in the section titled [C++ Addons](addons.html). L'unica differenza è l'insieme di API utilizzate dal codice nativo. Instead of using the V8 or [Native Abstractions for Node.js](https://github.com/nodejs/nan) APIs, the functions available in the N-API are used.

APIs exposed by N-API are generally used to create and manipulate JavaScript values. Concepts and operations generally map to ideas specified in the ECMA262 Language Specification. The APIs have the following properties:

- Tutte le chiamate N-API restituiscono(return) uno status code di tipo `napi_status`. This status indicates whether the API call succeeded or failed.
- Il valore di return dell'API viene passato tramite un parametro out.
- All JavaScript values are abstracted behind an opaque type named `napi_value`.
- In case of an error status code, additional information can be obtained using `napi_get_last_error_info`. More information can be found in the error handling section [Error Handling](#n_api_error_handling).

The documentation for N-API is structured as follows:

- [Data Types N-API di base](#n_api_basic_n_api_data_types)
- [Gestione degli Errori](#n_api_error_handling)
- [Object Lifetime Management](#n_api_object_lifetime_management)
- [Module Registration](#n_api_module_registration)
- [Lavorare con i valori JavaScript](#n_api_working_with_javascript_values)
- \[Working with JavaScript Values - Abstract Operations\]\[\]
- [Lavorare con le Proprietà JavaScript](#n_api_working_with_javascript_properties)
- [Lavorare con le funzioni JavaScript](#n_api_working_with_javascript_functions)
- [Object Wrap](#n_api_object_wrap)
- [Semplici Operazioni Asincrone](#n_api_simple_asynchronous_operations)
- [Operazioni Asincrone Personalizzate](#n_api_custom_asynchronous_operations)
- [Promises](#n_api_promises)
- [Script Execution](#n_api_script_execution)

The N-API is a C API that ensures ABI stability across Node.js versions and different compiler levels. However, we also understand that a C++ API can be easier to use in many cases. To support these cases we expect there to be one or more C++ wrapper modules that provide an inlineable C++ API. Binaries built with these wrapper modules will depend on the symbols for the N-API C based functions exported by Node.js. These wrappers are not part of N-API, nor will they be maintained as part of Node.js. One such example is: [node-addon-api](https://github.com/nodejs/node-addon-api).

## Utilizzo

In order to use the N-API functions, include the file [node_api.h](https://github.com/nodejs/node/blob/master/src/node_api.h) which is located in the src directory in the node development tree. Per esempio:

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

|       |    1    |    2     |    3     |
|:-----:|:-------:|:--------:|:--------:|
| v4.x  |         |          |          |
| v6.x  |         |          | v6.14.2* |
| v8.x  | v8.0.0* | v8.10.0* |          |
| v9.x  | v9.0.0* | v9.3.0*  | v9.11.0* |
| v10.x |         |          | v10.0.0  |

\* Indicates that the N-API version was released as experimental

## Data Types N-API di base

N-API exposes the following fundamental datatypes as abstractions that are consumed by the various APIs. These APIs should be treated as opaque, introspectable only with other N-API calls.

### napi_status

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
#ifdef NAPI_EXPERIMENTAL
  napi_queue_full,
  napi_closing,
#endif  // NAPI_EXPERIMENTAL
} napi_status;
```

If additional information is required upon an API returning a failed status, it can be obtained by calling `napi_get_last_error_info`.

### napi_extended_error_info

```C
typedef struct {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
} napi_extended_error_info;
```

- `error_message`: UTF8-encoded string containing a VM-neutral description of the error.
- `engine_reserved`: Riservato per i dettagli degli errori specifici della VM. This is currently not implemented for any VM.
- `engine_error_code`: Error code specifico della VM. This is currently not implemented for any VM.
- `error_code`: Lo status code di N-API che ha avuto origine con l'ultimo errore.

Vedi la sezione [Gestione degli Errori](#n_api_error_handling) per ulteriori informazioni.

### napi_env

`napi_env` is used to represent a context that the underlying N-API implementation can use to persist VM-specific state. This structure is passed to native functions when they're invoked, and it must be passed back when making N-API calls. Specifically, the same `napi_env` that was passed in when the initial native function was called must be passed to any subsequent nested N-API calls. Caching the `napi_env` for the purpose of general reuse is not allowed.

### napi_value

Questo è un puntatore opaco che viene utilizzato per rappresentare un valore JavaScript.

### napi_threadsafe_function

> Stabilità: 2 - Stable

This is an opaque pointer that represents a JavaScript function which can be called asynchronously from multiple threads via `napi_call_threadsafe_function()`.

### napi_threadsafe_function_release_mode

> Stabilità: 2 - Stable

A value to be given to `napi_release_threadsafe_function()` to indicate whether the thread-safe function is to be closed immediately (`napi_tsfn_abort`) or merely released (`napi_tsfn_release`) and thus available for subsequent use via `napi_acquire_threadsafe_function()` and `napi_call_threadsafe_function()`.

```C
typedef enum {
  napi_tsfn_release,
  napi_tsfn_abort
} napi_threadsafe_function_release_mode;
```

### napi_threadsafe_function_call_mode

> Stabilità: 2 - Stable

A value to be given to `napi_call_threadsafe_function()` to indicate whether the call should block whenever the queue associated with the thread-safe function is full.

```C
typedef enum {
  napi_tsfn_nonblocking,
  napi_tsfn_blocking
} napi_threadsafe_function_call_mode;
```

### Tipi di N-API Memory Management

#### napi_handle_scope

This is an abstraction used to control and modify the lifetime of objects created within a particular scope. In general, N-API values are created within the context of a handle scope. When a native method is called from JavaScript, a default handle scope will exist. If the user does not explicitly create a new handle scope, N-API values will be created in the default handle scope. For any invocations of code outside the execution of a native method (for instance, during a libuv callback invocation), the module is required to create a scope before invoking any functions that can result in the creation of JavaScript values.

Handle scopes are created using [`napi_open_handle_scope`][] and are destroyed using [`napi_close_handle_scope`][]. Closing the scope can indicate to the GC that all `napi_value`s created during the lifetime of the handle scope are no longer referenced from the current stack frame.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope

Escapable handle scopes are a special type of handle scope to return values created within a particular handle scope to a parent scope.

#### napi_ref

Questa è l'abstraction da usare per fare riferimento a `napi_value`. This allows for users to manage the lifetimes of JavaScript values, including defining their minimum lifetimes explicitly.

Per maggiori dettagli, consulta [Object Lifetime Management](#n_api_object_lifetime_management).

### Tipi di N-API Callback

#### napi_callback_info

Datatype opaco passato ad una funzione di callback. It can be used for getting additional information about the context in which the callback was invoked.

#### napi_callback

Function pointer type for user-provided native functions which are to be exposed to JavaScript via N-API. Callback functions should satisfy the following signature:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize

Function pointer type for add-on provided functions that allow the user to be notified when externally-owned data is ready to be cleaned up because the object with which it was associated with, has been garbage-collected. The user must provide a function satisfying the following signature which would get called upon the object's collection. Currently, `napi_finalize` can be used for finding out when objects that have external data are collected.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```

#### napi_async_execute_callback

Function pointer used with functions that support asynchronous operations. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

#### napi_async_complete_callback

Function pointer used with functions that support asynchronous operations. Le funzioni di callback devono soddisfare la seguente dicitura:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

#### napi_threadsafe_function_call_js

> Stabilità: 2 - Stable

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

- `[in] env`: The environment to use for API calls, or `NULL` if the thread-safe function is being torn down and `data` may need to be freed.
- `[in] js_callback`: The JavaScript function to call, or `NULL` if the thread-safe function is being torn down and `data` may need to be freed.
- `[in] context`: The optional data with which the thread-safe function was created.
- `[in] data`: Data created by the secondary thread. It is the responsibility of the callback to convert this native data to JavaScript values (with N-API functions) that can be passed as parameters when `js_callback` is invoked. This pointer is managed entirely by the threads and this callback. Thus this callback should free the data.

## Gestione degli Errori

N-API utilizza sia i valori return che le eccezioni JavaScript per la gestione degli errori. Le seguenti sezioni spiegano l'approccio per ciascun caso.

### Valori Return

Tutte le funzioni N-API condividono lo stesso modello di gestione degli errori. The return type of all API functions is `napi_status`.

The return value will be `napi_ok` if the request was successful and no uncaught JavaScript exception was thrown. If an error occurred AND an exception was thrown, the `napi_status` value for the error will be returned. If an exception was thrown, and no error occurred, `napi_pending_exception` will be returned.

In cases where a return value other than `napi_ok` or `napi_pending_exception` is returned, [`napi_is_exception_pending`][] must be called to check if an exception is pending. Vedi la sezione sulle eccezioni per maggiori dettagli.

The full set of possible napi_status values is defined in `napi_api_types.h`.

The `napi_status` return value provides a VM-independent representation of the error which occurred. In some cases it is useful to be able to get more detailed information, including a string representing the error as well as VM (engine)-specific information.

In order to retrieve this information [`napi_get_last_error_info`][] is provided which returns a `napi_extended_error_info` structure. Il formato della struttura `napi_extended_error_info` è il seguente:

```C
typedef struct napi_extended_error_info {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
};
```

- `error_message`: Rappresentazione testuale dell'errore che si è verificato.
- `engine_reserved`: Handle opaco riservato solo all'uso dell'engine.
- `engine_error_code`: Error code specifico della VM.
- `error_code`: Status code n-api per l'ultimo errore.

[`napi_get_last_error_info`][] returns the information for the last N-API call that was made.

*Note*: Do not rely on the content or format of any of the extended information as it is not subject to SemVer and may change at any time. It is intended only for logging purposes.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: The `napi_extended_error_info` structure with more information about the error.

Restituisce `napi_ok` se l'API ha esito positivo.

This API retrieves a `napi_extended_error_info` structure with information about the last error that occurred.

*Note*: The content of the `napi_extended_error_info` returned is only valid up until an n-api function is called on the same `env`.

*Note*: Do not rely on the content or format of any of the extended information as it is not subject to SemVer and may change at any time. It is intended only for logging purposes.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Eccezioni

Qualsiasi chiamata alla funzione N-API può causare un'eccezione JavaScript in sospeso. This is obviously the case for any function that may cause the execution of JavaScript, but N-API specifies that an exception may be pending on return from any of the API functions.

If the `napi_status` returned by a function is `napi_ok` then no exception is pending and no additional action is required. If the `napi_status` returned is anything other than `napi_ok` or `napi_pending_exception`, in order to try to recover and continue instead of simply returning immediately, [`napi_is_exception_pending`][] must be called in order to determine if an exception is pending or not.

Quando un'eccezione è in sospeso, è possibile utilizzare uno dei seguenti due approcci.

The first approach is to do any appropriate cleanup and then return so that execution will return to JavaScript. As part of the transition back to JavaScript the exception will be thrown at the point in the JavaScript code where the native method was invoked. The behavior of most N-API calls is unspecified while an exception is pending, and many will simply return `napi_pending_exception`, so it is important to do as little as possible and then return to JavaScript where the exception can be handled.

Il secondo approccio è provare a gestire l'eccezione. There will be cases where the native code can catch the exception, take the appropriate action, and then continue. This is only recommended in specific cases where it is known that the exception can be safely handled. In these cases [`napi_get_and_clear_last_exception`][] can be used to get and clear the exception. On success, result will contain the handle to the last JavaScript Object thrown. If it is determined, after retrieving the exception, the exception cannot be handled after all it can be re-thrown it with [`napi_throw`][] where error is the JavaScript Error object to be thrown.

The following utility functions are also available in case native code needs to throw an exception or determine if a `napi_value` is an instance of a JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] and [`napi_is_error`][].

The following utility functions are also available in case native code needs to create an Error object: [`napi_create_error`][], [`napi_create_type_error`][], and [`napi_create_range_error`][]. where result is the napi_value that refers to the newly created JavaScript Error object.

The Node.js project is adding error codes to all of the errors generated internally. The goal is for applications to use these error codes for all error checking. The associated error messages will remain, but will only be meant to be used for logging and display with the expectation that the message can change without SemVer applying. In order to support this model with N-API, both in internal functionality and for module specific functionality (as its good practice), the `throw_` and `create_` functions take an optional code parameter which is the string for the code to be added to the error object. If the optional parameter is NULL then no code will be associated with the error. If a code is provided, the name associated with the error is also updated to be:

```text
originalName [code]
```

where originalName is the original name associated with the error and code is the code that was provided. For example if the code is 'ERR_ERROR_1' and a TypeError is being created the name will be:

```text
TypeError [ERR_ERROR_1]
```

#### napi_throw

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_throw(napi_env env, napi_value error);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] error`: The `napi_value` for the Error to be thrown.

Restituisce `napi_ok` se l'API ha esito positivo.

This API throws the JavaScript Error provided.

#### napi_throw_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_throw_error(napi_env env,
                                         const char* code,
                                         const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: C string representing the text to be associated with the error.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript Error con il testo fornito.

#### napi_throw_type_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_throw_type_error(napi_env env,
                                              const char* code,
                                              const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: C string representing the text to be associated with the error.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript TypeError con il testo fornito.

#### napi_throw_range_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_throw_range_error(napi_env env,
                                               const char* code,
                                               const char* msg);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Error code opzionale da impostare sull'errore.
- `[in] msg`: C string representing the text to be associated with the error.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API lancia un JavaScript RangeError con il testo fornito.

#### napi_is_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_is_error(napi_env env,
                                      napi_value value,
                                      bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] msg`: Il `napi_value` da verificare.
- `[out] result`: Boolean value that is set to true if `napi_value` represents an error, false otherwise.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API richiede un `napi_value` per verificare se rappresenta un error object.

#### napi_create_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_create_error(napi_env env,
                                          napi_value code,
                                          napi_value msg,
                                          napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value that references a JavaScript String to be used as the message for the Error.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript Error con il testo fornito.

#### napi_create_type_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_create_type_error(napi_env env,
                                               napi_value code,
                                               napi_value msg,
                                               napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value that references a JavaScript String to be used as the message for the Error.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript TypeError con il testo fornito.

#### napi_create_range_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_create_range_error(napi_env env,
                                                napi_value code,
                                                const char* msg,
                                                napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value that references a JavaScript String to be used as the message for the Error.
- `[out] result`: `napi_value` che rappresenta l'errore creato.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un JavaScript RangeError con il testo fornito.

#### napi_get_and_clear_last_exception

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: L'eccezione se una è in sospeso, in caso contrario NULL.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce true se è in sospeso un'eccezione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_is_exception_pending

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: Valore booleano impostato su true se è in sospeso un'eccezione.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce true se è in sospeso un'eccezione.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_fatal_exception

<!-- YAML
added: v8.11.2
napiVersion: 3
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] err`: The error you want to pass to `uncaughtException`.

Trigger an `uncaughtException` in JavaScript. Useful if an async callback throws an exception with no way to recover.

### Fatal Errors

In the event of an unrecoverable error in a native module, a fatal error can be thrown to immediately terminate the process.

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

- `[in] location`: Posizione opzionale in cui si è verificato l'errore.
- `[in] location_len`: The length of the location in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[in] message`: Il messaggio associato all'errore.
- `[in] message_len`: The length of the message in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.

La funzione call non restituisce nulla, il processo verrà terminato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Object Lifetime management

As N-API calls are made, handles to objects in the heap for the underlying VM may be returned as `napi_values`. These handles must hold the objects 'live' until they are no longer required by the native code, otherwise the objects could be collected before the native code was finished using them.

As object handles are returned they are associated with a 'scope'. The lifespan for the default scope is tied to the lifespan of the native method call. The result is that, by default, handles remain valid and the objects associated with these handles will be held live for the lifespan of the native method call.

In many cases, however, it is necessary that the handles remain valid for either a shorter or longer lifespan than that of the native method. The sections which follow describe the N-API functions than can be used to change the handle lifespan from the default.

### Rendere la durata dell'handle più breve rispetto a quella del metodo nativo

It is often necessary to make the lifespan of handles shorter than the lifespan of a native method. For example, consider a native method that has a loop which iterates through the elements in a large array:

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

This would result in a large number of handles being created, consuming substantial resources. In addition, even though the native code could only use the most recent handle, all of the associated objects would also be kept alive since they all share the same scope.

To handle this case, N-API provides the ability to establish a new 'scope' to which newly created handles will be associated. Once those handles are no longer required, the scope can be 'closed' and any handles associated with the scope are invalidated. The methods available to open/close scopes are [`napi_open_handle_scope`][] and [`napi_close_handle_scope`][].

N-API supporta solo una singola gerarchia nidificata di scopes. There is only one active scope at any time, and all new handles will be associated with that scope while it is active. Scopes must be closed in the reverse order from which they are opened. In addition, all scopes created within a native method must be closed before returning from that method.

Taking the earlier example, adding calls to [`napi_open_handle_scope`][] and [`napi_close_handle_scope`][] would ensure that at most a single handle is valid throughout the execution of the loop:

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

When nesting scopes, there are cases where a handle from an inner scope needs to live beyond the lifespan of that scope. N-API supports an 'escapable scope' in order to support this case. An escapable scope allows one handle to be 'promoted' so that it 'escapes' the current scope and the lifespan of the handle changes from the current scope to that of the outer scope.

The methods available to open/close escapable scopes are [`napi_open_escapable_handle_scope`][] and [`napi_close_escapable_handle_scope`][].

The request to promote a handle is made through [`napi_escape_handle`][] which can only be called once.

#### napi_open_handle_scope

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API apre un nuovo scope.

#### napi_close_handle_scope

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Scopes must be closed in the reverse order from which they were created.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_open_escapable_handle_scope

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status
    napi_open_escapable_handle_scope(napi_env env,
                                     napi_handle_scope* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta il nuovo scope.

Restituisce `napi_ok` se l'API ha esito positivo.

This API open a new scope from which one object can be promoted to the outer scope.

#### napi_close_escapable_handle_scope

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status
    napi_close_escapable_handle_scope(napi_env env,
                                      napi_handle_scope scope);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope che dev'essere chiuso.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API chiude lo scope passato. Scopes must be closed in the reverse order from which they were created.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: `napi_value` che rappresenta lo scope corrente.
- `[in] escapee`: `napi_value` representing the JavaScript Object to be escaped.
- `[out] result`: `napi_value` representing the handle to the escaped Object in the outer scope.

Restituisce `napi_ok` se l'API ha esito positivo.

This API promotes the handle to the JavaScript object so that it is valid for the lifetime of the outer scope. Può essere chiamato solo una volta per ogni scope. Se viene chiamato più di una volta, verrà restituito un errore.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

### Reference ad objects con una durata superiore a quella del metodo nativo

In some cases an addon will need to be able to create and reference objects with a lifespan longer than that of a single native method invocation. For example, to create a constructor and later use that constructor in a request to creates instances, it must be possible to reference the constructor object across many different instance creation requests. This would not be possible with a normal handle returned as a `napi_value` as described in the earlier section. The lifespan of a normal handle is managed by scopes and all scopes must be closed before the end of a native method.

N-API fornisce metodi per creare reference persistenti ad un object. Each persistent reference has an associated count with a value of 0 or higher. The count determines if the reference will keep the corresponding object live. References with a count of 0 do not prevent the object from being collected and are often called 'weak' references. Any count greater than 0 will prevent the object from being collected.

I reference possono essere creati con un reference count iniziale. The count can then be modified through [`napi_reference_ref`][] and [`napi_reference_unref`][]. If an object is collected while the count for a reference is 0, all subsequent calls to get the object associated with the reference [`napi_get_reference_value`][] will return NULL for the returned `napi_value`. An attempt to call [`napi_reference_ref`][] for a reference whose object has been collected will result in an error.

I reference devono essere cancellati una volta che non sono più richiesti dall'addon. When a reference is deleted it will no longer prevent the corresponding object from being collected. Failure to delete a persistent reference will result in a 'memory leak' with both the native memory for the persistent reference and the corresponding object on the heap being retained forever.

There can be multiple persistent references created which refer to the same object, each of which will either keep the object live or not based on its individual count.

#### napi_create_reference

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_create_reference(napi_env env,
                                              napi_value value,
                                              int initial_refcount,
                                              napi_ref* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing the Object to which we want a reference.
- `[in] initial_refcount`: Reference count iniziale per il nuovo reference.
- `[out] result`: `napi_ref` che punta al nuovo reference.

Restituisce `napi_ok` se l'API ha esito positivo.

This API create a new reference with the specified reference count to the Object passed in.

#### napi_delete_reference

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` da cancellare.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API cancella il reference passato.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

#### napi_reference_ref

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_reference_ref(napi_env env,
                                           napi_ref ref,
                                           int* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale verrà incrementato il reference count.
- `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

This API increments the reference count for the reference passed in and returns the resulting reference count.

#### napi_reference_unref

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_reference_unref(napi_env env,
                                             napi_ref ref,
                                             int* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` per il quale verrà decrementato il reference count.
- `[out] result`: Il nuovo reference count.

Restituisce `napi_ok` se l'API ha esito positivo.

This API decrements the reference count for the reference passed in and returns the resulting reference count.

#### napi_get_reference_value

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
NODE_EXTERN napi_status napi_get_reference_value(napi_env env,
                                                 napi_ref ref,
                                                 napi_value* result);
```

the `napi_value passed` in or out of these methods is a handle to the object to which the reference is related.

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] ref`: `napi_ref` for which we requesting the corresponding Object.
- `[out] result`: The `napi_value` for the Object referenced by the `napi_ref`.

Restituisce `napi_ok` se l'API ha esito positivo.

If still valid, this API returns the `napi_value` representing the JavaScript Object associated with the `napi_ref`. Otherwise, result will be NULL.

### Cleanup on exit of the current Node.js instance

While a Node.js process typically releases all its resources when exiting, embedders of Node.js, or future Worker support, may require addons to register clean-up hooks that will be run once the current Node.js instance exits.

N-API provides functions for registering and un-registering such callbacks. When those callbacks are run, all resources that are being held by the addon should be freed up.

#### napi_add_env_cleanup_hook

<!-- YAML
added: v8.12.0
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
added: v8.12.0
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

N-API modules are registered in a manner similar to other modules except that instead of using the `NODE_MODULE` macro the following is used:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

La prossima differenza è la dicitura per il metodo `Init`. For a N-API module it is as follows:

```C
napi_value Init(napi_env env, napi_value exports);
```

Il valore restituito da `Init` viene considerato come `exports` object per il modulo. The `Init` method is passed an empty object via the `exports` parameter as a convenience. If `Init` returns NULL, the parameter passed as `exports` is exported by the module. N-API modules cannot modify the `module` object but can specify anything as the `exports` property of the module.

For example, to add the method `hello` as a function so that it can be called as a method provided by the addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor desc =
    {"hello", Method, 0, 0, 0, napi_default, 0};
  if (status != napi_ok) return NULL;
  status = napi_define_properties(env, exports, 1, &desc);
  if (status != napi_ok) return NULL;
  return exports;
}
```

For example, to set a function to be returned by the `require()` for the addon:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_value method;
  napi_status status;
  status = napi_create_function(env, "exports", NAPI_AUTO_LENGTH, Method, NULL, &method);
  if (status != napi_ok) return NULL;
  return method;
}
```

For example, to define a class so that new instances can be created (often used with [Object Wrap](#n_api_object_wrap)):

```C
// NOTE: partial example, not all referenced code is included
napi_value Init(napi_env env, napi_value exports) {
  napi_status status;
  napi_property_descriptor properties[] = {
    { "value", NULL, GetValue, SetValue, 0, napi_default, 0 },
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

For more details on setting properties on objects, see the section on [Working with JavaScript Properties](#n_api_working_with_javascript_properties).

For more details on building addon modules in general, refer to the existing API

## Lavorare con i valori JavaScript

N-API espone un set di API per creare tutti i tipi di valori JavaScript. Some of these types are documented under [Section 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Fondamentalmente, queste API vengono utilizzate per eseguire una delle seguenti operazioni:

1. Creare un nuovo JavaScript object
2. Convertire da un tipo C primitivo ad un valore N-API
3. Converti da un valore N-API ad un tipo C primitivo
4. Ottenere istanze globali tra cui `undefined` e `null`

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un un valore JavaScript accetta un `napi_value`. In alcuni casi, l'API controlla il tipo del `napi_value` in anticipo. However, for better performance, it's better for the caller to make sure that the `napi_value` in question is of the JavaScript type expected by the API.

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
} napi_valuetype;
```

Descrive il tipo di `napi_value`. This generally corresponds to the types described in [Section 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) of the ECMAScript Language Specification. In addition to types in that section, `napi_valuetype` can also represent Functions and Objects with external data.

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
} napi_typedarray_type;
```

Questo rappresenta il datatype scalare binario sottostante di TypedArray. Elements of this enum correspond to [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

### Funzioni per la creazione di Objects

#### napi_create_array

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[out] result`: A `napi_value` representing a JavaScript Array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript Array. JavaScript arrays are described in [Section 22.1](https://tc39.github.io/ecma262/#sec-array-objects) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: The initial length of the Array.
- `[out] result`: A `napi_value` representing a JavaScript Array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un tipo JavaScript Array. La proprietà della lunghezza dell'Array è impostata sul parametro della lunghezza passata/approvata. However, the underlying buffer is not guaranteed to be pre-allocated by the VM when the array is created - that behavior is left to the underlying VM implementation. If the buffer must be a contiguous block of memory that can be directly read and/or written via C, consider using [`napi_create_external_arraybuffer`][].

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: La lunghezza in bytes dell'array buffer da creare.
- `[out] data`: Pointer to the underlying byte buffer of the ArrayBuffer.
- `[out] result`: A `napi_value` representing a JavaScript ArrayBuffer.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript ArrayBuffer. Gli ArrayBuffer sono usati per rappresentare i buffers di dati binari a lunghezza fissa. They are normally used as a backing-buffer for TypedArray objects. The ArrayBuffer allocated will have an underlying byte buffer whose size is determined by the `length` parameter that's passed in. The underlying buffer is optionally returned back to the caller in case the caller wants to directly manipulate the buffer. This buffer can only be written to directly from native code. To write to this buffer from JavaScript, a typed array or DataView object would need to be created.

JavaScript ArrayBuffer objects are described in [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] size`: Dimensione in bytes del buffer sottostante.
- `[out] data`: Puntatore Raw al buffer sottostante.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un `node::Buffer` object. While this is still a fully-supported data structure, in most cases using a TypedArray will suffice.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] size`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
- `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
- `[out] result_data`: Pointer to the new Buffer's underlying data buffer.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API allocates a `node::Buffer` object and initializes it with data copied from the passed-in buffer. While this is still a fully-supported data structure, in most cases using a TypedArray will suffice.

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

- `[in] env`: L'ambiente in cui viene invocata l'APi.
- `[in] data`: Puntatore Raw ai dati esterni.
- `[in] finalize_cb`: Optional callback to call when the external value is being collected.
- `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
- `[out] result`: Un `napi_value` che rappresenta un valore esterno.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un valore JavaScript con dati esterni associati ad esso. This is used to pass external data through JavaScript code, so it can be retrieved later by native code. The API allows the caller to pass in a finalize callback, in case the underlying native resource needs to be cleaned up when the external JavaScript value gets collected.

*Note*: The created value is not an object, and therefore does not support additional properties. It is considered a distinct value type: calling `napi_typeof()` with an external value yields `napi_external`.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] external_data`: Pointer to the underlying byte buffer of the ArrayBuffer.
- `[in] byte_length`: La lunghezza in bytes del buffer sottostante.
- `[in] finalize_cb`: Optional callback to call when the ArrayBuffer is being collected.
- `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
- `[out] result`: A `napi_value` representing a JavaScript ArrayBuffer.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restuisce un valore N-API corrispondente ad un JavaScript ArrayBuffer. The underlying byte buffer of the ArrayBuffer is externally allocated and managed. The caller must ensure that the byte buffer remains valid until the finalize callback is called.

JavaScript ArrayBuffers are described in [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
- `[in] data`: Puntatore Raw al buffer sottostante da cui poter copiare.
- `[in] finalize_cb`: Optional callback to call when the ArrayBuffer is being collected.
- `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
- `[out] result`: Un `napi_value` che rappresenta un `node::Buffer`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API allocates a `node::Buffer` object and initializes it with data backed by the passed in buffer. While this is still a fully-supported data structure, in most cases using a TypedArray will suffice.

*Note*: For Node.js >=4 `Buffers` are Uint8Arrays.

#### napi_create_function

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
                                 napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8name`: A string representing the name of the function encoded as UTF8.
- `[in] length`: The length of the utf8name in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[in] cb`: A function pointer to the native function to be invoked when the created function is invoked from JavaScript.
- `[in] data`: Optional arbitrary context data to be passed into the native function when it is invoked.
- `[out] result`: Un `napi_value` che rappresenta una funzione JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce un valore N-API corrispondente ad un JavaScript Function object. È usata per avvolgere(wrap) le funzioni native in modo che possano essere invocate da JavaScript.

JavaScript Functions are described in [Section 19.2](https://tc39.github.io/ecma262/#sec-function-objects) of the ECMAScript Language Specification.

#### napi_create_object

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: A `napi_value` representing a JavaScript Object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un JavaScript Object predefinito. È l'equivalente di fare `new Object()` in JavaScript.

The JavaScript Object type is described in [Section 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] description`: Optional napi_value which refers to a JavaScript String to be set as the description for the symbol.
- `[out] result`: A `napi_value` representing a JavaScript Symbol.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript Symbol object from a UTF8-encoded C string

The JavaScript Symbol type is described in [Section 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] type`: Scalar datatype of the elements within the TypedArray.
- `[in] length`: Number of elements in the TypedArray.
- `[in] arraybuffer`: ArrayBuffer underlying the typed array.
- `[in] byte_offset`: The byte offset within the ArrayBuffer from which to start projecting the TypedArray.
- `[out] result`: A `napi_value` representing a JavaScript TypedArray.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript TypedArray object over an existing ArrayBuffer. TypedArray objects provide an array-like view over an underlying data buffer where each element has the same underlying binary scalar datatype.

It's required that (length * size_of_element) + byte_offset should be <= the size in bytes of the array passed in. If not, a RangeError exception is raised.

JavaScript TypedArray Objects are described in [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] length`: Number of elements in the DataView.
- `[in] arraybuffer`: ArrayBuffer underlying the DataView.
- `[in] byte_offset`: The byte offset within the ArrayBuffer from which to start projecting the DataView.
- `[out] result`: A `napi_value` representing a JavaScript DataView.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript DataView su un ArrayBuffer esistente. DataView objects provide an array-like view over an underlying data buffer, but one which allows items of different size and type in the ArrayBuffer.

It is required that `byte_length + byte_offset` is less than or equal to the size in bytes of the array passed in. If not, a RangeError exception is raised.

JavaScript DataView Objects are described in [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) of the ECMAScript Language Specification.

### Funzioni per la conversione da tipi C a N-API

#### napi_create_int32

<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore integer da rappresentare in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to convert from the C `int32_t` type to the JavaScript Number type.

The JavaScript Number type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_uint32

<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore unsigned integer da rappresentare in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to convert from the C `uint32_t` type to the JavaScript Number type.

The JavaScript Number type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_int64

<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore integer da rappresentare in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to convert from the C `int64_t` type to the JavaScript Number type.

The JavaScript Number type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification. Note the complete range of `int64_t` cannot be represented with full precision in JavaScript. Integer values outside the range of [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) will lose precision.

#### napi_create_double

<!-- YAML
added: v8.4.0
napiVersion: 1
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Valore double-precision(doppia precisione) da rappresentare in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to convert from the C `double` type to the JavaScript Number type.

The JavaScript Number type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer representing a ISO-8859-1-encoded string.
- `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[out] result`: A `napi_value` representing a JavaScript String.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript String object from a ISO-8859-1-encoded C string.

The JavaScript String type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica UTF16-LE.
- `[in] length`: The length of the string in two-byte code units, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[out] result`: A `napi_value` representing a JavaScript String.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API crea un JavaScript String object da una stringa C con codifica UTF16-LE

The JavaScript String type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] str`: Character buffer che rappresenta una stringa con codifica UTF8.
- `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[out] result`: A `napi_value` representing a JavaScript String.

Restituisce `napi_ok` se l'API ha esito positivo.

This API creates a JavaScript String object from a UTF8-encoded C string

The JavaScript String type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing the JavaScript Array whose length is being queried.
- `[out] result`: `uint32` che rappresenta la lunghezza dell'array.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce la lunghezza di un'array.

Array length is described in [Section 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) of the ECMAScript Language Specification.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] arraybuffer`: `napi_value` representing the ArrayBuffer being queried.
- `[out] data`: The underlying data buffer of the ArrayBuffer.
- `[out] byte_length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to retrieve the underlying data buffer of an ArrayBuffer and its length.

*WARNING*: Prestare attenzione durante l'utilizzo di quest'API. The lifetime of the underlying data buffer is managed by the ArrayBuffer even after it's returned. A possible safe way to use this API is in conjunction with [`napi_create_reference`][], which can be used to guarantee control over the lifetime of the ArrayBuffer. It's also safe to use the returned data buffer within the same callback as long as there are no calls to other APIs that might trigger a GC.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta il `node::Buffer` interrogato.
- `[out] data`: Il data buffer sottostante al `node::Buffer`.
- `[out] length`: Lunghezza in bytes del data buffer sottostante.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to retrieve the underlying data buffer of a `node::Buffer` and it's length.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: `napi_value` representing JavaScript Object whose prototype to return. This returns the equivalent of `Object.getPrototypeOf` (which is not the same as the function's `prototype` property).
- `[out] result`: `napi_value` che rappresenta il prototipo dell'object dato.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] typedarray`: `napi_value` representing the TypedArray whose properties to query.
- `[out] type`: Scalar datatype of the elements within the TypedArray.
- `[out] length`: Number of elements in the TypedArray.
- `[out] data`: Il data buffer sottostante l'array tipizzato (typed array).
- `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the TypedArray.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un array tipizzato (typed array).

*Warning*: Use caution while using this API since the underlying data buffer is managed by the VM

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] dataview`: `napi_value` representing the DataView whose properties to query.
- `[out] byte_length`: Number of bytes in the DataView.
- `[out] data`: The data buffer underlying the DataView.
- `[out] arraybuffer`: ArrayBuffer underlying the DataView.
- `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the DataView.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce varie proprietà di un DataView.

#### napi_get_value_bool

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing JavaScript Boolean.
- `[out] result`: C boolean primitive equivalent of the given JavaScript Boolean.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-boolean `napi_value` is passed in it returns `napi_boolean_expected`.

This API returns the C boolean primitive equivalent of the given JavaScript Boolean.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing JavaScript Number.
- `[out] result`: C double primitive equivalent of the given JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-number `napi_value` is passed in it returns `napi_number_expected`.

This API returns the C double primitive equivalent of the given JavaScript Number.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta un valore esterno di JavaScript.
- `[out] result`: Puntatore ai dati che hanno subito il wrapping da parte del valore esterno di JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-external `napi_value` is passed in it returns `napi_invalid_arg`.

This API retrieves the external data pointer that was previously passed to `napi_create_external()`.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing JavaScript Number.
- `[out] result`: C int32 primitive equivalent of the given JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-number `napi_value` is passed in `napi_number_expected`.

This API returns the C int32 primitive equivalent of the given JavaScript Number.

If the number exceeds the range of the 32 bit integer, then the result is truncated to the equivalent of the bottom 32 bits. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

Non-finite number values (NaN, positive infinity, or negative infinity) set the result to zero.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing JavaScript Number.
- `[out] result`: C int64 primitive equivalent of the given JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-number `napi_value` is passed in it returns `napi_number_expected`.

This API returns the C int64 primitive equivalent of the given JavaScript Number.

Number values outside the range of [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) will lose precision.

Non-finite number values (NaN, positive infinity, or negative infinity) set the result to zero.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica ISO-8859-1. If NULL is passed in, the length of the string (in bytes) is returned.
- `[in] bufsize`: Dimensione del buffer di destinazione. When this value is insufficient, the returned string will be truncated.
- `[out] result`: Number of bytes copied into the buffer, excluding the null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-String `napi_value` is passed in it returns `napi_string_expected`.

This API returns the ISO-8859-1-encoded string corresponding the value passed in.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF8. If NULL is passed in, the length of the string (in bytes) is returned.
- `[in] bufsize`: Dimensione del buffer di destinazione. When this value is insufficient, the returned string will be truncated.
- `[out] result`: Number of bytes copied into the buffer, excluding the null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-String `napi_value` is passed in it returns `napi_string_expected`.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` che rappresenta una stringa JavaScript.
- `[in] buf`: Buffer nel quale scrivere la stringa con codifica UTF16-LE. If NULL is passed in, the length of the string (in 2-byte code units) is returned.
- `[in] bufsize`: Dimensione del buffer di destinazione. When this value is insufficient, the returned string will be truncated.
- `[out] result`: Number of 2-byte code units copied into the buffer, excluding the null terminator.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-String `napi_value` is passed in it returns `napi_string_expected`.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: `napi_value` representing JavaScript Number.
- `[out] result`: C primitive equivalent of the given `napi_value` as a `uint32_t`.

Restituisce `napi_ok` se l'API ha esito positivo. If a non-number `napi_value` is passed in it returns `napi_number_expected`.

This API returns the C primitive equivalent of the given `napi_value` as a `uint32_t`.

### Funzioni per ottenere istanze globali

#### napi_get_boolean

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore del booleano da recuperare.
- `[out] result`: `napi_value` representing JavaScript Boolean singleton to retrieve.

Restituisce `napi_ok` se l'API ha esito positivo.

This API is used to return the JavaScript singleton object that is used to represent the given boolean value

#### napi_get_global

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` representing JavaScript Global Object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the global Object.

#### napi_get_null

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` representing JavaScript Null Object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the null Object.

#### napi_get_undefined

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: `napi_value` che rappresenta un valore JavaScript Undefined.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce l'Undefined object.

## Lavorare con i valori JavaScript - Abstract Operations

N-API exposes a set of APIs to perform some abstract operations on JavaScript values. Some of these operations are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Queste API supportano una delle seguenti operations:

1. Coerce JavaScript values to specific JavaScript types (such as Number or String)
2. Controllare il tipo di un valore JavaScript
3. Verificare l'uguaglianza tra due valori JavaScript

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` representing the coerced JavaScript Boolean.

Restituisce `napi_ok` se l'API ha esito positivo.

This API implements the abstract operation ToBoolean as defined in [Section 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) of the ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'Object passato.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` representing the coerced JavaScript Number.

Restituisce `napi_ok` se l'API ha esito positivo.

This API implements the abstract operation ToNumber as defined in [Section 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) of the ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'Object passato.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` representing the coerced JavaScript Object.

Restituisce `napi_ok` se l'API ha esito positivo.

This API implements the abstract operation ToObject as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) of the ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'Object passato.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da forzare.
- `[out] result`: `napi_value` representing the coerced JavaScript String.

Restituisce `napi_ok` se l'API ha esito positivo.

This API implements the abstract operation ToString as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) of the ECMAScript Language Specification. Quest'API può essere rientrante se i getters sono definiti nell'Object passato.

### napi_typeof

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript il cui tipo è da interrogare.
- `[out] result`: Il tipo del valore JavaScript.

Restituisce `napi_ok` se l'API ha esito positivo.

- `napi_invalid_arg` if the type of `value` is not a known ECMAScript type and `value` is not an External value.

This API represents behavior similar to invoking the `typeof` Operator on the object as defined in [Section 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) of the ECMAScript Language Specification. Tuttavia, ha il supporto per rilevare un valore esterno. Se `value` ha un tipo che non è valido, viene restituito un errore.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] object`: Il valore JavaScript da verificare.
- `[in] constructor`: The JavaScript function object of the constructor function to check against.
- `[out] result`: Boolean that is set to true if `object instanceof constructor` is true.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Se l'object fornito è un array.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Whether the given object is an ArrayBuffer.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato è un array buffer.

### napi_is_buffer

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Whether the given `napi_value` represents a `node::Buffer` object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato è un buffer.

### napi_is_error

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Whether the given `napi_value` represents an Error object.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato è un Error.

### napi_is_typedarray

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Whether the given `napi_value` represents a TypedArray.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato è un array tipizzato (typed array).

### napi_is_dataview

<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] value`: Il valore JavaScript da verificare.
- `[out] result`: Whether the given `napi_value` represents a DataView.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato è un DataView.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] lhs`: Il valore JavaScript da verificare.
- `[in] rhs`: Il valore JavaScript con il quale verificarlo.
- `[out] result`: Se i due `napi_value` objects sono uguali.

Restituisce `napi_ok` se l'API ha esito positivo.

This API represents the invocation of the Strict Equality algorithm as defined in [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) of the ECMAScript Language Specification.

## Lavorare con le Proprietà JavaScript

N-API exposes a set of APIs to get and set properties on JavaScript objects. Some of these types are documented under [Section 7](https://tc39.github.io/ecma262/#sec-operations-on-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Le proprietà in JavaScript sono rappresentate come una tupla di una key ed un valore. Fundamentally, all property keys in N-API can be represented in one of the following forms:

- Named: una semplice stringa con codifica UTF8
- Integer-Indexed: un valore di indice rappresentato tramite `uint32_t`
- JavaScript value: questi sono rappresentati in N-API tramite `napi_value`. This can be a `napi_value` representing a String, Number, or Symbol.

I valori N-API sono rappresentati dal tipo `napi_value`. Qualsiasi chiamata N-API che richiede un un valore JavaScript accetta un `napi_value`. However, it's the caller's responsibility to make sure that the `napi_value` in question is of the JavaScript type expected by the API.

The APIs documented in this section provide a simple interface to get and set properties on arbitrary JavaScript objects represented by `napi_value`.

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

Le proprietà indicizzate possono essere impostate in modo simile. Consider the following JavaScript snippet:

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

Finally, multiple properties can also be defined on an object for performance reasons. Considera il seguente codice JavaScript:

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
  { "foo", NULL, 0, 0, 0, fooValue, napi_default, 0 },
  { "bar", NULL, 0, 0, 0, barValue, napi_default, 0 }
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

`napi_property_attributes` are flags used to control the behavior of properties set on a JavaScript object. Other than `napi_static` they correspond to the attributes listed in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/). Possono essere uno o più dei seguenti bitflags:

- `napi_default` - Used to indicate that no explicit attributes are set on the given property. By default, a property is read only, not enumerable and not configurable.
- `napi_writable` - Utilizzato per indicare che una determinata proprietà è scrivibile.
- `napi_enumerable` - Utilizzato per indicare che una determinata proprietà è enumerabile.
- `napi_configurable` - Used to indicate that a given property is configurable, as defined in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).
- `napi_static` - Used to indicate that the property will be defined as a static property on a class as opposed to an instance property, which is the default. Questo è usato solo tramite [`napi_define_class`][]. It is ignored by `napi_define_properties`.

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

- `utf8name`: Optional String describing the key for the property, encoded as UTF8. One of `utf8name` or `name` must be provided for the property.
- `name`: Optional napi_value that points to a JavaScript string or symbol to be used as the key for the property. One of `utf8name` or `name` must be provided for the property.
- `value`: The value that's retrieved by a get access of the property if the property is a data property. If this is passed in, set `getter`, `setter`, `method` and `data` to `NULL` (since these members won't be used).
- `getter`: Una funzione da chiamare quando viene eseguito un get access della proprietà. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is accessed from JavaScript code (or if a get on the property is performed using a N-API call).
- `setter`: Una funzione da chiamare quando viene eseguito un set access della proprietà. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is set from JavaScript code (or if a set on the property is performed using a N-API call).
- `method`: Set this to make the property descriptor object's `value` property to be a JavaScript function represented by `method`. If this is passed in, set `value`, `getter` and `setter` to `NULL` (since these members won't be used).
- `attributes`: Gli attributi associati alla particolare proprietà. Vedi [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: The callback data passed into `method`, `getter` and `setter` if this function is invoked.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare le proprietà.
- `[out] result`: A `napi_value` representing an array of JavaScript values that represent the property names of the object. The API can be used to iterate over `result` using [`napi_get_array_length`][] and [`napi_get_element`][].

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the array of properties for the Object passed in

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object su cui impostare la proprietà.
- `[in] key`: Il nome della proprietà da impostare.
- `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

This API set a property on the Object passed in.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare la proprietà.
- `[in] key`: Il nome della proprietà da recuperare.
- `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API ottiene la proprietà richiesta dall'Object passato/approvato.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] key`: Il nome della proprietà di cui bisogna verificare l'esistenza.
- `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato/approvato ha la proprietà nominata.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] key`: Il nome della proprietà da cancellare.
- `[out] result`: Se la cancellazione della proprietà è avvenuta con successo o meno. `result` can optionally be ignored by passing `NULL`.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] key`: Il nome della own property di cui bisogna verificare l'esistenza.
- `[out] result`: Se l'own property esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API controlla se l'Object passato ha la own property nominata. `key` must be a string or a Symbol, or an error will be thrown. N-API will not perform any conversion between data types.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object su cui impostare la proprietà.
- `[in] utf8Name`: Il nome della proprietà da impostare.
- `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

This method is equivalent to calling [`napi_set_property`][] with a `napi_value` created from the string passed in as `utf8Name`

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare la proprietà.
- `[in] utf8Name`: Il nome della proprietà da ottenere.
- `[out] result`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

This method is equivalent to calling [`napi_get_property`][] with a `napi_value` created from the string passed in as `utf8Name`

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] utf8Name`: Il nome della proprietà di cui bisogna verificare l'esistenza.
- `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

This method is equivalent to calling [`napi_has_property`][] with a `napi_value` created from the string passed in as `utf8Name`

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui impostare le proprietà.
- `[in] index`: L'index della proprietà da impostare.
- `[in] value`: Il valore della proprietà.

Restituisce `napi_ok` se l'API ha esito positivo.

Questa API imposta un elemento Object passato/approvato.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare la proprietà.
- `[in] index`: L'index della proprietà da ottenere.
- `[out] result`: Il valore della proprietà.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] index`: L'index della proprietà di cui bisogna verificare l'esistenza.
- `[out] result`: Se la proprietà esiste nell'object oppure no.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns if the Object passed in has an element at the requested index.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da interrogare.
- `[in] index`: L'index della proprietà da cancellare.
- `[out] result`: Se la cancellazione dell'elemento è avvenuta con successo o meno. `result` can optionally be ignored by passing `NULL`.

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

- `[in] env`: L'ambiente in cui viene invocata la N-API call.
- `[in] object`: L'object da cui recuperare le proprietà.
- `[in] property_count`: Il numero di elementi nell'array `properties`.
- `[in] properties`: L'array dei property descriptors (descrittori della proprietà).

Restituisce `napi_ok` se l'API ha esito positivo.

This method allows the efficient definition of multiple properties on a given object. The properties are defined using property descriptors (See [`napi_property_descriptor`][]). Given an array of such property descriptors, this API will set the properties on the object one at a time, as defined by DefineOwnProperty (described in [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) of the ECMA262 specification).

## Lavorare con le funzioni JavaScript

N-API provides a set of APIs that allow JavaScript code to call back into native code. N-API APIs that support calling back into native code take in a callback functions represented by the `napi_callback` type. When the JavaScript VM calls back to native code, the `napi_callback` function provided is invoked. The APIs documented in this section allow the callback function to do the following:

- Ottenere informazioni sul contesto in cui è stato invocato il callback.
- Ottenere gli argomenti passati nel callback.
- Restituire un `napi_value` indietro dal callback.

Additionally, N-API provides a set of functions which allow calling JavaScript functions from native code. One can either call a function like a regular JavaScript function call, or as a constructor function.

### napi_call_function

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_call_function(napi_env env,
                               napi_value recv,
                               napi_value func,
                               int argc,
                               const napi_value* argv,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] recv`: L'object `this` è passato alla funzione chiamata.
- `[in] func`: `napi_value` representing the JavaScript function to be invoked.
- `[in] argc`: Il count degli elementi nell'array `argv`.
- `[in] argv`: Array of `napi_values` representing JavaScript values passed in as arguments to the function.
- `[out] result`: `napi_value` che rappresenta il JavaScript object restituito.

Restituisce `napi_ok` se l'API ha esito positivo.

This method allows a JavaScript function object to be called from a native add-on. This is the primary mechanism of calling back *from* the add-on's native code *into* JavaScript. For the special case of calling into JavaScript after an async operation, see [`napi_make_callback`][].

Un esempio di caso d'utilizzo potrebbe essere il seguente. Consider the following JavaScript snippet:

```js
function AddTwo(num) {
  return num + 2;
}
```

Then, the above function can be invoked from a native add-on using the following code:

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
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8Name`: Il nome della funzione codificata come UTF8. This is visible within JavaScript as the new function object's `name` property.
- `[in] cb`: The native function which should be called when this function object is invoked.
- `[in] data`: Data context fornito dall'utente. This will be passed back into the function when invoked later.
- `[out] result`: `napi_value` representing the JavaScript function object for the newly created function.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API consente ad un add-on author di creare un function object nel codice nativo. This is the primary mechanism to allow calling *into* the add-on's native code *from* JavaScript.

*Note*: The newly created function is not automatically visible from script after this call. Instead, a property must be explicitly set on any object that is visible to JavaScript, in order for the function to be accessible from script.

In order to expose a function as part of the add-on's module exports, set the newly created function on the exports object. Un modulo di esempio potrebbe essere il seguente:

```C
napi_value SayHello(napi_env env, napi_callback_info info) {
  printf("Hello\n");
  return NULL;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_status status;

  napi_value fn;
  status = napi_create_function(env, NULL, 0, SayHello, nullptr, &fn);
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

*Note*: The string passed to require is not necessarily the name passed into `NAPI_MODULE` in the earlier snippet but the name of the target in `binding.gyp` responsible for creating the `.node` file.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] cbinfo`: Le callback info passate nella funzione callback.
- `[in-out] argc`: Specifies the size of the provided `argv` array and receives the actual count of arguments.
- `[out] argv`: Buffer to which the `napi_value` representing the arguments are copied. If there are more arguments than the provided count, only the requested number of arguments are copied. If there are fewer arguments provided than claimed, the rest of `argv` is filled with `napi_value` values that represent `undefined`.
- `[out] this`: Riceve l'argomento JavaScript `this` per la call.
- `[out] data`: Riceve il puntatore ai dati per il callback.

Restituisce `napi_ok` se l'API ha esito positivo.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] cbinfo`: Le callback info passate nella funzione callback.
- `[out] result`: Il `new.target` della constructor call.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API restituisce il `new.target` della constructor call. If the current callback is not a constructor call, the result is `NULL`.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
- `[in] argc`: Il count degli elementi nell'array `argv`.
- `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the constructor.
- `[out] result`: `napi_value` representing the JavaScript object returned, which in this case is the constructed object.

This method is used to instantiate a new JavaScript value using a given `napi_value` that represents the constructor for the object. For example, consider the following snippet:

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

N-API offers a way to "wrap" C++ classes and instances so that the class constructor and methods can be called from JavaScript.

1. The [`napi_define_class`][] API defines a JavaScript class with constructor, static properties and methods, and instance properties and methods that correspond to the C++ class.
2. When JavaScript code invokes the constructor, the constructor callback uses [`napi_wrap`][] to wrap a new C++ instance in a JavaScript object, then returns the wrapper object.
3. When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` C++ function is invoked. For an instance callback, [`napi_unwrap`][] obtains the C++ instance that is the target of the call.

For wrapped objects it may be difficult to distinguish between a function called on a class prototype and a function called on an instance of a class. A common pattern used to address this problem is to save a persistent reference to the class constructor for later `instanceof` checks.

Ad esempio:

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] utf8name`: Name of the JavaScript constructor function; this is not required to be the same as the C++ class name, though it is recommended for clarity.
- `[in] length`: The length of the utf8name in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[in] constructor`: Callback function that handles constructing instances of the class. (This should be a static method on the class, not an actual C++ constructor function.)
- `[in] data`: Optional data to be passed to the constructor callback as the `data` property of the callback info.
- `[in] property_count`: Numero di elementi nell'argomento dell'array `properties`.
- `[in] properties`: Array of property descriptors describing static and instance data properties, accessors, and methods on the class See `napi_property_descriptor`.
- `[out] result`: A `napi_value` representing the constructor function for the class.

Restituisce `napi_ok` se l'API ha esito positivo.

Definisce una classe JavaScript che corrisponde ad una classe C++, includendo:

- A JavaScript constructor function that has the class name and invokes the provided C++ constructor callback.
- Properties on the constructor function corresponding to *static* data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
- Properties on the constructor function's `prototype` object corresponding to *non-static* data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

The C++ constructor callback should be a static method on the class that calls the actual class constructor, then wraps the new C++ instance in a JavaScript object, and returns the wrapper object. Vedi `napi_wrap()` per maggiori dettagli.

The JavaScript constructor function returned from [`napi_define_class`][] is often saved and used later, to construct new instances of the class from native code, and/or check whether provided values are instances of the class. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] js_object`: The JavaScript object that will be the wrapper for the native object. This object *must* have been created from the `prototype` of a constructor that was created using `napi_define_class()`.
- `[in] native_object`: The native instance that will be wrapped in the JavaScript object.
- `[in] finalize_cb`: Optional native callback that can be used to free the native instance when the JavaScript object is ready for garbage-collection.
- `[in] finalize_hint`: Optional contextual hint that is passed to the finalize callback.
- `[out] result`: Reference opzionale al wrapped object.

Restituisce `napi_ok` se l'API ha esito positivo.

Esegue il wrapping di un'istanza nativa in un JavaScript object. The native instance can be retrieved later using `napi_unwrap()`.

When JavaScript code invokes a constructor for a class that was defined using `napi_define_class()`, the `napi_callback` for the constructor is invoked. After constructing an instance of the native class, the callback must then call `napi_wrap()` to wrap the newly constructed instance in the already-created JavaScript object that is the `this` argument to the constructor callback. (That `this` object was created from the constructor function's `prototype`, so it already has definitions of all the instance properties and methods.)

Typically when wrapping a class instance, a finalize callback should be provided that simply deletes the native instance that is received as the `data` argument to the finalize callback.

The optional returned reference is initially a weak reference, meaning it has a reference count of 0. Typically this reference count would be incremented temporarily during async operations that require the instance to remain valid.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. (If it is deleted before then, then the finalize callback may never be invoked.) Therefore, when obtaining a reference a finalize callback is also required in order to enable correct proper of the reference.

*Note*: This API may modify the prototype chain of the wrapper object. Afterward, additional manipulation of the wrapper's prototype chain may cause `napi_unwrap()` to fail.

Chiamando napi_wrap() una seconda volta su di un object verrà restituito un errore. To associate another native instance with the object, use napi_remove_wrap() first.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] js_object`: L'object associato all'istanza nativa.
- `[out] result`: Puntatore all'istanza nativa che ha subito il wrapping.

Restituisce `napi_ok` se l'API ha esito positivo.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] js_object`: L'object associato all'istanza nativa.
- `[out] result`: Puntatore all'istanza nativa che ha subito il wrapping.

Restituisce `napi_ok` se l'API ha esito positivo.

Retrieves a native instance that was previously wrapped in the JavaScript object `js_object` using `napi_wrap()` and removes the wrapping, thereby restoring the JavaScript object's prototype chain. If a finalize callback was associated with the wrapping, it will no longer be called when the JavaScript object becomes garbage-collected.

## Semplici Operazioni Asincrone

Addon modules often need to leverage async helpers from libuv as part of their implementation. This allows them to schedule work to be executed asynchronously so that their methods can return in advance of the work being completed. This is important in order to allow them to avoid blocking overall execution of the Node.js application.

N-API provides an ABI-stable interface for these supporting functions which covers the most common asynchronous use cases.

N-API defines the `napi_work` structure which is used to manage asynchronous workers. Instances are created/deleted with [`napi_create_async_work`][] and [`napi_delete_async_work`][].

The `execute` and `complete` callbacks are functions that will be invoked when the executor is ready to execute and when it completes its task respectively. Queste funzioni implementano le seguenti interfacce:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

When these methods are invoked, the `data` parameter passed will be the addon-provided void* data that was passed into the `napi_create_async_work` call.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible async_hooks [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
- `[in] complete`: The native function which will be called when the asynchronous logic is completed or is cancelled. The given function is called from the main event loop thread.
- `[in] data`: Data context fornito dall'utente. This will be passed back into the execute and complete functions.
- `[out] result`: `napi_async_work*` which is the handle to the newly created async work.

Restituisce `napi_ok` se l'API ha esito positivo.

Quest'API alloca un work object che viene utilizzato per eseguire la logica in modo asincrono. It should be freed using [`napi_delete_async_work`][] once the work is no longer required.

`async_resource_name` dovrebbe essere una stringa null-terminated con codifica UTF-8.

*Note*: The `async_resource_name` identifier is provided by the user and should be representative of the type of async work being performed. It is also recommended to apply namespacing to the identifier, e.g. by including the module name. See the [`async_hooks` documentation][async_hooks `type`] for more information.

### napi_delete_async_work

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API requests that the previously allocated work be scheduled for execution.

### napi_cancel_async_work

<!-- YAML
added: v8.0.0
napiVersion: 1
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] work`: L'handle restituito dalla chiamata a `napi_create_async_work`.

Restituisce `napi_ok` se l'API ha esito positivo.

This API cancels queued work if it has not yet been started. If it has already started executing, it cannot be cancelled and `napi_generic_failure` will be returned. If successful, the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even if it has been successfully cancelled.

Quest'API può essere chiamata anche se è presente un'eccezione JavaScript in sospeso.

## Operazioni Asincrone Personalizzate

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[out] result`: L'async context inizializzato.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_context`: L'async context da distruggere.

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
napi_status napi_make_callback(napi_env env,
                               napi_async_context async_context,
                               napi_value recv,
                               napi_value func,
                               int argc,
                               const napi_value* argv,
                               napi_value* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
- `[in] recv`: L'object `this` è passato alla funzione chiamata.
- `[in] func`: `napi_value` representing the JavaScript function to be invoked.
- `[in] argc`: Il count degli elementi nell'array `argv`.
- `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
- `[out] result`: `napi_value` che rappresenta il JavaScript object restituito.

Restituisce `napi_ok` se l'API ha esito positivo.

This method allows a JavaScript function object to be called from a native add-on. Quest'API è simile a `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). It is a fairly simple wrapper around `node::MakeCallback`.

Note it is *not* necessary to use `napi_make_callback` from within a `napi_async_complete_callback`; in that situation the callback's async context has already been set up, so a direct call to `napi_call_function` is sufficient and appropriate. Use of the `napi_make_callback` function may be required when implementing custom async behavior that does not use `napi_create_async_work`.

### *napi_open_callback_scope*

<!-- YAML
added: v8.11.2
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_open_callback_scope(napi_env env,
                                                 napi_value resource_object,
                                                 napi_async_context context,
                                                 napi_callback_scope* result)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] resource_object`: An optional object associated with the async work that will be passed to possible async_hooks [`init` hooks][].
- `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
- `[out] result`: Lo scope appena creato.

There are cases (for example resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls. If there is no other script on the stack the [`napi_open_callback_scope`][] and [`napi_close_callback_scope`][] functions can be used to open/close the required scope.

### *napi_close_callback_scope*

<!-- YAML
added: v8.11.2
napiVersion: 3
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] scope`: Lo scope da chiudere.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] version`: A pointer to version information for Node itself.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] result`: La versione di N-API più recente supportata.

Restituisce `napi_ok` se l'API ha esito positivo.

This API returns the highest N-API version supported by the Node.js runtime. N-API is planned to be additive such that newer releases of Node.js may support additional API functions. In order to allow an addon to use a newer function when running with versions of Node.js that support it, while providing fallback behavior when running with Node.js versions that don't support it:

- Chiama `napi_get_version()` per determinare se l'API è disponibile.
- Se disponibile, carica in modo dinamico un puntatore alla funzione usando `uv_dlsym()`.
- Usa il puntatore caricato in modo dinamico per invocare la funzione.
- If the function is not available, provide an alternate implementation that does not use the function.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
- `[out] result`: Il valore regolato

Restituisce `napi_ok` se l'API ha esito positivo.

This function gives V8 an indication of the amount of externally allocated memory that is kept alive by JavaScript objects (i.e. a JavaScript object that points to its own memory allocated by a native module). Registering externally allocated memory will trigger global garbage collections more often than it would otherwise.

<!-- it's very convenient to have all the anchors indexed -->

<!--lint disable no-unused-definitions remark-lint-->

## Promises

N-API provides facilities for creating `Promise` objects as described in [Section 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) of the ECMA specification. It implements promises as a pair of objects. When a promise is created by `napi_create_promise()`, a "deferred" object is created and returned alongside the `Promise`. The deferred object is bound to the created `Promise` and is the only means to resolve or reject the `Promise` using `napi_resolve_deferred()` or `napi_reject_deferred()`. The deferred object that is created by `napi_create_promise()` is freed by `napi_resolve_deferred()` or `napi_reject_deferred()`. The `Promise` object may be returned to JavaScript where it can be used in the usual fashion.

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

The above function `do_something_asynchronous()` would perform its asynchronous action and then it would resolve or reject the deferred, thereby concluding the promise and freeing the deferred:

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] deferred`: A newly created deferred object which can later be passed to `napi_resolve_deferred()` or `napi_reject_deferred()` to resolve resp. reject the associated promise.
- `[out] promise`: Il JavaScript promise associato con il deferred object.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] deferred`: Il deferred object del quale bisogna risolvere il promise associato.
- `[in] resolution`: Il valore con cui risolvere il promise.

This API resolves a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to resolve JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] deferred`: Il deferred object del quale bisogna risolvere il promise associato.
- `[in] rejection`: Il valore con cui rifiutare il promise.

This API rejects a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to reject JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] promise`: Il promise da esaminare
- `[out] is_promise`: Flag indicating whether `promise` is a native promise object - that is, a promise object created by the underlying engine.

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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] script`: Una stringa JavaScript contenente lo script da eseguire.
- `[out] result`: Il valore risultante dell'aver eseguito lo script.

## libuv event loop

N-API provides a function for getting the current event loop associated with a specific `napi_env`.

### napi_get_uv_event_loop

<!-- YAML
added: v8.10.0
napiVersion: 2
-->

```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               uv_loop_t** loop);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[out] loop`: L'attuale istanza del libuv loop.

## Asynchronous Thread-safe Function Calls

> Stability: 1 - Experimental

JavaScript functions can normally only be called from a native addon's main thread. If an addon creates additional threads, then N-API functions that require a `napi_env`, `napi_value`, or `napi_ref` must not be called from those threads.

When an addon has additional threads and JavaScript functions need to be invoked based on the processing completed by those threads, those threads must communicate with the addon's main thread so that the main thread can invoke the JavaScript function on their behalf. The thread-safe function APIs provide an easy way to do this.

These APIs provide the type `napi_threadsafe_function` as well as APIs to create, destroy, and call objects of this type. `napi_create_threadsafe_function()` creates a persistent reference to a `napi_value` that holds a JavaScript function which can be called from multiple threads. The calls happen asynchronously. This means that values with which the JavaScript callback is to be called will be placed in a queue, and, for each value in the queue, a call will eventually be made to the JavaScript function.

Upon creation of a `napi_threadsafe_function` a `napi_finalize` callback can be provided. This callback will be invoked on the main thread when the thread-safe function is about to be destroyed. It receives the context and the finalize data given during construction, and provides an opportunity for cleaning up after the threads e.g. by calling `uv_thread_join()`. **It is important that, aside from the main loop thread, there be no threads left using the thread-safe function after the finalize callback completes.**

The `context` given during the call to `napi_create_threadsafe_function()` can be retrieved from any thread with a call to `napi_get_threadsafe_function_context()`.

`napi_call_threadsafe_function()` can then be used for initiating a call into JavaScript. `napi_call_threadsafe_function()` accepts a parameter which controls whether the API behaves blockingly. If set to `napi_tsfn_nonblocking`, the API behaves non-blockingly, returning `napi_queue_full` if the queue was full, preventing data from being successfully added to the queue. If set to `napi_tsfn_blocking`, the API blocks until space becomes available in the queue. `napi_call_threadsafe_function()` never blocks if the thread-safe function was created with a maximum queue size of 0.

The actual call into JavaScript is controlled by the callback given via the `call_js_cb` parameter. `call_js_cb` is invoked on the main thread once for each value that was placed into the queue by a successful call to `napi_call_threadsafe_function()`. If such a callback is not given, a default callback will be used, and the resulting JavaScript call will have no arguments. The `call_js_cb` callback receives the JavaScript function to call as a `napi_value` in its parameters, as well as the `void*` context pointer used when creating the `napi_threadsafe_function`, and the next data pointer that was created by one of the secondary threads. The callback can then use an API such as `napi_call_function()` to call into JavaScript.

The callback may also be invoked with `env` and `call_js_cb` both set to `NULL` to indicate that calls into JavaScript are no longer possible, while items remain in the queue that may need to be freed. This normally occurs when the Node.js process exits while there is a thread-safe function still active.

It is not necessary to call into JavaScript via `napi_make_callback()` because N-API runs `call_js_cb` in a context appropriate for callbacks.

Threads can be added to and removed from a `napi_threadsafe_function` object during its existence. Thus, in addition to specifying an initial number of threads upon creation, `napi_acquire_threadsafe_function` can be called to indicate that a new thread will start making use of the thread-safe function. Similarly, `napi_release_threadsafe_function` can be called to indicate that an existing thread will stop making use of the thread-safe function.

`napi_threadsafe_function` objects are destroyed when every thread which uses the object has called `napi_release_threadsafe_function()` or has received a return status of `napi_closing` in response to a call to `napi_call_threadsafe_function`. The queue is emptied before the `napi_threadsafe_function` is destroyed. It is important that `napi_release_threadsafe_function()` be the last API call made in conjunction with a given `napi_threadsafe_function`, because after the call completes, there is no guarantee that the `napi_threadsafe_function` is still allocated. For the same reason it is also important that no more use be made of a thread-safe function after receiving a return value of `napi_closing` in response to a call to `napi_call_threadsafe_function`. Data associated with the `napi_threadsafe_function` can be freed in its `napi_finalize` callback which was passed to `napi_create_threadsafe_function()`.

Once the number of threads making use of a `napi_threadsafe_function` reaches zero, no further threads can start making use of it by calling `napi_acquire_threadsafe_function()`. In fact, all subsequent API calls associated with it, except `napi_release_threadsafe_function()`, will return an error value of `napi_closing`.

The thread-safe function can be "aborted" by giving a value of `napi_tsfn_abort` to `napi_release_threadsafe_function()`. This will cause all subsequent APIs associated with the thread-safe function except `napi_release_threadsafe_function()` to return `napi_closing` even before its reference count reaches zero. In particular, `napi_call_threadsafe_function()` will return `napi_closing`, thus informing the threads that it is no longer possible to make asynchronous calls to the thread-safe function. This can be used as a criterion for terminating the thread. **Upon receiving a return value of `napi_closing` from `napi_call_threadsafe_function()` a thread must make no further use of the thread-safe function because it is no longer guaranteed to be allocated.**

Similarly to libuv handles, thread-safe functions can be "referenced" and "unreferenced". A "referenced" thread-safe function will cause the event loop on the thread on which it is created to remain alive until the thread-safe function is destroyed. In contrast, an "unreferenced" thread-safe function will not prevent the event loop from exiting. The APIs `napi_ref_threadsafe_function` and `napi_unref_threadsafe_function` exist for this purpose.

### napi_create_threadsafe_function

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
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

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] func`: The JavaScript function to call from another thread.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: A javaScript string to provide an identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[in] max_queue_size`: Maximum size of the queue. 0 for no limit.
- `[in] initial_thread_count`: The initial number of threads, including the main thread, which will be making use of this function.
- `[in] thread_finalize_data`: Optional data to be passed to `thread_finalize_cb`.
- `[in] thread_finalize_cb`: Optional function to call when the `napi_threadsafe_function` is being destroyed.
- `[in] context`: Optional data to attach to the resulting `napi_threadsafe_function`.
- `[in] call_js_cb`: Optional callback which calls the JavaScript function in response to a call on a different thread. This callback will be called on the main thread. If not given, the JavaScript function will be called with no parameters and with `undefined` as its `this` value.
- `[out] result`: The asynchronous thread-safe JavaScript function.

### napi_get_threadsafe_function_context

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
-->

```C
NAPI_EXTERN napi_status
napi_get_threadsafe_function_context(napi_threadsafe_function func,
                                     void** result);
```

- `[in] func`: The thread-safe function for which to retrieve the context.
- `[out] context`: The location where to store the context.

This API may be called from any thread which makes use of `func`.

### napi_call_threadsafe_function

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
-->

```C
NAPI_EXTERN napi_status
napi_call_threadsafe_function(napi_threadsafe_function func,
                              void* data,
                              napi_threadsafe_function_call_mode is_blocking);
```

- `[in] func`: The asynchronous thread-safe JavaScript function to invoke.
- `[in] data`: Data to send into JavaScript via the callback `call_js_cb` provided during the creation of the thread-safe JavaScript function.
- `[in] is_blocking`: Flag whose value can be either `napi_tsfn_blocking` to indicate that the call should block if the queue is full or `napi_tsfn_nonblocking` to indicate that the call should return immediately with a status of `napi_queue_full` whenever the queue is full.

This API will return `napi_closing` if `napi_release_threadsafe_function()` was called with `abort` set to `napi_tsfn_abort` from any thread. The value is only added to the queue if the API returns `napi_ok`.

This API may be called from any thread which makes use of `func`.

### napi_acquire_threadsafe_function

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
-->

```C
NAPI_EXTERN napi_status
napi_acquire_threadsafe_function(napi_threadsafe_function func);
```

- `[in] func`: The asynchronous thread-safe JavaScript function to start making use of.

A thread should call this API before passing `func` to any other thread-safe function APIs to indicate that it will be making use of `func`. This prevents `func` from being destroyed when all other threads have stopped making use of it.

This API may be called from any thread which will start making use of `func`.

### napi_release_threadsafe_function

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
-->

```C
NAPI_EXTERN napi_status
napi_release_threadsafe_function(napi_threadsafe_function func,
                                 napi_threadsafe_function_release_mode mode);
```

- `[in] func`: The asynchronous thread-safe JavaScript function whose reference count to decrement.
- `[in] mode`: Flag whose value can be either `napi_tsfn_release` to indicate that the current thread will make no further calls to the thread-safe function, or `napi_tsfn_abort` to indicate that in addition to the current thread, no other thread should make any further calls to the thread-safe function. If set to `napi_tsfn_abort`, further calls to `napi_call_threadsafe_function()` will return `napi_closing`, and no further values will be placed in the queue.

A thread should call this API when it stops making use of `func`. Passing `func` to any thread-safe APIs after having called this API has undefined results, as `func` may have been destroyed.

This API may be called from any thread which will stop making use of `func`.

### napi_ref_threadsafe_function

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
-->

```C
NAPI_EXTERN napi_status
napi_ref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] func`: The thread-safe function to reference.

This API is used to indicate that the event loop running on the main thread should not exit until `func` has been destroyed. Similar to [`uv_ref`][] it is also idempotent.

This API may only be called from the main thread.

### napi_unref_threadsafe_function

> Stabilità: 2 - Stable

<!-- YAML
added: v8.16.0
-->

```C
NAPI_EXTERN napi_status
napi_unref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

- `[in] env`: L'ambiente in cui viene invocata l'API.
- `[in] func`: The thread-safe function to unreference.

This API is used to indicate that the event loop running on the main thread may exit before `func` is destroyed. Similar to [`uv_unref`][] it is also idempotent.

This API may only be called from the main thread.