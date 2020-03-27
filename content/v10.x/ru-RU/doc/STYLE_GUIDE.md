# Руководство по стилю

* Документация написана в markdown файлах с названиями, отформатированными как `строчные буквы-с-тире.md`.
  * Подчеркивания в названии файла допускается только, когда они присутствуют в теме, о которой пойдет речь в документе (например, `child_process`).
  * Некоторые файлы, такие как markdown файлы высокого уровня, являются исключением.
* Переход на новую строку в документах ограничен 80 символами.
* Форматирование, описанное в `.editorconfig`, является предпочтительным.
  * [plugin](http://editorconfig.org/#download) доступен для некоторых редакторов, чтобы автоматически применять эти правила.
* Changes to documentation should be checked with `make lint-md`.
* Американский вариант английской орфографии является предпочтительным. "Capitalize", а не "Capitalise", "color", а не "colour", и т. д.
* Используйте [последовательные запятые](https://en.wikipedia.org/wiki/Serial_comma).
* Избегайте употребления личных местоимений в справочной документации («я», «вы», «мы»).
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns.
    * OK: "they", "their", "them", "folks", "people", "developers"
    * НЕПРАВИЛЬНО: "его", "её", "ему", "ей", "ребята", "чуваки"
* При сочетании парных знаков препинания (скобки и кавычки), завершающий знак препинания должен располагаться:
  * Внутри парных знаков препинания, если заключенные внутри элементы составляют полное предложение - подлежащее, сказуемое и определение.
  * Вне парных знаков препинания, если внутри заключена только часть предложения.
* Документы должны начинаться с заголовка первого уровня.
* Предпочтительно прикреплять ссылки, а не встраивать их - предпочтение отдается`[a link][]` перед`[a link](http://example.com)`.
* При документировании API, обратите внимание на версию, которая предоставлена в конце раздела. Если API устарел, обратите также внимание на первую версию, в которой API устарел.
* При использовании тире, используйте [длинное тире](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" или `Option+Shift+"-"` на macOS), окруженное пробелами, согласно [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Включая активы:
  * Если вы хотите добавить иллюстрацию или целую программу, добавьте ее к соответствующему подкаталогу в `активы/` dir.
  * Ссылка выглядит так: `[Asset](/активы/{subdir}/{filename})` для файловых активов, и `![Asset](/активы/{subdir}/{filename})` для активов образов.
  * Для иллюстраций предпочтительней SVG другим активам. Когда невозможно применить SVG, пожалуйста, внимательно следите за размером файла актива, который вы вставляете.
* Для блоков кода:
  * Используйте языковые барьеры. ("```js")
  * Код не должен быть полным - рассмотрите блоки кода как иллюстрацию или помощь вас, а не как полные запущенные программы. Если нужна полная работающая программа, включите ее как актив `assets/code-examples` и сделайте ссылку на него.
* При использовании символов нижнего подчеркивания, звездочки и обратных кавычек, пожалуйста, используйте правильные выделения (`\_`, `\*` и `` \` `` вместо `_`, `*` и `` ` ``).
* Ссылки на функции разработчика должны использовать PascalCase.
* Ссылки на экземпляры разработчика должны использовать PascalCase.
* Ссылки на методы должны быть с использованием скобок: например, `socket.end()` вместо `socket.end`.
* Параметры функций и свойства объекта должны использовать следующий формат:
  * ``* `name` {type|type2} Optional description. **Default:** `value`.``
  <!--lint disable maximum-line-length remark-lint-->
  * For example: <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  <!--lint enable maximum-line-length remark-lint-->
  * `тип` должен ссылаться на тип Node.js или [тип JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Функция обратной связи должна иметь следующий формат:
  * <code>* Returns: {type|type2} Optional description.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* Используйте официальный стиль для капитализации в продуктах и проектах.
  * OK: JavaScript, Google's V8
  <!--lint disable prohibited-strings remark-lint-->
  * NOT OK: Javascript, Google's v8
  <!-- lint enable prohibited-strings remark-lint-->
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  * When referring to the executable, _`node`_ is acceptable.

See also API documentation structure overview in [doctools README](../tools/doc/README.md).
