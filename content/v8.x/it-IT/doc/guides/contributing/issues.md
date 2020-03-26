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

```markdown<!--
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
-->* **Version**:
* **Platform**:
* **Subsystem**:<!-- Inserisci i dettagli del tuo issue sotto questo commento. -->```

Se credi di aver scoperto un bug in Node.js, compila questo modulo, seguendo il modello al meglio delle tue capacità. Non ti preoccupare se non puoi rispondere ad ogni dettaglio, riempi quello che puoi.

Le due informazioni più importanti di cui abbiamo bisogno per valutare correttamente il report sono una descrizione del comportamento che si sta vedendo ed un semplice test case che possiamo utilizzare per ricreare il problema da soli. Se non riusciamo a ricreare l'issue, diventa impossibile per noi risolverlo.

Per escludere la possibilità di bug introdotti dal codice userland, i test case dovrebbero essere limitati, per quanto possibile, al *solo* utilizzo delle API di Node.js. Se il bug si verifica solo quando si utilizza un modulo userland specifico, c'è una buona possibilità che (a) il modulo abbia un bug o (b) qualcosa in Node.js è cambiato ed ha interrotto il modulo.

Vedi [Come creare un esempio Minimo, Completo e Verificabile](https://stackoverflow.com/help/mcve).

## Smistamento di un Bug Report

Una volta aperto un'issue, succede spesso che se ne discuti a riguardo. Alcuni contributors potrebbero avere opinioni diverse riguardo l'issue, includendo anche se il comportamento visto è un bug oppure una funzionalità. Questa discussione è parte del processo e dovrebbe essere mantenuta focalizzata, utile e professionale.

Le risposte brevi e troncate—che non forniscono né un contesto aggiuntivo né dettagli di supporto—non sono né utili né professionali. Per molti, risposte del genere sono semplicemente fastidiose e scortesi.

I contributors sono incoraggiati ad aiutarsi l'un l'altro per progredire il più possibile, supportandosi a vicenda per risolvere gli issue in modo collaborativo. Se scegli di commentare un issue che ritieni non sia un problema da correggere oppure se incontri informazioni in un issue che ritieni non corrette, spiega *perché* la pensi in quel modo supportandoti con un contesto aggiuntivo e sii pronto ad essere consapevole del fatto che potresti anche sbagliare. Facendo così, spesso possiamo raggiungere il risultato corretto molto più velocemente.

## Risoluzione di un Bug Report

Nella stragrande maggioranza dei casi, gli issue vengono risolti aprendo una Pull Request. Il processo di apertura e revisione di una Pull Request è simile a quello di apertura e valutazione degli issue, ma comporta un necessario workflow di revisione ed approvazione che garantisce che le modifiche proposte soddisfino le linee guida minime di qualità e funzionalità del progetto Node.js.
