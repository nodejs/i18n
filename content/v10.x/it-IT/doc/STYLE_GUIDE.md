# Guida di stile

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Alcuni file, come i file markdown top-level, sono eccezioni.
* Il testo dei documenti dovrebbe andare a capo in modo automatico raggiunti gli 80 caratteri.
* E' preferita la formattazione descritta in `.editorconfig`. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Le modifiche alla documentazione dovrebbero essere marcate con `fare lint-md`.
* E' preferita l'ortografia in Inglese Americano. "Capitalizzare" vs. "Capitalise", "color" vs. "colore", ecc.
* Usare la [virgola di Oxford](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns in reference documentation ("I", "you", "we"). 
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns. 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * NON OK: "suo", "sua", "lui", "lei", "ragazzi", "amici"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* I documenti devono iniziare con un'intestazione di livello uno.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Compresi gli assets: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * Per le illustrazioni, preferisci SVG ad altri assets. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* Per i blocchi di codice: 
  * Usa blocchi consapevoli del linguaggio. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* I riferimenti alle funzioni del costruttore dovrebbero utilizzare PascalCase.
* I riferimenti alle istanze del costruttore dovrebbero usare camelCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Gli argomenti della funzione o le proprietà dell'oggetto devono utilizzare il seguente formato:
  
  * ``* `name` {type|type2} Optional description. **Default:** `value`.`` <!--lint disable maximum-line-length remark-lint-->
  
  * For example: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code> <!--lint enable maximum-line-length remark-lint-->
  
  * Il `tipo` dovrebbe fare riferimento ad un tipo Node.js oppure ad un [tipo JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).

* I returns delle funzioni dovrebbero utilizzare il seguente formato: 
  * `* Returns: {type|type2} Descrizione facoltativa.`
  * Es. `* Returns: {AsyncHook} Un riferimento a <code>asyncHook`.</code>

* Use official styling for capitalization in products and projects.
  
  * OK: JavaScript, Google's V8 <!--lint disable prohibited-strings remark-lint-->
  
  * NOT OK: Javascript, Google's v8 <!-- lint enable prohibited-strings remark-lint-->

* Use *Node.js* and not *Node*, *NodeJS*, or similar variants.
  
  * When referring to the executable, *`node`* is acceptable.

See also API documentation structure overview in [doctools README](../tools/doc/README.md).