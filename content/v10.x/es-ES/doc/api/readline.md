# Readline

<!--introduced_in=v0.10.0-->

> Estabilidad: 2 - Estable

El módulo `readline` proporciona una interfaz para leer datos de un stream [Legible](stream.html#stream_readable_streams) (como [`process.stdin`]), una línea a la vez. Puede ser accedido utilizando:

```js
const readline = require('readline');
```

El siguiente ejemplo simple ilustra el uso básico del módulo `readline`.

```js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('What do you think of Node.js? ', (answer) => {
  // TODO: Registrar la respuesta en una base de datos
  console.log(`Thank you for your valuable feedback: ${answer}`);

  rl.close();
});
```

Una vez que se invoque este código, la aplicación Node.js no terminará hasta que la `readline.Interface` esté cerrada, ya que la interfaz espera a que los datos sean recibidos en el stream `input`.

## Clase: Interface

<!-- YAML
added: v0.1.104
-->

Las instancias de la clase `readline.Interface` se construyen utilizando el método `readline.createInterface()`. Cada instancia está asociada con un stream [Legible](stream.html#stream_readable_streams) `input` sencillo y con un stream [Escribible](stream.html#stream_writable_streams) `output` sencillo. The `output` stream is used to print prompts for user input that arrives on, and is read from, the `input` stream.

### Evento: 'close' (cerrar)

<!-- YAML
added: v0.1.98
-->

El evento `'close'` es emitido cuando ocurre uno de los siguientes casos:

* Se llama al método `rl.close()` y la instancia `readline.Interface` ha renunciado al control sobre los streams `input` y `output`;
* El stream `input` recibe su evento `'end'`;
* El stream `input` recibe `<ctrl>-D` para señalar el final de la transmisión (por sus siglas en inglés, EOT);
* El stream `input` recibe `<ctrl>-C` para señalar a `SIGINT` y no existen un oyente del evento `'SIGINT'` registrado en la instancia `readline.Interface`.

La función oyente es llamada sin pasar ningún argumento.

La instancia `readline.Interface` es finalizada una vez que el evento `'close'` es emitido.

### Evento: 'line'

<!-- YAML
added: v0.1.98
-->

El evento `'line'` es emitido cada vez que el stream `input` recibe una entrada de final de línea (`\n`, `\r` o `\r\n`). Esto usualmente ocurre cuando el usuario presiona las teclas `<Enter>` o `<Return>`.

La función oyente es llamada con una string que contiene la línea simple de la entrada recibida.

```js
rl.on('line', (input) => {
  console.log(`Received: ${input}`);
});
```

### Evento: 'pause' (pausa)

<!-- YAML
added: v0.7.5
-->

El evento `'pause'` es emitido cuando ocurre uno de los siguientes casos:

* Se pasa el stream `input`.
* El stream `input` está pausado y recibe el evento `'SIGCONT'`. (Vea los eventos [`'SIGTSTP'`][] y [`'SIGCONT'`][].)

La función oyente es llamada sin pasar ningún argumento.

```js
rl.on('pause', () => {
  console.log('Readline paused.');
});
```

### Evento: 'resume' (resumir)

<!-- YAML
added: v0.7.5
-->

El evento `'resume'` es emitido cada vez que el stream `input` es resumido.

La función oyente es llamada sin pasar ningún argumento.

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

El evento `'SIGCONT'` *no* es soportado en Windows.

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

### Evento: 'SIGSTP'

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

El evento `'SIGTSTP'` *no* es soportado en Windows.

### rl.close()

<!-- YAML
added: v0.1.98
-->

El método `rl.close()` cierra la instancia `readline.Interface` y renuncia al control sobre los streams `input` y `output`. Al llamarlo, el evento `'close'` será emitido.

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

* `preserveCursor` {boolean} Si es `true`, previene que la colocación del cursor se restablezca a `0`.

The `rl.prompt()` method writes the `readline.Interface` instances configured `prompt` to a new line in `output` in order to provide a user with a new location at which to provide input.

Al llamarlo, `rl.prompt()` resumirá el stream `input` si ha sido pausado.

Si la `readline.Interface` fue creada con `output` establecido a `null` o `undefined`, el aviso no se escribe.

### rl.question(query, callback)

<!-- YAML
added: v0.3.3
-->

* `query` {string} Una declaración o consulta a escribir en `output`, antepuesto al aviso.
* `callback` {Function} Una función callback que es invocada con la entrada del usuario en respuesta a la `query`.

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
  * `ctrl` {boolean} `true` para indicar la tecla `<ctrl>`.
  * `meta` {boolean} `true` para indicar la tecla `<Meta>`.
  * `shift` {boolean} `true` para indicar la tecla `<Shift>`.
  * `name` {string} El nombre de la tecla.

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

* `options` {Object} 
  * `input` {stream.Readable} El stream [Legible](stream.html#stream_readable_streams) a escuchar. Esta opción es *requerida*.
  * `output` {stream.Writable} El stream [Escribible](stream.html#stream_writable_streams) al cual escribir lo datos del readline.
  * `completer` {Function} An optional function used for Tab autocompletion.
  * `terminal` {boolean} `true` si los streams `input` y `output` deberían ser tratados como un TTY, y deberían tener códigos de escape ANSI/VT100 escritos. **Default:** checking `isTTY` on the `output` stream upon instantiation.
  * `historySize` {number} Número máximo de líneas de historia retenidas. Para inhabilitar la historia, establezca este valor a `0`. Esta opción tiene sentido sólo si el `terminal` es establecido a `true`por el usuario o por una verificación interna de `output`. De lo contrario, el mecanismo de caché del historial no se inicializa en absoluto. **Predeterminado:** `30`.
  * `prompt` {string} La string aviso a utilizar. **Predeterminado:** `'> '`.
  * `crlfDelay` {number) Si el retraso entre `\r` y `\n` excede de `crlfDelay` milisegundos, `\r` y `\n` serán tratados como entradas de fin de línea separadas. `crlfDelay` será coaccionado a un número no menor a `100`. It can be set to `Infinity`, in which case `\r` followed by `\n` will always be considered a single newline (which may be reasonable for [reading files](#readline_example_read_file_stream_line_by_line) with `\r\n` line delimiter). **Predeterminado:** `100`.
  * `removeHistoryDuplicates` {boolean} Si es `true`, cuando una nueva línea de entrada añadida a la lista de historia duplica una más vieja, esto remueve la línea más vieja de la lista. **Predeterminado:** `false`.

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

### Uso de la Función `completer`

La función `completer` toma la línea actual ingresada por el usuario como un argumento, y devuelve un `Array` con 2 entradas:

* Un `Array` con entradas que coincidan para la terminación.
* La substring que fue usada para la coincidencia.

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

Optionally, `interface` specifies a `readline.Interface` instance for which autocompletion is disabled when copy-pasted input is detected.

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

The `readline.moveCursor()` method moves the cursor *relative* to its current position in a given [TTY](tty.html) `stream`.

## Ejemplo: Tiny CLI

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

## Ejemplo: Leer El Stream del Archivo Línea por Línea

Un caso de uso común para `readline` es para consumir entradas de un stream [Legible](stream.html#stream_readable_streams) del filesystem una línea a la vez, como se ilustra en el siguiente ejemplo:

```js
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: fs.createReadStream('sample.txt'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  console.log(`Line from file: ${line}`);
});
```