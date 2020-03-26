# N-API

<!--introduced_in=v7.10.0-->

> Стабильность: 2 - Стабильно

N-API (произносится как N в письме, после которого следует API) - это API для создания собственных дополнений. Она независима от базовой среды выполнения JavaScript (ранее V8) и поддерживается как часть самого Node.js. Этот API будет стабильным двоичным интерфейсом приложения (Application Binary Interface - ABI) во всех версиях Node.js. Он предназначен для изоляции Расширений от изменений в базовом движке JavaScript и позволяет модулям, скомпилированным для одной версии, быть запущенными в более поздних версиях Node.js без перекомпиляции.

Аддоны создаются и/или упаковываются с использованием того же подхода либо с тем же набором инструментов, которые описаны в разделе [C++ Addons](addons.html). Единственное отличие - набор API, которые используются собственным кодом. Вместо использования V8 или API [Native Abstractions для Node.js](https://github.com/nodejs/nan) используются функции, доступные в N-API.

API, предоставляемые N-API, обычно используются для создания и манипулирования значениями JavaScript. Концепции и операции обычно соответствуют идеям, указанным в Спецификации языка ECMA262. API имеют следующие свойства:
- Все вызовы N-API возвращают код состояния типа `napi_status`. Это состояние указывает, был ли вызов API удачным или нет.
- Возвращаемое значение API передается через выходной параметр.
- Все значения JavaScript абстрагируются от неясного типа с именем `napi_value`.
- В случае статус кода 'error', дополнительную информацию можно получить, используя `napi_get_last_error_info`. Дополнительную информацию можно найти в разделе обработки ошибок [Error Handling](#n_api_error_handling).

Документация для N-API устроена следующим образом:

* [Основные типы данных N-API](#n_api_basic_n_api_data_types)
* [Обработка ошибки](#n_api_error_handling)
* [Управление жизненным циклом объекта](#n_api_object_lifetime_management)
* [Регистрация модуля](#n_api_module_registration)
* [Работа со значениями JavaScript](#n_api_working_with_javascript_values)
* \[Работа со значениями JavaScript - Абстрактные операции\]\[\]
* [Работа со свойствами JavaScript](#n_api_working_with_javascript_properties)
* [Работа с функциями JavaScript](#n_api_working_with_javascript_functions)
* [Обтекание объекта](#n_api_object_wrap)
* [Простые асинхронные операции](#n_api_simple_asynchronous_operations)
* [Пользовательские асинхронные операции](#n_api_custom_asynchronous_operations)
* [Промисы](#n_api_promises)
* [Выполнение сценария](#n_api_script_execution)

N-API - это 'C API', который обеспечивает стабильность ABI (application binary interface - двоичный интерфейс приложения) в версиях Node.js и различных уровнях компилятора. Однако мы также понимаем, что 'C++ API' может быть проще в использовании во многих случаях. Для поддержки этих случаев мы ожидаем, что будет один или несколько модулей C++ обёрток, которые предоставляют встроенный C++ API. Бинарные файлы, созданные с помощью этих модулей-обёрток, будут зависеть от символов для функций на основе С N-API, которые экспортируются Node.js. Такого рода обёртки не являются частью N-API и не будут поддерживаться как часть Node.js. Один из таких примеров: [node-api](https://github.com/nodejs/node-addon-api).

## Usage

Для использования функции N-API включите файл [node_api.h](https://github.com/nodejs/node/blob/master/src/node_api.h), который находится в каталоге src в дереве разработки узла. Например:
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

## Основные типы данных N-API

N-API представляет следующие фундаментальные типы данных как абстракции, которые используются различными API. Эти API нужно рассматривать как непрозрачные, при этом возможна только интроспективная проверка с помощью других вызовов N-API.

### napi_status
Интегральный код состояния, указывающий на успех или неудачу вызова N-API. В настоящее время поддерживаются следующие коды состояния.
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
Если требуется дополнительная информация по API, который возвращается с ошибкой, ее можно получить с помощью вызова `napi_get_last_error_info`.

### napi_extended_error_info
```C
typedef struct {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
} napi_extended_error_info;
```

- `error_message`: UTF8-кодированная строка, содержащая VM-нейтральное описание ошибки.
- `engine_reserved`: Зарезервировано для сведений об ошибках, относящихся к VM. В настоящее время это не реализовано ни для одной виртуальной машины.
- `engine_error_code`: Код ошибки, относящийся к VM. В настоящее время это не реализовано ни для одной виртуальной машины.
- `error_code`: Код состояния N-API, который возник с последней ошибкой.

Для дополнительной информации смотрите раздел [Error Handling](#n_api_error_handling).

### napi_env
`napi_env` используется для представления контекста, который базовая реализация N-API может использовать для сохранения состояния, относящегося к VM. Эта структура передается нативным функциям, когда они вызываются, и ее необходимо возвращать при выполнении вызовов N-API. В частности, тот же `napi_env`, который был передан при вызове исходной нативной функции, должен быть передан любому последующему вложенному вызову N-API. Кэширование `napi_env` для общего повторного использования не допускается.

### napi_value
Это непрозрачный указатель, который используется для представления значения JavaScript.

### napi_threadsafe_function

> Стабильность: 2 - Стабильно

This is an opaque pointer that represents a JavaScript function which can be called asynchronously from multiple threads via `napi_call_threadsafe_function()`.

### napi_threadsafe_function_release_mode

> Стабильность: 2 - Стабильно

A value to be given to `napi_release_threadsafe_function()` to indicate whether the thread-safe function is to be closed immediately (`napi_tsfn_abort`) or merely released (`napi_tsfn_release`) and thus available for subsequent use via `napi_acquire_threadsafe_function()` and `napi_call_threadsafe_function()`.
```C
typedef enum {
  napi_tsfn_release,
  napi_tsfn_abort
} napi_threadsafe_function_release_mode;
```

### napi_threadsafe_function_call_mode

> Стабильность: 2 - Стабильно

A value to be given to `napi_call_threadsafe_function()` to indicate whether the call should block whenever the queue associated with the thread-safe function is full.
```C
typedef enum {
  napi_tsfn_nonblocking,
  napi_tsfn_blocking
} napi_threadsafe_function_call_mode;
```

### Типы управления памятью N-API
#### napi_handle_scope
Это абстракция, которая используется для управления и изменения времени жизни объектов, созданных в определенной области видимости. Значения N-API создаются в контексте области видимости обработчика. Когда нативный метод вызывается из JavaScript, область обработчика будет существовать по умолчанию. Если пользователь явно не создает новую область обработчика, значения N-API будут созданы в области обработчика по умолчанию. Для любых вызовов кода вне выполнения нативного метода (например, во время вызова обратного вызова libuv) модуль должен создать область действия перед вызовом любых функций, которые могут привести к созданию значений JavaScript.

Области действия обработчика создаются с использованием [`napi_open_handle_scope`][] и уничтожаются с помощью [`napi_close_handle_scope`][]. Закрытие области действия может указывать GC, что все `napi_value`, созданные в течение времени жизни области действия обработчика, более не являются ссылками из текущего кадра стека.

Для более подробной информации смотрите [Управление жизненным циклом объекта](#n_api_object_lifetime_management).

#### napi_escapable_handle_scope
Области видимости обработчика - это особый тип области видимости обработчика, который возвращает значения, созданные в конкретной области видимости, в родительскую область видимости.

#### napi_ref
Это абстракция для использования ссылки `napi_value`. Это позволяет пользователям управлять временем жизни значений JavaScript, включая явное определение их минимального времени жизни.

Для более подробной информации смотрите [Управление жизненным циклом объекта](#n_api_object_lifetime_management).

### Типы обратных вызовов N-API
#### napi_callback_info
Непрозрачный тип данных, который передается в функцию обратного вызова. Может быть использован для получения дополнительной информации о контексте, в котором был вызван обратный вызов.

#### napi_callback
Тип указателя функции для предоставленных пользователем собственных функций, которые должны быть доступны JavaScript через N-API. Функции обратного вызова должны соответствовать следующей сигнатуре:
```C
typedef napi_value (*napi_callback)(napi_env, napi_callback_info);
```

#### napi_finalize
Тип указателя функции для предоставляемых надстройкой функций, которые позволяют пользователю получать уведомления, когда внешние данные готовы к очистке, поскольку объект, с которым они были связаны, был удален сборщиком мусора. Пользователь должен предоставить функцию, удовлетворяющую следующей сигнатуре, которая будет вызываться для сбора объекта. В настоящее время `napi_finalize` можно использовать для определения того, когда собираются объекты, имеющие внешние данные.

```C
typedef void (*napi_finalize)(napi_env env,
                              void* finalize_data,
                              void* finalize_hint);
```


#### napi_async_execute_callback
Указатель функции, используемый с функциями, которые поддерживают асинхронные операции. Функции обратного вызова должны соответствовать следующей сигнатуре:

```C
typedef void (*napi_async_execute_callback)(napi_env env, void* data);
```

#### napi_async_complete_callback
Указатель функции, используемый с функциями, которые поддерживают асинхронные операции. Функции обратного вызова должны соответствовать следующей сигнатуре:

```C
typedef void (*napi_async_complete_callback)(napi_env env,
                                             napi_status status,
                                             void* data);
```

#### napi_threadsafe_function_call_js

> Стабильность: 2 - Стабильно

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

## Обработка ошибки
N-API использует как возвращаемые значения, так и исключения JavaScript для обработки ошибок. В следующих разделах разъясняется подход к каждому случаю.

### Возвращаемые значения
Все функции N-API используют один и тот же шаблон обработки ошибок. Возвращаемый тип всех функций API - `napi_status`.

Возвращаемое значение будет `napi_ok`, если запрос был успешным и не было выдано неперехваченное исключение JavaScript. Если произошла ошибка И было выдано исключение, то вернется значение `napi_status` для ошибки. Если было выдано исключение, но ошибка не произошла, вернется `napi_pending_exception`.

В случаях, когда возвращается возвращаемое значение, отличное от `napi_ok` или `napi_pending_exception`, необходимо вызывать [`napi_is_exception_pending`][], чтобы проверить, находится ли исключение в состоянии ожидания. Для более подробной информации смотрите раздел "Исключения".

Полный набор возможных значений napi_status обозначен в `napi_api_types.h`.

Возвращаемое значение `napi_status` обеспечивает VM-независимое представление ошибки, которая произошла. В некоторых случаях полезно иметь возможность получить более подробную информацию, включая строку, представляющую ошибку, а также информацию, которая относится к (движку) VM.

Для получения этой информации предоставляется [`napi_get_last_error_info`][], которая возвращает структуру `napi_extended_error_info`. Формат структуры `napi_extended_error_info` выглядит следующим образом:

```C
typedef struct napi_extended_error_info {
  const char* error_message;
  void* engine_reserved;
  uint32_t engine_error_code;
  napi_status error_code;
};
```
- `error_message`: Textual representation of the error that occurred.
- `engine_reserved`: Непрозрачный обработчик, зарезервированный только для использования движка.
- `engine_error_code`: Код ошибки, относящийся к VM.
- `error_code`: код состояния n-api для последней ошибки.

[`napi_get_last_error_info`][] возвращает информацию о последнем выполненном вызове N-API.

*Примечание:* Не полагайтесь на содержимое или формат какой-либо расширенной информации, поскольку она не подлежит семантическому версионированию (SemVer) и может измениться в любое время. Это предназначено только для регистрации.

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
- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: Структура `napi_extended_error_info` с дополнительной информацией об ошибке.

При успешном выполнении API возвращает `napi_ok`.

This API retrieves a `napi_extended_error_info` structure with information about the last error that occurred.

*Примечание*: Содержимое возвращенного `napi_extended_error_info` действительно только до вызова функции n-api для того же `env`.

*Примечание:* Не полагайтесь на содержимое или формат какой-либо расширенной информации, поскольку она не подлежит семантическому версионированию (SemVer) и может измениться в любое время. Это предназначено только для регистрации.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.


### Исключения
Любой вызов функции N-API может привести к ожидающему исключению JavaScript. Это, очевидно, относится к любой функции, которая может вызвать выполнение JavaScript, но N-API указывает, что исключение может ожидаться при возврате любой из функций API.

Если `napi_status`, возвращаемый функцией, равен `napi_ok`, то исключение не ожидается и никаких дополнительных действий не требуется. Если возвращаемое значение `napi_status` является чем-то отличным от `napi_ok` или `napi_pending_exception`, чтобы попытаться восстановить и продолжить вместо простого немедленного возврата, должен быть вызван [`napi_is_exception_pending`][] для определения, ожидает ли исключение или нет.

Когда исключение ожидает рассмотрения, можно использовать один из двух подходов.

Первый подход - выполнить соответствующую очистку, а затем вернуться, чтобы выполнение вернулось в JavaScript. В рамках перехода обратно в JavaScript исключение будет выведено в той точке кода JavaScript, где был вызван нативный метод. Поведение большинства вызовов N-API не определено, пока исключение находится на рассмотрении, и многие просто вернут `napi_pending_exception`, поэтому важно сделать как можно меньше, а затем вернуться к JavaScript, где исключение может быть обработано.

Второй подход - попытаться обработать исключение. В некоторых случаях нативный код может перехватить исключение, выполнить соответствующее действие и затем продолжить. Это рекомендуется только в конкретных случаях, когда известно, что исключение может быть безопасно обработано. В этих случаях можно использовать [`napi_get_and_clear_last_exception`][] для получения и очистки исключения. В случае успеха результат будет содержать обработчик последнего выведенного объекта JavaScript. Если определено, что после получения исключение в конечном итоге не может быть обработано, его можно перебросить с помощью [`napi_throw`][], где error - это объект JavaScript Error, который должен быть выдан.

The following utility functions are also available in case native code needs to throw an exception or determine if a `napi_value` is an instance of a JavaScript `Error` object: [`napi_throw_error`][], [`napi_throw_type_error`][], [`napi_throw_range_error`][] and [`napi_is_error`][].

Следующие служебные функции также доступны в случае, если нативный код должен создать объект Error: [`napi_create_error`][], [`napi_create_type_error`][] и [`napi_create_range_error`][]. где result - это napi_value, которое ссылается на недавно созданный объект JavaScript Error.

Проект Node.js добавляет коды ошибок ко всем внутренне сгенерированным ошибкам. Цель состоит в том, чтобы приложения использовали эти коды ошибок для проверки всех ошибок. Связанные сообщения об ошибках останутся, но будут использоваться только для регистрации и отображения с ожиданием того, что сообщение может измениться без применения SemVer. Для поддержки этой модели с N-API как во внутренней функциональности, так и для специфической функциональности модуля (рекомендуется), функции `throw_` и `create_` принимают опциональный параметр кода, являющийся строкой для кода, который нужно добавить в объект ошибки. Если этот опциональный параметр равен NULL, то код не будет связан с ошибкой. Если указан код, имя, связанное с ошибкой, также обновляется, чтобы быть:

```text
originalName [code]
```

где originalName - исходное имя, связанное с ошибкой, а code - предоставленный код. Например, если код 'ERR_ERROR_1' и создается ошибка TypeError, имя будет:

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] error`: `napi_value` для ошибки, которая должна быть выдана.

При успешном выполнении API возвращает `napi_ok`.

Этот API выдает заданную ошибку JavaScript.


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
- `[in] env`: Среда, в которой вызывается API.
- `[in] code`: Дополнительный код ошибки для установки в ошибку.
- `[in] msg`: Строка С, представляющая текст, который должен быть связан с ошибкой.

При успешном выполнении API возвращает `napi_ok`.

Этот API выдает Error JavaScript с заданным текстом.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] code`: Дополнительный код ошибки для установки в ошибку.
- `[in] msg`: Строка С, представляющая текст, который должен быть связан с ошибкой.

При успешном выполнении API возвращает `napi_ok`.

Этот API выдает TypeError JavaScript с заданным текстом.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] code`: Дополнительный код ошибки для установки в ошибку.
- `[in] msg`: Строка С, представляющая текст, который должен быть связан с ошибкой.

При успешном выполнении API возвращает `napi_ok`.

Этот API выдает RangeError JavaScript с заданным текстом.


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
- `[in] env`: Среда, в которой вызывается API.
- `[in] msg`: `napi_value` для проверки.
- `[out] result`: Логическое значение, которое установлено на true, если `napi_value` представляет ошибку, в противном случае - false.

При успешном выполнении API возвращает `napi_ok`.

Этот API запрашивает `napi_value`, чтобы проверить, представляет ли он объект ошибки.


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
- `[in] env`: Среда, в которой вызывается API.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value, который ссылается на строку JavaScript, чтобы использоваться в качестве сообщения об ошибке.
- `[out] result`: `napi_value`, которая представляет созданную ошибку.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает Error JavaScript с заданным текстом.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value, который ссылается на строку JavaScript, чтобы использоваться в качестве сообщения об ошибке.
- `[out] result`: `napi_value`, которая представляет созданную ошибку.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает TypeError JavaScript с заданным текстом.


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
- `[in] env`: Среда, в которой вызывается API.
- `[in] code`: Optional `napi_value` with the string for the error code to be associated with the error.
- `[in] msg`: napi_value, который ссылается на строку JavaScript, чтобы использоваться в качестве сообщения об ошибке.
- `[out] result`: `napi_value`, которая представляет созданную ошибку.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает RangeError JavaScript с заданным текстом.

#### napi_get_and_clear_last_exception
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_and_clear_last_exception(napi_env env,
                                              napi_value* result);
```

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: Исключение, если одно находится в ожидании, в противном случае - NULL.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает true, если исключение находится в ожидании.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

#### napi_is_exception_pending
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_exception_pending(napi_env env, bool* result);
```

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: Логическое значение, которое установлено на true, если исключение находится в ожидании.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает true, если исключение находится в ожидании.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

#### napi_fatal_exception
<!-- YAML
added: v8.11.2
napiVersion: 3
-->

```C
napi_status napi_fatal_exception(napi_env env, napi_value err);
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] err`: Ошибка, которую вы хотите передать в `uncaughtException`.

Вызовите `uncaughtException` в JavaScript. Полезно, если асинхронный обратный вызов выдает исключение без возможности восстановления.

### Фатальные ошибки

В случае неисправимой ошибки в собственном модуле может быть выдана фатальная ошибка, чтобы немедленно завершить процесс.

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

- `[in] location`: Дополнительное местоположение, в котором произошла ошибка.
- `[in] location_len`: Длина местоположения в байтах или `NAPI_AUTO_LENGTH`, если она равна NULL.
- `[in] message`: Сообщение, связанное с ошибкой.
- `[in] message_len`: Длина сообщения в байтах или `NAPI_AUTO_LENGTH`, если она равна NULL.

Вызов функции не возвращается, процесс будет прекращен.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

## Управление жизненным циклом объекта

Когда выполняются вызовы N-API, обработчики объектов в массе для базовой виртуальной машины могут возвращаться как `napi_values`. Эти обработчики должны удерживать объекты «живыми», пока они больше не требуются нативным кодом, иначе объекты могут быть собраны до того, как нативный код завершит их использование.

Когда возвращаются обработчики объектов, они связаны с «областью видимости». Срок службы для области видимости по умолчанию привязан к сроку службы вызова нативного метода. В результате обработчики по умолчанию остаются действительными, и объекты, связанные с этими обработчиками, будут поддерживаться в течение срока службы вызова нативного метода.

Однако во многих случаях необходимо, чтобы обработчики оставались действительными в течение более короткого или более длительного срока службы, чем у нативного метода. В следующих разделах описываются функции N-API, которые можно использовать для изменения срока службы обработчика по умолчанию.

### Сделать срок службы обработчика короче, чем у нативного метода
Часто необходимо сделать срок службы обработчиков короче, чем срок службы нативного метода. Например, рассмотрим нативный метод, который имеет цикл, повторяющийся сквозь элементы в большом массиве:

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

Это привело бы к созданию большого количества обработчиков, потребляющих значительные ресурсы. Кроме того, даже несмотря на то, что нативный код может использовать только самый последний обработчик, все связанные объекты также будут поддерживаться, поскольку все они имеют одну область видимости.

Чтобы справиться с этим случаем, N-API предоставляет возможность установить новую «область видимости», с которой будут связаны вновь созданные обработчики. Как только эти обработчики больше не требуются, область видимости может быть «закрыта» и любые обработчики, связанные с этой областью видимости, становятся недействительными. Методы, доступные для открытия/закрытия областей видимости: [`napi_open_handle_scope`][] и [`napi_close_handle_scope`][].

N-API поддерживает только одну вложенную иерархию областей видимости. В любой момент времени может существовать только одна область видимости, и все обработчики будут связаны с этой областью, пока она активна. Области видимости должны закрываться в обратном порядке - от последней открытой до самой первой. Кроме того, все области видимости, созданные в пределах нативного метода, должны быть закрыты перед возвратом из этого метода.

Если взять за основу предыдущий пример, то добавление вызовов в [`napi_open_handle_scope`][] и [`napi_close_handle_scope`][] гарантирует, что на протяжении всего цикла выполнения будет действителен лишь один обработчик:

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

При вложении областей видимости имеются случаи, когда обработчик из внутренней области видимости должен жить дольше срока службы этой области видимости. Для помощи в таком случае N-API поддерживает «экранируемую область». Экранируемая область видимости позволяет «продвигать» один обработчик, чтобы он «экранировал» текущую область видимости, и срок службы обработчика изменяется с текущей области на срок службы внешней области видимости.

Методы, доступные для открытия/закрытия экранируемых областей видимости: [`napi_open_escapable_handle_scope`][] и [`napi_close_escapable_handle_scope`][].

Запрос на продвижение обработчика выполняется через [`napi_escape_handle`][], который можно вызвать только один раз.

#### napi_open_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
NODE_EXTERN napi_status napi_open_handle_scope(napi_env env,
                                               napi_handle_scope* result);
```
- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: `napi_value`, представляющее новую область видимости.

При успешном выполнении API возвращает `napi_ok`.

Этот API открывает новую область видимости.

#### napi_close_handle_scope
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
NODE_EXTERN napi_status napi_close_handle_scope(napi_env env,
                                                napi_handle_scope scope);
```
- `[in] env`: Среда, в которой вызывается API.
- `[in] scope`: `napi_value`, представляющее область видимости, которую нужно закрыть.

При успешном выполнении API возвращает `napi_ok`.

Этот API закрывает пройденную область видимости. Области видимости должны закрываться в обратном порядке - от последнего созданного до самого первого.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

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
- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: `napi_value`, представляющее новую область видимости.

При успешном выполнении API возвращает `napi_ok`.

Этот API открывает новую область видимости, из которой один объект может быть переведен во внешнюю область видимости.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] scope`: `napi_value`, представляющее область видимости, которую нужно закрыть.

При успешном выполнении API возвращает `napi_ok`.

Этот API закрывает пройденную область видимости. Области видимости должны закрываться в обратном порядке - от последнего созданного до самого первого.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] scope`: `napi_value`, представляющее текущую область видимости.
- `[in] escapee`: `napi_value`, представляющее объект JavaScript для экранирования.
- `[out] result`: `napi_value`, представляющее обработчик экранированного объекта во внешней области видимости.

При успешном выполнении API возвращает `napi_ok`.

Этот API продвигает обработчик объекта JavaScript, чтобы он действовал в течение всего времени жизни внешней области видимости. Его можно вызвать только раз для каждой области видимости. Если он будет вызван более одного раза, то вернется ошибка.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

### Ссылки на объекты с продолжительностью жизни дольше, чем у нативного метода

В некоторых случаях дополнение должно иметь возможность создавать и ссылаться на объекты со сроком службы, превышающим продолжительность одного вызова нативного метода. Например, чтобы создать конструктор и затем использовать его в запросе для создания экземпляров, должна быть возможность ссылаться на объект конструктора через множество различных запросов на создание экземпляров. Это было бы невозможно с обычным обработчиком, который возвращается как `napi_value`, как описано в предыдущем разделе. Срок службы обычного обработчика управляется областями видимости, и все области видимости должны быть закрыты до конца нативного метода.

N-API предоставляет методы для создания постоянных ссылок на объект. Каждая постоянная ссылка имеет счетчик, связанный со значением 0 или выше. Этот счетчик определяет, будет ли ссылка поддерживать соответствующий объект активным. Ссылки с числом 0 не препятствуют сбору объекта и часто называются "слабыми" ссылками. Любое число больше 0 не позволит собрать объект.

Ссылки могут быть созданы с начальным количеством ссылок. Затем количество может быть изменено с помощью [`napi_reference_ref`][] и [`napi_reference_unref`][]. Если объект собирается, пока счетчик для ссылки равен 0, все последующие вызовы для получения объекта, связанного со ссылкой [`napi_get_reference_value`][], вернут NULL для возвращенного `napi_value`. Попытка вызвать [`napi_reference_ref`][] для ссылки, объект которой был собран, приведет к ошибке.

Как только ссылки больше не требуются дополнению, они должны быть удалены. Когда ссылка удаляется, она больше не препятствует сбору соответствующего объекта. Если постоянная ссылка не удаляется, произойдет «утечка памяти», при этом как нативная память для постоянной ссылки, так и соответствующий объект в куче будут сохранены навсегда.

Может быть создано несколько постоянных ссылок, ссылающихся на один и тот же объект, каждая из которых будет поддерживать объект в рабочем состоянии или не зависеть от его индивидуального количества.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее объект, на который мы хотим сослаться.
- `[in] initial_refcount`: Начальный счетчик ссылок для новой ссылки.
- `[out] result`: `napi_ref`, указывающий на новую ссылку.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает новую ссылку с заданным количеством ссылок на переданный объект.

#### napi_delete_reference
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
NODE_EXTERN napi_status napi_delete_reference(napi_env env, napi_ref ref);
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] ref`: `napi_ref` для удаления.

При успешном выполнении API возвращает `napi_ok`.

Этот API удаляет переданную ссылку.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] ref`: `napi_ref`, для которого счетчик ссылок будет увеличен.
- `[out] result`: Новый счетчик ссылок.

При успешном выполнении API возвращает `napi_ok`.

Этот API увеличивает счетчик ссылок для переданной ссылки и возвращает полученный счетчик ссылок.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] ref`: `napi_ref`, для которого счетчик ссылок будет уменьшен.
- `[out] result`: Новый счетчик ссылок.

При успешном выполнении API возвращает `napi_ok`.

Этот API уменьшает счетчик ссылок для переданной ссылки и возвращает полученный счетчик ссылок.

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

`napi_value, переданное` в или из этих методов, является обработчиком объекта, с которым связана ссылка.
- `[in] env`: Среда, в которой вызывается API.
- `[in] ref`: `napi_ref`, для которого мы запрашиваем соответствующий объект.
- `[out] result`: `napi_value` для объекта, на который ссылается `napi_ref`.

При успешном выполнении API возвращает `napi_ok`.

Если это все еще актуально, этот API возвращает `napi_value`, представляющий объект JavaScript, связанный с `napi_ref`. В противном случае результат будет NULL.

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

## Регистрация модуля
Модули N-API регистрируются аналогично другим модулям, за исключением того, что вместо макроса `NODE_MODULE` используется следующее:

```C
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

Следующим отличием является сигнатура для метода `Init`. Для модуля N-API это:

```C
napi_value Init(napi_env env, napi_value exports);
```

Возвращаемое значение из `Init` обрабатывается как объект `exports` для модуля. Метод `Init` передает пустой объект через параметр `exports` в качестве преимущества. Если `Init` возвращает NULL, параметр, переданный как `exports`, экспортируется модулем. Модули N-API не могут изменять объект `module`, но могут указывать что-либо как свойство `exports` модуля.

Например, чтобы добавить метод `hello` в качестве функции, чтобы его можно было вызывать как метод, предоставляемый дополнением:

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

Например, для установки функции, которая должна быть возвращена с помощью `require()` для дополнения:

```C
napi_value Init(napi_env env, napi_value exports) {
  napi_value method;
  napi_status status;
  status = napi_create_function(env, "exports", NAPI_AUTO_LENGTH, Method, NULL, &method);
  if (status != napi_ok) return NULL;
  return method;
}
```

Например, чтобы определить класс для создания новых экземпляров (часто используется с [Object Wrap](#n_api_object_wrap)):

```C
// ПРИМЕЧАНИЕ: частичный пример, содержит не весь код ссылки
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

Смотрите раздел [Работа со свойствами JavaScript](#n_api_working_with_javascript_properties) для более подробной информации о настройке свойств объектов.

Более подробную информацию о сборке дополнительных модулей в целом смотрите в существующем API

## Работа со значениями JavaScript
N-API предоставляет набор API для создания всех типов значений JavaScript. Некоторые из этих типов описаны в [Разделе 6](https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values) [Спецификации языка ECMAScript](https://tc39.github.io/ecma262/).

По сути, эти API используются для выполнения одного из следующих действий:
1. Создать новый объект JavaScript
2. Преобразовать из примитивного типа C в значение N-API
3. Преобразовать из значения N-API в примитивный тип C
4. Получить глобальные экземпляры, включая `undefined` и `null`

Значения N-API представлены типом `napi_value`. Любой вызов N-API, который требует значения JavaScript, принимает `napi_value`. В некоторых случаях API действительно проверяет тип `napi_value` заранее. Однако для повышения производительности вызывающей стороне лучше убедиться, что рассматриваемое `napi_value` является типом JavaScript, которого ожидает API.

### Типы Enum
#### napi_valuetype
```C
typedef enum {
  // типы ES6 (соответствует typeof)
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

Описывает типы `napi_value`. Это в целом соответствует типам, описанным в [Разделе 6.1](https://tc39.github.io/ecma262/#sec-ecmascript-language-types) Спецификации языка ECMAScript. В дополнение к типам в этом разделе `napi_valuetype` может также представлять Функции и Объекты с внешними данными.

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

Это представляет базовый двоичный скалярный тип данных TypedArray. Элементы этого enum соответствуют [Разделу 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) [Спецификации языка ECMAScript](https://tc39.github.io/ecma262/).

### Функции создания объекта
#### napi_create_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_create_array(napi_env env, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается N-API.
- `[out] result`: `napi_value`, представляющее массив JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает значение N-API, соответствующее типу массива JavaScript. Массивы JavaScript описаны в [Разделе 22.1](https://tc39.github.io/ecma262/#sec-array-objects) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] length`: Начальная длина массива.
- `[out] result`: `napi_value`, представляющее массив JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает значение N-API, соответствующее типу массива JavaScript. Свойство длины массива устанавливается в переданный параметр длины. Однако не гарантируется, что базовый буфер будет предварительно выделен виртуальной машиной при создании массива - такое поведение остается за базовой реализацией виртуальной машины. Если буфер должен быть непрерывным блоком памяти, который может быть непосредственно считан и/или записан через C, рассмотрите возможность использования [`napi_create_external_arraybuffer`][].

Массивы JavaScript описаны в [Разделе 22.1](https://tc39.github.io/ecma262/#sec-array-objects) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] length`: Длина массива буфера для создания в байтах.
- `[out] data`: Указатель на базовый байтовый буфер ArrayBuffer.
- `[out] result`: `napi_value`, представляющее ArrayBuffer JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает значение N-API, соответствующее ArrayBuffer JavaScript. ArrayBuffers используются для представления буферов двоичных данных фиксированной длины. Обычно они используются в качестве резервного буфера для объектов TypedArray. Выделенный ArrayBuffer будет иметь базовый байтовый буфер, размер которого определяется передаваемым параметром `length`. Базовый буфер опционально возвращается обратно вызывающей стороне, если вызывающая сторона хочет напрямую манипулировать буфером. Этот буфер может быть записан только непосредственно из нативного кода. Для записи в этот буфер из JavaScript необходимо создать типизированный массив или объект DataView.

Объекты ArrayBuffer JavaScript описываются в [Разделе 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] size`: Размер базового буфера в байтах.
- `[out] data`: Необработанный указатель на базовый буфер.
- `[out] result`: `napi_value`, представляющее `node::Buffer`.

При успешном выполнении API возвращает `napi_ok`.

Этот API назначает объект `node::Buffer`. Хотя это все еще полностью поддерживаемая структура данных, в большинстве случаев будет достаточно использовать TypedArray.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] size`: Размер входного буфера в байтах (должен совпадать с размером нового буфера).
- `[in] data`: Необработанный указатель на базовый буфер для копирования.
- `[out] result_data`: Указатель на базовый буфер данных нового буфера.
- `[out] result`: `napi_value`, представляющее `node::Buffer`.

При успешном выполнении API возвращает `napi_ok`.

Этот API назначает объект `node::Buffer` и инициализирует его данными, скопированными из переданного буфера. Хотя это все еще полностью поддерживаемая структура данных, в большинстве случаев будет достаточно использовать TypedArray.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] data`: Необработанный указатель на внешние данные.
- `[in] finalize_cb`: Опциональный обратный вызов для вызова при сборе внешнего значения.
- `[in] finalize_hint`: Опциональный совет, чтобы перейти к обратному вызову завершения во время сбора.
- `[out] result`: `napi_value`, представляющее внешнее значение.

При успешном выполнении API возвращает `napi_ok`.

Этот API распределяет значение JavaScript с прикрепленными внешними данными. Используется для передачи внешних данных через код JavaScript, чтобы впоследствии их можно было получить с помощью нативного кода. API позволяет вызывающей стороне передавать обратный вызов завершения в случае, если базовый нативный ресурс необходимо очистить при сборе внешнего значения JavaScript.

*Примечание*: Созданное значение не является объектом и поэтому не поддерживает дополнительные свойства. Это считается типом другого значения: вызов `napi_typeof()` с внешним значением выдает `napi_external`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] external_data`: Указатель на базовый байтовый буфер ArrayBuffer.
- `[in] byte_length`: Длина базового буфера в байтах.
- `[in] finalize_cb`: Опциональный обратный вызов для вызова, когда происходит сбор ArrayBuffer.
- `[in] finalize_hint`: Опциональный совет, чтобы перейти к обратному вызову завершения во время сбора.
- `[out] result`: `napi_value`, представляющее ArrayBuffer JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает значение N-API, соответствующее ArrayBuffer JavaScript. Базовый байтовый буфер ArrayBuffer назначается и управляется извне. Вызывающая сторона должна убедиться, что байтовый буфер остается действительным до вызова обратного вызова завершения.

ArrayBuffer JavaScript описаны в [Разделе 24.1](https://tc39.github.io/ecma262/#sec-arraybuffer-objects) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] length`: Размер входного буфера в байтах (должен совпадать с размером нового буфера).
- `[in] data`: Необработанный указатель на базовый буфер для копирования.
- `[in] finalize_cb`: Опциональный обратный вызов для вызова, когда происходит сбор ArrayBuffer.
- `[in] finalize_hint`: Опциональный совет, чтобы перейти к обратному вызову завершения во время сбора.
- `[out] result`: `napi_value`, представляющее `node::Buffer`.

При успешном выполнении API возвращает `napi_ok`.

Этот API назначает объект `node::Buffer` и инициализирует его данными, подкрепленными переданным буфером. Хотя это все еще полностью поддерживаемая структура данных, в большинстве случаев будет достаточно использовать TypedArray.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] utf8name`: Строка, представляющая имя функции в кодировке UTF8.
- `[in] length`: Длина utf8name в байтах или `NAPI_AUTO_LENGTH`, если она заканчивается нулем.
- `[in] cb`: Указатель функции на нативную функцию для вызова, когда вызывается созданная функция из JavaScript.
- `[in] data`: Опциональные данные произвольного контекста для передачи нативной функции при вызове.
- `[out] result`: `napi_value`, представляющее функцию JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает значение N-API, соответствующее объекту функции JavaScript. Он используется для обертывания нативных функций, чтобы их можно было вызывать из JavaScript.

Функции JavaScript описываются в [Разделе 19.2](https://tc39.github.io/ecma262/#sec-function-objects) Спецификации языка ECMAScript.

#### napi_create_object
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_create_object(napi_env env, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: `napi_value`, представляющее объект JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API назначает объект JavaScript по умолчанию. Это эквивалентно выполнению `new Object()` в JavaScript.

Тип объекта JavaScript описан в [Разделе 6.1.7](https://tc39.github.io/ecma262/#sec-object-type) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] description`: Опциональное napi_value, которое ссылается на строку JavaScript для установки в качестве описания для символа.
- `[out] result`: `napi_value`, представляющее символ JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает объект символа JavaScript из UTF8-кодированной строки С

Тип символа JavaScript описывается в [Разделе 19.4](https://tc39.github.io/ecma262/#sec-symbol-objects) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] type`: Скалярный тип данных элементов в TypedArray.
- `[in] length`: Количество элементов в TypedArray.
- `[in] arraybuffer`: ArrayBuffer, лежащий в основе типизированного массива.
- `[in] byte_offset`: Смещение байта в ArrayBuffer, из которого начинается проецирование TypedArray.
- `[out] result`: `napi_value`, представляющее TypedArray JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает объект TypedArray JavaScript поверх существующего ArrayBuffer. Объекты TypedArray обеспечивают представление типа массива базового буфера данных, где каждый элемент имеет одинаковый базовый двоичный скалярный тип данных.

It's required that (length * size_of_element) + byte_offset should be <= the size in bytes of the array passed in. If not, a RangeError exception is raised.

Объекты TypedArray JavaScript описаны в [Разделе 22.2](https://tc39.github.io/ecma262/#sec-typedarray-objects) Спецификации языка ECMAScript.


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

- `[in] env`: Среда, в которой вызывается API.
- `[in] length`: Количество элементов в DataView.
- `[in] arraybuffer`: ArrayBuffer, лежащий в основе DataView.
- `[in] byte_offset`: Смещение байта в ArrayBuffer, из которого начинается проецирование DataView.
- `[out] result`: `napi_value`, представляющее DataView JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает объект DataView JavaScript поверх существующего ArrayBuffer. Объекты DataView обеспечивают представление типа массива поверх базового буфера данных, но допускает элементы различного размера и типа в ArrayBuffer.

Необходимо, чтобы `byte_length + byte_offset` был меньше или равен размеру переданного массива в байтах. Если нет, то возникает исключение RangeError.

DataView JavaScript описываются в [Разделе 24.3](https://tc39.github.io/ecma262/#sec-dataview-objects) Спецификации языка ECMAScript.

### Функции для преобразования из типов С в N-API
#### napi_create_int32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_int32(napi_env env, int32_t value, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Целочисленное значение для представления в JavaScript.
- `[out] result`: `napi_value`, представляющее число JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется для преобразования из типа C `int32_t` в числовой тип JavaScript.

Числовой тип JavaScript описывается в [Разделе 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) Спецификации языка ECMAScript.

#### napi_create_uint32
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_uint32(napi_env env, uint32_t value, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Целочисленное значение без знака для представления в JavaScript.
- `[out] result`: `napi_value`, представляющее число JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется для преобразования из типа С `uint32_t` в числовой тип JavaScript.

Числовой тип JavaScript описывается в [Разделе 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) Спецификации языка ECMAScript.

#### napi_create_int64
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_int64(napi_env env, int64_t value, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Целочисленное значение для представления в JavaScript.
- `[out] result`: `napi_value`, представляющее число JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется для преобразования типа С `int64_t` в числовой тип JavaScript.

Числовой тип JavaScript описывается в [Разделе 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) Спецификации языка ECMAScript. Обратите внимание, что полный диапазон `int64_t` не может быть представлен с абсолютной точностью в JavaScript. Целочисленные значения вне диапазона [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2 ^ 53 - 1) потеряют точность.

#### napi_create_double
<!-- YAML
added: v8.4.0
napiVersion: 1
-->
```C
napi_status napi_create_double(napi_env env, double value, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение двойной точности для представления в JavaScript.
- `[out] result`: `napi_value`, представляющее число JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется для преобразования типа С `double` в числовой тип JavaScript.

Числовой тип JavaScript описывается в [Разделе 6.1.6](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-number-type) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] str`: Символьный буфер, представляющий строку в кодировке ISO-8859-1.
- `[in] length`: Длина строки в байтах или `NAPI_AUTO_LENGTH`, если она заканчивается нулем.
- `[out] result`: `napi_value`, представляющее строку JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает строковый объект JavaScript из строки C в кодировке ISO-8859-1.

Строковый тип JavaScript описывается в [Разделе 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] str`: Символьный буфер, представляющий строку в кодировке UTF16-LE.
- `[in] length`: Длина строки в двухбайтовых единицах кода или `NAPI_AUTO_LENGTH`, если она заканчивается нулем.
- `[out] result`: `napi_value`, представляющее строку JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает строковый объект JavaScript из строки С в кодировке UTF16-LE

Строковый тип JavaScript описывается в [Разделе 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] str`: Символьный буфер, представляющий строку в кодировке UTF8.
- `[in] length`: Длина строки в байтах или `NAPI_AUTO_LENGTH`, если она заканчивается нулем.
- `[out] result`: `napi_value`, представляющее строку JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API создает строковый объект JavaScript из строки С в кодировке UTF8

Строковый тип JavaScript описывается в [Разделе 6.1.4](https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type) Спецификации языка ECMAScript.

### Функции для преобразования из N-API в типы С
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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее массив JavaScript, длина которого запрашивается.
- `[out] result`: `uint32`, представляющий длину массива.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает длину массива.

Длина массива описывается в [Разделе 22.1.4.1](https://tc39.github.io/ecma262/#sec-properties-of-array-instances-length) Спецификации языка ECMAScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] arraybuffer`: `napi_value`, представляющее запрашиваемый ArrayBuffer.
- `[out] data`: Базовый буфер данных ArrayBuffer.
- `[out] byte_length`: Длина базового буфера данных в байтах.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется для извлечения базового буфера данных ArrayBuffer и его длины.

*ВНИМАНИЕ*: Будьте осторожны при использовании этого API. Время жизни базового буфера данных управляется с помощью ArrayBuffer даже после его возврата. Возможный безопасный способ использования этого API связан с [`napi_create_reference`][], который может использоваться для обеспечения контроля над временем жизни ArrayBuffer. Также безопасно использовать возвращенный буфер данных в одном и том же обратном вызове, пока нет вызовов других API, которые могут вызвать сборщик мусора.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее запрашиваемый `node::Buffer`.
- `[out] data`: Базовый буфер данных `node::Buffer`.
- `[out] length`: Длина базового буфера данных в байтах.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется для извлечения основного буфера данных `node::Buffer` и его длины.

*Предупреждение*: Соблюдайте осторожность при использовании этого API, поскольку время жизни базового буфера данных не гарантируется, если он управляется виртуальной машиной.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] object`: `napi_value`, представляющее объект JavaScript, прототип которого нужно вернуть. Это возвращает эквивалент `Object.getPrototypeOf` (который не совпадает со свойством функции `prototype`).
- `[out] result`: `napi_value`, представляющее прототип данного объекта.

При успешном выполнении API возвращает `napi_ok`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] typedarray`: `napi_value`, представляющее TypedArray, чьи свойства подлежат запросу.
- `[out] type`: Скалярный тип данных элементов в TypedArray.
- `[out] length`: Количество элементов в TypedArray.
- `[out] data`: Буфер данных, лежащий в основе типизированного массива.
- `[out] byte_offset`: Смещение байта в пределах буфера данных, из которого начинается проецирование TypedArray.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает различные свойства типизированного массива.

*Предупреждение*: Соблюдайте осторожность при использовании этого API, поскольку базовый буфер данных управляется виртуальной машиной

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] dataview`: `napi_value`, представляющее DataView, чьи свойства подлежат запросу.
- `[out] byte_length`: Количество байтов в DataView.
- `[out] data`: Буфер данных, лежащий в основе DataView.
- `[out] arraybuffer`: ArrayBuffer, лежащий в основе DataView.
- `[out] byte_offset`: Смещение байта в пределах буфера данных, из которого начинается проецирование DataView.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает различные свойства DataView.

#### napi_get_value_bool
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_value_bool(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее логическое значение JavaScript.
- `[out] result`: Логический примитивный С эквивалент заданного логического значения JavaScript.

При успешном выполнении API возвращает `napi_ok`. Если передается `napi_value`, который не является логическим, он возвращает `napi_boolean_expected`.

Этот API возвращает логический примитивный С эквивалент заданного логического значения JavaScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее число JavaScript.
- `[out] result`: Двойной примитивный С эквивалент заданного числа JavaScript.

При успешном выполнении API возвращает `napi_ok`. Если передается нечисловой `napi_value`, он возвращает `napi_number_expected`.

Этот API возвращает двойной примитивный С эквивалент заданного числа JavaScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее внешнее значение JavaScript.
- `[out] result`: Указатель на данные, обернутые внешним значением JavaScript.

При успешном выполнении API возвращает `napi_ok`. Если передается значение `napi_value`, которое не является внешним, оно возвращает `napi_invalid_arg`.

Этот API извлекает указатель на внешние данные, который ранее был передан в `napi_create_external()`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее число JavaScript.
- `[out] result`: Примитивный int32 С эквивалент заданному числу JavaScript.

При успешном выполнении API возвращает `napi_ok`. Если передается нечисловой `napi_value` в `napi_number_expected`.

Этот API возвращает примитивный int32 С эквивалент заданному числу JavaScript.

Если число превышает диапазон 32-разрядного целого числа, то результат усекается до эквивалента младших 32 бит. This can result in a large positive number becoming a negative number if the value is > 2^31 -1.

Бесконечные числовые значения (NaN, положительная бесконечность, отрицательная бесконечность) устанавливают результат на ноль.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее число JavaScript.
- `[out] result`: Примитивный int64 С эквивалент заданному JavaScript.

При успешном выполнении API возвращает `napi_ok`. Если передается нечисловой `napi_value`, он возвращает `napi_number_expected`.

Этот API возвращает примитивный int64 С эквивалент заданному числу JavaScript.

Числовые значения вне диапазона [`Number.MIN_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.min_safe_integer) -(2^53 - 1) - [`Number.MAX_SAFE_INTEGER`](https://tc39.github.io/ecma262/#sec-number.max_safe_integer) (2^53 - 1) потеряют точность.

Бесконечные числовые значения (NaN, положительная бесконечность, отрицательная бесконечность) устанавливают результат на ноль.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее строку JavaScript.
- `[in] buf`: Буфер, в который нужно записать строку в кодировке ISO-8859-1. Если передается NULL, возвращается длина строки (в байтах).
- `[in] bufsize`: Размер буфера назначения. Если этого значения недостаточно, возвращаемая строка будет усечена.
- `[out] result`: Количество байтов, скопированных в буфер, исключая нуль-терминатор.

При успешном выполнении API возвращает `napi_ok`. Если передается нестроковый `napi_value`, он возвращает `napi_string_expected`.

Этот API возвращает ISO-8859-1-кодированную строку, соответствующую переданному значению.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее строку JavaScript.
- `[in] buf`: Буфер, в который нужно записать строку в кодировке UTF8. Если передается NULL, возвращается длина строки (в байтах).
- `[in] bufsize`: Размер буфера назначения. Если этого значения недостаточно, возвращаемая строка будет усечена.
- `[out] result`: Количество байтов, скопированных в буфер, исключая нуль-терминатор.

При успешном выполнении API возвращает `napi_ok`. Если передается нестроковый `napi_value`, он возвращает `napi_string_expected`.

Этот API возвращает UTF8-кодированную строку, соответствующую переданному значению.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее строку JavaScript.
- `[in] buf`: Буфер, в который нужно записать строку в кодировке UTF16-LE. Если передается NULL, возвращается длина строки (в 2-байтовых единицах кода).
- `[in] bufsize`: Размер буфера назначения. Если этого значения недостаточно, возвращаемая строка будет усечена.
- `[out] result`: Количество 2-байтовых кодовых единиц, скопированных в буфер, исключая нуль-терминатор.

При успешном выполнении API возвращает `napi_ok`. Если передается нестроковый `napi_value`, он возвращает `napi_string_expected`.

Этот API возвращает UTF16-кодированную строку, соответствующую переданному значению.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: `napi_value`, представляющее число JavaScript.
- `[out] result`: Примитивный С эквивалент заданному `napi_value` как `uint32_t`.

При успешном выполнении API возвращает `napi_ok`. Если передается нечисловой `napi_value`, он возвращает `napi_number_expected`.

Этот API возвращает примитивный С эквивалент заданному `napi_value` как `uint32_t`.

### Функции для получения глобальных экземпляров
#### napi_get_boolean
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_boolean(napi_env env, bool value, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение логического значения для извлечения.
- `[out] result`: `napi_value`, представляющее одноэлементное логическое значение JavaScript для извлечения.

При успешном выполнении API возвращает `napi_ok`.

Этот API используется, чтобы возвращать одноэлементный объект JavaScript для предоставления заданного логического значения

#### napi_get_global
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_global(napi_env env, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: `napi_value`, представляющее глобальный объект JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает глобальный объект.

#### napi_get_null
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_null(napi_env env, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: `napi_value`, представляющее нулевой объект JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает нулевой объект.

#### napi_get_undefined
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_get_undefined(napi_env env, napi_value* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: `napi_value`, представляющее неопределенное значение JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает неопределенный объект.

## Работа со значениями JavaScript - Абстрактные операции

N-API предоставляет набор API для выполнения некоторых абстрактных операций над значениями JavaScript. Некоторые эти операции записаны в [Разделе 7](https://tc39.github.io/ecma262/#sec-abstract-operations) [Спецификации языка ECMAScript](https://tc39.github.io/ecma262/).

Эти API поддерживают выполнение одного из следующего:
1. Привести значения JavaScript к определенным типам JavaScript (таким как Число или Строка)
2. Проверить тип значения JavaScript
3. Проверить равенство между двумя значениями JavaScript

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для принудительного использования.
- `[out] result`: `napi_value`, представляющее принудительное логическое значение JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API реализует абстрактную операцию ToBoolean, как обозначено в [Разделе 7.1.2](https://tc39.github.io/ecma262/#sec-toboolean) Спецификации языка ECMAScript. Этот API может быть повторно подключен, если в переданном объекте определены получатели.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для принудительного использования.
- `[out] result`: `napi_value`, представляющее принудительное число JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API реализует абстрактную операцию ToNumber, как обозначено в [Разделе 7.1.3](https://tc39.github.io/ecma262/#sec-tonumber) Спецификации языка ECMAScript. Этот API может быть повторно подключен, если в переданном объекте определены получатели.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для принудительного использования.
- `[out] result`: `napi_value`, представляющее принудительный объект JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API реализует абстрактную операцию ToObject, как обозначено в [Разделе 7.1.13](https://tc39.github.io/ecma262/#sec-toobject) Спецификации языка ECMAScript. Этот API может быть повторно подключен, если в переданном объекте определены получатели.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для принудительного использования.
- `[out] result`: `napi_value`, представляющее принудительную строку JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот API реализует абстрактную операцию ToString, как обозначено в [Разделе 7.1.13](https://tc39.github.io/ecma262/#sec-tostring) Спецификации языка ECMAScript. Этот API может быть повторно подключен, если в переданном объекте определены получатели.

### napi_typeof
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_typeof(napi_env env, napi_value value, napi_valuetype* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript, чей тип подлежит запросу.
- `[out] result`: Тип значения JavaScript.

При успешном выполнении API возвращает `napi_ok`.
- `napi_invalid_arg`, если тип `value` не является известным типом ECMAScript, а `value` не является внешним значением.

Этот API представляет поведение, которое похоже на вызов оператора `typeof` для объекта, как обозначено в [Разделе 12.5.5](https://tc39.github.io/ecma262/#sec-typeof-operator) спецификации языка ECMAScript. Однако он поддерживает обнаружение внешнего значения. Если `value` имеет недопустимый тип, возвращается ошибка.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] object`: Значение JavaScript для проверки.
- `[in] constructor`: Функциональный объект JavaScript функции конструктора, с которым необходимо провести проверку.
- `[out] result`: Логическое значение, которое установлено на true, если `объект конструктора instanceof` является true.

При успешном выполнении API возвращает `napi_ok`.

Этот API представляет вызов оператора `instanceof` на объекте, как обозначено в [Разделе 12.10.4](https://tc39.github.io/ecma262/#sec-instanceofoperator) Спецификации языка ECMAScript.

### napi_is_array
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_array(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для проверки.
- `[out] result`: Если данный объект является массивом.

При успешном выполнении API возвращает `napi_ok`.

Этот API представляет вызов оператора `IsArray` на объекте, как обозначено в [Разделе 7.2.2](https://tc39.github.io/ecma262/#sec-isarray) Спецификации языка ECMAScript.

### napi_is_arraybuffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_arraybuffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для проверки.
- `[out] result`: Если данный объект является ArrayBuffer.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет, является ли переданный объект буфером массива.

### napi_is_buffer
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_buffer(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для проверки.
- `[out] result`: Если данный `napi_value` представляет собой объект `node::Buffer`.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет, является ли переданный объект буфером.

### napi_is_error
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_error(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для проверки.
- `[out] result`: Если данный `napi_value` представляет собой объект ошибки.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет, является ли переданный объект ошибкой.

### napi_is_typedarray
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_is_typedarray(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для проверки.
- `[out] result`: Если данный `napi_value` представляет собой TypedArray.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет является ли переданный объект типизированным массивом.

### napi_is_dataview
<!-- YAML
added: v8.3.0
napiVersion: 1
-->

```C
napi_status napi_is_dataview(napi_env env, napi_value value, bool* result)
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] value`: Значение JavaScript для проверки.
- `[out] result`: Если данный `napi_value` представляет собой DataView.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет, является ли переданный объект DataView.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] lhs`: Значение JavaScript для проверки.
- `[in] rhs`: Значение JavaScript, с которым необходимо провести проверку.
- `[out] result`: Если два объекта `napi_value` равны.

При успешном выполнении API возвращает `napi_ok`.

Этот API представляет собой вызов алгоритма строгого равенства, как обозначено в [Разделе 7.2.14](https://tc39.github.io/ecma262/#sec-strict-equality-comparison) Спецификации языка ECMAScript.

## Работа со свойствами JavaScript

N-API предоставляет набор API для получения и установки свойств объектов JavaScript. Некоторые из этих типов описаны в [Разделе 7](https://tc39.github.io/ecma262/#sec-operations-on-objects) [Спецификации языка ECMAScript](https://tc39.github.io/ecma262/).

Свойства в JavaScript представлены в виде кортежа ключа и значения. В основном все ключи свойств в N-API могут быть представлены в одной из следующих форм:
- По названию: простая строка в кодировке UTF8
- По целочисленному индексу: индексное значение, представленное `uint32_t`
- По значению JavaScript: они представлены в N-API с помощью `napi_value`. This can be a `napi_value` representing a String, Number, or Symbol.

Значения N-API представлены типом `napi_value`. Любой вызов N-API, который требует значения JavaScript, принимает `napi_value`. Однако вызывающая сторона обязана убедиться, что рассматриваемое `napi_value` является типом JavaScript, которого ожидает API.

API, описанные в этом разделе, обеспечивают простой интерфейс для получения и установки свойств на произвольные объекты JavaScript, которые предоставляются с помощью `napi_value`.

Например, рассмотрим следующий фрагмент кода JavaScript:
```js
const obj = {};
obj.myProp = 123;
```
Эквивалент может быть выполнен с использованием значений N-API со следующим фрагментом:
```C
napi_status status = napi_generic_failure;

// const obj = {}
napi_value obj, value;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Создайте napi_value для 123
status = napi_create_int32(env, 123, &value);
if (status != napi_ok) return status;

// obj.myProp = 123
status = napi_set_named_property(env, obj, "myProp", value);
if (status != napi_ok) return status;
```

Индексированные свойства могут быть установлены аналогичным образом. Рассмотрим следующий фрагмент JavaScript:
```js
const arr = [];
arr[123] = 'hello';
```
Эквивалент может быть выполнен с использованием значений N-API со следующим фрагментом:
```C
napi_status status = napi_generic_failure;

// const arr = [];
napi_value arr, value;
status = napi_create_array(env, &arr);
if (status != napi_ok) return status;

// Создайте napi_value для 'hello'
status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &value);
if (status != napi_ok) return status;

// arr[123] = 'hello';
status = napi_set_element(env, arr, 123, value);
if (status != napi_ok) return status;
```

Свойства можно получить с помощью API, описанных в этом разделе. Рассмотрим следующий фрагмент JavaScript:
```js
const arr = [];
const value = arr[123];
```

Ниже приведен примерный эквивалент аналога N-API:
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

Наконец, для повышения производительности можно также определить несколько свойств объекта. Рассмотрим следующий код JavaScript:
```js
const obj = {};
Object.defineProperties(obj, {
  'foo': { value: 123, writable: true, configurable: true, enumerable: true },
  'bar': { value: 456, writable: true, configurable: true, enumerable: true }
});
```

Ниже приведен примерный эквивалент аналога N-API:
```C
napi_status status = napi_status_generic_failure;

// const obj = {};
napi_value obj;
status = napi_create_object(env, &obj);
if (status != napi_ok) return status;

// Создайте napi_values для 123 и 456
napi_value fooValue, barValue;
status = napi_create_int32(env, 123, &fooValue);
if (status != napi_ok) return status;
status = napi_create_int32(env, 456, &barValue);
if (status != napi_ok) return status;

// Установите свойства
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

### Структуры
#### napi_property_attributes
```C
typedef enum {
  napi_default = 0,
  napi_writable = 1 << 0,
  napi_enumerable = 1 << 1,
  napi_configurable = 1 << 2,

  // Используется с napi_define_class, чтобы отличать статические свойства
  // от свойств экземпляра. Игнорируется napi_define_properties.
  napi_static = 1 << 10,
} napi_property_attributes;
```

`napi_property_attributes` - это флаги, используемые для управления поведением свойств, установленных для объекта JavaScript. Помимо `napi_static` они соответствуют атрибутам, перечисленным в [Разделе 6.1.7.1](https://tc39.github.io/ecma262/#table-2) [Спецификации языка ECMAScript](https://tc39.github.io/ecma262/). Они могут быть одним или несколькими из следующих битовых флагов:

- `napi_default` - Используется для указания того, что для данного свойства не установлены явные атрибуты. По умолчанию свойство доступно только для чтения, не перечисляется и не настраивается.
- `napi_writable` - Used to indicate that a given property is writable.
- `napi_enumerable` - Используется для указания того, что данное свойство является перечислимым.
- `napi_configurable` - Используется для указания того, что данное свойство является настраиваемым, как обозначено в [Разделе 6.1.7.1](https://tc39.github.io/ecma262/#table-2) [Спецификации языка ECMAScript](https://tc39.github.io/ecma262/).
- `napi_static` - Используется для указания того, что свойство будет определено как статическое свойство класса, а не свойство экземпляра, которое используется по умолчанию. Это используется только [`napi_define_class`][]. Игнорируется `napi_define_properties`.

#### napi_property_descriptor
```C
typedef struct {
  // Одно из utf8name или имя должно быть NULL.
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

- `utf8name`: Опциональная строка, описывающая ключ для свойства в кодировке UTF8. Для свойства необходимо указать одно из `utf8name` или `name`.
- `name`: Опциональное napi_value, указывающее на строку или символ JavaScript, которые будут использоваться в качестве ключа для свойства. Для свойства необходимо указать одно из `utf8name` или `name`.
- `value`: Значение, полученное с помощью доступа get свойства, если свойство является свойством data. Если это передается, установите `getter`, `setter`, `method` и `data` на `NULL` (поскольку эти элементы не будут использоваться).
- `getter`: Функция для вызова, когда выполняется доступ get свойства. Если это передается, установите `value` и `method` на `NULL` (поскольку эти элементы не будут использоваться). Данная функция неявно вызывается средой выполнения, когда к свойству обращаются из кода JavaScript (или если доступ к свойству осуществляется с помощью вызова N-API).
- `setter`: Функция для вызова, когда выполняется доступ set свойства. Если это передается, установите `value` и `method` на `NULL` (поскольку эти элементы не будут использоваться). Данная функция неявно вызывается средой выполнения, когда свойство установлено из кода JavaScript (или если установка свойства выполняется с помощью вызова N-API).
- `method`: Установите это, чтобы свойство `value` объекта дескриптора свойства было функцией JavaScript, представленной с помощью `method`. Если это передается, установите `value`, `getter` и `setter` на `NULL` (поскольку эти элементы не будут использоваться).
- `attributes`: Атрибуты, связанные с конкретным свойством. See [`napi_property_attributes`](#n_api_napi_property_attributes).
- `data`: Данные обратного вызова передаются в `method`, `getter` и `setter`, если вызывается эта функция.

### Функции
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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, из которого нужно получить свойства.
- `[out] result`: `napi_value`, представляющее массив значений JavaScript, которые представляют имена свойств объекта. Этот API можно использовать для итерации по `result` с использованием [`napi_get_array_length`][] и [`napi_get_element`][].

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает массив свойств для передаваемого объекта

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, для которого устанавливается свойство.
- `[in] key`: Имя свойства для установки.
- `[in] value`: Значение свойства.

При успешном выполнении API возвращает `napi_ok`.

Этот API устанавливает свойство для переданного объекта.

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, из которого нужно извлечь свойство.
- `[in] key`: Имя свойства для извлечения.
- `[out] result`: Значение свойства.

При успешном выполнении API возвращает `napi_ok`.

Этот API получает запрошенное свойство из переданного объекта.


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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект для запроса.
- `[in] key`: Имя свойства, существование которого нужно проверить.
- `[out] result`: Существует ли свойство на объекте или нет.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет, имеет ли переданный объект именованное свойство.


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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект для запроса.
- `[in] key`: Имя свойства для удаления.
- `[out] result`: Произошло ли удаление свойства удачно или нет. `result` может быть опционально проигнорирован путем передачи `NULL`.

При успешном выполнении API возвращает `napi_ok`.

Этот API пытается удалить собственное свойство `key` из `object`.


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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект для запроса.
- `[in] key`: Имя собственного свойства, существование которого нужно проверить.
- `[out] result`: Существует ли собственное свойство на объекте или нет.

При успешном выполнении API возвращает `napi_ok`.

Этот API проверяет, имеет ли переданный объект именованное собственное свойство. `key` должен быть строкой или символом, иначе будет выдана ошибка. N-API не будет выполнять никакого преобразования между типами данных.


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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, для которого устанавливается свойство.
- `[in] utf8Name`: Имя свойства для установки.
- `[in] value`: Значение свойства.

При успешном выполнении API возвращает `napi_ok`.

Этот метод эквивалентен вызову [`napi_set_property`][] с `napi_value`, которое создается из строки, переданной как `utf8Name`

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, из которого нужно извлечь свойство.
- `[in] utf8Name`: Имя свойства, которое нужно получить.
- `[out] result`: Значение свойства.

При успешном выполнении API возвращает `napi_ok`.

Этот метод эквивалентен вызову [`napi_get_property`][] с `napi_value`, которое создается из строки, переданной как `utf8Name`

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект для запроса.
- `[in] utf8Name`: Имя свойства, существование которого нужно проверить.
- `[out] result`: Существует ли свойство на объекте или нет.

При успешном выполнении API возвращает `napi_ok`.

Этот метод эквивалентен вызову [`napi_has_property`][] с `napi_value`, которое создается из строки, переданной как `utf8Name`

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, из которого устанавливаются свойства.
- `[in] index`: Индекс свойства для установки.
- `[in] value`: Значение свойства.

При успешном выполнении API возвращает `napi_ok`.

Этот API устанавливает элемент на переданный объект.

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, из которого нужно извлечь свойство.
- `[in] index`: Индекс свойства для получения.
- `[out] result`: Значение свойства.

При успешном выполнении API возвращает `napi_ok`.

Этот API получает элемент в запрошенном индексе.

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект для запроса.
- `[in] index`: Индекс свойства, существование которого нужно проверить.
- `[out] result`: Существует ли свойство на объекте или нет.

При успешном выполнении API возвращает `napi_ok`.

Этот API возвращает, если переданный объект имеет элемент в запрошенном индексе.

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект для запроса.
- `[in] index`: Индекс свойства для удаления.
- `[out] result`: Удален ли элемент успешно или нет. `result` может быть опционально проигнорирован путем передачи `NULL`.

При успешном выполнении API возвращает `napi_ok`.

Этот API пытается удалить указанный `index` из `object`.

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

- `[in] env`: Среда, в которой вызывается N-API.
- `[in] object`: Объект, из которого нужно получить свойства.
- `[in] property_count`: Количество элементов в массиве `properties`.
- `[in] properties`: Массив дескрипторов свойств.

При успешном выполнении API возвращает `napi_ok`.

Этот метод позволяет эффективно определять несколько свойств данного объекта. Свойства определяются с помощью дескрипторов свойств (См. [`napi_property_descriptor`][]). Учитывая массив таких дескрипторов свойств, этот API будет устанавливать свойства на объект по одному, как обозначено DefineOwnProperty (описано в [Разделе 9.1.6](https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc) спецификации ECMA262).

## Работа с функциями JavaScript

N-API предоставляет набор API, которые позволяют коду JavaScript совершать обратный вызов в нативный код. API N-API, которые поддерживают обратный вызов в нативный код, принимают функции обратного вызова, представленные типом `napi_callback`. Когда виртуальная машина JavaScript выполняет обратный вызов нативного кода, вызывается заданная функция `napi_callback`. API, описанные в этом разделе, позволяют функции обратного вызова выполнять следующее:
- Получать информацию о контексте, в котором был вызван обратный вызов.
- Получать аргументы, переданные в обратный вызов.
- Возвращать `napi_value` из обратного вызова.

Кроме того, N-API предоставляет набор функций, которые позволяют вызывать функции JavaScript из нативного кода. Функция может быть вызвана как обычный вызов функции JavaScript или как функция конструктора.


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

- `[in] env`: Среда, в которой вызывается API.
- `[in] recv`: Объект `this`, переданный вызываемой функции.
- `[in] func`: `napi_value`, представляющее функцию JavaScript, которая должна быть вызвана.
- `[in] argc`: Количество элементов в массиве `argv`.
- `[in] argv`: Массив `napi_values`, представляющий значения JavaScript, переданные в качестве аргументов функции.
- `[out] result`: `napi_value`, представляющее возвращаемый объект JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот метод позволяет вызывать объект функции JavaScript из нативного дополнения. Это основной механизм обратного вызова *из* нативного кода дополнения *в* JavaScript. Для особого случая вызова в JavaScript после асинхронной операции см. [`napi_make_callback`][].

Пример использования может выглядеть следующим образом. Рассмотрим следующий фрагмент JavaScript:
```js
function AddTwo(num) {
  return num + 2;
}
```

Затем указанную выше функцию можно вызвать из нативного дополнения с помощью следующего кода:
```C
// Получить функцию под именем "AddTwo" для глобального объекта
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

// Преобразовать результат обратно в нативный тип
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

- `[in] env`: Среда, в которой вызывается API.
- `[in] utf8Name`: Имя функции в кодировке UTF8. Это видно в JavaScript как свойство `name` нового объекта функции.
- `[in] cb`: Нативная функция, которая должна вызываться при вызове этого объекта функции.
- `[in] data`: Пользовательский контекст данных. Это будет передано обратно в функцию при последующем вызове.
- `[out] result`: `napi_value`, представляющее объект функции JavaScript для вновь созданной функции.

При успешном выполнении API возвращает `napi_ok`.

Этот API позволяет автору дополнения создавать объект функции в нативном коде. This is the primary mechanism to allow calling *into* the add-on's native code *from* JavaScript.

*Note*: The newly created function is not automatically visible from script after this call. Вместо этого свойство должно быть явно установлено для любого объекта, видимого для JavaScript, чтобы функция была доступна из скрипта.

Чтобы представить функцию как часть экспорта модуля дополнения, установите вновь созданную функцию для объекта экспорта. Пример модуля может выглядеть следующим образом:
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

Учитывая вышеуказанный код, дополнение может использоваться из JavaScript следующим образом:
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

- `[in] env`: Среда, в которой вызывается API.
- `[in] cbinfo`: Информация обратного вызова, передаваемая в функцию обратного вызова.
- `[in-out] argc`: Определяет размер предоставленного массива `argv` и получает фактическое количество аргументов.
- `[out] argv`: Буфер, в который копируется `napi_value`, представляющее аргументы. Если количество аргументов превышает указанное количество, копируется только запрошенное количество аргументов. Если предоставлено меньше аргументов, чем заявлено, остальная часть `argv` заполняется значениями `napi_value`, которые представляют `undefined`.
- `[out] this`: Получает аргумент `this` JavaScript для вызова.
- `[out] data`: Получает указатель данных для обратного вызова.

При успешном выполнении API возвращает `napi_ok`.

Этот метод используется в функции обратного вызова для получения подробной информации о вызове, например, аргументов и указателя `this` из заданной информации обратного вызова.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] cbinfo`: Информация обратного вызова, передаваемая в функцию обратного вызова.
- `[out] result`: The `new.target` of the constructor call.

При успешном выполнении API возвращает `napi_ok`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] cons`: `napi_value` representing the JavaScript function to be invoked as a constructor.
- `[in] argc`: Количество элементов в массиве `argv`.
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

При успешном выполнении API возвращает `napi_ok`.

## Обтекание объекта

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

 - `[in] env`: Среда, в которой вызывается API.
 - `[in] utf8name`: Name of the JavaScript constructor function; this is not required to be the same as the C++ class name, though it is recommended for clarity.
 - `[in] length`: The length of the utf8name in bytes, or `NAPI_AUTO_LENGTH` if it is null-terminated.
 - `[in] constructor`: Callback function that handles constructing instances of the class. (This should be a static method on the class, not an actual C++ constructor function.)
 - `[in] data`: Optional data to be passed to the constructor callback as the `data` property of the callback info.
 - `[in] property_count`: Number of items in the `properties` array argument.
 - `[in] properties`: Array of property descriptors describing static and instance data properties, accessors, and methods on the class See `napi_property_descriptor`.
 - `[out] result`: A `napi_value` representing the constructor function for the class.

При успешном выполнении API возвращает `napi_ok`.

Defines a JavaScript class that corresponds to a C++ class, including:
 - A JavaScript constructor function that has the class name and invokes the provided C++ constructor callback.
 - Properties on the constructor function corresponding to _static_ data properties, accessors, and methods of the C++ class (defined by property descriptors with the `napi_static` attribute).
 - Properties on the constructor function's `prototype` object corresponding to _non-static_ data properties, accessors, and methods of the C++ class (defined by property descriptors without the `napi_static` attribute).

The C++ constructor callback should be a static method on the class that calls the actual class constructor, then wraps the new C++ instance in a JavaScript object, and returns the wrapper object. See `napi_wrap()` for details.

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

 - `[in] env`: Среда, в которой вызывается API.
 - `[in] js_object`: The JavaScript object that will be the wrapper for the native object. This object _must_ have been created from the `prototype` of a constructor that was created using `napi_define_class()`.
 - `[in] native_object`: The native instance that will be wrapped in the JavaScript object.
 - `[in] finalize_cb`: Optional native callback that can be used to free the native instance when the JavaScript object is ready for garbage-collection.
 - `[in] finalize_hint`: Optional contextual hint that is passed to the finalize callback.
 - `[out] result`: Optional reference to the wrapped object.

При успешном выполнении API возвращает `napi_ok`.

Wraps a native instance in a JavaScript object. The native instance can be retrieved later using `napi_unwrap()`.

When JavaScript code invokes a constructor for a class that was defined using `napi_define_class()`, the `napi_callback` for the constructor is invoked. After constructing an instance of the native class, the callback must then call `napi_wrap()` to wrap the newly constructed instance in the already-created JavaScript object that is the `this` argument to the constructor callback. (That `this` object was created from the constructor function's `prototype`, so it already has definitions of all the instance properties and methods.)

Typically when wrapping a class instance, a finalize callback should be provided that simply deletes the native instance that is received as the `data` argument to the finalize callback.

The optional returned reference is initially a weak reference, meaning it has a reference count of 0. Typically this reference count would be incremented temporarily during async operations that require the instance to remain valid.

*Caution*: The optional returned reference (if obtained) should be deleted via [`napi_delete_reference`][] ONLY in response to the finalize callback invocation. (If it is deleted before then, then the finalize callback may never be invoked.) Therefore, when obtaining a reference a finalize callback is also required in order to enable correct proper of the reference.

*Note*: This API may modify the prototype chain of the wrapper object. Afterward, additional manipulation of the wrapper's prototype chain may cause `napi_unwrap()` to fail.

Calling napi_wrap() a second time on an object will return an error. To associate another native instance with the object, use napi_remove_wrap() first.

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

 - `[in] env`: Среда, в которой вызывается API.
 - `[in] js_object`: The object associated with the native instance.
 - `[out] result`: Pointer to the wrapped native instance.

При успешном выполнении API возвращает `napi_ok`.

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

 - `[in] env`: Среда, в которой вызывается API.
 - `[in] js_object`: The object associated with the native instance.
 - `[out] result`: Pointer to the wrapped native instance.

При успешном выполнении API возвращает `napi_ok`.

Retrieves a native instance that was previously wrapped in the JavaScript object `js_object` using `napi_wrap()` and removes the wrapping, thereby restoring the JavaScript object's prototype chain. If a finalize callback was associated with the wrapping, it will no longer be called when the JavaScript object becomes garbage-collected.

## Простые асинхронные операции

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible async_hooks [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[in] execute`: The native function which should be called to execute the logic asynchronously. The given function is called from a worker pool thread and can execute in parallel with the main event loop thread.
- `[in] complete`: The native function which will be called when the asynchronous logic is completed or is cancelled. The given function is called from the main event loop thread.
- `[in] data`: Пользовательский контекст данных. This will be passed back into the execute and complete functions.
- `[out] result`: `napi_async_work*` which is the handle to the newly created async work.

При успешном выполнении API возвращает `napi_ok`.

This API allocates a work object that is used to execute logic asynchronously. It should be freed using [`napi_delete_async_work`][] once the work is no longer required.

`async_resource_name` should be a null-terminated, UTF-8-encoded string.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

При успешном выполнении API возвращает `napi_ok`.

This API frees a previously allocated work object.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

### napi_queue_async_work
<!-- YAML
added: v8.0.0
napiVersion: 1
-->
```C
napi_status napi_queue_async_work(napi_env env,
                                  napi_async_work work);
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

При успешном выполнении API возвращает `napi_ok`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] work`: The handle returned by the call to `napi_create_async_work`.

При успешном выполнении API возвращает `napi_ok`.

This API cancels queued work if it has not yet been started. If it has already started executing, it cannot be cancelled and `napi_generic_failure` will be returned. If successful, the `complete` callback will be invoked with a status value of `napi_cancelled`. The work should not be deleted before the `complete` callback invocation, even if it has been successfully cancelled.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

## Пользовательские асинхронные операции
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

- `[in] env`: Среда, в которой вызывается API.
- `[in] async_resource`: An optional object associated with the async work that will be passed to possible `async_hooks` [`init` hooks][].
- `[in] async_resource_name`: Identifier for the kind of resource that is being provided for diagnostic information exposed by the `async_hooks` API.
- `[out] result`: The initialized async context.

При успешном выполнении API возвращает `napi_ok`.

### napi_async_destroy
<!-- YAML
added: v8.6.0
napiVersion: 1
-->
```C
napi_status napi_async_destroy(napi_env env,
                               napi_async_context async_context);
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] async_context`: The async context to be destroyed.

При успешном выполнении API возвращает `napi_ok`.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] async_context`: Context for the async operation that is invoking the callback. This should normally be a value previously obtained from [`napi_async_init`][]. However `NULL` is also allowed, which indicates the current async context (if any) is to be used for the callback.
- `[in] recv`: Объект `this`, переданный вызываемой функции.
- `[in] func`: `napi_value`, представляющее функцию JavaScript, которая должна быть вызвана.
- `[in] argc`: Количество элементов в массиве `argv`.
- `[in] argv`: Array of JavaScript values as `napi_value` representing the arguments to the function.
- `[out] result`: `napi_value`, представляющее возвращаемый объект JavaScript.

При успешном выполнении API возвращает `napi_ok`.

Этот метод позволяет вызывать объект функции JavaScript из нативного дополнения. This API is similar to `napi_call_function`. However, it is used to call *from* native code back *into* JavaScript *after* returning from an async operation (when there is no other script on the stack). It is a fairly simple wrapper around `node::MakeCallback`.

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
- `[in] env`: Среда, в которой вызывается API.
- `[in] resource_object`: An optional object associated with the async work that will be passed to possible async_hooks [`init` hooks][].
- `[in] context`: Context for the async operation that is invoking the callback. This should be a value previously obtained from [`napi_async_init`][].
- `[out] result`: The newly created scope.

There are cases (for example resolving promises) where it is necessary to have the equivalent of the scope associated with a callback in place when making certain N-API calls.  If there is no other script on the stack the [`napi_open_callback_scope`][] and [`napi_close_callback_scope`][] functions can be used to open/close the required scope.

### *napi_close_callback_scope*
<!-- YAML
added: v8.11.2
napiVersion: 3
-->
```C
NAPI_EXTERN napi_status napi_close_callback_scope(napi_env env,
                                                  napi_callback_scope scope)
```
- `[in] env`: Среда, в которой вызывается API.
- `[in] scope`: The scope to be closed.

Этот API может быть вызван, даже если есть ожидающее исключение JavaScript.

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

- `[in] env`: Среда, в которой вызывается API.
- `[out] version`: A pointer to version information for Node itself.

При успешном выполнении API возвращает `napi_ok`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[out] result`: The highest version of N-API supported.

При успешном выполнении API возвращает `napi_ok`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] change_in_bytes`: The change in externally allocated memory that is kept alive by JavaScript objects.
- `[out] result`: The adjusted value

При успешном выполнении API возвращает `napi_ok`.

This function gives V8 an indication of the amount of externally allocated memory that is kept alive by JavaScript objects (i.e. a JavaScript object that points to its own memory allocated by a native module). Registering externally allocated memory will trigger global garbage collections more often than it would otherwise.

<!-- it's very convenient to have all the anchors indexed -->
<!--lint disable no-unused-definitions remark-lint-->
## Промисы

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

- `[in] env`: Среда, в которой вызывается API.
- `[out] deferred`: A newly created deferred object which can later be passed to `napi_resolve_deferred()` or `napi_reject_deferred()` to resolve resp. reject the associated promise.
- `[out] promise`: The JavaScript promise associated with the deferred object.

При успешном выполнении API возвращает `napi_ok`.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] deferred`: The deferred object whose associated promise to resolve.
- `[in] resolution`: The value with which to resolve the promise.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] deferred`: The deferred object whose associated promise to resolve.
- `[in] rejection`: The value with which to reject the promise.

This API rejects a JavaScript promise by way of the deferred object with which it is associated. Thus, it can only be used to reject JavaScript promises for which the corresponding deferred object is available. This effectively means that the promise must have been created using `napi_create_promise()` and the deferred object returned from that call must have been retained in order to be passed to this API.

The deferred object is freed upon successful completion.

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

- `[in] env`: Среда, в которой вызывается API.
- `[in] promise`: The promise to examine
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

- `[in] env`: Среда, в которой вызывается API.
- `[in] script`: A JavaScript string containing the script to execute.
- `[out] result`: The value resulting from having executed the script.

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

- `[in] env`: Среда, в которой вызывается API.
- `[out] loop`: The current libuv loop instance.

## Asynchronous Thread-safe Function Calls

> Стабильность: 1 - экспериментальный

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

> Стабильность: 2 - Стабильно

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

- `[in] env`: Среда, в которой вызывается API.
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

> Стабильность: 2 - Стабильно

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

> Стабильность: 2 - Стабильно

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

> Стабильность: 2 - Стабильно

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

> Стабильность: 2 - Стабильно

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

> Стабильность: 2 - Стабильно

<!-- YAML
added: v8.16.0
-->
```C
NAPI_EXTERN napi_status
napi_ref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] func`: The thread-safe function to reference.

This API is used to indicate that the event loop running on the main thread should not exit until `func` has been destroyed. Similar to [`uv_ref`][] it is also idempotent.

This API may only be called from the main thread.

### napi_unref_threadsafe_function

> Стабильность: 2 - Стабильно

<!-- YAML
added: v8.16.0
-->
```C
NAPI_EXTERN napi_status
napi_unref_threadsafe_function(napi_env env, napi_threadsafe_function func);
```

- `[in] env`: Среда, в которой вызывается API.
- `[in] func`: The thread-safe function to unreference.

This API is used to indicate that the event loop running on the main thread may exit before `func` is destroyed. Similar to [`uv_unref`][] it is also idempotent.

This API may only be called from the main thread.
