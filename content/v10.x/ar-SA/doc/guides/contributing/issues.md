# التذاكر

* [كيف تساهم في التذاكر](#how-to-contribute-in-issues)
* [طلب المساعدة](#asking-for-general-help)
* [مناقشة المواضيع غير التقنية](#discussing-non-technical-topics)
* [تقديم تقرير عن الأخطاء](#submitting-a-bug-report)
* [فرز تقارير الأخطاء](#triaging-a-bug-report)
* [إصلاح تقرير الخطأ](#resolving-a-bug-report)

## كيف تساهم في التذاكر

لكل تذكرة ، هناك ثلاث طرق أساسية للمساهمة:

1. فتح التذكرة للمناقشة: على سبيل المثال ، إذا كنت تعتقد أنك اكتشفت خطأً في Node.js ، فإن إنشاء تقرير خطأ جديد في أداة تعقب الأخطاء `nodejs/node` هو أفضل طريقة للإبلاغ عنه.
2. من خلال المساعدة في فرز التذكرة: يمكن إجراء ذلك إما عن طريق توفير تفاصيل الدعم (حالة اختبار توضح وجود خطأ) ، أو تقديم اقتراحات حول كيفية معالجة التذكرة.
3. من خلال المساعدة على حل التذكرة: عادة ما يتم ذلك إما في النموذج للتدليل على أن المشكلة المبلغ عنها ليست مشكلة بعد كل شيء ، أو أكثر في كثير من الأحيان ، عن طريق فتح طلب السحب الذي يغير بعض الشيء شيء ما في `nodejs/node` بطريقة ملموسة ومراجعة.

## طلب المساعدة في مسائل عامة

نظرًا لأن النشاط في مستودع `nodejs/node` مرتفع جدًا ، يجب توجيه الأسئلة أو طلبات المساعدة العامة باستخدام Node.js إلى [Node.js help repository](https://github.com/nodejs/help/issues).

## مناقشة المواضيع غير التقنية

يجب توجيه مناقشة القضايا غير التقنية (مثل تسجيل الملكية الفكرية والعلامات التجارية) إلى [Technical Steering Committee (TSC) repository](https://github.com/nodejs/TSC/issues).

## تقديم تقرير عن خطأ

عند فتح تذكرة جديدة في متعقب أخطاء `nodejs/node` ، سيتم تقديم قالب أساسي للمستخدمين والذي يجب ملؤه.

```markdown
<!--
شكرًا لك على التبليغ عن خطأ.

متعقب الأخطاء هذا هو للأخطاء والمشاكل التي وجدت في نواة Node.js.
إذا كنت تحتاج إلى مزيد من الدعم العام ، يُرجى تقديم تذكرة في مستودع المساعدة الخاص بنا. https://github.com/nodejs/help 

يرجى ملء أكبر قدر ممكن من النموذج أدناه.

Version: output of `node -v`
Platform: output of `uname -a` (UNIX), or version and 32 or 64-bit (Windows)
Subsystem: if known, please specify affected core module name

If possible, please provide code that demonstrates the problem, keeping it as
simple and free of external dependencies as you are able.
-->

* **Version**:
* **Platform**:
* **Subsystem**:

<!-- Enter your issue details below this comment. -->
```

إذا كنت تعتقد أنك اكتشفت خطأ في Node.js ، فيرجى ملء هذا النموذج ، اتبع القالب إلى أقصى حد ممكن. لا تقلق إذا كنت لا تستطيع الإجابة على كل التفاصيل ، فقط املأ ما تستطيع.

أهم البيانات التي نحتاجها لتقييم التقرير بشكل صحيح هي وصف السلوك الذي تلاحظه ، وحالة اختبار بسيطة يمكن استخدامها لإعادة إنشاء المشكلة بأنفسنا. إذا لم نتمكن من إعادة المشكلة ، يصبح من المستحيل إصلاحها.

لتجنب إمكانية حدوث أخطاء بواسطة شفرات البرمجة userland ، يجب أن تقتصر حالات الاختبار على استخدام واجهة برمجة التطبيقات Node.js APIs. * فقط *. إذا كان الخطأ يحدث فقط عند استخدام وحدة userland محددة ، فهناك فرصة جيدة جدا بأن تكون (أ) الوحدة لديها خلل أو (ب) شيء ما تغير في Node.js الشيء الذي سبب خلل في الوحدة.

راجع [ كيفية إنشاء مثال صغير وكامل ويمكن التحقق منه ](https://stackoverflow.com/help/mcve).

## تصنيف تقرير الخطأ

من الشائع توليد نقاش حول تذكرة بمجرد فتحها. قد يكون لدى بعض المساهمين آراء متباينة حول المشكلة ، بما في ذلك إذا كان ما هو معروض عيب أو ميزة. هذه المناقشة هي جزء من العملية ويجب أن تظل مركزة, مفيدة ومهنية.

الردود القصيرة والمختصرة التي لا توفر سياقًا إضافيًا ولا دعمًا للتفاصيل - ليست مفيدة أو مهنية. بالنسبة للكثيرين ، هذه الردود ببساطة مزعجة وغير ودية.

يتم تشجيع المساهمين على مساعدة بعضهم البعض لإحراز تقدم كبير قدر المستطاع ، تشجيع بعضهم البعض لحل القضايا بشكل تعاوني. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. من خلال القيام بذلك ، يمكننا في كثير من الأحيان الوصول إلى النتيجة الصحيحة أسرع بكثير.

## إصلاح تقرير الخطأ

في الغالبية العظمى من الحالات ، يتم حل التذاكر عن طريق فتح طلب سحب. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.