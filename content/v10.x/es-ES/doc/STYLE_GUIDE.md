# Guía de estilos

* La documentación debe ser escrita en archivos markdown respetando el formato de nomenclatura `minuscula-con-guiones.md`. 
  * Los guiones bajos en los nombres de archivo están permitidos solo cuando se encuentren en el tópico que el documento va a describir (p.ej `child_process`).
  * Algunos archivos, como archivos markdown de alto nivel, constituyen excepciones.
* Los documentos deben tener el ajuste de línea en 80 caracteres.
* Se prefiere el formato descrito en `.editorconfig`. 
  * Un [plugin](http://editorconfig.org/#download) de formato automático para aplicar estas reglas, esta disponible para algunos editores.
* Los cambios a la documentación deben ser verificados con `make link-md`.
* American English spelling is preferred. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Utilizar [comas seriales](https://en.wikipedia.org/wiki/Serial_comma).
* Evitar pronombres personales en la documentación de referencia ("Yo", "usted", "nosotros"). 
  * Los pronombres personales son aceptables en documentación coloquial, como guías.
  * Utilizar la neutralidad de género en pronombres y verbos plurales. 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * NOT OK: "his", "hers", "him", "her", "guys", "dudes"
* Al combinar elementos envolventes (paréntesis y comillas), se deberá utilizar puntuación terminal: 
  * Dentro del elemento envolvente si el elemento envolvente contiene una clausula completa— un sujeto, un verbo y un objeto.
  * Por fuera del elemento envolvente si el elemento envolvente contiene solo un fragmento de clausula.
* Colocar puntuación para el fin de una oración dentro de los elementos envolventes — los puntos van dentro de los paréntesis y las comillas, no después.
* Los documentos deben comenzar con un encabezado de nivel uno.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* Cuando se documenten APIs, indicar la versión en que la API fue introducida al final de la sección. Si una API fue deprecada, también notar la primera versión en la cual dicha API apareció deprecada por primera vez.
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
  * `* \<code>name` {type|type2} Optional description. **Default:** `defaultValue`.</code>
  * E.g. `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Function returns should use the following format: 
  * `* Returns: {type|type2} Optional description.`
  * E.g. `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>
* Utilizar el estilo oficial para el uso de mayúsculas en productos y proyectos. 
  * CORRECTO: JavaScript, V8 de Google
  * INCORRECTO: Javascript, v8 de Google

See also API documentation structure overview in [doctools README](../tools/doc/README.md).