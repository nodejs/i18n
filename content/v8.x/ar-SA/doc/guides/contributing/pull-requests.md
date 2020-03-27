# طلبات السحب

هناك عنصرين أساسيين لعملية طلب السحب: واحد ملموس وتقني ، والأخر عملي. العنصر الملموس والتقني يتضمن تفاصيل محددة من إعداد البيئة المحلية الخاصة بك حتى تتمكن من إجراء تعديلات فعلية. هذا هو المكان الذي سنبدأ منه.

* [التبعيات](#dependencies)
* [إعداد البيئة المحلية الخاصة بك](#setting-up-your-local-environment)
  * [الخطوة 1: النسخ](#step-1-fork)
  * [الخطوة 2: التفرع](#step-2-branch)
* [عملية إجراء التغييرات](#the-process-of-making-changes)
  * [الخطوة 3: كتابة الشيفرة البرمجية](#step-3-code)
  * [الخطوة 4: الإلتزام](#step-4-commit)
    * [إرشادات رسالة التسليم](#commit-message-guidelines)
  * [الخطوة 5: إعادة الإنشاء (Rebase)](#step-5-rebase)
  * [الخطوة 6: الإختبار](#step-6-test)
    * [تغطية الاختبار](#test-coverage)
  * [الخطوة 7: الدفع](#step-7-push)
  * [خطوة 8: فتح طلب السحب](#step-8-opening-the-pull-request)
  * [الخطوة 9: النقاش والتحديث](#step-9-discuss-and-update)
    * [الموافقة وطلب تغييرات سير العمل](#approval-and-request-changes-workflow)
  * [الخطوة 10: الهبوط](#step-10-landing)
* [مراجعة طلبات السحب](#reviewing-pull-requests)
  * [راجع جزء صغير في كل وقت](#review-a-bit-at-a-time)
  * [كن حذرا من الشخص المسؤول عن الشيفرة](#be-aware-of-the-person-behind-the-code)
  * [احترام الحد الأدنى من وقت الانتظار للتعليقات](#respect-the-minimum-wait-time-for-comments)
  * [طلبات سحب مهجورة أو متوقفة](#abandoned-or-stalled-pull-requests)
  * [الموافقة على تعديل](#approving-a-change)
  * [تقبل أن هناك آراء مختلفة حول ما ينتمي لـ Node.js](#accept-that-there-are-different-opinions-about-what-belongs-in-nodejs)
  * [الأداء ليس كل شيء](#performance-is-not-everything)
  * [اختبار التكامل المتواصل](#continuous-integration-testing)
* [ملاحظات إضافية](#additional-notes)
  * [دمج الإلتزام](#commit-squashing)
  * [الحصول على الموافقة لطلب السحب الخاص بك](#getting-approvals-for-your-pull-request)
  * [اختبار CI](#ci-testing)
  * [الانتظار حتى ينزل طلب السحب](#waiting-until-the-pull-request-gets-landed)
  * [Check Out the Collaborator's Guide](#check-out-the-collaborators-guide)

## التبعيات

Node.js has several bundled dependencies in the *deps/* and the *tools/* directories that are not part of the project proper. التعديلات في الملفات الموجودة في هذه الدلائل يجب ان ترسل إلى المشاريع الخاصة بها. لا تقم بإرسال تصحيح لـ Node.js. لا يمكننا أن نقبل مثل هذه التصحيحات.

في حالة الشك، إفتح تذكرة في [متعقب المشاكل](https://github.com/nodejs/node/issues/) أو إتصل بأحد [المتعاونين مع المشروع](https://github.com/nodejs/node/#current-project-team-members). لدى Node.js قناتين للدردشة: [#Node.js](https://webchat.freenode.net/?channels=node.js) للمساعدة العامة و الأسئلة ، و [#Node-dev](https://webchat.freenode.net/?channels=node-dev) لتطوير نواة Node.js على وجه التحديد.

## إعداد البيئة المحلية الخاصة بك

للبدء، ستحتاج إلى تثبيت `git` محليًا. اعتمادا على نظام التشغيل الخاص بك، هناك أيضا عدد من التبعيات الأخرى المطلوبة. ستجدها مفصلة في [إرشادات البناء](../../../BUILDING.md).

بمجرد أن يكون لديك `git` وتكون متأكد من أنه لديك جميع التبعيات اللازمة، حان الوقت لإنشاء نسخة.

Before getting started, it is recommended to configure `git` so that it knows who you are:

```text
$ git config --global user.name "J. Random User"
$ git config --global user.email "j.random.user@example.com"
```
يرجى التأكد من إضافة البريد الإلكتروني المحلي أيضًا إلى [ قائمة البريد الإلكتروني لـ GitHub ](https://github.com/settings/emails) حتى يتم ربط إلتزامك بشكل صحيح بحسابك وسيتم ترقيتك لمساهم بمجرد نزول اول التزام لك.

### الخطوة 1: النسخ

إنسخ المشروع [ على GitHub ](https://github.com/nodejs/node) واستنسخ النسخة محليا.

```text
$ git clone git@github.com:username/node.git
$ cd node
$ git remote add upstream https://github.com/nodejs/node.git
$ git fetch upstream
```

### الخطوة 2: التفرع

أفضل طريقة للحفاظ على بيئة التطوير الخاصة بك أكثر تنضيما قدر الإمكان، هي إنشاء فروع محلية للعمل عليها. وينبغي أيضا أن تنشئها مباشرة خارج الفرع `الرئيسي`.

```text
$ git checkout -b my-branch -t upstream/master
```

## عملية إجراء التعديلات

### الخطوة 3: كتابة الشيفرة البرمجية

The vast majority of Pull Requests opened against the `nodejs/node` repository includes changes to either the C/C++ code contained in the `src` directory, the JavaScript code contained in the `lib` directory, the documentation in `docs/api` or tests within the `test` directory.

If you are modifying code, please be sure to run `make lint` from time to time to ensure that the changes follow the Node.js code style guide.

Any documentation you write (including code comments and API documentation) should follow the [Style Guide](../../STYLE_GUIDE.md). Code samples included in the API docs will also be checked when running `make lint` (or `vcbuild.bat lint` on Windows).

For contributing C++ code, you may want to look at the [C++ Style Guide](../../../CPP_STYLE_GUIDE.md).

### الخطوة 4: الإلتزام

من أفضل الممارسات الموصى بها، الحفاظ على تعديلاتك في مجموعات منطقية قدر الإمكان ضمن الإلتزامات الفردية. لا يوجد حد لعدد الإلتزامات في طلب السحب الواحد، ويجد العديد من المساهمين أنه من الأسهل مراجعة التعديلات المنقسمة على عدة إلتزامات.

```text
$ git add my/changed/files
$ git commit
```

لاحظ أنه غالباً ما يتم دمج الإلتزامات المتعددة عندما يتم إنزالها (راجع الملاحظات حول [سحق الإلتزام](#commit-squashing)).

#### إرشادات رسالة الإلتزام

رسالة التزام جيدة ينبغي أن تصف ما الذي تغير، ولماذا.

1. يجب على السطر الأول أن:
   - contain a short description of the change (preferably 50 characters or less, and no more than 72 characters)
   - تكون بالكامل بأحرف صغيرة باستثناء الأسماء المناسبة، المختصرات، والكلمات التي تشير إلى تعليمات برمجية، مثل أسماء الدالة / المتغير
   - تكون مسبوقة باسم النظام الفرعي الذي تم تعديله وتبدأ بـ فعل الأمر. تحقق من المخرج `git log --oneline files/you/changed` لمعرفة ما هي النظم الفرعية التي أثرت عليها تغييراتك.

   أمثلة:
   - `net: add localAddress and localPort to Socket`
   - `src: fix typos in node_lttng_provider.h`


2. حافظ على السطر الثاني فارغًا.
3. Wrap all other lines at 72 columns.

4. إذا كان التصحيح الخاص بك يعمل على إصلاح مشكلة مفتوحة، فيمكنك إضافة مرجع إليها في نهاية السجل. استخدم إختصار`Fixes:` وعنوان URL الكامل للمشكلة. لمراجع أخرى استعمل `Refs:`.

   أمثلة:
   - `Fixes: https://github.com/nodejs/node/issues/1337`
   - `Refs: http://eslint.org/docs/rules/space-in-parens.html`
   - `Refs: https://github.com/nodejs/node/pull/3615`

5. If your commit introduces a breaking change (`semver-major`), it should contain an explanation about the reason of the breaking change, which situation would trigger the breaking change and what is the exact change.

Breaking changes will be listed in the wiki with the aim to make upgrading easier.  Please have a look at [Breaking Changes](https://github.com/nodejs/node/wiki/Breaking-changes-between-v4-LTS-and-v6-LTS) for the level of detail that's suitable.

عينة كاملة لرسالة آلإلتزام:

```txt
النظام الفرعي: شرح الالتزام في سطر واحد

نص رسالة الالتزام عبارة عن بضعة أسطر مكتوبة توضح فيها الأمور
بمزيد من التفاصيل، وربما إعطاء بعض المعلومات الأساسية أيضا حول المشكلة
التي يجري إصلاحها ، إلخ.

The body of the commit message can be several paragraphs, and
please do proper word-wrap and keep columns shorter than about
72 characters or so. That way, `git log` will show things
nicely even when it is indented.

Fixes: https://github.com/nodejs/node/issues/1337
Refs: http://eslint.org/docs/rules/space-in-parens.html
```

If you are new to contributing to Node.js, please try to do your best at conforming to these guidelines, but do not worry if you get something wrong. One of the existing contributors will help get things situated and the contributor landing the Pull Request will ensure that everything follows the project guidelines.

See [core-validate-commit](https://github.com/evanlucas/core-validate-commit) - A utility that ensures commits follow the commit formatting guidelines.

### الخطوة 5: إعادة الإنشاء (Rebase)

As a best practice, once you have committed your changes, it is a good idea to use `git rebase` (not `git merge`) to synchronize your work with the main repository.

```text
$ git fetch upstream
$ git rebase upstream/master
```

هذا يضمن أن الفرع الخاص بك الذي يعمل لديه أحدث التعديلات من `nodejs/node` الرئيسي.

### الخطوة 6: الإختبار

Bug fixes and features should always come with tests. A [guide for writing tests in Node.js](../writing-tests.md) has been provided to make the process easier. Looking at other tests to see how they should be structured can also help.

The `test` directory within the `nodejs/node` repository is complex and it is often not clear where a new test file should go. When in doubt, add new tests to the `test/parallel/` directory and the right location will be sorted out later.

Before submitting your changes in a Pull Request, always run the full Node.js test suite. To run the tests (including code linting) on Unix / macOS:

```text
$ ./configure && make -j4 test
```

وفي نظام الويندوز:

```text
> vcbuild test
```

(See the [Building guide](../../../BUILDING.md) for more details.)

Make sure the linter does not report any issues and that all tests pass. Please do not submit patches that fail either check.

If you want to run the linter without running tests, use `make lint`/`vcbuild lint`. It will run both JavaScript linting and C++ linting.

If you are updating tests and just want to run a single test to check it:

```text
$ python tools/test.py -J --mode=release parallel/test-stream2-transform
```

You can execute the entire suite of tests for a given subsystem by providing the name of a subsystem:

```text
$ python tools/test.py -J --mode=release child-process
```

If you want to check the other options, please refer to the help by using the `--help` option

```text
$ python tools/test.py --help
```

You can usually run tests directly with node:

```text
$ ./node ./test/parallel/test-stream2-transform.js
```

Remember to recompile with `make -j4` in between test runs if you change code in the `lib` or `src` directories.

#### تغطية الاختبار

من الممارسات الجيدة لضمان أن أي شيفرة تضيفها أو تغيرها قد تم تغطيتها من خلال الاختبارات. يمكنك القيام بذلك عن طريق تشغيل مجموعة الاختبار مع تمكين التغطية:

```text
$ ./configure --coverage && make coverage
```

A detailed coverage report will be written to `coverage/index.html` for JavaScript coverage and to `coverage/cxxcoverage.html` for C++ coverage.

_Note that generating a test coverage report can take several minutes._

To collect coverage for a subset of tests you can set the `CI_JS_SUITES` and `CI_NATIVE_SUITES` variables:

```text
$ CI_JS_SUITES=child-process CI_NATIVE_SUITES= make coverage
```

The above command executes tests for the `child-process` subsystem and outputs the resulting coverage report.

يؤدي تشغيل الاختبارات مع التغطية إلى إنشاء وتعديل عدة مجلدات وملفات. للتنظيف بعد ذلك، قم بتشغيل:

```text
make coverage-clean
./configure && make -j4.
```

### الخطوة 7: الدفع

بمجرد التأكد من أن التزاماتك جاهزة، مع اجتياز الاختبارات والفحوصات، تبدأ عملية فتح طلب السحب عن طريق دفع فرع العمل الخاص بك إلى نسختك على GitHub.

```text
$ git push origin my-branch
```

### خطوة 8: فتح طلب السحب

من داخل GitHub ، سيؤدي فتح طلب سحب جديد إلى تقديم نموذج لك يجب ملؤه:

```markdown<!--
شكرا لك على طلب السحب. يرجى تقديم وصف أعلاه ومراجعة المتطلبات أدناه.

يجب أن تتضمن إصلاحات الأخطاء والميزات الجديدة اختبارات ومقاييس محتملة.

دليل المساهمين: https://github.com/nodejs/node/blob/master/CONTRIBUTING.md->

# # # قائمة
<!-إزالة العناصر التي لا تنطبق. بالنسبة للعناصر المكتملة، غَيِّر [] إلى [x]. -->- [ ] `make -j4 test` (UNIX), or `vcbuild test` (Windows) passes
- [ ] tests and/or benchmarks are included
- [ ] documentation is changed or added
- [ ] commit message follows [commit guidelines](https://github.com/nodejs/node/blob/master/doc/guides/contributing/pull-requests.md#commit-message-guidelines)

#### Affected core subsystem(s)<!-- Provide affected core subsystem(s) (like doc, cluster, crypto, etc). -->```

يرجى محاولة بذل قصارى جهدك عند ملء التفاصيل، ولكن لا تتردد في تخطي الأجزاء التي تكون فيها غير متأكد من ما ستضعه.

بمجرد فتحها، تتم مراجعة طلبات السحب عادة في غضون بضعة أيام.

### الخطوة 9: النقاش والتحديث

من المحتمل أن تحصل على ملاحظات أو طلبات لإجراء تعديلات على طلب السحب. هذا جزء كبير من عملية التقديم، لذا لا تصب بالإحباط! بعض المساهمين قد يوقعون على طلب السحب على الفور، وبعضهم قد يكون لديهم مزيد من الملاحضات أو التعليقات المفصلة. هذا جزء ضروري من العملية من أجل تقييم ما إذا كانت التعديلات صحيحة وضرورية.

لإجراء تعديلات على طلب سحب موجود، قم بإجراء التعديلات على فرعك المحلي، أضف إلتزام جديد مع تلك التعديلات، وإدفعهم إلى النسخة الخاصة بك. GitHub سيقوم تلقائياً بتحديث "طلب السحب".

```text
$ git add my/changed/files
$ git commit
$ git push origin my-branch
```

من الضروري في كثير من الأحيان مزامنة طلب السحب الخاص بك مع التعديلات الأخرى التي نزلت في `master` باستخدام `git rebase`:

```text
$ git fetch --all
$ git rebase origin/master
$ git push --force-with-lease origin my-branch
```

** هام: ** يعد الأمر `git push --force-with-lease` أحد الطرق القليلة لحذف السجل في `git`. قبل استخدامه، تأكد من أنك تفهم المخاطر. If in doubt, you can always ask for guidance in the Pull Request or on [IRC in the #node-dev channel](https://webchat.freenode.net?channels=node-dev&uio=d4).

إذا ارتكبت خطأ في أي من التزاماتك ، فلا تقلق. تستطيع تعديل الالتزام الأخير (على سبيل المثال إذا كنت ترغب في تغيير سجل الالتزام).

```text
$ git add any/changed/files
$ git commit --amend
$ git push --force-with-lease origin my-branch
```

هناك عدد من الآليات الأكثر تقدمًا التي يمكن استخدامها لإدارة الالتزامات باستخدام `git rebase`، ولكنها خارج نطاق هذا الدليل.

لا تتردد في نشر تعليق في طلب سحب لتنبيه المراجعين إذا كنت في انتظار إجابة على شيء ما. إذا كنت تواجه كلمات أو اختصارات تبدو غير مألوفة، يرجى الرجوع إلى [ القاموس](https://sites.google.com/a/chromium.org/dev/glossary).

#### الموافقة وطلب تغييرات سير العمل

تتطلب كافة طلبات سحب "تسجيل الخروج" من أجل النزول. قد يجد المساهم تفاصيل محددة يرغب في تعديلها او إصلاحها كلما راجع طلب السحب. قد يكون هذا بسيطاً مثل إصلاح خطأ مطبعي، أو قد يشمل تعديلات جوهرية على الشيفرة الذي كتبتها. في حين أن هذه الطلبات من المفترض أن تكون مفيدة، قد تصادف أنها غير مرتبطة أو غير مفيدة، خاصة طلبات تغيير الأشياء التي لا تتضمن اقتراحات محددة عن *كيفية* تغييرها.

حاول ألا يصيبك الإحباط. إذا كنت تشعر أن مراجعة معينة غير عادلة، قل ذلك، أو إتصل بأحد المساهمين الآخرين في المشروع والتمس مدخلاتهم. غالبًا ما تكون مثل هذه التعليقات نتيجة ان المُراجع لم يأخد الوقت الكافي لمراجعة طلب السحب وهي ليست مقصودة. مثل هذه القضايا غالباً ما يمكن حلها مع قليل من الصبر. That said, reviewers should be expected to be helpful in their feedback, and feedback that is simply vague, dismissive and unhelpful is likely safe to ignore.

### الخطوة 10: النزول

In order to land, a Pull Request needs to be reviewed and [approved](#getting-approvals-for-your-pull-request) by at least one Node.js Collaborator and pass a [CI (Continuous Integration) test run](#ci-testing). After that, as long as there are no objections from other contributors, the Pull Request can be merged. If you find your Pull Request waiting longer than you expect, see the [notes about the waiting time](#waiting-until-the-pull-request-gets-landed).

When a collaborator lands your Pull Request, they will post a comment to the Pull Request page mentioning the commit(s) it landed as. GitHub often shows the Pull Request as `Closed` at this point, but don't worry. If you look at the branch you raised your Pull Request against (probably `master`), you should see a commit with your name on it. Congratulations and thanks for your contribution!

## مراجعة طلبات السحب

جميع المساهمين في Node.js الذين يختارون مراجعة طلبات السحب وتقديم الملاحضات لديهم مسؤولية تجاه كل من المشروع والفرد المسؤول عن المساهمة. Reviews and feedback must be helpful, insightful, and geared towards improving the contribution as opposed to simply blocking it. If there are reasons why you feel the PR should not land, explain what those are. Do not expect to be able to block a Pull Request from advancing simply because you say "No" without giving an explanation. Be open to having your mind changed. Be open to working with the contributor to make the Pull Request better.

Reviews that are dismissive or disrespectful of the contributor or any other reviewers are strictly counter to the [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

When reviewing a Pull Request, the primary goals are for the codebase to improve and for the person submitting the request to succeed. Even if a Pull Request does not land, the submitters should come away from the experience feeling like their effort was not wasted or unappreciated. Every Pull Request from a new contributor is an opportunity to grow the community.

### راجع جزء صغير في كل وقت.

Do not overwhelm new contributors.

It is tempting to micro-optimize and make everything about relative performance, perfect grammar, or exact style matches. Do not succumb to that temptation.

Focus first on the most significant aspects of the change:

1. Does this change make sense for Node.js?
2. Does this change make Node.js better, even if only incrementally?
3. Are there clear bugs or larger scale issues that need attending to?
4. Is the commit message readable and correct? If it contains a breaking change is it clear enough?

When changes are necessary, *request* them, do not *demand* them, and do not assume that the submitter already knows how to add a test or run a benchmark.

Specific performance optimization techniques, coding styles and conventions change over time. The first impression you give to a new contributor never does.

Nits (requests for small changes that are not essential) are fine, but try to avoid stalling the Pull Request. Most nits can typically be fixed by the Node.js Collaborator landing the Pull Request but they can also be an opportunity for the contributor to learn a bit more about the project.

It is always good to clearly indicate nits when you comment: e.g. `Nit: change foo() to bar(). But this is not blocking.`

### كن حذرا من الشخص المسؤول عن الشيفرة

Be aware that *how* you communicate requests and reviews in your feedback can have a significant impact on the success of the Pull Request. Yes, we may land a particular change that makes Node.js better, but the individual might just not want to have anything to do with Node.js ever again. The goal is not just having good code.

### احترام الحد الأدنى من وقت الانتظار للتعليقات

There is a minimum waiting time which we try to respect for non-trivial changes, so that people who may have important input in such a distributed project are able to respond.

For non-trivial changes, Pull Requests must be left open for *at least* 48 hours during the week, and 72 hours on a weekend. In most cases, when the PR is relatively small and focused on a narrow set of changes, these periods provide more than enough time to adequately review. Sometimes changes take far longer to review, or need more specialized review from subject matter experts. When in doubt, do not rush.

Trivial changes, typically limited to small formatting changes or fixes to documentation, may be landed within the minimum 48 hour window.

### طلبات السحب المهجورة أو المتوقفة

If a Pull Request appears to be abandoned or stalled, it is polite to first check with the contributor to see if they intend to continue the work before checking if they would mind if you took it over (especially if it just has nits left). When doing so, it is courteous to give the original contributor credit for the work they started (either by preserving their name and email address in the commit log, or by using an `Author:` meta-data tag in the commit.

### الموافقة على تعديل

Any Node.js core Collaborator (any GitHub user with commit rights in the `nodejs/node` repository) is authorized to approve any other contributor's work. Collaborators are not permitted to approve their own Pull Requests.

Collaborators indicate that they have reviewed and approve of the changes in a Pull Request either by using GitHub's Approval Workflow, which is preferred, or by leaving an `LGTM` ("Looks Good To Me") comment.

When explicitly using the "Changes requested" component of the GitHub Approval Workflow, show empathy. That is, do not be rude or abrupt with your feedback and offer concrete suggestions for improvement, if possible. If you're not sure *how* a particular change can be improved, say so.

Most importantly, after leaving such requests, it is courteous to make yourself available later to check whether your comments have been addressed.

If you see that requested changes have been made, you can clear another collaborator's `Changes requested` review.

Change requests that are vague, dismissive, or unconstructive may also be dismissed if requests for greater clarification go unanswered within a reasonable period of time.

If you do not believe that the Pull Request should land at all, use `Changes requested` to indicate that you are considering some of your comments to block the PR from landing. When doing so, explain *why* you believe the Pull Request should not land along with an explanation of what may be an acceptable alternative course, if any.

### تقبل أن هناك آراء مختلفة حول ما ينتمي لـ Node.js

Opinions on this vary, even among the members of the Technical Steering Committee.

One general rule of thumb is that if Node.js itself needs it (due to historic or functional reasons), then it belongs in Node.js. For instance, `url` parsing is in Node.js because of HTTP protocol support.

Also, functionality that either cannot be implemented outside of core in any reasonable way, or only with significant pain.

It is not uncommon for contributors to suggest new features they feel would make Node.js better. These may or may not make sense to add, but as with all changes, be courteous in how you communicate your stance on these. Comments that make the contributor feel like they should have "known better" or ridiculed for even trying run counter to the [Code of Conduct](https://github.com/nodejs/admin/blob/master/CODE_OF_CONDUCT.md).

### الأداء ليس كل شيء

Node.js has always optimized for speed of execution. If a particular change can be shown to make some part of Node.js faster, it's quite likely to be accepted. Claims that a particular Pull Request will make things faster will almost always be met by requests for performance [benchmark results](../writing-and-running-benchmarks.md) that demonstrate the improvement.

That said, performance is not the only factor to consider. Node.js also optimizes in favor of not breaking existing code in the ecosystem, and not changing working functional code just for the sake of changing.

If a particular Pull Request introduces a performance or functional regression, rather than simply rejecting the Pull Request, take the time to work *with* the contributor on improving the change. Offer feedback and advice on what would make the Pull Request acceptable, and do not assume that the contributor should already know how to do that. Be explicit in your feedback.

### اختبار التكامل المتواصل

All Pull Requests that contain changes to code must be run through continuous integration (CI) testing at [https://ci.nodejs.org/](https://ci.nodejs.org/).

Only Node.js core Collaborators with commit rights to the `nodejs/node` repository may start a CI testing run. The specific details of how to do this are included in the new Collaborator [Onboarding guide](../../onboarding.md).

Ideally, the code change will pass ("be green") on all platform configurations supported by Node.js (there are over 30 platform configurations currently). This means that all tests pass and there are no linting errors. In reality, however, it is not uncommon for the CI infrastructure itself to fail on specific platforms or for so-called "flaky" tests to fail ("be red"). It is vital to visually inspect the results of all failed ("red") tests to determine whether the failure was caused by the changes in the Pull Request.

## ملاحظات إضافية

### دمج الإلتزام

When the commits in your Pull Request land, they may be squashed into one commit per logical change. Metadata will be added to the commit message (including links to the Pull Request, links to relevant issues, and the names of the reviewers). The commit history of your Pull Request, however, will stay intact on the Pull Request page.

For the size of "one logical change", [0b5191f](https://github.com/nodejs/node/commit/0b5191f15d0f311c804d542b67e2e922d98834f8) can be a good example. It touches the implementation, the documentation, and the tests, but is still one logical change. All tests should always pass when each individual commit lands on the master branch.

### Getting Approvals for Your Pull Request

A Pull Request is approved either by saying LGTM, which stands for "Looks Good To Me", or by using GitHub's Approve button. GitHub's Pull Request review feature can be used during the process. For more information, check out [the video tutorial](https://www.youtube.com/watch?v=HW0RPaJqm4g) or [the official documentation](https://help.github.com/articles/reviewing-changes-in-pull-requests/).

After you push new changes to your branch, you need to get approval for these new changes again, even if GitHub shows "Approved" because the reviewers have hit the buttons before.

### اختبار CI

Every Pull Request needs to be tested to make sure that it works on the platforms that Node.js supports. This is done by running the code through the CI system.

Only a Collaborator can start a CI run. Usually one of them will do it for you as approvals for the Pull Request come in. If not, you can ask a Collaborator to start a CI run.

### الانتظار حتى ينزل طلب السحب

A Pull Request needs to stay open for at least 48 hours (72 hours on a weekend) from when it is submitted, even after it gets approved and passes the CI. This is to make sure that everyone has a chance to weigh in. If the changes are trivial, collaborators may decide it doesn't need to wait. A Pull Request may well take longer to be merged in. All these precautions are important because Node.js is widely used, so don't be discouraged!

### Check Out the Collaborator's Guide

If you want to know more about the code review and the landing process, you can take a look at the [collaborator's guide](https://github.com/nodejs/node/blob/master/COLLABORATOR_GUIDE.md).
