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

> Estabilidad: 0 - En desuso

**Este módulo esta por convertirse en obsoleto**. Once a replacement API has been finalized, this module will be fully deprecated. Most end users should **not** have cause to use this module. Users who absolutely must have the functionality that domains provide may rely on it for the time being but should expect to have to migrate to a different solution in the future.

Domains provide a way to handle multiple different IO operations as a single group. If any of the event emitters or callbacks registered to a domain emit an `'error'` event, or throw an error, then the domain object will be notified, rather than losing the context of the error in the `process.on('uncaughtException')` handler, or causing the program to exit immediately with an error code.

## Advertencia: ¡No ignore los errores!

<!-- type=misc -->

Domain error handlers are not a substitute for closing down a process when an error occurs.

By the very nature of how [`throw`][] works in JavaScript, there is almost never any way to safely "pick up where it left off", without leaking references, or creating some other sort of undefined brittle state.

The safest way to respond to a thrown error is to shut down the process. Of course, in a normal web server, there may be many open connections, and it is not reasonable to abruptly shut those down because an error was triggered by someone else.

The better approach is to send an error response to the request that triggered the error, while letting the others finish in their normal time, and stop listening for new requests in that worker.

In this way, `domain` usage goes hand-in-hand with the cluster module, since the master process can fork a new worker when a worker encounters an error. For Node.js programs that scale to multiple machines, the terminating proxy or service registry can take note of the failure, and react accordingly.

Por ejemplo, no es una buena idea:

```js
// XXX ¡ADVERTENCIA! ¡MALA IDEA!

const d = require('domain').create();
d.on('error', (er) => {
  // ¡El error no colisionará el proceso, hará algo peor!
  //// Aunque hemos evitado el reinicio abrupto del proceso, estaremos perdiendo
  // recursos como locos si esto llegase a suceder.
  // ¡Esto no es mejor que process.on('uncaughtException')!
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
// ¡Mucho mejor!

const cluster = require('cluster');
const PORT = +process.env.PORT || 1337;

if (cluster.isMaster) {    
  // Un escenario más realista tendría más de dos workers y,
  // quizás, no colocaría al principal y al worker en la misma carpeta.
  //
  // también es posible adornar un poco el registro e 
 // implementar cualquier lógica personalizada necesaria para evitar que DoS
  // ataque y otro mal comportamiento.
  //
  // Vea las opciones en la documentación del clúster.
  //
  // Lo importante es que el proceso principal hace poco, 
  // incrementando nuestra resiliencia ante errores inesperados.

  cluster.fork();
  cluster.fork();

  cluster.on('disconnect', (worker) => {
    console.error('disconnect!');
    cluster.fork();
  });

} else {
  // el trabajador
  //
  // ¡ Aquí es donde colocas los errores!

  const domain = require('domain');

  // Vea la documentación del clúster para más detalles sobre el uso de
  // procesos de worker para atender solicitudes. Cómo funciona, advertencias, entre otras.

  const server = require('http').createServer((req, res) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);

      // We're in dangerous territory!
      Por definición, algo inesperado ocurrió,
      / / que probablemente no queríamos.
      // ¡Cualquier cosa puede suceder ahora! ¡Ten mucho cuidado!

      try {
        // asegúrese de cerrar en un lapso de 30 segundos
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        // ¡Pero no mantenga el proceso abierto solo por eso!
        killtimer.unref();

        // no tomes nuevas solicitudes.
        server.close();

        // Deja que el proceso principal sepa que estamos muertos. Esto desencadenará un
        // 'disconnect' en el clúster principal y, luego, se bifurcará
        // un nuevo worker.
        cluster.worker.disconnect();

        // intenta enviar un error a la solicitud que arrojó el problema
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('¡Ups, hubo un problema!\n');
      } catch (er2) {
        // Bueno, no se puede hacer mucho en este punto.
        console.error(`Error sending 500! ${er2.stack}`);
      }
    });

    // Porque req y res fueron creadas antes de que este dominio existiera,
    // necesitamos añadirlas explícitamente.
    // Mira más abajo la explicación de la vinculación implícita y explicita.
    d.add(req);     d.add(res);
     // Ahora ejecute la función del manejador en el dominio.
    d.run(() => {
      handleRequest(req, res);
    });
  });
  server.listen(PORT);
}

// Esta parte no es importante. Sólo un ejemplo de enrutamiento.
// Coloca aquí una elaborada lógica de aplicación.
function handleRequest(req, res) {
  switch (req.url) {
    case '/error':
      // Hacemos algunas cosas asincrónicas y...
      setTimeout(() => {
        // ¡Ups!
        flerb.bark();
      }, timeout);
      break;
    default:
      res.end('ok');
  }
}
```

## Nuevos objetos de Errores

<!-- type=misc -->

Any time an `Error` object is routed through a domain, a few extra fields are added to it.

* `error.domain` El dominio que se encargó primero del error.
* `error.domainEmitter` The event emitter that emitted an `'error'` event with the error object.
* `error.domainBound` The callback function which was bound to the domain, and passed an error as its first argument.
* `error.domainThrown` A boolean indicating whether the error was thrown, emitted, or passed to a bound callback function.

## Enlace implícito

<!--type=misc-->

If domains are in use, then all **new** `EventEmitter` objects (including Stream objects, requests, responses, etc.) will be implicitly bound to the active domain at the time of their creation.

Additionally, callbacks passed to lowlevel event loop requests (such as to `fs.open()`, or other callback-taking methods) will automatically be bound to the active domain. If they throw, then the domain will catch the error.

In order to prevent excessive memory usage, `Domain` objects themselves are not implicitly added as children of the active domain. If they were, then it would be too easy to prevent request and response objects from being properly garbage collected.

To nest `Domain` objects as children of a parent `Domain` they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the `Domain`'s `'error'` event, but does not register the `EventEmitter` on the `Domain`. Los enlaces implícitos solo se encargan de los errores arrojados y los eventos de `'error'`.

## Vinculación Explícita

<!--type=misc-->

Sometimes, the domain in use is not the one that ought to be used for a specific event emitter. Or, the event emitter could have been created in the context of one domain, but ought to instead be bound to some other domain.

For example, there could be one domain in use for an HTTP server, but perhaps we would like to have a separate domain to use for each request.

Eso es posible a través del enlazado explícito.

```js
// cree un dominio superior para el servidor
const domain = require('domain');
const http = require('http');
const serverDomain = domain.create();

serverDomain.run(() => {
  // el servidor se crea en el ámbito de ServerDomain
  http.createServer((req, res) => {
    // req y res también son creadas en el ámbito de ServerDomain
    // sin embargo, preferiríamos tener un dominio individual para cada solicitud.
    // créelo primero, y agregue req y res.
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

* Devuelve: {Domain}

## Clase: Dominio

The `Domain` class encapsulates the functionality of routing errors and uncaught exceptions to the active `Domain` object.

El `Dominios` es una clase menor de [`EvetoEmisor`][]. To handle the errors that it catches, listen to its `'error'` event.

### domain.members

* {Array}

An array of timers and event emitters that have been explicitly added to the domain.

### domain.add(emisor)

* `emisor`{EventEmitter|Timer} emisor o temporizador a ser agregado al dominio

Agrega explícitamente un emisor al dominio. If any event handlers called by the emitter throw an error, or if the emitter emits an `'error'` event, it will be routed to the domain's `'error'` event, just like with implicit binding.

This also works with timers that are returned from [`setInterval()`][] and [`setTimeout()`][]. If their callback function throws, it will be caught by the domain `'error'` handler.

If the Timer or `EventEmitter` was already bound to a domain, it is removed from that one, and bound to this one instead.

### domain.bind(callback)

* `callback`{Function} La función de callback
* Devuelve: {Function} La función enlazada

The returned function will be a wrapper around the supplied callback function. When the returned function is called, any errors that are thrown will be routed to the domain's `'error'` event.

```js
const d = domain.create();


function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // si este error es arrojado, también será pasado al dominio
    return cb(er, data ? JSON.parse(data) : null);
  }));
}

d.on('error', (er) => {
  // ha ocurrido un error en algún lugar.
  // el programa fallará si lo arrojamos ahora
  // con la línea de número normal y el mensaje apilado.
});
```

### domain.enter()

The `enter()` method is plumbing used by the `run()`, `bind()`, and `intercept()` methods to set the active domain. It sets `domain.active` and `process.domain` to the domain, and implicitly pushes the domain onto the domain stack managed by the domain module (see [`domain.exit()`][] for details on the domain stack). The call to `enter()` delimits the beginning of a chain of asynchronous calls and I/O operations bound to a domain.

Calling `enter()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.exit()

El método de `exit()` sale del dominio actual, llevándolo fuera de la pila de dominios. Any time execution is going to switch to the context of a different chain of asynchronous calls, it's important to ensure that the current domain is exited. The call to `exit()` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit()` will exit any domains nested within this domain.

Calling `exit()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### domain.intercept(callback)

* `callback`{Function} La función de callback
* Devuelve: {Function} La función interceptada

Este método es muy similar a [`domain.bind(callback)`][]. However, in addition to catching thrown errors, it will also intercept [`Error`][] objects sent as the first argument to the function.

In this way, the common `if (err) return callback(err);` pattern can be replaced with a single error handler in a single place.

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.intercept((data) => {
    // Tenga en cuenta que el primer argumento nunca se pasa a la
    // callback, ya que se supone que es el argumento 'Error'
    // y, por lo tanto, es interceptado por el dominio.

    // Si esto ocurre, también se pasará al dominio
    // para que la lógica de manejo de errores se pueda mover al evento 'error'
    //  en el dominio en lugar de repetirse a lo largo
    // del programa.
    return cb(null, JSON.parse(data));
  }));
}

d.on('error', (er) => {
  // ha ocurrido un error en algún lugar.
  // el programa fallará si lo arrojamos ahora
  // con la línea de número normal y el mensaje apilado.
});
```

### domain.remove(emisor)

* `emitter`{EventEmitter|Timer} Emisor o temporizador a ser eliminado del dominio

Lo opuesto de [`domain.add(emitter)`][]. Removes domain handling from the specified emitter.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Run the supplied function in the context of the domain, implicitly binding all event emitters, timers, and lowlevel requests that are created in that context. Optionally, arguments can be passed to the function.

Esta es la forma más básica de utilizar un dominio.

```js
onst domain = require('domain');
const fs = require('fs');
const d = domain.create();
d.on('error', (er) => {
  console.error('Caught error!', er);
});
d.run(() => {
  process.nextTick(() => {
    setTimeout(() => { // simulando algunas cosas async
      fs.open('non-existent file', 'r', (er, fd) => {
        if (er) throw er;
        // continua...
      });
    }, 100);
  });
});
```

In this example, the `d.on('error')` handler will be triggered, rather than crashing the program.

## Dominios y Promesas

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
    // ejecutándose en d2
  });
});
```

Una callback puede estar vinculada a un dominio en específico usando [`domain.bind(callback)`][]:

```js
const d1 = domain.create();
const d2 = domain.create();

let p;
d1.run(() => {
  p = Promise.resolve(42);
});

d2.run(() => {
  p.then(p.domain.bind((v) => {
     // ejecutándose en d1
    }));
});
```

Note that domains will not interfere with the error handling mechanisms for Promises, i.e. no `'error'` event will be emitted for unhandled `Promise` rejections.