# Thành phần mở rộng C++

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Addons are dynamically-linked shared objects written in C++. The [`require()`](modules.html#modules_require_id) function can load Addons as ordinary Node.js modules. Addons provide an interface between JavaScript and C/C++ libraries.

There are three options for implementing Addons: N-API, nan, or direct use of internal V8, libuv and Node.js libraries. Unless you need direct access to functionality which is not exposed by N-API, use N-API. Refer to [C/C++ Addons with N-API](n-api.html) for more information on N-API.

When not using N-API, implementing Addons is complicated, involving knowledge of several components and APIs:

* V8: Hiện Node.js sử dụng thư viện C++ để cung cấp việc cài đặt JavaScript. V8 còn cung cấp khả năng tạo ra các đối tượng được gọi là các hàm. API của V8 chủ yếu được ghi lại trong tiêu đề tập tin `v8.h` (`deps/v8/include/v8.h` trong bộ nguồn của Node.js), V8 cũng có sẵn trên [tài liệu trực tuyến](https://v8docs.nodesource.com/).

* [libuv](https://github.com/libuv/libuv): Thư viện C bao gồm các công việc thực thi vòng lặp sự kiện của Node.js, các luồng và hành vi không đồng bộ trong cùng nền tảng. It also serves as a cross-platform abstraction library, giving easy, POSIX-like access across all major operating systems to many common system tasks, such as interacting with the filesystem, sockets, timers, and system events. libuv còn cung cấp luồng trừu tượng giống như pthreads, dành cho việc tăng cường sức mạnh cho thành phần bổ sung không đồng bộ ngày càng phức tạp và cần vượt qua vòng lặp sự kiện tiêu chuẩn. Các nhà phát triển thành phần mở rộng được khuyến khích làm sao tránh việc chặn vòng lặp sự kiện với dữ liệu nhập xuất (I/O) hoặc giảm thiểu khối lượng công việc thông qua libuv bằng cách giảm các nhiệm vụ tiêu hao thời gian cho các hệ thống điều hành không bị chặn, các luồng ngầm hoặc các luồng tùy chỉnh của libuv.

* Thư viện Node.js nội bộ. Node.js itself exports C++ APIs that Addons can use, the most important of which is the `node::ObjectWrap` class.

* Node.js includes other statically linked libraries including OpenSSL. These other libraries are located in the `deps/` directory in the Node.js source tree. Only the libuv, OpenSSL, V8 and zlib symbols are purposefully re-exported by Node.js and may be used to various extents by Addons. See [Linking to Node.js' own dependencies](#addons_linking_to_node_js_own_dependencies) for additional information.

All of the following examples are available for [download](https://github.com/nodejs/node-addon-examples) and may be used as the starting-point for an Addon.

## Hello world

Ví dụ "Hello world" này là một phần mở rộng đơn giản, được viết bằng C++ và tương đương với đoạn mã JavaScript sau đây:

```js
module.exports.hello = () => 'world';
```

Đầu tiên, tạo tệp `hello.cc`:

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

All Node.js Addons must export an initialization function following the pattern:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

Phía sau `NODE_MODULE` không có dấu chấm phẩy, vì nó không phải là một hàm (xem `node.h`).

The `module_name` must match the filename of the final binary (excluding the `.node` suffix).

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

* defining a class which will hold per-addon-instance data. Such a class should include a `v8::Global<v8::Object>` which will hold a weak reference to the addon's `exports` object. The callback associated with the weak reference will then destroy the instance of the class.
* constructing an instance of this class in the addon initializer such that the `v8::Global<v8::Object>` is set to the `exports` object.
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

  // Per-addon data.
  int call_count;

 private:
  // Method to call when "exports" is about to be garbage-collected.
  static void DeleteMe(const WeakCallbackInfo<AddonData>& info) {
    delete info.GetParameter();
  }

  // Weak handle to the "exports" object. An instance of this class will be
  // destroyed along with the exports object to which it is weakly bound.
  v8::Global<v8::Object> exports_;
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

#### Worker support

In order to be loaded from multiple Node.js environments, such as a main thread and a Worker thread, an add-on needs to either:

* Be an N-API addon, or
* Be declared as context-aware using `NODE_MODULE_INIT()` as described above

In order to support [`Worker`][] threads, addons need to clean up any resources they may have allocated when such a thread exists. This can be achieved through the usage of the `AddEnvironmentCleanupHook()` function:

```c++
void AddEnvironmentCleanupHook(v8::Isolate* isolate,
                               void (*fun)(void* arg),
                               void* arg);
```

This function adds a hook that will run before a given Node.js instance shuts down. If necessary, such hooks can be removed using `RemoveEnvironmentCleanupHook()` before they are run, which has the same signature. Hàm callback được chạy theo trình tự vào sau ra trước.

The following `addon.cc` uses `AddEnvironmentCleanupHook`:

```cpp
// addon.cc
#include <assert.h>
#include <stdlib.h>
#include <node.h>

using node::AddEnvironmentCleanupHook;
using v8::HandleScope;
using v8::Isolate;
using v8::Local;
using v8::Object;

// Note: In a real-world application, do not rely on static/global data.
static char cookie[] = "yum yum";
static int cleanup_cb1_called = 0;
static int cleanup_cb2_called = 0;

static void cleanup_cb1(void* arg) {
  Isolate* isolate = static_cast<Isolate*>(arg);
  HandleScope scope(isolate);
  Local<Object> obj = Object::New(isolate);
  assert(!obj.IsEmpty());  // assert VM is still alive
  assert(obj->IsObject());
  cleanup_cb1_called++;
}

static void cleanup_cb2(void* arg) {
  assert(arg == static_cast<void*>(cookie));
  cleanup_cb2_called++;
}

static void sanity_check(void*) {
  assert(cleanup_cb1_called == 1);
  assert(cleanup_cb2_called == 1);
}

// Initialize this addon to be context-aware.
NODE_MODULE_INIT(/* exports, module, context */) {
  Isolate* isolate = context->GetIsolate();

  AddEnvironmentCleanupHook(isolate, sanity_check, nullptr);
  AddEnvironmentCleanupHook(isolate, cleanup_cb2, cookie);
  AddEnvironmentCleanupHook(isolate, cleanup_cb1, isolate);
}
```

Kiểm tra trong JavaScript bằng cách chạy:

```js
// test.js
require('./build/Release/addon');
```

### Xây dựng hoàn thiện

Một khi mã nguồn được viết ra, nó cần được biên soạn thành tập tin nhị phân `addon.node`. To do so, create a file called `binding.gyp` in the top-level of the project describing the build configuration of the module using a JSON-like format. Tập tin này được sử dụng bởi [node-gyp](https://github.com/nodejs/node-gyp) — đây là một công cụ dành riêng cho việc biên soạn thành phần mở rộng của Node.js.

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

A version of the `node-gyp` utility is bundled and distributed with Node.js as part of `npm`. Các nhà phát triển không thể trực tiếp sử dụng phiên bản này mà chỉ dùng cho việc hỗ trợ khả năng sử dụng lệnh `npm install` cho việc biên soạn và thiết đặt thành phần mở rộng. Nếu họ muốn sử dụng trực tiếp `node-gyp` cần phải sử dụng câu lệnh `npm install -g node-gyp`. Để biết thêm thông tin [hướng dẫn cài đặt](https://github.com/nodejs/node-gyp#installation) (bao gồm các yêu cầu cụ thể của nền tảng), vui lòng tham khảo thêm `node-gyp`.

Sau khi tạo xong tệp tin `binding.gyp`, có thể sử dụng `node-gyp configure` để tạo tệp xây dựng dự án phù hợp với nền tảng hiện tại. Điều này sẽ giúp tạo ra tệp `Makefile` (trên nền tảng Unix) hoặc `vcxproj` (trên Windows) trong thư mục `build/`.

Tiếp theo, sử dụng lệnh `node-gyp build` để tạo ra tệp `addon.node` đã được biên soạn. This will be put into the `build/Release/` directory.

Khi sử dụng `npm install` để cài đặt phần mở rộng cho Node.js, npm sẽ sử dụng riêng phiên bản đã được gói lại `node-gyp` để thống nhất các thao tác, giúp người dùng có được thành phần mở rộng với phiên bản đã được biên soạn theo yêu cầu.

Once built, the binary Addon can be used from within Node.js by pointing [`require()`](modules.html#modules_require_id) to the built `addon.node` module:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

Bởi vì đường dẫn chính xác tới phần mở rộng nhị phân có thể thay đổi tùy theo việc nó được biên soạn như thế nào (ví dụ: có khi được đặt trong `./build/Debug/`), vậy nên các thành phần mở rộng có thể dùng gói [bindings](https://github.com/TooTallNate/node-bindings) để nạp các mô-đun đã qua biên soạn.

While the `bindings` package implementation is more sophisticated in how it locates Addon modules, it is essentially using a `try…catch` pattern similar to:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Liên kết tới các thành phần bắt buộc của Node.js

Node.js uses statically linked libraries such as V8, libuv and OpenSSL. All Addons are required to link to V8 and may link to any of the other dependencies as well. Typically, this is as simple as including the appropriate `#include <...>` statements (e.g. `#include <v8.h>`) and `node-gyp` will locate the appropriate headers automatically. However, there are a few caveats to be aware of:

* Khi chạy `node-gyp`, nó sẽ phát hiện bản phát hành cụ thể của Node.js và tải về tệp lưu trữ mã nguồn chung tarball hoặc chỉ các tiêu đề. Nếu toàn bộ mã nguồn được tải về, thành phần mở rộng sẽ có khả năng truy cập hoàn toàn tới thành phần bắt buộc của Node.js. Tuy nhiên, nếu chỉ tải về các tiêu đề, chỉ có thể dẫn tới các biểu tượng do Node.js truy xuất.

* `node-gyp` có thể sử dụng `--nodedir` trỏ đến nguồn ảnh trong Node.js. Bằng cách này, phần mở rộng có thể truy cập tới toàn bộ thành phần bắt buộc.

### Loading Addons using `require()`

Tên đuôi tệp tin của thành phần mở rộng là `.node`( trái ngược với to `.dll` hoặc `.so`). The [`require()`](modules.html#modules_require_id) function is written to look for files with the `.node` file extension and initialize those as dynamically-linked libraries.

When calling [`require()`](modules.html#modules_require_id), the `.node` extension can usually be omitted and Node.js will still find and initialize the Addon. Cảnh báo trước, tuy nhiên, Node.js sẽ thử xác định vị trí và nạp các mô-đun trước hoặc các tệp JavaScript có thể chia sẻ tên cơ sở giống nhau. For instance, if there is a file `addon.js` in the same directory as the binary `addon.node`, then [`require('addon')`](modules.html#modules_require_id) will give precedence to the `addon.js` file and load it instead.

## Các lớp trừu tượng gốc cho Node.js

Mỗi ví dụ minh họa trong tài liệu này được sử dụng trực tiếp cho việc thiết lập các thành phần mở rộng bởi Node.js và các API V8. The V8 API can, and has, changed dramatically from one V8 release to the next (and one major Node.js release to the next). With each change, Addons may need to be updated and recompiled in order to continue functioning. The Node.js release schedule is designed to minimize the frequency and impact of such changes but there is little that Node.js can do currently to ensure stability of the V8 APIs.

Các [trừu tượng gốc dành cho Node.js](https://github.com/nodejs/nan) (hoặc `nan`) cung cấp một bộ công cụ được khuyến khích cho các nhà lập trình thành phần mở rộng sử dụng để giữ khả năng tương thích của các bản phát hành của V8 và Node.js trong quá khứ và tương lai. Xem thêm các [ví dụ](https://github.com/nodejs/nan/tree/master/examples/) minh họa về `nan` để biết thêm ứng dụng của nó.

## N-API

> Tính ổn định: 2 - Stable

N-API là một API dùng để xây dựng thành phần mở rộng gốc. It is independent from the underlying JavaScript runtime (e.g. V8) and is maintained as part of Node.js itself. This API will be Application Binary Interface (ABI) stable across versions of Node.js. Nó được định hướng nhằm tách biệt thành phần mở rộng đối với các sự thay đổi trong bộ máy JavaScript cơ bản và cho phép các mô-đun được biên soạn một phiên bản có khả năng chạy trên các bản khác nhau của Node.js mà không cần sự biên soạn lại. Thành phần mở rộng được xây dựng/đóng gói với cùng cách tiếp cập/các công cụ được nêu trong tài liệu này (node-gyp, etc.). Điểm khác biệt duy nhất là bộ API được sử dụng bởi mã gốc. Thay vì sử dụng V8 hoặc các API của [các trừu tượng gốc cho Node.js](https://github.com/nodejs/nan), có thể sử dụng các hàm có sẵn của N-API.

Creating and maintaining an addon that benefits from the ABI stability provided by N-API carries with it certain [implementation considerations](n-api.html#n_api_implications_of_abi_stability).

To use N-API in the above "Hello world" example, replace the content of `hello.cc` with the following. Các hướng dẫn khác vẫn giống như vậy.

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

The functions available and how to use them are documented in [C/C++ Addons with N-API](n-api.html).

## Các ví dụ thành phần mở rộng

Sau đây là các ví dụ về thành phần mở rộng nhằm giúp các nhà phát triển bắt đầu. Các ứng dụng sử dụng các API V8. Xem thêm phần [tham khảo về V8](https://v8docs.nodesource.com/) trực tuyến để hiểu thêm các cách gọi khác nhau của V8, và [hướng dẫn trình nhúng](https://github.com/v8/v8/wiki/Embedder's%20Guide) của V8 để giải thích cho các khái niệm được sử dụng như: con trỏ, phạm vi và các mẫu hàm,v.v..

Mỗi một ví dụ sau đây sử dụng tệp tin `binding.gyp`:

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
"sources": ["addon.cc", "myexample.cc"]
```

Khi tập tin `binding.gyp` đã sẵn sàng, các ví dụ thành phần mở rộng có thể được cấu hình và xây dựng sử dụng `node-gyp`:

```console
$ node-gyp configure build
```

### Đối số của hàm

Thành phần mở rộng sẽ khiến các đối tượng và hàm bị trưng ra và được truy cập từ JavaScript khi đang chạy trong Node.js. Khi các hàm được gọi ra từ JavaScript, các đối số đầu vào và giá trị trả về phải được liên kết tới và từ mã C/C++.

Ví dụ sau đây minh họa các đọc hàm đối số được chuyển qua từ JavaScript và cách trả kết quả:

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

Khi đã được biên soạn, ví dụ thành phần mở rộng có thể được yêu cầu và sử dụng bên trong Node.js:

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```

### Hàm callbacks

Đây là một quy trình thông thường trong thành phần mở rộng nhằm chuyển các hàm JavaScript qua hàm C++ và thực thi chúng từ đây. Ví dụ minh họa sau đây giới thiệu cách thực hiện callbacks như vậy:

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

This example uses a two-argument form of `Init()` that receives the full `module` object as the second argument. This allows the Addon to completely overwrite `exports` with a single function instead of adding the function as a property of `exports`.

Để kiểm tra, chạy trình JavaScript sau đây:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

In this example, the callback function is invoked synchronously.

### Sản xuất đối tượng

Các thành phần mở rộng được tạo và trả về các đối tượng mới trong phạm vi hàm C++ như trong ví dụ minh họa dưới đây. Một đối tượng với thuộc tính `msg` thông qua việc tạo và trả về sẽ lặp lại chuỗi và chuyển qua `createObject()`:

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

Để kiểm tra trong JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```

### Sản xuất hàm

Một kịch bản phổ biến khác là việc tạo ra các hàm JavaScript có khả năng bao bọc các hàm C++ và trả chúng về lại JavaScript:

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

Để kiểm tra lại:

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```

### Bao bọc các đối tượng C++

Các đối tượng/lớp của C++ cũng có thể được bọc mà các thể hiện được tạo ra sử dụng toán tử `new` của JavaScript:

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

Sau đó, trong `myobject.h`, lớp bọc di truyền từ `node::ObjectWrap`:

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

  double value_;
};

}  // namespace demo

#endif
```

Trong `myobject.cc`, các phương thức khác nhau được thực hiện để tiếp xúc với nhau. Dưới đây là phương thức `plusOne()` được hiển thị bằng việc thêm nó vào nguyên mẫu của hàm tạo:

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
using v8::ObjectTemplate;
using v8::String;
using v8::Value;

MyObject::MyObject(double value) : value_(value) {
}

MyObject::~MyObject() {
}

void MyObject::Init(Local<Object> exports) {
  Isolate* isolate = exports->GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  Local<ObjectTemplate> addon_data_tpl = ObjectTemplate::New(isolate);
  addon_data_tpl->SetInternalFieldCount(1);  // 1 field for the MyObject::New()
  Local<Object> addon_data =
      addon_data_tpl->NewInstance(context).ToLocalChecked();

  // Prepare constructor template
  Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New, addon_data);
  tpl->SetClassName(String::NewFromUtf8(
      isolate, "MyObject", NewStringType::kNormal).ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  Local<Function> constructor = tpl->GetFunction(context).ToLocalChecked();
  addon_data->SetInternalField(0, constructor);
  exports->Set(context, String::NewFromUtf8(
      isolate, "MyObject", NewStringType::kNormal).ToLocalChecked(),
               constructor).FromJust();
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
    Local<Function> cons =
        args.Data().As<Object>()->GetInternalField(0).As<Function>();
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

Để xây dựng ví dụ này, tập tin `myobject.cc` phải được thêm vào `binding.gyp`:

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

Kiểm tra nó với:

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

### Sản xuất của các đối tượng được bọc

Ngoài ra, có thể sử dụng nhà máy tạo thực thể để tránh việc trực tiếp tạo ra các thực thể đối tượng sử dụng hàm toán tử `new` trong JavaScript:

```js
const obj = addon.createObject();
// instead of:
// const obj = new addon.Object();
```

Đầu tiên, phương thức `createObject()` được thiết đặc trong `addon.cc`:

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

Trong `myobject.h`, phương thức tĩnh `NewInstance()` được thêm vào nhằm kiểm soát việc khởi tạo đối tượng mới. Phương thức này sử dụng `new` trong JavaScript:

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
  static v8::Global<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```

Việc thực hiện `myobject.cc` tương tự như trong ví dụ trước:

```cpp
// myobject.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using node::AddEnvironmentCleanupHook;
using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Global;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Number;
using v8::Object;
using v8::String;
using v8::Value;

// Warning! This is not thread-safe, this addon cannot be used for worker
// threads.
Global<Function> MyObject::constructor;

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

  AddEnvironmentCleanupHook(isolate, [](void*) {
    constructor.Reset();
  }, nullptr);
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

Một lần nữa, để xây dựng ví dụ này, tập tin `myobject.cc` phải được thêm vào `binding.gyp`:

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

Kiểm tra nó với:

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

### Truyền vào các đối tượng trình bao bọc

Bổ sung thêm cho bao bọc và trả về các đối tượng C++, nó còn có thể truyền vào các đối tượng đã được bao bọc bằng cách gỡ chúng với hàm trợ giúp sau của Node.js `node::ObjectWrap::Unwrap`. Các ví dụ tiếp theo cho thấy hàm `add()` có thể lấy 2 đối tượng `MyObject` như những đối số của đầu vào:

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

Trong `myobject.h`, để cho phép truy cập các giá trị riêng sau khi gỡ bọc đối tượng cần thêm một phương thức công cộng mới.

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
  static v8::Global<v8::Function> constructor;
  double value_;
};

}  // namespace demo

#endif
```

Việc thực hiện `myobject.cc` tương tự như trong ví dụ trước:

```cpp
// myobject.cc
#include <node.h>
#include "myobject.h"

namespace demo {

using node::AddEnvironmentCleanupHook;
using v8::Context;
using v8::Function;
using v8::FunctionCallbackInfo;
using v8::FunctionTemplate;
using v8::Global;
using v8::Isolate;
using v8::Local;
using v8::NewStringType;
using v8::Object;
using v8::String;
using v8::Value;

// Warning! This is not thread-safe, this addon cannot be used for worker
// threads.
Global<Function> MyObject::constructor;

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

  AddEnvironmentCleanupHook(isolate, [](void*) {
    constructor.Reset();
  }, nullptr);
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

Kiểm tra nó với:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// Prints: 30
```
