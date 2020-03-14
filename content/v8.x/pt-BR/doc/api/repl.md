# REPL

<!--introduced_in=v0.10.0-->

> Estabilidade: 2 - estável

O módulo `repl` fornece uma implementação do Read-Eval-Print-Loop (REPL), disponível para ser utilizado como um programa autônomo ou incluído em outras aplicações. É possível acessá-lo utilizando:

```js
const repl = require('repl');
```

## Design e Recursos

O módulo `repl` exporta a classe `repl.REPLServer`. Enquanto estiverem em execução, instâncias de `repl.REPLServer` irão aceitar linhas individuais como entradas do usuário, avaliar essas linhas de acordo com a função de avaliação definida pelo usuário, e então retornar o resultado. A entrada e a saída podem ser `stdin` e `stdout` respectivamente, ou podem ser conectadas a qualquer [stream](stream.html) do Node.js.

Instâncias de `repl.REPLServer` suportam preenchimento automático de entradas, edição simplificada de linhas no estilo Emacs, entradas com múltiplas linhas, saída no estilo ANSI, salvar e restaurar o estado atual da seção do REPL, recuperação de erros, e funções de avaliação customizadas.

### Comandos e Teclas Especiais

Os seguintes comandos são suportados por todas as instâncias do REPL:

* `.break` - When in the process of inputting a multi-line expression, entering the `.break` command (or pressing the `<ctrl>-C` key combination) will abort further input or processing of that expression.
* `.clear` - Resets the REPL `context` to an empty object and clears any multi-line expression currently being input.
* `.exit` - Close the I/O stream, causing the REPL to exit.
* `.help` - Show this list of special commands.
* `.save` - Save the current REPL session to a file: `> .save ./file/to/save.js`
* `.load` - Load a file into the current REPL session. `> .load ./file/to/load.js`
* `.editor` - Enter editor mode (`<ctrl>-D` to finish, `<ctrl>-C` to cancel)
```js
> .editor
// Entering editor mode (^D to finish, ^C to cancel)
function welcome(name) {
  return `Hello ${name}!`;
}

welcome('Node.js User');

// ^D
'Hello Node.js User!'
>
```

As seguintes combinações de teclas possuem significados especiais no REPL:

* `<ctrl>-C` - When pressed once, has the same effect as the `.break` command. When pressed twice on a blank line, has the same effect as the `.exit` command.
* `<ctrl>-D` - Has the same effect as the `.exit` command.
* `<tab>` - When pressed on a blank line, displays global and local(scope) variables. When pressed while entering other input, displays relevant autocompletion options.

### Avaliação Padrão

Por padrão, todas as instâncias de `repl.REPLServer` utilizam uma função de avaliação, capaz de avaliar expressões Javascript e proporciona acesso aos módulos incluídos do Node.js. O comportamento padrão pode ser alterado passando uma função de avaliação alternativa quando uma nova instância de `repl.REPLServer` for criada.

#### Expressões Javascript

A avaliação direta de expressões Javascript é suportada por padrão:
```js
> 1 + 1
2
> const m = 2
undefined
> m + 1
3
```

A não ser que estejam dentro do escopo de blocos ou funções, variáveis declaradas de maneira implícita ou utilizando `const`, `let`, ou `var` são declaradas no escopo global.

#### Escopo Global e Local

O avaliador padrão proporciona acesso a qualquer variável existente no escopo global. É possível expor uma variável ao REPL, realizando a atribuição da mesma ao objeto `context` associado a cada `REPLServer`. Por exemplo:

```js
const repl = require('repl');
const msg = 'message';

repl.start('> ').context.m = msg;
```

Propriedades do objeto `context` são tratadas como locais dentro do REPL:
```js
$ node repl_test.js
> m
'message'
```

Propriedades do objeto context não são protegidas contra escrita por padrão. Para especificar variáveis globais com proteção contra escrita, as propriedades do objeto context devem ser definidar utilizando `Object.defineProperty()`:

```js
const repl = require('repl');
const msg = 'message';

const r = repl.start('> ');
Object.defineProperty(r.context, 'm', {
  configurable: false,
  enumerable: true,
  value: msg
});
```

#### Acessando Módulos Internos do Node.js

O avaliador padrão irá carregar automáticamente os módulos internos do Node.js no ambiente do REPL a medida que forem utilizados. Por exemplo, a não ser que seja declarada de outra maneira como uma variável global ou com escopo definido, a expressão `fs` será avaliada como `global.fs = require('fs')` quando utilizada.
```js
> fs.createReadStream('./some/file');
```

#### Atribuição da variável `_` (underscore)

O avaliador padrão irá, por padrão, atribuir o resultado da última expressão avalida à variável especial `_` (underscore). Atribuir explicitamente uma valor à `_` irá desabilitar esse comportamento.
```js
> [ 'a', 'b', 'c' ]
[ 'a', 'b', 'c' ]
> _.length
3
> _ += 1
Expression assignment to _ now disabled.
4
> 1 + 1
2
> _
4
```

### Funções de Avaliação Customizadas

Quando um novo `repl.REPLServer` é criado, uma função de avaliação customizada poder ser fornecida. É possível utilizar essa fucionalidade para, por exemplo, implementar aplicações REPL totalmente customizadas.

O exemplo a seguir demonstra um REPL hipotético que realiza a tradução de textos de uma linguagem para outra:

```js
const repl = require('repl');
const { Translator } = require('translator');

const myTranslator = new Translator('en', 'fr');

function myEval(cmd, context, filename, callback) {
  callback(null, myTranslator.translate(cmd));
}

repl.start({ prompt: '> ', eval: myEval });
```

#### Erros Recuperáveis

Enquanto o usuário estiver digitando no prompt do REPL, pressionar a tecla `&lt;enter&gt;` enviará a linha digitada para a função `eval`. Para dar suporte a entradas com múltiplas linhas, a função de avaliação poderá retornar uma instância de `repl.Recoverable` a função de callback fornecida:

```js
function myEval(cmd, context, filename, callback) {
  let result;
  try {
    result = vm.runInThisContext(cmd);
  } catch (e) {
    if (isRecoverableError(e)) {
      return callback(new repl.Recoverable(e));
    }
  }
  callback(null, result);
}

function isRecoverableError(error) {
  if (error.name === 'SyntaxError') {
    return /^(Unexpected end of input|Unexpected token)/.test(error.message);
  }
  return false;
}
```

### Customizando a Saída do REPL

By default, `repl.REPLServer` instances format output using the [`util.inspect()`][] method before writing the output to the provided Writable stream (`process.stdout` by default). The `useColors` boolean option can be specified at construction to instruct the default writer to use ANSI style codes to colorize the output from the `util.inspect()` method.

It is possible to fully customize the output of a `repl.REPLServer` instance by passing a new function in using the `writer` option on construction. The following example, for instance, simply converts any input text to upper case:

```js
const repl = require('repl');

const r = repl.start({ prompt: '> ', eval: myEval, writer: myWriter });

function myEval(cmd, context, filename, callback) {
  callback(null, cmd);
}

function myWriter(output) {
  return output.toUpperCase();
}
```

## Classe: REPLServer<!-- YAML
added: v0.1.91
-->A classe `repl.REPLServer` herda da classe [`readline.Interface`][]. Instâncias de `repl.REPLServer` são criadas utilizando o método `repl.start()` e *não devem* ser criadas diretamente utilizando o operador `new`.

### Evento: 'exit'<!-- YAML
added: v0.7.7
-->The `'exit'` event is emitted when the REPL is exited either by receiving the `.exit` command as input, the user pressing `<ctrl>-C` twice to signal `SIGINT`, or by pressing `<ctrl>-D` to signal `'end'` on the input stream. The listener callback is invoked without any arguments.

```js
replServer.on('exit', () => {
  console.log('Received "exit" event from repl!');
  process.exit();
});
```

### Evento: 'reset'<!-- YAML
added: v0.11.0
-->The `'reset'` event is emitted when the REPL's context is reset. This occurs whenever the `.clear` command is received as input *unless* the REPL is using the default evaluator and the `repl.REPLServer` instance was created with the `useGlobal` option set to `true`. The listener callback will be called with a reference to the `context` object as the only argument.

This can be used primarily to re-initialize REPL context to some pre-defined state as illustrated in the following simple example:

```js
const repl = require('repl');

function initializeContext(context) {
  context.m = 'test';
}

const r = repl.start({ prompt: '> ' });
initializeContext(r.context);

r.on('reset', initializeContext);
```

Quando o código é executado, a variável global `'m'` pode ser modificada, mas tem seu valor original restaurado quando o comando `.clear` é utilizado:
```js
$ ./node example.js
> m
'test'
> m = 1
1
> m
1
> .clear
Clearing context...
> m
'test'
>
```

### replServer.defineCommand(keyword, cmd)<!-- YAML
added: v0.3.0
-->* `keyword` {string} The command keyword (*without* a leading `.` character).
* `cmd` {Object|Function} The function to invoke when the command is processed.

The `replServer.defineCommand()` method is used to add new `.`-prefixed commands to the REPL instance. Such commands are invoked by typing a `.` followed by the `keyword`. The `cmd` is either a Function or an object with the following properties:

* `help` {string} Help text to be displayed when `.help` is entered (Optional).
* `action` {Function} The function to execute, optionally accepting a single string argument.

The following example shows two new commands added to the REPL instance:

```js
const repl = require('repl');

const replServer = repl.start({ prompt: '> ' });
replServer.defineCommand('sayhello', {
  help: 'Say hello',
  action(name) {
    this.bufferedCommand = '';
    console.log(`Hello, ${name}!`);
    this.displayPrompt();
  }
});
replServer.defineCommand('saybye', function saybye() {
  console.log('Goodbye!');
  this.close();
});
```

The new commands can then be used from within the REPL instance:

```txt
> .sayhello Node.js User
Hello, Node.js User!
> .saybye
Goodbye!
```

### replServer.displayPrompt([preserveCursor])<!-- YAML
added: v0.1.91
-->* `preserveCursor` {boolean}

The `replServer.displayPrompt()` method readies the REPL instance for input from the user, printing the configured `prompt` to a new line in the `output` and resuming the `input` to accept new input.

When multi-line input is being entered, an ellipsis is printed rather than the 'prompt'.

When `preserveCursor` is `true`, the cursor placement will not be reset to `0`.

The `replServer.displayPrompt` method is primarily intended to be called from within the action function for commands registered using the `replServer.defineCommand()` method.

## repl.start([options])<!-- YAML
added: v0.1.91
changes:
  - version: v5.8.0
    pr-url: https://github.com/nodejs/node/pull/5388
    description: The `options` parameter is optional now.
-->* `options` {Object|string}
  * `prompt` {string} The input prompt to display. **Default:** `>`. (with a trailing space).
  * `input` {stream.Readable} The Readable stream from which REPL input will be read. **Default:** `process.stdin`.
  * `output` {stream.Writable} The Writable stream to which REPL output will be written. **Default:** `process.stdout`.
  * `terminal` {boolean} If `true`, specifies that the `output` should be treated as a TTY terminal, and have ANSI/VT100 escape codes written to it. **Default:** checking the value of the `isTTY` property on the `output` stream upon instantiation.
  * `eval` {Function} The function to be used when evaluating each given line of input. **Default:** an async wrapper for the JavaScript `eval()` function. An `eval` function can error with `repl.Recoverable` to indicate the input was incomplete and prompt for additional lines.
  * `useColors` {boolean} If `true`, specifies that the default `writer` function should include ANSI color styling to REPL output. If a custom `writer` function is provided then this has no effect. **Default:** the REPL instances `terminal` value.
  * `useGlobal` {boolean} If `true`, specifies that the default evaluation function will use the JavaScript `global` as the context as opposed to creating a new separate context for the REPL instance. The node CLI REPL sets this value to `true`. **Default:** `false`.
  * `ignoreUndefined` {boolean} If `true`, specifies that the default writer will not output the return value of a command if it evaluates to `undefined`. **Default:** `false`.
  * `writer` {Function} The function to invoke to format the output of each command before writing to `output`. **Default:** [`util.inspect()`][].
  * `completer` {Function} An optional function used for custom Tab auto completion. See [`readline.InterfaceCompleter`][] for an example.
  * `replMode` {symbol} A flag that specifies whether the default evaluator executes all JavaScript commands in strict mode or default (sloppy) mode. Acceptable values are:
    * `repl.REPL_MODE_SLOPPY` - evaluates expressions in sloppy mode.
    * `repl.REPL_MODE_STRICT` - evaluates expressions in strict mode. This is equivalent to prefacing every repl statement with `'use strict'`.
    * `repl.REPL_MODE_MAGIC` - This value is **deprecated**, since enhanced spec compliance in V8 has rendered magic mode unnecessary. It is now equivalent to `repl.REPL_MODE_SLOPPY` (documented above).
  * `breakEvalOnSigint` - Stop evaluating the current piece of code when `SIGINT` is received, i.e. `Ctrl+C` is pressed. This cannot be used together with a custom `eval` function. **Default:** `false`.

The `repl.start()` method creates and starts a `repl.REPLServer` instance.

If `options` is a string, then it specifies the input prompt:

```js
const repl = require('repl');

// Prompt estilo Unix
repl.start('$ ');
```

## O REPL do Node.js

O módulo `repl` é utilizado pelo Node.js para fornecer sua própria interface interativa para execução de Javascript. Ele também pode ser utilizado executando o Node.js sem nenhum argumento (ou passando `-i` como argumento):
```js
$ node
> const a = [1, 2, 3];
undefined
> a
[ 1, 2, 3 ]
> a.forEach((v) => {
...   console.log(v);
...   });
1
2
3
```

### Opções Com Variáveis de Ambiente

Various behaviors of the Node.js REPL can be customized using the following environment variables:

 - `NODE_REPL_HISTORY` - When a valid path is given, persistent REPL history will be saved to the specified file rather than `.node_repl_history` in the user's home directory. Setting this value to `''` will disable persistent REPL history. Whitespace will be trimmed from the value.
 - `NODE_REPL_HISTORY_SIZE` - Controls how many lines of history will be persisted if history is available. Must be a positive number. **Default:** `1000`.
 - `NODE_REPL_MODE` - May be any of `sloppy`, `strict`, or `magic`. `magic` is **deprecated** and treated as an alias of `sloppy`. **Default:** `sloppy`, which will allow non-strict mode code to be run.

### Histórico Persistente

By default, the Node.js REPL will persist history between `node` REPL sessions by saving inputs to a `.node_repl_history` file located in the user's home directory. This can be disabled by setting the environment variable `NODE_REPL_HISTORY=""`.

#### NODE_REPL_HISTORY_FILE<!-- YAML
added: v2.0.0
deprecated: v3.0.0
-->> Stability: 0 - Deprecated: Use `NODE_REPL_HISTORY` instead.

Previously in Node.js/io.js v2.x, REPL history was controlled by using a `NODE_REPL_HISTORY_FILE` environment variable, and the history was saved in JSON format. This variable has now been deprecated, and the old JSON REPL history file will be automatically converted to a simplified plain text format. This new file will be saved to either the user's home directory, or a directory defined by the `NODE_REPL_HISTORY` variable, as documented in the [Environment Variable Options](#repl_environment_variable_options).

### Utilizando o REPL do Node.js com editores de linha avançados

For advanced line-editors, start Node.js with the environment variable `NODE_NO_READLINE=1`. This will start the main and debugger REPL in canonical terminal settings, which will allow use with `rlwrap`.

For example, the following can be added to a `.bashrc` file:

```text
alias node="env NODE_NO_READLINE=1 rlwrap node"
```

### Iniciando múltiplas instâncias do REPL no Node.js

It is possible to create and run multiple REPL instances against a single running instance of Node.js that share a single `global` object but have separate I/O interfaces.

The following example, for instance, provides separate REPLs on `stdin`, a Unix socket, and a TCP socket:

```js
const net = require('net');
const repl = require('repl');
let connections = 0;

repl.start({
  prompt: 'Node.js via stdin> ',
  input: process.stdin,
  output: process.stdout
});

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via Unix socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen('/tmp/node-repl-sock');

net.createServer((socket) => {
  connections += 1;
  repl.start({
    prompt: 'Node.js via TCP socket> ',
    input: socket,
    output: socket
  }).on('exit', () => {
    socket.end();
  });
}).listen(5001);
```

Running this application from the command line will start a REPL on stdin. Other REPL clients may connect through the Unix socket or TCP socket. `telnet`, for instance, is useful for connecting to TCP sockets, while `socat` can be used to connect to both Unix and TCP sockets.

By starting a REPL from a Unix socket-based server instead of stdin, it is possible to connect to a long-running Node.js process without restarting it.

For an example of running a "full-featured" (`terminal`) REPL over a `net.Server` and `net.Socket` instance, see: https://gist.github.com/2209310

For an example of running a REPL instance over [curl(1)](https://curl.haxx.se/docs/manpage.html), see: https://gist.github.com/2053342
