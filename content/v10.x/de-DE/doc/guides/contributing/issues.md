# Probleme

* [Wie man bei Problemen mitwirkt](#how-to-contribute-in-issues)
* [Nach allgemeiner Hilfe suchen](#asking-for-general-help)
* [Diskussion von nicht technischen Themen](#discussing-non-technical-topics)
* [Einen Fehlerbreicht übermitteln](#submitting-a-bug-report)
* [Fehlerbericht vorselektieren](#triaging-a-bug-report)
* [Fehlerbericht aufheben](#resolving-a-bug-report)

## Wie man bei Problemen mitwirkt

For any issue, there are fundamentally three ways an individual can contribute:

1. By opening the issue for discussion: For instance, if you believe that you have uncovered a bug in Node.js, creating a new issue in the `nodejs/node` issue tracker is the way to report it.
2. By helping to triage the issue: This can be done either by providing supporting details (a test case that demonstrates a bug), or providing suggestions on how to address the issue.
3. By helping to resolve the issue: Typically this is done either in the form of demonstrating that the issue reported is not a problem after all, or more often, by opening a Pull Request that changes some bit of something in `nodejs/node` in a concrete and reviewable manner.

## Allgemeine Hilfe erbitten

Because the level of activity in the `nodejs/node` repository is so high, questions or requests for general help using Node.js should be directed at the [Node.js help repository](https://github.com/nodejs/help/issues).

## Diskussion von nicht technischen Themen

Discussion of non-technical topics (such as intellectual property and trademark) should be directed to the [Technical Steering Committee (TSC) repository](https://github.com/nodejs/TSC/issues).

## Einen Fehlerbericht einreichen

When opening a new issue in the `nodejs/node` issue tracker, users will be presented with a basic template that should be filled in.

```markdown
<!-- Vielen Dank für die Übermittlung eines Fehlers.

Dieser Problem Tracker ist für Fehler und Probleme, welche im Node.js Kern gefunden werden.
Sollten Sie weiterführende Unterstützung benötigen, stellen Sie das Problem in unserer Hilfe Repo ein. https://github.com/nodejs/help

Bitte füllen sie die Vorlage so detailliert aus, wie es Ihnen möglich ist.

Version: Ausgabe von `node -v`
Plattform: Ausgabe von `uname -a` (UNIX), oder version und ob 32 oder 64-bit (Windows)
Subsystem: Wenn bekannt, spezifizieren Sie bitte den betroffenen Kern Modul Namen

Wenn möglich, liefern Sie den Code der das Problem aufzeigt, dabei halten Sie es so einfach und frei von Abhängikeiten wie möglich.
-->

* **Version**:
* **Platform**:
* **Subsystem**:

<!-- Geben sie die Details zu dem Problem unterhalb dieses Kommentars ein. -->
```

If you believe that you have uncovered a bug in Node.js, please fill out this form, following the template to the best of your ability. Do not worry if you cannot answer every detail, just fill in what you can.

The two most important pieces of information we need in order to properly evaluate the report is a description of the behavior you are seeing and a simple test case we can use to recreate the problem on our own. If we cannot recreate the issue, it becomes impossible for us to fix.

In order to rule out the possibility of bugs introduced by userland code, test cases should be limited, as much as possible, to using *only* Node.js APIs. If the bug occurs only when you're using a specific userland module, there is a very good chance that either (a) the module has a bug or (b) something in Node.js changed that broke the module.

Siehe [How to create a Minimal, Complete, and Verifiable example](https://stackoverflow.com/help/mcve).

## Triaging a Bug Report

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Resolving a Bug Report

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.