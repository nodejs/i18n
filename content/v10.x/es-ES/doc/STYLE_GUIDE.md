# Guía de estilo

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Algunos archivos, como archivos markdown de alto nivel, constituyen excepciones.
* Los documentos deben tener el ajuste de línea en 80 caracteres.
* Se prefiere el formato descrito en `.editorconfig`. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Los cambios a la documentación deben ser verificados con `make link-md`.
* Se prefiere la ortografía del inglés americano. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Utilizar [comas seriales](https://en.wikipedia.org/wiki/Serial_comma).
* Evitar pronombres personales en la documentación de referencia ("Yo", "usted", "nosotros"). 
  * Los pronombres personales son aceptables en documentación coloquial, como guías.
  * Utilizar la neutralidad de género en pronombres y verbos plurales. 
    * CORRECTO: "ellos", "suyo", "personas", "gente", "desarrolldores"
    * INCORRECTO: "él", "ella", "de él", "de ella", "chicos", "tipos"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Los documentos deben comenzar con un encabezado de nivel uno.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Recursos incluidos: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * Para ilustraciones, prefiera SVG a otros recursos. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* Para bloques de código: 
  * Use cercas conscientes del lenguaje. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* Las referencias para las funciones de constructor deben usar PascalCase.
* Las referencias para las funciones de constructor deben usar CamelCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Los argumentos de la función o propiedades de un objeto deben usar el siguiente formato:
  
  * ``* `name` {type|type2} Optional description. **Default:** `value`.`` <!--lint disable maximum-line-length remark-lint-->
  
  * For example: `* <code>byteOffset` {integer} Index of first byte to expose. **Predeterminado:** `0`.</code> <!--lint enable maximum-line-length remark-lint-->
  
  * El `type` debe referir a un tipo de Node.js o a un [tipo de JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).

* Los retornos de función deben usar el siguiente formato: 
  * `* Devuelve: {type|type2} Descripción opcional.`
  * P.e. `* Devuelce: {AsyncHook} Una referencia a <code>asyncHook`.</code>

* Utilizar el estilo oficial para el uso de mayúsculas en productos y proyectos.
  
  * OK: JavaScript, Google's V8 <!--lint disable prohibited-strings remark-lint-->
  
  * NOT OK: Javascript, Google's v8 <!-- lint enable prohibited-strings remark-lint-->

* Use *Node.js* and not *Node*, *NodeJS*, or similar variants.
  
  * When referring to the executable, *`node`* is acceptable.

Ver también la descripción de la estructura de documentación de la API en [doctools README](../tools/doc/README.md).