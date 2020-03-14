# Ошибки

<!--introduced_in=v4.0.0-->
<!--type=misc-->

Приложения, запущенные в Node.js, обычно имеют четыре категории ошибок:

- Стандартные ошибки JavaScript, такие как:
  - {EvalError} : выводится, когда не удается вызов `eval()`.
  - {SyntaxError} : выводится в ответ на неправильный синтаксис языка JavaScript.
  - {RangeError} : выводится, когда значение не находится в ожидаемом диапазоне
  - {ReferenceError} : выводится при использовании неопределенных переменных
  - {TypeError} : выводится при передаче аргументов неверного типа
  - {URIError} : выводится при неправильном использовании глобальной функции обработки URI.
- Системные ошибки, вызванные ограничениями базовой ОС, такими как попытка открыть несуществующий файл, попытка отправить данные через закрытый сокет и т.д;
- И указанные пользователем ошибки, которые вызваны кодом приложения.
- Ошибки утверждения - это особый класс ошибки, который может вызываться всякий раз, когда Node.js обнаруживает исключительное логическое нарушение, которое никогда не должно происходить. Обычно они вызываются модулем `assert`.

Все ошибки JavaScript и системы, вызванные Node.js, наследуются или являются экземплярами стандартного класса JavaScript {Error} и гарантированно предоставляют *как минимум* свойства, доступные в этом классе.

## Распространение и перехват ошибок

<!--type=misc-->

Node.js поддерживает несколько механизмов для распространения и обработки ошибок, возникающих во время работы приложения. Способ отчета об этих ошибках и их обработки полностью зависит от типов ошибки и вызванного API.

Все ошибки JavaScript обрабатываются как исключения, которые *немедленно* генерируют и выводят ошибку с использованием стандартного механизма JavaScript `throw`. These are handled using the [`try / catch` construct](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch) provided by the JavaScript language.

```js
// Выводит с  ReferenceError, потому что z неопределеный
try {
  const m = 1;
  const n = m + z;
} catch (err) {
  // Обрабатываем ошибку здесь.
}
```

Любое использование механизма JavaScript `throw` приведет к исключению, которое *должно* обрабатываться с помощью `try / catch`, или процесс Node.js завершится немедленно.

За некоторыми исключениями _Синхронные_ API (любой метод блокировки, который не принимает функцию `callback`, такой как [`fs.readFileSync`][]) будут использовать `throw` для сообщения об ошибках.

Об ошибках, которые происходят в пределах _Асинхронных API_, может быть доложено несколькими способами:

- Большинство асинхронных методов, которые принимают функцию `callback`, примут объект `Error`, переданный этой функции в качестве первого аргумента. Если этот первый аргумент не равен `null` и является экземпляром `Error`, то произошла ошибка, которая должна быть обработана.
  ```js
  const fs = require('fs');
  fs.readFile('a file that does not exist', (err, data) => {
    if (err) {
      console.error('There was an error reading the file!', err);
      return;
    }
    // Otherwise handle the data
  });
  ```
- Когда асинхронный метод вызывается на объект, который является `EventEmitter`, ошибки могут направляться на событие `'error'` этого объекта.

  ```js
  const net = require('net');
  const connection = net.connect('localhost');

  // Adding an 'error' event handler to a stream:
  connection.on('error', (err) => {
    // If the connection is reset by the server, or if it can't
    // connect at all, or on any sort of error encountered by
    // the connection, the error will be sent here.
    console.error(err);
  });

  connection.pipe(process.stdout);
  ```

- Некоторое количество асинхронных методов в API Node.js все еще могут использовать механизм `throw` для вызова исключений, которые должны быть обработаны с помощью `try / catch`. Нет полного списка подобных методов; пожалуйста, обратитесь к документации каждого метода для определения необходимого механизма обработки ошибок.

Использование механизма события `'error'` наиболее распространено для API [stream-based](stream.html) и [event emitter-based](events.html#events_class_eventemitter), которые представляют собой серию асинхронных операций во времени (в противоположность одиночной операции, которая может получиться или потерпеть неудачу).

For *all* `EventEmitter` objects, if an `'error'` event handler is not provided, the error will be thrown, causing the Node.js process to report an unhandled exception and crash unless either: The [`domain`](domain.html) module is used appropriately or a handler has been registered for the [`process.on('uncaughtException')`][] event.

```js
const EventEmitter = require('events');
const ee = new EventEmitter();

setImmediate(() => {
  // Это приведет к сбою процесса, потому что
  // обработчик события "error" не был добавлен.
  ee.emit('error', new Error("Это потерпит неудачу"));
});
```

Errors generated in this way *cannot* be intercepted using `try / catch` as they are thrown *after* the calling code has already exited.

Разработчики должны обратиться к документации по каждому методу, чтобы точно определить, как распространяются ошибки, вызванные этими методами.

### Error-first callbacks<!--type=misc-->Most asynchronous methods exposed by the Node.js core API follow an idiomatic pattern referred to as an _error-first callback_ (sometimes referred to as a _Node.js style callback_). With this pattern, a callback function is passed to the method as an argument. When the operation either completes or an error is raised, the callback function is called with the Error object (if any) passed as the first argument. If no error was raised, the first argument will be passed as `null`.

```js
const fs = require('fs');

function errorFirstCallback(err, data) {
  if (err) {
    console.error('There was an error', err);
    return;
  }
  console.log(data);
}

fs.readFile('/some/file/that/does-not-exist', errorFirstCallback);
fs.readFile('/some/file/that/does-exist', errorFirstCallback);
```

Механизм JavaScript `try / catch` **не может** быть использован для перехвата ошибок, созданных с помощью асинхронных API. A common mistake for beginners is to try to use `throw` inside an error-first callback:

```js
// ЭТО НЕ БУДЕТ РАБОТАТЬ:
const fs = require('fs');

try {
  fs.readFile("/некий/файл/который/не-существует", (err, data) => {
    // ошибочное предположение: выводится здесь...
    if (err) {
      throw err;
    }
  });
} catch (err) {
  // Это не поймает вывод ошибки!
  console.error(err);
}
```

Это не будет работать, потому что функция обратного вызова, переданная `fs.readFile()`, вызывается асинхронно. К моменту вызова функции обратного вызова окружающий код (включая блок `try { } catch (err) { }`) уже будет завершен. Вывод ошибки внутри функции обратного вызова **может вызвать сбой процесса Node.js** в большинстве случаев. Если [домены](domain.html) включены или обработчик зарегистрирован с `process.on('uncaughtException')`, такие ошибки можно перехватить.

## Класс: Error<!--type=class-->Общий объект JavaScript `Error`, который не указывает на какое-либо конкретное обстоятельство, почему произошла ошибка. Объекты `Error` фиксируют «трассировку стека», детализируя точку в коде, в которой был создан экземпляр `Error`, и могут предоставлять текстовое описание ошибки.

For crypto only, `Error` objects will include the OpenSSL error stack in a separate property called `opensslErrorStack` if it is available when the error is thrown.

Все ошибки, сгенерированные Node.js, включая все системные ошибки и ошибки JavaScript, будут либо экземплярами класса `Error`, либо наследоваться от него.

### new Error(message)

* `message` {string}

Создает новый объект `Error` и устанавливает свойство `error.message` в предоставленное текстовое сообщение. Если объект передается как `message`, текстовое сообщение генерируется с помощью вызова `message.toString()`. Свойство `error.stack` будет представлять точку в коде, в которой был вызван `new Error()`. Трассировки стека зависят от [трассировка стека API V8](https://github.com/v8/v8/wiki/Stack-Trace-API). Трассировки стека распространяются только либо (а) на начало *выполнения синхронного кода*, либо (б) на количество кадров, заданных свойством `Error.stackTraceLimit`, в зависимости от того, что имеет меньшее значение.

### Error.captureStackTrace(targetObject[, constructorOpt])

* `targetObject` {Object}
* `constructorOpt` {Function}

Создает свойство `.stack` в `targetObject`, которое при успешном допуске возвращает строку, представляющую положение в коде, где был вызван `Error.captureStackTrace()`.

```js
const myObject = {};
Error.captureStackTrace(myObject);
myObject.stack;  // похоже на "new Error().stack"
```

The first line of the trace will be prefixed with `${myObject.name}: ${myObject.message}`.

Опциональный аргумент `constructorOpt` принимает функцию. Если это предусмотрено, все кадры выше `constructorOpt`, включая `constructorOpt`, будут исключены из сгенерированной трассировки стека.

Аргумент `constructorOpt` полезен для сокрытия деталей реализации от конечного пользователя. Например:

```js
function MyError() {
  Error.captureStackTrace(this, MyError);
}

// Без передачи MyError в captureStackTrace, кадр MyError
// будет отображаться в свойстве .stack. Передавая
// конструктор мы пропускаем этот кадр и сохраняем все кадры под ним.
new MyError().stack;
```

### Error.stackTraceLimit

* {number}

Свойство `Error.stackTraceLimit` указывает количество кадров стека, собранных трассировкой стека (независимо от того, были ли они сгенерированы с помощью `new Error().stack` или `Error.captureStackTrace(obj)`).

Значение по умолчанию - `10`, но может быть установлено любое число, допустимое JavaScript. Изменения повлияют на любую трассировку стека, полученную *после* изменения значения.

Если установлено значение без числа или число с отрицательным значением, трассировка стека не будет захватывать никакие кадры.

### error.code

* {string}

The `error.code` property is a string label that identifies the kind of error. See [Node.js Error Codes](#nodejs-error-codes) for details about specific codes.

### error.message

* {string}

The `error.message` property is the string description of the error as set by calling `new Error(message)`. The `message` passed to the constructor will also appear in the first line of the stack trace of the `Error`, however changing this property after the `Error` object is created *may not* change the first line of the stack trace (for example, when `error.stack` is read before this property is changed).

```js
const err = new Error('The message');
console.error(err.message);
// Печатает: The message
```

### error.stack

* {string}

Свойство `error.stack` является строковым описанием точки в коде, где был создан `Error`.

Например:

```txt
Ошибка: Вещи продолжают происходить!
   в /доме/gbusey/file.js:525:2
   в Frobnicator.refrobulate (/дом/gbusey/business-logic.js:424:21)
   в Actor.<anonymous> (/дом/gbusey/actors.js:400:8)
   в increaseSynergy (/дом/gbusey/actors.js:701:6)
```

Первая строка форматируется как `<error class name>: <error message>` и сопровождается серией кадров стека (каждая строка начинается с "в"). Каждый кадр описывает точку вызова в коде, которая приводит к генерации ошибки. V8 пытается отобразить имя каждой функции (по имени переменной, имени функции или имени объекта метода), но иногда он не может найти подходящее имя. Если V8 не может определить имя для функции, для этого кадра будет отображаться только информация о местоположении. В противном случае имя определенной функции будет отображаться в скобках вместе с информацией о местоположении.

Frames are only generated for JavaScript functions. If, for example, execution synchronously passes through a C++ addon function called `cheetahify` which itself calls a JavaScript function, the frame representing the `cheetahify` call will not be present in the stack traces:

```js
const cheetahify = require('./native-binding.node');

function makeFaster() {
  // cheetahify *синхронно* вызывает speedy.
  cheetahify(function speedy() {
    throw new Error('oh no!');
  });
}

makeFaster();
// will throw:
//   /home/gbusey/file.js:6
//       throw new Error('oh no!');
//           ^
//   Error: oh no!
//       at speedy (/home/gbusey/file.js:6:11)
//       at makeFaster (/home/gbusey/file.js:5:3)
//       at Object.<anonymous> (/home/gbusey/file.js:10:1)
//       at Module._compile (module.js:456:26)
//       at Object.Module._extensions..js (module.js:474:10)
//       at Module.load (module.js:356:32)
//       at Function.Module._load (module.js:312:12)
//       at Function.Module.runMain (module.js:497:10)
//       at startup (node.js:119:16)
//       at node.js:906:3
```

Сведение о местоположении будет одним из:

* `native`, если кадр представляет внутренний вызов V8 (как в `[].forEach`).
* `plain-filename.js:line:column`, если кадр представляет внутренний вызов Node.js.
* `/absolute/path/to/file.js:line:column`, если кадр представляет вызов в пользовательской программе или ее зависимостях.

Строка, представляющая трассировку стека, генерируется, если свойство `error.stack` имеет **доступ**.

Количество кадров, захваченных трассировкой стека, ограничено меньшим из `Error.stackTraceLimit` или количеством доступных кадров в текущем моменте цикла событий.

Ошибки системного уровня генерируются как расширенные экземпляры `Error`, которые детально описаны [здесь](#errors_system_errors).

## Class: AssertionError

Подкласс `Ошибки` указывает на ошибку реализации. Such errors commonly indicate inequality of actual and expected value.

Например:

```js
assert.strictEqual(1, 2);
// AssertionError [ERR_ASSERTION]: 1 === 2
```

## Класс: RangeError

Подкласс `Error`, который указывает, что предоставленный аргумент вне настроек или диапазона приемлемых значений для функции; либо он не находится в допустимом числовом диапазоне, либо находится за пределами настроек опций для данного параметра функции.

Например:

```js
require('net').connect(-1);
// выводит "RangeError: опция "port" должна быть >= 0 and < 65536: -1"
```

Node.js сгенерирует и выведет экземпляры `RangeError` *немедленно* в качестве формы проверки аргумента.

## Класс: ReferenceError

Подкласс `Error`, указывающий на наличие попытки доступа к переменной, которая не определена. Такие ошибки обычно указывают на опечатки в коде или другую неработающую программу.

Хотя код клиента может генерировать и распространять эти ошибки, на практике это будет делать только V8.

```js
doesNotExist;
// выводит ReferenceError, doesNotExist не является переменной в этой программе.
```

Пока приложение не будет динамически генерировать и запускать код, экземпляры `ReferenceError` всегда нужно рассматривать как ошибку в коде или его зависимостях.

## Класс: SyntaxError

Подкласс `Error`, который указывает, что программа является недопустимой JavaScript. Эти ошибки могут генерироваться и распространяться только в результате оценки кода. Оценка кода может произойти в результате `eval`, `Function`, `require` или [vm](vm.html). Эти ошибки почти всегда указывают на неправильно работающую программу.

```js
try {
  require('vm').runInThisContext('binary ! isNotOk');
} catch (err) {
  // err будет являться SyntaxError
}
```

Экземпляры `SyntaxError` не могут быть исправлены в контексте, который их создал; они могут быть обнаружены только в других контекстах.

## Класс: TypeError

Подкласс `Error`, который указывает, что предоставленный аргумент имеет недопустимый тип. Например, передача функции параметру, который ожидает строку, будет считаться TypeError.

```js
require('url').parse(() => { });
// выдает TypeError, потому что ожидалась строка
```

Node.js *немедленно* сгенерирует и выдаст экземпляры `TypeError` как форму проверки аргумента.

## Исключения и Ошибки<!--type=misc-->Исключение JavaScript - это значение, которое выводится как результат некорректной операции или как цель выражения `throw`. Пока не требуется, чтобы эти значения были экземплярами `Error` или классами, которые наследуются от `Error`, все исключения, выданные Node.js или средой выполнения JavaScript, *будут* экземплярами Error.

Некоторые исключения являются *невосстанавливаемыми* в слое JavaScript. Такие исключения *всегда* будут вызывать сбой процесса Node.js. Примеры включают проверки `assert()` или вызовы `abort()` в слое C++.

## Системные ошибки

Системные ошибки генерируются, когда возникают исключения в среде выполнения программы. Обычно это операционные ошибки, возникающие, когда приложение нарушает ограничения ОС, например, пытается прочитать файл, который не существует, или при отсутствии у пользователя достаточных прав.

Системные ошибки обычно генерируются на уровне системных вызовов: подробный список кодов ошибок и их значений доступны [online](http://man7.org/linux/man-pages/man3/errno.3.html) или с помощью запуска `man 2 intro` или `man 3 errno` в большинстве Unix-системах.

Системные ошибки в Node.js представлены как дополнительные объекты `Error` с добавленными свойствами.

### Класс: Системная ошибка

#### error.code

* {string}

The `error.code` property is a string representing the error code, which is typically `E` followed by a sequence of capital letters.

#### error.errno

* {string|number}

Свойство `error.errno` является числом или строкой. The number is a **negative** value which corresponds to the error code defined in [`libuv Error handling`]. See uv-errno.h header file (`deps/uv/include/uv-errno.h` in the Node.js source tree) for details. In case of a string, it is the same as `error.code`.

#### error.syscall

* {string}

Свойство `error.syscall` является строкой, которая описывает неудавшийся [системный вызов](http://man7.org/linux/man-pages/man2/syscall.2.html).

#### error.path

* {string}

When present (e.g. in `fs` or `child_process`), the `error.path` property is a string containing a relevant invalid pathname.

#### error.address

* {string}

When present (e.g. in `net` or `dgram`), the `error.address` property is a string describing the address to which the connection failed.

#### error.port

* {number}

When present (e.g. in `net` or `dgram`), the `error.port` property is a number representing the connection's port that is not available.

### Основные системные ошибки

Это далеко **не полный** список, но он содержит много основных системных ошибок, которые возникли при написании программы Node.js. Полный список можно найти [здесь](http://man7.org/linux/man-pages/man3/errno.3.html).

- `EACCES` (В доступе отказано): Попытка получить доступ к файлу способом, который был запрещен правами доступа к файлу.

- `EADDRINUSE` (Адрес уже используется): Попытка привязать сервер ([`net`][], [`http`][] или [`https`][]) к локальному адресу не удалась, потому что другой сервер в локальной системе уже занимает этот адрес.

- `ECONNREFUSED` (В соединении отказано): Не удалось установить соединение, так как целевой компьютер его активно отклоняет. Обычно это является результатом попытки подключиться к неактивному сервису на чужом хосте.

- `ECONNRESET` (Соединение сброшено пиром): Соединение было принудительно закрыто пиром. Обычно это является результатом потери соединения на удаленном сокете из-за тайм-аута или перезагрузки. Обычно встречается на модулях [`http`][] и [`net`][].

- `EEXIST` (Файл существует): В результате операции, которая требовала, чтобы цель не существовала, был получен существующий файл.

- `EISDIR` (Является каталогом): Операция ожидала файл, но указанный путь был путем к каталогу.

- `EMFILE` (Слишком много открытых файлов в системе): Достигнуто максимальное количество [файловых дескрипторов](https://en.wikipedia.org/wiki/File_descriptor), допустимых в системе, и запросы к другому дескриптору не могут быть выполнены, пока не будет закрыт хотя бы один. Это встречается при открытии большого количества файлов одновременно, особенно в системах (в частности, в macOS), где для процессов существует низкий лимит файлового дескриптора. Чтобы изменить лимит, запустите `ulimit -n 2048` в той же оболочке, в которой будет запущен процесс Node.js.

- `ENOENT` (Нет такого файла или каталога): Обычно возникает вследствие операций [`fs`][], чтобы указать на отсутствие компонента по указанному пути - объект (файл или каталог) не могут быть найдены по заданному пути.

- `ENOTDIR` (Не является каталогом): Компонент заданного пути существует, но не является каталогом, как ожидалось. Обычно вызывается [`fs.readdir`][].

- `ENOTEMPTY` (Каталог не является пустым): Целью операции был пустой каталог, а был получен каталог с записями. Обычно [`fs.unlink`][].

- `EPERM` (Операция не разрешена): Была предпринята попытка выполнить операцию, которая требует особых прав на доступ.

- `EPIPE` (Проблемы с каналом): Запись в канал, сокет или FIFO, где нет процесса для чтения данных. Чаще встречается в слоях [`net`][] и [`http`][], показывая, что удаленная сторона потока, в котором идет запись, закрыта.

- `ETIMEDOUT` (Время выполнения операции истекло): Не удалось выполнить подключение или запрос на отправку, потому что сторона, к которой идет подключение, не ответила должным образом через определенный период времени. Обычно встречается в [`http`][] или [`net`][]. Чаще всего является признаком неправильного вызова `socket.end()`.

<a id="nodejs-error-codes"></a>

## Node.js Error Codes

<a id="ERR_ARG_NOT_ITERABLE"></a>

### ERR_ARG_NOT_ITERABLE

An iterable argument (i.e. a value that works with `for...of` loops) was required, but not provided to a Node.js API.

<a id="ERR_ASYNC_CALLBACK"></a>

### ERR_ASYNC_CALLBACK

An attempt was made to register something that is not a function as an `AsyncHooks` callback.

<a id="ERR_ASYNC_TYPE"></a>

### ERR_ASYNC_TYPE

The type of an asynchronous resource was invalid. Note that users are also able to define their own types if using the public embedder API.

<a id="ERR_ENCODING_INVALID_ENCODED_DATA"></a>

### ERR_ENCODING_INVALID_ENCODED_DATA

Data provided to `util.TextDecoder()` API was invalid according to the encoding provided.

<a id="ERR_ENCODING_NOT_SUPPORTED"></a>

### ERR_ENCODING_NOT_SUPPORTED

Encoding provided to `util.TextDecoder()` API was not one of the [WHATWG Supported Encodings](util.md#whatwg-supported-encodings).

<a id="ERR_FALSY_VALUE_REJECTION"></a>

### ERR_FALSY_VALUE_REJECTION

A `Promise` that was callbackified via `util.callbackify()` was rejected with a falsy value.

<a id="ERR_HTTP_HEADERS_SENT"></a>

### ERR_HTTP_HEADERS_SENT

An attempt was made to add more headers after the headers had already been sent.

<a id="ERR_HTTP_INVALID_CHAR"></a>

### ERR_HTTP_INVALID_CHAR

An invalid character was found in an HTTP response status message (reason phrase).

<a id="ERR_HTTP_INVALID_STATUS_CODE"></a>

### ERR_HTTP_INVALID_STATUS_CODE

Status code was outside the regular status code range (100-999).

<a id="ERR_HTTP_TRAILER_INVALID"></a>

### ERR_HTTP_TRAILER_INVALID

The `Trailer` header was set even though the transfer encoding does not support that.

<a id="ERR_HTTP2_ALREADY_SHUTDOWN"></a>

### ERR_HTTP2_ALREADY_SHUTDOWN

Occurs with multiple attempts to shutdown an HTTP/2 session.

<a id="ERR_HTTP2_ALTSVC_INVALID_ORIGIN"></a>

### ERR_HTTP2_ALTSVC_INVALID_ORIGIN

HTTP/2 ALTSVC frames require a valid origin.

<a id="ERR_HTTP2_ALTSVC_LENGTH"></a>

### ERR_HTTP2_ALTSVC_LENGTH

HTTP/2 ALTSVC frames are limited to a maximum of 16,382 payload bytes.

<a id="ERR_HTTP2_CONNECT_AUTHORITY"></a>

### ERR_HTTP2_CONNECT_AUTHORITY

For HTTP/2 requests using the `CONNECT` method, the `:authority` pseudo-header is required.

<a id="ERR_HTTP2_CONNECT_PATH"></a>

### ERR_HTTP2_CONNECT_PATH

For HTTP/2 requests using the `CONNECT` method, the `:path` pseudo-header is forbidden.

<a id="ERR_HTTP2_CONNECT_SCHEME"></a>

### ERR_HTTP2_CONNECT_SCHEME

For HTTP/2 requests using the `CONNECT` method, the `:scheme` pseudo-header is forbidden.

<a id="ERR_HTTP2_FRAME_ERROR"></a>

### ERR_HTTP2_FRAME_ERROR

A failure occurred sending an individual frame on the HTTP/2 session.

<a id="ERR_HTTP2_GOAWAY_SESSION"></a>

### ERR_HTTP2_GOAWAY_SESSION

New HTTP/2 Streams may not be opened after the `Http2Session` has received a `GOAWAY` frame from the connected peer.

<a id="ERR_HTTP2_HEADER_REQUIRED"></a>

### ERR_HTTP2_HEADER_REQUIRED

A required header was missing in an HTTP/2 message.

<a id="ERR_HTTP2_HEADER_SINGLE_VALUE"></a>

### ERR_HTTP2_HEADER_SINGLE_VALUE

Multiple values were provided for an HTTP/2 header field that was required to have only a single value.

<a id="ERR_HTTP2_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_HEADERS_AFTER_RESPOND

An additional headers was specified after an HTTP/2 response was initiated.

<a id="ERR_HTTP2_HEADERS_OBJECT"></a>

### ERR_HTTP2_HEADERS_OBJECT

An HTTP/2 Headers Object was expected.

<a id="ERR_HTTP2_HEADERS_SENT"></a>

### ERR_HTTP2_HEADERS_SENT

An attempt was made to send multiple response headers.

<a id="ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND"></a>

### ERR_HTTP2_INFO_HEADERS_AFTER_RESPOND

HTTP/2 Informational headers must only be sent *prior* to calling the `Http2Stream.prototype.respond()` method.

<a id="ERR_HTTP2_INFO_STATUS_NOT_ALLOWED"></a>

### ERR_HTTP2_INFO_STATUS_NOT_ALLOWED

Informational HTTP status codes (`1xx`) may not be set as the response status code on HTTP/2 responses.

<a id="ERR_HTTP2_INVALID_CONNECTION_HEADERS"></a>

### ERR_HTTP2_INVALID_CONNECTION_HEADERS

HTTP/1 connection specific headers are forbidden to be used in HTTP/2 requests and responses.

<a id="ERR_HTTP2_INVALID_HEADER_VALUE"></a>

### ERR_HTTP2_INVALID_HEADER_VALUE

An invalid HTTP/2 header value was specified.

<a id="ERR_HTTP2_INVALID_INFO_STATUS"></a>

### ERR_HTTP2_INVALID_INFO_STATUS

An invalid HTTP informational status code has been specified. Informational status codes must be an integer between `100` and `199` (inclusive).

<a id="ERR_HTTP2_INVALID_ORIGIN"></a>

### ERR_HTTP2_INVALID_ORIGIN

HTTP/2 `ORIGIN` frames require a valid origin.

<a id="ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH"></a>

### ERR_HTTP2_INVALID_PACKED_SETTINGS_LENGTH

Input `Buffer` and `Uint8Array` instances passed to the `http2.getUnpackedSettings()` API must have a length that is a multiple of six.

<a id="ERR_HTTP2_INVALID_PSEUDOHEADER"></a>

### ERR_HTTP2_INVALID_PSEUDOHEADER

Only valid HTTP/2 pseudoheaders (`:status`, `:path`, `:authority`, `:scheme`, and `:method`) may be used.

<a id="ERR_HTTP2_INVALID_SESSION"></a>

### ERR_HTTP2_INVALID_SESSION

An action was performed on an `Http2Session` object that had already been destroyed.

<a id="ERR_HTTP2_INVALID_SETTING_VALUE"></a>

### ERR_HTTP2_INVALID_SETTING_VALUE

An invalid value has been specified for an HTTP/2 setting.

<a id="ERR_HTTP2_INVALID_STREAM"></a>

### ERR_HTTP2_INVALID_STREAM

An operation was performed on a stream that had already been destroyed.

<a id="ERR_HTTP2_MAX_PENDING_SETTINGS_ACK"></a>

### ERR_HTTP2_MAX_PENDING_SETTINGS_ACK

Whenever an HTTP/2 `SETTINGS` frame is sent to a connected peer, the peer is required to send an acknowledgment that it has received and applied the new `SETTINGS`. By default, a maximum number of unacknowledged `SETTINGS` frames may be sent at any given time. This error code is used when that limit has been reached.

<a id="ERR_HTTP2_NESTED_PUSH"></a>

### ERR_HTTP2_NESTED_PUSH

An attempt was made to initiate a new push stream from within a push stream. Nested push streams are not permitted.

<a id="ERR_HTTP2_NO_SOCKET_MANIPULATION"></a>

### ERR_HTTP2_NO_SOCKET_MANIPULATION

An attempt was made to directly manipulate (read, write, pause, resume, etc.) a socket attached to an `Http2Session`.

<a id="ERR_HTTP2_ORIGIN_LENGTH"></a>

### ERR_HTTP2_ORIGIN_LENGTH

HTTP/2 `ORIGIN` frames are limited to a length of 16382 bytes.

<a id="ERR_HTTP2_OUT_OF_STREAMS"></a>

### ERR_HTTP2_OUT_OF_STREAMS

The number of streams created on a single HTTP/2 session reached the maximum limit.

<a id="ERR_HTTP2_PAYLOAD_FORBIDDEN"></a>

### ERR_HTTP2_PAYLOAD_FORBIDDEN

A message payload was specified for an HTTP response code for which a payload is forbidden.

<a id="ERR_HTTP2_PING_CANCEL"></a>

### ERR_HTTP2_PING_CANCEL

An HTTP/2 ping was canceled.

<a id="ERR_HTTP2_PING_LENGTH"></a>

### ERR_HTTP2_PING_LENGTH

HTTP/2 ping payloads must be exactly 8 bytes in length.

<a id="ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED"></a>

### ERR_HTTP2_PSEUDOHEADER_NOT_ALLOWED

An HTTP/2 pseudo-header has been used inappropriately. Pseudo-headers are header key names that begin with the `:` prefix.

<a id="ERR_HTTP2_PUSH_DISABLED"></a>

### ERR_HTTP2_PUSH_DISABLED

An attempt was made to create a push stream, which had been disabled by the client.

<a id="ERR_HTTP2_SEND_FILE"></a>

### ERR_HTTP2_SEND_FILE

An attempt was made to use the `Http2Stream.prototype.responseWithFile()` API to send something other than a regular file.

<a id="ERR_HTTP2_SESSION_ERROR"></a>

### ERR_HTTP2_SESSION_ERROR

The `Http2Session` closed with a non-zero error code.

<a id="ERR_HTTP2_SETTINGS_CANCEL"></a>

### ERR_HTTP2_SETTINGS_CANCEL

The `Http2Session` settings canceled.

<a id="ERR_HTTP2_SOCKET_BOUND"></a>

### ERR_HTTP2_SOCKET_BOUND

An attempt was made to connect a `Http2Session` object to a `net.Socket` or `tls.TLSSocket` that had already been bound to another `Http2Session` object.

<a id="ERR_HTTP2_SOCKET_UNBOUND"></a>

### ERR_HTTP2_SOCKET_UNBOUND

An attempt was made to use the `socket` property of an `Http2Session` that has already been closed.

<a id="ERR_HTTP2_STATUS_101"></a>

### ERR_HTTP2_STATUS_101

Use of the `101` Informational status code is forbidden in HTTP/2.

<a id="ERR_HTTP2_STATUS_INVALID"></a>

### ERR_HTTP2_STATUS_INVALID

An invalid HTTP status code has been specified. Status codes must be an integer between `100` and `599` (inclusive).

<a id="ERR_HTTP2_STREAM_CANCEL"></a>

### ERR_HTTP2_STREAM_CANCEL

An `Http2Stream` was destroyed before any data was transmitted to the connected peer.

<a id="ERR_HTTP2_STREAM_ERROR"></a>

### ERR_HTTP2_STREAM_ERROR

A non-zero error code was been specified in an `RST_STREAM` frame.

<a id="ERR_HTTP2_STREAM_SELF_DEPENDENCY"></a>

### ERR_HTTP2_STREAM_SELF_DEPENDENCY

When setting the priority for an HTTP/2 stream, the stream may be marked as a dependency for a parent stream. This error code is used when an attempt is made to mark a stream and dependent of itself.

<a id="ERR_HTTP2_TRAILERS_ALREADY_SENT"></a>

### ERR_HTTP2_TRAILERS_ALREADY_SENT

Trailing headers have already been sent on the `Http2Stream`.

<a id="ERR_HTTP2_TRAILERS_NOT_READY"></a>

### ERR_HTTP2_TRAILERS_NOT_READY

The `http2stream.sendTrailers()` method cannot be called until after the `'wantTrailers'` event is emitted on an `Http2Stream` object. The `'wantTrailers'` event will only be emitted if the `waitForTrailers` option is set for the `Http2Stream`.

<a id="ERR_HTTP2_UNSUPPORTED_PROTOCOL"></a>

### ERR_HTTP2_UNSUPPORTED_PROTOCOL

`http2.connect()` was passed a URL that uses any protocol other than `http:` or `https:`.

<a id="ERR_INDEX_OUT_OF_RANGE"></a>

### ERR_INDEX_OUT_OF_RANGE

A given index was out of the accepted range (e.g. negative offsets).

<a id="ERR_INVALID_ARG_TYPE"></a>

### ERR_INVALID_ARG_TYPE

An argument of the wrong type was passed to a Node.js API.

<a id="ERR_INVALID_ASYNC_ID"></a>

### ERR_INVALID_ASYNC_ID

An invalid `asyncId` or `triggerAsyncId` was passed using `AsyncHooks`. An id less than -1 should never happen.

<a id="ERR_INVALID_CALLBACK"></a>

### ERR_INVALID_CALLBACK

A callback function was required but was not been provided to a Node.js API.

<a id="ERR_INVALID_FILE_URL_HOST"></a>

### ERR_INVALID_FILE_URL_HOST

A Node.js API that consumes `file:` URLs (such as certain functions in the [`fs`][] module) encountered a file URL with an incompatible host. This situation can only occur on Unix-like systems where only `localhost` or an empty host is supported.

<a id="ERR_INVALID_FILE_URL_PATH"></a>

### ERR_INVALID_FILE_URL_PATH

A Node.js API that consumes `file:` URLs (such as certain functions in the [`fs`][] module) encountered a file URL with an incompatible path. The exact semantics for determining whether a path can be used is platform-dependent.

<a id="ERR_INVALID_HANDLE_TYPE"></a>

### ERR_INVALID_HANDLE_TYPE

An attempt was made to send an unsupported "handle" over an IPC communication channel to a child process. See [`subprocess.send()`] and [`process.send()`] for more information.

<a id="ERR_INVALID_OPT_VALUE"></a>

### ERR_INVALID_OPT_VALUE

An invalid or unexpected value was passed in an options object.

<a id="ERR_INVALID_PERFORMANCE_MARK"></a>

### ERR_INVALID_PERFORMANCE_MARK

While using the Performance Timing API (`perf_hooks`), a performance mark is invalid.

<a id="ERR_INVALID_PROTOCOL"></a>

### ERR_INVALID_PROTOCOL

An invalid `options.protocol` was passed.

<a id="ERR_INVALID_SYNC_FORK_INPUT"></a>

### ERR_INVALID_SYNC_FORK_INPUT

A `Buffer`, `Uint8Array` or `string` was provided as stdio input to a synchronous fork. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_INVALID_THIS"></a>

### ERR_INVALID_THIS

A Node.js API function was called with an incompatible `this` value.

Пример:

```js
const { URLSearchParams } = require('url');
const urlSearchParams = new URLSearchParams('foo=bar&baz=new');

const buf = Buffer.alloc(1);
urlSearchParams.has.call(buf, 'foo');
// Throws a TypeError with code 'ERR_INVALID_THIS'
```

<a id="ERR_INVALID_TUPLE"></a>

### ERR_INVALID_TUPLE

An element in the `iterable` provided to the [WHATWG](url.html#url_the_whatwg_url_api) [`URLSearchParams` constructor][`new URLSearchParams(iterable)`] did not represent a `[name, value]` tuple – that is, if an element is not iterable, or does not consist of exactly two elements.

<a id="ERR_INVALID_URL"></a>

### ERR_INVALID_URL

An invalid URL was passed to the [WHATWG](url.html#url_the_whatwg_url_api) [`URL` constructor][`new URL(input)`] to be parsed. The thrown error object typically has an additional property `'input'` that contains the URL that failed to parse.

<a id="ERR_INVALID_URL_SCHEME"></a>

### ERR_INVALID_URL_SCHEME

An attempt was made to use a URL of an incompatible scheme (protocol) for a specific purpose. It is only used in the [WHATWG URL API](url.html#url_the_whatwg_url_api) support in the [`fs`][] module (which only accepts URLs with `'file'` scheme), but may be used in other Node.js APIs as well in the future.

<a id="ERR_IPC_CHANNEL_CLOSED"></a>

### ERR_IPC_CHANNEL_CLOSED

An attempt was made to use an IPC communication channel that was already closed.

<a id="ERR_IPC_DISCONNECTED"></a>

### ERR_IPC_DISCONNECTED

An attempt was made to disconnect an IPC communication channel that was already disconnected. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_ONE_PIPE"></a>

### ERR_IPC_ONE_PIPE

An attempt was made to create a child Node.js process using more than one IPC communication channel. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_IPC_SYNC_FORK"></a>

### ERR_IPC_SYNC_FORK

An attempt was made to open an IPC communication channel with a synchronously forked Node.js process. See the documentation for the [`child_process`](child_process.html) module for more information.

<a id="ERR_MISSING_ARGS"></a>

### ERR_MISSING_ARGS

A required argument of a Node.js API was not passed. This is only used for strict compliance with the API specification (which in some cases may accept `func(undefined)` but not `func()`). In most native Node.js APIs, `func(undefined)` and `func()` are treated identically, and the [`ERR_INVALID_ARG_TYPE`][] error code may be used instead.

<a id="ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK"></a>

### ERR_MISSING_DYNAMIC_INSTANTIATE_HOOK

> Стабильность: 1 - экспериментальный

Used when an \[ES6 module\]\[\] loader hook specifies `format: 'dynamic` but does not provide a `dynamicInstantiate` hook.

<a id="ERR_MISSING_MODULE"></a>

### ERR_MISSING_MODULE

> Стабильность: 1 - экспериментальный

Used when an \[ES6 module\]\[\] cannot be resolved.

<a id="ERR_MODULE_RESOLUTION_LEGACY"></a>

### ERR_MODULE_RESOLUTION_LEGACY

> Стабильность: 1 - экспериментальный

Used when a failure occurred resolving imports in an \[ES6 module\]\[\].

<a id="ERR_MULTIPLE_CALLBACK"></a>

### ERR_MULTIPLE_CALLBACK

A callback was called more than once.

*Note*: A callback is almost always meant to only be called once as the query can either be fulfilled or rejected but not both at the same time. The latter would be possible by calling a callback more than once.

<a id="ERR_NAPI_CONS_FUNCTION"></a>

### ERR_NAPI_CONS_FUNCTION

While using `N-API`, a constructor passed was not a function.

<a id="ERR_NAPI_CONS_PROTOTYPE_OBJECT"></a>

### ERR_NAPI_CONS_PROTOTYPE_OBJECT

While using `N-API`, `Constructor.prototype` was not an object.

<a id="ERR_NAPI_INVALID_DATAVIEW_ARGS"></a>

### ERR_NAPI_INVALID_DATAVIEW_ARGS

While calling `napi_create_dataview()`, a given `offset` was outside the bounds of the dataview or `offset + length` was larger than a length of given `buffer`.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_ALIGNMENT

While calling `napi_create_typedarray()`, the provided `offset` was not a multiple of the element size.

<a id="ERR_NAPI_INVALID_TYPEDARRAY_LENGTH"></a>

### ERR_NAPI_INVALID_TYPEDARRAY_LENGTH

While calling `napi_create_typedarray()`, `(length * size_of_element) +
byte_offset` was larger than the length of given `buffer`.

<a id="ERR_NAPI_TSFN_CALL_JS"></a>

### ERR_NAPI_TSFN_CALL_JS

An error occurred while invoking the JavaScript portion of the thread-safe function.

<a id="ERR_NAPI_TSFN_GET_UNDEFINED"></a>

### ERR_NAPI_TSFN_GET_UNDEFINED

An error occurred while attempting to retrieve the JavaScript `undefined` value.

<a id="ERR_NAPI_TSFN_START_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_START_IDLE_LOOP

On the main thread, values are removed from the queue associated with the thread-safe function in an idle loop. This error indicates that an error has occurred when attemping to start the loop.

<a id="ERR_NAPI_TSFN_STOP_IDLE_LOOP"></a>

### ERR_NAPI_TSFN_STOP_IDLE_LOOP

Once no more items are left in the queue, the idle loop must be suspended. This error indicates that the idle loop has failed to stop.

<a id="ERR_NO_ICU"></a>

### ERR_NO_ICU

An attempt was made to use features that require [ICU](intl.html#intl_internationalization_support), but Node.js was not compiled with ICU support.

<a id="ERR_SOCKET_ALREADY_BOUND"></a>

### ERR_SOCKET_ALREADY_BOUND

An attempt was made to bind a socket that has already been bound.

<a id="ERR_SOCKET_BAD_PORT"></a>

### ERR_SOCKET_BAD_PORT

An API function expecting a port > 0 and < 65536 received an invalid value.

<a id="ERR_SOCKET_BAD_TYPE"></a>

### ERR_SOCKET_BAD_TYPE

An API function expecting a socket type (`udp4` or `udp6`) received an invalid value.

<a id="ERR_SOCKET_CANNOT_SEND"></a>

### ERR_SOCKET_CANNOT_SEND

Data could be sent on a socket.

<a id="ERR_SOCKET_CLOSED"></a>

### ERR_SOCKET_CLOSED

An attempt was made to operate on an already closed socket.

<a id="ERR_SOCKET_DGRAM_NOT_RUNNING"></a>

### ERR_SOCKET_DGRAM_NOT_RUNNING

A call was made and the UDP subsystem was not running.

<a id="ERR_STDERR_CLOSE"></a>

### ERR_STDERR_CLOSE<!-- YAML
removed: v8.16.0
changes:
  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->An attempt was made to close the `process.stderr` stream. By design, Node.js does not allow `stdout` or `stderr` streams to be closed by user code.

<a id="ERR_STDOUT_CLOSE"></a>

### ERR_STDOUT_CLOSE

<!-- YAML
removed: v8.16.0
changes:
  - version: v8.16.0
    pr-url: https://github.com/nodejs/node/pull/23053
    description: Rather than emitting an error, `process.stderr.end()` now
                 only closes the stream side but not the underlying resource,
                 making this error obsolete.
-->

An attempt was made to close the `process.stdout` stream. By design, Node.js does not allow `stdout` or `stderr` streams to be closed by user code.

<a id="ERR_TLS_CERT_ALTNAME_INVALID"></a>

### ERR_TLS_CERT_ALTNAME_INVALID

While using TLS, the hostname/IP of the peer did not match any of the subjectAltNames in its certificate.

<a id="ERR_TLS_DH_PARAM_SIZE"></a>

### ERR_TLS_DH_PARAM_SIZE

While using TLS, the parameter offered for the Diffie-Hellman (`DH`) key-agreement protocol is too small. By default, the key length must be greater than or equal to 1024 bits to avoid vulnerabilities, even though it is strongly recommended to use 2048 bits or larger for stronger security.

<a id="ERR_TLS_HANDSHAKE_TIMEOUT"></a>

### ERR_TLS_HANDSHAKE_TIMEOUT

A TLS/SSL handshake timed out. In this case, the server must also abort the connection.

<a id="ERR_TLS_RENEGOTIATION_FAILED"></a>

### ERR_TLS_RENEGOTIATION_FAILED

A TLS renegotiation request has failed in a non-specific way.

<a id="ERR_TLS_REQUIRED_SERVER_NAME"></a>

### ERR_TLS_REQUIRED_SERVER_NAME

While using TLS, the `server.addContext()` method was called without providing a hostname in the first parameter.

<a id="ERR_TLS_SESSION_ATTACK"></a>

### ERR_TLS_SESSION_ATTACK

An excessive amount of TLS renegotiations is detected, which is a potential vector for denial-of-service attacks.

<a id="ERR_TRANSFORM_ALREADY_TRANSFORMING"></a>

### ERR_TRANSFORM_ALREADY_TRANSFORMING

A Transform stream finished while it was still transforming.

<a id="ERR_TRANSFORM_WITH_LENGTH_0"></a>

### ERR_TRANSFORM_WITH_LENGTH_0

A Transform stream finished with data still in the write buffer.

<a id="ERR_UNKNOWN_SIGNAL"></a>

### ERR_UNKNOWN_SIGNAL

An invalid or unknown process signal was passed to an API expecting a valid signal (such as [`subprocess.kill()`][]).

<a id="ERR_UNKNOWN_STDIN_TYPE"></a>

### ERR_UNKNOWN_STDIN_TYPE

An attempt was made to launch a Node.js process with an unknown `stdin` file type. This error is usually an indication of a bug within Node.js itself, although it is possible for user code to trigger it.

<a id="ERR_UNKNOWN_STREAM_TYPE"></a>

### ERR_UNKNOWN_STREAM_TYPE

An attempt was made to launch a Node.js process with an unknown `stdout` or `stderr` file type. This error is usually an indication of a bug within Node.js itself, although it is possible for user code to trigger it.

<a id="ERR_V8BREAKITERATOR"></a>

### ERR_V8BREAKITERATOR

The V8 BreakIterator API was used but the full ICU data set is not installed.

<a id="ERR_VALID_PERFORMANCE_ENTRY_TYPE"></a>

### ERR_VALID_PERFORMANCE_ENTRY_TYPE

While using the Performance Timing API (`perf_hooks`), no valid performance entry types were found.

<a id="ERR_VALUE_OUT_OF_RANGE"></a>

### ERR_VALUE_OUT_OF_RANGE

A given value is out of the accepted range.
