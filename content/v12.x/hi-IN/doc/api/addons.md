# सी ++ एडॉन्स

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Addons are dynamically-linked shared objects written in C++. The [`require()`](modules.html#modules_require_id) function can load Addons as ordinary Node.js modules. Addons provide an interface between JavaScript and C/C++ libraries.

There are three options for implementing Addons: N-API, nan, or direct use of internal V8, libuv and Node.js libraries. Unless you need direct access to functionality which is not exposed by N-API, use N-API. Refer to [C/C++ Addons with N-API](n-api.html) for more information on N-API.

When not using N-API, implementing Addons is complicated, involving knowledge of several components and APIs:

* V8: एक C++ पुस्तकालय जो Node.js वर्तमान में JavaScript को अमल करने के लिए उपयोग करता है। V8 objects, calling functions, आदि को बनाने के लिए तंत्र प्रदान करता है। V8 के एपीआई को अधिकतर `v8.h` हेडर फ़ाइल (`deps/v8/include/v8.h` जो Node.js के source tree में उपलब्ध है), और [online](https://v8docs.nodesource.com/) भी उपलब्ध है।

* [libuv](https://github.com/libuv/libuv): एक C पुस्तकालय जो Node.js event loop, इसके कार्यकर्ता threads और प्लेटफॉर्म के सभी असीमित व्यवहारों को लागू करती है। It also serves as a cross-platform abstraction library, giving easy, POSIX-like access across all major operating systems to many common system tasks, such as interacting with the filesystem, sockets, timers, and system events. libuv एक pthreads- जैसे थ्रेडिंग abstraction भी प्रदान करता है जिसका उपयोग किया जा सकता है शक्ति अधिक परिष्कृत एसिंक्रोनस एडॉन्स जिन्हें आगे बढ़ने की आवश्यकता है मानक घटना पाश। Addon लेखकों को इस बारे में सोचने के लिए प्रोत्साहित किया जाता है कि कैसे करें I / O या अन्य समय-गहन कार्यों के साथ ईवेंट लूप को अवरुद्ध करने से बचें libuv के माध्यम से गैर-अवरुद्ध प्रणाली संचालन, कार्यकर्ता धागे के माध्यम से ऑफ लोडिंग काम या libuv के धागे का एक कस्टम उपयोग।

* आंतरिक Node.js libraries: Node.js itself exports C++ APIs that Addons can use, the most important of which is the `node::ObjectWrap` class.

* Node.js includes other statically linked libraries including OpenSSL. These other libraries are located in the `deps/` directory in the Node.js source tree. Only the libuv, OpenSSL, V8 and zlib symbols are purposefully re-exported by Node.js and may be used to various extents by Addons. See [Linking to Node.js' own dependencies](#addons_linking_to_node_js_own_dependencies) for additional information.

All of the following examples are available for [download](https://github.com/nodejs/node-addon-examples) and may be used as the starting-point for an Addon.

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

`NODE_MODULE` के बाद कोई सेमि-कोलन नहीं है क्योंकि यह एक function नहीं है (`node.h` देखें)।

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

This function adds a hook that will run before a given Node.js instance shuts down. If necessary, such hooks can be removed using `RemoveEnvironmentCleanupHook()` before they are run, which has the same signature. कॉलबैक last-in first-out ऑर्डर में चलाए जाते हैं।

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

JavaScript में चलाकर परीक्षण करें:

```js
// test.js
require('./build/Release/addon');
```

### निर्माण

एक बार source code लिखने के बाद, इसे binary फ़ाइल `addon.node` में संकलित किया जाना चाहिए। To do so, create a file called `binding.gyp` in the top-level of the project describing the build configuration of the module using a JSON-like format. यह फ़ाइल [node-gyp](https://github.com/nodejs/node-gyp) द्वारा उपयोग की जाती है - एक उपकरण जो की विशेष रूप से Node.js Addons को संकलित करने के लिए लिखा गया है।

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

A version of the `node-gyp` utility is bundled and distributed with Node.js as part of `npm`. यह संस्करण सीधे डेवलपर्स के उपयोग के लिए उपलब्ध नहीं है और केवल addons को `npm install` कमांड का उपयोग करके संकलित और स्थापित करने के लिए, है। डेवलपर्स जो `node-gyp` का उपयोग करना चाहते हैं, सीधे इसे `npm install -g node-gyp` कमांड का उपयोग करके इंस्टॉल कर सकते हैं। प्लेटफॉर्म-विशिष्ट आवश्यकताओं सहित अधिक जानकारी के लिए `node-gyp` के [स्थापना निर्देश](https://github.com/nodejs/node-gyp#installation) देखें।

एक बार `binding.gyp` फ़ाइल के बनते ही, मौजूदा प्लेटफ़ॉर्म के लिए उपयुक्त प्रोजेक्ट बिल्ड फ़ाइलों को उत्पन्न करने के लिए `node-gyp configure` का उपयोग करें। यह `build/` निर्देशिका में या तो `Makefile` (Unix प्लेटफॉर्म्स पर) या `vcxproj` फ़ाइल (Windows पर) उत्पन्न करेगा।

इसके बाद, संकलित `addon.node` फ़ाइल उत्पन्न करने के लिए `node-gyp build` कमांड का आह्वान करें। इसे `build/Release/` निर्देशिका में रखा जाएगा।

Node.js Addon को स्थापित करने के लिए `npm install` का उपयोग करते समय, npm इसी क्रिया को करने के लिए अपने स्वयं के bundled संस्करण के `node-gyp` का उपयोग करता है, जिससे उपयोगकर्ता की मांग और उसके प्लेटफार्म हेतु एक संकलित addon उत्पन्न होता है।

Once built, the binary Addon can be used from within Node.js by pointing [`require()`](modules.html#modules_require_id) to the built `addon.node` module:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Prints: 'world'
```

चूंकि संकलित addon binary का सटीक path इस पर निर्भर करता है कि यह कैसे संकलित किया जाता है (यानी कभी-कभी यह `./build/Debug/` में हो सकता है), addons [bindings](https://github.com/TooTallNate/node-bindings) पैकेज का उपयोग कर सकते हैं संकलित module को लोड करने के लिए।

While the `bindings` package implementation is more sophisticated in how it locates Addon modules, it is essentially using a `try…catch` pattern similar to:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Node.js की अपनी निर्भरताओं से जुड़ते हुए

Node.js uses statically linked libraries such as V8, libuv and OpenSSL. All Addons are required to link to V8 and may link to any of the other dependencies as well. Typically, this is as simple as including the appropriate `#include <...>` statements (e.g. `#include <v8.h>`) and `node-gyp` will locate the appropriate headers automatically. However, there are a few caveats to be aware of:

* जब `node-gyp` चलता है, तो यह Node.js के विशिष्ट रिलीज संस्करण का पता लगाएगा और या तो पूर्ण source tarball या सिर्फ हैडर्स को डाउनलोड करेगा। अगर पूरा स्रोत डाउनलोड किया हेडर्स है, तो addons को Node.js निर्भरताओं के पूर्ण सेट तक पूरी पहुंच होगी। हालांकि, अगर केवल Node.js हेडर्स डाउनलोड होते हैं, तो केवल Node.js द्वारा निर्यात किए गए प्रतीक उपलब्ध होंगे।

* `node-gyp` के साथ `--nodedir` फ्लैग लगाकर जो स्थानीय Node.js source को चलाने हेतु उपयोग किया जा सकता है। इस विकल्प का उपयोग करके, addon को निर्भरताओं के पूर्ण सेट तक पहुंच मिलेगी।

### Loading Addons using `require()`

संकलित addon binary का फ़ाइल नाम एक्सटेंशन `.node` है (जो `.dll` या `.so` के विपरीत है)। The [`require()`](modules.html#modules_require_id) function is written to look for files with the `.node` file extension and initialize those as dynamically-linked libraries.

When calling [`require()`](modules.html#modules_require_id), the `.node` extension can usually be omitted and Node.js will still find and initialize the Addon. हालांकि, एक चेतावनी यह है कि Node.js पहले मॉड्यूल या JavaScript फ़ाइलों को ढूंढने और लोड करने का प्रयास करेगा जो समान आधार नाम साझा करने के लिए होता है। For instance, if there is a file `addon.js` in the same directory as the binary `addon.node`, then [`require('addon')`](modules.html#modules_require_id) will give precedence to the `addon.js` file and load it instead.

## Native Abstractions for Node.js

इस दस्तावेज़ में दिखाए गए प्रत्येक उदाहरण addons को लागू करने के लिए Node.js और V8 API का प्रत्यक्ष उपयोग करता है। The V8 API can, and has, changed dramatically from one V8 release to the next (and one major Node.js release to the next). With each change, Addons may need to be updated and recompiled in order to continue functioning. The Node.js release schedule is designed to minimize the frequency and impact of such changes but there is little that Node.js can do currently to ensure stability of the V8 APIs.

[Native Abstractions for Node.js](https://github.com/nodejs/nan) (या `nan`) उपकरण का एक सेट प्रदान करते हैं जो addon डेवलपर्स को V8 और Node.js के पिछले और भविष्य के रिलीज के बीच संगतता रखने के लिए उपयोग करने की अनुशंसा की जाती है। इसका उपयोग कैसे किया जा सकता है इसका एक उदाहरण के लिए `nan` [उदाहरण](https://github.com/nodejs/nan/tree/master/examples/) देखें।

## N-API

> Stability: 2 - Stable

N-API मूल एडॉन्स बनाने के लिए एक API है। It is independent from the underlying JavaScript runtime (e.g. V8) and is maintained as part of Node.js itself. This API will be Application Binary Interface (ABI) stable across versions of Node.js. इसका उद्देश्य अंतर्निहित JavaScript इंजन में परिवर्तनों से addons को अपनाना है और बिना किसी संकलन के Node.js के बाद के संस्करणों पर चलाने के लिए एक संस्करण के लिए संकलित मॉड्यूल को अनुमति देना है। Addons इस दस्तावेज़ (node-gyp, इत्यादि) में उल्लिखित एक ही दृष्टिकोण/उपकरण के साथ निर्मित किए गए हैं। केवल अंतर API के सेट में है जो मूल कोड द्वारा उपयोग किया जाता है। V8 या [Native Abstractions for Node.js](https://github.com/nodejs/nan) का उपयोग करने के बजाय, N-API में उपलब्ध फ़ंक्शंस का उपयोग किया जाता है।

Creating and maintaining an addon that benefits from the ABI stability provided by N-API carries with it certain [implementation considerations](n-api.html#n_api_implications_of_abi_stability).

To use N-API in the above "Hello world" example, replace the content of `hello.cc` with the following. अन्य सभी निर्देश सामन्य रुप से लागु रहेंगे।

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

## Addon उदाहरण

निम्न कुछ उदाहरण दिए गए हैं जो addon डेवलपर्स को शुरू करने में मदद करने के लिए लक्षित हैं। उदाहरण V8 API का उपयोग करते हैं। Handles, scopes, function templates इत्यादि जैसे कई अवधारणाओं के स्पष्टीकरण के लिए विभिन्न V8 कॉलों और V8 की [Embedder's Guide](https://github.com/v8/v8/wiki/Embedder's%20Guide) के साथ ऑनलाइन [V8 reference](https://v8docs.nodesource.com/) का संदर्भ लें।

निम्न में से प्रत्येक उदाहरण निम्न`binding.gyp` फ़ाइल का उपयोग कर रहा है:

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

एक बार `binding.gyp` फ़ाइल के तैयार हो जाने के बाद, उदाहरण addons को कॉन्फ़िगर किया जा सकता है और `node-gyp` का उपयोग करके बनाया जा सकता है:

```console
$ node-gyp configure build
```

### Function arguments

Addons आमतौर पर ऑब्जेक्ट्स और फ़ंक्शंस का प्रकट करेंगे जिन्हें JavaScript द्वारा Node.js. के भीतर चलाया जा सकता है। जब JavaScript से फ़ंक्शन लागू किए जाते हैं, तो input arguments and return value को C/C ++ कोड से मैप किया जाना चाहिए।

निम्न उदाहरण JavaScript से पारित function arguments को कैसे पढ़ा जाए और परिणाम कैसे वापस करें:

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

संकलित हो जाने के बाद, उदाहरण addon की आवश्यकता हो सकती है और Node.js के भीतर से उपयोग की जा सकती है:

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```

### Callbacks

Addons के भीतर C++ फ़ंक्शन में JavaScript फ़ंक्शंस पास करने और वहां से निष्पादित करने की एक यह सामान्य प्रथा है। निम्न उदाहरण बताता है कि इस तरह के callback का आह्वान कैसे करें:

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

इसका परीक्षण करने के लिए, निम्न JavaScript चलाएं:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

In this example, the callback function is invoked synchronously.

### Object factory

निम्न उदाहरणों में दिखाए गए Addons के अनुसार C++ फ़ंक्शन के भीतर से नई ऑब्जेक्ट्स बना और वापस कर सकते हैं। एक ऑब्जेक्ट बनाया जाता है और एक अधिकार `msg` के साथ लौटाया जाता है जो string को `createObject()` पर पारित करता है:

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

JavaScript में इसका परीक्षण करने के लिए:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```

### Function factory

एक और आम परिदृश्य JavaScript फ़ंक्शंस बना रहा है जो C++ फ़ंक्शंस को सम्मिलित कर लेता है और उन्हें वापस JavaScript को भेज देता है:

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

परीक्षा करे:

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```

### Wrapping C++ objects

C ++ objects/classes को इस तरह से सम्मिलित करना भी संभव है जो JavaScript `new` ऑपरेटर का उपयोग करके नए उदाहरण बनाए जाने की अनुमति देता है:

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

फिर, `myobject.h` में, रैपर वर्ग `node::ObjectWrap` से प्राप्त होता है:

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

`myobject.cc` में, उन विभिन्न विधियों को लागू करें जिन्हें प्रकट किया जाना है। नीचे, विधि `plusOne()` इसे कन्स्ट्रक्टर के प्रोटोटाइप में जोड़कर प्रकट किया गया है:

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

इस उदाहरण को बनाने के लिए, `myobject.cc` फ़ाइल को `binding.gyp` में जोड़ा जाना चाहिए:

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

इसके साथ परीक्षण करें:

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

### Factory of wrapped objects

वैकल्पिक रूप से, जावास्क्रिप्ट `new` ऑपरेटर का उपयोग करके स्पष्ट रूप से ऑब्जेक्ट उदाहरण बनाने से बचने के लिए फ़ैक्टरी पैटर्न का उपयोग करना संभव है:

```js
const obj = addon.createObject();
// instead of:
// const obj = new addon.Object();
```

सबसे पहले, `createObject()` विधि `addon.cc` में लागू की गई है:

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

`myobject.h` में, स्थिर विधि `NewInstance()` ऑब्जेक्ट को तुरंत चालू करने के लिए जोड़ा जाता है। यह विधि जावास्क्रिप्ट में `new` का उपयोग करने की जगह लेती है:

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

`myobject.cc` में कार्यान्वयन पिछले उदाहरण के समान है:

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

एक बार फिर, इस उदाहरण को बनाने के लिए, `myobject.cc` फ़ाइल को `binding.gyp` में जोड़ा जाना चाहिए:

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

इसके साथ परीक्षण करें:

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

C++ ऑब्जेक्ट्स को लपेटने और वापस करने के अलावा, Node.js हेल्पर फ़ंक्शन `node::ObjectWrap::Unwrap` के साथ उन्हें अनपढ़ करके लपेटकर ऑब्जेक्ट पास करना संभव है। निम्नलिखित उदाहरण एक फ़ंक्शन `add()` दिखाते हैं जो इनपुट तर्क के रूप में दो `MyObject` ऑब्जेक्ट्स ले सकता है:

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

`myobject.h` में, ऑब्जेक्ट को खोलने के बाद निजी मानों तक पहुंच की अनुमति देने के लिए एक नई सार्वजनिक विधि जोड़ दी जाती है।

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

`myobject.cc` का कार्यान्वयन पहले जैसा ही है:

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

इसके साथ परीक्षण करें:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon.createObject(10);
const obj2 = addon.createObject(20);
const result = addon.add(obj1, obj2);

console.log(result);
// Prints: 30
```
