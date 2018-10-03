# N-API

<!--introduced_in=v7.10.0-->

<!-- type=misc -->

> Estabilidad: 2 - Estable

N-API (pronunciando N como la letra, seguido por API) es una API para crear complementos nativos. Es independiente del tiempo de ejecución subyacente de JavaScript (por ejemplo, V8) y se mantiene como parte de Node.js. Esta API será una Interfaz Binaria de Aplicación (ABI) estable entre versiones de Node.js. Está diseñado para aislar los complementos de los cambios del motor subyacente de JavaScripts y permitir que los módulos compilados para una versión se ejecuten en versiones posteriores de Node.js sin compilación.

Los complementos son programados y empaquetados con el mismo enfoque y herramientas descritos en la sección titulada [Complementos de C++](addons.html). La única diferencia es el conjunto de APIs que son utilizadas por el código nativo. En lugar de utilizar V8 o las APIs [Abstracciones Nativas para Node.js](https://github.com/nodejs/nan), se utilizan las funciones disponibles en la N-API.

Las APIs expuestas por la N-API son, generalmente, utilizadas para crear y manipular valores de JavaScript. Los conceptos y operaciones, generalmente, mapean hacia ideas especificadas en las especificaciones del lenguaje ECMA262. Las APIs tienen las siguientes propiedades:

- Todas las llamadas a N-API devuelven un código de estado del tipo `napi_status`. Este estado indica si la llamada a la API fue exitosa o no.
- El valor retornado por la API se pasa a través de un parámetro de salida.
- Todos los valores de JavaScript se abstraen detrás de un tipo opaco llamado `napi_value`.
- En caso de un estado de error, se puede obtener información adicional utilizando `napi_get_last_error_info`. Se puede encontrar más información en la sección de manejo de errores [Manejo de Errores](#n_api_error_handling).

La N-API es una C API que garantiza la estabilidad de la ABI a través de las versiones y los diferentes niveles de compilación de Node.js. Sin embargo, también entendemos que una API de C++ puede ser más fácil de usar en muchos casos. Para apoyar estos casos, esperamos que existan uno o más módulos de envoltura de C++ que provean una API de C++ inlineable. Los binarios construidos con estos módulos de envoltura dependerán de los símbolos para las funciones basadas en N-API exportadas por Node.js. Estas envolturas no son parte de la N-API, ni se mantendrán como parte de Node.js. Un ejemplo es: [node_addon_api](https://github.com/nodejs/node-addon-api).

Para poder utilizar las funciones de N-API, incluir el archivo [`node_api.h`](https://github.com/nodejs/node/blob/master/src/node_api.h) que se encuentra en el directorio src en el árbol de nodos de desarrollo:

```C
#include <node_api.h>
```

## Tipos Básicos de Datos de N-API

N-API expone los siguientes tipos de datos fundamentales como abstracciones que son consumidas por las diversas APIs. Estas APIs deben tratarse como opacas, sólo siendo posible una revisión introspectiva mediante otras llamadas N-API.

### napi_staus

Código de estado integral que indica el éxito o fracaso de una llamada N-API. Actualmente, los siguientes códigos de estado son admitidos.

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
  napi_callback_scope_mismatch
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
- `engine_error_code`: código de error específico de la VM. Actualmente no está implementado para ninguna VM.
- `error_code`: El código de estado de la N-API que se originó con el último error.

Mira la sección [Manejo de Errores](#n_api_error_handling) para información adicional.

### napi_env

`napi_env` es utilizada para representar un contexto que la implementación de N-API subyacente puede utilizar para persistir en un estado específico de la VM. Esta estructura es pasada a funciones nativas cuando son invocadas y debe ser pasada devuelta cuando se hacen llamadas N-API. Específicamente, el mismo `napi_env` que fue pasado cuando la función nativa inicial fue llamada debe ser pasado a cualquier llamada N-API subsecuente anidada. El almacenamiento en caché de `napi_env` para el propósito de reutilización general no está permitido.

### napi_value

Este es un apuntador opaco que se utiliza para representar un valor de JavaScript.

### Tipos de Gestión de Memoria de N-API

#### napi_handle_scope

Esta es una abstracción utilizada para controlar y modificar el tiempo de vida de objetos creados dentro de un ámbito particular. En general, los valores N-API son creados dentro de un contexto de ámbito controlado. Cuando se llama a un método nativo de JavaScript, existirá un ámbito controlado por defecto. Si el usuario no crea explícitamente un nuevo ámbito controlado, los valores N-API serán creados en el ámbito controlado por defecto. Para cualquier invocación de código fuera de la ejecución de un método nativo (por ejemplo, durante una invocación a la llamada libuv), el módulo es requerido para crear el ámbito antes de invocar cualquier función que pueda resultar en la creación de valores JavaScript.

Los ámbitos controlados con creados utilizando [`napi_open_handle_scope`][] y son destruidos utilizando [`napi_close_handle_scope`][]. El cierre del ámbito puede indicar al GC que todos los `napi_value`s creados durante el tiempo de vida del alcance controlado ya no son referenciados desde el stack frame actual.

Para más detalles, revisar la [Gestión de tiempo de vida del objeto](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope

Los ámbitos controlados escapables son un tipo especial de ámbitos controlados para devolver al ámbito padre valores creados dentro de un ámbito controlado particular.

#### napi_ref

Esta es la abstracción utilizada para referenciar a `napi_value`. Este permite que los usuarios puedan controlar el tiempo de vida de los valores JavaScript, incluyendo la definición de sus tiempos de vida mínimos de forma explícita.

Para más detalles, revisar la [Gestión de tiempo de vida del objeto](#n_api_object_lifetime_management).

### Tipos de devolución de llamadas N-API

#### napi_callback_info

Tipo de dato opaco que se pasa a una función de callback. Puede ser utilizado para obtener información adicional sobre el contexto en el que el callback fue invocada.

#### napi_callback

Tipo de función puntero para las funciones nativas provistas por el usuario que son expuestas a JavaScript por medio de N-API. Los callbacks deben satisfacer la siguiente firma:

```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize

Tipo de función puntero para funciones provistas por los complementos que permiten al usuario ser notificado cuando datos de dominio externo están listos para ser limpiados porque el objeto al que estaban asociados fue clasificado como basura. El usuario debe suministrar una función que satisfaga la siguiente firma, que sería invocada tras la recolección del objetos. Actualmente, `napi_finalize` puede ser utilizado para averiguar cuándo los objetos que tienen datos externos son tomados.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```

#### napi_async_execute_callback

Función puntero utilizada con funciones que soportan operaciones asincrónicas. Las devoluciones de llamadas deben satisfacer la siguiente firma:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

#### napi_async_complete_callback

Función puntero utilizada con funciones que soportan operaciones asincrónicas. Las devoluciones de llamadas deben satisfacer la siguiente firma:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

## Manejo de Errores

N-API utiliza valores de retorno y excepciones de JavaScript para el manejo de errores. Las siguientes secciones explican la aproximación a cada caso.

### Valores de retorno

Todas las funciones de N-API comparten el mismo patrón de manejo de errores. El tipo de retorno de todas las funciones API es `napi_status`.

El valor de retorno será `napi_ok` si la petición fue exitosa y no se arrojó ninguna excepción de no-captura de JavaScript. Si ha ocurrido un error y una excepción fue arrojada, el valor de `napi_status` para el error será devuelto. Si una excepción fue arrojada y no ocurrió ningún error, `napi_pending_exception` será devuelto.

En los casos donde un valor de retorno distinto a `napi_ok` o `napi_is_exception_pending` sea devuelto, [`napi_is_exception_pending`][] debe ser llamado para verificar si una hay una excepción pendiente. Vea la sección sobre las excepciones para más detalles.

Todo el conjunto de valores posibles `napi_status` está definido en `napi_api_types.h`.

El valor de retorno `napi_status` proporciona una representación del error ocurrido, independiente de la VM. En algunos casos es útil poder conseguir más información detallada, incluyendo una cadena que representa al error, así como información específica del motor de la VM.

Con el fin de recuperar esta información, el [`napi_get_last_error_info`][] es proporcionado, el cual devuelve una estructura `napi_extended_error_info`. El formato de la estructura `napi_extended_error_info` es de la siguiente manera:

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

No confíe en el contenido o formato de ninguna información extendida, ya que no está sujeta a SemVer y puede cambiar en cualquier momento. Está diseñado sólo para propósitos de registro.

#### napi_get_last_error_info

<!-- YAML
added: v8.0.0
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

El contenido devuelto por `napi_extended_error_info` es válido sólo hasta que una función N-Api es llamada en el mismo `env`.

No confíe en el contenido o formato de ninguna información extendida, ya que no está sujeta a SemVer y puede cambiar en cualquier momento. Está diseñado sólo para propósitos de registro.

Esta API puede ser llamada incluso si existe una excepción pendiente de JavaScript.

### Excepciones

Cualquier llamada a una función N-API puede resultar en una excepción pendiente de JavaScript. Este es, obviamente, el caso para cualquier función que pueda causar la ejecución de JavaScript, pero N-API especifica que una excepción puede estar pendiente al ser devuelta por cualquier función de la API.

Si el `napi_status` devuelto por una función es `napi_ok` entonces no hay excepciones pendientes y no se requieren acciones adicionales. Si el `napi_status` devuelto es cualquiera distinto a`napi_ok` o `napi_pending_exception`, para tratar de recuperar y continuar, en lugar de simplemente retornar inmediatamente, [`napi_is_exception_pending`][] debe ser llamada para determinar si una excepción está pendiente o no.

Cuando una excepción está pendiente, uno de dos enfoques puede ser empleado.

El primer enfoque es realizar una limpieza apropiada y luego regresar, así la ejecución regresará a JavaScript. Como parte de la transición de regreso a JavaScript, la excepción se arrojará en el punto, en el código de JavaScript, en el que el método nativo fue invocado. El comportamiento de la mayoría de las llamadas N-API no se especifica mientras hay una excepción pendiente y muchas simplemente regresarán `napi_pending_exception`, así que es importante hacer lo menos posible y regresar a JavaScript, donde la excepción puede ser manejada.

El segundo enfoque es intentar manejar la excepción. Habrá casos en los que el código nativo pueda capturar la excepción, tomar la acción apropiada y luego continuar. Esto sólo es recomendado en casos específicos donde se sabe que la excepción puede ser manejada de forma segura. En estos casos [`napi_get_and_clear_last_exception`][] puede ser utilizada para obtener y eliminar la excepción. En caso de éxito, el resultado contendrá el handle hacia el último `Object` de JavaScript arrojado. Si se determina que, luego de recuperar la excepción, esta no puede ser manejada después de todo, puede ser arrojada de nuevo con [`napi_throw`][] donde el error es el objeto JavaScript `Error` que se lanzará.

Las siguientes funciones de utilidad también están disponibles en caso de que el código nativo necesite soltar una excepción o determinar si un `napi_value` es una instancia de un objeto `Error` de JavaScript: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] y [`napi_is_error`][].

Las siguientes funciones de utilidad también están disponibles en caso de que el código nativo necesite crear un objeto `Error`: [`napi_create_error`][], [`napi_create_type_error`][], y [`napi_create_range_error`][], donde el resultado es el `napi_value` que se refiere al recientemente creado objeto `Error` de JavaScript.

El proyecto Node.js está agregando códigos de error a todos los errores generados internamente. La meta es que las aplicaciones utilicen estos códigos de error para todas las comprobaciones de errores. Los mensajes de error asociados permanecerán, pero sólo se utilizará para el registro y la visualización, con la expectativa de que el mensaje pueda cambiar sin aplicar SemVer. Para soportar este modelo con N-API en funcionalidad interna y funcionalidad específica por módulo (como buena práctica), las funciones `throw_` y `create_` toman un parámetro opcional de código que es la cadena, para el código, que se agregará al objeto error. Si el parámetro opcional es NULL, entonce ningún código será asociado con el error. Si se proporciona el código, el nombre asociado con el error también se actualiza para ser:

```text
originalName [code]
```

donde `originalName` es el nombre original asociado con el error y `code` es el código proporcionado. Por ejemplo, si el código es `'ERR_ERROR_1'` y un `TypeError` está siendo creado, el nombre será:

```text
TypeError [ERR_ERROR_1]
```

#### napi_throw

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw(napi_env env, napi_value error);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] error`: El valor JavaScript a ser arrojado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API arroja el valor JavaScript proporcionado.

#### napi_throw_error

<!-- YAML
added: v8.0.0
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

Esta API suelta un `Error` de JavaScript con el texto proporcionado.

#### napi_throw_type_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_type_error(napi_env env,
                                              const char* code,
                                              const char* msg);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Código de error opcional a establecer en el error.
- `[in] msg`: Cadena de C que representa el texto a asociar con el error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API suelta un `TypeError` de JavaScript con el texto proporcionado.

#### napi_throw_range_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_throw_range_error(napi_env env,
                                               const char* code,
                                               const char* msg);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: Código de error opcional a establecer en el error.
- `[in] msg`: Cadena de C que representa el texto a asociar con el error.

Devuelve `napi_ok` si la API fue exitosa.

Esta API suelta un `RangeError` de JavaScript con el texto proporcionado.

#### napi_is_error

<!-- YAML
added: v8.0.0
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
-->

```C
NODE_EXTERN napi_status napi_create_error(napi_env env,
                                          napi_value code,
                                          napi_value msg,
                                          napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: `napi_value` opcional con la cadena para el código de error a ser asociado con el error.
- `[in] msg`: `napi_value` que se refiere a una `String` JavaScript a ser utilizado como el mensaje para el `Error`.
- `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un `Error` de JavaScript con el texto proporcionado.

#### napi_create_type_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_type_error(napi_env env,
                                               napi_value code,
                                               napi_value msg,
                                               napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: `napi_value` opcional con la cadena para el código de error a ser asociado con el error.
- `[in] msg`: `napi_value` que se refiere a una `String` JavaScript a ser utilizado como el mensaje para el `Error`.
- `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un `TypeError` de JavaScript con el texto proporcionado.

#### napi_create_range_error

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_range_error(napi_env env,
                                                napi_value code,
                                                const char* msg,
                                                napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] code`: `napi_value` opcional con la cadena para el código de error a ser asociado con el error.
- `[in] msg`: `napi_value` que se refiere a una `String` JavaScript a ser utilizado como el mensaje para el `Error`.
- `[out] result`: `napi_value` que representa al error creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un `RangeError` de JavaScript con el texto proporcionado.

#### napi_get_and_clear_last_exception

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: Si es uno, la excepción está pendiente; de otra forma es NULL.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve true si una excepción está pendiente.

Esta API puede se llamada incluso si existe una excepción pendiente de JavaScript.

#### napi_is_exception_pending

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: Valor Booleano que se establece true si una excepción está pendiente.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve true si una excepción está pendiente.

Esta API puede ser llamada incluso si existe una excepción pendiente de JavaScript.

#### napi_fatal_exception

<!-- YAML
added: v9.10.0
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] err`: El error que quieres pasar a `'uncaughtException'`.

Dispara un `'uncaughtException'` en JavaScript. Es útil si un callback asíncrono arroja un excepción sin manera de recuperarla.

### Errores Fatales

En el evento de un error no recuperable en un módulo nativo, un error fatal puede ser arrojado para terminar el proceso inmediatamente.

#### napi_fatal_error

<!-- YAML
added: v8.2.0
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

La llamada a la función no regresa, el proceso terminará.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

## Administración del Tiempo de Vida de los Objetos

A medida que se realizan llamadas N-API, los handles a objetos en el montón para la VM subyacente pueden ser devueltos como `napi_values`. Estos handles deben mantener "vivos" a los objetos hasta que ya no sean requeridos por el código nativo, de otra manera los objetos pueden ser recolectados antes de que el código nativo haya terminado de utilizarlos.

A medida que se devuelven los handles de los objetos, se asocian con un "ámbito". La vida útil para el ámbito por defecto está ligada a la vida útil de la llamada del método nativo. El resultado es que, por defecto, los handles permanecen válidos y los objetos asociados con estos handles se mantendrán vivos durante la vida útil de la llamada del método nativo.

En muchos casos, sin embargo, es necesario que los handles permanezcan válidos para una vida útil más corta o larga que la del método nativo. Las secciones siguientes describen las funciones N-API que pueden ser utilizadas para cambiar la de vida útil del handle desde la configuración predeterminada.

### Hacer a la vida útil del handle más corta que la vida útil del método nativo

A menudo es necesario hacer la vida útil de los handles más corto que la vida útil de un método nativo. Por ejemplo, considere un método nativo que tiene un bucle que itera a través de los elementos de un arreglo de gran tamaño:

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

Esto resultaría en la creación de un gran número de handles que consumen una cantidad sustancial de recursos. Además, aunque el código nativo sólo podría utilizar el handle más reciente, todos los objetos asociados podrían ser mantenidos vivos, ya que todos ellos comparten el mismo ámbito.

Para manejar este caso, N-API proporciona la capacidad de establecer un nuevo "ámbito" al que se asociarán los handles recientemente creados. Una vez que esos handles ya no sean requeridos, el ámbito puede ser "cerrado", con lo que los handles asociados con este serán invalidados. Los métodos disponibles para abrir/cerrar ámbitos son [`napi_open_handle_scope`][] y [`napi_close_handle_scope`][].

N-API sólo soporta una jerarquía de anidamiento único de ámbitos. Sólo hay un ámbito activo en cualquier momento y todos los nuevos handles serán asociados con ese ámbito mientras esté activo. Los ámbitos deben ser cerrados en el orden inverso al que fueron abiertos. Además, todos los ámbitos creados dentro de un método nativo deben ser cerrados antes de regresar de ese método.

Tomando el ejemplo anterior, añadir llamadas a [`napi_open_handle_scope`][] y [`napi_close_handle_scope`][] garantizaría que, como máximo, un único identificador sea válido durante la ejecución del bucle:

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

Al anidar ámbitos, hay casos en los que un handle de un ámbito interno necesita vivir más allá de la vida útil de ese ámbito. N-API soporta un "ámbito escapable" para soportar este caso. Un ámbito escapable permite que un handle sea "promovido" para "escapar" del ámbito actual, y la vida útil del handle cambia del ámbito actual al del ámbito externo.

Los métodos disponibles para abrir/cerrar ámbitos escapables son [`napi_open_escapable_handle_scope`][] y [`napi_close_escapable_handle_scope`][].

La solicitud para promover un handle se realiza a través de [`napi_escape_handle`][], el cual solo puede ser llamado una vez.

#### napi_open_handle_scope

<!-- YAML
added: v8.0.0
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
-->

```C
NODE_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: `napi_value` que representa al ámbito que será cerrado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cierra el ámbito pasado. Los ámbitos deben ser cerrados en el orden inverso al que fueron creados.

Esta API puede ser llamada incluso si existe una excepción pendiente de JavaScript.

#### napi_open_escapable_handle_scope

<!-- YAML
added: v8.0.0
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
-->

```C
NODE_EXTERN napi_status
    napi_close_escapable_handle_scope(napi_env env,
                                      napi_handle_scope scope);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: `napi_value` que representa al ámbito que será cerrado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cierra el ámbito pasado. Los ámbitos deben ser cerrados en el orden inverso en el que fueron creados.

Esta API puede ser llamada incluso si existe una excepción JavaScript pendiente.

#### napi_escape_handle

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_escape_handle(napi_env env,
                               napi_escapable_handle_scope scope,
                               napi_value escapee,
                               napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: `napi_value` que representa el ámbito actual.
- `[in] escapee`: `napi_value` que representa al `Object` de JavaScript que se escapará.
- `[out] result`: `napi_value` que representa al handle del `Object` en el ámbito externo del que se escapará.

Devuelve `napi_ok` si la API fue exitosa.

Esta API promueve al handle al objeto de JavaScript para que sea válido durante el tiempo de vida del ámbito externo. Sólo se puede llamar una vez por ámbito. Si es llamado más de una vez, se devolverá un error.

Esta API puede ser llamada incluso si existe una excepción pendiente de JavaScript.

### Referencias a objetos con vida útil más larga que la del método nativo

En algunos casos, un complemento necesitará poder crear y referenciar objetos con una vida útil más larga que la de una única invocación de un método nativo. Por ejemplo, para crear un constructor y luego utilizarlo en una solicitud para crear instancias, debe ser posible referenciar al objeto constructor a través de muchas diferentes peticiones de creación de instancias. Esto no sería posible con un handle normal regresado como un `napi_value` como se describe en la sección anterior. La vida útil de un handle normal es gestionada por ámbitos y, todos los ámbitos deben ser cerrados antes del final de un método nativo.

N-API proporciona métodos para crear referencias persistentes a un objeto. Cada referencia persistente tiene una recuento asociado con un valor de 0 o superior. El recuento determina si la referencia mantendrá vivo al objeto correspondiente. Las referencias con un conteo de 0 no impiden que el objeto sea tomado y, a menudo, se denominan referencias "débiles". Cualquier recuento mayor que 0 impedirá que el objeto sea tomado.

Las referencias pueden ser creadas con un recuento inicial de referencia. El recuento puede ser modificado a través de [`napi_reference_ref`][] y [`napi_reference_unref`][]. Si un objeto es tomado mientras el conteo para una referencia es 0, todas las llamadas subsecuentes para obtener al objeto asociado con la referencia [`napi_get_reference_value`][] devolverán NULL para el `napi_value` devuelto. Un intento de llamar a [`napi_reference_ref`][] para una referencia cuyo objeto ha sido tomado generará un error.

Las referencias deben ser eliminadas una vez que ya no sean requeridas por el complemento. Cuando una referencia es eliminada, ya no impedirá que el objeto correspondiente sea tomado. Una falla al eliminar una referencia persistente resultará en una "pérdida de memoria", conservándose para siempre la memoria nativa para la referencia persistente y el objeto correspondiente en el montón.

Puede haber múltiples referencias persistentes creadas que se refieren al mismo objeto, cada una de las cuales mantendrá vivo, o no, al objeto en función de sus conteos individuales.

#### napi_create_reference

<!-- YAML
added: v8.0.0
-->

```C
NODE_EXTERN napi_status napi_create_reference(napi_env env,
                                              napi_value value,
                                              int initial_refcount,
                                              napi_ref* result);
```

- `[in] env`: El entorno bajo el que se invoca a la API.
- `[in] value`: `napi_value` que representa el `Object` al que queremos hacer referencia.
- `[in] initial_refcount`: Recuento inicial de referencia para la nueva referencia.
- `[out] result`: `napi_ref` que apunta a la nueva referencia.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea una nueva referencia con el conteo de referencias especificado al `Object` pasado.

#### napi_delete_reference

<!-- YAML
added: v8.0.0
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
-->

```C
NODE_EXTERN napi_status napi_get_reference_value(napi_env env,
                                                 napi_ref ref,
                                                 napi_value* result);
```

el `napi_value passed` dentro o fuera de estos métodos es un handle para el objeto con el que se relaciona la referencia.

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] ref`: `napi_ref` para la cual solicitamos el correspondiente `Object`.
- `[out] result`: El `napi_value` para el `Object` referenciado por la `napi_ref`.

Devuelve `napi_ok` si la API fue exitosa.

Si aún es válido, esta API devuelve el `napi_value` que representa al `Object` JavaScript asociado con la `napi_ref`. De lo contrario, el resultado será NULL.

## Registro de Módulos

Los módulos N-API son registrados de forma similar a otros módulos, excepto que en lugar de utilizar la macro `NODE_MODULE`, se utiliza el siguiente:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

La siguiente diferencia es la firma para el método `Init`. Para un módulo de N-API, es como sigue:

```C
napi_value Init(napi_env env, napi_value exports);
```

El valor devuelto de `Init` es tratado como el objeto `exports` para el módulo. Al método `Init` se le pasa un objeto vacío, a través del parámetro `exports` como una conveniencia. Si `Init` devuelve NULL, el parámetro pasado como `exports` es exportado por el módulo. Los módulos N-API no pueden modificar el objeto `module`, pero pueden especificar cualquiera como la propiedad `exports` del módulo.

Para agregar el método `hello` como una función para que pueda ser llamada como un método proporcionado por el complemento:

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

Para definir una clase para que nuevas instancias puedan ser creadas (a menudo utilizadas con [Objeto Envuelto](#n_api_object_wrap)):

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

Si esperas que tu módulo sea cargado varias veces durante el tiempo de vida del proceso Node.js, puedes utilizar la macro `NAPI_MODULE_INIT` para inicializar tu módulo:

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

Esta macro incluye a `NAPI_MODULE`, y declara una función `Init` con un nombre especial y con visibilidad más allá del complemento. Esto permite que Node.js inicialice el módulo, incluso si es cargado varias veces.

Las variables `env` y `exports` estarán disponibles dentro del cuerpo de la función, siguiendo la invocación macro.

Para obtener más detalles sobre la configuración de propiedades en objetos, consulte la sección sobre [Trabajar con las Propiedades de JavaScript](#n_api_working_with_javascript_properties).

Para obtener más detalles sobre la construcción de módulos de complemento en general, consulte la API existente.

## Trabajar con las Propiedades de JavaScript

N-API expone un conjunto de APIs para crear todos los tipos de valores de JavaScript. Algunos de estos tipos están documentados bajo la [Sección 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

Fundamentalmente, estas APIs son utilizadas para realizar una de las siguientes acciones:

1. Crear un nuevo objeto de JavaScript
2. Convertir de un tipo primitivo de C a un valor de N-API
3. Convertir de un valor de N-API a un tipo primitivo de C
4. Obtener instancias globales que incluyen `undefined` y `null`

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

Describe el tipo de un `napi_value`. Esto, generalmente, corresponde a los tipos descritos en la [Sección 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) de las Especificaciones del Lenguaje ECMAScript. Además de los tipos en esa sección, el `napi_valuetype` también puede representar `Function`s y `Object`s con datos externos.

Un valor de JavaScript del tipo `napi_external` aparece en JavaScript como un objeto simple tal que no se pueden establecer propiedades en él, y ningún prototipo.

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

Esto representa el tipo de dato escalar binario subyacente del `TypedArray`. Algunos elementos de este enum corresponden a la [Sección 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

### Funciones de Creación de Objetos

#### napi_create_array

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[out] result`: Un `napi_value` que representa un `Array` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API que corresponde a un tipo de `Array` de JavaScript. Los arreglos de JavaScript se describen en la [Sección 22.1](https://tc39.github.io/ecma262/#sec-array-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_array_with_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_array_with_length(napi_env env,
                                          size_t length,
                                          napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] length`: La longitud inicial del `Array`.
- `[out] result`: Un `napi_value` que representa un `Array` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API que corresponde a un tipo de `Array` de JavaScript. La propiedad de longitud del `Array` se establece en el parámetro de longitud pasado. Sin embargo, la VM no garantiza que el buffer subyacente sea preasignado cuando se crea el arreglo; ese comportamiento se deja a la implementación de la VM subyacente. Si el buffer debe ser un bloque contiguo de memoria que pueda leer y/o escribir directamente desde C, considere utilizar [`napi_create_external_arraybuffer`][].

Los arreglos de JavaScript se describen en la [Sección 22.1](https://tc39.github.io/ecma262/#sec-array-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_arraybuffer(napi_env env,
                                    size_t byte_length,
                                    void** data,
                                    napi_value* result)
```

- `[in] env`: El entorno bajo el que se invoca la API.
- `[in] length`: La longitud en bytes del buffer de array a crear.
- `[out] data`: Apuntador al bytes buffer subyacente del `ArrayBuffer`.
- `[out] result`: El `napi_value` que representa un `ArrayBuffer` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un `ArrayBuffer` de JavaScript. Los `ArrayBuffer`s son utilizados para representar buffers de datos binarios de longitud fija. Normalmente se utilizan como un buffer de respaldo para objetos `TypedArray`. El `ArrayBuffer` asignado tendrá un byte buffer subyacente cuyo tamaño es determinado por el parámetro `length` que es pasado. El buffer subyacente se devuelve opcionalmente al llamador en caso de que quiera manipular el buffer directamente. Este buffer sólo se puede escribir directamente desde el código nativo. Para escribir en este buffer desde JavaScript, un typed array o un objeto `DataView` tendría que ser creado.

Los objetos `ArrayBuffer` de JavaScript se describen en la [Sección 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_buffer

<!-- YAML
added: v8.0.0
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
- `[out] result`: El `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer`. Si bien esta sigue siendo una estructura de datos totalmente compatible, en la mayoría de los casos será suficiente utilizar un `TypedArray`.

#### napi_create_buffer_copy

<!-- YAML
added: v8.0.0
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
- `[out] result_data`: Apuntador al nuevo buffer de datos subyacente del `Buffer`.
- `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer` y lo inicializa con los datos copiados del buffer pasado. Si bien esta sigue siendo una estructura de datos completamente compatible, en la mayoría de los casos será suficiente utilizar un `TypedArray`.

#### napi_create_external

<!-- YAML
added: v8.0.0
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

El valor creado no es un objeto y, por lo tanto, no admite propiedades adicionales. Es considerado un tipo de valor distinto: llamar a `napi_typeof()` con un valor externo produce una `napi_external`.

#### napi_create_external_arraybuffer

<!-- YAML
added: v8.0.0
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
- `[in] external_data`: Apuntador al byte buffer subyacente del `ArrayBuffer`.
- `[in] byte_length`: Longitud en bytes del buffer subyacente.
- `[in] finalize_cb`: Callback opcional para llamar cuando el `ArrayBuffer` esté siendo tomado.
- `[in] finalize_hint`: Sugerencia opcional para pasar al callback de terminación durante la recopilación.
- `[out] result`: El `napi_value` que representa un `ArrayBuffer` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un `ArrayBuffer` de JavaScript. El byte buffer subyacente del `ArrayBuffer` se asigna y administra de forma externa. El llamador debe asegurar que el byte buffer permanezca válido hasta que se llame a la callback de terminación.

Los `ArrayBuffer`s de JavaScript se describen en la [Sección 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_external_buffer

<!-- YAML
added: v8.0.0
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
- `[in] finalize_cb`: Callback opcional para llamar cuando el `ArrayBuffer` esté siendo tomado.
- `[in] finalize_hint`: Sugerencia opcional para pasar al callback de terminación durante la recopilación.
- `[out] result`: Un `napi_value` que representa un `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto `node::Buffer` y lo inicializa con los datos respaldados por el buffer pasado. Si bien esta sigue siendo una estructura de datos completamente compatible, en la mayoría de los casos será suficiente utilizar un `TypedArray`.

Para Node.js >=4 `Buffers` son `Uint8Array`s.

#### napi_create_function

<!-- YAML
added: v8.0.0
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
- `[in] length`: La longitud en bytes del `utf8name`, o `NAPI_AUTO_LENGTH` si tiene terminación en NULL.
- `[in] cb`: Un apuntador a la función nativa a ser invocada cuando la función creada se invoque desde JavaScript.
- `[in] data`: Datos de contexto arbitrario opcionales para pasar a la función nativa cuando se invoca.
- `[out] result`: Un `napi_value` que representa una función de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un objeto `Function` de JavaScript. Es utilizada para envolver funciones nativas para que puedan ser invocadas desde JavaScript.

Las `Function`s de JavaScript se describen en la [Sección 19.2](https://tc39.github.io/ecma262/#sec-function-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: un `napi_value` que representa un `Object` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un `Object` predeterminado de JavaScript. Es equivalente a realizar `new Object()` en JavaScript.

El tipo `Object` de JavaScript se describe en la [Sección 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) de las Especificaciones del Lenguaje de JavaScript.

#### napi_create_symbol

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] description`: `napi_value` opcional que hace referencia a una `String` de JavaScript que se establecerá como la descripción del símbolo.
- `[out] result`: Un `napi_value` que representa un `Symbol` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto `Symbol` de JavaScript desde una cadena de C codificada en UTF8.

El tipo `Symbol` de JavaScript se describe en la [Sección 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) de las Especificaciones del Lenguaje ECMAScripts.

#### napi_create_typedarray

<!-- YAML
added: v8.0.0
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
- `[in] type`: Tipo de dato escalar de los elementos dentro del `TypedArray`.
- `[in] length`: Número de elementos en el `TypedArray`.
- `[in] arraybuffer`: `ArrayBuffer` subyacente al typed array.
- `[in] byte_offset`: El byte offset dentro del `ArrayBuffer` desde el que se empieza a proyectar el `TypedArray`.
- `[out] result`: Un `napi_value` que representa un `TypedArray` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto `TypedArray` de JavaScript sobre un `ArrayBuffer` existente. Los objetos `TypedArray` proporcionan una vista similar a un arreglo sobre un buffer de datos subyacente donde cada elemento tiene el mismo tipo de datos escalares binarios subyacentes.

Es necesario que `(length * size_of_element) + byte_offset` sea <= el tamaño en bytes del arreglo pasado. Si no, una excepción `RangeError` es levantada.

Los objetos `TypedArray` de JavaScript se describen en la [Sección 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_create_dataview(napi_env env,
                                 size_t byte_length,
                                 napi_value arraybuffer,
                                 size_t byte_offset,
                                 napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] length`: Número de elementos en el `DataView`.
- `[in] arraybuffer`: `ArrayBuffer` subyacente al `DataView`.
- `[in] byte_offset`: El byte offset dentro del `ArrayBuffer` desde el que se empieza a proyectar el `DataView`.
- `[out] result`: Un `napi_value` que representa un `DataView` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto `DataView` de JavaScript sobre un `ArrayBuffer` existente. Los objetos `DataView` proporcionan una vista similar a un arreglo sobre un buffer de datos subyacente, pero uno que permite elementos de diferentes tamaños y tipos en el `ArrayBuffer`.

Es necesario que `byte_length + byte_offset` sea menor o igual que el tamaño en bytes del arreglo pasado. Si no, se levanta una excepción `RangeError`.

Los objetos `DataView` de JavaScript se describen en la [Sección 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) de las Especificaciones del Lenguaje ECMAScript.

### Funciones para convertir de tipos de C a N-API

#### napi_create_int32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor entero a ser representado en JavaScript.
- `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir del tipo `int32_t` de C al tipo `Number` de JavaScript.

El tipo `Number` de JavaScript se describe en la [Sección 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_uint32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor entero sin signo a representar en JavaScript.
- `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir del tipo `uint32_t` de C al tipo `Number` de JavaScript.

El tipo `Number` de JavaScript se describe en la [Sección 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_int64

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor entero a ser representado en JavaScript.
- `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para convertir el tipo `int64_t` de C al tipo `Number` de JavaScript.

El tipo `Number` de JavaScript se describe en la [Sección 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScript. Tenga en cuenta que el rango completo del `int64_t` no puede ser representado con total precisión en JavaScript. Los valores enteros fuera del rango de [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderán precisión.

#### napi_create_double

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: Valor de doble precisión a representar en JavaScript.
- `[out] result`: Un `napi_value` que representa un `Number` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API es utilizada para convertir del tipo `double` de C al tipo `Number` de JavaScript.

El tipo `Number` de JavaScript se describe en la [Sección 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_string_latin1

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_string_latin1(napi_env env,
                                      const char* str,
                                      size_t length,
                                      napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] str`: Buffer de caracteres que representa una cadena codificada en ISO-8859-1.
- `[in] length`: La longitud de la cadena en bytes, o `NAPI_AUTO_LENGTH` si está terminada en NULL.
- `[out] result`: Un `napi_value` que representa una `String` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto `String` de JavaScript desde una cadena de C codificada en ISO-8859-1. Se copia la cadena nativa.

El tipo `String` de JavaScript se describe en la [Sección 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_string_utf16

<!-- YAML
added: v8.0.0
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
- `[out] result`: Un `napi_value` que representa una `String` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto `String` de JavaScript desde una cadena de C codificada en UTF16-LE. Se copia la cadena nativa.

El tipo `String` de JavaScript se describe en la [Sección 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) de las Especificaciones del Lenguaje ECMAScript.

#### napi_create_string_utf8

<!-- YAML
added: v8.0.0
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
- `[out] result`: Un `napi_value` que representa una `String` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API crea un objeto `String` de JavaScript desde una cadena de C codificada en UTF8. Se copia la cadena nativa.

El tipo `String` de JavaScript se describe en la [Sección 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) de las Especificaciones del Lenguaje ECMAScript.

### Funciones para convertir desde N-API a tipos de C

#### napi_get_array_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_array_length(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa al `Array` de JavaScript cuya longitud es consultada.
- `[out] result`: `uint32` que representa la longitud del arreglo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve la longitud de un arreglo.

Longitud del `Array` se describe en la [Sección 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) de las Especificaciones del Lenguaje ECMAScript.

#### napi_get_arraybuffer_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_arraybuffer_info(napi_env env,
                                      napi_value arraybuffer,
                                      void** data,
                                      size_t* byte_length)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] arraybuffer`: `napi_value` que representa al `ArrayBuffer` que está siendo consultado.
- `[out] data`: El buffer de datos subyacente del `ArrayBuffer`.
- `[out] byte_length`: Longitud en bytes del buffer de datos subyacente.

Devuelve `napi_ok` si la API fue exitosa.

Esta API se utiliza para recuperar el buffer de datos subyacente y la longitud de un `ArrayBuffer`.

*ADVERTENCIA*: Tenga cuidado al utilizar esta API. El `ArrayBuffer` administra el tiempo de vida del buffer de datos subyacente incluso después de que se devuelve. Una manera segura y posible de usar esta API es hacerlo en conjunto con [`napi_create_reference`][], la cual puede ser utilizada para garantizar el control sobre el tiempo de vida del `ArrayBuffer`. También es seguro utilizar el buffer de datos devuelto dentro del mismo callback de terminación, siempre que no existan llamadas a otras APIs que puedan desencadenar un GC.

#### napi_get_buffer_info

<!-- YAML
added: v8.0.0
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
-->

```C
napi_status napi_get_prototype(napi_env env,
                               napi_value object,
                               napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] object`: `napi_value` que representa al `Object` de JavaScript cuyo prototipo será devuelto. Este devuelve el equivalente de `Object.getPrototypeOf` (el cual no es lo mismo que la propiedad `prototype` de la función).
- `[out] result`: `napi_value` que representa al prototipo del objeto dado.

Devuelve `napi_ok` si la API fue exitosa.

#### napi_get_typedarray_info

<!-- YAML
added: v8.0.0
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
- `[in] typedarray`: `napi_value` que representa al `TypedArray` cuyas propiedades se consultarán.
- `[out] type`: Tipo de dato escalar de los elementos dentro del `TypedArray`.
- `[out] length`: `Number` de elementos en el `TypedArray`.
- `[out] data`: El buffer de datos subyacente al typed array.
- `[out] byte_offset`: El byte offset dentro del buffer de datos desde el cual se comenzará a proyectar el `TypedArray`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve varias propiedades de un typed array.

*Advertencia*: Tenga cuidado al utilizar esta API, ya que el buffer de datos subyacente es administrado por la VM.

#### napi_get_dataview_info

<!-- YAML
added: v8.3.0
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
- `[in] dataview`: `napi_value` que representa el `DataView` cuyas propiedades se consultarán.
- `[out] byte_length`: `Number` de bytes en el `DataView`.
- `[out] data`: El buffer de datos subyacente al `DataView`.
- `[out] arraybuffer`: `ArrayBuffer` subyacente al `DataView`.
- `[out] byte_offset`: El byte offset dentro del buffer de datos desde el cual se comenzará a proyectar el `DataView`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve varias propiedades de un `DataView`.

#### napi_get_value_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa al `Boolean` de JavaScript.
- `[out] result`: Booleano primitivo de C equivalente al `Boolean` de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no booleano devuelve `napi_boolean_expected`.

Esta API devuelve el booleano primitivo de C equivalente al `Boolean` de JavaScript dado.

#### napi_get_value_double

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_double(napi_env env,
                                  napi_value value,
                                  double* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un `Number` de JavaScript.
- `[out] result`: Doble primitivo de C equivalente al `Number` de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

Esta API devuelve un doble primitivo de C equivalente al `Number` de JavaScript dado.

#### napi_get_value_external

<!-- YAML
added: v8.0.0
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
-->

```C
napi_status napi_get_value_int32(napi_env env,
                                 napi_value value,
                                 int32_t* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un `Number` de JavaScript.
- `[out] result`: `int32` primitivo de C equivalente al `Number` de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado en `napi_number_expected`.

Esta API devuelve un `int32` primitivo de C equivalente al `Number` de JavaScript dado.

Si el número excede el rango del entero de 32 bits, entonces el resultado es truncado hacia abajo al número de 32 bits próximo. Esto puede hacer que un número positivo grande se convierta en uno negativo si el valor es > 2^31 -1.

Los valores numéricos no finitos (`NaN`, `+Infinity`, o `-Infinity`) establecen el resultado como cero.

#### napi_get_value_int64

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int64(napi_env env,
                                 napi_value value,
                                 int64_t* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un `Number` de JavaScript.
- `[out] result`: `int64` primitivo de C equivalente al `Number` de JavaScript dado.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

Esta API devuelve un `int64` primitivo de C equivalente al `Number` de JavaScript dado.

Los valores de `Number` fuera del rango de [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) perderán precisión.

Los valores numéricos no finitos (`NaN`, `+Infinity`, o `-Infinity`) establecen el resultado como cero.

#### napi_get_value_string_latin1

<!-- YAML
added: v8.0.0
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
- `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, se truncará la cadena devuelta.
- `[out] result`: Número de byes copiados en el buffer, excluyendo el terminador Null.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no `String`, devuelve `napi_string_expected`.

Esta API devuelve una cadena codificada en ISO-8859-1 que corresponde al valor pasado.

#### napi_get_value_string_utf8

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_utf8(napi_env env,
                                       napi_value value,
                                       char* buf,
                                       size_t bufsize,
                                       size_t* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa la cadena de JavaScript.
- `[in] buf`: Buffer para escribir la cadena codificada en UTF8. Si se pasa NULL, se devuelve la longitud de la cadena (en bytes).
- `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la cadena devuelta será truncada.
- `[out] result`: Número de bytes copiados en el buffer, excluyendo a el terminador Null.

Devuelve `napi_ok` si la API fue exitosa. Si se pasa un `napi_value` no `String`, devuelve `napi_string_expected`.

Esta API devuelve una cadena codificada en UTF8 que corresponde al valor pasado.

#### napi_get_value_string_utf16

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_string_utf16(napi_env env,
                                        napi_value value,
                                        char16_t* buf,
                                        size_t bufsize,
                                        size_t* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa una cadena de JavaScript.
- `[in] buf`: Buffer en el cual escribir la cadena codificada en UTF16-LE. Si se pasa NULL, se devuelve la longitud de la cadena (en unidades de código de 2 bytes).
- `[in] bufsize`: Tamaño del buffer de destino. Cuando el valor es insuficiente, la cadena devuelta será truncada.
- `[out] result`: Número de unidades de código de 2 bytes copiadas en el buffer, excluyendo el terminador Null.

Devuelve `napi_ok` si la API es exitosa. Si se pasa un `napi_value` no `String`, devuelve `napi_string_expected`.

Esta API devuelve la cadena codificada en UTF16 que corresponde al valor pasado.

#### napi_get_value_uint32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_uint32(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: `napi_value` que representa un `Number` de JavaScript.
- `[out] result`: Primitivo de C equivalente al `napi_value` dado como un `uint32_t`.

Devuelve `napi_ok` si la API fue exitosa. Si un `napi_value` no numérico es pasado, devuelve `napi_number_expected`.

Esta API devuelve un primitivo de C equivalente al `napi_value` dado como `uint32_t`.

### Funciones para obtener instancias globales

#### napi_get_boolean

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor del booleano a recuperar.
- `[out] result`: `napi_value` que representa al `Boolean` singleton de JavaScript a recuperar.

Devuelve `napi_ok` si la API fue exitosa.

Esta API es utilizada para devolver el objeto singleton de JavaScript que es utilizado para representar al valor booleano dado.

#### napi_get_global

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa el objeto `global` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el objeto `global`.

#### napi_get_null

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa al objeto `null` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el objeto `null`.

#### napi_get_undefined

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: `napi_value` que representa al valor indefinido de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve el objeto indefinido de JavaScript.

## Trabajando con Valores de JavaScript - Operaciones Abstractas

N-API expone un conjunto de APIs para realizar algunas operaciones abstractas en valores de JavaScript. Algunas de estas operaciones están documentadas bajo la [Sección 7](https://tc39.github.io/ecma262/#sec-abstract-operations) de las [Especificaciones del Lenguaje ECMAScript](https://tc39.github.io/ecma262/).

Estas APIs admiten hacer uno de los siguientes:

1. Forzar los valores de JavaScript para que sean tipos específicos de JavaScript (tal como `Number` o `String`).
2. Verificar el tipo de valor de JavaScript.
3. Verificar la equidad entre dos valores de JavaScript.

### napi_coerce_to_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_bool(napi_env env,
                                napi_value value,
                                napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a forzar.
- `[out] result`: `napi_value` que representa al `Boolean` de JavaScript que fue forzado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta `ToBoolean()` como se define en la [Sección 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el `Object` pasado.

### napi_coerce_to_number

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_number(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a generar.
- `[out] result`: `napi_value` que representa al `Number` de JavaScript a generar.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta `ToNumber()` como se define en la [Sección 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el `Object` pasado.

### napi_coerce_to_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_object(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a generar.
- `[out] result`: `napi_value` que representa al `Object` de JavaScript a forzar.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta `ToObject()` como se define en la [Sección 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el `Object` pasado.

### napi_coerce_to_string

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_string(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a forzar.
- `[out] result`: `napi_value` que representa a la `String` de JavaScript que fue forzada.

Devuelve `napi_ok` si la API fue exitosa.

Esta API implementa la operación abstracta `ToString()` como se define en la [Sección 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) de las Especificaciones del Lenguaje ECMAScript. Esta API puede ser reentrante si los getters están definidos en el `Object` pasado.

### napi_typeof

<!-- YAML
added: v8.0.0
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
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el objeto dado es un `ArrayBuffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el `Object` pasado es un array buffer.

### napi_is_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un objeto `node::Buffer`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el `Object` pasado está en un buffer.

### napi_is_error

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un objeto `Error`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el `Object` pasado es un `Error`.

### napi_is_typedarray

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un `TypedArray`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el `Object` pasado es un typed array.

### napi_is_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] value`: El valor de JavaScript a verificar.
- `[out] result`: Si el `napi_value` dado representa un `DataView`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API verifica si el `Object` pasado es un `DataView`.

### napi_strict_equals

<!-- YAML
added: v8.0.0
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
- Valor de JavaScript: estos están representados por `napi_value` en N-API. Esto puede ser un `napi_value` que represente una `String`, un `Number` o un `Symbol`.

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

- `utf8name`: `String` opcional que describe la clave de la propiedad, codificada como UTF8. Alguno de los dos, `utf8name` o `name`, debe ser proporcionado por la propiedad.
- `name`: `napi_value` opcional que apunta a una cadena o símbolo de JavaScript a ser utilizado como clave de la propiedad. Alguno de los dos, `utf8name` o `name`, debe ser proporcionado para la propiedad.
- `value`: El valor que es recuperado por un get access de la propiedad si esta es una propiedad de datos. Si es pasado, establecer `getter`, `setter`, `method` y `data` en `NULL` (ya que estos miembros no serán utilizados).
- `getter`: Una función a llamar cuando se realiza un get access de la propiedad. Si es pasado, establecer `value` y `method` en `NULL` (ya que estos miembros so se utilizarán). La función dada es llamada implícitamente por el tiempo de ejecución cuando la propiedad es accedida desde el código de JavaScript (o si se realiza un get en la propiedad, utilizando una llamada N-API).
- `setter`: Una función a llamar cuando se realiza un set access de la propiedad. Si es pasado, establecer `value` y `method` en `NULL` (ya que estos miembros no se utilizarán). La función dada es llamada implícitamente por el tiempo de ejecución cuando la propiedad se establece desde el código de JavaScript (o si se realiza un set en la propiedad, utilizando una llamada N-API).
- `method`: Establecer esto para hacer que la propiedad `value` del objeto descriptor de la propiedad sea una función de JavaScript representada por `method`. Si es pasado, establecer `value`, `getter` y `setter` en `NULL` (ya que estos miembros no se utilizarán).
- `attributes`: Los atributos asociados con la propiedad particular. Ver [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: El callback de datos pasado en `method`, `getter` y `setter` si esta función es invocada.

### Funciones

#### napi_get_property_names

<!-- YAML
added: v8.0.0
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

Esta API devuelve los nombres de las propiedades enumerables de `object` como un arreglo de cadenas. Las propiedades de `object` cuya clave es un símbolo no serán incluidas.

#### napi_set_property

<!-- YAML
added: v8.0.0
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

Esta API establece una propiedad sobre el `Object` pasado.

#### napi_get_property

<!-- YAML
added: v8.0.0
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

Esta API obtiene la propiedad solicitada desde el `Object` pasado.

#### napi_has_property

<!-- YAML
added: v8.0.0
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

Esta API verifica si el `Object` pasado tiene la propiedad nombrada.

#### napi_delete_property

<!-- YAML
added: v8.2.0
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

Esta API verifica si el `Object` pasado tiene la propiedad propia nombrada. `key` debe ser una cadena o un `Symbol`, o se arrojará un error. N-API no realizará ninguna conversión entre tipos de datos.

#### napi_set_named_property

<!-- YAML
added: v8.0.0
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

Este método es equivalente a llamar [`napi_set_property`][] con un `napi_value` creado desde una cadena pasada como `utf8Name`.

#### napi_get_named_property

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_named_property(napi_env env,
                                    napi_value object,
                                    const char* utf8Name,
                                    napi_value* result);
```

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el que recuperar la propiedad.
- `[in] utf8Name`: El nombre de la propiedad a obtener.
- `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Este método es equivalente a llamar [`napi_get_property`][] con un `napi_value` creado desde una cadena pasada como `utf8Name`.

#### napi_has_named_property

<!-- YAML
added: v8.0.0
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

Este método es equivalente a llamar [`napi_has_property`][] con un `napi_value` creado desde una cadena pasada como `utf8Name`.

#### napi_set_element

<!-- YAML
added: v8.0.0
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

Esta API establece un elemento en el `Object` pasado.

#### napi_get_element

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_element(napi_env env,
                             napi_value object,
                             uint32_t index,
                             napi_value* result);
```

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el que recuperar la propiedad.
- `[in] index`: El índice de la propiedad a obtener.
- `[out] result`: El valor de la propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Esta API obtiene el elemento en el índice solicitado.

#### napi_has_element

<!-- YAML
added: v8.0.0
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

Esta API retorna si el `Object` pasado tiene un elemento en el índice solicitado.

#### napi_delete_element

<!-- YAML
added: v8.2.0
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
-->

```C
napi_status napi_define_properties(napi_env env,
                                   napi_value object,
                                   size_t property_count,
                                   const napi_property_descriptor* properties);
```

- `[in] env`: El entorno bajo el que la llamada N-API es invocada.
- `[in] object`: El objeto desde el cual recuperar las propiedades.
- `[in] property_count`: El número de elementos en el arreglo de `properties`.
- `[in] properties`: El arreglo de descriptores de propiedad.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite la definición eficiente de múltiples propiedades sobre un objeto dado. Las propiedades se definen utilizando los descriptores de propiedad (véase [`napi_property_descriptor`][]). Dado un arreglo de tales descriptores de propiedad, esta API establecerá las propiedades sobre el objeto una por vez. tal como se define en `DefineOwnProperty()` (descrito en la [Sección 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) de las especificaciones ECMA262).

## Trabajar con Funciones de JavaScript

N-API ofrece un conjunto de APIs que permiten al código de JavaScript hacer llamadas de vuelta al código nativo. Las APIs de N-API que son compatibles con las llamadas devuelta al código nativo toman una función callback representada por el tipo `napi_callback`. Cuando la VM de JavaScript llama de vuelta al código nativo, la función `napi_callback` proporcionada es invocada. Las APIs documentadas en esta sección permiten hacer lo siguiente a la función callback:

- Obtener información sobre el contexto en el cual el callback fue invocado.
- Obtener los argumentos pasados al callback.
- Devolver un `napi_value` desde el callback.

Adicionalmente, N-API proporciona un conjunto de funciones que permiten llamar funciones de JavaScript desde el código nativo. Uno puede llamar a una función como una llamad de función de JavaScript regular, o como una función constructora.

### napi_call_function

<!-- YAML
added: v8.0.0
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

La nueva función creada no es visible automáticamente desde el script luego de esta llamada. En cambio, una propiedad debe ser explícitamente establecida sobre un objeto que es visible para JavaScript, para que la función sea accesible desde el script.

Para exponer una función como parte de las exportaciones del módulo del complemento, configure la nueva función creada en el objeto de exportaciones. Un módulo de muestra puede verse de la siguiente manera:

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

Dado el código anterior, el complemento puede ser utilizado desde JavaScript como sigue:

```js
const myaddon = require('./addon');
myaddon.sayHello();
```

La cadena pasada para requerir no es necesariamente el nombre pasado a `NAPI_MODULE` en el fragmento anterior, sino el nombre del objetivo en `binding.gyp` responsable de crear el archivo `.node`.

### napi_get_cb_info

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_cb_info(napi_env env,
                             napi_callback_info cbinfo,
                             size_t* argc,
                             napi_value* argv,
                             napi_value* thisArg,
                             void** data)
```

- `[in] env`: El entorno bajo el que se invoca a la API.
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
2. Cuando el código de JavaScript invoca al constructor, el callback del constructor utiliza [`napi_wrap`][] para envolver una nueva instancia de C++ en un objeto de JavaScript, entonces devuelve al objeto envuelto.
3. Cuando el código de JavaScript invoca un método o acceso a la propiedad de la clase, se invoca la correspondiente función `napi_callback` de C++. Para un callback de instancia, [`napi_unwrap`][] obtiene la instancia de C++ que es el objetivo de la llamada.

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
- `[in] length`: La longitud en bytes de `utf8name`, o `NAPI_AUTO_LENGTH` si es terminado en null.
- `[in] constructor`: Función callback que maneja la construcción de instancias de la clase. (Este debe ser un método estático en la clase, no una verdadera función constructora de C++)
- `[in] data`: Datos opcionales a ser pasados al callback de la constructora como la propiedad `data` de la información del callback.
- `[in] property_count`: Número de elementos en el argumento del arreglo `properties`.
- `[in] properties`: Arreglo de descriptores de propiedad que describen propiedades de datos estáticos y de instancia, accesores, y métodos en la clase. Véase `napi_property_descriptor`.
- `[out] result`: Un `napi_value` que representa a la función constructora para la clase.

Devuelve `napi_ok` si la API fue exitosa.

Define una clase de Javascript que corresponde a una clase de C++, incluyendo:

- Una función constructora de JavaScript que tiene el nombre de la clase e invoca al callback del constructor de C++ proporcionado.
- Propiedades sobre la función constructora que corresponden a propiedades de datos *estáticos*, acceso, y métodos de la clase de C++ (definidos por descriptores de propiedad con el atributo `napi_static`).
- Propiedades sobre el objeto `prototype` de la función constructora que corresponden a propiedades de datos *no estáticos*, accesores, y métodos de la clase de C++ (definidos por los descriptores de propiedad sin el atributo `napi_static`).

El callback del constructor de C++ debe se un método estático sobre la clase que llama a la verdadera clase constructora, entonces envuelve la nueva instancia de C++ en un objeto de JavaScript, y devuelve un objeto envuelto. Véase `napi_wrap()` para más detalles.

La función constructora de JavaScript devuelta desde [`napi_define_class`][] es usualmente guardada y utilizada luego, para construir nuevas instancias de la clase desde código nativo, y/o verificar si los valores proporcionados son instancias de la clase. En ese caso, para prevenir que el valor de la función sea recolectado con la basura, crear una referencia persistente a él, utilizando [`napi_create_reference`][] y asegurar que la cuenta de la referencia se mantenga >= 1.

### napi_wrap

<!-- YAML
added: v8.0.0
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
- `[in] js_object`: El objeto de JavaScript que será envuelto por el objeto nativo. Este objeto *debe* haber sido creado desde el `prototype` de un constructor que fue creado utilizando `napi_define_class()`.
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

Esta API puede modificar la cadena de prototipos del objeto envuelto. Después, la manipulación adicional de la cadena de prototipos de la envoltura puede ocasionar la falla de `napi_unwrap()`.

Llamar a `napi_unwrap()` por segunda vez en un objeto devolverá un error. Para asociar otra instancia nativa con el objeto, utilizar primero `napi_remove_wrap()`.

### napi_unwrap

<!-- YAML
added: v8.0.0
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

Cuando estos métodos son invocados, el parámetro `data` pasado estará constituido por los datos `void*` proporcionados por el complemento que fueron pasados a la llamada `napi_create_async_work`.

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
- `[in] async_resource`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identificador para el tipo de recurso que está siendo proporcionado para la información de diagnóstico expuesta por la API `async_hooks`.
- `[in] execute`: La función nativa que debe ser llamada para ejecutar la lógica de forma asíncrona. La función dada es llamada desde un hilo de un pool de workers y se puede ejecutar en paralelo con el hilo del bucle de evento principal.
- `[in] complete`: La función nativa que será llamada cuando la lógica asíncrona esté completa o cancelada. La función dada es llamada desde el hilo del bucle del evento principal.
- `[in] data`: Contexto de datos proporcionado por el usuario. Este será pasado de vuelta a las funciones de ejecución y completación.
- `[out] result`: `napi_async_work*` que es el manejador del trabajo asíncrono recientemente creado.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un objeto de trabajo que es utilizado para ejecutar la lógica de manera asíncrona. Se debe liberar utilizando [`napi_delete_async_work`][] una vez que el trabajo ya no sea requerido.

`async_resource_name` debe ser una cadena codificada en UTF-8 y terminada en null.

El identificador `async_resource_name` es proporcionado por el usuario y debe ser representativo del tipo de trabajo asíncrono que está siendo realizado. También es recomendado aplicar el espacio de nombres al identificador, por ejemplo, incluyendo el nombre del módulo. Véase la [`async_hooks` documentation][async_hooks `type`] para más información.

### napi_delete_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] work`: El handle devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API libera un objeto de trabajo previamente asignado.

Esta API puede ser llamada incluso si hay una excepción de JavaScript pendiente.

### napi_queue_async_work

<!-- YAML
added: v8.0.0
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
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] work`: El handle devuelto por la llamada a `napi_create_async_work`.

Devuelve `napi_ok` si la API fue exitosa.

Esta API cancela el trabajo en cola, si no ha sido iniciado aún. Si ya comenzaron a ejecutarse, no puede ser cancelado y se devolverá `napi_generic_failure`. Si es exitoso, el callback `complete` será invocado con un valor de estado de `napi_cancelled`. El trabajo no debe ser eliminado antes de la invocación del callback `complete`, incluso si fue cancelado de manera exitosa.

Esta API puede ser llamada incluso si existe una excepción pendiente de JavaScript.

## Operaciones Asíncronas Personalizadas

Las APIs de trabajo asíncrono simple anteriores pueden no ser apropiadas para cada escenario. Al utilizar cualquier otro mecanismo asíncrono, las siguientes APIs son necesarias para asegurar que una operación asíncrona sea apropiadamente rastreada por el tiempo de ejecución.

### napi_async_init

<!-- YAML
added: v8.6.0
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
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] async_context`: El contexto asíncrono a ser destruido.

Devuelve `napi_ok` si la API fue exitosa.

Esta API puede ser llamada incluso si hay una excepción de JavaScript pendiente.

### napi_make_callback

<!-- YAML
added: v8.0.0
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
- `[in] async_context`: Contexto para la operación asíncrona que está invocando al callback. Normalmente este debería ser un valor obtenido previamente de [`napi_async_init`][]. Sin embargo, `NULL` también está permitido, lo cual indica que el contexto asíncrono actual (si existe) está por ser utilizado para el callback.
- `[in] recv`: El objeto `this` pasado a la función llamada.
- `[in] func`: `napi_value` que representa la función de JavaScript a ser invocada.
- `[in] argc`: El conteo de elementos en el arreglo `argv`.
- `[in] argv`: Arreglo de valores de JavaScript como `napi_value` que representan los argumentos para la función.
- `[out] result`: `napi_value` que representa el objeto de JavaScript devuelto.

Devuelve `napi_ok` si la API fue exitosa.

Este método permite a una función objeto de JavaScript ser llamada desde un complemento nativo. Esta API es similar a `napi_call_function`. Sin embargo, es utilizado para llamar *desde* el código nativo de nuevo *a* JavaScript *luego* de regresar de una operación asíncrona (cuando no hay otro script en la pila). Es una envoltura bastante simple alrededor de `node::MakeCallback`.

Tenga en cuenta que *no* es necesario utilizar `napi_make_callback` desde dentro de un `napi_async_complete_callback`; en esa situación, el contexto asíncrono del callback ya se ha configurado, por lo que una llamada directa a `napi_call_function` es apropiada y suficiente. La utilización de la función `napi_make_callback` puede ser requerida cuando se implementa un comportamiento asíncrono personalizado que no usa `napi_create_async_work`.

### napi_open_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_open_callback_scope(napi_env env,
                                                 napi_value resource_object,
                                                 napi_async_context context,
                                                 napi_callback_scope* result)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] resource_object`: Un objeto opcional asociado con el trabajo asíncrono que será pasado a posibles `async_hooks` [`init` hooks][].
- `[in] context`: Contexto para la operación asíncrona que está invocando al callback. Este debe ser un valor obtenido previamente de [`napi_async_init`][].
- `[out] result`: El ámbito recientemente creado.

Existen casos (por ejemplo resolver promesas) en los que es necesario tener el equivalente del ámbito asociado con el callback en el lugar cuando se realizan ciertas llamadas N-API. Si no hay otro script en la pila, las funciones [`napi_open_callback_scope`][] y [`napi_close_callback_scope`][] pueden ser utilizadas para abrir/cerrar el ámbito requerido.

### napi_close_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] scope`: El ámbito a ser cerrado.

Esta API puede ser llamada incluso si hay una excepción de JavaScript pendiente.

## Administración de Versiones

### napi_get_node_version

<!-- YAML
added: v8.4.0
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
- `[out] version`: Un apuntador a la información de versión para Node.js.

Devuelve `napi_ok` si la API fue exitosa.

Esta función rellena la estructura de `version` con la versión principal, secundaria y de parche de Node.js que se está ejecutando, y el campo `release` con el valor de [`process.release.name`][`process.release`].

El buffer devuelto está asignado de forma estática y no necesita ser liberado.

### napi_get_version

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] result`: La versión más alta soportada de N-API.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve la versión más altade N-API soportada por el tiempo de ejecución de Node.js. Está previsto que N-API sea aditiva, de modo que las versiones más recientes de Node.js puedan soportar funciones API adicionales. Para permitir que un complemento utilice una función más nueva cuando se ejecuta con versiones de Node.js que lo soportan, al mismo tiempo que se proporciona un comportamiento alternativo cuando se ejecuta con versiones de Node.js que no lo soportan:

- Llamar a `napi_get_version()` para determinar si la API está disponible.
- Si está disponible, cargar de forma dinámica un apuntador a la función utilizando `uv_dlsym()`.
- Utilizar el puntero cargado de forma dinámica para invocar a la función.
- Si la función no está disponible, proporcionar una implementación alternativa que no utilice la función.

## Gestión de la Memoria

### napi_adjust_external_memory

<!-- YAML
added: v8.5.0
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
-->

```C
napi_status napi_is_promise(napi_env env,
                            napi_value promise,
                            bool* is_promise);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] promise`: La promesa a examinar
- `[out] is_promise`: Bandera que indica si `promise` es un objeto de promesa nativo, es decir, un objeto de promesa creado por el motor subyacente.

## Ejecución de Script

N-API proporciona una API para ejecutar una cadena que contiene JavaScript utilizando el motor subyacente de JavaScript.

### napi_run_script

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_run_script(napi_env env,
                                        napi_value script,
                                        napi_value* result);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[in] script`: Una cadena de JavaScript que contiene el script a ejecutar.
- `[out] result`: El valor que resulta de haber ejecutado el script.

## Bucle de Evento libuv

N-API proporciona una función para obtener el bucle de evento actual asociado con un `napi_env` específico.

### napi_get_uv_event_loop

<!-- YAML
added: v9.3.0
-->

```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               uv_loop_t** loop);
```

- `[in] env`: El entorno bajo el que la API se invoca.
- `[out] loop`: La instancia actual del bucle libuv.