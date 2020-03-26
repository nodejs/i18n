# Stijlgids

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Sommige bestanden zijn uitzonderingen, zoals top-level markdown bestanden.
* Documenten moeten worden 'word-wrapped' bij 80 tekens.
* De formattering beschreven in `.editorconfig` heeft de voorkeur. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Veranderingen aan documentatie moet worden gecontroleerd met `make lint-md`.
* Amerikaans-Engelse spelling heeft de voorkeur. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Gebruik [seriële komma's](https://en.wikipedia.org/wiki/Serial_comma).
* Vermijd persoonlijke voornaamwoorden in referentie documentatie ("ik", "jij", "wij"). 
  * Persoonlijke voornaamwoorden zijn acceptabel in informele documentatie, zoals gidsen.
  * Gebruik geslachtsneutrale voornaamwoorden en geslachtsneutrale meervoudige zelfstandige voornaamwoorden. 
    * Ok: "zij", "hun", "hen", "volk", "mensen", "ontwikkelaars"
    * NIET Ok: "zijn", "haar", "hem", "jongens", "kerels"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Documenten moeten beginnen met een niveau 1 titel.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Inbegrepen assets: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * Voor illustraties, geef de voorkeur aan SVG over andere attributen. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* Voor code blokken: 
  * Gebruik taalbewuste barrières. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* Referenties naar onwikkelaarsfuncties moeten PascalCase gebruiken.
* Referenties naar ontwikkelaarsfuncties moeten camelCase gebruiken.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Functie argumenten of onderwerpseigenschappen moeten het volgende format gebruiken:
  
  * ``* `name` {type|type2} Optional description. **Default:** `value`.`` <!--lint disable maximum-line-length remark-lint-->
  
  * For example: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code> <!--lint enable maximum-line-length remark-lint-->
  
  * Het `type` moet refereren naar een Node.js type of een [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).

* Functie resultaten moeten het volgende formaat gebruiken: 
  * `* Resultaat: {type|type2} Optionele beschrijving.`
  * Bijvoorbeeld: `* Resultaat: {AsyncHook} Een referentie naar <code>asyncHook`.</code>

* Gebruik officiële opmaak voor gebruik van hoofdletters in producten en projecten.
  
  * OK: JavaScript, Google's V8 <!--lint disable prohibited-strings remark-lint-->
  
  * NOT OK: Javascript, Google's v8 <!-- lint enable prohibited-strings remark-lint-->

* Use *Node.js* and not *Node*, *NodeJS*, or similar variants.
  
  * When referring to the executable, *`node`* is acceptable.

Zie ook structuur-overzicht van API documentatie in [doctools LEZEN](../tools/doc/README.md).