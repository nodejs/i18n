# Style Guide

* Dokumentacja jest pisana w plikach obniżek cenowych z nazwami sformatowanymi jako `małe litery-z-myślnikami.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Some files, such as top-level markdown files, are exceptions.
* Documents should be word-wrapped at 80 characters.
* The formatting described in `.editorconfig` is preferred. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Changes to documentation should be checked with `make lint-md`.
* American English spelling is preferred. "Capitalize" vs. "Kapitalizować", "kolor" vs. "colour", etc.
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns in reference documentation ("I", "you", "we"). 
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns. 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * NOT OK: "his", "hers", "him", "her", "guys", "dudes"
* Podczas łączenia elementów wyodrębniających (nawiasy i cudzysłów), ostateczna interpunkcja powinna być umieszczona: 
  * Wewnątrz elementu wyodrębniającego, jeśli element wyodrębniający zawiera kompletną klauzulę - podmiot, czasownik i obiekt.
  * Poza elementem wyodrębniającym, jeśli element wyodrębniający zawiera tylko fragment zdania.
* Documents must start with a level-one heading.
* Preferuj dołączać linki od linków w linii - preferuj ` [link] [] </ 0> od
<code> [link] (http://example.com) </ 0>.</li>
<li>Podczas dokumentowania interfejsów API zwróć uwagę na wersję, w której interfejs API został wprowadzony na
koniec sekcji. Jeśli interfejs API został uznany za przestarzały, zwróć także uwagę na pierwszą
wersję, w której interfejs API wydawał się przestarzały.</li>
<li>Używając myślników, użyj <a href="https://en.wikipedia.org/wiki/Dash#Em_dash"> kreski Emisji </ 0> ("-" lub <code> Opcja + Shift + "-" </ 1> na macOS)
otoczone spacjami, zgodnie z <a href="https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage"> Przewodnik New York Times po Stylu i Zastosowaniu </ 2>.</li>
<li>Including assets:

<ul>
<li>Jeśli chcesz dodać ilustrację lub pełny program, dodaj go do odpowiedniego podkatalogu
w <code>aktywa/` kat.
* Podłącz do tego jak: `[Zasób](/xasoby/{podkat}/{nazwapliku})` dla zasobów plikowych, i `![Zasób](/xasoby/{podkat}/{nazwapliku})` dla zasobów obrazowych.
* For illustrations, prefer SVG to other assets. Kiedy SVG nie jest możliwe, proszę uważnie śledzić rozmiar pliku zasobów, które wprowadzasz.</li> 

* For code blocks: 
  * Use language aware fences. ("```js")
  * Kod nie musi być pełen — traktuj bloki kodu jako ilustrację lub pomoc dla Twojego stanowiska, nie jako kompletne uruchomione programy. Jeśli konieczne jest pełen uruchomiony program, dołącz go jako zasób w `zasoby/ przykłady-kodów` i umieść link do tego. .
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* References to constructor functions should use PascalCase.
* References to constructor instances should use camelCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Function arguments or object properties should use the following format:
  
  *     * `name` {type|type2} Optional description. **Default:** `value`.
    
    <!--lint disable maximum-line-length remark-lint-->
  
  * For example: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code> <!--lint enable maximum-line-length remark-lint-->
  
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).

* Function returns should use the following format: 
  * `* Returns: {type|type2} Optional description.`
  * E.g. `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>

* Use official styling for capitalization in products and projects.
  
  * OK: JavaScript, Google's V8 <!--lint disable prohibited-strings remark-lint-->
  
  * NOT OK: Javascript, Google's v8 <!-- lint enable prohibited-strings remark-lint-->

* Use *Node.js* and not *Node*, *NodeJS*, or similar variants.
  
  * When referring to the executable, *`node`* is acceptable.</ul> 

See also API documentation structure overview in [doctools README](../tools/doc/README.md).