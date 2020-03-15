# Async Haken

<!--introduced_in=v8.1.0-->

> Stabiliteit: 1 - Experimenteel

De `async_hooks` module verschaft een API om callbacks te registreren die de levensduur van asynchrone hulpmiddelen bijhoudt die zijn gecreëerd binnen een Node.js toepassing. Het kan worden bereikt met behulp van:

```js
const async_hooks = require('async_hooks');
```

## Terminologie

Een asynchrone hulpbron vertegenwoordigt een object met een bijbehorende callback. This callback may be called multiple times, for example, the `connection` event in `net.createServer`, or just a single time like in `fs.open`. A resource can also be closed before the callback is called. AsyncHook does not explicitly distinguish between these different cases but will represent them as the abstract concept that is a resource.

## Openbare API

### Overzicht

Hier volgt een simpel overzicht van de openbare API.

```js
const async_hooks = require('async_hooks');

// Retourneer de ID van de huidige executie context.
const eid = async_hooks.executionAsyncId();

// Retourneer de ID van de greep die verantwoordelijk is voor het genereren van de callback van de
// huidige op te roepen executie execution-omvang.
const tid = async_hooks.triggerAsyncId();

// Creëer een nieuwe AsyncHook instantie. Al deze callback's zijn optioneel.
const asyncHook =
    async_hooks.createHook({ init, before, after, destroy, promiseResolve });

// Sta callbacks van deze AsyncHook instantie toe om op te roepen. Dit is geen impliciete
// actie na het uitvoeren van de constructor, en moeten expliciet worden gedraaid om te beginnen met het
// uitvoeren van callbacks.
asyncHook.enable();

// Luisteren naar nieuwe asynchrone gebeurtenissen uitschakelen.
asyncHook.disable();

//
// Het volgende zijn de callbacks die kunnen worden doorgegeven aan createHook().
//

// init wordt opgeroepen gedurende object constructie. Het kan zijn dat de hulpbron niet 
// de constructie heeft afgerond, daarom zijn wellicht niet alle velden van de
// hulpbron, gerefereerd door "asyncId", gevuld.
functie init(asyncId, type, triggerAsyncId, hulpbron) { }

// voorheen is opgeroepen net voordat de callback van de hulpbron wordt opgeroepen. Het kan zijn 
// 0-N keer opgeroepen voor grepen (bijv. TCPWrap), en wordt opgeroepen, precies 1 
// keer voor verzoeken (bijv. FSReqWrap).
function before(asyncId) { }

// nadien is opgeroepen net nadat de callback van de hulpbron is beëindigd.
function after(asyncId) { }

// destroy wordt opgeroepen wanneer een AsyncWrap wordt afgesloten.
function destroy(asyncId) { }

// promiseResolve wordt alleen opgeroepen voor belofte hulpbronnen, wanneer de 
// `resolve` functie doorgegeven aan de `Promise` constructor is aangeroepen
// (hetzij direct of door middel van een andere manier om een belofte op te lossen).
function promiseResolve(asyncId) { }
```

#### `async_hooks.createHook(callbacks)`

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} The [Hook Callbacks](#async_hooks_hook_callbacks) to register
  * `init` {Function} De [`init` callback][].
  * `before` {Function} De [`before` callback][].
  * `after` {Function} De [`after` callback][].
  * `destroy` {Function} De [`destroy` callback][].
* Geeft als resultaat: {AsyncHook} Instantie gebruikt voor het aan- en uitschakelen van haken

Registreert functies op te roepen voor de levensduur van de verschillende gebeurtenissen van elke async bewerking.

De callbacks `init()` / `before()` / `after()` / `destroy()` worden opgeroepen voor de respectieve asynchrone gebeurtenis tijdens de levensduur van een hulpbron.

Alle callback's zijn optioneel. Bijvoorbeeld, als alleen de hulpbron opruiming moet worden bijgehouden, dan hoeft alleen de `destroy` callback worden doorgegeven. De bijzonderheden van alle functies die kunnen worden doorgegeven aan de `callbacks` zijn in de [Hook Callbacks](#async_hooks_hook_callbacks) sectie.

```js
const async_hooks = require('async_hooks');

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId, resource) { },
  destroy(asyncId) { }
});
```

Let op: de callbacks worden overgenomen via de prototypeketen:

```js
class MyAsyncCallbacks {
  init(asyncId, type, triggerAsyncId, resource) { }
  destroy(asyncId) {}
}

class MyAddedCallbacks extends MyAsyncCallbacks {
  before(asyncId) { }
  after(asyncId) { }
}

const asyncHook = async_hooks.createHook(new MyAddedCallbacks());
```

##### Foutafhandeling

Wanneer `AsyncHook` callbacks gooien, zal de toepassing de stack trace afdrukken en afsluiten. The exit path does follow that of an uncaught exception, but all `uncaughtException` listeners are removed, thus forcing the process to exit. De `'exit'` callbacks zullen nog steeds genoemd worden, tenzij de toepassing wordt uitgevoerd met `--abort-on-uncaught-exception`, in welk geval een stack trace zal worden geprint en de toepassing afsluit en het kernbestand verlaat.

De reden voor dit gedrag voor foutafhandeling is dat deze callbacks op potentieel vluchtige punten in de levensduur van een object worden gedraaid, bijvoorbeeld tijdens klasseconstructie en -vernietiging. Om deze reden wordt het noodzakelijk geacht om het proces snel neer te halen om een onbedoelde afbreking in de toekomst te voorkomen. Dit is onder voorbehoud van wijzigingen in de toekomst wanneer een uitgebreide analyse wordt uitgevoerd om ervoor te zorgen dat een uitzondering de normale controlestroom kan volgen zonder onbedoelde bijwerkingen.


##### Printen in AsyncHooks callbacks

Omdat het printen naar de console een asynchrone bewerking is, zal `console.log()` er voor zorgen dat de AsyncHooks-callbacks worden opgeroepen. Het gebruik van `console.log()` of soortgelijke asynchrone operaties binnen een AsyncHooks callback-functie zal dus tot een oneindige recursie leiden. Een gemakkelijke oplossing hiervoor is een synchrone logboekoperatie te gebruiken bij foutopsporing, zoals `fs.writeSync(1, msg)`. Dit zal naar stdout printen omdat `1` de bestandsbeschrijver is voor stdout en zal AsyncHooks niet recursief oproepen omdat het synchroon is.

```js
const fs = require('fs');
const util = require('util');

functie foutoplossing(...args) {
  // gebruik een functie zoals deze bij het fout opsporen binnen een AsyncHooks callback
  fs.writeSync(1, `${util.format(...args)}\n`);
}
```

Wanneer een asynchrone bewerking nodig is voor het aanmelden, is het mogelijk om bij te houden wat de oorzaak is van de asynchrone bewerking met behulp van de informatie die AsyncHooks heeft aangeleverd. De registratie moet in dit geval worden overgeslagen omdat het de registratie zelf was die heeft veroorzaakt dat de AsyncHooks callback dit meldde. Door dit te doen, wordt de anderzijds oneindige recursie gebroken.

#### `asyncHook.enable()`

* Retourneert: {AsyncHook} Een referentie naar `asyncHook`.

Schakel de callbacks voor een gegeven `AsyncHook` instantie in. Wanneer geen callbacks toegeleverd zijn is het inschakelen een no-op.

De `AsyncHook` instantie is als standaard uitgeschakeld. Wanneer de `AsyncHook` instantie moet worden ingeschakeld onmiddellijk na creatie, kan het volgende patroon worden gebruikt.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### `asyncHook.disable()`

* Retourneert: {AsyncHook} Een referentie naar `asyncHook`.

Disable the callbacks for a given `AsyncHook` instance from the global pool of AsyncHook callbacks to be executed. Zodra een haak is uitgeschakeld, zal het niet opnieuw opgeroepen worden totdat het weer is ingeschakeld.

Voor API consistentie zal `disable()` ook de `AsyncHook` instantie retourneren.

#### Hook Callbacks

Belangrijke gebeurtenissen gedurende de levensduur van asynchrone gebeurtenissen zijn gecategoriseerd in vier gebieden: instantiëren, voor/nadat de callback wordt genoemd, en wanneer de instantie wordt vernietigd.

##### `init(asyncId, type, triggerAsyncId, resource)`

* `asyncId` {number} Een unieke ID voor de async hulpbron.
* `type` {string} Het type van de async hulpbron.
* `triggerAsyncId` {number} Het unieke ID van de async hulpbron in wiens uitvoeringscontext deze async hulpbron is gemaakt.
* `resource` {Object} Reference to the resource representing the async operation, needs to be released during _destroy_.

Wordt opgeroepen wanneer een klasse wordt samengesteld die de _mogelijkheid_ heeft om een asynchrone gebeurtenis uit te zenden. Dit betekent _niet_ dat de instantie moet oproepen `before`/`after` before `destroy` is opgeroepen, maar alleen dat de mogelijkheid bestaat.

Dit gedrag kan worden waargenomen door iets te doen zoals het openen van een hulpbron en het dan te sluiten voordat de hulpbron kan worden gebruikt. Het volgende fragment toont dit.

```js
require('net').createServer().listen(function() { this.close(); });
// OF
clearTimeout(setTimeout(() => {}, 10));
```

Aan iedere nieuwe hulpbron wordt een ID toegewezen dat uniek is binnen de werkingssfeer van het huidige proces.

###### `type`

Het `type` is een tekenreeks die aangeeft welk type hulpbron het oproepen van `init` heeft veroorzaakt. Over het algemeen, dit zal overeen komen met de naam van de hulpbron constructor.

```text
FSEVENTWRAP, FSREQWRAP, GETADDRINFOREQWRAP, GETNAMEINFOREQWRAP, HTTPPARSER,
JSSTREAM, PIPECONNECTWRAP, PIPEWRAP, PROCESSWRAP, QUERYWRAP, SHUTDOWNWRAP,
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVERWRAP, TCPWRAP, TIMERWRAP,
TTYWRAP, UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

Er is ook het `PROMISE` hulpbron type, die wordt gebruikt om `Promise` instanties bij te houden en asyncrhoon werk door hen.

Gebruikers kunnen hun eigen `type` definiëren bij het gebruik van de openbare embedder API.

*Note:* It is possible to have type name collisions. Embedders are encouraged to use unique prefixes, such as the npm package name, to prevent collisions when listening to the hooks.

###### `triggerId`

`triggerAsyncId` is de `asyncId` van de hulpbron die het initialiseren van de nieuwe hulpbron heeft veroorzaakt (of "getriggered") en waardoor `init` getriggered werd om op te roepen. This is different from `async_hooks.executionAsyncId()` that only shows *when* a resource was created, while `triggerAsyncId` shows *why* a resource was created.


Het volgende is een simpele demonstratie van `triggerAsyncId`:

```js
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    fs.writeSync(
      1, `${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${eid}\n`);
  }
}).enable();

require('net').createServer((conn) => {}).listen(8080);
```

Uitvoer bij het bewerken van de server met `nc localhost 8080`:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TCPWRAP(4): trigger: 2 execution: 0
```

De `TCPSERVERWRAP` is de server die de verbindingen ontvangt.

De `TCPWRAP` is de nieuwe verbinding van de client. When a new connection is made the `TCPWrap` instance is immediately constructed. This happens outside of any JavaScript stack (side note: a `executionAsyncId()` of `0` means it's being executed from C++, with no JavaScript stack above it). With only that information, it would be impossible to link resources together in terms of what caused them to be created, so `triggerAsyncId` is given the task of propagating what resource is responsible for the new resource's existence.

###### `hulpbron`

`resource` is een object dat de werkelijke async hulpbron die is geïnitialiseerd vertegenwoordigt. Dit kan nuttige informatie bevatten welke kan variëren afhankelijk van de waarde van `type`. Bijvoorbeeld, voor het `GETADDRINFOREQWRAP` hulpbron type, `resource` verschaft de hostnaam die is gebruikt wanneer het IP adres wordt opgezocht voor de hostnaam in `net.Server.listen()`. De API voor toegang tot deze informatie wordt momenteel niet als publiek beschouwd, maar door gebruik van de Embedder API, kunnen gebruikers hun eigen hulpbron objecten verschaffen en documenteren. Bijvoorbeeld, kan een dergelijk hulpbron object de SQL-query bevatten die wordt uitgevoerd.

In the case of Promises, the `resource` object will have `promise` property that refers to the Promise that is being initialized, and a `isChainedPromise` property, set to `true` if the promise has a parent promise, and `false` otherwise. For example, in the case of `b = a.then(handler)`, `a` is considered a parent Promise of `b`. Hier wordt `b` beschouwd als een geketende belofte.

*Note*: In some cases the resource object is reused for performance reasons, it is thus not safe to use it as a key in a `WeakMap` or add properties to it.

###### Voorbeeld van de asynchrone context

Het volgende is een voorbeeld met aanvullende informatie over de oproepen aan `init` tussen de `before` en `after` oproepen, specifiek hoe de callback naar `listen()` eruit zal zien. De uitvoer opmaak is iets meer uitgebreid zodat de oproepende context beter te zien is.

```js
let indent = 0;
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    const indentStr = ' '.repeat(indent);
    fs.writeSync(
      1,
      `${indentStr}${type}(${asyncId}):` +
      ` trigger: ${triggerAsyncId} execution: ${eid}\n`);
  },
  before(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}before:  ${asyncId}\n`);
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}after:   ${asyncId}\n`);
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(1, `${indentStr}destroy: ${asyncId}\n`);
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Laten we 10 minuten wachten met aanmelden op de server.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Uitvoer alleen van het starten van de server:

```console
TCPSERVERWRAP(2): trigger: 1 execution: 1
TickObject(3): trigger: 2 execution: 1
before:  3
  Timeout(4): trigger: 3 execution: 3
  TIMERWRAP(5): trigger: 3 execution: 3
after:   3
destroy: 3
before:  5
  before:  4
    TTYWRAP(6): trigger: 4 execution: 4
    SIGNALWRAP(7): trigger: 4 execution: 4
    TTYWRAP(8): trigger: 4 execution: 4
>>> 4
    TickObject(9): trigger: 4 execution: 4
  after:   4
after:   5
before:  9
after:   9
destroy: 4
destroy: 9
destroy: 5
```

*Note*: As illustrated in the example, `executionAsyncId()` and `execution` each specify the value of the current execution context; which is delineated by calls to `before` and `after`.

Het gebruik van enkel `execution` om de hulpbronbestemming in kaart te zetten, resulteert in het volgende:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

De `TCPSERVERWRAP` is geen deel van deze grafiek, ook al was het de reden om `console.log()` op te roepen. Dit is omdat het binden aan een uitgang zonder de hostnaam een *synchrone* werking is, maar om een complete asynchrone API te behouden, wordt de callback van de gebruiker geplaatst in een `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.


##### `voor(asyncId)`

* `asyncId` {number}

Wanneer een asynchrone bewerking wordt geïnitieerd (zoals de TCP server die een nieuwe verbinding ontvangt) of compleet maakt (zoals het schrijven van data naar een disk) wordt er een callback opgeroepen om de gebruiker hierover te informeren. De `before` callback wordt opgeroepen net voordat de genoemde callback wordt uitgevoerd. `asyncId` is de unieke identificatie die is toegewezen aan de hulpbron die op het punt staat de callback uit te voeren.

De `before` callback zal 0 tot N keer opgeroepen worden. De `before` callback wordt over het algemeen 0 keer opgeroepen als de asynchrone werking geannuleerd is of, bijvoorbeeld, als er geen verbindingen worden ontvangen door een TCP server. Hardnekkige asynchrone hulpbronnen zoals een TCP server zullen over het algemeen de `before` callback meerdere keren oproepen, terwijl andere werkingen zoals `fs.open()` het maar één keer oproept.


##### `after(asyncId)`

* `asyncId` {number}

Wordt onmiddellijk opgeroepen nadat de callback die is aangeduid in `before` is voltooid.

*Note:* If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.


##### `destroy(asyncId)`

* `asyncId` {number}

Wordt aangeroepen nadat de hulpbron die overeenkomt met `asyncId` wordt vernietigd. Het wordt ook asynchroon aangeroepen vanuit de embedder API `emitDestroy()`.

*Note:* Some resources depend on garbage collection for cleanup, so if a reference is made to the `resource` object passed to `init` it is possible that `destroy` will never be called, causing a memory leak in the application. If the resource does not depend on garbage collection, then this will not be an issue.

##### `promiseResolve(asyncId)`

* `asyncId` {number}

Aangeroepen wanneer de `resolve` functie doorgegeven aan de `Promise` constructor wordt aangeroepen (rechtstreeks of via andere middelen om een belofte op te lossen).

Observeer dat `resolve()` geen waarneembaar synchroon werk doet.

*Note:* This does not necessarily mean that the `Promise` is fulfilled or rejected at this point, if the `Promise` was resolved by assuming the state of another `Promise`.

For example:

```js
new Promise((resolve) => resolve(true)).then((a) => {});
```

roept de volgende callbacks op:

```text
init for PROMISE with id 5, trigger id: 1
  promise resolve 5      # correspondeert om (true) op te lossen
init for PROMISE with id 6, trigger id: 5  # de Belofte geretourneerd door dan()
  voor 6               # de dan() callback wordt ingevoerd
  belofte oplossing 6      # de dan() callback lost de belofte op door
  na 6 te retourneren
```

#### `async_hooks.executionAsyncId()`

<!-- YAML
added: v8.1.0
changes:
  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from currentId
-->

* Retourneert: {number} The `asyncId` van de huidige uitvoeringscontext. Nuttig voor het bijhouden wanneer er iets oproept.

For example:

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

De ID die is geretourneerd vanuit `executionAsyncId()` is gerelateerd aan de timing van de uitvoering, niet causaliteit (die wordt gedekt door `triggerAsyncId()`). For example:

```js
const server = net.createServer(function onConnection(conn) {
  // Retourneert de ID van de server, niet van de nieuwe connectie, want de
  // onConnection callback draait in het uitvoeringskader van de
  // MakeCallback() server.
  async_hooks.executionAsyncId();

}).listen(port, function onListening() {
  // Retourneert de ID van een TickObject (i.e. process.nextTick()) want alle
  // callbacks doorgegeven om te  .listen() zitten ingepakt in een nextTick().
  async_hooks.executionAsyncId();
});
```

Observeer dat belofte contexten standaard geen precieze executionAsyncIds krijgen. Zie de sectie over [promise execution tracking](#async_hooks_promise_execution_tracking).

#### `async_hooks.triggerAsyncId()`

* Retourneert: {number} De ID van de hulpbron verantwoordelijk voor het aanroepen van de callback die op dit moment wordt uitgevoerd.

For example:

```js
const server = net.createServer((conn) => {
  // De hulpbron die heeft veroorzaakt (of getriggered) dat deze callback werd aangeroepen
  // was die van de nieuwe verbinding. Dus de geretourneerde waarde van triggerAsyncId()
  // is de asyncId van "conn".
  async_hooks.triggerAsyncId();

}).listen(port, () => {
  // Hoewel alle callbacks doorgegeven aan .listen() zijn verpakt in een nextTick()
  // bestaat de callback zelf omdat de oproep naar de .listen() server
  // werd gemaakt. Dus zou de geretourneerde waarde de ID van de server zijn.
  async_hooks.triggerAsyncId();
});
```

Observeer dat belofte contexten standaard geen precieze triggerAsyncIds krijgen. Zie de sectie over [promise execution tracking](#async_hooks_promise_execution_tracking).

## Belofte uitvoering tracering

By default, promise executions are not assigned asyncIds due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) provided by V8. Dit betekent dat programma's die gebruik maken van beloften of `async`/`await` geen correcte uitvoering krijgen en standaard id's triggeren voor belofte callback contexten.

Hier is een voorbeeld:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produceert:
// eid 1 tid 0
```

Observe that the `then` callback claims to have executed in the context of the outer scope even though there was an asynchronous hop involved. Also note that the triggerAsyncId value is 0, which means that we are missing context about the resource that caused (triggered) the `then` callback to be executed.

Het installeren van async hooks via `async_hooks.createHook` bemogelijkt belofteuitvoering tracering. Voorbeeld:

```js
const ah = require('async_hooks');
ah.createHook({ init() {} }).enable(); // dwingt PromiseHooks in te schakelen.
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produces:
// eid 7 tid 6
```

In dit voorbeeld, maakte het toevoegen van een actuele hook functie het mogelijk dat het traceren van beloften werd ingeschakeld. There are two promises in the example above; the promise created by `Promise.resolve()` and the promise returned by the call to `then`. In the example above, the first promise got the asyncId 6 and the latter got asyncId 7. During the execution of the `then` callback, we are executing in the context of promise with asyncId 7. This promise was triggered by async resource 6.

Een andere subtiliteit met beloften is dat `before` en `after` callback alleen op geketende beloften worden gedraaid. That means promises not created by `then`/`catch` will not have the `before` and `after` callbacks fired on them. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### `class AsyncResource()`

De class `AsyncResource` is ontworpen om door de embedder async hulpbronnen te worden verlengd. Bij gebruik hiervan, kunnen gebruikers makkelijk de levensduur gebeurtenissen van hun eigen hulpbronnen activeren.

De `init` hook zal geactiveerd worden wanneer een `AsyncResource` wordt geïnstantieerd.

Het volgende is een overzicht van de `AsyncResource` API.

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() is bedoeld om te worden uitgebreid. Het instantiëren van een
// new AsyncResource() leidt ook tot init. Als triggerAsyncId wordt weggelaten dan wordt
// async_hook.executionAsyncId() gebruikt.
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Draai een functie in de executie context van de hulpbron. Dit zal
// * bevestig de context van de hulpbron
// * trigger de AsyncHooks voor callbacks
// * roep de geleverde functie aan `fn` met de aangevoerde argumenten
// * trigger de AsyncHooks na callbacks
// * herstel de originele executie context
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// Roep AsyncHooks vernietig callbacks aan.
asyncResource.emitDestroy();

// Retourneer de unieke ID toegewezen aan de AsyncResource instantie.
asyncResource.asyncId();

// Retourneer de trigger ID voor de AsyncResource instantie.
asyncResource.triggerAsyncId();

// Roep AsyncHooks aan voor callbacks.
// Afgekeurd: Gebruik asyncResource.runInAsyncScope als alternatief.
asyncResource.emitBefore();

// Roep AsyncHooks aan na callbacks.
// Afgekeurd: Gebruik asyncResource.runInAsyncScope als alternatief.
asyncResource.emitAfter();
```

#### `AsyncResource(type[, options])`

* `type` {string} Het type async event.
* `options` {Object}
  * `triggerAsyncId` {number} De ID van de uitvoeringscontext die deze async event heeft gecreëerd. **Standaard:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Schakelt automatisch `emitDestroy` uit wanneer het object afval is opgehaald. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's asyncId is retrieved and the sensitive API's `emitDestroy` is called with it. **Standaard:** `false`.

Gebruiksvoorbeeld:

```js
class DBQuery extends AsyncResource {
  constructor(db) {
    super('DBQuery');
    this.db = db;
  }

  getInfo(query, callback) {
    this.db.get(query, (err, data) => {
      this.runInAsyncScope(callback, null, err, data);
    });
  }

  close() {
    this.db = null;
    this.emitDestroy();
  }
}
```

#### `asyncResource.runInAsyncScope(fn[, thisArg, ...args])`
<!-- YAML
added: v8.12.0
-->

* `fn` {Function} De aan te roepen functie in de executie context van deze async hulpbron.
* `thisArg` {any} De te gebruiken ontvanger voor de functie oproep.
* `...args` {any} Optionele argumenten om door te geven aan de functie.

Roep de geleverde functie op met de verstrekte argumenten in de executie context van de async hulpbron. Dit zal de context vaststellen, de AsyncHooks triggeren voor de callbacks, de functie oproepen, de AsyncHook na callbacks triggeren, en dan de originele executie context herstellen.

#### `asyncResource.emitBefore()`
<!-- YAML
deprecated: v8.12.0
-->
> Stabiliteit: 0 - Afgekeurd: Gebruik [`asyncResource.runInAsyncScope()`][] als alternatief.

* Retourneert: {undefined}

Roep alle `before` callbacks aan om te waarschuwen dat een nieuwe asynchrone executie context wordt ingevoerd. Wanneer er geneste aanroepen naar `emitBefore()` worden gemaakt, zal de stack van `asyncId`s worden bijgehouden en naar behoren afgewikkeld.

`before` en `after` calls moeten worden afgewikkeld in dezelfde volgorde als waarin ze worden aangeroepen. Anders zal zich een onherstelbare uitzondering voordoen en het proces zal afbreken. Om deze reden worden de `emitBefore` en `emitAfter` APIs beschouwd als afgekeurd. Gebruik alsjeblieft `runInAsyncScope`, want het biedt een veel veiliger alternatief.

#### `asyncResource.emitAfter()`
<!-- YAML
deprecated: v8.12.0
-->
> Stabiliteit: 0 - Afgekeurd: Gebruik [`asyncResource.runInAsyncScope()`][] als alternatief.

* Retourneert: {undefined}

Roep alle `after` callbacks aan. Wanneer geneste aanroepen naar `emitBefore()` werden gemaakt, zorg er dan voor dat de stack goed wordt afgewikkeld. Anders zal er een fout worden geworpen.

Wanneer de callback van de gebruiker een uitzondering werpt, zal automatisch `emitAfter()` worden aangeroepen voor alle `asyncId`s op de stack als de fout wordt afgehandeld door een domein of een `'uncaughtException'` beheerder.

`before` en `after` calls moeten worden afgewikkeld in dezelfde volgorde als waarin ze worden aangeroepen. Anders zal zich een onherstelbare uitzondering voordoen en het proces zal afbreken. Om deze reden worden de `emitBefore` en `emitAfter` APIs beschouwd als afgekeurd. Gebruik alsjeblieft `runInAsyncScope`, want het biedt een veel veiliger alternatief.

#### `asyncResource.emitDestroy()`

* Retourneert: {undefined}

Roep alle `destroy` hooks aan. Dit hoeft maar één keer aangeroepen te worden. Er zal een fout geworpen worden als dit meer dan eens wordt aangeroepen. Dit **moet** handmatig worden aangeroepen. Als de hulpbron nog moet worden verzameld door de GC dan zullen de `destroy` hooks nooit worden aangeroepen.

#### `asyncResource.asyncId()`

* Retourneert: {number} De unieke `asyncId` toegewezen aan de hulpbron.

#### `asyncResource.triggerAsyncId()`

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.
