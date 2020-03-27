# Come Scrivere ed Eseguire i Benchmark nel Node.js Core

## Sommario

* [Prerequisiti](#prerequisites)
  * [Requisiti del Benchmark HTTP](#http-benchmark-requirements)
  * [Requisiti per l'Analisi del Benchmark](#benchmark-analysis-requirements)
* [Eseguire i benchmark](#running-benchmarks)
  * [Eseguire i singoli benchmark](#running-individual-benchmarks)
  * [Eseguire tutti i benchmark](#running-all-benchmarks)
  * [Confronto tra le versioni di Node.js](#comparing-nodejs-versions)
  * [Confronto dei parametri](#comparing-parameters)
  * [Eseguire i Benchmark sulla CI](#running-benchmarks-on-the-ci)
* [Creare un benchmark](#creating-a-benchmark)
  * [Nozioni di base su un benchmark](#basics-of-a-benchmark)
  * [Creare un benchmark HTTP](#creating-an-http-benchmark)

## Prerequisiti

Per alcuni benchmark sono necessari strumenti Basic Unix. [Git per Windows](http://git-scm.com/download/win) include Git Bash e gli strumenti necessari, che devono essere inclusi nel Windows `PATH` globale.

### Requisiti del Benchmark HTTP

La maggior parte dei benchmark HTTP richiede l'installazione di un benchmarker. Questo può essere [`wrk`](https://github.com/wg/wrk) oppure [`autocannon`](https://github.com/mcollina/autocannon).

`Autocannon` è uno script Node.js che può essere installato utilizzando `npm install -g autocannon`. Utilizzerà l'eseguibile Node.js che si trova nel path (percorso). Per mettere a confronto due esecuzioni di benchmark HTTP, assicurarsi che la versione Node.js nel path (percorso) non sia alterata.

`wrk` potrebbe essere disponibile attraverso uno dei manager dei pacchetti disponibili. In caso contrario, può essere facilmente creato [dalla sorgente](https://github.com/wg/wrk) tramite `make`.

Di default, `wrk` sarà utilizzato come benchmarker. Se non è disponibile, sarà utilizzato `autocannon` al suo posto. Quando si crea un benchmark HTTP, è necessario specificare il benchmarker da utilizzare fornendolo come un argomento:

`node benchmark/run.js --set benchmarker=autocannon http`

`node benchmark/http/simple.js benchmarker=autocannon`

#### Requisiti del Benchmark HTTP/2

Per eseguire i benchmark `http2`, è necessario utilizzare il benchmarker `h2load`. Lo strumento `h2load` è una componente del progetto `nghttp2` e può essere installato da [nghttp2.org](http://nghttp2.org) oppure può essere creato dalla sorgente.

`node benchmark/http2/simple.js benchmarker=autocannon`

### Requisiti per l'Analisi del Benchmark

Per analizzare i risultati, dovrebbe essere installato `R`. Utilizza uno dei manager dei pacchetti disponibili o scaricalo da https://www.r-project.org/.

Vengono usati anche i pacchetti R `ggplot2` e `plyr` e possono essere installati usando R REPL.

```R
$ R
install.packages("ggplot2")
install.packages("plyr")
```

Nel caso in cui venga segnalato un messaggio per indicare che deve essere selezionato per primo un CRAN mirror, specifica un mirror aggiungendo il parametro repo.

Se usassimo il mirror "http://cran.us.r-project.org", si potrebbe scrivere qualcosa del genere:

```R
install.packages("ggplot2", repo="http://cran.us.r-project.org")
```

Naturalmente, utilizza un mirror appropriato in base alla posizione (location). Una lista dei mirror è [disponibile qui](https://cran.r-project.org/mirrors.html).

## Eseguire i benchmark

### Eseguire i singoli benchmark

Questo può essere utile per eseguire il debug di un benchmark oppure per eseguire una misura rapida delle prestazioni (performance). Ma non fornisce le informazioni statistiche per trarre conclusioni delle conclusioni sulle prestazioni (performance).

I singoli benchmark possono essere eseguiti semplicemente eseguendo lo script di benchmark con node.

```console
$ node benchmark/buffers/buffer-tostring.js

buffers/buffer-tostring.js n=10000000 len=0 arg=true: 62710590.393305704
buffers/buffer-tostring.js n=10000000 len=1 arg=true: 9178624.591787899
buffers/buffer-tostring.js n=10000000 len=64 arg=true: 7658962.8891432695
buffers/buffer-tostring.js n=10000000 len=1024 arg=true: 4136904.4060201733
buffers/buffer-tostring.js n=10000000 len=0 arg=false: 22974354.231509723
buffers/buffer-tostring.js n=10000000 len=1 arg=false: 11485945.656765845
buffers/buffer-tostring.js n=10000000 len=64 arg=false: 8718280.70650129
buffers/buffer-tostring.js n=10000000 len=1024 arg=false: 4103857.0726124765
```

Ogni riga rappresenta un singolo benchmark con parametri specificati come `${variable}=${value}`. Ogni combinazione di configurazione viene eseguita in un processo separato. Ciò garantisce che i risultati del benchmark non siano influenzati dall'ordine di esecuzione a causa delle ottimizzazioni di V8. **L'ultimo numero è il rate delle operazioni misurato in ops/sec (più è alto meglio è).**

Inoltre, è possibile specificare un sottoinsieme delle configurazioni, impostandole negli argomenti del processo:

```console
$ node benchmark/buffers/buffer-tostring.js len=1024

buffers/buffer-tostring.js n=10000000 len=1024 arg=true: 3498295.68561504
buffers/buffer-tostring.js n=10000000 len=1024 arg=false: 3783071.1678948295
```

### Eseguire tutti i benchmark

Simile all'esecuzione dei singoli benchmark, un gruppo di benchmark può essere eseguito utilizzando lo strumento `run.js`. Per vedere come utilizzare questo script, esegui `node benchmark/run.js`. Ancora una volta questo non fornisce le informazioni statistiche per trarre delle conclusioni.

```console
$ node benchmark/run.js assert

assert/deepequal-buffer.js
assert/deepequal-buffer.js method="deepEqual" strict=0 len=100 n=20000: 773,200.4995493788
assert/deepequal-buffer.js method="notDeepEqual" strict=0 len=100 n=20000: 964,411.712953848
...

assert/deepequal-map.js
assert/deepequal-map.js method="deepEqual_primitiveOnly" strict=0 len=500 n=500: 20,445.06368453332
assert/deepequal-map.js method="deepEqual_objectOnly" strict=0 len=500 n=500: 1,393.3481642240833
...

assert/deepequal-object.js
assert/deepequal-object.js method="deepEqual" strict=0 size=100 n=5000: 1,053.1950937538475
assert/deepequal-object.js method="notDeepEqual" strict=0 size=100 n=5000: 9,734.193251965213
...
```

È possibile eseguire più gruppi aggiungendo ulteriori argomenti del processo.

```console
$ node benchmark/run.js assert async_hooks
```

### Confronto tra le versioni di Node.js

Per confrontare l'effetto di una nuova versione di Node.js, utilizza lo strumento `compare.js`. Questo eseguirà ogni benchmark più volte, rendendo possibile il calcolo delle statistiche sulle misure delle prestazioni (performance). Per vedere come utilizzare questo script, esegui `node benchmark/compare.js`.

Come esempio su come verificare un possibile miglioramento delle prestazioni verrà utilizzata la pull request [#5134](https://github.com/nodejs/node/pull/5134). Questa pull request _pretende_ di migliorare le prestazioni del modulo `string_decoder`.

Prima costruisci due versioni di Node.js, una dal master branch (qui chiamato`./node-master`) ed un'altra con l'applicazione della pull request (qui chiamata `./node-pr-5134`).

Per eseguire più versioni compilate in parallelo è necessario copiare l'output della build: `cp ./out/Release/node ./node-master`. Guarda il seguente esempio:

```console
$ git checkout master
$ ./configure && make -j4
$ cp ./out/Release/node ./node-master

$ git checkout pr-5134
$ ./configure && make -j4
$ cp ./out/Release/node ./node-pr-5134
```

Lo strumento `compare.js` produrrà quindi un file csv con i risultati del benchmark.

```console
$ node benchmark/compare.js --old ./node-master --new ./node-pr-5134 string_decoder > compare-pr-5134.csv
```

*Suggerimenti: ci sono alcune opzioni utili di `benchmark/compare.js`. Ad esempio, se desideri confrontare il benchmark di un singolo script anziché di un intero modulo, puoi utilizzare l'opzione `--filter`:*

```console
  --new      ./new-node-binary  nuovo node binary (richiesto)
  --old      ./old-node-binary  vecchio node binary (richiesto)
  --runs     30                 numero di campioni
  --filter   pattern            stringa per filtrare gli script di benchmark
  --set      variable=value     imposta la variabile benchmark (può essere ripetuto)
  --no-progress                 non mostra l'indicatore di progresso del benchmark
```

Per analizzare i risultati del benchmark utilizza lo strumento `compare.R`.

```console
$ cat compare-pr-5134.csv | Rscript benchmark/compare.R

                                                                                             confidence improvement accuracy (*)    (**)   (***)
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=128 encoding='ascii'                  ***     -3.76 %       ±1.36%  ±1.82%  ±2.40%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=128 encoding='utf8'                    **     -0.81 %       ±0.53%  ±0.71%  ±0.93%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=32 encoding='ascii'                   ***     -2.70 %       ±0.83%  ±1.11%  ±1.45%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=32 encoding='base64-ascii'            ***     -1.57 %       ±0.83%  ±1.11%  ±1.46%
...
```

In the output, _improvement_ is the relative improvement of the new version, hopefully this is positive. _confidence_ tells if there is enough statistical evidence to validate the _improvement_. Se ci sono abbastanza prove allora ci sarà almeno una stella (`*`), è sempre meglio avere più stelle possibili. **However if there are no stars, then don't make any conclusions based on the _improvement_.** Sometimes this is fine, for example if no improvements are expected, then there shouldn't be any stars.

**A word of caution:** Statistics is not a foolproof tool. Se un benchmark mostra una differenza statistica significativa, c'è un rischio del 5% che questa differenza in realtà non esista. Per un singolo benchmark questo non è un problema. Ma quando si considerano 20 benchmark è normale che uno di essi abbia un significato, anche se non dovrebbe. Una possibile soluzione è considerare invece almeno due stelle (`**`) come soglia, in tal caso il rischio è dell'1%. Con tre stelle (`***`) il rischio è dello 0.1%. Tuttavia questo potrebbe richiedere più esecuzioni per essere raggiunto (può essere impostato con `--runs`).

_Per quanto riguarda la statistica, lo script R esegue un [independent/unpaired 2-group t-test](https://en.wikipedia.org/wiki/Student%27s_t-test#Equal_or_unequal_sample_sizes.2C_unequal_variances), con l'ipotesi nulla che le prestazioni siano le stesse per entrambe le versioni. Il campo confidence mostrerà una stella se il p-value è inferiore a `0.05`._

Lo strumento `compare.R` può anche produrre un box plot utilizzando l'opzione `--plot filename`. In questo caso ci sono 48 diverse combinazioni di benchmark e potrebbe essere necessario filtrare il file csv. Questo può essere fatto durante il benchmarking usando il parametro `--set` (es. `--set encoding=ascii`) oppure filtrando successivamente i risultati usando strumenti come `sed` o `grep`. Nel caso di `sed` assicurati di mantenere così la prima riga dal momento che contiene le informazioni dell'header.

```console
$ cat compare-pr-5134.csv | sed '1p;/encoding='"'"ascii"'"'/!d' | Rscript benchmark/compare.R --plot compare-plot.png

                                                                                      confidence improvement accuracy (*)    (**)   (***)
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=128 encoding='ascii'           ***     -3.76 %       ±1.36%  ±1.82%  ±2.40%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=32 encoding='ascii'            ***     -2.70 %       ±0.83%  ±1.11%  ±1.45%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=4096 encoding='ascii'          ***     -4.06 %       ±0.31%  ±0.41%  ±0.54%
 string_decoder/string-decoder.js n=2500000 chunkLen=256 inLen=1024 encoding='ascii'         ***     -1.42 %       ±0.58%  ±0.77%  ±1.01%
...
```

![compare tool boxplot](doc_img/compare-boxplot.png)

### Confronto dei parametri

Può essere utile confrontare le prestazioni per diversi parametri, ad esempio per analizzare la complessità temporale.

Per farlo utilizza lo strumento `scatter.js`, eseguirà un benchmark più volte e genererà un csv con i risultati. Per vedere come utilizzare questo script, esegui `node benchmark/scatter.js`.

```console
$ node benchmark/scatter.js benchmark/string_decoder/string-decoder.js > scatter.csv
```

Dopo aver generato il csv, è possibile creare una tabella di confronto utilizzando lo strumento `scatter.R`. Ancora più utile, tramite l'opzione `--plot filename`, si può creare uno scatter plot reale.

```console
$ cat scatter.csv | Rscript benchmark/scatter.R --xaxis chunkLen --category encoding --plot scatter-plot.png --log

aggregating variable: inLen

chunkLen     encoding      rate confidence.interval
      16        ascii 1515855.1           334492.68
      16 base64-ascii  403527.2            89677.70
      16  base64-utf8  322352.8            70792.93
      16      utf16le 1714567.5           388439.81
      16         utf8 1100181.6           254141.32
      64        ascii 3550402.0           661277.65
      64 base64-ascii 1093660.3           229976.34
      64  base64-utf8  997804.8           227238.04
      64      utf16le 3372234.0           647274.88
      64         utf8 1731941.2           360854.04
     256        ascii 5033793.9           723354.30
     256 base64-ascii 1447962.1           236625.96
     256  base64-utf8 1357269.2           231045.70
     256      utf16le 4039581.5           655483.16
     256         utf8 1828672.9           360311.55
    1024        ascii 5677592.7           624771.56
    1024 base64-ascii 1494171.7           227302.34
    1024  base64-utf8 1399218.9           224584.79
    1024      utf16le 4157452.0           630416.28
    1024         utf8 1824266.6           359628.52
```

Because the scatter plot can only show two variables (in this case _chunkLen_ and _encoding_) the rest is aggregated. A volte l'aggregazione è un problema, che però può essere risolto tramite il filtro. Questo può essere fatto durante il benchmarking usando il parametro `--set` (es. `--set encoding=ascii`) oppure filtrando successivamente i risultati usando strumenti come `sed` o `grep`. Nel caso di `sed` assicurati di mantenere così la prima riga dal momento che contiene le informazioni dell'header.

```console
$ cat scatter.csv | sed -E '1p;/([^,]+, ){3}128,/!d' | Rscript benchmark/scatter.R --xaxis chunkLen --category encoding --plot scatter-plot.png --log

chunkLen     encoding      rate confidence.interval
      16        ascii 1302078.5            71692.27
      16 base64-ascii  338669.1            15159.54
      16  base64-utf8  281904.2            20326.75
      16      utf16le 1381515.5            58533.61
      16         utf8  831183.2            33631.01
      64        ascii 4363402.8           224030.00
      64 base64-ascii 1036825.9            48644.72
      64  base64-utf8  780059.3            60994.98
      64      utf16le 3900749.5           158366.84
      64         utf8 1723710.6            80665.65
     256        ascii 8472896.1           511822.51
     256 base64-ascii 2215884.6           104347.53
     256  base64-utf8 1996230.3           131778.47
     256      utf16le 5824147.6           234550.82
     256         utf8 2019428.8           100913.36
    1024        ascii 8340189.4           598855.08
    1024 base64-ascii 2201316.2           111777.68
    1024  base64-utf8 2002272.9           128843.11
    1024      utf16le 5789281.7           240642.77
    1024         utf8 2025551.2            81770.69
```

![compare tool boxplot](doc_img/scatter-plot.png)

### Eseguire i Benchmark sulla CI

Per vedere l'impatto di una Pull Request sulle prestazioni eseguendo i benchmark sulla CI, dai un'occhiata a [How to: Eseguire dei core benchmark su Node.js CI](https://github.com/nodejs/benchmarking/blob/master/docs/core_benchmarks.md).

## Creare un benchmark

### Nozioni di base su un benchmark

Tutti i benchmark utilizzato il modulo `require('../common.js')`. Questo contiene il metodo `createBenchmark(main, configs[, options])` che creerà il setup del benchmark.

Gli argomenti di `createBenchmark` sono:

* `main` {Function} La funzione benchmark, in cui devono essere eseguite le operazioni di esecuzione del codice ed i timer di controllo
* `configs` {Object} I parametri del benchmark. `createBenchmark` eseguirà tutte le possibili combinazioni di questi parametri, se non viene specificato diversamente. Ogni configurazione è una proprietà con un array di valori possibili. Da notare che i valori di configurazione possono essere solo stringhe o numeri.
* `options` {Object} Le opzioni del benchmark. Al momento è supportata solo l'opzione `flags` per specificare i flag della command line.

`createBenchmark` restituisce un `bench` object, il quale viene utilizzato per il timing del runtime del benchmark. Esegui `bench.start()` dopo l'inizializzazione e `bench.end(n)` quando il benchmark si conclude. `n` è il numero di operazioni eseguite nel benchmark.

Lo script del benchmark verrà eseguito due volte:

Il primo passaggio configurerà il benchmark con la combinazione di parametri specificati in `configs` e NON eseguirà la funzione `main`. In questo passaggio, non verranno utilizzati flag tranne quelli passati direttamente tramite i comandi durante l'esecuzione dei benchmark.

Nel secondo passaggio verrà eseguita la funzione `main` ed il processo verrà avviato con:

* I flag passati all'interno di `createBenchmark` (il terzo argomento)
* I flag nel comando passati quando veniva eseguito il benchmark

Assicurati che qualsiasi codice al di fuori della funzione `main` venga eseguito due volte in processi diversi. Ciò potrebbe essere problematico se il codice al di fuori della funzione `main` ha effetti collaterali. In genere, si preferisce inserire il codice nella funzione `main` se è più di una semplice istruzione.

```js
'use strict';
const common = require('../common.js');
const { SlowBuffer } = require('buffer');

const configs = {
  // Numero di operazioni, specificato qui in modo che vengano mostrate nel report.
  // La maggior parte dei benchmark usa solo un valore per tutte le esecuzioni.
  n: [1024],
  type: ['fast', 'slow'],  // Configurazioni personalizzate
  size: [16, 128, 1024]  // Configurazioni personalizzate
};

const options = {
  // Aggiungi --expose-internals in modo da richiedere i moduli interni in main
  flags: ['--zero-fill-buffers']
};

// main e configs sono necessari, options è facoltativo.
const bench = common.createBenchmark(main, configs, options);

// Si noti che qualsiasi codice esterno a main verrà eseguito due volte, 
// in processi diversi, con diversi argomenti della command line.

function main(conf) {
  // Saranno in vigore solo i flag che sono stati passati a createBenchmark 
  // in precedenza quando è stato eseguito main.
  // Al fine di eseguire il benchmark per i moduli interni, richiedili qui. For example:
  // const URL = require('internal/url').URL

  // Avvia il timer
  bench.start();

  // Fa operazioni qui
  const BufferConstructor = conf.type === 'fast' ? Buffer : SlowBuffer;

  for (let i = 0; i < conf.n; i++) {
    new BufferConstructor(conf.size);
  }

  // Termina il timer, passa il numero di operazioni
  bench.end(conf.n);
}
```

### Creare un benchmark HTTP

Il `bench` object restituito da `createBenchmark` implementa il metodo `http(options, callback)`. Può essere utilizzato per eseguire strumenti esterni per il benchmark dei server HTTP.

```js
'use strict';

const common = require('../common.js');

const bench = common.createBenchmark(main, {
  kb: [64, 128, 256, 1024],
  connections: [100, 500]
});

function main(conf) {
  const http = require('http');
  const len = conf.kb * 1024;
  const chunk = Buffer.alloc(len, 'x');
  const server = http.createServer((req, res) => {
    res.end(chunk);
  });

  server.listen(common.PORT, () => {
    bench.http({
      connections: conf.connections,
    }, () => {
      server.close();
    });
  });
}
```

Le option key supportate sono:

* `port` - `common.PORT` di default
* `path` - `/` di default
* `connections` - numero di connessioni simultanee da utilizzare, 100 di default
* `duration` - durata del benchmark in secondi, 10 di default
* `benchmarker` - benchmarker da utilizzare, `common.default_http_benchmarker` di default
