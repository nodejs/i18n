# Tichete

* [Cum poți contribui la Tichete](#how-to-contribute-in-issues)
* [Solicitarea ajutorului general](#asking-for-general-help)
* [Discutarea subiectelor non-tehnice](#discussing-non-technical-topics)
* [Trimiterea unui raport de eroare](#submitting-a-bug-report)
* [Trierea unui raport de eroare](#triaging-a-bug-report)
* [Rezolvarea unui raport de eroare](#resolving-a-bug-report)

## Cum poți contribui la Tichete

For any issue, there are fundamentally three ways an individual can contribute:

1. By opening the issue for discussion: For instance, if you believe that you have uncovered a bug in Node.js, creating a new issue in the `nodejs/node` issue tracker is the way to report it.
2. By helping to triage the issue: This can be done either by providing supporting details (a test case that demonstrates a bug), or providing suggestions on how to address the issue.
3. By helping to resolve the issue: Typically this is done either in the form of demonstrating that the issue reported is not a problem after all, or more often, by opening a Pull Request that changes some bit of something in `nodejs/node` in a concrete and reviewable manner.

## Solicitarea ajutorului general

Because the level of activity in the `nodejs/node` repository is so high, questions or requests for general help using Node.js should be directed at the [Node.js help repository](https://github.com/nodejs/help/issues).

## Discutarea subiectelor non-tehnice

Discussion of non-technical topics (such as intellectual property and trademark) should be directed to the [Technical Steering Committee (TSC) repository](https://github.com/nodejs/TSC/issues).

## Trimiterea unui raport de eroare

When opening a new issue in the `nodejs/node` issue tracker, users will be presented with a basic template that should be filled in.

```markdown
<!--
Mulțumim pentru raportarea unei probleme.

Acest tracker de tichete este pentru erori și probleme găsite în nucleul Node.js.
Dacă soliciți mai multă asistență generală te rog să înaintezi un tichet către ajutorul depozitarului. https://github.com/nodejs/help


Te rog completează cât mai mult din șablonul de mai jos după cum poți.

Version: ieșirea comenzii „node -v”
Platform: ieșirea comenzii „uname -a” (UNIX), sau versiune și 32 sau 64-bit (Windows)
Subsystem: dacă se cunoaște, te rog specifică numele modulului din nucleu afectat

Dacă este posibil, te rog furnizează codul care demonstrează problema, păstrându-l pe cât de simplu posibil și fără dependențe externe.
-->

* **Version**:
* **Platform**:
* **Subsystem**:

<!-- Introdu detaliile problemei tale sub acest comentariu. -->
```

If you believe that you have uncovered a bug in Node.js, please fill out this form, following the template to the best of your ability. Do not worry if you cannot answer every detail, just fill in what you can.

The two most important pieces of information we need in order to properly evaluate the report is a description of the behavior you are seeing and a simple test case we can use to recreate the problem on our own. If we cannot recreate the issue, it becomes impossible for us to fix.

In order to rule out the possibility of bugs introduced by userland code, test cases should be limited, as much as possible, to using *only* Node.js APIs. If the bug occurs only when you're using a specific userland module, there is a very good chance that either (a) the module has a bug or (b) something in Node.js changed that broke the module.

Vezi [Cum să creezi un exemplu minimal, complet și care poate fi verificat](https://stackoverflow.com/help/mcve).

## Trierea unui raport de eroare

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Resolving a Bug Report

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.