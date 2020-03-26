# スタイルガイド

* Documentation is written in markdown files with names formatted as `lowercase-with-dashes.md`. 
  * Underscores in filenames are allowed only when they are present in the topic the document will describe (e.g. `child_process`).
  * トップレベルのマークダウンファイルなど、一部のファイルは例外です。
* ドキュメントは80文字で折り返す必要があります。
* フォーマットは `.editorconfig` で説明されているものが優先されます。 
  * A [plugin](http://editorconfig.org/#download) is available for some editors to automatically apply these rules.
* ドキュメントに変更を加えるときは、`make lint-md` を実行して確認をしてください。
* アメリカ英語スペルが推奨です。 "Capitalize"と "Capitalise", "color" vs. "colour"等です。
* [シリアルコンマ](https://en.wikipedia.org/wiki/Serial_comma)を使用してください。
* リファレンスドキュメントでは、人称代名詞 ("I", "you", "we") を使わないでください。 
  * 人称代名詞はガイドのような口語のドキュメントで使うことができます。
  * ジェンダーナチュラルな代名詞や複数名詞を使ってください。 
    * OK: "they", "their", "them", "folks", "people", "developers"
    * NOT OK: "his", "hers", "him", "her", "guys", "dudes"
* When combining wrapping elements (parentheses and quotes), terminal punctuation should be placed: 
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* ドキュメントはレベル1の見出しで始まる必要があります。
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* アセットを含む場合: 
  * If you wish to add an illustration or full program, add it to the appropriate sub-directory in the `assets/` dir.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * イラストは SVG 形式のものを使うようにしてください。 When SVG is not feasible, please keep a close eye on the filesize of the asset you're introducing.
* コードブロックについて: 
  * コードブロックでは言語の指定をしてください。 ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* コンストラクタ関数への参照には、パスカルケースを使用してください。
* コンストラクタのインスタンスへの参照には、キャメルケースを使用してください。
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* 関数の引数やオブジェクトのプロパティには次の形式を使用してください:
  
  * ``* `name` {type|type2} Optional description. **Default:** `value`.`` <!--lint disable maximum-line-length remark-lint-->
  
  * For example: `* <code>byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code> <!--lint enable maximum-line-length remark-lint-->
  
  * `型` は Node.js あるいは [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types) の型を参照してください。

* 関数の返り値は次の形式に従ってください: 
  * `* Returns: {type|type2} Optional description.`
  * 例: `* Returns: {AsyncHook} A reference to <code>asyncHook`.</code>

* プロダクトやプロジェクトでは、公式のキャピタライズスタイルに従ってください。
  
  * OK: JavaScript, Google's V8 <!--lint disable prohibited-strings remark-lint-->
  
  * NOT OK: Javascript, Google's v8 <!-- lint enable prohibited-strings remark-lint-->

* Use *Node.js* and not *Node*, *NodeJS*, or similar variants.
  
  * When referring to the executable, *`node`* is acceptable.

[doctool README](../tools/doc/README.md) にある API ドキュメント構造概要も参照してください。