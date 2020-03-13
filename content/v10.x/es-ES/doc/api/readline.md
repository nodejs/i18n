# Readline

<!--introduced_in=v0.10.0-->

> Estability: 2 - Estable

El módulo `readline` proporciona una interfaz para la lectura de datos desde un stream [Legible](stream.html#stream_readable_streams) (tal como [`process.stdin`]), una línea a la vez. Se puede acceder a él utilizando:

```js
const readline = require('readline');
```

En el siguiente ejemplo se ilustra el uso básico del módulo `readline`.

```js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What do you think of Node.js? ', (answer) => {
  // TODO: Registre la respuesta en una base de datos
  console.log(`Thank you for your valuable feedback: ${answer}`);

  rl.close();
});
```

Una vez que se invoque este código, la aplicación Node.js no terminará hasta que la `readline.Interface` esté cerrada, ya que la interfaz espera a que los datos sean recibidos en el stream `input`.

## Clase: Interfaz
<!-- YAML
added: v0.1.104
-->

Las instancias de la clase `readline.Interface` se construyen utilizando el método `readline.createInterface()`. Cada instancia está asociada con un stream [Legible](stream.html#stream_readable_streams) de `input` sencillo y un stream [Escribible](stream.html#stream_writable_streams) de `output` sencillo. El stream de `output` se utiliza para imprimir prompts para el input ingresado por el usuario en, y que es leído desde, el stream de `input`.

### Evento: 'close'
<!-- YAML
added: v0.1.98
-->

El evento `close` se emite cuando ocurre uno de los siguientes casos:

* El método `rl.close()` es llamado y la instancia de `readline.Interface` ha renunciado al control sobre los streams de `input` y `output`;
* El stream de `input` recibe su evento `'end'`;
* El stream de `input` recibe `<ctrl>-D` para señalar el final de la transmisión (EOT, por sus siglas en inglés);
* El stream `input` recibe `<ctrl>-C` para señalar a `SIGINT` y no existen un oyente del evento `'SIGINT'` registrado en la instancia `readline.Interface`.

La función del listener es llamada sin pasar ningún argumento.

La instancia de `readline.Interface` se da por finalizada una vez que el evento `'close'` es emitido.

### Evento: 'line'
<!-- YAML
added: v0.1.98
-->

El evento `'line'` es emitido cuando el stream de `input` recibe una entrada de final de línea (`\n`, `\r`, o `\r\n`). Esto ocurre usualmente cuando el usuario presiona las teclas `<Enter>` o `<Return>`.

La función del listener es llamada con una string que contiene la línea única de la entrada recibida.

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### Evento: 'pause'
<!-- YAML
added: v0.7.5
-->

El evento `'pause'` es emitido cuando ocurre uno de los siguientes casos:

* El stream de `input` es pausado.
* El stream `input` está pausado y recibe el evento `'SIGCONT'`. (Vea los eventos [`'SIGTSTP'`][] y [`'SIGCONT'`][].)

La función del listener es llamada sin pasar ningún argumento.

```js
rl.on('pause', () => {
  console.log('Readline paused.');
});
```

### Evento: 'resume'
<!-- YAML
added: v0.7.5
-->

El evento `'resume'` es emitido cada vez que el stream `input` es resumido.

La función del listener es llamada sin pasar ningún argumento.

```js
rl.on('resume', () => {
  console.log('Readline resumed.');
});
```

### Evento: 'SIGCONT'
<!-- YAML
added: v0.7.5
-->

El evento `'SIGCONT'` es emitido cuando un proceso Node.js previamente movido al fondo utilizando `<ctrl>-Z` (es decir, `SIGTSTP`), luego es traído de vuelta al primer plano utilizando fg(1p).

Si el stream `input` fue pausado *antes* de la solicitud de `SIGTSTP`, este evento no será emitido.

La función oyente es invocada sin pasar ningún argumento.

```js
rl.on('SIGCONT', () => {
  // `prompt` resumirá automáticamente el stream
  rl.prompt();
});
```

El evento `'SIGCONT'` _no_ es soportado en Windows.

### Evento: 'SIGINT'
<!-- YAML
added: v0.3.0
-->

El evento `'SIGINT'` es emitido cada vez que el stream `input` recibe una entrada `<ctrl>-C`, conocida típicamente como `SIGINT`. Si no hay oyentes del evento `'SIGINT'` registrados al momento en el que el stream `input` reciba un `SIGINT`, el evento `'pause'` será emitido.

La función oyente es invocada sin pasar ningún argumento.

```js
rl.on('SIGINT', () => {
  rl.question('Are you sure you want to exit? ', (answer) => {
    if (answer.match(/^y(es)?$/i)) rl.pause();
  });
});
```

### Evento: 'SIGTSTP'
<!-- YAML
added: v0.7.5
-->

El evento `'SIGTSTP'` es emitido cuando el stream `input` recibe una entrada `<ctrl>-Z`, conocida típicamente como `SIGTSTP`. Si no hay oyentes del evento `'SIGTSTP'` registrados al momento en el que el stream `input` reciba un `SIGTSTP`, el proceso Node.js será enviado al segundo plano.

Cuando se resume el programa utilizando fg(1p), se emitirán los eventos `'pause'` y `'SIGCONT'`. Estos pueden ser usados para resumir el stream `input`.

Los eventos `'pause'` y `'SIGCONT'` no serán emitidos si el `input` fue pausado antes de que el proceso fuese enviado al segundo plano.

La función oyente es invocada sin pasar ningún argumento.

```js
rl.on('SIGTSTP', () => {
  // Esto reemplazará a SIGTSTP y prevendrá que el programa se vaya al
  // segundo plano.
  console.log('Caught SIGTSTP.');
});
```

El evento `'SIGTSTP'` _no_ es soportado en Windows.

### rl.close()
<!-- YAML
added: v0.1.98
-->

El método `rl.close()` cierra la instancia `readline.Interface` y renuncia al control sobre los streams `input` y `output`. Al llamarlo, el evento `'close'` será emitido.

Calling `rl.close()` does not immediately stop other events (including `'line'`) from being emitted by the `readline.Interface` instance.

### rl.pause()
<!-- YAML
added: v0.3.4
-->

El método `rl.pause()` pausa el stream `input`, permitiéndole ser resumido después si es necesario.

El llamar a `rl.pause()` no pausa inmediatamente otros eventos (incluyendo `'line'`) de ser emitidos por la instancia `readline.Interface`.

### rl.prompt([preserveCursor])
<!-- YAML
added: v0.1.98
-->

* `preserveCursor` {boolean} Si es `true`, evita que la colocación del cursor sea restablecida a `0`.

El método `rl.prompt()` escribe el `prompt` configurado de las instancias de `readline.Interface` en una nueva línea en el `output`, para proporcionar a un usuario una nueva ubicación en la cual suministrar el input.

Al llamarlo, `rl.prompt()` resumirá el stream `input` si ha sido pausado.

Si la `readline.Interface` fue creada con `output` establecido a `null` o `undefined`, el aviso no se escribe.

### rl.question(query, callback)
<!-- YAML
added: v0.3.3
-->

* `query` {string} Una declaración o consulta a escribir al `output`, antepuesta al prompt.
* `callback` {Function} Una función callback que es invocada con el input del usuario en respuesta a la `query`.

El método `rl.question()` muestra la `query` escribiéndola en el `output`. Espera que se proporcione la entrada del usuario en `input` y luego invoca la función `callback`, pasando la entrada proporcionada como el primer argumento.

Al llamarlo, `rl.question()` resumirá el stream `input` si ha sido pausado.

Si la `readline.Interface` fue creada con `output` establecido a `null` o `undefined`, no se escribe la `query`.

Ejemplo de uso:

```js
rl.question('What is your favorite food? ', (answer) => {
  console.log(`Oh, so your favorite food is ${answer}`);
});
```

La función `callback` pasada a `rl.question()` no sigue el patrón típico de aceptación de un objeto `Error` o `null` como el primer argumento. El `callback` es llamado con la respuesta proporcionada como el primer argumento.

### rl.resume()
<!-- YAML
added: v0.3.4
-->

El método `rl.resume()` resume el stream `input` si ha sido pausado.

### rl.setPrompt(prompt)
<!-- YAML
added: v0.1.98
-->

* `prompt` {string}

El método `rl.setPrompt()` establece el aviso que será escrito en `output` cada vez que `rl.prompt()` es llamado.

### rl.write(data[, key])
<!-- YAML
added: v0.1.98
-->

* `data` {string}
* `key` {Object}
  * `ctrl` {boolean} `true` para señalar la tecla `<ctrl>`.
  * `meta` {boolean} `true` para señalar la tecla `<Meta>`.
  * `shift` {boolean} `true` para señalar la tecla `<Shift>`.
  * `name` {string} El nombre de una tecla.

El método `rl.write()` escribirá los `data` o la secuencia de teclas identificada por `key` al `output`. El argumento `key` es soportado sólo si `output` es un terminal de texto [TTY](tty.html).

Si se especifica la `key`, `data` es ignorada.

Al llamarlo, `rl.write()` resumirá el stream `input` si ha sido pausado.

Si la `readline.Interface` fue creada con `output` establecido a `null` o `undefined`, no se escriben los `data` y la `key`.

```js
rl.write('Delete this!');
// Simula Ctrl+u para eliminar la línea escrita previamente
rl.write(null, { ctrl: true, name: 'u' });
```

El método `rl.write()` escribirá los datos en la `input` de la `Interface` del `readline` *como si fuera proporcionado por el usuario*.

### rl\[Symbol.asyncIterator\]()
<!-- YAML
added: v10.16.0
-->

> Estabilidad: 1 - Experimental

* Devuelve: {AsyncIterator}

Create an `AsyncIterator` object that iterates through each line in the input stream as a string. This method allows asynchronous iteration of `readline.Interface` objects through `for`-`await`-`of` loops.

Errors in the input stream are not forwarded.

If the loop is terminated with `break`, `throw`, or `return`, [`rl.close()`][] will be called. In other words, iterating over a `readline.Interface` will always consume the input stream fully.

A caveat with using this experimental API is that the performance is currently not on par with the traditional `'line'` event API, and thus it is not recommended for performance-sensitive applications. We expect this situation to improve in the future.

```js
async function processLineByLine() {
  const rl = readline.createInterface({
    // ...
  });

  for await (const line of rl) {
    // Each line in the readline input will be successively available here as
    // `line`.
  }
}
```

## readline.clearLine(stream, dir)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dir` {number}
  * `-1` - a la izquierda del cursor
  * `1` - a la derecha del cursor
  * `0` - toda la línea

El método `readline.clearLine()` borra la línea actual del stream [TTY](tty.html) dado en una dirección específica identificada por `dir`.

## readline.clearScreenDown(stream)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}

El método `readline.clearScreenDown()` borra el stream [TTY](tty.html) dado de la posición actual del cursor hacia abajo.

## readline.createInterface(options)
<!-- YAML
added: v0.1.98
changes:
  - version: v8.3.0, 6.11.4
    pr-url: https://github.com/nodejs/node/pull/13497
    description: Remove max limit of `crlfDelay` option.
  - version: v6.6.0
    pr-url: https://github.com/nodejs/node/pull/8109
    description: The `crlfDelay` option is supported now.
  - version: v6.3.0
    pr-url: https://github.com/nodejs/node/pull/7125
    description: The `prompt` option is supported now.
  - version: v6.0.0
    pr-url: https://github.com/nodejs/node/pull/6352
    description: The `historySize` option can be `0` now.
-->

* `opciones` {Object}
  * `input` {stream.Readable} El stream [Legible](stream.html#stream_readable_streams) al cual escuchar. Esta opción es *requerida*.
  * `output` {stream.Writable} El stream [Escribible](stream.html#stream_writable_streams) al cual escribir lo datos del readline.
  * `completer` {Function} Una función opcional utilizada para el auto-completado de Tab.
  * `terminal` {boolean} `true` si los streams de `input` y `output` deben ser tratados como un TTY, y deben escribirse códigos de escape ANSI/VT100 en ellos. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} Número máximo de líneas de historia retenidas. Para deshabilitar el historial, establezca este valor en `0`. Esta opción tiene sentido sólo si el `terminal` es establecido a `true`por el usuario o por una verificación interna de `output`. De lo contrario, el mecanismo de caché del historial no se inicializa en absoluto. **Predeterminado:** `30`.
  * `prompt` {string} La string aviso a utilizar. **Predeterminado:** `'> '`.
  * `crlfDelay` {number} Si el retraso entre `\r` y `\n` excede los `crlfDelay` milisegundos, tanto `\r` como `\n` serán tratados como entradas de fin de línea separadas. `crlfDelay` será coaccionado a un número no menor a `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Predeterminado:** `100`.
  * `removeHistoryDuplicates` {boolean} Si es `true`, cuando se añada una nueva línea de entrada a la lista del historial, duplicando una anterior, la más vieja de las dos será removida de la lista. **Predeterminado:** `false`.
  * `escapeCodeTimeout` {number} The duration `readline` will wait for a character (when reading an ambiguous key sequence in milliseconds one that can both form a complete key sequence using the input read so far and can take additional input to complete a longer key sequence). **Default:** `500`.

El método `readline.createInterface()` crea una nueva instancia de `readline.Interface`.

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
```

Una vez que la instancia `readline.Interface` es creada, el caso más común es escuchar el evento ``'line'</0:</p>

<pre><code class="js">rl.on('line', (line) => {
  console.log(`Received: ${line}`);
});
``</pre>

Si el `terminal` es `true` para esta instancia, entonces el stream `output` tendrá la mejor compatibilidad si define una propiedad `output.columns` y emite un evento `'resize'` en el `output` si la columna llega a cambiar ([`process.stdout`][] hace esto automáticamente cuando es un TTY).

### Uso de la Función `completer` (completado)

La función `completer` toma la línea actual ingresada por el usuario como un argumento, y devuelve un `Array` con 2 entradas:

* Un `Array` con entradas que coincidan para la terminación.
* La substring que fue utilizada para la coincidencia.

Por ejemplo: `[[substr1, substr2, ...], originalsubstring]`.

```js
function completer(line) {
  const completions = '.help .error .exit .quit .q'.split(' ');
  const hits = completions.filter((c) => c.startsWith(line));
  // mostrar todas las finalizaciones si no se encuentra ninguna
  return [hits.length ? hits : completions, line];
}
```

La función `completer` puede ser llamada asincrónicamente si acepta dos argumentos:

```js
function completer(linePartial, callback) {
  callback(null, [['123'], linePartial]);
}
```

## readline.cursorTo(stream, x, y)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `x` {number}
* `y` {number}

El método `readline.cursorTo()` mueve el cursor a una posición especificada en un `stream` [TTY](tty.html) dado.

## readline.emitKeypressEvents(stream[, interface])
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Readable}
* `interface` {readline.Interface}

El método `readline.emitKeypressEvents()` causa que el stream [Legible](stream.html#stream_readable_streams) dado inicie emitiendo los eventos `'keypress'` correspondientes a la entrada recibida.

Opcionalmente, `interface` especifica una instancia de `readline.Interface` para la cual el auto-completado se deshabilita cuando se detecta una entrada copy-paste.

Si el `stream` es un [TTY](tty.html), entonces debe estar en modo raw.

Esto es llamado automáticamente por cualquier instancia de readline en su `input` si el `input` es un terminal. El cerrar la instancia `readline` no detiene a la `input` de emitir eventos `'keypress'`.

```js
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY)
  process.stdin.setRawMode(true);
```

## readline.moveCursor(stream, dx, dy)
<!-- YAML
added: v0.7.7
-->

* `stream` {stream.Writable}
* `dx` {number}
* `dy` {number}

El método `readline.moveCursor()` mueve el cursor *con relación* a su posición actual en un `stream` [TTY](tty.html) dado.

## Ejemplo: CLI Pequeña

El siguiente ejemplo ilustra el uso de la clase `readline.Interface` para implementar una pequeña interfaz de línea de comando:

```js
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'OHAI> '
});

rl.prompt();

rl.on('line', (line) => {
  switch (line.trim()) {
    case 'hello':
      console.log('world!');
      break;
    default:
      console.log(`Say what? I might have heard '${line.trim()}'`);
      break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
```

## Ejemplo: Leer el Stream de Archivos Línea por Línea

A common use case for `readline` is to consume an input file one line at a time. The easiest way to do so is leveraging the [`fs.ReadStream`][] API as well as a `for`-`await`-`of` loop:

```js
const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('input.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    console.log(`Line from file: ${line}`);
  }
}

processLineByLine();
```

Alternatively, one could use the [`'line'`][] event:

```js
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`Line from file: ${line}`);
});
```

Currently, `for`-`await`-`of` loop can be a bit slower. If `async` / `await` flow and speed are both essential, a mixed approach can be applied:

```js
const { once } = require('events');
const { createReadStream } = require('fs');
const { createInterface } = require('readline');

(async function processLineByLine() {
  try {
    const rl = createInterface({
      input: createReadStream('big-file.txt'),
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      // Process the line.
    });

    await once(rl, 'close');

    console.log('File processed.');
  } catch (err) {
    console.error(err);
  }
})();
```
