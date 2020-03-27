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

**Questo modulo è in attesa di deprecazione**. Una volta finalizzata l'API di sostituzione, questo modulo sarà completamente deprecato. La maggior parte degli utenti **non** dovrebbe avere motivo di usare questo modulo. Gli utenti che devono assolutamente disporre delle funzionalità fornite dai domini potrebbero affidarsi ad esso momentaneamente ma in futuro dovrebbero considerare di spostarsi su una soluzione diversa.

I domini forniscono un modo per gestire più operazioni di I/O diverse in un singolo gruppo. Se uno qualsiasi degli event emitter o dei callback registrati a un dominio emettono un evento `'error'`, o generano un errore, il domain object verrà avvisato, invece di perdere il contesto dell'errore nell'handler `process.on('uncaughtException')` o provocare l'uscita immediata del programma con un codice di errore.

## Avviso: Non Ignorare gli Errori!

<!-- type=misc -->

Gli error handler del dominio non sostituiscono la chiusura di un processo quando si verifica un errore.

Per la natura stessa di come funziona [`throw`][] in JavaScript, non c'è quasi mai modo di "riprendere da dove si era rimasti", senza perdere riferimenti o creare qualche altro tipo di istruzione fragile indefinita.

Il modo più sicuro per rispondere ad un errore che è stato generato è arrestare il processo. Ovviamente, in un normale web server, potrebbero esserci molte connessioni aperte e non è ragionevole arrestarle improvvisamente poiché qualcun altro potrebbe aver attivato un errore.

L'approccio migliore consiste nell'inviare una risposta di errore alla richiesta che ha attivato l'errore stesso, lasciando che le altre finiscano normalmente e interrompendo il listening (ascolto) di nuove richieste in quel worker.

In questo modo, l'utilizzo di `domain` va di pari passo con il modulo cluster, in quanto il processo master può creare un nuovo worker tramite il fork quando un worker s'imbatte in un errore. Per i programmi Node.js che si adattano a più macchine, il proxy di chiusura o il registro di servizio possono prendere nota dell'errore e reagire di conseguenza.

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

Utilizzando il contesto di un dominio e l'elasticità di separare il nostro programma in più processi worker, possiamo reagire in modo più appropriato e gestire gli errori con maggiore sicurezza.

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

Ogni volta che un `Error` object viene guidato tramite il routing attraverso un dominio, ad esso vengono assegnati alcuni campi aggiuntivi.

* `error.domain` Il dominio che ha gestito per primo l'errore.
* `error.domainEmitter` L'event emitter che ha emesso un evento `'error'` con l'error object.
* `error.domainBound` La funzione callback che era collegata al dominio tramite il binding ed ha passato un errore come primo argomento.
* `error.domainThrown` Un valore booleano che indica se l'errore è stato generato, emesso o passato ad una funzione callback collegata tramite il binding.

## Binding Implicito

<!--type=misc-->

Se i domini sono in uso, tutti i **nuovi** EventEmitter object (inclusi Stream object, richieste, risposte, ecc.) saranno collegati tramite il binding implicitamente al dominio attivo nel momento della loro creazione.

Additionally, callbacks passed to lowlevel event loop requests (such as to fs.open, or other callback-taking methods) will automatically be bound to the active domain. Se eseguono, allora il dominio catturerà l'errore.

Per evitare un utilizzo eccessivo della memoria, i Domain object non vengono aggiunti in modo implicito come dei children del dominio attivo. Se fossero aggiunti, sarebbe troppo facile impedire che gli object di richiesta e risposta vengano raccolti correttamente tramite la garbage collection.

To nest Domain objects as children of a parent Domain they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the Domain's `'error'` event, but does not register the EventEmitter on the Domain, so [`domain.dispose()`][] will not shut down the EventEmitter. Il binding implicito si occupa solo degli errori generati e degli eventi `'error'`.

## Binding Esplicito

<!--type=misc-->

A volte, il dominio in uso non è quello che dovrebbe essere utilizzato per uno specifico event emitter. Oppure, l'event emitter potrebbe essere stato creato nel contesto di un dominio quando però dovrebbe essere collegato tramite il binding ad un altro dominio.

Ad esempio, potrebbe esserci un dominio in uso per un server HTTP ma sarebbe più utile avere un dominio separato da utilizzare per ogni richiesta.

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

La classe Domain incapsula la funzionalità degli errori di routing e delle eccezioni non rilevate sul Domain object attivo.

Domain è una classe child di [`EventEmitter`][]. Per gestire gli errori rilevati, esegui il listening (ascolto) del loro evento `'error'`.

### domain.members

* {Array}

Un array di timer ed event emitter che sono stati esplicitamente aggiunti al dominio.

### domain.add(emitter)

* `emitter` {EventEmitter|Timer} emitter o timer da aggiungere al dominio

Aggiunge esplicitamente un emitter al dominio. Se qualsiasi event handler chiamato dall'emitter genera un errore oppure se l'emitter emette un evento `'error'`, questo verrà indirizzato all'evento `'error'` del dominio, semplicemente come un binding implicito.

Questo funziona anche con i timer che vengono restituiti da [`setInterval()`][] e [`setTimeout()`][]. Se la loro funzione callback esegue, essa verrà catturata dall''error' handler del dominio.

Se il Timer o l'EventEmitter era già stato collegato a un dominio tramite il binding, allora verrà rimosso da quello e collegato a quest'altro dominio.

### domain.bind(callback)

* `callback` {Function} La funzione callback
* Restituisce: {Function} La funzione sottoposta al binding

La funzione restituita sarà un wrapper attorno alla funzione callback fornita. Quando viene chiamata la funzione restituita, gli eventuali errori generati verranno indirizzati all'evento `'error'` del dominio.

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

The `exit` method exits the current domain, popping it off the domain stack. Ogni volta che l'esecuzione passa al contesto di una catena diversa di chiamate asincrone è importante assicurarsi che il dominio corrente venga chiuso. The call to `exit` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit` will exit any domains nested within this domain.

Calling `exit` changes only the active domain, and does not alter the domain itself. `enter` and `exit` can be called an arbitrary number of times on a single domain.

If the domain on which `exit` is called has been disposed, `exit` will return without exiting the domain.

### domain.intercept(callback)

* `callback` {Function} La funzione callback
* Restituisce: {Function} La funzione intercettata

Questo metodo è quasi identico a [`domain.bind(callback)`][]. Tuttavia, oltre a rilevare gli errori generati, intercetterà anche gli [`Error`][] object inviati come primo argomento della funzione.

In questo modo, il comune modello `if (err) return callback(err);` può essere sostituito con un singolo error handler in un unico posto.

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

L'opposto di [`domain.add(emitter)`][]. Rimuove la gestione del dominio dall'emitter specificato.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Esegue la funzione fornita nel contesto del dominio, collegando implicitamente tramite il binding tutti gli event emitter, i timer e le richieste di basso livello create in tale contesto. Facoltativamente, gli argomenti possono essere passati alla funzione.

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

In questo esempio, il `d.on('error')` handler verrà attivato anziché arrestare il programma.

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
