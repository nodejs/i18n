# Debugger

<!--introduced_in=v0.9.12-->

> Estability: 2 - Estable

<!-- type=misc -->

Node.js includes an out-of-process debugging utility accessible via a [V8 Inspector](#debugger_v8_inspector_integration_for_node_js) and built-in debugging client. To use it, start Node.js with the `inspect` argument followed by the path to the script to debug; a prompt will be displayed indicating successful launch of the debugger:

```console
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   console.log('world');
debug>
```

El cliente depurador de Node.js no es un depurador completo, pero un simple paso y una inspección son posibles.

Insertar el extracto ` debugger; ` en el código fuente de un texto habilitará un punto de quiebre en esta posición en el código:
```js
// myscript.js
global.x = 5;
setTimeout(() => {
  debugger;
  console.log('world');
}, 1000);
console.log('hello');
```

Una vez que se ejecuta el depurador, un punto de quiebre se producirá en la línea 3:

```console
$ node inspect myscript.js
< Debugger listening on ws://127.0.0.1:9229/80e7a814-7cd3-49fb-921a-2e02228cd5ba
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in myscript.js:1
> 1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
  3   debugger;
debug> cont
< hello
break in myscript.js:3
  1 (function (exports, require, module, __filename, __dirname) { global.x = 5;
  2 setTimeout(() => {
> 3   debugger;
  4   console.log('world');
  5 }, 1000);
debug> next
break in myscript.js:4
  2 setTimeout(() => {
  3   debugger;
> 4   console.log('world');
  5 }, 1000);
  6 console.log('hello');
debug> repl
Press Ctrl + C to leave debug repl
> x
5
> 2 + 2
4
debug> next
< world
break in myscript.js:5
  3   debugger;
  4   console.log('world');
> 5 }, 1000);
  6 console.log('hello');
  7
debug> .exit
```

El comando `repl` permite que el código sea evaluado remotamente. El comando `next` pasa a la siguiente línea. Escriba <0 help</code> para ver qué otros comandos están disponibles.

Presionar ` enter` sin escribir un comando repetirá el comando depurador anterior.

## Monitores

Es posible observar expresiones y valores variables mientras se depura. En Cada punto de quiebre, cada expresión de la lista de observadores será evaluada en el contexto actual y mostrada inmediatamente antes de la fuente de lista de codigos del punto de quiebre.

Para comenzar a ver una expresión, escriba: `watch('my_expression')`. El comando `watchers` imprimirá los observadores activos. Para eliminar un monitor, escriba `unwatch('my_expression')`.

## Comando de referencia

### Avanzando

* `cont`, `c`: Continue execution
* `next`, `n`: Step next
* `step`, `s`: Step in
* `out`, `o`: Step out
* `pause`: Pause running code (like pause button in Developer Tools)

### Puntos de quiebre

* `setBreakpoint()`, `sb()`: Set breakpoint on current line
* `setBreakpoint(line)`, `sb(line)`: Set breakpoint on specific line
* `setBreakpoint('fn()')`, `sb(...)`: Set breakpoint on a first statement in functions body
* `setBreakpoint('script.js', 1)`, `sb(...)`: Set breakpoint on first line of `script.js`
* `clearBreakpoint('script.js', 1)`, `cb(...)`: Clear breakpoint in `script.js` on line 1

También es posible establecer un punto de quiebre en un archivo (módulo) que no está cargado todavía:

```console
$ node inspect main.js
< Debugger listening on ws://127.0.0.1:9229/4e3db158-9791-4274-8909-914f7facf3bd
< For help, see: https://nodejs.org/en/docs/inspector
< Debugger attached.
Break on start in main.js:1
> 1 (function (exports, require, module, __filename, __dirname) { const mod = require('./mod.js');
  2 mod.hello();
  3 mod.hello();
debug> setBreakpoint('mod.js', 22)
Warning: script 'mod.js' was not loaded yet.
debug> c
break in mod.js:22
 20 // USO U OTRO TRÁFICO EN EL SOFTWARE.
 21
>22 exports.hello = function() {
 23   return 'hello from module';
 24 };
debug>
```

### Información

* `backtrace`, `bt`: Print backtrace of current execution frame
* `list(5)`: List scripts source code with 5 line context (5 lines before and after)
* `watch(expr)`: Add expression to watch list
* `unwatch(expr)`: Remove expression from watch list
* `watchers`: List all watchers and their values (automatically listed on each breakpoint)
* `repl`: Open debugger's repl for evaluation in debugging script's context
* `exec expr`: Execute an expression in debugging script's context

### Control de ejecución

* `run`: Run script (automatically runs on debugger's start)
* `restart`: Restart script
* `kill`: Kill script

### Varios

* `scripts`: List all loaded scripts
* `version`: Display V8's version

## Uso avanzado

### V8 Integración del Inspector para Node.js

La integración del Inspector de V8 permite adjuntar Chrome DevTools a las instancias de Node.js para depurar y generar perfiles. It uses the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/).

El inspector de V8 Inspector se puede habilitar pasando la bandera `--inspect` al iniciar una aplicación Node.js. También es posible suministrar un puerto personalizado con esa bandera, p.ej. `--inspect=9222` aceptará conexiones de DevTools en el puerto 9222.

To break on the first line of the application code, pass the `--inspect-brk` flag instead of `--inspect`.

```console
$ node --inspect index.js
Debugger listening on 127.0.0.1:9229.
To start debugging, open the following URL in Chrome:
    chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=127.0.0.1:9229/dc9010dd-f8b8-4ac5-a510-c1a114ec7d29
```

(In the example above, the UUID dc9010dd-f8b8-4ac5-a510-c1a114ec7d29 at the end of the URL is generated on the fly, it varies in different debugging sessions.)

If the Chrome browser is older than 66.0.3345.0, use `inspector.html` instead of `js_app.html` in the above URL.

Chrome DevTools doesn't support debugging [Worker Threads](worker_threads.html) yet. [ndb](https://github.com/GoogleChromeLabs/ndb/) can be used to debug them.
