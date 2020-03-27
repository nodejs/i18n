# Руководство по стилю

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Некоторые файлы, такие как markdown файлы высокого уровня, являются исключением.
* Переход на новую строку в документах ограничен 80 символами.
* Форматирование, описанное в `.editorconfig`, является предпочтительным. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Mechanical issues, like spelling and grammar, should be identified by tools, insofar as is possible. If not caught by a tool, they should be pointed out by human reviewers.
* Американский вариант английской орфографии является предпочтительным. "Capitalize", а не "Capitalise", "color" vs. "colour", и т. д.
* Используйте [последовательные запятые](https://en.wikipedia.org/wiki/Serial_comma).
* Избегайте употребления личных местоимений в справочной документации («я», «вы», «мы»). 
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns. 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * НЕПРАВИЛЬНО: "его", "её", "ему", "ей", "ребята", "чуваки"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Place end-of-sentence punctuation inside wrapping elements — periods go inside parentheses and quotes, not after.
* Документы должны начинаться с заголовка первого уровня. An example document will be linked here eventually.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Включая активы: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * Для иллюстраций предпочтительней SVG другим активам. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* Для блоков кода: 
  * Используйте языковые барьеры. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* Ссылки на функции разработчика должны использовать PascalCase.
* Ссылки на экземпляры разработчика должны использовать PascalCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Чтобы привлечь особое внимание к заметке, придерживайтесь следующих рекомендаций: 
  * Сделайте метку "Примечание:" курсивом, например: `*Примечание*:`.
  * Используйте заглавную букву после надписи "Примечание:".
  * Желательно сделать в примечании новый абзац для лучшего визуального различения.
* Параметры функций и свойства объекта должны использовать следующий формат: 
  * `* \<code>name` {type|type2} Optional description. **Default:** `defaultValue`.</code>
  * Например: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  * `тип` должен ссылаться на тип Node.js или [тип JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Функция обратной связи должна иметь следующий формат: 
  * `* Returns: {type|type2} Optional description.`
  * Например: `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>
* Используйте официальный стиль для капитализации в продуктах и проектах. 
  * OK: JavaScript, Google's V8
  * NOT OK: Javascript, Google's v8
* Use *Node.js* and not *Node*, *NodeJS*, or similar variants. 
  * When referring to the executable, *`node`* is acceptable.

See also API documentation structure overview in [doctools README](../tools/doc/README.md).