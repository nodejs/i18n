# Pętla zdarzeń programu Node.js, Zegary i `process.nextTick()`

## Co to jest Pętla Zdarzeń?

Pętla zdarzeń umożliwia Node.js wykonywanie nieblokujących operacji wej/wyj operacje - pomimo tego, że JavaScript jest jednowątkowy - przez przeładowywanie operacji na jądro systemu, gdy tylko jest to możliwe.

Ponieważ większość nowoczesnych jąder jest wielowątkowych, mogą obsługiwać wiele operacji wykonywanych w tle. Kiedy jedna z tych operacji zakończy się, jądro mówi Node.js, aby odpowiednie wywołanie zwrotne mogły zostać dodane do kolejki **sondażu**, aby ostatecznie został wykonany. Wyjaśnimy to bardziej szczegółowo w dalszej części tego tematu.

## Objaśnienie Pętli Zdarzeń

Po uruchomieniu, Node.js inicjuje pętlę zdarzeń, przetwarza dostarczony skrypt wejściowy (lub wpada w [REPL](https://nodejs.org/api/repl.html#repl_repl), który nie jest uwzględniony w ten dokument), który może wykonywać asynchroniczne wywołania API, planować zegary lub wywoływać `process.nextTick()`, a następnie rozpoczyna przetwarzanie pętli zdarzeń.

Poniższy diagram przedstawia uproszczony przegląd kolejności operacji pętli zdarzeń.

```txt
   ┌───────────────────────┐
┌─>│ timery │
│ └──────────┬────────────┘
│ ┌──────────┴────────────┐
│ │ I/O wywołania zwrotne │
│ └──────────┬────────────┘
│ ┌──────────┴────────────┐
│ │ bezczynność, przygotowanie │
│ └──────────┬────────────┘ ┌───────────────┐
│ ┌──────────┴────────────┐ │ przychodzące: │
│ │ sonda │<─────┤  połączenia, │ │
└──────────┬────────────┘ │ dane, itp.  │
│  ┌──────────┴────────────┐      └───────────────┘
│  │        weryfikacja          │
│  └──────────┬────────────┘
│  ┌──────────┴────────────┐
└──┤    zamknij wywołania zwrotne    │
   └───────────────────────┘
```

*uwaga: każde pole będzie określane jako "faza" pętli zdarzeń.*

Każda faza ma kolejkę wywołania zwrotnego FIFO do wykonania. Podczas gdy każda faza jest wyjątkowa na swój sposób, ogólnie, gdy pętla zdarzeń wchodzi w daną fazę W takim wypadku wykona ona wszystkie operacje właściwe dla tej fazy, następnie wykona wywołania zwrotne w kolejce tej fazy, aż do momentu gdy kolejka wyczerpie się lub zostanie wykonana maksymalna liczba wywołań zwrotnych. Kiedy kolejka została wyczerpana lub osiągnięto limit wywołań zwrotnych, pętla zdarzeń przejdzie do następnej fazy i tak dalej.

Since any of these operations may schedule *more* operations and new events processed in the **poll** phase are queued by the kernel, poll events can be queued while polling events are being processed. Jak W rezultacie długotrwałe wywoływania zwrotne mogą znacznie przyspieszyć fazę odpytywania dłużej niż próg timera. Zobacz [**timery**](#timers) i **odpytywanie</​​1>, aby uzyskać więcej informacji.</p> 

***UWAGA:** Występuje niewielka rozbieżność między Windowsem i Implementacją systemu Unix/Linux, ale to nie ma znaczenia dla tej demonstracji. Najważniejsze części są tutaj. Istnieje faktycznie siedem albo osiem kroków, ale te którymi się przejmujemy - te które obecnie wykorzystuje - są powyżej.*

## Przegląd Faz

* **timery**: faza ta wykonuje wywołania zwrotne zaplanowane przez `ustawKoniecCzasu()`i `ustawiinterwał()`.
* **Wej/Wyj wywołania zwrotne**: wykonuje prawie wszystkie wywołania zwrotne z wyjątkiem zamkniętych wywołań zwrotnych, te zaplanowane przez timery i `ustawnatychmiastowo()`.
* **bezczynność, przygotuj**: używane tylko wewnętrznie.
* **odpytywanie**: odzyskaj nowe zdarzenia Wej/Wyj; węzeł zostanie tutaj zablokowany, gdy będzie to właściwe.
* **sprawdź**: `ustawNatychmiastowo()` wywołania zwrotne są wywoływane tutaj.
* **zamknięte wywołania zwrotne**: np `socket.on('zamknij',...)`.

Między każdym uruchomieniem pętli zdarzeń Node.js sprawdza, czy oczekuje dowolne asynchroniczne operacje wej/wyj lub timerów i wyłącza się, jeśli nie.

## Fazy w Szczegółach

### timery

Timer określa **próg***, po którym * jest zapewnione wywołanie zwrotne *może być wykonywane*zamiast **dokładnego**czasu, gdy osoba* chce, aby było to wykonane*. Połączenia zwrotne timerów działają tak wcześnie, jak tylko mogą zaplanowane po upływie określonego czasu; jednak, planowanie Systemu Operacyjnego lub uruchamianie innych wywołań zwrotnych może się opóźnić im.

***Uwaga**: Z technicznego punktu widzenia [**odpytywanie**faza](#poll) kontroluje timery, które są wykonywane.*

Na przykład powiedzmy, że planujesz czas oczekiwania na wykonanie po próg 100 ms, wtedy twój skrypt zaczyna asynchronicznie odczytywać plik, który trwa 95 ms:

```js
const fs = require('fs');

function someAsyncOperation(callback) {
  // Assume this takes 95ms to complete
  fs.readFile('/path/to/file', callback);
}

const timeoutScheduled = Date.now();

setTimeout(function() {

  const delay = Date.now() - timeoutScheduled;

  console.log(delay + 'ms have passed since I was scheduled');
}, 100);


// do someAsyncOperation which takes 95 ms to complete
someAsyncOperation(function() {

  const startCallback = Date.now();

  // do something that will take 10ms...
  while (Date.now() - startCallback < 10) {
    // do nothing
  }

});
```

Kiedy pętla zdarzeń wchodzi w fazę **odpytywania**, ma pustą kolejkę (`fs.readFile()` nie zostało zakończone), więc będzie czekać na liczbę ms pozostałych do ​​osiągnięcia progu jak najszybszego timera. Podczas gdy jest oczekiwanie 95 ms przejścia, `fs.readFile()` kończy czytanie pliku i jego wywołanie zwrotne, które trwa 10 ms, jest dodawane do kolejki **odpytywania** i wykonany. Po zakończeniu wywołania zwrotnego nie ma więcej wywołań zwrotnych w kolejce, więc pętla zdarzeń zobaczy, że próg najwcześniejszego timera został osiągnięty, a następnie zawinięty do fazy ** timerów** w celu wykonania wywołania zwrotnego timera. W tym przykładzie zobaczysz całkowite opóźnienie pomiędzy zaplanowanym timerem a jego wywoływaniem zwrotnym wykonywanym przez 105ms.

Uwaga: Aby nie dopuścić do fazy **odpytywania** z powodu zagłodzenia pętli zdarzeń, \[libuv\] (http://libuv.org/) (biblioteka C, która implementuje pętlę zdarzeń Node.js i wszystkie asynchroniczne zachowania platformy) ma również twarde maksimum (zależne od systemu), zanim przestanie odpytywać dla większej ilości wydarzeń.

### Wej/Wyj wywołania zwrotne

Ta faza wykonuje wywołania zwrotne dla niektórych operacji systemowych, takich jak typy błędów TCP. Na przykład, jeśli gniazdo TCP otrzymuje `POŁĄCZENIE ODRZUCONE` kiedy próbując się połączyć, niektóre systemy \* nix chcą czekają na zgłoszenie błędu. Zostanie on umieszczony w kolejce do wykonania w fazie **wywołania zwrotne**.

### odpytywanie

Faza **odpytywania** ma dwie główne funkcje:

1. Wykonywanie skryptów dla timerów, których próg upłynął, a następnie
2. Przetwarzanie zdarzeń w kolejce **odpytywania**.

Kiedy pętla zdarzeń wchodzi w fazę* **odpytywania** i nie ma zaplanowanych timerów *, nastąpi jedna z dwóch rzeczy:

* *jeśli **kolejka**odpytywania**nie jest pusta***, pętla zdarzeń zostanie powtórzona poprzez kolejkę wywołań zwrotnych, synchronicznie do czasu albo kolejka została wyczerpana, albo zależny od systemu surowy limit został osiągnięty.

* *jeśli **kolejka**odpytywania**jest pusta***, staną się jedna lub dwie rzeczy:
    
    * Jeśli skrypty zostały zaplanowane przez `setImmediate()`, pętla zdarzeń zakończy fazę **odpytywania** i przejdzie do etapu **sprawdzenia** by wykonać te zaplanowane skrypty.
    
    * Jeśli skrypty **nie zostały** zaplanowane przez `ustawNatychmiastowo()`, to pętla zdarzeń będzie czekać na dodanie wywołań zwrotnych do kolejki, następnie wykona je natychmiast.

Gdy kolejka **odpytywania** jest pusta, pętla zdarzeń sprawdzi timery *których progi czasowe zostały osiągnięte *. Jeśli jest jeden lub więcej timerów jest gotowy, pętla zdarzeń powróci do fazy **timery**, aby wykonać wywołania zwrotne tych zegarów.

### sprawdzenie

Ta faza pozwala osobie wykonać wywołania zwrotne natychmiast po zakończeniu fazy **odpytywania**. Jeśli faza **odpytywania** stanie się bezczynna i skrypty zostały umieszczone w kolejce z `ustawNatychmiastowo()`, pętla zdarzeń może przejść do fazy **sprawdzenia**, zamiast czekać.

`ustawNatychmiastowo()` jest w rzeczywistości specjalnym timerem, który działa w oddzielnej fazie pętli zdarzeń. Używa API libuv, który planuje wywołania zwrotne, aby je wykonywały po zakończeniu fazy **odpytywania**.

Na ogół, podczas wykonywania kodu, pętla zdarzeń ostatecznie trafi na fazę **odpytywania**, w której będzie czekać na przychodzące połączenie, żądanie, itp. Niemniej, jeśli zaplanowano wywołanie zwrotne z `ustawNatychmiastowo()`, a faza **odpytywania** staje się bezczynna, zakończy się i przejdzie do **sprawdzenia** zamiast czekać na zdarzenia **odpytywania**.

### zamknij wywołania zwrotne

Jeśli gniazdo lub identyfikator zostaną nagle zamknięte (np.`socket.destroy()`), to zdarzenie `'zamknij'` zostanie wyemitowane w tej fazie. W przeciwnym razie będzie emitowane przez `process.nextTick()`.

## `ustawNatychmiastowo()` vs `ustawKoniecCzasu()`

`ustawNatychmiastowo` i `ustawKoniecCzasu()` są podobne, ale zachowują się w inny sposób zależnie od tego, kiedy są przywoływane.

* `ustawNatychmiastowo()` służy do wykonywania skryptu po bieżącym zakończeniu fazy **odpytywania**.
* `ustawKoniecCzasu()` planuje uruchomienie skryptu po upłynięciu w ms minimalnego progu.

Kolejność wykonywania timerów będzie się bardzo różnić w zależności od kontekstu, w którym są przywoływane. Jeśli oba są wywoływane w obrębie głównego modułu, to w takim razie pomiar czasu będzie związany z wydajnością procesu (na który mogą mieć wpływ inne uruchomione aplikacje na komputerze).

Na przykład, jeśli uruchomimy poniższy skrypt, który nie znajduje się wewnątrz cyklu wej/wyj (np. główny moduł), kolejność, w której występują oba timery są uruchamiane jest niedeterministyczna, ponieważ jest związana z wykonywaniem procesu:

```js
// timeout_vs_immediate.js
setTimeout(function timeout() {
  console.log('timeout');
}, 0);

setImmediate(function immediate() {
  console.log('immediate');
});
```

```console
$ node timeout_vs_immediate.js
timeout
immediate

$ node timeout_vs_immediate.js
immediate
timeout
```

Jednakże, jeśli przeniesiesz te dwa wywołania w ramach cyklu wej/wyj, natychmiastowe wywołanie zwrotne jest zawsze wykonywane jako pierwsze:

```js
// timeout_vs_immediate.js
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

```console
$ node timeout_vs_immediate.js
immediate
timeout

$ node timeout_vs_immediate.js
immediate
timeout
```

Główną zaletą korzystania z `ustawNatychmiastowo()`zamiast`ustawKoniecCzasu()` jest to, że `ustawNatychmiastowo()` zawsze będzie wykonywane przed jakimikolwiek timerami, jeśli są zaplanowane w obrębie cyklu wej/wyj, niezależnie od tego, ile obecnych jest timerów.

## `process.nextTick()`

### Zrozumienie `process.nextTick()`

Być może zauważyłeś, że `process.nextTick()` nie było wyświetlane w diagramie, mimo że jest częścią asynchronicznego API. To dlatego, że `process.nextTick()` nie jest techniczną częścią pętli zdarzeń. Zamiast tego, `nextTickQueue` będzie przetwarzane po zakończeniu bieżącej operacji, niezależnie od bieżącego etapu pętli zdarzeń.

Patrząc jeszcze raz na nasz diagram, za każdym razem, gdy wywołasz`process.nextTick()` w danej fazie, wszystkie wywołania zwrotne przypisane do `process.nextTick()` będą zdeterminowane przed kontynuacją pętli zdarzeń. Może to stworzyć pewne złe sytuacje, ponieważ **pozwala ci "głodować" swoje wej/wyj przez dokonywanie rekurencji w `process.nextTick()` wywołania**, co zapobiega pętli zdarzeń od osiągnięcia fazy **odpytywania**.

### Dlaczego miałoby to być dozwolone?

Dlaczego coś takiego powinno być zawarte w Node.js? Częścią tego jest filozofia projektowania, w której interfejs API powinien zawsze być asynchroniczny, nawet jeśli nie musi być. Weźmy na przykład ten fragment kodu:

```js
function apiCall(arg, callback) {
  if (typeof arg !== 'string')
    return process.nextTick(callback,
                            new TypeError('argument should be string'));
}
```

Fragment ten sprawdza argument, a jeśli nie jest poprawny, przejdzie do błędy wywołania zwrotnego. Interfejs API zaktualizowany dość niedawno, aby umożliwić przekazywanie argumentów do `process.nextTick()` pozwalając na przyjęcie dowolnych argumentów przekazanych po wywołaniu zwrotnym rozprzestrzenionym jako argumenty wywołania zwrotnego, dzięki czemu nie trzeba zagnieżdżać funkcji.

To, co robimy to przekazywanie błędu do użytkownika, ale tylko *po* tym jak pozwolimy na wykonanie reszty kodu użytkownika. Poprzez użycie `process.nextTick()` gwarantujemy, że `apiCall()` zawsze uruchomi jego wywołanie zwrotne *po* reszcie kodu użytkownika i *przed* dopuszczeniem zdarzenia pętli do nastąpienia. By to osiągnąć, wywołanie stosu JS jest dopuszczone do rozwinięcia, a następnie natychmiast wykonania podanego wywołania zwrotne, które umożliwia osoba wykonująca wywołania rekursywne wobec `process.nextTick()` bez osiągania `BłądZasięgu: Przekroczono maksymalny rozmiar stosu wywołań z wersji v8`.

Ta filozofia może prowadzić do potencjalnie problematycznych sytuacji. Weźmy na przykład ten fragment kodu:

```js
let bar;

// ma on sygnaturę asynchroniczną, ale wywołuje synchronicznie wywołanie zwrotne
function someAsyncApiCall(callback) { callback(); }

// wywołanie zwrotne jest wywoływane przed zakończeniem `someAsyncApiCall`.
someAsyncApiCall(() => {

  // ponieważ someAsyncApiCall został zakończony, bar nie ma przypisanej żadnej wartości
  console.log('bar', bar); // undefined

});

bar = 1;
```

Użytkownik definiuje `someAsyncApiCall()`, aby mieć sygnaturę asynchroniczną, ale tak naprawdę działa synchronicznie. When it is called, the callback provided to `someAsyncApiCall()` is called in the same phase of the event loop because `someAsyncApiCall()` doesn't actually do anything asynchronously. As a result, the callback tries to reference `bar` even though it may not have that variable in scope yet, because the script has not been able to run to completion.

By placing the callback in a `process.nextTick()`, the script still has the ability to run to completion, allowing all the variables, functions, etc., to be initialized prior to the callback being called. It also has the advantage of not allowing the event loop to continue. It may be useful for the user to be alerted to an error before the event loop is allowed to continue. Here is the previous example using `process.nextTick()`:

```js
let bar;

function someAsyncApiCall(callback) {
  process.nextTick(callback);
}

someAsyncApiCall(() => {
  console.log('bar', bar); // 1
});

bar = 1;
```

Here's another real world example:

```js
const server = net.createServer(() => {}).listen(8080);

server.on('listening', () => {});
```

When only a port is passed the port is bound immediately. So the `'listening'` callback could be called immediately. Problem is that the `.on('listening')` will not have been set by that time.

To get around this the `'listening'` event is queued in a `nextTick()` to allow the script to run to completion. Which allows the user to set any event handlers they want.

## `process.nextTick()` vs `setImmediate()`

We have two calls that are similar as far as users are concerned, but their names are confusing.

* `process.nextTick()` fires immediately on the same phase
* `setImmediate()` fires on the following iteration or 'tick' of the event loop

In essence, the names should be swapped. `process.nextTick()` fires more immediately than `setImmediate()` but this is an artifact of the past which is unlikely to change. Making this switch would break a large percentage of the packages on npm. Every day more new modules are being added, which mean every day we wait, more potential breakages occur. While they are confusing, the names themselves won't change.

*We recommend developers use `setImmediate()` in all cases because it's easier to reason about (and it leads to code that's compatible with a wider variety of environments, like browser JS.)*

## Why use `process.nextTick()`?

There are two main reasons:

1. Allow users to handle errors, cleanup any then unneeded resources, or perhaps try the request again before the event loop continues.

2. At times it's necessary to allow a callback to run after the call stack has unwound but before the event loop continues.

One example is to match the user's expectations. Simple example:

```js
const server = net.createServer();
server.on('connection', function(conn) { });

server.listen(8080);
server.on('listening', function() { });
```

Say that `listen()` is run at the beginning of the event loop, but the listening callback is placed in a `setImmediate()`. Now, unless a hostname is passed binding to the port will happen immediately. Now for the event loop to proceed it must hit the **poll** phase, which means there is a non-zero chance that a connection could have been received allowing the connection event to be fired before the listening event.

Another example is running a function constructor that was to, say, inherit from `EventEmitter` and it wanted to call an event within the constructor:

```js
const EventEmitter = require('events');
const util = require('util');

function MyEmitter() {
  EventEmitter.call(this);
  this.emit('event');
}
util.inherits(MyEmitter, EventEmitter);

const myEmitter = new MyEmitter();
myEmitter.on('event', function() {
  console.log('an event occurred!');
});
```

You can't emit an event from the constructor immediately because the script will not have processed to the point where the user assigns a callback to that event. So, within the constructor itself, you can use `process.nextTick()` to set a callback to emit the event after the constructor has finished, which provides the expected results:

```js
const EventEmitter = require('events');
const util = require('util');

function MyEmitter() {
  EventEmitter.call(this);

  // use nextTick to emit the event once a handler is assigned
  process.nextTick(function() {
    this.emit('event');
  }.bind(this));
}
util.inherits(MyEmitter, EventEmitter);

const myEmitter = new MyEmitter();
myEmitter.on('event', function() {
  console.log('an event occurred!');
});
```