# Модули

<!--introduced_in=v0.10.0-->

> Стабильность: 2 - Стабильно

<!--name=module-->

В модульной системе Node.js каждый файл рассматривается в качестве отдельного модуля. Например, рассмотрим файл под названием `foo.js`:

```js
const circle = require('./circle.js');
console.log(`Площадь круга с радиусом 4 составляет ${circle.area(4)}`);
```

В первой строке `foo.js` происходит загрузка модуля `circle.js`, который располагается в той же папке, что и `foo.js`.

Ниже приводится содержимое `circle.js`:

```js
const { PI } = Math;

exports.area = (r) => PI * r ** 2;

exports.circumference = (r) => 2 * PI * r;
```

Модуль `circle.js` экспортировал функции `area()` и `circumference()`. Functions and objects are added to the root of a module by specifying additional properties on the special `exports` object.

Локальные переменные модуля будут приватными, поскольку Node.js оборачивает модуль в функцию (см. [module wrapper](#modules_the_module_wrapper)). В этом примере `PI` – приватная переменная `circle.js`.

The `module.exports` property can be assigned a new value (such as a function or object).

Below, `bar.js` makes use of the `square` module, which exports a Square class:

```js
const Square = require('./square.js');
const mySquare = new Square(2);
console.log(`Площадь mySquare составляет ${mySquare.area()}`);
```

Определение модуля `square` дано в `square.js`:

```js
// assigning to exports will not modify module, must use module.exports
module.exports = class Square {
  constructor(width) {
    this.width = width;
  }

  area() {
    return this.width ** 2;
  }
};
```

Модульная система реализована в модуле `require('module')`.

## Получение доступа к основному модулю

<!-- type=misc -->

При запуске файла непосредственно из Node.js в качестве значения `require.main` выступает его объект `module`. That means that it is possible to determine whether a file has been run directly by testing `require.main === module`.

В случае файла `foo.js` результатом проверки условия будет `true`, если файл был запущен при помощи команды `node foo.js`, но `false`, если за счет команды `require('./foo')`.

Поскольку `module` имеет свойство `filename` (значение которого обычно совпадает с таковым `__filename`), точку входа запущенного в данный момент приложения можно получить из `require.main.filename`.

## Приложение: Советы по поводу менеджера пакетов

<!-- type=misc -->

Семантика функции `require()` Node.js была разработана таким образом, чтобы быть достаточно универсальной для поддержки ряда допустимых структур каталогов. Будем надеяться, что для менеджеров пакетов вроде `dpkg`, `rpm` и `npm` будет реализована возможность создавать нативные пакеты из модулей Node.js без внесения изменений.

Ниже приводится примерная структура каталогов, которая могла бы использоваться:

Давайте предположим, что мы хотели бы, чтобы у нас была папка по пути `/usr/lib/node/<some-package>/<some-version>`, в которой содержится содержимое определенной версии пакета.

Пакеты могут зависеть друг от друга. In order to install package `foo`, it may be necessary to install a specific version of package `bar`. The `bar` package may itself have dependencies, and in some cases, these may even collide or form cyclic dependencies.

Поскольку Node.js ищет `действительный путь` всех загружаемых им модулей (то есть разрешает символические ссылки) и затем отыскивает их зависимости в папках `node_modules` , как это описывается [здесь](#modules_loading_from_node_modules_folders), то эту ситуацию очень легко разрешить за счет использования следующей архитектуры:

* `/usr/lib/node/foo/1.2.3/` - Содержимое пакета `foo`, версия 1.2.3.
* `/usr/lib/node/bar/4.3.2/` - Содержимое пакета `bar`, от которого зависит `foo`.
* `/usr/lib/node/foo/1.2.3/node_modules/bar` - Символическая ссылка на `/usr/lib/node/bar/4.3.2/`.
* `/usr/lib/node/bar/4.3.2/node_modules/*` - Символические ссылки на пакеты , от которых зависит `bar`.

Таким образом, если возникает ситуация, когда модули зависят друг от друга, или если имеются конфликты между зависимостями, то у каждого модуля будет возможность получить версию зависимости, которую он может использовать.

Когда в коде пакета `foo` используется `require('bar')`, то он получит версию, для которой используется символическая ссылка `/usr/lib/node/foo/1.2.3/node_modules/bar`. Далее, когда в коде пакета `bar` вызывается `require('quux')`, то он получит версию, для которой используется символическая ссылка `/usr/lib/node/bar/4.3.2/node_modules/quux`.

Кроме того, чтобы еще более оптимизировать процесс поиска модулей, мы могли бы помещать их в `/usr/lib/node_modules/<name>/<version>`, а не непосредственно в `/usr/lib/node`. Затем Node.js не будет заниматься поиском недостающих зависимостей в `/usr/node_modules` или `/node_modules`.

Для того чтобы модули были доступны для REPL Node.js, также не помешало бы добавить папку `/usr/lib/node_modules` в переменную среды `$NODE_PATH`. Поскольку поиск всех модулей за счет папок `node_modules` осуществляется с использованием относительных путей и на основании действительных путей файлов, в которых вызывается `require()`, то сами пакеты могут располагаться где угодно.

## Обобщая все вышесказанное...

<!-- type=misc -->

Для того чтобы получить точное имя файла, который будет загружаться при вызове `require()`, используйте функцию `require.resolve()`.

С учетом всего вышесказанного ниже приводится выраженный в псевдокоде на высоком уровне абстракции алгоритм того, что выполняет `require()`:

```txt
require(X) from module at path Y
1. If X is a core module,
   a. return the core module
   b. STOP
2. If X begins with '/'
   a. set Y to be the filesystem root
3. If X begins with './' or '/' or '../'
   a. LOAD_AS_FILE(Y + X)
   b. LOAD_AS_DIRECTORY(Y + X)
4. LOAD_NODE_MODULES(X, dirname(Y))
5. THROW "not found"

LOAD_AS_FILE(X)
1. If X is a file, load X as JavaScript text.  STOP
2. If X.js is a file, load X.js as JavaScript text.  STOP
3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
4. If X.node is a file, load X.node as binary addon.  STOP

LOAD_INDEX(X)
1. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
2. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
3. If X/index.node is a file, load X/index.node as binary addon.  STOP

LOAD_AS_DIRECTORY(X)
1. If X/package.json is a file,
   a. Parse X/package.json, and look for "main" field.
   b. let M = X + (json main field)
   c. LOAD_AS_FILE(M)
   d. LOAD_INDEX(M)
2. LOAD_INDEX(X)

LOAD_NODE_MODULES(X, START)
1. let DIRS=NODE_MODULES_PATHS(START)
2. for each DIR in DIRS:
   a. LOAD_AS_FILE(DIR/X)
   b. LOAD_AS_DIRECTORY(DIR/X)

NODE_MODULES_PATHS(START)
1. let PARTS = path split(START)
2. let I = count of PARTS - 1
3. let DIRS = []
4. while I >= 0,
   a. if PARTS[I] = "node_modules" CONTINUE
   b. DIR = path join(PARTS[0 .. I] + "node_modules")
   c. DIRS = DIRS + DIR
   d. let I = I - 1
5. return DIRS
```

## Кэширование

<!--type=misc-->

Модули помещаются в кэш после того, как были впервые загружены. Это означает (помимо прочего), что в результате каждого вызова `require('foo')` был бы возвращен абсолютно тот же самый объект, если бы в результате преобразования указанного в нем имени получался путь к одному и тому же файлу.

В результате множества вызовов `require('foo')` код модуля не обязательно будет выполняться множество раз. Это важная особенность. За счет нее могут возвращаться «частично загруженные» объекты, благодаря чему транзитивные зависимости могли бы загружаться, даже если бы возникала ситуация, при которой они зависят друг от друга.

To have a module execute code multiple times, export a function, and call that function.

### Предостережения по поводу кэширования модулей

<!--type=misc-->

Модули помещаются в кэш на основании адреса, получаемого в результате преобразования их имени. Поскольку в результате преобразования имен модулей могут получаться различные адреса в зависимости от местоположения вызывающего модуля (при загрузке из папок `node_modules`), нет *гарантии*, что в результате выполнения метода `require('foo')` всегда возвращался бы абсолютно тот же самый объект, если бы в результате преобразования указанного в нем имени получался путь к различным файлам.

Также в файловых или операционных системах, чувствительных к регистру букв, адреса, получаемые в результате разрешения различных имен файлов, могут указывать на один и тот же файл, однако кэш по-прежнему будет рассматривать их в качестве различных модулей и перезагрузит файл несколько раз. Например, в результате выполнения `require('./foo')` и `require('./FOO')` возвращаются два различных объекта, не зависимо от того являются ли `./foo` и `./FOO` один и тем же файлом.

## Основные модули

<!--type=misc-->

В Node.js имеется несколько модулей, скомпилированных в двоичный код. Эти модули описаны подробнее в других частях документации.

Основные модули определены в исходном коде Node.js и располагаются в папке `lib/`.

Если в `require()` передается идентификатор основных модулей, то предпочтение при загрузке отдается им. Например, в результате вызова `require('http')` всегда будет возвращаться встроенный модуль HTTP, даже если имеется файл с этим именем.

## Ситуации, когда модули зависят друг от друга

<!--type=misc-->

Когда файлы вызывают друг друга при помощи `require()`, то код модуля мог бы быть еще не выполнен при его возвращении.

Давайте рассмотрим следующую ситуацию:

`a.js`:

```js
console.log('a starting');
exports.done = false;
const b = require('./b.js');
console.log('in a, b.done = %j', b.done);
exports.done = true;
console.log('a done');
```

`b.js`:

```js
console.log('b starting');
exports.done = false;
const a = require('./a.js');
console.log('in b, a.done = %j', a.done);
exports.done = true;
console.log('b done');
```

`main.js`:

```js
console.log('main starting');
const a = require('./a.js');
const b = require('./b.js');
console.log('in main, a.done = %j, b.done = %j', a.done, b.done);
```

Когда в `main.js` загружается `a.js`, то в `a.js` в свою очередь загружается `b.js`. В тот момент в `b.js` происходит попытка загрузить `a.js`. Для того чтобы предотвратить зацикливание, **незагруженная копия** объекта с экспортируемыми данными `a.js` возвращается в модуль `b.js`. Затем загрузка `b.js` прекращается, и его объект `exports` предоставляется модулю `a.js`.

К тому моменту, когда в `main.js` оба модуля загружены, загрузка ими друг друга прекращается. В результате выполнения этой программы получилось бы следующее:

```txt
$ node main.js
main starting
a starting
b starting
in b, a.done = false
b done
in a, b.done = true
a done
in main, a.done = true, b.done = true
```

Careful planning is required to allow cyclic module dependencies to work correctly within an application.

## Файлы в качестве модулей

<!--type=misc-->

Если модуль с именем, точно соответствующим указанному имени, не обнаруживается, то Node.js попробует загрузить необходимым файл, добавляя к его имени расширения: `.js`, `.json` и, наконец, `.node`.

Файлы с расширением `.js` интерпретируются как текстовые файлы JavaScript, а файлы с расширением `.json` разбираются как текстовые файлы JSON. Файлы с расширением `.node` интерпретируются как скомпилированные дополнения, загруженные при помощи `dlopen`.

Имя необходимого модуля, перед которым указан `'/'`, является абсолютным путем к файлу. Например , в результате выполнения `require('/home/marco/foo.js')` будет загружен файл, расположенный по адресу `/home/marco/foo.js`.

Имя необходимого модуля, перед которым указано `'./'`, является адресом, который указывается относительно файла, вызывающего `require()`. То есть, `circle.js` должен располагаться в той же самой папке, что и `foo.js`, для того чтобы он был найден при выполнении `require('./circle')`.

Без предшествующих имени '/', './' или '../', за счет чего указывается, что должен быть загружен файл, модуль должен либо быть одним из основных модулей, либо загружаться из папки `node_modules`.

Если предоставленный путь не существует, то при выполнении метода `require()` будет выброшен объект  [`Error`][], в качестве значения свойства `code` которого выступает `'MODULE_NOT_FOUND'`.

## Папки в роли модулей

<!--type=misc-->

Весьма удобно организовывать программы и библиотеки в отдельные папки и затем предоставлять единственную точку входа в них. Имеется три способа, за счет которых можно передать папку в `require()` в качестве аргумента.

Первый заключается в том, чтобы создать файл `package.json` в корне папки, в котором указывается `главный` модуль. Пример файла package.json мог бы выглядеть следующим образом:

```json
{ "name" : "some-library",
  "main" : "./lib/some-library.js" }
```

Если бы этот файл располагался в папке, расположенной по адресу `./some-library`, то при выполнении `require('./some-library')` была бы осуществлена попытка загрузить `./some-library/lib/some-library.js`.

Так происходит из-за осведомленности Node.js о файлах package.json.

*Note*: If the file specified by the `'main'` entry of `package.json` is missing and can not be resolved, Node.js will report the entire module as missing with the default error:

```txt
Error: Cannot find module 'some-library'
```

Если в папке отсутствует файл package.json, то Node.js попробует загрузить файл `index.js` или `index.node` из нее. Например, если бы в рассматриваемом выше примере не было бы файла package.json, то при выполнении `require('./some-library')` была бы осуществлена попытка загрузить:

* `./some-library/index.js`
* `./some-library/index.node`

## Загрузка из папок `node_modules`

<!--type=misc-->

Если переданный в `require()` идентификатор модуля не относится к одному из основных модулей и не начинается `'/'`, `'../'` или `'./'`, то Node.js начинает поиск с родительской папки текущего модуля, добавляет `/node_modules` и пытается загрузить модуль оттуда. Node.js will not append `node_modules` to a path already ending in `node_modules`.

Если модуль там не найден, то Node.js продолжает поиск в родительской папке и так далее, пока не будет достигнут корень файловой системы.

Например, если в файле, расположенном по пути `'/home/ry/projects/foo.js'`, произошел бы вызов `require('bar.js')`, то Node.js искал бы модуль в нижеперечисленных папках в следующем порядке:

* `/home/ry/projects/node_modules/bar.js`
* `/home/ry/node_modules/bar.js`
* `/home/node_modules/bar.js`
* `/node_modules/bar.js`

За счет этого программы могут разместить свои зависимости таким образом, что между ними не возникает конфликтных ситуаций.

It is possible to require specific files or sub modules distributed with a module by including a path suffix after the module name. Например, при вызове `require('example-module/path/to/file')` `path/to/file` преобразовывался бы в путь на основании того, где располагается `example-module`. Для суффикса пути применяются те же принципы преобразования имени в адрес, что и для имен модулей.

## Загрузка из глобальных папок

<!-- type=misc -->

Если в качестве значения переменной среды `NODE_PATH` выступает список отделенных двоеточием абсолютных путей, то Node.js выполнит поиск модулей по этим путям, если они не найдены в остальных местах.

*Note*: On Windows, `NODE_PATH` is delimited by semicolons instead of colons.

Переменная `NODE_PATH` изначально была создана для поддержки возможности загрузки модулей, расположенных по различным адресам, перед тем как текущий алгоритм преобразования имени в адрес [module resolution](#modules_all_together) стал доступен для использования.

`NODE_PATH` по-прежнему поддерживается, но теперь не так необходима, когда в экосистеме Node.js установилась традиция локализовать зависимые модули. Иногда при развертывании приложений, зависящих от `NODE_PATH`, наблюдается неожиданное поведение, когда люди не в курсе, что необходимо указать значение `NODE_PATH`. Иногда зависимости модуля изменяются, что приводит к загрузке другой версии модуля (или даже другого модуля) при поиске модуля по адресам, указанным в `NODE_PATH`.

Также Node.js выполнит поиск модулей в папках, расположенных по следующим адресам:

* 1: `$HOME/.node_modules`
* 2: `$HOME/.node_libraries`
* 3: `$PREFIX/lib/node`

Где `$HOME` – начальный каталог пользователя, а `$PREFIX` – настроенный `node_prefix` Node.js.

Это так сложилось в основном в силу исторических причин.

*Note*: It is strongly encouraged to place dependencies in the local `node_modules` folder. These will be loaded faster, and more reliably.

## Обертка модуля

<!-- type=misc -->

Перед тем как код модуля выполнится, Node.js обернет его в функцию, которая выглядит следующим образом:

```js
(function(exports, require, module, __filename, __dirname) {
// Module code actually lives in here
});
```

За счет этого в Node.js достигается следующее:

- Переменные верхнего уровня (определенные при помощи `var`, `const` или `let`) остаются в области видимости модуля, а не глобального объекта.
- Облегчается предоставление некоторых переменных, напоминающих глобальные, которые в действительности присущи модулю, например:
  - Объектов `module` и `exports`, которые разработчик может использовать, чтобы экспортировать значения из модуля.
  - Вспомогательных переменных `__filename` и `__dirname`, содержащих абсолютные пути текущего модуля и его родительской папки.

## The module scope

### \_\_dirname
<!-- YAML
added: v0.1.27
-->

<!-- type=var -->

* {string}

Имя каталога текущего модуля. This is the same as the [`path.dirname()`][] of the [`__filename`][].

Например: запущенный `node example.js` от `/Users/mjr`

```js
console.log(__dirname);
// Печатает: /Users/mjr
console.log(path.dirname(__filename));
// Печатает: /Users/mjr
```

### \_\_filename
<!-- YAML
added: v0.0.1
-->

<!-- type=var -->

* {string}

Имя файла текущего модуля. Это разрешенный абсолютный путь к текущему файлу модуля.

Для основной программы это не обязательно совпадает с именем файла, используемым в командной строке.

Смотрите [`__dirname`][] для имени каталога текущего модуля.

Примеры:

Запуск `node example.js` от `/Users/mjr`

```js
console.log(__filename);
// Печатает: /Users/mjr/example.js
console.log(__dirname);
// Печатает: /Users/mjr
```

Имеются два модуля: `a` и `b`, где `b` является зависимостью `a`, а также имеется структура каталогов:

* `/Users/mjr/app/a.js`
* `/Users/mjr/app/node_modules/b/b.js`

Ссылки на `__filename` в пределах `b.js` вернут `/Users/mjr/app/node_modules/b/b.js`, а ссылки на `__filename` в пределах `a.js` вернут `/Users/mjr/app/a.js`.

### exports
<!-- YAML
added: v0.1.12
-->

<!-- type=var -->

Ссылка на `module.exports`, которая короче для типа. See the section about the [exports shortcut](#modules_exports_shortcut) for details on when to use `exports` and when to use `module.exports`.

### module
<!-- YAML
added: v0.1.16
-->

<!-- type=var -->

* {Object}

A reference to the current module, see the section about the [`module` object][]. In particular, `module.exports` is used for defining what a module exports and makes available through `require()`.

### require()
<!-- YAML
added: v0.1.13
-->

<!-- type=var -->

* {Function}

Used to import modules, `JSON`, and local files. Modules can be imported from `node_modules`. Local modules and JSON files can be imported using a relative path (e.g. `./`, `./foo`, `./bar/baz`, `../foo`) that will be resolved against the directory named by [`__dirname`][] (if defined) or the current working directory.

```js
// Importing a local module:
const myLocalModule = require('./path/myLocalModule');

// Importing a JSON file:
const jsonData = require('./path/filename.json');

// Importing a module from node_modules or Node.js built-in module:
const crypto = require('crypto');
```

#### require.cache
<!-- YAML
added: v0.3.0
-->

* {Object}

Модули кэшируются в этом объекте, когда они необходимы. При удалении значения ключа из этого модуля, следующий `require` перезагрузит модуль. Обратите внимание, что это не относится к [собственным дополнениям](addons.html), для которых перезагрузка приведет к ошибке.

#### require.extensions
<!-- YAML
added: v0.3.0
deprecated: v0.10.6
-->

> Стабильность: 0 - Устарело

* {Object}

Инструкция для `require` по обработке определенных расширений файлов.

Файлы процесса с расширением `.sjs` как `.js`:

```js
require.extensions['.sjs'] = require.extensions['.js'];
```

**Устарело** В прошлом этот список использовался для загрузки модулей, не являющимися JavaScript, в Node.js путем объединения их по запросу. Однако на практике есть гораздо более эффективные способы сделать это, например, загрузить модули с помощью какой-либо другой программы Node.js или заранее скомпилировать их в JavaScript.

Since the module system is locked, this feature will probably never go away. Тем не менее она может иметь небольшие ошибки и сложности, которые лучше не трогать.

Note that the number of file system operations that the module system has to perform in order to resolve a `require(...)` statement to a filename scales linearly with the number of registered extensions.

In other words, adding extensions slows down the module loader and should be discouraged.

#### require.resolve(request[, options])
<!-- YAML
added: v0.3.0
changes:
  - version: v8.9.0
    pr-url: https://github.com/nodejs/node/pull/16397
    description: The `paths` option is now supported.
-->

* `request` {string} The module path to resolve.
* `options` {Object}
  * `paths` {Array} Paths to resolve module location from. If present, these paths are used instead of the default resolution paths. Note that each of these paths is used as a starting point for the module resolution algorithm, meaning that the `node_modules` hierarchy is checked from this location.
* Возвращает: {string}

Используйте внутренний механизм `require()` для поиска местоположения модуля, но вместо загрузки модуля просто верните разрешенное имя файла.

#### require.resolve.paths(request)
<!-- YAML
added: v8.9.0
-->

* `request` {string} The module path whose lookup paths are being retrieved.
* Возвращает: {Array|null}

Returns an array containing the paths searched during resolution of `request` or null if the `request` string references a core module, for example `http` or `fs`.

## Объект `module`
<!-- YAML
added: v0.1.16
-->

<!-- type=var -->
<!-- name=module -->

* {Object}

В каждом модуле свободная переменная `module` является ссылкой на объект, представляющий текущий модуль. Для удобства к `module.exports` также можно получить доступ через глобальную переменную модуля `exports`. `module` в действительности является не глобальной, а скорее локальной переменной для каждого модуля.

### module.children
<!-- YAML
added: v0.1.16
-->

* {Array}

Объекты модулей, необходимые для данного модуля.

### module.exports
<!-- YAML
added: v0.1.16
-->

* {Object}

Объект `module.exports` создается модульной системой. Иногда это не подходит; многие хотят, чтобы их модуль был экземпляром какого-то класса. Для этого присвойте необходимый объект с экспортируемыми данными `module.exports`. Note that assigning the desired object to `exports` will simply rebind the local `exports` variable, which is probably not what is desired.

Например, допустим, что мы бы создавали модуль под названием `a.js`:

```js
const EventEmitter = require('events');

module.exports = new EventEmitter();

// Выполняем какие-то действия, и через некоторый промежуток времени генерируем
// событие 'ready' из самого модуля.
setTimeout(() => {
  module.exports.emit('ready');
}, 1000);
```

Затем в другом файле мы могли бы сделать следующее:

```js
const a = require('./a');
a.on('ready', () => {
  console.log('модуль a готов');
});
```


Обратите внимание на то, что присвоение значения `module.exports` должно выполняться немедленно. Его нельзя выполнять ни в каких функциях обратного вызова. Следующий вариант не работает:

x.js:

```js
setTimeout(() => {
  module.exports = { a: 'hello' };
}, 0);
```

y.js:

```js
const x = require('./x');
console.log(x.a);
```

#### Краткая форма записи для экспортируемых данных
<!-- YAML
added: v0.1.16
-->

Переменная `exports` доступна в области видимости модуля на уровне файла, и ей присваивается значение `module.exports`, перед тем как выполняется код модуля.

За счет нее предоставляется возможность использования краткой формы записи, так что `module.exports.f = ...` может быть записана более сжато в виде `exports.f = ...`. Однако учтите, что как и в случае с любой другой переменной, при присвоении нового значения `exports` она теряет связь с  `module.exports`:

```js
module.exports.hello = true; // Экспортируется при запросе модуля
exports = { hello: false };  // Не экспортируется, доступна только в модуле
```

Когда значение свойства `module.exports` полностью перезаписывается новым объектом, то рекомендуется также перезаписать и значение `exports`, например:
```js
module.exports = exports = function Constructor() {
  // ... и т. д.
};
```

Для того чтобы проиллюстрировать это поведение, представим следующую гипотетическую реализацию `require()`, которая довольно похожа на то, что в действительности выполняет метод `require()`:

```js
function require(/* ... */) {
  const module = { exports: {} };
  ((module, exports) => {
    // Module code here. В этом примере мы определяем функцию.
    function someFunc() {}
    exports = someFunc;
    // На данном этапе exports более не является краткой формой записи module.exports и
    // этот модуль будет по-прежнему экспортировать пустой объект, заданный по умолчанию.
    module.exports = someFunc;
    // На данном этапе модуль уже будет экспортировать someFunc, а не
    // объект, заданный по умолчанию.
  })(module, module.exports);
  return module.exports;
}
```

### module.filename<!-- YAML
added: v0.1.16
-->* {string}

Здесь хранится полностью преобразованное в адрес имя модуля.

### module.id
<!-- YAML
added: v0.1.16
-->

* {string}

Здесь хранится идентификатор модуля. Обычно в его роли выступает полностью преобразованное в адрес имя модуля.

### module.loaded
<!-- YAML
added: v0.1.16
-->

* {boolean}

Здесь хранится значение, указывающее, завершена ли загрузка модуля или он еще загружается.

### module.parent
<!-- YAML
added: v0.1.16
-->

* {Object} объект модуля

Здесь хранится модуль, который впервые запросил текущий.

### module.paths<!-- YAML
added: v0.4.0
-->* {string[]}

The search paths for the module.

### module.require(id)<!-- YAML
added: v0.5.1
-->* `id` {string}
* Возвращает: {Object} `module.exports` из модуля, расположенного по адресу, полученному в результате преобразования его имени

Метод `module.require` предоставляет способ загрузки какого-то модуля, словно `require()` был вызван из оригинального модуля.

*Note*: In order to do this, it is necessary to get a reference to the `module` object. Since `require()` returns the `module.exports`, and the `module` is typically *only* available within a specific module's code, it must be explicitly exported in order to be used.

## Объект `Module`<!-- YAML
added: v0.3.7
-->* {Object}

Предоставляет методы для выполнения обычных действий при взаимодействии с экземплярами `Module` – переменной `module`, часто обнаруживаемой в файлах, выступающих в роли модулей. Получить доступ к нему можно при помощи `require('module')`.

### module.builtinModules<!-- YAML
added: v8.10.0
-->* {string[]}

Здесь хранится список имен всех модулей, предоставляемых Node.js. Может быть использован для проверки того, поддерживается ли модуль сторонними разработчиками.
