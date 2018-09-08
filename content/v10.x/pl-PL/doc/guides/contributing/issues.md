# Problemy

* [Jak kontrybutować przez Problemy](#how-to-contribute-in-issues)
* [Pytanie o Ogólną Pomoc](#asking-for-general-help)
* [Dyskusje na tematy nietechniczne](#discussing-non-technical-topics)
* [Zgłaszanie Raportu o Błędzie](#submitting-a-bug-report)
* [Ocenianie Raportu o Błędzie](#triaging-a-bug-report)
* [Rozwiązywanie Raportu o Błędzie](#resolving-a-bug-report)

## Jak kontrybutować przez Problemy

Dla każdego Problemu można wyróżnić trzy fundamentalne sposoby kontrybucji:

1. Przez otwarcie Problemu w celu dyskusyjnym, na przykład: Jeżeli wierzysz, że znalazłeś błąd w Node.js, tworzenie nowego problemu w liście problemów `nodejs/node` to sposób na zgłoszenie go.
2. Pomagając ocenić problem: Można to osiągnąć zarówno dostarczając pomocnych detali (test demonstrujący błąd) lub dostarczając sugestii dotyczących rozwiązania problemu.
3. Pomagając rozwiązać problem: Zazwyczaj jest to osiągnięte przez demonstrację, że zgłoszony problem nie jest wcale defektem, lub częściej przez otwarcie Prośbny o Połączenie, która zmienia część `nodejs/node` w konkretny i łatwo sprawdzalny sposób.

## Pytanie o Ogólną Pomoc

Ponieważ poziom aktywności w repozytorium `nodejs/node` jest tak wysoki, pytania i prośby o ogólną pomoc w używaniu Node.js powinny być kierowane na repozytorium [Pomocy Node.js](https://github.com/nodejs/help/issues).

## Dyskusje na tematy nietechniczne

Dyskusje na tematy nietechniczne (takie jak własność intelektualna i znak towarowy) powinny być kierowane do [repozytorium Technical Steering Committee (TSC)](https://github.com/nodejs/TSC/issues).

## Zgłaszanie Raportu o Błędzie

Podczas otwierania nowego problemu w liście problemów `nodejs/node`, użytkownikowi do wypełnienia zostanie przedstawiony podstawowy szablon.

```markdown
<!-- Dziękujemy za zgłoszenie błędu.

Ta lista problemów jest dla błędów i problemów znalezionych w rdzeniu Node.js.
Jeśli potrzebujesz bardziej ogólnej pomocy, wyślij proszę problem do naszego repozytorium pomocy. https://github.com/nodejs/help


Proszę, wypełnij poniższy szablon wszędzie, gdzie jest to możliwe.

Version: dane wyjściowe `node -v`
Platform: dane wyjściowe `uname -a` (UNIX), lub wersji 32 i 64-bitowej (Windows)
Subsystem: jeśli znany, sprecyzuj nazwę rdzennego modułu, w którym znaleziono problem

Jeśli to możliwe, dostarcz proszę kod który demonstruje problem, mając na uwadze by był on tak prosty i wolny od zewnętrznych dependencji jak to tylko możliwe.
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

## Ocenianie Raportu o Błędzie

Once an issue has been opened, it is not uncommon for there to be discussion around it. Some contributors may have differing opinions about the issue, including whether the behavior being seen is a bug or a feature. This discussion is part of the process and should be kept focused, helpful, and professional.

Short, clipped responses—that provide neither additional context nor supporting detail—are not helpful or professional. To many, such responses are simply annoying and unfriendly.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Rozwiązywanie Raportu o Błędzie

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.