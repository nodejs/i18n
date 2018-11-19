# Async Haken

<!--introduced_in=v8.1.0-->

> Stabiliteit: 1 - Experimenteel

De `async_hooks` module verschaft een API om callbacks te registreren die de levensduur van asynchrone hulpmiddelen bijhoudt die zijn gecreëerd binnen een Node.js toepassing. Het kan worden bereikt met behulp van:

```js
const async_hooks = require('async_hooks');
```

## Terminologie

Een asynchrone hulpbron vertegenwoordigt een object met een bijbehorende callback. Deze callback kan meerdere keren worden opgeroepen, bijvoorbeeld, de `'connection'` gebeurtenis in `net.createServer()`, of slechts een enkele keer als in `fs.open()`. Een hulpmiddel kan ook worden gesloten voordat de callback wordt aangeroepen. `AsyncHook` maakt geen uitvoerig onderscheid tussen deze verschillende gevallen, maar zal ze vertegenwoordigen als het abstracte concept wat een hulpbron is.

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

#### async_hooks.createHook(callbacks)

<!-- YAML
added: v8.1.0
-->

* `callbacks` {Object} De [Hook Callbacks](#async_hooks_hook_callbacks) te registreren 
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

Wanneer `AsyncHook` callbacks gooien, zal de toepassing de stack trace afdrukken en afsluiten. Het uitgangspad zal dat van een niet gevangen uitzondering volgen, maar alle `'uncaughtException'` luisteraars worden verwijderd, en daarmee dwingt het het proces om af te sluiten. De `'exit'` callbacks zullen nog steeds genoemd worden, tenzij de toepassing wordt uitgevoerd met `--abort-on-uncaught-exception`, in welk geval een stack trace zal worden geprint en de toepassing afsluit en het kernbestand verlaat.

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

#### asyncHook.enable()

* Retourneert: {AsyncHook} Een referentie naar `asyncHook`.

Schakel de callbacks voor een gegeven `AsyncHook` instantie in. Wanneer geen callbacks toegeleverd zijn is het inschakelen een no-op.

De `AsyncHook` instantie is als standaard uitgeschakeld. Wanneer de `AsyncHook` instantie moet worden ingeschakeld onmiddellijk na creatie, kan het volgende patroon worden gebruikt.

```js
const async_hooks = require('async_hooks');

const hook = async_hooks.createHook(callbacks).enable();
```

#### asyncHook.disable()

* Retourneert: {AsyncHook} Een referentie naar `asyncHook`.

Schakel de callbacks uit om een gegeven `AsyncHook` instantie uit de globale groep van `AsyncHook` callbacks uit te voeren. Zodra een haak is uitgeschakeld, zal het niet opnieuw opgeroepen worden totdat het weer is ingeschakeld.

Voor API consistentie zal `disable()` ook de `AsyncHook` instantie retourneren.

#### Hook Callbacks

Belangrijke gebeurtenissen gedurende de levensduur van asynchrone gebeurtenissen zijn gecategoriseerd in vier gebieden: instantiëren, voor/nadat de callback wordt genoemd, en wanneer de instantie wordt vernietigd.

##### init(asyncId, type, triggerAsyncId, resource)

* `asyncId` {number} Een unieke ID voor de async hulpbron.
* `type` {string} Het type van de async hulpbron.
* `triggerAsyncId` {number} Het unieke ID van de async hulpbron in wiens uitvoeringscontext deze async hulpbron is gemaakt.
* `resource` {Object} Referentie naar de hulpbron die de async operatie representeert, moet worden vrijgegeven tijdens het *destroy*.

Wordt opgeroepen wanneer een klasse wordt samengesteld die de *mogelijkheid* heeft om een asynchrone gebeurtenis uit te zenden. Dit betekent *niet* dat de instantie moet oproepen `before`/`after` before `destroy` is opgeroepen, maar alleen dat de mogelijkheid bestaat.

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
SIGNALWRAP, STATWATCHER, TCPCONNECTWRAP, TCPSERVER, TCPWRAP, TIMERWRAP, TTYWRAP,
UDPSENDWRAP, UDPWRAP, WRITEWRAP, ZLIB, SSLCONNECTION, PBKDF2REQUEST,
RANDOMBYTESREQUEST, TLSWRAP, Timeout, Immediate, TickObject
```

Er is ook het `PROMISE` hulpbron type, die wordt gebruikt om `Promise` instanties bij te houden en asyncrhoon werk door hen.

Gebruikers kunnen hun eigen `type` definiëren bij het gebruik van de openbare embedder API.

Het is mogelijk om type naam conflicten te hebben. Embedders worden aangemoedigd om gebruik te maken van unieke voorvoegsels, zoals de naam van het npm pakket, om conflicten te voorkomen bij het luisteren naar de hooks.

###### `triggerAsyncId`

`triggerAsyncId` is de `asyncId` van de hulpbron die het initialiseren van de nieuwe hulpbron heeft veroorzaakt (of "getriggered") en waardoor `init` getriggered werd om op te roepen. Dit is anders dan `async_hooks.executionAsyncId()` die alleen laat zien *wanneer* een hulpbron werd gecreëerd, terwijl `triggerAsyncId` laat zien *waarom* een hulpbron werd gecreëerd.

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

De `TCPWRAP` is de nieuwe verbinding van de client. Wanneer een nieuwe verbinding is gemaakt, wordt onmiddellijk de `TCPWrap` instantie geconstrueerd. Dit gebeurt buiten elke JavaScript stack om. (Een `executionAsyncId()` van `0` betekent dat het uitgevoerd wordt vanuit C++ met geen JavaScript stack erboven.) Met enkel die informatie, zou het onmogelijk zijn om hulpbronnen samen te stellen uit het oogpunt van wat hun creatie heeft veroorzaakt, dus `triggerAsyncId` wordt de taak gegeven bekend te maken welke hulpbron verantwoordelijk is voor het bestaan van de nieuwe hulpbron.

###### `hulpbron`

`resource` is een object dat de werkelijke async hulpbron die is geïnitialiseerd vertegenwoordigt. Dit kan nuttige informatie bevatten welke kan variëren afhankelijk van de waarde van `type`. Bijvoorbeeld, voor het `GETADDRINFOREQWRAP` hulpbron type, `resource` verschaft de hostnaam die is gebruikt wanneer het IP adres wordt opgezocht voor de hostnaam in `net.Server.listen()`. De API voor toegang tot deze informatie wordt momenteel niet als publiek beschouwd, maar door gebruik van de Embedder API, kunnen gebruikers hun eigen hulpbron objecten verschaffen en documenteren. Bijvoorbeeld, kan een dergelijk hulpbron object de SQL-query bevatten die wordt uitgevoerd.

In het geval van Beloften, zal het `resource` object een `promise` eigenschap hebben die refereert naar de `Promise` die wordt geïnitialiseerd, en een `isChainedPromise` eigenschap, ingesteld naar `true` wanneer de belofte een ouder belofte heeft, en `false` als het anders is. Bijvoorbeeld, in het geval van `b = a.then(handler)`, `a` wordt beschouwd als een ouder `Promise` of `b`. Hier wordt `b` beschouwd als een geketende belofte.

In sommige gevallen wordt het hulpbron object hergebruikt voor prestatie redenen, het is daarom niet veilig om het als sleutel te gebruiken in een `WeakMap` of om eigenschappen toe te voegen.

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

Zoals geïllustreerd in het voorbeeld, geven `executionAsyncId()` en `execution` ieder de waarde aan van de huidige uitvoeringscontext; die wordt afgebakend door het aanroepen van `before` en `after`.

Het gebruik van enkel `execution` om de hulpbronbestemming in kaart te zetten, resulteert in het volgende:

```console
TTYWRAP(6) -> Timeout(4) -> TIMERWRAP(5) -> TickObject(3) -> root(1)
```

De `TCPSERVERWRAP` is geen deel van deze grafiek, ook al was het de reden om `console.log()` op te roepen. Dit is omdat het binden aan een uitgang zonder de hostnaam een *synchrone* werking is, maar om een complete asynchrone API te behouden, wordt de callback van de gebruiker geplaatst in een `process.nextTick()`.

De grafiek laat alleen zien *wanneer* een bron werd gecreëerd, niet *waarom*, dus om het *waarom* bij te houden, gebruik `triggerAsyncId`.

##### voor(asyncId)

* `asyncId` {number}

Wanneer een asynchrone bewerking wordt geïnitieerd (zoals de TCP server die een nieuwe verbinding ontvangt) of compleet maakt (zoals het schrijven van data naar een disk) wordt er een callback opgeroepen om de gebruiker hierover te informeren. De `before` callback wordt opgeroepen net voordat de genoemde callback wordt uitgevoerd. `asyncId` is de unieke identificatie die is toegewezen aan de hulpbron die op het punt staat de callback uit te voeren.

De `before` callback zal 0 tot N keer opgeroepen worden. De `before` callback wordt over het algemeen 0 keer opgeroepen als de asynchrone werking geannuleerd is of, bijvoorbeeld, als er geen verbindingen worden ontvangen door een TCP server. Hardnekkige asynchrone hulpbronnen zoals een TCP server zullen over het algemeen de `before` callback meerdere keren oproepen, terwijl andere werkingen zoals `fs.open()` het maar één keer oproept.

##### after(asyncId)

* `asyncId` {number}

Wordt onmiddellijk opgeroepen nadat de callback die is aangeduid in `before` is voltooid.

Wanneer een ongevangen uitzondering optreedt tijdens de uitvoering van de callback, zal `after` draaien *nadat* de `'uncaughtException'` gebeurtenis is uitgezonden of een `domain`'s beheerder draait.

##### destroy(asyncId)

* `asyncId` {number}

Wordt aangeroepen nadat de hulpbron die overeenkomt met `asyncId` wordt vernietigd. Het wordt ook asynchroon aangeroepen vanuit de embedder API `emitDestroy()`.

Sommige hulpbronnen zijn afhankelijk van afvalcollectie voor een opruiming, dus wanneer een referentie wordt gemaakt naar het `resource` object doorgegeven aan `init` is het mogelijk dat `destroy` nooit wordt aangeroepen, wat een geheugenlekkage in de toepassing veroorzaakt. Wanneer de hulpbron niet afhankelijk is van afvalcollectie, dan zal dit geen probleem zijn.

##### promiseResolve(asyncId)

* `asyncId` {number}

Aangeroepen wanneer de `resolve` functie doorgegeven aan de `Promise` constructor wordt aangeroepen (rechtstreeks of via andere middelen om een belofte op te lossen).

Observeer dat `resolve()` geen waarneembaar synchroon werk doet.

De `Promise` wordt nu niet noodzakelijkerwijs vervuld of verworpen als de `Promise` werd opgelost door de veronderstelling van een andere `Promise`.

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

#### async_hooks.executionAsyncId()

<!-- YAML
added: v8.1.0
changes:

  - version: v8.2.0
    pr-url: https://github.com/nodejs/node/pull/13490
    description: Renamed from `currentId`
-->

* Retourneert: {number} The `asyncId` van de huidige uitvoeringscontext. Nuttig voor het bijhouden wanneer er iets oproept.

```js
const async_hooks = require('async_hooks');

console.log(async_hooks.executionAsyncId());  // 1 - bootstrap
fs.open(path, 'r', (err, fd) => {
  console.log(async_hooks.executionAsyncId());  // 6 - open()
});
```

De ID die is geretourneerd vanuit `executionAsyncId()` is gerelateerd aan de timing van de uitvoering, niet causaliteit (die wordt gedekt door `triggerAsyncId()`):

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

Observeer dat belofte contexten standaard geen precieze `executionAsyncIds` krijgen. Zie de sectie over [promise execution tracking](#async_hooks_promise_execution_tracking).

#### async_hooks.triggerAsyncId()

* Retourneert: {number} De ID van de hulpbron verantwoordelijk voor het aanroepen van de callback die op dit moment wordt uitgevoerd.

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

Observeer dat belofte contexten standaard geen precieze `triggerAsyncId`s krijgen. Zie de sectie over [promise execution tracking](#async_hooks_promise_execution_tracking).

## Belofte uitvoering tracering

Als standaard, worden belofte uitvoeringen geen `asyncId`s toegewezen vanwege de relatieve dure aard van de [belofte introspectie API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) verschaft door de V8. Dit betekent dat programma's die gebruik maken van beloften of `async`/`await` geen correcte uitvoering krijgen en standaard id's triggeren voor belofte callback contexten.

Hier is een voorbeeld:

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produceert:
// eid 1 tid 0
```

Observeer dat de `then()` claimt te hebben uitgevoerd in de context van het externe bereik, ook al was er een asynchrone sprong bij betrokken. Observeer ook dat de `triggerAsyncId` waarde `0` is, wat betekent dat wij context missen over de hulpbron die de `then()` uitvoer heeft veroorzaakt (getriggered).

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

In dit voorbeeld, maakte het toevoegen van een actuele hook functie het mogelijk dat het traceren van beloften werd ingeschakeld. In het voorbeeld hierboven zijn twee beloften; de belofte die is gecreëerd door `Promise.resolve()` en de belofte geretourneerd door de oproep om `then()`. In het voorbeeld hierboven, krijgt de eerste belofte de `asyncId` `6` en de laatste krijgt `asyncId` `7`. Gedurende de uitvoering van de `then()` callback, voeren we uit in de context van belofte met `asyncId` `7`. Deze belofte werd getriggerd door async resource `6`.

Een andere subtiliteit met beloften is dat `before` en `after` callback alleen op geketende beloften worden gedraaid. Dit betekent dat beloften die niet zijn gecreëerd door `then()`/`catch()` geen `before` en `after` callbacks op hen afgevuurd krijgen. Voor meer informatie zie de details van de V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk) API.

## JavaScript Embedder API

Library developers that handle their own asynchronous resources performing tasks like I/O, connection pooling, or managing callback queues may use the `AsyncWrap` JavaScript API so that all the appropriate callbacks are called.

### Class: AsyncResource

The class `AsyncResource` is designed to be extended by the embedder's async resources. Using this, users can easily trigger the lifetime events of their own resources.

The `init` hook will trigger when an `AsyncResource` is instantiated.

The following is an overview of the `AsyncResource` API.

```js
const { AsyncResource, executionAsyncId } = require('async_hooks');

// AsyncResource() is meant to be extended. Instantiating a
// new AsyncResource() also triggers init. If triggerAsyncId is omitted then
// async_hook.executionAsyncId() is used.
const asyncResource = new AsyncResource(
  type, { triggerAsyncId: executionAsyncId(), requireManualDestroy: false }
);

// Run a function in the execution context of the resource. This will
// * establish the context of the resource
// * trigger the AsyncHooks before callbacks
// * call the provided function `fn` with the supplied arguments
// * trigger the AsyncHooks after callbacks
// * restore the original execution context
asyncResource.runInAsyncScope(fn, thisArg, ...args);

// Call AsyncHooks destroy callbacks.
asyncResource.emitDestroy();

// Return the unique ID assigned to the AsyncResource instance.
asyncResource.asyncId();

// Return the trigger ID for the AsyncResource instance.
asyncResource.triggerAsyncId();

// Call AsyncHooks before callbacks.
// Deprecated: Use asyncResource.runInAsyncScope instead.
asyncResource.emitBefore();

// Call AsyncHooks after callbacks.
// Deprecated: Use asyncResource.runInAsyncScope instead.
asyncResource.emitAfter();
```

#### new AsyncResource(type[, options])

* `type` {string} The type of async event.
* `options` {Object} 
  * `triggerAsyncId` {number} The ID of the execution context that created this async event. **Default:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Disables automatic `emitDestroy` when the object is garbage collected. This usually does not need to be set (even if `emitDestroy` is called manually), unless the resource's `asyncId` is retrieved and the sensitive API's `emitDestroy` is called with it. **Default:** `false`.

Example usage:

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

#### asyncResource.runInAsyncScope(fn[, thisArg, ...args])

<!-- YAML
added: v9.6.0
-->

* `fn` {Function} The function to call in the execution context of this async resource.
* `thisArg` {any} The receiver to be used for the function call.
* `...args` {any} Optional arguments to pass to the function.

Call the provided function with the provided arguments in the execution context of the async resource. This will establish the context, trigger the AsyncHooks before callbacks, call the function, trigger the AsyncHooks after callbacks, and then restore the original execution context.

#### asyncResource.emitBefore()

<!-- YAML
deprecated: v9.6.0
-->

> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

Call all `before` callbacks to notify that a new asynchronous execution context is being entered. If nested calls to `emitBefore()` are made, the stack of `asyncId`s will be tracked and properly unwound.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitAfter()

<!-- YAML
deprecated: v9.6.0
-->

> Stability: 0 - Deprecated: Use [`asyncResource.runInAsyncScope()`][] instead.

Call all `after` callbacks. If nested calls to `emitBefore()` were made, then make sure the stack is unwound properly. Otherwise an error will be thrown.

If the user's callback throws an exception, `emitAfter()` will automatically be called for all `asyncId`s on the stack if the error is handled by a domain or `'uncaughtException'` handler.

`before` and `after` calls must be unwound in the same order that they are called. Otherwise, an unrecoverable exception will occur and the process will abort. For this reason, the `emitBefore` and `emitAfter` APIs are considered deprecated. Please use `runInAsyncScope`, as it provides a much safer alternative.

#### asyncResource.emitDestroy()

Call all `destroy` hooks. This should only ever be called once. An error will be thrown if it is called more than once. This **must** be manually called. If the resource is left to be collected by the GC then the `destroy` hooks will never be called.

#### asyncResource.asyncId()

* Returns: {number} The unique `asyncId` assigned to the resource.

#### asyncResource.triggerAsyncId()

* Returns: {number} The same `triggerAsyncId` that is passed to the `AsyncResource` constructor.