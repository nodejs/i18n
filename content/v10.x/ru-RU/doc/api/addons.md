# Расширения C++

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Расширения Node.js ― динамически связанные общие объекты, написанные на C++, которые могут быть загружены в Node.js посредством вызова функции [`require()`](modules.html#modules_require) и использоваться так, будто они были обычными модулями Node.js. Они используются главным образом для обеспечения интерфейса между JavaScript, исполняемого Node.js и библиотеками на С/С++.

В настоящий момент, способ реализации расширений достаточно сложен, и требует знания нескольких компонентов и API:

 - V8: библиотека C++, которую Node.js в настоящее время использует для обеспечения реализации JavaScript. V8 обеспечивает механизмы создания объектов, вызовов функций и т.д. API V8 задокументировано в основном в заглавном файле `v8.h` (`deps/v8/include/v8.h` в исходниках Node.js), который также доступен [онлайн](https://v8docs.nodesource.com/).

 - [libuv](https://github.com/libuv/libuv): Библиотека C, которая реализует цикл событий Node.js, его рабочие потоки и все асинхронные поведения платформы. Он также служит в качестве кроссплатформенной библиотеки абстракций, давая легкий, POSIX-подобный доступ через все основные операционные системы ко многим общим системным задачам, таким как как взаимодействие с файловой системой, сокетами, таймерами и системными событиями. libuv также предоставляет потоковую абстракцию типа pthreads, которая может быть использована для усиления более сложных асинхронных расширений, которым необходимо выйти за пределы стандартного цикла событий. Авторам расширения предлагается подумать о том, как избежать блокировки цикла событий ввода/вывода или других задач, которые занимают много времени, чтобы загрузить работу через libuv в неблокирующие системные операции, рабочие потоки или пользовательское использование потоков libuv.

 - Внутренние библиотеки Node.js. Node.js сам экспортирует некоторое количество API C++, которые могут быть использованы в расширениях. Наиболее важным из них является класс `node::ObjectWrap`.

 - Node.js включает в себя некоторые другие статически связанные библиотеки, включая OpenSSL. Эти другие библиотеки находятся в каталоге `deps/` в дереве исходного кода Node.js. Только символы libuv, OpenSSL, V8 и zlib целенаправленно реэкспортируются Node.js и могут быть использованы в различной степени аддонами. Для дополнительной информации смотрите [Связь с зависимостями Node.js](#addons_linking_to_node_js_own_dependencies).

Все приведенные ниже примеры доступны для [скачивания](https://github.com/nodejs/node-addon-examples) и могут быть использованы в качестве начальной точки для аддона.

## Hello world

Пример "Hello world" - простое расширение, написанное на C++, что является эквивалентом следующего кода JavaScript:

```js
module.exports.hello = () => 'world';
```

Во-первых, создайте файл `hello.cc`:

```cpp
// hello.cc
#include <node.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(
      isolate, "world", NewStringType::kNormal).ToLocalChecked());
}

void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "hello", Method);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)

}  // namespace demo
```

Обратите внимание, что все расширения Node.js должны экспортировать функцию инициализации следуя следующему шаблону:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

После `NODE_MODULE` нет точки с запятой, потому что это не функция (смотрите `node.h`).

`module_name` должно совпадать с именем файла конечного бинарного файла (исключая суффикс `node`).

In the `hello.cc` example, then, the initialization function is `Initialize` and the addon module name is `addon`.

When building addons with `node-gyp`, using the macro `NODE_GYP_MODULE_NAME` as the first parameter of `NODE_MODULE()` will ensure that the name of the final binary will be passed to `NODE_MODULE()`.

### Context-aware addons

There are environments in which Node.js addons may need to be loaded multiple times in multiple contexts. For example, the [Electron](https://electronjs.org/) runtime runs multiple instances of Node.js in a single process. Each instance will have its own `require()` cache, and thus each instance will need a native addon to behave correctly when loaded via `require()`. From the addon's perspective, this means that it must support multiple initializations.

A context-aware addon can be constructed by using the macro `NODE_MODULE_INITIALIZER`, which expands to the name of a function which Node.js will expect to find when it loads an addon. An addon can thus be initialized as in the following example:

```cpp
using namespace v8;

extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(Local<Object> exports,
                        Local<Value> module,
                        Local<Context> context) {
  /* Perform addon initialization steps here. */
}
```

Another option is to use the macro `NODE_MODULE_INIT()`, which will also construct a context-aware addon. Unlike `NODE_MODULE()`, which is used to construct an addon around a given addon initializer function, `NODE_MODULE_INIT()` serves as the declaration of such an initializer to be followed by a function body.

The following three variables may be used inside the function body following an invocation of `NODE_MODULE_INIT()`:
* `Local<Object> exports`,
* `Local<Value> module`, and
* `Local<Context> context`

The choice to build a context-aware addon carries with it the responsibility of carefully managing global static data. Since the addon may be loaded multiple times, potentially even from different threads, any global static data stored in the addon must be properly protected, and must not contain any persistent references to JavaScript objects. The reason for this is that JavaScript objects are only valid in one context, and will likely cause a crash when accessed from the wrong context or from a different thread than the one on which they were created.

The context-aware addon can be structured to avoid global static data by performing the following steps:
* defining a class which will hold per-addon-instance data. Such a class should include a `v8::Persistent<v8::Object>` which will hold a weak reference to the addon's `exports` object. The callback associated with the weak reference will then destroy the instance of the class.
* constructing an instance of this class in the addon initializer such that the `v8::Persistent<v8::Object>` is set to the `exports` object.
* storing the instance of the class in a `v8::External`, and
* passing the `v8::External` to all methods exposed to JavaScript by passing it to the `v8::FunctionTemplate` constructor which creates the native-backed JavaScript functions. The `v8::FunctionTemplate` constructor's third parameter accepts the `v8::External`.

This will ensure that the per-addon-instance data reaches each binding that can be called from JavaScript. The per-addon-instance data must also be passed into any asynchronous callbacks the addon may create.

The following example illustrates the implementation of a context-aware addon:

```cpp
#include <node.h>

using namespace v8;

class AddonData {
 public:
  AddonData(Isolate* isolate, Local<Object> exports):
      call_count(0) {
    // Link the existence of this object instance to the existence of exports.
    exports_.Reset(isolate, exports);
    exports_.SetWeak(this, DeleteMe, WeakCallbackType::kParameter);
  }

  ~AddonData() {
    if (!exports_.IsEmpty()) {
      // Reset the reference to avoid leaking data.
      exports_.ClearWeak();
      exports_.Reset();
    }
  }

  // Per-addon data.
  int call_count;

 private:
  // Method to call when "exports" is about to be garbage-collected.
  static void DeleteMe(const WeakCallbackInfo<AddonData>& info) {
    delete info.GetParameter();
  }

  // Weak handle to the "exports" object. An instance of this class will be
  // destroyed along with the exports object to which it is weakly bound.
  v8::Persistent<v8::Object> exports_;
};

static void Method(const v8::FunctionCallbackInfo<v8::Value>& info) {
  // Retrieve the per-addon-instance data.
  AddonData* data =
      reinterpret_cast<AddonData*>(info.Data().As<External>()->Value());
  data->call_count++;
  info.GetReturnValue().Set((double)data->call_count);
}

// Initialize this addon to be context-aware.
NODE_MODULE_INIT(/* exports, module, context */) {
  Isolate* isolate = context->GetIsolate();

  // Create a new instance of AddonData for this instance of the addon.
  AddonData* data = new AddonData(isolate, exports);
  // Wrap the data in a v8::External so we can pass it to the method we expose.
  Local<External> external = External::New(isolate, data);

  // Expose the method "Method" to JavaScript, and make sure it receives the
  // per-addon-instance data we created above by passing `external` as the
  // third parameter to the FunctionTemplate constructor.
  exports->Set(context,
               String::NewFromUtf8(isolate, "method", NewStringType::kNormal)
                  .ToLocalChecked(),
               FunctionTemplate::New(isolate, Method, external)
                  ->GetFunction(context).ToLocalChecked()).FromJust();
}
```

### Сборка

Как только исходный код был записан, он должен быть скомпилирован в двоичный файл `addon.node`. Для этого создайте файл с именем `binding.gyp` в корне проекта, описывающего конфигурацию сборки модуля с использованием JSON-подобного формата. Этот файл используется [node-gyp](https://github.com/nodejs/node-gyp) - инструментом, написанным специально для компиляции расширений Node.js.

```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "hello.cc" ]
    }
  ]
}
```

Версия утилиты `node-gyp` поставляется в комплекте и распространяется вместе с Node.js как часть `npm`. Эта версия не предоставляется непосредственно для использования разработчиками и предназначена только для поддержки возможности использования команды `npm install` для компиляции и установки расширений. Разработчики, которые хотят напрямую использовать `node-gyp`, могут установить ее, используя команду `npm install -g node-gyp`. Для более подробной информации смотрите </a> инструкции по установке `node-gyp`, включая требования к платформе.</p> 

После создания файла `binding.gyp`, используйте `node-gyp configure`, чтобы создать файлы соответствующего проекта для текущей платформы. Это так же сгенерирует файл `Makefile` (в платформах Unix) или файл `vcxproj` (в системе Windows) в директории `build/`.

Затем используйте команду `node-gyp build`, чтобы создать скомпилированный файл `addon.node`. Это будет помещено в директорию `build/Release/`.

При использовании `npm install` для установки расширения Node.js, npm использует собственную версию `node-gyp` для выполнения того же набора действий, создавая скомпилированную версию Addon для платформы пользователя по запросу.

После сборки бинарный аддон можно использовать внутри Node.js, указав [`require()`](modules.html#modules_require) на встроенный модуль `addon.node`:



```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```


Для получения дополнительной информации, пожалуйста, смотрите примеры, приведенные ниже, или <https://github.com/arturadib/node-qt> для примера при создании.

Из-за того, что точный путь к скомпилированному бинарному расширению может варьироваться в зависимости от того, как он скомпилирован (например, иногда это может быть `./build/Debug/`) расширения могут использовать пакет [bindings](https://github.com/TooTallNate/node-bindings) для загрузки скомпилированного модуля.

Обратите внимание, что хотя реализация пакета `bindings` более сложна в том, как он находит модули расширения, по существу используется модель try-catch, похожая на:



```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```




### Ссылка на зависимости Node.js

Node.js использует несколько статистически связанных библиотек, таких как V8, libuv и OpenSSL. Все расширения должны связываться с V8, и могут также связываться с любыми другими зависимостями. Обычно это так же просто как включение соответствующих операторов `#include <...>` (например, `#include <v8.h>`), и `node-gyp` автоматически найдет соответствующие заголовки. Однако имеются некоторые предостережения, о которых необходимо знать:

* Когда выполняется `node-gyp`, он обнаруживает конкретную версию Node.js и извлекает либо полный исходный архив, либо только заголовки. Если загружен полный исходный код, расширения будут иметь полный доступ ко всем наборам зависимостей Node.js. Однако, если загружены только заголовки Node.js, будут доступны только символы, экспортированные Node.js.

* `node-gyp` может быть запущен с использованием флага `--nodedir`, указывающего исходное изображение локального Node.js. Использую эту опцию, расширения могут иметь доступ к полному набору зависимостей.



### Загрузка расширений с помощью require()

Расширением имени файла для скомпилированного бинарного файла расширения должно быть `.node` (в отличие от `.dll` or `.so`). Функция [`require()`](modules.html#modules_require) написана для поиска файлов с расширением `.node` и для инициализации их как динамически связанных библиотек.

При вызове [`require()`](modules.html#modules_require) расширение `.node` обычно может быть опущено, и Node.js все равно найдет и инициализирует аддон. Однако, имеется одно предостережение - Node.js сначала попытается найти и загрузить модули или файлы JavaScript, который имеют одно и то же базовое имя. Например, если есть файл `addon.js` в том же каталоге, что и бинарный `addon.node`, то [`require('addon')`](modules.html#modules_require) даст приоритет файлу `addon.js` и загрузит его.



## Native Abstractions для Node.js

Каждый из примеров, представленных в документе, напрямую использует API Node.js и V8 для реализации Расширений. Важно понимать, что API V8 может быть (и был) значительно изменен от одной версии V8 к следующей (и от одной важной версии Node.js к следующей). Расширения с каждым изменением должны обновляться и перекомпилироваться для продолжения функционирования. График выпуска Node.js разработан, чтобы минимизировать частоту и влияние таких изменений, но в настоящее время Node.js мало что может сделать для обеспечения стабильности API V8.

[Native Abstractions for Node.js](https://github.com/nodejs/nan) (или `nan`) предоставляют набор инструментов, который разработчики Расширения рекомендуют к использованию, чтобы обеспечить совместимость между прошлыми и будущими версиями V8 и Node.js. Смотрите [примеры](https://github.com/nodejs/nan/tree/master/examples/) `nan` для демонстрации, как он может быть использован.



## N-API



> Стабильность: 2 - Стабильно

N-API - это API для создания собственных Расширений. Она независима от базовой среды выполнения JavaScript (ранее V8) и поддерживается как часть самого Node.js. Этот API будет стабильным двоичным интерфейсом приложения (Application Binary Interface - ABI) во всех версиях Node.js. Он предназначен для изоляции Расширений от изменений в базовом движке JavaScript и позволяет модулям, скомпилированным для одной версии, быть запущенными в более поздних версиях Node.js без перекомпиляции. Расширения созданы/упакованы с использованием тех же подходов/инструментов, которые описаны в этом документе (node-gyp и т.д). Единственное отличие - это набор API, которые используют собственный код. Вместо использования V8 или API [Native Abstractions for Node.js](https://github.com/nodejs/nan) используются функции, доступные в N-API.

Creating and maintaining an addon that benefits from the ABI stability provided by N-API carries with it certain [implementation considerations](n-api.html#n_api_implications_of_abi_stability).

Чтобы использовать N-API в примере выше "Привет мир", замените содержимое `hello.cc` на следующее. Все остальные инструкции остаются прежними.



```cpp
// hello.cc using N-API
#include <node_api.h>

namespace demo {

napi_value Method(napi_env env, napi_callback_info args) {
  napi_value greeting;
  napi_status status;

  status = napi_create_string_utf8(env, "world", NAPI_AUTO_LENGTH, &greeting);
  if (status != napi_ok) return nullptr;
  return greeting;
}

napi_value init(napi_env env, napi_value exports) {
  napi_status status;
  napi_value fn;

  status = napi_create_function(env, nullptr, 0, Method, nullptr, &fn);
  if (status != napi_ok) return nullptr;

  status = napi_set_named_property(env, exports, "hello", fn);
  if (status != napi_ok) return nullptr;
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
```


Доступные функции и способы их применения задокументированы в разделе [C/C++ Addons - N-API](n-api.html).



## Примеры Расширения

Ниже изложены примеры Расширений, которые помогут разработчикам приступить к работе. В примерах используются API V8. Обратитесь к онлайн [ссылка V8](https://v8docs.nodesource.com/) за помощью с различными вызовами V8 и V8 [Руководство для эмбеддера](https://github.com/v8/v8/wiki/Embedder's%20Guide) для объяснения некоторых используемых понятий, таких как дескрипторы, области действия, шаблоны функций и т.д.

Каждый из этих примеров использует следующий файл `binding.gyp`:



```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [ "addon.cc" ]
    }
  ]
}
```


In cases where there is more than one `.cc` file, simply add the additional filename to the `sources` array:



```json
"источники": ["addon.cc", "myexample.cc"]
```


Когда файл `binding.gyp` готов, примеры Расширений могут быть настроены и созданы с использованием `node-gyp`:



```console
$ node-gyp configure build
```




### Аргументы функций

Расширения обычно отображают объекты и функции, которые можно получить из JavaScript, запущенных в Node.js. Когда функции вызываются из JavaScript, входные аргументы и возвращаемое значение должны быть сопоставимы с кодом C/C++.

Следующий пример показывает, как читать аргументы функции, переданные из JavaScript, и как вернуть результат:



```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

// This is the implementation of the "add" method
// Input arguments are passed using the
// const FunctionCallbackInfo<Value>& args struct
void Add(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  // Check the number of arguments passed.
  if (args.Length() < 2) {
    // Throw an Error that is passed back to JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong number of arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  // Check the argument types
  if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  // Perform the operation
  double value =
      args[0].As<Number>()->Value() + args[1].As<Number>()->Value();
  Local<Number> num = Number::New(isolate, value);

  // Set the return value (using the passed in
  // FunctionCallbackInfo<Value>&)
  args.GetReturnValue().Set(num);
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add", Add);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```


После компиляции пример Расширения может быть затребован и использован из Node.js:



```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```




### Функции обратного вызова

Обычная практика в Расширениях - передавать функции JavaScript функции C++ и выполнять их оттуда. Следующий пример показывает, как вызвать такие функции обратного вызова:



```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Null;
using v8::Object;
using v8::String;
using v8::Value;

void RunCallback(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();
  Local<Function> cb = Local<Function>::Cast(args[0]);
  const unsigned argc = 1;
  Local<Value> argv[argc] = {
      String::NewFromUtf8(isolate,
                          "hello world",
                          NewStringType::kNormal).ToLocalChecked() };
  cb->Call(context, Null(isolate), argc, argv).ToLocalChecked();
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", RunCallback);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```


Обратите внимание, что в примере используется двухфакторная форма `Init()`, которая получает в качестве второго аргумента объект `модуль`. Это позволяет Расширению полностью переписать `экспорт` с помощью одной функции вместо добавления функции как свойства `экспорта`.

Чтобы проверить это, запустите следующий код JavaScript:



```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```


Обратите внимание, что в этом примере функция обратного вызова вызывается синхронно.



### Фабрика объектов

Расширения могут создавать и возвращать новые объекты из функции C++ как показано в следующем примере. Объект создается и возвращается с помощью свойства `msg`, которое отражается в строке, передаваемой в `createObject()`:



```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Context;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  Local<Object> obj = Object::New(isolate);
  obj->Set(context,
           String::NewFromUtf8(isolate,
                               "msg",
                               NewStringType::kNormal).ToLocalChecked(),
                               args[0]->ToString(context).ToLocalChecked())
           .FromJust();

  args.GetReturnValue().Set(obj);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateObject);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```


Проверить его в JavaScript:



```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```




### Фабрика функций

Другой распространенный сценарий - создание функций JavaScript, которые включают функции из C++ и их возвращение в JavaScript:



```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Object;
using v8::String;
using v8::Value;

void MyFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(
      isolate, "hello world", NewStringType::kNormal).ToLocalChecked());
}

void CreateFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  Local<Context> context = isolate->GetCurrentContext();
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, MyFunction);
  Local<Function> fn = tpl->GetFunction(context).ToLocalChecked();

  // omit this to make it anonymous
  fn->SetName(String::NewFromUtf8(
      isolate, "theFunction", NewStringType::kNormal).ToLocalChecked());

  args.GetReturnValue().Set(fn);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateFunction);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```


Для проверки:



```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```




### Обертывание объектов C++

Также можно обернуть объекты/классы C++ таким образом, который позволит создавать новые образцы с помощью оператора JavaScript `new`:



```cpp
// addon.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::Local;
using v8::Object;

void InitAll(Local<Object> exports) {
  MyObject::Init(exports);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, InitAll)

}  // namespace demo
```


Затем в `myobject.h` класс обертывания перенимается от `node::ObjectWrap`:



```cpp
// myobject.h
#ifndef MYOBJECT_H
#define MYOBJECT_H

#include <node.h>
#include <node_object_wrap.h>

namespace demo {

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Local<v8::Object> exports);

 private:
  explicit MyObject(double value = 0);
  ~MyObject();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void PlusOne(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```


В `myobject.cc` реализуйте различные методы, которые должны быть показаны. Ниже приведен метод `plusOne()`, показанный с помощью добавления его в прототип конструктора:



```cpp
// myobject.cc
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(
      isolate, "MyObject", NewStringType::kNormal).ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  Local<Context> context = isolate->GetCurrentContext();
  constructor.Reset(isolate, tpl->GetFunction(context).ToLocalChecked());
  exports->Set(context, String::NewFromUtf8(
      isolate, "MyObject", NewStringType::kNormal).ToLocalChecked(),
               tpl->GetFunction(context).ToLocalChecked()).FromJust();
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ?
        0 : args[0]->NumberValue(context).FromMaybe(0);
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> result =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(result);
  }
}

void MyObject::PlusOne(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.Holder());
  obj->value_ += 1;

  args.GetReturnValue().Set(Number::New(isolate, obj->value_));
}

}  // namespace demo
```


Чтобы составить этот пример, нужно добавить `myobject.cc` в `binding.gyp`:



```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [
        "addon.cc",
        "myobject.cc"
      ]
    }
  ]
}
```


Проверьте это здесь:



```js
// test.js
const addon = require('./build/Release/addon');

const obj = new addon.MyObject(10);
console.log(obj.plusOne());
// Prints: 11
console.log(obj.plusOne());
// Prints: 12
console.log(obj.plusOne());
// Prints: 13
```


The destructor for a wrapper object will run when the object is garbage-collected. For destructor testing, there are command-line flags that can be used to make it possible to force garbage collection. These flags are provided by the underlying V8 JavaScript engine. They are subject to change or removal at any time. They are not documented by Node.js or V8, and they should never be used outside of testing.



### Фабрика обернутых объектов

Также возможно использовать образец фабрики, чтобы точно избежать создание примеров объектов, используя оператор JavaScript `new`:



```js
const obj = addon.createObject();
// вместо:
// const obj = new addon.Object();
```


Сначала, метод `createObject()` реализуется в `addon.cc`:



```cpp
// addon.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  MyObject::NewInstance(args);
}

void InitAll(Local<Object> exports, Local<Object> module) {
  MyObject::Init(exports->GetIsolate());

  NODE_SET_METHOD(module, "exports", CreateObject);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, InitAll)

}  // namespace demo
```


В `myobject.h`, статический метод `NewInstance()` добавляется, для того чтобы проиллюстрировать обьект конкретными примерами. Этот метод применяется для использования `new` в JavaScript:



```cpp
// myobject.h
#ifndef MYOBJECT_H
#define MYOBJECT_H

#include <node.h>
#include <node_object_wrap.h>

namespace demo {

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Isolate* isolate);
  static void NewInstance(const v8::FunctionCallbackInfo<v8::Value>& args);

 private:
  explicit MyObject(double value = 0);
  ~MyObject();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void PlusOne(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```


Реализация `myobject.cc` сходна с предыдущим примером:



```cpp
// myobject.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Number;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Isolate* isolate) {
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(
      isolate, "MyObject", NewStringType::kNormal).ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  Local<Context> context = isolate->GetCurrentContext();
  constructor.Reset(isolate, tpl->GetFunction(context).ToLocalChecked());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ?
        0 : args[0]->NumberValue(context).FromMaybe(0);
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> instance =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(instance);
  }
}

void MyObject::NewInstance(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  const unsigned argc = 1;
  Local<Value> argv[argc] = { args[0] };
  Local<Function> cons = Local<Function>::New(isolate, constructor);
  Local<Context> context = isolate->GetCurrentContext();
  Local<Object> instance =
      cons->NewInstance(context, argc, argv).ToLocalChecked();

  args.GetReturnValue().Set(instance);
}

void MyObject::PlusOne(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  MyObject* obj = ObjectWrap::Unwrap<MyObject>(args.Holder());
  obj->value_ += 1;

  args.GetReturnValue().Set(Number::New(isolate, obj->value_));
}

}  // namespace demo
```


Чтобы составить этот пример, `myobject.cc` файл должен быть добавлен в `binding.gyp`:



```json
{
  "targets": [
    {
      "target_name": "addon",
      "sources": [
        "addon.cc",
        "myobject.cc"
      ]
    }
  ]
}
```


Проверьте это здесь:



```js
// test.js
const createObject = require('./build/Release/addon');

const obj = createObject(10);
console.log(obj.plusOne());
// Prints: 11
console.log(obj.plusOne());
// Prints: 12
console.log(obj.plusOne());
// Prints: 13

const obj2 = createObject(20);
console.log(obj2.plusOne());
// Prints: 21
console.log(obj2.plusOne());
// Prints: 22
console.log(obj2.plusOne());
// Prints: 23
```




### Передача завернутых объектов

В дополнение к обертыванию и возврату объектов C++ возможно передать завернутые объекты развернув их с помощью функции `node::ObjectWrap::Unwrap`. Следующие примеры показывают функцию `add()`, которая может иметь 2 объекта `MyObject` в виде встроенных аргументов:



```cpp
// addon.cc
#include <node.h>
#include <node_object_wrap.h>
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  MyObject::NewInstance(args);
}

void Add(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  MyObject* obj1 = node::ObjectWrap::Unwrap<MyObject>(
      args[0]->ToObject(context).ToLocalChecked());
  MyObject* obj2 = node::ObjectWrap::Unwrap<MyObject>(
      args[1]->ToObject(context).ToLocalChecked());

  double sum = obj1->value() + obj2->value();
  args.GetReturnValue().Set(Number::New(isolate, sum));
}

void InitAll(Local<Object> exports) {
  MyObject::Init(exports->GetIsolate());

  NODE_SET_METHOD(exports, "createObject", CreateObject);
  NODE_SET_METHOD(exports, "add", Add);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, InitAll)

}  // namespace demo
```


В `myobject.h` добавлен новый публичный метод, чтобы открыть доступ к приватным данным после распаковки обьекта.



```cpp
// myobject.h
#ifndef MYOBJECT_H
#define MYOBJECT_H

#include <node.h>
#include <node_object_wrap.h>

namespace demo {

class MyObject : public node::ObjectWrap {
 public:
  static void Init(v8::Isolate* isolate);
  static void NewInstance(const v8::FunctionCallbackInfo<v8::Value>& args);
  inline double value() const { return value_; }

 private:
  explicit MyObject(double value = 0);
  ~MyObject();

  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
  static v8::Persistent<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```


Реализация `myobject.cc` сходна с предыдущим примером:



```cpp
// myobject.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Object;
using v8::Persistent;
using v8::String;
using v8::Value;

Persistent<Function> MyObject::constructor;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Isolate* isolate) {
  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
  tpl->SetClassName(String::NewFromUtf8(
      isolate, "MyObject", NewStringType::kNormal).ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  Local<Context> context = isolate->GetCurrentContext();
  constructor.Reset(isolate, tpl->GetFunction(context).ToLocalChecked());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ?
        0 : args[0]->NumberValue(context).FromMaybe(0);
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Invoked as plain function `MyObject(...)`, turn into construct call.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Object> instance =
        cons->NewInstance(context, argc, argv).ToLocalChecked();
    args.GetReturnValue().Set(instance);
  }
}

void MyObject::NewInstance(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  const unsigned argc = 1;
  Local<Value> argv[argc] = { args[0] };
  Local<Function> cons = Local<Function>::New(isolate, constructor);
  Local<Context> context = isolate->GetCurrentContext();
  Local<Object> instance =
      cons->NewInstance(context, argc, argv).ToLocalChecked();

  args.GetReturnValue().Set(instance);
}

}  // namespace demo
```


Проверьте это здесь:



```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// Prints: 30
```




### AtExit хуки

An `AtExit` hook is a function that is invoked after the Node.js event loop has ended but before the JavaScript VM is terminated and Node.js shuts down. `AtExit` hooks are registered using the `node::AtExit` API.



#### void AtExit(функция обратного вызова, args)

* `callback` <span class="type">&lt;void (\*)(void\*)&gt;</span> A pointer to the function to call at exit.

* `args` <span class="type">&lt;void\*&gt;</span> A pointer to pass to the callback at exit.

Регистраторы выходят из хуков, которые запусткаются после того, как цикл событий окончен, но до того, как VM остановлен.

`AtExit` takes two parameters: a pointer to a callback function to run at exit, and a pointer to untyped context data to be passed to that callback.

Функции обратного вызова запускаются в соответствии с принципом LIFO (когда последние добавленные данные обрабатываются первыми).

The following `addon.cc` implements `AtExit`:



```cpp
// addon.cc
#include <assert.h>
#include <stdlib.h>
#include <node.h>

namespace demo {

using node::AtExit;
using v8::HandleScope;
using v8::Isolate;
using v8::Local;
using v8::Object;

static char cookie[] = "yum yum";
static int at_exit_cb1_called = 0;
static int at_exit_cb2_called = 0;

static void at_exit_cb1(void* arg) {
  Isolate* isolate = static_cast<Isolate*>(arg);
  HandleScope scope(isolate);
  Local<Object> obj = Object::New(isolate);
  assert(!obj.IsEmpty());  // assert VM is still alive
  assert(obj->IsObject());
  at_exit_cb1_called++;
}

static void at_exit_cb2(void* arg) {
  assert(arg == static_cast<void*>(cookie));
  at_exit_cb2_called++;
}

static void sanity_check(void*) {
  assert(at_exit_cb1_called == 1);
  assert(at_exit_cb2_called == 2);
}

void init(Local<Object> exports) {
  AtExit(at_exit_cb2, cookie);
  AtExit(at_exit_cb2, cookie);
  AtExit(at_exit_cb1, exports->GetIsolate());
  AtExit(sanity_check);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
```


Тестируйте JavaScript запустив:



```js
// test.js require('./build/Release/addon');
```
