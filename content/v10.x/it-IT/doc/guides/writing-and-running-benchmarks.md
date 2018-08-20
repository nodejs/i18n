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

It is possible to execute more groups by adding extra process arguments.

```console
$ node benchmark/run.js arrays buffers
```

### Comparing Node.js versions

To compare the effect of a new Node.js version use the `compare.js` tool. This will run each benchmark multiple times, making it possible to calculate statistics on the performance measures. To see how to use this script, run `node benchmark/compare.js`.

As an example on how to check for a possible performance improvement, the [#5134](https://github.com/nodejs/node/pull/5134) pull request will be used as an example. This pull request *claims* to improve the performance of the `string_decoder` module.

First build two versions of Node.js, one from the master branch (here called `./node-master`) and another with the pull request applied (here called `./node-pr-5134`).

To run multiple compiled versions in parallel you need to copy the output of the build: `cp ./out/Release/node ./node-master`. Check out the following example:

```console
$ git checkout master
$ ./configure && make -j4
$ cp ./out/Release/node ./node-master

$ git checkout pr-5134
$ ./configure && make -j4
$ cp ./out/Release/node ./node-pr-5134
```

The `compare.js` tool will then produce a csv file with the benchmark results.

```console
$ node benchmark/compare.js --old ./node-master --new ./node-pr-5134 string_decoder > compare-pr-5134.csv
```

*Tips: there are some useful options of `benchmark/compare.js`. For example, if you want to compare the benchmark of a single script instead of a whole module, you can use the `--filter` option:*

```console
  --new      ./new-node-binary  new node binary (required)
  --old      ./old-node-binary  old node binary (required)
  --runs     30                 number of samples
  --filter   pattern            string to filter benchmark scripts
  --set      variable=value     set benchmark variable (can be repeated)
  --no-progress                 don't show benchmark progress indicator
```

For analysing the benchmark results use the `compare.R` tool.

```console
$ cat compare-pr-5134.csv | Rscript benchmark/compare.R

                                                                                             confidence improvement accuracy (*)    (**)   (***)
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=128 encoding='ascii'                  ***     -3.76 %       ±1.36%  ±1.82%  ±2.40%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=128 encoding='utf8'                    **     -0.81 %       ±0.53%  ±0.71%  ±0.93%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=32 encoding='ascii'                   ***     -2.70 %       ±0.83%  ±1.11%  ±1.45%
 string_decoder/string-decoder.js n=2500000 chunkLen=16 inLen=32 encoding='base64-ascii'            ***     -1.57 %       ±0.83%  ±1.11%  ±1.46%
...
```

In the output, *improvement* is the relative improvement of the new version, hopefully this is positive. *confidence* tells if there is enough statistical evidence to validate the *improvement*. If there is enough evidence then there will be at least one star (`*`), more stars is just better. **However if there are no stars, then don't make any conclusions based on the *improvement*.** Sometimes this is fine, for example if no improvements are expected, then there shouldn't be any stars.

**A word of caution:** Statistics is not a foolproof tool. If a benchmark shows a statistical significant difference, there is a 5% risk that this difference doesn't actually exist. For a single benchmark this is not an issue. But when considering 20 benchmarks it's normal that one of them will show significance, when it shouldn't. A possible solution is to instead consider at least two stars (`**`) as the threshold, in that case the risk is 1%. If three stars (`***`) is considered the risk is 0.1%. However this may require more runs to obtain (can be set with `--runs`).

*For the statistically minded, the R script performs an [independent/unpaired 2-group t-test](https://en.wikipedia.org/wiki/Student%27s_t-test#Equal_or_unequal_sample_sizes.2C_unequal_variances), with the null hypothesis that the performance is the same for both versions. The confidence field will show a star if the p-value is less than `0.05`.*

The `compare.R` tool can also produce a box plot by using the `--plot filename` option. In this case there are 48 different benchmark combinations, and there may be a need to filter the csv file. This can be done while benchmarking using the `--set` parameter (e.g. `--set encoding=ascii`) or by filtering results afterwards using tools such as `sed` or `grep`. In the `sed` case be sure to keep the first line since that contains the header information.

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

### Comparing parameters

It can be useful to compare the performance for different parameters, for example to analyze the time complexity.

To do this use the `scatter.js` tool, this will run a benchmark multiple times and generate a csv with the results. To see how to use this script, run `node benchmark/scatter.js`.

```console
$ node benchmark/scatter.js benchmark/string_decoder/string-decoder.js > scatter.csv
```

After generating the csv, a comparison table can be created using the `scatter.R` tool. Even more useful it creates an actual scatter plot when using the `--plot filename` option.

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

Because the scatter plot can only show two variables (in this case *chunk* and *encoding*) the rest is aggregated. Sometimes aggregating is a problem, this can be solved by filtering. This can be done while benchmarking using the `--set` parameter (e.g. `--set encoding=ascii`) or by filtering results afterwards using tools such as `sed` or `grep`. In the `sed` case be sure to keep the first line since that contains the header information.

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

### Running Benchmarks on the CI

To see the performance impact of a Pull Request by running benchmarks on the CI, check out [How to: Running core benchmarks on Node.js CI](https://github.com/nodejs/benchmarking/blob/master/docs/core_benchmarks.md).

## Creating a benchmark

### Basics of a benchmark

All benchmarks use the `require('../common.js')` module. This contains the `createBenchmark(main, configs[, options])` method which will setup the benchmark.

The arguments of `createBenchmark` are:

* `main` {Function} The benchmark function, where the code running operations and controlling timers should go
* `configs` {Object} The benchmark parameters. `createBenchmark` will run all possible combinations of these parameters, unless specified otherwise. Each configuration is a property with an array of possible values. Note that the configuration values can only be strings or numbers.
* `options` {Object} The benchmark options. At the moment only the `flags` option for specifying command line flags is supported.

`createBenchmark` returns a `bench` object, which is used for timing the runtime of the benchmark. Run `bench.start()` after the initialization and `bench.end(n)` when the benchmark is done. `n` is the number of operations performed in the benchmark.

The benchmark script will be run twice:

The first pass will configure the benchmark with the combination of parameters specified in `configs`, and WILL NOT run the `main` function. In this pass, no flags except the ones directly passed via commands when running the benchmarks will be used.

In the second pass, the `main` function will be run, and the process will be launched with:

* The flags passed into `createBenchmark` (the third argument)
* The flags in the command passed when the benchmark was run

Beware that any code outside the `main` function will be run twice in different processes. This could be troublesome if the code outside the `main` function has side effects. In general, prefer putting the code inside the `main` function if it's more than just declaration.

```js
'use strict';
const common = require('../common.js');
const { SlowBuffer } = require('buffer');

const configs = {
  // Number of operations, specified here so they show up in the report.
  // Most benchmarks just use one value for all runs.
  n: [1024],
  type: ['fast', 'slow'],  // Custom configurations
  size: [16, 128, 1024]  // Custom configurations
};

const options = {
  // Add --expose-internals in order to require internal modules in main
  flags: ['--zero-fill-buffers']
};

// main and configs are required, options is optional.
const bench = common.createBenchmark(main, configs, options);

// Note that any code outside main will be run twice,
// in different processes, with different command line arguments.

function main(conf) {
  // Only flags that have been passed to createBenchmark
  // earlier when main is run will be in effect.
  // In order to benchmark the internal modules, require them here. For example:
  // const URL = require('internal/url').URL

  // Start the timer
  bench.start();

  // Do operations here
  const BufferConstructor = conf.type === 'fast' ? Buffer : SlowBuffer;

  for (let i = 0; i < conf.n; i++) {
    new BufferConstructor(conf.size);
  }

  // End the timer, pass in the number of operations
  bench.end(conf.n);
}
```

### Creating an HTTP benchmark

The `bench` object returned by `createBenchmark` implements `http(options, callback)` method. It can be used to run external tool to benchmark HTTP servers.

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

Supported options keys are:

* `port` - defaults to `common.PORT`
* `path` - defaults to `/`
* `connections` - number of concurrent connections to use, defaults to 100
* `duration` - duration of the benchmark in seconds, defaults to 10
* `benchmarker` - benchmarker to use, defaults to `common.default_http_benchmarker`