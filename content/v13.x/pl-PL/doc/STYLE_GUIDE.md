# Przewodnik stylu

* Documentation is in markdown files with names formatted as `lowercase-with-dashes.md`.
  * Use an underscore in the filename only if the underscore is part of the topic name (e.g., `child_process`).
  * Niektóre pliki, takie jak najwyższego poziomu obniżki cen, stanowią wyjątki.
* Dokumenty powinny być zawijane w słowa po 80 znakach.
* `.editorconfig` describes the preferred formatting.
  * A [plugin](https://editorconfig.org/#download) is available for some editors to apply these rules.
* Check changes to documentation with `make lint-md`.
* Use American English spelling.
  * OK: _capitalize_, _color_
  * NOT OK: _capitalise_, _colour_
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns (_I_, _you_, _we_) in reference documentation.
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns.
    * OK: _they_, _their_, _them_, _folks_, _people_, _developers_
    * NOT OK: _his_, _hers_, _him_, _her_, _guys_, _dudes_
* When combining wrapping elements (parentheses and quotes), place terminal punctuation:
  * Inside the wrapping element if the wrapping element contains a complete clause.
  * Poza elementem wyodrębniającym, jeśli element wyodrębniający zawiera tylko fragment zdania.
* Dokumenty muszą zaczynać się od nagłówka pierwszego poziomu.
* Preferuj dołączać linki od linków w linii - preferuj ` [link] [] </ 0> od
<code> [link] (http://example.com) </ 0>.</p></li>
<li><p spaces-before="0">When documenting APIs, update the YAML comment associated with the API as
appropriate. This is especially true when introducing or deprecating an API.</p></li>
<li><p spaces-before="0">Use <a href="https://en.wikipedia.org/wiki/Dash#Em_dash">Em dashes</a> ("—" or <code>Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Dla bloków kodu:
  * Używaj zapór wrażliwych językowo. ("```js")
  * Code need not be complete. Treat code blocks as an illustration or aid to your point, not as complete running programs. Jeśli konieczne jest pełen uruchomiony program, dołącz go jako zasób w `zasoby/ przykłady-kodów` i umieść link do tego. .
* When using underscores, asterisks, and backticks, please use backslash-escaping: `\_`, `\*`, and `` \` ``.
* Constructors should use PascalCase.
* Instances should use camelCase.
* Denote methods with parentheses: `socket.end()` instead of `socket.end`.
* Argumenty funkcji lub właściwości obiektu powinny mieć następujący format:
  * ``* `name` {type|type2} Optional description. **Default:** `value`.``
  <!--lint disable maximum-line-length remark-lint-->
  * For example: <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  <!--lint enable maximum-line-length remark-lint-->
  * `Typu` powinno odnosić się do typu Node.js lub [typu JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Funkcja zwrotna powinna używać następującego formatu:
  * <code>* Zwrot: {typ|typ2} Opcjonalny opis.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* Use official styling for capitalization in products and projects.
  * OK: JavaScript, Google's V8
  <!--lint disable prohibited-strings remark-lint-->
  * NOT OK: Javascript, Google's v8
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  <!-- lint enable prohibited-strings remark-lint-->
  * When referring to the executable, _`node`_ is acceptable.
* Be direct.
  * OK: The return value is a string.
  <!-- lint disable prohibited-strings remark-lint-->
  * NOT OK: It is important to note that, in all cases, the return value will be a string regardless.
  <!-- lint enable prohibited-strings remark-lint-->

See also API documentation structure overview in [doctools README](../tools/doc/README.md).
