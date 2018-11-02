# Dominio

<!-- YAML
changes:

  - version: v8.8.0
    description: Any `Promise`s created in VM contexts no longer have a
                 `.domain` property. Their handlers are still executed in the
                 proper domain, however, and `Promise`s created in the main
                 context still possess a `.domain` property.
  - version: v8.0.0
    pr-url: https://github.com/nodejs/node/pull/12489
    description: Handlers for `Promise`s are now invoked in the domain in which
                 the first promise of a chain was created.
-->

<!--introduced_in=v0.10.0-->

> Stabilità: 0 - Obsoleto

**Questo modulo è in attesa di deprecazione**. Una volta finalizzata l'API di sostituzione, questo modulo sarà completamente deprecato. La maggior parte degli utenti **non** dovrebbe avere motivo di usare questo modulo. Gli utenti che devono assolutamente disporre delle funzionalità fornite dai domini potrebbero affidarsi ad esso momentaneamente ma in futuro dovrebbero considerare di spostarsi su una soluzione diversa.

I domini forniscono un modo per gestire più operazioni di I/O diverse in un singolo gruppo. Se uno qualsiasi degli event emitter o dei callback registrati a un dominio emettono un evento `'error'`, o generano un errore, il domain object verrà avvisato, invece di perdere il contesto dell'errore nell'handler `process.on('uncaughtException')` o provocare l'uscita immediata del programma con un codice di errore.

## Avviso: Non Ignorare gli Errori!

<!-- type=misc -->

Gli error handler del dominio non sostituiscono la chiusura di un processo quando si verifica un errore.

Per la natura stessa di come funziona [`throw`][] in JavaScript, non c'è quasi mai modo di "riprendere da dove si era rimasti", senza perdere riferimenti o creare qualche altro tipo di istruzione fragile indefinita.

Il modo più sicuro per rispondere ad un errore che è stato generato è arrestare il processo. Ovviamente, in un normale web server, potrebbero esserci molte connessioni aperte e non è ragionevole arrestarle improvvisamente poiché qualcun altro potrebbe aver attivato un errore.

L'approccio migliore consiste nell'inviare una risposta di errore alla richiesta che ha attivato l'errore stesso, lasciando che gli altri errori finiscano normalmente e interrompendo il listening (ascolto) di nuove richieste in quel worker.

In questo modo, l'utilizzo di `domain` va di pari passo con il modulo cluster, in quanto il processo master può creare un nuovo worker tramite il fork quando un worker s'imbatte in un errore. Per i programmi Node.js che si adattano a più macchine, il proxy di chiusura o il registro di servizio possono prendere nota dell'errore e reagire di conseguenza.

Ad esempio, questa non è una buona idea:

```js
// XXX ATTENZIONE! PESSIMA IDEA!

const d = require('domain').create();
d.on('error', (er) => {
  // L'errore non causerà il crash del processo, bensì qualcosa di peggiore!
  // Anche se abbiamo impedito il brusco riavvio del processo, perderemo molte
  // risorse se ciò dovesse accadere.
  // Questo non è migliore di process.on('uncaughtException')!
  console.log(`error, but oh well ${er.message}`);
});
d.run(() => {
  require('http').createServer((req, res) => {
    handleRequest(req, res);
  }).listen(PORT);
});
```

Utilizzando il contesto di un dominio e l'elasticità di separare il nostro programma in più processi worker, possiamo reagire in modo più appropriato e gestire gli errori con maggiore sicurezza.

```js
// Molto meglio!

const cluster = require('cluster');
const PORT = +process.env.PORT || 1337;

if (cluster.isMaster) {
  // Uno scenario più realistico avrebbe più di 2 worker
  // e forse non avrebbe messo master e worker nello stesso file.
  //
  // È anche possibile essere un pò più interessati alla registrazione e 
  // implementare qualsiasi logica personalizzata necessaria per prevenire attacchi 
  // DoS e altri comportamenti scorretti.
  //
  // Vedi le opzioni nella documentazione del cluster.
  //
  // L'importante è che il master faccia molto poco,
  // aumentando la nostra capacità di reagire agli errori imprevisti.

  cluster.fork();
  cluster.fork();

  cluster.on('disconnect', (worker) => {
    console.error('disconnect!');
    cluster.fork();
  });

} else {
  // il worker
  //
  // Qui è dove abbiamo messo i nostri bug!

  const domain = require('domain');

  // Vedi la documentazione del cluster per ulteriori dettagli sull'utilizzo
  // dei processi worker per soddisfare le richieste. Come funziona, avvertenze, ecc.

  const server = require('http').createServer((req, res) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);

      // Nota: Siamo in un territorio pericoloso!
      // Per definizione, si è verificato qualcosa di inaspettato, 
      // cosa che probabilmente non volevamo.
      // Adesso può succedere qualsiasi cosa! Stai molto attento!

      try {
        // assicurati di chiuderlo entro 30 secondi
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        // Ma non mantenere aperto il processo solo per la questione dei 30 secondi!
        killtimer.unref();

        // non prendere più nuove richieste.
        server.close();

        // Fai sapere al master che siamo stati arrestati. Ciò attiverà un
        // 'disconnect' nel master del cluster e quindi creerà tramite il fork
        // un nuovo worker.
        cluster.worker.disconnect();

        // prova ad inviare un errore alla richiesta che ha attivato il problema
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Oops, there was a problem!\n');
      } catch (er2) {
        // oh beh, non c'è molto da fare a questo punto.
        console.error(`Error sending 500! ${er2.stack}`);
      }
    });

    // Poiché req e res sono stati creati prima dell'esistenza di questo dominio,
    // è necessario aggiungerli esplicitamente.
    // Vedi la differenza tra binding implicito ed esplicito qui sotto.
    d.add(req);
    d.add(res);

    // Ora esegui la funzione handler all'interno del dominio.
    d.run(() => {
      handleRequest(req, res)
    });
  });
  server.listen(PORT);
}

// Questa parte non è importante. Un semplice esempio di routing.
// Metti qui la logica delle applicazioni interessate.
function handleRequest(req, res) {
  switch (req.url) {
    case '/error':
      // Facciamo alcune operazioni asincrone, successivamente...
      setTimeout(() => {
        // Ops!
        flerb.bark();
      }, timeout);
      break;
    default:
      res.end('ok');
  }
}
```

## Aggiunte agli Error object

<!-- type=misc -->

Ogni volta che un `Error` object viene guidato tramite il routing attraverso un dominio, ad esso vengono assegnati alcuni campi aggiuntivi.

* `error.domain` Il dominio che ha gestito per primo l'errore.
* `error.domainEmitter` The event emitter that emitted an `'error'` event with the error object.
* `error.domainBound` The callback function which was bound to the domain, and passed an error as its first argument.
* `error.domainThrown` A boolean indicating whether the error was thrown, emitted, or passed to a bound callback function.

## Implicit Binding

<!--type=misc-->

If domains are in use, then all **new** `EventEmitter` objects (including Stream objects, requests, responses, etc.) will be implicitly bound to the active domain at the time of their creation.

Additionally, callbacks passed to lowlevel event loop requests (such as to `fs.open()`, or other callback-taking methods) will automatically be bound to the active domain. If they throw, then the domain will catch the error.

In order to prevent excessive memory usage, `Domain` objects themselves are not implicitly added as children of the active domain. If they were, then it would be too easy to prevent request and response objects from being properly garbage collected.

To nest `Domain` objects as children of a parent `Domain` they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the `Domain`'s `'error'` event, but does not register the `EventEmitter` on the `Domain`. Implicit binding only takes care of thrown errors and `'error'` events.

## Explicit Binding

<!--type=misc-->

Sometimes, the domain in use is not the one that ought to be used for a specific event emitter. Or, the event emitter could have been created in the context of one domain, but ought to instead be bound to some other domain.

For example, there could be one domain in use for an HTTP server, but perhaps we would like to have a separate domain to use for each request.

That is possible via explicit binding.

```js
// create a top-level domain for the server
const domain = require('domain');
const http = require('http');
const serverDomain = domain.create();

serverDomain.run(() => {
  // server is created in the scope of serverDomain
  http.createServer((req, res) => {
    // req and res are also created in the scope of serverDomain
    // however, we'd prefer to have a separate domain for each request.
    // create it first thing, and add req and res to it.
    const reqd = domain.create();
    reqd.add(req);
    reqd.add(res);
    reqd.on('error', (er) => {
      console.error('Error', er, req.url);
      try {
        res.writeHead(500);
        res.end('Error occurred, sorry.');
      } catch (er2) {
        console.error('Error sending 500', er2, req.url);
      }
    });
  }).listen(1337);
});
```

## domain.create()

* Returns: {Domain}

## Class: Domain

The `Domain` class encapsulates the functionality of routing errors and uncaught exceptions to the active `Domain` object.

`Domain` is a child class of [`EventEmitter`][]. To handle the errors that it catches, listen to its `'error'` event.

### domain.members

* {Array}

An array of timers and event emitters that have been explicitly added to the domain.

### domain.add(emitter)

* `emitter` {EventEmitter|Timer} emitter or timer to be added to the domain

Explicitly adds an emitter to the domain. If any event handlers called by the emitter throw an error, or if the emitter emits an `'error'` event, it will be routed to the domain's `'error'` event, just like with implicit binding.

This also works with timers that are returned from [`setInterval()`][] and [`setTimeout()`][]. If their callback function throws, it will be caught by the domain `'error'` handler.

If the Timer or `EventEmitter` was already bound to a domain, it is removed from that one, and bound to this one instead.

### domain.bind(callback)

* `callback` {Function} The callback function
* Returns: {Function} The bound function

The returned function will be a wrapper around the supplied callback function. When the returned function is called, any errors that are thrown will be routed to the domain's `'error'` event.

#### Example

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // if this throws, it will also be passed to the domain
    return cb(er, data ? JSON.parse(data) : null);
  }));
}

d.on('error', (er) => {
  // an error occurred somewhere.
  // if we throw it now, it will crash the program
  // with the normal line number and stack message.
});
```

### domain.enter()

The `enter()` method is plumbing used by the `run()`, `bind()`, and `intercept()` methods to set the active domain. It sets `domain.active` and `process.domain` to the domain, and implicitly pushes the domain onto the domain stack managed by the domain module (see [`domain.exit()`][] for details on the domain stack). The call to `enter()` delimits the beginning of a chain of asynchronous calls and I/O operations bound to a domain.

Calling `enter()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.exit()

The `exit()` method exits the current domain, popping it off the domain stack. Any time execution is going to switch to the context of a different chain of asynchronous calls, it's important to ensure that the current domain is exited. The call to `exit()` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit()` will exit any domains nested within this domain.

Calling `exit()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.intercept(callback)

* `callback` {Function} The callback function
* Returns: {Function} The intercepted function

This method is almost identical to [`domain.bind(callback)`][]. However, in addition to catching thrown errors, it will also intercept [`Error`][] objects sent as the first argument to the function.

In this way, the common `if (err) return callback(err);` pattern can be replaced with a single error handler in a single place.

#### Example

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.intercept((data) => {
    // note, the first argument is never passed to the
    // callback since it is assumed to be the 'Error' argument
    // and thus intercepted by the domain.

    // if this throws, it will also be passed to the domain
    // so the error-handling logic can be moved to the 'error'
    // event on the domain instead of being repeated throughout
    // the program.
    return cb(null, JSON.parse(data));
  }));
}

d.on('error', (er) => {
  // an error occurred somewhere.
  // if we throw it now, it will crash the program
  // with the normal line number and stack message.
});
```

### domain.remove(emitter)

* `emitter` {EventEmitter|Timer} emitter or timer to be removed from the domain

The opposite of [`domain.add(emitter)`][]. Removes domain handling from the specified emitter.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Run the supplied function in the context of the domain, implicitly binding all event emitters, timers, and lowlevel requests that are created in that context. Optionally, arguments can be passed to the function.

This is the most basic way to use a domain.

Example:

```js
const domain = require('domain');
const fs = require('fs');
const d = domain.create();
d.on('error', (er) => {
  console.error('Caught error!', er);
});
d.run(() => {
  process.nextTick(() => {
    setTimeout(() => { // simulating some various async stuff
      fs.open('non-existent file', 'r', (er, fd) => {
        if (er) throw er;
        // proceed...
      });
    }, 100);
  });
});
```

In this example, the `d.on('error')` handler will be triggered, rather than crashing the program.

## Domains and Promises

As of Node.js 8.0.0, the handlers of Promises are run inside the domain in which the call to `.then()` or `.catch()` itself was made:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then((v) => {
    // running in d2
  });
});
```

A callback may be bound to a specific domain using [`domain.bind(callback)`][]:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then(p.domain.bind((v) => {
    // running in d1
  }));
});
```

Note that domains will not interfere with the error handling mechanisms for Promises, i.e. no `'error'` event will be emitted for unhandled `Promise` rejections.