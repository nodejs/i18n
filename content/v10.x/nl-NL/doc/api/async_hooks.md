# Async Haken

<!--introduced_in=v8.1.0-->

> Stabiliteit: 1 - Experimenteel

De `async_hooks` module verschaft een API om callbacks te registreren die de levensduur van asynchrone hulpmiddelen bijhoudt die zijn gecreëerd binnen een Node.js toepassing. Het kan worden bereikt met behulp van:

```js
const async_hooks = require('async_hooks');
```

## Terminologie

Een asynchrone hulpbron vertegenwoordigt een object met een bijbehorende callback. Deze callback kan meerdere keren worden opgeroepen, bijvoorbeeld, de `'connection'` gebeurtenis in `net.createServer()`, of slechts een enkele keer als in `fs.open()`. Een hulpmiddel kan ook worden gesloten voordat de callback wordt aangeroepen. `AsyncHook` maakt geen uitvoerig onderscheid tussen deze verschillende gevallen, maar zal ze vertegenwoordigen als het abstracte concept wat een hulpbron is.

If [`Worker`][]s are used, each thread has an independent `async_hooks` interface, and each thread will use a new set of async IDs.

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

Wanneer `AsyncHook` callbacks gooien, zal de toepassing de stack trace afdrukken en afsluiten. Het uitgangspad zal dat van een niet gevangen uitzondering volgen, maar alle `'uncaughtException'` luisteraars worden verwijderd, en daarmee dwingt het het proces om af te sluiten. De `'exit'` callbacks zullen nog steeds genoemd worden, tenzij de toepassing wordt uitgevoerd met `--abort-on-uncaught-exception`, in welk geval een stack trace zal worden geprint en de toepassing afsluit en het kernbestand verlaat.

De reden voor dit gedrag voor foutafhandeling is dat deze callbacks op potentieel vluchtige punten in de levensduur van een object worden gedraaid, bijvoorbeeld tijdens klasseconstructie en -vernietiging. Om deze reden wordt het noodzakelijk geacht om het proces snel neer te halen om een onbedoelde afbreking in de toekomst te voorkomen. Dit is onder voorbehoud van wijzigingen in de toekomst wanneer een uitgebreide analyse wordt uitgevoerd om ervoor te zorgen dat een uitzondering de normale controlestroom kan volgen zonder onbedoelde bijwerkingen.

##### Printen in AsyncHooks callbacks

Omdat het printen naar de console een asynchrone bewerking is, zal `console.log()` er voor zorgen dat de AsyncHooks-callbacks worden opgeroepen. Het gebruik van `console.log()` of soortgelijke asynchrone operaties binnen een AsyncHooks callback-functie zal dus tot een oneindige recursie leiden. An easy solution to this when debugging is to use a synchronous logging operation such as `fs.writeFileSync(file, msg, flag)`. This will print to the file and will not invoke AsyncHooks recursively because it is synchronous.

```js
const fs = require('fs');
const util = require('util');

function debug(...args) {
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeFileSync('log.out', `${util.format(...args)}\n`, { flag: 'a' });
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
* `resource` {Object} Referentie naar de hulpbron die de async operatie representeert, moet worden vrijgegeven tijdens het _destroy_.

Wordt opgeroepen wanneer een klasse wordt samengesteld die de _mogelijkheid_ heeft om een asynchrone gebeurtenis uit te zenden. Dit betekent _niet_ dat de instantie moet oproepen `before`/`after` before `destroy` is opgeroepen, maar alleen dat de mogelijkheid bestaat.

Dit gedrag kan worden waargenomen door iets te doen zoals het openen van een hulpbron en het dan te sluiten voordat de hulpbron kan worden gebruikt. Het volgende fragment toont dit.

```js
require('net').createServer().listen(function() { this.close(); });
// OF
clearTimeout(setTimeout(() => {}, 10));
```

Every new resource is assigned an ID that is unique within the scope of the current Node.js instance.

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

Het is mogelijk om type naam conflicten te hebben. Embedders worden aangemoedigd om gebruik te maken van unieke voorvoegsels, zoals de naam van het npm pakket, om conflicten te voorkomen bij het luisteren naar de hooks.

###### `triggerAsyncId`

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
TCPSERVERWRAP(5): trigger: 1 execution: 1
TCPWRAP(7): trigger: 5 execution: 0
```

De `TCPSERVERWRAP` is de server die de verbindingen ontvangt.

De `TCPWRAP` is de nieuwe verbinding van de client. Wanneer een nieuwe verbinding is gemaakt, wordt onmiddellijk de `TCPWrap` instantie geconstrueerd. Dit gebeurt buiten elke JavaScript stack om. (Een `executionAsyncId()` van `0` betekent dat het uitgevoerd wordt vanuit C++ met geen JavaScript stack erboven.) Met enkel die informatie, zou het onmogelijk zijn om hulpbronnen samen te stellen uit het oogpunt van wat hun creatie heeft veroorzaakt, dus `triggerAsyncId` wordt de taak gegeven bekend te maken welke hulpbron verantwoordelijk is voor het bestaan van de nieuwe hulpbron.

###### `hulpbron`

`resource` is een object dat de werkelijke async hulpbron die is geïnitialiseerd vertegenwoordigt. Dit kan nuttige informatie bevatten welke kan variëren afhankelijk van de waarde van `type`. For instance, for the `GETADDRINFOREQWRAP` resource type, `resource` provides the hostname used when looking up the IP address for the host in `net.Server.listen()`. De API voor toegang tot deze informatie wordt momenteel niet als publiek beschouwd, maar door gebruik van de Embedder API, kunnen gebruikers hun eigen hulpbron objecten verschaffen en documenteren. Bijvoorbeeld, kan een dergelijk hulpbron object de SQL-query bevatten die wordt uitgevoerd.

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
    fs.writeFileSync('log.out',
                     `${indentStr}before:  ${asyncId}\n`, { flag: 'a' });
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeFileSync('log.out',
                     `${indentStr}after:  ${asyncId}\n`, { flag: 'a' });
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeFileSync('log.out',
                     `${indentStr}destroy:  ${asyncId}\n`, { flag: 'a' });
  },
}).enable();

require('net').createServer(() => {}).listen(8080, () => {
  // Let's wait 10ms before logging the server started.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
```

Uitvoer alleen van het starten van de server:

```console
TCPSERVERWRAP(5): trigger: 1 execution: 1
TickObject(6): trigger: 5 execution: 1
before:  6
  Timeout(7): trigger: 6 execution: 6
after:   6
destroy: 6
before:  7
>>> 7
  TickObject(8): trigger: 7 execution: 7
after:   7
before:  8
after:   8
```

Zoals geïllustreerd in het voorbeeld, geven `executionAsyncId()` en `execution` ieder de waarde aan van de huidige uitvoeringscontext; die wordt afgebakend door het aanroepen van `before` en `after`.

Het gebruik van enkel `execution` om de hulpbronbestemming in kaart te zetten, resulteert in het volgende:

```console
Timeout(7) -> TickObject(6) -> root(1)
```

De `TCPSERVERWRAP` is geen deel van deze grafiek, ook al was het de reden om `console.log()` op te roepen. Dit is omdat het binden aan een uitgang zonder de hostnaam een *synchrone* werking is, maar om een complete asynchrone API te behouden, wordt de callback van de gebruiker geplaatst in een `process.nextTick()`.

The graph only shows *when* a resource was created, not *why*, so to track the *why* use `triggerAsyncId`.

##### voor(asyncId)

* `asyncId` {number}

Wanneer een asynchrone bewerking wordt geïnitieerd (zoals de TCP server die een nieuwe verbinding ontvangt) of compleet maakt (zoals het schrijven van data naar een disk) wordt er een callback opgeroepen om de gebruiker hierover te informeren. De `before` callback wordt opgeroepen net voordat de genoemde callback wordt uitgevoerd. `asyncId` is de unieke identificatie die is toegewezen aan de hulpbron die op het punt staat de callback uit te voeren.

De `before` callback zal 0 tot N keer opgeroepen worden. De `before` callback wordt over het algemeen 0 keer opgeroepen als de asynchrone werking geannuleerd is of, bijvoorbeeld, als er geen verbindingen worden ontvangen door een TCP server. Hardnekkige asynchrone hulpbronnen zoals een TCP server zullen over het algemeen de `before` callback meerdere keren oproepen, terwijl andere werkingen zoals `fs.open()` het maar één keer oproept.

##### after(asyncId)

* `asyncId` {number}

Wordt onmiddellijk opgeroepen nadat de callback die is aangeduid in `before` is voltooid.

If an uncaught exception occurs during execution of the callback, then `after` will run *after* the `'uncaughtException'` event is emitted or a `domain`'s handler runs.

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
const server = net.createServer((conn) => {
  // Returns the ID of the server, not of the new connection, because the
  // callback runs in the execution scope of the server's MakeCallback().
  async_hooks.executionAsyncId();

}).listen(port, () => {
  // Returns the ID of a TickObject (i.e. process.nextTick()) because all
  // callbacks passed to .listen() are wrapped in a nextTick().
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

By default, promise executions are not assigned `asyncId`s due to the relatively expensive nature of the [promise introspection API](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk/edit) provided by V8. Dit betekent dat programma's die gebruik maken van beloften of `async`/`await` geen correcte uitvoering krijgen en standaard id's triggeren voor belofte callback contexten.

```js
const ah = require('async_hooks');
Promise.resolve(1729).then(() => {
  console.log(`eid ${ah.executionAsyncId()} tid ${ah.triggerAsyncId()}`);
});
// produceert:
// eid 1 tid 0
```

Observeer dat de `then()` claimt te hebben uitgevoerd in de context van het externe bereik, ook al was er een asynchrone sprong bij betrokken. Observeer ook dat de `triggerAsyncId` waarde `0` is, wat betekent dat wij context missen over de hulpbron die de `then()` uitvoer heeft veroorzaakt (getriggered).

Installing async hooks via `async_hooks.createHook` enables promise execution tracking:

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

Een andere subtiliteit met beloften is dat `before` en `after` callback alleen op geketende beloften worden gedraaid. Dit betekent dat beloften die niet zijn gecreëerd door `then()`/`catch()` geen `before` en `after` callbacks op hen afgevuurd krijgen. For more details see the details of the V8 [PromiseHooks](https://docs.google.com/document/d/1rda3yKGHimKIhg5YeoAmCOtyURgsbTH_qaYR79FELlk/edit) API.

## JavaScript Embedder API

Bibliotheek-ontwikkelaars die zich met hun eigen asynchrone hulpbronnen voor het uitvoeren van taken bezighouden, zoals I/O, connection pooling, of het beheren van callback wachtrijen, kunnen de `AsyncWrap` JavaScript API gebruiken, zodat alle passende callbacks aangeroepen worden.

### Class: AsyncResource

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
```

#### nieuwe AsyncResource(type[, options])

* `type` {string} Het type async event.
* `options` {Object}
  * `triggerAsyncId` {number} De ID van de uitvoeringscontext die deze async event heeft gecreëerd. **Standaard:** `executionAsyncId()`.
  * `requireManualDestroy` {boolean} Schakelt automatisch `emitDestroy` uit wanneer het object afval is opgehaald. Dit hoeft meestal niet te worden ingesteld (zelfs als `emitDestroy` handmatig werd aangeroepen), tenzij de `asyncId` hulpbronnen zijn ontvangen en met gevoelige API's `emitDestroy` is aangeroepen. **Standaard:** `false`.

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

#### asyncResource.runInAsyncScope(fn[, thisArg, ...args])
<!-- YAML
added: v9.6.0
-->

* `fn` {Function} De aan te roepen functie in de executie context van deze async hulpbron.
* `thisArg` {any} De te gebruiken ontvanger voor de functie oproep.
* `...args` {any} Optionele argumenten om door te geven aan de functie.

Roep de geleverde functie op met de verstrekte argumenten in de executie context van de async hulpbron. Dit zal de context vaststellen, de AsyncHooks triggeren voor de callbacks, de functie oproepen, de AsyncHook na callbacks triggeren, en dan de originele executie context herstellen.

#### asyncResource.emitBefore()
<!-- YAML
deprecated: v9.6.0
-->
> Stabiliteit: 0 - Afgekeurd: Gebruik [`asyncResource.runInAsyncScope()`][] als alternatief.

Roep alle `before` callbacks aan om te waarschuwen dat een nieuwe asynchrone executie context wordt ingevoerd. Wanneer er geneste aanroepen naar `emitBefore()` worden gemaakt, zal de stack van `asyncId`s worden bijgehouden en naar behoren afgewikkeld.

`before` en `after` calls moeten worden afgewikkeld in dezelfde volgorde als waarin ze worden aangeroepen. Anders zal zich een onherstelbare uitzondering voordoen en het proces zal afbreken. Om deze reden worden de `emitBefore` en `emitAfter` APIs beschouwd als afgekeurd. Gebruik alsjeblieft `runInAsyncScope`, want het biedt een veel veiliger alternatief.

#### asyncResource.emitAfter()
<!-- YAML
deprecated: v9.6.0
-->
> Stabiliteit: 0 - Afgekeurd: Gebruik [`asyncResource.runInAsyncScope()`][] als alternatief.

Roep alle `after` callbacks aan. Wanneer geneste aanroepen naar `emitBefore()` werden gemaakt, zorg er dan voor dat de stack goed wordt afgewikkeld. Anders zal er een fout worden geworpen.

Wanneer de callback van de gebruiker een uitzondering werpt, zal automatisch `emitAfter()` worden aangeroepen voor alle `asyncId`s op de stack als de fout wordt afgehandeld door een domein of een `'uncaughtException'` beheerder.

`before` en `after` calls moeten worden afgewikkeld in dezelfde volgorde als waarin ze worden aangeroepen. Anders zal zich een onherstelbare uitzondering voordoen en het proces zal afbreken. Om deze reden worden de `emitBefore` en `emitAfter` APIs beschouwd als afgekeurd. Gebruik alsjeblieft `runInAsyncScope`, want het biedt een veel veiliger alternatief.

#### asyncResource.emitDestroy()

* Returns: {AsyncResource} A reference to `asyncResource`.

Roep alle `destroy` hooks aan. Dit hoeft maar één keer aangeroepen te worden. Er zal een fout geworpen worden als dit meer dan eens wordt aangeroepen. Dit **moet** handmatig worden aangeroepen. Als de hulpbron nog moet worden verzameld door de GC dan zullen de `destroy` hooks nooit worden aangeroepen.

#### asyncResource.asyncId()

* Retourneert: {number} De unieke `asyncId` toegewezen aan de hulpbron.

#### asyncResource.triggerAsyncId()

* Retourneert: {number} Dezelfde `triggerAsyncId` die wordt doorgegeven aan de `AsyncResource` constructor.
