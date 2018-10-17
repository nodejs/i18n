# Stijlgids

* Documentatie is geschreven in markdown bestanden met namen geformatteerd als `kleineletters-met-koppelteken.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Sommige bestanden zijn uitzonderingen, zoals top-level markdown bestanden.
* Documenten moeten worden 'word-wrapped' bij 80 tekens.
* De formattering beschreven in `.editorconfig` heeft de voorkeur. 
  * Een [plugin](http://editorconfig.org/#download) is beschikbaar voor sommige editors om automatisch deze regels toe te passen.
* Mechanische problemen, zoals spelling en grammatica, moeten door tools worden geïdentificeerd, voor zover dit mogelijk is. Als het niet door een tool wordt opgemerkt, dan zouden menselijke reviewers ze moeten aanwijzen.
* Amerikaans-Engelse spelling heeft de voorkeur. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* In het algemeen, voorkom persoonlijke voornaamwoorden in referentie documentatie ("Ik", "jij", "wij"). 
  * Voornaamwoorden zijn aanvaardbaar in meer informele documentatie, zoals gidsen.
  * Gebruik genderneutrale voornaamwoorden en stofnamen. Niet-uitgebreide voorbeelden: 
    * Ok: "zij", "hun", "hen", "volk", "mensen", "ontwikkelaars", "katten"
    * NIET Ok: "zijn", "haar", "hem", "jongens", "kerels"
* Bij het combineren van verpakkingselementen (haakjes en aanhalingstekens), moet terminaal interpunctie worden geplaatst: 
  * Binnen het verpakkingselement, wanneer het verpakkingselement een volledige component bevat — een onderwerp, werkwoord, en een object.
  * Buiten het verpakkingselement als het verpakkingselement slechts één fragment van een clausule bevat.
* Plaats einde-van-zin interpunctie binnen verpakkingselementen — punten gaan binnen haakjes en quotes, niet erna.
* Documenten moeten beginnen met een niveau 1 titel. Een voorbeelddocument zal hier uiteindelijk worden gelinkt.
* Voorkeur geven aan het aanbrengen van links boven inlining links — voorkeur `[een link][]` boven `[een link](http://voorbeeld.com)`.
* Bij het documenteren van API's, noteer de versie van het geïntroduceerde API aan het einde van het segment. Wanneer een API is verouderd, noteer dan ook de eerste versie waarin de verouderde API is verschenen.
* Bij het gebruik van koppeltekens, gebruik [Em koppeltekens](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" of `Option+Shift+"-"` op macOS) omringd door spaties, overeenkomstig [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Inbegrepen assets: 
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
* To draw special attention to a note, adhere to the following guidelines: 
  * Make the "Note:" label italic, i.e. `*Note*:`.
  * Use a capital letter after the "Note:" label.
  * Preferably, make the note a new paragraph for better visual distinction.
* Function arguments or object properties should use the following format: 
  * `* \<code>name` {type|type2} Optional description. **Default:** `defaultValue`</code>
  * E.g. `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`</code>
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types)
* Function returns should use the following format: 
  * `* Returns: {type|type2} Optional description.`
  * E.g. `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>
* Use official styling for capitalization in products and projects. 
  * OK: JavaScript, Google's V8
  * NOT OK: Javascript, Google's v8