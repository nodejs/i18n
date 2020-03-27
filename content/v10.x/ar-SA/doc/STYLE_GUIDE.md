# دليل التنسيق

* كتبت الوثائق ب"markdown" والملفات سميت على شكل `lowercase-with-dashes.md`.
  * سطر السفلي في أسماء الملفات مسموح به فقط عندما يكون موجود في موضوع سوف تصفه الوثيقة (مثال: `child_process`).
  * بعض الملفات، مثل ملفات المستوى العالي "markdown"، هي استثناءات.
* يجب أن تكون المستندات بالكلمات مربوطة في 80 حرف.
* البنية الموصوف في `.editorconfig` هي المفضلة.
  * في بعض المحررات النصوص تتوفر [ الإضافة ](http://editorconfig.org/#download) لتطبيق هذه قواعد تلقائيًا.
* Changes to documentation should be checked with `make lint-md`.
* التهجئة الإنجليزي الأمريكي المفضلة. "Capitalize" ضد. "Capitalise"، "color" ضد. "colour"، إلخ.
* استخدم [ سلسلة فواصل ](https://en.wikipedia.org/wiki/Serial_comma).
* Avoid personal pronouns in reference documentation ("I", "you", "we").
  * Personal pronouns are acceptable in colloquial documentation such as guides.
  * Use gender-neutral pronouns and gender-neutral plural nouns.
    * OK: "they", "their", "them", "folks", "people", "developers"
    * ليس جيد: "له" ، "لها" ، "هو" ، "هي" ، "شباب" ، "رجال"
* عند ضم و تَطْوِيق العناصر (العلامات الحصر و علامات الاقتباس)، terminal يجب وضع علامات الترقيم:
  * Inside the wrapping element if the wrapping element contains a complete clause — a subject, verb, and an object.
  * Outside of the wrapping element if the wrapping element contains only a fragment of a clause.
* Documents must start with a level-one heading.
* Prefer affixing links to inlining links — prefer `[a link][]` to `[a link](http://example.com)`.
* When documenting APIs, note the version the API was introduced in at the end of the section. If an API has been deprecated, also note the first version that the API appeared deprecated in.
* When using dashes, use [Em dashes](https://en.wikipedia.org/wiki/Dash#Em_dash) ("—" or `Option+Shift+"-"` on macOS) surrounded by spaces, as per [The New York Times Manual of Style and Usage](https://en.wikipedia.org/wiki/The_New_York_Times_Manual_of_Style_and_Usage).
* إدراج الملفات:
  * إذا كنت ترغب في إضافة رسم توضيحي أو برنامج كامل ، فأضفه إلى داخل الملف الفرعي `assets/`.
  * Link to it like so: `[Asset](/assets/{subdir}/{filename})` for file-based assets, and `![Asset](/assets/{subdir}/{filename})` for image-based assets.
  * بالنسبة إلى الرسوم التوضيحية، تفضل SVG على الملفات الأخرى. عندما يكون SVG غير ظاهر، رجاء إبقاء عينك على حجم الملفك الأصلي الذي قدمته.
* لفقرات الكود:
  * استخدام الأسوار لتعريف باللغة البرمجة. ("```js")
  * Code need not be complete — treat code blocks as an illustration or aid to your point, not as complete running programs. If a complete running program is necessary, include it as an asset in `assets/code-examples` and link to it.
* When using underscores, asterisks, and backticks, please use proper escaping (`\_`, `\*` and `` \` `` instead of `_`, `*` and `` ` ``).
* References to constructor functions should use PascalCase.
* References to constructor instances should use camelCase.
* References to methods should be used with parentheses: for example, `socket.end()` instead of `socket.end`.
* Function arguments or object properties should use the following format:
  * ``* `name` {type|type2} Optional description. **Default:** `value`.``
  <!--lint disable maximum-line-length remark-lint-->
  * For example: <code>* `byteOffset` {integer} Index of first byte to expose. **Default:** `0`.</code>
  <!--lint enable maximum-line-length remark-lint-->
  * The `type` should refer to a Node.js type or a [JavaScript type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Data_structures_and_types).
* Function returns should use the following format:
  * <code>* Returns: {type|type2} Optional description.</code>
  * E.g. <code>* Returns: {AsyncHook} A reference to `asyncHook`.</code>
* Use official styling for capitalization in products and projects.
  * OK: JavaScript, Google's V8
  <!--lint disable prohibited-strings remark-lint-->
  * NOT OK: Javascript, Google's v8
  <!-- lint enable prohibited-strings remark-lint-->
* Use _Node.js_ and not _Node_, _NodeJS_, or similar variants.
  * When referring to the executable, _`node`_ is acceptable.

See also API documentation structure overview in [doctools README](../tools/doc/README.md).
