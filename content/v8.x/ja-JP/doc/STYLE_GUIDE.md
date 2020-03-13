# スタイルガイド

* ドキュメントは、 `lowercase-with-dashes.md` のような命名規則のマークダウンファイルで書きます。
  * ファイル名にアンダースコアを使用できるのは、ドキュメント内でアンダースコアが用いられている場合だけです (例: `child_process`) 。
  * トップレベルのマークダウンファイルなど、一部のファイルは例外です。
* ドキュメントは80文字で折り返す必要があります。
* フォーマットは `.editorconfig` で説明されているものが優先されます。
  * 一部のエディタでは、これらのルールを自動的に適用するための [plugin](http://editorconfig.org/#download) が用意されています。
* 綴りや文法などの機械で解決できる問題は、可能な限りツールで識別する必要があります。 ツーらによって見つけられい場合、人間のレビュワーによって指摘される必要があります。
* アメリカ英語スペルが推奨です。 "Capitalize"と "Capitalise"、 "color"と "colour"等です。
* [シリアルコンマ](https://en.wikipedia.org/wiki/Serial_comma)を使用してください。
* リファレンスドキュメントでは、人称代名詞 ("I", "you", "we") を使わないでください。
  * 人称代名詞はガイドのような口語のドキュメントで使うことができます。
  * ジェンダーナチュラルな代名詞や複数名詞を使ってください。
    * OK: "they", "their", "them", "folks", "people", "developers"
    * NOT OK: "his", "hers", "him", "her", "guys", "dudes"
* 何かを囲む文字 (括弧や引用符) を使う場合、末尾に句読点を付ける必要があります:
  * 囲む文字の中に完全な節 — 主語や動詞、および目的語が含まれている場合は、その中に句読点を付けてください。
  * 囲む文字の中に節の一部だけが含まれている場合は、その外に句読点を付けてください。
* 文の終端の句読点は、囲む文字の内側に付けます。ピリオドは文の最後ではなく、括弧や引用符の内側に付けます。
* ドキュメントはレベル1の見出しで始まる必要があります。 An example document will be linked here eventually.
* インラインリンクよりも外部参照リンクを使ってください。つまり `[a link](http://example.com)` ではなく `[a link][]` を使ってください。
* API を文書化する場合は、セクションの最後の API が導入されたバージョンに気を付けてください。 API が非推奨になった場合には、その API が非推奨になった最初のバージョンにも注意してください。
* [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage) に従って、ダッシュを使用する場合は、スペースで囲まれた [em ダッシュ](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" または macOS 上では `Option+Shift+"-"`) を使用してください。
* アセットを含む場合:
  * イラストやプログラムファイルを追加したい場合には、`assets/` ディレクトリ内の適切なサブディレクトリに追加してください。
  * 次のようにリンクしてください: ファイルベースのアセットの場合には `[Asset](/assets/{subdir}/{filename})` のように、画像ベースのアセットの場合には `![Asset](/assets/{subdir}/{filename})` のようにリンクしてください。
  * イラストは SVG 形式のものを使うようにしてください。 SVG 形式の画像を使用できない場合は、追加するアセットのファイルサイズに注意してください。
* コードブロックについて:
  * コードブロックでは言語の指定をしてください。 ("```js")
  * コードは完全である必要はありません — コードブロックは、実行できる完全なプログラムとしてではなく、例や要点を説明するものとして用います。 実行できる完全なプログラムが必要な場合は、そのプログラムをアセットとして `assets/code-examples` の中に追加して、リンクを貼ってください。
* アンダースコアやアスタリスク、バッククォートを使う場合は、適切なエスケープ文字を使ってください (`_` や `*`、`` ` `` の代わりに `\_` や `\*`、 `` \` ``を使ってください)。
* コンストラクタ関数への参照には、パスカルケースを使用してください。
* コンストラクタのインスタンスへの参照には、キャメルケースを使用してください。
* メソッドへの参照には括弧を一緒に使ってください: 例えば、`socket.end` の代わりに、`socket.end()` を使ってください。
* 特に注意すべき内容については、次のガイドラインに従ってください:
  * "Note:" ラベルを斜体にしてください、つまり `*Note*:` のようにしてください。
  * "Note:" ラベルの後には大文字を使ってください。
  * 視覚的により分かりやすいように、ノートは新しい段落に書いてください。
* 関数の引数やオブジェクトのプロパティには次の形式を使用してください:
  * <code>* \`name\` {type|type2} Optional description. \*\*Default:\*\* \`defaultValue\`.</code>
  * E.g. <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  * `型` は Node.js あるいは [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types) の型を参照してください。
* 関数の返り値は次の形式に従ってください:
  * <code>* Returns: {type|type2} Optional description.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* プロダクトやプロジェクトでは、公式のキャピタライズスタイルに従ってください。
  * OK: JavaScript, Google's V8
  * NOT OK: Javascript, Google's v8
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  * When referring to the executable, _`node`_ is acceptable.

[doctool README](../tools/doc/README.md) にある API ドキュメント構造概要も参照してください。
