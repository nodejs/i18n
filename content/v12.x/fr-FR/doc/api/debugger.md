# Débogueur

<!--introduced_in=v0.9.12-->

> Stabilité: 2 - stable

<!-- type=misc -->

Node.js includes an out-of-process debugging utility accessible via a [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) and built-in debugging client. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

```console
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

Le client de débogage Node.js n'est pas un debogueur complet, mais simple pas à pas et inspection sont possibles.

Insérer l'instruction `debugger ;` dans le code source d’un script activera un point d’arrêt à cet emplacement dans le code:
```js
// myscript.js
global.x = 5;
setTimeout(() => {
  debugger;
  console.log('world');
}, 1000);
console.log('hello');
```

Quand le débogueur sera exécuté, un arrêt se produira à la ligne 3:

```console
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

La commande `repl` permet d'évaluer du code à distance. La commande `next` passe à la ligne suivante. Tapez `help` pour voir quelles autres commandes sont disponibles.

Presser `enter` sans taper de commande répètera la commande de débogage précédente.

## Espions

Il est possible d'espionner les valeurs d'expression et de variables pendant le débogage. Sur tous les point d'arrêt, chaque expression de la liste d'expressions espionnées sera évaluée dans le contexte courant, et affichée immédiatement avant le listing de code source du point d'arrêt.

Pour commencer à espionner une expression, tapez `watch('mon_expression')`. La commande `watchers` affichera tous les espions actifs. Pour supprimer un espion, tapez `unwatch('mon_expression')`.

## Référence de la ligne de commande

### Pas-à-pas

* `cont`, `c`: Continue execution
* `next`, `n`: Step next
* `step`, `s`: Step in
* `out`, `o`: Step out
* `pause`: Pause running code (like pause button in Developer Tools)

### Points d'arrêt

* `setBreakpoint()`, `sb()`: Set breakpoint on current line
* `setBreakpoint(line)`, `sb(line)`: Set breakpoint on specific line
* `setBreakpoint('fn()')`, `sb(...)`: Set breakpoint on a first statement in functions body
* `setBreakpoint('script.js', 1)`, `sb(...)`: Set breakpoint on first line of `script.js`
* `clearBreakpoint('script.js', 1)`, `cb(...)`: Clear breakpoint in `script.js` on line 1

Il est également possible d'ajouter un point d'arrêt dans un fichier (module) qui n'est pas encore chargé:

```console
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

* `backtrace`, `bt`: Print backtrace of current execution frame
* `list(5)`: List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)`: Add expression to watch list
* `unwatch(expr)`: Remove expression from watch list
* `watchers`: List all watchers and their values (automatically listed on each breakpoint)
* `repl`: Open debugger's repl for evaluation in debugging script's context
* `exec expr`: Execute an expression in debugging script's context

### Contrôle d’exécution

* `run`: Run script (automatically runs on debugger's start)
* `restart`: Restart script
* `kill`: Kill script

### Divers

* `scripts`: List all loaded scripts
* `version`: Display V8's version

## Utilisation avancée

### Intégration de l'inspecteur V8 pour Node.js

L'intégration de l'inspecteur V8 permet d'attacher les outils de développement de Chrome aux instances de Node.js pour le débogage et le profilage. It uses the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

L'inspecteur V8 peut être active en passant le flag `--inspect` au démarrage d'une application Node.js. Il est également possible de fournir un port personnalisé avec ce flag, par exemple `--inspect=9222` acceptera les connexions des outils de développement sur le port 9222.

To break on the first line of the application code, pass the `--inspect-brk` flag instead of `--inspect`.

```console
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 at the end of the URL is generated on the fly, it varies in different debugging sessions.)

If the Chrome browser is older than 66.0.3345.0, use `inspector.html` instead of `js_app.html` in the above URL.

Chrome DevTools doesn't support debugging [Worker Threads](worker_threads.html) yet. [ndb](https://github.com/GoogleChromeLabs/ndb/) can be used to debug them.
