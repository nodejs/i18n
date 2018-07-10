# Guida di stile

* La documentazione è scritta in file markdown con nomi formattati tipo `lowercase-with-dashes.md`. 
  * I caratteri underscore (trattino basso) nei nomi dei file sono consentiti solo quando sono presenti nell'argomento che il documento descriverà (es. `child_process`).
  * Alcuni file, come i file markdown top-level, sono eccezioni.
* Il testo dei documenti dovrebbe andare a capo in modo automatico raggiunti gli 80 caratteri.
* E' preferita la formattazione descritta in `.editorconfig`. 
  * Per alcuni editor è disponibile un [plugin](http://editorconfig.org/#download) che applica automaticamente queste regole.
* I problemi meccanici, come l'ortografia e la grammatica, dovrebbero essere identificati dagli strumenti (tools), nella misura del possibile. Se non identificati da uno strumento, dovrebbero essere segnalati dai revisori umani.
* E' preferita l'ortografia in Inglese Americano. "Capitalizzare" vs. "Capitalizzare", "colore" vs. "colore", ecc.
* Anche se controverso, la [virgola di Oxford](https://en.wikipedia.org/wiki/Serial_comma) è preferita per motivi di chiarezza.
* Generalmente evitare i pronomi personali nei documenti di riferimento ("Io", "tu", "noi"). 
  * I pronomi sono accettabili nei documenti più colloquiali, come le guide.
  * Usa pronomi neutrali e sostantivi non numerabili. Esempi non-esaustivi: 
    * OK: "essi", "loro", "loro", "gente", "persone", "sviluppatori", "gatti"
    * NON OK: "suo", "sua", "lui", "lei", "ragazzi", "amici"
* Quando si combinano elementi di wrapping (parentesi e virgolette), dovrebbe essere messa la punteggiatura finale: 
  * All'interno dell'elemento di wrapping se questo contiene una proposizione completa — un soggetto, un verbo ed un oggetto.
  * Al di fuori dell'elemento di wrapping se questo contiene solo un frammento di una proposizione.
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