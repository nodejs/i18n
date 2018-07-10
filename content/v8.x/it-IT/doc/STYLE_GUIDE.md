# Guida di stile

* La documentazione è scritta in file markdown con nomi formattati tipo `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Alcuni file, come i file markdown top-level, sono eccezioni.
* Il testo dei documenti dovrebbe andare a capo in modo automatico raggiunti gli 80 caratteri.
* E' preferita la formattazione descritta in `.editorconfig`. 
  * Per alcuni editor è disponibile un [plugin](http://editorconfig.org/#download) che applica automaticamente queste regole.
* I problemi meccanici, come l'ortografia e la grammatica, dovrebbero essere identificati dagli strumenti (tools), nella misura del possibile. Se non identificati da uno strumento, dovrebbero essere segnalati dai revisori umani.
* E' preferita l'ortografia in Inglese Americano. "Capitalizzare" vs. "Capitalizzare", "colore" vs. "colore", ecc.
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* Generalmente evitare i pronomi personali nei documenti di riferimento ("Io", "tu", "noi"). 
  * I pronomi sono accettabili nei documenti più colloquiali, come le guide.
  * Usa pronomi neutrali e sostantivi non numerabili. Esempi non-esaustivi: 
    * OK: "essi", "loro", "loro", "gente", "persone", "sviluppatori", "gatti"
    * NON OK: "suo", "sua", "lui", "lei", "ragazzi", "amici"
* Quando si combinano elementi di wrapping (parentesi e virgolette), dovrebbe essere messa la punteggiatura finale: 
  * All'interno dell'elemento di wrapping se l'elemento di wrapping contiene una proposizione completa — un soggetto, un verbo ed un oggetto.
  * Al di fuori dell'elemento di wrapping se l'elemento di wrapping contiene solo il frammento di una proposizione.
* Inserire la punteggiatura di fine frase all'interno degli elementi di wrapping — i periodi vanno tra parentesi e virgolette, non dopo.
* I documenti devono iniziare con un'intestazione di livello uno. Eventualmente sarà linkato qui un documento di esempio.
* Preferisci i link di apposizione al posto dei link diretti — preferisci `[un link][]` al posto di `[un link](http://esempio.com)`.
* Quando si documentano le API, annottare, alla fine della sezione, la versione in cui è stata introdotta l'API. Se un'API è stata dichiarata obsoleta, annota anche la prima versione in cui l'API appariva obsoleta.
* Quando utilizzi i trattini, usa gli [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) (trattini lunghi) ("—" oppure `Option+Shift+"-"` su macOS) circondati dagli spazi, come per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Compresi gli assets: 
  * Se si desidera aggiungere un'illustrazione od un programma completo, aggiungerlo alla sub-directory appropriata all'interno della directory `assets/`.
  * Collegati ad essa in questo modo: `[Asset](/assets/{subdir}/{filename})` per gli assets basati sui file e `![Asset](/assets/{subdir}/{filename})` per gli assets basati sulle immagini.
  * Per le illustrazioni, preferisci SVG ad altri assets. Quando SVG non è fattibile, tieni d'occhio la dimensione dell'asset che stai introducendo.
* Per i blocchi di codice: 
  * Usa blocchi consapevoli del linguaggio. ("```js")
  * Il codice non deve essere completo — considera i blocchi di codice come un'illustrazione od un aiuto per il tuo punto, non come programmi completi in esecuzione. Se è necessario un programma completo in esecuzione, includilo come asset in `assets/code-examples` e collegalo ad esso.
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