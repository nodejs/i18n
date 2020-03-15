# Async Hooks

<!--introduced_in=v8.1.0-->

> Estabilidade: 1 - Experimental

O módulo `async_hooks` fornece uma API para registrar callbacks rastreando tempo de vida de recursos assíncronos criados dentro de um aplicativo Node.js. É possível acessá-lo utilizando:

```js
const async_hooks = require('async_hooks');
```

## Terminologia

Um recurso assíncrono representa um objeto com um callback associado. This callback may be called multiple times, for example, the `connection` event in `net.createServer`, or just a single time like in `fs.open`. A resource can also be closed before the callback is called. AsyncHook does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

## API pública

### Visão geral

A Seguir é uma visão simples da API pública.

```js
const async_hooks = require('async_hooks');

// Retorna o ID do contexto de execução atual.
const eid = async_hooks.executionAsyncId();

// Retornar o ID do identificador responsável por acionar o callback do
// escopo de execução atual para chamar.
const tid = async_hooks.triggerAsyncId();

// Cria uma nova instância de AsyncHook. Todas estas callbacks são opcionais.
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });

// Permite que os callbacks desta instância de AsyncHook chamem. Esta ação não é implícita
// depois de executar o construtor, e deve ser executada explicitamente para iniciar
// executando callbacks.
asyncHook.enable();

// Desativar a escuta de novos eventos assíncronos.
asyncHook.disable();

//
// Os seguintes são os callbacks que podem ser passados para createHook().
//

// init é chamado durante a construção do objeto. O recurso pode não ter
// completado a construção quando este callback executa, portanto, todos os campos do
// recurso referenciado por "asyncId" podem não ter sido preenchidos.
function init(asyncId, type, triggerAsyncId, resource) { }

// antes de ser chamado antes do recurso de callback da chamada. Pode ser
// chamado 0-N vezes para os handles (ex: TCPWrap), e será chamado exatamente 1
// vez para solicitações (ex. FSReqWrap).
function before(asyncId) { }

// depois de ser chamada imediatamente após a callback do recurso ter terminado.
function after(asyncId) { }

// destroy é chamado quando uma instância de AsyncWrap é destruída.
function destroy(asyncId) { }

// promiseResolve é chamado apenas para recursos de promessa, quando a função
/ `resolve` passou para o construtor `Promise` é invocada
// (diretamente ou através de outros meios de resolução de uma promessa).
function promiseResolve(asyncId) { }
```

#### `async_hooks.createHook(callbacks)`

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} The [Hook Callbacks](#async_hooks_hook_callbacks) to register
  * `init` {Function} The [`init` callback][].
  * `before` {Function} The [`before` callback][].
  * `after` {Function} The [`after` callback][].
  * `destroy` {Function} The [`destroy` callback][].
* Retorna: {AsyncHook} instância usada para desativar e ativar hooks

Registra funções a serem chamadas para eventos de vida diferentes de cada operação async.

Os callbacks `init()`/`before()`/`after()`/`destroy()` são chamados para o evento assíncrono respectivo durante o tempo de vida de um recurso.

Todos estes callbacks são opcionais. Por exemplo, se apenas a limpeza de recursos precisar ser rastreado, então apenas o callback `destroy` precisa ser aprovado. As especialidades de todas as funções que podem ser aprovadas para `callbacks` está na seção [Hook Callbacks](#async_hooks_hook_callbacks).

```js
const async_hooks = require('async_hooks');

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) { },
  destroy(asyncId) { }
});
```

Note que os callbacks serão herdados através da cadeia de protótipo:

```js
class MyAsyncCallbacks {
  init(asyncId, type, triggerAsyncId, resource) { }
  destroy(asyncId) {}
}

class MyAddedCallbacks extends MyAsyncCallbacks {
  before(asyncId) { }
  after(asyncId) { }
}

const asyncHook = async_hooks.createHook(new MyAddedCallbacks());
```

##### Tratamento de erros

Se qualquer `AsyncHook` lançar callbacks, o aplicativo imprimirá o stack trace e sairá. The exit path does follow that of an uncaught exception, but all `uncaughtException` listeners are removed, thus forcing the process to exit. Os `'exit'` callbacks ainda serão chamados a menos que o aplicativo seja executado com `--abort-on-uncaught-exception`, nesse caso, um stack trace será impresso e o aplicativo sai, deixando um arquivo central.

O motivo desse comportamento de tratamento de erros é que esses callbacks estão executando em pontos potencialmente voláteis no tempo de vida de um objeto, por exemplo durante a construção e destruição de classe. Por isso, considera-se necessário derrubar o processo rapidamente, a fim de evitar um aborto não intencional no futuro. Isso está sujeito a mudanças no futuro se uma análise abrangente for realizada para garantir que uma exceção possa seguir o fluxo de controle normal sem efeitos colaterais não intencionais.


##### Imprimindo em AsyncHooks callbacks

Porque a impressão para o console é uma operação assíncrona, `console.log()` fará com que as AsyncHooks callbacks sejam chamadas. Usando `console.log()` ou operações assíncronas semelhantes dentro de uma função AsyncHooks callback irá assim causar uma recursão infinita. Uma solução fácil para isso quando depurando é usar uma operação de registro de síncrona como `fs.writeSync(1, msg)`. Isto irá imprimir para stdout porque `1` é o descritor de arquivo para stdout e não irá invocar AsyncHooks recursivamente porque é síncrono.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use uma função como essa quando estiver depurando dentro de um AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

Se uma operação assíncrona é necessária para o registro, é possível manter rastreio do que causou a operação assíncrona usando as informações fornecidas pelo próprio AsyncHooks. O registro deve ser ignorado quando foi o próprio registro que causou o AsyncHooks callback a chamar. Ao fazer isso a recursão infinita é quebrada.

#### `asyncHook.enable()`

* Retorna: {AsyncHook} Uma referência a `asyncHook`.

Ativar as callbacks para uma dada instância `AsyncHook`. Se callbacks não são fornecidos a habilitação é um noop.

A instância `AsyncHook` é desativada por padrão. Se a instância `AsyncHook` deve ser ativada imediatamente após a criação, o seguinte padrão pode ser usado.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### `asyncHook.disable()`

* Retorna: {AsyncHook} Uma referência a `asyncHook`.

Disable the callbacks for a given `AsyncHook` instance from the global pool of AsyncHook callbacks to be executed. Uma vez que um hook tenha sido desativado, ele não irá ser chamado novamente até ser habilitado.

Para a consistência da API `disable()` também retorna a instância `AsyncHook`.

#### Hook Callbacks

Eventos chave no tempo de vida de eventos assíncronos foram categorizados em quatro áreas: instanciação, antes/depois que a callback é chamada, e quando a instância é destruída.

##### `init(asyncId, type, triggerAsyncId, resource)`

* `asyncId` {number} Um ID único para o recurso async.
* `type` {string} O tipo do recurso async.
* `triggerAsyncId` {number} A ID única do recurso async em cujo contexto de execução este recurso async foi criado.
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during _destroy_.

Chamado quando uma classe é construída que tem a _possibilidade_ de emitir um evento assíncrono. Isso _não_ significa que a instância deva chamar `before`/`after` antes de `destroy` ser chamada, apenas que a possibilidade existe.

Este comportamento pode ser observado fazendo algo como abrir um recurso e então fechá-lo antes que o recurso possa ser usado. O seguinte snippet demonstra isto.

```js
require('net').createServer().listen(function() { this.close(); });
// Ou
clearTimeout(setTimeout(() => {}, 10));
```

Cada novo recurso é atribuído a um ID que é único no escopo do processo atual.

###### `tipo`

O `type` é uma string identificando o tipo de recurso que causou `init` a ser chamado. Geralmente, ela corresponderá ao nome do construtor do recurso.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

Há também o tipo de recurso `PROMISE` que é usado para acompanhar instâncias `Promise` e trabalhos assíncronos programados por elas.

Os usuários podem definir sua própria `type` quando usando a API de incorporação pública.

*Note:* It is possible to have type name collisions. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerId`

`triggerAsyncId` é o `asyncId` do recurso que causou (ou "acionou") o novo recurso para inicializar e que causou `init` a chamar. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.


A seguinte é uma simples demonstração de `triggerAsyncId`:

```js
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    fs.writeSync(
      1, `${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${eid}\n`);
  }
}).enable();

require('net').createServer((conn) => {}).listen(8080);
```

Output ao atingir o servidor com `nc localhost 8080`:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TCPWRAP(4): trigger: 2 execution: 0
```

O `TCPSERVERWRAP` é o servidor que recebe as conexões.

O `TCPWRAP` é a nova conexão do cliente. When a new connection is made the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack (side note: a `executionAsyncId()` of `0` means it's being executed from C++, with no JavaScript stack above it). With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `recurso`

`resource` é um objeto que representa o recurso assíncrono atual que foi inicializado. Isto pode conter informações úteis que podem variar com base no valor de `type`. Por exemplo, para o tipo de recurso `GETADDRINFOREQWRAP`, `resource` fornece o hostname usado ao procurar o endereço IP para o hostname em `net.Server.listen()`. A API para acessar esta informação não é atualmente considerada pública, mas usando a API Embedder, os usuários podem fornecer e documentar seus próprios objetos de recurso. Por exemplo, tal objeto de recurso poderia conter a consulta SQL sendo executada.

In the case of Promises, the `resource` object will have `promise` property that refers to the Promise that is being initialized, and a `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent Promise of `b`. Aqui, `b` é considerado uma promessa encadeada.

*Note*: In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

###### Exemplo de contexto assíncrono

O seguinte é um exemplo com informações adicionais sobre as chamadas para `init` entre as chamadas `before` e `after`, especificamente como a callback para `listen()` irá parecer. A formatação de saída é ligeiramente mais elaborada para tornar o contexto de chamadas mais fácil de ver.

```js
let indent = 0;
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    const indentStr = ' '.repeat(indent);
    fs.writeSync(
      1,
      `${indentStr}${type}(${asyncId}):` +
      ` trigger: ${triggerAsyncId} execution: ${eid}\n`);
  },
  before(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}before:  ${asyncId}\n`);
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}after:   ${asyncId}\n`);
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}destroy: ${asyncId}\n`);
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Vamos aguardar 10ms antes de iniciar o login no servidor.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Saída apenas por iniciar o servidor:

```console
TCPSERVERWRAP(2): disparar: 1 execução: 1
TickObject(3): disparar: 2 execução: 1
antes: 3
  Timeout(4): disparar: 3 execução: 3
  TIMERWRAP(5): disparar: 3 execução: 3
depois: 3
destruir: 3
antes: 5
  antes: 4
    TTYWRAP(6): disparar: 4 execução: 4
    SIGNALWRAP(7): disparar: 4 execução: 4
    TTYWRAP(8): disparar: 4 execução: 4
>>> 4
    TickObject(9): disparar: 4 execução: 4
  depois: 4
depois: 5
antes: 9
depois: 9
destruir: 4
destruir: 9
destruir: 5
```

*Note*: As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

Apenas usando `execution` para gráfico de alocação de recursos resulta no seguinte:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

O `TCPSERVERWRAP` não faz parte deste gráfico, embora tenha sido o motivo para a chamada de `console.log()`. Isto é porque vincular a uma porta sem um hostname é uma operação *síncrona* mas para manter uma API totalmente assíncrona o callback do usuário é colocado em um `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.


##### `before(asyncId)`

* `asyncId` {number}

Quando uma operação assíncrona é iniciada (como um servidor TCP recebendo uma nova conexão) ou completa (como escrever dados no disco) um callback é chamado para notificar o usuário. O callback `before` é chamado apenas antes do prévio callback ser executado. `asyncId` é o identificador único atribuído ao recurso prestes a executar o callback.

O callback `before` será chamado de 0 a N vezes. O callback `before` normalmente será chamado 0 vezes se a operação assíncrona foi cancelada ou, por exemplo, se nenhuma conexão for recebida por um servidor TCP. Recursos assíncronos persistentes como um servidor TCP normalmente chamarão o callback `before` múltiplas vezes, enquanto outras operações como `fs.open()` chamarão apenas uma vez.


##### `after(asyncId)`

* `asyncId` {number}

Chamado imediatamente após o callback especificado em `before` ser concluído.

*Note:* If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.


##### `destroy(asyncId)`

* `asyncId` {number}

Chamado após o recurso correspondente a `asyncId` for destruído. É também chamada assíncrona da API incorporada `emitDestroy()`.

*Note:* Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### `promiseResolve(asyncId)`

* `asyncId` {number}

Chamado quando a função `resolve` passou para `Promise` o construtor é invocado (diretamente ou através de outros meios de resolução de uma promessa).

Note que `resolve()` não faz qualquer trabalho síncrono observável.

*Note:* This does not necessarily mean that the `Promise` is fulfilled or rejected at this point, if the `Promise` was resolved by assuming the state of another `Promise`.

Por exemplo:

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

chama as seguintes callbacks:

```text
init para PROMISE com id 5, dispara id: 1
  promessa resolve 5      # corresponde para resolver(true)
init para PROMISE com id 6, dispara id: 5  # a Promessa retornada para then()
  Antes 6               # o callback then() é adicionado
  Promessa resolve 6      # o callback then() resolve a promessa retornando
  depois 6
```

#### `async_hooks.executionAsyncId()`

<!-- YAML
added: v8.1.0
changes:
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from currentId
-->

* Retorna: {number} O `asyncId` do atual contexto de execução. Útil para acompanhar quando algo chamar.

Por exemplo:

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

O ID retornado de `executionAsyncId()` está relacionado ao timing de execução, não causalidade (que está coberto por `triggerAsyncId()`). Por exemplo:

```js
const server = net.createServer(function onConnection(conn) {
  // Retorna o ID do servidor, não da nova conexão, porque o
  // onConnection callback é executado no escopo de execução do servidor
  // MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, function onListening() {
  // Retorna o ID de um TickObject (ou seja, process.nextTick()) porque todos os
  // callbacks passado para .listen() são encapsulados em um nextTick().
  async_hooks.executionAsyncId();
});
```

Note que contextos de promessas podem não conseguir precisamente executionAsyncIds por padrão. Veja a seção em [rastreamento de execução de promessas](#async_hooks_promise_execution_tracking).

#### `async_hooks.triggerAsyncId()`

* Retorna: {number} O ID do recurso responsável por chamar o callback que está sendo executado atualmente.

Por exemplo:

```js
const server = net.createServer((conn) => {
  // O recurso que causou (ou disparou) esta callback a ser chamada
  // foi a da nova conexão. Assim, o valor de devolução do triggerAsyncId()
  // é o asyncId de "conn".
  async_hooks.triggerAsyncId();

}).listen(port, () => {
  // Embora todas as callbacks passadas para .listen() estejam encapsulados em um nextTick()
  // o callback já existe porque a chamada para o .listen() do servidor
  // foi feita. Assim, o valor de retorno seria o ID do servidor.
  async_hooks.triggerAsyncId();
});
```

Note que contextos de promessas pode não conseguir validar triggerAsyncId por padrão. Veja a seção em [rastreamento de execução de promessas](#async_hooks_promise_execution_tracking).

## Rastreamento de execução de Promessa

By default, promise executions are not assigned asyncIds due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. Isto significa que programas usando promessas ou `async`/`await` não receberão execução correta e disparar ids para contextos de callback de promessas por padrão.

Aqui está um exemplo:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produz:
// eid 1 tid 0
```

Observe that the `then` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the triggerAsyncId value is 0, which means that we are missing context about the resource that caused (triggered) the `then` callback to be executed.

Instalando async hooks via `async_hooks.createHook` permite execução de rastreamento de promessa. Exemplo:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // força PromiseHooks à ser habilitado.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// Produz:
// eid 7 tid 6
```

Neste exemplo, adicionar qualquer função atual de hook permitiu o rastreamento de promessas. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then`. In the example above, the first promise got the asyncId 6 and the latter got asyncId 7. During the execution of the `then` callback, we are executing in the context of promise with asyncId 7. This promise was triggered by async resource 6.

Outra sutileza com promessas é que callbacks `before` e `after` são executados somente em promessas encadeadas. That means promises not created by `then`/`catch` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## API Embedder JavaScript

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### `class AsyncResource()`

A classe `AsyncResource` foi projetada para ser estendida pelos recursos assíncronos incorporados. Usando isto, os usuários podem facilmente disparar os eventos do tempo de vida de seus próprios recursos.

O hook `init` irá disparar quando um `AsyncResource` for instanciado.

A seguinte está uma visão geral da API `AsyncResource`.

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() deve ser estendido. Instanciando um
// novo AsyncResource() também desencadeia init. Se o triggerAsyncId for omitido, então
// async_hook.executionAsyncId() é usado.
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Executa uma função no contexto de execução do recurso. Isso irá
// * estabelecer o contexto do recurso
// * disparar o AsyncHooks antes das callbacks
// * chama a função fornecida `fn` com os argumentos fornecidos
// * disparar o AsyncHooks após os callbacks
// * restaurar o contexto de execução original
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// Chama AsyncHooks para destruir callbacks.
asyncResource.emitDestroy();

// Retorna o ID exclusivo atribuído à instância do AsyncResource.
asyncResource.asyncId();

// Retorna o ID engatilhado à instância do AsyncResource.
asyncResource.triggerAsyncId();;

// Chama AsyncHooks antes de callbacks.
// Descontinuada: Use asyncResource.runInAsyncScope em vez disso.
asyncResource.emitBefore();

// Chamar AsyncHooks após callbacks.
// Descontinuada: Use asyncResource.runInAsyncScope em vez disso.
asyncResource.emitAfter();
```

#### `AsyncResource(type[, options])`

* `tipo` {string} O tipo de evento assíncrono.
* `options` {Object}
  * `triggerAsyncId` {number} O ID do contexto de execução que criou este evento async. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Desabilita automaticamente `emitDestroy` quando o lixo do objeto é coletado. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's asyncId is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`.

Exemplo de Uso:

```js
class DBQuery extends AsyncResource {
  constructor(db) {
    super('DBQuery');
    this.db = db;
  }

  getInfo(query, callback) {
    this.db.get(query, (err, data) => {
      this.runInAsyncScope(callback, null, err, data);
    });
  }

  close() {
    this.db = null;
    this.emitDestroy();
  }
}
```

#### `asyncResource.runInAsyncScope(fn[, thisArg, ...args])`
<!-- YAML
added: v8.12.0
-->

* `fn` {Function} A função para chamar no contexto de execução deste recurso async.
* `thisArg` {any} O receptor a ser usado para a função call.
* `...args` {any} Argumentos opcionais para passar para a função.

Chama a função fornecida com os argumentos fornecidos no contexto de execução do recurso async. Isto irá estabelecer o contexto, disparar o AsyncHooks antes dos callbacks, chamar a função, disparar o AsyncHooks após o callback e depois restaurar o contexto de execução original.

#### `asyncResource.emitBefore()`
<!-- YAML
deprecated: v8.12.0
-->
> Estabilidade: 0 - Descontinuada: Use [`asyncResource.runInAsyncScope()`][] em vez disso.

* Retorna: {undefined}

Chama todas as callbacks `before` para notificar que um novo contexto de execução assíncrono está sendo inserido. Se as chamadas aninhadas para `emitBefore()` forem feitas, a pilha de `asyncId`s será rastreada e propriamente desenrolada.

Chamadas `before` e `after` devem ser desenroladas na mesma ordem que elas são chamadas. Caso contrário, uma exceção não recuperável ocorrerá e o processo irá abortar. Por esta razão, as APIs `emitBefore` e `emitAfter` são consideradas obsoletas. Por favor, use `runInAsyncScope`, pois fornece uma alternativa muito mais segura.

#### `asyncResource.emitAfter()`
<!-- YAML
deprecated: v8.12.0
-->
> Estabilidade: 0 - Descontinuada: Use [`asyncResource.runInAsyncScope()`][] em vez disso.

* Retorna: {undefined}

Chama todas callbacks `after`. Se as chamadas aninhadas para `emitBefore()` foram feitas, então certifique-se que a pilha seja desenrolada adequadamente. Caso contrário, um erro será lançado.

Se o callback do usuário lançar uma exceção, `emitAfter()` será automaticamente chamado para todos `asyncId` na pilha se o erro for tratado por um domínio ou `'uncaughtException'` handler.

Chamadas `before` e `after` devem ser desenroladas na mesma ordem que elas são chamadas. Caso contrário, uma exceção não recuperável ocorrerá e o processo irá abortar. Por esta razão, as APIs `emitBefore` e `emitAfter` são consideradas obsoletas. Por favor, use `runInAsyncScope`, pois fornece uma alternativa muito mais segura.

#### `asyncResource.emitDestroy()`

* Retorna: {undefined}

Chamar todos os hooks `destroy`. Isto só deverá apenas ser chamado uma vez. Um erro será ser lançado se for chamado mais de uma vez. Isso **deve** ser chamado manualmente. Se o recurso for deixado para ser coletado pelo GC, então os hooks `destroy` nunca serão chamados.

#### `asyncResource.asyncId()`

* Retorna: {number} O `asyncId` exclusivo atribuído ao recurso.

#### `asyncResource.triggerAsyncId()`

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.
