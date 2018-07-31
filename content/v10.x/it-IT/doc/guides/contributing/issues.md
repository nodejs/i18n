# Issues

* [Come Contribuire in Issues](#how-to-contribute-in-issues)
* [Chiedere Aiuto Generale](#asking-for-general-help)
* [Discutere di argomenti non tecnici](#discussing-non-technical-topics)
* [Inviare un Bug Report](#submitting-a-bug-report)
* [Smistamento di un Bug Report](#triaging-a-bug-report)
* [Risoluzione di un Bug Report](#resolving-a-bug-report)

## Come Contribuire in Issues

Per qualsiasi issue, ci sono fondamentalmente tre modi con i quali una persona può dare il suo contributo:

1. Aprendo l'issue per la discussione: Ad esempio, se ritieni di aver scoperto un bug in Node.js, la creazione di un nuovo issue nell'issue tracker di `nodejs/node` è il modo giusto per segnalarlo.
2. Aiutando a valutare l'issue: Questo può essere fatto fornendo dettagli di supporto (un test case che dimostri un bug), o fornendo suggerimenti su come affrontare l'issue.
3. Aiutando a risolvere l'issue: In genere questo viene fatto sia dimostrando che l'issue segnalato dopo tutto non è un problema, oppure più spesso, aprendo una Pull Request che modifica un pò qualcosa in `nodejs/node` in modo concreto e revisionabile.

## Chiedere Aiuto Generale

Visto che il livello di attività nel repository di `nodejs/node` è così elevato, le domande o le richieste di aiuto generale che utilizzano Node.js devono essere indirizzate al [Node.js help repository](https://github.com/nodejs/help/issues).

## Discutere di argomenti non tecnici

La discussione di argomenti non tecnici (come possono essere la proprietà intellettuale ed il trademark) deve essere indirizzata al [Technical Steering Committee (TSC) repository](https://github.com/nodejs/TSC/issues) (Repository del Comitato Tecnico Direttivo).

## Inviare un Bug Report

Quando si apre un nuovo issue nell'issue tracker di `nodejs/node`, agli utenti verrà presentato un modello di base da compilare.

```markdown
<!--
Grazie per aver segnalato un issue.

Questo issue tracker riguarda bug ed issue rilevati nel Node.js core.
Se hai bisogno di maggiore supporto generale, inviaci un issue sul 
nostro "help repository". https://github.com/nodejs/help


Si prega di compilare il più possibile il modello qui sotto.

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

If you believe that you have uncovered a bug in Node.js, please fill out this form, following the template to the best of your ability. Do not worry if you cannot answer every detail, just fill in what you can.

The two most important pieces of information we need in order to properly evaluate the report is a description of the behavior you are seeing and a simple test case we can use to recreate the problem on our own. If we cannot recreate the issue, it becomes impossible for us to fix.

In order to rule out the possibility of bugs introduced by userland code, test cases should be limited, as much as possible, to using *only* Node.js APIs. If the bug occurs only when you're using a specific userland module, there is a very good chance that either (a) the module has a bug or (b) something in Node.js changed that broke the module.

See [How to create a Minimal, Complete, and Verifiable example](https://stackoverflow.com/help/mcve).

## Valutazione di un Bug Report

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Risoluzione di un Bug Report

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.