# Об этой документации

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

Цель данной документации - всестороннее объяснение API Node.js как со справочной, так и с концептуальной точки зрения. Каждый раздел описывает встроенный модуль или концепт высокого уровня.

При необходимости типы свойств, аргументы методов и аргументы, предоставляемые обработчикам событий, подробно описываются в списке под заголовком темы.

## Помощь проекту

If errors are found in this documentation, please [submit an issue](https://github.com/nodejs/node/issues/new) or see [the contributing guide](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) for directions on how to submit a patch.

Каждый файл генерируется на основе соответствующего файла `.md` в папке `doc/api/` в исходном дереве Node.js. Документация генерируется с помощью программы `tools/doc/generate.js`. Шаблон HTML находится по адресу `doc/template.html`.

## Индекс стабильности

<!--type=misc-->

Throughout the documentation are indications of a section's stability. API Node.js все еще меняется, и по мере его развития некоторые части становятся более надежными, чем другие. Некоторые из них настолько хорошо проверены и настолько надежны, что вряд ли они когда-нибудь изменятся. Другие являются совершенно новыми и экспериментальными, или, как известно, опасны и находятся в процессе доработки.

Индексы стабильности следующие:

> Стабильность: 0 - устарело. The feature may emit warnings. Backward compatibility is not guaranteed.

<!-- separator -->

> Stability: 1 - Experimental. This feature is still under active development and subject to non-backward compatible changes or removal in any future version. Use of the feature is not recommended in production environments. Experimental features are not subject to the Node.js Semantic Versioning model.

<!-- separator -->

> Stability: 2 - Stable. Compatibility with the npm ecosystem is a high priority.

Caution must be used when making use of `Experimental` features, particularly within modules that may be used as dependencies (or dependencies of dependencies) within a Node.js application. Конечные пользователи могут не знать, что используются экспериментальные функции, и, следовательно, могут возникать непредвиденные сбои или изменения в поведении при модификации API. Чтобы избежать подобного рода сюрпризов, `Экспериментальные` функции могут потребовать флаг командной строки, чтобы точно разрешить их, или может появиться предупреждение процесса. By default, such warnings are printed to [`stderr`][] and may be handled by attaching a listener to the [`'warning'`][] event.

## Вывод в формате JSON
<!-- YAML
added: v0.6.12
-->

> Стабильность: 1 - экспериментальный

Каждый документ `.html` имеет соответствующий документ `.json`, представляющий ту же информацию в структурированном виде. Эта функция является экспериментальной и добавлена в помощь IDE и других утилит, которые хотят выполнять программные действия с документацией.

## Системные вызовы и справочные страницы

Системные вызовы, такие как open (2) и read (2), определяют интерфейс между пользовательскими программами и базовой операционной системой. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. Документы ссылаются на соответствующие справочные страницы, которые описывают работу системных вызовов.

Большинство системных вызовов Unix имеют эквивалентные вызовы в Windows, но поведение может отличаться в Windows относительно Linux и macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
