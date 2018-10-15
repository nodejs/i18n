# C++ Addons

<!--introduced_in=v0.10.0-->

<!-- type=misc -->

Node. js addons C++ में अस्थिर रूप से लिखे गये हैं। इनको [` require() `](modules.html#modules_require) function के ज़रिए Node.js में लाया जा सकता है एवं एक साधारण Node.js module की तरह भी उपयोग में लाया जा सकता है। वे मुख्य रूप से Node.js और C / C ++ libraries में चल रहे JavaScript के बीच एक इंटरफ़ेस प्रदान करने के लिए उपयोग किए जाते हैं।

फिलहाल, addons को लागू करने की विधि बहुत ही जटिल है, जिसमें कई घटकों और एपीआई के ज्ञान शामिल हैं, जैसे:

* V8: एक C++ पुस्तकालय जो Node.js वर्तमान में JavaScript को अमल करने के लिए उपयोग करता है। V8 objects, calling functions, आदि को बनाने के लिए तंत्र प्रदान करता है। V8 के एपीआई को अधिकतर `v8.h` हेडर फ़ाइल (`deps/v8/include/v8.h` जो Node.js के source tree में उपलब्ध है), और [online](https://v8docs.nodesource.com/) भी उपलब्ध है।

* [libuv](https://github.com/libuv/libuv): एक C पुस्तकालय जो Node.js event loop, इसके कार्यकर्ता threads और प्लेटफॉर्म के सभी असीमित व्यवहारों को लागू करती है। यह भी क्रॉस-प्लेटफार्म एब्स्ट्रक्शन लाइब्रेरी के रूप में कार्य करता है, जो आसान, पॉज़िक्स जैसा देता है कई प्रमुख ऑपरेटिंग सिस्टमों में कई सामान्य सिस्टम कार्यों में पहुंच, जैसे फाइल सिस्टम, सॉकेट, टाइमर, और सिस्टम इवेंट्स के साथ बातचीत के रूप में। libuv एक pthreads- जैसे थ्रेडिंग abstraction भी प्रदान करता है जिसका उपयोग किया जा सकता है शक्ति अधिक परिष्कृत एसिंक्रोनस एडॉन्स जिन्हें आगे बढ़ने की आवश्यकता है मानक घटना पाश। Addon लेखकों को इस बारे में सोचने के लिए प्रोत्साहित किया जाता है कि कैसे करें I / O या अन्य समय-गहन कार्यों के साथ ईवेंट लूप को अवरुद्ध करने से बचें libuv के माध्यम से गैर-अवरुद्ध प्रणाली संचालन, कार्यकर्ता धागे के माध्यम से ऑफ लोडिंग काम या libuv के धागे का एक कस्टम उपयोग।

* आंतरिक Node.js libraries: Node.js स्वयं कई सी ++ एपीआई निर्यात करता है कि एडॉन्स का उपयोग कर सकते हैं & mdash; जिनमें से सबसे महत्वपूर्ण है ` नोड:: ऑब्जेक्टवैप </ 0> कक्षा।</p></li>
<li><p>नोड.जेएस में कई अन्य स्थिर रूप से जुड़े पुस्तकालय शामिल हैं
OpenSSL। यह अन्य libraries Node.js के source tree में <code>deps/` निर्देशिका में स्थित हैं। केवल libuv, OpenSSL, V8 और zlib प्रतीकों को उद्देश्य से Node.js द्वारा पुनः निर्यात किया जाता है और इन्हेंaddons द्वारा विभिन्न तरीकों से उपयोग किया जा सकता है। अतिरिक्त जानकारी के लिए [Linking to Node.js' own dependencies](#addons_linking_to_node_js_own_dependencies) देखें।

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

[Native Abstractions for Node.js](https://github.com/nodejs/nan) (या `nan`) उपकरण का एक सेट प्रदान करते हैं जो addon डेवलपर्स को V8 और Node.js के पिछले और भविष्य के रिलीज के बीच संगतता रखने के लिए उपयोग करने की अनुशंसा की जाती है। इसका उपयोग कैसे किया जा सकता है इसका एक उदाहरण के लिए `nan` [उदाहरण](https://github.com/nodejs/nan/tree/master/examples/) देखें।

## N-API

> स्थिरता: 1 - प्रायोगिक

N-API मूल एडॉन्स बनाने के लिए एक API है। यह अंतर्निहित JavaScript रनटाइम (उदा। V8) से स्वतंत्र है और इसे Node.js के हिस्से के रूप में बनाए रखा जाता है। This API will be Application Binary Interface (ABI) stable across version of Node.js. इसका उद्देश्य अंतर्निहित JavaScript इंजन में परिवर्तनों से addons को अपनाना है और बिना किसी संकलन के Node.js के बाद के संस्करणों पर चलाने के लिए एक संस्करण के लिए संकलित मॉड्यूल को अनुमति देना है। Addons इस दस्तावेज़ (node-gyp, इत्यादि) में उल्लिखित एक ही दृष्टिकोण/उपकरण के साथ निर्मित किए गए हैं। केवल अंतर API के सेट में है जो मूल कोड द्वारा उपयोग किया जाता है। V8 या [Native Abstractions for Node.js](https://github.com/nodejs/nan) का उपयोग करने के बजाय, N-API में उपलब्ध फ़ंक्शंस का उपयोग किया जाता है।

उपर्युक्त "हैलो वर्ल्ड" उदाहरण में N-API का उपयोग करने के लिए, निम्नलिखित के साथ `hello.cc` की सामग्री को प्रतिस्थापित करें। अन्य सभी निर्देश सामन्य रुप से लागु रहेंगे।

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

उपलब्ध कार्यों और उनका उपयोग कैसे करें [C/C++ addons - N-API](n-api.html) शीर्षक वाले अनुभाग में दस्तावेज हैं।

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

ऐसे मामलों में जहां एक से अधिक `.cc` फ़ाइल है, बस `sources` array में अतिरिक्त फ़ाइल नाम जोड़ें:

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

ध्यान दें कि यह उदाहरण `Init()` के two-argument फ़ॉर्म का उपयोग करता है जो second argument के रूप में पूर्ण `module` ऑब्जेक्ट को प्राप्त करता है। यह addon को `exports` के अधिकार के रूप में फ़ंक्शन जोड़ने की बजाय एक ही फ़ंक्शन के साथ `exports` को पूरी तरह ओवरराइट करने की अनुमति देता है।

इसका परीक्षण करने के लिए, निम्न JavaScript चलाएं:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

ध्यान दें कि, इस उदाहरण में, callback फ़ंक्शन को synchronize किया जाता है।

### Object factory

निम्न उदाहरणों में दिखाए गए Addons के अनुसार C++ फ़ंक्शन के भीतर से नई ऑब्जेक्ट्स बना और वापस कर सकते हैं। एक ऑब्जेक्ट बनाया जाता है और एक अधिकार `msg` के साथ लौटाया जाता है जो string को `createObject()` पर पारित करता है:

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
  static v8::Persistent<v8::Function> constructor;
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
  static v8::Persistent<v8::Function> constructor;
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
  static v8::Persistent<v8::Function> constructor;
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

### AtExit hooks

एक `AtExit` हुक एक ऐसा फ़ंक्शन है जिसे Node.js इवेंट लूप समाप्त होने के बाद बुलाया जाता है लेकिन JavaScript VM समाप्त होने से पहले और Node.js बंद हो जाता है। `AtExit` हुक `node::AtExit` API का उपयोग करके पंजीकृत हैं।

#### void AtExit(callback, args)

* `callback` <span class="type">&lt;void (\<em>)(void\</em>)&gt;</span> बाहर निकलने पर कॉल करने के लिए फ़ंक्शन के लिए एक सूचक।
* `args` <span class="type">&lt;void\*&gt;</span> बाहर निकलने पर कॉलबैक पास करने के लिए एक सूचक।

रजिस्टर्स इवेंट लूप समाप्त होने के बाद चलने वाले हुक से बाहर निकलते हैं लेकिन VM मारे जाने से पहले।

`AtExit` दो पैरामीटर लेता है: बाहर निकलने के लिए callback फ़ंक्शन के लिए पॉइंटर, और उस callback को पारित किए गए संदर्भित डेटा को पॉइंटर।

कॉलबैक last-in first-out ऑर्डर में चलाए जाते हैं।

निम्नलिखित `addon.cc` लागू `AtExit`:

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

JavaScript में चलाकर परीक्षण करें:

```js
// test.js
require('./build/Release/addon');
```