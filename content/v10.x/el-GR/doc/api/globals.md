# Καθολικά Αντικείμενα

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Αυτά τα αντικείμενα είναι διαθέσιμα σε όλες τις ενότητες. Οι παρακάτω μεταβλητές μπορεί να φαίνονται ως καθολικές, αλλά δεν είναι. Υπάρχουν μόνο σε πεδία εφαρμογής των ενοτήτων, δείτε την [τεκμηρίωση ενοτήτων συστήματος](modules.html):

- [`__dirname`][]
- [`__filename`][]
- [`exports`][]
- [`module`][]
- [`require()`][]

Τα αντικείμενα που αναφέρονται εδώ, είναι αποκλειστικά της Node.js. Υπάρχει ένας αριθμός από [ενσωματωμένα αντικείμενα](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) που είναι μέρος της γλώσσας της JavaScript, τα οποία είναι επίσης καθολικά προσβάσιμα.

## Class: Buffer
<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Χρησιμοποιείται για τον χειρισμό binary δεδομένων. Δείτε την [ενότητα buffer](buffer.html).

## \_\_dirname

Η μεταβλητή φαίνεται ως καθολική, αλλά δεν είναι. Δείτε το [`__dirname`].

## \_\_filename

Η μεταβλητή φαίνεται ως καθολική, αλλά δεν είναι. Δείτε το [`__filename`].

## clearImmediate(immediateObject)
<!-- YAML
added: v0.9.1
-->

<!--type=global-->

Το [`clearImmediate`] περιγράφεται στην ενότητα [Χρονομετρητές](timers.html).

## clearInterval(intervalObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

Το [`clearInterval`] περιγράφεται στην ενότητα [Χρονομετρητές](timers.html).

## clearTimeout(timeoutObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

Το [`clearTimeout`] περιγράφεται στην ενότητα [Χρονομετρητές](timers.html).

## console
<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Χρησιμοποιείται για εκτύπωση στο stdout και το stderr. Δείτε την ενότητα [`console`][].

## exports

Η μεταβλητή φαίνεται ως καθολική, αλλά δεν είναι. Δείτε την ενότητα [`exports`].

## global
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Το καθολικό αντικείμενο ονομάτων.

Στα προγράμματα περιήγησης, το ανώτατο πεδίο εφαρμογής, είναι το καθολικό πεδίο εφαρμογής. Αυτό σημαίνει ότι σε ένα πρόγραμμα περιήγησης, ο κώδικας `var something` θα ορίσει μια νέα καθολική μεταβλητή. Στη Node.js αυτό είναι διαφορετικό. Το ανώτατο πεδίο εφαρμογής δεν είναι το καθολικό πεδίο εφαρμογής· ο κώδικας `var something` μέσα σε μια ενότητα Node.js, ορίζει τη μεταβλητή μόνο σε αυτή την ενότητα.

## module

Η μεταβλητή φαίνεται ως καθολική, αλλά δεν είναι. Δείτε την ενότητα [`module`].

## process
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

Το αντικείμενο process. Δείτε την ενότητα [Αντικείμενο `process`][].

## require()

Η μεταβλητή φαίνεται ως καθολική, αλλά δεν είναι. Δείτε την ενότητα [`require()`].

## setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

Το [`setImmediate`] περιγράφεται στην ενότητα [Χρονομετρητές](timers.html).

## setInterval(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

Το [`setInterval`] περιγράφεται στην ενότητα [Χρονομετρητές](timers.html).

## setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

Το [`setTimeout`] περιγράφεται στην ενότητα [Χρονομετρητές](timers.html).

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
