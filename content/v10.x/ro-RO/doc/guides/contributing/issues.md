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

```markdown<!--
Mulțumim pentru raportarea unei probleme.

Acest tracker de tichete este pentru erori și probleme găsite în nucleul Node.js.
Dacă soliciți mai multă asistență generală te rog să înaintezi un tichet către ajutorul depozitarului. https://github.com/nodejs/help


Te rog completează cât mai mult din șablonul de mai jos după cum poți.

Version: ieșirea comenzii „node -v”
Platform: ieșirea comenzii „uname -a” (UNIX), sau versiune și 32 sau 64-bit (Windows)
Subsystem: dacă se cunoaște, te rog specifică numele modulului din nucleu afectat

Dacă este posibil, te rog furnizează codul care demonstrează problema, păstrându-l pe cât de simplu posibil și fără dependențe externe.
-->* **Version**:
* **Platform**:
* **Subsystem**:<!-- Introdu detaliile problemei tale sub acest comentariu. -->```

Dacă crezi că ai descoperit o eroare în Node.js, te rugăm să completezi acest formular, urmând șablonul cât mai bine posibil. Nu-ți face griji dacă nu poți răspunde la fiecare detaliu, doar completează ceea ce poți.

Cele două informații importante de care avem nevoie pentru a evalua corect raportul este o descriere a comportamentului pe care îl vezi și un simplu caz de testare pe care îl putem folosi pentru a recrea și noi problema. Dacă nu putem recrea problema, devine imposibil pentru nou să o rezolvăm.

Pentru a exclude posibilitatea introducerii de erori de către codul mediului utilizatorului, cazurile de testare ar trebui să fie limitate, pe cât posibil, *doar* la utilizarea API-urilor Node.js. Dacă eroarea apare numai atunci când utilizezi un modul de destinație specific, există o șansă foarte bună fie ca (a) modulul să aibă o eroare sau (b) ceva din Node.js s-a schimbat și a afectat modulul.

Vezi [Cum să creezi un exemplu minimal, complet și care poate fi verificat](https://stackoverflow.com/help/mcve).

## Trierea unui raport de eroare

Odată ce un tichet a fost deschis, nu este neobișnuit să existe discuții în jurul acestuia. Unii colaboratori ar putea avea opinii diferite despre problemă, inclusiv dacă comportamentul observat este o eroare sau o funcționalitate. Această discuție face parte dintr-un proces și ar trebui să fie ținută concentrată, utilă și profesională.

Răspunsurile scurte, tăiate—care nu oferă niciun context suplimentar și nici nu susțin un detaliu—nu sunt de ajutor și nici profesionale. Prea multe astfel de răspunsuri sunt pur și simplu enervante sau neprietenoase.

Colaboratorii sunt încurajați să se ajute unul pe altul, să facă progrese cât mai mult posibil, împuternicindu-se reciproc pentru a rezolva problemele în colaborare. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Rezolvarea unui raport de eroare

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.
