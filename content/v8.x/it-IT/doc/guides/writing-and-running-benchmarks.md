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

`wrk` potrebbe essere disponibile attraverso uno dei manager dei pacchetti disponibili. If not, it can be easily built [from source](https://github.com/wg/wrk) via `make`.

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
$ node benchmark/run.js arrays

arrays/var-int.js
arrays/var-int.js n=25 type=Array: 71.90148040747789
arrays/var-int.js n=25 type=Buffer: 92.89648382795582
...

arrays/zero-float.js
arrays/zero-float.js n=25 type=Array: 75.46208316171496
arrays/zero-float.js n=25 type=Buffer: 101.62785630273159
...

arrays/zero-int.js
arrays/zero-int.js n=25 type=Array: 72.31023859816062
arrays/zero-int.js n=25 type=Buffer: 90.49906662339653
...
```

È possibile eseguire più gruppi aggiungendo ulteriori argomenti del processo.
```console
$ node benchmark/run.js arrays buffers
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

*Suggerimenti: ci sono alcune opzioni utili di `benchmark/compare.js`. For example, if you want to compare the benchmark of a single script instead of a whole module, you can use the `--filter` option:*

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

                                                                                      improvement confidence      p.value
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=1024 encoding=ascii           12.46 %         *** 1.165345e-04
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=1024 encoding=base64-ascii    24.70 %         *** 1.820615e-15
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=1024 encoding=base64-utf8     23.60 %         *** 2.105625e-12
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=1024 encoding=utf8            14.04 %         *** 1.291105e-07
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=128  encoding=ascii            6.70 %           * 2.928003e-02
...
```

In the output, _improvement_ is the relative improvement of the new version, hopefully this is positive. _confidence_ tells if there is enough statistical evidence to validate the _improvement_. Se ci sono abbastanza prove allora ci sarà almeno una stella (`*`), è sempre meglio avere più stelle possibili. **However if there are no stars, then don't make any conclusions based on the _improvement_.** Sometimes this is fine, for example if no improvements are expected, then there shouldn't be any stars.

**A word of caution:** Statistics is not a foolproof tool. Se un benchmark mostra una differenza statistica significativa, c'è un rischio del 5% che questa differenza in realtà non esista. Per un singolo benchmark questo non è un problema. Ma quando si considerano 20 benchmark è normale che uno di essi abbia un significato, anche se non dovrebbe. Una possibile soluzione è considerare invece almeno due stelle (`**`) come soglia, in tal caso il rischio è dell'1%. Con tre stelle (`***`) il rischio è dello 0.1%. Tuttavia questo potrebbe richiedere più esecuzioni per essere raggiunto (può essere impostato con `--runs`).

_Per quanto riguarda la statistica, lo script R esegue un [independent/unpaired 2-group t-test](https://en.wikipedia.org/wiki/Student%27s_t-test#Equal_or_unequal_sample_sizes.2C_unequal_variances), con l'ipotesi nulla che le prestazioni siano le stesse per entrambe le versioni. Il campo confidence mostrerà una stella se il p-value è inferiore a `0.05`._

Lo strumento `compare.R` può anche produrre un box plot utilizzando l'opzione `--plot filename`. In questo caso ci sono 48 diverse combinazioni di benchmark e potrebbe essere necessario filtrare il file csv. This can be done while benchmarking using the `--set` parameter (e.g. `--set encoding=ascii`) or by filtering results afterwards using tools such as `sed` or `grep`. In the `sed` case be sure to keep the first line since that contains the header information.

```console
$ cat compare-pr-5134.csv | sed '1p;/encoding=ascii/!d' | Rscript benchmark/compare.R --plot compare-plot.png

                                                                               improvement confidence      p.value
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=1024 encoding=ascii    12.46 %         *** 1.165345e-04
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=128 encoding=ascii      6.70 %           * 2.928003e-02
string_decoder/string-decoder.js n=250000 chunk=1024 inlen=32 encoding=ascii       7.47 %         *** 5.780583e-04
string_decoder/string-decoder.js n=250000 chunk=16 inlen=1024 encoding=ascii       8.94 %         *** 1.788579e-04
string_decoder/string-decoder.js n=250000 chunk=16 inlen=128 encoding=ascii       10.54 %         *** 4.016172e-05
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
$ cat scatter.csv | Rscript benchmark/scatter.R --xaxis chunk --category encoding --plot scatter-plot.png --log

aggregating variable: inlen

chunk     encoding      mean confidence.interval
   16        ascii 1111933.3           221502.48
   16 base64-ascii  167508.4            33116.09
   16  base64-utf8  122666.6            25037.65
   16         utf8  783254.8           159601.79
   64        ascii 2623462.9           399791.36
   64 base64-ascii  462008.3            85369.45
   64  base64-utf8  420108.4            85612.05
   64         utf8 1358327.5           235152.03
  256        ascii 3730343.4           371530.47
  256 base64-ascii  663281.2            80302.73
  256  base64-utf8  632911.7            81393.07
  256         utf8 1554216.9           236066.53
 1024        ascii 4399282.0           186436.46
 1024 base64-ascii  730426.6            63806.12
 1024  base64-utf8  680954.3            68076.33
 1024         utf8 1554832.5           237532.07
```

Because the scatter plot can only show two variables (in this case _chunk_ and _encoding_) the rest is aggregated. A volte l'aggregazione è un problema, che però può essere risolto tramite il filtro. Questo può essere fatto durante il benchmarking usando il parametro `--set` (es. `--set encoding=ascii`) oppure filtrando successivamente i risultati usando strumenti come `sed` o `grep`. Nel caso di `sed` assicurati di mantenere così la prima riga dal momento che contiene le informazioni dell'header.

```console
$ cat scatter.csv | sed -E '1p;/([^,]+, ){3}128,/!d' | Rscript benchmark/scatter.R --xaxis chunk --category encoding --plot scatter-plot.png --log

chunk     encoding       mean confidence.interval
   16        ascii  701285.96           21233.982
   16 base64-ascii  107719.07            3339.439
   16  base64-utf8   72966.95            2438.448
   16         utf8  475340.84           17685.450
   64        ascii 2554105.08           87067.132
   64 base64-ascii  330120.32            8551.707
   64  base64-utf8  249693.19            8990.493
   64         utf8 1128671.90           48433.862
  256        ascii 4841070.04          181620.768
  256 base64-ascii  849545.53           29931.656
  256  base64-utf8  809629.89           33773.496
  256         utf8 1489525.15           49616.334
 1024        ascii 4931512.12          165402.805
 1024 base64-ascii  863933.22           27766.982
 1024  base64-utf8  827093.97           24376.522
 1024         utf8 1487176.43           50128.721
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
  const server = http.createServer(function(req, res) {
    res.end(chunk);
  });

  server.listen(common.PORT, function() {
    bench.http({
      connections: conf.connections,
    }, function() {
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
