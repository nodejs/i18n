# Πρόγραμμα Εντοπισμού Σφαλμάτων

<!--introduced_in=v0.9.12-->

> Σταθερότητα: 2 - Σταθερό

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

Το πρόγραμμα εντοπισμού σφαλμάτων της Node.js δεν είναι ένα πρόγραμμα με πλήρη χαρακτηριστικά, όμως είναι δυνατό να γίνεται επιθεώρηση ανά βήμα.

Εισάγοντας μια δήλωση `debugger;` στον πηγαίο κώδικα ενός σεναρίου, θα ενεργοποιήσει ένα σημείο διακοπής σε αυτό το σημείο του κώδικα:
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

Η εντολή `repl` επιτρέπει την απομακρυσμένη αξιολόγηση του κώδικα. Η εντολή `next` προχωράει στην επόμενη γραμμή. Πληκτρολογήστε `help` για να δείτε όλες τις διαθέσιμες εντολές.

Πατώντας `enter` χωρίς την πληκτρολόγηση μιας εντολής, θα γίνει επανάληψη της προηγούμενης εντολής του προγράμματος εντοπισμού σφαλμάτων.

## Παρατηρητές

Είναι δυνατό να γίνει παρατήρηση των εκφράσεων και των τιμών των μεταβλητών κατά τον εντοπισμού σφαλμάτων. Σε κάθε σημείο διακοπής, κάθε έκφραση από τους παρατηρητές μπορούν να αξιολογηθούν στο τρέχον πλαίσιο και να εμφανιστούν αμέσως πριν τον πηγαίο κώδικα του σημείου διακοπής.

Για να ξεκινήσετε την παρατήρηση μιας έκφρασης, πληκτρολογήστε `watch('my_expression')`. Η εντολή `watchers` θα τυπώσει τους ενεργούς παρατηρητές. Για να αφαιρέσετε έναν παρατηρητή, πληκτρολογήστε `unwatch('my_expression')`.

## Αναφορά Εντολών

### Βηματισμός

* `cont`, `c`: Continue execution
* `next`, `n`: Step next
* `step`, `s`: Step in
* `out`, `o`: Step out
* `pause`: Pause running code (like pause button in Developer Tools)

### Σημεία Διακοπής

* `setBreakpoint()`, `sb()`: Set breakpoint on current line
* `setBreakpoint(line)`, `sb(line)`: Set breakpoint on specific line
* `setBreakpoint('fn()')`, `sb(...)`: Set breakpoint on a first statement in functions body
* `setBreakpoint('script.js', 1)`, `sb(...)`: Set breakpoint on first line of `script.js`
* `clearBreakpoint('script.js', 1)`, `cb(...)`: Clear breakpoint in `script.js` on line 1

Είναι επίσης πιθανό να οριστεί σημείο διακοπής σε ένα αρχείο (ενότητα) που δεν έχει φορτωθεί ακόμα:

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

### Πληροφορίες

* `backtrace`, `bt`: Print backtrace of current execution frame
* `list(5)`: List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)`: Add expression to watch list
* `unwatch(expr)`: Remove expression from watch list
* `watchers`: List all watchers and their values (automatically listed on each breakpoint)
* `repl`: Open debugger's repl for evaluation in debugging script's context
* `exec expr`: Execute an expression in debugging script's context

### Έλεγχος εκτέλεσης

* `run`: Run script (automatically runs on debugger's start)
* `restart`: Restart script
* `kill`: Kill script

### Διάφορα

* `scripts`: List all loaded scripts
* `version`: Display V8's version

## Χρήση για Προχωρημένους

### Ενσωμάτωση του Επιθεωρητή V8 στη Node.js

Ο Επιθεωρητής V8 επιτρέπει την σύνδεση του Chrome DevTools με τα στιγμιότυπα της Node.js για εντοπισμό σφαλμάτων και την δημιουργία προφίλ. It uses the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

Ο Επιθεωρητής V8 μπορεί να ενεργοποιηθεί με τη χρήση της επιλογης `--inspect` κατά την εκκίνηση μιας εφαρμογής Node.js. Είναι επίσης δυνατό να οριστεί μια προσαρμοσμένη θύρα με τη χρήση της ίδιας επιλογής, π.χ. ο ορισμός `--inspect=9222` θα δώσει εντολή στη Node.js να αναμένει για συνδέσεις από το DevTools στην θύρα 9222.

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
