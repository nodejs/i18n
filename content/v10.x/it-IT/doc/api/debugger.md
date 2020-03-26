# Debugger

<!--introduced_in=v0.9.12-->

> Stabilità: 2 - Stabile

<!-- type=misc -->

Node.js includes an out-of-process debugging utility accessible via a [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) and built-in debugging client. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   console.log('world');
debug>
```

Node.js's debugger client is not a full-featured debugger, but simple step and inspection are possible.

Inserting the statement `debugger;` into the source code of a script will enable a breakpoint at that position in the code:

```js
// myscript.js
global.x = 5;
setTimeout(() => {
  debugger;
  console.log('world');
}, 1000);
console.log('hello');
```

Una volta eseguito il debugger, si verificherà un breakpoint alla riga 3:

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   debugger;
debug> cont
< hello
break in myscript.js:3
  1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
> 3   debugger;
  4   console.log('world');
  5 }, 1000);
debug> next
break in myscript.js:4
  2 setTimeout(() => {
  3   debugger;
> 4   console.log('world');
  5 }, 1000);
  6 console.log('hello');
debug> repl
Press Ctrl + C to leave debug repl
> x
5
> 2 + 2
4
debug> next
< world
break in myscript.js:5
  3   debugger;
  4   console.log('world');
> 5 }, 1000);
  6 console.log('hello');
  7
debug> .exit
```

Il comando `repl` consente di valutare il codice da remoto. The `next` command steps to the next line. Digita `help` per vedere quali altri comandi sono disponibili.

Pressing `enter` without typing a command will repeat the previous debugger command.

## Watchers

È possibile monitorare i valori expression e variable durante il debug. On every breakpoint, each expression from the watchers list will be evaluated in the current context and displayed immediately before the breakpoint's source code listing.

Per iniziare a guardare un expression, digita `watch('my_expression')`. The command `watchers` will print the active watchers. To remove a watcher, type `unwatch('my_expression')`.

## Riferimento dei Comandi

### Stepping

* `cont`, `c` - Continua l'esecuzione
* `next`, `n` - Passa al successivo
* `step`, `s` - Entra
* `out`, `o` - Esce
* `pause` - Mette in pausa il codice in esecuzione (come il pulsante di pausa negli Strumenti per gli Sviluppatori)

### Breakpoints

* `setBreakpoint()`, `sb()` - Imposta il breakpoint sulla riga corrente
* `setBreakpoint(line)`, `sb(line)` - Imposta il breakpoint su una riga specifica
* `setBreakpoint('fn()')`, `sb(...)` - Set breakpoint on a first statement in functions body
* `setBreakpoint('script.js', 1)`, `sb(...)` - Set breakpoint on first line of `script.js`
* `clearBreakpoint('script.js', 1)`, `cb(...)` - Clear breakpoint in `script.js` on line 1

It is also possible to set a breakpoint in a file (module) that is not loaded yet:

```txt
$ node inspect main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in main.js:1
> 1 (function (exports, require, module, __filename, __dirname) { const mod = require('./mod.js');
  2 mod.hello();
  3 mod.hello();
debug> setBreakpoint('mod.js', 22)
Warning: script 'mod.js' was not loaded yet.
debug> c
break in mod.js:22
 20 // UTILIZZO O ALTRE DISPOSIZIONI NEL SOFTWARE.
 21
>22 exports.hello = function() {
 23   return 'hello from module';
 24 };
debug>
```

### Informazioni

* `backtrace`, `bt` - Stampa il backtrace del frame di esecuzione corrente
* `list(5)` - List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)` - Aggiunge l'expression alla lista da monitorare
* `unwatch(expr)` - Rimuove l'expressione dalla lista da monitorare
* `watchers` - List all watchers and their values (automatically listed on each breakpoint)
* `repl` - Apre il repl del debugger per la valutazione nel contesto dello script di debug
* `exec expr` - Esegue un'expression nel contesto dello script di debug

### Controllo dell'esecuzione

* `run` - Esegue lo script (viene eseguito automaticamente all'avvio del debugger)
* `restart` - Riavvia lo script
* `kill` - Arresta lo script

### Varie

* `scripts` - Elenca tutti gli script caricati
* `version` - Mostra la versione di V8

## Uso Avanzato

### Integrazione dell'Inspector di V8 per Node.js

V8 Inspector integration allows attaching Chrome DevTools to Node.js instances for debugging and profiling. It uses the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

V8 Inspector can be enabled by passing the `--inspect` flag when starting a Node.js application. It is also possible to supply a custom port with that flag, e.g. `--inspect=9222` will accept DevTools connections on port 9222.

To break on the first line of the application code, pass the `--inspect-brk` flag instead of `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 at the end of the URL is generated on the fly, it varies in different debugging sessions.)

If the Chrome browser is older than 66.0.3345.0, use `inspector.html` instead of `js_app.html` in the above URL.