# Debugger

<!--introduced_in=v0.9.12-->

> Stabilità: 2 - Stabile

<!-- type=misc -->

Node.js include un'utility di debug out-of-process accessibile tramite [l'Inspector di V8](#debugger_v8_inspector_integration_for_node_js) e il client di debug integrato. Per usarlo, avvia Node.js con l'argomento `inspect` seguito dal percorso dello script per eseguire il debug; verrà visualizzato un prompt che indica il corretto avvio del debugger:

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

Il debugger client di Node.js non è un debugger completo, ma sono ugualmente possibili semplici step e ispezioni.

L'inserimento dell'istruzione `debugger;` nel codice sorgente di uno script abiliterà un breakpoint in quella posizione nel codice:

<!-- eslint-disable no-debugger -->

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

Il comando `repl` consente di valutare il codice da remoto. Il comando `next` passa alla riga successiva. Digita `help` per vedere quali altri comandi sono disponibili.

Premere `enter` senza digitare alcun comando farà si che si ripeta il comando debugger precedente.

## Watchers

È possibile monitorare i valori expression e variable durante il debug. Su ogni breakpoint, ogni expression presente nell'elenco degli watcher verrà valutata nel contesto corrente e visualizzata immediatamente prima che il codice sorgente del breakpoint venga messo nell'elenco.

Per iniziare a guardare un expression, digita `watch('my_expression')`. Il comando `watchers` stamperà gli watcher attivi. Per rimuovere un watcher, digita `unwatch('my_expression')`.

## Riferimento dei Comandi

### Stepping

* `cont`, `c` - Continua l'esecuzione
* `next`, `n` - Passa al successivo
* `step`, `s` - Step in
* `out`, `o` - Step out
* `pause` - Pause running code (like pause button in Developer Tools)

### Breakpoints

* `setBreakpoint()`, `sb()` - Set breakpoint on current line
* `setBreakpoint(line)`, `sb(line)` - Set breakpoint on specific line
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
 20 // USE OR OTHER DEALINGS IN THE SOFTWARE.
 21
>22 exports.hello = function() {
 23   return 'hello from module';
 24 };
debug>
```

### Information

* `backtrace`, `bt` - Print backtrace of current execution frame
* `list(5)` - List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)` - Add expression to watch list
* `unwatch(expr)` - Remove expression from watch list
* `watchers` - List all watchers and their values (automatically listed on each breakpoint)
* `repl` - Open debugger's repl for evaluation in debugging script's context
* `exec expr` - Execute an expression in debugging script's context

### Execution control

* `run` - Run script (automatically runs on debugger's start)
* `restart` - Restart script
* `kill` - Kill script

### Various

* `scripts` - List all loaded scripts
* `version` - Display V8's version

## Advanced Usage

### V8 Inspector Integration for Node.js

V8 Inspector integration allows attaching Chrome DevTools to Node.js instances for debugging and profiling. It uses the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

V8 Inspector can be enabled by passing the `--inspect` flag when starting a Node.js application. It is also possible to supply a custom port with that flag, e.g. `--inspect=9222` will accept DevTools connections on port 9222.

To break on the first line of the application code, pass the `--inspect-brk` flag instead of `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 at the end of the URL is generated on the fly, it varies in different debugging sessions.)