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

Version: output di `node -v`
Platform: output di `uname -a` (UNIX), oppure version e 32 o 64-bit (Windows)
Subsystem: se noto, specificare il nome del modulo principale colpito

Se possibile, si prega di fornire un codice che mostri il problema, mantenendolo 
semplice e libero da dipendenze esterne, nel limite della possibilità.
-->

* **Version**:
* **Platform**:
* **Subsystem**:

<!-- Inserisci i dettagli del tuo issue sotto questo commento. -->
```

Se credi di aver scoperto un bug in Node.js, compila questo modulo, seguendo il modello al meglio delle tue capacità. Non ti preoccupare se non puoi rispondere ad ogni dettaglio, riempi quello che puoi.

Le due informazioni più importanti di cui abbiamo bisogno per valutare correttamente il report sono una descrizione del comportamento che si sta vedendo ed un semplice test case che possiamo utilizzare per ricreare il problema da soli. Se non riusciamo a ricreare l'issue, diventa impossibile per noi risolverlo.

Per escludere la possibilità di bug introdotti dal codice userland, i test case dovrebbero essere limitati, per quanto possibile, al *solo* utilizzo delle API di Node.js. Se il bug si verifica solo quando si utilizza un modulo userland specifico, c'è una buona possibilità che (a) il modulo abbia un bug o (b) qualcosa in Node.js è cambiato ed ha interrotto il modulo.

Vedi [Come creare un esempio Minimo, Completo e Verificabile](https://stackoverflow.com/help/mcve).

## Valutazione di un Bug Report

Una volta aperto un'issue, succede spesso che se ne discuti a riguardo. Alcuni contributors potrebbero avere opinioni diverse riguardo l'issue, includendo anche se il comportamento visto è un bug oppure una funzionalità. Questa discussione è parte del processo e dovrebbe essere mantenuta focalizzata, utile e professionale.

Le risposte brevi e troncate—che non forniscono né un contesto aggiuntivo né dettagli di supporto—non sono né utili né professionali. Per molti, risposte del genere sono semplicemente fastidiose e scortesi.

Contributors are encouraged to help one another make forward progress as much as possible, empowering one another to solve issues collaboratively. If you choose to comment on an issue that you feel either is not a problem that needs to be fixed, or if you encounter information in an issue that you feel is incorrect, explain *why* you feel that way with additional supporting context, and be willing to be convinced that you may be wrong. By doing so, we can often reach the correct outcome much faster.

## Risoluzione di un Bug Report

In the vast majority of cases, issues are resolved by opening a Pull Request. The process for opening and reviewing a Pull Request is similar to that of opening and triaging issues, but carries with it a necessary review and approval workflow that ensures that the proposed changes meet the minimal quality and functional guidelines of the Node.js project.