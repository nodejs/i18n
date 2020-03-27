# Debugger

<!--introduced_in=v0.9.12-->

> Stabilità: 2 - Stable

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
* `step`, `s` - Entra
* `out`, `o` - Esce
* `pause` - Mette in pausa il codice in esecuzione (come il pulsante di pausa negli Strumenti per gli Sviluppatori)

### Breakpoints

* `setBreakpoint()`, `sb()` - Imposta il breakpoint sulla riga corrente
* `setBreakpoint(line)`, `sb(line)` - Imposta il breakpoint su una riga specifica
* `setBreakpoint('fn()')`, `sb(...)` - Imposta il breakpoint sulla prima istruzione nel corpo delle funzioni
* `setBreakpoint('script.js', 1)`, `sb(...)` - Set breakpoint on first line of `script.js`
* `clearBreakpoint('script.js', 1)`, `cb(...)` - Clear breakpoint in `script.js` on line 1

È possibile anche impostare un breakpoint all'interno di un file (modulo) che non è ancora stato caricato:

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
* `list(5)` - Elenca il codice sorgente degli script con 5 righe di contesto (5 righe prima e dopo)
* `watch(expr)` - Aggiunge l'expression alla lista da monitorare
* `unwatch(expr)` - Rimuove l'expressione dalla lista da monitorare
* `watchers` - Elenca tutti gli watcher e i loro valori (elencati automaticamente su ciascun breakpoint)
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

L'integrazione dell'Inspector di V8 consente di collegare Chrome DevTools alle istanze Node.js per il debug e il profiling. Utilizza il [Protocollo Chrome DevTools ](https://chromedevtools.github.io/devtools-protocol/).

L'Inspector V8 può essere abilitato passando il flag `--inspect` all'avvio di un'applicazione Node.js. È anche possibile fornire una porta personalizzata tramite quel flag, ad es. `--inspect=9222` accetterà le connessioni DevTools sulla porta 9222.

Per inserire un break sulla prima riga del codice dell'applicazione, passa il flag `--inspect-brk` al posto di `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(Nell'esempio qui sopra, l'UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 alla fine dell'URL è generato al volo, varia in diverse sessioni di debug.)

If the Chrome browser is older than 66.0.3345.0, use `inspector.html` instead of `js_app.html` in the above URL.
