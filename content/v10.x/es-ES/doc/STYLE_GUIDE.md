# Guía de estilo

* La documentación debe ser escrita en archivos markdown respetando el formato de nomenclatura `minuscula-con-guiones.md`.
  * Los guiones bajos en los nombres de archivo están permitidos sólo cuando se encuentran en el tema que el documento describe (por ejemplo, `child_process`).
  * Algunos archivos, cómo los archivos markdown de alto nivel, son excepciones.
* Los documentos deben tener el ajuste de línea en 80 caracteres.
* Se prefiere el formato descrito en `.editorconfig`.
  * Un [plugin](http://editorconfig.org/#download) de formato automático para aplicar estas reglas, esta disponible para algunos editores.
* Los cambios a la documentación deben ser verificados con `make link-md`.
* Se prefiere la ortografía del inglés americano. "Capitalize" vs. "Capitalise", "color" vs. "colour", etc.
* Utilizar [comas seriales](https://en.wikipedia.org/wiki/Serial_comma).
* Evitar pronombres personales en la documentación de referencia ("Yo", "usted", "nosotros").
  * Los pronombres personales son aceptables en documentación coloquial, como guías.
  * Utilizar la neutralidad de género en pronombres y verbos plurales.
    * CORRECTO: "ellos", "suyo", "personas", "gente", "desarrolldores"
    * INCORRECTO: "él", "ella", "de él", "de ella", "chicos", "tipos"
* Al combinar elementos envolventes (paréntesis y comillas), se deberá utilizar puntuación terminal:
  * Dentro del elemento envolvente si el elemento envolvente contiene una clausula completa— un sujeto, un verbo y un objeto.
  * Por fuera del elemento envolvente si el elemento envolvente contiene solo un fragmento de clausula.
* Los documentos deben comenzar con un encabezado de nivel uno.
* Preferir añadir enlaces a los enlaces de entrada — preferir `[un enlace][]` a `[un enlace](http://ejemplo.com)`.
* Cuando se documenten APIs, indicar la versión en que la API fue introducida al final de la sección. Si una API fue deprecada, también notar la primera versión en la cual dicha API apareció deprecada por primera vez.
* Cuando se usan guiones, use [guiones largos](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" o `Option+Shift+"-"` en macOS) rodeado por espacios, según por [El manual de The New Times de Estilo y Uso](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Recursos incluidos:
  * Si desea añadir una ilustración o un programa completo, añadir al sub-directorio apropiado en el directorio `recursos/`.
  * Enlázalo como: `[Asset](/assets/{subdir}/{filename})` para archivos basados en recursos, y `![Asset](/assets/{subdir}/{filename})` para recursos basados en imágenes.
  * Para ilustraciones, prefiera SVG a otros recursos. Cuando el SVG no es factible, por favor, vigile de cerca el tamaño del archivo del recurso que está introduciendo.
* Para bloques de código:
  * Use cercas conscientes del lenguaje. ("```js")
  * El código no debe estar completo — trate los bloques de código como una ilustración o ayude a su punto, no como programas completos en ejecución. Si es necesario un programa completo en ejecución, inclúyelo como un recurso en `assets/code-examples` y enlázalo.
* Cuando se usan guiones bajos, asteriscos, y comillas simples invertidas, por favor, utilice el escape adecuado (`\_`, `\*` y `` \` `` en lugar de `_`, `*` y `` ` ``).
* Las referencias para las funciones de constructor deben usar PascalCase.
* Las referencias para las funciones de constructor deben usar CamelCase.
* Las referencias a los métodos deben ser usadas con paréntesis: por ejemplo, `socket.end()` en lugar de `socket.end`.
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
  * NOT OK: Javascript, Google's v8
  <!-- lint enable prohibited-strings remark-lint-->
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  * When referring to the executable, _`node`_ is acceptable.

Ver también la descripción de la estructura de documentación de la API en [doctools README](../tools/doc/README.md).
