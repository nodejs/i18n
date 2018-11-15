# Руководство по стилю

* Документация, написанная в markdown файлах с названиями, отформатированными как `строчные буквы-с-тире.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Некоторые файлы, такие как markdown файлы высокого уровня, являются исключением.
* Переход на новую строку в документах ограничена 80 символами.
* Форматирование, описанное в `.editorconfig`, является предпочтительным. 
  * [plugin](http://editorconfig.org/#download) доступен для некоторых редакторов, чтобы автоматически применять эти правила.
* Changes to documentation should be checked with `make lint-md`.
* Предпочтительна американская орфография английского языка. "Capitalize" против "Capitalise", "color" против "colour", и т. д.
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* Избегайте употребления личных местоимений в справочной документации («я», «вы», «мы»). 
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns. 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * НЕПРАВИЛЬНО: "его", "её", "ему", "ей", "ребята", "чуваки"
* При сочетании парных знаков препинания (скобки и кавычки), завершающий знак препинания должен располагаться: 
  * Внутри парных знаков препинания, если заключенные внутри элементы составляют полное предложение - подлежащее, сказуемое и определение.
  * Вне парных знаков препинания, если внутри заключена только часть предложения.
* Знак, завершающий предложение, помещайте внутри парных знаков препинания - точка ставится внутри скобок и кавычек, не после.
* Документы должны начинаться с заголовка первого уровня.
* Предпочтительно прикреплять ссылки, а не встраивать - предпочтение `[a link][]` к `[a link](http://example.com)`.
* При документировании API, обратите внимание, когда была предоставлена версия API в конце раздела. Если API устарел, обратите также внимание на первую версию, в которой устаревший API появился.
* При использовании тире, используйте [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" или `Option+Shift+"-"` на macOS), окруженный пробелами, согласно с [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Включая активы: 
  * Если вы хотите добавить иллюстрацию или целую программу, добавьте ее к соответствующему подкаталогу в `assets/` dir.
  * Ссылка на это так: `[Asset](/assets/{subdir}/{filename})` для файловых активов, и `![Asset](/assets/{subdir}/{filename})` для активов образов.
  * Для иллюстраций желательно использовать формат SVG. Когда невозможно применить SVG, пожалуйста, внимательно следите за размером файла актива, который вы вставляете.
* Для блоков кода: 
  * Используйте языковые барьеры. ("```js")
  * Код не должен быть полным - рассмотрите блоки кода как иллюстрацию или помощь для вашей точки, а не как полные запущенные программы. Если нужна полная работающая программа, включите ее как актив `assets/code-examples` и сделайте ссылку на него.
* При использовании символов нижнего подчеркивания, звездочки и обратных кавычек, пожалуйста, используйте правильные выделения (`\_`, `\*` и `` \` `` вместо `_`, `*` и `` ` ``).
* Ссылки на функции разработчика должны использовать PascalCase.
* Ссылки на экземпляры разработчика должны использовать PascalCase.
* Ссылки на методы должны быть с использованием скобок: например, `socket.end()` вместо `socket.end`.
* To draw special attention to a note, adhere to the following guidelines: 
  * Make the "Note:" label italic, i.e. `*Note*:`.
  * Use a capital letter after the "Note:" label.
  * Preferably, make the note a new paragraph for better visual distinction.
* Параметры функций и свойства объекта должны использовать следующий формат: 
  * `* \<code>name` {type|type2} Optional description. **Default:** `defaultValue`.</code>
  * Например: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Функция обратной связи должна иметь следующий формат: 
  * `* Returns: {type|type2} Optional description.`
  * Например: `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>
* Use official styling for capitalization in products and projects. 
  * OK: JavaScript, Google's V8
  * NOT OK: Javascript, Google's v8

See also API documentation structure overview in [doctools README](../tools/doc/README.md).