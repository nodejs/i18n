# C++ Addons

<!--introduced_in=v0.10.0-->

Node.js Addons are dynamically-linked shared objects, written in C++, that can be loaded into Node.js using the [`require()`](modules.html#modules_require) function, and used just as if they were an ordinary Node.js module. Se utilizan principalmente para proporcionar una interfaz entre JavaScript ejecutándose en Node.js y bibliotecas de C/C++.

Por el momento, el método para implementar Complementos es algo complicado, implicando conocimientos de diversos componentes y APIs :

* V8: la biblioteca de C++ que Node.js utiliza actualmente para proporcionar la implementación de JavaScript. V8 proporciona los mecanismos para crear objetos, llamar funciones, etc. La API de V8 está documentada principalmente en el archivo de cabecera `v8.h` (`deps/v8/include/v8.h` en el árbol de fuente de Node.js), la cual también está disponible [en línea](https://v8docs.nodesource.com/).

* [libuv](https://github.com/libuv/libuv): La biblioteca de C que implementa el bucle de eventos de Node.js, sus hilos de workers y todos los comportamientos asincrónicos de la plataforma. It also serves as a cross-platform abstraction library, giving easy, POSIX-like access across all major operating systems to many common system tasks, such as interacting with the filesystem, sockets, timers, and system events. libuv también proporciona una abstracción de hilos similar a pthreads que puede ser utilizada para brindar poder a Complementos asincrónicos más sofisticados que necesiten moverse más allá del bucle de eventos estándar. A los autores de Complementos se les anima a pensar sobre cómo evitar el bloqueo del bucle de eventos con I/O u otras tareas de alto consumo de tiempo mediante la descarga de trabajo por medio de libuv para operaciones que no bloquean el sistema, hilos del worker o un uso personalizado de los hilos de libuv.

* Bibliotecas internas de Node.js. Node.js exporta un número de APIs de C+++ que los Complementos pueden utilizar &mdash; de las cuales la más importante es la de clase `node::ObjectWrap` .

* Node.js incluye otras bibliotecas vinculadas estáticamente, entre las que se encuentra OpenSSL. Estas otras bibliotecas se encuentran en el directorio `deps/`, en el árbol de fuente de Node.js. Solo los símbolos de V8 y OpenSSL son reexportados deliberadamente por Node.js y pueden ser utilizados en varios grados por los Complementos. Vea [Vinculación a las dependencias de Node.js](#addons_linking_to_node_js_own_dependencies) para más información.

All of the following examples are available for [download](https://github.com/nodejs/node-addon-examples) and may be used as the starting-point for an Addon.

## Hello world

Este ejemplo de "Hello world" es un Complemento simple, escrito en C++, el cual es el equivalente del siguiente código de JavaScript:

```js
module.exports.hello = () => 'world';
```

Primero, cree el archivo `hello.cc`:

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

Tenga en cuenta que todos los Complementos de Node.js deben exportar una función de inicialización siguiendo el patrón:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

No hay punto y coma después de `NODE_MODULE`, ya que no es una función (vea `node.h`).

El `module_name` debe coincidir con el nombre de archivo del binario final (excluyendo al sufijo .node).

Entonces, en el ejemplo de `hello.cc`, la función de inicialización es `init` y el nombre del módulo de Complemento es `addon`.

### Compilación

Una vez que el código de fuente haya sido escrito, deberá ser compilado en el archivo binario `addon.node` . To do so, create a file called `binding.gyp` in the top-level of the project describing the build configuration of the module using a JSON-like format. This file is used by [node-gyp](https://github.com/nodejs/node-gyp) -- a tool written specifically to compile Node.js Addons.

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

*Note*: A version of the `node-gyp` utility is bundled and distributed with Node.js as part of `npm`. Esta versión no se proporciona directamente a la disposición de los desarrolladores para su uso, y está diseñada solo para brindar soporte a la habilidad de utilizar el comando `node-gyp` para compilar e instalar Complementos. Los desarrolladores que deseen utilizar `node-gyp` directamente, pueden instalarlo utilizando el comando `npm install -g node-gyp`. Vea las [instrucciones de instalación](https://github.com/nodejs/node-gyp#installation) de `node-gyp` para más información, incluyendo los requisitos específicos de la plataforma.

Una vez que se haya creado el archivo `binding.gyp`, utilice `node-gyp configure` para generar los archivos de compilación apropiados del proyecto para la plataforma actual. Esto generará o un `Makefile` (en plataformas Unix) o un archivo `vcxproj` (en Windows) en el directorio `build/` .

Después, invoque el comando `node-gyp build` para generar el archivo compilado `addon.node` . Esto se colocará dentro del directorio de `build/Release/` .

Cuando se utiliza `npm install` para instalar un Complemento de Node.js, npm utiliza su propia versión empaquetada de `node-gyp` para realizar este mismo conjunto de acciones, generando una versión compilada del Complemento para la plataforma del usuario a petición.

Once built, the binary Addon can be used from within Node.js by pointing [`require()`](modules.html#modules_require) to the built `addon.node` module:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

Por favor, vea los ejemplos a continuación para mayor información o <https://github.com/arturadib/node-qt> para ver un ejemplo en producción.

Ya que la ruta exacta hacia el Complemento binario compilado puede variar dependiendo de cómo esté compilado (por ejemplo, a veces puede estar en `./build/Debug/`), los Complementos pueden utilizar el paquete [bindings](https://github.com/TooTallNate/node-bindings) para cargar el módulo compilado.

Tenga en cuenta que mientras el paquete de implementación `bindings` es más sofisticado en cuanto a cómo localiza los módulos de los Complementos, esencialmente está utilizando un patrón de intento de captura similar a:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Vincular a las dependencias de Node.js

Node.js utiliza un número de bibliotecas vinculadas estáticamente, tales como V8, libuv y OpenSSL. Todos los Complementos deben vincularse a V8, y también se pueden vincular a cualquiera de las otras dependencias. Por lo general, esto es tan simple como incluir las sentencias apropiadas `#include <...>` (por ejemplo, `#include <v8.h>`) y `node-gyp` localizará los encabezados apropiados automáticamente. Sin embargo, existen algunas advertencias a tener en cuenta:

* Cuando se ejecuta `node-gyp`, detectará la versión de lanzamiento específica de Node.js y descargará el tarball de la fuente completa o solo las cabeceras. Si se descarga completamente la fuente, los Complementos tendrán acceso completo a todo el conjunto de dependencias de Node.js. Sin embargo, si solo se descargan las cabeceras de Node.js, entonces solo los símbolos exportados por Node.js estarán disponibles.

* `node-gyp` puede ser ejecutado utilizando la bandera `--nodedir` apuntando hacia una imagen de fuente local de Node.js. Al utilizar esta opción, el Complemento tendrá acceso a todo el conjunto de dependencias.

### Cargar Complementos utilizando require()

La extensión del nombre de archivo del Complemento binario compilado es `.node` (a diferencia de `.dll` o `.so`). The [`require()`](modules.html#modules_require) function is written to look for files with the `.node` file extension and initialize those as dynamically-linked libraries.

When calling [`require()`](modules.html#modules_require), the `.node` extension can usually be omitted and Node.js will still find and initialize the Addon. Sin embargo, una de las advertencias es que Node.js primero intentará localizar y cargar los módulos o archivos de JavaScript que compartan el mismo nombre de base. For instance, if there is a file `addon.js` in the same directory as the binary `addon.node`, then [`require('addon')`](modules.html#modules_require) will give precedence to the `addon.js` file and load it instead.

## Abstracciones Nativas para Node.js

Cada uno de los ejemplos ilustrados en este documento hacen uso directo de las APIs de Node.js y V8 para la implementación de Complementos. Es importante entender que la API V8 puede, y lo ha hecho, cambiar drásticamente desde un lanzamiento de V8 al siguiente (y de un lanzamiento mayor de Node.js al siguiente). Con cada cambio, puede que los Complementos necesiten ser actualizados y recompilados para poder continuar funcionando. La fecha de lanzamiento de Node.js está diseñada para minimizar la frecuencia y el impacto de tales cambios, pero no hay mucho que Node.js pueda hacer actualmente para asegurar la estabilidad de las APIs de V8.

Las [Abstracciones Nativas para Node.js](https://github.com/nodejs/nan) (o `nan`) proporcionan un conjunto de herramientas recomendadas para ser utilizadas por los desarrolladores de Complementos, para mantener la compatibilidad entre versiones anteriores y futuras de V8 y Node.js. Vea los [ejemplos](https://github.com/nodejs/nan/tree/master/examples/) de `nan` para una ilustración de cómo se puede utilizar.

## N-API

> Estabilidad: 1 - Experimental

N-API es una API para construir Complementos nativos. It is independent from the underlying JavaScript runtime (e.g. V8) and is maintained as part of Node.js itself. Esta API será estable como Application Binary Interface (ABI) en versiones de Node.js. Está diseñado para aislar los Complementos de los cambios en el motor subyacente de JavaScript y permitir que los módulos compilados para una versión se ejecuten en versiones posteriores de Node.js sin recopilación. Los Complementos son construidos/empaquetados con el mismo enfoque/herramientas descritas en este documento (node-gyp, etc.). La única diferencia es el conjunto de APIs que son utilizadas por el código nativo. En lugar de utilizar el V8 o las APIs de [Abstracciones Nativas para Node.js](https://github.com/nodejs/nan), se utilizan las funciones disponibles en la N-API.

To use N-API in the above "Hello world" example, replace the content of `hello.cc` with the following. All other instructions remain the same.

```cpp
// hello.cc using N-API
#include <node_api.h>

namespace demo {

napi_value Method(napi_env env, napi_callback_info args) {
  napi_value greeting;
  napi_status status;

  status = napi_create_string_utf8(env, "hello", 6, &greeting);
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

Las funciones disponibles y cómo utilizarlas están documentadas en la sección titulada [C/C++ Addons - N-API](n-api.html).

## Ejemplos de Complemento

Los siguientes son algunos Complementos de ejemplo diseñados para ayudar a comenzar a los desarrolladores. Los ejemplos hacen uso de las APIs V8. Consulte la [referencia de V8](https://v8docs.nodesource.com/) en linea para obtener ayuda referente a las diferentes llamadas de V8, y la [Guía del Embebedor](https://github.com/v8/v8/wiki/Embedder's%20Guide) de V8 para ver una explicación sobre varios conceptos utilizados, tales como handles, ámbitos, plantillas de función, etc.

Cada uno de estos ejemplos utilizan el siguiente archivo `binding.gyp` :

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

En casos en los que haya más de un archivo `.cc`, simplemente agregue el nombre de archivo adicional al array de `sources` . Por ejemplo:

```json
"fuentes": ["addon.cc", "myexample.cc"]
```

Una vez que el archivo `binding.gyp` esté listo, los Complementos de ejemplo pueden ser configurados y construidos utilizando `node-gyp`:

```console
$ node-gyp configure build
```

### Argumentos de función

Los Complementos generalmente expondrán objetos y funciones que pueden ser accedidos desde JavaScript, ejecutándose dentro de Node.js. Cuando se invocan funciones desde JavaScript, los argumentos de entrada y el valor de devolución deben ser mapeados para y desde el código C/C++.

El siguiente ejemplo ilustra cómo leer argumentos de función pasados desde JavaScript y cómo devolver un resultado:

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

Una vez compilado, el Complemento de ejemplo puede ser requerido y utilizado desde dentro de Node.js:

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```

### Callbacks

Dentro de los Complementos, es una práctica común pasar funciones de JavaScript a una función de C++ y ejecutarlas desde allí. El siguiente ejemplo ilustra cómo invocar dichos callbacks:

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

Tenga en cuenta que este ejemplo utiliza una forma de dos argumentos de `Init()` que recibe completamente el objeto `module` como el segundo argumento. Esto permite que el Complemento reescriba completamente `exports` con una sóla función, en vez de añadir la función como una propiedad de `exports`.

Para probarlo, ejecute el siguiente JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

Tenga en cuenta que, en este ejemplo, la función de callback se invoca de manera sincrónica.

### Fábrica de objetos

Los complementos pueden crear y devolver objetos nuevos desde dentro de una función de C++, como se ilustra en el siguiente ejemplo. Se crea y se devuelve un objeto con una propiedad `msg` que hace eco en la string pasada a `createObject()`:

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

Para probarlo en JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```

### Fábrica de funciones

Otra posibilidad común es crear funciones de JavaScript que envuelvan funciones de C++ y las devuelvan a JavaScript:

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

Para probar:

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```

### Envolver objetos C++

También es posible envolver objetos/clases de C++ de manera que permita la creación de nuevas instancias mediante el uso del operador `new` de JavaScript:

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

Después, en `myobject.h`, la clase que envuelve hereda desde `node::ObjectWrap`:

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

En `myobject.cc`, implemente los métodos varios que deberán ser expuestos. A continuación, se expone el método `plusOne()` añadiéndolo al prototipo del contructor:

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
    // Invoked as plain function `MyObject(...)`, turn into construct call.
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

Para construir este ejemplo, el archivo `myobject.cc` debe ser agregado al `binding.gyp`:

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

Pruebelo con:

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

### Fábrica de objetos envueltos

Alternativamente, es posible utilizar un patrón Factory para evitar de manera explícita la creación de instancias de objetos utilizando el operador `new` de JavaScript:

```js
const obj = addon.createObject();
// instead of:
// const obj = new addon.Object();
```

Primero, se implementa el método `createObject()` en `addon.cc`:

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

En `myobject.h`, se añade el método estático `NewInstance()` para manejar la instanciación del objeto. Este método toma el lugar del uso de `new` en JavaScript:

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

La implementación en `myobject.cc` es similar al ejemplo anterior:

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
    // Invoked as plain function `MyObject(...)`, turn into construct call.
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

Una vez más, para construir este ejemplo, el archivo `myobject.cc` debe ser agregado al `binding.gyp`:

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

Pruebelo con:

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

### Pasar y distribuir objetos envueltos

Además de envolver y devolver objetos de C++, es posible pasar y distribuir objetos envueltos mediante el uso de la función de ayuda `node::ObjectWrap::Unwrap` de Node.js para desenvolverlos. Los siguientes ejemplos muestran una función `add()` que puede tomar dos objetos `MyObject` como argumentos de entrada:

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

En `myobject.h`, se agrega un nuevo método público para permitir el acceso a los valores privados después de desenvolver el objeto.

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

La implementación de `myobject.cc` es similar a la anterior:

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
    // Invoked as plain function `MyObject(...)`, turn into construct call.
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

Pruebelo con:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// Prints: 30
```

### Hooks de AtExit

Un hook de "AtExit" es una función que se invoca luego de que el bucle de eventos de Node.js haya finalizado, pero antes de que el VM de JavaScript haya terminado y se haya apagado Node.js. Los hooks de "AtExit" se registran utilizando la API `node::AtExit` .

#### void AtExit(callback, args)

* `callback` {void (*)(void*)} Un puntero dirigido hacia la función de llamar en la salida.
* `args` {void\*} Un puntero para pasar hacia la callback en la salida.

Registra los hooks de salida que se ejecutan luego de que el bucle de eventos ha finalizado pero antes de que el VM sea asesinado.

AtExit toma dos parámetros: un puntero dirigido hacia una función de callback para ejecutarse en la salida, y un puntero dirigido hacia datos de contexto no escritos para ser pasados a esa callback.

Las callbacks se ejecutan por orden de última entrada y primera salida.

El siguiente `addon.cc` implementa AtExit:

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

Pruébelo en JavaScript mediante la ejecución de:

```js
// test.js
require('./build/Release/addon');
```