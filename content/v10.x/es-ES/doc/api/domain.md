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

> Estabilidad: 0 - Desactualización

**Este módulo esta por convertirse en obsoleto**. Será completamente inútil una vez que el reemplazo de API haya finalizado. La mayoría de los usuarios finales ** no** tienen porqué usarlo. Lo que si deben saber es la funcionalidad que los dominios ofrecen pueden recaer en ella para el momento de uso, pero deben esperar a tener o migrar a una solución diferente en el futuro.

Los dominios ofrecen una forma de manejar múltiples y diversas operaciones IO como una unidad. Si cualquiera de los eventos emisores o callbacks registrados en un dominio produce un evento de `'error'`, o arroja uno.

## Advertencia: ¡No ignore los errores!

<!-- type=misc -->

Los controladores del dominio de error no son un substituto para el cierre de un proceso cuando se produce un error.

Por la naturaleza misma de cómo [`arroja`] [] funciona en JavaScript, casi nunca hay alguna forma segura de "regresar a donde se quedó", sin perdidas de referencias o crear algún otro tipo de estado frágil e indefinido.

Sin embargo, cerrar el proceso es la forma más segura de responde a un error arrojado. Pueden haber muchas conexiones abiertas en un servidor de web normal y, no es recomendable cerrarlos abruptamente solo porque un error fue provocado pro alguien más.

La mejor solución es enviar una respuesta de error a la solicitud que produjo el error, dejando que las otras terminen a su tiempo habitual y deteniendo las emisiones de nuevas solicitudes en ese trabajador.

Así, el uso del `dominio` se hace en conjunto al modulo cluster debido a que el proceso principal puede bifurcar un nuevo trabajador cuando un trabajador encuentra un error. Para los programas de Node.js que escalan en múltiples máquinas, el proxy final o servicio de registro pude registrar la falla y reaccionar de acuerdo a su naturaleza.

Por ejemplo, no es una buena idea:

```js
// XXX ¡ADVERTENCIA! ¡MALA IDEA!

const d = require('domain').create();
d.on('error', (er) => {
  // ¡El error no colisionará el proceso, hará algo peor!
  // Aunque hemos prevenido el proceso de reinicio abrupto, aún estamos filtrando // recursos como locos por si esto llegase a suceder.
  // ¡Esto no es mejor que process.on('uncaughtException')!
  console.log(`error, pero oh bueno ${er.message}`);
});
d.run(() => {
  requiere('http').createServer((req, res) => {
    handleRequest(req, res);
  }).listen(PORT);
});
```

Al usar el contexto de un dominio y la elasticidad al separar nuestros programas en procesos de múltiples de trabajo, podemos reaccionar adecuadamente y manejar los errores con mayor seguridad.

```js
// ¡Mucho mejor!

const cluster = require('cluster');
const PORT = +process.env.PORT || 1337;

Si (cluster.isMaster) {    
// Un escenario más realista tendría más de dos trabajadores y,
// quizás, no colocaría al principal y al trabajador en la misma carpeta.
  //
  // también es posible adornar un poco el registro e 
 // implementar cualquier lógica personalizada necesaria para evitar que DoS
  // ataque y otro mal comportamiento.
  //
 // Ver las opciones en el cluster de documentación.
  //
 // Lo importante es que el proceso principal hace poco, 
 // aumentando nuestra resistencia ante errores inesperados.

  cluster.fork();
  cluster.fork();

  cluster.on('disconnect', (worker) => {
    console.error('disconnect!');
    cluster.fork();
  });

} otro {
  // el worker  //
  // ¡Aquí es donde se colocan nuestros errores!

  const domain = require('domain');

 // Ver el cluster de documentación para más detalles sobre el uso de
// procesos de trabajo para atender solicitudes. Cómo funciona, advertencias, entre otras.

  const server = require('http').createServer((req, res) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);

      // Nota: ¡ Estamos en un territorio peligroso!
      Por definición, algo inesperado ocurrió,
      / / que probablemente no queríamos.
      // ¡Cualquier cosa puede suceder ahora! ¡Ten mucho cuidado!

      intenta {
        // asegurarte de cerrar en 30 segundos
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        // ¡Pero, no mantengas el proceso abierto solo por eso!
        killtimer.unref();

        // no tomes nuevas solicitudes.
        server.close();

        // Deja que el proceso principal sepa que estamos muertos. Esto desencadenará un 
        // 'desconectar' en el cluster principal y, luego, se bifurcará
        // un nuevo trabajador.
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

    // Porque req y res  fueron creados antes de que existieran los dominios y
    //  necesitamos agregarlos explicitamente.
    // Mira más abajo la explicación de la vinculación implícita y explicita.
    d.add(req);
    d.add(res);

    // Ahora, ejecuta el controlador de función en el dominio.
    d.run(() => {
      handleRequest(req, res);
    });
  });
  server.listen(PORT);
}

// Esta parte no es importante. Sólo un ejemplo de enrutamiento.
// Coloca una aplicación lógica elaborada aquí.
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

En cualquier momento que un objeto de `Error` es enrutado a través de un dominio, algunos campos adicionales se agregan.

* `error.domain` El dominio que se encargó primero del error.
* `error.domainEmitter` El evento emisor que originó un evento de `'error'` con el objeto de error.
* `error.domainBound` La función de callback que fue agregada al dominio y pasó un error como su primer argumento.
* `error.domainThrown` Un valor booleano que indica si el error fue arrojado, emitido o pasado por un límite de la función de callback.

## Enlace implícito

<!--type=misc-->

Si los dominios están en uso, entonces todos los **nuevos** objetos `Eventosemisores`, tales como los objetos de flujo, solicitudes, respuestas, entre otros, estarán implícitamente añadidos al dominio activo en el momento de su creación.

Asimismo, los callbacks pasados al subnivel de evento de las solicitudes del bucle (como `fs.open()`, u otros métodos de atender callbacks) serán automáticamente añadidas al dominio activo. Entonces, el dominio los percibirá como el error si son arrojados.

De manera que para prevenir el uso excesivo de la memoria, los objetos del `Dominio` no se añaden implícitamente por sí mismos como secundarios del dominio activo. Y si lo hicieran, seria muy sencillo prevenir solicitudes y dar respuesta a los objetos a partir de la basura recolectada.

Para alojar a los objetos del `Dominio` como secundarios de un proceso de `Dominio` principal, deben estar explícitamente añadidos.

Las rutas de enlace implícitas arrojan errores y eventos de `'error'` en los eventos de `'error'` del `Dominio`, pero no registra los del `EmisordeEvento` en el `Dominio`. Los enlaces implícitos solo se encargan de los errores arrojados y los eventos de `'error'`.

## Enlazado explícito

<!--type=misc-->

A veces, el dominio en uso no es el que debería utilizarse para un emisor de evento específico. O, el emisor de evento podría haber sido creado en el contexto de un dominio, pero debe regirse en cambio en algún otro.

Por ejemplo, podría ser un dominio en el uso de un servidor HTTP, pero, quizás, nos gustaría tener un dominio separado para cada solicitud.

Es posible a través del enlace explícito.

```js
// crea un dominio superior para el servidor
const domain = require('domain');
const http = require('http');
const serverDomain = domain.create();

serverDomain.run(() => {
  // el servidor se crea en el ámbito del ServerDomain
  http.createServer((req, res) => {
    // req y res también son creadas en el ámbito del ServerDomain
    // sin embargo, preferiríamos tener un dominio individual para cada solicitud.
    // crea su primer objeto y, añade req y res a él.
    const reqd = domain.create();
    reqd.add(req);
    reqd.add(res);
    reqd.on('error', (er) => {
      console.error('Error', er, req.url);
      prueba {
        res.writeHead(500);
        res.end('Error occurred, sorry.');
      } catch (er2) {
        console.error('Error sending 500', er2, req.url);
      }
    });
  }).listen(1337);
});
```

## domain.Create()

* Volver a: {Domain}

## Clase: dominio

El tipo de `Dominio` encapsula la funcionalidad de enrutar los errores y las excepciones desapercibidas para la activación del objeto del `Dominio`.

El `Dominios` es una clase menor de [`EvetoEmisor`][]. Para gestionar los errores que identifica, atiende a su evento de `'error?`.

### domain.members

* {Array}

Unos temporizadores y emisores de evento que han sido añadidos explícitamente al dominio.

### domain.add(emisor)

* `emisor`{EventEmitter|Timer} emisor o temporizador a ser agregado al dominio

Agrega explícitamente un emisor al dominio. Si cualquier gestor de evento activado por el emisor arroja un error o el transmisor emite un evento de `'error'`, será enrutado para el evento de `'error'` perteneciente al dominio de la misma forma que con el enlazado implícito.

Esto también funciona con los temporizadores que se regresan desde [`setInterval()`][] y el [`setTimeout()`][]. Si su función de callback lo arroja, sera gestionado por el gestor de `'error'` del dominio.

Si el Temporizador o `EmisordeEvento` estuviese limitado a un dominio, será removido del mismo y enlazado a este.

### domain.bind(callback)

* `callback`{Function} La función de callback
* Regresa: {Function} La función limitante

La función de regreso será cubrirá a la función de callback suministrada. Cuando esta sea llamada, cualquier error que sea arrojado se enrutará hacia el evento de `'error` del dominio.

#### Ejemplo

```js
const d = domain.create();


  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // si este error aparece, también pasará por el dominio
    return cb(er, data ?
 JSON.parse(data) : null);
  }));
}

d.on('error', (er) => {
  // ha ocurrido un error en algún lugar.
  // el programa fallará si lo arrojamos ahora
  // con la línea de número normal y el mensaje apilado.
});
```

### domain.enter()

El método `enter()` es sondeada por el `ejecutar`, `enlace` y los métodos de `intercept()` para establecer el dominio activo. Se coloca el `domain.active` y el `process.domain` en el dominio, y empuja al dominio implícitamente hacia el dominio de apilación manejado por el módulo de dominio (ver `domain.exit()`[] para más detalles sobre el dominio de apilado). La llamada a `enter()` delimita el principio de una cadena de llamadas asincrónicas y operaciones I/o relacionadas a un dominio.

Llamar a `enter()` solo cambia al dominio activo y no lo altera en si. `enter()` y `exit()` pueden ser llamados un número arbitrario de veces en un mismo dominio.

### domain.exit()

El método de `exit()` sale del dominio actual, llevándolo hacia el dominio de apilado. Es importante asegurarse que se abandona el dominio actual al cambiar cualquier tiempo de ejecución hacia el contexto de una cadena diferente de llamadas asincrónicas. The call to `exit()` delimits either the end of or an interruption to the chain of asynchronous calls and I/O operations bound to a domain.

If there are multiple, nested domains bound to the current execution context, `exit()` will exit any domains nested within this domain.

Calling `exit()` changes only the active domain, and does not alter the domain itself. `enter()` y `exit()` pueden ser llamados un número arbitrario de veces en un mismo dominio.

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