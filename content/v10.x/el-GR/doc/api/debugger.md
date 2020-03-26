# Πρόγραμμα Εντοπισμού Σφαλμάτων

<!--introduced_in=v0.9.12-->

> Σταθερότητα: 2 - Σταθερό

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

Όταν εκτελεστεί το πρόγραμμα εντοπισμού σφαλμάτων, μια διακοπή θα γίνει στη γραμμή 3:

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

Η εντολή `repl` επιτρέπει την απομακρυσμένη αξιολόγηση του κώδικα. The `next` command steps to the next line. Πληκτρολογήστε `help` για να δείτε όλες τις διαθέσιμες εντολές.

Pressing `enter` without typing a command will repeat the previous debugger command.

## Παρατηρητές

Είναι δυνατό να γίνει παρατήρηση των εκφράσεων και των τιμών των μεταβλητών κατά τον εντοπισμού σφαλμάτων. On every breakpoint, each expression from the watchers list will be evaluated in the current context and displayed immediately before the breakpoint's source code listing.

Για να ξεκινήσετε την παρατήρηση μιας έκφρασης, πληκτρολογήστε `watch('my_expression')`. The command `watchers` will print the active watchers. To remove a watcher, type `unwatch('my_expression')`.

## Αναφορά Εντολών

### Βηματισμός

* `cont`, `c` - Συνέχιση εκτέλεσης
* `next`, `n` - Επόμενο βήμα
* `step`, `s` - Step in
* `out`, `o` - Step out
* `pause` - Παύση εκτέλεσης κώδικα (όπως το κουμπί "Παύση" στα Εργαλεία Προγραμματιστή)

### Σημεία Διακοπής

* `setBreakpoint()`, `sb()` - Ορισμός σημείου διακοπής στην τρέχουσα γραμμή
* `setBreakpoint(line)`, `sb(line)` - Ορισμός σημείου διακοπής σε συγκεκριμένη γραμμή
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

### Πληροφορίες

* `backtrace`, `bt` - Εκτύπωση του backtrace στο τρέχον πλαίσιο εκτέλεσης
* `list(5)` - List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)` - Προσθήκη έκφρασης στον παρατηρητή
* `unwatch(expr)` - Αφαίρεση έκφρασης από τον παρατηρητή
* `watchers` - List all watchers and their values (automatically listed on each breakpoint)
* `repl` - Ανοίγει το repl του εντοπισμού σφαλμάτων για αξιολόγηση στα πλαίσια του σεναρίου εντοπισμού σφαλμάτων
* `exec expr` - Εκτελεί μια έκφραση στα πλαίσια του σεναρίου εντοπισμού σφαλμάτων

### Έλεγχος εκτέλεσης

* `run` - Εκτέλεση σεναρίου (εκτελείται αυτόματα κατά την εκκίνηση του εντοπισμού σφαλμάτων)
* `restart` - Επανεκκίνηση σεναρίου
* `kill` - Τερματισμός σεναρίου

### Διάφορα

* `scripts` - Λίστα των σεναρίων που έχουν φορτωθεί
* `version` - Προβολή έκδοσης της μηχανής V8

## Χρήση για Προχωρημένους

### Ενσωμάτωση του Επιθεωρητή V8 στη Node.js

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