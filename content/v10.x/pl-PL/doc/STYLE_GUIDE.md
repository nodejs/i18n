# Przewodnik stylu

* Dokumentacja jest pisana w plikach obniżek cenowych z nazwami sformatowanymi jako `małe litery-z-myślnikami.md`.
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Niektóre pliki, takie jak najwyższego poziomu obniżki cen, stanowią wyjątki.
* Dokumenty powinny być zawijane w słowa po 80 znakach.
* Preferowane jest formatowanie opisane w `.editorconfig`.
  * [Wtyczka](http://editorconfig.org/#download) jest dostępna dla niektórych edytorów do automatycznego stosowania tych zasad.
* Changes to documentation should be checked with `make lint-md`.
* Preferowana jest amerykańska pisownia. "Kapitalizować" vs. "Kapitalizować", "kolor" vs. "kolor", etc.
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns in reference documentation ("I", "you", "we").
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns.
    * OK: "they", "their", "them", "folks", "people", "developers"
    * NIE OK: "jego", "jej", "mu", "jej", "chłopaki", "kolesie"
* Podczas łączenia elementów wyodrębniających (nawiasy i cudzysłów), ostateczna interpunkcja powinna być umieszczona:
  * Wewnątrz elementu wyodrębniającego, jeśli element wyodrębniający zawiera kompletną klauzulę - podmiot, czasownik i obiekt.
  * Poza elementem wyodrębniającym, jeśli element wyodrębniający zawiera tylko fragment zdania.
* Dokumenty muszą zaczynać się od nagłówka pierwszego poziomu.
* Preferuj dołączać linki od linków w linii - preferuj ` [link] [] </ 0> od
<code> [link] (http://example.com) </ 0>.</p></li>
<li><p spaces-before="0">Podczas dokumentowania interfejsów API zwróć uwagę na wersję, w której interfejs API został wprowadzony na
koniec sekcji. Jeśli interfejs API został uznany za przestarzały, zwróć także uwagę na pierwszą
wersję, w której interfejs API wydawał się przestarzały.</p></li>
<li><p spaces-before="0">Używając myślników, użyj <a href="https://en.wikipedia.org/wiki/Dash#Em_dash"> kreski Emisji </ 0> ("-" lub <code> Opcja + Shift + "-" </ 1> na macOS)
otoczone spacjami, zgodnie z <a href="https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage"> Przewodnik New York Times po Stylu i Zastosowaniu </ 2>.</p></li>
<li><p spaces-before="0">W tym aktywa:</p>

<ul>
<li>Jeśli chcesz dodać ilustrację lub pełny program, dodaj go do odpowiedniego podkatalogu
w <code>aktywa/` kat.</li>
  * Podłącz do tego jak: `[Zasób](/xasoby/{podkat}/{nazwapliku})` dla zasobów plikowych, i `![Zasób](/xasoby/{podkat}/{nazwapliku})` dla zasobów obrazowych.
  * Dla ilustracji, preferuj SVG od innych zasobów. Kiedy SVG nie jest możliwe, proszę uważnie śledzić rozmiar pliku zasobów, które wprowadzasz.</ul></li>
* Dla bloków kodu:
  * Używaj zapór wrażliwych językowo. ("```js")
  * Kod nie musi być pełen — traktuj bloki kodu jako ilustrację lub pomoc dla Twojego stanowiska, nie jako kompletne uruchomione programy. Jeśli konieczne jest pełen uruchomiony program, dołącz go jako zasób w `zasoby/ przykłady-kodów` i umieść link do tego. .
* Podczas używania podkreśleń, gwiazdek i grawisów użyj odpowiedniego wyjścia (`\_`, `\*` i `` \` `` zamiast `_`,`*` i `` ` ``).
* Odniesienia do funkcji konstruktora powinny korzystać z PascalCase.
* Odniesienia do wystąpień konstruktora powinny korzystać z camelCase.
* W nawiasach należy używać odwołań do metod: na przykład, `socket.end()` zamiast `socket.end`.
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
  <!-- lint enable prohibited-strings remark-lint-->
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  * When referring to the executable, _`node`_ is acceptable.</ul>

See also API documentation structure overview in [doctools README](../tools/doc/README.md).
