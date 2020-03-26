# Поддержка интернационализации

<!--introduced_in=v8.2.0-->

Node.js имеет много функций, которые облегчают написание интернационализированных программ. Некоторые из них:

- Функции, чувствительные к локальной конфигурации или учитывающие кодировку Unicode в [ECMAScript Language Specification](https://tc39.github.io/ecma262/):
  - [`String.prototype.normalize()`][]
  - [`String.prototype.toLowerCase()`][]
  - [`String.prototype.toUpperCase()`][]
- Все функциональные возможности описаны в [ECMAScript Internationalization API Specification](https://tc39.github.io/ecma402/) (она же ECMA-402):
  - объект [`Intl`][]
  - Методы, чувствительные к локальной конфигурации, такие как [`String.prototype.localeCompare()`][] и [`Date.prototype.toLocaleString()`][]
- The [WHATWG URL parser](url.html#url_the_whatwg_url_api)'s [internationalized domain names](https://en.wikipedia.org/wiki/Internationalized_domain_name) (IDNs) support
- [`require('buffer').transcode()`][]
- More accurate [REPL](repl.html#repl_repl) line editing
- [`require('util').TextDecoder`][]
- [RegExp Unicode Property Escapes](https://github.com/tc39/proposal-regexp-unicode-property-escapes)

Node.js (и его базовый движок V8) использует [ICU](http://icu-project.org/) для реализации этих функций в собственном коде C/C++. Однако для некоторых из них требуется очень большой файл данных ICU для поддержки всех стран мира. Поскольку ожидается, что большинство пользователей Node.js будут использовать только небольшую часть функциональных возможностей ICU, по умолчанию Node.js предоставляет только подмножество полного набора данных ICU. Предусмотрено несколько параметров для настройки и расширения набора данных ICU при сборке или запуске Node.js.

## Параметры для построения Node.js

Для управления использованием ICU в Node.js во время компиляции доступны четыре параметра `configure`. Дополнительная информация, как скомпилировать Node.js, описана в [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md).

- `--with-intl=none` / `--without-intl`
- `--with-intl=system-icu`
- `--with-intl=small-icu` (по умолчанию)
- `--with-intl=full-icu`

Обзор доступных функций Node.js и JavaScript для каждого параметра `configure`:

|                                                                                                     | `none`                            | `system-icu`                     | `small-icu`                            | `full-icu` |
| --------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------- | -------------------------------------- | ---------- |
| [`String.prototype.normalize()`][]                                                                  | нет (функция no-op)               | полная                           | полная                                 | полная     |
| `String.prototype.to*Case()`                                                                        | полная                            | полная                           | полная                                 | полная     |
| [`Intl`][]                                                                                          | нет (объект не существует)        | частичная/полная (зависит от ОС) | частичная (только на английском языке) | полная     |
| [`String.prototype.localeCompare()`][]                                                              | частичная (не учитывает локали)   | полная                           | полная                                 | полная     |
| `String.prototype.toLocale*Case()`                                                                  | частичная (не учитывает локали)   | полная                           | полная                                 | полная     |
| [`Number.prototype.toLocaleString()`][]                                                             | частичная (не учитывает локали)   | частичная/полная (зависит от ОС) | частичная (только на английском языке) | полная     |
| `Date.prototype.toLocale*String()`                                                                  | частичная (не учитывает локали)   | частичная/полная (зависит от ОС) | частичная (только на английском языке) | полная     |
| [WHATWG URL Parser](url.html#url_the_whatwg_url_api)                                                | partial (no IDN support)          | полная                           | полная                                 | полная     |
| [`require('buffer').transcode()`][]                                                                 | none (function does not exist)    | полная                           | полная                                 | полная     |
| [REPL](repl.html#repl_repl)                                                                         | partial (inaccurate line editing) | полная                           | полная                                 | полная     |
| [`require('util').TextDecoder`][]                                                                   | partial (basic encodings support) | частичная/полная (зависит от ОС) | partial (Unicode-only)                 | полная     |
| [RegExp Unicode Property Escapes](https://github.com/tc39/proposal-regexp-unicode-property-escapes) | none (invalid RegExp error)       | полная                           | полная                                 | полная     |

*Примечание*: Обозначение "(не учитывает локали)" означает, что функция выполняет свою работу точно так же, как не-`Locale` версия этой функции, если таковая существует. Например, в режиме `none` операция `Date.prototype.toLocaleString()` идентична операции `Date.prototype.toString()`.

### Отключить все функции интернационализации (`none`)

Если выбран этот параметр, большинство функций интернационализации, упомянутых выше, будут **unavailable** в результирующем бинарном `узле`.

### Сборка с предустановленной ICU (`system-icu`)

Node.js может ссылаться на сборку ICU, уже установленную в системе. Фактически большинство дистрибутивов Linux уже поставляются с установленным ICU, и эта опция позволит повторно использовать тот же набор данных, который используется другими компонентами в ОС.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `system-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][] *may* be fully or partially supported, depending on the completeness of the ICU data installed on the system.

### Внедрение ограниченного набора данных ICU (`small-icu`)

Эта опция статически создает результирующую двоичную ссылку на библиотеку ICU и включает подмножество данных ICU (обычно только английскую локаль) в исполняемом файле `node`.

Functionalities that only require the ICU library itself, such as [`String.prototype.normalize()`][] and the [WHATWG URL parser](url.html#url_the_whatwg_url_api), are fully supported under `small-icu`. Features that require ICU locale data in addition, such as [`Intl.DateTimeFormat`][], generally only work with the English locale:

```js
const january = new Date(9e8);
const english = new Intl.DateTimeFormat('en', { month: 'long' });
const spanish = new Intl.DateTimeFormat('es', { month: 'long' });

console.log(english.format(january));
// Prints "January"
console.log(spanish.format(january));
// Prints "M01" on small-icu
// Should print "enero"
```

Этот режим обеспечивает хороший баланс между функциями и размером двоичного файла, и это является поведением по умолчанию, если не передан флаг `--with-intl`. Официальные двоичные файлы также созданы в этом режиме.

#### Предоставление данных ICU во время выполнения

Если используется опция `small-icu`, можно по-прежнему предоставлять дополнительные данные локали во время выполнения, чтобы методы JS работали для всех локалей ICU. Если файл данных хранится в `/some/directory`, его можно сделать доступным для ICU через:

* Переменная окружения [`NODE_ICU_DATA`][]:

  ```shell
  env NODE_ICU_DATA=/some/directory node
  ```

* Параметр CLI [`--icu-data-dir`][]:

  ```shell
  node --icu-data-dir=/some/directory
  ```

(Если указаны оба параметра, то приоритет будет иметь параметр `--icu-data-dir`.)

ICU может автоматически находить и загружать различные форматы данных, но данные должны соответствовать версии ICU, а файл должен иметь правильное имя. Наиболее распространенное имя для файла данных: `icudt5X[bl].dat`, где `5X` обозначает предполагаемую версию ICU, а `b` или `l` указывает на порядковый номер системы. Чтобы узнать о других поддерживаемых форматах и о более подробной информации о данных ICU в целом, обратитесь к статье ["ICU Data"](http://userguide.icu-project.org/icudata) в Руководстве пользователя ICU.

Модуль npm [full-icu](https://www.npmjs.com/package/full-icu) может значительно упростить установку данных ICU путем определения версии ICU исполняемого файла `узла` и загрузки соответствующего файла данных. После установки модуля через `npm i full-icu` файл данных будет доступен по адресу `./node_modules/full-icu`. Затем этот путь можно передать либо в `NODE_ICU_DATA`, либо в `--icu-data-dir`, как показано выше, чтобы включить полную поддержку `Intl`.

### Внедрение полного ICU (`full-icu`)

Эта опция статически создает результирующую двоичную ссылку на ICU и включает в себя полный набор данных ICU. Созданный таким образом двоичный файл больше не имеет внешних зависимостей и поддерживает все локали, но может быть довольно большим. Смотрите [BUILDING.md](https://github.com/nodejs/node/blob/master/BUILDING.md#build-with-full-icu-support-all-locales-supported-by-icu) о том, как скомпилировать бинарный файл в этом режиме.

## Обнаружение поддержки интернационализации

Чтобы убедиться, что ICU вообще включен (`system-icu`, `small-icu` или `full-icu`), просто проверьте наличие `Intl`, для этого должно быть достаточно:

```js
const hasICU = typeof Intl === 'object';
```

Также можно проверить `process.versions.icu`, свойство, которое определяется только при включенном ICU:

```js
const hasICU = typeof process.versions.icu === 'string';
```

Чтобы проверить поддержку неанглийской локали (то есть `full-icu` или `system-icu`), отличным фактором может быть [`Intl.DateTimeFormat`][]:

```js
const hasFullICU = (() => {
  try {
    const january = new Date(9e8);
    const spanish = new Intl.DateTimeFormat('es', { month: 'long' });
    return spanish.format(january) === 'enero';
  } catch (err) {
    return false;
  }
})();
```

Для более подробных проверок поддержки `Intl` могут быть полезны следующие ресурсы:

- [btest402](https://github.com/srl295/btest402): Обычно используется для проверки правильности сборки Node.js с поддержкой `Intl`.
- [Test262](https://github.com/tc39/test262/tree/master/test/intl402): Официальный набор тестов соответствия ECMAScript включает раздел, посвященный ECMA-402.
