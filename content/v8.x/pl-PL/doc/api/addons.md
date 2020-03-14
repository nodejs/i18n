# Dodatki C++

<!--introduced_in=v0.10.0-->

Dodatki Node.js to dynamicznie połączone obiekty współdzielone, napisane w C++, które mogą być załadowane do Node.js za pomocą funkcji [`require()`](modules.html#modules_require) i używane tak, jakby były zwykłym modułem Node.js. Są one używane głównie w celu zapewnienia interfejsu między JavaScriptem uruchomionym w Node.js i bibliotekami C / C ++.

W chwili obecnej metoda wykonania Addons jest dość skomplikowana, obejmująca znajomość kilku komponentów i interfejsów API:

 - V8: biblioteka C ++, którą Node.js obecnie używa do zapewnienia wykonania JavaScript. V8 zapewnia mechanizmy tworzenia obiektów, funkcji dzwoniących itp. API V8 jest udokumentowane głównie w `v8.h` pliku nagłówkowym (`deps/v8/include/v8.h` w drzewie źródłowym Node.js), które jest również dostępne [online](https://v8docs.nodesource.com/).

 - [libuv](https://github.com/libuv/libuv): Biblioteka C która implementuje pętlę wydarzeń Node.js, jej wątki robocze i wszystkie asynchroniczne zachowania platformy. Służy także jako wieloplatformowa biblioteka abstrakcji, umożliwiając łatwy, podobny do POSIX dostęp we wszystkich głównych systemach operacyjnych do wielu powszechnych zadań systemowych, takich jak interakcja z systemem plików, gniazdami, zegarami i zdarzeniami systemowymi. libuv również zapewnia podobną do pthreads abstrakcję wątków, która może być używana do zasilania bardziej wyrafinowanych asynchronicznych dodatków, które muszą wyjść poza standardową pętlę wydarzeń. Addon authors are encouraged to think about how to avoid blocking the event loop with I/O or other time-intensive tasks by off-loading work via libuv to non-blocking system operations, worker threads or a custom use of libuv's threads.

 - Wewnętrzne biblioteki Node.js. Sam w sobie Node.js eksportuje wiele API C++ których dodatki mogą używać &mdash;, najważniejsze z nich to klasa `node::ObjectWrap`.

 - Node.js zawiera szereg innych bibliotek statycznych, w tym OpenSSL. Te inne biblioteki znajdują się w katalogu `deps/` w drzewie źródłowym Node.js. Only the libuv, OpenSSL, V8 and zlib symbols are purposefully re-exported by Node.js and may be used to various extents by Addons. Aby uzyskać dodatkowe informacje, zobacz [Łączenie z własnymi zależnościami Node.js](#addons_linking_to_node_js_own_dependencies).

Wszystkie poniższe przykłady są dostępne do [pobrania](https://github.com/nodejs/node-addon-examples) i mogą być używane jako punkt początkowy dla dodatków.

## Witaj świecie

Ten przykład "Witaj świecie" jest prostym dodatkiem napisanym w C++, który jest odpowiednikiem następującego kodu JavaScript:

```js
module.exports.hello = () => 'world';
```

Najpierw, utwórz plik `hello.cc`:

```cpp
// hello.cc
#include <node.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void Method(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "world"));
}

void init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "hello", Method);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, init)

}  // namespace demo
```

Zwróć uwagę, że wszystkie dodatki Node.js muszą wyeksportować funkcję inicjalizacyjną zgodnie z następującym wzorcem:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

Po `NODE_MODULE` nie ma średnika, ponieważ nie jest on funkcją (zobacz `node.h`).

`module_name` musi odpowiadać nazwie pliku końcowego pliku binarnego (z wyjątkiem sufiksu .node).

W przykładzie `hello.cc` funkcją inicjującą jest `init`, a nazwa modułu dodatku to `addon`.

### Konfigurowanie

Po zapisaniu kodu źródłowego, należy go skompilować do pliku binarnego `addon.node`. Aby to zrobić, utwórz plik o nazwie `binding.gyp` w najwyższym poziomie projektu opisującym konfigurację budowy modułu przy użyciu formatu podobnego do JSON. Ten plik jest używany przez [node-gyp](https://github.com/nodejs/node-gyp) — narzędzie napisane specjalnie do kompilacji dodatków Node.js.

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

*Note*: A version of the `node-gyp` utility is bundled and distributed with Node.js as part of `npm`. Ta wersja nie jest stworzona bezpośrednio dla programistów i jest przeznaczona tylko do obsługi możliwości użycia komendy `npm install` do kompilowania i instalowania dodatków. Deweloperzy, którzy chcą użyć `node-gyp` bezpośrednio, mogą zainstalować go za pomocą komendy `npm install -g node-gyp`. Po więcej informacji, w tym specyficzne dla platformy, zobacz [instrukcje instalacji](https://github.com/nodejs/node-gyp#installation) `node-gyp`.

Po utworzeniu pliku `binding.gyp`, użyj `node-gyp configure`, aby wygenerować odpowiednie pliki budowy projektu dla bieżącej platformy. Spowoduje to wygenerowanie pliku `Makefile` (na platformach Unix) lub pliku `vcxproj` (w systemie Windows) w katalogu `build/`.

Następnie użyj komendy `node-gyp build`, aby wygenerować skompilowany plik `addon.node`. Zostanie on wprowadzony do katalogu `build/Release/`.

Przy użyciu `npm zainstaluj ` by zainstalować dodatek Node.js, npm używa własną wersję wiązany `węzeł gyp` by wykonać ten sam zestaw działań, generowanie skompilowanej wersji dodatku dla użytkownika platformy na żądanie.

Po skonfigurowaniu, binarny dodatek może zostać użyty z poziomu Node.js, poprzez wskazanie [`require()`](modules.html#modules_require) do skonfigurowanego modułu `addon.node`:

```js
Hello.js
stały dodatek = wymaganie ('./zbudowany/Wydany/dodatek');

konsola.log(dodatek.hello());
/ / druki: 'świat''
```

Please see the examples below for further information or <https://github.com/arturadib/node-qt> for an example in production.

Ponieważ dokładna ścieżka do skompilowanego dodatku binarnego może się różnić w zależności od sposobu kompilacji (tj. czasami może znajdować się w `./build/Debug/`), dodatki mogą korzystać z pakietu [bindings](https://github.com/TooTallNate/node-bindings) do załadowania skompilowanego modułu.

Zauważ, że mimo iż implementacja pakietu `bindings` jest bardziej wyrafinowana w sposobie lokalizowania modułów dodatków, w zasadzie używa wzoru try-catch podobnego do:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Łączenie z własnymi zależnościami Node.js

Node.js korzysta z wielu statycznie połączonych bibliotek, takich jak V8, libuv, czy OpenSSL. Wszystkie dodatki są zobowiązane do połączenia z biblioteką V8, ale mogą także łączyć się z każdą inną zależnością. Zazwyczaj jest to tak proste, jak uwzględnienie `#include <...>` odpowiednich komunikatów (np. `#include <v8.h>`), a `node-gyp` automatycznie zlokalizuje odpowiednie nagłówki. Istnieje jednak kilka zastrzeżeń, o których należy pamiętać:

* Kiedy `node-gyp` funkcjonuje, wykryje on specyficzną wersję wydania Node.js i pobierze albo pełne archiwum źródłowe, lub tylko nagłówki. Jeśli zostanie pobrane pełne źródło, dodatki będą miały pełny dostęp do pełnego zestawu zależności Node.js. Jednakże, jeśli zostaną pobrane tylko nagłówki Node.js, będą dostępne wtedy tylko symbole wyeksportowane przez Node.js.

* `node-gyp` można uruchomić za pomocą flagi `--nodedir` wskazującej na lokalny obraz źródłowy Node.js. Używając tej opcji, ten dodatek będzie miał dostęp do pełnego zestawu zależności.

### Ładowanie dodatków za pomocą komendy require()

Rozszerzenie pliku skompilowanego dodatku binarnego to `.node` (w przeciwieństwie do `.dll` lub `.so`). Funkcja [`require()`](modules.html#modules_require) została napisana w celu wyszukania plików z rozszerzeniem `.node` i zainicjowania ich jako dynamicznie powiązanych bibliotek.

Podczas wywoływania [`require()`](modules.html#modules_require), rozszerzenie `.node` można zwykle pominąć, a Node.js nadal znajdzie i zainicjuje dodatek. Jedynym zastrzeżeniem jest jednak to, że Node.js najpierw spróbuje zlokalizować i załadować moduły lub pliki JavaScript, które dzielą tę samą nazwę podstawową. Na przykład, jeśli istnieje plik `addon.js` w tym samym katalogu co plik binarny `addon.node`, wówczas [`require('addon')`](modules.html#modules_require) da pierwszeństwo plikowi `addon.js` i załaduje go zamiast tego.

## Natywne abstrakcje dla Node.js

Każdy z przykładów przedstawionych w tym dokumencie bezpośrednio wykorzystuje API Node.js i V8 do implementacji dodatków. Ważne jest, aby zrozumieć, że API V8 może się zmienić drastycznie, jak to już zresztą było, od jednej wersji V8 do drugiej (i jednej ważnej wersji Node.js do następnej). Przy każdej zmianie dodatki mogą wymagać aktualizacji i ponownej kompilacji w celu kontynuowania działania. Harmonogram wydań Node.js został zaprojektowany w taki sposób, aby zminimalizować częstotliwość i wpływ wyżej wymienionych zmian, ale jest niewiele, co Node.js może obecnie zrobić, aby zapewnić stabilność API V8.

[Rodzime Abstrakcje dla Node.js](https://github.com/nodejs/nan) (lub `nan`) zapewniają zestaw narzędzi, które zaleca się deweloperom dodatków w celu zachowania zgodności pomiędzy przeszłymi i przyszłymi wersjami V8 i Node.js. Zobacz [przykłady](https://github.com/nodejs/nan/tree/master/examples/) `nan`, aby dowiedzieć się, w jaki sposób można go użyć.


## N-API

> Stabilność: 1 - Eksperymentalne

N-API jest API do budowania rodzimych dodatków. Jest niezależne od podstawowego środowiska wykonawczego JavaScript (na przykład V8) i jest utrzymywane jako część samego Node.js. Te API będzie Interfejsem Binarnym Aplikacji (ABI) stabilnym poprzez całą wersję Node.js. Ma on za zadanie izolować dodatki od zmian w zasadniczym silniku JavaScript i pozwolić modułom skompilowanym danej wersji działać w późniejszych wersjach Node.js bez wymogu ponownej kompilacji. Dodatki są budowane/pakowane przy użyciu tego samego podejścia/narzędzi opisanych w tym dokumencie (node-gyp, itp.). Jedyną różnicą jest zbiór API, które są używane przez kod rodzimy. Zamiast korzystać z V8 lub API [Rodzimych Abstrakcji dla Node.js](https://github.com/nodejs/nan), używane są funkcje dostępne w N-API.

Aby użyć N-API w następującym przykładzie "Hello world", zastąp zawartość `hello.cc` poniższym. Wszystkie pozostałe instrukcje pozostają takie same.

```cpp
// hello.cc using N-API
#include <node_api.h>

namespace demo {

napi_value Method(napi_env env, napi_callback_info args) {
  napi_value greeting;
  napi_status status;

  status = napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &greeting);
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

Dostępne funkcje i sposób ich używania są udokumentowane w sekcji zatytułowanej [C/C++ Addons - N-API](n-api.html).

## Przykłady dodatków

Oto kilka przykładów dodatków, które mają ułatwić deweloperom rozpoczęcie pracy. Przykłady wykorzystują API V8. Odwołaj się do [odnośnika V8](https://v8docs.nodesource.com/) w internecie, aby uzyskać pomoc dotyczącą różnych wywołań V8, oraz [poradnika do osadzania w V8](https://github.com/v8/v8/wiki/Embedder's%20Guide), aby uzyskać wyjaśnienie kilku używanych pojęć, takich jak uchwyty, zakresy, szablony funkcji itp.

Każdy z poniższych przykładów używa następującego pliku `binding.gyp`:

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

W przypadkach, gdy istnieje więcej niż jeden plik `.cc`, po prostu dodaj dodatkową nazwę pliku do tablicy `źródeł`. Na przykład:

```json
"sources": ["addon.cc", "myexample.cc"]
```

Gdy plik `binding.gyp` jest gotowy, przykładowe dodatki można skonfigurować i zbudować za pomocą `node-gyp`:

```console
$ node-gyp configure build
```


### Argumenty funkcji

Dodatki zazwyczaj odsłaniają obiekty i funkcje, do których można uzyskać dostęp za pomocą JavaScriptu działającego w Node.js. Gdy funkcje są wywoływane z JavaScriptu, argumenty wejściowe i zwracana wartość muszą być zmapowane na i z kodu C/C++.

Poniższy przykład ilustruje w jaki sposób należy odczytywać argumenty funkcji przekazywanych z JavaScriptu i jak zwracać wyniki:

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Exception;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
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
        String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  // Check the argument types
  if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Wrong arguments")));
    return;
  }

  // Perform the operation
  double value = args[0]->NumberValue() + args[1]->NumberValue();
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

Po skompilowaniu przykładowy dodatek może być wymagany i używany z poziomu Node.js:

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```


### Funkcje zwrotne

Powszechną praktyką w dodatkach jest przekazywanie funkcji JavaScript do funkcji C++ i wykonywanie ich stamtąd. Poniższy przykład ilustruje jak wywołać takie funkcje zwrotne:

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Function;
using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Null;
using v8::Object;
using v8::String;
using v8::Value;

void RunCallback(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Function> cb = Local<Function>::Cast(args[0]);
  const unsigned argc = 1;
  Local<Value> argv[argc] = { String::NewFromUtf8(isolate, "hello world") };
  cb->Call(Null(isolate), argc, argv);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", RunCallback);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```

Zwróć uwagę, że w tym przykładzie używana jest forma dwuargumentowa `Init()`, która odbiera pełny obiekt `modułu` jako drugi argument. To pozwala Dodatkom całkowicie przepisać `eksporty` za pomocą pojedynczej funkcji zamiast dodawania funkcji jako właściwości `eksportu`.

Aby to przetestować, uruchom następujący kod JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

Zauważ, że w tym przykładzie funkcja zwrotna jest wywoływana synchronicznie.

### Fabryka obiektów

Dodatki mogą tworzyć i zwracać nowe obiekty z funkcji C ++ jako zilustrowane w poniższym przykładzie. Obiekt jest tworzony i zwracany za pomocą właściwości`msg`, która odtwarza ciąg znaków przekazany do `createObject()`:

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::FunctionCallbackInfo;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void CreateObject(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  Local<Object> obj = Object::New(isolate);
  obj->Set(String::NewFromUtf8(isolate, "msg"), args[0]->ToString());

  args.GetReturnValue().Set(obj);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateObject);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```

Aby przetestować to w JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```


### Fabryka funkcji

Innym częstym scenariuszem jest tworzenie funkcji JavaScript, które obejmują funkcje C++i zwracanie ich z powrotem do JavaScript:

```cpp
// addon.cc
#include <node.h>

namespace demo {

using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Isolate;
using v8::Local;
using v8::Object;
using v8::String;
using v8::Value;

void MyFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  args.GetReturnValue().Set(String::NewFromUtf8(isolate, "hello world"));
}

void CreateFunction(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, MyFunction);
  Local<Function> fn = tpl->GetFunction();

  // omit this to make it anonymous
  fn->SetName(String::NewFromUtf8(isolate, "theFunction"));

  args.GetReturnValue().Set(fn);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateFunction);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```

Aby przetestować:

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```


### Obejmowanie obiektów C++

Możliwe jest również obejmowanie obiektów/klas C++ w sposób, który pozwala na utworzenie nowych instancji do za pomocą operatora JavaScript `nowy`:

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

Then, in `myobject.h`, the wrapper class inherits from `node::ObjectWrap`:

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

W `myobject.cc` implementuj różne metody, które mają zostać naświetlone. Poniżej, metoda `plusOne()` jest naświetlona poprzez dodanie jej do prototypu konstruktora:

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
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "MyObject"),
               tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Wywołana jako zwykła funkcja `MyObject (...)`, zamienia się w wywołanie konstruktu.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Context> context = isolate->GetCurrentContext();
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

To build this example, the `myobject.cc` file must be added to the `binding.gyp`:

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

Przetestuj to z:

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

### Factory of wrapped objects

Alternatywnie można użyć wzoru fabrycznego, aby uniknąć wyraźnego tworzenia instancji obiektów za pomocą operatora JavaScript `new`:

```js
const obj = addon.createObject();
// instead of:
// const obj = new addon.Object();
```

First, the `createObject()` method is implemented in `addon.cc`:

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

In `myobject.h`, the static method `NewInstance()` is added to handle instantiating the object. Ta metoda zastępuje użycie `nowego` w JavaScript:

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

The implementation in `myobject.cc` is similar to the previous example:

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
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  constructor.Reset(isolate, tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Wywołana jako zwykła funkcja `MyObject (...)`, zamienia się w wywołanie konstruktu.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Function> cons = Local<Function>::New(isolate, constructor);
    Local<Context> context = isolate->GetCurrentContext();
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

Once again, to build this example, the `myobject.cc` file must be added to the `binding.gyp`:

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

Przetestuj to z:

```js
// test.js
const createObject = require('./build/Release/addon');

const obj = createObject(10);
console.log(obj.plusOne());
// Druki: 11
console.log(obj.plusOne());
// Druki: 12
console.log(obj.plusOne());
// Druki: 13

const obj2 = createObject(20);
console.log(obj2.plusOne());
// Druki: 21
console.log(obj2.plusOne());
// Druki: 22
console.log(obj2.plusOne());
// Druki: 23
```


### Przekazywanie zapakowanych obiektów

In addition to wrapping and returning C++ objects, it is possible to pass wrapped objects around by unwrapping them with the Node.js helper function `node::ObjectWrap::Unwrap`. Poniższe przykłady pokazują funkcję `dodaj()`, która może przyjąć dwa obiekty `MójObiekt` jako argumenty wejściowe:

```cpp
// addon.cc
#include <node.h>
#include <node_object_wrap.h>
#include "myobject.h"

namespace demo {

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

  MyObject* obj1 = node::ObjectWrap::Unwrap<MyObject>(
      args[0]->ToObject());
  MyObject* obj2 = node::ObjectWrap::Unwrap<MyObject>(
      args[1]->ToObject());

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

W `myobject.h` dodano nową publiczną metodę zezwalającą na dostęp do prywatnych wartości po rozpakowaniu obiektu.

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

The implementation of `myobject.cc` is similar to before:

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
  tpl->SetClassName(String::NewFromUtf8(isolate, "MyObject"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  constructor.Reset(isolate, tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Invoked as constructor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
    // Wywołana jako zwykła funkcja `MyObject (...)`, zamienia się w wywołanie konstruktu.
    const int argc = 1;
    Local<Value> argv[argc] = { args[0] };
    Local<Context> context = isolate->GetCurrentContext();
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

Przetestuj to z:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// Prints: 30
```

### AtExit hooks

An "AtExit" hook is a function that is invoked after the Node.js event loop has ended but before the JavaScript VM is terminated and Node.js shuts down. "AtExit" hooks are registered using the `node::AtExit` API.

#### void AtExit(callback, args)

* `callback` {void (\*)(void\*)} A pointer to the function to call at exit.
* `args` {void\*} A pointer to pass to the callback at exit.

Registers exit hooks that run after the event loop has ended but before the VM is killed.

AtExit takes two parameters: a pointer to a callback function to run at exit, and a pointer to untyped context data to be passed to that callback.

Callbacks are run in last-in first-out order.

The following `addon.cc` implements AtExit:

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

Test in JavaScript by running:

```js
// test.js
require('./build/Release/addon');
```
