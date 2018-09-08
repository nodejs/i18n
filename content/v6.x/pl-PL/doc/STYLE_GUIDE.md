# Przewodnik stylu

* Dokumentacja jest pisana w plikach obniżek cenowych z nazwami sformatowanymi jako `małe litery-z-myślnikami.md`. 
  * Podkreślenia w nazwach plików są dozwolone tylko wtedy, gdy są obecne w opisanym dokumencie (np. `child_process`).
  * Niektóre pliki, takie jak najwyższego poziomu obniżki cen, stanowią wyjątki.
* Dokumenty powinny być zawijane w słowa po 80 znakach.
* Preferowane jest formatowanie opisane w `.editorconfig`. 
  * [Wtyczka](http://editorconfig.org/#download) jest dostępna dla niektórych edytorów do automatycznego stosowania tych zasad.
* Problemy mechaniczne, takie jak pisownia i gramatyka, powinny być identyfikowane za pomocą narzędzi, o ile to możliwe. Jeśli nie zostaną złapane przez narzędzie, powinny zostać wskazane przez recenzentów.
* Preferowana jest amerykańska pisownia. "Kapitalizować" vs. "Kapitalizować", "kolor" vs. "kolor", etc.
* Choć kontrowersyjny, [Oxford comma](https://en.wikipedia.org/wiki/Serial_comma) jest preferowany ze względu na jasność.
* Generalnie należy unikać zaimków osobowych w dokumentacji referencyjnej ("ja", "ty", "my"). 
  * Zaimki są dopuszczalne w bardziej potocznej dokumentacji, np. poradników.
  * Używaj zaimków neutralnych płciowo i rzeczowników niepoliczalnych. Nie wyczerpujące przykłady: 
    * OK: "oni", "ich", "oni", "ludzie", "ludziska", "programiści", "koty"
    * NIE OK: "jego", "jej", "mu", "jej", "chłopaki", "kolesie"
* Podczas łączenia elementów wyodrębniających (nawiasy i cudzysłów), ostateczna interpunkcja powinna być umieszczona: 
  * Wewnątrz elementu wyodrębniającego, jeśli element wyodrębniający zawiera kompletną klauzulę - podmiot, czasownik i obiekt.
  * Poza elementem wyodrębniającym, jeśli element wyodrębniający zawiera tylko fragment zdania.
* Wprowadź interpunkcję końca zdania w elementach wyodrębniających - kropki są wewnątrz nawiasów i cytatów, nie po.
* Dokumenty muszą zaczynać się od nagłówka pierwszego poziomu. Przykładowy dokument będzie powiązany tutaj ostatecznie.
* Preferuj dołączać linki od linków w linii - preferuj ` [link] [] </ 0> od
<code> [link] (http://example.com) </ 0>.</li>
<li>Podczas dokumentowania interfejsów API zwróć uwagę na wersję, w której interfejs API został wprowadzony na
koniec sekcji. If an API has been deprecated, also note the first
version that the API appeared deprecated in.</li>
<li>When using dashes, use <a href="https://en.wikipedia.org/wiki/Dash#Em_dash">Em dashes</a> ("—" or <code>Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Including assets: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * For illustrations, prefer SVG to other assets. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* For code blocks: 
  * Use language aware fences. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* Podczas używania podkreśleń, gwiazdek i grawisów użyj odpowiedniego wyjścia (`\_`, `\*` i `` \` `` zamiast `_`,`*` i `` ` ``).
* Odniesienia do funkcji konstruktora powinny korzystać z PascalCase.
* Odniesienia do wystąpień konstruktora powinny korzystać z camelCase.
* W nawiasach należy używać odwołań do metod: na przykład, `socket.end()` zamiast `socket.end`.
* Argumenty funkcji lub właściwości obiektu powinny mieć następujący format: 
  * `* \<code>name` {type|type2} Opcjonalny opis. **Default:** `defaultValue`</code>
  * E.g. `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`</code>
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types)
* Function returns should use the following format: 
  * `* Returns: {type|type2} Optional description.`
  * E.g. `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>