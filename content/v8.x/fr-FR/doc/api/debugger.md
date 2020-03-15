# Débogueur

<!--introduced_in=v0.9.12-->

> Stabilité: 2 - stable

<!-- type=misc -->

Node.js inclut un utilitaire de débogage out-of-process accessible via un [Inspecteur V8](#debugger_v8_inspector_integration_for_node_js) et le client de débogage intégré. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
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

```txt
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help see https://nodejs.org/en/docs/inspector
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

* `cont`, `c` - Continuer l'exécution jusqu'au prochain point d'arrêt
* `next`, `n` - Instruction suivante
* `step`, `s` - Pas à pas entrant (si l'instruction à exécuter contient une fonction, se rend à la première instruction de cette fonction)
* `out`, `o` - Pas à pas sortant (exécute le code jusqu'au retour de la fonction en cours, et s'arrête dans la fonction parente, à l'instruction suivant l'appel de la fonction où l'on était entré)
* `pause` - Mets l'exécution du code en pause (comme le bouton pause dans les outils de développement Chrome)

### Points d'arrêt

* `setBreakpoint()`, `sb()` - Ajoute un point d'arrêt sur la ligne courante
* `setBreakpoint(line)`, `sb(line)` - Ajoute un point d'arrêt sur une ligne spécifique
* `setBreakpoint('fn()')`, `sb(...)` - Ajoute un point d'arrêt sur la première instruction du corps de la fonction
* `setBreakpoint('script.js', 1)`, `sb(...)` - Set breakpoint on first line of script.js
* `clearBreakpoint('script.js', 1)`, `cb(...)` - Clear breakpoint in script.js on line 1

Il est également possible d'ajouter un point d'arrêt dans un fichier (module) qui n'est pas encore chargé:

```txt
$ node inspect main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< For help see https://nodejs.org/en/docs/inspector
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

* `backtrace`, `bt` - Affiche la pile d'apppel au point d'exécution courant
* `list(5)` - Affiche le code source avec un contexte de 5 lignes (5 lignes avant et après)
* `watch(expr)` - Ajoute une expression à la liste d'espions
* `unwatch(expr)` - Retire une expression de la liste d'espions
* `watchers` - Liste tous les espions et leurs valeurs (listé automatiquement à chaque point d'arrêt)
* `repl` - Ouvre le repl du débogueur pour exécuter du code dans le contexte du script débogué
* `exec expr` - Exécute une expression dans le contexte du script débogué

### Contrôle d’exécution

* `run` - Exécute le script (s'exécute automatiquement au démarrage du débogueur)
* `restart` - Redémarre le script
* `kill` - Arrête le script

### Divers

* `scripts` - Liste tous les scripts chargés
* `version` - Affiche la version de V8

## Utilisation avancée

### Intégration de l'inspecteur V8 pour Node.js

L'intégration de l'inspecteur V8 permet d'attacher les outils de développement de Chrome aux instances de Node.js pour le débogage et le profilage. It uses the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer/).

L'inspecteur V8 peut être active en passant le flag `--inspect` au démarrage d'une application Node.js. Il est également possible de fournir un port personnalisé avec ce flag, par exemple `--inspect=9222` acceptera les connexions des outils de développement sur le port 9222.

Pour arrêter l'exécution sur la première ligne du code de l'application, passez le flag `--inspect-brk` au lieu du flag `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(Dans l'example ci-dessus, l'UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 à la fin de l'URL est généré à la volée, il varie à chaque session de débogage.)
