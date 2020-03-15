# Object Globali

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Questi object sono disponibili in tutti i moduli. Le seguenti variabili potrebbero sembrare globali ma non lo sono. Esistono solo nel campo di applicazione dei moduli, visualizza la [module system documentation](modules.html):

- [`__dirname`][]
- [`__filename`][]
- [`exports`][]
- [`module`][]
- [`require()`][]

Gli object qui elencati sono specifici a Node.js. Ci sono un numero di [object incorporati](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) che sono parte del linguaggio JavaScript, i quali sono anch'essi accessibili a livello globale.

## Class: Buffer
<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Utilizzato per gestire i dati binari. Visualizza la [sezione buffer](buffer.html).

## \_\_dirname

Questa variabile può sembrare globale ma non lo è. Visualizza [`__dirname`].

## \_\_filename

Questa variabile può sembrare globale ma non lo è. Visualizza [`__filename`].

## clearImmediate(immediateObject)
<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] è descritta nella sezione [timers](timers.html).

## clearInterval(intervalObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`] è descritto nella sezione [timers](timers.html).

## clearTimeout(timeoutObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] è descritto nella sezione [timers](timers.html).

## console
<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Utilizzato per la stampa su stdout e stderr. Visualizza la sezione [`console`][].

## export

Questa variabile può sembrare globale ma non lo è. Visualizza [`exports`].

## globale
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Il namespace object globale.

Nei browser, l'ambito principale è l'ambito globale. Ciò significa che all'interno del browser `var qualcosa` definirà una nuova variabile globale. In Node.js tutto ciò è diverso. L'ambito di livello superiore non è l'ambito globale; `var qualcosa` all'interno di un modulo Node.js sarà locale a quel modulo.

## module

Questa variabile può sembrare globale ma non lo è. Visualizza [`module`].

## process
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

L'object del processo. Visualizza la sezione [object del `processo`][].

## require()

Questa variabile può sembrare globale ma non lo è. Visualizza [`require()`].

## setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] è descritto nella sezione [timers](timers.html).

## setInterval(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] è descritto nella sezione [timers](timers.html).

## setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] è descritto nella sezione [timers](timers.html).

## URL
<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

The WHATWG `URL` class. See the [`URL`][] section.

## URLSearchParams
<!-- YAML
added: v10.0.0
-->

<!-- type=global -->

The WHATWG `URLSearchParams` class. See the [`URLSearchParams`][] section.

## WebAssembly
<!-- YAML
added: v8.0.0
-->

<!-- type=global -->

* {Object}

The object that acts as the namespace for all W3C [WebAssembly](https://webassembly.org) related functionality. See the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/WebAssembly) for usage and compatibility.
