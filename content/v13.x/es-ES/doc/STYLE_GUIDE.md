# Guía de estilo

* Documentation is in markdown files with names formatted as `lowercase-with-dashes.md`.
  * Use an underscore in the filename only if the underscore is part of the topic name (e.g., `child_process`).
  * Algunos archivos, cómo los archivos markdown de alto nivel, son excepciones.
* Los documentos deben tener el ajuste de línea en 80 caracteres.
* `.editorconfig` describes the preferred formatting.
  * A [plugin](https://editorconfig.org/#download) is available for some editors to apply these rules.
* Check changes to documentation with `make lint-md`.
* Use American English spelling.
  * OK: _capitalize_, _color_
  * NOT OK: _capitalise_, _colour_
* Utilizar [comas seriales](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns (_I_, _you_, _we_) in reference documentation.
  * Los pronombres personales son aceptables en documentación coloquial, como guías.
  * Utilizar la neutralidad de género en pronombres y verbos plurales.
    * OK: _they_, _their_, _them_, _folks_, _people_, _developers_
    * NOT OK: _his_, _hers_, _him_, _her_, _guys_, _dudes_
* When combining wrapping elements (parentheses and quotes), place terminal punctuation:
  * Inside the wrapping element if the wrapping element contains a complete clause.
  * Por fuera del elemento envolvente si el elemento envolvente contiene solo un fragmento de clausula.
* Los documentos deben comenzar con un encabezado de nivel uno.
* Preferir añadir enlaces a los enlaces de entrada — preferir `[un enlace][]` a `[un enlace](http://ejemplo.com)`.
* When documenting APIs, update the YAML comment associated with the API as appropriate. This is especially true when introducing or deprecating an API.
* Use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Para bloques de código:
  * Use cercas conscientes del lenguaje. ("```js")
  * Code need not be complete. Treat code blocks as an illustration or aid to your point, not as complete running programs. Si es necesario un programa completo en ejecución, inclúyelo como un recurso en `assets/code-examples` y enlázalo.
* When using underscores, asterisks, and backticks, please use backslash-escaping: `\_`, `\*`, and `` \` ``.
* Constructors should use PascalCase.
* Instances should use camelCase.
* Denote methods with parentheses: `socket.end()` instead of `socket.end`.
* Los argumentos de la función o propiedades de un objeto deben usar el siguiente formato:
  * ``* `name` {type|type2} Optional description. **Default:** `value`.``
  <!--lint disable maximum-line-length remark-lint-->
  * For example: <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  <!--lint enable maximum-line-length remark-lint-->
  * El `type` debe referir a un tipo de Node.js o a un [tipo de JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Los retornos de función deben usar el siguiente formato:
  * <code>* Devuelve: {type|type2} Descripción opcional.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* Utilizar el estilo oficial para el uso de mayúsculas en productos y proyectos.
  * OK: JavaScript, Google's V8
  <!--lint disable prohibited-strings remark-lint-->
  * INCORRECTO: Javascript, v8 de Google
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  <!-- lint enable prohibited-strings remark-lint-->
  * When referring to the executable, _`node`_ is acceptable.
* Be direct.
  * OK: The return value is a string.
  <!-- lint disable prohibited-strings remark-lint-->
  * NOT OK: It is important to note that, in all cases, the return value will be a string regardless.
  <!-- lint enable prohibited-strings remark-lint-->

Ver también la descripción de la estructura de documentación de la API en [doctools README](../tools/doc/README.md).
