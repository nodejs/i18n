# Pedoman Gaya Penulisan

* Documentation is in markdown files with names formatted as `lowercase-with-dashes.md`.
  * Use an underscore in the filename only if the underscore is part of the topic name (e.g., `child_process`).
  * Terdapat pengecualian pada beberapa file, seperti file - file markdown top-level.
* Dokumen harus di-*word-wrapped* pada 80 karakter.
* `.editorconfig` describes the preferred formatting.
  * A [plugin](https://editorconfig.org/#download) is available for some editors to apply these rules.
* Check changes to documentation with `make lint-md`.
* Use American English spelling.
  * OK: _capitalize_, _color_
  * NOT OK: _capitalise_, _colour_
* Gunakan [tanda koma](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns (_I_, _you_, _we_) in reference documentation.
  * Kata ganti yang bersifat personal hanya disetujui pada dokumentasi sehari - hari seperti panduan.
  * Gunakan kata ganti dan kata benda jamak yang netral tanpa mempedulikan jenis kelamin.
    * OK: _they_, _their_, _them_, _folks_, _people_, _developers_
    * NOT OK: _his_, _hers_, _him_, _her_, _guys_, _dudes_
* When combining wrapping elements (parentheses and quotes), place terminal punctuation:
  * Inside the wrapping element if the wrapping element contains a complete clause.
  * Dalam elemen yang membungkus jika elemen pembungkus hanya memiliki sebagian fragmen dari suatu klausa.
* Dokumen harus dimulai dengan heading level satu ( h1 ).
* Lebih baik gunakan link affixing daripada link inlining —lebih baik gunakan `[a link][]` daripada `[a link](http://example.com)`.
* When documenting APIs, update the YAML comment associated with the API as appropriate. This is especially true when introducing or deprecating an API.
* Use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* Untuk blok kode:
  * Gunakan tanda pembatas bahasa pemrogaman. ("```js")
  * Code need not be complete. Treat code blocks as an illustration or aid to your point, not as complete running programs. Jika sebuah program lengkap sepenuhnya memang diperlukan, tambahkan saja sebagai aset pada `assets/code-examples` dan pasang link yang sesuai pada teks tersebut.
* When using underscores, asterisks, and backticks, please use backslash-escaping: `\_`, `\*`, and `` \` ``.
* Constructors should use PascalCase.
* Instances should use camelCase.
* Denote methods with parentheses: `socket.end()` instead of `socket.end`.
* Argumen dari fungsi atau properti dari objek harus menggunakan format berikut:
  * ``* `name` {type|type2} Optional description. **Default:** `value`.``
  <!--lint disable maximum-line-length remark-lint-->
  * For example: <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  <!--lint enable maximum-line-length remark-lint-->
  * `type` harus sesuai dengan tipe Node.js atau [tipe JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Hasil kembalian dari fungsi harus menggunakan format berikut:
  * <code>* Returns: {type|type2} desrkipsi opsional.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* Gunakan styling yang resmi untuk pengkapitalisasian dalam produk dan proyek.
  * OK: JavaScript, Google's V8
  <!--lint disable prohibited-strings remark-lint-->
  * JANGAN: Javascript, Google's v8
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  <!-- lint enable prohibited-strings remark-lint-->
  * When referring to the executable, _`node`_ is acceptable.
* Be direct.
  * OK: The return value is a string.
  <!-- lint disable prohibited-strings remark-lint-->
  * NOT OK: It is important to note that, in all cases, the return value will be a string regardless.
  <!-- lint enable prohibited-strings remark-lint-->

Lihat juga overview dari struktur dokumentasi API di [doctools README](../tools/doc/README.md).
