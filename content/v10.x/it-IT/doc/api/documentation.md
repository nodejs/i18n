# Informazioni riguardo questa Documentazione

<!--introduced_in=v0.10.0-->
<!-- type=misc -->

L'obiettivo di questa documentazione è di spiegare in modo esaustivo l'API Node.js, sia dal punto di vista di avere un riferimento su cui basarsi sia da un punto di vista concettuale. Ogni sezione descrive un modulo integrato o un concetto di alto livello.

Dove più appropriato, i tipi delle proprietà, gli argomenti dei metodi e gli argomenti forniti agli event handler sono descritti in modo dettagliato in un elenco al di sotto dell'intestazione del topic.

## Contribuire

Se vengono trovati degli errori all'interno di questa documentazione, siete pregati di [inviare un issue](https://github.com/nodejs/node/issues/new) o di vedere [la guida su come contribuire](https://github.com/nodejs/node/blob/master/CONTRIBUTING.md) per avere indicazioni su come inserire una patch.

Ogni file viene generato in base al corrispondente file `.md` nella cartella `doc/api/` nel source tree di Node.js. La documentazione viene generata utilizzando il programma `tools/doc/generate.js`. All'interno di `doc/template.html` c'è un template HTML.

## Indice di Stabilità

<!--type=misc-->

All'interno di tutta la documentazione ci sono indicazioni riguardo la stabilità di ogni sezione. L'API Node.js è ancora in qualche modo in evoluzione e, con il passare del tempo, alcune parti sono più affidabili e sicure di altre. Alcune sono talmente testate e affidabili che è improbabile possano mai cambiare. Altre invece sono nuove e sperimentali oppure note per essere pericolosi e in fase di ri-progettazione.

Gli indici di stabilità sono i seguenti:

> Stabilità: 0 - Obsoleto. The feature may emit warnings. Backward compatibility is not guaranteed.

<!-- separator -->

> Stability: 1 - Experimental. This feature is still under active development and subject to non-backward compatible changes or removal in any future version. Use of the feature is not recommended in production environments. Experimental features are not subject to the Node.js Semantic Versioning model.

<!-- separator -->

> Stability: 2 - Stable. Compatibility with the npm ecosystem is a high priority.

È necessario prestare attenzione quando si utilizzano le funzionalità `Experimental`, in particolare all'interno dei moduli che potrebbero essere utilizzati come dipendenze (o dipendenze delle dipendenze) all'interno di un'applicazione Node.js. Gli utenti finali potrebbero non essere a conoscenza del fatto che vengono utilizzate funzionalità sperimentali e pertanto potrebbero verificarsi errori imprevisti o cambiamenti di comportamento quando vengono effettuate delle modifiche all'API. Per evitare sorprese del genere, le funzionalità `Experimental` potrebbero richiedere un flag della command-line per essere abilitate esplicitamente o potrebbero causare l'emissione di un avviso di processo. Di default, tali avvisi vengono stampati su [`stderr`][] e possono essere gestiti collegando un listener all'evento [`'warning'`][].

## Output JSON
<!-- YAML
added: v0.6.12
-->

> Stabilità: 1 - Sperimentale

Ogni documento `.html` ha un corrispondente documento `.json` che presenta le stesse informazioni ma in modo strutturato. Questa funzionalità è sperimentale e aggiunta a beneficio degli IDE e di altre utility che desiderano eseguire operazioni programmatiche con la documentazione.

## Le Syscall e le pagine del manuale

Le system call (syscall) come open(2) e read(2) definiscono l'interfaccia tra i programmi utente e il sistema operativo sottostante. Node.js functions which simply wrap a syscall, like [`fs.open()`][], will document that. I documenti si collegano alle corrispondenti pagine del man (abbreviazione di pagine del manuale) che descrivono come funzionano le syscall.

La maggior parte delle syscall Unix ha i suoi equivalenti Windows, ma il comportamento su Windows può variare rispetto a quello su Linux e macOS. For an example of the subtle ways in which it's sometimes impossible to replace Unix syscall semantics on Windows, see [Node.js issue 4760](https://github.com/nodejs/node/issues/4760).
