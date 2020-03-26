# Pedoman Gaya Penulisan

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * Terdapat pengecualian pada beberapa file, seperti file - file markdown top-level.
* Dokumen harus di-*word-wrapped* pada 80 karakter.
* Lebih baik formatting dideskripsikan di file `.editorconfig`. 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* Setiap perubahan pada dokumentasi harus dicek dengan `make lint-md`.
* Gunakan pelafalan Bahasa Inggris Amerika. "Capitalize" lebih baik dari "Capitalise", "color" vs. "colour", dsb.
* Gunakan [tanda koma](https://en.wikipedia.org/wiki/Serial_comma).
* Hindari kata ganti yang bersifat personal pada referensi dokumentasi ("I", "you", "we"). 
  * Kata ganti yang bersifat personal hanya disetujui pada dokumentasi sehari - hari seperti panduan.
  * Gunakan kata ganti dan kata benda jamak yang netral tanpa mempedulikan jenis kelamin. 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * JANGAN: "his", "hers", "him", "her", "guys", "dudes"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Dokumen harus dimulai dengan heading level satu ( h1 ).
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Masukkan aset - aset: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * Untuk ilustrasi, sebaiknya gunakan file bertipe SVG daripada aset jenis lain. When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* Untuk blok kode: 
  * Gunakan tanda pembatas bahasa pemrogaman. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* Referensi ke fungsi constructor harus menggunakan PascalCase.
* Referensi ke instansi constructor harus menggunakan camelCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Argumen dari fungsi atau properti dari objek harus menggunakan format berikut:
  
  * ``* `name` {type|type2} Optional description. **Default:** `value`.`` <!--lint disable maximum-line-length remark-lint-->
  
  * For example: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code> <!--lint enable maximum-line-length remark-lint-->
  
  * `type` harus sesuai dengan tipe Node.js atau [tipe JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).

* Hasil kembalian dari fungsi harus menggunakan format berikut: 
  * `* Returns: {type|type2} desrkipsi opsional.`
  * Misalnya `* Returns: {AsyncHook} referensi ke <code>asyncHook`.</code>

* Gunakan styling yang resmi untuk pengkapitalisasian dalam produk dan proyek.
  
  * OK: JavaScript, Google's V8 <!--lint disable prohibited-strings remark-lint-->
  
  * NOT OK: Javascript, Google's v8 <!-- lint enable prohibited-strings remark-lint-->

* Use *Node.js* and not *Node*, *NodeJS*, or similar variants.
  
  * When referring to the executable, *`node`* is acceptable.

Lihat juga overview dari struktur dokumentasi API di [doctools README](../tools/doc/README.md).