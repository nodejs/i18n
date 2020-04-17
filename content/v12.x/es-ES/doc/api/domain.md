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

> Estabilidad: 0 - Desaprobado

**This module is pending deprecation**. Este módulo será completamente inútil una vez que el reemplazo de la API haya finalizado. Most end users should **not** have cause to use this module. Los usuarios que absolutamente requieran de la funcionalidad que los dominios ofrecen pueden hacer uso de ella en este momento, pero deben esperar tener que migrar a una solución distinta en el futuro.

Los dominios proporcionan una forma de manejar múltiples y diversas operaciones IO como una unidad. Si alguno de los emisores de eventos o callbacks registrados a un dominio emiten un evento `'error'`, o arrojan un error, entonces el objeto del dominio será notificado, en vez de perder el contexto del error en el manejador `process.on('uncaughtException')`, o causar que el programa se cierre inmediatamente con un código de error.

## Advertencia: ¡No ignore los errores!

<!-- type=misc -->

Domain error handlers are not a substitute for closing down a process when an error occurs.

By the very nature of how [`throw`][] works in JavaScript, there is almost never any way to safely "pick up where it left off", without leaking references, or creating some other sort of undefined brittle state.

La manera más segura de responder a un error arrojado es cerrar el proceso. Of course, in a normal web server, there may be many open connections, and it is not reasonable to abruptly shut those down because an error was triggered by someone else.

La mejor solución es enviar una respuesta de error a la solicitud que produjo el error, dejando que las otras terminen en su tiempo habitual y deteniendo la escucha de nuevas solicitudes en ese worker.

De esta forma, el uso de `domain` se hace en conjunto al módulo clúster, ya que el proceso principal puede bifurcar un nuevo worker cuando un worker encuentre un error. Para los programas de Node.js que escalan en múltiples máquinas, el proxy final o servicio de registro pueden registrar la falla y reaccionar como corresponde.

Por ejemplo, esto no es una buena idea:

```js
// XXX ¡ADVERTENCIA! ¡MALA IDEA!

const d = require('domain').create();
d.on('error', (er) => {
  // El error no colapsará el proceso, ¡hará algo peor!
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

Al usar el contexto de un dominio y la resiliencia al separar nuestro programa en múltiples procesos de worker, podemos reaccionar de manera más apropiada y manejar los errores con mayor seguridad.

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
  // el worker
  //
  // ¡Aquí es donde se colocan nuestros errores!

  const domain = require('domain');

  // Vea la documentación del clúster para más detalles sobre el uso de
  // procesos de worker para atender solicitudes. Cómo funciona, advertencias, etc.

  const server = require('http').createServer((req, res) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);

      // We're in dangerous territory!
      // Por definición, algo inesperado ha ocurrido,
      // que probablemente no queríamos.
      // ¡Cualquier cosa puede suceder ahora! ¡Tenga mucho cuidado!

      try {
        // Make sure we close down within 30 seconds
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        // But don't keep the process open just for that!
        killtimer.unref();

        // Stop taking new requests.
        server.close();

        // Le hace saber al proceso principal que estamos muertos. Esto desencadenará un
        // 'disconnect' en el clúster principal y, luego, se bifurcará
        // un nuevo worker.
        cluster.worker.disconnect();

        // Try to send an error to the request that triggered the problem
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain');
        res.end('Oops, there was a problem!\n');
      } catch (er2) {
        // Oh well, not much we can do at this point.
        console.error(`Error sending 500! ${er2.stack}`);
      }
    });

    // Porque req y res fueron creadas antes de que este dominio existiera,
    // necesitamos añadirlas explícitamente.
    // Vea la explicación de la vinculación implícita vs explícita debajo.
    d.add(req);     d.add(res);
     // Ahora ejecute la función del manejador en el dominio.
    d.run(() => {
       handleRequest(req, res);
     });
   });
   server.listen(PORT);
 } 

// Esta parte no es importante. Solo un ejemplo de enrutamiento.
// Coloca aquí una elaborada lógica de aplicación.
function handleRequest(req, res) {
  switch (req.url) {
    case '/error':
      // Hacemos algunas cosas asíncronas, y luego...
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

## Additions to `Error` objects

<!-- type=misc -->

Cada vez que un objeto de `Error` se enruta a través de un dominio, se le agregan algunos campos adicionales.

* `error.domain` El dominio que manejó primero el error.
* `error.domainEmitter` El emisor de eventos que originó un evento de `'error'` con el objeto de error.
* `error.domainBound` La función de callback que fue enlazada al dominio y pasó un error como su primer argumento.
* `error.domainThrown` Un booleano que indica si el error fue arrojado, emitido o pasado a una función de callback enlazada.

## Vinculación Implícita

<!--type=misc-->

If domains are in use, then all **new** `EventEmitter` objects (including Stream objects, requests, responses, etc.) will be implicitly bound to the active domain at the time of their creation.

Additionally, callbacks passed to lowlevel event loop requests (such as to `fs.open()`, or other callback-taking methods) will automatically be bound to the active domain. Si son arrojadas, entonces el dominio detectará el error.

In order to prevent excessive memory usage, `Domain` objects themselves are not implicitly added as children of the active domain. Y si lo hicieran, sería muy sencillo evitar que los objetos de solicitud y respuesta se recolecten correctamente como basura.

To nest `Domain` objects as children of a parent `Domain` they must be explicitly added.

Implicit binding routes thrown errors and `'error'` events to the `Domain`'s `'error'` event, but does not register the `EventEmitter` on the `Domain`. Los enlaces implícitos solo se encargan de los errores arrojados y los eventos de `'error'`.

## Vinculación Explícita

<!--type=misc-->

A veces, el dominio en uso no es el que debería utilizarse para un emisor de eventos específico. O bien, el emisor de eventos podría haberse creado en el contexto de un dominio, pero debería estar vinculado a algún otro dominio.

Por ejemplo, podría haber un dominio en uso para un servidor HTTP, pero quizá nos gustaría tener un dominio separado para cada solicitud.

Eso es posible a través del enlazado explícito.

```js
// Create a top-level domain for the server
const domain = require('domain');
const http = require('http');
const serverDomain = domain.create();

serverDomain.run(() => {
  // Server is created in the scope of serverDomain
  http.createServer((req, res) => {
    // Req and res are also created in the scope of serverDomain
    // however, we'd prefer to have a separate domain for each request.
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

## `domain.create()`

* Devuelve: {Domain}

## Class: `Domain`

* Extiende a: {EventEmitter}

The `Domain` class encapsulates the functionality of routing errors and uncaught exceptions to the active `Domain` object.

To handle the errors that it catches, listen to its `'error'` event.

### `domain.members`

* {Array}

Un array de temporizadores y emisores de evento que han sido añadidos explícitamente al dominio.

### `domain.add(emitter)`

* `emitter`{EventEmitter|Timer} emisor o temporizador a ser agregado al dominio

Añade explícitamente un emisor al dominio. Si algún manejador de eventos llamado por el emisor arroja un error, o si el emisor emite un evento `'error'`, se enrutará al evento `'error'` del dominio, al igual que con la unión implícita.

Esto también funciona con los temporizadores que son devueltos desde [`setInterval()`][] y [`setTimeout()`][]. If their callback function throws, it will be caught by the domain `'error'` handler.

If the Timer or `EventEmitter` was already bound to a domain, it is removed from that one, and bound to this one instead.

### `domain.bind(callback)`

* `callback`{Function} La función de callback
* Devuelve: {Function} La función enlazada

La función devuelta será un envoltorio alrededor de la función de callback proporcionada. Cuando esta sea llamada, cualquier error que sea arrojado se enrutará hacia el evento de `'error` del dominio.

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // If this throws, it will also be passed to the domain.
    return cb(er, data ? JSON.parse(data) : null);
  }));
}

d.on('error', (er) => {
  // An error occurred somewhere. If we throw it now, it will crash the program
  // with the normal line number and stack message.
});
```

### `domain.enter()`

The `enter()` method is plumbing used by the `run()`, `bind()`, and `intercept()` methods to set the active domain. It sets `domain.active` and `process.domain` to the domain, and implicitly pushes the domain onto the domain stack managed by the domain module (see [`domain.exit()`][] for details on the domain stack). The call to `enter()` delimits the beginning of a chain of asynchronous calls and I/O operations bound to a domain.

Calling `enter()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### `domain.exit()`

El método de `exit()` sale del dominio actual, llevándolo fuera de la pila de dominios. Cada vez que la ejecución cambie al contexto de una cadena diferente de llamadas asíncronas, es importante asegurarse de que se abandona el dominio actual. The call to `exit()` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit()` will exit any domains nested within this domain.

Calling `exit()` changes only the active domain, and does not alter the domain itself. `enter()` and `exit()` can be called an arbitrary number of times on a single domain.

### `domain.intercept(callback)`

* `callback`{Function} La función de callback
* Devuelve: {Function} La función interceptada

Este método es casi idéntico a [`domain.bind(callback)`][]. Sin embargo, además de identificar los errores arrojados, también interceptará objetos de [`Error`][] enviados como el primer argumento de la función.

De esta manera, el patrón común `if (err) return callback(err);` puede ser reemplazado con un solo manejador de errores en un solo lugar.

```js
const d = domain.create();

function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.intercept((data) => {
    // Note, the first argument is never passed to the
    // callback since it is assumed to be the 'Error' argument
    // and thus intercepted by the domain.

    // If this throws, it will also be passed to the domain
    // so the error-handling logic can be moved to the 'error'
    // event on the domain instead of being repeated throughout
    // the program.
    return cb(null, JSON.parse(data));
  }));
}

d.on('error', (er) => {
  // An error occurred somewhere. If we throw it now, it will crash the program
  // with the normal line number and stack message.
});
```

### `domain.remove(emitter)`

* `emitter`{EventEmitter|Timer} Emisor o temporizador a ser eliminado del dominio

Lo opuesto de [`domain.add(emitter)`][]. Elimina el manejo de dominio del emisor especificado.

### `domain.run(fn[, ...args])`

* `fn` {Function}
* `...args` {any}

Ejecuta la función suministrada en el contexto del dominio, vinculando implícitamente a todos los emisores de evento, temporizadores y solicitudes de bajo nivel creadas en ese contexto. Opcionalmente, los argumentos pueden ser pasados a la función.

Esta es la forma más básica de utilizar un dominio.

```js
const domain = require('domain');
const fs = require('fs');
const d = domain.create();
d.on('error', (er) => {
  console.error('Caught error!', er);
});
d.run(() => {
  process.nextTick(() => {
    setTimeout(() => { // Simulating some various async stuff
      fs.open('non-existent file', 'r', (er, fd) => {
        if (er) throw er;
        // proceed...
      });
    }, 100);
  });
});
```

En este ejemplo, el manejador `d.on('error')` será activado en vez de colapsar al programa.

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

Domains will not interfere with the error handling mechanisms for Promises. In other words, no `'error'` event will be emitted for unhandled `Promise` rejections.
