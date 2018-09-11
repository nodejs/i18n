# Thành phần mở rộng C++

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Thành phần mở rộng của Node.js là các đối tượng được chia sẻ với nhau qua các liên kết động, được viết bằng ngôn ngữ C++ và được tải lên Node.js bằng cách sử dụng hàm [`require()`](modules.html#modules_require). Ngoài ra, đây cũng được coi như một mô-đun thông thường của Node.js. Chúng được sử dụng chủ yếu như một phương thức giao tiếp giữa JavaScript của Node.js và các thư viện C/C++.

Hiện tại, việc thực hiện cài đặt các thành phần mở rộng tương đối phức tạp, vì nó yêu cầu tổng hợp các kiến thức về một số thành phần liên quan và các API:

* V8: Hiện Node.js sử dụng thư viện C++ để cung cấp việc cài đặt JavaScript. V8 còn cung cấp khả năng tạo ra các đối tượng được gọi là các hàm. API của V8 chủ yếu được ghi lại trong tiêu đề tập tin `v8.h` (`deps/v8/include/v8.h` trong bộ nguồn của Node.js), V8 cũng có sẵn trên [tài liệu trực tuyến](https://v8docs.nodesource.com/).

* [libuv](https://github.com/libuv/libuv): Thư viện C bao gồm các công việc thực thi vòng lặp sự kiện của Node.js, các luồng và hành vi không đồng bộ trong cùng nền tảng. Nó cũng là một thư viện trừu tượng đa nền tảng, cung cấp thao tác truy cập dễ dàng, tương tự như POSIX tới các hệ điều hành chính đến các nhiệm vụ hệ thống thường dùng như tương tác với tệp tin hệ thống, socket, bộ đếm thời gian, và các sự kiện hệ thống. libuv còn cung cấp luồng trừu tượng giống như pthreads, dành cho việc tăng cường sức mạnh cho thành phần bổ sung không đồng bộ ngày càng phức tạp và cần vượt qua vòng lặp sự kiện tiêu chuẩn. Các nhà phát triển thành phần mở rộng được khuyến khích làm sao tránh việc chặn vòng lặp sự kiện với dữ liệu nhập xuất (I/O) hoặc giảm thiểu khối lượng công việc thông qua libuv bằng cách giảm các nhiệm vụ tiêu hao thời gian cho các hệ thống điều hành không bị chặn, các luồng ngầm hoặc các luồng tùy chỉnh của libuv.

* Thư viện Node.js nội bộ. Node.js có khả năng tự truy xuất một số API C++ giúp thành phần mở rộng có thể sử dụng &mdash; trong đó loại quan trọng nhất là `node::ObjectWrap`.

* Node.js bao gồm một số thư viện liên kết tĩnh như OpenSSL. Những thư viện này nằm trong thư mục `deps/` của bộ quản lý mã nguồn Node.js. Chỉ có libuv, OpenSSL, V8 và các biểu tượng zlib là được truy xuất lại có chủ đích thông qua Node.js và có thể được sử dụng cho các phần mở rộng khác nhau. Để biết thêm thông tin, hãy xem [liên kết đến các phần phụ thuộc của Node.js](#addons_linking_to_node_js_own_dependencies).

Các ví dụ sau đây có thể [tải về](https://github.com/nodejs/node-addon-examples) cũng như có thể được sử dụng như điểm khởi đầu cho một thành phần mở rộng bất kỳ.

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

Lưu ý rằng tất cả các thành phần mở rộng của Node.js phái truy xuất một hàm khởi tạo như sau:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

Phía sau `NODE_MODULE` không có dấu chấm phẩy, vì nó không phải là một hàm (xem `node.h`).

`module_name` bắt buộc phải khớp với tên tệp tin nhị phân bản hoàn thành (ngoại trừ hậu tố `.node`).

Trong ví dụ `hello.cc`, thì hàm khởi tạo là `init` và tên mô-đun phần mở rộng là `addon`.

### Xây dựng hoàn thiện

Một khi mã nguồn được viết ra, nó cần được biên soạn thành tập tin nhị phân `addon.node`. Để thực hiện, tạo một tệp nằm ở phía trên cùng trong thư mục gốc của dự án có tên `binding.gyp`, sử dụng định dạng tương tự như JSON nhằm mô tả cấu hình xây dựng của mô-đun. Tập tin này được sử dụng bởi [node-gyp](https://github.com/nodejs/node-gyp) — đây là một công cụ dành riêng cho việc biên soạn thành phần mở rộng của Node.js.

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

Node.js sẽ đóng gói và phân phối một phiên bản của tiện ích `node-gyp` như một phần của `npm`. Các nhà phát triển không thể trực tiếp sử dụng phiên bản này mà chỉ dùng cho việc hỗ trợ khả năng sử dụng lệnh `npm install` cho việc biên soạn và thiết đặt thành phần mở rộng. Nếu họ muốn sử dụng trực tiếp `node-gyp` cần phải sử dụng câu lệnh `npm install -g node-gyp`. Để biết thêm thông tin [hướng dẫn cài đặt](https://github.com/nodejs/node-gyp#installation) (bao gồm các yêu cầu cụ thể của nền tảng), vui lòng tham khảo thêm `node-gyp`.

Sau khi tạo xong tệp tin `binding.gyp`, có thể sử dụng `node-gyp configure` để tạo tệp xây dựng dự án phù hợp với nền tảng hiện tại. Điều này sẽ giúp tạo ra tệp `Makefile` (trên nền tảng Unix) hoặc `vcxproj` (trên Windows) trong thư mục `build/`.

Tiếp theo, sử dụng lệnh `node-gyp build` để tạo ra tệp `addon.node` đã được biên soạn. This will be put into the `build/Release/` directory.

Khi sử dụng `npm install` để cài đặt phần mở rộng cho Node.js, npm sẽ sử dụng riêng phiên bản đã được gói lại `node-gyp` để thống nhất các thao tác, giúp người dùng có được thành phần mở rộng với phiên bản đã được biên soạn theo yêu cầu.

Sau khi xây dựng, phần mở rộng nhị phân có thể được sử dụng trong Node.js thông qua [`require()`](modules.html#modules_require) để hoàn thiện mô-đun `addon.node`:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

Để biết thêm thông tin, hãy xem các ví dụ bên dưới hoặc truy cập <https://github.com/arturadib/node-qt> để biết các ví dụ trong môi trường sản xuất.

Bởi vì đường dẫn chính xác tới phần mở rộng nhị phân có thể thay đổi tùy theo việc nó được biên soạn như thế nào (ví dụ: có khi được đặt trong `./build/Debug/`), vậy nên các thành phần mở rộng có thể dùng gói [bindings](https://github.com/TooTallNate/node-bindings) để nạp các mô-đun đã qua biên soạn.

Lưu ý rằng việc cài đặt gói `bindings` là vô cùng tinh vi vì phải định vị các mô-đun của phần mở rộng, nhưng cần thiết phải thử theo mô hình try-catch tương tự dưới đây:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Liên kết tới các thành phần bắt buộc của Node.js

Node.js sử dụng một số các thư viện liên kết tĩnh như V8, libuv và OpenSSL. Tất cả phần mở rộng được yêu cầu liên kết tới V8 hoặc cũng có thể tới các thành phần bắt buộc khác. Nói chung việc này đơn giản như việc thêm câu lệnh `#include <...>` (ví dụ: `#include <v8.h>`) và `node-gyp` sẽ tự động xác định vị trí thích hợp cho tiêu đề. Tuy nhiên, cần chú ý một vài công việc sau:

* Khi chạy `node-gyp`, nó sẽ phát hiện bản phát hành cụ thể của Node.js và tải về tệp lưu trữ mã nguồn chung tarball hoặc chỉ các tiêu đề. Nếu toàn bộ mã nguồn được tải về, thành phần mở rộng sẽ có khả năng truy cập hoàn toàn tới thành phần bắt buộc của Node.js. Tuy nhiên, nếu chỉ tải về các tiêu đề, chỉ có thể dẫn tới các biểu tượng do Node.js truy xuất.

* `node-gyp` có thể sử dụng `--nodedir` trỏ đến nguồn ảnh trong Node.js. Bằng cách này, phần mở rộng có thể truy cập tới toàn bộ thành phần bắt buộc.

### Nạp phần mở rộng bằng cách sử dụng require()

Tên đuôi tệp tin của thành phần mở rộng là `.node`( trái ngược với to `.dll` hoặc `.so`). Để tìm kiếm các tệp tin có đuôi `.node`, người ta sử dụng hàm [`require()`](modules.html#modules_require) và thiết lập chúng là những thư viện liên kết động.

Khi gọi hàm [`require()`](modules.html#modules_require), phần đuôi `.node` có thể bị bỏ qua nhưng Node.js vẫn có thể tìm thấy và thiết lập thành phần mở rộng. Cảnh báo trước, tuy nhiên, Node.js sẽ thử xác định vị trí và nạp các mô-đun trước hoặc các tệp JavaScript có thể chia sẻ tên cơ sở giống nhau. Ví dụ, tệp `addon.js` nằm chung thư mục với tệp nhị phân `addon.node`, sau đó khi triển khai hàm [`require('addon')`](modules.html#modules_require),kết quả trả về sẽ là `addon.js` và bắt đầu triển khai nó.

## Các trừu tượng gốc cho Node.js

Mỗi ví dụ minh họa trong tài liệu này được sử dụng trực tiếp cho việc thiết lập các thành phần mở rộng bởi Node.js và các API V8. Điều quan trọng là phải hiểu rằng API V8 có khả năng thay đổi và đã có sự thay đổi đáng kể từ một bản phát hành V8 sang bản tiếp theo (và một bản phát hành Node.js chính tới bản tiếp theo). Với mỗi thay đổi, các thành phần mở rộng có thể cần phải cập nhật và biên soạn lại để có thể tiếp tục hoạt động. Lịch phát hành của Node.js được thiết kế nhằm giảm thiểu tần suất và tác động của các thay đổi như vậy, nhưng thực tế Node.js có rất ít khả năng đảm bảm được sự ổn định của các API V8.

Các [trừu tượng gốc dành cho Node.js](https://github.com/nodejs/nan) (hoặc `nan`) cung cấp một bộ công cụ được khuyến khích cho các nhà lập trình thành phần mở rộng sử dụng để giữ khả năng tương thích của các bản phát hành của V8 và Node.js trong quá khứ và tương lai. Xem thêm các [ví dụ](https://github.com/nodejs/nan/tree/master/examples/) minh họa về `nan` để biết thêm ứng dụng của nó.

## N-API

> Tính ổn định: 1 - Thử nghiệm

N-API là một API dùng để xây dựng thành phần mở rộng gốc. Nó độc lập so với chương trình chạy JavaScript (ví dụ: V8) và được duy trì như một phần của Node.js. API này sẽ là một giao diện nhị phân ứng dụng (ABI) chạy ổn định trên các phiên bản của Node.js. Nó được định hướng nhằm tách biệt thành phần mở rộng đối với các sự thay đổi trong bộ máy JavaScript cơ bản và cho phép các mô-đun được biên soạn một phiên bản có khả năng chạy trên các bản khác nhau của Node.js mà không cần sự biên soạn lại. Thành phần mở rộng được xây dựng/đóng gói với cùng cách tiếp cập/các công cụ được nêu trong tài liệu này (node-gyp, etc.). Điểm khác biệt duy nhất là bộ API được sử dụng bởi mã gốc. Thay vì sử dụng V8 hoặc các API của [các trừu tượng gốc cho Node.js](https://github.com/nodejs/nan), có thể sử dụng các hàm có sẵn của N-API.

Để sử dụng N-API cho ví dụ "Hello world" phía trên, thay thế nội dung của `hello.cc` như sau đây. Các hướng dẫn khác vẫn giống như vậy.

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

Các hàm có sẵn và cách sử dụng chúng được ghi lại trong phần có tiêu đề [C/C++ Addons - N-API](n-api.html).

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

Trong các trường hợp khi có hơn một tệp `.cc`, chỉ cần thêm tên tệp vào hàng `sources`:

```json
"sources": ["addon.cc", "myexample.cc"]
```

Khi tập tin `binding.gyp` đã sẵn sàng, các ví dụ thành phần mở rộng có thể được cấu hình và xây dựng sử dụng `node-gyp`:

```console
$ node-gyp configure build
```

### Đối số hàm

Addons will typically expose objects and functions that can be accessed from JavaScript running within Node.js. When functions are invoked from JavaScript, the input arguments and return value must be mapped to and from the C/C++ code.

The following example illustrates how to read function arguments passed from JavaScript and how to return a result:

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

Once compiled, the example Addon can be required and used from within Node.js:

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```

### Callbacks

It is common practice within Addons to pass JavaScript functions to a C++ function and execute them from there. The following example illustrates how to invoke such callbacks:

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

Note that this example uses a two-argument form of `Init()` that receives the full `module` object as the second argument. This allows the Addon to completely overwrite `exports` with a single function instead of adding the function as a property of `exports`.

To test it, run the following JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

Note that, in this example, the callback function is invoked synchronously.

### Object factory

Addons can create and return new objects from within a C++ function as illustrated in the following example. An object is created and returned with a property `msg` that echoes the string passed to `createObject()`:

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

To test it in JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```

### Function factory

Another common scenario is creating JavaScript functions that wrap C++ functions and returning those back to JavaScript:

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

To test:

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```

### Wrapping C++ objects

It is also possible to wrap C++ objects/classes in a way that allows new instances to be created using the JavaScript `new` operator:

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

In `myobject.cc`, implement the various methods that are to be exposed. Below, the method `plusOne()` is exposed by adding it to the constructor's prototype:

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

Test it with:

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

Alternatively, it is possible to use a factory pattern to avoid explicitly creating object instances using the JavaScript `new` operator:

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

In `myobject.h`, the static method `NewInstance()` is added to handle instantiating the object. This method takes the place of using `new` in JavaScript:

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

Test it with:

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

### Passing wrapped objects around

In addition to wrapping and returning C++ objects, it is possible to pass wrapped objects around by unwrapping them with the Node.js helper function `node::ObjectWrap::Unwrap`. The following examples shows a function `add()` that can take two `MyObject` objects as input arguments:

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

In `myobject.h`, a new public method is added to allow access to private values after unwrapping the object.

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

Test it with:

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

An `AtExit` hook is a function that is invoked after the Node.js event loop has ended but before the JavaScript VM is terminated and Node.js shuts down. `AtExit` hooks are registered using the `node::AtExit` API.

#### void AtExit(callback, args)

* `callback` <span class="type">&lt;void (\<em>)(void\</em>)&gt;</span> A pointer to the function to call at exit.
* `args` <span class="type">&lt;void\*&gt;</span> A pointer to pass to the callback at exit.

Registers exit hooks that run after the event loop has ended but before the VM is killed.

`AtExit` takes two parameters: a pointer to a callback function to run at exit, and a pointer to untyped context data to be passed to that callback.

Callbacks are run in last-in first-out order.

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

Test in JavaScript by running:

```js
// test.js
require('./build/Release/addon');
```