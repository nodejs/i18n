# Глобальные объекты

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Эти объекты доступны во всех модулях. The following variables may appear to be global but are not. They exist only in the scope of modules, see the [module system documentation](modules.html):

- [`__dirname`][]
- [`__filename`][]
- [`exports`][]
- [`module`][]
- [`require()`][]

Перечисленные здесь объекты относятся к Node.js. Есть целый ряд [встроенных объектов](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects), являющихся частью языка JavaScript, которые также доступны глобально.

## Класс: Buffer
<!-- YAML
added: v0.1.103
-->

<!-- type=global -->

* {Function}

Используется для обработки бинарных данных. Смотрите [раздел буфера](buffer.html).

## \_\_dirname

This variable may appear to be global but is not. See [`__dirname`].

## \_\_filename

This variable may appear to be global but is not. See [`__filename`].

## clearImmediate(immediateObject)
<!-- YAML
added: v0.9.1
-->

<!--type=global-->

[`clearImmediate`] описан в разделе [таймеры](timers.html).

## clearInterval(intervalObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearInterval`] описан в разделе [таймеры](timers.html).

## clearTimeout(timeoutObject)
<!-- YAML
added: v0.0.1
-->

<!--type=global-->

[`clearTimeout`] описан в разделе [таймеры](timers.html).

## console
<!-- YAML
added: v0.1.100
-->

<!-- type=global -->

* {Object}

Используется для печати в stdout и stderr. Смотрите раздел [`console`][].

## exports

This variable may appear to be global but is not. See [`exports`].

## global
<!-- YAML
added: v0.1.27
-->

<!-- type=global -->

* {Object} Глобальный объект пространства имен.

В браузерах область верхнего уровня является глобальной областью. This means that within the browser `var something` will define a new global variable. In Node.js this is different. The top-level scope is not the global scope; `var something` inside a Node.js module will be local to that module.

## module

This variable may appear to be global but is not. See [`module`].

## process
<!-- YAML
added: v0.1.7
-->

<!-- type=global -->

* {Object}

Объект процесса. Смотрите раздел [`process` object][].

## require()

This variable may appear to be global but is not. See [`require()`].

## setImmediate(callback[, ...args])
<!-- YAML
added: v0.9.1
-->

<!-- type=global -->

[`setImmediate`] описан в разделе [таймеры](timers.html).

## setInterval(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setInterval`] описан в разделе [таймеры](timers.html).

## setTimeout(callback, delay[, ...args])
<!-- YAML
added: v0.0.1
-->

<!-- type=global -->

[`setTimeout`] описан в разделе [таймеры](timers.html).
