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

> Stabilità: 0 - Deprecato

**Questo modulo è in attesa di deprecazione**. Once a replacement API has been finalized, this module will be fully deprecated. Most end users should **not** have cause to use this module. Users who absolutely must have the functionality that domains provide may rely on it for the time being but should expect to have to migrate to a different solution in the future.

Domains provide a way to handle multiple different IO operations as a single group. If any of the event emitters or callbacks registered to a domain emit an `'error'` event, or throw an error, then the domain object will be notified, rather than losing the context of the error in the `process.on('uncaughtException')` handler, or causing the program to exit immediately with an error code.

## Avviso: Non Ignorare gli Errori!

<!-- type=misc -->

Domain error handlers are not a substitute for closing down a process when an error occurs.

By the very nature of how [`throw`][] works in JavaScript, there is almost never any way to safely "pick up where you left off", without leaking references, or creating some other sort of undefined brittle state.

The safest way to respond to a thrown error is to shut down the process. Of course, in a normal web server, there may be many open connections, and it is not reasonable to abruptly shut those down because an error was triggered by someone else.

The better approach is to send an error response to the request that triggered the error, while letting the others finish in their normal time, and stop listening for new requests in that worker.

In this way, `domain` usage goes hand-in-hand with the cluster module, since the master process can fork a new worker when a worker encounters an error. For Node.js programs that scale to multiple machines, the terminating proxy or service registry can take note of the failure, and react accordingly.

Ad esempio, questa non è una buona idea:

```js
// XXX ATTENZIONE!  PESSIMA IDEA!

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

By using the context of a domain, and the resilience of separating our program into multiple worker processes, we can react more appropriately, and handle errors with much greater safety.

```js
// Molto meglio!

const cluster = require('cluster');
const PORT = +process.env.PORT || 1337;

if (cluster.isMaster) {
  // Uno scenario più realistico avrebbe più di 2 worker
  // e forse non avrebbe messo master e worker nello stesso file.
  //
  // È anche possibile essere un pò più elaborati nella registrazione e 
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
// Metti qui una logica delle applicazioni elaborata.
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

Any time an `Error` object is routed through a domain, a few extra fields are added to it.

* `error.domain` Il dominio che ha gestito per primo l'errore.
* `error.domainEmitter` The event emitter that emitted an `'error'` event with the error object.
* `error.domainBound` The callback function which was bound to the domain, and passed an error as its first argument.
* `error.domainThrown` A boolean indicating whether the error was thrown, emitted, or passed to a bound callback function.

## Binding Implicito

<!--type=misc-->

If domains are in use, then all **new** EventEmitter objects (including Stream objects, requests, responses, etc.) will be implicitly bound to the active domain at the time of their creation.

Additionally, callbacks passed to lowlevel event loop requests (such as to fs.open, or other callback-taking methods) will automatically be bound to the active domain. If they throw, then the domain will catch the error.

In order to prevent excessive memory usage, Domain objects themselves are not implicitly added as children of the active domain. If they were, then it would be too easy to prevent request and response objects from being properly garbage collected.

To nest Domain objects as children of a parent Domain they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the Domain's `'error'` event, but does not register the EventEmitter on the Domain, so [`domain.dispose()`][] will not shut down the EventEmitter. Il binding implicito si occupa solo degli errori generati e degli eventi `'error'`.

## Binding Esplicito

<!--type=misc-->

Sometimes, the domain in use is not the one that ought to be used for a specific event emitter. Or, the event emitter could have been created in the context of one domain, but ought to instead be bound to some other domain.

For example, there could be one domain in use for an HTTP server, but perhaps we would like to have a separate domain to use for each request.

Questo è possibile tramite il binding esplicito.

Per esempio:

```js
// crea un dominio di alto livello per il server
const domain = require('domain');
const http = require('http');
const serverDomain = domain.create();

serverDomain.run(() => {
  // il server è creato nello scope di serverDomain
  http.createServer((req, res) => {
    // req e res sono anch'essi creati nello scope di serverDomain
    // tuttavia, preferiremmo avere un dominio separato per ogni richiesta.
    // prima di tutto crea il dominio, successivamente aggiungi req e res ad esso.
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

* Restituisce: {Domain}

Returns a new Domain object.

## Class: Domain

The Domain class encapsulates the functionality of routing errors and uncaught exceptions to the active Domain object.

Domain è una classe child di [`EventEmitter`][]. To handle the errors that it catches, listen to its `'error'` event.

### domain.members

* {Array}

An array of timers and event emitters that have been explicitly added to the domain.

### domain.add(emitter)

* `emitter` {EventEmitter|Timer} emitter o timer da aggiungere al dominio

Aggiunge esplicitamente un emitter al dominio. If any event handlers called by the emitter throw an error, or if the emitter emits an `'error'` event, it will be routed to the domain's `'error'` event, just like with implicit binding.

This also works with timers that are returned from [`setInterval()`][] and [`setTimeout()`][]. If their callback function throws, it will be caught by the domain 'error' handler.

If the Timer or EventEmitter was already bound to a domain, it is removed from that one, and bound to this one instead.

### domain.bind(callback)

* `callback` {Function} La funzione callback
* Restituisce: {Function} La funzione sottoposta al binding

The returned function will be a wrapper around the supplied callback function. When the returned function is called, any errors that are thrown will be routed to the domain's `'error'` event.

#### Esempio

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // se questo esegue, verrà anche passato al dominio
    return cb(er, data ? JSON.parse(data) : null);
  }));
}

d.on('error', (er) => {
  // un errore che si è verificato da qualche parte.
  // se lo eseguiamo adesso, il programma si bloccherà 
  // con il normale numero della riga e lo stack message.
});
```

### domain.dispose()

> Stabilità: 0 - Obsoleto. Please recover from failed IO actions explicitly via error event handlers set on the domain.

Once `dispose` has been called, the domain will no longer be used by callbacks bound into the domain via `run`, `bind`, or `intercept`, and a `'dispose'` event is emitted.

### domain.enter()

The `enter` method is plumbing used by the `run`, `bind`, and `intercept` methods to set the active domain. It sets `domain.active` and `process.domain` to the domain, and implicitly pushes the domain onto the domain stack managed by the domain module (see [`domain.exit()`][] for details on the domain stack). The call to `enter` delimits the beginning of a chain of asynchronous calls and I/O operations bound to a domain.

Calling `enter` changes only the active domain, and does not alter the domain itself. `enter` and `exit` can be called an arbitrary number of times on a single domain.

If the domain on which `enter` is called has been disposed, `enter` will return without setting the domain.

### domain.exit()

The `exit` method exits the current domain, popping it off the domain stack. Any time execution is going to switch to the context of a different chain of asynchronous calls, it's important to ensure that the current domain is exited. The call to `exit` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit` will exit any domains nested within this domain.

Calling `exit` changes only the active domain, and does not alter the domain itself. `enter` and `exit` can be called an arbitrary number of times on a single domain.

If the domain on which `exit` is called has been disposed, `exit` will return without exiting the domain.

### domain.intercept(callback)

* `callback` {Function} La funzione callback
* Restituisce: {Function} La funzione intercettata

Questo metodo è quasi identico a [`domain.bind(callback)`][]. However, in addition to catching thrown errors, it will also intercept [`Error`][] objects sent as the first argument to the function.

In this way, the common `if (err) return callback(err);` pattern can be replaced with a single error handler in a single place.

#### Esempio

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.intercept((data) => {
    // Da notare che il primo argomento non viene mai passato al
    // callback in quanto si presume che esso sia l'argomento 'Error'
    // e che quindi sia stato intercettato dal dominio.

    // se questo esegue, verrà anche passato al dominio 
    // in modo che la logica dell'error-handling possa essere spostata all'evento 
    // 'error' sul dominio invece di essere ripetuta all'interno di tutto
    // il programma.
    return cb(null, JSON.parse(data));
  }));
}

d.on('error', (er) => {
  // un errore che si è verificato da qualche parte.
  // se lo eseguiamo adesso, il programma si bloccherà 
  // con il normale numero della riga e lo stack message.
});
```

### domain.remove(emitter)

* `emitter` {EventEmitter|Timer} emitter o timer da rimuovere dal dominio

L'opposto di [`domain.add(emitter)`][]. Removes domain handling from the specified emitter.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Run the supplied function in the context of the domain, implicitly binding all event emitters, timers, and lowlevel requests that are created in that context. Optionally, arguments can be passed to the function.

Questo è il modo più semplice per usare un dominio.

Esempio:

```js
const domain = require('domain');
const fs = require('fs');
const d = domain.create();
d.on('error', (er) => {
  console.error('Caught error!', er);
});
d.run(() => {
  process.nextTick(() => {
    setTimeout(() => { // simulando varie operazioni asincrone
      fs.open('non-existent file', 'r', (er, fd) => {
        if (er) throw er;
        // procedere...
      });
    }, 100);
  });
});
```

In this example, the `d.on('error')` handler will be triggered, rather than crashing the program.

## Domini e Promise

As of Node 8.0.0, the handlers of Promises are run inside the domain in which the call to `.then` or `.catch` itself was made:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then((v) => {
    // in esecuzione all'interno di d2
  });
});
```

Un callback potrebbe essere collegato tramite il binding a un dominio specifico utilizzando [`domain.bind(callback)`][]:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then(p.domain.bind((v) => {
    // in esecuzione all'interno di d1
  }));
});
```

Note that domains will not interfere with the error handling mechanisms for Promises, i.e. no `error` event will be emitted for unhandled Promise rejections.