# Complementos em C++

<!--introduced_in=v0.10.0-->

Complementos Node.js são vinculados dinamicamente como objetos compartilhados, escritos em C++, que podem ser carregados no Node.js com a função [`require()`](modules.html#modules_require), e usados como se fossem um módulo Node.js comum. Eles são usados principalmente para fornecer uma interface entre o JavaScript em execução e bibliotecas de Node.js e C/C++.

No momento, a forma para implementar complementos é complicada, envolvendo conhecimento de vários componentes e APIs :

 - V8: biblioteca C++ que o Node.js usa atualmente para fornecer a implementação do JavaScript. V8 fornece os mecanismos para a criação de objetos, chamada de funções, etc. A API do V8 é documentada principalmente no arquivo de cabeçalho `v8.h` (`deps/v8/include/v8.h` na árvore do código fonte do Node.js), que também está disponível [on-line](https://v8docs.nodesource.com/).

 - [libuv](https://github.com/libuv/libuv): biblioteca C que implementa o ciclo de eventos do Node.js, suas linhas de trabalho e todos os comportamentos assíncronos da plataforma. Serve também como uma biblioteca de abstração multi-plataforma, dando acesso fácil, no estilo POSIX, aos principais sistemas operacionais para muitas tarefas comuns de sistema, tais como interagir com os sistema de arquivos, soquetes, temporizadores e sistema de eventos. libuv também fornece uma abstração de segmentação de pthreads, como que pode ser utilizada para alimentar assíncronos mais sofisticados, Complementos que precisam ir além do ciclo de eventos padrão. Autores de complementos são encorajados a pensar em como evitar o bloqueio do loop de eventos com E/S ou outras tarefas de uso intensivo, descarregando o trabalho via libuv para operações de sistema não-bloqueantes, worker threads ou uso personalizado de threads do libuv.

 - Bibliotecas internas de Node.js. Node.js exporta para si um número de APIs de C++ que Addons pode usar &mdash;, o mais importante dos quais é a classe de `node::ObjectWrap`.

 - Node.js inclui um grande número de outras bibliotecas estaticamente vinculadas, incluindo OpenSSL. Estas outras bibliotecas estão localizadas no diretório `deps` na árvore de código fonte do Node.js. Apenas os símbolos de libuv, OpenSSl, V8 e zlib são propositalmente reexportados e podem ser usados em fins diferentes por Complementos. Veja [Vinculando às próprias dependências do Node.js](#addons_linking_to_node_js_own_dependencies) para mais informações.

Todos os exemplos a seguir estão disponíveis para [download](https://github.com/nodejs/node-addon-examples) e podem ser usados como um ponto de partida para um Addon.

## Hello World

Este exemplo de "Hello world" é um Complemento simples, escrito em C++, que é o equivalente ao seguinte código JavaScript:

```js
module.exports.hello = () => 'world';
```

Primeiro, crie o arquivo `hello.cc`:

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

Observe que todos os complementos de Node.js devem exportar uma função de inicialização seguindo o padrão a seguir:

```cpp
void Initialize(Local<Object> exports);
NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
```

Não há ponto e vírgula depois de `NODE_MODULE` já que não é uma função (veja em `node.h`).

The `module_name` must match the filename of the final binary (excluding the .node suffix).

No exemplo `hello.cc`, em seguida, a função de inicialização é `init` e o nome do módulo Addon é `addon`.

### Construindo

Uma vez que o código fonte tenha sido escrito, ele precisa se compilado no arquivo binário `addon.node`. Para fazer isso, crie um arquivo chamado `binding.gyp` na raiz do projeto descrevendo a build de configuração do módulo utilizando um formato estilo JSON. Esse arquivo é utilizado pelo [node-gyp](https://github.com/nodejs/node-gyp) — uma ferramenta escrita especificamente para compilar complementos de Node.js.

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

*Note*: A version of the `node-gyp` utility is bundled and distributed with Node.js as part of `npm`. Esta versão não é diretamente disponibilizada para desenvolvedores usarem e serve apenas para usar o comando `npm install` para compilar e instalar Complementos. Desenvolvedores que desejam usar `node-gyp` diretamente podem instalá-lo usando o comando `npm install -g node-gyp`. Veja as [instruções de instalação](https://github.com/nodejs/node-gyp#installation) do `node-gyp` para mais informações, incluindo requisitos específicos de cada plataforma.

Uma vez que o arquivo do `binding.gyp` foi criado, use `node-gyp configure` para gerar os arquivos de construção do projeto apropriados para a atual plataforma. Isto pode gerar tanto um arquivo `Makefile` (em plataformas do tipo Unix) quanto um `vcxproj` (no Windows) no diretório `build/`.

Em seguida, invoque o comando `node-gyp build` para gerar o arquivo compilado `addon.node`. Isto será posto no diretório `build/Release/`.

Ao usar `npm install` para instalar um Complemento do Node.js, npm usa sua própria versão inclusa do `node-gyp` para executar este mesmo conjunto de ações, gerando uma versão compilada do Complemento para a plataforma em demanda do usuário.

Uma vez construído, o Complemento binário pode ser usado dentro do Node.js apontando um [`require()`](modules.html#modules_require) para o módulo `addon.node` construído:

```js
// hello.js
const addon = require('./build/Release/addon');

console.log(addon.hello());
// Printa: 'world'
```

Por favor, veja os exemplos abaixo para mais informações, ou <https://github.com/arturadib/node-qt> para um exemplo em produção.

Por variar o caminho até o Complemento compilado dependendo de como é compilado (isto é, ás vezes acaba estando no `./build/Debug/`), Complementos podem usar o pacote [bindings](https://github.com/TooTallNate/node-bindings) para carregar o módulo compilado.

Note que, ao passo que o pacote `bindings` é mais sofisticado na forma que localiza módulos dum Complemento, este usa nada mais que um modelo try-catch similar a:

```js
try {
  return require('./build/Release/addon.node');
} catch (err) {
  return require('./build/Debug/addon.node');
}
```

### Vinculando às próprias dependências do Node.js

Node.js usa um grande número de bibliotecas estaticamente vinculadas como V8, libuv e OpenSSL. Todos os Complementos precisam se vincular ao V8 e também podem se vincular a qualquer uma das outras dependências. Normalmente, isto é tão simples quanto incluir a declaração apropriada `#include <...>` (isto é, `#include &lt;v8.h&gt;`), e o `node-gyp` localizará automaticamente os cabeçalhos apropriados. No entanto, há algumas ressalvas:

* Quando `node-gyp` rodar, ele detectará a versão específica de lançamento do Node.js e baixará ou o tarball-fonte completo ou apenas os cabeçalhos. Se o código-fonte inteiro for baixado, Complementos terão acesso completo ao conjunto completo de dependências do Node.js. No entanto, se apenas os cabeçalhos do Node.js forem baixados, apenas os símbolos exportados pelo Node.js serão disponibilizados.

* `node-gyp` pode ser rodado usando a bandeira `--nodedir` apontando a uma imagem local fonte do Node-js. Usando esta opção, o Complemento terá acesso ao conjunto completo de dependências.

### Carregando Complementos usando require()

A extensão do nome do arquivo do Complemento binário compilado é `.node` (ao contrário de `.dll` ou de `.so`). A função [`require()`](modules.html#modules_require) é escrita para procurar por arquivos com a extensão `.node` e inicializá-las como bibliotecas dinamicamente vinculadas.

Ao chamar [`require()`](modules.html#modules_require), a extensão `.node` pode ser na maioria das vezes omitida e Node.js ainda assim encontrará e inicializará o Complemento. Uma ressalva é a de que, no entanto, Node.js irá primeiro tentar localizar e carregar os módulos ou arquivos JavaScript que aconteçam de compartilhar o mesmo nome de base. Por exemplo, se há um arquivo `addon.js` no mesmo diretório que o binário `addon.node`, então [`require('addon')`](modules.html#modules_require) dará precedência para o arquivo `addon.js` e o carregará no lugar.

## Abstrações Nativas para o Node.js

Cada um dos exemplos ilustrados neste documento fazem uso direto do node.js e das APIs do V8 para a implementação dos Complementos. É importante entender que a API V8 pode e tem mudado dramaticamente dum V8 lançado em relação ao próximo (e um grande lançamento do Node.js em sequência). Com cada mudança, Complementos precisam ser atualizados ou recompilados para continuar funcionando. O cronograma de lançamentos do Node.js é feito para minimizar a frequência e o impacto de tais alterações, mas não há muito que o Node.js possa fazer para garantir a estabilidade das APIs do V8.

As [Native Abstractions for Node.js](https://github.com/nodejs/nan) (ou `nan`) providencia um conjunto de ferramentas recomendado a desenvolvedores de Complementos usarem para manter a compatibilidade entre lançamentos passados e futuros do V8 e do Node.js. Veja os [exemplos](https://github.com/nodejs/nan/tree/master/examples/) das `nan` que ilustram como podem ser usadas.


## N-API

> Estabilidade: 1 - Experimental

N-API é uma API para construir Complementos nativos. É independente do tempo de execução subjacente do JavaScript (por exemplo, V8) e é mantido como parte do Node.js, em si. Este API será Application Binary Interface (ABI) estável através da versão de Node.js. Destina-se a isolar Complementos de mudanças no motor JavaScript subjacente e permitir módulos compilado para uma versão para rodar em versões posteriores do Node.js sem recompilação. Os complementos são construídos/empacotados com a mesma abordagem/ferramentas descrito neste documento (node-gyp, etc.). A única diferença é o conjunto de APIs usados pelo código nativo. Em vez de usar o V8 ou [Abstrações Nativa para Node.js](https://github.com/nodejs/nan) APIs, as funções que está disponíveis no N-API são usadas.

Para usar N-API no exemplo acima "Hello world", substitua o conteúdo de `hello.cc` com o seguinte. Todas as outras instruções permanecem as mesmas.

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

As funções disponíveis e como usá-las estão documentadas na seção entitulada [C/C++ Addons - N-API](n-api.html).

## Exemplos de complementos

Abaixo estão alguns exemplos de complementos, destinados a ajudar os desenvolvedores que estão começando. Os exemplos fazem uso das APIs V8. Consulte a referência [ V8 online ](https://v8docs.nodesource.com/) para obter ajuda com as várias chamadas V8 e o [ Guia do Embedder ](https://github.com/v8/v8/wiki/Embedder's%20Guide) do V8 para um explicação de vários conceitos utilizados, tais como alças, escopos, função modelos, etc.

Cada um destes exemplos usando o seguinte arquivo `binding.gyp`:

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

Nos casos em que há mais de um arquivo `.cc` simplesmente adicione o nome de arquivo adicional para o `sources` array. Por exemplo:

```json
"sources": ["addon.cc", "myexample.cc"]
```

Uma vez que o arquivo `binding.gyp` está pronto, os exemplos dos Complementos podem ser configurados e construídos usando `node-gyp`:

```console
$ node-gyp configure build
```


### Argumentos de função

Complementos normalmente expõem objetos e funções que podem ser acessados a partir de JavaScript rodando dentro do Node.js. Quando as funções são invocadas do JavaScript, os argumentos de entrada e valor de retorno devem ser mapeados para e do código C/C++.

O exemplo a seguir ilustra como ler argumentos de funções passados de JavaScript e como retornar um resultado:

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

// Esta é a implementação do método "add"
// Argumentos de entrada são passados ​​usando o
// const FunctionCallbackInfo <Value>& args struct
void Add (const FunctionCallbackInfo <Value>& args) {
  Isolate* isolate = args.GetIsolate ();

  // Verifique o número de argumentos passados.
  if (args.Length() < 2) {
    // Lançar um erro que é passado de volta ao JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Wrong number of arguments")));
    return;
  }

  // Verifique os tipos de argumentos
  if (!args[0]->IsNumber() || !args[1]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate, "Wrong arguments")));
    return;
  }

  // Realize a operação
  double value = args[0]->NumberValue() + args[1]->NumberValue();
  Local<Number> num = Number::New(isolate, value);

  // Defina o valor de retorno (usando o valor passado
  // FunctionCallbackInfo<Value>&)
  args.GetReturnValue().Set(num);
}

void Init(Local<Object> exports) {
  NODE_SET_METHOD(exports, "add", Add);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```

Uma vez compilado, o exemplo do complemento pode ser requerido e usado dentro do Node.js:

```js
// test.js
const addon = require('./build/Release/addon');

console.log('This should be eight:', addon.add(3, 5));
```


### Callbacks

É prática comum dentro com Complementos passar funções JavaScript para uma função C ++ e executá-los de lá. O exemplo a seguir ilustra como para invocar tais callbacks:

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

Note que este exemplo usa um formulário de dois argumentos de `Init()` que recebe o objeto `módulo` completo como o segundo argumento. Isto permite que o Complemento sobrescreva completamente `exports` com uma única função em vez de adicionar a função como uma propriedade de `exports`.

Para testar, execute o seguinte JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

addon((msg) => {
  console.log(msg);
// Prints: 'hello world'
});
```

Observe que, neste exemplo, a função de retorno de chamada é invocada de forma síncrona.

### Fábrica de objetos

Complementos podem criar e retornar novos objetos de dentro de uma função C ++ como ilustrado no exemplo a seguir. Um objeto é criado e retornado com uma propriedade `msg` que ecoa a string passada para `createObject()`:

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

Para testar em JavaScript:

```js
// test.js
const addon = require('./build/Release/addon');

const obj1 = addon('hello');
const obj2 = addon('world');
console.log(obj1.msg, obj2.msg);
// Prints: 'hello world'
```


### Fábrica de funções

Outro cenário comum é criar funções JavaScript que envolvam funções C ++ e retornando de volta ao JavaScript:

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

  // omitir isso para torná-lo anônimo
  fn->SetName(String::NewFromUtf8(isolate, "theFunction"));

  args.GetReturnValue().Set(fn);
}

void Init(Local<Object> exports, Local<Object> module) {
  NODE_SET_METHOD(module, "exports", CreateFunction);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Init)

}  // namespace demo
```

Para testar:

```js
// test.js
const addon = require('./build/Release/addon');

const fn = addon();
console.log(fn());
// Prints: 'hello world'
```


### Agregando Objetos C ++

É também possível agregar objetos/classes C++ de uma forma que permite que novas instâncias sejam criadas usando o operador JavaScript `new`:

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

Depois, em `myobject.h`, a classe agregada herda de `node::ObjectWrap`:

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

Em `myobject.cc`, implemente os vários métodos que devem ser expostos. Abaixo, o método `plusOne()` é exposto ao adicioná-lo ao protótipo do construtor:

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

  // Protótipo
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  constructor.Reset(isolate, tpl->GetFunction());
  exports->Set(String::NewFromUtf8(isolate, "MyObject"),
               tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Chamado como construtor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
// Chamado como função simples `MyObject (...)`, transformar em Call de construção.
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

Para construir este exemplo, o arquivo `myobject.cc` deve ser adicionado ao `binding.gyp`:

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

Teste com:

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

### Fábrica de objetos agregados

Alternativamente, é possível usar um padrão de fábrica para evitar explicitamente criar instâncias de objeto usando o operador JavaScript `new`:

```js
const obj = addon.createObject();
// ao invés de:
// const obj = new addon.Object();
```

Primeiro, o método `createObject()` é implementado em `addon.cc`:

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

Em `myobject.h`, o método estático `NewInstance()` é adicionado para lidar com o objeto em instância. Este método substitui o uso de `new` em JavaScript:

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

A implementação em `myobject.cc` é semelhante ao exemplo anterior:

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

  // Protótipo
  NODE_SET_PROTOTYPE_METHOD(tpl, "plusOne", PlusOne);

  constructor.Reset(isolate, tpl->GetFunction());
}

void MyObject::New(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  if (args.IsConstructCall()) {
    // Chamado como construtor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
// Chamado como função simples `MyObject (...)`, transformar em call de construção.
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

Novamente, para construir este exemplo, o arquivo `myobject.cc` deve ser adicionado ao `binding.gyp`:

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

Teste com:

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


### Passando objetos agregados

Além de agregar e retornar objetos C++, é possível passar objetos agregados ao desagrega-los com a função de ajuda do Node.js `node::ObjectWrap::Unwrap`. Os seguintes exemplos mostram uma função `add()` que pode levar dois objetos `MyObject` como argumentos de entrada:

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

Em `myobject.h`, é adicionado um novo método público para permitir acesso a valores privados após desagregar o objeto.

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

A implementação de `myobject.cc` é semelhante a antes:

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
    // Chamado como construtor: `new MyObject(...)`
    double value = args[0]->IsUndefined() ? 0 : args[0]->NumberValue();
    MyObject* obj = new MyObject(value);
    obj->Wrap(args.This());
    args.GetReturnValue().Set(args.This());
  } else {
// Chamado como função simples `MyObject (...)`, transformar em Call de construção.
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

Teste com:

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

Registra exit hooks que são executados após o término do loop de eventos ser finalizado mas antes da VM ser encerrada.

AtExit usa dois parâmetros: um comando para uma função de callback para executar na saída, e um comando para dados de contexto não tipificados a serem passados ​​para esse callback.

Callbacks são executadas no último pedido de entrada.

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

Teste em JavaScript executando:

```js
// test.js
require('./build/Release/addon');
```
