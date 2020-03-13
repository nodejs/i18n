# Probleme

* [Wie man bei Problemen mitwirkt](#how-to-contribute-in-issues)
* [Nach allgemeiner Hilfe suchen](#asking-for-general-help)
* [Diskussion von nicht technischen Themen](#discussing-non-technical-topics)
* [Einen Fehlerbreicht übermitteln](#submitting-a-bug-report)
* [Fehlerbericht vorselektieren](#triaging-a-bug-report)
* [Fehlerbericht aufheben](#resolving-a-bug-report)

## Wie man bei Problemen mitwirkt

Grundsätzlich gibt es drei Möglichkeiten, wie man beitragen kann:

1. Beim eröffnen eines Problems zur Diskussion: Wenn Sie glauben, dass Sie einen Fehler in Node.js entdeckt haben, wäre es der richtige Weg, ein neues Problem im `nodejs/node` zu erstellen.
2. Sichtung eines Problems vereinfachen: Dies kann entweder durch Bereitstellung von unterstützenden Details (ein Testfall, der den Fehler darstellt), oder durch Vorschläge zur Adressierung des Problems.
3. By helping to resolve the issue: Typically this is done either in the form of demonstrating that the issue reported is not a problem after all, or more often, by opening a Pull Request that changes some bit of something in `nodejs/node` in a concrete and reviewable manner.

## Allgemeine Hilfe erbitten

Da das Aktivitätsniveau im `nodejs/node` Repository sehr hoch ist, sollten Fragen oder Anfragen für allgemeine Hilfe zu Node.js im [Node.js help repository](https://github.com/nodejs/help/issues) gestellt werden.

## Diskussion von nicht technischen Themen

Diskussion von nicht technischen Themen (solche wie geistiges Eigentum und Markenzeichen) sollten an das [Technical Steering Committee (TSC) repository](https://github.com/nodejs/TSC/issues) gerichtet werden.

## Einen Fehlerbericht einreichen

Beim eröffnen eines neuen Problems im `nodejs/node` Problem Tracker wird eine Vorlage angezeigt, welche von dem Benutzer ausgefüllt werden muss.

```markdown<!-- Vielen Dank für die Übermittlung eines Fehlers.

Dieser Problem Tracker ist für Fehler und Probleme, welche im Node.js Kern gefunden werden.
Sollten Sie weiterführende Unterstützung benötigen, stellen Sie das Problem in unserer Hilfe Repo ein. https://github.com/nodejs/help

Bitte füllen sie die Vorlage so detailliert aus, wie es Ihnen möglich ist.

Version: Ausgabe von `node -v`
Plattform: Ausgabe von `uname -a` (UNIX), oder version und ob 32 oder 64-bit (Windows)
Subsystem: Wenn bekannt, spezifizieren Sie bitte den betroffenen Kern Modul Namen

Wenn möglich, liefern Sie den Code der das Problem aufzeigt, dabei halten Sie es so einfach und frei von Abhängikeiten wie möglich.
-->* **Version**:
* **Platform**:
* **Subsystem**:<!-- Geben sie die Details zu dem Problem unterhalb dieses Kommentars ein. -->```

Wenn Sie glauben, dass Sie einen Fehler in Node.js entdeckt haben, füllen Sie dieses Formular aus, folgen Sie dabei der Vorlage bestmöglich. Keine Sorge, wenn Sie die nicht jedes Detail beantworten können, füllen Sie einfach aus, was Ihnen möglich ist.

Die zwei wichtigsten Informationen, die wir für eine korrekte Bewertung des Berichts benötigen, ist eine Beschreibung des beobachteten Verhaltens, sowie einen einfachen Testfall den wir benutzen können, um das Problem nachzustellen. Wenn wir das Problem nicht reproduzieren können, wird uns eine Fehlerbehebung nicht möglich sein.

Um die Möglichkeit von Fehlern, verursacht durch den Userland Code, auszuschließen, sollten Testfälle auf *nur* Node.js APIs begrenzt sein. If the bug occurs only when you're using a specific userland module, there is a very good chance that either (a) the module has a bug or (b) something in Node.js changed that broke the module.

Siehe [How to create a Minimal, Complete, and Verifiable example](https://stackoverflow.com/help/mcve).

## Fehlerbericht vorselektieren

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Fehlerbericht aufheben

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.
