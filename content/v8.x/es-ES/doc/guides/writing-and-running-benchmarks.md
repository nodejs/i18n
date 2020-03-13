# Cómo Escribir y Ejecutar Pruebas de Rendimiento en la Base de Node.js

## Tabla de Contenidos

* [Pre-requisitos](#prerequisites)
  * [Requerimientos de la Prueba de Rendimiento de HTTP](#http-benchmark-requirements)
  * [Requerimientos del Análisis de la Prueba de Rendimiento](#benchmark-analysis-requirements)
* [Ejecución de pruebas de rendimiento](#running-benchmarks)
  * [Ejecución de pruebas de rendimiento individuales](#running-individual-benchmarks)
  * [Ejecución de todas las pruebas de rendimiento](#running-all-benchmarks)
  * [Comparación de versiones de Node.js](#comparing-nodejs-versions)
  * [Comparación de parámetros](#comparing-parameters)
  * [Ejecución de Pruebas de Rendimiento en el CI](#running-benchmarks-on-the-ci)
* [Creación de una prueba de rendimiento](#creating-a-benchmark)
  * [Conceptos básicos de una prueba de rendimiento](#basics-of-a-benchmark)
  * [Creación de una prueba de rendimiento de HTTP](#creating-an-http-benchmark)

## Prerrequisitos

Se requieren herramientas básicas de Unix para algunas pruebas de rendimiento. [Git para Windows](http://git-scm.com/download/win) incluye Git Bash y las herramientas necesarias, las cuales necesitan estar incluidas en el `PATH` global de Windows.

### Requisitos de la Prueba de Rendimiento HTTP

La mayoría de las pruebas de rendimiento de HTTP requieren que se instale un benchmarker. Este puede ser tanto [`wrk`](https://github.com/wg/wrk) como [`autocannon`](https://github.com/mcollina/autocannon).

`Autocannon` es un script de Node.js que puede ser instalado usando `npm install -g autocannon`. Utilizará el Node.js ejecutable que esté en la ruta. Para comparar dos ejecuciones de pruebas de rendimiento de HTTP, asegúrese de que la versión de Node.js en la ruta no esté alterada.

`wrk` puede estar disponible a través de uno de los gestores de paquetes disponible. If not, it can be easily built [from source](https://github.com/wg/wrk) via `make`.

Por defecto, `wrk` será utilizado como el benchmarker. Si no está disponible, se utilizará `autocannon` en su lugar. Al crear una prueba de rendimiento de HTTP, el benchmarker a utilizar debe ser especificado al proporcionarlo como un argumento:

`node benchmark/run.js --set benchmarker=autocannon http`

`node benchmark/http/simple.js benchmarker=autocannon`

#### Requerimientos de la Prueba de Rendimiento de HTTP/2

Para ejecutar las pruebas de rendimiento de `http2`, se debe utilizar el benchmarker `h2load`. La herramienta `h2load` es un componente del proyecto `nghttp2` y puede ser instalada desde [nghttp2.org](http://nghttp2.org) o construida desde la fuente.

`node benchmark/http2/simple.js benchmarker=autocannon`

### Requisitos del Análisis de la Prueba de Rendimiento

Para analizar los resultados, se debe instalar `R`. Utilice uno de los gestores de paquete disponibles o descárguelo desde https://www.r-project.org/.

Los paquetes R `ggplot2` y `plyr` también son utilizados y puede ser instalados utilizando el REPL R.

```R
$ R
install.packages("ggplot2")
install.packages("plyr")
```

En el evento en el que es reportado un mensaje declarando que un espejo CRAN debe ser seleccionado primero, especifique un espejo agregando el parámetro repo.

Si usamos el espejo "http://cran.us.r-project.org", podría verse algo así:

```R
install.packages("ggplot2", repo="http://cran.us.r-project.org")
```

Por supuesto, utilice un espejo apropiado basado en la ubicación. [Acá](https://cran.r-project.org/mirrors.html) está ubicada una lista de espejos.

## Ejecutar pruebas de rendimiento

### Ejecutar pruebas de rendimiento individuales

Esto puede ser útil para depurar una prueba de rendimiento o para hacer una medida de rendimiento rápida. Pero no proporciona la información estadística para hacer cualquier conclusión acerca del rendimiento.

Las pruebas de rendimiento individuales pueden ser ejecutadas simplemente ejecutando el script de la prueba de rendimiento con node.

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

Cada línea representa una sola prueba de rendimiento con parámetros especificados como `${variable}=${value}`. Cada combinación de configuración es ejecutada en un proceso separado. Esto asegura que los resultados de la prueba de rendimiento no se vean afectados por el orden de ejecución debido a optimizaciones de V8. **El último número es la tasa de operaciones medidas en ops/seg (mientras más alto, mejor).**

Además, se puede especificar un subconjunto de configuraciones al establecerlas en los argumentos del proceso:

```console
$ node benchmark/buffers/buffer-tostring.js len=1024

buffers/buffer-tostring.js n=10000000 len=1024 arg=true: 3498295.68561504
buffers/buffer-tostring.js n=10000000 len=1024 arg=false: 3783071.1678948295
```

### Ejecutar todas las pruebas de rendimiento

Similar a ejecutar pruebas de rendimiento individuales, un grupo de pruebas de rendimiento pueden ser ejecutadas utilizando la herramienta `run.js`. Para ver cómo utilizar este script, ejecute `node benchmark/run.js`. De nuevo, esto no proporciona la información estadística para hacer alguna conclusión.

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

Es posible ejecutar más grupos al añadir argumentos de proceso adicionales.
```console
$ node benchmark/run.js arrays buffers
```

### Comparar versiones de Node.js

Para comparar el efecto de una nueva versión de Node.js utilice la herramienta `compare.js`. Esto ejecutará cada prueba de rendimiento múltiples veces, haciendo posible calcular estadísticas en las medidas de rendimiento. Para ver cómo utilizar este script, ejecute `node benchmark/compare.js`.

Como un ejemplo sobre cómo verificar una posible mejora de rendimiento, la pull request [#5134](https://github.com/nodejs/node/pull/5134) será utilizada como un ejemplo. Esta pull request _delcara_ mejorar el rendimiento del módulo `string_decoder`.

Primero construya dos versiones de Node.js, una desde la rama master (aquí llamada `./node-master`) y otra con la pull request aplicada (aquí llamada `./node-pr-5134`).

Para ejecutar múltiples versiones compiladas en paralelo necesita copiar la salida del build: `cp ./out/Release/node ./node-master`. Vea el siguiente ejemplo:

```console
$ git checkout master
$ ./configure && make -j4
$ cp ./out/Release/node ./node-master

$ git checkout pr-5134
$ ./configure && make -j4
$ cp ./out/Release/node ./node-pr-5134
```

La herramienta `compare.js` producirá entonces un archivo csv con los resultados de la prueba de rendimiento.

```console
$ node benchmark/compare.js --old ./node-master --new ./node-pr-5134 string_decoder > compare-pr-5134.csv
```

*Consejos: hay algunas opciones útiles de `benchmark/compare.js`. For example, if you want to compare the benchmark of a single script instead of a whole module, you can use the `--filter` option:*

```console
  --new      ./new-node-binary  new node binary (required)
  --old      ./old-node-binary  old node binary (required)
  --runs     30                 número de muestras
  --filter   pattern            string para filtrar scripts de la prueba de rendimiento
  --set      variable=value     establece la variable de la prueba de rendimiento (se puede repetir)
  --no-progress                 no mostrar el indicador de progreso de la prueba de rendimiento
```

Para analizar los resultados de la prueba de rendimiento use la herramienta `compare.R`.

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

En la salida, _improvement_ es la mejora relativa de la nueva versión, con suerte esto es positivo. _confidence_ dice si hay suficiente evidencia estadística para validar la _mejora_. Si hay suficiente evidencia, entonces habrá al menos una estrella (`*`), más estrellas es simplemente mejor. **However if there are no stars, then don't make any conclusions based on the _improvement_.** Sometimes this is fine, for example if no improvements are expected, then there shouldn't be any stars.

**Una advertencia:** La estadística no es una herramienta infalible. Si una benchmark muestra una diferencia estadística significante, hay un 5% de riesgo de que esta diferencia no exista realmente. Esto no es un problema para una sola prueba de rendimiento. Pero cuando se estén considerando 20 pruebas de rendimiento es normal que una de ellas muestre importancia, cuando no debería. Una posible solución es en cambio considerar al menos dos estrellas (`**`) como el límite, es ese caso el riesgo es de 1%. Si hay tres estrellas (`***`) se considera que el riesgo es de 0.1%. Si embargo, esto puede requerir mas ejecuciones para obtener (puede ser establecido con `--runs`).

_Para los de mentalidad estadística, el script R realiza un [t-test 2-group independiente/desapareado](https://en.wikipedia.org/wiki/Student%27s_t-test#Equal_or_unequal_sample_sizes.2C_unequal_variances), con la hipótesis nula de que el rendimiento es el mismo para ambas versiones. El campo de confianza mostrará una estrella si el valor de p es menor que `0.05`._

La herramienta `compare.R` también puede producir un diagrama de caja al usar la opción `--plot filename`. En este caso hay 48 combinaciones de benchmarks diferentes, y puede ser necesario filtrar el archivo csv. Esto se puede hacer durante el benchmarking utilizando el parámetro `--set` (por ejemplo, `--set encoding=ascii`) o filtrando resultados después de utilizar herramientas tales como `sed` o `grep`. En el caso de `sed` asegúrese de mantener la primera línea, ya que contiene la información de la cabecera.

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

### Comparar parámetros

Puede ser útil para comparar el comportamiento de diferentes parámetros, por ejemplo, para analizar la complejidad del tiempo.

Para hacer esto use la herramienta `scatter.js`, esto ejecutará una prueba de rendimiento múltiples veces y generará un csv con los resultados. Para ver cómo usar este script, ejecute `node benchmark/scatter.js`.

```console
$ node benchmark/scatter.js benchmark/string_decoder/string-decoder.js > scatter.csv
```

Después de generar el csv, una tabla de comparación puede ser creada usando la herramienta `scatter.R`. Aún más útil, puede crear un diagrama de dispersión real cuando utilice la opción `--plot filename`.

```console
$ cat scatter.csv | Rscript benchmark/scatter.R --xaxis chunk --category encoding --plot scatter-plot.png --log

variable agregada: inlen

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

Debido a que el diagrama de dispersión solo puede mostrar dos variables (en este caso _chunk_ y _encoding_) el resto es agregado. Algunas veces la agregación puede ser un problema, esto se puede resolver filtrando. Esto se puede hacer durante el benchmarking usando el parámetro `--set` (p. e.j `--set encoding=ascii`) o filtrando los resultados después de usar herramientas tales como `sed` o `grep`. En el caso `sed` asegúrese de mantener la primera línea ya que contiene la información de la cabecera.

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

### Ejecutar Pruebas de Rendimiento en el CI

Para ver el impacto en el rendimiento de una Pull Request al ejecutar pruebas de rendimiento en el CI, vea [Cómo: Ejecutar pruebas de rendimiento de núcleo en el CI Node.js](https://github.com/nodejs/benchmarking/blob/master/docs/core_benchmarks.md).

## Crear una prueba de rendimiento

### Conceptos básicos de una prueba de rendimiento

Todas las pruebas de rendimiento usan el módulo `require('../common.js')`. Este contiene el método `createBenchmark(main, configs[, options])`, el cual configurará la prueba de rendimiento.

Los argumentos de `createBenchmark` son:

* `main` {Function} La función de prueba de rendimiento, en donde el código que ejecuta las operaciones y controla los temporizadores debe ir
* `configs` {Object} Los parámetros de la prueba de rendimiento. `createBenchmark` ejecutará todas las posibles combinaciones de estos parámetros, a menos que se especifique lo contrario. Cada configuración es una propiedad con un array de posibles valores. Tenga en cuenta que los valores de la configuración sólo pueden ser strings o números.
* `options` {Object} Las opciones de la prueba de rendimiento. Por los momentos sólo se soporta la opción `flags` para especificar banderas de línea de comando.

`createBenchmark` devuelve un objeto `bench`, el cual es usado para cronometrar el tiempo de la prueba de rendimiento. Ejecute `bench.start()` después de la inicialización y `bench.end(n)` cuando la prueba de rendimiento esté hecha. `n` es el número de operaciones realizadas por la prueba de rendimiento.

El script de la prueba de rendimiento se ejecutará dos veces:

El primer pase configurará la prueba de rendimiento con la combinación de parámetros especificados en `configs`, y NO ejecutará la función `main`. En este pase, ninguna bandera es permitida excepto aquellas que se enviaron directamente por medio de comandos al ejecutar la prueba de rendimiento.

En el segundo pase, la función `main` será ejecutada, y el proceso será iniciado con:

* Las banderas pasadas a `createBenchmark` (el tercer argumento)
* Las banderas en el comando pasado cuando la prueba de rendimiento fue ejecutada

Tenga en cuenta que cualquier código fuera de la función `main` será ejecutado dos veces en procesos diferentes. Esto podría ser problemático si el código fuera de la función `main` tiene efectos secundarios. Por lo general, prefiera colocar el código dentro de la función `main` si es más que una declaración.

```js
'use strict';
const common = require('../common.js');
const { SlowBuffer } = require('buffer');

const configs = {
  // Número de operaciones, especificadas aquí para que así aparezcan en el reporte.
  // La mayoría de las pruebas de rendimiento solo usan un valor para todas las ejecuciones.
  n: [1024],
  type: ['fast', 'slow'],  // Configuraciones personalizadas
  size: [16, 128, 1024]  // Configuraciones personalizadas
};

const options = {
  // Añada --expose-internals para requerir módulos internos en main
  flags: ['--zero-fill-buffers']
};

// main y configs son requeridos, options es opcional.
const bench = common.createBenchmark(main, configs, options);

// Tenga en cuenta que cualquier código fuera de main será ejecutado dos veces,
// en procesos diferentes, con diferentes argumentos de línea de comando.

function main(conf) {
  // Solo estarán vigentes las banderas que han sido pasadas a createBenchmark
 // antes cuando se ejecuta main.
  // Para evaluar los módulos internos, solicítelos aquí. Por ejemplo:
  // const URL = require('internal/url').URL

  // Inicia el temporizador
  bench.start();

  // Realice operaciones aquí
  const BufferConstructor = conf.type === 'fast' ? Buffer : SlowBuffer;

  for (let i = 0; i < conf.n; i++) {
    new BufferConstructor(conf.size);
  }

  // Finaliza el temporizador, pasa en el número de operaciones
  bench.end(conf.n);
}
```

### Crear una prueba de rendimiento HTTP

El objeto `bench` devuelto por `createBenchmark` implementa el método `http(options, callback)`. Puede utilizarse para ejecutar la herramienta externa para hacer pruebas de rendimiento a servidores HTTP.

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

Las claves de opciones soportadas son:
* `port` - se predetermina a `common.PORT`
* `path` - se predetermina a `/`
* `connections` - número de conexiones concurrentes a utilizar, se predetermina a 100
* `duration` - la duración de la prueba de rendimiento en segundos, se determina a 10
* `benchmarker` - el benchmarker a utilizar, se predetermina a `common.default_http_benchmarker`
