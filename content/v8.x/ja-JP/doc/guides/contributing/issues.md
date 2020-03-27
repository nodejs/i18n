# イシュー

* [イシュー上で貢献する方法](#how-to-contribute-in-issues)
* [一般的なヘルプ](#asking-for-general-help)
* [非技術的な話題についての議論](#discussing-non-technical-topics)
* [バグレポートの提出](#submitting-a-bug-report)
* [バグレポートのトリアージ](#triaging-a-bug-report)
* [バグレポートの解決](#resolving-a-bug-report)

## イシュー上で貢献する方法

どのようなイシューにも、個人が貢献できる方法は基本的に3つあります:

1. 議論のためにイシューを開く: 例えば、Node.js 上でバグを発見したと思ったら、`nodejs/node`のイシュートラッカー上に新しいイシューを作成することでそれを報告できます。
2. イシューのトリアージを手伝う: 有用な詳細情報 (バグを実証するテストケース) を提供したり、イシューへの対処方法を提案することで、トリアージを手伝うことができます。
3. イシューの解決を手伝う: 基本的に、報告されたイシューが問題にならないと示すか、より多くの場合では、具体的でレビュー可能な方法で`nodejs/node`の一部を変更するプルリクエストを開くことで解決を手伝うことができます。

## 一般的なヘルプ

`nodejs/node` リポジトリが非常に活発であるため、Node.js を使用した一般的なヘルプに関する質問やリクエストは [Node.js ヘルプリポジトリ](https://github.com/nodejs/help/issues)に問い合わせる必要があります。

## 非技術的な話題についての議論

非技術的な話題についての議論 (知的財産や商標についてなど) は、[Technical Steering Committee (TSC) リポジトリ](https://github.com/nodejs/TSC/issues)に問い合わせる必要があります。

## バグレポートの提出

`nodejs/node` のイシュートラッカーで新しいイシューを開くと、ユーザーは入力すべき基本テンプレートを与えられます。

```markdown<!--
問題を報告してくれてありがとうございます。

このイシュートラッカーは Node.js のコア部分で見つかったバグや問題のためのものです。
もし、より一般的なサポートが必要な場合は、ヘルプリポジトリにイシューを開いてください。 https://github.com/nodejs/help


以下のテンプレートに可能な限り記入をしてください。

Version: `node -v` の出力
Platform: `uname -a` の出力 (UNIX)、もしくは、バージョンと 32 あるいは 64-bit か (Windows)
Subsystem: わかっている場合は、該当するコアモジュール名を指定してください

できれば、可能な限りシンプルで外部依存関係のない、問題を再現するコードを書いてください。
-->* **Version**:
* **Platform**:
* **Subsystem**:<!-- このコメントの下に問題の詳細を入力してください。 -->```

Node.js でバグを発見したと思う場合は、出来る範囲でテンプレートに従ってこのフォームを埋めてください。 すべての質問に答えられなくても気にせずに、出来る限り埋めてください。

The two most important pieces of information we need in order to properly evaluate the report is a description of the behavior you are seeing and a simple test case we can use to recreate the problem on our own. If we cannot recreate the issue, it becomes impossible for us to fix.

In order to rule out the possibility of bugs introduced by userland code, test cases should be limited, as much as possible, to using *only* Node.js APIs. If the bug occurs only when you're using a specific userland module, there is a very good chance that either (a) the module has a bug or (b) something in Node.js changed that broke the module.

See [How to create a Minimal, Complete, and Verifiable example](https://stackoverflow.com/help/mcve).

## バグレポートのトリアージ

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## バグレポートの解決

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.
