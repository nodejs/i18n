# Tichete

* [Cum poți contribui la Tichete](#how-to-contribute-in-issues)
* [Solicitarea ajutorului general](#asking-for-general-help)
* [Discutarea subiectelor non-tehnice](#discussing-non-technical-topics)
* [Trimiterea unui raport de eroare](#submitting-a-bug-report)
* [Trierea unui raport de eroare](#triaging-a-bug-report)
* [Rezolvarea unui raport de eroare](#resolving-a-bug-report)

## Cum poți contribui la Tichete

Pentru orice tichet, există trei moduri fundamentale prin care o persoană poate contribui:

1. Deschiderea tichetului de discuție: de exemplu, dacă crezi că ai descoperit un bug în Node.js, modul de a-l raporta este să creezi un tichet nou în trackerul de tichete `nodejs/node`.
2. Ajutând la trierea problemei: acest lucru se poate face fie prin furnizarea detaliilor ajutătoare (un caz de test care demonstrează o eroare), fie prin oferirea de sugestii privind modul de abordare a problemei.
3. Ajutând la rezolvarea problemei: de obicei, acest lucru se face fie sub forma demonstrării faptului că problema raportată nu este o problemă la urma urmei, sau mai des, prin deschiderea unui pull-request în `nodejs/node` care modifică ceva în mod concret și care poate fi revizuit.

## Solicitarea ajutorului general

Deoarece nivelul de activitate din depozitarul `nodejs/node` este foarte ridicat, întrebările sau cererile de ajutor general care utilizează Node.js ar trebui direcționate către depozitarul de ajutor [Node.js](https://github.com/nodejs/help/issues).

## Discutarea subiectelor non-tehnice

Discutarea subiectelor non-tehnice (cum ar fi proprietatea intelectuală și marca comercială) ar trebui direcționată către [depozitarul Comitetului Tehnic de Coordonare (TSC)](https://github.com/nodejs/TSC/issues).

## Trimiterea unui raport de eroare

Când se deschide un tichet nou în trackerul de tichete `nodejs/node`, utilizatorii vor primi un șablon de bază care trebuie completat.

```markdown
<!--
Mulțumim pentru raportarea unei probleme.

Acest tracker de tichete este pentru erori și probleme găsite în nucleul Node.js.
If you require more general support please file an issue on our help
repo. https://github.com/nodejs/help


Please fill in as much of the template below as you're able.

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

## Triaging a Bug Report

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Resolving a Bug Report

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.