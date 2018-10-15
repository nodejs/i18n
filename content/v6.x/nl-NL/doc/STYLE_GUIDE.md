# Stijlgids

* Documentatie is geschreven in markdown bestanden met namen geformatteerd als `lowercase-with-dashes.md`. 
  * Underscores in bestandsnamen zijn alleen toegestaan wanneer zij aanwezig zijn in het onderwerp wat het document zal beschrijven (bijvoorbeeld: `child_process`).
  * Sommige bestanden zijn uitzonderingen, zoals top-level markdown bestanden.
* Documenten moeten worden 'word-wrapped' bij 80 tekens.
* De formattering beschreven in `.editorconfig` heeft de voorkeur. 
  * Een [plugin](http://editorconfig.org/#download) is beschikbaar voor sommige editors om automatisch deze regels toe te passen.
* Mechanische problemen, zoals spelling en grammatica, moeten door tools worden geïdentificeerd, voor zover dit mogelijk is. Als het niet door een tool wordt opgemerkt, dan zouden menselijke reviewers ze moeten aanwijzen.
* Amerikaans-Engelse spelling heeft de voorkeur. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Howel omstreden, de [Oxford komma](https://en.wikipedia.org/wiki/Serial_comma) heeft de voorkeur ter duidelijkheid.
* In het algemeen, voorkom persoonlijke voornaamwoorden in referentie documentatie ("Ik", "jij", "wij"). 
  * Voornaamwoorden zijn aanvaardbaar in meer informele documentatie, zoals gidsen.
  * Gebruik genderneutrale voornaamwoorden en stofnamen. Non-comprehensive examples: 
    * OK: "they", "their", "them", "folks", "people", "developers", "cats"
    * NOT OK: "his", "hers", "him", "her", "guys", "dudes"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Place end-of-sentence punctuation inside wrapping elements — periods go inside parentheses and quotes, not after.
* Documents must start with a level-one heading. An example document will be linked here eventually.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Including assets: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * For illustrations, prefer SVG to other assets. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* For code blocks: 
  * Use language aware fences. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* References to constructor functions should use PascalCase.
* References to constructor instances should use camelCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Function arguments or object properties should use the following format: 
  * `* \<code>name` {type|type2} Optional description. **Default:** `defaultValue`</code>
  * E.g. `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`</code>
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types)
* Function returns should use the following format: 
  * `* Returns: {type|type2} Optional description.`
  * E.g. `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>