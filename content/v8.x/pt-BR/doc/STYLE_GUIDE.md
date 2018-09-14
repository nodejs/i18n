# Guia de Estilos

* Documentação escrita em arquivos de markdown com nomes formatados em letras `minusculas-com-hifens.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Alguns arquivos, como os arquivos markdown de nível superior, são exceções.
* Documentos devem ter quebra de palavras (word-wrap) em 80 caracteres.
* A formatação descrita no `.editorconfig` é preferencial. 
  * Um [plugin](http://editorconfig.org/#download) está disponível para alguns editores que aplicam automaticamente estas regras.
* Problemas mecânicos, como a ortografia e a gramática, devem ser identificados por ferramentas, na medida em que for possível. Se não for pego por uma ferramenta, então deverá ser apontado aos revisores humanos.
* Ortografia do Inglês Americano de preferência (Na documentação original). "Capitalize" ao invés de "Capitalise", "color" ao invés de "colour", etc.
* Use [serial commas](https://en.wikipedia.org/wiki/Serial_comma).
* Em geral, evitar pronomes pessoais na documentação de referência ("Eu", "você", "nós"). 
  * Pronomes são aceitáveis na documentação mais coloquial, como os guias.
  * Use substantivos massivos e pronomes de gênero neutro. Exemplos não abrangentes: 
    * CERTO: "eles(as)", "seus", "lhes", "pessoal", "pessoas", "desenvolvedores(as)", "gatos(as)"
    * ERRADO: "ele", "dela", "ele", "ela", "rapazes", "caras"
* Ao combinar elementos de envolvimento (parênteses e aspas), a pontuação final deve ser colocada: 
  * Dentro do elemento envolto se o elemento de quebra contém uma cláusula completa — um sujeito, verbo e um objeto.
  * Fora do elemento envolto se o elemento de quebra contém apenas um fragmento de uma cláusula.
* Coloque a pontuação de fim-de-frase dentro dos elementos envoltos — pontos finais vão dentro de parênteses e aspas, não depois.
* Documentos devem começar com um título de nível 1. Eventualmente um documento de exemplo será linkado aqui.
* Dê preferência em afixar links para endereços inline — preferir `[um link][]` ao invés de `[um link](http://exemplo.com)`.
* Quando documentar APIs, observe que a versão da API foi introduzida no fim da seção. Se uma API foi descontinuada, anotar também a primeira versão que a API foi descontinuada.
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