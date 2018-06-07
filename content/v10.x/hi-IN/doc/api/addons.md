# C++ Addons

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Node. js addons C++ में अस्थिर रूप से लिखे गये हैं। इनको [` require() `](modules.html#modules_require) function के ज़रिए Node.js में लाया जा सकता है एवं एक साधारण Node.js module की तरह भी उपयोग में लाया जा सकता है। वे मुख्य रूप से Node.js और C / C ++ libraries में चल रहे JavaScript के बीच एक इंटरफ़ेस प्रदान करने के लिए उपयोग किए जाते हैं।

फिलहाल, addons को लागू करने की विधि बहुत ही जटिल है, जिसमें कई घटकों और एपीआई के ज्ञान शामिल हैं, जैसे:

* V8: एक C++ library जो Node.js वर्तमान में JavaScript को अमल करने के लिए उपयोग करता है। V8 objects, calling functions, आदि को बनाने के लिए तंत्र प्रदान करता है। V8 के API को अधिकतर `v8.h` हेडर फ़ाइल (`deps/v8/include/v8.h` जो Node.js के source tree में उपलब्ध है), और [online](https://v8docs.nodesource.com/) भी उपलब्ध है।

* [libuv](https://github.com/libuv/libuv): एक C library जो Node.js event loop, इसके कार्यकर्ता threads और प्लेटफॉर्म के सभी असीमित व्यवहारों को लागू करती है। यह एक cross-platform extraction library के रूप में भी कार्य करता है, जो कि सभी प्रमुख operating systems के filesystem, sockets, timer और system events के साथ बातचीत करने जैसे आसान, POSIX जैसी पहुंच प्रदान करता है। और libuv एक pthreads जैसा threading abstraction प्रदान करता है जिसका उपयोग अधिक परिष्कृत asynchronous addons को शक्ति प्रदान करने के लिए किया जा सकता है जिसे मानक event loop से आगे बढ़ने की आवश्यकता होती है। Addon लेखकों को इस बारे में सोचने के लिए प्रोत्साहित किया जाता है कि I/O या अन्य समय-गहन कार्यों के साथ event loop को अवरुद्ध करने से, libuv के माध्यम से गैर-अवरुद्ध सिस्टम संचालन, कार्यकर्ता threads या libuv के threads का एक कस्टम उपयोग के माध्यम से ऑफ-लोडिंग कार्य द्वारा कैसे बचें।

* आंतरिक Node.js libraries: Node.js स्वयं कईं C++ API निर्यात करता है जो addons का उपयोग कर सकते हैं &mdash; जिनमें से सबसे महत्वपूर्ण `node::ObjectWrap` class है।

* Node.js में OpenSSL सहित कई अन्य स्थिर रूप से जुड़ी libraries शामिल हैं। यह अन्य libraries Node.js के source tree में `deps/` निर्देशिका में स्थित हैं। केवल libuv, OpenSSL, V8 और zlib प्रतीकों को उद्देश्य से Node.js द्वारा पुनः निर्यात किया जाता है और इन्हेंaddons द्वारा विभिन्न तरीकों से उपयोग किया जा सकता है। अतिरिक्त जानकारी के लिए [Linking to Node.js' own dependencies](#addons_linking_to_node_js_own_dependencies) देखें।

निम्नलिखित सभी उदाहरण [डाउनलोड](https://github.com/nodejs/node-addon-examples) के लिए उपलब्ध हैं और इन्हें एक addon के प्रारंभिक बिंदु के रूप में भी उपयोग किया जा सकता है।

## हैलो वर्ल्ड

यह "हैलो वर्ल्ड" उदाहरण C++ में लिखा गया एक साधारण addon है, जो निम्न JavaScript कोड के बराबर है:

```js
module.exports.hello = () => 'world';
```

सबसे पहले, फ़ाइल `hello.cc` बनाएं:

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

ध्यान दें कि सभी Node.js addons को निम्न पैटर्न के तहत एक initialization function निर्यात करना होगा:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

`NODE_MODULE` के बाद कोई सेमि-कोलन नहीं है क्योंकि यह एक function नहीं है (`node.h` देखें)।

`module_name` को आखरी binary के फ़ाइल नाम से मेल खाना चाहिए (`.node` प्रत्यय को छोड़कर)।

`hello.cc` उदाहरण में, फिर प्रारंभिक कार्य `init` है और addon module का नाम `addon` है।

### निर्माण

एक बार source code लिखने के बाद, इसे binary फ़ाइल `addon.node` में संकलित किया जाना चाहिए। ऐसा करने के लिए, JSON-जैसी प्रारूप का उपयोग करके मॉड्यूल की build configuration का वर्णन करने वाले प्रोजेक्ट के शीर्ष-स्तर में `binding.gyp` नामक एक फ़ाइल बनाएं। यह फ़ाइल [node-gyp](https://github.com/nodejs/node-gyp) द्वारा उपयोग की जाती है - एक उपकरण जो की विशेष रूप से Node.js Addons को संकलित करने के लिए लिखा गया है।

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

`node-gyp` utility के एक संस्करण को बंडल किया गया है और `npm` के हिस्से के रूप में Node.js के साथ वितरित किया गया है। यह संस्करण सीधे डेवलपर्स के उपयोग के लिए उपलब्ध नहीं है और केवल addons को `npm install` कमांड का उपयोग करके संकलित और स्थापित करने के लिए, है। डेवलपर्स जो `node-gyp` का उपयोग करना चाहते हैं, सीधे इसे `npm install -g node-gyp` कमांड का उपयोग करके इंस्टॉल कर सकते हैं। प्लेटफॉर्म-विशिष्ट आवश्यकताओं सहित अधिक जानकारी के लिए `node-gyp` के [स्थापना निर्देश](https://github.com/nodejs/node-gyp#installation) देखें।

एक बार `binding.gyp` फ़ाइल के बनते ही, मौजूदा प्लेटफ़ॉर्म के लिए उपयुक्त प्रोजेक्ट बिल्ड फ़ाइलों को उत्पन्न करने के लिए `node-gyp configure` का उपयोग करें। यह `build/` निर्देशिका में या तो `Makefile` (Unix प्लेटफॉर्म्स पर) या `vcxproj` फ़ाइल (Windows पर) उत्पन्न करेगा।

इसके बाद, संकलित `addon.node` फ़ाइल उत्पन्न करने के लिए `node-gyp build` कमांड का आह्वान करें। इसे `build/Release/` निर्देशिका में रखा जाएगा।

Node.js Addon को स्थापित करने के लिए `npm install` का उपयोग करते समय, npm इसी क्रिया को करने के लिए अपने स्वयं के bundled संस्करण के `node-gyp` का उपयोग करता है, जिससे उपयोगकर्ता की मांग और उसके प्लेटफार्म हेतु एक संकलित addon उत्पन्न होता है।

एक बार बनने के बाद, binary addon का निर्माण [`require()`](modules.html#modules_require) को `addon.node` module पर इंगित करके Node.js के भीतर से किया जा सकता है:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

उत्पादन में एक उदाहरण के लिए कृपया नीचे दी गई जानकारी या <https://github.com/arturadib/node-qt> देखें।

चूंकि संकलित addon binary का सटीक path इस पर निर्भर करता है कि यह कैसे संकलित किया जाता है (यानी कभी-कभी यह `./build/Debug/` में हो सकता है), addons [bindings](https://github.com/TooTallNate/node-bindings) पैकेज का उपयोग कर सकते हैं संकलित module को लोड करने के लिए।

ध्यान दें कि `bindings` पैकेज की कार्यान्वयन इस बारे में अधिक परिष्कृत है की वह addon मॉड्यूल को कैसे ढूंढता है, यह एक try-catch पैटर्न का उपयोग कर रहा है:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Node.js की अपनी निर्भरताओं से जुड़ते हुए

Node.js V8, libuv और OpenSSL जैसे कई सांख्यिकीय रूप से जुड़े libraries का उपयोग करता है। सभी addons को V8 से लिंक करने की आवश्यकता है और अन्य किसी भी निर्भरता से भी लिंक कर सकते हैं। आम तौर पर, यह उचित `#include <...>` कथन (जैसे `#include <v8.h>`) और `node-gyp` उचित हेडर का स्वचालित रूप से पता लगाएगा। हालांकि, कुछ चेतावनी हैं जिनके बारे में पता होना चाहिए:

* जब `node-gyp` चलता है, तो यह Node.js के विशिष्ट रिलीज संस्करण का पता लगाएगा और या तो पूर्ण source tarball या सिर्फ हैडर्स को डाउनलोड करेगा। अगर पूरा स्रोत डाउनलोड किया हेडर्स है, तो addons को Node.js निर्भरताओं के पूर्ण सेट तक पूरी पहुंच होगी। हालांकि, अगर केवल Node.js हेडर्स डाउनलोड होते हैं, तो केवल Node.js द्वारा निर्यात किए गए प्रतीक उपलब्ध होंगे।

* `node-gyp` के साथ `--nodedir` फ्लैग लगाकर जो स्थानीय Node.js source को चलाने हेतु उपयोग किया जा सकता है। इस विकल्प का उपयोग करके, addon को निर्भरताओं के पूर्ण सेट तक पहुंच मिलेगी।

### require() का उपयोग करके addons लोड करें

संकलित addon binary का फ़ाइल नाम एक्सटेंशन `.node` है (जो `.dll` या `.so` के विपरीत है)। [`require()`](modules.html#modules_require) फ़ंक्शन को `.node` फ़ाइल एक्सटेंशन वाली फ़ाइलों को देखने के लिए लिखा गया है और उनको गतिशील रूप से लिंक कि गयीं libraries के रूप में प्रारंभ करने के लिए।

[`require()`](modules.html#modules_require) को कॉल करते समय, `.node` एक्सटेंशन को आमतौर पर छोड़ा जा सकता है और Node.js अभी भी addon को ढूंढकर प्रारंभ करेगा। हालांकि, एक चेतावनी यह है कि Node.js पहले मॉड्यूल या JavaScript फ़ाइलों को ढूंढने और लोड करने का प्रयास करेगा जो समान आधार नाम साझा करने के लिए होता है। उदाहरण के लिए, यदि binary `addon.node` के निर्देशिका में `addon.js` फ़ाइल है, तो [`require('addon')`](modules.html#modules_require) `addon.js` फ़ाइल को प्राथमिकता देगा और इसके बजाय इसे लोड करेगा।

## Native Abstractions for Node.js

इस दस्तावेज़ में दिखाए गए प्रत्येक उदाहरण addons को लागू करने के लिए Node.js और V8 API का प्रत्यक्ष उपयोग करता है। यह समझना महत्वपूर्ण है कि V8 API एक से दूसरे V8 रिलीज में नाटकीय रूप से बदल सकता है (और अगले प्रमुख Node.js रिलीज में भी हो सकता है)। प्रत्येक परिवर्तन के साथ, कार्य जारी रखने के लिए addons को अद्यतन और संकलित करने की आवश्यकता हो सकती है। Node.js रिलीज शेड्यूल को इस तरह के परिवर्तनों की आवृत्ति और प्रभाव को कम करने के लिए डिज़ाइन किया गया है लेकिन V8 API की स्थिरता सुनिश्चित करने के लिए वर्तमान में Node.js ऐसा कम ही कर सकता है।

The [Native Abstractions for Node.js](https://github.com/nodejs/nan) (or `nan`) provide a set of tools that Addon developers are recommended to use to keep compatibility between past and future releases of V8 and Node.js. See the `nan` [examples](https://github.com/nodejs/nan/tree/master/examples/) for an illustration of how it can be used.

## N-API

> Stability: 1 - Experimental

N-API is an API for building native Addons. It is independent from the underlying JavaScript runtime (e.g. V8) and is maintained as part of Node.js itself. This API will be Application Binary Interface (ABI) stable across version of Node.js. It is intended to insulate Addons from changes in the underlying JavaScript engine and allow modules compiled for one version to run on later versions of Node.js without recompilation. Addons are built/packaged with the same approach/tools outlined in this document (node-gyp, etc.). The only difference is the set of APIs that are used by the native code. Instead of using the V8 or [Native Abstractions for Node.js](https://github.com/nodejs/nan) APIs, the functions available in the N-API are used.

To use N-API in the above "Hello world" example, replace the content of `hello.cc` with the following. All other instructions remain the same.

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

In cases where there is more than one `.cc` file, simply add the additional filename to the `sources` array:

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