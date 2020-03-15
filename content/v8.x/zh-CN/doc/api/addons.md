# C++插件

<!--introduced_in=v0.10.0-->

Node.js插件是用C++编写的动态链接的共享对象，可以通过使用[`require()`](modules.html#modules_require)函数加载到Node.js，可以像普通Node.js模块一样使用这些插件。 它们主要被用于提供一个在Node.js中运行的JavaScript和C/C++库之间的接口。

目前，实现插件的方法相当复杂，涉及到多个组件和API的知识：

 - V8: 为了提供JavaScript的实现，目前Node.js使用的C++库。 V8提供了创建对象、调用函数等机制。 V8 API的说明主要在`v8.h`头文件(在Node.js源代码中的`deps/v8/include/v8.h`)中，该文件也可[在线访问](https://v8docs.nodesource.com/)。

 - [libuv](https://github.com/libuv/libuv): 实现了Node.js事件循环、worker线程、以及平台的所有异步行为的C库。 它同时也是一个跨平台的抽象库，使得在所有主流操作系统中，就像POSIX一样，可以轻松的访问许多常见的系统任务，比如：和文件系统的交互、sockets、定时器、和系统事件等。 libuv还提供了和pthreads类似的线程抽象，它可以用来支持那些在标准事件循环之上的更复杂的异步插件。 插件作者们被鼓励思考如何避免因为I/O操作或其他耗时任务而导致的事件循环阻塞，要解决这个问题，可以通过使用libuv来将任务转换为非阻塞系统操作、worker线程、或自定义的libuv线程。

 - Node.js的内置库。 Node.js 自身开放了一些插件可以使用的 C++ API &mdash; 其中最重要的是 `node::ObjectWrap` 类。

 - Node.js包含了一些其他的静态链接库，比如OpenSSL。 这些库位于Node.js源代码中的`deps/`目录中。 只有 libuv、V8和 zlib 符号是通过 Node.js 特意重新开放的，并且可以通过插件用于各种不同的场景。 请参阅[链接到Node.js自身依赖库](#addons_linking_to_node_js_own_dependencies)以获取更多信息。

下面的所有示例都可[下载](https://github.com/nodejs/node-addon-examples)，且可被用于插件开发的起点。

## Hello world

这个"Hello world"示例是一个用C++编写的简单插件，其功能等同于如下的JavaScript代码：

```js
module.exports.hello = () => 'world';
```

首先，创建文件`hello.cc`:

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

注意，所有的Node.js插件都必须导出一个如下模式的初始化函数：

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

由于`NODE_MODULE`不是一个函数（请参阅`node.h`），因此在其后面没有分号。

`module_name`必须和最终的二进制文件名 (不包含.node后缀) 相匹配。

在`hello.cc`示例中，初始化函数为`init`，而插件模块名为`addon`。

### 构建

当源代码编写完后，它必须被编译为二进制的`addon.node`文件。 为了实现这个目标，在项目的根目录中创建一个类似JSON格式的文件`binding.gyp`，该文件中包含模块的构建配置信息。 该文件会被 [node-gyp](https://github.com/nodejs/node-gyp)（专门为编译Node.js 插件而编写的工具） 使用。

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

*注意*：作为`npm`的一部分，`node-gyp`工具的一个版本会和Node.js一起捆绑发布。 此版本并不是给开发者直接使用的，而是仅用于支持`npm install`命令来编译和安装插件的。 想要直接使用`node-gyp`的开发者可以通过使用命令`npm install -g node-gyp`来安装它。 请查阅`node-gyp` [安装说明](https://github.com/nodejs/node-gyp#installation)来获取更多信息，包括特定平台的要求。

一旦`binding.gyp`文件被创建，使用`node-gyp configure`命令在当前平台中生成相应的项目构建文件。 这会生成一个`Makefile` (在Unix平台)，或 `build/`目录中的`vcxproj` (在Windows中)。

接下来，调用`node-gyp build`命令来生成并编译`addon.node`文件。 它将被放置到`build/Release/`目录中。

当使用`npm install`安装Node.js插件时，npm使用它自己捆绑的`node-gyp`来执行相同操作，从而为用户要求的平台生成编译后的版本。

一旦构建，就可以通过将[`require()`](modules.html#modules_require)指向`addon.node`模块，从而在Node.js中使用二进制的插件。

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

请查看如下示例来获取更多信息，或者参阅<https://github.com/arturadib/node-qt>来查看生产环境中的示例。

由于编译后插件二进制文件的路径会有所不同，这取决于插件是如何被编译的 (例如：有时它会在`./build/Debug/`)，插件可以使用[bindings](https://github.com/TooTallNate/node-bindings)包来加载编译后的模块。

注意，`bindings`包的实现在如何定位插件模块时会更复杂，实际上它在使用类似的try-catch模式：

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### 链接到Node.js自己的依赖库

Node.js使用一定数量的诸如V8，libuv，和OpenSSL的静态链接库。 所有的插件必须要链接到V8，并且可以链接到其他的依赖库。 通常，这非常简单，只需要包含适当的`#include <...>`语句 (例如：`#include <v8.h>`)，`node-gyp`会自动定位相应的头文件。 然而，仍有一些事项需要注意：

* 当`node-gyp`运行时，它会检查特定的Node.js发行版本，并下载全部源代码的tarball压缩文件或者只是头文件。 如果下载了全部源代码，插件就可以完全访问Node.js的依赖库。 然而，如果只是下载了Node.js的头文件，那么只有被Node.js导出的符号才能被访问。

* 运行`node-gyp`时可以使用`--nodedir`标志来指向本地的Node.js源镜像。 使用这个选项，插件可以访问全部的依赖库。

### 使用require() 加载插件

已编译的插件二进制文件的扩展名为`.node` (与之相对的是`.dll` 或 `.so`)。 编写[`require()`](modules.html#modules_require)函数的目的就是查找具有`.node`扩展名的文件，并将其初始化为动态链接库。

当调用[`require()`](modules.html#modules_require)时，通常可以省略`.node`扩展名，Node.js仍可找到并初始化插件。 但有一点需要注意，Node.js会首先尝试定位并加载那些享有相同基本名称的JavaScript文件。 例如：如果文件`addon.js`和二进制文件`addon.node`在同一个目录下，那么[`require('addon')`](modules.html#modules_require)会优先考虑`addon.js`文件并加载它。

## Node.js原生模块抽象接口

本文档中的所有示例都直接使用Node.js和V8 API来实现插件。 因此重要的一点就是要理解V8 API可以并曾经从一个V8版本到下一个版本中间发生了巨大的变化（同样从一个主要的Node.js版本到下一个版本）。 每次版本更改时，插件可能需要更新和重新编译才能继续运行。 Node.js发布计划旨在最大限度地减少此类更改的频率和影响，但Node.js目前几乎没有能力确保V8 API的稳定性。

[Node.js 原生模块抽象接口](https://github.com/nodejs/nan) (或 `nan`) 提供了一组建议插件开发者使用的工具，以保持V8和Node.js新旧版本的兼容性。 有关如何使用的说明，请参见 `nan` [示例](https://github.com/nodejs/nan/tree/master/examples/)。


## N-API

> 稳定性：1 - 实验中

N-API是构建原生插件的API。 它独立于底层JavaScript运行时（例如，V8），并作为Node.js本身的一部分进行维护。 此API将是稳定的跨Node.js版本的应用程序二进制接口（ABI）。 它旨在将插件与底层JavaScript引擎中的更改隔离开来，并允许为一个版本编译的模块在更新版本的Node.js上运行而无需重新编译。 插件是使用本文档中概述的相同方法/工具（node-gyp等）构建/打包的。 唯一的区别是原生代码使用的API集。 不使用V8或 [Node.js 原生模块抽象接口](https://github.com/nodejs/nan)，而是使用N-API中可用的函数。

在上述“Hello World”示例中使用N-API，替换 `hello.cc` 中的内容如下。 所有其它说明保持不变。

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

可用的函数和如何使用它们被记录在标题为 [C/C++ 插件 - N-API](n-api.html) 的部分中。

## 插件示例

如下是一些旨在帮助开发人员入门的插件示例。 这些示例使用了V8 API。 有关各种 V8 调用的帮助，请参阅在线 [V8 参考](https://v8docs.nodesource.com/)，关于对句柄，作用域，函数模板等概念的介绍，请参阅V8 的 [嵌入式指南](https://github.com/v8/v8/wiki/Embedder's%20Guide)。

这些示例都使用以下 `binding.gyp` 文件：

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

在有多个 `.cc` 文件的情况下，只需将额外的文件名添加到 `sources` 数组中： 例如：

```json
"sources": ["addon.cc", "myexample.cc"]
```

一旦 `binding.gyp` 文件准备就绪，就可以使用 `node-gyp` 配置和构建示例插件：

```console
$ node-gyp configure build
```


### 函数参数

插件通常会公开可以从Node.js中运行的JavaScript访问的对象和函数。 当从 JavaScript 调用函数时，输入参数必须映射到 C/C++代码，返回值必须从 C/C++代码映射到 JavaScript。

以下示例说明如何读取从JavaScript传递的函数参数以及如何返回结果：

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

编译完成后，可以从Node.js中获取并使用示例插件：

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```


### 回调函数

将JavaScript函数传递给C++函数并从中执行它们是插件中常见的做法。 以下示例说明了如何调用此类回调函数：

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

请注意，此示例使用两参数形式的 `Init()`，使用收到的完整 `module` 对象作为第二个参数。 这允许插件使用单个函数完全覆盖 `exports`，而不是将函数添加为 `exports` 的一个属性。

要测试它，请运行以下JavaScript：

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

请注意，在此示例中，回调函数是被同步调用的。

### 对象工厂

插件可以在C++函数中创建和返回新对象，如以下示例所示。 创建一个对象，并返回一个 `msg` 属性，它与传递给 `createObject()` 的字符串相呼应：

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

在JavaScript中测试它：

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```


### 函数工厂

另一个常见的场景是创建包装C++函数并将其返回给JavaScript的JavaScript函数：

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

测试：

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```


### 包装C++对象

也可以以允许使用JavaScript `new` 运算符创建新实例的方式包装C++对象/类：

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

然后，在 `myobject.h` 头文件中，包装类从 `node::ObjectWrap` 中继承：

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

在 `myobject.cc` 中，可以实现各种想要暴露给JavaScript的方法。 如下所示，`plusOne()` 通过将其添加到构造函数的原型中来暴露：

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

要构建这个示例，`myobject.cc` 文件必须被添加到 `binding.gyp` 中：

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

测试它：

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

### 包装对象工厂

或者，可以使用工厂模式来避免使用JavaScript的 `new` 运算符显式创建对象实例：

```js
const obj = addon.createObject();
// instead of:
// const obj = new addon.Object();
```

首先，在 `addon.cc` 中实现 `createObject()` 方法：

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

在 `myobject.h` 中，静态方法 `NewInstance()` 被添加，它用来实例化对象。 这个方法用来取代JavaScript中的`new`操作符：

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

`myobject.cc`的实现和之前示例类似：

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

再强调一次，要想构建这个示例，`myobject.cc` 文件必须要被添加到 `binding.gyp` 中：

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

测试它：

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


### 传递包装的对象

除了包装和返回C++对象以外，可以通过使用Node.js帮助函数 （`node::ObjectWrap::Unwrap`）解包装它们来传递包装的对象。 下面的示例展示了 `add()` 函数，它可以获取两个 `MyObject` 对象作为输入参数：

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

在 `myobject.h` 头文件中， 添加了一个新的公共类型方法，以允许在解包装对象后访问私有类型的值。

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

对 `myobject.cc` 的实现和之前的示例类似：

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

测试它：

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// Prints: 30
```

### AtExit钩子

AtExit 钩子是一个函数，它在 Node.js 事件循环结束后，但在 JavaScript 虚拟机被终止与 Node.js 关闭前被调用。 AtExit 钩子使用 `node::AtExit` API注册。

#### void AtExit(callback, args)

* `callback` {void (\*)(void\*)} A pointer to the function to call at exit.
* `args` {void\*} 一个在退出时要传递给回调函数的指针。

注册在事件循环结束后但在虚拟机被关闭之前运行的退出钩子函数。

AtExit 有两个参数：一个退出时要运行的回调函数的指针，和一个要传入回调函数的无类型的上下文数据的指针。

回调函数按照后进先出的顺序运行。

如下的`addon.cc`实现了AtExit：

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

通过运行如下语句在JavaScript中测试：

```js
// test.js
require('./build/Release/addon');
```
