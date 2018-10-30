# C++ 插件

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Node.js 插件是动态链接的共享对象，用 C++ 编写，可以使用 [`require()`](modules.html#modules_require) 函数加载到Node.js中，并象普通的 Node.js 模块一样使用。 它们主要用于在 Node.js 中运行 JavaScript 和 C++ 库之间提供接口。 

目前, 实现插件的方法相当复杂, 涉及到多个组件和 API 的知识：

* V8：Node.js 目前用于提供 JavaScript 实现的 C++ 库。 V8 提供了创建对象、调用函数等机制。 V8 的 API 主要记录在`v8.h` 的头文件中（Node.js 源代码中的 deps/v8/include/v8.h），也可以在查看 V8 的 [在线文档](https://v8docs.nodesource.com/)。

* [libuv](https://github.com/libuv/libuv)：实现了 Node.js 的事件循环、Worker线程、以及平台所有的的异步操作的 C 库。 它也是一个跨平台的抽象库，使所有主流操作系统中可以像 POSIX 一样轻松访问常用的系统任务，比如与文件系统、socket、定时器、以及系统事件的交互。 libuv 还提供了类似 pthreads 的线程抽象，可用于强化更复杂的需要超出标准事件循环的异步插件。 鼓励插件开发者思考如何在 libuv 的非阻塞系统操作、worker线程、或自定义的 libuv 线程中通过降低工作负载在 I/O 或者其他时间密集型任务中避免阻塞事件循环。

* 内置的 Node.js 库。 Node.js 自身开放了一些插件可以使用的 C++ API，其中最重要的是 `node::ObjectWrap` 类。

* Node.js 包含一些其他的静态链接库，如 OpenSSL。 这些库位于 Node.js 源代码中的 `deps/` 目录。 只有 libuv、V8和 zlib 符号是通过 Node.js 特意重新开放的，并且可以通过插件用于各种不同的场景。 更多信息可查看 [链接到 Node.js 自身的依赖](#addons_linking_to_node_js_own_dependencies) 。

下面所有的示例都可以 [下载](https://github.com/nodejs/node-addon-examples) ，并且可以作为学习插件开发的起点。

## Hello world

这个 "Hello world" 示例是一个简单的插件，用 C++ 编写，这等同于下面的 JavaScript 代码：

```js
module.exports.hello = () => 'world';
```

首先，创建文件 `hello.cc`：

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

注意，所有的 Node.js 插件必须导出一个如下模式的初始化函数：

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

`NODE_MODULE` 后面没有分号，因为它不是函数 (参见 `node.h`)。

`module_name` 必须匹配最终的二进制文件名 (不包括 `.node` 后缀)。

在 `hello.cc` 示例中，初始化函数是 `init` ，插件模块的名字是 `addon`。

### 构建

当源码编写完成后，就必然要编译成二进制 `addon.node` 文件。 为此，需要在项目的根目录创建一个名为 `binding.gyp` 的文件，它使用类似于JSON的格式描述模块的生成配置。 该文件会被 [node-gyp](https://github.com/nodejs/node-gyp)（专门为编译Node.js 插件而编写的工具） 使用。

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

Node.js 会捆绑发布一个版本的 `node-gyp` 工具作为 `npm` 的一部分。 该版本是不是直接给开发者使用的。它仅用于提供支持使用 `npm install` 命令编译和安装插件的能力。 希望直接使用 `node-gyp` 的开发者可以使用命令 `npm install -g node-gyp` 来安装它。 有关详细信息（包括平台的特定需求），请参阅 `node-gyp` 的 [安装说明](https://github.com/nodejs/node-gyp#installation)。

当 `binding.gyp` 文件创建后，可以使用 `node-gyp configure` 为当前平台生成相应的项目生成文件。 这将在 `build/` 目录生成文件 `Makefile`（在 Unix 平台上）或者 `vcxproj`（在 Windows 平台上）。

下一步，调用 `node-gyp build` 命令来生成以编译的 `addon.node` 文件。 它将被放进 `build/Release/` 目录。

当使用 `npm install` 安装 Node.js 插件时，npm 会使用自身捆绑的 `node-gyp` 版本执行同样一组动作，为用户要求的平台生成一个编译后的版本。

构建完成后，二进制插件就可以在Node.js中使用，通过 [`require()`](modules.html#modules_require) 来指向构建后的 `addon.node` 模块。

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

有关进一步的信息，请查看下面的例子，或者访问 <https://github.com/arturadib/node-qt> 了解生成环境中的示例。

因为编译二进制插件的确切路径取决于它如何被编译（例如，有时可能在 `./build/Debug/`中），因此插件可以使用 [bindings](https://github.com/TooTallNate/node-bindings) 包来加载编译后的模块。

注意，虽然 `bindings` 包在如何定位插件模块的实现上非常复杂，但是它的本质上是使用类似于下面的 try-catch 模式：

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### 链接到 Node.js 自身的依赖

Node.js 使用了许多静态链接库，如 V8、libuv 和 OpenSSL。 所有的插件都需要链接到 V8 ，也可能链接到其他任何依赖项。 通常，这只需要简单的包含适当的 `#include <...>` 声明 (例如 `#include <v8.h>`) ，`node-gyp` 则会自动定位到相应的头文件。 但是，还有一些事项需要注意：

* 当 `node-gyp` 运行时，它会检查特定的 Node.js 发行版本，并且下载完整的源代码的 tar 包或者只是头文件。 如果下载了完整的源代码，插件将有完全访问全套 Node.js 依赖的权限。 然而，如果只是下载了 Node.js 的头文件，则只能访问 Node.js 导出的符号。

* 可以使用指向本地 Node.js 源镜像的 `--nodedir` 标记运行 `node-gyp` 。 如果使用该选项，则插件将拥有全套依赖的访问权限。

### 使用 require() 加载插件

已编译的插件二进制文件名的扩展名为 `.node`（与之相反的是 `.dll` 或 `.so`）。 编写 [`require()`](modules.html#modules_require) 函数是为了查找具有 `.node` 文件扩展名的文件，并将它们初始化为动态链接库。

当调用 [`require()`](modules.html#modules_require) 函数时，`.node` 扩展名通常可以被省略，Node.js仍然会找到并初始化插件。 但有一点需要注意，Node.js将首先尝试定位和加载碰巧共享相同基本名称的模块或JavaScript文件。 例如，如果有一个文件 `addon.js` 与二进制文件 `addon.node` 在同一个目录中，那么 [`require('addon')`](modules.html#modules_require) 将优先考虑 `addon.js` 文件并加载它。

## Node.js 原生模块抽象接口

本文档中的每个示例都直接使用Node.js和V8 API来实现插件。 重要的是要了解V8 API可以并且已经从一个V8版本发展到下一版本而且发生了巨大变化（并将一个主要的Node.js发布到下一版本）。 每次版本更改时，插件可能需要更新和重新编译才能继续运行。 Node.js发布计划旨在最大限度地减少此类更改的频率和影响，但Node.js目前几乎没有能力确保V8 API的稳定性。

[Node.js 原生模块抽象接口](https://github.com/nodejs/nan) (或 `nan`) 提供了一组建议插件开发者使用的工具，以保持V8和Node.js新旧版本的兼容性。 有关如何使用的说明，请参见 `nan` [示例](https://github.com/nodejs/nan/tree/master/examples/)。

## N-API

> 稳定性: 1-实验

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

以下是一些旨在帮助开发人员入门的插件示例。 这些示例使用了 V8 API。 有关各种 V8 调用的帮助，请参阅在线 [V8 参考](https://v8docs.nodesource.com/)，关于对句柄，作用域，函数模板等概念的介绍，请参阅V8 的 [嵌入式指南](https://github.com/v8/v8/wiki/Embedder's%20Guide)。

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

在有多个 `.cc` 文件的情况下，只需将额外的文件名添加到 `sources` 数组中：

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

### C++对象包装

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

### AtExit 钩子

`AtExit` 钩子是一个函数，它在 Node.js 事件循环结束后，但在 JavaScript 虚拟机被终止与 Node.js 关闭前被调用。 `AtExit` 钩子使用 `node::AtExit` API注册。

#### void AtExit(callback, args)

* `callback` <span class="type">&lt;void (\<em>)(void\</em>)&gt;</span> 一个指向退出时要调用的函数的指针
* `args` <span class="type">&lt;void\*&gt;</span> 一个退出时传递给回调函数的指针。

Registers exit hooks that run after the event loop has ended but before the VM is killed.

`AtExit` 有两个参数：一个退出时要运行的回调函数的指针，和一个要传入回调函数的无类型的上下文数据的指针。

回调函数按照后进先出的顺序运行。

以下 `addon.cc` 实现了 `AtExit`：

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

通过运行如下语句在 JavaScript 中测试：

```js
// test.js
require('./build/Release/addon');
```