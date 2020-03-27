# N-API

<!--introduced_in=v7.10.0-->

> Estability: 2 - Estable

N-API (pronunciado N como la letra, seguido por API) es una API para crear complementos nativos. Es independiente del tiempo de ejecución subyacente de JavaScript (por ejemplo, V8) y se mantiene como parte de Node.js. Esta API será Interfaz Binaria de Aplicación (ABI) estable entre versiones de Node.js. Está diseñado para aislar los complementos de los cambios del motor subyacente de JavaScripts y permitir que los módulos compilados para una versión se ejecuten en versiones posteriores de Node.js sin compilación.

Los complementos son programados y empaquetados con el mismo enfoque y herramientas descritos en la sección titulada [Complementos de C++](addons.html). La única diferencia es el conjunto de APIs que son utilizadas por el código nativo. En lugar de utilizar V8 o las APIs [Abstracciones Nativas para Node.js](https://github.com/nodejs/nan), se utilizan las funciones disponibles en la N-API.

Las APIs expuestas por la N-API son, generalmente, utilizadas para crear y manipular valores de JavaScript. Los conceptos y operaciones, generalmente, mapean hacia ideas especificadas en las Especificaciones del Lenguaje ECMA262. Las APIs tienen las siguientes propiedades:
- Todas las llamadas N-API devuelven un código de estado del tipo `napi_status`. Este estado indica si la llamada a la API fue exitosa o no.
- El valor devuelto por la API se pasa a través de un parámetro de salida.
- Todos los valores de JavaScript se abstraen detrás de un tipo opaco llamado `napi_value`.
- En caso de un estado de error, se puede obtener información adicional utilizando `napi_get_last_error_info`. Se puede encontrar más información en la sección de manejo de errores [Manejo de Errores](#n_api_error_handling).

La documentación para N-API es estructurada de la siguiente manera:

* [Tipos Básicos de Datos de N-API](#n_api_basic_n_api_data_types)
* [Manejo de Errores](#n_api_error_handling)
* [Administración del Tiempo de Vida de los Objetos](#n_api_object_lifetime_management)
* [Registro de Módulos](#n_api_module_registration)
* [Trabajar con las Propiedades de JavaScript](#n_api_working_with_javascript_values)
* \[Trabajar con Valores de JavaScript - Operaciones Abstractas\]\[\]
* [Trabajar con las Propiedades de JavaScript](#n_api_working_with_javascript_properties)
* [Trabajar con Funciones de JavaScript](#n_api_working_with_javascript_functions)
* [Envoltura de Objeto](#n_api_object_wrap)
* [Operaciones Asíncronas Simples](#n_api_simple_asynchronous_operations)
* [Operaciones Asíncronas Personalizadas](#n_api_custom_asynchronous_operations)
* [Promesas](#n_api_promises)
* [Ejecución de Script](#n_api_script_execution)

La N-API es una C API que garantiza la estabilidad de la ABI a través de las versiones y los diferentes niveles de compilación de Node.js. Sin embargo, también entendemos que una API de C++ puede ser más fácil de usar en muchos casos. Para apoyar estos casos, esperamos que existan uno o más módules de envoltura de C++ que provean una API de C++ inlineable. Los binarios compilados con estos módulos de envoltura dependerán de los símbolos para las funciones basadas en N-API exportadas por Node.js. Estas envolturas no son parte de la N-API, ni se mantendrán como parte de Node.js. Un ejemplo es: [node_addon_api](https://github.com/nodejs/node-addon-api).

## Uso

Para poder utilizar las funciones de N-API, incluir el archivo [node_api.h](https://github.com/nodejs/node/blob/master/src/node_api.h) el cual se encuentra en el directorio src en el árbol de nodos de desarrollo. For example:
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

## Tipos Básicos de Datos de N-API

N-API expone los siguientes tipos de datos fundamentales como abstracciones que son consumidas por las diversas APIs. Estas APIs deben tratarse como opacas, solo siendo posible una revisión introspectiva mediante otras llamadas N-API.

### napi_status
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
#ifdef NAPI_EXPERIMENTAL
  napi_queue_full,
  napi_closing,
#endif  // NAPI_EXPERIMENTAL
} napi_status;
```
Si se requiere información adicional cuando una API devuelve un estado de fracaso, puede ser obtenida llamando `napi_get_last_error_info`.

### napi_extended_error_info
```C
typedef struct {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
} napi_extended_error_info;
```

- `error_message`: cadena UTF8-codificada que contiene una descripción neutral VM del error.
- `engine_reserved`: Reservado para los detalles de error específico de la VM. Este, actualmente, no está implementado para ninguna VM.
- `engine_error_code`: código de error específico de la VM. Este, actualmente, no está implementado para ninguna VM.
- `error_code`: El código de estado de la N-API que se originó con el último error.

Mira la sección [Manejo de Errores](#n_api_error_handling) para información adicional.

### napi_env
`napi_env` es utilizada para representar un contexto que la implementación de N-API subyacente puede utilizar para persistir en un estado específico de la VM. Esta estructura es pasada a funciones nativas cuando son invocadas y debe ser pasada devuelta cuando se hacen llamadas N-API. Específicamente, el mismo `napi_env` que fue pasado cuando la función nativa inicial fue llamada debe ser pasada a cualquier llamada N-API subsecuente anidada. El almacenamiento en caché de `napi_env` para el propósito de reutilización general no está permitido.

### napi_value
Este es un apuntador opaco que se utiliza para representar un valor de JavaScript.

### napi_threadsafe_function

> Estability: 2 - Estable

This is an opaque pointer that represents a JavaScript function which can be called asynchronously from multiple threads via `napi_call_threadsafe_function()`.

### napi_threadsafe_function_release_mode

> Estability: 2 - Estable

A value to be given to `napi_release_threadsafe_function()` to indicate whether the thread-safe function is to be closed immediately (`napi_tsfn_abort`) or merely released (`napi_tsfn_release`) and thus available for subsequent use via `napi_acquire_threadsafe_function()` and `napi_call_threadsafe_function()`.
```C
typedef enum {
  napi_tsfn_release,
  napi_tsfn_abort
} napi_threadsafe_function_release_mode;
```

### napi_threadsafe_function_call_mode

> Estability: 2 - Estable

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

Los ámbitos controlados son creados utilizando [`napi_open_handle_scope`][] y son destruidos utilizando [`napi_close_handle_scope`][]. El cierre del ámbito puede indicar al GC que todos los `napi_value`s creados durante el tiempo de vida del alcance controlado ya no son referenciados desde el stack frame actual.

Para más detalles, revisar la [Gestión de tiempo de vida del objeto](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope
Los ámbitos controlados escapables son un tipo especial de ámbitos controlados para devolver al ámbito padre valores creados dentro de un ámbito controlado particular.

#### napi_ref
Esta es la abstracción utilizada para referenciar a `napi_value`. Esto permite que los usuarios puedean controlar el tiempo de vida de los valores JavaScript, incluyendo la definición de sus tiempos de vida mínimos de forma explícita.

Para más detalles, revisar la [Gestión de tiempo de vida del objeto](#n_api_object_lifetime_management).

### Tipos de callbacks N-API
#### napi_callback_info
Tipo de dato opaco que se pasa a una función de callback. Puede ser utilizado para obtener información adicional sobre el contexto en el que el callback fue invocado.

#### napi_callback
Tipo de función puntero para las funciones nativas provistas por el usuario que son expuestas a JavaScript por medio de N-API. Las funciones de callbacks deben satisfacer la siguiente firma:
```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize
Tipo de función puntero para las funciones provistas por los complementos que permiten al usuario ser notificado cuando datos de dominio externo están listos para ser limpiados porque el objeto al que estaban asociados fue clasificado como basura. El usuario debe suministrar una función que satisfaga la siguiente firma, que sería invocada tras la recolección del objeto. Actualmente, `napi_finalize` puede ser utilizado para averiguar cuándo los objetos que tienen datos externos son recogidos.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```


#### napi_async_execute_callback
Función puntero utilizada con funciones que soportan operaciones asincrónicas. Las funciones callback deben satisfacer la siguiente firma:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

#### napi_async_complete_callback
Función puntero utilizada con funciones que soportan operaciones asincrónicas. Las funciones callback deben satisfacer la siguiente firma:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

#### napi_threadsafe_function_call_js

> Estability: 2 - Estable

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

## Manejo de Errores
N-API utiliza valores de entorno y excepciones de JavaScript para el manejo de errores. Las siguientes secciones explican la aproximación para cada caso.

### Valores de retorno
Todas las funciones N-API comparten el mismo patrón de manejo de errores. El tipo de retorno de todas las funciones API es `napi_status`.

El valor de retorno será `napi_ok` si la petición fue exitosa y no se arrojó ninguna excepción de JavaScript no capturada. Si ha ocurrido un error y una excepción fue arrojada, el valor de `napi_status` para el error será devuelto. Si una excepción fue arrojada y no ocurrió ningún error, `napi_pending_exception` será devuelto.

En casos donde se devuelva un valor de retorno distinto a `napi_ok` o `napi_pending_exception`, [`napi_is_exception_pending`][] debe ser llamado para verificar si hay una excepción pendiente. Consulte la sección de excepciones para más detalles.

El conjunto completo de los valores napi_status posibles está definido en `napi_api_types.h`.

El valor de retorno `napi_status` proporciona una representación del error ocurrido independiente de VM. En algunos casos, es útil poder obtener información más detallada, incluyendo una string que represente el error, así como información específica (del motor) de VM.

Para recuperar esta información, se proporciona [`napi_get_last_error_info`][], el cual devuelve una estructura `napi_extended_error_info`. El formato de la estructura `napi_extended_error_info` es el siguiente:

```C
typedef struct napi_extended_error_info {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
};
```
- `error_message`: Representación textual del error ocurrido.
- `engine_reserved`: Handle opaco reservado sólo para uso del motor.
- `engine_error_code`: Código de error específico de la VM.
- `error_code`: Código de estado de N-Api para el último error.

[`napi_get_last_error_info`][] devuelve la información de la última llamada N-API que fue realizada.

*Nota*: No confíe en el contenido o el formato de ninguna de la información extendida, ya que no está sujeta a SemVer y puede cambiar en cualquier momento. Está destinada únicamente para propósitos de registro.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: La estructura `napi_extended_error_info` con más información sobre el error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API recupera una estructura `napi_extended_error_info` con información sobre el último error ocurrido.

*Not*: El contenido de `napi_extended_error_info` devuelto solo es válido hasta que se llame a una función n-api en el mismo `env`.

*Nota*: No confíe en el contenido o el formato de ninguna de la información extendida, ya que no está sujeta a SemVer y puede cambiar en cualquier momento. Está destinada únicamente para propósitos de registro.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.


### Excepciones
Cualquier llamada a una función N-API puede resultar en una excepción pendiente de JavaScript. Este es, obviamente, el caso de cualquier función que pueda causar la ejecución de JavaScript, pero N-API especifica que una excepción puede estar pendiente en la devolución de cualquiera de las funciones de la API.

Si el `napi_status` devuelto por una función es `napi_ok` entonces no hay excepciones pendientes y no se requieren acciones adicionales. Si el `napi_status` devuelto es cualquiera distinto a`napi_ok` o `napi_pending_exception`, para tratar de recuperar y continuar, en lugar de simplemente retornar inmediatamente, [`napi_is_exception_pending`][] debe ser llamada para determinar si una excepción está pendiente o no.

Cuando una excepción está pendiente, se puede emplear uno de dos enfoques.

El primer enfoque es realizar una limpieza apropiada y luego regresar, así la ejecución regresará a JavaScript. Como parte de la transición de regreso a JavaScript, la excepción se arrojará en el punto del código de JavaScript donde el método nativo fue invocado. El comportamiento de la mayoría de las llamadas de N-API no se especifica mientras hay una excepción pendiente y muchas simplemente devolverán `napi_pending_exception`, por lo tanto, es importante hacer lo menos posible y luego volver a JavaScript, donde se puede manejar la excepción.

El segundo enfoque es tratar de manejar la excepción. Habrá casos donde el código nativo pueda capturar la excepción, tomar la acción apropiada y luego continuar. Esto solo es recomendado en casos específicos donde se sabe que la excepción puede ser manejada de forma segura. En estos casos [`napi_get_and_clear_last_exception`][] puede ser utilizada para obtener y eliminar la excepción. En caso de éxito, el resultado contendrá el handle hacia el último objeto de JavaScript arrojado. Si se determina que, luego de recuperar la excepción, esta no puede ser manejada después de todo, puede ser arrojada de nuevo con [`napi_throw`][] donde el error es el objeto JavaScript Error que se arrojará.

Las siguientes funciones de utilidad también están disponibles en caso de que el código nativo necesite soltar una excepción o determinar si un `napi_value` es una instancia de un objeto `Error` de JavaScript: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] y [`napi_is_error`][].

Las siguientes funciones de utilidad también están disponibles en caso de que el código nativo necesite crear un objeto Eror: [`napi_create_error`][], [`napi_create_type_error`][], y [`napi_create_range_error`][]. donde el resultado es el napi_value que se refiere al objeto Error de JavaScript de recién creado.

El proyecto Node.js está añadiendo códigos de error a todos los errores generados internamente. La meta es que las aplicaciones utilicen estos códigos de error para todas las comprobaciones de errores. Los mensajes de error asociados permanecerán, pero sólo se utilizarán para el registro y la visualización, con la expectativa de que el mensaje pueda cambiar sin aplicar SemVer. Para soportar este modelo con N-API, en funcionalidad interna y funcionalidad específica por módulo (como buena práctica), las funciones `throw_` y `create_` toman un parámetro de código opcional que es la string para el código que se agregará al objeto error. Si el parámetro opcional es NULL, ningún código será asociado con el error. Si se proporciona el código, el nombre asociado con el error también se actualiza para ser:

```text
originalName [code]
```

donde originalName es el nombre original asociado con el error y code es el código que se ha proporcionado. Por ejemplo, si el código es 'ERR_ERROR_1' y un TypeError está siendo creado, el nombre será:

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] error`: El `napi_value` para el Error que se arrojará.

Devuelve `napi_ok` si la API fue exitosa.

Esta API arroja el error JavaScript proporcionado.


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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Código de error opcional a establecer en el error.
- `[in] msg`: Cadena de C que representa el texto a asociar con el error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API arroja un Error de JavaScript con el texto proporcionado.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Código de error opcional a establecer en el error.
- `[in] msg`: String de C que representa el texto a asociar con el error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API arroja un TypeError de JavaScript con el texto proporcionado.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Código de error opcional a establecer en el error.
- `[in] msg`: String de C que representa el texto a asociar con el error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API arroja un RangeError de JavaScript con el texto proporcionado.


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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] msg`: El `napi_value` a ser verificado.
- `[out] result`: Valor Booleano que se establece true si `napi_value` representa un error; de lo contrario, se establece false.

Devuelve `napi_ok` si la API fue exitosa.

Esta API requiere un `napi_value` para verificar si representa un objeto error.


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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value que hace referencia a una String de JavaScript que se utilizará como mensaje para el error.
- `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un Error de JavaScript con el texto proporcionado.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value que hace referencia a una String de JavaScript que se utilizará como mensaje para el error.
- `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un TypeError de JavaScript con el texto proporcionado.


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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value que hace referencia a una String de JavaScript que se utilizará como mensaje para el error.
- `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un RangeError de JavaScript con el texto proporcionado.

#### napi_get_and_clear_last_exception
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: Si es uno, la excepción está pendiente; de otra forma es NULL.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve true si una excepción está pendiente.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

#### napi_is_exception_pending
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: Valor Booleano que se establece true si una excepción está pendiente.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve true si una excepción está pendiente.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

#### napi_fatal_exception
<!-- YAML
added: v8.11.2
napiVersion: 3
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] err`: El error que se quiere pasar a `uncaughtException`.

Activa un `uncaughtException` en JavaScript. Es útil si una callback asíncrona arroja un excepción sin manera de recuperarla.

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

- `[in] location`: Ubicación opcional en la que se produjo el error.
- `[in] location_len`: La longitud de la ubicación en bytes o `NAPI_AUTO_LENGTH`, si está terminada en NULL.
- `[in] message`: El mensaje asociado con el error.
- `[in] message_len`: La longitud del mensaje en bytes o `NAPI_AUTO_LENGTH`, si está terminada en NULL.

La llamada a la función no regresa, el proceso se terminará.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

## Gestión de la vida útil del objeto

A medida que se realizan las llamadas N-API, los handles de los objetos en el montón para la máquina virtual subyacente pueden devolverse como `napi_values`. Estos handles deben mantener los objetos 'activos' hasta que el código nativo ya no los requiera, de lo contrario, los objetos podrían recopilarse antes de que el código nativo terminara de usarlos.

A medida que se devuelven los handles de objetos, se asocian con un 'ámbito'. La vida útil para el ámbito predeterminado está vinculada a la vida útil de la llamada al método nativo. El resultado es que, de forma predeterminada, los handles siguen siendo válidos y los objetos asociados con estos handles se mantendrán activos durante la vida útil de la llamada al método nativo.

En muchos casos, sin embargo, es necesario que los handles sigan siendo válidos para una vida útil más corta o más larga que la del método nativo. Las secciones que siguen describen las funciones de N-API que se pueden usar para cambiar la vida útil del handle de la predeterminada.

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

Los métodos disponibles para abrir/cerrar ámbitos escapables son [`napi_open_escapable_handle_scope`][] y [`napi_close_escapable_handle_scope`][].

La solicitud para promover un handle se realiza a través de [`napi_escape_handle`][], el cual solo puede ser llamado una vez.

#### napi_open_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
NODE_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```
- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa al nuevo ámbito.

Devuelve `napi_ok` si la API fue exitosa.

Esta API abre un nuevo ámbito.

#### napi_close_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
NODE_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: `napi_value` que representa al ámbito que será cerrado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cierra el ámbito pasado. Los ámbitos deben ser cerrados en el orden inverso al que fueron creados.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa al nuevo ámbito.

Devuelve `napi_ok` si la API fue exitosa.

Esta API abre un nuevo ámbito desde el cual un objeto puede ser promovido al ámbito externo.

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
- `[in] env`: El entorno bajo el que se invoca a la API.
- `[in] scope`: `napi_value` que representa al ámbito que será cerrado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cierra el ámbito pasado. Los ámbitos deben ser cerrados en el orden inverso al que fueron creados.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: `napi_value` que representa el ámbito actual.
- `[in] escapee`: `napi_value` que representa el Objeto JavaScript a ser pasado.
- `[out] resultado`: `napi_value` que representa el handle al objeto pasado en el ámbito externo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API promueve el handle al objeto de JavaScript para que sea válido durante el tiempo de vida útil del ámbito externo. Solo se puede llamar una vez por ámbito. Si es llamada más de una vez, se devolverá un error.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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
NODE_EXTERN napi_status napi_create_reference(napi_env env,
                                              napi_value value,
                                              int initial_refcount,
                                              napi_ref* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] valor`: `napi_value` que representa el objeto al que queremos una referencia.
- `[in] initial_refcount`: Recuento inicial de referencia para la nueva referencia.
- `[out] result`: `napi_ref` que apunta a la nueva referencia.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea una nueva referencia con el conteo de referencia especificado al Objeto pasado.

#### napi_delete_reference
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
NODE_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] ref`: `napi_ref` que será eliminada.

Devuelve `napi_ok` si la API fue exitosa.

Esta API elimina la referencia pasada.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] ref`: `napi_ref` para la cual se incrementará el conteo de referencias.
- `[out] result`: El nuevo conteo de referencias.

Devuelve `napi_ok` si la API fue exitosa.

Esta API incrementa el conteo de referencias para la referencia pasada y devuelve el conteo de referencias resultante.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] ref`: `napi_ref` para la cual se disminuirá el conteo de referencias.
- `[out] result`: El nuevo conteo de referencias.

Devuelve `napi_ok` si la API fue exitosa.

Esta API disminuye el conteo de referencias para la referencia pasada y devuelve el conteo de referencias resultante.

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

el `napi_value passed` dentro o fuera de estos métodos es un handle para el objeto con el que se relaciona la referencia.
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] ref`: `napi_ref` para el cual solicitamos el Objeto correspondiente.
- `[out] resultado`: El `napi_value` para el objeto referenciado por el `napi_ref`.

Devuelve `napi_ok` si la API fue exitosa.

Si aún es válido, esta API devuelve el `napi_value` que representa al Objeto JavaScript asociado con la `napi_ref`. De lo contrario, el resultado será NULL.

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

Por ejemplo, para añadir el método `hello` como una función para que pueda ser llamado como método proporcionado por el complemento:

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

Por ejemplo, para establecer una función para que sea devuelta por el `require()` para el complemento:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_value method;
  napi_status status;
  status = napi_create_function(env, "exports", NAPI_AUTO_LENGTH, Method, NULL, &method);
  if (status != napi_ok) return NULL;
  return method;
}
```

Por ejemplo, para definir una clase para que se puedan crear nuevas instancias (a menudo usadas con [Object Wrap](#n_api_object_wrap)):

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

Para obtener más detalles sobre la configuración de propiedades en objetos, consulte la sección sobre [Trabajar con las Propiedades de JavaScript](#n_api_working_with_javascript_properties).

Para más detalles sobre la compilación de módulos de complementos en general, consulte la API existente

## Trabajar con las Propiedades de JavaScript
N-API expone un conjunto de APIs para crear todos los tipos de valores de JavaScript. Algunos de estos tipos están documentados bajo la [Sección 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

Fundamentalmente, estas APIs son utilizadas para realizar una de las siguientes acciones:
1. Crear un nuevo objeto de JavaScript
2. Convertir de un tipo primitivo de C a un valor de N-API
3. Convertir de un valor de N-API a un tipo primitivo de C
4. Obtener instancias globales incluyendo `undefined` y `null`

Los valores de N-API están representados por el tipo `napi_value`. Cualquier llamada N-API que requiera un valor de JavaScript toma un `napi_value`. En algunos casos, la API verifica el tipo de `napi_value` por adelantado. Sin embargo, para un mejor rendimiento, es mejor para el llamador asegurarse de que el `napi_value` en cuestión sea del tipo de JavaScript que espera la API.

### Tipos de Enum
#### napi_valuetype
```C
typedef enum {
  // Tipos de ES6 (corresponde a typeof)
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

Describe el tipo de un `napi_value`. Esto, generalmente, corresponde a los tipos descritos en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) de las Especificaciones del Lenguaje ECMAScript. Además de los tipos en esa sección, `napi_valuetype` también puede representar Funciones y Objetos con datos externos.

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

Esto representa el tipo de dato escalar binario subyacente del TypedArray. Los elementos de este enum corresponden a la [Sección 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

### Funciones de Creación de Objetos
#### napi_create_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[out] result`: Un `napi_value` que representa un Array de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API que corresponde a un tipo de Array de JavaScript. Los arrays de JavaScript se describen en la [Sección 22.1](https://tc39.github.io/ecma262/#sec-array-objects) de las Especificaciones del Lenguaje ECMAScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] length`: La longitud inicial del Array.
- `[out] result`: Un `napi_value` que representa un Array de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API que corresponde a un tipo de Array de JavaScript. La propiedad de longitud del Array se establece en el parámetro de longitud pasado. Sin embargo, la VM no garantiza que el buffer subyacente sea preasignado cuando se crea el arreglo; ese comportamiento se deja a la implementación de la VM subyacente. Si el buffer debe ser un bloque contiguo de memoria que pueda leer y/o escribir directamente desde C, considere utilizar [`napi_create_external_arraybuffer`][].

Los arrays de JavaScript se describen en la [Sección 22.1](https://tc39.github.io/ecma262/#sec-array-objects) de las Especificaciones del Lenguaje ECMAScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] length`: La longitud en bytes del buffer de array a crear.
- `[out] data`: Puntero al buffer de bytes subyacente del ArrayBuffer.
- `[out] result`: Un `napi_value` que representa un ArrayBuffer de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un ArrayBuffer de JavaScript. Los ArrayBuffers son utilizados para representar buffers de datos binarios de longitud fija. Normalmente se utilizan como un buffer de respaldo para objetos TypedArray. El ArrayBuffer asignado tendrá un buffer de bytes subyacente cuyo tamaño es determinado por el parámetro `length` que es pasado. El buffer subyacente se devuelve opcionalmente al llamador en caso de que quiera manipular el buffer directamente. Este buffer sólo se puede escribir directamente desde el código nativo. Para escribir en este buffer desde JavaScript, un typed array o un objeto DataView tendría que ser creado.

Los objetos ArrayBuffer de JavaScript se describen en la [Sección 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) de las Especificaciones del Lenguaje ECMAScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] size`: Tamaño en bytes del buffer subyacente.
- `[out] data`: Apuntador sin formato al buffer subyacente.
- `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer`. Si bien esta sigue siendo una estructura de datos totalmente compatible, en la mayoría de los casos será suficiente utilizar un TypedArray.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] size`: Tamaño en bytes del buffer de entrada (debe ser el mismo que el tamaño del nuevo buffer).
- `[in] data`: Apuntador sin formato al buffer subyacente desde el que se va a copiar.
- `[out] result_data`: Puntero al nuevo buffer de datos subyacente del Buffer.
- `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer` y lo inicializa con los datos copiados del buffer pasado. Si bien esta sigue siendo una estructura de datos completamente compatible, en la mayoría de los casos será suficiente utilizar un TypedArray.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] data`: Apuntador sin formato a los datos externos.
- `[in] finalize_cb`: Callback opcional para llamar cuando el valor externo esté siendo tomado.
- `[in] finalize_hint`: Sugerencia opcional para pasar al callback de terminación durante la recopilación.
- `[out] result`: Un `napi_value` que representa un valor externo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un valor de JavaScript con datos externos adjuntos. Esto se utiliza para pasar datos externos a través del código de JavaScript, para que pueda ser recuperado luego por el código nativo. Esta API permite al llamador pasar un callback de terminación, en caso de que el recurso nativo subyacente necesite ser limpiado cuando el valor externo de JavaScript sea tomado.

*Nota*: El valor creado no es un objeto, y por lo tanto no soporta propiedades adicionales. Es considerado un tipo de valor distinto: llamar a `napi_typeof()` con un valor externo produce una `napi_external`.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] external_data`: Puntero al buffer de bytes subyacente del ArrayBuffer.
- `[in] byte_length`: Longitud en bytes del buffer subyacente.
- `[in] finalize_cb`: Callback opcional para llamar cuando el ArrayBuffer está siendo recolectado.
- `[in] finalize_hint`: Sugerencia opcional para pasar al callback de terminación durante la recopilación.
- `[out] result`: Un `napi_value` que representa un ArrayBuffer de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un ArrayBuffer de JavaScript. El byte buffer subyacente del ArrayBuffer se asigna y administra de forma externa. El llamador debe asegurar que el byte buffer permanezca válido hasta que se llame a la callback de terminación.

Los ArrayBuffers de JavaScript están descritos en la [Sección 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) de las Especificaciones del Lenguaje ECMAScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] length`: Tamaño en bytes del buffer de entrada (debe ser el mismo que el tamaño del nuevo buffer).
- `[in] data`: Apuntador sin formato al buffer subyacente desde el que se va a copiar.
- `[in] finalize_cb`: Callback opcional para llamar cuando el ArrayBuffer está siendo recolectado.
- `[in] finalize_hint`: Sugerencia opcional para pasar al callback de terminación durante la recopilación.
- `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer` y lo inicializa con los datos respaldados por el buffer pasado. Si bien esta sigue siendo una estructura de datos completamente compatible, en la mayoría de los casos será suficiente utilizar un TypedArray.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] utf8name`: Una cadena que representa el nombre de la función codificada como UTF8.
- `[in] length`: La longitud en bytes de utf8name, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
- `[in] cb`: Un apuntador a la función nativa a ser invocada cuando la función creada se invoque desde JavaScript.
- `[in] data`: Datos de contexto arbitrario opcionales para pasar a la función nativa cuando se invoca.
- `[out] result`: Un `napi_value` que representa una función de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un objeto de Función de JavaScript. Es utilizada para envolver funciones nativas para que puedan ser invocadas desde JavaScript.

Las funciones de JavaScript se describen en la [Sección 19.2](https://tc39.github.io/ecma262/#sec-function-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_object
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: Un `napi_value` que representa un Objeto de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un Objeto predeterminado de JavaScript. Es equivalente a realizar `new Object()` en JavaScript.

El tipo de Objeto de JavaScript se describe en la [Sección 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) de las Especificaciones del Lenguaje de JavaScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] description`: napi_value opcional que se refiere a una String de JavaScript a ser establecida como la descripción para el símbolo.
- `[out] result`: Un `napi_value` que representa un Símbolo de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto Symbol de JavaScript desde una string de C codificada en UTF8

El tipo de Símbolo de JavaScript se describe en la [Sección 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) de las Especificaciones del Lenguaje ECMAScripts.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] type`: Tipo de datos escalar de los elementos dentro del TypedArray.
- `[in] length`: Número de elementos en el TypedArray.
- `[in] arraybuffer`: ArrayBuffer subyacente al array escrito.
- `[in] byte_offset`: El byte desplazado dentro del ArrayBuffer desde el cual comenzar a proyectar el TypedArray.
- `[out] result`: Un `napi_value` que representa un TypedArray de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto TypedArray de JavaScript sobre un ArrayBuffer existente. Los objetos TypedArray proporcionan una vista similar a un array sobre un buffer de datos subyacente donde cada elemento tiene el mismo tipo de datos escalares binarios subyacentes.

It's required that (length * size_of_element) + byte_offset should be <= the size in bytes of the array passed in. Si no, se levanta una excepción RangeError.

Los objetos TypedArray de JavaScript se describen en la [Sección 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) de las Especificaciones del Lenguaje ECMAScript.


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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] length`: Número de elementos en el DataView.
- `[in] arraybuffer`: ArrayBuffer subyacente al DataView.
- `[in] byte_offset`: El byte desplazado dentro del ArrayBuffer desde el cual comenzar a proyectar el DataView.
- `[out] result`: Un `napi_value` que representa un DataView de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto DataView de JavaScript sobre un ArrayBuffer existente. Los objetos DataView proporcionan una vista similar a un array sobre un buffer de datos subyacente, pero una que permite objetos de diferente tamaño y tipo en el ArrayBuffer.

Es necesario que `byte_length + byte_offset` sea menor o igual que el tamaño en bytes del arreglo pasado. Si no, se genera una excepción RangeError.

Los objetos DataView de JavaScript se describen en la [Sección 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) de las Especificaciones del Lenguaje ECMAScript.

### Funciones para convertir de tipos de C a N-API
#### napi_create_int32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor entero a ser representado en JavaScript.
- `[out] result`: Un `napi_value` que representa un Número de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir desde el tipo de C `int32_t` al tipo de Número de JavaScript.

El tipo de Número de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScripts.

#### napi_create_uint32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor entero sin signo a representar en JavaScript.
- `[out] result`: Un `napi_value` que representa un Número de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir desde el tipo de C `int32_t` al tipo de Número de JavaScript.

El tipo de Número de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScripts.

#### napi_create_int64
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor entero a ser representado en JavaScript.
- `[out] result`: Un `napi_value` que representa un Número de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir desde el tipo de C `int64_t` al tipo de Número de JavaScript.

El tipo de Número de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScripts. Tenga en cuenta que el rango completo del `int64_t` no puede ser representado con total precisión en JavaScript. Los valores enteros fuera del rango de [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderán precisión.

#### napi_create_double
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor de doble precisión a representar en JavaScript.
- `[out] result`: Un `napi_value` que representa un Número de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir desde el tipo de C `int_t` al tipo de Número de JavaScript.

El tipo de Número de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScripts.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] str`: Buffer de caracteres que representa una string codificada en ISO-8859-1.
- `[in] length`: La longitud de la cadena en bytes, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
- `[out] result`: Un `napi_value` que representa una String de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto String de JavaScript desde una string de C codificada en ISO-8859-1.

El tipo de String de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) de las Especificaciones del Lenguaje ECMAScripts.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] str`: Buffer de caracteres que representa una cadena codificada en UTF16-LE.
- `[in] length`: La longitud de la cadena en unidades de código de dos bytes, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
- `[out] result`: Un `napi_value` que representa una String de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto String de JavaScript desde una string de C codificada en UTF16-LE

El tipo de String de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) de las Especificaciones del Lenguaje ECMAScripts.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] str`: Buffer de caracteres que representa una cadena codificada en UTF8.
- `[in] length`: La longitud de la cadena en bytes, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
- `[out] result`: Un `napi_value` que representa una String de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto String de JavaScript desde una string de C codificada en UTF8

El tipo de String de JavaScript se describe en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) de las Especificaciones del Lenguaje ECMAScripts.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa el Array de JavaScript cuya longitud está siendo consultada.
- `[out] result`: `uint32` que representa la longitud del arreglo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve la longitud de un arreglo.

La longitud del Array se describe en la [Sección 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) de las Especificaciones del Lenguaje ECMAScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] arraybuffer`: `napi_value` que representa al ArrayBuffer que está siendo consultado.
- `[out] data`: El buffer de datos subyacente del ArrayBuffer.
- `[out] byte_length`: Longitud en bytes del buffer de datos subyacente.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para recuperar el buffer de datos subyacente de un ArrayBuffer y su longitud.

*ADVERTENCIA*: Tenga cuidado al utilizar esta API. El ArrayBuffer administra la vida útil del buffer de datos subyacente incluso después de su devolución. Una manera segura y posible de utilizar esta API es hacerlo en conjunto con [`napi_create_reference`][], la cual puede ser utilizada para garantizar el control sobre la vida útil del ArrayBuffer. También es seguro utilizar el buffer de datos devuelto dentro de la misma callback de terminación, siempre que no existan llamadas a otras APIs que puedan desencadenar un GC.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa al `node::Buffer` que está siendo consultado.
- `[out] data`: El buffer de datos subyacente del `node::Buffer`.
- `[out] length`: Longitud en bytes del buffer de datos subyacente.

Devuelve `napi_ok` si la API fue exitosa.

Esta API es utilizada para recuperar el buffer de datos subyacente y la longitud de un `node::Buffer`.

*Advertencia*: Tenga cuidado al utilizar esta API, ya que la vida útil del buffer de datos subyacente no está garantizada si es administrada por la VM.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] object`: `napi_value` que representa el prototipo a devolver de un Objeto de JavaScript. Este devuelve el equivalente de `Object.getPrototypeOf` (el cual no es lo mismo que la propiedad `prototype` de la función).
- `[out] result`: `napi_value` que representa al prototipo del objeto dado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] typedarray`: `napi_value` que representa las propiedades a consultar del TypedArray.
- `[out] type`: Tipo de datos escalar de los elementos dentro del TypedArray.
- `[out] length`: Número de elementos en el TypedArray.
- `[out] data`: El buffer de datos subyacente al typed array.
- `[out] byte_offset`: El byte desplazado dentro del ArrayBuffer desde el cual comenzar a proyectar el TypedArray.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve varias propiedades de un typed array.

*Advertencia*: Tenga cuidado al utilizar esta API, ya que el buffer de datos subyacente es administrado por la VM

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] dataview`: `napi_value` que representa las propiedades a consultar de DataView.
- `[out] byte_length`: Número de bytes en el DataView.
- `[out] data`: El buffer de datos subyacente al DataView.
- `[out] arraybuffer`: ArrayBuffer subyacente al DataView.
- `[out] byte_offset`: El byte desplazado dentro del buffer de datos desde el cual comenzar a proyectar el DataView.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve varias propiedades de un DataView.

#### napi_get_value_bool
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un Booleano de JavaScript.
- `[out] resultado`: primitivo booleano de C equivalente del Booleano de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no booleano devuelve `napi_boolean_expected`.

Esta API devuelve el primitivo booleano de C equivalente al Booleano de JavaScript dado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un Número de JavaScript.
- `[out] result`: primitivo doble de C equivalente del Número de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

Esta API devuelve un primitivo doble de C equivalente al Número de JavaScript dado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un valor externo de JavaScript.
- `[out] result`: Apuntador a los datos envueltos por el valor externo de JavaScript.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no externo es pasado, devuelve `napi_invalid_arg`.

Esta API recupera el apuntador a los datos externos que fue previamente pasado a `napi_create_external()`.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un Número de JavaScript.
- `[out] result`: Primitivo int32 de C equivalente del Número de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado en `napi_number_expected`.

Esta API devuelve un primitivo int32 de C equivalente al Número de JavaScript dado.

Si el número excede el rango del entero de 32 bits, entonces el resultado es truncado hacia abajo al número de 32 bits próximo. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

Los valores de número no finitos (NaN, infinito positivo o negativo infinito) establecen el resultado en cero.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un Número de JavaScript.
- `[out] result`: Primitivo int64 de C equivalente del Número de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

Esta API devuelve un int64 primitivo de C equivalente al Número de JavaScript dado.

Los valores enteros fuera del rango de [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer)-(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderán precisión.

Los valores de número no finitos (NaN, infinito positivo o negativo infinito) establecen el resultado en cero.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa una cadena de JavaScript.
- `[in] buf`: Buffer para escribir la cadena codificada en ISO-8859-1. Si se pasa NULL, se devuelve la longitud de la cadena (en bytes).
- `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la string devuelta será truncada.
- `[out] result`: Número de byes copiados en el buffer, excluyendo el terminador Null.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no String, devuelve `napi_string_expected`.

Esta API devuelve una cadena codificada en ISO-8859-1 que corresponde al valor pasado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa la string de JavaScript.
- `[in] buf`: Buffer para escribir la cadena codificada en UTF8. Si se pasa NULL, se devuelve la longitud de la cadena (en bytes).
- `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la string devuelta será truncada.
- `[out] result`: Número de byes copiados en el buffer, excluyendo el terminador Null.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no String, devuelve `napi_string_expected`.

Esta API devuelve una cadena codificada en UTF8 que corresponde al valor pasado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa la string de JavaScript.
- `[in] buf`: Buffer en el cual escribir la cadena codificada en UTF16-LE. Si se pasa NULL, se devuelve la longitud de la cadena (en unidades de código de 2 bytes).
- `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la string devuelta será truncada.
- `[out] result`: Número de unidades de código de 2 bytes copiadas en el buffer, excluyendo el terminador NULL.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no String, devuelve `napi_string_expected`.

Esta API devuelve la cadena codificada en UTF16 que corresponde al valor pasado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un Número de JavaScript.
- `[out] result`: Primitivo de C equivalente al `napi_value` dado como un `uint32_t`.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor del booleano a recuperar.
- `[out] result`: `napi_value` que representa el singleton Booleano de JavaScript a recuperar.

Devuelve `napi_ok` si la API fue exitosa.

Esta API es utilizada para devolver el objeto singleton de JavaScript que es utilizado para representar al valor booleano dado

#### napi_get_global
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa el Objeto Global de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el Objeto global.

#### napi_get_null
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa el Objeto NULL de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el Objeto NULL.

#### napi_get_undefined
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa al valor indefinido de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el objeto indefinido de JavaScript.

## Trabajar con Valores de JavaScript - Operaciones Abstractas

N-API expone un conjunto de APIs para realizar algunas operaciones abstractas en valores de JavaScript. Algunas de estas operaciones están documentadas bajo la [Sección 7](https://tc39.github.io/ecma262/#sec-abstract-operations) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

Estas APIs admiten hacer uno de los siguientes:
1. Forzar los valores de JavaScript para que sean tipos específicos de JavaScript (tales como Number o String)
2. Verificar el tipo de valor de JavaScript
3. Verificar la equidad entre dos valores de JavaScript

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a forzar.
- `[out] result`: `napi_value` que representa el Booleano de JavaScript forzado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta ToBoolean como se define en la [Sección 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el Objeto pasado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a forzar.
- `[out] result`: `napi_value` que representa el Número de JavaScript forzado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta ToNumber como se define en la [Sección 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el Objeto pasado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a forzar.
- `[out] result`: `napi_value` que representa el Objeto de JavaScript forzado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta ToObject como se define en la [Sección 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el Objeto pasado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a forzar.
- `[out] result`: `napi_value` que representa la String de JavaScript forzada.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta ToString como se define en la [Sección 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el Objeto pasado.

### napi_typeof
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaSript cuyo tipo será consultado.
- `[out] result`: El tipo del valor de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.
- `napi_invalid_arg` si el tipo del `value` no es un tipo de ECMAScript conocido y el `value` no es un valor externo.

Esta API representa un comportamiento similar a invocar al operador `typeof` en el objeto como se define en la [Sección 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) de las Especificaciones del Lenguaje ECMAScript. Sin embargo, tiene soporte para detectar un valor externo. Si el `value` tiene un tipo inválido, se devuelve un error.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] object`: El valor de JavaScript a verificar.
- `[in] constructor`: El objeto de la función de JavaScript de la función constructor contra la que se va a comprobar.
- `[out] result`: Booleano que se establece true si `object instanceof constructor` es true.

Devuelve `napi_ok` si la API fue exitosa.

Esta API representa la invocación del operador `instanceof` sobre el objeto tal como se define en la [Sección 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) de las Especificaciones del Lenguaje ECMAScript.

### napi_is_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el objeto dado es un arreglo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API representa la invocación de la operación `IsArray` sobre el objeto tal como se define en la [Sección 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) de las Especificaciones del Lenguaje ECMAScript.

### napi_is_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el objeto dado es un ArrayBuffer.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objeto pasado es un array buffer.

### napi_is_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un objeto `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objeto pasado se encuentra en un buffer.

### napi_is_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un objeto Error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objeto pasado es un Error.

### napi_is_typedarray
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un TypedArray.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objeto pasado es un typed array.

### napi_is_dataview
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un DataView.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objeto pasado es un DataView.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] lhs`: El valor de JavaScript a verificar.
- `[in] rhs`: El valor de JavaScript contra el que se va a comparar.
- `[out] result`: Si los dos objetos `napi_value` son iguales.

Devuelve `napi_ok` si la API fue exitosa.

Esta API representa la invocación del algoritmo de Igualdad Estricta tal como se define en la [Sección 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) de las Especificaciones del Lenguaje ECMAScript.

## Trabajar con las Propiedades de JavaScript

N-API expone un conjunto de APIs para obtener y establecer propiedades sobre objetos de JavaScript. Algunos de estos tipos están documentados bajo la [Sección 7](https://tc39.github.io/ecma262/#sec-operations-on-objects) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

Las propiedades en JavaScript están representadas como una dupla de una clave y un valor. Fundamentalmente, todas las claves de las propiedades en N-API pueden ser representadas de alguna de las siguientes formas:
- Nombre: una cadena simple codificada en UTF8
- Entero indexado: un valor de índice representado por `uint32_t`
- Valor de JavaScript: estos están representados por `napi_value` en N-API. This can be a `napi_value` representing a String, Number, or Symbol.

Los valores de N-API son representados por el tipo `napi_value`. Cualquier llamada N-API requiere que un valor de JavaScript tome un `napi_value`. Sin embargo, es responsabilidad del llamador asegurarse de que el `napi_value` en cuestión sea del tipo de JavaScript esperado por la API.

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

// Crea napi_values para 123 y 456
napi_value fooValue, barValue;
status = napi_create_int32(env, 123, &fooValue);
if (status != napi_ok) return status;
status = napi_create_int32(env, 456, &barValue);
if (status != napi_ok) return status;

// Establece las propiedades
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
  // de propiedades de instancia. Ignorada por napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

`napi_property_attributes` son flags utilizadas para controlar el comportamiento de propiedades establecidas sobre objetos de JavaScript. Aparte de `napi_static`, corresponden a los atributos listados en la [Sección 6.1.7.1](https://tc39.github.io/ecma262/#table-2) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/). Pueden ser uno o más de los siguientes bitflags:

- `napi_default` - Utilizada para indicar que no hay atributos explícitos establecidos en la propiedad dada. Por defecto, un propiedad es para sólo lectura, no enumerable ni configurable.
- `napi_writable` - Utilizada para indicar que una propiedad dada es editable.
- `napi_enumerable` - Utilizada para indicar que una propiedad dada es enumerable.
- `napi_configurable` - Utilizada para indicar que una propiedad dada es configurable, tal como se define en la [Sección 6.1.7.1](https://tc39.github.io/ecma262/#table-2) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).
- `napi_static` - Utilizada para indicar que la propiedad será definida como una propiedad estática en una clase opuesta a una propiedad de instancia, la cual está por defecto. Esta es utilizada sólo por [`napi_define_class`][]. Es ignorado por `napi_define_properties`.

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

- `utf8name`: String opcional que describe la clave para la propiedad, codificada como UTF8. Alguno de los dos, `utf8name` o `name`, debe ser proporcionado por la propiedad.
- `name`: napi_value opcional que apunta a una string o símbolo de JavaScript a ser utilizado como clave de la propiedad. Alguno de los dos, `utf8name` o `name`, debe ser proporcionado para la propiedad.
- `value`: El valor que es recuperado por un get access de la propiedad si esta es una propiedad de datos. Si es pasado, establecer `getter`, `setter`, `method` y `data` en `NULL` (ya que estos miembros no serán utilizados).
- `getter`: Una función a llamar cuando se realiza un get access de la propiedad. Si es pasado, establecer `value` y `method` en `NULL` (ya que estos miembros so se utilizarán). La función dada es llamada implícitamente por el tiempo de ejecución cuando la propiedad es accedida desde el código de JavaScript (o si se realiza un get en la propiedad, utilizando una llamada N-API).
- `setter`: Una función a llamar cuando se realiza un set access de la propiedad. Si es pasado, establecer `value` y `method` en `NULL` (ya que estos miembros so se utilizarán). La función dada es llamada implícitamente por el tiempo de ejecución cuando la propiedad se establece desde el código de JavaScript (o si se realiza un set en la propiedad, utilizando una llamada N-API).
- `method`: Establecer esto para hacer que la propiedad `value` del objeto descriptor de la propiedad sea una función de JavaScript representada por `method`. Si es pasado, establecer `value`, `getter` y `setter` en `NULL` (ya que estos miembros no se utilizarán).
- `attributes`: Los atributos asociados con la propiedad particular. Ver [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: El callback de datos pasado en `method`, `getter` y `setter` si esta función es invocada.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto del cual recuperar las propiedades.
- `[out] result`: Un `napi_value` que representa un arreglo de valores de JavaScript que representan los nombres de propiedad del objeto. Esta API puede ser utilizada para iterar sobre `result`, usando [`napi_get_array_length`][] y [`napi_get_element`][].

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el array de propiedades para el Objeto pasado

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto sobre el cual establecer la propiedad.
- `[in] key`: El nombre de la propiedad a establecer.
- `[in] value`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Esta API establece una propiedad sobre el Objeto pasado.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el cual recuperar la propiedad.
- `[in] key`: El nombre de la propiedad a recuperar.
- `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Esta API obtiene la propiedad solicitada desde el Objeto pasado.


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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto a consultar.
- `[in] key`: El nombre de la propiedad cuya existencia se va a verificar.
- `[out] result`: Si la propiedad existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objecto pasado tiene la propiedad nombrada.


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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto a consultar.
- `[in] key`: El nombre de la propiedad a eliminar.
- `[out] result`: Si la eliminación de la propiedad fue exitosa o no. `result` puede ser opcionalmente ignorado pasando `NULL`.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto a consultar.
- `[in] key`: El nombre de la propiedad propia cuya existencia se va a verificar.
- `[out] result`: Si la propiedad propia existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el Objeto pasado tiene la propiedad propia nombrada. `key` debe ser una string o un Símbolo, de lo contrario se arrojará un error. N-API no realizará ninguna conversión entre tipos de datos.


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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto sobre el cual establecer la propiedad.
- `[in] utf8Name`: El nombre de la propiedad a establecer.
- `[in] value`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Este método es equivalente a llamar [`napi_set_property`][] con un `napi_value` creado desde una string pasada como `utf8Name`

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el cual recuperar la propiedad.
- `[in] utf8Name`: El nombre de la propiedad a obtener.
- `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Este método es equivalente a llamar [`napi_get_property`][] con un `napi_value` creado desde una string pasada como `utf8Name`

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto a consultar.
- `[in] utf8Name`: El nombre de la propiedad cuya existencia se va a verificar.
- `[out] result`: Si la propiedad existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

Este método es equivalente a llamar [`napi_has_property`][] con un `napi_value` creado desde una string pasada como `utf8Name`

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el que se establecen las propiedades.
- `[in] index`: El índice de la propiedad a establecer.
- `[in] value`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Esta API establece un elemento en el Objeto pasado.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el cual recuperar la propiedad.
- `[in] index`: El índice de la propiedad a obtener.
- `[out] result`: El valor de la propiedad.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto a consultar.
- `[in] index`: El índice de la propiedad cuya existencia se va a verificar.
- `[out] result`: Si la propiedad existe en el objeto o no.

Devuelve `napi_ok` si la API fue exitosa.

Esta API retorna si el Objeto pasado tiene un elemento en el índice solicitado.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto a consultar.
- `[in] index`: El índice de la propiedad a eliminar.
- `[out] result`: Si la eliminación del elemento fue exitosa o no. `result` puede ser opcionalmente ignorado pasando `NULL`.

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

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto del cual recuperar las propiedades.
- `[in] property_count`: El número de elementos en el arreglo de `properties`.
- `[in] properties`: El arreglo de descriptores de propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite la definición eficiente de múltiples propiedades sobre un objeto dado. Las propiedades se definen utilizando los descriptores de propiedad (vea [`napi_property_descriptor`][]). Dado un array de tales descriptores de propiedad, esta API establecerá las propiedades sobre el objeto una a la vez, tal como se define en DefineOwnProperty (descrito en la [Sección 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) de las especificaciones ECMA262).

## Trabajar con Funciones de JavaScript

N-API ofrece un conjunto de APIs que permiten al código de JavaScript hacer llamadas de vuelta al código nativo. Las APIs de N-API que son compatibles con las llamadas devuelta al código nativo toman una función callback representada por el tipo `napi_callback`. Cuando la VM de JavaScript llama de vuelta al código nativo, la función `napi_callback` proporcionada es invocada. Las APIs documentadas en esta sección permiten hacer lo siguiente a la función callback:
- Obtener información sobre el contexto en el cual el callback fue invocado.
- Obtener los argumentos pasados al callback.
- Devolver un `napi_value` desde el callback.

Adicionalmente, N-API proporciona un conjunto de funciones que permiten llamar funciones de JavaScript desde el código nativo. Uno puede llamar a una función como una llamad de función de JavaScript regular, o como una función constructora.


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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] recv`: El objeto `this` pasado a la función llamada.
- `[in] func`: `napi_value` que representa la función de JavaScript a ser invocada.
- `[in] argc`: El conteo de elementos en el arreglo `argv`.
- `[in] argv`: Arreglo de `napi_values` que representan los valores de JavaScript pasados como argumentos a la función.
- `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite a una función objeto de JavaScript ser llamada desde un complemento nativo. Este es el mecanismo principal para devolver *desde* el código nativo del complemento *a* JavaScript. Para el caso especial de llamar a JavaScript después de una operación asíncrona, véase [`napi_make_callback`][].

Un caso de muestra para su uso puede verse de la siguiente manera. Considere el siguiente fragmento de código de JavaScript:
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
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] utf8Name`: El nombre de la función codificado como UTF8. Este es visible dentro de JavaScript como la propiedad del nuevo `name` de la función objeto.
- `[in] cb`: La función nativa que debe ser llamada cuando el objeto de esta función es invocada.
- `[in] data`: Contexto de datos proporcionado por el usuario. Este será pasado de nuevo a la función cuando se invoque luego.
- `[out] result`: `napi_value` que representa la función objeto de JavaScript para la nueva función creada.

Devuelve `napi_ok` si la API fue exitosa.

Esta API permite al autor de un complemento crear una función objeto en código nativo. Este es el mecanismo primario para permitir llamar *al* código nativo del complemento *desde* JavaScript.

*Note*: The newly created function is not automatically visible from script after this call. En cambio, una propiedad debe estar explícitamente establecida en cualquier objeto que sea visible para JavaScript, para que la función sea accesible desde el script.

Para exponer una función como parte de las exportaciones del módulo del complemento, configure la nueva función creada en el objeto de exportaciones. Un módulo de muestra puede verse de la siguiente manera:
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

Dado el código anterior, el complemento puede ser utilizado desde JavaScript como sigue:
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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] cbinfo`: La información del callback pasada a la función callback.
- `[in-out] argc`: Especifica el tamaño del arreglo `argv` proporcionado y recibe el conteo de argumentos verdadero.
- `[out] argv`: El buffer en el que se copian los `napi_value` que representan los argumentos. Si hay más argumentos que el conteo proporcionado, sólo se copia el número solicitado de argumentos. Si se proporcionan menos argumentos de los que se afirman, el resto de `argv` se llena con valores `napi_value` que representan `undefined`.
- `[out] this`: Recibe el argumento `this` de JavaScript para la llamada.
- `[out] data`: Recibe el apuntador de datos para el callback.

Devuelve `napi_ok` si la API fue exitosa.

Este método es utilizado a través de una función callback para recuperar detalles sobre la llamada, como los argumentos y el apuntador `this` desde la información de callback dada.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] cbinfo`: La información del callback pasada a la función callback.
- `[out] result`: El `new.target` de la llamada constructora.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el `new.target` de la llamada constructora. Si el callback actual no es una llamada constructora, el resultado es `NULL`.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] cons`: `napi_value` que representa la función de JavaScript a ser invocada como una constructora.
- `[in] argc`: El conteo de elementos en el arreglo `argv`.
- `[in] argv`: Arreglo de valores de JavaScript como `napi_value` que representa los argumentos para la constructora.
- `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto, el cual, en este caso, es el objeto constructor.

Este método es utilizado para instanciar un nuevo valor de JavaScript usando un `napi_value` dado que representa al constructor para el objeto. Por ejemplo, considere el siguiente fragmento de código:
```js
function MyObject(param) {
  this.param = param;
}

const arg = 'hello';
const value = new MyObject(arg);
```

El siguiente se puede aproximar en N-API utilizando el fragmento de código que sigue:
```C
// Obtener la función constructora MyObject
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

N-API ofrece una forma de "envolver" las instancias y clases de C++ para que los métodos y la clase constructora puedan ser llamados desde JavaScript.

 1. La API [`napi_define_class`][] define una clase de JavaScript con constructor, propiedades y métodos estáticos, y propiedades y métodos de instancias que corresponden a la clase C++.
 2. Cuando el código de JavaScript invoca al constructor, la callback del constructor utiliza [`napi_wrap`][] para envolver una nueva instancia de C++ en un objeto de JavaScript, entonces devuelve al objeto de envoltura.
 3. Cuando el código de JavaScript invoca un método o accesor a la propiedad en la clase, se invoca la función `napi_callback` de C++ correspondiente. Para una callback de instancia, [`napi_unwrap`][] obtiene la instancia de C++ que es el objetivo de la llamada.

Para los objetos envueltos puede ser difícil distinguir entre una función llamada sobre una clase prototipo, y una función llamada sobre una instancia de una clase. Un patrón común utilizado para abordar este problema es guardar una referencia persistente a la clase constructora para posteriores verificaciones `instanceof`.

Como ejemplo:

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

 - `[in] env`: El entorno bajo el que la API se invoca.
 - `[in] utf8name`: Nombre de la función constructora de JavaScript; no se requiere que este sea el mismo que el nombre de la clase de C++, aunque es recomendado para mayor claridad.
 - `[in] length`: La longitud en bytes de utf8name, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
 - `[in] constructor`: Función callback que maneja la construcción de instancias de la clase. (Este debe ser un método estático en la clase, no una verdadera función constructora de C++)
 - `[in] data`: Datos opcionales a ser pasados al callback de la constructora como la propiedad `data` de la información del callback.
 - `[in] property_count`: Número de elementos en el argumento del arreglo `properties`.
 - `[in] properties`: Arreglo de descriptores de propiedad que describen propiedades de datos estáticos y de instancia, accesores, y métodos en la clase. Véase `napi_property_descriptor`.
 - `[out] result`: Un `napi_value` que representa a la función constructora para la clase.

Devuelve `napi_ok` si la API fue exitosa.

Define una clase de Javascript que corresponde a una clase de C++, incluyendo:
 - Una función constructora de JavaScript que tiene el nombre de la clase e invoca al callback del constructor de C++ proporcionado.
 - Propiedades sobre la función constructora que corresponden a propiedades de datos _estáticos_, acceso, y métodos de la clase de C++ (definidos por descriptores de propiedad con el atributo `napi_static`).
 - Propiedades sobre el objeto `prototype` de la función constructora que corresponden a propiedades de datos _no estáticos_, accesores, y métodos de la clase de C++ (definidos por los descriptores de propiedad sin el atributo `napi_static`).

El callback del constructor de C++ debe se un método estático sobre la clase que llama a la verdadera clase constructora, entonces envuelve la nueva instancia de C++ en un objeto de JavaScript, y devuelve un objeto envuelto. Véase `napi_wrap()` para más detalles.

La función constructora de JavaScript devuelta desde [`napi_define_class`][] es usualmente guardada y utilizada luego, para construir nuevas instancias de la clase desde código nativo, y/o verificar si los valores proporcionados son instancias de la clase. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

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

 - `[in] env`: El entorno bajo el que la API se invoca.
 - `[in] js_object`: El objeto de JavaScript que será envuelto por el objeto nativo. Este objeto _debe_ haber sido creado desde el `prototype` de un constructor que fue creado utilizando `napi_define_class()`.
 - `[in] native_object`: La instancia nativa que será envuelta en el objeto de JavaScript.
 - `[in] finalize_cb`: Callback nativo opcional que puede ser utilizado para liberar a la instancia nativa cuando el objeto de JavaScript esté listo para la recolección de basura.
 - `[in] finalize_hint`: Sugerencia contextual opcional que es pasada a la callback de finalización.
 - `[out] result`: Referencia opcional al objeto envuelto.

Devuelve `napi_ok` si la API fue exitosa.

Envuelve una instancia nativa en un objeto de JavaScript. La instancia nativa puede ser recuperada luego utilizando `napi_unwrap()`.

Cuando un código de JavaScript invoca a un constructor para la clase que fue definida utilizando `napi_define_class()`, el `napi_callback` para el constructor es invocado. Luego de construir una instancia de la clase nativa, el callback debe llamar entonces a `napi_wrap()` para envolver a la instancia recientemente construida en el ya creado objeto de JavaScript que es el argumento `this` del callback del constructor. (Ese objeto `this` fue creado desde el `prototype` de la función constructora, entonces ya tiene definiciones de todas las propiedades y métodos de instancia.)

Normalmente, al envolver una instancia de clase, se debe proporcionar un callback de terminación que simplemente elimine la instancia nativa que se recibe como el argumento `data` para el callback de terminación.

La referencia opcional devuelta es, inicialmente, una referencia débil, lo que significa que tiene una cuenta de referencia de 0. Normalmente, esta cuenta de referencia se incrementará temporalmente durante operaciones asíncronas que requieren que la instancia permanezca válida.

*Precaución*: La referencia opcional devuelta (si se obtiene) debe ser eliminada por medio de [`napi_delete_reference`][] SOLO en respuesta a la invocación del callback de terminación. (Si es eliminada antes de eso, entonces puede que el callback de terminación nunca sea invocado.) Por lo tanto, cuando se obtiene una referencia, también se requiere un callback de terminación para permitir la apropiada corrección de la referencia.

*Nota*: Esta API puede modificar la cadena de prototipo del objeto envoltorio. Después, la manipulación adicional de la cadena de prototipo del envoltorio puede ocasionar la falla de `napi_unwrap()`.

Llamar a napi_unwrap() por segunda vez en un objeto devolverá un error. Para asociar otra instancia nativa con el objeto, utilice primero napi_remove_wrap().

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

 - `[in] env`: El entorno bajo el que la API se invoca.
 - `[in] js_object`: El objeto asociado con la instancia nativa.
 - `[out] result`: Apuntador a la instancia nativa envuelta.

Devuelve `napi_ok` si la API fue exitosa.

Recupera una instancia nativa que estaba envuelta previamente en un objeto de JavaScript usando `napi_wrap()`.

Cuando el código de JavaScript invoca un método o un accesor de propiedad en la clase, el `napi_callback` correspondiente es invocado. Si el callback es para un método o accesor de instancia, entonces el argumento `this` al callback es el objeto envoltorio; la instancia de C++ envuelta que es el objetivo de la llamada se puede obtener llamando a `napi_unwrap()` en el objeto envoltorio.

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

 - `[in] env`: El entorno bajo el que la API se invoca.
 - `[in] js_object`: El objeto asociado con la instancia nativa.
 - `[out] result`: Apuntador a la instancia nativa envuelta.

Devuelve `napi_ok` si la API fue exitosa.

Recupera una instancia nativa que estaba envuelta previamente en el objeto de JavaScript `js_object` usando `napi_wrap()` y remueve la envoltura, restaurando así la cadena de prototipos del objeto de JavaScript. Si un callback de terminación estaba asociado con la envoltura, ya no será llamado cuando el objeto de JavaScript se convierta en basura de recolección.

## Operaciones Asíncronas Simples

Los módulos complementarios a menudo necesitan aprovechar ayudantes asíncronos de libuv como parte de su implementación. Esto les permite programar el trabajo a ser ejecutado de manera asíncrona, de modo que sus métodos puedan regresar antes de que se complete el trabajo. Esto es importante para que puedan evitar el bloqueo total de la ejecución de la aplicación de Node.js.

N-API proporciona una interfaz ABI estable para estas funciones de soporte que cubren los casos de uso asíncrono más comunes.

N-API define la estructura `napi_work` que es utilizada para administrar los workers asíncronos. Las instancias son creadas/eliminadas con [`napi_create_async_work`][] y [`napi_delete_async_work`][].

Los callbacks `execute` y `complete` son funciones que serán invocadas cuando el ejecutor esté preparado para ejecutar y cuando complete su tarea, respectivamente. Estas funciones implementan las siguientes interfaces:

```C
typedef void (*napi_async_execute_callback)(napi_env env,
                                            void* data);
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```


Cuando se invoquen estos métodos, el parámetro `data` pasado será el dato void* proporcionado por el complemento que se pasó a la llamada `napi_create_async_work`.

Una vez creado, el worker asíncrono puede ponerse en la cola para la ejecución utilizando la función [`napi_queue_async_work`][]:

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

[`napi_cancel_async_work`][] puede ser utilizado si el trabajo necesita ser cancelado antes de que haya iniciado la ejecución.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] async_resource`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles async_hooks [`init` hooks][].
- `[in] async_resource_name`: Identificador para el tipo de recurso que está siendo proporcionado para la información de diagnóstico expuesta por la API `async_hooks`.
- `[in] execute`: La función nativa que debe ser llamada para ejecutar la lógica de forma asíncrona. La función dada es llamada desde un hilo de un pool de workers y se puede ejecutar en paralelo con el hilo del bucle de evento principal.
- `[in] complete`: La función nativa que será llamada cuando la lógica asíncrona esté completa o cancelada. La función dada es llamada desde el hilo del bucle del evento principal.
- `[in] data`: Contexto de datos proporcionado por el usuario. Este será pasado de vuelta a las funciones de ejecución y completación.
- `[out] result`: `napi_async_work*` que es el manejador del trabajo asíncrono recientemente creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto de trabajo que es utilizado para ejecutar la lógica de manera asíncrona. Se debe liberar utilizando [`napi_delete_async_work`][] una vez que el trabajo ya no sea requerido.

`async_resource_name` debe ser una cadena codificada en UTF-8 y terminada en null.

*Nota*: El identificador `async_resource_name` es proporcionado por el usuario y debe ser representativo del tipo de trabajo asíncrono que se está realizando. También es recomendado aplicar espaciado de nombres al identificador, por ejemplo, incluyendo el nombre del módulo. Vea la [documentación de `async_hooks`] [async_hooks `type`] para más información.

### napi_delete_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] work`: El handle devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API libera un objeto de trabajo previamente asignado.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

### napi_queue_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] work`: El manejador devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API solicita que el trabajo asignado previamente sea programado para ejecución.

### napi_cancel_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] work`: El manejador devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cancela el trabajo en cola, si no ha sido iniciado aún. Si ya comenzaron a ejecutarse, no puede ser cancelado y se devolverá `napi_generic_failure`. Si es exitoso, el callback `complete` será invocado con un valor de estado de `napi_cancelled`. El trabajo no debe ser eliminado antes de la invocación del callback `complete`, incluso si fue cancelado de manera exitosa.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] async_resource`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identificador para el tipo de recurso que está siendo proporcionado para la información de diagnóstico expuesta por la API `async_hooks`.
- `[out] result`: El contexto asíncrono inicializado.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] async_context`: El contexto asíncrono a ser destruido.

Devuelve `napi_ok` si la API fue exitosa.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
- `[in] recv`: El objeto `this` pasado a la función llamada.
- `[in] func`: `napi_value` que representa la función de JavaScript a ser invocada.
- `[in] argc`: El conteo de elementos en el arreglo `argv`.
- `[in] argv`: Arreglo de valores de JavaScript como `napi_value` que representan los argumentos para la función.
- `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite a una función objeto de JavaScript ser llamada desde un complemento nativo. Esta API es similar a `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). Es una envoltura bastante simple alrededor de `node::MakeCallback`.

Tenga en cuenta que *no* es necesario utilizar `napi_make_callback` desde dentro de un `napi_async_complete_callback`; en esa situación, el contexto asíncrono del callback ya se ha configurado, por lo que una llamada directa a `napi_call_function` es apropiada y suficiente. La utilización de la función `napi_make_callback` puede ser requerida cuando se implementa un comportamiento asíncrono personalizado que no usa `napi_create_async_work`.

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
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] async_resource`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles async_hooks [`init` hooks][].
- `[in] context`: Contexto para la operación asíncrona que está invocando al callback. Este debe ser un valor obtenido previamente de [`napi_async_init`][].
- `[out] result`: El ámbito recientemente creado.

Existen casos (por ejemplo resolver promesas) en los que es necesario tener el equivalente del ámbito asociado con el callback en el lugar cuando se realizan ciertas llamadas N-API.  Si no hay otro script en la pila, las funciones [`napi_open_callback_scope`][] y [`napi_close_callback_scope`][] pueden ser utilizadas para abrir/cerrar el ámbito requerido.

### *napi_close_callback_scope*
<!-- YAML
added: v8.11.2
napiVersion: 3
-->
```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```
- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: El ámbito a ser cerrado.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] version`: Un puntero a la información de versión para Node en sí.

Devuelve `napi_ok` si la API fue exitosa.

Esta función rellena la estructura de `version` con la versión principal, secundaria y de parche de Node.js que se está ejecutando, y el campo `release` con el valor de [`process.release.name`][`process.release`].

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: La versión más alta soportada de N-API.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve la versión más altade N-API soportada por el tiempo de ejecución de Node.js. Está previsto que N-API sea aditiva, de modo que las versiones más recientes de Node.js puedan soportar funciones API adicionales. Para permitir que un complemento utilice una función más nueva cuando se ejecuta con versiones de Node.js que lo soportan, al mismo tiempo que se proporciona un comportamiento alternativo cuando se ejecuta con versiones de Node.js que no lo soportan:

* Llamar a `napi_get_version()` para determinar si la API está disponible.
* Si está disponible, cargar de forma dinámica un apuntador a la función utilizando `uv_dlsym()`.
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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] change_in_bytes`: El cambio en la memoria asignada externamente que se mantiene activa por los objetos de JavaScript.
- `[out] result`: El valor ajustado

Devuelve `napi_ok` si la API fue exitosa.

Esta función le da a V8 una indicación de la cantidad de memoria asignada externamente que se mantiene activa por los objetos de JavaScript (por ejemplo, objeto de JavaScript que apunta a su propia memoria asignada por el módulo nativo.). El registro de la memoria asignada externamente activará recolecciones de basura global con más frecuencia de lo que lo haría de otra manera.

<!-- it's very convenient to have all the anchors indexed -->
<!--lint disable no-unused-definitions remark-lint-->
## Promesas

N-API proporciona facilidades para crear objetos `Promise` como se describen en la [Sección 25.4](https://tc39.github.io/ecma262/#sec-promise-objects) de la especificación ECMA. Implementa promesas como un par de objetos. Cuando una promesa es creada por `napi_create_promise()`, se crea un objeto "diferido" y se devuelve junto con la `Promise`. El objeto diferido está vinculado a la `Promise` creada y es el único medio para resolver o rechazar la `Promise` utilizando `napi_resolve_deferred()` o `napi_reject_deferred()`. El objeto diferido que es creado por `napi_create_promise()` es liberado por `napi_resolve_deferred()` o `napi_reject_deferred()`. El objeto `Promise` puede ser devuelto a JavaScript, donde puede ser utilizado de la manera habitual.

Por ejemplo, para crear una promesa y pasarla a un worker asíncrono:
```c
napi_deferred deferred;
napi_value promise;
napi_status status;


// Crear la promesa.
status = napi_create_promise(env, &deferred, &promise);
if (status != napi_ok) return NULL;

// Pasa al diferido a una función que realiza una acción asíncrona.
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

// Resuelve o rechaza la promesa asociada con el diferido, según 
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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] deferred`: Un objeto diferido creado recientemente que luego puede ser pasado a `napi_resolve_deferred()` o `napi_reject_deferred()` para resolver la respuesta. rechazar la promesa asociada.
- `[out] promise`: La promesa de JavaScript asociada con el objeto diferido.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] deferred`: El objeto diferido cuya promesa asociada se resolverá.
- `[in] resolution`: El valor con el cual resolver la promesa.

Esta API resuelve una promesa de JavaScript a través del objeto diferido con el cual está asociada. Por lo tanto, sólo puede ser utilizada para resolver promesas de JavaScript para las cuales esté disponible el objeto diferido correspondiente. Esto significa, efectivamente, que la promesa debe haber sido creada utilizando `napi_create_promise()` y el objeto diferido devuelto de esa llamada debe haber sido retenido para ser pasado a esta API.

El objeto diferido es liberado una vez completado con éxito.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] deferred`: El objeto diferido cuya promesa asociada se resolverá.
- `[in] rejection`: El valor con el cual se rechazará la promesa.

Esta API rechaza una promesa de JavaScript a través del objeto diferido al cual está asociada. Por lo tanto, sólo puede ser utilizada para rechazar promesas de JavaScript para las cuales esté disponible el objeto diferido correspondiente. Esto significa, efectivamente, que la promesa debe haber sido creada utilizando `napi_create_promise()` y el objeto diferido devuelto de esa llamada debe haber sido retenido para ser pasado a esta API.

El objeto diferido es liberado una vez completado con éxito.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] promise`: La promesa a examinar
- `[out] is_promise`: Bandera que indica si `promise` es un objeto de promesa nativo, es decir, un objeto de promesa creado por el motor subyacente.

## Ejecución del script

N-API proporciona una API para ejecutar una cadena que contiene JavaScript utilizando el motor subyacente de JavaScript.

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

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] script`: Una cadena de JavaScript que contiene el script a ejecutar.
- `[out] result`: El valor que resulta de haber ejecutado el script.

## bucle de eventos de libuv

N-API proporciona una función para obtener el bucle de evento actual asociado con un `napi_env` específico.

### napi_get_uv_event_loop
<!-- YAML
added: v8.10.0
napiVersion: 2
-->
```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               uv_loop_t** loop);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] loop`: La instancia actual del bucle libuv.

## Asynchronous Thread-safe Function Calls

> Estabilidad: 1 - Experimental

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

> Estability: 2 - Estable

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

- `[in] env`: El entorno bajo el que la API se invoca.
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

> Estability: 2 - Estable

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

> Estability: 2 - Estable

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

> Estability: 2 - Estable

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

> Estability: 2 - Estable

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

> Estability: 2 - Estable

<!-- YAML
added: v8.16.0
-->
```C
NAPI_EXTERN napi_status
napi_ref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] func`: The thread-safe function to reference.

This API is used to indicate that the event loop running on the main thread should not exit until `func` has been destroyed. Similar to [`uv_ref`][] it is also idempotent.

This API may only be called from the main thread.

### napi_unref_threadsafe_function

> Estability: 2 - Estable

<!-- YAML
added: v8.16.0
-->
```C
NAPI_EXTERN napi_status
napi_unref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] func`: The thread-safe function to unreference.

This API is used to indicate that the event loop running on the main thread may exit before `func` is destroyed. Similar to [`uv_unref`][] it is also idempotent.

This API may only be called from the main thread.
