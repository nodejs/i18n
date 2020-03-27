# スタイルガイド

* Documentation is in markdown files with names formatted as `lowercase-with-dashes.md`.
  * Use an underscore in the filename only if the underscore is part of the topic name (e.g., `child_process`).
  * トップレベルのマークダウンファイルなど、一部のファイルは例外です。
* ドキュメントは80文字で折り返す必要があります。
* `.editorconfig` describes the preferred formatting.
  * A [plugin](https://editorconfig.org/#download) is available for some editors to apply these rules.
* Check changes to documentation with `make lint-md`.
* Use American English spelling.
  * OK: _capitalize_, _color_
  * NOT OK: _capitalise_, _colour_
* [シリアルコンマ](https://en.wikipedia.org/wiki/Serial_comma)を使用してください。
* Avoid personal pronouns (_I_, _you_, _we_) in reference documentation.
  * 人称代名詞はガイドのような口語のドキュメントで使うことができます。
  * ジェンダーナチュラルな代名詞や複数名詞を使ってください。
    * OK: _they_, _their_, _them_, _folks_, _people_, _developers_
    * NOT OK: _his_, _hers_, _him_, _her_, _guys_, _dudes_
* When combining wrapping elements (parentheses and quotes), place terminal punctuation:
  * Inside the wrapping element if the wrapping element contains a complete clause.
  * 囲む文字の中に節の一部だけが含まれている場合は、その外に句読点を付けてください。
* ドキュメントはレベル1の見出しで始まる必要があります。
* インラインリンクよりも外部参照リンクを使ってください。つまり `[a link](http://example.com)` ではなく `[a link][]` を使ってください。
* When documenting APIs, update the YAML comment associated with the API as appropriate. This is especially true when introducing or deprecating an API.
* Use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* コードブロックについて:
  * コードブロックでは言語の指定をしてください。 ("```js")
  * Code need not be complete. Treat code blocks as an illustration or aid to your point, not as complete running programs. 実行できる完全なプログラムが必要な場合は、そのプログラムをアセットとして `assets/code-examples` の中に追加して、リンクを貼ってください。
* When using underscores, asterisks, and backticks, please use backslash-escaping: `\_`, `\*`, and `` \` ``.
* Constructors should use PascalCase.
* Instances should use camelCase.
* Denote methods with parentheses: `socket.end()` instead of `socket.end`.
* 関数の引数やオブジェクトのプロパティには次の形式を使用してください:
  * ``* `name` {type|type2} Optional description. **Default:** `value`.``
  <!--lint disable maximum-line-length remark-lint-->
  * For example: <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  <!--lint enable maximum-line-length remark-lint-->
  * `型` は Node.js あるいは [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types) の型を参照してください。
* 関数の返り値は次の形式に従ってください:
  * <code>* Returns: {type|type2} Optional description.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* プロダクトやプロジェクトでは、公式のキャピタライズスタイルに従ってください。
  * OK: JavaScript, Google's V8
  <!--lint disable prohibited-strings remark-lint-->
  * NOT OK: Javascript, Google's v8
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  <!-- lint enable prohibited-strings remark-lint-->
  * When referring to the executable, _`node`_ is acceptable.
* Be direct.
  * OK: The return value is a string.
  <!-- lint disable prohibited-strings remark-lint-->
  * NOT OK: It is important to note that, in all cases, the return value will be a string regardless.
  <!-- lint enable prohibited-strings remark-lint-->

[doctool README](../tools/doc/README.md) にある API ドキュメント構造概要も参照してください。
