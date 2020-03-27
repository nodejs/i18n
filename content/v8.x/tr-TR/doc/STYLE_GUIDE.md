# Stil Klavuzu

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Üst düzey markdown dosyaları gibi bazı dosyalar istisnadır.
* Dokümanlar satır sonuna kadar 80 karakterle sınırlı olmalıdır.
* `.editorconfig` 'da açıklanan formatlama tercih edilir. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Mechanical issues, like spelling and grammar, should be identified by tools, insofar as is possible. If not caught by a tool, they should be pointed out by human reviewers.
* Amerikan İngilizcesi yazımı tercih edilir. "Capitalize" vs. "Capitalise", "color" vs. "colour", vb.
* [Seri virgül](https://en.wikipedia.org/wiki/Serial_comma) kullanın.
* Referans belgelerinde kişi zamirlerden kaçının (“Ben”, “sen”, “biz”). 
  * Kişi zamirlerinin kullanımı günlük konuşma diline özgü klavuzlar gibi belgelerde kabul edilir.
  * Cinsiyet belirtmeyen zamirleri ve cinsiyet belirtmeyen çoğul isimleri kullanın. 
    * EVET: "onlar", "onların", "onlar", "millet", "insanlar", "geliştiriciler"
    * TAMAM DEĞİL: "onun", "onunki", "o", "beyler", "ahbaplar"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Place end-of-sentence punctuation inside wrapping elements — periods go inside parentheses and quotes, not after.
* Belgeler birinci seviye bir başlıkla başlamalıdır. An example document will be linked here eventually.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Varlıklar dahil olmak üzere: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * Resimler için, SVG'yi diğer varlıklara tercih edin. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* Kod blokları için: 
  * Dil farkında çitleri kullanın. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* Yapıcı işlevlerine yapılan başvurular PascalCase kullanmalıdır.
* Yapıcı örneklerine yapılan referanslar camelCase kullanmalıdır.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* To draw special attention to a note, adhere to the following guidelines: 
  * Make the "Note:" label italic, i.e. `*Note*:`.
  * Use a capital letter after the "Note:" label.
  * Preferably, make the note a new paragraph for better visual distinction.
* İşlev argümanları veya nesne özellikleri aşağıdaki formatı kullanmalıdır: 
  * `* \<code>isim` {type|type2} İsteğe bağlı açıklama. **Varsayılan:** `varsayılanDeğer`.</code>
  * Örneğin `* <code>byteOffset` {integer} Göstermek için ilk bayt dizini. **Varsayılan:** `0`.</code>
  * `Tür`, bir Node.js türüne veya bir [JavaScript türüne](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types) bakmalıdır.
* Fonksiyon dönüşleri aşağıdaki formatı kullanmalıdır: 
  * `* Dönüşler: {type|type2} İsteğe bağlı açıklama.`
  * Örneğin `* Dönüşler: {AsyncHook} <code>asyncHook`'a bir referans.</code>
* Use official styling for capitalization in products and projects. 
  * OK: JavaScript, Google's V8
  * NOT OK: Javascript, Google's v8
* Use *Node.js* and not *Node*, *NodeJS*, or similar variants. 
  * When referring to the executable, *`node`* is acceptable.

See also API documentation structure overview in [doctools README](../tools/doc/README.md).