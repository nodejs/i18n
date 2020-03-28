# Addon C++

<!--introduced_in=v0.10.0-->

Node.js Addons are dynamically-linked shared objects, written in C++, that can be loaded into Node.js using the [`require()`](modules.html#modules_require) function, and used just as if they were an ordinary Node.js module. Biasanya digunakan untuk menyediakan interface antara JavaScript yang berjalan di Node.js dengan library C/C++.

Pada saat itu, metode untuk mengimplementasikan Addon ini cukup rumit, termasuk pengetahuan akan beberapa komponen dan API :

* V8: library C++ yang digunakan pada Node.js untuk menyediakan implementasi JavaScript. V8 menyediakan mekanisme untuk membuat objek, memanggil fungsi, dsb. API V8 didokumentasikan pada file header `v8.h` (`deps/v8/include/v8.h` dalam kode sumber Node.js), yang juga tersedia [online](https://v8docs.nodesource.com/).

* [libuv](https://github.com/libuv/libuv): Pustaka C yang mengimplementasikan acara loop Node.js, Pekerjanya dan semua hal yang dikerjakan cocok dengan platfrom It also serves as a cross-platform abstraction library, giving easy, POSIX-like access across all major operating systems to many common system tasks, such as interacting with the filesystem, sockets, timers, and system events. libuv juga menyediakan pthreads seperti abstraksi threading yang mungkin digunakan untuk kekuatan lebih canggih pada Addons yang sinkron untuk bergerak melampaui acara standar loop. Penulis addon diajak berfikir tentang bagaimana untuk menghindari serta memblokir acara loop untuk I/O atau tugas-tugas lain dalam waktu yang intensif oleh karena itu proses memuat kerja melalui opersi sistem yang tidak menghalangi, utas pekerja.

* Perpustakaan internal Node.js Node.js sendiri ekspor sejumlah C++ api yang dapat digunakan oleh Addons &mdash; hal yang terpenting adalah kelas `node::ObjectWrap` .

* Node.js mencakup sejumlah perpustakaan statis terkait lainnya termasuk OpenSSL. Perpustakaan ini terletak di `deps /` di direktori pohon sumber Node.js Only the libuv, OpenSSL, V8 and zlib symbols are purposefully re-exported by Node.js and may be used to various extents by Addons. Untuk informasi tambahan, lihat [menautkan ke dependensi Node.js'](#addons_linking_to_node_js_own_dependencies) .

All of the following examples are available for [download](https://github.com/nodejs/node-addon-examples) and may be used as the starting-point for an Addon.

## Halo, Dunia

Contoh "Halo, Dunia" ini adalah Addon sederhana, yang ditulis dalam C ++, yaitu setara dengan kode JavaScript berikut:

```js
module.exports.hello = () => 'world';
```

Pertama, buat file `hello.cc`:

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

Perhatikan bahwa semua Node.js Addons harus di ekspor ke fungsi inisialisasi pada pola berikut:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

Tidak ada titik koma setelah `NODE_MODULE` karena tidak fungsi (Lihat `node.h`).

The `module_name` must match the filename of the final binary (excluding the .node suffix).

Dalam contoh `hello.cc` , kemudian, fungsi inisialisasi adalah `init` dan Nama modul addon merupakan `addon`.

### Bangunan

Setelah kode sumber telah ditulis, kemudian harus disusun ke dalam file biner `addon.node`. To do so, create a file called `binding.gyp` in the top-level of the project describing the build configuration of the module using a JSON-like format. File ini digunakan oleh [node-gyp](https://github.com/nodejs/node-gyp) — alat ditulis khusus untuk mengkompilasi Addons Node.js.

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

*Note*: A version of the `node-gyp` utility is bundled and distributed with Node.js as part of `npm`. Versi ini tidak tersedia secara langsung untuk pengembang yang menggunakan dan memasukan hanya untuk mendukung kemampuan di `NPM menginstal` sebagai perintah untuk kompilasi dan memasang Addons. Pengembang yang ingin menggunakan `node-gyp` langsung dapat menginstal menggunakan perintah `npm menginstal -g node-gyp`. Lihat `node-gyp` [petunjuk instalasi](https://github.com/nodejs/node-gyp#installation) untuk informasi lebih lanjut, termasuk persyaratan spesifik platform.

Setelah file `binding.gyp` yang telah dibuat, menggunakan `simpul-gyp mengkonfigurasi` untuk menghasilkan file bangunan proyek yang tepat untuk platform saat ini. Ini akan menghasilkan sebuah `Makefile` (pada platform Unix) atau `vcxproj` file (pada Windows) di `bangunan /` direktori.

Selanjutnya, aktifkan ` node-gyp build ` sebagai perintah untuk menghasilkan kompilasi `addon.node` Ini akan dimasukkan ke dalam direktori `build/Release/`

Bila menggunakan `npm install` untuk menginstal Addon Node.js, npm menggunakan bundelnya sendiri versi ` node-gyp ` untuk melakukan serangkaian tindakan yang sama, menghasilkan dari Addon untuk platform pengguna sesuai permintaan.

Once built, the binary Addon can be used from within Node.js by pointing [`require()`](modules.html#modules_require) to the built `addon.node` module:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

Silakan lihat contoh di bawah ini untuk informasi lebih lanjut atau [ https://github.com/arturadib/node-qt ](https://github.com/arturadib/node-qt) sebagai contoh dalam produksi.

Karena jalur yang tepat ke biner Addon yang dikompilasi dapat bervariasi tergantung pada caranya melakukan kompilasi (i.e. sometimes it may be in `./build/Debug/`)Addons dapat menggunakan paket [bindings](https://github.com/TooTallNate/node-bindings) untuk memuat modul yang dikompilasi.

Perhatikan bahwa sementara implementasi paket `bindings` lebih canggih dalam cara menempatkan modul Addon, pada dasarnya menggunakan percobaan pola tangkapan mirip seperti:

```js
coba {
  kembali membutuhkan('./build/Release/addon.node');
} menangkap (err) {
  kembali membutuhkan('./build/Debug/addon.node');
}
```

### Menautkan ke dependensi Node.js sendiri

Node.js menggunakan sejumlah perpustakaan yang terhubung secara statis seperti V8, libuv dan OpenSSL. Semua Addons harus terhubung ke V8 dan dapat terhubung ke salah satu dari dependensi lain juga Biasanya, ini sangat sederhana termasuk pernyataan `#include <...>` yang sesuai (e.g. `#include <v8.h>`) dan `node-gyp` akan mencari header atau tajuk yang sesuai secara otomatis. Namun disana ada beberapa peringatan yang harus diperhatikan:

* Ketika ` node-gyp ` berjalan, ia akan mendeteksi versi rilis spesifik Node.js dan mengunduh sumber lengkap tarball atau hanya header saja. Jika penuh sumber download, Addons akan memiliki akses penuh ke set lengkap dependensi Node.js. Namun, jika hanya header Node.js yang di-download, kemudian hanya simbol-simbol yang diekspor oleh Node.js saja akan tersedia.

* ` node-gyp ` dapat dijalankan menggunakan flag ` --nodedir ` yang menunjuk ke Node.js lokal gambar sumber. Menggunakan opsi ini, Addon akan memiliki akses ke set lengkap dependensi.

### Memuat Addons wajib menggunakan()

Ekstensi nama file biner Addon yang dikompilasi adalah ` .node ` (sebagai lawan ke ` .dll ` atau ` .so `). The [`require()`](modules.html#modules_require) function is written to look for files with the `.node` file extension and initialize those as dynamically-linked libraries.

When calling [`require()`](modules.html#modules_require), the `.node` extension can usually be omitted and Node.js will still find and initialize the Addon. Satu peringatan, bahwa Node.js akan berupaya untuk mencari dan memuat modul atau File JavaScript yang kebetulan memiliki nama dasar yang sama. For instance, if there is a file `addon.js` in the same directory as the binary `addon.node`, then [`require('addon')`](modules.html#modules_require) will give precedence to the `addon.js` file and load it instead.

## Abstraksi Asli untuk Node.js

Setiap contoh yang diilustrasikan dalam dokumen ini menggunakan langsung dari API Node.js dan V8 untuk mengimplementasikan Addons. Penting untuk dipahami bahwa V8 API dapat dan telah, berubah secara dramatis dari satu rilis V8 ke V8 berikutnya (dan satu rilis Node.js utama ke depan). Dengan setiap perubahan, Addons mungkin perlu diperbarui dan disusun ulang agar dapat terus berfungsi. Jadwal Node.js rilis telah dirancang untuk meminimalkan frekuensi dan dampaknya perubahan, tetapi ada sedikit yang Node.js dapat lakukan saat ini untuk memastikan stabilitas API V8.

[ Abstraksi Asli untuk Node.js ](https://github.com/nodejs/nan) (atau ` nan `) menyediakan seperangkat alat Pengembang Addon yang disarankan supaya digunakan untuk menjaga kompatibilitas antara masa lalu dan rilis mendatang dari V8 dan Node.js. Lihat ` nan ` [ contoh ](https://github.com/nodejs/nan/tree/master/examples/) untuk sebuah ilustrasi cara penggunaannya.

## N-API

> Stabilitas: 1 - Eksperimental

N-API adalah API untuk membangun Addons asli. It is independent from the underlying JavaScript runtime (e.g. V8) and is maintained as part of Node.js itself. API ini akan menjadi aplikasi biner antarmuka (ABI) yang stabil di seluruh versi Node.js. Ini dimaksudkan untuk mengisolasi Addons dari perubahan pada mesin JavaScript yang mendasarinya dan izinkan modul dan memungkingkan modul dikompilasi pada satu versi untuk menjalankan pada versi Node.js yang lebih baru tanpa kompilasi ulang. Addons dibangun / dikemas dengan pendekatan / alat yang sama diuraikan dalam dokumen ini (node-gyp, dll). Satu-satunya perbedaan adalah set API yang digunakan oleh kode asli. Sebagai gantinya menggunakan V8 atau [ Abstraksi Asli untuk Node.js ](https://github.com/nodejs/nan) API, fungsi tersedia di N-API digunakan.

To use N-API in the above "Hello world" example, replace the content of `hello.cc` with the following. Semua instruksi lainnya tetap sama.

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

The functions available and how to use them are documented in the section titled [C/C++ Addons - N-API](n-api.html).

## Addon examples

Following are some example Addons intended to help developers get started. The examples make use of the V8 APIs. Refer to the online [V8 reference](https://v8docs.nodesource.com/) for help with the various V8 calls, and V8's [Embedder's Guide](https://github.com/v8/v8/wiki/Embedder's%20Guide) for an explanation of several concepts used such as handles, scopes, function templates, etc.

Each of these examples using the following `binding.gyp` file:

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

In cases where there is more than one `.cc` file, simply add the additional filename to the `sources` array. For example:

```json
"sources": ["addon.cc", "myexample.cc"]
```

Once the `binding.gyp` file is ready, the example Addons can be configured and built using `node-gyp`:

```console
$ node-gyp configure build
```

### Function arguments

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

An "AtExit" hook is a function that is invoked after the Node.js event loop has ended but before the JavaScript VM is terminated and Node.js shuts down. "AtExit" hooks are registered using the `node::AtExit` API.

#### void AtExit(callback, args)

* `callback` {void (*)(void*)} A pointer to the function to call at exit.
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