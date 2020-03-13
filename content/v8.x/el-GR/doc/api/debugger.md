# Πρόγραμμα Εντοπισμού Σφαλμάτων

<!--introduced_in=v0.9.12-->

> Σταθερότητα: 2 - Σταθερό

<!-- type=misc -->

H Node.js συμπεριλαμβάνει ένα πρόγραμμα εντοπισμού σφαλμάτων, που λειτουργεί ως ξεχωριστή εφαρμογή, και χρησιμοποιείται μέσω ενός [Επιθεωρητή V8](#debugger_v8_inspector_integration_for_node_js) και ενός ενσωματωμένου πελάτη αποσφαλμάτωσης. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

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

Η εντολή `repl` επιτρέπει την απομακρυσμένη αξιολόγηση του κώδικα. Η εντολή `next` προχωράει στην επόμενη γραμμή. Πληκτρολογήστε `help` για να δείτε όλες τις διαθέσιμες εντολές.

Πατώντας `enter` χωρίς την πληκτρολόγηση μιας εντολής, θα γίνει επανάληψη της προηγούμενης εντολής του προγράμματος εντοπισμού σφαλμάτων.

## Παρατηρητές

Είναι δυνατό να γίνει παρατήρηση των εκφράσεων και των τιμών των μεταβλητών κατά τον εντοπισμού σφαλμάτων. Σε κάθε σημείο διακοπής, κάθε έκφραση από τους παρατηρητές μπορούν να αξιολογηθούν στο τρέχον πλαίσιο και να εμφανιστούν αμέσως πριν τον πηγαίο κώδικα του σημείου διακοπής.

Για να ξεκινήσετε την παρατήρηση μιας έκφρασης, πληκτρολογήστε `watch('my_expression')`. Η εντολή `watchers` θα τυπώσει τους ενεργούς παρατηρητές. Για να αφαιρέσετε έναν παρατηρητή, πληκτρολογήστε `unwatch('my_expression')`.

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
* `setBreakpoint('fn()')`, `sb(...)` - Ορισμός σημείου διακοπής στην πρώτη εντολή του σώματος συναρτήσεων
* `setBreakpoint('script.js', 1)`, `sb(...)` - Set breakpoint on first line of script.js
* `clearBreakpoint('script.js', 1)`, `cb(...)` - Clear breakpoint in script.js on line 1

Είναι επίσης πιθανό να οριστεί σημείο διακοπής σε ένα αρχείο (ενότητα) που δεν έχει φορτωθεί ακόμα:

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

### Πληροφορίες

* `backtrace`, `bt` - Εκτύπωση του backtrace στο τρέχον πλαίσιο εκτέλεσης
* `list(5)` - Εμφανίζει τον πηγαίο κώδικα με πλαίσιο 5 γραμμών (5 γραμμές πριν και 5 γραμμές μετά)
* `watch(expr)` - Προσθήκη έκφρασης στον παρατηρητή
* `unwatch(expr)` - Αφαίρεση έκφρασης από τον παρατηρητή
* `watchers` - Εμφανίζει μια λίστα με όλους τους παρατηρητές και τις τιμές τους (γίνεται αυτόματα σε κάθε σημείο διακοπής)
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

Ο Επιθεωρητής V8 επιτρέπει την σύνδεση του Chrome DevTools με τα στιγμιότυπα της Node.js για εντοπισμό σφαλμάτων και την δημιουργία προφίλ. It uses the [Chrome Debugging Protocol](https://chromedevtools.github.io/debugger-protocol-viewer/).

Ο Επιθεωρητής V8 μπορεί να ενεργοποιηθεί με τη χρήση της επιλογης `--inspect` κατά την εκκίνηση μιας εφαρμογής Node.js. Είναι επίσης δυνατό να οριστεί μια προσαρμοσμένη θύρα με τη χρήση της ίδιας επιλογής, π.χ. ο ορισμός `--inspect=9222` θα δώσει εντολή στη Node.js να αναμένει για συνδέσεις από το DevTools στην θύρα 9222.

Για να γίνει παύση στην πρώτη γραμμή κώδικα της εφαρμογής, χρησιμοποιήστε την επιλογή `--inspect-brk`, αντί της επιλογής `--inspect`.

```txt
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(στο παραπάνω παράδειγμα, το UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 στο τέλος της διεύθυνσης, δημιουργείται αυτόματα, και είναι διαφορετικό σε κάθε συνεδρία εντοπισμού σφαλμάτων.)
