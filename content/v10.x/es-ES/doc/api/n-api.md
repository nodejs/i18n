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

Los valores de N-API están representados por el tipo `napi_value`. Cualquier llamada N-API que requiera un valor de JavaScript se toma en un `napi_value`. En algunos casos, la API verifica el tipo de `napi_value` por adelantado. Sin embargo, para un mejor rendimiento, es mejor para el llamador asegurarse de que el `napi_value` en cuestión sea del tipo de JavaScript que espera la API.

### Tipos de Enum

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
- `[in] length`: La longitud en bytes del array buffer a crear.
- `[out] data`: Apuntador al bytes buffer subyacente del `ArrayBuffer`.
- `[out] result`: El `napi_value` que representa un `ArrayBuffer` de JavaScript.

Devuelve `napi_ok` si la API fue exitosa.

Esta API devuelve un valor de N-API correspondiente a un `ArrayBuffer` de JavaScript. Los `ArrayBuffer`s son utilizados para representar buffers de datos binarios de longitud fija. Normalmente se utilizan como un buffer de respaldo para objetos `TypedArray`. El `ArrayBuffer` asignado tendrá un byte buffer subyacente cuyo tamaño es determinado por el parámetro `length` que es pasado. El buffer subyacente se devuelve opcionalmente al llamador en caso de que quiera manipular el buffer directamente. Este buffer sólo se puede escribir directamente desde el código nativo. Para escribir en este buffer desde JavaScript, un tipo arreglo o un objeto `DataView` tendría que ser creado.

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
- `[in] finalize_cb`: Callback opcional para llamar cuando el valor externo sea tomado.
- `[in] finalize_hint`: Sugerencia opcional para pasar a la callback finalizada durante la recopilación.
- `[out] result`: Un `napi_value` que representa un valor externo.

Devuelve `napi_ok` si la API fue exitosa.

Esta API asigna un valor de JavaScript con datos externos adjuntos. Esto se utiliza para pasar datos externos a través del código de JavaScript, para que pueda ser recuperado luego por el código nativo. Esta API permite al llamador pasar en una callback finalizada, en caso de que el recurso nativo subyacente necesite ser limpiado cuando el valor externo de JavaScript sea tomado.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] external_data`: Pointer to the underlying byte buffer of the `ArrayBuffer`.
- `[in] byte_length`: The length in bytes of the underlying buffer.
- `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
- `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
- `[out] result`: El `napi_value` que representa un `ArrayBuffer` de JavaScript.

Returns `napi_ok` if the API succeeded.

Esta API devuelve un valor de N-API correspondiente a un `ArrayBuffer` de JavaScript. The underlying byte buffer of the `ArrayBuffer` is externally allocated and managed. The caller must ensure that the byte buffer remains valid until the finalize callback is called.

JavaScript `ArrayBuffer`s are described in [Section 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] length`: Size in bytes of the input buffer (should be the same as the size of the new buffer).
- `[in] data`: Raw pointer to the underlying buffer to copy from.
- `[in] finalize_cb`: Optional callback to call when the `ArrayBuffer` is being collected.
- `[in] finalize_hint`: Optional hint to pass to the finalize callback during collection.
- `[out] result`: A `napi_value` representing a `node::Buffer`.

Returns `napi_ok` if the API succeeded.

This API allocates a `node::Buffer` object and initializes it with data backed by the passed in buffer. Si bien esta sigue siendo una estructura de datos completamente compatible, en la mayoría de los casos será suficiente utilizar un `TypedArray`.

For Node.js >=4 `Buffers` are `Uint8Array`s.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] utf8name`: A string representing the name of the function encoded as UTF8.
- `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[in] cb`: A function pointer to the native function to be invoked when the created function is invoked from JavaScript.
- `[in] data`: Optional arbitrary context data to be passed into the native function when it is invoked.
- `[out] result`: A `napi_value` representing a JavaScript function.

Returns `napi_ok` if the API succeeded.

This API returns an N-API value corresponding to a JavaScript `Function` object. It's used to wrap native functions so that they can be invoked from JavaScript.

JavaScript `Function`s are described in [Section 19.2](https://tc39.github.io/ecma262/#sec-function-objects) of the ECMAScript Language Specification.

#### napi_create_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[out] result`: A `napi_value` representing a JavaScript `Object`.

Returns `napi_ok` if the API succeeded.

This API allocates a default JavaScript `Object`. It is the equivalent of doing `new Object()` in JavaScript.

The JavaScript `Object` type is described in [Section 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) of the ECMAScript Language Specification.

#### napi_create_symbol

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_create_symbol(napi_env env,
                               napi_value description,
                               napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] description`: Optional `napi_value` which refers to a JavaScript `String` to be set as the description for the symbol.
- `[out] result`: A `napi_value` representing a JavaScript `Symbol`.

Returns `napi_ok` if the API succeeded.

This API creates a JavaScript `Symbol` object from a UTF8-encoded C string.

The JavaScript `Symbol` type is described in [Section 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] type`: Scalar datatype of the elements within the `TypedArray`.
- `[in] length`: Number of elements in the `TypedArray`.
- `[in] arraybuffer`: `ArrayBuffer` underlying the typed array.
- `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `TypedArray`.
- `[out] result`: A `napi_value` representing a JavaScript `TypedArray`.

Returns `napi_ok` if the API succeeded.

This API creates a JavaScript `TypedArray` object over an existing `ArrayBuffer`. `TypedArray` objects provide an array-like view over an underlying data buffer where each element has the same underlying binary scalar datatype.

It's required that `(length * size_of_element) + byte_offset` should be <= the size in bytes of the array passed in. If not, a `RangeError` exception is raised.

JavaScript `TypedArray` objects are described in [Section 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] length`: Number of elements in the `DataView`.
- `[in] arraybuffer`: `ArrayBuffer` underlying the `DataView`.
- `[in] byte_offset`: The byte offset within the `ArrayBuffer` from which to start projecting the `DataView`.
- `[out] result`: A `napi_value` representing a JavaScript `DataView`.

Returns `napi_ok` if the API succeeded.

This API creates a JavaScript `DataView` object over an existing `ArrayBuffer`. `DataView` objects provide an array-like view over an underlying data buffer, but one which allows items of different size and type in the `ArrayBuffer`.

It is required that `byte_length + byte_offset` is less than or equal to the size in bytes of the array passed in. If not, a `RangeError` exception is raised.

JavaScript `DataView` objects are described in [Section 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) of the ECMAScript Language Specification.

### Functions to convert from C types to N-API

#### napi_create_int32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: Integer value to be represented in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript `Number`.

Returns `napi_ok` if the API succeeded.

This API is used to convert from the C `int32_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_uint32

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: Unsigned integer value to be represented in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript `Number`.

Returns `napi_ok` if the API succeeded.

This API is used to convert from the C `uint32_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

#### napi_create_int64

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: Integer value to be represented in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript `Number`.

Returns `napi_ok` if the API succeeded.

This API is used to convert from the C `int64_t` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification. Note the complete range of `int64_t` cannot be represented with full precision in JavaScript. Integer values outside the range of [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) will lose precision.

#### napi_create_double

<!-- YAML
added: v8.4.0
-->

```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: Double-precision value to be represented in JavaScript.
- `[out] result`: A `napi_value` representing a JavaScript `Number`.

Returns `napi_ok` if the API succeeded.

This API is used to convert from the C `double` type to the JavaScript `Number` type.

The JavaScript `Number` type is described in [Section 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] str`: Character buffer representing an ISO-8859-1-encoded string.
- `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[out] result`: A `napi_value` representing a JavaScript `String`.

Returns `napi_ok` if the API succeeded.

This API creates a JavaScript `String` object from an ISO-8859-1-encoded C string. The native string is copied.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] str`: Character buffer representing a UTF16-LE-encoded string.
- `[in] length`: The length of the string in two-byte code units, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[out] result`: A `napi_value` representing a JavaScript `String`.

Returns `napi_ok` if the API succeeded.

This API creates a JavaScript `String` object from a UTF16-LE-encoded C string. The native string is copied.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] str`: Character buffer representing a UTF8-encoded string.
- `[in] length`: The length of the string in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[out] result`: A `napi_value` representing a JavaScript `String`.

Returns `napi_ok` if the API succeeded.

This API creates a JavaScript `String` object from a UTF8-encoded C string. The native string is copied.

The JavaScript `String` type is described in [Section 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) of the ECMAScript Language Specification.

### Functions to convert from N-API to C types

#### napi_get_array_length

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_array_length(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing the JavaScript `Array` whose length is being queried.
- `[out] result`: `uint32` representing length of the array.

Returns `napi_ok` if the API succeeded.

This API returns the length of an array.

`Array` length is described in [Section 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) of the ECMAScript Language Specification.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] arraybuffer`: `napi_value` representing the `ArrayBuffer` being queried.
- `[out] data`: The underlying data buffer of the `ArrayBuffer`.
- `[out] byte_length`: Length in bytes of the underlying data buffer.

Returns `napi_ok` if the API succeeded.

This API is used to retrieve the underlying data buffer of an `ArrayBuffer` and its length.

*WARNING*: Use caution while using this API. The lifetime of the underlying data buffer is managed by the `ArrayBuffer` even after it's returned. A possible safe way to use this API is in conjunction with [`napi_create_reference`][], which can be used to guarantee control over the lifetime of the `ArrayBuffer`. It's also safe to use the returned data buffer within the same callback as long as there are no calls to other APIs that might trigger a GC.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing the `node::Buffer` being queried.
- `[out] data`: The underlying data buffer of the `node::Buffer`.
- `[out] length`: Length in bytes of the underlying data buffer.

Returns `napi_ok` if the API succeeded.

This API is used to retrieve the underlying data buffer of a `node::Buffer` and it's length.

*Warning*: Use caution while using this API since the underlying data buffer's lifetime is not guaranteed if it's managed by the VM.

#### napi_get_prototype

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_prototype(napi_env env,
                               napi_value object,
                               napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] object`: `napi_value` representing JavaScript `Object` whose prototype to return. This returns the equivalent of `Object.getPrototypeOf` (which is not the same as the function's `prototype` property).
- `[out] result`: `napi_value` representing prototype of the given object.

Returns `napi_ok` if the API succeeded.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] typedarray`: `napi_value` representing the `TypedArray` whose properties to query.
- `[out] type`: Scalar datatype of the elements within the `TypedArray`.
- `[out] length`: `Number` of elements in the `TypedArray`.
- `[out] data`: The data buffer underlying the typed array.
- `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the `TypedArray`.

Returns `napi_ok` if the API succeeded.

This API returns various properties of a typed array.

*Warning*: Use caution while using this API since the underlying data buffer is managed by the VM.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] dataview`: `napi_value` representing the `DataView` whose properties to query.
- `[out] byte_length`: `Number` of bytes in the `DataView`.
- `[out] data`: The data buffer underlying the `DataView`.
- `[out] arraybuffer`: `ArrayBuffer` underlying the `DataView`.
- `[out] byte_offset`: The byte offset within the data buffer from which to start projecting the `DataView`.

Returns `napi_ok` if the API succeeded.

This API returns various properties of a `DataView`.

#### napi_get_value_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript `Boolean`.
- `[out] result`: C boolean primitive equivalent of the given JavaScript `Boolean`.

Returns `napi_ok` if the API succeeded. If a non-boolean `napi_value` is passed in it returns `napi_boolean_expected`.

This API returns the C boolean primitive equivalent of the given JavaScript `Boolean`.

#### napi_get_value_double

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_double(napi_env env,
                                  napi_value value,
                                  double* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript `Number`.
- `[out] result`: C double primitive equivalent of the given JavaScript `Number`.

Returns `napi_ok` if the API succeeded. If a non-number `napi_value` is passed in it returns `napi_number_expected`.

This API returns the C double primitive equivalent of the given JavaScript `Number`.

#### napi_get_value_external

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_external(napi_env env,
                                    napi_value value,
                                    void** result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript external value.
- `[out] result`: Pointer to the data wrapped by the JavaScript external value.

Returns `napi_ok` if the API succeeded. If a non-external `napi_value` is passed in it returns `napi_invalid_arg`.

This API retrieves the external data pointer that was previously passed to `napi_create_external()`.

#### napi_get_value_int32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int32(napi_env env,
                                 napi_value value,
                                 int32_t* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript `Number`.
- `[out] result`: C `int32` primitive equivalent of the given JavaScript `Number`.

Returns `napi_ok` if the API succeeded. If a non-number `napi_value` is passed in `napi_number_expected`.

This API returns the C `int32` primitive equivalent of the given JavaScript `Number`.

If the number exceeds the range of the 32 bit integer, then the result is truncated to the equivalent of the bottom 32 bits. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

Non-finite number values (`NaN`, `+Infinity`, or `-Infinity`) set the result to zero.

#### napi_get_value_int64

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_int64(napi_env env,
                                 napi_value value,
                                 int64_t* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript `Number`.
- `[out] result`: C `int64` primitive equivalent of the given JavaScript `Number`.

Returns `napi_ok` if the API succeeded. If a non-number `napi_value` is passed in it returns `napi_number_expected`.

This API returns the C `int64` primitive equivalent of the given JavaScript `Number`.

`Number` values outside the range of [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) will lose precision.

Non-finite number values (`NaN`, `+Infinity`, or `-Infinity`) set the result to zero.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript string.
- `[in] buf`: Buffer to write the ISO-8859-1-encoded string into. If NULL is passed in, the length of the string (in bytes) is returned.
- `[in] bufsize`: Size of the destination buffer. When this value is insufficient, the returned string will be truncated.
- `[out] result`: Number of bytes copied into the buffer, excluding the null terminator.

Returns `napi_ok` if the API succeeded. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

This API returns the ISO-8859-1-encoded string corresponding the value passed in.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript string.
- `[in] buf`: Buffer to write the UTF8-encoded string into. If NULL is passed in, the length of the string (in bytes) is returned.
- `[in] bufsize`: Size of the destination buffer. When this value is insufficient, the returned string will be truncated.
- `[out] result`: Number of bytes copied into the buffer, excluding the null terminator.

Returns `napi_ok` if the API succeeded. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

This API returns the UTF8-encoded string corresponding the value passed in.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript string.
- `[in] buf`: Buffer to write the UTF16-LE-encoded string into. If NULL is passed in, the length of the string (in 2-byte code units) is returned.
- `[in] bufsize`: Size of the destination buffer. When this value is insufficient, the returned string will be truncated.
- `[out] result`: Number of 2-byte code units copied into the buffer, excluding the null terminator.

Returns `napi_ok` if the API succeeded. If a non-`String` `napi_value` is passed in it returns `napi_string_expected`.

This API returns the UTF16-encoded string corresponding the value passed in.

#### napi_get_value_uint32

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_value_uint32(napi_env env,
                                  napi_value value,
                                  uint32_t* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: `napi_value` representing JavaScript `Number`.
- `[out] result`: C primitive equivalent of the given `napi_value` as a `uint32_t`.

Returns `napi_ok` if the API succeeded. If a non-number `napi_value` is passed in it returns `napi_number_expected`.

This API returns the C primitive equivalent of the given `napi_value` as a `uint32_t`.

### Functions to get global instances

#### napi_get_boolean

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The value of the boolean to retrieve.
- `[out] result`: `napi_value` representing JavaScript `Boolean` singleton to retrieve.

Returns `napi_ok` if the API succeeded.

This API is used to return the JavaScript singleton object that is used to represent the given boolean value.

#### napi_get_global

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[out] result`: `napi_value` representing JavaScript `global` object.

Returns `napi_ok` if the API succeeded.

This API returns the `global` object.

#### napi_get_null

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[out] result`: `napi_value` representing JavaScript `null` object.

Returns `napi_ok` if the API succeeded.

This API returns the `null` object.

#### napi_get_undefined

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[out] result`: `napi_value` representing JavaScript Undefined value.

Returns `napi_ok` if the API succeeded.

This API returns the Undefined object.

## Working with JavaScript Values - Abstract Operations

N-API exposes a set of APIs to perform some abstract operations on JavaScript values. Some of these operations are documented under [Section 7](https://tc39.github.io/ecma262/#sec-abstract-operations) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

These APIs support doing one of the following:

1. Coerce JavaScript values to specific JavaScript types (such as `Number` or `String`).
2. Check the type of a JavaScript value.
3. Check for equality between two JavaScript values.

### napi_coerce_to_bool

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_bool(napi_env env,
                                napi_value value,
                                napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to coerce.
- `[out] result`: `napi_value` representing the coerced JavaScript `Boolean`.

Returns `napi_ok` if the API succeeded.

This API implements the abstract operation `ToBoolean()` as defined in [Section 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_coerce_to_number

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_number(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to coerce.
- `[out] result`: `napi_value` representing the coerced JavaScript `Number`.

Returns `napi_ok` if the API succeeded.

This API implements the abstract operation `ToNumber()` as defined in [Section 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_coerce_to_object

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_object(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to coerce.
- `[out] result`: `napi_value` representing the coerced JavaScript `Object`.

Returns `napi_ok` if the API succeeded.

This API implements the abstract operation `ToObject()` as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_coerce_to_string

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_coerce_to_string(napi_env env,
                                  napi_value value,
                                  napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to coerce.
- `[out] result`: `napi_value` representing the coerced JavaScript `String`.

Returns `napi_ok` if the API succeeded.

This API implements the abstract operation `ToString()` as defined in [Section 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) of the ECMAScript Language Specification. This API can be re-entrant if getters are defined on the passed-in `Object`.

### napi_typeof

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value whose type to query.
- `[out] result`: The type of the JavaScript value.

Returns `napi_ok` if the API succeeded.

- `napi_invalid_arg` if the type of `value` is not a known ECMAScript type and `value` is not an External value.

This API represents behavior similar to invoking the `typeof` Operator on the object as defined in [Section 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) of the ECMAScript Language Specification. However, it has support for detecting an External value. If `value` has a type that is invalid, an error is returned.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] object`: The JavaScript value to check.
- `[in] constructor`: The JavaScript function object of the constructor function to check against.
- `[out] result`: Boolean that is set to true if `object instanceof constructor` is true.

Returns `napi_ok` if the API succeeded.

This API represents invoking the `instanceof` Operator on the object as defined in [Section 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) of the ECMAScript Language Specification.

### napi_is_array

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given object is an array.

Returns `napi_ok` if the API succeeded.

This API represents invoking the `IsArray` operation on the object as defined in [Section 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) of the ECMAScript Language Specification.

### napi_is_arraybuffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given object is an `ArrayBuffer`.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is an array buffer.

### napi_is_buffer

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given `napi_value` represents a `node::Buffer` object.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is a buffer.

### napi_is_error

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given `napi_value` represents an `Error` object.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is an `Error`.

### napi_is_typedarray

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given `napi_value` represents a `TypedArray`.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is a typed array.

### napi_is_dataview

<!-- YAML
added: v8.3.0
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] value`: The JavaScript value to check.
- `[out] result`: Whether the given `napi_value` represents a `DataView`.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in is a `DataView`.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] lhs`: The JavaScript value to check.
- `[in] rhs`: The JavaScript value to check against.
- `[out] result`: Whether the two `napi_value` objects are equal.

Returns `napi_ok` if the API succeeded.

This API represents the invocation of the Strict Equality algorithm as defined in [Section 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) of the ECMAScript Language Specification.

## Working with JavaScript Properties

N-API exposes a set of APIs to get and set properties on JavaScript objects. Some of these types are documented under [Section 7](https://tc39.github.io/ecma262/#sec-operations-on-objects) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).

Properties in JavaScript are represented as a tuple of a key and a value. Fundamentally, all property keys in N-API can be represented in one of the following forms:

- Named: a simple UTF8-encoded string
- Integer-Indexed: an index value represented by `uint32_t`
- JavaScript value: these are represented in N-API by `napi_value`. This can be a `napi_value` representing a `String`, `Number`, or `Symbol`.

N-API values are represented by the type `napi_value`. Any N-API call that requires a JavaScript value takes in a `napi_value`. However, it's the caller's responsibility to make sure that the `napi_value` in question is of the JavaScript type expected by the API.

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

- `napi_default` - Used to indicate that no explicit attributes are set on the given property. By default, a property is read only, not enumerable and not configurable.
- `napi_writable` - Used to indicate that a given property is writable.
- `napi_enumerable` - Used to indicate that a given property is enumerable.
- `napi_configurable` - Used to indicate that a given property is configurable, as defined in [Section 6.1.7.1](https://tc39.github.io/ecma262/#table-2) of the [ECMAScript Language Specification](https://tc39.github.io/ecma262/).
- `napi_static` - Used to indicate that the property will be defined as a static property on a class as opposed to an instance property, which is the default. This is used only by [`napi_define_class`][]. It is ignored by `napi_define_properties`.

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

- `utf8name`: Optional `String` describing the key for the property, encoded as UTF8. One of `utf8name` or `name` must be provided for the property.
- `name`: Optional `napi_value` that points to a JavaScript string or symbol to be used as the key for the property. One of `utf8name` or `name` must be provided for the property.
- `value`: The value that's retrieved by a get access of the property if the property is a data property. If this is passed in, set `getter`, `setter`, `method` and `data` to `NULL` (since these members won't be used).
- `getter`: A function to call when a get access of the property is performed. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is accessed from JavaScript code (or if a get on the property is performed using a N-API call).
- `setter`: A function to call when a set access of the property is performed. If this is passed in, set `value` and `method` to `NULL` (since these members won't be used). The given function is called implicitly by the runtime when the property is set from JavaScript code (or if a set on the property is performed using a N-API call).
- `method`: Set this to make the property descriptor object's `value` property to be a JavaScript function represented by `method`. If this is passed in, set `value`, `getter` and `setter` to `NULL` (since these members won't be used).
- `attributes`: The attributes associated with the particular property. See [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: The callback data passed into `method`, `getter` and `setter` if this function is invoked.

### Functions

#### napi_get_property_names

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_property_names(napi_env env,
                                    napi_value object,
                                    napi_value* result);
```

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the properties.
- `[out] result`: A `napi_value` representing an array of JavaScript values that represent the property names of the object. The API can be used to iterate over `result` using [`napi_get_array_length`][] and [`napi_get_element`][].

Returns `napi_ok` if the API succeeded.

This API returns the names of the enumerable properties of `object` as an array of strings. The properties of `object` whose key is a symbol will not be included.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object on which to set the property.
- `[in] key`: The name of the property to set.
- `[in] value`: The property value.

Returns `napi_ok` if the API succeeded.

This API set a property on the `Object` passed in.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the property.
- `[in] key`: The name of the property to retrieve.
- `[out] result`: The value of the property.

Returns `napi_ok` if the API succeeded.

This API gets the requested property from the `Object` passed in.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] key`: The name of the property whose existence to check.
- `[out] result`: Whether the property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in has the named property.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] key`: The name of the property to delete.
- `[out] result`: Whether the property deletion succeeded or not. `result` can optionally be ignored by passing `NULL`.

Returns `napi_ok` if the API succeeded.

This API attempts to delete the `key` own property from `object`.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] key`: The name of the own property whose existence to check.
- `[out] result`: Whether the own property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This API checks if the `Object` passed in has the named own property. `key` must be a string or a `Symbol`, or an error will be thrown. N-API will not perform any conversion between data types.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object on which to set the property.
- `[in] utf8Name`: The name of the property to set.
- `[in] value`: The property value.

Returns `napi_ok` if the API succeeded.

This method is equivalent to calling [`napi_set_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the property.
- `[in] utf8Name`: The name of the property to get.
- `[out] result`: The value of the property.

Returns `napi_ok` if the API succeeded.

This method is equivalent to calling [`napi_get_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] utf8Name`: The name of the property whose existence to check.
- `[out] result`: Whether the property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This method is equivalent to calling [`napi_has_property`][] with a `napi_value` created from the string passed in as `utf8Name`.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to set the properties.
- `[in] index`: The index of the property to set.
- `[in] value`: The property value.

Returns `napi_ok` if the API succeeded.

This API sets and element on the `Object` passed in.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the property.
- `[in] index`: The index of the property to get.
- `[out] result`: The value of the property.

Returns `napi_ok` if the API succeeded.

This API gets the element at the requested index.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] index`: The index of the property whose existence to check.
- `[out] result`: Whether the property exists on the object or not.

Returns `napi_ok` if the API succeeded.

This API returns if the `Object` passed in has an element at the requested index.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object to query.
- `[in] index`: The index of the property to delete.
- `[out] result`: Whether the element deletion succeeded or not. `result` can optionally be ignored by passing `NULL`.

Returns `napi_ok` if the API succeeded.

This API attempts to delete the specified `index` from `object`.

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

- `[in] env`: The environment that the N-API call is invoked under.
- `[in] object`: The object from which to retrieve the properties.
- `[in] property_count`: The number of elements in the `properties` array.
- `[in] properties`: The array of property descriptors.

Returns `napi_ok` if the API succeeded.

This method allows the efficient definition of multiple properties on a given object. The properties are defined using property descriptors (see [`napi_property_descriptor`][]). Given an array of such property descriptors, this API will set the properties on the object one at a time, as defined by `DefineOwnProperty()` (described in [Section 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) of the ECMA262 specification).

## Working with JavaScript Functions

N-API provides a set of APIs that allow JavaScript code to call back into native code. N-API APIs that support calling back into native code take in a callback functions represented by the `napi_callback` type. When the JavaScript VM calls back to native code, the `napi_callback` function provided is invoked. The APIs documented in this section allow the callback function to do the following:

- Get information about the context in which the callback was invoked.
- Get the arguments passed into the callback.
- Return a `napi_value` back from the callback.

Additionally, N-API provides a set of functions which allow calling JavaScript functions from native code. One can either call a function like a regular JavaScript function call, or as a constructor function.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] recv`: The `this` object passed to the called function.
- `[in] func`: `napi_value` representing the JavaScript function to be invoked.
- `[in] argc`: The count of elements in the `argv` array.
- `[in] argv`: Array of `napi_values` representing JavaScript values passed in as arguments to the function.
- `[out] result`: `napi_value` representing the JavaScript object returned.

Returns `napi_ok` if the API succeeded.

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
-->

```C
napi_status napi_create_function(napi_env env,
                                 const char* utf8name,
                                 napi_callback cb,
                                 void* data,
                                 napi_value* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] utf8Name`: The name of the function encoded as UTF8. This is visible within JavaScript as the new function object's `name` property.
- `[in] cb`: The native function which should be called when this function object is invoked.
- `[in] data`: User-provided data context. This will be passed back into the function when invoked later.
- `[out] result`: `napi_value` representing the JavaScript function object for the newly created function.

Returns `napi_ok` if the API succeeded.

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

The string passed to require is not necessarily the name passed into `NAPI_MODULE` in the earlier snippet but the name of the target in `binding.gyp` responsible for creating the `.node` file.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] cbinfo`: The callback info passed into the callback function.
- `[in-out] argc`: Specifies the size of the provided `argv` array and receives the actual count of arguments.
- `[out] argv`: Buffer to which the `napi_value` representing the arguments are copied. If there are more arguments than the provided count, only the requested number of arguments are copied. If there are fewer arguments provided than claimed, the rest of `argv` is filled with `napi_value` values that represent `undefined`.
- `[out] this`: Receives the JavaScript `this` argument for the call.
- `[out] data`: Receives the data pointer for the callback.

Returns `napi_ok` if the API succeeded.

This method is used within a callback function to retrieve details about the call like the arguments and the `this` pointer from a given callback info.

### napi_get_new_target

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_get_new_target(napi_env env,
                                napi_callback_info cbinfo,
                                napi_value* result)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] cbinfo`: The callback info passed into the callback function.
- `[out] result`: The `new.target` of the constructor call.

Returns `napi_ok` if the API succeeded.

This API returns the `new.target` of the constructor call. If the current callback is not a constructor call, the result is `NULL`.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
- `[in] argc`: The count of elements in the `argv` array.
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

Returns `napi_ok` if the API succeeded.

## Object Wrap

N-API offers a way to "wrap" C++ classes and instances so that the class constructor and methods can be called from JavaScript.

1. The [`napi_define_class`][] API defines a JavaScript class with constructor, static properties and methods, and instance properties and methods that correspond to the C++ class.
2. When JavaScript code invokes the constructor, the constructor callback uses [`napi_wrap`][] to wrap a new C++ instance in a JavaScript object, then returns the wrapper object.
3. When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` C++ function is invoked. For an instance callback, [`napi_unwrap`][] obtains the C++ instance that is the target of the call.

For wrapped objects it may be difficult to distinguish between a function called on a class prototype and a function called on an instance of a class. A common pattern used to address this problem is to save a persistent reference to the class constructor for later `instanceof` checks.

As an example:

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

- `[in] env`: The environment that the API is invoked under.
- `[in] utf8name`: Name of the JavaScript constructor function; this is not required to be the same as the C++ class name, though it is recommended for clarity.
- `[in] length`: The length of the `utf8name` in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
- `[in] constructor`: Callback function that handles constructing instances of the class. (This should be a static method on the class, not an actual C++ constructor function.)
- `[in] data`: Optional data to be passed to the constructor callback as the `data` property of the callback info.
- `[in] property_count`: Number of items in the `properties` array argument.
- `[in] properties`: Array of property descriptors describing static and instance data properties, accessors, and methods on the class See `napi_property_descriptor`.
- `[out] result`: A `napi_value` representing the constructor function for the class.

Returns `napi_ok` if the API succeeded.

Defines a JavaScript class that corresponds to a C++ class, including:

- A JavaScript constructor function that has the class name and invokes the provided C++ constructor callback.
- Properties on the constructor function corresponding to *static* data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
- Properties on the constructor function's `prototype` object corresponding to *non-static* data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

The C++ constructor callback should be a static method on the class that calls the actual class constructor, then wraps the new C++ instance in a JavaScript object, and returns the wrapper object. See `napi_wrap()` for details.

The JavaScript constructor function returned from [`napi_define_class`][] is often saved and used later, to construct new instances of the class from native code, and/or check whether provided values are instances of the class. In that case, to prevent the function value from being garbage-collected, create a persistent reference to it using [`napi_create_reference`][] and ensure the reference count is kept >= 1.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] js_object`: The JavaScript object that will be the wrapper for the native object. This object *must* have been created from the `prototype` of a constructor that was created using `napi_define_class()`.
- `[in] native_object`: The native instance that will be wrapped in the JavaScript object.
- `[in] finalize_cb`: Optional native callback that can be used to free the native instance when the JavaScript object is ready for garbage-collection.
- `[in] finalize_hint`: Optional contextual hint that is passed to the finalize callback.
- `[out] result`: Optional reference to the wrapped object.

Returns `napi_ok` if the API succeeded.

Wraps a native instance in a JavaScript object. The native instance can be retrieved later using `napi_unwrap()`.

When JavaScript code invokes a constructor for a class that was defined using `napi_define_class()`, the `napi_callback` for the constructor is invoked. After constructing an instance of the native class, the callback must then call `napi_wrap()` to wrap the newly constructed instance in the already-created JavaScript object that is the `this` argument to the constructor callback. (That `this` object was created from the constructor function's `prototype`, so it already has definitions of all the instance properties and methods.)

Typically when wrapping a class instance, a finalize callback should be provided that simply deletes the native instance that is received as the `data` argument to the finalize callback.

The optional returned reference is initially a weak reference, meaning it has a reference count of 0. Typically this reference count would be incremented temporarily during async operations that require the instance to remain valid.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. (If it is deleted before then, then the finalize callback may never be invoked.) Therefore, when obtaining a reference a finalize callback is also required in order to enable correct proper of the reference.

This API may modify the prototype chain of the wrapper object. Afterward, additional manipulation of the wrapper's prototype chain may cause `napi_unwrap()` to fail.

Calling `napi_wrap()` a second time on an object will return an error. To associate another native instance with the object, use `napi_remove_wrap()` first.

### napi_unwrap

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_unwrap(napi_env env,
                        napi_value js_object,
                        void** result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] js_object`: The object associated with the native instance.
- `[out] result`: Pointer to the wrapped native instance.

Returns `napi_ok` if the API succeeded.

Retrieves a native instance that was previously wrapped in a JavaScript object using `napi_wrap()`.

When JavaScript code invokes a method or property accessor on the class, the corresponding `napi_callback` is invoked. If the callback is for an instance method or accessor, then the `this` argument to the callback is the wrapper object; the wrapped C++ instance that is the target of the call can be obtained then by calling `napi_unwrap()` on the wrapper object.

### napi_remove_wrap

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_remove_wrap(napi_env env,
                             napi_value js_object,
                             void** result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] js_object`: The object associated with the native instance.
- `[out] result`: Pointer to the wrapped native instance.

Returns `napi_ok` if the API succeeded.

Retrieves a native instance that was previously wrapped in the JavaScript object `js_object` using `napi_wrap()` and removes the wrapping, thereby restoring the JavaScript object's prototype chain. If a finalize callback was associated with the wrapping, it will no longer be called when the JavaScript object becomes garbage-collected.

## Simple Asynchronous Operations

Addon modules often need to leverage async helpers from libuv as part of their implementation. This allows them to schedule work to be executed asynchronously so that their methods can return in advance of the work being completed. This is important in order to allow them to avoid blocking overall execution of the Node.js application.

N-API provides an ABI-stable interface for these supporting functions which covers the most common asynchronous use cases.

N-API defines the `napi_work` structure which is used to manage asynchronous workers. Instances are created/deleted with [`napi_create_async_work`][] and [`napi_delete_async_work`][].

The `execute` and `complete` callbacks are functions that will be invoked when the executor is ready to execute and when it completes its task respectively. These functions implement the following interfaces:

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

- `[in] env`: The environment that the API is invoked under.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
- `[in] complete`: The native function which will be called when the asynchronous logic is completed or is cancelled. The given function is called from the main event loop thread.
- `[in] data`: User-provided data context. This will be passed back into the execute and complete functions.
- `[out] result`: `napi_async_work*` which is the handle to the newly created async work.

Returns `napi_ok` if the API succeeded.

This API allocates a work object that is used to execute logic asynchronously. It should be freed using [`napi_delete_async_work`][] once the work is no longer required.

`async_resource_name` should be a null-terminated, UTF-8-encoded string.

The `async_resource_name` identifier is provided by the user and should be representative of the type of async work being performed. It is also recommended to apply namespacing to the identifier, e.g. by including the module name. See the [`async_hooks` documentation][async_hooks `type`] for more information.

### napi_delete_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_delete_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

Returns `napi_ok` if the API succeeded.

This API frees a previously allocated work object.

This API can be called even if there is a pending JavaScript exception.

### napi_queue_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

Returns `napi_ok` if the API succeeded.

This API requests that the previously allocated work be scheduled for execution.

### napi_cancel_async_work

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_cancel_async_work(napi_env env,
                                   napi_async_work work);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

Returns `napi_ok` if the API succeeded.

This API cancels queued work if it has not yet been started. If it has already started executing, it cannot be cancelled and `napi_generic_failure` will be returned. If successful, the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even if it has been successfully cancelled.

This API can be called even if there is a pending JavaScript exception.

## Custom Asynchronous Operations

The simple asynchronous work APIs above may not be appropriate for every scenario. When using any other asynchronous mechanism, the following APIs are necessary to ensure an asynchronous operation is properly tracked by the runtime.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[out] result`: The initialized async context.

Returns `napi_ok` if the API succeeded.

### napi_async_destroy

<!-- YAML
added: v8.6.0
-->

```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] async_context`: The async context to be destroyed.

Returns `napi_ok` if the API succeeded.

This API can be called even if there is a pending JavaScript exception.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
- `[in] recv`: The `this` object passed to the called function.
- `[in] func`: `napi_value` representing the JavaScript function to be invoked.
- `[in] argc`: The count of elements in the `argv` array.
- `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
- `[out] result`: `napi_value` representing the JavaScript object returned.

Returns `napi_ok` if the API succeeded.

This method allows a JavaScript function object to be called from a native add-on. This API is similar to `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). It is a fairly simple wrapper around `node::MakeCallback`.

Note it is *not* necessary to use `napi_make_callback` from within a `napi_async_complete_callback`; in that situation the callback's async context has already been set up, so a direct call to `napi_call_function` is sufficient and appropriate. Use of the `napi_make_callback` function may be required when implementing custom async behavior that does not use `napi_create_async_work`.

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

- `[in] env`: The environment that the API is invoked under.
- `[in] resource_object`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
- `[out] result`: The newly created scope.

There are cases (for example resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls. If there is no other script on the stack the [`napi_open_callback_scope`][] and [`napi_close_callback_scope`][] functions can be used to open/close the required scope.

### napi_close_callback_scope

<!-- YAML
added: v9.6.0
-->

```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```

- `[in] env`: The environment that the API is invoked under.
- `[in] scope`: The scope to be closed.

This API can be called even if there is a pending JavaScript exception.

## Version Management

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

- `[in] env`: The environment that the API is invoked under.
- `[out] version`: A pointer to version information for Node.js itself.

Returns `napi_ok` if the API succeeded.

This function fills the `version` struct with the major, minor, and patch version of Node.js that is currently running, and the `release` field with the value of [`process.release.name`][`process.release`].

The returned buffer is statically allocated and does not need to be freed.

### napi_get_version

<!-- YAML
added: v8.0.0
-->

```C
napi_status napi_get_version(napi_env env,
                             uint32_t* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] result`: The highest version of N-API supported.

Returns `napi_ok` if the API succeeded.

This API returns the highest N-API version supported by the Node.js runtime. N-API is planned to be additive such that newer releases of Node.js may support additional API functions. In order to allow an addon to use a newer function when running with versions of Node.js that support it, while providing fallback behavior when running with Node.js versions that don't support it:

- Call `napi_get_version()` to determine if the API is available.
- If available, dynamically load a pointer to the function using `uv_dlsym()`.
- Use the dynamically loaded pointer to invoke the function.
- If the function is not available, provide an alternate implementation that does not use the function.

## Memory Management

### napi_adjust_external_memory

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_adjust_external_memory(napi_env env,
                                                    int64_t change_in_bytes,
                                                    int64_t* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
- `[out] result`: The adjusted value

Returns `napi_ok` if the API succeeded.

This function gives V8 an indication of the amount of externally allocated memory that is kept alive by JavaScript objects (i.e. a JavaScript object that points to its own memory allocated by a native module). Registering externally allocated memory will trigger global garbage collections more often than it would otherwise.

<!-- it's very convenient to have all the anchors indexed -->

<!--lint disable no-unused-definitions remark-lint-->

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
-->

```C
napi_status napi_create_promise(napi_env env,
                                napi_deferred* deferred,
                                napi_value* promise);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] deferred`: A newly created deferred object which can later be passed to `napi_resolve_deferred()` or `napi_reject_deferred()` to resolve resp. reject the associated promise.
- `[out] promise`: The JavaScript promise associated with the deferred object.

Returns `napi_ok` if the API succeeded.

This API creates a deferred object and a JavaScript promise.

### napi_resolve_deferred

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_resolve_deferred(napi_env env,
                                  napi_deferred deferred,
                                  napi_value resolution);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] deferred`: The deferred object whose associated promise to resolve.
- `[in] resolution`: The value with which to resolve the promise.

This API resolves a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to resolve JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

### napi_reject_deferred

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_reject_deferred(napi_env env,
                                 napi_deferred deferred,
                                 napi_value rejection);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] deferred`: The deferred object whose associated promise to resolve.
- `[in] rejection`: The value with which to reject the promise.

This API rejects a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to reject JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

### napi_is_promise

<!-- YAML
added: v8.5.0
-->

```C
napi_status napi_is_promise(napi_env env,
                            napi_value promise,
                            bool* is_promise);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] promise`: The promise to examine
- `[out] is_promise`: Flag indicating whether `promise` is a native promise object - that is, a promise object created by the underlying engine.

## Script execution

N-API provides an API for executing a string containing JavaScript using the underlying JavaScript engine.

### napi_run_script

<!-- YAML
added: v8.5.0
-->

```C
NAPI_EXTERN napi_status napi_run_script(napi_env env,
                                        napi_value script,
                                        napi_value* result);
```

- `[in] env`: The environment that the API is invoked under.
- `[in] script`: A JavaScript string containing the script to execute.
- `[out] result`: The value resulting from having executed the script.

## libuv event loop

N-API provides a function for getting the current event loop associated with a specific `napi_env`.

### napi_get_uv_event_loop

<!-- YAML
added: v9.3.0
-->

```C
NAPI_EXTERN napi_status napi_get_uv_event_loop(napi_env env,
                                               uv_loop_t** loop);
```

- `[in] env`: The environment that the API is invoked under.
- `[out] loop`: The current libuv loop instance.