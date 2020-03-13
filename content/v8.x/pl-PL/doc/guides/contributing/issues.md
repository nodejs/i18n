# Problemy

* [Jak kontrybuować przez Problemy](#how-to-contribute-in-issues)
* [Pytanie o Ogólną Pomoc](#asking-for-general-help)
* [Dyskusje na tematy nietechniczne](#discussing-non-technical-topics)
* [Zgłaszanie Raportu o Błędzie](#submitting-a-bug-report)
* [Ocenianie Raportu o Błędzie](#triaging-a-bug-report)
* [Rozwiązywanie Raportu o Błędzie](#resolving-a-bug-report)

## Jak kontrybuować przez Problemy

Dla każdego Problemu można wyróżnić trzy fundamentalne sposoby kontrybucji:

1. Przez otwarcie Problemu w celu dyskusyjnym, na przykład: Jeżeli wierzysz, że znalazłeś błąd w Node.js, tworzenie nowego problemu w liście problemów `nodejs/node` to sposób na zgłoszenie go.
2. Pomagając ocenić problem: Można to osiągnąć zarówno dostarczając pomocnych detali (test demonstrujący błąd) lub dostarczając sugestii dotyczących rozwiązania problemu.
3. Pomagając rozwiązać problem: Zazwyczaj jest to osiągnięte przez demonstrację, że zgłoszony problem nie jest wcale defektem, lub częściej przez otwarcie Żądania zmiany, które zmienia część `nodejs/node` w konkretny i łatwo sprawdzalny sposób.

## Pytanie o Ogólną Pomoc

Ponieważ poziom aktywności w repozytorium `nodejs/node` jest tak wysoki, pytania i prośby o ogólną pomoc w używaniu Node.js powinny być kierowane na repozytorium [Pomocy Node.js](https://github.com/nodejs/help/issues).

## Dyskusje na tematy nietechniczne

Dyskusje na tematy nietechniczne (takie jak własność intelektualna i znak towarowy) powinny być kierowane do [repozytorium Technical Steering Committee (TSC)](https://github.com/nodejs/TSC/issues).

## Zgłaszanie Raportu o Błędzie

Podczas otwierania nowego problemu w liście problemów `nodejs/node`, użytkownikowi do wypełnienia zostanie przedstawiony podstawowy szablon.

```markdown<!-- Dziękujemy za zgłoszenie błędu.

Ta lista problemów jest dla błędów i problemów znalezionych w rdzeniu Node.js.
Jeśli potrzebujesz bardziej ogólnej pomocy, wyślij proszę problem do naszego repozytorium pomocy. https://github.com/nodejs/help


Proszę, wypełnij poniższy szablon wszędzie, gdzie jest to możliwe.

Version: dane wyjściowe `node -v`
Platform: dane wyjściowe `uname -a` (UNIX), lub wersji 32 i 64-bitowej (Windows)
Subsystem: jeśli znany, sprecyzuj nazwę rdzennego modułu, w którym znaleziono problem

Jeśli to możliwe, dostarcz proszę kod który demonstruje problem, mając na uwadze by był on tak prosty i wolny od zewnętrznych dependencji jak to tylko możliwe.
-->* **Version**:
* **Platform**:
* **Subsystem**:

<!-- Enter your issue details below this comment. -->
```

Jeśli wierzysz, że napotkałeś błąd w Node.js, proszę wypełnij tę formę tak zgodnie z szablonem jak tylko potrafisz. Nie martw się jeśli nie możesz opowiedzieć każdego detalu, po prostu wypełnij to co możesz.

Dwa najważniejsze fragmenty informacji potrzebne do poprawnego ocenienia raportu to opis zachowania, którego doświadczasz i prosty test, którego możemy użyć by odtworzyć problem samemu. Jeśli nie możemy odtworzyć problemu, jest on dla nas niemożliwy do naprawienia.

By wyeliminować możliwość błędów, które pojawiły się na rzecz kodu od stron trzecich, testy powinny używać *wyłącznie*, tak bardzo jak to możliwe, API Node.js. Jeśli problem występuje jedynie wtedy, gdy używasz konkretnego modułu od stron trzecich, istnieje bardzo wysoka szansa, że (a) moduł posiada błąd lub (b) zmiany w Node.js zepsuły moduł.

Zobacz [Jak stworzyć Krótki, Pełny i Sprawdzalny przykład](https://stackoverflow.com/help/mcve).

## Ocenianie Raportu o Błędzie

Gdy problem zostanie otwarty, częstym jest pojawienie się wokół niego dyskusji. Niektórzy kontrybutorzy mogą mieć różne zdanie o problemie, również o tym czy zaobserwowane zachowanie jest błędem czy cechą Node.js. Dyskusja ta jest częścią procesu i powinna pozostać skupiona, pomocna i profesjonalna.

Krótkie odpowiedzi—nie dostarczające ani dodatkowego kontekstu ani pomocnych detali—nie są pomocne i profesjonalne. Dla wielu, takie odpowiedzi są zwyczajnie irytujące i nieprzyjacielskie.

Kontrybutorzy są zachęcani do wzajemnej pomocy w celu postanowienia jak największego postępu, wzajemnie wspierając się by kolaboratywnie rozwiązywać problemy. Jeśli decydujesz się skomentować problem, który twoim zdaniem nie wymaga poprawy, lub jeśli znajdziesz informacje w problemie, która twoim zdaniem jest nieprawidłowa, wyjaśnij *dlaczego* tak uważasz przytaczając dodatkowy kontekst popierający twoje stanowisko. Bądź także gotowy być przekonanym, że możesz być w błędzie. Pracując w ten sposób jesteśmy w stanie osiągnąć prawidłowy rezultat dużo szybciej.

## Rozwiązywanie Raportu o Błędzie

W znacznej większości przypadków, problemy rozwiązywane są przez otwarcie Żądania zmiany. Proces otwierania i oceniania Żądań zmiany jest podobny do otwierania i oceniania problemów, ale ciągnie za sobą niezbędny przepływ pracy skupiony na ocenie i akceptacji, który gwarantuje, że proponowane zmiany odpowiadają minimalnym wymogom jakości i funkcyjnym wytycznym projektu Node.js.
