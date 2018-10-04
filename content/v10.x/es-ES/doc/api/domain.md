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

**Este módulo esta por convertirse en obsoleto**. Este módulo será completamente inútil una vez que el reemplazo de API haya finalizado. La mayoría de los usuarios finales ** no** tienen porqué usarlo. Los usuarios que sí requieran de la funcionalidad que los dominios ofrecen pueden hacer uso del módulo en este momento, pero deben esperar verse obligados a cambiar a una solución distinta en el futuro.

Los dominios ofrecen una forma de manejar múltiples y diversas operaciones IO como una unidad. Si cualquiera de los eventos emisores o callbacks registrados en un dominio produce un evento de `'error'`, o arroja uno, entonces el objeto del dominio será notificado, en vez de perder el contexto del error en el manejador `process.on('uncaughtException')` u ocasionar que el programa se cierre inmediatamente con un código de error.

## Advertencia: ¡No ignore los errores!

<!-- type=misc -->

Los manejadores de errores de dominio no son un substituto para el cierre de un proceso cuando se produce un error.

Por la naturaleza misma de cómo [`throw`] [] funciona en JavaScript, casi nunca hay alguna forma segura de "regresar a donde se quedó", sin perdidas de referencias o crear algún otro tipo de estado frágil e indefinido.

Cerrar el proceso es la forma más segura de responder a un error arrojado. Pueden haber muchas conexiones abiertas en un servidor de web normal y, no es recomendable cerrarlos abruptamente solo porque un error fue provocado por alguien más.

La mejor solución es enviar una respuesta de error a la solicitud que produjo el error, dejando que las otras terminen a su tiempo habitual y deteniendo la escucha de nuevas solicitudes en ese worker.

De esta forma, el uso del `domain` se hace en conjunto al módulo clúster, ya que el proceso principal puede bifurcar un nuevo worker cuando un worker encuentra un error. Para los programas de Node.js que escalan en múltiples máquinas, el proxy final o servicio de registro pueden registrar la falla y reaccionar de acuerdo a su naturaleza.

Por ejemplo, no es una buena idea:

```js
// XXX ¡ADVERTENCIA! ¡MALA IDEA!

const d = require('domain').create();
d.on('error', (er) => {
  // ¡El error no colisionará el proceso, hará algo peor!
  // Aunque hemos prevenido el proceso de reinicio abrupto, aún estamos filtrando
  // recursos como locos por si esto llegase a suceder.
  // ¡Esto no es mejor que process.on('uncaughtException')!
  console.log(`error, but oh well ${er.message}`);
});
d.run(() => {
  require('http').createServer((req, res) => {
    handleRequest(req, res);
  }).listen(PORT);
});
```

Al usar el contexto de un dominio y la elasticidad al separar nuestros programas en procesos de múltiples de trabajo, podemos reaccionar adecuadamente y manejar los errores con mayor seguridad.

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
  // Ver las opciones en el clúster de documentación.
  //
  // Lo importante es que el proceso principal hace poco, 
  // aumentando nuestra resiliencia ante errores inesperados.

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

 // Ver el clúster de documentación para más detalles sobre el uso de
// procesos de worker para atender solicitudes. Cómo funciona, advertencias, entre otras.

  const server = require('http').createServer((req, res) => {
    const d = domain.create();
    d.on('error', (er) => {
      console.error(`error ${er.stack}`);

      // Nota: ¡Estamos en un territorio peligroso!
      Por definición, algo inesperado ocurrió,
      / / que probablemente no queríamos.
      // ¡Cualquier cosa puede suceder ahora! ¡Ten mucho cuidado!

      intenta {
        // asegurémonos de cerrar en un lapso de 30 segundos
        const killtimer = setTimeout(() => {
          process.exit(1);
        }, 30000);
        // ¡Pero, no mantengas el proceso abierto solo por eso!
        killtimer.unref();

        // no tomes nuevas solicitudes.
        server.close();

        // Deja que el proceso principal sepa que estamos muertos. Esto desencadenará un 
        // 'desconectar' en el clúster principal y, luego, se bifurcará
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

    // Porque req y res fueron creados antes de que existieran los dominios y
    //  necesitamos agregarlos explícitamente.
    // Mira más abajo la explicación de la vinculación implícita y explicita.
    d.add(req);
    d.add(res);

    // Ahora, ejecuta la función de manejador en el dominio.
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

En cualquier momento que un objeto de `Error` es enrutado a través de un dominio, algunos campos adicionales se agregan.

* `error.domain` El dominio que se encargó primero del error.
* `error.domainEmitter` El emisor de eventos que originó un evento de `'error'` con el objeto de error.
* `error.domainBound` La función de callback que fue enlazada al dominio y pasó un error como su primer argumento.
* `error.domainThrown` Un valor booleano que indica si el error fue arrojado, emitido o pasado a una función callback enlazada.

## Enlace implícito

<!--type=misc-->

Si los dominios están en uso, entonces todos los **nuevos** objetos `Eventosemisores`, tales como los objetos de flujo, solicitudes, respuestas, entre otros, estarán implícitamente añadidos al dominio activo en el momento de su creación.

Asimismo, los callbacks pasados a solicitudes de bucles de evento de bajo nivel (como `fs.open()`, u otros métodos de atender callbacks) serán automáticamente enlazados al dominio activo. Entonces, el dominio los percibirá como el error si son arrojados.

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

Esto también funciona con los temporizadores que se regresan desde [`setInterval()`][] y el [`setTimeout()`][]. Si su función de callback lo arroja, será gestionado por el manejador de `'error'` del dominio.

Si el Temporizador o `EmisordeEvento` estuviese limitado a un dominio, será removido del mismo y enlazado a este.

### domain.bind(callback)

* `callback`{Function} La función de callback
* Devoluciones: {Function} La función enlazada

La función devuelta fungirá como envoltura alrededor del callback suministrado. Cuando esta sea llamada, cualquier error que sea arrojado se enrutará hacia el evento de `'error` del dominio.

#### Ejemplo

```js
const d = domain.create();


function readSomeFile(filename, cb) {
  fs.readFile(filename, 'utf8', d.bind((er, data) => {
    // si este error aparece, también será pasado al dominio
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

El método `enter()` es una vía usada por los métodos `run()`, `bind()` e `intercept()` para establecer el dominio activo. Se coloca el `domain.active` y el `process.domain` en el dominio, y empuja al dominio implícitamente hacia la pila de dominios manejada por el módulo de dominio (ver `domain.exit()`[] para más detalles sobre la pila de dominios). La llamada a `enter()` delimita el principio de una cadena de llamadas asincrónicas y operaciones I/O relacionadas a un dominio.

Llamar a `enter()` solo cambia al dominio activo y no lo altera en sí. `enter()` y `exit()` pueden ser llamados un número arbitrario de veces en un mismo dominio.

### domain.exit()

El método de `exit()` sale del dominio actual, llevándolo fuera de la pila de dominios. Es importante asegurarse que se abandona el dominio actual al cambiar cualquier tiempo de ejecución hacia el contexto de una cadena diferente de llamadas asincrónicas. La llamada `exit()` delimita el final o una interrupción de la cadena de llamadas asincrónicas y operaciones I/O vinculadas a un dominio.

Si hay múltiples dominios anidados enlazados al contexto de ejecución actual, `exit()` saldrá de cualquier dominio alojado dentro de este dominio.

La llamada `exit()` modifica solo al dominio activo y no lo altera en sí. `enter()` y `exit()` pueden ser llamados un número arbitrario de veces en un mismo dominio.

### domain.intercept(callback)

* `callback`{Function} La función de callback
* Devuelve: {Function} La función interceptada

Este método es muy similar a [`domain.bind(callback)`][]. Sin embargo, además de identificar los errores arrojados, también interceptará objetos de [`Error`][] enviados como el primer argumento de la función.

Así, el patrón común `if (err) return callback(err);` puede ser reemplazado con un solo manejador de error único en un mismo lugar.

#### Ejemplo

```js
const d = domain.create();

función readSomeFile(filename, cb) { 
  fs.readFile(filename, 'utf8', d.intercept((data) => {
    // note que el primer argumento nunca se envía por el
    // callback desde que asume ser el argumento 'Error'
    // y, por lo tanto, es interceptado por el dominio.

    // si esto arroja, también se transmitirá hacia el dominio,
    // para que la lógica de manejo de errores puede moverse hacia el
    // evento 'error' en el dominio, en vez de ser repetido en todo 
    // el programa.
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

Lo opuesto de [`domain.add(emitter)`][]. Revoca el manejo de dominio al emisor especificado.

### domain.run(fn[, ...args])

* `fn` {Function}
* `...args` {any}

Ejecuta la función suministrada en el contexto del dominio, vinculando implícitamente a todos los emisores de evento, temporizadores y solicitudes de bajo nivel creadas en ese contexto. Los argumentos pueden pasarse hacia la función opcionalmente.

Esta es la forma más básica de utilizar un dominio.

Ejemplo:

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

En este ejemplo, el manejador `d.on('error')` será activado en vez de colapsar al programa.

## Dominios y Promesas

A partir de Node.js 8.0.0, los manejadores de Promesas son ejecutados dentro del dominio en el cual la llamada misma a `.then()` o `.catch()` fue hecha:

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

Vea que los dominios no interferirán con los mecanismos de control de error para los Valores Futuros o Promesas, es decir ningún evento de `'error` se emitirá para rechazos de `Promise` no manejados.